(function(root){
'use strict';

const SCHEMA='calisma-rotasi-kpss-content-blueprint-v2';
const VERSION=2;
const TOPIC_TESTS_PER_TOPIC=4;
const QUESTIONS_PER_TOPIC_TEST=12;
const SECTION_EXAMS_PER_SUBJECT=5;
const COPYRIGHT_POLICY='original-only';

const OFFICIAL_SCOPE=Object.freeze({
  exam:'2026-KPSS Lisans Genel Yetenek-Genel Kültür',
  totalQuestions:120,
  generalAbility:{questions:60,verbalPct:50,numericPct:50},
  generalCulture:{
    questions:60,
    historyPct:45,
    geographyPct:30,
    citizenshipPct:15,
    generalCurrentPct:10,
    historySubscope:{preOttomanPct:5,ottomanPct:15,ataturkReformPct:20,contemporaryPct:5},
    geographySubscope:{physicalPct:12,humanPct:5,economicPct:13},
    citizenshipSubscope:{lawIntroPct:5,constitutionRightsPct:5,administrationPct:5}
  },
  note:'Yüzdeler ÖSYM kapsam ağırlığıdır. Alt konu bazındaki kesin soru sayıları resmî garanti değildir.'
});

const SUBJECTS=Object.freeze({
  'k-tr':{name:'Türkçe',sectionQuestions:30,trendBasis:'multi-year-approx',topicWeights:{
    'k-tr-1':1,'k-tr-2':2,'k-tr-3':15,'k-tr-4':4,'k-tr-5':1,'k-tr-6':1,'k-tr-7':1,'k-tr-8':4,'k-tr-9':1,'k-tr-10':0,'k-tr-11':0
  }},
  'k-ma':{name:'Matematik ve geometri',sectionQuestions:30,trendBasis:'multi-year-approx',topicWeights:{
    'k-ma-1':1,'k-ma-2':2,'k-ma-3':1,'k-ma-4':1,'k-ma-5':2,'k-ma-6':2,'k-ma-7':3,'k-ma-8':1,'k-ma-9':5,'k-ma-10':1,'k-ma-11':1,'k-ma-12':6,'k-ma-13':1,'k-ma-14':1,'k-ma-15':1,'k-ma-16':1,'k-ma-17':0
  }},
  'k-ta':{name:'Tarih',sectionQuestions:27,trendBasis:'official-scope-plus-rotation',groups:[
    {id:'preOttoman',questions:3,topics:['k-ta-1','k-ta-2','k-ta-3']},
    {id:'ottoman',questions:9,topics:['k-ta-4','k-ta-5','k-ta-6','k-ta-7','k-ta-8']},
    {id:'ataturkReform',questions:12,topics:['k-ta-9','k-ta-10','k-ta-11','k-ta-12']},
    {id:'contemporary',questions:3,topics:['k-ta-13']}
  ]},
  'k-co':{name:'Coğrafya',sectionQuestions:18,trendBasis:'official-scope-plus-rotation',groups:[
    {id:'physical',questions:7,topics:['k-co-1','k-co-2','k-co-3','k-co-4']},
    {id:'human',questions:3,topics:['k-co-5','k-co-6']},
    {id:'economic',questions:8,topics:['k-co-7','k-co-8','k-co-9','k-co-10','k-co-11','k-co-12']}
  ]},
  'k-va':{name:'Vatandaşlık',sectionQuestions:9,trendBasis:'official-scope-plus-rotation',groups:[
    {id:'lawIntro',questions:3,topics:['k-va-1']},
    {id:'constitutionRights',questions:3,topics:['k-va-2','k-va-3','k-va-4','k-va-5','k-va-6','k-va-7']},
    {id:'administration',questions:3,topics:['k-va-8']}
  ]},
  'k-gu':{name:'Güncel Bilgiler',sectionQuestions:6,trendBasis:'category-rotation-current',groups:[
    {id:'developments',questions:2,topics:['k-gu-1']},
    {id:'institutions',questions:2,topics:['k-gu-2']},
    {id:'cultureSport',questions:2,topics:['k-gu-3']}
  ]}
});

const TEST_PROFILES=Object.freeze([
  {setNo:1,label:'Temel kazanım + bağlam',difficulty:{easy:3,medium:7,hard:2},intent:'foundation'},
  {setNo:2,label:'Bağlam ve ayırt etme',difficulty:{easy:2,medium:7,hard:3},intent:'context'},
  {setNo:3,label:'Karma ve güçlü çeldirici',difficulty:{easy:2,medium:6,hard:4},intent:'discrimination'},
  {setNo:4,label:'Sınav provası',difficulty:{easy:1,medium:7,hard:4},intent:'exam-simulation'}
]);

const SECTION_PROFILES=Object.freeze([
  {sectionNo:1,label:'Orta seviye',difficulty:{easy:6,medium:18,hard:6}},
  {sectionNo:2,label:'Orta seviye · farklı dağılım',difficulty:{easy:5,medium:19,hard:6}},
  {sectionNo:3,label:'Gerçek KPSS dengesi',difficulty:{easy:5,medium:18,hard:7}},
  {sectionNo:4,label:'Orta-zor',difficulty:{easy:4,medium:18,hard:8}},
  {sectionNo:5,label:'Seçici final',difficulty:{easy:3,medium:18,hard:9}}
]);

function text(v){return String(v??'').replace(/\s+/g,' ').trim();}
function topicKey(subjectId,topicId){return subjectId+'|'+topicId;}
function slug(v){return text(v).toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ö/g,'o').replace(/ç/g,'c').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}
function topicTestId(subjectId,topicId,setNo){return ['kpss',subjectId,topicId,'t'+String(setNo).padStart(2,'0')].join(':');}
function topicPlan(catalog){
  const subjects=(catalog?.subjects||[]).filter(s=>s.exam==='kpss'&&SUBJECTS[s.id]);
  return subjects.flatMap(subject=>subject.topics.map(topic=>({
    subjectId:subject.id,
    subjectName:subject.name,
    topicId:topic.id,
    topicTitle:topic.title,
    tests:TEST_PROFILES.map(p=>({
      id:topicTestId(subject.id,topic.id,p.setNo),
      setNo:p.setNo,
      title:'KPSS '+subject.name+' · '+topic.title+' · Test '+p.setNo,
      questionTarget:QUESTIONS_PER_TOPIC_TEST,
      profile:p
    })),
    totalQuestionTarget:TOPIC_TESTS_PER_TOPIC*QUESTIONS_PER_TOPIC_TEST
  })));
}
function distributeGroup(group,variant=0){
  const topics=group.topics,base=Math.floor(group.questions/topics.length),extra=group.questions-base*topics.length;
  const rows=topics.map((topicId,i)=>({topicId,count:base+(((i-variant)%topics.length+topics.length)%topics.length<extra?1:0)}));
  return rows;
}
function weightedBlueprint(subjectId,variant=0){
  const def=SUBJECTS[subjectId];if(!def)return [];
  if(def.topicWeights){
    const rows=Object.entries(def.topicWeights).map(([topicId,count])=>({topicId,count}));
    const deltaPattern=[
      [],
      [['k-tr-3',-1],['k-tr-1',1],['k-tr-8',-1],['k-tr-10',1],['k-ma-9',-1],['k-ma-1',1]],
      [['k-tr-3',1],['k-tr-8',-2],['k-tr-10',1],['k-ma-12',-1],['k-ma-9',1]],
      [['k-tr-4',-1],['k-tr-2',1],['k-tr-8',-1],['k-tr-10',1],['k-ma-9',-1],['k-ma-7',1]],
      [['k-tr-3',-1],['k-tr-11',1],['k-ma-12',-1],['k-ma-9',1]]
    ][variant%5];
    for(const [topicId,delta] of deltaPattern){const row=rows.find(x=>x.topicId===topicId);if(row)row.count=Math.max(0,row.count+delta);}
    return rows;
  }
  return def.groups.flatMap((g,i)=>distributeGroup(g,(variant+i)%g.topics.length));
}
function sectionBlueprint(subjectId,variant=0){
  const def=SUBJECTS[subjectId];if(!def)throw new Error('Bilinmeyen KPSS dersi: '+subjectId);
  const rows=weightedBlueprint(subjectId,variant).filter(x=>x.count>0);
  const total=rows.reduce((n,x)=>n+x.count,0);
  if(total!==def.sectionQuestions)throw new Error('Bölüm blueprint toplamı hatalı: '+subjectId+' v'+variant+' = '+total);
  return {id:'kpss-section:'+subjectId+':'+String(variant+1).padStart(2,'0'),subjectId,variant:variant+1,questionTarget:def.sectionQuestions,rows};
}
function sectionPlans(){return Object.keys(SUBJECTS).flatMap(subjectId=>Array.from({length:SECTION_EXAMS_PER_SUBJECT},(_,i)=>sectionBlueprint(subjectId,i)));}
function totals(catalog){
  const topics=topicPlan(catalog);
  const topicQuestions=topics.length*TOPIC_TESTS_PER_TOPIC*QUESTIONS_PER_TOPIC_TEST;
  const sectionQuestions=Object.values(SUBJECTS).reduce((n,s)=>n+s.sectionQuestions*SECTION_EXAMS_PER_SUBJECT,0);
  return {topics:topics.length,topicTests:topics.length*TOPIC_TESTS_PER_TOPIC,topicQuestions,sectionExams:Object.keys(SUBJECTS).length*SECTION_EXAMS_PER_SUBJECT,sectionQuestions,totalQuestions:topicQuestions+sectionQuestions};
}

root.RotaKpssContentBlueprint={SCHEMA,VERSION,COPYRIGHT_POLICY,OFFICIAL_SCOPE,SUBJECTS,TEST_PROFILES,SECTION_PROFILES,TOPIC_TESTS_PER_TOPIC,QUESTIONS_PER_TOPIC_TEST,SECTION_EXAMS_PER_SUBJECT,topicKey,slug,topicTestId,topicPlan,sectionBlueprint,sectionPlans,totals};
if(typeof module==='object')module.exports=root.RotaKpssContentBlueprint;
})(typeof window!=='undefined'?window:globalThis);
