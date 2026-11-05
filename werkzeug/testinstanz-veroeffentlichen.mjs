// Testinstanz veroeffentlichen (Stufe 3c): bringt die gebaute Testinstanz (dist-test/) ins oeffentliche Repo
// bis-school-app-test (GitHub Pages: https://pahlborn.github.io/bis-school-app-test/). Gegenstueck zu
// werkzeug/veroeffentlichen.mjs, aber OHNE Verschluesselung: die Testinstanz enthaelt nichts Geheimes.
// Regeln wie bei Kathies App: nur nach Peters ausdruecklicher Freigabe (docs/veroeffentlichen.md, Abschnitt 5).
//
//   node werkzeug/testinstanz.mjs                                    (vorher: bauen, Suchlauf, schreibt dist-test/)
//   node werkzeug/testinstanz-veroeffentlichen.mjs --ziel "C:\dev\Peters Bastelbude\bis-school-app-test" --text "erste Fassung"
//   node werkzeug/testinstanz-veroeffentlichen.mjs --live-pruefen    (danach: Version der Seite = gebaute Version?)
//
// Bricht ab, OHNE etwas zu kopieren, wenn
//  - dist-test/ fehlt oder unvollstaendig ist,
//  - der Suchlauf aus dem Bau (testinstanzPruefen) etwas findet - er laeuft hier noch einmal auf genau den Dateien,
//    die kopiert werden: keine Schuldaten, keine Konten aus konten.json, kein Familienpasswort (Tresor, Salz),
//    keine fremden Speicherstellen, keine verbotenen Woerter, Aktualisierung ohne Schluessel,
//  - dist-test/ nicht zum Quellstand passt (anderer Commit: erst neu bauen) oder der Quellstand ein Entwurf ist,
//  - das Ziel nicht das Repo der Testinstanz ist (Remote nicht ".../bis-school-app-test", oder dort liegt eine
//    verschluesselte Huelle = Kathies App),
//  - das Ziel schon eine neuere Version hat (Geraete aktualisieren nur auf hoehere Nummern),
//  - das Ziel-Repo nicht sauber ist.
// Danach: Commit "Big Quest Test vN: <text>", Push, Pruefung "nicht mehr ahead" (Fehler meldet git sonst nur auf stderr).
// Ausgaben nur in ASCII (Windows-Konsole).

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { WURZEL, ICONS, testinstanzKontext } from './bauen.mjs';
import { TESTINSTANZ, testinstanzPruefen } from './testinstanz.mjs';
import { versionErmitteln, versionAuslesen, versionText } from './version.mjs';

export const DATEIEN = ['index.html', 'manifest.webmanifest', ...ICONS];
export const ZIEL_REPO = /[/:\\]bis-school-app-test(?:\.git)?[/\\]?$/;
// Fuer Tests mit BQ_TESTINSTANZ_URL auf einen lokalen Server umlenkbar.
export const TESTINSTANZ_URL = process.env.BQ_TESTINSTANZ_URL || TESTINSTANZ.adresse;

const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const gitOderLeer = (cwd, ...a) => { try { return git(cwd, ...a); } catch { return ''; } };

function schalter(argv) {
  const s = { ziel: null, text: '', ohnePush: false, livePruefen: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--ziel') s.ziel = path.resolve(argv[++i] || '');
    else if (argv[i] === '--text') s.text = String(argv[++i] || '').trim();
    else if (argv[i] === '--ohne-push') s.ohnePush = true;
    else if (argv[i] === '--live-pruefen') s.livePruefen = true;
    else throw new Error('Unbekannter Schalter: ' + argv[i]);
  }
  return s;
}

/** Alle Pruefungen vor dem Kopieren. -> { app, version } oder wirft (dann ist nichts kopiert). */
export async function testinstanzVorPruefen({ quelle = WURZEL, dist, ziel, version }) {
  if (!ziel) throw new Error('--ziel fehlt (Pfad zum Repo bis-school-app-test, z. B. "C:\\dev\\Peters Bastelbude\\bis-school-app-test").');
  if (!fs.existsSync(path.join(ziel, '.git'))) throw new Error('Ziel ist kein Git-Repo: ' + ziel);
  const remote = gitOderLeer(ziel, 'remote', 'get-url', 'origin');
  if (remote && !ZIEL_REPO.test(remote)) throw new Error('Ziel ist nicht das Repo der Testinstanz (origin = ' + remote + ', erwartet .../bis-school-app-test).');
  const zielApp = fs.existsSync(path.join(ziel, 'index.html')) ? fs.readFileSync(path.join(ziel, 'index.html'), 'utf8') : '';
  if (/id="tresor"/.test(zielApp)) throw new Error('Im Ziel liegt eine verschluesselte Huelle (Kathies App) - dorthin wird die Testinstanz nie kopiert.');

  if (version.draft) throw new Error('Quellstand hat nicht eingecheckte Aenderungen (Version ' + versionText(version) + ') - so wird nichts veroeffentlicht.');
  const fehlt = DATEIEN.filter((d) => !fs.existsSync(path.join(dist, d)));
  if (fehlt.length) throw new Error('dist-test/ fehlt oder ist unvollstaendig (' + fehlt.join(', ') + ') - erst node werkzeug/testinstanz.mjs');
  const app = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const manifest = fs.readFileSync(path.join(dist, 'manifest.webmanifest'), 'utf8');

  // derselbe Suchlauf wie beim Bau, auf genau den Dateien, die kopiert werden
  let funde;
  try { funde = testinstanzPruefen(app, manifest, await testinstanzKontext(quelle)).funde; } catch (e) { funde = ['Suchlauf nicht moeglich: ' + e.message]; }
  if (funde.length) throw new Error('Suchlauf Testinstanz, nichts kopiert:\n  - ' + funde.join('\n  - '));

  const gebaut = versionAuslesen(app);
  if (!gebaut || gebaut.n !== version.n || gebaut.hash !== version.hash || !!gebaut.draft)
    throw new Error(`dist-test/ passt nicht zum Quellstand (gebaut ${gebaut ? versionText(gebaut) + ' ' + gebaut.hash : 'ohne Version'}, Quelle ${versionText(version)} ${version.hash}) - erst node werkzeug/testinstanz.mjs`);
  const vorher = versionAuslesen(zielApp);
  if (vorher && vorher.n > gebaut.n) throw new Error(`Im Ziel liegt schon v${vorher.n} - aeltere Fassung v${gebaut.n} wird nicht veroeffentlicht (Geraete aktualisieren nur auf hoehere Nummern).`);
  if (git(ziel, 'status', '--porcelain')) throw new Error('Ziel-Repo hat lokale Aenderungen - erst klaeren.');
  return { app, version: gebaut };
}

