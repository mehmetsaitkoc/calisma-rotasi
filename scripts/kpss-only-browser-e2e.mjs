import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = Number(process.env.KPSS_ONLY_E2E_PORT || 8817);
const BASE = `http://127.0.0.1:${PORT}`;
const FIXED_DAY = '2026-09-24';
const server = spawn(process.execPath, ['server.mjs'], {
  env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', RENDER: 'false' },
  stdio: ['ignore', 'pipe', 'pipe']
});
let serverLog = '';
server.stdout.on('data', d => { serverLog += d; });
server.stderr.on('data', d => { serverLog += d; });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitServer() {
  for (let i = 0; i < 100; i++) {
    try {
      const response = await fetch(BASE + '/api/health');
      if (response.ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error('KPSS-only E2E server did not start.\n' + serverLog);
}

async function appState(page) {
  return page.evaluate(() => {
    const preferred = new URLSearchParams(location.search).get('fresh') === '1'
      ? 'calisma-rotasi:all:v5:fresh-preview'
      : 'calisma-rotasi:all:v5';
    const keys = [preferred, ...Object.keys(localStorage).filter(key => key !== preferred)];
    for (const key of keys) {
      try {
        const value = JSON.parse(localStorage.getItem(key) || '');
        if (value?.workspaces?.kpss && value?.workspaces?.yks) return { key, value };
      } catch {}
    }
    throw new Error('Application state not found');
  });
}

async function fillKpssStep(page) {
  const form = page.locator('#setup-wizard-form');
  await form.waitFor({ state: 'visible' });

  const score85 = form.locator('[name="targetScore"][value="85"]');
  if (await score85.count()) await score85.evaluate(el => { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); });

  const targetNet = form.locator('[name="targetNet"]');
  if (await targetNet.count()) await targetNet.fill('82');

  const minuteRadio = form.locator('[name="dailyMinutes"][value="240"]');
  if (await minuteRadio.count()) await minuteRadio.evaluate(el => { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); });

  const days = form.locator('[name="days"]');
  for (let i = 0; i < await days.count(); i++) {
    const box = days.nth(i);
    if (!(await box.isChecked())) await box.evaluate(el => { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); });
  }

  const currentNet = form.locator('[name="currentNetApprox"][value="50"]');
  if (await currentNet.count()) await currentNet.evaluate(el => { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); });

  const habit = form.locator('[name="studyHabit"][value="yes"]');
  if (await habit.count()) await habit.evaluate(el => { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); });

  const weakMath = form.locator('[name="weakSubjects"][value="k-ma"]');
  if (await weakMath.count()) await weakMath.evaluate(el => { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); });

  const strongTurkish = form.locator('[name="strongSubjects"][value="k-tr"]');
  if (await strongTurkish.count()) await strongTurkish.evaluate(el => { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); });

  await form.locator('button[type="submit"]').click();
}

async function finishKpssOnboarding(page) {
  for (let step = 0; step < 12; step++) {
    const build = page.locator('[data-action="summary-build"]');
    if (await build.count() && await build.isVisible()) {
      await build.click();
      await page.clock.fastForward(5000);
      await page.locator('.route-task').first().waitFor({ state: 'visible' });
      return;
    }
    await fillKpssStep(page);
  }
  throw new Error('KPSS onboarding did not reach summary');
}

