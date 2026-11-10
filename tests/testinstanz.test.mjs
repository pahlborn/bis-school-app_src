// Stufe 3c, Werkzeug-Teil: Bauart "Testinstanz" (werkzeug/testinstanz.mjs, testinstanzBauen in werkzeug/bauen.mjs).
// Testbau ohne Schuldaten, ohne konten.json, ohne Familienpasswort; Speicher unter bqt_, Token unter bqt_gh. Der Suchlauf
// (testinstanzPruefen) findet jede Abweichung - hier je Pruefung mit einer absichtlich falschen Fassung belegt.
// Dazu: die gebaute App liest und schreibt in der Node-Sandbox und im Browser nur bqt_ (Kathies Eintraege auf derselben
// Herkunft bleiben unberuehrt).
// Seit "Testinstanz verbinden" (Befund #134) ist die Testinstanz mit dem Test-Repo verbunden und startet mit der Anmeldung:
// Sandbox und Browser melden sich zuerst als Kind an - gegen den GitHub-Nachbau, auf den api.github.com umgelenkt wird
// (die gebaute Datei bleibt dabei unveraendert).
//   node --test tests/testinstanz.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { WURZEL, QUELLEN, testinstanzBauen, appZusammensetzen } from '../werkzeug/bauen.mjs';
import { TESTINSTANZ, ersatzLesen, testinstanzUmwandeln, testinstanzPruefen, testinstanzManifest, geraeteNamen, VERSION_AUS_KLARTEXT, SPEICHER_MARKE, SPEICHER_TESTINSTANZ, SCHULE_TESTFREIGABE_MARKE } from '../werkzeug/testinstanz.mjs';
import { woerterLesen } from '../werkzeug/kern.mjs';
import { appLesen } from '../werkzeug/module.mjs';
import { GITHUB_TOKEN_SCHLUESSEL, githubSpeicher } from '../src/module/github.mjs';
import { startcodeAusstellen, ersteAnmeldung, kontoLookup } from '../src/module/konto.mjs';
import { kindAnlegen, abgleichMitVerbindungen } from '../src/module/einladung.mjs';
import { appSandbox } from './app-sandbox.mjs';
import { browserStarten, LADEZEIT_MS } from './app-hilfen.mjs';
import { githubNachbau } from './module/github-nachbau.mjs';

const VERSION = { major: 0, minor: 999, patch: 0, kanal: 'beta', hash: 'abc1234', date: '04.11.2026 18:00', draft: false };
const lies = (rel) => fs.readFileSync(path.join(WURZEL, rel), 'utf8');
const WOERTER = woerterLesen(lies(QUELLEN.woerter));
const SCHULE = JSON.parse(lies('werkzeug/schuldaten.json'));
const KONTEN = JSON.parse(lies('werkzeug/konten.json'));
const SALT = JSON.parse(lies(QUELLEN.salz)).salt;
let ERSATZ, ZIEL, GEBAUT, APP, MANIFEST, KONTEXT;
const TOKEN = 'github_pat_TESTINSTANZ_' + 'x7'.repeat(20);       // nur im Nachbau gueltig
const REPO = TESTINSTANZ.repoDaten, GITHUB = 'https://api.github.com';
const SPEICHER_ZEILE = 'const KONTO_SPEICHER=' + JSON.stringify(SPEICHER_TESTINSTANZ) + ';';
const SCHULE_FREIGABE_ZEILE = 'const SCHULE_TESTFREIGABE=' + JSON.stringify({ origin: new URL(TESTINSTANZ.adresse).origin, repo: REPO }) + ';';
let N, CODES, ELTERN;                                            // GitHub-Nachbau; Startcodes der Testkinder; Elterngeraet (ohne App)

before(async () => {
  ERSATZ = await ersatzLesen();
  ZIEL = fs.mkdtempSync(path.join(os.tmpdir(), 'bq-testinstanz-'));
  GEBAUT = await testinstanzBauen({ ziel: ZIEL, version: VERSION });
  APP = fs.readFileSync(path.join(ZIEL, 'index.html'), 'utf8');
  MANIFEST = fs.readFileSync(path.join(ZIEL, 'manifest.webmanifest'), 'utf8');
  KONTEXT = { woerter: WOERTER, auchVerboten: ERSATZ.auchVerboten, schule: SCHULE, konten: KONTEN, salt: SALT };
  // Test-Repo im Nachbau: Admin (vom Werkzeug) -> Elternteil -> Startcodes fuer zwei Testkinder (fuer die Einladungslogik, unabhaengig vom Minimalset des Werkzeugs)
  N = await githubNachbau({ token: TOKEN, repos: [REPO] });
  const z = githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis }).geraet('d_Werkzeug1');
  const jetzt = Date.now();
  const admin = await ersteAnmeldung({ zugang: z, code: (await startcodeAusstellen({ zugang: z, aussteller: null, anmeldename: 'admin', art: 'admin', now: jetzt })).code, passwort: 'Werkzeug-Admin-Passwort-1', now: jetzt, runden: 1000 });
  const peter = await ersteAnmeldung({ zugang: z, code: (await startcodeAusstellen({ zugang: z, aussteller: admin, anmeldename: 'mira.sonnental', art: 'parent', now: jetzt })).code, passwort: 'Werkzeug-Eltern-Passwort-1', now: jetzt, runden: 1000 });
  // Aufgabe "Einladungen - Oberflaeche": ein Kind uebt erst, wenn ein Elterngeraet es aufgenommen hat - die Kinder legt
  // Geraet des Elternteils (ohne App, Modul einladung) an; ELTERN.sync() nimmt sie auf, waehrend sie warten
  const m = new Map(), a = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } };
  a.setItem('bq2_evDevice', JSON.stringify('d_Werkzeug2'));
  const zP = githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis }).geraet('d_Werkzeug2');
  ELTERN = { sync: () => abgleichMitVerbindungen({ ablage: a, zugang: zP, konten: [peter], now: Date.now(), heute: new Date().toISOString().slice(0, 10) }) };
  await ELTERN.sync();
  CODES = {};
  for (const n of ['mia.a', 'mia.b', 'mia.c']) CODES[n] = (await kindAnlegen({ zugang: zP, ablage: a, konto: peter, anmeldename: n, anzeigename: '', now: Date.now() })).code;
  await ELTERN.sync();
});
after(async () => { fs.rmSync(ZIEL, { recursive: true, force: true }); await N?.schliessen(); });

