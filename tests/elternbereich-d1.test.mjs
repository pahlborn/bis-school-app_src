// Paket D1/D1b (Konzept Elternbereich 6.2–6.5): Lücken-Logik, seit D1b je Standard (Peter 02.11., Entscheidung B).
// Erfundene Schuldaten, keine echten.
//  T14 (ohne Anteil in Practise Today, der kommt mit D2):
//   RS/C eines Standards, der Hauptstandard mindestens einer Quest ist → Lücke mit allen diesen Quests;
//   eine bestätigte Quest schließt die ganze Lücke; neuere Einstufung ≥ Meeting → keine Lücke; nur eine aktiv, Reihenfolge RS vor C;
//   wartende Lücken nicht im Fokus; vorläufig sicher schließt nicht, bestätigt sicher schon; geschlossen bleibt geschlossen;
//   eine neuere schwache Einstufung öffnet wieder; von Eltern gewählte aktive Lücke; Manuell unberührt;
//   Lehrkraft schreibt nichts; Etikett in der Fachansicht.
// Echte Klicks.
//   node --test tests/elternbereich-d1.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'ABCD-EFGH', papa: 'PAPA-2345', frau: 'TEAC-HER2' };
const tag = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const txt = (de, en) => ({ de, en });
// Time & Numbers (numbers, main standard M-N1): requires support → gap (RS)
// Data Detective (detective, main standard M-N2): consolidating, older → gap (C), waits behind RS
// Number Combinations + Word Problems (combos, wordprob, main standard M-N4): consolidating → one gap with two quests
// Rounding Road (round, main standard M-N3): consolidating, later meeting → no gap
// Forces (forces): the teacher's next step → automatic focus (and no fallback to the hand-made list)
const SCHULE = { version: 1, kinder: { mia: { asOf: tag(-1), tasks: [
  { day: tag(-40), area: 'math', title: 'Check A', std: { 'M-N2': 'C', 'M-N3': 'C' }, quests: ['detective', 'round'], focusNext: [], good: txt('a', 'a'), next: txt('', '') },
  { day: tag(-30), area: 'math', title: 'Check C', std: { 'M-N4': 'C' }, quests: ['combos', 'wordprob'], focusNext: [], good: txt('c', 'c'), next: txt('', '') },
  { day: tag(-20), area: 'math', title: 'Check B', std: { 'M-N1': 'RS', 'M-N3': 'M' }, quests: ['numbers', 'round'], focusNext: [], good: txt('b', 'b'), next: txt('', '') },
  { day: tag(-5), area: 'science', title: 'Forces', std: { 'S-F1': 'M' }, quests: ['forces'], focusNext: ['forces'], good: txt('c', 'c'), next: txt('Begründen.', 'Explain.') }
] } } };
const HAKEN = (app) => app.replace(/\}\)\(\);\s*<\/script>/, 'window.__g={openGaps,activeGap,focusAuto,focusTopics,setFocusMode,assessQuest,recordAnswer};})();</script>');

let browser, server;
before(async () => {
  server = await kontenServer({ users: [await konto('mia', 'student', C.mia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] }), await konto('frau', 'teacher', C.frau)] }, { schule: SCHULE, anpassen: HAKEN });
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); });

const ID = (n) => server.konten.users.find((u) => u.user === n).id;
const NS = () => 'bq2_' + ID('mia') + '__';
/** first attempts on a quest: n answers, level 2, spread over the given days back */
const versuche = (skill, n, tage, ok = true) => Array.from({ length: n }, (_, i) => ({ day: tag(-tage[i % tage.length]), skill, level: 2, attempt: 1, ok, help: false }));
/** the same answers as evidence (standOf reads "ev": [day, level, ok]) */
const belege = (skill, liste) => ({ [skill]: liste.map((a) => [a.day, a.level, a.ok ? 1 : 0]) });
const uebung = (skill, n, tage, ok = true) => { const a = versuche(skill, n, tage, ok); return { attempts: a, ev: belege(skill, a) }; };
const setze = (page, daten) => page.evaluate(([ns, d]) => { for (const [k, v] of Object.entries(d)) { if (v === null) localStorage.removeItem(ns + k); else localStorage.setItem(ns + k, JSON.stringify(v)); } }, [NS(), daten]);
const lies = (page, k) => page.evaluate(([ns, key]) => JSON.parse(localStorage.getItem(ns + key) || 'null'), [NS(), k]);
const lage = (page) => page.evaluate(() => { const G = window.__g, a = G.activeGap(); return { offen: G.openGaps().map((g) => g.s + ':' + g.st + ':' + g.quests.join('+')), aktiv: a && a.s, fokus: G.focusAuto() }; });

