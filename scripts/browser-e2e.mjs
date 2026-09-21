import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = Number(process.env.E2E_PORT || 8799);
const BASE = `http://127.0.0.1:${PORT}`;
const FIXED_DAY = '2026-09-21';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const addDays = (date, days) => {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

async function waitServer() {
  for (let i = 0; i < 80; i++) {
    try {
      const res = await fetch(BASE + '/api/health');
      if (res.ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error('Local server did not become ready.');
}

async function appState(page) {
  return page.evaluate(() => {
    for (const [key, raw] of Object.entries(localStorage)) {
      try {
        const value = JSON.parse(raw);
        if (value?.workspaces?.kpss && value?.workspaces?.yks) return { key, value };
      } catch {}
    }
    throw new Error('Application state was not found in localStorage.');
  });
}

async function assertCleanRender(page, label) {
  const text = await page.locator('body').innerText();
  for (const literal of ['${content}', '${icon(', '${ui.', '[object Object]']) {
    assert.ok(!text.includes(literal), label + ': rendered literal leaked: ' + literal);
  }
  assert.ok(!/\$\{[^}]+\}/.test(text), label + ': literal template interpolation leaked');
  assert.ok(!/\bundefined\b/i.test(text), label + ': undefined leaked');
  assert.ok(!/\bnull\b/i.test(text), label + ': null leaked');
  assert.ok(!/\bNaN\b/.test(text), label + ': NaN leaked');
  const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth }));
  assert.ok(width.scroll <= width.inner + 2, label + ': page overflows mobile viewport (' + width.scroll + ' > ' + width.inner + ')');
}

async function navigate(page, view) {
  const directMobile = page.locator('.mobile-dock [data-action="nav"][data-view="' + view + '"]');
  if (await directMobile.count() && await directMobile.isVisible()) {
    await directMobile.click();
  } else {
    const sidebar = page.locator('.sidebar [data-action="nav"][data-view="' + view + '"]').first();
    assert.ok(await sidebar.count(), 'Navigation target must exist: ' + view);
    const mobileViewport = await page.evaluate(() => window.innerWidth <= 650);
    if (mobileViewport) {
      const menu = page.locator('.mobile-dock [data-action="menu"]').first();
      await menu.waitFor({ state: 'visible' });
      await menu.click();
      await page.locator('body.menu-open').waitFor({ state: 'attached' });
      await sidebar.waitFor({ state: 'visible' });
    }
    await sidebar.click();
  }
  await page.locator('#app').waitFor({ state: 'visible' });
}

function latestTaskMode(space, task) {
  const rows = (space.route?.modeHistory || [])
    .filter(x => x.subjectId === task.subjectId && x.topicId === task.topicId)
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || Number(b.created || 0) - Number(a.created || 0));
  return rows[0]?.mode || null;
}

async function assertTodayContract(page) {
  await page.getByRole('heading', { name: 'Bugünkü Rotan' }).waitFor({ state: 'visible' });
  assert.ok(await page.getByText('ŞİMDİ', { exact: true }).count(), 'Today must show the ŞİMDİ priority marker');

  const cards = page.locator('.route-task');
  assert.ok((await cards.count()) > 0, 'Today must render at least one route task');
  const card = cards.first();

  const subject = (await card.locator('.tiny.muted').first().innerText()).trim();
  const topic = (await card.locator('h3').first().innerText()).trim();
  const meta = await card.locator('.route-task-meta').innerText();
  const reason = (await card.locator('.route-task-reason').innerText()).trim();
  const modeExplain = (await card.locator('.route-mode-explain').innerText()).trim();
  assert.ok(subject, 'Today task must show a lesson/subject');
  assert.ok(topic, 'Today task must show a topic/title');
  assert.match(meta, /\d+\s*dk/, 'Today task must show minutes');
  const allMeta = await page.locator('.route-task-meta').allInnerTexts();
  assert.ok(allMeta.some(x => /≈\s*\d+\s*soru/i.test(x)), 'Today must show a question target on a planned practice task');
  assert.match(meta, /Neden bugün\?/i, 'Today task must expose why it is scheduled today');
  assert.ok(reason, 'Today task must render its route reason');
  assert.ok(modeExplain, 'Today task must explain its route mode in student language');
  assert.ok(!/confounded|evidence factor|stale evidence|hysteresis|counterfactual/i.test(reason + ' ' + modeExplain), 'Technical route jargon must not leak into Today');

  for (const label of ['Başla', 'Tamamla', 'Daha sonra', 'Atla']) {
    assert.ok(await card.getByText(label, { exact: true }).count(), 'Today task must expose action: ' + label);
  }
}

async function submitWizard(page, { workingDays = [0,1,2,3,4,5,6], expectView = 'today' } = {}) {
  const premiumWelcome = page.locator('[data-premium-surface="welcome"]');
  await premiumWelcome.waitFor({ state: 'visible' });
  const intelligenceRuntime = await page.evaluate(() => ({
    core: !!window.RotaIntelligenceV1,
    bridge: !!window.RotaIntelligenceBridgeV1,
    installed: !!window.RotaIntelligenceBridgeV1?.installed?.()
  }));
  assert.deepEqual(intelligenceRuntime,{core:true,bridge:true,installed:true},'Intelligence V1 runtime bridge must be active before onboarding');
  assert.equal(await page.locator('.premium-proof-item').count(), 3, 'Premium landing must render the three product-value signals');
  await page.locator('.premium-trust-strip').waitFor({ state: 'visible' });
  await page.locator('[data-action="choose-exam"][data-exam="kpss"]').click();
  await page.locator('[data-premium-surface="onboarding"]').waitFor({ state: 'visible' });

  await page.locator('#setup-wizard-form [name="name"]').fill('E2E Öğrenci');
  await page.locator('#setup-wizard-form button[type="submit"]').click();

  await page.locator('#setup-wizard-form [name="studyHabit"][value="yes"]').check();
  await page.locator('#setup-wizard-form button[type="submit"]').click();

  await page.locator('#setup-wizard-form [name="currentNet"]').fill('48');
  await page.locator('#setup-wizard-form button[type="submit"]').click();

  await page.locator('#setup-wizard-form [name="targetNet"]').fill('82');
  await page.locator('#setup-wizard-form button[type="submit"]').click();

  await page.locator('#setup-wizard-form [name="dailyMinutes"][value="240"]').check();
  await page.locator('#setup-wizard-form button[type="submit"]').click();

  const dayBoxes = page.locator('#setup-wizard-form [name="days"]');
  assert.equal(await dayBoxes.count(), 7, 'Working-day onboarding must expose all seven days');
  for (let i = 0; i < await dayBoxes.count(); i++) {
    const box = dayBoxes.nth(i);
    const day = Number(await box.getAttribute('value'));
    const shouldBeChecked = workingDays.includes(day);
    if ((await box.isChecked()) !== shouldBeChecked) {
      const label = box.locator('xpath=ancestor::label[1]');
      assert.ok(await label.count(), 'Each working-day checkbox must have a clickable label');
      await label.click();
    }
  }
  assert.equal(await page.locator('#setup-wizard-form [name="days"]:checked').count(), workingDays.length, 'Wizard must preserve the requested working-day selection');
  await page.locator('#setup-wizard-form button[type="submit"]').click();

  await page.locator('#setup-wizard-form [name="targetScore"]').fill('88');
  await page.locator('#setup-wizard-form [name="target"]').fill('E2E kişisel rota');
  await page.locator('#setup-wizard-form button[type="submit"]').click();

  const mathLevel = page.locator('#setup-wizard-form select[name="level:k-ma"]');
  if (await mathLevel.count()) await mathLevel.selectOption('0');
  const turkishLevel = page.locator('#setup-wizard-form select[name="level:k-tr"]');
  if (await turkishLevel.count()) await turkishLevel.selectOption('2');
  await page.locator('#setup-wizard-form button[type="submit"]').click();

  await page.locator('[data-action="summary-build"]').click();
  await page.locator('.route-building-card').waitFor({ state: 'visible' });
  await page.locator('.route-build-live').waitFor({ state: 'visible' });
  await page.clock.fastForward(5000);
  if (expectView === 'plan') {
    await page.getByRole('heading', { name: 'Programım' }).waitFor({ state: 'visible' });
    assert.ok((await page.locator('.route-plan-card').count()) > 0, 'Rest-day onboarding must reveal the generated weekly route instead of an empty Today screen');
  } else {
    await page.locator('.route-task').first().waitFor({ state: 'visible' });
    await page.locator('[data-premium-surface="today"]').waitFor({ state: 'visible' });
    assert.ok(await page.locator('.premium-signal-rail').isVisible(), 'Premium Today signal rail must stay visible');
    await page.locator('.route-today-kicker').waitFor({ state: 'visible' });
    await page.locator('.route-tools > summary').waitFor({ state: 'visible' });
    assert.equal((await page.locator('.route-tools > summary').innerText()).trim().includes('Planı ayarla'), true, 'Secondary route controls must stay behind the quiet plan menu');
    assert.equal(await page.locator('.premium-deep-dive').count(), 1, 'Advanced route diagnostics must stay behind a single progressive-disclosure control');
  }
}

