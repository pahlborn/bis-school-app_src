// Modul anmeldung (Stufe 3b, Aufgabe "Anmeldung im Testbau"): Startlink, Eintrag im Passwortspeicher, Datei mit dem
// Wiederherstellungscode, Geraeteliste der Konten, Ersetzen einzelner Punkte einer Anleitung. Reine Funktionen, Node.
//   node --test tests/module/anmeldung.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ANM_STARTCODE, ANM_EINTRAG, anmIstStartcode, anmStartlinkLesen, anmStartlink, anmCodeEintrag, anmNameAusEintrag,
  anmCodeDatei, anmEintragAus, anmListe, anmListeMit, anmGeraetKonten, anmPunkteErsetzen
} from '../../src/module/anmeldung.mjs';
import { normAccounts } from '../../src/module/rechte.mjs';
import { pwSuggest } from '../../src/module/passwort.mjs';

const CODE = 'Ab3_-xY9Ab3_-xY9Ab3_-x';                       // 22 Zeichen base64url wie konto.startcodeAusstellen
const FP = 'tiger-lamp-river-owl-cake-moon';

test('Startcode erkennen: 22 Zeichen base64url, sonst Passwort', () => {
  assert.equal(CODE.length, 22);
  assert.equal(anmIstStartcode(CODE), true);
  assert.equal(anmIstStartcode('  ' + CODE + ' '), true, 'Leerzeichen beim Abtippen');
  for (const x of ['Tiger-Lamp-River-427', CODE.slice(1), CODE + 'A', CODE.replace('_', '+'), '', null, 42]) assert.equal(anmIstStartcode(x), false, String(x));
  assert.ok(ANM_STARTCODE.test(CODE));
});

test('Startcode erkennen: kein Passwort-Vorschlag gilt als Startcode, jeder echte Startcode schon (Zufall, viele Laeufe)', () => {
  let lang = 0;
  for (let i = 0; i < 5000; i++) { const p = pwSuggest(); if (p.length === 22) lang++; assert.equal(anmIstStartcode(p), false, p); }
  assert.ok(lang > 200, 'Vorschlaege mit genau 22 Zeichen kommen vor: ' + lang);
  assert.equal(anmIstStartcode('Judo-Anchor-Key-29470'), false);
  const b64url = (u8) => Buffer.from(u8).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  for (let i = 0; i < 5000; i++) { const c = b64url(crypto.getRandomValues(new Uint8Array(16))); assert.equal(anmIstStartcode(c), true, c); }
});

test('Startlink: hin und zurueck, mit und ohne Fingerabdruck; Namen mit Punkt', () => {
  const l = anmStartlink('https://example.org/app/?x=1#alt', { anmeldename: 'Peter.A', code: CODE });
  assert.equal(l, 'https://example.org/app/?x=1#start=peter.a/' + CODE);
  assert.deepEqual(anmStartlinkLesen(l.slice(l.indexOf('#'))), { anmeldename: 'peter.a', code: CODE, fingerabdruck: null });
  const f = anmStartlink('https://example.org/', { anmeldename: 'kathie.b', code: CODE, fingerabdruck: FP });
  assert.deepEqual(anmStartlinkLesen(f.slice(f.indexOf('#'))), { anmeldename: 'kathie.b', code: CODE, fingerabdruck: FP });
});

test('Startlink: alles andere ist kein Startlink (null)', () => {
  for (const h of ['', '#', '#start=', '#start=peter.a.' + CODE, '#start=peter.a/' + CODE.slice(2), '#start=pe/' + CODE, '#start=peter.a/' + CODE + '/zu-kurz',
    '#start=peter.a/' + CODE + '/' + FP + '/x', '#start=%E0%A4%A/' + CODE, '#eltern/einstellungen/konten', '#start=peter a/' + CODE, null, undefined])
    assert.equal(anmStartlinkLesen(h), null, String(h));
  assert.throws(() => anmStartlink('x', { anmeldename: 'p', code: CODE }), /ungueltig/);
  assert.throws(() => anmStartlink('x', { anmeldename: 'peter.a', code: 'kurz' }), /ungueltig/);
  assert.throws(() => anmStartlink('x', { anmeldename: 'peter.a', code: CODE, fingerabdruck: 'a-b' }), /Fingerabdruck/);
});

