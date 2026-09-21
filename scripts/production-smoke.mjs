import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE = (process.env.PRODUCTION_URL || 'https://calisma-rotasi.onrender.com').replace(/\/$/,'');
const EXPECTED_SHA = (process.env.EXPECTED_SHA || process.env.GITHUB_SHA || '').trim();
const DEPLOY_WAIT_MS = Number(process.env.PRODUCTION_DEPLOY_WAIT_MS || 8 * 60 * 1000);
const POLL_MS = Number(process.env.PRODUCTION_POLL_MS || 10_000);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchHealth() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(BASE + '/api/health', {
      headers: { 'cache-control': 'no-cache' },
      signal: controller.signal
    });
    const text = await response.text();
    let body = null;
    try { body = JSON.parse(text); } catch {}
    return { ok: response.ok, status: response.status, body, text };
  } finally {
    clearTimeout(timeout);
  }
}

function deployedSha(health) {
  return String(
    health?.body?.deploy?.gitCommit ||
    health?.body?.gitCommit ||
    ''
  ).trim();
}

async function waitForExpectedDeploy() {
  const started = Date.now();
  let last = null;
  while (Date.now() - started < DEPLOY_WAIT_MS) {
    try {
      last = await fetchHealth();
      const sha = deployedSha(last);
      if (last.ok && last.body?.ok === true) {
        if (!EXPECTED_SHA) return last;
        if (sha === EXPECTED_SHA) return last;
      }
    } catch (error) {
      last = { error: String(error?.message || error) };
    }
    await sleep(POLL_MS);
  }

  const actual = deployedSha(last);
  throw new Error(
    'Production deploy did not reach the expected commit. ' +
    'expected=' + (EXPECTED_SHA || '(not set)') +
    ' actual=' + (actual || '(missing)') +
    ' last=' + JSON.stringify(last)
  );
}

async function assertCleanRender(page, label) {
  const text = await page.locator('body').innerText();
  const badLiterals = ['$' + '{content}', '$' + '{icon(', '$' + '{ui.', '[object Object]'];
  for (const literal of badLiterals) {
    assert.ok(!text.includes(literal), label + ': rendered literal leaked: ' + literal);
  }
  assert.ok(!/\$\{[^}]+\}/.test(text), label + ': template interpolation leaked');
  assert.ok(!/\bundefined\b/i.test(text), label + ': undefined leaked');
  assert.ok(!/\bnull\b/i.test(text), label + ': null leaked');
  assert.ok(!/\bNaN\b/.test(text), label + ': NaN leaked');

  const viewport = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth
  }));
  assert.ok(
    viewport.scroll <= viewport.inner + 2,
    label + ': horizontal mobile overflow (' + viewport.scroll + ' > ' + viewport.inner + ')'
  );
}


async function fillKpssStep(page) {
  const form = page.locator('#setup-wizard-form');
  await form.waitFor({ state: 'visible', timeout: 20_000 });

  const name = form.locator('[name="name"]');
  if (await name.count()) await name.fill('Production Smoke Öğrenci');

  const habit = form.locator('[name="studyHabit"][value="yes"]');
  if (await habit.count()) await habit.check();

  const currentNet = form.locator('[name="currentNet"]');
  if (await currentNet.count()) await currentNet.fill('48');

  const targetNet = form.locator('[name="targetNet"]');
  if (await targetNet.count()) await targetNet.fill('82');

  const targetScore = form.locator('[name="targetScore"]');
  if (await targetScore.count()) await targetScore.fill('88');

  const target = form.locator('[name="target"]');
  if (await target.count()) await target.fill('KPSS Lisans hedef rotası');

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
    if (!(await box.isChecked())) await box.check({ force: true });
  }

  const levels = form.locator('select[name^="level:"]');
  for (let i = 0; i < await levels.count(); i++) {
    const select = levels.nth(i);
    const values = await select.locator('option').evaluateAll(options => options.map(o => o.value).filter(Boolean));
    if (values.length) await select.selectOption(values[Math.min(i === 0 ? 0 : 2, values.length - 1)]);
  }

  const numbers = form.locator('input[type="number"][name]');
  for (let i = 0; i < await numbers.count(); i++) {
    const input = numbers.nth(i);
    if (await input.inputValue()) continue;
    const field = (await input.getAttribute('name')) || '';
    await input.fill(/target/i.test(field) ? '80' : '40');
  }

  await form.locator('button[type="submit"]').click();
}

