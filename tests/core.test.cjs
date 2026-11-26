/* node --test tests/core.test.cjs — no dependencies, browser, or network. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=name=>fs.readFileSync(path.join(root,'js',name),'utf8');
function storage(){const map=new Map();return {getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,String(value)),removeItem:key=>map.delete(key),map};}
function context(extra={}){const c={URL,URLSearchParams,Headers,FormData,AbortController,Date,Number,JSON,Error,CustomEvent:class{constructor(type){this.type=type;}},setTimeout:()=>1,clearTimeout:()=>{},window:{dispatchEvent:()=>{}},...extra};vm.createContext(c);return c;}
test('environment selection is per-tab, explicit prod exits dev',()=>{
 const session=storage();
 for(const [search,env] of [['?env=dev','dev'],['','dev'],['?env=prod','prod'],['','prod']]){
  const c=context({location:{search},sessionStorage:session,document:{documentElement:{dataset:{}}}});vm.runInContext(source('config.js'),c);
  assert.equal(c.window.SiteConfig.ENV,env);
  assert.equal(c.window.SiteConfig.BOT_USERNAME,env==='dev'?'DevTestHub_bot':'Android12TestersBot');
  assert.equal(c.window.SiteConfig.API_BASE,env==='dev'?'https://dev-api.devtesthub.app/api':'https://devtest-backend.onrender.com/api');
 }
});
test('package identity is exact; malicious or partial links rejected',()=>{
 const c=context();vm.runInContext(source('utils.js'),c);const u=c.window.SiteUtils;
 for(const value of ['com.example.App','https://play.google.com/apps/testing/com.example.App/?hl=en','https://play.google.com/store/apps/details?id=com.example.App','https://play.google.com/apps/testing/com%2Eexample%2EApp'])assert.equal(u.packageId(value),'com.example.App');
 for(const value of ['https://play.google.com.evil.test/apps/testing/com.example.App','https://evil.test?id=com.example.App','https://play.google.com/apps/testing/com.example.App/extra','javascript:alert(1)','http://play.google.com/apps/testing/com.example.App','https://play.google.com:444/apps/testing/com.example.App'])assert.equal(u.packageId(value),'');
 assert.equal(u.exchanges.find(ex=>ex.id==='okx').value,'323906492761830368');
 assert.equal(u.normalizeLink('com.test.app'),'https://play.google.com/apps/testing/com.test.app');
 assert.equal(u.validReceipt({size:5*1024*1024,type:'image/png'}),true);
 assert.equal(u.validReceipt({size:5*1024*1024+1,type:'image/png'}),false);
 assert.equal(u.validReceipt({size:10,type:'application/pdf'}),false);
 assert.equal(u.validReceipt({size:0,type:'image/png'}),false);
});
test('API sends exact login callback, bearer only for private routes, expires on 401',async()=>{
 const calls=[],events=[];
 const callback={id:42,first_name:'Fixture',hash:'fixture',auth_date:123};
 const c=context({SiteConfig:{API_BASE:'https://api.example.invalid/api'},fetch:async(url,options)=>{
  calls.push({url,options});
  if(url.endsWith('/auth/telegram'))return {ok:true,status:200,json:async()=>({status:'success',access_token:'test-only-token',expires_in:3600})};
  return {ok:false,status:401,json:async()=>({status:'error',code:'invalid_website_session'})};
 },window:{dispatchEvent:event=>events.push(event.type)}});
 vm.runInContext(source('api.js'),c);const api=c.window.SiteAPI;
 await api.login(callback);assert.deepEqual(JSON.parse(calls[0].options.body),callback);
 assert.equal(calls[0].options.headers.has('Authorization'),false);
 assert.equal(calls[0].options.credentials,'omit');
 await assert.rejects(()=>api.call('/web/me'),error=>error.status===401);
 assert.equal(calls[1].options.headers.get('Authorization'),'Bearer test-only-token');
 assert.equal(api.isLoggedIn(),false);assert.ok(events.includes('session-expired'));
 assert.ok(!source('api.js').includes('localStorage'));assert.ok(!source('api.js').includes('sessionStorage'));
});
test('SEO artifacts, protected CNAME and all local resources are present',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.equal(fs.readFileSync(path.join(root,'CNAME'),'utf8').trim(),'devtesthub.app');
 assert.ok(html.includes('rel="canonical" href="https://devtesthub.app/"'));
 for(const [,href] of html.matchAll(/(?:src|href)="((?:assets|css|js)\/[^"?#]+)"/g))assert.ok(fs.existsSync(path.join(root,href)),href);
 const schemas=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
 assert.equal(schemas[0]['@type'],'Service');assert.equal(schemas[1]['@type'],'FAQPage');
 assert.equal(schemas[1].mainEntity.length,10);
 const visibleQuestions=[...html.matchAll(/data-i18n="seoFaq\d+q">([^<]+)<\/summary>/g)].map(match=>match[1]);
 assert.deepEqual(schemas[1].mainEntity.map(item=>item.name),visibleQuestions);
 assert.ok(!fs.readFileSync(path.join(root,'js','wizard.js'),'utf8').includes('init_data'));
 assert.ok(!html.includes('telegram-web-app.js'));
});
test('real order days are derived from a verified start date, never fabricated',()=>{
 const c=context();vm.runInContext(source('utils.js'),c);const day=c.window.SiteUtils.orderDay;
 const now=Date.parse('2026-11-19T12:00:00Z');
 assert.equal(day({status:'pending'},now),null);
 assert.equal(day({status:'in_progress'},now),null);
 assert.equal(day({status:'in_progress',started_at:'not a date'},now),null);
 assert.equal(day({status:'in_progress',started_at:'2026-11-20T00:00:00Z'},now),null);
 assert.equal(day({status:'in_progress',started_at:'2026-11-17T12:00:00Z'},now),3);
 assert.equal(day({status:'in_progress',started_at:'2026-11-17T12:00:00'},now),3);
 assert.equal(day({status:'in_progress',started_at:'2026-10-01T00:00:00Z'},now),15);
});
test('full language catalog retains distinct variants and Google/RTL codes',()=>{
 const c=context();vm.runInContext(source('languages.js'),c);const list=c.window.SiteLanguages;
 assert.equal(list.length,56);assert.equal(new Set(list.map(row=>row.code)).size,56);
 for(const code of ['ar','fa','he','ur','pt','pt-br','zh-cn','zh-tw','am','ka','sw'])assert.ok(list.some(row=>row.code===code),code);
 assert.equal(list.find(row=>row.code==='pt-br').googleCode,'pt');
 assert.equal(list.find(row=>row.code==='zh-tw').googleCode,'zh-TW');
 assert.ok(list.every(row=>row.name&&row.english&&row.flag));
 for(const row of list)assert.ok(fs.existsSync(path.join(root,'assets','flags',row.flag.toLowerCase()+'.svg')),row.flag);
});
test('mixed authentication is blocked before any request',async()=>{
 let count=0;
 const c=context({SiteConfig:{API_BASE:'https://api.example.invalid/api'},fetch:async()=>{count++;return {ok:true,status:200,json:async()=>({status:'success',access_token:'fixture',expires_in:3600})};}});
 vm.runInContext(source('api.js'),c);const api=c.window.SiteAPI;await api.login({id:42});
 await assert.rejects(()=>api.call('/guaranteed-test-orders',{method:'POST',body:{init_data:'bad'}}),error=>error.code==='ambiguous_authentication');
 const data=new FormData();data.append('init_data','bad');
 await assert.rejects(()=>api.call('/upload-icon',{method:'POST',body:data}),error=>error.code==='ambiguous_authentication');
 assert.equal(count,1);
});
test('non-JSON 401 still expires the session',async()=>{
 let count=0;const events=[];
 const c=context({SiteConfig:{API_BASE:'https://api.example.invalid/api'},window:{dispatchEvent:e=>events.push(e.type)},fetch:async()=>{
  if(count++===0)return {ok:true,status:200,json:async()=>({status:'success',access_token:'fixture',expires_in:3600})};
  return {ok:false,status:401,json:async()=>{throw new Error('HTML gateway page');}};
 }});
 vm.runInContext(source('api.js'),c);const api=c.window.SiteAPI;await api.login({id:42});
 await assert.rejects(()=>api.call('/web/me'),error=>error.status===401);
 assert.equal(api.isLoggedIn(),false);assert.ok(events.includes('session-expired'));
});
test('a delayed response from the previous session cannot be consumed',async()=>{
 let resolveBody;const c=context({SiteConfig:{API_BASE:'https://api.example.invalid/api'},fetch:async(url)=>{
  if(url.endsWith('/auth/telegram'))return {ok:true,status:200,json:async()=>({status:'success',access_token:'fixture',expires_in:3600})};
  return {ok:true,status:200,json:()=>new Promise(resolve=>{resolveBody=resolve;})};
 }});
 vm.runInContext(source('api.js'),c);const api=c.window.SiteAPI;await api.login({id:42});
 const oldCall=api.call('/web/me');await new Promise(resolve=>setImmediate(resolve));
 api.clearSession();await api.login({id:99});resolveBody({status:'success',profile:{user_id:42}});
 await assert.rejects(()=>oldCall,error=>error.status===401);assert.equal(api.isLoggedIn(),true);
});
test('public chapters, aliases and trust snapshot stay explicit',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const landing=source('landing.js');
 const trust=source('trust.js');
 for(const id of ['top','community','community/mutual','community/growth','community/mission','community/rules','services','services/testing','services/growth','trust','build','faq']){
  assert.ok(html.includes('id="'+id+'"')||html.includes("id='"+id+"'")||html.includes('id="'+id+'"'),id);
  assert.ok(html.includes(id),id);
 }
 assert.ok(landing.includes("['private', 'services']"));
 assert.ok(landing.includes("['community/published', 'community/growth']"));
 assert.ok(landing.includes('dth.community.ack.v4'));
 assert.ok(trust.includes('/web/trust-stats'));
 for(const field of ['production_releases','screenshots_count','screenshot_reports','media_reports_count','device_configurations_count','feedback_total','play_reviews','report_comments','checkins_30d','bug_reports','ideas','countries','active_testers','total_testers','top_countries','all_countries','last_completed_sprint'])assert.ok(trust.includes(field),field);
 assert.ok(!html.includes('stats-method'));
 assert.ok(html.includes('data-stats-geo-toggle'));
 assert.ok(html.includes('id="stats-sprint"'));
 assert.ok(html.includes('homePrivateReview')||html.includes('data-i18n="homePrivateReview"'));
 assert.ok(html.includes('sample-report.html'));
 assert.ok(fs.existsSync(path.join(root,'sample-report.html')));
 assert.ok(fs.readFileSync(path.join(root,'sitemap.xml'),'utf8').includes('sample-report.html'));
});
test('session can be restored and exposes active session state safely',async()=>{
 const c=context({SiteConfig:{API_BASE:'https://api.example.invalid/api'},fetch:async()=>({ok:true,status:200,json:async()=>({status:'success'})})});
 vm.runInContext(source('api.js'),c);const api=c.window.SiteAPI;
 assert.equal(api.isLoggedIn(),false);
 assert.equal(api.restoreSession('',Date.now()+10000),false);
 assert.equal(api.restoreSession('token',Date.now()-1000),false);
 assert.equal(api.restoreSession('token',Date.now()+10000),true);
 assert.equal(api.isLoggedIn(),true);
 assert.equal(api.getSession().token,'token');
 api.clearSession();
 assert.equal(api.isLoggedIn(),false);
 assert.equal(api.getSession(),null);
});

test('chapter routes, Code acknowledgement and shared checkout are wired',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const id of ['community/mutual','community/growth','community/rules','services','services/testing','services/growth','trust']) {
  assert.ok(html.includes('id="'+id+'"'),id);
  assert.ok(html.includes('href="#'+id+'"'),id);
 }
 assert.equal((html.match(/id="order-form"/g)||[]).length,1);
 assert.ok(source('landing.js').includes('dth.community.ack.v4'));
 assert.ok(fs.readFileSync(path.join(root,'sitemap.xml'),'utf8').includes('/sample-report.html'));
});
