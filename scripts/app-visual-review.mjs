import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT=Number(process.env.APP_REVIEW_PORT||8802);
const BASE=`http://127.0.0.1:${PORT}`;
const FIXED_DAY='2026-09-21';
const OUT='artifacts/app-ui-premium-next';

const server=spawn(process.execPath,['server.mjs'],{
  cwd:process.cwd(),
  env:{...process.env,PORT:String(PORT),HOST:'127.0.0.1',OPENAI_API_KEY:'',RENDER:'false'},
  stdio:['ignore','pipe','pipe']
});
let serverLog='';
server.stdout.on('data',d=>{serverLog+=d;});
server.stderr.on('data',d=>{serverLog+=d;});

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitServer(){
  for(let i=0;i<100;i++){
    try{const r=await fetch(BASE+'/api/health');if(r.ok)return;}catch{}
    await sleep(100);
  }
  throw new Error('App visual-review server did not start.\n'+serverLog);
}
async function noOverflow(page,label){
  const size=await page.evaluate(()=>({
    scroll:document.documentElement.scrollWidth,
    inner:window.innerWidth
  }));
  assert.ok(size.scroll<=size.inner+2,`${label} overflows viewport: ${size.scroll} > ${size.inner}`);
}
async function navigateDesktop(page,view){
  const button=page.locator(`.sidebar [data-action="nav"][data-view="${view}"]`).first();
  await button.waitFor({state:'visible'});
  await button.click();
  await page.locator('#app').waitFor({state:'visible'});
}
async function navigateMobile(page,view){
  const direct=page.locator(`.mobile-dock [data-action="nav"][data-view="${view}"]`).first();
  if(await direct.count()){
    await direct.click();
  }else{
    await page.locator('.mobile-dock [data-action="menu"]').first().click();
    await page.locator('body.menu-open').waitFor({state:'attached'});
    const item=page.locator(`.sidebar [data-action="nav"][data-view="${view}"]`).first();
    await item.waitFor({state:'visible'});
    await item.click();
  }
  await page.locator('#app').waitFor({state:'visible'});
}
async function submitWizard(page){
  await page.locator('[data-premium-surface="welcome"]').waitFor({state:'visible'});
  await page.locator('[data-action="choose-exam"][data-exam="kpss"]').click();
  await page.locator('[data-premium-surface="onboarding"]').waitFor({state:'visible'});

  const form=()=>page.locator('#setup-wizard-form');
  await form().locator('[name="name"]').fill('Sait');
  await form().locator('button[type="submit"]').click();

  await form().locator('[name="studyHabit"][value="yes"]').check();
  await form().locator('button[type="submit"]').click();

  await form().locator('[name="currentNet"]').fill('48');
  await form().locator('button[type="submit"]').click();

  await form().locator('[name="targetNet"]').fill('82');
  await form().locator('button[type="submit"]').click();

  await form().locator('[name="dailyMinutes"][value="240"]').check();
  await form().locator('button[type="submit"]').click();

  const days=form().locator('[name="days"]');
  for(let i=0;i<await days.count();i++){
    const box=days.nth(i);
    if(!(await box.isChecked())){
      const label=box.locator('xpath=ancestor::label[1]');
      await label.click();
    }
  }
  await form().locator('button[type="submit"]').click();

  await form().locator('[name="targetScore"]').fill('88');
  await form().locator('[name="target"]').fill('Premium rota görsel QA');
  await form().locator('button[type="submit"]').click();

  const math=form().locator('select[name="level:k-ma"]');
  if(await math.count()) await math.selectOption('0');
  const turkish=form().locator('select[name="level:k-tr"]');
  if(await turkish.count()) await turkish.selectOption('2');
  await form().locator('button[type="submit"]').click();

  await page.locator('[data-action="summary-build"]').click();
  await page.locator('.route-building-card').waitFor({state:'visible'});
  await page.clock.fastForward(5500);
  await page.locator('[data-premium-surface="today"]').waitFor({state:'visible'});
  await page.locator('.pnx-stage').waitFor({state:'visible'});
}
async function addRealExam(page){
  await page.locator('[data-action="add-exam"]').first().click();
  const examForm=page.locator('#exam-form');
  await examForm.waitFor({state:'visible'});
  await examForm.locator('[name="name"]').fill('Görsel QA Denemesi');
  const rows=examForm.locator('#exam-parts tr[data-part]');
  for(let i=0;i<await rows.count();i++){
    const row=rows.nth(i);
    const total=Number(await row.locator('[data-field="total"]').inputValue());
    const correct=i===0?Math.max(1,Math.floor(total*.20)):Math.max(1,Math.floor(total*.70));
    const wrong=i===0?Math.max(1,Math.floor(total*.28)):Math.max(0,Math.floor(total*.08));
    await row.locator('[data-field="correct"]').fill(String(correct));
    await row.locator('[data-field="wrong"]').fill(String(Math.min(wrong,total-correct)));
  }
  await examForm.locator('button[type="submit"]').click();
  await examForm.waitFor({state:'detached'});
  await page.locator('.analysis-panel').waitFor({state:'visible'});
}

