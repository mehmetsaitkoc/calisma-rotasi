(function(root){
'use strict';
const bank=root.RotaQuestionBank,plans=root.RotaAssessmentBlueprints,catalog=root.RotaCatalog;
const pool=bank.topicTests().flatMap(t=>t.questions),sectionExams=[],readiness=[];
for(const subject of catalog.subjects.filter(s=>s.exam==='kpss')){
 const blueprints=plans.sectionExams.filter(b=>b.subjectId===subject.id);
 const result=bank.assembleSeries(blueprints,pool.filter(q=>q.subjectId===subject.id));
 readiness.push({subjectId:subject.id,status:result.status,exams:result.exams.map(e=>({id:e.blueprintId,status:e.status,shortages:e.shortages}))});
 if(result.status!=='ready')continue;
 result.exams.forEach((paper,i)=>{
  const b=blueprints[i],counts=new Map();
  paper.questions.forEach(q=>counts.set(q.topicId,(counts.get(q.topicId)||0)+1));
  const blueprint=subject.topics.filter(t=>counts.has(t.id)).map(t=>[t.id,t.title,counts.get(t.id)]);
  // Interleave topics within a fixed editorial form; IDs remain stable across reloads.
  const questions=[...paper.questions].sort((a,b)=>a.questionNo-b.questionNo||a.topicId.localeCompare(b.topicId,'tr',{numeric:true})||a.id.localeCompare(b.id));
  sectionExams.push(Object.freeze({id:'kpss-bank-'+subject.id+'-branch-'+(i+1),exam:'kpss',subjectId:subject.id,title:subject.name+' · Branş Denemesi '+(i+1),eyebrow:b.level,level:b.level,minutes:Math.ceil(b.total*(subject.id==='k-ma'?1.8:subject.id==='k-tr'?1.5:1.1)),version:1,penalty:4,bankSchema:bank.SCHEMA,sourceKind:'original',blueprint,questions:Object.freeze(questions),reusePolicy:'Konu bankasından seçilir; aynı dersin üç denemesinde soru tekrarı yoktur.'}));
 });
}
// Keep the fixed forms available for historical review, but recheck their source
// sets when starting a new attempt, including after a tab crosses a review date.
function canServe(exam){
 if(!sectionExams.includes(exam))return false;
 const eligible=new Set(bank.topicTests().flatMap(t=>t.questions.map(q=>q.id)));
 return exam.questions.every(q=>eligible.has(q.id));
}
root.RotaKpssBankExams=Object.freeze({sectionExams:Object.freeze(sectionExams),readiness:Object.freeze(readiness),canServe,basis:plans.basis+' Branş denemeleri konu soru bankasından seçilir; aynı dersin üç denemesi kendi aralarında farklı sorular içerir.'});
})(typeof window!=='undefined'?window:globalThis);
