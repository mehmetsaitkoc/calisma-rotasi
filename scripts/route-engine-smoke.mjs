import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');

function between(start,end){
  const a=html.indexOf(start),b=html.indexOf(end,a);
  assert.ok(a>=0 && b>a,`Missing source markers: ${start} -> ${end}`);
  return html.slice(a,b);
}

// 1) Every executable inline script must parse.
let parsed=0;
for(const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){
  const attrs=match[1]||'',js=match[2]||'';
  if(/application\/(?:ld\+json|json)/.test(attrs)||!js.trim())continue;
  new Function(js);
  parsed++;
}
assert.ok(parsed>=5,'Expected executable inline scripts');

// 2) Subject/topic methodology must classify materially different study modes.
{
  const src=between('function routeStudyMethod','function routeMethodLoad');
  const topics={
    't-tr-3':'Paragraf',
    'k-tr-4':'Sözel mantık',
    'k-ma-13':'Üçgenler',
    'd-yd-1':'Kelime çalışması',
    'a-ed-8':'Servetifünun',
    'k-ta-5':'Osmanlı yükselme dönemi',
    't-co-4':'Harita bilgisi',
    't-fi-4':'İş, güç ve enerji'
  };
  const R={topic:(_space,id)=>topics[id]?{title:topics[id]}:null};
  const w=()=>({});
  const method=new Function('R','w',src+';return routeStudyMethod;')(R,w);
  assert.equal(method('t-tr','t-tr-3').key,'paragraph');
  assert.equal(method('k-tr','k-tr-4').key,'logic');
  assert.equal(method('k-ma','k-ma-13').key,'geometry');
  assert.equal(method('d-yd','d-yd-1').key,'ydt_vocab');
  assert.equal(method('a-ed','a-ed-8').key,'literature');
  assert.equal(method('k-ta','k-ta-5').key,'history');
  assert.equal(method('t-co','t-co-4').key,'geography');
  assert.equal(method('t-fi','t-fi-4').key,'science');
}

// 2b) Review labels must distinguish repair, normal review and earned challenge.
{
  const src=between('function routeSourceLabel','function routeExamWeakness');
  const api=new Function(src+';return {routeTaskSourceLabel};')();
  assert.equal(api.routeTaskSourceLabel({source:'spaced_review',reviewWave:1}),'1 GÜN ONARIMI');
  assert.equal(api.routeTaskSourceLabel({source:'spaced_review',reviewWave:3}),'3 GÜN TEKRARI');
  assert.equal(api.routeTaskSourceLabel({source:'spaced_review',reviewWave:3,reviewVariant:'challenge'}),'SEVİYE YOKLAMA');
}

