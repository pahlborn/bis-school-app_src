// Paket D1 (Konzept Elternbereich 6.2–6.5): Lücken-Logik. Erfundene Schuldaten, keine echten.
//  T14 (ohne Anteil in Practise Today, der kommt mit D2):
//   RS/C im Hauptstandard → Lücke; neuere Einstufung ≥ Meeting → keine Lücke; nur eine aktiv, Reihenfolge RS vor C;
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
// Rounding Road (round, main standard M-N3): consolidating, later meeting → no gap
// Forces (forces): the teacher's next step → automatic focus (and no fallback to the hand-made list)
const SCHULE = { version: 1, kinder: { mia: { asOf: tag(-1), tasks: [
  { day: tag(-40), area: 'math', title: 'Check A', std: { 'M-N2': 'C', 'M-N3': 'C' }, quests: ['detective', 'round'], focusNext: [], good: txt('a', 'a'), next: txt('', '') },
  { day: tag(-20), area: 'math', title: 'Check B', std: { 'M-N1': 'RS', 'M-N3': 'M' }, quests: ['numbers', 'round'], focusNext: [], good: txt('b', 'b'), next: txt('', '') },
  { day: tag(-5), area: 'science', title: 'Forces', std: { 'S-F1': 'M' }, quests: ['forces'], focusNext: ['forces'], good: txt('c', 'c'), next: txt('Begründen.', 'Explain.') }
] } } };
const HAKEN = (app) => app.replace(/\}\)\(\);\s*<\/script>/, 'window.__g={openGaps,activeGap,focusAuto,focusTopics,setFocusMode,assessQuest};})();</script>');

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
const lage = (page) => page.evaluate(() => { const G = window.__g; return { offen: G.openGaps().map((g) => g.k + ':' + g.st), aktiv: G.activeGap(), fokus: G.focusAuto() }; });

test('T14 gaps: which quests, one active, order, focus, closing only when confirmed, closed stays closed, reopening, chosen by parents, manual untouched', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  // which quests are gaps, which one is active
  let l = await lage(page);
  assert.deepEqual(l.offen, ['numbers:RS', 'detective:C'], 'RS before C; rounding has a newer "meeting" rating: no gap');
  assert.equal(l.aktiv, 'numbers');
  assert.ok(l.fokus.includes('numbers') && l.fokus.includes('forces'), 'active gap and the teacher\'s next step in the focus');
  assert.ok(!l.fokus.includes('detective'), 'a waiting gap is not in the focus');
  // provisionally secure: does not close
  await setze(page, uebung('numbers', 10, [1, 2, 3]));
  assert.equal((await page.evaluate(() => window.__g.assessQuest('numbers'))).sure, 'provisional');
  assert.deepEqual((await lage(page)).offen, ['numbers:RS', 'detective:C'], 'provisional "secure" is not enough');
  // confirmed secure: closed by the app, the next gap becomes active
  await setze(page, uebung('numbers', 24, [1, 3, 5, 8, 12, 16]));
  const a = await page.evaluate(() => window.__g.assessQuest('numbers'));
  assert.equal(a.sure, 'confirmed'); assert.ok(['m', 'e'].includes(a.level));
  l = await lage(page);
  assert.deepEqual(l.offen, ['detective:C']); assert.equal(l.aktiv, 'detective');
  assert.ok(l.fokus.includes('detective'));
  const g = await lies(page, 'gaps');
  assert.equal(g.closed.numbers.by, 'app'); assert.equal(g.closed.numbers.schoolDay, tag(-20));
  // closed stays closed, even if the answers get worse later
  await setze(page, uebung('numbers', 24, [1, 3, 5, 8, 12, 16], false));
  assert.deepEqual((await lage(page)).offen, ['detective:C'], 'closed stays closed');
  // a newer weak school rating opens it again (here: the closing record belongs to an older rating)
  await setze(page, { gaps: { closed: { numbers: { at: tag(-30), by: 'app', schoolDay: tag(-30) } }, active: null }, attempts: [], ev: {} });
  assert.deepEqual((await lage(page)).offen, ['numbers:RS', 'detective:C'], 'newer weak rating: open again');
  // closed by the parents (data field prepared for D4)
  await setze(page, { gaps: { closed: { numbers: { at: tag(0), by: 'parents', schoolDay: tag(-20) } }, active: null } });
  assert.equal((await lage(page)).aktiv, 'detective');
  // the parents chose the active gap
  await setze(page, { gaps: { closed: {}, active: 'detective' } });
  l = await lage(page);
  assert.equal(l.aktiv, 'detective'); assert.ok(l.fokus.includes('detective') && !l.fokus.includes('numbers'), 'chosen gap in the focus, the other waits');
  // manual focus: untouched by gaps
  await setze(page, { gaps: null });
  const manuell = await page.evaluate(() => { const G = window.__g; G.setFocusMode('manual'); return G.focusTopics(); });
  await setze(page, { gaps: { closed: {}, active: 'detective' } });
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
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'frau', C.frau); await passwortSetzen(page, 'Moon-Glass-Paper-8812');
  await page.waitForSelector('#parentClose');
  await page.locator('[data-psubj="maths"]').click(); await page.waitForSelector('#pBack');
  assert.equal(await lies(page, 'gaps'), null, 'teacher: nothing written');
  assert.ok(!(await page.locator('.pquest', { has: page.locator('.pqn', { hasText: 'Time & Numbers' }) }).innerText()).includes('Lücke'), 'teacher view: numbers is (computed) closed already');
  await page.locator('#parentClose').click(); await page.waitForSelector('#home:not([hidden])');
  // parents (no new confirmed answers): nothing was stored by the teacher, so numbers is an open gap; tags at the quests
  await setze(page, { attempts: [], ev: {} });
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'papa', C.papa); await passwortSetzen(page, 'Moon-Glass-Paper-8812');
  await page.waitForSelector('#parentClose');
  await page.locator('[data-psubj="maths"]').click(); await page.waitForSelector('#pBack');
  const karte = (k) => page.locator('.pquest', { has: page.locator(`[data-pfocus="${k}"]`) });
  assert.match(await karte('numbers').locator('.ptag.gap').innerText(), /🎯 Lücke laut Schule \(\d\d\.\d\d\.\d{4}\)/);
  assert.match(await karte('detective').locator('.ptag.gapwait').innerText(), /Lücke laut Schule \(\d\d\.\d\d\.\d{4}\) · wartet/);
  assert.equal(await karte('round').locator('.ptag.gap, .ptag.gapwait').count(), 0, 'no gap tag without a gap');
  assert.equal(await page.getAttribute('[data-pfocus="numbers"]', 'aria-pressed'), 'true', 'active gap switched on in the automatic focus');
  assert.equal(await page.getAttribute('[data-pfocus="detective"]', 'aria-pressed'), 'false', 'waiting gap not in the focus');
  await page.locator('.phdr [data-plang="en"]').click();
  assert.match(await karte('numbers').locator('.ptag.gap').innerText(), /gap per school/);
  assert.deepEqual(fehler, []);
  await ctx.close();
});
