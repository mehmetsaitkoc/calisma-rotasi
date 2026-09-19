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
function clamp(v,min=0,max=1){return Math.max(min,Math.min(max,v));}
function daysBetween(a,b){
  return Math.max(0,Math.floor((new Date(a+'T12:00:00Z')-new Date(b+'T12:00:00Z'))/86400000));
}

const buildSrc=between('function routeLatestBaseCycle','function routeConsistencySignal');
const rebalanceSrc=between('function routeRebalance','function routeAutoSync');
const adaptiveSrc=between('function routeSubjectAdaptiveState','const ROUTE_ERROR_TYPES');
const studentSrc=between('function routeConfidenceCalibrationFromSignals','function routeStudentModel(subjectId');
const studentFn=new Function(studentSrc+';return routeStudentModelFromSignals;')();
const riskFn=new Function(between('function routeExamRiskFromSignals','function routeTopicExamRisk')+';return routeExamRiskFromSignals;')();
const personalSrc=between('function routeAccuracyAcrossSamples','function routeEvidenceFreshness');
const personalApi=new Function(
  'w','routeAssessmentSamples','routeTopicPerformanceSamples',
  personalSrc+';return {routePersonalNormFromSamples};'
)(()=>({plan:[],logs:[]}),()=>[],()=>[]);
const masterySignalSrc=between('function routeTopicMasterySignal','function routeMasteryScoreFromSignals');
const masteryScoreFn=new Function(between('function routeMasteryScoreFromSignals','function routeTopicLatestEvidenceDate')+';return routeMasteryScoreFromSignals;')();
const evidenceFreshnessFn=new Function(between('function routeEvidenceFreshness','function routePerformanceWindow')+';return routeEvidenceFreshness;')();
const forgettingFn=new Function(between('function routeForgettingProjection','function routeTopicForgettingSignal')+';return routeForgettingProjection;')();
const appliedDecisionFn=new Function(between('function routeProgressHoldFromSignals','function routeLatestModeDecision')+';return routeAppliedDecisionFromSignals;')();

const SUBJECTS=[
  {id:'k-ma',name:'Matematik',method:'quant'},
  {id:'k-tr',name:'Türkçe',method:'paragraph'},
  {id:'k-ta',name:'Tarih',method:'history'},
  {id:'k-co',name:'Coğrafya',method:'geography'}
];
const CATALOG=[
  {id:'m1',subjectId:'k-ma',title:'Temel kavramlar'},
  {id:'m2',subjectId:'k-ma',title:'Problemler'},
  {id:'m3',subjectId:'k-ma',title:'Oran orantı'},
  {id:'m4',subjectId:'k-ma',title:'Sayı problemleri'},
  {id:'t1',subjectId:'k-tr',title:'Paragraf'},
  {id:'t2',subjectId:'k-tr',title:'Dil bilgisi'},
  {id:'h1',subjectId:'k-ta',title:'İlk Türk devletleri'},
  {id:'h2',subjectId:'k-ta',title:'Osmanlı kuruluş'},
  {id:'c1',subjectId:'k-co',title:'Harita bilgisi'},
  {id:'c2',subjectId:'k-co',title:'Türkiye fiziki coğrafyası'}
];
const TOPIC_MAP=new Map(CATALOG.map(t=>[t.id,t]));
const SUBJECT_MAP=new Map(SUBJECTS.map(s=>[s.id,s]));
const START='2026-09-19';
let uid=0;

const PERSONAS=[
  {
    id:'weak-improver',name:'Matematiği zayıf ama düzenli gelişen',seed:1,dailyMinutes:90,completion:.92,volume:.95,targetDays:60,
    accuracy:{'k-ma':.45,'k-tr':.78,'k-ta':.72,'k-co':.70},trend:{'k-ma':.025},
    exam:{'k-ma':.48,'k-tr':.78,'k-ta':.70,'k-co':.68},profileLevel:{'k-ma':1}
  },
  {
    id:'high-skill-low-compliance',name:'Başarılı ama görevleri aksatan',seed:2,dailyMinutes:120,completion:.38,volume:.72,targetDays:90,
    accuracy:{'k-ma':.88,'k-tr':.90,'k-ta':.86,'k-co':.84},trend:{},
    exam:{'k-ma':.86,'k-tr':.88,'k-ta':.82,'k-co':.82}
  },
  {
    id:'hidden-gap',name:'Rahat hissedip düşük doğruluk yapan',seed:3,dailyMinutes:90,completion:.90,volume:.95,targetDays:75,feeling:'hidden-gap',
    accuracy:{'k-ma':.50,'k-tr':.76,'k-ta':.72,'k-co':.70},trend:{'k-ma':.022},
    exam:{'k-ma':.52,'k-tr':.75,'k-ta':.70,'k-co':.68},profileLevel:{'k-ma':1}
  },
  {
    id:'productive-struggle',name:'Zorlanıyor ama yüksek doğruluk yapıyor',seed:4,dailyMinutes:90,completion:.92,volume:.95,targetDays:75,feeling:'productive-struggle',
    accuracy:{'k-ma':.86,'k-tr':.88,'k-ta':.82,'k-co':.82},trend:{},
    exam:{'k-ma':.84,'k-tr':.86,'k-ta':.80,'k-co':.80}
  },
  {
    id:'fast-learner',name:'Hızlı öğrenen',seed:5,dailyMinutes:120,completion:.95,volume:1,targetDays:90,
    accuracy:{'k-ma':.58,'k-tr':.72,'k-ta':.68,'k-co':.68},trend:{'k-ma':.04,'k-tr':.02,'k-ta':.018,'k-co':.018},
    exam:{'k-ma':.60,'k-tr':.72,'k-ta':.66,'k-co':.66}
  },
  {
    id:'plateau',name:'Çalışıyor ama plato yapan',seed:6,dailyMinutes:120,completion:.92,volume:.95,targetDays:90,
    accuracy:{'k-ma':.62,'k-tr':.72,'k-ta':.68,'k-co':.68},trend:{},
    exam:{'k-ma':.62,'k-tr':.72,'k-ta':.67,'k-co':.67}
  },
  {
    id:'regressing',name:'Başta güçlü olup düşüşe geçen',seed:7,dailyMinutes:120,completion:.94,volume:.95,targetDays:60,
    accuracy:{'k-ma':.88,'k-tr':.86,'k-ta':.82,'k-co':.82},trend:{'k-ma':-.025,'k-tr':-.012},
    exam:{'k-ma':.86,'k-tr':.84,'k-ta':.80,'k-co':.80}
  },
  {
    id:'recovery-comeback',name:'İlk hafta aksatıp sonra toparlanan',seed:8,dailyMinutes:120,completionCurve:d=>d<5?.20:.90,volume:.85,targetDays:90,
    accuracy:{'k-ma':.72,'k-tr':.76,'k-ta':.72,'k-co':.70},trend:{'k-ma':.01},
    exam:{'k-ma':.70,'k-tr':.75,'k-ta':.70,'k-co':.68}
  },
  {
    id:'urgent-weak',name:'Sınava çok az kalmış ve matematiği zayıf',seed:9,dailyMinutes:90,completion:.92,volume:.95,targetDays:14,
    accuracy:{'k-ma':.48,'k-tr':.74,'k-ta':.70,'k-co':.70},trend:{'k-ma':.018},
    exam:{'k-ma':.45,'k-tr':.74,'k-ta':.68,'k-co':.68},profileLevel:{'k-ma':1},priorities:['k-ma']
  },
  {
    id:'strong-balanced',name:'Güçlü ve düzenli',seed:10,dailyMinutes:120,completion:.96,volume:1,targetDays:45,
    accuracy:{'k-ma':.88,'k-tr':.90,'k-ta':.86,'k-co':.86},trend:{},
    exam:{'k-ma':.87,'k-tr':.89,'k-ta':.85,'k-co':.84}
  }
];

