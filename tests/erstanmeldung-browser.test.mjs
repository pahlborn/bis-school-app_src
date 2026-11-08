// Aufgabe "Erstanmeldung per QR-Code" (06.11.) im Browser (Chromium), mit echten Klicks und Sichtbarkeit. Speicher: der
// nachgebaute GitHub-Server (Weg der Testinstanz). Nur Fantasienamen.
//   A Einladung per Link (E-Mail/QR mit der Kamera-App): Zugangscode und Startcode sofort aus der Adresse, ein alter
//     Zugangscode wird ersetzt, "✅ Geraet verbunden", keine Rollenwahl, Anmeldename fest, ein Feld "new-password" (fest im
//     HTML), Regeln am Feld, "Anmelden" erst bei erfuellten Regeln (auch ohne input-Ereignis), nur ein Formular in der
//     Seite, der Zugangscode nie in einem Passwortfeld; derselbe Link auf einem neuen Geraet: "bitte anmelden"
//     (current-password); falscher Zugangscode: ❌, nichts behalten; zweiter Elternteil: Einladung als E-Mail-Entwurf
//   B Home-Bildschirm-App ohne Zugangscode: zuerst nur "Geraet verbinden" -> "📷 QR-Code scannen" (Kamera IN der App;
//     hier eine Kamera-Attrappe, die ein Bild des QR-Codes zeigt) -> das Kind waehlt sein Passwort
// Geraeteverhalten (Passwort-Vorschlag, Passwortspeicher, iPhone-Kamera) belegt dieser Test nicht - das ist auf dem
// iPhone belegt (Vorgabe, Tabelle "Belegt"); Kathies iPad ist offen.
//   node --test tests/erstanmeldung-browser.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { appServer, browserStarten } from './app-hilfen.mjs';
import { githubNachbau } from './module/github-nachbau.mjs';
import { githubSpeicher } from '../src/module/github.mjs';
import { startcodeAusstellen, ersteAnmeldung } from '../src/module/konto.mjs';
import { anmEinladungslink } from '../src/module/anmeldung.mjs';
import { qrMatrix, qrSvg } from '../src/module/qrcode.mjs';
import { WURZEL } from '../werkzeug/bauen.mjs';

const REPO = 'pahlborn/bis-school-app-testdaten';
const TOKEN = 'github_pat_ERSTANMELDUNG_' + 'v5Nq'.repeat(15);
const ALT = 'github_pat_ALTERCODE_' + 'z'.repeat(40);
const ORDNER = fs.mkdtempSync(path.join(os.tmpdir(), 'bq-erst-'));
let N, server, browser, Z, admin, mira;

before(async () => {
  N = await githubNachbau({ token: TOKEN, repos: [REPO] });
  Z = githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis }).geraet('d_Werkzeug1');
  const sa = await startcodeAusstellen({ zugang: Z, aussteller: null, anmeldename: 'admin', art: 'admin', now: Date.now() });
  admin = await ersteAnmeldung({ zugang: Z, code: sa.code, passwort: 'Werkzeug-Admin-Passwort-1', now: Date.now(), runden: 1000 });
  const sm = await startcodeAusstellen({ zugang: Z, aussteller: admin, anmeldename: 'mira.sonnental', art: 'parent', now: Date.now() });
  mira = await ersteAnmeldung({ zugang: Z, code: sm.code, passwort: 'Werkzeug-Eltern-Passwort-1', now: Date.now(), runden: 1000 });
  const speicher = JSON.stringify({ art: 'github', repo: REPO, wurzel: '', basis: N.basis });
  server = await appServer({ bauart: 'test', anpassen: (h) => h.replace('/*BQ_SPEICHER*/null', () => speicher) });
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); await N?.schliessen(); fs.rmSync(ORDNER, { recursive: true, force: true }); });

