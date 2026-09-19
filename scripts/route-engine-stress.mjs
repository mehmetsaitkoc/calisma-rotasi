import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');

function between(start,end){
  const a=html.indexOf(start),b=html.indexOf(end,a);
  assert.ok(a>=0&&b>a,`Missing source markers: ${start} -> ${end}`);
  return html.slice(a,b);
}

const personalSrc=between('function routeAccuracyAcrossSamples','function routeEvidenceFreshness');
const personalApi=new Function('w','routeAssessmentSamples','routeTopicPerformanceSamples',personalSrc+';return {routePersonalNormFromSamples,routeConfidenceCalibrationFromSignals};')(
  ()=>({plan:[],logs:[]}),()=>[],()=>[]
);
const studentSrc=between('function routeConfidenceCalibrationFromSignals','function routeStudentModel(subjectId');
const studentFn=new Function(studentSrc+';return routeStudentModelFromSignals;')();
const riskFn=new Function(between('function routeExamRiskFromSignals','function routeTopicExamRisk')+';return routeExamRiskFromSignals;')();
const masteryFn=new Function(between('function routeMasteryScoreFromSignals','function routeTopicLatestEvidenceDate')+';return routeMasteryScoreFromSignals;')();
const forgetFn=new Function(between('function routeForgettingProjection','function routeTopicForgettingSignal')+';return routeForgettingProjection;')();
const interventionEval=new Function(between('function routeEvaluateInterventionFromMetrics','function routeInterventionFollowup')+';return routeEvaluateInterventionFromMetrics;')();

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
const student=(overrides={})=>studentFn({...baseStudent,...overrides});
const S=(accuracy,answered=10)=>({accuracy,answered});

const failures=[];
let passed=0;
function profile(name,run,check){
  let result;
  try{
    result=run();
    check(result);
    passed++;
  }catch(error){
    failures.push({name,error:error.message,result});
  }
}

// 30 synthetic student profiles.
// 01 — one bad mini must reveal need without pretending certainty.
profile('P01 one bad mini',()=>studentFn({
  practice:{known:true,sessions:1,answered:10,weightedAccuracy:.30,accuracy:.30},
  miniDays:1,practiceLogCount:0,latestDays:0,
  behavior:{known:false,total:0},outcome:{known:false,total:0},
  retention:{known:false,score:null},trend:{known:false,direction:'unknown'},
  personalNorm:{known:false},calibration:{known:false},
  skillWeakness:{known:true,weak:[{missed:7}],primary:{skill:'Yüzde'}},
  adaptive:{mode:'repair'},openMistakes:0,difficultyKnown:false,errorMemory:{known:false},velocity:{known:false}
}),m=>{
  assert.equal(m.state,'collect');
  assert.ok(m.learningNeed>=60);
  assert.ok(m.confidence<25);
  assert.equal(m.priorityBoost,0);
});

// 02 — one perfect mini must not create a progression verdict.
profile('P02 one perfect mini',()=>studentFn({
  practice:{known:true,sessions:1,answered:10,weightedAccuracy:1,accuracy:1},
  miniDays:1,practiceLogCount:0,latestDays:0,
  behavior:{known:false,total:0},outcome:{known:false,total:0},
  retention:{known:false,score:null},trend:{known:false,direction:'unknown'},
  personalNorm:{known:false},calibration:{known:false},skillWeakness:{known:false,weak:[]},
  adaptive:{mode:'steady'},openMistakes:0,difficultyKnown:false,errorMemory:{known:false},velocity:{known:false}
}),m=>{
  assert.equal(m.state,'collect');
  assert.ok(m.confidence<25);
});

// 03 — hard-feeling but high-accuracy work is productive struggle, not failure.
profile('P03 productive struggle',()=>student({
  practice:{known:true,sessions:3,answered:30,weightedAccuracy:.90,accuracy:.90},
  weak:null,miniDays:0,calibration:{known:true,productiveStruggle:2},
  personalNorm:{known:true,direction:'flat',confidence:65,delta:0,label:'Kendi normaline yakın'}
}),m=>{
  assert.notEqual(m.state,'repair');
  assert.match(m.calibrationLabel,/Efor yüksek, performans güçlü/);
});

