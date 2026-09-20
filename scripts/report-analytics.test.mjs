import assert from 'node:assert/strict';

await import('../public/report-analytics.js');
const A=globalThis.RotaReportAnalytics;
assert.ok(A,'RotaReportAnalytics must be exported');

const exam=(id,type,date,correct,wrong,total=100,penalty=4)=>({
  id,type,date,penalty,
  parts:[{label:'Toplam',total,correct,wrong}]
});

const space={
  logs:[
    {id:'l1',date:'2026-08-03',subjectId:'math',minutes:60,questions:30},
    {id:'l2',date:'2026-08-10',subjectId:'turkish',minutes:40,questions:20},
    {id:'l3',date:'2026-09-02',subjectId:'math',minutes:80,questions:40},
    {id:'l4',date:'2026-09-12',subjectId:'history',minutes:40,questions:15},
    {id:'l5',date:'2026-09-20',subjectId:'math',minutes:30,questions:10}
  ],
  plan:[
    {id:'p1',date:'2026-08-02',done:true},
    {id:'p2',date:'2026-08-07',done:true},
    {id:'p3',date:'2026-08-15',done:false},
    {id:'p4',date:'2026-09-01',done:true},
    {id:'p5',date:'2026-09-10',done:true},
    {id:'p6',date:'2026-09-20',done:false},
    {id:'p7',date:'2026-09-25',done:false}
  ],
  exams:[
    exam('e0','KPSS','2026-07-10',70,20),
    exam('e1','KPSS','2026-08-15',76,16),
    exam('e2','KPSS','2026-09-15',80,12),
    exam('t0','TYT','2026-07-20',72,16,120),
    exam('t1','TYT','2026-09-18',68,12,100)
  ]
};

assert.equal(A.addMonths('2026-01',-1),'2025-12');
assert.deepEqual(A.monthsBack('2026-09',3),['2026-07','2026-08','2026-09']);

const september=A.aggregateMonth(space,'2026-09',{today:'2026-09-20'});
assert.equal(september.partial,true);
assert.equal(september.minutes,150);
assert.equal(september.questions,65);
assert.equal(september.activeDays,3);
assert.equal(september.logCount,3);
assert.equal(september.plan.scheduled,3,'Future plan tasks in the current month must not count as due');
assert.equal(september.plan.done,2);
assert.equal(september.plan.future,1);
assert.equal(september.plan.completionRate,2/3);
assert.equal(september.subjects[0].subjectId,'math');
assert.equal(september.subjects[0].minutes,110);
assert.equal(september.subjects[0].questions,50);
assert.equal(september.weekly[0].minutes,80);
assert.equal(september.weekly[1].minutes,40);
assert.equal(september.weekly[2].minutes,30);

const kpss=september.examTypes.find(x=>x.type==='KPSS');
assert.ok(kpss);
assert.equal(kpss.count,1);
assert.equal(kpss.comparable,true);
assert.equal(kpss.previousDate,'2026-08-15');
assert.equal(kpss.delta,5,'Same-shape exam trend must compare net, not raw correct count');

const tyt=september.examTypes.find(x=>x.type==='TYT');
assert.ok(tyt);
assert.equal(tyt.comparable,false,'Different exam shapes must not be treated as directly comparable');
assert.equal(tyt.delta,null);
assert.equal(tyt.comparisonReason,'different_shape');

const comparison=A.compareMonth(space,'2026-09',{today:'2026-09-20'});
assert.equal(comparison.previous.month,'2026-08');
assert.equal(comparison.deltas.minutes.value,50);
assert.equal(comparison.deltas.questions.value,15);
assert.equal(comparison.deltas.activeDays.value,1);
assert.equal(comparison.deltas.planCompletion.known,true);
assert.equal(comparison.deltas.planCompletion.value,0);

const trend=A.longTerm(space,'2026-09',{today:'2026-09-20',months:6});
assert.deepEqual(trend.months,['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09']);
assert.equal(trend.evidence.monthsWithLogs,2);
assert.equal(trend.evidence.monthsWithPlan,2);
assert.equal(trend.evidence.studyTrendReady,true);
assert.equal(trend.evidence.planTrendReady,true);
assert.equal(trend.totals.minutes,250);
assert.equal(trend.totals.questions,115);
assert.equal(trend.subjects[0].subjectId,'math');
assert.equal(trend.subjects[0].minutes,170);

