// Testpersonen fuer die Testinstanz (Stufe 3c): zwei Familien mit gleichen Namen, eine Lehrkraft, ein Admin -
// im Verzeichnis des Test-Repos (Konto-Modul, Stufe 3b). Startcodes, Passwoerter und Wiederherstellungscodes stehen
// NUR lokal (%LOCALAPPDATA%\bis-school-app\testinstanz\), nie im Repo, nie in der Ausgabe.
//
//   node werkzeug/testpersonen.mjs              zeigt den Stand (liest nur)
//   node werkzeug/testpersonen.mjs --anlegen    legt an, was fehlt; abgelaufene Startcodes werden neu ausgestellt
//   weitere Schalter: --repo owner/name, --wurzel <ordner im Repo>
//
// Der Token kommt aus %LOCALAPPDATA%\bis-school-app\testdaten-token.txt (anderer Pfad: BQ_GH_TOKEN_DATEI).
//
// Wer was bekommt (Ausstellerkette wie im Konto-Modul: Admin -> Erwachsene, Elternteil -> Kind):
//  - admin, peter.a, peter.b: legt das Werkzeug selbst an (Passwort + Wiederherstellungscode in der lokalen Datei).
//    Das ist noetig, weil nur ein angemeldeter Admin bzw. Elternteil Startcodes unterschreiben kann.
//    Auf dem Geraet: Anmeldung mit Name und Passwort (Weg "weiteres Geraet").
//  - lehrkraft, anna.a, anna.b: Startcode vom Admin;  kathie.a / kathie.b: Startcode von peter.a / peter.b.
//    Auf dem Geraet: erste Anmeldung mit dem Startcode, eigenes Passwort.
// Gleiche Namen: die Anmeldenamen muessen eindeutig sein (.a/.b); Vorname, Nachname und Geburtsdatum traegt die
// Person in der App selbst ein - die Datei nennt, was sie eintragen soll (gleich, nur das Geburtsdatum unterscheidet).
// Familien-Verbindung (Anna <-> Kind, zweites Geraet findet die Kinder) kommt mit der Aufgabe "Einladungen".

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PBKDF2_ROUNDS } from '../src/module/krypto.mjs';
import { pwSuggest } from '../src/module/passwort.mjs';
import { kontoLookup, startcodeAusstellen, ersteAnmeldung, anmelden } from '../src/module/konto.mjs';
import { anmStartlink } from '../src/module/anmeldung.mjs';
import { ablageOrdner } from './schluesselablage.mjs';
import { TESTINSTANZ } from './testinstanz.mjs';

/* Reihenfolge = Reihenfolge des Anlegens (Aussteller zuerst) */
export const TESTPERSONEN = Object.freeze([
  { name: 'admin', art: 'admin', von: null, werkzeug: true, familie: '-', eintragen: 'Admin' },
  { name: 'lehrkraft', art: 'teacher', von: 'admin', familie: '-', eintragen: 'Lehrkraft' },
  { name: 'peter.a', art: 'parent', von: 'admin', werkzeug: true, familie: 'A', eintragen: 'Peter Beispiel' },
  { name: 'anna.a', art: 'parent', von: 'admin', familie: 'A', eintragen: 'Anna Beispiel' },
  { name: 'kathie.a', art: 'child', von: 'peter.a', familie: 'A', eintragen: 'Kathie Beispiel, Geburtsdatum 14.05.2017' },
  { name: 'peter.b', art: 'parent', von: 'admin', werkzeug: true, familie: 'B', eintragen: 'Peter Beispiel' },
  { name: 'anna.b', art: 'parent', von: 'admin', familie: 'B', eintragen: 'Anna Beispiel' },
  { name: 'kathie.b', art: 'child', von: 'peter.b', familie: 'B', eintragen: 'Kathie Beispiel, Geburtsdatum 03.09.2017' }
].map((p) => Object.freeze(p)));

/* ein Startcode, der in weniger als einem Tag ablaeuft, wird neu ausgestellt */
export const STARTCODE_RESERVE_MS = 24 * 3600 * 1000;
const ARTEN = { admin: 'Admin', teacher: 'Lehrkraft', parent: 'Elternteil', child: 'Kind' };

export const lokalerOrdner = () => path.join(ablageOrdner(), 'testinstanz');
const tag = (ms) => new Date(ms).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

/**
 * Legt an, was fehlt (anlegen = true), oder zeigt nur den Stand. Liest und schreibt nur ueber "zugang" (Speicher-
 * Schnittstelle: Simulation oder GitHub). stand = bisheriger lokaler Stand ({ personen: { <name>: {...} } }).
 * -> { stand (neu), zeilen: [{ name, art, familie, status }] } - die Zeilen enthalten nie Codes oder Passwoerter.
 */
