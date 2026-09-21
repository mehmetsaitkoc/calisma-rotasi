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
  'APP PREMIUM NEXT V1',
  '.pnx-stage',
  '.pnx-route-panel',
  '.pnx-intel-strip',
  '.pnx-progress-signal',
  '.pnx-target-signal',
  'hero-journey-final.webp',
  '@media(max-width:430px)',
  '@media(prefers-reduced-motion:reduce)'
]) assert.ok(css.includes(marker),'Missing app premium CSS contract marker: '+marker);

for(const marker of [
  'data-premium-surface="today"',
  'premium-signal-rail',
  'route-today-hero',
  'route-list-head',
  'route-list',
  'Neden bugün?',
  'ROTA KARARI · AÇIKLANABİLİR',
  'MutationObserver'
]) assert.ok(js.includes(marker),'Missing app premium JS contract marker: '+marker);

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
  js.includes("appendChild(hero)") && js.includes("routePanel.append(listHead, list)"),
  'Premium layout must move the real interactive nodes instead of cloning product actions'
);

console.log('App Premium Next contract passed: presentation-only Today composition + real-data progress + mobile/reduced-motion guards');
