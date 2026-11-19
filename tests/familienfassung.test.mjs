// Vorbereitung Stufe 4, Aufgabe "Familienfassung bauen" (05.11.): Bauart "Familie" (werkzeug/familie.mjs, familieBauen
// in werkzeug/bauen.mjs) - die echte App mit Konto-, GitHub- und Abgleich-Modulen, ohne konten.json, ohne Schuldaten,
// ohne Testpersonen, verschluesselt mit dem Familienpasswort, Speicher pahlborn/bis-school-app-familie, Eintraege im
// Browser unter bqf_ (Kathies bisherige bq2_-Eintraege bleiben unberuehrt). NICHT veroeffentlicht.
//   1 Bau: Suchlauf bestanden, Huelle mit Tresor, die App im Tresor = umgewandelter Testbau, neutrales Manifest
//   2 Umwandlung: ausser Praefixen nur erklaerte Zeilen
//   3 Gegenproben Suchlauf und Umwandlung; der Bau bricht ab und schreibt nichts
//   4 Sandbox mit der GEBAUTEN Familienfassung (aus dem Tresor) am GitHub-Nachbau (api.github.com umgelenkt):
//     Peter meldet sich mit Startlink an, legt Kathie an, Kathie meldet sich an und uebt; Schulbewertungen per Werkzeug
//     ins Konto -> der Elternbereich zeigt sie (aus dem Konto, nicht aus SCHOOL_DATA); Export (lesbare Seite + JSON);
//     Kind loeschen (mit Gegenprobe falscher Name) -> Speicher leer, Kathies Geraet meldet ab und loescht Aufnahmen;
//     Mein Konto loeschen (falsches Passwort, dann richtig) -> Familie weg, Peter abgemeldet. Nur bqf_ gelesen und
//     geschrieben, Kathies alte Eintraege unveraendert.
//   5 Browser: Huelle -> Familienpasswort -> die Familienfassung startet mit der Anmeldung (Zugang zum Speicher)
//   node --test tests/familienfassung.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { WURZEL, QUELLEN, familieBauen, appZusammensetzen } from '../werkzeug/bauen.mjs';
import { FAMILIE, SPEICHER_FAMILIE, TOKEN_ZEILE_FAMILIE, familieUmwandeln, familiePruefen, testpersonenNamen } from '../werkzeug/familie.mjs';
import { SPEICHER_MARKE, TESTINSTANZ } from '../werkzeug/testinstanz.mjs';
import { woerterLesen, entschluesseln, tresorAusHuelle, ohneTresor } from '../werkzeug/kern.mjs';
import { appLesen } from '../werkzeug/module.mjs';
import { schulbewertungenUebernehmen } from '../werkzeug/schulbewertungen-uebernehmen.mjs';
import { githubSpeicher } from '../src/module/github.mjs';
import { startcodeAusstellen, ersteAnmeldung, kontoLookup } from '../src/module/konto.mjs';
import { anmStartlink } from '../src/module/anmeldung.mjs';
import { neuFormular, registrieren } from './erstanmeldung-hilfen.mjs';
import { keyFingerprint } from '../src/module/krypto.mjs';
import { appSandbox, stellbareUhr } from './app-sandbox.mjs';
import { browserStarten, LADEZEIT_MS } from './app-hilfen.mjs';
import { githubNachbau } from './module/github-nachbau.mjs';
import { TEST_PW } from './hilfen.mjs';

const VERSION = { major: 0, minor: 998, patch: 0, kanal: 'beta', hash: 'fam1234', date: '05.11.2026 21:00', draft: false };
const lies = (rel) => fs.readFileSync(path.join(WURZEL, rel), 'utf8');
const WOERTER = woerterLesen(lies(QUELLEN.woerter));
const SCHULE = JSON.parse(lies('werkzeug/schuldaten.json'));
const KONTEN = JSON.parse(lies('werkzeug/konten.json'));
const BEISPIEL = JSON.parse(fs.readFileSync(new URL('./schuldaten-beispiel.json', import.meta.url), 'utf8'));
const MANIFEST_NEUTRAL = lies(QUELLEN.manifest);
const KONTEXT = { woerter: WOERTER, schule: SCHULE, konten: KONTEN, version: VERSION };
const REPO = FAMILIE.repoDaten, GITHUB = 'https://api.github.com';
const TOKEN = 'github_pat_FAMILIE_' + 'f4'.repeat(20);           // nur im Nachbau gueltig
const SPEICHER_ZEILE = 'const KONTO_SPEICHER=' + JSON.stringify(SPEICHER_FAMILIE) + ';';
const MIN = 60000;
let ZIEL, GEBAUT, HTML, APP, MANIFEST;

before(async () => {
  ZIEL = fs.mkdtempSync(path.join(os.tmpdir(), 'bq-familie-'));
  GEBAUT = await familieBauen(TEST_PW, { ziel: ZIEL, version: VERSION });
  HTML = fs.readFileSync(path.join(ZIEL, 'index.html'), 'utf8');
  MANIFEST = fs.readFileSync(path.join(ZIEL, 'manifest.webmanifest'), 'utf8');
  APP = Buffer.from(await entschluesseln(tresorAusHuelle(HTML), TEST_PW)).toString('utf8');
});
const nachbauten = [];
after(async () => { fs.rmSync(ZIEL, { recursive: true, force: true }); for (const n of nachbauten) await n.schliessen(); });

const funde = (app, html = HTML, manifest = MANIFEST) => familiePruefen(app, html, manifest, KONTEXT).funde;
const nurFund = (app, pruefung, html, manifest) => { const f = funde(app, html, manifest); assert.equal(f.length, 1, JSON.stringify(f)); assert.ok(f[0].startsWith(pruefung), f[0]); };
const testbauRoh = () => appZusammensetzen(appLesen('utf8', { bauart: 'test' }), VERSION, null, null).toString('utf8');

