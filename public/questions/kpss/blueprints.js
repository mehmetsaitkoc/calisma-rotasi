(function(root){
'use strict';
// Editorial quotas tied to existing curriculum IDs, not a promise about ÖSYM topic counts.
const basis='Mevcut KPSS GY–GK ders toplamları korunur. Konu kotaları editoryal ürün planıdır; ÖSYM konu başına sabit sayı garantisi değildir. Zorluk, uygulama verisiyle henüz kalibre edilmemiştir.';
const source={url:'https://dokuman.osym.gov.tr/pdfdokuman/2026/KPSS/LISANS/kilavuz_Ld01072026.pdf',page:34,verifiedOn:'2026-09-23',note:'Tablo 1 yaklaşık alan ağırlıkları; tek tek konu kotaları editoryal tercihtir.'};
const subjects=[
 {id:'k-tr',lesson:'turkce',title:'Türkçe',total:30,counts:[3,3,13,3,1,1,1,1,1,1,2]},
 {id:'k-ma',lesson:'matematik',title:'Matematik',total:30,counts:[2,1,1,1,1,1,1,2,10,1,1,2,2,1,1,1,1]},
 {id:'k-ta',lesson:'tarih',title:'Tarih',total:27,counts:[1,1,1,2,2,2,3,2,3,3,3,1,3]},
 {id:'k-co',lesson:'cografya',title:'Coğrafya',total:18,counts:[1,2,2,2,2,1,2,2,1,1,1,1]},
 {id:'k-va',lesson:'vatandaslik',title:'Vatandaşlık',total:9,variants:[[3,0,0,1,1,1,0,3],[3,1,1,0,0,0,1,3],[3,0,0,1,1,0,1,3]]},
 {id:'k-gu',lesson:'guncel-bilgiler',title:'Güncel Bilgiler',total:6,counts:[2,2,2]}
];
const levels=['Dengeli','Seçici','KPSS Provası'];
const patterns=[['easy','medium','medium','hard'],['medium','hard','medium','easy','medium'],['hard','medium','hard','medium','easy']];
const sectionExams=subjects.flatMap(subject=>levels.map((level,i)=>{
 let position=0;const slots=[];
 (subject.variants?.[i]||subject.counts).forEach((count,j)=>{const groups=new Map();for(let k=0;k<count;k++){const d=patterns[i][position++%patterns[i].length];groups.set(d,(groups.get(d)||0)+1);}for(const [difficulty,n] of groups)slots.push({subjectId:subject.id,topicId:subject.id+'-'+(j+1),difficulty,count:n});});
 return {id:'kpss-'+subject.lesson+'-blueprint-'+(i+1),kind:'section',exam:'kpss',subjectId:subject.id,title:subject.title+' Deneme '+(i+1),variant:i+1,level,total:subject.total,penalty:4,version:1,basis,source,status:'planned',slots};
}));
const compositeExams=[
 {id:'kpss-gy-blueprint',kind:'general-ability',title:'Genel Yetenek Denemesi',total:60,slots:[{subjectId:'k-tr',count:30},{subjectId:'k-ma',count:30}]},
 {id:'kpss-gk-blueprint',kind:'general-culture',title:'Genel Kültür Denemesi',total:60,slots:[{subjectId:'k-ta',count:27},{subjectId:'k-co',count:18},{subjectId:'k-va',count:9},{subjectId:'k-gu',count:6}]},
 {id:'kpss-full-blueprint',kind:'full',title:'Tam KPSS Denemesi',total:120,slots:[{subjectId:'k-tr',count:30},{subjectId:'k-ma',count:30},{subjectId:'k-ta',count:27},{subjectId:'k-co',count:18},{subjectId:'k-va',count:9},{subjectId:'k-gu',count:6}]}
].map(b=>({...b,exam:'kpss',version:1,penalty:4,status:'planned',basis,source}));
function validate(catalog){
 const topics=new Map((catalog?.subjects||[]).map(s=>[s.id,new Set(s.topics.map(t=>t.id))]));
 for(const b of [...sectionExams,...compositeExams]){
  if(b.slots.reduce((n,s)=>n+s.count,0)!==b.total)throw new Error('Deneme kota toplamı hatalı: '+b.id);
  for(const s of b.slots)if(!topics.has(s.subjectId)||(s.topicId&&!topics.get(s.subjectId).has(s.topicId)))throw new Error('Deneme katalog bağlantısı hatalı: '+b.id);
 }
 return true;
}
root.RotaAssessmentBlueprints={basis,sectionExams,compositeExams,validate};
})(typeof window!=='undefined'?window:globalThis);
