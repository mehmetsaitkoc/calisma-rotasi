import assert from 'node:assert/strict';
import {summarizeCohort,markdown} from './route-engine-pilot-cohort.mjs';

function snap(checkpoint,{completion,accuracy,questions,performance,learningNeed,risk,helpful=0,harmful=0,pending=0}){
  return {
    checkpoint,targetDate:'2026-09-'+String(19+Math.min(checkpoint,11)).padStart(2,'0'),capturedDate:'2026-09-30',capturedAt:1,delayDays:0,
    planned:{tasks:10,minutes:250,questions:100},
    actual:{completedTasks:8,minutes:220,questions,correct:80,wrong:20,accuracy,completion},
    exam:{count:1,latestDate:'2026-09-25',latestNet:60},
    mistakes:{openAtCapture:2,created:2,resolved:1},
    modes:{steady:5,repair:1,ease:0,progress:1,transitions:2,current:'steady'},
    interventions:{total:helpful+harmful+pending,helpful,neutral:0,harmful,pending},
    student:{performance,learningNeed,risk,confidence:80},
    dataQuality:{openMistakesExact:true}
  };
}
const p1={schema:'calisma-rotasi-pilot-v1',participantId:'p-a',exam:'kpss',track:'lisans',startDate:'2026-09-19',generatedDate:'2026-10-19',completed:true,snapshots:[
  snap(0,{completion:60,accuracy:65,questions:20,performance:60,learningNeed:55,risk:65}),
  snap(30,{completion:85,accuracy:78,questions:180,performance:76,learningNeed:30,risk:42,helpful:1})
]};
const p2={schema:'calisma-rotasi-pilot-v1',participantId:'p-b',exam:'yks',track:'say',startDate:'2026-09-19',generatedDate:'2026-10-19',completed:true,snapshots:[
  snap(0,{completion:70,accuracy:70,questions:25,performance:65,learningNeed:50,risk:60}),
  snap(7,{completion:75,accuracy:72,questions:60,performance:68,learningNeed:46,risk:55,pending:1}),
  snap(30,{completion:90,accuracy:80,questions:200,performance:80,learningNeed:25,risk:38,helpful:2})
]};
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
assert.equal(s.harmfulTotal,0);
assert.equal(s.helpfulTotal,3);
const md=markdown(s);assert.ok(md.includes('Gün 0 → Gün 30'));assert.ok(md.includes('Harmful checkpoint sonuçları: **0**'));
assert.throws(()=>summarizeCohort([p1,{...p2,participantId:'p-a'}]),/Aynı participantId/);
console.log('route-engine-pilot-cohort: aggregation and coverage tests passed');
