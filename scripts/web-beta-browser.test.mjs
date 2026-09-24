import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT=Number(process.env.WEB_BETA_BROWSER_PORT||8911);
const BASE='http://127.0.0.1:'+PORT;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let server,log='';

async function start(){
  server=spawn(process.execPath,['server.mjs'],{
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
  server.stdout.on('data',x=>log+=x);
  server.stderr.on('data',x=>log+=x);
  for(let i=0;i<120;i++){
    if(server.exitCode!==null)throw Error(log||'Web Beta server exited.');
    try{if((await fetch(BASE+'/api/health')).ok)return;}catch{}
    await sleep(50);
  }
  throw Error(log||'Web Beta server timeout.');
}
async function stop(){
  if(server&&server.exitCode===null){
    server.kill('SIGTERM');
    for(let i=0;i<40&&server.exitCode===null;i++)await sleep(25);
    if(server.exitCode===null)server.kill('SIGKILL');
  }
}

let browser;
try{
  await start();
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},locale:'tr-TR'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e?.stack||e)));

  await page.goto(BASE+'/?fresh=1',{waitUntil:'domcontentloaded'});
  await page.locator('.welcome.premium-landing-final').waitFor({state:'visible'});
  const firstUsableMs=await page.evaluate(()=>performance.now());
  await page.waitForLoadState('load');
  const resourceStats=await page.evaluate(()=>performance.getEntriesByType('resource').map(entry=>({name:entry.name,transferSize:entry.transferSize||0,encodedBodySize:entry.encodedBodySize||0,decodedBodySize:entry.decodedBodySize||0})));
  const resources=resourceStats.map(entry=>entry.name);
  const totals=resourceStats.reduce((sum,entry)=>({transfer:sum.transfer+entry.transferSize,encoded:sum.encoded+entry.encodedBodySize,decoded:sum.decoded+entry.decodedBodySize}),{transfer:0,encoded:0,decoded:0});
  console.log('Web Beta landing resource bytes:',JSON.stringify(totals));
  const individualQuestionRequests=resources.filter(url=>/\/questions\/kpss\/.+\/test-[1-4]\.js(?:\?|$)/.test(url));
  const bundleRequests=resources.filter(url=>/\/runtime\/kpss-bundle\/[a-z0-9-]+\.js(?:\?|$)/.test(url));
  const bundleTransfer=resourceStats.filter(entry=>/\/runtime\/kpss-bundle\/[a-z0-9-]+\.js(?:\?|$)/.test(entry.name)).reduce((sum,entry)=>sum+entry.transferSize,0);
  const navTiming=await page.evaluate(()=>{
    const nav=performance.getEntriesByType('navigation')[0];
    return nav?{transferSize:nav.transferSize||0,encodedBodySize:nav.encodedBodySize||0,decodedBodySize:nav.decodedBodySize||0,domContentLoaded:nav.domContentLoadedEventEnd||0,loadEvent:nav.loadEventEnd||0}:null;
  });
  console.log('Web Beta landing performance:',JSON.stringify({resourceRequests:resources.length,questionBundleRequests:new Set(bundleRequests).size,questionBundleTransfer:bundleTransfer,firstUsableMs,nav:navTiming}));
  assert.equal(individualQuestionRequests.length,0,'First landing load must not request individual KPSS test modules');
  assert.equal(new Set(bundleRequests).size,6,'First landing load must use six subject bundles');
  assert.ok(resources.length<80,'First landing load must stay far below the former hundreds-of-requests pattern');

  const bankStats=await page.evaluate(()=>({
    tests:window.RotaQuestionBank?.topicTests?.().length||0,
    questions:window.RotaQuestionBank?.topicTests?.().reduce((sum,test)=>sum+(test.questions?.length||0),0)||0,
    branchExams:window.RotaKpssBankExams?.sectionExams?.length||0,
    branchReadiness:window.RotaKpssBankExams?.readiness?.filter(row=>row.status==='ready').length||0,
    sectionBlueprints:window.RotaAssessmentBlueprints?.sectionExams?.length||0
  }));
  assert.deepEqual(bankStats,{tests:256,questions:3072,branchExams:18,branchReadiness:6,sectionBlueprints:18},'Bundled web runtime must preserve the complete question bank and branch-exam registry');

  const visible=((await page.locator('body').innerText())||'');
  assert.equal(await page.title(),'Çalışma Rotası · KPSS Web Beta','Public browser title must be the KPSS Web Beta title');
  const metaDescription=await page.locator('meta[name="description"]').getAttribute('content');
  assert.match(metaDescription||'',/KPSS/i,'Public meta description must be KPSS-specific');
  assert.ok(!/YKS|TYT|AYT|YDT|Rota Hoca/i.test(metaDescription||''),'Public meta description must not leak retired product scope');
  assert.equal(await page.locator('link[rel="icon"][href="/favicon.svg"]').count(),1,'Public beta must expose the branded favicon');
  assert.equal(await page.locator('meta[name="theme-color"][content="#071225"]').count(),1,'Public beta must expose the branded browser theme color');
  assert.match((await page.locator('meta[property="og:title"]').getAttribute('content'))||'',/Çalışma Rotası/i,'Public beta must expose share metadata');
  for(const retired of ['Rota Hoca','Yorumlar','SSS','1 Dakikada Keşfet','Gerçek Sonuç']){
    assert.equal(visible.includes(retired),false,'Public Web Beta must not expose retired/dead copy: '+retired);
  }
  assert.ok(visible.includes('Ücretsiz Web Beta'),'Landing must identify the current public beta honestly');
  assert.match(visible,/Çalışmaların bu tarayıcıda saklanır/i,'Mobile landing must disclose local-only storage before onboarding');
  assert.match(visible,/Safari\/Chrome/i,'Instagram-bound beta must recommend a stable browser for local persistence');
  assert.equal(await page.locator('.v6-prep-card[data-exam="kpss"]').count(),1,'Landing must keep exactly one real KPSS product entry');
  assert.equal(await page.locator('[data-action="paid-pricing"],[data-action="paid-offer"],[data-action="paid-upgrade"],[data-view="membership"]').count(),0,'Web Beta must not expose unfinished monetization controls');

  await page.getByRole('button',{name:/Beta bilgisi/}).click();
  await page.getByRole('heading',{name:'Ücretsiz Web Beta'}).waitFor({state:'visible'});
  const betaModal=((await page.locator('dialog').innerText())||'');
  assert.match(betaModal,/tarayıcıda yerel olarak saklanır/i);
  assert.match(betaModal,/yedek/i);
  await page.locator('[data-action="close-modal"]').click();
  assert.equal(await page.locator('#modal').evaluate(el=>el.open),false,'Modal must be closed before starting onboarding');

  await page.locator('.v6-main-cta').click();
  await page.locator('[data-premium-surface="onboarding"]').waitFor({state:'visible'});
  const activeExam=await page.evaluate(()=>{
    for(const [key,raw] of Object.entries(localStorage)){
      if(!key.startsWith('calisma-rotasi:all:v5'))continue;
      try{const value=JSON.parse(raw);if(value?.workspaces?.kpss&&value?.workspaces?.yks)return value.activeExam||null;}catch{}
    }
    return null;
  });
  assert.equal(activeExam,'kpss','Public CTA must activate the KPSS workspace');
  assert.equal(await page.locator('[data-view="teacher"]').count(),0,'Rota Hoca navigation must not exist in Web Beta');
  assert.equal(await page.locator('.preview-bar').count(),0,'Web Beta must not expose the development preview strip');
  const onboardingCopy=(await page.locator('body').innerText())||'';
  assert.ok(!/Rota Hoca|\bYKS\b|\bTYT\b|\bAYT\b|\bYDT\b|149\s*₺/i.test(onboardingCopy),'Onboarding must not leak retired product or unfinished pricing copy');
  assert.equal(await page.locator('[data-action="paid-pricing"],[data-action="paid-offer"],[data-action="paid-upgrade"],[data-view="membership"]').count(),0,'Onboarding must stay free of unfinished billing surfaces');

  assert.deepEqual(errors,[],'Web Beta page errors:\n'+errors.join('\n'));
  console.log('Web Beta browser passed: honest landing, local-only disclosure, direct KPSS onboarding, no Rota Hoca.');
  await context.close();
} finally {
  if(browser)await browser.close();
  await stop();
}
