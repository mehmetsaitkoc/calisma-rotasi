import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');

function between(start,end){
  const a=html.indexOf(start),b=html.indexOf(end,a);
  assert.ok(a>=0 && b>a,`Missing source markers: ${start} -> ${end}`);
  return html.slice(a,b);
}

// 1) Every executable inline script must parse.
let parsed=0;
for(const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){
  const attrs=match[1]||'',js=match[2]||'';
  if(/application\/(?:ld\+json|json)/.test(attrs)||!js.trim())continue;
  new Function(js);
  parsed++;
}
assert.ok(parsed>=5,'Expected executable inline scripts');

// 2) Subject/topic methodology must classify materially different study modes.
{
  const src=between('function routeStudyMethod','function routeMethodLoad');
  const topics={
    't-tr-3':'Paragraf',
    'k-tr-4':'Sözel mantık',
    'k-ma-13':'Üçgenler',
    'd-yd-1':'Kelime çalışması',
    'd-yd-2':'Dil bilgisi',
    'd-yd-5':'Okuduğunu anlama',
    't-bi-3':'Hücre',
    'a-ed-8':'Servetifünun',
    'k-ta-5':'Osmanlı yükselme dönemi',
    't-co-4':'Harita bilgisi',
    't-fi-4':'İş, güç ve enerji'
  };
  const R={topic:(_space,id)=>topics[id]?{title:topics[id]}:null};
  const w=()=>({});
  const method=new Function('R','w',src+';return routeStudyMethod;')(R,w);
  assert.equal(method('t-tr','t-tr-3').key,'paragraph');
  assert.equal(method('k-tr','k-tr-4').key,'logic');
  assert.equal(method('k-ma','k-ma-13').key,'geometry');
  assert.equal(method('d-yd','d-yd-1').key,'ydt_vocab');
  assert.equal(method('d-yd','d-yd-2').key,'ydt_grammar');
  assert.equal(method('d-yd','d-yd-5').key,'ydt_reading');
  assert.equal(method('t-bi','t-bi-3').key,'biology');
  assert.equal(method('a-ed','a-ed-8').key,'literature');
  assert.equal(method('k-ta','k-ta-5').key,'history');
  assert.equal(method('t-co','t-co-4').key,'geography');
  assert.equal(method('t-fi','t-fi-4').key,'science');
}

// 2a) New planned logs must not silently create a "Normal" feedback signal.
{
  const src=between('function openLog','function openSource');
  assert.ok(src.includes("outcome:''"),'New session log should start without an outcome');
  assert.ok(src.includes("?initial.outcome:''"),'Missing feedback must stay missing');
  assert.ok(src.includes("existing?!!session?.done"),'Editing a log must reflect actual plan completion');
  assert.ok(!src.includes("outcome:'ok'}"),'Normal feedback must never be fabricated by default');
  assert.ok(src.includes("questions:''"),'New session log must leave actual question count blank');
  assert.ok(src.includes("Hedef ≈ '+session.targetQuestions"),'Planned question target should be shown only as a hint');
  assert.ok(src.includes('Seçmezsen rota bu alan için varsayım yapmaz'),'Feedback UI must explain that no default assumption is made');
}

// 2b) Review labels must distinguish repair, normal review and earned challenge.
{
  const src=between('function routeSourceLabel','function routeExamWeakness');
  const api=new Function(src+';return {routeTaskSourceLabel};')();
  assert.equal(api.routeTaskSourceLabel({source:'spaced_review',reviewWave:1}),'1 GÜN ONARIMI');
  assert.equal(api.routeTaskSourceLabel({source:'spaced_review',reviewWave:3}),'3 GÜN TEKRARI');
  assert.equal(api.routeTaskSourceLabel({source:'spaced_review',reviewWave:3,reviewVariant:'challenge'}),'SEVİYE YOKLAMA');
}

// 2c) TYT/KPSS main net and AYT/YDT stage net must stay separate.
{
  const src=between('function routeObservedNet','function routeGapPressure');
  const space={
    exams:[
      {type:'TYT',date:'2026-09-18',penalty:4,parts:[{label:'TYT',correct:60,wrong:0,total:120}]},
      {type:'AYT_SAY',date:'2026-09-18',penalty:4,parts:[{label:'AYT',correct:25,wrong:0,total:80}]}
    ],
    profile:{targetNet:90,targetStageNet:50},
    settings:{track:'say'}
  };
  const R={calcNet:parts=>({net:parts[0].correct})};
  const C={TYPES:{TYT:{label:'TYT'},AYT_SAY:{label:'AYT · Sayısal'}}};
  const state={activeExam:'yks'};
  const yksStageExamType=()=> 'AYT_SAY';
  const yksStageLabel=()=> 'AYT · Sayısal';
  const routeExamEvidenceFactor=()=>1;
  const api=new Function('R','C','state','w','yksStageExamType','yksStageLabel','routeExamEvidenceFactor',src+';return {routeNetGap,routeStageGap};')(R,C,state,()=>space,yksStageExamType,yksStageLabel,routeExamEvidenceFactor);
  const main=api.routeNetGap(),stage=api.routeStageGap();
  assert.equal(main.current,60);
  assert.equal(main.target,90);
  assert.equal(main.observed.label,'TYT');
  assert.equal(stage.current,25);
  assert.equal(stage.target,50);
  assert.equal(stage.observed.label,'AYT · Sayısal');
}

// 2d) Old exam evidence may remain visible, but its target-gap pressure must decay.
{
  const src=between('function routeGapPressure','function routeGoalPressure');
  const fn=new Function(src+';return routeGapPressure;')();
  assert.equal(fn({known:true,gap:40,freshness:1}),10);
  assert.equal(fn({known:true,gap:40,freshness:.55}),6);
  assert.equal(fn({known:true,gap:40,freshness:.35}),4);
  assert.equal(fn({known:true,gap:40}),10,'Profile/non-aged evidence keeps normal gap pressure');
}

