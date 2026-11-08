// Aufgabe "Anmeldung im Testbau" im Browser (Chromium): nur die Bedienwege und die Kennzeichnung der Felder fuer den
// Passwortspeicher. Die Logik mit mehreren Geraeten steht in tests/konto-anmeldung.test.mjs (Node-Sandbox).
// Speicher: der nachgebaute GitHub-Server (tests/module/github-nachbau.mjs) - also der Weg der Testinstanz mit
// Zugangsschluessel, ohne Netz.
//   node --test tests/konto-anmeldung-browser.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { appServer, browserStarten } from './app-hilfen.mjs';
import { githubNachbau } from './module/github-nachbau.mjs';
import { githubSpeicher } from '../src/module/github.mjs';
import { startcodeAusstellen, ersteAnmeldung } from '../src/module/konto.mjs';

const REPO = 'pahlborn/bis-school-app-testdaten';
const TOKEN = 'github_pat_TESTTOKEN_' + 'k3Wd'.repeat(10);      // nur im Nachbau gueltig
let N, server, browser, code;

before(async () => {
  N = await githubNachbau({ token: TOKEN, repos: [REPO] });
  const z = githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis }).geraet('d_Werkzeug1');
  const sc = await startcodeAusstellen({ zugang: z, aussteller: null, anmeldename: 'admin', art: 'admin', now: Date.now() });
  const admin = await ersteAnmeldung({ zugang: z, code: sc.code, passwort: 'Werkzeug-Admin-Passwort-1', now: Date.now(), runden: 1000 });
  code = (await startcodeAusstellen({ zugang: z, aussteller: admin, anmeldename: 'peter.a', art: 'parent', now: Date.now() })).code;
  const speicher = JSON.stringify({ art: 'github', repo: REPO, wurzel: '', basis: N.basis });
  server = await appServer({ bauart: 'test', anpassen: (h) => h.replace('/*BQ_SPEICHER*/null', () => speicher) });
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); await N?.schliessen(); });

