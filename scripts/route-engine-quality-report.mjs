import fs from 'node:fs';
import { lfResults, lfSummary } from './route-engine-closed-loop.mjs';

const outUrl=new URL('../reports/route-engine-quality-report.md',import.meta.url);
fs.mkdirSync(new URL('../reports/',import.meta.url),{recursive:true});

const sum=(xs,fn)=>xs.reduce((n,x)=>n+(fn(x)||0),0);
const avg=(xs,fn)=>xs.length?Math.round(sum(xs,fn)/xs.length):0;
const modeNames={repair:'ONARIM',ease:'SÜRDÜRÜLEBİLİR',progress:'GELİŞİM',steady:'DENGELİ'};
const stateNames={repair:'ONARIM',sustainable:'SÜRDÜRÜLEBİLİR',progress:'GELİŞİM',steady:'DENGELİ',retention:'KALICILIK',collect:'VERİ TOPLUYOR'};

function harmfulHorizons(r){
  return Object.values(r.backtest.byMode||{}).reduce((n,x)=>n+(x.harmful||0),0);
}
function interventionEvents(r){
  return (r.backtest.success||0)+(r.backtest.neutral||0)+(r.backtest.harmful||0);
}
function evidenceGaps(r){
  return (r.backtest.insufficientEvidence||0)+(r.backtest.confounded||0);
}
function qualityStatus(r){
  const d=r.day60,b=r.backtest,refresh=d.refreshAudit||{};
  const blocker=d.modeBounces>0||d.stabilityScore<80||(b.harmful||0)>0||harmfulHorizons(r)>0||(refresh.duplicateKeys||0)>0||(d.masteryRegressions||0)>0||d.staleEvidenceInfluence>18;
  if(blocker)return {key:'blocker',label:'BLOKER'};
  const watch=d.stabilityScore<90||d.risk>=50||evidenceGaps(r)>=3||(refresh.maxPerTopic||0)>3;
  if(watch)return {key:'watch',label:'İZLE'};
  return {key:'strong',label:'GÜÇLÜ'};
}
function noteFor(r){
  const d=r.day60,b=r.backtest,notes=[];
  if(d.modeBounces===0)notes.push('mod bounce yok');
  if(d.stabilityScore===100)notes.push('stability 100');
  if(d.longestRepairStreak>=20)notes.push('uzun ONARIM dönemi');
  if(d.longestProgressStreak>=10)notes.push('uzun GELİŞİM dönemi');
  if(d.risk>=50)notes.push('final risk yüksek');
  if(evidenceGaps(r)>=3)notes.push('uzun dönem kanıt açığı');
  if(interventionEvents(r)===0)notes.push('müdahale gerekmedi / geri test yok');
  if((d.refreshAudit?.maxPerTopic||0)>=3)notes.push('refresh yoğunluğunu izle');
  if(d.examEvidenceCount>=2&&Number.isFinite(d.freshExamWeight)&&Number.isFinite(d.oldExamWeight)&&d.freshExamWeight>d.oldExamWeight)notes.push('yeni deneme eski kanıtı geçti');
  if(!notes.length)notes.push('kritik anomali yok');
  return notes.join(', ');
}
function row(r){
  const d=r.day60,s=qualityStatus(r),events=interventionEvents(r),gaps=evidenceGaps(r);
  return `| ${r.persona.name} | ${s.label} | ${stateNames[d.finalState]||d.finalState} | ${d.stabilityScore} | ${d.risk} | ${d.completedTopics} | ${events} | ${gaps} | ${noteFor(r)} |`;
}

const statuses=lfResults.map(r=>qualityStatus(r));
const blockerCount=statuses.filter(x=>x.key==='blocker').length;
const watchCount=statuses.filter(x=>x.key==='watch').length;
const strongCount=statuses.filter(x=>x.key==='strong').length;
const totalBounces=sum(lfResults,r=>r.day60.modeBounces);
const totalHarmful=sum(lfResults,r=>r.backtest.harmful);
const totalHarmfulHorizons=sum(lfResults,harmfulHorizons);
const totalInsufficient=sum(lfResults,r=>r.backtest.insufficientEvidence);
const totalConfounded=sum(lfResults,r=>r.backtest.confounded);
const masteryRegressions=sum(lfResults,r=>r.day60.masteryRegressions);
const refreshDuplicateKeys=sum(lfResults,r=>r.day60.refreshAudit?.duplicateKeys);
const maxStale=Math.max(...lfResults.map(r=>r.day60.staleEvidenceInfluence||0));
const sourceSha=process.env.GITHUB_SHA||'local-working-tree';
const generatedAt=new Date().toISOString();