test('Bau: Suchlauf bestanden, fuenf Dateien, Huelle mit Tresor, im Tresor der umgewandelte Testbau, Manifest wie Kathies App', () => {
  assert.deepEqual(GEBAUT.dateien, ['index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png']);
  for (const d of GEBAUT.dateien) assert.ok(fs.existsSync(path.join(ZIEL, d)), d);
  assert.equal(GEBAUT.pruefungen.length, 19);
  assert.deepEqual(GEBAUT.pruefungen.filter((p) => !p.ok), []);
  assert.deepEqual(funde(APP), []);
  assert.match(HTML, /<script type="application\/json" id="tresor">/, 'Huelle mit Tresor');
  assert.ok(!ohneTresor(HTML).includes('KONTO_SPEICHER') && !HTML.includes(REPO), 'nichts von der App im Klartext');
  assert.equal(APP, familieUmwandeln(testbauRoh()), 'im Tresor liegt genau der umgewandelte Testbau');
  assert.equal(MANIFEST, MANIFEST_NEUTRAL, 'gleiches Manifest wie Kathies App (gleiche Adresse, gleicher Name)');
  assert.equal(APP.split(SPEICHER_ZEILE).length, 2, 'mit dem Familien-Repo verbunden');
  assert.deepEqual(SPEICHER_FAMILIE, { art: 'github', repo: 'pahlborn/bis-school-app-familie', wurzel: '' });
  assert.ok(APP.includes(TOKEN_ZEILE_FAMILIE));
  assert.ok(APP.includes('const APP_VERSION={"major":0,"minor":998,"patch":0,"kanal":"beta","hash":"fam1234"'), 'Version eingesetzt');
  assert.ok(APP.includes("localStorage.getItem('bq_schluessel')") && APP.split('bq_schluessel').length === 2, 'Familienschluessel genau einmal (Selbst-Aktualisierung)');
  assert.match(APP, /const GLOBAL_KEYS=\/\^\(abgleich\|abgleichVerworfen\|geraetEntfernen\|gh\|session\|/);
  for (const k of ["'bqf_session'", "'bqf_kontoListe'", "'bqf_abgleich'", "'bqf_evDevice'", "'bqf_gh'", "'bqUpdateTo'"]) assert.ok(APP.includes(k), k);
  assert.ok(!/bq2_|\bbqt_/.test(APP), 'kein bq2_ und kein bqt_');
  assert.match(APP, /<title>[^<]*Big Quest<\/title>/, 'Titel wie Kathies App');
});

test('Umwandlung: ausser Praefixen nur Speicher, Token-Eintrag und GLOBAL_KEYS', () => {
  const roh = testbauRoh();
  const zeilenA = roh.split('\n'), zeilenB = APP.split('\n');
  assert.equal(zeilenA.length, zeilenB.length, 'gleiche Zeilenzahl');
  const praefix = (z) => z.replace(/bq2_/g, 'bqf_').replace(/\bbq_(?!schluessel\b)/g, 'bqf_');
  const anders = zeilenA.map((z, i) => [z, zeilenB[i]]).filter(([a, b]) => praefix(a) !== b);
  const erklaert = anders.filter(([a, b]) => /const GLOBAL_KEYS=/.test(a)
    || (a.trim() === 'const KONTO_SPEICHER=' + SPEICHER_MARKE + ';' && b.trim() === SPEICHER_ZEILE)
    || (a.includes("GITHUB_TOKEN_SCHLUESSEL = 'bqt_gh'") && b.includes(TOKEN_ZEILE_FAMILIE)));
  assert.equal(anders.length, 3, 'drei Zeilen: ' + anders.map(([x]) => x.trim().slice(0, 60)).join(' | '));
  assert.equal(erklaert.length, 3);
});

test('Gegenproben Suchlauf: jede Abweichung wird gefunden', () => {
  // Kathies Schuldaten / Konten wieder drin
  const mitSchule = APP.replace('const SCHOOL_DATA=null||{};', () => 'const SCHOOL_DATA=' + JSON.stringify({ p_X: SCHULE.kinder[Object.keys(SCHULE.kinder)[0]] }) + '||{};');
  const f1 = funde(mitSchule);
  assert.ok(f1.some((f) => f.startsWith('Schuldaten leer')) && f1.some((f) => f.startsWith('kein Text aus schuldaten.json')), JSON.stringify(f1));
  const mitKonten = APP.replace('normAccounts(/*BQ_KONTEN*/null)', () => 'normAccounts(' + JSON.stringify({ version: 2, users: KONTEN.users.map((u) => ({ id: u.id, user: 'x' + u.id.slice(-4).toLowerCase(), kind: u.kind, start: u.start })) }) + ')');
  const f2 = funde(mitKonten);
  assert.ok(f2.some((f) => f.startsWith('Konten leer')) && f2.some((f) => f.startsWith('keine Kennung')), JSON.stringify(f2));
  // Testpersonen: jeder Name, irgendwo in der App
  assert.equal(testpersonenNamen().length, 4, testpersonenNamen().join(','));
  for (const n of testpersonenNamen()) nurFund(APP.replace('</body>', `<!-- ${n} --></body>`), 'keine Testpersonen');
  assert.deepEqual(funde(APP.replace('</body>', '<!-- peter.ahlborner, jonas.testpapax, Peter Ahlborner --></body>')), [], 'nur ganze Anmeldenamen zaehlen');
  // Testinstanz: Praefix, Repo, Adresse, Name
  for (const x of ["localStorage.getItem('bqt_gh')", TESTINSTANZ.repoDaten, TESTINSTANZ.adresse, TESTINSTANZ.name]) {
    const f = funde(APP.replace('</body>', `<!-- ${x} --></body>`));
    assert.ok(f.some((y) => y.startsWith('nichts von der Testinstanz')), x + ': ' + JSON.stringify(f));
  }
  // alte Praefixe (Kathies Eintraege) / feste Speicherstelle ohne bqf_
  for (const rest of ["localStorage.getItem('bq2_name')", "localStorage.getItem('bq_abgleich')"]) {
    const f = funde(APP + '<script>' + rest + '</script>');
    assert.ok(f.some((x) => x.startsWith('kein bq2_')) && f.some((x) => x.startsWith('feste Speicherstellen')), rest + ': ' + JSON.stringify(f));
  }
  nurFund(APP + "<script>localStorage.getItem('fremd')</script>", 'feste Speicherstellen');
  // Schriften: wieder von Google Fonts, eine Schrift fehlt
  nurFund(APP.replace('</head>', '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito"></head>'), 'Schriften eingebettet');
  nurFund(APP.replace(/url\(data:font\/woff2;base64,[A-Za-z0-9+/]+={0,2}\)/, 'url(x.woff2)'), 'Schriften eingebettet');
  nurFund(APP.replace(TOKEN_ZEILE_FAMILIE, "const GITHUB_TOKEN_SCHLUESSEL = 'bqf_token';"), 'Token-Eintrag');
  nurFund(APP.replace('const GLOBAL_KEYS=/^(abgleich|abgleichVerworfen|geraetEntfernen|gh|', 'const GLOBAL_KEYS=/^(abgleich|abgleichVerworfen|geraetEntfernen|'), 'Geraetedaten und Token');
  // Speicher: Marke, null, anderes Repo (Kathies App, Test-Repo), Nachbau-Adresse, Unterordner, zweimal
  const mitSpeicher = (s) => APP.replace(SPEICHER_ZEILE, () => 'const KONTO_SPEICHER=' + s + ';');
  for (const s of [SPEICHER_MARKE, 'null', JSON.stringify({ ...SPEICHER_FAMILIE, repo: 'pahlborn/bis-school-app' }), JSON.stringify({ ...SPEICHER_FAMILIE, repo: 'pahlborn/bis-school-app-familie2' }),
    JSON.stringify({ ...SPEICHER_FAMILIE, basis: 'http://127.0.0.1:9' }), JSON.stringify({ ...SPEICHER_FAMILIE, wurzel: 'x' }), 'globalThis.__bqWelt'])
    nurFund(mitSpeicher(s), 'mit dem Familien-Repo verbunden');
  nurFund(APP.replace(SPEICHER_ZEILE, () => SPEICHER_ZEILE + SPEICHER_ZEILE), 'mit dem Familien-Repo verbunden');
  // Selbst-Aktualisierung: ohne Familienschluessel (wie die Testinstanz), doppelt
  nurFund(APP.replace("localStorage.getItem('bq_schluessel')", "localStorage.getItem('bqf_schluessel')"), 'Aktualisierung mit dem Familienschluessel');
  const pv = /async function publishedVersion\(\)\{[\s\S]*?\n\}/.exec(APP)[0];
  nurFund(APP.replace(pv, () => pv + '\n' + pv.replace("localStorage.getItem('bq_schluessel')", "localStorage.getItem('bqf_x')")), 'Aktualisierung mit dem Familienschluessel');
  // Live-Bau statt Testbau, ohne Version
  const live = funde(appLesen('utf8', { bauart: 'live' }).replace('/*BQ_VERSION*/null', JSON.stringify(VERSION)).replace(SPEICHER_MARKE, JSON.stringify(SPEICHER_FAMILIE)).replace(/bq2_/g, 'bqf_'));
  assert.ok(live.some((f) => f.startsWith('Testbau')), 'Live-Bau erkannt: ' + JSON.stringify(live));
  nurFund(APP.replace(/const APP_VERSION=\{[^}]*\};/, 'const APP_VERSION=null;'), 'Version eingesetzt');
  // die Huelle: ohne Tresor (App im Klartext), verbotenes Wort draussen, Version draussen, Repo draussen
  assert.ok(funde(APP, APP).some((f) => f.startsWith('verschluesselt')), 'App im Klartext statt Huelle');
  nurFund(APP, 'verschluesselt', null);
  // (ohne Tresor-Kennung zaehlt der verschluesselte Text als oeffentlich - darin kann zufaellig ein "Wort" stecken)
  assert.ok(funde(APP, HTML.replace('<script type="application/json" id="tresor">', '<script type="application/json" id="leer">')).some((f) => f.startsWith('verschluesselt')), 'Huelle ohne Tresor');
  nurFund(APP, 'verschluesselt', HTML.replace('</body>', '<script>const KONTO_SPEICHER=null;</script></body>'));
  for (const w of WOERTER) nurFund(APP, 'keine verbotenen Woerter', HTML.replace('</body>', `<!-- ${w} --></body>`));
  nurFund(APP, 'keine verbotenen Woerter', HTML, JSON.stringify({ ...JSON.parse(MANIFEST), description: 'Bhan' }));
  nurFund(APP, 'Version nicht im oeffentlichen Teil', HTML.replace('</body>', `<!-- ${VERSION.hash} --></body>`));
  nurFund(APP, 'Repo der Familie nicht im oeffentlichen Teil', HTML.replace('</body>', `<!-- ${REPO} --></body>`));
});