// 04 — comfortable-feeling low accuracy must remain repair-oriented.
profile('P04 hidden gap',()=>student({
  practice:{known:true,sessions:3,answered:30,weightedAccuracy:.45,accuracy:.45},
  adaptive:{mode:'repair'},calibration:{known:true,hiddenGap:2},
  personalNorm:{known:true,direction:'down',confidence:65,delta:-.15,label:'Kendi normalinin altında'}
}),m=>assert.equal(m.state,'repair'));

// 05 — strong accuracy with poor completion should shrink dose, not raise difficulty.
profile('P05 low completion high accuracy',()=>student({
  practice:{known:true,sessions:4,answered:40,weightedAccuracy:.84,accuracy:.84},
  behavior:{known:true,total:5,completion:.35,friction:.5},attainmentRatio:.45,adaptive:{mode:'ease'}
}),m=>{
  assert.equal(m.state,'sustainable');
  assert.ok(m.execution<60);
});

// 06 — same absolute score can mean progress when above personal norm.
profile('P06 personal improvement',()=>student({
  practice:{known:true,sessions:4,answered:40,weightedAccuracy:.76,accuracy:.76},
  personalNorm:{known:true,direction:'up',confidence:70,delta:.15,label:'Kendi normalinin üstünde'},
  trend:{known:true,direction:'flat',delta:0}
}),m=>{
  assert.equal(m.state,'progress');
  assert.ok(m.learningNeed<20);
});

// 07 — same absolute score can mean regression when below personal norm.
profile('P07 personal decline',()=>student({
  practice:{known:true,sessions:4,answered:40,weightedAccuracy:.76,accuracy:.76},
  personalNorm:{known:true,direction:'down',confidence:70,delta:-.15,label:'Kendi normalinin altında'},
  trend:{known:true,direction:'flat',delta:0}
}),m=>{
  assert.notEqual(m.state,'progress');
});

// 08 — a single session cannot define the personal norm.
profile('P08 single session norm',()=>personalApi.routePersonalNormFromSamples([S(.90)],[S(.55),S(.60),S(.65)]),n=>{
  assert.equal(n.known,false);
});

// 09 — short topic history may fall back to the student's same-subject history.
profile('P09 subject fallback norm',()=>personalApi.routePersonalNormFromSamples([S(.72),S(.76)],[S(.58),S(.61),S(.63),S(.60)]),n=>{
  assert.equal(n.known,true);
  assert.equal(n.scope,'subject');
  assert.equal(n.direction,'up');
});

// 10 — one evidence family may show a rise but cannot validate progression.
profile('P10 single-family rise',()=>studentFn({
  practice:{known:true,sessions:4,answered:45,weightedAccuracy:.88,accuracy:.88},
  practiceLogCount:4,miniDays:0,latestDays:1,
  behavior:{known:false,total:0},outcome:{known:false,total:0},retention:{known:false,score:null},
  trend:{known:false,direction:'unknown'},personalNorm:{known:true,direction:'up',confidence:70,delta:.15,label:'Kendi normalinin üstünde'},
  calibration:{known:false},skillWeakness:{known:false,weak:[]},weak:null,adaptive:{mode:'steady'},openMistakes:0,
  difficultyKnown:false,errorMemory:{known:false},velocity:{known:false}
}),m=>{
  assert.equal(m.sourceCount,1);
  assert.notEqual(m.state,'progress');
  assert.match(m.nextAction,/ikinci bir kanıt türü/);
});