// 3) Adaptive dosage must react differently to struggle, strong performance and friction.
{
  const src=between('function routeOutcomeSignal','function routeCandidateFromPlan');
  function evaluate({logs=[],behavior,weak={},mistakes=[]}){
    const space={logs,mistakes};
    const R={dayAdd:()=> '2026-08-29'};
    const today=()=> '2026-09-19';
    const w=()=>space;
    const routeBehaviorSignal=()=>behavior;
    const routeExamWeakness=()=>weak;
    const api=new Function('R','today','w','routeBehaviorSignal','routeExamWeakness',src+';return {routeSubjectAdaptiveState};')(R,today,w,routeBehaviorSignal,routeExamWeakness);
    return api.routeSubjectAdaptiveState('k-ma');
  }

  const struggle=evaluate({
    logs:[
      {subjectId:'k-ma',sessionId:'a',date:'2026-09-18',outcome:'stuck',correct:6,wrong:6},
      {subjectId:'k-ma',sessionId:'b',date:'2026-09-17',outcome:'ok',correct:5,wrong:5}
    ],
    behavior:{known:true,total:4,completion:.9,friction:.1},
    weak:{'k-ma':{ratio:.8}}
  });
  assert.equal(struggle.mode,'repair');

  const strong=evaluate({
    logs:[
      {subjectId:'k-ma',sessionId:'a',date:'2026-09-18',outcome:'strong',correct:18,wrong:2},
      {subjectId:'k-ma',sessionId:'b',date:'2026-09-17',outcome:'strong',correct:17,wrong:3},
      {subjectId:'k-ma',sessionId:'c',date:'2026-09-16',outcome:'ok',correct:16,wrong:4}
    ],
    behavior:{known:true,total:5,completion:.85,friction:.08},
    weak:{'k-ma':{ratio:.8}}
  });
  assert.equal(strong.mode,'progress');

  const friction=evaluate({
    logs:[{subjectId:'k-ma',sessionId:'a',date:'2026-09-18',outcome:'strong',correct:18,wrong:2}],
    behavior:{known:true,total:4,completion:.35,friction:.55},
    weak:{'k-ma':{ratio:.8}}
  });
  assert.equal(friction.mode,'ease');

  const oneBad=evaluate({
    logs:[{subjectId:'k-ma',sessionId:'a',date:'2026-09-18',outcome:'stuck',correct:7,wrong:3}],
    behavior:{known:false,total:1,completion:1,friction:0},
    weak:{'k-ma':{ratio:.8}}
  });
  assert.equal(oneBad.mode,'steady','A single bad session must not overreact into repair');

  const oneGood=evaluate({
    logs:[{subjectId:'k-ma',sessionId:'a',date:'2026-09-18',outcome:'strong',correct:9,wrong:1}],
    behavior:{known:false,total:1,completion:1,friction:0},
    weak:{'k-ma':{ratio:.8}}
  });
  assert.equal(oneGood.mode,'steady','A single good session must not overreact into progress');

  // Topic evidence must override broad subject history when it exists.
  {
    const space={
      plan:[
        {id:'s1',subjectId:'k-ma',topicId:'topic-1'},
        {id:'s2',subjectId:'k-ma',topicId:'topic-2'},
        {id:'s3',subjectId:'k-ma',topicId:'topic-2'}
      ],
      logs:[
        {subjectId:'k-ma',sessionId:'s1',date:'2026-09-18',outcome:'stuck',correct:5,wrong:5},
        {subjectId:'k-ma',sessionId:'s2',date:'2026-09-18',outcome:'strong',correct:9,wrong:1},
        {subjectId:'k-ma',sessionId:'s3',date:'2026-09-17',outcome:'strong',correct:9,wrong:1}
      ],
      mistakes:[]
    };
    const R={dayAdd:()=> '2026-08-29',topic:(_w,id)=>['topic-1','topic-2'].includes(id)?{id}:null};
    const today=()=> '2026-09-19';
    const w=()=>space;
    const routeBehaviorSignal=(_subject,topic='')=>topic==='topic-2'?{known:true,total:4,completion:.9,friction:.05}:{known:false,total:0,completion:0,friction:0};
    const routeExamWeakness=()=>({'k-ma':{ratio:.8}});
    const adaptive=new Function('R','today','w','routeBehaviorSignal','routeExamWeakness',src+';return routeSubjectAdaptiveState;')(R,today,w,routeBehaviorSignal,routeExamWeakness);
    const weakTopic=adaptive('k-ma','topic-1');
    const strongTopic=adaptive('k-ma','topic-2');
    assert.equal(weakTopic.mode,'repair');
    assert.equal(weakTopic.scope,'topic');
    assert.equal(strongTopic.mode,'progress');
    assert.equal(strongTopic.scope,'topic');
  }
}


// 3a) Stale exam weakness must not force ONARIM by itself.
{
  const src=between('function routeOutcomeSignal','function routeCandidateFromPlan');
  function evaluate(weak){
    const space={logs:[],mistakes:[],plan:[]};
    const R={dayAdd:()=> '2026-08-29',topic:()=>null};
    const today=()=> '2026-09-19';
    const routeBehaviorSignal=()=>({known:false,total:0,completion:0,friction:0});
    const routeExamWeakness=()=>({'k-ma':weak});
    const api=new Function('R','today','w','routeBehaviorSignal','routeExamWeakness',src+';return routeSubjectAdaptiveState;')(R,today,()=>space,routeBehaviorSignal,routeExamWeakness);
    return api('k-ma');
  }
  assert.equal(evaluate({ratio:.40,freshness:1}).mode,'repair','Fresh very weak exam evidence may trigger repair');
  const stale=evaluate({ratio:.40,freshness:.35});
  assert.equal(stale.mode,'steady','Very stale weak exam evidence may nudge but must not dictate repair alone');
  assert.ok(stale.evidence.includes('eski denemede zayıflık sinyali'));
}

// 3b) Subjective effort and objective accuracy must be calibrated instead of trusted blindly.
{
  const src=between('function routeOutcomeSignal','function routeCandidateFromPlan');
  function evaluate(logs){
    const space={logs,mistakes:[],plan:[]};
    const R={dayAdd:()=> '2026-08-29',topic:()=>null};
    const today=()=> '2026-09-19';
    const routeBehaviorSignal=()=>({known:false,total:0,completion:0,friction:0});
    const routeExamWeakness=()=>({'k-ma':{ratio:.8}});
    const api=new Function('R','today','w','routeBehaviorSignal','routeExamWeakness',src+';return {routeFeedbackCalibrationSignal,routeSubjectAdaptiveState};')(R,today,()=>space,routeBehaviorSignal,routeExamWeakness);
    return {calibration:api.routeFeedbackCalibrationSignal('k-ma'),adaptive:api.routeSubjectAdaptiveState('k-ma')};
  }

  const hiddenGap=evaluate([
    {id:'h1',subjectId:'k-ma',sessionId:'a',date:'2026-09-18',outcome:'strong',correct:5,wrong:5},
    {id:'h2',subjectId:'k-ma',sessionId:'b',date:'2026-09-17',outcome:'strong',correct:5,wrong:5}
  ]);
  assert.equal(hiddenGap.calibration.hiddenGap,2);
  assert.equal(hiddenGap.adaptive.mode,'repair','Feeling comfortable must not override repeatedly low accuracy');

  const productive=evaluate([
    {id:'p1',subjectId:'k-ma',sessionId:'a',date:'2026-09-18',outcome:'stuck',correct:9,wrong:1},
    {id:'p2',subjectId:'k-ma',sessionId:'b',date:'2026-09-17',outcome:'stuck',correct:9,wrong:1}
  ]);
  assert.equal(productive.calibration.productiveStruggle,2);
  assert.equal(productive.adaptive.mode,'steady','Repeated high accuracy with high effort should hold dose steady, not punish or accelerate it');
  assert.match(productive.adaptive.note,/akıcılı/i);
}

