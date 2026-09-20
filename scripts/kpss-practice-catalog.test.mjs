import assert from 'node:assert/strict';

await import('../public/catalog.js');
await import('../public/kpss-practice-catalog.js');

const C=globalThis.RotaCatalog;
const K=globalThis.RotaKpssPractice;
assert.ok(C,'RotaCatalog must be exported');
assert.ok(K,'RotaKpssPractice must be exported');

const summary=K.validate();
assert.equal(summary.topicSets,24,'KPSS Turkish + history must cover 24 catalog topics');
assert.equal(summary.sectionExams,2,'Initial KPSS content pack must expose Turkish and history section exams');
assert.equal(K.topicSets.every(x=>x.questions.length===4),true,'Every initial topic practice must contain exactly four original questions');

const expectedSubjects=new Map([
  ['k-tr',11],
  ['k-ta',13]
]);
for(const [subjectId,count] of expectedSubjects){
  const subject=C.subjects.find(s=>s.id===subjectId);
  assert.ok(subject,'Subject must exist: '+subjectId);
  const sets=K.topicSets.filter(x=>x.subjectId===subjectId);
  assert.equal(sets.length,count,'Every catalog topic must have a topic-practice set: '+subjectId);
  const covered=new Set(sets.map(x=>x.topicId));
  assert.deepEqual([...covered].sort(),subject.topics.map(t=>t.id).sort(),'Topic practice ids must match the real catalog: '+subjectId);
  for(const set of sets){
    const topic=subject.topics.find(t=>t.id===set.topicId);
    assert.ok(topic,'Topic id must belong to the subject: '+set.topicId);
    assert.equal(set.topicTitle,topic.title,'Topic practice title must match the catalog exactly');
    assert.equal(set.sourceKind,'original');
    assert.equal(set.original,true);
  }
}

const ids=new Set();
for(const set of K.topicSets){
  for(const q of set.questions){
    assert.equal(q.options.length,5,'KPSS questions must have five options');
    assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<5,'Answer index must be valid');
    assert.equal(new Set(q.options.map(x=>String(x).trim().toLocaleLowerCase('tr-TR'))).size,5,'Question options must be unique: '+q.id);
    assert.ok(!ids.has(q.id),'Question id must be unique: '+q.id);
    ids.add(q.id);
  }
}
for(const exam of K.sectionExams){
  const expected=exam.blueprint.reduce((n,row)=>n+row[2],0);
  assert.equal(exam.questions.length,expected,'Section exam must match its blueprint: '+exam.id);
  assert.equal(exam.questions.length,exam.subjectId==='k-tr'?30:27,'Section exam count must match KPSS subject count');
  assert.equal(exam.penalty,4,'KPSS section exam must use 4-wrong/1-correct net convention');
  const subject=C.subjects.find(s=>s.id===exam.subjectId);
  for(const [topicId,title,count] of exam.blueprint){
    const topic=subject.topics.find(t=>t.id===topicId);
    assert.ok(topic,'Blueprint topic must exist: '+topicId);
    assert.equal(title,topic.title,'Blueprint title must match catalog');
    assert.equal(exam.questions.filter(q=>q.topicId===topicId).length,count,'Blueprint allocation must match question tagging');
  }
  for(const q of exam.questions){
    K.validateQuestion(q);
    assert.ok(!ids.has(q.id),'Question id must stay unique across topic and section banks: '+q.id);
    ids.add(q.id);
  }
}

const tr=K.sectionExams.find(x=>x.subjectId==='k-tr');
assert.deepEqual(tr.blueprint.map(x=>x[2]),[2,3,14,4,1,1,1,1,1,1,1],'Turkish blueprint must preserve paragraph + verbal reasoning weight');
const ta=K.sectionExams.find(x=>x.subjectId==='k-ta');
assert.equal(ta.blueprint.reduce((n,x)=>n+x[2],0),27);
assert.match(K.BASIS,/yaklaşık|garantisi değildir/i,'Distribution copy must not imply an official fixed topic allocation');

console.log('KPSS practice catalog passed: 24 topics × 4 original questions + 30-question Turkish + 27-question history section exams');