// 3) Adaptive dosage must react differently to struggle, strong performance and friction.
{
  const src=between('function routeOutcomeSignal','function routeCandidateFromPlan');
  function evaluate({logs=[],behavior,weak={},mistakes=[]}){
    const space={logs,mistakes};
    const R={dayAdd:()=> '2026-08-29'};
    const today=()=> '2026-09-19';
    const w=()=>space;
    const routeBehaviorSignal=()=>behavior;
    const routeExamWeakness=()=>weak;
    const api=new Function('R','today','w','routeBehaviorSignal','routeExamWeakness',src+';return {routeSubjectAdaptiveState};')(R,today,w,routeBehaviorSignal,routeExamWeakness);
    return api.routeSubjectAdaptiveState('k-ma');
  }

  const struggle=evaluate({
    logs:[
      {subjectId:'k-ma',sessionId:'a',date:'2026-09-18',outcome:'stuck',correct:6,wrong:6},
      {subjectId:'k-ma',sessionId:'b',date:'2026-09-17',outcome:'ok',correct:5,wrong:5}
    ],
    behavior:{known:true,total:4,completion:.9,friction:.1},
    weak:{'k-ma':{ratio:.8}}
  });
  assert.equal(struggle.mode,'repair');

  const strong=evaluate({
    logs:[
      {subjectId:'k-ma',sessionId:'a',date:'2026-09-18',outcome:'strong',correct:18,wrong:2},
      {subjectId:'k-ma',sessionId:'b',date:'2026-09-17',outcome:'strong',correct:17,wrong:3},
      {subjectId:'k-ma',sessionId:'c',date:'2026-09-16',outcome:'ok',correct:16,wrong:4}
    ],
    behavior:{known:true,total:5,completion:.85,friction:.08},
    weak:{'k-ma':{ratio:.8}}
  });
  assert.equal(strong.mode,'progress');

  const friction=evaluate({
    logs:[{subjectId:'k-ma',sessionId:'a',date:'2026-09-18',outcome:'strong',correct:18,wrong:2}],
    behavior:{known:true,total:4,completion:.35,friction:.55},
    weak:{'k-ma':{ratio:.8}}
  });
  assert.equal(friction.mode,'ease');

  const oneBad=evaluate({
    logs:[{subjectId:'k-ma',sessionId:'a',date:'2026-09-18',outcome:'stuck',correct:7,wrong:3}],
    behavior:{known:false,total:1,completion:1,friction:0},
    weak:{'k-ma':{ratio:.8}}
  });
  assert.equal(oneBad.mode,'steady','A single bad session must not overreact into repair');

  const oneGood=evaluate({
    logs:[{subjectId:'k-ma',sessionId:'a',date:'2026-09-18',outcome:'strong',correct:9,wrong:1}],
    behavior:{known:false,total:1,completion:1,friction:0},
    weak:{'k-ma':{ratio:.8}}
  });
  assert.equal(oneGood.mode,'steady','A single good session must not overreact into progress');

  // Topic evidence must override broad subject history when it exists.
  {
    const space={
      plan:[
        {id:'s1',subjectId:'k-ma',topicId:'topic-1'},
        {id:'s2',subjectId:'k-ma',topicId:'topic-2'},
        {id:'s3',subjectId:'k-ma',topicId:'topic-2'}
      ],
      logs:[
        {subjectId:'k-ma',sessionId:'s1',date:'2026-09-18',outcome:'stuck',correct:5,wrong:5},
        {subjectId:'k-ma',sessionId:'s2',date:'2026-09-18',outcome:'strong',correct:9,wrong:1},
        {subjectId:'k-ma',sessionId:'s3',date:'2026-09-17',outcome:'strong',correct:9,wrong:1}
      ],
      mistakes:[]
    };
    const R={dayAdd:()=> '2026-08-29',topic:(_w,id)=>['topic-1','topic-2'].includes(id)?{id}:null};
    const today=()=> '2026-09-19';
    const w=()=>space;
    const routeBehaviorSignal=(_subject,topic='')=>topic==='topic-2'?{known:true,total:4,completion:.9,friction:.05}:{known:false,total:0,completion:0,friction:0};
    const routeExamWeakness=()=>({'k-ma':{ratio:.8}});
    const adaptive=new Function('R','today','w','routeBehaviorSignal','routeExamWeakness',src+';return routeSubjectAdaptiveState;')(R,today,w,routeBehaviorSignal,routeExamWeakness);
    const weakTopic=adaptive('k-ma','topic-1');
    const strongTopic=adaptive('k-ma','topic-2');
    assert.equal(weakTopic.mode,'repair');
    assert.equal(weakTopic.scope,'topic');
    assert.equal(strongTopic.mode,'progress');
    assert.equal(strongTopic.scope,'topic');
  }
}


// 4) Recent learning evidence must outweigh stale history without erasing it.
{
  const src=between('function routeOutcomeSignal','function routeDifficultyLabel');
  const space={
    logs:[
      {id:'recent-1',subjectId:'k-ma',sessionId:'a',date:'2026-09-18',correct:9,wrong:1,outcome:'strong',updated:3},
      {id:'recent-2',subjectId:'k-ma',sessionId:'b',date:'2026-09-17',correct:9,wrong:1,outcome:'strong',updated:2},
      {id:'old',subjectId:'k-ma',sessionId:'c',date:'2026-09-16',correct:10,wrong:40,outcome:'stuck',updated:1}
    ],
    plan:[]
  };
  const R={dayAdd:()=> '2026-08-29'};
  const today=()=> '2026-09-19';
  const w=()=>space;
  const api=new Function('R','today','w',src+';return {routeOutcomeSignal,routePracticeSignal};')(R,today,w);
  const practice=api.routePracticeSignal('k-ma');
  const outcome=api.routeOutcomeSignal('k-ma');
  assert.ok(practice.weightedAccuracy>practice.accuracy,'Recent good sessions should weigh more than an older large bad set');
  assert.ok(outcome.trend>0,'Recent strong feedback should produce a positive recency trend');
}

