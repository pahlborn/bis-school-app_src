// S9 (30.10.): "My profile" bundles name, birthday and emoji. Real clicks and visibility checks only.
//   node --test tests/profil.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, elternOeffnen, elternSeite } from './app-hilfen.mjs';

let browser, server;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

const lies = (page, k) => page.evaluate((key) => localStorage.getItem('bq2_' + key), k);
const imBild = (page, sel) => page.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth; });

const GERAETE = [
  ['iPhone SE', { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true }],
  ['Smartphone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
  ['iPad', { viewport: { width: 810, height: 1080 }, isMobile: true, hasTouch: true }],
  ['Laptop', { viewport: { width: 1366, height: 768 } }]
];

for (const [name, kontext] of GERAETE) {
  test(`${name}: profile button visible at start, dialog fully on screen, save shows one confirmation`, async () => {
    const { ctx, page, fehler } = await appOeffnen(browser, server.url, kontext);
    const anfragen = [];
    page.on('request', (r) => { if (!r.url().startsWith(server.url)) anfragen.push(r.url()); });
    assert.ok(await imBild(page, '#profileBtn'), 'profile button in view without scrolling');
    await page.locator('#profileBtn').click();
    for (const sel of ['#pfName', '#pfDay', '#pfMonth', '#pfEmojis', '#pfClose', '#pfSave']) assert.ok(await imBild(page, sel), sel + ' fully on screen');
    const ueber = await page.$eval('#profileDlg', (d) => d.scrollWidth - d.clientWidth);
    assert.ok(ueber <= 0, 'no horizontal overflow: ' + ueber);
    const klein = await page.$$eval('#profileDlg button, #profileDlg select, #profileBtn', (b) => b.filter((x) => { const r = x.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).map((x) => x.id || x.textContent));
    assert.deepEqual(klein, []);
    await page.fill('#pfName', 'Alex');
    await page.selectOption('#pfDay', '05');
    await page.selectOption('#pfMonth', '07');
    await page.locator('#pfEmojis button').nth(2).click();
    await page.locator('#pfSave').click();
    assert.equal(await page.isVisible('#profileDlg'), false, 'dialog closed');
    assert.equal(await page.locator('#savedNote:visible').count(), 1);
    assert.ok(await imBild(page, '#savedNote'), 'confirmation in view');
    assert.equal(await lies(page, 'name'), '"Alex"');
    assert.equal(await lies(page, 'birthday'), '"07-05"');
    assert.equal(await lies(page, 'emoji'), '"🦁"');
    assert.equal(await page.textContent('#profileName'), 'Alex');
    assert.equal(await page.textContent('#profileEmoji'), '🦁');
    assert.deepEqual(anfragen.filter((u) => !u.includes('fonts.g')), []);
    assert.deepEqual(fehler, []);
    await ctx.close();
  });
}

test('existing name and birthday are pre-filled; Close and Save without change keep storage byte-identical', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  await page.evaluate(() => { localStorage.setItem('bq2_name', '"Alex"'); localStorage.setItem('bq2_birthday', '"03-14"'); });
  await page.reload(); await page.waitForSelector('#home h1');
  assert.equal(await page.textContent('#profileName'), 'Alex');
  await page.locator('#profileBtn').click();
  assert.equal(await page.inputValue('#pfName'), 'Alex');
  assert.equal(await page.inputValue('#pfDay'), '14');
  assert.equal(await page.inputValue('#pfMonth'), '03');
  await page.locator('#pfClose').click();
  assert.equal(await page.isVisible('#profileDlg'), false);
  const vorher = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).filter(([k]) => k.startsWith('bq2_')).sort()));
  await page.locator('#profileBtn').click();
  await page.locator('#pfSave').click();
  const nachher = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).filter(([k]) => k.startsWith('bq2_')).sort()));
  assert.equal(nachher, vorher);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('birthday: "—" removes it, half a date or a non-existent day is not saved', async () => {
  const { ctx, page } = await appOeffnen(browser, server.url);
  await page.evaluate(() => localStorage.setItem('bq2_birthday', '"03-14"'));
  await page.locator('#profileBtn').click();
  await page.selectOption('#pfDay', '');
  await page.locator('#pfSave').click();
  assert.ok(await page.isVisible('#profileDlg'), 'half a date: dialog stays open');
  assert.match(await page.textContent('#pfMessage'), /day and a month/);
  await page.selectOption('#pfDay', '31'); await page.selectOption('#pfMonth', '02');
  await page.locator('#pfSave').click();
  assert.match(await page.textContent('#pfMessage'), /does not exist/);
  assert.equal(await lies(page, 'birthday'), '"03-14"');
  await page.selectOption('#pfDay', ''); await page.selectOption('#pfMonth', '');
  await page.locator('#pfSave').click();
  assert.equal(await lies(page, 'birthday'), null);
  await ctx.close();
});

test('data minimisation: exactly name, birthday, emoji; no year, age or school field; old controls are gone', async () => {
  const { ctx, page } = await appOeffnen(browser, server.url);
  assert.equal(await page.locator('#bdayBtn').count(), 0);
  assert.equal(await page.locator('#playerName').count(), 0);
  await page.locator('#profileBtn').click();
  assert.equal(await page.locator('#profileDlg input[type="text"]').count(), 1);
  assert.equal(await page.locator('#profileDlg select').count(), 2);
  const text = await page.textContent('#profileDlg');
  assert.ok(!/year|age|surname|last name|school|class|grade/i.test(text), text);
  assert.equal(text.split('This stays on this device.').length - 1, 1);
  assert.equal(await page.locator('#pfEmojis button').count(), 12);
  await ctx.close();
});

test('name is shown as text, never as HTML', async () => {
  const { ctx, page } = await appOeffnen(browser, server.url);
  await page.locator('#profileBtn').click();
  await page.fill('#pfName', '<b>x');
  await page.locator('#pfSave').click();
  assert.equal(await page.textContent('#profileName'), '<b>x');
  assert.equal(await page.locator('#profileName b').count(), 0);
  await ctx.close();
});

test('adults see the details behind the PIN and can delete only them; learning data stays', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  await page.evaluate(() => { localStorage.setItem('bq2_name', '"Alex"'); localStorage.setItem('bq2_birthday', '"03-14"'); localStorage.setItem('bq2_emoji', '"🦊"'); localStorage.setItem('bq2_total', '12'); localStorage.setItem('bq2_ev', '{"round":[["2026-10-28",2,1]]}'); });
  await page.reload(); await page.waitForSelector('#home h1');
  await elternOeffnen(page);
  await elternSeite(page, 'settings');
  const t = await page.textContent('#aboutBody');
  assert.ok(t.includes('Alex') && t.includes('14.03.') && t.includes('🦊'));
  page.once('dialog', (d) => d.accept());
  await page.locator('#profileDelete').click();
  assert.equal(await lies(page, 'name'), null);
  assert.equal(await lies(page, 'birthday'), null);
  assert.equal(await lies(page, 'emoji'), null);
  assert.equal(await lies(page, 'total'), '12');
  assert.equal(await lies(page, 'ev'), '{"round":[["2026-10-28",2,1]]}');
  assert.deepEqual(fehler, []);
  await ctx.close();
});
