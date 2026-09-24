import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { randomBytes,createHash,scryptSync } from 'node:crypto';
import { createAccounts } from '../server/accounts.mjs';
import '../public/workspace-schema.js';

// Exercise the real routes/store with deliberately unfinished request bodies.
// No listening port, real provider, email or existing account is involved.
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rota-revocation-'));
const accounts=createAccounts({NODE_ENV:'test',ROTA_DB_PATH:path.join(dir,'fixture.sqlite'),ROTA_APP_ORIGIN:'http://127.0.0.1:8855'});
const db=accounts.store.db,origin='http://127.0.0.1:8855',address='revocation@example.test';
const digest=value=>createHash('sha256').update(value).digest('hex');
function request(url,body,session,method=body===undefined?'GET':'POST'){
 const req=new Readable({read(){}});req.url=url;req.method=method;
 req.headers={origin,'content-type':'application/json',...(session?{cookie:session.cookie,'x-csrf-token':session.csrfToken,'x-rota-account-id':session.user.id}:{})};req.socket={remoteAddress:'127.0.0.1'};
 if(body!==null){if(body!==undefined)req.push(JSON.stringify(body));req.push(null);}return req;
}
function response(){return {headers:{},setHeader(key,value){this.headers[key.toLowerCase()]=value;},writeHead(status,headers={}){this.status=status;Object.assign(this.headers,headers);},end(value){this.data=JSON.parse(String(value));}};}
async function invoke(url,body,session,method){const res=response();await accounts.route(request(url,body,session,method),res);return res;}
function session(res){return {...res.data,cookie:res.headers['set-cookie']?.split(';')[0]};}
function pending(url,body,identity,method){const req=request(url,null,identity,method),res=response(),text=JSON.stringify(body);req.push(text.slice(0,1));const done=accounts.route(req,res);return {async finish(){req.push(text.slice(1));req.push(null);await done;return res;}};}
async function login(password){const result=await invoke('/api/auth/login',{email:address,password});assert.equal(result.status,200);return session(result);}
async function reset(userId,password){const token=randomBytes(32).toString('base64url'),now=Date.now();db.prepare('INSERT INTO auth_tokens VALUES(?,?,?,?,?)').run(digest(token),userId,'reset',now+300000,now);assert.equal((await invoke('/api/auth/reset',{token,password})).status,200);}
try{
 const registered=await invoke('/api/auth/register',{email:address,password:'original-fixture-password',name:'Fixture'});assert.equal(registered.status,201);const first=session(registered),id=first.user.id;
 const slowRefresh=pending('/api/auth/refresh',{},first,'POST');
 await reset(id,'changed-fixture-password');
 assert.equal((await slowRefresh.finish()).status,401,'A request authenticated before reset cannot rotate a revoked session');
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE user_id=?').get(id).n,0);
 let current=await login('changed-fixture-password');
 const data={workspace:globalThis.RotaWorkspaceSchema.create('kpss'),teacherHistory:[],preferences:{}};
 const slowWrite=pending('/api/workspace',{baseRevision:0,mutationId:'revoked-write-001',data},current,'PUT');
 await reset(id,'another-fixture-password');assert.equal((await slowWrite.finish()).status,401,'A revoked request cannot publish a late workspace body');assert.equal(accounts.store.snapshot(id).data,null);
 current=await login('another-fixture-password');const slowProfile=pending('/api/auth/profile',{name:'Should not survive logout'},current,'POST');
 assert.equal((await invoke('/api/auth/logout',{},current)).status,200);assert.equal((await slowProfile.finish()).status,401);assert.equal(db.prepare('SELECT name FROM users WHERE id=?').get(id).name,'Fixture');
 current=await login('another-fixture-password');const rotations=[pending('/api/auth/refresh',{},current,'POST'),pending('/api/auth/refresh',{},current,'POST')];const rotated=await Promise.all(rotations.map(x=>x.finish()));assert.deepEqual(rotated.map(x=>x.status).sort(),[200,401],'Only one rotation may consume a session');

 // Capture the exact credential change between lookup and asynchronous scrypt.
 // This models a reset committing while an old-password login is in flight.
 const prepare=db.prepare.bind(db),newSalt=randomBytes(16).toString('hex'),newHash=scryptSync('latest-fixture-password',newSalt,64,{N:16384,r:8,p:1,maxmem:32*1024*1024}).toString('hex');let changed=false;
 db.prepare=function(sql){const statement=prepare(sql);if(sql!=='SELECT * FROM users WHERE email=?')return statement;return {get(...args){const row=statement.get(...args);if(row&&!changed){changed=true;prepare('UPDATE users SET password_hash=?,password_salt=? WHERE id=?').run(newHash,newSalt,row.id);prepare('DELETE FROM sessions WHERE user_id=?').run(row.id);}return row;}};};
 const staleLogin=await invoke('/api/auth/login',{email:address,password:'another-fixture-password'});db.prepare=prepare;
 assert.equal(staleLogin.status,401,'A successful hash comparison against old credentials cannot issue a post-reset session');assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE user_id=?').get(id).n,0);
 await login('latest-fixture-password');
 console.log('Account revocation passed: reset/logout during request streaming, single-use session rotation, and old-password login racing a credential change.');
}finally{accounts.close();fs.rmSync(dir,{recursive:true,force:true});}
