import assert from 'node:assert/strict';

await import('../public/intelligence-v1.js');
const I=globalThis.RotaIntelligenceV1;
assert.ok(I,'RotaIntelligenceV1 must load');

const today='2026-09-21';
const workspace={
  plan:[
    {id:'p1',date:'2026-09-18',done:true,minutes:30},
    {id:'p2',date:'2026-09-19',done:false,minutes:30},
    {id:'p3',date:'2026-07-01',done:false,minutes:30}
  ],
  logs:[
    {id:'l1',date:'2026-09-18',minutes:35,correct:14,wrong:6},
    {id:'l2',date:'2026-09-20',minutes:40,correct:12,wrong:8},
    {id:'old',date:'2026-06-01',minutes:999,correct:0,wrong:100}
  ],
  assessments:[
    {id:'a1',date:'2026-09-20',correct:8,wrong:4}
  ],
  exams:[{id:'e1',date:'2026-09-10'}],
  mistakes:[
    {id:'m1',date:'2026-09-18',resolved:false},
    {id:'m2',date:'2026-09-17',resolved:false},
    {id:'m3',date:'2026-09-16',resolved:false}
  ],
  taskEvents:[
    {id:'ev1',date:'2026-09-18',action:'start'},
    {id:'ev2',date:'2026-09-19',action:'later'}
  ],
  route:{modeHistory:[
    {date:'2026-09-18',mode:'repair'},
    {date:'2026-09-20',mode:'progress'}
  ]}
};

const profile=I.longitudinalProfile(workspace,today);
assert.equal(profile.version,1);
assert.equal(profile.windows.d60.studyMinutes,75,'60-day window must ignore old logs');
assert.equal(profile.windows.d60.logCount,2);
assert.equal(profile.windows.d60.execution.due,2);
assert.equal(profile.windows.d60.execution.completed,1);
assert.equal(profile.windows.d60.execution.completion,50);
assert.equal(profile.windows.d60.adaptation.repair,1);
assert.equal(profile.windows.d60.adaptation.progress,1);
assert.ok(profile.confidence>0&&profile.confidence<=100);

const highRisk=I.targetRisk({
  currentNet:48,targetNet:85,daysLeft:25,completion:50,
  performance:52,retention:48,trend:'down',openMistakes:9,confidence:75
});
assert.equal(highRisk.band,'high');
assert.ok(highRisk.score>=65);
assert.ok(highRisk.reasons.length>=3);

const insufficient=I.targetRisk({currentNet:48,targetNet:85,confidence:10});
assert.equal(insufficient.band,'insufficient');
assert.equal(insufficient.score,null,'low-confidence risk must not expose false precision');

const missingMetrics=I.targetRisk({
  currentNet:null,targetNet:null,daysLeft:null,completion:null,
  performance:null,retention:null,confidence:70
});
assert.equal(missingMetrics.band,'insufficient','missing metrics must not be interpreted as zero');
assert.equal(missingMetrics.score,null);
assert.equal(missingMetrics.gap,null);

const repairWithoutRetention=I.repairProposal({
  confidence:80,performance:82,retention:null,openMistakes:0,repeatedError:false,trend:'flat'
});
assert.equal(repairWithoutRetention.mode,'steady','missing retention must not masquerade as zero retention');

const chronicLoad=I.executionPrescription({
  confidence:78,
  windows:{
    d7:{execution:{due:4,completion:50}},
    d30:{execution:{due:12,completion:42}}
  }
});
assert.equal(chronicLoad.mode,'ease','persistent 7/30-day execution strain must reduce workload');
assert.equal(chronicLoad.state,'persistent_strain');

const reboundLoad=I.executionPrescription({
  confidence:78,
  windows:{
    d7:{execution:{due:4,completion:80}},
    d30:{execution:{due:12,completion:48}}
  }
});
assert.equal(reboundLoad.mode,'steady','recent rebound must not be punished by older low completion');
assert.equal(reboundLoad.state,'rebound');

const sparseLoad=I.executionPrescription({
  confidence:80,
  windows:{
    d7:{execution:{due:1,completion:0}},
    d30:{execution:{due:3,completion:33}}
  }
});
assert.equal(sparseLoad.mode,'collect','sparse execution evidence must not force workload changes');

const repair=I.repairProposal({
  confidence:80,performance:51,retention:54,openMistakes:6,repeatedError:true,trend:'down'
});
assert.equal(repair.mode,'repair');
assert.ok(repair.priority>=70);
assert.ok(repair.steps.includes('Yanlış nedeni kaydı'));

const collect=I.repairProposal({confidence:12,performance:40,openMistakes:7});
assert.equal(collect.mode,'collect','low confidence must collect evidence before intervention');

const explanation=I.explainTask({
  task:{kind:'review',source:'mistake',reason:'fallback'},
  model:{openMistakes:4,trend:{direction:'down'}},
  decision:{mode:'repair'},
  risk:{band:'high'},
  mastery:{ready:false,next:'3-day'}
});
assert.equal(explanation.headline,'Neden bugün?');
assert.ok(explanation.reasons[0].includes('yanlış'));
assert.ok(explanation.reasons.length<=3);

console.log('Intelligence V1 passed: 7/30/60-day model + calibrated risk + repair proposal + task explanation');
