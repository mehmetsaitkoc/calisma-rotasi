import fs from 'node:fs';
import assert from 'node:assert/strict';

await import('../public/catalog.js');
await import('../public/kpss-content-blueprint.js');
await import('../public/kpss-question-quality.js');
await import('../public/kpss-professional-bank.js');
await import('../public/kpss-professional-turkish-02.js');
await import('../public/kpss-professional-turkish-03.js');
await import('../public/kpss-professional-turkish-04.js');
await import('../public/kpss-professional-turkish-05.js');
await import('../public/kpss-professional-turkish-06.js');
await import('../public/kpss-professional-turkish-07.js');
await import('../public/kpss-professional-turkish-08.js');
await import('../public/kpss-professional-sections.js');

const C=globalThis.RotaCatalog;
const B=globalThis.RotaKpssContentBlueprint;
const Q=globalThis.RotaKpssQuestionQuality;
const P=globalThis.RotaKpssProfessionalBank;
const P2=globalThis.RotaKpssProfessionalTurkish02;
const P3=globalThis.RotaKpssProfessionalTurkish03;
const P4=globalThis.RotaKpssProfessionalTurkish04;
const P5=globalThis.RotaKpssProfessionalTurkish05;
const P6=globalThis.RotaKpssProfessionalTurkish06;
const P7=globalThis.RotaKpssProfessionalTurkish07;
const P8=globalThis.RotaKpssProfessionalTurkish08;
const S=globalThis.RotaKpssProfessionalSections;
assert.ok(C&&B&&Q&&P&&P2&&P3&&P4&&P5&&P6&&P7&&P8&&S,'KPSS v2 content modules must load');

const totals=B.totals(C);
assert.deepEqual(totals,{
  topics:64,
  topicTests:256,
  topicQuestions:3072,
  sectionExams:30,
  sectionQuestions:600,
  totalQuestions:3672
},'KPSS professional content target must stay 64 topics × 4×12 + five section exams per subject');

const kpssSubjects=C.subjects.filter(s=>s.exam==='kpss');
assert.deepEqual(kpssSubjects.map(s=>s.id),['k-tr','k-ma','k-ta','k-co','k-va','k-gu']);
const plan=B.topicPlan(C);
assert.equal(plan.length,64);
for(const row of plan){
  assert.equal(row.tests.length,4,row.topicId+' must plan four topic tests');
  assert.ok(row.tests.every(t=>t.questionTarget===12),row.topicId+' tests must target 12 questions');
  assert.deepEqual(row.tests.map(t=>t.setNo),[1,2,3,4]);
  assert.equal(row.totalQuestionTarget,48);
}

for(const subject of kpssSubjects){
  for(let v=0;v<5;v++){
    const bp=B.sectionBlueprint(subject.id,v);
    assert.equal(bp.questionTarget,B.SUBJECTS[subject.id].sectionQuestions);
    assert.equal(bp.rows.reduce((n,x)=>n+x.count,0),bp.questionTarget,subject.id+' section v'+(v+1)+' must sum correctly');
    assert.ok(bp.rows.every(x=>subject.topics.some(t=>t.id===x.topicId)),subject.id+' section blueprint must only use real catalog topics');
  }
}
assert.equal(B.sectionPlans().length,30);
assert.equal(B.SECTION_PROFILES.length,5);
assert.deepEqual(B.SECTION_PROFILES[0].difficulty,{easy:6,medium:18,hard:6});
assert.equal(B.OFFICIAL_SCOPE.generalCulture.historyPct,45);
assert.equal(B.OFFICIAL_SCOPE.generalCulture.geographyPct,30);
assert.equal(B.OFFICIAL_SCOPE.generalCulture.citizenshipPct,15);
assert.equal(B.OFFICIAL_SCOPE.generalCulture.generalCurrentPct,10);
assert.equal(B.COPYRIGHT_POLICY,'original-only');

const professional=[...P.tests,...P2.tests,...P3.tests,...P4.tests,...P5.tests,...P6.tests,...P7.tests,...P8.tests];
const audit=Q.auditBank(professional,{profiles:B.TEST_PROFILES,requireApproved:true});
assert.equal(audit.valid,true,JSON.stringify(audit.errors,null,2));
assert.equal(audit.tests,32);
assert.equal(audit.questions,384);
assert.equal(audit.topics,8);
for(const topicId of ['k-tr-1','k-tr-2','k-tr-3','k-tr-4','k-tr-5','k-tr-6','k-tr-7','k-tr-8']){
  const sets=professional.filter(t=>t.topicId===topicId);
  assert.deepEqual(sets.map(t=>t.setNo),[1,2,3,4]);
  assert.ok(sets.every(t=>t.subjectId==='k-tr'&&t.questions.length===12&&t.qualityStatus==='approved'));
}
assert.ok(professional.flatMap(t=>t.questions).every(q=>q.sourceKind==='original'&&q.copyrightPolicy==='original-only'));
assert.ok(professional.flatMap(t=>t.questions).every(q=>['context','interpretation','reasoning','application','recall'].includes(q.cognitive)));
assert.ok(P6.tests.flatMap(t=>t.questions).every(q=>q.optionMode==='orthography'),'Writing-rule questions must explicitly declare orthographic option comparison');

