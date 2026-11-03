// Auftrag 1 (docs/konzept/dev-auftraege-2026-11-03.md, Peter 03.11.): Grundlage-Aufgaben (Stufe 1) fuer die Quests mit
// Hauptstandard, die keine hatten. Abnahme: jede Quest mit Hauptstandard hat in 25 Runden mindestens eine Aufgabe auf
// Stufe 1; bei „braucht Unterstuetzung“ enthaelt eine Runde mindestens 2; jede neue Aufgabe hat einen eigenen Tipp,
// kein leichteres Beispiel (nichts ist leichter als Grundlage), genug Varianten. Echte Klicks fuer „Show me how“.
//   node --test tests/auftrag1-grundlage.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, zustand, klick, alleKarten, karteOeffnen, frageBeantworten } from './app-hilfen.mjs';

const HAKEN = (app) => app.replace(/\}\)\(\);\s*<\/script>/, 'window.__g={WORLDS,STANDARDS,GRUNDLAGE,levelOf,adaptRound,standOf,guidance,exampleFor,qId};})();</script>');
let browser, server;
before(async () => { server = await appServer({ anpassen: HAKEN }); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

// die 10 Quests aus dem Auftrag (Befund 03.11.)
const NEU = ['numbers', 'combos', 'wordprob', 'forces', 'units', 'graphs', 'sentences', 'words', 'anleitung', 'library'];
const pad = (n) => String(n).padStart(2, '0');
const tag = (minus) => { const d = new Date(); d.setDate(d.getDate() - minus); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

test('jede Quest mit Hauptstandard: in 25 Runden mindestens eine Aufgabe auf Stufe 1; die 10 neuen in jeder Runde', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  const r = await page.evaluate(() => {
    const G = window.__g, out = {};
    for (const k of Object.keys(G.STANDARDS)) {
      if (!G.WORLDS[k] || !(G.STANDARDS[k] || [])[0]) continue;
      const runden = Array.from({ length: 25 }, () => G.WORLDS[k].build());
      out[k] = { n: runden.map((rd) => rd.length), l1: runden.map((rd) => rd.filter((q) => G.levelOf(q) === 1).length) };
    }
    return out;
  });
  const ohne = Object.entries(r).filter(([, v]) => v.l1.every((x) => x === 0)).map(([k]) => k);
  assert.deepEqual(ohne, [], 'quests with a main standard without any foundation task');
  // 14 quests with a main standard (19 visible quests, 5 of them without one: poetry, finish, team, school, music)
  assert.ok(Object.keys(r).length >= 14, 'all quests with a main standard counted: ' + Object.keys(r).length);
  for (const k of NEU) {
    assert.ok(r[k], k + ' has a main standard');
    assert.ok(r[k].l1.every((x) => x >= 1), k + ': a foundation task in every round ' + r[k].l1.join(','));
    assert.ok(r[k].n.every((x) => x === 8), k + ': rounds stay at 8 tasks ' + r[k].n.join(','));
  }
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('jede neue Grundlage-Aufgabe: Stufe 1, eigener Tipp, kein leichteres Beispiel, richtige Antwort waehlbar, mindestens 6 Varianten', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  const r = await page.evaluate((NEU) => {
    const G = window.__g, out = {};
    for (const k of NEU) {
      const qs = []; for (let i = 0; i < 80; i++) qs.push(...G.WORLDS[k].build().filter((q) => G.levelOf(q) === 1));
      const fehlerListe = [];
      for (const q of qs) {
        const p = String(q.prompt).replace(/<[^>]+>/g, '').slice(0, 60);
        if (q.world !== k) fehlerListe.push('world ' + q.world + ': ' + p);
        // text quests: the task comes from the quest's own bank (module grundlage)
        if (G.GRUNDLAGE[k] && !G.GRUNDLAGE[k].some((r) => r[0] === q.prompt && r[1] === q.options[q.answer])) fehlerListe.push('not from the bank of ' + k + ': ' + p);
        if (!q.tip || G.guidance(q, null, false).text !== q.tip) fehlerListe.push('no own tip: ' + p);
        if (G.exampleFor(q) !== null) fehlerListe.push('easier example for a foundation task: ' + p);
        if (q.kind === 'mc') {
          if (!(q.answer >= 0 && q.answer < q.options.length)) fehlerListe.push('answer index: ' + p);
          if (new Set(q.options).size !== q.options.length) fehlerListe.push('options twice: ' + p);
          if (q.options.length < 2) fehlerListe.push('one option: ' + p);
        } else if (q.kind === 'type') { if (!/^\d+$/.test(String(q.answer))) fehlerListe.push('typed answer: ' + p); }
        if (!q.explain) fehlerListe.push('no explanation: ' + p);
      }
      out[k] = { anzahl: qs.length, varianten: new Set(qs.map(G.qId)).size, bild: qs.filter((q) => q.visual).length, fehler: fehlerListe.slice(0, 5) };
    }
    return out;
  }, NEU);
  for (const k of NEU) {
    assert.deepEqual(r[k].fehler, [], k);
    assert.ok(r[k].varianten >= 6, `${k}: ${r[k].varianten} variants`);
  }
  // maths: wherever it helps with a picture or a model (units: choosing cm/m or g/kg has only a tip)
  for (const [k, min] of [['numbers', 0.6], ['combos', 0.6], ['wordprob', 0.6], ['graphs', 0.6], ['units', 0.4]]) assert.ok(r[k].bild / r[k].anzahl >= min, `${k}: foundation with a picture or model (${r[k].bild}/${r[k].anzahl})`);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('„braucht Unterstuetzung“: jede Runde der 10 Quests hat mindestens 2 Grundlage-Aufgaben, keine doppelt', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  // 12 answers at year level on 3 days, all wrong → requires support (RS) for every quest
  const ev = Object.fromEntries(NEU.map((k) => [k, Array.from({ length: 12 }, (_, i) => [tag(i % 3), 2, 0])]));
  await page.evaluate((e) => localStorage.setItem('bq2_ev', JSON.stringify(e)), ev);
  const r = await page.evaluate((NEU) => {
    const G = window.__g, out = {};
    for (const k of NEU) {
      const runden = Array.from({ length: 20 }, () => G.adaptRound(k, G.WORLDS[k].build()));
      out[k] = { st: G.standOf(k), l1: runden.map((rd) => rd.filter((q) => G.levelOf(q) === 1).length), l3: runden.map((rd) => rd.filter((q) => G.levelOf(q) === 3).length),
        // only the foundation tasks (other tasks of a quest can repeat already - finding, not part of Auftrag 1)
        doppelt: runden.filter((rd) => { const a = rd.filter((q) => G.levelOf(q) === 1).map(G.qId); return new Set(a).size !== a.length; }).length };
    }
    return out;
  }, NEU);
  for (const k of NEU) {
    assert.equal(r[k].st, 'RS', k);
    assert.ok(r[k].l1.every((x) => x >= 2), `${k}: at least 2 foundation tasks per round: ${r[k].l1.join(',')}`);
    assert.ok(r[k].l3.every((x) => x === 0), `${k}: no challenge`);
    assert.equal(r[k].doppelt, 0, k + ': no foundation task twice in a round');
  }
  assert.deepEqual(fehler, []);
  await ctx.close();
});

// real clicks: a foundation task offers its tip, and after the tip no "Show me an example"
for (const [quest, hilfe, beispiel] of [['combos', 'Show me how', 'Show me an example'], ['anleitung', 'Zeig mir, wie', 'Zeig mir ein Beispiel']]) {
  test(`Klick: ${quest} – Grundlage-Aufgabe zeigt den eigenen Tipp, kein leichteres Beispiel`, async () => {
    const { ctx, page, fehler } = await appOeffnen(browser, server.url);
    const karte = (await alleKarten(page)).find((x) => x.item === quest);
    await karteOeffnen(page, karte);
    let s = await zustand(page);
    const i = s.round.findIndex((q) => (q.level || 2) === 1);
    assert.ok(i >= 0, 'a foundation task in the round');
    for (let j = 0; j < i; j++) { await frageBeantworten(page, s.round[j]); await klick(page, '#nextBtn'); s = await zustand(page); }
    const q = s.round[s.idx];
    assert.equal(q.level, 1);
    const label = (await page.textContent('#helpBtn')).trim();
    assert.ok(label.includes(hilfe) || /Show me|Zeig mir/.test(label), 'help button: ' + label);
    await page.locator('#helpBtn').click();
    const fb = await page.textContent('#feedback');
    assert.ok(fb.includes(q.tip.replace(/<[^>]+>/g, '')), 'own tip shown: ' + fb);
    const nochKnopf = (await page.isVisible('#helpBtn')) && (await page.textContent('#helpBtn')).includes(beispiel);
    assert.ok(!nochKnopf, 'no easier example below the foundation level');
    assert.deepEqual(fehler, []);
    await ctx.close();
  });
}
