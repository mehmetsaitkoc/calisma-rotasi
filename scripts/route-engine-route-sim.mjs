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
const TODAY='2026-09-19',today=()=>TODAY;
const buildSrc=between('function routeTopicFrontier','function routeConsistencySignal');
const rebalanceSrc=between('function routeRebalance','function routeAutoSync');

let uid=0;
const defaultCatalog=()=>[
  {id:'m1',subjectId:'k-ma',title:'Temel kavramlar'},
  {id:'m2',subjectId:'k-ma',title:'Problemler'},
  {id:'m3',subjectId:'k-ma',title:'Oran orantı'},
  {id:'m4',subjectId:'k-ma',title:'Sayı problemleri'},
  {id:'t1',subjectId:'k-tr',title:'Paragraf'},
  {id:'t2',subjectId:'k-tr',title:'Dil bilgisi'},
  {id:'h1',subjectId:'k-ta',title:'İlk Türk devletleri'},
  {id:'h2',subjectId:'k-ta',title:'Osmanlı kuruluş'},
  {id:'c1',subjectId:'k-co',title:'Harita bilgisi'}
];
const subjectDefs=[
  {id:'k-ma',name:'Matematik'},
  {id:'k-tr',name:'Türkçe'},
  {id:'k-ta',name:'Tarih'},
  {id:'k-co',name:'Coğrafya'},
  {id:'t-fi',name:'Fizik'},
  {id:'t-ki',name:'Kimya'}
];

