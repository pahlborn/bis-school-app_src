// Modul textfragen ohne Browser (A7, A8; Peter 02.11.): die richtige Antwort ist nicht an der Laenge erkennbar,
// falsche Antworten sind fast richtig, jede Bank hat alle drei Stufen.
//   node --test tests/module/textfragen.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../../src/module/textfragen.mjs';

const ohneTags = (t) => String(t).replace(/<[^>]+>/g, '');
const len = (t) => ohneTags(t).length;
const schnitt = (a) => a.reduce((s, x) => s + x, 0) / a.length;

// Grenzen (Konzept A7): bei vier Antworten ist die laengste hoechstens in etwa 40 % der Fragen die richtige
// (Zufall waere 25 %); dasselbe fuer die kuerzeste, sonst waere "die kuerzeste" der neue Trick.
const MAX_ANTEIL = 0.4;
// je Frage: die richtige Antwort ist hoechstens 20 % laenger oder kuerzer als der Schnitt der falschen
const MAX_ABWEICHUNG = 0.2;

/** MC-Banken des Moduls: [Name, Eintraege] - A7 HYPO, A8 OPINION_MC und OREO_MC. */
const banken = () => ['HYPO', 'OPINION_MC', 'OREO_MC'].map((n) => [n, T[n]]);

/** "Opinion or fact?" wie die App sie stellt: je Satz einer Seite als richtige Antwort, die drei der anderen als falsche. */
const meinungFakt = () => T.OPFACT.flatMap((s) => [[s.op, s.fact], [s.fact, s.op]].flatMap(([r, w]) => r.map((x) => ({ stufe: s.level, r: x, w }))));

test('Bank-Eintraege sind vollstaendig: Frage, richtige Antwort, falsche Antworten, Erklaerung, Stufe 1-3', () => {
  for (const [name, bank] of banken()) for (const r of bank) {
    const wo = `${name}: ${ohneTags(r[0]).slice(0, 50)}`;
    assert.equal(r.length, 5, wo);
    assert.ok(r[0] && r[1] && r[3], wo);
    assert.ok(Array.isArray(r[2]) && r[2].length >= 2, wo);
    assert.ok(!r[2].includes(r[1]) && new Set(r[2]).size === r[2].length, 'doppelte Antwort: ' + wo);
    assert.ok([1, 2, 3].includes(r[4]), 'Stufe: ' + wo);
  }
});

test('jede Bank hat alle drei Stufen, je mindestens zwei Fragen (damit die Anpassung tauschen kann)', () => {
  for (const [name, bank] of banken()) for (const l of [1, 2, 3]) {
    assert.ok(bank.filter((r) => r[4] === l).length >= 2, `${name}: Stufe ${l} fehlt`);
  }
  for (const l of [1, 2, 3]) assert.ok(T.SPECIFIC.filter((r) => r[3] === l).length >= 2, `SPECIFIC: Stufe ${l} fehlt`);
});

test('Laengenpruefung: die laengste (oder kuerzeste) Antwort ist hoechstens in 40 % der Fragen die richtige', () => {
  for (const [name, bank] of banken()) {
    const laengste = bank.filter((r) => len(r[1]) > Math.max(...r[2].map(len))).length;
    const kuerzeste = bank.filter((r) => len(r[1]) < Math.min(...r[2].map(len))).length;
    assert.ok(laengste / bank.length <= MAX_ANTEIL, `${name}: laengste richtig in ${laengste}/${bank.length}`);
    assert.ok(kuerzeste / bank.length <= MAX_ANTEIL, `${name}: kuerzeste richtig in ${kuerzeste}/${bank.length}`);
  }
});

test('Laengenpruefung je Frage: die richtige Antwort ist nicht deutlich laenger oder kuerzer als die falschen', () => {
  const zuWeit = [];
  for (const [name, bank] of banken()) for (const r of bank) {
    const q = len(r[1]) / schnitt(r[2].map(len));
    if (Math.abs(q - 1) > MAX_ABWEICHUNG) zuWeit.push(`${name}: ${q.toFixed(2)} ${ohneTags(r[0]).slice(0, 50)}`);
  }
  assert.deepEqual(zuWeit, []);
});

test('Specific Examples: beide Beispiele etwa gleich lang, das genaue ist nicht immer das laengere', () => {
  let laenger = 0;
  for (const [grund, genau, vage, stufe] of T.SPECIFIC) {
    assert.ok(grund && genau && vage && genau !== vage, grund);
    const q = genau.length / vage.length;
    assert.ok(Math.abs(q - 1) <= MAX_ABWEICHUNG, `${grund}: genau ${genau.length}, vage ${vage.length}`);
    if (genau.length > vage.length) laenger++;
    assert.ok(T.SPECIFIC_EXPLAIN[stufe], 'Erklaerung fuer Stufe ' + stufe);
  }
  const anteil = laenger / T.SPECIFIC.length;
  assert.ok(anteil >= 0.3 && anteil <= 0.7, `genaues Beispiel laenger in ${laenger}/${T.SPECIFIC.length}`);
});

test('Opinion or fact: drei Meinungen, drei Fakten je Satz, alle Stufen, Laenge verraet nichts', () => {
  for (const s of T.OPFACT) {
    assert.equal(s.op.length, 3); assert.equal(s.fact.length, 3);
    assert.ok([1, 2, 3].includes(s.level));
    assert.equal(new Set([...s.op, ...s.fact]).size, 6);
  }
  for (const l of [1, 2, 3]) assert.ok(T.OPFACT.some((s) => s.level === l), `OPFACT: Stufe ${l} fehlt`);
  const fragen = meinungFakt();
  const laengste = fragen.filter((f) => f.r.length > Math.max(...f.w.map((x) => x.length))).length;
  const kuerzeste = fragen.filter((f) => f.r.length < Math.min(...f.w.map((x) => x.length))).length;
  assert.ok(laengste / fragen.length <= MAX_ANTEIL, `laengste richtig in ${laengste}/${fragen.length}`);
  assert.ok(kuerzeste / fragen.length <= MAX_ANTEIL, `kuerzeste richtig in ${kuerzeste}/${fragen.length}`);
  const zuWeit = fragen.filter((f) => Math.abs(f.r.length / schnitt(f.w.map((x) => x.length)) - 1) > MAX_ABWEICHUNG).map((f) => f.r);
  assert.deepEqual(zuWeit, []);
});

test('alte Scherz-Antworten sind weg (Praxistest 02.11.)', () => {
  const alles = JSON.stringify(T);
  for (const s of ['The car will be happy.', 'Carpet is my favourite.', 'The ramp is pretty.', 'Something will happen.', 'I like the park.', 'Reading is nice.',
    'The park has a pond.', 'Dogs bark.', 'I have new shoes.', 'The end.', 'Orange', 'Rocket', 'Ice cream is cold.'])
    assert.ok(!alles.includes(`"${s}"`), s);
});
