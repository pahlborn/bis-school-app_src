// Schulbewertungen uebernehmen (Vorbereitung Stufe 4, 05.11.): die Bewertungen der Schule aus werkzeug/schuldaten.json
// (je ALTER Kennung, z. B. "kathie") kommen als Ereignis school_import in den Bereich schule:<Kind> eines NEUEN Kontos -
// unterschrieben mit den Schluesseln eines Elternteils, so wie ein Elterngeraet es schreibt. Danach rechnet die App sie
// aus dem Protokoll (Modul ableitung, deriveSchool) statt aus der eingebauten Liste.
//
//   node werkzeug/schulbewertungen-uebernehmen.mjs --repo <owner/name> --zuordnung kathie=<neuer Anmeldename> --probe
//   node werkzeug/schulbewertungen-uebernehmen.mjs --repo <owner/name> --zuordnung kathie=<neuer Anmeldename>
//   weitere Schalter: --wurzel <Ordner im Repo>, --basis <Adresse eines nachgebauten GitHub-Servers>,
//                     --datei <Schuldaten-Datei> (sonst werkzeug/schuldaten.json), --token-datei <Datei>
//
// Regeln:
//  - Zuordnung alte Kennung -> neuer Anmeldename wird AUSDRUECKLICH angegeben, fuer jedes Kind der Datei; nie geraten.
//    Das neue Konto muss ein Kind sein und zur Familie des angemeldeten Elternteils gehoeren.
//  - Anmeldename und Passwort des Elternteils fragt das Terminal ab (Passwort verdeckt); beides wird nie gespeichert,
//    nie als Schalter angenommen und nie ausgegeben.
//  - Zaehlprobe: Bewertungen je Standard und Datum (wie die App sie zaehlt: nur bewertete Aufgaben), Aufgaben, wartende
//    Aufgaben und eine Pruefsumme ueber alles - vorher aus der Datei, nachher aus dem Speicher, gelesen von einem
//    frischen Geraet und gerechnet wie die App (deriveSchool). Jeder Unterschied bricht ab und wird gemeldet.
//  - --probe: liest nur (auch die Anmeldung und der Abgleich schreiben nichts) und zeigt, was uebernommen wuerde.
//  - Zweimal ausfuehren: ein gleicher Stand ist "schon uebernommen" - dann wird gar nichts geschrieben (auch kein Geraet).
//  - Die Schuldaten-Datei wird nur gelesen. Ziel ist nur ein Speicher (Simulation in Tests, nachgebauter GitHub-Server
//    oder ein Daten-Repo) - nie ein Repo der App.
//
// Das Werkzeug ist fuer den Speicher ein neues Geraet des Elternteils ("Werkzeug Schulbewertungen"; erscheint unter
// "Meine Geraete") - nur wenn wirklich etwas geschrieben wird.

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { PBKDF2_ROUNDS } from '../src/module/krypto.mjs';
import { anmelden, kontoName, kontoStand } from '../src/module/konto.mjs';
import { abgleichMitVerbindungen, verbindungen } from '../src/module/einladung.mjs';
import { newEvent, checkEvent } from '../src/module/ereignisse.mjs';
import { deriveSchool } from '../src/module/ableitung.mjs';
import { bereichName } from '../src/module/bereiche.mjs';
import { newDeviceId } from '../src/module/schreiber.mjs';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SCHULIMPORT_DATEI = path.join(WURZEL, 'werkzeug', 'schuldaten.json');
export const SCHULIMPORT_QUELLE = 'toddle';
export const SCHULIMPORT_GERAET = 'Werkzeug Schulbewertungen';
/* Einstufungen, die die App kennt (index.html SL: C, M, E, RS, N) */
export const SCHULIMPORT_STUFEN = Object.freeze(['C', 'M', 'E', 'RS', 'N']);
/* Repos der App selbst - dorthin schreibt das Werkzeug nie */
export const SCHULIMPORT_APP_REPOS = Object.freeze(['pahlborn/bis-school-app', 'pahlborn/bis-school-app_src', 'pahlborn/bis-school-app-test']);
export const SCHULIMPORT_FEHLER = Object.freeze(['schuldaten', 'zuordnung', 'anmeldung', 'nicht-elternteil', 'kind-unbekannt', 'kein-kind', 'nicht-in-familie', 'neuere-daten', 'senden', 'zaehlprobe']);

