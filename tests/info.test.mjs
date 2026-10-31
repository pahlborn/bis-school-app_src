// User documentation (Peter, 31.10.): a guide for grown-ups and a simple one for the child, plus
// help (ⓘ) buttons at the places where questions come up. Real clicks.
//   node --test tests/info.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, alleKarten, karteOeffnen, elternOeffnen } from './app-hilfen.mjs';

let browser, server;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });
const BEWERTUNG = /Requires support|Consolidating|Meeting expectations|Extending|\bgrade [A-F]\b|\bscore\b/i;

async function hilfe(page, sel, titel) {
  await page.locator(sel).first().click();
  assert.ok(await page.isVisible('#helpDlg'), 'help dialog open: ' + sel);
  assert.equal(await page.textContent('#helpTitle'), titel);
  const box = await page.locator(sel).first().boundingBox();
  assert.ok(box.width >= 44 && box.height >= 44, 'info button at least 44 px');
  return page.textContent('#helpText');
}

test('child: ❓ Help opens the child guide; ⓘ at the learning tree explains it and leads to the guide', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.locator('#guideBtn').click();
  assert.equal(await page.textContent('#aboutBody .about-sub-title'), 'How to use Big Quest');
  assert.ok(!BEWERTUNG.test(await page.textContent('#aboutBody')));
  await page.locator('#aboutBack').click();
  const t = await hilfe(page, '#home .info-btn[data-help="tree"]', 'Your learning tree');
  assert.ok(!BEWERTUNG.test(t));
  assert.ok(await page.isVisible('#helpGuide'));
  await page.locator('#helpGuide').click();
  assert.equal(await page.isVisible('#helpDlg'), false);
  assert.equal(await page.textContent('#aboutBody .about-sub-title'), 'How to use Big Quest');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('child: ⓘ while playing, in the reading studio and at the practice sheet', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  await karteOeffnen(page, (await alleKarten(page)).find((k) => k.item === 'numbers'));
  await hilfe(page, '#play .info-btn', 'How a question works');
  await page.locator('#helpClose').click();
  assert.equal(await page.isVisible('#helpDlg'), false);
  assert.ok(await page.isVisible('#play'), 'the round goes on');
  await karteOeffnen(page, (await alleKarten(page)).find((k) => k.item === 'studio:read'));
  const rec = await page.locator('#recorder .info-btn').count();
  if (rec) { await hilfe(page, '#recorder .info-btn', 'Recording yourself'); await page.locator('#helpClose').click(); }
  await page.locator('#studioBack').click();
  await page.locator('#subjectBack').click().catch(() => {});
  await page.evaluate(() => { window.print = () => {}; });
  await page.locator('#sheetBtn').click();
  await hilfe(page, '#sheetDlg .info-btn', 'Practice sheet');
  await page.locator('#helpClose').click();
  assert.ok(await page.isVisible('#sheetDlg'), 'back in the sheet dialog');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('grown-ups area: every section has ⓘ with a German explanation; no guide jump (would log out)', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  await elternOeffnen(page);
  const infos = async () => page.$$eval('#aboutBody h2 .info-btn', (b) => b.map((x) => x.dataset.help));
  assert.ok((await infos()).includes('overview'), 'info at the summary');
  await page.locator('#aboutBody [data-ppage="help"]').click();
  assert.ok((await infos()).includes('guidance'));
  await page.locator('#aboutBody [data-ppage="settings"]').click();
  const keys = await infos();
  for (const k of ['focus', 'calendar', 'storycap', 'profile', 'version']) assert.ok(keys.includes(k), 'info at ' + k);
  const t = await hilfe(page, '#aboutBody .info-btn[data-help="focus"]', 'Fokus-Themen');
  assert.match(t, /Practise Today/);
  assert.equal(await page.isVisible('#helpGuide'), false);
  await page.locator('#helpClose').click();
  assert.ok(await page.locator('#parentClose').count(), 'still in the grown-ups area');
  assert.deepEqual(fehler, []);
  await ctx.close();
});
