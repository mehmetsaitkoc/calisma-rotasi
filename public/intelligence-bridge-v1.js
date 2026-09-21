/* Çalışma Rotası Intelligence Bridge V1
   Binds Intelligence V1 to the existing Route Engine through a narrow runtime boundary.
   Low-confidence evidence never forces a mode or scheduler change. */
(function(root){
'use strict';

let installed=false;
let originals={};
let profileCache={key:'',value:null};

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
    routeRecoverySignal:legacyFn('routeRecoverySignal')
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
  const decision=baseDecision?applyGuard(baseDecision,model,risk,repair,load):null;
  let explanation=null;
  if(I&&task){
    try{explanation=I.explainTask({task,model:model||{},decision:decision||{},risk,mastery:masteryFor(topicId)});}catch{}
  }
  return {version:1,profile:p,model,risk,repair,load,decision,explanation};
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
    return {...guarded,intelligence:{risk,repair,load,profileConfidence:profile()?.confidence||0}};
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
      if(!candidate?.subjectId||reviewSources.has(candidate.source)||!candidate.topicId)return candidate;
      const snap=snapshot(candidate.subjectId,candidate.topicId,null);
      const risk=snap.risk,repair=snap.repair,model=snap.model;
      if(!risk?.reliable||risk.band!=='high'||repair?.mode!=='repair'||(model?.confidence||0)<55)return candidate;
      const boost=Math.min(3,Math.max(1,Math.round((Number(repair.priority)||70)/35)-1));
      const reason=String(candidate.reason||'');
      const note=' Intelligence V1: hedef riski ve konuya özgü onarım sinyali birlikte doğrulandığı için öncelik kontrollü artırıldı.';
      return {...candidate,priority:Math.min(96,(Number(candidate.priority)||0)+boost),reason:reason.includes('Intelligence V1:')?reason:reason+note};
    }).sort((a,b)=>(Number(b?.priority)||0)-(Number(a?.priority)||0)||String(a?.routeKey||'').localeCompare(String(b?.routeKey||'')));
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
      }:null
    }};
  }:null;

  const hooks={
    routeStudentModel:patchedStudentModel,
    routeAppliedDecision:patchedAppliedDecision,
    ...(patchedTaskReason?{routeTaskReason:patchedTaskReason}:{}),
    ...(patchedBuildCandidates?{routeBuildCandidates:patchedBuildCandidates}:{}),
    ...(patchedTeacherStudentContext?{teacherStudentContext:patchedTeacherStudentContext}:{})
  };
  installHooks(hooks);

  root.RotaIntelligenceBridgeV1={
    version:1,
    profile,
    targetRiskFor,
    repairFor,
    loadPrescription,
    snapshotForSubject:(subjectId,topicId='')=>snapshot(subjectId,topicId,null),
    snapshotForTask:(task)=>snapshot(task?.subjectId||'',task?.topicId||'',task),
    invalidate:()=>{profileCache={key:'',value:null};},
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
