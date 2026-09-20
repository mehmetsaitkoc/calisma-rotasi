import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');

function between(start,end){
  const a=html.indexOf(start),b=html.indexOf(end,a);
  assert.ok(a>=0&&b>a,`Missing source markers: ${start} -> ${end}`);
  return html.slice(a,b);
}
function dayAdd(d,n){
  const x=new Date(d+'T12:00:00Z');
  x.setUTCDate(x.getUTCDate()+n);
  return x.toISOString().slice(0,10);
}

const masterySignalSrc=between('function routeTopicMasterySignal','function routeMasteryScoreFromSignals');
function masterySignalFactory(space,stateObj){
  const R={topic:(_w,id)=>id==='t1'?{id:'t1',subjectId:'k-ma'}:null,dayAdd};
  const routePlanEvidenceDate=task=>{
    const logs=space.logs.filter(l=>l.sessionId===task.id).sort((a,b)=>b.date.localeCompare(a.date));
    return logs[0]?.date||task.date||'';
  };
  return new Function(
    'R','w','routeOutcomeSignal','routePracticeSignal','routePlanEvidenceDate',
    masterySignalSrc+';return routeTopicMasterySignal;'
  )(R,()=>space,()=>stateObj.outcome,()=>stateObj.practice,routePlanEvidenceDate);
}
const forgetFn=new Function(between('function routeForgettingProjection','function routeTopicForgettingSignal')+';return routeForgettingProjection;')();
const personalSrc=between('function routeAccuracyAcrossSamples','function routeEvidenceFreshness');
const personalApi=new Function(
  'w','routeAssessmentSamples','routeTopicPerformanceSamples',
  personalSrc+';return {routePersonalNormFromSamples,routeConfidenceCalibrationFromSignals};'
)(()=>({plan:[],logs:[]}),()=>[],()=>[]);
const studentFn=new Function(between('function routeConfidenceCalibrationFromSignals','function routeStudentModel(subjectId')+';return routeStudentModelFromSignals;')();
const riskFn=new Function(between('function routeExamRiskFromSignals','function routeTopicExamRisk')+';return routeExamRiskFromSignals;')();
const assessmentFn=new Function('w',between('function routeAssessmentSamples','function routeAssessmentWeakSkillSignal')+';return routeAssessmentSamples;');
const interventionEval=new Function(between('function routeEvaluateInterventionFromMetrics','function routeInterventionFollowup')+';return routeEvaluateInterventionFromMetrics;')();
const policySrc=between('function routeInterventionPolicyAdjustment','function routeInterventionBacktestCard');
const latestCycleSrc=between('function routeLatestBaseCycle','function routeTopicFrontier');

const failures=[];
let passed=0;
function journey(name,run,check){
  let result;
  try{
    result=run();
    check(result);
    passed++;
  }catch(error){
    failures.push({name,error:error.message,result});
  }
}
const S=(accuracy,answered=10)=>({accuracy,answered});
const baseStudent={
  practice:{known:true,sessions:4,answered:40,weightedAccuracy:.75,accuracy:.75},
  practiceLogCount:4,miniDays:2,latestDays:1,
  behavior:{known:true,total:4,completion:.85,friction:.05},
  outcome:{known:true,total:3},
  retention:{known:true,score:75},
  trend:{known:true,direction:'flat',delta:0},
  personalNorm:{known:true,direction:'flat',confidence:70,delta:0,label:'Kendi normaline yakın'},
  calibration:{known:false},
  skillWeakness:{known:false,weak:[],primary:null},
  weak:{ratio:.75,samples:2,freshness:1},
  adaptive:{mode:'steady'},openMistakes:0,difficultyKnown:true,
  errorMemory:{known:false,repeated:false,primary:null,total:0},
  velocity:{known:true,key:'steady',label:'Normal hızda oturuyor',confidence:70},
  attainmentRatio:.9
};

