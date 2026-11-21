/* Run against a local static server. Only public trust data can leave the fixture.
   Set DTH_LIVE_TRUST=1 to capture the current dev snapshot for screenshots. */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const origin = 'http://127.0.0.1:5173';
const live = process.env.DTH_LIVE_TRUST === '1';
const capture = process.env.DTH_SCREENSHOTS === '1';
const out = path.join(root, 'artifacts', 'platform');

async function main() {
    const browser = await chromium.launch({channel:'chrome', headless:true});
    const errors = [];
    try {
        await fs.mkdir(out, {recursive:true});
        const mock = await fs.readFile(path.join(__dirname, 'mock.js'), 'utf8');
        // The same measured snapshot is used on all viewports in one pass.
        let snapshot;
        if (live) {
            const context = await browser.newContext();
            const response = await context.request.get('https://dev-api.devtesthub.app/api/web/trust-stats');
            assert.equal(response.status(), 200);
            snapshot = await response.json();
            await context.close();
        }
        const sizes = [[1280,800], [1440,900], [390,844], [360,800]];
        for (const [width,height] of sizes) {
            const context = await browser.newContext({viewport:{width,height},locale:'ru-RU', reducedMotion:'reduce'});
            const page = await context.newPage();
            page.on('pageerror', err => errors.push(err.message));
            await page.route('**/*', async route => {
                const url = new URL(route.request().url());
                if (url.origin !== origin) return route.abort();
                if (url.pathname === '/js/config.js') {
                    const content = await fs.readFile(path.join(root, 'js/config.js'), 'utf8');
                    const setup = snapshot
                        ? 'const fixtureFetch=window.fetch;window.fetch=(url,opts)=>String(url).endsWith("/web/trust-stats")?Promise.resolve(Response.json('+JSON.stringify(snapshot)+')):fixtureFetch(url,opts);'
                        : 'QA.trustMode="valid";';
                    return route.fulfill({contentType:'application/javascript', body:content+'\n'+mock+'\n'+setup});
                }
                return route.continue();
            });
            await page.goto(origin+'/?env=dev#top');
            const routes = ['top','community','services','trust','services/testing','services/growth','community/mutual','community/growth','community/mission','community/rules','build','faq'];
            for (const language of ['ru','en']) {
                await page.evaluate(lang=>SiteI18n.choose(lang),language);
                for (const route of routes) {
                    await page.evaluate(hash=>{location.hash=hash;},route);
                    await page.waitForFunction(hash=>document.querySelector('[data-current]')?.id===hash,route);
                    if (route==='trust' || route==='top') await page.locator('[data-stats-strip] .stats-mini').first().waitFor({state:'attached'});
                    const size=await page.evaluate(()=>({w:document.documentElement.clientWidth,sw:document.documentElement.scrollWidth,h:innerHeight,sh:document.documentElement.scrollHeight}));
                    assert.ok(size.sw<=size.w+1, JSON.stringify({route,language,width,size}));
                    if (route==='top' && width>=1280) assert.ok(size.sh<=size.h+1, JSON.stringify({route,language,width,size}));
                    if(capture && width!==360 && language==='ru' && ['top','community','services','trust','services/testing'].includes(route)) {
                        await page.screenshot({path:path.join(out,route.replace('/','-')+'-'+width+'x'+height+'.png')});
                    }
                }
            }
            for (const [oldHash,newHash] of [['private','services'],['community/published','community/growth']]) {
                await page.evaluate(h=>location.hash=h,oldHash);
                await page.waitForFunction(h=>location.hash==='#'+h && document.querySelector('[data-current]').id===h,newHash);
            }
            await page.goto(origin+'/sample-report.html');
            await page.locator('[data-language="ru"]').click();
            assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
            if(capture && width!==360) await page.screenshot({path:path.join(out,'sample-report-'+width+'x'+height+'.png')});
            await context.close();
            console.log(width+'x'+height+': EN/RU routes, legacy links and sample report fit.');
        }
        assert.deepEqual(errors,[]);
    } finally {
        await browser.close();
    }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
