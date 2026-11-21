(function () {
    'use strict';
    const controls = document.querySelectorAll('[data-language]');
    function choose(language) {
        const selected = language === 'ru' ? 'ru' : 'en';
        document.documentElement.lang = selected;
        document.title = selected === 'ru'
            ? 'Fieldnote · Пример отчёта о тестировании | DevTestHub'
            : 'Fieldnote · Sample app testing report | DevTestHub';
        for (const control of controls) {
            control.setAttribute('aria-pressed', String(control.dataset.language === selected));
        }
    }
    let initial = navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
    try { initial = localStorage.getItem('dth.language') || initial; } catch (_) {}
    choose(initial);
    for (const control of controls) {
        control.addEventListener('click', () => {
            choose(control.dataset.language);
            try { localStorage.setItem('dth.language', control.dataset.language); } catch (_) {}
        });
    }
    const contents = document.getElementById('contents-menu');
    const narrowScreen = window.matchMedia('(max-width: 700px)');
    function setContents() { contents.open = !narrowScreen.matches; }
    setContents();
    narrowScreen.addEventListener('change', setContents);
    contents.addEventListener('click', event => {
        if (narrowScreen.matches && event.target.closest('a')) contents.open = false;
    });
    document.getElementById('print').addEventListener('click', () => window.print());
})();
