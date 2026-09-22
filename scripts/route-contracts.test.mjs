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
const trace=C.decisionTrace({
  mode:'repair',confidence:82,score:91,
  reasonCodes:['ASSESSMENT_RISK','OPEN_MISTAKE','ASSESSMENT_RISK','NOT_REAL'],
  evidence:['Deneme 2/5','Açık yanlış 3'],
  capacity:{requestedMinutes:55,assignedMinutes:35,dailyLimit:90}
});
assert.deepEqual(trace.reasonCodes,['ASSESSMENT_RISK','OPEN_MISTAKE']);
assert.equal(trace.capacity.constrained,true);
assert.match(C.traceExplanation(trace),/Son ölçümlerde/i);
assert.match(C.traceExplanation(trace),/kapanmamış/i);
assert.match(C.taskReason({source:'curriculum',decisionTrace:trace}),/Son ölçümlerde/i,'Decision trace must outrank generic source copy');
assert.equal(C.traceExplanation({reasonCodes:['NOT_REAL']},''),'','Unknown reason codes must not invent student-facing claims');
const derived=C.decisionTraceFromSignals({
  mode:'repair',score:88,
  assessment:{risk:true,evidence:'Matematik denemesi %42 doğruluk'},
  mistakes:{open:2,repeated:1},
  review:{due3:true},
  mastery:{verified:false,stale:false,samples:1},
  capacity:{requestedMinutes:55,assignedMinutes:35,dailyLimit:90}
});
assert.deepEqual(derived.reasonCodes,['ASSESSMENT_RISK','OPEN_MISTAKE','REPEATED_MISTAKE','REVIEW_DUE_3','CAPACITY_CONSTRAINED']);
assert.equal(derived.capacity.constrained,true);
assert.ok(derived.evidence.some(x=>/denemesi/i.test(x)));
const masteryDerived=C.decisionTraceFromSignals({mode:'progress',mastery:{verified:true,samples:3,evidence:'3 ayrı günde güçlü sonuç'},trend:{direction:'up',samples:3}});
assert.ok(masteryDerived.reasonCodes.includes('MASTERY_EVIDENCE'));
assert.ok(masteryDerived.reasonCodes.includes('POSITIVE_TREND'));
const complianceOnly=C.decisionTraceFromSignals({mode:'repair',behavior:{lowCompliance:true}});
assert.notEqual(complianceOnly.mode,'repair','Low compliance alone must not fabricate academic repair');

const rankedRisk=C.decisionTraceFromSignals({
  mode:'repair',score:50,confidence:90,
  assessment:{risk:true},mistakes:{open:2,repeated:2},review:{due3:true}
});
const rankedRoutine=C.decisionTraceFromSignals({
  mode:'steady',score:50,confidence:90,profilePriority:true
});
const riskScore=C.decisionTraceEvidenceScore(rankedRisk);
const routineScore=C.decisionTraceEvidenceScore(rankedRoutine);
assert.ok(riskScore.finalScore>routineScore.finalScore,'Real repair evidence must outrank equal base priority');
assert.equal(riskScore.baseScore,50);
assert.ok(riskScore.evidenceScore>0);
const comparison=C.compareDecisionTraces(rankedRisk,rankedRoutine);
assert.equal(comparison.preferred,'left');
assert.ok(comparison.delta>0);
assert.ok(comparison.leftAdvantages.includes('ASSESSMENT_RISK'));
const masteryRank=C.decisionTraceEvidenceScore(C.decisionTraceFromSignals({
  mode:'progress',score:50,confidence:90,mastery:{verified:true,samples:3},trend:{direction:'up',samples:3}
}));
assert.ok(masteryRank.finalScore<50,'Strong mastery/progress evidence must reduce repair-style urgency instead of inflating it');



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
