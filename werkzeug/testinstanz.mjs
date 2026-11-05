// Bauart "Testinstanz" (Stufe 3c): eine eigene Fassung der App fuer Testpersonen, die ueber das private Repo
// bis-school-app-testdaten abgleicht. Kathies App bleibt unberuehrt.
//
//   node werkzeug/testinstanz.mjs [--ziel <ordner>]      baut nach dist-test/ (Standard), prueft, schreibt erst dann
//
// Was die Testinstanz ist (Festlegungen in "Stufe 3c - Testinstanz"):
//  - der Testbau (alle Module aus src/module/module.json),
//  - OHNE Kathies Schuldaten (werkzeug/schuldaten.json), OHNE werkzeug/konten.json (Konten nur ueber das Verzeichnis),
//  - OHNE Familienpasswort: keine Huelle, kein Tresor - die App liegt im Klartext. Darum gilt die Liste der verbotenen
//    Woerter hier fuer die GANZE App; Schul-Namen ersetzt werkzeug/testinstanz-ersatz.json vorher durch neutrale,
//  - Speicher im Browser unter eigenem Praefix bqt_ (statt bq2_ und bq_) und Token unter bqt_gh - gleiche Herkunft
//    pahlborn.github.io wie Kathies App und die Werkstatt-Apps, darum liest die Testinstanz nie deren Eintraege,
//  - aktualisiert sich selbst ohne Schluessel: die Version steht auf der veroeffentlichten Seite im Klartext
//    (VERSION_AUS_KLARTEXT). Veroeffentlichen: werkzeug/testinstanz-veroeffentlichen.mjs,
//  - mit dem Test-Repo verbunden (Befund #134): die Marke /*BQ_SPEICHER*/null wird zu SPEICHER_TESTINSTANZ. Damit gilt
//    der Konto-Modus (KONTO_UI): die Testinstanz startet mit der Anmeldung, Konten nur ueber das Verzeichnis im Test-Repo,
//    Zugang einmal je Geraet unter bqt_gh.
//
// index.html bleibt unveraendert: das Werkzeug benennt die Speicherstellen im fertigen Text um und prueft danach mit
// einem Suchlauf, dass nichts davon fehlt (testinstanzPruefen). Ein Fund bricht ab, bevor etwas geschrieben wird.
// Ausgaben nur in ASCII (Windows-Konsole).

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DATEN_RE, GOOGLE_FONTS as GOOGLE_IM_MANIFEST, ohneSchriften, schriftenLesen, schriftenPruefen } from './schriften.mjs';

export const TESTINSTANZ = Object.freeze({
  praefix: 'bqt_',                                   // statt bq2_ (Daten der App) und bq_ (Geraetedaten)
  tokenEintrag: 'bqt_gh',                            // = GITHUB_TOKEN_SCHLUESSEL in src/module/github.mjs
  sitzungPraefix: 'bqt',                             // sessionStorage: bqUpdateTo -> bqtUpdateTo
  name: 'Big Quest Test',                            // Name auf dem Home-Bildschirm (nicht verwechseln mit Kathies App)
  adresse: 'https://pahlborn.github.io/bis-school-app-test/',
  repoDaten: 'pahlborn/bis-school-app-testdaten',    // privates Repo mit den Daten der Testpersonen
  wurzelDaten: '',                                   // Ordner darin (leer = oberste Ebene)
  ordner: 'dist-test'
});

export const ERSATZ_DATEI = 'werkzeug/testinstanz-ersatz.json';

/** Speicher der Testinstanz an der Marke in index.html (KONTO_SPEICHER): das private Test-Repo, echtes GitHub (kein
 *  "basis" - die Tests lenken api.github.com selbst auf den Nachbau um). */
export const SPEICHER_MARKE = '/*BQ_SPEICHER*/null';
export const SPEICHER_TESTINSTANZ = Object.freeze({ art: 'github', repo: TESTINSTANZ.repoDaten, wurzel: TESTINSTANZ.wurzelDaten });

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const zaehle = (text, re) => (text.match(re) || []).length;