// 4) Difficulty cause must be retrievable and must alter the study prescription.
{
  const src=between('function routeDifficultyLabel','function routeSubjectAdaptiveState');
  const space={
    logs:[
      {id:'d1',subjectId:'k-ma',sessionId:'a',date:'2026-09-18',difficulty:'speed',updated:2},
      {id:'d2',subjectId:'k-ma',sessionId:'b',date:'2026-09-17',difficulty:'process',updated:1}
    ],
    plan:[]
  };
  const R={dayAdd:()=> '2026-08-29',topic:()=>null};
  const today=()=> '2026-09-19';
  const w=()=>space;
  const routeStudyMethod=()=>({key:'quant',label:'SORU + YANLIŞ ANALİZİ'});
  const api=new Function('R','today','w','routeStudyMethod',src+';return {routeDifficultySignal,routeDifficultyPrescription};')(R,today,w,routeStudyMethod);
  const signal=api.routeDifficultySignal('k-ma');
  assert.equal(signal.recent,'speed');
  assert.match(api.routeDifficultyPrescription('k-ma','','Problemler','speed'),/süre/i);
  assert.match(api.routeDifficultyPrescription('k-ma','','Problemler','process'),/adım|işlem/i);
}

// 4) Task duration must fit the student's effective daily capacity.
{
  const src=between('function routeHeavyLimit','function routeQuestionTarget');
  const w=()=>({});
  const routeEffectiveDailyMinutes=()=>30;
  const api=new Function('w','routeEffectiveDailyMinutes',src+';return {routeMaxTaskMinutes};')(w,routeEffectiveDailyMinutes);
  assert.equal(api.routeMaxTaskMinutes(),25,'30 min daily capacity must leave room for the 5 min break');
}

// 4) Topic frontier keeps curriculum order and prevents deep-topic flooding.
{
  const src=between('function routeTopicFrontier','function routeBuildCandidates');
  const subjects=()=>[{id:'k-ma'},{id:'k-ta'}];
  const catalog=[
    {id:'m1',subjectId:'k-ma'},{id:'m2',subjectId:'k-ma'},{id:'m3',subjectId:'k-ma'},{id:'m4',subjectId:'k-ma'},
    {id:'t1',subjectId:'k-ta'},{id:'t2',subjectId:'k-ta'},{id:'t3',subjectId:'k-ta'}
  ];
  const space={topicState:{m1:{status:2},m3:{status:1}},settings:{priorities:['k-ma']}};
  const R={allTopics:()=>catalog};
  const state={activeExam:'kpss'};
  const routeProfileSignal=id=>({level:id==='k-ma'?1:2});
  const frontier=new Function('R','state','subjects','routeProfileSignal',src+';return routeTopicFrontier;')(R,state,subjects,routeProfileSignal);
  const picked=frontier(space,catalog.filter(t=>(space.topicState[t.id]?.status||0)!==2));
  assert.deepEqual(picked.filter(t=>t.subjectId==='k-ma').map(t=>t.id),['m3','m2','m4']);
  assert.deepEqual(picked.filter(t=>t.subjectId==='k-ta').map(t=>t.id),['t1','t2']);
}

// 4) Normal review load is capped, while urgent repair work can bypass that cap.
{
  const src=between('function routeIsReviewLike','function routeQuestionTarget');
  const api=new Function(src+';return {routeIsReviewLike,routeIsCriticalReview,routeReviewDailyLimit,routeReviewWeeklyLimit};')();
  assert.equal(api.routeIsReviewLike({source:'spaced_review',kind:'review'}),true);
  assert.equal(api.routeIsCriticalReview({source:'spaced_review',reviewWave:1,priority:78}),true);
  assert.equal(api.routeIsCriticalReview({source:'spaced_review',reviewWave:3,priority:68}),false);
  assert.equal(api.routeIsCriticalReview({source:'mistake',priority:88}),true);
  assert.equal(api.routeReviewDailyLimit(30),30);
  assert.equal(api.routeReviewDailyLimit(120),60);
  assert.equal(api.routeReviewWeeklyLimit(150),70);
}