test('Gegenproben Umwandlung: geaenderte Stellen in index.html und Namensgleichheit brechen ab', () => {
  const roh = testbauRoh();
  assert.throws(() => familieUmwandeln(roh.replace('const GLOBAL_KEYS=/^(', 'const GLOBAL_KEYS = /^(')), /GLOBAL_KEYS 0x statt 1x/);
  assert.throws(() => familieUmwandeln(roh.replace(SPEICHER_MARKE, 'null')), /Marke \/\*BQ_SPEICHER\*\/null 0x statt 1x/);
  assert.throws(() => familieUmwandeln(roh.replace(SPEICHER_MARKE, SPEICHER_MARKE + '||' + SPEICHER_MARKE)), /Marke \/\*BQ_SPEICHER\*\/null 2x statt 1x/);
  assert.throws(() => familieUmwandeln(roh.replace("const GITHUB_TOKEN_SCHLUESSEL = 'bqt_gh';", "const GITHUB_TOKEN_SCHLUESSEL = 'x_gh';")), /Token-Eintrag bqt_gh 0x/);
  assert.throws(() => familieUmwandeln(roh.replace("localStorage.getItem('bq_schluessel')", "localStorage.getItem('bq_key')")), /bq_schluessel \(Selbst-Aktualisierung\) 0x/);
  assert.throws(() => familieUmwandeln(roh + "<script>localStorage.getItem('bq2_abgleich')</script>"), /"abgleich" ist Geraetename und zugleich Speicherstelle/);
  assert.throws(() => familieUmwandeln(roh + "<script>store.get('gh',null)</script>"), /"gh" ist Geraetename/);
});