function baseSpace(limit=120){
  return {
    configured:true,
    settings:{days:[0,1,2,3,4,5,6],dailyMinutes:limit,priorities:[]},
    profile:{},topicState:{},plan:[],logs:[],mistakes:[],assessments:[],route:{decisions:[]},
    taskEvents:[],exams:[]
  };
}
function makeBuild(space,opts={}){
  const catalog=opts.catalog||defaultCatalog();
  const R={
    dayAdd,
    uid:()=>`u${++uid}`,
    topic:(_sp,id)=>catalog.find(t=>t.id===id)||null,
    allTopics:()=>catalog
  };
  const state={activeExam:'kpss'};
  const subjects=()=>subjectDefs.filter(s=>catalog.some(t=>t.subjectId===s.id));
  const routeProfileSignal=id=>opts.profile?.[id]||{level:2,label:'Orta',boost:0,goalBoost:0};
  const routeExamWeakness=()=>opts.weak||{};
  const routeRecoverySignal=()=>opts.recovery||{active:false,severe:false};
  const routeCandidateFromPlan=p=>{
    const base={
      ...p,
      earliest:p.earliest||TODAY,
      routeKey:p.routeKey||('plan:'+p.id),
      source:p.source||'curriculum',
      priority:Number.isFinite(p.priority)?p.priority:35,
      minutes:p.minutes||30,
      targetQuestions:p.targetQuestions||10,
      taskGoal:p.taskGoal||'çalış'
    };
    if(base.reviewVariant==='challenge'){
      const recovery=opts.recovery||{active:false,severe:false},student=opts.students?.[p.topicId]||{state:'steady'};
      if(recovery.active||student.state!=='progress')delete base.reviewVariant;
    }
    return base;
  };
  const routeReviewGoal=()=>({minutes:20,questions:8,text:'review'});
  const teacherQuestions=()=>[];
  const subName=id=>subjectDefs.find(s=>s.id===id)?.name||id;
  const routeSubjectAdaptiveState=(sid,tid)=>opts.adaptive?.[tid]||{mode:'steady',scope:'topic',confidence:70,skillWeakness:{primary:null}};
  const routeTaskGoal=(sid,tid)=>opts.goals?.[tid]||{minutes:opts.minutes?.[tid]||30,questions:10,text:'goal'};
  const routeIsReviewLike=p=>!!p&&(p.kind==='review'||['mistake','mini_repair','retention_refresh','ai_teacher','spaced_review','checkpoint'].includes(p.source));
  const routeRetentionRefreshCandidates=()=>opts.refresh||[];
  const routePlanEvidenceDate=p=>opts.evidenceDates?.[p.id]||p.date||'';
  const routeSessionPerformanceSignal=log=>opts.performance?.[log?.sessionId||'']||{repair:false,challenge:false};
  const routeLastLogDate=sid=>opts.lastLog?.[sid]||'';
  const routeStudyMethod=(sid)=>{
    if(['k-ma','t-fi','t-ki'].includes(sid))return {key:sid==='k-ma'?'quant':'science',label:sid==='k-ma'?'SORU + YANLIŞ ANALİZİ':'KAVRAM + UYGULAMA'};
    if(sid==='k-tr')return {key:'paragraph',label:'SÜRELİ ANLAMA SETİ'};
    if(sid==='k-ta')return {key:'history',label:'ZAMAN ÇİZGİSİ + HATIRLAMA'};
    return {key:'geography',label:'HARİTA + HATIRLAMA'};
  };
  const routeStudentModel=(sid,tid)=>opts.students?.[tid]||{confidence:0,priorityBoost:0};
  const routePaceSignal=()=>opts.pace||{known:false};
  const routeDaysToTarget=()=>opts.daysToTarget??null;
  const routeTopicExamRisk=(sid,tid)=>opts.risks?.[tid]||{score:0,priorityBoost:0};
  const fn=new Function(
    'w','R','state','today','routeExamWeakness','routeRecoverySignal','routeCandidateFromPlan',
    'routeReviewGoal','teacherQuestions','subName','routeSubjectAdaptiveState','routeTaskGoal',
    'routeIsReviewLike','routeRetentionRefreshCandidates','routePlanEvidenceDate',
    'routeSessionPerformanceSignal','routeLastLogDate','routeProfileSignal','routeStudyMethod',
    'routeStudentModel','routePaceSignal','routeDaysToTarget','routeTopicExamRisk','subjects',
    buildSrc+';return routeBuildCandidates;'
  );
  return fn(
    ()=>space,R,state,today,routeExamWeakness,routeRecoverySignal,routeCandidateFromPlan,
    routeReviewGoal,teacherQuestions,subName,routeSubjectAdaptiveState,routeTaskGoal,
    routeIsReviewLike,routeRetentionRefreshCandidates,routePlanEvidenceDate,
    routeSessionPerformanceSignal,routeLastLogDate,routeProfileSignal,routeStudyMethod,
    routeStudentModel,routePaceSignal,routeDaysToTarget,routeTopicExamRisk,subjects
  )();
}
function rebalance(space,candidates,opts={}){
  const state={activeExam:'kpss'},R={dayAdd};
  const routeEnsure=()=>{};
  const routeRecoverySignal=()=>opts.recovery||{active:false,severe:false};
  const routeBuildCandidates=()=>candidates.map(x=>({...x}));
  const routeEffectiveDailyMinutes=()=>opts.limit||space.settings.dailyMinutes||120;
  const routeTaskMethod=p=>({key:p.methodKey||(p.subjectId==='k-ma'?'quant':['t-fi','t-ki'].includes(p.subjectId)?'science':p.subjectId==='k-tr'?'paragraph':p.subjectId==='k-ta'?'history':'geography')});
  const routeMethodLoad=k=>['quant','geometry','science','logic','ydt_reading'].includes(k)?2:['biology','paragraph','grammar','ydt_grammar'].includes(k)?1:0;
  const routeIsQuantitativeHeavy=k=>['quant','geometry','science'].includes(k);
  const routeIsReviewLike=p=>!!p&&(p.kind==='review'||['mistake','mini_repair','retention_refresh','ai_teacher','spaced_review','checkpoint'].includes(p.source));
  const routeIsCriticalReview=p=>!!p&&(p.source==='mistake'||p.source==='mini_repair'||(p.source==='spaced_review'&&p.reviewWave===1));
  const routeIsBacklog=p=>p.source==='backlog';
  const routeHeavyLimit=l=>l<=90?1:l<=180?2:3;
  const routeQuantitativeDailyLimit=l=>l<=90?1:2;
  const routeReviewDailyLimit=l=>Math.max(30,Math.round((l*.5)/5)*5);
  const routeBacklogDailyLimit=(l,r)=>Math.min(l,Math.max(30,Math.round((l*(r?.active?(r.severe?.30:.35):.45))/5)*5));
  const routeBacklogDailyCountLimit=r=>r?.active?1:2;
  const routeReviewWeeklyLimit=t=>Math.max(30,Math.round((t*.45)/5)*5);
  const routeBacklogWeeklyLimit=(t,r)=>Math.min(t,Math.max(30,Math.round((t*(r?.active?(r.severe?.20:.25):.35))/5)*5));
  const routeRecordInterventions=()=>{},toast=()=>{};
  const fn=new Function(
    'state','w','today','R','routeEnsure','routeRecoverySignal','routeBuildCandidates',
    'routeEffectiveDailyMinutes','routeTaskMethod','routeMethodLoad','routeIsQuantitativeHeavy',
    'routeIsReviewLike','routeIsCriticalReview','routeIsBacklog','routeHeavyLimit',
    'routeQuantitativeDailyLimit','routeReviewDailyLimit','routeBacklogDailyLimit',
    'routeBacklogDailyCountLimit','routeReviewWeeklyLimit','routeBacklogWeeklyLimit',
    'routeRecordInterventions','toast',
    rebalanceSrc+';return routeRebalance;'
  );
  return fn(
    state,()=>space,today,R,routeEnsure,routeRecoverySignal,routeBuildCandidates,
    routeEffectiveDailyMinutes,routeTaskMethod,routeMethodLoad,routeIsQuantitativeHeavy,
    routeIsReviewLike,routeIsCriticalReview,routeIsBacklog,routeHeavyLimit,
    routeQuantitativeDailyLimit,routeReviewDailyLimit,routeBacklogDailyLimit,
    routeBacklogDailyCountLimit,routeReviewWeeklyLimit,routeBacklogWeeklyLimit,
    routeRecordInterventions,toast
  )('route simulation',true);
}
function fullRoute(space,buildOpts={},scheduleOpts={}){
  const candidates=makeBuild(space,buildOpts);
  const result=rebalance(space,candidates,scheduleOpts);
  return {candidates,result,plan:space.plan};
}
function groupedByDate(plan){
  const map=new Map();
  for(const p of plan){const xs=map.get(p.date)||[];xs.push(p);map.set(p.date,xs);}
  return map;
}
function taskCost(p){return (p.minutes||25)+5;}

