// Login (S3, Peter 30.10.): role first, then user name + password; start code on first login, then an
// own password; children stay logged in, grown-ups log out only with "Log out". Real clicks.
//   node --test tests/anmeldung.test.mjs

import { test, before, after } from 'node:test';
import { appLesen } from '../werkzeug/module.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { WURZEL, QUELLEN, distBauen } from '../werkzeug/bauen.mjs';
import { entschluesseln, tresorAusHuelle, ohneTresor } from '../werkzeug/kern.mjs';
import { kontenEinsetzen, kontenPruefen, pbkdf2Hex, normCode, codeErzeugen, ausV1 } from '../werkzeug/konten.mjs';
import { TEST_PW } from './hilfen.mjs';
import { browserStarten, appOeffnen } from './app-hilfen.mjs';

const CODES = { mia: 'ABCD-EFGH', papa: 'PAPA-2345', frau: 'TEAC-HER2', probe: 'TEST-2345', chef: 'CHEF-2345', lia: 'LIAA-2345', tim: 'TIMM-2345' };
async function konto(user, role, kinder) {
  const salt = Array.from({ length: 16 }, (_, i) => i + user.length);
  return { user, role, ...(kinder ? { kinder } : {}), start: { salt, hash: await pbkdf2Hex(normCode(CODES[user]), salt) } };
}
// Account model v2 (S11): the familiar v1 fixture is converted once; admins are not parents (B3).
const KONTEN = ausV1({ users: [await konto('mia', 'student'), await konto('papa', 'parent', ['mia', 'tim']), await konto('frau', 'teacher', ['mia']), { ...(await konto('probe', 'student')), test: true }, { ...(await konto('chef', 'parent', ['mia'])), admin: true }, await konto('lia', 'student'), await konto('tim', 'student')] });
const app = kontenEinsetzen(await appLesen(), KONTEN);

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
/** the child logs in on its device, then a grown-up opens the grown-ups area there */
async function kindDann(page, wer, pw) {
  await anmelden(page, 'student', 'mia', CODES.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', wer, CODES[wer]); await passwortSetzen(page, pw);
  await page.waitForSelector('#parentClose');
}
/** B5: the admin chooses the test child in the child list; "▶ Play as test child" is in the test data row. Real clicks. */
async function testkindSpielen(page) {
  if (await page.$('#pSetBack')) { await page.locator('#pSetBack').click(); await page.waitForSelector('#pSetBack', { state: 'detached' }); }
  if (await page.$('#pKidSel')) await page.selectOption('#pKidSel', 'probe');
  await page.locator('.phdr-test #pPlayTest').click();
}
const lies = (page, k) => page.evaluate((key) => JSON.parse(localStorage.getItem('bq2_' + key) || 'null'), k);
// S11 P2: every child stores under its ID (bq2_<id>__<key>), passwords under bq2_pw_<id>
const ID = (n) => KONTEN.users.find((u) => u.user === n).id;
const NS = (n) => 'bq2_' + ID(n) + '__';

test('with accounts the app starts with the login: role choice, no list of names, nothing behind it reachable', async () => {
  const { ctx, page, fehler } = await oeffnen({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  assert.ok(await sichtbar(page, '#login')); assert.equal(await sichtbar(page, '#home'), false);
  assert.ok(await sichtbar(page, '#roleStudent')); assert.ok(await sichtbar(page, '#roleAdult'));
  assert.equal((await page.textContent('#login h1')).trim(), 'Welcome to Big Quest');
  assert.equal(await page.locator('#login .hero .eyebrow').count(), 0, 'no class line on the login page');
  assert.equal(await page.locator('#loginBody h2').count(), 0, 'no separate role question');
  assert.equal((await page.textContent('#roleStudent')).trim(), "I'm a student");
  assert.equal((await page.textContent('#roleAdult')).trim(), "I'm a parent or teacher");
  assert.equal((await page.textContent('#loginVersion')).trim(), 'Entwicklungsstand', 'version on the login page (unbuilt here)');
  const text = await page.evaluate(() => document.querySelector('#login').innerText);
  assert.ok(!text.includes('Grade 3'), 'no class reference on the login page');
  assert.ok(!text.includes('Who is logging in?'), 'no extra role heading');
  for (const n of ['mia', 'papa', 'frau']) assert.ok(!text.includes(n), 'no user names shown: ' + n);
  await page.locator('.login-help summary').click();
  // A2 (02.11.): the login help is in US English only
  const hilfe = await page.textContent('.login-help');
  assert.match(hilfe, /your start code still works/);
  assert.equal((await page.textContent('.login-help summary')).trim(), '❓ Help');
  assert.ok(!/[äöüß„]|\b(Hilfe|Erwachsene|Kinder|Passwort|Eltern|Lehrkr|Startcode|Benutzername)\b/.test(hilfe), 'no German in the login help');
  assert.ok(!/\b(colour|favourite|practise|recognise)\b/i.test(hilfe), 'US spelling');
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
  assert.match(await page.textContent('#setPwMsg'), /strong password/);
  await page.locator('#newPw1').fill('Tiger-Lamp-River-4271'); await page.locator('#newPw2').fill('Owl-Cake-Moon-1357'); await page.locator('#setPwGo').click();
  assert.match(await page.textContent('#setPwMsg'), /not the same/);
  await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  const pw = await lies(page, 'pw_' + ID('mia'));
  assert.match(pw.hash, /^[0-9a-f]{64}$/); assert.ok(!JSON.stringify(pw).includes('Tiger-Lamp-River-4271'), 'password never stored');
  assert.deepEqual(await lies(page, 'session'), { user: 'mia', id: ID('mia') });
  await page.reload(); await page.waitForSelector('#home:not([hidden])');
  assert.ok(await sichtbar(page, '#logoutBtn'));
  await page.locator('#logoutBtn').click();
  assert.ok(await sichtbar(page, '#login'));
  await anmelden(page, 'student', 'mia', 'Tiger-Lamp-River-4271');
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
  // grown-ups log in in their language (German by default)
  await page.waitForFunction(() => document.querySelector('#loginMsg').textContent.includes('stimmt nicht'));
  for (let i = 0; i < 4; i++) { await page.locator('#loginPw').fill('x' + i); await page.locator('#loginGo').click(); await page.waitForFunction(() => !document.querySelector('#loginGo').disabled); }
  await page.locator('#loginPw').fill(CODES.papa); await page.locator('#loginUser').fill('papa'); await page.locator('#loginGo').click();
  assert.match(await page.textContent('#loginMsg'), /warten/);
  await ctx.close();
});

test('child view has no grown-ups tab; "Grown-ups" opens the grown-ups login openly; leaving returns to the child', async () => {
  const { ctx, page, fehler } = await oeffnen();
  await anmelden(page, 'student', 'mia', CODES.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  // help by role (Peter 01.11.): one help button, only the child guide - no concept, sources or grown-up notes
  assert.equal(await sichtbar(page, '#aboutBtn'), false, 'no second info button for the child');
  await page.locator('#guideBtn').click();
  assert.equal(await sichtbar(page, '#tabSheets'), false);
  assert.equal((await page.textContent('#aboutBody h2')).trim(), 'How to use Big Quest');
  assert.equal(await page.locator('#aboutBody details').count(), 0, 'no topic list');
  const kind = await page.textContent('#aboutBody');
  for (const w of ['Wichtiger Hinweis', 'Please note', 'Grundidee', 'Guiding principles', 'Sources', 'Quellen', 'Privacy', 'Anleitung für Erwachsene', 'Guide for grown-ups', 'Requires support']) assert.ok(!kind.includes(w), 'not for the child: ' + w);
  assert.equal(await sichtbar(page, '#aboutTop .flags'), false, 'child guide is English only');
  assert.equal((await page.textContent('#aboutChip')).trim(), '❓ Help');
  await page.locator('#aboutBack').click();
  await page.locator('#adultBtn').click();
  assert.ok(await sichtbar(page, '#loginUser'));
  await anmelden(page, 'adult', 'papa', CODES.papa);
  await page.locator('#newPw1').fill('kurz'); await page.locator('#newPw2').fill('kurz'); await page.locator('#setPwGo').click();
  assert.match(await page.textContent('#setPwMsg'), /mindestens 12/);
  await passwortSetzen(page, 'langes-passwort');
  await page.waitForSelector('#parentClose');
  assert.match(await page.textContent('.phdr'), /Elternbereich · papa/);
  assert.equal(await page.locator('#aboutBody > p.small').count(), 0, 'no processing notes under the header');
  assert.ok(await page.locator('.psubject').count());
  assert.equal(await sichtbar(page, '#aboutBack'), false, 'no back arrow in the grown-ups area');
  await page.locator('#parentClose').click();
  await page.waitForSelector('#home:not([hidden])');
  assert.equal(await page.locator('#focusForm').count(), 0);
  await page.locator('#guideBtn').click();
  assert.equal(await sichtbar(page, '#tabSheets'), false, 'after the grown-up left, the child sees no grown-ups tab');
  await page.locator('#aboutBack').click();
  await page.reload(); await page.waitForSelector('#home:not([hidden])');
  assert.equal(await page.locator('#parentClose').count(), 0, 'grown-up session not kept');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('grown-ups header: language flags, ? help, ⚙ settings and log out always in view (B1); info pages open in place without logout', async () => {
  const { ctx, page, fehler } = await oeffnen({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await kindDann(page, 'papa', 'langes-passwort');
  for (const sel of ['.phdr [data-plang="de"]', '.phdr [data-plang="en"]', '#pHelp', '#pSettings', '#parentClose']) assert.ok(await sichtbar(page, sel), sel);
  assert.equal(await page.locator('.phdr #pVersion, .phdr #pPlayTest').count(), 0, 'no version and no test child button in the header (B1)');
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
    ['📖 The Big Quest concept', '🤝 How to support your child', '🏫 School assessments', '📄 Practice sheets']);
  // guide and info pages are one reading chapter: reading keeps the grown-up logged in
  await page.locator('#aboutBody details.psec[data-psec="concept"] > summary').click();
  const ab = page.locator('#aboutBody details.psec[data-psec="concept"] details.about-sec').first();
  await ab.locator('summary').click();
  assert.ok(await ab.locator('.about-sec-body').isVisible());
  const kapitel = await page.$$eval('#aboutBody details.psec[data-psec="concept"] details.about-sec > summary', (s) => s.map((x) => x.textContent.trim()));
  assert.ok(!kapitel.some((t) => t.startsWith('How to use Big Quest')), 'no child guide in the grown-ups area');
  assert.ok(await page.locator('.psubject').count(), 'still logged in');
  await page.locator('.phdr [data-plang="de"]').click();
  assert.ok(await page.locator('#aboutBody details.psec[data-psec="concept"]').evaluate((d) => d.open), 'opened chapter stays open after switching language');
  assert.equal(await page.locator('#pPlayTest').count(), 0, 'no test child for a parent without admin');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('grown-ups area: chapters open in place, no sub-pages', async () => {
  const { ctx, page, fehler } = await oeffnen();
  await kindDann(page, 'papa', 'langes-passwort');
  assert.equal(await page.locator('[data-ppage]').count(), 0, 'no page buttons any more');
  assert.equal(await page.locator('#aboutBody details.psec[open]').count(), 0, 'chapters closed at the start');
  for (const id of ['sheets', 'support', 'concept']) {
    const d = page.locator(`#aboutBody details.psec[data-psec="${id}"]`);
    await d.locator('summary').first().click();
    assert.ok(await d.locator('.psec-body').isVisible(), id);
  }
  // the guide is the ? help view (B2)
  await page.locator('#pHelp').click(); await page.waitForSelector('#pHelpBack');
  assert.ok(await page.locator('.phelp-view').isVisible(), 'guide in ?');
  // the child's settings are in ⚙ (B1)
  await page.locator('#pSettings').click(); await page.waitForSelector('#pSetBack');
  await page.locator('#aboutBody details.psec[data-psec="settings"] > summary').click();
  assert.ok(await page.locator('#storyCap').isVisible(), 'settings content reachable');
  assert.equal(await page.locator('#focusForm').count(), 0, 'focus only at the quest, not twice');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('test account: own data apart from the child, "+1 Tag" with ⓘ, reset clears only test data', async () => {
  const { ctx, page, fehler } = await oeffnen();
  // the real child practises first
  await anmelden(page, 'student', 'mia', CODES.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  assert.equal(await page.isVisible('#testBar'), false, 'no test bar for the real child');
  await page.evaluate((ns) => localStorage.setItem(ns + 'total', '7'), NS('mia'));
  await page.locator('#logoutBtn').click();
  // test account
  await anmelden(page, 'student', 'probe', CODES.probe); await passwortSetzen(page, 'Fox-Kite-Rain-2468');
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
  assert.ok(keys.some((k) => k.startsWith(NS('probe'))), 'test data under its own keys');
  assert.equal(await page.evaluate((ns) => localStorage.getItem(ns + 'total'), NS('mia')), '7', 'child data untouched');
  const tag1 = await page.textContent('#testBar');
  await page.locator('#testDay').click();
  assert.notEqual(await page.textContent('#testBar'), tag1);
  assert.match(await page.textContent('#testBar'), /\+1/);
  page.once('dialog', (d) => d.accept());
  await page.locator('#testReset').click();
  const nachher = await page.evaluate((ns) => Object.keys(localStorage).filter((k) => k.startsWith(ns)), NS('probe'));
  assert.deepEqual(nachher.filter((k) => k !== NS('probe') + 'rankSeen' && k !== NS('probe') + 'kidLang'), []);
  assert.equal(await page.evaluate((ns) => localStorage.getItem(ns + 'total'), NS('mia')), '7', 'child data still untouched');
  assert.ok(await page.evaluate((k) => localStorage.getItem(k), 'bq2_pw_' + ID('probe')), 'own password survives the reset');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('admin: try the test child and come back without a new login; log out returns the device to the real child', async () => {
  const { ctx, page, fehler } = await oeffnen();
  await anmelden(page, 'student', 'mia', CODES.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  await page.evaluate((ns) => localStorage.setItem(ns + 'total', '7'), NS('mia'));
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'chef', CODES.chef); await passwortSetzen(page, 'langes-passwort');
  await page.waitForSelector('#parentClose');
  // B5: the admin sees the test child at once (its own data); the device still belongs to the real child
  assert.match(await page.textContent('.phdr-test'), /Testdaten/);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('bq2_session')).user), 'mia', 'nothing switched yet');
  await testkindSpielen(page);
  await page.waitForSelector('#home:not([hidden])');
  assert.match(await page.textContent('#testBar'), /Testkonto/);
  assert.equal(await page.textContent('#totalStars'), '0', 'test data, not the child');
  // help from the test account and back: stays in the test account, return still offered
  await page.locator('#guideBtn').click();
  assert.ok(await page.locator('#about').isVisible());
  assert.equal(await sichtbar(page, '#tabSheets'), false);
  await page.locator('#aboutBack').click();
  await page.waitForSelector('#home:not([hidden])');
  assert.match(await page.textContent('#testBar'), /Testkonto/, 'still the test account');
  assert.ok(await page.locator('#testBack').isVisible(), 'return to the grown-ups area still there');
  await page.locator('#testBack').click();
  await page.waitForSelector('#parentClose');
  assert.match(await page.textContent('.phdr'), /chef/);
  assert.match(await page.textContent('.phdr-test'), /Testdaten/, 'clearly marked: test data');
  await page.locator('#pRealData').click();
  assert.equal(await page.locator('#pRealData').count(), 0, 'back to real data: the device has the real child again');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('bq2_session')).user), 'mia');
  assert.ok(!(await page.textContent('.phdr')).includes('mia'), 'the admin does not see the child without a grant (S11 P3/P4)');
  // play again, come back, log out: the device goes back to the real child
  await testkindSpielen(page); await page.locator('#testBack').click();
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
  await testkindSpielen(page); await page.locator('#testBack').click();
  await page.waitForSelector('.phdr-test');
  assert.ok(await page.locator('#pRealData').isVisible(), 'way back to real data');
  await page.locator('#parentClose').click();
  await page.waitForSelector('#login:not([hidden])');
  assert.equal(await page.evaluate(() => localStorage.getItem('bq2_session')), null, 'no test session left on the device');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('test child: the way back stays when the iPad sleeps and when the app is reopened', async () => {
  const { ctx, page } = await oeffnen();
  await anmelden(page, 'adult', 'chef', CODES.chef); await passwortSetzen(page, 'langes-passwort');
  await page.waitForSelector('#parentClose');
  await testkindSpielen(page);
  await page.waitForSelector('#testBack');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  assert.ok(await page.locator('#testBack').isVisible(), 'still there after sleep');
  await page.reload(); await page.waitForSelector('#testBack');
  await page.locator('#testBack').click(); await page.waitForSelector('#parentClose');
  await ctx.close();
});

test('grown-up stays logged in: no timer, not when the iPad sleeps, not when the app is reopened; only "Abmelden" ends it', async () => {
  const { ctx, page } = await oeffnen();
  await page.clock.install();
  await anmelden(page, 'student', 'mia', CODES.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'papa', CODES.papa); await passwortSetzen(page, 'langes-passwort');
  await page.waitForSelector('#parentClose');
  await page.clock.fastForward(60 * 60 * 1000);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  assert.ok(await page.locator('.psubject').count(), 'still logged in after an hour and sleep');
  await page.reload(); await page.waitForSelector('#parentClose');
  assert.ok(await page.locator('.psubject').count(), 'still logged in after reopening');
  await page.locator('#parentClose').click();
  await page.waitForSelector('#home:not([hidden])');
  assert.equal(await page.evaluate(() => localStorage.getItem('bq2_adultSession')), null);
  await page.reload(); await page.waitForSelector('#home:not([hidden])');
  assert.equal(await page.locator('#parentClose').count(), 0, 'after log-out the child is there again');
  // "Grown-ups" asks for the login again
  await page.locator('#adultBtn').click();
  assert.ok(await page.locator('#loginUser').isVisible());
  await ctx.close();
});

/* Peter 31.10.: DE/EN must work everywhere in the grown-ups branch (meaning-based, American English). */
async function allesSichtbar(page) {
  for (const id of ['sheets', 'support', 'concept']) { const d = page.locator(`#aboutBody details.psec[data-psec="${id}"]`); if (!(await d.evaluate((e) => e.open))) await d.locator('summary').first().click(); }
  await page.$$eval('#aboutBody details', (d) => d.forEach((x) => (x.open = true)));
  const texte = [await page.locator('#about').innerText()];
  for (const s of await page.$$eval('[data-psubj]', (b) => [...new Set(b.map((x) => x.dataset.psubj))])) { await page.locator(`[data-psubj="${s}"]`).first().click(); texte.push(await page.locator('#about').innerText()); await page.locator('#pBack').click(); }
  const infos = async () => { for (const k of await page.$$eval('#aboutBody .info-btn', (b) => [...new Set(b.map((x) => x.dataset.help))])) { await page.locator(`#aboutBody .info-btn[data-help="${k}"]`).first().click(); texte.push(await page.locator('#helpDlg').innerText()); await page.locator('#helpClose').click(); } };
  await infos();
  // ⚙ settings (B1): the child's settings, backup, grants, about the app
  await page.locator('#pSettings').click(); await page.waitForSelector('#pSetBack');
  await page.$$eval('#aboutBody details', (d) => d.forEach((x) => (x.open = true)));
  texte.push(await page.locator('#about').innerText());
  await infos();
  await page.locator('#pSetBack').click(); await page.waitForSelector('#pSetBack', { state: 'detached' });
  // ? help (B2): the guide
  await page.locator('#pHelp').click(); await page.waitForSelector('#pHelpBack');
  texte.push(await page.locator('#about').innerText());
  await infos();
  await page.locator('#pHelpBack').click(); await page.waitForSelector('#pHelpBack', { state: 'detached' });
  return texte.join('\n').split('\n');
}
test('language: the English grown-ups area has no German left-overs, the German one no English UI labels', async () => {
  const { ctx, page, fehler } = await oeffnen({ viewport: { width: 1200, height: 900 } });
  await page.evaluate((ns) => localStorage.setItem(ns + 'attempts', JSON.stringify(Array.from({ length: 30 }, (_, i) => ({ day: '2026-10-' + (10 + i % 6), skill: i % 2 ? 'round' : 'units', level: 2, attempt: 1, ok: i % 3 !== 0, help: false })))), NS('mia'));
  await kindDann(page, 'papa', 'langes-passwort');
  await page.locator('.phdr [data-plang="en"]').click();
  // German example sentences for the German-class quest are meant to stay German
  const en = (await allesSichtbar(page)).filter((z) => !/Grundschulkönig|Van der Kleij|Als Erstes|schneidet man|faltet man/.test(z));
  assert.deepEqual(en.filter((z) => /[äöüÄÖÜß]|\b(und|der|die|das|Sie|nicht|ist|mit|für|oder|eine|wie|auf|bei)\b/.test(z)), [], 'German in the English view');
  assert.deepEqual(en.filter((z) => /practis(ed|ing)|colours?\b|judgement/.test(z) && !/Practise Today/.test(z)), [], 'American English');
  await page.locator('.phdr [data-plang="de"]').click();
  const de = (await allesSichtbar(page)).join('\n');
  for (const w of ['Practice sheets', 'For your child', 'Delete details', 'Sheet from', 'Check for a new version', 'Optional calendar', 'Profile details', 'Pisolala stories', 'Supporting the way', 'Research informs the design', 'Private sources']) assert.ok(!de.includes(w), 'English in the German view: ' + w);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('whose data: grown-ups see only their own children; without their data on this device a clear note; with it the overview at once (E2)', async () => {
  const { ctx, page, fehler } = await oeffnen();
  await page.evaluate(() => localStorage.setItem('bq2_total', '9'));   // old practice on this device without login
  await anmelden(page, 'adult', 'papa', CODES.papa); await passwortSetzen(page, 'langes-passwort');
  await page.waitForSelector('#parentClose');
  assert.match(await page.textContent('#pKid'), /keine Daten Ihrer Kinder auf diesem Gerät/);
  assert.match(await page.textContent('.pnokid'), /Meine Kinder/);
  assert.match(await page.textContent('.pnokid'), /mia[\s\S]*Daten auf dem Gerät des Kindes/);
  assert.equal(await page.locator('.psubject').count(), 0, 'no overview of data that are not the child’s');
  assert.equal(await page.locator('details.psec[data-psec="sheets"]').count(), 0, 'no child chapters without the child’s data');
  await page.locator('.phdr [data-plang="en"]').click();
  assert.match(await page.textContent('#pKid'), /none of your children/);
  await page.locator('.phdr [data-plang="de"]').click();
  await page.locator('#parentClose').click();
  // with the child logged in: name in the header, overview there
  await anmelden(page, 'student', 'mia', CODES.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.locator('#adultBtn').click();
  await page.locator('#loginUser').fill('papa'); await page.locator('#loginPw').fill('langes-passwort'); await page.locator('#loginGo').click();
  await page.waitForSelector('#parentClose');
  assert.match(await page.textContent('#pKid'), /mia/);
  assert.equal(await page.locator('.pnokid').count(), 0);
  assert.ok(await page.locator('.psubject').count());
  // E2: nobody logged in, the child's data on the device: the grown-up sees them right after logging in
  await page.locator('#parentClose').click();
  await page.waitForSelector('#home:not([hidden])');
  await page.locator('#logoutBtn').click();
  await anmelden(page, 'adult', 'papa', 'langes-passwort');
  await page.waitForSelector('#parentClose');
  assert.match(await page.textContent('#pKid'), /mia/);
  assert.ok(await page.locator('.psubject').count(), 'overview with 0 taps after the login');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('teacher sees observations read-only: no focus, settings, profile or sheet entry', async () => {
  const { ctx, page } = await oeffnen();
  // S11 P4: a teacher sees a child only with a grant from its parents
  await anmelden(page, 'student', 'mia', CODES.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  const heute = new Date(), tag = (d) => d.toISOString().slice(0, 10);
  await page.evaluate(([ns, g]) => localStorage.setItem(ns + 'grants', JSON.stringify([g])), [NS('mia'), { id: 'g1', grantee: ID('frau'), scope: ['learning', 'school'], from: tag(heute), until: tag(new Date(Date.now() + 13 * 864e5)), by: ID('papa') }]);
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'frau', CODES.frau); await passwortSetzen(page, 'lehrkraft-123');
  await page.waitForSelector('#parentClose');
  const t = await page.textContent('#aboutBody');
  assert.ok(t.includes('Lehrkraft-Ansicht') && t.includes('Einschätzung'));
  assert.ok((await page.locator('.phdr #pHelp').count()) === 1 && t.includes('So unterstützen Sie Ihr Kind') && t.includes('Das Konzept von Big Quest'), 'support, concept and the guide (?) in the grown-ups area');
  for (const sel of ['#focusForm', '#storyCap', '#profileDelete', '#reminderForm', 'button[data-res]']) assert.equal(await page.locator(sel).count(), 0, sel);
  await page.locator('[data-psubj="maths"]').click();
  assert.ok(await page.locator('details.phelpq').count(), 'teacher sees the help');
  assert.equal(await page.locator('[data-psheetq]').count(), 0, 'no sheet making for teachers');
  await ctx.close();
});

test('accounts file is checked; the build puts accounts only into the vault, never a start code', async () => {
  assert.throws(() => kontenPruefen({ ...KONTEN, users: [{ ...KONTEN.users[0], code: 'ABCD-EFGH' }, ...KONTEN.users.slice(1)] }), /Klartext/);
  assert.throws(() => kontenPruefen({ version: 2, users: [KONTEN.users[0]], guardians: [] }), /Erwachsenenkonto/);
  assert.throws(() => kontenPruefen({ ...KONTEN, guardians: [{ adult: KONTEN.users[1].id, child: 'p_00000000000000000000000000' }] }), /unbekannter Kennung/);
  assert.throws(() => kontenPruefen({ users: KONTEN.users }), /Version 2/);
  assert.match(codeErzeugen(), /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  const ziel = await fs.mkdtemp(path.join(os.tmpdir(), 'bq-konten-'));
  await distBauen(TEST_PW, { ziel, konten: KONTEN, schule: null, version: { n: 1, hash: 'abcdef1', date: '31.10.2026 08:00', draft: false } });
  const html = await fs.readFile(path.join(ziel, 'index.html'), 'utf8');
  const klar = Buffer.from(await entschluesseln(tresorAusHuelle(html), TEST_PW)).toString('utf8');
  assert.ok(klar.includes('"user":"papa"'));
  for (const c of Object.values(CODES)) assert.ok(!klar.includes(c) && !klar.includes(normCode(c)), 'no start code in the app');
  for (const n of ['papa', 'frau', '"mia"']) assert.ok(!ohneTresor(html).includes(n), 'no user name in the public shell');
});

test('Meine Kinder (B1 behoben): Eltern waehlen nur zwischen ihren eigenen Kindern, ohne Kind-Anmeldung; ein fremdes Kind und das Testkind erscheinen nie; der Admin sieht nur das Testkind', async () => {
  const { ctx, page, fehler } = await oeffnen();
  const tag = (b) => { const d = new Date(); d.setDate(d.getDate() - b); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const tage = (n) => Array.from({ length: n }, (_, i) => ({ day: tag(i + 1), skill: 'round', level: 2, attempt: 1, ok: true, help: false }));
  for (const [kind, pw, n] of [['mia', 'Tiger-Lamp-River-4271', 3], ['tim', 'Bear-Kite-Snow-2222', 1], ['probe', 'Fox-Kite-Rain-2468', 2], ['lia', 'Owl-Cake-Moon-1357', 5]]) {
    await anmelden(page, 'student', kind, CODES[kind]); await passwortSetzen(page, pw);
    await page.evaluate(([ns, a]) => localStorage.setItem(ns + 'attempts', JSON.stringify(a)), [NS(kind), tage(n)]);
    if (kind !== 'lia') await page.locator('#logoutBtn').click();
  }
  // lia (not papa's child) is logged in on the device
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'papa', CODES.papa); await passwortSetzen(page, 'langes-passwort');
  await page.waitForSelector('#parentClose');
  // B5: a list from two children on
  assert.deepEqual(await page.$$eval('#pKidSel option', (o) => o.map((x) => x.value)), ['mia', 'tim'], 'only own children: no lia (B1), no test child');
  assert.equal(await page.$eval('#pKidSel', (s) => s.value), 'mia', 'the logged-in child is not his: his first child is shown');
  const zeile = async () => page.textContent('#pSummary');
  assert.match(await zeile(), /an 3 Tagen geübt/);
  await page.selectOption('#pKidSel', 'tim');
  await page.waitForFunction(() => document.querySelector('#pKidSel')?.value === 'tim');
  assert.match(await zeile(), /an 1 Tag geübt/);
  assert.ok(!/an 5 Tagen geübt/.test(await zeile()) && !(await page.textContent('.phdr')).includes('lia'), 'nothing of lia');
  // leaving: the device still belongs to the child logged in (lia), nothing was switched
  await page.locator('#parentClose').click();
  await page.waitForSelector('#home:not([hidden])');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('bq2_session')).user), 'lia');
  // the admin: only the test child
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'chef', CODES.chef); await passwortSetzen(page, 'langes-passwort');
  await page.waitForSelector('#parentClose');
  assert.equal(await page.locator('#pKidSel').count(), 0, 'one child only: no choice');
  assert.match(await page.textContent('#pKid'), /probe/);
  assert.match(await page.textContent('.phdr-test'), /Testdaten/);
  assert.deepEqual(fehler, []);
  await ctx.close();
});
