import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
function between(a,b){
  const i=html.indexOf(a),j=html.indexOf(b,i+a.length);
  if(i<0||j<0)throw new Error('Pilot telemetry source marker missing: '+a+' / '+b);
  return html.slice(i,j);
}
const src=between('function routePilotDaysBetween','function routePilotExport');
let currentDate='2026-09-19',uid=0;
const dayAdd=(date,days)=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+days);return d.toISOString().slice(0,10);};
const iso=d=>{const x=d instanceof Date?d:new Date(d);return x.toISOString().slice(0,10);};
const space={
  settings:{track:'lisans'},
  route:{
    pilot:{version:1,enabled:false,participantId:'',startDate:'',startedAt:0,completedAt:0,snapshots:[]},
    modeHistory:[],
    interventions:[{id:'iv1',date:'2026-09-19',subjectId:'k-ma',topicId:'m1',mode:'repair'}]
  },
  plan:[
    {id:'t0',date:'2026-09-19',subjectId:'k-ma',topicId:'m1',minutes:25,targetQuestions:10,done:true},
    {id:'t7',date:'2026-09-26',subjectId:'k-ma',topicId:'m1',minutes:30,targetQuestions:12,done:true},
    {id:'t7skip',date:'2026-09-26',subjectId:'k-ma',topicId:'m1',minutes:20,targetQuestions:8,done:false},
    {id:'t7later',date:'2026-09-26',subjectId:'k-ma',topicId:'m1',minutes:15,targetQuestions:6,done:false},
    {id:'t14',date:'2026-10-03',subjectId:'k-ma',topicId:'m1',minutes:30,targetQuestions:12,done:false}
  ],
  logs:[
    {id:'l0',sessionId:'t0',date:'2026-09-19',subjectId:'k-ma',minutes:25,questions:10,correct:8,wrong:2}
  ],
  taskEvents:[{taskId:'t0',date:'2026-09-19',action:'complete',created:1}],
  mistakes:[],
  exams:[],
  topicState:{m1:{status:2}}
};
const w=()=>space,routeEnsure=()=>{},today=()=>currentDate;
const R={
  dayAdd,iso,uid:()=> 'pilot-'+(++uid),topic:(_w,id)=>id?{id,subjectId:'k-ma'}:null,
  allTopics:()=>[{id:'m1',subjectId:'k-ma'}],
  calcNet:(parts,penalty=4)=>({net:parts.reduce((n,p)=>n+(p.correct||0)-(p.wrong||0)/(penalty||1),0)})
};
const routePerformanceWindow=()=>({known:false});
const routeBehaviorWindow=()=>({known:false});
const routeEvaluateInterventionFromMetrics=()=>({status:'neutral',score:0,label:'n',reason:'n'});
const routeInterventionAggregateEvaluations=xs=>({status:xs.length?'neutral':'pending',score:0});
const routeStudentOverview=()=>[{subject:{id:'k-ma'},model:{performance:70,learningNeed:42,confidence:76,execution:68,retention:74,state:'steady',sourceCount:3,trend:{direction:'up'},personalNorm:{direction:'flat'},velocityKey:'steady'}}];
const routeTopicExamRisk=()=>({score:48});
const routeTopicMasteryScore=()=>({known:true,score:73});
const routeTopicForgettingSignal=()=>({known:true,reviewDue:false});
const state={activeExam:'kpss'};

const api=new Function(
  'routeEnsure','w','R','today','routePerformanceWindow','routeBehaviorWindow',
  'routeEvaluateInterventionFromMetrics','routeInterventionAggregateEvaluations',
  'routeStudentOverview','routeTopicExamRisk','routeTopicMasteryScore','routeTopicForgettingSignal','state','routePilotConfig',
  src+';return {routePilotSnapshot,routePilotAutoSnapshot,routePilotStart,routePilotPayload,routePilotModeSummary};'
)(
  routeEnsure,w,R,today,routePerformanceWindow,routeBehaviorWindow,
  routeEvaluateInterventionFromMetrics,routeInterventionAggregateEvaluations,
  routeStudentOverview,routeTopicExamRisk,routeTopicMasteryScore,routeTopicForgettingSignal,state,()=>space.route.pilot
);

api.routePilotStart();
assert.equal(space.route.pilot.snapshots.length,1,'Pilot start must capture day 0');
const d0=space.route.pilot.snapshots[0];
assert.equal(d0.checkpoint,0);
assert.equal(d0.milestoneDay,0);
assert.equal(d0.actualDay,0);
assert.equal(d0.windowStart,'2026-09-19');
assert.equal(d0.windowEnd,'2026-09-19');
assert.equal(d0.planned.tasks,1);
assert.equal(d0.planned.questions,10);
assert.equal(d0.actual.completedTasks,1);
assert.equal(d0.actual.skippedTasks,0);
assert.equal(d0.actual.laterTasks,0);
assert.equal(d0.actual.questions,10);
assert.equal(d0.actual.questionAttainmentRatio,1);
assert.equal(d0.actual.accuracy,80);
assert.equal(d0.actual.completion,100);
assert.equal(d0.student.performance,70,'Day 0 must fall back to current Student Model when mode history is empty');
assert.equal(d0.student.learningNeed,42);
assert.equal(d0.student.risk,48);
assert.equal(d0.student.confidence,76);
assert.equal(d0.student.execution,68);
assert.equal(d0.student.retention,74);
assert.equal(d0.student.state,'steady');
assert.equal(d0.student.trend,'up');
assert.equal(d0.student.personalNorm,'flat');
assert.equal(d0.student.velocity,'steady');
assert.equal(d0.mastery.completedTopics,1);
assert.equal(d0.mastery.mastery,73);
assert.equal(d0.mastery.forgettingDue,0);
assert.equal(d0.interventions.pending,1);
assert.equal(d0.dataQuality.capturedOnTime,true);
assert.equal(d0.dataQuality.studentModelExact,true);
assert.equal(d0.dataQuality.masteryExact,true);

