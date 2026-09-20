import assert from 'node:assert/strict';

await import('../public/route-contracts.js');
const C=globalThis.RotaContracts;
assert.ok(C,'RotaContracts must be exported');

assert.equal(C.modeCopy('repair').label,'ONARIM');
assert.equal(C.modeCopy('steady').label,'DENGELİ');
assert.equal(C.modeCopy('progress').label,'GELİŞİM');
assert.equal(C.modeCopy('ease').label,'SÜRDÜRÜLEBİLİR');

assert.match(C.taskReason({source:'mini_repair'}),/Mini denemede/i);
assert.match(C.taskReason({source:'spaced_review'}),/hatırlamayı güçlendirmek/i);
assert.ok(!/confounded|evidence factor|hysteresis/i.test(C.studentText('confounded evidence factor hysteresis')));

const envelope=C.teacherContextEnvelope({
  todayPlan:[
    {subject:'Matematik',topic:'Problemler',title:'Problemler',minutes:35,targetQuestions:18,reason:'stale evidence nedeniyle bugün',mode:'repair',modeLabel:'ONARIM'}
  ],
  routeDecision:{mode:'repair',label:'ONARIM',note:'confounded signal',confidence:81,evidence:['hysteresis hold']},
  studentModel:{state:'repair'}
});
assert.equal(envelope.contextVersion,1);
assert.equal(envelope.routeMode.label,'ONARIM');
assert.equal(envelope.todaySummary.openTasks,1);
assert.equal(envelope.todaySummary.totalMinutes,35);
assert.ok(!/confounded|hysteresis|stale evidence/i.test(JSON.stringify(envelope)));

const state={
  version:1,
  activeExam:'kpss',
  workspaces:{kpss:{configured:true},yks:{configured:false}}
};
const backup=C.makeBackupEnvelope(state,{appVersion:'4.1'});
assert.equal(backup.schema,'calisma-rotasi-backup');
assert.equal(backup.version,2);
assert.equal(backup.workspaceSchemaVersion,2);
assert.equal(backup.integrity.algorithm,'fnv1a32');
assert.equal(C.unwrapBackup(backup).state.activeExam,'kpss');

const tampered=JSON.parse(JSON.stringify(backup));
tampered.state.activeExam='yks';
assert.throws(()=>C.unwrapBackup(tampered),/bütünlük kontrolü başarısız/i);

const legacy=C.unwrapBackup(state);
assert.equal(legacy.migratedFrom,'legacy-v1');
assert.equal(legacy.state,state);

console.log('Route contracts passed: student copy + teacher envelope + versioned backup integrity');
