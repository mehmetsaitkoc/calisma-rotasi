import assert from 'node:assert/strict';
import fs from 'node:fs';
import {bank as B,catalog as C,files} from './question-bank-load.mjs';
await import('../public/questions/kpss/branch-exams.js');
const subjects=C.subjects.filter(s=>s.exam==='kpss'),tests=B.allTests(),published=B.topicTests(),audit=B.audit();
assert.equal(subjects.length,6);assert.equal(subjects.flatMap(s=>s.topics).length,64);
assert.equal(files.length,256);assert.equal(tests.length,256);assert.equal(published.length,256);
assert.equal(audit.total,3072);assert.equal(audit.approved,3072);assert.equal(audit.rejected,0);assert.equal(audit.needsReview,0);
assert.deepEqual(audit.duplicates,[]);assert.deepEqual(audit.testIssues,[]);
const ids=new Set();
for(const subject of subjects)for(const topic of subject.topics){
 const sets=published.filter(t=>t.topicId===topic.id).sort((a,b)=>a.setNo-b.setNo);
 assert.deepEqual(sets.map(t=>t.setNo),[1,2,3,4],topic.title);
 for(const set of sets){
  assert.equal(set.subjectId,subject.id);assert.equal(set.topicTitle,topic.title);assert.equal(set.questions.length,12);
  for(const q of set.questions){assert.ok(!ids.has(q.id));ids.add(q.id);assert.equal(q.review.fingerprint,B.fingerprint(q));assert.equal(B.validateQuestion(q).status,'approved');}
 }
}
assert.equal(ids.size,3072);
const exams=RotaKpssBankExams.sectionExams;
assert.equal(exams.length,18);assert.ok(RotaKpssBankExams.readiness.every(s=>s.status==='ready'));
const totals={'k-tr':30,'k-ma':30,'k-ta':27,'k-co':18,'k-va':9,'k-gu':6};
for(const subject of subjects){
 const series=exams.filter(e=>e.subjectId===subject.id);assert.equal(series.length,3);assert.ok(series.every(e=>e.title.startsWith(subject.name+' · ')));
 const used=new Set();
 for(const [variant,exam] of series.entries()){
  assert.ok(exam.questions.filter(q=>q.testNo===variant+2).length>=Math.ceil(exam.questions.length*2/3),'Branch forms primarily use Test2/3/4 material: '+exam.id);
  assert.equal(exam.questions.length,totals[subject.id]);assert.equal(exam.blueprint.reduce((n,t)=>n+t[2],0),totals[subject.id]);
  for(const q of exam.questions){assert.equal(q.subjectId,subject.id);assert.ok(ids.has(q.id));assert.ok(!used.has(q.id),'Variants must not repeat a question: '+q.id);used.add(q.id);}
  for(const [topic,,count] of exam.blueprint)assert.equal(exam.questions.filter(q=>q.topicId===topic).length,count);
 }
}
assert.equal(exams.reduce((n,e)=>n+e.questions.length,0),360);
const manifest=JSON.parse(fs.readFileSync(new URL('../public/questions/kpss/manifest.json',import.meta.url),'utf8'));
assert.deepEqual(manifest.files,files.map(f=>'questions/kpss/'+f));
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
for(const file of manifest.files)assert.equal(html.split('<script src="/'+file+'"></script>').length-1,1,'Each content module loads exactly once: '+file);
assert.ok(html.indexOf('/questions/kpss/branch-exams.js')>html.lastIndexOf('/test-4.js'),'Assembly must happen after content modules load');
for(const q of tests.filter(t=>['k-va','k-gu'].includes(t.subjectId)).flatMap(t=>t.questions)){
 assert.equal(q.currentness?.required,true,'All law/current-affairs questions require dated evidence: '+q.id);
 const mutant=structuredClone(q);delete mutant.currentness;mutant.review.fingerprint=B.fingerprint(mutant);
 assert.equal(B.validateQuestion(mutant).status,'needs-review','A new fingerprint cannot replace required dated source evidence: '+q.id);
}
const pending=structuredClone(tests.find(t=>t.subjectId==='k-gu'));
assert.ok(pending.questions.every(q=>q.currentness?.required),'Every current-affairs question has an explicit verification window');
const future=B.audit([pending],{asOf:'2027-01-01'});assert.equal(future.approved,0,'Date-sensitive content cannot be served indefinitely without rechecking');
console.log('Full bank:6subjects,64topics,256tests,3072approved unique questions,18ready branch exams,360non-overlapping variant usages.');
