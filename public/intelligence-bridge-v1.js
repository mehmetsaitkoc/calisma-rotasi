/* Çalışma Rotası Intelligence Bridge V1
   Binds Intelligence V1 to the existing Route Engine through a narrow runtime boundary.
   Low-confidence evidence never forces a mode or scheduler change. */
(function(root){
'use strict';

let installed=false;
let originals={};
let profileCache={key:'',value:null};
let methodCache={key:'',values:new Map()};

function runtime(){
  const rt=root.RotaRuntimeV1;
  return rt&&rt.version===1?rt:null;
}
function legacyFn(name){return typeof root[name]==='function'?root[name]:null;}
function currentBindings(){
  const rt=runtime();
  if(rt?.getBindings){
    try{return rt.getBindings()||{};}catch{}
  }
  return {
    routeStudentModel:legacyFn('routeStudentModel'),
    routeAppliedDecision:legacyFn('routeAppliedDecision'),
    routeTaskReason:legacyFn('routeTaskReason'),
    routeBuildCandidates:legacyFn('routeBuildCandidates'),
    teacherStudentContext:legacyFn('teacherStudentContext'),
    routeSubjectGap:legacyFn('routeSubjectGap'),
    routeDaysToTarget:legacyFn('routeDaysToTarget'),
    routeTopicMasterySignal:legacyFn('routeTopicMasterySignal'),
    routeTopicMasteryScore:legacyFn('routeTopicMasteryScore'),
    routeRecoverySignal:legacyFn('routeRecoverySignal'),
    routeInterventionPolicyAdjustment:legacyFn('routeInterventionPolicyAdjustment'),
    routeInterventionEffectSignal:legacyFn('routeInterventionEffectSignal'),
    routeInterventionEvaluation:legacyFn('routeInterventionEvaluation'),
    routeStudyMethod:legacyFn('routeStudyMethod'),
    routeRecordInterventions:legacyFn('routeRecordInterventions')
  };
}
function helper(name){
  const b=currentBindings();
  return typeof b[name]==='function'?b[name]:legacyFn(name);
}
function workspace(){
  try{return runtime()?.getWorkspace?.()||legacyFn('w')?.()||null;}catch{return null;}
}
function todayValue(){
  try{return runtime()?.getToday?.()||legacyFn('today')?.()||new Date().toISOString().slice(0,10);}
  catch{return new Date().toISOString().slice(0,10);}
}
function intelligence(){return root.RotaIntelligenceV1||null;}
function finite(v){return v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));}
function cacheKey(space,today){
  if(!space)return today+'|none';
  return [
    today,
    space.exam||'',
    space.sync?.workspaceId||'',
    space.sync?.revision||0,
    space.logs?.length||0,
    space.assessments?.length||0,
    space.exams?.length||0,
    space.mistakes?.length||0,
    space.mistakes?.filter?.(x=>!x.resolved)?.length||0,
    space.plan?.length||0,
    space.plan?.filter?.(x=>x.done)?.length||0,
    space.taskEvents?.length||0,
    space.route?.modeHistory?.length||0
  ].join('|');
}
function profile(){
  const I=intelligence(),space=workspace(),day=todayValue();
  if(!I||!space)return null;
  const key=cacheKey(space,day);
  if(profileCache.key===key)return profileCache.value;
  try{
    const value=I.longitudinalProfile(space,day);
    profileCache={key,value};
    return value;
  }catch{return null;}
}
function subjectGap(subjectId){
  try{return helper('routeSubjectGap')?.(subjectId)||helper('routeNetGap')?.()||null;}catch{return null;}
}
function daysLeft(){
  try{return helper('routeDaysToTarget')?.()??null;}catch{return null;}
}
function recoveryActive(){
  try{return !!helper('routeRecoverySignal')?.()?.active;}catch{return false;}
}
function targetRiskFor(subjectId,model=null){
  const I=intelligence(),p=profile();
  if(!I||!p)return null;
  const gap=subjectGap(subjectId)||{},completion=p.windows?.d30?.execution?.completion;
  const modelConfidence=Number(model?.confidence);
  const confidence=finite(modelConfidence)?Math.min(p.confidence,modelConfidence):p.confidence;
  try{
    return I.targetRisk({
      currentNet:gap.known?gap.current:undefined,
      targetNet:gap.known?gap.target:undefined,
      daysLeft:daysLeft(),
      completion:finite(completion)?completion:undefined,
      performance:finite(model?.performance)?model.performance:undefined,
      retention:finite(model?.retention)?model.retention:undefined,
      trend:model?.trend?.direction||p.trend,
      openMistakes:finite(model?.openMistakes)?Number(model.openMistakes):(p.windows?.d60?.openMistakes||0),
      confidence
    });
  }catch{return null;}
}
function repairFor(model){
  const I=intelligence();
  if(!I||!model)return null;
  try{
    return I.repairProposal({
      confidence:model.confidence,
      performance:model.performance,
      retention:model.retention,
      openMistakes:model.openMistakes,
      repeatedError:model.errorRepeated,
      trend:model.trend?.direction||'unknown'
    });
  }catch{return null;}
}
function loadPrescription(){
  const I=intelligence(),p=profile();
  if(!I?.executionPrescription||!p)return null;
  try{return I.executionPrescription(p);}catch{return null;}
}
function outcomeMemoryFor(subjectId,topicId,mode){
  const I=intelligence();
  if(!I?.interventionMemory||!['repair','ease','progress'].includes(mode))return null;
  try{
    const policyFn=helper('routeInterventionPolicyAdjustment');
    const effectFn=helper('routeInterventionEffectSignal');
    const policy=policyFn?policyFn(subjectId,topicId,mode):null;
    const effect=policy?.effect||(effectFn?effectFn(subjectId,topicId,mode):null);
    return I.interventionMemory({mode,effect:effect||{}});
  }catch{return null;}
}
function methodStrategyMemoryFor(subjectId,topicId='',mode=''){
  const I=intelligence(),space=workspace(),evaluate=helper('routeInterventionEvaluation');
  if(!I?.methodStrategyMemory||!I?.methodStrategyKey||!space||typeof evaluate!=='function'||!subjectId||!['repair','ease','progress'].includes(mode))return null;
  const baseKey=cacheKey(space,todayValue());
  if(methodCache.key!==baseKey)methodCache={key:baseKey,values:new Map()};
  const study=helper('routeStudyMethod');
  let currentMethod='';
  try{currentMethod=study?.(subjectId,topicId,'')?.key||'';}catch{}
  const currentKey=I.methodStrategyKey(currentMethod,mode);
  const cacheId=[subjectId,topicId,mode,currentKey].join('|');
  if(methodCache.values.has(cacheId))return methodCache.values.get(cacheId);
  const all=safeInterventions(space).filter(x=>x.subjectId===subjectId);
  const toSamples=rows=>rows.slice(-24).map(iv=>{
    let evaluation=null;try{evaluation=evaluate(iv);}catch{}
    if(!evaluation||!['helpful','neutral','harmful'].includes(evaluation.status))return null;
    return {method:iv.method||'',mode:iv.mode||'',source:iv.source||'',status:evaluation.status,maturity:Number(evaluation.maturity)||0,score:Number(evaluation.score)||0};
  }).filter(Boolean);
  const exact=topicId?toSamples(all.filter(x=>x.topicId===topicId)):[];
  const subject=toSamples(all);
  const useExact=exact.length>=2;
  const samples=useExact?exact:subject;
  const memory=I.methodStrategyMemory({samples,currentKey});
  const value={...memory,scope:useExact?'topic':'subject',subjectId,topicId,currentMethod,currentKey};
  methodCache.values.set(cacheId,value);
  return value;
}
function safeInterventions(space){
  return Array.isArray(space?.route?.interventions)?space.route.interventions:[];
}
function methodMemoryForTask(task,mode){
  if(!task?.subjectId||!['repair','ease','progress'].includes(mode))return null;
  const I=intelligence(),study=helper('routeStudyMethod');
  let method='';try{method=study?.(task.subjectId,task.topicId||'',task.title||'')?.key||'';}catch{}
  const memory=methodStrategyMemoryFor(task.subjectId,task.topicId||'',mode);
  if(!memory||!I?.methodStrategyKey)return memory;
  const currentKey=I.methodStrategyKey(method,mode),current=memory.strategies?.find(x=>x.key===currentKey)||memory.current||null;
  return {...memory,currentMethod:method,currentKey,current};
}
function adaptTaskMethod(task,mode){
  const I=intelligence(),memory=methodMemoryForTask(task,mode),current=memory?.current;
  if(!I?.methodVariation||!current?.known||!['change','repeat'].includes(current.action))return {task,memory};
  const variation=I.methodVariation(memory.currentMethod,mode,current.action);
  if(!variation)return {task,memory};
  const next={...task};
  if(current.action==='change'){
    next.intelligenceMethodVariant='alt';
    next.intelligenceBaseMethod=memory.currentMethod||'';
    next.taskGoal=(variation+' '+String(next.taskGoal||'')).slice(0,300);
    const note=' Öğrenen yöntem hafızası: bu çalışma biçimi olgun geri testlerde yeterli sonuç vermedi; aynı hedef farklı uygulamayla deneniyor.';
    const reason=String(next.reason||'');
    next.reason=(reason.includes('Öğrenen yöntem hafızası:')?reason:reason+note).slice(0,500);
  }else{
    const note=' Öğrenen yöntem hafızası: bu çalışma biçiminin çekirdeği geçmişte çoğunlukla işe yaradı.';
    const reason=String(next.reason||'');
    next.reason=(reason.includes('Öğrenen yöntem hafızası:')?reason:reason+note).slice(0,700);
  }
  return {task:next,memory};
}

