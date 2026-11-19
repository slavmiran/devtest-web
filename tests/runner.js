(async function(){
 const frame=document.getElementById('app'),result=document.getElementById('result');
 const source=await (await fetch('../index.html')).text();
 const prepared=source.replace('<head>','<head><base href="/">').replace('<script src="js/config.js"></script>','<script src="js/config.js"></script><script src="tests/mock.js"></script>');
 const ready=new Promise(resolve=>frame.addEventListener('load',resolve,{once:true}));frame.srcdoc=prepared;await ready;
 result.textContent='Ready. The embedded page uses isolated in-memory storage and a mocked API.';
 document.getElementById('reset').onclick=()=>location.reload();
 document.getElementById('run').onclick=async()=>{
  const w=frame.contentWindow,d=w.document,qa=w.QA;let count=0;const lines=[];
  function ok(value,label){if(!value)throw new Error(label);count++;lines.push('PASS '+label);result.textContent=lines.join('\n');}
  function fits(label){ok(d.documentElement.scrollWidth<=d.documentElement.clientWidth,'no overflow: '+label);}
  const wait=async predicate=>{for(let i=0;i<100;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,20));}throw new Error('Timed out waiting for app state');};
  function change(name,value){const input=d.querySelector('[name="'+name+'"]');if(input.type==='checkbox')input.checked=value;else input.value=value;input.dispatchEvent(new w.Event('input',{bubbles:true}));input.dispatchEvent(new w.Event('change',{bubbles:true}));}
  function radio(name,value){d.querySelector('[name="'+name+'"][value="'+value+'"]').click();}
  function next(){d.getElementById('order-form').requestSubmit();}
  function receipt(){const file=new w.File([new Uint8Array([137,80,78,71,13,10,26,10,1])],'qa.png',{type:'image/png'});const dt=new w.DataTransfer();dt.items.add(file);d.getElementById('receipt').files=dt.files;d.getElementById('receipt').dispatchEvent(new w.Event('change',{bubbles:true}));}
  function setup(method){
   change('appName','QA '+method);change('detailsConfirmed',true);next();
   change('testingLink','https://play.google.com/store/apps/details?id=com.qa.'+method);change('linkConfirmed',true);
   ['groupConfirmed','countriesConfirmed','reviewConfirmed'].forEach(name=>change(name,true));next();radio('paymentMethod',method);
  }
  try{
   document.getElementById('run').disabled=true;
   ok(qa.widget.src==='https://telegram.org/js/telegram-widget.js?22' && qa.widget.access==='write' && qa.widget.onauth==='onTelegramAuth(user)','official iframe widget attributes');
   ok(!qa.calls.some(call=>call.endpoint==='/web/me'),'account not requested before sign-in');
   await w.onTelegramAuth({id:42,first_name:'QA',auth_date:123,hash:'fixture'});await wait(()=>!d.getElementById('signed-in').hidden);
   ok(qa.loginPayload.id===42 && Object.keys(qa.loginPayload).length===4,'widget callback sent unchanged');
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
   ok(qa.storage.getItem('dth.draft.v1.prod.42').includes('Survives expiry'),'401 preserves actor-scoped draft');
   await w.onTelegramAuth({id:42,first_name:'QA',auth_date:123,hash:'fixture'});await wait(()=>!d.getElementById('signed-in').hidden);
   ok(d.getElementById('app-name').value==='Survives expiry','reauthentication restores draft');
   ok([...qa.storage.map.values()].every(value=>!value.includes('qa-memory-only')),'bearer token never stored persistently');
   ok(qa.calls.filter(call=>call.endpoint!=='/web/auth/telegram'&&call.endpoint!=='/web/commerce').every(call=>call.headers.get('Authorization')?.startsWith('Bearer ') && (!call.body || call.body instanceof w.FormData || !('init_data' in call.body))),'all private requests use bearer without init_data');
   ok(d.querySelectorAll('input:not(.notranslate),select:not(.notranslate),code:not(.notranslate),a:not(.notranslate)').length===0,'critical values and fields protected from translation');
   ok(d.querySelector('.phase-card form')===null,'disabled BUST capability never renders a payment form');
   const width=d.documentElement.clientWidth;ok(d.documentElement.scrollWidth<=width,'no horizontal overflow at '+width+' CSS px');
   d.getElementById('logout').click();qa.actor=99;await w.onTelegramAuth({id:99,first_name:'Other',auth_date:123,hash:'fixture'});await wait(()=>d.getElementById('profile-id').textContent.includes('99'));
   ok(d.getElementById('app-name').value==='' && !d.getElementById('orders-list').textContent.includes('QA bank'),'switching user isolates previous orders and draft');
   qa.prices={crypto:25,paypal:28,bank:28};await w.SiteApp.loadCommerce();
   ok(d.querySelector('[data-price="crypto"]').textContent==='25' && d.getElementById('paypal-link').hidden,'commerce prices update UI and a mismatched fixed PayPal URL is hidden');
   result.textContent=lines.join('\n')+'\n\n'+count+' browser regressions passed.';
  }catch(error){result.textContent=lines.join('\n')+'\nFAIL '+error.message;}
 };
 document.getElementById("run").disabled=false;
})();
