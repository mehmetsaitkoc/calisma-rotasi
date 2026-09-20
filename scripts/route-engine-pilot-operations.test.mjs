import assert from 'node:assert/strict';
import {milestoneStatus,pilotAlarms,studentOverview,cohortSummary} from './route-engine-pilot-operations.mjs';

function snap(checkpoint,overrides={}){
  const start='2026-09-01',target=new Date(start+'T12:00:00');target.setDate(target.getDate()+checkpoint);const date=target.toISOString().slice(0,10);
  const base={
    checkpoint,milestoneDay:checkpoint,actualDay:checkpoint,windowStart:start,windowEnd:date,targetDate:date,capturedDate:date,delayDays:0,
    planned:{tasks:10,minutes:250,questions:100},
    actual:{completedTasks:8,skippedTasks:1,laterTasks:0,minutes:220,questions:90,correct:70,wrong:20,accuracy:77.8,completion:80,questionAttainmentRatio:.9},
    mistakes:{openAtCapture:2,created:3,resolved:1},
    mastery:{completedTopics:4,mastery:70,forgettingDue:1,retentionRefresh:1},
    modes:{steady:5,repair:0,ease:0,progress:0,transitions:1,bounces:0,repairDays:0,sustainableDays:0,steadyDays:5,progressDays:0,current:'steady'},
    interventions:{total:1,helpful:1,neutral:0,harmful:0,insufficient:0,confounded:0,pending:0,latest:{date,mode:'repair',status:'helpful'}},
    student:{state:'steady',performance:72,learningNeed:36,risk:44,confidence:81,execution:78,retention:71,trend:'up',personalNorm:'flat',velocity:'steady'}
  };
  return {
    ...base,...overrides,
    planned:{...base.planned,...(overrides.planned||{})},
    actual:{...base.actual,...(overrides.actual||{})},
    mistakes:{...base.mistakes,...(overrides.mistakes||{})},
    mastery:{...base.mastery,...(overrides.mastery||{})},
    modes:{...base.modes,...(overrides.modes||{})},
    interventions:{...base.interventions,...(overrides.interventions||{})},
    student:{...base.student,...(overrides.student||{})}
  };
}
function payload(id,overrides={}){
  return {schema:'calisma-rotasi-pilot-v1',participantId:id,exam:'kpss',track:'lisans',startDate:'2026-09-01',generatedDate:'2026-10-01',lastActiveDate:'2026-09-30',completed:false,snapshots:[snap(0),snap(7),snap(14)],...overrides};
}
function observability(overrides={}){
  return {
    schema:'calisma-rotasi-pilot-metrics-v1',
    version:2,
    completion:{planned:20,completed:15,rate:75},
    modes:{samples:5,transitions:2,bounces:1,repairToSteady:1,repairToProgress:1,repairExit:2},
    reviews:{
      due:5,completed:3,missed:2,completionRate:60,escapeRate:40,
      byWave:{3:{due:3,completed:2,missed:1,completionRate:66.7,escapeRate:33.3},7:{due:2,completed:1,missed:1,completionRate:50,escapeRate:50}}
    },
    openMistakes:2,
    mistakeTrend:{opened:3,resolved:2,netChange:1,direction:'rising',evidenceComplete:true,currentOpen:2},
    interventions:2,
    miniResults:4,
    miniRepairRecovery:{episodes:3,recoveredEvidence:1,stillRepairEvidence:1,insufficientEvidence:1,recoveryRate:50,observationalOnly:true},
    privacy:{aggregateOnly:true,localFirst:true,optInRequired:true,containsName:false,containsPhone:false,containsEmail:false,containsNotes:false,containsQuestions:false,containsPhoto:false,containsFreeText:false,containsAiChat:false},
    ...overrides
  };
}

// Milestone states distinguish done/waiting/overdue without fabricating a snapshot.
{
  const p=payload('p-milestone',{generatedDate:'2026-09-20'});
  assert.equal(milestoneStatus(p,14).status,'done');
  assert.equal(milestoneStatus(p,30).status,'waiting');
  const missing={...p,snapshots:p.snapshots.filter(x=>x.checkpoint!==14)};
  const m=milestoneStatus(missing,14);
  assert.equal(m.status,'overdue');
  assert.equal(m.lateByDays,5);
}

// Data alarms use actual last activity; a missing lastActiveDate remains unknown rather than assumed stale.
{
  const stale=payload('p-stale',{generatedDate:'2026-10-01',lastActiveDate:'2026-09-23'});
  const codes=pilotAlarms(stale).map(x=>x.code);
  assert.ok(codes.includes('no-data-3d'));
  assert.ok(codes.includes('possible-dropout'));
  const unknown=payload('p-unknown',{lastActiveDate:''});
  assert.ok(!pilotAlarms(unknown).some(x=>x.code==='no-data-3d'));
}

// Motor alarms detect material regression from checkpoint evidence.
{
  const p=payload('p-regress',{snapshots:[
    snap(0),
    snap(7,{modes:{current:'progress',transitions:2},student:{performance:82,risk:40},mastery:{mastery:78},actual:{completion:88}}),
    snap(14,{modes:{current:'repair',transitions:6},student:{performance:68,risk:51},mastery:{mastery:66},actual:{completion:70},interventions:{harmful:1,helpful:0,latest:{date:'2026-09-14',mode:'progress',status:'harmful'}}})
  ]});
  const codes=pilotAlarms(p,'2026-09-15').map(x=>x.code);
  assert.ok(codes.includes('progress-performance-drop'));
  assert.ok(codes.includes('risk-rising'));
  assert.ok(codes.includes('mode-transition-spike'));
  assert.ok(codes.includes('mastery-regression'));
  assert.ok(codes.includes('harmful-intervention'));
  assert.equal(studentOverview(p,'2026-09-15').status,'critical');
}

