// Veroeffentlichen: bringt die gebaute, verschluesselte App (dist/) ins oeffentliche Repo bis-school-app.
// Ablauf und Regeln: docs/veroeffentlichen.md (nur mit Peters ausdruecklicher Freigabe).
//
//   node werkzeug/verschluesseln.mjs                       (vorher: bauen, prueft und schreibt dist/)
//   node werkzeug/veroeffentlichen.mjs --ziel "C:\dev\Peters Bastelbude\bis-school-app" --text "Elternbereich F6"
//   --dist <ordner>: ein anderer gebauter Ordner, z. B. dist-familie (Familienfassung, Stufe 4 - NUR nach Peters Go;
//   Ablauf docs/veroeffentlichen.md, Abschnitt 6)
//
// Bricht ab, ohne etwas zu kopieren, wenn
//  - dist/ fehlt oder die Huelle keinen Tresor hat oder Klartext der App enthaelt,
//  - ausserhalb des Tresors ein verbotenes Wort steht,
//  - der Quellstand nicht eingecheckte Aenderungen hat (Version "-entwurf"),
//  - das Ziel-Repo nicht sauber ist.
// Danach: Commit "Big Quest vN: <text>", Push, Pruefung "nicht mehr ahead" (der Push meldet Fehler sonst nur auf stderr).

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { WURZEL, quellenLesen, oeffentlichPruefen } from './bauen.mjs';
import { tresorAusHuelle, ohneTresor } from './kern.mjs';
import { versionErmitteln, versionText } from './version.mjs';

function schalter(argv) {
  const s = { ziel: null, text: '', ohnePush: false, dist: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--ziel') s.ziel = path.resolve(argv[++i] || '');
    else if (argv[i] === '--dist') s.dist = path.resolve(argv[++i] || '');   // z. B. dist-familie (Stufe 4, nur nach Peters Go)
    else if (argv[i] === '--text') s.text = String(argv[++i] || '').trim();
    else if (argv[i] === '--ohne-push') s.ohnePush = true;
    else throw new Error('Unbekannter Schalter: ' + argv[i]);
  }
  return s;
}
const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8' }).trim();

export async function veroeffentlichen({ quelle = WURZEL, dist = null, ziel, text = '', ohnePush = false, version = null } = {}) {
  const distOrdner = dist || path.join(quelle, 'dist');
  if (!ziel) throw new Error('--ziel fehlt (Pfad zum Repo bis-school-app, z. B. "C:\\dev\\Peters Bastelbude\\bis-school-app").');
  if (!fs.existsSync(path.join(ziel, '.git'))) throw new Error('Ziel ist kein Git-Repo: ' + ziel);
  const v = version || versionErmitteln(quelle);
  if (v.draft) throw new Error('Quellstand hat nicht eingecheckte Aenderungen (Version ' + versionText(v) + ') - so wird nichts veroeffentlicht.');
  if (!fs.existsSync(path.join(distOrdner, 'index.html'))) throw new Error('dist/ fehlt - erst node werkzeug/verschluesseln.mjs');
  const html = fs.readFileSync(path.join(distOrdner, 'index.html'), 'utf8');
  const manifest = fs.readFileSync(path.join(distOrdner, 'manifest.webmanifest'), 'utf8');
  const q = await quellenLesen(WURZEL);
  const treffer = oeffentlichPruefen(html, manifest, q.woerter);
  if (treffer.length) throw new Error('Verbotene Woerter im oeffentlichen Teil: ' + treffer.join(', '));
  tresorAusHuelle(html);                                       // wirft, wenn kein Tresor drin ist
  if (ohneTresor(html).includes('observeAttempt')) throw new Error('Klartext der App in der Huelle - abgebrochen.');
  if (git(ziel, 'status', '--porcelain')) throw new Error('Ziel-Repo hat lokale Aenderungen - erst klaeren.');
  if (!ohnePush) git(ziel, 'pull', '-q');
  // compare the content ourselves and write anew (not copyFileSync): Windows keeps the old modification time when copying,
  // and with the same size git may then miss the change - the new version would silently not go online (found 04.11., #132)
  const neu = fs.readFileSync(path.join(distOrdner, 'index.html')), zielDatei = path.join(ziel, 'index.html');
  if (fs.existsSync(zielDatei) && fs.readFileSync(zielDatei).equals(neu)) return { version: versionText(v), geaendert: false };
  fs.writeFileSync(zielDatei, neu);
  const nachricht = `Big Quest v${v.n}${text ? ': ' + text : ''}`;
  git(ziel, 'add', 'index.html');
  git(ziel, 'commit', '-q', '-m', nachricht);
  if (!ohnePush) {
    try { git(ziel, 'push', '-q'); } catch (e) { /* stderr only - checked below */ }
    git(ziel, 'fetch', '-q');
    const ahead = git(ziel, 'rev-list', '--count', '@{u}..HEAD');
    if (ahead !== '0') throw new Error('Push ist nicht durchgegangen (' + ahead + ' Commit voraus). Einfach wiederholen: git -C "' + ziel + '" push');
  }
  return { version: versionText(v), geaendert: true, nachricht };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('werkzeug/veroeffentlichen.mjs')) {
  try {
    const r = await veroeffentlichen(schalter(process.argv.slice(2)));
    console.log(r.geaendert ? `Veroeffentlicht: ${r.nachricht}` : `Nichts zu tun: ${r.version} ist schon veroeffentlicht.`);
    console.log('Danach: gh run list -R pahlborn/bis-school-app -L 1 · node werkzeug/verschluesseln.mjs --live-pruefen · node werkzeug/live-durchlauf.mjs');
  } catch (e) { console.error('Abbruch: ' + e.message); process.exit(1); }
}