const failures=[];
let passed=0;
function sim(name,run,check){
  let result;
  try{
    result=run();
    check(result);
    passed++;
  }catch(error){
    failures.push({name,error:error.message,result});
  }
}

// R01 — normal frontier exposes only two nearby topics per subject.
sim('R01 normal frontier',()=>{
  const space=baseSpace();
  return makeBuild(space);
},cs=>{
  assert.equal(cs.filter(x=>x.subjectId==='k-ma'&&x.routeKey?.startsWith('topic:')).length,2);
});

// R02 — priority/weak subject may expose three nearby topics, but not the fourth.
sim('R02 priority frontier',()=>{
  const space=baseSpace();space.settings.priorities=['k-ma'];
  return makeBuild(space);
},cs=>{
  assert.deepEqual(cs.filter(x=>x.subjectId==='k-ma'&&x.routeKey?.startsWith('topic:')).map(x=>x.topicId),['m1','m2','m3']);
});

// R03 — active topic stays ahead of fresh topics in the same subject.
sim('R03 active topic first',()=>{
  const space=baseSpace();space.topicState.m3={status:1};
  return makeBuild(space);
},cs=>{
  const math=cs.filter(x=>x.subjectId==='k-ma'&&x.routeKey?.startsWith('topic:'));
  assert.equal(math[0].topicId,'m3');
});