// 4) Topic mastery suggestion requires learning + both review waves + repeated evidence.
{
  const src=between('function routeTopicMasterySignal','function routeClearCompletedTopicQueue');
  const space={
    plan:[
      {id:'base',done:true,topicId:'topic-1',source:'curriculum'},
      {id:'r3',done:true,topicId:'topic-1',source:'spaced_review',reviewWave:3},
      {id:'r7',done:true,topicId:'topic-1',source:'spaced_review',reviewWave:7}
    ],
    mistakes:[]
  };
  const R={topic:(_w,id)=>id==='topic-1'?{id,subjectId:'k-ma'}:null};
  const w=()=>space;
  let outcome={known:false,total:0,recent:'',trend:0,stuckRate:0};
  let practice={known:true,sessions:1,answered:20,weightedAccuracy:.90,accuracy:.90,recentAccuracy:.90};
  const routeOutcomeSignal=()=>outcome;
  const routePracticeSignal=()=>practice;
  const mastery=new Function('R','w','routeOutcomeSignal','routePracticeSignal',src+';return routeTopicMasterySignal;')(R,w,routeOutcomeSignal,routePracticeSignal);

  const oneSet=mastery('topic-1');
  assert.equal(oneSet.ready,false,'One strong practice set must not be enough for mastery');
  assert.equal(oneSet.progress,3);
  assert.equal(oneSet.next,'En az 2 performans kaydı');

  practice={known:true,sessions:2,answered:35,weightedAccuracy:.84,accuracy:.83,recentAccuracy:.82};
  const ready=mastery('topic-1');
  assert.equal(ready.ready,true);
  assert.equal(ready.progress,4);
  assert.equal(ready.next,'Tamamlanmaya hazır');

  space.mistakes.push({topicId:'topic-1',resolved:false});
  const blocked=mastery('topic-1');
  assert.equal(blocked.ready,false);
  assert.equal(blocked.next,'Açık yanlışı çöz');

  space.mistakes=[];
  practice={known:false,sessions:0,answered:0,weightedAccuracy:0,accuracy:0,recentAccuracy:0};
  outcome={known:true,total:2,recent:'ok',trend:.2,stuckRate:0};
  assert.equal(mastery('topic-1').ready,true,'Two consistent feedback records may validate mastery when practice detail is unavailable');
}

// 4) Guard core personalization features against accidental removal.
for(const marker of [
  'routeObservedNet',
  'routeStageGap',
  'routeConsistencySignal',
  'routePracticeSignal',
  'weightedAccuracy',
  'routeDifficultySignal',
  'routeDifficultyPrescription',
  'Tekrar odağı:',
  "reviewVariant:'challenge'",
  'SEVİYE YOKLAMA',
  'challengeReady',
  "practiceAnswered>=8&&practiceAccuracy>=.85",
  'Zorlandıysan en çok nerede?',
  'Sinyal güveni',
  'const waves=needsRepair?[1,3,7]:[3,7]',
  'routeHeavyLimit',
  'routeMaxTaskMinutes',
  'routePaceSignal',
  'TAKVİM SIKIŞIK',
  'routeTopicFrontier',
  'routeSequenceRank',
  'routeReviewDailyLimit',
  'routeReviewWeeklyLimit',
  'routeIsCriticalReview',
  'latestBaseByTopic',
  'recentWorkedTopics',
  'routeTopicMasterySignal',
  'routeClearCompletedTopicQueue',
  "p.reviewWave===1?'mistake'",
  '(space.topicState[p.topicId]?.status||0)!==2',
  'topic-accept-mastery',
  'topic-mastery-steps',
  'function routeMasteryOverview()',
  'performans kanıtı bekliyor',
  'En az 2 performans kaydı',
  'SÜRELİ ANLAMA SETİ',
  'ZAMAN ÇİZGİSİ + HATIRLAMA'
]) assert.ok(html.includes(marker),`Missing personalization marker: ${marker}`);

console.log('Route engine smoke tests passed.');