function makeSpace(persona){
  return {
    configured:true,
    settings:{days:[0,1,2,3,4,5,6],dailyMinutes:persona.dailyMinutes,priorities:[...(persona.priorities||[])],targetDate:dayAdd(START,persona.targetDays)},
    profile:{subjectLevels:{...persona.profileLevel}},
    topicState:{},plan:[],logs:[],mistakes:[],assessments:[],route:{decisions:[],interventions:[],modeHistory:[]},
    taskEvents:[],exams:[]
  };
}
function topic(id){return TOPIC_MAP.get(id)||null;}
function subject(id){return SUBJECT_MAP.get(id)||null;}
function taskMethod(subjectId){return subject(subjectId)?.method||'concept';}
function isReviewLike(task){return !!task&&(task.kind==='review'||['mistake','mini_repair','retention_refresh','ai_teacher','spaced_review','checkpoint'].includes(task.source));}
function isCriticalReview(task){return !!task&&(task.source==='mistake'||task.source==='mini_repair'||(task.source==='spaced_review'&&task.reviewWave===1));}
function quantitative(method){return ['quant','geometry','science'].includes(method);}
function planEvidenceDate(space,task){
  const log=[...space.logs].filter(l=>l.sessionId===task.id&&l.date).sort((a,b)=>b.date.localeCompare(a.date)||((b.updated||b.created||0)-(a.updated||a.created||0)))[0];
  return log?.date||task.date||'';
}
function reviewAnchorDate(space,task){
  if(!task||task.source!=='spaced_review')return '';
  if(task.reviewBaseTaskId){
    const base=space.plan.find(p=>p.id===task.reviewBaseTaskId);
    if(base)return planEvidenceDate(space,base)||task.reviewBaseDate||'';
  }
  return task.reviewBaseDate||'';
}
function assessmentSamples(space,subjectId,topicId='',since=''){
  const grouped=new Map();
  for(const a of space.assessments){
    if(a.subjectId!==subjectId||(topicId&&a.topicId!==topicId)||(since&&a.date<since))continue;
    const key=a.miniId+'|'+a.date,prev=grouped.get(key);
    if(!prev||(a.created||0)>=(prev.created||0))grouped.set(key,a);
  }
  return [...grouped.values()].map(a=>({
    id:'assessment-'+a.id,sessionId:'assessment-'+a.id,date:a.date,subjectId:a.subjectId,topicId:a.topicId,
    correct:a.correct,wrong:a.wrong+(a.blank||0),updated:a.created||0,assessment:true
  }));
}
function performanceSamples(space,subjectId,topicId='',since=''){
  const planMap=new Map(space.plan.map(p=>[p.id,p])),xs=[];
  for(const l of space.logs){
    if(l.subjectId!==subjectId||(since&&l.date<since)||!Number.isInteger(l.correct)||!Number.isInteger(l.wrong)||l.correct+l.wrong<5)continue;
    const p=planMap.get(l.sessionId);if(topicId&&p?.topicId!==topicId)continue;
    const answered=l.correct+l.wrong;xs.push({date:l.date,accuracy:l.correct/answered,answered,source:'log',topicId:p?.topicId||'',order:l.updated||l.created||0});
  }
  for(const a of assessmentSamples(space,subjectId,topicId,since)){
    const answered=a.correct+a.wrong;if(answered<5)continue;
    xs.push({date:a.date,accuracy:a.correct/answered,answered,source:'mini',topicId:a.topicId||'',order:a.updated||0});
  }
  return xs.sort((a,b)=>a.date.localeCompare(b.date)||a.order-b.order);
}
function practiceSignal(space,subjectId,topicId='',since=''){
  const xs=performanceSamples(space,subjectId,topicId,since).sort((a,b)=>b.date.localeCompare(a.date)||b.order-a.order).slice(0,6);
  const weights=[1,.82,.68,.55,.45,.36];let correct=0,wrong=0,weighted=0,weightTotal=0;
  for(let i=0;i<xs.length;i++){
    const x=xs[i],answered=x.answered,w=weights[i]||.3;
    const c=Math.round(x.accuracy*answered);correct+=c;wrong+=answered-c;weighted+=x.accuracy*w;weightTotal+=w;
  }
  const answered=correct+wrong,recent=xs[0]||null;
  return {
    known:xs.length>0,sessions:xs.length,correct,wrong,answered,
    accuracy:answered?correct/answered:0,weightedAccuracy:weightTotal?weighted/weightTotal:0,
    recentAccuracy:recent?recent.accuracy:0,recentAnswered:recent?recent.answered:0,recent
  };
}
function behaviorSignal(space,subjectId,topicId='',currentDate){
  const since=dayAdd(currentDate,-14),planMap=new Map(space.plan.map(p=>[p.id,p])),groups=new Map();
  for(const ev of space.taskEvents){
    const p=planMap.get(ev.taskId);if(!p||p.subjectId!==subjectId||(topicId&&p.topicId!==topicId)||ev.date<since||ev.date>currentDate)continue;
    const key=ev.taskId+'|'+ev.date,set=groups.get(key)||new Set();set.add(ev.action);groups.set(key,set);
  }
  let complete=0,skip=0,later=0,start=0;
  for(const actions of groups.values()){
    if(actions.has('start'))start++;
    if(actions.has('complete'))complete++;
    else if(actions.has('skip'))skip++;
    else if(actions.has('later'))later++;
  }
  const total=complete+skip+later;
  return {known:total>=3,total,complete,skip,later,start,completion:total?complete/total:0,friction:total?(skip+later*.5)/total:0};
}
function outcomeSignal(space,subjectId,topicId='',since=''){
  const planMap=topicId?new Map(space.plan.map(p=>[p.id,p])):null,xs=space.logs.filter(l=>{
    if(l.subjectId!==subjectId||(since&&l.date<since)||!['stuck','ok','strong'].includes(l.outcome))return false;
    if(!topicId)return true;return planMap.get(l.sessionId)?.topicId===topicId;
  }).sort((a,b)=>b.date.localeCompare(a.date)||((b.updated||b.created||0)-(a.updated||a.created||0))).slice(0,6);
  const weights=[1,.82,.68,.55,.45,.36];let stuck=0,ok=0,strong=0,weighted=0,weightTotal=0;
  xs.forEach((l,i)=>{if(l.outcome==='stuck')stuck++;else if(l.outcome==='strong')strong++;else ok++;const w=weights[i]||.3,score=l.outcome==='strong'?1:l.outcome==='stuck'?-1:0;weighted+=score*w;weightTotal+=w;});
  const total=xs.length,recent=xs[0]?.outcome||'';
  return {known:total>0,total,stuck,ok,strong,recent,stuckRate:total?stuck/total:0,strongRate:total?strong/total:0,trend:weightTotal?weighted/weightTotal:0};
}
function calibrationSignal(space,subjectId,topicId='',currentDate){
  const since=dayAdd(currentDate,-21),planMap=topicId?new Map(space.plan.map(p=>[p.id,p])):null,xs=space.logs.filter(l=>{
    if(l.subjectId!==subjectId||l.date<since||!['stuck','ok','strong'].includes(l.outcome)||!Number.isInteger(l.correct)||!Number.isInteger(l.wrong)||l.correct+l.wrong<5)return false;
    if(!topicId)return true;return planMap.get(l.sessionId)?.topicId===topicId;
  }).sort((a,b)=>b.date.localeCompare(a.date)||((b.updated||b.created||0)-(a.updated||a.created||0))).slice(0,4);
  let hiddenGap=0,productiveStruggle=0,alignedStrong=0,alignedStruggle=0;
  for(const l of xs){const n=l.correct+l.wrong,acc=n?l.correct/n:0;if(l.outcome==='strong'&&acc<.65)hiddenGap++;else if(l.outcome==='stuck'&&acc>=.80)productiveStruggle++;else if(l.outcome==='strong'&&acc>=.80)alignedStrong++;else if(l.outcome==='stuck'&&acc<.65)alignedStruggle++;}
  return {known:xs.length>0,total:xs.length,hiddenGap,productiveStruggle,alignedStrong,alignedStruggle};
}
function trendSignal(space,subjectId,topicId,currentDate){
  function window(start,end){
    const xs=performanceSamples(space,subjectId,topicId,start).filter(x=>x.date<=end),answered=xs.reduce((n,x)=>n+x.answered,0),correct=xs.reduce((n,x)=>n+x.accuracy*x.answered,0);
    return {known:answered>=8,answered,accuracy:answered?correct/answered:0,samples:xs.length};
  }
  const recent=window(dayAdd(currentDate,-6),currentDate),previous=window(dayAdd(currentDate,-13),dayAdd(currentDate,-7));
  if(!recent.known||!previous.known)return {known:false,direction:'unknown',delta:0,label:'Veri yetersiz',recent,previous};
  const delta=recent.accuracy-previous.accuracy,direction=delta>=.08?'up':delta<=-.08?'down':'flat';
  return {known:true,direction,delta,label:direction==='up'?'Yükseliyor':direction==='down'?'Geriliyor':'Stabil',recent,previous};
}
function retentionSignal(space,subjectId,topicId,currentDate){
  const relevant=space.plan.filter(p=>p.subjectId===subjectId&&p.topicId===topicId&&p.source==='spaced_review'&&[1,3,7].includes(p.reviewWave));
  const due=relevant.filter(p=>{const anchor=p.reviewBaseDate||reviewAnchorDate(space,p);return anchor&&dayAdd(anchor,p.reviewWave)<=currentDate;});
  if(!due.length)return {known:false,score:null,due:0,completed:0,waves:[]};
  const waveWeight={1:.20,3:.35,7:.45};let earned=0,total=0;
  for(const p of due){const w=waveWeight[p.reviewWave]||.25;total+=w;if(p.done)earned+=w;}
  const practice=practiceSignal(space,subjectId,topicId),completion=total?earned/total:0,pa=practice.known?practice.weightedAccuracy:null;
  return {known:true,score:Math.round(100*(pa===null?completion:completion*.65+pa*.35)),due:due.length,completed:due.filter(p=>p.done).length};
}
function skillWeakness(space,subjectId,topicId='',currentDate){
  const grouped=new Map();
  for(const a of space.assessments){
    if(a.subjectId!==subjectId||a.date<dayAdd(currentDate,-21)||(topicId&&a.topicId!==topicId))continue;
    const key=a.miniId+'|'+a.date,prev=grouped.get(key);if(!prev||(a.created||0)>=(prev.created||0))grouped.set(key,a);
  }
  const attempts=[...grouped.values()].sort((a,b)=>b.date.localeCompare(a.date)||((b.created||0)-(a.created||0))).slice(0,4);
  if(!attempts.length)return {known:false,attempts:0,weak:[],primary:null};
  const latest=attempts[0],n=latest.correct+latest.wrong+(latest.blank||0),missed=(latest.wrong||0)+(latest.blank||0),acc=n?latest.correct/n:0,missRate=n?missed/n:0;
  const primary=missed>0&&(acc<.75||missRate>=.34)?{skill:latest.skill||'Konu becerisi',missed,accuracy:acc,weightedMissRate:missRate}:null;
  return {known:true,attempts:attempts.length,weak:primary?[primary]:[],primary};
}
function personalNorm(space,subjectId,topicId){
  const current=performanceSamples(space,subjectId,topicId);
  if(!topicId)return personalApi.routePersonalNormFromSamples(current,[]);
  const peers=performanceSamples(space,subjectId,'').filter(x=>x.topicId!==topicId);
  return personalApi.routePersonalNormFromSamples(current,peers);
}
function openMistakeCount(space,subjectId,topicId){
  return space.mistakes.filter(m=>!m.resolved&&m.subjectId===subjectId&&m.topicId===topicId).length;
}
function targetAttainmentSignal(space,subjectId,topicId='',currentDate){
  const planMap=new Map(space.plan.map(p=>[p.id,p])),xs=space.logs.filter(l=>{
    if(l.subjectId!==subjectId||l.date<dayAdd(currentDate,-21)||!Number.isInteger(l.questions)||l.questions<=0)return false;
    const p=planMap.get(l.sessionId);if(!p||!Number.isInteger(p.targetQuestions)||p.targetQuestions<5)return false;
    return !topicId||p.topicId===topicId;
  }).sort((a,b)=>b.date.localeCompare(a.date)||((b.updated||b.created||0)-(a.updated||a.created||0))).slice(0,6);
  const weights=[1,.82,.68,.55,.45,.36];let weighted=0,weightTotal=0;
  xs.forEach((l,i)=>{const p=planMap.get(l.sessionId),ratio=Math.max(0,Math.min(1.5,l.questions/p.targetQuestions)),w=weights[i]||.3;weighted+=ratio*w;weightTotal+=w;});
  const weightedRatio=weightTotal?weighted/weightTotal:0;
  return {known:xs.length>=2,sessions:xs.length,weightedRatio,recentRatio:xs.length?Math.min(1.5,xs[0].questions/planMap.get(xs[0].sessionId).targetQuestions):0};
}
function attainmentRatio(space,subjectId,topicId,currentDate){
  const s=targetAttainmentSignal(space,subjectId,topicId,currentDate);return s.known?s.weightedRatio:null;
}
function adaptiveState(space,persona,subjectId,topicId,currentDate,weakMap){
  const R={topic:(_w,id)=>topic(id)},w=()=>space,today=()=>currentDate;
  const routeBehaviorSignal=(sid,tid='')=>behaviorSignal(space,sid,tid,currentDate);
  const routeOutcomeSignal=(sid,tid='',since='')=>outcomeSignal(space,sid,tid,since);
  const routePracticeSignal=(sid,tid='',since='')=>practiceSignal(space,sid,tid,since);
  const routeFeedbackCalibrationSignal=(sid,tid='')=>calibrationSignal(space,sid,tid,currentDate);
  const routeTargetAttainmentSignal=(sid,tid='')=>targetAttainmentSignal(space,sid,tid,currentDate);
  const routeAssessmentWeakSkillSignal=(sid,tid='')=>skillWeakness(space,sid,tid,currentDate);
  const routeExamWeakness=()=>weakMap;
  const fn=new Function('R','w','today','routeBehaviorSignal','routeOutcomeSignal','routePracticeSignal','routeFeedbackCalibrationSignal','routeTargetAttainmentSignal','routeAssessmentWeakSkillSignal','routeExamWeakness',adaptiveSrc+';return routeSubjectAdaptiveState;');
  return fn(R,w,today,routeBehaviorSignal,routeOutcomeSignal,routePracticeSignal,routeFeedbackCalibrationSignal,routeTargetAttainmentSignal,routeAssessmentWeakSkillSignal,routeExamWeakness)(subjectId,topicId);
}
function errorMemory(space,subjectId,topicId){
  const xs=space.mistakes.filter(m=>m.subjectId===subjectId&&m.topicId===topicId);
  if(!xs.length)return {known:false,repeated:false,primary:null,total:0};
  const count=xs.length,primary={label:xs[0].errorLabel||'İşlem',count};
  return {known:true,repeated:count>=2,primary,total:count};
}
function learningVelocity(space,subjectId,topicId){
  const xs=performanceSamples(space,subjectId,topicId);
  if(xs.length<2)return {known:false,key:'unknown',label:'Öğrenme temposu ölçülüyor',confidence:0};
  const first=xs[0].accuracy,last=xs.at(-1).accuracy,gain=(last-first)/Math.max(1,xs.length-1);
  const key=last>=.78&&xs.length<=3?'fast':xs.length>=4&&last<.70?'slow':gain>=.08?'fast':'steady';
  return {known:true,key,label:key==='fast'?'Hızlı oturuyor':key==='slow'?'Daha fazla temas istiyor':'Normal hızda oturuyor',confidence:Math.min(100,xs.length*14)};
}
function modelFor(space,persona,subjectId,topicId,currentDate,weak,adaptiveOverride=null){
  const practice=practiceSignal(space,subjectId,topicId),behavior=behaviorSignal(space,subjectId,topicId,currentDate),outcome=outcomeSignal(space,subjectId,topicId),retention=retentionSignal(space,subjectId,topicId,currentDate),trend=trendSignal(space,subjectId,topicId,currentDate),calibration=calibrationSignal(space,subjectId,topicId,currentDate),skill=skillWeakness(space,subjectId,topicId,currentDate),weakMap={[subjectId]:weak},adaptive=adaptiveOverride||adaptiveState(space,persona,subjectId,topicId,currentDate,weakMap),norm=personalNorm(space,subjectId,topicId),mistakes=openMistakeCount(space,subjectId,topicId),errors=errorMemory(space,subjectId,topicId),velocity=learningVelocity(space,subjectId,topicId),att=attainmentRatio(space,subjectId,topicId,currentDate);
  const planMap=new Map(space.plan.map(p=>[p.id,p])),practiceLogCount=space.logs.filter(l=>l.subjectId===subjectId&&Number.isInteger(l.correct)&&Number.isInteger(l.wrong)&&l.correct+l.wrong>=5&&(!topicId||planMap.get(l.sessionId)?.topicId===topicId)).length,miniDays=new Set(space.assessments.filter(a=>a.subjectId===subjectId&&(!topicId||a.topicId===topicId)).map(a=>a.date)).size;
  const dates=performanceSamples(space,subjectId,topicId).map(x=>x.date).sort((a,b)=>b.localeCompare(a)),latestDate=dates[0]||'',latestDays=latestDate?daysBetween(currentDate,latestDate):999;
  return studentFn({practice,weak,behavior,outcome,retention,trend,calibration,skillWeakness:skill,adaptive,openMistakes:mistakes,practiceLogCount,miniDays,difficultyKnown:space.logs.some(l=>l.subjectId===subjectId&&(!topicId||planMap.get(l.sessionId)?.topicId===topicId)&&l.difficulty),errorMemory:errors,velocity,personalNorm:norm,latestDays,attainmentRatio:att});
}
function examWeakness(persona,dayIndex,space=null){
  const out={};
  for(const s of SUBJECTS){
    if(space&&Array.isArray(persona.examHistory)&&persona.examHistory.length){
      const currentDate=dayAdd(START,dayIndex),recency=[1,.82,.68,.55],events=persona.examHistory.filter(function(e){return e.day<=dayIndex&&Number.isFinite(e.scores?.[s.id]);}).sort(function(a,b){return b.day-a.day;}).slice(0,4);
      if(events.length){
        const weighted=events.map(function(e,i){
          const examDate=dayAdd(START,e.day),age=Math.max(0,dayIndex-e.day),studySince=new Set(space.logs.filter(function(l){return !!l.sessionId&&l.subjectId===s.id&&l.date>examDate&&l.date<=currentDate;}).map(function(l){return l.sessionId;})).size;
          const freshness=age>=35&&studySince>=10?.35:age>=21&&studySince>=6?.55:age>=14&&studySince>=4?.75:1,rw=recency[i]||.45;
          return {day:e.day,date:examDate,ratio:clamp(e.scores[s.id],.25,.95),age,studySince,freshness,recencyWeight:rw,weight:rw*freshness};
        });
        const totalWeight=weighted.reduce(function(n,x){return n+x.weight;},0),baseWeight=weighted.reduce(function(n,x){return n+x.recencyWeight;},0),ratio=weighted.reduce(function(n,x){return n+x.ratio*x.weight;},0)/Math.max(.001,totalWeight),freshness=weighted.reduce(function(n,x){return n+x.freshness*x.recencyWeight;},0)/Math.max(.001,baseWeight),rawBoost=Math.round(Math.max(0,.78-ratio)*55),oldest=weighted.at(-1),freshest=weighted[0];
        out[s.id]={ratio,boost:Math.round(rawBoost*freshness),samples:weighted.length,freshness,examWeights:weighted,oldestExamWeight:oldest?.weight??null,freshestExamWeight:weighted.length>1?(freshest?.weight??null):null,oldestExamFreshness:oldest?.freshness??null,freshestExamFreshness:weighted.length>1?(freshest?.freshness??null):null};
        continue;
      }
    }
    const ratio=clamp((persona.exam?.[s.id]??.75)+((persona.trend?.[s.id]||0)*Math.max(0,dayIndex-8)*.35),.25,.95);
    const freshness=dayIndex<10?1:.75,rawBoost=Math.round(Math.max(0,.78-ratio)*55);
    out[s.id]={ratio,boost:Math.round(rawBoost*freshness),samples:1,freshness,examWeights:[],oldestExamWeight:null,freshestExamWeight:null};
  }
  return out;
}
function paceSignal(space,currentDate){
  const target=space.settings.targetDate;if(!target)return {known:false};
  const days=Math.max(1,daysBetween(target,currentDate)),remaining=CATALOG.filter(t=>(space.topicState[t.id]?.status||0)!==2).length;
  const status=days<=21&&remaining>=4?'overload':days<=45&&remaining>=6?'tight':'comfortable';
  return {known:true,status,target};
}
function masterySignal(space,topicId,currentDate){
  const t=topic(topicId);if(!t)return {ready:false};
  const R={topic:(_w,id)=>topic(id),dayAdd};
  const routePlanEvidenceDate=p=>planEvidenceDate(space,p);
  const routeOutcomeSignal=(sid,tid,since)=>outcomeSignal(space,sid,tid,since);
  const routePracticeSignal=(sid,tid,since)=>practiceSignal(space,sid,tid,since);
  const fn=new Function('R','w','routeOutcomeSignal','routePracticeSignal','routePlanEvidenceDate',between('function routeTopicMasterySignal','function routeMasteryScoreFromSignals')+';return routeTopicMasterySignal;');
  return fn(R,()=>space,routeOutcomeSignal,routePracticeSignal,routePlanEvidenceDate)(topicId);
}
function latestEvidenceDate(space,topicId){
  const dates=[];
  for(const l of space.logs){const p=space.plan.find(x=>x.id===l.sessionId);if(p?.topicId===topicId)dates.push(l.date);}
  for(const a of space.assessments)if(a.topicId===topicId)dates.push(a.date);
  for(const p of space.plan)if(p.done&&p.topicId===topicId)dates.push(planEvidenceDate(space,p));
  return dates.filter(Boolean).sort((a,b)=>b.localeCompare(a))[0]||'';
}
function forgettingFor(space,persona,topicId,currentDate){
  const latest=latestEvidenceDate(space,topicId),t=topic(topicId);if(!latest||!t)return {known:false,retained:0,reviewDue:false,nextReviewIn:null,latestDate:''};
  const binary=masterySignal(space,topicId,currentDate),ret=retentionSignal(space,t.subjectId,topicId,currentDate),trend=trendSignal(space,t.subjectId,topicId,currentDate),skill=skillWeakness(space,t.subjectId,topicId,currentDate),errors=errorMemory(space,t.subjectId,topicId),openMistakes=openMistakeCount(space,t.subjectId,topicId),performanceAccuracy=binary.practice?.known?Math.round((binary.practice.weightedAccuracy||binary.practice.accuracy)*100):null,skillMissed=(skill.weak||[]).reduce(function(n,x){return n+(x.missed||0);},0);
  const core=masteryScoreFn({base:binary.base,review3:binary.review3,review7:binary.review7,hasEvidence:binary.hasEvidence,ready:binary.ready,performanceAccuracy,retentionScore:ret.known?ret.score:null,trend:trend.direction,openMistakes,skillMissed,errorRepeated:errors.repeated});
  const velocity=learningVelocity(space,t.subjectId,topicId),days=daysBetween(currentDate,latest),stability=3+(binary.review3?4:0)+(binary.review7?8:0)+(core.score>=80?5:core.score>=65?2:0)+(ret.known?Math.round(ret.score/20):0)+(velocity.key==='fast'?3:velocity.key==='slow'?-1:0);
  let confidence=(binary.base?18:0)+(binary.review3?18:0)+(binary.review7?22:0)+Math.min(24,(binary.practice?.sessions||0)*6)+(ret.known?8:0)+(trend.known?5:0)+(skill.known?3:0)+(errors.known?3:0);
  confidence=Math.round(Math.min(100,confidence)*evidenceFreshnessFn(days));
  return {known:!!binary.base||binary.practice?.known||skill.known||errors.known,latestDate:latest,confidence,masteryScore:core.score,stabilityDays:stability,...forgettingFn({mastery:core.score,daysSince:days,stabilityDays:stability})};
}
function refreshCandidates(space,persona,currentDate){
  return CATALOG.filter(t=>(space.topicState[t.id]?.status||0)===2).map(t=>({topic:t,forgetting:forgettingFor(space,persona,t.id,currentDate)})).filter(x=>x.forgetting.known&&x.forgetting.reviewDue).sort((a,b)=>a.forgetting.retained-b.forgetting.retained).slice(0,2);
}
function riskFor(space,persona,topicId,currentDate,student,weak){
  const t=topic(topicId),status=space.topicState[topicId]?.status||0,p=practiceSignal(space,t.subjectId,topicId),forget=forgettingFor(space,persona,topicId,currentDate),masteryScore=status===2?Math.max(82,Math.round((p.weightedAccuracy||.82)*100)):Math.max(20,Math.round((p.weightedAccuracy||.50)*80)),daysToTarget=space.settings.targetDate?Math.max(1,daysBetween(space.settings.targetDate,currentDate)):null,pace=paceSignal(space,currentDate);
  const raw=riskFn({confidence:student.confidence,masteryScore,retained:forget.known?forget.retained:masteryScore,learningNeed:student.learningNeed,daysToTarget,openMistakes:student.openMistakes,trend:student.trend?.direction,examWeakRatio:weak?.ratio,examFreshness:weak?.freshness,subjectPriority:space.settings.priorities.includes(t.subjectId),forgettingDue:!!forget.reviewDue,paceStatus:pace.known?pace.status:'',status});
  let incremental=0;
  if(student.confidence>=25){
    if(daysToTarget!==null)incremental+=daysToTarget<=21?3:daysToTarget<=45?2:daysToTarget<=90?1:0;
    if(forget.known&&forget.reviewDue)incremental+=2;
    if(pace.known&&pace.status==='overload'&&daysToTarget!==null)incremental+=1;
  }
  if((student.priorityBoost||0)>=4)incremental=Math.min(incremental,2);
  return {...raw,rawPriorityBoost:raw.priorityBoost,priorityBoost:Math.max(0,Math.min(5,Math.min(Math.max(0,raw.priorityBoost),incremental)))};
}
function profileSignal(persona,subjectId){
  const level=Number.isInteger(persona.profileLevel?.[subjectId])?persona.profileLevel[subjectId]:2;
  return {level,label:['Çok zayıf','Zayıf','Orta','İyi'][level]||'Orta',boost:level<=1?8:level===3?-2:0,goalBoost:0};
}
function reviewGoal(subjectId,topicId,title,mode){
  const minutes=mode==='long'?25:mode==='mistake'?20:mode==='challenge'?25:20;
  return {minutes,questions:8,text:'review '+mode};
}
function taskGoal(persona,subjectId,topicId){
  const level=profileSignal(persona,subjectId).level,base=taskMethod(subjectId)==='quant'?[35,35,30,30][level]:[30,30,25,25][level];
  return {minutes:Math.min(base,Math.max(20,persona.dailyMinutes-5)),questions:taskMethod(subjectId)==='quant'?12:10,text:'goal'};
}
function recoverySignal(space,currentDate){
  const start=dayAdd(currentDate,-7),end=dayAdd(currentDate,-1),expected=[];
  for(let i=0;i<7;i++){const d=dayAdd(start,i),dow=new Date(d+'T12:00:00Z').getUTCDay();if(d<=end&&space.settings.days.includes(dow))expected.push(d);}
  if(expected.length<3)return {active:false,severe:false,consistency:{known:false,ratio:0},overdue:0};
  const activeDays=new Set(space.logs.filter(l=>l.date>=start&&l.date<=end&&l.minutes>=15).map(l=>l.date)),hit=expected.filter(d=>activeDays.has(d)).length,ratio=hit/expected.length,overdue=space.plan.filter(p=>!p.done&&p.date<currentDate&&!isCriticalReview(p)).length,active=ratio<.50&&overdue>=2,severe=active&&ratio<.30&&overdue>=3;
  return {active,severe,consistency:{known:true,ratio,active:hit,expected:expected.length},overdue};
}
function lastLogDate(space,subjectId){
  return space.logs.filter(l=>l.subjectId===subjectId).map(l=>l.date).sort((a,b)=>b.localeCompare(a))[0]||'';
}
function sessionPerformance(log){
  const correct=Number.isInteger(log?.correct)?log.correct:0,wrong=Number.isInteger(log?.wrong)?log.wrong:0,answered=correct+wrong,accuracy=answered?correct/answered:null,outcome=['stuck','ok','strong'].includes(log?.outcome)?log.outcome:'',measured=answered>=8,productiveStruggle=measured&&outcome==='stuck'&&accuracy>=.80,hiddenGap=measured&&outcome==='strong'&&accuracy<.65,repair=(outcome==='stuck'&&!productiveStruggle)||(measured&&accuracy<.65),challenge=!repair&&measured&&outcome==='strong'&&accuracy>=.85;
  return {known:!!(outcome||answered),outcome,answered,accuracy,measured,productiveStruggle,hiddenGap,repair,challenge};
}
function buildCandidates(space,persona,currentDate){
  const weak=examWeakness(persona,daysBetween(currentDate,START),space),models={},adaptives={},risks={};
  for(const t of CATALOG){
    adaptives[t.id]=adaptiveState(space,persona,t.subjectId,t.id,currentDate,weak);
    models[t.id]=modelFor(space,persona,t.subjectId,t.id,currentDate,weak[t.subjectId],adaptives[t.id]);
    risks[t.id]=riskFor(space,persona,t.id,currentDate,models[t.id],weak[t.subjectId]);
  }
  const R={dayAdd,uid:()=>`cl-${persona.id}-${++uid}`,topic:(_sp,id)=>topic(id),allTopics:()=>CATALOG};
  const state={activeExam:'kpss'},subjects=()=>SUBJECTS,routeExamWeakness=()=>weak,routeRecoverySignal=()=>recoverySignal(space,currentDate),routeReviewAnchorDate=p=>reviewAnchorDate(space,p),routePlanEvidenceDate=p=>planEvidenceDate(space,p),routeSubjectAdaptiveState=(sid,tid)=>adaptives[tid]||{mode:'steady',scope:'topic',confidence:0,skillWeakness:{primary:null}},routeReviewGoal=(sid,tid,title,mode)=>reviewGoal(sid,tid,title,mode),routeTaskGoal=(sid,tid)=>taskGoal(persona,sid,tid),routeIsReviewLike=isReviewLike,routeRetentionRefreshCandidates=()=>refreshCandidates(space,persona,currentDate),routeSessionPerformanceSignal=sessionPerformance,routeLastLogDate=sid=>lastLogDate(space,sid),routeProfileSignal=sid=>profileSignal(persona,sid),routeStudyMethod=sid=>({key:taskMethod(sid),label:taskMethod(sid)}),routeStudentModel=(sid,tid)=>models[tid]||{confidence:0,priorityBoost:0},routePaceSignal=()=>paceSignal(space,currentDate),routeDaysToTarget=()=>space.settings.targetDate?Math.max(1,daysBetween(space.settings.targetDate,currentDate)):null,routeTopicExamRisk=(sid,tid)=>risks[tid]||{score:0,priorityBoost:0},teacherQuestions=()=>[],subName=id=>subject(id)?.name||id,routeEffectiveDailyMinutes=()=>persona.dailyMinutes,routeBacklogDailyLimit=(limit,recovery)=>Math.min(limit,Math.max(30,Math.round((limit*(recovery?.active?(recovery.severe?.30:.35):.45))/5)*5));
  const fn=new Function(
    'w','R','state','today','routeExamWeakness','routeRecoverySignal','routeReviewAnchorDate','routePlanEvidenceDate',
    'routeSubjectAdaptiveState','routeReviewGoal','routeTaskGoal','routeIsReviewLike','routeRetentionRefreshCandidates',
    'routeSessionPerformanceSignal','routeLastLogDate','routeProfileSignal','routeStudyMethod','routeStudentModel',
    'routePaceSignal','routeDaysToTarget','routeTopicExamRisk','teacherQuestions','subName','subjects',
    'routeEffectiveDailyMinutes','routeBacklogDailyLimit',
    buildSrc+';return routeBuildCandidates;'
  );
  const candidates=fn(
    ()=>space,R,state,()=>currentDate,routeExamWeakness,routeRecoverySignal,routeReviewAnchorDate,routePlanEvidenceDate,
    routeSubjectAdaptiveState,routeReviewGoal,routeTaskGoal,routeIsReviewLike,routeRetentionRefreshCandidates,
    routeSessionPerformanceSignal,routeLastLogDate,routeProfileSignal,routeStudyMethod,routeStudentModel,
    routePaceSignal,routeDaysToTarget,routeTopicExamRisk,teacherQuestions,subName,subjects,
    routeEffectiveDailyMinutes,routeBacklogDailyLimit
  )();
  return {candidates,models,adaptives,risks,recovery:routeRecoverySignal(),weak};
}
function rebalance(space,persona,currentDate,candidates,recovery){
  const state={activeExam:'kpss'},R={dayAdd},routeEnsure=()=>{},routeBuildCandidates=()=>candidates.map(x=>({...x})),routeEffectiveDailyMinutes=()=>persona.dailyMinutes,routeTaskMethod=p=>({key:taskMethod(p.subjectId)}),routeMethodLoad=k=>['quant','geometry','science','logic','ydt_reading'].includes(k)?2:['biology','paragraph','grammar','ydt_grammar'].includes(k)?1:0,routeIsQuantitativeHeavy=quantitative,routeIsReviewLike=isReviewLike,routeIsCriticalReview=isCriticalReview,routeIsBacklog=p=>p.source==='backlog',routeHeavyLimit=l=>l<=90?1:l<=180?2:3,routeQuantitativeDailyLimit=l=>l<=90?1:2,routeReviewDailyLimit=l=>Math.max(30,Math.round((l*.5)/5)*5),routeBacklogDailyLimit=(l,r)=>Math.min(l,Math.max(30,Math.round((l*(r?.active?(r.severe?.30:.35):.45))/5)*5)),routeBacklogDailyCountLimit=r=>r?.active?1:2,routeReviewWeeklyLimit=t=>Math.max(30,Math.round((t*.45)/5)*5),routeBacklogWeeklyLimit=(t,r)=>Math.min(t,Math.max(30,Math.round((t*(r?.active?(r.severe?.20:.25):.35))/5)*5)),routeRecordModeHistory=()=>{},routeRecordInterventions=()=>{},toast=()=>{},routeRecoverySignal=()=>recovery;
  const fn=new Function(
    'state','w','today','R','routeEnsure','routeRecoverySignal','routeBuildCandidates','routeEffectiveDailyMinutes',
    'routeTaskMethod','routeMethodLoad','routeIsQuantitativeHeavy','routeIsReviewLike','routeIsCriticalReview',
    'routeIsBacklog','routeHeavyLimit','routeQuantitativeDailyLimit','routeReviewDailyLimit','routeBacklogDailyLimit',
    'routeBacklogDailyCountLimit','routeReviewWeeklyLimit','routeBacklogWeeklyLimit','routeRecordModeHistory','routeRecordInterventions','toast',
    rebalanceSrc+';return routeRebalance;'
  );
  return fn(
    state,()=>space,()=>currentDate,R,routeEnsure,routeRecoverySignal,routeBuildCandidates,routeEffectiveDailyMinutes,
    routeTaskMethod,routeMethodLoad,routeIsQuantitativeHeavy,routeIsReviewLike,routeIsCriticalReview,
    routeIsBacklog,routeHeavyLimit,routeQuantitativeDailyLimit,routeReviewDailyLimit,routeBacklogDailyLimit,
    routeBacklogDailyCountLimit,routeReviewWeeklyLimit,routeBacklogWeeklyLimit,routeRecordModeHistory,routeRecordInterventions,toast
  )('closed loop',true);
}
function completionRate(persona,dayIndex){
  return persona.completionCurve?persona.completionCurve(dayIndex):(persona.completion??.9);
}
function shouldComplete(persona,dayIndex,taskIndex){
  const rate=completionRate(persona,dayIndex),score=(persona.seed*23+dayIndex*17+taskIndex*31)%100;
  return score<Math.round(rate*100);
}
function accuracyFor(persona,subjectId,dayIndex,task){
  let acc=(persona.accuracy?.[subjectId]??.72)+(persona.trend?.[subjectId]||0)*dayIndex;
  if(['mistake','mini_repair'].includes(task?.source))acc+=.08;
  else if(task?.source==='spaced_review')acc+=task.reviewVariant==='challenge'?.00:.04;
  if(task?.reviewVariant==='challenge')acc-=.04;
  return clamp(acc,.25,.96);
}
function outcomeFor(persona,dayIndex,accuracy){
  if(persona.feeling==='hidden-gap'&&dayIndex<5)return 'strong';
  if(persona.feeling==='productive-struggle')return 'stuck';
  return accuracy<.60?'stuck':accuracy>=.86?'strong':'ok';
}
function maybeAddMistake(space,task,accuracy,currentDate){
  if(!topic(task.topicId)||accuracy>=.55)return;
  if(space.mistakes.some(m=>!m.resolved&&m.topicId===task.topicId))return;
  space.mistakes.push({id:'mist-'+(++uid),subjectId:task.subjectId,topicId:task.topicId,title:task.title,errorLabel:'İşlem',reviewDate:dayAdd(currentDate,1),resolved:false,created:uid});
}
function maybeResolveMistake(space,task,accuracy){
  if(!['mistake','mini_repair','spaced_review'].includes(task.source)||accuracy<.75)return;
  const m=space.mistakes.find(m=>!m.resolved&&m.topicId===task.topicId);if(m)m.resolved=true;
}
function simulateTasks(space,persona,currentDate,dayIndex){
  const tasks=space.plan.filter(p=>!p.done&&p.date===currentDate).sort((a,b)=>(b.priority||0)-(a.priority||0)),events=[];
  tasks.forEach((task,index)=>{
    if(!shouldComplete(persona,dayIndex,index)){
      space.taskEvents.push({taskId:task.id,date:currentDate,action:index%2?'later':'skip'});
      events.push({taskId:task.id,action:'skip',source:task.source,topicId:task.topicId,reviewVariant:task.reviewVariant||''});return;
    }
    const acc=accuracyFor(persona,task.subjectId,dayIndex,task),target=Math.max(5,task.targetQuestions||10),questions=Math.max(5,Math.round(target*(persona.volume||1))),correct=Math.max(0,Math.min(questions,Math.round(questions*acc))),wrong=questions-correct,outcome=outcomeFor(persona,dayIndex,correct/questions),minutes=Math.max(15,Math.round((task.minutes||25)*(persona.volume||1)));
    task.done=true;space.logs.push({id:'log-'+(++uid),sessionId:task.id,date:currentDate,subjectId:task.subjectId,title:task.title,minutes,questions,correct,wrong,outcome,difficulty:outcome==='stuck'?'process':'',created:uid,updated:uid});space.taskEvents.push({taskId:task.id,date:currentDate,action:'complete'});
    if(topic(task.topicId)&&(space.topicState[task.topicId]?.status||0)===0)space.topicState[task.topicId]={status:1};
    maybeAddMistake(space,task,correct/questions,currentDate);maybeResolveMistake(space,task,correct/questions);
    events.push({taskId:task.id,action:'complete',source:task.source,topicId:task.topicId,reviewVariant:task.reviewVariant||'',accuracy:correct/questions});
  });
  return events;
}
function miniTarget(space){
  const active=CATALOG.filter(t=>t.subjectId==='k-ma'&&(space.topicState[t.id]?.status||0)!==2);
  return active[0]||CATALOG.find(t=>t.subjectId==='k-ma');
}
function addMini(space,persona,currentDate,dayIndex){
  if(![3,7,11].includes(dayIndex))return;
  const t=miniTarget(space),acc=accuracyFor(persona,t.subjectId,dayIndex,{source:'mini'}),attempts=persona.id==='hidden-gap'&&dayIndex===3?2:1;
  for(let i=0;i<attempts;i++){
    const adj=clamp(acc+(i?0.08:0),.25,.96),total=10,correct=Math.round(total*adj),wrong=total-correct;
    space.assessments.push({id:'ass-'+(++uid),miniId:'sim-'+t.id,date:currentDate,subjectId:t.subjectId,topicId:t.id,title:'Sim mini',total,correct,wrong,blank:0,minutes:12,created:uid,skill:'Temel uygulama',skillBreakdown:[{skill:'Temel uygulama',total,correct,wrong,blank:0}]});
  }
}
function updateMasteryStatuses(space,currentDate){
  for(const t of CATALOG){
    if((space.topicState[t.id]?.status||0)!==1)continue;
    const m=masterySignal(space,t.id,currentDate);
    if(m.ready){
      space.topicState[t.id]={status:2};
      space.plan=space.plan.filter(p=>p.done||p.topicId!==t.id||['mistake','ai_teacher'].includes(p.source));
    }
  }
}
function dailySafety(space,persona,currentDate){
  const xs=space.plan.filter(p=>p.date===currentDate),cost=xs.reduce((n,p)=>n+(p.minutes||25)+5,0);
  assert.ok(cost<=persona.dailyMinutes,`${persona.id} exceeded daily minutes on ${currentDate}: ${cost}`);
  const quantCount=xs.filter(p=>quantitative(taskMethod(p.subjectId))).length,critical=xs.filter(p=>quantitative(taskMethod(p.subjectId))&&isCriticalReview(p)).length,normalLimit=persona.dailyMinutes<=90?1:2;
  assert.ok(quantCount<=normalLimit+(critical?1:0),`${persona.id} exceeded quantitative ceiling on ${currentDate}`);
  const keys=xs.map(p=>p.routeKey).filter(Boolean);assert.equal(new Set(keys).size,keys.length,`${persona.id} duplicate route key on ${currentDate}`);
  for(const p of xs.filter(p=>p.source==='spaced_review')){
    const anchor=reviewAnchorDate(space,p);if(anchor&&[1,3,7].includes(p.reviewWave))assert.ok(p.date>=dayAdd(anchor,p.reviewWave),`${persona.id} review scheduled early`);
  }
}
function appliedModeForDay(day){return day.appliedMode||'steady';}
function modeChurn(days){
  const modes=days.map(appliedModeForDay),transitions=[];
  for(let i=1;i<modes.length;i++)if(modes[i]!==modes[i-1])transitions.push({day:i+1,from:modes[i-1],to:modes[i]});
  const bounces=[];
  for(let i=1;i<modes.length-1;i++)if(modes[i-1]===modes[i+1]&&modes[i]!==modes[i-1])bounces.push({day:i+1,from:modes[i-1],via:modes[i],back:modes[i+1]});
  const stabilityScore=Math.max(0,100-transitions.length*5-bounces.length*25);
  return {modes,transitionCount:transitions.length,bounceCount:bounces.length,stabilityScore,transitions,bounces};
}

