// Paket B5 (Konzept Elternbereich 5.1, 5.2, 5.9): Kinderauswahl und Testkinder.
//  - Ab zwei Kindern eine Auswahlliste; Testkinder in einer eigenen Gruppe am Ende.
//  - T10: Testkinder nur im Admin-Konto, dort alle und auch ohne Daten auf dem Gerät; nie bei Eltern, Lehrkraft, Freigabe
//    (auch nicht im Seitentext). „▶ Als Testkind spielen“ spielt das gewählte Testkind.
// Echte Klicks.
//   node --test tests/elternbereich-b5.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'ABCD-EFGH', tim: 'TIMM-2345', papa: 'PAPA-2345', frau: 'TEAC-HER2', chef: 'CHEF-2345', probe: 'TEST-2345', probe2: 'TEST-6789' };
let browser, server;
before(async () => {
  server = await kontenServer({ users: [
    await konto('mia', 'student', C.mia), await konto('tim', 'student', C.tim),
    await konto('papa', 'parent', C.papa, { kinder: ['mia', 'tim'] }), await konto('frau', 'teacher', C.frau),
    await konto('chef', 'parent', C.chef, { admin: true }),
    await konto('probe', 'student', C.probe, { test: true }), await konto('probe2', 'student', C.probe2, { test: true })
  ] });
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); });

const ID = (n) => server.konten.users.find((u) => u.user === n).id;
const tag = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
async function erwachsen(page, wer) {
  if (await page.locator('#adultBtn').isVisible().catch(() => false)) await page.locator('#adultBtn').click();
  else if (await page.locator('#roleAdult').count()) await page.locator('#roleAdult').click();
  await anmelden(page, 'adult', wer, C[wer]); await passwortSetzen(page, 'Moon-Glass-Paper-8812');
  await page.waitForSelector('#parentClose');
}
async function kinderMitDaten(page) {
  for (const k of ['mia', 'tim']) {
    await anmelden(page, 'student', k, C[k]); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
    await page.waitForSelector('#home:not([hidden])');
    await page.evaluate(([id, d]) => localStorage.setItem('bq2_' + id + '__attempts', JSON.stringify([{ day: d, skill: 'round', level: 2, attempt: 1, ok: true, help: false }])), [ID(k), tag(-1)]);
    if (k === 'tim') break;
    await page.locator('#logoutBtn').click();
  }
}
const optionen = (page) => page.$$eval('#pKidSel option', (o) => o.map((x) => ({ v: x.value, gruppe: x.parentElement.tagName === 'OPTGROUP' ? x.parentElement.label : null })));

test('T10 admin on a fresh device: all test children in the list (own group, no data needed); play the chosen one; 320 px', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server, { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true });
  await erwachsen(page, 'chef');
  assert.deepEqual(await optionen(page), [{ v: 'probe', gruppe: '🧪 Testkinder' }, { v: 'probe2', gruppe: '🧪 Testkinder' }]);
  assert.ok(await page.locator('#pKidSel').evaluate((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right <= innerWidth + 1; }), 'list in view on 320 px');
  assert.match(await page.textContent('.phdr-test'), /Testdaten/);
  // choose the second test child and play it
  await page.selectOption('#pKidSel', 'probe2');
  await page.waitForFunction(() => document.querySelector('#pKidSel')?.value === 'probe2');
  await page.locator('.phdr-test #pPlayTest').click();
  await page.waitForSelector('#home:not([hidden])');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('bq2_session')).user), 'probe2', 'the chosen test child plays');
  await page.locator('#testBack').click(); await page.waitForSelector('#parentClose');
  assert.equal(await page.$eval('#pKidSel', (s) => s.value), 'probe2');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('T10 admin with a grant: real child first, test children in their group; parents and teachers never see a test child', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await kinderMitDaten(page);
  // papa: his two children in the list, no test child anywhere
  await erwachsen(page, 'papa');
  assert.deepEqual(await optionen(page), [{ v: 'mia', gruppe: null }, { v: 'tim', gruppe: null }], 'parent');
  assert.equal(await page.locator('optgroup').count(), 0);
  assert.equal(await page.locator('.phdr-test, #pPlayTest').count(), 0);
  for (const view of [null, '#pSettings', '#pHelp']) {
    if (view) { await page.locator(view).click(); await page.waitForSelector(view === '#pSettings' ? '#pSetBack' : '#pHelpBack'); }
    const t = await page.textContent('#about');
    assert.ok(!t.includes('probe'), 'no test child name for the parent: ' + (view || 'overview'));
  }
  await page.locator('#parentClose').click(); await page.waitForSelector('#home:not([hidden])');
  // grants for mia (to frau and to chef)
  await page.evaluate(([id, gs]) => localStorage.setItem('bq2_' + id + '__grants', JSON.stringify(gs)), [ID('mia'), ['frau', 'chef'].map((w) => ({ id: 'g-' + w, grantee: ID(w), scope: ['learning'], from: tag(0), until: tag(10), by: ID('papa') }))]);
  // teacher with a grant: only mia, never a test child
  await erwachsen(page, 'frau');
  assert.equal(await page.locator('#pKidSel').count(), 0, 'one child: no list');
  assert.match(await page.textContent('#pKid'), /mia/);
  assert.ok(!(await page.textContent('#about')).includes('probe'), 'teacher sees no test child');
  await page.locator('#parentClose').click(); await page.waitForSelector('#home:not([hidden])');
  // admin with a grant: mia first, then the test children
  await erwachsen(page, 'chef');
  assert.deepEqual(await optionen(page), [{ v: 'mia', gruppe: null }, { v: 'probe', gruppe: '🧪 Testkinder' }, { v: 'probe2', gruppe: '🧪 Testkinder' }], 'admin');
  assert.equal(await page.locator('.phdr-test').count(), 0, 'real child shown first: no test row');
  await page.selectOption('#pKidSel', 'probe');
  await page.waitForSelector('.phdr-test #pPlayTest');
  assert.deepEqual(fehler, []);
  await ctx.close();
});
