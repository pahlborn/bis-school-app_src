// Modul passwort ohne Browser (vorher im Browser in tests/stufe1-p3.test.mjs): Passwortregeln K7.
//   node --test tests/module/passwort.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PW_WORDS, PW_BASES, pwSuggest, pwWeak } from '../../src/module/passwort.mjs';

// typical weak passwords of 12+ characters (common words with digits, sequences, keyboard rows, repeats, the name)
const SCHWACH = [
  ...['password', 'passwort', 'qwerty', 'qwertz', 'iloveyou', 'letmein', 'welcome', 'monkey', 'dragon', 'football', 'fussball', 'baseball', 'superman', 'starwars', 'princess', 'sunshine', 'admin', 'hallo', 'geheim', 'schatz', 'master', 'shadow', 'freedom', 'pokemon', 'minecraft']
    .flatMap((b) => [b + '1234567890'.slice(0, Math.max(2, 12 - b.length)), b[0].toUpperCase() + b.slice(1) + '!2026'.padEnd(Math.max(5, 12 - b.length), '9')]),
  '123456789012', '098765432109', 'abcdefghijkl', 'qwertyuiopas', 'asdfghjklzxc', '1qaz2wsx3edc', 'aaaaaaaaaaaa', '121212121212', 'abcabcabcabc', '111122223333',
  'mia123456789', 'Mia-2026-2026!', 'passwordpassword', 'zyxwvutsrqpo', 'qwertzuiopas', '999999999999', 'xyzxyzxyzxyz', 'hallohallo12', 'abc123abc123', 'ababababababab',
  'kurz', 'Mond', 'sonne123', 'Tiger-12', 'elf-zeichen', 'kathie2018!', 'Kathie123456', 'Kathie-123456', 'mia', '', 'a1b2c3d4e5f6',
];
const cap = (x) => x[0].toUpperCase() + x.slice(1);

test('typische schwache Passwoerter werden abgelehnt (K7)', () => {
  assert.ok(SCHWACH.length >= 70, 'enough samples: ' + SCHWACH.length);
  assert.deepEqual(SCHWACH.filter((p) => !pwWeak(p, 'mia')), [], 'weak passwords that got through');
  assert.ok(PW_BASES.includes('password'));
});

test('gute lange Passphrasen werden angenommen', () => {
  assert.deepEqual(['Elefant-Rakete-Wolke-77', 'Mein Hund heißt Bello!', 'Kathie liebt Pferde 3x'].filter((p) => pwWeak(p, 'mia')), []);
});

test('10 000 Merkpasswoerter: alle stark, verschieden, richtige Form, mind. 40 Bit', () => {
  const sugg = Array.from({ length: 10000 }, () => pwSuggest());
  assert.deepEqual(sugg.filter((p) => pwWeak(p, 'mia')).slice(0, 5), []);
  assert.ok(new Set(sugg).size >= 9990, 'suggestions differ');
  assert.ok(sugg.every((p) => /^[A-Z][a-z]+-[A-Z][a-z]+-[A-Z][a-z]+-\d{4}$/.test(p)));
  const n = new Set(PW_WORDS).size;
  assert.ok(n >= 600);
  assert.ok(3 * Math.log2(n) + Math.log2(10000) >= 40, 'at least 40 bits');
});

test('Vorschlaege aus den kuerzesten Woertern gelten als stark (Fund 02.11.: Jam-Ox-Cup-3571)', () => {
  assert.equal(pwWeak('Jam-Ox-Cup-3571', 'mia'), false);
  const kurz = [...new Set(PW_WORDS)].sort((a, b) => a.length - b.length).slice(0, 25), schlecht = [];
  for (const a of kurz) for (const b of kurz) for (const c of kurz) for (const z of ['0000', '3571', '9999']) { const p = `${cap(a)}-${cap(b)}-${cap(c)}-${z}`; if (pwWeak(p, 'mia')) schlecht.push(p); }
  assert.deepEqual(schlecht.slice(0, 5), [], 'weak by mistake: ' + schlecht.length);
});

test('Zufall ist uebergebbar: feste Werte ergeben einen festen Vorschlag', () => {
  const fest = () => new Uint32Array([0, 1, 2, 4271]);
  assert.equal(pwSuggest(fest), `${cap(PW_WORDS[0])}-${cap(PW_WORDS[1])}-${cap(PW_WORDS[2])}-4271`);
});

test('jedes Wort der Liste ist Kleinbuchstaben a-z und kommt nur einmal vor', () => {
  assert.deepEqual(PW_WORDS.filter((w) => !/^[a-z]+$/.test(w)), []);
  assert.equal(new Set(PW_WORDS).size, PW_WORDS.length);
});
