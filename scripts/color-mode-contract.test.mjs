import fs from 'node:fs';
import assert from 'node:assert/strict';

const loader = fs.readFileSync(new URL('../public/landing-final.js', import.meta.url), 'utf8');
const mode = fs.readFileSync(new URL('../public/color-mode.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../public/app-premium-next.css', import.meta.url), 'utf8');

for (const marker of [
  '/color-mode.js?v=1',
  'data-color-mode'
]) assert.ok(loader.includes(marker), 'Missing color-mode loader marker: ' + marker);

for (const marker of [
  "const STORAGE_KEY = 'calisma-rotasi:color-mode:v1'",
  "const ATTR = 'data-cr-color-mode'",
  'cr-theme-toggle-app',
  'cr-theme-toggle-landing',
  'Gece moduna geç',
  'Gündüz moduna geç',
  'localStorage.setItem',
  'localStorage.getItem',
  'MutationObserver'
]) assert.ok(mode.includes(marker), 'Missing day/night controller marker: ' + marker);

for (const forbidden of [
  'RotaRuntimeV1',
  'routeDecisionForRender',
  'generatePlan',
  "fetch('/api/",
  'RotaIntelligence'
]) assert.ok(!mode.includes(forbidden), 'Display-mode controller must remain presentation-only: ' + forbidden);

for (const marker of [
  'APP PREMIUM NEXT V2.9 · DAY / NIGHT DISPLAY MODE',
  'html[data-cr-color-mode="dark"] body.app-premium-next-ready',
  'html[data-cr-color-mode="dark"] .premium-landing-final',
  '.cr-theme-toggle-app',
  '.cr-theme-toggle-landing',
  '@media(max-width:900px)',
  '@media(prefers-reduced-motion:reduce)'
]) assert.ok(css.includes(marker), 'Missing day/night CSS contract marker: ' + marker);

assert.ok(
  css.includes('input::placeholder') && css.includes('.mobile-dock'),
  'Dark mode must cover forms and mobile navigation'
);

console.log('Color mode contract passed: persistent day/night toggle for landing + workspace with responsive dark palette');
