const CHECKPOINTS=[0,7,14,30];
const THRESHOLDS=Object.freeze({
  noDataDays:3,
  dropoutDays:7,
  longRepairDays:14,
  riskRisePoints:8,
  performanceDropPoints:10,
  masteryDropPoints:8,
  transitionSpike:3,
  skipRate:.5
});

function isDate(v){return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(new Date(v+'T12:00:00').getTime());}
function dayAdd(date,days){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+days);return d.toISOString().slice(0,10);}
function daysBetween(a,b){if(!isDate(a)||!isDate(b))return null;return Math.floor((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/86400000);}
function finite(v){return Number.isFinite(v)?Number(v):null;}
function latestSnapshot(payload){
  return [...(payload.snapshots||[])].sort((a,b)=>(a.checkpoint??-1)-(b.checkpoint??-1)).at(-1)||null;
}
function priorSnapshot(payload,snapshot){
  if(!snapshot)return null;
  return [...(payload.snapshots||[])].filter(x=>x.checkpoint<snapshot.checkpoint).sort((a,b)=>a.checkpoint-b.checkpoint).at(-1)||null;
}
function snapshotAt(payload,checkpoint){return (payload.snapshots||[]).find(x=>x.checkpoint===checkpoint)||null;}

function milestoneStatus(payload,checkpoint,asOfDate=payload.generatedDate){
  const targetDate=dayAdd(payload.startDate,checkpoint),snapshot=snapshotAt(payload,checkpoint);
  if(snapshot)return {checkpoint,targetDate,status:'done',late:(snapshot.delayDays||0)>0,capturedDate:snapshot.capturedDate,actualDay:snapshot.actualDay??checkpoint+(snapshot.delayDays||0)};
  const lateBy=daysBetween(targetDate,asOfDate);
  return {checkpoint,targetDate,status:Number.isFinite(lateBy)&&lateBy>0?'overdue':'waiting',late:false,capturedDate:'',actualDay:null,lateByDays:Number.isFinite(lateBy)&&lateBy>0?lateBy:0};
}

function interventionStatus(snapshot){
  const latest=snapshot?.interventions?.latest;
  if(latest&&latest.status)return latest;
  const x=snapshot?.interventions||{};
  if((x.harmful||0)>0)return {date:'',mode:'',status:'harmful'};
  if((x.confounded||0)>0)return {date:'',mode:'',status:'confounded'};
  if((x.helpful||0)>0)return {date:'',mode:'',status:'helpful'};
  if((x.neutral||0)>0)return {date:'',mode:'',status:'neutral'};
  if((x.insufficient||0)>0)return {date:'',mode:'',status:'insufficient'};
  if((x.pending||0)>0)return {date:'',mode:'',status:'pending'};
  return null;
}

function addAlarm(out,code,severity,category,message,meta={}){
  out.push({code,severity,category,message,...meta});
}
function currentRepairSpan(payload,latest){
  if(!latest||latest.modes?.current!=='repair')return 0;
  const rows=[...(payload.snapshots||[])].filter(x=>x.checkpoint<=latest.checkpoint).sort((a,b)=>b.checkpoint-a.checkpoint);
  let earliest=latest;
  for(const row of rows){if(row.modes?.current!=='repair')break;earliest=row;}
  return Math.max(0,(latest.actualDay??latest.checkpoint)-(earliest.actualDay??earliest.checkpoint));
}

function pilotAlarms(payload,asOfDate=payload.generatedDate){
  const out=[],latest=latestSnapshot(payload),previous=priorSnapshot(payload,latest),lastActive=payload.lastActiveDate;
  const idleDays=isDate(lastActive)?Math.max(0,daysBetween(lastActive,asOfDate)):null;
  if(Number.isFinite(idleDays)&&idleDays>=THRESHOLDS.noDataDays)addAlarm(out,'no-data-3d',idleDays>=THRESHOLDS.dropoutDays?'critical':'attention','data',idleDays+' gündür yeni çalışma verisi yok.',{idleDays});
  if(Number.isFinite(idleDays)&&idleDays>=THRESHOLDS.dropoutDays)addAlarm(out,'possible-dropout','critical','pilot','Öğrenci pilotu bırakmış olabilir.',{idleDays});
  for(const cp of CHECKPOINTS){
    const m=milestoneStatus(payload,cp,asOfDate);
    if(m.status==='overdue')addAlarm(out,'milestone-overdue-'+cp,cp>=14?'attention':'waiting','data','Gün '+cp+' snapshot gecikti.',{checkpoint:cp,lateByDays:m.lateByDays});
  }
  if(!latest){
    addAlarm(out,'insufficient-pilot-data','waiting','pilot','Pilot verisi henüz öğrenci özeti üretmeye yetmiyor.');
    return out;
  }
  const actual=latest.actual||{},planned=latest.planned||{};
  if((actual.questions||0)>0&&(!Number.isFinite(actual.accuracy)||(actual.correct||0)+(actual.wrong||0)===0))addAlarm(out,'missing-answer-outcomes','attention','data','Soru sayısı var ancak doğru/yanlış verisi ölçülemiyor.');
  if((planned.tasks||0)>0&&!Number.isFinite(actual.completion))addAlarm(out,'missing-completion','attention','data','Plan var ancak completion ölçülemiyor.');
  if((planned.tasks||0)>0&&((actual.skippedTasks||0)/(planned.tasks||1))>=THRESHOLDS.skipRate)addAlarm(out,'high-skip-rate','attention','pilot','Görevlerin en az yarısı skip ediliyor.',{skipRate:(actual.skippedTasks||0)/(planned.tasks||1)});
  const repairSpan=currentRepairSpan(payload,latest);
  if(repairSpan>=THRESHOLDS.longRepairDays)addAlarm(out,'repair-too-long','attention','motor','ONARIM modu '+repairSpan+' gündür kapanmamış görünüyor.',{repairSpan});
  if(previous){
    const riskA=finite(previous.student?.risk),riskB=finite(latest.student?.risk);
    if(Number.isFinite(riskA)&&Number.isFinite(riskB)&&riskB-riskA>=THRESHOLDS.riskRisePoints)addAlarm(out,'risk-rising','attention','motor','Risk son checkpointte belirgin yükseldi.',{delta:riskB-riskA});
    const perfA=finite(previous.student?.performance),perfB=finite(latest.student?.performance);
    if(previous.modes?.current==='progress'&&Number.isFinite(perfA)&&Number.isFinite(perfB)&&perfA-perfB>=THRESHOLDS.performanceDropPoints)addAlarm(out,'progress-performance-drop','critical','motor','GELİŞİM sonrası performans belirgin düştü.',{delta:perfB-perfA});
    const compA=finite(previous.actual?.completion),compB=finite(latest.actual?.completion);
    if(previous.modes?.current==='ease'&&Number.isFinite(compA)&&Number.isFinite(compB)&&(latest.checkpoint-previous.checkpoint)>=7&&compB<=compA)addAlarm(out,'ease-no-completion-recovery','attention','motor','SÜRDÜRÜLEBİLİR doz sonrası completion toparlanmadı.',{delta:compB-compA});
    const transitionDelta=(latest.modes?.transitions||0)-(previous.modes?.transitions||0);
    if(transitionDelta>=THRESHOLDS.transitionSpike)addAlarm(out,'mode-transition-spike','attention','motor','Checkpointler arasında sık mod geçişi oluştu.',{transitionDelta});
    const masteryA=finite(previous.mastery?.mastery),masteryB=finite(latest.mastery?.mastery);
    if(Number.isFinite(masteryA)&&Number.isFinite(masteryB)&&masteryA-masteryB>=THRESHOLDS.masteryDropPoints)addAlarm(out,'mastery-regression','critical','motor','Mastery belirgin geriledi.',{delta:masteryB-masteryA});
  }
  if((latest.interventions?.harmful||0)>0)addAlarm(out,'harmful-intervention','critical','motor','En az bir harmful intervention sonucu var.',{count:latest.interventions.harmful});
  if(!Number.isFinite(latest.student?.performance)&&!Number.isFinite(actual.completion))addAlarm(out,'insufficient-pilot-data','waiting','pilot','Pilot verisi rapor üretmeye yetmiyor.');
  return out;
}

function healthStatus(alarms){
  if(alarms.some(a=>a.severity==='critical'))return 'critical';
  if(alarms.some(a=>a.severity==='attention'))return 'attention';
  if(alarms.some(a=>a.severity==='waiting'))return 'waiting';
  return 'normal';
}

function studentOverview(payload,asOfDate=payload.generatedDate){
  const latest=latestSnapshot(payload),alarms=pilotAlarms(payload,asOfDate),milestones=CHECKPOINTS.map(cp=>milestoneStatus(payload,cp,asOfDate));
  return {
    participantId:payload.participantId,
    exam:payload.exam,
    track:payload.track||'',
    startDate:payload.startDate,
    pilotDay:Math.max(0,daysBetween(payload.startDate,asOfDate)??0),
    lastActiveDate:payload.lastActiveDate||'',
    status:healthStatus(alarms),
    milestones,
    state:latest?.student?.state||'unknown',
    mode:latest?.modes?.current||'',
    confidence:finite(latest?.student?.confidence),
    risk:finite(latest?.student?.risk),
    learningNeed:finite(latest?.student?.learningNeed),
    completion:finite(latest?.actual?.completion),
    performance:finite(latest?.student?.performance),
    execution:finite(latest?.student?.execution),
    retention:finite(latest?.student?.retention),
    openMistakes:finite(latest?.mistakes?.openAtCapture),
    mastery:finite(latest?.mastery?.mastery),
    intervention:interventionStatus(latest),
    alarms
  };
}

function changeFromDay0(payload,key){
  const a=snapshotAt(payload,0),b=latestSnapshot(payload);if(!a||!b||b.checkpoint===0)return null;
  const av=key(a),bv=key(b);return Number.isFinite(av)&&Number.isFinite(bv)?bv-av:null;
}
function avg(values){const xs=values.filter(Number.isFinite);return xs.length?Math.round(xs.reduce((n,x)=>n+x,0)/xs.length*10)/10:null;}

function cohortSummary(payloads,asOfDate){
  const rows=payloads.map(p=>studentOverview(p,asOfDate||p.generatedDate)),counts={normal:0,waiting:0,attention:0,critical:0};
  for(const row of rows)counts[row.status]=(counts[row.status]||0)+1;
  const latest=payloads.map(latestSnapshot).filter(Boolean);
  return {
    students:rows.length,
    counts,
    milestones:Object.fromEntries(CHECKPOINTS.map(cp=>['day'+cp,payloads.filter(p=>!!snapshotAt(p,cp)).length])),
    helpfulInterventions:latest.reduce((n,s)=>n+(s.interventions?.helpful||0),0),
    harmfulInterventions:latest.reduce((n,s)=>n+(s.interventions?.harmful||0),0),
    averageCompletionChange:avg(payloads.map(p=>changeFromDay0(p,s=>finite(s.actual?.completion)))),
    averagePerformanceChange:avg(payloads.map(p=>changeFromDay0(p,s=>finite(s.student?.performance)))),
    modeTransitions:latest.reduce((n,s)=>n+(s.modes?.transitions||0),0),
    rows
  };
}

export {CHECKPOINTS,THRESHOLDS,milestoneStatus,pilotAlarms,studentOverview,cohortSummary};