test('Bau bricht ab und schreibt nichts, wenn eine Testperson in index.html steht; gleiche Quelle -> gleiche App', async () => {
  const w = fs.mkdtempSync(path.join(os.tmpdir(), 'bq-fam-wurzel-'));
  try {
    for (const d of ['src/module', 'werkzeug']) fs.cpSync(path.join(WURZEL, d), path.join(w, d), { recursive: true, filter: (q) => !q.includes('node_modules') });
    for (const d of ['icon-180.png', 'icon-192.png', 'icon-512.png']) fs.copyFileSync(path.join(WURZEL, d), path.join(w, d));
    fs.writeFileSync(path.join(w, 'index.html'), lies('index.html').replace('</body>', '<!-- Peter Ahlborn --></body>'));
    const ziel = path.join(w, 'ziel');
    await assert.rejects(familieBauen(TEST_PW, { wurzel: w, ziel, version: VERSION }), /Suchlauf Familienfassung, nichts geschrieben:\n {2}- keine Testpersonen[^\n]*"Peter Ahlborn"/);
    assert.equal(fs.existsSync(ziel), false, 'nichts geschrieben');
    fs.writeFileSync(path.join(w, 'index.html'), lies('index.html'));
    await familieBauen(TEST_PW, { wurzel: w, ziel, version: VERSION });
    const app = Buffer.from(await entschluesseln(tresorAusHuelle(fs.readFileSync(path.join(ziel, 'index.html'), 'utf8')), TEST_PW)).toString('utf8');
    assert.equal(app, APP, 'gleiche Quelle -> gleiche Familienfassung');
  } finally { fs.rmSync(w, { recursive: true, force: true }); }
});

/* ---------- Sandbox mit der gebauten Familienfassung ---------- */
/* Kathies bisherige Eintraege auf derselben Herkunft (bisherige App, Werkstatt-Apps) - die Familienfassung liest und
   aendert sie nie (Rueckweg: die bisherige Fassung findet sie unveraendert) */