const funde = (app, manifest = MANIFEST) => testinstanzPruefen(app, manifest, KONTEXT).funde;
/* erwartet genau einen Fund, und zwar bei dieser Pruefung */
const nurFund = (app, pruefung, manifest) => { const f = funde(app, manifest); assert.equal(f.length, 1, JSON.stringify(f)); assert.ok(f[0].startsWith(pruefung), f[0]); };

test('Bau: Suchlauf bestanden, fuenf Dateien, App im Klartext = umgewandelter Testbau, eigener Name, Version drin', () => {
  assert.deepEqual(GEBAUT.dateien, ['index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png']);
  for (const d of GEBAUT.dateien) assert.ok(fs.existsSync(path.join(ZIEL, d)), d);
  assert.equal(GEBAUT.pruefungen.length, 18);
  assert.deepEqual(GEBAUT.pruefungen.filter((p) => !p.ok), []);
  assert.ok(GEBAUT.pruefungen.some((p) => p.name === 'mit dem Test-Repo verbunden (pahlborn/bis-school-app-testdaten)'));
  assert.equal(APP.split(SPEICHER_ZEILE).length, 2, 'mit dem Test-Repo verbunden: ' + SPEICHER_ZEILE);
  assert.ok(!APP.includes(SPEICHER_MARKE), 'Marke ersetzt');
  assert.ok(APP.includes(SCHULE_FREIGABE_ZEILE) && !APP.includes(SCHULE_TESTFREIGABE_MARKE), 'Schulfreigabe eingesetzt');
  assert.deepEqual(SPEICHER_TESTINSTANZ, { art: 'github', repo: 'pahlborn/bis-school-app-testdaten', wurzel: '' });
  assert.deepEqual(funde(APP), []);
  assert.ok(APP.startsWith('<!DOCTYPE html>') || APP.startsWith('<!doctype html>'), 'die App selbst, keine Huelle');
  assert.ok(APP.includes('const APP_VERSION={"major":0,"minor":999,"patch":0,"kanal":"beta","hash":"abc1234"'), 'Version eingesetzt');
  assert.match(APP, /<title>[^<]* \(Test\)<\/title>/);
  assert.equal(JSON.parse(MANIFEST).name, 'Big Quest Test');
  assert.equal(JSON.parse(MANIFEST).start_url, './index.html');
  assert.equal(TESTINSTANZ.tokenEintrag, GITHUB_TOKEN_SCHLUESSEL, 'derselbe Token-Eintrag wie das Modul github');
});