// J01 — actual work date anchors 3/7 reviews, and mastery waits for repeated evidence.
journey('J01 actual-date 3/7 mastery chain',()=>{
  const space={plan:[
    {id:'base',date:'2026-09-01',done:true,topicId:'t1',source:'curriculum'},
    {id:'r3',date:'2026-09-06',done:false,topicId:'t1',source:'spaced_review',reviewWave:3,reviewBaseTaskId:'base'},
    {id:'r7',date:'2026-09-10',done:false,topicId:'t1',source:'spaced_review',reviewWave:7,reviewBaseTaskId:'base'}
  ],logs:[{id:'base-log',sessionId:'base',date:'2026-09-03'}],mistakes:[]};
  const state={practice:{known:true,sessions:1,answered:10,weightedAccuracy:.90,accuracy:.90,recentAccuracy:.90},outcome:{known:false,total:0,recent:'',trend:0,stuckRate:0}};
  const mastery=masterySignalFactory(space,state),timeline=[];
  timeline.push({day:'09-03',m:mastery('t1')});
  space.plan.find(p=>p.id==='r3').done=true;
  timeline.push({day:'09-06',m:mastery('t1')});
  space.plan.find(p=>p.id==='r7').done=true;
  timeline.push({day:'09-10-one-evidence',m:mastery('t1')});
  state.practice={known:true,sessions:2,answered:25,weightedAccuracy:.85,accuracy:.85,recentAccuracy:.82};
  timeline.push({day:'09-10-two-evidence',m:mastery('t1')});
  return timeline;
},timeline=>{
  assert.equal(timeline[0].m.baseDate,'2026-09-03');
  assert.equal(timeline[0].m.review3,false);
  assert.equal(timeline[1].m.review3,true);
  assert.equal(timeline[1].m.review7,false);
  assert.equal(timeline[2].m.ready,false);
  assert.equal(timeline[3].m.ready,true);
});

// J02 — new learning cycle invalidates old open review waves.
journey('J02 new cycle kills old review wave',()=>{
  const space={plan:[
    {id:'old-base',date:'2026-09-01',done:true,topicId:'t1',source:'curriculum'},
    {id:'old-r3',date:'2026-09-04',done:false,topicId:'t1',source:'spaced_review',reviewWave:3,reviewBaseTaskId:'old-base'},
    {id:'new-base',date:'2026-09-18',done:true,topicId:'t1',source:'curriculum'}
  ],logs:[]};
  const routePlanEvidenceDate=p=>p.date;
  const api=new Function(
    'w','routePlanEvidenceDate','routeSubjectAdaptiveState','routeReviewAnchorDate','today','R','routeIsReviewLike',
    'routeReviewGoal','routeTaskGoal','routeRecoverySignal','routeBacklogDailyLimit','routeEffectiveDailyMinutes','routeStudyMethod',
    latestCycleSrc+';return {routeLatestBaseCycle,routeCandidateFromPlan};'
  )(
    ()=>space,routePlanEvidenceDate,()=>({mode:'steady'}),()=>'',()=> '2026-09-19',
    {dayAdd:(d,n)=>d,topic:()=>({title:'x'})},()=>true,()=>({minutes:20,questions:8,text:'x'}),
    ()=>({minutes:30,questions:10,text:'x'}),()=>({active:false}),()=>30,()=>120,()=>({label:'x'})
  );
  return {latest:api.routeLatestBaseCycle('t1'),oldCandidate:api.routeCandidateFromPlan(space.plan[1])};
},x=>{
  assert.equal(x.latest.task.id,'new-base');
  assert.equal(x.oldCandidate,null);
});

// J03 — unresolved mistake blocks mastery, resolving it releases the gate.
journey('J03 open mistake blocks then releases mastery',()=>{
  const space={plan:[
    {id:'base',date:'2026-09-01',done:true,topicId:'t1',source:'curriculum'},
    {id:'r3',date:'2026-09-04',done:true,topicId:'t1',source:'spaced_review',reviewWave:3,reviewBaseTaskId:'base'},
    {id:'r7',date:'2026-09-08',done:true,topicId:'t1',source:'spaced_review',reviewWave:7,reviewBaseTaskId:'base'}
  ],logs:[],mistakes:[{id:'e1',topicId:'t1',resolved:false}]};
  const state={practice:{known:true,sessions:3,answered:35,weightedAccuracy:.88,accuracy:.88,recentAccuracy:.86},outcome:{known:false,total:0}};
  const mastery=masterySignalFactory(space,state),blocked=mastery('t1');
  space.mistakes[0].resolved=true;
  return {blocked,released:mastery('t1')};
},x=>{
  assert.equal(x.blocked.ready,false);
  assert.equal(x.blocked.next,'Açık yanlışı çöz');
  assert.equal(x.released.ready,true);
});

// J04 — forgetting decays monotonically, eventually asks for refresh, then resets after new evidence.
journey('J04 forgetting lifecycle and refresh reset',()=>{
  const timeline=[0,7,21,45,70].map(days=>({days,...forgetFn({mastery:88,daysSince:days,stabilityDays:24})}));
  return {timeline,afterRefresh:forgetFn({mastery:82,daysSince:0,stabilityDays:24})};
},x=>{
  assert.equal(x.timeline[0].reviewDue,false);
  assert.ok(x.timeline.some(v=>v.reviewDue));
  for(let i=1;i<x.timeline.length;i++)assert.ok(x.timeline[i].retained<=x.timeline[i-1].retained);
  assert.equal(x.afterRefresh.reviewDue,false);
});