function fehler(code, text) { const e = new Error(text); e.code = code; return e; }
const obj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const tagOk = (s) => { if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false; const t = Date.parse(s + 'T00:00:00Z'); return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === s; };
const textListe = (x) => Array.isArray(x) && x.every((s) => typeof s === 'string' && s.length > 0);
const sprachTexte = (x) => obj(x) && typeof x.de === 'string' && typeof x.en === 'string';
const pad = (n) => String(n).padStart(2, '0');
const heuteVon = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

/** kanonischer Text (Schluessel sortiert) - fuer Vergleich und Pruefsumme */
export function kanon(x) {
  if (x === null || typeof x !== 'object') return JSON.stringify(x);
  if (Array.isArray(x)) return '[' + x.map(kanon).join(',') + ']';
  return '{' + Object.keys(x).sort().map((k) => JSON.stringify(k) + ':' + kanon(x[k])).join(',') + '}';
}

/* ---------- Schuldaten pruefen und zaehlen ---------- */
/** Probleme der Daten eines Kindes (Texte ohne Inhalte der Datei); leer = in Ordnung */
export function kindDatenPruefen(d) {
  const p = [];
  if (!obj(d)) return ['keine Daten'];
  if (!tagOk(d.asOf)) p.push('asOf ist kein Datum');
  if (!Array.isArray(d.tasks)) return p.concat(['tasks ist keine Liste']);
  d.tasks.forEach((t, i) => {
    const n = `Aufgabe ${i + 1}`;
    if (!obj(t)) { p.push(`${n}: kein Objekt`); return; }
    if (!tagOk(t.day)) p.push(`${n}: day ist kein Datum`);
    if (typeof t.area !== 'string' || !t.area) p.push(`${n}: area fehlt`);
    if (typeof t.title !== 'string' || !t.title) p.push(`${n}: title fehlt`);
    if (!obj(t.std)) p.push(`${n}: std fehlt`);
    else for (const [s, r] of Object.entries(t.std)) if (!s || !SCHULIMPORT_STUFEN.includes(r)) p.push(`${n}: Einstufung von ${s} unbekannt`);
    if (t.pending !== undefined && typeof t.pending !== 'boolean') p.push(`${n}: pending ist nicht ja/nein`);
    for (const k of ['quests', 'focusNext']) if (t[k] !== undefined && !textListe(t[k])) p.push(`${n}: ${k} ist keine Liste von Namen`);
    if (t.rubric !== undefined && !(Array.isArray(t.rubric) && t.rubric.every((x) => obj(x) && typeof x.crit === 'string' && SCHULIMPORT_STUFEN.includes(x.teacher) && SCHULIMPORT_STUFEN.includes(x.self)))) p.push(`${n}: rubric ungueltig`);
    if (t.atl !== undefined && !(obj(t.atl) && Object.values(t.atl).every((v) => typeof v === 'string'))) p.push(`${n}: atl ungueltig`);
    for (const k of ['good', 'next']) if (!sprachTexte(t[k])) p.push(`${n}: ${k} braucht de und en`);
  });
  return p;
}

/** die ganze Datei (Version 1, "kinder") -> Probleme; leer = in Ordnung */
export function schuldatenPruefen(schule) {
  if (!obj(schule) || schule.version !== 1 || !obj(schule.kinder)) return ['Version 1 mit "kinder" noetig'];
  const p = [];
  for (const [alt, d] of Object.entries(schule.kinder)) for (const x of kindDatenPruefen(d)) p.push(`${alt}: ${x}`);
  if (!Object.keys(schule.kinder).length) p.push('keine Kinder in der Datei');
  return p;
}

/** Zaehlprobe der Daten eines Kindes - so, wie die App zaehlt (index.html schoolRatings: nur bewertete Aufgaben) */
export function schulZaehlen(d) {
  if (!d) return { aufgaben: 0, wartend: 0, bewertungen: 0, jeStandardUndTag: {}, pruefsumme: null };
  const je = {};
  let bew = 0;
  for (const t of d.tasks) {
    if (t.pending) continue;
    for (const s of Object.keys(t.std)) { const k = `${t.day} ${s}`; je[k] = (je[k] || 0) + 1; bew++; }
  }
  return {
    aufgaben: d.tasks.length, wartend: d.tasks.filter((t) => t.pending).length, bewertungen: bew,
    jeStandardUndTag: Object.fromEntries(Object.keys(je).sort().map((k) => [k, je[k]])),
    pruefsumme: createHash('sha256').update(kanon(d)).digest('hex'),
  };
}

