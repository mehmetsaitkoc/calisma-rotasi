import assert from 'node:assert/strict';

delete globalThis.RotaWorkspaceSchema;
await import('../public/workspace-schema.js');

const W=globalThis.RotaWorkspaceSchema;
assert.ok(W,'RotaWorkspaceSchema must be exported');
assert.equal(W.VERSION,2);
assert.deepEqual([...W.EXAMS],['kpss','yks']);

const kpss=W.create('kpss');
const yks=W.create('yks');
assert.equal(kpss.schemaVersion,2);
assert.equal(kpss.exam,'kpss');
assert.equal(kpss.settings.track,'lisans');
assert.equal(yks.schemaVersion,2);
assert.equal(yks.exam,'yks');
assert.equal(yks.settings.track,'say');
assert.notEqual(kpss.plan,yks.plan,'Each workspace must own independent collections');
assert.notEqual(kpss.route,yks.route,'Each workspace must own independent route state');

assert.equal(W.assertIdentity({settings:{}},'kpss'),true,'Legacy workspace without identity must remain migratable');
assert.equal(W.assertIdentity({schemaVersion:2,exam:'kpss',settings:{}},'kpss'),true);
assert.throws(()=>W.assertIdentity({schemaVersion:3,exam:'kpss',settings:{}},'kpss'),/desteklenmeyen workspace şeması/i);
assert.throws(()=>W.assertIdentity({schemaVersion:2,exam:'yks',settings:{}},'kpss'),/workspace sınav kimliği/i);
assert.throws(()=>W.create('other'),/Geçersiz workspace sınav kimliği/i);

const legacy={configured:true};
assert.equal(W.migrateIdentity(legacy,'kpss'),legacy);
assert.equal(legacy.schemaVersion,2);
assert.equal(legacy.exam,'kpss');

console.log('Workspace schema passed: factory + identity + legacy migration boundary');
