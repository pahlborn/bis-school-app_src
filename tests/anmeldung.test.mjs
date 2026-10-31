// Login (S3, Peter 30.10.): role first, then user name + password; start code on first login, then an
// own password; children stay logged in, grown-ups are logged out when leaving. Real clicks.
//   node --test tests/anmeldung.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { WURZEL, QUELLEN, distBauen } from '../werkzeug/bauen.mjs';
import { entschluesseln, tresorAusHuelle, ohneTresor } from '../werkzeug/kern.mjs';
import { kontenEinsetzen, kontenPruefen, pbkdf2Hex, normCode, codeErzeugen } from '../werkzeug/konten.mjs';
import { TEST_PW } from './hilfen.mjs';
import { browserStarten, appOeffnen } from './app-hilfen.mjs';

const CODES = { mia: 'ABCD-EFGH', papa: 'PAPA-2345', frau: 'TEAC-HER2' };
async function konto(user, role, kinder) {
  const salt = Array.from({ length: 16 }, (_, i) => i + user.length);
  return { user, role, ...(kinder ? { kinder } : {}), start: { salt, hash: await pbkdf2Hex(normCode(CODES[user]), salt) } };
}
const KONTEN = { users: [await konto('mia', 'student'), await konto('papa', 'parent', ['mia']), await konto('frau', 'teacher', ['mia'])] };
const app = kontenEinsetzen(await fs.readFile(path.join(WURZEL, QUELLEN.app)), KONTEN);

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
  await page.goto(server.url); await page.waitForSelector('#login:not([hidden]), #home:not([hidden])');
  return { ctx, page, fehler };
}
async function anmelden(page, rolle, name, pw) {
  if (await page.locator('#roleStudent').count()) await page.locator(rolle === 'student' ? '#roleStudent' : '#roleAdult').click();
  await page.locator('#loginUser').fill(name); await page.locator('#loginPw').fill(pw);
  await page.locator('#loginGo').click();
}
async function passwortSetzen(page, pw) {
  await page.waitForSelector('#setPwForm');
  await page.locator('#newPw1').fill(pw); await page.locator('#newPw2').fill(pw); await page.locator('#setPwGo').click();
  // first login on a device: a short welcome with the most helpful information, then on
  await page.waitForSelector('#welcomeGo');
  assert.ok((await page.locator('.welcome li').count()) >= 4);
  await page.locator('#welcomeGo').click();
}
const sichtbar = (page, sel) => page.locator(sel).isVisible();
const lies = (page, k) => page.evaluate((key) => JSON.parse(localStorage.getItem('bq2_' + key) || 'null'), k);

