import assert from 'node:assert/strict';
import { mock } from 'node:test';

// The existing suite deliberately models 2026-09-24. Its real Wrong Lab writer
// calls Date.now(), while snapshots reject evidence dated after that fixture day.
// Use the same clock for both, instead of weakening the future-evidence guard or
// changing the production engine. Only Date is mocked; real timers keep working.
const now = new Date('2026-09-24T12:00:00.000Z');
mock.timers.enable({ apis: ['Date'], now });
try {
  assert.equal(new Date().toISOString(), '2026-09-24T12:00:00.000Z');
  assert.equal(Date.now(), now.getTime());
  assert.equal(new Date('2026-09-25').toISOString().slice(0, 10), '2026-09-25');
  await import('./student-recovery.test.mjs');
} finally {
  mock.timers.reset();
}
