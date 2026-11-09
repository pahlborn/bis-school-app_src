// Aufgabe "Einladungen - Oberflaeche" im Browser (Chromium): nur die Bedienwege - ⚙ oeffnen, Abschnitt "Familie"
// aufklappen, Kind anlegen, Start-QR-Code sichtbar und mit dem richtigen Startlink, das Kind wartet und geht von selbst
// weiter (echte Zeitgeber: QR-Code-Takt der Eltern, Warte-Takt des Kindes), Felder fuer den Passwortspeicher beim
// Schluessel-Erneuern, Start direkt in den Erwachsenenbereich auf dem eigenen Geraet und Abmelden. Die Logik mit
// mehreren Geraeten: tests/konto-einladungen.test.mjs.
// Speicher: der nachgebaute GitHub-Server (Weg der Testinstanz).
//   node --test tests/konto-einladungen-browser.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten } from './app-hilfen.mjs';
import { githubNachbau } from './module/github-nachbau.mjs';
import { githubSpeicher } from '../src/module/github.mjs';
import { startcodeAusstellen, ersteAnmeldung } from '../src/module/konto.mjs';
import { anmEinladungslink } from '../src/module/anmeldung.mjs';
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
/* Einladung geoeffnet (Aufgabe "Erstanmeldung per QR-Code"): Passwortformular ohne Rollenwahl, Merkpasswort, absenden */
async function registrieren(page) { await page.waitForSelector('#kontoNeuForm', { state: 'visible', timeout: 30000 }); await page.locator('#kontoNeuUse').click(); await page.locator('#kontoNeuGo').click(); }
const attr = (page, sel) => page.locator(sel).evaluate((e) => ({ autocomplete: e.getAttribute('autocomplete'), name: e.getAttribute('name'), type: e.type }));
async function togglePruefen(page, id, wert, autocomplete) {
  const feld = page.locator('#' + id), knopf = page.locator(`[data-pw-toggle="${id}"]`);
  await feld.fill(wert);
  assert.equal(await feld.getAttribute('autocomplete'), autocomplete, id + ' autocomplete');
  assert.equal(await feld.getAttribute('type'), 'password', id + ' start');
  await knopf.click();
  assert.equal(await feld.getAttribute('type'), 'text', id + ' sichtbar');
  assert.equal(await feld.inputValue(), wert, id + ' Wert sichtbar');
  await knopf.click();
  assert.equal(await feld.getAttribute('type'), 'password', id + ' wieder verdeckt');
  assert.equal(await feld.inputValue(), wert, id + ' Wert verdeckt');
}

test('Browser: Kind anlegen -> Start-QR-Code -> Kind wartet und geht von selbst weiter; Schluessel erneuern (Felder); eigenes Geraet startet direkt im Erwachsenenbereich', async () => {
  const P = await geraet();
  // die Einladung des Admins: Zugangscode und Startlink in einem Link
  const linkP = anmEinladungslink(server.url, { zugang: TOKEN, anmeldename: 'peter.a', code: startP.code, fingerabdruck: startP.fingerabdruck });
  await P.page.goto(linkP);
  await registrieren(P.page);
  await P.page.waitForSelector('#recGo', { timeout: 30000 }); await P.page.locator('#recGo').click();
  await P.page.locator('#welcomeGo').click();
  await P.page.waitForSelector('#parentClose');

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
  // der QR-Code traegt auch den Zugangscode des Elterngeraets: das Kindergeraet ist damit gleich verbunden
  const linkK = anmEinladungslink(server.url, { zugang: TOKEN, anmeldename: 'kathie', code, fingerabdruck: await keyFingerprint(pub) });
  const d = await P.page.locator('#kQr path').getAttribute('d');
  assert.equal(d, /<path fill="#000" d="([^"]*)"/.exec(qrSvg(linkK, { ecc: 'M', rand: 4 }))[1], 'der QR-Code traegt Zugangscode und Startlink mit Peters Pruefwoertern');
  assert.match(await P.page.locator('#kQrStatus').textContent(), /Warte auf die erste Anmeldung/);

  // das Kind: QR-Link -> verbunden, ohne Rollenwahl zum Passwort -> wartet -> geht von selbst weiter (Takte beider Geraete)
  const K = await geraet();
  await K.page.goto(linkK);
  await registrieren(K.page);
  await K.page.waitForSelector('#welcomeGo', { timeout: 60000 });
  await K.page.locator('#welcomeGo').click();
  await K.page.waitForSelector('#home:not([hidden])');
  await P.page.waitForFunction(() => /✓ Kathie ist angemeldet/.test(document.querySelector('#kQrStatus')?.textContent || ''), null, { timeout: 30000 });
  assert.equal(await P.page.locator('#kQrWeg').count(), 0);
  await P.page.locator('#kQrFertig').click();

  // ⚙ "Meine Geraete" -> Zugang neu absichern: Felder fuer den Passwortspeicher
  await P.page.locator('details.psec[data-psec="devices"] > summary').click();
  assert.match(await P.page.locator('details.psec[data-psec="devices"]').textContent(), /Meine Geräte[\s\S]*\(dieses Gerät\)[\s\S]*Zugang neu absichern[\s\S]*anderen Geräten melden Sie sich danach mit dem neuen Passwort neu an/);
  await P.page.locator('#kErneuern').click();
  await P.page.waitForSelector('#kErnForm');
  assert.match(await P.page.locator('#aboutBody').textContent(), /Zugang neu absichern[\s\S]*Wiederherstellungscode[\s\S]*anderen Geräten melden Sie sich danach mit dem neuen Passwort neu an/);
  assert.deepEqual(await attr(P.page, '#kErnForm input[autocomplete="username"]'), { autocomplete: 'username', name: 'username', type: 'text' });
  assert.deepEqual(await attr(P.page, '#kErnAlt'), { autocomplete: 'current-password', name: null, type: 'password' });
  assert.equal(await P.page.locator('#kErnForm input[autocomplete="new-password"]').count(), 2);
  await togglePruefen(P.page, 'kErnAlt', 'Werkzeug-Eltern-Passwort-1', 'current-password');
  await togglePruefen(P.page, 'kErnNeu1', 'Otter-Cake-Moss-1234', 'new-password');
  await togglePruefen(P.page, 'kErnNeu2', 'Otter-Cake-Moss-1234', 'new-password');
  await P.page.locator('#kBack').click();

  // Konto loeschen: Passwortfeld hat denselben Schalter
  await P.page.locator('#kKontoLoeschen').click();
  await P.page.waitForSelector('#kKlForm');
  await togglePruefen(P.page, 'kKlPw', 'Werkzeug-Eltern-Passwort-1', 'current-password');
  await P.page.locator('#kBack').click();

  // eigenes Geraet: nach dem Neuladen direkt wieder im Erwachsenenbereich
  await P.page.reload();
  await P.page.waitForSelector('#parentClose');
  // Abmelden: danach zur Anmeldung
  await P.page.locator('#parentClose').click();
  await P.page.waitForSelector('#login:not([hidden])');
  assert.deepEqual(P.fehler, []); assert.deepEqual(K.fehler, []);
  await P.ctx.close(); await K.ctx.close();
});
