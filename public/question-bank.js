(function(root){
'use strict';
// Pure content/assessment boundary. No storage writes and no route scoring.
const SCHEMA='rota-question-bank-v1';
const TYPES=Object.freeze(['knowledge','concept','interpretation','chronology','cause-effect','comparison','inference','paragraph','table','graph','map','calculation','mixed']);
const SKILL_LABELS=Object.freeze({knowledge:'Temel bilgi',concept:'Kavram ayrımı',interpretation:'Yorumlama',chronology:'Kronoloji','cause-effect':'Neden–sonuç',comparison:'Karşılaştırma',inference:'Çıkarım',paragraph:'Paragraf',table:'Tablo yorumlama',graph:'Grafik yorumlama',map:'Harita yorumlama',calculation:'İşlem ve problem çözme',mixed:'Bilgi birleştirme'});
const DIFFICULTIES=['easy','medium','hard'];
const QUALITY_KEYS=['curriculumFit','clarity','distractorQuality','examSimilarity','educationalValue'];
const REVIEW_CHECKS=['singleAnswer','factualAccuracy','clearStem','plausibleDistractors','explanation','curriculumFit','originality'];
const DISTRIBUTIONS=Object.freeze({1:[6,5,1],2:[3,7,2],3:[1,7,4],4:[1,5,6]});
const LESSONS=Object.freeze({'k-tr':['turkce','genel-yetenek'],'k-ma':['matematik','genel-yetenek'],'k-ta':['tarih','genel-kultur'],'k-co':['cografya','genel-kultur'],'k-va':['vatandaslik','genel-kultur'],'k-gu':['guncel-bilgiler','genel-kultur']});
const tests=[];
let cachedAudit=null;
let cachedDay='';
const str=(v,max=500)=>typeof v==='string'?v.trim().slice(0,max):'';
const normalized=v=>str(v,20000).toLocaleLowerCase('tr-TR').normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
// Case, punctuation and mathematical signs can be the exact concept being tested.
const optionKey=v=>str(v,5000).normalize('NFC');
const mathStem=v=>str(v,20000).toLocaleLowerCase('tr-TR').normalize('NFC').replace(/([+\-−*/÷·=<>≤≥√∩∪()])/g,' $1 ').replace(/[^\p{L}\p{N}+\-−*/÷·=<>≤≥√∩∪()]+/gu,' ').replace(/\s+/g,' ').trim();
const validDate=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
const clone=v=>JSON.parse(JSON.stringify(v));
function freeze(v){if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
// A change detector, not a cryptographic signature or an originality proof.
function fingerprint(q){
 const fields=['id','exam','field','subjectId','topicId','lesson','unit','topic','subtopic','testNo','questionNo','text','options','answer','explanation','wrongAnswerNotes','difficulty','questionType','skill','learningObjectiveId','learningObjective','commonMistake','sourceRefs','sourceBasis','currentness'];
 const input=JSON.stringify(fields.map(k=>q?.[k]??null));let hash=2166136261;
 for(let i=0;i<input.length;i++)hash=Math.imul(hash^input.charCodeAt(i),16777619);
 return (hash>>>0).toString(16).padStart(8,'0');
}
function validateQuestion(q,{asOf=new Date().toISOString().slice(0,10)}={}){
 const errors=[],warnings=[];const error=(code)=>errors.push(code);
 if(!q||typeof q!=='object')return {id:'',errors:['invalid-question'],warnings,status:'rejected'};
 for(const k of ['id','field','lesson','subjectId','unit','topic','topicId','subtopic','learningObjectiveId','learningObjective','commonMistake','text','explanation'])if(!str(q[k],5000))error('missing:'+k);
 if(q.exam!=='kpss')error('invalid-exam');
 if(!['genel-yetenek','genel-kultur'].includes(q.field))error('invalid-field');
 if(!LESSONS[q.subjectId]||LESSONS[q.subjectId][0]!==q.lesson||LESSONS[q.subjectId][1]!==q.field)error('lesson-subject-mismatch');
 if(!str(q.topicId).startsWith(str(q.subjectId)+'-'))error('topic-subject-mismatch');
 if(!DIFFICULTIES.includes(q.difficulty))error('invalid-difficulty');
 if(!TYPES.includes(q.questionType)||!TYPES.includes(q.skill))error('invalid-question-type-or-skill');
 if(!Number.isInteger(q.testNo)||q.testNo<1||q.testNo>4||!Number.isInteger(q.questionNo)||q.questionNo<1||q.questionNo>120)error('invalid-number');
 if(!Array.isArray(q.options)||q.options.length!==5||q.options.some(x=>!str(x,5000)))error('five-options-required');
 else if(new Set(q.options.map(optionKey)).size!==5)error('duplicate-options');
 if(!Number.isInteger(q.answer)||q.answer<0||q.answer>4)error('invalid-answer');
 if(!q.wrongAnswerNotes||typeof q.wrongAnswerNotes!=='object')error('missing-distractor-notes');
 else for(let i=0;i<5;i++)if(i!==q.answer&&!str(q.wrongAnswerNotes[String.fromCharCode(65+i)],5000))error('missing-distractor-note:'+i);
 if(!Array.isArray(q.tags)||!q.tags.length||q.tags.some(x=>!str(x)))error('missing-tags');
 if(!Array.isArray(q.sourceBasis)||!q.sourceBasis.length)error('missing-source-basis');
 if(!Array.isArray(q.sourceRefs)||!q.sourceRefs.length||q.sourceRefs.some(x=>!/^https?:\/\/[^\s]+$/.test(x?.url||'')||!str(x.note,2000)))error('missing-source-evidence');
 if(!['approved','needs-review','rejected'].includes(q.qualityStatus))error('invalid-quality-status');
 for(const key of QUALITY_KEYS){const value=q.quality?.[key];if(!Number.isInteger(value)||value<1||value>5)error('invalid-quality:'+key);else if(value<4)warnings.push('low-quality:'+key);}
 if(str(q.explanation,5000).length<45)warnings.push('short-explanation');
 if(str(q.text,5000).length<35)warnings.push('short-stem');
 if((q.currentness?.required||['vatandaslik','guncel-bilgiler'].includes(q.lesson))&&(!validDate(q.currentness?.verifiedOn)||!validDate(q.currentness?.validUntil)||q.currentness.verifiedOn>asOf||q.currentness.validUntil<asOf||!/^https?:\/\/[^\s]+$/.test(q.currentness?.sourceUrl||'')))warnings.push('currentness-review-required');
 const review=q.review;
 if(!review||review.fingerprint!==fingerprint(q)||!str(review.reviewer)||!validDate(review.reviewedOn)||review.reviewedOn>asOf||REVIEW_CHECKS.some(k=>review.checks?.[k]!==true))warnings.push('editorial-review-required');
 const status=errors.length||q.qualityStatus==='rejected'?'rejected':warnings.length||q.qualityStatus!=='approved'?'needs-review':'approved';
 return {id:q.id,errors,warnings,status};
}
function similarity(a,b){
 const tokens=v=>{const words=normalized(v).split(' ');return new Set(words.slice(0,-2).map((_,i)=>words.slice(i,i+3).join(' ')));};
 const x=tokens(a),y=tokens(b);if(!x.size||!y.size)return normalized(a)===normalized(b)?1:0;
 let common=0;for(const t of x)if(y.has(t))common++;
 return common/(x.size+y.size-common);
}
function audit(definitions=tests,options={}){
 const questions=definitions.flatMap(t=>Array.isArray(t.questions)?t.questions:[]).map(q=>q&&typeof q==='object'?q:{}),results=questions.map(q=>validateQuestion(q,options));
 // Normalize once: a complete bank compares thousands of stems, not just the pilot.
 const prepared=questions.map(q=>{const text=q.lesson==='matematik'?mathStem(q.text):normalized(q.text),words=text.split(' ');return {text,tokens:new Set(words.slice(0,-2).map((_,i)=>words.slice(i,i+3).join(' '))),options:(Array.isArray(q.options)?q.options:[]).map(optionKey)};});
 const postings=new Map(),exactStems=new Map();
 prepared.forEach((p,i)=>{for(const token of p.tokens){const indices=postings.get(token)||[];indices.push(i);postings.set(token,indices);}const exact=exactStems.get(p.text)||[];exact.push(i);exactStems.set(p.text,exact);});
 const duplicates=[],testIssues=[],ids=new Map(),objectives=new Map();
 questions.forEach((q,i)=>{
  if(ids.has(q.id)){results[i].errors.push('duplicate-id');results[ids.get(q.id)].errors.push('duplicate-id');}else ids.set(q.id,i);
  const key=q.topicId+'|'+q.learningObjectiveId;const group=objectives.get(key)||[];group.push(i);objectives.set(key,group);
 });
 for(let i=0;i<questions.length;i++){
 const candidates=new Map();
 for(const token of prepared[i].tokens)for(const j of postings.get(token))if(j>i)candidates.set(j,(candidates.get(j)||0)+1);
 if(!prepared[i].tokens.size)for(const j of exactStems.get(prepared[i].text))if(j>i)candidates.set(j,0);
 for(const [j,common] of [...candidates].sort((a,b)=>a[0]-b[0])){
  const a=questions[i],b=questions[j],pa=prepared[i],pb=prepared[j];
  const stem=pa.tokens.size&&pb.tokens.size?common/(pa.tokens.size+pb.tokens.size-common):pa.text===pb.text?1:0;
  if(stem<.3)continue;
  const optionOverlap=pa.options.filter(x=>pb.options.includes(x)).length/5;
  if(stem>=.62||(stem>=.3&&optionOverlap>=.8)){
   duplicates.push({a:a.id,b:b.id,stemSimilarity:Number(stem.toFixed(3)),optionOverlap});
   results[i].warnings.push('similar-question:'+b.id);results[j].warnings.push('similar-question:'+a.id);
  }
 }
 }
 for(const group of objectives.values())if(group.length>3)for(const i of group)results[i].warnings.push('overused-objective');
 const testIds=new Set();
 for(const t of definitions){
  const problems=[];
  if(testIds.has(t.id))problems.push('duplicate-test-id');testIds.add(t.id);
  if(t.exam!=='kpss'||!str(t.id)||!str(t.subjectId)||!str(t.topicId)||!Number.isInteger(t.version)||t.version<1)problems.push('invalid-test-identity');
  if(t.questions?.length!==12)problems.push('requires-12-questions');
  if(t.questions?.some((q,i)=>!q||q.subjectId!==t.subjectId||q.topicId!==t.topicId||q.testNo!==t.setNo||q.questionNo!==i+1))problems.push('question-test-mismatch');
  const counts=DIFFICULTIES.map(d=>(t.questions||[]).filter(q=>q?.difficulty===d).length);
  if(JSON.stringify(counts)!==JSON.stringify(DISTRIBUTIONS[t.setNo]))problems.push('difficulty-distribution');
  const positions=Array.from({length:5},(_,i)=>(t.questions||[]).filter(q=>q?.answer===i).length);
  if(positions.some(n=>n<1||n>3))problems.push('answer-position-balance');
  if(problems.length)testIssues.push({testId:t.id,issues:problems});
 }
 for(const r of results)r.status=r.errors.length||r.status==='rejected'?'rejected':r.warnings.length||r.status!=='approved'?'needs-review':'approved';
 return {schema:SCHEMA,total:questions.length,approved:results.filter(r=>r.status==='approved').length,needsReview:results.filter(r=>r.status==='needs-review').length,rejected:results.filter(r=>r.status==='rejected').length,duplicates,testIssues,results};
}
function registerTest(def){
 // Malformed content can be inspected in admin tooling, but never enters a published set.
 if(!def||!Array.isArray(def.questions))throw new Error('Soru paketi geçersiz.');
 tests.push(freeze(clone({...def,bankSchema:SCHEMA,sourceKind:'original',copyrightPolicy:'original-only'})));cachedAudit=null;
}
function allTests(){return tests.slice();}
function topicTests(){
 const day=new Date().toISOString().slice(0,10);if(cachedDay!==day){cachedAudit=null;cachedDay=day;}
 const report=cachedAudit||(cachedAudit=audit());const approved=new Set(report.results.filter(r=>r.status==='approved').map(r=>r.id));
 return tests.filter(t=>!report.testIssues.some(r=>r.testId===t.id)&&t.questions.every(q=>approved.has(q.id)));
}
function getTest(id){return topicTests().find(t=>t.id===id)||null;}
function filter(criteria={},definitions=tests){
 const allowed=['exam','field','lesson','subjectId','unit','topic','topicId','subtopic','testNo','difficulty','questionType','skill','learningObjectiveId','qualityStatus'];
 return definitions.flatMap(t=>t.questions||[]).filter(q=>q&&typeof q==='object'&&allowed.every(k=>criteria[k]===undefined||q[k]===criteria[k])&&(!criteria.search||normalized([q.text,q.learningObjective,...(Array.isArray(q.tags)?q.tags:[])].join(' ')).includes(normalized(criteria.search))));
}
const EVIDENCE_STRINGS=['questionId','subjectId','topicId','lesson','topic','subtopic','learningObjectiveId','learningObjective','questionType','skill','difficulty','commonMistake'];
function cleanEvidence(input){
 if(!Array.isArray(input))return [];
 const seen=new Set();const result=[];
 for(const raw of input.slice(0,120)){
  if(!raw||typeof raw!=='object'||!str(raw.questionId)||!str(raw.subjectId)||!str(raw.topicId)||seen.has(str(raw.questionId,120)))continue;
  if(!Number.isInteger(raw.picked)||raw.picked< -1||raw.picked>4||!Number.isInteger(raw.answer)||raw.answer<0||raw.answer>4)continue;
  if(!TYPES.includes(raw.questionType)||!TYPES.includes(raw.skill)||!DIFFICULTIES.includes(raw.difficulty))continue;
  const status=raw.picked===-1?'blank':raw.picked===raw.answer?'correct':'wrong';if(raw.status!==status)continue;
  const row={};for(const key of EVIDENCE_STRINGS)row[key]=str(raw[key],key==='learningObjective'||key==='commonMistake'?500:120);
  row.questionVersion=Number.isInteger(raw.questionVersion)&&raw.questionVersion>0?raw.questionVersion:1;
  Object.assign(row,{status,picked:raw.picked,answer:raw.answer});seen.add(row.questionId);result.push(row);
 }
 return result;
}
function snapshot(def,answers){
 return cleanEvidence((def.questions||[]).filter(q=>q?.learningObjectiveId).map(q=>{
  const index=def.questions.indexOf(q),picked=Number.isInteger(answers?.[index])&&answers[index]>=0&&answers[index]<5?answers[index]:-1;
  return {...q,questionId:q.id,questionVersion:def.version||1,picked,status:picked<0?'blank':picked===q.answer?'correct':'wrong'};
 }));
}
function signals(assessments,{subjectId='',topicId='',since=''}={}){
 const grouped=new Map();
 for(const a of assessments||[]){
  if(subjectId&&a.subjectId&&a.subjectId!==subjectId)continue;
  if(topicId&&a.topicId&&a.topicId!==topicId)continue;
  if(since&&a.date<since)continue;
  const key=(a.miniId||a.sectionId||a.id)+'|'+a.date;const old=grouped.get(key);
  if(!old||(a.created||0)>=(old.created||0))grouped.set(key,a);
 }
 const rows=[...grouped.values()].flatMap(a=>cleanEvidence(a.questionEvidence)).filter(q=>(!subjectId||q.subjectId===subjectId)&&(!topicId||q.topicId===topicId));
 function aggregate(key){const map=new Map();for(const q of rows){const id=q[key],x=map.get(id)||{key:id,title:key==='learningObjectiveId'?q.learningObjective:id,total:0,correct:0,wrong:0,blank:0};x.total++;x[q.status]++;map.set(id,x);}return [...map.values()].sort((a,b)=>b.wrong+b.blank-a.wrong-a.blank||a.key.localeCompare(b.key)).slice(0,24);}
 return {byType:aggregate('questionType'),byObjective:aggregate('learningObjectiveId'),bySubtopic:aggregate('subtopic'),wrongQuestions:rows.filter(q=>q.status==='wrong').slice(-24)};
}
// Deterministic, quota-driven assembly. No fallback sampling or unreviewed fillers.
function assemble(blueprint,pool,{excludeIds=[]}={}){
 const poolAudit=audit([{questions:pool}]),eligible=new Set(poolAudit.results.filter(r=>r.status==='approved').map(r=>r.id));
 return assembleReviewed(blueprint,pool,excludeIds,eligible);
}
function assembleReviewed(blueprint,pool,excludeIds,eligible){
 if(!blueprint||!Array.isArray(blueprint.slots)||!blueprint.slots.length)throw new Error('Deneme dağılımı eksik.');
 const seen=new Set(excludeIds),selected=[],shortages=[];
 // Later branch forms favor the corresponding advanced topic-test material,
 // while the explicit difficulty/topic quotas and cross-form exclusions remain mandatory.
 const preference=blueprint.kind==='section'?({1:[2,1,3,4],2:[3,2,4,1],3:[4,3,2,1]}[blueprint.variant]||[]):[];
 const rank=q=>preference.length?preference.indexOf(q.testNo):0;
 const specificity=s=>['topicId','difficulty','questionType'].filter(k=>s[k]).length;
 for(const slot of [...blueprint.slots].sort((a,b)=>specificity(b)-specificity(a))){
  if(!Number.isInteger(slot.count)||slot.count<1)throw new Error('Geçersiz soru kotası.');
  const matches=pool.filter(q=>q&&typeof q==='object'&&!seen.has(q.id)&&eligible.has(q.id)&&q.subjectId===slot.subjectId&&(!slot.topicId||q.topicId===slot.topicId)&&(!slot.difficulty||q.difficulty===slot.difficulty)&&(!slot.questionType||q.questionType===slot.questionType)).sort((a,b)=>rank(a)-rank(b)||a.id.localeCompare(b.id));
  if(matches.length<slot.count)shortages.push({subjectId:slot.subjectId,topicId:slot.topicId||'',difficulty:slot.difficulty||'',required:slot.count,available:matches.length});
  for(const q of matches.slice(0,slot.count)){seen.add(q.id);selected.push(q);}
 }
 if(selected.length!==blueprint.total&&!shortages.length)throw new Error('Deneme toplamı kotayla uyuşmuyor.');
 return shortages.length?{status:'needs-content',questions:[],shortages}:{status:'ready',questions:selected,shortages:[]};
}
function assembleSeries(blueprints,pool){
 const eligible=new Set(audit([{questions:pool}]).results.filter(r=>r.status==='approved').map(r=>r.id));
 const used=[];const exams=blueprints.map(blueprint=>{const result=assembleReviewed(blueprint,pool,used,eligible);used.push(...result.questions.map(q=>q.id));return {blueprintId:blueprint.id,...result};});
 return exams.every(e=>e.status==='ready')?{status:'ready',exams}:{status:'needs-content',exams:exams.map(e=>({...e,questions:[]}))};
}
root.RotaQuestionBank=Object.freeze({SCHEMA,TYPES,SKILL_LABELS,LESSONS,DISTRIBUTIONS,REVIEW_CHECKS,registerTest,allTests,topicTests,getTest,validateQuestion,audit,fingerprint,similarity,filter,snapshot,cleanEvidence,signals,assemble,assembleSeries});
if(typeof module==='object')module.exports=root.RotaQuestionBank;
})(typeof window!=='undefined'?window:globalThis);
