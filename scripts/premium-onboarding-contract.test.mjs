import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../public/app-premium-next.css', import.meta.url), 'utf8');

for (const marker of [
  "return ['intro','goals','analysis']",
  'function premiumKpssIntroView()',
  'function premiumKpssGoalsView()',
  'function premiumKpssAnalysisView()',
  'function premiumKpssSummaryView()',
  'Hedeflerinle <em>başlayalım.</em>',
  'Seni daha iyi <em>tanıyalım.</em>',
  'Rotan <em>hazır.</em>',
  'name="targetNet"',
  'name="dailyMinutes"',
  'name="days"',
  'name="strongSubjects"',
  'name="weakSubjects"',
  'name="currentNetApprox"',
  'name="studyHabit"',
  'summary-build',
  'data-premium-surface="onboarding"'
]) {
  assert.ok(html.includes(marker), `Premium KPSS onboarding marker missing: ${marker}`);
}

assert.match(
  html,
  /if\(state\.activeExam==='kpss'\)return premiumKpssSetupSubmit\(form\)/,
  'KPSS setup submit must use the grouped premium flow'
);
assert.match(
  html,
  /subjectLevels:levels,resourceHabits:resources,completed:true,summaryConfirmed:false/,
  'Situation analysis must persist route-driving subject levels before summary'
);
assert.match(
  html,
  /w\(\)\.settings\.dailyMinutes=dailyMinutes;w\(\)\.settings\.days=\[\.\.\.new Set\(days\)\]/,
  'Goals stage must persist daily capacity and exact working days'
);
assert.match(
  html,
  /w\(\)\.settings\.priorities=priorities/,
  'Goals stage must feed selected subject priorities into the route settings'
);

for (const marker of [
  'PREMIUM KPSS ONBOARDING V2',
  '.premium-ob-page',
  '.premium-ob-steps',
  '.premium-ob-intro',
  '.premium-ob-goal-layout',
  '.premium-ob-analysis-layout',
  '.premium-ob-ready',
  '@media(max-width:760px)'
]) {
  assert.ok(css.includes(marker), `Premium onboarding CSS marker missing: ${marker}`);
}

assert.doesNotMatch(
  html,
  /function premiumKpssSetupSubmit[\s\S]{0,7000}fetch\s*\(/,
  'Onboarding must remain local and must not introduce network writes'
);

console.log('Premium KPSS onboarding contract passed');