// 11 — corroborated rise may validate progression.
profile('P11 corroborated rise',()=>student({
  practice:{known:true,sessions:4,answered:45,weightedAccuracy:.88,accuracy:.88},
  personalNorm:{known:true,direction:'up',confidence:70,delta:.15,label:'Kendi normalinin üstünde'},
  weak:{ratio:.84,samples:2,freshness:1},retention:{known:true,score:82}
}),m=>{
  assert.equal(m.state,'progress');
  assert.ok(m.confidence>=45);
  assert.ok(m.sourceCount>=2);
});

// 12 — fresh contradictory exam evidence must reduce confidence.
profile('P12 fresh contradiction',()=>student({
  practice:{known:true,sessions:4,answered:40,weightedAccuracy:.88,accuracy:.88},
  weak:{ratio:.50,samples:2,freshness:1}
}),m=>{
  assert.ok(m.confidence<m.rawConfidence);
  assert.ok(m.confidenceCalibration.disagreementPenalty>=12);
});

// 13 — stale contradictory exam evidence must be discounted.
profile('P13 stale contradiction',()=>{
  const fresh=student({practice:{known:true,sessions:4,answered:40,weightedAccuracy:.88,accuracy:.88},weak:{ratio:.50,samples:2,freshness:1}});
  const stale=student({practice:{known:true,sessions:4,answered:40,weightedAccuracy:.88,accuracy:.88},weak:{ratio:.50,samples:2,freshness:.35}});
  return {fresh,stale};
},x=>{
  assert.ok(x.stale.confidence>x.fresh.confidence);
  assert.ok(x.stale.confidenceCalibration.disagreementPenalty<x.fresh.confidenceCalibration.disagreementPenalty);
});

// 14 — old evidence must reduce confidence even when historic scores were strong.
profile('P14 stale evidence confidence',()=>{
  const fresh=student({latestDays:1});
  const stale=student({latestDays:45});
  return {fresh,stale};
},x=>assert.ok(x.stale.confidence<x.fresh.confidence));

// 15 — two unresolved mistakes must become an explicit repair state.
profile('P15 two open mistakes',()=>student({
  practice:{known:true,sessions:4,answered:40,weightedAccuracy:.90,accuracy:.90},openMistakes:2
}),m=>{
  assert.equal(m.state,'repair');
  assert.equal(m.label,'AÇIK YANLIŞ ÖNCELİĞİ');
  assert.match(m.nextAction,/2 açık yanlışı/);
});

// 16 — one unresolved mistake must be acknowledged without overreacting.
profile('P16 one open mistake',()=>student({
  practice:{known:true,sessions:4,answered:40,weightedAccuracy:.90,accuracy:.90},openMistakes:1
}),m=>{
  assert.notEqual(m.state,'progress');
  assert.match(m.nextAction,/tek açık yanlışı/);
});

// 17 — repeated historical error pattern must affect the next action even with good scores.
profile('P17 repeated error pattern',()=>student({
  practice:{known:true,sessions:4,answered:40,weightedAccuracy:.90,accuracy:.90},
  errorMemory:{known:true,repeated:true,primary:{label:'İşlem',count:4},total:4}
}),m=>{
  assert.notEqual(m.state,'progress');
  assert.match(m.nextAction,/tekrarlayan/);
});

// 18 — low retention must take precedence over adding difficulty.
profile('P18 retention gap',()=>student({
  retention:{known:true,score:48},
  personalNorm:{known:true,direction:'up',confidence:70,delta:.12,label:'Kendi normalinin üstünde'}
}),m=>assert.equal(m.state,'retention'));

// 19 — slow topic velocity may raise need relative to fast velocity, but only boundedly.
profile('P19 learning velocity',()=>{
  const fast=student({velocity:{known:true,key:'fast',label:'Hızlı oturuyor',confidence:80}});
  const slow=student({velocity:{known:true,key:'slow',label:'Daha fazla temas istiyor',confidence:80}});
  return {fast,slow};
},x=>{
  assert.ok(x.slow.learningNeed>x.fast.learningNeed);
  assert.ok(x.slow.learningNeed-x.fast.learningNeed<=10);
});