// J05 — rolling personal norm learns both improvement and meaningful later decline.
journey('J05 rolling personal norm learns improvement then decline',()=>{
  const improving=personalApi.routePersonalNormFromSamples([S(.42),S(.50),S(.58),S(.62),S(.66),S(.69),S(.76),S(.80)],[]);
  const declining=personalApi.routePersonalNormFromSamples([S(.62),S(.66),S(.70),S(.74),S(.78),S(.80),S(.60),S(.56)],[]);
  return {improving,declining};
},x=>{
  assert.equal(x.improving.direction,'up');
  assert.equal(x.declining.direction,'down');
  assert.ok(x.improving.baselineSamples<=6&&x.declining.baselineSamples<=6);
});

// J06 — confidence matures with diverse evidence, but fresh contradiction lowers it more than stale contradiction.
journey('J06 confidence matures with evidence but respects conflict',()=>{
  const day1=personalApi.routeConfidenceCalibrationFromSignals({rawConfidence:80,sourceCount:1,practiceAccuracy:80});
  const day5=personalApi.routeConfidenceCalibrationFromSignals({rawConfidence:82,sourceCount:4,practiceAccuracy:80,examAccuracy:78,examFreshness:1});
  const conflict=personalApi.routeConfidenceCalibrationFromSignals({rawConfidence:82,sourceCount:4,practiceAccuracy:90,examAccuracy:50,examFreshness:1});
  const staleConflict=personalApi.routeConfidenceCalibrationFromSignals({rawConfidence:82,sourceCount:4,practiceAccuracy:90,examAccuracy:50,examFreshness:.35});
  return {day1,day5,conflict,staleConflict};
},x=>{
  assert.ok(x.day1.confidence<=35);
  assert.ok(x.day5.confidence>x.day1.confidence);
  assert.ok(x.conflict.confidence<x.day5.confidence);
  assert.ok(x.staleConflict.confidence>x.conflict.confidence);
});

// J07 — progression is withheld on a single evidence family and unlocked after corroboration.
journey('J07 progression waits for corroboration',()=>{
  const day2=studentFn({
    practice:{known:true,sessions:4,answered:45,weightedAccuracy:.88,accuracy:.88},
    practiceLogCount:4,miniDays:0,latestDays:1,
    behavior:{known:false,total:0},outcome:{known:false,total:0},retention:{known:false,score:null},
    trend:{known:false,direction:'unknown'},
    personalNorm:{known:true,direction:'up',confidence:70,delta:.15,label:'Kendi normalinin üstünde'},
    calibration:{known:false},skillWeakness:{known:false,weak:[]},weak:null,adaptive:{mode:'steady'},
    openMistakes:0,difficultyKnown:false,errorMemory:{known:false},velocity:{known:false}
  });
  const day6=studentFn({...baseStudent,
    practice:{known:true,sessions:4,answered:45,weightedAccuracy:.88,accuracy:.88},
    personalNorm:{known:true,direction:'up',confidence:70,delta:.15,label:'Kendi normalinin üstünde'},
    weak:{ratio:.84,samples:2,freshness:1},retention:{known:true,score:82}
  });
  return {day2,day6};
},x=>{
  assert.notEqual(x.day2.state,'progress');
  assert.match(x.day2.nextAction,/ikinci bir kanıt türü/);
  assert.equal(x.day6.state,'progress');
});

// J08 — hidden gap can recover after later objective evidence improves.
journey('J08 hidden gap can recover after new evidence',()=>{
  const day1=studentFn({...baseStudent,
    practice:{known:true,sessions:3,answered:30,weightedAccuracy:.45,accuracy:.45},
    adaptive:{mode:'repair'},calibration:{known:true,hiddenGap:2},
    personalNorm:{known:true,direction:'down',confidence:65,delta:-.15,label:'Kendi normalinin altında'}
  });
  const day7=studentFn({...baseStudent,
    practice:{known:true,sessions:4,answered:45,weightedAccuracy:.82,accuracy:.82},
    adaptive:{mode:'steady'},calibration:{known:true,alignedStrong:2},
    personalNorm:{known:true,direction:'up',confidence:70,delta:.12,label:'Kendi normalinin üstünde'},
    retention:{known:true,score:80},weak:{ratio:.80,samples:2,freshness:1}
  });
  return {day1,day7};
},x=>{
  assert.equal(x.day1.state,'repair');
  assert.notEqual(x.day7.state,'repair');
  assert.ok(x.day7.learningNeed<x.day1.learningNeed);
});

