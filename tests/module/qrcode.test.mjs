// Modul qrcode (Aufgabe "Einladungen - Oberflaeche"): QR-Code der Startlinks ohne fremde Bibliothek.
// Referenz: dieselben Matrizen erzeugt die npm-Bibliothek qrcode@1.5.4 (werkzeug/node_modules, nicht im Repo) mit
// gleicher Version, Fehlerkorrektur und Maske - die Pruefsummen unten stammen von ihr (Skript qr-referenz.mjs, Pruefbericht).
// Bei der Umsetzung verglichen: 288 von 288 Matrizen gleich (Versionen 1-36, L und M, alle 8 Masken, UTF-8).
//   node --test tests/module/qrcode.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { qrMatrix, qrSvg, QR_STUFEN } from '../../src/module/qrcode.mjs';
import { appLesen } from '../../werkzeug/module.mjs';

const LINK = 'https://pahlborn.github.io/bis-school-app-test/#start=kathie.mueller/Ab3_-xY9Ab3_-xY9Ab3_-x/tiger-lamp-river-apple-stone-cloud';
const REFERENZ = [
  [LINK, 'M', 8, 3, 49, '71cf3800536fafbd4f36291365730b8e'],
  [LINK, 'L', 6, 6, 41, 'd1ebd51a99bb3c215f9eaadc0c767135'],
  ['Hallo Welt', 'M', 1, 2, 21, '5a9a60a4acdb29046d4622004a19df49'],
  ['a', 'L', 1, 0, 21, 'da092632470a33a1d9f54ecfd976fe82'],
  ['\u00e4\u00f6\u00fc\u20ac \u2013 \ud83d\ude00'.repeat(20), 'M', 14, 5, 73, '313a1e77b3a614f8a68c8e9ebb030f0d'],
  ['x'.repeat(300), 'L', 11, 7, 61, 'b0c499ac9f022625ad8b154d05b7b234'],
  ['y'.repeat(1200), 'M', 29, 1, 133, '0880d978486d7fbc6ec447ccd58e1b47'],
  [LINK + LINK, 'M', 12, 4, 65, 'd8ba759d342f40e0266ede213cd92852'],
];
const pruefsumme = (q) => createHash('sha256').update(q.zeilen.map((z) => z.join('')).join('\n') + '\n').digest('hex').slice(0, 32);

test('gleiche Matrix wie die Referenzbibliothek (Version, Fehlerkorrektur, Maske fest)', () => {
  for (const [text, ecc, version, mask, size, summe] of REFERENZ) {
    const q = qrMatrix(text, { ecc, version, mask });
    assert.equal(q.size, size, text.slice(0, 20));
    assert.equal(pruefsumme(q), summe, `${ecc} v${version} Maske ${mask}`);
  }
});

test('ohne Vorgabe: kleinste passende Version, gueltige Maske; Suchmuster, Taktlinien und dunkles Modul an ihrem Platz', () => {
  const q = qrMatrix(LINK);
  assert.equal(q.version, 8, 'Startlink mit Fingerabdruck: Version 8 (49 x 49) bei Fehlerkorrektur M');
  assert.ok(q.mask >= 0 && q.mask <= 7);
  const n = q.size;
  for (const [ox, oy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      const rand = x === 0 || y === 0 || x === 6 || y === 6, kern = x >= 2 && x <= 4 && y >= 2 && y <= 4;
      assert.equal(q.dunkel(ox + x, oy + y), rand || kern, `Suchmuster ${ox},${oy} bei ${x},${y}`);
    }
  }
  for (let i = 8; i < n - 8; i++) { assert.equal(q.dunkel(i, 6), i % 2 === 0); assert.equal(q.dunkel(6, i), i % 2 === 0); }
  assert.equal(q.dunkel(8, n - 8), true, 'dunkles Modul');
  // Formatinformation lesbar: Fehlerkorrektur M (00) und die Maske
  let bits = 0;
  for (let i = 0; i <= 5; i++) bits |= (q.dunkel(8, i) ? 1 : 0) << i;
  bits |= (q.dunkel(8, 7) ? 1 : 0) << 6; bits |= (q.dunkel(8, 8) ? 1 : 0) << 7; bits |= (q.dunkel(7, 8) ? 1 : 0) << 8;
  for (let i = 9; i < 15; i++) bits |= (q.dunkel(14 - i, 8) ? 1 : 0) << i;
  const daten = (bits ^ 0x5412) >>> 10;
  assert.equal(daten >>> 3, 0, 'Fehlerkorrektur M');
  assert.equal(daten & 7, q.mask, 'Maske');
  // kurze Texte: Version 1; L passt mehr als M
  assert.equal(qrMatrix('kurz').version, 1);
  assert.ok(qrMatrix('z'.repeat(150), { ecc: 'L' }).version < qrMatrix('z'.repeat(150), { ecc: 'M' }).version);
  assert.deepEqual([...QR_STUFEN], ['L', 'M']);
});

test('Fehler: kein Text, unbekannte Stufe, Maske, zu lang', () => {
  assert.throws(() => qrMatrix(42), /Text erwartet/);
  assert.throws(() => qrMatrix('a', { ecc: 'H' }), /L oder M/);
  assert.throws(() => qrMatrix('a', { mask: 8 }), /Maske/);
  assert.throws(() => qrMatrix('a'.repeat(100), { version: 1 }), /zu lang/);
  assert.throws(() => qrMatrix('a'.repeat(3000)), /zu lang/);
});

test('SVG: ein Pfad, Ruhezone, schwarz auf weiss, Titel ohne HTML', () => {
  const s = qrSvg(LINK, { titel: 'Start <QR> "Code"' });
  const q = qrMatrix(LINK), n = q.size + 8;
  assert.ok(s.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '"'));
  assert.ok(s.includes('aria-label="Start &lt;QR&gt; &quot;Code&quot;"'));
  assert.equal((s.match(/<path /g) || []).length, 1);
  const d = /d="([^"]*)"/.exec(s)[1], felder = d.match(/M\d+ \d+h1v1h-1z/g);
  assert.equal(felder.length, q.zeilen.flat().filter(Boolean).length, 'je dunkles Modul ein Quadrat');
  assert.ok(felder.every((f) => { const [x, y] = f.slice(1).split(/[ h]/).map(Number); return x >= 4 && y >= 4 && q.dunkel(x - 4, y - 4); }), 'Ruhezone 4 Module');
});

test('nur im Testbau', () => {
  assert.equal(appLesen('utf8', { bauart: 'live' }).includes('function qrMatrix('), false);
  assert.equal(appLesen('utf8', { bauart: 'test' }).includes('function qrMatrix('), true);
});
