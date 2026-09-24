import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const ROOT=path.resolve(import.meta.dirname,'..'),OUT=path.join(ROOT,'dist-web-beta');
const build=spawnSync(process.execPath,['scripts/web-static-build.mjs'],{cwd:ROOT,encoding:'utf8'});
if(build.status!==0)throw Error(build.stderr||build.stdout||'Static build failed.');

const mime=file=>({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'}[path.extname(file).toLowerCase()]||'application/octet-stream');
const server=http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{pathname='/';}
  const wanted=pathname==='/'?'index.html':pathname.replace(/^\/+/,''),file=path.normalize(path.join(OUT,wanted)),rel=path.relative(OUT,file);
  if(rel.startsWith('..')||path.isAbsolute(rel)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('not found');return;}
  const data=fs.readFileSync(file);res.writeHead(200,{'content-type':mime(file),'content-length':data.length});res.end(data);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const address=server.address(),BASE='http://127.0.0.1:'+address.port;
let browser;
try{
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},locale:'tr-TR'});
  const page=await context.newPage(),errors=[],apiRequests=[];
  page.on('pageerror',e=>errors.push(String(e?.stack||e)));
  page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/'))apiRequests.push(r.url());});
  await page.goto(BASE+'/?fresh=1',{waitUntil:'domcontentloaded'});
  await page.locator('.welcome.premium-landing-final').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>window.RotaWebBeta),true);
  const resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(x=>x.name));
  assert.equal(resources.filter(x=>/\/questions\/kpss\/.+\/test-[1-4]\.js(?:\?|$)/.test(x)).length,0);
  assert.equal(new Set(resources.filter(x=>/\/runtime\/kpss-bundle\/[a-z0-9-]+\.js(?:\?|$)/.test(x))).size,6);
  assert.equal(apiRequests.length,0,'Static Web Beta must not depend on backend API calls');

  await page.getByRole('button',{name:/Beta bilgisi/}).click();
  await page.getByRole('heading',{name:'Ücretsiz Web Beta'}).waitFor({state:'visible'});
  assert.match((await page.locator('dialog').innerText())||'',/tarayıcıda yerel olarak saklanır/i);
  await page.locator('[data-action="close-modal"]').click();
  await page.locator('.v6-main-cta').click();
  await page.locator('[data-premium-surface="onboarding"]').waitFor({state:'visible'});
  assert.equal(await page.locator('[data-view="teacher"]').count(),0);
  assert.equal(await page.locator('#preview-bar').count(),1);
  assert.equal(await page.locator('#preview-bar').isVisible(),false);
  assert.deepEqual(errors,[]);
  await context.close();
  console.log('Static Web Beta browser passed: zero API dependency, six bundles, direct onboarding, retired surfaces absent.');
} finally {
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
