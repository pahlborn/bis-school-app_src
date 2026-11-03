// Paket B2 (Konzept Elternbereich 5.6, 5.7, 7.5): ? Hilfe als eigene Ansicht.
//  - ? öffnet die Anleitung der eigenen Rolle (unverändert) in einer eigenen Ansicht; das Kapitel in der Übersicht entfällt.
//  - Route #eltern/hilfe; Browser-Zurück und „← Zurück“ führen zur Übersicht; ⚙ ↔ ? stapelt keine Verlaufseinträge.
//  - Das Willkommen verweist auf ? und ⚙ (geprüft in tests/elternbereich-a1.test.mjs).
// Echte Klicks.
//   node --test tests/elternbereich-b2.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'ABCD-EFGH', papa: 'PAPA-2345', frau: 'TEAC-HER2' };
let browser, server;
before(async () => {
  server = await kontenServer({ users: [await konto('mia', 'student', C.mia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] }), await konto('frau', 'teacher', C.frau)] });
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); });

async function kindDann(page, wer) {
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', wer, C[wer]); await passwortSetzen(page, 'Moon-Glass-Paper-8812');
  await page.waitForSelector('#parentClose');
}
const hilfe = async (page) => { await page.locator('#pHelp').click(); await page.waitForSelector('#pHelpBack'); };
const weg = (page, sel) => page.waitForSelector(sel, { state: 'detached' });

test('B2 ? opens the guide of the own role in a view of its own; no guide chapter on the overview; language switch stays', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await kindDann(page, 'papa');
  assert.equal(await page.locator('#aboutBody details.psec[data-psec="app"]').count(), 0, 'no guide chapter on the overview');
  await hilfe(page);
  assert.match(await page.textContent('#aboutBody h2.psubjtitle'), /Hilfe/);
  const t = await page.locator('.phelp-view').innerText();
  assert.ok(t.includes('Hilfe für Eltern') && t.includes('Kind anmelden'), 'parents guide');
  assert.equal(await page.locator('.psubject, details.psec').count(), 0, 'nothing else in the help view');
  assert.equal(await page.getAttribute('#pHelp', 'aria-pressed'), 'true');
  assert.ok(await page.locator('.phdr #parentClose').isVisible(), 'log out stays in view');
  await page.locator('.phdr [data-plang="en"]').click();
  await page.waitForFunction(() => document.querySelector('.phelp-view')?.innerText.includes('Help for parents'));
  assert.match(await page.textContent('#pHelpBack'), /Back to the overview/);
  await page.locator('.phdr [data-plang="de"]').click();
  // teacher: own guide
  const l = await oeffnen(browser, server);
  await kindDann(l.page, 'frau');
  await hilfe(l.page);
  const lt = await l.page.locator('.phelp-view').innerText();
  assert.ok(lt.includes('Hilfe für Lehrkräfte') && !lt.includes('Hilfe für Eltern'), 'teacher guide');
  assert.deepEqual([...fehler, ...l.fehler], []);
  await ctx.close(); await l.ctx.close();
});

test('B2 routes: #eltern/hilfe, browser back, "← back", ? again; switching ⚙ ↔ ? does not pile up history; route survives the login', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await kindDann(page, 'papa');
  await page.evaluate(() => { location.hash = '#eltern/hilfe'; });
  await page.waitForSelector('#pHelpBack');
  await page.goBack(); await weg(page, '#pHelpBack');
  assert.ok(await page.locator('.psubject').count(), 'overview after browser back');
  // ? then "← back"; ? then ? again
  await hilfe(page); await page.locator('#pHelpBack').click(); await weg(page, '#pHelpBack');
  await hilfe(page); await page.locator('#pHelp').click(); await weg(page, '#pHelpBack');
  // ⚙ → ? → ⚙ → ?: one browser back leads to the overview
  await page.locator('#pSettings').click(); await page.waitForSelector('#pSetBack');
  await hilfe(page); assert.equal(await page.locator('#pSetBack').count(), 0);
  await page.locator('#pSettings').click(); await page.waitForSelector('#pSetBack');
  await hilfe(page);
  assert.equal(await page.evaluate(() => location.hash), '#eltern/hilfe');
  await page.goBack(); await weg(page, '#pHelpBack');
  assert.ok(await page.locator('.psubject').count(), 'one step back: overview');
  assert.equal(await page.locator('#pSetBack').count(), 0);
  // before the login: the help view after the login
  await page.locator('#parentClose').click(); await page.waitForSelector('#home:not([hidden])');
  await page.evaluate(() => { location.hash = '#eltern/hilfe'; });
  await page.waitForSelector('#loginUser');
  await page.locator('#loginUser').fill('papa'); await page.locator('#loginPw').fill('Moon-Glass-Paper-8812'); await page.locator('#loginGo').click();
  await page.waitForSelector('#pHelpBack');
  assert.deepEqual(fehler, []);
  await ctx.close();
});
