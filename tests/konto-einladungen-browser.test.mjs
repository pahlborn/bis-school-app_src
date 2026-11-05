// Aufgabe "Einladungen - Oberflaeche" im Browser (Chromium): nur die Bedienwege - ⚙ oeffnen, Abschnitt "Familie"
// aufklappen, Kind anlegen, Start-QR-Code sichtbar und mit dem richtigen Startlink, das Kind wartet und geht von selbst
// weiter (echte Zeitgeber: QR-Code-Takt der Eltern, Warte-Takt des Kindes), Felder fuer den Passwortspeicher beim
// Schluessel-Erneuern, "Schliessen" ohne Abmelden. Die Logik mit mehreren Geraeten: tests/konto-einladungen.test.mjs.
// Speicher: der nachgebaute GitHub-Server (Weg der Testinstanz).
//   node --test tests/konto-einladungen-browser.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten } from './app-hilfen.mjs';
import { githubNachbau } from './module/github-nachbau.mjs';
import { githubSpeicher } from '../src/module/github.mjs';
import { startcodeAusstellen, ersteAnmeldung } from '../src/module/konto.mjs';
import { anmStartlink } from '../src/module/anmeldung.mjs';
import { qrSvg } from '../src/module/qrcode.mjs';
import { keyFingerprint } from '../src/module/krypto.mjs';

const REPO = 'pahlborn/bis-school-app-testdaten';
const TOKEN = 'github_pat_TESTTOKEN_' + 'q8Rt'.repeat(10);
let N, server, browser, startP;

before(async () => {
  N = await githubNachbau({ token: TOKEN, repos: [REPO] });
  const z = githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis }).geraet('d_Werkzeug1');
  const sc = await startcodeAusstellen({ zugang: z, aussteller: null, anmeldename: 'admin', art: 'admin', now: Date.now() });
  const admin = await ersteAnmeldung({ zugang: z, code: sc.code, passwort: 'Werkzeug-Admin-Passwort-1', now: Date.now(), runden: 1000 });
  startP = await startcodeAusstellen({ zugang: z, aussteller: admin, anmeldename: 'peter.a', art: 'parent', now: Date.now() });
  const speicher = JSON.stringify({ art: 'github', repo: REPO, wurzel: '', basis: N.basis });
  server = await appServer({ bauart: 'test', anpassen: (h) => h.replace('/*BQ_SPEICHER*/null', () => speicher) });
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); await N?.schliessen(); });

async function geraet() {
  const ctx = await browser.newContext();
  await ctx.route('**/*', (r) => (r.request().url().startsWith(server.url) || r.request().url().startsWith(N.basis) ? r.continue() : r.abort()));
  await ctx.addInitScript(() => { window.AudioContext = undefined; window.webkitAudioContext = undefined; });
  const page = await ctx.newPage(), fehler = [];
  page.on('pageerror', (e) => fehler.push(e.message));
  return { ctx, page, fehler };
}
async function zugang(page) { await page.locator('#kontoToken').fill(TOKEN); await page.locator('#kontoTokenGo').click(); await page.waitForSelector('#kontoTokenForm', { state: 'detached' }); }
const attr = (page, sel) => page.locator(sel).evaluate((e) => ({ autocomplete: e.getAttribute('autocomplete'), name: e.getAttribute('name'), type: e.type }));

