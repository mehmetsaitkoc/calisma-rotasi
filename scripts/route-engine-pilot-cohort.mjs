import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const CHECKPOINTS=[0,7,14,30];
const COMPARISONS=[[0,7],[0,14],[0,30],[7,14],[14,30]];
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');

function finite(v){return Number.isFinite(v)?Number(v):null;}
function avg(xs,key){
  const vals=xs.map(key).filter(Number.isFinite);
  return vals.length?Math.round(vals.reduce((n,x)=>n+x,0)/vals.length*10)/10:null;
}
function validatePayload(x,source='pilot'){
  if(!x||x.schema!=='calisma-rotasi-pilot-v1')throw Error(source+': geçersiz pilot schema');
  if(typeof x.participantId!=='string'||!/^[a-zA-Z0-9_-]{3,120}$/.test(x.participantId))throw Error(source+': participantId geçersiz');
  if(!['kpss','yks'].includes(x.exam))throw Error(source+': exam geçersiz');
  if(!Array.isArray(x.snapshots)||x.snapshots.length>8)throw Error(source+': snapshots geçersiz');
  const seen=new Set();
  for(const s of x.snapshots){
    if(!CHECKPOINTS.includes(s?.checkpoint))throw Error(source+': checkpoint geçersiz');
    if(seen.has(s.checkpoint))throw Error(source+': aynı checkpoint iki kez var');seen.add(s.checkpoint);
    if(s.milestoneDay!==undefined&&s.milestoneDay!==s.checkpoint)throw Error(source+': milestone/checkpoint uyuşmuyor');
    if(typeof s.targetDate!=='string'||typeof s.capturedDate!=='string')throw Error(source+': snapshot tarihleri eksik');
    if(s.windowEnd!==undefined&&s.windowEnd!==s.targetDate)throw Error(source+': snapshot windowEnd geçersiz');
    for(const [obj,name] of [[s.planned,'planned'],[s.actual,'actual'],[s.modes,'modes'],[s.interventions,'interventions'],[s.student,'student']])if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error(source+': '+name+' eksik');
    if(s.mastery!==undefined&&(!s.mastery||typeof s.mastery!=='object'||Array.isArray(s.mastery)))throw Error(source+': mastery geçersiz');
  }
  return x;
}
function checkpointSummary(payloads,checkpoint){
  const rows=payloads.map(p=>({p,s:p.snapshots.find(x=>x.checkpoint===checkpoint)})).filter(x=>x.s);
  return {
    checkpoint,
    captured:rows.length,
    coverage:payloads.length?Math.round(rows.length/payloads.length*1000)/10:0,
    completion:avg(rows,x=>finite(x.s.actual.completion)),
    accuracy:avg(rows,x=>finite(x.s.actual.accuracy)),
    questionAttainment:avg(rows,x=>finite(x.s.actual.questionAttainmentRatio)),
    minutes:avg(rows,x=>finite(x.s.actual.minutes)),
    questions:avg(rows,x=>finite(x.s.actual.questions)),
    performance:avg(rows,x=>finite(x.s.student.performance)),
    learningNeed:avg(rows,x=>finite(x.s.student.learningNeed)),
    risk:avg(rows,x=>finite(x.s.student.risk)),
    confidence:avg(rows,x=>finite(x.s.student.confidence)),
    execution:avg(rows,x=>finite(x.s.student.execution)),
    retention:avg(rows,x=>finite(x.s.student.retention)),
    openMistakes:avg(rows,x=>finite(x.s.mistakes?.openAtCapture)),
    mastery:avg(rows,x=>finite(x.s.mastery?.mastery)),
    modeTransitions:avg(rows,x=>finite(x.s.modes.transitions)),
    harmful:rows.reduce((n,x)=>n+(x.s.interventions.harmful||0),0),
    helpful:rows.reduce((n,x)=>n+(x.s.interventions.helpful||0),0),
    insufficient:rows.reduce((n,x)=>n+(x.s.interventions.insufficient||0),0),
    confounded:rows.reduce((n,x)=>n+(x.s.interventions.confounded||0),0),
    pending:rows.reduce((n,x)=>n+(x.s.interventions.pending||0),0)
  };
}
function pairedDelta(payloads,fromCp,toCp,key){
  const vals=[];
  for(const p of payloads){
    const a=p.snapshots.find(x=>x.checkpoint===fromCp),b=p.snapshots.find(x=>x.checkpoint===toCp);
    if(!a||!b)continue;const av=key(a),bv=key(b);if(Number.isFinite(av)&&Number.isFinite(bv))vals.push(bv-av);
  }
  return {n:vals.length,avg:vals.length?Math.round(vals.reduce((n,x)=>n+x,0)/vals.length*10)/10:null};
}
function deltaBundle(payloads,from,to){
  return {
    from,to,
    completion:pairedDelta(payloads,from,to,s=>finite(s.actual.completion)),
    accuracy:pairedDelta(payloads,from,to,s=>finite(s.actual.accuracy)),
    questionAttainment:pairedDelta(payloads,from,to,s=>finite(s.actual.questionAttainmentRatio)),
    performance:pairedDelta(payloads,from,to,s=>finite(s.student.performance)),
    learningNeed:pairedDelta(payloads,from,to,s=>finite(s.student.learningNeed)),
    risk:pairedDelta(payloads,from,to,s=>finite(s.student.risk)),
    execution:pairedDelta(payloads,from,to,s=>finite(s.student.execution)),
    openMistakes:pairedDelta(payloads,from,to,s=>finite(s.mistakes?.openAtCapture)),
    mastery:pairedDelta(payloads,from,to,s=>finite(s.mastery?.mastery))
  };
}
function summarizeCohort(raw){
  const payloads=raw.map((x,i)=>validatePayload(x,'pilot '+(i+1))),ids=new Set();
  for(const p of payloads){if(ids.has(p.participantId))throw Error('Aynı participantId birden fazla dosyada var: '+p.participantId);ids.add(p.participantId);}
  const checkpoints=CHECKPOINTS.map(cp=>checkpointSummary(payloads,cp)),comparisons=COMPARISONS.map(([from,to])=>deltaBundle(payloads,from,to)),paired30=comparisons.find(x=>x.from===0&&x.to===30);
  return {
    participants:payloads.length,
    examCounts:{kpss:payloads.filter(p=>p.exam==='kpss').length,yks:payloads.filter(p=>p.exam==='yks').length},
    checkpoints,comparisons,paired30,
    harmfulTotal:checkpoints.reduce((n,x)=>n+x.harmful,0),
    helpfulTotal:checkpoints.reduce((n,x)=>n+x.helpful,0),
    insufficientTotal:checkpoints.reduce((n,x)=>n+x.insufficient,0),
    confoundedTotal:checkpoints.reduce((n,x)=>n+x.confounded,0)
  };
}
function fmt(v,suffix=''){return Number.isFinite(v)?v+suffix:'—';}
function deltaFmt(x,suffix=''){return x&&Number.isFinite(x.avg)?fmt(x.avg,suffix)+' (n='+x.n+')':'—';}
function markdown(summary){
  const rows=summary.checkpoints.map(x=>`| Gün ${x.checkpoint} | ${x.captured}/${summary.participants} | ${fmt(x.coverage,'%')} | ${fmt(x.completion,'%')} | ${fmt(x.accuracy,'%')} | ${fmt(x.questionAttainment)} | ${fmt(x.performance)} | ${fmt(x.execution)} | ${fmt(x.learningNeed)} | ${fmt(x.risk)} | ${fmt(x.openMistakes)} | ${fmt(x.mastery)} | ${x.helpful} / ${x.harmful} / ${x.insufficient} / ${x.confounded} / ${x.pending} |`).join('\n');
  const deltas=summary.comparisons.map(d=>`| Gün ${d.from} → ${d.to} | ${deltaFmt(d.completion,' puan')} | ${deltaFmt(d.accuracy,' puan')} | ${deltaFmt(d.questionAttainment)} | ${deltaFmt(d.performance,' puan')} | ${deltaFmt(d.execution,' puan')} | ${deltaFmt(d.learningNeed,' puan')} | ${deltaFmt(d.risk,' puan')} | ${deltaFmt(d.openMistakes)} | ${deltaFmt(d.mastery,' puan')} |`).join('\n');
  return `# Çalışma Rotası — Pilot Cohort Report

**Katılımcı:** ${summary.participants} · **KPSS:** ${summary.examCounts.kpss} · **YKS:** ${summary.examCounts.yks}

## Checkpoint coverage ve ortalamalar

| Checkpoint | Coverage | % | Completion | Accuracy | Soru hedef oranı | Performance | Execution | LearningNeed | Risk | Açık yanlış | Mastery | Müdahale + / − / yetersiz / karışmış / pending |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}

## Eşleşmiş checkpoint değişimleri

| Aralık | Δ Completion | Δ Accuracy | Δ Soru hedef oranı | Δ Performance | Δ Execution | Δ LearningNeed | Δ Risk | Δ Açık yanlış | Δ Mastery |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${deltas}

## Müdahale güvenlik özeti

- Helpful checkpoint sonuçları: **${summary.helpfulTotal}**
- Harmful checkpoint sonuçları: **${summary.harmfulTotal}**
- Insufficient checkpoint sonuçları: **${summary.insufficientTotal}**
- Confounded checkpoint sonuçları: **${summary.confoundedTotal}**

Bu rapor gözlemsel pilot telemetrisidir; nedensel etki kanıtı değildir. Değişimler “motor kararı sonrası gözlenen değişim” olarak yorumlanmalıdır. Katılımcı bazında eksik checkpointler coverage ve eşleşmiş n değerlerinde görünür.
`;
}
function readInputs(args){
  let files=args.filter(Boolean);
  if(!files.length){const dir=path.join(root,'pilot-data');if(fs.existsSync(dir))files=fs.readdirSync(dir).filter(x=>x.endsWith('.json')).map(x=>path.join(dir,x));}
  return files;
}
function main(){
  const files=readInputs(process.argv.slice(2));
  if(!files.length){console.log('pilot-cohort: pilot-data/*.json bulunamadı. Tester exportlarını bu klasöre koy veya dosya yollarını argüman olarak ver.');return;}
  const payloads=files.map(file=>JSON.parse(fs.readFileSync(file,'utf8'))),summary=summarizeCohort(payloads),out=path.join(root,'reports','pilot-cohort-report.md');
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,markdown(summary));
  console.log('pilot-cohort: '+summary.participants+' participant; report -> reports/pilot-cohort-report.md');
  console.log(JSON.stringify(summary));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main();

export {validatePayload,summarizeCohort,markdown};