const longKpss=trend.examTypes.find(x=>x.type==='KPSS');
assert.equal(longKpss.count,3);
assert.equal(longKpss.comparable,true);
assert.equal(longKpss.delta,12);

const longTyt=trend.examTypes.find(x=>x.type==='TYT');
assert.equal(longTyt.count,2);
assert.equal(longTyt.comparable,false);
assert.equal(longTyt.delta,null,'Different shapes must remain non-comparable in the long-term view');

const empty=A.aggregateMonth({logs:[],plan:[],exams:[]},'2026-09',{today:'2026-09-20'});
assert.equal(empty.plan.completionRate,null);
assert.deepEqual(empty.subjects,[]);
assert.deepEqual(empty.examTypes,[]);

const sparse={
  logs:[{id:'s1',date:'2026-09-05',subjectId:'very-long-subject-name',minutes:35,questions:12}],
  plan:[],
  exams:[exam('s-e1','KPSS','2026-09-06',50,20)]
};
const sparseMonth=A.aggregateMonth(sparse,'2026-09',{today:'2026-09-20'});
assert.equal(sparseMonth.plan.completionRate,null,'No plan history must remain unknown, not 0%');
assert.equal(sparseMonth.examTypes.length,1);
assert.equal(sparseMonth.examTypes[0].comparisonReason,'no_previous','A single exam must not invent a comparison');
assert.equal(sparseMonth.examTypes[0].delta,null);

const sparseComparison=A.compareMonth(sparse,'2026-09',{today:'2026-09-20'});
for(const key of ['minutes','questions','activeDays']){
  assert.equal(sparseComparison.deltas[key].known,false,'Missing previous-month study evidence must keep '+key+' delta unknown');
  assert.equal(sparseComparison.deltas[key].value,null,'Missing previous-month study evidence must not fabricate a zero-baseline '+key+' delta');
  assert.equal(sparseComparison.deltas[key].reason,'missing_previous','Missing previous-month study evidence must be identified precisely for '+key);
}
assert.equal(sparseComparison.deltas.examCount.known,false,'A single current-month exam must not create an exam-count delta against missing evidence');
assert.equal(sparseComparison.deltas.examCount.value,null);
assert.equal(sparseComparison.deltas.examCount.reason,'missing_previous');

const previousOnly={
  logs:[{id:'p1',date:'2026-08-05',subjectId:'math',minutes:50,questions:20}],
  plan:[],
  exams:[exam('p-e1','KPSS','2026-08-06',55,20)]
};
const missingCurrent=A.compareMonth(previousOnly,'2026-09',{today:'2026-09-20'});
for(const key of ['minutes','questions','activeDays']){
  assert.equal(missingCurrent.deltas[key].known,false,'Missing current-month study evidence must keep '+key+' delta unknown');
  assert.equal(missingCurrent.deltas[key].value,null,'Missing current-month study evidence must not fabricate a negative delta for '+key);
  assert.equal(missingCurrent.deltas[key].reason,'missing_current','Missing current-month study evidence must be identified precisely for '+key);
}
assert.equal(missingCurrent.deltas.examCount.known,false);
assert.equal(missingCurrent.deltas.examCount.value,null);
assert.equal(missingCurrent.deltas.examCount.reason,'missing_current');

const missingBoth=A.compareMonth({logs:[],plan:[],exams:[]},'2026-09',{today:'2026-09-20'});
assert.equal(missingBoth.deltas.minutes.reason,'missing_both','Two empty months must expose missing_both rather than blaming the previous month');
assert.equal(missingBoth.deltas.examCount.reason,'missing_both');

const sparseTrend=A.longTerm(sparse,'2026-09',{today:'2026-09-20',months:6});
assert.equal(sparseTrend.evidence.monthsWithLogs,1);
assert.equal(sparseTrend.evidence.studyTrendReady,false,'One month of study data is not enough for a trend claim');
assert.equal(sparseTrend.evidence.monthsWithPlan,0);
assert.equal(sparseTrend.evidence.planTrendReady,false,'Missing plan history must not create a plan trend');
assert.equal(sparseTrend.evidence.monthsWithExams,1);
assert.equal(sparseTrend.evidence.examTrendReady,false,'One exam must not create an exam trend');
assert.equal(sparseTrend.examTypes[0].count,1);
assert.equal(sparseTrend.examTypes[0].comparable,false);
assert.equal(sparseTrend.examTypes[0].delta,null);

console.log('Report analytics passed: monthly evidence + sparse/empty states + partial month + plan adherence + separate comparable exam trends');