// R04 — recently worked topic cannot immediately return as a new main task.
sim('R04 recent topic exclusion',()=>{
  const space=baseSpace();
  space.plan.push({id:'done',date:'2026-09-18',done:true,subjectId:'k-ma',topicId:'m1',source:'curriculum'});
  return makeBuild(space,{evidenceDates:{done:'2026-09-18'}});
},cs=>assert.ok(!cs.some(x=>x.routeKey==='topic:m1')));

// R05 — unresolved mistake owns the topic slot and blocks a duplicate curriculum task.
sim('R05 mistake owns topic',()=>{
  const space=baseSpace();
  space.mistakes.push({id:'err1',resolved:false,reviewDate:TODAY,subjectId:'k-ma',topicId:'m1',title:'Temel kavramlar'});
  return makeBuild(space);
},cs=>{
  assert.equal(cs.filter(x=>x.topicId==='m1').length,1);
  assert.equal(cs.find(x=>x.topicId==='m1').source,'mistake');
});

// R06 — same-day mini retakes collapse to the newest repair signal.
sim('R06 same-day mini dedupe',()=>{
  const space=baseSpace();
  space.assessments.push(
    {id:'old',miniId:'mini',date:TODAY,subjectId:'k-tr',topicId:'t1',correct:2,wrong:8,created:1},
    {id:'new',miniId:'mini',date:TODAY,subjectId:'k-tr',topicId:'t1',correct:3,wrong:7,created:2}
  );
  return makeBuild(space,{adaptive:{t1:{mode:'repair',scope:'topic',confidence:60,skillWeakness:{primary:{skill:'Ana düşünce'}}}},students:{t1:{state:'repair',confidence:70,priorityBoost:0}}});
},cs=>{
  const repairs=cs.filter(x=>x.source==='mini_repair'&&x.topicId==='t1');
  assert.equal(repairs.length,1);
  assert.match(repairs[0].reason,/Ana düşünce/);
});

// R06b — one low-confidence bad mini may reveal weakness but cannot create a high-priority repair task before Student Model confirmation.
sim('R06b low-confidence mini waits for corroboration',()=>{
  const space=baseSpace();
  space.assessments.push({id:'only',miniId:'mini',date:TODAY,subjectId:'k-tr',topicId:'t1',correct:2,wrong:8,created:1});
  return makeBuild(space,{
    adaptive:{t1:{mode:'repair',scope:'topic',confidence:20,skillWeakness:{primary:{skill:'Ana düşünce'}}}},
    students:{t1:{state:'collect',confidence:18,priorityBoost:0}}
  });
},cs=>{
  assert.ok(!cs.some(x=>x.source==='mini_repair'&&x.topicId==='t1'),'Uncorroborated single-mini weakness must not become a repair task');
});

// R07 — mini repair replaces the same topic's ordinary task rather than duplicating it.
sim('R07 mini repair replaces normal task',()=>{
  const space=baseSpace();
  space.plan.push({id:'open',date:TODAY,done:false,subjectId:'k-tr',topicId:'t1',source:'curriculum',minutes:30,priority:40});
  space.assessments.push({id:'a',miniId:'mini',date:TODAY,subjectId:'k-tr',topicId:'t1',correct:3,wrong:7,created:1});
  return makeBuild(space,{adaptive:{t1:{mode:'repair',scope:'topic',confidence:60,skillWeakness:{primary:null}}},students:{t1:{state:'repair',confidence:70,priorityBoost:0}}});
},cs=>{
  assert.equal(cs.filter(x=>x.topicId==='t1').length,1);
  assert.equal(cs.find(x=>x.topicId==='t1').source,'mini_repair');
});

// R08 — retention refresh coalesces with any already-open same-topic work.
sim('R08 refresh coalescing',()=>{
  const space=baseSpace();
  space.plan.push({id:'open',date:TODAY,done:false,subjectId:'k-ma',topicId:'m1',source:'curriculum',minutes:30,priority:50});
  return makeBuild(space,{refresh:[{topic:{id:'m1',subjectId:'k-ma',title:'Temel kavramlar'},forgetting:{latestDate:'2026-08-01',retained:50}}]});
},cs=>assert.ok(!cs.some(x=>x.source==='retention_refresh'&&x.topicId==='m1')));

