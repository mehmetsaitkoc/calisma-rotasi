(function(root){
'use strict';

const CONTRACT_VERSION=1;
const BACKUP_SCHEMA='calisma-rotasi-backup';
const BACKUP_VERSION=2;
const WORKSPACE_SCHEMA_VERSION=3;

const FEATURE_FLAGS=Object.freeze({
  core_route:{free:true,plus:true},
  mini_exams:{free:true,plus:true},
  exam_wrong_repair:{free:true,plus:true},
  mistake_notebook:{free:true,plus:true},
  basic_analysis:{free:true,plus:true},
  backup_export:{free:true,plus:true},
  monthly_report:{free:false,plus:true},
  long_term_trends:{free:false,plus:true},
  advanced_teacher_insights:{free:false,plus:true}
});
function featureEnabled(tier,key){
  const rule=FEATURE_FLAGS[key];
  if(!rule)return false;
  return !!rule[tier==='plus'?'plus':'free'];
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
  FEATURE_FLAGS,
  featureEnabled,
  MODE_COPY,
  SOURCE_REASON,
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
