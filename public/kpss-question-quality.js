(function(root){
'use strict';

const SCHEMA='calisma-rotasi-kpss-question-quality-v1';
const DIFFICULTIES=new Set(['easy','medium','hard']);
const COGNITIVE=new Set(['recall','context','interpretation','reasoning','application']);
const QUALITY_STATUSES=new Set(['draft','reviewed','approved']);
const FORBIDDEN_OPTION_PATTERNS=[/^hepsi$/i,/^hiçbiri$/i,/^a ve b$/i,/^b ve c$/i,/^c ve d$/i];

function norm(v){return String(v??'').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9çğıöşü]+/gi,' ').replace(/\s+/g,' ').trim();}
function assert(condition,message){if(!condition)throw new Error(message);}
function maxRun(xs){let best=0,run=0,last=null;for(const x of xs){if(x===last)run++;else{last=x;run=1;}best=Math.max(best,run);}return best;}
function tokenSet(v){return new Set(norm(v).split(' ').filter(x=>x.length>=3));}
function jaccard(a,b){const A=tokenSet(a),B=tokenSet(b);if(!A.size||!B.size)return 0;let intersection=0;for(const x of A)if(B.has(x))intersection++;return intersection/(A.size+B.size-intersection);}
function suspiciouslySimilar(a,b){const A=tokenSet(a),B=tokenSet(b);if(Math.min(A.size,B.size)<8)return false;return jaccard(a,b)>=.86;}
function difficultyCounts(questions){return questions.reduce((o,q)=>(o[q.difficulty]=(o[q.difficulty]||0)+1,o),{easy:0,medium:0,hard:0});}

