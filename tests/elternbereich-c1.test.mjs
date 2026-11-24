// Paket C1 (Konzept Elternbereich 5.3, 5.4, 5.9): Schule in der Fachansicht. Erfundene Schuldaten, keine echten.
//  T13: „Aus der Schule“ zeigt nur die Standards des Fachs, jeder Standard steht in genau einem Fach;
//       Lehrkraft ohne Umfang „Schuldaten“ sieht weder Block noch Schul-Punkt noch Verlauf; Fokus-Etikett passt zu den nächsten Schritten.
//  Außerdem: 🏫-Punkt an den Kacheln mit der schwächsten Einstufung; Kapitel „Evaluations“ (bis 05.11. „Bewertungen der Schule – Verlauf“) nur mit Aufgaben.
// Echte Klicks.
//   node --test tests/elternbereich-c1.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'ABCD-EFGH', papa: 'PAPA-2345', frau: 'TEAC-HER2' };
const tag = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const txt = (de, en) => ({ de, en });
// invented school data: rounding secure (before consolidating), word problems needs support, forces consolidating,
// measuring (M-M1, practised only in science) secure; one waiting assignment; learning skills
const SCHULE = { version: 1, kinder: { mia: { asOf: tag(-2), tasks: [
  { day: tag(-40), area: 'math', title: 'Rounding check A', std: { 'M-N3': 'C' }, quests: ['round'], focusNext: [], good: txt('Rundet sicher auf Zehner.', 'Rounds to tens.'), next: txt('', '') },
  { day: tag(-10), area: 'math', title: 'Rounding check B', std: { 'M-N3': 'M', 'M-N4': 'RS' }, quests: ['round', 'wordprob'], focusNext: ['wordprob'], good: txt('Runden gelingt.', 'Rounding works.'), next: txt('Sachaufgaben in zwei Schritten üben.', 'Practise two-step word problems.') },
  { day: tag(-8), area: 'science', title: 'Forces lab', std: { 'S-F1': 'C', 'M-M1': 'M' }, quests: ['forces', 'units'], focusNext: ['forces'], good: txt('Misst genau.', 'Measures carefully.'), next: txt('Begründen, warum etwas rutscht.', 'Explain why things slide.') },
  { day: tag(-6), area: 'learner', title: 'Learner check', std: {}, atl: { 'Thinker': 'Obs.' }, quests: [], focusNext: [], good: txt('Fragt nach.', 'Asks questions.'), next: txt('', '') },
  { day: tag(-1), area: 'english', title: 'Persuasive letter', std: {}, quests: ['opinion'], focusNext: [], pending: true, good: txt('', ''), next: txt('', '') }
] } } };

let browser, server;
before(async () => {
  server = await kontenServer({ users: [await konto('mia', 'student', C.mia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] }), await konto('frau', 'teacher', C.frau)] }, { schule: SCHULE, anpassen: app => app.replace('function schoolHTML(){', 'window.__cgSource=()=>JSON.parse(JSON.stringify(schoolData()));function schoolHTML(){') });
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); });

const ID = (n) => server.konten.users.find((u) => u.user === n).id;
async function kindDann(page, wer) {
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', wer, C[wer]); await passwortSetzen(page, 'Moon-Glass-Paper-8812');
  await page.waitForSelector('#parentClose');
}
const fach = async (page, key) => { if (await page.$('#pBack')) await page.locator('#pBack').click(); await page.locator(`[data-psubj="${key}"]`).click(); await page.waitForSelector('#pBack'); };
const standardZeilen = (page) => page.$$eval('#pSchool table tbody tr td:first-child', (td) => td.map((x) => x.textContent.trim()));

