// Keine Aufgabe doppelt in einer Runde (Peter 03.11.; Modul runde). Vorher (main, je 2 000 Runden): Specific Examples
// 56 %, Number Combinations 45 %, Anleitung 26 %, Library 18 %, Capital Letters 16 %, Units 9 %, Practise Today 6 %.
// Jetzt: jede sichtbare Quest, jeder Mix und Practise Today ohne Doppelte; Rundenlaenge und Stufen bleiben.
//   node --test tests/runde-ohne-doppelte.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, zustand, alleKarten, karteOeffnen, zurStart } from './app-hilfen.mjs';

const HAKEN = (app) => app.replace(/\}\)\(\);\s*<\/script>/, 'window.__g={WORLDS,SUBJECTS,questsIn,qId,levelOf,buildToday};})();</script>');
let browser, server;
before(async () => { server = await appServer({ anpassen: HAKEN }); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

test('jede Quest und jeder Mix: 500 Runden ohne doppelte Aufgabe, 8 Aufgaben je Runde', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  const r = await page.evaluate(() => {
    const G = window.__g, out = {};
    const quests = G.SUBJECTS.flatMap(G.questsIn).concat(Object.keys(G.WORLDS).filter((k) => k.startsWith('mix_')));
    for (const k of quests) {
      let doppelt = 0; const laengen = new Set();
      for (let i = 0; i < 500; i++) { const rd = G.WORLDS[k].build(), ids = rd.map(G.qId); if (new Set(ids).size !== ids.length) doppelt++; laengen.add(rd.length); }
      out[k] = { doppelt, laengen: [...laengen] };
    }
    return out;
  });
  assert.ok(Object.keys(r).length >= 19, 'all visible quests and the mixes: ' + Object.keys(r).length);
  for (const [k, v] of Object.entries(r)) {
    assert.equal(v.doppelt, 0, `${k}: rounds with a task twice`);
    assert.deepEqual(v.laengen, [8], `${k}: always 8 tasks`);
  }
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Stufen bleiben: Specific Examples und Number Combinations haben dieselbe Stufen-Verteilung wie die Vorlage', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  const r = await page.evaluate(() => {
    const G = window.__g, out = {};
    for (const k of ['examples', 'combos', 'anleitung']) {
      const s = { 1: 0, 2: 0, 3: 0 };
      for (let i = 0; i < 400; i++) for (const q of G.WORLDS[k].build()) s[G.levelOf(q)]++;
      out[k] = s;
    }
    return out;
  });
  // combos: per round 1 foundation, 4 year level (2 combinations, 2 missing parts), 3 extending (2 another way, 1 reasonable)
  assert.deepEqual(r.combos, { 1: 400, 2: 1600, 3: 1200 }, 'combos: levels unchanged');
  for (const k of ['examples', 'anleitung']) assert.equal(r[k][1] + r[k][2] + r[k][3], 3200, k);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Practise Today: 300 Runden ohne doppelte Aufgabe', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  const r = await page.evaluate(() => {
    const G = window.__g; let doppelt = 0; const laengen = new Set();
    for (let i = 0; i < 300; i++) { const rd = G.buildToday(), ids = rd.map(G.qId); if (new Set(ids).size !== ids.length) doppelt++; laengen.add(rd.length); }
    return { doppelt, laengen: [...laengen] };
  });
  assert.equal(r.doppelt, 0); assert.deepEqual(r.laengen, [8]);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Klick: Specific Examples zehnmal oeffnen – keine Runde mit doppelter Aufgabe', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  const karte = (await alleKarten(page)).find((x) => x.item === 'examples');
  const id = (q) => [q.prompt, q.visual, (q.options || []).slice().sort().join('/'), (q.items || []).slice().sort().join('/')].join('|');
  for (let i = 0; i < 10; i++) {
    await karteOeffnen(page, karte);
    const s = await zustand(page), ids = s.round.map(id);
    assert.equal(new Set(ids).size, ids.length, 'round ' + i + ': ' + ids.filter((x, j) => ids.indexOf(x) !== j)[0]);
    await zurStart(page);
  }
  assert.deepEqual(fehler, []);
  await ctx.close();
});
