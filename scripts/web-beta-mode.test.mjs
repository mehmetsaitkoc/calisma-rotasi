import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const PORT=Number(process.env.WEB_BETA_TEST_PORT||8907);
const BASE='http://127.0.0.1:'+PORT;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let child,log='';

async function start(){
  child=spawn(process.execPath,['server.mjs'],{
    env:{
      ...process.env,
      PORT:String(PORT),
      HOST:'127.0.0.1',
      RENDER:'true',
      NODE_ENV:'production',
      ROTA_ACCOUNTS_MODE:'local-only',
      ROTA_APP_ORIGIN:'https://beta.example',
      OPENAI_API_KEY:''
    },
    stdio:['ignore','pipe','pipe']
  });
  child.stdout.on('data',x=>log+=x);
  child.stderr.on('data',x=>log+=x);
  for(let i=0;i<120;i++){
    if(child.exitCode!==null)throw Error(log||'Web beta server exited early.');
    try{const r=await fetch(BASE+'/api/health');if(r.ok)return;}catch{}
    await sleep(50);
  }
  throw Error(log||'Web beta server did not start.');
}
async function stop(){if(child&&child.exitCode===null){child.kill('SIGTERM');for(let i=0;i<40&&child.exitCode===null;i++)await sleep(25);if(child.exitCode===null)child.kill('SIGKILL');}}

try{
  await start();
  const health=await (await fetch(BASE+'/api/health')).json();
  assert.equal(health.ok,true);
  assert.deepEqual(health.accounts,{available:false,mode:'local-only'});
  assert.equal(health.entitlement.accountRequired,false);

  const auth=await fetch(BASE+'/api/auth/me');
  assert.equal(auth.status,503);
  const body=await auth.json();
  assert.equal(body.code,'ACCOUNTS_UNAVAILABLE');
  assert.match(body.error,/Web Beta|yerel kayıt|tarayıcı/i);

  const home=await fetch(BASE+'/',{headers:{'Accept-Encoding':'br'}});
  assert.equal(home.status,200);
  assert.equal(home.headers.get('content-encoding'),'br','Web index should use Brotli when supported');
  const homeEtag=home.headers.get('etag');assert.ok(homeEtag,'Web index must expose an ETag');
  const html=await home.text();
  assert.match(html,/landing-final\.js/);
  const individual=[...html.matchAll(/src=["']\/questions\/kpss\/[^"']+\/test-[1-4]\.js["']/g)];
  const bundles=[...html.matchAll(/src=["'](\/runtime\/kpss-bundle\/[^"']+\.js)["']/g)].map(x=>x[1]);
  assert.equal(individual.length,0,'Public web index must not fan out 256 individual question requests');
  assert.equal(bundles.length,6,'Public web index must expose exactly six subject bundles');
  const bundle=await fetch(BASE+bundles[0],{headers:{'Accept-Encoding':'br'}});
  assert.equal(bundle.status,200);assert.equal(bundle.headers.get('content-encoding'),'br');
  assert.match(await bundle.text(),/RotaQuestionBank|registerTest/,'Runtime subject bundle must contain the canonical bank modules');
  const notModified=await fetch(BASE+'/',{headers:{'If-None-Match':homeEtag,'Accept-Encoding':'br'}});
  assert.equal(notModified.status,304,'Web index ETag must support conditional reloads');

  const ent=await (await fetch(BASE+'/api/entitlements')).json();
  assert.equal(ent.accountRequired,false);

  console.log('Web beta mode passed: Render starts without ephemeral accounts, core web stays available, account APIs fail honestly.');
} finally {
  await stop();
}
