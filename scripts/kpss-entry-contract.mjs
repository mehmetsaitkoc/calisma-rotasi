import assert from 'node:assert/strict';

const EXAM_CONTROL = '[data-action="choose-exam"], [data-exam]';
const RETIRED_COPY = /\bYKS\b|\bTYT\b|\bAYT\b|\bYDT\b|ROTA\s+HOCA/;

export async function assertKpssLanding(page, label = 'KPSS landing') {
  // landing-final replaces the initial welcome DOM in requestAnimationFrame.
  // Inspect the mounted Web Beta, not the transient pre-enhancement controls.
  const welcome = page.locator('.welcome.premium-landing-final[data-pixel-match="1"]');
  await welcome.waitFor({ state: 'visible', timeout: 20_000 });
  const product = welcome.locator('.v6-prep-card');
  assert.equal(await product.count(), 1, label + ': must expose one canonical KPSS product card');
  assert.equal(await product.getAttribute('data-exam'), 'kpss', label + ': canonical product must be KPSS');
  assert.equal(await product.getAttribute('data-action'), 'choose-exam', label + ': canonical product must use the existing onboarding action');

  const primary = welcome.locator('.v6-main-cta');
  assert.equal(await primary.count(), 1, label + ': must expose one primary start CTA');
  assert.equal(await primary.getAttribute('data-action'), 'choose-exam', label + ': primary CTA must start onboarding');
  assert.equal(await primary.getAttribute('data-exam'), 'kpss', label + ': primary CTA must start KPSS');
  assert.ok(await primary.isVisible(), label + ': primary CTA must be visible');

  // Header, hero and sample-dashboard CTAs may repeat the SAME product action.
  // Do not freeze their global count at either 1 or 4.
  const controls = welcome.locator(EXAM_CONTROL);
  assert.ok(await controls.count(), label + ': must expose a KPSS start control');
  for (const control of await controls.all()) {
    assert.equal(await control.getAttribute('data-action'), 'choose-exam', label + ': every exam control must use canonical onboarding');
    assert.equal(await control.getAttribute('data-exam'), 'kpss', label + ': no alternate exam product may be exposed');
  }
  assert.equal(await page.locator('[data-exam="yks"], [data-view="teacher"]').count(), 0, label + ': retired products must stay absent');
  const copy = (await welcome.innerText()).toLocaleUpperCase('tr-TR');
  assert.ok(!RETIRED_COPY.test(copy), label + ': visible copy must stay KPSS-only without Rota Hoca');
  return controls;
}

export async function assertKpssOnboarding(page, label = 'KPSS onboarding') {
  const wizard = page.locator('#setup-wizard-form');
  await wizard.waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(await wizard.count(), 1, label + ': must open one canonical wizard');
  assert.ok(await page.locator('[data-premium-surface="onboarding"]').isVisible(), label + ': must open the premium onboarding surface');
  assert.ok(await wizard.locator('button[type="submit"]').count(), label + ': must open the welcome stage');
  assert.equal(await wizard.locator('select[name="track"]').count(), 0, label + ': must not expose a YKS track');
  const activeExam = await page.evaluate(() => {
    const key = new URLSearchParams(location.search).get('fresh') === '1'
      ? 'calisma-rotasi:all:v5:fresh-preview'
      : 'calisma-rotasi:all:v5';
    return JSON.parse(localStorage.getItem(key) || 'null')?.activeExam;
  });
  assert.equal(activeExam, 'kpss', label + ': must activate the KPSS workspace');
  const copy = (await page.locator('body').innerText()).toLocaleUpperCase('tr-TR');
  assert.ok(!RETIRED_COPY.test(copy), label + ': retired products must stay absent');
}

export async function verifyKpssEntryPoints(browser, base) {
  const results = [];
  for (const width of [360, 1280]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 }, locale: 'tr-TR', timezoneId: 'Europe/Istanbul'
    });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      await page.goto(base + '/?fresh=1', { waitUntil: 'domcontentloaded' });
      const controls = await assertKpssLanding(page, width + 'px landing');
      const count = await controls.count();
      let exercised = 0;
      for (let index = 0; index < count; index++) {
        // Each entry starts with empty storage; never resume the previous probe.
        await page.evaluate(() => localStorage.clear());
        await page.goto(base + '/?fresh=1', { waitUntil: 'domcontentloaded' });
        const current = await assertKpssLanding(page, width + 'px entry ' + index);
        assert.equal(await current.count(), count, 'Landing controls must be stable across fresh loads');
        const control = current.nth(index);
        // Responsive-hidden desktop controls are exercised in the desktop pass.
        if (!(await control.isVisible())) continue;
        const name = (await control.innerText()).trim().replace(/\s+/g, ' ');
        await control.click();
        await assertKpssOnboarding(page, width + 'px ' + name);
        results.push({ width, index, name });
        exercised++;
      }
      assert.ok(exercised > 0, width + 'px must expose an actionable KPSS entry');
      if (width === 1280) assert.equal(exercised, count, 'Desktop must exercise every KPSS entry control');
      assert.deepEqual(errors, [], 'KPSS entry probes must not produce JavaScript errors');
    } finally {
      await context.close();
    }
  }
  console.log('KPSS entry-point regression passed: ' + JSON.stringify(results));
  return results;
}