function applyOutcomeMemory(decision,memory){
  const out={...decision};
  let guard='none',strategy='hold';
  if(!memory?.known)return {...out,intelligenceOutcomeGuard:guard,intelligenceStrategy:strategy};
  if(memory.action==='repeat')strategy='repeat_core';
  else if(memory.action==='change')strategy='change_method';
  if(recoveryActive())return {...out,intelligenceOutcomeGuard:'recovery_preserved',intelligenceStrategy:strategy};
  if(memory.action==='change'&&memory.mode==='progress'&&out.mode==='progress'){
    out.mode='steady';
    out.label='GELİŞİM BEKLETİLDİ';
    out.note='Önceki seviye artışları uzun dönem geri testte yeterli sonuç vermedi. Yeni zorluk artışı bekletildi; bir güçlü doğrulama daha gerekiyor.';
    guard='harmful_progress_hold';
  }else if(memory.action==='change'&&['repair','ease'].includes(memory.mode)&&out.mode===memory.mode){
    const prefix=memory.mode==='repair'
      ?'Aynı onarım yaklaşımı geçmişte yeterli sonuç vermedi; onarım ihtiyacı sürüyor ama yöntem varyasyonu gerekiyor.'
      :'Yalnızca görev hacmini küçültmek geçmişte yeterli olmadı; sürdürülebilir doz korunurken sürtünmenin nedeni ayrıca değiştirilmelidir.';
    out.note=(out.note?out.note+' ':'')+prefix;
    guard='method_change_required';
  }else if(memory.action==='repeat'&&out.mode===memory.mode){
    out.note=(out.note?out.note+' ':'')+'Bu müdahalenin çekirdeği önceki olgun geri testlerde çoğunlukla işe yaradı; aynı temel yaklaşım korunuyor.';
    guard='helpful_core_preserved';
  }
  return {...out,intelligenceOutcomeGuard:guard,intelligenceStrategy:strategy};
}
function redFlags(model){
  if(!model)return 0;
  let n=0;
  if(finite(model.performance)&&model.performance<60)n++;
  if(finite(model.retention)&&model.retention<60)n++;
  if((Number(model.openMistakes)||0)>=2)n++;
  if(model.errorRepeated)n++;
  if(model.trend?.known&&model.trend.direction==='down')n++;
  if(model.personalNorm?.known&&model.personalNorm.confidence>=45&&model.personalNorm.direction==='down')n++;
  return n;
}
function applyGuard(decision,model,risk,repair,load=null){
  const out={...decision};
  const flags=redFlags(model);
  let guard='none';
  if(recoveryActive())return {...out,intelligenceGuard:'recovery_preserved'};
  if(load?.mode==='ease'&&repair?.mode!=='repair'&&['progress','steady'].includes(out.mode)){
    out.mode='ease';
    out.label='SÜRDÜRÜLEBİLİR DOZ';
    out.note=load.reason;
    guard='longitudinal_ease';
  }
  if(repair?.mode==='repair'&&(model?.confidence||0)>=65&&flags>=2){
    if(out.mode==='progress'){
      out.mode='steady';
      out.label='ONARIM ÖNCESİ DOĞRULAMA';
      out.note='Güçlü ilerleme sinyali olsa da birden fazla güncel risk işareti var. Motor yeni yükü artırmadan önce kısa doğrulama/onarımla kanıtı netleştiriyor.';
      guard='progress_suppressed';
    }else if(out.mode==='steady'&&!out.hysteresisHeld&&!out.easeEntryHeld&&!out.easeRecoveryHeld){
      out.mode='repair';
      out.label='ONARIM ÖNCELİĞİ';
      out.note=repair.reason||'Birden fazla güncel kanıt kısa onarım gerektiriyor.';
      guard='repair_promoted';
    }
  }
  if(risk?.band==='high'&&out.mode==='progress'){
    out.mode='steady';
    out.label='HEDEF RİSKİ · KONTROLLÜ';
    out.note='Hedef riski yüksek olduğu için zorluk artışı bekletildi; önce mevcut açıkların kapanması doğrulanacak.';
    guard='target_risk_hold';
  }
  return {...out,intelligenceGuard:guard};
}
function rawModel(subjectId,topicId=''){
  if(!originals.routeStudentModel)return null;
  try{return originals.routeStudentModel(subjectId,topicId);}catch{return null;}
}
function rawDecision(subjectId,topicId=''){
  if(!originals.routeAppliedDecision)return null;
  try{return originals.routeAppliedDecision(subjectId,topicId);}catch{return null;}
}
function masteryFor(topicId){
  if(!topicId)return null;
  try{
    const signal=helper('routeTopicMasterySignal');
    if(signal)return signal(topicId);
    const score=helper('routeTopicMasteryScore');
    return score?score(topicId):null;
  }catch{return null;}
}
function snapshot(subjectId,topicId='',task=null){
  const I=intelligence(),model=rawModel(subjectId,topicId),p=profile(),risk=targetRiskFor(subjectId,model),repair=repairFor(model),load=loadPrescription();
  const baseDecision=rawDecision(subjectId,topicId);
  const guarded=baseDecision?applyGuard(baseDecision,model,risk,repair,load):null;
  const memoryMode=['repair','ease','progress'].includes(guarded?.mode)?guarded.mode:(['repair','ease','progress'].includes(baseDecision?.mode)?baseDecision.mode:'');
  const outcomeMemory=memoryMode?outcomeMemoryFor(subjectId,topicId,memoryMode):null;
  const decision=guarded?applyOutcomeMemory(guarded,outcomeMemory):null;
  const methodMemory=memoryMode?methodMemoryForTask(task||{subjectId,topicId,title:''},memoryMode):null;
  let explanation=null;
  if(I&&task){
    try{explanation=I.explainTask({task,model:model||{},decision:decision||{},risk,mastery:masteryFor(topicId),outcomeMemory,methodMemory});}catch{}
  }
  return {version:1,profile:p,model,risk,repair,load,outcomeMemory,methodMemory,decision,explanation};
}
function installHooks(hooks){
  const rt=runtime();
  if(rt?.installIntelligenceHooks){
    rt.installIntelligenceHooks(hooks);
    return true;
  }
  for(const [name,value] of Object.entries(hooks))if(typeof value==='function')root[name]=value;
  return true;
}

