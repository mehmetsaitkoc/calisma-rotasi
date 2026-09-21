/* Çalışma Rotası Intelligence V1
   Deterministic longitudinal intelligence primitives.
   No UI, entitlement, persistence or network side effects. */
(function(root){
'use strict';

const DAY=86400000;
const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,Number.isFinite(Number(n))?Number(n):min));
const round=(n,d=0)=>{const p=10**d;return Math.round((Number(n)||0)*p)/p;};
const safeArray=v=>Array.isArray(v)?v:[];
const optionalNumber=v=>v===null||v===undefined||v===''?null:(Number.isFinite(Number(v))?Number(v):null);
const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''));
const dateMs=v=>validDate(v)?new Date(v+'T12:00:00Z').getTime():NaN;
function daysBetween(a,b){
  const aa=dateMs(a),bb=dateMs(b);
  return Number.isFinite(aa)&&Number.isFinite(bb)?Math.round((bb-aa)/DAY):null;
}
function inWindow(date,today,days){
  const delta=daysBetween(date,today);
  return delta!==null&&delta>=0&&delta<days;
}
function sum(xs,fn){return xs.reduce((n,x)=>n+(Number(fn(x))||0),0);}
function ratio(a,b){return b>0?a/b:null;}
function weightedAccuracy(rows){
  let correct=0,wrong=0;
  for(const x of rows){
    if(Number.isInteger(x?.correct)&&Number.isInteger(x?.wrong)&&x.correct>=0&&x.wrong>=0){
      correct+=x.correct;wrong+=x.wrong;
    }
  }
  const answered=correct+wrong;
  return {known:answered>0,answered,correct,wrong,accuracy:answered?round(correct/answered*100,1):null};
}
function uniqueDays(rows){return new Set(rows.map(x=>x?.date).filter(validDate)).size;}

function rollingWindow(workspace,today,days=30){
  const w=workspace||{};
  const logs=safeArray(w.logs).filter(x=>inWindow(x.date,today,days));
  const assessments=safeArray(w.assessments).filter(x=>inWindow(x.date,today,days));
  const exams=safeArray(w.exams).filter(x=>inWindow(x.date,today,days));
  const mistakes=safeArray(w.mistakes).filter(x=>inWindow(x.date||x.createdDate||'',today,days));
  const events=safeArray(w.taskEvents).filter(x=>inWindow(x.date,today,days));
  const modes=safeArray(w.route?.modeHistory).filter(x=>inWindow(x.date,today,days));
  const plan=safeArray(w.plan).filter(x=>validDate(x.date)&&inWindow(x.date,today,days));
  const due=plan.filter(x=>x.date<=today);
  const completed=due.filter(x=>x.done);
  const accuracy=weightedAccuracy(logs);
  const assessmentAccuracy=weightedAccuracy(assessments);
  const started=events.filter(x=>x.action==='start').length;
  const skipped=events.filter(x=>x.action==='skip').length;
  const later=events.filter(x=>x.action==='later').length;
  const repairModes=modes.filter(x=>x.mode==='repair').length;
  const progressModes=modes.filter(x=>x.mode==='progress').length;
  const openMistakes=safeArray(w.mistakes).filter(x=>!x.resolved).length;
  return {
    days,
    from:new Date(dateMs(today)-(days-1)*DAY).toISOString().slice(0,10),
    to:today,
    studyMinutes:sum(logs,x=>x.minutes),
    activeDays:uniqueDays(logs),
    logCount:logs.length,
    practice:accuracy,
    assessment:assessmentAccuracy,
    examCount:exams.length,
    mistakeCount:mistakes.length,
    openMistakes,
    execution:{
      due:due.length,
      completed:completed.length,
      completion:due.length?round(completed.length/due.length*100,1):null,
      started,skipped,later,
      friction:events.length?round((skipped+later)/events.length*100,1):null
    },
    adaptation:{repair:repairModes,progress:progressModes,total:modes.length}
  };
}

