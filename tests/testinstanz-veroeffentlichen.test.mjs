// Stufe 3c, Veroeffentlichungsweg: werkzeug/testinstanz-veroeffentlichen.mjs ohne Netz, gegen lokale Ziel-Repos
// (wie tests/veroeffentlichen.test.mjs). Kopiert nur eine gepruefte Testinstanz (dist-test/) und committet sie mit Version;
// bricht vor dem Kopieren ab bei Schuldaten, Konten, Familienpasswort, fremden Speicherstellen, verbotenen Woertern,
// Aktualisierung mit Schluessel, Entwurf, veraltetem dist-test, falschem oder unsauberem Ziel, aelterer Version.
// Dazu im Browser: die veroeffentlichte Testfassung aktualisiert sich selbst - ohne Schluessel auf dem Geraet.
//   node --test tests/testinstanz-veroeffentlichen.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { WURZEL, QUELLEN, testinstanzBauen } from '../werkzeug/bauen.mjs';
import { VERSION_AUS_KLARTEXT } from '../werkzeug/testinstanz.mjs';
import { testinstanzVeroeffentlichen, testinstanzLiveVergleichen, DATEIEN } from '../werkzeug/testinstanz-veroeffentlichen.mjs';
import { versionText } from '../werkzeug/version.mjs';
import { woerterLesen } from '../werkzeug/kern.mjs';
import { browserStarten, LADEZEIT_MS } from './app-hilfen.mjs';

const V = { major: 0, minor: 7, patch: 0, kanal: 'beta', hash: 'abc1234', date: '04.11.2026 19:00', draft: false };
const V8 = { major: 0, minor: 8, patch: 0, kanal: 'beta', hash: 'bcd2345', date: '04.11.2026 20:00', draft: false };
const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const ORDNER = fs.mkdtempSync(path.join(os.tmpdir(), 'bq-ti-veroeff-'));
let n = 0;
const tmp = (name = 'x') => { const d = path.join(ORDNER, `${++n}-${name}`); fs.mkdirSync(d, { recursive: true }); return d; };
const lies = (rel) => fs.readFileSync(path.join(WURZEL, rel), 'utf8');
let DIST, DIST8;
before(async () => {
  DIST = tmp('dist'); await testinstanzBauen({ ziel: DIST, version: V });
  DIST8 = tmp('dist8'); await testinstanzBauen({ ziel: DIST8, version: V8 });
});
after(() => { fs.rmSync(ORDNER, { recursive: true, force: true }); });

const nutzer = (z) => { git(z, 'config', 'user.email', 'test@example.invalid'); git(z, 'config', 'user.name', 'Test'); };
/** neues Repo wie auf GitHub angelegt: nur README */
function zielRepo() {
  const z = tmp('ziel');
  git(z, 'init', '-q'); nutzer(z);
  fs.writeFileSync(path.join(z, 'README.md'), 'Big Quest Test'); git(z, 'add', '.'); git(z, 'commit', '-q', '-m', 'start');
  return z;
}
/** Ziel mit origin = lokales "big-quest-test/big-quest-test.github.io.git" (bare) - so laeuft auch Pull und Push */
function zielMitOrigin() {
  const basis = tmp('remote'), bare = path.join(basis, 'big-quest-test', 'big-quest-test.github.io.git');
  git(basis, 'init', '-q', '--bare', bare);
  const start = zielRepo();
  git(start, 'remote', 'add', 'origin', bare); git(start, 'push', '-q', '-u', 'origin', 'HEAD');
  const klon = (name) => { const k = path.join(tmp(name), 'big-quest-test.github.io'); git(path.dirname(k), 'clone', '-q', bare, k); nutzer(k); return k; };
  return { bare, klon };
}
function distMit(aendern, { datei = 'index.html', von = DIST } = {}) {
  const d = tmp('dist-anders');
  for (const f of fs.readdirSync(von)) fs.copyFileSync(path.join(von, f), path.join(d, f));
  const p = path.join(d, datei); fs.writeFileSync(p, aendern(fs.readFileSync(p, 'utf8')));
  return d;
}
const nurReadme = (z) => assert.deepEqual(fs.readdirSync(z).filter((f) => f !== '.git'), ['README.md'], 'nichts kopiert');
const gleich = (a, b, f) => assert.ok(fs.readFileSync(path.join(a, f)).equals(fs.readFileSync(path.join(b, f))), f);

