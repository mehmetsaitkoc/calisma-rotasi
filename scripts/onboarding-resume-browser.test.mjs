import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const PORT=Number(process.env.ONBOARDING_RESUME_TEST_PORT||8856),BASE='http://127.0.0.1:'+PORT,KEY='calisma-rotasi:all:v5';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'rota-onboarding-'));
const server=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:String(PORT),HOST:'127.0.0.1',RENDER:'false',NODE_ENV:'test',ROTA_DB_PATH:path.join(tmp,'test.sqlite')},stdio:['ignore','pipe','pipe']});
let output='',browser;server.stdout.on('data',x=>output+=x);server.stderr.on('data',x=>output+=x);
try{
 for(let i=0;i<100;i++){try{if((await fetch(BASE+'/api/health')).ok)break;}catch{}if(i===99)throw Error(output);await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(BASE,{waitUntil:'networkidle'});await page.evaluate(()=>RotaAccount.ready);
 await page.locator('.v6-main-cta[data-action="choose-exam"][data-exam="kpss"]').click();await page.locator('#setup-wizard-form [type=submit]').click();
 await page.reload({waitUntil:'networkidle'});await page.evaluate(()=>RotaAccount.ready);assert.equal(await page.locator('[name=targetNet]').count(),1,'Refresh resumes the goals stage');
 for(const [name,value] of [['targetScore','85'],['dailyMinutes','240']])await page.locator(`[name="${name}"][value="${value}"]`).evaluate(el=>{el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}));});
 await page.locator('[name=targetNet]').fill('82');await page.locator('#setup-wizard-form [type=submit]').click();
 await page.reload({waitUntil:'networkidle'});await page.evaluate(()=>RotaAccount.ready);assert.equal(await page.locator('[name=currentNetApprox]').count(),6,'Refresh resumes the analysis stage');
 const data=await page.evaluate(key=>({workspace:JSON.parse(localStorage.getItem(key)).workspaces.kpss,preferences:JSON.parse(localStorage.getItem(key+':preferences')),teacherHistory:[]}),KEY);
 assert.equal(data.workspace.profile.targetNet,82);assert.equal(data.preferences.onboardingStep,2);
 const registration=await page.request.post(BASE+'/api/auth/register',{headers:{Origin:BASE},data:{email:'onboarding@example.test',password:'onboarding-fixture-password',name:'Deniz'}});assert.equal(registration.status(),201);const auth=await registration.json();
 const write=await page.request.put(BASE+'/api/workspace',{headers:{Origin:BASE,'X-CSRF-Token':auth.csrfToken,'X-Rota-Account-Id':auth.user.id},data:{baseRevision:0,mutationId:'onboarding-fixture-save',data}});assert.equal(write.status(),200);
 const device=await browser.newContext(),second=await device.newPage();second.on('pageerror',e=>errors.push(e.message));
 const login=await second.request.post(BASE+'/api/auth/login',{headers:{Origin:BASE},data:{email:'onboarding@example.test',password:'onboarding-fixture-password'}});assert.equal(login.status(),200);
 await second.goto(BASE,{waitUntil:'networkidle'});await second.evaluate(()=>RotaAccount.ready);assert.equal(await second.locator('[name=currentNetApprox]').count(),6,'A second device resumes the server-backed onboarding stage');
 await second.locator('[data-action=setup-prev]').click();assert.equal(await second.locator('[name=targetNet]').inputValue(),'82');
 await second.evaluate(()=>RotaAccount.flush());await second.reload({waitUntil:'networkidle'});await second.evaluate(()=>RotaAccount.ready);assert.equal(await second.locator('[name=targetNet]').inputValue(),'82');
 assert.deepEqual(errors,[]);console.log('PASS partial onboarding: guest refresh, submitted goal preservation, second-device login, back-step persistence; no browser errors.');
}finally{await browser?.close();server.kill('SIGTERM');await new Promise(r=>server.once('exit',r));fs.rmSync(tmp,{recursive:true,force:true});}
