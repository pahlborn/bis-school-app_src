// Verschluesselt die App mit einem Passwort und legt das Ergebnis in dist/.
//
//   node werkzeug/verschluesseln.mjs
//
// Das Passwort wird verdeckt abgefragt, zweimal. Es wird nirgends
// gespeichert und nie ausgegeben. Ueber eine Pipe oder ein Argument nimmt das
// Skript es absichtlich nicht an - so landet es weder in der Shell-Historie
// noch in einem Protokoll.
//
// Ausgaben nur in ASCII: die Windows-Konsole zeigt Umlaute aus Node sonst
// verstuemmelt an.

import { distBauen } from './bauen.mjs';
import { passwortPruefen, passwortNormal } from './kern.mjs';

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

async function main() {
  if (!process.stdin.isTTY) {
    console.error('Bitte direkt im Terminal starten. Das Passwort wird nur verdeckt abgefragt, nicht ueber eine Pipe.');
    process.exit(2);
  }
  console.log('Big Quest verschluesseln');
  console.log('Passwort: mindestens 20 Zeichen, z. B. vier zufaellige Woerter. Es wird nicht angezeigt.\n');

  const pw1 = await verdecktFragen('Passwort: ');
  passwortPruefen(pw1);
  const pw2 = await verdecktFragen('Passwort wiederholen: ');
  if (passwortNormal(pw1) !== passwortNormal(pw2)) throw new Error('Die beiden Eingaben stimmen nicht ueberein. Nichts geschrieben.');

  console.log('\nVerschluessele und pruefe ...');
  const r = await distBauen(pw1);

  console.log('\nFertig. Pruefungen bestanden:');
  console.log('  - keine verbotenen Woerter im oeffentlichen Teil');
  console.log('  - Probe-Entschluesselung ergibt die App Byte fuer Byte');
  console.log(`\nOrdner: ${r.ziel}`);
  for (const d of r.dateien) console.log(`  ${d}`);
  console.log(`\nApp ${r.appBytes} Bytes, verschluesselte Seite ${r.huelleBytes} Bytes.`);
  console.log('\nNaechster Schritt: den Inhalt von dist/ ins Repo bis-school-app hochladen.');
}

main().catch((e) => {
  console.error('\nFEHLER: ' + e.message);
  process.exit(1);
});
