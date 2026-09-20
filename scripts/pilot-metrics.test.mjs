import assert from 'node:assert/strict';

await import('../public/pilot-metrics.js');
const M=globalThis.RotaPilotMetrics;
assert.ok(M,'RotaPilotMetrics must be exported');
assert.equal(M.METRICS_VERSION,2,'Pilot metrics contract must be explicitly versioned');

const ws={
  settings:{name:'PRIVATE-NAME',email:'PRIVATE-EMAIL'},
  plan:[
    {id:'p1',date:'2026-09-01',subjectId:'k-ma',topicId:'t1',done:true},
    {id:'p2',date:'2026-09-02',subjectId:'k-ma',topicId:'t1',done:false},
    {id:'r3',date:'2026-09-04',subjectId:'k-ma',topicId:'t1',source:'spaced_review',reviewWave:3,reviewBaseDate:'2026-09-01',done:true},
    {id:'r7',date:'2026-09-08',subjectId:'k-ma',topicId:'t1',source:'spaced_review',reviewWave:7,reviewBaseDate:'2026-09-01',done:false}
  ],
  logs:[
    {sessionId:'p1',date:'2026-09-01',subjectId:'k-ma',questions:20,correct:15,wrong:5,note:'PRIVATE-NOTE'},
    {sessionId:'r3',date:'2026-09-04',subjectId:'k-ma',questions:10,correct:8,wrong:2}
  ],
  assessments:[
    {id:'a1',date:'2026-09-03',subjectId:'k-ma',topicId:'t1',total:10,correct:4,wrong:6,question:'PRIVATE-QUESTION'}
  ],
  mistakes:[
    {id:'m1',subjectId:'k-ma',topicId:'t1',reviewDate:'2026-09-03',resolved:false,created:Date.parse('2026-09-03T12:00:00Z'),note:'PRIVATE-MISTAKE-NOTE'}
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
      {date:'2026-09-02',subjectId:'k-ma',topicId:'t1',mode:'repair',reason:'PRIVATE-INTERVENTION-TEXT'}
    ]
  }
};

const s=M.summarize(ws,{startDate:'2026-09-01',cutoffDate:'2026-09-10'});
assert.equal(s.completion.planned,4);
assert.equal(s.completion.completed,2);
assert.equal(s.completion.rate,50);
assert.equal(s.modes.bounces,3);
assert.equal(s.modes.repairToSteady,2);
assert.equal(s.modes.repairToProgress,0);
assert.equal(s.modes.repairExit,2);
assert.equal(s.reviews.due,2);
assert.equal(s.reviews.completed,1);
assert.equal(s.reviews.escapeRate,50);
assert.deepEqual(s.reviews.byWave[3],{due:1,completed:1,missed:0,completionRate:100,escapeRate:0});
assert.deepEqual(s.reviews.byWave[7],{due:1,completed:0,missed:1,completionRate:0,escapeRate:100});
assert.equal(s.openMistakes,1);
assert.equal(s.mistakeTrend.opened,1);
assert.equal(s.mistakeTrend.resolved,0);
assert.equal(s.mistakeTrend.netChange,1);
assert.equal(s.mistakeTrend.direction,'rising');
assert.equal(s.mistakeTrend.evidenceComplete,true);
assert.equal(s.interventions,1);
assert.equal(s.miniResults,1);
assert.equal(s.privacy.localFirst,true);
assert.equal(s.privacy.optInRequired,true);
assert.equal(s.privacy.containsEmail,false);
assert.equal(s.privacy.containsPhoto,false);
assert.equal(s.privacy.containsFreeText,false);
assert.equal(s.privacy.containsAiChat,false);