// R09 — completed topic with due forgetting can re-enter only as retention refresh.
sim('R09 completed topic refresh',()=>{
  const space=baseSpace();space.topicState.m1={status:2};
  return makeBuild(space,{refresh:[{topic:{id:'m1',subjectId:'k-ma',title:'Temel kavramlar'},forgetting:{latestDate:'2026-08-01',retained:50}}]});
},cs=>{
  const xs=cs.filter(x=>x.topicId==='m1');
  assert.equal(xs.length,1);
  assert.equal(xs[0].source,'retention_refresh');
});

// R10 — spaced reviews anchor to actual study evidence date, not stale planned date.
sim('R10 actual study date anchors reviews',()=>{
  const space=baseSpace();
  space.plan.push({id:'base',date:'2026-09-10',done:true,subjectId:'k-ma',topicId:'m1',source:'curriculum',title:'Temel kavramlar'});
  return makeBuild(space,{evidenceDates:{base:'2026-09-18'}});
},cs=>{
  const r3=cs.find(x=>x.source==='spaced_review'&&x.reviewWave===3&&x.topicId==='m1');
  const r7=cs.find(x=>x.source==='spaced_review'&&x.reviewWave===7&&x.topicId==='m1');
  assert.equal(r3.earliest,'2026-09-21');
  assert.equal(r7.earliest,'2026-09-25');
});

// R11 — verified repair creates a one-day repair wave before normal 3/7 reviews.
sim('R11 one-day repair wave',()=>{
  const space=baseSpace();
  space.plan.push({id:'base',date:'2026-09-18',done:true,subjectId:'k-ma',topicId:'m1',source:'curriculum',title:'Temel kavramlar'});
  return makeBuild(space,{evidenceDates:{base:'2026-09-18'},adaptive:{m1:{mode:'repair',scope:'topic',confidence:70,skillWeakness:{primary:null}}},students:{m1:{state:'repair',confidence:80,priorityBoost:0}}});
},cs=>{
  const r1=cs.find(x=>x.source==='spaced_review'&&x.reviewWave===1&&x.topicId==='m1');
  assert.ok(r1);
  assert.equal(r1.earliest,TODAY);
});

// R12 — earned, corroborated progress changes the 3-day review into a challenge, not an extra task.
sim('R12 challenge review substitution',()=>{
  const space=baseSpace();
  space.plan.push({id:'base',date:'2026-09-18',done:true,subjectId:'k-ma',topicId:'m1',source:'curriculum',title:'Temel kavramlar'});
  return makeBuild(space,{
    evidenceDates:{base:'2026-09-18'},
    adaptive:{m1:{mode:'progress',scope:'topic',confidence:70,skillWeakness:{primary:null}}},
    students:{m1:{state:'progress',confidence:80,priorityBoost:0}}
  });
},cs=>{
  const r3=cs.find(x=>x.source==='spaced_review'&&x.reviewWave===3&&x.topicId==='m1');
  assert.equal(r3.reviewVariant,'challenge');
  assert.match(r3.title,/Seviye yoklama/);
});

// R12b — raw adaptive progress alone cannot bypass the Student Model progression gate.
sim('R12b unverified progress stays normal review',()=>{
  const space=baseSpace();
  space.plan.push({id:'base',date:'2026-09-18',done:true,subjectId:'k-ma',topicId:'m1',source:'curriculum',title:'Temel kavramlar'});
  return makeBuild(space,{
    evidenceDates:{base:'2026-09-18'},
    adaptive:{m1:{mode:'progress',scope:'topic',confidence:70,skillWeakness:{primary:null}}},
    students:{m1:{state:'steady',confidence:90,priorityBoost:0}}
  });
},cs=>{
  const r3=cs.find(x=>x.source==='spaced_review'&&x.reviewWave===3&&x.topicId==='m1');
  assert.ok(r3);
  assert.equal(r3.reviewVariant,undefined);
  assert.match(r3.title,/3 gün tekrarı/);
});

