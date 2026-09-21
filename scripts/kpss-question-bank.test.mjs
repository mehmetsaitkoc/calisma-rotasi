import fs from 'node:fs';
import assert from 'node:assert/strict';

await import('../public/catalog.js');
await import('../public/kpss-question-bank.js');

const C=globalThis.RotaCatalog;
const B=globalThis.RotaKpssQuestionBank;
assert.ok(C,'RotaCatalog must be exported');
assert.ok(B,'RotaKpssQuestionBank must be exported');

const summary=B.validate();
assert.equal(B.QUESTIONS_PER_TEST,12,'Standard KPSS topic tests must contain 12 questions');
assert.equal(B.TARGET_TESTS_PER_TOPIC,4,'Every KPSS topic targets four standard tests');
assert.equal(B.TARGET_SECTION_EXAMS_PER_SUBJECT,5,'Every KPSS subject targets five section exams');
assert.deepEqual(B.SECTION_TOTALS,{'k-tr':30,'k-ma':30,'k-ta':27,'k-co':18,'k-va':9,'k-gu':6});
assert.equal(Object.values(B.SECTION_TOTALS).reduce((n,x)=>n+x,0),120,'KPSS GY-GK section totals must sum to 120');

assert.equal(summary.tests,11,'First standardized content batch must cover all 11 KPSS Turkish topics');
assert.equal(summary.questions,132,'First standardized content batch must add 132 original questions');
assert.deepEqual(summary.subjects,['k-tr']);

const turkish=C.subjects.find(x=>x.id==='k-tr');
assert.ok(turkish);
const coverage=B.coverage(C.subjects).filter(x=>x.subjectId==='k-tr');
assert.equal(coverage.length,turkish.topics.length);
for(const topic of turkish.topics){
  const test=B.topicTests.find(x=>x.topicId===topic.id);
  assert.ok(test,'Missing standardized Turkish topic test: '+topic.id);
  assert.equal(test.topicTitle,topic.title,'Question-bank topic title must match catalog exactly');
  assert.equal(test.questions.length,12);
  assert.equal(test.bankStandard,true);
  assert.equal(test.original,true);
  assert.equal(test.sourceKind,'original');
  assert.equal(test.setNo,1);
}

const ids=new Set(),texts=new Set();
for(const test of B.topicTests){
  const positions=new Set();
  for(const q of test.questions){
    B.validateQuestion(q);
    assert.ok(q.text.length>=20,'Question stem is suspiciously short: '+q.id);
    assert.ok(q.explanation.length>=20,'Explanation is suspiciously short: '+q.id);
    assert.equal(q.options.length,5);
    assert.equal(new Set(q.options.map(x=>x.trim().toLocaleLowerCase('tr-TR'))).size,5,'Options must be unique: '+q.id);
    assert.ok(!ids.has(q.id),'Question id must be globally unique: '+q.id);
    ids.add(q.id);
    const normalized=q.text.replace(/\s+/g,' ').trim().toLocaleLowerCase('tr-TR');
    assert.ok(!texts.has(normalized),'Duplicate question stem: '+q.id);
    texts.add(normalized);
    positions.add(q.answer);
    assert.ok(!/kalite kontrol|soru yeniden|kullanılmamalıdır/i.test(q.text+' '+q.explanation),'Draft/editorial text leaked into bank: '+q.id);
  }
  assert.ok(positions.size>=4,'Correct answers should be distributed across at least four option positions: '+test.id);
}

const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
assert.ok(html.includes('<script src="/kpss-question-bank.js"></script>'),'Real app must load the standardized KPSS bank');
assert.ok(html.includes("...(window.RotaKpssQuestionBank?.topicTests||[])"),'Real exam center must compose standardized KPSS tests into the existing mini flow');
assert.match(B.BASIS,/özgün|kopyalanmaz/i);
assert.match(B.BASIS,/garantisi verilmez/i,'Topic distribution copy must not claim an official fixed allocation');

console.log('KPSS question bank passed: 11 Turkish topics × 12 original questions + 4-test/5-section target contract');