/* ein Geraet: eigener Browser-Kontext, nur App und Nachbau erreichbar; vorher = localStorage beim ersten Oeffnen */
async function geraet(b = browser, vorher = {}) {
  const ctx = await b.newContext({ acceptDownloads: true });
  await ctx.route('**/*', (r) => (r.request().url().startsWith(server.url) || r.request().url().startsWith(N.basis) ? r.continue() : r.abort()));
  await ctx.addInitScript(([v]) => {
    window.AudioContext = undefined; window.webkitAudioContext = undefined;
    try { Object.defineProperty(navigator, 'canShare', { value: undefined }); } catch (e) { /* egal */ }
    if (!sessionStorage.getItem('vorbereitet')) { for (const [k, w] of Object.entries(v)) localStorage.setItem(k, w); sessionStorage.setItem('vorbereitet', '1'); }
  }, [vorher]);
  const page = await ctx.newPage(), fehler = [];
  page.setDefaultTimeout(30000);
  page.on('pageerror', (e) => fehler.push(e.message));
  return { ctx, page, fehler };
}
const zaehle = (page, sel) => page.locator(sel).count();
/* kein Feld ausser "Link einfuegen" traegt den Zugangscode; kein Passwortfeld ist vorbelegt */
const keinCodeInFeldern = (page) => page.evaluate((t) => [...document.querySelectorAll('input')].filter((i) => i.id !== 'verbLink' && (i.value.includes(t) || (i.type === 'password' && i.value))).map((i) => i.id), TOKEN);
async function togglePruefen(page, id, wert) {
  const feld = page.locator('#' + id), knopf = page.locator(`[data-pw-toggle="${id}"]`);
  await feld.fill(wert);
  assert.equal(await feld.getAttribute('autocomplete'), 'new-password');
  assert.equal(await feld.getAttribute('type'), 'password');
  await knopf.click();
  assert.equal(await feld.getAttribute('type'), 'text');
  assert.equal(await feld.inputValue(), wert, 'Wert bleibt bei ' + id);
  await knopf.click();
  assert.equal(await feld.getAttribute('type'), 'password');
  assert.equal(await feld.inputValue(), wert, 'Wert bleibt verdeckt bei ' + id);
}

