// S11 Stufe 1, Phase P0 (Charakterisierung): haelt das Verhalten VOR Stufe 1 fest, damit jede
// spaetere Aenderung bewusst ist. Tests, die eine Phase absichtlich aendert, werden dort umgestellt
// und in docs/pruefung begruendet (Befunde B1, B3; Speicher nach Namen; Schuldaten nach Namen).
//   node --test tests/stufe1-ist.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browserStarten, zustand, frageBeantworten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen, alleSchluessel } from './konten-hilfen.mjs';

const C = { mia: 'MIAA-2345', lia: 'LIAA-2345', papa: 'PAPA-2345', kathie: 'KATH-2345', fremd: 'FREM-2345' };
const KONTEN = { users: [
  await konto('mia', 'student', C.mia), await konto('lia', 'student', C.lia),
  await konto('papa', 'parent', C.papa, { kinder: ['mia'] }),
  // a different family whose child happens to have the name of the account in the school data
  await konto('kathie', 'student', C.kathie), await konto('fremd', 'parent', C.fremd, { kinder: ['kathie'] })
] };

let browser, server;
before(async () => { browser = await browserStarten(); server = await kontenServer(KONTEN); });
after(async () => { await browser?.close(); server?.close(); });

async function eineAntwort(page) {
  await page.locator('#todayBtn').click();
  await page.waitForSelector('#play:not([hidden])');
  const q = (await zustand(page)).round[0];
  await frageBeantworten(page, q);
}

test('Ist: erstes Kind speichert ohne Praefix, weitere Kinder mit Namen als Praefix; Geraeteschluessel ungeteilt', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'mond');
  await page.waitForSelector('#home:not([hidden])');
  await eineAntwort(page);
  let k = await alleSchluessel(page);
  assert.ok(k.includes('bq2_attempts'), 'first child: bq2_<key>');
  assert.ok(k.includes('bq2_pw_mia') && k.includes('bq2_session'), 'device keys by name');
  await page.evaluate(() => document.querySelector('#quitBtn')?.click());
  await page.evaluate(() => document.querySelector('#homeBtn')?.click());
  await page.waitForSelector('#home:not([hidden])');
  await page.locator('#logoutBtn').click();
  await anmelden(page, 'student', 'lia', C.lia); await passwortSetzen(page, 'lia1');
  await page.waitForSelector('#home:not([hidden])');
  await eineAntwort(page);
  k = await alleSchluessel(page);
  assert.ok(k.includes('bq2_lia__attempts'), 'other children: bq2_<user>__<key>');
  assert.ok(k.includes('bq2_pw_lia'));
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Ist (Befund B1): ein Elternteil sieht auf dem Geraet auch ein fremdes Kind', async () => {
  const { ctx, page } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'mond');
  await page.waitForSelector('#home:not([hidden])');
  await page.locator('#logoutBtn').click();
  await anmelden(page, 'student', 'lia', C.lia); await passwortSetzen(page, 'lia1');
  await page.waitForSelector('#home:not([hidden])');
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'papa', C.papa); await passwortSetzen(page, 'langes-passwort');
  await page.waitForSelector('#parentClose');
  const kinder = await page.$$eval('[data-pkid]', (b) => b.map((x) => x.dataset.pkid));
  assert.ok(kinder.includes('lia'), 'B1: lia is not papa\'s child but is offered (fixed in P3)');
  await ctx.close();
});

test('Ist: Schuldaten haengen am Anmeldenamen – ein fremdes Kind namens "kathie" bekaeme sie', async () => {
  const { ctx, page } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'kathie', C.kathie); await passwortSetzen(page, 'mond');
  await page.waitForSelector('#home:not([hidden])');
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'fremd', C.fremd); await passwortSetzen(page, 'langes-passwort');
  await page.waitForSelector('#parentClose');
  const schule = await page.evaluate(() => document.querySelector('#aboutBody details.psec[data-psec="school"]')?.textContent || '');
  assert.match(schule, /Standards|Standard/, 'school ratings shown by name (fixed in P2)');
  await ctx.close();
});
