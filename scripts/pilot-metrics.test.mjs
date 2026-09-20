import assert from 'node:assert/strict';

await import('../public/pilot-metrics.js');
const M=globalThis.RotaPilotMetrics;
assert.ok(M,'RotaPilotMetrics must be exported');

const ws={
  plan:[
    {id:'p1',date:'2026-09-01',subjectId:'k-ma',topicId:'t1',done:true},
    {id:'p2',date:'2026-09-02',subjectId:'k-ma',topicId:'t1',done:false},
    {id:'r3',date:'2026-09-04',subjectId:'k-ma',topicId:'t1',source:'spaced_review',reviewWave:3,reviewBaseDate:'2026-09-01',done:true},
    {id:'r7',date:'2026-09-08',subjectId:'k-ma',topicId:'t1',source:'spaced_review',reviewWave:7,reviewBaseDate:'2026-09-01',done:false}
  ],
  logs:[
    {sessionId:'p1',date:'2026-09-01',subjectId:'k-ma',questions:20,correct:15,wrong:5},
    {sessionId:'r3',date:'2026-09-04',subjectId:'k-ma',questions:10,correct:8,wrong:2}
  ],
  assessments:[
    {id:'a1',date:'2026-09-03',subjectId:'k-ma',topicId:'t1',total:10,correct:4,wrong:6}
  ],
  mistakes:[
    {id:'m1',subjectId:'k-ma',topicId:'t1',reviewDate:'2026-09-03',resolved:false,created:Date.parse('2026-09-03T12:00:00Z')}
  ],
  route:{
    modeHistory:[
      {date:'2026-09-01',subjectId:'k-ma',topicId:'t1',mode:'steady',created:1},
      {date:'2026-09-02',subjectId:'k-ma',topicId:'t1',mode:'repair',created:2},
      {date:'2026-09-03',subjectId:'k-ma',topicId:'t1',mode:'steady',created:3},
      {date:'2026-09-04',subjectId:'k-ma',topicId:'t1',mode:'repair',created:4},
      {date:'2026-09-05',subjectId:'k-ma',topicId:'t1',mode:'steady',created:5}
    ],
    interventions:[
      {date:'2026-09-02',subjectId:'k-ma',topicId:'t1',mode:'repair'}
    ]
  }
};

const s=M.summarize(ws,{startDate:'2026-09-01',cutoffDate:'2026-09-10'});
assert.equal(s.completion.planned,4);
assert.equal(s.completion.completed,2);
assert.equal(s.completion.rate,50);
assert.equal(s.modes.bounces,3);
assert.equal(s.modes.repairToSteady,2);
assert.equal(s.reviews.due,2);
assert.equal(s.reviews.completed,1);
assert.equal(s.reviews.escapeRate,50);
assert.equal(s.openMistakes,1);
assert.equal(s.interventions,1);
assert.equal(s.miniResults,1);
assert.equal(s.privacy.containsNotes,false);
assert.equal(s.privacy.containsQuestions,false);

const events=M.collectEvents(ws,{startDate:'2026-09-01',cutoffDate:'2026-09-10'});
assert.ok(events.some(x=>x.type==='completion'));
assert.ok(events.some(x=>x.type==='mode'));
assert.ok(events.some(x=>x.type==='mistake_open'));
assert.ok(events.some(x=>x.type==='intervention'));
assert.ok(events.some(x=>x.type==='mini_result'));
assert.ok(events.some(x=>x.type==='spaced_review'));
const serialized=JSON.stringify(events);
for(const secret of ['note','title','question','name','phone'])assert.ok(!serialized.includes('"'+secret+'"'),'Privacy-safe event export must not contain '+secret);

assert.throws(()=>M.safeEvent('unknown',{}),/Desteklenmeyen/);
console.log('Pilot metrics passed: aggregate observability + privacy-safe event schema');