// 3c) Repeated UI actions on the same task/day must not inflate adaptive behavior evidence.
{
  const eventSrc=between('function routeEvent','function routeSourceLabel');
  const space={taskEvents:[]};
  let uid=0;
  const R={uid:()=> 'e'+(++uid)};
  const today=()=> '2026-09-19';
  const routeEnsure=()=>{};
  const w=()=>space;
  const routeEvent=new Function('R','today','routeEnsure','w',eventSrc+';return routeEvent;')(R,today,routeEnsure,w);
  routeEvent('task-1','later');
  routeEvent('task-1','later');
  routeEvent('task-1','complete');
  routeEvent('task-1','complete');
  assert.equal(space.taskEvents.length,2,'Same action for the same task/day must be stored once');

  const behaviorSrc=between('function routeBehaviorSignal','function routeOutcomeSignal');
  space.plan=[{id:'task-1',subjectId:'k-ma',topicId:'m1'}];
  space.taskEvents=[
    {taskId:'task-1',date:'2026-09-19',action:'later'},
    {taskId:'task-1',date:'2026-09-19',action:'later'},
    {taskId:'task-1',date:'2026-09-19',action:'complete'},
    {taskId:'task-1',date:'2026-09-19',action:'complete'}
  ];
  const R2={dayAdd:()=> '2026-09-05'};
  const signal=new Function('R','today','w',behaviorSrc+';return routeBehaviorSignal;')(R2,today,w)('k-ma','m1');
  assert.equal(signal.later,0,'Completing the same task/day should supersede a temporary later action');
  assert.equal(signal.complete,1);
  assert.equal(signal.total,1);
}

// 4) Recent learning evidence must outweigh stale history without erasing it.
{
  const src=between('function routeOutcomeSignal','function routeDifficultyLabel');
  const space={
    logs:[
      {id:'recent-1',subjectId:'k-ma',sessionId:'a',date:'2026-09-18',correct:9,wrong:1,outcome:'strong',updated:3},
      {id:'recent-2',subjectId:'k-ma',sessionId:'b',date:'2026-09-17',correct:9,wrong:1,outcome:'strong',updated:2},
      {id:'old',subjectId:'k-ma',sessionId:'c',date:'2026-09-16',correct:10,wrong:40,outcome:'stuck',updated:1}
    ],
    plan:[]
  };
  const R={dayAdd:()=> '2026-08-29'};
  const today=()=> '2026-09-19';
  const w=()=>space;
  const api=new Function('R','today','w',src+';return {routeOutcomeSignal,routePracticeSignal};')(R,today,w);
  const practice=api.routePracticeSignal('k-ma');
  const outcome=api.routeOutcomeSignal('k-ma');
  assert.ok(practice.weightedAccuracy>practice.accuracy,'Recent good sessions should weigh more than an older large bad set');
  assert.ok(outcome.trend>0,'Recent strong feedback should produce a positive recency trend');
}

// 4) Topic evidence can be scoped to the current learning cycle.
{
  const src=between('function routeOutcomeSignal','function routeFeedbackCalibrationSignal');
  const space={
    plan:[
      {id:'old',subjectId:'k-ma',topicId:'topic-1'},
      {id:'base',subjectId:'k-ma',topicId:'topic-1'},
      {id:'review',subjectId:'k-ma',topicId:'topic-1'}
    ],
    logs:[
      {id:'old-log',subjectId:'k-ma',sessionId:'old',date:'2026-09-05',outcome:'strong',correct:10,wrong:0},
      {id:'base-log',subjectId:'k-ma',sessionId:'base',date:'2026-09-10',outcome:'ok',correct:8,wrong:2},
      {id:'review-log',subjectId:'k-ma',sessionId:'review',date:'2026-09-13',outcome:'strong',correct:9,wrong:1}
    ]
  };
  const R={dayAdd:()=> '2026-08-29'};
  const today=()=> '2026-09-19';
  const w=()=>space;
  const api=new Function('R','today','w',src+';return {routeOutcomeSignal,routePracticeSignal};')(R,today,w);
  assert.equal(api.routeOutcomeSignal('k-ma','topic-1').total,3);
  assert.equal(api.routeOutcomeSignal('k-ma','topic-1','2026-09-10').total,2,'Old-cycle feedback must not validate the new cycle');
  assert.equal(api.routePracticeSignal('k-ma','topic-1','2026-09-10').sessions,2);
  assert.equal(api.routePracticeSignal('k-ma','topic-1','2026-09-10').answered,20);
}

// 4) Repeatedly missing the planned question volume should shrink the next dose.
{
  const src=between('function routeOutcomeSignal','function routeCandidateFromPlan');
  const space={
    plan:[
      {id:'s1',subjectId:'k-ma',topicId:'m1',targetQuestions:20},
      {id:'s2',subjectId:'k-ma',topicId:'m1',targetQuestions:20}
    ],
    logs:[
      {id:'l1',subjectId:'k-ma',sessionId:'s1',date:'2026-09-18',questions:10,outcome:'strong',correct:9,wrong:1},
      {id:'l2',subjectId:'k-ma',sessionId:'s2',date:'2026-09-17',questions:10,outcome:'strong',correct:9,wrong:1}
    ],
    mistakes:[]
  };
  const R={dayAdd:()=> '2026-08-29',topic:(_w,id)=>id==='m1'?{id}:null};
  const today=()=> '2026-09-19';
  const w=()=>space;
  const routeBehaviorSignal=()=>({known:true,total:4,completion:1,friction:0});
  const routeExamWeakness=()=>({'k-ma':{ratio:.8,freshness:1}});
  const api=new Function('R','today','w','routeBehaviorSignal','routeExamWeakness',src+';return {routeTargetAttainmentSignal,routeSubjectAdaptiveState};')(R,today,w,routeBehaviorSignal,routeExamWeakness);
  const attainment=api.routeTargetAttainmentSignal('k-ma','m1');
  assert.equal(attainment.known,true);
  assert.equal(attainment.sessions,2);
  assert.equal(attainment.weightedRatio,.5);
  const adaptive=api.routeSubjectAdaptiveState('k-ma','m1');
  assert.equal(adaptive.mode,'ease','High accuracy must not trigger progress when planned volume is repeatedly unrealistic');
  assert.match(adaptive.note,/soru hacmi/i);
}