// Sustainable mode must show recovery at the next sufficiently separated checkpoint.
{
  const p=payload('p-ease',{snapshots:[
    snap(0),
    snap(7,{modes:{current:'ease'},actual:{completion:55}}),
    snap(14,{modes:{current:'ease'},actual:{completion:52}})
  ]});
  assert.ok(pilotAlarms(p,'2026-09-15').some(x=>x.code==='ease-no-completion-recovery'));
}

// Skip-heavy students are surfaced for pilot operations.
{
  const p=payload('p-skip',{snapshots:[snap(0,{planned:{tasks:10},actual:{skippedTasks:6,completion:30}})]});
  assert.ok(pilotAlarms(p,'2026-09-02').some(x=>x.code==='high-skip-rate'));
}

// Cohort summary counts latest cumulative intervention totals only once per student.
{
  const p1=payload('p-1',{snapshots:[
    snap(0,{actual:{completion:60},student:{performance:60}}),
    snap(30,{actual:{completion:85},student:{performance:75},interventions:{helpful:2,harmful:0},modes:{transitions:2,bounces:1}})
  ],completed:true});
  const p2=payload('p-2',{exam:'yks',snapshots:[
    snap(0,{actual:{completion:70},student:{performance:65}}),
    snap(30,{actual:{completion:80},student:{performance:72},interventions:{helpful:1,harmful:1},modes:{transitions:3,bounces:2}})
  ],completed:true});
  const s=cohortSummary([p1,p2],'2026-10-01');
  assert.equal(s.students,2);
  assert.equal(s.milestones.day7,0);
  assert.equal(s.milestones.day14,0);
  assert.equal(s.milestones.day30,2);
  assert.equal(s.helpfulInterventions,3);
  assert.equal(s.harmfulInterventions,1);
  assert.equal(s.averageCompletionChange,17.5);
  assert.equal(s.averagePerformanceChange,11);
  assert.equal(s.modeTransitions,5);
  assert.equal(s.modeBounces,3);
  assert.equal(s.counts.critical,1);
  assert.equal(s.rows.find(x=>x.participantId==='p-2').status,'critical');
}

// V2 observability is consumed without turning observational signals into mastery claims.
{
  const p1=payload('p-obs-1',{observability:observability()});
  const p2=payload('p-obs-2',{observability:observability({
    modes:{samples:4,transitions:1,bounces:2,repairToSteady:1,repairToProgress:0,repairExit:1},
    reviews:{due:4,completed:2,missed:2,completionRate:50,escapeRate:50,byWave:{3:{due:2,completed:1,missed:1,completionRate:50,escapeRate:50},7:{due:2,completed:1,missed:1,completionRate:50,escapeRate:50}}},
    mistakeTrend:{opened:1,resolved:2,netChange:-1,direction:'falling',evidenceComplete:true,currentOpen:1},
    miniRepairRecovery:{episodes:2,recoveredEvidence:1,stillRepairEvidence:0,insufficientEvidence:1,recoveryRate:100,observationalOnly:true}
  })});
  const row=studentOverview(p1,'2026-09-15');
  assert.equal(row.observability.available,true);
  assert.equal(row.observability.version,2);
  assert.equal(row.observability.review3Escape,33.3);
  assert.equal(row.observability.review7Escape,50);
  assert.equal(row.observability.openMistakeTrend,'rising');
  assert.equal(row.observability.miniRepairRecoveryRate,50);
  const s=cohortSummary([p1,p2],'2026-09-15');
  assert.equal(s.observability.participants,2);
  assert.equal(s.observability.coverage,100);
  assert.equal(s.observability.version2,2);
  assert.deepEqual(s.observability.review3,{due:5,missed:2,escapeRate:40});
  assert.deepEqual(s.observability.review7,{due:4,missed:2,escapeRate:50});
  assert.equal(s.observability.repairExitTotal,3);
  assert.equal(s.observability.modeBouncesTotal,3);
  assert.deepEqual(s.observability.mistakeTrend,{rising:1,falling:1,flat:0,insufficient_evidence:0});
  assert.deepEqual(s.observability.miniRepairRecovery,{episodes:5,recoveredEvidence:2,stillRepairEvidence:1,insufficientEvidence:2,recoveryRate:66.7,observationalOnly:true});
  assert.equal(s.observability.privacySafe,2);
}

// Unsafe or incomplete v2 privacy metadata must be rejected instead of silently accepted.
{
  const unsafe=payload('p-unsafe',{observability:observability({privacy:{aggregateOnly:true,localFirst:false,optInRequired:true,containsName:false,containsNotes:false,containsQuestions:false}})});
  assert.throws(()=>studentOverview(unsafe,'2026-09-15'),/privacy sözleşmesi/i);
}

// Latest intervention metadata is directly available to the future admin row.
{
  const row=studentOverview(payload('p-last'),'2026-09-15');
  assert.deepEqual(row.intervention,{date:'2026-09-15',mode:'repair',status:'helpful'});
}

console.log('route-engine-pilot-operations: milestone, alarm, overview, cohort and v2 observability rules passed');