const semanticDuplicate={
  id:'semantic-dup',topicId:'k-tr-1',text:'Bu deneme sorusunda hangi seçenek anlam bakımından diğerlerinden farklıdır?',
  options:['Örnek','örnek','Deneme','Sınama','Kontrol'],answer:2,
  explanation:'Normal anlam sorularında yalnız büyük/küçük harfle ayrılan seçenekler bağımsız çeldirici sayılmaz.',
  difficulty:'medium',cognitive:'context',skill:'Bağlam',sourceKind:'original',copyrightPolicy:'original-only'
};
assert.throws(()=>Q.validateQuestion(semanticDuplicate,{topicId:'k-tr-1',requireMetadata:true}),/anlamsal olarak benzersiz/i,'Semantic content must not bypass normalized option uniqueness');
const orthographySurface={...semanticDuplicate,id:'orthography-surface',topicId:'k-tr-6',skill:'Büyük harf yazımı',optionMode:'orthography'};
assert.doesNotThrow(()=>Q.validateQuestion(orthographySurface,{topicId:'k-tr-6',requireMetadata:true}),'Writing-rule questions may assess capitalization/spacing as the actual option difference');
assert.ok(P7.tests.flatMap(t=>t.questions).every(q=>q.optionMode==='punctuation'),'Punctuation questions must explicitly declare punctuation option comparison');
const punctuationSurface={...semanticDuplicate,id:'punctuation-surface',topicId:'k-tr-7',skill:'Virgül kullanımı',optionMode:'punctuation',options:['A, B','A; B','A: B','A. B','A? B']};
assert.doesNotThrow(()=>Q.validateQuestion(punctuationSurface,{topicId:'k-tr-7',requireMetadata:true}),'Punctuation questions may assess punctuation marks as the actual option difference');
const invalidPunctuationSurface={...punctuationSurface,id:'punctuation-wrong-topic',topicId:'k-tr-1',skill:'Bağlam'};
assert.throws(()=>Q.validateQuestion(invalidPunctuationSurface,{topicId:'k-tr-1',requireMetadata:true}),/yalnız noktalama kazanımlarında/i,'Punctuation surface mode must not leak into semantic topics');

const professionalSection=S.sectionExams[0];
assert.ok(professionalSection,'Professional Turkish section pilot must exist');
Q.validateSectionExam(professionalSection,{
  blueprint:B.sectionBlueprint('k-tr',0),
  profile:B.SECTION_PROFILES[0]
});
assert.equal(professionalSection.qualityStatus,'approved');
assert.equal(professionalSection.questions.length,30);
assert.equal(professionalSection.questions.filter(q=>q.topicId==='k-tr-3').length,15,'Professional Turkish section must preserve the 15-question paragraph trend weight');
assert.deepEqual(Q.difficultyCounts(professionalSection.questions),{easy:6,medium:18,hard:6});
assert.ok(professionalSection.questions.every(q=>q.sourceKind==='original'&&q.copyrightPolicy==='original-only'));
for(const q of professional.flatMap(t=>t.questions)){
  for(const s of professionalSection.questions){
    assert.ok(!Q.suspiciouslySimilar(q.text,s.text),'Topic and section banks must not contain near-duplicate stems: '+q.id+' ↔ '+s.id);
  }
}

const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
for(const marker of [
  '<script src="/kpss-content-blueprint.js"></script>',
  '<script src="/kpss-question-quality.js"></script>',
  '<script src="/kpss-professional-bank.js"></script>',
  '<script src="/kpss-professional-turkish-02.js"></script>',
  '<script src="/kpss-professional-turkish-03.js"></script>',
  '<script src="/kpss-professional-turkish-04.js"></script>',
  '<script src="/kpss-professional-turkish-05.js"></script>',
  '<script src="/kpss-professional-turkish-06.js"></script>',
  '<script src="/kpss-professional-turkish-07.js"></script>',
  '<script src="/kpss-professional-turkish-08.js"></script>',
  '<script src="/kpss-professional-sections.js"></script>',
  'KPSS_PROFESSIONAL_TESTS',
  'KPSS_PROFESSIONAL_TOPIC_KEYS',
  'ACTIVE_LEGACY_MINI_EXAMS',
  'ROTA_ACTIVE_MINI_EXAMS',
  'KPSS_SEED_TOPIC_TESTS.filter',
  'RotaKpssQuestionQuality.auditBank',
  'requireApproved:true',
  'ROTA_ACTIVE_SECTION_EXAMS',
  'sectionWeakSkills(score)'
]) assert.ok(html.includes(marker),'Missing KPSS v2 integration marker: '+marker);
assert.ok(html.includes('ROTA_ALL_MINI_EXAMS'),'Archived mini definitions must remain resolvable for old attempts');

console.log('KPSS content v2 passed: 3,672-question target + 384 approved topic questions across 8 Turkish topics + 30-question professional Turkish section pilot');
