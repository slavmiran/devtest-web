/* Loaded ONLY by qa.html's srcdoc. Production index never imports test files. */
(function(){
 const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),get length(){return map.size;},key:i=>[...map.keys()][i],map};};
 const local=memory(),session=memory();
 Object.defineProperty(window,'localStorage',{value:local});Object.defineProperty(window,'sessionStorage',{value:session});
 const qa={calls:[],orders:[],nextId:50,expire:false,storage:local,mode:'normal',actor:42,loginPayload:null,prices:{crypto:20,paypal:23,bank:23}};
 window.QA=qa;
 const realAppend=Element.prototype.append;
 Element.prototype.append=function(...items){
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
  if(endpoint==='/web/commerce')return response({status:'success',private_testing:{enabled:true,currency:'USD',prices:qa.prices},bust:{enabled:false,packages:[]}});
  if(endpoint==='/web/auth/telegram'){qa.loginPayload=body;return response({status:'success',access_token:'qa-memory-only-'+qa.actor,expires_in:3600,bot_url:'https://t.me/QAReceiptBot?start=web'});}
  if(!options.headers?.get('Authorization'))return response({status:'error',code:'invalid_website_session'},401);
  if(qa.expire){qa.expire=false;return response({status:'error',code:'invalid_website_session'},401);}
  if(endpoint==='/web/me')return response({status:'success',profile:{user_id:qa.actor,username:'qa',full_name:'QA Developer'},balance_bust:123,
   projects:[{app_id:7,name:'Focus Timer',package_name:'com.qa.focus',testing_link:'https://play.google.com/apps/testing/com.qa.focus',status:'active'}],active_orders:qa.orders.filter(o=>o.user_id===qa.actor && o.status!=='cancelled')});
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
