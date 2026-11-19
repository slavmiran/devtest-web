(function () {
    'use strict';
    const packagePattern = /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$/;
    function packageId(value) {
        const raw = String(value || '').trim();
        if (packagePattern.test(raw)) return raw;
        try {
            const url = new URL(raw);
            if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'play.google.com' || url.port) return '';
            let pkg = '';
            if (url.pathname.replace(/\/+$/, '') === '/store/apps/details') pkg = url.searchParams.get('id') || '';
            else {
                const match = url.pathname.match(/^\/apps\/testing\/([^/]+)\/?$/);
                if (match) pkg = decodeURIComponent(match[1]);
            }
            return packagePattern.test(pkg) ? pkg : '';
        } catch (_) { return ''; }
    }
    const exchanges = [
        {id: 'binance', name: 'Binance', label: 'ID', value: '967321648', url: 'https://www.binance.com'},
        {id: 'bybit', name: 'ByBit', label: 'UID', value: '30291060', url: 'https://www.bybit.com'},
        {id: 'okx', name: 'OKX', label: 'UID', value: '323906492761830368', url: 'https://www.okx.com'},
        {id: 'htx', name: 'HTX', label: 'UID', value: '442101593', url: 'https://www.htx.com'},
        {id: 'gate', name: 'Gate', label: 'UID', value: '8536355', url: 'https://www.gate.io'}
    ];
    function protect(root = document) {
        root.querySelectorAll('input,select,textarea,code,a,[data-protect]').forEach(el => {el.classList.add('notranslate'); el.setAttribute('translate', 'no');});
    }
    function safeBotUrl(url) {
        try { const parsed = new URL(url); return parsed.protocol === 'https:' && parsed.hostname === 't.me' ? parsed.href : 'https://t.me/' + SiteConfig.BOT_USERNAME; }
        catch (_) { return 'https://t.me/' + SiteConfig.BOT_USERNAME; }
    }
    function notesMap(notes) {
        return Object.fromEntries(String(notes || '').split(';').map(x => x.trim()).filter(x => x.includes('=')).map(x => {
            const i = x.indexOf('='); return [x.slice(0, i).toLowerCase(), x.slice(i + 1)];
        }));
    }
    window.SiteUtils = {packageId, exchanges, protect, safeBotUrl, notesMap,
        normalizeLink: value => packageId(value) ? 'https://play.google.com/apps/testing/' + packageId(value) : '',
        cleanNote: value => String(value || '').replace(/[;\r\n=]/g, ' ').trim(),
        orderCode: order => String(order.public_code || ('GT-' + (24766 + Number(order.id) * 41))).replace(/^#/, ''),
        validReceipt: file => file && file.size > 0 && file.size <= 5 * 1024 * 1024 && ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
    };
})();