test('gepruefte Testinstanz: alle fuenf Dateien kopiert, Commit mit sichtbarer Version; zweiter Lauf tut nichts', async () => {
  const z = zielRepo();
  const r = await testinstanzVeroeffentlichen({ dist: DIST, ziel: z, text: 'Probe', ohnePush: true, version: V });
  assert.equal(r.geaendert, true);
  assert.equal(git(z, 'log', '-1', '--format=%s'), `Big Quest Test ${versionText(V, { mitEntwurf: false })}: Probe`);
  assert.deepEqual(DATEIEN, ['index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png']);
  for (const f of DATEIEN) gleich(DIST, z, f);
  assert.deepEqual(git(z, 'show', '--name-only', '--format=', 'HEAD').split('\n').sort(), [...DATEIEN].sort());
  assert.equal(git(z, 'status', '--porcelain'), '');
  const r2 = await testinstanzVeroeffentlichen({ dist: DIST, ziel: z, ohnePush: true, version: V });
  assert.equal(r2.geaendert, false);
  // naechste Version: nur geaenderte Dateien, neue Nachricht
  const r3 = await testinstanzVeroeffentlichen({ dist: DIST8, ziel: z, ohnePush: true, version: V8 });
  assert.equal(r3.nachricht, `Big Quest Test ${versionText(V8, { mitEntwurf: false })}`);
  assert.deepEqual(git(z, 'show', '--name-only', '--format=', 'HEAD').split('\n'), ['index.html']);
});

test('mit Pull und Push gegen ein lokales "big-quest-test.github.io.git": kommt an, holt vorher fremde Commits; aeltere Version wird abgelehnt', async () => {
  const { bare, klon } = zielMitOrigin();
  const a = klon('a'), b = klon('b');
  // jemand anderes aendert das README (z. B. Peter im Browser), a weiss davon noch nichts
  fs.writeFileSync(path.join(b, 'README.md'), 'Big Quest Test - nur Testpersonen'); git(b, 'commit', '-q', '-am', 'README');
  git(b, 'push', '-q');
  const r = await testinstanzVeroeffentlichen({ dist: DIST8, ziel: a, text: 'erste Fassung', version: V8 });
  assert.equal(r.geaendert, true);
  assert.equal(git(bare, 'log', '-1', '--format=%s'), `Big Quest Test ${versionText(V8, { mitEntwurf: false })}: erste Fassung`);
  assert.equal(git(bare, 'log', '-2', '--format=%s').split('\n')[1], 'README', 'fremder Commit vorher geholt, nicht ueberschrieben');
  assert.equal(git(a, 'rev-list', '--count', '@{u}..HEAD'), '0');
  // b hat v8 noch nicht lokal: der Pull holt sie, danach wird die aeltere v7 abgelehnt, nichts committet
  const vorher = git(bare, 'rev-parse', 'HEAD');
  await assert.rejects(testinstanzVeroeffentlichen({ dist: DIST, ziel: b, version: V }), /schon V 0\.8 \(Betaversion\) - aeltere Fassung V 0\.7 \(Betaversion\)/);
  assert.equal(git(bare, 'rev-parse', 'HEAD'), vorher);
  assert.equal(git(b, 'status', '--porcelain'), '');
});

