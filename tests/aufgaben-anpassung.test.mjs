// Anpassung der Runden ohne Browser (Aufgabe "Tests schneller", 04.11.; bisher lernlogik.test.mjs, im Browser direkt
// gerechnet). Eigene Datei, weil sie am laengsten rechnet: so laeuft sie in der vollen Reihe neben den anderen.
// Das unveraenderte App-Skript laeuft in der Sandbox (tests/app-sandbox.mjs); BQ_SEED=… steht in der Ausgabe.
//   node --test tests/aufgaben-anpassung.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appSandbox } from './app-sandbox.mjs';

const pad = (n) => String(n).padStart(2, '0');
const tag = (minus) => { const d = new Date(); d.setDate(d.getDate() - minus); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
/** n Antworten auf Stufe `stufe`, verteilt auf die letzten `tage` Tage; die ersten `richtig` davon richtig. */
const belege = (n, stufe, richtig, tage) => Array.from({ length: n }, (_, i) => [tag(i % tage), stufe, i < richtig ? 1 : 0]);

// Fund 02.11. (Aufgabe 2b): adaptRound suchte nur in einem kleinen Vorrat und gab still auf - etwa 1 von 140 Runden
// hatte bei "hakt es noch" zu wenig Aufgaben mit Hilfe. Hier direkt und oft: jede Quest, viele Runden.
test('Anpassung haelt die Vorgaben in jeder Quest zuverlaessig ein (viele Runden, direkt gerechnet, Node)', (t) => {
  const S = appSandbox(); t.diagnostic('BQ_SEED=' + S.seed);
  const WORLDS = S.holen('WORLDS'), adaptRound = S.holen('adaptRound'), levelOf = S.holen('levelOf');
  const quests = Object.keys(WORLDS).filter((k) => k !== 'today' && !k.startsWith('mix_') && typeof WORLDS[k].build === 'function');
  const fehl = [];
  for (const k of quests) {
    const angebot = new Set(); for (let i = 0; i < 12; i++) WORLDS[k].build().forEach((q) => angebot.add(levelOf(q)));
    for (const [stand, ev] of [['RS', belege(10, 2, 2, 3)], ['M', belege(10, 2, 10, 3)]]) {
      S.setzen('bq2_ev', { [k]: ev });
      // 800 rounds for "shaky": the old fault (about 1 in 140 rounds) is then missed in fewer than 1 in 250 runs
      S.lauf(() => {
        for (let n = 0; n < (stand === 'RS' ? 800 : 250); n++) {
          const rd = adaptRound(k, WORLDS[k].build()), c = (l) => rd.filter((q) => levelOf(q) === l).length;
          if (stand === 'RS' && (angebot.has(1) || angebot.has(2)) && c(3) > 0) { fehl.push(`${k} RS: ${c(3)} Herausforderungen`); break; }
          if (stand === 'RS' && angebot.has(1) && c(1) < 2) { fehl.push(`${k} RS: nur ${c(1)} mit Hilfe`); break; }
          if (stand === 'M' && angebot.has(3) && c(3) < 2) { fehl.push(`${k} M: nur ${c(3)} Herausforderungen`); break; }
          if (rd.length !== 8) { fehl.push(`${k} ${stand}: ${rd.length} Aufgaben`); break; }
        }
      }, 60000);
    }
  }
  assert.ok(quests.length >= 10, 'quests checked: ' + quests.length);
  assert.deepEqual(fehl, []);
});
