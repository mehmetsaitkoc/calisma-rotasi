(function(root){
'use strict';

const VERSION=1;

function validMonth(value){
  return typeof value==='string'&&/^\d{4}-\d{2}$/.test(value);
}
function monthOf(date){
  return typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)?date.slice(0,7):'';
}
function addMonths(month,delta){
  if(!validMonth(month))throw new Error('Geçerli bir ay gerekli.');
  const [year,mon]=month.split('-').map(Number);
  const d=new Date(Date.UTC(year,mon-1+Number(delta||0),1));
  return d.toISOString().slice(0,7);
}
function monthsBack(endMonth,count=6){
  const n=Math.max(1,Math.min(24,Number(count)||6));
  return Array.from({length:n},(_,i)=>addMonths(endMonth,i-(n-1)));
}
function safeNumber(value){
  return Number.isFinite(Number(value))?Number(value):0;
}
function sum(items,pick){
  return (items||[]).reduce((total,item)=>total+safeNumber(pick(item)),0);
}
function examSignature(record){
  return JSON.stringify({
    type:String(record?.type||''),
    penalty:safeNumber(record?.penalty),
    parts:(record?.parts||[]).map(part=>[String(part?.label||''),safeNumber(part?.total)])
  });
}
function calcNet(record){
  const penalty=safeNumber(record?.penalty);
  const parts=Array.isArray(record?.parts)?record.parts:[];
  let correct=0,wrong=0,total=0;
  for(const part of parts){
    correct+=safeNumber(part?.correct);
    wrong+=safeNumber(part?.wrong);
    total+=safeNumber(part?.total);
  }
  const net=correct-(penalty>0?wrong/penalty:0);
  return {correct,wrong,total,blank:Math.max(0,total-correct-wrong),net};
}
function comparableExam(a,b){
  return !!a&&!!b&&examSignature(a)===examSignature(b);
}
function latestBefore(records,month,type){
  return [...(records||[])].filter(x=>x?.type===type&&monthOf(x.date)&&monthOf(x.date)<month).sort((a,b)=>String(a.date).localeCompare(String(b.date))).at(-1)||null;
}
function monthWeek(date){
  const day=Number(String(date||'').slice(8,10));
  if(!Number.isInteger(day)||day<1)return -1;
  return Math.min(3,Math.floor((day-1)/7));
}
function metricDelta(current,previous,key,currentKnown=true,previousKnown=true){
  const now=safeNumber(current?.[key]),before=safeNumber(previous?.[key]),hasCurrent=currentKnown===true,hasPrevious=previousKnown===true,comparable=hasCurrent&&hasPrevious;
  const reason=comparable?'':(!hasCurrent&&!hasPrevious?'missing_both':(!hasCurrent?'missing_current':'missing_previous'));
  return {value:comparable?now-before:null,current:now,previous:before,known:comparable,reason};
}
function aggregateMonth(space,month,options={}){
  if(!validMonth(month))throw new Error('Geçerli bir rapor ayı gerekli.');
  const today=typeof options.today==='string'?options.today:'';
  const currentMonth=monthOf(today);
  const logs=(space?.logs||[]).filter(x=>monthOf(x.date)===month);
  const exams=(space?.exams||[]).filter(x=>monthOf(x.date)===month).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const planAll=(space?.plan||[]).filter(x=>monthOf(x.date)===month);
  const duePlan=planAll.filter(x=>!today||month<currentMonth||(month===currentMonth&&String(x.date)<=today));
  const minutes=sum(logs,x=>x.minutes);
  const questions=sum(logs,x=>x.questions);
  const activeDays=new Set(logs.map(x=>x.date).filter(Boolean)).size;
  const donePlan=duePlan.filter(x=>x.done).length;
  const subjectMap=new Map();
  for(const log of logs){
    const id=String(log?.subjectId||'unknown');
    const row=subjectMap.get(id)||{subjectId:id,minutes:0,questions:0,logs:0,share:0};
    row.minutes+=safeNumber(log?.minutes);
    row.questions+=safeNumber(log?.questions);
    row.logs+=1;
    subjectMap.set(id,row);
  }
  const subjects=[...subjectMap.values()].sort((a,b)=>b.minutes-a.minutes||b.questions-a.questions);
  for(const row of subjects)row.share=minutes>0?row.minutes/minutes:0;

  const examTypes=[...new Set(exams.map(x=>x.type).filter(Boolean))].map(type=>{
    const records=exams.filter(x=>x.type===type);
    const latest=records.at(-1)||null;
    const previous=latestBefore(space?.exams,month,type);
    const comparable=!!previous&&comparableExam(latest,previous);
    const nets=records.map(calcNet);
    const sameShape=records.every(x=>!records[0]||comparableExam(records[0],x));
    return {
      type,
      count:records.length,
      latestDate:latest?.date||'',
      latestNet:latest?calcNet(latest).net:null,
      averageNet:sameShape&&nets.length?nets.reduce((a,b)=>a+b.net,0)/nets.length:null,
      previousDate:previous?.date||'',
      previousNet:previous?calcNet(previous).net:null,
      delta:comparable?calcNet(latest).net-calcNet(previous).net:null,
      comparable,
      comparisonReason:previous?(comparable?'same_shape':'different_shape'):'no_previous'
    };
  });

  const weeks=Array.from({length:4},(_,index)=>({index,label:index<3?((index*7+1)+'–'+(index*7+7)):'22–son',minutes:0,questions:0,activeDays:new Set()}));
  for(const log of logs){
    const index=monthWeek(log.date);
    if(index<0)continue;
    weeks[index].minutes+=safeNumber(log.minutes);
    weeks[index].questions+=safeNumber(log.questions);
    weeks[index].activeDays.add(log.date);
  }
  const weekly=weeks.map(x=>({...x,activeDays:x.activeDays.size}));

  return {
    month,
    partial:!!today&&month===currentMonth,
    minutes,
    questions,
    activeDays,
    logCount:logs.length,
    examCount:exams.length,
    plan:{scheduled:duePlan.length,done:donePlan,completionRate:duePlan.length?donePlan/duePlan.length:null,future:Math.max(0,planAll.length-duePlan.length)},
    subjects,
    examTypes,
    weekly
  };
}
function compareMonth(space,month,options={}){
  const current=aggregateMonth(space,month,options);
  const previous=aggregateMonth(space,addMonths(month,-1),options);
  return {
    current,
    previous,
    deltas:{
      minutes:metricDelta(current,previous,'minutes',current.logCount>0,previous.logCount>0),
      questions:metricDelta(current,previous,'questions',current.logCount>0,previous.logCount>0),
      activeDays:metricDelta(current,previous,'activeDays',current.logCount>0,previous.logCount>0),
      examCount:metricDelta(current,previous,'examCount',current.examCount>0,previous.examCount>0),
      planCompletion:{
        known:current.plan.completionRate!==null&&previous.plan.completionRate!==null,
        value:current.plan.completionRate!==null&&previous.plan.completionRate!==null?current.plan.completionRate-previous.plan.completionRate:null,
        current:current.plan.completionRate,
        previous:previous.plan.completionRate
      }
    }
  };
}
function longTerm(space,endMonth,options={}){
  const months=monthsBack(endMonth,options.months||6);
  const series=months.map(month=>aggregateMonth(space,month,options));
  const startMonth=months[0];
  const periodExams=(space?.exams||[]).filter(x=>{
    const m=monthOf(x.date);
    return m&&m>=startMonth&&m<=endMonth;
  }).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const examTypes=[...new Set(periodExams.map(x=>x.type).filter(Boolean))].map(type=>{
    const records=periodExams.filter(x=>x.type===type);
    const first=records[0]||null,latest=records.at(-1)||null,comparable=records.length>=2&&comparableExam(first,latest);
    return {
      type,
      count:records.length,
      firstDate:first?.date||'',
      latestDate:latest?.date||'',
      firstNet:first?calcNet(first).net:null,
      latestNet:latest?calcNet(latest).net:null,
      delta:comparable?calcNet(latest).net-calcNet(first).net:null,
      comparable,
      records:records.map(x=>({date:x.date,net:calcNet(x).net,signature:examSignature(x)}))
    };
  });
  const subjectMap=new Map();
  for(const row of series){
    for(const subject of row.subjects){
      const item=subjectMap.get(subject.subjectId)||{subjectId:subject.subjectId,minutes:0,questions:0,activeMonths:0};
      item.minutes+=subject.minutes;
      item.questions+=subject.questions;
      if(subject.minutes||subject.questions)item.activeMonths+=1;
      subjectMap.set(subject.subjectId,item);
    }
  }
  const subjects=[...subjectMap.values()].sort((a,b)=>b.minutes-a.minutes||b.questions-a.questions);
  const evidence={
    monthsWithLogs:series.filter(x=>x.logCount>0).length,
    monthsWithPlan:series.filter(x=>x.plan.scheduled>0).length,
    monthsWithExams:series.filter(x=>x.examCount>0).length,
    totalLogs:series.reduce((n,x)=>n+x.logCount,0),
    totalExams:series.reduce((n,x)=>n+x.examCount,0)
  };
  evidence.studyTrendReady=evidence.monthsWithLogs>=2;
  evidence.planTrendReady=evidence.monthsWithPlan>=2;
  evidence.examTrendReady=examTypes.some(x=>x.count>=2&&x.comparable);

  return {
    startMonth,
    endMonth,
    months,
    series,
    subjects,
    examTypes,
    evidence,
    totals:{
      minutes:series.reduce((n,x)=>n+x.minutes,0),
      questions:series.reduce((n,x)=>n+x.questions,0),
      activeDays:series.reduce((n,x)=>n+x.activeDays,0),
      exams:series.reduce((n,x)=>n+x.examCount,0)
    }
  };
}

root.RotaReportAnalytics={
  VERSION,
  validMonth,
  monthOf,
  addMonths,
  monthsBack,
  calcNet,
  examSignature,
  comparableExam,
  aggregateMonth,
  compareMonth,
  longTerm
};
if(typeof module==='object')module.exports=root.RotaReportAnalytics;
})(typeof window!=='undefined'?window:globalThis);
