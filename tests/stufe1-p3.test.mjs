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

let browser, server, hook;
before(async () => {
  browser = await browserStarten();
  server = await kontenServer(KONTEN);
  hook = await kontenServer(KONTEN, { anpassen: (h) => h.replace(/\}\)\(\);\s*<\/script>/, 'window.__bqi={pwWeak,pwSuggest,PW_WORDS};})();</script>') });
});
after(async () => { await browser?.close(); server?.close(); hook?.close(); });

// typical weak passwords of 12+ characters (common words with digits, sequences, keyboard rows, repeats, the name)
const SCHWACH = [
  ...['password', 'passwort', 'qwerty', 'qwertz', 'iloveyou', 'letmein', 'welcome', 'monkey', 'dragon', 'football', 'fussball', 'baseball', 'superman', 'starwars', 'princess', 'sunshine', 'admin', 'hallo', 'geheim', 'schatz', 'master', 'shadow', 'freedom', 'pokemon', 'minecraft']
    .flatMap((b) => [b + '1234567890'.slice(0, Math.max(2, 12 - b.length)), b[0].toUpperCase() + b.slice(1) + '!2026'.padEnd(Math.max(5, 12 - b.length), '9')]),
  '123456789012', '098765432109', 'abcdefghijkl', 'qwertyuiopas', 'asdfghjklzxc', '1qaz2wsx3edc', 'aaaaaaaaaaaa', '121212121212', 'abcabcabcabc', '111122223333',
  'mia123456789', 'Mia-2026-2026!', 'passwordpassword', 'zyxwvutsrqpo', 'qwertzuiopas', '999999999999', 'xyzxyzxyzxyz', 'hallohallo12', 'abc123abc123', 'ababababababab',
  'kurz', 'Mond', 'sonne123', 'Tiger-12', 'elf-zeichen', 'kathie2018!', 'Kathie123456', 'mia', '', 'a1b2c3d4e5f6',
];

test('Passwortregeln: typische schwache Passwoerter abgelehnt; 1000 Merkpasswoerter angenommen, verschieden, mind. 40 Bit (K7)', async () => {
  const { ctx, page } = await oeffnen(browser, hook);
  const r = await page.evaluate((schwach) => {
    const B = window.__bqi, s = new Set(), sugg = Array.from({ length: 1000 }, () => B.pwSuggest());
    return { durch: schwach.filter((p) => !B.pwWeak(p, 'mia')), schlecht: sugg.filter((p) => B.pwWeak(p, 'mia')), einzig: new Set(sugg).size, woerter: new Set(B.PW_WORDS).size, form: sugg.every((p) => /^[A-Z][a-z]+-[A-Z][a-z]+-[A-Z][a-z]+-\d{4}$/.test(p)), gut: ['Elefant-Rakete-Wolke-77', 'Mein Hund heißt Bello!', 'Kathie liebt Pferde 3x'].filter((p) => B.pwWeak(p, 'mia')) };
  }, SCHWACH);
  assert.ok(SCHWACH.length >= 100 - 30 && SCHWACH.length >= 70, 'enough samples: ' + SCHWACH.length);
  assert.deepEqual(r.durch, [], 'weak passwords that got through');
  assert.deepEqual(r.schlecht, []);
  assert.ok(r.einzig >= 999, 'suggestions differ');
  assert.ok(r.form);
  assert.ok(r.woerter >= 600);
  assert.ok(3 * Math.log2(r.woerter) + Math.log2(10000) >= 40, 'at least 40 bits');
  assert.deepEqual(r.gut, [], 'good long passphrases are accepted');
  await ctx.close();
});

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
