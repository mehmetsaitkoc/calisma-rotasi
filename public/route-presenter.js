(function(root){
'use strict';

const VERSION=1;
const CONTRACTS=root.RotaContracts||(typeof require==='function'?require('./route-contracts.js'):null);
const FALLBACK_REASONS=Object.freeze({
  mistake:'Yanlış defterindeki açığı kapatmak için bugün tekrar ediyorsun.',
  mini_repair:'Mini denemede görülen açığı kapatmak için bugün kısa bir onarım yapıyorsun.',
  ai_teacher:'Önceki çalışmanda zorlandığın noktayı pekiştirmek için bugün tekrar ediyorsun.',
  exam:'Son deneme verin bu dersi bugün biraz daha öne çıkarıyor.',
  profile:'Başlangıç seviyen ve hedefin bu görevi bugün öne çıkarıyor.',
  priority:'Bu dersi öncelikli seçtiğin için bugün rotanda yer aldı.',
  curriculum:'Konu sırandaki bir sonraki uygun adım olduğu için bugün planlandı.',
  backlog:'Daha önce tamamlanmayan görev, bugünkü kapasiteni aşmadan yeniden yerleştirildi.',
  spaced_review:'Önceki çalışmayı unutmadan hatırlamayı güçlendirmek için tekrar zamanı geldi.',
  retention_refresh:'Kalıcılığı yeniden doğrulamak için bugün kısa bir tekrar yapıyorsun.',
  checkpoint:'Haftalık ilerlemeyi doğrulamak için bugün kısa bir kontrol görevi var.'
});
function clean(value,max=600){
  const text=CONTRACTS?.studentText?CONTRACTS.studentText(value,max):String(value??'').replace(/\s+/g,' ').trim().slice(0,max);
  return text.replace(/\b(confounded|evidence factor|stale evidence|hysteresis|counterfactual)\b/gi,'veri sinyali').trim();
}
function taskReason(task){
  const source=String(task?.source||'');
  const direct=CONTRACTS?.taskReason?CONTRACTS.taskReason(task):clean(task?.reason||'',500);
  const reason=clean(direct||FALLBACK_REASONS[source]||'Mevcut seviyen, hedefin ve son çalışma verilerin birlikte değerlendirilerek bugün planlandı.',500);
  return reason || 'Bugünkü rotanda bu göreve sıra geldi.';
}
function modeCopy(decision){
  const copy=CONTRACTS?.modeCopy?.(decision?.mode);
  if(copy)return {label:clean(copy.label,80),short:clean(copy.short,240),action:clean(copy.action,240)};
  return {label:'DENGELİ',short:'Mevcut tempoyu koru ve yeni çalışma verileriyle ilerle.',action:'Planlanan dozu sürdür.'};
}
function taskPresentation(task,decision){
  const mode=modeCopy(decision||{});
  return {
    version:VERSION,
    reason:taskReason(task),
    modeLabel:mode.label,
    modeExplanation:mode.short,
    modeAction:mode.action
  };
}

root.RotaPresenter={VERSION,FALLBACK_REASONS,taskReason,modeCopy,taskPresentation};
if(typeof module==='object')module.exports=root.RotaPresenter;
})(typeof window!=='undefined'?window:globalThis);