// 4) Difficulty cause must be retrievable and must alter the study prescription.
{
  const src=between('function routeDifficultyLabel','function routeSubjectAdaptiveState');
  const space={
    logs:[
      {id:'d1',subjectId:'k-ma',sessionId:'a',date:'2026-09-18',difficulty:'speed',updated:2},
      {id:'d2',subjectId:'k-ma',sessionId:'b',date:'2026-09-17',difficulty:'process',updated:1}
    ],
    plan:[]
  };
  const R={dayAdd:()=> '2026-08-29',topic:()=>null};
  const today=()=> '2026-09-19';
  const w=()=>space;
  const routeStudyMethod=()=>({key:'quant',label:'SORU + YANLIŞ ANALİZİ'});
  const api=new Function('R','today','w','routeStudyMethod',src+';return {routeDifficultySignal,routeDifficultyPrescription};')(R,today,w,routeStudyMethod);
  const signal=api.routeDifficultySignal('k-ma');
  assert.equal(signal.recent,'speed');
  assert.match(api.routeDifficultyPrescription('k-ma','','Problemler','speed'),/süre/i);
  assert.match(api.routeDifficultyPrescription('k-ma','','Problemler','process'),/adım|işlem/i);
}

// 4) Task duration must fit the student's effective daily capacity.
{
  const src=between('function routeHeavyLimit','function routeQuestionTarget');
  const w=()=>({});
  const routeEffectiveDailyMinutes=()=>30;
  const api=new Function('w','routeEffectiveDailyMinutes',src+';return {routeMaxTaskMinutes};')(w,routeEffectiveDailyMinutes);
  assert.equal(api.routeMaxTaskMinutes(),25,'30 min daily capacity must leave room for the 5 min break');
}

// 4) Quantitative-heavy work has a hard daily ceiling that scheduler relaxation cannot bypass.
{
  const src=between('function routeMethodLoad','function routeMaxTaskMinutes');
  const api=new Function(src+';return {routeIsQuantitativeHeavy,routeQuantitativeDailyLimit};')();
  assert.equal(api.routeIsQuantitativeHeavy('quant'),true);
  assert.equal(api.routeIsQuantitativeHeavy('geometry'),true);
  assert.equal(api.routeIsQuantitativeHeavy('science'),true);
  assert.equal(api.routeIsQuantitativeHeavy('paragraph'),false);
  assert.equal(api.routeQuantitativeDailyLimit(90),1);
  assert.equal(api.routeQuantitativeDailyLimit(91),2);
  assert.equal(api.routeQuantitativeDailyLimit(120),2);
  assert.equal(api.routeQuantitativeDailyLimit(300),2);

  const rebalance=between('function routeRebalance','function routeAutoSync');
  assert.ok(!rebalance.includes('mode<=2&&isHeavy'),'Relaxation modes must not bypass the heavy-load ceiling');
  assert.ok(rebalance.includes('quantCeiling=day.quantHeavyLimit+(critical?1:0)'),'Critical repair may receive at most one extra quantitative-heavy slot');
  assert.ok(rebalance.includes('if(quantHeavy&&day.quantHeavy>=quantCeiling)return false'),'Quantitative-heavy cap must remain hard even for repeated critical tasks');
}

// 4) Reopening a base study must invalidate its still-open spaced reviews.
{
  const src=between('function routeInvalidateBaseReviews','function routeCandidateFromPlan');
  const space={plan:[
    {id:'base',done:false},
    {id:'open-r3',done:false,reviewBaseTaskId:'base'},
    {id:'done-r3',done:true,reviewBaseTaskId:'base'},
    {id:'other',done:false,reviewBaseTaskId:'other-base'}
  ]};
  const fn=new Function('w',src+';return routeInvalidateBaseReviews;')(()=>space);
  assert.equal(fn('base'),1);
  assert.deepEqual(space.plan.map(p=>p.id),['base','done-r3','other']);
}

// 4) Topic frontier keeps curriculum order and prevents deep-topic flooding.
{
  const src=between('function routeTopicFrontier','function routeBuildCandidates');
  const subjects=()=>[{id:'k-ma'},{id:'k-ta'}];
  const catalog=[
    {id:'m1',subjectId:'k-ma'},{id:'m2',subjectId:'k-ma'},{id:'m3',subjectId:'k-ma'},{id:'m4',subjectId:'k-ma'},
    {id:'t1',subjectId:'k-ta'},{id:'t2',subjectId:'k-ta'},{id:'t3',subjectId:'k-ta'}
  ];
  const space={topicState:{m1:{status:2},m3:{status:1}},settings:{priorities:['k-ma']}};
  const R={allTopics:()=>catalog};
  const state={activeExam:'kpss'};
  const routeProfileSignal=id=>({level:id==='k-ma'?1:2});
  const frontier=new Function('R','state','subjects','routeProfileSignal',src+';return routeTopicFrontier;')(R,state,subjects,routeProfileSignal);
  const picked=frontier(space,catalog.filter(t=>(space.topicState[t.id]?.status||0)!==2));
  assert.deepEqual(picked.filter(t=>t.subjectId==='k-ma').map(t=>t.id),['m3','m2','m4']);
  assert.deepEqual(picked.filter(t=>t.subjectId==='k-ta').map(t=>t.id),['t1','t2']);
}

// 4) Exam evidence must become stale after enough new study, rather than anchoring the route forever.
{
  const src=between('function routeExamFreshness','function routeEvidenceNextStep');
  const today=()=> '2026-09-19';
  const C={TYPES:{KPSS:{label:'KPSS · GY–GK'}},PART_SUBJECTS:{KPSS:{Matematik:['k-ma'],Türkçe:['k-tr']}}};
  const space={
    exams:[{type:'KPSS',date:'2026-09-01'}],
    logs:[
      {sessionId:'a',subjectId:'k-ma',date:'2026-09-05'},
      {sessionId:'b',subjectId:'k-tr',date:'2026-09-07'},
      {sessionId:'c',subjectId:'k-ma',date:'2026-09-10'},
      {sessionId:'d',subjectId:'k-tr',date:'2026-09-12'}
    ]
  };
  const fn=new Function('w','today','C',src+';return routeExamFreshness;')(()=>space,today,C);
  const stale=fn('KPSS');
  assert.equal(stale.known,true);
  assert.equal(stale.stale,true);
  assert.equal(stale.studySince,4);
  space.logs=space.logs.slice(0,2);
  assert.equal(fn('KPSS').stale,false,'Old exam alone should not force a refresh before enough new study exists');
  space.logs=[
    {sessionId:'a',subjectId:'k-ma',date:'2026-09-05'},
    {sessionId:'a',subjectId:'k-ma',date:'2026-09-06'},
    {sessionId:'b',subjectId:'k-tr',date:'2026-09-10'},
    {sessionId:'c',subjectId:'k-ma',date:'2026-09-12'}
  ];
  assert.equal(fn('KPSS').studySince,3,'Duplicate logs for the same planned session must count once');
  assert.equal(fn('KPSS').stale,false);
}

