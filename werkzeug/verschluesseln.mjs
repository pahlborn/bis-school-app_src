// Verschluesselt die App und legt das Ergebnis in dist/.
//
//   node werkzeug/verschluesseln.mjs              gemerkten Schluessel nutzen, sonst Passwort fragen
//   node werkzeug/verschluesseln.mjs --passwort   Passwort neu eingeben (z. B. zum Aendern)
//   node werkzeug/verschluesseln.mjs --vergessen  gemerkten Schluessel loeschen
//
// Weitere Schalter: --ziel <ordner> (statt dist/), --ohne-abgleich (nicht
// gegen die veroeffentlichte Seite pruefen).
//
//   node werkzeug/verschluesseln.mjs --live-pruefen
//     nach dem Hochladen: vergleicht die Version in dist/ mit der veroeffentlichten Seite
//     ("gleich", "anders (veroeffentlicht: vX)" oder "nicht erreichbar"). Baut nichts.
//
// Das Passwort wird verdeckt abgefragt, zweimal. Es wird nie gespeichert und
// nie ausgegeben. Ueber eine Pipe oder ein Argument nimmt das Skript es
// absichtlich nicht an - so landet es weder in der Shell-Historie noch in
// einem Protokoll. Gemerkt wird nach einem Lauf mit Passwort nur der daraus
// abgeleitete Schluessel (schluesselablage.mjs).
//
// Ausgaben nur in ASCII: die Windows-Konsole zeigt Umlaute aus Node sonst
// verstuemmelt an.

import fs from 'node:fs/promises';
import path from 'node:path';
import { WURZEL, distBauen, quellenLesen, mitVeroeffentlichterPruefen, liveVergleichen } from './bauen.mjs';
import { passwortPruefen, passwortNormal, schluesselAusPasswort, schluesselRoh, schluesselAusRoh, entschluesselnMitSchluessel, tresorAusHuelle, ITERATIONEN } from './kern.mjs';
import { versionAuslesen, versionText } from './version.mjs';
import * as ablage from './schluesselablage.mjs';

