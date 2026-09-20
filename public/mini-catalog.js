(function(root){
'use strict';

const SCHEMA='calisma-rotasi-mini-catalog-v1';
const TARGET_SETS_PER_TOPIC=4;

function text(v,max=180){return String(v??'').replace(/\s+/g,' ').trim().slice(0,max);}
function slug(v){
  return text(v,220).toLocaleLowerCase('tr-TR')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/ı/g,'i').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120);
}
function seriesId(def){
  return [def?.exam,def?.subjectId,slug(def?.topicTitle)].filter(Boolean).join(':');
}
function inferSetNo(def){
  if(Number.isInteger(def?.setNo)&&def.setNo>=1&&def.setNo<=99)return def.setNo;
  const title=String(def?.title||''),id=String(def?.id||'');
  const tm=title.match(/#\s*(\d{1,2})\b/),im=id.match(/-(\d{2})$/);
  const n=tm?Number(tm[1]):im?Number(im[1]):1;
  return Number.isInteger(n)&&n>=1&&n<=99?n:1;
}
function normalize(def){
  if(!def||typeof def!=='object')throw new Error('Mini tanımı geçersiz.');
  if(!def.id||!def.exam||!def.subjectId||!def.topicTitle)throw new Error('Mini tanımında kimlik/ders/konu eksik.');
  if(!Array.isArray(def.questions)||!def.questions.length)throw new Error('Mini soru seti boş olamaz.');
  const setNo=inferSetNo(def);
  return {
    ...def,
    catalogSchema:SCHEMA,
    seriesId:seriesId(def),
    setNo,
    variant:def.variant||('set-'+String(setNo).padStart(2,'0')),
    sourceKind:'original',
    original:true
  };
}
function groups(definitions){
  const ids=new Set(),map=new Map();
  for(const raw of definitions||[]){
    const def=normalize(raw);
    if(ids.has(def.id))throw new Error('Mini id tekrar ediyor: '+def.id);
    ids.add(def.id);
    const key=def.seriesId,x=map.get(key)||{seriesId:key,exam:def.exam,subjectId:def.subjectId,topicTitle:def.topicTitle,sets:[]};
    if(x.sets.some(s=>s.setNo===def.setNo))throw new Error('Aynı konu serisinde set numarası tekrar ediyor: '+key);
    x.sets.push(def);map.set(key,x);
  }
  return [...map.values()].map(g=>({...g,sets:g.sets.sort((a,b)=>a.setNo-b.setNo)}));
}
function describe(def,definitions){
  const normalized=normalize(def),group=groups(definitions).find(g=>g.seriesId===normalized.seriesId);
  const availableSets=group?.sets.map(x=>x.setNo)||[normalized.setNo];
  const missingSets=[];
  for(let n=1;n<=TARGET_SETS_PER_TOPIC;n++)if(!availableSets.includes(n))missingSets.push(n);
  return {
    seriesId:normalized.seriesId,
    setNo:normalized.setNo,
    variant:normalized.variant,
    sourceKind:'original',
    availableSets,
    availableCount:availableSets.length,
    targetSets:TARGET_SETS_PER_TOPIC,
    missingSets,
    nextSetNo:missingSets[0]||null
  };
}
function coverage(definitions,{exam='',subjectIds=[]}={}){
  const allowed=new Set(subjectIds||[]);
  const rows=groups(definitions).filter(g=>(!exam||g.exam===exam)&&(!allowed.size||allowed.has(g.subjectId)));
  const sets=rows.reduce((n,g)=>n+g.sets.length,0);
  const ready3=rows.filter(g=>g.sets.length>=3).length;
  const ready4=rows.filter(g=>g.sets.length>=TARGET_SETS_PER_TOPIC).length;
  return {
    schema:SCHEMA,
    topics:rows.length,
    sets,
    targetSetsPerTopic:TARGET_SETS_PER_TOPIC,
    ready3,
    ready4,
    missingSetSlots:rows.reduce((n,g)=>n+Math.max(0,TARGET_SETS_PER_TOPIC-g.sets.length),0)
  };
}
function nextSetTemplate(definitions,def){
  const info=describe(def,definitions);
  if(!info.nextSetNo)return null;
  return {
    seriesId:info.seriesId,
    setNo:info.nextSetNo,
    idPrefix:String(def.id||'').replace(/-\d{2}$/,''),
    titlePrefix:String(def.title||'').replace(/#\s*\d{1,2}\b/,'').trim(),
    exam:def.exam,
    subjectId:def.subjectId,
    topicTitle:def.topicTitle,
    sourceKind:'original',
    copyrightPolicy:'original-only'
  };
}

root.RotaMiniCatalog={SCHEMA,TARGET_SETS_PER_TOPIC,seriesId,inferSetNo,normalize,groups,describe,coverage,nextSetTemplate};
if(typeof module==='object')module.exports=root.RotaMiniCatalog;
})(typeof window!=='undefined'?window:globalThis);
