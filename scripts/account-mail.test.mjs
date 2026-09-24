import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { createMailer } from '../server/mail.mjs';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rota-mail-test-')),dbPath=path.join(dir,'mail.sqlite'),port=Number(process.env.MAIL_TEST_PORT||8897),base='http://127.0.0.1:'+port,origin='https://app.example',password='Mail-fixture-password-1!',messages=[];
let server,log='',mode='normal',disabled=false;
const fake=http.createServer(async(req,res)=>{let raw='';for await(const chunk of req)raw+=chunk;messages.push({payload:JSON.parse(raw),headers:req.headers});if(mode==='timeout')return;if(mode==='error'){res.writeHead(500);res.end('private provider information');return;}res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({id:'fixture-mail-'+messages.length}));});
await new Promise(resolve=>fake.listen(0,'127.0.0.1',resolve));
const endpoint='http://127.0.0.1:'+fake.address().port+'/emails';
async function start(){log='';server=spawn(process.execPath,['server.mjs'],{env:{...process.env,NODE_ENV:'test',RENDER:'true',HOST:'127.0.0.1',PORT:String(port),ROTA_DB_PATH:dbPath,ROTA_APP_ORIGIN:origin,ROTA_ALLOWED_ORIGINS:'https://localhost',OPENAI_API_KEY:'',ROTA_MAIL_PROVIDER:disabled?'':'resend',ROTA_MAIL_API_KEY:'fixture-mail-key-not-real',ROTA_MAIL_FROM:'Çalışma Rotası <fixture@example.test>',ROTA_MAIL_TEST_URL:endpoint,ROTA_MAIL_TEST_TIMEOUT_MS:'80'},stdio:['ignore','pipe','pipe']});server.stdout.on('data',x=>log+=x);server.stderr.on('data',x=>log+=x);for(let i=0;i<100;i++){try{if((await fetch(base+'/api/health')).ok)return;}catch{}if(server.exitCode!==null)throw Error(log);await new Promise(r=>setTimeout(r,30));}throw Error('Server timeout');}
async function stop(){if(!server)return;const exited=once(server,'exit');server.kill();await exited;server=null;}
async function request(route,{body,session,headers={}}={}){const response=await fetch(base+route,{method:body===undefined?'GET':'POST',headers:{origin,'content-type':'application/json',...(session?.sessionToken?{authorization:'Bearer '+session.sessionToken,'x-rota-account-id':session.user.id}:{}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:response.status,data:await response.json()};}
const hash=x=>createHash('sha256').update(x).digest('hex');
const lastToken=()=>{const text=messages.at(-1).payload.text,link=new URL(text.match(/https:\/\/\S+/)[0]);assert.equal(link.origin,origin);assert.equal(link.pathname,'/account-action.html');assert.equal(link.search,'','Tokens must not enter HTTP request URLs or access logs');return new URLSearchParams(link.hash.slice(1)).get('token');};
try{
 assert.throws(()=>createMailer({NODE_ENV:'production',ROTA_MAIL_TEST_URL:'http://127.0.0.1:1234'}),/yalnız testte/);
 assert.throws(()=>createMailer({NODE_ENV:'test',ROTA_MAIL_TEST_URL:'https://untrusted.example/emails'}),/yalnız testte/);
 await start();
 const registered=await request('/api/auth/register',{body:{email:'mail-student@example.test',password,name:'Fixture',sessionTransport:'bearer'}});assert.equal(registered.status,201);let session=registered.data;assert.deepEqual(session.features,{emailVerification:true,passwordRecovery:true});
 assert.equal(messages.length,0,'Registration itself does not send unsolicited mail');
 assert.equal((await request('/api/auth/verify',{body:{}})).status,401);
 assert.equal((await request('/api/auth/verify',{body:{},session,headers:{origin:'https://evil.example'}})).status,403);
 assert.equal((await request('/api/auth/verify',{body:{},session})).status,202);const verifyToken=lastToken();
 assert.ok(messages.at(-1).headers['idempotency-key']);assert.equal(messages.at(-1).payload.to[0],session.user.email);assert.ok(!messages.at(-1).payload.text.includes(password));
 let db=new DatabaseSync(dbPath);let row=db.prepare('SELECT * FROM auth_tokens WHERE token_hash=?').get(hash(verifyToken));assert.equal(row.purpose,'verify');assert.equal(row.expires_at-row.created_at,86400000);assert.ok(!JSON.stringify(db.prepare('SELECT * FROM auth_tokens').all()).includes(verifyToken));db.close();
 await stop();await start();assert.equal((await request('/api/auth/verify',{body:{token:verifyToken}})).data.user.emailVerified,true,'Token must survive restart and work without a logged-in session');
 assert.equal((await request('/api/auth/verify',{body:{token:verifyToken}})).data.code,'INVALID_TOKEN','Verification token must be single-use');
 assert.equal((await request('/api/auth/me',{session})).data.user.emailVerified,true);
 assert.equal((await request('/api/auth/verify',{body:{},session})).data.alreadyVerified,true);
 const absent=await request('/api/auth/recovery',{body:{email:'absent@example.test'}}),beforeRecovery=messages.length;
 const present=await request('/api/auth/recovery',{body:{email:session.user.email}});assert.deepEqual(present,absent,'Unknown and known accounts must have identical public responses');assert.equal(messages.length,beforeRecovery+1);
 let resetToken=lastToken();db=new DatabaseSync(dbPath);row=db.prepare('SELECT * FROM auth_tokens WHERE token_hash=?').get(hash(resetToken));assert.equal(row.expires_at-row.created_at,1800000);db.close();
 assert.equal((await request('/api/auth/verify',{body:{token:resetToken}})).data.code,'INVALID_TOKEN','Tokens are purpose-bound');
 assert.equal((await request('/api/auth/reset',{body:{token:resetToken,password:'short'}})).data.code,'INVALID_PASSWORD');
 const second=await request('/api/auth/login',{body:{email:session.user.email,password,sessionTransport:'bearer'}});assert.equal(second.status,200);
 const newPassword='Changed-fixture-password-2!';const race=await Promise.all([1,2].map(()=>request('/api/auth/reset',{body:{token:resetToken,password:newPassword}})));assert.deepEqual(race.map(x=>x.status).sort(),[200,400],'Concurrent redemption must have exactly one winner');
 assert.equal((await request('/api/auth/me',{session})).status,401);assert.equal((await request('/api/auth/me',{session:second.data})).status,401,'Reset invalidates all devices');
 assert.equal((await request('/api/auth/login',{body:{email:session.user.email,password,sessionTransport:'bearer'}})).status,401);
 const login=await request('/api/auth/login',{body:{email:session.user.email,password:newPassword,sessionTransport:'bearer'}});assert.equal(login.status,200);session=login.data;
 await request('/api/auth/recovery',{body:{email:session.user.email}});resetToken=lastToken();db=new DatabaseSync(dbPath);db.prepare('UPDATE auth_tokens SET expires_at=? WHERE token_hash=?').run(Date.now()-1,hash(resetToken));db.close();assert.equal((await request('/api/auth/reset',{body:{token:resetToken,password:newPassword}})).data.code,'INVALID_TOKEN');
 mode='error';const failed=await request('/api/auth/recovery',{body:{email:session.user.email}});assert.deepEqual(failed,absent,'Provider failure must not disclose whether the address exists or falsely confirm delivery');const failedToken=lastToken();db=new DatabaseSync(dbPath);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM auth_tokens WHERE token_hash=?').get(hash(failedToken)).n,0,'Undelivered token must be revoked');db.close();
 mode='timeout';const timed=await request('/api/auth/recovery',{body:{email:session.user.email}});assert.equal(timed.status,202);mode='normal';
 for(let i=0;i<6;i++){const r=await request('/api/auth/recovery',{body:{email:'rate@example.test'}});if(i===5)assert.equal(r.status,429,'Recovery is limited per address without revealing account membership');}
 assert.ok(!log.includes(verifyToken));assert.ok(!log.includes(resetToken));assert.ok(!log.includes('private provider information'));assert.ok(!log.includes('fixture-mail-key-not-real'));
 await stop();disabled=true;await start();assert.deepEqual((await request('/api/auth/me',{session})).data.features,{emailVerification:false,passwordRecovery:false});const unavailable=await request('/api/auth/recovery',{body:{email:session.user.email}});assert.equal(unavailable.status,503);assert.equal(unavailable.data.code,'FEATURE_UNAVAILABLE');
 console.log('Account mail passed: mock-only Resend contract, generic recovery response, hashed purpose-bound expiring single-use tokens, concurrent redemption, restart, session revocation, provider timeout/failure, feature gate and rate limit');
}finally{await stop();fake.closeAllConnections();await new Promise(resolve=>fake.close(resolve));fs.rmSync(dir,{recursive:true,force:true});}