async function showTaskInPlan(page, id, label) {
  await navigate(page, 'plan');
  const thisWeek = page.locator('[data-action="week-today"]').first();
  if (await thisWeek.count() && await thisWeek.isVisible()) await thisWeek.click();

  const taskButton = page.locator(`[data-action="complete-session"][data-id="${id}"]`);
  for (let hop = 0; hop < 4; hop++) {
    if (await taskButton.count() && await taskButton.isVisible()) return;
    const next = page.locator('[data-action="week-next"]').first();
    assert.ok(await next.count() && await next.isVisible(), label + ': Programım sonraki hafta kontrolü görünür olmalı');
    await next.click();
  }
  assert.ok(await taskButton.count() && await taskButton.isVisible(), label + ': görev Programım içinde erişilebilir olmalı');
}

async function completeTask(page, id, { questions = 20, correct = 15, wrong = 5, outcome = 'ok' } = {}) {
  const button = page.locator(`[data-action="complete-session"][data-id="${id}"]`);
  await button.waitFor({ state: 'visible' });
  await button.click();
  const form = page.locator('#log-form');
  await form.waitFor({ state: 'visible' });
  await form.locator('[name="questions"]').fill(String(questions));
  const correctInput = form.locator('[name="correct"]');
  if (await correctInput.count()) await correctInput.fill(String(correct));
  const wrongInput = form.locator('[name="wrong"]');
  if (await wrongInput.count()) await wrongInput.fill(String(wrong));
  const outcomeInput = form.locator(`[name="outcome"][value="${outcome}"]`);
  if (await outcomeInput.count()) await outcomeInput.locator('..').click();
  const complete = form.locator('[name="completeSession"]');
  if (await complete.count() && !(await complete.isChecked())) await complete.check();
  await form.locator('button[type="submit"]').click();
  await form.waitFor({ state: 'detached' });
  const toast = page.locator('#toasts .toast').last();
  await toast.waitFor({ state: 'visible' });
  return toast.innerText();
}

async function setDay(page, date) {
  await page.clock.setFixedTime(new Date(date + 'T09:00:00+03:00'));
  assert.equal(new URL(page.url()).searchParams.get('fresh'), '1', 'Day simulation must stay inside the fresh-preview storage namespace');
  await navigate(page, 'today');
  await page.getByRole('heading', { name: 'Bugünkü Rotan' }).waitFor({ state: 'visible' });
  await page.locator('.route-task').first().waitFor({ state: 'visible' });
}

async function settleTaskOnScheduledDay(page, findTask, label) {
  let lastTask = null;
  for (let hop = 0; hop < 6; hop++) {
    const snapshot = await appState(page);
    const space = snapshot.value.workspaces.kpss;
    const task = findTask(space);
    assert.ok(task, label + ' must remain in the plan while following its scheduled day');
    lastTask = task;
    const complete = page.locator('[data-action="complete-session"][data-id="' + task.id + '"]');
    if (await complete.count() && await complete.isVisible()) return task;
    await setDay(page, task.date);
  }
  const complete = page.locator('[data-action="complete-session"][data-id="' + lastTask.id + '"]');
  assert.ok(await complete.count() && await complete.isVisible(), label + ' must become visible on its scheduled day; last date=' + lastTask.date);
  return lastTask;
}

async function fillAdaptiveWizardStep(page, exam) {
  const form = page.locator('#setup-wizard-form');
  await form.waitFor({ state: 'visible' });

  const name = form.locator('[name="name"]');
  if (await name.count()) await name.fill(exam === 'yks' ? 'YKS E2E Öğrenci' : 'E2E Öğrenci');

  const track = form.locator('select[name="track"]');
  if (await track.count()) await track.selectOption('say');

  const habit = form.locator('[name="studyHabit"][value="yes"]');
  if (await habit.count()) await habit.check();

  const currentNet = form.locator('[name="currentNet"]');
  if (await currentNet.count()) await currentNet.fill(exam === 'yks' ? '58' : '48');

  const targetNet = form.locator('[name="targetNet"]');
  if (await targetNet.count()) await targetNet.fill(exam === 'yks' ? '92' : '82');

  const targetScore = form.locator('[name="targetScore"]');
  if (await targetScore.count()) await targetScore.fill('88');

  const targetRank = form.locator('[name="targetRank"]');
  if (await targetRank.count()) await targetRank.fill('30000');

  const target = form.locator('[name="target"]');
  if (await target.count()) await target.fill(exam === 'yks' ? 'Sayısal hedef rotası' : 'E2E kişisel rota');

  const minuteSelect = form.locator('select[name="dailyMinutes"]');
  if (await minuteSelect.count()) {
    await minuteSelect.selectOption('240');
  } else {
    const minuteRadio = form.locator('[name="dailyMinutes"][value="240"]');
    if (await minuteRadio.count()) await minuteRadio.check();
  }

  const days = form.locator('[name="days"]');
  for (let i = 0; i < await days.count(); i++) {
    const box = days.nth(i);
    if (!(await box.isChecked())) {
      const label = box.locator('xpath=ancestor::label[1]');
      if (await label.count()) await label.click();
      else await box.check({ force: true });
    }
  }

  const levelSelects = form.locator('select[name^="level:"]');
  for (let i = 0; i < await levelSelects.count(); i++) {
    const select = levelSelects.nth(i);
    const values = await select.locator('option').evaluateAll(opts => opts.map(o => o.value).filter(Boolean));
    if (values.length) await select.selectOption(i === 0 ? values[0] : values[Math.min(2, values.length - 1)]);
  }

  const numberInputs = form.locator('input[type="number"][name]');
  for (let i = 0; i < await numberInputs.count(); i++) {
    const input = numberInputs.nth(i);
    if (await input.inputValue()) continue;
    const field = (await input.getAttribute('name')) || '';
    const value = /rank/i.test(field) ? '30000'
      : /stage|field|ayt|ydt/i.test(field) ? (/target/i.test(field) ? '52' : '28')
      : /target/i.test(field) ? '80'
      : '40';
    await input.fill(value);
  }

  await form.locator('button[type="submit"]').click();
}

async function submitYksWizard(page) {
  await page.locator('[data-action="choose-exam"][data-exam="yks"]').click();

  for (let step = 0; step < 14; step++) {
    const build = page.locator('[data-action="summary-build"]');
    if (await build.count() && await build.isVisible()) break;
    await fillAdaptiveWizardStep(page, 'yks');
  }

  const build = page.locator('[data-action="summary-build"]');
  await build.waitFor({ state: 'visible' });
  await build.click();
  await page.clock.fastForward(5000);
  await page.locator('.route-task').first().waitFor({ state: 'visible' });
}

