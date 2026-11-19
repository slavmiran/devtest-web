(function () {
    'use strict';
    const t=(...args)=>SiteI18n.t(...args);
    const status=document.getElementById('account-status');
    const feedback=document.getElementById('account-feedback');
    const retryButton=document.getElementById('account-retry');
    let account=null;
    let botUrl='https://t.me/'+SiteConfig.BOT_USERNAME;
    let loginBusy=false,accountLoading=false,commerceLoading=false;
    let commerce=null,retryAction=null,uiEpoch=0;
    function node(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
    function link(text,url,className='button button-small button-outline'){const el=node('a',text,className);el.href=url;el.target='_blank';el.rel='noopener noreferrer';return el;}
    function setStatus(key,{error=false,retry}={}){
        status.dataset.message=key||'';
        status.textContent=key?t(key,{env:SiteConfig.ENV.toUpperCase()}):'';
        feedback.hidden=!key;feedback.classList.toggle('is-error',error);
        retryAction=retry||null;retryButton.hidden=!retry;
        status.setAttribute('role',error?'alert':'status');
        if(error)SiteI18n.toast(status.textContent,{retry,persistent:true});
    }
    function errorKey(error){
        if(error.status===404)return 'apiNotFound';
        if(error.status===503)return 'apiUnavailable';
        if(error.status===401)return 'apiUnauthorized';
        if(['network_error','request_timeout','invalid_response'].includes(error.code))return 'apiNetwork';
        return 'apiGeneric';
    }
    function widget(){
        if(SiteAPI.isLoggedIn()||loginBusy)return;
        const container=document.getElementById('telegram-login');container.replaceChildren();
        const script=document.createElement('script');
        script.src='https://telegram.org/js/telegram-widget.js?22';script.async=true;
        script.setAttribute('data-telegram-login',SiteConfig.BOT_USERNAME);
        script.setAttribute('data-size','large');script.setAttribute('data-userpic','false');
        script.setAttribute('data-radius','8');script.setAttribute('data-onauth','onTelegramAuth(user)');
        script.setAttribute('data-request-access','write');
        script.onerror=()=>setStatus('loginFailed',{error:true,retry:widget});container.append(script);
    }
    function avatar(image,fallback,name,url){
        fallback.textContent=String(name||'TG').trim().split(/\s+/).map(part=>part[0]).slice(0,2).join('').toUpperCase();
        let safe='';try{const parsed=new URL(url);if(parsed.protocol==='https:')safe=parsed.href;}catch(_){}
        if(!safe||image.dataset.failed===safe){image.hidden=true;image.removeAttribute('src');return;}
        image.onerror=()=>{image.dataset.failed=safe;image.hidden=true;};
        if(image.src!==safe)image.src=safe;image.hidden=false;
    }
    function renderOrders(){
        const list=document.getElementById('orders-list');list.replaceChildren();
        if(!account?.active_orders?.length){list.append(node('p',t('noOrders')));return;}
        account.active_orders.forEach(order=>{
            const card=node('article',undefined,'order-item');
            const info=node('div');
            info.append(node('code','#'+SiteUtils.orderCode(order),'notranslate'),node('h4',order.app_name||'Google Play','notranslate'));
            const known=['awaiting_payment','pending','paid','in_progress','completed','cancelled'].includes(order.status);
            info.append(node('span',t('status_'+(known?order.status:'unknown')),'order-status'));
            const amount=Number(order.amount_usd);
            if(Number.isFinite(amount))info.append(node('p','$'+amount.toFixed(2)+' · '+String(order.payment_method||''),'notranslate'));
            card.append(info);
            const day=SiteUtils.orderDay(order);
            if(day!==null){
                const progressBox=node('div',undefined,'order-timeline');
                const label=node('label',t('dayLabel',{day}),'notranslate');
                const progress=node('progress');progress.max=15;progress.value=day;
                progress.setAttribute('aria-label',t('dayLabel',{day}));
                progressBox.append(label,progress);card.append(progressBox);
            }else if(order.status==='in_progress')card.append(node('p',t('timelinePending'),'small'));
            const actions=node('div',undefined,'order-actions');
            const hasProof=!!SiteUtils.notesMap(order.notes).proof;
            if(order.status==='awaiting_payment'||(order.status==='pending'&&!hasProof)){
                const resume=node('button',t('resumeOrder'),'button button-small button-primary');resume.type='button';
                resume.addEventListener('click',()=>{SiteWizard.resume(order);SiteDrawers.open('order');});actions.append(resume);
            }
            if(order.status==='awaiting_payment'){
                const cancel=node('button',t('cancelOrder'),'button button-small button-quiet');cancel.type='button';
                cancel.addEventListener('click',async()=>{
                    if(SiteWizard.busy||!confirm(t('confirmCancel')))return;
                    cancel.disabled=true;
                    try{await SiteAPI.call('/guaranteed-test-orders/'+encodeURIComponent(order.id)+'/cancel',{method:'POST',body:{}});SiteI18n.toast(t('orderCancelled'));await refreshAccount();}
                    catch(error){setStatus(errorKey(error),{error:true,retry:refreshAccount});}
                    finally{cancel.disabled=false;}
                });actions.append(cancel);
            }
            actions.append(link(t('orderSupport'),SiteConfig.SUPPORT_URL+'?text='+encodeURIComponent('#'+SiteUtils.orderCode(order))));
            card.append(actions);list.append(card);
        });
        SiteUtils.protect(list);
    }
    function renderProjects(){
        const list=document.getElementById('projects-list');list.replaceChildren();
        if(!account?.projects?.length){list.append(node('p',t('noProjects')));return;}
        account.projects.forEach(project=>{
            const card=node('article',undefined,'project-item');
            card.append(node('h4',project.name||project.package_name,'notranslate'),node('code',project.package_name||'','notranslate'));
            const button=node('button',t('projectOrder'),'button button-small button-outline');button.type='button';
            button.addEventListener('click',()=>{if(SiteWizard.prefill(project.app_id))SiteDrawers.open('order');});
            card.append(button);list.append(card);
        });SiteUtils.protect(list);
    }
    function renderAccount(){
        const loggedIn=SiteAPI.isLoggedIn(),signedIn=!!account&&loggedIn;
        document.getElementById('signed-out').hidden=loggedIn;
        document.getElementById('signed-in').hidden=!signedIn;
        document.getElementById('logout').hidden=!loggedIn;
        document.getElementById('refresh-account').hidden=!loggedIn;
        document.getElementById('refresh-account').disabled=accountLoading;
        document.getElementById('account-reset-session').hidden=!loggedIn||signedIn;
        document.getElementById('header-avatar').hidden=!signedIn;
        document.getElementById('header-balance').hidden=!signedIn;
        const chipName=document.getElementById('header-profile-name');
        const chip=document.getElementById('account-trigger');
        document.getElementById('login-context').textContent=t('loginContext',{bot:SiteConfig.BOT_USERNAME,env:SiteConfig.ENV.toUpperCase()});
        if(!signedIn){chipName.textContent=t(loggedIn?(accountLoading?'profileLoading':'profileUnavailable'):'accountChip');chip.setAttribute('aria-label',t('accountDrawerTitle'));return;}
        const profile=account.profile;
        const name=profile.full_name||(profile.username?'@'+profile.username:'Telegram');
        const balance=Number(account.balance_bust);
        const formatted=Number.isFinite(balance)?balance.toLocaleString(SiteI18n.language==='ru'?'ru-RU':'en-US'):'—';
        document.getElementById('profile-name').textContent=name;
        document.getElementById('profile-username').textContent=profile.username?'@'+profile.username:t('usernameMissing');
        document.getElementById('profile-id').textContent='Telegram ID '+profile.user_id;
        document.getElementById('balance-value').textContent=formatted+' $BUST';
        document.getElementById('header-balance').textContent=formatted+' $BUST';
        chipName.textContent=profile.username?'@'+profile.username:name.split(' ')[0];
        chip.setAttribute('aria-label',t('accountDrawerTitle')+' · '+name+' · '+formatted+' $BUST');
        avatar(document.getElementById('profile-avatar'),document.getElementById('profile-avatar-fallback'),name,profile.avatar_url);
        avatar(document.getElementById('header-avatar-image'),document.getElementById('header-avatar-fallback'),name,profile.avatar_url);
        document.getElementById('bot-receipt-link').href=botUrl;
        renderOrders();renderProjects();
    }
    async function refreshAccount(){
        if(!SiteAPI.isLoggedIn()||accountLoading)return false;
        const epoch=uiEpoch;
        accountLoading=true;setStatus('loadingAccount');renderAccount();
        try{
            const data=await SiteAPI.call('/web/me');
            if(epoch!==uiEpoch)return false;
            if(!data.profile?.user_id||!Array.isArray(data.active_orders)||!Array.isArray(data.projects))throw new SiteAPI.ApiError('invalid_response');
            account=data;SiteWizard.setAccount(data);renderAccount();setStatus('');
            // /web/me intentionally omits start dates. Reuse the authenticated
            // existing order view only when a real in-progress timeline needs it.
            if(data.active_orders.some(order=>order.status==='in_progress'&&!order.started_at)){
                try{
                    const detail=await SiteAPI.call('/guaranteed-test-orders/mine');
                    if(epoch!==uiEpoch)return false;
                    const ownedIds=new Set(data.active_orders.map(order=>order.id));
                    const allowed=(detail.orders||[]).filter(order=>ownedIds.has(order.id)&&Number(order.user_id)===Number(data.profile.user_id));
                    data.active_orders.forEach(order=>{const full=allowed.find(item=>item.id===order.id);if(full){order.started_at=full.started_at;order.completion_date=full.completion_date;}});
                    renderOrders();
                }catch(error){if(error.status===401)return false;setStatus('progressUnavailable',{retry:refreshAccount});}
            }
            return true;
        }catch(error){if(epoch===uiEpoch&&error.status!==401)setStatus(errorKey(error),{error:true,retry:refreshAccount});return false;}
        finally{if(epoch===uiEpoch){accountLoading=false;renderAccount();}}
    }
    async function loadCommerce(){
        if(commerceLoading)return;
        commerceLoading=true;
        try{commerce=await SiteAPI.call('/web/commerce',{auth:false});SiteWizard.setCommerce(commerce);}
        catch(error){commerce=null;SiteWizard.setCommerce(null);SiteI18n.toast(t(errorKey(error),{env:SiteConfig.ENV.toUpperCase()}),{retry:loadCommerce,persistent:true});}
        finally{commerceLoading=false;if(commerce?.bust?.enabled===true)document.getElementById('bust-description').textContent=t('bustEnabled');}
    }
    window.onTelegramAuth=async function(widgetCallback){
        if(loginBusy||SiteWizard.busy||SiteAPI.isLoggedIn())return;
        loginBusy=true;SiteDrawers.open('account');setStatus('loggingIn');
        try{
            const response=await SiteAPI.login(widgetCallback); // Callback unchanged.
            uiEpoch++;botUrl=SiteUtils.safeBotUrl(response.bot_url);
            renderAccount();const ready=await refreshAccount();
            SiteDrawers.open('account');if(ready)SiteI18n.toast(t('accountReady'));
        }catch(error){setStatus(errorKey(error),{error:true,retry:()=>{widget();SiteDrawers.open('account');}});}
        finally{loginBusy=false;}
    };
    function clearAccount(expired){
        uiEpoch++;accountLoading=false;SiteWizard.save();account=null;botUrl='https://t.me/'+SiteConfig.BOT_USERNAME;
        SiteWizard.setAccount(null);renderAccount();
        ['profile-name','profile-username','profile-id','balance-value','header-balance'].forEach(id=>{document.getElementById(id).textContent='';});
        document.getElementById('orders-list').replaceChildren();document.getElementById('projects-list').replaceChildren();
        document.getElementById('project-picker-wrap').hidden=true;document.getElementById('project-picker').replaceChildren(new Option(t('manualEntry'),''));
        setStatus(expired?'sessionExpired':'signedOut',{retry:expired?widget:undefined});widget();
        if(expired){SiteDrawers.open('account');SiteI18n.toast(t('sessionExpired'),{retry:()=>{SiteDrawers.open('account');widget();},persistent:true});}
        else SiteI18n.toast(t('signedOut'));
    }
    window.addEventListener('session-expired',()=>clearAccount(true));
    window.addEventListener('session-cleared',()=>clearAccount(false));
    retryButton.addEventListener('click',()=>retryAction?.());
    document.getElementById('logout').addEventListener('click',()=>{if(!SiteWizard.busy)SiteAPI.clearSession();});
    document.getElementById('account-reset-session').addEventListener('click',()=>SiteAPI.clearSession());
    document.getElementById('refresh-account').addEventListener('click',refreshAccount);
    document.getElementById('retry-commerce').addEventListener('click',loadCommerce);
    document.getElementById('retry-widget').addEventListener('click',widget);
    document.querySelectorAll('[data-bot-link]').forEach(el=>{el.href='https://t.me/'+SiteConfig.BOT_USERNAME+'?start=web_mutual';});
    document.addEventListener('click',async event=>{
        const button=event.target.closest('[data-copy],#copy-uid');if(!button)return;
        const value=button.id==='copy-uid'?document.getElementById('exchange-uid').textContent:button.dataset.copy;
        try{await navigator.clipboard.writeText(value);SiteI18n.toast(t('copied'));}catch(_){SiteI18n.toast(t('copyFailed'));}
    });
    window.addEventListener('language-changed',()=>{
        if(status.dataset.message)status.textContent=t(status.dataset.message,{env:SiteConfig.ENV.toUpperCase()});
        renderAccount();if(commerce?.bust?.enabled===true)document.getElementById('bust-description').textContent=t('bustEnabled');
    });
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&account&&!SiteAPI.isLoggedIn())SiteAPI.expireSession();});
    window.SiteApp={refreshAccount,loadCommerce};
    SiteUtils.protect();widget();loadCommerce();renderAccount();
})();
