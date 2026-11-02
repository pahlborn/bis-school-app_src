// S11 Stufe 1, Phase P3: Passwortregeln mit Merkpasswort, Erneuern schwacher Passwoerter, "Who's here?"
// fuer Geschwister, Kennzeichnung fuer den Passwortspeicher, Kinderhilfe. Kriterien K7 und K8 (K2, K3 und
// B1: tests/anmeldung.test.mjs und tests/stufe1-ist.test.mjs).
//   node --test tests/stufe1-p3.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { pbkdf2Hex } from '../werkzeug/konten.mjs';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'MIAA-2345', lia: 'LIAA-2345', papa: 'PAPA-2345' };
const KONTEN = { users: [await konto('mia', 'student', C.mia), await konto('lia', 'student', C.lia), await konto('papa', 'parent', C.papa, { kinder: ['mia', 'lia'] })] };
const STARK = { mia: 'Tiger-Lamp-River-4271', lia: 'Owl-Cake-Moon-1357' };

let browser, server;
before(async () => {
  browser = await browserStarten();
  server = await kontenServer(KONTEN);
});
after(async () => { await browser?.close(); server?.close(); });

// The password rules themselves (weak list, suggestions, 40 bits) are tested without a browser:
// tests/module/passwort.test.mjs. Here: how the app uses them.

test('erstes Passwort: Vorschlag uebernehmen, Felder fuer den Passwortspeicher gekennzeichnet, zu kurz abgelehnt', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await page.locator('#roleStudent').click();
  assert.equal(await page.getAttribute('#loginUser', 'autocomplete'), 'username');
  assert.equal(await page.getAttribute('#loginPw', 'autocomplete'), 'current-password');
  await page.locator('#loginUser').fill('mia'); await page.locator('#loginPw').fill(C.mia); await page.locator('#loginGo').click();
  await page.waitForSelector('#setPwForm');
  assert.equal(await page.getAttribute('#setPwForm input[autocomplete="username"]', 'value'), 'mia', 'the password manager knows whose password it is');
  assert.equal(await page.getAttribute('#newPw1', 'autocomplete'), 'new-password');
  await page.locator('#newPw1').fill('mond1234'); await page.locator('#newPw2').fill('mond1234'); await page.locator('#setPwGo').click();
  assert.match(await page.textContent('#setPwMsg'), /strong password keeps your things safe/);
  const v1 = await page.textContent('#pwSugg');
  await page.locator('#pwAnother').click();
  assert.notEqual(await page.textContent('#pwSugg'), v1);
  await page.locator('#pwUse').click();
  const v2 = await page.textContent('#pwSugg');
  assert.equal(await page.inputValue('#newPw1'), v2); assert.equal(await page.inputValue('#newPw2'), v2);
  await page.locator('#setPwGo').click();
  await page.waitForSelector('#welcomeGo');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('bestehendes schwaches Passwort wird einmal erneuert, danach gilt nur das neue', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, STARK.mia);
  await page.waitForSelector('#home:not([hidden])');
  // an old 4-character password from before S11 P3
  const salt = Array.from({ length: 16 }, (_, i) => 50 + i), hash = await pbkdf2Hex('mond', salt);
  await page.evaluate(([s, h]) => { const id = JSON.parse(localStorage.getItem('bq2_session')).id; localStorage.setItem('bq2_pw_' + id, JSON.stringify({ salt: s, hash: h })); }, [salt, hash]);
  await page.locator('#logoutBtn').click();
  await anmelden(page, 'student', 'mia', 'mond');
  await page.waitForSelector('#setPwForm');
  assert.match(await page.textContent('#loginBody h2'), /stronger password/);
  await page.locator('#pwUse').click();
  const neu = await page.textContent('#pwSugg');
  await page.locator('#setPwGo').click();
  await page.waitForSelector('#home:not([hidden])');
  await page.locator('#logoutBtn').click();
  await anmelden(page, 'student', 'mia', 'mond');
  await page.waitForFunction(() => /not right/.test(document.querySelector('#loginMsg').textContent));
  await page.locator('#loginPw').fill(neu); await page.locator('#loginGo').click();
  await page.waitForSelector('#home:not([hidden])');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test("Who's here?: Geschwister waehlen sich aus, das Passwort wird trotzdem verlangt; Daten getrennt (K8)", async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  for (const k of ['mia', 'lia']) {
    await anmelden(page, 'student', k, C[k]); await passwortSetzen(page, STARK[k]);
    await page.waitForSelector('#home:not([hidden])');
    await page.evaluate(([n, t]) => { const id = JSON.parse(localStorage.getItem('bq2_session')).id; localStorage.setItem('bq2_' + id + '__name', JSON.stringify(n)); localStorage.setItem('bq2_' + id + '__total', String(t)); }, k === 'mia' ? ['Mia', 11] : ['Lia', 22]);
    await page.locator('#logoutBtn').click();
  }
  await page.locator('#roleStudent').click();
  const wahl = await page.$$eval('[data-kidpick]', (b) => b.map((x) => x.textContent.trim()));
  assert.deepEqual(wahl.map((t) => t.replace(/^\S+\s/, '')), ['Mia', 'Lia'], 'children of this device, with their names');
  await page.locator('[data-kidpick="lia"]').click();
  assert.equal(await page.inputValue('#loginUser'), 'lia');
  assert.equal(await page.inputValue('#loginPw'), '', 'the password is still needed');
  await page.locator('#loginPw').fill(STARK.mia); await page.locator('#loginGo').click();
  await page.waitForFunction(() => /not right/.test(document.querySelector('#loginMsg').textContent));
  await page.locator('#loginPw').fill(STARK.lia); await page.locator('#loginGo').click();
  await page.waitForSelector('#home:not([hidden])');
  assert.equal(await page.textContent('#totalStars'), '22', "lia's stars, nothing of mia");
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Kinderhilfe nennt die drei Saetze zum Passwort; die Erwachsenenanleitung die 12 Zeichen', async () => {
  const { ctx, page } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, STARK.mia);
  await page.waitForSelector('#home:not([hidden])');
  await page.locator('#guideBtn').click();
  const t = await page.textContent('#aboutBody');
  for (const s of ['Your password is only for you.', 'Don’t tell friends.', 'Your grown-ups can help if you forget it.']) assert.ok(t.includes(s), s);
  await ctx.close();
});
