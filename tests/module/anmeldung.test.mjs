// Modul anmeldung (Stufe 3b, Aufgabe "Anmeldung im Testbau"): Startlink, Eintrag im Passwortspeicher, Datei mit dem
// Wiederherstellungscode, Geraeteliste der Konten, Ersetzen einzelner Punkte einer Anleitung. Reine Funktionen, Node.
//   node --test tests/module/anmeldung.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ANM_STARTCODE, ANM_EINTRAG, anmIstStartcode, anmStartlinkLesen, anmStartlink, anmCodeEintrag, anmNameAusEintrag,
  anmCodeDatei, anmEintragAus, anmListe, anmListeMit, anmGeraetKonten, anmPunkteErsetzen,
  anmVerworfen, anmGeraetEntfernt, anmGeraetNeu, anmSpeicherFremd, ANM_VERWORFEN_ZAEHLT, anmEingefuegt
} from '../../src/module/anmeldung.mjs';
import { ABGLEICH_GRUENDE } from '../../src/module/abgleich.mjs';
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

/* ---------- Aufgabe "Einladungen - Oberflaeche" (05.11.) ---------- */
test('anmVersuch: Startcode zu einem bestehenden Konto (neues Passwort eines Kindes) fuehrt zum Passwort-Schritt; falsches Passwort bleibt "anmeldung"', async () => {
  const { lokalerSpeicher } = await import('../../src/module/speicher.mjs');
  const { startcodeAusstellen, ersteAnmeldung } = await import('../../src/module/konto.mjs');
  const { anmVersuch } = await import('../../src/module/anmeldung.mjs');
  const w = lokalerSpeicher(), z = w.geraet('d_T1'), now = Date.now();
  const sa = await startcodeAusstellen({ zugang: z, aussteller: null, anmeldename: 'verwalter', art: 'admin', now });
  await ersteAnmeldung({ zugang: z, code: sa.code, passwort: 'Tiger-Lamp-River-4271', now, runden: 1000 });
  const r = await anmVersuch({ zugang: z, anmeldename: 'verwalter', text: CODE });
  assert.deepEqual(r, { erstesMal: { anmeldename: 'verwalter', code: CODE } }, 'Startcode-Form -> der Code entscheidet');
  await assert.rejects(anmVersuch({ zugang: z, anmeldename: 'verwalter', text: 'Falsches-Passwort-1234' }), (e) => e.code === 'anmeldung');
  await assert.rejects(anmVersuch({ zugang: z, anmeldename: 'verwalter', text: 'Judoka-Anchor-Key-2947' }), (e) => e.code === 'anmeldung', 'Vorschlags-Form mit 22 Zeichen ist nie ein Startcode');
});

test('anmAdminElternEinladen: Admin stellt direkt einen Eltern-Startcode aus; der erste Login klappt', async () => {
  const { lokalerSpeicher } = await import('../../src/module/speicher.mjs');
  const { startcodeAusstellen, ersteAnmeldung } = await import('../../src/module/konto.mjs');
  const { anmAdminElternEinladen, anmVerbindungen } = await import('../../src/module/anmeldung.mjs');
  const w = lokalerSpeicher(), now = Date.now(), m = new Map(), ablage = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } };
  const sa = await startcodeAusstellen({ zugang: w.geraet('d_A'), aussteller: null, anmeldename: 'admin', art: 'admin', now });
  const admin = await ersteAnmeldung({ zugang: w.geraet('d_A'), code: sa.code, passwort: 'Tiger-Lamp-River-4271', now, runden: 1000 });
  ablage.setItem('bq2_evDevice', JSON.stringify('d_A'));
  const e = await anmAdminElternEinladen({ zugang: w.geraet('d_A'), ablage, konto: admin, anmeldename: 'mira.sonnental', anzeigename: 'Mira Sonnental', now: now + 1 });
  assert.equal(e.anmeldename, 'mira.sonnental');
  assert.deepEqual(anmVerbindungen({ ablage, konto: admin, now: now + 1 }).offen.map((o) => [o.name, o.display, o.art]), [['mira.sonnental', 'Mira Sonnental', 'parent']]);
  const p = await ersteAnmeldung({ zugang: w.geraet('d_P'), code: e.code, passwort: 'Otter-Cake-Moss-1234', fingerabdruck: e.fingerabdruck, now: now + 2, runden: 1000 });
  assert.deepEqual([p.art, p.anmeldename], ['parent', 'mira.sonnental']);
  await assert.rejects(anmAdminElternEinladen({ zugang: w.geraet('d_P'), ablage, konto: p, anmeldename: 'anna.sonnental', now: now + 3 }), (err) => err.code === 'nicht-erlaubt');
});