test('Umwandlung: alle Speicherstellen bqt_, Geraetedaten und Token geraeteweit, Schul-Namen neutral, Code sonst gleich', () => {
  const testbau = appLesen('utf8', { bauart: 'test' });
  const roh = appZusammensetzen(testbau, VERSION, null, null).toString('utf8');
  assert.ok(roh.includes('bq2_') && /\bbq_/.test(roh) && roh.includes('bqUpdateTo'), 'Ausgangslage: der Testbau nutzt bq2_, bq_, bqUpdateTo');
  assert.deepEqual(geraeteNamen(roh), ['abgleich', 'abgleichVerworfen', 'geraetEntfernen', 'schluessel']);   // geraetEntfernen: Meine Geraete (05.11.)
  // bq_schluessel (Familienschluessel) las nur publishedVersion - die Testinstanz liest die Version ohne Schluessel
  assert.match(APP, /const GLOBAL_KEYS=\/\^\(abgleich\|abgleichVerworfen\|geraetEntfernen\|gh\|session\|/);
  for (const k of ["'bqt_session'", "'bqt_abgleich'", "'bqt_abgleichVerworfen'", "'bqt_evDevice'", "'bqt_gh'", "'bqtUpdateTo'"]) assert.ok(APP.includes(k), k);
  assert.ok(!APP.includes('bqt_schluessel'), 'kein Familienschluessel');
  assert.ok(APP.includes(VERSION_AUS_KLARTEXT), 'Aktualisierung ohne Schluessel');
  assert.ok(APP.includes('Stage Show') && APP.includes('Save the Park') && APP.includes('https://big-quest-test.github.io/') && !APP.includes('bis-school-app-test/'));
  // ausser Praefixen, Ersetzungen, GLOBAL_KEYS, Speicher, Titeln und publishedVersion ist jede Zeile gleich
  const ohnePV = (x) => x.replace(/async function publishedVersion\(\)\{[\s\S]*?\n\}/, 'PUBLISHED_VERSION');
  const zeilenA = ohnePV(roh).split('\n'), zeilenB = ohnePV(APP).split('\n');
  assert.equal(zeilenA.length, zeilenB.length, 'gleiche Zeilenzahl');
  const praefix = (z) => z.replace(/bq2_|\bbq_/g, 'bqt_').replace(/\bbqUpdateTo\b/g, 'bqtUpdateTo');
  const anders = zeilenA.map((z, i) => [z, zeilenB[i]]).filter(([a, b]) => praefix(a) !== b);
  assert.ok(anders.length >= 10 && anders.length <= 40, 'Zahl der Zeilen mit mehr als Praefixen: ' + anders.length);
  const erklaert = anders.filter(([a, b]) => /GLOBAL_KEYS=|<title>|apple-mobile-web-app-title/.test(a)
    || (a.trim() === 'const KONTO_SPEICHER=' + SPEICHER_MARKE + ';' && b.trim() === SPEICHER_ZEILE)
    || (a.trim() === 'const SCHULE_TESTFREIGABE=' + SCHULE_TESTFREIGABE_MARKE + ';' && b.trim() === SCHULE_FREIGABE_ZEILE)
    || ERSATZ.ersetzen.some(([s]) => a.toLowerCase().includes(s.toLowerCase())));
  assert.equal(anders.length, erklaert.length, 'unerklaerte Aenderung: ' + anders.filter((x) => !erklaert.includes(x)).map(([a]) => a.trim().slice(0, 80)).join(' | '));
});

test('Gegenproben Suchlauf: jede Abweichung wird gefunden (Schuldaten, Konten, Tresor, Salz, alte Praefixe, verbotene Woerter, GLOBAL_KEYS, Testbau, Version, Name)', () => {
  // Kathies Schuldaten wieder drin
  const mitSchule = APP.replace('const SCHOOL_DATA=null||{};', () => 'const SCHOOL_DATA=' + JSON.stringify({ p_X: SCHULE.kinder[Object.keys(SCHULE.kinder)[0]] }) + '||{};');
  const fs1 = funde(mitSchule);
  assert.ok(fs1.some((f) => f.startsWith('Schuldaten leer')) && fs1.some((f) => f.startsWith('kein Text aus schuldaten.json')), JSON.stringify(fs1));
  // konten.json wieder drin
  const mitKonten = APP.replace('normAccounts(/*BQ_KONTEN*/null)', () => 'normAccounts(' + JSON.stringify({ version: 2, users: KONTEN.users.map((u) => ({ id: u.id, user: 'x' + u.id.slice(-4).toLowerCase(), kind: u.kind, start: u.start })) }) + ')');
  const fs2 = funde(mitKonten);
  assert.ok(fs2.some((f) => f.startsWith('Konten leer')) && fs2.some((f) => f.startsWith('keine Kennung')), JSON.stringify(fs2));
  // Familienpasswort: Huelle mit Tresor, App nicht im Klartext, Salz
  nurFund(APP.replace('</body>', '<script type="application/json" id="tresor">{}</script></body>'), 'ohne Familienpasswort');
  nurFund(APP.replace(/<script>(\s*)\(function\(\)\{/, '<script>$1(function (){'), 'ohne Familienpasswort');
  nurFund(APP + '<!-- ' + SALT + ' -->', 'Salz');
  // alte Praefixe / fremder Token / feste Speicherstelle ohne bqt
  for (const rest of ["localStorage.getItem('bq2_name')", "localStorage.getItem('bq_schluessel')", "localStorage.getItem('gh_token')", "sessionStorage.getItem('bqUpdateTo')"]) {
    const f = funde(APP + '<script>' + rest + '</script>');
    assert.ok(f.some((x) => x.startsWith('kein bq2_')) && f.some((x) => x.startsWith('feste Speicherstellen')), rest + ': ' + JSON.stringify(f));
  }
  nurFund(APP + "<script>localStorage.getItem('fremd')</script>", 'feste Speicherstellen');
  nurFund(APP.replace("const GITHUB_TOKEN_SCHLUESSEL = 'bqt_gh';", "const GITHUB_TOKEN_SCHLUESSEL = 'bqt_token';"), 'Token-Eintrag');
  nurFund(APP.replace('const GLOBAL_KEYS=/^(abgleich|abgleichVerworfen|geraetEntfernen|gh|', 'const GLOBAL_KEYS=/^(abgleich|abgleichVerworfen|geraetEntfernen|'), 'Geraetedaten und Token');
  // Speicher: nicht verbunden (Marke noch da), anderes Repo, Nachbau-Adresse, Unterordner, zweimal, simulierter Speicher
  const mitSpeicher = (s) => APP.replace(SPEICHER_ZEILE, () => 'const KONTO_SPEICHER=' + s + ';');
  for (const s of [SPEICHER_MARKE, 'null', JSON.stringify({ ...SPEICHER_TESTINSTANZ, repo: 'pahlborn/bis-school-app' }), JSON.stringify({ ...SPEICHER_TESTINSTANZ, basis: 'http://127.0.0.1:9' }),
    JSON.stringify({ ...SPEICHER_TESTINSTANZ, wurzel: 'laeufe' }), 'globalThis.__bqWelt'])
    nurFund(mitSpeicher(s), 'mit dem Test-Repo verbunden');
  nurFund(APP.replace(SPEICHER_ZEILE, () => SPEICHER_ZEILE + SPEICHER_ZEILE), 'mit dem Test-Repo verbunden');
  nurFund(APP + '<!-- ' + SPEICHER_MARKE + ' -->', 'mit dem Test-Repo verbunden');
  nurFund(APP.replace(SCHULE_FREIGABE_ZEILE, 'const SCHULE_TESTFREIGABE=null;'), 'Schulbewertungen nur auf der Testinstanz');
  nurFund(APP.replace(SCHULE_FREIGABE_ZEILE, SCHULE_FREIGABE_ZEILE + SCHULE_FREIGABE_ZEILE), 'Schulbewertungen nur auf der Testinstanz');
  nurFund(APP.replace(SCHULE_FREIGABE_ZEILE, SCHULE_FREIGABE_ZEILE.replace('https:', 'http:')), 'Schulbewertungen nur auf der Testinstanz');
  // Aktualisierung: alte publishedVersion (mit Schluessel und Tresor, Speicherstelle schon bqt_), doppelt, ohne Version
  const mitTresor = /async function publishedVersion\(\)\{[\s\S]*?\n\}/.exec(appLesen('utf8', { bauart: 'test' }))[0].replace(/\r/g, '').replace('bq_schluessel', 'bqt_schluessel');
  nurFund(APP.replace(VERSION_AUS_KLARTEXT, () => mitTresor), 'Aktualisierung ohne Schluessel');
  nurFund(APP.replace(VERSION_AUS_KLARTEXT, () => VERSION_AUS_KLARTEXT + '\n' + VERSION_AUS_KLARTEXT), 'Aktualisierung ohne Schluessel');
  nurFund(APP.replace(VERSION_AUS_KLARTEXT, () => VERSION_AUS_KLARTEXT.replace('const APP_VERSION=', 'const APP_NAME=')), 'Aktualisierung ohne Schluessel');
  // verbotene Woerter: jedes einzelne, irgendwo in der App, und im Manifest
  for (const w of [...WOERTER, ...ERSATZ.auchVerboten]) nurFund(APP.replace('</body>', `<!-- ${w.toUpperCase()} --></body>`), 'keine verbotenen Woerter');
  nurFund(APP, 'keine verbotenen Woerter', JSON.stringify({ ...JSON.parse(MANIFEST), description: 'Toddle' }));
  // Live-Bau statt Testbau, ohne Version, ohne Test-Namen
  const live = testinstanzUmwandeln(appLesen('utf8', { bauart: 'live' }).replace('/*BQ_VERSION*/null', JSON.stringify(VERSION)), ERSATZ);
  assert.ok(funde(live).some((f) => f.startsWith('Testbau')), 'Live-Bau erkannt');
  nurFund(APP.replace(/const APP_VERSION=\{[^}]*\};/, 'const APP_VERSION=null;'), 'Version');
  nurFund(APP, 'Name "Test"', testinstanzManifest('{"name":"x"}').replace('Big Quest Test', 'Big Quest'));
});

test('Gegenproben Umwandlung: geaenderte Stellen in index.html und Namensgleichheit brechen ab', () => {
  const testbau = appLesen('utf8', { bauart: 'test' });
  assert.throws(() => testinstanzUmwandeln(testbau.replace('const GLOBAL_KEYS=/^(', 'const GLOBAL_KEYS = /^('), ERSATZ), /GLOBAL_KEYS 0x statt 1x/);
  assert.throws(() => testinstanzUmwandeln(testbau.replace(/<title>/, '<title>A</title><title>'), ERSATZ), /<title> 2x/);
  assert.throws(() => testinstanzUmwandeln(testbau.replace('<meta name="apple-mobile-web-app-title"', '<meta name="x"'), ERSATZ), /apple-mobile-web-app-title 0x/);
  assert.throws(() => testinstanzUmwandeln(testbau.replace("localStorage.getItem('bq_schluessel')", "localStorage.getItem('bq_key')"), ERSATZ), /publishedVersion \(mit Schluessel\) 0x/);
  assert.throws(() => testinstanzUmwandeln(testbau.replace(SPEICHER_MARKE, 'null'), ERSATZ), /Marke \/\*BQ_SPEICHER\*\/null 0x statt 1x/);
  assert.throws(() => testinstanzUmwandeln(testbau.replace(SPEICHER_MARKE, SPEICHER_MARKE + '||' + SPEICHER_MARKE), ERSATZ), /Marke \/\*BQ_SPEICHER\*\/null 2x statt 1x/);
  assert.throws(() => testinstanzUmwandeln(testbau.replace(SCHULE_TESTFREIGABE_MARKE, 'null'), ERSATZ), /BQ_SCHULE_TESTFREIGABE.*0x statt 1x/);
  assert.throws(() => testinstanzUmwandeln(testbau + "<script>localStorage.getItem('bq2_abgleich')</script>", ERSATZ), /"abgleich" ist Geraetename und zugleich Speicherstelle/);
  assert.throws(() => testinstanzUmwandeln(testbau + "<script>store.get('gh',null)</script>", ERSATZ), /"gh" ist Geraetename/);
});

test('Schulbewertungen laufen auf der freigegebenen 3c-Adresse oder im Loopback-Nachbau', () => {
  const fremd = { ...SPEICHER_TESTINSTANZ, repo: 'anderer-ort/familien-daten' };
  const lokal = { ...SPEICHER_TESTINSTANZ, basis: 'http://127.0.0.1:9' };
  const an = (adresse, speicher, testinstanz) => {
    const location = Object.assign(new URL(adresse), { replace() {}, reload() {}, assign() {} });
    const S = appSandbox({ bauart: 'test', seite: true, globale: { location }, anpassen: (h) => {
      const ausdruck = JSON.stringify(speicher);
      return testinstanz ? testinstanzUmwandeln(h, ERSATZ, { speicher: ausdruck }) : h.replace(SPEICHER_MARKE, () => ausdruck);
    } });
    return S.lauf(() => S.holen('schoolEvaluationPilot')());
  };
  for (const [adresse, speicher, testinstanz, erwartet] of [
    [TESTINSTANZ.adresse, SPEICHER_TESTINSTANZ, true, true],
    [TESTINSTANZ.adresse, SPEICHER_TESTINSTANZ, false, false],
    [TESTINSTANZ.adresse.replace('https:', 'http:'), SPEICHER_TESTINSTANZ, true, false],
    ['https://big-quest-test.github.io:8443/', SPEICHER_TESTINSTANZ, true, false],
    ['https://big-quest-test.github.io.example.invalid/', SPEICHER_TESTINSTANZ, true, false],
    [TESTINSTANZ.adresse, fremd, true, false],
    [TESTINSTANZ.adresse, { ...SPEICHER_TESTINSTANZ, wurzel: 'anders' }, true, false],
    [TESTINSTANZ.adresse, lokal, true, false],
    ['https://pahlborn.github.io/bis-school-app/', fremd, false, false],
    ['http://127.0.0.1:8765/', SPEICHER_TESTINSTANZ, true, false],
    ['http://127.0.0.1:8765/', lokal, false, true],
    ['http://127.0.0.1:8765/', { ...lokal, basis: 'http://127.0.0.1:9@extern.invalid' }, false, false],
  ]) {
    assert.equal(an(adresse, speicher, testinstanz), erwartet, JSON.stringify([adresse, speicher, testinstanz]));
  }
});

test('Bau bricht ab und schreibt nichts, wenn ein verbotenes Wort ohne Ersatz in index.html steht', async () => {
  const w = fs.mkdtempSync(path.join(os.tmpdir(), 'bq-ti-wurzel-'));
  try {
    for (const d of ['src/module', 'werkzeug']) fs.cpSync(path.join(WURZEL, d), path.join(w, d), { recursive: true, filter: (q) => !q.includes('node_modules') });
    for (const d of ['icon-180.png', 'icon-192.png', 'icon-512.png']) fs.copyFileSync(path.join(WURZEL, d), path.join(w, d));
    fs.writeFileSync(path.join(w, 'index.html'), lies('index.html').replace('</body>', '<!-- Zeckser --></body>'));
    const ziel = path.join(w, 'ziel');
    await assert.rejects(testinstanzBauen({ wurzel: w, ziel, version: VERSION }), /Suchlauf Testinstanz, nichts geschrieben:\n {2}- keine verbotenen Woerter[^\n]*"Zeckser"/);
    assert.equal(fs.existsSync(ziel), false, 'nichts geschrieben');
    fs.writeFileSync(path.join(w, 'index.html'), lies('index.html'));
    await testinstanzBauen({ wurzel: w, ziel, version: VERSION });
    assert.equal(fs.readFileSync(path.join(ziel, 'index.html'), 'utf8'), APP, 'gleiche Quelle -> gleiche Testinstanz');
  } finally { fs.rmSync(w, { recursive: true, force: true }); }
});

/* Kathies echte Eintraege auf derselben Herkunft - die Testinstanz darf sie nie lesen oder aendern. Seit 06.11. liegt sie unter eigener
   Herkunft (big-quest-test.github.io); das Praefix bqt_ bleibt als zweite Sicherung und wird weiter geprueft. */
const KATHIE = {
  bq2_name: JSON.stringify('KATHIE-ECHT'), bq2_total: '777', bq2_kidLang: JSON.stringify('de'), bq2_session: JSON.stringify({ user: 'kathie', id: 'p_71ANFJ3X5V35ZD7H22W1WB4107' }),
  bq2_attempts: JSON.stringify([{ q: 'x', ok: true, t: '2026-11-01T10:00:00Z', w: 'numbers' }]), bq2_personEvents: '{}', bq2_evDevice: JSON.stringify('d_KATHIE'),
  bq_schluessel: 'S0NIQUVTU0VMLUtBVEhJRQ==', bq_abgleich: '{}', gh_token: 'ghp_WERKSTATT0123456789abcdefABCDEF0123'
};
/* haengt einen Zaehler an localStorage.getItem - ganz am Anfang des App-Skripts, also auch fuer alles beim Start */
const lesezaehler = (h) => h.replace(/<script>\s*\(function\(\)\{/, (m) => m + "const __g=localStorage.getItem;localStorage.getItem=function(k){(globalThis.__bqGelesen||(globalThis.__bqGelesen=[])).push(String(k));return __g.call(this,k);};");
/* fetch der Sandbox: api.github.com -> Nachbau (die App selbst bleibt unveraendert); merkt sich jede Adresse */
const umleiten = (anfragen) => (u, o) => { const s = String(u); anfragen.push(s); return fetch(s.startsWith(GITHUB + '/') ? N.basis + s.slice(GITHUB.length) : 'http://127.0.0.1:9/nicht-github', o); };
const warte = (ms) => new Promise((r) => setTimeout(r, ms));
const nurTestRepo = (anfragen) => anfragen.filter((u) => !u.startsWith(GITHUB + '/repos/' + REPO + '/'));

/* Anmeldung als Kind in der Sandbox: Rolle -> Name + Startcode -> vorgeschlagenes Passwort -> Willkommen (Klicks und
   Formulare wie in tests/konto-anmeldung.test.mjs) */
async function kindAnmeldenSandbox(S, name, code, { bisPasswort = false } = {}) {
  const im = (sel) => S.lauf(() => S.$('#loginBody').querySelector(sel));
  const klick = (sel) => S.lauf(() => { const e = im(sel); if (!e) throw new Error('nicht gefunden ' + sel); e.click(); });
  const absenden = (sel) => S.lauf(() => { const k = im(sel); k.click(); const f = k.closest('form'); f.dispatchEvent({ type: 'submit', target: f, currentTarget: f, preventDefault() {}, stopPropagation() {} }); });
  const warten = async (pruef, was) => { const t0 = Date.now(); while (!S.lauf(pruef)) { if (Date.now() - t0 > 30000) throw new Error('wartet vergeblich auf ' + was + ' - Seite: ' + S.lauf(() => S.$('#loginBody').textContent).slice(0, 300)); await warte(15); } };
  klick('#roleStudent');
  S.lauf(() => { im('#loginUser').value = name; im('#loginPw').value = code; });
  absenden('#loginGo');
  await warten(() => im('#setPwForm'), '#setPwForm');
  klick('#pwUse'); absenden('#setPwGo');
  if (bisPasswort) { await warten(() => { const m = im('#setPwMsg'); return m && m.textContent && !/moment/i.test(m.textContent); }, 'Meldung'); return im('#setPwMsg').textContent; }
  // das Kind wartet, bis das Geraet des Elternteils es aufgenommen hat (Konzept 10.3)
  await warten(() => im('#kidWait') || im('#welcomeGo'), '#kidWait');
  if (S.lauf(() => !!im('#kidWait'))) { await ELTERN.sync(); klick('#kidWaitAgain'); }
  await warten(() => im('#welcomeGo'), '#welcomeGo');
  klick('#welcomeGo');
  return null;
}

function runde(S, item) {
  S.karteOeffnen(S.alleKarten().find((k) => k.item === item));
  for (let f = 0; f < 8; f++) { S.frageBeantworten(S.zustand().round[S.zustand().idx]); S.klick('#nextBtn'); }
  S.klick('#homeBtn');
}

test('Sandbox: die Testinstanz startet mit der Anmeldung, meldet sich ueber das Test-Repo an, liest und schreibt nur bqt-Eintraege, Kathies Eintraege bleiben gleich, der Token bleibt nur in bqt_gh', async (t) => {
  const anfragen = [];
  const S = appSandbox({ bauart: 'test', seite: true, speicher: { ...KATHIE, bqt_gh: TOKEN }, anpassen: (h) => lesezaehler(testinstanzUmwandeln(h, ERSATZ)), globale: { fetch: umleiten(anfragen) } });
  t.diagnostic('BQ_SEED=' + S.seed);
  assert.equal(S.lauf(() => S.holen('KONTO_UI')), true, 'Konto-Modus');
  assert.deepEqual(JSON.parse(JSON.stringify(S.lauf(() => S.holen('KONTO_SPEICHER')))), SPEICHER_TESTINSTANZ);
  assert.ok(S.sichtbar('#login') && !S.sichtbar('#home'), 'startet mit der Anmeldung');
  assert.equal(S.lauf(() => !!S.$('#loginBody').querySelector('#kontoTokenForm')), false, 'Zugang schon auf dem Geraet');
  await kindAnmeldenSandbox(S, 'mia.a', CODES['mia.a']);
  const ich = JSON.parse(S.ablage.get('bqt_session'));
  assert.equal(ich.user, 'mia.a');
  assert.ok((await githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis }).geraet('d_Pruefer').directory(await kontoLookup('mia.a'))) !== null, 'Konto liegt im Test-Repo');
  assert.ok(anfragen.length >= 2, 'ueber GitHub angemeldet: ' + anfragen.length);
  assert.deepEqual(nurTestRepo(anfragen), [], 'nur das Test-Repo gefragt');
  runde(S, 'round');
  runde(S, 'numbers');
  const gelesen = [...new Set(S.ctx.__bqGelesen || [])];
  assert.ok(gelesen.length >= 5, 'Zaehler laeuft: ' + gelesen.join(', '));
  assert.deepEqual(gelesen.filter((k) => !k.startsWith('bqt')), [], 'nur bqt gelesen');
  for (const [k, v] of Object.entries(KATHIE)) assert.equal(S.ablage.get(k), v, 'unveraendert: ' + k);
  const neu = [...S.ablage.keys()].filter((k) => !(k in KATHIE));
  assert.deepEqual(neu.filter((k) => !k.startsWith('bqt_')), [], 'nur bqt_ geschrieben');
  assert.ok(neu.some((k) => k.startsWith('bqt_' + ich.id + '__events')) && neu.includes('bqt_evDevice') && neu.includes('bqt_kontoListe'), 'die Testinstanz hat unter der Kennung geuebt: ' + neu.join(', '));
  assert.deepEqual(neu.filter((k) => k !== 'bqt_gh' && S.ablage.get(k).includes(TOKEN)), [], 'Token nirgends sonst');
  assert.deepEqual([...N.dateien(REPO).values()].filter((x) => x.includes(TOKEN)), [], 'Token nicht im Test-Repo');
  assert.equal(S.ablage.get('bqt_gh'), TOKEN);
  assert.equal(S.lauf(() => S.holen('store').get('name', null)), null, 'Kathies Name nicht gelesen');
  const total = S.lauf(() => S.holen('store').get('total', 0));
  assert.ok(total > 0 && total <= 16, 'nur die eigenen Antworten, nicht Kathies 777: ' + total);
  assert.equal(JSON.stringify(S.holen('eventErrors')), '[]');
  assert.deepEqual(JSON.parse(JSON.stringify(S.holen('kontoFehlerListe'))), []);
});

test('Gegenprobe Sandbox: dieselbe Testinstanz mit einem anderen Repo erreicht ihren Speicher nicht - der Startcode bleibt unverbraucht', async (t) => {
  const anfragen = [];
  const fremd = JSON.stringify({ ...SPEICHER_TESTINSTANZ, repo: 'pahlborn/bis-school-app' });
  const S = appSandbox({ bauart: 'test', seite: true, speicher: { bqt_gh: TOKEN }, anpassen: (h) => testinstanzUmwandeln(h, ERSATZ, { speicher: fremd }), globale: { fetch: umleiten(anfragen) } });
  t.diagnostic('BQ_SEED=' + S.seed);
  // im fremden Repo gibt es keine Konten -> die App sagt das gleich bei der Anmeldung (Aufgabe "Abgleich in der App",
  // Befund #137: vorher erst "Passwort waehlen", dann "Startcode gilt nicht")
  const im = (sel) => S.lauf(() => S.$('#loginBody').querySelector(sel));
  S.lauf(() => { im('#roleStudent').click(); im('#loginUser').value = 'mia.c'; im('#loginPw').value = CODES['mia.c']; const k = im('#loginGo'); k.click(); const f = k.closest('form'); f.dispatchEvent({ type: 'submit', target: f, currentTarget: f, preventDefault() {}, stopPropagation() {} }); });
  const t0 = Date.now();
  while (!S.lauf(() => { const m = im('#loginMsg'); return m && m.textContent && !/moment/i.test(m.textContent); })) { if (Date.now() - t0 > 30000) throw new Error('keine Meldung'); await warte(15); }
  const msg = im('#loginMsg').textContent;
  assert.match(msg, /connected to a different storage/, 'Meldung: ' + msg);
  assert.equal(S.lauf(() => !!S.$('#loginBody').querySelector('#setPwForm')), false, 'kein "Passwort waehlen"');
  assert.equal(S.lauf(() => !!S.$('#loginBody').querySelector('#welcomeGo')), false);
  assert.equal(S.ablage.get('bqt_session'), undefined, 'nicht angemeldet');
  assert.ok(anfragen.length >= 1 && anfragen.every((u) => u.startsWith(GITHUB + '/repos/pahlborn/bis-school-app/')), anfragen.join(' '));
  assert.equal(await githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis }).geraet('d_Pruefer').directory(await kontoLookup('mia.c')), null, 'im Test-Repo nichts angelegt');
});

