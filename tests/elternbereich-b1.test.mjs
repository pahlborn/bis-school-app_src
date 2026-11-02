// Paket B1 (Konzept Elternbereich 5.1, 5.5, 5.7): Kopf und ⚙ Einstellungen.
//  T1 Kopf: Kind, Flaggen, ?, ⚙, Abmelden auch auf 320 px sichtbar; keine Version, kein Testkind-Knopf im Kopf.
//  T2 ⚙ zeigt je Rolle genau ihre Abschnitte; „Abmelden“ auch am Ende von ⚙.
//  T3 Routen #eltern/einstellungen[/abschnitt]; Browser-Zurück und „← Zurück“ führen zur Übersicht; ? öffnet die Anleitung.
// Echte Klicks.
//   node --test tests/elternbereich-b1.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'ABCD-EFGH', papa: 'PAPA-2345', frau: 'TEAC-HER2', chef: 'CHEF-2345', probe: 'TEST-2345' };
let browser, server;
before(async () => {
  server = await kontenServer({ users: [
    await konto('mia', 'student', C.mia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] }), await konto('frau', 'teacher', C.frau),
    await konto('chef', 'parent', C.chef, { admin: true }), await konto('probe', 'student', C.probe, { test: true })
  ] });
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); });

/** the child logs in on its device, then a grown-up opens the grown-ups area there */
async function kindDann(page, wer) {
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', wer, C[wer]); await passwortSetzen(page, 'Moon-Glass-Paper-8812');
  await page.waitForSelector('#parentClose');
}
const abschnitte = (page) => page.$$eval('#aboutBody details.psec', (d) => d.map((x) => x.dataset.psec));
async function einstellungen(page) { await page.locator('#pSettings').click(); await page.waitForSelector('#pSetBack'); }
const sichtbarImBild = (page, sel) => page.locator(sel).evaluate((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.left >= 0 && r.right <= window.innerWidth + 1; });

