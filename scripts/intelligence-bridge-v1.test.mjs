import assert from 'node:assert/strict';

await import('../public/intelligence-v1.js');

let recovery=false;
let methodEvaluationStatus='harmful';
let gapState={known:true,current:50,target:90,gap:40};
let daysState=19;
let outcomeEffects={
  repair:{known:false,total:0,helpful:0,harmful:0,neutral:0,score:0},
  ease:{known:false,total:0,helpful:0,harmful:0,neutral:0,score:0},
  progress:{known:false,total:0,helpful:0,harmful:0,neutral:0,score:0}
};

let modelState={
  confidence:82,
  performance:52,
  retention:48,
  openMistakes:4,
  errorRepeated:true,
  trend:{known:true,direction:'down'},
  personalNorm:{known:true,confidence:60,direction:'down'}
};

globalThis.w=()=>({
  profile:{currentNet:50,targetNet:90},
  settings:{targetDate:'2026-10-10'},
  plan:[
    {id:'p1',date:'2026-09-18',done:true,minutes:30},
    {id:'p2',date:'2026-09-19',done:false,minutes:30}
  ],
  logs:[
    {id:'l1',date:'2026-09-18',minutes:35,correct:10,wrong:10},
    {id:'l2',date:'2026-09-20',minutes:40,correct:11,wrong:9}
  ],
  assessments:[{id:'a1',date:'2026-09-20',correct:7,wrong:5}],
  exams:[{id:'e1',date:'2026-09-10'}],
  mistakes:[
    {id:'m1',date:'2026-09-18',resolved:false},
    {id:'m2',date:'2026-09-17',resolved:false},
    {id:'m3',date:'2026-09-16',resolved:false},
    {id:'m4',date:'2026-09-15',resolved:false}
  ],
  taskEvents:[
    {id:'ev1',date:'2026-09-18',action:'start'},
    {id:'ev2',date:'2026-09-19',action:'later'}
  ],
  route:{
    modeHistory:[{date:'2026-09-18',mode:'repair'}],
    interventions:[
      {id:'iv1',date:'2026-08-20',subjectId:'k-ma',topicId:'k-ma-topic',mode:'progress',source:'curriculum',method:'quant'},
      {id:'iv2',date:'2026-08-28',subjectId:'k-ma',topicId:'k-ma-topic',mode:'progress',source:'curriculum',method:'quant'},
      {id:'ivr1',date:'2026-08-18',subjectId:'k-ma',topicId:'k-ma-topic',mode:'repair',source:'mini_repair',method:'quant'},
      {id:'ivr2',date:'2026-08-26',subjectId:'k-ma',topicId:'k-ma-topic',mode:'repair',source:'mini_repair',method:'quant'}
    ]
  }
});
globalThis.today=()=> '2026-09-21';
globalThis.routeSubjectGap=()=>({...gapState});
globalThis.routeDaysToTarget=()=>daysState;
globalThis.routeRecoverySignal=()=>({active:recovery});
globalThis.routeInterventionEffectSignal=(subjectId,topicId,mode)=>({...outcomeEffects[mode]});
globalThis.routeInterventionPolicyAdjustment=(subjectId,topicId,mode)=>{
  const effect={...outcomeEffects[mode]};
  const action=!effect.known||effect.total<2?'hold':effect.score<=-.34?'change':effect.score>=.5?'repeat':'hold';
  return {action,label:action,effect};
};
globalThis.routeInterventionEvaluation=(iv)=>({
  status:methodEvaluationStatus,
  score:methodEvaluationStatus==='helpful'?1:methodEvaluationStatus==='harmful'?-1:0,
  maturity:/2$/.test(iv.id)?30:14
});
globalThis.routeStudyMethod=()=>({key:'quant',label:'SORU + YANLIŞ ANALİZİ'});
globalThis.routeTopicMasterySignal=()=>({ready:false,next:'3-day'});
globalThis.routeStudentModel=()=>({...modelState});
globalThis.routeAppliedDecision=()=>({
  mode:'progress',
  label:'GELİŞİM',
  note:'Dozu artır.',
  hysteresisHeld:false,
  easeEntryHeld:false,
  easeRecoveryHeld:false
});
globalThis.routeTaskReason=()=> 'Eski genel neden.';
globalThis.routeBuildCandidates=()=>[
  {routeKey:'topic:k-ma-topic',subjectId:'k-ma',topicId:'k-ma-topic',source:'curriculum',priority:60,reason:'Temel rota.'},
  {routeKey:'mini-repair-topic:k-ma-topic',subjectId:'k-ma',topicId:'k-ma-topic',source:'mini_repair',kind:'review',priority:84,reason:'Mini deneme onarımı.',taskGoal:'12 hedefli soru ve kısa yanlış analizi.'},
  {routeKey:'mistake:m1',subjectId:'k-ma',topicId:'k-ma-topic',source:'mistake',priority:88,reason:'Kritik yanlış.'},
  {routeKey:'spaced:3:k-ma-topic',subjectId:'k-ma',topicId:'k-ma-topic',source:'spaced_review',reviewWave:3,reviewVariant:'challenge',priority:64,title:'Seviye yoklama · Problemler',reason:'Güçlü performans sonrası seçici tekrar.',taskGoal:'Seviye yoklama: 12 soru çöz · Son bölümde 2 daha seçici veya karma soru çöz; amaç daha çok soru değil, bilgiyi farklı biçimde kullanabildiğini görmek.'}
];
globalThis.teacherStudentContext=(record)=>({
  contextVersion:2,
  selected:{subject:record?.subjectId||'',topic:record?.topicId||''},
  studentModel:{state:'repair'}
});