export async function ersatzLesen(wurzel = WURZEL) {
  const e = JSON.parse(await fs.readFile(path.join(wurzel, ERSATZ_DATEI), 'utf8'));
  if (!Array.isArray(e.ersetzen) || !e.ersetzen.every((p) => Array.isArray(p) && p.length === 2 && p.every((x) => typeof x === 'string' && x)))
    throw new Error(ERSATZ_DATEI + ': "ersetzen" muss eine Liste aus [suchen, ersetzen] sein.');
  if (!Array.isArray(e.auchVerboten) || !e.auchVerboten.every((x) => typeof x === 'string' && x)) throw new Error(ERSATZ_DATEI + ': "auchVerboten" fehlt.');
  return { ersetzen: e.ersetzen, auchVerboten: e.auchVerboten };
}

/** Namen der Geraetedaten (bq_<name>) im Text - sie werden zu bqt_<name> und zaehlen als geraeteweit (GLOBAL_KEYS). */
export const geraeteNamen = (text) => [...new Set([...String(text).matchAll(/\bbq_([A-Za-z][A-Za-z0-9]*)\b/g)].map((m) => m[1]))].sort();

/** genau einmal ersetzen, sonst Abbruch (so faellt auf, wenn index.html sich an dieser Stelle geaendert hat) */
function einmal(text, re, ersatz, was) {
  const n = zaehle(text, new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'));
  if (n !== 1) throw new Error(`Testinstanz: ${was} ${n}x statt 1x gefunden - index.html geaendert? Nichts gebaut.`);
  return text.replace(re, ersatz);
}

/**
 * Selbst-Aktualisierung ohne Schluessel. Kathies App liest die neue Version aus dem Tresor der veroeffentlichten Seite
 * (mit dem gemerkten Familienschluessel bq_schluessel). Die Testinstanz hat keinen Tresor und keinen Schluessel: die
 * veroeffentlichte Seite IST die App, die Version steht darin im Klartext. Der Rest (checkForUpdate, applyUpdate: alle
 * 5 Minuten, nie mitten in einer Runde, kein Neuladen im Kreis) bleibt wie in Kathies App.
 */
export const VERSION_AUS_KLARTEXT = [
  'async function publishedVersion(){',
  '  /* Test instance (stage 3c): the published page is the app itself in plain text - no key, no vault. */',
  "  const res=await fetch(location.href.split('#')[0].split('?')[0]+'?t='+Date.now(),{cache:'no-store'});",
  "  if(!res.ok) throw new Error('HTTP '+res.status);",
  '  const v=(await res.text()).match(/const APP_VERSION=(\\{[^}]*\\});/); return v?JSON.parse(v[1]):null;',
  '}'
].join('\n');
const VERSION_AUS_TRESOR = /async function publishedVersion\(\)\{\r?\n {2}const key=localStorage\.getItem\('bq_schluessel'\);[\s\S]*?return v\?JSON\.parse\(v\[1\]\):null;\r?\n\}/;

/**
 * Fertige Testbau-App (Text, Module und Version eingesetzt) -> Text der Testinstanz.
 * 1. Schul-Namen neutral (ersatz.ersetzen), 2. Aktualisierung ohne Schluessel, 3. Speicher = Test-Repo,
 * 4. geraeteweite Namen in GLOBAL_KEYS, 5. Praefixe, 6. Titel.
 * speicher: nur fuer Tests - ein anderer Ausdruck an der Marke (z. B. der simulierte Speicher). Der Bau nimmt immer
 * SPEICHER_TESTINSTANZ, der Suchlauf (testinstanzPruefen) verlangt genau diesen.
 */
export function testinstanzUmwandeln(app, ersatz, { speicher = JSON.stringify(SPEICHER_TESTINSTANZ) } = {}) {
  // eingebettete Schriften (Base64) bleiben unberuehrt: Ersetzungen ohne Ruecksicht auf Gross/klein koennten sonst
  // zufaellig mitten in den Daten treffen
  const daten = [];
  const geschuetzt = String(app).replace(DATEN_RE, (m) => { daten.push(m); return `url(data:font/woff2;base64,BQSCHRIFT${daten.length - 1}x)`; });
  const t = umwandeln(geschuetzt, ersatz, speicher);
  const n = (t.match(/BQSCHRIFT\d+x/g) || []).length;
  if (n !== daten.length) throw new Error(`Testinstanz: eingebettete Schriften ${n}x statt ${daten.length}x nach der Umwandlung - nichts gebaut.`);
  return t.replace(/url\(data:font\/woff2;base64,BQSCHRIFT(\d+)x\)/g, (_, i) => daten[Number(i)]);
}

function umwandeln(app, ersatz, speicher) {
  let t = String(app);
  for (const [suche, neu] of ersatz.ersetzen) t = t.replace(new RegExp(reEsc(suche), 'gi'), () => neu);
  t = einmal(t, VERSION_AUS_TRESOR, () => VERSION_AUS_KLARTEXT, 'publishedVersion (mit Schluessel)');
  t = einmal(t, new RegExp(reEsc(SPEICHER_MARKE)), () => speicher, 'Marke ' + SPEICHER_MARKE);

  // Geraetedaten (bq_abgleich, bq_schluessel ...) und der Token liegen kuenftig unter demselben Praefix wie die Daten
  // der App. Damit sie nie als Daten eines Kindes gelten (Umzug auf Kennungen, Sicherung), werden sie geraeteweit.
  const geraet = [...geraeteNamen(t), TESTINSTANZ.tokenEintrag.slice(TESTINSTANZ.praefix.length)];
  for (const n of geraet) {
    if (new RegExp('\\bbq2_' + reEsc(n) + '\\b').test(t) || new RegExp(`(?:store\\.(?:get|set|del)|storeKey)\\(\\s*['"]${reEsc(n)}['"]`).test(t))
      throw new Error(`Testinstanz: "${n}" ist Geraetename und zugleich Speicherstelle der App - unter bqt_ wuerden sie sich ueberschreiben.`);
  }
  t = einmal(t, /const GLOBAL_KEYS=\/\^\(/, () => 'const GLOBAL_KEYS=/^(' + geraet.join('|') + '|', 'GLOBAL_KEYS');

  t = t.replace(/bq2_/g, TESTINSTANZ.praefix).replace(/\bbq_/g, TESTINSTANZ.praefix).replace(/\bbqUpdateTo\b/g, TESTINSTANZ.sitzungPraefix + 'UpdateTo');

  t = einmal(t, /<title>([^<]*)<\/title>/, (_, x) => `<title>${x} (Test)</title>`, '<title>');
  t = einmal(t, /<meta name="apple-mobile-web-app-title" content="[^"]*">/, () => `<meta name="apple-mobile-web-app-title" content="${TESTINSTANZ.name}">`, 'apple-mobile-web-app-title');
  return t;
}

/** Manifest der Testinstanz: eigener Name (Home-Bildschirm), sonst wie das neutrale Manifest. */
export function testinstanzManifest(manifest) {
  const m = JSON.parse(manifest);
  return JSON.stringify({ ...m, name: TESTINSTANZ.name, short_name: TESTINSTANZ.name });
}

/** alle Texte (>= min Zeichen) in einem JSON-Wert, auch Schluessel */
function texte(x, min, out = new Set()) {
  if (typeof x === 'string') { if (x.trim().length >= min) out.add(x.trim()); }
  else if (Array.isArray(x)) x.forEach((y) => texte(y, min, out));
  else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) { if (k.length >= min) out.add(k); texte(v, min, out); }
  return out;
}

/**
 * Suchlauf: prueft die fertige Testinstanz. -> Liste der Funde (leer = bestanden) und je Pruefung ein Ergebnis.
 * kontext: { woerter (verbotene-woerter.txt), auchVerboten, schule (schuldaten.json oder null), konten (konten.json oder
 * null), salt (aus salz.json, base64) }
 */
export function testinstanzPruefen(app, manifest, { woerter = [], auchVerboten = [], schule = null, konten = null, salt = '', schriften = schriftenLesen(WURZEL) } = {}) {
  const pruefungen = [];
  const pruef = (name, fund) => pruefungen.push({ name, ok: !fund, fund: fund || '' });
  // Textsuchen ohne die eingebetteten Schriften: in rund 90 KB Base64 tauchen kurze Woerter zufaellig auf. Die Schriften
  // selbst prueft "Schriften eingebettet" (nur Base64-Zeichen, genau die Daten aus werkzeug/schriften/schriften.json).
  const alles = ohneSchriften(app) + '\n' + manifest;

  // keine Schuldaten
  pruef('Schuldaten leer (SCHOOL_DATA=null)', /const SCHOOL_DATA=null\|\|\{\};/.test(app) ? '' : 'SCHOOL_DATA ist nicht null');
  const schulTexte = schule ? [...texte(schule.kinder || schule, 12)] : [];
  const schulTreffer = schulTexte.filter((s) => alles.includes(s));
  pruef(`kein Text aus schuldaten.json (${schulTexte.length} gesucht)`, schulTreffer.length ? schulTreffer.length + ' Texte gefunden, z. B. "' + schulTreffer[0].slice(0, 40) + '"' : '');

  // keine Konten aus konten.json
  pruef('Konten leer (APP_ACCOUNTS ohne konten.json)', /APP_ACCOUNTS=normAccounts\(\/\*BQ_KONTEN\*\/null\)/.test(app) ? '' : 'APP_ACCOUNTS ist nicht leer');
  const kontoTexte = konten ? (konten.users || []).flatMap((u) => [u.id, u.start && u.start.hash].filter((x) => typeof x === 'string' && x.length >= 12)) : [];
  const kontoTreffer = kontoTexte.filter((s) => alles.includes(s));
  pruef(`keine Kennung und kein Startcode-Hash aus konten.json (${kontoTexte.length} gesucht)`, kontoTreffer.length ? kontoTreffer.length + ' gefunden' : '');

  // kein Familienpasswort: keine Huelle, kein Tresor, kein Salz
  pruef('ohne Familienpasswort (kein Tresor, App im Klartext)', /<script type="application\/json" id="tresor">/.test(app) ? 'Tresor gefunden' : !/<script>\s*\(function\(\)\{/.test(app) ? 'App-Skript nicht im Klartext' : '');
  pruef('Salz des Familienpassworts fehlt', salt && alles.includes(salt) ? 'Salz gefunden' : '');

  // Speicher: nur bqt_, Token nur bqt_gh
  // (der Name des Werkstatt-Tokens steht absichtlich nirgends im Quelltext - Suchlauf in tests/module/github.test.mjs)
  const werkstatt = 'gh' + '_token';
  const alt = [['bq2_', /bq2_/g], ['bq_', /\bbq_/g], [werkstatt, new RegExp(werkstatt, 'g')], ['bqUpdateTo', /\bbqUpdateTo\b/g]]
    .map(([w, re]) => [w, zaehle(alles, re)]).filter(([, n]) => n);
  pruef('kein bq2_, bq_, Token der Werkstatt-Apps, bqUpdateTo', alt.length ? alt.map(([w, n]) => `${w} ${n}x`).join(', ') : '');
  const literal = [...app.matchAll(/(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*(['"`])([^'"`]*)\1/g)].map((m) => m[2]);
  const fremd = literal.filter((k) => !k.startsWith(TESTINSTANZ.sitzungPraefix));
  pruef(`feste Speicherstellen nur mit bqt (${literal.length} gefunden)`, fremd.length ? fremd.join(', ') : literal.length ? '' : 'keine gefunden');
  pruef('Token-Eintrag bqt_gh', /const GITHUB_TOKEN_SCHLUESSEL = 'bqt_gh';/.test(app) ? '' : 'GITHUB_TOKEN_SCHLUESSEL ist nicht bqt_gh');
  const gk = /const GLOBAL_KEYS=\/\^\(([^)]*)\)\$\//.exec(app);
  const fehlendGlobal = ['gh', 'abgleich', 'abgleichVerworfen'].filter((n) => !gk || !gk[1].split('|').includes(n));
  pruef('Geraetedaten und Token geraeteweit (GLOBAL_KEYS)', fehlendGlobal.length ? 'fehlt: ' + fehlendGlobal.join(', ') : '');

  // mit dem Test-Repo verbunden (Befund #134): Marke ersetzt, genau eine Stelle, genau dieser Speicher (echtes GitHub)
  const sp = [...app.matchAll(/const KONTO_SPEICHER=([^;\r\n]*);/g)].map((m) => m[1]);
  pruef(`mit dem Test-Repo verbunden (${TESTINSTANZ.repoDaten})`,
    app.includes(SPEICHER_MARKE) ? 'Marke ' + SPEICHER_MARKE + ' nicht ersetzt'
      : sp.length !== 1 ? `KONTO_SPEICHER ${sp.length}x`
        : sp[0] !== JSON.stringify(SPEICHER_TESTINSTANZ) ? 'anderer Speicher: ' + sp[0].slice(0, 80) : '');

  // Selbst-Aktualisierung ohne Schluessel: genau eine publishedVersion, sie liest die Version im Klartext
  const pv = [...app.matchAll(/async function publishedVersion\(\)\{[\s\S]*?\n\}/g)];
  pruef('Aktualisierung ohne Schluessel (Version aus der Seite im Klartext)',
    pv.length !== 1 ? `publishedVersion ${pv.length}x` : /schluessel|tresor|decrypt/i.test(pv[0][0]) ? 'publishedVersion braucht Schluessel oder Tresor' : !pv[0][0].includes('const APP_VERSION=') ? 'publishedVersion liest keine Version' : '');

  // verbotene Woerter: hier in der GANZEN App (sie liegt im Klartext)
  const verboten = [...woerter, ...auchVerboten];
  const wortTreffer = verboten.filter((w) => new RegExp(reEsc(w), 'i').test(alles));
  pruef(`keine verbotenen Woerter (${verboten.length} gesucht, ganze App)`, wortTreffer.length ? wortTreffer.map((w) => `"${w}"`).join(', ') : '');

  // Schriften eingebettet (05.11.): nichts von Google Fonts, jede Schrift genau einmal
  const sf = [...schriftenPruefen(app, schriften), ...(GOOGLE_IM_MANIFEST.test(manifest) ? ['Google Fonts im Manifest'] : [])];
  pruef(`Schriften eingebettet, nichts von Google Fonts (${schriften.map((s) => s.familie).join(', ')})`, sf.join(', '));

  // es ist der Testbau, mit Version
  pruef('Testbau (Module github, konto, geraeteabgleich)', ['function githubSpeicher(', 'async function kontoLookup(', 'async function geraetAbgleichen('].every((s) => app.includes(s)) ? '' : 'Testbau-Module fehlen');
  pruef('Version eingesetzt', /const APP_VERSION=\{/.test(app) ? '' : 'APP_VERSION fehlt');
  pruef('Name "Test" auf dem Home-Bildschirm', app.includes(`content="${TESTINSTANZ.name}"`) && JSON.parse(manifest).name === TESTINSTANZ.name ? '' : 'Name fehlt');

  return { funde: pruefungen.filter((p) => !p.ok).map((p) => `${p.name}: ${p.fund}`), pruefungen };
}

async function main() {
  const args = process.argv.slice(2);
  const i = args.indexOf('--ziel');
  const { testinstanzBauen } = await import('./bauen.mjs');
  const { versionText } = await import('./version.mjs');
  console.log('Big Quest - Testinstanz bauen (ohne Schuldaten, ohne konten.json, ohne Familienpasswort)\n');
  const r = await testinstanzBauen(i >= 0 ? { ziel: path.resolve(args[i + 1] || '') } : {});
  console.log('Suchlauf bestanden:');
  for (const p of r.pruefungen) console.log('  ok  ' + p.name);
  console.log(`\nOrdner: ${r.ziel}`);
  for (const d of r.dateien) console.log('  ' + d);
  console.log(`\nApp ${r.appBytes} Bytes (Klartext). Version ${versionText(r.version)} - ${r.version.hash} - ${r.version.date}`);
  if (r.version.draft) console.log('ACHTUNG: nicht eingecheckte Aenderungen (Version mit "-entwurf"). Diesen Stand NICHT veroeffentlichen.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error('\nFEHLER: ' + e.message); process.exit(1); });
}
