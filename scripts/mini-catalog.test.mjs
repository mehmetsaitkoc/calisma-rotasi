import fs from 'node:fs';
import assert from 'node:assert/strict';

await import('../public/mini-catalog.js');
await import('../public/kpss-practice-catalog.js');
globalThis.window=globalThis;
const M=globalThis.RotaMiniCatalog;
assert.ok(M,'RotaMiniCatalog must be exported');

const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const a=html.indexOf('const ROTA_MINI_EXAMS'),b=html.indexOf('const OFFICIAL_EXAM_RESOURCES',a);
assert.ok(a>=0&&b>a,'Mini catalog source markers must exist');
const src=html.slice(a,b);
const defs=new Function(src+';return ROTA_MINI_EXAMS;')();

assert.ok(defs.length>=48,'Original mini seeds plus KPSS topic practices must be present');
const legacySeeds=defs.filter(x=>!String(x.id).includes('-practice-'));
assert.equal(legacySeeds.length,24,'The original 24 mini seed definitions must stay intact');
const kpssPractices=defs.filter(x=>String(x.id).includes('-practice-'));
assert.equal(kpssPractices.length,24,'KPSS Turkish + history must add one original topic-practice set per catalog topic');
assert.equal(new Set(defs.map(x=>x.id)).size,defs.length,'Mini ids must stay unique');
for(const def of defs){
  const n=M.normalize(def);
  assert.equal(n.sourceKind,'original');
  assert.equal(n.original,true);
  if(legacySeeds.some(x=>x.id===def.id))assert.equal(n.setNo,1,'Legacy seed minis must remain Set #01');
  else assert.ok([1,2].includes(n.setNo),'New KPSS topic practices may use Set #02 when Set #01 already existed');
  assert.ok(n.seriesId.includes(def.subjectId));
}

const groups=M.groups(defs);
const coverage=M.coverage(defs);
assert.equal(coverage.sets,defs.length);
assert.equal(coverage.topics,groups.length);
assert.equal(coverage.targetSetsPerTopic,4);
assert.equal(coverage.missingSetSlots,groups.length*4-defs.length);

const first=defs[0],next=M.nextSetTemplate(defs,first);
assert.equal(next.setNo,2);
assert.equal(next.sourceKind,'original');
assert.equal(next.copyrightPolicy,'original-only');

const second={...first,id:first.id.replace(/-01$/,'-02'),title:first.title.replace(/#01/,'#02'),questions:first.questions.map(q=>({...q,id:q.id+'b'}))};
const expanded=[...defs,second],info=M.describe(first,expanded);
assert.deepEqual(info.availableSets,[1,2]);
assert.equal(info.nextSetNo,3);
assert.equal(M.groups(expanded).find(g=>g.seriesId===info.seriesId).sets.length,2);

assert.ok(!src.includes('OFFICIAL_EXAM_RESOURCES'),'Official links must stay outside the original mini catalog');
console.log('Mini catalog passed: legacy seeds + KPSS topic practices + original-only 4-set expansion scaffold');
