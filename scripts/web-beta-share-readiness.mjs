import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT=Number(process.env.WEB_BETA_SHARE_PORT||8912);
const BASE='http://127.0.0.1:'+PORT;
const OUT=path.resolve('work/production-evidence/web-beta');
fs.mkdirSync(OUT,{recursive:true});
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

  const sharedHtml=await (await fetch(BASE+'/')).text();
  assert.match(sharedHtml,/property="og:title" content="Çalışma Rotası · KPSS Web Beta"/);
  assert.match(sharedHtml,/property="og:image" content="https:\/\/beta\.example\/hero-journey-final\.webp"/);
  assert.match(sharedHtml,/name="twitter:card" content="summary_large_image"/);

  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},locale:'tr-TR',timezoneId:'Europe/Istanbul'});
  const page=await context.newPage();
  await page.clock.install({time:new Date('2026-09-24T09:00:00+03:00')});
  const pageErrors=[],consoleErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e?.stack||e)));
  page.on('console',m=>{if(m.type()==='error'&&!/favicon/i.test(m.text()))consoleErrors.push(m.text());});

  await page.goto(BASE+'/?fresh=1',{waitUntil:'domcontentloaded'});
  await page.locator('.welcome.premium-landing-final').waitFor({state:'visible'});
  await noOverflow(page,'390px landing');
  await fs.promises.mkdir('work/production-evidence',{recursive:true});
  await page.screenshot({path:'work/production-evidence/web-beta-landing-390.png',fullPage:true});

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
  await page.getByRole('button',{name:/Beta bilgisi/}).click();
  await page.getByText('Ücretsiz Web Beta',{exact:true}).waitFor({state:'visible'});
  const modalText=((await page.locator('.modal,.dialog,.modal-card,[role="dialog"]').last().textContent().catch(()=>''))||'') + ' ' + ((await page.locator('body').innerText())||'');
  assert.match(modalText,/tarayıcıda|yerel/i);
  await page.locator('[data-action="close-modal"],.modal-close,.dialog-close').first().click().catch(()=>{});

  // Main conversion path.
  await heroStart.click();
  await page.locator('[data-premium-surface="onboarding"]').waitFor({state:'visible'});
  assert.ok(!/Rota Hoca/i.test((await page.locator('body').innerText())||''),'Onboarding must not mention retired Rota Hoca');
  await noOverflow(page,'390px onboarding');
  await page.screenshot({path:'work/production-evidence/web-beta-onboarding-390.png',fullPage:true});

  // Finish the real KPSS onboarding to audit the first authenticated-looking product surface.
  await page.locator('#setup-wizard-form button[type="submit"]').click();
  await page.locator('#setup-wizard-form [name="targetScore"][value="85"]').evaluate(el=>{el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.locator('#setup-wizard-form [name="targetNet"]').fill('82');
  await page.locator('#setup-wizard-form [name="dailyMinutes"][value="240"]').evaluate(el=>{el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.locator('#setup-wizard-form button[type="submit"]').click();
  await page.locator('#setup-wizard-form [name="currentNetApprox"][value="50"]').evaluate(el=>{el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.locator('#setup-wizard-form [name="studyHabit"][value="yes"]').evaluate(el=>{el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.locator('#setup-wizard-form button[type="submit"]').click();
  await page.locator('[data-action="summary-build"]').click();
  await page.locator('.route-building-card').waitFor({state:'visible'});
  await page.clock.fastForward(5000);
  await page.locator('.app-shell').waitFor({state:'visible'});
  await page.locator('.route-task').first().waitFor({state:'visible'});
  await noOverflow(page,'390px Today');

  const todayCopy=((await page.locator('body').innerText())||'');
  assert.ok(!/Rota Hoca/i.test(todayCopy),'Today must not mention retired Rota Hoca');
  assert.ok(!/\\bYKS\\b|\\bTYT\\b|\\bAYT\\b|\\bYDT\\b/i.test(todayCopy),'Today must stay KPSS-only');
  assert.equal(await page.locator('[data-view="teacher"]').count(),0,'Teacher navigation must be absent');
  assert.equal(await page.locator('[data-action="paid-membership"]').count(),0,'Inactive membership controls must be absent in Web Beta');
  assert.equal(await page.locator('.sidebar-plus').count(),0,'Inactive Plus promo must be absent in Web Beta');
  assert.equal(await page.locator('.topbar-upgrade').count(),0,'Inactive Plus topbar CTA must be absent in Web Beta');
  assert.equal(await page.locator('[data-view="monthly-report"]').count(),0,'Unavailable monthly-report upsell must be absent in Web Beta');
  assert.match(((await page.locator('[data-account-status]').innerText())||''),/Web Beta|Yerel kayıt/i,'Account status must explain local-only beta storage');
  await page.screenshot({path:'work/production-evidence/web-beta-today-390.png',fullPage:true});

  assert.deepEqual(pageErrors,[],'Page errors:\n'+pageErrors.join('\n'));
  assert.deepEqual(consoleErrors,[],'Console errors:\n'+consoleErrors.join('\n'));
  console.log('Web beta share readiness passed: landing + onboarding + Today + local-only storage + KPSS-only/no-dead-sales surfaces.');
} finally {
  if(browser)await browser.close();
  await stop();
}
