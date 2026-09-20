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

  const examChoice = page.locator('[data-action="choose-exam"][data-exam="kpss"]');
  await examChoice.waitFor({ state: 'visible', timeout: 20_000 });
  await examChoice.click();

  const wizard = page.locator('#setup-wizard-form');
  await wizard.waitFor({ state: 'visible', timeout: 20_000 });
  assert.ok(await wizard.locator('[name="name"]').count(), 'Production onboarding must render the student name step');
  await assertCleanRender(page, 'production onboarding');

  assert.deepEqual(pageErrors, [], 'Production page JavaScript errors:\n' + pageErrors.join('\n'));
  assert.deepEqual(
    consoleErrors.filter(x => !/favicon/i.test(x)),
    [],
    'Production console errors:\n' + consoleErrors.join('\n')
  );

  console.log(
    'Production smoke passed: deploy identity + real Chromium render + onboarding · ' +
    (actualSha || 'commit-unavailable')
  );
} finally {
  await browser.close();
}
