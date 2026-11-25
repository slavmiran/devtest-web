/* Loaded ONLY by qa.html's srcdoc. Production index never imports test files. */
(function(){
 const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),get length(){return map.size;},key:i=>[...map.keys()][i],map};};
 const local=memory(),session=memory();
 Object.defineProperty(window,'localStorage',{value:local});Object.defineProperty(window,'sessionStorage',{value:session});
 const cookies=new Map();
 Object.defineProperty(document,'cookie',{get:()=>[...cookies].map(([key,value])=>key+'='+value).join('; '),set:value=>{
  const pair=value.split(';')[0],split=pair.indexOf('=');
  if(/max-age=0(?:;|$)/i.test(value))cookies.delete(pair.slice(0,split));else cookies.set(pair.slice(0,split),pair.slice(split+1));
 }});
 const qa={calls:[],orders:[],nextId:50,expire:false,storage:local,mode:'normal',actor:42,loginPayload:null,prices:{crypto:23,paypal:23,bank:23}};
 window.QA=qa;
 // srcdoc has no navigable document path. Real hash/back behavior is also
 // checked on the top-level local site, outside this isolated fixture.
 if (location.href==='about:srcdoc') {
  history.pushState=(_state,_title,url)=>{qa.hashURL=url;};
  history.replaceState=(_state,_title,url)=>{qa.hashURL=url;};
 }
 const realAppend=Element.prototype.append;
 Element.prototype.append=function(...items){
  const translation=items.find(item=>item?.tagName==='SCRIPT'&&item.src.includes('translate.google.com'));
  if(translation){
   window.google={translate:{TranslateElement:function(){}}};
   const select=document.createElement('select');select.className='goog-te-combo';
   [...new Set(SiteLanguages.map(row=>row.googleCode))].forEach(code=>select.append(new Option(code,code)));
   realAppend.call(document.getElementById('google_translate_element'),select);
   queueMicrotask(()=>window.googleTranslateElementInit());return;
  }
  if(this.id==='telegram-login'){
   const script=items.find(item=>item?.tagName==='SCRIPT');
   if(script){qa.widget={src:script.src,bot:script.getAttribute('data-telegram-login'),onauth:script.getAttribute('data-onauth'),access:script.getAttribute('data-request-access')};const button=document.createElement('button');button.textContent='Mock Telegram login (test only)';button.onclick=()=>window.onTelegramAuth({id:qa.actor,first_name:'QA',auth_date:123,hash:'fixture'});return realAppend.call(this,button);}
  }
  return realAppend.apply(this,items);
 };
 const response=(content,status=200)=>new Response(JSON.stringify(content),{status,headers:{'Content-Type':'application/json'}});
 window.fetch=async(url,options={})=>{
  if(!String(url).startsWith(SiteConfig.API_BASE))throw new Error('QA blocked external request');
  const endpoint=String(url).slice(SiteConfig.API_BASE.length);
  const body=options.body instanceof FormData?options.body:options.body?JSON.parse(options.body):null;
  qa.calls.push({endpoint,method:options.method||'GET',headers:options.headers,body});
  if(endpoint==='/web/trust-stats'){
   if(!qa.trustMode)return response({detail:'website_trust_stats_unavailable'},503);
   return response({status:'success',updated_at:'2026-11-21T09:00:00Z',
    metrics:{production_releases:12,screenshot_reports:qa.trustMode==='invalid'?null:75,checkins_30d:42,bug_reports:0,ideas:8,
     countries:2,active_testers:4,total_testers:9,top_countries:[{code:'TR',active:3,total:6,share_pct:66.7}]}});
  }
  if(endpoint==='/web/commerce')return response({status:'success',private_testing:{enabled:true,currency:'USD',prices:qa.prices},bust:{enabled:false,packages:[]}});
  if(endpoint==='/web/auth/telegram'){
   qa.loginPayload=body;
   if(qa.mode==='authnetwork')throw new TypeError('QA network/CORS unavailable');
   if(qa.mode.startsWith('auth')&&qa.mode!=='normal')return response({status:'error',code:'fixture_auth_error'},Number(qa.mode.slice(4)));
   return response({status:'success',access_token:'qa-memory-only-'+qa.actor,expires_in:3600,bot_url:'https://t.me/QAReceiptBot?start=web'});
  }
  if(!options.headers?.get('Authorization'))return response({status:'error',code:'invalid_website_session'},401);
  if(qa.expire){qa.expire=false;return response({status:'error',code:'invalid_website_session'},401);}
  if(endpoint==='/web/me'){
   if(qa.mode==='me503')return response({status:'error',code:'website_account_unavailable'},503);
   return response({status:'success',profile:{user_id:qa.actor,username:'qa',full_name:'QA Developer'},balance_bust:123,
    projects:[{app_id:7,name:'Focus Timer',package_name:'com.qa.focus',testing_link:'https://play.google.com/apps/testing/com.qa.focus',status:'active'}],active_orders:qa.orders.filter(o=>o.user_id===qa.actor && o.status!=='cancelled').concat(qa.actor===42?[{id:8,user_id:42,public_code:'GT-PROGRESS',status:'in_progress',app_name:'Timeline fixture'}]:[])});
  }
  if(endpoint==='/guaranteed-test-orders/mine')return response({status:'success',orders:[{id:8,user_id:42,started_at:new Date(Date.now()-2*86400000).toISOString(),completion_date:'2026-12-01'},{id:900,user_id:99,started_at:'2020-01-01T00:00:00Z'}]});
  if(endpoint==='/upload-icon')return response({status:'success',url:'/telegram-media/qa_receipt',file_id:'qa_receipt'});
  if(endpoint==='/guaranteed-test-orders'){
   const order={...body,id:++qa.nextId,public_code:'GT-QA'+qa.nextId,user_id:qa.actor,status:body.create_mode==='requisites'?'awaiting_payment':'pending'};
   qa.orders.push(order);return response({status:'success',order});
  }
  const match=endpoint.match(/^\/guaranteed-test-orders\/(\d+)\/(attach-proof|cancel)$/);
  if(match){const order=qa.orders.find(o=>o.id===Number(match[1])&&o.user_id===qa.actor);if(!order)return response({status:'error',code:'order_forbidden'},403);
   if(match[2]==='cancel')order.status='cancelled';else {order.status='pending';order.notes+='; proof='+body.proof_url;}return response({status:'success',order});}
  return response({status:'error',code:'unexpected_qa_request'},400);
 };
})();