test('Suchlauf vor dem Kopieren: Schuldaten, Konten, Familienpasswort, Kathies Speicher, verbotene Woerter, Aktualisierung mit Schluessel -> Abbruch, nichts kopiert', async () => {
  const z = zielRepo();
  const schule = JSON.parse(lies('werkzeug/schuldaten.json'));
  const konten = JSON.parse(lies('werkzeug/konten.json'));
  const salt = JSON.parse(lies(QUELLEN.salz)).salt;
  const wort = woerterLesen(lies(QUELLEN.woerter))[0];
  const altePV = VERSION_AUS_KLARTEXT.replace('const res=', "const key=localStorage.getItem('bqt_schluessel'); if(!key) throw new Error('no key');\n  const res=");
  const faelle = {
    'Schuldaten': [distMit((h) => h.replace('const SCHOOL_DATA=null||{};', () => 'const SCHOOL_DATA=' + JSON.stringify({ p_X: schule.kinder[Object.keys(schule.kinder)[0]] }) + '||{};')), /Schuldaten leer/],
    'Kennung aus konten.json': [distMit((h) => h.replace('</body>', `<!-- ${konten.users[0].id} --></body>`)), /keine Kennung und kein Startcode-Hash/],
    'Tresor': [distMit((h) => h.replace('</body>', '<script type="application/json" id="tresor">{}</script></body>')), /ohne Familienpasswort/],
    'Salz': [distMit((h) => h + `<!-- ${salt} -->`), /Salz des Familienpassworts/],
    'Kathies Speicher': [distMit((h) => h.replace('</body>', "<script>localStorage.getItem('bq2_name')</script></body>")), /kein bq2_/],
    'verbotenes Wort (App)': [distMit((h) => h.replace('</body>', `<!-- ${wort} --></body>`)), /keine verbotenen Woerter/],
    'verbotenes Wort (Manifest)': [distMit((m) => JSON.stringify({ ...JSON.parse(m), description: wort }), { datei: 'manifest.webmanifest' }), /keine verbotenen Woerter/],
    'Aktualisierung mit Schluessel': [distMit((h) => h.replace(VERSION_AUS_KLARTEXT, () => altePV)), /Aktualisierung ohne Schluessel/],
    'nicht mit dem Test-Repo verbunden': [distMit((h) => h.replace(/const KONTO_SPEICHER=[^;]*;/, () => 'const KONTO_SPEICHER=/*BQ_SPEICHER*/null;')), /mit dem Test-Repo verbunden/],
    'anderes Repo': [distMit((h) => h.replace('"repo":"pahlborn/bis-school-app-testdaten"', () => '"repo":"pahlborn/bis-school-app"')), /mit dem Test-Repo verbunden[^\n]*anderer Speicher/],
    'Live-Bau / Huelle statt Testinstanz': [distMit(() => lies('werkzeug/huelle.html')), /Suchlauf Testinstanz/]
  };
  for (const [name, [dist, grund]] of Object.entries(faelle)) {
    await assert.rejects(testinstanzVeroeffentlichen({ dist, ziel: z, ohnePush: true, version: V }), (e) => {
      assert.match(e.message, /^Suchlauf Testinstanz, nichts kopiert:/, name);
      assert.match(e.message, grund, name + ': ' + e.message);
      return true;
    });
    nurReadme(z);
  }
  assert.equal(git(z, 'log', '--format=%s'), 'start');
});

test('Entwurf, veraltetes dist-test (anderer Commit) und fehlende Dateien brechen ab, ohne zu kopieren', async () => {
  const z = zielRepo();
  await assert.rejects(testinstanzVeroeffentlichen({ dist: DIST, ziel: z, ohnePush: true, version: { ...V, draft: true } }), /nicht eingecheckte/);
  await assert.rejects(testinstanzVeroeffentlichen({ dist: DIST, ziel: z, ohnePush: true, version: V8 }), /dist-test\/ passt nicht zum Quellstand \(gebaut V 0\.7 \(Betaversion\) abc1234, Quelle V 0\.8 \(Betaversion\) bcd2345\)/);
  await assert.rejects(testinstanzVeroeffentlichen({ dist: DIST, ziel: z, ohnePush: true, version: { ...V, hash: 'fff0000' } }), /passt nicht zum Quellstand/);
  const ohneIcon = distMit((h) => h); fs.rmSync(path.join(ohneIcon, 'icon-512.png'));
  await assert.rejects(testinstanzVeroeffentlichen({ dist: ohneIcon, ziel: z, ohnePush: true, version: V }), /unvollstaendig \(icon-512\.png\)/);
  await assert.rejects(testinstanzVeroeffentlichen({ dist: path.join(ORDNER, 'gibt-es-nicht'), ziel: z, ohnePush: true, version: V }), /dist-test\/ fehlt/);
  nurReadme(z);
});

