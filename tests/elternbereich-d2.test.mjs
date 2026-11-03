// Paket D2 (Konzept Elternbereich 6.5): Anteil der aktiven Lücke in Practise Today und im Übungsblatt.
// Erfundene Schuldaten, keine echten.
//  T14 (Anteil): Practise Today höchstens 2 von 8 Aufgaben aus der aktiven Lücke, die erste davon eine Grundlage-Aufgabe;
//  Übungsblatt höchstens 1 von 6 (ein Viertel); Übungsblatt zu einem Thema und Fokus „Manuell“ ohne Lücken-Spur.
//   node --test tests/elternbereich-d2.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'ABCD-EFGH', papa: 'PAPA-2345' };
const tag = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const txt = (de, en) => ({ de, en });
// the teacher's next step: forces (current topic). Gaps: M-N2 (Data Detective, has a few foundation tasks) is active
// (older), M-N4 (Number Combinations + Word Problems, foundation tasks since Auftrag 1, 03.11.) waits; for the second case the
// parents choose M-N4 as the active gap (field "active").
const SCHULE = { version: 1, kinder: { mia: { asOf: tag(-1), tasks: [
  { day: tag(-40), area: 'math', title: 'Check A', std: { 'M-N2': 'C' }, quests: ['detective'], focusNext: [], good: txt('a', 'a'), next: txt('', '') },
  { day: tag(-30), area: 'math', title: 'Check', std: { 'M-N4': 'C' }, quests: ['combos', 'wordprob'], focusNext: [], good: txt('a', 'a'), next: txt('', '') },
  { day: tag(-5), area: 'science', title: 'Forces', std: { 'S-F1': 'M' }, quests: ['forces'], focusNext: ['forces'], good: txt('b', 'b'), next: txt('Begründen.', 'Explain.') }
] } } };
const HAKEN = (app) => app.replace(/\}\)\(\);\s*<\/script>/, 'window.__g={buildToday,buildSheet,gapLaneQuests,focusTopics,setFocusMode,levelOf};})();</script>');

let browser, server;
before(async () => {
  server = await kontenServer({ users: [await konto('mia', 'student', C.mia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] })] }, { schule: SCHULE, anpassen: HAKEN });
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); });

const ID = (n) => server.konten.users.find((u) => u.user === n).id;
async function runden(page, L) {
  return page.evaluate((L) => {
    const G = window.__g, lane = G.gapLaneQuests(G.focusTopics());
    const today = Array.from({ length: 30 }, () => G.buildToday()).map((rd) => ({ n: rd.length, gap: rd.filter((q) => q.gap).map((q) => ({ w: q.world, lv: G.levelOf(q) })), ausLuecke: rd.filter((q) => L.includes(q.world)).length }));
    const blaetter = Array.from({ length: 20 }, () => G.buildSheet()).map((s) => s.items.filter((it) => it.q.gap || L.includes(it.q.world)).length);
    return { lane, today, blaetter };
  }, L);
}
function pruefen(r, L, mitGrundlage) {
  assert.deepEqual(r.lane.slice().sort(), L.slice().sort(), 'gap lane = the quests of the active gap');
  for (const [i, t] of r.today.entries()) {
    assert.equal(t.n, 8, 'round ' + i + ' has 8 tasks');
    assert.ok(t.gap.length <= 2, 'at most 2 gap tasks: ' + JSON.stringify(t.gap));
    assert.ok(t.ausLuecke <= 2, 'at most 2 tasks from the gap quests at all (also not as challenge or warm-up)');
    assert.ok(t.gap.every((g) => L.includes(g.w) && g.lv < 3), 'gap tasks from the gap quests, never a challenge: ' + JSON.stringify(t.gap));
    if (t.gap.length && mitGrundlage) assert.equal(t.gap[0].lv, 1, 'the first gap task is a foundation task: ' + JSON.stringify(t.gap));
    if (t.gap.length === 2) assert.ok(t.gap[1].lv >= t.gap[0].lv, 'small steps first');
  }
  assert.ok(r.today.filter((t) => t.gap.length).length >= 25, 'the gap comes up in (almost) every round');
  assert.ok(r.blaetter.every((n) => n <= 1), 'sheet: at most 1 of 6: ' + r.blaetter.join(','));
  assert.ok(r.blaetter.some((n) => n === 1), 'sheet: the gap does come up');
}

test('T14 share: Practise Today at most 2 of 8 from the active gap, foundation first where there is one; sheet at most 1 of 6; one-topic sheet and manual focus without gap lane', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  // active gap with foundation tasks (Data Detective)
  pruefen(await runden(page, ['detective']), ['detective'], true);
  // active gap chosen by the parents (Number Combinations + Word Problems): since Auftrag 1 (03.11.) with foundation
  // tasks, so the first gap task is a foundation task here too
  await page.evaluate((id) => localStorage.setItem('bq2_' + id + '__gaps', JSON.stringify({ closed: {}, active: 'M-N4' })), ID('mia'));
  pruefen(await runden(page, ['combos', 'wordprob']), ['combos', 'wordprob'], true);
  // a sheet on one topic and manual focus: no gap lane
  const r = await page.evaluate(() => {
    const G = window.__g;
    const thema = Array.from({ length: 5 }, () => G.buildSheet(['combos'])).map((s) => s.items.filter((it) => it.q.gap).length);
    G.setFocusMode('manual');
    const manuell = Array.from({ length: 10 }, () => G.buildToday()).map((rd) => rd.filter((q) => q.gap).length);
    return { thema, manuell };
  });
  assert.deepEqual(r.thema, [0, 0, 0, 0, 0], 'a sheet on one topic has no gap lane');
  assert.deepEqual(r.manuell, Array(10).fill(0), 'manual focus: no gap lane');
  assert.deepEqual(fehler, []);
  await ctx.close();
});