export async function testinstanzVeroeffentlichen({ quelle = WURZEL, dist = null, ziel, text = '', ohnePush = false, version = null } = {}) {
  const distOrdner = dist || path.join(quelle, TESTINSTANZ.ordner);
  const v = version || versionErmitteln(quelle);
  await testinstanzVorPruefen({ quelle, dist: distOrdner, ziel, version: v });
  if (!ohnePush) {
    git(ziel, 'pull', '-q');
    await testinstanzVorPruefen({ quelle, dist: distOrdner, ziel, version: v });   // nach dem Pull: neuere Fassung im Ziel?
  }
  // Inhalt selbst vergleichen und neu schreiben (nicht copyFileSync): Windows uebernimmt beim Kopieren die alte Aenderungszeit,
  // dann haelt git eine gleich grosse neue Fassung fuer unveraendert (gesehen im Test v7 -> v8).
  const anders = DATEIEN.filter((d) => { const z = path.join(ziel, d); return !fs.existsSync(z) || !fs.readFileSync(z).equals(fs.readFileSync(path.join(distOrdner, d))); });
  if (!anders.length) return { version: versionText(v), geaendert: false };
  for (const d of anders) fs.writeFileSync(path.join(ziel, d), fs.readFileSync(path.join(distOrdner, d)));
  const nachricht = `Big Quest Test v${v.n}${text ? ': ' + text : ''}`;
  git(ziel, 'add', '--', ...anders);
  if (!git(ziel, 'diff', '--cached', '--name-only')) return { version: versionText(v), geaendert: false };   // nur Zeilenenden anders
  git(ziel, 'commit', '-q', '-m', nachricht);
  if (!ohnePush) {
    try { git(ziel, 'push', '-q'); } catch (e) { /* stderr only - checked below */ }
    git(ziel, 'fetch', '-q');
    const ahead = git(ziel, 'rev-list', '--count', '@{u}..HEAD');
    if (ahead !== '0') throw new Error('Push ist nicht durchgegangen (' + ahead + ' Commit voraus). Einfach wiederholen: git -C "' + ziel + '" push');
  }
  return { version: versionText(v), geaendert: true, nachricht };
}

/**
 * Version der veroeffentlichten Testinstanz (im Klartext) mit dem gebauten Stand vergleichen.
 * Ergebnis: 'gleich', 'anders' (mit Text) oder 'nicht erreichbar'. Ein Aufruf, keine Wiederholung.
 */
export async function testinstanzLiveVergleichen(gebaut, url = TESTINSTANZ_URL) {
  let html;
  try {
    const antwort = await fetch(url + '?t=' + Date.now(), { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!antwort.ok) return { ergebnis: 'nicht erreichbar', grund: `HTTP ${antwort.status}` };
    html = await antwort.text();
  } catch (e) {
    return { ergebnis: 'nicht erreichbar', grund: e.message };
  }
  const v = versionAuslesen(html);
  const gleich = v && v.n === gebaut.n && v.hash === gebaut.hash && v.date === gebaut.date && !!v.draft === !!gebaut.draft;
  return gleich ? { ergebnis: 'gleich', veroeffentlicht: v } : { ergebnis: 'anders', veroeffentlicht: v, text: v ? versionText(v) + ' ' + v.hash + ' ' + v.date : 'ohne Version' };
}

async function main() {
  const s = schalter(process.argv.slice(2));
  if (s.livePruefen) {
    const datei = path.join(WURZEL, TESTINSTANZ.ordner, 'index.html');
    if (!fs.existsSync(datei)) throw new Error('dist-test/ fehlt - erst node werkzeug/testinstanz.mjs');
    const gebaut = versionAuslesen(fs.readFileSync(datei, 'utf8'));
    const r = await testinstanzLiveVergleichen(gebaut);
    console.log(`Live-Vergleich ${TESTINSTANZ_URL}: ${r.ergebnis}` + (r.text ? ` (veroeffentlicht ${r.text}, gebaut ${versionText(gebaut)} ${gebaut.hash} ${gebaut.date})` : '') + (r.grund ? ` (${r.grund})` : ''));
    if (r.ergebnis !== 'gleich') process.exit(1);
    return;
  }
  const r = await testinstanzVeroeffentlichen(s);
  console.log(r.geaendert ? `Veroeffentlicht: ${r.nachricht}` : `Nichts zu tun: ${r.version} ist schon veroeffentlicht.`);
  console.log('Danach: gh run list -R pahlborn/bis-school-app-test -L 1 - node werkzeug/testinstanz-veroeffentlichen.mjs --live-pruefen');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error('Abbruch: ' + e.message); process.exit(1); });
}
