// "Das Konzept von Big Quest" (Peter, 30./31.10.; title 05.11.): intro on top, every topic opens in place
// (accordion), language via flags. Real clicks and visibility checks.
//   node --test tests/about.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, aboutAbschnitt } from './app-hilfen.mjs';

let browser, server;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

const MENUE = {
  '#tabDe': ['Anleitung für Erwachsene', 'How to use Big Quest (für Kinder)', 'Grundidee', 'Aufbau', 'So lernt das Kind', 'Helfen wie die Schule', 'Wie Big Quest einstuft', 'Herkunft der Aufgaben', 'Datenschutz', 'Quellen'],
  '#tabEn': ['Guide for grown-ups', 'How to use Big Quest', 'Core idea', 'Structure', 'How your child learns', 'Helping the way school does', 'How Big Quest judges', 'Origin of the tasks', 'Privacy', 'Sources']
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
  assert.equal((await page.textContent('#aboutChip')).trim(), '📖 Das Konzept von Big Quest');
  const alles = await page.textContent('#about');
  assert.ok(!/About the app|Über die App/.test(alles), 'no "About the app" left');
  assert.equal((await page.locator('#aboutChip').isVisible()) && (await page.locator('#tabInfo').isVisible()), false, 'title shown once, not as chip and tab');
  assert.equal(await page.locator('#tabDe svg').count(), 1, 'flag as a picture (emoji flags are letters on Windows)');
  await page.locator('#tabEn').click();
  assert.equal((await page.textContent('#aboutChip')).trim(), '📖 The Big Quest concept');
  await ctx.close();
});

test('"How your child learns" explains the steps after a wrong answer, German and English (F2)', async () => {
  const { ctx, page } = await appOeffnen(browser, server.url);
  await page.locator('#aboutBtn').click();
  await page.locator('#tabDe').click();
  const d = await aboutAbschnitt(page, 'So lernt das Kind');
  const de = await d.textContent();
  for (const t of ['Hinweis', 'Zweiter Versuch richtig', 'Zweiter Versuch falsch', 'Brücke', 'Wiederholung', 'nach 1, 3 und 7 Tagen', 'Zeig mir, wie']) assert.ok(de.includes(t), t);
  assert.equal(await d.locator('ol.steps li').count(), 4);
  await page.locator('#tabEn').click();
  const e = await aboutAbschnitt(page, 'How your child learns');
  const en = await e.textContent();
  for (const t of ['Hint', 'Second try right', 'Second try wrong', 'Bridge', 'Review', 'after 1, 3 and 7 days', 'Show me how']) assert.ok(en.includes(t), t);
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
  const d = await aboutAbschnitt(page, 'Wie Big Quest einstuft');
  const t = await d.textContent();
  for (const w of ['Explorer ist der Start', 'Investigator: 3 sichere Quests', 'Scientist: 6 aus mindestens 2 Fächern', 'Professor: 12 aus 4 Fächern, davon 2 auf E', 'Legend: 18 aus 5 Fächern, davon 5 auf E', 'Sterne entscheiden keinen Titel mehr', 'Ein Ast je Fach entsteht durch die erste sichere Quest', 'Silber ab 5-mal', 'mindestens 80 %', '15 Prozentpunkte']) assert.ok(t.includes(w), w);
  assert.match(t,/jede weitere gibt ein Blatt.*E gibt eine Frucht.*gelöstes Neuland eine Blüte \(kein Könnensnachweis\)/s);
  assert.match(t,/Gewachsenes bleibt, auch nach Rückfall oder Pause/);
  assert.ok(!t.includes('1, 3, 6, 10, 15 und 25 Tagen'),'the old day-growth rule is absent');
  assert.match(t,/derselbe Quest-Stand, ohne zusätzliche Mengen- oder Tageshürde/);
  assert.match(t,/Bei weniger als 6 eigenen Antworten[\s\S]*letzte vorhandene Schuleinstufung/,'school fallback remains part of the common stand');
  assert.match(t,/ab 8 „erste Belege“, ab 20 „breitere Belege“/,'8/20 describe evidence quantity');
  assert.ok(!t.includes('8 ersten Versuchen an mindestens 3 Tagen'),'no old parent knowledge/day veto');
  assert.ok(!t.includes('1, 3 und 7 Tagen'), 'the review rule is in "So lernt das Kind" only (F2)');
  for (const term of ['Requires support (RS)', 'Consolidating (C)', 'Meeting expectations (M)', 'Extending (E)'])
    assert.ok(t.includes(term), 'the explanation keeps the original school level with its code');
  await ctx.close();
});
