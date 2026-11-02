// Modul speicher ohne Browser (S12 P3a, US8.1): Vertrag fuer die Simulation, dazu offline/online.
//   node --test tests/module/speicher.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { lokalerSpeicher, SPEICHER_FUNKTIONEN, SPEICHER_FEHLER } from '../../src/module/speicher.mjs';
import { speicherVertrag, fehlt } from './speicher-vertrag.mjs';

const B = 'kid:p_k1';

speicherVertrag('Simulation', (o) => lokalerSpeicher(o));

/* jede Funktion der Schnittstelle mit gueltigen Werten aufrufen */
const aufrufe = (g) => ({
  put: () => g.put(B, g.geraet, { nr: 1, inhalt: 'offline geschrieben' }),
  list: () => g.list(B),
  get: () => g.get(B, 'd_b1/1'),
  keys: () => g.keys(B),
  putKey: () => g.putKey(B, 'p_e1', { w: 'offline' }),
  directory: () => g.directory('h1'),
  putDirectory: () => g.putDirectory({ lookup: 'h2', kennung: 'p_e9' }),
  'invite.put': () => g.invite.put('i2', 'offline'),
  'invite.get': () => g.invite.get('i1'),
  'invite.delete': () => g.invite.delete('i1'),
  exportFile: () => g.exportFile(B),
  importFile: () => g.importFile(JSON.stringify({ format: 'bq-buendel-datei', v: 1, bereich: B, buendel: [{ geraet: 'd_x1', nr: 1, inhalt: 'offline' }] })),
});

test('offline: jeder Aufruf -> Fehler offline; nichts geschrieben, nichts verbraucht', async () => {
  const s = lokalerSpeicher();
  const a = s.geraet('d_a1'), b = s.geraet('d_b1');
  await b.put(B, 'd_b1', { nr: 1, inhalt: 'da' });
  await b.invite.put('i1', 'Einladung');
  a.offline();
  const f = aufrufe(a);
  assert.deepEqual(Object.keys(f), [...SPEICHER_FUNKTIONEN], 'alle Funktionen geprueft');
  for (const [name, aufruf] of Object.entries(f)) {
    const p = aufruf();
    assert.equal(typeof p.then, 'function', name);
    await fehlt(p, 'offline', name);
  }
  assert.ok(SPEICHER_FEHLER.includes('offline'));
  // das andere Geraet sieht nichts davon; die Einladung ist nicht verbraucht
  assert.deepEqual((await b.list(B)).kennungen, ['d_b1/1']);
  assert.deepEqual(await b.keys(B), {});
  assert.equal(await b.directory('h2'), null);
  await fehlt(b.invite.get('i2'), 'unbekannt');
  assert.equal(await b.get(B, 'd_b1/1'), 'da');
  a.online();
  assert.equal(await a.invite.get('i1'), 'Einladung', 'offline nicht verbraucht');
  assert.equal(await a.put(B, 'd_a1', { nr: 1, inhalt: 'jetzt' }), 'd_a1/1', 'dieselbe Nummer geht nach dem Wiederverbinden');
});

test('offline -> online: list liefert genau die zwischenzeitlich geschriebenen Buendel; andere Geraete arbeiten weiter', async () => {
  const s = lokalerSpeicher();
  const [a, b, c] = ['d_a1', 'd_b1', 'd_c1'].map((g) => s.geraet(g));
  await b.put(B, 'd_b1', { nr: 1, inhalt: 1 });
  let { merker } = await a.list(B);
  a.offline();
  await b.put(B, 'd_b1', { nr: 2, inhalt: 2 });
  await c.put(B, 'd_c1', { nr: 1, inhalt: 3 });
  await fehlt(a.list(B, merker), 'offline');
  await fehlt(a.put(B, 'd_a1', { nr: 1, inhalt: 'A' }), 'offline');
  await c.put(B, 'd_c1', { nr: 2, inhalt: 4 });
  assert.deepEqual((await b.list(B)).kennungen, ['d_b1/1', 'd_b1/2', 'd_c1/1', 'd_c1/2'], 'nichts von a');
  a.online();
  const r = await a.list(B, merker);
  assert.deepEqual(r.kennungen, ['d_b1/2', 'd_c1/1', 'd_c1/2']);
  merker = r.merker;
  await a.put(B, 'd_a1', { nr: 1, inhalt: 'A' });
  assert.deepEqual((await a.list(B, merker)).kennungen, ['d_a1/1']);
  assert.deepEqual((await c.list(B)).kennungen, ['d_a1/1', 'd_b1/1', 'd_b1/2', 'd_c1/1', 'd_c1/2']);
  a.offline(); a.offline(); a.online();
  assert.deepEqual((await a.list(B, merker)).kennungen, ['d_a1/1'], 'mehrfach umschalten');
});

test('Simulation: Geraetekennung wird geprueft; ohne Uhr gilt die echte Zeit; Speicher sind voneinander getrennt', async () => {
  for (const g of ['', 'a/b', '__proto__', null, 7]) assert.throws(() => lokalerSpeicher().geraet(g), (e) => e.code === 'ungueltig', String(g));
  const s1 = lokalerSpeicher(), s2 = lokalerSpeicher();
  const a = s1.geraet('d_a1');
  await a.invite.put('i1', 'jetzt');
  assert.equal(await a.invite.get('i1'), 'jetzt');
  await a.put(B, 'd_a1', { nr: 1, inhalt: 1 });
  assert.deepEqual((await s2.geraet('d_a1').list(B)).kennungen, []);
  const zweiterTab = s1.geraet('d_a1');
  await fehlt(zweiterTab.put(B, 'd_a1', { nr: 1, inhalt: 2 }), 'vorhanden', 'zweiter Zugang desselben Geraets ueberschreibt nicht');
});

test('Reinheit: kein Netz, kein Browser-Speicher, kein Zufall; Hilfsnamen mit spk/SPK_', () => {
  const src = fs.readFileSync(new URL('../../src/module/speicher.mjs', import.meta.url), 'utf8');
  for (const w of ['fetch', 'XMLHttpRequest', 'localStorage', 'indexedDB', 'Math.random', 'api.github.com', 'import ']) assert.equal(src.includes(w), false, w);
  const oben = [...src.matchAll(/^(?:export\s+)?(?:async\s+)?(?:function\s+([\w$]+)|(?:const|let|class)\s+([\w$]+))/gm)];
  for (const m of oben) {
    const name = m[1] || m[2];
    assert.ok(m[0].startsWith('export') || /^(spk|SPK_)/.test(name), name);
  }
});