function verdecktFragen(frage) {
  return new Promise((resolve, reject) => {
    const ein = process.stdin;
    let wert = '';
    process.stdout.write(frage);
    ein.setRawMode(true);
    ein.setEncoding('utf8');
    ein.resume();
    const fertig = (fehler) => {
      ein.off('data', lauscher);
      ein.setRawMode(false);
      ein.pause();
      process.stdout.write('\n');
      fehler ? reject(fehler) : resolve(wert);
    };
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

function schalterLesen(argv) {
  const s = { passwort: false, vergessen: false, ohneAbgleich: false, ziel: null, livePruefen: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--passwort') s.passwort = true;
    else if (a === '--live-pruefen') s.livePruefen = true;
    else if (a === '--vergessen') s.vergessen = true;
    else if (a === '--ohne-abgleich') s.ohneAbgleich = true;
    else if (a === '--ziel') s.ziel = path.resolve(argv[++i] || '');
    else throw new Error(`Unbekannter Schalter: ${a}`);
  }
  return s;
}

async function passwortAbfragen() {
  if (!process.stdin.isTTY) {
    throw new Error('Passwort noetig, aber kein Terminal. Bitte direkt im Terminal starten - das Passwort wird nur verdeckt abgefragt, nicht ueber eine Pipe.');
  }
  console.log('Passwort: mindestens 20 Zeichen, z. B. vier zufaellige Woerter. Es wird nicht angezeigt.\n');
  const pw1 = await verdecktFragen('Passwort: ');
  passwortPruefen(pw1);
  const pw2 = await verdecktFragen('Passwort wiederholen: ');
  if (passwortNormal(pw1) !== passwortNormal(pw2)) throw new Error('Die beiden Eingaben stimmen nicht ueberein. Nichts geschrieben.');
  return pw1;
}

async function main() {
  const s = schalterLesen(process.argv.slice(2));
  console.log('Big Quest verschluesseln\n');

  if (s.vergessen) {
    console.log((await ablage.vergessen()) ? `Gemerkter Schluessel geloescht: ${ablage.ablagePfad()}` : 'Es war kein Schluessel gemerkt.');
    return;
  }

  const { salt } = await quellenLesen();

  if (s.livePruefen) {
    const g = await ablage.lesen(salt, ITERATIONEN);
    if (!g.roh) throw new Error('Kein gemerkter Schluessel - Live-Pruefung nicht moeglich.');
    const html = await fs.readFile(path.join(s.ziel || path.join(WURZEL, 'dist'), 'index.html'), 'utf8');
    const klar = await entschluesselnMitSchluessel(tresorAusHuelle(html), await schluesselAusRoh(g.roh));
    const gebaut = versionAuslesen(Buffer.from(klar).toString('utf8'));
    if (!gebaut) throw new Error('dist/index.html enthaelt keine Version.');
    const r = await liveVergleichen(gebaut, g.roh);
    console.log(`Gebaut: ${versionText(gebaut)} - ${gebaut.hash} - ${gebaut.date}`);
    console.log(r.ergebnis === 'gleich' ? 'Live-Pruefung: gleich'
      : r.ergebnis === 'anders' ? `Live-Pruefung: anders (veroeffentlicht: ${r.text})`
      : `Live-Pruefung: nicht erreichbar (${r.grund})`);
    if (r.ergebnis !== 'gleich') process.exitCode = 2;
    return;
  }

  let zugang = null;
  if (!s.passwort) {
    const g = await ablage.lesen(salt, ITERATIONEN);
    if (g.roh) {
      zugang = { schluesselRoh: g.roh };
      console.log('Gemerkter Schluessel gefunden - kein Passwort noetig.');
    } else if (g.unbrauchbar) {
      console.log(`Gemerkter Schluessel unbrauchbar (${g.unbrauchbar}) - Passwort noetig.`);
    }
  }

  if (zugang && !s.ohneAbgleich) {
    const a = await mitVeroeffentlichterPruefen(zugang.schluesselRoh);
    if (a.ergebnis === 'passt-nicht') {
      throw new Error('Der gemerkte Schluessel oeffnet die veroeffentlichte Seite nicht. Nichts geschrieben.\n' +
        'Wahrscheinlich wurde das Passwort geaendert. Neu eingeben mit: node werkzeug/verschluesseln.mjs --passwort');
    }
    console.log(a.ergebnis === 'passt'
      ? 'Abgleich: Der Schluessel oeffnet die veroeffentlichte Seite - Geraete bleiben angemeldet.'
      : `Abgleich nicht moeglich (${a.grund}) - weiter ohne.`);
  }

  const passwort = zugang ? null : await passwortAbfragen();
  if (passwort && !s.ohneAbgleich) {
    const a = await mitVeroeffentlichterPruefen(await schluesselRoh(await schluesselAusPasswort(passwort, salt)));
    if (a.ergebnis === 'passt-nicht') {
      console.log('ACHTUNG: Dieses Passwort oeffnet die veroeffentlichte Seite NICHT.\n' +
        'Nach dem Hochladen muessen sich alle Geraete mit dem neuen Passwort anmelden.\n' +
        'Wenn das nicht gewollt ist: jetzt mit Strg+C abbrechen (5 Sekunden).');
      await new Promise((r) => setTimeout(r, 5000));
    } else if (a.ergebnis === 'passt') {
      console.log('Abgleich: Das Passwort oeffnet die veroeffentlichte Seite.');
    }
  }

  console.log('\nVerschluessele und pruefe ...');
  const r = await distBauen(zugang || passwort, s.ziel ? { ziel: s.ziel } : {});

  if (passwort) {
    const ort = await ablage.speichern(r.schluesselRoh, r.salt, ITERATIONEN);
    console.log(`\nSchluessel gemerkt (nicht das Passwort): ${ort}`);
    console.log('Ab jetzt laeuft das Skript ohne Passwort. Vergessen mit: --vergessen');
  }

  console.log('\nFertig. Pruefungen bestanden:');
  console.log('  - keine verbotenen Woerter im oeffentlichen Teil');
  console.log('  - Probe-Entschluesselung ergibt die App Byte fuer Byte');
  console.log(`\nOrdner: ${r.ziel}`);
  for (const d of r.dateien) console.log(`  ${d}`);
  console.log(`\nApp ${r.appBytes} Bytes, verschluesselte Seite ${r.huelleBytes} Bytes.`);
  console.log(`\nVersion ${versionText(r.version)} - ${r.version.hash} - ${r.version.date}`);
  console.log(r.konten ? `Anmeldung: an (${r.konten} Konten aus werkzeug/konten.json)` : 'Anmeldung: aus (keine werkzeug/konten.json)');
  if (r.version.draft) {
    console.log('ACHTUNG: Es gibt nicht eingecheckte Aenderungen (Version mit "-entwurf"). Diesen Stand NICHT veroeffentlichen.');
  }
  console.log('\nNaechster Schritt: den Inhalt von dist/ ins Repo bis-school-app hochladen (Commit-Nachricht mit ' + versionText(r.version) + ').');
  console.log('Danach: node werkzeug/verschluesseln.mjs --live-pruefen');
}

main().catch((e) => {
  console.error('\nFEHLER: ' + e.message);
  process.exit(1);
});
