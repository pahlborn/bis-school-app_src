// Prueft einen Bereich (Pruefstufen A und B aus "Module und Tests – Konzept"):
//   npm run test:bereich -- rechte passwort
// startet die Modultests (ohne Browser) und danach nur die Browser-Tests, die module.json dem Modul zuordnet.
// Ohne Angabe: alle Modultests. Die volle Reihe (npm test) bleibt vor jedem Merge Pflicht.

import { spawnSync } from 'node:child_process';
import { modulListe } from './module.mjs';

const namen = process.argv.slice(2);
const alle = modulListe('test');
const unbekannt = namen.filter((n) => !alle.some((m) => m.name === n));
if (unbekannt.length) { console.error('Unbekanntes Modul: ' + unbekannt.join(', ') + '\nBekannt: ' + alle.map((m) => m.name).join(', ')); process.exit(2); }

const lauf = (titel, dateien) => {
  if (!dateien.length) return 0;
  console.log(`\n== ${titel}: ${dateien.join(' ')}`);
  return spawnSync(process.execPath, ['--test', '--test-concurrency=3', ...dateien], { stdio: 'inherit' }).status;
};
const modulTests = namen.length ? namen.map((n) => `tests/module/${n}.test.mjs`) : ['tests/module/*.test.mjs'];
let status = lauf('Modultests (ohne Browser)', [...modulTests, 'tests/module/rahmen.test.mjs'].filter((x, i, a) => a.indexOf(x) === i));
if (status === 0 && namen.length) {
  const browser = [...new Set(alle.filter((m) => namen.includes(m.name)).flatMap((m) => m.browserTests || []))].map((t) => `tests/${t}.test.mjs`);
  status = lauf('Browser-Tests des Bereichs', browser);
}
process.exit(status ?? 1);
