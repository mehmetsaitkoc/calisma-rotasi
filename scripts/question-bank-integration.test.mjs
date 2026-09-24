import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const env={};
const runFile=path=>new Function('window','globalThis',fs.readFileSync(new URL('../public/'+path,import.meta.url),'utf8'))(env,env);
for(const file of ['catalog.js','workspace-schema.js','route-contracts.js','mini-catalog.js','kpss-practice-catalog.js','question-bank.js'])runFile(file);
for(let i=1;i<=10;i++)runFile('kpss-history-'+String(i).padStart(2,'0')+'.js');
for(let i=1;i<=4;i++)runFile('questions/kpss/tarih/ilk-turk-devletleri/test-'+i+'.js');
const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('application/')).map(m=>m[2]).filter(x=>x.trim());
for(const source of scripts)new Function(source);
const core=scripts.find(x=>x.includes('root.RotaCore='));
assert.ok(core);
new Function('window','globalThis',core)(env,env);
const R=env.RotaCore,Q=env.RotaQuestionBank;
const between=(start,end)=>{const a=html.indexOf(start),b=html.indexOf(end,a);assert.ok(a>=0&&b>a,start);return html.slice(a,b);};
{
 const catalog=env.RotaCatalog.subjects.filter(subject=>subject.exam==='kpss');
 const workspace={customTopics:[],topicState:{}};
 let mastery=null;
 const renderTopics=new Function('subjects','w','ui','head','btn','icon','subIcon','esc','empty','routeTopicMasterySignal','topicStudyTests','topicStudyTestsHtml',between('function topicsPage','function seriesSvg')+';return topicsPage;')(
  ()=>catalog,()=>workspace,{stage:'all',query:''},()=>'',()=>'',()=>'',()=>'',String,()=>'',()=>mastery,()=>[],()=>''
 );
 for(const progress of [null,{base:true,review3:true,review7:false,hasEvidence:true,performanceOk:true,ready:false,progress:3,total:4,next:'7 gün tekrarı'}]){
  mastery=progress;
  const rendered=renderTopics();
  assert.equal((rendered.match(/class="topic-title"/g)||[]).length,64,'All 64 KPSS topics must render');
  assert.equal((rendered.match(/class="topic-mastery-progress /g)||[]).length,progress?64:0,'Mastery progress remains conditional');
  assert.doesNotMatch(rendered,/>\s*}\s*</,'Topic rows must not expose a literal template-closing brace with or without mastery progress');
 }
}
const definitionSource=between('function miniExamDefinition','function miniCatalogInfo')+';return {miniExamDefinition,topicStudyTests,miniCanServe};';
const definitions=new Function('window','ROTA_MINI_EXAMS',definitionSource)(env,[]);
const pilots=Q.topicTests();
assert.equal(pilots.length,4,'Only the four approved pilot sets may be published');
assert.deepEqual(definitions.topicStudyTests('k-ta-1').map(x=>x.id),pilots.map(x=>x.id),'Topic UI must use the approved pilot once');
for(const legacy of env.RotaKpssHistory01.tests){
 assert.equal(definitions.miniExamDefinition(legacy.id).id,legacy.id,'Archived definitions remain available to historical attempts');
 assert.ok(!definitions.topicStudyTests('k-ta-1').some(x=>x.id===legacy.id),'Archived pilot definitions are not offered a second time');
}
const rejectedEnv={...env,RotaQuestionBank:{...Q,topicTests:()=>[],getTest:()=>null}};
const blocked=new Function('window','ROTA_MINI_EXAMS',definitionSource)(rejectedEnv,[]);
assert.deepEqual(blocked.topicStudyTests('k-ta-1'),[],'A managed bank topic must not expose unreviewed legacy fallback sets');
assert.equal(blocked.miniCanServe(env.RotaKpssHistory01.tests[0]),false,'Archived definitions cannot start new managed-topic attempts');
assert.equal(blocked.miniExamDefinition(pilots[0].id).id,pilots[0].id,'Quarantined bank definitions remain available for historical review');
assert.equal(blocked.miniExamDefinition(env.RotaKpssHistory01.tests[0].id).id,env.RotaKpssHistory01.tests[0].id,'Legacy historical definitions remain available');

const sectionDefinitionsSource=between('function activeSectionExams','function sectionExamLast')+';return {activeSectionExams,sectionCanServe,sectionExamDefinition,sectionAttemptDefinition};';
const blockedSectionEnv={...env,RotaKpssBankExams:{sectionExams:[],readiness:[{subjectId:env.RotaKpssPractice.sectionExams[0].subjectId,status:'needs-content'}],canServe:()=>false}};
const blockedSections=new Function('window',sectionDefinitionsSource)(blockedSectionEnv);
assert.ok(!blockedSections.activeSectionExams().some(x=>x.subjectId===env.RotaKpssPractice.sectionExams[0].subjectId),'needs-content must not publish old section exams');
assert.equal(blockedSections.sectionExamDefinition(env.RotaKpssPractice.sectionExams[0].id).id,env.RotaKpssPractice.sectionExams[0].id,'Old section definitions still resolve for history');

const scoreMini=new Function(between('function scoreMiniExam','function miniSkillBreakdown')+';return scoreMiniExam;')();
const scoreSection=new Function(between('function scoreSectionExam','function sectionWeakTopics')+';return scoreSectionExam;')();
const questionSkill=new Function('globalThis','MINI_SKILL_MAP',between('function miniQuestionSkill','function miniExamDefinition')+';return miniQuestionSkill;')(env,{});
assert.equal(questionSkill({questions:[{skill:'chronology',subtopic:'raw-slug'}]},0),Q.SKILL_LABELS.chronology);
assert.equal(questionSkill({questions:[{skill:'Kut ve meşruiyet'}]},0),'Kut ve meşruiyet','Legacy freeform skill labels must remain unchanged');
const def=pilots[0],answers=def.questions.map((q,i)=>i===0?-1:i===1?(q.answer+1)%5:q.answer),score=scoreMini(def,answers);
const attempt={id:'pilot-attempt',miniId:def.id,version:def.version,date:'2026-09-23',subjectId:def.subjectId,topicId:def.topicId,title:def.title,total:score.total,correct:score.correct,wrong:score.wrong,blank:score.blank,minutes:12,answers,skillBreakdown:[],weakSkills:[],questionEvidence:Q.snapshot(def,answers),created:100};
assert.equal(attempt.questionEvidence.length,12);
attempt.questionEvidence[0]={...attempt.questionEvidence[0],unexpectedSecret:'drop-me',html:'<script>alert(1)</script>'};
let state=R.fresh();state.activeExam='kpss';state.workspaces.kpss.assessments=[attempt];
let clean=R.validateBackup(JSON.parse(JSON.stringify(state))),saved=clean.workspaces.kpss.assessments[0];
assert.equal(saved.questionEvidence.length,12);
assert.equal(saved.questionEvidence[0].questionId,def.questions[0].id);
assert.equal(saved.questionEvidence[0].learningObjective,attempt.questionEvidence[0].learningObjective);
assert.equal(saved.questionEvidence[0].unexpectedSecret,undefined);
assert.equal(saved.questionEvidence[0].html,undefined);
assert.deepEqual(saved.answers,answers);
assert.deepEqual(R.validateBackup(clean).workspaces.kpss.assessments,clean.workspaces.kpss.assessments,'Repeated validation must be idempotent');
const bad=structuredClone(state);bad.workspaces.kpss.assessments[0].questionEvidence[0].topicId='k-ma-1';
assert.throws(()=>R.validateBackup(bad),/Soru kanıtı/,'Cross-subject question metadata must be rejected');
const badCount=structuredClone(state);badCount.workspaces.kpss.assessments[0].questionEvidence.pop();
assert.throws(()=>R.validateBackup(badCount),/Soru kanıtı/,'Partial evidence cannot silently change the attempt meaning');

const section=env.RotaKpssPractice.sectionExams[0],sectionAnswers=section.questions.map((q,i)=>i===0?-1:q.answer),sectionScore=scoreSection(section,sectionAnswers);
const sectionAttempt={id:'section-attempt',miniId:'section:'+section.id,sectionId:section.id,version:section.version,date:'2026-09-23',subjectId:section.subjectId,topicId:'',title:section.title,total:sectionScore.total,correct:sectionScore.correct,wrong:sectionScore.wrong,blank:sectionScore.blank,minutes:30,answers:sectionAnswers,net:sectionScore.net,topicBreakdown:sectionScore.topicBreakdown,skillBreakdown:[],weakSkills:[],created:120};
state.workspaces.kpss.assessments.push(sectionAttempt);
saved=R.validateBackup(state).workspaces.kpss.assessments[1];
assert.equal(saved.sectionId,section.id);
assert.equal(saved.net,sectionScore.net);
assert.deepEqual(saved.topicBreakdown,sectionScore.topicBreakdown,'Section topic evidence must survive reload/export/import');
const oldSection=structuredClone(sectionAttempt);delete oldSection.sectionId;delete oldSection.topicBreakdown;delete oldSection.net;
state.workspaces.kpss.assessments=[oldSection];
saved=R.validateBackup(state).workspaces.kpss.assessments[0];
assert.equal(saved.sectionId,section.id,'Old section-prefixed records retain their assessment kind');
assert.equal(saved.topicBreakdown,undefined,'Lost legacy topic evidence must never be fabricated');
const brokenSection=structuredClone(sectionAttempt);brokenSection.topicBreakdown[0].correct--;
state.workspaces.kpss.assessments=[brokenSection];
assert.throws(()=>R.validateBackup(state),/Bölüm denemesi/);

const legacy=env.RotaKpssHistory01.tests[0],legacyAnswers=legacy.questions.map(q=>q.answer),legacyScore=scoreMini(legacy,legacyAnswers);
const oldAttempt={...attempt,id:'old-attempt',miniId:legacy.id,version:legacy.version,answers:legacyAnswers,total:legacyScore.total,correct:legacyScore.correct,wrong:0,blank:0};delete oldAttempt.questionEvidence;
state.workspaces.kpss.assessments=Array.from({length:241},(_,i)=>({...oldAttempt,id:'old-attempt-'+i,created:i}));
clean=R.validateBackup(state);
assert.equal(clean.workspaces.kpss.assessments.length,240,'All submission and migration paths share the bounded 240-attempt retention policy');
assert.equal(clean.workspaces.kpss.assessments[0].id,'old-attempt-1','The newest 240 historical attempts survive validation');
assert.equal(clean.workspaces.kpss.assessments[0].questionEvidence,undefined,'Legacy attempts remain legacy evidence');
assert.equal(clean.workspaces.kpss.assessments[0].correct,legacyScore.correct);
const detailedGoal='Konu hedefi ve ölçüm sonrası onarım odağı. '.repeat(10);
state.workspaces.kpss.plan=[{id:'long-goal',date:'2026-09-23',subjectId:def.subjectId,topicId:def.topicId,title:'Kanıta bağlı çalışma',minutes:30,done:false,taskGoal:detailedGoal}];
assert.equal(R.validateBackup(state).workspaces.kpss.plan[0].taskGoal,detailedGoal,'Generated goals longer than300 characters must remain reloadable after section evidence adds a repair focus');

const latest={...attempt,id:'pilot-retake',created:200,answers:def.questions.map(q=>q.answer),correct:12,wrong:0,blank:0};latest.questionEvidence=Q.snapshot(def,latest.answers);
const space={...R.workspace('kpss'),assessments:[attempt,latest,sectionAttempt]};
const samples=new Function('w',between('function routeAssessmentSamples','function routeAssessmentWeakSkillSignal')+';return routeAssessmentSamples;')(()=>space);
assert.equal(samples(def.subjectId,def.topicId).length,1,'Same-day retakes remain one route performance sample');
assert.equal(samples(def.subjectId,def.topicId)[0].correct,12,'The latest retake is the route sample');
const topicRow=sectionScore.topicBreakdown[0];
assert.equal(samples(section.subjectId,topicRow.topicId)[0].correct,topicRow.correct,'Section total must not be counted again inside each topic');
const metadata=Q.signals(space.assessments,{subjectId:def.subjectId,topicId:def.topicId});
assert.equal(metadata.byType.reduce((n,x)=>n+x.total,0),12,'Metadata aggregation must use the same retake de-duplication');
const weakSignal=new Function('globalThis','R','w','today',between('function routeAssessmentWeakSkillSignal','function routePracticeSignal')+';return routeAssessmentWeakSkillSignal;')(env,R,()=>space,()=>attempt.date);
space.assessments=Array.from({length:6},(_,i)=>({...attempt,id:'day-'+i,date:R.dayAdd(attempt.date,-i)}));
const recentWeak=weakSignal(def.subjectId,def.topicId);
assert.equal(recentWeak.attempts,4);
assert.equal(recentWeak.questionSignals.byType.reduce((n,x)=>n+x.total,0),48,'Supplemental metadata must use the same bounded four attempts as the existing weak-skill signal');
space.assessments=[attempt];
const trace=new Function('globalThis','R','w','today','routeStudentModel','routeTopicMasteryScore','routeBehaviorSignal','routeRecoverySignal',between('function routeDecisionTraceForCandidate','function routeBuildCandidates')+';return routeDecisionTraceForCandidate;')(env,R,()=>space,()=>attempt.date,()=>({state:'repair',confidence:60}),()=>({known:false}),()=>({known:false}),()=>({active:false}));
const decision=trace({source:'mini_repair',sourceAssessmentId:attempt.id,topicId:def.topicId,subjectId:def.subjectId,priority:84,minutes:20});
assert.deepEqual(decision.reasonCodes,['ASSESSMENT_RISK'],'Supplemental question metadata cannot add duplicate risk weights');
assert.ok(decision.evidence.some(x=>x.startsWith('Soru kanıtı:')),'DecisionTrace can explain the measured learning objective');
assert.equal(decision.score,84,'Content metadata must not change the existing candidate score');

const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const review=new Function('esc','miniQuestionSkill',between('function miniDetailedReview','function openMiniResult')+';return miniDetailedReview;')(esc,questionSkill);
const rendered=review(def,score);
assert.equal((rendered.match(/<details/g)||[]).length,12,'Every question, including correct ones, has an expandable explanation');
assert.equal((rendered.match(/<li>/g)||[]).length,48,'All four distractor rationales are available for every question');
assert.match(rendered,/Seçtiğin [A-E] seçeneği/,'The actual picked distractor is explained');
assert.ok(!/<summary>[^<]*(?:<strong>)?[^<]*(?:cause-effect|chronology|raw-slug)/.test(rendered),'Student-facing summaries must use Turkish skill labels');
const untrusted=structuredClone(def);untrusted.questions[0].explanation='<img src=x onerror=alert(1)>';
assert.ok(!review(untrusted,scoreMini(untrusted,answers)).includes('<img'),'Question explanations must be escaped');
untrusted.questions[0].text='I. İlk öncül\nII. İkinci öncül';
assert.ok(review(untrusted,scoreMini(untrusted,answers)).includes('I. İlk öncül<br>II. İkinci öncül'),'Multiline question stems must preserve their structure in review');

// Keep the page alive across a validity boundary: the fixed forms stay available
// to history, but every publication, start and submit path must recheck the bank.
let clock='2026-09-23T12:00:00Z';
const NativeDate=Date;
class TestDate extends NativeDate{constructor(...args){super(...(args.length?args:[clock]));}static now(){return +new NativeDate(clock);}}
const datedEnv={Date:TestDate};datedEnv.window=datedEnv;datedEnv.globalThis=datedEnv;vm.createContext(datedEnv);
vm.runInContext(fs.readFileSync(new URL('../public/question-bank.js',import.meta.url),'utf8'),datedEnv);
const datedTest=structuredClone(def);
for(const q of datedTest.questions){q.currentness={required:true,verifiedOn:'2026-09-23',validUntil:'2026-09-23',sourceUrl:q.sourceRefs[0].url};q.review.fingerprint=datedEnv.RotaQuestionBank.fingerprint(q);}
datedEnv.RotaQuestionBank.registerTest(datedTest);
datedEnv.RotaCatalog={subjects:[{id:def.subjectId,exam:'kpss',name:'Tarih',topics:[{id:def.topicId,title:def.topicTitle}]}]};
datedEnv.RotaAssessmentBlueprints={basis:'Test',sectionExams:[1,2,3].map(n=>({id:'form-'+n,subjectId:def.subjectId,total:1,level:'Test',slots:[{subjectId:def.subjectId,topicId:def.topicId,difficulty:'easy',count:1}]}))};
vm.runInContext(fs.readFileSync(new URL('../public/questions/kpss/branch-exams.js',import.meta.url),'utf8'),datedEnv);
datedEnv.RotaKpssHistory01={tests:[legacy]};datedEnv.RotaKpssPractice={topicSets:[],sectionExams:[{...section,subjectId:def.subjectId}]};
const datedDefinitions=new Function('window','ROTA_MINI_EXAMS',definitionSource)(datedEnv,[]);
const datedSections=new Function('window',sectionDefinitionsSource)(datedEnv);
assert.equal(datedDefinitions.topicStudyTests(def.topicId).length,1);
assert.equal(datedSections.activeSectionExams().length,3);
const fixedSection=datedEnv.RotaKpssBankExams.sectionExams[0];
clock='2026-09-24T00:01:00Z';
assert.equal(datedEnv.RotaQuestionBank.topicTests().length,0);
assert.equal(datedDefinitions.topicStudyTests(def.topicId).length,0,'Topic buttons must refresh after a date rollover');
assert.equal(datedSections.activeSectionExams().length,0,'Expired section forms must not be replaced with unreviewed legacy forms');
assert.equal(datedDefinitions.miniExamDefinition(def.id).id,def.id,'Expired topic definitions remain available to past results');
assert.equal(datedSections.sectionExamDefinition(fixedSection.id).id,fixedSection.id,'Expired section definitions remain available to past results');

let blockedStarts=0;
const topicStart=new Function('miniExamDefinition','miniCanServe','state','toast',between('function openMiniExam','function miniDetailedReview')+';return openMiniExam;')(datedDefinitions.miniExamDefinition,datedDefinitions.miniCanServe,{activeExam:'kpss'},()=>blockedStarts++);
topicStart(def.id);
const sectionStart=new Function('sectionExamDefinition','sectionCanServe','state','toast',between('function openSectionExam','function openSectionResult')+';return openSectionExam;')(datedSections.sectionExamDefinition,datedSections.sectionCanServe,{activeExam:'kpss'},()=>blockedStarts++);
sectionStart(fixedSection.id);
assert.equal(blockedStarts,2,'Both start paths must stop before opening an expired form');
for(const [kind,resolver,gate,id] of [['mini',datedDefinitions.miniExamDefinition,datedDefinitions.miniCanServe,def.id],['section',datedSections.sectionExamDefinition,datedSections.sectionCanServe,fixedSection.id]]){
 const prefix=between("if(form.id==='"+kind+"-exam-form'){",'  const answers=');
 const submitGuard=new Function('form','ctx','state',kind==='mini'?'miniExamDefinition':'sectionExamDefinition',kind==='mini'?'miniCanServe':'sectionCanServe',prefix+'}');
 assert.throws(()=>submitGuard({id:kind+'-exam-form'},{[kind==='mini'?'miniId':'sectionId']:id},{activeExam:'kpss'},resolver,gate),/kontrolü bekliyor/,'Submit must recheck content that expired after opening');
}

let reviewedKind='';
const fixedAnswers=fixedSection.questions.map(q=>q.answer);
const fixedAttempt={id:'fixed-section-attempt',miniId:'section:'+fixedSection.id,sectionId:fixedSection.id,subjectId:fixedSection.subjectId,title:fixedSection.title,total:fixedSection.questions.length,version:fixedSection.version,answers:fixedAnswers,questionEvidence:Q.snapshot(fixedSection,fixedAnswers)};
const reopen=new Function('miniAttemptById','miniExamDefinition','sectionAttemptDefinition','openMiniResult','openSectionResult','scoreMiniExam','scoreSectionExam','esc','openModal',between('function openMiniAttemptResult','function miniResultSummary')+';return openMiniAttemptResult;')(()=>fixedAttempt,datedDefinitions.miniExamDefinition,datedSections.sectionAttemptDefinition,()=>reviewedKind='topic',()=>reviewedKind='section',scoreMini,scoreSection,esc,()=>reviewedKind='summary');
reopen(fixedAttempt.id);
assert.equal(reviewedKind,'section','A saved section result must reopen full solutions even after expiry');
delete fixedAttempt.sectionId;reopen(fixedAttempt.id);
assert.equal(reviewedKind,'section','Legacy section-prefixed attempts also use the section review path');
vm.runInContext(fs.readFileSync(new URL('../public/questions/kpss/branch-exams.js',import.meta.url),'utf8'),datedEnv);
assert.equal(datedEnv.RotaKpssBankExams.sectionExams.length,0,'A reload after expiry cannot assemble new forms');
reopen(fixedAttempt.id);
assert.equal(reviewedKind,'section','A reload after expiry must reconstruct the saved form from archived question IDs');
assert.equal(datedSections.sectionCanServe(datedSections.sectionAttemptDefinition(fixedAttempt,fixedSection.id)),false,'A historical reconstruction must never enable a new attempt');
const originalArchive=datedEnv.RotaQuestionBank;
datedEnv.RotaQuestionBank={...originalArchive,allTests:()=>originalArchive.allTests().map(t=>({...t,version:t.version+1}))};
reopen(fixedAttempt.id);assert.equal(reviewedKind,'summary','Changed source-test versions cannot reinterpret an archived branch attempt');
datedEnv.RotaQuestionBank=originalArchive;
fixedAttempt.questionEvidence[0].questionId='different-form-question';reopen(fixedAttempt.id);
assert.equal(reviewedKind,'summary','Changed fixed-form question IDs must not reinterpret historical answers');
assert.ok(html.includes("btn('Sonucu incele','mini-result-detail'"),'Section cards must link to the last saved result');
assert.ok(!html.includes("results=[...(w().assessments||[])].filter(function(a){return !a.sectionId;})"),'History must retain section-result links when current cards are unavailable');

const mastery=new Function('R','w','routeOutcomeSignal','routePracticeSignal','routePlanEvidenceDate',between('function routeTopicMasterySignal','function routeMasteryScoreFromSignals')+';return routeTopicMasterySignal;')(R,()=>space,()=>({known:false,total:0}),()=>({known:true,sessions:2,answered:24,weightedAccuracy:1,recentAccuracy:1}),p=>p.date);
space.plan=[{id:'base',subjectId:def.subjectId,topicId:def.topicId,date:'2026-09-20',done:true,source:'curriculum'}];
const masteryState=mastery(def.topicId);
assert.equal(masteryState.review3,false);assert.equal(masteryState.review7,false);assert.equal(masteryState.ready,false,'A high score cannot manufacture completed 3/7-day reviews');
assert.equal(space.mistakes.length,0,'Question evidence must not duplicate itself as a mistake record');

console.log('Question bank integration passed: publication gates + date rollover + start/submit checks + archived section review + evidence round-trip + same-day dedupe + all-question review + mastery spacing');
