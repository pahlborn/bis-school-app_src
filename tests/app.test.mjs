// Pruefungen an der App-Datei selbst (ohne Browser).
//   node --test tests/app.test.mjs
//
// Anlass: bis 29.10. war index.html doppelt kodiert - UTF-8 einmal als
// Windows-1252 gelesen und erneut als UTF-8 gespeichert. Auf der Seite stand
// "Ã¼ben" statt "üben", "donâ€™t" statt "don’t", "âˆ’" statt "−".

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { WURZEL, QUELLEN } from '../werkzeug/bauen.mjs';

const roh = await fs.readFile(path.join(WURZEL, QUELLEN.app));

test('index.html ist gueltiges UTF-8', () => {
  new TextDecoder('utf-8', { fatal: true }).decode(roh);
});

test('index.html enthaelt keine doppelt kodierten Zeichen', () => {
  const text = roh.toString('utf8');
  // Typische Folgen doppelter Kodierung: Ã + Folgezeichen (Umlaute), Â + Zeichen
  // (·, ×), â€ (’ ‘ … –), âˆ (−), â† (→), â‰ (≈), âŒ (⌫)
  const muster = /Ã[\u0080-\u00BF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u02C6\u02DC\u2013-\u203A\u20AC\u2122]|Â[\u00A0-\u00BF]|â€|âˆ|â†|â‰|âŒ/g;
  const treffer = text.split('\n')
    .map((z, i) => [i + 1, z.match(muster)])
    .filter(([, m]) => m)
    .map(([n, m]) => `Z. ${n}: ${[...new Set(m)].join(' ')}`);
  assert.deepEqual(treffer, []);
});
