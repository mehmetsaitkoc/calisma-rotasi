import assert from 'node:assert/strict';

await import('../public/intelligence-v1.js');
const I=globalThis.RotaIntelligenceV1;
assert.ok(I,'Intelligence V1 must load');

const cases=[
  {
    name:'cold start',
    risk:{currentNet:35,targetNet:85,daysLeft:40,completion:null,performance:null,retention:null,trend:'unknown',openMistakes:0,confidence:12},
    expectRisk:'insufficient',
    repair:{confidence:12,performance:40,retention:null,openMistakes:5,repeatedError:true,trend:'down'},
    expectRepair:'collect'
  },
  {
    name:'high target gap + confirmed weakness',
    risk:{currentNet:48,targetNet:88,daysLeft:28,completion:58,performance:49,retention:51,trend:'down',openMistakes:8,confidence:82},
    expectRisk:'high',
    repair:{confidence:82,performance:49,retention:51,openMistakes:8,repeatedError:true,trend:'down'},
    expectRepair:'repair'
  },
  {
    name:'strong stable student',
    risk:{currentNet:82,targetNet:84,daysLeft:120,completion:92,performance:88,retention:86,trend:'up',openMistakes:0,confidence:90},
    expectRisk:'low',
    repair:{confidence:90,performance:88,retention:86,openMistakes:0,repeatedError:false,trend:'up'},
    expectRepair:'steady'
  },
  {
    name:'missing retention is unknown, not failure',
    risk:{currentNet:70,targetNet:80,daysLeft:100,completion:88,performance:81,retention:null,trend:'flat',openMistakes:0,confidence:76},
    expectRisk:'low',
    repair:{confidence:76,performance:81,retention:null,openMistakes:0,repeatedError:false,trend:'flat'},
    expectRepair:'steady'
  }
];

for(const c of cases){
  const risk=I.targetRisk(c.risk);
  assert.equal(risk.band,c.expectRisk,c.name+' risk');
  const repair=I.repairProposal(c.repair);
  assert.equal(repair.mode,c.expectRepair,c.name+' repair');
}

const executionCases=[
  {
    name:'persistent overload',
    profile:{confidence:80,windows:{d7:{execution:{due:5,completion:40}},d30:{execution:{due:16,completion:44}}}},
    expected:'ease'
  },
  {
    name:'recent rebound',
    profile:{confidence:80,windows:{d7:{execution:{due:5,completion:80}},d30:{execution:{due:16,completion:48}}}},
    expected:'steady'
  },
  {
    name:'healthy execution',
    profile:{confidence:80,windows:{d7:{execution:{due:5,completion:80}},d30:{execution:{due:16,completion:82}}}},
    expected:'steady'
  },
  {
    name:'not enough execution evidence',
    profile:{confidence:80,windows:{d7:{execution:{due:1,completion:0}},d30:{execution:{due:4,completion:25}}}},
    expected:'collect'
  }
];

for(const c of executionCases){
  const rx=I.executionPrescription(c.profile);
  assert.equal(rx.mode,c.expected,c.name+' execution prescription');
}

console.log('Intelligence persona audit passed: cold start + confirmed weakness + strong student + missing metrics + overload/rebound');
