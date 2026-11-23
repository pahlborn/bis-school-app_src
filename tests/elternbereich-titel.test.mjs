// Elternbereich – neue Titel (Peter, 05.11., Punkte 1–3). Erfundene Schuldaten, keine echten. Echte Klicks.
//  T1  Kapitel im Elternbereich (DE): „📖 Das Konzept von Big Quest“ · „🤝 So unterstützen Sie Ihr Kind“ · „🏫 Evaluations“;
//      „Neu hier?“ führt mit demselben Titel zum Konzept; Kopf-Chip und Reiter gleich.
//  T2  Dasselbe auf Englisch: „The Big Quest concept“ · „How to support your child“ · „Evaluations“.
//  T3  ⓘ an „So unterstützen Sie Ihr Kind“ und „Evaluations“ mit dem neuen Titel (DE/EN);
//      Verweis in ⓘ „Fokus“ nennt das Konzept mit neuem Titel.
//  T4  Die alten Titel stehen nirgends mehr in der App.
//   node --test tests/elternbereich-titel.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appLesen } from '../werkzeug/module.mjs';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'ABCD-EFGH', papa: 'PAPA-2345' };
const tag = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const txt = (de, en) => ({ de, en });
const SCHULE = { version: 1, kinder: { mia: { asOf: tag(-2), tasks: [
  { day: tag(-10), area: 'math', title: 'Rounding check', std: { 'M-N3': 'M' }, quests: ['round'], focusNext: [], good: txt('Runden gelingt.', 'Rounding works.'), next: txt('', '') },
] } } };

let browser, server;
before(async () => {
  server = await kontenServer({ users: [await konto('mia', 'student', C.mia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] })] }, { schule: SCHULE });
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); });

const NEU = {
  de: ['📖 Das Konzept von Big Quest', '🤝 So unterstützen Sie Ihr Kind', '🏫 Evaluations', '📄 Übungsblätter'],
  en: ['📖 The Big Quest concept', '🤝 How to support your child', '🏫 Evaluations', '📄 Practice sheets'],
};
const ALT = ['So funktioniert Big Quest', 'Ihr Kind unterstützen', 'Bewertungen der Schule – Verlauf', 'Einstufungen der Schule', 'How Big Quest works', 'Supporting your child', 'School evaluations – history'];

async function elternbereich(page) {
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'papa', C.papa); await passwortSetzen(page, 'Moon-Glass-Paper-8812');
  await page.waitForSelector('#parentClose');
}
const kapitel = (page) => page.$$eval('#aboutBody details.psec > summary', (s) => s.map((x) => x.textContent.trim()));
async function info(page, psec) {
  const d = page.locator(`details.psec[data-psec="${psec}"]`);
  if (!(await d.evaluate((e) => e.open))) await d.locator('> summary').click();
  await d.locator('h2 .info-btn').first().click();
  await page.waitForSelector('#helpDlg[open]');
  const t = (await page.textContent('#helpTitle')).trim();
  await page.locator('#helpClose').click();
  return t;
}

test('T1–T3 new titles in the grown-ups area, German and English, with the ⓘ help', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await elternbereich(page);
  assert.deepEqual(await kapitel(page), NEU.de);
  assert.equal((await page.textContent('[data-pconcept]')).trim(), NEU.de[0], '"Neu hier?" names the concept');
  assert.equal((await page.textContent('#aboutChip')).trim(), NEU.de[0]);
  assert.equal((await page.textContent('#tabInfo')).trim(), NEU.de[0]);
  assert.equal(await info(page, 'support'), 'So unterstützen Sie Ihr Kind');
  assert.equal(await info(page, 'school'), 'Evaluations');
  await page.locator('.phdr [data-plang="en"]').click();
  assert.deepEqual(await kapitel(page), NEU.en);
  assert.equal((await page.textContent('[data-pconcept]')).trim(), NEU.en[0]);
  assert.equal(await info(page, 'support'), 'How to support your child');
  assert.equal(await info(page, 'school'), 'Evaluations');
  const body = await page.locator('#aboutBody').innerText();
  for (const a of ALT) assert.ok(!body.includes(a), 'old title still shown: ' + a);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('T3 the focus help points to the concept under its new name; T4 no old title anywhere in the app', async () => {
  const html = (await appLesen()).toString('utf8');
  assert.ok(html.includes('„📖 Das Konzept von Big Quest → Wie die App einstuft“'));
  assert.ok(html.includes('“📖 The Big Quest concept → How the app judges”'));
  for (const a of ALT) assert.ok(!html.includes(a), 'old title still in index.html: ' + a);
});