test('anmKindBereit: erst wenn ein Elterngeraet das Kind aufgenommen hat (aktueller Schluessel des Lernbereichs); Erwachsene immer', async () => {
  const { lokalerSpeicher } = await import('../../src/module/speicher.mjs');
  const { startcodeAusstellen, ersteAnmeldung } = await import('../../src/module/konto.mjs');
  const { anmKindBereit, anmKindAnlegen, anmAbgleich } = await import('../../src/module/anmeldung.mjs');
  const w = lokalerSpeicher(), now = () => Date.now();
  const ablage = (d, init = {}) => {
    const m = new Map([['bq2_evDevice', JSON.stringify(d)], ...Object.entries(init)]);
    return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, dump: () => Object.fromEntries(m) };
  };
  const sa = await startcodeAusstellen({ zugang: w.geraet('d_A'), aussteller: null, anmeldename: 'verwalter', art: 'admin', now: now() });
  const admin = await ersteAnmeldung({ zugang: w.geraet('d_A'), code: sa.code, passwort: 'Tiger-Lamp-River-4271', now: now(), runden: 1000 });
  const sp = await startcodeAusstellen({ zugang: w.geraet('d_A'), aussteller: admin, anmeldename: 'peter', art: 'parent', now: now() });
  const P = await ersteAnmeldung({ zugang: w.geraet('d_P'), code: sp.code, passwort: 'Otter-Cake-Moss-1234', now: now(), runden: 1000 });
  const aP = ablage('d_P'), sync = (a, d, k) => anmAbgleich({ ablage: a, zugang: w.geraet(d), konten: [k], now: now(), heute: '2026-11-05' });
  assert.equal(await anmKindBereit({ ablage: aP, zugang: w.geraet('d_P'), konto: P, now: now() }), true, 'Erwachsene: immer');
  await sync(aP, 'd_P', P);
  const qr = await anmKindAnlegen({ zugang: w.geraet('d_P'), ablage: aP, konto: P, anmeldename: 'kathie', anzeigename: 'Kathie', now: now() });
  await sync(aP, 'd_P', P);
  const K = await ersteAnmeldung({ zugang: w.geraet('d_K'), code: qr.code, passwort: 'Puffin-Jam-Lake-9876', fingerabdruck: qr.fingerabdruck, now: now(), runden: 1000 });
  const aK = ablage('d_K');
  await sync(aK, 'd_K', K);
  assert.equal(await anmKindBereit({ ablage: aK, zugang: w.geraet('d_K'), konto: K, now: now() }), false, 'vor der Aufnahme: wartet');
  await sync(aP, 'd_P', P);
  assert.equal(await anmKindBereit({ ablage: aK, zugang: w.geraet('d_K'), konto: K, now: now() }), true, 'nach der Aufnahme: darf ueben');
  const aK2 = ablage('d_K', { bq_abgleich: aK.dump().bq_abgleich });
  assert.equal(await anmKindBereit({ ablage: aK2, zugang: w.geraet('d_K'), konto: K, now: now() }), true, 'spaeterer Start mit gemerktem Anker: kein erneutes Warten');
  const off = w.geraet('d_K'); off.offline();
  assert.equal(await anmKindBereit({ ablage: aK, zugang: off, konto: K, now: now() }), false, 'Speicher weg: (noch) nicht');
});

