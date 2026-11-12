// S9 phase 4 (30.10.): the title chip gets a symbol and colour, one celebration per new title,
// and a path of all five titles. Titles grow with stars only and never go down.
//   node --test tests/titel.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen } from './app-hilfen.mjs';

let browser, server;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

const TITEL = [[0, '🧭', 'Explorer'], [25, '🔍', 'Investigator'], [60, '🔬', 'Scientist'], [120, '🎓', 'Professor'], [250, '🌟', 'Legend']];
const VERBOTEN = /\b(level|rank|grade|score|better|best|Requires|Consolidating|Meeting|Extending)\b/i;

async function mitDaten(daten, kontext = {}) {
  const a = await appOeffnen(browser, server.url, kontext);
  await a.page.evaluate((d) => { for (const [k, v] of Object.entries(d)) localStorage.setItem('bq2_' + k, JSON.stringify(v)); }, daten);
  await a.page.reload(); await a.page.waitForSelector('#home h1');
  return a;
}
const lies = (page, k) => page.evaluate((key) => JSON.parse(localStorage.getItem('bq2_' + key)), k);
const feiern = (page) => page.evaluate(() => +(document.querySelector('#confetti').dataset.runs || 0));
const kontrast = (page) => page.$eval('#rank', (e) => {
  const rgb = (s) => s.match(/\d+/g).slice(0, 3).map(Number);
  const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const s = getComputedStyle(e), a = lum(rgb(s.color)), b = lum(rgb(s.backgroundColor));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
});

for (const [sterne, symbol, name] of TITEL) {
  test(`${sterne} stars: chip shows ${symbol} ${name} with readable contrast`, async () => {
    const { ctx, page, fehler } = await mitDaten({ total: sterne, rankSeen: name });
    assert.equal(await page.textContent('#rankIcon'), symbol);
    assert.equal(await page.textContent('#rankName'), name);
    assert.ok(await kontrast(page) >= 4.5, 'contrast ' + await kontrast(page));
    assert.deepEqual(fehler, []);
    await ctx.close();
  });
}

test('new title: exactly one celebration and one line; reload does not celebrate again', async () => {
  const { ctx, page, fehler } = await mitDaten({ total: 25, rankSeen: 'Explorer' });
  await page.waitForTimeout(400);
  assert.equal(await feiern(page), 1);
  assert.equal(await page.locator('#rankNote:visible').count(), 1);
  assert.equal(await page.textContent('#rankNote'), 'New title: 🔍 Investigator!');
  assert.equal(await lies(page, 'rankSeen'), 'Investigator');
  await page.reload(); await page.waitForSelector('#home h1'); await page.waitForTimeout(400);
  assert.equal(await feiern(page), 0);
  assert.equal(await page.isVisible('#rankNote'), false);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('first start with many stars: title remembered quietly, no celebration', async () => {
  const { ctx, page } = await mitDaten({ total: 130 });
  await page.evaluate(() => localStorage.removeItem('bq2_rankSeen'));
  await page.reload(); await page.waitForSelector('#home h1'); await page.waitForTimeout(400);
  assert.equal(await feiern(page), 0);
  assert.equal(await page.isVisible('#rankNote'), false);
  assert.equal(await lies(page, 'rankSeen'), 'Professor');
  await ctx.close();
});

test('jump over several titles: one celebration for the highest', async () => {
  const { ctx, page } = await mitDaten({ total: 130, rankSeen: 'Investigator' });
  await page.waitForTimeout(400);
  assert.equal(await feiern(page), 1);
  assert.equal(await page.textContent('#rankNote'), 'New title: 🎓 Professor!');
  await ctx.close();
});

test('title never goes down', async () => {
  const { ctx, page } = await mitDaten({ total: 30, rankSeen: 'Scientist' });
  assert.equal(await page.textContent('#rankName'), 'Scientist');
  await ctx.close();
});

test('reduced motion: no confetti, the line still appears', async () => {
  const { ctx, page } = await mitDaten({ total: 60, rankSeen: 'Investigator' }, { reducedMotion: 'reduce' });
  await page.waitForTimeout(400);
  assert.equal(await feiern(page), 0);
  assert.equal(await page.textContent('#rankNote'), 'New title: 🔬 Scientist!');
  await ctx.close();
});

for (const [sterne, satz] of [[13, '12 more stars to Investigator'], [59, '1 more star to Scientist'], [250, 'You are a Legend! Keep exploring.']]) {
  test(`explorer path with ${sterne} stars (real click, fully on a 320 px phone): "${satz}"`, async () => {
    const { ctx, page, fehler } = await mitDaten({ total: sterne, rankSeen: TITEL.filter((t) => sterne >= t[0]).pop()[2] }, { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true });
    await page.locator('#rank').click();
    assert.deepEqual(await page.$$eval('#rankPath li', (l) => l.map((x) => x.children[1].textContent)), TITEL.map((t) => t[2]));
    assert.equal(await page.textContent('#rankNext'), satz);
    const imBild = await page.$eval('#rankDlg', (d) => { const r = d.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && d.scrollWidth <= d.clientWidth; });
    assert.ok(imBild, 'path fully on screen');
    const text = await page.textContent('#rankDlg') + await page.textContent('#rank');
    assert.ok(!VERBOTEN.test(text), text);
    await page.locator('#rankClose').click();
    assert.equal(await page.isVisible('#rankDlg'), false);
    assert.deepEqual(fehler, []);
    await ctx.close();
  });
}