let browser;
try{
  await waitServer();
  await fs.mkdir(OUT,{recursive:true});
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({
    viewport:{width:1512,height:982},
    locale:'tr-TR',
    timezoneId:'Europe/Istanbul'
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e?.stack||e)));
  await page.clock.install({time:new Date(FIXED_DAY+'T09:00:00+03:00')});
  await page.goto(BASE+'/?fresh=1&app-review=1',{waitUntil:'domcontentloaded'});
  await submitWizard(page);

  assert.ok(await page.locator('body.app-premium-next-ready.pnx-today-reference').count(),'Approved Today reference layer must activate');
  assert.ok(await page.locator('.pnx-global-search').isVisible(),'Today top bar must expose the premium global search affordance');
  assert.ok(await page.locator('.pnx-head-art').isVisible(),'Today header must include the journey/date visual');
  assert.equal(await page.locator('.premium-signal-rail > .premium-signal:not([hidden])').count(),4,'Today must expose four premium status cards');
  assert.ok(await page.locator('.pnx-primary .pnx-reference-hero').isVisible(),'Today must have one dominant primary task');
  assert.ok(await page.locator('.pnx-pomodoro').isVisible(),'Primary task must expose the Pomodoro focus ring');
  assert.ok(await page.locator('.pnx-route-panel .route-task').count(),'Today route list must remain visible');
  assert.ok(await page.getByText('Bugünün Rotası',{exact:true}).count(),'Route panel must use the approved Bugünün Rotası title');
  assert.ok(await page.getByText('Neden bugün?',{exact:true}).count(),'Today must expose the explainable decision moment');
  assert.ok(await page.locator('.pnx-mode-card').isVisible(),'Today must expose the route mode card');
  assert.ok(await page.locator('.pnx-teacher-card').isVisible(),'Today must expose the Rota Hoca card');
  await noOverflow(page,'Today 1512');
  await page.screenshot({path:OUT+'/today-1512.png',fullPage:false});

  await page.setViewportSize({width:1440,height:900});
  await noOverflow(page,'Today 1440');
  await page.screenshot({path:OUT+'/today-1440.png',fullPage:false});
  await page.setViewportSize({width:1512,height:982});

  await navigateDesktop(page,'plan');
  await page.getByRole('heading',{name:'Programım'}).waitFor({state:'visible'});
  assert.ok(await page.locator('.week-grid .day-column').count()===7,'Desktop Program must expose seven days');
  await noOverflow(page,'Program 1512');
  await page.screenshot({path:OUT+'/program-1512.png',fullPage:false});

  await navigateDesktop(page,'teacher');
  await page.locator('[data-premium-surface="teacher"]').waitFor({state:'visible'});
  await noOverflow(page,'Rota Hoca 1512');
  await page.screenshot({path:OUT+'/rota-hoca-1512.png',fullPage:false});

  await navigateDesktop(page,'exams');
  await page.locator('[data-premium-surface="exams"]').waitFor({state:'visible'});
  await noOverflow(page,'Deneme Merkezi 1512');
  await page.screenshot({path:OUT+'/deneme-1512.png',fullPage:false});

  await addRealExam(page);
  await page.locator('.analysis-panel').screenshot({path:OUT+'/ders-analizi-1512.png'});

  await navigateDesktop(page,'today');
  await page.setViewportSize({width:390,height:844});
  await page.locator('.pnx-stage').waitFor({state:'visible'});
  await noOverflow(page,'Today 390');
  const hiddenSidebar=await page.locator('.sidebar').evaluate(el=>{
    const r=el.getBoundingClientRect();
    return {right:r.right,left:r.left,width:r.width};
  });
  assert.ok(hiddenSidebar.right<=1,'Mobile sidebar must be fully off-canvas until opened');
  await page.screenshot({path:OUT+'/today-390.png',fullPage:false});

  await navigateMobile(page,'plan');
  await page.getByRole('heading',{name:'Programım'}).waitFor({state:'visible'});
  const mobileFlow=await page.locator('.week-grid').evaluate(el=>({
    display:getComputedStyle(el).display,
    direction:getComputedStyle(el).flexDirection,
    width:el.scrollWidth,
    client:el.clientWidth
  }));
  assert.equal(mobileFlow.display,'flex','Mobile Program must switch to vertical flow');
  assert.equal(mobileFlow.direction,'column','Mobile Program must stack days vertically');
  assert.ok(mobileFlow.width<=mobileFlow.client+2,'Mobile Program must not retain desktop horizontal week overflow');
  await noOverflow(page,'Program 390');
  await page.screenshot({path:OUT+'/program-390.png',fullPage:false});

  assert.deepEqual(errors,[],'Visual review page errors:\n'+errors.join('\n'));
  console.log(JSON.stringify({
    screenshots:[
      'today-1512.png','today-1440.png','program-1512.png',
      'rota-hoca-1512.png','deneme-1512.png','ders-analizi-1512.png','today-390.png','program-390.png'
    ],
    mobileProgram:mobileFlow
  },null,2));
}finally{
  if(browser)await browser.close();
  server.kill('SIGTERM');
}
