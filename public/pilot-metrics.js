(function(root){
'use strict';

const SCHEMA='calisma-rotasi-pilot-events-v1';
const METRICS_VERSION=2;
const EVENT_TYPES=Object.freeze([
  'completion',
  'mode',
  'mistake_open',
  'intervention',
  'mini_result',
  'spaced_review'
]);
const MODES=new Set(['repair','steady','progress','ease']);
const dateOk=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v);
function dayAdd(date,days){
  if(!dateOk(date))return '';
  const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);
  return d.toISOString().slice(0,10);
}
function timestampDate(value){
  if(!Number.isFinite(value)||value<=0)return '';
  const d=new Date(value);
  return Number.isNaN(d.getTime())?'':d.toISOString().slice(0,10);
}
function inWindow(date,start,end){return dateOk(date)&&(!start||date>=start)&&(!end||date<=end);}
function ratio(n,d){return d?Math.round(n/d*100):null;}
function safeMode(mode){return MODES.has(mode)?mode:'';}
function id(v){return typeof v==='string'&&/^[\w:.-]{1,160}$/.test(v)?v:'';}
function safeEvent(type,payload={}){
  if(!EVENT_TYPES.includes(type))throw new Error('Desteklenmeyen pilot event tipi.');
  const out={schema:SCHEMA,type,date:dateOk(payload.date)?payload.date:''};
  const subjectId=id(payload.subjectId),topicId=id(payload.topicId);
  if(subjectId)out.subjectId=subjectId;
  if(topicId)out.topicId=topicId;
  if(type==='mode'||type==='intervention'){
    const mode=safeMode(payload.mode);
    if(mode)out.mode=mode;
  }
  if(type==='completion'){
    out.questions=Number.isInteger(payload.questions)&&payload.questions>=0?Math.min(5000,payload.questions):0;
    out.correct=Number.isInteger(payload.correct)&&payload.correct>=0?Math.min(out.questions,payload.correct):null;
    out.wrong=Number.isInteger(payload.wrong)&&payload.wrong>=0?Math.min(out.questions,payload.wrong):null;
  }
  if(type==='mini_result'){
    out.total=Number.isInteger(payload.total)&&payload.total>0?Math.min(200,payload.total):0;
    out.correct=Number.isInteger(payload.correct)&&payload.correct>=0?Math.min(out.total,payload.correct):0;
    out.wrong=Number.isInteger(payload.wrong)&&payload.wrong>=0?Math.min(out.total,payload.wrong):0;
  }
  if(type==='spaced_review')out.wave=[3,7].includes(payload.wave)?payload.wave:null;
  return out;
}
function reviewScheduledDate(p){
  if(dateOk(p?.date))return p.date;
  return dateOk(p?.reviewBaseDate)&&[3,7].includes(p?.reviewWave)?dayAdd(p.reviewBaseDate,p.reviewWave):'';
}
function collectEvents(workspace,options={}){
  const start=options.startDate||'',end=options.cutoffDate||'',events=[];
  const planMap=new Map((workspace?.plan||[]).map(p=>[p.id,p]));
  for(const log of workspace?.logs||[]){
    if(!log?.sessionId||!inWindow(log.date,start,end))continue;
    const p=planMap.get(log.sessionId);
    events.push(safeEvent('completion',{date:log.date,subjectId:log.subjectId,topicId:p?.topicId,questions:log.questions,correct:log.correct,wrong:log.wrong}));
  }
  for(const row of workspace?.route?.modeHistory||[]){
    if(!inWindow(row.date,start,end))continue;
    events.push(safeEvent('mode',{date:row.date,subjectId:row.subjectId,topicId:row.topicId,mode:row.mode}));
  }
  for(const m of workspace?.mistakes||[]){
    const date=timestampDate(m.created)||(dateOk(m.reviewDate)?m.reviewDate:'');
    if(!m.resolved&&inWindow(date,start,end))events.push(safeEvent('mistake_open',{date,subjectId:m.subjectId,topicId:m.topicId}));
  }
  for(const x of workspace?.route?.interventions||[]){
    if(!inWindow(x.date,start,end))continue;
    events.push(safeEvent('intervention',{date:x.date,subjectId:x.subjectId,topicId:x.topicId,mode:x.mode}));
  }
  for(const a of workspace?.assessments||[]){
    if(!inWindow(a.date,start,end))continue;
    events.push(safeEvent('mini_result',{date:a.date,subjectId:a.subjectId,topicId:a.topicId,total:a.total,correct:a.correct,wrong:a.wrong}));
  }
  for(const p of workspace?.plan||[]){
    if(p?.source!=='spaced_review'||![3,7].includes(p.reviewWave))continue;
    const due=reviewScheduledDate(p);
    if(!inWindow(due,start,end))continue;
    events.push(safeEvent('spaced_review',{date:due,subjectId:p.subjectId,topicId:p.topicId,wave:p.reviewWave}));
  }
  return events.sort((a,b)=>a.date.localeCompare(b.date)||a.type.localeCompare(b.type)).slice(-500);
}
function modeStats(workspace,start,end){
  const rows=(workspace?.route?.modeHistory||[]).filter(x=>inWindow(x.date,start,end)&&MODES.has(x.mode))
    .sort((a,b)=>a.date.localeCompare(b.date)||(a.created||0)-(b.created||0));
  const grouped=new Map();let repairToSteady=0,repairToProgress=0,repairExit=0,transitions=0;
  for(const row of rows){
    const key=(row.subjectId||'')+'|'+(row.topicId||'');
    const xs=grouped.get(key)||[],prev=xs.at(-1);
    if(prev&&prev.mode!==row.mode){
      transitions++;
      if(prev.mode==='repair'&&row.mode==='steady')repairToSteady++;
      if(prev.mode==='repair'&&row.mode==='progress')repairToProgress++;
      if(prev.mode==='repair'&&['steady','progress'].includes(row.mode))repairExit++;
    }
    xs.push(row);grouped.set(key,xs);
  }
  let bounces=0;
  for(const xs of grouped.values()){
    for(let i=2;i<xs.length;i++){
      const a=xs[i-2],b=xs[i-1],c=xs[i];
      if(a.mode===c.mode&&a.mode!==b.mode)bounces++;
    }
  }
  return {samples:rows.length,transitions,bounces,repairToSteady,repairToProgress,repairExit};
}
function completionStats(workspace,start,end){
  const plan=(workspace?.plan||[]).filter(p=>inWindow(p.date,start,end));
  const plannedIds=new Set(plan.map(p=>p.id)),completedIds=new Set();
  for(const l of workspace?.logs||[])if(l.sessionId&&plannedIds.has(l.sessionId)&&inWindow(l.date,start,end))completedIds.add(l.sessionId);
  for(const p of plan)if(p.done)completedIds.add(p.id);
  return {planned:plan.length,completed:completedIds.size,rate:ratio(completedIds.size,plan.length)};
}
function reviewBucket(due,logs){
  const completed=due.filter(p=>p.done||logs.has(p.id)).length,missed=due.length-completed;
  return {due:due.length,completed,missed,completionRate:ratio(completed,due.length),escapeRate:ratio(missed,due.length)};
}
function reviewStats(workspace,start,end){
  const logs=new Set((workspace?.logs||[]).filter(l=>l.sessionId).map(l=>l.sessionId));
  const due=(workspace?.plan||[]).filter(p=>p?.source==='spaced_review'&&[3,7].includes(p.reviewWave)&&inWindow(reviewScheduledDate(p),start,end));
  const all=reviewBucket(due,logs);
  return {...all,byWave:{3:reviewBucket(due.filter(p=>p.reviewWave===3),logs),7:reviewBucket(due.filter(p=>p.reviewWave===7),logs)}};
}
function mistakeTrend(workspace,start,end){
  const rows=workspace?.mistakes||[],resolvedRows=rows.filter(m=>m.resolved);
  const createdKnown=rows.filter(m=>!!timestampDate(m.created)).length,resolvedKnown=resolvedRows.filter(m=>!!timestampDate(m.resolvedAt)).length;
  const evidenceComplete=createdKnown===rows.length&&resolvedKnown===resolvedRows.length;
  const opened=rows.filter(m=>inWindow(timestampDate(m.created),start,end)).length;
  const resolved=rows.filter(m=>inWindow(timestampDate(m.resolvedAt),start,end)).length;
  const netChange=opened-resolved;
  const direction=!evidenceComplete?'insufficient_evidence':netChange>0?'rising':netChange<0?'falling':'flat';
  return {opened,resolved,netChange,direction,evidenceComplete,createdKnown,resolvedKnown,currentOpen:rows.filter(m=>!m.resolved).length};
}
function assessmentAfter(candidate,source){
  if(!dateOk(candidate?.date)||!dateOk(source?.date))return false;
  if(candidate.date!==source.date)return candidate.date>source.date;
  return (candidate.created||0)>(source.created||0);
}
function miniRepairRecoveryStats(workspace,start,end){
  const assessments=workspace?.assessments||[],byId=new Map(assessments.map(a=>[a.id,a])),seen=new Set();
  let episodes=0,recovered=0,stillRepair=0,insufficient=0;
  for(const task of workspace?.plan||[]){
    if(task?.source!=='mini_repair'||!task.sourceAssessmentId||seen.has(task.sourceAssessmentId))continue;
    const source=byId.get(task.sourceAssessmentId);
    if(!source||!inWindow(source.date,start,end))continue;
    seen.add(task.sourceAssessmentId);episodes++;
    const later=assessments.filter(a=>a.topicId===source.topicId&&a.subjectId===source.subjectId&&assessmentAfter(a,source))
      .sort((a,b)=>a.date.localeCompare(b.date)||(a.created||0)-(b.created||0));
    const latest=later.at(-1),mode=safeMode(latest?.routeDecision?.mode);
    if(!latest||!mode){insufficient++;continue;}
    if(mode==='repair')stillRepair++;else recovered++;
  }
  const measured=recovered+stillRepair;
  return {episodes,recoveredEvidence:recovered,stillRepairEvidence:stillRepair,insufficientEvidence:insufficient,recoveryRate:ratio(recovered,measured),observationalOnly:true};
}
function summarize(workspace,options={}){
  const start=options.startDate||'',end=options.cutoffDate||'',completion=completionStats(workspace,start,end),modes=modeStats(workspace,start,end),reviews=reviewStats(workspace,start,end);
  const mistakes=mistakeTrend(workspace,start,end),miniRepairRecovery=miniRepairRecoveryStats(workspace,start,end);
  const openMistakes=(workspace?.mistakes||[]).filter(m=>!m.resolved).length;
  const miniResults=(workspace?.assessments||[]).filter(a=>inWindow(a.date,start,end)).length;
  const interventions=(workspace?.route?.interventions||[]).filter(x=>inWindow(x.date,start,end)).length;
  return {
    schema:'calisma-rotasi-pilot-metrics-v1',
    version:METRICS_VERSION,
    window:{startDate:start,cutoffDate:end},
    completion,
    modes,
    reviews,
    openMistakes,
    mistakeTrend:mistakes,
    interventions,
    miniResults,
    miniRepairRecovery,
    privacy:{
      aggregateOnly:true,
      localFirst:true,
      optInRequired:true,
      containsName:false,
      containsPhone:false,
      containsEmail:false,
      containsNotes:false,
      containsQuestions:false,
      containsPhoto:false,
      containsFreeText:false,
      containsAiChat:false
    }
  };
}
root.RotaPilotMetrics={SCHEMA,METRICS_VERSION,EVENT_TYPES,safeEvent,collectEvents,summarize};
if(typeof module==='object')module.exports=root.RotaPilotMetrics;
})(typeof window!=='undefined'?window:globalThis);
