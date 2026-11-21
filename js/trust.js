/* One public snapshot drives both the gateway and the community chapter. */
(function () {
    'use strict';

    const metrics = [
        ['production_releases', 'statsCycles'],
        ['screenshot_reports', 'statsShot'],
        ['checkins_30d', 'statsCheckins'],
        ['bug_reports', 'statsBugs'],
        ['ideas', 'statsIdeas']
    ];
    const countFields = [...metrics.map(([field]) => field), 'countries', 'active_testers', 'total_testers'];
    const maxAge = 10 * 60 * 1000;
    const isCount = value => Number.isSafeInteger(value) && value >= 0;
    function isSnapshot(payload) {
        const m = payload?.metrics;
        if (payload?.status !== 'success' || typeof payload.updated_at !== 'string'
            || !Number.isFinite(Date.parse(payload.updated_at)) || !m
            || !countFields.every(field => isCount(m[field]))) return false;
        if (m.active_testers > m.total_testers) return false;
        return m.top_countries === undefined || (Array.isArray(m.top_countries) &&
            m.top_countries.every(row => row && /^[A-Z]{2}$/.test(row.code) &&
                isCount(row.total) && isCount(row.active) && row.active <= row.total &&
                Number.isFinite(row.share_pct) && row.share_pct >= 0 && row.share_pct <= 100));
    }

    const chapter = document.getElementById('trust');
    if (!chapter) return;
    const find = selector => document.querySelector(selector);
    const t = key => SiteI18n.t(key);
    const strip = find('[data-stats-strip]');
    const scale = find('[data-community-scale]');
    const table = chapter.querySelector('.stats-countries');
    const retry = chapter.querySelector('[data-stats-retry]');
    let snapshot;
    let lastAttempt = 0;
    let loading = false;
    let failed = false;
    let timer;

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

    function fillStrip(m, number) {
        if (!strip) return;
        const items = metrics.map(([field, key]) => {
            const item = node('span', undefined, 'stats-mini');
            const value = node('strong', number.format(m[field]));
            value.translate = false;
            item.append(value, node('span', t(key)));
            return item;
        });
        strip.replaceChildren(...items);
    }

    function fillCountries(countries, number, locale) {
        const names = typeof Intl.DisplayNames === 'function' ?
            new Intl.DisplayNames([locale], {type:'region'}) : null;
        const pct = new Intl.NumberFormat(locale, {style:'percent', maximumFractionDigits:1});
        const maxTotal = Math.max(1, ...countries.map(row => row.total));
        const rows = countries.map(row => {
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
            if (scale) scale.textContent = t('statsScaleFallback');
            return;
        }
        const m = snapshot.metrics;
        const locale = document.documentElement.lang || 'en';
        const number = new Intl.NumberFormat(locale);
        chapter.querySelectorAll('[data-count]').forEach(el => {
            el.textContent = number.format(m[el.dataset.count]);
        });
        if (scale) scale.textContent = localizedScale(m, number);
        const stamp = find('[data-stats-time]');
        stamp.dateTime = snapshot.updated_at;
        stamp.textContent = new Intl.DateTimeFormat(locale, {
            dateStyle:'medium', timeStyle:'short', timeZone:'UTC'
        }).format(Date.parse(snapshot.updated_at)) + ' UTC';
        fillStrip(m, number);
        fillCountries((m.top_countries || []).slice(0, 5), number, locale);
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
    function onReturn() { if (relevant()) refresh(); }
    window.addEventListener('hashchange', onReturn);
    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('language-changed', render);
    refresh();
})();