test('A Einladung per Link: Adresse leer, alter Zugangscode ersetzt, ohne Rollenwahl zum Passwort (fest im HTML, Regeln, Knopf); Link wiederverwenden; falscher Zugangscode; E-Mail-Entwurf', async () => {
  // fest im HTML: das Passwortfeld steht so in der ausgelieferten Seite (nicht vom Skript nachgesetzt)
  const html = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
  assert.match(html, /<form id="kontoNeuForm"[^>]*>\s*<div class="field"><label[^>]*>[^<]*<\/label><input id="kontoNeuName" name="username" type="text" autocomplete="username"[^>]*readonly><\/div>\s*<div class="field"><label[^>]*>[^<]*<\/label><span class="pw-wrap"><input id="kontoNeuPw" name="new-password" type="password" autocomplete="new-password" passwordrules="minlength: 12;[^"]*"[^>]*><button type="button" class="pw-toggle" data-pw-toggle="kontoNeuPw"/);

  const sc = await startcodeAusstellen({ zugang: Z, aussteller: admin, anmeldename: 'jonas.sonnental', art: 'parent', now: Date.now() });
  const link = anmEinladungslink(server.url, { zugang: TOKEN, anmeldename: 'jonas.sonnental', code: sc.code, fingerabdruck: sc.fingerabdruck });
  const A = await geraet(browser, { bqt_gh: ALT });                       // Safari hatte noch einen alten Zugangscode
  await A.page.goto(link);
  await A.page.waitForSelector('#kontoNeuForm', { state: 'visible' });
  assert.equal(await A.page.evaluate(() => location.href), server.url, 'Zugangscode und Startcode sofort aus der Adresse');
  assert.equal(await A.page.evaluate(() => localStorage.getItem('bqt_gh')), TOKEN, 'der Code aus dem Link ersetzt den alten');
  assert.match(await A.page.locator('#kontoNeuOk').textContent(), /^✅ (Gerät verbunden|Device connected)\.$/);
  assert.ok(await A.page.locator('#kontoNeuOk').isVisible());
  assert.equal(await zaehle(A.page, '#roleStudent, #roleAdult'), 0, 'keine Rollenwahl');
  assert.equal(await A.page.locator('#kontoNeuName').inputValue(), 'jonas.sonnental');
  assert.equal(await A.page.locator('#kontoNeuName').evaluate((e) => e.readOnly), true, 'Anmeldename steht fest');
  assert.equal(await zaehle(A.page, 'input[type="password"]'), 1, 'nur ein Passwortfeld in der Seite');
  assert.equal(await zaehle(A.page, 'input[autocomplete="current-password"]'), 0, 'kein zweites Formular');
  assert.deepEqual(await keinCodeInFeldern(A.page), [], 'Zugangscode in keinem Feld, Passwortfeld leer');
  assert.ok(await A.page.locator('#kontoNeuRegeln').isVisible());
  assert.match(await A.page.locator('#kontoNeuRegeln').textContent(), /Mindestens 12 Zeichen|At least 12 characters/);
  const go = A.page.locator('#kontoNeuGo');
  assert.equal(await go.isDisabled(), true, 'leer: Anmelden aus');
  await A.page.locator('#kontoNeuPw').fill('kurz');
  assert.equal(await go.isDisabled(), true, 'zu kurz');
  await A.page.locator('#kontoNeuPw').fill('Passwort1234');
  assert.equal(await go.isDisabled(), true, 'bekanntes Passwort');
  await A.page.locator('#kontoNeuPw').fill('jonas123456789');
  assert.equal(await go.isDisabled(), true, 'Vorname plus Ziffern');
  await togglePruefen(A.page, 'kontoNeuPw', 'Tiger-Lamp-River-4271-Moss');
  await A.page.locator('#kontoNeuPw').fill('');
  assert.equal(await go.isDisabled(), true, 'nach dem Leeren wieder aus');
  // wie der Passwortspeicher: Wert ohne "input"-Ereignis -> die App merkt es trotzdem (regelmaessige Pruefung)
  await A.page.locator('#kontoNeuPw').evaluate((e) => { e.value = 'Tiger-Lamp-River-4271-Moss'; });
  await A.page.waitForFunction(() => !document.querySelector('#kontoNeuGo').disabled, null, { timeout: 3000 });
  await go.click();
  await A.page.waitForSelector('#recCode');
  assert.equal(await zaehle(A.page, '#kontoNeu'), 0, 'nach dem Absenden ist das Formular weg (dann bietet der Passwortspeicher an)');
  await A.page.locator('#recGo').click();
  await A.page.locator('#welcomeGo').click();
  await A.page.waitForSelector('#parentClose');

  // ⚙ Meine Geraete: "Weiteres Geraet verbinden" zeigt einen QR-Code mit dem Zugangscode (nur Zugangscode, kein Startcode)
  await A.page.locator('#pSettings').click();
  await A.page.locator('details.psec[data-psec="devices"] > summary').click();
  await A.page.locator('#kVerbindenQr').click();
  await A.page.waitForSelector('#kVerbQr svg');
  const d = await A.page.locator('#kVerbQr path').getAttribute('d');
  assert.equal(d, /<path fill="#000" d="([^"]*)"/.exec(qrSvg(server.url + '#zugang=' + TOKEN, { ecc: 'M', rand: 4 }))[1]);
  await A.page.locator('#kBack').click();

  // zweiter Elternteil: Einladung als E-Mail-Entwurf (HTML-Datei mit Link und QR-Code)
  await A.page.locator('details.psec[data-psec="family"] > summary').click();
  await A.page.locator('#kElternEinladen').click();
  await A.page.locator('#kElternLogin').fill('jonas.wellenberg');
  await A.page.locator('#kElternGo').click();
  await A.page.waitForSelector('#kQr svg');
  const [download] = await Promise.all([A.page.waitForEvent('download'), A.page.locator('#kQrMail').click()]);
  assert.equal(download.suggestedFilename(), 'Big-Quest-Einladung-jonas.wellenberg.html');
  const mail = fs.readFileSync(await download.path(), 'utf8');
  assert.ok(mail.includes('#zugang=' + TOKEN + '&amp;start=jonas.wellenberg/'), 'Link mit Zugangscode und Startcode');
  assert.ok(mail.includes('<svg') && mail.includes('gilt 7 Tage') && mail.includes('nur für eine Anmeldung'));
  assert.deepEqual(A.fehler, []);

  // derselbe Link auf einem neuen Geraet (oder Safari hat die Seite vergessen): verbunden, "bitte anmelden"
  const B = await geraet();
  await B.page.goto(link);
  await B.page.waitForSelector('#loginForm', { state: 'visible' });
  assert.equal(await B.page.evaluate(() => location.href), server.url);
  assert.match(await B.page.locator('#loginMeldung').textContent(), /^✅ (Gerät verbunden – bitte anmelden|Device connected – please log in)\.$/);
  assert.equal(await B.page.locator('#loginUser').inputValue(), 'jonas.sonnental');
  assert.equal(await B.page.locator('#loginPw').getAttribute('autocomplete'), 'current-password');
  assert.equal(await zaehle(B.page, 'input[autocomplete="new-password"]'), 0, 'kein Formular fuer ein neues Passwort');
  assert.equal(await zaehle(B.page, 'input[type="password"]'), 1, 'nur das Anmeldeformular');
  assert.deepEqual(await keinCodeInFeldern(B.page), []);
  await B.page.locator('#loginPw').fill('Tiger-Lamp-River-4271-Moss');
  await B.page.locator('#loginGo').click();
  await B.page.waitForSelector('#parentClose');
  assert.deepEqual(B.fehler, []);

  // falscher Zugangscode im Link: ❌, nichts behalten, kein Formular
  const C = await geraet();
  await C.page.goto(anmEinladungslink(server.url, { zugang: 'github_pat_FALSCH_' + 'x'.repeat(30), anmeldename: 'jonas.sonnental', code: sc.code }));
  await C.page.waitForSelector('#verbMeldung');
  assert.match(await C.page.locator('#verbMeldung').textContent(), /^❌ (Der Zugangscode passt nicht oder ist abgelaufen|The access code does not work or has expired)/);
  assert.equal(await C.page.evaluate(() => localStorage.getItem('bqt_gh')), null);
  assert.equal(await zaehle(C.page, '#kontoNeuForm, #loginForm'), 0);
  assert.equal(await C.page.evaluate(() => location.href), server.url);
  await A.ctx.close(); await B.ctx.close(); await C.ctx.close();
});

