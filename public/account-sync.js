(function(root){
'use strict';
const absent=Symbol('absent');
const copy=value=>value===absent?absent:JSON.parse(JSON.stringify(value));
const equal=(a,b)=>a===absent||b===absent?a===b:JSON.stringify(a)===JSON.stringify(b);
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const safeKey=key=>!['__proto__','prototype','constructor'].includes(key);
const identifiable=value=>Array.isArray(value)&&value.every(x=>object(x)&&typeof x.id==='string'&&x.id)&&new Set(value.map(x=>x.id)).size===value.length;

// Reconcile independent edits against their common acknowledged revision. Conflicts
// are never silently published; the caller must let the student resolve them.
function merge(base,local,remote){
 const conflicts=[];
 function visit(b,l,r,path){
  if(equal(l,r))return copy(l);
  if(equal(l,b))return copy(r);
  if(equal(r,b))return copy(l);
  if([b,l,r].every(v=>v===absent||object(v))&&l!==absent&&r!==absent){
   const result={};
   for(const key of new Set([...Object.keys(b===absent?{}:b),...Object.keys(l),...Object.keys(r)])){
    if(!safeKey(key))throw Error('Geçersiz kayıt alanı.');
    const at=(v)=>v!==absent&&Object.hasOwn(v,key)?v[key]:absent;
    const value=visit(at(b),at(l),at(r),path.concat(key));
    if(value!==absent)result[key]=value;
   }
   return result;
  }
  if(identifiable(l)&&identifiable(r)&&(b===absent||identifiable(b))){
   const index=items=>new Map(items.map(item=>[item.id,item]));
   const bi=index(b===absent?[]:b),li=index(l),ri=index(r),result=[];
   for(const id of new Set([...ri.keys(),...li.keys(),...bi.keys()])){
    const value=visit(bi.has(id)?bi.get(id):absent,li.has(id)?li.get(id):absent,ri.has(id)?ri.get(id):absent,path.concat(id));
    if(value!==absent)result.push(value);
   }
   return result;
  }
  conflicts.push({path:path.join('.'),base:b===absent?null:copy(b),local:l===absent?null:copy(l),remote:r===absent?null:copy(r),localDeleted:l===absent,remoteDeleted:r===absent});
  return copy(l);
 }
 return {data:visit(base??absent,local??absent,remote??absent,[]),conflicts};
}

function hasStudyData(data){
 const w=data?.workspace;
 return !!(w&&(w.configured||w.profile?.completed||['logs','exams','assessments','mistakes','plan'].some(key=>w[key]?.length)||Object.keys(w.topicState||{}).length)||data?.teacherHistory?.length);
}
function accountKey(userId){
 if(typeof userId!=='string'||!/^[A-Za-z0-9_-]{1,120}$/.test(userId))throw Error('Geçersiz hesap kimliği.');
 return 'calisma-rotasi:account:v1:'+userId;
}
root.RotaAccountSync=Object.freeze({merge,hasStudyData,accountKey});
if(typeof module==='object')module.exports=root.RotaAccountSync;
})(typeof window!=='undefined'?window:globalThis);
