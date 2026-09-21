import fs from 'node:fs';
import assert from 'node:assert/strict';

await import('../public/catalog.js');
for (let i = 1; i <= 10; i++) {
  await import('../public/kpss-history-' + String(i).padStart(2, '0') + '.js');
}

const C = globalThis.RotaCatalog;
assert.ok(C, 'RotaCatalog must load');

const packs = Array.from({ length: 10 }, (_, i) =>
  globalThis['RotaKpssHistory' + String(i + 1).padStart(2, '0')]
);
assert.ok(packs.every(Boolean), 'All ten professional History packs must load');

const tests = packs.flatMap(pack => pack.tests || []);
assert.equal(tests.length, 30, '10 History topics × 3 tests must produce 30 professional tests');
assert.equal(tests.reduce((sum, test) => sum + test.questions.length, 0), 360, 'Professional History pack must expose 360 questions');

const history = C.subjects.find(subject => subject.id === 'k-ta');
assert.ok(history, 'KPSS History subject must exist');
const expectedTopics = history.topics.slice(0, 10).map(topic => topic.id);
assert.deepEqual([...new Set(tests.map(test => test.topicId))], expectedTopics, 'Professional History pack must cover catalog topics 1-10 in order');

const ids = new Set();
for (const test of tests) {
  assert.equal(test.exam, 'kpss');
  assert.equal(test.subjectId, 'k-ta');
  assert.equal(test.questions.length, 12, test.id + ' must contain 12 questions');
  assert.equal(test.qualityStatus, 'approved', test.id + ' must stay approved');
  assert.equal(test.sourceKind, 'original');
  assert.equal(test.copyrightPolicy, 'original-only');
  const topic = history.topics.find(row => row.id === test.topicId);
  assert.ok(topic, 'Test topic must exist in History catalog: ' + test.topicId);
  assert.equal(test.topicTitle, topic.title, 'Professional History title must match catalog');
  for (const question of test.questions) {
    assert.equal(question.topicId, test.topicId);
    assert.equal(question.options.length, 5, question.id + ' must have five options');
    assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 5, question.id + ' answer must be valid');
    assert.ok(question.explanation?.trim(), question.id + ' must have an explanation');
    assert.ok(question.skill?.trim(), question.id + ' must have a skill');
    assert.ok(['easy','medium','hard'].includes(question.difficulty), question.id + ' difficulty must be valid');
    assert.ok(['context','interpretation','reasoning','application','recall'].includes(question.cognitive), question.id + ' cognitive tag must be valid');
    assert.ok(!ids.has(question.id), 'Professional History question id must be unique: ' + question.id);
    ids.add(question.id);
  }
}
assert.equal(ids.size, 360);

const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
for (let i = 1; i <= 10; i++) {
  const name = String(i).padStart(2, '0');
  assert.ok(html.includes('<script src="/kpss-history-' + name + '.js"></script>'), 'History pack script must load: ' + name);
  assert.ok(html.includes('RotaKpssHistory' + name), 'History pack must join the active catalog: ' + name);
}
assert.ok(html.includes('KPSS_PROFESSIONAL_HISTORY_TESTS'), 'Professional History aggregation boundary must exist');
assert.ok(html.includes('KPSS_PROFESSIONAL_HISTORY_TOPIC_KEYS'), 'Professional History topic replacement boundary must exist');
assert.ok(html.includes('KPSS_SEED_TOPIC_TESTS.filter'), 'Seed History tests must be replaced, not duplicated');
assert.ok(html.includes('def.questions?.[index]?.skill'), 'History question skill metadata must feed analysis');

console.log('KPSS professional History integration passed: 10 topics × 3 tests × 12 questions = 360 live-catalog questions');
