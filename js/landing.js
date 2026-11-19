(function () {
    'use strict';
    let scenario = 'private';
    const range = document.getElementById('demo-timeline');
    const t = (...args) => SiteI18n.t(...args);
    function render() {
        const total = scenario === 'private' ? 15 : 14;
        range.max = String(total); range.value = String(Math.min(total,Number(range.value)));
        document.querySelectorAll('[data-scenario]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.scenario===scenario)));
        document.getElementById('demo-days').textContent = total + (SiteI18n.language === 'ru' ? ' дней' : ' days');
        document.getElementById('demo-end-day').textContent = String(total);
        document.getElementById('demo-day').textContent = t('demoDay',{day:range.value,total});
        document.getElementById('demo-status').textContent = t(Number(range.value) === total ? (scenario === 'private' ? 'demoReady':'demoMutualReady') : 'demoActive');
        document.getElementById('demo-status').classList.toggle('is-ready',Number(range.value)===total);
        document.getElementById('demo-team-label').textContent = t(scenario === 'private'?'demoTeam':'demoDaily');
        document.getElementById('demo-scenario-note').textContent = t(scenario === 'private'?'demoPrivateNote':'demoMutualNote');
        range.setAttribute('aria-valuetext',t('demoDay',{day:range.value,total}));
        range.setAttribute('aria-label',t('demoTimeline'));
        range.style.setProperty('--progress',((Number(range.value)-1)/(total-1)*100)+'%');
    }
    document.querySelectorAll('[data-scenario]').forEach(button=>button.addEventListener('click',()=>{scenario=button.dataset.scenario;render();}));
    range.addEventListener('input',render);window.addEventListener('language-changed',render);render();
})();
