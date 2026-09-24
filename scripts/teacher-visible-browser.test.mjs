import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {chromium} from 'playwright';

const PORT=Number(process.env.TEACHER_VISIBLE_TEST_PORT||8855),BASE='http://127.0.0.1:'+PORT;
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'rota-teacher-visible-'));
const server=spawn(process.execPath,['server.mjs'],{env:{...process.env,NODE_ENV:'test',RENDER:'false',HOST:'127.0.0.1',PORT:String(PORT),ROTA_DB_PATH:path.join(temp,'fixture.sqlite'),ROTA_APP_ORIGIN:BASE,OPENAI_API_KEY:'',ROTA_MAIL_PROVIDER:'',ROTA_MAIL_API_KEY:''},stdio:['ignore','pipe','pipe']});
let output='',browser;server.stdout.on('data',value=>output+=value);server.stderr.on('data',value=>output+=value);
try{
 for(let i=0;i<100;i++){try{if((await fetch(BASE+'/api/health')).ok)break;}catch{}if(server.exitCode!==null||i===99)throw Error(output||'Fixture server did not start');await new Promise(resolve=>setTimeout(resolve,70));}
 browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage(),errors=[],providerRequests=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(/\/api\/(?:teacher|tts)$/.test(request.url()))providerRequests.push(request.url());});
 await page.goto(BASE,{waitUntil:'networkidle'});await page.evaluate(()=>RotaAccount.ready);
 const registered=await context.request.post(BASE+'/api/auth/register',{headers:{origin:BASE},data:{email:'teacher-ui@example.test',password:'Teacher-visible-fixture-129!',name:'Yerel Öğrenci'}});assert.equal(registered.status(),201);const identity=await registered.json();
 const data=await page.evaluate(()=>{const workspace=RotaCore.workspace('kpss');workspace.configured=true;workspace.profile.completed=true;workspace.profile.summaryConfirmed=true;workspace.settings.name='Yerel Öğrenci';return {workspace,teacherHistory:[],preferences:{}};});
 const saved=await context.request.put(BASE+'/api/workspace',{headers:{origin:BASE,'x-csrf-token':identity.csrfToken,'x-rota-account-id':identity.user.id},data:{baseRevision:0,mutationId:'teacher-visible-fixture',data}});assert.equal(saved.status(),200,await saved.text());
 await page.reload({waitUntil:'networkidle'});await page.evaluate(()=>RotaAccount.ready);assert.equal(await page.evaluate(()=>RotaAccount.user?.id),identity.user.id);
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900});
  if(width===390){await page.locator('.mobile-dock [data-view="today"]').click();await page.locator('.mobile-dock [data-action="menu"]').click();await page.locator('body.menu-open').waitFor();}
  const nav=page.locator('.sidebar [data-action="nav"][data-view="teacher"]');await nav.waitFor({state:'visible'});await nav.click();
  const surface=page.locator('[data-premium-surface="teacher"]');await surface.waitFor({state:'visible'});
  for(const selector of ['#teacher-question','label[for="teacher-photo"]','[data-action="teacher-mic"]','#teacher-form [type="submit"]'])assert.equal(await page.locator(selector).isVisible(),true,width+'px: '+selector+' must actually be visible');
  const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:innerWidth}));assert.ok(size.scroll<=size.inner+2,width+'px teacher page must fit the viewport');
 }
 assert.deepEqual(errors,[]);assert.deepEqual(providerRequests,[],'Viewing the teacher form must never generate a paid AI request');
 console.log('Teacher visible browser passed: real fixture account/workspace, visible desktop and 390px mobile navigation, teacher surface, text/photo/mic/send controls, no AI calls.');
}finally{await browser?.close();if(server.exitCode===null){const stopped=once(server,'exit');server.kill('SIGTERM');await stopped;}fs.rmSync(temp,{recursive:true,force:true});}
