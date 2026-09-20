/* Denemeden rotaya: deterministic, source-linked analysis. No model or external API. */
(function(root){
'use strict';
const R=root.RotaCore||(typeof require==='function'?require('./core.js'):null);
const C=root.RotaCatalog||(typeof require==='function'?require('./catalog.js'):null);
function sortedExams(w,type){return w.exams.map((x,i)=>({x,i})).filter(v=>v.x.type===type).sort((a,b)=>a.x.date.localeCompare(b.x.date)||a.i-b.i).map(v=>v.x);}
function subjectIds(x,label){return C.PART_SUBJECTS[x.type]?.[label]||C.subjects.filter(s=>s.exam===C.TYPES[x.type]?.exam).map(s=>s.id);}
function examRouteSignals(w,x,rows){
 return rows.map(row=>{
  const ratio=Math.max(0,Math.min(1,row.net/Math.max(1,row.total))),delta=Number.isFinite(row.delta)?row.delta:null,ids=subjectIds(x,row.label);
  const severity=ratio<.42?'critical':ratio<.62?'weak':delta!==null&&delta<=-4?'decline':'steady';
  const priority=severity==='critical'?90:severity==='weak'?78:severity==='decline'?70:45;
  const reason=severity==='critical'?row.label+' testinde net oranı çok düşük kaldı.':severity==='weak'?row.label+' testinde net oranı hedef çalışma için zayıf sinyal veriyor.':severity==='decline'?row.label+' önceki denemeye göre '+Math.abs(Math.round(delta*100)/100)+' net geriledi.':'Bu testte belirgin rota müdahalesi gerektiren sinyal yok.';
  return {partLabel:row.label,ratio,delta,severity,priority,subjectIds:ids,reason};
 });
}
function analyze(w,id){
 const x=w.exams.find(x=>x.id===id);if(!x)return null;
 const history=sortedExams(w,x.type),index=history.findIndex(y=>y.id===x.id),previous=index>0?history[index-1]:null;
 const rows=x.parts.map((p,i)=>{
  const n=R.calcNet([p],x.penalty),prior=previous?.parts.find(q=>q.label===p.label);
  const unique=x.parts.filter(q=>q.label===p.label).length===1&&(!previous||previous.parts.filter(q=>q.label===p.label).length===1);
  let reason='';
  if(!previous)reason='Önceki deneme yok';
  else if(!prior)reason='Önceki test yok';
  else if(!unique)reason='Yinelenen test adı';
  else if(previous.penalty!==x.penalty)reason='Net kuralları farklı';
  else if(prior.total!==p.total)reason='Soru sayıları farklı';
  const before=reason?null:R.calcNet([prior],previous.penalty).net;
  return {index:i,label:p.label,total:p.total,correct:n.correct,wrong:n.wrong,blank:n.blank,net:n.net,previousNet:before,delta:before===null?null:n.net-before,reason};
 });
 return {exam:x,previous,rows,signals:examRouteSignals(w,x,rows),notes:w.mistakes.filter(m=>m.examId===id)};
}
function examSignalSubjectScore(w,subjectId){
 const level=R.planSubjectLevel?R.planSubjectLevel(w,subjectId):2,priority=w.settings.priorities.includes(subjectId)?1:0,last=R.planLatestEvidenceDate?R.planLatestEvidenceDate(w,subjectId):'';
 return (3-level)*20+priority*14+(last?0:6);
}
function examSignalNextTopic(w,exam,subjectId){
 const open=new Set((w.plan||[]).filter(p=>!p.done).map(p=>p.topicId)),xs=R.allTopics(w,exam).filter(t=>t.subjectId===subjectId&&(w.topicState[t.id]?.status||0)!==2&&!open.has(t.id));
 return xs.find(t=>(w.topicState[t.id]?.status||0)===1)||xs[0]||null;
}
function applyExamSignals(w,id,today=R.iso()){
 const analysis=analyze(w,id);if(!analysis)return {added:0,signals:[]};
 const x=analysis.exam,exam=C.TYPES[x.type]?.exam||'',prefix='exam-signal:'+id+':';
 w.plan=w.plan.filter(p=>p.done||!String(p.routeKey||'').startsWith(prefix));
 const candidates=analysis.signals.filter(s=>s.severity!=='steady').sort((a,b)=>b.priority-a.priority),chosen=new Set(),added=[];
 for(const signal of candidates){
  const ids=signal.subjectIds.filter(subjectId=>C.subjects.some(s=>s.id===subjectId&&s.exam===exam)).filter(subjectId=>!chosen.has(subjectId)).sort((a,b)=>examSignalSubjectScore(w,b)-examSignalSubjectScore(w,a));
  let subjectId='',topic=null;
  for(const id of ids){const next=examSignalNextTopic(w,exam,id);if(next){subjectId=id;topic=next;break;}}
  if(!subjectId||!topic)continue;
  const level=R.planSubjectLevel?R.planSubjectLevel(w,subjectId):2,minutes=Math.max(20,Math.min(w.settings.dailyMinutes-5,signal.severity==='critical'?35:signal.severity==='weak'?30:25)),date=nextReviewDate(w,today,minutes),questions=Math.max(10,Math.min(24,(level<=1?18:14)+(signal.severity==='critical'?4:0))),sub=C.subjects.find(s=>s.id===subjectId),shared=signal.subjectIds.length>1;
  const reason='Son '+(C.TYPES[x.type]?.label||x.type)+' denemesinde '+signal.partLabel+' '+(signal.severity==='decline'?'geriledi':'zayıf kaldı')+'. '+(shared?'Bu test birden fazla dersi kapsadığı için, profilindeki ihtiyaç ve önceliklere göre '+sub.name+' dersinin sıradaki tamamlanmamış konusu seçildi.':sub.name+' için sıradaki tamamlanmamış konu kısa kontrol görevi olarak öne alındı.');
  const task={id:R.uid(),date,subjectId,topicId:topic.id,title:('Deneme sonrası · '+topic.title).slice(0,180),minutes,done:false,kind:'route',source:'exam',priority:signal.priority,reason,routeKey:prefix+subjectId,targetQuestions:questions,taskGoal:sub.name+' · '+topic.title+': yaklaşık '+questions+' soru/uygulama çöz, yanlışlarını ayır ve 5 dk kısa analiz yap.'};
  w.plan.push(task);added.push(task);chosen.add(subjectId);if(added.length>=2)break;
 }
 w.plan.sort((a,b)=>a.date.localeCompare(b.date)||((b.priority||0)-(a.priority||0)));
 return {added:added.length,signals:analysis.signals,tasks:added};
}
function activeReview(w,mistakeId){return w.plan.find(p=>p.sourceMistakeId===mistakeId&&!p.done)||null;}
function dayLoad(w,date,extra=0){const sessions=w.plan.filter(p=>p.date===date);const existing=sessions.reduce((sum,p)=>sum+p.minutes+5,0);return {existing,total:existing+(extra?extra+5:0),limit:w.settings.dailyMinutes,count:sessions.length,workingDay:w.settings.days.includes(new Date(date+'T12:00:00').getDay())};}
function nextReviewDate(w,start=R.iso(),minutes=25){
 for(let i=0;i<28;i++){const date=R.dayAdd(start,i),load=dayLoad(w,date,minutes);if(load.workingDay&&load.total<=load.limit)return date;}
 return start;
}
function makeReview(w,mistakeId,date,minutes,today=R.iso()){
 const m=w.mistakes.find(m=>m.id===mistakeId);if(!m)throw Error('Yanlış notu bulunamadı.');
 if(m.resolved)throw Error('Bu not öğrenildi olarak işaretli. Önce tekrar listesine al.');
 if(!R.validDate(date)||date<today)throw Error('Tekrar tarihi bugün veya sonraki bir gün olmalı.');
 if(![25,50].includes(minutes))throw Error('25 veya 50 dakikalık bir oturum seç.');
 if(activeReview(w,mistakeId))throw Error('Bu not için zaten bekleyen bir tekrar oturumu var.');
 return {id:R.uid(),date,subjectId:m.subjectId,topicId:m.topicId||'review-'+m.id,title:('Tekrar · '+m.title).slice(0,180),minutes,done:false,kind:'review',source:'mistake',sourceMistakeId:m.id,priority:88,reason:'Yanlış defterindeki bu konu için onayladığın tekrar görevi. Tamamlandığında gerçek çalışma tarihi 3/7 günlük kalıcılık kontrolünün başlangıcı olur.',routeKey:'mistake:'+m.id};
}
root.RotaAnalysis={sortedExams,analyze,examRouteSignals,applyExamSignals,subjectIds,activeReview,dayLoad,nextReviewDate,makeReview};
if(typeof module==='object')module.exports=root.RotaAnalysis;
})(typeof window!=='undefined'?window:globalThis);