test('falsches Ziel: Kathies Repo (Huelle mit Tresor), fremdes origin, unsauber, fehlend, kein Git-Repo', async () => {
  const kathie = zielRepo();
  fs.writeFileSync(path.join(kathie, 'index.html'), lies('werkzeug/huelle.html').replace('</body>', '<script type="application/json" id="tresor">{}</script></body>'));
  git(kathie, 'add', '.'); git(kathie, 'commit', '-q', '-m', 'Big Quest v129');
  await assert.rejects(testinstanzVeroeffentlichen({ dist: DIST, ziel: kathie, ohnePush: true, version: V }), /verschluesselte Huelle \(Kathies App\)/);
  assert.equal(git(kathie, 'status', '--porcelain'), '');

  for (const url of ['https://github.com/pahlborn/bis-school-app.git', 'https://github.com/pahlborn/bis-school-app-test.git', 'https://github.com/pahlborn/big-quest-test.github.io.git', 'https://github.com/big-quest/big-quest.github.io.git', 'https://github.com/pahlborn/bis-school-app-testdaten.git', 'https://github.com/pahlborn/gt40-engine']) {
    const z = zielRepo(); git(z, 'remote', 'add', 'origin', url);
    await assert.rejects(testinstanzVeroeffentlichen({ dist: DIST, ziel: z, ohnePush: true, version: V }), /nicht das Repo der Testinstanz/, url);
    nurReadme(z);
  }
  const passt = zielRepo(); git(passt, 'remote', 'add', 'origin', 'https://github.com/big-quest-test/big-quest-test.github.io.git');
  assert.equal((await testinstanzVeroeffentlichen({ dist: DIST, ziel: passt, ohnePush: true, version: V })).geaendert, true, 'richtiges origin wird angenommen');

  const unsauber = zielRepo(); fs.writeFileSync(path.join(unsauber, 'fremd.txt'), 'x');
  await assert.rejects(testinstanzVeroeffentlichen({ dist: DIST, ziel: unsauber, ohnePush: true, version: V }), /lokale Aenderungen/);
  await assert.rejects(testinstanzVeroeffentlichen({ dist: DIST, ohnePush: true, version: V }), /--ziel fehlt/);
  await assert.rejects(testinstanzVeroeffentlichen({ dist: DIST, ziel: tmp('leer'), ohnePush: true, version: V }), /kein Git-Repo/);
});

/** kleiner Server: Pfad -> Inhalt (Text); ohneAnfrage[Pfad] gilt fuer den Aufruf ohne "?..." (das erste Oeffnen) */
async function server(inhalt, ohneAnfrage = {}) {
  const s = http.createServer((req, res) => {
    const p = req.url.split('?')[0], t = !req.url.includes('?') && ohneAnfrage[p] !== undefined ? ohneAnfrage[p] : inhalt[p];
    if (t === undefined) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': p.endsWith('.webmanifest') ? 'application/manifest+json' : 'text/html; charset=utf-8', 'cache-control': 'max-age=600' });
    res.end(t);
  });
  await new Promise((r) => s.listen(0, '127.0.0.1', r));
  s.url = `http://127.0.0.1:${s.address().port}`;
  return s;
}

test('Live-Pruefung: gleich, anders, nicht erreichbar (Version im Klartext, ohne Schluessel)', async () => {
  const s = await server({ '/ti/': fs.readFileSync(path.join(DIST, 'index.html'), 'utf8') });
  try {
    assert.equal((await testinstanzLiveVergleichen(V, s.url + '/ti/')).ergebnis, 'gleich');
    const anders = await testinstanzLiveVergleichen(V8, s.url + '/ti/');
    assert.equal(anders.ergebnis, 'anders'); assert.equal(anders.text, 'V 0.7 (Betaversion) abc1234 04.11.2026 19:00');
    assert.equal((await testinstanzLiveVergleichen(V, s.url + '/fehlt/')).ergebnis, 'nicht erreichbar');
    assert.equal((await testinstanzLiveVergleichen(V, 'http://127.0.0.1:9/nix/')).ergebnis, 'nicht erreichbar');
  } finally { s.close(); }
});

