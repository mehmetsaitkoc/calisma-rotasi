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
  assert.ok(subject, 'Today task must show a lesson/subject');
  assert.ok(topic, 'Today task must show a topic/title');
  assert.match(meta, /\d+\s*dk/, 'Today task must show minutes');
  const allMeta = await page.locator('.route-task-meta').allInnerTexts();
  assert.ok(allMeta.some(x => /≈\s*\d+\s*soru/i.test(x)), 'Today must show a question target on a planned practice task');
  assert.match(meta, /Neden bugün\?/i, 'Today task must expose why it is scheduled today');
  assert.ok(reason, 'Today task must render its route reason');

  for (const label of ['Başla', 'Tamamla', 'Daha sonra', 'Atla']) {
    assert.ok(await card.getByText(label, { exact: true }).count(), 'Today task must expose action: ' + label);
  }
}

async function submitWizard(page) {
  await page.locator('[data-action="choose-exam"][data-exam="kpss"]').click();

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
  for (let i = 0; i < await dayBoxes.count(); i++) await dayBoxes.nth(i).check();
  assert.equal(await page.locator('#setup-wizard-form [name="days"]:checked').count(), 7, 'Retention fixture uses all seven working days so +3/+7 timing is not distorted by skipped days');
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
  await page.clock.fastForward(5000);
  await page.locator('.route-task').first().waitFor({ state: 'visible' });
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
  if (repair.date !== FIXED_DAY) await setDay(page, repair.date);
  else {
    await navigate(page, 'today');
  }

  snapshot = await appState(page);
  space = snapshot.value.workspaces.kpss;
  repair = space.plan.find(p => !p.done && p.sourceMistakeId === mistake.id) || repair;
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
  review3 = await settleTaskOnScheduledDay(page, s => s.plan.find(p => !p.done && p.source === 'spaced_review' && p.reviewWave === 3 && p.reviewBaseTaskId === repair.id), '3-day exam-wrong retention review');
  await completeTask(page, review3.id, { questions: 12, correct: 10, wrong: 2, outcome: 'ok' });

  const due7 = addDays(repairLog.date, 7);
  await setDay(page, due7);
  snapshot = await appState(page);
  space = snapshot.value.workspaces.kpss;
  let review7 = space.plan.find(p => !p.done && p.source === 'spaced_review' && p.reviewWave === 7 && p.reviewBaseTaskId === repair.id);
  assert.ok(review7, '7-day exam-wrong retention review must materialize when due');
  assert.equal(review7.reviewBaseDate, repairLog.date, '7-day review must anchor to the real repair completion date');
  assert.ok(review7.date >= due7, '7-day review must never be scheduled before its real +7 due date');
  review7 = await settleTaskOnScheduledDay(page, s => s.plan.find(p => !p.done && p.source === 'spaced_review' && p.reviewWave === 7 && p.reviewBaseTaskId === repair.id), '7-day exam-wrong retention review');
  await completeTask(page, review7.id, { questions: 12, correct: 10, wrong: 2, outcome: 'ok' });
  await assertCleanRender(page, 'after 3/7 retention loop');

  await navigate(page, 'teacher');
  await page.locator('#teacher-question').fill('Bugünkü görevlerimi neden bu şekilde seçtin?');
  await page.locator('#teacher-form button[type="submit"]').click();
  await page.getByText('E2E Rota Hoca cevabı').waitFor({ state: 'visible' });

  assert.ok(teacherRequest, 'Rota Hoca request must reach the backend boundary');
  assert.ok(teacherRequest.studentContext?.todayPlan, 'Rota Hoca must receive todayPlan');
  assert.ok(teacherRequest.studentContext?.studentModel, 'Rota Hoca must receive Student Model');
  assert.ok(teacherRequest.studentContext?.routeDecision, 'Rota Hoca must receive route decision');
  assert.ok(teacherRequest.studentContext?.mastery, 'Rota Hoca must receive mastery context');
  await assertCleanRender(page, 'Rota Hoca');

  assert.deepEqual(pageErrors, [], 'Browser page errors:\n' + pageErrors.join('\n'));
  assert.deepEqual(consoleErrors.filter(x => !/favicon/i.test(x)), [], 'Browser console errors:\n' + consoleErrors.join('\n'));

  console.log('Browser E2E passed: onboarding → today → completion → exam → wrong repair → 3/7 → Rota Hoca');
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
  await sleep(100);
  if (server.exitCode === null) server.kill('SIGKILL');
  if (process.exitCode) console.error(serverLog);
}
