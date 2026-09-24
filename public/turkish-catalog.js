/* Personal-source backup compatibility. No bundled teachers or source recommendations. */
(function(root){'use strict';
const C=root.RotaCatalog||(typeof require==='function'?require('./catalog.js'):null);
const SERIES=Object.freeze([]),SOURCES=Object.freeze([]);
const DATA=Object.freeze({mode:'personal-source-compatibility',series:SERIES,sources:SOURCES});
function options(){return [];}
function preferred(){return 'custom';}
function validLegacyPreference(value){return typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/.test(value)&&!['__proto__','constructor','prototype'].includes(value);}
function validatePreferences(raw,exam){
 if(raw===undefined)return {};
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length>100)throw Error('Eski kaynak tercihleri geçersiz.');
 const out={};for(const [id,pref] of Object.entries(raw)){
  if(!C.subjects.some(s=>s.id===id&&s.exam===exam)||!validLegacyPreference(pref))throw Error('Eski kaynak tercihi bu sınavla eşleşmiyor.');out[id]=pref;
 }return out;
}
// Old preference IDs remain in backups but no longer determine topic order.
function orderedTopics(w,subjectId,topics){return [...topics];}
function parsePlaylist(raw){
 if(typeof raw!=='string'||raw.length>2000)return null;
 try{const u=new URL(raw.trim());if(!['http:','https:'].includes(u.protocol)||u.username||u.password||!['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(u.hostname.toLowerCase()))return null;const id=u.searchParams.get('list');return /^PL[A-Za-z0-9_-]{8,100}$/.test(id||'')?{id,url:'https://www.youtube.com/playlist?list='+id}:null;}catch{return null;}
}
function validateCourseData(old,exam){
 const out={courseSources:{},courseNotes:{},courseProgress:{}};
 const belongs=id=>C.subjects.some(s=>s.id===id&&s.exam===exam);
 const obj=v=>v&&typeof v==='object'&&!Array.isArray(v);
 const txt=(v,n)=>{if(typeof v!=='string'||v.length>n)throw Error('Kamp kaydındaki metin geçersiz.');return v;};
 const valid=(o)=>{if(o===undefined)return {};if(!obj(o)||Object.keys(o).length>100)throw Error('Kamp kayıtları geçersiz.');return o;};
 for(const [sub,s] of Object.entries(valid(old.courseSources))){
  if(!belongs(sub)||!obj(s)||!/^PL[A-Za-z0-9_-]{8,100}$/.test(s.playlistId))throw Error('Kamp bağlantısı bu sınavla eşleşmiyor.');
  out.courseSources[sub]={playlistId:s.playlistId,title:txt(s.title,180),teacher:txt(s.teacher,100)};
 }
 for(const [sub,note] of Object.entries(valid(old.courseNotes))){if(!belongs(sub))throw Error('Kamp notu başka sınava ait.');out.courseNotes[sub]=txt(note,4000);}
 for(const [sub,records] of Object.entries(valid(old.courseProgress))){
  if(!belongs(sub))throw Error('Kamp konumu başka sınava ait.');out.courseProgress[sub]={};
  for(const [pid,r] of Object.entries(valid(records))){
   if(!/^PL[A-Za-z0-9_-]{8,100}$/.test(pid)||!obj(r)||!Number.isInteger(r.index)||r.index<0||r.index>10000||!Number.isInteger(r.second)||r.second<0||r.second>604800||! /^[A-Za-z0-9_-]{11}$/.test(r.videoId||''))throw Error('Kamp video konumu geçersiz.');
   out.courseProgress[sub][pid]={videoId:r.videoId,index:r.index,second:r.second};
  }
 }
 return out;
}
root.RotaTurkish={DATA,SERIES,SOURCES,options,preferred,validLegacyPreference,validatePreferences,orderedTopics,parsePlaylist,validateCourseData};
if(typeof module==='object')module.exports=root.RotaTurkish;
})(typeof window!=='undefined'?window:globalThis);