/** Unterschiede zweier Zaehlproben (Texte); leer = gleich */
export function zaehlUnterschiede(vorher, nachher) {
  const u = [];
  for (const k of ['aufgaben', 'wartend', 'bewertungen']) if (vorher[k] !== nachher[k]) u.push(`${k}: vorher ${vorher[k]}, nachher ${nachher[k]}`);
  for (const k of [...new Set([...Object.keys(vorher.jeStandardUndTag), ...Object.keys(nachher.jeStandardUndTag)])].sort()) {
    const a = vorher.jeStandardUndTag[k] || 0, b = nachher.jeStandardUndTag[k] || 0;
    if (a !== b) u.push(`${k}: vorher ${a}, nachher ${b}`);
  }
  if (vorher.pruefsumme !== nachher.pruefsumme) u.push('Pruefsumme ueber alle Inhalte verschieden');
  return u;
}

/** Zuordnung pruefen: { alteKennung: neuerAnmeldename } fuer JEDES Kind der Datei, nichts darueber hinaus */
export function zuordnungPruefen(zuordnung, schule) {
  if (!obj(zuordnung) || !Object.keys(zuordnung).length) throw fehler('zuordnung', 'Zuordnung fehlt: --zuordnung <alte Kennung>=<neuer Anmeldename> fuer jedes Kind der Datei.');
  const alte = Object.keys(schule.kinder);
  const fehlt = alte.filter((a) => !Object.prototype.hasOwnProperty.call(zuordnung, a));
  if (fehlt.length) throw fehler('zuordnung', 'Ohne Zuordnung (wird nicht geraten): ' + fehlt.join(', '));
  const fremd = Object.keys(zuordnung).filter((a) => !alte.includes(a));
  if (fremd.length) throw fehler('zuordnung', 'Nicht in der Datei: ' + fremd.join(', '));
  const neu = Object.values(zuordnung);
  const falsch = neu.filter((n) => typeof n !== 'string' || kontoName(n) !== n);
  if (falsch.length) throw fehler('zuordnung', 'Kein gueltiger Anmeldename: ' + falsch.join(', '));
  if (new Set(neu).size !== neu.length) throw fehler('zuordnung', 'Ein neuer Anmeldename steht zweimal in der Zuordnung.');
}

