(async function(){
 const frame=document.getElementById('app'),result=document.getElementById('result');
 const source=await (await fetch('../index.html')).text();
 const prepared=source.replace('<head>','<head><base href="'+new URL('../',location.href).href+'">').replace(/<script src="js\/config\.js(?:\?[^"]*)?"><\/script>/, '$&<script src="tests/mock.js"></script>');
 const ready=new Promise(resolve=>frame.addEventListener('load',resolve,{once:true}));frame.srcdoc=prepared;await ready;
 result.textContent='Ready. The embedded page uses isolated in-memory storage and a mocked API.';
 document.getElementById('reset').onclick=()=>location.reload();
 document.getElementById('run').onclick=async()=>{
  const w=frame.contentWindow,d=w.document,qa=w.QA;let count=0;const lines=[];
  function ok(value,label){if(!value)throw new Error(label);count++;lines.push('PASS '+label);result.textContent=lines.join('\n');}
  function fits(label){
   const panes=[...d.querySelectorAll('.drawer:not([hidden]) .drawer-scroll')];
   ok(d.documentElement.scrollWidth<=d.documentElement.clientWidth && panes.every(pane=>pane.scrollWidth<=pane.clientWidth+1),'no overflow: '+label);
  }
  const wait=async predicate=>{for(let i=0;i<100;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,20));}throw new Error('Timed out waiting for app state');};
  function change(name,value){const input=d.querySelector('[name="'+name+'"]');if(input.type==='checkbox')input.checked=value;else input.value=value;input.dispatchEvent(new w.Event('input',{bubbles:true}));input.dispatchEvent(new w.Event('change',{bubbles:true}));}
  function radio(name,value){d.querySelector('[name="'+name+'"][value="'+value+'"]').click();}
  function next(){d.getElementById('order-form').requestSubmit();}
  function receipt(){const file=new w.File([new Uint8Array([137,80,78,71,13,10,26,10,1])],'qa.png',{type:'image/png'});const dt=new w.DataTransfer();dt.items.add(file);d.getElementById('receipt').files=dt.files;d.getElementById('receipt').dispatchEvent(new w.Event('change',{bubbles:true}));}
  function setup(method){
   w.SiteDrawers.open('order');
   change('appName','QA '+method);change('detailsConfirmed',true);next();
   change('testingLink','https://play.google.com/store/apps/details?id=com.qa.'+method);change('linkConfirmed',true);
   ['groupConfirmed','countriesConfirmed','reviewConfirmed'].forEach(name=>change(name,true));next();radio('paymentMethod',method);
  }
  try{
   document.getElementById('run').disabled=true;
   const retryStats=d.querySelector('[data-stats-retry]');
   await wait(()=>!retryStats.hidden);
   ok(d.getElementById('stats-overview').hidden && d.querySelector('[data-stats-strip]').hidden,'503 shows the public digest instead of invented counters');
   qa.trustMode='invalid';retryStats.click();await wait(()=>!retryStats.disabled);
   ok(d.getElementById('stats-overview').hidden,'missing screenshot count cannot become a zero');
   qa.trustMode='ready';retryStats.click();await wait(()=>!d.getElementById('stats-overview').hidden);
   ok(d.querySelector('[data-count="screenshot_reports"]').textContent==='75' && d.querySelector('[data-count="bug_reports"]').textContent==='0','valid screenshot count and a real zero render');
   ok(d.querySelector('[data-stats-countries] tr') && d.querySelector('[data-stats-strip]').childElementCount===5,'one response populates geography and five home counters');
   ok(qa.calls.filter(c=>c.endpoint==='/web/trust-stats').every(c=>c.method==='GET' && !c.headers.has('Authorization')),'community statistics never send bearer credentials');
   ok(qa.widget.src==='https://telegram.org/js/telegram-widget.js?22' && qa.widget.access==='write' && qa.widget.onauth==='onTelegramAuth(user)','official iframe widget attributes');
   ok(!qa.calls.some(call=>call.endpoint==='/web/me'),'account not requested before sign-in');
   change('appName','Before login outage');
   for(const mode of ['auth404','auth503','auth401','authnetwork']){
    qa.mode=mode;await w.onTelegramAuth({id:42,first_name:'QA',auth_date:123,hash:'fixture'});
    ok(!w.SiteAPI.isLoggedIn() && !d.getElementById('toast').hidden && !d.getElementById('account-retry').hidden && w.SiteDrawers.active==='account','visible auth error and retry: '+mode);
   }
   qa.mode='normal';
   qa.mode='me503';await w.onTelegramAuth({id:42,first_name:'QA',auth_date:123,hash:'fixture'});
   ok(w.SiteAPI.isLoggedIn() && !d.getElementById('account-reset-session').hidden && !d.getElementById('account-retry').hidden,'accepted login with failed profile still offers retry and sign out');
   d.getElementById('account-reset-session').click();
   ok(!w.SiteAPI.isLoggedIn() && d.getElementById('app-name').value==='Before login outage','failed profile load allows sign out without losing the guest draft');
   qa.mode='normal';
   await w.onTelegramAuth({id:42,first_name:'QA',auth_date:123,hash:'fixture'});await wait(()=>!d.getElementById('signed-in').hidden);
   ok(qa.loginPayload.id===42 && Object.keys(qa.loginPayload).length===4,'widget callback sent unchanged');
   ok(w.SiteDrawers.active==='account' && d.getElementById('page-shell').inert,'successful login automatically opens modal account');
   ok([...qa.storage.map.values()].every(value=>!value.includes('qa-memory-only')), 'active profile switcher never persists a live bearer token');
   ok(d.getElementById('header-profile-name').textContent==='@qa' && d.getElementById('header-balance').textContent.includes('123'),'profile chip reflects authenticated account');
   ok(d.getElementById('projects-list').textContent.includes('Focus Timer'),'account lists project cards');
   await wait(()=>d.querySelector('.order-timeline'));
   ok(d.querySelector('.order-timeline').textContent.includes('3 / 15'),'real order timeline uses authenticated start date');
   ok(!d.getElementById('orders-list').textContent.includes('900'),'timeline enrichment excludes foreign orders');
   d.querySelector('#projects-list button').click();
   ok(w.SiteDrawers.active==='order' && d.getElementById('app-name').value==='Focus Timer','project action opens order drawer with owned prefill');
   ok(d.getElementById('bot-receipt-link').href==='https://t.me/QAReceiptBot?start=web','receipt bot URL comes from login response');
   d.getElementById('project-picker').value='7';d.getElementById('project-picker').dispatchEvent(new w.Event('change',{bubbles:true}));
   ok(d.getElementById('app-name').value==='Focus Timer' && d.getElementById('testing-link').value.endsWith('/com.qa.focus'),'project prefill uses account projects');
   d.querySelector('[data-lang="ru"]').click();ok(d.documentElement.lang==='ru' && d.getElementById('app-name').value==='Focus Timer','native RU preserves form values');
   d.querySelector('[data-lang="en"]').click();
   radio('appType','paid');ok(!d.getElementById('license-panel').hidden,'paid app license guide');radio('appType','free');
   setup('crypto');fits('crypto payment');receipt();change('paymentConfirmed',true);next();next();await wait(()=>qa.orders.length===1 && !w.SiteWizard.busy);
   const crypto=qa.calls.find(call=>call.endpoint==='/guaranteed-test-orders' && call.body.payment_method==='crypto');
   ok(crypto.body.amount_usd===20 && crypto.body.testing_link==='https://play.google.com/apps/testing/com.qa.crypto' && crypto.body.notes.includes('proof=/telegram-media/qa_receipt'),'crypto order and durable proof URL');
   ok(qa.calls.filter(call=>call.endpoint==='/guaranteed-test-orders').length===1,'double submit does not create two orders');
   const upload=qa.calls.find(call=>call.endpoint==='/upload-icon');ok(upload.body.get('upload_kind')==='payment_proof' && !upload.body.has('init_data') && !upload.body.has('user_id'),'multipart receipt contract');
   setup('paypal');fits('PayPal payment');ok(d.getElementById('paypal-link').href==='https://paypal.me/devtesthub/23USD','direct PayPal payment URL');receipt();change('paymentConfirmed',true);next();await wait(()=>qa.orders.length===2 && !w.SiteWizard.busy);
   ok(qa.orders[1].payment_method==='paypal' && qa.orders[1].amount_usd===23,'PayPal order uses $23');
   setup('bank');change('currency','KZT');change('bankName','Kaspi');d.getElementById('request-requisites').click();await wait(()=>qa.orders.length===3 && !w.SiteWizard.busy);
   const bank=qa.orders[2];ok(bank.payment_method==='bank' && bank.create_mode==='requisites' && bank.status==='awaiting_payment','bank requisites order before proof ('+bank.payment_method+','+bank.create_mode+','+bank.status+')');
   ok(d.getElementById('manager-chat').href.startsWith('https://t.me/garantXchange?text=') && d.getElementById('manager-chat').href.includes('Kaspi'),'manager chat carries order and currency');
   d.querySelector('[data-lang="ru"]').click();fits('Russian bank form and order actions');d.querySelector('[data-lang="en"]').click();
   receipt();change('paymentConfirmed',true);next();await wait(()=>bank.status==='pending' && !w.SiteWizard.busy);
   ok(qa.orders.length===3 && qa.calls.some(call=>call.endpoint.endsWith('/'+bank.id+'/attach-proof')),'bank attaches proof to existing order without duplicate');
   change('appName','Survives expiry');w.SiteWizard.save();qa.expire=true;await w.SiteApp.refreshAccount();
   ok(!w.SiteAPI.isLoggedIn() && !d.getElementById('signed-out').hidden && d.getElementById('profile-name').textContent==='','401 clears session and private UI');
   ok(qa.storage.getItem('dth.draft.v1.'+w.SiteConfig.ENV+'.42').includes('Survives expiry'),'401 preserves actor-scoped draft');
   await w.onTelegramAuth({id:42,first_name:'QA',auth_date:123,hash:'fixture'});await wait(()=>!d.getElementById('signed-in').hidden);
   ok(d.getElementById('app-name').value==='Survives expiry','reauthentication restores draft');
   ok([...qa.storage.map.values()].every(value=>!value.includes('qa-memory-only')),'bearer token never stored persistently');
   const publicCalls=['/web/auth/telegram','/web/commerce','/web/trust-stats'];
   ok(qa.calls.filter(call=>!publicCalls.includes(call.endpoint)).every(call=>call.headers.get('Authorization')?.startsWith('Bearer ') && (!call.body || call.body instanceof w.FormData || !('init_data' in call.body))),'all private requests use bearer without init_data');
   ok(d.querySelectorAll('input:not(.notranslate),select:not(.notranslate),code:not(.notranslate),a:not(.notranslate)').length===0,'critical values and fields protected from translation');
   ok(d.querySelector('.phase-card form')===null,'disabled BUST capability never renders a payment form');
   const width=d.documentElement.clientWidth;ok(d.documentElement.scrollWidth<=width,'no horizontal overflow at '+width+' CSS px');
   d.getElementById('logout').click();qa.actor=99;await w.onTelegramAuth({id:99,first_name:'Other',auth_date:123,hash:'fixture'});await wait(()=>d.getElementById('profile-id').textContent.includes('99'));
   ok(d.getElementById('app-name').value==='' && !d.getElementById('orders-list').textContent.includes('QA bank'),'switching user isolates previous orders and draft');
   qa.prices={crypto:25,paypal:28,bank:28};await w.SiteApp.loadCommerce();
   ok(d.querySelector('[data-price="crypto"]').textContent==='25' && d.getElementById('paypal-link').hidden,'commerce prices update UI and a mismatched fixed PayPal URL is hidden');
   qa.mode='me503';await w.SiteApp.refreshAccount();
   ok(!d.getElementById('account-retry').hidden && d.getElementById('account-status').textContent.includes('503'),'account API failure is visible with retry');
   qa.mode='normal';await w.SiteApp.refreshAccount();
   w.SiteDrawers.close({immediate:true});
   d.getElementById('account-trigger').focus();w.SiteDrawers.open('account');
   d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
   await wait(()=>d.getElementById('account').hidden);
   ok(!d.getElementById('page-shell').inert && d.activeElement===d.getElementById('account-trigger'),'Escape closes panel and restores trigger focus');
   w.SiteDrawers.open('order');d.getElementById('drawer-backdrop').click();await wait(()=>d.getElementById('order').hidden);
   ok(w.SiteDrawers.active===null,'outside click closes drawer');
   w.SiteDrawers.open('language');
   d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Tab',bubbles:true}));
   const languageClose=d.querySelector('#language [data-close-drawer]');
   ok(d.activeElement===languageClose,'Tab enters the active dialog rather than the inert landing page');
   d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true}));
   ok(d.activeElement===d.querySelector('#language-grid button:last-child'),'Shift+Tab wraps inside the dialog');
   languageClose.click();await wait(()=>d.getElementById('language').hidden);
   ok(w.SiteDrawers.active===null,'close button dismisses drawer');
   w.SiteDrawers.open('language');
   ok(d.querySelectorAll('#language-grid button').length===56 && !d.querySelector('#more-languages'),'full dark language grid replaces system select');
   d.getElementById('language-search').value='עברית';d.getElementById('language-search').dispatchEvent(new w.Event('input',{bubbles:true}));
   ok(d.querySelectorAll('#language-grid button').length===1,'language search finds a native name');
   d.getElementById('language-search').value='';d.getElementById('language-search').dispatchEvent(new w.Event('input',{bubbles:true}));
   d.querySelector('[data-lang="ar"]').click();await wait(()=>d.documentElement.dir==='rtl');
   ok(d.documentElement.lang==='ar' && d.documentElement.dir==='rtl','Arabic selection uses RTL');
   ok(w.SiteDrawers.active===null,'language selection dismisses the picker');
   d.querySelector('[data-lang="he"]').click();
   ok(d.documentElement.lang==='he' && d.documentElement.dir==='rtl','Hebrew selection uses RTL');
   fits('RTL language drawer');
   w.SiteDrawers.close({immediate:true});
   result.textContent=lines.join('\n')+'\n\n'+count+' browser regressions passed.';
  }catch(error){result.textContent=lines.join('\n')+'\nFAIL '+error.message;}
 };
 document.getElementById("run").disabled=false;
})();