async function finishKpssOnboarding(page) {
  for (let step = 0; step < 12; step++) {
    const build = page.locator('[data-action="summary-build"]');
    if (await build.count() && await build.isVisible()) {
      await build.click();
      await page.locator('.route-task').first().waitFor({ state: 'visible', timeout: 20_000 });
      return;
    }
    await fillKpssStep(page);
  }
  throw new Error('Production KPSS onboarding did not reach route summary');
}

const health = await waitForExpectedDeploy();
const actualSha = deployedSha(health);
assert.equal(health.body?.ok, true, 'Production health must report ok=true');
if (EXPECTED_SHA) assert.equal(actualSha, EXPECTED_SHA, 'Production must run the expected Git commit');

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul'
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', error => pageErrors.push(String(error?.stack || error)));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto(BASE + '/?fresh=1', {
    waitUntil: 'domcontentloaded',
    timeout: 45_000
  });

  const app = page.locator('#app');
  await app.waitFor({ state: 'visible', timeout: 30_000 });
  assert.ok((await app.innerText()).trim().length > 20, 'Production app must not render a blank shell');
  await assertCleanRender(page, 'production welcome');

  assert.equal(await page.locator('[data-exam="yks"]').count(), 0, 'Production must not expose a YKS product control');
  assert.equal(await page.locator('[data-exam="kpss"]').count(), 1, 'Production must expose one KPSS entry point');
  const welcomeCopy = (await page.locator('body').innerText()).toLocaleUpperCase('tr-TR');
  assert.ok(!/\bYKS\b|\bTYT\b|\bAYT\b|\bYDT\b/.test(welcomeCopy), 'Production welcome must be KPSS-only');

  const primaryCta = page.locator('.v6-main-cta');
  await primaryCta.waitFor({ state: 'visible', timeout: 20_000 });
  await primaryCta.click();

  const wizard = page.locator('#setup-wizard-form');
  await wizard.waitFor({ state: 'visible', timeout: 20_000 });
  assert.ok(await wizard.locator('[name="name"]').count(), 'Production onboarding must render the student name step');
  assert.equal(await wizard.locator('select[name="track"]').count(), 0, 'Production KPSS onboarding must not render a YKS track selector');
  await assertCleanRender(page, 'production onboarding');

  await finishKpssOnboarding(page);
  await page.locator('.app-shell').waitFor({ state: 'visible', timeout: 20_000 });
  await page.locator('.pnx-stage').waitFor({ state: 'visible', timeout: 20_000 });
  await page.locator('.pnx-intel-strip').waitFor({ state: 'visible', timeout: 20_000 });
  assert.ok(await page.locator('.pnx-route-panel .route-task').count(), 'Production premium dashboard must render the real Today route');
  assert.ok(await page.locator('.pnx-reason-card').count(), 'Production premium dashboard must render the real “Neden bugün?” card');
  assert.ok(await page.locator('.pnx-mode-card').count(), 'Production premium dashboard must render the route mode card');
  assert.ok(await page.locator('.pnx-teacher-card').count(), 'Production premium dashboard must render the Rota Hoca card');
  assert.ok(await page.locator('.mobile-dock').isVisible(), 'Production 360px dashboard must expose the mobile navigation dock');
  const dashboardCopy = (await page.locator('body').innerText()).toLocaleUpperCase('tr-TR');
  assert.ok(!/\bYKS\b|\bTYT\b|\bAYT\b|\bYDT\b/.test(dashboardCopy), 'Production dashboard must remain KPSS-only');
  await assertCleanRender(page, 'production premium dashboard');

  assert.deepEqual(pageErrors, [], 'Production page JavaScript errors:\n' + pageErrors.join('\n'));
  assert.deepEqual(
    consoleErrors.filter(x => !/favicon/i.test(x)),
    [],
    'Production console errors:\n' + consoleErrors.join('\n')
  );

  console.log(
    'Production smoke passed: deploy identity + KPSS-only onboarding + premium Today dashboard · ' +
    (actualSha || 'commit-unavailable')
  );
} finally {
  await browser.close();
}
