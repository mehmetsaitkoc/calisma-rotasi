(function(root){
'use strict';
// Pure KPSS evidence adapter. Clock, workspace and approved content are inputs.
const VERSION=1;
const ERROR_LABELS=Object.freeze({knowledge:'Bilgi eksiği',concept:'Kavram karışıklığı',process:'İşlem hatası',interpretation:'Yanlış yorumlama',chronology:'Kronoloji karışıklığı',attention:'Dikkat',time:'Zaman yönetimi',method:'Yöntem seçimi',other:'Nedeni belirtilmedi'});
const ERROR_ALIASES={speed:'time',strategy:'method',reading:'interpretation',recall:'knowledge'};
const text=(v,n=180)=>typeof v==='string'?v.trim().slice(0,n):'';
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
const dayAdd=(d,n)=>{const x=new Date(d+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10);};
const timestampDate=v=>finite(v)&&v>0&&Number.isFinite(new Date(v).getTime())?new Date(v).toISOString().slice(0,10):'';
const count=v=>Number.isInteger(v)&&v>=0?v:0;
const order=(a,b)=>a.date.localeCompare(b.date)||(a.created||0)-(b.created||0)||a.id.localeCompare(b.id);
function scopeOf(space,topic){
 const t=typeof topic==='string'?{topicId:topic}:topic||{};
 const topicId=text(t.topicId||t.id,120),subjectId=text(t.subjectId||topicId.replace(/-\d+$/,''),120);
 return {topicId,subjectId,valid:(space?.exam==='kpss'||space?.settings?.track==='lisans')&&/^k-(?:tr|ma|ta|co|va|gu)$/.test(subjectId)&&!!topicId};
}
function topicEvidence(space,topic,asOf){
 const scope=scopeOf(space,topic);if(!scope.valid||!date(asOf))return [];
 const grouped=new Map(),plans=new Map((space.plan||[]).map(p=>[p.id,p]));
 for(const a of space.assessments||[]){
  if(a.subjectId!==scope.subjectId||!date(a.date)||a.date>asOf)continue;
  const row=a.topicId===scope.topicId?a:(a.topicBreakdown||[]).find(x=>x.topicId===scope.topicId);
  if(!row)continue;
  const correct=count(row.correct),wrong=count(row.wrong),blank=count(row.blank),total=correct+wrong+blank;
  if(!total)continue;
  const sample={id:text(a.id,120),date:a.date,created:finite(a.created)?a.created:0,correct,wrong,blank,total,accuracy:correct/total,kind:a.source==='recovery'?'recovery':'assessment',sourceId:a.id,questionEvidence:(a.questionEvidence||[]).filter(q=>q.topicId===scope.topicId&&q.subjectId===scope.subjectId),recovery:a.source==='recovery'?a.recovery:null};
  const key=(a.miniId||a.sectionId||a.id)+'|'+a.date,old=grouped.get(key);
  if(!old||order(old,sample)<=0)grouped.set(key,sample);
 }
 for(const l of space.logs||[]){
  const p=plans.get(l.sessionId);if(!p||p.topicId!==scope.topicId||p.subjectId!==scope.subjectId||!date(l.date)||l.date>asOf||!Number.isInteger(l.correct)||!Number.isInteger(l.wrong))continue;
  const correct=count(l.correct),wrong=count(l.wrong),total=Math.max(correct+wrong,count(l.questions)),blank=total-correct-wrong;
  if(total<3)continue;
  const sample={id:'log-'+text(l.id,120),date:l.date,created:finite(l.updated)?l.updated:finite(l.created)?l.created:0,correct,wrong,blank,total,accuracy:correct/total,kind:'log',sourceId:l.id,questionEvidence:[],difficulty:l.difficulty||'',outcome:l.outcome||''};
  const key='log|'+l.sessionId+'|'+l.date,old=grouped.get(key);if(!old||order(old,sample)<=0)grouped.set(key,sample);
 }
 return [...grouped.values()].sort(order).slice(-80);
}
function errorPatterns(space,scope,samples,asOf){
 const map=new Map(),since=dayAdd(asOf,-45);
 function add(type,source,id,questionId,subtopic,skill,label){
  type=ERROR_ALIASES[type]||type;if(!ERROR_LABELS[type])type='other';
  const key=[type,source,subtopic||'',skill||''].join('|'),p=map.get(key)||{type,label:ERROR_LABELS[type],source,inferred:source==='inferred',subtopic:subtopic||'',skill:skill||'',count:0,evidenceIds:[],questionIds:[],explanation:label||''};
  p.count++;if(!p.evidenceIds.includes(id))p.evidenceIds.push(id);if(questionId&&!p.questionIds.includes(questionId))p.questionIds.push(questionId);map.set(key,p);
 }
 for(const m of space.mistakes||[]){
  if(m.subjectId!==scope.subjectId||m.topicId!==scope.topicId||m.resolved)continue;
  const d=timestampDate(m.created)||m.reviewDate;
  if(!date(d)||d<since||d>asOf)continue;
  const question=(space.assessments||[]).find(a=>a.id===m.sourceAssessmentId)?.questionEvidence?.find(q=>q.questionId===m.questionId);
  add(m.errorType,'reported','mistake-'+m.id,m.questionId||'',question?.subtopic||'',question?.skill||'','Öğrencinin yanlış kaydında belirttiği neden.');
 }
 for(const s of samples){
  if(s.difficulty)add(s.difficulty,'reported',s.id,'','','','Çalışma sonu geri bildirimi.');
  for(const q of s.questionEvidence){
   if(q.status!=='wrong')continue;
   const type=({knowledge:'knowledge',concept:'concept',calculation:'process',chronology:'chronology',interpretation:'interpretation',inference:'interpretation',paragraph:'interpretation',table:'interpretation',graph:'interpretation',map:'interpretation'})[q.skill||q.questionType];
   if(type)add(type,'inferred',s.id,q.questionId,q.subtopic,q.skill,'Yanlış cevaplanan soru türünden çıkarım; gerçek hata nedeni doğrulanmadı.');
  }
 }
 return [...map.values()].map(p=>({...p,repeated:p.evidenceIds.length>=2,confidence:p.source==='reported'?'reported':p.evidenceIds.length>=2?'moderate':'low',evidenceIds:p.evidenceIds.slice(-12),questionIds:p.questionIds.slice(-12)})).sort((a,b)=>Number(b.repeated)-Number(a.repeated)||b.count-a.count||a.type.localeCompare(b.type)).slice(0,16);
}
function snapshot(space,topic,asOf){
 const scope=scopeOf(space,topic),all=topicEvidence(space,topic,asOf),since=date(asOf)?dayAdd(asOf,-28):'',samples=all.filter(s=>s.date>=since),counts={correct:0,wrong:0,blank:0,total:0,samples:samples.length,days:new Set(samples.map(s=>s.date)).size};
 let weighted=0,weight=0,mastery=50;const patterns=new Map();
 for(let i=0;i<samples.length;i++){
  const s=samples[i],power=Math.min(12,s.total)*(s.kind==='recovery'?(s.recovery?.practice ? .30 : .65):1),fresh=1/(1+(samples.length-1-i)*.25);weighted+=s.accuracy*power*fresh;weight+=power*fresh;
  mastery+=(s.accuracy*100-mastery)*Math.min(.22,power/(40+power));
  for(const k of ['correct','wrong','blank','total'])counts[k]+=s[k];
  for(const q of s.questionEvidence){
   const key=q.learningObjectiveId||q.subtopic||q.skill;if(!key)continue;
   const p=patterns.get(key)||{key,label:q.learningObjective||q.subtopic||q.skill,subtopic:q.subtopic||'',skill:q.skill||'',correct:0,wrong:0,blank:0,total:0,evidenceIds:[],questionIds:[]};
   if(!['correct','wrong','blank'].includes(q.status))continue;p[q.status]++;p.total++;if(!p.evidenceIds.includes(s.id))p.evidenceIds.push(s.id);if(!p.questionIds.includes(q.questionId))p.questionIds.push(q.questionId);patterns.set(key,p);
  }
 }
 const accuracy=weight?weighted/weight:null,errors=scope.valid&&date(asOf)?errorPatterns(space,scope,samples,asOf):[],openMistakes=(space?.mistakes||[]).filter(m=>!m.resolved&&m.subjectId===scope.subjectId&&m.topicId===scope.topicId);
 const latest=samples.at(-1)||null,recoveries=samples.filter(s=>s.kind==='recovery'),lastRecovery=recoveries.at(-1)||null;
 const successful=!!(lastRecovery&&lastRecovery.total>=3&&lastRecovery.accuracy>=.8&&lastRecovery.blank===0),later=lastRecovery?samples.filter(s=>order(s,lastRecovery)>0):[];
 // A successful check supersedes prior risk for routing, without changing the
 // student's mistake history. Only dated new/reopened mistakes can reopen it.
 const newerMistakes=lastRecovery?openMistakes.filter(m=>{const at=Math.max(timestampDate(m.created)?m.created:0,timestampDate(m.reopenedAt)?m.reopenedAt:0),d=timestampDate(at);return !!d&&(d>lastRecovery.date||d===lastRecovery.date&&at>lastRecovery.created);}):openMistakes;
 const newerRisk=later.some(s=>s.accuracy<.65)||newerMistakes.length>0,resolved=successful&&!newerRisk;
 const failed=!!lastRecovery&&!successful&&!later.some(s=>s.accuracy>=.8),repeated=errors.some(p=>p.repeated),eligible=scope.valid&&!resolved&&((samples.length>=2&&counts.total>=10&&accuracy<.65)||(repeated&&counts.total>=6&&accuracy<.72)||failed);
 const confidence=samples.length?Math.min(samples.length===1?35:samples.length===2?55:90,Math.round(samples.length*12+Math.sqrt(counts.total)*5)):0;
 let mode=eligible?'repair':samples.length>=2&&counts.total>=16&&accuracy>=.8&&!openMistakes.length?'progress':samples.length?'steady':'collect';if(resolved)mode='steady';
 const ranked=[...patterns.values()].map(p=>({...p,accuracy:p.correct/p.total,repeated:p.evidenceIds.length>=2,evidenceIds:p.evidenceIds.slice(-12),questionIds:p.questionIds.slice(-12)})).filter(p=>p.wrong+p.blank>0).sort((a,b)=>(b.wrong+b.blank)-(a.wrong+a.blank)||a.key.localeCompare(b.key)).slice(0,12);
 return {version:VERSION,subjectId:scope.subjectId,topicId:scope.topicId,date:asOf,mode,mastery:samples.length?Math.round(mastery):null,confidence,accuracy,counts,latestDate:all.at(-1)?.date||'',evidenceQuality:{known:samples.length>0,samples:counts.samples,days:counts.days,confidence,singleResult:samples.length===1,inferredErrors:errors.some(p=>p.inferred)},patterns:ranked,errorPatterns:errors,recovery:{eligible,resolved,failed,provisional:resolved&&!!lastRecovery.recovery?.practice,reason:resolved?(lastRecovery.recovery?.practice?'Pekiştirme başarılı; bağımsız yeni ölçüm değil. Geçici DENGE, 3/7 günlük kalıcılık kontrolü gerektirir.':'Kısa doğrulama başarılı; aynı onarımı yeniden açmadan kalıcılığı izle.'):eligible?'Birden fazla performans veya tekrar eden hata kanıtı kısa konu onarımını destekliyor.':'Konu kurtarmayı otomatik açmak için yeterli tekrarlayan risk yok.',evidenceIds:samples.filter(s=>s.kind!=='recovery'&&s.accuracy<.72).map(s=>s.sourceId).slice(-8),latestAssessmentId:lastRecovery?.sourceId||'',completedDate:resolved?lastRecovery.date:'',focusKey:ranked[0]?.key||scope.topicId},samples};
}
function recoveryPlan(state,{questionPool=[],completedQuestionIds=[],excludedQuestionIds=[],limit=5}={}){
 const base={version:VERSION,subjectId:state.subjectId,topicId:state.topicId,focus:state.patterns?.[0]||null,focusKey:state.recovery?.focusKey||state.topicId,sourceAssessmentIds:state.recovery?.evidenceIds||[],reason:state.recovery?.reason||'',questions:[]};
 if(!state.recovery?.eligible)return {...base,status:'not-needed'};
 const used=new Set(completedQuestionIds),lastSeen=new Map(completedQuestionIds.map((id,i)=>[id,i])),excluded=new Set(excludedQuestionIds),seen=new Set(),pool=questionPool.filter(q=>{
  if(!q||excluded.has(q.id)||q.subjectId!==state.subjectId||q.topicId!==state.topicId||q.qualityStatus!=='approved'||!Array.isArray(q.options)||q.options.length!==5||!Number.isInteger(q.answer)||q.answer<0||q.answer>4||!q.explanation||!q.wrongAnswerNotes||seen.has(q.id))return false;seen.add(q.id);return true;
 });
 const focus=base.focusKey,score=q=>(used.has(q.id)?-10:0)+(q.learningObjectiveId===focus?6:q.subtopic===base.focus?.subtopic?3:0)+(q.skill===base.focus?.skill?2:0)+(q.difficulty==='hard'?-1:1);
 pool.sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id));
 const fresh=pool.filter(q=>!used.has(q.id));
 if(pool.length<3)return {...base,status:'needs-content',reason:'Aynı konuda örnek dışında en az üç onaylı kontrol sorusu gerekiyor.'};
 const candidates=fresh.length>=3?fresh:fresh.concat(pool.filter(q=>used.has(q.id)).sort((a,b)=>(lastSeen.get(a.id)||0)-(lastSeen.get(b.id)||0)||score(b)-score(a)||a.id.localeCompare(b.id)));
 const questions=candidates.slice(0,Math.max(3,Math.min(5,count(limit)||5))),reusedQuestionIds=questions.filter(q=>used.has(q.id)).map(q=>q.id);
 return {...base,status:'ready',questions,reusedQuestionIds,practice:reusedQuestionIds.length>0,minutes:Math.max(2,Math.ceil(questions.length*.7)),contentSource:'reviewed-question-explanations'};
}
const EVIDENCE_FIELDS=['subjectId','topicId','lesson','topic','subtopic','learningObjectiveId','learningObjective','questionType','skill','difficulty','commonMistake'];
function scoreRecovery(plan,answers,{id,date:day,created=0,minutes=3}={}){
 if(plan?.status!=='ready'||plan.questions.length<3||plan.questions.length>5||!text(id,120)||!date(day)||!Array.isArray(answers)||answers.length!==plan.questions.length)throw Error('Konu kurtarma ölçümü geçersiz.');
 const questionEvidence=plan.questions.map((q,i)=>{
  const picked=answers[i];if(!Number.isInteger(picked)||picked< -1||picked>4)throw Error('Konu kurtarma cevabı geçersiz.');
  const e={questionId:q.id,questionVersion:q.questionVersion||1,picked,answer:q.answer,status:picked<0?'blank':picked===q.answer?'correct':'wrong'};
  for(const key of EVIDENCE_FIELDS)e[key]=text(q[key],key==='learningObjective'||key==='commonMistake'?500:120);return e;
 });
 const total=questionEvidence.length,correct=questionEvidence.filter(q=>q.status==='correct').length,wrong=questionEvidence.filter(q=>q.status==='wrong').length,blank=total-correct-wrong;
 const skills=new Map();for(const q of questionEvidence){const s=skills.get(q.skill)||{skill:q.skill,total:0,correct:0,wrong:0,blank:0};s.total++;s[q.status]++;skills.set(q.skill,s);}
 const reusedQuestionIds=(plan.reusedQuestionIds||[]).filter(id=>questionEvidence.some(q=>q.questionId===id));
 return {id,miniId:'recovery:'+plan.topicId,version:1,date:day,subjectId:plan.subjectId,topicId:plan.topicId,title:'Konu kurtarma · '+(plan.focus?.label||plan.questions[0].topic),source:'recovery',total,correct,wrong,blank,minutes:Math.max(1,Math.min(240,Math.round(minutes)||3)),answers:[...answers],questionEvidence,skillBreakdown:[...skills.values()],weakSkills:[...skills.values()].filter(s=>s.wrong+s.blank).map(s=>s.skill),created:finite(created)?created:0,recovery:{version:VERSION,focusKey:plan.focusKey,sourceAssessmentIds:plan.sourceAssessmentIds.slice(-8),successful:correct/total>=.8&&blank===0,...(reusedQuestionIds.length?{practice:true,reusedQuestionIds}: {})}};
}
function cleanRecovery(raw,assessment){
 if(assessment?.source!=='recovery'||!raw||raw.version!==VERSION||!assessment.topicId||assessment.miniId!=='recovery:'+assessment.topicId||!Number.isInteger(assessment.total)||assessment.total<3||assessment.total>5||![assessment.correct,assessment.wrong,assessment.blank].every(v=>Number.isInteger(v)&&v>=0)||assessment.correct+assessment.wrong+assessment.blank!==assessment.total)return null;
 const reusedQuestionIds=Array.isArray(raw.reusedQuestionIds)?[...new Set(raw.reusedQuestionIds.filter(id=>(assessment.questionEvidence||[]).some(q=>q.questionId===id)))].slice(0,5):[];
 return {version:VERSION,focusKey:text(raw.focusKey,180)||assessment.topicId,sourceAssessmentIds:Array.isArray(raw.sourceAssessmentIds)?[...new Set(raw.sourceAssessmentIds.filter(x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,120}$/.test(x)))].slice(-8):[],successful:assessment.correct/assessment.total>=.8&&assessment.blank===0,...(reusedQuestionIds.length?{practice:true,reusedQuestionIds}: {})};
}
root.RotaStudentRecovery=Object.freeze({VERSION,ERROR_LABELS,topicEvidence,snapshot,recoveryPlan,scoreRecovery,cleanRecovery});
if(typeof module==='object')module.exports=root.RotaStudentRecovery;
})(typeof window!=='undefined'?window:globalThis);
