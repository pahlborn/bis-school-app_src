// About as a menu with sub-pages (Peter, 30.10.): overview stays short; side notes,
// privacy and sources are their own pages. Real clicks and visibility checks.
//   node --test tests/about.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen } from './app-hilfen.mjs';

let browser, server;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

const MENUE = {
  '#tabDe': ['Grundidee', 'Leitgedanken', 'Aufbau', 'Lernlogik', 'Exkurs: Was passiert bei einer falschen Antwort?', 'Herkunft der Aufgaben', 'Datenschutz', 'Quellen'],
  '#tabEn': ['Idea', 'Guiding principles', 'How it works', 'Side note: what happens after a wrong answer?', 'Origin of the tasks', 'Privacy', 'Sources']
};

for (const [tab, titel] of Object.entries(MENUE)) {
  test(`About ${tab}: overview with menu; every topic opens as its own page and leads back`, async () => {
    const { ctx, page, fehler } = await appOeffnen(browser, server.url, { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
    await page.locator('#aboutBtn').click();
    await page.locator(tab).click();
    assert.deepEqual(await page.locator('#aboutBody .about-item span:first-child').allTextContents(), titel);
    const uebersicht = await page.textContent('#aboutBody');
    assert.ok(uebersicht.length < 2500, 'overview stays short: ' + uebersicht.length);
    assert.equal(await page.locator('#aboutBody h3').count(), 0, 'no topic text on the overview');
    for (const t of titel) {
      await page.locator('#aboutBody .about-item', { hasText: t }).click();
      assert.equal(await page.textContent('#aboutBody .about-sub-title'), t);
      const top = await page.$eval('#aboutUp', (b) => b.getBoundingClientRect().top);
      assert.ok(top >= 0 && top < 568, 'back button in view at the top');
      await page.locator('#aboutUp').click();
      assert.equal(await page.locator('#aboutBody .about-item').count(), titel.length);
    }
    assert.deepEqual(fehler, []);
    await ctx.close();
  });
}

test('side note explains the steps after a wrong answer, German and English', async () => {
  const { ctx, page } = await appOeffnen(browser, server.url);
  await page.locator('#aboutBtn').click();
  await page.locator('#aboutBody .about-item', { hasText: 'Exkurs' }).click();
  const de = await page.textContent('#aboutBody');
  for (const t of ['Erster Fehler', 'Zweiter Versuch richtig', 'Zweiter Versuch falsch', 'Brücke', 'Wiederholung', 'nach drei und nach sieben Tagen', 'Zeig mir, wie']) assert.ok(de.includes(t), t);
  assert.equal(await page.locator('#aboutBody ol.steps li').count(), 4);
  await page.locator('#tabEn').click();
  await page.locator('#aboutBody .about-item', { hasText: 'Side note' }).click();
  const en = await page.textContent('#aboutBody');
  for (const t of ['First mistake', 'Second try right', 'Second try wrong', 'bridge', 'Review', 'Show me how']) assert.ok(en.includes(t), t);
  await ctx.close();
});

test('switching the language tab returns to the overview', async () => {
  const { ctx, page } = await appOeffnen(browser, server.url);
  await page.locator('#aboutBtn').click();
  await page.locator('#aboutBody .about-item', { hasText: 'Datenschutz' }).click();
  await page.locator('#tabEn').click();
  assert.ok(await page.locator('#aboutBody .about-item').count() >= 7);
  await ctx.close();
});