export async function testpersonenAnlegen({ zugang, now, anlegen = false, stand = {}, runden = PBKDF2_ROUNDS, rand, passwortNeu = () => pwSuggest(), merken = async () => {} } = {}) {
  if (!Number.isFinite(now)) throw new Error('"now" fehlt.');
  const st = { v: 1, personen: { ...(stand.personen || {}) } };
  const offen = {}, zeilen = [];
  const zr = rand ? { rand } : {};
  for (const p of TESTPERSONEN) {
    const alt = st.personen[p.name] || {};
    const da = (await zugang.directory(await kontoLookup(p.name))) !== null;
    let status;
    if (p.werkzeug) {
      if (da) {
        if (!alt.passwort) throw new Error(`Konto ${p.name} gibt es schon, aber die lokale Datei kennt sein Passwort nicht - anderer Rechner? Abbruch.`);
        try { offen[p.name] = await anmelden({ zugang, anmeldename: p.name, passwort: alt.passwort, runden }); }
        catch (e) { throw new Error(`Konto ${p.name}: das Passwort aus der lokalen Datei oeffnet es nicht mehr (${e.code || e.message}). Abbruch.`); }
        status = 'angelegt (Anmeldung mit Name und Passwort)';
      } else if (!anlegen) status = 'fehlt';
      else {
        const aussteller = p.von ? offen[p.von] : null;
        if (p.von && !aussteller) throw new Error(`Aussteller ${p.von} fuer ${p.name} fehlt.`);
        const sc = await startcodeAusstellen({ zugang, aussteller, anmeldename: p.name, art: p.art, now, ...zr });
        const passwort = passwortNeu();
        const k = await ersteAnmeldung({ zugang, code: sc.code, passwort, now, runden, ...zr });
        offen[p.name] = k;
        st.personen[p.name] = { kennung: k.kennung, passwort, wiederherstellungscode: k.wiederherstellungscode, angelegt: now };
        await merken(st);                               // sofort: ohne die Datei waere das Passwort verloren
        status = 'neu angelegt (Anmeldung mit Name und Passwort)';
      }
    } else if (da) {
      status = 'angemeldet (Startcode benutzt)';
      if (alt.startcode) st.personen[p.name] = { ...alt, startcode: null, benutzt: true };
    } else if (alt.startcode && alt.startcode.gueltigBis - now > STARTCODE_RESERVE_MS) {
      status = 'Startcode gueltig bis ' + tag(alt.startcode.gueltigBis);
    } else if (!anlegen) {
      status = alt.startcode ? 'Startcode abgelaufen oder laeuft heute ab' : 'fehlt';
    } else {
      const aussteller = offen[p.von];
      if (!aussteller) throw new Error(`Aussteller ${p.von} fuer ${p.name} fehlt.`);
      const sc = await startcodeAusstellen({ zugang, aussteller, anmeldename: p.name, art: p.art, now, ...zr });
      st.personen[p.name] = { kennung: sc.kennung, startcode: { code: sc.code, gueltigBis: sc.gueltigBis, ausgestellt: now }, von: p.von };
      await merken(st);
      status = (alt.startcode ? 'Startcode neu' : 'Startcode ausgestellt') + ', gueltig bis ' + tag(sc.gueltigBis);
    }
    zeilen.push({ name: p.name, art: p.art, familie: p.familie, status });
  }
  return { stand: st, zeilen };
}

/** Text fuer die lokale Datei (mit Codes und Passwoertern - nur dorthin). */
export function uebersichtText(stand, { repo, wurzel, jetzt }) {
  const z = [
    'Big Quest Testinstanz - Testpersonen (NUR auf diesem Rechner; nicht weitergeben ausser an die Testperson)',
    `Stand: ${tag(jetzt)}   Daten: ${repo}${wurzel ? '/' + wurzel : ''}   App: ${TESTINSTANZ.adresse}`,
    'Gleiche Namen in beiden Familien - nur das Geburtsdatum der Kinder unterscheidet sie.',
    ''
  ];
  for (const p of TESTPERSONEN) {
    const s = stand.personen[p.name] || {};
    z.push(`${p.name.padEnd(10)} ${ARTEN[p.art].padEnd(10)} Familie ${p.familie}   in der App eintragen: ${p.eintragen}`);
    if (p.werkzeug && s.passwort) z.push(`           Anmeldename: ${p.name}   Passwort: ${s.passwort}` + (s.wiederherstellungscode ? `   Wiederherstellungscode: ${s.wiederherstellungscode}` : ''));
    else if (s.startcode) {
      z.push(`           Startcode (einmal, ausgestellt von ${p.von}): ${s.startcode.code}   gueltig bis ${tag(s.startcode.gueltigBis)}`);
      z.push(`           Startlink: ${anmStartlink(TESTINSTANZ.adresse, { anmeldename: p.name, code: s.startcode.code })}`);
    }
    else if (s.benutzt) z.push('           Startcode benutzt - Anmeldung mit Name und eigenem Passwort');
    else z.push('           noch nicht angelegt (node werkzeug/testpersonen.mjs --anlegen)');
  }
  return z.join('\n') + '\n';
}

