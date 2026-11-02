// Modul geschichten ohne Browser (A5, Peter 02.11.): jedes Mal eine neue Pisolala-Geschichte, passend zum Anlass.
//   node --test tests/module/geschichten.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STORY_LIST, storyNext, storyMarkRead, storiesUsable } from '../../src/module/geschichten.mjs';

const g = (id, occasion, extra = {}) => ({ id, occasion, approved: true, title: { en: id, de: id }, en: { 1: id + ' en' }, de: { 1: id + ' de' }, ...extra });
const VORRAT = [g('a'), g('b'), g('c'), g('hw', 'halloween'), g('adv1', 'advent'), g('adv2', 'advent'), g('xmas', 'christmas'), g('bday', 'birthday'),
  g('neu', undefined, { approved: false }), g('spannend', undefined, { en: { 3: 'x' }, de: { 3: 'x' } })];
const ctx = (o = {}) => ({ lang: 'en', cap: 2, theme: null, birthday: false, read: [], ...o });
const lesen = (n, o) => { let read = []; const out = []; for (let i = 0; i < n; i++) { const s = storyNext(VORRAT, ctx({ ...o, read })); out.push(s.id); read = storyMarkRead(read, s.id); } return out; };

test('jede Geschichte im Vorrat: freigegeben nur mit en und de, Pisolala ohne Aussehen, bekannter Anlass', () => {
  for (const s of STORY_LIST) {
    assert.ok(s.id && s.title && s.title.en && s.title.de, s.id);
    assert.ok(!s.occasion || ['halloween', 'advent', 'christmas', 'birthday'].includes(s.occasion), s.id);
    if (!s.approved) continue;
    assert.ok(s.en[1] && s.de[1], 'Stufe 1 (cozy) in beiden Sprachen: ' + s.id);
    for (const t of [...Object.values(s.en), ...Object.values(s.de)])
      for (const w of ['Ohren', 'Augen', 'Fell', 'groß wie', 'aussah', 'ears', 'eyes', 'fur ', 'as big as', 'looked like']) assert.ok(!t.includes(w), 'Pisolala bleibt unsichtbar: ' + s.id + ' ' + w);
  }
});

test('normaler Tag: nur Geschichten ohne Anlass, jede neu, in Reihenfolge; nicht freigegebene und zu spannende nie', () => {
  assert.deepEqual(lesen(3), ['a', 'b', 'c']);
  assert.deepEqual(storiesUsable(VORRAT, 'en', 2).map((s) => s.id).includes('neu'), false);
  assert.deepEqual(storiesUsable(VORRAT, 'en', 2).map((s) => s.id).includes('spannend'), false);
  assert.ok(storiesUsable(VORRAT, 'en', 3).some((s) => s.id === 'spannend'));
});

test('alle gelesen: die am laengsten nicht gelesene kommt wieder, Anlass-Geschichten nur in ihrer Zeit', () => {
  const r = lesen(6);
  assert.deepEqual(r, ['a', 'b', 'c', 'a', 'b', 'c']);
  assert.ok(!r.some((id) => ['hw', 'adv1', 'xmas', 'bday'].includes(id)));
});

test('Mottozeit: erst die ungelesenen Geschichten des Mottos, dann wieder normale', () => {
  assert.deepEqual(lesen(4, { theme: 'advent' }), ['adv1', 'adv2', 'a', 'b']);
  assert.deepEqual(lesen(2, { theme: 'halloween' }), ['hw', 'a']);
  assert.deepEqual(lesen(2, { theme: 'christmas' }), ['xmas', 'a']);
});

test('Geburtstag: zuerst die Geburtstagsgeschichte, auch in einer Mottozeit', () => {
  assert.deepEqual(lesen(3, { birthday: true, theme: 'advent' }), ['bday', 'adv1', 'adv2']);
  assert.equal(storyNext(VORRAT, ctx({ read: ['a', 'b', 'c'] })).id, 'a', 'kein Geburtstag: keine Geburtstagsgeschichte');
});

test('nur eine Anlass-Geschichte im Vorrat: sie kommt auch ausserhalb ihrer Zeit (besser als keine)', () => {
  assert.equal(storyNext([g('hw', 'halloween')], ctx()).id, 'hw');
  assert.equal(storyNext([], ctx()), null);
  assert.equal(storyNext([g('neu', undefined, { approved: false })], ctx()), null);
});

test('Deutsch: dieselbe Auswahl, wenn es die deutsche Fassung gibt', () => {
  assert.equal(storyNext(VORRAT, ctx({ lang: 'de' })).id, 'a');
  assert.equal(storyNext([{ ...g('x'), de: undefined }], ctx({ lang: 'de' })), null);
});

test('storyMarkRead: gelesene ans Ende, keine Doppelten', () => {
  assert.deepEqual(storyMarkRead(['a', 'b'], 'a'), ['b', 'a']);
  assert.deepEqual(storyMarkRead(null, 'a'), ['a']);
});
