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

const CODES = { mia: 'ABCD-EFGH', papa: 'PAPA-2345', frau: 'TEAC-HER2', probe: 'TEST-2345', chef: 'CHEF-2345' };
async function konto(user, role, kinder) {
  const salt = Array.from({ length: 16 }, (_, i) => i + user.length);
  return { user, role, ...(kinder ? { kinder } : {}), start: { salt, hash: await pbkdf2Hex(normCode(CODES[user]), salt) } };
}
const KONTEN = { users: [await konto('mia', 'student'), await konto('papa', 'parent', ['mia']), await konto('frau', 'teacher', ['mia']), { ...(await konto('probe', 'student')), test: true }, { ...(await konto('chef', 'parent', ['mia'])), admin: true }] };
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
  const menue = await page.$$eval('#aboutBody details.about-sec > summary', (s) => s.map((x) => x.textContent.trim()));
  assert.deepEqual(menue.slice(0, 1), ['How to use Big Quest'], 'child guide for the child, in English by default');
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
  assert.ok(await page.locator('.psubject').count());
  assert.equal(await sichtbar(page, '#aboutBack'), false, 'no back arrow in the grown-ups area');
  await page.locator('#parentClose').click();
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

test('grown-ups header: language flags, version and log out always in view; info pages open in place without logout', async () => {
  const { ctx, page, fehler } = await oeffnen({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await anmelden(page, 'adult', 'papa', CODES.papa); await passwortSetzen(page, 'langes-passwort');
  await page.waitForSelector('#parentClose');
  for (const sel of ['.phdr [data-plang="de"]', '.phdr [data-plang="en"]', '#parentClose']) assert.ok(await sichtbar(page, sel), sel);
  assert.equal(await sichtbar(page, '#aboutBack'), false, 'no back arrow that leaves the area');
  assert.equal(await sichtbar(page, '#aboutTabs'), false, 'no tab row');
  // scroll far down: header stays at the top (sticky)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const top = await page.locator('.phdr').evaluate((h) => h.getBoundingClientRect().top);
  assert.ok(top >= -1 && top < 5, 'header stays in view: ' + top);
  assert.ok(await page.locator('#parentClose').isVisible());
  // English with the flag, also for the chapters
  await page.locator('.phdr [data-plang="en"]').click();
  assert.match(await page.textContent('.phdr'), /Grown-ups area/);
  assert.match(await page.textContent('#parentClose'), /Log out/);
  assert.deepEqual(await page.$$eval('#aboutBody details.psec > summary', (s) => s.map((x) => x.textContent.trim())),
    ['📄 Practice sheets', '⚙️ Settings', '💡 Help like the school', '📖 Guide & background']);
  // guide and info pages are one reading chapter: reading keeps the grown-up logged in
  await page.locator('#aboutBody details.psec[data-psec="guide"] > summary').click();
  const ab = page.locator('#aboutBody details.psec[data-psec="guide"] details.about-sec').first();
  await ab.locator('summary').click();
  assert.ok(await ab.locator('.about-sec-body').isVisible());
  assert.ok(await page.locator('.psubject').count(), 'still logged in');
  await page.locator('.phdr [data-plang="de"]').click();
  assert.ok(await page.locator('#aboutBody details.psec[data-psec="guide"]').evaluate((d) => d.open), 'opened chapter stays open after switching language');
  assert.equal(await page.locator('#pPlayTest').count(), 0, 'no test child for a parent without admin');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('grown-ups area: chapters open in place, no sub-pages', async () => {
  const { ctx, page, fehler } = await oeffnen();
  await anmelden(page, 'adult', 'papa', CODES.papa); await passwortSetzen(page, 'langes-passwort');
  await page.waitForSelector('#parentClose');
  assert.equal(await page.locator('[data-ppage]').count(), 0, 'no page buttons any more');
  assert.equal(await page.locator('#aboutBody details.psec[open]').count(), 0, 'chapters closed at the start');
  for (const id of ['sheets', 'settings', 'help', 'guide']) {
    const d = page.locator(`#aboutBody details.psec[data-psec="${id}"]`);
    await d.locator('summary').first().click();
    assert.ok(await d.locator('.psec-body').isVisible(), id);
  }
  assert.ok(await page.locator('#focusForm').isVisible(), 'settings content reachable');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('test account: own data apart from the child, "+1 Tag" with ⓘ, reset clears only test data', async () => {
  const { ctx, page, fehler } = await oeffnen();
  // the real child practises first
  await anmelden(page, 'student', 'mia', CODES.mia); await passwortSetzen(page, 'mond');
  await page.waitForSelector('#home:not([hidden])');
  assert.equal(await page.isVisible('#testBar'), false, 'no test bar for the real child');
  await page.evaluate(() => localStorage.setItem('bq2_total', '7'));
  await page.locator('#logoutBtn').click();
  // test account
  await anmelden(page, 'student', 'probe', CODES.probe); await passwortSetzen(page, 'probe1');
  await page.waitForSelector('#testBar:not([hidden])');
  assert.match(await page.textContent('#testBar'), /Testkonto/);
  assert.equal(await page.isVisible('#testBack'), false, 'no way into the grown-ups area without a grown-up');
  assert.equal(await page.textContent('#totalStars'), '0', 'test account starts empty');
  // ⓘ explains "+1 Tag"
  await page.locator('#testBar .info-btn[data-help="testday"]').click();
  assert.ok(await page.locator('#helpDlg').isVisible());
  assert.match(await page.textContent('#helpText'), /einen Tag vor/);
  assert.equal(await page.isVisible('#helpGuide'), false, 'no guide jump here');
  await page.locator('#helpClose').click();
  await page.locator('#todayBtn').click();
  await page.locator('#qAnswers .opt:not(.correct)').first().click().catch(() => {});
  await page.locator('#quitBtn').click();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  assert.ok(keys.some((k) => k.startsWith('bq2_probe__')), 'test data under its own keys');
  assert.equal(await page.evaluate(() => localStorage.getItem('bq2_total')), '7', 'child data untouched');
  const tag1 = await page.textContent('#testBar');
  await page.locator('#testDay').click();
  assert.notEqual(await page.textContent('#testBar'), tag1);
  assert.match(await page.textContent('#testBar'), /\+1/);
  page.once('dialog', (d) => d.accept());
  await page.locator('#testReset').click();
  const nachher = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('bq2_probe__')));
  assert.deepEqual(nachher.filter((k) => k !== 'bq2_probe__rankSeen' && k !== 'bq2_probe__kidLang'), []);
  assert.equal(await page.evaluate(() => localStorage.getItem('bq2_total')), '7', 'child data still untouched');
  assert.ok(await page.evaluate(() => localStorage.getItem('bq2_pw_probe')), 'own password survives the reset');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('admin: try the test child and come back without a new login; log out returns the device to the real child', async () => {
  const { ctx, page, fehler } = await oeffnen();
  await anmelden(page, 'student', 'mia', CODES.mia); await passwortSetzen(page, 'mond');
  await page.waitForSelector('#home:not([hidden])');
  await page.evaluate(() => localStorage.setItem('bq2_total', '7'));
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'chef', CODES.chef); await passwortSetzen(page, 'langes-passwort');
  await page.waitForSelector('#parentClose');
  assert.equal(await page.locator('.phdr-test').count(), 0, 'real data at the start');
  await page.locator('#pPlayTest').click();
  await page.waitForSelector('#home:not([hidden])');
  assert.match(await page.textContent('#testBar'), /Testkonto/);
  assert.equal(await page.textContent('#totalStars'), '0', 'test data, not the child');
  // info pages from the test account and back: stays in the test account, return still offered
  await page.locator('#aboutBtn').click();
  assert.ok(await page.locator('#about').isVisible());
  assert.equal(await sichtbar(page, '#tabSheets'), false);
  await page.locator('#aboutBack').click();
  await page.waitForSelector('#home:not([hidden])');
  assert.match(await page.textContent('#testBar'), /Testkonto/, 'still the test account');
  assert.ok(await page.locator('#testBack').isVisible(), 'return to the grown-ups area still there');
  await page.locator('#testBack').click();
  await page.waitForSelector('#parentClose');
  assert.match(await page.textContent('#aboutBody'), /Angemeldet als chef/);
  assert.match(await page.textContent('.phdr-test'), /Testdaten/, 'clearly marked: test data');
  await page.locator('#pRealData').click();
  assert.equal(await page.locator('.phdr-test').count(), 0, 'back to real data');
  // play again, come back, log out: the device goes back to the real child
  await page.locator('#pPlayTest').click(); await page.locator('#testBack').click();
  await page.waitForSelector('#parentClose');
  await page.locator('#parentClose').click();
  await page.waitForSelector('#home:not([hidden])');
  assert.equal(await page.isVisible('#testBar'), false, 'real child again');
  assert.equal(await page.textContent('#totalStars'), '7');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('admin on a device without a child logged in: after the test child, log out leads to the login, not to the test account', async () => {
  const { ctx, page, fehler } = await oeffnen();
  await anmelden(page, 'adult', 'chef', CODES.chef); await passwortSetzen(page, 'langes-passwort');
  await page.waitForSelector('#parentClose');
  await page.locator('#pPlayTest').click(); await page.locator('#testBack').click();
  await page.waitForSelector('.phdr-test');
  assert.ok(await page.locator('#pRealData').isVisible(), 'way back to real data');
  await page.locator('#parentClose').click();
  await page.waitForSelector('#login:not([hidden])');
  assert.equal(await page.evaluate(() => localStorage.getItem('bq2_session')), null, 'no test session left on the device');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('the return ticket from the test child expires when the app goes to the background', async () => {
  const { ctx, page } = await oeffnen();
  await anmelden(page, 'adult', 'chef', CODES.chef); await passwortSetzen(page, 'langes-passwort');
  await page.waitForSelector('#parentClose');
  await page.locator('#pPlayTest').click();
  await page.waitForSelector('#testBack');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForFunction(() => !document.querySelector('#testBack'));
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
  assert.ok(t.includes('Lehrkraft-Ansicht') && t.includes('Einschätzung'));
  assert.ok(t.includes('Anleitung & Hintergrund'), 'grown-ups guide in the grown-ups area');
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