async function runRestDayInitialRouteVisibility(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul'
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e?.stack || e)));
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  await page.clock.install({ time: new Date('2026-09-20T09:00:00+03:00') }); // Sunday
  await page.goto(BASE + '/?fresh=1', { waitUntil: 'domcontentloaded' });
  await submitWizard(page, { workingDays: [1,2,3,4,5], expectView: 'plan' });

  const snapshot = await appState(page);
  const space = snapshot.value.workspaces.kpss;
  assert.ok(space.plan.length > 0, 'Rest-day onboarding must still generate a route');
  assert.ok(space.plan.some(p => p.date > '2026-09-20'), 'Rest-day route must schedule tasks on the next selected working day');
  assert.equal(await page.locator('[data-premium-surface="today"]').count(), 0, 'Initial route build on a rest day must not strand the student on empty Today');
  await assertCleanRender(page, 'rest-day initial route visibility');
  assert.deepEqual(pageErrors, [], 'Rest-day page errors:\n' + pageErrors.join('\n'));
  assert.deepEqual(consoleErrors.filter(x => !/favicon/i.test(x)), [], 'Rest-day console errors:\n' + consoleErrors.join('\n'));
  await context.close();
}

async function runMiniRepairProvenance(browser) {
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul'
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e?.stack || e)));
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  await page.clock.install({ time: new Date(FIXED_DAY + 'T09:00:00+03:00') });
  await page.goto(BASE + '/?fresh=1', { waitUntil: 'domcontentloaded' });
  await submitWizard(page);

  const runBlankMini = async date => {
    await page.clock.setFixedTime(new Date(date + 'T09:00:00+03:00'));
    await navigate(page, 'exams');
    const start = page.locator('[data-action="start-mini-exam"][data-id="kpss-problemler-01"]').first();
    await start.waitFor({ state: 'visible' });
    await start.click();
    const form = page.locator('#mini-exam-form');
    await form.waitFor({ state: 'visible' });
    await form.locator('button[type="submit"]').click();
    await page.locator('.mini-result-hero').waitFor({ state: 'visible' });
    const snapshot = await appState(page);
    const attempts = snapshot.value.workspaces.kpss.assessments
      .filter(a => a.miniId === 'kpss-problemler-01')
      .sort((a,b) => String(b.date).localeCompare(String(a.date)) || Number(b.created||0)-Number(a.created||0));
    assert.ok(attempts[0], 'Mini exam must persist a real assessment');
    const close = page.locator('[data-action="close-modal"]').first();
    if (await close.count() && await close.isVisible()) await close.click();
    return attempts[0];
  };

  const first = await runBlankMini(FIXED_DAY);
  assert.equal(first.correct, 0, 'Blank mini fixture must record zero correct answers');
  const secondDay = addDays(FIXED_DAY, 1);
  const second = await runBlankMini(secondDay);
  assert.notEqual(second.id, first.id, 'A later-day mini attempt must have a distinct assessment id');
  const thirdDay = addDays(secondDay, 1);
  const third = await runBlankMini(thirdDay);
  assert.notEqual(third.id, second.id, 'A newer weak mini must remain separate evidence');

  const snapshot = await appState(page);
  const space = snapshot.value.workspaces.kpss;
  assert.equal(space.exams.length, 0, 'Mini results must stay isolated from full-exam records');
  const repairs = space.plan.filter(p => !p.done && p.source === 'mini_repair' && p.topicId === third.topicId);
  assert.equal(repairs.length, 1, 'A topic must have only one open mini-repair task');
  const repair = repairs[0];
  assert.equal(repair.sourceAssessmentId, third.id, 'Open mini repair must follow the newest real weak assessment');
  assert.equal(repair.routeKey, 'mini-repair-topic:' + third.topicId, 'Mini repair identity must be topic-stable across newer evidence');
  assert.equal(repair.topicId, third.topicId, 'Mini repair must preserve the measured topic');
  assert.match(repair.reason || '', /Mini deneme/i, 'Mini repair must explain the mini evidence in student language');
  assert.ok(!space.plan.some(p => p.source === 'mini_repair' && p.sourceAssessmentId && !space.assessments.some(a => a.id === p.sourceAssessmentId)), 'Every mini repair provenance id must resolve to a real assessment');

  await assertCleanRender(page, 'mini repair provenance');
  assert.deepEqual(pageErrors, [], 'Mini provenance page errors:\n' + pageErrors.join('\n'));
  assert.deepEqual(consoleErrors.filter(x => !/favicon/i.test(x)), [], 'Mini provenance console errors:\n' + consoleErrors.join('\n'));
  await context.close();
}


async function runLargePlanRenderPerf(browser) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul'
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e?.stack || e)));
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  await page.clock.install({ time: new Date(FIXED_DAY + 'T09:00:00+03:00') });
  await page.goto(BASE + '/?fresh=1', { waitUntil: 'domcontentloaded' });
  await submitWizard(page);

  const seeded = await page.evaluate(fixedDay => {
    let selected = null;
    for (const [key, raw] of Object.entries(localStorage)) {
      try {
        const value = JSON.parse(raw);
        if (value?.workspaces?.kpss && value?.workspaces?.yks) { selected = { key, value }; break; }
      } catch {}
    }
    if (!selected) throw new Error('Perf fixture application state missing');
    const space = selected.value.workspaces.kpss;
    const base = space.plan.find(p => p.subjectId && p.topicId) || space.plan[0];
    if (!base) throw new Error('Perf fixture requires one real route task');
    const dayAdd = (date, days) => {
      const d = new Date(date + 'T12:00:00Z');
      d.setUTCDate(d.getUTCDate() + days);
      return d.toISOString().slice(0, 10);
    };
    const beforePlan = space.plan.length, beforeLogs = space.logs.length;
    for (let i = 0; i < 600; i++) {
      const date = dayAdd(fixedDay, -1 - (i % 180));
      const id = 'perf-history-' + i;
      space.plan.push({
        id,date,subjectId:base.subjectId,topicId:base.topicId,
        title:'Perf geçmiş görevi '+i,minutes:25,done:true,kind:'route',
        source:'curriculum',priority:30,reason:'Geçmiş çalışma kaydı.',
        taskState:'open',targetQuestions:10,taskGoal:'10 soru ile kısa tekrar'
      });
      space.logs.push({
        id:'perf-log-'+i,date,subjectId:base.subjectId,title:'Perf geçmiş kaydı '+i,
        minutes:25,questions:10,correct:8,wrong:2,note:'',sessionId:id,
        outcome:'ok',created:i+1,updated:i+1
      });
    }
    localStorage.setItem(selected.key, JSON.stringify(selected.value));
    return { beforePlan, beforeLogs, afterPlan:space.plan.length, afterLogs:space.logs.length };
  }, FIXED_DAY);
  assert.equal(seeded.afterPlan-seeded.beforePlan,600,'Perf fixture must add a large plan history');
  assert.equal(seeded.afterLogs-seeded.beforeLogs,600,'Perf fixture must add a large log history');

  await page.goto(BASE + '/?fresh=1&resume=1', { waitUntil: 'domcontentloaded' });
  await page.locator('#app').waitFor({ state: 'visible' });
  await navigate(page, 'today');
  await page.getByRole('heading', { name: 'Bugünkü Rotan' }).waitFor({ state: 'visible' });
  const todayPerf = await page.evaluate(() => ({ sample:window.__rotaRenderPerf?.recent?.at(-1), perf:window.__rotaRenderPerf ? { ...window.__rotaRenderPerf } : null }));
  assert.ok(todayPerf.sample && todayPerf.sample.view==='today','Large-history Today render must be measured');
  assert.ok(todayPerf.sample.planIndexBuilds<=1,'Large-history Today must build the plan date index at most once');
  assert.ok(todayPerf.sample.decisionComputes<=todayPerf.sample.taskNodes+50,'Large-history Today must not explode applied-decision recomputation');
  assert.ok(todayPerf.sample.reasonCalls<=todayPerf.sample.taskNodes+50,'Large-history Today must keep reason generation bounded to visible work');
  assert.ok(Number.isFinite(todayPerf.sample.ms)&&todayPerf.sample.ms<5000,'Large-history Today render must remain bounded');

  await navigate(page, 'plan');
  await page.getByRole('heading', { name: 'Programım' }).waitFor({ state: 'visible' });
  const planPerf = await page.evaluate(() => ({ sample:window.__rotaRenderPerf?.recent?.at(-1), perf:window.__rotaRenderPerf ? { ...window.__rotaRenderPerf } : null }));
  assert.ok(planPerf.sample && planPerf.sample.view==='plan','Large-history Programım render must be measured');
  assert.ok(planPerf.sample.planIndexBuilds<=1,'Large-history Programım must build the plan date index at most once');
  assert.ok(planPerf.sample.decisionComputes<=planPerf.sample.taskNodes+50,'Large-history Programım must not explode applied-decision recomputation');
  assert.ok(planPerf.sample.reasonCalls<=planPerf.sample.taskNodes+50,'Large-history Programım must keep reason generation bounded to visible work');
  assert.ok(Number.isFinite(planPerf.sample.ms)&&planPerf.sample.ms<5000,'Large-history Programım render must remain bounded');
  assert.ok(planPerf.perf.recent.length<=30,'Render performance history must stay bounded after large-history navigation');
  assert.ok(planPerf.perf.byView.today?.renders>=1&&planPerf.perf.byView.plan?.renders>=1,'Per-view diagnostics must retain Today and Programım measurements');
  console.log('browser-render-perf-large-history '+JSON.stringify({seeded,today:todayPerf.sample,plan:planPerf.sample}));

  const persisted = await appState(page);
  assert.ok(persisted.value.workspaces.kpss.plan.length>=seeded.afterPlan,'Large plan history must survive reload without silent truncation');
  assert.ok(persisted.value.workspaces.kpss.logs.length>=seeded.afterLogs,'Large log history must survive reload without silent truncation');
  await assertCleanRender(page, 'large plan/log performance fixture');
  assert.deepEqual(pageErrors, [], 'Large-history page errors:\n' + pageErrors.join('\n'));
  assert.deepEqual(consoleErrors.filter(x => !/favicon/i.test(x)), [], 'Large-history console errors:\n' + consoleErrors.join('\n'));
  await context.close();
}