function validateQuestion(q,{topicId='',requireMetadata=true}={}){
  assert(q&&typeof q==='object','Soru nesnesi geçersiz.');
  assert(typeof q.id==='string'&&q.id.length>=5,'Soru kimliği eksik.');
  assert(typeof q.text==='string'&&q.text.trim().length>=24,'Soru kökü çok kısa: '+q.id);
  assert(Array.isArray(q.options)&&q.options.length===5,'Soru 5 seçenekli olmalı: '+q.id);
  const opts=q.options.map(x=>String(x).trim());
  assert(opts.every(x=>x.length>0),'Boş seçenek olamaz: '+q.id);
  assert(new Set(opts).size===5,'Seçenekler yüzey biçiminde benzersiz olmalı: '+q.id);
  if(q.optionMode==='orthography'){
    assert(q.topicId==='k-tr-6'||(q.skill&&/yaz|harf|ek|kısaltma|sayı|özel ad|kurum|eser|birleşik|bağlaç|ki|de\/da|soru eki/i.test(q.skill)),'Orthography istisnası yalnız yazım kazanımlarında kullanılabilir: '+q.id);
  }else{
    assert(new Set(opts.map(norm)).size===5,'Seçenekler anlamsal olarak benzersiz olmalı: '+q.id);
  }
  assert(!opts.some(o=>FORBIDDEN_OPTION_PATTERNS.some(re=>re.test(o))),'Zayıf toplama seçeneği kullanılamaz: '+q.id);
  assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<5,'Cevap anahtarı geçersiz: '+q.id);
  assert(typeof q.explanation==='string'&&q.explanation.trim().length>=32,'Açıklama yetersiz: '+q.id);
  if(topicId)assert(q.topicId===topicId,'Soru yanlış konuya bağlı: '+q.id);
  if(requireMetadata){
    assert(DIFFICULTIES.has(q.difficulty),'Zorluk etiketi eksik/geçersiz: '+q.id);
    assert(COGNITIVE.has(q.cognitive),'Bilişsel etiket eksik/geçersiz: '+q.id);
    assert(typeof q.skill==='string'&&q.skill.trim().length>=3,'Kazanım etiketi eksik: '+q.id);
    assert(q.sourceKind==='original','Soru özgün olarak işaretlenmeli: '+q.id);
    assert(q.copyrightPolicy==='original-only','Telif politikası eksik: '+q.id);
  }
  return q;
}
function validateTopicTest(test,profile){
  assert(test&&typeof test==='object','Test tanımı geçersiz.');
  assert(test.exam==='kpss','Test KPSS olmalı: '+test.id);
  assert(typeof test.subjectId==='string'&&typeof test.topicId==='string','Ders/konu kimliği eksik: '+test.id);
  assert(Array.isArray(test.questions)&&test.questions.length===12,'Profesyonel konu testi 12 soru olmalı: '+test.id);
  assert(QUALITY_STATUSES.has(test.qualityStatus),'Kalite durumu geçersiz: '+test.id);
  assert(test.sourceKind==='original'&&test.copyrightPolicy==='original-only','Test özgün içerik olmalı: '+test.id);
  if(test.subjectId==='k-gu'){
    assert(/^\d{4}-\d{2}-\d{2}$/.test(test.contentAsOf||''),'Güncel Bilgiler testi contentAsOf taşımalı: '+test.id);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(test.reviewAfter||''),'Güncel Bilgiler testi reviewAfter taşımalı: '+test.id);
    assert(test.reviewAfter>test.contentAsOf,'Güncel Bilgiler yenileme tarihi içerik tarihinden sonra olmalı: '+test.id);
  }
  const ids=new Set(),stems=new Set();
  test.questions.forEach(q=>{
    validateQuestion(q,{topicId:test.topicId,requireMetadata:true});
    assert(!ids.has(q.id),'Test içinde soru kimliği tekrar ediyor: '+q.id);ids.add(q.id);
    const key=norm(q.text);assert(!stems.has(key),'Test içinde soru kökü tekrar ediyor: '+q.id);stems.add(key);
  });
  const answers=test.questions.map(q=>q.answer),counts=[0,0,0,0,0];answers.forEach(a=>counts[a]++);
  assert(counts.every(n=>n>=1&&n<=3),'Cevap anahtarı dengesiz: '+test.id+' ['+counts.join(',')+']');
  assert(maxRun(answers)<=2,'Aynı seçenek art arda 3+ kez doğru olamaz: '+test.id);
  if(profile){
    const got=difficultyCounts(test.questions),want=profile.difficulty;
    for(const k of ['easy','medium','hard'])assert(got[k]===want[k],'Zorluk dağılımı hatalı '+test.id+' '+k+': '+got[k]+' != '+want[k]);
  }
  const nonRecall=test.questions.filter(q=>q.cognitive!=='recall').length;
  assert(nonRecall>=6,'Testin en az yarısı bağlam/yorum/akıl yürütme olmalı: '+test.id);
  return test;
}
function validateSectionExam(exam,{blueprint=null,profile=null}={}){
  assert(exam&&typeof exam==='object','Bölüm denemesi tanımı geçersiz.');
  assert(exam.exam==='kpss','Bölüm denemesi KPSS olmalı: '+exam?.id);
  assert(typeof exam.subjectId==='string'&&exam.subjectId,'Bölüm denemesi ders kimliği eksik: '+exam?.id);
  assert(Array.isArray(exam.questions)&&exam.questions.length===Number(exam.questionTarget),'Bölüm denemesi soru sayısı hedefle uyuşmalı: '+exam.id);
  assert(QUALITY_STATUSES.has(exam.qualityStatus),'Bölüm denemesi kalite durumu geçersiz: '+exam.id);
  assert(exam.sourceKind==='original'&&exam.copyrightPolicy==='original-only','Bölüm denemesi özgün olmalı: '+exam.id);
  if(exam.subjectId==='k-gu'){
    assert(/^\d{4}-\d{2}-\d{2}$/.test(exam.contentAsOf||''),'Güncel Bilgiler bölüm denemesi contentAsOf taşımalı: '+exam.id);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(exam.reviewAfter||''),'Güncel Bilgiler bölüm denemesi reviewAfter taşımalı: '+exam.id);
    assert(exam.reviewAfter>exam.contentAsOf,'Güncel Bilgiler bölüm denemesi yenileme tarihi hatalı: '+exam.id);
  }
  const ids=new Set(),stems=new Set();
  for(const q of exam.questions){
    validateQuestion(q,{requireMetadata:true});
    assert(!ids.has(q.id),'Bölüm denemesinde soru kimliği tekrar ediyor: '+q.id);ids.add(q.id);
    const stem=norm(q.text);assert(!stems.has(stem),'Bölüm denemesinde soru kökü tekrar ediyor: '+q.id);stems.add(stem);
  }
  const answers=exam.questions.map(q=>q.answer),counts=[0,0,0,0,0];answers.forEach(a=>counts[a]++);
  const target=exam.questions.length/5;
  assert(counts.every(n=>Math.abs(n-target)<=2),'Bölüm denemesi cevap anahtarı dengesiz: '+exam.id+' ['+counts.join(',')+']');
  assert(maxRun(answers)<=2,'Bölüm denemesinde aynı seçenek art arda 3+ kez doğru olamaz: '+exam.id);
  if(profile){
    const got=difficultyCounts(exam.questions),want=profile.difficulty;
    for(const k of ['easy','medium','hard'])assert(got[k]===want[k],'Bölüm zorluk dağılımı hatalı '+exam.id+' '+k+': '+got[k]+' != '+want[k]);
  }
  if(blueprint){
    const expected=new Map((blueprint.rows||[]).map(x=>[x.topicId,x.count])),got=new Map();
    for(const q of exam.questions)got.set(q.topicId,(got.get(q.topicId)||0)+1);
    assert([...got.values()].reduce((n,x)=>n+x,0)===blueprint.questionTarget,'Bölüm denemesi blueprint toplamı hatalı: '+exam.id);
    for(const [topicId,count] of expected)assert((got.get(topicId)||0)===count,'Bölüm denemesi konu dağılımı hatalı: '+exam.id+' '+topicId);
    for(const topicId of got.keys())assert(expected.has(topicId),'Bölüm denemesinde blueprint dışı konu var: '+exam.id+' '+topicId);
  }
  assert(exam.questions.filter(q=>q.cognitive!=='recall').length>=Math.ceil(exam.questions.length*.6),'Bölüm denemesinin en az %60’ı bağlam/yorum/akıl yürütme olmalı: '+exam.id);
  return exam;
}