/* ---------- Speicher ---------- */
/** Zugang, der nur liest: Schreiben wird gezaehlt und zurueckgehalten (Probelauf, Lesen zur Zaehlprobe) */
export function nurLesen(zugang) {
  let n = 0;
  const halten = (antwort) => async () => { n++; return typeof antwort === 'function' ? antwort() : antwort; };
  return {
    ...zugang,
    put: async (bereich, geraet, b) => { n++; return geraet + '/' + (b && b.nr); },
    putKey: halten(undefined), putDirectory: halten(undefined),
    invite: { put: halten(undefined), delete: halten(false), get: async () => { const e = new Error('speicher: unbekannt'); e.code = 'unbekannt'; throw e; } },
    importFile: halten(() => ({ neu: 0, gleich: 0, abweichend: 0 })),
    zurueckgehalten: () => n,
  };
}
const ablageNeu = (geraet) => {
  const m = new Map([['bq2_evDevice', JSON.stringify(geraet)]]);
  return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } };
};
const kindLog = (ablage, kind) => { try { const l = JSON.parse(ablage.getItem('bq2_' + kind + '__events') || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; } };

/**
 * Uebernimmt die Schulbewertungen. speicher = { geraet(id) -> Zugang } (Simulation oder GitHub).
 * -> { kinder: [{ alt, neu, kennung, status, vorher, nachher }], zeilen: [Text], geraete: [id, die geschrieben hat] }
 *    status: 'wuerde-uebernommen' (Probe) | 'uebernommen' | 'schon-uebernommen'
 * Fehler: Error mit code aus SCHULIMPORT_FEHLER (bei 'zaehlprobe' mit e.unterschiede).
 */
export async function schulbewertungenUebernehmen({ speicher, anmeldename, passwort, schule, zuordnung, probe = false, now = Date.now(), heute, runden = PBKDF2_ROUNDS, geraetName = SCHULIMPORT_GERAET } = {}) {
  if (!speicher || typeof speicher.geraet !== 'function') throw new Error('speicher (geraet) fehlt.');
  const tag = heute || heuteVon(now);
  // 1. Datei und Zuordnung - bevor irgendetwas gelesen oder geschrieben wird
  const p = schuldatenPruefen(schule);
  if (p.length) throw fehler('schuldaten', 'Schuldaten ungueltig: ' + p.join('; '));
  zuordnungPruefen(zuordnung, schule);

  // 2. anmelden und lesen - nur lesend (ein frisches Geraet, das nichts schreibt)
  const geraet = newDeviceId();
  let konto;
  try { konto = await anmelden({ zugang: nurLesen(speicher.geraet(geraet)), anmeldename, passwort, runden }); }
  catch (e) { if (e.code === 'anmeldung') throw fehler('anmeldung', 'Anmeldung fehlgeschlagen (Name oder Passwort stimmt nicht).'); throw e; }
  if (konto.art !== 'parent') throw fehler('nicht-elternteil', 'Nur ein Elternteil darf Schulbewertungen uebernehmen.');
  const lesen = async (id) => {
    const a = ablageNeu(id), z = nurLesen(speicher.geraet(id));
    await abgleichMitVerbindungen({ ablage: a, zugang: z, konten: [konto], now, heute: tag });
    return a;
  };
  const a1 = await lesen(geraet);
  const familie = new Set(verbindungen({ ablage: a1, konto, now }).kinder.map((c) => c.id));

  // 3. jedes Kind pruefen - alle, bevor eines geschrieben wird
  const kinder = [];
  for (const [alt, neu] of Object.entries(zuordnung)) {
    const st = await kontoStand({ zugang: speicher.geraet(geraet), anmeldename: neu });
    if (!st) throw fehler('kind-unbekannt', `Kein Konto "${neu}" (Zuordnung ${alt}).`);
    if (st.art !== 'child') throw fehler('kein-kind', `"${neu}" ist kein Kinderkonto (Zuordnung ${alt}).`);
    if (!familie.has(st.kennung)) throw fehler('nicht-in-familie', `"${neu}" gehoert nicht zur Familie von ${konto.anmeldename} (oder wurde noch von keinem Elterngeraet aufgenommen).`);
    const daten = schule.kinder[alt];
    const payload = { asOf: daten.asOf, data: daten, source: SCHULIMPORT_QUELLE };
    // was die App jetzt rechnet: derselbe Stand -> schon uebernommen; ein neuerer -> Abbruch (auch wenn diese Datei
    // frueher schon einmal uebernommen wurde)
    const jetzt = deriveSchool(kindLog(a1, st.kennung), { now });
    const gleich = !!jetzt && kanon(jetzt) === kanon(daten);
    if (!gleich && jetzt && jetzt.asOf > daten.asOf) throw fehler('neuere-daten', `"${neu}" hat schon neuere Schulbewertungen (Stand ${jetzt.asOf}, Datei ${daten.asOf}) - nichts geschrieben.`);
    kinder.push({ alt, neu, kennung: st.kennung, payload, status: gleich ? 'schon-uebernommen' : probe ? 'wuerde-uebernommen' : 'offen', vorher: schulZaehlen(daten), nachher: null, ersetzt: !!jetzt && !gleich });
  }

  // 4. schreiben (nur was fehlt): neues Geraet des Elternteils, Ereignis ins Protokoll des Kindes, abgleichen
  const geraete = [];
  const offen = kinder.filter((k) => k.status === 'offen');
  if (offen.length) {
    const a2 = ablageNeu(geraet), z2 = speicher.geraet(geraet);
    const sync = () => abgleichMitVerbindungen({ ablage: a2, zugang: z2, konten: [konto], now, heute: tag, geraetName });
    await sync();
    geraete.push(geraet);
    for (const k of offen) {
      const key = 'bq2_' + k.kennung + '__events', log = kindLog(a2, k.kennung);
      let t = now;
      for (const e of log) { const x = obj(e) ? Date.parse(e.at) : NaN; if (Number.isFinite(x) && x >= t) t = x + 1; }
      const e = newEvent({ type: 'school_import', author: konto.kennung, device: geraet, at: new Date(t).toISOString(), payload: k.payload });
      const probleme = checkEvent(e);
      if (probleme.length) throw fehler('schuldaten', 'Ereignis ungueltig: ' + probleme.join('; '));
      a2.setItem(key, JSON.stringify(log.concat([e])));
      k.ereignis = e.id;
    }
    const r = await sync();
    for (const k of offen) {
      const b = r.bericht.bereiche[bereichName('schule', k.kennung)];
      if (!b || !b.ok) throw fehler('senden', `Senden fuer "${k.neu}" fehlgeschlagen (${(b && b.fehler) || 'Bereich nicht erreicht'}) - Zaehlprobe nicht moeglich.`);
    }
  }

  // 5. Zaehlprobe: ein frisches Geraet liest alles aus dem Speicher und rechnet wie die App
  if (!probe || kinder.some((k) => k.status === 'schon-uebernommen')) {
    const a3 = offen.length ? await lesen(newDeviceId()) : a1;
    for (const k of kinder) {
      if (k.status === 'wuerde-uebernommen') continue;
      k.nachher = schulZaehlen(deriveSchool(kindLog(a3, k.kennung), { now }));
      const u = zaehlUnterschiede(k.vorher, k.nachher);
      if (u.length) throw Object.assign(fehler('zaehlprobe', `Zaehlprobe fuer "${k.neu}" stimmt nicht: ${u.join('; ')}`), { unterschiede: u, kind: k.neu });
      if (k.status === 'offen') k.status = 'uebernommen';
    }
  }
  const zeilen = berichtZeilen({ kinder, probe, anmeldename: konto.anmeldename });
  return { kinder: kinder.map(({ payload, ...k }) => k), zeilen, geraete };
}

/** Bericht fuer das Terminal (ohne Inhalte der Bewertungen, ohne Geheimnisse) */
export function berichtZeilen({ kinder, probe, anmeldename }) {
  const z = [probe ? 'PROBELAUF - es wurde nichts geschrieben.' : `Angemeldet als ${anmeldename}.`];
  const STATUS = { 'wuerde-uebernommen': 'wuerde uebernommen', uebernommen: 'uebernommen, Zaehlprobe gleich', 'schon-uebernommen': 'schon uebernommen (gleicher Stand), nichts geschrieben, Zaehlprobe gleich' };
  for (const k of kinder) {
    const v = k.vorher, tage = new Set(Object.keys(v.jeStandardUndTag).map((x) => x.split(' ')[0])).size;
    z.push(`${k.alt} -> ${k.neu}: ${v.aufgaben} Aufgaben (${v.wartend} wartet auf Bewertung), ${v.bewertungen} Bewertungen an ${tage} Tagen - ${STATUS[k.status] || k.status}${k.ersetzt ? ' (ersetzt einen aelteren Stand)' : ''}`);
    z.push('   Datum       Standard  vorher' + (k.nachher ? '  nachher' : ''));
    for (const [key, n] of Object.entries(v.jeStandardUndTag)) {
      const [d, s] = key.split(' ');
      z.push(`   ${d}  ${s.padEnd(8)}  ${String(n).padStart(6)}` + (k.nachher ? `  ${String(k.nachher.jeStandardUndTag[key] || 0).padStart(7)}` : ''));
    }
  }
  return z;
}

/* ---------- Terminal ---------- */
function fragen(frage, verdeckt) {
  if (!process.stdin.isTTY) return Promise.reject(new Error('Kein Terminal: Anmeldename und Passwort werden nur im Terminal abgefragt (nicht ueber eine Pipe, nicht als Schalter).'));
  if (!verdeckt) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((r) => rl.question(frage, (a) => { rl.close(); r(a.trim()); }));
  }
  return new Promise((resolve, reject) => {
    const ein = process.stdin;
    let wert = '';
    process.stdout.write(frage);
    ein.setRawMode(true); ein.setEncoding('utf8'); ein.resume();
    const fertig = (f) => { ein.off('data', lauscher); ein.setRawMode(false); ein.pause(); process.stdout.write('\n'); f ? reject(f) : resolve(wert); };
    function lauscher(stueck) {
      for (const z of stueck) {
        if (z === '\r' || z === '\n') return fertig();
        if (z === '\u0003') return fertig(new Error('Abgebrochen.'));
        if (z === '\b' || z === '\u007f') wert = Array.from(wert).slice(0, -1).join('');
        else if (z >= ' ') wert += z;
      }
    }
    ein.on('data', lauscher);
  });
}

