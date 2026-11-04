// Stufe 3a, Teil 2: Probe des GitHub-Speichers gegen das echte Test-Repo - von Hand, nicht in npm test.
//
//   node werkzeug/github-probe.mjs [--ort firmennetz|zuhause] [--repo owner/name]
//   node werkzeug/github-probe.mjs --aufraeumen-alle      (loescht den ganzen Ordner laeufe/, z. B. nach einem Abbruch)
//
// Der Token wird aus %LOCALAPPDATA%\bis-school-app\testdaten-token.txt gelesen (anderer Pfad: BQ_GH_TOKEN_DATEI).
// Er erscheint nie in einer Ausgabe: der Starter prueft die Ausgabe der Tests und schwaerzt ihn notfalls (und meldet das).
// Ablauf: Vorprobe (Lesen, Schreiben) -> Tests (tests/echt/github-echt.mjs) im Unterordner laeufe/<Lauf>/ ->
// Unterordner in EINEM Commit loeschen (Git-Data-API) und nachpruefen -> Messwerte ausgeben.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opt = (name, vorgabe) => { const i = args.indexOf(name); return i >= 0 && args[i + 1] ? args[i + 1] : vorgabe; };
const ORT = opt('--ort', 'unbekannt').replace(/[^a-z0-9]/gi, '').slice(0, 16) || 'unbekannt';
const REPO = opt('--repo', 'pahlborn/bis-school-app-testdaten');
if (!/^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/.test(REPO)) { console.error('Repo ungueltig'); process.exit(2); }
const TOKEN_DATEI = process.env.BQ_GH_TOKEN_DATEI || path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'bis-school-app', 'testdaten-token.txt');
if (!fs.existsSync(TOKEN_DATEI)) { console.error('Token-Datei fehlt: ' + TOKEN_DATEI); process.exit(2); }
const TOKEN = fs.readFileSync(TOKEN_DATEI, 'utf8').trim();
const API = 'https://api.github.com/repos/' + REPO;
const KOPF = { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + TOKEN, 'X-GitHub-Api-Version': '2022-11-28' };
const schwaerzen = (t) => String(t).split(TOKEN).join('[TOKEN]');

async function gh(methode, pfad, body) {
  const r = await fetch(API + pfad, { method: methode, headers: body ? { ...KOPF, 'Content-Type': 'application/json' } : KOPF, body: body ? JSON.stringify(body) : undefined });
  let daten = null; try { daten = await r.json(); } catch { daten = null; }
  return { status: r.status, daten, rest: r.headers.get('x-ratelimit-remaining') };
}

/* loescht <ordner> (und alles darunter) in einem Commit; -> 'geloescht' | 'nicht da' */
async function ordnerLoeschen(ordner) {
  if (!/^laeufe(?:\/[A-Za-z0-9_-]{1,48})?$/.test(ordner)) throw new Error('nur laeufe/ darf geloescht werden');
  for (let v = 0; v < 5; v++) {
    const ref = await gh('GET', '/git/ref/heads/main');
    if (ref.status !== 200) throw new Error('ref ' + ref.status);
    const commit = await gh('GET', '/git/commits/' + ref.daten.object.sha);
    if (commit.status !== 200) throw new Error('commit ' + commit.status);
    const baum = await gh('GET', '/git/trees/' + commit.daten.tree.sha + '?recursive=1');
    if (baum.status !== 200 || baum.daten.truncated) throw new Error('baum ' + baum.status);
    const weg = baum.daten.tree.filter((e) => e.type === 'blob' && e.path.startsWith(ordner + '/'));
    if (!weg.length) return 'nicht da';
    const neu = await gh('POST', '/git/trees', { base_tree: commit.daten.tree.sha, tree: weg.map((e) => ({ path: e.path, mode: e.mode, type: 'blob', sha: null })) });
    if (neu.status !== 201) throw new Error('neuer baum ' + neu.status);
    const c = await gh('POST', '/git/commits', { message: 'bq: probe aufgeraeumt (' + ordner + ', ' + weg.length + ' Dateien)', tree: neu.daten.sha, parents: [ref.daten.object.sha] });
    if (c.status !== 201) throw new Error('neuer commit ' + c.status);
    const p = await gh('PATCH', '/git/refs/heads/main', { sha: c.daten.sha, force: false });
    if (p.status === 200) return 'geloescht (' + weg.length + ' Dateien)';
    // 422: main ist inzwischen weiter (anderer Commit) -> nochmals von vorn
  }
  throw new Error('Aufraeumen: main bewegte sich staendig');
}