function longitudinalProfile(workspace,today){
  if(!validDate(today))throw Error('Intelligence V1 requires YYYY-MM-DD today.');
  const w7=rollingWindow(workspace,today,7);
  const w30=rollingWindow(workspace,today,30);
  const w60=rollingWindow(workspace,today,60);
  const evidenceSources=[
    w60.logCount>0,
    w60.practice.known||w60.assessment.known,
    w60.examCount>0,
    w60.execution.due>0,
    w60.adaptation.total>0,
    w60.openMistakes>0
  ].filter(Boolean).length;
  const samplePower=Math.min(55,w60.logCount*2+w60.practice.answered*.18+w60.assessment.answered*.2+w60.examCount*5+Math.min(20,w60.execution.due));
  const confidence=Math.round(clamp(evidenceSources*8+samplePower,0,100));
  const recent=w7.practice.known?w7.practice.accuracy:w7.assessment.accuracy;
  const long=w30.practice.known?w30.practice.accuracy:w30.assessment.accuracy;
  let trend='unknown',delta=null;
  if(Number.isFinite(recent)&&Number.isFinite(long)){
    delta=round(recent-long,1);
    trend=delta>=4?'up':delta<=-4?'down':'flat';
  }
  return {version:1,today,confidence,trend,trendDelta:delta,windows:{d7:w7,d30:w30,d60:w60}};
}

function targetRisk(input={}){
  const confidence=clamp(input.confidence||0);
  const current=optionalNumber(input.currentNet),target=optionalNumber(input.targetNet),daysLeft=optionalNumber(input.daysLeft);
  const completion=optionalNumber(input.completion),performance=optionalNumber(input.performance),retention=optionalNumber(input.retention);
  const trend=String(input.trend||'unknown');
  const openMistakes=Math.max(0,Number(input.openMistakes)||0);
  const gap=current!==null&&target!==null?Math.max(0,target-current):null;
  const reasons=[];
  let score=0;
  if(gap!==null){
    if(gap>=30){score+=34;reasons.push('Hedef ile mevcut net arasındaki fark yüksek.');}
    else if(gap>=18){score+=24;reasons.push('Hedef ile mevcut net arasında belirgin fark var.');}
    else if(gap>=8){score+=12;reasons.push('Hedefe ulaşmak için net artışı gerekiyor.');}
  }
  if(daysLeft!==null){
    if(daysLeft<=30){score+=18;reasons.push('Hedef tarihine 30 günden az kaldı.');}
    else if(daysLeft<=60){score+=10;reasons.push('Hedef tarihi 60 günlük pencerenin içinde.');}
  }
  if(completion!==null&&completion<55){score+=18;reasons.push('Plan gerçekleşme oranı düşük.');}
  else if(completion!==null&&completion<72){score+=9;reasons.push('Plan gerçekleşme oranı hedeflenen istikrarın altında.');}
  if(performance!==null&&performance<55){score+=16;reasons.push('Ölçülen soru performansı zayıf.');}
  if(retention!==null&&retention<55){score+=14;reasons.push('3/7 tekrarlarında kalıcılık sinyali zayıf.');}
  if(trend==='down'){score+=14;reasons.push('Son performans eğilimi aşağı yönlü.');}
  if(openMistakes>=8){score+=10;reasons.push('Açık yanlış yükü yükselmiş.');}
  else if(openMistakes>=3){score+=5;reasons.push('Çözülmemiş yanlışlar birikiyor.');}

  score=Math.round(clamp(score));
  const reliable=confidence>=30&&(gap!==null||performance!==null||completion!==null);
  const band=!reliable?'insufficient':score>=65?'high':score>=40?'watch':'low';
  const label={insufficient:'Ölçüm için veri gerekiyor',high:'Hedef riski yüksek',watch:'Hedef riski izlenmeli',low:'Hedef riski kontrollü'}[band];
  const action=band==='high'?'Yeni konu yükünü azalt; zayıf alan, yanlış onarımı ve deneme geri bildirimine ağırlık ver.'
    :band==='watch'?'Öncelikli zayıf alanları ve plan gerçekleşmesini yakından izle.'
    :band==='low'?'Mevcut tempoyu koru; 3/7 tekrar ve deneme geri bildirimini sürdür.'
    :'Önce gerçek çalışma ve deneme verisi topla; düşük güvenle risk hükmü verme.';
  return {score:reliable?score:null,band,label,action,reasons:reasons.slice(0,5),confidence,reliable,gap};
}