function simulatePersona(persona){
  const space=makeSpace(persona),days=[],metrics={repairDays:0,sustainableDays:0,subjectSustainableDays:0,progressDays:0,recoveryDays:0,challengeTasks:0,mathTasks:0,otherTasks:0,miniAttempts:0,completed:0,skipped:0};
  for(let dayIndex=0;dayIndex<14;dayIndex++){
    const currentDate=dayAdd(START,dayIndex),built=buildCandidates(space,persona,currentDate);
    rebalance(space,persona,currentDate,built.candidates,built.recovery);
    dailySafety(space,persona,currentDate);
    const beforeModel=built.models.m1||modelFor(space,'k-ma','m1',currentDate,built.weak['k-ma']),events=simulateTasks(space,persona,currentDate,dayIndex);
    addMini(space,persona,currentDate,dayIndex);updateMasteryStatuses(space,currentDate);
    const afterWeak=examWeakness(persona,dayIndex),afterAdaptive=adaptiveState(space,persona,'k-ma','m1',currentDate,afterWeak),afterModel=modelFor(space,persona,'k-ma','m1',currentDate,afterWeak['k-ma'],afterAdaptive),afterSubjectAdaptive=adaptiveState(space,persona,'k-ma','',currentDate,afterWeak),afterSubjectModel=modelFor(space,persona,'k-ma','',currentDate,afterWeak['k-ma'],afterSubjectAdaptive),afterRisk=riskFor(space,persona,'m1',currentDate,afterModel,afterWeak['k-ma']),recoveryAfter=recoverySignal(space,currentDate),previousApplied=days.length?{mode:days.at(-1).appliedMode,hysteresisHeld:!!days.at(-1).hysteresisHeld,easeHysteresisHeld:!!days.at(-1).easeHysteresisHeld,easeEntryHeld:!!days.at(-1).easeEntryHeld}:null,appliedDecision=appliedDecisionFn(afterAdaptive,afterModel,built.recovery,previousApplied);
    if(afterModel.state==='repair')metrics.repairDays++;if(afterModel.state==='sustainable')metrics.sustainableDays++;if(afterSubjectModel.state==='sustainable')metrics.subjectSustainableDays++;if(afterModel.state==='progress')metrics.progressDays++;if(built.recovery.active)metrics.recoveryDays++;
    for(const e of events){if(e.action==='complete')metrics.completed++;else metrics.skipped++;if(e.reviewVariant==='challenge')metrics.challengeTasks++;if(e.topicId?.startsWith('m'))metrics.mathTasks++;else metrics.otherTasks++;}
    metrics.miniAttempts=space.assessments.length;
    const mathPractice=practiceSignal(space,'k-ma','m1');
    days.push({day:dayIndex+1,date:currentDate,beforeState:beforeModel.state,afterState:afterModel.state,appliedMode:appliedDecision.mode,hysteresisHeld:!!appliedDecision.hysteresisHeld,easeHysteresisHeld:!!appliedDecision.easeHysteresisHeld,easeEntryHeld:!!appliedDecision.easeEntryHeld,subjectState:afterSubjectModel.state,subjectExecution:afterSubjectModel.execution,subjectAdaptiveMode:afterSubjectAdaptive.mode,adaptiveMode:afterAdaptive.mode,adaptiveRepairScore:afterAdaptive.repairScore,adaptiveProgressScore:afterAdaptive.progressScore,adaptiveEvidence:afterAdaptive.evidence,confidence:afterModel.confidence,learningNeed:afterModel.learningNeed,risk:afterRisk.score,recovery:built.recovery.active,openMistakes:afterModel.openMistakes,retention:afterModel.retention,challenges:events.filter(e=>e.reviewVariant==='challenge').length,completed:events.filter(e=>e.action==='complete').length,skipped:events.filter(e=>e.action!=='complete').length,mathAccuracy:mathPractice.weightedAccuracy||null,mathRecentAccuracy:mathPractice.known?mathPractice.recentAccuracy:null});
  }
  return {persona,space,days,metrics,churn:modeChurn(days)};
}

