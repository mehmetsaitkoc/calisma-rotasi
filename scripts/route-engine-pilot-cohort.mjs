import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const CHECKPOINTS=[0,7,14,30];
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
    if(typeof s.targetDate!=='string'||typeof s.capturedDate!=='string')throw Error(source+': snapshot tarihleri eksik');
    for(const [obj,name] of [[s.planned,'planned'],[s.actual,'actual'],[s.modes,'modes'],[s.interventions,'interventions'],[s.student,'student']])if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error(source+': '+name+' eksik');
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
    minutes:avg(rows,x=>finite(x.s.actual.minutes)),
    questions:avg(rows,x=>finite(x.s.actual.questions)),
    performance:avg(rows,x=>finite(x.s.student.performance)),
    learningNeed:avg(rows,x=>finite(x.s.student.learningNeed)),
    risk:avg(rows,x=>finite(x.s.student.risk)),
    confidence:avg(rows,x=>finite(x.s.student.confidence)),
    modeTransitions:avg(rows,x=>finite(x.s.modes.transitions)),
    harmful:rows.reduce((n,x)=>n+(x.s.interventions.harmful||0),0),
    helpful:rows.reduce((n,x)=>n+(x.s.interventions.helpful||0),0),
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
function summarizeCohort(raw){
  const payloads=raw.map((x,i)=>validatePayload(x,'pilot '+(i+1))),ids=new Set();
  for(const p of payloads){if(ids.has(p.participantId))throw Error('Aynı participantId birden fazla dosyada var: '+p.participantId);ids.add(p.participantId);}
  const checkpoints=CHECKPOINTS.map(cp=>checkpointSummary(payloads,cp)),paired30={
    completion:pairedDelta(payloads,0,30,s=>finite(s.actual.completion)),
    accuracy:pairedDelta(payloads,0,30,s=>finite(s.actual.accuracy)),
    performance:pairedDelta(payloads,0,30,s=>finite(s.student.performance)),
    learningNeed:pairedDelta(payloads,0,30,s=>finite(s.student.learningNeed)),
    risk:pairedDelta(payloads,0,30,s=>finite(s.student.risk))
  };
  return {participants:payloads.length,examCounts:{kpss:payloads.filter(p=>p.exam==='kpss').length,yks:payloads.filter(p=>p.exam==='yks').length},checkpoints,paired30,harmfulTotal:checkpoints.reduce((n,x)=>n+x.harmful,0),helpfulTotal:checkpoints.reduce((n,x)=>n+x.helpful,0)};
}
function fmt(v,suffix=''){return Number.isFinite(v)?v+suffix:'—';}
function markdown(summary){
  const rows=summary.checkpoints.map(x=>`| Gün ${x.checkpoint} | ${x.captured}/${summary.participants} | ${fmt(x.coverage,'%')} | ${fmt(x.completion,'%')} | ${fmt(x.accuracy,'%')} | ${fmt(x.questions)} | ${fmt(x.performance)} | ${fmt(x.learningNeed)} | ${fmt(x.risk)} | ${x.helpful} / ${x.harmful} / ${x.pending} |`).join('\n');
  const d=summary.paired30;
  return `# Çalışma Rotası — Pilot Cohort Report

**Katılımcı:** ${summary.participants} · **KPSS:** ${summary.examCounts.kpss} · **YKS:** ${summary.examCounts.yks}

## Checkpoint coverage ve ortalamalar

| Checkpoint | Coverage | % | Completion | Accuracy | Soru | Performance | LearningNeed | Risk | Müdahale + / − / pending |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows}

## Gün 0 → Gün 30 eşleşmiş değişim

- Completion: **${fmt(d.completion.avg,' puan')}** (n=${d.completion.n})
- Accuracy: **${fmt(d.accuracy.avg,' puan')}** (n=${d.accuracy.n})
- Performance: **${fmt(d.performance.avg,' puan')}** (n=${d.performance.n})
- LearningNeed: **${fmt(d.learningNeed.avg,' puan')}** (n=${d.learningNeed.n})
- Risk: **${fmt(d.risk.avg,' puan')}** (n=${d.risk.n})

## Müdahale güvenlik özeti

- Helpful checkpoint sonuçları: **${summary.helpfulTotal}**
- Harmful checkpoint sonuçları: **${summary.harmfulTotal}**

Bu rapor gözlemsel pilot telemetrisidir; nedensel etki kanıtı değildir. Katılımcı bazında eksik checkpointler coverage sütununda görünür.
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