function executionPrescription(profileInput={}){
  const confidence=clamp(profileInput?.confidence||0);
  const d7=profileInput?.windows?.d7?.execution||{};
  const d30=profileInput?.windows?.d30?.execution||{};
  const due7=Math.max(0,Number(d7.due)||0),due30=Math.max(0,Number(d30.due)||0);
  const completion7=optionalNumber(d7.completion),completion30=optionalNumber(d30.completion);
  if(confidence<55||due30<6||completion30===null){
    return {mode:'collect',confidence,due7,due30,completion7,completion30,reason:'Uzun dönem görev dozu için henüz yeterli gerçekleşme kanıtı yok.'};
  }
  const recentKnown=due7>=2&&completion7!==null;
  const rebound=recentKnown&&completion30<55&&completion7>=70&&completion7>=completion30+15;
  if(rebound){
    return {mode:'steady',state:'rebound',confidence,due7,due30,completion7,completion30,reason:'30 günlük gerçekleşme düşük olsa da son 7 günde belirgin toparlanma var; yükü yeniden kısmadan mevcut dozu doğrula.'};
  }
  if(completion30<50&&recentKnown&&completion7<60){
    return {mode:'ease',state:'persistent_strain',confidence,due7,due30,completion7,completion30,reason:'7 ve 30 günlük gerçekleşme birlikte düşük; daha fazla görev eklemek yerine günlük dozu küçültüp tamamlanabilirliği geri kazan.'};
  }
  return {mode:'steady',state:'sustainable',confidence,due7,due30,completion7,completion30,reason:'Uzun dönem gerçekleşme, ek bir yük azaltma müdahalesi gerektirmiyor.'};
}

function repairProposal(input={}){
  const confidence=clamp(input.confidence||0);
  const performance=optionalNumber(input.performance),retention=optionalNumber(input.retention);
  const openMistakes=Math.max(0,Number(input.openMistakes)||0);
  const repeated=!!input.repeatedError;
  const trend=String(input.trend||'unknown');
  if(confidence<25)return {mode:'collect',priority:35,minutes:20,questions:10,reason:'Önce kısa bir ölçümle gerçek kanıt topla.'};
  let need=0,reasons=[];
  if(performance!==null&&performance<60){need+=35;reasons.push('soru performansı düşük');}
  if(retention!==null&&retention<60){need+=25;reasons.push('kalıcılık zayıf');}
  if(openMistakes>=3){need+=Math.min(20,openMistakes*2);reasons.push('açık yanlış var');}
  if(repeated){need+=20;reasons.push('aynı hata örüntüsü tekrarlanıyor');}
  if(trend==='down'){need+=12;reasons.push('eğilim aşağı yönlü');}
  need=clamp(need);
  if(need<35)return {mode:'steady',priority:50,minutes:25,questions:14,reason:'Belirgin onarım ihtiyacı yok; normal öğrenme akışı yeterli.'};
  return {
    mode:'repair',
    priority:Math.round(Math.max(70,need)),
    minutes:need>=75?40:30,
    questions:need>=75?18:14,
    reason:'Onarım önerisi: '+reasons.slice(0,3).join(', ')+'.',
    steps:['Kısa konu hatırlama','Hedefli soru seti','Yanlış nedeni kaydı','3/7 tekrar işareti']
  };
}