const results=PERSONAS.map(simulatePersona);
const byId=Object.fromEntries(results.map(r=>[r.persona.id,r]));

for(const r of results){
  assert.equal(r.days.length,14,`${r.persona.id} did not simulate 14 days`);
  assert.ok(r.metrics.completed+r.metrics.skipped>0,`${r.persona.id} had no route decisions`);
  assert.ok(r.days.every(d=>d.confidence>=0&&d.confidence<=100),`${r.persona.id} invalid confidence`);
  assert.ok(r.days.every(d=>d.risk>=0&&d.risk<=100),`${r.persona.id} invalid risk`);
  assert.equal(r.churn.bounceCount,0,`${r.persona.id} has repair/steady/progress mode oscillation`);
  assert.ok(r.churn.transitionCount<=3,`${r.persona.id} changed applied mode too often: ${r.churn.transitionCount}`);
  assert.ok(r.churn.stabilityScore>=85,`${r.persona.id} decision stability score too low: ${r.churn.stabilityScore}`);
  assert.ok(r.days.every((d,i)=>!d.hysteresisHeld||(!d.recovery&&d.appliedMode==='progress'&&(i===0||!r.days[i-1].hysteresisHeld))),`${r.persona.id} has invalid or repeated progress hysteresis hold`);
}

