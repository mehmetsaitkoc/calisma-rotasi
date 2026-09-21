import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const externalCatalogJs=fs.readFileSync(new URL('../public/catalog.js',import.meta.url),'utf8');
const externalWorkspaceJs=fs.readFileSync(new URL('../public/workspace-schema.js',import.meta.url),'utf8');
await import('../public/kpss-practice-catalog.js');
const kpssPracticeCatalog=globalThis.RotaKpssPractice;
assert.ok(kpssPracticeCatalog,'KPSS practice catalog must load for route smoke tests');

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
assert.ok(parsed>=4,'Expected executable inline scripts after catalog extraction');

// 1a) Architecture and student-facing contract boundary must stay wired.
for(const marker of [
  '<script src="/route-contracts.js"></script>',
  '<script src="/report-analytics.js"></script>',
  '<script src="/workspace-schema.js"></script>',
  '<script src="/catalog.js"></script>',
  '<script src="/turkish-catalog.js"></script>',
  'ARCHITECTURE BOUNDARY: catalog data',
  'ARCHITECTURE BOUNDARY: route engine + workspace validation',
  'ARCHITECTURE BOUNDARY: application state adapters + UI',
  'function routeModeExplanation',
  'window.RotaContracts?.taskReason',
  'window.RotaContracts?.teacherContextEnvelope',
  'window.RotaContracts?.makeBackupEnvelope',
  'window.RotaContracts?.unwrapBackup',
  'route-mode-explain',
  '<script src="/pilot-metrics.js"></script>',
  '<script src="/mini-catalog.js"></script>',
  '<script src="/kpss-practice-catalog.js"></script>',
  'function miniCatalogInfo',
  'function miniCatalogCoverage',
  'İçerik derinliği iskeleti:',
  'globalThis.RotaPilotMetrics||null',
  'pilotMetrics?.summarize',
  'pilotMetrics?.collectEvents',
  "featureEnabled('monthly_report')",
  "featureEnabled('long_term_trends')",
  'function premiumMonthlyReport',
  'function premiumTrendReport',
  'RotaReportAnalytics',
  'report-trend-bars',
  'report-evidence-badge',
  "featureEnabled('advanced_teacher_insights')",
  "fetch('/api/entitlements'",
  'validateEntitlement',
  'Gelişmiş devamlar Plus',
  'routeRenderDecisionCache',
  'routeDecisionForRender',
  'STUDENT MODEL BOUNDARY',
  'ROUTE SCHEDULER BOUNDARY',
  'ROUTE UI BOUNDARY',
  'routeRenderPerf',
  'window.__rotaRenderPerf=routeRenderPerf',
  "const FRESH_RESET=FRESH_PREVIEW&&QUERY.get('resume')!=='1'",
  'if(FRESH_RESET)',
  'function workspace(exam){return WS.create(exam);}',
  "const WS=root.RotaWorkspaceSchema||(typeof require==='function'?require('./workspace-schema.js'):null);", 
  'WS.assertIdentity(old,e);',
  'const w=WS.migrateIdentity(out.workspaces[e],e),s=old.settings;',
  'w.configured=!!old.configured'
]) assert.ok(html.includes(marker),'Missing architecture/contract marker: '+marker);

{
  const reason=between('function routeTaskReason','function routeTodayTask');
  assert.ok(reason.includes('RotaContracts?.taskReason'),'Task reason must pass through the student-language contract');
  assert.ok(reason.includes('routeModeExplanation'),'Route mode explanation must stay student-facing');
}
{
  const teacher=between('function teacherStudentContext','function teacherRemoteText');
  assert.ok(teacher.includes('teacherContextEnvelope'),'Rota Hoca context must use the shared context envelope');
  for(const field of ['todayPlan','routeDecision','studentModel','mastery','completion'])assert.ok(teacher.includes(field),'Teacher context missing: '+field);
}
for(const marker of [
  'honestFallback:!!j.honestUnavailableFallback',
  "if(!status.ai&&!status.honestFallback)",
  'Rota Hoca tahminî ders cevabı üretmez',
  "!record.answer?._demo&&record.answer.confidence>=.7"
]) assert.ok(html.includes(marker),'Missing honest Rota Hoca client fallback marker: '+marker);
assert.ok(!html.includes("teacherOpenConfigure();throw Error('Ders ve fotoğraf sorularını gerçek çözmek için AI bağlantısını kur.')"),'Teacher submit must not block the server honest-fallback path');
assert.ok(!html.includes("rota-plus:visual-demo"),'Browser storage must not be an entitlement authority');
assert.ok(!html.includes('data-action="paid-tier"'),'Production UI must not expose a client-controlled tier switch');
assert.ok(!html.includes("function changePreviewTier("),'Client code must not self-promote to Plus');
assert.ok(!html.includes("function showActivated("),'Visual checkout must not grant Plus access');


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
  assert.equal(api.routeTaskSourceLabel({source:'mini_repair'}),'MİNİ ONARIM');
  assert.equal(api.routeTaskSourceLabel({source:'spaced_review',reviewWave:3}),'3 GÜN TEKRARI');
  assert.equal(api.routeTaskSourceLabel({source:'spaced_review',reviewWave:3,reviewVariant:'challenge'}),'SEVİYE YOKLAMA');
}

// 2b) Base generatePlan must turn onboarding profile, target gap, recency and exam evidence into real tasks.
{
  for(const marker of [
    'function planSubjectGap','function planSubjectLevel','function planLatestEvidenceDate','function planExamWeakness',
    'function planTopicSignal','function planTaskMinutes','targetQuestions:questions',
    "kind:'route'","source:pick.signal.source","reason:pick.signal.reason","weekSubjectCount","daySubjectCount"
  ]) assert.ok(html.includes(marker),`Missing generatePlan personalization marker: ${marker}`);
  const core=between('function planDaysBetween','function safeUrl');
  const C={
    TYPES:{KPSS:{exam:'kpss'}},
    PART_SUBJECTS:{KPSS:{Matematik:['k-ma'],Tarih:['k-ta']}},
    subjects:[
      {id:'k-ma',exam:'kpss',stage:'GY',name:'Matematik',tracks:[],topics:[{id:'m1',subjectId:'k-ma',title:'Temel kavramlar'},{id:'m2',subjectId:'k-ma',title:'Problemler'}]},
      {id:'k-ta',exam:'kpss',stage:'GK',name:'Tarih',tracks:[],topics:[{id:'t1',subjectId:'k-ta',title:'İlk Türk devletleri'},{id:'t2',subjectId:'k-ta',title:'Osmanlı'}]}
    ]
  };
  let seq=0;const uid=()=> 'g'+(++seq),validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v),dayAdd=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return x.toISOString().slice(0,10);};
  const courses=()=>C.subjects,allTopics=()=>C.subjects.flatMap(s=>s.topics);
  const api=new Function('C','uid','validDate','dayAdd','courses','allTopics',core+';return {generatePlan,planSubjectGap,planTaskMinutes};')(C,uid,validDate,dayAdd,courses,allTopics);
  const w={settings:{track:'lisans',dailyMinutes:90,days:[0,1,2,3,4,5,6],priorities:[]},profile:{currentNet:55,targetNet:85,subjectLevels:{'k-ma':0,'k-ta':3}},topicState:{},customTopics:[],plan:[],logs:[],assessments:[],mistakes:[],exams:[{id:'e1',type:'KPSS',date:'2026-09-18',penalty:4,parts:[{label:'Matematik',total:30,correct:10,wrong:8},{label:'Tarih',total:27,correct:22,wrong:2}]}]};
  const out=api.generatePlan(w,'kpss','2026-09-20');
  assert.ok(out.added>=2);
  const math=out.plan.find(p=>p.subjectId==='k-ma'),history=out.plan.find(p=>p.subjectId==='k-ta');
  assert.ok(math&&history);
  assert.ok(math.priority>history.priority,'Weak subject + net gap + exam evidence must outrank strong subject');
  assert.ok(math.minutes>history.minutes,'Weak subject must receive a larger initial dose than a strong subject');
  assert.match(math.reason,/30 net|çok zayıf|deneme/i);
  assert.ok(Number.isInteger(math.targetQuestions)&&math.targetQuestions>0);
  for(const date of new Set(out.plan.map(p=>p.date))){
    const used=out.plan.filter(p=>p.date===date).reduce((n,p)=>n+p.minutes+5,0);assert.ok(used<=w.settings.dailyMinutes,'generatePlan must preserve daily minute limit');
  }
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

// 4) Applied decision must never expose raw progress when calibrated progression is not actually applied.
{
  const src=between('function routeProgressHoldFromSignals','function routeStudentOverview');
  let studentState='steady',recoveryActive=false,previous=null;
  const routeSubjectAdaptiveState=()=>({mode:'progress',label:'GELİŞİM MODU',note:'raw',confidence:90,evidence:['yüksek doğruluk'],repairScore:0,progressScore:6});
  const routeStudentModel=()=>({state:studentState,label:studentState==='progress'?'GELİŞİM DOĞRULANIYOR':'DENGELİ İLERLEME',nextAction:'dozu koru',confidence:88,performance:82,learningNeed:12,openMistakes:0,retention:90,execution:90,trend:{known:false},personalNorm:{known:false}});
  const routeRecoverySignal=()=>({active:recoveryActive});
  const routeLatestModeDecision=()=>previous;
  const routeEnsure=()=>{},w=()=>({route:{modeHistory:[]}});
  const fn=new Function('routeSubjectAdaptiveState','routeStudentModel','routeRecoverySignal','routeLatestModeDecision','routeEnsure','w',src+';return routeAppliedDecision;')(
    routeSubjectAdaptiveState,routeStudentModel,routeRecoverySignal,routeLatestModeDecision,routeEnsure,w
  );
  const held=fn('k-ma','m1');
  assert.equal(held.rawMode,'progress');
  assert.equal(held.mode,'steady');
  assert.equal(held.label,'DENGELİ İLERLEME');
  assert.match(held.note,/GELİŞİM kararını henüz doğrulamadığı/i);
  assert.ok(held.evidence.some(x=>/kalibre Öğrenci Modeli/i.test(x)));
  studentState='progress';
  assert.equal(fn('k-ma','m1').mode,'progress');
  recoveryActive=true;
  assert.equal(fn('k-ma','m1').mode,'steady');
}