// 20 — strong stable evidence should not be mislabeled repair.
profile('P20 strong stable',()=>student({
  practice:{known:true,sessions:4,answered:45,weightedAccuracy:.88,accuracy:.88},
  retention:{known:true,score:88},personalNorm:{known:true,direction:'flat',confidence:75,delta:0,label:'Kendi normaline yakın'}
}),m=>assert.notEqual(m.state,'repair'));

// 21 — repeated weak multi-source evidence must reach repair with real confidence.
profile('P21 repeated weakness',()=>student({
  practice:{known:true,sessions:4,answered:55,weightedAccuracy:.52,accuracy:.54},
  behavior:{known:true,total:5,completion:.8,friction:.1},outcome:{known:true,total:4},
  retention:{known:true,score:55},trend:{known:true,direction:'down',delta:-.10},
  personalNorm:{known:true,direction:'down',confidence:72,delta:-.12,label:'Kendi normalinin altında'},
  skillWeakness:{known:true,weak:[{missed:4},{missed:2}],primary:{skill:'Oran-orantı'}},
  weak:{ratio:.50,samples:2,freshness:1},adaptive:{mode:'repair'},openMistakes:2
}),m=>{
  assert.equal(m.state,'repair');
  assert.ok(m.confidence>55);
  assert.match(m.nextAction,/açık yanlış|Oran-orantı|onar/i);
});

// 22 — low confidence weakness must not dominate scheduler priority.
profile('P22 low confidence priority',()=>studentFn({
  practice:{known:true,sessions:1,answered:10,weightedAccuracy:.30,accuracy:.30},miniDays:1,practiceLogCount:0,latestDays:0,
  behavior:{known:false,total:0},outcome:{known:false,total:0},retention:{known:false,score:null},trend:{known:false,direction:'unknown'},
  personalNorm:{known:false},calibration:{known:false},skillWeakness:{known:true,weak:[{missed:7}],primary:{skill:'Yüzde'}},
  adaptive:{mode:'repair'},openMistakes:0,difficultyKnown:false,errorMemory:{known:false},velocity:{known:false}
}),m=>{
  assert.equal(m.priorityBoost,0);
  assert.equal(m.state,'collect');
});

// 23 — missing target date must never invent urgency.
profile('P23 no target date risk',()=>riskFn({
  confidence:85,masteryScore:42,retained:38,learningNeed:78,daysToTarget:null,openMistakes:0,
  trend:'flat',examWeakRatio:.60,examFreshness:1,status:1
}),r=>assert.equal(r.urgency,0));

// 24 — repeated fresh weakness near exam should become materially risky.
profile('P24 urgent weak risk',()=>riskFn({
  confidence:85,masteryScore:42,retained:38,learningNeed:78,daysToTarget:15,openMistakes:2,
  trend:'down',examWeakRatio:.48,examFreshness:1,subjectPriority:true,forgettingDue:true,paceStatus:'overload',status:1
}),r=>{
  assert.ok(r.score>=82);
  assert.equal(r.action,'Açık yanlışları kapat ve kısa doğrulama yap.');
});

// 25 — low-confidence risk must stay capped and unable to boost.
profile('P25 low confidence risk',()=>riskFn({
  confidence:10,masteryScore:20,retained:20,learningNeed:90,daysToTarget:15,status:0
}),r=>{
  assert.ok(r.score<=55);
  assert.equal(r.priorityBoost,0);
});

// 26 — a genuinely strong completed topic should stay low risk even near exam.
profile('P26 strong completed risk',()=>riskFn({
  confidence:90,masteryScore:90,retained:88,learningNeed:15,daysToTarget:15,status:2,
  trend:'up',examWeakRatio:.90,examFreshness:1
}),r=>assert.ok(r.score<40));

