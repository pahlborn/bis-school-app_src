// S6 Begruessung (Spezifikation 30.10., gebaut 01.11.): einmal am Tag fuer ein angemeldetes Kind, freundlich,
// freiwillig, mit einem Tipp zu ueberspringen. Stimmung wird nie gespeichert; nur der Tag (greetDay).
// Nicht am Tag der ersten Anmeldung (dann gibt es schon das Willkommen), nie fuer Erwachsene.
//   node --test tests/begruessung.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { WURZEL, QUELLEN } from '../werkzeug/bauen.mjs';
import { kontenEinsetzen, pbkdf2Hex, normCode, ausV1 } from '../werkzeug/konten.mjs';
import { browserStarten } from './app-hilfen.mjs';

const CODES = { mia: 'ABCD-EFGH', papa: 'PAPA-2345' };
async function konto(user, role, kinder) {
  const salt = Array.from({ length: 16 }, (_, i) => i + user.length);
  return { user, role, ...(kinder ? { kinder } : {}), start: { salt, hash: await pbkdf2Hex(normCode(CODES[user]), salt) } };
}
const KONTEN = { users: [await konto('mia', 'student'), await konto('papa', 'parent', ['mia'])] };
const app = kontenEinsetzen(await fs.readFile(path.join(WURZEL, QUELLEN.app)), ausV1(KONTEN));
const TAG1 = new Date('2026-11-02T09:00:00'), TAG2 = new Date('2026-11-03T09:00:00');