await import('../public/intelligence-bridge-v1.js');

const bridge=globalThis.RotaIntelligenceBridgeV1;
assert.ok(bridge,'Intelligence bridge must install');
assert.equal(bridge.installed(),true);

const profile=bridge.profile();
assert.ok(profile.confidence>=30,'fixture must provide enough longitudinal confidence');
assert.equal(profile.windows.d30.execution.completion,50);

const model=globalThis.routeStudentModel('k-ma','k-ma-topic');
assert.equal(model.longitudinal.confidence,profile.confidence,'patched student model must expose longitudinal context');

const decision=globalThis.routeAppliedDecision('k-ma','k-ma-topic');
assert.equal(decision.mode,'steady','strong repair evidence must suppress premature progress');
assert.equal(decision.intelligenceGuard,'progress_suppressed');
assert.equal(decision.intelligence.risk.band,'high');
assert.equal(decision.intelligence.repair.mode,'repair');

const boostedCandidates=globalThis.routeBuildCandidates();
const normalCandidate=boostedCandidates.find(x=>x.routeKey==='topic:k-ma-topic');
const reviewCandidate=boostedCandidates.find(x=>x.routeKey==='mistake:m1');
assert.ok(normalCandidate.priority>60&&normalCandidate.priority<=63,'high-confidence target + repair risk may only add a bounded priority boost');
assert.match(normalCandidate.reason,/Intelligence V1/);
assert.equal(reviewCandidate.priority,88,'critical review priorities must not be double-boosted');
const changedRepairTask=boostedCandidates.find(x=>x.routeKey==='mini-repair-topic:k-ma-topic');
assert.match(changedRepairTask.reason,/Öğrenen yöntem hafızası/,'harmful quant repair history must alter the future repair method');
assert.match(changedRepairTask.taskGoal||'',/çözümlü örneği kapatıp kendin yeniden kur/i);

recovery=true;
bridge.invalidate();
const recoveryDecision=globalThis.routeAppliedDecision('k-ma','k-ma-topic');
assert.equal(recoveryDecision.mode,'progress','Intelligence overlay must preserve the underlying engine decision while recovery mode owns the policy');
assert.equal(recoveryDecision.intelligenceGuard,'recovery_preserved');
const recoveryCandidates=globalThis.routeBuildCandidates();
assert.equal(recoveryCandidates.find(x=>x.routeKey==='topic:k-ma-topic').priority,60,'recovery mode must suppress Intelligence scheduler boosts');
recovery=false;
bridge.invalidate();

const task={id:'t1',subjectId:'k-ma',topicId:'k-ma-topic',kind:'review',source:'mistake',reason:'Eski neden'};
const why=globalThis.routeTaskReason(task);
assert.match(why,/yanlış/i,'task reason must explain mistake-linked prioritization');

const snap=bridge.snapshotForTask(task);
assert.equal(snap.risk.band,'high');
assert.equal(snap.repair.mode,'repair');
assert.equal(snap.explanation.headline,'Neden bugün?');