{
  const r=byId['weak-improver'],first=r.days.find(d=>d.mathAccuracy!==null),last=[...r.days].reverse().find(d=>d.mathAccuracy!==null);
  assert.ok(first&&last&&last.mathAccuracy>first.mathAccuracy,`weak improver did not improve: ${first?.mathAccuracy} -> ${last?.mathAccuracy}`);
  assert.ok(r.days.at(-1).learningNeed<Math.max(...r.days.slice(0,5).map(d=>d.learningNeed)),'weak improver learning need did not fall as performance improved');
  const firstRepair=r.days.find(d=>d.afterState==='repair');
  assert.ok(firstRepair&&firstRepair.adaptiveRepairScore>=4,'weak improver entered repair without corroborated repair strength');
  const repairExit=r.days.find((d,i)=>i>0&&r.days[i-1].afterState==='repair'&&d.afterState!=='repair');
  assert.ok(repairExit,'weak improver never exited repair');
  assert.equal(repairExit.openMistakes,0,'weak improver exited repair with an unresolved mistake');
  assert.ok(repairExit.adaptiveRepairScore<=3,'weak improver exited repair before entering the hysteresis deadband');
  assert.ok(repairExit.mathRecentAccuracy>=.70,'weak improver exited repair before current performance showed recovery');
  assert.ok(r.days.slice(repairExit.day-1).every(d=>d.afterState!=='repair'||d.adaptiveRepairScore>=4),'weak improver bounced back into repair without renewed corroboration');
  const objectivelyRecovered=r.days.find(d=>d.mathRecentAccuracy!==null&&d.mathRecentAccuracy>=.80&&d.mathAccuracy>=.72&&d.openMistakes===0);
  assert.ok(objectivelyRecovered,'weak improver never reached the objective recovery threshold');
  assert.ok(r.days.slice(objectivelyRecovered.day-1).every(d=>d.afterState!=='repair'),'weak improver remained or returned to repair after objective recovery');
  assert.ok(r.metrics.mathTasks>=3,'weak improver received too little math work');
}
{
  const r=byId['high-skill-low-compliance'];
  assert.ok(r.metrics.recoveryDays>=1,'low-compliance student never entered recovery');
  assert.ok(r.metrics.subjectSustainableDays>=1,'low-compliance student never received subject-level sustainable interpretation');
  assert.equal(r.metrics.progressDays,0,'low-compliance student must not receive progression decisions while adherence is poor');
}
{
  const r=byId['hidden-gap'];
  assert.ok(r.metrics.repairDays>=1,'hidden-gap student never entered repair');
  assert.ok(r.days.slice(0,5).some(d=>d.afterState==='repair'),'hidden-gap student did not receive early repair');
  assert.ok(r.days.slice(0,5).every(d=>d.afterState!=='progress'),'hidden-gap student progressed too early');
  assert.notEqual(r.days.at(-1).afterState,'repair','hidden-gap student stayed trapped in repair after accuracy recovered');
  assert.ok(r.days.at(-1).learningNeed<Math.max(...r.days.slice(0,5).map(d=>d.learningNeed)),'hidden-gap student did not recover');
  const retakeDate=dayAdd(START,3);
  assert.equal(r.space.assessments.filter(a=>a.date===retakeDate&&a.miniId==='sim-m1').length,2,'hidden-gap fixture must contain a same-day mini retake');
  assert.equal(assessmentSamples(r.space,'k-ma','m1').filter(a=>a.date===retakeDate).length,1,'same-day mini retake inflated closed-loop evidence');
}
{
  const r=byId['productive-struggle'];
  assert.equal(r.metrics.repairDays,0,'productive struggle was mislabeled repair');
}
{
  const r=byId['fast-learner'];
  assert.ok(r.metrics.progressDays>=1,'fast learner never reached progress');
  const firstProgress=r.days.find(d=>d.afterState==='progress');
  assert.ok(firstProgress&&firstProgress.mathAccuracy>=.78,'fast learner progressed before objective performance was strong enough');
  assert.ok(firstProgress.confidence>=45,'fast learner progressed before calibrated confidence matured');
  assert.ok(r.days.filter(d=>d.day<firstProgress.day).every(d=>d.challenges===0),'fast learner received a challenge before corroborated progression');
  assert.ok(r.days.at(-1).confidence>=r.days[0].confidence,'fast learner confidence did not mature');
}
{
  const r=byId['plateau'];
  assert.equal(r.metrics.progressDays,0,'plateau student incorrectly reached progress');
  assert.equal(r.metrics.challengeTasks,0,'plateau student received a challenge without corroborated progression');
  assert.equal(r.churn.bounceCount,0,'plateau student has one-day repair/steady mode chatter');
}
{
  const r=byId['regressing'];
  assert.equal(r.metrics.progressDays,0,'regressing student incorrectly reached progress');
  assert.equal(r.metrics.challengeTasks,0,'regressing student received a challenge from stale adaptive progress');
  assert.ok(r.days.at(-1).learningNeed>r.days[0].learningNeed||r.days.at(-1).risk>r.days[0].risk,'regressing student did not become more concerning');
}
{
  const r=byId['recovery-comeback'];
  assert.ok(r.metrics.recoveryDays>=1,'comeback student never entered recovery');
  assert.equal(r.days.at(-1).recovery,false,'comeback student remained stuck in recovery');
}
{
  const r=byId['urgent-weak'];
  assert.ok(r.metrics.mathTasks>=r.metrics.otherTasks/3,'urgent weak student did not receive enough math priority');
  assert.ok(Math.max(...r.days.slice(0,5).map(d=>d.risk))>=60,'urgent weak student risk stayed unrealistically low');
}
{
  const r=byId['strong-balanced'];
  assert.equal(r.metrics.repairDays,0,'strong balanced student entered repair');
  assert.ok(Math.max(...r.days.map(d=>d.risk))<70,'strong balanced student became high risk');
}