const watchRows=lfResults
  .filter(r=>qualityStatus(r).key!=='strong')
  .sort((a,b)=>{
    const rank={blocker:2,watch:1,strong:0};
    return rank[qualityStatus(b).key]-rank[qualityStatus(a).key]||evidenceGaps(b)-evidenceGaps(a)||a.persona.id.localeCompare(b.persona.id);
  });

const report=`# Route Engine — 60 Günlük Motor Quality Report

**Üretim zamanı:** ${generatedAt}  
**Kaynak SHA:** ${sourceSha}  
**Test kapsamı:** ${lfResults.length} persona × 60 gün = ${lfResults.length*60} günlük kapalı döngü karar simülasyonu

## Yönetici özeti

Bu rapor gerçek kullanıcı başarısını kanıtlamaz; sentetik uzun dönem yaşam döngülerinde motorun karar tutarlılığını, kanıt eskimesini, forgetting/mastery davranışını ve müdahale sonuçlarını denetler.

- Ortalama 60 günlük stability score: **${avg(lfResults,r=>r.day60.stabilityScore)}/100**
- Mode bounce: **${totalBounces}**
- Zararlı müdahale olayı: **${totalHarmful}**
- Zararlı 7/14/30 günlük müdahale ufku: **${totalHarmfulHorizons}**
- Mastery regression: **${masteryRegressions}**
- Tekrarlanan retention-refresh routeKey: **${refreshDuplicateKeys}**
- En yüksek stale evidence influence: **${maxStale}**
- Müdahale geri testinde yetersiz takip ufku: **${totalInsufficient}**
- Persona faz değişimi nedeniyle confounded ufuk: **${totalConfounded}**
- Durum dağılımı: **${strongCount} güçlü · ${watchCount} izle · ${blockerCount} bloker**

### Kalite kapısı

**${blockerCount===0?'GEÇTİ':'KALDI'}** — Sentetik 60 günlük kalite kapısında ${blockerCount===0?'bloker bulunmadı.':'bloker senaryolar mevcut.'}

Gerçek kullanıcı pilotu açısından bu sonuç **teknik güvenlik/istikrar sinyali** sağlar; pedagojik etki veya gerçek öğrencide başarı artışı için kontrollü pilot verisi hâlâ gereklidir.

## Persona özeti

| Persona | Durum | 60g final state | Stability | Risk | Tamamlanan konu | Müdahale olayı | Kanıt açığı | Not |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
${lfResults.map(row).join('\n')}

## Özellikle izlenecek personelar

${watchRows.length?watchRows.map(r=>{
  const d=r.day60,s=qualityStatus(r),g=evidenceGaps(r),refresh=d.refreshAudit||{};
  return `### ${r.persona.name} — ${s.label}

