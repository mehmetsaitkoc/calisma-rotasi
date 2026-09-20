import assert from 'node:assert/strict';
import {summarizeCohort,markdown} from './route-engine-pilot-cohort.mjs';

function snap(checkpoint,{completion,accuracy,questionAttainment,questions,performance,learningNeed,risk,execution,openMistakes,mastery,helpful=0,harmful=0,insufficient=0,confounded=0,pending=0}){
  const start='2026-09-19',target=new Date(start+'T12:00:00');target.setDate(target.getDate()+checkpoint);const date=target.toISOString().slice(0,10);
  return {
    checkpoint,milestoneDay:checkpoint,actualDay:checkpoint,windowStart:start,windowEnd:date,targetDate:date,capturedDate:date,capturedAt:1,delayDays:0,
    planned:{tasks:10,minutes:250,questions:100},
    actual:{completedTasks:8,skippedTasks:1,laterTasks:1,minutes:220,questions,correct:80,wrong:20,accuracy,completion,questionAttainmentRatio:questionAttainment},
    exam:{count:1,latestDate:'2026-09-25',latestNet:60},
    mistakes:{openAtCapture:openMistakes,created:2,resolved:1},
    mastery:{completedTopics:4,mastery,forgettingDue:1,retentionRefresh:1},
    modes:{steady:5,repair:1,ease:0,progress:1,transitions:2,current:'steady'},
    interventions:{total:helpful+harmful+insufficient+confounded+pending,helpful,neutral:0,harmful,insufficient,confounded,pending,horizons:{7:{helpful,neutral:0,harmful,insufficient,confounded,pending:0},14:{helpful:0,neutral:0,harmful:0,insufficient:0,confounded:0,pending:0},30:{helpful:0,neutral:0,harmful:0,insufficient:0,confounded:0,pending:0}}},
    student:{state:'steady',performance,learningNeed,risk,confidence:80,execution,retention:72,trend:'up',personalNorm:'flat',velocity:'steady'},
    dataQuality:{capturedOnTime:true,plannedExact:true,openMistakesExact:true,modeHistoryExact:true,interventionHistoryExact:true,studentModelExact:true,masteryExact:true,actualLogsExact:true}
  };
}
function obs({review3Due=3,review3Missed=1,review7Due=2,review7Missed=1,repairExit=2,bounces=1,trend='rising',episodes=3,recovered=1,stillRepair=1,insufficient=1}={}){
  const r3Completed=review3Due-review3Missed,r7Completed=review7Due-review7Missed,ratio=(n,d)=>d?Math.round(n/d*1000)/10:null;
  return {
    schema:'calisma-rotasi-pilot-metrics-v1',version:2,
    completion:{planned:20,completed:15,rate:75},
    modes:{samples:6,transitions:3,bounces,repairToSteady:1,repairToProgress:Math.max(0,repairExit-1),repairExit},
    reviews:{due:review3Due+review7Due,completed:r3Completed+r7Completed,missed:review3Missed+review7Missed,completionRate:ratio(r3Completed+r7Completed,review3Due+review7Due),escapeRate:ratio(review3Missed+review7Missed,review3Due+review7Due),byWave:{
      3:{due:review3Due,completed:r3Completed,missed:review3Missed,completionRate:ratio(r3Completed,review3Due),escapeRate:ratio(review3Missed,review3Due)},
      7:{due:review7Due,completed:r7Completed,missed:review7Missed,completionRate:ratio(r7Completed,review7Due),escapeRate:ratio(review7Missed,review7Due)}
    }},
    openMistakes:2,
    mistakeTrend:{opened:3,resolved:2,netChange:1,direction:trend,evidenceComplete:true,currentOpen:2},
    interventions:2,miniResults:4,
    miniRepairRecovery:{episodes,recoveredEvidence:recovered,stillRepairEvidence:stillRepair,insufficientEvidence:insufficient,recoveryRate:ratio(recovered,recovered+stillRepair),observationalOnly:true},
    privacy:{aggregateOnly:true,localFirst:true,optInRequired:true,containsName:false,containsPhone:false,containsEmail:false,containsNotes:false,containsQuestions:false,containsPhoto:false,containsFreeText:false,containsAiChat:false}
  };
}
const p1={schema:'calisma-rotasi-pilot-v1',participantId:'p-a',exam:'kpss',track:'lisans',startDate:'2026-09-19',generatedDate:'2026-10-19',completed:true,snapshots:[
  snap(0,{completion:60,accuracy:65,questionAttainment:.6,questions:20,performance:60,learningNeed:55,risk:65,execution:58,openMistakes:5,mastery:50}),
  snap(14,{completion:75,accuracy:73,questionAttainment:.8,questions:100,performance:70,learningNeed:40,risk:50,execution:70,openMistakes:3,mastery:64}),
  snap(30,{completion:85,accuracy:78,questionAttainment:.95,questions:180,performance:76,learningNeed:30,risk:42,execution:80,openMistakes:1,mastery:74,helpful:1})
],observability:obs()};
const p2={schema:'calisma-rotasi-pilot-v1',participantId:'p-b',exam:'yks',track:'say',startDate:'2026-09-19',generatedDate:'2026-10-19',completed:true,snapshots:[
  snap(0,{completion:70,accuracy:70,questionAttainment:.7,questions:25,performance:65,learningNeed:50,risk:60,execution:64,openMistakes:4,mastery:55}),
  snap(7,{completion:75,accuracy:72,questionAttainment:.75,questions:60,performance:68,learningNeed:46,risk:55,execution:68,openMistakes:4,mastery:58,pending:1}),
  snap(14,{completion:82,accuracy:76,questionAttainment:.9,questions:115,performance:74,learningNeed:35,risk:47,execution:76,openMistakes:2,mastery:68,confounded:1}),
  snap(30,{completion:90,accuracy:80,questionAttainment:1.05,questions:200,performance:80,learningNeed:25,risk:38,execution:84,openMistakes:1,mastery:78,helpful:2})
],observability:obs({review3Due:2,review3Missed:0,review7Due:2,review7Missed:1,repairExit:1,bounces:2,trend:'falling',episodes:2,recovered:1,stillRepair:0,insufficient:1})};
const s=summarizeCohort([p1,p2]);
assert.equal(s.participants,2);
assert.equal(s.examCounts.kpss,1);
assert.equal(s.examCounts.yks,1);
assert.equal(s.checkpoints.find(x=>x.checkpoint===0).coverage,100);
assert.equal(s.checkpoints.find(x=>x.checkpoint===7).coverage,50);
assert.equal(s.checkpoints.find(x=>x.checkpoint===30).completion,87.5);
assert.equal(s.paired30.completion.n,2);
assert.equal(s.paired30.completion.avg,22.5);
assert.equal(s.paired30.performance.avg,15.5);
assert.equal(s.paired30.learningNeed.avg,-25);
assert.equal(s.paired30.risk.avg,-22.5);
assert.equal(s.paired30.openMistakes.avg,-3.5);
assert.equal(s.paired30.mastery.avg,23.5);
const d07=s.comparisons.find(x=>x.from===0&&x.to===7);
assert.equal(d07.completion.n,1);
assert.equal(d07.completion.avg,5);
const d714=s.comparisons.find(x=>x.from===7&&x.to===14);
assert.equal(d714.performance.n,1);
assert.equal(d714.performance.avg,6);
assert.equal(s.harmfulTotal,0);
assert.equal(s.helpfulTotal,3);
assert.equal(s.confoundedTotal,1);
assert.equal(s.observability.participants,2);
assert.equal(s.observability.coverage,100);
assert.equal(s.observability.version2,2);
assert.deepEqual(s.observability.review3,{sources:2,due:5,completed:4,missed:1,escapeRate:20});
assert.deepEqual(s.observability.review7,{sources:2,due:4,completed:2,missed:2,escapeRate:50});
assert.equal(s.observability.repairExitTotal,3);
assert.equal(s.observability.modeBounces,3);
assert.deepEqual(s.observability.mistakeTrend,{rising:1,falling:1,flat:0,insufficient_evidence:0});
assert.deepEqual(s.observability.miniRepairRecovery,{episodes:5,recoveredEvidence:2,stillRepairEvidence:1,insufficientEvidence:2,recoveryRate:66.7,observationalOnly:true});
assert.equal(s.observability.privacySafe,2);
const md=markdown(s);
assert.ok(md.includes('Eşleşmiş checkpoint değişimleri'));
assert.ok(md.includes('Gün 14 → 30'));
assert.ok(md.includes('Harmful checkpoint sonuçları: **0**'));
assert.ok(md.includes('Operasyonel gözlemlenebilirlik'));
assert.ok(md.includes('3 gün review escape'));
assert.ok(md.includes('Mini onarım yeniden ölçüm'));
assert.ok(md.includes('nedensel etki veya pedagojik başarı kanıtı değildir'));
assert.throws(()=>summarizeCohort([p1,{...p2,participantId:'p-a'}]),/Aynı participantId/);
assert.throws(()=>summarizeCohort([{...p1,snapshots:[p1.snapshots[0],p1.snapshots[0]]}]),/aynı checkpoint/i);
const legacy={...p2,participantId:'p-legacy'};delete legacy.observability;
assert.equal(summarizeCohort([p1,legacy]).observability.coverage,50,'Legacy exports without observability must reduce coverage instead of fabricating v2 metrics');
const unsafe={...p2,participantId:'p-unsafe',observability:{...p2.observability,privacy:{...p2.observability.privacy,localFirst:false}}};
assert.throws(()=>summarizeCohort([p1,unsafe]),/privacy sözleşmesi/i);
console.log('route-engine-pilot-cohort: coverage, paired deltas, intervention safety and v2 observability aggregation passed');