test('Gegenprobe Sandbox: derselbe Testbau ohne Umwandlung liest Kathies bq2_-Eintraege (der Zaehler sieht es)', (t) => {
  const S = appSandbox({ bauart: 'test', speicher: { ...KATHIE }, anpassen: lesezaehler });
  t.diagnostic('BQ_SEED=' + S.seed);
  const gelesen = [...new Set(S.ctx.__bqGelesen || [])];
  assert.ok(gelesen.includes('bq2_session') && gelesen.some((k) => k.startsWith('bq2_')), gelesen.join(', '));
  assert.equal(S.lauf(() => S.holen('store').get('total', 0)), 777);
});

test('Browser: die gebaute Testinstanz startet mit der Anmeldung, Zugang einmal eingeben, Kind meldet sich ueber das Test-Repo an, ein Fach oeffnet sich, nur bqt_-Eintraege gelesen und geschrieben', async () => {
  const server = http.createServer((req, res) => {
    const datei = { '/': 'index.html', '/index.html': 'index.html', '/manifest.webmanifest': 'manifest.webmanifest' }[req.url.split('?')[0]];
    if (!datei) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': datei.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/manifest+json' });
    res.end(fs.readFileSync(path.join(ZIEL, datei)));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const browser = await browserStarten();
  try {
    const ctx = await browser.newContext();
    // nur die App und "api.github.com" (umgelenkt auf den Nachbau - die gebaute Datei bleibt, wie sie ist); alles andere nicht
    const github = [];
    await ctx.route('**/*', async (r) => {
      const u = r.request().url();
      if (u.startsWith(url)) return r.continue();
      if (u.startsWith(GITHUB + '/')) { github.push(r.request().method() + ' ' + u); return r.fulfill({ response: await r.fetch({ url: N.basis + u.slice(GITHUB.length) }) }); }
      return r.abort();
    });
    await ctx.addInitScript(([vorher]) => {
      if (!sessionStorage.getItem('vorbereitet')) { for (const [k, v] of Object.entries(vorher)) localStorage.setItem(k, v); sessionStorage.setItem('vorbereitet', '1'); }
      const g = Storage.prototype.getItem;
      Storage.prototype.getItem = function (k) { if (this === localStorage) (window.__gelesen ||= []).push(String(k)); return g.call(this, k); };
      window.AudioContext = undefined;
    }, [KATHIE]);
    const page = await ctx.newPage();
    const fehler = [];
    page.on('pageerror', (e) => fehler.push(e.message));
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: LADEZEIT_MS });
    await page.waitForSelector('#login:not([hidden])');
    assert.match(await page.title(), /Big Quest \(Test\)$/);
    assert.equal(await page.locator('#home').isVisible(), false, 'ohne Anmeldung keine Startseite');
    // Zugang zum Test-Repo, einmal je Geraet; vorher fragt die App GitHub nicht
    assert.deepEqual(github, []);
    // (Aufgabe "Erstanmeldung per QR-Code": zuerst nur "Geraet verbinden" - hier den Zugangscode einfuegen; eine Anfrage, ✅)
    assert.equal(await page.locator('#roleStudent').count(), 0, 'zuerst nur verbinden');
    await page.locator('#verbLink').fill(TOKEN);
    await page.locator('#verbGo').click();
    await page.waitForSelector('#loginMeldung', { timeout: 30000 });
    assert.match(await page.locator('#loginMeldung').textContent(), /^✅ (Device connected|Gerät verbunden)\.$/);   // Sprache des Geraets
    // Kind: Name + Startcode -> eigenes Passwort -> Willkommen -> Startseite
    await page.locator('#roleStudent').click();
    await page.locator('#loginUser').fill('mia.b');
    await page.locator('#loginPw').fill(CODES['mia.b']);
    await page.locator('#loginGo').click();
    await page.waitForSelector('#setPwForm', { timeout: 30000 });
    await page.locator('#pwUse').click();
    await page.locator('#setPwGo').click();
    // das Kind wartet, bis das Geraet des Elternteils es aufgenommen hat; danach geht es von selbst weiter (Takt der App)
    await page.waitForSelector('#kidWait', { timeout: 30000 });
    await ELTERN.sync();
    await page.locator('#welcomeGo').click({ timeout: 30000 });
    await page.waitForSelector('#home h1');
    await page.locator('#subjects button.subject').first().click();
    await page.waitForSelector('#subjectBody button.world');
    assert.ok(await page.locator('#subjectBody button.world').first().isVisible(), 'Fach-Seite sichtbar');
    const r = await page.evaluate(() => ({ gelesen: [...new Set(window.__gelesen || [])], alle: Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])) }));
    assert.deepEqual(fehler, []);
    assert.equal(JSON.parse(r.alle.bqt_session).user, 'mia.b', 'als Kind angemeldet');
    assert.equal(r.alle.bqt_gh, TOKEN, 'Zugang unter bqt_gh');
    assert.ok(github.length >= 2 && github.every((x) => x.includes(' ' + GITHUB + '/repos/' + REPO + '/')), 'nur das Test-Repo gefragt: ' + github.join(' | '));
    assert.ok(github.some((x) => x.startsWith('PUT ')), 'Konto im Test-Repo angelegt');
    assert.ok((await githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis }).geraet('d_Pruefer').directory(await kontoLookup('mia.b'))) !== null, 'Konto liegt im Test-Repo');
    assert.ok(r.gelesen.length >= 5, r.gelesen.join(', '));
    assert.deepEqual(r.gelesen.filter((k) => !k.startsWith('bqt')), [], 'nur bqt gelesen');
    for (const [k, v] of Object.entries(KATHIE)) assert.equal(r.alle[k], v, 'unveraendert: ' + k);
    assert.deepEqual(Object.keys(r.alle).filter((k) => !(k in KATHIE) && !k.startsWith('bqt_')), [], 'nur bqt_ geschrieben');
  } finally { await browser.close(); server.close(); }
});

test('Abgleichstatus einer Bewertungsfassung folgt der bestätigten Übertragung im Testbau', () => {
  const child = 'p_fixture3c', area = 'schule:' + child, revision = 'revision-1';
  const entry = { event: { id: 'e_fixture', type: 'school_evaluation', payload: { child, revision } }, sig: 'signed-fixture' };
  const status = (stand) => {
    const S = appSandbox({
      bauart: 'test',
      anpassen: () => APP,
      speicher: { bqt_abgleich: JSON.stringify({ [area]: { bereich: area, log: [entry], ausgang: [], ...stand } }) },
    });
    return S.holen('schoolEvaluationSyncedRevisions')(child).has(revision);
  };
  assert.equal(status({ ausgang: [entry] }), false, 'signed but queued');
  assert.equal(status({ unterwegs: { inhalt: { eintraege: [{ id: entry.event.id }] } } }), false, 'pending encrypted bundle');
  assert.equal(status({ log: [] }), false, 'saved only to the app log');
  assert.equal(status({}), true, 'signed and upload confirmed');
});