/** alle Geheimnisse des Stands (fuer die Pruefung der Ausgabe) */
export const geheimnisse = (stand) => Object.values(stand.personen || {}).flatMap((s) => [s.passwort, s.wiederherstellungscode, s.startcode && s.startcode.code]).filter((x) => typeof x === 'string' && x);

/**
 * Ein Lauf mit lokaler Ablage: Stand lesen, anlegen/zeigen, Stand und Uebersicht schreiben (nur bei anlegen).
 * ausgabe(text) bekommt die Zeilen fuer die Konsole - ohne Geheimnisse (wird hier geprueft).
 */
export async function testpersonenLauf({ zugang, now = Date.now(), anlegen = false, ordner = lokalerOrdner(), repo = TESTINSTANZ.repoDaten, wurzel = TESTINSTANZ.wurzelDaten, runden, rand, ausgabe = console.log } = {}) {
  const standDatei = path.join(ordner, 'testpersonen.json'), textDatei = path.join(ordner, 'testpersonen.txt');
  let stand = {};
  try { stand = JSON.parse(await fs.readFile(standDatei, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const zeilenAus = [];
  const sag = (t) => zeilenAus.push(t);
  // nach jeder Aenderung schreiben: was schon angelegt ist, bleibt auch nach einem Abbruch gemerkt
  const merken = async (st) => {
    await fs.mkdir(ordner, { recursive: true });
    await fs.writeFile(standDatei, JSON.stringify(st, null, 2) + '\n', { mode: 0o600 });
    await fs.writeFile(textDatei, uebersichtText(st, { repo, wurzel, jetzt: now }), { mode: 0o600 });
  };
  const r = await testpersonenAnlegen({ zugang, now, anlegen, stand, merken: anlegen ? merken : async () => {}, ...(runden ? { runden } : {}), ...(rand ? { rand } : {}) });
  if (anlegen) await merken(r.stand);
  sag(`Testpersonen in ${repo}${wurzel ? '/' + wurzel : ''}${anlegen ? '' : ' (nur angesehen, nichts geschrieben)'}:`);
  for (const z of r.zeilen) sag(`  ${z.name.padEnd(10)} ${ARTEN[z.art].padEnd(10)} Familie ${z.familie}  ${z.status}`);
  sag(anlegen ? `Startcodes, Passwoerter, Wiederherstellungscodes: ${textDatei}` : 'Anlegen mit: node werkzeug/testpersonen.mjs --anlegen');
  const text = zeilenAus.join('\n');
  const geheim = geheimnisse(r.stand).filter((g) => text.includes(g));
  if (geheim.length) throw new Error('Ausgabe enthielte ' + geheim.length + ' Geheimnis(se) - nicht ausgegeben.');
  ausgabe(text);
  return { ...r, standDatei, textDatei };
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
  const bekannt = ['--anlegen', '--repo', '--wurzel'];
  const fremd = args.filter((a, i) => a.startsWith('--') && !bekannt.includes(a) && !['--repo', '--wurzel'].includes(args[i - 1]));
  if (fremd.length) throw new Error('Unbekannter Schalter: ' + fremd.join(' '));
  const repo = opt('--repo', TESTINSTANZ.repoDaten), wurzel = opt('--wurzel', TESTINSTANZ.wurzelDaten);
  const tokenDatei = process.env.BQ_GH_TOKEN_DATEI || path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'bis-school-app', 'testdaten-token.txt');
  let token;
  try { token = (await fs.readFile(tokenDatei, 'utf8')).trim(); } catch (e) { throw new Error('Token-Datei fehlt: ' + tokenDatei); }
  const schwaerzen = (t) => (token ? String(t).split(token).join('[TOKEN]') : String(t));
  const { githubSpeicher } = await import('../src/module/github.mjs');
  try {
    const zugang = githubSpeicher({ repo, token, wurzel }).geraet('d_Werkzeug1');
    await testpersonenLauf({ zugang, anlegen: args.includes('--anlegen'), repo, wurzel, ausgabe: (t) => console.log(schwaerzen(t)) });
  } catch (e) { throw new Error(schwaerzen((e && e.code ? e.code + ': ' : '') + (e && e.message))); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error('FEHLER: ' + String(e && e.message)); process.exit(1); });
}
