import assert from 'node:assert/strict';
import { lfResults } from './route-engine-closed-loop.mjs';

const IDS=['recovery-comeback','relapse','burnout-after-success','urgent-weak'];
const byId=Object.fromEntries(lfResults.map(r=>[r.persona.id,r]));

function transitions(days){
  const out=[];
  for(let i=1;i<days.length;i++){
    if(days[i].appliedMode!==days[i-1].appliedMode){
      out.push({
        day:days[i].day,
        from:days[i-1].appliedMode,
        to:days[i].appliedMode,
        state:days[i].studentState,
        phase:days[i].personaPhase,
        performance:days[i].performance,
        learningNeed:days[i].learningNeed,
        execution:days[i].execution,
        completion:days[i].behaviorCompletion,
        risk:days[i].risk,
        confidence:days[i].confidence
      });
    }
  }
  return out;
}
function phaseWindows(days){
  const out=[];let start=0;
  for(let i=1;i<=days.length;i++){
    if(i===days.length||days[i].personaPhase!==days[start].personaPhase){
      const xs=days.slice(start,i);
      out.push({
        phase:days[start].personaPhase,
        startDay:xs[0].day,
        endDay:xs.at(-1).day,
        startMode:xs[0].appliedMode,
        endMode:xs.at(-1).appliedMode,
        startPerformance:xs[0].performance,
        endPerformance:xs.at(-1).performance,
        startExecution:xs[0].execution,
        endExecution:xs.at(-1).execution,
        startRisk:xs[0].risk,
        endRisk:xs.at(-1).risk
      });
      start=i;
    }
  }
  return out;
}
function compact(r){
  return {
    id:r.persona.id,
    final:r.day60,
    transitions:transitions(r.days),
    phases:phaseWindows(r.days),
    interventionEvents:r.backtest.events
  };
}

for(const id of IDS){
  const r=byId[id];assert.ok(r,'missing critical persona '+id);
  console.log('CRITICAL-PERSONA '+id+' '+JSON.stringify(compact(r)));
}

{
  const r=byId['recovery-comeback'],ts=transitions(r.days);
  assert.equal(r.day60.modeBounces,0,'recovery comeback must not bounce');
  assert.ok((r.day60.longHorizonStabilityScore??0)>=95,'meaningful recovery transitions must not be mislabeled unstable');
  assert.ok(ts.length<=4,'recovery comeback should not chatter after recovery');
  assert.ok(r.days.at(-1).risk<r.days[0].risk,'recovery comeback risk should improve over the lifecycle');
}
{
  const r=byId['relapse'],ts=transitions(r.days);
  assert.ok(r.days.slice(32,50).some(d=>d.studentState==='repair'),'relapse decline must reopen repair');
  const relapseReentry=ts.find(x=>x.day>=33&&x.to==='repair');
  assert.ok(relapseReentry&&relapseReentry.day<=38,'relapse repair re-entry must occur within 6 days of sustained decline; got '+(relapseReentry?.day||'never'));
  const relapseExit=ts.find(x=>x.day>relapseReentry.day&&x.from==='repair'&&x.to!=='repair');
  assert.ok(relapseExit&&relapseExit.day<=48,'relapse must exit repair after second recovery becomes real; got '+(relapseExit?.day||'never'));
  const relapseEnd=r.days.find(d=>d.day===44),final=r.days.at(-1);
  assert.ok(final.performance>relapseEnd.performance,'second recovery must be reflected in final performance');
}
{
  const r=byId['burnout-after-success'],ts=transitions(r.days),easeEntry=ts.find(x=>x.to==='ease'&&x.phase==='burnout');
  assert.equal(r.day60.finalState,'sustainable','burnout must end in sustainable mode while adherence remains poor');
  assert.ok(easeEntry&&easeEntry.day<=30,'burnout must enter sustainable mode within 10 days of burnout onset');
  assert.ok(r.days.filter(d=>d.day>=easeEntry.day&&d.personaPhase==='burnout').every(d=>d.appliedMode==='ease'),'burnout must not leave sustainable mode while global completion remains poor');
  assert.equal(r.day60.modeBounces,0,'burnout response must not chatter');
}
{
  const r=byId['urgent-weak'],first=r.days[0],final=r.days.at(-1);
  assert.ok(final.risk>=45,'urgent weak risk must remain elevated near target while weakness persists');
  assert.ok(final.performance-first.performance>=20,'urgent weak must still show substantial performance recovery');
  assert.ok(first.risk-final.risk>=20,'urgent weak risk should improve materially without being falsely normalized');
  assert.equal(final.appliedMode,'steady','urgent weak should leave repair after objective recovery instead of being trapped');
}

console.log('route-engine-critical-personas: targeted pilot-readiness audit passed');