// J09 — target countdown raises urgency for weakness but does not turn a strong completed topic into high risk.
journey('J09 target countdown raises urgency without hijacking strong topics',()=>{
  const weak=[180,90,45,21,14].map(days=>riskFn({confidence:85,masteryScore:50,retained:48,learningNeed:70,daysToTarget:days,status:1,trend:'flat',examWeakRatio:.60,examFreshness:1}));
  const strong=[180,90,45,21,14].map(days=>riskFn({confidence:90,masteryScore:90,retained:88,learningNeed:15,daysToTarget:days,status:2,trend:'up',examWeakRatio:.90,examFreshness:1}));
  const noTarget=riskFn({confidence:85,masteryScore:50,retained:48,learningNeed:70,daysToTarget:null,status:1});
  return {weak,strong,noTarget};
},x=>{
  assert.equal(x.noTarget.urgency,0);
  for(let i=1;i<x.weak.length;i++)assert.ok(x.weak[i].score>=x.weak[i-1].score);
  assert.ok(x.strong.every(r=>r.score<40));
});

// J10 — stale weak exam evidence loses risk influence over time.
journey('J10 stale exam weak signal fades over time',()=>{
  const fresh=riskFn({confidence:85,masteryScore:55,retained:55,learningNeed:65,daysToTarget:30,status:1,examWeakRatio:.45,examFreshness:1});
  const mid=riskFn({confidence:85,masteryScore:55,retained:55,learningNeed:65,daysToTarget:30,status:1,examWeakRatio:.45,examFreshness:.55});
  const stale=riskFn({confidence:85,masteryScore:55,retained:55,learningNeed:65,daysToTarget:30,status:1,examWeakRatio:.45,examFreshness:.35});
  return {fresh,mid,stale};
},x=>{
  assert.ok(x.fresh.score>x.mid.score);
  assert.ok(x.mid.score>=x.stale.score);
});

// J11 — one harmful intervention does not change policy; repeated outcomes may.
journey('J11 intervention learning waits for repeated outcomes',()=>{
  const effects=[
    {known:true,total:1,score:-1},
    {known:true,total:2,score:-1},
    {known:true,total:4,score:.10},
    {known:true,total:4,score:.50}
  ];
  let i=0;
  const policy=new Function('routeInterventionEffectSignal',policySrc+';return routeInterventionPolicyAdjustment;')(()=>effects[i++]);
  return {
    first:policy('s','t','repair'),
    second:policy('s','t','repair'),
    mixed:policy('s','t','repair'),
    helpful:policy('s','t','repair'),
    evalHelpful:interventionEval({mode:'repair',baselineAccuracy:50},{age:4,performance:{known:true,accuracy:.70},behavior:{known:false}})
  };
},x=>{
  assert.equal(x.first.action,'hold');
  assert.equal(x.second.action,'change');
  assert.equal(x.mixed.action,'hold');
  assert.equal(x.helpful.action,'repeat');
  assert.equal(x.evalHelpful.status,'helpful');
});

// J12 — same-day mini retakes count once; a new day contributes a new measurement.
journey('J12 same-day mini retakes count once, next-day adds evidence',()=>{
  const space={assessments:[
    {id:'a1',miniId:'m',date:'2026-09-19',subjectId:'k-ma',topicId:'t1',correct:2,wrong:8,created:1},
    {id:'a2',miniId:'m',date:'2026-09-19',subjectId:'k-ma',topicId:'t1',correct:8,wrong:2,created:2}
  ]};
  const fn=assessmentFn(()=>space),day1=fn('k-ma','t1');
  space.assessments.push({id:'a3',miniId:'m',date:'2026-09-20',subjectId:'k-ma',topicId:'t1',correct:7,wrong:3,created:3});
  return {day1,day2:fn('k-ma','t1')};
},x=>{
  assert.equal(x.day1.length,1);
  assert.match(x.day1[0].id,/a2/);
  assert.equal(x.day2.length,2);
});

if(failures.length)console.error('Longitudinal route-engine failures:',JSON.stringify(failures,null,2));
assert.equal(failures.length,0,`${failures.length} longitudinal journeys failed`);
assert.equal(passed,12,'Expected exactly 12 longitudinal journeys');
console.log(`route-engine-longitudinal: ${passed} multi-day learning journeys passed`);