// 4) Recovery must suppress progression load increases without erasing the strong-performance signal.
{
  const src=between('function routeQuestionTarget','function routeReviewGoal');
  let recoveryActive=false,studentState='steady';
  const w=()=>({profile:{subjectLevels:{'k-ma':2}}});
  const routeSubjectGap=()=>({known:false,gap:0});
  const routeStudyMethod=()=>({key:'quant',label:'SORU + YANLIŞ ANALİZİ'});
  const routeAppliedDecision=()=>studentState==='progress'&&!recoveryActive
    ?{mode:'progress',rawMode:'progress',label:'GELİŞİM MODU',calibration:{},skillWeakness:{primary:null}}
    :{mode:'steady',rawMode:'progress',label:'DENGELİ TEMPO',calibration:{},skillWeakness:{primary:null}};
  const routeRecoverySignal=()=>({active:recoveryActive});
  const routeEffectiveDifficulty=()=>({known:false});
  const routeMaxTaskMinutes=()=>120;
  const routeDifficultyPrescription=()=> '';
  const routeInterventionPolicyAdjustment=()=>({action:'hold'});
  const routeErrorMemorySignal=()=>({primary:null});
  const api=new Function(
    'w','routeSubjectGap','routeStudyMethod','routeAppliedDecision','routeRecoverySignal',
    'routeEffectiveDifficulty','routeMaxTaskMinutes','routeDifficultyPrescription',
    'routeInterventionPolicyAdjustment','routeErrorMemorySignal',
    src+';return {routeQuestionTarget,routeTaskGoal};'
  )(
    w,routeSubjectGap,routeStudyMethod,routeAppliedDecision,routeRecoverySignal,
    routeEffectiveDifficulty,routeMaxTaskMinutes,routeDifficultyPrescription,
    routeInterventionPolicyAdjustment,routeErrorMemorySignal
  );
  const unverifiedQuestions=api.routeQuestionTarget('k-ma','t1','x');
  const unverifiedGoal=api.routeTaskGoal('k-ma','t1','x');
  assert.equal(unverifiedQuestions,16,'Raw adaptive progress must not add questions before Student Model progression is corroborated');
  assert.equal(unverifiedGoal.minutes,35,'Raw adaptive progress must not add minutes before Student Model progression is corroborated');
  assert.match(unverifiedGoal.text,/doğrulanmış GELİŞİM kararı oluşmadan/i);
  studentState='progress';
  const normalQuestions=api.routeQuestionTarget('k-ma','t1','x');
  const normalGoal=api.routeTaskGoal('k-ma','t1','x');
  recoveryActive=true;
  const recoveryQuestions=api.routeQuestionTarget('k-ma','t1','x');
  const recoveryGoal=api.routeTaskGoal('k-ma','t1','x');
  assert.ok(normalQuestions>unverifiedQuestions,'Corroborated progress may add questions in normal mode');
  assert.ok(normalGoal.minutes>unverifiedGoal.minutes,'Corroborated progress may add minutes in normal mode');
  assert.equal(recoveryQuestions,16,'Recovery must preserve the base question dose instead of progress +2');
  assert.equal(recoveryGoal.minutes,35,'Recovery must preserve the base duration instead of progress +5');
  assert.match(recoveryGoal.text,/toparlanma modu açıkken dozu büyütmeden/i);
}
{
  const candidate=between('function routeCandidateFromPlan','function routeTopicFrontier');
  const build=between('function routeBuildCandidates','function routeConsistencySignal');
  assert.ok(candidate.includes("p.reviewVariant==='challenge'&&!routeRecoverySignal().active&&routeStudentModel(p.subjectId,p.topicId).state==='progress'"),'Existing challenge review must require current corroborated progression and downgrade otherwise');
  assert.ok(candidate.includes("!routeRecoverySignal().active&&routeStudentModel(p.subjectId,p.topicId).state==='progress'"),'7-day review may only become challenge with current corroborated progression');
  assert.ok(build.includes("challengeReady=!recovery.active&&!needsRepair&&student.state==='progress'"),'New challenge review generation must require corroborated progression and stay disabled during recovery');
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

// 4) A new learning cycle must make older open review waves ineligible.
{
  const src=between('function routeLatestBaseCycle','function routeTopicFrontier');
  const space={plan:[
    {id:'old-base',date:'2026-09-01',done:true,topicId:'topic-1',source:'curriculum'},
    {id:'old-r3',date:'2026-09-04',done:false,topicId:'topic-1',source:'spaced_review',reviewWave:3,reviewBaseTaskId:'old-base'},
    {id:'new-base',date:'2026-09-18',done:true,topicId:'topic-1',source:'curriculum'}
  ],logs:[]};
  const routePlanEvidenceDate=p=>p.date;
  const api=new Function(
    'w','routePlanEvidenceDate','routeSubjectAdaptiveState','routeReviewAnchorDate','today','R','routeIsReviewLike',
    'routeReviewGoal','routeTaskGoal','routeRecoverySignal','routeBacklogDailyLimit','routeEffectiveDailyMinutes','routeStudyMethod',
    src+';return {routeLatestBaseCycle,routeCandidateFromPlan};'
  )(
    ()=>space,routePlanEvidenceDate,()=>({mode:'steady'}),()=>'',()=> '2026-09-19',
    {dayAdd:(d,n)=>d,topic:()=>({title:'x'})},()=>true,()=>({minutes:20,questions:8,text:'x'}),
    ()=>({minutes:30,questions:10,text:'x'}),()=>({active:false}),()=>30,()=>120,()=>({label:'x'})
  );
  assert.equal(api.routeLatestBaseCycle('topic-1').task.id,'new-base');
  assert.equal(api.routeCandidateFromPlan(space.plan[1]),null,'Old-cycle open review must not coexist with a newer base cycle');
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
  let recoveryActive=true;
  const routeRecoverySignal=()=>({active:recoveryActive,severe:false,overdue:3});
  const api=new Function('R','today','w','routeRecoverySignal','routeLearningSummaryItems',src+';return {routePeriodStats,routeWeeklyDigest};')(R,today,()=>space,routeRecoverySignal,()=>[]);
  const d=api.routeWeeklyDigest([]);
  assert.equal(d.current.minutes,70);
  assert.equal(d.current.questions,30);
  assert.equal(Math.round(d.current.accuracy*100),73);
  assert.equal(d.current.activeDays,2);
  assert.equal(d.title,'Toparlanma modu açık');
  assert.match(d.decision,/backlog|Aksayan/i);
  recoveryActive=false;
  const retention=api.routeWeeklyDigest([{name:'Matematik',mode:'steady',state:'retention'}]);
  assert.equal(retention.title,'Kalıcılığı güçlendiriyoruz');
  assert.match(retention.decision,/tekrar|geri çağırma/i);
  const collect=api.routeWeeklyDigest([
    {name:'Matematik',mode:'steady',state:'collect'},
    {name:'Türkçe',mode:'steady',state:'collect'}
  ]);
  assert.equal(collect.title,'Veri topluyoruz');
  assert.match(collect.decision,/doğru\/yanlış|kanıt/i);
}

// 4) Normal review load is capped, while urgent repair work can bypass that cap.
{
  const src=between('function routeIsReviewLike','function routeQuestionTarget');
  const api=new Function(src+';return {routeIsReviewLike,routeIsCriticalReview,routeReviewDailyLimit,routeReviewWeeklyLimit};')();
  assert.equal(api.routeIsReviewLike({source:'spaced_review',kind:'review'}),true);
  assert.equal(api.routeIsCriticalReview({source:'spaced_review',reviewWave:1,priority:78}),true);
  assert.equal(api.routeIsCriticalReview({source:'spaced_review',reviewWave:3,priority:68}),false);
  assert.equal(api.routeIsCriticalReview({source:'mistake',priority:88}),true);
  assert.equal(api.routeIsCriticalReview({source:'mini_repair',priority:84}),true);
  assert.equal(api.routeReviewDailyLimit(30),30);
  assert.equal(api.routeReviewDailyLimit(120),60);
  assert.equal(api.routeReviewWeeklyLimit(150),70);
}

// 4) Structured error memory must preserve legacy notes and detect recurring failure patterns.
{
  const src=between('const ROUTE_ERROR_TYPES','function routeEvidenceFreshness');
  const R={dayAdd:()=> '2026-08-05',iso:d=>d.toISOString().slice(0,10)},today=()=> '2026-09-19';
  const space={mistakes:[
    {subjectId:'k-ma',topicId:'t1',cause:'Yöntem / işlem hatası',reviewDate:'2026-09-17',resolved:false,created:new Date('2026-09-17T12:00:00').getTime()},
    {subjectId:'k-ma',topicId:'t1',errorType:'process',cause:'Yöntem / işlem hatası',reviewDate:'2026-09-18',resolved:false,created:new Date('2026-09-18T12:00:00').getTime()}
  ],logs:[{subjectId:'k-ma',sessionId:'s1',date:'2026-09-19',difficulty:'process',outcome:'stuck'}],plan:[{id:'s1',topicId:'t1'}]};
  const api=new Function('R','today','w',src+';return {routeLegacyErrorType,routeErrorMemorySignal};')(R,today,()=>space);
  assert.equal(api.routeLegacyErrorType('Bilgi eksiği'),'concept');
  const m=api.routeErrorMemorySignal('k-ma','t1');
  assert.equal(m.primary.type,'process');
  assert.equal(m.repeated,true);
  assert.equal(m.primary.count,3);
}
for(const marker of ['ROUTE_ERROR_TYPES','function routeErrorMemorySignal','errorType,note:','created:old?.created||Date.now()','errorPattern']) assert.ok(html.includes(marker),`Missing error-memory marker: ${marker}`);

// 4) Learning velocity must compare a topic with the student's own evidence history.
{
  const src=between('function routeTopicPerformanceSamples','function routeEvidenceFreshness');
  const api=new Function('w','R','state','routeAssessmentSamples',src+';return {routeVelocityClassify};')(()=>({plan:[],logs:[]}),{allTopics:()=>[]},{activeExam:'kpss'},()=>[]);
  const fast=api.routeVelocityClassify({known:true,samples:3,sessionsToCompetency:2,gainPerEvidence:.15,lastAccuracy:.84},[4,5,4]);
  const slow=api.routeVelocityClassify({known:true,samples:5,sessionsToCompetency:6,gainPerEvidence:.03,lastAccuracy:.79},[3,4,3]);
  assert.equal(fast.key,'fast');
  assert.equal(fast.relative,true);
  assert.equal(slow.key,'slow');
}
for(const marker of ['function routeLearningVelocityRaw','function routeLearningVelocitySignal','velocityLabel','velocity.key===\'slow\'']) assert.ok(html.includes(marker),`Missing learning-velocity marker: ${marker}`);

// 4) Personal norm must compare the student with their own history, never with a universal cutoff alone.
{
  const src=between('function routeAccuracyAcrossSamples','function routeEvidenceFreshness');
  const api=new Function('w','routeAssessmentSamples','routeTopicPerformanceSamples',src+';return {routePersonalNormFromSamples,routeConfidenceCalibrationFromSignals};')(()=>({plan:[],logs:[]}),()=>[],()=>[]);
  const S=(accuracy,answered=10)=>({accuracy,answered});
  const own=api.routePersonalNormFromSamples([S(.55),S(.60),S(.73),S(.79)],[]);
  assert.equal(own.known,true);
  assert.equal(own.scope,'topic');
  assert.equal(own.direction,'up');
  assert.ok(own.delta>=.18,'Recent topic performance should be compared with the student\'s earlier topic baseline');

  const fallback=api.routePersonalNormFromSamples([S(.72),S(.76)],[S(.58),S(.61),S(.63),S(.60)]);
  assert.equal(fallback.known,true);
  assert.equal(fallback.scope,'subject','When topic history is short, the student\'s same-subject history may be the fallback norm');
  assert.equal(fallback.direction,'up');

  const one=api.routePersonalNormFromSamples([S(.90)],[S(.55),S(.60),S(.65)]);
  assert.equal(one.known,false,'One strong session must never create a personal-normal conclusion');

  const singleSource=api.routeConfidenceCalibrationFromSignals({rawConfidence:80,sourceCount:1,practiceAccuracy:80});
  assert.equal(singleSource.confidence,35,'One evidence family must not produce high confidence');
  const agreeing=api.routeConfidenceCalibrationFromSignals({rawConfidence:78,sourceCount:4,practiceAccuracy:78,examAccuracy:74});
  const conflicting=api.routeConfidenceCalibrationFromSignals({rawConfidence:78,sourceCount:4,practiceAccuracy:88,examAccuracy:50,examFreshness:1});
  const staleConflict=api.routeConfidenceCalibrationFromSignals({rawConfidence:78,sourceCount:4,practiceAccuracy:88,examAccuracy:50,examFreshness:.35});
  assert.equal(agreeing.confidence,78);
  assert.ok(conflicting.confidence<agreeing.confidence,'Contradictory practice/exam evidence must reduce calibrated confidence');
  assert.ok(conflicting.disagreementPenalty>=12);
  assert.ok(staleConflict.disagreementPenalty<conflicting.disagreementPenalty,'Old exam evidence must not penalize confidence as strongly as fresh contradictory evidence');
  assert.match(staleConflict.reasons[0],/eski deneme/);

  const rolling=api.routePersonalNormFromSamples([S(.10),S(.20),S(.60),S(.62),S(.64),S(.66),S(.68),S(.70),S(.78),S(.80)],[]);
  assert.equal(rolling.baselineSamples,6,'Personal norm baseline must stay bounded to recent history rather than use the entire lifetime');
  assert.ok(rolling.baselineAccuracy>=.60,'Ancient low performance must not dominate a current rolling baseline');
}
for(const marker of [
  'function routePersonalNormSignal',
  'function routeConfidenceCalibrationFromSignals',
  'Kendi normalinin üstünde',
  'Kendi normalinin altında',
  'ham %',
  'kalibre %'
]) assert.ok(html.includes(marker),`Missing personal-norm/calibration marker: ${marker}`);


// 4) Student Model v2 must gate strong decisions by evidence quantity, diversity and freshness.
{
  const src=between('function routeConfidenceCalibrationFromSignals','function routeStudentModel(subjectId');
  const api=new Function(src+';return {routeEvidenceFreshness,routeStudentModelFromSignals};')();
  assert.equal(api.routeEvidenceFreshness(2),1);
  assert.equal(api.routeEvidenceFreshness(10),.75);
  assert.equal(api.routeEvidenceFreshness(45),.35);

  const oneMini=api.routeStudentModelFromSignals({
    practice:{known:true,sessions:1,answered:10,weightedAccuracy:.30,accuracy:.30},
    miniDays:1,practiceLogCount:0,latestDays:0,
    behavior:{known:false,total:0},outcome:{known:false,total:0},
    retention:{known:false,score:null},trend:{known:false,direction:'unknown'},
    calibration:{known:false},skillWeakness:{known:true,weak:[{missed:7}],primary:{skill:'Yüzde'}},
    adaptive:{mode:'repair'},openMistakes:0,difficultyKnown:false
  });
  assert.ok(oneMini.learningNeed>=65,'One bad mini may reveal a meaningful learning need');
  assert.ok(oneMini.confidence<30,'One mini must not create high confidence');
  assert.ok(oneMini.priorityBoost<=3,'Low-confidence evidence must not dominate scheduling');
  assert.equal(oneMini.state,'collect','Low confidence must stay in data-collection state even when the result is poor');

  const multi=api.routeStudentModelFromSignals({
    practice:{known:true,sessions:4,answered:55,weightedAccuracy:.52,accuracy:.54},
    miniDays:3,practiceLogCount:3,latestDays:1,
    behavior:{known:true,total:5,completion:.8,friction:.1},
    outcome:{known:true,total:4},retention:{known:true,score:55},
    trend:{known:true,direction:'down',delta:-.10},
    calibration:{known:true,hiddenGap:1,productiveStruggle:0,alignedStrong:0,alignedStruggle:1},
    skillWeakness:{known:true,weak:[{missed:4},{missed:2}],primary:{skill:'Oran-orantı'}},
    weak:{ratio:.50,samples:2,freshness:1},adaptive:{mode:'repair'},openMistakes:2,difficultyKnown:true,attainmentRatio:.8
  });
  assert.ok(multi.confidence>55,'Multiple independent fresh signals should raise confidence');
  assert.ok(multi.learningNeed>oneMini.learningNeed-10);
  assert.ok(multi.priorityBoost>oneMini.priorityBoost,'High-confidence repeated weakness should influence priority more');
  assert.equal(multi.state,'repair');
  assert.match(multi.nextAction,/Oran-orantı/);

  const productive=api.routeStudentModelFromSignals({
    practice:{known:true,sessions:3,answered:30,weightedAccuracy:.90,accuracy:.90},
    miniDays:0,practiceLogCount:3,latestDays:1,
    behavior:{known:true,total:4,completion:.9,friction:.05},outcome:{known:true,total:3},
    retention:{known:true,score:85},trend:{known:true,direction:'flat',delta:.01},
    calibration:{known:true,hiddenGap:0,productiveStruggle:2,alignedStrong:0,alignedStruggle:0},
    skillWeakness:{known:false,weak:[],primary:null},adaptive:{mode:'steady'},openMistakes:0,difficultyKnown:true,attainmentRatio:1
  });
  assert.notEqual(productive.state,'repair','Hard-feeling but high-accuracy work must not be treated as failure');
  assert.match(productive.calibrationLabel,/Efor yüksek, performans güçlü/);

  const normBase={
    practice:{known:true,sessions:4,answered:40,weightedAccuracy:.72,accuracy:.72},
    practiceLogCount:4,miniDays:2,latestDays:1,
    behavior:{known:true,total:4,completion:.8},outcome:{known:true,total:3},
    retention:{known:true,score:70},skillWeakness:{known:false,weak:[]},
    weak:{ratio:.70,samples:2,freshness:1},adaptive:{mode:'steady'},openMistakes:0,difficultyKnown:true,
    errorMemory:{known:false},velocity:{known:true,key:'steady'}
  };
  const normDown=api.routeStudentModelFromSignals({...normBase,trend:{known:true,direction:'down'},personalNorm:{known:true,direction:'down',confidence:70,delta:-.12,label:'Kendi normalinin altında'}});
  const normDownFlatTrend=api.routeStudentModelFromSignals({...normBase,trend:{known:true,direction:'flat'},personalNorm:{known:true,direction:'down',confidence:70,delta:-.12,label:'Kendi normalinin altında'}});
  const normUp=api.routeStudentModelFromSignals({...normBase,trend:{known:true,direction:'down'},personalNorm:{known:true,direction:'up',confidence:70,delta:.12,label:'Kendi normalinin üstünde'}});
  assert.equal(normDown.learningNeed,normDownFlatTrend.learningNeed,'Personal norm must replace, not double-count, the short trend adjustment when reliable');
  assert.ok(normDown.learningNeed>normUp.learningNeed,'The same raw performance should be interpreted differently relative to the student\'s own baseline');
  assert.ok(normDown.confidence<=normDown.rawConfidence,'Calibration must never inflate confidence above the raw evidence score');

  const stale=api.routeStudentModelFromSignals({
    practice:{known:true,sessions:4,answered:50,weightedAccuracy:.85,accuracy:.85},
    practiceLogCount:4,miniDays:2,latestDays:45,
    behavior:{known:true,total:5,completion:.9},outcome:{known:true,total:3},
    retention:{known:true,score:85},trend:{known:false,direction:'unknown'},calibration:{known:false},
    skillWeakness:{known:false,weak:[],primary:null},adaptive:{mode:'steady'},openMistakes:0,difficultyKnown:false
  });
  assert.ok(stale.confidence<productive.confidence,'Old evidence must lose confidence even when historic performance was strong');
}

// 4) Student Model v2 must be visible and must influence candidate priority only through a bounded boost.
for(const marker of [
  'function routeStudentModelFromSignals',
  'function routeStudentModel(subjectId',
  'function routeStudentModelCard()',
  'ÖĞRENCİ MODELİ v2',
  'routePersonalNormSignal(subjectId,realTopic)',
  '<strong>Kendi normalin:</strong>',
  'confidenceCalibration',
  'student.priorityBoost',
  'Öğrenci Modeli v2 bu konu için',
  'veri eskidikçe güven otomatik düşer'
]) assert.ok(html.includes(marker),`Missing Student Model v2 marker: ${marker}`);

// 4) Decision backtest must distinguish helpful, neutral, harmful and pending outcomes by intervention type.
{
  const src=between('function routeEvaluateInterventionFromMetrics','function routeInterventionFollowup');
  const fn=new Function(src+';return routeEvaluateInterventionFromMetrics;')();
  const repair={mode:'repair',baselineAccuracy:50};
  assert.equal(fn(repair,{age:2,performance:{known:true,accuracy:.80},behavior:{known:false}}).status,'pending');
  assert.equal(fn(repair,{age:4,performance:{known:true,accuracy:.62},behavior:{known:false}}).status,'helpful');
  assert.equal(fn(repair,{age:4,performance:{known:true,accuracy:.40},behavior:{known:false}}).status,'harmful');
  assert.equal(fn(repair,{age:4,performance:{known:true,accuracy:.54},behavior:{known:false}}).status,'neutral');

  const ease={mode:'ease',baselineCompletion:45};
  assert.equal(fn(ease,{age:4,performance:{known:false},behavior:{known:true,completion:.70}}).status,'helpful');
  assert.equal(fn(ease,{age:4,performance:{known:false},behavior:{known:true,completion:.25}}).status,'harmful');

  const progress={mode:'progress',baselineAccuracy:82};
  assert.equal(fn(progress,{age:4,performance:{known:true,accuracy:.79},behavior:{known:false}}).status,'helpful');
  assert.equal(fn(progress,{age:4,performance:{known:true,accuracy:.68},behavior:{known:false}}).status,'harmful');
}

// 4) Long-horizon intervention aggregation must not overreact to one short-window result.
{
  const src=between('function routeInterventionAggregateEvaluations','function routeInterventionFollowup');
  const fn=new Function(src+';return routeInterventionAggregateEvaluations;')();
  const h=(horizon,status,score)=>({horizon,status,score,label:status,reason:status});
  assert.equal(fn([h(7,'harmful',-1)]).status,'pending','A single 7-day harmful result must remain provisional');
  assert.equal(fn([h(7,'helpful',1)]).status,'pending','A single 7-day helpful result must remain provisional');
  assert.equal(fn([h(7,'harmful',-1),h(14,'harmful',-1)]).status,'harmful','Repeated harmful horizons should be confirmed');
  assert.equal(fn([h(7,'helpful',1),h(14,'helpful',1)]).status,'helpful','Repeated helpful horizons should be confirmed');
  assert.equal(fn([h(7,'harmful',-1),h(14,'helpful',1)]).status,'neutral','Conflicting short and medium horizons must not overfit');
  assert.equal(fn([h(7,'neutral',0),h(14,'neutral',0),h(30,'harmful',-1)]).status,'harmful','A mature 30-day harmful result with no helpful horizon should be respected');
  assert.equal(fn([h(7,'neutral',0),h(14,'neutral',0),h(30,'helpful',1)]).status,'helpful','A mature 30-day helpful result with no harmful horizon should be respected');
}

// 4) Intervention audit must record the applied decision, not a raw progress signal that was withheld.
{
  const src=between('function routeRecordInterventions','function routeInterventionEffectSignal');
  const space={route:{interventions:[]},plan:[],logs:[],mistakes:[]};
  const w=()=>space,today=()=> '2026-09-19',R={uid:()=> 'iv1',topic:()=>({id:'m1',subjectId:'k-ma'})};
  const routeEnsure=()=>{},routeAppliedDecision=()=>({mode:'steady',rawMode:'progress',confidence:90,note:'Doz korunuyor'}),
    routeStudentModel=()=>({confidence:90,learningNeed:20}),routePracticeSignal=()=>({known:true,weightedAccuracy:.82,accuracy:.82,answered:20}),
    routeBehaviorSignal=()=>({known:true,completion:.9}),routeStudyMethod=()=>({key:'quant'});
  const fn=new Function('w','today','R','routeEnsure','routeAppliedDecision','routeStudentModel','routePracticeSignal','routeBehaviorSignal','routeStudyMethod',
    src+';return routeRecordInterventions;'
  )(w,today,R,routeEnsure,routeAppliedDecision,routeStudentModel,routePracticeSignal,routeBehaviorSignal,routeStudyMethod);
  fn([{id:'task1',subjectId:'k-ma',topicId:'m1',source:'curriculum',title:'x',date:'2026-09-19'}]);
  assert.equal(space.route.interventions.length,0,'Withheld raw progress must not be stored as a progress intervention');
}

// 4) Intervention history must survive backup and remain a bounded, explicit audit trail.
for(const marker of [
  'interventions:[]',
  'const interventions=Array.isArray(ro.interventions)',
  'function routeRecordInterventions',
  'function routeInterventionEvaluation',
  'function routeInterventionEffectSignal',
  'function routeInterventionBacktestCard',
  'routeRecordInterventions(scheduled)',
  'KARAR GERİ TESTİ'
]) assert.ok(html.includes(marker),`Missing intervention backtest marker: ${marker}`);

// 4) Backtest outcomes may change future prescriptions only after enough evaluated history.
{
  const src=between('function routeInterventionPolicyAdjustment','function routeInterventionBacktestCard');
  const effects=[
    {known:false,total:0,score:0},
    {known:true,total:1,score:-1},
    {known:true,total:3,score:-.67},
    {known:true,total:4,score:.50},
    {known:true,total:4,score:.10}
  ];
  let i=0;const routeInterventionEffectSignal=()=>effects[i++];
  const fn=new Function('routeInterventionEffectSignal',src+';return routeInterventionPolicyAdjustment;')(routeInterventionEffectSignal);
  assert.equal(fn('s','t','repair').action,'hold');
  assert.equal(fn('s','t','repair').action,'hold','A single negative backtest must not trigger an automatic strategy switch');
  assert.equal(fn('s','t','repair').action,'change','Repeated harmful outcomes should trigger a bounded method change');
  assert.equal(fn('s','t','repair').action,'repeat','Repeated helpful outcomes may preserve the successful core method');
  assert.equal(fn('s','t','repair').action,'hold','Mixed outcomes should not overfit');
}
for(const marker of [
  'function routeInterventionPolicyAdjustment',
  "policy.action==='change'",
  'aynı onarım biçimi geçmişte yeterince sonuç vermedi',
  'çekirdek yaklaşımı geçmişte çoğunlukla işe yaradı'
]) assert.ok(html.includes(marker),`Missing bounded intervention-learning marker: ${marker}`);

// 4) Numerical mastery must reward spaced evidence and penalize unresolved errors without replacing the existing binary gate.
{
  const src=between('function routeMasteryScoreFromSignals','function routeTopicLatestEvidenceDate');
  const fn=new Function(src+';return routeMasteryScoreFromSignals;')();
  const weak=fn({base:true,review3:false,review7:false,hasEvidence:true,ready:false,performanceAccuracy:58,retentionScore:45,trend:'down',openMistakes:2,skillMissed:3,errorRepeated:true});
  const strong=fn({base:true,review3:true,review7:true,hasEvidence:true,ready:true,performanceAccuracy:88,retentionScore:86,trend:'up',openMistakes:0,skillMissed:0,errorRepeated:false});
  const oneStrongSession=fn({base:true,review3:true,review7:true,hasEvidence:false,ready:false,performanceAccuracy:96,retentionScore:92,trend:'up',openMistakes:0,skillMissed:0,errorRepeated:false});
  const oneOpenMistake=fn({base:true,review3:true,review7:true,hasEvidence:true,ready:false,performanceAccuracy:94,retentionScore:94,trend:'up',openMistakes:1,skillMissed:0,errorRepeated:false});
  assert.ok(strong.score>weak.score+30);
  assert.ok(strong.score>=82,'Ready mastery must map to a strong numerical score');
  assert.ok(weak.score<55,'Repeated unresolved errors should keep mastery fragile');
  assert.ok(oneStrongSession.score<=68,'A single strong session must not inflate mastery before repeated evidence exists');
  assert.ok(oneOpenMistake.score<=68,'Any unresolved mistake must keep numerical mastery below the strong/ready range');
}
{
  const src=between('function routeForgettingProjection','function routeTopicForgettingSignal');
  const fn=new Function(src+';return routeForgettingProjection;')();
  const fresh=fn({mastery:88,daysSince:2,stabilityDays:24}),old=fn({mastery:88,daysSince:24,stabilityDays:24}),fragile=fn({mastery:70,daysSince:10,stabilityDays:8});
  assert.ok(fresh.retained>old.retained,'Retention estimate must decay as evidence gets older');
  assert.ok(old.retained>fragile.retained,'Higher stability must protect knowledge longer');
  assert.equal(fresh.reviewDue,false,'Recent strong evidence must not immediately create a refresh task');
  assert.equal(fragile.reviewDue,true);
}

// 4) Completed topics may re-enter the route only as bounded retention refresh work; repair/review tasks must not become new base cycles.
for(const marker of [
  "retention_refresh:'KORUMA TEKRARI'",
  "source==='retention_refresh'",
  "function routeRetentionRefreshCandidates",
  "source:'retention_refresh'",
  "Koruma tekrarı · ",
  "['mistake','mini_repair','retention_refresh','spaced_review','checkpoint','ai_teacher']"
]) assert.ok(html.includes(marker),`Missing mastery/forgetting integration marker: ${marker}`);

// 4) Exam risk must combine urgency, mastery/retention and evidence confidence without pretending low-confidence guesses are certain.
{
  const src=between('function routeExamRiskFromSignals','function routeTopicExamRisk');
  const fn=new Function(src+';return routeExamRiskFromSignals;')();
  const strong=fn({confidence:85,masteryScore:88,retained:84,learningNeed:22,daysToTarget:90,openMistakes:0,trend:'up',examWeakRatio:.84,subjectPriority:false,forgettingDue:false,paceStatus:'comfortable',status:2});
  const weak=fn({confidence:85,masteryScore:42,retained:38,learningNeed:78,daysToTarget:30,openMistakes:2,trend:'down',examWeakRatio:.48,subjectPriority:true,forgettingDue:true,paceStatus:'overload',status:1});
  const uncertain=fn({confidence:10,masteryScore:20,retained:20,learningNeed:90,daysToTarget:30,openMistakes:0,trend:'unknown',subjectPriority:false,forgettingDue:false,status:0});
  assert.ok(weak.score>strong.score+30,'Weak, stale and urgent evidence should rank much higher');
  assert.ok(weak.priorityBoost<=8&&weak.priorityBoost>=-2,'Raw risk may only make a bounded adjustment');
  assert.equal(uncertain.priorityBoost,0,'Low-confidence risk must not silently dominate scheduling');
  assert.ok(uncertain.score<=55,'Low-confidence risk must be visibly capped below high-risk bands');
  assert.ok(uncertain.score<weak.score,'Uncertain evidence should remain more conservative than repeated weakness');
  assert.ok(uncertain.reasons.some(x=>/güveni düşük/i.test(x)),'Low-confidence risk must explain why scheduler priority is not raised');
}
{
  const src=between('function routeExamRiskFromSignals','function routeTopicExamRisk');
  const fn=new Function(src+';return routeExamRiskFromSignals;')();
  const far=fn({confidence:80,masteryScore:55,retained:55,learningNeed:65,daysToTarget:180,status:1}),near=fn({confidence:80,masteryScore:55,retained:55,learningNeed:65,daysToTarget:14,status:1}),noTarget=fn({confidence:80,masteryScore:55,retained:55,learningNeed:65,daysToTarget:null,status:1});
  assert.ok(near.score>far.score,'The same learning gap must become more urgent near the target date');
  assert.equal(noTarget.urgency,0,'Missing targetDate must not invent exam urgency');
  assert.ok(near.score>noTarget.score,'A real near target date may add urgency while a missing date may not');
}

// 4) Exam risk must decay stale full-exam evidence independently from otherwise fresh topic evidence.
{
  const src=between('function routeExamRiskFromSignals','function routeTopicExamRisk');
  const fn=new Function(src+';return routeExamRiskFromSignals;')();
  const fresh=fn({confidence:80,masteryScore:55,retained:55,learningNeed:65,daysToTarget:60,status:1,examWeakRatio:.45,examFreshness:1});
  const stale=fn({confidence:80,masteryScore:55,retained:55,learningNeed:65,daysToTarget:60,status:1,examWeakRatio:.45,examFreshness:.35});
  assert.ok(fresh.score>stale.score,'Old weak exam evidence must contribute less risk than equally weak fresh exam evidence');
  assert.equal(stale.examFreshness,.35);
  assert.ok(stale.reasons.some(x=>/eskidiği için etkisi azaltıldı/.test(x)),'Risk explanation must disclose stale-exam discounting');
}

// 4) Scheduler risk boost must be incremental, avoiding double-counting Student Model evidence.
{
  const src=between('function routeExamRiskFromSignals','function routeExamRiskMap');
  const space={settings:{priorities:[]},topicState:{t1:{status:1}}};
  const student={confidence:90,learningNeed:90,openMistakes:2,trend:{direction:'down'},priorityBoost:10};
  const mastery={known:true,score:35,confidence:90,binary:{review3:true,review7:true},retentionSignal:{},latestDate:'2026-09-19'};
  let forgetting={known:true,retained:30,reviewDue:true},targetDays=14;
  const fn=new Function('w','routeStudentModel','routeTopicMasteryScore','routeTopicForgettingSignal','routeExamWeakness','routePaceSignal','routeDaysToTarget',
    src+';return routeTopicExamRisk;'
  )(()=>space,()=>student,()=>mastery,()=>forgetting,()=>({s1:{ratio:.40}}),()=>({known:true,status:'overload'}),()=>targetDays);
  const overlapped=fn('s1','t1',student,{});
  assert.ok(overlapped.rawPriorityBoost>=5,'Raw map risk may be high when several weakness signals align');
  assert.ok(overlapped.priorityBoost<=2,'Scheduler must sharply cap risk when Student Model already contributes a large priority boost');
  targetDays=null;forgetting={known:true,retained:70,reviewDue:false};
  const noIncrement=fn('s1','t1',student,{});
  assert.equal(noIncrement.priorityBoost,0,'Without target urgency or projected forgetting, risk must not re-add the same performance evidence');
}

// 4) Retention refresh and risk integration must stay duplicate-safe and recovery-safe.
{
  const build=between('function routeBuildCandidates','function routeConsistencySignal');
  assert.ok(build.includes("seenTopics.has(t.id)||seenKeys.has(key)"),'Retention refresh must coalesce into any already-open same-topic route work');
  assert.ok(build.includes("space.plan.some(function(p){return !p.done&&p.topicId===t.id&&p.source==='retention_refresh';})"),'An open retention refresh must block duplicate refresh creation');
  assert.ok(build.includes("riskBoost=recovery.active?0:risk.priorityBoost"),'Recovery mode must disable risk promotion of new normal topics');
  assert.ok(build.indexOf('topics=routeTopicFrontier')<build.indexOf('routeTopicExamRisk(t.subjectId,t.id,student,riskContext)'),'Risk scoring must happen only after topic-frontier selection');
}

// 4) Every topic risk decision must expose a bounded evidence ledger and clearly flag sparse data.
{
  const src=between('function routeTopicEvidenceLedger','function routeTopicExamRisk');
  const fn=new Function(src+';return routeTopicEvidenceLedger;')();
  const rich=fn({
    student:{performance:72,confidence:68,sourceCount:5,openMistakes:1,trend:{known:true,direction:'down'}},
    mastery:{confidence:64,binary:{review3:true,review7:false}},
    forgetting:{known:true,retained:61},
    weak:{samples:2,ratio:.58,freshness:.55},
    daysToTarget:40
  });
  assert.equal(rich.quality,'KANIT GÜÇLÜ');
  assert.ok(rich.items.some(x=>x.key==='performance'&&x.value==='%72'));
  assert.ok(rich.items.some(x=>x.key==='spacing'&&/3g ✓/.test(x.value)));
  assert.ok(rich.items.some(x=>x.key==='exam'&&/Tazelik %55/.test(x.detail)));
  assert.ok(rich.items.some(x=>x.key==='target'&&x.value==='40 gün'));
  const sparse=fn({student:{confidence:10,sourceCount:1,trend:{known:false}},mastery:{confidence:0,binary:{}},forgetting:{known:false},weak:null,daysToTarget:null});
  assert.equal(sparse.quality,'VERİ AZ');
  assert.match(sparse.dataNote,/risk önceliğe çevrilmiyor/);
}

// 4) Risk map must be explainable UI and affect normal topic priority only through its bounded boost.
for(const marker of [
  'function routeExamRiskMapCard()',
  'SINAV RİSK HARİTASI',
  'Risk puanı soru çıkma olasılığı değildir',
  '<strong>Neden:</strong>',
  '<strong>Kanıt dökümü:</strong>',
  'function routeTopicEvidenceLedger',
  'rawPriorityBoost',
  'risk.priorityBoost',
  'riskBoost=recovery.active?0:risk.priorityBoost',
  'Sınav risk haritası bu başlığı'
]) assert.ok(html.includes(marker),`Missing exam risk map marker: ${marker}`);

// 4) Full-exam analysis must emit deterministic route signals and apply them once at save-time, without inventing a wrong topic.
{
  const src=between('function sortedExams','root.RotaAnalysis=');
  let uid=0;
  const C={
    TYPES:{KPSS:{exam:'kpss',label:'KPSS'}},
    PART_SUBJECTS:{KPSS:{Matematik:['k-ma'],Tarih:['k-ta']}},
    subjects:[
      {id:'k-ma',exam:'kpss',name:'Matematik'},{id:'k-ta',exam:'kpss',name:'Tarih'}
    ]
  };
  const R={
    uid:()=> 'a'+(++uid),iso:()=> '2026-09-20',dayAdd:(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return x.toISOString().slice(0,10);},
    validDate:v=>/^\d{4}-\d{2}-\d{2}$/.test(v),
    calcNet:(parts,penalty=4)=>{const p=parts[0];return {net:p.correct-(penalty?p.wrong/penalty:0),correct:p.correct,wrong:p.wrong,blank:p.total-p.correct-p.wrong,total:p.total};},
    allTopics:()=>[
      {id:'m1',subjectId:'k-ma',title:'Problemler'},{id:'t1',subjectId:'k-ta',title:'Osmanlı'}
    ],
    planSubjectLevel:(_w,id)=>id==='k-ma'?0:3,planLatestEvidenceDate:()=> ''
  };
  const api=new Function('R','C',src+';return {analyze,applyExamSignals,makeReview,dayLoad,nextReviewDate};')(R,C);
  const w={settings:{dailyMinutes:60,days:[0,1,2,3,4,5,6],priorities:[]},profile:{subjectLevels:{'k-ma':0,'k-ta':3}},topicState:{},customTopics:[],plan:[],logs:[],assessments:[],mistakes:[],exams:[
    {id:'e1',type:'KPSS',date:'2026-09-20',penalty:4,parts:[{label:'Matematik',total:30,correct:8,wrong:8},{label:'Tarih',total:27,correct:23,wrong:1}]}
  ]};
  const analysis=api.analyze(w,'e1');
  assert.equal(analysis.signals.find(x=>x.partLabel==='Matematik').severity,'critical');
  assert.equal(analysis.signals.find(x=>x.partLabel==='Tarih').severity,'steady');
  const applied=api.applyExamSignals(w,'e1','2026-09-20');
  assert.equal(applied.added,1);
  assert.equal(w.plan[0].subjectId,'k-ma');
  assert.equal(w.plan[0].topicId,'m1','Full exam may choose the next real topic but must not claim it was the wrong topic');
  assert.equal(w.plan[0].source,'exam');
  assert.match(w.plan[0].reason,/denemesinde Matematik|sıradaki tamamlanmamış/i);
  assert.ok(api.dayLoad(w,w.plan[0].date).total<=w.settings.dailyMinutes);
  const repeated=api.applyExamSignals(w,'e1','2026-09-20');
  assert.equal(repeated.added,1);
  assert.equal(w.plan.filter(p=>String(p.routeKey||'').startsWith('exam-signal:e1:')).length,1,'Reapplying the same exam must replace, not duplicate, open auto tasks');
  w.mistakes.push({id:'m-note',subjectId:'k-ma',topicId:'m1',title:'Problemler',resolved:false});
  const review=api.makeReview(w,'m-note','2026-09-21',25,'2026-09-20');
  assert.equal(review.source,'mistake');assert.equal(review.priority,88);assert.match(review.reason,/3\/7 günlük/);
}

// 4) A completed real-topic mistake repair must create its own 3/7-day retention cycle without replacing the normal mastery base.
{
  const candidate=between('function routeCandidateFromPlan','function routeTopicFrontier');
  assert.ok(candidate.includes("mistakeRepairBase=!!linkedMistake?.examId"),'Only exam-linked mistake repairs may anchor the dedicated 3/7 cycle');
  const build=between('function routeBuildCandidates','function routeConsistencySignal');
  for(const marker of ['latestMistakeRepairByTopic','mistake-spaced:','Denemeden gelen yanlış onarımını fiilî tamamlanma gününden','return !!m?.examId','reviewBaseTaskId:p.id','reviewBaseDate:repairDate','if(due>today())continue'])
    assert.ok(build.includes(marker),`Missing mistake repair retention marker: ${marker}`);
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

  // A newer exam-linked mistake-repair cycle must reset the 3/7 retention requirement without becoming the normal mastery base.
  space.mistakes.push({id:'m1',topicId:'topic-1',examId:'exam-1',resolved:false});
  space.plan.push({id:'repair-base',date:'2026-09-18',done:true,topicId:'topic-1',source:'mistake',sourceMistakeId:'m1'});
  space.logs.push({id:'repair-log',sessionId:'repair-base',date:'2026-09-18'});
  const afterRepair=mastery('topic-1');
  assert.equal(afterRepair.baseTaskId,'base','Mistake repair must not replace the normal learning base');
  assert.equal(afterRepair.repairBaseTaskId,'repair-base');
  assert.equal(afterRepair.review3,false);
  assert.equal(afterRepair.review7,false);
  assert.equal(afterRepair.ready,false,'A fresh mistake repair must require a new 3/7 retention check');
  space.plan.push({id:'repair-r3',date:'2026-09-21',done:true,topicId:'topic-1',source:'spaced_review',reviewWave:3,reviewBaseTaskId:'repair-base'});
  assert.equal(mastery('topic-1').review3,true);
  assert.equal(mastery('topic-1').ready,false);
  space.plan.push({id:'repair-r7',date:'2026-09-25',done:true,topicId:'topic-1',source:'spaced_review',reviewWave:7,reviewBaseTaskId:'repair-base'});
  assert.equal(mastery('topic-1').review7,true);
  space.mistakes.find(m=>m.id==='m1').resolved=true; // the student explicitly marked the linked exam mistake learned
  assert.equal(mastery('topic-1').ready,true,'Resolved exam mistake + real 3/7 repair follow-ups may restore mastery readiness');
  space.plan=space.plan.filter(p=>!p.id.startsWith('repair-'));
  space.logs=space.logs.filter(l=>l.id!=='repair-log');
  space.mistakes=[];

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


// 4) Recent mini weakness must produce one repair signal per topic, with same-day retakes deduped to the newest attempt.
{
  const src=between('function routeMiniRepairSignals','function routeBuildCandidates');
  const space={assessments:[
    {id:'old-low',miniId:'m1',date:'2026-09-19',subjectId:'k-ma',topicId:'t1',correct:2,wrong:6,created:1},
    {id:'new-low',miniId:'m1',date:'2026-09-19',subjectId:'k-ma',topicId:'t1',correct:3,wrong:5,created:2},
    {id:'other-topic',miniId:'m2',date:'2026-09-18',subjectId:'k-ta',topicId:'t2',correct:7,wrong:1,created:3}
  ]};
  const R={dayAdd:()=> '2026-09-12',topic:(_space,id)=>['t1','t2'].includes(id)?{id}:null};
  const routeSubjectAdaptiveState=(subjectId,topicId)=>topicId==='t1'?{mode:'repair',skillWeakness:{primary:{skill:'Yüzde'}}}:{mode:'steady',skillWeakness:{primary:null}};
  const routeStudentModel=(subjectId,topicId)=>({state:topicId==='t1'?'repair':'steady',confidence:80});
  const fn=new Function('w','R','today','routeSubjectAdaptiveState','routeStudentModel',src+';return routeMiniRepairSignals;')(()=>space,R,()=> '2026-09-19',routeSubjectAdaptiveState,routeStudentModel);
  const signals=fn();
  assert.equal(signals.length,1);
  assert.equal(signals[0].assessment.id,'new-low','Same-day retake must replace the older attempt before route repair is derived');
  assert.equal(signals[0].adaptive.mode,'repair');
}

// 4) Deneme-derived repair must be a first-class route source rather than only a hidden adaptive badge.
for(const marker of [
  "source==='mini_repair'",
  "source:'mini_repair'",
  "Mini onarım · ",
  "routeMiniRepairSignals()",
  "Mini denemede “",
  "sourceAssessmentId:a.id",
  "miniRepairSignals=routeMiniRepairSignals()",
  "miniRepairByTopic=new Map",
  "if(p.source==='mini_repair'&&!miniRepairByTopic.has(p.topicId))continue",
  "key='mini-repair-topic:'+a.topicId",
  "p.sourceAssessmentId?{sourceAssessmentId",
  "Mini onarım görevinin deneme sonucu bağlantısı geçersiz."
]) assert.ok(html.includes(marker),`Missing mini repair route integration marker: ${marker}`);

// 5) Deneme Merkezi pilots must be original, internally valid and isolated from full-exam net records.
{
  const src=between('const ROTA_MINI_EXAMS','function miniExamDefinition');
  const data=new Function(src+';return {ROTA_MINI_EXAMS,OFFICIAL_EXAM_RESOURCES,MINI_SKILL_MAP};')();
  const legacyIds=["kpss-problemler-01","yks-paragraf-01","kpss-tarih-01","kpss-cografya-01","tyt-biyoloji-hucre-01","ayt-edebiyat-tanzimat-01","ydt-grammar-01","ydt-vocab-01","ydt-reading-01","kpss-vatandaslik-01","tyt-matematik-temel-01","tyt-fizik-hareket-01","ayt-matematik-fonksiyon-01","tyt-kimya-atom-01","ayt-fizik-vektor-01","ayt-biyoloji-sinir-01","ayt-tarih1-ilkcag-01","ayt-kimya-modern-atom-01","ayt-cografya1-dogal-01","ayt-felsefe-tarih-01","kpss-turkce-paragraf-01","tyt-tarih-zaman-01","tyt-cografya-harita-01","ayt-geometri-ucgen-01"];
  assert.equal(data.ROTA_MINI_EXAMS.length,24,'Legacy inline mini seed catalog must stay at 24 definitions');
  assert.deepEqual(data.ROTA_MINI_EXAMS.map(x=>x.id),legacyIds,'Legacy mini seeds must remain intact and in place');
  assert.equal(kpssPracticeCatalog.topicSets.length,24,'External KPSS practice catalog must contribute 24 topic-practice sets');
  assert.equal(kpssPracticeCatalog.sectionExams.find(x=>x.subjectId==='k-tr')?.questions.length,30,'KPSS Turkish section exam must contain 30 original questions');
  assert.equal(kpssPracticeCatalog.sectionExams.find(x=>x.subjectId==='k-ta')?.questions.length,27,'KPSS history section exam must contain 27 original questions');
  assert.equal(new Set(data.ROTA_MINI_EXAMS.map(x=>x.id)).size,data.ROTA_MINI_EXAMS.length,'Mini ids must be unique');
  assert.deepEqual(data.ROTA_MINI_EXAMS.filter(x=>x.subjectId==='d-yd').map(x=>x.topicTitle).sort(),['Dil bilgisi','Kelime çalışması','Okuduğunu anlama'].sort(),'YDT must keep vocabulary, grammar and reading measurements separate');
  assert.ok(data.ROTA_MINI_EXAMS.some(x=>x.subjectId==='k-va'&&x.topicTitle==='Hukukun temel kavramları'),'KPSS citizenship mini must exist');
  assert.ok(data.ROTA_MINI_EXAMS.some(x=>x.subjectId==='t-ma'&&x.topicTitle==='Temel kavramlar'),'TYT math mini must exist');
  assert.ok(data.ROTA_MINI_EXAMS.some(x=>x.subjectId==='t-fi'&&x.topicTitle==='Hareket ve kuvvet'),'TYT physics mini must exist');
  assert.ok(data.ROTA_MINI_EXAMS.some(x=>x.subjectId==='a-ma'&&x.topicTitle==='Fonksiyonlar'),'AYT math mini must exist');
  assert.ok(data.ROTA_MINI_EXAMS.some(x=>x.subjectId==='t-ki'&&x.topicTitle==='Atom ve periyodik sistem'),'TYT chemistry mini must exist');
  assert.ok(data.ROTA_MINI_EXAMS.some(x=>x.subjectId==='a-fi'&&x.topicTitle==='Vektörler'),'AYT physics mini must exist');
  assert.ok(data.ROTA_MINI_EXAMS.some(x=>x.subjectId==='a-bi'&&x.topicTitle==='Sinir sistemi'),'AYT biology mini must exist');
  assert.ok(data.ROTA_MINI_EXAMS.some(x=>x.subjectId==='a-t1'&&x.topicTitle==='İlk Çağ uygarlıkları'),'AYT history-1 mini must exist');
  assert.ok(data.ROTA_MINI_EXAMS.some(x=>x.subjectId==='k-tr'&&x.topicTitle==='Paragrafta anlam'),'KPSS Turkish paragraph mini must exist');
  assert.ok(data.ROTA_MINI_EXAMS.some(x=>x.subjectId==='t-ta'&&x.topicTitle==='Tarih ve zaman'),'TYT history mini must exist');
  assert.ok(data.ROTA_MINI_EXAMS.some(x=>x.subjectId==='t-co'&&x.topicTitle==='Harita bilgisi'),'TYT geography map mini must exist');
  assert.ok(data.ROTA_MINI_EXAMS.some(x=>x.subjectId==='a-ge'&&x.topicTitle==='Üçgenler ve çokgenler'),'AYT geometry mini must exist');
  assert.deepEqual(new Set(data.ROTA_MINI_EXAMS.filter(x=>x.exam==='yks'&&x.subjectId.startsWith('t-')).map(x=>x.subjectId)).has('t-ki'),true);
  assert.ok(['a-ma','a-ge','a-fi','a-ki','a-bi'].every(id=>data.ROTA_MINI_EXAMS.some(x=>x.subjectId===id)),'AYT SAY coverage must include math, geometry, physics, chemistry and biology');
  assert.ok(['a-ma','a-ge','a-ed','a-t1','a-c1'].every(id=>data.ROTA_MINI_EXAMS.some(x=>x.subjectId===id)),'AYT EA coverage must include math, geometry, literature, history-1 and geography-1');
  assert.ok(['a-ed','a-t1','a-c1','a-fg'].every(id=>data.ROTA_MINI_EXAMS.some(x=>x.subjectId===id)),'AYT SOZ coverage must include literature, history-1, geography-1 and philosophy group');
  for(const exam of data.ROTA_MINI_EXAMS){
    assert.ok(exam.questions.length>=8,exam.id+' should contain at least 8 pilot questions');
    assert.equal(new Set(exam.questions.map(q=>q.id)).size,exam.questions.length,'Question ids must be unique');
    assert.equal(data.MINI_SKILL_MAP[exam.id]?.length,exam.questions.length,'Every legacy mini question must have one skill label');
    for(const q of exam.questions){
      assert.equal(q.options.length,5);
      assert.equal(new Set(q.options).size,q.options.length,'Mini answer choices must be unique');
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
  assert.ok(repeatedToday<-800,'Same-day repeat should be effectively excluded from recommendation ranking');
  const repeatedSoon=api.miniRecommendationScore({total:10,correct:4},{mode:'repair',repairScore:4},2,{attempts7:2,attempts14:2});
  assert.ok(repeatedSoon<steady,'Very recent repeated attempts should lose to a fresh neutral measurement');
}
// 5) Same-day retakes must count as one attempt for recommendation cooldown windows.
{
  const src=between('function miniAttemptStats','function miniRecommendationContext');
  const space={assessments:[
    {id:'same-old',miniId:'m1',date:'2026-09-19',created:1},
    {id:'same-new',miniId:'m1',date:'2026-09-19',created:2},
    {id:'older',miniId:'m1',date:'2026-09-15',created:3},
    {id:'outside',miniId:'m1',date:'2026-09-01',created:4}
  ]};
  const R={dayAdd:(_d,n)=>n===-6?'2026-09-13':'2026-09-06'};
  const fn=new Function('R','today','w',src+';return miniAttemptStats;')(R,()=> '2026-09-19',()=>space);
  const stats=fn('m1');
  assert.equal(stats.attempts7,2);
  assert.equal(stats.attempts14,2);
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


// 5) A low mini result must change the actual adaptive mode, not merely exist in practice storage.
{
  const signalSrc=between('function routeAssessmentSamples','function routeTargetAttainmentSignal');
  const adaptiveSrc=between('function routeSubjectAdaptiveState','function routeTopicMasterySignal');
  const space={
    assessments:[{id:'mini-low',miniId:'kpss-problemler-01',date:'2026-09-19',subjectId:'k-ma',topicId:'t1',correct:3,wrong:7,blank:0,created:1,skillBreakdown:[{skill:'Yüzde',total:4,correct:1,wrong:3,blank:0}]}],
    plan:[],logs:[],mistakes:[]
  };
  const R={dayAdd:()=> '2026-08-29',topic:(_space,id)=>id==='t1'?{id:'t1',subjectId:'k-ma'}:null};
  const noneBehavior=()=>({known:false,total:0,friction:0,completion:0});
  const noneOutcome=()=>({known:false,total:0,stuck:0,ok:0,strong:0,stuckRate:0,trend:0,recent:''});
  const noneCalibration=()=>({known:false,total:0,hiddenGap:0,productiveStruggle:0,alignedStrong:0,alignedStruggle:0});
  const noneAttainment=()=>({known:false,sessions:0,weightedRatio:0,recentRatio:0});
  const api=new Function('R','today','w','routeBehaviorSignal','routeOutcomeSignal','routeFeedbackCalibrationSignal','routeTargetAttainmentSignal','routeExamWeakness',
    signalSrc+adaptiveSrc+';return {routePracticeSignal,routeSubjectAdaptiveState};'
  )(R,()=> '2026-09-19',()=>space,noneBehavior,noneOutcome,noneCalibration,noneAttainment,()=>({}));
  const practice=api.routePracticeSignal('k-ma','t1');
  const adaptive=api.routeSubjectAdaptiveState('k-ma','t1');
  assert.equal(practice.answered,10);
  assert.equal(Math.round(practice.accuracy*100),30);
  assert.equal(adaptive.mode,'repair','Low mini performance must drive ONARIM mode');
  assert.ok(adaptive.repairScore>=3);
  assert.ok(adaptive.evidence.some(x=>x.includes('soru doğruluğu')));
}

// 5) Blank mini answers count as missed practice evidence, not as invisible unanswered items.
{
  const src=between('function routeAssessmentSamples','function routeFeedbackCalibrationSignal');
  const space={plan:[],logs:[],assessments:[
    {id:'blanky',miniId:'m1',date:'2026-09-19',subjectId:'k-ma',topicId:'t1',correct:6,wrong:0,blank:4,created:1}
  ]};
  const R={dayAdd:()=> '2026-08-29'},today=()=> '2026-09-19',w=()=>space;
  const api=new Function('R','today','w',src+';return {routeAssessmentSamples,routePracticeSignal};')(R,today,w);
  const sample=api.routeAssessmentSamples('k-ma','t1')[0];
  assert.equal(sample.wrong,4);
  const practice=api.routePracticeSignal('k-ma','t1');
  assert.equal(practice.answered,10);
  assert.equal(Math.round(practice.accuracy*100),60);
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

// 5) Wrong/blank question clusters must become a de-duplicated subtopic signal.
{
  const src=between('function routeAssessmentWeakSkillSignal','function routePracticeSignal');
  const space={assessments:[
    {id:'old',miniId:'m1',date:'2026-09-19',subjectId:'k-ma',topicId:'t1',created:1,skillBreakdown:[{skill:'Yüzde',total:2,correct:0,wrong:2,blank:0}]},
    {id:'new',miniId:'m1',date:'2026-09-19',subjectId:'k-ma',topicId:'t1',created:2,skillBreakdown:[{skill:'Yüzde',total:2,correct:1,wrong:1,blank:0},{skill:'Oran-orantı',total:1,correct:1,wrong:0,blank:0}]},
    {id:'next',miniId:'m1',date:'2026-09-16',subjectId:'k-ma',topicId:'t1',created:3,skillBreakdown:[{skill:'Yüzde',total:2,correct:0,wrong:1,blank:1}]}
  ]};
  const R={dayAdd:()=> '2026-08-29'};
  const today=()=> '2026-09-19';
  const fn=new Function('R','today','w',src+';return routeAssessmentWeakSkillSignal;')(R,today,()=>space);
  const signal=fn('k-ma','t1');
  assert.equal(signal.attempts,2,'Same-day retakes must contribute only the newest subtopic breakdown');
  assert.equal(signal.primary.skill,'Yüzde');
  assert.ok(signal.primary.missed>=2);
  assert.ok(signal.weak.some(x=>x.skill==='Yüzde'));
}

// 5) Mini evidence schema must preserve skill breakdown and the route decision snapshot across backup/import.
for(const marker of [
  'const skillBreakdown=Array.isArray(a.skillBreakdown)',
  'Mini deneme alt konu toplamı soru sayısıyla eşleşmiyor.',
  'const weakSkills=Array.isArray(a.weakSkills)',
  'const routeDecision=rd&&',
  'routeDecision=miniRouteDecisionSnapshot',
  'function routeAssessmentWeakSkillSignal',
  'MINI_SKILL_MAP',
  'x.daysSince>=3',
  'ders, konu ve alt-konu performansına'
]) assert.ok(html.includes(marker),`Missing new mini evidence marker: ${marker}`);


// 5) Version-mismatched mini history must keep aggregate evidence without exposing stale question details.
{
  const src=between('function openMiniAttemptResult','function miniResultSummary');
  const result={id:'old-1',miniId:'m1',version:1,title:'Arşiv Mini',correct:5,total:8,wrong:2,blank:1,minutes:11,answers:[0,0,0,0,0,0,0,0],weakSkills:['Yüzde','Oran-orantı'],routeDecision:{mode:'repair',label:'ONARIM MODU',note:'Alt konu açığı sürüyor.',confidence:70,evidence:[]}};
  const def={id:'m1',version:2,questions:Array.from({length:8},(_,i)=>({id:'q'+i,answer:0,options:['A','B','C','D','E']}))};
  let modal='',detailed=false;
  const fn=new Function('miniAttemptById','miniExamDefinition','openMiniResult','scoreMiniExam','openModal','esc',src+';return openMiniAttemptResult;')(
    ()=>result,()=>def,()=>{detailed=true;},()=>({}),(_title,body)=>{modal=body;},v=>String(v)
  );
  fn('old-1');
  assert.equal(detailed,false,'Stale question details must not open across versions');
  assert.ok(modal.includes('Kaydedilen set v1 · güncel set v2'));
  assert.ok(modal.includes('ONARIM MODU'));
  assert.ok(modal.includes('Alt konu açığı sürüyor.'));
  assert.ok(modal.includes('Yüzde · Oran-orantı'));
  assert.ok(!modal.includes('Soru 1'),'Historical mismatch must not render stale question-level review');
}

// 5) Mini development charts must collapse same-day retakes before comparing different days.
{
  const src=between('function miniDistinctAttempts','function miniProgressSvg');
  const space={assessments:[
    {id:'day1-old',miniId:'m1',date:'2026-09-18',correct:3,total:10,created:1},
    {id:'day1-new',miniId:'m1',date:'2026-09-18',correct:6,total:10,created:2},
    {id:'day2',miniId:'m1',date:'2026-09-19',correct:8,total:10,created:3},
    {id:'other',miniId:'m2',date:'2026-09-19',correct:10,total:10,created:4}
  ]};
  const fn=new Function('w',src+';return miniDistinctAttempts;')(()=>space);
  const xs=fn('m1');
  assert.equal(xs.length,2);
  assert.equal(xs[0].id,'day1-new','Chart must keep only the latest same-day attempt');
  assert.equal(xs[1].id,'day2');
}

// 5) Applied decisions must follow the calibrated Student Model across every adaptive state, not only progress.
{
  const src=between('function routeProgressHoldFromSignals','function routeLatestModeDecision');
  const fn=new Function(src+';return routeAppliedDecisionFromSignals;')();
  const adaptive=(mode,label)=>({mode,label,note:'raw note',evidence:['raw'],confidence:90});

  let x=fn(adaptive('repair','ONARIM MODU'),{state:'collect',label:'VERİ TOPLUYOR',nextAction:'Yeni veri topla',confidence:18},{active:false});
  assert.equal(x.mode,'steady','Low-confidence raw repair must be withheld');
  assert.equal(x.label,'VERİ TOPLUYOR');
  assert.equal(x.rawMode,'repair');

  x=fn(adaptive('steady','DENGELİ TEMPO'),{state:'repair',label:'ONARIM ÖNCELİĞİ',nextAction:'Yanlışı onar',confidence:80},{active:false});
  assert.equal(x.mode,'repair','Student Model repair must override a raw steady signal');

  x=fn(adaptive('steady','DENGELİ TEMPO'),{state:'sustainable',label:'UYGULANABİLİR DOZ',nextAction:'Dozu küçült',confidence:75},{active:false});
  assert.equal(x.mode,'ease','Student Model sustainable state must apply the smaller dose');

  x=fn(adaptive('ease','SÜRDÜRÜLEBİLİR MOD'),{state:'retention',label:'KALICILIK AÇIĞI',nextAction:'Tekrarları tamamla',confidence:88},{active:false});
  assert.equal(x.mode,'steady','Retention takes precedence over generic dose easing');
  assert.equal(x.label,'KALICILIK AÇIĞI');

  x=fn(adaptive('steady','DENGELİ TEMPO'),{state:'progress',label:'GELİŞİM DOĞRULANIYOR',nextAction:'Küçük seviye yoklaması',confidence:90},{active:false});
  assert.equal(x.mode,'progress','Corroborated Student Model progress may apply even when the raw adaptive score is only steady');

  x=fn(adaptive('progress','GELİŞİM MODU'),{state:'progress',label:'GELİŞİM DOĞRULANIYOR',nextAction:'Küçük seviye yoklaması',confidence:90},{active:true});
  assert.equal(x.mode,'steady','Recovery must still block progression load increases');
  assert.equal(x.label,'TOPARLANMA MODU');
}

// 5) Progress hysteresis may absorb one mild dip, but must never hide real regression.
{
  const src=between('function routeProgressHoldFromSignals','function routeLatestModeDecision');
  const fn=new Function(src+';return routeAppliedDecisionFromSignals;')();
  const adaptive={mode:'steady',label:'DENGELİ TEMPO',note:'raw',evidence:[],confidence:90};
  const mild={state:'steady',label:'DENGELİ İLERLEME',nextAction:'dozu koru',confidence:88,performance:73,learningNeed:24,openMistakes:0,retention:82,execution:90,trend:{known:true,direction:'flat'},personalNorm:{known:true,direction:'flat',confidence:70}};
  const previous={mode:'progress',hysteresisHeld:false};

  const held=fn(adaptive,mild,{active:false},previous);
  assert.equal(held.mode,'progress','One mild dip after progress should receive a one-day hysteresis buffer');
  assert.equal(held.hysteresisHeld,true);
  assert.equal(held.label,'GELİŞİM KORUNUYOR');

  const second=fn(adaptive,mild,{active:false},{mode:'progress',hysteresisHeld:true});
  assert.equal(second.mode,'steady','Hysteresis may not preserve progress for a second unconfirmed day');
  assert.equal(second.hysteresisHeld,false);

  const regressing={...mild,performance:69,trend:{known:true,direction:'down'}};
  const exit=fn(adaptive,regressing,{active:false},previous);
  assert.equal(exit.mode,'steady','Real regression must exit progress immediately');

  const mistake={...mild,openMistakes:1};
  assert.equal(fn(adaptive,mistake,{active:false},previous).mode,'steady','An open mistake must cancel progress hysteresis');

  const recovered={...mild,state:'progress',performance:81};
  const renewed=fn({mode:'progress',label:'GELİŞİM MODU',note:'raw',evidence:[]},recovered,{active:false},{mode:'progress',hysteresisHeld:true});
  assert.equal(renewed.mode,'progress');
  assert.equal(renewed.hysteresisHeld,false,'Fresh corroborated progress resets the hysteresis buffer');
}

// 5) User-facing route surfaces must read the applied decision rather than raw adaptive progress.
{
  const todayTask=between('function routeTodayTask','function routeTodayPage');
  const planCard=between('function routePlanCard','function planPage');
  const memo=between('const routeRenderDecisionCache','function routeTodayTask');
  assert.ok(memo.includes('routeAppliedDecision(subjectId,topicId)'),'Render memo must delegate to the real applied-decision function');
  assert.ok(todayTask.includes('routeDecisionForRender(p.subjectId,p.topicId)'),'Today task badge must use the memoized applied decision');
  assert.ok(planCard.includes('routeDecisionForRender(p.subjectId,p.topicId)'),'Plan task badge must use the memoized applied decision');
  const renderSrc=between('function render(){','function commit(message)');
  assert.ok(renderSrc.includes('routeRenderDecisionCache.clear()'),'Render must clear its decision memo before recomputing the UI');
  assert.ok(renderSrc.includes('routeRenderPerf.decisionComputes=0')&&renderSrc.includes('routeRenderPerf.reasonCalls=0'),'Render diagnostics must reset per render');
  assert.ok(html.includes('function routePlanIndexForRender'),'Render must build a reusable plan date index');
  assert.ok(html.includes('routePlanItemsForDate(today())'),'Today must reuse the plan date index');
  assert.ok(html.includes('routePlanItemsForDate(d).sort'),'Programım must reuse the plan date index instead of rescanning the full plan per day');
  assert.ok(renderSrc.includes('routeRenderPlanIndex=null')&&renderSrc.includes('routeRenderPerf.planIndexBuilds=0'),'Render must reset its plan index and metric per render');
  assert.ok(html.includes('miniRouteDecisionSnapshot(routeAppliedDecision(def.subjectId,topicId))'),'Mini result snapshot must persist the applied decision');
  assert.ok(html.includes('adaptive=routeAppliedDecision(def.subjectId,topicId)'),'Mini recommendation must use the applied decision');
  assert.ok(html.includes('const adaptive=routeAppliedDecision(p.subjectId,p.topicId),mode='),'Intervention audit must use the applied decision');
  assert.ok(html.includes('adaptive=routeDecisionForRender(p.subjectId,p.topicId),sourceLabel=routeTaskSourceLabel(p),modeExplain=routeModeExplanation(adaptive)'),'Why modal must explain the same applied decision shown in the task card');
  assert.ok(html.includes("adaptive.studentState==='retention'"),'Task prescription must explain retention priority');
  assert.ok(html.includes("adaptive.studentState==='collect'"),'Task prescription must explain low-confidence data collection');
  assert.ok(html.includes("state=a.studentState||'steady'"),'Learning summary must preserve calibrated Student Model state');
  assert.ok(html.includes('function routeProgressHoldFromSignals'),'Progress hysteresis gate must exist');
  assert.ok(html.includes('routeRecordModeHistory(scheduled)'),'Rebalance must persist applied mode history');
}

// 5) Today's route must surface the next action and progress without changing route decisions.
for(const marker of [
  'route-now-label',
  'ŞİMDİ BAŞLA',
  'route-progress-summary',
  'route-progress-track',
  'BUGÜNÜN PLANI',
  'route-list-status',
  'Today Premium v1 — clarity-first shell; route engine behavior is unchanged.'
]) assert.ok(html.includes(marker),`Missing clarity-first today UI marker: ${marker}`);
{
  const src=between('function routeTodayPage','function baseTodayPage');
  assert.ok(src.includes("doneCount=tasks.filter(p=>p.done).length"),'Today progress must derive from real task completion');
  assert.ok(src.includes("first=open.find(p=>p.taskState!=='later')||open[0]"),'Hero must preserve scheduler ordering for the next task');
  assert.ok(src.includes("first?esc(first.title):'Bugünkü rotanı tamamladın.'"),'Hero must show the actual next task rather than inventing a recommendation');
}


// 5) App shell must prioritize the four core actions while keeping every existing navigation target reachable.
for(const marker of [
  'Product Shell v1 — clearer hierarchy around the study flow.',
  'ANA ÇALIŞMA',
  'ÇALIŞMA ARAÇLARI',
  'nav-primary-group',
  'nav-secondary-group',
  'topbar-context',
  'topbar-exam-pill'
]) assert.ok(html.includes(marker),`Missing premium app shell marker: ${marker}`);
{
  const src=between('const nav=','function activeLogs');
  assert.ok(src.includes("PRIMARY_NAV_IDS=new Set(['today','plan','teacher','exams'])"),'Primary navigation must stay focused on Today, Plan, Rota Hoca and Exams');
  assert.ok(src.includes("secondary=nav.filter(x=>!PRIMARY_NAV_IDS.has(x[0]))"),'Secondary navigation must retain every non-primary destination');
  assert.ok(src.includes("currentLabel=({lesson:'Video ders',membership:'Paketim',settings:'Ayarlar'})[ui.view]||nav.find"),'Topbar context must derive from the existing view/navigation state');
  assert.ok(src.includes('data-view="${id}"'),'Navigation targets must remain data-driven from the existing nav array');
}


// 5) Route Coach insight must explain the existing route decision and link to the existing teacher view.
for(const marker of [
  'Route Coach Insight v1 — explain the route without adding a second decision source.',
  'ROTA HOCA · GÜNLÜK BRİF',
  'coach-avatar-mini',
  'Rota Hoca ile konuş'
]) assert.ok(html.includes(marker),`Missing route coach insight marker: ${marker}`);
{
  const src=between('function routeTodayPage','function baseTodayPage');
  assert.ok(src.includes("const reason=w().route.lastReason||'Rota motoru çalışma kapasiteni ve mevcut kayıtlarını birlikte değerlendirir.'"),'Coach insight must reuse the existing route reason');
  assert.ok(src.includes("data-view=\"teacher\""),'Coach insight must navigate to the existing Rota Hoca view');
  assert.ok(src.includes('route-progress-orb'),'Today hero must expose real task completion progress');
}


// 5) Deneme Merkezi must keep the route recommendation visually primary without changing scoring.
for(const marker of [
  'Exam Center Premium v1 — recommendation first, catalog second.',
  'KISA ÖLÇÜMLER',
  'Rota Mini denemeleri',
  'mini-section-head'
]) assert.ok(html.includes(marker),`Missing premium exam center marker: ${marker}`);
{
  const src=between('function denemeCenterSection','function examsPage');
  assert.ok(src.includes('rec=miniRecommendation()'),'Premium exam center must keep the existing recommendation engine');
  assert.ok(src.includes("btn('Önerilen denemeyi çöz '+icon('arrow'),'start-mini-exam','primary'"),'Recommended mini CTA must keep the existing start action');
  assert.ok(src.includes("minis.length+' uygun mini set</span>"),'Mini catalog count must derive from eligible minis');
}


// 5) Mobile task flow must surface focus and completion without inventing study evidence.
for(const marker of [
  'Mobile Task Flow v1 — start, focus, finish, record.',
  'route-complete-label',
  'route-focus-card',
  'Bitir ve kaydet',
  'Bu görev çalışma kaydına otomatik bağlanacak.'
]) assert.ok(html.includes(marker),`Missing mobile task flow marker: ${marker}`);
{
  const task=between('function routeTodayTask','function routeTodayPage');
  const focus=between('function focusSession','function replaceListRecord');
  const timer=between('function timerCard','function rhythm');
  const today=between('function routeTodayPage','function baseTodayPage');
  assert.ok(task.includes('data-action="complete-session"'),'Mobile completion must keep the existing completion action');
  assert.ok(focus.includes("t.sessionId=p.id"),'Focus start must link the existing plan task to the timer');
  assert.ok(focus.includes("$('.route-focus-card')||$('#timer-subject')"),'Focus start must scroll to the visible focus surface');
  assert.ok(timer.includes("p=t.sessionId?w().plan.find"),'Focus card must derive its task from the linked timer session');
  assert.ok(today.includes("focusActive=!!focusTimer.sessionId&&w().plan.some"),'Today must show focus only for a real unfinished linked task');
}


// 5) Mobile completion sheet must shorten planned-task recording without dropping evidence fields.
for(const marker of [
  'Mobile Completion Sheet v1 — keep evidence fields, remove navigation friction.',
  'log-completion-form',
  'log-session-summary',
  'PLANLI GÖREV',
  'Görevi tamamla'
]) assert.ok(html.includes(marker),`Missing mobile completion sheet marker: ${marker}`);
{
  const src=between('function openLog','function openSource');
  assert.ok(src.includes("initial.sessionId?'log-completion-form':''"),'Completion sheet must only apply to linked plan tasks');
  assert.ok(src.includes('name="minutes"'),'Completion must still collect actual minutes');
  assert.ok(src.includes('name="questions"'),'Completion must still collect actual question count');
  assert.ok(src.includes('name="correct"')&&src.includes('name="wrong"'),'Completion must preserve objective performance evidence');
  assert.ok(src.includes('name="outcome"'),'Completion must preserve optional subjective outcome evidence');
  assert.ok(src.includes('name="completeSession"'),'Completion must preserve explicit plan-completion consent');
}


// 5) Mobile dock must reuse existing navigation actions and keep core study destinations one tap away.
for(const marker of [
  'Mobile Dock v1 — key study destinations stay one tap away.',
  'mobile-dock',
  'Hızlı mobil menü',
  '<span>Bugün</span>',
  '<span>Rota Hoca</span>',
  '<span>Deneme</span>'
]) assert.ok(html.includes(marker),`Missing mobile dock marker: ${marker}`);
{
  const src=between('function shell(content)','function activeLogs');
  for(const view of ['today','plan','teacher','exams'])assert.ok(src.includes('data-view="'+view+'"'),'Mobile dock must reuse existing '+view+' navigation target');
  assert.ok(src.includes('data-action="menu"'),'Mobile dock menu button must reuse the existing drawer action');
  assert.ok(!src.includes('\\${content}'),'App shell must interpolate main content instead of rendering a literal template token');
  assert.ok(!src.includes('\\${icon('),'Mobile dock icons must be interpolated instead of rendered as literal template tokens');
  assert.ok(!src.includes('\\${ui.view'),'Mobile dock active-state expressions must be interpolated instead of rendered as literal template tokens');
}


// 5) Weekly plan must expose day-level route semantics and stack cleanly on mobile.
for(const marker of ['function routeDayPlanSummary','route-day-summary-chips','deneme sinyali','.week-grid{grid-template-columns:1fr}','grid-column:1/-1;min-height:46px'])
  assert.ok(html.includes(marker),`Missing weekly/mobile clarity marker: ${marker}`);

// 5) The core exam -> mistake -> planned review loop must stay available without a Plus gate.
{
  const analysis=between('function analysisPanel','function denemeCenterSection');
  const review=between('function openReview','function updateReviewCapacity');
  const actions=between('function onAction','function studyClock');
  assert.ok(!analysis.includes("if(!isPlus())return plusGate('analysis')"),'Exam analysis must not be Plus-gated');
  assert.ok(!review.includes("if(!isPlus())return openUpgrade('analysis')"),'Mistake review planning must not be Plus-gated');
  assert.ok(!actions.includes("['note-from-exam','plan-review']"),'Exam-to-mistake actions must not be Plus-gated');
  assert.ok(html.includes('Denemeden yanlışı konuya bağlama ve planlı tekrar'),'Free feature copy must describe the real core learning loop');
}

// 5) Rota Hoca must be grounded in the same live route state shown to the student.
{
  const src=between('function teacherStudentContext','function teacherRemoteText');
  for(const marker of ['todayPlan','routeDecision','studentModel','learningNeed','examRisk','mastery','completion','routeSummary','routeAppliedDecision','routeStudentModel','routeTopicExamRisk','routeTopicMasterySignal'])
    assert.ok(src.includes(marker),`Rota Hoca context is missing live route marker: ${marker}`);
}

// 5) Completion feedback must reflect recorded evidence and only announce a route-mode change when it really changed.
for(const marker of [
  '✓ Görev tamamlandı.',
  'Rota bu çalışmayı öğrenci modeline ekledi.',
  "+' doğruluk kaydedildi.'",
  'beforeDecision.mode!==afterDecision.mode',
  "'Rota güncellendi: '"
]) assert.ok(html.includes(marker),`Missing completion feedback marker: ${marker}`);

// 5) Mini repair generation and stale mini-repair tasks must also respect the calibrated repair gate.
{
  const mini=between('function routeMiniRepairSignals','function routeBuildCandidates');
  const candidate=between('function routeCandidateFromPlan','function routeTopicFrontier');
  assert.ok(mini.includes("x.adaptive.mode==='repair'&&x.student.state==='repair'"),'Mini repair signal must require Student Model repair');
  assert.ok(candidate.includes("miniAdaptive?.mode!=='repair'||miniStudent?.state!=='repair'"),'Existing mini repair must invalidate when calibrated repair is no longer present');
}

// 5) Route-decision snapshots must be stable values, not references to the current adaptive state.
{
  const src=between('function miniRouteDecisionSnapshot','function latestMiniResult');
  const fn=new Function(src+';return miniRouteDecisionSnapshot;')();
  const adaptive={mode:'repair',label:'ONARIM MODU',note:'n',confidence:70,evidence:['a','b']};
  const snap=fn(adaptive);
  adaptive.mode='progress';adaptive.evidence.push('c');
  assert.equal(snap.mode,'repair');
  assert.deepEqual(snap.evidence,['a','b']);
}

// 5) Automatic recommendation must prefer a fresh alternative over a very recent repair mini.
{
  const src=between('function miniRecommendation(){','function denemeCenterSection');
  const defs=[
    {id:'repair-mini',exam:'kpss',subjectId:'s1',title:'Repair'},
    {id:'fresh-mini',exam:'kpss',subjectId:'s2',title:'Fresh'},
    {id:'untouched-repair',exam:'kpss',subjectId:'s3',title:'Untouched repair'}
  ];
  let repairDays=1;
  const fn=new Function('subjects','ROTA_ALL_MINI_EXAMS','state','miniRecommendationContext','routeAppliedDecision','latestMiniResult','miniDaysSince','miniAttemptStats','miniRecommendationScore',
    src+';return miniRecommendation;'
  )(
    ()=>[{id:'s1'},{id:'s2'},{id:'s3'}],defs,{activeExam:'kpss'},
    def=>({topicId:'',topicStarted:def.id!=='untouched-repair',openTopic:false,recentTopicWork:false,subjectDaysSince:999,stageDaysSince:999}),
    id=>id==='s1'||id==='s3'?{mode:'repair',label:'ONARIM MODU',repairScore:5,skillWeakness:{weak:[]}}:{mode:'steady',label:'DENGELİ TEMPO',repairScore:0,skillWeakness:{weak:[]}},
    id=>id==='repair-mini'?{miniId:id,total:10,correct:3,date:'2026-09-18'}:null,
    last=>last?repairDays:999,
    ()=>({attempts7:0,attempts14:0}),
    (_last,adaptive)=>adaptive.mode==='repair'?100:60
  );
  assert.equal(fn().def.id,'fresh-mini','A recent repair mini and an untouched repair topic cannot override a studied fresh alternative');
  repairDays=4;
  assert.equal(fn().def.id,'repair-mini','After cooldown, the stronger repair need should regain recommendation priority');
}

// 5) Every mini must resolve to a real catalog subject and exact topic so topic-based evidence cannot silently fall back to subject-only mode.
{
  const catalogJs=externalCatalogJs;
  assert.ok(catalogJs.includes('root.RotaCatalog='),'External catalog module missing');
  const env={};new Function('window','globalThis',catalogJs)(env,env);
  const src=between('const ROTA_MINI_EXAMS','function miniExamDefinition'),data=new Function('window',src+';return ROTA_MINI_EXAMS;')({RotaKpssPractice:kpssPracticeCatalog});
  for(const mini of data){
    const subject=env.RotaCatalog.subjects.find(s=>s.id===mini.subjectId);
    assert.ok(subject,'Mini subject missing from catalog: '+mini.id);
    assert.ok(subject.topics.some(t=>t.title===mini.topicTitle),'Mini topic title must exactly match catalog: '+mini.id+' → '+mini.topicTitle);
  }
}

// 5) Recommendation scoring must prefer active/recently studied topics over untouched topics when other signals are comparable.
{
  const src=between('function miniRecommendationScore','function miniDaysSinceDate');
  const score=new Function(src+';return miniRecommendationScore;')();
  const adaptive={mode:'steady',repairScore:0};
  const active=score(null,adaptive,999,{attempts7:0,attempts14:0,weakCount:0,openTopic:true,recentTopicWork:true,topicStarted:true,subjectDaysSince:999,stageDaysSince:999});
  const untouched=score(null,adaptive,999,{attempts7:0,attempts14:0,weakCount:0,openTopic:false,recentTopicWork:false,topicStarted:false,subjectDaysSince:999,stageDaysSince:999});
  assert.ok(active>untouched+50,'Active studied topic should materially outrank untouched content');
  const sameSubjectToday=score(null,adaptive,999,{attempts7:0,attempts14:0,weakCount:0,openTopic:true,recentTopicWork:true,topicStarted:true,subjectDaysSince:0,stageDaysSince:999});
  assert.ok(sameSubjectToday<active,'Recent measurement in the same subject should encourage recommendation diversity');
}

// 5) Recent weakness overview must rank the strongest subtopic gaps across minis.
{
  const src=between('function miniWeaknessOverviewData','function miniWeaknessOverview(');
  const minis=[
    {id:'m1',subjectId:'s1',topicTitle:'Topic 1'},
    {id:'m2',subjectId:'s2',topicTitle:'Topic 2'}
  ];
  const miniTopicId=def=>'t-'+def.id;
  const routeAssessmentWeakSkillSignal=(subjectId)=>{
    if(subjectId==='s1')return {attempts:2,weak:[
      {skill:'A',total:4,correct:1,wrong:2,blank:1,weightedMissRate:.75},
      {skill:'B',total:4,correct:3,wrong:1,blank:0,weightedMissRate:.25}
    ]};
    return {attempts:1,weak:[{skill:'C',total:4,correct:0,wrong:3,blank:1,weightedMissRate:1}]};
  };
  const fn=new Function('miniTopicId','routeAssessmentWeakSkillSignal',src+';return miniWeaknessOverviewData;')(miniTopicId,routeAssessmentWeakSkillSignal);
  const items=fn(minis);
  assert.equal(items[0].skill,'C');
  assert.equal(items[0].missed,4);
  assert.ok(items.some(x=>x.skill==='A'));
}

// 5) Workspace v3 sync metadata must survive backup validation and reject cross-workspace identity.
{
  const scriptBodies=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].map(m=>m[2]||'').filter(Boolean);
  const catalogJs=externalCatalogJs;
  const coreJs=scriptBodies.find(x=>x.includes('root.RotaCore='));
  assert.ok(catalogJs&&coreJs,'Catalog/core scripts must be available for workspace v3 migration test');
  const env={crypto:{randomUUID:()=> '11111111-2222-4333-8444-555555555555'}};
  new Function('window','globalThis',catalogJs)(env,env);
  new Function('window','globalThis',externalWorkspaceJs)(env,env);
  new Function('window','globalThis',coreJs)(env,env);
  const backup=env.RotaCore.fresh();backup.activeExam='kpss';
  backup.workspaces.kpss.sync={version:1,workspaceId:'ws-kpss-stable123',revision:9,updatedAt:12345};
  const validated=env.RotaCore.validateBackup(backup);
  assert.equal(validated.workspaces.kpss.schemaVersion,3);
  assert.equal(validated.workspaces.kpss.sync.workspaceId,'ws-kpss-stable123');
  assert.equal(validated.workspaces.kpss.sync.revision,9);
  assert.equal(validated.workspaces.kpss.sync.updatedAt,12345);

  const legacy=JSON.parse(JSON.stringify(backup));
  legacy.workspaces.kpss.schemaVersion=2;
  delete legacy.workspaces.kpss.sync;
  const migrated=env.RotaCore.validateBackup(legacy).workspaces.kpss;
  assert.equal(migrated.schemaVersion,3);
  assert.match(migrated.sync.workspaceId,/^ws-kpss-/);
  assert.equal(migrated.sync.revision,0);

  const invalid=JSON.parse(JSON.stringify(backup));
  invalid.workspaces.kpss.sync.workspaceId='ws-yks-wrong123';
  assert.throws(()=>env.RotaCore.validateBackup(invalid),/workspace kimliği/i);
}

// 5) Backup validation must round-trip mini answers, subtopic evidence and the stored route decision.
{
  const scriptBodies=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].map(m=>m[2]||'').filter(Boolean);
  const catalogJs=externalCatalogJs;
  const coreJs=scriptBodies.find(x=>x.includes('root.RotaCore='));
  assert.ok(catalogJs&&coreJs,'Catalog/core scripts must be available for backup round-trip test');
  const env={};
  new Function('window','globalThis',catalogJs)(env,env);
  new Function('window','globalThis',externalWorkspaceJs)(env,env);
  new Function('window','globalThis',coreJs)(env,env);
  const backup=env.RotaCore.fresh();backup.activeExam='kpss';
  backup.workspaces.kpss.assessments=[{
    id:'mini-backup-1',miniId:'kpss-problemler-01',version:1,date:'2026-09-19',subjectId:'k-ma',topicId:'k-ma-9',title:'KPSS Problemler Mini #01',
    total:10,correct:6,wrong:2,blank:2,minutes:12,answers:[2,3,-1,2,1,2,-1,2,0,3],
    skillBreakdown:[{skill:'Yüzde',total:2,correct:1,wrong:0,blank:1},{skill:'Oran-orantı',total:8,correct:5,wrong:2,blank:1}],
    weakSkills:['Yüzde'],routeDecision:{mode:'repair',label:'ONARIM MODU',note:'Yüzde açığı',confidence:70,evidence:['mini: Yüzde alt konusu']},created:1
  }];
  const validated=env.RotaCore.validateBackup(backup),saved=validated.workspaces.kpss.assessments[0];
  assert.equal(saved.answers.length,10);
  assert.equal(saved.skillBreakdown[0].skill,'Yüzde');
  assert.deepEqual(saved.weakSkills,['Yüzde']);
  assert.equal(saved.routeDecision.mode,'repair');
  assert.equal(saved.routeDecision.confidence,70);
  assert.equal(validated.workspaces.kpss.exams.length,0,'Mini backup record must not leak into full exams');
}

// 5) Backup validation must preserve route intervention audit history.
{
  const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].map(m=>({attrs:m[1]||'',js:m[2]||''})).filter(x=>x.js.trim());
  const catalogJs=externalCatalogJs,coreJs=scripts.find(x=>x.js.includes('root.RotaCore='))?.js;
  const env={};new Function('window','globalThis','module',catalogJs)(env,env,{exports:{}});new Function('window','globalThis','module',externalWorkspaceJs)(env,env,{exports:{}});new Function('window','globalThis','module',coreJs)(env,env,{exports:{}});
  const backup=env.RotaCore.fresh();backup.activeExam='kpss';
  backup.workspaces.kpss.route.interventions=[{id:'iv1',date:'2026-09-19',subjectId:'k-ma',topicId:'k-ma-9',mode:'repair',source:'mini_repair',method:'quant',taskId:'task1',taskDate:'2026-09-19',confidence:72,baselineAccuracy:50,baselineCompletion:60,baselineNeed:78,baselineAnswered:20,reason:'Mini açığı',created:1}];
  const validated=env.RotaCore.validateBackup(backup),iv=validated.workspaces.kpss.route.interventions[0];
  assert.equal(validated.workspaces.kpss.route.version,2);
  assert.equal(iv.mode,'repair');
  assert.equal(iv.baselineAccuracy,50);
  assert.equal(iv.confidence,72);
  assert.equal(iv.topicId,'k-ma-9');
}

// 5) Backup validation must preserve decision-mode history used by progress hysteresis.
{
  const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].map(m=>({attrs:m[1]||'',js:m[2]||''})).filter(x=>x.js.trim());
  const catalogJs=externalCatalogJs,coreJs=scripts.find(x=>x.js.includes('root.RotaCore='))?.js;
  const env={};new Function('window','globalThis','module',catalogJs)(env,env,{exports:{}});new Function('window','globalThis','module',externalWorkspaceJs)(env,env,{exports:{}});new Function('window','globalThis','module',coreJs)(env,env,{exports:{}});
  const backup=env.RotaCore.fresh();backup.activeExam='kpss';
  backup.workspaces.kpss.route.modeHistory=[{date:'2026-09-19',subjectId:'k-ma',topicId:'k-ma-9',mode:'progress',studentState:'steady',confidence:88,performance:73,learningNeed:24,hysteresisHeld:true,easeHysteresisHeld:true,easeEntryHeld:true,easeRecoveryHeld:true,created:1}];
  const row=env.RotaCore.validateBackup(backup).workspaces.kpss.route.modeHistory[0];
  assert.equal(row.mode,'progress');
  assert.equal(row.studentState,'steady');
  assert.equal(row.hysteresisHeld,true);
  assert.equal(row.easeHysteresisHeld,true);
  assert.equal(row.easeEntryHeld,true);
  assert.equal(row.easeRecoveryHeld,true);
  assert.equal(row.performance,73);
}

// 5) Pilot telemetry must persist pseudonymous 0/7/14/30 checkpoint snapshots.
{
  const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].map(m=>({attrs:m[1]||'',js:m[2]||''})).filter(x=>x.js.trim());
  const catalogJs=externalCatalogJs,coreJs=scripts.find(x=>x.js.includes('root.RotaCore='))?.js;
  const env={};new Function('window','globalThis','module',catalogJs)(env,env,{exports:{}});new Function('window','globalThis','module',externalWorkspaceJs)(env,env,{exports:{}});new Function('window','globalThis','module',coreJs)(env,env,{exports:{}});
  const backup=env.RotaCore.fresh();backup.activeExam='kpss';
  backup.workspaces.kpss.route.pilot={
    version:1,enabled:true,participantId:'p-test-001',startDate:'2026-09-19',startedAt:1,completedAt:0,
    snapshots:[{
      checkpoint:7,milestoneDay:7,actualDay:7,windowStart:'2026-09-19',windowEnd:'2026-09-26',targetDate:'2026-09-26',capturedDate:'2026-09-26',capturedAt:2,delayDays:0,
      planned:{tasks:12,minutes:300,questions:120},
      actual:{completedTasks:10,skippedTasks:1,laterTasks:1,minutes:260,questions:105,correct:80,wrong:25,accuracy:76.2,completion:83.3,questionAttainmentRatio:.875},
      exam:{count:1,latestDate:'2026-09-25',latestNet:63.5},
      mistakes:{openAtCapture:2,created:3,resolved:1},
      mastery:{completedTopics:4,mastery:74,forgettingDue:1,retentionRefresh:1},
      modes:{steady:5,repair:2,ease:1,progress:0,transitions:2,bounces:1,repairDays:2,sustainableDays:1,steadyDays:5,progressDays:0,current:'steady'},
      interventions:{total:2,helpful:1,neutral:0,harmful:0,insufficient:0,confounded:0,pending:1,horizons:{7:{helpful:1,neutral:0,harmful:0,insufficient:0,confounded:0,pending:0},14:{helpful:0,neutral:0,harmful:0,insufficient:0,confounded:0,pending:0},30:{helpful:0,neutral:0,harmful:0,insufficient:0,confounded:0,pending:0}},latest:{date:'2026-09-25',mode:'repair',status:'helpful'}},
      student:{state:'steady',performance:72,learningNeed:36,risk:44,confidence:81,execution:78,retention:71,trend:'up',personalNorm:'flat',velocity:'steady'},
      dataQuality:{capturedOnTime:true,plannedExact:true,openMistakesExact:true,modeHistoryExact:true,interventionHistoryExact:true,studentModelExact:true,masteryExact:true,actualLogsExact:true}
    }]
  };
  const pilot=env.RotaCore.validateBackup(backup).workspaces.kpss.route.pilot,s=pilot.snapshots[0];
  assert.equal(pilot.participantId,'p-test-001');
  assert.equal(pilot.enabled,true);
  assert.equal(pilot.startDate,'2026-09-19');
  assert.equal(s.checkpoint,7);
  assert.equal(s.milestoneDay,7);
  assert.equal(s.actualDay,7);
  assert.equal(s.windowStart,'2026-09-19');
  assert.equal(s.windowEnd,'2026-09-26');
  assert.equal(s.actual.accuracy,76.2);
  assert.equal(s.actual.skippedTasks,1);
  assert.equal(s.actual.laterTasks,1);
  assert.equal(s.actual.questionAttainmentRatio,.875);
  assert.equal(s.mastery.mastery,74);
  assert.equal(s.modes.transitions,2);
  assert.equal(s.modes.bounces,1);
  assert.equal(s.modes.repairDays,2);
  assert.equal(s.modes.sustainableDays,1);
  assert.equal(s.modes.steadyDays,5);
  assert.equal(s.interventions.helpful,1);
  assert.equal(s.interventions.horizons[7].helpful,1);
  assert.deepEqual(s.interventions.latest,{date:'2026-09-25',mode:'repair',status:'helpful'});
  assert.equal(s.student.state,'steady');
  assert.equal(s.student.execution,78);
  assert.equal(s.student.retention,71);
  assert.equal(s.student.trend,'up');
  assert.equal(s.dataQuality.openMistakesExact,true);
  assert.equal(s.dataQuality.studentModelExact,true);
  assert.equal(s.dataQuality.masteryExact,true);

  const unknown=JSON.parse(JSON.stringify(backup));
  unknown.workspaces.kpss.route.pilot.snapshots[0].mistakes.openAtCapture=null;
  unknown.workspaces.kpss.route.pilot.snapshots[0].mastery={completedTopics:null,mastery:null,forgettingDue:null,retentionRefresh:null};
  unknown.workspaces.kpss.route.pilot.snapshots[0].student.execution=null;
  unknown.workspaces.kpss.route.pilot.snapshots[0].student.retention=null;
  const unknownSnap=env.RotaCore.validateBackup(unknown).workspaces.kpss.route.pilot.snapshots[0];
  assert.equal(unknownSnap.mistakes.openAtCapture,null,'Unknown open mistakes must remain null');
  assert.equal(unknownSnap.mastery.mastery,null,'Unknown mastery must remain null');
  assert.equal(unknownSnap.student.execution,null,'Unknown execution must remain null');

  const duplicate=JSON.parse(JSON.stringify(backup));
  duplicate.workspaces.kpss.route.pilot.snapshots.push(JSON.parse(JSON.stringify(duplicate.workspaces.kpss.route.pilot.snapshots[0])));
  assert.throws(()=>env.RotaCore.validateBackup(duplicate),/yinelenemez/,'Duplicate pilot checkpoints must be rejected');

  const invalid=JSON.parse(JSON.stringify(backup));
  invalid.workspaces.kpss.route.pilot.snapshots[0].windowEnd='2026-09-27';
  assert.throws(()=>env.RotaCore.validateBackup(invalid),/penceresi geçersiz/,'Invalid pilot telemetry window must be rejected');
}
for(const marker of [
  "pilot:{version:1,enabled:false",
  'function routePilotSnapshot',
  'function routePilotAutoSnapshot',
  'function routePilotSettingsCard',
  "schema:'calisma-rotasi-pilot-v1'",
  "case 'pilot-start'",
  "case 'pilot-export'",
  '[0,7,14,30]',
  'openMistakesExact',
  'plannedExact',
  'modeHistoryExact',
  'routePilotCurrentStudentSummary',
  'routePilotMasterySummary',
  'questionAttainmentRatio',
  'studentModelExact',
  'masteryExact',
  'horizons:{7',
  "observability:metrics,events",
  'Karar geri dönüşü',
  'ONARIM→DENGE/İLERLEME',
  '3 gün kaçırma',
  '7 gün kaçırma'
]) assert.ok(html.includes(marker),`Missing pilot telemetry marker: ${marker}`);

// 5) Guard Deneme Merkezi persistence and integration against accidental regression.
for(const marker of [
  'assessments:[]',
  'w.assessments=Array.isArray(old.assessments)',
  'space.assessments=Array.isArray(space.assessments)',
  'function routeAssessmentSamples',
  'w().assessments.push(result)',
  'version:def.version||1',
  'answers,skillBreakdown,weakSkills,created:Date.now()',
  'function miniAttemptById',
  'function openMiniAttemptResult',
  'mini-result-detail',
  'Rota Mini Deneme sonucu ders, konu ve alt-konu performansına eklendi',
  'DENEME MERKEZİ · ROTA İLE BAĞLI',
  'KPSS Problemler Mini #01',
  'TYT Paragraf Mini #01',
  'KPSS İnkılap Tarihi Mini #01',
  "KPSS Türkiye'nin Konumu Mini #01",
  'TYT Biyoloji Hücre Mini #01',
  'AYT Tanzimat Edebiyatı Mini #01',
  'YDT Grammar Mini #01',
  'YDT Kelime Mini #01',
  'YDT Reading Mini #01',
  'KPSS Vatandaşlık Hukukun Temelleri Mini #01',
  'TYT Matematik Temel Kavramlar Mini #01',
  'TYT Fizik Hareket ve Kuvvet Mini #01',
  'AYT Matematik Fonksiyonlar Mini #01',
  'TYT Kimya Atom ve Periyodik Sistem Mini #01',
  'AYT Fizik Vektörler Mini #01',
  'AYT Biyoloji Sinir Sistemi Mini #01',
  'AYT Tarih-1 İlk Çağ Uygarlıkları Mini #01',
  'AYT Kimya Modern Atom Teorisi Mini #01',
  'AYT Coğrafya-1 Doğal Sistemler Mini #01',
  'AYT Felsefe Grubu Felsefe Tarihi Mini #01',
  'ROTA’NIN ÖNERİSİ',
  'function miniRecommendationScore',
  'function miniRecommendation',
  'function miniRecommendationContext',
  'stats.openTopic',
  'stats.topicStarted',
  'started=eligible.filter',
  'stats.subjectDaysSince',
  'Rota kararı',
  'Rota kararı · bu sonuçtan sonra',
  'Alt konu sinyali:',
  'Mini deneme odağı:',
  'Rota aynı denemeyi sık sık önermek yerine en az 3 gün',
  'function miniDistinctAttempts',
  'function miniProgressSection',
  'function miniWeaknessOverviewData',
  'function miniWeaknessOverview',
  'Son 21 gün · alt-konu açıkları',
  'AKTİF KONU',
  'Mini gelişim grafikleri',
  'Aynı gün yapılan tekrarlar grafiği şişirmez',
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