// 4) Stale exam evidence must actually lose priority weight, not only show a refresh hint.
{
  const src=between('function routeExamEvidenceFactor','function routeObservedNet');
  const R={calcNet:parts=>({net:parts[0].correct})};
  const C={PART_SUBJECTS:{KPSS:{Matematik:['k-ma']}}};
  const state={activeExam:'kpss'};
  const subject=id=>id==='k-ma'?{exam:'kpss'}:null;
  const today=()=> '2026-09-19';
  const space={exams:[{type:'KPSS',date:'2026-08-01',penalty:4,parts:[{label:'Matematik',total:10,correct:4}]}],logs:[]};
  const api=new Function('R','C','state','subject','today','w',src+';return {routeExamEvidenceFactor,routeExamWeakness};')(R,C,state,subject,today,()=>space);
  const fresh=api.routeExamWeakness()['k-ma'];
  space.logs=Array.from({length:10},(_,i)=>({sessionId:'u'+i,subjectId:'k-tr',date:'2026-08-'+String(2+i).padStart(2,'0')}));
  const unrelated=api.routeExamWeakness()['k-ma'];
  assert.equal(unrelated.freshness,1,'Unrelated subject study must not stale mathematics evidence');
  space.logs=Array.from({length:10},(_,i)=>({sessionId:'s'+i,subjectId:'k-ma',date:'2026-08-'+String(2+i).padStart(2,'0')}));
  const stale=api.routeExamWeakness()['k-ma'];
  assert.equal(stale.freshness,.35);
  assert.ok(stale.boost<fresh.boost,'Very stale deneme data must lose weight after enough relevant-subject study');
}

// 4) TYT and AYT/YDT evidence freshness must be driven by their own subject groups.
{
  const src=between('function routeExamFreshness','function routeEvidenceNextStep');
  const today=()=> '2026-09-19';
  const C={
    TYPES:{TYT:{label:'TYT'},AYT_SAY:{label:'AYT · Sayısal'}},
    PART_SUBJECTS:{
      TYT:{'Temel matematik':['t-ma'],'Fen bilimleri':['t-fi']},
      AYT_SAY:{Matematik:['a-ma'],Fizik:['a-fi']}
    }
  };
  const space={exams:[{type:'TYT',date:'2026-09-01'}],logs:[
    {sessionId:'a1',subjectId:'a-ma',date:'2026-09-05'},
    {sessionId:'a2',subjectId:'a-fi',date:'2026-09-07'},
    {sessionId:'a3',subjectId:'a-ma',date:'2026-09-10'},
    {sessionId:'a4',subjectId:'a-fi',date:'2026-09-12'}
  ]};
  const fn=new Function('w','today','C',src+';return routeExamFreshness;')(()=>space,today,C);
  assert.equal(fn('TYT').studySince,0,'AYT work must not stale TYT evidence');
  assert.equal(fn('TYT').stale,false);
  space.logs.push(
    {sessionId:'t1',subjectId:'t-ma',date:'2026-09-13'},
    {sessionId:'t2',subjectId:'t-fi',date:'2026-09-14'},
    {sessionId:'t3',subjectId:'t-ma',date:'2026-09-15'},
    {sessionId:'t4',subjectId:'t-fi',date:'2026-09-16'}
  );
  assert.equal(fn('TYT').studySince,4);
  assert.equal(fn('TYT').stale,true);
}

// 4) Light-day action must preserve critical work and move low-priority tasks without recording friction.
{
  const src=between('function routeLightenToday','function routeTaskReason');
  const space={plan:[
    {id:'critical',date:'2026-09-19',done:false,source:'mistake',priority:90,minutes:25},
    {id:'normal-a',date:'2026-09-19',done:false,source:'curriculum',priority:60,minutes:30},
    {id:'normal-b',date:'2026-09-19',done:false,source:'curriculum',priority:40,minutes:30}
  ]};
  const today=()=> '2026-09-19';
  const R={dayAdd:()=> '2026-09-20'};
  const routeEnsure=()=>{};
  const routeEffectiveDailyMinutes=()=>90;
  const routeIsCriticalReview=p=>p.source==='mistake';
  let rebalanced=0;
  const routeRebalance=()=>{rebalanced++;};
  const fn=new Function('w','today','R','routeEnsure','routeEffectiveDailyMinutes','routeIsCriticalReview','routeRebalance',src+';return routeLightenToday;')(()=>space,today,R,routeEnsure,routeEffectiveDailyMinutes,routeIsCriticalReview,routeRebalance);
  const out=fn();
  assert.ok(out.moved>=1);
  assert.equal(space.plan.find(p=>p.id==='critical').deferUntil,undefined,'Critical repair must stay today');
  assert.equal(rebalanced,1);
  assert.ok(space.plan.some(p=>p.id!=='critical'&&p.deferUntil==='2026-09-20'));
}

// 4) Pace signal must suggest a transparent capacity adjustment without changing settings.
{
  const src=between('function routePaceSignal','function routeRebalance');
  const R={
    validDate:()=>true,
    dayAdd:(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return x.toISOString().slice(0,10);},
    allTopics:()=>Array.from({length:80},(_,i)=>({id:'t'+i}))
  };
  const today=()=> '2026-09-19';
  const state={activeExam:'kpss'};
  const routeEffectiveDailyMinutes=()=>60;
  const space={settings:{targetDate:'2026-10-31',days:[1,2,3,4,5]},topicState:{}};
  const pace=new Function('R','today','state','routeEffectiveDailyMinutes','w',src+';return routePaceSignal;')(R,today,state,routeEffectiveDailyMinutes,()=>space)(space);
  assert.equal(pace.known,true);
  assert.equal(pace.status,'overload');
  assert.ok(pace.extraSessionsPerWeek>=1);
  assert.ok(pace.extraMinutesPerWorkDay>=5);
  assert.match(pace.text,/Kararı sen ver/);
  assert.match(pace.text,/kendiliğinden uygulamaz/);
}