function interventionMemory(input={}){
  const effect=input.effect&&typeof input.effect==='object'?input.effect:{};
  const mode=['repair','ease','progress'].includes(input.mode)?input.mode:'';
  const total=Math.max(0,Number(effect.total)||0);
  const helpful=Math.max(0,Number(effect.helpful)||0);
  const harmful=Math.max(0,Number(effect.harmful)||0);
  const neutral=Math.max(0,Number(effect.neutral)||0);
  const score=Number.isFinite(Number(effect.score))?Math.max(-1,Math.min(1,Number(effect.score))):0;
  if(!mode||!effect.known||total<2){
    return {known:false,mode,total,helpful,harmful,neutral,score:0,action:'hold',label:'Karar hafızası için daha fazla sonuç gerekiyor.',reason:'Aynı müdahalenin en az iki olgun geri testi olmadan yöntem değiştirilmiyor.'};
  }
  const action=score<=-.34?'change':score>=.5?'repeat':'hold';
  const label=action==='change'?'Aynı yaklaşımı değiştirmek gerekiyor':action==='repeat'?'İşe yarayan çekirdeği koru':'Sonuçlar karışık; yöntemi sabit tut';
  const reason=action==='change'
    ?'Bu müdahale öğrencide birden fazla olgun takipte yeterli sonuç vermedi.'
    :action==='repeat'
      ?'Bu müdahale öğrencide birden fazla olgun takipte çoğunlukla olumlu sonuç verdi.'
      :'Geri testler aynı yönde birleşmediği için aşırı uyarlama yapılmıyor.';
  return {known:true,mode,total,helpful,harmful,neutral,score:round(score,2),action,label,reason};
}

function explainTask(input={}){
  const task=input.task||{},model=input.model||{},decision=input.decision||{},risk=input.risk||null,mastery=input.mastery||null,outcomeMemory=input.outcomeMemory||null;
  const reasons=[];
  if(task.kind==='review'||task.source==='mistake'||task.sourceMistakeId)reasons.push('Bu görev önceki yanlışını kapatmak için bugün öne alındı.');
  if(String(task.source||'').includes('exam'))reasons.push('Son deneme sonucu bu alanı yeniden önceliklendirdi.');
  if(decision.mode==='repair')reasons.push('Öğrenci modeli bu konuda onarım modu öneriyor.');
  else if(decision.mode==='progress')reasons.push('Son kanıtların yeterli olduğu için ilerleme modu seçildi.');
  if(model.trend?.direction==='down'||model.trend==='down')reasons.push('Son performans eğilimi aşağı yönlü.');
  if(Number(model.openMistakes)>=3)reasons.push('Açık yanlışların bu konunun önceliğini artırıyor.');
  if(mastery&&mastery.ready===false&&mastery.next)reasons.push('3/7 kalıcılık döngüsünde sıradaki kontrol zamanı geldi.');
  if(risk?.band==='high')reasons.push('Hedef riski yükseldiği için yüksek getirili çalışmalara ağırlık veriliyor.');
  if(outcomeMemory?.known&&outcomeMemory.action==='change')reasons.push('Aynı müdahale geçmişte yeterli sonuç vermediği için bu kez yöntem değiştiriliyor.');
  else if(outcomeMemory?.known&&outcomeMemory.action==='repeat')reasons.push('Bu müdahalenin çekirdeği geçmişte işe yaradığı için korunuyor.');
  if(!reasons.length&&task.reason)reasons.push(String(task.reason));
  if(!reasons.length)reasons.push('Bu görev haftalık yük, hedef ve mevcut konu sırasına göre seçildi.');
  return {headline:'Neden bugün?',reasons:reasons.slice(0,3),text:reasons.slice(0,2).join(' ')};
}

root.RotaIntelligenceV1={rollingWindow,longitudinalProfile,targetRisk,executionPrescription,repairProposal,interventionMemory,explainTask};
if(typeof module==='object')module.exports=root.RotaIntelligenceV1;
})(typeof window!=='undefined'?window:globalThis);
