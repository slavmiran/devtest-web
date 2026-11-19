/* One modal surface at a time: hash navigation, focus trap and return focus. */
(function () {
    'use strict';
    const page = document.getElementById('page-shell');
    const backdrop = document.getElementById('drawer-backdrop');
    const panels = [...document.querySelectorAll('[data-drawer-panel]')];
    const names = panels.map(panel => panel.dataset.drawerPanel);
    let active = null;
    let returnFocus = null;
    let previousHash = '';
    let closeTimer;
    function setExpanded() {
        document.querySelectorAll('[data-open-drawer]').forEach(button => {
            button.setAttribute('aria-expanded', String(button.dataset.openDrawer === active));
            button.setAttribute('aria-controls', button.dataset.openDrawer);
        });
    }
    function open(name, {hash = true} = {}) {
        if (!names.includes(name)) return;
        clearTimeout(closeTimer);
        if (!active) {
            returnFocus = document.activeElement;
            previousHash = names.includes(location.hash.slice(1)) ? '' : location.hash;
        }
        const switching = !!active;
        const previousActive = active;
        active = name;
        panels.forEach(panel => {
            panel.hidden = panel.dataset.drawerPanel !== name;
            panel.classList.remove('is-closing');
            panel.scrollTop = 0;
            if(panel.dataset.drawerPanel===name && previousActive!==name)panel.querySelector('.drawer-scroll').scrollTop=0;
        });
        backdrop.hidden = false;
        document.body.classList.add('drawer-open');
        const title = document.querySelector('#' + name + ' .drawer-header h2');
        title.tabIndex = -1; title.focus({preventScroll:true});
        page.inert = true; page.setAttribute('aria-hidden','true');
        setExpanded();
        if (hash && location.hash !== '#' + name) {
            history[switching ? 'replaceState' : 'pushState'](null,'',location.pathname + location.search + '#' + name);
        }
        window.dispatchEvent(new CustomEvent('drawer-opened',{detail:{name}}));
    }
    function close({hash = true, immediate = false} = {}) {
        if (!active) return;
        const panel = document.getElementById(active);
        active = null; panel.classList.add('is-closing'); setExpanded();
        if (hash && names.includes(location.hash.slice(1))) history.replaceState(null,'',location.pathname + location.search + previousHash);
        const finish = () => {
            panel.hidden = true; panel.classList.remove('is-closing');
            backdrop.hidden = true; page.inert = false; page.removeAttribute('aria-hidden');
            document.body.classList.remove('drawer-open');
            if (returnFocus?.isConnected && !returnFocus.closest('[hidden]')) returnFocus.focus({preventScroll:true});
            else document.getElementById('account-trigger').focus({preventScroll:true});
            window.dispatchEvent(new Event('drawer-closed'));
        };
        clearTimeout(closeTimer);
        if (immediate || matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
        else closeTimer = setTimeout(finish,180);
    }
    document.addEventListener('click', event => {
        const trigger = event.target.closest('[data-open-drawer],a[href="#account"],a[href="#order"],a[href="#language"]');
        if (trigger) {
            event.preventDefault();
            open(trigger.dataset.openDrawer || trigger.getAttribute('href').slice(1));
        } else if (event.target.closest('[data-close-drawer]') || event.target === backdrop) close();
    });
    document.addEventListener('keydown', event => {
        if (!active) return;
        if (event.key === 'Escape') {event.preventDefault();close();return;}
        if (event.key !== 'Tab') return;
        const panel = document.getElementById(active);
        const items = [...panel.querySelectorAll('a[href],button,input,select,textarea,[tabindex="0"],iframe')]
            .filter(el => !el.disabled && el.getAttribute('aria-disabled') !== 'true' && el.getClientRects().length);
        if (!items.length) {event.preventDefault();return;}
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && (document.activeElement === first || !items.includes(document.activeElement))) {
            event.preventDefault();last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !items.includes(document.activeElement))) {
            event.preventDefault();first.focus();
        }
    });
    function fromHash() {
        const name = location.hash.slice(1);
        if (names.includes(name)) {if(active !== name)open(name,{hash:false});}
        else if (active) close({hash:false,immediate:true});
    }
    window.addEventListener('hashchange',fromHash);
    window.addEventListener('popstate',fromHash);
    window.SiteDrawers = {open,close,get active(){return active;}};
    setExpanded();fromHash();
})();