test('Passwortspeicher: eigener Eintrag fuer den Code, zurueck zum Anmeldenamen', () => {
  assert.equal(anmCodeEintrag('peter.a'), 'peter.a (Wiederherstellungscode)');
  assert.equal(anmCodeEintrag('peter.a', 'en'), 'peter.a (recovery code)');
  assert.notEqual(anmCodeEintrag('peter.a'), 'peter.a', 'nie derselbe Eintrag wie die Anmeldung');
  for (const t of ['peter.a (Wiederherstellungscode)', ' Peter.A (recovery code) ', 'peter.a', 'PETER.A (WIEDERHERSTELLUNGSCODE)']) assert.equal(anmNameAusEintrag(t), 'peter.a', t);
  assert.equal(anmNameAusEintrag(undefined), '');
  assert.deepEqual(Object.keys(ANM_EINTRAG), ['de', 'en']);
});

test('Datei mit dem Wiederherstellungscode: Name, Code, Datum, kurze Anleitung; DE und EN', () => {
  const de = anmCodeDatei({ anmeldename: 'peter.a', code: 'ABCD-EFGH-JKMN-PQRS-TUVW', datum: '2026-11-04' });
  assert.equal(de.name, 'Big-Quest-Wiederherstellungscode-peter.a.txt');
  for (const s of ['peter.a', 'ABCD-EFGH-JKMN-PQRS-TUVW', '2026-11-04', 'Passwort vergessen?', 'nicht weitergeben']) assert.ok(de.text.includes(s), s);
  const en = anmCodeDatei({ anmeldename: 'peter.a', code: 'ABCD-EFGH-JKMN-PQRS-TUVW', datum: '2026-11-04', sprache: 'en' });
  assert.equal(en.name, 'Big-Quest-recovery-code-peter.a.txt');
  assert.ok(en.text.includes('Forgot your password?') && en.text.includes('ABCD-EFGH-JKMN-PQRS-TUVW'));
  assert.ok(/^[\x20-\x7e\n]+$/.test(de.text + de.name + en.text + en.name), 'nur ASCII (jede Dateiablage)');
  assert.throws(() => anmCodeDatei({ anmeldename: 'x', code: 'A' }), /fehlt/);
});

test('Geraeteliste: nur gueltige Eintraege, je Kennung und Name einer; daraus Konten v2 wie konten.json', () => {
  const l = anmListe([
    { id: 'p_A1', user: 'kathie.a', art: 'child' }, { id: 'p_B2', user: 'peter.a', art: 'parent' },
    { id: 'p_C3', user: 'Lehrer', art: 'teacher' }, { id: 'x', user: 'anna.a', art: 'parent' }, { id: 'p_D4', user: 'admin', art: 'chef' },
    null, 'p_E5', { id: 'p_A1', user: 'kathie.a', art: 'child' }, { id: 'p_F6', user: 'admin', art: 'admin' }, { id: 'p_G7', user: 'lehrkraft', art: 'teacher' }
  ]);
  assert.deepEqual(l.map((e) => e.id), ['p_B2', 'p_A1', 'p_F6', 'p_G7']);
  assert.deepEqual(anmListe('kaputt'), []);
  const neu = anmListeMit(l, anmEintragAus({ kennung: 'p_H8', anmeldename: 'peter.a', art: 'parent', schluessel: {} }));
  assert.deepEqual(neu.filter((e) => e.user === 'peter.a').map((e) => e.id), ['p_H8'], 'gleicher Name: neuer Eintrag ersetzt den alten');
  const a = normAccounts(anmGeraetKonten(l));
  assert.deepEqual(a.users.map((u) => [u.user, u.role, u.admin, u.kinder.length]), [['peter.a', 'parent', false, 0], ['kathie.a', 'student', false, 0], ['admin', 'parent', true, 0], ['lehrkraft', 'teacher', false, 0]]);
  assert.deepEqual(a.guardians, [], 'Familie kommt mit "Einladungen"');
  assert.ok(a.users.every((u) => !('start' in u) && !('schluessel' in u)), 'keine Startcodes, keine Schluessel');
});

test('Anleitung: Punkte ersetzen, fehlender Punkt ist ein Fehler', () => {
  const t = '<ol><li><b>Anmelden:</b> alt <i>x</i></li><li><b>Sichern:</b> bleibt</li></ol><p><b>Forgot your password?</b> old</p>';
  const neu = anmPunkteErsetzen(t, [['Anmelden:', 'neu'], ['Forgot your password?', 'new']]);
  assert.equal(neu, '<ol><li><b>Anmelden:</b> neu</li><li><b>Sichern:</b> bleibt</li></ol><p><b>Forgot your password?</b> new</p>');
  assert.throws(() => anmPunkteErsetzen(t, [['Gibt es nicht:', 'x']]), /nicht gefunden/);
});