// 27 — stale weak exam evidence must contribute less risk than fresh weak evidence.
profile('P27 stale exam risk',()=>{
  const fresh=riskFn({confidence:85,masteryScore:55,retained:55,learningNeed:65,daysToTarget:30,status:1,examWeakRatio:.45,examFreshness:1});
  const stale=riskFn({confidence:85,masteryScore:55,retained:55,learningNeed:65,daysToTarget:30,status:1,examWeakRatio:.45,examFreshness:.35});
  return {fresh,stale};
},x=>assert.ok(x.stale.score<x.fresh.score));

// 28 — open mistakes should determine the risk action.
profile('P28 risk open mistake action',()=>riskFn({
  confidence:80,masteryScore:65,retained:62,learningNeed:55,daysToTarget:45,status:1,openMistakes:1
}),r=>assert.match(r.action,/Açık yanlış/));

// 29 — forgetting due should determine the action when mistakes are closed.
profile('P29 risk forgetting action',()=>riskFn({
  confidence:80,masteryScore:70,retained:58,learningNeed:45,daysToTarget:45,status:2,openMistakes:0,forgettingDue:true
}),r=>assert.match(r.action,/koruma tekrarı/));

// 30 — same raw performance must be interpreted differently by personal baseline.
profile('P30 same score different student',()=>{
  const up=student({practice:{known:true,sessions:4,answered:40,weightedAccuracy:.76,accuracy:.76},personalNorm:{known:true,direction:'up',confidence:70,delta:.15,label:'Kendi normalinin üstünde'},trend:{known:true,direction:'flat'}});
  const down=student({practice:{known:true,sessions:4,answered:40,weightedAccuracy:.76,accuracy:.76},personalNorm:{known:true,direction:'down',confidence:70,delta:-.15,label:'Kendi normalinin altında'},trend:{known:true,direction:'flat'}});
  return {up,down};
},x=>{
  assert.ok(x.up.learningNeed<x.down.learningNeed);
  assert.equal(x.up.performance,x.down.performance);
});

// Marginal adaptive repair at the exact threshold must not create a one-day mode flip without stronger corroboration.
{
  const marginal=student({
    practice:{known:true,sessions:4,answered:40,weightedAccuracy:.64,accuracy:.64},
    retention:{known:true,score:84},
    adaptive:{mode:'repair',repairScore:3},
    openMistakes:0,
    personalNorm:{known:true,direction:'flat',confidence:70,delta:0,label:'Kendi normaline yakın'},
    trend:{known:true,direction:'flat',delta:0}
  });
  assert.notEqual(marginal.state,'repair','Repair score 3 alone should stay inside the hysteresis deadband');

  const confirmed=student({
    practice:{known:true,sessions:4,answered:40,weightedAccuracy:.64,accuracy:.64},
    retention:{known:true,score:84},
    adaptive:{mode:'repair',repairScore:4},
    openMistakes:0,
    personalNorm:{known:true,direction:'flat',confidence:70,delta:0,label:'Kendi normaline yakın'},
    trend:{known:true,direction:'flat',delta:0}
  });
  assert.equal(confirmed.state,'repair','Repair score 4 should still enter repair when evidence is corroborated');
}

