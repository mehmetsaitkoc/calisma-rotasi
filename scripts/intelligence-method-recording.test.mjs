import assert from 'node:assert/strict';

await import('../public/intelligence-v1.js');

const workspace={
  exam:'kpss',
  settings:{targetDate:'2026-11-01'},
  profile:{currentNet:60,targetNet:85},
  plan:[],
  logs:[
    {id:'l1',date:'2026-09-19',minutes:30,correct:12,wrong:8},
    {id:'l2',date:'2026-09-20',minutes:30,correct:13,wrong:7}
  ],
  assessments:[],
  exams:[],
  mistakes:[],
  taskEvents:[],
  route:{
    modeHistory:[],
    interventions:[
      {id:'base1',date:'2026-08-15',subjectId:'k-ma',topicId:'topic-1',mode:'repair',source:'mini_repair',method:'quant'},
      {id:'base2',date:'2026-08-22',subjectId:'k-ma',topicId:'topic-1',mode:'repair',source:'mini_repair',method:'quant'}
    ]
  },
  sync:{workspaceId:'ws-kpss-test',revision:3}
};

let seq=0;
const bindings={
  routeStudentModel:()=>({
    confidence:82,performance:54,retention:58,openMistakes:3,errorRepeated:true,
    trend:{known:true,direction:'down'},personalNorm:{known:true,confidence:60,direction:'down'}
  }),
  routeAppliedDecision:()=>({mode:'repair',label:'ONARIM',note:'Temel onarım',hysteresisHeld:false,easeEntryHeld:false,easeRecoveryHeld:false}),
  routeTaskReason:task=>task.reason||'Temel neden.',
  routeBuildCandidates:()=>[{
    id:'task-'+(++seq),routeKey:'mini-repair:'+seq,subjectId:'k-ma',topicId:'topic-1',
    title:'Mini onarım · Problemler',source:'mini_repair',kind:'review',priority:84,
    reason:'Mini deneme açığı.',taskGoal:'12 hedefli soru ve yanlış analizi.'
  }],
  routeRecordInterventions:tasks=>{
    for(const task of tasks){
      workspace.route.interventions.push({
        id:'record-'+task.id,date:'2026-09-21',subjectId:task.subjectId,topicId:task.topicId,
        mode:'repair',source:task.source,method:'quant',taskId:task.id,reason:task.reason||''
      });
    }
  },
  teacherStudentContext:()=>({contextVersion:2}),
  routeSubjectGap:()=>({known:true,current:60,target:85,gap:25}),
  routeDaysToTarget:()=>41,
  routeTopicMasterySignal:()=>({ready:false,next:'3-day'}),
  routeRecoverySignal:()=>({active:false}),
  routeInterventionPolicyAdjustment:()=>({action:'hold',effect:{known:false,total:0,helpful:0,harmful:0,neutral:0,score:0}}),
  routeInterventionEffectSignal:()=>({known:false,total:0,helpful:0,harmful:0,neutral:0,score:0}),
  routeInterventionEvaluation:iv=>{
    const helpful=String(iv.method||'').endsWith(':alt');
    return {status:helpful?'helpful':'harmful',score:helpful?1:-1,maturity:/2$/.test(iv.id)||String(iv.id).includes('task-2')?30:14};
  },
  routeStudyMethod:()=>({key:'quant',label:'SORU + YANLIŞ ANALİZİ'})
};

globalThis.RotaRuntimeV1={
  version:1,
  getWorkspace:()=>workspace,
  getToday:()=> '2026-09-21',
  getBindings:()=>bindings,
  installIntelligenceHooks:hooks=>Object.assign(bindings,hooks),
  refresh:()=>{}
};

await import('../public/intelligence-bridge-v1.js');
const bridge=globalThis.RotaIntelligenceBridgeV1;
assert.ok(bridge?.installed(),'Runtime bridge must install through RotaRuntimeV1');

const first=bindings.routeBuildCandidates();
assert.equal(first.length,1);
assert.equal(first[0].intelligenceMethodVariant,'alt','harmful base method must schedule an alternate method variant');
assert.match(first[0].taskGoal,/çözümlü örneği kapatıp kendin yeniden kur/i);
bindings.routeRecordInterventions(first);
const firstRecord=workspace.route.interventions.find(x=>x.taskId===first[0].id);
assert.equal(firstRecord.method,'quant:alt','alternate task outcome must be persisted under a distinct method key');
assert.match(firstRecord.reason,/Intelligence V1 yöntem varyasyonu/);

const afterOne=bridge.methodStrategyMemoryFor('k-ma','topic-1','repair');
assert.equal(afterOne.current.action,'change','base quant repair history must remain harmful');
assert.ok(!afterOne.preferred||afterOne.preferred.method!=='quant:alt','one alternate outcome must not create a preference');

const second=bindings.routeBuildCandidates();
assert.equal(second[0].intelligenceMethodVariant,'alt');
bindings.routeRecordInterventions(second);
const secondRecord=workspace.route.interventions.find(x=>x.taskId===second[0].id);
assert.equal(secondRecord.method,'quant:alt');

const learned=bridge.methodStrategyMemoryFor('k-ma','topic-1','repair');
assert.equal(learned.current.action,'change');
assert.equal(learned.preferred.method,'quant:alt','two mature helpful alternate outcomes may become the preferred method variant');
assert.equal(learned.preferred.action,'repeat');
assert.ok(learned.preferred.confidence>0);

console.log('Intelligence method recording passed: harmful base -> alternate variant -> separately measured helpful preference');