const ALT = {
  bq2_name: JSON.stringify('KATHIE-ALT'), bq2_total: '777', bq2_session: JSON.stringify({ user: 'kathie', id: 'p_71ANFJ3X5V35ZD7H22W1WB4107' }),
  bq2_p_71ANFJ3X5V35ZD7H22W1WB4107__total: '777', bq2_migr: JSON.stringify({ v: 1, ok: true, at: '2026-11-02T10:00:00Z' }),
  bq2_personEvents: '{}', bq2_evDevice: JSON.stringify('d_ALT'), bq_schluessel: 'S0NIQUVTU0VMLUFMVA==', gh_token: 'ghp_WERKSTATT0123456789abcdefABCDEF0123'
};
const lesezaehler = (h) => h.replace(/<script>\s*\(function\(\)\{/, (m) => m + "const __g=localStorage.getItem;localStorage.getItem=function(k){(globalThis.__bqGelesen||(globalThis.__bqGelesen=[])).push(String(k));return __g.call(this,k);};");
const warte = (ms) => new Promise((r) => setTimeout(r, ms));
const roh = (x) => (x === undefined ? x : JSON.parse(JSON.stringify(x)));
const link = (l) => l.slice(l.indexOf('#'));

async function welt() {
  const N = await githubNachbau({ token: TOKEN, repos: [REPO] });
  nachbauten.push(N);
  const uhr = stellbareUhr(Date.now());
  const z = githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis }).geraet('d_Werkzeug1');
  const sc = await startcodeAusstellen({ zugang: z, aussteller: null, anmeldename: 'admin', art: 'admin', now: Date.now() });
  const admin = await ersteAnmeldung({ zugang: z, code: sc.code, passwort: 'Werkzeug-Admin-Passwort-1', now: Date.now(), runden: 1000 });
  return {
    N, uhr,
    speicher: { geraet: (d) => githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis }).geraet(d) },
    startlink: async (name) => { const s = await startcodeAusstellen({ zugang: z, aussteller: admin, anmeldename: name, art: 'parent', now: Date.now() }); return link(anmStartlink('http://127.0.0.1/', { anmeldename: name, code: s.code, fingerabdruck: s.fingerabdruck })); }
  };
}
function idbNachbau() {
  const dbs = new Map(), geloescht = [];
  return {
    geloescht,
    open(name) {
      const r = { result: undefined, onsuccess: null, onerror: null, onupgradeneeded: null };
      Promise.resolve().then(() => {
        const neu = !dbs.has(name); if (neu) dbs.set(name, new Map());
        const daten = dbs.get(name);
        r.result = {
          createObjectStore() {}, close() {},
          transaction() {
            const t = { oncomplete: null, onerror: null, onabort: null };
            const s = { put(o) { daten.set(o.kennung || o.id, o); return { result: o.kennung }; }, delete(k) { daten.delete(k); return { result: undefined }; }, clear() { daten.clear(); return { result: undefined }; }, getAll() { return { result: [...daten.values()] }; } };
            t.objectStore = () => s;
            Promise.resolve().then(() => t.oncomplete && t.oncomplete());
            return t;
          }
        };
        if (neu && r.onupgradeneeded) r.onupgradeneeded();
        if (r.onsuccess) r.onsuccess();
      });
      return r;
    },
    deleteDatabase(n) { geloescht.push(n); dbs.delete(n); }
  };
}
/* ein Geraet mit der gebauten Familienfassung (unveraendert aus dem Tresor; nur der Lesezaehler davor) */
function geraet(t, W, { name, hash = '' } = {}) {
  const geteilt = [], anfragen = [], idb = idbNachbau();
  const S = appSandbox({
    bauart: 'test', seite: true, uhr: W.uhr, speicher: { ...ALT, bqf_gh: TOKEN },
    anpassen: () => lesezaehler(APP),
    globale: {
      location: { href: 'http://127.0.0.1/' + hash, origin: 'http://127.0.0.1', protocol: 'http:', host: '127.0.0.1', hostname: '127.0.0.1', pathname: '/', search: '', hash, replace() {}, reload() {}, assign() {} },
      File: class { constructor(teile, n, o) { this.text = teile.join(''); this.name = n; this.type = o && o.type; } },
      navigator: { userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) Safari/604.1', language: 'de-DE', languages: ['de-DE'], onLine: true, standalone: false, canShare: () => true, share: async ({ files }) => { geteilt.push(...files); } },
      indexedDB: idb,
      fetch: async (u, o) => {
        const s = String(u);
        anfragen.push(s);
        if (!s.startsWith(GITHUB + '/')) throw new TypeError('Failed to fetch');
        return fetch(W.N.basis + s.slice(GITHUB.length), o);
      }
    }
  });
  t.diagnostic(name + ': BQ_SEED=' + S.seed);
  W.uhr.ruhe(() => S.holen('kontoLauf'));
  const finde = (sel) => S.lauf(() => S.$('#loginBody').querySelector(sel) || neuFormular(G, sel) || S.$('#aboutBody').querySelector(sel));
  const G = { name, S, geteilt, anfragen, idb };
  G.im = finde;
  G.da = (sel) => !!finde(sel);
  G.text = () => S.lauf(() => S.$('#loginBody').textContent);
  G.eltern = () => S.lauf(() => S.$('#aboutBody').textContent);
  G.klick = (sel) => S.lauf(() => { const e = finde(sel); if (!e) throw new Error(name + ': nicht gefunden ' + sel); e.click(); });
  G.tippe = (sel, v) => S.lauf(() => { const e = finde(sel); if (!e) throw new Error(name + ': Feld fehlt ' + sel); e.value = v; });
  G.absenden = (knopf) => S.lauf(() => { const k = finde(knopf); if (!k) throw new Error(name + ': Knopf fehlt ' + knopf); k.click(); const f = k.closest('form'); f.dispatchEvent({ type: 'submit', target: f, currentTarget: f, preventDefault() {}, stopPropagation() {} }); });
  G.warten = async (bed, was, ms = 60000) => { const t0 = Date.now(); for (;;) { if (S.lauf(bed)) return; if (Date.now() - t0 > ms) throw new Error(name + ': wartet vergeblich auf ' + was + ' - Login: ' + G.text().slice(0, 200) + ' | Eltern: ' + G.eltern().slice(0, 400)); await warte(15); } };
  G.wartenAuf = (sel) => G.warten(() => G.da(sel), sel);
  G.sitzung = () => JSON.parse(S.ablage.get('bqf_session') || 'null');
  G.liste = () => JSON.parse(S.ablage.get('bqf_kontoListe') || '[]');
  G.sync = () => S.lauf(() => S.holen('kontoAbgleich')());
  G.einstellungen = (sec) => S.lauf(() => { S.ctx.location.hash = '#eltern/einstellungen' + (sec ? '/' + sec : ''); S.holen('applyParentRoute')(); });
  G.gelesen = () => [...new Set(S.ctx.__bqGelesen || [])];
  return G;
}
async function passwortWaehlen(G) { await G.wartenAuf('#setPwForm'); G.klick('#pwUse'); const pw = G.im('#newPw1').value; G.absenden('#setPwGo'); return pw; }
async function runde(K, W) {
  const S = K.S;
  S.karteOeffnen(S.alleKarten().find((x) => !x.studio));
  for (;;) { const z = S.zustand(); S.frageBeantworten(z.round[z.idx]); await W.uhr.vor(10000); const ende = z.idx >= z.round.length - 1; S.klick('#nextBtn'); if (ende) break; }
  S.lauf(() => S.holen('goBack')());
}
/* nur bqf_ gelesen (und der Schluessel der Huelle, den die Selbst-Aktualisierung liest), nur bqf_ geschrieben, die alten
   Eintraege unveraendert */
function nurFamilie(G) {
  const g = G.gelesen();
  assert.ok(g.length >= 5, G.name + ': Zaehler laeuft');
  assert.deepEqual(g.filter((k) => !k.startsWith('bqf_') && k !== 'bq_schluessel'), [], G.name + ': nur bqf_ gelesen');
  for (const [k, v] of Object.entries(ALT)) assert.equal(G.S.ablage.get(k), v, G.name + ': unveraendert ' + k);
  assert.deepEqual([...G.S.ablage.keys()].filter((k) => !(k in ALT) && !k.startsWith('bqf_')), [], G.name + ': nur bqf_ geschrieben');
}
const dateienMit = (W, text) => [...W.N.dateien(REPO).keys()].filter((p) => p.includes(text));