/* ein Geraet: eigener Browser-Kontext; nur App und Nachbau erreichbar; kein Teilen-Menue (Desktop) -> Download */
async function geraet() {
  const ctx = await browser.newContext({ acceptDownloads: true });
  await ctx.route('**/*', (r) => (r.request().url().startsWith(server.url) || r.request().url().startsWith(N.basis) ? r.continue() : r.abort()));
  await ctx.addInitScript(() => { window.AudioContext = undefined; window.webkitAudioContext = undefined; try { Object.defineProperty(navigator, 'canShare', { value: undefined }); } catch (e) { /* egal */ } });
  const page = await ctx.newPage(), fehler = [];
  page.on('pageerror', (e) => fehler.push(e.message));
  return { ctx, page, fehler };
}
const attr = (page, sel) => page.locator(sel).evaluate((e) => ({ autocomplete: e.getAttribute('autocomplete'), name: e.getAttribute('name'), type: e.type, value: e.value, readOnly: e.readOnly }));
async function togglePruefen(page, id, wert, autocomplete) {
  const feld = page.locator('#' + id), knopf = page.locator(`[data-pw-toggle="${id}"]`);
  if (wert !== undefined) await feld.fill(wert);
  if (autocomplete) assert.equal(await feld.getAttribute('autocomplete'), autocomplete, id + ' autocomplete');
  assert.equal(await feld.getAttribute('type'), 'password', id + ' start');
  assert.equal(await knopf.getAttribute('aria-controls'), id);
  await knopf.click();
  assert.equal(await feld.getAttribute('type'), 'text', id + ' sichtbar');
  if (wert !== undefined) assert.equal(await feld.inputValue(), wert, id + ' Wert sichtbar');
  await knopf.click();
  assert.equal(await feld.getAttribute('type'), 'password', id + ' wieder verdeckt');
  if (wert !== undefined) assert.equal(await feld.inputValue(), wert, id + ' Wert verdeckt');
}
const idb = (page) => page.evaluate(() => new Promise((res, rej) => {
  const r = indexedDB.open('bq2_konto', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('schluessel', { keyPath: 'kennung' });
  r.onsuccess = () => { const q = r.result.transaction('schluessel').objectStore('schluessel').getAll(); q.onsuccess = () => { const l = q.result.map((x) => ({ kennung: x.kennung, art: x.art, privat: [x.schluessel.ecdh.privateKey, x.schluessel.ecdsa.privateKey].map((k) => ({ typ: k.type, exportierbar: k.extractable })) })); r.result.close(); res(l); }; };
  r.onerror = () => rej(r.error);
}));
const imElternbereich = (page) => page.waitForSelector('#about:not([hidden])');

test('Browser: Startlink -> Zugang -> Rolle -> eigenes Passwort -> Wiederherstellungscode (Passwortspeicher, Datei) -> Elternbereich; Schluessel nicht exportierbar; Neuladen bleibt angemeldet; Abmelden', async () => {
  const { ctx, page, fehler } = await geraet();
  // ein Startlink OHNE Zugangscode auf einem Geraet ohne Zugangscode: zuerst "Geraet verbinden" - danach geht es mit dem
  // Startlink weiter (Aufgabe "Erstanmeldung per QR-Code")
  await page.goto(server.url + '#start=peter.a/' + code);
  await page.waitForSelector('#verbinden');
  assert.equal(await page.evaluate(() => location.hash), '', 'Startcode sofort aus der Adresse entfernt');
  await page.locator('#verbLink').fill(TOKEN);
  await page.locator('#verbGo').click();
  // eigenes Passwort ohne Rollenwahl: Anmeldename fest, ein Feld "new-password" (fest im HTML) -> der Passwortspeicher speichert "peter.a"
  await page.waitForSelector('#kontoNeuForm', { state: 'visible', timeout: 30000 });
  assert.equal(await page.evaluate(() => location.hash), '', 'Zugangscode und Startcode wieder aus der Adresse');
  assert.match(await page.locator('#kontoNeuOk').textContent(), /^✅ (Device connected|Gerät verbunden)\.$/);
  const u = await attr(page, '#kontoNeuName');
  assert.deepEqual([u.value, u.name, u.autocomplete, u.readOnly], ['peter.a', 'username', 'username', true]);
  assert.equal(await page.locator('input[autocomplete="new-password"]').count(), 1);
  assert.equal(await page.locator('input[type="password"]').count(), 1, 'nur dieses eine Passwortfeld in der Seite');
  await page.locator('#kontoNeuUse').click();
  const pw = await page.locator('#kontoNeuPw').inputValue();
  await page.locator('#kontoNeuGo').click();

  // Wiederherstellungscode: sichtbar, eigener Eintrag im Passwortspeicher, als Datei
  await page.waitForSelector('#recCode', { timeout: 30000 });
  const rc = (await page.locator('#recCode').textContent()).trim();
  assert.match(rc, /^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){4}$/);
  assert.ok(await page.locator('#recCode').isVisible());
  assert.deepEqual(await attr(page, '#recUser'), { autocomplete: 'username', name: 'username', type: 'text', value: 'peter.a (Wiederherstellungscode)', readOnly: true });
  assert.deepEqual(await attr(page, '#recPw'), { autocomplete: 'new-password', name: 'password', type: 'password', value: rc, readOnly: true });
  assert.equal(await page.locator('#recForm').evaluate((f) => f.contains(document.querySelector('#recUser')) && f.contains(document.querySelector('#recPw')) && f.querySelector('button[type="submit"]').id), 'recSave', 'beide Felder und der Knopf in EINEM Formular');
  assert.equal(await page.locator('label[for="recPw"]').textContent(), 'Wiederherstellungscode');
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#recFile').click()]);
  assert.equal(download.suggestedFilename(), 'Big-Quest-Wiederherstellungscode-peter.a.txt');
  const inhalt = await fs.readFile(await download.path(), 'utf8');
  assert.ok(inhalt.includes(rc) && inhalt.includes('peter.a') && !inhalt.includes(pw), 'Datei: Code und Name, kein Passwort');
  await page.locator('#recSave').click();
  await page.waitForSelector('#recSaved');
  assert.equal(await page.locator('#recForm').count(), 0, 'Formular nach dem Absenden weg (Passwortspeicher bietet an)');
  await page.locator('#recGo').click();
  await page.locator('#welcomeGo').click();
  await imElternbereich(page);

  // Schluesselkopie auf dem Geraet: nicht exportierbar; nichts Geheimes im localStorage
  const k = await idb(page);
  assert.equal(k.length, 1); assert.equal(k[0].art, 'parent');
  assert.deepEqual(k[0].privat, [{ typ: 'private', exportierbar: false }, { typ: 'private', exportierbar: false }]);
  const ls = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).filter(([n]) => n !== 'bqt_gh')));
  for (const g of [pw, rc, code]) assert.ok(!ls.includes(g), 'nichts Geheimes im localStorage');
  assert.equal(await page.evaluate(() => localStorage.getItem('bqt_gh')), TOKEN, 'Zugang unter bqt_gh');

  // neu laden: bleibt angemeldet (bis "Abmelden"), Schluessel bleiben
  await page.reload();
  await imElternbereich(page);
  assert.equal((await idb(page)).length, 1);
  await page.evaluate(() => document.querySelector('#logoutBtn').click());
  await page.waitForSelector('#login:not([hidden])');
  let rest = null;
  for (let i = 0; i < 50 && rest !== 0; i++) { rest = (await idb(page)).length; if (rest) await page.waitForTimeout(100); }
  assert.equal(rest, 0, 'nach dem Abmelden keine Schluesselkopie mehr auf dem Geraet');
  assert.deepEqual(fehler, []);
  await ctx.close();

  // anderes Geraet: Zugang, Name + Passwort; danach "Passwort vergessen?" mit dem Code
  const B = await geraet();
  await B.page.goto(server.url);
  await B.page.waitForSelector('#verbinden');
  await B.page.locator('#verbLink').fill(TOKEN); await B.page.locator('#verbGo').click();
  await B.page.locator('#roleAdult').click();
  await togglePruefen(B.page, 'loginPw', pw, 'current-password');
  await B.page.locator('#loginUser').fill('peter.a'); await B.page.locator('#loginPw').fill(pw);
  await B.page.locator('#loginGo').click();
  await imElternbereich(B.page);
  await B.page.evaluate(() => document.querySelector('#logoutBtn').click());
  await B.page.locator('#roleAdult').click();
  await B.page.locator('#loginForgot').click();
  assert.equal((await attr(B.page, '#forgotUser')).autocomplete, 'username');
  assert.deepEqual([(await attr(B.page, '#forgotCode')).autocomplete, (await attr(B.page, '#forgotCode')).type], ['current-password', 'password']);
  await togglePruefen(B.page, 'forgotCode', rc, 'current-password');
  await B.page.locator('#forgotUser').fill('peter.a (Wiederherstellungscode)');   // so fuellt der Passwortspeicher den eigenen Eintrag aus
  await B.page.locator('#forgotCode').fill(rc);
  await B.page.locator('#forgotGo').click();
  await B.page.waitForSelector('#setPwForm');
  assert.equal((await attr(B.page, '#setPwForm input[autocomplete="username"]')).value, 'peter.a', 'das neue Passwort gehoert zum Eintrag der Anmeldung');
  await togglePruefen(B.page, 'newPw1', 'Otter-Cake-Moss-1234', 'new-password');
  await togglePruefen(B.page, 'newPw2', 'Otter-Cake-Moss-1234', 'new-password');
  await B.page.locator('#pwUse').click(); await B.page.locator('#setPwGo').click();
  await imElternbereich(B.page);
  assert.equal(await B.page.locator('#loginBody #recCode').count(), 0, 'kein Rueckfall auf die Login-Seite');
  await B.page.waitForSelector('#aboutBody #recCode', { timeout: 30000 });
  assert.notEqual((await B.page.locator('#aboutBody #recCode').textContent()).trim(), rc, 'neuer Code');
  await B.page.locator('#aboutBody #recGo').click();
  await B.page.waitForSelector('#aboutBody #recCode', { state: 'detached', timeout: 30000 });
  assert.deepEqual(B.fehler, []);
  await B.ctx.close();
});
