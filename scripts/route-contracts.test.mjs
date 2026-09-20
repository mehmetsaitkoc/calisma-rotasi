import assert from 'node:assert/strict';

await import('../public/route-contracts.js');
const C=globalThis.RotaContracts;
assert.ok(C,'RotaContracts must be exported');

assert.equal(C.modeCopy('repair').label,'ONARIM');
assert.equal(C.modeCopy('steady').label,'DENGELİ');
assert.equal(C.modeCopy('progress').label,'GELİŞİM');
assert.equal(C.modeCopy('ease').label,'SÜRDÜRÜLEBİLİR');

assert.equal(C.featureEnabled('free','core_route'),true);
assert.equal(C.featureEnabled('free','exam_wrong_repair'),true);
assert.equal(C.featureEnabled('free','mini_exams'),true);
assert.equal(C.featureEnabled('free','monthly_report'),false);
assert.equal(C.featureEnabled('plus','monthly_report'),true);
assert.equal(C.featureEnabled('free','advanced_teacher_insights'),false);
assert.equal(C.featureEnabled('plus','advanced_teacher_insights'),true);
assert.equal(C.featureEnabled('free','teacher_basic'),true);
assert.equal(C.featureEnabled('plus','teacher_basic'),true);
assert.equal(C.featureEnabled('invalid-tier','monthly_report'),false,'Unknown tiers must fail closed to Free');
assert.equal(C.featureEnabled('plus','unknown_feature'),false,'Unknown features must fail closed');

const freeEntitlement=C.entitlementForTier('free',{source:'public_beta',purchaseEnabled:false,accountRequired:true});
assert.equal(freeEntitlement.schema,'calisma-rotasi-entitlement-v1');
assert.equal(freeEntitlement.version,1);
assert.equal(freeEntitlement.tier,'free');
assert.equal(freeEntitlement.features.core_route,true);
assert.equal(freeEntitlement.features.teacher_basic,true);
assert.equal(freeEntitlement.features.monthly_report,false);
assert.equal(freeEntitlement.features.advanced_teacher_insights,false);
assert.equal(freeEntitlement.purchaseEnabled,false);
assert.equal(freeEntitlement.accountRequired,true);

const plusEntitlement=C.entitlementForTier('plus',{source:'local_dev',status:'dev_plus'});
assert.equal(plusEntitlement.tier,'plus');
assert.equal(plusEntitlement.features.monthly_report,true);
assert.equal(plusEntitlement.features.long_term_trends,true);
assert.equal(plusEntitlement.features.advanced_teacher_insights,true);

const tamperedEntitlement={...freeEntitlement,tier:'free',features:{...freeEntitlement.features,monthly_report:true}};
const revalidated=C.validateEntitlement(tamperedEntitlement);
assert.equal(revalidated.features.monthly_report,false,'Entitlement validation must recompute features from the central policy');
assert.throws(()=>C.validateEntitlement({...freeEntitlement,schema:'wrong'}),/yetkisi doğrulanamadı/i);

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
assert.equal(backup.workspaceSchemaVersion,3);
assert.equal(backup.integrity.algorithm,'fnv1a32');
assert.equal(C.unwrapBackup(backup).state.activeExam,'kpss');

const tampered=JSON.parse(JSON.stringify(backup));
tampered.state.activeExam='yks';
assert.throws(()=>C.unwrapBackup(tampered),/bütünlük kontrolü başarısız/i);

const legacy=C.unwrapBackup(state);
assert.equal(legacy.migratedFrom,'legacy-v1');
assert.equal(legacy.state,state);

console.log('Route contracts passed: student copy + teacher envelope + versioned backup integrity');