const teacherContext=globalThis.teacherStudentContext({subjectId:'k-ma',topicId:'k-ma-topic'});
assert.equal(teacherContext.intelligence.version,1);
assert.equal(teacherContext.intelligence.targetRisk.band,'high');
assert.equal(teacherContext.intelligence.repair.mode,'repair');
assert.ok(['collect','steady','ease'].includes(teacherContext.intelligence.load?.mode||'collect'));
assert.ok(Number.isFinite(teacherContext.intelligence.execution30));
assert.ok(['collect','steady','ease'].includes(bridge.loadPrescription()?.mode||'collect'));
assert.equal(teacherContext.intelligence.outcomeMemory?.action,'hold');
assert.equal(teacherContext.intelligence.methodMemory?.current?.action,'change','Rota Hoca must receive the learned current-method weakness');
assert.equal(teacherContext.intelligence.methodMemory?.currentMethod,'quant');

modelState={
  confidence:90,
  performance:88,
  retention:86,
  openMistakes:0,
  errorRepeated:false,
  trend:{known:true,direction:'up'},
  personalNorm:{known:true,confidence:70,direction:'up'}
};
gapState={known:true,current:82,target:84,gap:2};
daysState=120;
outcomeEffects.progress={known:true,total:3,helpful:0,harmful:2,neutral:1,score:-.67};
bridge.invalidate();
const harmfulProgress=globalThis.routeAppliedDecision('k-ma','k-ma-topic');
assert.equal(harmfulProgress.intelligence.outcomeMemory.action,'change');
assert.equal(harmfulProgress.mode,'steady','mature harmful progress history must hold another difficulty increase');
assert.equal(harmfulProgress.intelligenceOutcomeGuard,'harmful_progress_hold');
const harmfulCandidates=globalThis.routeBuildCandidates();
const convertedReview=harmfulCandidates.find(x=>x.routeKey==='spaced:3:k-ma-topic');
assert.equal(convertedReview.reviewVariant,undefined,'harmful progress memory must cancel the next challenge variant');
assert.match(convertedReview.title,/3 gün tekrarı/);
assert.match(convertedReview.reason,/normal kalıcılık tekrarı/);
methodEvaluationStatus='helpful';
outcomeEffects.progress={known:true,total:4,helpful:3,harmful:0,neutral:1,score:.75};
bridge.invalidate();
const helpfulProgress=globalThis.routeAppliedDecision('k-ma','k-ma-topic');
assert.equal(helpfulProgress.mode,'progress','helpful progress memory may preserve, but not amplify, the original progress decision');
assert.equal(helpfulProgress.intelligence.outcomeMemory.action,'repeat');
assert.equal(helpfulProgress.intelligenceOutcomeGuard,'helpful_core_preserved');
const helpfulCandidates=globalThis.routeBuildCandidates();
assert.equal(helpfulCandidates.find(x=>x.routeKey==='spaced:3:k-ma-topic').reviewVariant,'challenge','helpful progress memory may keep an already justified challenge review');
const preservedRepairTask=helpfulCandidates.find(x=>x.routeKey==='mini-repair-topic:k-ma-topic');
assert.match(preservedRepairTask.reason,/çekirdeği geçmişte çoğunlukla işe yaradı/,'helpful repair-method history must preserve the method core');

methodEvaluationStatus='harmful';
outcomeEffects.progress={known:false,total:0,helpful:0,harmful:0,neutral:0,score:0};
gapState={known:true,current:50,target:90,gap:40};
daysState=19;
modelState={
  confidence:18,
  performance:45,
  retention:null,
  openMistakes:5,
  errorRepeated:true,
  trend:{known:false,direction:'unknown'},
  personalNorm:{known:false,confidence:0,direction:'unknown'}
};
bridge.invalidate();
const low=globalThis.routeAppliedDecision('k-ma','k-ma-topic');
assert.equal(low.mode,'progress','low-confidence evidence must not force a route mode change');
assert.equal(low.intelligence.repair.mode,'collect');
const lowCandidates=globalThis.routeBuildCandidates();
assert.equal(lowCandidates.find(x=>x.routeKey==='topic:k-ma-topic').priority,60,'low-confidence evidence must not alter scheduler priority');

console.log('Intelligence Bridge V1 passed: runtime enrichment + bounded mode/scheduler guards + intervention outcome learning + explainable task reason + Rota Hoca context');