test('Sandbox: gebaute Familienfassung - anmelden, Kind anlegen, ueben, Schulbewertungen aus dem Konto, Export, Kind loeschen, Konto loeschen; nur bqf_', async (t) => {
  const W = await welt();
  // Peter: Startlink vom Admin -> Elternteil -> eigenes Passwort -> Wiederherstellungscode
  const P = geraet(t, W, { name: 'Peters Laptop', hash: await W.startlink('peter') });
  assert.equal(P.S.lauf(() => P.S.holen('KONTO_UI')), true, 'Konto-Modus');
  assert.deepEqual(roh(P.S.lauf(() => P.S.holen('KONTO_SPEICHER'))), SPEICHER_FAMILIE);
  assert.equal(P.S.lauf(() => P.S.holen('APP_ACCOUNTS').users.length), 0, 'keine Konten aus konten.json');
  P.pw = await registrieren(P);   // Einladung: ohne Rollenwahl zum Passwort
  await P.wartenAuf('#recCode'); P.klick('#recGo'); await P.wartenAuf('#welcomeGo'); P.klick('#welcomeGo');
  await P.sync();
  P.kennung = P.liste()[0].id;
  const fp = await keyFingerprint(P.S.lauf(() => P.S.holen('kontoOffen').get(P.kennung).pub));
  // Kind anlegen -> Start-QR -> Kathies iPad
  P.einstellungen('familie');
  P.klick('#kKindAnlegen'); await P.wartenAuf('#kKindForm');
  P.tippe('#kKindName', 'Kathie'); P.absenden('#kKindWeiter');
  await P.wartenAuf('#kKind2Form'); P.tippe('#kKindLogin', 'kathie'); P.absenden('#kKindGo');
  await P.wartenAuf('#kQr');
  const code = P.im('#kCode').textContent;
  const K = geraet(t, W, { name: 'Kathies iPad', hash: link(anmStartlink('http://127.0.0.1/', { anmeldename: 'kathie', code, fingerabdruck: fp })) });
  await registrieren(K);
  await K.warten(() => K.sitzung() || K.da('#kidWait'), 'Kind startet lokal oder wartet');
  await W.uhr.vor(1000); await P.sync(); await W.uhr.vor(1000);
  if (K.da('#kidWait')) {
    K.klick('#kidWaitAgain'); await K.wartenAuf('#welcomeGo'); await W.uhr.vor(1000); K.klick('#welcomeGo');
  } else {
    await K.sync();
  }
  P.klick('#kQrFertig');
  const kind = K.sitzung().id;
  await runde(K, W);
  await K.sync(); await W.uhr.vor(1000); await P.sync();

  // Schulbewertungen per Werkzeug ins Konto (wie bei der Umstellung) -> Peters Elternbereich zeigt sie aus dem Konto
  const schule = P.S.lauf(() => P.S.holen('schoolData')());
  assert.equal(schule, null, 'vorher keine Schulbewertungen (SCHOOL_DATA leer)');
  const heute = new Date(W.uhr.jetzt()).toISOString().slice(0, 10);
  await schulbewertungenUebernehmen({ speicher: W.speicher, anmeldename: 'peter', passwort: P.pw, schule: BEISPIEL, zuordnung: { kathie: 'kathie' }, now: W.uhr.jetzt(), heute });
  await W.uhr.vor(1000); await P.sync();
  assert.deepEqual(roh(P.S.lauf(() => P.S.holen('schoolData')())), BEISPIEL.kinder.kathie, 'Schulbewertungen aus Kathies Konto');
  assert.match(P.S.lauf(() => P.S.holen('schoolHTML')()), new RegExp(BEISPIEL.kinder.kathie.tasks[0].title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'im Elternbereich sichtbar');
  // das Kind sieht sie nie
  assert.equal(K.S.lauf(() => K.S.holen('schoolData')()), null);

  // Export: lesbare Seite und JSON
  P.einstellungen('familie');
  P.klick(`[data-kexport="${kind}"]`); await P.wartenAuf('#kExHtml');
  P.klick('#kExHtml'); P.klick('#kExJson');
  await P.warten(() => P.geteilt.length === 2, 'zwei Dateien');
  const [seite, datei] = P.geteilt;
  assert.match(seite.name, /^big-quest-kathie-\d{4}-\d\d-\d\d\.html$/); assert.match(datei.name, /\.json$/);
  const daten = JSON.parse(datei.text);
  assert.equal(daten.format, 'bq-kinddaten'); assert.equal(daten.kind.anmeldename, 'kathie');
  assert.equal(daten.schulbewertungen.length, 1);
  assert.ok(daten.daten.attempts && daten.daten.attempts.length >= 8, 'Antworten der Runde im Export');
  assert.match(seite.text, /<html lang="de">/); assert.match(seite.text, /Kathie|kathie/);
  P.klick('#kBack');

  // Kind loeschen: falscher Name -> nichts geloescht; richtiger Name -> weg
  P.klick(`[data-kloesch="${kind}"]`); await P.wartenAuf('#kLoeschForm');
  P.tippe('#kLoeschName', 'kathi'); P.absenden('#kLoeschGo');
  assert.match(P.im('#kMsg').textContent, /stimmt nicht – es wurde nichts gelöscht/);
  assert.ok(dateienMit(W, kind).length > 0, 'noch alles da');
  P.tippe('#kLoeschName', 'kathie'); P.absenden('#kLoeschGo');
  await P.warten(() => !P.da('#kLoeschForm') && /Kathie ist gelöscht/.test(P.eltern()), 'Meldung geloescht');
  assert.deepEqual(dateienMit(W, kind), [], 'nichts mehr vom Kind im Speicher');
  assert.equal(await W.speicher.geraet('d_Pruefer').directory(await kontoLookup('kathie')), null, 'Verzeichniseintrag weg');
  assert.equal(P.S.lauf(() => P.S.holen('kontoVerb')(P.S.holen('kontoIch')()).kinder.length), 0);
  assert.deepEqual([...P.S.ablage.keys()].filter((k) => k.includes(kind)), [], 'auf Peters Geraet nichts mehr vom Kind');
  // Kathies iPad: naechster Abgleich -> abgemeldet, Daten und Aufnahmen weg
  await W.uhr.vor(MIN);
  await K.sync();
  await K.warten(() => K.sitzung() === null, 'Kathie abgemeldet');
  assert.ok(K.S.sichtbar('#login'), 'Anmeldeseite');
  assert.deepEqual([...K.S.ablage.keys()].filter((k) => k.includes(kind)), [], 'auf Kathies iPad nichts mehr von ihr');
  assert.ok(K.idb.geloescht.includes('bqf_audio__' + kind), 'Leseaufnahmen geloescht: ' + K.idb.geloescht.join(','));

  // Ueber die App: Export und Loeschen in Alltagssprache, Anleitung zum endgueltigen Entfernen bei GitHub verlinkt
  P.einstellungen('ueber');
  const ueber = P.S.lauf(() => P.S.$('#aboutBody').querySelector('details[data-about="loeschen"]'));
  assert.ok(ueber, 'Abschnitt "Daten exportieren und loeschen"');
  assert.match(P.S.lauf(() => ueber.innerHTML), /href="https:\/\/github\.com\/pahlborn\/bis-school-app_src\/blob\/main\/docs\/endgueltig-loeschen\.md"/);
  assert.ok(fs.existsSync(path.join(WURZEL, 'docs', 'endgueltig-loeschen.md')), 'die verlinkte Anleitung gibt es');

  // zweites Kind Ben (eigenes Geraet, uebt) und Peters zweites Geraet (Name + Passwort), das Bens Stand kennt
  P.einstellungen('familie');
  P.klick('#kKindAnlegen'); await P.wartenAuf('#kKindForm');
  P.tippe('#kKindName', 'Ben'); P.absenden('#kKindWeiter');
  await P.wartenAuf('#kKind2Form'); P.tippe('#kKindLogin', 'ben'); P.absenden('#kKindGo');
  await P.wartenAuf('#kQr');
  const B = geraet(t, W, { name: 'Bens Tablet', hash: link(anmStartlink('http://127.0.0.1/', { anmeldename: 'ben', code: P.im('#kCode').textContent, fingerabdruck: fp })) });
  await registrieren(B);
  await B.warten(() => B.sitzung() || B.da('#kidWait'), 'Kind startet lokal oder wartet');
  await W.uhr.vor(1000); await P.sync(); await W.uhr.vor(1000);
  if (B.da('#kidWait')) {
    B.klick('#kidWaitAgain'); await B.wartenAuf('#welcomeGo'); await W.uhr.vor(1000); B.klick('#welcomeGo');
  } else {
    await B.sync();
  }
  P.klick('#kQrFertig');
  const ben = B.sitzung().id;
  await runde(B, W); await B.sync(); await W.uhr.vor(1000);
  const P2 = geraet(t, W, { name: 'Peters iPhone' });
  P2.klick('#roleAdult'); P2.tippe('#loginUser', 'peter'); P2.tippe('#loginPw', P.pw); P2.absenden('#loginGo');
  await P2.warten(() => !!P2.S.holen('adultUser'), 'Peter auf dem iPhone');
  await P2.sync(); await W.uhr.vor(1000); await P2.sync();
  assert.ok(JSON.parse(P2.S.ablage.get('bqf_' + ben + '__events') || '[]').some((e) => e.type === 'answer'), 'Peters iPhone kennt Bens Stand');

  // Mein Konto loeschen (einziger Elternteil): falsches Passwort -> nichts; richtiges -> Familie weg, abgemeldet
  P.einstellungen('familie');
  P.klick('#kKontoLoeschen'); await P.wartenAuf('#kKlForm');
  assert.match(P.eltern(), /Sie sind der einzige Elternteil/);
  P.tippe('#kKlPw', 'falsch-' + P.pw); P.absenden('#kKlGo');
  await P.warten(() => /stimmt nicht/.test(P.im('#kMsg').textContent), 'Meldung falsches Passwort');
  assert.ok(dateienMit(W, P.kennung).length > 0, 'noch da');
  P.tippe('#kKlPw', P.pw); P.absenden('#kKlGo');
  await P.wartenAuf('#kKontoWeg');
  assert.ok(P.S.sichtbar('#login'), 'abgemeldet, Anmeldeseite');
  assert.deepEqual(dateienMit(W, P.kennung), [], 'nichts mehr von Peter im Speicher');
  assert.equal(await W.speicher.geraet('d_Pruefer').directory(await kontoLookup('peter')), null);
  assert.deepEqual(P.liste(), [], 'Geraeteliste leer');
  assert.deepEqual([...P.S.ablage.keys()].filter((k) => k.includes(P.kennung)), [], 'auf Peters Geraet nichts mehr von ihm');
  assert.deepEqual(dateienMit(W, ben), [], 'auch Ben ist weg');
  // Peters iPhone (kannte Familie und Ben, hat das Austragen nie gelesen - der Familienbereich ist schon weg): beim
  // naechsten Abgleich abgemeldet, nichts mehr von Peter oder Ben auf dem Geraet
  await W.uhr.vor(MIN); await P2.sync();
  await P2.warten(() => !P2.S.holen('adultUser') && P2.S.sichtbar('#login'), 'Peters iPhone abgemeldet');
  const reste = (G, id) => [...G.S.ablage.entries()].filter(([k, v]) => k.includes(id) || String(v).includes(id)).map(([k]) => k);
  assert.deepEqual(reste(P2, P.kennung), [], 'Peters iPhone: nichts mehr von Peter');
  assert.deepEqual(reste(P2, ben), [], 'Peters iPhone: nichts mehr von Ben');
  assert.deepEqual(reste(P, P.kennung).concat(reste(P, kind), reste(P, ben)), [], 'Peters Laptop: nichts mehr');
  assert.deepEqual(reste(K, kind), [], 'Kathies iPad: nichts mehr von ihr');
  // Bens Tablet: abgemeldet, Daten und Aufnahmen weg
  await B.sync();
  await B.warten(() => B.sitzung() === null && B.S.sichtbar('#login'), 'Ben abgemeldet');
  assert.deepEqual(reste(B, ben), [], 'Bens Tablet: nichts mehr von ihm');
  assert.ok(B.idb.geloescht.includes('bqf_audio__' + ben));

  // nur bqf_, die alten Eintraege unveraendert; nur GitHub (umgelenkt) und die eigene Seite gefragt
  nurFamilie(P); nurFamilie(K); nurFamilie(P2); nurFamilie(B);
  for (const G of [P, K, P2, B]) {
    assert.deepEqual(G.anfragen.filter((u) => !u.startsWith(GITHUB + '/repos/' + REPO + '/') && !u.startsWith('http://127.0.0.1/')), [], G.name + ': nur das Familien-Repo');
    assert.deepEqual(roh(G.S.holen('eventErrors')), [], G.name + ': eventErrors');
    assert.deepEqual(roh(G.S.holen('kontoFehlerListe')), [], G.name + ': kontoFehlerListe');
  }
});

test('Sandbox: "nicht uebernommen" zaehlt nur Gefaelschtes und Eintraege ohne Berechtigung', async (t) => {
  const W = await welt();
  const P = geraet(t, W, { name: 'Peters Laptop', hash: await W.startlink('peter') });
  await registrieren(P);
  await P.wartenAuf('#recCode'); P.klick('#recGo'); await P.wartenAuf('#welcomeGo'); P.klick('#welcomeGo');
  await P.sync();
  const zeile = () => P.S.lauf(() => P.S.holen('kontoZeileHTML')());
  const setze = (l) => P.S.ablage.set('bqf_abgleichVerworfen', JSON.stringify(l));
  setze([{ bereich: 'familie:x', grund: 'autor-unbekannt' }, { grund: 'geraet-nicht-angemeldet' }, { grund: 'stand-alt' }, { grund: 'format' }]);
  assert.doesNotMatch(zeile(), /nicht übernommen/, 'harmlos: keine Zahl');
  setze([{ grund: 'autor-unbekannt' }, { grund: 'unterschrift' }, { grund: 'nach-entfernung' }, { grund: 'rolle-darf-nicht' }]);
  assert.match(zeile(), /3 Einträge nicht übernommen/);
});

test('Kathies App (Live-Bau): nichts davon - kein Export/Loeschen, kein Abschnitt dazu, Schuldaten weiter aus dem Bau', () => {
  const live = appLesen('utf8', { bauart: 'live' });
  for (const w of ['anmKindExport', 'anmKindLoeschen', 'anmKontoLoeschen', 'anmSchule', 'deriveSchool', 'kindDatenExport']) assert.equal(live.includes('function ' + w) || live.includes('const ' + w + ' ='), false, 'nicht im Live-Bau: ' + w);
  const S = appSandbox({ bauart: 'live' });
  assert.equal(S.lauf(() => S.holen('KONTO_UI')), false);
  assert.doesNotMatch(S.lauf(() => S.holen('aboutAppHTML')()), /endgueltig-loeschen/);
});

test('Browser: Huelle -> Familienpasswort -> die Familienfassung startet mit der Anmeldung; alte Eintraege bleiben', async () => {
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
    const github = [];
    await ctx.route('**/*', (r) => { const u = r.request().url(); if (u.startsWith(url)) return r.continue(); if (u.startsWith(GITHUB)) github.push(u); return r.abort(); });
    const alt = { bq2_name: ALT.bq2_name, bq2_total: ALT.bq2_total, gh_token: ALT.gh_token };
    await ctx.addInitScript(([vorher]) => { if (!sessionStorage.getItem('vorbereitet')) { for (const [k, v] of Object.entries(vorher)) localStorage.setItem(k, v); sessionStorage.setItem('vorbereitet', '1'); } window.AudioContext = undefined; }, [alt]);
    const page = await ctx.newPage();
    const fehler = [];
    page.on('pageerror', (e) => fehler.push(e.message));
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: LADEZEIT_MS });
    await page.fill('#passwort', TEST_PW);
    await page.click('#oeffnen');
    await page.waitForSelector('#login:not([hidden])', { timeout: 30000 });
    assert.equal(await page.locator('#home').isVisible(), false, 'ohne Anmeldung keine Startseite');
    // Aufgabe "Erstanmeldung per QR-Code" (B2): ohne Zugangscode zuerst nur "Geraet verbinden"
    assert.ok(await page.locator('#verbinden').isVisible(), 'Geraet verbinden: einmal je Geraet');
    assert.match(await page.locator('#loginBody h2').first().textContent(), /Connect this device|Gerät verbinden/);   // Sprache des Geraets
    assert.equal(await page.locator('#roleStudent').count(), 0, 'noch keine Rollenwahl');
    assert.deepEqual(github, [], 'ohne Zugang fragt die App GitHub nicht');
    const r = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])));
    for (const [k, v] of Object.entries(alt)) assert.equal(r[k], v, 'unveraendert: ' + k);
    assert.ok(r.bq_schluessel, 'Huelle hat den Familienschluessel gemerkt');
    assert.deepEqual(Object.keys(r).filter((k) => !(k in alt) && k !== 'bq_schluessel' && !k.startsWith('bqf_')), [], 'sonst nur bqf_');
    assert.deepEqual(fehler, []);
  } finally { await browser.close(); server.close(); }
});
