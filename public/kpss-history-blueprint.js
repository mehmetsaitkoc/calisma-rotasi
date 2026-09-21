(function(root){
'use strict';
const SCHEMA='calisma-rotasi-kpss-history-blueprint-v1';
const VERSION=1;
const SUBJECT_ID='k-ta';
const TOPIC_TESTS_PER_TOPIC=3;
const QUESTIONS_PER_TOPIC_TEST=12;
const SECTION_EXAMS=3;
const HISTORY_TEST_PROFILES=Object.freeze([
 {setNo:1,label:'Kazanım + bağlantı',difficulty:{easy:3,medium:7,hard:2},intent:'foundation-context'},
 {setNo:2,label:'ÖSYM dengesi',difficulty:{easy:2,medium:7,hard:3},intent:'exam-balance'},
 {setNo:3,label:'Seçici yorum',difficulty:{easy:1,medium:7,hard:4},intent:'discrimination-reasoning'}
]);
const HISTORY_SECTION_PROFILES=Object.freeze([
 {sectionNo:1,label:'Orta / gerçek sınav dengesi',difficulty:{easy:5,medium:17,hard:5}},
 {sectionNo:2,label:'Orta-zor / farklı rotasyon',difficulty:{easy:4,medium:17,hard:6}},
 {sectionNo:3,label:'Seçici final',difficulty:{easy:3,medium:17,hard:7}}
]);
const SECTION_BLUEPRINTS=Object.freeze([
 [
  ['k-ta-1',1],['k-ta-2',1],['k-ta-3',1],
  ['k-ta-4',2],['k-ta-5',2],['k-ta-6',2],['k-ta-7',2],['k-ta-8',1],
  ['k-ta-9',3],['k-ta-10',3],['k-ta-11',3],['k-ta-12',3],['k-ta-13',3]
 ],
 [
  ['k-ta-1',1],['k-ta-2',1],['k-ta-3',1],
  ['k-ta-4',2],['k-ta-5',1],['k-ta-6',2],['k-ta-7',2],['k-ta-8',2],
  ['k-ta-9',2],['k-ta-10',4],['k-ta-11',3],['k-ta-12',3],['k-ta-13',3]
 ],
 [
  ['k-ta-1',1],['k-ta-2',1],['k-ta-3',1],
  ['k-ta-4',1],['k-ta-5',2],['k-ta-6',2],['k-ta-7',2],['k-ta-8',2],
  ['k-ta-9',3],['k-ta-10',2],['k-ta-11',4],['k-ta-12',3],['k-ta-13',3]
 ]
]);
function sectionBlueprint(sectionNo){
 const rows=SECTION_BLUEPRINTS[sectionNo-1];if(!rows)throw Error('Geçersiz Tarih bölüm denemesi: '+sectionNo);
 const total=rows.reduce((n,x)=>n+x[1],0);if(total!==27)throw Error('Tarih bölüm blueprint 27 soru olmalı: '+sectionNo+' = '+total);
 return {id:'kpss-history-section-'+String(sectionNo).padStart(2,'0'),subjectId:SUBJECT_ID,sectionNo,questionTarget:27,rows:rows.map(([topicId,count])=>({topicId,count}))};
}
function topicPlans(catalog){
 const subject=(catalog?.subjects||[]).find(s=>s.id===SUBJECT_ID);
 if(!subject)return [];
 return subject.topics.map(topic=>({subjectId:SUBJECT_ID,topicId:topic.id,topicTitle:topic.title,tests:HISTORY_TEST_PROFILES.map(p=>({setNo:p.setNo,questionTarget:12,profile:p})),totalQuestionTarget:36}));
}
function totals(catalog){
 const topics=topicPlans(catalog).length;
 return {topics,topicTests:topics*3,topicQuestions:topics*36,sectionExams:3,sectionQuestions:81,totalQuestions:topics*36+81};
}
root.RotaKpssHistoryBlueprint={SCHEMA,VERSION,SUBJECT_ID,TOPIC_TESTS_PER_TOPIC,QUESTIONS_PER_TOPIC_TEST,SECTION_EXAMS,HISTORY_TEST_PROFILES,HISTORY_SECTION_PROFILES,SECTION_BLUEPRINTS,sectionBlueprint,topicPlans,totals};
if(typeof module==='object')module.exports=root.RotaKpssHistoryBlueprint;
})(typeof window!=='undefined'?window:globalThis);