async function main() {
  console.log('Probe GitHub-Speicher gegen ' + REPO + ' - Ort: ' + ORT + ', Token: ' + (TOKEN.startsWith('github_pat_') ? 'fein eingeschraenkt' : 'ANDERE ART (bitte fein eingeschraenkten Token nehmen)'));
  if (args.includes('--aufraeumen-alle')) { console.log('laeufe/: ' + (await ordnerLoeschen('laeufe'))); return; }

  // Vorprobe: Lesen und Schreiben (zeigt sofort, ob das Netz GitHub-Schreibzugriffe sperrt)
  const repo = await gh('GET', '');
  console.log('Lesen: ' + repo.status + (repo.status === 200 ? ' (privat: ' + repo.daten.private + ')' : ''));
  if (repo.status !== 200) { console.log('=> Repo mit diesem Token nicht lesbar - abgebrochen.'); process.exitCode = 1; return; }
  const LAUF = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, '').replace('T', '-') + '-' + ORT;
  const probePfad = '/contents/laeufe/' + LAUF + '/vorprobe.json';
  const put = await gh('PUT', probePfad, { message: 'bq: vorprobe', content: Buffer.from('{"probe":1}').toString('base64') });
  console.log('Schreiben: ' + put.status);
  if (put.status !== 201) {
    console.log(put.status === 403 && !(put.daten && /token|permission|resource/i.test(put.daten.message || ''))
      ? '=> Schreiben gesperrt (403, vermutlich vom Netz). Bitte die Probe von einem anderen Netz wiederholen.'
      : '=> Schreiben nicht moeglich (' + put.status + ', ' + schwaerzen((put.daten && put.daten.message) || '') + ').');
    process.exitCode = 1;
    return;
  }

  const messDatei = path.join(os.tmpdir(), 'bq-gh-messung-' + LAUF + '.json');
  const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const t0 = Date.now();
  let ergebnis;
  try {
    ergebnis = spawnSync(process.execPath, ['--test', '--test-reporter=spec', 'tests/echt/github-echt.mjs'], {
      cwd: wurzel, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, BQ_GH_LAUF: LAUF, BQ_GH_TOKEN_DATEI: TOKEN_DATEI, BQ_GH_MESSUNG: messDatei, BQ_GH_REPO: REPO },
    });
  } finally {
    // immer aufraeumen, auch nach Abbruch der Tests
    try { console.log('Aufraeumen laeufe/' + LAUF + ': ' + (await ordnerLoeschen('laeufe/' + LAUF))); } catch (e) { console.log('Aufraeumen FEHLGESCHLAGEN: ' + schwaerzen(e.message) + ' -> spaeter: node werkzeug/github-probe.mjs --aufraeumen-alle'); process.exitCode = 1; }
  }
  const ausgabe = (ergebnis.stdout || '') + (ergebnis.stderr || '');
  const tokenDrin = ausgabe.includes(TOKEN) || ausgabe.includes(TOKEN.slice(-12));
  console.log(schwaerzen(ausgabe).split(TOKEN.slice(-12)).join('[TOKEN]'));
  console.log('Token in der Ausgabe der Tests: ' + (tokenDrin ? 'JA (geschwaerzt) - FEHLER' : 'nein'));
  const nachher = await gh('GET', '/contents/laeufe/' + LAUF);
  console.log('Nachpruefung laeufe/' + LAUF + ': ' + (nachher.status === 404 ? 'weg' : 'NOCH DA (' + nachher.status + ')'));

  if (fs.existsSync(messDatei)) {
    const m = JSON.parse(fs.readFileSync(messDatei, 'utf8'));
    fs.rmSync(messDatei);
    console.log('\n--- Messung (' + ORT + ', ' + Math.round((Date.now() - t0) / 1000) + ' s) ---');
    console.log('Anfragen gesamt: ' + m.gesamt.gesamt + ' (davon 304: ' + m.gesamt.unveraendert + ', schreibend: ' + m.gesamt.schreiben + '), Wartezeit im Netz ' + Math.round(m.gesamt.ms / 1000) + ' s');
    console.log('Antworten je Status: ' + JSON.stringify(m.status) + '; 409 bei PUT: ' + m.wiederholt409 + '; Limit-Antworten: ' + m.limitAntworten + '; Stundenlimit danach: ' + m.rateUsed + ' benutzt, ' + m.rateRest + ' frei');
    for (const t of m.tests) console.log('  ' + t.name + ': ' + t.anfragen + ' Anfragen (' + t.schreiben + ' schreibend, ' + t.unveraendert + 'x304), ' + t.sekunden + ' s');
    if (m.abgleich) {
      const a = m.abgleich, z = (l) => l.map((x) => x.anfragen).join(', '), ms = (l) => Math.round(l.reduce((s, x) => s + x.ms, 0) / l.length);
      console.log('Abgleich mit Neuem: Anfragen ' + z(a.mitNeuem) + ' (Mittel ' + ms(a.mitNeuem) + ' ms)');
      console.log('Abgleich nachholen: Anfragen ' + z(a.nachholen) + ' (Mittel ' + ms(a.nachholen) + ' ms)');
      console.log('Abgleich ohne Neues: Anfragen ' + z(a.ohneNeues) + ', davon 304: ' + a.ohneNeues.map((x) => x.unveraendert).join(', ') + ' (Mittel ' + ms(a.ohneNeues) + ' ms)');
    }
    if (m.cors) console.log('CORS: Preflight ' + m.cors.preflight + ', Origin ' + m.cors.herkunft);
  }
  if (ergebnis.status !== 0 || tokenDrin || nachher.status !== 404) process.exitCode = 1;
  console.log(process.exitCode ? '\nERGEBNIS: NICHT BESTANDEN' : '\nERGEBNIS: BESTANDEN');
}

main().catch((e) => { console.error('Abbruch: ' + schwaerzen(e && e.message)); process.exitCode = 1; });
