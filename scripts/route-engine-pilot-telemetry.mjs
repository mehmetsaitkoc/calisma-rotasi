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
  route:{pilot:{version:1,enabled:false,participantId:'',startDate:'',startedAt:0,completedAt:0,snapshots:[]},modeHistory:[],interventions:[]},
  plan:[
    {id:'t0',date:'2026-09-19',subjectId:'k-ma',topicId:'m1',minutes:25,targetQuestions:10,done:true},
    {id:'t7',date:'2026-09-26',subjectId:'k-ma',topicId:'m1',minutes:30,targetQuestions:12,done:true},
    {id:'t14',date:'2026-10-03',subjectId:'k-ma',topicId:'m1',minutes:30,targetQuestions:12,done:false}
  ],
  logs:[
    {id:'l0',sessionId:'t0',date:'2026-09-19',subjectId:'k-ma',minutes:25,questions:10,correct:8,wrong:2}
  ],
  taskEvents:[{taskId:'t0',date:'2026-09-19',action:'complete'}],
  mistakes:[],
  exams:[]
};
const w=()=>space,routeEnsure=()=>{},today=()=>currentDate;
const R={
  dayAdd,iso,uid:()=> 'pilot-'+(++uid),topic:(_w,id)=>id?{id,subjectId:'k-ma'}:null,
  calcNet:(parts,penalty=4)=>({net:parts.reduce((n,p)=>n+(p.correct||0)-(p.wrong||0)/(penalty||1),0)})
};
const routePerformanceWindow=()=>({known:false});
const routeBehaviorWindow=()=>({known:false});
const routeEvaluateInterventionFromMetrics=()=>({status:'neutral',score:0,label:'n',reason:'n'});
const routeInterventionAggregateEvaluations=xs=>({status:xs.length?'neutral':'pending',score:0});
const routeStudentOverview=()=>[{subject:{id:'k-ma'},model:{performance:70,learningNeed:42,confidence:76}}];
const routeTopicExamRisk=()=>({score:48});
const state={activeExam:'kpss'};

const api=new Function(
  'routeEnsure','w','R','today','routePerformanceWindow','routeBehaviorWindow',
  'routeEvaluateInterventionFromMetrics','routeInterventionAggregateEvaluations',
  'routeStudentOverview','routeTopicExamRisk','state','routePilotConfig',
  src+';return {routePilotSnapshot,routePilotAutoSnapshot,routePilotStart,routePilotPayload,routePilotModeSummary};'
)(
  routeEnsure,w,R,today,routePerformanceWindow,routeBehaviorWindow,
  routeEvaluateInterventionFromMetrics,routeInterventionAggregateEvaluations,
  routeStudentOverview,routeTopicExamRisk,state,()=>space.route.pilot
);

api.routePilotStart();
assert.equal(space.route.pilot.snapshots.length,1,'Pilot start must capture day 0');
const d0=space.route.pilot.snapshots[0];
assert.equal(d0.checkpoint,0);
assert.equal(d0.planned.tasks,1);
assert.equal(d0.planned.questions,10);
assert.equal(d0.actual.completedTasks,1);
assert.equal(d0.actual.questions,10);
assert.equal(d0.actual.accuracy,80);
assert.equal(d0.actual.completion,100);
assert.equal(d0.student.performance,70,'Day 0 must fall back to current Student Model when mode history is empty');
assert.equal(d0.student.learningNeed,42);
assert.equal(d0.student.risk,48);
assert.equal(d0.student.confidence,76);
assert.equal(d0.dataQuality.capturedOnTime,true);
assert.equal(d0.dataQuality.plannedExact,true);
assert.equal(d0.dataQuality.actualLogsExact,true);

space.logs.push({id:'l7',sessionId:'t7',date:'2026-09-26',subjectId:'k-ma',minutes:30,questions:10,correct:6,wrong:4});
space.taskEvents.push({taskId:'t7',date:'2026-09-26',action:'complete'});
space.route.modeHistory.push(
  {date:'2026-09-22',subjectId:'k-ma',topicId:'m1',mode:'steady',performance:71,learningNeed:39,risk:45,confidence:80,created:1},
  {date:'2026-09-26',subjectId:'k-ma',topicId:'m1',mode:'repair',performance:65,learningNeed:55,risk:59,confidence:88,created:2}
);
space.exams.push({id:'e1',date:'2026-09-25',penalty:4,parts:[{correct:70,wrong:20}]});
currentDate='2026-09-26';
assert.equal(api.routePilotAutoSnapshot(),true,'Day 7 must create a new snapshot');
const d7=space.route.pilot.snapshots.find(x=>x.checkpoint===7);
assert.ok(d7);
assert.equal(d7.planned.tasks,2);
assert.equal(d7.planned.minutes,55);
assert.equal(d7.planned.questions,22);
assert.equal(d7.actual.completedTasks,2);
assert.equal(d7.actual.minutes,55);
assert.equal(d7.actual.questions,20);
assert.equal(d7.actual.correct,14);
assert.equal(d7.actual.wrong,6);
assert.equal(d7.actual.accuracy,70);
assert.equal(d7.actual.completion,100);
assert.equal(d7.modes.steady,1);
assert.equal(d7.modes.repair,1);
assert.equal(d7.modes.transitions,1);
assert.equal(d7.modes.current,'repair');
assert.equal(d7.student.performance,65);
assert.equal(d7.student.learningNeed,55);
assert.equal(d7.student.risk,59);
assert.equal(d7.exam.count,1);
assert.equal(d7.exam.latestDate,'2026-09-25');
assert.equal(d7.dataQuality.capturedOnTime,true);

space.logs.push({id:'l14',sessionId:'t14',date:'2026-10-03',subjectId:'k-ma',minutes:30,questions:12,correct:10,wrong:2});
space.taskEvents.push({taskId:'t14',date:'2026-10-03',action:'complete'});
currentDate='2026-10-05';
assert.equal(api.routePilotAutoSnapshot(),true,'Delayed opening must still create due day 14 snapshot');
const d14=space.route.pilot.snapshots.find(x=>x.checkpoint===14);
assert.ok(d14);
assert.equal(d14.targetDate,'2026-10-03');
assert.equal(d14.capturedDate,'2026-10-05');
assert.equal(d14.delayDays,2);
assert.equal(d14.dataQuality.capturedOnTime,false);
assert.equal(d14.dataQuality.plannedExact,false,'Delayed historical plan must be explicitly marked non-exact');
assert.equal(d14.dataQuality.openMistakesExact,false);
assert.equal(d14.dataQuality.modeHistoryExact,false);
assert.equal(d14.dataQuality.interventionHistoryExact,false);
assert.equal(d14.dataQuality.actualLogsExact,true);

const payload=api.routePilotPayload();
assert.equal(payload.schema,'calisma-rotasi-pilot-v1');
assert.equal(payload.participantId,'pilot-1');
assert.equal(payload.exam,'kpss');
assert.equal(payload.track,'lisans');
assert.deepEqual(payload.snapshots.map(x=>x.checkpoint),[0,7,14]);
assert.ok(!JSON.stringify(payload).includes('name'),'Pilot export must not contain profile names');

console.log('route-engine-pilot-telemetry: 0/7/14 snapshot semantics + delayed-capture quality flags passed');