/* QR-Code -> Video fuer die Kamera-Attrappe von Chromium (Y4M, 640x480, Graustufen) */
function qrVideo(text, datei) {
  const q = qrMatrix(text, { ecc: 'M' }), W = 640, H = 480, s = Math.floor(440 / (q.size + 8)), o = (W - q.size * s) / 2 | 0, oy = (H - q.size * s) / 2 | 0;
  const y = Buffer.alloc(W * H, 235);
  for (let r = 0; r < q.size; r++) for (let c = 0; c < q.size; c++) if (q.zeilen[r][c]) for (let dy = 0; dy < s; dy++) y.fill(16, (oy + r * s + dy) * W + o + c * s, (oy + r * s + dy) * W + o + c * s + s);
  const uv = Buffer.alloc((W / 2) * (H / 2), 128), bild = Buffer.concat([Buffer.from('FRAME\n'), y, uv, uv]);
  fs.writeFileSync(datei, Buffer.concat([Buffer.from(`YUV4MPEG2 W${W} H${H} F5:1 Ip A1:1 C420jpeg\n`), bild, bild, bild]));
}

test('B Home-Bildschirm-App ohne Zugangscode: zuerst nur "Geraet verbinden"; QR-Code mit der Kamera IN der App -> das Kind waehlt sein Passwort', async () => {
  const sk = await startcodeAusstellen({ zugang: Z, aussteller: mira, anmeldename: 'lio.sonnental', art: 'child', now: Date.now() });
  const link = anmEinladungslink(server.url, { zugang: TOKEN, anmeldename: 'lio.sonnental', code: sk.code, fingerabdruck: sk.fingerabdruck });
  const video = path.join(ORDNER, 'qr.y4m');
  qrVideo(link, video);
  const kb = await browserStarten({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-video-capture=' + video] });
  try {
    const K = await geraet(kb);
    await K.page.goto(server.url);
    await K.page.waitForSelector('#verbinden', { state: 'visible' });
    assert.equal(await zaehle(K.page, '#roleStudent, #roleAdult, #loginForm, #kontoNeu'), 0, 'zuerst nur verbinden; kein Formular einer Person');
    assert.ok(await K.page.locator('#verbScan').isVisible() && await K.page.locator('#verbLink').isVisible(), 'QR-Code scannen und Link einfuegen');
    assert.equal(await K.page.locator('#verbVideo').getAttribute('playsinline'), '', 'Video mit playsinline (iPhone: im Bild, nicht im Vollbild)');
    await K.page.locator('#verbScan').click();
    // die App liest den QR-Code im Kamerabild und oeffnet die Einladung (mit Startcode: die Seite startet neu)
    await K.page.waitForSelector('#kontoNeuForm', { state: 'visible', timeout: 30000 });
    assert.equal(await K.page.evaluate(() => location.href), server.url, 'nichts in der Adresse');
    assert.equal(await K.page.evaluate(() => localStorage.getItem('bqt_gh')), TOKEN, 'verbunden');
    assert.equal(await K.page.locator('#kontoNeuName').inputValue(), 'lio.sonnental');
    assert.equal(await K.page.locator('#kontoNeuTitel').textContent(), 'Welcome! Choose your password', 'Kind: Englisch');
    await K.page.locator('#kontoNeuUse').click();
    await K.page.locator('#kontoNeuGo').click();
    await K.page.waitForSelector('#kidWait', { timeout: 30000 });   // das Kind wartet, bis das Geraet der Eltern es aufnimmt
    assert.deepEqual(K.fehler, []);
    await K.ctx.close();
  } finally { await kb.close(); }
});
