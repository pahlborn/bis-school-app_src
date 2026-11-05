// Stufe 3c, Werkzeug-Teil: Bauart "Testinstanz" (werkzeug/testinstanz.mjs, testinstanzBauen in werkzeug/bauen.mjs).
// Testbau ohne Schuldaten, ohne konten.json, ohne Familienpasswort; Speicher unter bqt_, Token unter bqt_gh. Der Suchlauf
// (testinstanzPruefen) findet jede Abweichung - hier je Pruefung mit einer absichtlich falschen Fassung belegt.
// Dazu: die gebaute App liest und schreibt in der Node-Sandbox und im Browser nur bqt_ (Kathies Eintraege auf derselben
// Herkunft bleiben unberuehrt).
//   node --test tests/testinstanz.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { WURZEL, QUELLEN, testinstanzBauen, appZusammensetzen } from '../werkzeug/bauen.mjs';
import { TESTINSTANZ, ersatzLesen, testinstanzUmwandeln, testinstanzPruefen, testinstanzManifest, geraeteNamen, VERSION_AUS_KLARTEXT } from '../werkzeug/testinstanz.mjs';
import { woerterLesen } from '../werkzeug/kern.mjs';
import { appLesen } from '../werkzeug/module.mjs';
import { GITHUB_TOKEN_SCHLUESSEL } from '../src/module/github.mjs';
import { appSandbox } from './app-sandbox.mjs';
import { browserStarten, LADEZEIT_MS } from './app-hilfen.mjs';

const VERSION = { n: 999, hash: 'abc1234', date: '04.11.2026 18:00', draft: false };
const lies = (rel) => fs.readFileSync(path.join(WURZEL, rel), 'utf8');
const WOERTER = woerterLesen(lies(QUELLEN.woerter));
const SCHULE = JSON.parse(lies('werkzeug/schuldaten.json'));
const KONTEN = JSON.parse(lies('werkzeug/konten.json'));
const SALT = JSON.parse(lies(QUELLEN.salz)).salt;
let ERSATZ, ZIEL, GEBAUT, APP, MANIFEST, KONTEXT;

before(async () => {
  ERSATZ = await ersatzLesen();
  ZIEL = fs.mkdtempSync(path.join(os.tmpdir(), 'bq-testinstanz-'));
  GEBAUT = await testinstanzBauen({ ziel: ZIEL, version: VERSION });
  APP = fs.readFileSync(path.join(ZIEL, 'index.html'), 'utf8');
  MANIFEST = fs.readFileSync(path.join(ZIEL, 'manifest.webmanifest'), 'utf8');
  KONTEXT = { woerter: WOERTER, auchVerboten: ERSATZ.auchVerboten, schule: SCHULE, konten: KONTEN, salt: SALT };
});
after(() => { fs.rmSync(ZIEL, { recursive: true, force: true }); });

const funde = (app, manifest = MANIFEST) => testinstanzPruefen(app, manifest, KONTEXT).funde;
/* erwartet genau einen Fund, und zwar bei dieser Pruefung */
const nurFund = (app, pruefung, manifest) => { const f = funde(app, manifest); assert.equal(f.length, 1, JSON.stringify(f)); assert.ok(f[0].startsWith(pruefung), f[0]); };

