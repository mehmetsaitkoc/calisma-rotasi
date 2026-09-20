import assert from 'node:assert/strict';

delete globalThis.RotaCatalog;
delete globalThis.RotaTurkish;

await import('../public/catalog.js');
assert.ok(globalThis.RotaCatalog,'catalog.js must expose RotaCatalog');
assert.ok(globalThis.RotaCatalog.subjects.length>=20,'Catalog must keep KPSS/YKS subjects');
assert.ok(globalThis.RotaCatalog.subjects.some(s=>s.id==='k-ma'&&s.exam==='kpss'),'KPSS math subject must exist');
assert.ok(globalThis.RotaCatalog.subjects.some(s=>s.id==='t-ma'&&s.exam==='yks'),'TYT math subject must exist');
assert.equal(globalThis.RotaCatalog.TRACKS.say,'Sayısal');
assert.ok(globalThis.RotaCatalog.TYPES.KPSS&&globalThis.RotaCatalog.TYPES.TYT,'Exam type definitions must stay available');

await import('../public/turkish-catalog.js');
assert.ok(globalThis.RotaTurkish,'turkish-catalog.js must expose RotaTurkish');
assert.ok(Array.isArray(globalThis.RotaTurkish.SERIES),'Course source series must remain an array');
assert.ok(globalThis.RotaTurkish.DATA?.checkedAt,'Course source catalog must keep provenance metadata');

const kpssOptions=globalThis.RotaTurkish.options('k-tr');
assert.ok(Array.isArray(kpssOptions),'Course source options must stay callable');
const kpssTurkish=globalThis.RotaCatalog.subjects.find(s=>s.id==='k-tr');
assert.ok(kpssTurkish?.topics?.length,'KPSS Turkish topics must exist');
assert.ok(globalThis.RotaTurkish.orderedTopics({turkishPrefs:{}},'k-tr',kpssTurkish.topics).length>0,'Course topic ordering must resolve against external RotaCatalog');

console.log('Catalog boundary passed: exam/topic catalog + course source catalog load as external modules');