export function schalterLesen(argv) {
  const s = { zuordnung: {}, probe: false, repo: null, wurzel: '', basis: null, datei: SCHULIMPORT_DATEI, tokenDatei: null };
  const wert = (i, n) => { const v = argv[i + 1]; if (v === undefined || v.startsWith('--')) throw new Error(`${n} braucht einen Wert.`); return v; };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--probe') s.probe = true;
    else if (a === '--zuordnung') {
      const v = wert(i++, a), m = /^([^=\s]+)=([^=\s]+)$/.exec(v);
      if (!m) throw new Error('--zuordnung erwartet <alte Kennung>=<neuer Anmeldename>.');
      if (Object.prototype.hasOwnProperty.call(s.zuordnung, m[1])) throw new Error(`--zuordnung ${m[1]} doppelt.`);
      s.zuordnung[m[1]] = m[2];
    }
    else if (a === '--repo') s.repo = wert(i++, a);
    else if (a === '--wurzel') s.wurzel = wert(i++, a);
    else if (a === '--basis') s.basis = wert(i++, a);
    else if (a === '--datei') s.datei = path.resolve(wert(i++, a));
    else if (a === '--token-datei') s.tokenDatei = path.resolve(wert(i++, a));
    else if (/passwort|password|^--pw/i.test(a)) throw new Error('Das Passwort wird nur verdeckt im Terminal abgefragt, nie als Schalter.');
    else throw new Error('Unbekannter Schalter: ' + a);
  }
  if (!s.repo || !/^[\w.-]+\/[\w.-]+$/.test(s.repo)) throw new Error('--repo <owner/name> fehlt (das Daten-Repo; wird nicht geraten).');
  if (SCHULIMPORT_APP_REPOS.includes(s.repo.toLowerCase())) throw new Error(`${s.repo} ist ein Repo der App, kein Datenspeicher - Abbruch.`);
  return s;
}

