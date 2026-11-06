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
    for (const sel of ['#pfName', '#pfLast', '#pfDay', '#pfMonth', '#pfYear', '#pfEmojis', '#pfClose', '#pfSave']) assert.ok(await imBild(page, sel), sel + ' fully on screen');
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
    assert.deepEqual(anfragen, []);
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

// Peter, 04.11. (task "Name und Geburtsdatum"): last name and the year of birth are added - so a teacher with a grant can
// tell children with the same first name apart. Still no age field. Peter, 05.11. (task "Schule und Klasse"): grade, class
// and school get their own small dialog "My school" (tests/schule-klasse.test.mjs) - in "My profile" only the button to it.
test('data minimisation: exactly first name, last name, birthday (year optional), emoji; no age field; school only behind its own button; old controls are gone', async () => {
  const { ctx, page } = await appOeffnen(browser, server.url);
  assert.equal(await page.locator('#bdayBtn').count(), 0);
  assert.equal(await page.locator('#playerName').count(), 0);
  await page.locator('#profileBtn').click();
  assert.equal(await page.locator('#profileDlg input[type="text"]').count(), 2);
  assert.equal(await page.locator('#profileDlg select').count(), 3);
  const text = await page.textContent('#profileDlg');
  assert.ok(!/\bage\b|class|grade/i.test(text), text);
  assert.equal(text.split('school').length - 1, 1, 'only the button "My school"');
  assert.equal((await page.textContent('#pfSchool')).trim(), '🏫 My school');
  assert.equal(text.split('This stays on this device.').length - 1, 1);
  assert.equal(await page.locator('#pfEmojis button').count(), 12);
  await ctx.close();
});

