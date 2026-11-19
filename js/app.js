(function () {
    'use strict';
    const t = (...args) => SiteI18n.t(...args);
    const status = document.getElementById('account-status');
    let account = null;
    let botUrl = 'https://t.me/' + SiteConfig.BOT_USERNAME;
    let loginBusy = false;
    let accountLoading = false;
    let commerceLoading = false;
    let commerce = null;
    function node(tag, text, className) {
        const el = document.createElement(tag);if(text !== undefined)el.textContent=text;if(className)el.className=className;return el;
    }
    function link(text, url, className = 'button button-small button-outline') {
        const el = node('a',text,className);el.href=url;el.target='_blank';el.rel='noopener noreferrer';return el;
    }
    function setStatus(key) {status.dataset.message=key || '';status.textContent=key?t(key):'';}
    function widget() {
        if (SiteAPI.isLoggedIn() || loginBusy) return;
        const container=document.getElementById('telegram-login');container.replaceChildren();
        const script=document.createElement('script');
        script.src='https://telegram.org/js/telegram-widget.js?22';script.async=true;
        script.setAttribute('data-telegram-login',SiteConfig.BOT_USERNAME);
        script.setAttribute('data-size','large');script.setAttribute('data-userpic','false');
        script.setAttribute('data-radius','8');script.setAttribute('data-onauth','onTelegramAuth(user)');
        script.setAttribute('data-request-access','write');
        script.onerror=()=>setStatus('loginFailed');container.append(script);
    }
    function renderOrders() {
        const list=document.getElementById('orders-list');list.replaceChildren();
        if(!account?.active_orders?.length){list.append(node('p',t('noOrders')));return;}
        account.active_orders.forEach(order=>{
            const card=node('article',undefined,'order-item');
            const info=node('div');const code=node('code','#'+SiteUtils.orderCode(order),'notranslate');code.translate=false;
            info.append(code,node('h4',order.app_name || 'Google Play','notranslate'));
            const known=['awaiting_payment','pending','paid','in_progress','completed','cancelled'].includes(order.status);
            info.append(node('span',t('status_'+(known?order.status:'unknown')),'order-status'));
            const price=Number(order.amount_usd);
            if(Number.isFinite(price)) info.append(node('p','$'+price.toFixed(2)+' · '+String(order.payment_method || ''),'notranslate'));
            const actions=node('div',undefined,'order-actions');
            const hasProof=!!SiteUtils.notesMap(order.notes).proof;
            if(order.status==='awaiting_payment' || (order.status==='pending' && !hasProof)){
                const resume=node('button',t('resumeOrder'),'button button-small button-primary');resume.type='button';
                resume.addEventListener('click',()=>SiteWizard.resume(order));actions.append(resume);
            }
            if(order.status==='awaiting_payment'){
                const cancel=node('button',t('cancelOrder'),'button button-small button-quiet');cancel.type='button';
                cancel.addEventListener('click',async()=>{
                    if(SiteWizard.busy || !confirm(t('confirmCancel')))return;
                    cancel.disabled=true;
                    try{await SiteAPI.call('/guaranteed-test-orders/'+encodeURIComponent(order.id)+'/cancel',{method:'POST',body:{}});SiteI18n.toast(t('orderCancelled'));await refreshAccount();}
                    catch(error){SiteI18n.toast(t(error.status===401?'sessionExpired':'networkError'));}
                    finally{cancel.disabled=false;}
                });actions.append(cancel);
            }
            actions.append(link(t('orderSupport'),SiteConfig.SUPPORT_URL+'?text='+encodeURIComponent('#'+SiteUtils.orderCode(order))));
            card.append(info,actions);list.append(card);
        });
        SiteUtils.protect(list);
    }
    function renderAccount() {
        const signedIn=!!account && SiteAPI.isLoggedIn();
        document.getElementById('signed-out').hidden=SiteAPI.isLoggedIn();
        document.getElementById('signed-in').hidden=!signedIn;
        document.getElementById('logout').hidden=!SiteAPI.isLoggedIn();
        document.getElementById('refresh-account').hidden=!SiteAPI.isLoggedIn();
        document.getElementById('refresh-account').disabled=accountLoading;
        if(!signedIn)return;
        const profile=account.profile;
        document.getElementById('profile-name').textContent=profile.full_name || (profile.username?'@'+profile.username:'Telegram');
        document.getElementById('profile-id').textContent='Telegram ID '+profile.user_id;
        const value=Number(account.balance_bust);
        document.getElementById('balance-value').textContent=(Number.isFinite(value)?value.toLocaleString(SiteI18n.language==='ru'?'ru-RU':'en-US'):'—')+' $BUST';
        document.getElementById('bot-receipt-link').href=botUrl;
        renderOrders();
    }
    async function refreshAccount() {
        if(!SiteAPI.isLoggedIn() || accountLoading)return;
        accountLoading=true;setStatus('loadingAccount');renderAccount();
        try{
            const data=await SiteAPI.call('/web/me');
            if(!data.profile?.user_id || !Array.isArray(data.active_orders) || !Array.isArray(data.projects))throw new Error('invalid_response');
            account=data;setStatus('');SiteWizard.setAccount(data);renderAccount();
        }catch(error){if(error.status!==401)setStatus('accountUnavailable');}
        finally{accountLoading=false;renderAccount();}
    }
    async function loadCommerce() {
        if(commerceLoading)return;
        commerceLoading=true;
        try{commerce=await SiteAPI.call('/web/commerce',{auth:false});SiteWizard.setCommerce(commerce);}
        catch(_){commerce=null;SiteWizard.setCommerce(null);}
        finally{
            commerceLoading=false;
            if(commerce?.bust?.enabled===true){
                document.getElementById('bust-description').textContent=t('bustEnabled');
            }
        }
    }
    window.onTelegramAuth=async function(widgetCallback){
        if(loginBusy || SiteWizard.busy || SiteAPI.isLoggedIn())return;
        loginBusy=true;setStatus('loggingIn');
        try{
            // The exact callback object goes to the backend, without added fields.
            const response=await SiteAPI.login(widgetCallback);
            botUrl=SiteUtils.safeBotUrl(response.bot_url);
            document.getElementById('bot-receipt-link').href=botUrl;
            renderAccount();await refreshAccount();
        }catch(error){setStatus(error.code==='website_auth_not_configured'?'authUnavailable':'loginFailed');}
        finally{loginBusy=false;}
    };
    function clearAccount(expired){
        SiteWizard.save();account=null;botUrl='https://t.me/'+SiteConfig.BOT_USERNAME;
        SiteWizard.setAccount(null);renderAccount();
        document.getElementById('profile-name').textContent='';document.getElementById('profile-id').textContent='';
        document.getElementById('balance-value').textContent='';document.getElementById('orders-list').replaceChildren();
        document.getElementById('project-picker-wrap').hidden=true;document.getElementById('project-picker').replaceChildren(new Option(t('manualEntry'),''));
        setStatus(expired?'sessionExpired':'signedOut');widget();
    }
    window.addEventListener('session-expired',()=>clearAccount(true));
    window.addEventListener('session-cleared',()=>clearAccount(false));
    document.getElementById('logout').addEventListener('click',()=>{if(!SiteWizard.busy)SiteAPI.clearSession();});
    document.getElementById('refresh-account').addEventListener('click',refreshAccount);
    document.getElementById('retry-commerce').addEventListener('click',loadCommerce);
    document.getElementById('retry-widget').addEventListener('click',widget);
    document.querySelectorAll('[data-bot-link]').forEach(el=>{el.href='https://t.me/'+SiteConfig.BOT_USERNAME+'?start=web_mutual';});
    document.addEventListener('click',async event=>{
        const button=event.target.closest('[data-copy],#copy-uid');if(!button)return;
        const value=button.id==='copy-uid'?document.getElementById('exchange-uid').textContent:button.dataset.copy;
        try{await navigator.clipboard.writeText(value);SiteI18n.toast(t('copied'));}
        catch(_){SiteI18n.toast(t('copyFailed'));}
    });
    window.addEventListener('language-changed',()=>{
        if(status.dataset.message)setStatus(status.dataset.message);
        renderAccount();
        if(commerce?.bust?.enabled===true)document.getElementById('bust-description').textContent=t('bustEnabled');
    });
    // Restore focus/recheck local TTL after the tab was suspended.
    document.addEventListener('visibilitychange',()=>{
        if(document.visibilityState==='visible' && account && !SiteAPI.isLoggedIn())SiteAPI.expireSession();
    });
    window.SiteApp={refreshAccount,loadCommerce};
    SiteUtils.protect();widget();loadCommerce();renderAccount();
})();
