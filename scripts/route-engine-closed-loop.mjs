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
const forgettingFn=new Function(between('function routeForgettingProjection','function routeTopicForgettingSignal')+';return routeForgettingProjection;')();

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
    topicState:{},plan:[],logs:[],mistakes:[],assessments:[],route:{decisions:[],interventions:[]},
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
function examWeakness(persona,dayIndex){
  const out={};
  for(const s of SUBJECTS){
    const ratio=clamp((persona.exam?.[s.id]??.75)+((persona.trend?.[s.id]||0)*Math.max(0,dayIndex-8)*.35),.25,.95);
    const freshness=dayIndex<10?1:.75,rawBoost=Math.round(Math.max(0,.78-ratio)*55);
    out[s.id]={ratio,boost:Math.round(rawBoost*freshness),samples:1,freshness};
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
  const latest=latestEvidenceDate(space,topicId);if(!latest)return {known:false,retained:0,reviewDue:false,nextReviewIn:null,latestDate:''};
  const p=practiceSignal(space,topic(topicId).subjectId,topicId),mastery=Math.max(70,Math.round((p.weightedAccuracy||.75)*100)),days=daysBetween(currentDate,latest),stability=persona.id==='fast-learner'?10:persona.id==='strong-balanced'?24:14;
  return {known:true,latestDate:latest,confidence:70,...forgettingFn({mastery,daysSince:days,stabilityDays:stability})};
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
  const weak=examWeakness(persona,daysBetween(currentDate,START)),models={},adaptives={},risks={};
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
  const state={activeExam:'kpss'},R={dayAdd},routeEnsure=()=>{},routeBuildCandidates=()=>candidates.map(x=>({...x})),routeEffectiveDailyMinutes=()=>persona.dailyMinutes,routeTaskMethod=p=>({key:taskMethod(p.subjectId)}),routeMethodLoad=k=>['quant','geometry','science','logic','ydt_reading'].includes(k)?2:['biology','paragraph','grammar','ydt_grammar'].includes(k)?1:0,routeIsQuantitativeHeavy=quantitative,routeIsReviewLike=isReviewLike,routeIsCriticalReview=isCriticalReview,routeIsBacklog=p=>p.source==='backlog',routeHeavyLimit=l=>l<=90?1:l<=180?2:3,routeQuantitativeDailyLimit=l=>l<=90?1:2,routeReviewDailyLimit=l=>Math.max(30,Math.round((l*.5)/5)*5),routeBacklogDailyLimit=(l,r)=>Math.min(l,Math.max(30,Math.round((l*(r?.active?(r.severe?.30:.35):.45))/5)*5)),routeBacklogDailyCountLimit=r=>r?.active?1:2,routeReviewWeeklyLimit=t=>Math.max(30,Math.round((t*.45)/5)*5),routeBacklogWeeklyLimit=(t,r)=>Math.min(t,Math.max(30,Math.round((t*(r?.active?(r.severe?.20:.25):.35))/5)*5)),routeRecordInterventions=()=>{},toast=()=>{},routeRecoverySignal=()=>recovery;
  const fn=new Function(
    'state','w','today','R','routeEnsure','routeRecoverySignal','routeBuildCandidates','routeEffectiveDailyMinutes',
    'routeTaskMethod','routeMethodLoad','routeIsQuantitativeHeavy','routeIsReviewLike','routeIsCriticalReview',
    'routeIsBacklog','routeHeavyLimit','routeQuantitativeDailyLimit','routeReviewDailyLimit','routeBacklogDailyLimit',
    'routeBacklogDailyCountLimit','routeReviewWeeklyLimit','routeBacklogWeeklyLimit','routeRecordInterventions','toast',
    rebalanceSrc+';return routeRebalance;'
  );
  return fn(
    state,()=>space,()=>currentDate,R,routeEnsure,routeRecoverySignal,routeBuildCandidates,routeEffectiveDailyMinutes,
    routeTaskMethod,routeMethodLoad,routeIsQuantitativeHeavy,routeIsReviewLike,routeIsCriticalReview,
    routeIsBacklog,routeHeavyLimit,routeQuantitativeDailyLimit,routeReviewDailyLimit,routeBacklogDailyLimit,
    routeBacklogDailyCountLimit,routeReviewWeeklyLimit,routeBacklogWeeklyLimit,routeRecordInterventions,toast
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
function appliedModeForDay(day){
  if(day.afterState==='repair')return 'repair';
  if(day.afterState==='sustainable')return 'ease';
  if(day.afterState==='progress'&&!day.recovery)return 'progress';
  return 'steady';
}
function modeChurn(days){
  const modes=days.map(appliedModeForDay),transitions=[];
  for(let i=1;i<modes.length;i++)if(modes[i]!==modes[i-1])transitions.push({day:i+1,from:modes[i-1],to:modes[i]});
  const bounces=[];
  for(let i=1;i<modes.length-1;i++)if(modes[i-1]===modes[i+1]&&modes[i]!==modes[i-1])bounces.push({day:i+1,from:modes[i-1],via:modes[i],back:modes[i+1]});
  return {modes,transitionCount:transitions.length,bounceCount:bounces.length,transitions,bounces};
}

function simulatePersona(persona){
  const space=makeSpace(persona),days=[],metrics={repairDays:0,sustainableDays:0,subjectSustainableDays:0,progressDays:0,recoveryDays:0,challengeTasks:0,mathTasks:0,otherTasks:0,miniAttempts:0,completed:0,skipped:0};
  for(let dayIndex=0;dayIndex<14;dayIndex++){
    const currentDate=dayAdd(START,dayIndex),built=buildCandidates(space,persona,currentDate);
    rebalance(space,persona,currentDate,built.candidates,built.recovery);
    dailySafety(space,persona,currentDate);
    const beforeModel=built.models.m1||modelFor(space,'k-ma','m1',currentDate,built.weak['k-ma']),events=simulateTasks(space,persona,currentDate,dayIndex);
    addMini(space,persona,currentDate,dayIndex);updateMasteryStatuses(space,currentDate);
    const afterWeak=examWeakness(persona,dayIndex),afterAdaptive=adaptiveState(space,persona,'k-ma','m1',currentDate,afterWeak),afterModel=modelFor(space,persona,'k-ma','m1',currentDate,afterWeak['k-ma'],afterAdaptive),afterSubjectAdaptive=adaptiveState(space,persona,'k-ma','',currentDate,afterWeak),afterSubjectModel=modelFor(space,persona,'k-ma','',currentDate,afterWeak['k-ma'],afterSubjectAdaptive),afterRisk=riskFor(space,persona,'m1',currentDate,afterModel,afterWeak['k-ma']),recoveryAfter=recoverySignal(space,currentDate);
    if(afterModel.state==='repair')metrics.repairDays++;if(afterModel.state==='sustainable')metrics.sustainableDays++;if(afterSubjectModel.state==='sustainable')metrics.subjectSustainableDays++;if(afterModel.state==='progress')metrics.progressDays++;if(built.recovery.active)metrics.recoveryDays++;
    for(const e of events){if(e.action==='complete')metrics.completed++;else metrics.skipped++;if(e.reviewVariant==='challenge')metrics.challengeTasks++;if(e.topicId?.startsWith('m'))metrics.mathTasks++;else metrics.otherTasks++;}
    metrics.miniAttempts=space.assessments.length;
    days.push({day:dayIndex+1,date:currentDate,beforeState:beforeModel.state,afterState:afterModel.state,subjectState:afterSubjectModel.state,subjectExecution:afterSubjectModel.execution,subjectAdaptiveMode:afterSubjectAdaptive.mode,adaptiveMode:afterAdaptive.mode,adaptiveRepairScore:afterAdaptive.repairScore,adaptiveProgressScore:afterAdaptive.progressScore,adaptiveEvidence:afterAdaptive.evidence,confidence:afterModel.confidence,learningNeed:afterModel.learningNeed,risk:afterRisk.score,recovery:built.recovery.active,openMistakes:afterModel.openMistakes,retention:afterModel.retention,challenges:events.filter(e=>e.reviewVariant==='challenge').length,completed:events.filter(e=>e.action==='complete').length,skipped:events.filter(e=>e.action!=='complete').length,mathAccuracy:practiceSignal(space,'k-ma','m1').weightedAccuracy||null});
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
}

{
  const r=byId['weak-improver'],first=r.days.find(d=>d.mathAccuracy!==null),last=[...r.days].reverse().find(d=>d.mathAccuracy!==null);
  assert.ok(first&&last&&last.mathAccuracy>first.mathAccuracy,`weak improver did not improve: ${first?.mathAccuracy} -> ${last?.mathAccuracy}`);
  assert.ok(r.days.at(-1).learningNeed<Math.max(...r.days.slice(0,5).map(d=>d.learningNeed)),'weak improver learning need did not fall as performance improved');
  const objectivelyRecovered=r.days.find(d=>d.mathAccuracy!==null&&d.mathAccuracy>=.78&&d.openMistakes===0);
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
  modeTransitions:r.churn.transitionCount,modeBounces:r.churn.bounceCount,appliedModes:r.churn.modes.join('>')
}));

console.log('route-engine-closed-loop: 10 students x 14 days = 140 daily decision cycles passed');
console.log(JSON.stringify(summary));
