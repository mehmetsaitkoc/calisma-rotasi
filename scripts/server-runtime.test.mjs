import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const PORT=Number(process.env.SERVER_CONTRACT_PORT||8897);
const BASE='http://127.0.0.1:'+PORT;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function waitServer(){
  for(let i=0;i<80;i++){
    try{const r=await fetch(BASE+'/api/health');if(r.ok)return;}catch{}
    await sleep(75);
  }
  throw new Error('Server contract fixture did not become ready.');
}
async function jsonPost(path,body,headers={'content-type':'application/json'}){
  const r=await fetch(BASE+path,{method:'POST',headers,body:typeof body==='string'?body:JSON.stringify(body)});
  let data={};try{data=await r.json();}catch{}
  return {status:r.status,data};
}

const server=spawn(process.execPath,['server.mjs'],{
  cwd:process.cwd(),
  env:{...process.env,PORT:String(PORT),HOST:'127.0.0.1',OPENAI_API_KEY:''},
  stdio:['ignore','pipe','pipe']
});
let log='';
server.stdout.on('data',d=>{log+=d;});
server.stderr.on('data',d=>{log+=d;});

try{
  await waitServer();

  const healthResponse=await fetch(BASE+'/api/health');
  const health=await healthResponse.json();
  assert.equal(health.ok,true);
  assert.equal(health.aiConfigured,false);
  assert.equal(health.demoFallback,false);
  assert.equal(health.honestUnavailableFallback,true);
  assert.equal(health.teacherPolicy.rateLimitPerMinute,20);
  assert.equal(health.teacherPolicy.maxOutputTokens,1400);
  assert.ok(!Object.hasOwn(health,'apiKey'),'Health must never expose an API key');
  assert.ok(!JSON.stringify(health).includes('sk-'),'Health must not leak key-like secrets');

  const fallback=await jsonPost('/api/teacher',{question:'Bu soruyu açıklar mısın?',exam:'KPSS',subject:'Matematik'});
  assert.equal(fallback.status,200);
  assert.equal(fallback.data.demo,true);
  assert.equal(fallback.data.answer?._unavailable,true);
  assert.equal(fallback.data.answer?.direct_answer,'','Unavailable mode must not fabricate an answer');
  assert.equal(fallback.data.answer?.route_signal?.importance,0,'Unavailable mode must not influence route');
  assert.match(fallback.data.answer?.message||'',/tahmin|demo içerik cevabı/i);
  assert.equal(fallback.data.meta?.mode,'unavailable');

  const invalidPhoto=await jsonPost('/api/teacher',{question:'',photo:'data:text/plain;base64,SGVsbG8='});
  assert.equal(invalidPhoto.status,400,'Photo validation must run even when AI is unavailable');
  assert.match(invalidPhoto.data.error||'',/fotoğraf|biçim/i);

  const empty=await jsonPost('/api/teacher',{question:'',photo:''});
  assert.equal(empty.status,400);
  assert.match(empty.data.error||'',/Sorunu yaz|fotoğraf ekle/i);

  const invalidJson=await jsonPost('/api/teacher','{bad json');
  assert.equal(invalidJson.status,400);
  assert.match(invalidJson.data.error||'',/Geçersiz JSON/i);

  console.log('Server runtime contracts passed: honest fallback + validation + secret-safe health');
} finally {
  server.kill('SIGTERM');
  await sleep(100);
  if(server.exitCode===null)server.kill('SIGKILL');
  if(process.exitCode)console.error(log);
}