space.logs.push({id:'l7',sessionId:'t7',date:'2026-09-26',subjectId:'k-ma',minutes:30,questions:10,correct:6,wrong:4});
space.taskEvents.push(
  {taskId:'t7',date:'2026-09-26',action:'complete',created:2},
  {taskId:'t7skip',date:'2026-09-26',action:'skip',created:3},
  {taskId:'t7later',date:'2026-09-26',action:'later',created:4}
);
space.route.modeHistory.push(
  {date:'2026-09-22',subjectId:'k-ma',topicId:'m1',mode:'steady',studentState:'steady',performance:71,learningNeed:39,risk:45,confidence:80,created:1},
  {date:'2026-09-26',subjectId:'k-ma',topicId:'m1',mode:'repair',studentState:'repair',performance:65,learningNeed:55,risk:59,confidence:88,created:2}
);
space.exams.push({id:'e1',date:'2026-09-25',penalty:4,parts:[{correct:70,wrong:20}]});
currentDate='2026-09-26';
assert.equal(api.routePilotAutoSnapshot(),true,'Day 7 must create a new snapshot');
const d7=space.route.pilot.snapshots.find(x=>x.checkpoint===7);
assert.ok(d7);
assert.equal(d7.actualDay,7);
assert.equal(d7.planned.tasks,4);
assert.equal(d7.planned.minutes,90);
assert.equal(d7.planned.questions,36);
assert.equal(d7.actual.completedTasks,2);
assert.equal(d7.actual.skippedTasks,1);
assert.equal(d7.actual.laterTasks,1);
assert.equal(d7.actual.minutes,55);
assert.equal(d7.actual.questions,20);
assert.equal(d7.actual.correct,14);
assert.equal(d7.actual.wrong,6);
assert.equal(d7.actual.accuracy,70);
assert.equal(d7.actual.completion,50);
assert.equal(d7.actual.questionAttainmentRatio,.556);
assert.equal(d7.modes.steady,1);
assert.equal(d7.modes.repair,1);
assert.equal(d7.modes.transitions,1);
assert.equal(d7.modes.current,'repair');
assert.equal(d7.student.state,'repair');
assert.equal(d7.student.performance,65);
assert.equal(d7.student.learningNeed,55);
assert.equal(d7.student.risk,59);
assert.equal(d7.student.execution,68);
assert.equal(d7.exam.count,1);
assert.equal(d7.exam.latestDate,'2026-09-25');
assert.equal(d7.interventions.neutral,1);
assert.equal(d7.interventions.horizons[7].neutral,1);
assert.equal(d7.interventions.horizons[14].neutral,0);
assert.equal(d7.dataQuality.capturedOnTime,true);

space.logs.push({id:'l14',sessionId:'t14',date:'2026-10-03',subjectId:'k-ma',minutes:30,questions:12,correct:10,wrong:2});
space.taskEvents.push({taskId:'t14',date:'2026-10-03',action:'complete',created:5});
currentDate='2026-10-05';
assert.equal(api.routePilotAutoSnapshot(),true,'Delayed opening must still create due day 14 snapshot');
const d14=space.route.pilot.snapshots.find(x=>x.checkpoint===14);
assert.ok(d14);
assert.equal(d14.targetDate,'2026-10-03');
assert.equal(d14.windowEnd,'2026-10-03');
assert.equal(d14.capturedDate,'2026-10-05');
assert.equal(d14.actualDay,16);
assert.equal(d14.delayDays,2);
assert.equal(d14.dataQuality.capturedOnTime,false);
assert.equal(d14.dataQuality.plannedExact,false,'Delayed historical plan must be explicitly marked non-exact');
assert.equal(d14.dataQuality.openMistakesExact,false);
assert.equal(d14.dataQuality.modeHistoryExact,false);
assert.equal(d14.dataQuality.interventionHistoryExact,false);
assert.equal(d14.dataQuality.studentModelExact,false);
assert.equal(d14.dataQuality.masteryExact,false);
assert.equal(d14.dataQuality.actualLogsExact,true);
assert.equal(d14.mistakes.openAtCapture,null,'Late snapshot must not fabricate historical open-mistake count');
assert.equal(d14.student.execution,null,'Late snapshot must not backfill current execution into history');
assert.equal(d14.student.retention,null);
assert.equal(d14.student.trend,'unknown');
assert.equal(d14.mastery.completedTopics,null);
assert.equal(d14.mastery.mastery,null);
assert.equal(d14.interventions.horizons[14].neutral,1);
assert.deepEqual(space.route.pilot.snapshots.map(x=>x.checkpoint),[0,7,14],'Later milestones must not overwrite earlier snapshots');
assert.equal(api.routePilotAutoSnapshot(),false,'Duplicate snapshot capture must be prevented');

const payload=api.routePilotPayload();
assert.equal(payload.schema,'calisma-rotasi-pilot-v1');
assert.equal(payload.participantId,'p-pilot-1');
assert.equal(payload.exam,'kpss');
assert.equal(payload.track,'lisans');
assert.deepEqual(payload.snapshots.map(x=>x.checkpoint),[0,7,14]);
assert.ok(!JSON.stringify(payload).includes('name'),'Pilot export must not contain profile names');

console.log('route-engine-pilot-telemetry: richer 0/7/14 snapshot semantics, behavior, unknowns and delayed-capture quality flags passed');
