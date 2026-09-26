import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { assertKpssLanding, verifyKpssEntryPoints } from './kpss-entry-contract.mjs';

const PORT = Number(process.env.PRODUCTION_SMOKE_TEST_PORT || 8818);
const BASE = `http://127.0.0.1:${PORT}`;
const SHA = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const server = spawn(process.execPath, ['server.mjs'], {
  env: {
    ...process.env, PORT: String(PORT), HOST: '127.0.0.1',
    NODE_ENV: 'production', RENDER: 'true', RENDER_GIT_COMMIT: SHA,
    ROTA_ACCOUNTS_MODE: 'local-only', ROTA_APP_ORIGIN: 'https://beta.example',
    OPENAI_API_KEY: ''
  },
  stdio: ['ignore', 'pipe', 'pipe']
});
let serverLog = '';
let serverError;
server.on('error', error => { serverError = error; });
server.stdout.on('data', data => { serverLog += data; });
server.stderr.on('data', data => { serverLog += data; });

async function waitServer() {
  for (let attempt = 0; attempt < 150; attempt++) {
    if (serverError) throw serverError;
    if (server.exitCode !== null) throw new Error('Production regression server exited.\n' + serverLog);
    try {
      const response = await fetch(BASE + '/api/health');
      if (response.ok) {
        const health = await response.json();
        assert.equal(health.deploy?.gitCommit || health.gitCommit, SHA);
        assert.deepEqual(health.accounts, { available: false, mode: 'local-only' });
        return;
      }
    } catch (error) {
      if (error.code === 'ERR_ASSERTION') throw error;
    }
    await sleep(100);
  }
  throw new Error('Production regression server did not start.\n' + serverLog);
}

async function rejectBrokenContracts(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  try {
    const page = await context.newPage();
    const cases = [
      ['duplicate product', () => {
        const card = document.querySelector('.v6-prep-card');
        card.parentElement.appendChild(card.cloneNode(true));
      }, /one canonical KPSS product card/],
      ['missing product', () => document.querySelector('.v6-prep-card').remove(), /one canonical KPSS product card/],
      ['duplicate primary CTA', () => {
        const cta = document.querySelector('.v6-main-cta');
        cta.parentElement.appendChild(cta.cloneNode(true));
      }, /one primary start CTA/],
      ['misrouted primary CTA', () => {
        document.querySelector('.v6-main-cta').dataset.exam = 'other';
      }, /primary CTA must start KPSS/],
      ['broken secondary CTA', () => {
        document.querySelector('.v6-dash-task').dataset.action = 'noop';
      }, /every exam control must use canonical onboarding/]
    ];
    for (const [name, mutate, message] of cases) {
      await page.goto(BASE + '/?fresh=1', { waitUntil: 'domcontentloaded' });
      await assertKpssLanding(page);
      await page.evaluate(mutate);
      await assert.rejects(() => assertKpssLanding(page), message, name + ' must fail the shared contract');
      console.log('KPSS contract negative regression passed: ' + name);
    }
  } finally {
    await context.close();
  }
}

let browser;
try {
  await waitServer();
  browser = await chromium.launch({ headless: true });
  await verifyKpssEntryPoints(browser, BASE);
  await rejectBrokenContracts(browser);
  await browser.close();
  browser = null;
  // Run the actual production script, not a second approximation of it.
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/production-smoke.mjs'], {
      env: {
        ...process.env, PRODUCTION_URL: BASE, EXPECTED_SHA: SHA,
        PRODUCTION_DEPLOY_WAIT_MS: '15000', PRODUCTION_POLL_MS: '100'
      },
      stdio: 'inherit', timeout: 120_000
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`Local production smoke failed: code=${code}, signal=${signal}`)));
  });
  console.log('Production smoke regression passed against local Render-mode Web Beta: ' + SHA);
} finally {
  if (browser) await browser.close();
  if (server.exitCode === null) server.kill('SIGTERM');
  for (let attempt = 0; attempt < 40 && server.exitCode === null; attempt++) await sleep(50);
  if (server.exitCode === null) server.kill('SIGKILL');
}
