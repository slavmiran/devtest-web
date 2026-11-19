/* GitHub Pages: no build step and no secrets in this file. */
(function () {
    'use strict';
    var requested = new URLSearchParams(location.search).get('env');
    var environment = 'prod';
    try {
        if (requested === 'prod' || requested === 'dev') sessionStorage.setItem('dth.environment', requested);
        environment = requested === 'prod' || requested === 'dev' ? requested : sessionStorage.getItem('dth.environment') || 'prod';
    } catch (_) { environment = requested === 'dev' ? 'dev' : 'prod'; }
    var dev = environment === 'dev';
    window.SiteConfig = Object.freeze({
        ENV: dev ? 'dev' : 'prod',
        API_BASE: dev ? 'https://dev-api.devtesthub.app/api' : 'https://devtest-backend.onrender.com/api',
        BOT_USERNAME: dev ? 'DevTestHub_bot' : 'Android12TestersBot',
        SUPPORT_URL: 'https://t.me/garantXchange',
        GROUP_EMAIL: 'google-play-dev-test@googlegroups.com',
        PAYPAL_URL: 'https://paypal.me/devtesthub/23USD',
        PAYPAL_EMAIL: 'pay.hubstation@gmail.com'
    });
    if (dev) document.documentElement.dataset.env = 'dev';
})();
