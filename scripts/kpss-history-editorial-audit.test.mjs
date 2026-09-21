import assert from 'node:assert/strict';

for(let n=1;n<=13;n++) await import('../public/kpss-professional-history-'+String(n).padStart(2,'0')+'.js');
await import('../public/kpss-professional-history-editorial-fixes.js');
for(let n=1;n<=5;n++) await import('../public/kpss-professional-history-sections-'+String(n).padStart(2,'0')+'.js');
await import('../public/kpss-professional-history-editorial-pass2.js');
await import('../public/kpss-professional-history-editorial-pass3.js');
await import('../public/kpss-professional-history-editorial-pass4.js');

const H=globalThis.RotaKpssProfessionalHistory;
const E=globalThis.RotaKpssHistoryEditorialPass2;
const E3=globalThis.RotaKpssHistoryEditorialPass3;
const E4=globalThis.RotaKpssHistoryEditorialPass4;
assert.ok(H&&E&&E3&&E4,'Prime History modules and editorial passes must load');
assert.equal(E.reviewedSample,100,'Human editorial sample must remain 100 questions');
assert.equal(E.rewrittenQuestions,37,'Editorial pass 2 must keep the 37 reviewed rewrites');
assert.equal(E3.rebalancedOptions,30,'Editorial pass 3 must keep 30 distractor rebalances');
assert.equal(E4.reviewedSecondSample,100,'Editorial pass 4 must keep the second independent 100-question review');
assert.equal(E4.shortenedAnswers,85,'Editorial pass 4 must keep 85 answer-balance edits');
assert.equal(E4.rewrittenQuestions,2,'Editorial pass 4 must keep two full rewrites');
assert.equal(E4.rebalancedDistractors,9,'Editorial pass 4 must keep nine hard distractor rebalances');

const topicQuestions=(H.tests||[]).flatMap(t=>t.questions||[]);
const sectionQuestions=(H.sectionExams||[]).flatMap(s=>s.questions||[]);
const all=[...topicQuestions,...sectionQuestions];
assert.equal(topicQuestions.length,624,'Prime History topic bank must remain 624 questions');
assert.equal(sectionQuestions.length,135,'Prime History section bank must remain 135 questions');
assert.equal(all.length,759,'Prime History package must remain 759 questions');

const ids=new Set();
for(const q of all){
  assert.ok(!ids.has(q.id),'History editorial audit: duplicate id '+q.id);
  ids.add(q.id);
  assert.equal(q.options.length,5,'History editorial audit: five options required '+q.id);
  assert.equal(new Set(q.options.map(x=>String(x).trim().toLocaleLowerCase('tr-TR'))).size,5,'History editorial audit: unique options required '+q.id);
  assert.equal(q.options[q.answer],q.answerText,'History editorial audit: answer text mismatch '+q.id);
  assert.equal(q.sourceKind,'original','History editorial audit: sourceKind must remain original '+q.id);
  assert.equal(q.copyrightPolicy,'original-only','History editorial audit: original-only policy required '+q.id);
  assert.ok(String(q.explanation||'').trim().length>=32,'History editorial audit: explanation too short '+q.id);
}

const recall=all.filter(q=>q.cognitive==='recall');
const knowledge=all.filter(q=>q.historyForm==='knowledge');
const directFact=all.filter(q=>/(hangi yıl|kimdir\?|hangisidir\?)/i.test(q.text));
const contested=all.filter(q=>/Kürşad/i.test([q.text,q.answerText,...q.options].join(' ')));

assert.ok(recall.length<=8,'History editorial audit: raw recall drifted too high: '+recall.length);
assert.ok(knowledge.length<=8,'History editorial audit: raw knowledge-form drifted too high: '+knowledge.length);
assert.ok(directFact.length<=90,'History editorial audit: direct-fact stem share drifted too high: '+directFact.length);
assert.equal(contested.length,0,'History editorial audit: contested Kürşad-style single-hero item must not return');

const longAnswerClues=all.filter(q=>{
  const distractors=q.options.filter((_,i)=>i!==q.answer);
  const maxDistractor=Math.max(...distractors.map(x=>String(x).length));
  return String(q.answerText).length>=70&&String(q.answerText).length>maxDistractor+35;
});
assert.ok(longAnswerClues.length<=235,'History editorial audit: answer-length clue risk drifted too high: '+longAnswerClues.length);

console.log(JSON.stringify({
  schema:'calisma-rotasi-kpss-history-editorial-audit-v1',
  questions:all.length,
  topicQuestions:topicQuestions.length,
  sectionQuestions:sectionQuestions.length,
  reviewedSample:E.reviewedSample+E4.reviewedSecondSample,
  firstReviewedSample:E.reviewedSample,
  secondReviewedSample:E4.reviewedSecondSample,
  rewritten:E.rewrittenQuestions,
  rebalancedOptions:E3.rebalancedOptions,
  pass4AnswerBalanceEdits:E4.shortenedAnswers,
  pass4Rewrites:E4.rewrittenQuestions,
  pass4DistractorRebalances:E4.rebalancedDistractors,
  recall:recall.length,
  knowledge:knowledge.length,
  directFact:directFact.length,
  longAnswerClueWatch:longAnswerClues.length
},null,2));
console.log('KPSS History editorial audit passed: 200-question human review + pass2/pass3/pass4 anti-regression gates');
