import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const premium=fs.readFileSync(new URL('../public/app-premium-next.js',import.meta.url),'utf8');
const segment=(start,end)=>{const at=html.indexOf(start);assert.ok(at>=0,start);const until=html.indexOf(end,at+start.length);assert.ok(until>at,end);return html.slice(at,until);};
assert.ok(!html.includes('teacher:teacherPage'),'Public Web Beta must not route to the retired teacher page');
assert.ok(html.includes("if(ui.view==='teacher')ui.view='today'"),'Persisted/direct teacher view must be redirected to Today');
assert.ok(premium.includes("document.querySelectorAll('[data-view=\"teacher\"]')"),'Presentation layer must remove retired teacher navigation');
assert.ok(!html.includes('name="apiKey"'),'Student flow must not expose API-key setup');
assert.ok(!html.includes("fetch('/api/teacher'"));assert.ok(!html.includes("fetch('/api/tts'"));
assert.ok(html.includes('data-account-action="login"'));
assert.ok(html.includes('bu hizmet sesi ağ üzerinden işleyebilir'));
assert.ok(!html.includes('TEACHER_KNOWLEDGE'),'Missing answers must not be fabricated from a keyword cache');

let resolveRequest,requests=0,writes=0,plays=0,renders=0;
const handlers=new Map(),ui={teacherPhotoData:'',teacherPhotoThumb:'',teacherPhotoName:'',teacherPhotoMeta:null,teacherDraft:''};
const context={console,Promise,Date,JSON,Uint8Array,atob,Blob,File,setTimeout:()=>0,clearTimeout,ui,
 state:{activeExam:'kpss'},sampleSaved:false,accountApplying:false,TEACHER_KEY:'test',TEACHER_VOICE_KEY:'voice',
 teacherStore:{kpss:[],yks:[]},teacherTransient:null,teacherVoice:{autoRead:false,gender:'male'},teacherBackend:{tts:true},
 teacherSpeech:{},localStorage:{setItem(){writes++;}},toast(){},render(){renders++;},icon(){return '';},
 R:{uid:()=>String(Date.now()),topic:()=>null},today:()=> '2026-09-24',ensureSubject:x=>x,inferTeacherTopic:()=>'',
 teacherSetBusy(){},teacherMapDetectedSubject:()=>'',teacherMapDetectedTopic:()=>'',teacherRemoteText:()=>'',
 FormData:class{get(name){return {subjectId:'k-ta',topicId:'',question:'Test soru'}[name]||'';}},
 teacherCheckBackend:async()=>({ai:true,tts:true}),teacherStudentContext:()=>({contextVersion:3}),
 w:()=>({}),subject:()=>({}),subName:()=> 'Tarih',examLabel:()=> 'KPSS',trackLabel:()=> 'Lisans',
 featureEnabled:()=>true,openUpgrade(){},loadEntitlement(){},teacherProviderSource:()=>({url:'blob:fixture'}),
 teacherPlayProviderAudio:async()=>{plays++;},$:()=>null,
 RotaAccount:{user:{id:'student-a'},request:async()=>{requests++;return new Promise(resolve=>{resolveRequest=resolve;});},changed(){writes++;}},
 addEventListener(name,fn){handlers.set(name,fn);}
};context.window=context;vm.createContext(context);
vm.runInContext(segment('function teacherIdentity(){','function teacherStatusText'),context);
// Replace only media machinery with a fixture; request and identity guards are the real code.
context.teacherStopSpeaking=()=>vm.runInContext('teacherAudioGeneration++',context);
vm.runInContext(segment("async function teacherSolveRemote(record,mode='base'",'function teacherSetBusy'),context);
vm.runInContext(segment('async function teacherSubmitAsync(form){','function teacherSetStatus'),context);
vm.runInContext(segment('async function teacherRequestSpeech(text,id){','function teacherAnswerCard'),context);
vm.runInContext(segment('let teacherPhotoGeneration=0;','function teacherAction'),context);
const response=()=>({ok:true,json:async()=>({answer:{kind:'fact',direct_answer:'Doğrulanmış yanıt',confidence:1,steps:[]}}),blob:async()=>new Blob(['audio'])});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const setAccount=id=>{context.RotaAccount.user=id?{id}:null;handlers.get('rota:account')();};

setAccount(null);await assert.rejects(context.teacherSolveRemote({question:'Test'}),/giriş yap/);assert.equal(requests,0);
setAccount('student-a');let pending=context.teacherSubmitAsync({querySelector:()=>null});await tick();assert.equal(requests,1);
setAccount('student-b');resolveRequest(response());await pending;assert.equal(context.teacherStore.kpss.length,0,'A result cannot enter B history');assert.equal(writes,0);
setAccount('student-a');pending=context.teacherSubmitAsync({querySelector:()=>null});await tick();context.state.activeExam='yks';resolveRequest(response());await pending;assert.equal(context.teacherStore.kpss.length,0);assert.equal(context.teacherStore.yks.length,0,'An exam switch must also drop a pending result');
context.state.activeExam='kpss';pending=context.teacherSubmitAsync({querySelector:()=>null});await tick();resolveRequest(response());await pending;assert.equal(context.teacherStore.kpss.length,1,'Same-account successful answer is saved');assert.ok(writes>=2,'Teacher persistence must notify the account queue');
context.teacherStore.kpss[0].id='followup-id';pending=context.teacherFollowupAsync('followup-id','simple');await tick();setAccount('student-b');resolveRequest(response());await pending;assert.equal(context.teacherStore.kpss[0].followups.length,0,'A follow-up cannot mutate an old-account object after switching');
setAccount('student-a');pending=context.teacherRequestSpeech('text','voice');await tick();setAccount('student-b');resolveRequest(response());await assert.rejects(pending,/Hesap veya sınav/);assert.equal(plays,0,'A speech response cannot play under B');
setAccount('student-a');pending=context.teacherRequestSpeech('text','voice');await tick();context.teacherStopSpeaking();resolveRequest(response());await pending;assert.equal(plays,0,'Stop cancels pending audio, not only currently playing audio');

let resolveDictation;context.RotaNative={isNative:true,dictate:()=>new Promise(resolve=>{resolveDictation=resolve;})};
pending=context.teacherMic();await tick();setAccount('student-b');resolveDictation({text:'A private spoken question'});await pending;assert.equal(ui.teacherDraft,'','Native dictation must remain bound to its original account');
let resolvePhoto;context.compressTeacherPhoto=()=>new Promise(resolve=>{resolvePhoto=resolve;});setAccount('student-a');pending=context.teacherAttachPhoto({name:'A.jpg'});await tick();setAccount('student-b');resolvePhoto({full:'A-full',thumb:'A-thumb'});await pending;assert.equal(ui.teacherPhotoData,'','Compressed photos must not attach after account switch');
assert.equal(context.teacherSafePhoto('data:image/png;base64,x" onerror="x'),'', 'Stored photo attributes cannot inject HTML');
assert.equal(context.teacherCleanHistory([{id:'x" onclick="x',subjectId:'k-ta',question:'x'}]).length,0);
console.log('Dormant teacher isolation passed: public route retired while legacy authenticated request state remains account-isolated and cannot leak stale answer/audio/photo/dictation state');
