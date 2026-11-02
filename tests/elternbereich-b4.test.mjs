// Paket B4 (Konzept Elternbereich 5.3, R4, R10): Übersicht aufräumen.
//  T4  Hinweise: Datenumzug nur bei Fehler als Warnzeile, „Erneut versuchen“ nur in ⚙; „Neu hier?“ bis zum ersten Öffnen, je Erwachsenem.
//  T8  Kapitelreihenfolge: So funktioniert · Ihr Kind unterstützen · Einstufungen der Schule · Übungsblätter.
//  T18 Sicherungs-Hinweis nur nach neuer Übung und wenn die letzte Sicherung fehlt oder älter als 30 Tage ist.
//  Außerdem: kein „So lesen Sie diese Seite“, Farblegende in einer Zeile.
// Echte Klicks.
//   node --test tests/elternbereich-b4.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'ABCD-EFGH', papa: 'PAPA-2345', mama: 'MAMA-2345' };
let browser, server;
before(async () => {
  server = await kontenServer({ users: [await konto('mia', 'student', C.mia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] }), await konto('mama', 'parent', C.mama, { kinder: ['mia'] })] });
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); });

const ID = (n) => server.konten.users.find((u) => u.user === n).id;
const NS = () => 'bq2_' + ID('mia') + '__';
const tag = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
async function kind(page) {
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
}
async function erwachsen(page, wer, erstesMal = true) {
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', wer, erstesMal ? C[wer] : 'Moon-Glass-Paper-8812');
  if (erstesMal) await passwortSetzen(page, 'Moon-Glass-Paper-8812');
  await page.waitForSelector('#parentClose');
}
async function abmelden(page) { await page.locator('#parentClose').click(); await page.waitForSelector('#home:not([hidden])'); }
/** set the child's data, then render the overview again (language there and back) */
async function setzen(page, daten) {
  await page.evaluate(([ns, d]) => { for (const [k, v] of Object.entries(d)) { if (v === null) localStorage.removeItem(ns + k); else localStorage.setItem(ns + k, JSON.stringify(v)); } }, [NS(), daten]);
  await page.locator('.phdr [data-plang="en"]').click(); await page.locator('.phdr [data-plang="de"]').click();
}
const versuch = (day) => ({ day, skill: 'round', level: 2, attempt: 1, ok: true, help: false });

test('T8 chapter order, no "how to read", colours in one line', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await kind(page); await erwachsen(page, 'papa');
  assert.deepEqual(await page.$$eval('#aboutBody details.psec', (d) => d.map((x) => x.dataset.psec)), ['concept', 'support', 'school', 'sheets']);
  const t = await page.textContent('#aboutBody');
  assert.ok(!t.includes('So lesen Sie diese Seite') && !t.includes('Was bedeuten die Farben?'));
  assert.equal(await page.locator('#aboutBody .pleg-line').count(), 1);
  assert.equal(await page.locator('#aboutBody .pleg-line .pleg').count(), 5);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('T18 backup note only after new practice and when the last backup is missing or older than 30 days', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await kind(page); await erwachsen(page, 'papa');
  const hinweis = async () => ((await page.locator('.pbackup-note').count()) ? (await page.textContent('.pbackup-note')).trim() : null);
  const faelle = [
    ['no practice, never backed up', { attempts: [], lastBackup: null }, null],
    ['practice, never backed up', { attempts: [versuch(tag(-1))], lastBackup: null }, /Noch nie gesichert/],
    ['backup 40 days ago, no practice since', { attempts: [versuch(tag(-45))], lastBackup: tag(-40) }, null],
    ['backup 40 days ago, practice yesterday', { attempts: [versuch(tag(-45)), versuch(tag(-1))], lastBackup: tag(-40) }, /Neue Übungen seit der letzten Sicherung/],
    ['backup 10 days ago, practice yesterday', { attempts: [versuch(tag(-1))], lastBackup: tag(-10) }, null],
    ['backup 40 days ago, entered sheet yesterday', { attempts: [versuch(tag(-45))], lastBackup: tag(-40), sheets: [{ id: 's1', day: tag(-1), items: [{ q: 'x', res: 'self' }] }] }, /Neue Übungen/]
  ];
  for (const [name, daten, soll] of faelle) {
    await setzen(page, daten);
    const h = await hinweis();
    if (soll) assert.match(h || '', soll, name); else assert.equal(h, null, name);
    if (soll) assert.equal(await page.locator('.pbackup-note [data-backup]').count(), 1, name + ': with "back up now"');
  }
  assert.ok(!(await page.textContent('#aboutBody')).includes('Letzte Sicherung'), 'no permanent "last backup" line on the overview');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('T4 data move: warning line only on failure, "try again" only in ⚙; "new here?" until opened, per grown-up', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await kind(page);
  // a failed move on this device
  await page.evaluate(() => localStorage.setItem('bq2_migr', JSON.stringify({ ok: false, at: new Date().toISOString(), audio: 'ok' })));
  await erwachsen(page, 'papa');
  assert.match(await page.textContent('.pmigr-line'), /Datenumzug nicht abgeschlossen/);
  assert.equal(await page.locator('#aboutBody [data-migrretry]').count(), 0, 'no "try again" on the overview');
  await page.locator('.pmigr-line [data-pgoto="sicherung"]').click();
  await page.waitForSelector('#pSetBack');
  assert.ok(await page.locator('details.psec[data-psec="backup"] [data-migrretry]').isVisible(), '"try again" in ⚙ → backup & data');
  await page.locator('#pSetBack').click(); await page.waitForSelector('#pSetBack', { state: 'detached' });
  // move fine: no line
  await page.evaluate(() => localStorage.setItem('bq2_migr', JSON.stringify({ ok: true, at: new Date().toISOString(), audio: 'ok' })));
  await page.locator('.phdr [data-plang="en"]').click(); await page.locator('.phdr [data-plang="de"]').click();
  assert.equal(await page.locator('.pmigr-line, .pmigr-note').count(), 0);

  // "new here?": shown at first, gone after opening, stays gone after a new login
  assert.match(await page.textContent('.pnew-note'), /Neu hier\?/);
  await page.locator('.pnew-note [data-pconcept]').click();
  await page.waitForSelector('.pnew-note', { state: 'detached' });
  assert.ok(await page.locator('details.psec[data-psec="concept"]').evaluate((d) => d.open), 'chapter opened');
  await abmelden(page); await erwachsen(page, 'papa', false);
  assert.equal(await page.locator('.pnew-note').count(), 0, 'gone for papa on this device');
  await abmelden(page);
  // another grown-up on the same device sees it; opening the chapter by its title also counts
  await erwachsen(page, 'mama');
  assert.equal(await page.locator('.pnew-note').count(), 1, 'mama sees it');
  await page.locator('details.psec[data-psec="concept"] > summary').click();
  await page.locator('.phdr [data-plang="en"]').click();
  assert.equal(await page.locator('.pnew-note').count(), 0, 'gone after opening the chapter');
  assert.deepEqual(fehler, []);
  await ctx.close();
});