// 4) Recovery mode must cap old backlog instead of letting missed tasks consume the whole plan.
{
  const src=between('function routeRecoverySignal','function routeEffectiveDailyMinutes');
  const today=()=> '2026-09-19';
  const routeIsCriticalReview=()=>false;
  let ratio=.25;
  const routeConsistencySignal=()=>({known:true,ratio,active:1,expected:4});
  const space={plan:[
    {id:'a',done:false,date:'2026-09-15',source:'curriculum'},
    {id:'b',done:false,date:'2026-09-16',source:'curriculum'},
    {id:'c',done:false,date:'2026-09-17',source:'curriculum'}
  ]};
  const api=new Function('today','routeIsCriticalReview','routeConsistencySignal','w',src+';return {routeRecoverySignal,routeBacklogDailyLimit,routeBacklogWeeklyLimit,routeBacklogDailyCountLimit};')(today,routeIsCriticalReview,routeConsistencySignal,()=>space);
  const recovery=api.routeRecoverySignal(space);
  assert.equal(recovery.active,true);
  assert.equal(recovery.severe,true);
  assert.equal(api.routeBacklogDailyCountLimit(recovery),1);
  assert.equal(api.routeBacklogDailyLimit(120,recovery),35);
  assert.equal(api.routeBacklogWeeklyLimit(600,recovery),120);
  ratio=.8;
  const normal=api.routeRecoverySignal(space);
  assert.equal(normal.active,false);
  assert.equal(api.routeBacklogDailyCountLimit(normal),2);
  assert.equal(api.routeBacklogDailyLimit(120,normal),55);
}

// 4) Weekly digest must explain recovery and compare recent study totals.
{
  const src=between('function routePeriodStats','function routeWeeklyDigestCard');
  const R={dayAdd:(d,n)=>{
    const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return x.toISOString().slice(0,10);
  }};
  const today=()=> '2026-09-19';
  const space={
    logs:[
      {date:'2026-09-19',minutes:40,questions:20,correct:15,wrong:5,sessionId:'s1',outcome:'ok'},
      {date:'2026-09-18',minutes:30,questions:10,correct:7,wrong:3,sessionId:'s2',outcome:'stuck'},
      {date:'2026-09-11',minutes:20,questions:8,correct:6,wrong:2,sessionId:'p1',outcome:'ok'}
    ],
    taskEvents:[{date:'2026-09-19',taskId:'s1',action:'complete'}]
  };
  const routeRecoverySignal=()=>({active:true,severe:false,overdue:3});
  const api=new Function('R','today','w','routeRecoverySignal','routeLearningSummaryItems',src+';return {routePeriodStats,routeWeeklyDigest};')(R,today,()=>space,routeRecoverySignal,()=>[]);
  const d=api.routeWeeklyDigest([]);
  assert.equal(d.current.minutes,70);
  assert.equal(d.current.questions,30);
  assert.equal(Math.round(d.current.accuracy*100),73);
  assert.equal(d.current.activeDays,2);
  assert.equal(d.title,'Toparlanma modu açık');
  assert.match(d.decision,/backlog|Aksayan/i);
}

// 4) Normal review load is capped, while urgent repair work can bypass that cap.
{
  const src=between('function routeIsReviewLike','function routeQuestionTarget');
  const api=new Function(src+';return {routeIsReviewLike,routeIsCriticalReview,routeReviewDailyLimit,routeReviewWeeklyLimit};')();
  assert.equal(api.routeIsReviewLike({source:'spaced_review',kind:'review'}),true);
  assert.equal(api.routeIsCriticalReview({source:'spaced_review',reviewWave:1,priority:78}),true);
  assert.equal(api.routeIsCriticalReview({source:'spaced_review',reviewWave:3,priority:68}),false);
  assert.equal(api.routeIsCriticalReview({source:'mistake',priority:88}),true);
  assert.equal(api.routeReviewDailyLimit(30),30);
  assert.equal(api.routeReviewDailyLimit(120),60);
  assert.equal(api.routeReviewWeeklyLimit(150),70);
}

// 4) Topic mastery suggestion requires correctly spaced reviews + repeated evidence.
{
  const src=between('function routeTopicMasterySignal','function routeClearCompletedTopicQueue');
  const space={
    plan:[
      {id:'base',date:'2026-09-01',done:true,topicId:'topic-1',source:'curriculum'},
      {id:'r3',date:'2026-09-13',done:true,topicId:'topic-1',source:'spaced_review',reviewWave:3,reviewBaseTaskId:'base'},
      {id:'r7',date:'2026-09-17',done:true,topicId:'topic-1',source:'spaced_review',reviewWave:7,reviewBaseTaskId:'base'}
    ],
    logs:[{id:'base-log',sessionId:'base',date:'2026-09-10'}],
    mistakes:[]
  };
  const R={topic:(_w,id)=>id==='topic-1'?{id,subjectId:'k-ma'}:null,dayAdd:(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return x.toISOString().slice(0,10);}};
  const w=()=>space;
  const routePlanEvidenceDate=(task,sp=space)=>{
    const log=sp.logs.filter(l=>l.sessionId===task.id).sort((a,b)=>b.date.localeCompare(a.date))[0];
    return log?.date||task.date||'';
  };
  let outcome={known:false,total:0,recent:'',trend:0,stuckRate:0};
  let practice={known:true,sessions:1,answered:20,weightedAccuracy:.90,accuracy:.90,recentAccuracy:.90};
  const evidenceSince=[];
  const routeOutcomeSignal=(_subject,_topic,since)=>{evidenceSince.push(['outcome',since]);return outcome;};
  const routePracticeSignal=(_subject,_topic,since)=>{evidenceSince.push(['practice',since]);return practice;};
  const mastery=new Function('R','w','routeOutcomeSignal','routePracticeSignal','routePlanEvidenceDate',src+';return routeTopicMasterySignal;')(R,w,routeOutcomeSignal,routePracticeSignal,routePlanEvidenceDate);

  const oneSet=mastery('topic-1');
  assert.equal(oneSet.baseDate,'2026-09-10','Mastery must anchor to the actual logged study day');
  assert.ok(evidenceSince.every(x=>x[1]==='2026-09-10'),'Mastery performance evidence must start at the current base study date');
  assert.equal(oneSet.review3,true);
  assert.equal(oneSet.review7,true);
  assert.equal(oneSet.ready,false,'One strong practice set must not be enough for mastery');
  assert.equal(oneSet.progress,3);
  assert.equal(oneSet.next,'En az 2 performans kaydı');

  practice={known:true,sessions:2,answered:35,weightedAccuracy:.84,accuracy:.83,recentAccuracy:.82};
  const ready=mastery('topic-1');
  assert.equal(ready.ready,true);
  assert.equal(ready.progress,4);
  assert.equal(ready.next,'Tamamlanmaya hazır');

  // A nominal "3-day review" completed before three real days passed must not count.
  space.plan.find(p=>p.id==='r3').date='2026-09-12';
  const tooEarly=mastery('topic-1');
  assert.equal(tooEarly.review3,false);
  assert.equal(tooEarly.ready,false);
  assert.equal(tooEarly.next,'3 gün tekrarı');
  space.plan.find(p=>p.id==='r3').date='2026-09-13';

  // A review linked to an older base cycle must not validate a newer base cycle.
  space.plan.push({id:'new-base',date:'2026-09-15',done:true,topicId:'topic-1',source:'curriculum'});
  const newCycle=mastery('topic-1');
  assert.equal(newCycle.baseTaskId,'new-base');
  assert.equal(newCycle.review3,false);
  assert.equal(newCycle.review7,false);
  assert.equal(newCycle.ready,false);
  space.plan.pop();

  space.mistakes.push({topicId:'topic-1',resolved:false});
  const blocked=mastery('topic-1');
  assert.equal(blocked.ready,false);
  assert.equal(blocked.next,'Açık yanlışı çöz');

  space.mistakes=[];
  practice={known:false,sessions:0,answered:0,weightedAccuracy:0,accuracy:0,recentAccuracy:0};
  outcome={known:true,total:2,recent:'ok',trend:.2,stuckRate:0};
  assert.equal(mastery('topic-1').ready,true,'Two consistent feedback records may validate mastery when practice detail is unavailable');
}

