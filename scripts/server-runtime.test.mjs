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
  env:{...process.env,PORT:String(PORT),HOST:'127.0.0.1',OPENAI_API_KEY:'',RENDER:'true'},
  stdio:['ignore','pipe','pipe']
});
let log='';
server.stdout.on('data',d=>{log+=d;});
server.stderr.on('data',d=>{log+=d;});

try{
  await waitServer();

  const landingResponse=await fetch(BASE+'/');
  const landingHtml=await landingResponse.text();
  assert.equal(landingResponse.status,200,'Landing page must remain servable');
  assert.match(landingHtml,/premium-v6\.css/,'Landing page must load the Premium V6 CSS layer');
  assert.match(landingHtml,/premium-v6\.js/,'Landing page must load the Premium V6 welcome enhancer');
  const premiumCss=await fetch(BASE+'/premium-v6.css');
  const premiumCssText=await premiumCss.text();
  assert.equal(premiumCss.status,200,'Premium V6 stylesheet must be served');
  assert.match(premiumCssText,/PREMIUM V6 · PIXEL MATCH/);
  const premiumJs=await fetch(BASE+'/premium-v6.js');
  const premiumJsText=await premiumJs.text();
  assert.equal(premiumJs.status,200,'Premium V6 script must be served');
  assert.match(premiumJsText,/Kişisel Çalışma/);

  const healthResponse=await fetch(BASE+'/api/health');
  const health=await healthResponse.json();
  assert.equal(health.ok,true);
  assert.equal(health.aiConfigured,false);
  assert.equal(health.demoFallback,false);
  assert.equal(health.honestUnavailableFallback,true);
  assert.deepEqual(health.entitlement,{tier:'free',source:'public_beta',purchaseEnabled:false,accountRequired:true},'Render health must expose the server-sourced Free entitlement');
  assert.equal(health.configurable,false,'Render runtime must never expose local API-key configuration');
  assert.equal(health.teacherPolicy.rateLimitPerMinute,20);
  assert.equal(health.teacherPolicy.maxBodyBytes,7*1024*1024,'Health must expose the actual request body ceiling');
  assert.equal(health.teacherPolicy.maxOutputTokens,1400);
  assert.equal(health.teacherPolicy.contextSchemaVersion,2,'Health must expose the teacher context schema version');
  assert.ok(!Object.hasOwn(health,'apiKey'),'Health must never expose an API key');
  assert.ok(!JSON.stringify(health).includes('sk-'),'Health must not leak key-like secrets');

  const entitlementResponse=await fetch(BASE+'/api/entitlements');
  const entitlement=await entitlementResponse.json();
  assert.equal(entitlementResponse.status,200);
  assert.equal(entitlement.schema,'calisma-rotasi-entitlement-v1');
  assert.equal(entitlement.version,1);
  assert.equal(entitlement.tier,'free','Render must fail closed to Free until account-backed entitlements exist');
  assert.equal(entitlement.source,'public_beta');
  assert.equal(entitlement.features.core_route,true);
  assert.equal(entitlement.features.teacher_basic,true);
  assert.equal(entitlement.features.monthly_report,false);
  assert.equal(entitlement.features.advanced_teacher_insights,false);
  assert.equal(entitlement.purchaseEnabled,false);
  assert.equal(entitlement.accountRequired,true);

  const configureBlocked=await jsonPost('/api/configure',{apiKey:'sk-test-not-a-real-key-1234567890',profile:'economy'});
  assert.equal(configureBlocked.status,403,'Runtime AI configuration must stay disabled on Render');
  assert.match(configureBlocked.data.error||'',/yerel uygulama/i);

  const boundedContext=await jsonPost('/api/teacher',{question:'Bağlamı kontrol et.',studentContext:{contextVersion:2,unknownSecret:'PRIVATE-CONTEXT-LEAK',todayPlan:Array.from({length:20},(_,i)=>({title:'Görev '+i,reason:'x'.repeat(1200)})),recentLogs:Array.from({length:20},(_,i)=>({title:'Log '+i,note:'PRIVATE-NOTE-'+i}))}});
  assert.equal(boundedContext.status,200,'Bounded teacher context must remain accepted in unavailable mode');
  assert.equal(boundedContext.data.meta?.contextVersion,2);
  assert.ok(!JSON.stringify(boundedContext.data).includes('PRIVATE-CONTEXT-LEAK'),'Unknown top-level teacher context must not leak into responses');
  assert.ok(!JSON.stringify(boundedContext.data).includes('PRIVATE-NOTE-'),'Nested free-form context must not be echoed into unavailable responses');

  const fallback=await jsonPost('/api/teacher',{question:'Bu soruyu açıklar mısın?',exam:'KPSS',subject:'Matematik'});
  assert.equal(fallback.status,200);
  assert.equal(fallback.data.demo,true);
  assert.equal(fallback.data.answer?._unavailable,true);
  assert.equal(fallback.data.answer?.direct_answer,'','Unavailable mode must not fabricate an answer');
  assert.equal(fallback.data.answer?.route_signal?.importance,0,'Unavailable mode must not influence route');
  assert.match(fallback.data.answer?.message||'',/tahmin|demo içerik cevabı/i);
  assert.equal(fallback.data.meta?.mode,'unavailable');
  assert.equal(fallback.data.meta?.tier,'free');

  const advancedBlocked=await jsonPost('/api/teacher',{question:'Bu çözümü başka yöntemle anlat.',mode:'alternate',exam:'KPSS',subject:'Matematik'});
  assert.equal(advancedBlocked.status,403,'Advanced teacher continuation must be server-gated for Free');
  assert.equal(advancedBlocked.data.code,'PLUS_REQUIRED');
  assert.equal(advancedBlocked.data.feature,'advanced_teacher_insights');
  assert.match(advancedBlocked.data.error||'',/Rota Plus/i);

  const invalidPhoto=await jsonPost('/api/teacher',{question:'',photo:'data:text/plain;base64,SGVsbG8='});
  assert.equal(invalidPhoto.status,400,'Photo validation must run even when AI is unavailable');
  assert.match(invalidPhoto.data.error||'',/fotoğraf|biçim/i);

  const oversizedPhoto=await jsonPost('/api/teacher',{question:'',photo:'data:image/png;base64,'+'A'.repeat(5_800_001)});
  assert.equal(oversizedPhoto.status,413,'Photo-specific size bound must reject oversized images before any AI call');
  assert.match(oversizedPhoto.data.error||'',/Fotoğraf çok büyük/i);

  const empty=await jsonPost('/api/teacher',{question:'',photo:''});
  assert.equal(empty.status,400);
  assert.match(empty.data.error||'',/Sorunu yaz|fotoğraf ekle/i);

  const invalidJson=await jsonPost('/api/teacher','{bad json');
  assert.equal(invalidJson.status,400);
  assert.match(invalidJson.data.error||'',/Geçersiz JSON/i);

  const oversizedBody=JSON.stringify({question:'x'.repeat(7*1024*1024+1024)});
  const oversized=await jsonPost('/api/teacher',oversizedBody);
  assert.equal(oversized.status,413,'Oversized teacher payloads must fail with an explicit 413 response');
  assert.match(oversized.data.error||'',/çok büyük/i);

  const forwardedHeaders={'content-type':'application/json','x-forwarded-for':'203.0.113.10, 10.0.0.5'};
  for(let i=0;i<20;i++){
    const limited=await jsonPost('/api/teacher',{question:'Rate limit fixture '+i},forwardedHeaders);
    assert.equal(limited.status,200,'Teacher requests below the per-client limit must pass');
  }
  const teacherBlocked=await jsonPost('/api/teacher',{question:'Rate limit fixture blocked'},forwardedHeaders);
  assert.equal(teacherBlocked.status,429,'Teacher rate limit must use the real forwarded client IP');
  assert.equal(teacherBlocked.data.code,'RATE_LIMITED');

  const otherClient=await jsonPost('/api/teacher',{question:'Other client remains independent'},{'content-type':'application/json','x-forwarded-for':'203.0.113.11'});
  assert.equal(otherClient.status,200,'A different forwarded client IP must have an independent bucket');

  const ttsSameClient=await jsonPost('/api/tts',{text:'Merhaba'},forwardedHeaders);
  assert.equal(ttsSameClient.status,503,'Teacher traffic must not consume the independent TTS rate-limit bucket');

  console.log('Server runtime contracts passed: honest fallback + Free entitlement + Plus-only teacher continuation + body/photo bounds + bounded context + rate limits');
} finally {
  server.kill('SIGTERM');
  await sleep(100);
  if(server.exitCode===null)server.kill('SIGKILL');
  if(process.exitCode)console.error(log);
}
