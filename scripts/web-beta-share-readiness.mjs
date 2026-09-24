import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT=Number(process.env.WEB_BETA_SHARE_PORT||8912);
const BASE='http://127.0.0.1:'+PORT;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let child,serverLog='';

async function start(){
  child=spawn(process.execPath,['server.mjs'],{
    cwd:process.cwd(),
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
  child.stdout.on('data',x=>serverLog+=x);
  child.stderr.on('data',x=>serverLog+=x);
  for(let i=0;i<120;i++){
    if(child.exitCode!==null)throw Error(serverLog||'Server exited early');
    try{const r=await fetch(BASE+'/api/health');if(r.ok)return;}catch{}
    await sleep(50);
  }
  throw Error(serverLog||'Server timeout');
}
async function stop(){
  if(child&&child.exitCode===null){
    child.kill('SIGTERM');
    for(let i=0;i<40&&child.exitCode===null;i++)await sleep(25);
    if(child.exitCode===null)child.kill('SIGKILL');
  }
}
async function noOverflow(page,label){
  const size=await page.evaluate(()=>({inner:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(size.scroll<=size.inner+2,label+' overflows horizontally: '+size.scroll+' > '+size.inner);
}

let browser;
try{
  await start();
  const health=await (await fetch(BASE+'/api/health')).json();
  assert.equal(health.ok,true);
  assert.deepEqual(health.accounts,{available:false,mode:'local-only'});
  assert.equal(health.entitlement.accountRequired,false);

  const privacy=await (await fetch(BASE+'/privacy.html')).text();
  assert.ok(!/Rota Hoca/i.test(privacy),'Public privacy page must not mention retired Rota Hoca');

  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},locale:'tr-TR',timezoneId:'Europe/Istanbul'});
  const page=await context.newPage();
  const pageErrors=[],consoleErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e?.stack||e)));
  page.on('console',m=>{if(m.type()==='error'&&!/favicon/i.test(m.text()))consoleErrors.push(m.text());});

  await page.goto(BASE+'/?fresh=1',{waitUntil:'domcontentloaded'});
  await page.locator('.welcome.premium-landing-final').waitFor({state:'visible'});
  await noOverflow(page,'390px landing');

  const copy=((await page.locator('body').innerText())||'');
  assert.match(copy,/Ücretsiz Web Beta/i);
  assert.match(copy,/Kişisel Çalışma/i);
  assert.match(copy,/Örnek Paneli Gör/i);
  assert.ok(!/Rota Hoca/i.test(copy),'Landing must not mention retired Rota Hoca');
  assert.ok(!/Yorumlar|SSS|Gerçek Sonuç|1 Dakikada Keşfet/i.test(copy),'Landing must not expose dead navigation or misleading copy');
  assert.equal(await page.locator('[data-exam="kpss"]').count(),1,'Landing must expose exactly one real KPSS product entry');
  assert.equal(await page.locator('[data-exam="yks"]').count(),0,'Web Beta must stay KPSS-only');

  const topStart=page.locator('.v6-nav-actions .v6-gradient-btn');
  assert.ok(await topStart.isVisible(),'Primary mobile CTA must be visible above the fold');
  const heroStart=page.locator('.v6-main-cta');
  assert.ok(await heroStart.isVisible(),'Hero CTA must be visible');

  // Web Beta information must honestly describe local-only storage.
  await page.locator('[data-account-action="open"]').evaluate(el=>el.click());
  await page.getByText('Ücretsiz Web Beta',{exact:true}).waitFor({state:'visible'});
  const modalText=((await page.locator('.modal,.dialog,.modal-card,[role="dialog"]').last().textContent().catch(()=>''))||'') + ' ' + ((await page.locator('body').innerText())||'');
  assert.match(modalText,/tarayıcıda|yerel/i);
  await page.locator('[data-action="close-modal"],.modal-close,.dialog-close').first().click().catch(()=>{});

  // Main conversion path.
  await heroStart.click();
  await page.locator('[data-premium-surface="onboarding"]').waitFor({state:'visible'});
  assert.ok(!/Rota Hoca/i.test((await page.locator('body').innerText())||''),'Onboarding must not mention retired Rota Hoca');
  await noOverflow(page,'390px onboarding');

  assert.deepEqual(pageErrors,[],'Page errors:\n'+pageErrors.join('\n'));
  assert.deepEqual(consoleErrors,[],'Console errors:\n'+consoleErrors.join('\n'));
  console.log('Web beta share readiness passed: mobile landing + honest local storage + clean KPSS onboarding + no retired Rota Hoca.');
} finally {
  if(browser)await browser.close();
  await stop();
}
