import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE = (process.env.PRODUCTION_URL || 'https://calisma-rotasi-1.onrender.com').replace(/\/$/,'');
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


async function finishKpssOnboarding(page) {
  const form = page.locator('#setup-wizard-form');
  await form.waitFor({ state: 'visible', timeout: 20_000 });

  // Stage 1 · premium welcome + identity
  await form.locator('[name="name"]').fill('Production Smoke');
  await form.locator('button[type="submit"]').click();

  // Stage 2 · goals and available time
  await form.locator('[name="targetScore"][value="85"]').evaluate(el => {
    el.checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await form.locator('[name="targetNet"]').fill('82');
  await form.locator('[name="dailyMinutes"][value="240"]').evaluate(el => {
    el.checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });

  const days = form.locator('[name="days"]');
  for (let i = 0; i < await days.count(); i++) {
    const box = days.nth(i);
    if (!(await box.isChecked())) {
      await box.evaluate(el => {
        el.checked = true;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  }
  await form.locator('button[type="submit"]').click();

  // Stage 3 · situation analysis
  await form.locator('[name="currentNetApprox"][value="50"]').evaluate(el => {
    el.checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await form.locator('[name="studyHabit"][value="yes"]').evaluate(el => {
    el.checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });

  const weakMath = form.locator('[name="weakSubjects"][value="k-ma"]');
  if (await weakMath.count()) {
    await weakMath.evaluate(el => {
      el.checked = true;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  const strongTurkish = form.locator('[name="strongSubjects"][value="k-tr"]');
  if (await strongTurkish.count()) {
    await strongTurkish.evaluate(el => {
      el.checked = true;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  await form.locator('button[type="submit"]').click();

  // Stage 4 · summary -> route build
  const build = page.locator('[data-action="summary-build"]');
  await build.waitFor({ state: 'visible', timeout: 20_000 });
  await build.click();
  await page.locator('.route-building-card').waitFor({ state: 'visible', timeout: 20_000 });
  await page.locator('.route-task').first().waitFor({ state: 'visible', timeout: 30_000 });
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
  assert.ok(await page.locator('[data-premium-surface="onboarding"]').isVisible(), 'Production must open the premium KPSS onboarding surface');
  assert.ok(await wizard.locator('button[type="submit"]').count(), 'Production onboarding must render the premium welcome stage');
  assert.equal(await wizard.locator('select[name="track"]').count(), 0, 'Production KPSS onboarding must not render a YKS track selector');
  await assertCleanRender(page, 'production onboarding');

  await finishKpssOnboarding(page);
  await page.locator('.app-shell').waitFor({ state: 'visible', timeout: 20_000 });
  await page.locator('.pnx3-dashboard').waitFor({ state: 'visible', timeout: 20_000 });
  await page.locator('.pnx3-lower').waitFor({ state: 'visible', timeout: 20_000 });
  assert.ok(await page.locator('.pnx3-plan .route-task').count(), 'Production KPSS dashboard must render the real Today route');
  assert.ok(await page.locator('.pnx3-focus .pnx-pomodoro').isVisible(), 'Production KPSS dashboard must render the real focus timer');
  assert.equal((await page.locator('.pnx3-greeting').innerText()).trim(), 'Günaydın Production Smoke,', 'Production hero must use the onboarding identity');
  assert.equal((await page.locator('.pnx-profile-copy strong').innerText()).trim(), 'Production Smoke', 'Production topbar must use the onboarding identity');
  assert.equal(await page.locator('.pnx3-teacher-card').count(), 0, 'Production KPSS dashboard must keep the retired Rota Hoca card removed');
  assert.ok(await page.locator('.pnx3-insight-archive').count(), 'Production KPSS dashboard must preserve explainability');
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
    'Production smoke passed: deploy identity + KPSS-only onboarding + approved KPSS Today dashboard · ' +
    (actualSha || 'commit-unavailable')
  );
} finally {
  await browser.close();
}