test('Browser: Kind anlegen -> Start-QR-Code -> Kind wartet und geht von selbst weiter; Schluessel erneuern (Felder); Schliessen ohne Abmelden', async () => {
  const P = await geraet();
  const linkP = anmStartlink(server.url, { anmeldename: 'peter.a', code: startP.code, fingerabdruck: startP.fingerabdruck });
  await P.page.goto(linkP);
  await zugang(P.page);
  await P.page.locator('#roleAdult').click();
  await P.page.locator('#loginGo').click();
  await P.page.locator('#pwUse').click(); await P.page.locator('#setPwGo').click();
  await P.page.waitForSelector('#recGo', { timeout: 30000 }); await P.page.locator('#recGo').click();
  await P.page.locator('#welcomeGo').click();
  await P.page.waitForSelector('#parentLeave');

  // ⚙ -> Abschnitt "Familie" aufklappen -> Kind anlegen
  await P.page.locator('#pSettings').click();
  await P.page.locator('details.psec[data-psec="family"] > summary').click();
  await P.page.locator('#kKindAnlegen').click();
  await P.page.locator('#kKindName').fill('Kathie');
  await P.page.locator('#kKindWeiter').click();
  await P.page.waitForSelector('#kKindLogin');
  assert.equal(await P.page.locator('#kKindLogin').inputValue(), 'kathie');
  await P.page.locator('#kKindGo').click();
  await P.page.waitForSelector('#kQr svg', { timeout: 30000 });
  const box = await P.page.locator('#kQr svg').boundingBox();
  assert.ok(box.width >= 200 && Math.abs(box.width - box.height) < 2, 'QR-Code gross genug und quadratisch: ' + JSON.stringify(box));
  const code = (await P.page.locator('#kCode').textContent()).trim();
  const pub = await P.page.evaluate(() => new Promise((res) => { const r = indexedDB.open('bq2_konto', 1); r.onsuccess = () => { const q = r.result.transaction('schluessel').objectStore('schluessel').getAll(); q.onsuccess = () => { res(q.result[0].pub); r.result.close(); }; }; }));
  const linkK = anmStartlink(server.url, { anmeldename: 'kathie', code, fingerabdruck: await keyFingerprint(pub) });
  const d = await P.page.locator('#kQr path').getAttribute('d');
  assert.equal(d, /<path fill="#000" d="([^"]*)"/.exec(qrSvg(linkK, { ecc: 'M', rand: 4 }))[1], 'der QR-Code traegt den Startlink mit Peters Pruefwoertern');
  assert.match(await P.page.locator('#kQrStatus').textContent(), /Warte auf die erste Anmeldung/);

  // das Kind: QR-Link -> Zugang -> Student -> Passwort -> wartet -> geht von selbst weiter (Takte beider Geraete)
  const K = await geraet();
  await K.page.goto(linkK);
  await zugang(K.page);
  await K.page.locator('#roleStudent').click();
  await K.page.locator('#loginGo').click();
  await K.page.locator('#pwUse').click(); await K.page.locator('#setPwGo').click();
  await K.page.waitForSelector('#welcomeGo', { timeout: 60000 });
  await K.page.locator('#welcomeGo').click();
  await K.page.waitForSelector('#home:not([hidden])');
  await P.page.waitForFunction(() => /✓ Kathie ist angemeldet/.test(document.querySelector('#kQrStatus')?.textContent || ''), null, { timeout: 30000 });
  assert.equal(await P.page.locator('#kQrWeg').count(), 0);
  await P.page.locator('#kQrFertig').click();

  // ⚙ "Meine Geraete" -> Schluessel erneuern: Felder fuer den Passwortspeicher
  await P.page.locator('details.psec[data-psec="devices"] > summary').click();
  assert.match(await P.page.locator('details.psec[data-psec="devices"]').textContent(), /Meine Geräte[\s\S]*\(dieses Gerät\)/);
  await P.page.locator('#kErneuern').click();
  await P.page.waitForSelector('#kErnForm');
  assert.deepEqual(await attr(P.page, '#kErnForm input[autocomplete="username"]'), { autocomplete: 'username', name: 'username', type: 'text' });
  assert.deepEqual(await attr(P.page, '#kErnAlt'), { autocomplete: 'current-password', name: null, type: 'password' });
  assert.equal(await P.page.locator('#kErnForm input[autocomplete="new-password"]').count(), 2);
  await P.page.locator('#kBack').click();

  // Schliessen: auf Peters eigenem Geraet (kein Kind hier) ohne Erinnerung zur Anmeldeseite; angemeldet geblieben
  await P.page.locator('#parentLeave').click();
  await P.page.waitForSelector('#login:not([hidden])');
  await P.page.locator('#roleAdult').click();
  await P.page.waitForSelector('#parentLeave');
  assert.deepEqual(P.fehler, []); assert.deepEqual(K.fehler, []);
  await P.ctx.close(); await K.ctx.close();
});