function auditBank(tests,{profiles=[],requireApproved=false}={}){
  const ids=new Set(),stems=new Set(),questionRows=[],byTopic=new Map(),errors=[];
  for(const test of tests||[]){
    try{
      const profile=profiles.find(p=>p.setNo===test.setNo);
      validateTopicTest(test,profile);
      if(requireApproved)assert(test.qualityStatus==='approved','Yayın için test approved olmalı: '+test.id);
      const key=test.subjectId+'|'+test.topicId,x=byTopic.get(key)||[];x.push(test);byTopic.set(key,x);
      for(const q of test.questions){
        if(ids.has(q.id))throw new Error('Banka genelinde soru kimliği tekrar ediyor: '+q.id);ids.add(q.id);
        const stem=norm(q.text);if(stems.has(stem))throw new Error('Banka genelinde aynı soru kökü tekrar ediyor: '+q.id);
        const near=questionRows.find(prev=>suspiciouslySimilar(prev.text,q.text));if(near)throw new Error('Banka genelinde aşırı benzer soru kökü: '+near.id+' ↔ '+q.id);
        stems.add(stem);questionRows.push({id:q.id,text:q.text});
      }
    }catch(e){errors.push({testId:test?.id||'',message:e.message});}
  }
  return {schema:SCHEMA,tests:(tests||[]).length,questions:ids.size,topics:byTopic.size,errors,valid:errors.length===0};
}

root.RotaKpssQuestionQuality={SCHEMA,DIFFICULTIES,COGNITIVE,QUALITY_STATUSES,norm,tokenSet,jaccard,suspiciouslySimilar,maxRun,difficultyCounts,validateQuestion,validateTopicTest,validateSectionExam,auditBank};
if(typeof module==='object')module.exports=root.RotaKpssQuestionQuality;
})(typeof window!=='undefined'?window:globalThis);
