import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const PORT=Number(process.env.ACCOUNT_ACTIONS_TEST_PORT||8855),BASE='http://127.0.0.1:'+PORT,tmp=fs.mkdtempSync(path.join(os.tmpdir(),'rota-account-actions-'));
const server=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:String(PORT),HOST:'127.0.0.1',RENDER:'false',ROTA_DB_PATH:path.join(tmp,'fixture.sqlite')},stdio:['ignore','pipe','pipe']});
let output='',browser;server.stdout.on('data',x=>output+=x);server.stderr.on('data',x=>output+=x);
try{
 for(let i=0;i<100;i++){try{if((await fetch(BASE+'/api/health')).ok)break;}catch{}if(i===99)throw Error(output);await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],sent=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/auth/reset',route=>{sent.push(route.request().postDataJSON());return route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});});
 const token='fixture_'+('a'.repeat(48));await page.goto(BASE+'/account-action.html#mode=reset&token='+token,{waitUntil:'networkidle'});
 assert.ok(!page.url().includes(token));assert.equal(await page.locator('#reset-form').isVisible(),true);assert.equal(sent.length,0,'GET must not consume a one-time token');
 await page.locator('#reset-form [name=password]').fill('new-fixture-password');await page.locator('[name=confirmation]').fill('different-fixture-password');await page.locator('#reset-form button').click();assert.match(await page.locator('#status').innerText(),/aynı olmalı/);assert.equal(sent.length,0);
 await page.locator('[name=confirmation]').fill('new-fixture-password');await page.locator('#reset-form button').click();await page.waitForFunction(()=>document.querySelector('#reset-form').hidden);assert.equal(sent.length,1);assert.deepEqual(sent[0],{token,password:'new-fixture-password'});assert.match(await page.locator('#status').innerText(),/Parolan yenilendi/);assert.equal(await page.evaluate(t=>Object.values(localStorage).some(v=>v.includes(t)),token),false);
 let verifications=0;await page.route('**/api/auth/verify',route=>{verifications++;assert.equal(route.request().postDataJSON().token,token);return route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});});
 await page.goto(BASE+'/account-action.html#mode=verify&token='+token);assert.equal(verifications,0);await page.locator('#verify-form button').click();await page.waitForFunction(()=>document.querySelector('#verify-form').hidden);assert.equal(verifications,1);assert.match(await page.locator('#status').innerText(),/adresin doğrulandı/);
 await page.goto(BASE+'/account-action.html?mode=reset');assert.equal(await page.locator('#reset-form').isVisible(),false);assert.match(await page.locator('#description').innerText(),/Bağlantı eksik/);
 await page.route('**/api/auth/recovery',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({code:'FEATURE_UNAVAILABLE',error:'E-posta hizmeti henüz kullanılamıyor.'})}));
 await page.goto(BASE+'/account-action.html?mode=recovery');await page.locator('[name=email]').fill('fixture@example.test');await page.locator('#recovery-form button').click();await page.waitForFunction(()=>document.querySelector('#status').dataset.error==='true');assert.match(await page.locator('#status').innerText(),/henüz kullanılamıyor/);assert.equal(await page.locator('#recovery-form').isVisible(),true);
 assert.deepEqual(errors,[]);const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:innerWidth}));assert.ok(width.scroll<=width.inner+2);
 console.log('Account action browser passed: explicit verify, password confirmation, hash token cleanup, no token storage, unavailable-mail honesty, mobile. Provider responses mocked; backend token security covered separately.');
}finally{await browser?.close();server.kill('SIGTERM');await new Promise(r=>server.once('exit',r));fs.rmSync(tmp,{recursive:true,force:true});}
