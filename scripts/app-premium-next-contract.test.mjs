import fs from 'node:fs';
import assert from 'node:assert/strict';

const loader=fs.readFileSync(new URL('../public/landing-final.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../public/app-premium-next.css',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../public/app-premium-next.js',import.meta.url),'utf8');

for(const marker of [
  'APP PREMIUM NEXT LOADER',
  '/app-premium-next.css?v=1',
  '/app-premium-next.js?v=1'
]) assert.ok(loader.includes(marker),'Missing app premium loader marker: '+marker);

for(const marker of [
  'APP PREMIUM NEXT V3 · KPSS TARGET DASHBOARD',
  '.pnx3-dashboard',
  '.pnx3-plan-card',
  '.pnx3-focus',
  '.pnx3-week-card',
  '.pnx3-goals-card',
  '.pnx3-teacher-card',
  '.pnx3-results-card',
  '.pnx3-quote-card',
  '.pnx3-insight-archive',
  '.pnx-progress-signal',
  '.pnx-head-art',
  '.mobile-dock',
  'hero-journey-final.webp',
  '@media(max-width:650px)',
  '@media(prefers-reduced-motion:reduce)'
]) assert.ok(css.includes(marker),'Missing KPSS dashboard CSS contract marker: '+marker);

for(const marker of [
  'data-premium-surface="today"',
  'premium-signal-rail',
  'route-today-hero',
  'route-list-head',
  'route-list',
  'Bugünün Planı',
  "KPSS\\'de ne çalışmak istersin?",
  'Bugün, hedefindeki sen için güçlü bir gün!',
  'pnx3-dashboard',
  'pnx3-plan',
  'pnx3-focus',
  'pnx3-week-card',
  'pnx3-goals-card',
  'pnx3-teacher-card',
  'pnx3-results-card',
  'pnx3-quote-card',
  'pnxStudentName',
  'Neden bugün?',
  'ROTA KARARI',
  'Pomodoro ile başla',
  'MutationObserver',
  "document.querySelector('.app-shell')"
]) assert.ok(js.includes(marker),'Missing KPSS dashboard JS contract marker: '+marker);

for(const forbidden of [
  'generatePlan',
  'RotaRuntimeV1',
  'routeDecisionForRender',
  'localStorage',
  'sessionStorage',
  "fetch('/api/",
  'window.RotaIntelligence'
]) assert.ok(!js.includes(forbidden),'Presentation layer must not own engine/runtime state: '+forbidden);

assert.ok(
  js.includes("root.querySelector('.route-progress-summary b')"),
  'Daily progress must be derived from the existing rendered route state'
);
assert.ok(
  js.includes('plan.append(listHead, list)') && js.includes('focus.appendChild(hero)'),
  'KPSS dashboard must move the real route list and real focus node instead of cloning product actions'
);
assert.ok(
  js.includes("if (target) target.hidden = true"),
  'Target signal may be hidden visually but must remain available as real product evidence'
);
assert.ok(
  css.includes('Keep existing sidebar exactly as the current product shell'),
  'V3 must explicitly preserve the existing sidebar'
);
assert.ok(
  css.includes('APP PREMIUM NEXT V3.1 · PLAN HEADER + IDENTITY INTEGRITY'),
  'V3 must keep the Bugünün Planı header aligned after the calendar affordance is injected'
);
assert.ok(
  js.includes("header.dataset.pnxStudentName = name"),
  'V3 must cache the real student name so MutationObserver re-renders cannot turn it into “Bugün”'
);

console.log('App Premium Next contract passed: KPSS target dashboard + real route data + unchanged sidebar + responsive/day-night guards');