function install(){
  if(installed||!intelligence())return installed;
  const b=currentBindings();
  if(typeof b.routeStudentModel!=='function'||typeof b.routeAppliedDecision!=='function')return false;
  originals={
    routeStudentModel:b.routeStudentModel,
    routeAppliedDecision:b.routeAppliedDecision,
    routeTaskReason:b.routeTaskReason,
    routeBuildCandidates:b.routeBuildCandidates,
    routeRecordInterventions:b.routeRecordInterventions,
    teacherStudentContext:b.teacherStudentContext
  };

  const patchedStudentModel=function(subjectId,topicId=''){
    const model=originals.routeStudentModel(subjectId,topicId);
    const p=profile();
    return {...model,longitudinal:p?{
      confidence:p.confidence,
      trend:p.trend,
      trendDelta:p.trendDelta,
      d7:p.windows?.d7||null,
      d30:p.windows?.d30||null,
      d60:p.windows?.d60||null
    }:null};
  };

  const patchedAppliedDecision=function(subjectId,topicId=''){
    const decision=originals.routeAppliedDecision(subjectId,topicId);
    const model=patchedStudentModel(subjectId,topicId);
    const risk=targetRiskFor(subjectId,model);
    const repair=repairFor(model),load=loadPrescription();
    const guarded=applyGuard(decision,model,risk,repair,load);
    const memoryMode=['repair','ease','progress'].includes(guarded.mode)?guarded.mode:(['repair','ease','progress'].includes(decision.mode)?decision.mode:'');
    const outcomeMemory=memoryMode?outcomeMemoryFor(subjectId,topicId,memoryMode):null;
    const learned=applyOutcomeMemory(guarded,outcomeMemory);
    return {...learned,intelligence:{risk,repair,load,outcomeMemory,profileConfidence:profile()?.confidence||0}};
  };

  const patchedTaskReason=typeof originals.routeTaskReason==='function'?function(task){
    const base=originals.routeTaskReason(task);
    const subjectId=task?.subjectId||'',topicId=task?.topicId||'';
    if(!subjectId)return base;
    const snap=snapshot(subjectId,topicId,task);
    const text=snap.explanation?.text;
    return text&&text.length>=12?text:base;
  }:null;

  const patchedBuildCandidates=typeof originals.routeBuildCandidates==='function'?function(){
    const rows=originals.routeBuildCandidates();
    if(!Array.isArray(rows)||recoveryActive()||loadPrescription()?.mode==='ease')return rows;
    const reviewSources=new Set(['mistake','mini_repair','retention_refresh','ai_teacher','spaced_review','checkpoint']);
    return rows.map(candidate=>{
      if(!candidate?.subjectId||!candidate.topicId)return candidate;
      if(candidate.source==='spaced_review'&&candidate.reviewVariant==='challenge'){
        const memory=outcomeMemoryFor(candidate.subjectId,candidate.topicId,'progress');
        if(memory?.known&&memory.action==='change'){
          const next={...candidate};
          delete next.reviewVariant;
          next.title=String(next.title||'').replace(/^Seviye yoklama · /,'3 gün tekrarı · ');
          next.priority=Math.max(68,Math.min(Number(next.priority)||68,72));
          next.reason='Önceki seviye artışları olgun geri testlerde yeterli sonuç vermedi. Bu yüzden seçici seviye yoklaması yerine normal kalıcılık tekrarı uygulanıyor.';
          next.taskGoal=('Kısa tut: amaç zorluğu artırmak değil kalıcılığı doğrulamak. '+String(next.taskGoal||'').replace(/^Seviye yoklama:\s*/,'').replace(/ · Son bölümde 2 daha seçici veya karma soru çöz; amaç daha çok soru değil, bilgiyi farklı biçimde kullanabildiğini görmek\./,'')).trim();
          return next;
        }
      }
      const decisionForMethod=patchedAppliedDecision(candidate.subjectId,candidate.topicId||'');
      const candidateMode=candidate.source==='mini_repair'||candidate.source==='mistake'||candidate.source==='ai_teacher'?'repair':(['repair','ease','progress'].includes(decisionForMethod?.mode)?decisionForMethod.mode:'');
      const adapted=candidateMode?adaptTaskMethod(candidate,candidateMode):{task:candidate,memory:null};
      candidate=adapted.task;
      if(reviewSources.has(candidate.source))return candidate;
      const snap=snapshot(candidate.subjectId,candidate.topicId,null);
      const risk=snap.risk,repair=snap.repair,model=snap.model;
      if(!risk?.reliable||risk.band!=='high'||repair?.mode!=='repair'||(model?.confidence||0)<55)return candidate;
      const boost=Math.min(3,Math.max(1,Math.round((Number(repair.priority)||70)/35)-1));
      const reason=String(candidate.reason||'');
      const note=' Intelligence V1: hedef riski ve konuya özgü onarım sinyali birlikte doğrulandığı için öncelik kontrollü artırıldı.';
      return {...candidate,priority:Math.min(96,(Number(candidate.priority)||0)+boost),reason:reason.includes('Intelligence V1:')?reason:reason+note};
    }).sort((a,b)=>(Number(b?.priority)||0)-(Number(a?.priority)||0)||String(a?.routeKey||'').localeCompare(String(b?.routeKey||'')));
  }:null;

  const patchedRecordInterventions=typeof originals.routeRecordInterventions==='function'?function(tasks){
    const space=workspace(),before=new Set(safeInterventions(space).map(x=>x.id)),list=Array.isArray(tasks)?tasks:[];
    const result=originals.routeRecordInterventions(tasks);
    if(!space)return result;
    const taskById=new Map(list.map(x=>[x.id,x]));
    for(const iv of safeInterventions(space)){
      if(before.has(iv.id))continue;
      const task=taskById.get(iv.taskId);
      if(!task||task.intelligenceMethodVariant!=='alt')continue;
      const base=String(task.intelligenceBaseMethod||iv.method||'').replace(/:alt$/,'').slice(0,52);
      if(base)iv.method=(base+':alt').slice(0,60);
      const marker=' Intelligence V1 yöntem varyasyonu uygulandı.';
      if(!String(iv.reason||'').includes('Intelligence V1 yöntem varyasyonu'))iv.reason=(String(iv.reason||'')+marker).slice(0,500);
    }
    methodCache={key:'',values:new Map()};
    return result;
  }:null;

  const patchedTeacherStudentContext=typeof originals.teacherStudentContext==='function'?function(record){
    const base=originals.teacherStudentContext(record)||{};
    const subjectId=record?.subjectId||'',topicId=record?.topicId||'';
    const snap=subjectId?snapshot(subjectId,topicId,null):{profile:profile(),risk:null,repair:null,model:null};
    const p=snap.profile;
    return {...base,intelligence:{
      version:1,
      profileConfidence:Number(p?.confidence)||0,
      trend:p?.trend||'unknown',
      trendDelta:Number.isFinite(p?.trendDelta)?p.trendDelta:null,
      execution7:Number.isFinite(p?.windows?.d7?.execution?.completion)?p.windows.d7.execution.completion:null,
      execution30:Number.isFinite(p?.windows?.d30?.execution?.completion)?p.windows.d30.execution.completion:null,
      activeDays30:Number(p?.windows?.d30?.activeDays)||0,
      targetRisk:snap.risk?{
        score:Number.isFinite(snap.risk.score)?snap.risk.score:null,
        band:snap.risk.band,
        label:snap.risk.label,
        action:snap.risk.action,
        reasons:(snap.risk.reasons||[]).slice(0,4)
      }:null,
      repair:snap.repair?{
        mode:snap.repair.mode,
        priority:Number(snap.repair.priority)||0,
        reason:snap.repair.reason
      }:null,
      load:snap.load?{
        mode:snap.load.mode,
        state:snap.load.state||'',
        completion7:Number.isFinite(snap.load.completion7)?snap.load.completion7:null,
        completion30:Number.isFinite(snap.load.completion30)?snap.load.completion30:null,
        reason:snap.load.reason
      }:null,
      outcomeMemory:snap.outcomeMemory?{
        known:!!snap.outcomeMemory.known,
        mode:snap.outcomeMemory.mode||'',
        action:snap.outcomeMemory.action||'hold',
        label:snap.outcomeMemory.label||'',
        total:Number(snap.outcomeMemory.total)||0,
        helpful:Number(snap.outcomeMemory.helpful)||0,
        harmful:Number(snap.outcomeMemory.harmful)||0,
        neutral:Number(snap.outcomeMemory.neutral)||0,
        score:Number.isFinite(snap.outcomeMemory.score)?snap.outcomeMemory.score:null,
        reason:snap.outcomeMemory.reason||''
      }:null,
      methodMemory:snap.methodMemory?{
        known:!!snap.methodMemory.known,
        scope:snap.methodMemory.scope||'',
        currentMethod:snap.methodMemory.currentMethod||'',
        current:snap.methodMemory.current?{
          action:snap.methodMemory.current.action,
          score:Number.isFinite(snap.methodMemory.current.score)?snap.methodMemory.current.score:null,
          confidence:Number(snap.methodMemory.current.confidence)||0,
          total:Number(snap.methodMemory.current.total)||0,
          label:snap.methodMemory.current.label||''
        }:null,
        preferred:snap.methodMemory.preferred?{
          method:snap.methodMemory.preferred.method||'',
          mode:snap.methodMemory.preferred.mode||'',
          score:Number.isFinite(snap.methodMemory.preferred.score)?snap.methodMemory.preferred.score:null,
          total:Number(snap.methodMemory.preferred.total)||0
        }:null
      }:null
    }};
  }:null;

  const hooks={
    routeStudentModel:patchedStudentModel,
    routeAppliedDecision:patchedAppliedDecision,
    ...(patchedTaskReason?{routeTaskReason:patchedTaskReason}:{}),
    ...(patchedBuildCandidates?{routeBuildCandidates:patchedBuildCandidates}:{}),
    ...(patchedRecordInterventions?{routeRecordInterventions:patchedRecordInterventions}:{}),
    ...(patchedTeacherStudentContext?{teacherStudentContext:patchedTeacherStudentContext}:{})
  };
  installHooks(hooks);

  root.RotaIntelligenceBridgeV1={
    version:1,
    profile,
    targetRiskFor,
    repairFor,
    loadPrescription,
    outcomeMemoryFor,
    methodStrategyMemoryFor,
    methodMemoryForTask,
    snapshotForSubject:(subjectId,topicId='')=>snapshot(subjectId,topicId,null),
    snapshotForTask:(task)=>snapshot(task?.subjectId||'',task?.topicId||'',task),
    invalidate:()=>{profileCache={key:'',value:null};methodCache={key:'',values:new Map()};},
    installed:()=>installed
  };
  installed=true;
  const rt=runtime();
  if(rt?.refresh&&typeof setTimeout==='function')setTimeout(()=>{try{rt.refresh();}catch{}},0);
  return true;
}

if(!install()){
  if(typeof document!=='undefined'&&document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else if(typeof setTimeout==='function')setTimeout(install,0);
}
})(typeof window!=='undefined'?window:globalThis);