const progressExit=M.summarize({plan:[],logs:[],assessments:[],mistakes:[],route:{modeHistory:[
  {date:'2026-09-01',subjectId:'k-ma',topicId:'t2',mode:'repair',created:1},
  {date:'2026-09-02',subjectId:'k-ma',topicId:'t2',mode:'progress',created:2}
],interventions:[]}}, {startDate:'2026-09-01',cutoffDate:'2026-09-10'});
assert.equal(progressExit.modes.repairToProgress,1);
assert.equal(progressExit.modes.repairExit,1);

const recovery=M.summarize({
  plan:[
    {id:'mr1',date:'2026-09-03',subjectId:'k-ma',topicId:'t1',source:'mini_repair',sourceAssessmentId:'weak1',done:true},
    {id:'mr2',date:'2026-09-04',subjectId:'k-ma',topicId:'t2',source:'mini_repair',sourceAssessmentId:'weak2',done:false},
    {id:'mr3',date:'2026-09-05',subjectId:'k-ma',topicId:'t3',source:'mini_repair',sourceAssessmentId:'weak3',done:false}
  ],
  logs:[],
  assessments:[
    {id:'weak1',date:'2026-09-01',created:1,subjectId:'k-ma',topicId:'t1',total:10,correct:4,wrong:6,routeDecision:{mode:'repair'}},
    {id:'follow1',date:'2026-09-06',created:2,subjectId:'k-ma',topicId:'t1',total:10,correct:8,wrong:2,routeDecision:{mode:'steady'}},
    {id:'weak2',date:'2026-09-02',created:3,subjectId:'k-ma',topicId:'t2',total:10,correct:4,wrong:6,routeDecision:{mode:'repair'}},
    {id:'follow2',date:'2026-09-07',created:4,subjectId:'k-ma',topicId:'t2',total:10,correct:5,wrong:5,routeDecision:{mode:'repair'}},
    {id:'weak3',date:'2026-09-03',created:5,subjectId:'k-ma',topicId:'t3',total:10,correct:4,wrong:6,routeDecision:{mode:'repair'}}
  ],
  mistakes:[],
  route:{modeHistory:[],interventions:[]}
},{startDate:'2026-09-01',cutoffDate:'2026-09-10'});
assert.deepEqual(recovery.miniRepairRecovery,{
  episodes:3,
  recoveredEvidence:1,
  stillRepairEvidence:1,
  insufficientEvidence:1,
  recoveryRate:50,
  observationalOnly:true
},'Mini repair recovery must be an observational later-mini signal, not a mastery claim');

const events=M.collectEvents(ws,{startDate:'2026-09-01',cutoffDate:'2026-09-10'});
assert.ok(events.some(x=>x.type==='completion'));
assert.ok(events.some(x=>x.type==='mode'));
assert.ok(events.some(x=>x.type==='mistake_open'));
assert.ok(events.some(x=>x.type==='intervention'));
assert.ok(events.some(x=>x.type==='mini_result'));
assert.ok(events.some(x=>x.type==='spaced_review'));
const serialized=JSON.stringify(events);
for(const forbiddenKey of ['note','title','question','name','phone','email','photo','message','aiChat'])assert.ok(!serialized.includes('"'+forbiddenKey+'"'),'Privacy-safe event export must not contain '+forbiddenKey);
for(const forbiddenValue of ['PRIVATE-NAME','PRIVATE-EMAIL','PRIVATE-NOTE','PRIVATE-QUESTION','PRIVATE-MISTAKE-NOTE','PRIVATE-INTERVENTION-TEXT'])assert.ok(!serialized.includes(forbiddenValue),'Privacy-safe event export must not leak '+forbiddenValue);

const invalidMode=M.safeEvent('mode',{date:'2026-09-01',mode:'normal'});
assert.equal(Object.hasOwn(invalidMode,'mode'),false,'Unknown mode must not fabricate a steady/default telemetry signal');
assert.throws(()=>M.safeEvent('unknown',{}),/Desteklenmeyen/);
console.log('Pilot metrics passed: v2 local-first observability + per-wave reviews + mistake trend + mini repair recovery + strict privacy whitelist');
