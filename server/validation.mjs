import { createHash } from 'node:crypto';
import '../public/workspace-schema.js';

export const MAX_JSON_BYTES = 12 * 1024 * 1024;
export function failure(status, code, message, details = {}) { return Object.assign(new Error(message), {status, code, details}); }
export function readJson(req, maxBytes = MAX_JSON_BYTES) {
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) throw failure(415,'JSON_REQUIRED','İstek JSON biçiminde olmalı.');
  return new Promise((resolve,reject)=>{
    let size=0, chunks=[], failed=false;
    const stop=(e)=>{if(failed)return;failed=true;chunks=[];reject(e);};
    if(Number(req.headers['content-length']||0)>maxBytes){req.resume();stop(failure(413,'BODY_TOO_LARGE','İstek çok büyük.'));return;}
    req.on('aborted',()=>stop(failure(400,'REQUEST_ABORTED','İstek tamamlanmadı.')));
    req.on('error',stop);
    req.on('data',chunk=>{if(failed)return;size+=chunk.length;if(size>maxBytes){stop(failure(413,'BODY_TOO_LARGE','İstek çok büyük.'));return;}chunks.push(chunk);});
    req.on('end',()=>{if(failed)return;try{const value=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!value||typeof value!=='object'||Array.isArray(value))throw Error();resolve(value);}catch{stop(failure(400,'INVALID_JSON','Geçerli bir JSON nesnesi gerekli.'));}});
  });
}
export const digest=value=>createHash('sha256').update(value).digest('hex');
export function name(value){if(typeof value!=='string'||value.trim().length<1||value.trim().length>60)throw failure(400,'INVALID_NAME','Adın 1–60 karakter olmalı.');return value.trim();}
export function email(value){const v=typeof value==='string'?value.trim().toLowerCase():'';if(v.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))throw failure(400,'INVALID_EMAIL','Geçerli bir e-posta adresi yaz.');return v;}
export function password(value){if(typeof value!=='string'||value.length<12||value.length>128)throw failure(400,'INVALID_PASSWORD','Şifren 12–128 karakter olmalı.');return value;}
const badKeys=new Set(['__proto__','constructor','prototype']);
function inspect(value,depth=0,counter={n:0}){
  if(++counter.n>500000||depth>18)throw failure(400,'INVALID_WORKSPACE','Kayıt yapısı çok büyük veya derin.');
  if(value===null||typeof value==='boolean')return;
  if(typeof value==='number'){if(!Number.isFinite(value))throw failure(400,'INVALID_WORKSPACE','Geçersiz sayı.');return;}
  if(typeof value==='string'){if(value.length>450000)throw failure(400,'INVALID_WORKSPACE','Bir kayıt alanı çok uzun.');return;}
  if(Array.isArray(value)){if(value.length>10000)throw failure(400,'INVALID_WORKSPACE','Kayıt listesi çok uzun.');for(const item of value)inspect(item,depth+1,counter);return;}
  if(!value||typeof value!=='object')throw failure(400,'INVALID_WORKSPACE','Geçersiz kayıt türü.');
  const entries=Object.entries(value);if(entries.length>2000)throw failure(400,'INVALID_WORKSPACE','Çok fazla kayıt alanı.');
  for(const [key,item] of entries){if(badKeys.has(key)||key.length>160)throw failure(400,'INVALID_WORKSPACE','Geçersiz kayıt anahtarı.');inspect(item,depth+1,counter);}
}
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
function boundedText(v,max,label){if(typeof v!=='string'||v.length>max)throw failure(400,'INVALID_WORKSPACE',label+' geçersiz.');}
const ID=/^[a-zA-Z0-9_-]{1,120}$/;
function date(v){return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;}
function integer(v,min,max){return Number.isInteger(v)&&v>=min&&v<=max;}
export function validateTeacherAnswer(a){
  if(!object(a))throw failure(400,'INVALID_ANSWER','Öğretmen cevabı geçersiz.');
  for(const key of ['direct_answer','message','diagnosis','summary','detected_subject','detected_topic'])boundedText(a[key],16000,'Öğretmen cevabı');
  if(!['chat','fact','solution','concept','study','clarify'].includes(a.kind)||!['basic','medium','advanced'].includes(a.difficulty)||typeof a.needs_clarification!=='boolean'||!Number.isFinite(a.confidence)||a.confidence<0||a.confidence>1)throw failure(400,'INVALID_ANSWER','Öğretmen sınıflandırması geçersiz.');
  if(!Array.isArray(a.steps)||a.steps.length>8||a.steps.some(s=>!object(s)||typeof s.title!=='string'||s.title.length>500||typeof s.text!=='string'||s.text.length>6000)||!Array.isArray(a.source_notes)||a.source_notes.length>20||a.source_notes.some(s=>typeof s!=='string'||s.length>2000))throw failure(400,'INVALID_ANSWER','Öğretmen açıklaması geçersiz.');
  if(!object(a.verification)||!['checked','partial','not_needed','uncertain'].includes(a.verification.status)||!Array.isArray(a.verification.methods)||a.verification.methods.length>20||a.verification.methods.some(s=>typeof s!=='string'||s.length>500)||typeof a.verification.note!=='string'||a.verification.note.length>4000||!object(a.route_signal)||!integer(a.route_signal.importance,0,3)||typeof a.route_signal.reason!=='string'||a.route_signal.reason.length>4000)throw failure(400,'INVALID_ANSWER','Öğretmen doğrulama bilgisi geçersiz.');
  return a;
}
export function validateData(data){
  if(!object(data)||Object.keys(data).some(k=>!['workspace','teacherHistory','preferences'].includes(k)))throw failure(400,'INVALID_WORKSPACE','Çalışma alanı paketi geçersiz.');
  inspect(data);
  const space=data.workspace;
  if(!object(space)||space.exam!=='kpss'||!Number.isInteger(space.schemaVersion)||space.schemaVersion<1||!object(space.settings)||!object(space.profile)||!object(space.topicState)||!object(space.route))throw failure(400,'INVALID_WORKSPACE','KPSS çalışma alanı gerekli.');
  try{globalThis.RotaWorkspaceSchema.assertIdentity(space,'kpss');}catch{throw failure(400,'INVALID_WORKSPACE','Çalışma alanı sürümü veya sınav kimliği geçersiz.');}
  if(!Number.isInteger(space.settings.dailyMinutes)||space.settings.dailyMinutes<30||space.settings.dailyMinutes>720||!Array.isArray(space.settings.days)||!space.settings.days.length||space.settings.days.some(d=>!Number.isInteger(d)||d<0||d>6))throw failure(400,'INVALID_WORKSPACE','Çalışma süresi veya günleri geçersiz.');
  boundedText(space.settings.name||'',60,'Ad');boundedText(space.settings.target||'',160,'Hedef');
  if(space.settings.track!=='lisans'||(space.settings.targetDate&&!date(space.settings.targetDate))||!Array.isArray(space.settings.priorities)||space.settings.priorities.length>6||space.settings.priorities.some(id=>!/^k-(tr|ma|ta|co|va|gu)$/.test(id)))throw failure(400,'INVALID_WORKSPACE','KPSS çalışma ayarları geçersiz.');
  for(const [key,max] of Object.entries({currentNet:120,targetNet:120,currentStageNet:80,targetStageNet:80,targetScore:1000,targetRank:100000000})){const value=space.profile[key];if(value!==null&&value!==undefined&&(!Number.isFinite(value)||value<0||value>max))throw failure(400,'INVALID_WORKSPACE','Profil hedef sayıları geçersiz.');}
  if(space.profile.subjectLevels!==undefined&&(!object(space.profile.subjectLevels)||Object.entries(space.profile.subjectLevels).some(([id,level])=>!/^k-(tr|ma|ta|co|va|gu)$/.test(id)||!integer(level,0,3))))throw failure(400,'INVALID_WORKSPACE','Ders seviyesi geçersiz.');
  const caps={customTopics:1000,plan:10000,logs:10000,exams:10000,assessments:1000,mistakes:10000,taskEvents:10000};
  for(const [key,cap] of Object.entries(caps)){
    const rows=space[key];if(!Array.isArray(rows)||rows.length>cap)throw failure(400,'INVALID_WORKSPACE',key+' listesi geçersiz.');
    const seen=new Set();for(const row of rows){if(!object(row)||!ID.test(row.id||'')||seen.has(row.id))throw failure(400,'INVALID_WORKSPACE',key+' kayıt kimliği geçersiz veya tekrar ediyor.');seen.add(row.id);if(row.subjectId&&!/^k-(tr|ma|ta|co|va|gu)$/.test(row.subjectId))throw failure(400,'INVALID_WORKSPACE','KPSS dışı ders kaydı.');if(row.title!==undefined)boundedText(row.title,500,'Başlık');if(row.note!==undefined)boundedText(row.note,8000,'Not');}
    for(const row of rows){
      if(['plan','logs','exams','assessments','taskEvents'].includes(key)&&!date(row.date))throw failure(400,'INVALID_WORKSPACE','Geçersiz kayıt tarihi.');
      if(['plan','logs'].includes(key)&&!integer(row.minutes,key==='logs'?0:1,1440))throw failure(400,'INVALID_WORKSPACE','Geçersiz çalışma süresi.');
      if(key==='plan'&&typeof row.done!=='boolean')throw failure(400,'INVALID_WORKSPACE','Görev durumu geçersiz.');
      if(key==='logs'&&(!integer(row.questions,0,5000)||(row.correct!==undefined&&!integer(row.correct,0,row.questions))||(row.wrong!==undefined&&!integer(row.wrong,0,row.questions))||((row.correct||0)+(row.wrong||0)>row.questions)))throw failure(400,'INVALID_WORKSPACE','Çalışma soru sayıları geçersiz.');
      if(key==='assessments'&&(!integer(row.total,1,200)||!integer(row.correct,0,row.total)||!integer(row.wrong,0,row.total)||row.correct+row.wrong>row.total||(row.blank!==undefined&&(!integer(row.blank,0,row.total)||row.correct+row.wrong+row.blank!==row.total))||(row.answers!==undefined&&(!Array.isArray(row.answers)||(row.answers.length&&row.answers.length!==row.total)||row.answers.some(a=>!integer(a,-1,4))))))throw failure(400,'INVALID_WORKSPACE','Deneme cevapları veya toplamları geçersiz.');
      if(key==='exams'&&(!Array.isArray(row.parts)||!row.parts.length||row.parts.length>20||row.parts.some(p=>!object(p)||!integer(p.total,1,1000)||!integer(p.correct,0,p.total)||!integer(p.wrong,0,p.total)||p.correct+p.wrong>p.total)))throw failure(400,'INVALID_WORKSPACE','Sınav soru sayıları geçersiz.');
      if(key==='mistakes'&&row.reviewDate&&!date(row.reviewDate))throw failure(400,'INVALID_WORKSPACE','Tekrar tarihi geçersiz.');
    }
  }
  for(const [id,value] of Object.entries(space.topicState)){if(!ID.test(id)||!object(value)||(value.status!==undefined&&!integer(value.status,0,2))||(value.position!==undefined&&!integer(value.position,0,100000)))throw failure(400,'INVALID_WORKSPACE','Konu kaydı geçersiz.');if(value.note!==undefined)boundedText(value.note,4000,'Konu notu');if(value.url!==undefined){boundedText(value.url,2000,'Konu kaynağı');if(value.url){try{if(!['http:','https:'].includes(new URL(value.url).protocol))throw Error();}catch{throw failure(400,'INVALID_WORKSPACE','Konu kaynağı geçersiz.');}}}}
  if(!Array.isArray(data.teacherHistory)||data.teacherHistory.length>60||!object(data.preferences))throw failure(400,'INVALID_WORKSPACE','Öğretmen geçmişi veya tercihler geçersiz.');
  const ids=new Set();for(const q of data.teacherHistory){
    if(!object(q)||!ID.test(q.id||'')||ids.has(q.id)||!/^k-(tr|ma|ta|co|va|gu)$/.test(q.subjectId||''))throw failure(400,'INVALID_WORKSPACE','Öğretmen kaydı geçersiz.');ids.add(q.id);
    boundedText(q.question,5000,'Soru');
    if(q.photo&&(typeof q.photo!=='string'||q.photo.length>400*1024||!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(q.photo)))throw failure(400,'INVALID_WORKSPACE','Öğretmen fotoğrafı geçersiz veya çok büyük.');
    if(q.followups!==undefined&&(!Array.isArray(q.followups)||q.followups.length>20))throw failure(400,'INVALID_WORKSPACE','Devam soru listesi geçersiz.');
    if(q.status!==undefined&&!['open','solved','review','stuck'].includes(q.status))throw failure(400,'INVALID_WORKSPACE','Öğretmen kayıt durumu geçersiz.');
    if(q.answer!==undefined)validateTeacherAnswer(q.answer);
    for(const f of q.followups||[]){if(!object(f))throw failure(400,'INVALID_WORKSPACE','Devam cevabı geçersiz.');boundedText(f.title,500,'Devam başlığı');boundedText(f.text,30000,'Devam cevabı');if(f.answer!==undefined)validateTeacherAnswer(f.answer);}
  }
  const serialized=JSON.stringify(data);if(Buffer.byteLength(serialized)>MAX_JSON_BYTES-4096)throw failure(413,'BODY_TOO_LARGE','Çalışma alanı çok büyük.');
  return JSON.parse(serialized);
}
export function revision(value){if(!Number.isSafeInteger(value)||value<0)throw failure(400,'INVALID_REVISION','Kayıt sürümü geçersiz.');return value;}
export function mutation(value){if(typeof value!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(value))throw failure(400,'INVALID_MUTATION','İşlem kimliği geçersiz.');return value;}
