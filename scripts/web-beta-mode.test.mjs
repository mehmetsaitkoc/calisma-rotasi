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

  const home=await fetch(BASE+'/');
  assert.equal(home.status,200);
  const html=await home.text();
  assert.match(html,/landing-final\.js/);

  const ent=await (await fetch(BASE+'/api/entitlements')).json();
  assert.equal(ent.accountRequired,false);

  console.log('Web beta mode passed: Render starts without ephemeral accounts, core web stays available, account APIs fail honestly.');
} finally {
  await stop();
}
