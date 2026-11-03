// Paket F5 (Konzept Elternbereich 7.1, R10): Ihr Kind unterstützen.
//  „Unser Vorschlag“ oben (2–3 Runden pro Woche, je etwa 10 Minuten; Beleg in den Quellen), Link zur Kalender-
//  Erinnerung in ⚙ (öffnet „Für <Kind>“), fünf Regeln, die letzte verweist auf „💡 So helfen Sie“; nicht in „Auf einen
//  Blick“; Lehrkraft ohne Link. T17 für dieses Kapitel: keine Zeitwörter, kein Druck.
//   node --test tests/elternbereich-f5.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'ABCD-EFGH', papa: 'PAPA-2345', frau: 'TEAC-HER2' };
const tag = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
let browser, server;
before(async () => {
  server = await kontenServer({ users: [await konto('mia', 'student', C.mia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] }), await konto('frau', 'teacher', C.frau)] });
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); });

const ZEITWOERTER = ['fällig', 'Rückstand', 'verpasst', 'täglich', 'jeden Tag', 'overdue', 'behind', 'missed', 'every day', 'daily'];
async function kapitel(page) {
  const d = page.locator('#aboutBody details.psec[data-psec="support"]');
  if (!(await d.evaluate((x) => x.open))) await d.locator(':scope > summary').click();
  return d;
}

test('T17 supporting your child: our suggestion on top, link to the calendar reminder, five rules, no time words', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'papa', C.papa); await passwortSetzen(page, 'Moon-Glass-Paper-8812');
  await page.waitForSelector('#parentClose');
  for (const lang of ['de', 'en']) {
    await page.locator(`.phdr [data-plang="${lang}"]`).click();
    const d = await kapitel(page);
    const body = d.locator('.psec-body');
    const erstes = body.locator('> *:nth-child(2)');
    assert.equal(await erstes.getAttribute('class'), 'phow psuggest', `${lang}: the suggestion comes first, right under the title`);
    const v = await erstes.innerText();
    assert.match(v, lang === 'de' ? /Unser Vorschlag:.*2–3 Runden pro Woche, je etwa 10 Minuten.*Verteiltes Üben.*IES Practice Guide/s : /Our suggestion:.*2–3 rounds a week, about 10 minutes each.*Spaced practice.*IES Practice Guide/s);
    assert.equal(await body.locator('ol.steps > li').count(), 5, `${lang}: five rules`);
    assert.match(await body.locator('ol.steps > li').last().innerText(), lang === 'de' ? /💡 So helfen Sie/ : /💡 How you can help/);
    const t = await d.innerText();
    for (const w of ZEITWOERTER) assert.ok(!t.toLowerCase().includes(w.toLowerCase()), `${lang}: no time word: ${w}`);
    assert.ok(!t.includes(lang === 'de' ? 'keinen zweiten Weg' : 'don’t add a second method'), `${lang}: the core sentence stays in "Helping the way school does" only (T6)`);
    // not in "At a glance"
    assert.ok(!(await page.locator('#pGlance').count()) || !/Vorschlag|suggestion/.test(await page.locator('#pGlance').innerText()));
  }
  await page.locator('.phdr [data-plang="de"]').click();
  // the link opens ⚙ "For <child>" with the calendar reminder
  const d = await kapitel(page);
  const link = d.locator('a.pgo[data-pgoto="kind"]');
  assert.match(await link.innerText(), /⚙️ → „👧 Für mia“/);
  await link.click(); await page.waitForSelector('#pSetBack');
  assert.equal(await page.locator('#aboutBody details.psec[data-psec="settings"][open]').count(), 1);
  assert.match(await page.locator('#aboutBody details.psec[data-psec="settings"]').innerText(), /Freiwillige Kalender-Erinnerung/);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('a teacher with a grant sees the chapter without the link into ⚙', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  const id = server.konten.users.find((u) => u.user === 'mia').id, fid = server.konten.users.find((u) => u.user === 'frau').id, pid = server.konten.users.find((u) => u.user === 'papa').id;
  await page.evaluate(([id, g]) => localStorage.setItem('bq2_' + id + '__grants', JSON.stringify(g)), [id, [{ id: 'g1', grantee: fid, scope: ['learning'], from: tag(0), until: tag(10), by: pid }]]);
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'frau', C.frau); await passwortSetzen(page, 'Moon-Glass-Paper-8812');
  await page.waitForSelector('#parentClose');
  const d = await kapitel(page);
  assert.match(await d.innerText(), /Unser Vorschlag/);
  assert.equal(await d.locator('a.pgo').count(), 0, 'no link into ⚙ for the teacher');
  assert.deepEqual(fehler, []);
  await ctx.close();
});