async function runKpssSectionExamContent(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul'
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e?.stack || e)));
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  await page.clock.install({ time: new Date(FIXED_DAY + 'T09:00:00+03:00') });
  await page.goto(BASE + '/?fresh=1', { waitUntil: 'domcontentloaded' });
  await submitWizard(page);
  await navigate(page, 'exams');

  assert.ok(await page.getByText('KPSS Türkçe Bölüm Denemesi #01', { exact: true }).count(), 'KPSS Turkish section exam must be visible');
  assert.ok(await page.getByText('KPSS Tarih Bölüm Denemesi #01', { exact: true }).count(), 'KPSS history section exam must be visible');
  assert.ok(await page.getByText(/konu içi dağılım geçmiş sınav eğilimlerine göre yaklaşık/i).count(), 'Section-exam distribution must be described as approximate, not official-fixed');

  const start = page.locator('[data-action="start-section-exam"][data-id="kpss-turkce-section-01"]').first();
  await start.waitFor({ state: 'visible' });
  await start.click();
  const form = page.locator('#section-exam-form');
  await form.waitFor({ state: 'visible' });
  assert.equal(await form.locator('.mini-question').count(), 30, 'Turkish section exam must render exactly 30 questions');
  await form.locator('button[type="submit"]').click();
  await page.getByText('Bölüm denemesi sonucu', { exact: true }).waitFor({ state: 'visible' });
  assert.ok(await page.getByText('0 / 30 doğru', { exact: true }).count(), 'Blank section fixture must score zero correct');
  const sectionScopeNotice=page.locator('.notice').filter({hasText:'Bu sonuç tam KPSS GY–GK neti değildir'}).first();
  await sectionScopeNotice.waitFor({state:'visible'});
  assert.match(await sectionScopeNotice.innerText(),/tam KPSS GY–GK neti değildir[\s\S]*Türkçe bölüm denemesidir/i,'Section result must not present itself as the full KPSS');

  const snapshot = await appState(page);
  const attempts = snapshot.value.workspaces.kpss.assessments.filter(a => a.sectionId === 'kpss-turkce-section-01');
  assert.equal(attempts.length, 1, 'Section exam must persist one assessment');
  const result = attempts[0];
  assert.equal(result.total, 30);
  assert.equal(result.correct, 0);
  assert.equal(result.blank, 30);
  assert.equal(result.net, 0);
  assert.equal(result.topicBreakdown.length, 11, 'Turkish section result must preserve all 11 topic breakdown rows');
  assert.equal(result.topicBreakdown.reduce((n,x)=>n+x.total,0),30,'Topic breakdown totals must equal the section question count');
  assert.ok(result.skillBreakdown.some(x => x.skill === 'Paragrafta anlam' && x.total === 14), 'Paragraph weight must be preserved in stored evidence');
  await assertCleanRender(page, 'KPSS Turkish section exam result');
  assert.deepEqual(pageErrors, [], 'KPSS section exam page errors:\n' + pageErrors.join('\n'));
  assert.deepEqual(consoleErrors.filter(x => !/favicon/i.test(x)), [], 'KPSS section exam console errors:\n' + consoleErrors.join('\n'));
  await context.close();
}

const server = spawn(process.execPath, ['server.mjs'], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', OPENAI_API_KEY: '' },
  stdio: ['ignore', 'pipe', 'pipe']
});
let serverLog = '';
server.stdout.on('data', d => { serverLog += d; });
server.stderr.on('data', d => { serverLog += d; });