const summary=results.map(r=>({
  id:r.persona.id,completed:r.metrics.completed,skipped:r.metrics.skipped,repairDays:r.metrics.repairDays,
  sustainableDays:r.metrics.sustainableDays,subjectSustainableDays:r.metrics.subjectSustainableDays,progressDays:r.metrics.progressDays,recoveryDays:r.metrics.recoveryDays,challengeTasks:r.metrics.challengeTasks,
  mathTasks:r.metrics.mathTasks,finalConfidence:r.days.at(-1).confidence,finalNeed:r.days.at(-1).learningNeed,
  finalRisk:r.days.at(-1).risk,completedTopics:Object.values(r.space.topicState).filter(x=>x.status===2).length,
  modeTransitions:r.churn.transitionCount,modeBounces:r.churn.bounceCount,stabilityScore:r.churn.stabilityScore,progressHolds:r.days.filter(d=>d.hysteresisHeld).length,appliedModes:r.churn.modes.join('>')
}));

console.log('route-engine-closed-loop: 10 students x 14 days = 140 daily decision cycles passed');
console.log(JSON.stringify(summary));


// --- 30/60-day closed-loop lifecycle ---------------------------------------
// Keep the original 14-day regression intact. This second layer reuses the
// production model functions extracted above, but lets behaviour and ability
// change over 60 real calendar days.
const lfFreshness=evidenceFreshnessFn;
const lfExamFactorSrc=between('function routeExamEvidenceFactor','function routeExamWeakness');
function lfExamFactor(space,date,exam,subjectId){
  const fn=new Function('today','w','C',lfExamFactorSrc+';return routeExamEvidenceFactor;');
  return fn(function(){return date;},function(){return space;},{PART_SUBJECTS:{}})(exam,subjectId);
}
function lfPhase(p,d){
  let math=.72,completion=.90,volume=.95,feeling='';
  if(p.id==='weak-improver')math=Math.min(.86,.45+d*.010);
  else if(p.id==='high-skill-low-compliance'){math=.88;completion=d<20?.38:.90;volume=d<20?.72:.95;}
  else if(p.id==='hidden-gap'){math=Math.min(.82,.50+d*.007);feeling=d<14?'hidden-gap':'';}
  else if(p.id==='productive-struggle'){math=.86;feeling=d<18?'productive-struggle':'';}
  else if(p.id==='fast-learner')math=Math.min(.91,.58+d*.018);
  else if(p.id==='plateau')math=.63+(d%9===0?.02:0);
  else if(p.id==='regressing')math=d<18?.88:Math.max(.52,.88-(d-18)*.012);
  else if(p.id==='recovery-comeback'){math=Math.min(.82,.70+d*.003);completion=d<6?.20:.90;volume=d<6?.70:.92;}
  else if(p.id==='urgent-weak')math=Math.min(.76,.48+d*.006);
  else if(p.id==='strong-balanced'){math=.88;completion=.96;volume=1;}
  else if(p.id==='late-breakthrough')math=d<20?.50:d<40?Math.min(.84,.50+(d-19)*.017):.84;
  else if(p.id==='burnout-after-success'){math=d<20?Math.min(.90,.78+d*.007):.78;completion=d<20?.96:.34;volume=d<20?1:.58;}
  else if(p.id==='false-confidence-corrected'){math=d<15?.50:Math.min(.78,.56+(d-15)*.008);feeling=d<15?'hidden-gap':'';}
  else if(p.id==='relapse')math=d<12?.50:d<32?Math.min(.82,.60+(d-12)*.012):d<44?.55:Math.min(.76,.58+(d-44)*.012);
  else if(p.id==='exam-refresh')math=Math.min(.82,.58+d*.006);
  else if(p.id==='long-stable'){math=.87;completion=.95;volume=1;}
  else if(p.id==='slow-growth')math=Math.min(.84,.55+d*.005);
  else if(p.id==='noisy-student')math=clamp(.72+Math.sin(d*1.7)*.10,.58,.84);
  return {accuracy:{'k-ma':math,'k-tr':.78,'k-ta':.74,'k-co':.72},completion,volume,feeling};
}
const LF_EXTRA=[
  {id:'late-breakthrough',name:'Geç açılan öğrenci',seed:21,dailyMinutes:90,targetDays:120,exam:{'k-ma':.48,'k-tr':.76,'k-ta':.72,'k-co':.70},profileLevel:{'k-ma':1}},
  {id:'burnout-after-success',name:'Başarı sonrası tükenme',seed:22,dailyMinutes:120,targetDays:120,exam:{'k-ma':.80,'k-tr':.82,'k-ta':.78,'k-co':.76}},
  {id:'false-confidence-corrected',name:'Yanlış güvenini düzelten',seed:23,dailyMinutes:90,targetDays:120,exam:{'k-ma':.50,'k-tr':.76,'k-ta':.72,'k-co':.70},profileLevel:{'k-ma':1}},
  {id:'relapse',name:'Toparlanıp tekrar düşen',seed:24,dailyMinutes:90,targetDays:120,exam:{'k-ma':.50,'k-tr':.76,'k-ta':.72,'k-co':.70},profileLevel:{'k-ma':1}},
  {id:'exam-refresh',name:'Eski kötü denemeyi yeni güçlü denemeyle güncelleyen',seed:25,dailyMinutes:120,targetDays:120,exam:{'k-ma':.48,'k-tr':.76,'k-ta':.72,'k-co':.70},profileLevel:{'k-ma':1}},
  {id:'long-stable',name:'Uzun süre güçlü ve dengeli',seed:26,dailyMinutes:120,targetDays:120,exam:{'k-ma':.86,'k-tr':.88,'k-ta':.84,'k-co':.82}},
  {id:'slow-growth',name:'Yavaş ama kalıcı gelişen',seed:27,dailyMinutes:90,targetDays:120,exam:{'k-ma':.55,'k-tr':.76,'k-ta':.72,'k-co':.70},profileLevel:{'k-ma':1}},
  {id:'noisy-student',name:'Günlük dalgalı uzun dönem stabil',seed:28,dailyMinutes:90,targetDays:120,exam:{'k-ma':.72,'k-tr':.76,'k-ta':.72,'k-co':.70}}
];
const LF_PERSONAS=PERSONAS.map(function(p){return {...p,targetDays:Math.max(90,p.targetDays||90)};}).concat(LF_EXTRA);
function lfPersona(base,d){
  const x=lfPhase(base,d),exam={...(base.exam||{})},examHistory=[{day:0,scores:{...(base.exam||{})}}];
  if(base.id==='exam-refresh'){examHistory.push({day:25,scores:{...(base.exam||{}),'k-ma':.84,'k-tr':.82,'k-ta':.78,'k-co':.76}});if(d>=25)exam['k-ma']=.84;}
  return {...base,accuracy:x.accuracy,completion:x.completion,volume:x.volume,feeling:x.feeling,trend:{},exam,examHistory,dailyMinutes:base.dailyMinutes||120};
}
function lfMini(space,p,date,d){
  if(![3,7,11,18,25,33,42,52].includes(d))return;
  const t=miniTarget(space),acc=p.accuracy[t.subjectId]??.72,total=10,correct=Math.round(total*acc);
  space.assessments.push({id:'lf-ass-'+(++uid),miniId:'lf-'+t.id,date,subjectId:t.subjectId,topicId:t.id,title:'Lifecycle mini',total,correct,wrong:total-correct,blank:0,minutes:12,created:uid,skill:'Temel uygulama',skillBreakdown:[]});
}
function lfLongest(days,mode){let best=0,n=0;for(const d of days){if(d.appliedMode===mode){n++;best=Math.max(best,n);}else n=0;}return best;}
function lfFirst(days,mode,enter){
  for(let i=0;i<days.length;i++){const a=days[i].appliedMode===mode,b=i?days[i-1].appliedMode===mode:false;if(enter&&a&&!b)return days[i].day;if(!enter&&!a&&b)return days[i].day;}
  return null;
}
function lfBacktest(days){
  const out={success:0,neutral:0,harmful:0,insufficientEvidence:0,events:[]};
  for(let i=0;i<days.length;i++){
    const d=days[i],prev=i?days[i-1].appliedMode:'steady';
    if(!['repair','ease','progress'].includes(d.appliedMode)||d.appliedMode===prev)continue;
    const a=days[Math.min(days.length-1,i+14)],b=days[Math.min(days.length-1,i+30)];let score=0,insufficient=false;
    if(d.appliedMode==='repair'){
      const base=Number.isFinite(d.performance)?d.performance:null,future=[a,b].map(function(x){return x.performance;}).filter(Number.isFinite);
      if(base===null||!future.length){insufficient=true;score=0;}
      else {score=(future[0]-base)+(future.length>1?(future[1]-base)*.5:0)+(d.openMistakes-(b.openMistakes||0))*6;}
    }else if(d.appliedMode==='ease'){
      const base=Number.isFinite(d.execution)?d.execution:null,future=[a,b].map(function(x){return x.execution;}).filter(Number.isFinite);
      if(base===null||!future.length){insufficient=true;score=0;}
      else score=(future[0]-base)+(future.length>1?(future[1]-base)*.5:0);
    }else{
      const base=Number.isFinite(d.performance)?d.performance:null,future=[a,b].map(function(x){return x.performance;}).filter(Number.isFinite);
      if(base===null||!future.length){insufficient=true;score=0;}
      else score=Math.min.apply(null,future.map(function(x){return x-base;}))+4;
    }
    const label=insufficient?'neutral':score>=5?'success':score<=-8?'harmful':'neutral';out[label]++;if(insufficient)out.insufficientEvidence++;
    out.events.push({day:d.day,mode:d.appliedMode,label,insufficientEvidence:insufficient,score:Math.round(score),basePerformance:d.performance,day14Performance:a.performance,day30Performance:b.performance,baseExecution:d.execution,day14Execution:a.execution,day30Execution:b.execution});
  }
  return out;
}
function lfChurn(days){
  const base=modeChurn(days),bounces=[];
  for(let i=1;i<days.length-1;i++){
    if(['retention','collect'].includes(days[i].studentState))continue;
    if(days[i-1].appliedMode===days[i+1].appliedMode&&days[i].appliedMode!==days[i-1].appliedMode)bounces.push({day:i+1,from:days[i-1].appliedMode,via:days[i].appliedMode,back:days[i+1].appliedMode});
  }
  return {...base,bounceCount:bounces.length,bounces,stabilityScore:Math.max(0,100-base.transitionCount*5-bounces.length*25)};
}
function lfRefreshAudit(r){
  const tasks=r.space.plan.filter(function(p){return p.done&&p.source==='retention_refresh';}),groups=new Map(),keys=new Set();let duplicateKeys=0;
  for(const p of tasks){
    if(p.routeKey){if(keys.has(p.routeKey))duplicateKeys++;keys.add(p.routeKey);}
    const date=planEvidenceDate(r.space,p),xs=groups.get(p.topicId)||[];if(date)xs.push(date);groups.set(p.topicId,xs);
  }
  let minGap=null,maxPerTopic=0;
  for(const xs of groups.values()){
    xs.sort();maxPerTopic=Math.max(maxPerTopic,xs.length);
    for(let i=1;i<xs.length;i++){const gap=daysBetween(xs[i],xs[i-1]);minGap=minGap===null?gap:Math.min(minGap,gap);}
  }
  return {total:tasks.length,topics:groups.size,minGap,maxPerTopic,duplicateKeys};
}
function lfCheckpoint(r,n){
  const xs=r.days.slice(0,n),d=xs.at(-1),ch=lfChurn(xs),refreshAudit=lfRefreshAudit(r);
  return {day:n,finalState:d.studentState,confidence:d.confidence,learningNeed:d.learningNeed,risk:d.risk,modeTransitions:ch.transitionCount,modeBounces:ch.bounceCount,modeBounceDetails:ch.bounces,stabilityScore:ch.stabilityScore,longestRepairStreak:lfLongest(xs,'repair'),longestProgressStreak:lfLongest(xs,'progress'),firstRepairDay:lfFirst(xs,'repair',true),repairExitDay:lfFirst(xs,'repair',false),firstProgressDay:lfFirst(xs,'progress',true),progressExitDay:lfFirst(xs,'progress',false),recoveryDays:xs.filter(function(x){return x.recovery;}).length,sustainableDays:xs.filter(function(x){return x.studentState==='sustainable';}).length,completedTopics:d.completedTopics,masteryRegressions:xs.filter(function(x){return x.masteryRegression;}).length,forgettingRefreshCount:xs.reduce(function(a,x){return a+x.forgettingRefreshes;},0),staleEvidenceInfluence:d.staleEvidenceInfluence,personalNormChange:(Number.isFinite(d.normBase)&&Number.isFinite(r.normStart))?d.normBase-r.normStart:null,examFreshness:d.examFreshness,oldExamWeight:d.oldExamWeight,freshExamWeight:d.freshExamWeight,examEvidenceCount:d.examEvidenceCount,refreshAudit};
}
function lfSim(base){
  const space=makeSpace({...base,targetDays:Math.max(90,base.targetDays||90)}),days=[];let normStart=null,lastMastered=new Set();
  for(let d=0;d<60;d++){
    const date=dayAdd(START,d),p=lfPersona(base,d),built=buildCandidates(space,p,date);
    rebalance(space,p,date,built.candidates,built.recovery);dailySafety(space,p,date);
    const events=simulateTasks(space,p,date,d);lfMini(space,p,date,d);updateMasteryStatuses(space,date);
    const weak=examWeakness(p,d,space),ad=adaptiveState(space,p,'k-ma','m1',date,weak),model=modelFor(space,p,'k-ma','m1',date,weak['k-ma'],ad),risk=riskFor(space,p,'m1',date,model,weak['k-ma']);
    const noExam=modelFor(space,p,'k-ma','m1',date,null,ad),prev=days.length?{mode:days.at(-1).appliedMode,hysteresisHeld:!!days.at(-1).hysteresisHeld,easeHysteresisHeld:!!days.at(-1).easeHysteresisHeld,easeEntryHeld:!!days.at(-1).easeEntryHeld}:null,applied=appliedDecisionFn(ad,model,built.recovery,prev),norm=personalNorm(space,'k-ma','m1');
    if(normStart===null&&d>=9&&Number.isFinite(norm.baselineAccuracy))normStart=norm.baselineAccuracy;
    const mastered=new Set(Object.entries(space.topicState).filter(function(x){return x[1].status===2;}).map(function(x){return x[0];})),masteryRegression=[...lastMastered].some(function(id){return !mastered.has(id);});lastMastered=mastered;
    days.push({day:d+1,date,studentState:model.state,appliedMode:applied.mode,hysteresisHeld:!!applied.hysteresisHeld,easeHysteresisHeld:!!applied.easeHysteresisHeld,easeEntryHeld:!!applied.easeEntryHeld,adaptiveMode:ad.mode,adaptiveRepairScore:ad.repairScore,adaptiveProgressScore:ad.progressScore,adaptiveEvidence:ad.evidence,behaviorCompletion:ad.behavior?.completion??null,behaviorFriction:ad.behavior?.friction??null,attainmentRatio:ad.attainment?.weightedRatio??null,confidence:model.confidence,learningNeed:model.learningNeed,performance:model.performance,execution:model.execution,risk:risk.score,recovery:built.recovery.active,openMistakes:model.openMistakes,retention:model.retention,normBase:norm.baselineAccuracy,completedTopics:mastered.size,masteryRegression,forgettingRefreshes:events.filter(function(x){return x.source==='retention_refresh';}).length,staleEvidenceInfluence:(Number.isFinite(model.performance)&&Number.isFinite(noExam.performance))?Math.abs(model.performance-noExam.performance):0,examFreshness:weak['k-ma']?.freshness??null,oldExamWeight:weak['k-ma']?.oldestExamWeight??null,freshExamWeight:weak['k-ma']?.freshestExamWeight??null,examEvidenceCount:weak['k-ma']?.samples||0});
  }
  const r={persona:base,space,days,normStart};r.day30=lfCheckpoint(r,30);r.day60=lfCheckpoint(r,60);r.backtest=lfBacktest(days);return r;
}
const lfResults=LF_PERSONAS.map(lfSim),lfById=Object.fromEntries(lfResults.map(function(r){return [r.persona.id,r];}));
for(const r of lfResults)if(r.backtest.harmful)console.log('INTERVENTION-HARMFUL '+r.persona.id,JSON.stringify(r.backtest.events.filter(function(x){return x.label==='harmful';})));
for(const r of lfResults){const ch=lfChurn(r.days);for(const b of ch.bounces)console.log('LIFECYCLE-BOUNCE '+r.persona.id,JSON.stringify({bounce:b,window:r.days.slice(Math.max(0,b.day-3),Math.min(r.days.length,b.day+2))}));}
for(const r of lfResults){
  assert.equal(r.days.length,60,r.persona.id+' lifecycle length');
  assert.ok(r.day30.confidence>=0&&r.day30.confidence<=100&&r.day60.confidence>=0&&r.day60.confidence<=100,r.persona.id+' invalid lifecycle confidence');
  assert.equal(r.day60.modeBounces,0,r.persona.id+' has lifecycle mode bounce');
  if(r.day60.stabilityScore<60)console.log('LIFECYCLE-DIAG '+r.persona.id,JSON.stringify({modes:r.days.map(function(d){return d.appliedMode;}),states:r.days.map(function(d){return d.studentState;}),confidence:r.days.map(function(d){return d.confidence;}),execution:r.days.map(function(d){return d.execution;}),performance:r.days.map(function(d){return d.performance;})}));
  assert.ok(r.day60.stabilityScore>=60,r.persona.id+' lifecycle stability collapsed '+r.day60.stabilityScore);
  assert.ok(r.days.every(function(d,i){return !d.hysteresisHeld||(!d.recovery&&d.appliedMode==='progress'&&(i===0||!r.days[i-1].hysteresisHeld));}),r.persona.id+' unsafe repeated progress hold');
  assert.ok(r.days.every(function(d,i){return !d.easeHysteresisHeld||(d.appliedMode==='ease'&&(i===0||!r.days[i-1].easeHysteresisHeld));}),r.persona.id+' unsafe repeated ease re-entry hold');
  assert.ok(r.days.every(function(d,i){return !d.easeEntryHeld||(d.appliedMode==='steady'&&(i===0||!r.days[i-1].easeEntryHeld));}),r.persona.id+' unsafe repeated sustainable entry hold');
  assert.ok(r.day60.staleEvidenceInfluence<=18,r.persona.id+' stale exam dominates current performance');
  assert.equal(r.day60.refreshAudit.duplicateKeys,0,r.persona.id+' duplicated retention refresh route key');
  assert.ok(r.day60.refreshAudit.minGap===null||r.day60.refreshAudit.minGap>=10,r.persona.id+' retention refresh rain: min gap '+r.day60.refreshAudit.minGap);
  assert.ok(r.day60.refreshAudit.maxPerTopic<=5,r.persona.id+' too many retention refreshes for one topic: '+r.day60.refreshAudit.maxPerTopic);
}
assert.ok(lfById['late-breakthrough'].days.slice(0,20).some(function(d){return d.studentState==='repair';}),'late-breakthrough missed early repair');
assert.ok(lfById['late-breakthrough'].days.slice(40).every(function(d){return d.studentState!=='repair';}),'late-breakthrough trapped in repair');
assert.ok(lfById['high-skill-low-compliance'].days.slice(0,20).some(function(d){return d.studentState==='sustainable';}),'identity drift missed early low compliance');
assert.ok(lfById['high-skill-low-compliance'].days.slice(40).some(function(d){return d.studentState!=='sustainable';}),'identity drift stayed stuck on old characterization');
assert.ok(lfById['relapse'].days.slice(12,32).some(function(d){return d.studentState!=='repair';}),'relapse never recovered first phase');
if(!lfById['relapse'].days.slice(32,50).some(function(d){return d.studentState==='repair';}))console.log('RELAPSE-DIAG',JSON.stringify(lfById['relapse'].days.slice(25,52)));
assert.ok(lfById['relapse'].days.slice(32,50).some(function(d){return d.studentState==='repair';}),'relapse real decline was missed');
assert.ok(lfById['false-confidence-corrected'].days.slice(0,15).some(function(d){return d.studentState==='repair';}),'false confidence hidden gap was missed');
assert.ok(lfById['false-confidence-corrected'].days.slice(35).some(function(d){return d.studentState!=='repair';}),'false confidence correction never changed model');
assert.ok(lfById['noisy-student'].day60.modeBounces<=1,'noisy student caused repeated mode chatter');
const examRefresh60=lfById['exam-refresh'].day60;assert.ok(Number.isFinite(examRefresh60.oldExamWeight)&&Number.isFinite(examRefresh60.freshExamWeight)&&examRefresh60.freshExamWeight>examRefresh60.oldExamWeight,'fresh exam did not outweigh stale exam inside lifecycle');assert.ok(examRefresh60.examEvidenceCount>=2,'exam refresh lifecycle did not preserve both old and fresh exam evidence');
const burn=lfById['burnout-after-success'];assert.ok(burn.days.find(function(d){return d.appliedMode==='progress';}),'burnout persona never reached progress');assert.ok(burn.days.slice(25).some(function(d){return d.appliedMode!=='progress';}),'progress stuck after burnout');
{
  const space={logs:[]},exam={date:START};
  for(let i=1;i<=12;i++)space.logs.push({sessionId:'s'+i,date:dayAdd(START,i+35),subjectId:'k-ma'});
  assert.equal(lfExamFactor(space,dayAdd(START,50),exam,'k-ma'),.35,'old exam did not decay after age + new study');
  const fresh={date:dayAdd(START,25)},oldW=.82*lfExamFactor(space,dayAdd(START,50),exam,'k-ma'),freshW=1*lfExamFactor(space,dayAdd(START,50),fresh,'k-ma');
  assert.ok(freshW>oldW,'fresh exam failed to outweigh stale exam');
}
{
  const one=studentFn({practice:{known:true,sessions:20,answered:400,weightedAccuracy:.88,accuracy:.88},weak:null,behavior:{known:false,total:0},outcome:{known:false,total:0},retention:{known:false,score:null},trend:{known:false,direction:'unknown',delta:0},calibration:{known:false,hiddenGap:0,productiveStruggle:0,alignedStrong:0,alignedStruggle:0},skillWeakness:{known:false,weak:[],primary:null},adaptive:{mode:'steady'},openMistakes:0,practiceLogCount:20,miniDays:0,difficultyKnown:false,errorMemory:{known:false,repeated:false,primary:null,total:0},velocity:{known:false,key:'unknown',confidence:0},personalNorm:{known:false,direction:'unknown',confidence:0},latestDays:0,attainmentRatio:null});
  assert.ok(one.confidence<=35,'single evidence family inflated confidence '+one.confidence);
}
{
  const fragile14=forgettingFn({mastery:82,daysSince:14,stabilityDays:16});
  const standard14=forgettingFn({mastery:88,daysSince:14,stabilityDays:22});
  const standard21=forgettingFn({mastery:88,daysSince:21,stabilityDays:22});
  const strong21=forgettingFn({mastery:92,daysSince:21,stabilityDays:28});
  const strong30=forgettingFn({mastery:92,daysSince:30,stabilityDays:28});
  assert.equal(fragile14.reviewDue,true,'fragile mastered topic did not reopen near 14-day window');
  assert.equal(standard14.reviewDue,false,'standard mastered topic refreshed too early before 21-day window');
  assert.equal(standard21.reviewDue,true,'standard mastered topic did not reopen near 21-day window');
  assert.equal(strong21.reviewDue,false,'strong mastered topic refreshed too early at 21 days');
  assert.equal(strong30.reviewDue,true,'strong mastered topic did not reopen near 30-day window');
}
{
  const p=LF_PERSONAS.find(function(x){return x.id==='strong-balanced';}),space=makeSpace(p);
  const add=function(id,date,source,reviewWave,baseId,correct=9,wrong=1){
    const task={id,date,subjectId:'k-ma',topicId:'m1',title:id,minutes:25,done:true,source,kind:source==='curriculum'?'study':'review',routeKey:id};
    if(reviewWave)task.reviewWave=reviewWave;if(baseId){task.reviewBaseTaskId=baseId;task.reviewBaseDate=START;}
    space.plan.push(task);space.logs.push({id:'log-'+id,sessionId:id,date,subjectId:'k-ma',title:id,minutes:25,questions:correct+wrong,correct,wrong,outcome:correct/(correct+wrong)>=.8?'strong':'ok',created:++uid,updated:uid});
    return task;
  };
  add('cycle-old-base',START,'curriculum');
  add('cycle-old-r3',dayAdd(START,3),'spaced_review',3,'cycle-old-base');
  add('cycle-old-r7',dayAdd(START,7),'spaced_review',7,'cycle-old-base');
  const oldMastery=masterySignal(space,'m1',dayAdd(START,8));assert.equal(oldMastery.ready,true,'old lifecycle fixture never reached mastery');
  space.topicState.m1={status:2};
  const dueBefore=forgettingFor(space,p,'m1',dayAdd(START,45));assert.equal(dueBefore.reviewDue,true,'mastered topic never reopened after long forgetting gap');
  add('cycle-refresh',dayAdd(START,45),'retention_refresh');
  const afterRefresh=forgettingFor(space,p,'m1',dayAdd(START,46));assert.equal(afterRefresh.reviewDue,false,'retention refresh did not reset forgetting clock');
  add('cycle-new-base',dayAdd(START,50),'curriculum');
  space.topicState.m1={status:1};
  const newCycle=masterySignal(space,'m1',dayAdd(START,51));
  assert.equal(newCycle.baseTaskId,'cycle-new-base','new learning cycle did not become mastery anchor');
  assert.equal(newCycle.review3,false,'old 3-day review leaked into new learning cycle');
  assert.equal(newCycle.review7,false,'old 7-day review leaked into new learning cycle');
  assert.equal(newCycle.ready,false,'old retention evidence completed a fresh learning cycle');
}
assert.equal(lfFreshness(3),1,'freshness 3d');assert.equal(lfFreshness(21),.55,'freshness 21d');assert.equal(lfFreshness(45),.35,'freshness 45d');
const lfSummary=lfResults.map(function(r){return {id:r.persona.id,day30:r.day30,day60:r.day60,interventionSuccess:r.backtest.success,interventionNeutral:r.backtest.neutral,interventionHarmful:r.backtest.harmful,interventionInsufficientEvidence:r.backtest.insufficientEvidence};});
console.log('route-engine-lifecycle: '+LF_PERSONAS.length+' students x 60 days = '+(LF_PERSONAS.length*60)+' daily cycles; day 30 + day 60 checkpoints passed');
console.log(JSON.stringify(lfSummary));
