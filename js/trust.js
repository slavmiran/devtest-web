/* One public snapshot drives both the gateway and the community chapter. */
(function () {
    'use strict';

    const metrics = [
        ['production_releases', 'statsCycles', 'statsRibbonCycles'],
        ['screenshots_count', 'statsShot', 'statsRibbonShots'],
        ['checkins_30d', 'statsCheckins', 'statsRibbonCheckins'],
        ['bug_reports', 'statsBugs', 'statsRibbonBugs'],
        ['ideas', 'statsIdeas', 'statsRibbonIdeas']
    ];
    const requiredCounts = ['production_releases', 'checkins_30d', 'bug_reports', 'ideas',
        'countries', 'active_testers', 'total_testers'];
    const maxAge = 10 * 60 * 1000;
    const isCount = value => Number.isSafeInteger(value) && value >= 0;

    function isCountryRow(row) {
        return row && /^[A-Z]{2}$/.test(row.code) &&
            isCount(row.total) && isCount(row.active) && row.active <= row.total &&
            Number.isFinite(row.share_pct) && row.share_pct >= 0 && row.share_pct <= 100;
    }

    function isSprint(sprint) {
        if (sprint === null) return true;
        if (!sprint || typeof sprint !== 'object') return false;
        if (!isCount(sprint.prize_pool_bust) || !isCount(sprint.participants_count)) return false;
        if (typeof sprint.started_at !== 'string' || typeof sprint.ended_at !== 'string') return false;
        if (!Number.isFinite(Date.parse(sprint.started_at)) || !Number.isFinite(Date.parse(sprint.ended_at))) return false;
        if (sprint.winners !== undefined && (!Array.isArray(sprint.winners) ||
            !sprint.winners.every(w => w && isCount(w.rank) && isCount(w.points) && isCount(w.prize_bust) &&
                typeof w.display_name === 'string' && w.display_name.trim()))) return false;
        return true;
    }

    function isSnapshot(payload) {
        const m = payload?.metrics;
        if (payload?.status !== 'success' || typeof payload.updated_at !== 'string'
            || !Number.isFinite(Date.parse(payload.updated_at)) || !m
            || !requiredCounts.every(field => isCount(m[field]))) return false;
        if (!(isCount(m.screenshots_count) || isCount(m.screenshot_reports))) return false;
        if (m.active_testers > m.total_testers) return false;
        if (m.top_countries !== undefined && !(Array.isArray(m.top_countries) && m.top_countries.every(isCountryRow))) return false;
        if (m.all_countries !== undefined && !(Array.isArray(m.all_countries) && m.all_countries.every(isCountryRow))) return false;
        if (payload.last_completed_sprint !== undefined && !isSprint(payload.last_completed_sprint)) return false;
        return true;
    }

    function shotCount(m) {
        return isCount(m.screenshots_count) ? m.screenshots_count : m.screenshot_reports;
    }

    const chapter = document.getElementById('trust');
    if (!chapter) return;
    const find = selector => document.querySelector(selector);
    const t = key => SiteI18n.t(key);
    const strip = find('[data-stats-strip]');
    const scale = find('[data-community-scale]');
    const table = chapter.querySelector('.stats-countries');
    const retry = chapter.querySelector('[data-stats-retry]');
    const geoToggle = chapter.querySelector('[data-stats-geo-toggle]');
    const sprintBlock = document.getElementById('stats-sprint');
    let snapshot;
    let lastAttempt = 0;
    let loading = false;
    let failed = false;
    let timer;
    let geoExpanded = false;

    function node(tag, value, className) {
        const el = document.createElement(tag);
        if (value !== undefined) el.textContent = value;
        if (className) el.className = className;
        return el;
    }

    function localizedScale(m, number) {
        if (SiteI18n.language === 'ru') {
            const plural = new Intl.PluralRules('ru');
            const noun = (n, one, few, many) => ({one, few, many}[plural.select(n)] || many);
            return number.format(m.countries) + ' ' + noun(m.countries, 'страна', 'страны', 'стран') + ' · ' +
                number.format(m.total_testers) + ' ' + noun(m.total_testers, 'участник', 'участника', 'участников');
        }
        const en = new Intl.PluralRules('en');
        return number.format(m.countries) + (en.select(m.countries) === 'one' ? ' country' : ' countries') + ' · ' +
            number.format(m.total_testers) + (en.select(m.total_testers) === 'one' ? ' participant' : ' participants');
    }

    function metricValue(m, field) {
        return field === 'screenshots_count' ? shotCount(m) : m[field];
    }

    function fillStrip(m, number) {
        if (!strip) return;
        const items = metrics.map(([field, , ribbon]) => {
            const item = node('span', undefined, 'stats-mini');
            const value = node('strong', number.format(metricValue(m, field)));
            value.translate = false;
            item.append(value, node('span', t(ribbon)));
            return item;
        });
        strip.replaceChildren(...items);
    }

    function countrySource(m) {
        if (Array.isArray(m.all_countries) && m.all_countries.length) return m.all_countries;
        return m.top_countries || [];
    }

    function fillCountries(m, number, locale) {
        const all = countrySource(m);
        const visible = geoExpanded ? all : all.slice(0, 5);
        const names = typeof Intl.DisplayNames === 'function' ?
            new Intl.DisplayNames([locale], {type:'region'}) : null;
        const pct = new Intl.NumberFormat(locale, {style:'percent', maximumFractionDigits:1});
        const maxTotal = Math.max(1, ...visible.map(row => row.total));
        const rows = visible.map(row => {
            const tr = node('tr');
            const country = node('th', names?.of(row.code) || row.code);
            country.scope = 'row';
            const counts = node('td', undefined, 'stats-breakdown');
            const graph = node('span', undefined, 'stats-track');
            graph.setAttribute('aria-hidden', 'true');
            const population = node('span', undefined, 'stats-bar');
            const active = node('span');
            population.style.width = 100 * row.total / maxTotal + '%';
            active.style.width = (row.total ? 100 * row.active / row.total : 0) + '%';
            population.append(active);
            graph.append(population);
            const value = node('span', number.format(row.active) + ' / ' + number.format(row.total));
            value.translate = false;
            const group = node('span', undefined, 'stats-breakdown-inner');
            group.append(graph, value);
            counts.append(group);
            const share = node('td', pct.format(row.share_pct / 100));
            share.translate = false;
            tr.append(country, counts, share);
            return tr;
        });
        table.tBodies[0].replaceChildren(...rows);
        table.hidden = !rows.length;
        find('[data-stats-no-countries]').hidden = Boolean(rows.length);
        if (geoToggle) {
            const showToggle = all.length > 5;
            geoToggle.hidden = !showToggle;
            geoToggle.setAttribute('aria-expanded', geoExpanded ? 'true' : 'false');
            if (showToggle) {
                geoToggle.textContent = geoExpanded
                    ? t('statsGeoCollapse')
                    : t('statsGeoExpand').replace('{N}', String(all.length));
            }
        }
    }

    function fillSprint(sprint, number, locale) {
        if (!sprintBlock) return;
        if (!sprint) {
            sprintBlock.hidden = true;
            return;
        }
        const date = new Intl.DateTimeFormat(locale, {dateStyle:'medium', timeZone:'UTC'});
        const start = date.format(Date.parse(sprint.started_at));
        const end = date.format(Date.parse(sprint.ended_at));
        const season = sprint.season_number != null ? String(sprint.season_number) : '';
        const name = season
            ? t('statsSprintName').replace('{n}', season) + ' · ' + start + ' – ' + end
            : start + ' – ' + end;
        find('[data-sprint-name]').textContent = name;
        find('[data-sprint-pool]').textContent = t('statsSprintPool').replace('{amount}', number.format(sprint.prize_pool_bust));
        const winners = Array.isArray(sprint.winners) ? sprint.winners : [];
        const body = sprintBlock.querySelector('[data-sprint-winners]');
        body.replaceChildren(...winners.map(w => {
            const tr = node('tr');
            const rank = node('td', String(w.rank));
            rank.translate = false;
            const who = node('td', w.display_name);
            who.translate = false;
            const pts = node('td', number.format(w.points));
            pts.translate = false;
            const prize = node('td', number.format(w.prize_bust));
            prize.translate = false;
            tr.append(rank, who, pts, prize);
            return tr;
        }));
        sprintBlock.hidden = false;
    }

    function render() {
        const visible = Boolean(snapshot);
        find('#stats-overview').hidden = !visible;
        find('#stats-geo').hidden = !visible;
        find('#stats-status').hidden = visible;
        find('[data-stats-status-text]').textContent = t(failed ? 'statsUnavailable' : 'statsLoading');
        retry.hidden = !failed;
        retry.disabled = loading;
        if (strip) {
            strip.hidden = !visible;
            find('[data-stats-link]').hidden = visible;
        }
        if (!visible) {
            if (scale) {
                scale.hidden = true;
                scale.textContent = '';
            }
            if (sprintBlock) sprintBlock.hidden = true;
            if (geoToggle) geoToggle.hidden = true;
            return;
        }
        const m = snapshot.metrics;
        const locale = document.documentElement.lang || 'en';
        const number = new Intl.NumberFormat(locale);
        chapter.querySelectorAll('[data-count]').forEach(el => {
            const field = el.dataset.count;
            el.textContent = number.format(metricValue(m, field));
        });
        if (scale) {
            scale.hidden = false;
            scale.textContent = localizedScale(m, number);
        }
        const stamp = find('[data-stats-time]');
        stamp.dateTime = snapshot.updated_at;
        stamp.textContent = new Intl.DateTimeFormat(locale, {
            dateStyle:'medium', timeStyle:'short', timeZone:'UTC'
        }).format(Date.parse(snapshot.updated_at)) + ' UTC';
        fillStrip(m, number);
        fillCountries(m, number, locale);
        fillSprint(snapshot.last_completed_sprint ?? null, number, locale);
    }

    function relevant() {
        return !document.hidden && ['', '#top', '#trust'].includes(location.hash);
    }
    async function refresh(force = false) {
        if (loading || (!force && Date.now() - lastAttempt < (failed ? 5000 : maxAge))) return;
        loading = true;
        lastAttempt = Date.now();
        retry.disabled = true;
        clearTimeout(timer);
        try {
            const payload = await SiteAPI.call('/web/trust-stats', {auth:false});
            if (!isSnapshot(payload)) throw new Error('invalid_trust_snapshot');
            snapshot = payload;
            failed = false;
        } catch (_) {
            snapshot = null;
            failed = true;
        } finally {
            loading = false;
            render();
            timer = setTimeout(() => { if (relevant()) refresh(); }, maxAge);
        }
    }
    retry.addEventListener('click', () => refresh(true));
    if (geoToggle) {
        geoToggle.addEventListener('click', () => {
            geoExpanded = !geoExpanded;
            if (snapshot) {
                const locale = document.documentElement.lang || 'en';
                fillCountries(snapshot.metrics, new Intl.NumberFormat(locale), locale);
            }
        });
    }
    function onReturn() { if (relevant()) refresh(); }
    window.addEventListener('hashchange', onReturn);
    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('language-changed', render);
    refresh();
})();