// 4) Spaced reviews must use actual study date and productive struggle must not trigger repair.
{
  const src=between('function routeSessionPerformanceSignal','function routeTopicFrontier');
  const space={
    plan:[
      {id:'base',date:'2026-09-10',done:true,subjectId:'k-ma',topicId:'topic-1',source:'curriculum'},
      {id:'review',date:'2026-09-13',done:false,subjectId:'k-ma',topicId:'topic-1',source:'spaced_review',kind:'review',reviewWave:3,priority:68,title:'3 gün tekrarı'}
    ],
    logs:[{id:'log-base',sessionId:'base',date:'2026-09-18',subjectId:'k-ma',correct:9,wrong:1,outcome:'stuck',updated:2}]
  };
  const R={dayAdd:(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return x.toISOString().slice(0,10);}};
  const today=()=> '2026-09-19';
  const routeIsReviewLike=p=>p.kind==='review'||p.source==='spaced_review';
  const routeReviewGoal=()=>({minutes:20,questions:8,text:'review recipe'});
  const routeSubjectAdaptiveState=()=>({mode:'steady',scope:'topic',confidence:50});
  const routeBacklogDailyLimit=()=>30,routeEffectiveDailyMinutes=()=>120,routeStudyMethod=()=>({label:'SORU + YANLIŞ ANALİZİ'});
  const api=new Function('w','R','today','routeIsReviewLike','routeReviewGoal','routeSubjectAdaptiveState','routeBacklogDailyLimit','routeEffectiveDailyMinutes','routeStudyMethod',src+';return {routeSessionPerformanceSignal,routePlanEvidenceDate,routeReviewAnchorDate,routeCandidateFromPlan};')(()=>space,R,today,routeIsReviewLike,routeReviewGoal,routeSubjectAdaptiveState,routeBacklogDailyLimit,routeEffectiveDailyMinutes,routeStudyMethod);

  const perf=api.routeSessionPerformanceSignal(space.logs[0]);
  assert.equal(perf.productiveStruggle,true);
  assert.equal(perf.repair,false,'High-accuracy struggle must not create a 1-day repair');
  assert.equal(api.routePlanEvidenceDate(space.plan[0],space),'2026-09-18','Actual logged study date must override the old planned date');
  const candidate=api.routeCandidateFromPlan(space.plan[1]);
  assert.equal(candidate.source,'spaced_review','An overdue-looking review must not degrade into a generic backlog task');
  assert.equal(candidate.earliest,'2026-09-21','3-day review must be anchored to actual study date');
  assert.equal(candidate.taskGoal,'review recipe');
}


// 5) Deneme Merkezi pilots must be original, internally valid and isolated from full-exam net records.
{
  const src=between('const ROTA_MINI_EXAMS','function miniExamDefinition');
  const data=new Function(src+';return {ROTA_MINI_EXAMS,OFFICIAL_EXAM_RESOURCES};')();
  assert.equal(data.ROTA_MINI_EXAMS.length,7);
  assert.deepEqual(data.ROTA_MINI_EXAMS.map(x=>x.id),['kpss-problemler-01','yks-paragraf-01','kpss-tarih-01','kpss-cografya-01','tyt-biyoloji-hucre-01','ayt-edebiyat-tanzimat-01','ydt-grammar-01']);
  for(const exam of data.ROTA_MINI_EXAMS){
    assert.ok(exam.questions.length>=8,exam.id+' should contain at least 8 pilot questions');
    assert.equal(new Set(exam.questions.map(q=>q.id)).size,exam.questions.length,'Question ids must be unique');
    for(const q of exam.questions){
      assert.equal(q.options.length,5);
      assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length,'Answer key must point to an option');
      assert.ok(q.explanation.length>=8,'Every question needs an explanation');
    assert.equal(exam.version,1,'Every mini set must have a version');
    }
  }
  assert.ok(data.OFFICIAL_EXAM_RESOURCES.yks.some(x=>/mebi\.eba\.gov\.tr/.test(x.url)));
  assert.ok(data.OFFICIAL_EXAM_RESOURCES.yks.some(x=>/osym\.gov\.tr/.test(x.url)));
  assert.ok(data.OFFICIAL_EXAM_RESOURCES.kpss.every(x=>/osym\.gov\.tr/.test(x.url)));
}

// 5) Recommendation scoring should favor unresolved repair needs and avoid same-day repetition.
{
  const src=between('function miniRecommendationScore','function miniExamDefinition');
  const api=new Function('today',src+';return {miniRecommendationScore};')(()=> '2026-09-19');
  const repair=api.miniRecommendationScore(null,{mode:'repair',repairScore:4},999);
  const steady=api.miniRecommendationScore(null,{mode:'steady',repairScore:0},999);
  assert.ok(repair>steady,'Repair mini should outrank a neutral unsolved mini');
  const repeatedToday=api.miniRecommendationScore({total:10,correct:4},{mode:'repair',repairScore:4},0);
  assert.ok(repeatedToday<repair,'Same-day repeat should be penalized');
}
// 5) Mini scoring must distinguish correct, wrong and blank answers.
{
  const src=between('function scoreMiniExam','function latestMiniResult');
  const scoreMiniExam=new Function(src+';return scoreMiniExam;')();
  const def={questions:[
    {answer:1},{answer:0},{answer:2}
  ]};
  const score=scoreMiniExam(def,[1,2,-1]);
  assert.equal(score.total,3);
  assert.equal(score.correct,1);
  assert.equal(score.wrong,1);
  assert.equal(score.blank,1);
}