test('Abgleich in der App: Zahl des nicht Uebernommenen; Geraet entfernt? (nur die eigene Kennung); neu beginnen; fremder Speicher', async () => {
  const m = new Map(), ablage = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } };
  assert.equal(anmVerworfen(ablage), 0);
  m.set('bq_abgleichVerworfen', JSON.stringify([{ grund: 'unterschrift' }, { grund: 'nach-entfernung' }]));
  assert.equal(anmVerworfen(ablage), 2);
  // Peter, 05.11. (aus #139): nur Gefaelschtes und Eintraege ohne Berechtigung zaehlen - nicht Harmloses aus der Reihenfolge
  // (Autor/Geraet erst spaeter aufgenommen, z. B. nach "Schluessel erneuern"; aelterer Stand) oder einer neueren App-Fassung
  const alle = [...ABGLEICH_GRUENDE, 'stand-alt'];
  m.set('bq_abgleichVerworfen', JSON.stringify(alle.map((grund) => ({ grund }))));
  assert.equal(anmVerworfen(ablage), 8);
  assert.deepEqual(alle.filter((g) => !ANM_VERWORFEN_ZAEHLT.includes(g)).sort(), ['autor-unbekannt', 'format', 'geraet-nicht-angemeldet', 'stand-alt']);
  assert.ok(ANM_VERWORFEN_ZAEHLT.every((g) => ABGLEICH_GRUENDE.includes(g)), 'nur Gruende, die es gibt');
  m.set('bq_abgleichVerworfen', JSON.stringify([{ grund: 'autor-unbekannt', typ: 'family_set' }, null, 'x']));
  assert.equal(anmVerworfen(ablage), 0, 'nach "Schluessel erneuern": ein Familien-Eintrag mit autor-unbekannt -> keine Zahl');
  // geraet-nicht-angemeldet: harmlos (Reihenfolge) - ausser das Buendel kommt von einem entfernten Geraet
  m.set('bq_abgleichVerworfen', JSON.stringify([{ kennung: 'd_K2/3', grund: 'geraet-nicht-angemeldet' }, { kennung: 'd_K1/1', grund: 'geraet-nicht-angemeldet' }, { grund: 'geraet-nicht-angemeldet' }]));
  assert.equal(anmVerworfen(ablage), 0, 'kein Geraet entfernt');
  m.set('bq_abgleich', JSON.stringify({ 'kind:lern:p_k1': { log: [{ event: { type: 'device_removed', payload: { device: 'd_K2' } } }] } }));
  assert.equal(anmVerworfen(ablage), 1, 'nur das vom entfernten Geraet d_K2');
  m.delete('bq_abgleich');
  m.set('bq_abgleichVerworfen', 'kaputt'); assert.equal(anmVerworfen(ablage), 0);
  m.set('bq2_evDevice', JSON.stringify('d_A1'));
  const st = (dev) => JSON.stringify({ 'kind:lern:p_k1': { log: [{ event: { type: 'device_added', payload: { device: 'd_A1' } } }, { event: { type: 'device_removed', payload: { device: dev } } }] } });
  assert.equal(anmGeraetEntfernt({ ablage }), false, 'nichts bekannt');
  m.set('bq_abgleich', st('d_B1')); assert.equal(anmGeraetEntfernt({ ablage }), false, 'ein anderes Geraet entfernt');
  m.set('bq_abgleich', st('d_A1')); assert.equal(anmGeraetEntfernt({ ablage }), true, 'dieses Geraet entfernt');
  anmGeraetNeu({ ablage });
  assert.equal(m.get('bq_abgleich'), '{}'); assert.equal(anmGeraetEntfernt({ ablage }), false);
  assert.equal(await anmSpeicherFremd({}), false, 'ein Speicher ohne verbunden(): nicht fremd');
  assert.equal(await anmSpeicherFremd({ verbunden: async () => false }), true);
  assert.equal(await anmSpeicherFremd({ verbunden: async () => true }), false);
  assert.equal(await anmSpeicherFremd({ verbunden: async () => { const e = new Error('x'); e.code = 'offline'; throw e; } }), false, 'Speicherfehler: die normalen Meldungen');
  await assert.rejects(anmSpeicherFremd({ verbunden: async () => { throw new Error('Programmfehler'); } }), /Programmfehler/);
});

test('Test 11: QR-Einladung vom gleichen HTTPS-Teststamm nur ins integrierte Formular', () => {
  const code='ACCESSCODE1234567890';
  const root='https://big-quest-test.github.io/';
  const form=root+'probe-evaluation-form/';
  const link=root+'#zugang='+code;
  assert.deepEqual(anmEingefuegt(link,form), {zugang:code,start:null});
  assert.deepEqual(anmEingefuegt(form+'#zugang='+code,form), {zugang:code,start:null});
  for(const alien of [
    'https://other.example/#zugang='+code,
    'http://big-quest-test.github.io/#zugang='+code,
    root+'some-other-path/#zugang='+code,
  ]) assert.deepEqual(anmEingefuegt(alien,form),{fremd:true},alien);
  assert.deepEqual(anmEingefuegt(link,root+'other-preview/'),{fremd:true});
  assert.deepEqual(anmEingefuegt(link,'https://other.example/probe-evaluation-form/'),{fremd:true});
});
