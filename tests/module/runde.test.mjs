// Modul runde ohne Browser (Peter 03.11.): keine Aufgabe doppelt in einer Runde; Ersatz auf derselben Stufe,
// Laenge und Reihenfolge bleiben, markierte Aufgaben (z. B. Wiederholungen) bleiben stehen.
//   node --test tests/module/runde.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ohneDoppelte } from '../../src/module/runde.mjs';

const q = (t, level = 2, extra = {}) => ({ t, level, ...extra });
const how = { id: (x) => x.t, level: (x) => x.level };
const ids = (r) => r.map((x) => x.t);
/** a supply that hands out the given tasks, one list per call */
const vorrat = (...listen) => { let n = 0; const f = () => (listen[n++] || []).map((x) => ({ ...x })); f.calls = () => n; return f; };

test('ohne Doppelte: unveraendert, kein Nachschub geholt, neues Array', () => {
  const r = [q('a'), q('b'), q('c')], more = vorrat([q('x')]);
  const out = ohneDoppelte(r, more, how);
  assert.deepEqual(ids(out), ['a', 'b', 'c']); assert.equal(more.calls(), 0); assert.notEqual(out, r);
});

test('doppelte Aufgabe wird ersetzt, an derselben Stelle, auf derselben Stufe', () => {
  const r = [q('a', 1), q('b'), q('a', 1), q('c', 3)];
  const out = ohneDoppelte(r, vorrat([q('y', 2), q('a', 1), q('z', 1)]), how);
  assert.deepEqual(ids(out), ['a', 'b', 'z', 'c']);
  assert.deepEqual(out.map((x) => x.level), [1, 2, 1, 3], 'levels unchanged');
  assert.deepEqual(ids(r), ['a', 'b', 'a', 'c'], 'input not changed');
});

test('dreimal dieselbe Aufgabe: zwei Ersatzaufgaben, untereinander verschieden', () => {
  const out = ohneDoppelte([q('a'), q('a'), q('a')], vorrat([q('b'), q('b')], [q('c')]), how);
  assert.deepEqual(ids(out), ['a', 'b', 'c']);
});

test('markierte Aufgabe bleibt stehen, die andere wird ersetzt', () => {
  const r = [q('a'), q('b'), q('a', 2, { due: true })];
  const out = ohneDoppelte(r, vorrat([q('x')]), { ...how, keep: (x) => !!x.due });
  assert.deepEqual(ids(out), ['x', 'b', 'a']); assert.ok(out[2].due);
});

test('kein passender Ersatz: Runde bleibt gleich lang, hoechstens `tries` Nachschub', () => {
  const more = vorrat([q('b', 3)], [q('a')], [q('b')]);
  const out = ohneDoppelte([q('a'), q('b'), q('a')], more, { ...how, tries: 2 });
  assert.deepEqual(ids(out), ['a', 'b', 'a'], 'stays when nothing fits'); assert.equal(more.calls(), 2);
});

test('Ersatz nie eine Aufgabe, die schon in der Runde steht', () => {
  const out = ohneDoppelte([q('a'), q('b'), q('a')], vorrat([q('a'), q('b'), q('c')]), how);
  assert.deepEqual(ids(out), ['a', 'b', 'c']);
});

test('nur uebergebener Nachschub, kein Zufall im Modul', async () => {
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('../../src/module/runde.mjs', import.meta.url), 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const w of ['Math.random', 'localStorage', 'document', 'fetch', 'Date']) assert.ok(!src.includes(w), w);
});