test('T13 "From school" per subject: only its standards, each standard in exactly one subject; next steps and focus tag; learning skills; tile dot; history', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await kindDann(page, 'papa');
  // tile dots: the weakest current school rating of the subject
  const punkt = async (key) => page.locator(`[data-psubj="${key}"] .pschooldot .pdots i`).getAttribute('class').catch(() => null);
  assert.equal(await punkt('maths'), 'rs', 'maths: word problems need support');
  assert.equal(await punkt('science'), 'c', 'science: forces consolidating');
  assert.equal(await page.locator('[data-psubj="deutsch"] .pschooldot').count(), 0, 'no school rating for German');
  // every rated standard in exactly one subject
  const alle = [];
  for (const key of ['maths', 'science', 'english', 'deutsch', 'reading', 'learner', 'events']) {
    await fach(page, key);
    alle.push(...(await standardZeilen(page)).map((s) => key + ': ' + s));
  }
  const namen = alle.map((s) => s.split(': ').slice(1).join(': '));
  assert.equal(new Set(namen).size, namen.length, 'no standard twice: ' + alle.join(' | '));
  assert.equal(namen.length, 4, 'all four rated standards shown: ' + alle.join(' | '));
  assert.ok(alle.some((s) => s.startsWith('science: ') && /Messen|Einheiten|measur/i.test(s)), 'measuring (practised only in science) is shown in science: ' + alle.join(' | '));
  // maths: rounding with its earlier rating, next steps with the focus that follows from them
  await fach(page, 'maths');
  const b = await page.locator('#pSchool').innerText();
  assert.match(b, /Meeting expectations \(M\)[\s\S]*vorher: Consolidating \(C\)/);
  assert.match(b, /Sachaufgaben in zwei Schritten üben\.[\s\S]*Daraus im automatischen Fokus: Word Problems/);
  assert.ok(!b.includes('Begründen, warum etwas rutscht'), 'science next step not in maths');
  assert.match(await page.locator('.pquest', { has: page.locator('[data-pfocus="wordprob"]') }).innerText(), /Areas of Development \(Lehrkraft\)/);
  assert.equal(await page.getAttribute('[data-pfocus="wordprob"]', 'aria-pressed'), 'true', 'focus tag matches the automatic focus');
  assert.match(await page.locator('.pquest', { has: page.locator('[data-pfocus="round"]') }).innerText(), /🏫 Evaluation \d\d\.\d\d\.\d{4}\s+Meeting expectations \(M\)/);
  // learner: learning skills
  await fach(page, 'learner');
  assert.match(await page.locator('#pSchool').innerText(), /Learner Profile Attributes[\s\S]*Thinker: Obs\./);
  // history: only the assignments, the waiting one included; no standards table
  await page.locator('#pBack').click();
  await page.locator('details.psec[data-psec="school"] > summary').click();
  const h = await page.locator('details.psec[data-psec="school"]').innerText();
  for (const w of ['Evaluations', 'Rounding check B', 'Forces lab', 'Awaiting evaluation', 'Persuasive letter']) assert.ok(h.includes(w), w);
  // since 05.11. one table of the assignments (and rubrics in the details), still no standards table
  assert.equal(await page.locator('details.psec[data-psec="school"] table:not(.pstab):not(.psrub)').count(), 0, 'no standards table in the history');
  assert.ok(!h.includes('Standards – zuletzt'));
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('T13 teacher: with "learning" only no school data anywhere; with "school data" block, dot and history', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  const freigabe = (scope) => page.evaluate(([id, g]) => localStorage.setItem('bq2_' + id + '__grants', JSON.stringify([g])), [ID('mia'), { id: 'g1', grantee: ID('frau'), scope, from: tag(0), until: tag(10), by: ID('papa') }]);
  await freigabe(['learning']);
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'frau', C.frau); await passwortSetzen(page, 'Moon-Glass-Paper-8812');
  await page.waitForSelector('#parentClose');
  assert.equal(await page.locator('.pschooldot, details.psec[data-psec="school"]').count(), 0, 'learning only: no dot, no history');
  await fach(page, 'maths');
  assert.equal(await page.locator('#pSchool, .pqschool').count(), 0, 'learning only: no block, no school chip');
  await page.locator('#parentClose').click(); await page.waitForSelector('#home:not([hidden])');
  await freigabe(['learning', 'school']);
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'frau', 'Moon-Glass-Paper-8812');
  await page.waitForSelector('#parentClose');
  assert.ok(await page.locator('.pschooldot').count(), 'school data: dot');
  assert.equal(await page.locator('details.psec[data-psec="school"]').count(), 1, 'school data: history');
  await fach(page, 'maths');
  assert.equal(await page.locator('#pSchool').count(), 1, 'school data: block');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('C/G original school terms in both parent languages preserve source data', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await kindDann(page, 'papa');
  const snapshot = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(k => /__(?:school|events)$/.test(k)).map(k => [k, localStorage.getItem(k)])));
  const before = await snapshot();
  const source = await page.evaluate(() => window.__cgSource());
  assert.equal(source.tasks.length, 5, 'all source evaluations are present');
  for (const lang of ['de', 'en']) {
    await page.locator(`.phdr [data-plang="${lang}"]`).click();
    await fach(page, 'maths');
    const school = await page.locator('#pSchool').innerText();
    assert.deepEqual(await page.locator('.pquest .pqchip:not(.pqschool) > .small').allInnerTexts(), Array(await page.locator('.pquest').count()).fill('Big Quest'), 'practice source names Big Quest in either language');
    assert.doesNotMatch(school, /\b(?:die App|the app)\b/i, 'visible explanatory text names Big Quest');
    for (const term of ['Meeting expectations (M)', 'Consolidating (C)', 'Requires support (RS)', 'Areas of Development', 'Learning goals', 'Evaluation']) assert.ok(school.includes(term), `${lang}: ${term}`);
    assert.ok(school.includes(SCHULE.kinder.mia.tasks[1].next[lang]), `${lang}: teacher text stays verbatim`);
    assert.doesNotMatch(school, /Lücke|\b[Gg]aps?\b/);
    await page.locator('#pBack').click();
    await page.locator('details.psec[data-psec="school"] > summary').click();
    assert.match(await page.locator('[data-psec="school"]').innerText(), /Evaluations[\s\S]*Awaiting evaluation/);
    await page.locator('[data-psdet]').first().click();
    assert.match(await page.locator('.psdet').first().innerText(), /Strengths[\s\S]*Areas of Development/);
    assert.deepEqual(await page.evaluate(() => window.__cgSource()), source, `${lang}: original source records unchanged`);
    assert.deepEqual(await snapshot(), before, `${lang}: school data and revisions unchanged`);
    await page.locator('details.psec[data-psec="school"] > summary').click();
  }
  assert.deepEqual(fehler, []);
  await ctx.close();
});
