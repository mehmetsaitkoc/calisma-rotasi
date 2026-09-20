import assert from 'node:assert/strict';

delete globalThis.RotaWorkspaceSchema;
await import('../public/workspace-schema.js');

const W=globalThis.RotaWorkspaceSchema;
assert.ok(W,'RotaWorkspaceSchema must be exported');
assert.equal(W.VERSION,3);
assert.equal(W.SYNC_VERSION,1);
assert.deepEqual([...W.EXAMS],['kpss','yks']);

const kpss=W.create('kpss');
const yks=W.create('yks');
assert.equal(kpss.schemaVersion,3);
assert.equal(kpss.exam,'kpss');
assert.equal(kpss.settings.track,'lisans');
assert.equal(yks.schemaVersion,3);
assert.equal(yks.exam,'yks');
assert.equal(yks.settings.track,'say');
assert.notEqual(kpss.plan,yks.plan,'Each workspace must own independent collections');
assert.notEqual(kpss.route,yks.route,'Each workspace must own independent route state');
assert.match(kpss.sync.workspaceId,/^ws-kpss-[A-Za-z0-9-]{8,}$/);
assert.match(yks.sync.workspaceId,/^ws-yks-[A-Za-z0-9-]{8,}$/);
assert.equal(kpss.sync.revision,0);
assert.equal(kpss.sync.updatedAt,0);
assert.notEqual(kpss.sync.workspaceId,yks.sync.workspaceId,'Each workspace needs a stable independent sync identity');

assert.equal(W.assertIdentity({settings:{}},'kpss'),true,'Legacy workspace without identity must remain migratable');
assert.equal(W.assertIdentity({schemaVersion:2,exam:'kpss',settings:{}},'kpss'),true,'v2 workspace must remain migratable');
assert.equal(W.assertIdentity({schemaVersion:3,exam:'kpss',sync:{workspaceId:'ws-kpss-12345678',revision:2,updatedAt:10},settings:{}},'kpss'),true);
assert.throws(()=>W.assertIdentity({schemaVersion:4,exam:'kpss',settings:{}},'kpss'),/desteklenmeyen workspace şeması/i);
assert.throws(()=>W.assertIdentity({schemaVersion:3,exam:'yks',settings:{}},'kpss'),/workspace sınav kimliği/i);
assert.throws(()=>W.assertIdentity({schemaVersion:3,exam:'kpss',sync:{workspaceId:'ws-yks-12345678'}},'kpss'),/workspace kimliği/i);
assert.throws(()=>W.create('other'),/Geçersiz workspace sınav kimliği/i);

const legacy={configured:true};
assert.equal(W.migrateIdentity(legacy,'kpss'),legacy);
assert.equal(legacy.schemaVersion,3);
assert.equal(legacy.exam,'kpss');
assert.match(legacy.sync.workspaceId,/^ws-kpss-/);

const imported=W.create('kpss');
const importedId='ws-kpss-imported123';
W.adoptSyncMeta(imported,{sync:{workspaceId:importedId,revision:7,updatedAt:1234}},'kpss');
assert.equal(imported.sync.workspaceId,importedId,'Import must preserve a valid workspace identity');
assert.equal(imported.sync.revision,7);
assert.equal(imported.sync.updatedAt,1234);

const priorRevision=imported.sync.revision;
W.touch(imported,2000);
assert.equal(imported.sync.revision,priorRevision+1,'Local mutation must advance workspace revision');
assert.equal(imported.sync.updatedAt,2000);
assert.deepEqual(W.syncMeta(imported),imported.sync);

console.log('Workspace schema passed: v3 identity + revision + legacy migration + sync-ready metadata');
