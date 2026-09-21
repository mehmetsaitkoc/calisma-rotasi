import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const [landing, boundary] = await Promise.all([
  fs.readFile(new URL('../public/landing-final.js', import.meta.url), 'utf8'),
  fs.readFile(new URL('../public/kpss-only.js', import.meta.url), 'utf8')
]);

assert.match(landing, /prepCard\('kpss'/, 'Premium landing must keep the KPSS entry point');
assert.doesNotMatch(landing, /prepCard\('yks'/i, 'Premium landing must not expose a YKS entry point');
assert.doesNotMatch(landing, /12\. Sınıf\s*·\s*YKS|YKS 2026|KPSS \+ YKS/i, 'Premium demo copy must be KPSS-only');
assert.match(landing, /kpss-only\.js/, 'Premium loader must install the KPSS-only boundary');

assert.match(boundary, /const LEGACY_EXAM = 'yks'/, 'Legacy YKS identity must remain explicit only for compatibility');
assert.match(boundary, /\[data-exam="yks"\]/, 'Runtime must actively remove stale YKS product controls');
assert.match(boundary, /\[data-scope="TYT"\].*\[data-scope="AYT"\].*\[data-scope="YDT"\]/s, 'Runtime must hide legacy YKS academy filters');
assert.match(boundary, /paid-start.*paid-free-start/s, 'Primary CTAs must bypass exam selection and enter KPSS');
assert.match(boundary, /value\?\.workspaces\?\.kpss && value\?\.workspaces\?\.yks/, 'Legacy backups must remain readable without deleting their YKS workspace');
assert.match(boundary, /!entry\.value\.workspaces\?\.kpss\?\.configured/, 'An unconfigured KPSS legacy migration must reuse the real onboarding flow');
assert.match(boundary, /entry\.value\.activeExam = PRIMARY_EXAM/, 'A configured stale YKS selection must migrate to KPSS before the workspace resumes');
assert.match(boundary, /localStorage\.setItem\(entry\.key, JSON\.stringify\(entry\.value\)\)/, 'KPSS-only migration must persist only the selected workspace switch');
assert.match(boundary, /location\.reload\(\)/, 'A legacy YKS resume must reload against the migrated KPSS selection');
assert.doesNotMatch(boundary, /delete\s+[^;\n]*workspaces/i, 'Compatibility boundary must never delete a legacy workspace');
assert.match(boundary, /function setText\(node, value\)/, 'Academy scrubbing must be idempotent under the MutationObserver');
assert.match(boundary, /if \(node && node\.textContent !== value\) node\.textContent = value/, 'Academy copy updates must not create endless observer churn');
assert.doesNotMatch(boundary, /fetch\s*\(/, 'KPSS-only presentation boundary must not own network behavior');
assert.doesNotMatch(boundary, /routeRebalance|routeEnsure|generatePlan|StudentIntelligence/i, 'KPSS-only boundary must not own Route Engine or Intelligence behavior');

console.log('KPSS-only product boundary contract passed');
