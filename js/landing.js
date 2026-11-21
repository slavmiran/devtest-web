/* Only the active chapter participates in layout. Drawers keep the underlying chapter. */
(function () {
    'use strict';
    const main = document.getElementById('main');
    const pages = new Map([...main.querySelectorAll(':scope > [data-view]')].map(el => [el.id, el]));
    const aliases = new Map([['private', 'services'], ['community/published', 'community/growth']]);
    const homeTitle = document.title;
    let current;
    function title() {
        document.title = current.id === 'top' ? homeTitle : current.querySelector('h1').textContent + ' · DevTestHub';
    }
    function navigate() {
        let hash = location.hash.slice(1);
        if (aliases.has(hash)) {
            hash = aliases.get(hash);
            history.replaceState(null, '', location.pathname + location.search + '#' + hash);
        }
        if (current && ['account', 'order', 'language', 'guide', 'main'].includes(hash)) return;
        const next = pages.get(hash) || pages.get('top');
        if (current === next) return;
        const wasOpen = Boolean(current);
        current?.removeAttribute('data-current');
        next.setAttribute('data-current', '');
        main.setAttribute('data-ready', '');
        current = next;
        document.querySelectorAll('.desktop-nav a').forEach(link => {
            const parent = current.id === 'build' ? 'community' : current.id.split('/')[0];
            if (link.hash === '#' + parent) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
        title();
        if (wasOpen) {
            const heading = next.querySelector('h1');
            heading.tabIndex = -1;
            heading.focus({preventScroll: true});
        }
        window.scrollTo({top: 0, behavior: 'instant'});
    }
    navigate();
    window.addEventListener('hashchange', navigate);
    window.addEventListener('language-changed', title);
})();

(function () {
    'use strict';
    var box = document.getElementById('community-ack');
    var actions = document.getElementById('community-actions');
    var wait = document.getElementById('community-wait');
    if (!box || !actions || !wait) return;
    var key = 'dth.community.ack.v3';
    function stored() {
        try { return localStorage.getItem(key) === '1'; }
        catch (_) { return false; }
    }
    function paint(open) {
        box.checked = open;
        actions.hidden = !open;
        wait.hidden = open;
    }
    paint(stored());
    box.addEventListener('change', function () {
        var open = box.checked;
        try {
            if (open) localStorage.setItem(key, '1');
            else localStorage.removeItem(key);
        } catch (_) {}
        paint(open);
        if (open) {
            var first = actions.querySelector('a');
            if (first) first.focus();
        }
    });
})();
