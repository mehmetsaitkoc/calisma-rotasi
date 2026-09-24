import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { DatabaseSync } from 'node:sqlite';
import { openStore } from '../server/store.mjs';
import { validateData } from '../server/validation.mjs';
import '../public/workspace-schema.js';
import './account-revocation.test.mjs';
import './account-client-state.test.mjs';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rota-account-test-')),dbPath=path.join(dir,'accounts.sqlite'),PORT=Number(process.env.ACCOUNT_TEST_PORT||8898),base='http://127.0.0.1:'+PORT;
const origin='https://app.example',nativeOrigin='https://localhost',pass='Fixture-password-129!',calls=[];
let mode='normal',server,serverLog='';
const good={kind:'fact',direct_answer:'Yanıt',message:'',diagnosis:'',steps:[],summary:'',confidence:1,detected_subject:'Tarih',detected_topic:'',difficulty:'basic',needs_clarification:false,verification:{status:'not_needed',methods:[],note:''},route_signal:{importance:0,reason:''},source_notes:[]};
const provider=http.createServer(async(req,res)=>{let raw='';for await(const chunk of req)raw+=chunk;calls.push({url:req.url,payload:JSON.parse(raw||'{}')});if(mode==='stall')return;if(mode==='error'){res.writeHead(500);res.end(JSON.stringify({error:{message:'UPSTREAM-PRIVATE-DETAIL'}}));return;}if(req.url.endsWith('/audio/speech')){res.writeHead(200,{'content-type':'audio/mpeg'});res.end(Buffer.from('fake-audio'));return;}res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({output_text:JSON.stringify(mode==='malformed'?{...good,confidence:9}:good)}));});
await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
const providerUrl='http://127.0.0.1:'+provider.address().port+'/v1';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function start(){serverLog='';server=spawn(process.execPath,['server.mjs'],{env:{...process.env,NODE_ENV:'test',RENDER:'true',PORT:String(PORT),HOST:'127.0.0.1',ROTA_DB_PATH:dbPath,ROTA_APP_ORIGIN:origin,ROTA_ALLOWED_ORIGINS:nativeOrigin,ROTA_PROVIDER_TIMEOUT_MS:'120',OPENAI_API_KEY:'fixture-not-a-real-secret',OPENAI_BASE_URL:providerUrl,ROTA_AI_MODEL:'gpt-6-astra'},stdio:['ignore','pipe','pipe']});server.stdout.on('data',x=>serverLog+=x);server.stderr.on('data',x=>serverLog+=x);for(let i=0;i<100;i++){try{if((await fetch(base+'/api/health')).ok)return;}catch{}if(server.exitCode!==null)throw Error(serverLog);await sleep(50);}throw Error(serverLog||'Server timeout');}
async function stop(){if(!server)return;const exited=once(server,'exit');server.kill('SIGTERM');await exited;server=null;}
async function request(route,{method='GET',body,session,headers={}}={}){const auth=session?.sessionToken?{authorization:'Bearer '+session.sessionToken}:session?.cookie?{cookie:session.cookie,'x-csrf-token':session.csrfToken}:{};const r=await fetch(base+route,{method,headers:{origin,...auth,...(body!==undefined?{'content-type':'application/json'}:{}),...headers},...(body!==undefined?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});let data;const text=await r.text();try{data=JSON.parse(text);}catch{data={text};}return {status:r.status,data,cookie:r.headers.get('set-cookie'),headers:r.headers};}
async function register(address,bearer=true){const r=await request('/api/auth/register',{method:'POST',body:{email:address,password:pass,name:'Test öğrenci',...(bearer?{sessionTransport:'bearer'}:{})},headers:bearer?{origin:nativeOrigin}:{}});assert.equal(r.status,201,JSON.stringify(r.data));return {...r.data,cookie:r.cookie?.split(';')[0]};}
try{
 assert.throws(()=>openStore({RENDER:'true'}),/ROTA_DB_PATH/);
 assert.throws(()=>openStore({RENDER:'true',ROTA_DB_PATH:path.resolve('work/unsafe.sqlite')}),/kalıcı diskte/);
 await start();
 const initialCalls=calls.length;
 for(const route of ['/api/workspace','/api/account/export'])assert.equal((await request(route)).status,401);
 for(const route of ['/api/teacher','/api/tts'])assert.equal((await request(route,{method:'POST',body:{question:'x',text:'x'}})).status,401);
 assert.equal(calls.length,initialCalls,'Anonymous requests must never invoke the provider');
 const a=await register('student-a@example.test'),b=await register('student-b@example.test',false);
 assert.match(b.cookie,/rota_session=/);assert.ok(b.csrfToken);assert.equal(a.user.emailVerified,false);
 assert.equal((await request('/api/auth/me',{session:a})).data.user.id,a.user.id);
 const cookieMe=await request('/api/auth/me',{session:b});assert.equal(cookieMe.data.csrfToken,b.csrfToken,'Me bootstrap must not invalidate another tab CSRF token');
 assert.equal((await request('/api/auth/login',{method:'POST',body:{email:a.user.email,password:'wrong-password',sessionTransport:'bearer'}})).status,401);
 assert.equal((await request('/api/auth/login',{method:'POST',body:{email:'missing@example.test',password:pass,sessionTransport:'bearer'}})).status,401);
 const cors=await request('/api/workspace',{method:'OPTIONS',headers:{origin:nativeOrigin,'access-control-request-method':'PUT','access-control-request-headers':'authorization,content-type'}});assert.equal(cors.status,204);assert.equal(cors.headers.get('access-control-allow-origin'),nativeOrigin);
 assert.equal((await request('/api/workspace',{method:'OPTIONS',headers:{origin:'https://unrelated.example'}})).status,403);
 const data={workspace:globalThis.RotaWorkspaceSchema.create('kpss'),teacherHistory:[],preferences:{}};data.workspace.settings.name='A';
 const legacy=structuredClone(data);legacy.workspace.logs=[{id:'legacy-log',subjectId:'k-ta',date:'2026-09-24',minutes:0,questions:12,correct:8,wrong:3}];legacy.workspace.assessments=[{id:'legacy-score',subjectId:'k-ta',date:'2026-09-24',total:12,correct:8,wrong:3,answers:[]}];assert.doesNotThrow(()=>validateData(legacy),'Existing zero-minute question logs and summary-only attempts remain valid');
 for(const change of [x=>x.workspace.logs[0].date='2026-02-30',x=>x.workspace.logs[0].minutes=-1,x=>x.workspace.logs[0].correct=13,x=>x.workspace.assessments[0].answers=[1],x=>x.workspace.assessments[0].correct=13]){const invalid=structuredClone(legacy);change(invalid);assert.throws(()=>validateData(invalid),/geçersiz/i);}
 const body={baseRevision:0,mutationId:'mutation-0001',data};
 for(const route of ['/api/workspace','/api/account/export']){const mismatch=await request(route,{session:b,headers:{'x-rota-account-id':a.user.id}});assert.equal(mismatch.status,409);assert.equal(mismatch.data.code,'ACCOUNT_MISMATCH');assert.equal(mismatch.data.data,undefined);}
 for(const route of ['/api/workspace','/api/teacher','/api/tts'])assert.equal((await request(route,{method:route==='/api/workspace'?'PUT':'POST',body,session:b,headers:{'x-rota-account-id':a.user.id}})).data.code,'ACCOUNT_MISMATCH');
 assert.equal(calls.length,initialCalls,'A stale tab with B cookie must not send A context to the provider');
 assert.equal((await request('/api/workspace',{session:b})).data.data,null,'A stale tab must not write A workspace into B');
 assert.equal((await request('/api/workspace',{method:'PUT',body,session:b,headers:{'x-csrf-token':'wrong'}})).status,403);
 assert.equal((await request('/api/workspace',{method:'PUT',body,session:a,headers:{origin:'https://unrelated.example'}})).status,403);
 assert.equal((await request('/api/workspace',{method:'PUT',body,session:a,headers:{'content-type':'text/plain'}})).status,415);
 const saved=await request('/api/workspace',{method:'PUT',body,session:a});assert.equal(saved.status,200,JSON.stringify(saved.data));assert.equal(saved.data.revision,1);
 assert.equal((await request('/api/workspace',{session:b})).data.data,null,'Another account must never see A data');
 const race=await Promise.all([2,3].map(n=>request('/api/workspace',{method:'PUT',body:{baseRevision:1,mutationId:'mutation-000'+n,data:{...data,preferences:{version:n}}},session:a})));assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);assert.equal(race.find(r=>r.status===409).data.revision,2);
 const replay=await request('/api/workspace',{method:'PUT',body,session:a});assert.equal(replay.data.duplicate,true);assert.equal((await request('/api/workspace',{session:a})).data.revision,2);
 assert.equal((await request('/api/workspace',{method:'PUT',body:{...body,data:{...data,preferences:{changed:true}}},session:a})).data.code,'IDEMPOTENCY_CONFLICT');
 const bad=JSON.parse(JSON.stringify({...body,baseRevision:2,mutationId:'mutation-0004'}));bad.data.preferences=JSON.parse('{"__proto__":{"polluted":true}}');assert.equal((await request('/api/workspace',{method:'PUT',body:bad,session:a})).status,400);
 const photoBad={...data,teacherHistory:[{id:'rh-safe',subjectId:'k-ta',question:'x',photo:'data:image/png;base64,x" onerror="attack',followups:[]}]};assert.equal((await request('/api/workspace',{method:'PUT',body:{baseRevision:2,mutationId:'mutation-0005',data:photoBad},session:a})).status,400);
 const exportResult=await request('/api/account/export',{session:a});assert.equal(exportResult.data.user.id,a.user.id);assert.equal(exportResult.data.revision,2);assert.ok(!JSON.stringify(exportResult.data).includes('password_hash'));
 assert.equal((await request('/api/teacher',{method:'POST',session:a,body:{question:'Kısa bilgi',studentContext:{selected:{subject:'Tarih',password:'DROP-ME'},unknown:'DROP-TOP'}}})).status,200);
 const payload=calls.at(-1).payload;assert.equal(payload.model,'gpt-6-astra');assert.equal(payload.reasoning.effort,'low');assert.equal(payload.store,false);assert.ok(!JSON.stringify(payload).includes('DROP-ME'));assert.ok(!JSON.stringify(payload).includes('DROP-TOP'));assert.ok(!payload.instructions.includes('Kısa bilgi'));
 assert.equal((await request('/api/tts',{method:'POST',session:b,body:{text:'Test'}})).status,200);
 mode='malformed';assert.equal((await request('/api/teacher',{method:'POST',session:a,body:{question:'Test'}})).status,502);
 mode='error';const upstream=await request('/api/teacher',{method:'POST',session:a,body:{question:'Test'}});assert.equal(upstream.status,502);assert.ok(!JSON.stringify(upstream.data).includes('UPSTREAM-PRIVATE'));
 mode='stall';assert.equal((await request('/api/teacher',{method:'POST',session:a,body:{question:'Test'}})).status,504);mode='normal';
 const fixtureDb=new DatabaseSync(dbPath);fixtureDb.prepare('INSERT INTO usage(user_id,day,kind,count) VALUES(?,?,?,?) ON CONFLICT(user_id,day,kind) DO UPDATE SET count=excluded.count').run(b.user.id,new Date().toISOString().slice(0,10),'teacher',50);const beforeQuota=calls.length;assert.equal((await request('/api/teacher',{method:'POST',session:b,body:{question:'Test'}})).status,429);assert.equal(calls.length,beforeQuota,'Daily quota must stop the provider call');fixtureDb.close();
 const refreshed=await request('/api/auth/refresh',{method:'POST',body:{},session:a});assert.equal(refreshed.status,200);assert.notEqual(refreshed.data.sessionToken,a.sessionToken);assert.equal((await request('/api/auth/me',{session:a})).status,401);const a2=refreshed.data;
 await stop();const checkpoint=new DatabaseSync(dbPath);checkpoint.exec('PRAGMA wal_checkpoint(TRUNCATE)');checkpoint.close();const backup=path.join(dir,'closed-backup.sqlite');fs.copyFileSync(dbPath,backup);fs.rmSync(dbPath);fs.copyFileSync(backup,dbPath);await start();assert.equal((await request('/api/workspace',{session:a2})).data.revision,2,'Offline database backup restore and restart must preserve session and student data');
 const login=await request('/api/auth/login',{method:'POST',body:{email:a.user.email,password:pass,sessionTransport:'bearer'}});assert.equal(login.status,200);assert.equal((await request('/api/workspace',{session:login.data})).data.revision,2,'A second device must recover the same workspace');
 assert.equal((await request('/api/auth/logout',{method:'POST',body:{},session:a2})).status,200);assert.equal((await request('/api/auth/me',{session:a2})).status,401);assert.equal((await request('/api/auth/me',{session:login.data})).status,200);
 assert.equal((await request('/api/account',{method:'DELETE',body:{password:'incorrect'},session:login.data})).status,401);
 assert.equal((await request('/api/account',{method:'DELETE',body:{password:pass},session:login.data})).status,200);assert.equal((await request('/api/auth/me',{session:login.data})).status,401);
 await stop();const db=new DatabaseSync(dbPath);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM users WHERE id=?').get(a.user.id).n,0);for(const table of ['sessions','workspaces','mutations','usage','auth_tokens'])assert.equal(db.prepare('SELECT COUNT(*) AS n FROM '+table+' WHERE user_id=?').get(a.user.id).n,0,table+' must be deleted');assert.ok(db.prepare('SELECT count FROM global_usage WHERE kind=?').get('teacher').count>0,'Deleting an account cannot reset aggregate spending limits');const stored=db.prepare('SELECT * FROM users WHERE id=?').get(b.user.id);assert.notEqual(stored.password_hash,pass);assert.equal(stored.password_hash.length,128);assert.ok(!JSON.stringify(db.prepare('SELECT * FROM sessions').all()).includes(b.cookie.split('=')[1]));db.close();
 console.log('Account security passed: isolated accounts + native/cookie sessions + CSRF/CORS + scrypt + optimistic concurrency/idempotency + restart/cross-device persistence + provider gates/context/deadline + deletion/export');
}finally{await stop();provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));fs.rmSync(dir,{recursive:true,force:true});}
