// Echte App (Live-Bau): Wechselt die Person im Elternbereich, beginnt sie mit geschlossenen Kapiteln. Ein Kapitel, das die
// Person davor offen hatte, zaehlt nicht fuer die naechste als gelesen (Befund 3b-1c; Peter 04.11.: "live uebernehmen").
//   node --test tests/kapitel-person.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'MIAA-2345', papa: 'PAPA-2345', frau: 'FRAU-2345' };
const PW = { mia: 'Tiger-Lamp-River-4271', papa: 'Papa-Eltern-Test-1', frau: 'Lehrkraft-Test-22' };
const KONTEN = { users: [await konto('mia', 'student', C.mia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] }), await konto('frau', 'teacher', C.frau)] };
let browser, server;
before(async () => { browser = await browserStarten(); server = await kontenServer(KONTEN); });
after(async () => { await browser?.close(); server?.close(); });

async function erwachsen(page, wer, erstesMal = true) {
  if (await page.locator('#parentClose').count()) { await page.locator('#parentClose').click(); await page.waitForSelector('#home:not([hidden])'); }
  await page.locator('#adultBtn').click();
  if (erstesMal) { await anmelden(page, 'adult', wer, C[wer]); await passwortSetzen(page, PW[wer]); }
  else await anmelden(page, 'adult', wer, PW[wer]);
  await page.waitForSelector('#parentClose');
}
const gelesen = (page) => page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('bq2_conceptSeen') || '{}')));
const kapitelOffen = (page) => page.locator('#aboutBody details.psec[data-psec="concept"]').evaluate((d) => d.open);

test('Lehrkraft nach Elternteil am selben Geraet: "So funktioniert" ist zu und zaehlt nicht als gelesen', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, PW.mia);
  await page.waitForSelector('#home:not([hidden])');
  await erwachsen(page, 'papa');
  await page.locator('#aboutBody details.psec[data-psec="concept"] > summary').click();
  assert.equal(await kapitelOffen(page), true);
  await page.waitForFunction(() => Object.keys(JSON.parse(localStorage.getItem('bq2_conceptSeen') || '{}')).length === 1);
  assert.equal((await gelesen(page)).length, 1, 'papa has read it');
  await erwachsen(page, 'frau');
  await page.waitForTimeout(200);   // a "toggle" of an opened chapter would arrive asynchronously
  assert.equal(await kapitelOffen(page), false, 'the teacher starts with the chapter closed');
  assert.equal((await gelesen(page)).length, 1, 'only papa counts as having read it');
  await erwachsen(page, 'papa', false);
  assert.equal(await kapitelOffen(page), false, 'a new visit starts closed as well');
  assert.deepEqual(fehler, []);
  await ctx.close();
});