let browser, server;
before(async () => {
  browser = await browserStarten();
  server = http.createServer((q, r) => { if (q.url.split('?')[0] !== '/') { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end(app); });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  server.url = `http://127.0.0.1:${server.address().port}/`;
});
after(async () => { await browser?.close(); server?.close(); });

async function oeffnen(kontext = {}) {
  const ctx = await browser.newContext(kontext);
  await ctx.route('**/*', (r) => (r.request().url().startsWith(server.url) ? r.continue() : r.abort()));
  const page = await ctx.newPage(); const fehler = []; page.on('pageerror', (e) => fehler.push(e.message));
  await page.clock.setFixedTime(TAG1);
  await page.goto(server.url); await page.waitForSelector('#login:not([hidden])');
  return { ctx, page, fehler };
}
async function anmelden(page, rolle, name, pw) {
  if (await page.locator('#roleStudent').count()) await page.locator(rolle === 'student' ? '#roleStudent' : '#roleAdult').click();
  await page.locator('#loginUser').fill(name); await page.locator('#loginPw').fill(pw);
  await page.locator('#loginGo').click();
}
async function erstesMal(page, wer = 'mia') {
  await anmelden(page, wer === 'mia' ? 'student' : 'adult', wer, CODES[wer]);
  await page.waitForSelector('#setPwForm');
  const pw = wer === 'mia' ? 'mond' : 'langes-passwort';
  await page.locator('#newPw1').fill(pw); await page.locator('#newPw2').fill(pw); await page.locator('#setPwGo').click();
  await page.locator('#welcomeGo').click();
}
const offen = (page) => page.locator('#greetDlg').evaluate((d) => d.open);
async function naechsterTag(page) { await page.clock.setFixedTime(TAG2); await page.reload(); await page.waitForSelector('#home:not([hidden])'); }

test('Begruessung: nicht am Tag der ersten Anmeldung; am naechsten Tag genau einmal; Skip mit 1 Tipp', async () => {
  const { ctx, page, fehler } = await oeffnen();
  await erstesMal(page);
  await page.waitForSelector('#home:not([hidden])');
  assert.equal(await offen(page), false, 'the welcome is enough on the first day');
  await naechsterTag(page);
  assert.equal(await offen(page), true);
  assert.match(await page.textContent('#greetTitle'), /^Hi there! 👋$/);
  await page.locator('#greetSkip').click();
  assert.equal(await offen(page), false);
  assert.ok(await page.locator('#todayBtn').isVisible());
  await page.reload(); await page.waitForSelector('#home:not([hidden])');
  assert.equal(await offen(page), false, 'not twice on the same day');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Begruessung: Name aus dem Profil (als Text), Stimmung nur Antwortzeile, nichts davon gespeichert', async () => {
  const { ctx, page, fehler } = await oeffnen();
  await erstesMal(page);
  await page.waitForSelector('#home:not([hidden])');
  const vorher = await page.evaluate(() => Object.keys(localStorage));
  await page.evaluate(() => { const k = Object.keys(localStorage).find((x) => /greetDay/.test(x)); localStorage.setItem(k.replace('greetDay', 'name'), JSON.stringify('<b>Mo')); });
  await naechsterTag(page);
  assert.equal(await page.textContent('#greetTitle'), 'Hi, <b>Mo! 👋', 'name as plain text');
  const vorne = async () => page.$$eval('#greetOffers [data-offer]', (b) => b.map((x) => x.dataset.offer));
  assert.deepEqual(await vorne(page), ['today', 'subject', 'joke', 'tree', 'sheet']);
  await page.locator('[data-mood="great"]').click();
  assert.equal(await offen(page), true, 'a mood does not close anything');
  assert.match(await page.textContent('#greetReply'), /Let’s have fun/);
  assert.ok(!(await page.textContent('#greetDlg')).includes('grown-up you trust'));
  await page.locator('[data-mood="sad"]').click();
  const antwort = await page.textContent('#greetReply');
  assert.match(antwort, /It’s okay to feel like that/);
  assert.equal(antwort.split('grown-up you trust').length - 1, 1);
  assert.deepEqual((await vorne(page)).slice(0, 2), ['joke', 'tree'], 'cozy offers first');
  assert.equal(await page.locator('#greetOffers [data-offer="today"]').count(), 1, 'Practise Today stays');
  await page.locator('[data-offer="joke"]').click();
  await page.locator('#greetJokeAnswer').click();
  assert.ok(await page.locator('#greetJoke .story i').isVisible());
  assert.equal(await page.textContent('#greetSkip'), 'Done ✓');
  await page.locator('#greetSkip').click();
  const alles = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)).toLowerCase());
  for (const w of ['mood', 'great', 'tired', '"sad"', 'okay']) assert.ok(!alles.includes(w), 'stored: ' + w);
  const neu = (await page.evaluate(() => Object.keys(localStorage))).filter((k) => !vorher.includes(k));
  assert.ok(neu.every((k) => /name|greetDay|ev|attempts/.test(k)), 'new keys: ' + neu.join(', '));
  const text = (await page.textContent('#greetDlg')).toLowerCase();
  for (const w of ['grade', 'level', 'score', 'rating', 'wrong', 'bad mood', 'diagnos', 'therap', 'streak', 'in a row', "haven't been", 'missed', 'believe. inspire', 'birthday']) assert.ok(!text.includes(w), w);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Begruessung: Practise Today mit einem Tipp; passt ohne Scrollen auf 320 x 568, Knoepfe mind. 44 px', async () => {
  const { ctx, page, fehler } = await oeffnen({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  await erstesMal(page);
  await page.waitForSelector('#home:not([hidden])');
  await naechsterTag(page);
  const mass = await page.locator('#greetDlg').evaluate((d) => ({ s: d.scrollHeight, c: d.clientHeight, h: innerHeight, klein: [...d.querySelectorAll('button')].filter((b) => { const r = b.getBoundingClientRect(); return r.height < 44 || r.width < 44; }).map((b) => b.textContent) }));
  assert.ok(mass.s <= mass.c + 1 && mass.c <= mass.h, JSON.stringify(mass));
  assert.deepEqual(mass.klein, []);
  await page.locator('[data-offer="today"]').click();
  await page.waitForSelector('#play:not([hidden])');
  assert.equal(await offen(page), false);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Begruessung: nie fuer Erwachsene, und deren Anmeldung zaehlt nicht als begruesst', async () => {
  const { ctx, page, fehler } = await oeffnen();
  await erstesMal(page, 'papa');
  await page.waitForSelector('#parentClose');
  await page.clock.setFixedTime(TAG2); await page.reload(); await page.waitForSelector('#parentClose');
  assert.equal(await offen(page), false);
  const tage = await page.evaluate(() => Object.keys(localStorage).filter((k) => /greetDay/.test(k)));
  assert.deepEqual(tage, []);
  assert.deepEqual(fehler, []);
  await ctx.close();
});
