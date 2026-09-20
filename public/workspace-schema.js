(function(root){
'use strict';

const VERSION=3;
const SYNC_VERSION=1;
const EXAMS=Object.freeze(['kpss','yks']);

function assertExam(exam){
  if(!EXAMS.includes(exam))throw new Error('Geçersiz workspace sınav kimliği.');
  return exam;
}
function fallbackId(exam){
  const rand=Math.random().toString(36).slice(2,12);
  return 'ws-'+exam+'-'+Date.now().toString(36)+'-'+rand;
}
function workspaceId(exam){
  assertExam(exam);
  try{
    if(root.crypto&&typeof root.crypto.randomUUID==='function')return 'ws-'+exam+'-'+root.crypto.randomUUID();
  }catch{}
  return fallbackId(exam);
}
function cleanSync(raw,exam){
  assertExam(exam);
  const s=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const id=typeof s.workspaceId==='string'&&new RegExp('^ws-'+exam+'-[a-zA-Z0-9-]{8,}$').test(s.workspaceId)?s.workspaceId:workspaceId(exam);
  const revision=Number.isInteger(s.revision)&&s.revision>=0?s.revision:0;
  const updatedAt=Number.isFinite(s.updatedAt)&&s.updatedAt>=0?Math.floor(s.updatedAt):0;
  return {version:SYNC_VERSION,workspaceId:id,revision,updatedAt};
}
function create(exam){
  assertExam(exam);
  return {
    schemaVersion:VERSION,
    exam,
    sync:cleanSync(null,exam),
    configured:false,
    settings:{
      name:'',
      track:exam==='yks'?'say':'lisans',
      dailyMinutes:90,
      days:[1,2,3,4,5,6],
      priorities:[],
      target:'',
      targetDate:''
    },
    profile:{
      version:4,
      completed:false,
      summaryConfirmed:false,
      currentNet:null,
      targetNet:0,
      currentStageNet:null,
      targetStageNet:0,
      targetScore:0,
      targetRank:0,
      studyHabit:'',
      subjectLevels:{},
      updated:0
    },
    topicState:{},
    customTopics:[],
    plan:[],
    logs:[],
    exams:[],
    assessments:[],
    mistakes:[],
    route:{
      version:2,
      lastRun:'',
      lastAutoDate:'',
      lastReason:'',
      lastChanged:0,
      decisions:[],
      interventions:[],
      modeHistory:[],
      pilot:{
        version:1,
        enabled:false,
        participantId:'',
        startDate:'',
        startedAt:0,
        completedAt:0,
        snapshots:[]
      }
    },
    taskEvents:[]
  };
}
function assertIdentity(raw,exam){
  assertExam(exam);
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Yedekte sınav alanı eksik.');
  if(raw.schemaVersion!==undefined&&(!Number.isInteger(raw.schemaVersion)||raw.schemaVersion<1||raw.schemaVersion>VERSION)){
    throw new Error('Yedekte desteklenmeyen workspace şeması.');
  }
  if(raw.exam!==undefined&&raw.exam!==exam)throw new Error('Yedekte workspace sınav kimliği geçersiz.');
  if(raw.sync!==undefined){
    if(!raw.sync||typeof raw.sync!=='object'||Array.isArray(raw.sync))throw new Error('Yedekte workspace senkron meta bilgisi geçersiz.');
    if(raw.sync.workspaceId!==undefined&&!(typeof raw.sync.workspaceId==='string'&&new RegExp('^ws-'+exam+'-[a-zA-Z0-9-]{8,}$').test(raw.sync.workspaceId)))throw new Error('Yedekte workspace kimliği geçersiz.');
    if(raw.sync.revision!==undefined&&(!Number.isInteger(raw.sync.revision)||raw.sync.revision<0))throw new Error('Yedekte workspace revision geçersiz.');
    if(raw.sync.updatedAt!==undefined&&(!Number.isFinite(raw.sync.updatedAt)||raw.sync.updatedAt<0))throw new Error('Yedekte workspace güncelleme zamanı geçersiz.');
  }
  return true;
}
function migrateIdentity(workspace,exam){
  assertExam(exam);
  workspace.schemaVersion=VERSION;
  workspace.exam=exam;
  workspace.sync=cleanSync(workspace.sync,exam);
  return workspace;
}
function adoptSyncMeta(workspace,raw,exam){
  assertExam(exam);
  workspace.schemaVersion=VERSION;
  workspace.exam=exam;
  workspace.sync=cleanSync(raw?.sync,exam);
  return workspace;
}
function touch(workspace,at=Date.now()){
  const exam=assertExam(workspace?.exam);
  workspace.sync=cleanSync(workspace.sync,exam);
  workspace.sync.revision=Math.min(Number.MAX_SAFE_INTEGER,workspace.sync.revision+1);
  workspace.sync.updatedAt=Number.isFinite(at)&&at>=0?Math.floor(at):Date.now();
  return workspace.sync;
}
function syncMeta(workspace){
  const exam=assertExam(workspace?.exam);
  return {...cleanSync(workspace.sync,exam)};
}

root.RotaWorkspaceSchema={VERSION,SYNC_VERSION,EXAMS,create,assertIdentity,migrateIdentity,adoptSyncMeta,touch,syncMeta};
if(typeof module==='object')module.exports=root.RotaWorkspaceSchema;
})(typeof window!=='undefined'?window:globalThis);
