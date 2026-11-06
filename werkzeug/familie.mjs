// Bauart "Familie" (Vorbereitung Stufe 4, Aufgabe "Familienfassung bauen"): die echte App mit Konto-, GitHub- und
// Abgleich-Modulen fuer den Familienbetrieb ueber das private Repo bis-school-app-familie. Neubeginn (Peter, 05.11.):
// keine Konten aus werkzeug/konten.json, keine Schuldaten im Code - Kathies Schulbewertungen kommen mit
// werkzeug/schulbewertungen-uebernehmen.mjs in ihr Konto, die App liest sie dort (Bereich schule, school_import).
//
//   node werkzeug/verschluesseln.mjs --familie [--ziel <ordner>]   baut nach dist-familie/ (verschluesselt), prueft
//
// Was die Familienfassung ist:
//  - der Testbau (alle Module aus src/module/module.json),
//  - OHNE werkzeug/konten.json, OHNE werkzeug/schuldaten.json (SCHOOL_DATA leer), ohne Testpersonen,
//  - MIT Familienpasswort: verschluesselt wie Kathies App (Huelle mit Tresor, gleiche Adresse, gleicher Schluessel
//    bq_schluessel, gleiche Selbst-Aktualisierung) - solange Peter das Familienpasswort nicht abschafft,
//  - Speicher im Browser unter eigenem Praefix bqf_ (statt bq2_ und bq_): Kathies bisherige Eintraege auf demselben
//    Geraet (bq2_...) liest und aendert die Familienfassung nie - der Rueckweg (bisherige Fassung erneut veroeffentlichen)
//    findet sie unveraendert. Ausnahme: bq_schluessel - den legt die Huelle an, die Selbst-Aktualisierung liest ihn,
//  - Token unter bqf_gh, Speicher = SPEICHER_FAMILIE (die Marke /*BQ_SPEICHER*/null).
//
// index.html bleibt unveraendert: das Werkzeug benennt die Speicherstellen im fertigen Text um und prueft danach mit
// einem Suchlauf (familiePruefen), dass nichts davon fehlt. Ein Fund bricht ab, bevor etwas geschrieben wird.
// Veroeffentlicht wird NICHT von hier - nur nach Peters Go fuer Stufe 4 (docs/veroeffentlichen.md, Abschnitt 6).
// Ausgaben nur in ASCII (Windows-Konsole).

import { TESTINSTANZ, SPEICHER_MARKE, geraeteNamen } from './testinstanz.mjs';
import { TESTPERSONEN } from './testpersonen.mjs';
import { ohneTresor, verboteneTreffer } from './kern.mjs';
import { GOOGLE_FONTS, ohneSchriften, schriftenLesen, schriftenPruefen } from './schriften.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const FAMILIE = Object.freeze({
  praefix: 'bqf_',                                   // statt bq2_ (Daten der App) und bq_ (Geraetedaten)
  tokenEintrag: 'bqf_gh',                            // GITHUB_TOKEN_SCHLUESSEL in der Familienfassung
  huellenSchluessel: 'bq_schluessel',                // legt werkzeug/huelle.html an - bleibt, wie er ist
  repoDaten: 'pahlborn/bis-school-app-familie',      // privates Repo der Familie (legt Peter mit dem Go an)
  wurzelDaten: '',
  adresse: 'https://pahlborn.github.io/bis-school-app/',   // dieselbe Adresse wie Kathies App (ersetzt sie bei Stufe 4)
  ordner: 'dist-familie'
});
export const SPEICHER_FAMILIE = Object.freeze({ art: 'github', repo: FAMILIE.repoDaten, wurzel: FAMILIE.wurzelDaten });
/* der Token-Eintrag im Modul github (Testbau: der der Testinstanz) */
export const TOKEN_ZEILE_TESTBAU = "const GITHUB_TOKEN_SCHLUESSEL = '" + TESTINSTANZ.tokenEintrag + "';";
export const TOKEN_ZEILE_FAMILIE = "const GITHUB_TOKEN_SCHLUESSEL = '" + FAMILIE.tokenEintrag + "';";