async function main() {
  const s = schalterLesen(process.argv.slice(2));
  const schule = JSON.parse(await fs.readFile(s.datei, 'utf8'));          // nur lesen
  const tokenDatei = s.tokenDatei || process.env.BQ_GH_TOKEN_DATEI || path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'bis-school-app', 'testdaten-token.txt');
  let token;
  try { token = (await fs.readFile(tokenDatei, 'utf8')).trim(); } catch (e) { throw new Error('Token-Datei fehlt: ' + tokenDatei); }
  const geheim = [token];
  const schwaerzen = (t) => geheim.filter(Boolean).reduce((x, g) => x.split(g).join('[geheim]'), String(t));
  try {
    console.log(`Schulbewertungen aus ${path.relative(process.cwd(), s.datei) || s.datei} -> ${s.repo}${s.wurzel ? '/' + s.wurzel : ''}${s.basis ? ' (nachgebauter Server)' : ''}${s.probe ? ' - PROBELAUF' : ''}`);
    const anmeldename = await fragen('Anmeldename (Elternteil): ', false);
    const passwort = await fragen('Passwort (wird nicht angezeigt): ', true);
    geheim.push(passwort);
    const { githubSpeicher } = await import('../src/module/github.mjs');
    const speicher = githubSpeicher({ repo: s.repo, token, wurzel: s.wurzel, ...(s.basis ? { basis: s.basis } : {}) });
    const r = await schulbewertungenUebernehmen({ speicher, anmeldename, passwort, schule, zuordnung: s.zuordnung, probe: s.probe });
    console.log(schwaerzen(r.zeilen.join('\n')));
  } catch (e) { throw new Error(schwaerzen((e && e.code ? e.code + ': ' : '') + (e && e.message))); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error('FEHLER: ' + String(e && e.message)); process.exit(1); });
}