// 5) Mini assessments feed topic practice evidence without becoming full TYT/KPSS exams.
{
  const src=between('function routeAssessmentSamples','function routeFeedbackCalibrationSignal');
  const space={
    plan:[],
    logs:[],
    assessments:[{id:'a1',miniId:'kpss-problemler-01',date:'2026-09-19',subjectId:'k-ma',topicId:'m1',correct:7,wrong:3,created:1}]
  };
  const R={dayAdd:()=> '2026-08-29'};
  const today=()=> '2026-09-19';
  const w=()=>space;
  const api=new Function('R','today','w',src+';return {routeAssessmentSamples,routePracticeSignal};')(R,today,w);
  assert.equal(api.routeAssessmentSamples('k-ma','m1').length,1);
  const practice=api.routePracticeSignal('k-ma','m1');
  assert.equal(practice.known,true);
  assert.equal(practice.sessions,1);
  assert.equal(practice.answered,10);
  assert.equal(Math.round(practice.accuracy*100),70);
}


// 5) Same-day retakes of one mini must not multiply practice evidence.
{
  const src=between('function routeAssessmentSamples','function routePracticeSignal');
  const space={assessments:[
    {id:'old',miniId:'m1',date:'2026-09-19',subjectId:'k-ma',topicId:'t1',correct:2,wrong:8,created:1},
    {id:'new',miniId:'m1',date:'2026-09-19',subjectId:'k-ma',topicId:'t1',correct:8,wrong:2,created:2},
    {id:'next',miniId:'m1',date:'2026-09-20',subjectId:'k-ma',topicId:'t1',correct:7,wrong:3,created:3}
  ]};
  const w=()=>space;
  const fn=new Function('w',src+';return routeAssessmentSamples;')(w);
  const xs=fn('k-ma','t1');
  assert.equal(xs.length,2);
  assert.ok(xs.some(x=>x.id==='assessment-new'));
  assert.ok(!xs.some(x=>x.id==='assessment-old'));
}
// 5) Guard Deneme Merkezi persistence and integration against accidental regression.
for(const marker of [
  'assessments:[]',
  'w.assessments=Array.isArray(old.assessments)',
  'space.assessments=Array.isArray(space.assessments)',
  'function routeAssessmentSamples',
  'w().assessments.push(result)',
  'version:def.version||1',
  'answers,created:Date.now()',
  'function miniAttemptById',
  'function openMiniAttemptResult',
  'mini-result-detail',
  'Rota Mini Deneme sonucu ders ve konu performansına eklendi',
  'DENEME MERKEZİ · BETA',
  'KPSS Problemler Mini #01',
  'TYT Paragraf Mini #01',
  'KPSS İnkılap Tarihi Mini #01',
  "KPSS Türkiye'nin Konumu Mini #01",
  'TYT Biyoloji Hücre Mini #01',
  'AYT Tanzimat Edebiyatı Mini #01',
  'YDT Grammar Mini #01',
  'ROTA’NIN ÖNERİSİ',
  'function miniRecommendationScore',
  'function miniRecommendation',
  'Rota kararı',
  'MEBİ 2026–2027 Türkiye Geneli YKS Denemeleri',
  'ÖSYM 2026 YKS Temel Soru Kitapçıkları',
  'Telifli soruları Çalışma Rotası içine kopyalamıyoruz'
]) assert.ok(html.includes(marker),`Missing Deneme Merkezi marker: ${marker}`);
assert.ok(!html.includes('w().exams.push(result)'),'Mini result must never be stored as a full exam');
// 4) Guard core personalization features against accidental removal.
for(const marker of [
  'routeObservedNet',
  'function routeAssessmentSamples',
  'eskime payıyla',
  'function routeGapPressure',
  'Math.round(base*freshness)',
  'examFreshness=weak?.freshness??1',
  'function routeExamEvidenceFactor',
  "C.PART_SUBJECTS[exam.type]",
  "C.PART_SUBJECTS[type]",

  'freshness',
  'function routeExamFreshness',
  'ölçümünü yenile',
  'age>=14&&studySince>=4',
  'routeStageGap',
  'routeConsistencySignal',
  'routeBehaviorSignal',
  "ev.taskId===taskId&&ev.action===action&&ev.date===date",
  "const wasDone=!!p.done",
  "existing?!!session?.done",
  "outcome:''",
  'routePracticeSignal',
  'routeTargetAttainmentSignal',
  'hedef hacmin altında',
  'weightedAccuracy',
  "routeOutcomeSignal(t.subjectId,topicId,baseDate)",
  "routePracticeSignal(t.subjectId,topicId,baseDate)",
  'routeFeedbackCalibrationSignal',
  'routeSessionPerformanceSignal',
  'routeInvalidateBaseReviews',
  "routeInvalidateBaseReviews(p.id)",
  "Planlı görev kaydı değiştiği için bağlı tekrarlar",
  'routePlanEvidenceDate',
  'routeReviewAnchorDate',
  'reviewBaseTaskId',
  'Fiilî çalışma gününden',
  'rahat hissetme + düşük doğruluk',
  'routeDifficultySignal',
  'routeDifficultyPrescription',
  'Tekrar odağı:',
  "reviewVariant:'challenge'",
  'SEVİYE YOKLAMA',
  'challengeReady',
  "performance.challenge",
  'Zorlandıysan en çok nerede?',
  'Sinyal güveni',
  'const waves=needsRepair?[1,3,7]:[3,7]',
  'routeHeavyLimit',
  'routeIsQuantitativeHeavy',
  'routeQuantitativeDailyLimit',
  'quantCeiling=day.quantHeavyLimit+(critical?1:0)',
  'routeMaxTaskMinutes',
  'routePaceSignal',
  'extraSessionsPerWeek',
  'extraMinutesPerWorkDay',
  'Kararı sen ver:',
  'Toparlanma telafisi',
  'TAKVİM SIKIŞIK',
  'routeTopicFrontier',
  'routeSequenceRank',
  'routeReviewDailyLimit',
  'routeReviewWeeklyLimit',
  'routeRecoverySignal',
  'function routeLightenToday()',
  'Bugünü hafiflet',
  'erteleme/atlama başarısızlığı olarak sayılmaz',
  'routeBacklogDailyLimit',
  'routeBacklogWeeklyLimit',
  'routeBacklogDailyCountLimit',
  'function routeWeeklyDigest(',
  'Rota kararı',
  'TOPARLANMA MODU',
  'routeIsCriticalReview',
  'latestBaseByTopic',
  'recentWorkedTopics',
  'routeTopicMasterySignal',
  'baseTaskId:baseTask?.id',
  'completed>=due',
  'routeClearCompletedTopicQueue',
  "p.reviewWave===1?'mistake'",
  '(space.topicState[p.topicId]?.status||0)!==2',
  'topic-accept-mastery',
  'topic-mastery-steps',
  'function routeMasteryOverview()',
  'performans kanıtı bekliyor',
  'En az 2 performans kaydı',
  'SÜRELİ ANLAMA SETİ',
  'ZAMAN ÇİZGİSİ + HATIRLAMA'
]) assert.ok(html.includes(marker),`Missing personalization marker: ${marker}`);

console.log('Route engine smoke tests passed.');
