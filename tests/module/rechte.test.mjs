// Modul rechte ohne Browser: Konten v2 und wer welches Kind sieht (K1, K10; Rechtematrix Stufe 1).
// Die Bedienwege bleiben im Browser (tests/stufe1-p4.test.mjs).
//   node --test tests/module/rechte.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normAccounts, isGrantActive, activeGrantFor, expireGrants, isParentOf, visibleKids } from '../../src/module/rechte.mjs';

// two families with the same names (like the test personas of stage 2), a teacher, an admin, a test child
const RAW = {
  version: 2,
  users: [
    { id: 'p_k1', user: 'kathie', kind: 'child' }, { id: 'p_k2', user: 'kathie2', kind: 'child' }, { id: 'p_s1', user: 'tom', kind: 'child' },
    { id: 'p_e1', user: 'peter', kind: 'adult' }, { id: 'p_e2', user: 'anna', kind: 'adult' }, { id: 'p_e3', user: 'peter2', kind: 'adult' },
    { id: 'p_l1', user: 'frau', kind: 'adult', teacher: true }, { id: 'p_a1', user: 'admin', kind: 'adult', admin: true },
    { id: 'p_t1', user: 'test', kind: 'child', test: true },
  ],
  guardians: [{ adult: 'p_e1', child: 'p_k1' }, { adult: 'p_e2', child: 'p_k1' }, { adult: 'p_e1', child: 'p_s1' }, { adult: 'p_e3', child: 'p_k2' }, { adult: 'p_l1', child: 'p_k2' }],
};
const K = normAccounts(RAW);
const U = Object.fromEntries(K.users.map((u) => [u.user, u]));
const HEUTE = '2026-11-02';
const g = (grantee, from, until, extra = {}) => ({ id: 'g_' + grantee + from, grantee, from, until, scope: ['progress'], ...extra });

test('normAccounts: Rollen und Kinder aus den Kennungen; Lehrkraft und Admin sind keine Eltern (B3)', () => {
  assert.equal(U.kathie.role, 'student'); assert.equal(U.frau.role, 'teacher'); assert.equal(U.admin.role, 'parent'); assert.equal(U.admin.admin, true);
  assert.deepEqual(U.peter.kinder, ['kathie', 'tom']); assert.deepEqual(U.anna.kinder, ['kathie']); assert.deepEqual(U.peter2.kinder, ['kathie2']);
  assert.deepEqual(U.frau.kinder, [], 'a guardian entry for a teacher is ignored');
  assert.deepEqual(U.admin.kinder, []);
  assert.equal(normAccounts({ users: [] }).users.length, 0, 'v1 stays as it is');
  assert.equal(normAccounts(null), null);
});

test('Freigabe aktiv: erster und letzter Tag zaehlen, beendet nie', () => {
  assert.equal(isGrantActive(g('x', '2026-11-02', '2026-11-02'), HEUTE), true);
  assert.equal(isGrantActive(g('x', '2026-11-03', '2026-11-10'), HEUTE), false);
  assert.equal(isGrantActive(g('x', '2026-10-01', '2026-11-01'), HEUTE), false);
  assert.equal(isGrantActive(g('x', '2026-11-01', '2026-11-30', { revokedAt: '2026-11-01T10:00:00Z' }), HEUTE), false);
});

test('activeGrantFor: nur die eigene, nur aktive', () => {
  const gs = [g('p_a1', '2026-10-01', '2026-10-20'), g('p_l1', '2026-11-01', '2026-11-14'), g('p_a1', '2026-11-01', '2026-11-05', { revokedAt: 'x' })];
  assert.equal(activeGrantFor(gs, 'p_l1', HEUTE).grantee, 'p_l1');
  assert.equal(activeGrantFor(gs, 'p_a1', HEUTE), null);
  assert.equal(activeGrantFor(undefined, 'p_a1', HEUTE), null);
});

test('expireGrants: abgelaufene genau einmal, beendete nie', () => {
  const gs = [g('p_l1', '2026-10-01', '2026-11-01'), g('p_a1', '2026-10-01', '2026-10-02', { revokedAt: 'x' }), g('p_a1', '2026-11-01', '2026-11-30')];
  assert.deepEqual(expireGrants(gs, HEUTE).map((x) => x.grantee), ['p_l1']);
  assert.deepEqual(expireGrants(gs, HEUTE), [], 'second time: nothing new');
  assert.equal(gs[0].expiredLogged, true);
});

test('Rechtematrix: wer sieht welches Kind (Eltern eigene, Namensgleiche nicht, Lehrkraft/Admin nur mit Freigabe, Testkind nur Admin)', () => {
  const freigaben = { kathie: [g('p_l1', '2026-11-01', '2026-11-14')], kathie2: [], tom: [], test: [] };
  const sieht = (wer) => visibleKids(K.users, U[wer], { admin: !!U[wer].admin, grantFor: (kid) => activeGrantFor(freigaben[kid.user], U[wer].id, HEUTE) }).map((u) => u.user).sort();
  assert.deepEqual(sieht('peter'), ['kathie', 'tom']);
  assert.deepEqual(sieht('anna'), ['kathie']);
  assert.deepEqual(sieht('peter2'), ['kathie2'], 'same-name family sees only its own child');
  assert.deepEqual(sieht('frau'), ['kathie'], 'teacher: only with a grant, the guardian entry does not count');
  assert.deepEqual(sieht('admin'), ['test'], 'admin: test child only, no real child without a grant');
  freigaben.kathie2.push(g('p_a1', '2026-11-01', '2026-11-03'));
  assert.deepEqual(sieht('admin'), ['kathie2', 'test']);
  assert.deepEqual(visibleKids(K.users, null), [], 'nobody logged in');
});

test('isParentOf: nur Elternrolle mit Zuordnung', () => {
  assert.equal(isParentOf(U.peter, U.kathie), true);
  assert.equal(isParentOf(U.peter2, U.kathie), false);
  assert.equal(isParentOf(U.frau, U.kathie2), false);
  assert.equal(isParentOf(null, U.kathie), false);
  assert.equal(isParentOf({ role: 'teacher', kinder: ['kathie'] }, U.kathie), false, 'second safeguard: a teacher never counts as parent, even with a child list');
});