test('T14 gaps: which quests, one active, order, focus, reaching secure before the following six close, closed stays closed, reopening, chosen by parents, manual untouched', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  // which standards are gaps (with their quests), which one is active
  let l = await lage(page);
  assert.deepEqual(l.offen, ['M-N1:RS:numbers', 'M-N2:C:detective', 'M-N4:C:combos+wordprob'], 'RS before C, older first; rounding has a newer "meeting" rating: no gap');
  assert.equal(l.aktiv, 'M-N1');
  assert.ok(l.fokus.includes('numbers') && l.fokus.includes('forces'), 'active gap and the teacher\'s next step in the focus');
  assert.ok(!l.fokus.includes('detective') && !l.fokus.includes('combos'), 'waiting gaps are not in the focus');
  // Five own answers: the weak school fallback still applies, so the gap stays open
  await setze(page, uebung('numbers', 5, [0]));
  assert.equal((await page.evaluate(() => window.__g.assessQuest('numbers'))).sure, 'few');
  assert.equal((await lage(page)).offen.length, 3, 'fewer than six answers retain the weak school status');
  // Six same-day L2 successes reach M; six following responses are still required
  await setze(page, uebung('numbers', 6, [0]));
  const a = await page.evaluate(() => window.__g.assessQuest('numbers'));
  assert.equal(a.sure, 'few'); assert.ok(['m', 'e'].includes(a.level));
  assert.equal((await lage(page)).offen.length,3,'M alone leaves the gap open');
  await page.evaluate(()=>{for(let i=0;i<6;i++)window.__g.recordAnswer({world:'numbers',level:2},true);});
  l = await lage(page);
  assert.deepEqual(l.offen, ['M-N2:C:detective', 'M-N4:C:combos+wordprob']); assert.equal(l.aktiv, 'M-N2');
  assert.ok(l.fokus.includes('detective'));
  const g = await lies(page, 'gaps');
  assert.equal(g.closed['M-N1'].by, 'app'); assert.equal(g.closed['M-N1'].schoolDay, tag(-20)); assert.equal(g.closed['M-N1'].quest, 'numbers');
  // closed stays closed, even if the answers get worse later
  await setze(page, uebung('numbers', 24, [1, 3, 5, 8, 12, 16], false));
  assert.deepEqual((await lage(page)).offen, ['M-N2:C:detective', 'M-N4:C:combos+wordprob'], 'closed stays closed');
  // a gap with two quests: active means both in the focus; ONE confirmed quest closes the whole gap
  await setze(page, { gaps: { closed: { 'M-N1': { at: tag(0), by: 'parents', schoolDay: tag(-20) } }, active: 'M-N4' }, attempts: [], ev: {} });
  l = await lage(page);
  assert.equal(l.aktiv, 'M-N4'); assert.ok(l.fokus.includes('combos') && l.fokus.includes('wordprob'), 'both quests of the active gap in the focus');
  assert.ok(!l.fokus.includes('detective'), 'the other gap waits');
  await setze(page, uebung('wordprob', 24, [1, 3, 5, 8, 12, 16]));
  await page.evaluate(()=>{for(let i=0;i<6;i++)window.__g.recordAnswer({world:'wordprob',level:2},true);});
  l = await lage(page);
  assert.deepEqual(l.offen, ['M-N2:C:detective'], 'one confirmed quest closed the gap of its standard');
  assert.equal((await lies(page, 'gaps')).closed['M-N4'].quest, 'wordprob');
  // a newer weak school rating opens it again (here: the closing record belongs to an older rating)
  await setze(page, { gaps: { closed: { 'M-N1': { at: tag(-30), by: 'app', schoolDay: tag(-30) } }, active: null }, attempts: [], ev: {} });
  assert.deepEqual((await lage(page)).offen, ['M-N1:RS:numbers', 'M-N2:C:detective', 'M-N4:C:combos+wordprob'], 'newer weak rating: open again');
  // records of D1 (keyed by quest) are read as the quest's main standard
  await setze(page, { gaps: { closed: { combos: { at: tag(0), by: 'app', schoolDay: tag(-30) } }, active: 'detective' } });
  l = await lage(page);
  assert.ok(!l.offen.some((x) => x.startsWith('M-N4')), 'old quest record closes its standard'); assert.equal(l.aktiv, 'M-N2', 'old quest key for the active gap');
  // manual focus: untouched by gaps
  await setze(page, { gaps: null });
  const manuell = await page.evaluate(() => { const G = window.__g; G.setFocusMode('manual'); return G.focusTopics(); });
  await setze(page, { gaps: { closed: {}, active: 'M-N2' } });
  assert.deepEqual(await page.evaluate(() => window.__g.focusTopics()), manuell, 'manual focus stays as chosen');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('T14 a teacher looking through a grant writes nothing; parents see the gap tag in the subject view', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  // numbers would be closed by the app (confirmed secure), nothing stored yet
  await setze(page, { ...uebung('numbers', 24, [1, 3, 5, 8, 12, 16]), gaps: null,
    grants: [{ id: 'g1', grantee: ID('frau'), scope: ['learning', 'school'], from: tag(0), until: tag(10), by: ID('papa') }] });
  await page.evaluate(()=>{for(let i=0;i<6;i++)window.__g.recordAnswer({world:'numbers',level:2},true);});
  const beforeGrant=await lies(page,'gaps');
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'frau', C.frau); await passwortSetzen(page, 'Moon-Glass-Paper-8812');
  await page.waitForSelector('#parentClose');
  await page.locator('[data-psubj="maths"]').click(); await page.waitForSelector('#pBack');
  assert.deepEqual(await lies(page, 'gaps'),beforeGrant,'teacher: render does not persist computed closure or move the gap');
  assert.ok(!(await page.locator('.pquest', { has: page.locator('.pqn', { hasText: 'Time & Numbers' }) }).innerText()).includes('Learning goal'), 'teacher view: numbers is (computed) closed already');
  await page.locator('#parentClose').click(); await page.waitForSelector('#home:not([hidden])');
  // parents (no new confirmed answers): nothing was stored by the teacher, so numbers is an open gap; tags at the quests
  await setze(page, { attempts: [], ev: {},gaps:null });
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'papa', C.papa); await passwortSetzen(page, 'Moon-Glass-Paper-8812');
  await page.waitForSelector('#parentClose');
  await page.locator('[data-psubj="maths"]').click(); await page.waitForSelector('#pBack');
  const karte = (k) => page.locator('.pquest', { has: page.locator(`[data-pfocus="${k}"]`) });
  assert.match(await karte('numbers').locator('.ptag.gap').innerText(), /🎯 Learning goal · Requires support \(RS\) · Evaluation \d\d\.\d\d\.\d{4}/);
  assert.match(await karte('detective').locator('.ptag.gapwait').innerText(), /Learning goal · Consolidating \(C\) · Evaluation \d\d\.\d\d\.\d{4} · wartet/);
  for (const k of ['combos', 'wordprob']) assert.equal(await karte(k).locator('.ptag.gapwait').count(), 1, 'both quests of a waiting gap marked: ' + k);
  assert.equal(await karte('round').locator('.ptag.gap, .ptag.gapwait').count(), 0, 'no gap tag without a gap');
  assert.equal(await page.getAttribute('[data-pfocus="numbers"]', 'aria-pressed'), 'true', 'active gap switched on in the automatic focus');
  assert.equal(await page.getAttribute('[data-pfocus="detective"]', 'aria-pressed'), 'false', 'waiting gap not in the focus');
  await page.locator('.phdr [data-plang="en"]').click();
  assert.match(await karte('numbers').locator('.ptag.gap').innerText(), /Learning goal · Requires support \(RS\) · Evaluation/);
  assert.deepEqual(fehler, []);
  await ctx.close();
});
