(function(root){
'use strict';

const CONTRACT_VERSION=1;
const BACKUP_SCHEMA='calisma-rotasi-backup';
const BACKUP_VERSION=2;
const WORKSPACE_SCHEMA_VERSION=3;
const ENTITLEMENT_SCHEMA='calisma-rotasi-entitlement-v1';
const ENTITLEMENT_VERSION=1;

const FEATURE_FLAGS=Object.freeze({
  core_route:Object.freeze({free:true,plus:true}),
  mini_exams:Object.freeze({free:true,plus:true}),
  exam_wrong_repair:Object.freeze({free:true,plus:true}),
  mistake_notebook:Object.freeze({free:true,plus:true}),
  basic_analysis:Object.freeze({free:true,plus:true}),
  backup_export:Object.freeze({free:true,plus:true}),
  teacher_basic:Object.freeze({free:true,plus:true}),
  monthly_report:Object.freeze({free:false,plus:true}),
  long_term_trends:Object.freeze({free:false,plus:true}),
  advanced_teacher_insights:Object.freeze({free:false,plus:true})
});
function normalizeTier(tier){return tier==='plus'?'plus':'free';}
function featureEnabled(tier,key){
  const rule=FEATURE_FLAGS[key];
  if(!rule)return false;
  return !!rule[normalizeTier(tier)];
}
function featureSet(tier){
  const normalized=normalizeTier(tier),out={};
  for(const key of Object.keys(FEATURE_FLAGS))out[key]=!!FEATURE_FLAGS[key][normalized];
  return Object.freeze(out);
}
function entitlementForTier(tier,meta={}){
  const normalized=normalizeTier(tier);
  return Object.freeze({
    schema:ENTITLEMENT_SCHEMA,
    version:ENTITLEMENT_VERSION,
    tier:normalized,
    source:collapse(meta.source||'public_beta',80),
    status:collapse(meta.status||(normalized==='plus'?'active':'free'),40),
    purchaseEnabled:meta.purchaseEnabled===true,
    accountRequired:meta.accountRequired!==false,
    features:featureSet(normalized)
  });
}
function validateEntitlement(value){
  if(!value||value.schema!==ENTITLEMENT_SCHEMA||Number(value.version)!==ENTITLEMENT_VERSION)throw new Error('Üyelik yetkisi doğrulanamadı.');
  if(!['free','plus'].includes(value.tier))throw new Error('Üyelik seviyesi geçersiz.');
  return entitlementForTier(value.tier,{
    source:value.source,
    status:value.status,
    purchaseEnabled:value.purchaseEnabled===true,
    accountRequired:value.accountRequired!==false
  });
}

const MODE_COPY=Object.freeze({
  repair:{label:'ONARIM',short:'Önce açığı kapat, sonra yeni yük ekle.',action:'Yanlış veya eksik kanıtı düzelt.'},
  steady:{label:'DENGELİ',short:'Mevcut tempoyu koru ve yeni kanıt toplamaya devam et.',action:'Planlanan dozu sürdür.'},
  progress:{label:'GELİŞİM',short:'Son veriler güçlü; kontrollü biçimde zorlaş.',action:'Dozu küçük adımlarla artır.'},
  ease:{label:'SÜRDÜRÜLEBİLİR',short:'Yükü küçült, istikrarı koru.',action:'Tamamlanabilir doza dön.'},
  collect:{label:'VERİ TOPLUYOR',short:'Keskin karar için henüz yeterli gerçek veri yok.',action:'Yeni gerçek çalışma verisi topla.'},
  retention:{label:'KALICILIK',short:'Konu biliniyor; şimdi hatırlamayı sağlamlaştır.',action:'Kısa geri çağırma ve doğrulama yap.'}
});

const SOURCE_REASON=Object.freeze({
  mistake:'Yanlış defterindeki açığı kapatmak için bugün tekrar ediyorsun.',
  mini_repair:'Mini denemede görülen konu veya alt-konu açığını kapatmak için eklendi.',
  ai_teacher:'Rota Hoca’da zorlandığın noktayı kısa bir tekrar ile pekiştirmek için eklendi.',
  exam:'Son deneme verin bu dersin bugün daha fazla dikkat istemesine işaret ediyor.',
  profile:'Başlangıç seviyen ve hedefin bu dersi öne çıkarıyor.',
  priority:'Bu dersi öncelikli seçtiğin için planda daha görünür tutuluyor.',
  curriculum:'Konu sırandaki bir sonraki uygun adım olduğu için bugün planlandı.',
  backlog:'Daha önce tamamlanmayan görev, günlük kapasiteni aşmadan yeniden yerleştirildi.',
  spaced_review:'Önceki çalışmayı unutmadan hatırlamayı güçlendirmek için kısa tekrar zamanı geldi.',
  retention_refresh:'Daha önce tamamladığın konunun kalıcılığını yeniden doğrulamak için eklendi.',
  checkpoint:'Haftalık ilerlemeyi kontrol etmek için kısa bir doğrulama görevi.'
});

const TRACE_REASON_COPY=Object.freeze({
  ASSESSMENT_RISK:'Son ölçümlerde bu konuda risk görünüyor.',
  OPEN_MISTAKE:'Bu konuda kapanmamış bir yanlışın var.',
  REPEATED_MISTAKE:'Aynı konu veya hata tipi tekrar ediyor.',
  REVIEW_DUE_3:'3 günlük tekrar zamanı geldi.',
  REVIEW_DUE_7:'7 günlük tekrar zamanı geldi.',
  RETENTION_STALE:'Bu konudaki güvenilir kanıtın eskidi; kısa bir hatırlama kontrolü yararlı.',
  BELOW_PERSONAL_NORM:'Son performansın kendi yakın dönem normalinin altında.',
  NEGATIVE_TREND:'Son güvenilir veriler düşüş eğilimi gösteriyor.',
  POSITIVE_TREND:'Son güvenilir veriler istikrarlı gelişim gösteriyor.',
  TARGET_URGENCY:'Sınava kalan süre bu konunun önceliğini artırıyor.',
  PROFILE_PRIORITY:'Bu dersi öncelikli seçtiğin için planda öne çıktı.',
  LOW_COMPLIANCE:'Son görevlerde tamamlama oranı düşük; yük uygulanabilir tutuluyor.',
  RECOVERY_ACTIVE:'Toparlanma döneminde olduğun için yük kontrollü tutuluyor.',
  CAPACITY_CONSTRAINED:'Günlük kapasiteni aşmamak için çalışma süresi sınırlandı.',
  MASTERY_EVIDENCE:'Birden fazla güvenilir kanıt bu konuda ilerlemeyi destekliyor.',
  LOW_EVIDENCE:'Keskin karar için henüz yeterli gerçek veri yok.'
});
function normalizeReasonCodes(codes){
  const seen=new Set(),out=[];
  for(const raw of Array.isArray(codes)?codes:[]){
    const code=collapse(raw,60).toUpperCase();
    if(!TRACE_REASON_COPY[code]||seen.has(code))continue;
    seen.add(code);out.push(code);
  }
  return out;
}
function decisionTrace(raw={}){
  const reasonCodes=normalizeReasonCodes(raw.reasonCodes);
  const confidence=Math.max(0,Math.min(100,Number(raw.confidence)||0));
  const evidence=Array.isArray(raw.evidence)?raw.evidence.slice(0,8).map(x=>studentText(x,180)).filter(Boolean):[];
  const cap=raw.capacity&&typeof raw.capacity==='object'?raw.capacity:{};
  const requestedMinutes=Math.max(0,Number(cap.requestedMinutes)||0),assignedMinutes=Math.max(0,Number(cap.assignedMinutes)||0),dailyLimit=Math.max(0,Number(cap.dailyLimit)||0);
  return Object.freeze({version:1,mode:normalizeMode(raw.mode),confidence,score:Number(raw.score)||0,reasonCodes,evidence,capacity:Object.freeze({requestedMinutes,assignedMinutes,dailyLimit,constrained:cap.constrained===true||requestedMinutes>assignedMinutes&&requestedMinutes>0})});
}
function traceExplanation(raw,fallback=''){
  const trace=decisionTrace(raw),parts=trace.reasonCodes.slice(0,3).map(code=>TRACE_REASON_COPY[code]).filter(Boolean);
  if(parts.length)return studentText(parts.join(' '),500);
  return studentText(fallback,500);
}

function collapse(value,max=700){
  return String(value??'').replace(/\s+/g,' ').trim().slice(0,max);
}
function studentText(value,max=700){
  let text=collapse(value,max);
  if(!text)return '';
  const replacements=[
    [/confounded/gi,'başka etkenlerle karışmış'],
    [/evidence factor/gi,'kanıt ağırlığı'],
    [/stale evidence/gi,'eski veri'],
    [/hysteresis/gi,'karar istikrarı'],
    [/calibrated confidence/gi,'dengelenmiş güven'],
    [/calibre güven/gi,'dengelenmiş güven'],
    [/counterfactual/gi,'karşılaştırma'],
    [/matched[- ]control/gi,'benzer dönem karşılaştırması']
  ];
  for(const [pattern,replacement] of replacements)text=text.replace(pattern,replacement);
  return collapse(text,max);
}
function normalizeMode(mode){
  if(mode==='sustainable')return 'ease';
  if(['repair','steady','progress','ease','collect','retention'].includes(mode))return mode;
  return 'steady';
}
function modeCopy(mode){
  return MODE_COPY[normalizeMode(mode)]||MODE_COPY.steady;
}
function taskReason(task){
  const traced=traceExplanation(task?.decisionTrace||task?.trace||{},'');
  if(traced)return traced;
  const direct=studentText(task?.reason||'',500);
  if(direct)return direct;
  return SOURCE_REASON[task?.source]||'Bu görev, mevcut seviyen, hedefin ve son çalışma verilerin birlikte değerlendirilerek bugün planlandı.';
}
function safeNumber(v){
  return Number.isFinite(v)?v:null;
}
function teacherContextEnvelope(raw){
  raw=raw&&typeof raw==='object'?raw:{};
  const decision=raw.routeDecision&&typeof raw.routeDecision==='object'?raw.routeDecision:{};
  const copy=modeCopy(decision.mode);
  const todayPlan=Array.isArray(raw.todayPlan)?raw.todayPlan.slice(0,8).map(item=>({
    subject:collapse(item?.subject,120),
    topic:collapse(item?.topic,180),
    title:collapse(item?.title,180),
    minutes:safeNumber(item?.minutes),
    targetQuestions:Number.isInteger(item?.targetQuestions)?item.targetQuestions:null,
    reason:studentText(item?.reason,500),
    mode:normalizeMode(item?.mode),
    modeLabel:collapse(item?.modeLabel,80)
  })):[];
  return {
    ...raw,
    contextVersion:CONTRACT_VERSION,
    routeMode:{
      mode:normalizeMode(decision.mode),
      label:copy.label,
      explanation:copy.short,
      action:copy.action,
      confidence:safeNumber(decision.confidence),
      note:studentText(decision.note,500)
    },
    todaySummary:{
      openTasks:todayPlan.length,
      totalMinutes:todayPlan.reduce((n,item)=>n+(Number(item.minutes)||0),0),
      firstReason:todayPlan[0]?.reason||'',
      firstTask:todayPlan[0]?.title||''
    },
    todayPlan,
    routeDecision:{
      ...decision,
      mode:normalizeMode(decision.mode),
      label:collapse(decision.label||copy.label,80),
      note:studentText(decision.note,500),
      evidence:Array.isArray(decision.evidence)?decision.evidence.slice(0,6).map(x=>studentText(x,180)).filter(Boolean):[]
    }
  };
}
function stable(value){
  if(Array.isArray(value))return value.map(stable);
  if(value&&typeof value==='object'){
    const out={};
    for(const key of Object.keys(value).sort())out[key]=stable(value[key]);
    return out;
  }
  return value;
}
function stableStringify(value){
  return JSON.stringify(stable(value));
}
function fnv1a32(text){
  let h=0x811c9dc5;
  for(let i=0;i<text.length;i++){
    h^=text.charCodeAt(i);
    h=Math.imul(h,0x01000193)>>>0;
  }
  return h.toString(16).padStart(8,'0');
}
function makeBackupEnvelope(state,meta={}){
  const snapshot=JSON.parse(JSON.stringify(state));
  const checksum=fnv1a32(stableStringify(snapshot));
  return {
    schema:BACKUP_SCHEMA,
    version:BACKUP_VERSION,
    workspaceSchemaVersion:WORKSPACE_SCHEMA_VERSION,
    exportedAt:new Date().toISOString(),
    appVersion:collapse(meta.appVersion||'4.1',40),
    state:snapshot,
    integrity:{algorithm:'fnv1a32',checksum}
  };
}
function unwrapBackup(input){
  if(input&&input.schema===BACKUP_SCHEMA){
    if(input.version!==BACKUP_VERSION)throw new Error('Bu yedek sürümü desteklenmiyor.');
    if(!input.state||typeof input.state!=='object')throw new Error('Yedek içinde uygulama durumu eksik.');
    const expected=collapse(input.integrity?.checksum||'',32);
    const actual=fnv1a32(stableStringify(input.state));
    if(!expected||expected!==actual)throw new Error('Yedek bütünlük kontrolü başarısız. Dosya eksik veya değiştirilmiş olabilir.');
    return {state:input.state,migratedFrom:'v2-envelope',workspaceSchemaVersion:input.workspaceSchemaVersion||1};
  }
  if(input&&input.version===1&&input.workspaces){
    return {state:input,migratedFrom:'legacy-v1',workspaceSchemaVersion:1};
  }
  throw new Error('Bu dosya desteklenen Çalışma Rotası yedeği değil.');
}

root.RotaContracts={
  CONTRACT_VERSION,
  BACKUP_SCHEMA,
  BACKUP_VERSION,
  WORKSPACE_SCHEMA_VERSION,
  ENTITLEMENT_SCHEMA,
  ENTITLEMENT_VERSION,
  FEATURE_FLAGS,
  normalizeTier,
  featureEnabled,
  featureSet,
  entitlementForTier,
  validateEntitlement,
  MODE_COPY,
  SOURCE_REASON,
  TRACE_REASON_COPY,
  normalizeReasonCodes,
  decisionTrace,
  traceExplanation,
  studentText,
  modeCopy,
  taskReason,
  teacherContextEnvelope,
  stableStringify,
  fnv1a32,
  makeBackupEnvelope,
  unwrapBackup
};
if(typeof module==='object')module.exports=root.RotaContracts;
})(typeof window!=='undefined'?window:globalThis);