let browser;
try {
  await waitServer();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul'
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  let teacherRequest = null;
  let entitlementOverride = null;

  page.on('pageerror', e => pageErrors.push(String(e?.stack || e)));
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  await page.clock.install({ time: new Date(FIXED_DAY + 'T09:00:00+03:00') });

  await page.route('**/api/health', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, aiConfigured: true, ttsConfigured: false, model: 'e2e-model', profile: 'economy', demoFallback: true })
    });
  });
  await page.route('**/api/entitlements', async route => {
    if (!entitlementOverride) return route.continue();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(entitlementOverride)
    });
  });
  await page.route('**/api/teacher', async route => {
    teacherRequest = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        answer: {
          kind: 'study',
          direct_answer: 'E2E Rota Hoca cevabı',
          message: 'Bugünkü planın öğrenci modeline göre açıklandı.',
          diagnosis: 'Test yanıtı.',
          steps: [{ title: 'Rota', text: 'Canlı rota bağlamı kullanıldı.' }],
          summary: 'E2E başarılı.',
          confidence: 0.99,
          detected_subject: 'Matematik',
          detected_topic: '',
          difficulty: 'basic',
          needs_clarification: false,
          verification: { status: 'not_needed', methods: ['e2e'], note: 'Yerel tarayıcı testi.' },
          route_signal: { importance: 0, reason: 'E2E' },
          source_notes: []
        },
        model: 'e2e-model',
        responseId: 'e2e',
        usage: null
      })
    });
  });

  await page.goto(BASE + '/?fresh=1', { waitUntil: 'domcontentloaded' });
  await assertCleanRender(page, 'fresh welcome');
  assert.ok((await page.locator('#app').innerText()).trim().length > 20, 'Fresh app must not render a blank screen');
  assert.deepEqual(pageErrors, [], 'Fresh page JavaScript errors:\n' + pageErrors.join('\n'));

  await submitWizard(page);
  await assertCleanRender(page, 'post onboarding today');
  await assertTodayContract(page);
  assert.ok((await page.locator('.route-task').count()) > 0, 'Onboarding must produce visible tasks');
  const workspaceV3 = await appState(page);
  assert.equal(workspaceV3.value.workspaces.kpss.schemaVersion,3,'Fresh onboarding must use workspace schema v3');
  assert.match(workspaceV3.value.workspaces.kpss.sync?.workspaceId||'',/^ws-kpss-[A-Za-z0-9-]{8,}$/,'Workspace must expose a stable sync-ready identity');
  assert.ok((workspaceV3.value.workspaces.kpss.sync?.revision||0)>0,'Persisted onboarding must advance workspace revision');
  const freeFlags = await page.evaluate(() => ({
    core: window.RotaContracts.featureEnabled('free','core_route'),
    mini: window.RotaContracts.featureEnabled('free','mini_exams'),
    repair: window.RotaContracts.featureEnabled('free','exam_wrong_repair'),
    mistakes: window.RotaContracts.featureEnabled('free','mistake_notebook'),
    basic: window.RotaContracts.featureEnabled('free','basic_analysis'),
    teacher: window.RotaContracts.featureEnabled('free','teacher_basic'),
    report: window.RotaContracts.featureEnabled('free','monthly_report'),
    advancedTeacher: window.RotaContracts.featureEnabled('free','advanced_teacher_insights')
  }));
  assert.deepEqual(freeFlags,{core:true,mini:true,repair:true,mistakes:true,basic:true,teacher:true,report:false,advancedTeacher:false},'Free tier must keep the complete core learning loop while gating advanced reporting and teacher continuations');

  const runtimeEntitlement = await page.evaluate(async () => {
    const response=await fetch('/api/entitlements',{cache:'no-store'});
    return {status:response.status,body:await response.json()};
  });
  assert.equal(runtimeEntitlement.status,200,'Browser runtime must expose the entitlement endpoint');
  assert.equal(runtimeEntitlement.body.schema,'calisma-rotasi-entitlement-v1');
  assert.equal(runtimeEntitlement.body.tier,'free','Default local browser E2E must fail closed to Free');
  assert.equal(runtimeEntitlement.body.source,'local_dev');
  assert.equal(runtimeEntitlement.body.features.core_route,true);
  assert.equal(runtimeEntitlement.body.features.teacher_basic,true);
  assert.equal(runtimeEntitlement.body.features.monthly_report,false);
  assert.equal(runtimeEntitlement.body.features.advanced_teacher_insights,false);
  assert.equal(await page.locator('[data-action="paid-tier"]').count(),0,'Production UI must not expose a browser-controlled Free/Plus tier toggle');

  await navigate(page,'report');
  await page.getByRole('heading',{name:'Aylık raporum'}).waitFor({state:'visible'});
  assert.ok(await page.locator('.plus-gate').isVisible(),'Free runtime must render the Plus gate instead of the monthly report');
  assert.ok(await page.getByText('PLUS İLE AÇILIR',{exact:false}).count(),'Monthly report gate must explain that the surface requires Plus');
  await navigate(page,'today');
  const renderPerf = await page.evaluate(() => window.__rotaRenderPerf ? { ...window.__rotaRenderPerf } : null);
  assert.ok(renderPerf, 'Route render diagnostics must be exposed');
  assert.ok(Number.isFinite(renderPerf.lastRenderMs) && renderPerf.lastRenderMs >= 0, 'Route render duration must be measurable');
  assert.ok(Number.isInteger(renderPerf.decisionComputes) && renderPerf.decisionComputes >= 0, 'Applied-decision compute count must be measurable');
  assert.ok(Number.isInteger(renderPerf.reasonCalls) && renderPerf.reasonCalls >= 0, 'Task-reason call count must be measurable');
  assert.ok(Number.isInteger(renderPerf.planIndexBuilds) && renderPerf.planIndexBuilds >= 0 && renderPerf.planIndexBuilds <= 1, 'Plan date index must be built at most once per render');
  assert.ok(renderPerf.renderCount >= 1, 'Route render counter must increment');
  assert.ok(renderPerf.lastTaskNodes >= 1, 'Render diagnostics must observe visible task nodes');
  assert.ok(Number.isFinite(renderPerf.totalRenderMs) && renderPerf.totalRenderMs >= renderPerf.lastRenderMs, 'Render diagnostics must accumulate measured render time');
  assert.ok(Number.isFinite(renderPerf.maxRenderMs) && renderPerf.maxRenderMs >= renderPerf.lastRenderMs, 'Render diagnostics must track the slowest measured render');
  assert.ok(Array.isArray(renderPerf.recent) && renderPerf.recent.length >= 1 && renderPerf.recent.length <= 30, 'Render diagnostics must keep a bounded recent sample window');
  assert.equal(renderPerf.recent.at(-1).view, renderPerf.view, 'Latest render sample must identify the rendered view');
  assert.ok(renderPerf.byView && renderPerf.byView[renderPerf.view]?.renders >= 1, 'Render diagnostics must aggregate measurements by view');
  assert.ok(renderPerf.byView[renderPerf.view].maxTaskNodes >= renderPerf.lastTaskNodes, 'Per-view diagnostics must retain peak visible task nodes');

  const backupContract = await page.evaluate(() => {
    let current = null;
    for (const raw of Object.values(localStorage)) {
      try {
        const value = JSON.parse(raw);
        if (value?.workspaces?.kpss && value?.workspaces?.yks) { current = value; break; }
      } catch {}
    }
    if (!current) throw new Error('Current app state missing for backup contract test');
    const envelope = window.RotaContracts.makeBackupEnvelope(current, { appVersion: '4.1' });
    const restored = window.RotaCore.validateBackup(envelope);
    const tampered = JSON.parse(JSON.stringify(envelope));
    tampered.state.activeExam = tampered.state.activeExam === 'kpss' ? 'yks' : 'kpss';
    let tamperRejected = false;
    try { window.RotaCore.validateBackup(tampered); } catch { tamperRejected = true; }
    return {
      schema: envelope.schema,
      version: envelope.version,
      checksum: envelope.integrity?.checksum || '',
      restoredExam: restored.activeExam,
      kpssSchemaVersion: restored.workspaces.kpss.schemaVersion,
      kpssExam: restored.workspaces.kpss.exam,
      yksSchemaVersion: restored.workspaces.yks.schemaVersion,
      yksExam: restored.workspaces.yks.exam,
      tamperRejected
    };
  });
  assert.equal(backupContract.schema, 'calisma-rotasi-backup', 'Browser backup must use the versioned envelope');
  assert.equal(backupContract.version, 2, 'Browser backup envelope version must stay at v2');
  assert.match(backupContract.checksum, /^[a-f0-9]{8}$/i, 'Browser backup must include an integrity checksum');
  assert.equal(backupContract.restoredExam, 'kpss', 'Versioned browser backup must restore through RotaCore validation');
  assert.equal(backupContract.kpssSchemaVersion, 3, 'KPSS workspace must migrate to schema v3');
  assert.equal(backupContract.kpssExam, 'kpss', 'KPSS workspace identity must be explicit');
  assert.equal(backupContract.yksSchemaVersion, 3, 'YKS workspace must migrate to schema v3');
  assert.equal(backupContract.yksExam, 'yks', 'YKS workspace identity must be explicit');
  assert.equal(backupContract.tamperRejected, true, 'Tampered browser backup must be rejected');

  assert.ok(await page.locator('.route-coach-insight .route-reason-kicker').count(), 'Today must expose Rota Hoca decision');
  assert.ok(await page.getByText('Bu plan neden böyle?').count(), 'Today must explain route logic');

  await page.locator('.route-task [data-action="route-why"]').first().click();
  assert.ok(await page.getByText('Neden bugün bu görev?').count(), 'Why-this-task modal must open');
  await page.locator('[data-action="close-modal"]').click();

  let snapshot = await appState(page);
  const space0 = snapshot.value.workspaces.kpss;
  const todayTask = space0.plan.find(p => p.date === FIXED_DAY && !p.done);
  assert.ok(todayTask, 'Today must have a task to complete');

  const beforeMode = latestTaskMode(space0, todayTask);

  const startButton = page.locator('.route-task [data-action="focus-session"][data-id="' + todayTask.id + '"]').first();
  await startButton.waitFor({ state: 'visible' });
  await startButton.click();
  const focusCard = page.locator('.route-focus-card');
  await focusCard.waitFor({ state: 'visible' });
  assert.ok((await focusCard.innerText()).includes(todayTask.title), 'Başla must bind the real task title to the focus card');
  assert.ok(await focusCard.getByText('ODAK OTURUMU', { exact: true }).count(), 'Başla must expose the focus-session state');
  assert.ok(await focusCard.getByText('Bitir ve kaydet', { exact: false }).count(), 'Focused task must expose the finish-and-record action');
  assert.match(await focusCard.innerText(), /çalışma kaydına otomatik bağlanacak/i, 'Focus card must explain the task/log linkage');

  snapshot = await appState(page);
  const spaceAfterFocus = snapshot.value.workspaces.kpss;
  assert.equal(spaceAfterFocus.plan.find(p => p.id === todayTask.id)?.done, false, 'Başla alone must not complete the task');
  assert.ok(!spaceAfterFocus.logs.some(l => l.sessionId === todayTask.id), 'Başla alone must not fabricate a study log');

  const completionFeedback = await completeTask(page, todayTask.id);
  snapshot = await appState(page);
  const spaceAfterCompletion = snapshot.value.workspaces.kpss;
  assert.ok(spaceAfterCompletion.logs.some(l => l.sessionId === todayTask.id), 'Completion must create a study log');
  assert.equal(spaceAfterCompletion.plan.find(p => p.id === todayTask.id)?.done, true, 'Completion must mark task done');
  assert.match(completionFeedback, /Görev tamamlandı/i, 'Completion feedback must say the task was completed');
  assert.match(completionFeedback, /öğrenci modeline ekledi/i, 'Completion feedback must say Student Model was updated');
  assert.match(completionFeedback, /%75 doğruluk/i, 'Completion feedback must show the recorded accuracy');

  const afterMode = latestTaskMode(spaceAfterCompletion, todayTask);
  if (beforeMode && afterMode && beforeMode === afterMode) {
    assert.ok(!/Rota güncellendi:/i.test(completionFeedback), 'Completion must not claim a fake route-mode change');
  }
  if (beforeMode && afterMode && beforeMode !== afterMode) {
    assert.match(completionFeedback, /Rota güncellendi: .* → .*/i, 'A real route-mode change must be shown as old → new');
  }
  await assertCleanRender(page, 'after task completion');

  await navigate(page, 'exams');
  await page.locator('[data-premium-surface="exams"]').waitFor({ state: 'visible' });
  assert.ok(await page.getByText('Çöz. Ölç. Rota ne öğrendiğini göstersin.', { exact: true }).count(), 'Premium Exam Center surface must stay visible');
  await page.locator('[data-action="add-exam"]').first().click();
  const examForm = page.locator('#exam-form');
  await examForm.locator('[name="name"]').fill('E2E Tam Deneme');
  const rows = examForm.locator('#exam-parts tr[data-part]');
  for (let i = 0; i < await rows.count(); i++) {
    const row = rows.nth(i);
    const total = Number(await row.locator('[data-field="total"]').inputValue());
    const correct = i === 0 ? Math.max(1, Math.floor(total * 0.18)) : Math.max(1, Math.floor(total * 0.72));
    const wrong = i === 0 ? Math.max(1, Math.floor(total * 0.32)) : Math.max(0, Math.floor(total * 0.08));
    await row.locator('[data-field="correct"]').fill(String(correct));
    await row.locator('[data-field="wrong"]').fill(String(Math.min(wrong, total - correct)));
  }
  await examForm.locator('button[type="submit"]').click();
  await examForm.waitFor({ state: 'detached' });

  snapshot = await appState(page);
  const spaceAfterExam = snapshot.value.workspaces.kpss;
  assert.equal(spaceAfterExam.exams.length, 1, 'Full exam must be saved');
  assert.ok(spaceAfterExam.plan.some(p => p.source === 'exam'), 'Weak full-exam signal must change route plan');
  assert.match(spaceAfterExam.route.lastReason || '', /deneme/i, 'Route reason must record exam-driven rebalance');
  await assertCleanRender(page, 'after full exam');

  const noteButton = page.locator('[data-action="note-from-exam"]').first();
  await noteButton.waitFor({ state: 'visible' });
  await noteButton.click();
  const mistakeForm = page.locator('#mistake-form');
  await mistakeForm.waitFor({ state: 'visible' });
  const topicSelect = mistakeForm.locator('[name="topicId"]');
  const topicValue = await topicSelect.locator('option').evaluateAll(opts => opts.map(o => o.value).find(Boolean) || '');
  assert.ok(topicValue, 'Exam-linked wrong must allow a real topic selection');
  await topicSelect.selectOption(topicValue);
  await mistakeForm.locator('[name="title"]').fill('E2E deneme yanlışı');
  await mistakeForm.locator('[name="reviewDate"]').fill(FIXED_DAY);
  await mistakeForm.locator('button[type="submit"]').click();
  await mistakeForm.waitFor({ state: 'detached' });

  snapshot = await appState(page);
  let space = snapshot.value.workspaces.kpss;
  const mistake = space.mistakes.find(m => m.examId);
  assert.ok(mistake?.topicId, 'Wrong note must stay linked to the real exam and real topic');
  assert.ok(!space.mistakes.some(m => m.examId && !m.topicId && m.title === 'E2E deneme yanlışı'), 'No fake topic may be inferred');

  let repair = space.plan.find(p => !p.done && p.sourceMistakeId === mistake.id);
  assert.ok(repair, 'Exam-linked wrong must create a repair task');
  await showTaskInPlan(page, repair.id, 'exam-linked repair task');
  await completeTask(page, repair.id, { questions: 18, correct: 15, wrong: 3, outcome: 'ok' });

  await navigate(page, 'mistakes');
  const resolve = page.locator(`[data-action="resolve-mistake"][data-id="${mistake.id}"]`);
  if (await resolve.count()) await resolve.click();

  snapshot = await appState(page);
  space = snapshot.value.workspaces.kpss;
  const repairDone = space.plan.find(p => p.id === repair.id);
  assert.equal(repairDone?.done, true, 'Repair task must be completed before retention reviews');
  const repairLog = space.logs.find(l => l.sessionId === repair.id);
  assert.ok(repairLog?.date, 'Repair completion needs a real evidence date');

  const due3 = addDays(repairLog.date, 3);
  await setDay(page, due3);
  snapshot = await appState(page);
  space = snapshot.value.workspaces.kpss;
  let review3 = space.plan.find(p => !p.done && p.source === 'spaced_review' && p.reviewWave === 3 && p.reviewBaseTaskId === repair.id);
  assert.ok(review3, '3-day exam-wrong retention review must materialize when due');
  assert.equal(review3.reviewBaseDate, repairLog.date, '3-day review must anchor to the real repair completion date');
  assert.ok(review3.date >= due3, '3-day review must never be scheduled before its real +3 due date');
  assert.match(review3.reason || '', /Denemeden gelen yanlış onarımını/i);
  await showTaskInPlan(page, review3.id, '3-day exam-wrong retention review');
  await completeTask(page, review3.id, { questions: 12, correct: 10, wrong: 2, outcome: 'ok' });

  const due7 = addDays(repairLog.date, 7);
  await setDay(page, due7);
  snapshot = await appState(page);
  space = snapshot.value.workspaces.kpss;
  let review7 = space.plan.find(p => !p.done && p.source === 'spaced_review' && p.reviewWave === 7 && p.reviewBaseTaskId === repair.id);
  assert.ok(review7, '7-day exam-wrong retention review must materialize when due');
  assert.equal(review7.reviewBaseDate, repairLog.date, '7-day review must anchor to the real repair completion date');
  assert.ok(review7.date >= due7, '7-day review must never be scheduled before its real +7 due date');
  await showTaskInPlan(page, review7.id, '7-day exam-wrong retention review');
  await completeTask(page, review7.id, { questions: 12, correct: 10, wrong: 2, outcome: 'ok' });
  await assertCleanRender(page, 'after 3/7 retention loop');

  await navigate(page, 'teacher');
  await page.locator('[data-premium-surface="teacher"]').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.teacher-premium-flow span').count(), 4, 'Premium Rota Hoca surface must stay visible');
  await page.locator('#teacher-question').fill('Bugünkü görevlerimi neden bu şekilde seçtin?');
  await page.locator('#teacher-form button[type="submit"]').click();
  await page.locator('#teacher-avatar-quote').filter({ hasText: 'E2E Rota Hoca cevabı' }).waitFor({ state: 'visible' });
  assert.equal(await page.locator('[data-action="teacher-followup"]').count(),0,'Free Rota Hoca must not expose advanced continuation calls');
  const plusContinuation=page.getByText('Gelişmiş devamlar Plus',{exact:true});
  await plusContinuation.waitFor({state:'visible'});
  await plusContinuation.click();
  await page.getByText('Bir adım ötesi Rota Plus’ta.',{exact:true}).waitFor({state:'visible'});
  assert.ok(await page.getByText(/yalnız doğrulanmış üyelikle açılır/i).count(),'Plus teacher gate must explain verified membership access in user language');
  await page.locator('[data-action="close-modal"]').click();

  assert.ok(teacherRequest, 'Rota Hoca request must reach the backend boundary');
  assert.ok(teacherRequest.studentContext?.todayPlan, 'Rota Hoca must receive todayPlan');
  assert.ok(teacherRequest.studentContext?.studentModel, 'Rota Hoca must receive Student Model');
  assert.ok(teacherRequest.studentContext?.routeDecision, 'Rota Hoca must receive route decision');
  assert.ok(teacherRequest.studentContext?.mastery, 'Rota Hoca must receive mastery context');
  assert.equal(teacherRequest.studentContext?.contextVersion, 2, 'Rota Hoca context must carry the bounded v2 contract');
  assert.ok(teacherRequest.studentContext?.routeMode?.explanation, 'Rota Hoca must receive student-facing route-mode explanation');
  assert.ok(teacherRequest.studentContext?.todaySummary, 'Rota Hoca must receive todaySummary');
  assert.ok(teacherRequest.studentContext?.contextHealth?.hasStudentModel, 'Rota Hoca v2 context must expose context health');
  assert.ok((teacherRequest.studentContext?.todayPlan||[]).length <= 8, 'Rota Hoca todayPlan must stay bounded');
  const teacherContextText = JSON.stringify(teacherRequest.studentContext);
  assert.ok(!/confounded|evidence factor|stale evidence|hysteresis|counterfactual/i.test(teacherContextText), 'Technical route jargon must not leak into teacher context');
  await assertCleanRender(page, 'Rota Hoca');

  // Behavior hardening: Daha sonra must be reversible without duplicate evidence,
  // Atla must reschedule the task, and both signals must survive a real reload.
  snapshot = await appState(page);
  space = snapshot.value.workspaces.kpss;
  let behaviorTask = space.plan.find(p => !p.done);
  assert.ok(behaviorTask, 'Behavior hardening needs an open task');
  if (behaviorTask.date !== (await page.evaluate(() => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }))) {
    await setDay(page, behaviorTask.date);
  } else {
    await navigate(page, 'today');
  }

  const laterButton = page.locator('[data-action="route-later"][data-id="' + behaviorTask.id + '"]');
  await laterButton.waitFor({ state: 'visible' });
  await laterButton.click();

  snapshot = await appState(page);
  space = snapshot.value.workspaces.kpss;
  assert.equal(space.plan.find(p => p.id === behaviorTask.id)?.taskState, 'later', 'Daha sonra must mark the task as later');
  assert.equal(
    space.taskEvents.filter(e => e.taskId === behaviorTask.id && e.action === 'later').length,
    1,
    'Daha sonra must create one behavior event'
  );

  await laterButton.click();
  snapshot = await appState(page);
  space = snapshot.value.workspaces.kpss;
  assert.equal(space.plan.find(p => p.id === behaviorTask.id)?.taskState, 'open', 'Second Daha sonra click must restore normal order');
  assert.equal(
    space.taskEvents.filter(e => e.taskId === behaviorTask.id && e.action === 'later').length,
    1,
    'Restoring order must not duplicate the later event'
  );

  const skipButton = page.locator('[data-action="route-skip"][data-id="' + behaviorTask.id + '"]');
  await skipButton.waitFor({ state: 'visible' });
  await skipButton.click();

  snapshot = await appState(page);
  space = snapshot.value.workspaces.kpss;
  assert.equal(
    space.taskEvents.filter(e => e.taskId === behaviorTask.id && e.action === 'skip').length,
    1,
    'Atla must create exactly one skip event'
  );
  const movedBehaviorTask = space.plan.find(p => p.id === behaviorTask.id);
  assert.ok(movedBehaviorTask && !movedBehaviorTask.done, 'Atla must keep the task open');
  assert.ok(
    String(movedBehaviorTask.date || '') > behaviorTask.date || String(movedBehaviorTask.deferUntil || '') > behaviorTask.date,
    'Atla must defer or reschedule the task beyond its previous day'
  );

  const persistedBehavior = {
    storageKey: snapshot.key,
    workspaceId: space.sync?.workspaceId || '',
    revision: space.sync?.revision || 0,
    taskId: behaviorTask.id,
    date: movedBehaviorTask.date,
    deferUntil: movedBehaviorTask.deferUntil || '',
    eventCount: space.taskEvents.length,
    planCount: space.plan.length
  };

  await page.goto(BASE + '/?fresh=1&resume=1', { waitUntil: 'domcontentloaded' });
  assert.equal(new URL(page.url()).searchParams.get('fresh'), '1', 'Persistence reload must stay in the isolated fresh-preview namespace');
  assert.equal(new URL(page.url()).searchParams.get('resume'), '1', 'Persistence reload must explicitly disable fresh-preview reset');
  await page.locator('#app').waitFor({ state: 'visible' });
  await assertCleanRender(page, 'behavior reload persistence');
  assert.equal(await page.locator('#setup-wizard-form').count(), 0, 'Reloaded configured workspace must not fall back to onboarding');

  snapshot = await appState(page);
  assert.equal(snapshot.key, persistedBehavior.storageKey, 'Reload must read the exact same preview storage namespace');
  space = snapshot.value.workspaces.kpss;
  assert.equal(space.schemaVersion,3,'Reload must preserve workspace schema v3');
  assert.equal(space.sync?.workspaceId,persistedBehavior.workspaceId,'Reload must preserve the exact workspace identity');
  assert.ok((space.sync?.revision||0)>=persistedBehavior.revision,'Reload must never move workspace revision backwards');
  const afterReloadBehaviorTask = space.plan.find(p => p.id === persistedBehavior.taskId);
  assert.ok(afterReloadBehaviorTask, 'Reload must preserve the rescheduled task');
  assert.equal(afterReloadBehaviorTask.date, persistedBehavior.date, 'Reload must preserve the rescheduled date');
  assert.equal(afterReloadBehaviorTask.deferUntil || '', persistedBehavior.deferUntil, 'Reload must preserve deferUntil');
  assert.equal(space.taskEvents.length, persistedBehavior.eventCount, 'Reload must preserve behavior events without duplication');
  assert.equal(space.plan.length, persistedBehavior.planCount, 'Reload must not regenerate duplicate plan tasks');
  assert.equal(
    space.taskEvents.filter(e => e.taskId === persistedBehavior.taskId && e.action === 'skip').length,
    1,
    'Reload must preserve exactly one skip event'
  );

  assert.deepEqual(pageErrors, [], 'Browser page errors:\n' + pageErrors.join('\n'));
  assert.deepEqual(consoleErrors.filter(x => !/favicon/i.test(x)), [], 'Browser console errors:\n' + consoleErrors.join('\n'));

  // Plus report contract: the browser must only unlock premium reporting after a server-shaped entitlement response.
  entitlementOverride = {
    schema: 'calisma-rotasi-entitlement-v1',
    version: 1,
    tier: 'plus',
    source: 'local_dev',
    status: 'dev_plus',
    purchaseEnabled: false,
    accountRequired: true,
    features: {
      core_route: true,
      mini_exams: true,
      exam_wrong_repair: true,
      mistake_notebook: true,
      basic_analysis: true,
      backup_export: true,
      teacher_basic: true,
      monthly_report: true,
      long_term_trends: true,
      advanced_teacher_insights: true
    }
  };
  await page.goto(BASE + '/?fresh=1&resume=1', { waitUntil: 'domcontentloaded' });
  await page.locator('#app').waitFor({ state: 'visible' });
  await page.locator('.topbar-upgrade.is-plus').waitFor({ state: 'visible' });
  assert.equal(await page.locator('[data-action="paid-tier"]').count(), 0, 'Plus entitlement must not reintroduce a browser tier switch');
  assert.ok(await page.evaluate(() => !!window.RotaReportAnalytics), 'Plus report analytics module must be available in the real browser');

  await navigate(page, 'report');
  await page.getByRole('heading', { name: 'Aylık raporum' }).waitFor({ state: 'visible' });
  assert.equal(await page.locator('.plus-gate').count(), 0, 'Server-authorized Plus must remove the monthly report gate');
  await page.locator('.report-premium-hero').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.report-kpi').count(), 4, 'Premium monthly report must expose four evidence KPIs');
  assert.ok(await page.locator('.report-week-bars').isVisible(), 'Premium monthly report must expose within-month rhythm');
  assert.ok(await page.getByText(/öğrenme başarısı skoru üretmez/i).count(), 'Monthly report must preserve evidence-safe language');
  await assertCleanRender(page, 'Plus premium monthly report');
  const reportSubjectName=page.locator('.report-subject-row strong').first();
  if(await reportSubjectName.count()){
    await reportSubjectName.evaluate(node=>{node.textContent='Uluslararası İlişkiler ve Çağdaş Dünya Tarihi Çok Uzun Ders Adı';});
    await assertCleanRender(page,'Plus premium monthly report with long subject name');
  }

  // Sparse-evidence UI regression: previous month has real logs while the selected month is empty.
  // The report must blame the missing current-month evidence, never the previous month.
  const missingCurrentMonthInput = page.locator('#report-month');
  await missingCurrentMonthInput.fill('2026-10');
  await missingCurrentMonthInput.dispatchEvent('change');
  await page.getByRole('heading', { name: 'Aylık raporum' }).waitFor({ state: 'visible' });
  assert.ok(
    (await page.getByText('Seçili ayda veri yok', { exact: true }).count()) >= 3,
    'Empty selected month with previous-month study evidence must label the current month as missing'
  );
  assert.equal(
    await page.getByText('Önceki ayda veri yok', { exact: true }).count(),
    0,
    'Missing current-month evidence must never be mislabeled as missing previous-month evidence'
  );
  await page.locator('#report-month').fill('2026-09');
  await page.locator('#report-month').dispatchEvent('change');
  await page.getByRole('heading', { name: 'Aylık raporum' }).waitFor({ state: 'visible' });

  const trendTab = page.locator('[data-action="report-tab"][data-report-tab="trend"]');
  await trendTab.click();
  await page.getByRole('heading', { name: '6 aylık trendler' }).waitFor({ state: 'visible' });
  await page.locator('.report-trend-bars').waitFor({ state: 'visible' });
  await page.locator('.report-plan-trend').waitFor({ state: 'visible' });
  await page.locator('.report-coverage').waitFor({ state: 'visible' });
  assert.ok(await page.getByText(/Net yolculuğu · türler ayrı/i).count(), 'Long-term report must keep exam types separate');
  assert.ok(await page.getByText(/tek başına öğrenme veya başarı artışını kanıtlamaz/i).count(), 'Long-term report must not overclaim learning effects');
  await assertCleanRender(page, 'Plus six-month trend report');
  const plusVisibleCopy=(await page.locator('body').innerText()).toLocaleLowerCase('tr-TR');
  assert.ok(!/entitlement kaynağı|server entitlement|fail-closed|yetki servisi|sunucu tarafından|free yetkisi|plus yetkisi/.test(plusVisibleCopy),'Plus user-facing copy must not expose technical access jargon');

  // Empty-data Plus audit: select a period with no study records and verify honest zero-state rendering.
  await page.locator('[data-action="report-tab"][data-report-tab="month"]').click();
  const emptyMonthInput=page.locator('#report-month');
  await emptyMonthInput.fill('2025-01');
  await emptyMonthInput.dispatchEvent('change');
  await page.getByRole('heading',{name:'Aylık raporum'}).waitFor({state:'visible'});
  assert.ok(await page.getByText('Bu ay ders kaydı yok.',{exact:true}).count(),'Empty monthly Plus report must explain missing subject data');
  assert.ok(await page.getByText('Bu ay deneme kaydı yok.',{exact:true}).count(),'Empty monthly Plus report must explain missing exam data');
  assert.equal(await page.locator('.report-week-col.is-empty').count(),4,'Every empty monthly week must be rendered as explicitly empty');
  const weeklyZeroBars=await page.locator('.report-week-col.is-empty .report-week-track i').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('style')||''));
  assert.ok(weeklyZeroBars.every(style=>/height:\s*0%/.test(style)),'Empty monthly weeks must not draw a fake activity bar');
  await assertCleanRender(page,'Plus empty monthly report');

  await page.locator('[data-action="report-tab"][data-report-tab="trend"]').click();
  await page.getByRole('heading',{name:'6 aylık trendler'}).waitFor({state:'visible'});
  assert.equal(await page.locator('.report-trend-col.is-empty').count(),6,'Every empty long-term month must be rendered as explicitly empty');
  const trendZeroBars=await page.locator('.report-trend-col.is-empty .report-trend-track i').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('style')||''));
  assert.ok(trendZeroBars.every(style=>/height:\s*0%/.test(style)),'Empty long-term months must not draw a fake activity bar');
  assert.ok(await page.getByText('Bu 6 aylık dönemde ders kaydı yok.',{exact:true}).count(),'Empty long-term Plus report must use six-month wording');
  assert.ok(await page.getByText('Bu dönemde deneme yok.',{exact:true}).count(),'Empty long-term Plus report must explain missing exam evidence');
  await assertCleanRender(page,'Plus empty six-month report');

  // Desktop/YKS hardening: exercise the longer SAY onboarding path in a separate storage context.
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul'
  });
  const desktopPage = await desktopContext.newPage();
  const desktopErrors = [];
  const desktopConsoleErrors = [];
  desktopPage.on('pageerror', e => desktopErrors.push(String(e?.stack || e)));
  desktopPage.on('console', msg => { if (msg.type() === 'error') desktopConsoleErrors.push(msg.text()); });
  await desktopPage.clock.install({ time: new Date(FIXED_DAY + 'T09:00:00+03:00') });
  await desktopPage.goto(BASE + '/?fresh=1', { waitUntil: 'domcontentloaded' });
  await submitYksWizard(desktopPage);
  await assertCleanRender(desktopPage, 'YKS desktop onboarding');

  const desktopSnapshot = await appState(desktopPage);
  const yksSpace = desktopSnapshot.value.workspaces.yks;
  assert.equal(desktopSnapshot.value.activeExam, 'yks', 'YKS desktop onboarding must keep YKS active');
  assert.equal(yksSpace.configured, true, 'YKS workspace must be configured');
  assert.equal(yksSpace.settings.track, 'say', 'YKS desktop fixture must preserve SAY track');
  assert.equal(yksSpace.profile.completed, true, 'YKS profile must be completed');
  assert.equal(yksSpace.profile.currentNet, 58, 'YKS TYT current net must be stored');
  assert.equal(yksSpace.profile.targetNet, 92, 'YKS TYT target net must be stored');
  assert.ok(Number.isFinite(yksSpace.profile.currentStageNet), 'SAY onboarding must store current AYT net');
  assert.ok(Number(yksSpace.profile.targetStageNet) > Number(yksSpace.profile.currentStageNet), 'SAY onboarding must store a higher AYT target');
  assert.ok(yksSpace.plan.length > 0, 'YKS onboarding must generate a plan');
  assert.ok(new Set(yksSpace.plan.map(p => p.subjectId)).size >= 2, 'YKS plan must include more than one subject');
  assert.ok(await desktopPage.locator('.sidebar').isVisible(), 'Desktop must show the sidebar');
  if (await desktopPage.locator('.mobile-dock').count()) {
    assert.equal(await desktopPage.locator('.mobile-dock').isVisible(), false, 'Desktop must hide the mobile dock');
  }
  assert.deepEqual(desktopErrors, [], 'YKS desktop page errors:\n' + desktopErrors.join('\n'));
  assert.deepEqual(desktopConsoleErrors.filter(x => !/favicon/i.test(x)), [], 'YKS desktop console errors:\n' + desktopConsoleErrors.join('\n'));
  await desktopContext.close();

  await runKpssSectionExamContent(browser);
  await runRestDayInitialRouteVisibility(browser);
  await runMiniRepairProvenance(browser);
  await runLargePlanRenderPerf(browser);

  console.log('Browser E2E passed: Free entitlement gates + polished mobile Plus reports + honest empty states + KPSS topic/section content + learning loop + behavior persistence + YKS desktop onboarding + rest-day visibility + mini repair provenance + large plan/log render observability');
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
  await sleep(100);
  if (server.exitCode === null) server.kill('SIGKILL');
  if (process.exitCode) console.error(serverLog);
}
