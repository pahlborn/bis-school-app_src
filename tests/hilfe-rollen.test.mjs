// Hilfe und Anleitung je Rolle (Peter, 02.11.): Kurzanleitung und ausfuehrliche Anleitung fuer Kind,
// Eltern, Lehrkraft und Admin; jede Rolle sieht nur ihre eigene.
//   node --test tests/hilfe-rollen.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'MIAA-2345', papa: 'PAPA-2345', frau: 'FRAU-2345', chef: 'CHEF-2345' };
const PW = { mia: 'Tiger-Lamp-River-4271', papa: 'Papa-Eltern-Test-1', frau: 'Lehrkraft-Test-22', chef: 'Admin-Test-Konto-3' };
const KONTEN = { users: [await konto('mia', 'student', C.mia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] }), await konto('frau', 'teacher', C.frau), await konto('chef', 'parent', C.chef, { admin: true })] };
let browser, server;
before(async () => { browser = await browserStarten(); server = await kontenServer(KONTEN); });
after(async () => { await browser?.close(); server?.close(); });

async function anleitung(page, wer) {
  if (await page.locator('#parentClose').count()) { await page.locator('#parentClose').click(); await page.waitForSelector('#home:not([hidden])'); }
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', wer, C[wer]); await passwortSetzen(page, PW[wer]);
  await page.waitForSelector('#parentClose');
  const d = page.locator('#aboutBody details.psec[data-psec="app"]');
  if (!(await d.evaluate((e) => e.open))) await d.locator('summary').first().click();
  return d.innerText();
}

test('Kind: Kurzanleitung und Anleitung, mit Who\'s here?, Startlink/QR, Merkpasswort; nichts fuer Erwachsene', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, PW.mia);
  await page.waitForSelector('#home:not([hidden])');
  await page.locator('#guideBtn').click();
  const t = await page.locator('#aboutBody').innerText();
  for (const s of ['Quick guide', "Who's here?", 'QR code', 'three words and a number', 'Show me how', 'Log out', 'only look if your parents allow it']) assert.ok(t.includes(s), s);
  for (const s of ['Kurzanleitung', 'Freigabe', 'Zugriff', 'Sicherung', 'For the admin', 'teachers']) assert.ok(!t.includes(s), 'not for the child: ' + s);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Eltern, Lehrkraft und Admin sehen je ihre eigene Anleitung (DE und EN)', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, PW.mia);
  await page.waitForSelector('#home:not([hidden])');
  const eltern = await anleitung(page, 'papa');
  for (const s of ['Kurzanleitung für Eltern', 'Meine Kinder', 'Zugriff & Freigaben', 'Sicherung', 'Who\'s here?', 'Startlink', 'Passwortspeicher']) assert.ok(eltern.includes(s), 'parents: ' + s);
  for (const s of ['Kurzanleitung für Lehrkräfte', 'Für den Admin']) assert.ok(!eltern.includes(s), 'parents not: ' + s);
  await page.locator('.phdr [data-plang="en"]').click();
  const parentsEn = await page.locator('#aboutBody details.psec[data-psec="app"]').innerText();
  assert.ok(parentsEn.includes('Quick guide for parents') && parentsEn.includes('Access & grants'));
  await page.locator('.phdr [data-plang="de"]').click();
  const lehrkraft = await anleitung(page, 'frau');
  for (const s of ['Kurzanleitung für Lehrkräfte', 'Einblick nur mit Freigabe', 'nicht für den dienstlichen Einsatz', 'Protokoll']) assert.ok(lehrkraft.includes(s), 'teacher: ' + s);
  for (const s of ['Kurzanleitung für Eltern', 'Kind anmelden', 'Für den Admin']) assert.ok(!lehrkraft.includes(s), 'teacher not: ' + s);
  const admin = await anleitung(page, 'chef');
  for (const s of ['Kurzanleitung für Eltern', 'Für den Admin', '🛠 Konten', '🧪 Testkind']) assert.ok(admin.includes(s), 'admin: ' + s);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Datenschutz im Konzept beschreibt Konten, Freigaben und Sicherung, nicht mehr die alte PIN', async () => {
  const { ctx, page } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, PW.mia);
  await page.waitForSelector('#home:not([hidden])');
  await anleitung(page, 'papa');
  const d = page.locator('#aboutBody details.psec[data-psec="concept"]');
  await d.locator('summary').first().click();
  const sec = d.locator('details.about-sec').filter({ has: page.locator('summary', { hasText: 'Datenschutz' }) }).first();
  await sec.locator('summary').first().click();
  const t = await sec.innerText();
  assert.match(t, /festen, zufälligen Kennung/); assert.match(t, /nur mit Freigabe der Eltern/); assert.match(t, /Sicherungsdatei/);
  assert.doesNotMatch(t, /PIN/);
  await ctx.close();
});
