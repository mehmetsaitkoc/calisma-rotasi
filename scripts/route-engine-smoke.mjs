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

// 4) Topic mastery suggestion requires learning + both review waves + evidence.
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
  const routeOutcomeSignal=()=>({known:true,recent:'strong',stuckRate:0});
  const routePracticeSignal=()=>({known:true,accuracy:.84});
  const mastery=new Function('R','w','routeOutcomeSignal','routePracticeSignal',src+';return routeTopicMasterySignal;')(R,w,routeOutcomeSignal,routePracticeSignal);
  assert.equal(mastery('topic-1').ready,true);
  space.mistakes.push({topicId:'topic-1',resolved:false});
  assert.equal(mastery('topic-1').ready,false);
}

// 4) Guard core personalization features against accidental removal.
for(const marker of [
  'routeObservedNet',
  'routeStageGap',
  'routeConsistencySignal',
  'routePracticeSignal',
  'Sinyal güveni',
  'const waves=needsRepair?[1,3,7]:[3,7]',
  'routeHeavyLimit',
  'latestBaseByTopic',
  'recentWorkedTopics',
  'routeTopicMasterySignal',
  'routeClearCompletedTopicQueue',
  'topic-accept-mastery',
  'SÜRELİ ANLAMA SETİ',
  'ZAMAN ÇİZGİSİ + HATIRLAMA'
]) assert.ok(html.includes(marker),`Missing personalization marker: ${marker}`);

console.log('Route engine smoke tests passed.');
