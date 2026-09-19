import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../public/pilot-operations.html',import.meta.url),'utf8');
const shared=fs.readFileSync(new URL('../public/pilot-operations.js',import.meta.url),'utf8');

for(const marker of [
  'ÇALIŞMA ROTASI · PİLOT OPERASYON',
  'Pilot JSON ekle',
  'Cohort özeti indir',
  '0/7/14/30',
  'Intervention geçmişi',
  'Snapshot karşılaştırma',
  'Operasyon alarmları',
  'type="module"',
  "from './pilot-operations.js'",
  'data-id=',
  'localStorage',
  'sunucuya göndermez',
  'nedensel bir sonuç üretmez'
])assert.ok(html.includes(marker),'Missing pilot operations UI marker: '+marker);

for(const marker of [
  'function validatePilotPayload',
  'function milestoneStatus',
  'function pilotAlarms',
  'function studentOverview',
  'function cohortSummary',
  "no-data-3d",
  "possible-dropout",
  "harmful-intervention",
  "mastery-regression",
  "progress-performance-drop"
])assert.ok(shared.includes(marker),'Missing shared pilot operations marker: '+marker);

assert.ok(!/\bTC\b|telefon|adres/i.test(shared),'Shared pilot operations model must not require direct personal identifiers');

const moduleMatch=html.match(/<script type="module">([\s\S]*?)<\/script>/);
assert.ok(moduleMatch,'Pilot operations module script missing');
const compilable=moduleMatch[1].replace(/^import[^\n]+\n/,'');
assert.doesNotThrow(()=>new Function(compilable),'Pilot operations inline module must parse after stripping static import');

console.log('route-engine-pilot-operations-ui: dashboard contract and inline module syntax passed');
