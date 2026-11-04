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
//    pahlborn.github.io wie Kathies App und die Werkstatt-Apps, darum liest die Testinstanz nie deren Eintraege.
//
// index.html bleibt unveraendert: das Werkzeug benennt die Speicherstellen im fertigen Text um und prueft danach mit
// einem Suchlauf, dass nichts davon fehlt (testinstanzPruefen). Ein Fund bricht ab, bevor etwas geschrieben wird.
// Ausgaben nur in ASCII (Windows-Konsole).

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
 * Fertige Testbau-App (Text, Module und Version eingesetzt) -> Text der Testinstanz.
 * 1. Schul-Namen neutral (ersatz.ersetzen), 2. geraeteweite Namen in GLOBAL_KEYS, 3. Praefixe, 4. Titel.
 */
export function testinstanzUmwandeln(app, ersatz) {
  let t = String(app);
  for (const [suche, neu] of ersatz.ersetzen) t = t.replace(new RegExp(reEsc(suche), 'gi'), () => neu);

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
export function testinstanzPruefen(app, manifest, { woerter = [], auchVerboten = [], schule = null, konten = null, salt = '' } = {}) {
  const pruefungen = [];
  const pruef = (name, fund) => pruefungen.push({ name, ok: !fund, fund: fund || '' });
  const alles = app + '\n' + manifest;

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
  const fehlendGlobal = ['gh', 'abgleich', 'abgleichVerworfen', 'schluessel'].filter((n) => !gk || !gk[1].split('|').includes(n));
  pruef('Geraetedaten und Token geraeteweit (GLOBAL_KEYS)', fehlendGlobal.length ? 'fehlt: ' + fehlendGlobal.join(', ') : '');

  // verbotene Woerter: hier in der GANZEN App (sie liegt im Klartext)
  const verboten = [...woerter, ...auchVerboten];
  const wortTreffer = verboten.filter((w) => new RegExp(reEsc(w), 'i').test(alles));
  pruef(`keine verbotenen Woerter (${verboten.length} gesucht, ganze App)`, wortTreffer.length ? wortTreffer.map((w) => `"${w}"`).join(', ') : '');

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