test('last name and year: stored as bq2_lastName and "YYYY-MM-DD"; 29 February only in a leap year; a year needs day and month; old "MM-DD" is pre-filled without a year and stays unchanged', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  await page.evaluate(() => localStorage.setItem('bq2_birthday', '"03-14"'));
  await page.reload(); await page.waitForSelector('#home h1');
  await page.locator('#profileBtn').click();
  assert.equal(await page.inputValue('#pfYear'), '', 'old date: no year');
  const jahre = await page.$$eval('#pfYear option', (o) => o.map((x) => x.value).filter(Boolean).map(Number));
  const jetzt = await page.evaluate(() => new Date().getFullYear());
  assert.equal(Math.max(...jahre), jetzt - 3); assert.equal(Math.min(...jahre), jetzt - 16);
  await page.locator('#pfSave').click();
  assert.equal(await lies(page, 'birthday'), '"03-14"', 'unchanged');
  await page.locator('#profileBtn').click();
  await page.selectOption('#pfDay', ''); await page.selectOption('#pfMonth', ''); await page.selectOption('#pfYear', String(jetzt - 8));
  await page.locator('#pfSave').click();
  assert.match(await page.textContent('#pfMessage'), /day and a month for the year/);
  const schalt = jahre.find((y) => y % 4 === 0), kein = jahre.find((y) => y % 4 !== 0);
  await page.selectOption('#pfDay', '29'); await page.selectOption('#pfMonth', '02'); await page.selectOption('#pfYear', String(kein));
  await page.locator('#pfSave').click();
  assert.match(await page.textContent('#pfMessage'), /does not exist in February/);
  await page.selectOption('#pfYear', String(schalt));
  await page.fill('#pfLast', '  Becker  ');
  await page.locator('#pfSave').click();
  assert.equal(await page.isVisible('#profileDlg'), false);
  assert.equal(await lies(page, 'birthday'), JSON.stringify(schalt + '-02-29'));
  assert.equal(await lies(page, 'lastName'), '"Becker"');
  await page.locator('#profileBtn').click();
  assert.deepEqual([await page.inputValue('#pfDay'), await page.inputValue('#pfMonth'), await page.inputValue('#pfYear'), await page.inputValue('#pfLast')], ['29', '02', String(schalt), 'Becker'], 'pre-filled with the year');
  await page.fill('#pfLast', ''); await page.selectOption('#pfYear', '');
  await page.locator('#pfSave').click();
  assert.equal(await lies(page, 'lastName'), null, 'empty last name removes it');
  assert.equal(await lies(page, 'birthday'), '"02-29"', 'without a year again');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('birthday party with the year: two days before a countdown, on the day the wish with the name', async () => {
  for (const [zeit, text] of [['2026-10-31T09:00:00', /coming in 2 days/], ['2026-11-02T09:00:00', /Happy birthday, Alex/]]) {
    const { ctx, page } = await appOeffnen(browser, server.url, { zeit });
    await page.evaluate(() => { localStorage.setItem('bq2_birthday', '"2017-11-02"'); localStorage.setItem('bq2_name', '"Alex"'); localStorage.setItem('bq2_lastName', '"Becker"'); });
    await page.reload(); await page.waitForSelector('#home h1');
    assert.match(await page.textContent('#homeNote'), text, zeit);
    assert.equal(await page.textContent('#profileName'), 'Alex', 'the child sees its first name as before');
    await ctx.close();
  }
});

test('parents add last name and the year in the grown-ups area; a half date is refused; the name is shown as text', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  await page.evaluate(() => { localStorage.setItem('bq2_name', '"Alex"'); localStorage.setItem('bq2_birthday', '"03-14"'); });
  await page.reload(); await page.waitForSelector('#home h1');
  await elternOeffnen(page);
  await elternSeite(page, 'settings');
  await page.locator('.pprofile-edit summary').click();
  assert.equal(await page.inputValue('#ppFirst'), 'Alex');
  assert.deepEqual([await page.inputValue('#ppDay'), await page.inputValue('#ppMonth'), await page.inputValue('#ppYear')], ['14', '03', '']);
  await page.selectOption('#ppMonth', '');
  await page.locator('#pProfileForm button[type="submit"]').click();
  assert.match(await page.textContent('#pProfileMsg'), /Tag und Monat/);
  assert.equal(await lies(page, 'birthday'), '"03-14"');
  await page.selectOption('#ppMonth', '03'); await page.selectOption('#ppYear', '2017'); await page.fill('#ppLast', 'Bé"cker<b>');
  await page.locator('#pProfileForm button[type="submit"]').click();
  assert.equal(await lies(page, 'birthday'), '"2017-03-14"');
  assert.equal(await lies(page, 'lastName'), JSON.stringify('Bé"cker<b>'));
  const t = await page.textContent('#aboutBody');
  assert.ok(t.includes('Alex Bé"cker<b>') && t.includes('14.03.2017'), 'shown with name, last name and the full date');
  assert.equal(await page.locator('#aboutBody b b').count(), 0, 'never as HTML');
  await page.locator('.pprofile-edit summary').click();
  assert.equal(await page.inputValue('#ppLast'), 'Bé"cker<b>', 'as a value, not cut at the quote');
  assert.deepEqual(fehler, []);
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
  await page.evaluate(() => { localStorage.setItem('bq2_name', '"Alex"'); localStorage.setItem('bq2_lastName', '"Becker"'); localStorage.setItem('bq2_birthday', '"03-14"'); localStorage.setItem('bq2_emoji', '"🦊"'); localStorage.setItem('bq2_total', '12'); localStorage.setItem('bq2_ev', '{"round":[["2026-10-28",2,1]]}'); });
  await page.reload(); await page.waitForSelector('#home h1');
  await elternOeffnen(page);
  await elternSeite(page, 'settings');
  const t = await page.textContent('#aboutBody');
  assert.ok(t.includes('Alex Becker') && t.includes('14.03.') && t.includes('🦊'));
  page.once('dialog', (d) => d.accept());
  await page.locator('#profileDelete').click();
  assert.equal(await lies(page, 'name'), null);
  assert.equal(await lies(page, 'lastName'), null);
  assert.equal(await lies(page, 'birthday'), null);
  assert.equal(await lies(page, 'emoji'), null);
  assert.equal(await lies(page, 'total'), '12');
  assert.equal(await lies(page, 'ev'), '{"round":[["2026-10-28",2,1]]}');
  assert.deepEqual(fehler, []);
  await ctx.close();
});