test('Browser: die veroeffentlichte Testfassung aktualisiert sich selbst, ohne Schluessel auf dem Geraet; nur die eigene Adresse wird gefragt', async () => {
  const z = zielRepo();
  const seite = () => fs.readFileSync(path.join(z, 'index.html'), 'utf8');
  await testinstanzVeroeffentlichen({ dist: DIST, ziel: z, ohnePush: true, version: V });
  const v7 = seite();
  // naechste Fassung veroeffentlichen (wie das Skript es tut). Das Geraet oeffnet noch v7 (erster Aufruf ohne "?"); jede
  // spaetere Anfrage (Nachsehen "?t=", Neuladen "?v=") bekommt v8 - so haengt der Test nicht davon ab, wann die App
  // zum ersten Mal nachsieht (3 s nach dem Start, danach erst wieder nach 5 Minuten).
  await testinstanzVeroeffentlichen({ dist: DIST8, ziel: z, ohnePush: true, version: V8 });
  const s = await server({ '/': seite() }, { '/': v7 });   // App im Wurzelverzeichnis (big-quest-test.github.io)
  const browser = await browserStarten();
  try {
    const ctx = await browser.newContext();
    await ctx.route('**/*', (r) => (r.request().url().startsWith(s.url) ? r.continue() : r.abort()));
    await ctx.addInitScript(() => {
      window.AudioContext = undefined;
      const g = Storage.prototype.getItem;
      Storage.prototype.getItem = function (k) { if (this === localStorage) (window.__gelesen ||= []).push(String(k)); return g.call(this, k); };
    });
    const page = await ctx.newPage();
    const fehler = [], anfragen = [];
    page.on('pageerror', (e) => fehler.push(e.message));
    page.on('request', (q) => anfragen.push(q.url()));
    // die Testinstanz startet mit der Anmeldung (mit dem Test-Repo verbunden) - auch dort aktualisiert sie sich
    await page.goto(s.url + '/', { waitUntil: 'domcontentloaded', timeout: LADEZEIT_MS });
    await page.waitForSelector('#login:not([hidden])');
    assert.ok((await page.content()).includes('const APP_VERSION={"major":0,"minor":7,'), 'geoeffnet: V 0.7');
    await page.waitForURL(/:\d+\/\?v=0\.8\.0-beta-bcd2345$/, { timeout: 20000 });
    await page.waitForSelector('#login:not([hidden])');
    assert.ok(await page.evaluate(() => [...document.scripts].some((x) => x.textContent.includes('const APP_VERSION={"major":0,"minor":8,'))), 'jetzt V 0.8');
    assert.ok(await page.locator('#verbinden').isVisible(), 'Anmeldeseite der Testinstanz: zuerst Geraet verbinden (Zugangscode zum Test-Repo)');
    const r = await page.evaluate(() => ({ gelesen: [...new Set(window.__gelesen || [])], schluessel: Object.keys(localStorage).filter((k) => /schluessel/i.test(k)) }));
    assert.deepEqual(r.schluessel, [], 'kein Schluessel auf dem Geraet');
    assert.deepEqual(r.gelesen.filter((k) => /schluessel/i.test(k) || !k.startsWith('bqt')), [], 'nur bqt gelesen, kein Schluessel');
    assert.deepEqual(anfragen.filter((u) => !u.startsWith(s.url)), [], 'keine fremde Adresse');
    assert.ok(anfragen.some((u) => /:\d+\/\?t=\d+$/.test(u)), 'Version auf der eigenen Seite nachgesehen');
    assert.deepEqual(fehler, []);
    await ctx.close();
  } finally { await browser.close(); s.close(); }
});
