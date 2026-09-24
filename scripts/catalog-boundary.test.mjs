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
assert.deepEqual(globalThis.RotaTurkish.SERIES,[],'No bundled external teacher series');
assert.deepEqual(globalThis.RotaTurkish.SOURCES,[],'No bundled external video catalog');
assert.equal(globalThis.RotaTurkish.DATA.mode,'personal-source-compatibility');

const kpssOptions=globalThis.RotaTurkish.options('k-tr');
assert.ok(Array.isArray(kpssOptions),'Course source options must stay callable');
const kpssTurkish=globalThis.RotaCatalog.subjects.find(s=>s.id==='k-tr');
assert.ok(kpssTurkish?.topics?.length,'KPSS Turkish topics must exist');
assert.deepEqual(globalThis.RotaTurkish.orderedTopics({turkishPrefs:{'k-tr':'legacy-series'}},'k-tr',kpssTurkish.topics),kpssTurkish.topics,'Legacy source preference must never reorder catalog topics');
assert.deepEqual(globalThis.RotaTurkish.validatePreferences({'k-tr':'legacy-series'},'kpss'),{'k-tr':'legacy-series'},'Old source identifiers remain exportable');
assert.throws(()=>globalThis.RotaTurkish.validatePreferences({'k-tr':'constructor'},'kpss'));
assert.throws(()=>globalThis.RotaTurkish.validatePreferences({'t-tr':'legacy-series'},'kpss'));
const legacy={courseSources:{'k-tr':{playlistId:'PL123456789abc',title:'Kişisel listem',teacher:'Kendi kaydım'}},courseNotes:{'k-tr':'Eski notum'},courseProgress:{'k-tr':{PL123456789abc:{videoId:'abcdefghijk',index:3,second:42}}}};
assert.deepEqual(globalThis.RotaTurkish.validateCourseData(legacy,'kpss'),legacy,'Personal playlists, notes and resume records must survive validation unchanged');

console.log('Catalog boundary passed: exam/topic catalog + course source catalog load as external modules');