- Final state: **${stateNames[d.finalState]||d.finalState}**
- Stability: **${d.stabilityScore}/100**, bounce: **${d.modeBounces}**
- Final risk: **${d.risk}**, learningNeed: **${d.learningNeed}**, confidence: **${d.confidence}**
- Longest repair/progress streak: **${d.longestRepairStreak} / ${d.longestProgressStreak} gün**
- Müdahale geri testi: **${r.backtest.success} başarılı · ${r.backtest.neutral} nötr · ${r.backtest.harmful} zararlı**
- Takip kanıtı: **${r.backtest.insufficientEvidence} yetersiz · ${r.backtest.confounded} confounded**
- Forgetting refresh: **${d.forgettingRefreshCount}**, konu başına maksimum **${refresh.maxPerTopic||0}**
- Değerlendirme: ${noteFor(r)}
`;
}).join('\n'):'İzleme gerektiren sentetik persona yok.'}

## Müdahale geri testi

Motorun ONARIM / SÜRDÜRÜLEBİLİR / GELİŞİM kararları 7, 14 ve 30 günlük ufuklarda ayrı değerlendirilir. Faz değiştiren personada sonuç, müdahaleye yanlış nedensellik yüklememek için **confounded** sayılır. Takip süresi dolmayan ufuklar **insufficient** kalır.

| Mod | Başarılı ufuk | Nötr ufuk | Zararlı ufuk | Yetersiz | Confounded |
| --- | ---: | ---: | ---: | ---: | ---: |
${['repair','ease','progress'].map(mode=>{
  const x=lfResults.reduce((a,r)=>{
    const m=r.backtest.byMode?.[mode]||{};a.success+=m.success||0;a.neutral+=m.neutral||0;a.harmful+=m.harmful||0;a.insufficient+=m.insufficient||0;a.confounded+=m.confounded||0;return a;
  },{success:0,neutral:0,harmful:0,insufficient:0,confounded:0});
  return `| ${modeNames[mode]} | ${x.success} | ${x.neutral} | ${x.harmful} | ${x.insufficient} | ${x.confounded} |`;
}).join('\n')}

## Forgetting / mastery denetimi

- 14 / 21 / 30 günlük forgetting pencereleri fixture ile korunuyor.
- Retention refresh tamamlandığında forgetting saati yeni gerçek kanıt tarihinden yeniden başlıyor.
- Eski 3/7 günlük tekrar ve eski retention refresh kanıtı yeni ana öğrenme döngüsünü tamamlatamıyor.
- 60 günlük simülasyonda duplicate refresh routeKey sayısı: **${refreshDuplicateKeys}**.
- Mastery regression sayısı: **${masteryRegressions}**.

## Evidence freshness / exam refresh

Eski deneme kanıtı yaş ve yeni çalışma kanıtıyla zayıflıyor. `exam-refresh` personasında yeni deneme ayrı kanıt olarak tutuluyor ve eski denemeden daha yüksek ağırlık alması assertion ile korunuyor. 60 günlük bütün personelar içinde maksimum stale-evidence etkisi **${maxStale} puan**.

## Pilot öncesi kalan açıklar

1. **Gerçek öğrenci verisi yok.** Sentetik simülasyon karar güvenliğini gösterebilir; pedagojik etkiyi kanıtlayamaz.
2. **Confounded sonuçlar var.** Persona fazı değiştiğinde müdahalenin etkisini tek başına ayırmak mümkün değil; bu doğru biçimde geri test puanına zorla yazılmıyor.
3. **Bazı müdahalelerde 30 günlük takip henüz yetersiz.** Motor bunları başarısızlık saymıyor; yeni kanıt bekliyor.
4. **Gerçek pilotta telemetry şart.** Planlanan/güncel soru sayısı, completion, doğru/yanlış, açık yanlış, mode history ve intervention history birlikte tutulmalı.
5. **İlk pilotta otomatik agresif optimizasyon yapılmamalı.** 7 günlük tek sonuçla yöntem değiştirme engeli korunmalı; 14/30 günlük doğrulama birikmeden öğrenme politikası sertleşmemeli.

## Sonraki kalite kapısı

Sentetik kalite kapısı geçildikten sonraki doğru aşama, küçük kontrollü gerçek kullanıcı pilotudur. Pilot değerlendirmesinde en az şu metrikler izlenmelidir:

- Gün 0 / 7 / 14 / 30 performans değişimi
- completion ve hedef hacim gerçekleşmesi
- açık yanlış kapanma süresi
- repair çıkış süresi
- progress sonrası performans/retention korunması
- sustainable sonrası completion toparlanması
- mode transition / bounce
- intervention helpful / neutral / harmful / insufficient / confounded dağılımı

---

Bu rapor `npm run quality:report` ile yeniden üretilebilir.
`;

fs.writeFileSync(outUrl,report);
console.log('route-engine-quality-report: wrote reports/route-engine-quality-report.md');
console.log(JSON.stringify({personas:lfResults.length,avgStability:avg(lfResults,r=>r.day60.stabilityScore),bounces:totalBounces,harmfulEvents:totalHarmful,harmfulHorizons:totalHarmfulHorizons,strong:strongCount,watch:watchCount,blockers:blockerCount}));
if(blockerCount>0)process.exitCode=1;
