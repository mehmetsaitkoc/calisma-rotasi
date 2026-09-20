(function(root){
'use strict';

const VERSION=2;
const EXAMS=Object.freeze(['kpss','yks']);

function assertExam(exam){
  if(!EXAMS.includes(exam))throw new Error('Geçersiz workspace sınav kimliği.');
  return exam;
}
function create(exam){
  assertExam(exam);
  return {
    schemaVersion:VERSION,
    exam,
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
  return true;
}
function migrateIdentity(workspace,exam){
  assertExam(exam);
  workspace.schemaVersion=VERSION;
  workspace.exam=exam;
  return workspace;
}

root.RotaWorkspaceSchema={VERSION,EXAMS,create,assertIdentity,migrateIdentity};
if(typeof module==='object')module.exports=root.RotaWorkspaceSchema;
})(typeof window!=='undefined'?window:globalThis);
