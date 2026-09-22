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

  // Stage 1 · welcome
  await form().locator('button[type="submit"]').click();

  // Stage 2 · goals
  await form().locator('[name="targetScore"][value="85"]').evaluate(el=>{
    el.checked=true;
    el.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await form().locator('[name="targetNet"]').fill('82');
  await form().locator('[name="dailyMinutes"][value="240"]').evaluate(el=>{
    el.checked=true;
    el.dispatchEvent(new Event('change',{bubbles:true}));
  });

  const days=form().locator('[name="days"]');
  for(let i=0;i<await days.count();i++){
    const box=days.nth(i);
    if(!(await box.isChecked())){
      const label=box.locator('xpath=ancestor::label[1]');
      await label.click();
    }
  }
  await form().locator('button[type="submit"]').click();

  // Stage 3 · situation analysis
  await form().locator('[name="currentNetApprox"][value="50"]').evaluate(el=>{
    el.checked=true;
    el.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await form().locator('[name="studyHabit"][value="yes"]').evaluate(el=>{
    el.checked=true;
    el.dispatchEvent(new Event('change',{bubbles:true}));
  });
  const weakMath=form().locator('[name="weakSubjects"][value="k-ma"]');
  if(await weakMath.count()) await weakMath.evaluate(el=>{
    el.checked=true;
    el.dispatchEvent(new Event('change',{bubbles:true}));
  });
  const strongTurkish=form().locator('[name="strongSubjects"][value="k-tr"]');
  if(await strongTurkish.count()) await strongTurkish.evaluate(el=>{
    el.checked=true;
    el.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await form().locator('button[type="submit"]').click();

  await page.locator('[data-action="summary-build"]').click();
  await page.locator('.route-building-card').waitFor({state:'visible'});
  await page.clock.fastForward(5500);
  await page.locator('[data-premium-surface="today"]').waitFor({state:'visible'});
  await page.locator('.pnx-stage').waitFor({state:'visible'});
  await page.clock.fastForward(5000);
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

  assert.ok(await page.locator('body.app-premium-next-ready.pnx-today-reference.pnx3-dashboard-ready').count(),'KPSS target dashboard layer must activate');
  assert.ok(await page.locator('.pnx-global-search').isVisible(),'Today top bar must expose the KPSS search affordance');
  assert.match(await page.locator('.pnx-global-search').innerText(),/KPSS/i,'Search affordance must be KPSS-specific');
  assert.ok(await page.locator('.pnx-head-art').isVisible(),'Today header must include the journey/date visual');
  assert.equal(await page.locator('.premium-signal-rail > .premium-signal:not([hidden])').count(),4,'Today must expose four premium status cards');
  assert.ok(await page.locator('.pnx3-dashboard').isVisible(),'Today must expose the approved three-column dashboard');
  assert.ok(await page.locator('.pnx3-plan .route-task').count(),'Bugünün Planı must reuse the real route tasks');
  assert.ok(await page.getByText('Bugünün Planı',{exact:true}).count(),'Route panel must use the approved Bugünün Planı title');
  assert.ok(await page.locator('.pnx3-focus .pnx-pomodoro').isVisible(),'Center focus card must expose the Pomodoro ring');
  assert.ok(await page.locator('.pnx3-week-card').isVisible(),'Today must expose the Bu Hafta card');
  assert.ok(await page.locator('.pnx3-goals-card').isVisible(),'Today must expose the KPSS goals card');
  assert.ok(await page.locator('.pnx3-highlights-card').isVisible(),'Today must expose the KPSS highlights card');
  assert.ok(await page.locator('.pnx3-highlights-list > button').count(),'Weekly highlights must be populated from the real route plan');
  assert.equal(await page.locator('[data-view="teacher"]').count(),0,'Rota Hoca navigation must be removed');
  assert.ok(await page.locator('.pnx3-results-card').isVisible(),'Today must expose the last-exam results surface');
  assert.ok(await page.locator('.pnx3-quote-card').isVisible(),'Today must expose the daily quote card');
  assert.equal(await page.locator('.pnx3-quote-card .pnx3-quote-kicker').count(),1,'Daily quote must have one kicker layer');
  assert.equal(await page.locator('.pnx3-quote-card blockquote').count(),1,'Daily quote must have one quote layer');
  assert.ok(await page.locator('.pnx-head-art').isVisible(),'Top hero visual and date area must stay visible on desktop');
  assert.ok(await page.locator('.pnx3-insight-archive').count(),'Explainability must remain available below the first-screen dashboard');
  assert.ok(await page.locator('.cr-theme-toggle-app').isVisible(),'Today top bar must expose day/night mode');
  await noOverflow(page,'Today 1512');
  await page.screenshot({path:OUT+'/today-1512.png',fullPage:false});

  await page.setViewportSize({width:1440,height:900});
  await noOverflow(page,'Today 1440');
  await page.screenshot({path:OUT+'/today-1440.png',fullPage:false});
  await page.setViewportSize({width:1512,height:982});

  await navigateDesktop(page,'plan');
  await page.getByRole('heading',{name:'Programım'}).waitFor({state:'visible'});
  await page.locator('body.pnx-program-day-ready').waitFor({state:'attached'});
  await page.locator('.pnx-program-workspace').waitFor({state:'visible'});
  assert.equal(await page.locator('.pnx-program-day-tab').count(),7,'Desktop Program must keep all seven real day selectors');
  assert.equal(await page.locator('.week-grid > .day-column.pnx-program-active-day').count(),1,'Program must focus one selected day without deleting the weekly route DOM');
  await noOverflow(page,'Program 1512');
  await page.screenshot({path:OUT+'/program-1512.png',fullPage:false});

  await navigateDesktop(page,'exams');
  await page.locator('[data-premium-surface="exams"]').waitFor({state:'visible'});
  await noOverflow(page,'Deneme Merkezi 1512');
  await page.screenshot({path:OUT+'/deneme-1512.png',fullPage:false});

  await addRealExam(page);
  await page.locator('.analysis-panel').screenshot({path:OUT+'/ders-analizi-1512.png'});

  await navigateDesktop(page,'today');
  await page.locator('.pnx3-results-card:not(.is-empty)').waitFor({state:'visible'});
  assert.match(await page.locator('.pnx3-results-card').innerText(),/Genel net/i,'Today must show the real saved full-exam result after evidence exists');
  assert.match(await page.locator('.pnx3-goals-card').innerText(),/KPSS Genel Net/i,'Goals must stay bound to KPSS exam evidence');

  
  await page.setViewportSize({width:390,height:844});
  await page.locator('.pnx-stage').waitFor({state:'visible'});
  await noOverflow(page,'Today 390');
  const mobileTodayPlan=await page.locator('.pnx3-plan-card').evaluate(card=>{
    const task=card.querySelector('.route-task');
    const action=task?.querySelector('.route-task-actions');
    const check=action?.querySelector('.check-btn');
    const rect=(el)=>{
      if(!el)return null;
      const r=el.getBoundingClientRect();
      return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};
    };
    return {
      card:rect(card),
      task:rect(task),
      action:rect(action),
      check:rect(check),
      taskScrollWidth:task?.scrollWidth||0,
      taskClientWidth:task?.clientWidth||0
    };
  });
  assert.ok(mobileTodayPlan.task&&mobileTodayPlan.check,'Mobile Today must expose a measurable plan row and completion control');
  assert.ok(
    mobileTodayPlan.check.left>=mobileTodayPlan.task.left-1 &&
    mobileTodayPlan.check.right<=mobileTodayPlan.task.right+1,
    'Mobile Today completion control must stay inside its task row'
  );
  assert.ok(
    Math.abs(mobileTodayPlan.check.width-mobileTodayPlan.check.height)<=2 &&
    mobileTodayPlan.check.width<=40,
    'Mobile Today completion control must remain a compact circular control'
  );
  assert.ok(
    mobileTodayPlan.taskScrollWidth<=mobileTodayPlan.taskClientWidth+2,
    'Mobile Today task content must not overflow its row'
  );
  const hiddenSidebar=await page.locator('.sidebar').evaluate(el=>{
    const r=el.getBoundingClientRect();
    return {right:r.right,left:r.left,width:r.width};
  });
  assert.ok(hiddenSidebar.right<=1,'Mobile sidebar must be fully off-canvas until opened');
  await page.screenshot({path:OUT+'/today-390.png',fullPage:false});

  await page.setViewportSize({width:360,height:800});
  await noOverflow(page,'Today 360');
  await page.screenshot({path:OUT+'/today-360.png',fullPage:false});
  await page.setViewportSize({width:390,height:844});

  await navigateMobile(page,'plan');
  await page.getByRole('heading',{name:'Programım'}).waitFor({state:'visible'});
  await page.locator('body.pnx-program-day-ready').waitFor({state:'attached'});
  const mobileFlow=await page.locator('.pnx-program-workspace').evaluate(el=>({
    display:getComputedStyle(el).display,
    width:el.scrollWidth,
    client:el.clientWidth
  }));
  assert.equal(await page.locator('.pnx-program-day-tab').count(),7,'Mobile Program must preserve seven day selectors');
  assert.equal(await page.locator('.week-grid > .day-column.pnx-program-active-day').count(),1,'Mobile Program must keep one focused selected day');
  assert.ok(mobileFlow.width<=mobileFlow.client+2,'Mobile Program workspace must fit its viewport');
  await noOverflow(page,'Program 390');
  await page.screenshot({path:OUT+'/program-390.png',fullPage:false});

  await page.setViewportSize({width:360,height:800});
  await noOverflow(page,'Program 360');
  await page.screenshot({path:OUT+'/program-360.png',fullPage:false});

  assert.deepEqual(errors,[],'Visual review page errors:\n'+errors.join('\n'));
  console.log(JSON.stringify({
    screenshots:[
      'today-1512.png','today-1440.png','program-1512.png',
      'deneme-1512.png','ders-analizi-1512.png','today-390.png','today-360.png','program-390.png','program-360.png'
    ],
    mobileProgram:mobileFlow
  },null,2));
}finally{
  if(browser)await browser.close();
  server.kill('SIGTERM');
}
