(function(root){
'use strict';

const VERSION=2;
const CONTRACTS=root.RotaContracts||(typeof require==='function'?require('./route-contracts.js'):null);
function text(value,max=700){
  return CONTRACTS?.studentText?CONTRACTS.studentText(value,max):String(value??'').replace(/\s+/g,' ').trim().slice(0,max);
}
function number(value){
  return Number.isFinite(value)?Number(value):null;
}
function bool(value){return !!value;}
function list(value,max){return Array.isArray(value)?value.slice(0,max):[];}
function safePlan(items){
  return list(items,8).map(item=>({
    subject:text(item?.subject,120),
    topic:text(item?.topic,180),
    title:text(item?.title,180),
    minutes:number(item?.minutes),
    targetQuestions:Number.isInteger(item?.targetQuestions)?item.targetQuestions:null,
    reason:text(item?.reason,500),
    mode:text(item?.mode,40),
    modeLabel:text(item?.modeLabel,80)
  }));
}
function safeMastery(value){
  if(!value||typeof value!=='object')return null;
  if(value.scope==='topic')return {
    scope:'topic',
    ready:bool(value.ready),
    progress:number(value.progress),
    total:number(value.total),
    baseDate:text(value.baseDate,20),
    review3:bool(value.review3),
    review7:bool(value.review7),
    openMistake:bool(value.openMistake),
    next:text(value.next,220)
  };
  return {
    scope:'today_plan',
    topics:list(value.topics,5).map(x=>({
      subject:text(x?.subject,120),
      topic:text(x?.topic,180),
      ready:bool(x?.ready),
      progress:number(x?.progress),
      total:number(x?.total),
      baseDate:text(x?.baseDate,20),
      review3:bool(x?.review3),
      review7:bool(x?.review7),
      openMistake:bool(x?.openMistake),
      next:text(x?.next,220)
    }))
  };
}
function build(raw){
  raw=raw&&typeof raw==='object'?raw:{};
  const envelope=CONTRACTS?.teacherContextEnvelope?CONTRACTS.teacherContextEnvelope(raw):raw;
  const todayPlan=safePlan(envelope.todayPlan);
  const routeMode=envelope.routeMode&&typeof envelope.routeMode==='object'?envelope.routeMode:{};
  const routeDecision=envelope.routeDecision&&typeof envelope.routeDecision==='object'?envelope.routeDecision:{};
  const studentModel=envelope.studentModel&&typeof envelope.studentModel==='object'?envelope.studentModel:{};
  const completion=envelope.completion&&typeof envelope.completion==='object'?envelope.completion:{};
  const examRisk=envelope.examRisk&&typeof envelope.examRisk==='object'?envelope.examRisk:null;
  const selected=envelope.selected&&typeof envelope.selected==='object'?envelope.selected:{};
  const out={
    contextVersion:VERSION,
    exam:text(envelope.exam,60),
    track:text(envelope.track,100),
    selected:{subject:text(selected.subject,140),topic:text(selected.topic,200)},
    target:text(envelope.target,180),
    targetDate:text(envelope.targetDate,20),
    dailyMinutes:number(envelope.dailyMinutes),
    topicStatus:number(envelope.topicStatus),
    routeSummary:{
      lastReason:text(envelope.routeSummary?.lastReason,700),
      lastChanged:number(envelope.routeSummary?.lastChanged),
      lastRun:text(envelope.routeSummary?.lastRun,20)
    },
    completion:{
      known:bool(completion.known),
      ratio:number(completion.ratio),
      active:number(completion.active),
      expected:number(completion.expected)
    },
    todaySummary:{
      openTasks:todayPlan.length,
      totalMinutes:todayPlan.reduce((n,x)=>n+(Number(x.minutes)||0),0),
      firstReason:todayPlan[0]?.reason||'',
      firstTask:todayPlan[0]?.title||''
    },
    todayPlan,
    routeMode:{
      mode:text(routeMode.mode,40),
      label:text(routeMode.label,80),
      explanation:text(routeMode.explanation,240),
      action:text(routeMode.action,240),
      confidence:number(routeMode.confidence),
      note:text(routeMode.note,500)
    },
    routeDecision:{
      mode:text(routeDecision.mode,40),
      label:text(routeDecision.label,80),
      note:text(routeDecision.note,500),
      confidence:number(routeDecision.confidence),
      evidence:list(routeDecision.evidence,6).map(x=>text(x,180)).filter(Boolean)
    },
    studentModel:{
      state:text(studentModel.state,60),
      label:text(studentModel.label,120),
      confidence:number(studentModel.confidence),
      learningNeed:number(studentModel.learningNeed),
      performance:number(studentModel.performance),
      retention:number(studentModel.retention),
      execution:number(studentModel.execution),
      nextAction:text(studentModel.nextAction,500),
      openMistakes:number(studentModel.openMistakes),
      trend:text(studentModel.trend,40),
      personalNorm:text(studentModel.personalNorm,40),
      velocity:text(studentModel.velocity,160)
    },
    examRisk:examRisk?{
      score:number(examRisk.score),
      label:text(examRisk.label,120),
      action:text(examRisk.action,400),
      reasons:list(examRisk.reasons,5).map(x=>text(x,180)).filter(Boolean)
    }:null,
    mastery:safeMastery(envelope.mastery),
    recentExams:list(envelope.recentExams,3).map(x=>({date:text(x?.date,20),type:text(x?.type,40),name:text(x?.name,160),net:number(x?.net)})),
    recentMistakes:list(envelope.recentMistakes,6).map(x=>({subject:text(x?.subject,120),topic:text(x?.topic,180),cause:text(x?.cause,180),reviewDate:text(x?.reviewDate,20)})),
    recentLogs:list(envelope.recentLogs,8).map(x=>({date:text(x?.date,20),subject:text(x?.subject,120),minutes:number(x?.minutes),questions:number(x?.questions),title:text(x?.title,180),outcome:text(x?.outcome,40),difficulty:text(x?.difficulty,40),correct:number(x?.correct),wrong:number(x?.wrong)})),
    teacherSignals:list(envelope.teacherSignals,6).map(x=>({subject:text(x?.subject,120),topic:text(x?.topic,180),status:text(x?.status,40),question:text(x?.question,180)}))
  };
  out.contextHealth={
    hasTodayPlan:out.todayPlan.length>0,
    hasStudentModel:!!out.studentModel.label,
    hasMastery:!!out.mastery,
    completionKnown:out.completion.known
  };
  return out;
}

root.RotaTeacherContext={VERSION,build};
if(typeof module==='object')module.exports=root.RotaTeacherContext;
})(typeof window!=='undefined'?window:globalThis);