test('with accounts the app starts with the login: role choice, no list of names, nothing behind it reachable', async () => {
  const { ctx, page, fehler } = await oeffnen({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  assert.ok(await sichtbar(page, '#login')); assert.equal(await sichtbar(page, '#home'), false);
  assert.ok(await sichtbar(page, '#roleStudent')); assert.ok(await sichtbar(page, '#roleAdult'));
  const text = await page.evaluate(() => document.body.innerText.toLowerCase());
  for (const n of ['mia', 'papa', 'frau']) assert.ok(!text.includes(n), 'no user names shown: ' + n);
  await page.locator('.login-help summary').click();
  assert.match(await page.textContent('.login-help'), /Startcode funktioniert immer/);
  await page.evaluate(() => { location.hash = '#eltern'; });
  await page.waitForTimeout(200);
  assert.equal(await page.locator('#focusForm').count(), 0, 'no grown-ups area without login');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('student: first login with start code, then own password; stays logged in; own password works after logout', async () => {
  const { ctx, page, fehler } = await oeffnen();
  await anmelden(page, 'student', ' Mia ', 'abcd efgh');
  await page.waitForSelector('#setPwForm');
  await page.locator('#newPw1').fill('ab'); await page.locator('#newPw2').fill('ab'); await page.locator('#setPwGo').click();
  assert.match(await page.textContent('#setPwMsg'), /at least 4/);
  await page.locator('#newPw1').fill('mond'); await page.locator('#newPw2').fill('sonne'); await page.locator('#setPwGo').click();
  assert.match(await page.textContent('#setPwMsg'), /not the same/);
  await passwortSetzen(page, 'mond');
  await page.waitForSelector('#home:not([hidden])');
  const pw = await lies(page, 'pw_mia');
  assert.match(pw.hash, /^[0-9a-f]{64}$/); assert.ok(!JSON.stringify(pw).includes('mond'), 'password never stored');
  assert.deepEqual(await lies(page, 'session'), { user: 'mia' });
  await page.reload(); await page.waitForSelector('#home:not([hidden])');
  assert.ok(await sichtbar(page, '#logoutBtn'));
  await page.locator('#logoutBtn').click();
  assert.ok(await sichtbar(page, '#login'));
  await anmelden(page, 'student', 'mia', 'mond');
  await page.waitForSelector('#home:not([hidden])');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('wrong password, unknown name and the wrong role are refused; after 5 tries a short wait', async () => {
  const { ctx, page } = await oeffnen();
  await anmelden(page, 'student', 'mia', 'falsch');
  await page.waitForFunction(() => document.querySelector('#loginMsg').textContent.includes('not right'));
  assert.ok(await sichtbar(page, '#login'));
  await page.locator('#loginBack').click();
  await anmelden(page, 'adult', 'mia', CODES.mia);
  await page.waitForFunction(() => document.querySelector('#loginMsg').textContent.includes('not right'));
  for (let i = 0; i < 4; i++) { await page.locator('#loginPw').fill('x' + i); await page.locator('#loginGo').click(); await page.waitForFunction(() => !document.querySelector('#loginGo').disabled); }
  await page.locator('#loginPw').fill(CODES.papa); await page.locator('#loginUser').fill('papa'); await page.locator('#loginGo').click();
  assert.match(await page.textContent('#loginMsg'), /wait/);
  await ctx.close();
});

test('child view has no grown-ups tab; "Grown-ups" opens the grown-ups login openly; leaving returns to the child', async () => {
  const { ctx, page, fehler } = await oeffnen();
  await anmelden(page, 'student', 'mia', CODES.mia); await passwortSetzen(page, 'mond');
  await page.waitForSelector('#home:not([hidden])');
  await page.locator('#aboutBtn').click();
  assert.equal(await sichtbar(page, '#tabSheets'), false);
  const menue = await page.locator('#aboutBody .about-item span:first-child').allTextContents();
  assert.ok(menue.some((x) => x.startsWith('How to use Big Quest')), 'child guide for the child');
  assert.ok(!menue.includes('Anleitung für Erwachsene'), 'no grown-ups guide for the child');
  await page.locator('#aboutBack').click();
  await page.locator('#adultBtn').click();
  assert.ok(await sichtbar(page, '#loginUser'));
  await anmelden(page, 'adult', 'papa', CODES.papa);
  await page.locator('#newPw1').fill('kurz'); await page.locator('#newPw2').fill('kurz'); await page.locator('#setPwGo').click();
  assert.match(await page.textContent('#setPwMsg'), /at least 8/);
  await passwortSetzen(page, 'langes-passwort');
  await page.waitForSelector('#parentClose');
  assert.ok((await page.textContent('#aboutBody')).includes('Angemeldet als papa'));
  assert.ok(await page.locator('#focusForm').count());
  await page.locator('#aboutBack').click();
  await page.waitForSelector('#home:not([hidden])');
  assert.equal(await page.locator('#focusForm').count(), 0);
  await page.locator('#aboutBtn').click();
  assert.equal(await sichtbar(page, '#tabSheets'), false, 'after the grown-up left, the child sees no grown-ups tab');
  await page.locator('#aboutBack').click();
  await page.reload(); await page.waitForSelector('#home:not([hidden])');
  assert.equal(await page.locator('#parentClose').count(), 0, 'grown-up session not kept');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('grown-up is logged out when the app goes to the background', async () => {
  const { ctx, page } = await oeffnen();
  await anmelden(page, 'adult', 'papa', CODES.papa); await passwortSetzen(page, 'langes-passwort');
  await page.waitForSelector('#parentClose');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForSelector('#login:not([hidden])');
  assert.equal(await page.locator('#focusForm').count(), 0);
  await ctx.close();
});

test('teacher sees observations read-only: no focus, settings, profile or sheet entry', async () => {
  const { ctx, page } = await oeffnen();
  await anmelden(page, 'adult', 'frau', CODES.frau); await passwortSetzen(page, 'lehrkraft-123');
  await page.waitForSelector('#parentClose');
  const t = await page.textContent('#aboutBody');
  assert.ok(t.includes('Lehrkraft-Ansicht') && t.includes('Übungsbeobachtungen'));
  assert.ok(t.includes('Anleitung für Erwachsene'), 'grown-ups guide in the grown-ups area');
  for (const sel of ['#focusForm', '#storyCap', '#profileDelete', '#reminderForm', 'button[data-res]']) assert.equal(await page.locator(sel).count(), 0, sel);
  await ctx.close();
});

test('accounts file is checked; the build puts accounts only into the vault, never a start code', async () => {
  assert.throws(() => kontenPruefen({ users: [{ ...KONTEN.users[0], code: 'ABCD-EFGH' }, KONTEN.users[1]] }), /Klartext/);
  assert.throws(() => kontenPruefen({ users: [KONTEN.users[0]] }), /Elternkonto/);
  assert.throws(() => kontenPruefen({ users: [KONTEN.users[0], { ...KONTEN.users[1], kinder: ['tom'] }] }), /Kind "tom" fehlt/);
  assert.match(codeErzeugen(), /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  const ziel = await fs.mkdtemp(path.join(os.tmpdir(), 'bq-konten-'));
  await distBauen(TEST_PW, { ziel, konten: KONTEN, version: { n: 1, hash: 'abcdef1', date: '31.10.2026 08:00', draft: false } });
  const html = await fs.readFile(path.join(ziel, 'index.html'), 'utf8');
  const klar = Buffer.from(await entschluesseln(tresorAusHuelle(html), TEST_PW)).toString('utf8');
  assert.ok(klar.includes('"user":"papa"'));
  for (const c of Object.values(CODES)) assert.ok(!klar.includes(c) && !klar.includes(normCode(c)), 'no start code in the app');
  for (const n of ['papa', 'frau', '"mia"']) assert.ok(!ohneTresor(html).includes(n), 'no user name in the public shell');
});
