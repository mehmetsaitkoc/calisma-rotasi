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

  await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
  await page.locator('.welcome.premium-landing-final').waitFor({state:'visible'});
  const betaRuntime=await page.evaluate(()=>({href:location.href,webBeta:window.RotaWebBeta===true,accountAvailable:window.RotaAccount?.available,status:window.RotaAccount?.status}));
  assert.equal(new URL(betaRuntime.href).searchParams.has('fresh'),false,'Share-readiness must exercise the real public root URL');
  assert.equal(betaRuntime.webBeta,true,'Share-readiness must run with Web Beta mode enabled');
  assert.equal(betaRuntime.accountAvailable,false,'Share-readiness must keep account/sync unavailable');
  assert.equal(betaRuntime.status,'local-only','Share-readiness must verify local-only persistence mode');
  const landingWidths=[1512,1440,1280,1024,768,430,390,375,360,320];
  for(const width of landingWidths){
    await page.setViewportSize({width,height:width>=768?900:844});
    await noOverflow(page,width+'px landing');
    assert.ok(await page.locator('.v6-main-cta').isVisible(),width+'px landing must keep the primary CTA visible');
    const geometry=await page.locator('.welcome.premium-landing-final').evaluate(root=>{
      const nav=root.querySelector('.v6-topbar')?.getBoundingClientRect();
      const cta=root.querySelector('.v6-main-cta')?.getBoundingClientRect();
      const copy=root.querySelector('.v6-hero-copytext');
      return {navWidth:nav?.width||0,ctaWidth:cta?.width||0,ctaHeight:cta?.height||0,copyFont:Number.parseFloat(copy?getComputedStyle(copy).fontSize:'0')||0};
    });
    assert.ok(geometry.navWidth<=width+2,width+'px navbar must fit the viewport');
    assert.ok(geometry.ctaWidth>=120&&geometry.ctaHeight>=40,width+'px primary CTA must remain tappable');
    assert.ok(geometry.copyFont>=14,width+'px hero body copy must remain legible');
    await page.screenshot({path:path.join(OUT,'landing-'+width+'.png'),fullPage:false});
  }
  await page.setViewportSize({width:390,height:844});
  await fs.promises.mkdir('work/production-evidence',{recursive:true});
  await page.screenshot({path:'work/production-evidence/web-beta-landing-390.png',fullPage:true});

  const copy=((await page.locator('body').innerText())||'');
  assert.match(copy,/Ücretsiz Web Beta/i);
  assert.match(copy,/Kişisel Çalışma/i);
  assert.match(copy,/Örnek Paneli Gör/i);
  assert.ok(!/Rota Hoca/i.test(copy),'Landing must not mention retired Rota Hoca');
  assert.ok(!/Yorumlar|SSS|Gerçek Sonuç|1 Dakikada Keşfet/i.test(copy),'Landing must not expose dead navigation or misleading copy');
  assert.equal(await page.locator('.v6-prep-card[data-exam="kpss"]').count(),1,'Landing must expose exactly one real KPSS product entry');
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
  const todayWidths=[430,390,375,360,320];
  for(const width of todayWidths){
    await page.setViewportSize({width,height:844});
    await noOverflow(page,width+'px Today');
    const dock=page.locator('.mobile-dock');
    assert.ok(await dock.isVisible(),width+'px Today must keep the bottom navigation visible');
    const dockBox=await dock.boundingBox();
    assert.ok(dockBox&&dockBox.x>=-1&&dockBox.x+dockBox.width<=width+1,width+'px bottom navigation must stay inside the viewport');
    const firstTask=page.locator('.route-task').first();
    const taskBox=await firstTask.boundingBox();
    assert.ok(taskBox&&taskBox.x>=-1&&taskBox.x+taskBox.width<=width+1,width+'px route task must stay inside the viewport');
    await page.screenshot({path:path.join(OUT,'today-'+width+'.png'),fullPage:false});
  }
  await page.setViewportSize({width:390,height:844});

  const todayCopy=((await page.locator('body').innerText())||'');
  assert.ok(!/Rota Hoca/i.test(todayCopy),'Today must not mention retired Rota Hoca');
  assert.ok(!/\\bYKS\\b|\\bTYT\\b|\\bAYT\\b|\\bYDT\\b/i.test(todayCopy),'Today must stay KPSS-only');
  assert.equal(await page.locator('[data-view="teacher"]').count(),0,'Teacher navigation must be absent');
  assert.equal(await page.locator('[data-action="paid-membership"]').count(),0,'Inactive membership controls must be absent in Web Beta');
  assert.equal(await page.locator('.sidebar-plus').count(),0,'Inactive Plus promo must be absent in Web Beta');
  assert.equal(await page.locator('.topbar-upgrade').count(),0,'Inactive Plus topbar CTA must be absent in Web Beta');
  assert.equal(await page.locator('[data-view="monthly-report"]').count(),0,'Unavailable monthly-report upsell must be absent in Web Beta');
  assert.match(((await page.locator('[data-account-status]').innerText())||''),/Web Beta|Yerel kayıt/i,'Account status must explain local-only beta storage');
  const task=page.locator('.route-task').first();
  assert.ok(await task.locator('.check-btn').count(),'Today task must expose completion');
  assert.ok(await task.locator('[data-action="route-later"]').count(),'Today task must expose Daha sonra');
  assert.ok(await task.locator('[data-action="route-skip"]').count(),'Today task must expose Atla');
  assert.ok(((await task.locator('.route-task-reason').textContent())||'').trim(),'Today task must explain why it is scheduled');
  assert.ok(((await task.locator('.route-mode-explain').textContent())||'').trim(),'Today task must explain its route mode');

  // Exercise the mobile toast layout with multiple simultaneous messages. Only the
  // newest may remain visible, and it must sit above the bottom navigation.
  await page.evaluate(()=>{
    const host=document.querySelector('#toasts');
    if(!host)throw new Error('Toast host missing');
    host.replaceChildren(...['Bir','İki','Son bildirim'].map(text=>{
      const node=document.createElement('div');node.className='toast';node.textContent=text;return node;
    }));
  });
  const visibleToasts=page.locator('#toasts .toast:visible');
  assert.equal(await visibleToasts.count(),1,'Mobile Web Beta must show only the latest toast');
  const toastBox=await visibleToasts.first().boundingBox();
  const dockBox=await page.locator('.mobile-dock').boundingBox();
  assert.ok(toastBox&&dockBox&&toastBox.y+toastBox.height<=dockBox.y+2,'Toast must remain above the bottom navigation');
  await page.evaluate(()=>document.querySelector('#toasts')?.replaceChildren());

  await page.screenshot({path:'work/production-evidence/web-beta-today-390.png',fullPage:true});

  // Web Beta persistence controls must be usable and stay KPSS-only.
  await page.locator('.sidebar [data-action="nav"][data-view="settings"]').first().evaluate(node=>node.click());
  await page.getByRole('heading',{name:'Ayarlar ve yedek'}).waitFor({state:'visible'});
  const settingsCopy=((await page.locator('#app').innerText())||'');
  assert.match(settingsCopy,/tarayıcıda yerel olarak saklanır/i);
  assert.match(settingsCopy,/Yedek indir/i);
  assert.match(settingsCopy,/Yedek yükle/i);
  assert.ok(!/\bYKS\b|\bTYT\b|\bAYT\b|\bYDT\b|Rota Hoca/i.test(settingsCopy),'Web Beta settings must stay KPSS-only');

  const downloadPromise=page.waitForEvent('download');
  await page.locator('[data-action="export"]').click();
  const download=await downloadPromise;
  assert.match(download.suggestedFilename(),/^calisma-rotasi-yedek-\d{4}-\d{2}-\d{2}\.json$/,'Backup export must produce a dated JSON file');

  const backupJson=await page.evaluate(()=>{
    let current=null;
    for(const raw of Object.values(localStorage)){
      try{const parsed=JSON.parse(raw);if(parsed?.workspaces?.kpss){current=parsed;break;}}catch{}
    }
    if(!current)throw new Error('Web Beta state missing for backup test');
    return JSON.stringify(window.RotaContracts.makeBackupEnvelope(current,{appVersion:'4.1'}));
  });
  const backupInput=page.locator('#backup-file');
  await backupInput.setInputFiles({name:'rota-valid.json',mimeType:'application/json',buffer:Buffer.from(backupJson)});
  await page.getByText('KPSS yedeğini yükle?',{exact:true}).waitFor({state:'visible'});
  const backupModalText=((await page.locator('#modal').innerText())||'');
  assert.ok(!/\bYKS\b|\bTYT\b|\bAYT\b|\bYDT\b|Rota Hoca/i.test(backupModalText),'Backup confirmation must not leak retired scope');
  await page.locator('#modal [aria-label="Pencereyi kapat"]').click();

  await backupInput.setInputFiles({name:'too-large.json',mimeType:'application/json',buffer:Buffer.alloc(2*1024*1024+1,0x20)});
  await page.getByText(/Yedek dosyası en fazla 2 MB olabilir/i).waitFor({state:'visible'});

  await backupInput.setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{broken')});
  await page.getByText(/Yedek yüklenmedi/i).last().waitFor({state:'visible'});

  await page.locator('[data-action="reset-workspace"]').click();
  await page.getByText('KPSS kayıtlarını sıfırla?',{exact:true}).waitFor({state:'visible'});
  const resetText=((await page.locator('#modal').innerText())||'');
  assert.ok(!/\bYKS\b|\bTYT\b|\bAYT\b|\bYDT\b|Rota Hoca/i.test(resetText),'Reset confirmation must stay KPSS-only');
  await page.locator('#modal [aria-label="Pencereyi kapat"]').click();

  assert.deepEqual(pageErrors,[],'Page errors:\n'+pageErrors.join('\n'));
  assert.deepEqual(consoleErrors,[],'Console errors:\n'+consoleErrors.join('\n'));
  console.log('Web beta share readiness passed: landing + onboarding + Today + local-only storage + KPSS-only/no-dead-sales surfaces.');
} finally {
  if(browser)await browser.close();
  await stop();
}
