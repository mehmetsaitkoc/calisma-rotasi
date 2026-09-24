import assert from 'node:assert/strict';
await import('../public/account-sync.js');
const {merge,hasStudyData,accountKey}=globalThis.RotaAccountSync;
const base={workspace:{logs:[{id:'a',correct:3,wrong:2}],settings:{name:'Ada',dailyMinutes:60},mistakes:[]},teacherHistory:[]};
const clone=x=>structuredClone(x);
{
 const local=clone(base),remote=clone(base);
 local.workspace.logs.push({id:'b',correct:4});remote.workspace.logs.push({id:'c',correct:5});
 remote.teacherHistory.push({id:'teacher-1',question:'Oranı nasıl kurarım?'});
 const result=merge(base,local,remote);
 assert.equal(result.conflicts.length,0);assert.deepEqual(new Set(result.data.workspace.logs.map(x=>x.id)),new Set(['a','b','c']));assert.equal(result.data.teacherHistory.length,1);
 assert.deepEqual(base,clone(base));assert.equal(local.teacherHistory.length,0);
}
{
 const local=clone(base),remote=clone(base);local.workspace.settings.name='Ece';remote.workspace.settings.dailyMinutes=90;
 const result=merge(base,local,remote);assert.equal(result.conflicts.length,0);assert.deepEqual(result.data.workspace.settings,{name:'Ece',dailyMinutes:90});
}
{
 const local=clone(base),remote=clone(base);local.workspace.logs[0].correct=4;remote.workspace.logs[0].correct=5;
 const result=merge(base,local,remote);assert.equal(result.conflicts.length,1);assert.equal(result.conflicts[0].path,'workspace.logs.a.correct');assert.equal(result.data.workspace.logs[0].correct,4);
}
{
 const local=clone(base),remote=clone(base);local.workspace.logs=[];
 assert.equal(merge(base,local,remote).data.workspace.logs.length,0);
 remote.workspace.logs[0].correct=5;
 const conflict=merge(base,local,remote);assert.equal(conflict.conflicts.length,1);assert.equal(conflict.conflicts[0].localDeleted,true);
}
{
 const local=clone(base),remote=clone(base);remote.workspace.logs=[];
 assert.equal(merge(base,local,remote).data.workspace.logs.length,0);
 local.workspace.logs[0].wrong=1;assert.equal(merge(base,local,remote).conflicts.length,1);
}
{
 const one={logs:[]},local={logs:[{id:'x',value:1}]},remote={logs:[{id:'x',value:1}]};
 assert.deepEqual(merge(one,local,remote),{data:local,conflicts:[]});
 assert.equal(merge(one,local,{logs:[{id:'x',value:2}]}).conflicts.length,1);
 assert.equal(merge({days:[1]},{days:[1,2]},{days:[1,3]}).conflicts.length,1);
}
assert.notEqual(accountKey('student-a'),accountKey('student-b'));
assert.throws(()=>accountKey('../other'));
assert.equal(hasStudyData({workspace:{logs:[],exams:[]}}),false);
assert.equal(hasStudyData({workspace:{assessments:[{id:'x'}]}}),true);
assert.equal(hasStudyData({teacherHistory:[{id:'x'}]}),true);
const poisoned=JSON.parse('{"__proto__":{"polluted":true}}');
assert.throws(()=>merge({},poisoned,{different:true}));assert.equal({}.polluted,undefined);
console.log('Account sync passed: independent devices, record edits/deletions, explicit conflicts, teacher history and account-scoped keys.');
