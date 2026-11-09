// Paket F1 (Konzept Elternbereich 7.0, 7.3, 7.6, 7.7): ? Hilfe, eine Fassung je Rolle.
//  T5 (Hilfe): jeder Verweis „⚙️ → …“ nennt einen Abschnitt, den es in ⚙ gibt, und öffnet ihn.
//  T7 (Hilfe): höchstens 2 000 Zeichen je Rolle.
//  T12 (Hilfe-Teil): die Sätze der Streichliste kommen nicht mehr vor (DE/EN).
//   node --test tests/elternbereich-f1.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'MIAA-2345', papa: 'PAPA-2345', frau: 'FRAU-2345', chef: 'CHEF-2345' };
const PW = { mia: 'Tiger-Lamp-River-4271', papa: 'Papa-Eltern-Test-1', frau: 'Lehrkraft-Test-22', chef: 'Admin-Test-Konto-3' };
let browser, server;
before(async () => {
  server = await kontenServer({ users: [await konto('mia', 'student', C.mia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] }), await konto('frau', 'teacher', C.frau), await konto('chef', 'parent', C.chef, { admin: true, kinder: ['mia'] })] });
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); });

const STREICHEN = [
  // Selbsterklärungen
  'So lesen Sie diese Seite', 'Was kann ich hier tun', 'Kurzanleitung', 'Quick guide', 'Im Elternbereich:', 'In the grown-ups area:', 'Für das Kind:', 'For your child:',
  // Technik
  'eigenen Speicher', 'own storage', 'in Vorbereitung', 'being prepared', 'Neue Versionen', 'new versions', 'kürzeres Passwort', 'shorter password',
  'Face ID', 'Touch ID', 'veränderte Datei', 'changed file', 'keinen Server', 'no server', 'Stufe 2', 'stage 2'
];

async function hilfe(page, wer) {
  if (await page.locator('#parentClose').count()) { await page.locator('#parentClose').click(); await page.waitForSelector('#home:not([hidden])'); }
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', wer, C[wer]); await passwortSetzen(page, PW[wer]);
  await page.waitForSelector('#parentClose');
  await page.locator('#pHelp').click(); await page.waitForSelector('#pHelpBack');
}
const text = (page) => page.locator('.phelp-view').innerText();

async function pruefen(page, rolle, links, oeffnen = links) {
  for (const lang of ['de', 'en']) {
    await page.locator(`.phdr [data-plang="${lang}"]`).click();
    await page.waitForFunction((l) => document.querySelector('.phelp-view')?.innerText.includes(l === 'de' ? 'Hilfe für' : 'Help for'), lang);
    const t = await text(page);
    assert.ok(t.length <= 2000, `${rolle} ${lang}: ${t.length} characters (at most 2 000)`);
    for (const w of STREICHEN) assert.ok(!t.includes(w), `${rolle} ${lang}: struck out: ${w}`);
    assert.deepEqual(await page.locator('.phelp-view a.pgo').evaluateAll((a) => a.map((x) => x.dataset.pgoto)), links, `${rolle} ${lang}: links into ⚙`);
  }
  await page.locator('.phdr [data-plang="de"]').click();
  // every link names a section of ⚙ and opens it
  for (const sec of oeffnen) {
    const label = (await page.locator(`.phelp-view a.pgo[data-pgoto="${sec}"]`).innerText()).match(/„(.+)“/)[1];
    await page.locator(`.phelp-view a.pgo[data-pgoto="${sec}"]`).click();
    await page.waitForSelector('#pSetBack');
    const open = page.locator('#aboutBody details.psec[open] > summary', { hasText: label });
    assert.equal(await open.count(), 1, `${rolle}: „${label}“ exists in ⚙ and is open`);
    await page.locator('#pHelp').click(); await page.waitForSelector('#pHelpBack');
  }
}

test('T5/T7/T12 help per role: short, links into ⚙ that exist and open, no struck-out sentences', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, PW.mia);
  await page.waitForSelector('#home:not([hidden])');
  await hilfe(page, 'papa');
  let t = await text(page);
  // 7.3: the seven points for parents, in this order
  const punkte = ['Einmal einrichten', 'Anmelden', 'Kind anmelden', 'Nachsehen', 'Sichern', 'Freigaben', 'Passwort vergessen'];
  assert.deepEqual(await page.locator('.phelp-view ol.steps > li > b:first-child').allInnerTexts(), punkte.map((p) => p + ':'));
  assert.match(t, /Danach abmelden/); assert.match(t, /Who's here\?/); assert.match(t, /5 Fehlversuchen 30 Sekunden/);
  await pruefen(page, 'parents', ['sicherung', 'freigaben']);
  await hilfe(page, 'frau');
  t = await text(page);
  assert.ok(!/Kind anmelden|Sichern:|Für den Admin/.test(t), 'teacher: only their points');
  await pruefen(page, 'teacher', []);
  await hilfe(page, 'chef');
  t = await text(page);
  assert.match(t, /Hilfe für Eltern[\s\S]*Für den Admin[\s\S]*🧪 Testkinder/);
  // backup/grants come from the parent help; the admin part explains the new administration chapter in words.
  await pruefen(page, 'admin', ['sicherung', 'freigaben'], []);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('T12 the struck-out self-explanations are gone from the whole app', async () => {
  const { ctx, page } = await oeffnen(browser, server);
  const html = await page.content();
  for (const w of ['So lesen Sie diese Seite', 'Was kann ich hier tun', 'folgt mit Stufe 2', 'follows with stage 2']) assert.ok(!html.includes(w), w);
  await ctx.close();
});
