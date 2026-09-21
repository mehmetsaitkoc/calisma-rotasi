/* Çalışma Rotası Intelligence Bridge V1
   Binds Intelligence V1 to the existing Route Engine without rewriting it.
   Bounded guards: low-confidence evidence never forces a mode change. */
(function(root){
'use strict';

let installed=false;
let originalStudentModel=null;
let originalAppliedDecision=null;
let originalTaskReason=null;
let profileCache={key:'',value:null};

function fn(name){return typeof root[name]==='function'?root[name]:null;}
function workspace(){try{return fn('w')?.()||null;}catch{return null;}}
function todayValue(){try{return fn('today')?.()||new Date().toISOString().slice(0,10);}catch{return new Date().toISOString().slice(0,10);}}
function intelligence(){return root.RotaIntelligenceV1||null;}
function finite(v){return Number.isFinite(Number(v));}
function cacheKey(space,today){
  if(!space)return today+'|0';
  return [
    today,
    space.logs?.length||0,
    space.assessments?.length||0,
    space.exams?.length||0,
    space.mistakes?.length||0,
    space.plan?.length||0,
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
  try{
    if(subjectId&&fn('routeSubjectGap'))return root.routeSubjectGap(subjectId);
    if(fn('routeNetGap'))return root.routeNetGap();
  }catch{}
  return null;
}
function daysLeft(){
  try{return fn('routeDaysToTarget')?.()??null;}catch{return null;}
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
      openMistakes:Number(model?.openMistakes)||p.windows?.d60?.openMistakes||0,
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
function applyGuard(decision,model,risk,repair){
  const out={...decision};
  const flags=redFlags(model);
  let guard='none';
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
  if(!originalStudentModel)return null;
  try{return originalStudentModel.call(root,subjectId,topicId);}catch{return null;}
}
function rawDecision(subjectId,topicId=''){
  if(!originalAppliedDecision)return null;
  try{return originalAppliedDecision.call(root,subjectId,topicId);}catch{return null;}
}
function masteryFor(topicId){
  if(!topicId)return null;
  try{
    if(fn('routeTopicMasterySignal'))return root.routeTopicMasterySignal(topicId);
    if(fn('routeTopicMasteryScore'))return root.routeTopicMasteryScore(topicId);
  }catch{}
  return null;
}
function snapshot(subjectId,topicId='',task=null){
  const I=intelligence(),model=rawModel(subjectId,topicId),p=profile(),risk=targetRiskFor(subjectId,model),repair=repairFor(model);
  const baseDecision=rawDecision(subjectId,topicId);
  const decision=baseDecision?applyGuard(baseDecision,model,risk,repair):null;
  let explanation=null;
  if(I&&task){
    try{explanation=I.explainTask({task,model:model||{},decision:decision||{},risk,mastery:masteryFor(topicId)});}catch{}
  }
  return {version:1,profile:p,model,risk,repair,decision,explanation};
}

function install(){
  if(installed||!intelligence())return installed;
  if(!fn('routeStudentModel')||!fn('routeAppliedDecision'))return false;
  originalStudentModel=root.routeStudentModel;
  originalAppliedDecision=root.routeAppliedDecision;
  originalTaskReason=fn('routeTaskReason');

  root.routeStudentModel=function(subjectId,topicId=''){
    const model=originalStudentModel.call(root,subjectId,topicId);
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

  root.routeAppliedDecision=function(subjectId,topicId=''){
    const decision=originalAppliedDecision.call(root,subjectId,topicId);
    const model=root.routeStudentModel(subjectId,topicId);
    const risk=targetRiskFor(subjectId,model);
    const repair=repairFor(model);
    const guarded=applyGuard(decision,model,risk,repair);
    return {...guarded,intelligence:{risk,repair,profileConfidence:profile()?.confidence||0}};
  };

  if(originalTaskReason){
    root.routeTaskReason=function(task){
      const base=originalTaskReason.call(root,task);
      const subjectId=task?.subjectId||'',topicId=task?.topicId||'';
      if(!subjectId)return base;
      const snap=snapshot(subjectId,topicId,task);
      const text=snap.explanation?.text;
      return text&&text.length>=12?text:base;
    };
  }

  root.RotaIntelligenceBridgeV1={
    version:1,
    profile,
    targetRiskFor,
    repairFor,
    snapshotForSubject:(subjectId,topicId='')=>snapshot(subjectId,topicId,null),
    snapshotForTask:(task)=>snapshot(task?.subjectId||'',task?.topicId||'',task),
    invalidate:()=>{profileCache={key:'',value:null};},
    installed:()=>installed
  };
  installed=true;
  return true;
}

if(!install()){
  if(typeof document!=='undefined'&&document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else if(typeof setTimeout==='function')setTimeout(install,0);
}
})(typeof window!=='undefined'?window:globalThis);
