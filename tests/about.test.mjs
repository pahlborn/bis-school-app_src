// "So funktioniert Big Quest" (Peter, 30./31.10.): intro on top, every topic opens in place
// (accordion), language via flags. Real clicks and visibility checks.
//   node --test tests/about.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, aboutAbschnitt } from './app-hilfen.mjs';

let browser, server;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

const MENUE = {
  '#tabDe': ['Anleitung für Erwachsene', 'How to use Big Quest (für Kinder)', 'Grundidee', 'Leitgedanken', 'Aufbau', 'Lernlogik', 'Exkurs: Was passiert bei einer falschen Antwort?', 'Helfen wie die Schule', 'Wie die App einstuft – Titel, Lernbaum, Abzeichen und Stand', 'Herkunft der Aufgaben', 'Datenschutz', 'Quellen'],
  '#tabEn': ['Guide for grown-ups', 'How to use Big Quest', 'Idea', 'Guiding principles', 'How it works', 'Side note: what happens after a wrong answer?', 'Helping the way school does', 'How the app judges – titles, learning tree, badges and level', 'Origin of the tasks', 'Privacy', 'Sources']
};
const titel = (page) => page.$$eval('#aboutBody details.about-sec > summary', (s) => s.map((x) => x.textContent.trim()));

for (const [flagge, liste] of Object.entries(MENUE)) {
  test(`About ${flagge}: topics as accordions; each opens in place, in view, and closes again`, async () => {
    const { ctx, page, fehler } = await appOeffnen(browser, server.url, { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
    await page.locator('#aboutBtn').click();
    await page.locator(flagge).click();
    assert.ok(await page.locator(flagge).evaluate((b) => b.classList.contains('on')), 'chosen flag marked');
    assert.deepEqual(await titel(page), liste);
    assert.equal(await page.locator('#aboutBody details.about-sec[open]').count(), 0, 'all closed at the start');
    for (const t of liste) {
      const d = await aboutAbschnitt(page, t);
      const body = d.locator('.about-sec-body');
      assert.ok(await body.isVisible(), 'text visible: ' + t);
      assert.ok((await body.textContent()).trim().length > 40, 'text present: ' + t);
      await d.locator('summary').first().click();
      assert.equal(await d.evaluate((e) => e.open), false, 'closes again: ' + t);
    }
    // no page change: the title bar stays the same and there is no sub-page
    assert.equal(await page.locator('#aboutUp').count(), 0);
    assert.deepEqual(fehler, []);
    await ctx.close();
  });
}

test('the info pages have one clear title, not several "About the app"', async () => {
  const { ctx, page } = await appOeffnen(browser, server.url);
  await page.locator('#aboutBtn').click();
  assert.equal((await page.textContent('#aboutChip')).trim(), '📖 So funktioniert Big Quest');
  const alles = await page.textContent('#about');
  assert.ok(!/About the app|Über die App/.test(alles), 'no "About the app" left');
  assert.equal((await page.locator('#aboutChip').isVisible()) && (await page.locator('#tabInfo').isVisible()), false, 'title shown once, not as chip and tab');
  assert.equal(await page.locator('#tabDe svg').count(), 1, 'flag as a picture (emoji flags are letters on Windows)');
  await page.locator('#tabEn').click();
  assert.equal((await page.textContent('#aboutChip')).trim(), '📖 How Big Quest works');
  await ctx.close();
});

test('side note explains the steps after a wrong answer, German and English', async () => {
  const { ctx, page } = await appOeffnen(browser, server.url);
  await page.locator('#aboutBtn').click();
  await page.locator('#tabDe').click();
  const d = await aboutAbschnitt(page, 'Exkurs');
  const de = await d.textContent();
  for (const t of ['Erster Fehler', 'Zweiter Versuch richtig', 'Zweiter Versuch falsch', 'Brücke', 'Wiederholung', 'nach drei und nach sieben Tagen', 'Zeig mir, wie']) assert.ok(de.includes(t), t);
  assert.equal(await d.locator('ol.steps li').count(), 4);
  await page.locator('#tabEn').click();
  const e = await aboutAbschnitt(page, 'Side note');
  const en = await e.textContent();
  for (const t of ['First mistake', 'Second try right', 'Second try wrong', 'bridge', 'Review', 'Show me how']) assert.ok(en.includes(t), t);
  await ctx.close();
});

test('the language choice is kept (flags) and switching shows the topics in the other language', async () => {
  const { ctx, page } = await appOeffnen(browser, server.url);
  await page.locator('#aboutBtn').click();
  await page.locator('#tabEn').click();
  await page.locator('#aboutBack').click();
  await page.locator('#aboutBtn').click();
  assert.deepEqual(await titel(page), MENUE['#tabEn']);
  await page.locator('#tabDe').click();
  assert.deepEqual(await titel(page), MENUE['#tabDe']);
  await ctx.close();
});

test('the concept explains how titles, tree, badges and levels are worked out (Peter, 01.11.)', async () => {
  const { ctx, page } = await appOeffnen(browser, server.url);
  await page.locator('#aboutBtn').click();
  await page.locator('#tabDe').click();
  const d = await aboutAbschnitt(page, 'Wie die App einstuft');
  const t = await d.textContent();
  for (const w of ['Explorer ab 0', 'Investigator ab 25', 'Scientist ab 60', 'Professor ab 120', 'Legend ab 250', '1, 3, 6, 10, 15 und 25 Tagen', 'Silber ab 5-mal', 'mindestens 80 %', '8 ersten Versuchen an mindestens 3 Tagen', '15 Prozentpunkte', '1, 3 und 7 Tagen']) assert.ok(t.includes(w), w);
  assert.ok(!/Requires support|Consolidating|Meeting expectations|Extending/.test(t), 'no school terms on a child-reachable page');
  await ctx.close();
});