const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const zaehle = (text, re) => (text.match(re) || []).length;
function einmal(text, re, ersatz, was) {
  const n = zaehle(text, new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'));
  if (n !== 1) throw new Error(`Familienfassung: ${was} ${n}x statt 1x gefunden - index.html geaendert? Nichts gebaut.`);
  return text.replace(re, ersatz);
}

/**
 * Fertige Testbau-App (Text, Module und Version eingesetzt, ohne Konten und Schuldaten) -> Text der Familienfassung.
 * 1. Speicher = Familien-Repo, 2. Token-Eintrag bqf_gh, 3. geraeteweite Namen in GLOBAL_KEYS, 4. Praefixe (bq_schluessel
 * bleibt). Titel, Name und Selbst-Aktualisierung bleiben wie in Kathies App (gleiche Adresse, gleiche Huelle).
 * speicher: nur fuer Tests - ein anderer Ausdruck an der Marke. Der Bau nimmt immer SPEICHER_FAMILIE, der Suchlauf
 * (familiePruefen) verlangt genau diesen.
 */
export function familieUmwandeln(app, { speicher = JSON.stringify(SPEICHER_FAMILIE) } = {}) {
  let t = String(app);
  t = einmal(t, new RegExp(reEsc(SPEICHER_MARKE)), () => speicher, 'Marke ' + SPEICHER_MARKE);
  t = einmal(t, new RegExp(reEsc(TOKEN_ZEILE_TESTBAU)), () => TOKEN_ZEILE_FAMILIE, 'Token-Eintrag ' + TESTINSTANZ.tokenEintrag);
  einmal(t, new RegExp("localStorage\\.getItem\\('" + reEsc(FAMILIE.huellenSchluessel) + "'\\)"), '', FAMILIE.huellenSchluessel + ' (Selbst-Aktualisierung)');

  // Geraetedaten (bq_abgleich ...) und der Token liegen kuenftig unter demselben Praefix wie die Daten der App. Damit sie
  // nie als Daten eines Kindes gelten (Umzug auf Kennungen, Sicherung), werden sie geraeteweit (wie in der Testinstanz).
  const huelle = FAMILIE.huellenSchluessel.slice(3);
  const geraet = [...geraeteNamen(t).filter((n) => n !== huelle), FAMILIE.tokenEintrag.slice(FAMILIE.praefix.length)].sort();
  for (const n of geraet) {
    if (new RegExp('\\bbq2_' + reEsc(n) + '\\b').test(t) || new RegExp(`(?:store\\.(?:get|set|del)|storeKey)\\(\\s*['"]${reEsc(n)}['"]`).test(t))
      throw new Error(`Familienfassung: "${n}" ist Geraetename und zugleich Speicherstelle der App - unter bqf_ wuerden sie sich ueberschreiben.`);
  }
  t = einmal(t, /const GLOBAL_KEYS=\/\^\(/, () => 'const GLOBAL_KEYS=/^(' + geraet.join('|') + '|', 'GLOBAL_KEYS');

  t = t.replace(/bq2_/g, FAMILIE.praefix).replace(new RegExp('\\bbq_(?!' + reEsc(huelle) + '\\b)', 'g'), FAMILIE.praefix);
  return t;
}

/** alle Texte (>= min Zeichen) in einem JSON-Wert, auch Schluessel */
function texte(x, min, out = new Set()) {
  if (typeof x === 'string') { if (x.trim().length >= min) out.add(x.trim()); }
  else if (Array.isArray(x)) x.forEach((y) => texte(y, min, out));
  else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) { if (k.length >= min) out.add(k); texte(v, min, out); }
  return out;
}

/** Namen der Testpersonen: Anmeldenamen mit Punkt (mira.sonnental ...) und die Namen, die sie eintragen ("Lio Sonnental") */
export function testpersonenNamen() {
  const login = TESTPERSONEN.map((p) => p.name).filter((n) => n.includes('.'));
  const anzeige = TESTPERSONEN.map((p) => String(p.eintragen || '').split(',')[0].trim()).filter((n) => n.includes(' '));
  return [...new Set([...login, ...anzeige])];
}

/**
 * Suchlauf: prueft die fertige Familienfassung - die App (Klartext, so wie sie im Tresor liegt), die Huelle (das, was
 * veroeffentlicht wird) und das Manifest. -> { funde (leer = bestanden), pruefungen }
 * kontext: { woerter (verbotene-woerter.txt), schule (schuldaten.json oder null), konten (konten.json oder null), version }
 */
export function familiePruefen(volleApp, html, manifest, { woerter = [], schule = null, konten = null, version = null, schriften = schriftenLesen(WURZEL) } = {}) {
  const pruefungen = [];
  const pruef = (name, fund) => pruefungen.push({ name, ok: !fund, fund: fund || '' });
  // Textsuchen ohne die eingebetteten Schriften (rund 90 KB Base64 - darin tauchen kurze Woerter zufaellig auf); die
  // Schriften selbst prueft "Schriften eingebettet"
  const app = ohneSchriften(volleApp);
  const sf = [...schriftenPruefen(volleApp, schriften), ...(GOOGLE_FONTS.test(manifest) ? ['Google Fonts im Manifest'] : [])];
  pruef(`Schriften eingebettet, nichts von Google Fonts (${schriften.map((s) => s.familie).join(', ')})`, sf.join(', '));

  // keine Schuldaten im Code - sie kommen ins Konto des Kindes
  pruef('Schuldaten leer (SCHOOL_DATA=null)', /const SCHOOL_DATA=null\|\|\{\};/.test(app) ? '' : 'SCHOOL_DATA ist nicht null');
  const schulTexte = schule ? [...texte(schule.kinder || schule, 12)] : [];
  const schulTreffer = schulTexte.filter((s) => app.includes(s));
  pruef(`kein Text aus schuldaten.json (${schulTexte.length} gesucht)`, schulTreffer.length ? schulTreffer.length + ' Texte gefunden, z. B. "' + schulTreffer[0].slice(0, 40) + '"' : '');

  // keine Konten aus konten.json (Neubeginn)
  pruef('Konten leer (APP_ACCOUNTS ohne konten.json)', /APP_ACCOUNTS=normAccounts\(\/\*BQ_KONTEN\*\/null\)/.test(app) ? '' : 'APP_ACCOUNTS ist nicht leer');
  const kontoTexte = konten ? (konten.users || []).flatMap((u) => [u.id, u.start && u.start.hash].filter((x) => typeof x === 'string' && x.length >= 12)) : [];
  const kontoTreffer = kontoTexte.filter((s) => app.includes(s));
  pruef(`keine Kennung und kein Startcode-Hash aus konten.json (${kontoTexte.length} gesucht)`, kontoTreffer.length ? kontoTreffer.length + ' gefunden' : '');

  // keine Testpersonen (Testkinder nur in der Testinstanz, Peter 05.11.)
  const namen = testpersonenNamen();
  const namenTreffer = namen.filter((n) => new RegExp('(?<![\\w.])' + reEsc(n) + '(?![\\w.])', 'i').test(app));
  pruef(`keine Testpersonen (${namen.length} Namen gesucht)`, namenTreffer.length ? namenTreffer.map((n) => `"${n}"`).join(', ') : '');

  // nichts von der Testinstanz: Praefix, Repo, Adresse, Name
  const ti = [['bqt', /\bbqt(?:_|UpdateTo)/g], [TESTINSTANZ.repoDaten, new RegExp(reEsc(TESTINSTANZ.repoDaten), 'g')],
    [TESTINSTANZ.adresse, new RegExp(reEsc(TESTINSTANZ.adresse), 'g')], [TESTINSTANZ.name, new RegExp(reEsc(TESTINSTANZ.name), 'g')]]
    .map(([w, re]) => [w, zaehle(app + '\n' + manifest, re)]).filter(([, n]) => n);
  pruef('nichts von der Testinstanz (bqt, Test-Repo, Test-Adresse, Name)', ti.length ? ti.map(([w, n]) => `${w} ${n}x`).join(', ') : '');

  // Speicher: nur bqf_ - Kathies bisherige Eintraege (bq2_) bleiben unberuehrt; bq_ nur der Schluessel der Huelle
  const huelle = FAMILIE.huellenSchluessel;
  const alt = [['bq2_', zaehle(app, /bq2_/g)], ['bq_ (ausser ' + huelle + ')', zaehle(app, new RegExp('\\bbq_(?!' + reEsc(huelle.slice(3)) + '\\b)', 'g'))]].filter(([, n]) => n);
  pruef('kein bq2_ und kein bq_ ausser dem Schluessel der Huelle', alt.length ? alt.map(([w, n]) => `${w} ${n}x`).join(', ') : '');
  const literal = [...app.matchAll(/(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*(['"`])([^'"`]*)\1/g)].map((m) => m[2]);
  const fremd = literal.filter((k) => !k.startsWith(FAMILIE.praefix) && k !== huelle && k !== 'bqUpdateTo');
  pruef(`feste Speicherstellen nur mit bqf_ (${literal.length} gefunden)`, fremd.length ? fremd.join(', ') : literal.length ? '' : 'keine gefunden');
  pruef('Token-Eintrag bqf_gh', app.includes(TOKEN_ZEILE_FAMILIE) && zaehle(app, /const GITHUB_TOKEN_SCHLUESSEL = /g) === 1 ? '' : 'GITHUB_TOKEN_SCHLUESSEL ist nicht bqf_gh');
  const gk = /const GLOBAL_KEYS=\/\^\(([^)]*)\)\$\//.exec(app);
  const fehlendGlobal = ['gh', 'abgleich', 'abgleichVerworfen', 'geraetEntfernen'].filter((n) => !gk || !gk[1].split('|').includes(n));
  pruef('Geraetedaten und Token geraeteweit (GLOBAL_KEYS)', fehlendGlobal.length ? 'fehlt: ' + fehlendGlobal.join(', ') : '');

  // mit dem Familien-Repo verbunden: Marke ersetzt, genau eine Stelle, genau dieser Speicher (echtes GitHub)
  const sp = [...app.matchAll(/const KONTO_SPEICHER=([^;\r\n]*);/g)].map((m) => m[1]);
  pruef(`mit dem Familien-Repo verbunden (${FAMILIE.repoDaten})`,
    app.includes(SPEICHER_MARKE) ? 'Marke ' + SPEICHER_MARKE + ' nicht ersetzt'
      : sp.length !== 1 ? `KONTO_SPEICHER ${sp.length}x`
        : sp[0] !== JSON.stringify(SPEICHER_FAMILIE) ? 'anderer Speicher: ' + sp[0].slice(0, 80) : '');

  // Selbst-Aktualisierung wie Kathies App: mit dem Schluessel der Huelle aus dem Tresor
  const pv = [...app.matchAll(/async function publishedVersion\(\)\{[\s\S]*?\n\}/g)];
  pruef('Aktualisierung mit dem Familienschluessel (wie bisher)',
    pv.length !== 1 ? `publishedVersion ${pv.length}x` : !pv[0][0].includes("localStorage.getItem('" + huelle + "')") ? 'publishedVersion liest ' + huelle + ' nicht' : '');

  // es ist der Testbau (Konto, GitHub, Abgleich, Export/Loeschen, Schuldaten aus dem Konto), mit Version
  const module = ['function githubSpeicher(', 'async function kontoLookup(', 'async function geraetAbgleichen(', 'async function kindDatenExport(', 'function deriveSchool(', 'function anmAbgleich('];
  const fehlt = module.filter((s) => !app.includes(s));
  pruef('Testbau (Module github, konto, geraeteabgleich, kinddaten, ableitung, anmeldung)', fehlt.length ? 'fehlt: ' + fehlt.join(', ') : '');
  pruef('Version eingesetzt', /const APP_VERSION=\{/.test(app) ? '' : 'APP_VERSION fehlt');

  // die Huelle: verschluesselt, nichts Verbotenes und keine Version im oeffentlichen Teil
  const offen = html ? ohneTresor(html) : '';
  pruef('verschluesselt (Huelle mit Tresor, App nicht im Klartext)', !html ? 'keine Huelle' : !/<script type="application\/json" id="tresor">/.test(html) ? 'kein Tresor' : offen.includes('observeAttempt') || offen.includes('KONTO_SPEICHER') ? 'Klartext der App in der Huelle' : '');
  const wortTreffer = [...verboteneTreffer(offen, woerter), ...verboteneTreffer(manifest, woerter)];
  pruef(`keine verbotenen Woerter im oeffentlichen Teil (${woerter.length} gesucht)`, !woerter.length ? 'Liste leer' : wortTreffer.length ? wortTreffer.map((w) => `"${w}"`).join(', ') : '');
  const vTreffer = version ? [version.hash, version.date].filter((x) => x && (offen + manifest).includes(x)) : [];
  pruef('Version nicht im oeffentlichen Teil', vTreffer.length ? vTreffer.join(', ') : '');
  pruef('Repo der Familie nicht im oeffentlichen Teil', (offen + manifest).includes(FAMILIE.repoDaten) ? 'gefunden' : '');

  return { funde: pruefungen.filter((p) => !p.ok).map((p) => `${p.name}: ${p.fund}`), pruefungen };
}