let browser;
try {
  await waitServer();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul'
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error?.stack || error)));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.clock.install({ time: new Date(FIXED_DAY + 'T09:00:00+03:00') });

  await page.goto(BASE + '/?fresh=1', { waitUntil: 'domcontentloaded' });
  await page.locator('.welcome.premium-landing-final').waitFor({ state: 'visible' });
  assert.equal(await page.locator('[data-exam="yks"]').count(), 0, 'YKS must not be selectable on the public surface');
  assert.equal(await page.locator('[data-exam="kpss"]').count(), 1, 'Exactly one KPSS product entry must remain');
  assert.equal(await page.getByText(/\bYKS\b/).count(), 0, 'Landing must not display YKS');
  assert.equal(await page.getByText(/\bTYT\b|\bAYT\b|\bYDT\b/).count(), 0, 'Landing must not display YKS-family exam labels');

  await page.locator('.v6-main-cta').click();
  await page.locator('[data-premium-surface="onboarding"]').waitFor({ state: 'visible' });
  let snapshot = await appState(page);
  assert.equal(snapshot.value.activeExam, 'kpss', 'Primary CTA must bypass exam choice and activate KPSS');
  assert.equal(await page.locator('select[name="track"]').count(), 0, 'KPSS onboarding must not ask for a YKS track');

  await finishKpssOnboarding(page);
  snapshot = await appState(page);
  assert.equal(snapshot.value.activeExam, 'kpss');
  assert.equal(snapshot.value.workspaces.kpss.configured, true, 'KPSS workspace must configure successfully');
  assert.equal(snapshot.value.workspaces.kpss.profile.completed, true, 'KPSS profile must complete successfully');
  assert.ok(snapshot.value.workspaces.kpss.plan.length > 0, 'KPSS route must still be generated');

  // KPSS-only regression: a configured KPSS workspace must survive a fresh resume
  // without depending on removed YKS product state or migration-only navigation races.
  const configuredBeforeResume = await appState(page);
  assert.equal(configuredBeforeResume.value.activeExam, 'kpss');
  assert.equal(configuredBeforeResume.value.workspaces.kpss.configured, true);
  await page.goto(BASE + '/?fresh=1&resume=1', { waitUntil: 'domcontentloaded' });
  await page.locator('.app-shell').waitFor({ state: 'visible', timeout: 20_000 });
  snapshot = await appState(page);
  assert.equal(snapshot.value.activeExam, 'kpss', 'Configured KPSS resume must keep KPSS active');
  assert.equal(snapshot.value.workspaces.kpss.configured, true, 'Configured KPSS workspace must survive resume');
  assert.equal(await page.locator('[data-exam="yks"]').count(), 0, 'Resumed workspace must not reveal a YKS selector');

  const academyNav = page.locator('[data-action="nav"][data-view="academy"]').first();
  assert.equal(await academyNav.count(), 1, 'Configured KPSS shell must expose the academy navigation');
  await academyNav.evaluate(node => node.click());
  await page.locator('.academy-grid').waitFor({ state: 'visible' });
  await page.waitForFunction(() => !document.querySelector('[data-scope="TYT"],[data-scope="AYT"],[data-scope="YDT"]'));
  assert.equal(await page.locator('[data-scope="TYT"],[data-scope="AYT"],[data-scope="YDT"]').count(), 0, 'Academy must hide YKS session filters');
  const stages = await page.locator('.academy-course .course-stage').allTextContents();
  assert.ok(stages.length > 0 && stages.every(stage => stage.trim().startsWith('KPSS')), 'Academy must expose KPSS courses only');
  assert.equal(stages.length, 6, 'Internal library must expose all six KPSS subjects');
  assert.deepEqual(await page.locator('[data-internal-question-library] .academy-mini-stats strong').allTextContents(), ['64', '256', '3072'], 'Internal topic/test/question counts must survive the KPSS boundary');
  assert.equal(await page.locator('[data-series-card],#turkish-series-select').count(), 0, 'Internal library must not expose an external teacher chooser');

  assert.equal(
    await page.locator('[data-action="paid-pricing"],[data-action="paid-offer"],[data-action="paid-upgrade"],[data-view="membership"]').count(),
    0,
    'Public Web Beta must not expose unfinished pricing or membership navigation'
  );

  const visibleCopy = (await page.locator('body').innerText()).toLocaleUpperCase('tr-TR');
  assert.ok(!/\bYKS\b|\bTYT\b|\bAYT\b|\bYDT\b/.test(visibleCopy), 'Visible product UI must remain KPSS-only');
  assert.deepEqual(pageErrors, [], 'KPSS-only page errors:\n' + pageErrors.join('\n'));
  assert.deepEqual(consoleErrors.filter(line => !/favicon/i.test(line)), [], 'KPSS-only console errors:\n' + consoleErrors.join('\n'));

  await context.close();
  console.log('KPSS-only browser E2E passed');
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
  await sleep(100);
  if (server.exitCode === null) server.kill('SIGKILL');
  if (process.exitCode) console.error(serverLog);
}