test('T1 header on 320 px: child, flags, ?, ⚙ and log out in view; no version and no test child button in the header', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server, { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  await kindDann(page, 'papa');
  for (const sel of ['#pKid', '.phdr [data-plang="de"]', '.phdr [data-plang="en"]', '#pHelp', '#pSettings', '#parentClose']) assert.ok(await sichtbarImBild(page, sel), 'in view: ' + sel);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true, 'no horizontal scrolling');
  assert.equal(await page.locator('.phdr #pVersion, .phdr #pPlayTest, .phdr .phdr-ver').count(), 0);
  assert.equal(await page.getAttribute('#pSettings', 'aria-label'), 'Einstellungen');
  assert.equal(await page.getAttribute('#pHelp', 'aria-label'), 'Hilfe');
  // the admin: no test child button in the header either (it is in ⚙ → Konten until B5)
  const b = await oeffnen(browser, server, { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  await anmelden(b.page, 'adult', 'chef', C.chef); await passwortSetzen(b.page, 'Moon-Glass-Paper-8812');
  await b.page.waitForSelector('#parentClose');
  assert.equal(await b.page.locator('.phdr #pPlayTest').count(), 0);
  await einstellungen(b.page);
  await b.page.locator('details.psec[data-psec="accounts"] > summary').click();
  assert.ok(await b.page.locator('#pPlayTest').isVisible(), 'test child in ⚙ → Konten');
  assert.deepEqual([...fehler, ...b.fehler], []);
  await ctx.close(); await b.ctx.close();
});

test('T2 ⚙ per role: parent, teacher, admin see exactly their sections; overview without them; version only in ⚙; log out at the end of ⚙', async () => {
  // parent
  const p = await oeffnen(browser, server);
  await kindDann(p.page, 'papa');
  const uebersicht = await abschnitte(p.page);
  for (const id of ['settings', 'backup', 'grants', 'accounts', 'aboutapp']) assert.ok(!uebersicht.includes(id), 'not on the overview: ' + id);
  assert.deepEqual(uebersicht, ['school', 'sheets', 'support', 'concept']);
  await einstellungen(p.page);
  assert.deepEqual(await abschnitte(p.page), ['settings', 'backup', 'grants', 'aboutapp'], 'parent');
  assert.equal((await p.page.textContent('details.psec[data-psec="settings"] > summary')).trim(), '👧 Für mia', 'names the child');
  assert.equal((await p.page.textContent('details.psec[data-psec="backup"] > summary')).trim(), '💾 Sicherung & Daten');
  assert.equal(await p.page.locator('.psubject').count(), 0, 'no overview inside ⚙');
  await p.page.locator('details.psec[data-psec="aboutapp"] > summary').click();
  assert.ok(await p.page.locator('#versionInfo').isVisible(), 'version in ⚙ → Über die App');
  assert.ok(await p.page.locator('#pSettings[aria-pressed="true"]').count(), '⚙ marked as open');
  // English
  await p.page.locator('.phdr [data-plang="en"]').click();
  assert.ok(await p.page.locator('#pSetBack').count(), 'stays in ⚙ when switching language');
  assert.equal((await p.page.textContent('details.psec[data-psec="settings"] > summary')).trim(), '👧 For mia');
  assert.match(await p.page.textContent('#pSetBack'), /Back to the overview/);
  await p.page.locator('.phdr [data-plang="de"]').click();
  // log out at the end of ⚙: like the header button
  await p.page.locator('#parentClose2').click();
  await p.page.waitForSelector('#home:not([hidden])');
  assert.equal(await p.page.evaluate(() => localStorage.getItem('bq2_adultSession')), null, 'grown-up logged out');
  assert.ok(!/einstellungen/.test(await p.page.evaluate(() => location.hash)), 'no route left behind');

  // teacher without a grant: only "about the app"
  const l = await oeffnen(browser, server);
  await kindDann(l.page, 'frau');
  await einstellungen(l.page);
  assert.deepEqual(await abschnitte(l.page), ['aboutapp'], 'teacher');
  // admin (not a parent, no grant): accounts and "about the app"
  const a = await oeffnen(browser, server);
  await kindDann(a.page, 'chef');
  await einstellungen(a.page);
  assert.deepEqual(await abschnitte(a.page), ['accounts', 'aboutapp'], 'admin');
  assert.deepEqual([...p.fehler, ...l.fehler, ...a.fehler], []);
  await p.ctx.close(); await l.ctx.close(); await a.ctx.close();
});

test('T3 routes: #eltern/einstellungen/<section> opens ⚙ with that section; browser back and "← back" lead to the overview; ? opens the guide', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await kindDann(page, 'papa');
  // a route straight to a section
  await page.evaluate(() => { location.hash = '#eltern/einstellungen/freigaben'; });
  await page.waitForSelector('#pSetBack');
  assert.ok(await page.locator('details.psec[data-psec="grants"]').evaluate((d) => d.open), 'grants open');
  // browser back: overview again
  await page.goBack();
  await page.waitForSelector('#pSetBack', { state: 'detached' });
  assert.ok(await page.locator('.psubject').count(), 'overview after browser back');
  // ⚙ with a click, then browser back
  await einstellungen(page);
  assert.equal(await page.evaluate(() => location.hash), '#eltern/einstellungen');
  await page.goBack();
  await page.waitForSelector('#pSetBack', { state: 'detached' });
  assert.ok(await page.locator('.psubject').count());
  // ⚙, then "← Zurück zur Übersicht"; ⚙ again closes it too
  await einstellungen(page);
  await page.locator('#pSetBack').click();
  await page.waitForSelector('#pSetBack', { state: 'detached' });
  await einstellungen(page);
  await page.locator('#pSettings').click();
  await page.waitForSelector('#pSetBack', { state: 'detached' });
  // from a subject page ⚙ opens settings, back leads to the overview
  await page.locator('[data-psubj="maths"]').first().click(); await page.waitForSelector('#pBack');
  await einstellungen(page);
  assert.equal(await page.locator('#pBack').count(), 0, 'no subject inside ⚙');
  await page.locator('#pSetBack').click(); await page.waitForSelector('#pSetBack', { state: 'detached' });
  // ? opens the help view (B2), also from ⚙
  await einstellungen(page);
  await page.locator('#pHelp').click();
  await page.waitForSelector('#pHelpBack');
  assert.equal(await page.locator('#pSetBack').count(), 0, '⚙ left');
  assert.ok(await page.locator('.phelp-view').isVisible(), 'guide open');
  // a route when not logged in: login first, then ⚙
  await page.locator('#parentClose').click(); await page.waitForSelector('#home:not([hidden])');
  await page.evaluate(() => { location.hash = '#eltern/einstellungen/sicherung'; });
  await page.waitForSelector('#loginUser');
  await page.locator('#loginUser').fill('papa'); await page.locator('#loginPw').fill('Moon-Glass-Paper-8812'); await page.locator('#loginGo').click();
  await page.waitForSelector('#pSetBack');
  assert.ok(await page.locator('details.psec[data-psec="backup"]').evaluate((d) => d.open), 'backup open after login');
  assert.deepEqual(fehler, []);
  await ctx.close();
});
