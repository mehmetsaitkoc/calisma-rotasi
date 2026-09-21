import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const index=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const contracts=fs.readFileSync(new URL('../public/route-contracts.js',import.meta.url),'utf8');
const presenterSrc=fs.readFileSync(new URL('../public/route-presenter.js',import.meta.url),'utf8');
const teacherSrc=fs.readFileSync(new URL('../public/teacher-context.js',import.meta.url),'utf8');
const intelligenceSrc=fs.readFileSync(new URL('../public/intelligence-v1.js',import.meta.url),'utf8');

for(const [name,src] of [['route-presenter',presenterSrc],['teacher-context',teacherSrc],['intelligence-v1',intelligenceSrc]]){
  new Function(src);
  for(const forbidden of ['document.','localStorage','sessionStorage','fetch(','XMLHttpRequest']){
    assert.ok(!src.includes(forbidden),name+' must stay a pure boundary and not access '+forbidden);
  }
}
for(const marker of [
  '<script src="/route-presenter.js"></script>',
  '<script src="/teacher-context.js"></script>',
  'ARCHITECTURE BOUNDARY: student-facing route presentation',
  'ARCHITECTURE BOUNDARY: bounded Rota Hoca learning context',
  'window.RotaPresenter?.taskReason',
  'window.RotaTeacherContext?.build',
  'INTELLIGENCE RUNTIME BOUNDARY',
  'window.RotaRuntimeV1'
]) assert.ok(index.includes(marker),'Missing architecture boundary marker: '+marker);

const sandbox={console};
sandbox.globalThis=sandbox;
vm.runInNewContext(contracts,sandbox);
vm.runInNewContext(presenterSrc,sandbox);
vm.runInNewContext(teacherSrc,sandbox);
vm.runInNewContext(intelligenceSrc,sandbox);

const reason=sandbox.RotaPresenter.taskReason({source:'curriculum',reason:''});
assert.ok(reason.length>12,'Every task must get a meaningful student-facing reason');
assert.match(reason,/bugün|planlandı|rota/i,'Task reason must answer why the task is in the route');

const sanitized=sandbox.RotaPresenter.taskReason({source:'exam',reason:'Stale evidence ve hysteresis nedeniyle confounded signal.'});
assert.ok(!/stale evidence|hysteresis|confounded/i.test(sanitized),'Technical jargon must never leak through task reason');

const todayPlan=Array.from({length:12},(_,i)=>({
  subject:'Matematik',topic:'Problemler '+i,title:'Görev '+i,minutes:25,targetQuestions:18,
  reason:'Bugünkü hedef farkı nedeniyle planlandı.',mode:'steady',modeLabel:'DENGELİ'
}));
const context=sandbox.RotaTeacherContext.build({
  exam:'KPSS',track:'Lisans',
  selected:{subject:'Matematik',topic:'Problemler'},
  target:'90 puan',targetDate:'2026-10-31',dailyMinutes:180,topicStatus:1,
  routeSummary:{lastReason:'Plan güncellendi',lastChanged:2,lastRun:'2026-09-20'},
  completion:{known:true,ratio:75,active:3,expected:4},
  todayPlan,
  routeDecision:{mode:'steady',label:'DENGELİ',note:'Devam et',confidence:72,evidence:['son çalışma']},
  studentModel:{state:'steady',label:'DENGELİ İLERLEME',confidence:72,learningNeed:45,performance:76,retention:70,execution:80,nextAction:'Mevcut dozu koru.',openMistakes:1,trend:'flat',personalNorm:'flat',velocity:'Dengeli'},
  mastery:{scope:'topic',ready:false,progress:2,total:4,baseDate:'2026-09-18',review3:false,review7:false,openMistake:false,next:'3 gün tekrarı'},
  recentLogs:Array.from({length:20},(_,i)=>({date:'2026-09-20',subject:'Matematik',minutes:25,questions:18,title:'Log '+i})),
  teacherSignals:Array.from({length:12},(_,i)=>({subject:'Matematik',topic:'Problemler',status:'review',question:'Soru '+i})),
  unsupportedSecret:'must-not-survive'
});
assert.equal(context.contextVersion,2,'Rota Hoca context contract must be v2');
assert.equal(context.todayPlan.length,8,'Today plan must stay bounded');
assert.equal(context.recentLogs.length,8,'Recent logs must stay bounded');
assert.equal(context.teacherSignals.length,6,'Teacher signals must stay bounded');
assert.equal(Object.hasOwn(context,'unsupportedSecret'),false,'Unknown context fields must be dropped');
assert.equal(context.contextHealth.hasTodayPlan,true);
assert.equal(context.contextHealth.hasStudentModel,true);
assert.equal(context.selected.subject,'Matematik');

assert.ok(sandbox.RotaIntelligenceV1,'Pure Intelligence V1 boundary must load without browser APIs');
const memory=sandbox.RotaIntelligenceV1.interventionMemory({mode:'repair',effect:{known:true,total:3,helpful:2,harmful:0,neutral:1,score:.67}});
assert.equal(memory.action,'repeat','Intelligence boundary must expose normalized intervention memory');

console.log('Architecture boundaries passed: presenter + bounded Rota Hoca context + pure Intelligence V1');
