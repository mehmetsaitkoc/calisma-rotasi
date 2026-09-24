import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const copy=value=>structuredClone(value);
const identity={id:'fixture-account',email:'fixture@example.test',name:'Fixture',emailVerified:false};
const base={workspace:{logs:[{id:'base',title:'Acknowledged'}]},teacherHistory:[],preferences:{}};
const handlers=new Map(),storage=new Map(),errorElement={textContent:''},downloads=[],requests=[];
let applied=copy(base),failWrites=false;
const localStorage={getItem:key=>storage.get(key)??null,setItem(key,value){if(failWrites)throw Error('QuotaExceededError');storage.set(key,String(value));},removeItem:key=>storage.delete(key)};
const window={addEventListener(){},dispatchEvent(){}};
const document={addEventListener(type,handler){handlers.set(type,handler);},getElementById(){return errorElement;}};
const context=vm.createContext({window,document,localStorage,Headers,AbortSignal,crypto:webcrypto,CustomEvent:class{constructor(type,init){this.type=type;Object.assign(this,init);}},setTimeout(){return 1;},clearTimeout(){},FormData:class{constructor(form){this.values=form.values;}get(key){return this.values[key];}},fetch:async(url,options={})=>{requests.push(url);return new Response(JSON.stringify(url==='/api/workspace'?{revision:1,data:base,updatedAt:1}:{user:identity,csrfToken:'fixture-csrf'}),{status:200,headers:{'content-type':'application/json'}});}});
vm.runInContext(fs.readFileSync(new URL('../public/account-sync.js',import.meta.url),'utf8'),context);
vm.runInContext(fs.readFileSync(new URL('../public/account-client.js',import.meta.url),'utf8'),context);
window.RotaAccount.bind({emptyData:()=>copy(base),getData:()=>copy(applied),applyData:data=>{applied=copy(data);},switchAccount(){},restoreGuest(){},isSample:()=>false,modal(){},closeModal(){},toast(){},download:(name,text)=>downloads.push(JSON.parse(text))});
await window.RotaAccount.ready;
const accountKey=window.RotaAccountSync.accountKey(identity.id);
const newer=JSON.parse(storage.get(accountKey));newer.data.workspace.logs.push({id:'other-tab',title:'Other tab change'});storage.set(accountKey,JSON.stringify(newer));
applied.workspace.logs.push({id:'memory-only',title:'Unsaved local work'});
assert.throws(()=>window.RotaAccount.changed(),/başka sekmede/);assert.equal(window.RotaAccount.status,'storage-error');
const beforeRequests=requests.length,button={disabled:false},form={id:'account-form',dataset:{mode:'login'},values:{email:identity.email,password:'fixture-password'},querySelector:()=>button,reset(){}};
handlers.get('submit')({target:form,preventDefault(){},stopImmediatePropagation(){}});
for(let i=0;button.disabled&&i<100;i++)await new Promise(resolve=>setImmediate(resolve));
assert.equal(button.disabled,false);assert.ok(applied.workspace.logs.some(x=>x.id==='memory-only'),'Reauthentication must not replace unsaved memory with older disk content');
assert.equal(requests.length,beforeRequests,'Storage failure must block an account change before replacing the server session');
assert.match(errorElement.textContent,/yedek|kaydedil|saklan/i);
handlers.get('click')({target:{closest:()=>({disabled:false,dataset:{accountAction:'backup'}})},preventDefault(){}});
await new Promise(resolve=>setImmediate(resolve));
assert.ok(downloads.at(-1).data.workspace.logs.some(x=>x.id==='memory-only'));
assert.ok(JSON.parse(storage.get(accountKey)).data.workspace.logs.some(x=>x.id==='other-tab'),'Recovery cannot overwrite another tab’s saved work');
// A primary application storage failure can leave the adapter newer than the
// sync cache. A backup must include that current in-memory study state too.
applied.workspace.logs.push({id:'adapter-only',title:'Primary storage failed before sync hook'});
handlers.get('click')({target:{closest:()=>({disabled:false,dataset:{accountAction:'backup'}})},preventDefault(){}});await new Promise(resolve=>setImmediate(resolve));
assert.ok(downloads.at(-1).data.workspace.logs.some(x=>x.id==='adapter-only'),'The rescue download must capture the live adapter, not just the stale sync cache');
console.log('Account client state passed: storage-failure reauthentication guard, live-memory backup and preservation of another tab’s disk cache.');
