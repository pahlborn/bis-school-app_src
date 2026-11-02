// Paket D3 (Konzept Elternbereich 6.4, Peter 02.11.: „wir versuchen es mit 2“): Lücken, deren Quests alle ohnehin aktuelle
// Themen sind, werden bei der Wahl der aktiven Lücke übersprungen. Die Liste der Voraussetzungen wird NICHT eingebaut
// (Entwurf in docs/konzept/voraussetzungen-entwurf.md). Erfundene Schuldaten, keine echten.
//   node --test tests/elternbereich-d3.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'ABCD-EFGH', papa: 'PAPA-2345' };
const tag = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const txt = (de, en) => ({ de, en });
// gaps: M-N2 (Data Detective) oldest, but Data Detective is the teacher's next step → covered, skipped;
//       M-N1 (Time & Numbers) newer, not a current topic → active
const SCHULE = { version: 1, kinder: { mia: { asOf: tag(-1), tasks: [
  { day: tag(-40), area: 'math', title: 'Check A', std: { 'M-N2': 'C' }, quests: ['detective'], focusNext: [], good: txt('a', 'a'), next: txt('', '') },
  { day: tag(-20), area: 'math', title: 'Check B', std: { 'M-N1': 'C' }, quests: ['numbers'], focusNext: [], good: txt('b', 'b'), next: txt('', '') },
  { day: tag(-5), area: 'math', title: 'Next', std: {}, quests: ['detective'], focusNext: ['detective'], good: txt('c', 'c'), next: txt('Tabellen vergleichen.', 'Compare tables.') }
] } } };
const HAKEN = (app) => app.replace(/\}\)\(\);\s*<\/script>/, 'window.__g={openGaps,activeGap,gapLaneQuests,focusTopics};})();</script>');

let browser, server;
before(async () => {
  server = await kontenServer({ users: [await konto('mia', 'student', C.mia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] })] }, { schule: SCHULE, anpassen: HAKEN });
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); });
const ID = (n) => server.konten.users.find((u) => u.user === n).id;
const setzeGaps = (page, g) => page.evaluate(([id, v]) => { if (v === null) localStorage.removeItem('bq2_' + id + '__gaps'); else localStorage.setItem('bq2_' + id + '__gaps', JSON.stringify(v)); }, [ID('mia'), g]);
const lage = (page) => page.evaluate(() => { const G = window.__g, a = G.activeGap(); return { offen: G.openGaps().map((g) => g.s), aktiv: a && a.s, spur: G.gapLaneQuests(G.focusTopics()) }; });

test('D3 a gap whose quests are all current topics is skipped; parents can still choose it; if all gaps are covered, the first one', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  let l = await lage(page);
  assert.deepEqual(l.offen, ['M-N2', 'M-N1'], 'order unchanged: older first');
  assert.equal(l.aktiv, 'M-N1', 'the covered gap (Data Detective is a current topic) is skipped');
  assert.deepEqual(l.spur, ['numbers'], 'the gap lane brings something new');
  // the parents choose the covered gap: their choice counts
  await setzeGaps(page, { closed: {}, active: 'M-N2' });
  l = await lage(page);
  assert.equal(l.aktiv, 'M-N2'); assert.deepEqual(l.spur, [], 'nothing extra: Data Detective is practised anyway');
  // the uncovered gap closed: only covered gaps left → the first one
  await setzeGaps(page, { closed: { 'M-N1': { at: tag(0), by: 'parents', schoolDay: tag(-20) } }, active: null });
  l = await lage(page);
  assert.deepEqual(l.offen, ['M-N2']); assert.equal(l.aktiv, 'M-N2', 'all covered: the first one stays active (closing still counts)');
  assert.deepEqual(fehler, []);
  await ctx.close();
});