// R12c — an already-created challenge must downgrade if corroborated progression is no longer present.
sim('R12c stale challenge downgrades after regression',()=>{
  const space=baseSpace();
  space.plan.push({
    id:'r3',date:'2026-09-19',done:false,subjectId:'k-ma',topicId:'m1',source:'spaced_review',
    title:'Seviye yoklama · Temel kavramlar',reviewWave:3,reviewVariant:'challenge',
    reviewBaseTaskId:'base',reviewBaseDate:'2026-09-16',routeKey:'review:base:3'
  });
  space.plan.push({id:'base',date:'2026-09-16',done:true,subjectId:'k-ma',topicId:'m1',source:'curriculum',title:'Temel kavramlar'});
  return makeBuild(space,{
    evidenceDates:{base:'2026-09-16'},
    adaptive:{m1:{mode:'progress',scope:'topic',confidence:70,skillWeakness:{primary:null}}},
    students:{m1:{state:'steady',confidence:95,priorityBoost:0}}
  });
},cs=>{
  const r3=cs.find(x=>x.id==='r3');
  assert.ok(r3);
  assert.equal(r3.reviewVariant,undefined);
});

// R13 — recovery disables exam-risk promotion of normal new topics.
sim('R13 recovery disables risk boost',()=>{
  const a=baseSpace(),b=baseSpace();
  const baseline=makeBuild(a,{recovery:{active:true,severe:false},students:{m1:{confidence:80,priorityBoost:0}},risks:{m1:{score:10,priorityBoost:0}}}).find(x=>x.routeKey==='topic:m1');
  const risky=makeBuild(b,{recovery:{active:true,severe:false},students:{m1:{confidence:80,priorityBoost:0}},risks:{m1:{score:95,priorityBoost:5}}}).find(x=>x.routeKey==='topic:m1');
  return {baseline,risky};
},x=>assert.equal(x.risky.priority,x.baseline.priority));

// R14 — outside recovery, risk can adjust priority but only by its bounded boost.
sim('R14 bounded risk priority',()=>{
  const a=baseSpace(),b=baseSpace();
  const baseline=makeBuild(a,{students:{m1:{confidence:80,priorityBoost:0}},risks:{m1:{score:10,priorityBoost:0}}}).find(x=>x.routeKey==='topic:m1');
  const risky=makeBuild(b,{students:{m1:{confidence:80,priorityBoost:0}},risks:{m1:{score:95,priorityBoost:5}}}).find(x=>x.routeKey==='topic:m1');
  return {baseline,risky};
},x=>{
  assert.equal(x.risky.priority-x.baseline.priority,5);
});

// R15 — a <=90 minute day never contains more than one normal quantitative-heavy task.
sim('R15 90-minute quant ceiling',()=>{
  const space=baseSpace(90);
  const candidates=Array.from({length:8},(_,i)=>({id:'q'+i,routeKey:'q'+i,earliest:TODAY,minutes:25,subjectId:i%2?'t-fi':'k-ma',topicId:'q'+i,priority:80-i,source:'curriculum',methodKey:i%2?'science':'quant'}));
  rebalance(space,candidates,{limit:90});
  return groupedByDate(space.plan);
},days=>{
  for(const xs of days.values())assert.ok(xs.filter(x=>['quant','science','geometry'].includes(x.methodKey)).length<=1);
});

// R16 — a larger day may use more quantitative work but never exceeds the hard ceiling of two normal blocks.
sim('R16 120-minute quant ceiling',()=>{
  const space=baseSpace(120);
  const candidates=Array.from({length:10},(_,i)=>({id:'q'+i,routeKey:'q'+i,earliest:TODAY,minutes:25,subjectId:i%3===0?'k-ma':i%3===1?'t-fi':'t-ki',topicId:'q'+i,priority:90-i,source:'curriculum',methodKey:i%3===0?'quant':'science'}));
  rebalance(space,candidates,{limit:120});
  return groupedByDate(space.plan);
},days=>{
  for(const xs of days.values())assert.ok(xs.filter(x=>['quant','science','geometry'].includes(x.methodKey)).length<=2);
});

