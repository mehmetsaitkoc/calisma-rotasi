import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {chromium} from 'playwright';

// Real application + isolated local SQLite only. No production or AI provider calls.
const PORT=Number(process.env.ACCOUNT_BROWSER_PORT||8852),BASE='http://127.0.0.1:'+PORT,KEY='calisma-rotasi:all:v5';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'rota-account-browser-')),pass='Local-fixture-129!',errors=[];
const server=spawn(process.execPath,['server.mjs'],{env:{...process.env,HOST:'127.0.0.1',PORT:String(PORT),NODE_ENV:'test',RENDER:'false',ROTA_DB_PATH:path.join(temp,'accounts.sqlite'),ROTA_APP_ORIGIN:BASE,OPENAI_API_KEY:''},stdio:['ignore','pipe','pipe']});
let output='',browser;server.stdout.on('data',x=>output+=x);server.stderr.on('data',x=>output+=x);
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function open(context){const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(BASE,{waitUntil:'networkidle'});await page.evaluate(()=>RotaAccount.ready);return page;}
async function login(page,email,{register=false}={}){await page.evaluate(mode=>RotaAccount.login(mode),register?'register':'login');if(register)await page.locator('#account-form [name="name"]').fill('Yerel Test');await page.locator('#account-form [name="email"]').fill(email);await page.locator('#account-form [name="password"]').fill(pass);await page.locator('#account-form [type="submit"]').click();await page.waitForFunction(email=>RotaAccount.user?.email===email&&RotaAccount.status==='synced',email);}
async function cloud(page){return page.evaluate(()=>RotaAccount.json('/api/workspace'));}
async function cached(page){return page.evaluate(()=>JSON.parse(localStorage.getItem(RotaAccountSync.accountKey(RotaAccount.user.id))));}
async function closeModal(page){const close=page.locator('#modal[open] [data-action="close-modal"]').last();if(await close.count())await close.click();}
async function addLog(page,title){await closeModal(page);await page.locator('[data-action="add-log"]').first().click();const f=page.locator('#log-form');await f.locator('[name="subjectId"]').selectOption('k-ma');await f.locator('[name="title"]').fill(title);await f.locator('[name="minutes"]').fill('20');await f.locator('[name="questions"]').fill('10');await f.locator('[type="submit"]').click();await f.waitFor({state:'hidden'});}
async function editLog(page,id,title){await closeModal(page);await page.locator('.sidebar [data-action="nav"][data-view="log"]').click();await page.locator('[data-action="edit-log"][data-id="'+id+'"]').click();const f=page.locator('#log-form');await f.locator('[name="title"]').fill(title);await f.locator('[type="submit"]').click();await f.waitFor({state:'hidden'});}
async function sync(page){await page.evaluate(()=>RotaAccount.flush());await page.waitForFunction(()=>!['syncing','pending'].includes(RotaAccount.status));return page.evaluate(()=>RotaAccount.status);}
async function chooseConflicts(page,choice='local'){if(await page.evaluate(()=>RotaAccount.status)!=='conflict')return;await page.evaluate(()=>RotaAccount.open());await page.locator('[data-account-action="conflicts"]').click();const selects=page.locator('#account-conflicts select');for(let i=0;i<await selects.count();i++)await selects.nth(i).selectOption(choice);await page.locator('#account-conflicts [type="submit"]').click();await page.waitForFunction(()=>RotaAccount.status==='synced');await closeModal(page);}
async function logout(page){await page.evaluate(()=>RotaAccount.open());await page.locator('[data-account-action="logout"]').click();await page.waitForFunction(()=>RotaAccount.user===null);}
try{
 for(let i=0;i<100;i++){try{if((await fetch(BASE+'/api/health')).ok)break;}catch{}if(server.exitCode!==null)throw Error(output);await pause(70);}
 browser=await chromium.launch({headless:true});
 const deviceA=await browser.newContext({viewport:{width:1280,height:900}}),deviceB=await browser.newContext({viewport:{width:1280,height:900}});
 const a=await open(deviceA);
 const nativeLinks=await a.evaluate(()=>{const native=RotaNative;try{window.RotaNative={...native,isNative:true,apiBase:'https://native-fixture.invalid'};RotaAccount.login('register');const privacy=document.querySelector('#account-form a').href;RotaAccount.login('login');return {privacy,recovery:document.querySelector('#account-form a').href};}finally{window.RotaNative=native;}});assert.equal(nativeLinks.privacy,'https://native-fixture.invalid/privacy.html');assert.equal(nativeLinks.recovery,'https://native-fixture.invalid/account-action.html?mode=recovery');await closeModal(a);console.log('PASS native public links use approved HTTPS API origin without navigating');
 await a.evaluate(key=>{const state=RotaCore.fresh(),w=state.workspaces.kpss;state.activeExam='kpss';w.configured=true;w.profile.completed=true;w.profile.summaryConfirmed=true;w.settings.name='Misafir';w.logs=[{id:'guest-log',date:RotaCore.iso(),subjectId:'k-ma',title:'Misafir çalışması',minutes:20,questions:10,note:'',sessionId:''}];localStorage.setItem(key,JSON.stringify(state));},KEY);
 await a.reload({waitUntil:'networkidle'});await a.evaluate(()=>RotaAccount.ready);
 await login(a,'student-a@example.test',{register:true});
 assert.equal((await cached(a)).data.workspace.logs.length,0,'Guest records cannot enter a new account without explicit import');
 assert.ok(!(await cloud(a)).data?.workspace.logs.some(x=>x.id==='guest-log'));
 await a.locator('[data-account-action="import"]').click();
 assert.equal((await cached(a)).data.workspace.logs.length,0,'Opening confirmation is not consent');
 await a.locator('[data-account-action="import-confirm"]').click();await a.waitForFunction(()=>['synced','conflict'].includes(RotaAccount.status));await chooseConflicts(a);
 assert.ok((await cloud(a)).data.workspace.logs.some(x=>x.id==='guest-log'));console.log('PASS explicit guest import');
 await closeModal(a);await addLog(a,'A çevrimiçi');await sync(a);const aId=await a.evaluate(()=>RotaAccount.user.id);
 await logout(a);await login(a,'student-a@example.test');assert.ok((await cached(a)).data.workspace.logs.some(x=>x.title==='A çevrimiçi'));console.log('PASS logout/login persistence');
 const b=await open(deviceB);await login(b,'student-a@example.test');assert.ok((await cached(b)).data.workspace.logs.some(x=>x.title==='A çevrimiçi'));
 const cookieBefore=(await deviceA.cookies()).find(c=>c.name==='rota_session').value;await a.evaluate(()=>RotaAccount.open());await a.locator('[data-account-action="refresh"]').click();await a.waitForFunction(()=>RotaAccount.status==='synced');await a.locator('[data-account-action="refresh"]:not([disabled])').waitFor();assert.notEqual((await deviceA.cookies()).find(c=>c.name==='rota_session').value,cookieBefore);await closeModal(a);console.log('PASS explicit session refresh rotates cookie without losing account data');
 await addLog(a,'İkinci cihazda görünmeli');await sync(a);await sync(b);assert.ok((await cached(b)).data.workspace.logs.some(x=>x.title==='İkinci cihazda görünmeli'),'A clean device must pull remote updates');console.log('PASS clean second-device refresh');
 await deviceA.setOffline(true);await addLog(a,'A çevrimdışı');await sync(a);assert.equal(await a.evaluate(()=>RotaAccount.status),'offline');assert.ok((await cached(a)).data.workspace.logs.some(x=>x.title==='A çevrimdışı'));
 await a.evaluate(()=>RotaAccount.open());await a.locator('[data-account-action="logout"]').click();await a.locator('#account-error').filter({hasText:'Eşitlenmemiş kayıtların var'}).waitFor();assert.equal(await a.evaluate(()=>RotaAccount.user.id),aId);await closeModal(a);
 await addLog(b,'B bağımsız kayıt');await sync(b);await deviceA.setOffline(false);await sync(a);await chooseConflicts(a);await sync(b);await chooseConflicts(b);
 const merged=(await cloud(a)).data.workspace.logs;assert.ok(merged.some(x=>x.title==='A çevrimdışı'));assert.ok(merged.some(x=>x.title==='B bağımsız kayıt'));console.log('PASS offline independent records and CAS reconciliation');
 await deviceA.setOffline(true);await editLog(a,'guest-log','A aynı alan değişikliği');await sync(a);await editLog(b,'guest-log','B aynı alan değişikliği');await sync(b);await deviceA.setOffline(false);await sync(a);assert.equal(await a.evaluate(()=>RotaAccount.status),'conflict');
 await addLog(a,'Çakışmadan sonra kaydedilen');await chooseConflicts(a,'local');const resolved=(await cloud(a)).data.workspace.logs;assert.equal(resolved.find(x=>x.id==='guest-log').title,'A aynı alan değişikliği');assert.ok(resolved.some(x=>x.title==='Çakışmadan sonra kaydedilen'),'Resolving an earlier conflict must retain later local records');console.log('PASS explicit overlapping edit choice retains later local work');
 const olderTab=await open(deviceA);await a.reload({waitUntil:'networkidle'});await a.evaluate(()=>RotaAccount.ready);await deviceA.setOffline(true);await addLog(a,'Kapanan sekmeden korunan kayıt');await sync(a);
 const protectedCache=await cached(a);await olderTab.evaluate(()=>window.dispatchEvent(new Event('pagehide')));assert.equal(await olderTab.evaluate(()=>RotaAccount.status),'storage-error');assert.deepEqual(await cached(a),protectedCache,'An old tab pagehide cannot overwrite newer unsynced account cache');await olderTab.close();await deviceA.setOffline(false);await sync(a);await chooseConflicts(a);assert.ok((await cloud(a)).data.workspace.logs.some(x=>x.title==='Kapanan sekmeden korunan kayıt'));console.log('PASS stale same-account tab cannot overwrite unsynced cache');
 // A stale tab must never receive or write another cookie account's workspace.
 const stale=await open(deviceA);assert.equal(await stale.evaluate(()=>RotaAccount.user.id),aId);
 await logout(a);await login(a,'student-b@example.test',{register:true});
 const bId=await a.evaluate(()=>RotaAccount.user.id);assert.notEqual(aId,bId);assert.equal((await cached(a)).data.workspace.logs.length,0,'A study data cannot enter B');
 const beforeB=await cloud(a);await sync(stale);assert.equal(await stale.evaluate(()=>RotaAccount.status),'expired');
 const blocked=await stale.evaluate(async()=>{try{await RotaAccount.json('/api/workspace',{method:'PUT',body:JSON.stringify({baseRevision:0,mutationId:'stale-account-attempt',data:JSON.parse(localStorage.getItem(RotaAccountSync.accountKey(RotaAccount.user.id))).data})});return null;}catch(e){return {code:e.code,status:e.status};}});
 assert.equal(blocked.code,'ACCOUNT_MISMATCH');assert.deepEqual(await cloud(a),beforeB);assert.ok((await cached(stale)).data.workspace.logs.some(x=>x.title==='A çevrimdışı'));console.log('PASS stale cookie tab A/B isolation');
 await logout(a);await login(a,'student-a@example.test');assert.ok((await cached(a)).data.workspace.logs.some(x=>x.title==='B bağımsız kayıt'));assert.equal(await a.locator('#storage-warning:not([hidden])').count(),0);
 await stale.close();await deviceA.clearCookies();await sync(a);assert.equal(await a.evaluate(()=>RotaAccount.status),'expired');await a.evaluate(()=>RotaAccount.open());assert.equal(await a.locator('[data-account-action="login"]').count(),1);await a.locator('[data-account-action="login"]').click();assert.ok((await a.locator('#account-form a').getAttribute('href')).includes('mode=recovery'));await login(a,'student-a@example.test');assert.ok((await cached(a)).data.workspace.logs.some(x=>x.title==='Kapanan sekmeden korunan kayıt'));console.log('PASS expired session can explicitly restore its account and pending history');
 await a.evaluate(()=>RotaAccount.open());await a.locator('[data-account-action="delete-prompt"]').click();await a.locator('#account-delete [name="password"]').fill(pass);await a.locator('#account-delete [name="confirm"]').fill('SİL');await a.locator('#account-delete [type="submit"]').click();await a.waitForFunction(()=>RotaAccount.user===null);
 const leftovers=await a.evaluate(({key,id})=>Object.keys(localStorage).filter(k=>k===RotaAccountSync.accountKey(id)||k===key+':account:'+id||k.startsWith(key+':account:'+id+':')),{key:KEY,id:aId});assert.deepEqual(leftovers,[],'Account deletion must remove workspace, teacher, preferences, timers and sync caches');assert.ok(await a.evaluate(key=>JSON.parse(localStorage.getItem(key)).workspaces.kpss.logs.some(l=>l.id==='guest-log'),KEY),'Explicit guest history remains separate from deleted account');console.log('PASS account deletion removes every account-local cache and preserves separate guest records');
 assert.deepEqual(errors,[]);console.log('Account client browser passed: registration, explicit guest import, logout/login, cross-device refresh, offline CAS merge, explicit conflicts with later edits, same-account cache protection, stale-tab account isolation.');
}catch(error){console.error(output);throw error;}
finally{await browser?.close();if(server.exitCode===null){const ended=once(server,'exit');server.kill('SIGTERM');await ended;}fs.rmSync(temp,{recursive:true,force:true});}
