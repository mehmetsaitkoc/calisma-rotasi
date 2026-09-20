import fs from 'node:fs';
import assert from 'node:assert/strict';

for(const key of ['RotaCatalog','RotaWorkspaceSchema','RotaCore','RotaAnalysis']) delete globalThis[key];

await import('../public/catalog.js');
await import('../public/workspace-schema.js');
await import('../public/core.js');
await import('../public/analysis.js');

assert.ok(globalThis.RotaCatalog,'catalog boundary must load first');
assert.ok(globalThis.RotaWorkspaceSchema,'workspace schema boundary must load');
assert.ok(globalThis.RotaCore,'core boundary must expose RotaCore');
assert.ok(globalThis.RotaAnalysis,'analysis boundary must expose RotaAnalysis');

for(const fn of ['fresh','workspace','generatePlan','calcNet','validateBackup']){
  assert.equal(typeof globalThis.RotaCore[fn],'function','RotaCore contract missing: '+fn);
}
for(const fn of ['analyze','applyExamSignals','makeReview','nextReviewDate','dayLoad']){
  assert.equal(typeof globalThis.RotaAnalysis[fn],'function','RotaAnalysis contract missing: '+fn);
}

const fresh=globalThis.RotaCore.fresh();
assert.equal(fresh.workspaces.kpss.exam,'kpss');
assert.equal(fresh.workspaces.yks.exam,'yks');

const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
assert.ok(html.includes('<script src="/core.js"></script>'),'index must load extracted core.js');
assert.ok(html.includes('<script src="/analysis.js"></script>'),'index must load extracted analysis.js');
assert.ok(!html.includes('root.RotaCore={'),'RotaCore implementation must not drift back inline');
assert.ok(!html.includes('root.RotaAnalysis={'),'RotaAnalysis implementation must not drift back inline');

console.log('Architecture boundary passed: catalog/workspace → core → analysis modules');