test('Bau: Suchlauf bestanden, fuenf Dateien, App im Klartext = umgewandelter Testbau, eigener Name, Version drin', () => {
  assert.deepEqual(GEBAUT.dateien, ['index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png']);
  for (const d of GEBAUT.dateien) assert.ok(fs.existsSync(path.join(ZIEL, d)), d);
  assert.equal(GEBAUT.pruefungen.length, 15);
  assert.deepEqual(GEBAUT.pruefungen.filter((p) => !p.ok), []);
  assert.deepEqual(funde(APP), []);
  assert.ok(APP.startsWith('<!DOCTYPE html>') || APP.startsWith('<!doctype html>'), 'die App selbst, keine Huelle');
  assert.ok(APP.includes('const APP_VERSION={"n":999,"hash":"abc1234"'), 'Version eingesetzt');
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
  assert.ok(APP.includes('Stage Show') && APP.includes('Save the Park') && APP.includes('https://pahlborn.github.io/bis-school-app-test/'));
  // ausser Praefixen, Ersetzungen, GLOBAL_KEYS, Titeln und publishedVersion ist jede Zeile gleich
  const ohnePV = (x) => x.replace(/async function publishedVersion\(\)\{[\s\S]*?\n\}/, 'PUBLISHED_VERSION');
  const zeilenA = ohnePV(roh).split('\n'), zeilenB = ohnePV(APP).split('\n');
  assert.equal(zeilenA.length, zeilenB.length, 'gleiche Zeilenzahl');
  const praefix = (z) => z.replace(/bq2_|\bbq_/g, 'bqt_').replace(/\bbqUpdateTo\b/g, 'bqtUpdateTo');
  const anders = zeilenA.map((z, i) => [z, zeilenB[i]]).filter(([a, b]) => praefix(a) !== b);
  assert.ok(anders.length >= 10 && anders.length < 40, 'Zahl der Zeilen mit mehr als Praefixen: ' + anders.length);
  const erklaert = anders.filter(([a]) => /GLOBAL_KEYS=|<title>|apple-mobile-web-app-title/.test(a) || ERSATZ.ersetzen.some(([s]) => a.toLowerCase().includes(s.toLowerCase())));
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
  assert.throws(() => testinstanzUmwandeln(testbau + "<script>localStorage.getItem('bq2_abgleich')</script>", ERSATZ), /"abgleich" ist Geraetename und zugleich Speicherstelle/);
  assert.throws(() => testinstanzUmwandeln(testbau + "<script>store.get('gh',null)</script>", ERSATZ), /"gh" ist Geraetename/);
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

/* Kathies echte Eintraege auf derselben Herkunft (pahlborn.github.io) - die Testinstanz darf sie nie lesen oder aendern */
const KATHIE = {
  bq2_name: JSON.stringify('KATHIE-ECHT'), bq2_total: '777', bq2_kidLang: JSON.stringify('de'), bq2_session: JSON.stringify({ user: 'kathie', id: 'p_71ANFJ3X5V35ZD7H22W1WB4107' }),
  bq2_attempts: JSON.stringify([{ q: 'x', ok: true, t: '2026-11-01T10:00:00Z', w: 'numbers' }]), bq2_personEvents: '{}', bq2_evDevice: JSON.stringify('d_KATHIE'),
  bq_schluessel: 'S0NIQUVTU0VMLUtBVEhJRQ==', bq_abgleich: '{}', gh_token: 'ghp_WERKSTATT0123456789abcdefABCDEF0123'
};
const TOKEN = 'github_pat_TESTINSTANZ_' + 'x7'.repeat(20);
/* haengt einen Zaehler an localStorage.getItem - ganz am Anfang des App-Skripts, also auch fuer alles beim Start */
const lesezaehler = (h) => h.replace(/<script>\s*\(function\(\)\{/, (m) => m + "const __g=localStorage.getItem;localStorage.getItem=function(k){(globalThis.__bqGelesen||(globalThis.__bqGelesen=[])).push(String(k));return __g.call(this,k);};");

function runde(S, item) {
  S.karteOeffnen(S.alleKarten().find((k) => k.item === item));
  for (let f = 0; f < 8; f++) { S.frageBeantworten(S.zustand().round[S.zustand().idx]); S.klick('#nextBtn'); }
  S.klick('#homeBtn');
}

test('Sandbox: die Testinstanz liest nur bqt-Eintraege, schreibt nur bqt-Eintraege, Kathies Eintraege bleiben gleich, der Token bleibt nur in bqt_gh', (t) => {
  const S = appSandbox({ bauart: 'test', speicher: { ...KATHIE, bqt_gh: TOKEN }, anpassen: (h) => lesezaehler(testinstanzUmwandeln(h, ERSATZ)) });
  t.diagnostic('BQ_SEED=' + S.seed);
  runde(S, 'round');
  runde(S, 'numbers');
  const gelesen = [...new Set(S.ctx.__bqGelesen || [])];
  assert.ok(gelesen.length >= 5, 'Zaehler laeuft: ' + gelesen.join(', '));
  assert.deepEqual(gelesen.filter((k) => !k.startsWith('bqt')), [], 'nur bqt gelesen');
  for (const [k, v] of Object.entries(KATHIE)) assert.equal(S.ablage.get(k), v, 'unveraendert: ' + k);
  const neu = [...S.ablage.keys()].filter((k) => !(k in KATHIE));
  assert.deepEqual(neu.filter((k) => !k.startsWith('bqt_')), [], 'nur bqt_ geschrieben');
  assert.ok(neu.includes('bqt_events') && neu.includes('bqt_evDevice'), 'die Testinstanz hat geuebt: ' + neu.join(', '));
  assert.deepEqual(neu.filter((k) => k !== 'bqt_gh' && S.ablage.get(k).includes(TOKEN)), [], 'Token nirgends sonst');
  assert.equal(S.ablage.get('bqt_gh'), TOKEN);
  assert.equal(S.lauf(() => S.holen('store').get('name', null)), null, 'Kathies Name nicht gelesen');
  const total = S.lauf(() => S.holen('store').get('total', 0));
  assert.ok(total > 0 && total <= 16, 'nur die eigenen Antworten, nicht Kathies 777: ' + total);
  assert.equal(JSON.stringify(S.holen('eventErrors')), '[]');
});

test('Gegenprobe Sandbox: derselbe Testbau ohne Umwandlung liest Kathies bq2_-Eintraege (der Zaehler sieht es)', (t) => {
  const S = appSandbox({ bauart: 'test', speicher: { ...KATHIE }, anpassen: lesezaehler });
  t.diagnostic('BQ_SEED=' + S.seed);
  const gelesen = [...new Set(S.ctx.__bqGelesen || [])];
  assert.ok(gelesen.includes('bq2_session') && gelesen.some((k) => k.startsWith('bq2_')), gelesen.join(', '));
  assert.equal(S.lauf(() => S.holen('store').get('total', 0)), 777);
});

test('Browser: die gebaute Testinstanz startet ohne Fehler, ein Fach oeffnet sich, nur bqt_-Eintraege gelesen und geschrieben', async () => {
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
    await ctx.route('**/*', (r) => (r.request().url().startsWith(url) ? r.continue() : r.abort()));
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
    await page.waitForSelector('#home h1');
    assert.match(await page.title(), /Big Quest \(Test\)$/);
    await page.locator('#subjects button.subject').first().click();
    await page.waitForSelector('#subjectBody button.world');
    assert.ok(await page.locator('#subjectBody button.world').first().isVisible(), 'Fach-Seite sichtbar');
    const r = await page.evaluate(() => ({ gelesen: [...new Set(window.__gelesen || [])], alle: Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])) }));
    assert.deepEqual(fehler, []);
    assert.ok(r.gelesen.length >= 5, r.gelesen.join(', '));
    assert.deepEqual(r.gelesen.filter((k) => !k.startsWith('bqt')), [], 'nur bqt gelesen');
    for (const [k, v] of Object.entries(KATHIE)) assert.equal(r.alle[k], v, 'unveraendert: ' + k);
    assert.deepEqual(Object.keys(r.alle).filter((k) => !(k in KATHIE) && !k.startsWith('bqt_')), [], 'nur bqt_ geschrieben');
  } finally { await browser.close(); server.close(); }
});
