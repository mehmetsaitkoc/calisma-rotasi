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

assert.equal(byId['recovery-comeback'].day60.modeBounces,0,'recovery comeback must not bounce');
assert.ok(byId['relapse'].days.slice(32,50).some(d=>d.studentState==='repair'),'relapse decline must reopen repair');
const relapseReentry=transitions(byId['relapse'].days).find(x=>x.day>=33&&x.to==='repair');
assert.ok(relapseReentry&&relapseReentry.day<=38,'relapse repair re-entry must occur within 6 days of sustained decline; got '+(relapseReentry?.day||'never'));
assert.equal(byId['burnout-after-success'].day60.finalState,'sustainable','burnout must end in sustainable mode while adherence remains poor');
assert.ok(byId['urgent-weak'].day60.risk>=45,'urgent weak risk must remain elevated near target while weakness persists');

console.log('route-engine-critical-personas: targeted pilot-readiness audit passed');
