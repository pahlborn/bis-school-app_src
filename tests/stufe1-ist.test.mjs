// S11 Stufe 1, Phase P0 (Charakterisierung): haelt das Verhalten VOR Stufe 1 fest, damit jede
// spaetere Aenderung bewusst ist. Tests, die eine Phase absichtlich aendert, werden dort umgestellt
// und in docs/pruefung begruendet (Befunde B1, B3; Speicher nach Namen; Schuldaten nach Namen).
//   node --test tests/stufe1-ist.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browserStarten, zustand, frageBeantworten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen, alleSchluessel } from './konten-hilfen.mjs';
import { schuleLesen } from '../werkzeug/schule.mjs';

const C = { mia: 'MIAA-2345', lia: 'LIAA-2345', papa: 'PAPA-2345', kathie: 'KATH-2345', 'kathie.b': 'KATB-2345', fremd: 'FREM-2345', mama: 'MAMA-2345' };
const KONTEN = { users: [
  await konto('mia', 'student', C.mia), await konto('lia', 'student', C.lia),
  await konto('papa', 'parent', C.papa, { kinder: ['mia'] }),
  // two families whose children have the same first name (login names must differ: kathie / kathie.b)
  await konto('kathie', 'student', C.kathie), await konto('mama', 'parent', C.mama, { kinder: ['kathie'] }),
  await konto('kathie.b', 'student', C['kathie.b']), await konto('fremd', 'parent', C.fremd, { kinder: ['kathie.b'] })
] };

let browser, server;
before(async () => { browser = await browserStarten(); server = await kontenServer(KONTEN, { schule: await schuleLesen() }); });
after(async () => { await browser?.close(); server?.close(); });

async function eineAntwort(page) {
  await page.locator('#todayBtn').click();
  await page.waitForSelector('#play:not([hidden])');
  const q = (await zustand(page)).round[0];
  await frageBeantworten(page, q);
}

// P2 (02.11.): every child - also the first one - stores under its ID; before, the first child used
// bq2_<key> and every other one bq2_<user>__<key>.
test('Speicher nach Kennung: jedes Kind unter bq2_<Kennung>__, Passwort unter bq2_pw_<Kennung>', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'mond');
  await page.waitForSelector('#home:not([hidden])');
  await eineAntwort(page);
  const sid = async () => (await page.evaluate(() => JSON.parse(localStorage.getItem('bq2_session')))).id;
  let id = await sid(), k = await alleSchluessel(page);
  assert.match(id, /^p_/);
  assert.ok(k.includes('bq2_' + id + '__attempts') && !k.includes('bq2_attempts'), 'first child under its ID');
  assert.ok(k.includes('bq2_pw_' + id) && !k.includes('bq2_pw_mia'), 'password by ID');
  await page.evaluate(() => document.querySelector('#quitBtn')?.click());
  await page.evaluate(() => document.querySelector('#homeBtn')?.click());
  await page.waitForSelector('#home:not([hidden])');
  await page.locator('#logoutBtn').click();
  await anmelden(page, 'student', 'lia', C.lia); await passwortSetzen(page, 'lia1');
  await page.waitForSelector('#home:not([hidden])');
  await eineAntwort(page);
  id = await sid(); k = await alleSchluessel(page);
  assert.ok(k.includes('bq2_' + id + '__attempts') && !k.includes('bq2_lia__attempts'), 'other children under their ID');
  assert.ok(k.includes('bq2_pw_' + id));
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

// P2 (02.11.): school data are assigned by the account ID. Before, they hung on the name: any account
// called "kathie" would have received them.
test('Schuldaten haengen an der Kennung: nur das richtige Kind; ein anderes Kind mit gleichem Vornamen bekommt nichts', async () => {
  const schule = async (kind, eltern) => {
    const { ctx, page } = await oeffnen(browser, server);
    await anmelden(page, 'student', kind, C[kind]); await passwortSetzen(page, 'mond');
    await page.waitForSelector('#home:not([hidden])');
    await page.locator('#adultBtn').click();
    await anmelden(page, 'adult', eltern, C[eltern]); await passwortSetzen(page, 'langes-passwort');
    await page.waitForSelector('#parentClose');
    const t = await page.evaluate(() => document.querySelector('#aboutBody details.psec[data-psec="school"]')?.textContent || '');
    await ctx.close(); return t;
  };
  assert.match(await schule('kathie', 'mama'), /Milestone/, 'the right child');
  assert.doesNotMatch(await schule('kathie.b', 'fremd'), /Milestone/, 'another child with the same first name');
});