// R17 — critical repairs may open only one extra quantitative slot beyond the normal ceiling.
sim('R17 critical quant extra slot bounded',()=>{
  const space=baseSpace(180);
  const candidates=Array.from({length:9},(_,i)=>({
    id:'q'+i,routeKey:'q'+i,earliest:TODAY,minutes:20,
    subjectId:i%3===0?'k-ma':i%3===1?'t-fi':'t-ki',topicId:'q'+i,priority:100-i,
    source:i<6?'mistake':'curriculum',kind:i<6?'review':'route',methodKey:i%3===0?'quant':'science'
  }));
  rebalance(space,candidates,{limit:180});
  return groupedByDate(space.plan);
},days=>{
  for(const xs of days.values())assert.ok(xs.filter(x=>['quant','science','geometry'].includes(x.methodKey)).length<=3);
});

// R18 — recovery allows at most one normal backlog task on a day.
sim('R18 recovery backlog daily count',()=>{
  const space=baseSpace(120);
  const candidates=Array.from({length:8},(_,i)=>({id:'b'+i,routeKey:'b'+i,earliest:TODAY,minutes:20,subjectId:i%2?'k-tr':'k-ta',topicId:'b'+i,priority:90-i,source:'backlog',methodKey:i%2?'paragraph':'history'}));
  rebalance(space,candidates,{limit:120,recovery:{active:true,severe:false}});
  return groupedByDate(space.plan);
},days=>{
  for(const xs of days.values())assert.ok(xs.filter(x=>x.source==='backlog').length<=1);
});

// R19 — normal mode still caps backlog at two tasks per day.
sim('R19 normal backlog daily count',()=>{
  const space=baseSpace(180);
  const candidates=Array.from({length:10},(_,i)=>({id:'b'+i,routeKey:'b'+i,earliest:TODAY,minutes:20,subjectId:i%3===0?'k-tr':i%3===1?'k-ta':'k-co',topicId:'b'+i,priority:90-i,source:'backlog',methodKey:i%3===0?'paragraph':i%3===1?'history':'geography'}));
  rebalance(space,candidates,{limit:180,recovery:{active:false,severe:false}});
  return groupedByDate(space.plan);
},days=>{
  for(const xs of days.values())assert.ok(xs.filter(x=>x.source==='backlog').length<=2);
});

// R20 — full scheduling never puts a review before earliest date or exceeds daily minute capacity.
sim('R20 earliest and capacity safety',()=>{
  const space=baseSpace(120),due=dayAdd(TODAY,3);
  const candidates=[
    {id:'r',routeKey:'r',earliest:due,minutes:20,subjectId:'k-tr',topicId:'t1',priority:95,source:'spaced_review',kind:'review',reviewWave:3,methodKey:'paragraph'},
    {id:'a',routeKey:'a',earliest:TODAY,minutes:35,subjectId:'k-ta',topicId:'h1',priority:80,source:'curriculum',methodKey:'history'},
    {id:'b',routeKey:'b',earliest:TODAY,minutes:35,subjectId:'k-co',topicId:'c1',priority:70,source:'curriculum',methodKey:'geography'}
  ];
  rebalance(space,candidates,{limit:120});
  return {space,due,days:groupedByDate(space.plan)};
},x=>{
  assert.ok(x.space.plan.find(p=>p.id==='r').date>=x.due);
  for(const xs of x.days.values())assert.ok(xs.reduce((n,p)=>n+taskCost(p),0)<=120);
});

if(failures.length)console.error('Route simulation failures:',JSON.stringify(failures,null,2));
assert.equal(failures.length,0,`${failures.length} route simulations failed`);
assert.equal(passed,23,'Expected exactly 23 route simulations');
console.log(`route-engine-route-sim: ${passed} real candidate/scheduler simulations passed`);
