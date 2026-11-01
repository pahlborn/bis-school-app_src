// Practice sheet as PDF (Peter, 30.10.): used on the go without a printer; home-screen apps cannot print.
//   node --test tests/pdf.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { appServer, browserStarten, appOeffnen } from './app-hilfen.mjs';

let browser, server;
// No system share sheet in tests: the PDF is offered as a download instead.
const ohneTeilen = (page) => page.evaluate(() => { Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true }); });
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

/** Checks the PDF structure: header, objects at the xref offsets, page count, trailer. */
function pruefePdf(buf) {
  const s = buf.toString('latin1');
  assert.ok(s.startsWith('%PDF-1.4'), 'header');
  assert.ok(s.trimEnd().endsWith('%%EOF'), 'end');
  const start = Number(s.match(/startxref\n(\d+)\n%%EOF/)[1]);
  assert.equal(s.slice(start, start + 4), 'xref');
  const m = s.slice(start).match(/xref\n0 (\d+)\n/); const n = Number(m[1]);
  const eintraege = s.slice(start).split('\n').slice(3, 3 + n - 1);
  eintraege.forEach((e, i) => { const off = Number(e.slice(0, 10)); assert.equal(s.slice(off, off + `${i + 1} 0 obj`.length), `${i + 1} 0 obj`, 'xref offset of object ' + (i + 1)); });
  return { text: s, seiten: Number(s.match(/\/Type \/Pages \/Count (\d+)/)[1]), bilder: (s.match(/\/Subtype \/Image/g) || []).length };
}

test('practice sheet: dialog with PDF first; PDF has tasks, writing task and the answer page; nothing sent', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url, { acceptDownloads: true, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const anfragen = []; page.on('request', (q) => { if (!q.url().startsWith(server.url) && !q.url().includes('fonts.g')) anfragen.push(q.url()); });
  await ohneTeilen(page);
  await page.locator('#sheetBtn').click();
  assert.ok(await page.isVisible('#sheetDlg'));
  assert.ok(await page.isVisible('#sheetPdf'));
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#sheetPdf').click()]);
  assert.match(download.suggestedFilename(), /^Practice sheet \d+ \d{4}-\d{2}-\d{2}\.pdf$/);
  const buf = await fs.readFile(await download.path());
  const pdf = pruefePdf(buf);
  assert.ok(pdf.seiten >= 2, 'task page(s) and answer page: ' + pdf.seiten);
  for (const t of ['My Practice Sheet', 'Answers', 'Show your work', 'proud of']) assert.ok(pdf.text.includes(t), t);
  const blatt = await page.evaluate(() => JSON.parse(localStorage.getItem('bq2_sheets')).slice(-1)[0]);
  const ersteFrage = blatt.items[0].q.prompt.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 12).replace(/[^\x20-\x7e]/g, '');
  assert.ok(pdf.text.replace(/\\\(|\\\)/g, '').includes(ersteFrage.replace(/[()\\]/g, '')) || ersteFrage.length < 4, 'first task in PDF: ' + ersteFrage);
  assert.match(await page.textContent('#sheetMsg'), /PDF gespeichert/);
  assert.deepEqual(anfragen, []);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('pictures of maths tasks (number lines, graphs) are embedded as images', async () => {
  const { ctx, page } = await appOeffnen(browser, server.url, { acceptDownloads: true });
  await page.evaluate(() => localStorage.setItem('bq2_focus', JSON.stringify(['round', 'graphs'])));
  await page.reload(); await page.waitForSelector('#home h1'); await ohneTeilen(page);
  let bilder = 0;
  for (let i = 0; i < 4 && !bilder; i++) {
    await page.locator('#sheetBtn').click();
    const [d] = await Promise.all([page.waitForEvent('download'), page.locator('#sheetPdf').click()]);
    bilder = pruefePdf(await fs.readFile(await d.path())).bilder;
    await page.locator('#sheetClose').click();
  }
  assert.ok(bilder >= 1, 'at least one embedded picture');
  await ctx.close();
});

test('umlauts and German writing task come out as WinAnsi text', async () => {
  const { ctx, page } = await appOeffnen(browser, server.url, { acceptDownloads: true });
  await page.evaluate(() => localStorage.setItem('bq2_focus', JSON.stringify(['anleitung'])));
  await page.reload(); await page.waitForSelector('#home h1'); await ohneTeilen(page);
  await page.locator('#sheetBtn').click();
  const [d] = await Promise.all([page.waitForEvent('download'), page.locator('#sheetPdf').click()]);
  const t = pruefePdf(await fs.readFile(await d.path())).text;
  assert.ok(t.includes('Traummaschine'));
  assert.ok(t.includes('f\\374r') || t.includes('für'), 'ü as WinAnsi octal escape');
  await ctx.close();
});

test('home-screen app: Print is hidden (iPad ignores printing there), PDF stays', async () => {
  const { ctx, page } = await appOeffnen(browser, server.url);
  await page.evaluate(() => { Object.defineProperty(window.navigator, 'standalone', { value: true, configurable: true }); });
  await page.locator('#sheetBtn').click();
  assert.equal(await page.isVisible('#sheetPrint'), false);
  assert.ok(await page.isVisible('#sheetPdf'));
  await page.locator('#sheetClose').click();
  assert.equal(await page.isVisible('#sheetDlg'), false);
  await ctx.close();
});