// Cross-cutting mastery, forgetting, intervention, and scheduler invariants.
{
  const oneStrong=masteryFn({base:true,review3:true,review7:true,hasEvidence:false,ready:false,performanceAccuracy:96,retentionScore:92,trend:'up',openMistakes:0,skillMissed:0,errorRepeated:false});
  const openMistake=masteryFn({base:true,review3:true,review7:true,hasEvidence:true,ready:false,performanceAccuracy:94,retentionScore:94,trend:'up',openMistakes:1,skillMissed:0,errorRepeated:false});
  const ready=masteryFn({base:true,review3:true,review7:true,hasEvidence:true,ready:true,performanceAccuracy:88,retentionScore:86,trend:'up',openMistakes:0,skillMissed:0,errorRepeated:false});
  assert.ok(oneStrong.score<=68,'A single strong session cannot inflate mastery');
  assert.ok(openMistake.score<=68,'Open mistakes cap mastery');
  assert.ok(ready.score>=82,'Ready mastery must remain strong');

  const fresh=forgetFn({mastery:88,daysSince:2,stabilityDays:24});
  const old=forgetFn({mastery:88,daysSince:70,stabilityDays:24});
  assert.equal(fresh.reviewDue,false,'Fresh strong evidence must not refresh immediately');
  assert.equal(old.reviewDue,true,'Very old evidence should eventually request refresh');

  const evalOne=interventionEval({mode:'repair',baselineAccuracy:70},{age:4,performance:{known:true,accuracy:.55},behavior:{known:false}});
  assert.equal(evalOne.status,'harmful');

  const policySrc=between('function routeInterventionPolicyAdjustment','function routeInterventionBacktestCard');
  const effects=[{known:true,total:1,score:-1},{known:true,total:3,score:-.67},{known:true,total:4,score:.10},{known:true,total:4,score:.50}];
  let i=0;
  const policy=new Function('routeInterventionEffectSignal',policySrc+';return routeInterventionPolicyAdjustment;')(()=>effects[i++]);
  assert.equal(policy('s','t','repair').action,'hold','One bad backtest cannot switch strategy');
  assert.equal(policy('s','t','repair').action,'change','Repeated harmful backtests may change strategy');
  assert.equal(policy('s','t','repair').action,'hold','Mixed evidence must not overfit');
  assert.equal(policy('s','t','repair').action,'repeat','Repeated helpful outcomes may preserve the core method');
}

{
  const rebalance=between('function routeRebalance','function routeAutoSync');
  const build=between('function routeBuildCandidates','function routeConsistencySignal');
  assert.ok(rebalance.includes('quantCeiling=day.quantHeavyLimit+(critical?1:0)'),'Quantitative-heavy hard cap must remain');
  assert.ok(rebalance.includes('if(quantHeavy&&day.quantHeavy>=quantCeiling)return false'),'Relaxation cannot bypass quantitative cap');
  assert.ok(build.includes('riskBoost=recovery.active?0:risk.priorityBoost'),'Recovery disables risk promotion');
  assert.ok(build.indexOf('topics=routeTopicFrontier')<build.indexOf('routeTopicExamRisk(t.subjectId,t.id,student,riskContext)'),'Frontier selection happens before risk ranking');
  assert.ok(build.includes("seenTopics.has(t.id)||seenKeys.has(key)"),'Refresh work coalesces with existing same-topic work');

  const miniSrc=between('function routeMiniRepairSignals','function routeBuildCandidates');
  const space={assessments:[
    {id:'old',miniId:'m1',date:'2026-09-19',subjectId:'k-ma',topicId:'t1',correct:2,wrong:8,created:1},
    {id:'new',miniId:'m1',date:'2026-09-19',subjectId:'k-ma',topicId:'t1',correct:8,wrong:2,created:2}
  ]};
  const R={dayAdd:()=> '2026-09-12',topic:(_w,id)=>id==='t1'?{id}:null};
  const mini=new Function('w','R','today','routeSubjectAdaptiveState','routeStudentModel',miniSrc+';return routeMiniRepairSignals;')(
    ()=>space,R,()=> '2026-09-19',()=>({mode:'repair',skillWeakness:{primary:null}}),()=>({state:'repair',confidence:80})
  );
  const signals=mini();
  assert.equal(signals.length,1,'Same-day mini retakes count once for repair');
  assert.equal(signals[0].assessment.id,'new','Newest same-day attempt wins');
}

if(failures.length){
  console.error('Synthetic route-engine stress failures:',JSON.stringify(failures,null,2));
}
assert.equal(failures.length,0,`${failures.length} synthetic student profiles failed`);
assert.equal(passed,30,'Expected exactly 30 synthetic student profiles');
console.log(`route-engine-stress: ${passed} synthetic profiles + mastery/forgetting/intervention/scheduler invariants passed`);
