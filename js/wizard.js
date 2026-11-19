(function () {
    'use strict';
    const form = document.getElementById('order-form');
    const field = name => form.elements.namedItem(name);
    const t = (...args) => SiteI18n.t(...args);
    const defaults = () => ({step:1, appName:'',appType:'free',testingLink:'',detailsConfirmed:false,licenseConfirmed:false,
        linkConfirmed:false,groupConfirmed:false,countriesConfirmed:false,reviewConfirmed:false,paymentMethod:'crypto',
        exchange:'binance',currency:'TRY',bankName:'',personalAccount:true,fiatOrderId:null});
    let actor = 'guest';
    let state = defaults();
    let account = null;
    let boundOrder = null;
    let receiptFile = null;
    let receiptUrl = null;
    let uploadedProof = null;
    let busy = false;
    let commerceReady = false;
    let enabled = false;
    let prices = {crypto:20,paypal:23,bank:23};
    const key = () => 'dth.draft.v1.' + SiteConfig.ENV + '.' + actor;
    const errorBox = document.getElementById('wizard-error');
    const successBox = document.getElementById('wizard-success');
    const nextButton = document.getElementById('wizard-next');
    const requisitesButton = document.getElementById('request-requisites');
    let lastErrorKey = '';
    let lastSuccess = null;
    function save() {
        try { localStorage.setItem(key(), JSON.stringify(state)); document.getElementById('draft-indicator').textContent = t('draftSaved'); }
        catch (_) {document.getElementById('draft-indicator').textContent = t('storageUnavailable');}
    }
    function load() {
        state = defaults();
        let saved;
        try {saved = JSON.parse(localStorage.getItem(key()) || 'null');} catch (_) {}
        if (saved && typeof saved === 'object') {
            Object.keys(state).forEach(name => {
                if (typeof state[name] === 'boolean') state[name] = saved[name] === true;
                else if (typeof state[name] === 'string') state[name] = typeof saved[name] === 'string' ? saved[name].slice(0,500) : state[name];
            });
            state.step = [1,2,3].includes(saved.step) ? saved.step : 1;
            state.fiatOrderId = Number.isSafeInteger(saved.fiatOrderId) && saved.fiatOrderId > 0 ? saved.fiatOrderId : null;
            if (!['free','paid'].includes(state.appType)) state.appType = 'free';
            if (!['crypto','paypal','bank'].includes(state.paymentMethod)) state.paymentMethod = 'crypto';
            if (!SiteUtils.exchanges.some(ex => ex.id === state.exchange)) state.exchange = 'binance';
        }
        document.getElementById('resume-banner').hidden = !state.appName && !state.testingLink;
        renderFields();
    }
    function clearReceipt(clearInput = true) {
        receiptFile = null; uploadedProof = null;
        if (receiptUrl) URL.revokeObjectURL(receiptUrl);
        receiptUrl = null;
        if (clearInput) document.getElementById('receipt').value = '';
        document.getElementById('receipt-info').textContent = '';
        document.getElementById('receipt-preview').hidden = true;
        field('paymentConfirmed').checked = false;
    }
    function reset(force = false) {
        if (busy && !force) return;
        try {localStorage.removeItem(key());} catch (_) {}
        boundOrder = null; state = defaults(); clearReceipt();
        lastErrorKey = ''; lastSuccess = null; errorBox.hidden = true; successBox.hidden = true;
        document.getElementById('resume-banner').hidden = true;
        renderFields();
    }
    function sync() {
        for (const name of Object.keys(defaults())) {
            if (['step','fiatOrderId'].includes(name)) continue;
            const input = field(name);
            if (!input) continue;
            state[name] = input.type === 'checkbox' ? input.checked : input.value;
        }
    }
    function setStep(step, focus = false) {
        state.step = step;
        form.querySelectorAll('[data-step]').forEach(el => {el.hidden = Number(el.dataset.step) !== step;});
        document.querySelectorAll('[data-step-label]').forEach(el => {
            if (Number(el.dataset.stepLabel) === step) el.setAttribute('aria-current','step'); else el.removeAttribute('aria-current');
        });
        document.getElementById('wizard-back').hidden = step === 1;
        nextButton.textContent = busy ? t('processing') : t(step === 3 ? 'submitOrder' : 'continue');
        updateControls();
        if (focus) {
            const heading = form.querySelector('[data-step="' + step + '"] h3');
            heading.tabIndex = -1; heading.focus({preventScroll:true});
            document.querySelector('.wizard-card').scrollIntoView({behavior:'smooth',block:'start'});
        }
    }
    function renderFields() {
        Object.keys(defaults()).forEach(name => {
            if (['step','fiatOrderId'].includes(name)) return;
            const input = field(name);
            if (!input) return;
            if (input.type === 'checkbox') input.checked = !!state[name];
            else input.value = state[name];
        });
        renderPanels(); setStep(state.step); renderBank();
    }
    function renderPanels() {
        document.getElementById('license-panel').hidden = state.appType !== 'paid';
        document.querySelectorAll('[data-payment]').forEach(el => {el.hidden = el.dataset.payment !== state.paymentMethod;});
        const normalized = SiteUtils.normalizeLink(state.testingLink);
        document.getElementById('normalized-link').textContent = normalized;
        const exchange = SiteUtils.exchanges.find(ex => ex.id === state.exchange) || SiteUtils.exchanges[0];
        document.getElementById('exchange-uid').textContent = exchange.value;
        document.getElementById('exchange-label').textContent = exchange.name + ' ' + exchange.label;
        document.getElementById('exchange-link').href = exchange.url;
    }
    function updateControls() {
        nextButton.disabled = busy || (state.step === 3 && (!commerceReady || !enabled || !SiteAPI.isLoggedIn()));
        requisitesButton.disabled = busy || !commerceReady || !enabled || !SiteAPI.isLoggedIn() || !!boundOrder;
        document.getElementById('wizard-back').disabled = busy;
        document.getElementById('clear-draft').disabled = busy;
        document.getElementById('login-reminder').hidden = SiteAPI.isLoggedIn();
        const names = ['appName','appType','testingLink','paymentMethod','currency','bankName','personalAccount'];
        names.forEach(name => {
            const input = field(name);
            if (input instanceof RadioNodeList) Array.from(input).forEach(el => {el.disabled = busy || !!boundOrder;});
            else if (input) input.disabled = busy || !!boundOrder;
        });
        document.getElementById('project-picker').disabled = busy || !!boundOrder;
        document.getElementById('receipt').disabled = busy;
        field('exchange').disabled = busy;
        document.querySelectorAll('[data-payment] a').forEach(a => {
            const blocked = !commerceReady || !enabled || !SiteAPI.isLoggedIn();
            a.setAttribute('aria-disabled', String(blocked)); a.tabIndex = blocked ? -1 : 0;
        });
    }
    function error(keyName) {
        lastErrorKey = keyName; errorBox.textContent = t(keyName); errorBox.hidden = false; errorBox.focus({preventScroll:true});
    }
    function clearMessages() {lastErrorKey = ''; lastSuccess = null; errorBox.hidden = true; successBox.hidden = true;}
    function success(keyName, order) {
        lastSuccess = {key:keyName,code:'#' + SiteUtils.orderCode(order)};
        successBox.textContent = t(keyName,{code:lastSuccess.code}); successBox.hidden = false;
        successBox.classList.add('notranslate'); successBox.setAttribute('translate','no');
    }
    function validate(stage) {
        if (stage >= 1) {
            if (!state.appName.trim() || !state.detailsConfirmed) return 'missingDetails';
            if (state.appType === 'paid' && !state.licenseConfirmed) return 'missingLicense';
        }
        if (stage >= 2) {
            if (!SiteUtils.packageId(state.testingLink)) return 'invalidLink';
            if (!state.linkConfirmed || !state.groupConfirmed || !state.countriesConfirmed || !state.reviewConfirmed) return 'missingChecklist';
        }
        return '';
    }
    function notes() {
        const parts = [];
        const pkg = SiteUtils.packageId(state.testingLink);
        const project = account?.projects?.find(p => String(p.app_id) === document.getElementById('project-picker').value);
        if (project && pkg === project.package_name) {parts.push('app_id=' + project.app_id, 'package=' + pkg);}
        else if (pkg) parts.push('package=' + pkg);
        if (state.paymentMethod === 'bank') parts.push('currency=' + SiteUtils.cleanNote(state.currency), 'bank=' + SiteUtils.cleanNote(state.bankName),
            'personal_account=' + (state.personalAccount ? 'yes':'no'), 'base_amount=' + prices.crypto, 'fee_amount=' + (prices.bank - prices.crypto));
        if (state.paymentMethod === 'crypto') parts.push('exchange=' + SiteUtils.exchanges.find(ex=>ex.id === state.exchange).name);
        return parts;
    }
    function orderBody(mode, proof) {
        const parts = notes();
        if (proof) parts.push('proof=' + proof);
        return {app_name:state.appName.trim(),app_type:state.appType,testing_link:SiteUtils.normalizeLink(state.testingLink),
            payment_method:state.paymentMethod,amount_usd:prices[state.paymentMethod],create_mode:mode,notes:parts.join('; ')};
    }
    function requireSession() {
        if (SiteAPI.isLoggedIn()) return true;
        save(); error('needLogin'); document.getElementById('account').scrollIntoView({behavior:'smooth'}); return false;
    }
    function requireCommerce() {
        if (commerceReady && enabled) return true;
        error(commerceReady ? 'commerceDisabled':'pricesUnavailable'); return false;
    }
    function handleError(problem) {
        if (problem.status === 401) error('sessionExpired');
        else if (problem.code === 'order_already_active') {error('duplicateOrder'); window.SiteApp?.refreshAccount();}
        else if (['invalid_image_type','file_too_large','empty_file'].includes(problem.code)) error('missingReceipt');
        else if (['proof_upload_failed','bot_dm_unavailable','upload_rate_limited'].includes(problem.code)) error('uploadError');
        else error('networkError');
    }
    async function uploadProof() {
        if (uploadedProof) return uploadedProof;
        if (!SiteUtils.validReceipt(receiptFile)) throw new SiteAPI.ApiError('invalid_image_type');
        const data = new FormData(); data.append('file',receiptFile); data.append('upload_kind','payment_proof');
        const response = await SiteAPI.call('/upload-icon',{method:'POST',body:data});
        if (!response.url || typeof response.url !== 'string') throw new SiteAPI.ApiError('proof_upload_failed');
        uploadedProof = response.url;
        return uploadedProof;
    }
    async function submit() {
        sync(); clearMessages();
        const issue = boundOrder ? '' : validate(2);
        if (issue) {setStep(['missingDetails','missingLicense'].includes(issue)?1:2,true);error(issue);return;}
        if (!requireSession() || !requireCommerce()) return;
        if (state.paymentMethod === 'bank' && !boundOrder) {error('bankFirst');return;}
        if (!receiptFile && !uploadedProof) {error('missingReceipt');return;}
        if (!field('paymentConfirmed').checked) {error('missingPaymentConfirmation');return;}
        busy = true; setStep(3); save();
        try {
            const proof = await uploadProof();
            if (!SiteAPI.isLoggedIn()) throw new SiteAPI.ApiError('session_expired',{},401);
            let result;
            if (boundOrder) result = await SiteAPI.call('/guaranteed-test-orders/' + encodeURIComponent(boundOrder.id) + '/attach-proof', {method:'POST',body:{proof_url:proof}});
            else result = await SiteAPI.call('/guaranteed-test-orders',{method:'POST',body:orderBody('submit',proof)});
            if (!result.order?.id) throw new SiteAPI.ApiError('invalid_response');
            const order = result.order;
            reset(true); success('submitted',order);
            await window.SiteApp?.refreshAccount();
        } catch (problem) { handleError(problem); }
        finally {busy = false;setStep(state.step);}
    }
    function managerLink(order) {
        const code = '#' + SiteUtils.orderCode(order);
        const message = (SiteI18n.language === 'ru' ? 'Здравствуйте! Нужны реквизиты для приватного тестирования. ':'Hello! I need bank payment details for private testing. ')
            + code + '\n' + state.appName + '\n' + state.currency + ' / ' + state.bankName
            + '\nPersonal account: ' + (state.personalAccount?'yes':'no');
        return SiteConfig.SUPPORT_URL + '?text=' + encodeURIComponent(message);
    }
    function renderBank() {
        document.getElementById('bank-order').hidden = !boundOrder;
        requisitesButton.hidden = !!boundOrder;
        if (!boundOrder) return;
        document.querySelector('#resume-banner span').textContent = t('bankBound');
        document.getElementById('bank-order-label').textContent = '#' + SiteUtils.orderCode(boundOrder);
        document.getElementById('manager-chat').href = managerLink(boundOrder);
        document.getElementById('resume-banner').hidden = false;
    }
    async function requisites() {
        if (busy) return;
        sync(); clearMessages();
        const issue = validate(2);
        if (issue) {error(issue);return;}
        if (!requireSession() || !requireCommerce()) return;
        if (!field('currency').value || !state.bankName.trim()) {error('missingBank');return;}
        busy = true; updateControls(); requisitesButton.textContent = t('processing'); save();
        try {
            const response = await SiteAPI.call('/guaranteed-test-orders',{method:'POST',body:orderBody('requisites')});
            if (!response.order?.id) throw new SiteAPI.ApiError('invalid_response');
            boundOrder = response.order; state.fiatOrderId = response.order.id; save();renderBank();
            success('requisitesCreated', response.order);
            // A real anchor appears after the async POST, avoiding popup blockers.
            await window.SiteApp?.refreshAccount();
        } catch (problem) {handleError(problem);}
        finally {busy = false;requisitesButton.textContent=t('requestRequisites');updateControls();}
    }
    function resume(order) {
        if (busy || !SiteAPI.isLoggedIn() || !account?.active_orders.some(o=>o.id === order.id)) return;
        const memo = SiteUtils.notesMap(order.notes);
        clearReceipt(); state = defaults();
        Object.assign(state,{appName:order.app_name || '',appType:order.app_type || 'free',testingLink:order.testing_link || '',
            paymentMethod:['crypto','paypal','bank'].includes(order.payment_method)?order.payment_method:'bank',
            currency:memo.currency || 'TRY',bankName:memo.bank || '',personalAccount:memo.personal_account !== 'no',
            step:3,fiatOrderId:order.id});
        boundOrder = order; save(); renderFields(); clearMessages();setStep(3,true);
    }
    function setAccount(nextAccount) {
        const nextActor = nextAccount ? String(nextAccount.profile.user_id) : 'guest';
        if (actor !== nextActor) {
            save(); const guest = actor === 'guest' ? {...state}: null;
            actor = nextActor; account = nextAccount;boundOrder = null;clearReceipt();load();
            if (guest && actor !== 'guest' && !state.appName && !state.testingLink && (guest.appName || guest.testingLink)) {
                state = {...guest,fiatOrderId:null};renderFields();save();
                try {localStorage.removeItem('dth.draft.v1.' + SiteConfig.ENV + '.guest');} catch (_) {}
            }
        } else account = nextAccount;
        if (!nextAccount) {
            // Never leave a previous actor's values in a shared browser after logout.
            state = defaults();boundOrder = null;clearReceipt();renderFields();updateControls();return;
        }
        if (state.fiatOrderId && !boundOrder) {
            const matching = nextAccount.active_orders.find(o=>o.id === state.fiatOrderId && SiteUtils.packageId(o.testing_link) === SiteUtils.packageId(state.testingLink));
            if (matching && ['awaiting_payment','pending'].includes(matching.status)) boundOrder = matching;
            else {state.fiatOrderId = null;save();}
        }
        if (boundOrder && !nextAccount.active_orders.some(o=>o.id===boundOrder.id && ['awaiting_payment','pending'].includes(o.status))) {
            boundOrder=null;state.fiatOrderId=null;save();
        }
        const picker = document.getElementById('project-picker');
        const selected = picker.value; picker.replaceChildren();
        picker.append(new Option(t('manualEntry'),''));
        (nextAccount.projects || []).forEach(project => {picker.append(new Option(project.name || project.package_name,String(project.app_id)));});
        picker.value = selected;
        document.getElementById('project-picker-wrap').hidden = !nextAccount.projects?.length;
        renderBank(); updateControls();
    }
    function setCommerce(data) {
        const service = data?.private_testing;
        commerceReady = !!service && service.currency === 'USD' && ['crypto','paypal','bank'].every(method => Number.isFinite(service.prices?.[method]) && service.prices[method] > 0);
        enabled = commerceReady && service.enabled === true;
        if (commerceReady) {
            prices = {...service.prices};
            renderPrices();
        }
        document.getElementById('commerce-state').textContent = t(!commerceReady?'pricesUnavailable':enabled?'pricesReady':'commerceDisabled');
        document.getElementById('retry-commerce').hidden = commerceReady;
        // The contract supplies a fixed $23 PayPal URL; fail closed if its price changes.
        const paypal = document.getElementById('paypal-link');
        paypal.dataset.priceSupported = String(prices.paypal === 23);
        updateControls();
    }
    function renderPrices() {
        document.querySelectorAll('[data-price]').forEach(el=>{el.textContent=String(prices[el.dataset.price]);});
        const values={...prices,paypalFee:Math.max(0,prices.paypal-prices.crypto)};
        const keys={heroNote:'currentHeroPrice',feeNote:'currentFee',paypalInstructions:'currentPaypal',payPaypal:'currentPaypalButton',
            bankInstructions:'currentBank',cryptoOr:'currentSummary',faq2a:'currentFaqPrice'};
        for(const [keyName,copy] of Object.entries(keys))document.querySelectorAll('[data-i18n="'+keyName+'"]').forEach(el=>{el.textContent=t(copy,values);});
        document.getElementById('paypal-link').hidden=prices.paypal!==23;
        if(prices.paypal!==23)document.querySelector('[data-payment="paypal"] details').open=true;
    }
    form.addEventListener('input', event => {
        if (busy) return;
        const name = event.target.name;
        if (['appName','appType'].includes(name)) field('detailsConfirmed').checked = false;
        if (name === 'testingLink') field('linkConfirmed').checked = false;
        if (name === 'appType') field('licenseConfirmed').checked = false;
        sync();save();
        if (['appType','testingLink','paymentMethod','exchange'].includes(name)) renderPanels();
    });
    form.addEventListener('change', () => {if(!busy){sync();save();renderPanels();}});
    form.addEventListener('submit', event => {
        event.preventDefault(); if (busy) return;
        sync();clearMessages();
        if (state.step === 3) {submit();return;}
        const issue = validate(state.step);
        if (issue) {error(issue);return;}
        if (state.step === 2) {state.testingLink=SiteUtils.normalizeLink(state.testingLink);field('testingLink').value=state.testingLink;}
        setStep(state.step+1,true);save();
    });
    document.getElementById('wizard-back').addEventListener('click',()=>{if(!busy){sync();setStep(Math.max(1,state.step-1),true);save();clearMessages();}});
    document.getElementById('clear-draft').addEventListener('click',()=>{reset();SiteI18n.toast(t('draftReset'));});
    requisitesButton.addEventListener('click',requisites);
    document.getElementById('project-picker').addEventListener('change', event => {
        const project = account?.projects?.find(p=>String(p.app_id) === event.target.value);
        if (!project || busy || boundOrder) return;
        state.appName=project.name || '';state.testingLink=project.testing_link || SiteUtils.normalizeLink(project.package_name);
        state.detailsConfirmed=false;state.linkConfirmed=false;state.groupConfirmed=false;state.countriesConfirmed=false;state.reviewConfirmed=false;
        renderFields();save();
    });
    document.getElementById('receipt').addEventListener('change', event => {
        const file = event.target.files[0];clearReceipt(false);
        if (!file) return;
        if (!SiteUtils.validReceipt(file)) {event.target.value='';error('missingReceipt');return;}
        receiptFile=file;receiptUrl=URL.createObjectURL(file);
        const preview=document.getElementById('receipt-preview');preview.src=receiptUrl;preview.hidden=false;
        document.getElementById('receipt-info').textContent=file.name+' · '+(file.size/1024/1024).toFixed(2)+' MB';
    });
    document.querySelectorAll('[data-payment] a').forEach(link => link.addEventListener('click', event => {
        if (!SiteAPI.isLoggedIn() || !commerceReady || !enabled || (link.id === 'paypal-link' && prices.paypal !== 23)) {
            event.preventDefault();if(!requireSession())return;error('pricesUnavailable');
        }
    }));
    window.addEventListener('save-draft',()=>{sync();save();});
    window.addEventListener('pagehide',()=>{sync();save();});
    window.addEventListener('language-changed',()=>{
        setStep(state.step);renderBank();
        if(lastErrorKey)errorBox.textContent=t(lastErrorKey);
        if(lastSuccess)successBox.textContent=t(lastSuccess.key,{code:lastSuccess.code});
        if(commerceReady)document.getElementById('commerce-state').textContent=t(enabled?'pricesReady':'commerceDisabled');
        if(commerceReady)renderPrices();
        if(account)setAccount(account);
    });
    window.SiteWizard={setAccount,setCommerce,resume,save:()=>{sync();save();},get busy(){return busy;}};
    load();SiteUtils.protect();
})();
