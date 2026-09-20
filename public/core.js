(function(root){
'use strict';
const C=root.RotaCatalog||(typeof require==='function'?require('./catalog.js'):null);
const WS=root.RotaWorkspaceSchema||(typeof require==='function'?require('./workspace-schema.js'):null);
const uid=()=> (root.crypto&&root.crypto.randomUUID?root.crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
const iso=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function dayAdd(date,days){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+days);return iso(d);}
function validDate(v){return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(new Date(v+'T12:00:00'))&&iso(new Date(v+'T12:00:00'))===v;}
function workspace(exam){return WS.create(exam);}
const fresh=()=>({version:1,activeExam:null,workspaces:{kpss:workspace('kpss'),yks:workspace('yks')}});
function courses(exam,track){return C.subjects.filter(s=>s.exam===exam&&(!s.tracks.length||s.tracks.includes(track)));}
function allTopics(w,exam){return courses(exam,w.settings.track).flatMap(s=>s.topics).concat(w.customTopics.filter(t=>courses(exam,w.settings.track).some(s=>s.id===t.subjectId)));}
function topic(w,id){return C.subjects.flatMap(s=>s.topics).find(t=>t.id===id)||w.customTopics.find(t=>t.id===id);}
function planDaysBetween(later,earlier){
 if(!validDate(later)||!validDate(earlier))return null;
 return Math.max(0,Math.floor((new Date(later+'T12:00:00')-new Date(earlier+'T12:00:00'))/86400000));
}
function planSubjectLevel(w,subjectId){
 const v=w.profile?.subjectLevels?.[subjectId];
 return Number.isInteger(v)&&v>=0&&v<=3?v:2;
}
function planSubjectGap(w,exam,sub){
 const p=w.profile||{},stage=exam==='yks'&&sub.stage!=='TYT',current=stage?p.currentStageNet:p.currentNet,target=stage?p.targetStageNet:p.targetNet,limit=stage?80:120,label=exam==='kpss'?'KPSS':sub.stage==='TYT'?'TYT':sub.stage==='YDT'?'YDT':'AYT';
 const known=Number.isFinite(current)&&Number(target)>0;
 return {known,current:known?Number(current):null,target:known?Number(target):Number(target)||0,gap:known?Math.max(0,Number(target)-Number(current)):0,limit,label};
}
function planLatestEvidenceDate(w,subjectId,topicId=''){
 const planById=new Map((w.plan||[]).map(p=>[p.id,p])),dates=[];
 for(const l of (w.logs||[])){if(l.subjectId!==subjectId)continue;const p=planById.get(l.sessionId);if(topicId&&p?.topicId!==topicId)continue;if(validDate(l.date))dates.push(l.date);}
 for(const p of (w.plan||[])){if(!p.done||p.subjectId!==subjectId||(topicId&&p.topicId!==topicId)||!validDate(p.date))continue;dates.push(p.date);}
 for(const a of (w.assessments||[])){if(a.subjectId!==subjectId||(topicId&&a.topicId!==topicId)||!validDate(a.date))continue;dates.push(a.date);}
 return dates.sort((a,b)=>b.localeCompare(a))[0]||'';
}
function planExamWeakness(w,exam){
 const out={},bySubject={},weights=[1,.82,.68,.55],recent=[...(w.exams||[])].filter(x=>C.TYPES[x.type]?.exam===exam).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4);
 for(const x of recent)for(const part of (x.parts||[])){
  let net;try{net=calcNet([part],x.penalty).net;}catch{continue;}
  const ratio=Math.max(0,Math.min(1,net/Math.max(1,part.total))),ids=C.PART_SUBJECTS[x.type]?.[part.label]||[];
  for(const id of ids){if(!C.subjects.some(s=>s.id===id&&s.exam===exam))continue;(bySubject[id]||(bySubject[id]=[])).push({ratio,date:x.date});}
 }
 for(const [id,rows] of Object.entries(bySubject)){
  const xs=rows.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4);let weighted=0,total=0;
  xs.forEach((x,i)=>{const wt=weights[i]||.45;weighted+=x.ratio*wt;total+=wt;});
  out[id]={ratio:total?weighted/total:1,samples:xs.length,date:xs[0]?.date||''};
 }
 return out;
}
function planTopicSignal(w,exam,sub,t,start,examWeakness){
 const level=planSubjectLevel(w,sub.id),gap=planSubjectGap(w,exam,sub),status=w.topicState?.[t.id]?.status||0,priority=!!w.settings.priorities.includes(sub.id),examSignal=examWeakness[sub.id]||null,lastDate=planLatestEvidenceDate(w,sub.id,t.id),daysSince=lastDate?planDaysBetween(start,lastDate):null,openMistakes=(w.mistakes||[]).filter(m=>!m.resolved&&m.topicId===t.id).length;
 const levelBoost=[30,22,10,2][level],gapBoost=gap.known?Math.min(18,Math.round(gap.gap/gap.limit*45)):0,examBoost=examSignal&&examSignal.ratio<.72?Math.min(18,Math.round((.72-examSignal.ratio)*45)):0,priorityBoost=priority?16:0,statusBoost=status===1?12:0,recencyBoost=daysSince===null?7:daysSince>=14?10:daysSince>=7?6:daysSince>=3?3:0,mistakeBoost=Math.min(14,openMistakes*7);
 const score=20+levelBoost+gapBoost+examBoost+priorityBoost+statusBoost+recencyBoost+mistakeBoost;
 const levelLabel=['çok zayıf','zayıf','orta','iyi'][level],reasons=[];
 if(gap.known&&gap.gap>0)reasons.push(gap.label+' hedef netine '+Math.round(gap.gap*10)/10+' net uzaksın');
 if(level<=1)reasons.push(sub.name+' “'+levelLabel+'” işaretlendi');
 else if(level===3)reasons.push(sub.name+' seviyen iyi olduğu için görev dozu daha kısa tutuldu');
 if(priority)reasons.push('bu dersi öncelikli seçtin');
 if(examBoost>=5)reasons.push('son deneme verisi bu derste ek çalışma ihtiyacı gösteriyor');
 if(status===1)reasons.push('bu konuya daha önce başladın; yarım bırakmamak için öne alındı');
 if(openMistakes)reasons.push('bu konuda '+openMistakes+' açık yanlış var');
 if(daysSince!==null&&daysSince>=7)reasons.push('son çalışma üzerinden '+daysSince+' gün geçti');
 if(!reasons.length)reasons.push('sıradaki tamamlanmamış konu olduğu için plana alındı');
 const source=examBoost>=5?'exam':level<=1||gapBoost>=6?'profile':priority?'priority':'curriculum';
 return {score,level,gap,status,priority,examSignal,examBoost,daysSince,openMistakes,source,reason:(reasons.join(', ')+'.').replace(/^./,c=>c.toLocaleUpperCase('tr-TR'))};
}
function planTaskMinutes(w,signal){
 let minutes=[35,30,25,20][signal.level];
 if(signal.gap.known&&signal.gap.gap>=20&&signal.level<=1)minutes+=5;
 if(signal.examBoost>=10)minutes+=5;
 if(signal.status===1)minutes-=5;
 const max=Math.max(20,Math.min(45,w.settings.dailyMinutes-5));
 return Math.max(20,Math.min(max,Math.round(minutes/5)*5));
}
function planQuestionTarget(signal){
 let q=[16,18,16,14][signal.level];
 if(signal.examBoost>=10)q+=4;if(signal.openMistakes)q+=2;
 return Math.max(8,Math.min(24,q));
}
function generatePlan(w,exam,start){
 if(!validDate(start))throw Error('Geçerli bir başlangıç tarihi seç.');
 const end=dayAdd(start,6),kept=w.plan.filter(p=>p.done||p.kind==='review'||p.date<start||p.date>end);
 const already=new Set(kept.filter(p=>!p.done).map(p=>p.topicId)),subs=courses(exam,w.settings.track),subById=new Map(subs.map(s=>[s.id,s])),weak=planExamWeakness(w,exam),catalog=allTopics(w,exam);
 const candidates=catalog.filter(t=>(w.topicState[t.id]?.status||0)!==2&&!already.has(t.id)&&subById.has(t.subjectId)).map((t,index)=>{const sub=subById.get(t.subjectId),signal=planTopicSignal(w,exam,sub,t,start,weak);return {t,sub,signal,index,minutes:planTaskMinutes(w,signal)};});
 const added=[],weekSubjectCount=new Map();
 for(let day=0;day<7;day++){
  const date=dayAdd(start,day);if(!w.settings.days.includes(new Date(date+'T12:00:00').getDay()))continue;
  let used=kept.filter(p=>p.date===date).reduce((n,p)=>n+p.minutes+5,0);const daySubjectCount=new Map();
  while(true){
   const fitting=candidates.filter(c=>c.minutes+5<=w.settings.dailyMinutes-used);if(!fitting.length)break;
   fitting.sort((a,b)=>{
    const as=a.signal.score-(daySubjectCount.get(a.sub.id)||0)*18-(weekSubjectCount.get(a.sub.id)||0)*4,bs=b.signal.score-(daySubjectCount.get(b.sub.id)||0)*18-(weekSubjectCount.get(b.sub.id)||0)*4;
    return bs-as||a.index-b.index;
   });
   const pick=fitting[0],i=candidates.indexOf(pick);candidates.splice(i,1);
   const questions=planQuestionTarget(pick.signal);
   added.push({id:uid(),date,subjectId:pick.t.subjectId,topicId:pick.t.id,title:pick.t.title,minutes:pick.minutes,done:false,kind:'route',source:pick.signal.source,priority:Math.max(1,Math.min(100,Math.round(pick.signal.score))),reason:pick.signal.reason,targetQuestions:questions,taskGoal:pick.sub.name+' · '+pick.t.title+': '+pick.minutes+' dk odaklı çalışma, yaklaşık '+questions+' soru/uygulama ve kısa yanlış kontrolü.'});
   used+=pick.minutes+5;daySubjectCount.set(pick.sub.id,(daySubjectCount.get(pick.sub.id)||0)+1);weekSubjectCount.set(pick.sub.id,(weekSubjectCount.get(pick.sub.id)||0)+1);
  }
 }
 return {plan:kept.concat(added).sort((a,b)=>a.date.localeCompare(b.date)||((b.priority||0)-(a.priority||0))),added:added.length};
}
function calcNet(parts,penalty=4){
 if(![0,3,4].includes(penalty))throw Error('Geçersiz net hesaplama kuralı.');
 let correct=0,wrong=0,total=0;
 for(const p of parts){if(![p.total,p.correct,p.wrong].every(Number.isInteger)||p.total<1||p.total>1000||p.correct<0||p.wrong<0||p.correct+p.wrong>p.total)throw Error(`${p.label||'Test'}: Doğru + yanlış, soru sayısını aşamaz.`);correct+=p.correct;wrong+=p.wrong;total+=p.total;}
 return {net:correct-(penalty?wrong/penalty:0),correct,wrong,blank:total-correct-wrong,total};
}
function safeUrl(text){if(!text)return '';try{const u=new URL(text);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
function resourceUrl(text,position){const raw=safeUrl(text);if(!raw)return '';const u=new URL(raw);if(/(^|\.)(youtube\.com|youtu\.be)$/.test(u.hostname)&&position>0)u.searchParams.set('t',Math.round(position*60)+'s');return u.href;}
function int(v,min,max,label){if(!Number.isInteger(v)||v<min||v>max)throw Error('Yedekte geçersiz sayı: '+label);return v;}
function text(v,max=2000){if(typeof v!=='string'||v.length>max)throw Error('Yedekte geçersiz metin.');return v;}
function checkedDate(v){if(!validDate(v))throw Error('Yedekte geçersiz tarih.');return v;}
function array(v){if(!Array.isArray(v)||v.length>10000)throw Error('Yedekte geçersiz liste.');return v;}
function ident(v){const s=text(v,120);if(!/^[a-zA-Z0-9_-]+$/.test(s)||['__proto__','prototype','constructor'].includes(s))throw Error('Yedekte geçersiz kayıt kimliği.');return s;}
function validateBackup(data){
 if(!data||data.version!==1||!data.workspaces)throw Error('Bu dosya Çalışma Rotası birleşik sürüm yedeği değil.');
 const out=fresh();out.activeExam=['kpss','yks'].includes(data.activeExam)?data.activeExam:null;
 for(const e of ['kpss','yks']){
  const old=data.workspaces[e];if(!old||!old.settings)throw Error('Yedekte sınav alanı eksik.');
  WS.assertIdentity(old,e);
  const w=WS.migrateIdentity(out.workspaces[e],e),s=old.settings;
  w.configured=!!old.configured;
  if(e==='yks'&&!C.TRACKS[s.track])throw Error('Yedekte geçersiz YKS alanı.');
  w.settings={name:text(s.name,60),track:e==='yks'?s.track:'lisans',dailyMinutes:int(s.dailyMinutes,30,720,'günlük süre'),days:[...new Set(array(s.days).map(n=>int(n,0,6,'gün')))],priorities:array(s.priorities).map(ident),target:text(s.target,160),targetDate:s.targetDate?checkedDate(s.targetDate):''};
  const op=old.profile&&typeof old.profile==='object'&&!Array.isArray(old.profile)?old.profile:{};
  const levelSource=op.subjectLevels&&typeof op.subjectLevels==='object'&&!Array.isArray(op.subjectLevels)?op.subjectLevels:{};
  const subjectLevels={};
  for(const [sid,lv] of Object.entries(levelSource)){if(C.subjects.some(x=>x.id===sid&&x.exam===e)&&Number.isInteger(lv)&&lv>=0&&lv<=3)subjectLevels[sid]=lv;}
  w.profile={version:4,completed:!!op.completed,summaryConfirmed:typeof op.summaryConfirmed==='boolean'?op.summaryConfirmed:!!op.completed,currentNet:Number.isFinite(op.currentNet)?Math.max(0,Math.min(120,Number(op.currentNet))):null,targetNet:Number.isFinite(op.targetNet)?Math.max(0,Math.min(120,Number(op.targetNet))):0,currentStageNet:Number.isFinite(op.currentStageNet)?Math.max(0,Math.min(80,Number(op.currentStageNet))):null,targetStageNet:Number.isFinite(op.targetStageNet)?Math.max(0,Math.min(80,Number(op.targetStageNet))):0,targetScore:Number.isFinite(op.targetScore)?Math.max(0,Math.min(1000,Number(op.targetScore))):0,targetRank:Number.isFinite(op.targetRank)?Math.max(0,Math.min(100000000,Math.round(Number(op.targetRank)))):0,studyHabit:['yes','sometimes','no'].includes(op.studyHabit)?op.studyHabit:'',subjectLevels,updated:Number.isFinite(op.updated)?Math.max(0,op.updated):0};
  if(!w.settings.days.length)throw Error('En az bir çalışma günü olmalı.');
  const subjectIds=new Set(C.subjects.filter(s=>s.exam===e).map(s=>s.id));
  const sub=v=>{if(!subjectIds.has(v))throw Error('Yedekte diğer sınava ait ders var.');return v;};
  w.settings.priorities=w.settings.priorities.filter(v=>subjectIds.has(v));
  w.customTopics=array(old.customTopics).map(t=>({id:ident(t.id),subjectId:sub(t.subjectId),title:text(t.title,180)}));
  const topicIds=new Set(C.subjects.filter(s=>s.exam===e).flatMap(s=>s.topics.map(t=>t.id)).concat(w.customTopics.map(t=>t.id)));
  if(!old.topicState||typeof old.topicState!=='object'||Array.isArray(old.topicState))throw Error('Geçersiz konu kayıtları.');
  for(const [id,t] of Object.entries(old.topicState)){
   if(!topicIds.has(id))continue;
   w.topicState[id]={status:int(t.status??0,0,2,'konu durumu'),url:safeUrl(text(t.url||'',2000)),position:int(t.position||0,0,100000,'kaynak dakikası'),note:text(t.note||'',4000),updated:typeof t.updated==='number'?t.updated:0};
  }
  w.plan=array(old.plan).map(p=>({id:ident(p.id),date:checkedDate(p.date),subjectId:sub(p.subjectId),topicId:ident(p.topicId),title:text(p.title,180),minutes:int(p.minutes,1,1440,'oturum süresi'),done:!!p.done,...(['review','route'].includes(p.kind)?{kind:p.kind}:{}),...(p.sourceMistakeId?{sourceMistakeId:ident(p.sourceMistakeId)}:{}),...(p.sourceTeacherQuestionId?{sourceTeacherQuestionId:ident(p.sourceTeacherQuestionId)}:{}),...(p.sourceAssessmentId?{sourceAssessmentId:ident(p.sourceAssessmentId)}:{}),...(p.source?{source:text(p.source,40)}:{}),...(Number.isFinite(p.priority)?{priority:Math.max(0,Math.min(100,Math.round(p.priority)))}:{}),...(p.reason?{reason:text(p.reason,500)}:{}),...(p.taskState&&['open','later'].includes(p.taskState)?{taskState:p.taskState}:{}),...(p.deferUntil?{deferUntil:checkedDate(p.deferUntil)}:{}),...(p.routeKey?{routeKey:text(p.routeKey,180)}:{}),...(Number.isInteger(p.targetQuestions)?{targetQuestions:int(p.targetQuestions,0,200,'soru hedefi')}:{}),...(p.taskGoal?{taskGoal:text(p.taskGoal,300)}:{}),...([1,3,7].includes(p.reviewWave)?{reviewWave:p.reviewWave}:{}),...(p.reviewBaseTaskId?{reviewBaseTaskId:ident(p.reviewBaseTaskId)}:{}),...(p.reviewBaseDate?{reviewBaseDate:checkedDate(p.reviewBaseDate)}:{}),...(p.reviewVariant==='challenge'?{reviewVariant:'challenge'}:{})}));
  w.logs=array(old.logs).map(l=>({id:ident(l.id),date:checkedDate(l.date),subjectId:sub(l.subjectId),title:text(l.title,180),minutes:int(l.minutes,0,1440,'çalışma süresi'),questions:int(l.questions,0,5000,'soru sayısı'),note:text(l.note||'',2000),sessionId:l.sessionId?ident(l.sessionId):'',...(['stuck','ok','strong'].includes(l.outcome)?{outcome:l.outcome}:{}),...(['concept','process','speed','attention','strategy'].includes(l.difficulty)?{difficulty:l.difficulty}:{}),...(Number.isInteger(l.correct)?{correct:int(l.correct,0,5000,'doğru sayısı')}:{}),...(Number.isInteger(l.wrong)?{wrong:int(l.wrong,0,5000,'yanlış sayısı')}:{}),...(Number.isFinite(l.created)?{created:Math.max(0,l.created)}:{}),...(Number.isFinite(l.updated)?{updated:Math.max(0,l.updated)}:{})}));
  for(const l of w.logs){if((Number.isInteger(l.correct)||Number.isInteger(l.wrong))&&((l.correct||0)+(l.wrong||0)>l.questions))throw Error('Çalışma günlüğünde doğru + yanlış, toplam soru sayısını aşıyor.');}
  w.assessments=Array.isArray(old.assessments)?old.assessments.slice(-200).map(a=>{
   const subjectId=sub(a.subjectId),topicId=a.topicId?ident(a.topicId):'';
   if(topicId){const t=topic(w,topicId);if(!topicIds.has(topicId)||!t||t.subjectId!==subjectId)throw Error('Mini deneme konu bağlantısı geçersiz.');}
   const total=int(a.total,1,200,'mini deneme soru sayısı'),correct=int(a.correct,0,total,'mini deneme doğru'),wrong=int(a.wrong,0,total,'mini deneme yanlış');
   if(correct+wrong>total)throw Error('Mini denemede doğru + yanlış soru sayısını aşıyor.');
   const answers=Array.isArray(a.answers)?a.answers.slice(0,total).map((v,i)=>int(v,-1,4,'mini deneme cevap '+(i+1))):[];
   if(answers.length&&answers.length!==total)throw Error('Mini deneme cevap sayısı geçersiz.');
   const skillBreakdown=Array.isArray(a.skillBreakdown)?a.skillBreakdown.slice(0,24).map(x=>{
    if(!x||typeof x!=='object'||Array.isArray(x))throw Error('Mini deneme alt konu kaydı geçersiz.');
    const skill=text(x.skill||'',80),skillTotal=int(x.total,1,total,'mini deneme alt konu toplamı'),skillCorrect=int(x.correct||0,0,skillTotal,'mini deneme alt konu doğru'),skillWrong=int(x.wrong||0,0,skillTotal,'mini deneme alt konu yanlış'),skillBlank=int(x.blank||0,0,skillTotal,'mini deneme alt konu boş');
    if(!skill||skillCorrect+skillWrong+skillBlank!==skillTotal)throw Error('Mini deneme alt konu dağılımı geçersiz.');
    return {skill,total:skillTotal,correct:skillCorrect,wrong:skillWrong,blank:skillBlank};
   }):[];
   if(skillBreakdown.length&&skillBreakdown.reduce((n,x)=>n+x.total,0)!==total)throw Error('Mini deneme alt konu toplamı soru sayısıyla eşleşmiyor.');
   const weakSkills=Array.isArray(a.weakSkills)?a.weakSkills.slice(0,8).map(x=>text(x,80)).filter(Boolean):[];
   const rd=a.routeDecision&&typeof a.routeDecision==='object'&&!Array.isArray(a.routeDecision)?a.routeDecision:null;
   const routeDecision=rd&&['repair','ease','steady','progress'].includes(rd.mode)?{mode:rd.mode,label:text(rd.label||'',80),note:text(rd.note||'',500),confidence:int(Number.isInteger(rd.confidence)?rd.confidence:0,0,100,'mini rota güveni'),evidence:Array.isArray(rd.evidence)?rd.evidence.slice(0,8).map(x=>text(x,120)).filter(Boolean):[]}:null;
   return {id:ident(a.id),miniId:text(a.miniId,120),version:Number.isInteger(a.version)?int(a.version,1,1000,'mini deneme sürümü'):1,date:checkedDate(a.date),subjectId,topicId,title:text(a.title,180),total,correct,wrong,blank:total-correct-wrong,minutes:int(a.minutes||1,1,1440,'mini deneme süresi'),answers,skillBreakdown,weakSkills,...(routeDecision?{routeDecision}:{}),created:Number.isFinite(a.created)?Math.max(0,a.created):0};
  }):[];
  for(const p of w.plan){if(p.sourceAssessmentId){const a=w.assessments.find(a=>a.id===p.sourceAssessmentId);if(!a||p.source!=='mini_repair'||a.subjectId!==p.subjectId||a.topicId!==p.topicId)throw Error('Mini onarım görevinin deneme sonucu bağlantısı geçersiz.');}}
  w.exams=array(old.exams).map(x=>{if(!C.TYPES[x.type]||C.TYPES[x.type].exam!==e)throw Error('Yedekte diğer sınava ait deneme var.');const parts=array(x.parts).map(p=>({label:text(p.label,100),total:p.total,correct:p.correct,wrong:p.wrong}));if(!parts.length||parts.length>20)throw Error('Geçersiz deneme testleri.');calcNet(parts,x.penalty);return {id:ident(x.id),type:x.type,name:text(x.name,120),date:checkedDate(x.date),parts,penalty:x.penalty,note:text(x.note||'',2000)};});
  w.mistakes=array(old.mistakes).map(m=>({id:ident(m.id),subjectId:sub(m.subjectId),title:text(m.title,180),cause:text(m.cause,80),...(['concept','process','attention','speed','strategy','reading','recall','other'].includes(m.errorType)?{errorType:m.errorType}:{}),note:text(m.note,4000),reviewDate:checkedDate(m.reviewDate),resolved:!!m.resolved,...(Number.isFinite(m.created)?{created:Math.max(0,m.created)}:{}),...(Number.isFinite(m.resolvedAt)?{resolvedAt:Math.max(0,m.resolvedAt)}:{}),...(Number.isFinite(m.reopenedAt)?{reopenedAt:Math.max(0,m.reopenedAt)}:{}),...(m.examId?{examId:ident(m.examId),partLabel:text(m.partLabel,100)}:{}),...(m.topicId?{topicId:ident(m.topicId)}:{})}));
  for(const m of w.mistakes){
   if(m.examId){const x=w.exams.find(x=>x.id===m.examId);if(!x||!x.parts.some(p=>p.label===m.partLabel))throw Error('Yanlış notunun deneme veya test bağlantısı geçersiz.');const allowed=C.PART_SUBJECTS[x.type]?.[m.partLabel];if(allowed&&!allowed.includes(m.subjectId))throw Error('Yanlış notunun dersi seçili teste ait değil.');}
   if(m.topicId){const t=topic(w,m.topicId);if(!topicIds.has(m.topicId)||!t||t.subjectId!==m.subjectId)throw Error('Yanlış notunun konu bağlantısı geçersiz.');}
  }
  for(const p of w.plan){if(p.sourceMistakeId){const m=w.mistakes.find(m=>m.id===p.sourceMistakeId);if(!m||p.kind!=='review'||m.subjectId!==p.subjectId)throw Error('Tekrar oturumunun yanlış notu bağlantısı geçersiz.');}}
  const ro=old.route&&typeof old.route==='object'&&!Array.isArray(old.route)?old.route:{};
  const decisions=Array.isArray(ro.decisions)?ro.decisions.slice(-80).map(d=>({taskId:text(d.taskId||'',120),date:d.date?checkedDate(d.date):'',source:text(d.source||'',40),priority:int(Number.isInteger(d.priority)?d.priority:0,0,100,'rota önceliği'),reason:text(d.reason||'',500)})):[];
  const interventions=Array.isArray(ro.interventions)?ro.interventions.slice(-120).map(x=>{
   const subjectId=sub(x.subjectId),topicId=x.topicId?ident(x.topicId):'';if(topicId){const t=topic(w,topicId);if(!topicIds.has(topicId)||!t||t.subjectId!==subjectId)throw Error('Rota müdahalesi konu bağlantısı geçersiz.');}
   const mode=['repair','ease','progress'].includes(x.mode)?x.mode:'repair';
   return {id:ident(x.id),date:checkedDate(x.date),subjectId,topicId,mode,source:text(x.source||'',40),method:text(x.method||'',60),taskId:text(x.taskId||'',120),taskDate:x.taskDate?checkedDate(x.taskDate):checkedDate(x.date),confidence:int(Number.isInteger(x.confidence)?x.confidence:0,0,100,'müdahale güveni'),baselineAccuracy:Number.isFinite(x.baselineAccuracy)?Math.max(0,Math.min(100,Number(x.baselineAccuracy))):null,baselineCompletion:Number.isFinite(x.baselineCompletion)?Math.max(0,Math.min(100,Number(x.baselineCompletion))):null,baselineNeed:Number.isFinite(x.baselineNeed)?Math.max(0,Math.min(100,Number(x.baselineNeed))):null,baselineAnswered:int(Number.isInteger(x.baselineAnswered)?x.baselineAnswered:0,0,10000,'müdahale cevap sayısı'),reason:text(x.reason||'',500),created:Number.isFinite(x.created)?Math.max(0,x.created):0};
  }):[];
  const modeHistory=Array.isArray(ro.modeHistory)?ro.modeHistory.slice(-160).map(x=>{
   const subjectId=sub(x.subjectId),topicId=x.topicId?ident(x.topicId):'';if(topicId){const t=topic(w,topicId);if(!topicIds.has(topicId)||!t||t.subjectId!==subjectId)throw Error('Rota karar geçmişi konu bağlantısı geçersiz.');}
   return {date:checkedDate(x.date),subjectId,topicId,mode:['repair','ease','steady','progress'].includes(x.mode)?x.mode:'steady',studentState:['collect','repair','retention','sustainable','progress','steady'].includes(x.studentState)?x.studentState:'steady',confidence:int(Number.isInteger(x.confidence)?x.confidence:0,0,100,'rota karar güveni'),performance:Number.isFinite(x.performance)?Math.max(0,Math.min(100,Number(x.performance))):null,learningNeed:Number.isFinite(x.learningNeed)?Math.max(0,Math.min(100,Number(x.learningNeed))):null,risk:Number.isFinite(x.risk)?Math.max(0,Math.min(100,Number(x.risk))):null,hysteresisHeld:!!x.hysteresisHeld,easeHysteresisHeld:!!x.easeHysteresisHeld,easeEntryHeld:!!x.easeEntryHeld,easeRecoveryHeld:!!x.easeRecoveryHeld,created:Number.isFinite(x.created)?Math.max(0,x.created):0};
  }):[];
  const pr=ro.pilot&&typeof ro.pilot==='object'&&!Array.isArray(ro.pilot)?ro.pilot:{},pn=function(v,min,max,fallback=0,label='pilot sayı'){if(v===undefined||v===null)return fallback;if(!Number.isFinite(v))throw Error('Yedekte geçersiz '+label+'.');return Math.max(min,Math.min(max,Number(v)));},pi=function(v,max=100000,label='pilot sayı',fallback=0){if(v===undefined||v===null)return fallback;return int(v,0,max,label);};
  const pilotSnapshots=Array.isArray(pr.snapshots)?pr.snapshots.slice(-8).map(s=>{
   if(![0,7,14,30].includes(s.checkpoint))throw Error('Pilot snapshot günü geçersiz.');
   const checkpoint=s.checkpoint,targetDate=checkedDate(s.targetDate),capturedDate=checkedDate(s.capturedDate),delayDays=pi(s.delayDays,365,'pilot gecikme günü'),milestoneDay=s.milestoneDay===undefined?checkpoint:int(s.milestoneDay,0,30,'pilot milestone günü'),actualDay=s.actualDay===undefined?Math.min(3650,checkpoint+delayDays):int(s.actualDay,0,3650,'pilot gerçek gün'),windowStart=s.windowStart?checkedDate(s.windowStart):(pr.startDate?checkedDate(pr.startDate):targetDate),windowEnd=s.windowEnd?checkedDate(s.windowEnd):targetDate;
   if(milestoneDay!==checkpoint)throw Error('Pilot milestone günü checkpoint ile eşleşmiyor.');
   if(windowStart>windowEnd||windowEnd!==targetDate)throw Error('Pilot snapshot penceresi geçersiz.');
   if(pr.startDate&&targetDate!==dayAdd(pr.startDate,checkpoint))throw Error('Pilot snapshot hedef tarihi milestone ile eşleşmiyor.');
   const planned=s.planned&&typeof s.planned==='object'?s.planned:{},actual=s.actual&&typeof s.actual==='object'?s.actual:{},exam=s.exam&&typeof s.exam==='object'?s.exam:{},mistakes=s.mistakes&&typeof s.mistakes==='object'?s.mistakes:{},mastery=s.mastery&&typeof s.mastery==='object'?s.mastery:{},modes=s.modes&&typeof s.modes==='object'?s.modes:{},iv=s.interventions&&typeof s.interventions==='object'?s.interventions:{},student=s.student&&typeof s.student==='object'?s.student:{},quality=s.dataQuality&&typeof s.dataQuality==='object'?s.dataQuality:{},horizonSource=iv.horizons&&typeof iv.horizons==='object'&&!Array.isArray(iv.horizons)?iv.horizons:{};
   const horizon=function(h){const x=horizonSource[h]&&typeof horizonSource[h]==='object'&&!Array.isArray(horizonSource[h])?horizonSource[h]:{};return {helpful:pi(x.helpful,10000,'pilot helpful müdahale'),neutral:pi(x.neutral,10000,'pilot neutral müdahale'),harmful:pi(x.harmful,10000,'pilot harmful müdahale'),insufficient:pi(x.insufficient,10000,'pilot insufficient müdahale'),confounded:pi(x.confounded,10000,'pilot confounded müdahale'),pending:pi(x.pending,10000,'pilot pending müdahale')};};
   const latestIv=iv.latest&&typeof iv.latest==='object'&&!Array.isArray(iv.latest)?iv.latest:null,latestIntervention=latestIv?{date:checkedDate(latestIv.date),mode:['repair','ease','progress'].includes(latestIv.mode)?latestIv.mode:'',status:['helpful','neutral','harmful','insufficient','confounded','pending'].includes(latestIv.status)?latestIv.status:'pending'}:null;
   const nullableCount=function(v,label){return v===undefined||v===null?null:int(v,0,100000,label);},nullableScore=function(v,label){return v===undefined||v===null?null:pn(v,0,100,null,label);},stateValue=['collect','repair','retention','sustainable','progress','steady','unknown'].includes(student.state)?student.state:'unknown',direction=function(v){return ['up','down','flat','unknown'].includes(v)?v:'unknown';},velocityValue=['fast','slow','steady','building','unknown'].includes(student.velocity)?student.velocity:'unknown';
   return {checkpoint,milestoneDay,actualDay,windowStart,windowEnd,targetDate,capturedDate,capturedAt:pn(s.capturedAt,0,Number.MAX_SAFE_INTEGER,0,'pilot capture zamanı'),delayDays,planned:{tasks:pi(planned.tasks,100000,'pilot plan görev'),minutes:pi(planned.minutes,1000000,'pilot plan dakika'),questions:pi(planned.questions,1000000,'pilot plan soru')},actual:{completedTasks:pi(actual.completedTasks,100000,'pilot tamamlanan görev'),skippedTasks:pi(actual.skippedTasks,100000,'pilot skip görev'),laterTasks:pi(actual.laterTasks,100000,'pilot later görev'),minutes:pi(actual.minutes,1000000,'pilot gerçek dakika'),questions:pi(actual.questions,1000000,'pilot gerçek soru'),correct:pi(actual.correct,1000000,'pilot doğru'),wrong:pi(actual.wrong,1000000,'pilot yanlış'),accuracy:Number.isFinite(actual.accuracy)?pn(actual.accuracy,0,100,null,'pilot doğruluk'):null,completion:Number.isFinite(actual.completion)?pn(actual.completion,0,100,null,'pilot completion'):null,questionAttainmentRatio:Number.isFinite(actual.questionAttainmentRatio)?pn(actual.questionAttainmentRatio,0,100,null,'pilot soru hedef oranı'):null},exam:{count:pi(exam.count,10000,'pilot deneme sayısı'),latestDate:exam.latestDate?checkedDate(exam.latestDate):'',latestNet:Number.isFinite(exam.latestNet)?pn(exam.latestNet,-200,1000,null,'pilot net'):null},mistakes:{openAtCapture:nullableCount(mistakes.openAtCapture,'pilot açık yanlış'),created:pi(mistakes.created,10000,'pilot oluşan yanlış'),resolved:pi(mistakes.resolved,10000,'pilot kapanan yanlış')},mastery:{completedTopics:nullableCount(mastery.completedTopics,'pilot tamamlanan konu'),mastery:nullableScore(mastery.mastery,'pilot mastery'),forgettingDue:nullableCount(mastery.forgettingDue,'pilot forgetting due'),retentionRefresh:nullableCount(mastery.retentionRefresh,'pilot retention refresh')},modes:{steady:pi(modes.steady,100000,'pilot steady'),repair:pi(modes.repair,100000,'pilot repair'),ease:pi(modes.ease,100000,'pilot ease'),progress:pi(modes.progress,100000,'pilot progress'),transitions:pi(modes.transitions,100000,'pilot mode transition'),bounces:pi(modes.bounces,100000,'pilot mode bounce'),repairDays:pi(modes.repairDays,3650,'pilot repair gün'),sustainableDays:pi(modes.sustainableDays,3650,'pilot sürdürülebilir gün'),steadyDays:pi(modes.steadyDays,3650,'pilot steady gün'),progressDays:pi(modes.progressDays,3650,'pilot progress gün'),current:['steady','repair','ease','progress',''].includes(modes.current)?modes.current:''},interventions:{total:pi(iv.total,100000,'pilot intervention'),helpful:pi(iv.helpful,100000,'pilot helpful'),neutral:pi(iv.neutral,100000,'pilot neutral'),harmful:pi(iv.harmful,100000,'pilot harmful'),insufficient:pi(iv.insufficient,100000,'pilot insufficient'),confounded:pi(iv.confounded,100000,'pilot confounded'),pending:pi(iv.pending,100000,'pilot pending'),horizons:{7:horizon(7),14:horizon(14),30:horizon(30)},latest:latestIntervention},student:{state:stateValue,performance:Number.isFinite(student.performance)?pn(student.performance,0,100,null,'pilot performance'):null,learningNeed:Number.isFinite(student.learningNeed)?pn(student.learningNeed,0,100,null,'pilot learningNeed'):null,risk:Number.isFinite(student.risk)?pn(student.risk,0,100,null,'pilot risk'):null,confidence:Number.isFinite(student.confidence)?pn(student.confidence,0,100,null,'pilot confidence'):null,execution:Number.isFinite(student.execution)?pn(student.execution,0,100,null,'pilot execution'):null,retention:Number.isFinite(student.retention)?pn(student.retention,0,100,null,'pilot retention'):null,trend:direction(student.trend),personalNorm:direction(student.personalNorm),velocity:velocityValue},dataQuality:{capturedOnTime:quality.capturedOnTime===undefined?!!quality.openMistakesExact:!!quality.capturedOnTime,plannedExact:quality.plannedExact===undefined?!!quality.openMistakesExact:!!quality.plannedExact,openMistakesExact:!!quality.openMistakesExact,modeHistoryExact:quality.modeHistoryExact===undefined?!!quality.openMistakesExact:!!quality.modeHistoryExact,interventionHistoryExact:quality.interventionHistoryExact===undefined?!!quality.openMistakesExact:!!quality.interventionHistoryExact,studentModelExact:quality.studentModelExact===undefined?!!quality.openMistakesExact:!!quality.studentModelExact,masteryExact:quality.masteryExact===undefined?!!quality.openMistakesExact:!!quality.masteryExact,actualLogsExact:quality.actualLogsExact===undefined?true:!!quality.actualLogsExact}};
  }):[];
  if(new Set(pilotSnapshots.map(function(x){return x.checkpoint;})).size!==pilotSnapshots.length)throw Error('Pilot snapshot günü yinelenemez.');
  const pilot={version:1,enabled:!!pr.enabled,participantId:pr.participantId?ident(pr.participantId):'',startDate:pr.startDate?checkedDate(pr.startDate):'',startedAt:pn(pr.startedAt,0,Number.MAX_SAFE_INTEGER,0,'pilot başlangıç zamanı'),completedAt:pn(pr.completedAt,0,Number.MAX_SAFE_INTEGER,0,'pilot bitiş zamanı'),snapshots:pilotSnapshots};
  w.route={version:2,lastRun:ro.lastRun&&validDate(ro.lastRun)?ro.lastRun:'',lastAutoDate:ro.lastAutoDate&&validDate(ro.lastAutoDate)?ro.lastAutoDate:'',lastReason:text(ro.lastReason||'',2000),lastChanged:int(Number.isInteger(ro.lastChanged)?ro.lastChanged:0,0,10000,'rota değişikliği'),decisions,interventions,modeHistory,pilot};
  w.taskEvents=Array.isArray(old.taskEvents)?old.taskEvents.slice(-300).map(ev=>({id:ident(ev.id),taskId:ident(ev.taskId),date:checkedDate(ev.date),action:['skip','later','complete','start'].includes(ev.action)?ev.action:'later',created:Number.isFinite(ev.created)?Math.max(0,ev.created):0})):[];
  for(const list of [w.plan,w.logs,w.exams,w.assessments,w.mistakes,w.customTopics,w.taskEvents])if(new Set(list.map(x=>x.id)).size!==list.length)throw Error('Yedekte yinelenen kayıt kimliği.');
 }
 return out;
}
root.RotaCore={uid,iso,dayAdd,validDate,workspace,fresh,courses,allTopics,topic,generatePlan,planSubjectGap,planSubjectLevel,planLatestEvidenceDate,planExamWeakness,planTopicSignal,planTaskMinutes,calcNet,safeUrl,resourceUrl,validateBackup};
if(typeof module==='object')module.exports=root.RotaCore;
})(typeof window!=='undefined'?window:globalThis);
