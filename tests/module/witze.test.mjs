// Modul witze ohne Browser (A3, Peter 02.11.): ein Witz pro Runde, Englisch fuer Kinder, keine Wiederholung.
//   node --test tests/module/witze.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOKE_LIST, jokesFor, jokeNext, jokeForDoor } from '../../src/module/witze.mjs';

const zufall = (seed = 1) => { let s = seed; return (n) => { s = (s * 1103515245 + 12345) % 2147483648; return s % n; }; };
const DEUTSCH = /[äöüßÄÖÜ]|\b(der|das|und|ist|ein|eine|einen|nicht|wie|warum|weil|sagt|macht|man|nennt|liebsten)\b/i;

test('jeder Witz hat eine eindeutige id, Frage, Antwort, Sprache und hoechstens ein bekanntes Motto', () => {
  const ids = new Set();
  for (const j of JOKE_LIST) {
    assert.ok(j.id && !ids.has(j.id), 'id: ' + j.id); ids.add(j.id);
    assert.ok(j.q && j.a, j.id); assert.ok(['en', 'de'].includes(j.lang), j.id);
    assert.ok(!j.theme || ['halloween', 'advent', 'christmas'].includes(j.theme), j.id);
  }
});

test('englische Witze sind englisch, deutsche deutsch (Kindersprache Englisch)', () => {
  for (const j of JOKE_LIST.filter((x) => x.lang === 'en')) assert.ok(!DEUTSCH.test(j.q + ' ' + j.a), 'Deutsch im englischen Witz: ' + j.id);
  for (const j of JOKE_LIST.filter((x) => x.lang === 'de')) assert.ok(DEUTSCH.test(j.q + ' ' + j.a), 'nicht deutsch: ' + j.id);
});

test('jokesFor: nur die Sprache, ohne Motto oder mit dem aktuellen Motto', () => {
  const en = jokesFor('en', null);
  assert.ok(en.length >= 10 && en.every((j) => j.lang === 'en' && !j.theme));
  const hw = jokesFor('en', 'halloween');
  assert.ok(hw.some((j) => j.theme === 'halloween') && hw.every((j) => !j.theme || j.theme === 'halloween'));
  assert.ok(jokesFor('de', null).every((j) => j.lang === 'de'));
});

test('jokeNext: keine Wiederholung, bis alle gezeigt sind; danach neu, aber nicht derselbe wie zuletzt', () => {
  const rnd = zufall(7), pool = jokesFor('en', null);
  let seen = [];
  const reihe = [];
  for (let i = 0; i < pool.length; i++) { const r = jokeNext('en', null, seen, rnd); seen = r.seen; reihe.push(r.joke.id); }
  assert.equal(new Set(reihe).size, pool.length, 'alle verschieden');
  const r = jokeNext('en', null, seen, rnd);
  assert.notEqual(r.joke.id, reihe[reihe.length - 1], 'nicht derselbe wie zuletzt');
  assert.deepEqual(r.seen, [r.joke.id], 'Runde beginnt von vorn');
});

test('jokeNext: in der Mottozeit kommen zuerst die Motto-Witze', () => {
  const rnd = zufall(3);
  let seen = [];
  const n = jokesFor('en', 'advent').filter((j) => j.theme === 'advent').length;
  for (let i = 0; i < n; i++) { const r = jokeNext('en', 'advent', seen, rnd); seen = r.seen; assert.equal(r.joke.theme, 'advent'); }
  assert.equal(jokeNext('en', 'advent', seen, rnd).joke.theme, undefined);
});

test('jokeNext: gesehene Witze der anderen Sprache bleiben gemerkt', () => {
  const de = jokesFor('de', null).map((j) => j.id);
  const voll = jokesFor('en', null).map((j) => j.id);
  const r = jokeNext('en', null, de.concat(voll), zufall(5));
  for (const id of de) assert.ok(r.seen.includes(id));
});

test('jokeForDoor: hinter jeder Tuer immer derselbe englische Witz', () => {
  for (let n = 1; n <= 24; n++) { const j = jokeForDoor(n); assert.equal(j.lang, 'en'); assert.deepEqual(jokeForDoor(n), j); }
});
