// Modul ereignisse ohne Browser (S12 P2, Aufgabe 2; EP7: US7.1, US7.3, US7.4; Erfolgskriterium E4).
//   node --test tests/module/ereignisse.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  EVENT_VERSION, EVENT_FUTURE_MS, EVENT_TYPES, PAYLOAD_FIELDS, PAYLOAD_OPTIONAL,
  newEvent, checkEvent, effectiveTime, mergeLog, fieldKey, lastWins, lastWinsOrder,
} from '../../src/module/ereignisse.mjs';

/* ---------- helpers: fixed random numbers, so every run is the same ---------- */
function seeded(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const bytesOf = (next) => (n) => Uint8Array.from({ length: n }, () => Math.floor(next() * 256));
function shuffled(list, next) { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const iso = (ms) => new Date(ms).toISOString().replace('.000Z', 'Z');
const NOW = Date.parse('2026-11-03T12:00:00Z'), HOUR = 3600 * 1000, DAY_MS = 24 * HOUR;
const DAY = '2026-11-02';

const rand0 = bytesOf(seeded(20261102));
const ev = (type, payload, { at = iso(NOW - HOUR), author = 'p_k1', device = 'd_a1', rand = rand0 } = {}) => newEvent({ type, author, device, payload, at }, { rand });
const answer = (device, i, ms, rand) => ev('answer', { day: iso(ms).slice(0, 10), skill: 'round', level: 2, attempt: 1, ok: i % 3 !== 0, qid: 'q' + i }, { at: iso(ms), device, rand });
const name = (value, ms, device, rand = rand0) => ev('profile_set', { field: 'name', value }, { at: iso(ms), device, rand });
const KONZEPT_TYPEN = ['answer', 'round_done', 'badge', 'review', 'practice_day', 'profile_set', 'rank_seen', 'sheet_created', 'sheet_result', 'sheet_discarded', 'setting_set', 'checklist_set', 'day_flag', 'school_import', 'grant_set', 'grant_revoked', 'grant_opened', 'member_added', 'member_removed', 'device_added', 'device_removed', 'key_rotated', 'snapshot', 'gap_state', 'gap_active', 'list_set', 'advent_open'];
const SAMPLE = {
  answer: { day: DAY, skill: 'round', family: null, level: 2, attempt: 1, ok: true, response: '3', qid: 'q|v|o|a', help: false, example: false },
  round_done: { day: DAY, skill: 'round', stars: 7, count: 8 },
  badge: { day: DAY, badge: 'inquirer', skill: 'round' },
  review: { day: DAY, qid: 'q1', box: 1, dueAt: '2026-11-05', question: { prompt: 'x' } },
  practice_day: { day: DAY },
  profile_set: { field: 'name', value: 'Kathie' },
  rank_seen: { rank: 'Investigator' },
  sheet_created: { sheet: DAY + '-abc', day: DAY, no: 3, writing: 'en', items: [{ q: { prompt: 'x' }, res: null }] },
  sheet_result: { sheet: DAY + '-abc', index: 0, res: 'ok', day: DAY, qid: 'q|v|o|a' },
  sheet_discarded: { sheet: DAY + '-abc' },
  setting_set: { setting: 'focusMode', value: 'manual' },
  checklist_set: { studio: 'grow', index: 2, value: true },
  day_flag: { flag: 'greetDay', day: DAY },
  school_import: { asOf: '2026-11-01', data: { round: 'M' }, source: 'toddle' },
  grant_set: { grant: 'g1', grantee: 'p_l1', scope: ['learning', 'school'], from: DAY, until: '2026-11-15', text: 'consent text' },
  grant_revoked: { grant: 'g1', grantee: 'p_l1' },
  grant_opened: { grant: 'g1', grantee: 'p_l1', scope: ['learning'] },
  member_added: { person: 'p_e2', role: 'parent' },
  member_removed: { person: 'p_e2' },
  device_added: { device: 'd_b1', label: 'iPad' },
  device_removed: { device: 'd_b1' },
  key_rotated: { version: 2 },
  snapshot: { upTo: '2026-11-02T16:00:00Z', count: 5000, idsHash: 'ab'.repeat(32), state: { total: 120 } },
  gap_state: { standard: 'MA.3.NBT.2', state: 'closed', by: 'app', schoolDay: '2026-10-20', day: DAY, quest: 'round' },
  gap_active: { standard: 'MA.3.NBT.2' },
  list_set: { list: 'unlocked', item: 'fractions', on: true },
  advent_open: { year: 2026, door: 3 },
};
const gut = ev('answer', SAMPLE.answer);
const mitGrund = (e, re, wo = '') => { const f = checkEvent(e); assert.ok(f.some((x) => re.test(x)), `${wo}: expected ${re}, got ${JSON.stringify(f)}`); };

/* ---------- US7.1: format ---------- */
test('US7.1: 27 Typen wie im Konzept 9.1 (23 + 2 fuer Luecken, Aufgabe 3b-0, + 2 fuer Listen und Advent, 3b-1b-2); je Typ ein gueltiges Ereignis', () => {
  assert.equal(EVENT_VERSION, 1);
  assert.deepEqual(EVENT_TYPES, KONZEPT_TYPEN);
  assert.equal(EVENT_TYPES.length, 27);
  assert.deepEqual(Object.keys(SAMPLE), EVENT_TYPES);
  for (const type of EVENT_TYPES) {
    const e = ev(type, SAMPLE[type]);
    assert.deepEqual(checkEvent(e), [], type);
    assert.deepEqual(Object.keys(e), ['id', 'v', 'type', 'at', 'author', 'device', 'payload']);
    for (const f of PAYLOAD_FIELDS[type]) assert.ok(f in SAMPLE[type], `${type}: sample has required ${f}`);
    for (const f of Object.keys(SAMPLE[type])) assert.ok(PAYLOAD_FIELDS[type].includes(f) || PAYLOAD_OPTIONAL[type].includes(f), `${type}: ${f} is declared`);
  }
  assert.deepEqual(PAYLOAD_FIELDS.answer, ['day', 'skill', 'level', 'attempt', 'ok', 'qid']);
  assert.ok(PAYLOAD_FIELDS.practice_day.length === 1);
});

test('US7.1: fehlt ein Pflichtfeld, wird das Ereignis mit Grund abgelehnt (jedes Feld jedes Typs)', () => {
  let n = 0;
  for (const type of EVENT_TYPES) for (const f of PAYLOAD_FIELDS[type]) {
    const payload = { ...SAMPLE[type] }; delete payload[f];
    mitGrund(ev(type, payload), new RegExp(`^payload\\.${f}: missing$`), `${type}.${f}`); n++;
  }
  assert.ok(n >= 50, 'many fields checked: ' + n);
  mitGrund({ ...gut, payload: { ...gut.payload, qid: undefined } }, /^payload\.qid: missing$/, 'undefined counts as missing');
});

test('US7.1: kaputte Faelle werden mit Grund abgelehnt', () => {
  const F = [
    ['falsche Version', { ...gut, v: 2 }, /^v:/], ['Version fehlt', (({ v, ...r }) => r)(gut), /^v:/],
    ['unbekannter Typ', { ...gut, type: 'delete_all' }, /^type: unknown/], ['Typ fehlt', { ...gut, type: undefined }, /^type:/],
    ['id ohne e_', { ...gut, id: 'x_' + 'a'.repeat(24) }, /^id:/], ['id zu kurz', { ...gut, id: 'e_' + 'a'.repeat(23) }, /^id:/],
    ['id zu lang', { ...gut, id: 'e_' + 'a'.repeat(25) }, /^id:/], ['id Grossbuchstaben', { ...gut, id: 'e_' + 'A'.repeat(24) }, /^id:/],
    ['id keine Hexzeichen', { ...gut, id: 'e_' + 'g'.repeat(24) }, /^id:/], ['id Zahl', { ...gut, id: 123 }, /^id:/],
    ['Zeit mit Zeitzone', { ...gut, at: '2026-11-02T16:04:11+01:00' }, /^at:/], ['Zeit ohne Z', { ...gut, at: '2026-11-02T16:04:11' }, /^at:/],
    ['Zeit mit Leerzeichen', { ...gut, at: '2026-11-02 16:04:11Z' }, /^at:/], ['Zeit nur Tag', { ...gut, at: '2026-11-02' }, /^at:/],
    ['Zeit 4 Nachkommastellen', { ...gut, at: '2026-11-02T16:04:11.1234Z' }, /^at:/], ['30. Februar', { ...gut, at: '2026-02-30T10:00:00Z' }, /^at:/],
    ['Stunde 24', { ...gut, at: '2026-11-02T24:00:00Z' }, /^at:/], ['Zeit als Zahl', { ...gut, at: Date.now() }, /^at:/], ['Zeit null', { ...gut, at: null }, /^at:/],
    ['Autor ohne p_', { ...gut, author: 'e1' }, /^author:/], ['Autor gross P_', { ...gut, author: 'P_e1' }, /^author:/], ['Autor leer', { ...gut, author: '' }, /^author:/],
    ['Autor ist ein Geraet', { ...gut, author: 'd_a1' }, /^author:/], ['Geraet ohne d_', { ...gut, device: 'a1' }, /^device:/], ['Geraet ist eine Person', { ...gut, device: 'p_e1' }, /^device:/],
    ['Nutzlast fehlt', { ...gut, payload: undefined }, /^payload: not an object/], ['Nutzlast null', { ...gut, payload: null }, /^payload: not an object/],
    ['Nutzlast Liste', { ...gut, payload: [] }, /^payload: not an object/], ['Nutzlast Text', { ...gut, payload: 'x' }, /^payload: not an object/],
    ['zusaetzliches Feld am Ereignis', { ...gut, sig: 'abc' }, /^event\.sig: unknown field/],
    ['unbekanntes Feld in der Nutzlast', ev('answer', { ...SAMPLE.answer, name: 'Kathie' }), /^payload\.name: unknown field/],
    ['Feld wie ein Objekt-Eigenschaftsname', ev('answer', { ...SAMPLE.answer, constructor: 1 }), /^payload\.constructor: unknown field/],
    ['Stufe 4', ev('answer', { ...SAMPLE.answer, level: 4 }), /^payload\.level: invalid/], ['Stufe 0', ev('answer', { ...SAMPLE.answer, level: 0 }), /^payload\.level: invalid/],
    ['Versuch -1', ev('answer', { ...SAMPLE.answer, attempt: -1 }), /^payload\.attempt: invalid/], ['Versuch 1.5', ev('answer', { ...SAMPLE.answer, attempt: 1.5 }), /^payload\.attempt: invalid/], ['ok als Text', ev('answer', { ...SAMPLE.answer, ok: 'yes' }), /^payload\.ok: invalid/],
    ['Tag falsch geschrieben', ev('answer', { ...SAMPLE.answer, day: '02.11.2026' }), /^payload\.day: invalid/], ['Tag gibt es nicht', ev('answer', { ...SAMPLE.answer, day: '2026-02-30' }), /^payload\.day: invalid/],
    ['qid leer', ev('answer', { ...SAMPLE.answer, qid: '' }), /^payload\.qid: invalid/],
    ['Profilfeld unbekannt', ev('profile_set', { field: 'color', value: 'red' }), /^payload\.field: invalid/],
    ['Blatt-Ergebnis unbekannt', ev('sheet_result', { ...SAMPLE.sheet_result, res: 'maybe' }), /^payload\.res: invalid/],
    ['Einstellung unbekannt', ev('setting_set', { setting: 'theme', value: 'dark' }), /^payload\.setting: invalid/],
    ['Liste als Einstellung (3b-1b-2: list_set)', ev('setting_set', { setting: 'unlocked', value: ['x'] }), /^payload\.setting: invalid/], ['Fokusliste als Einstellung', ev('setting_set', { setting: 'focusManual', value: [] }), /^payload\.setting: invalid/],
    ['Freigabe ohne Umfang', ev('grant_set', { ...SAMPLE.grant_set, scope: [] }), /^payload\.scope: invalid/], ['Freigabe Umfang unbekannt', ev('grant_set', { ...SAMPLE.grant_set, scope: ['all'] }), /^payload\.scope: invalid/],
    ['Freigabe Umfang doppelt', ev('grant_set', { ...SAMPLE.grant_set, scope: ['learning', 'learning'] }), /^payload\.scope: invalid/], ['Freigabe an Nicht-Person', ev('grant_set', { ...SAMPLE.grant_set, grantee: 'frau' }), /^payload\.grantee: invalid/],
    ['Geraet ohne d_ in der Nutzlast', ev('device_added', { device: 'iPad' }), /^payload\.device: invalid/],
    ['Schnappschuss mit Ortszeit', ev('snapshot', { ...SAMPLE.snapshot, upTo: '2026-11-02T16:00:00+01:00' }), /^payload\.upTo: invalid/],
    ['Schnappschuss-Pruefsumme gross geschrieben', ev('snapshot', { ...SAMPLE.snapshot, idsHash: 'AB'.repeat(32) }), /^payload\.idsHash: invalid/],
    ['Schnappschuss-Pruefsumme zu kurz', ev('snapshot', { ...SAMPLE.snapshot, idsHash: 'ab'.repeat(31) }), /^payload\.idsHash: invalid/],
    ['optionales Feld falsch', ev('answer', { ...SAMPLE.answer, help: 'no' }), /^payload\.help: invalid/],
  ];
  for (const [wo, e, re] of F) mitGrund(e, re, wo);
  for (const x of [null, undefined, 'x', 5, [], [gut]]) assert.deepEqual(checkEvent(x), ['event: not an object'], String(x));
  assert.ok(F.length >= 40);
});

test('US7.1: gueltig sind auch Zeit mit Millisekunden, Antwort mit allen Zusatzfeldern und family null', () => {
  assert.deepEqual(checkEvent({ ...gut, at: '2026-11-02T16:04:11.250Z' }), []);
  assert.deepEqual(checkEvent({ ...gut, at: '2026-11-02T16:04:11.5Z' }), []);
  // the shapes index.html stores today for an attempt (index.html: "attempts")
  const heute = [
    { day: DAY, skill: 'round', family: null, level: 2, attempt: 1, ok: true, response: 'b', qid: 'q1', help: false, example: false },
    { day: DAY, skill: 'round', family: 'rounding', level: 1, attempt: 2, ok: false, response: 12, qid: 'q2', help: true, example: true },
    { day: DAY, skill: 'units', level: 2, attempt: 1, ok: false, help: true, exampleShown: true, qid: 'q3' },
    { day: DAY, skill: 'units', level: 2, attempt: 0, ok: false, help: true, hintShown: true, qid: 'q4' },          // before the first try: attempt 0
    { day: DAY, skill: 'units', level: 2, attempt: 0, ok: false, help: true, exampleShown: true, qid: 'q4' },
    { day: DAY, skill: 'units', level: 3, attempt: 0, ok: false, help: true, solutionShown: true, beforeTry: true, qid: 'q5' },
    { day: DAY, skill: 'graphs', level: 2, attempt: 1, ok: true, help: false, sheet: DAY + '-x1', qid: 'q6' },
  ];
  for (const p of heute) assert.deepEqual(checkEvent(ev('answer', p)), [], JSON.stringify(p));
  // finding: the entry the app writes today when a grown-up enters a sheet result (index.html, "sheet:key") has no qid.
  // It is therefore no "answer"; it is the event "sheet_result" (sheet, index, res, day, qid).
  mitGrund(ev('answer', { day: DAY, skill: 'graphs', level: 2, attempt: 1, ok: true, help: false, sheet: DAY + '-x1' }), /^payload\.qid: missing$/, 'sheet entry without qid');
  assert.deepEqual(checkEvent(ev('profile_set', { field: 'birthday', value: null })), [], 'a profile field can be cleared');
});

test('newEvent: id aus rand (e_ + 24 Hexzeichen), Nutzlast wird kopiert, Zeit bleibt unveraendert', () => {
  const fest = (n) => Uint8Array.from({ length: n }, (_, i) => i * 17);
  const p = { day: DAY, skill: 'round', level: 2, attempt: 1, ok: true, qid: 'q1', response: { a: [1, 2] } };
  const e = newEvent({ type: 'answer', author: 'p_k1', device: 'd_a1', payload: p, at: '2026-11-02T16:04:11Z' }, { rand: fest });
  assert.equal(e.id, 'e_00112233445566778899aabb');
  assert.equal(e.at, '2026-11-02T16:04:11Z');
  assert.deepEqual(e.payload, p);
  p.response.a.push(3); p.ok = false;
  assert.deepEqual(e.payload.response, { a: [1, 2] }, 'later changes of the caller do not change the event');
  assert.equal(e.payload.ok, true);
  assert.deepEqual(JSON.parse(JSON.stringify(e)), e, 'plain JSON');
  assert.deepEqual(checkEvent(newEvent({ type: 'practice_day', author: 'p_k1', device: 'd_a1', payload: { day: DAY }, at: iso(NOW) })), [], 'default random numbers work');
  const ids = new Set(Array.from({ length: 2000 }, () => newEvent({ type: 'practice_day', author: 'p_k1', device: 'd_a1', payload: { day: DAY }, at: iso(NOW) }).id));
  assert.equal(ids.size, 2000, 'default ids do not repeat');
});

/* ---------- US7.3 / E4: two devices ---------- */
test('E4 / US7.3: zwei Geraete mit je 50 Antworten ergeben nach dem Abgleich 100, keine doppelt, in beiden Richtungen und mehrfach', () => {
  const r = bytesOf(seeded(4));
  const A = Array.from({ length: 50 }, (_, i) => answer('d_a1', i, NOW - 5 * HOUR + i * 120000, r));
  const B = Array.from({ length: 50 }, (_, i) => answer('d_b1', 100 + i, NOW - 5 * HOUR + i * 120000 + 30000, r));
  const ab = mergeLog([A, B], NOW), ba = mergeLog([B, A], NOW);
  assert.equal(ab.events.length, 100);
  assert.deepEqual(ab.events, ba.events, 'the same on both devices');
  assert.equal(new Set(ab.events.map((e) => e.id)).size, 100, '0 duplicates');
  for (const e of [...A, ...B]) assert.ok(ab.events.includes(e), '0 lost');
  assert.deepEqual([ab.conflicts, ab.invalid], [[], []]);
  // several rounds of syncing, each device keeps writing offline in between
  let geraetA = A, geraetB = B;
  for (let runde = 0; runde < 4; runde++) {
    const m = mergeLog([geraetA, geraetB], NOW).events;
    assert.equal(m.length, 100 + runde * 10, 'round ' + runde);
    geraetA = mergeLog([m, m], NOW).events;                      // again and again: nothing doubles
    geraetB = mergeLog([m], NOW).events;
    assert.deepEqual(geraetA, geraetB);
    const neuA = Array.from({ length: 5 }, (_, i) => answer('d_a1', 1000 + runde * 10 + i, NOW - 4 * HOUR + runde * 1000 + i * 200000, r));
    const neuB = Array.from({ length: 5 }, (_, i) => answer('d_b1', 2000 + runde * 10 + i, NOW - 3 * HOUR + runde * 1000 + i * 200000, r));
    geraetA = [...geraetA, ...neuA]; geraetB = [...geraetB, ...neuB];
  }
  assert.equal(mergeLog([geraetA, geraetB], NOW).events.length, 140);
});

test('E4: schon gemeinsame Ereignisse zaehlen einmal (20 gemeinsam, je 30 eigene -> 80)', () => {
  const r = bytesOf(seeded(5));
  const gemeinsam = Array.from({ length: 20 }, (_, i) => answer('d_a1', i, NOW - 9 * HOUR + i * 60000, r));
  const A = [...gemeinsam, ...Array.from({ length: 30 }, (_, i) => answer('d_a1', 50 + i, NOW - 5 * HOUR + i * 60000, r))];
  const B = [...gemeinsam, ...Array.from({ length: 30 }, (_, i) => answer('d_b1', 90 + i, NOW - 4 * HOUR + i * 60000, r))];
  const m = mergeLog([A, B], NOW);
  assert.equal(m.events.length, 80);
  assert.deepEqual(m.conflicts, []);
  assert.deepEqual(mergeLog([B, A], NOW).events, m.events);
});

/* ---------- order and the laws of merging ---------- */
function pool(next, n = 60) {
  const r = bytesOf(next), out = [];
  for (let i = 0; i < n; i++) {
    const ms = NOW - 6 * HOUR + Math.floor(next() * 8) * 60000;                 // only 8 different times: many ties
    out.push(ev(next() < 0.5 ? 'answer' : 'badge', null, { at: iso(ms), device: next() < 0.5 ? 'd_a1' : 'd_b1', rand: r }));
  }
  return out.map((e) => (e.type === 'answer' ? { ...e, payload: { day: DAY, skill: 'round', level: 2, attempt: 1, ok: true, qid: 'q' + e.id.slice(2, 8) } } : { ...e, payload: { day: DAY, badge: 'b' + e.id.slice(2, 6) } }));
}
const erwartet = (events) => events.slice().sort((a, b) => (Date.parse(a.at) - Date.parse(b.at)) || (a.id < b.id ? -1 : 1));

test('Reihenfolge: nach Zeit, bei Gleichstand nach id; gleiches Ergebnis bei jeder Reihenfolge der Eingaben (200 gemischte Laeufe)', () => {
  const next = seeded(7), P = pool(next);
  assert.equal(new Set(P.map((e) => e.at)).size < P.length / 3, true, 'the pool has many ties');
  assert.deepEqual(P.map(checkEvent).flat(), []);
  const soll = erwartet(P);
  assert.deepEqual(mergeLog([P], NOW).events, soll);
  assert.ok(soll.some((e, i) => i && e.at === soll[i - 1].at), 'there are ties');
  for (let lauf = 0; lauf < 200; lauf++) {
    const mix = shuffled(P, next), teile = 1 + Math.floor(next() * 4), listen = Array.from({ length: teile }, () => []);
    for (const e of mix) { listen[Math.floor(next() * teile)].push(e); if (next() < 0.3) listen[Math.floor(next() * teile)].push(e); }   // some events arrive twice
    for (const l of listen) if (next() < 0.5) l.reverse();
    assert.deepEqual(mergeLog(shuffled(listen, next), NOW).events, soll, 'run ' + lauf);
  }
});

test('Rechengesetze: vertauschbar, zusammenfassbar, wiederholbar (100 zufaellige Mengen, auch mit Zeiten aus der Zukunft)', () => {
  const next = seeded(11);
  const alle = [...pool(next, 80), ...Array.from({ length: 6 }, (_, i) => ev('practice_day', { day: DAY }, { at: iso(NOW + (2 + i) * DAY_MS), device: 'd_b1', rand: bytesOf(next) }))];
  const teil = () => alle.filter(() => next() < 0.5);
  const M = (...l) => mergeLog(l, NOW).events;
  for (let i = 0; i < 100; i++) {
    const a = teil(), b = teil(), c = teil();
    assert.deepEqual(M(a, b), M(b, a), 'commutative ' + i);
    assert.deepEqual(M(M(a, b), c), M(a, M(b, c)), 'associative ' + i);
    assert.deepEqual(M(a, a), M(a), 'idempotent ' + i);
    assert.deepEqual(M(M(a, b), b), M(a, b), 'repeatable ' + i);
    assert.deepEqual(M(M(a, b), a, b), M(a, b), 'repeatable 2 ' + i);
  }
});

test('Zusammenfuehren aendert die Eingaben nicht; leere und fehlende Listen gehen', () => {
  const next = seeded(13), P = pool(next, 20), kopie = JSON.parse(JSON.stringify(P));
  mergeLog([P, P.slice().reverse()], NOW);
  assert.deepEqual(P, kopie);
  for (const leer of [[], [[]], [[], []], undefined, null, [null], [undefined, []]]) assert.deepEqual(mergeLog(leer, NOW), { events: [], conflicts: [], invalid: [] });
});

test('Ungueltige Ereignisse werden nicht zusammengefuehrt, aber gemeldet; der Rest bleibt', () => {
  const r = bytesOf(seeded(17)), g1 = answer('d_a1', 1, NOW - HOUR, r), g2 = answer('d_a1', 2, NOW - 2 * HOUR, r);
  const kaputt = { ...g1, id: 'e_' + 'b'.repeat(24), v: 2 }, fremd = { id: 'x' };
  const m = mergeLog([[g1, kaputt], [fremd, g2, null]], NOW);
  assert.deepEqual(m.events, [g2, g1]);
  assert.equal(m.invalid.length, 3);
  assert.ok(m.invalid.some((x) => x.event === kaputt && x.errors.some((f) => /^v:/.test(f))));
  assert.deepEqual(m.conflicts, []);
  const m2 = mergeLog([[null, fremd, kaputt, g1], [g2]], NOW);
  assert.deepEqual(m2.invalid, m.invalid, 'same report in any order');
});

/* ---------- conflict ---------- */
test('Konflikt: gleiche id, anderer Inhalt -> gemeldet, nichts wird still ueberschrieben, jedes Geraet behaelt dieselbe Fassung', () => {
  const r = bytesOf(seeded(19)), a = answer('d_a1', 1, NOW - HOUR, r), b = { ...a, payload: { ...a.payload, ok: !a.payload.ok } }, c = { ...a, payload: { ...a.payload, response: 'x' } };
  const ab = mergeLog([[a], [b]], NOW), ba = mergeLog([[b], [a]], NOW), abc = mergeLog([[c], [a], [b]], NOW);
  for (const m of [ab, ba]) {
    assert.equal(m.events.length, 1, 'one event per id');
    assert.equal(m.conflicts.length, 1);
    assert.equal(m.conflicts[0].id, a.id);
    assert.equal(m.conflicts[0].rejected.length, 1);
    assert.deepEqual([m.conflicts[0].kept, ...m.conflicts[0].rejected].map((x) => x.payload.ok).sort(), [false, true], 'both variants are in the report');
  }
  assert.deepEqual(ab, ba, 'the order does not matter');
  assert.equal(abc.conflicts[0].rejected.length, 2);
  assert.deepEqual(mergeLog([[a], [{ ...a }]], NOW).conflicts, [], 'the same content under the same id is no conflict');
  const anders = { ...a, payload: Object.fromEntries(Object.entries(a.payload).reverse()) };
  assert.deepEqual(mergeLog([[a], [anders]], NOW).conflicts, [], 'the order of keys does not matter');
  assert.deepEqual(mergeLog([[a], [{ ...a, at: iso(NOW - 2 * HOUR) }]], NOW).conflicts.length, 1, 'a different time under the same id is a conflict');
});

/* ---------- clock ---------- */
test('Uhr: 3 Tage voraus zaehlt als "jetzt", 23 Stunden voraus zaehlt echt, genau 24 Stunden noch echt', () => {
  const at = (ms) => iso(ms);
  assert.equal(EVENT_FUTURE_MS, 24 * HOUR);
  assert.equal(effectiveTime(at(NOW + 3 * DAY_MS), NOW), NOW);
  assert.equal(effectiveTime(at(NOW + 23 * HOUR), NOW), NOW + 23 * HOUR);
  assert.equal(effectiveTime(at(NOW + 24 * HOUR), NOW), NOW + 24 * HOUR, 'exactly 24 hours is not "more than"');
  assert.equal(effectiveTime(at(NOW + 24 * HOUR + 1000), NOW), NOW, 'one second more');
  assert.equal(effectiveTime(at(NOW - 3 * DAY_MS), NOW), NOW - 3 * DAY_MS, 'the past stays');
  assert.equal(effectiveTime(at(NOW), NOW), NOW);
  assert.equal(effectiveTime(at(NOW + 3 * DAY_MS), iso(NOW)), NOW, '"now" as text');
  assert.equal(effectiveTime(at(NOW + 3 * DAY_MS), new Date(NOW)), NOW, '"now" as Date');
  assert.ok(Number.isNaN(effectiveTime('gestern', NOW)) && Number.isNaN(effectiveTime(at(NOW), 'jetzt')) && Number.isNaN(effectiveTime(null, NOW)));
});

test('Uhr: beim Zusammenfuehren sortiert ein Zeitpunkt 3 Tage voraus als "jetzt", einer 23 Stunden voraus echt; gespeichert bleibt die Zeit', () => {
  const r = bytesOf(seeded(23));
  const frueh = answer('d_a1', 1, NOW - HOUR, r), vorn3 = answer('d_b1', 2, NOW + 3 * DAY_MS, r), vorn23 = answer('d_b1', 3, NOW + 23 * HOUR, r), jetzt = answer('d_a1', 4, NOW, r);
  const m = mergeLog([[vorn23, vorn3], [jetzt, frueh]], NOW).events;
  assert.deepEqual(m.map((e) => e.id).filter((id) => id !== jetzt.id && id !== vorn3.id), [frueh.id, vorn23.id]);
  assert.deepEqual([m[0], m[3]], [frueh, vorn23], 'early first, 23 hours ahead last');
  assert.deepEqual(m.slice(1, 3).map((e) => e.id).sort(), [jetzt.id, vorn3.id].sort(), '"now" and the 3-days-ahead event tie at "now" -> by id');
  assert.equal(vorn3.at, iso(NOW + 3 * DAY_MS), 'the time of the event itself is never rewritten');
  const spaeter = mergeLog([m], NOW + 2 * DAY_MS).events;
  assert.equal(spaeter[spaeter.length - 1].id, vorn3.id, 'two days later the event is within 24 hours and counts with its own time');
});

/* ---------- US7.4: last wins ---------- */
test('US7.4 Feldschluessel: je "Letzte gilt"-Feld ein Schluessel; Protokoll-Ereignisse haben keinen', () => {
  assert.equal(fieldKey(ev('profile_set', { field: 'name', value: 'x' })), 'profile_set:name');
  assert.equal(fieldKey(ev('profile_set', { field: 'emoji', value: 'x' })), 'profile_set:emoji');
  assert.equal(fieldKey(ev('setting_set', { setting: 'focusMode', value: 'auto' })), 'setting_set:focusMode');
  assert.equal(fieldKey(ev('day_flag', { flag: 'greetDay', day: DAY })), 'day_flag:greetDay');
  assert.equal(fieldKey(ev('checklist_set', { studio: 'grow', index: 0, value: true })), 'checklist_set:grow:0', 'one key per tick');
  assert.notEqual(fieldKey(ev('checklist_set', { studio: 'grow', index: 1, value: true })), fieldKey(ev('checklist_set', { studio: 'grow', index: 0, value: true })));
  assert.equal(fieldKey(ev('rank_seen', { rank: 'Scientist' })), 'rank_seen');
  assert.equal(fieldKey(ev('gap_state', SAMPLE.gap_state)), 'gap_state:MA.3.NBT.2', 'gaps: one key per standard');
  assert.notEqual(fieldKey(ev('gap_state', { ...SAMPLE.gap_state, standard: 'MA.3.MD.1' })), fieldKey(ev('gap_state', SAMPLE.gap_state)));
  assert.equal(fieldKey(ev('gap_active', { standard: null })), 'gap_active', 'the active gap: one key');
  assert.equal(fieldKey(ev('list_set', SAMPLE.list_set)), 'list_set:unlocked:fractions', 'lists: one key per list and entry (3b-1b-2)');
  for (const t of EVENT_TYPES.filter((x) => !['profile_set', 'setting_set', 'day_flag', 'checklist_set', 'rank_seen', 'gap_state', 'gap_active', 'list_set'].includes(x))) assert.equal(fieldKey(ev(t, SAMPLE[t])), null, t);
  for (const x of [null, undefined, 5, {}, { type: 'profile_set' }, { type: 'profile_set', payload: {} }, { type: 'toString', payload: {} }, { type: 'constructor', payload: { field: 'name' } }]) assert.equal(fieldKey(x), null);
});

test('US7.4: der juengste gewinnt; Gleichstand -> groessere Geraete-Kennung; dann groessere id; jedes Geraet entscheidet gleich', () => {
  const r = bytesOf(seeded(29));
  const t0 = NOW - 3 * HOUR;
  const anna = name('Anna', t0, 'd_a1', r), berta = name('Berta', t0 + 5000, 'd_b1', r);
  for (const liste of [[anna, berta], [berta, anna]]) assert.equal(lastWins(liste, NOW)['profile_set:name'], berta, 'the youngest wins');
  const alt = name('Alt', t0, 'd_a1', r), gleichB = name('Neu', t0, 'd_b1', r);
  for (const liste of [[alt, gleichB], [gleichB, alt]]) assert.equal(lastWins(liste, NOW)['profile_set:name'].payload.value, 'Neu', 'same time: the larger device ID wins');
  const g1 = name('eins', t0, 'd_a1', r), g2 = name('zwei', t0, 'd_a1', r), [klein, gross] = [g1, g2].sort((x, y) => (x.id < y.id ? -1 : 1));
  for (const liste of [[g1, g2], [g2, g1]]) assert.equal(lastWins(liste, NOW)['profile_set:name'], gross, 'same time, same device: the larger event id wins');
  assert.notEqual(klein, gross);
  // a device with a longer ID text compares like text: "d_b1" > "d_a1" > "d_A1"
  const big = name('B', t0, 'd_b1', r), low = name('A', t0, 'd_A1', r);
  assert.equal(lastWins([low, big], NOW)['profile_set:name'], big);
});

test('US7.4: Felder sind unabhaengig; Protokoll-Ereignisse und ungueltige bleiben aussen vor; Ergebnis haengt nicht von der Eingabereihenfolge ab', () => {
  const next = seeded(31), r = bytesOf(next), t0 = NOW - 5 * HOUR;
  const E = [
    name('Anna', t0, 'd_a1', r), name('Berta', t0 + 1000, 'd_b1', r),
    ev('profile_set', { field: 'emoji', value: 'x' }, { at: iso(t0 + 9000), device: 'd_a1', rand: r }),
    ev('setting_set', { setting: 'focusMode', value: 'manual' }, { at: iso(t0 + 2000), device: 'd_a1', rand: r }),
    ev('setting_set', { setting: 'focusMode', value: 'auto' }, { at: iso(t0 + 3000), device: 'd_b1', rand: r }),
    ev('checklist_set', { studio: 'grow', index: 0, value: true }, { at: iso(t0 + 100), device: 'd_a1', rand: r }),
    ev('checklist_set', { studio: 'grow', index: 0, value: false }, { at: iso(t0 + 200), device: 'd_a1', rand: r }),
    ev('checklist_set', { studio: 'grow', index: 1, value: true }, { at: iso(t0 + 50), device: 'd_b1', rand: r }),
    ev('rank_seen', { rank: 'Explorer' }, { at: iso(t0), rand: r }), ev('rank_seen', { rank: 'Investigator' }, { at: iso(t0 + 7), rand: r }),
    answer('d_a1', 1, t0 + 60000, r), ev('badge', { day: DAY, badge: 'x' }, { rand: r }),
    { ...name('kaputt', t0 + 99999, 'd_z9', r), v: 2 },
  ];
  const w = lastWins(E, NOW);
  assert.deepEqual(Object.keys(w), ['checklist_set:grow:0', 'checklist_set:grow:1', 'profile_set:emoji', 'profile_set:name', 'rank_seen', 'setting_set:focusMode']);
  assert.equal(w['profile_set:name'].payload.value, 'Berta');
  assert.equal(w['setting_set:focusMode'].payload.value, 'auto');
  assert.equal(w['checklist_set:grow:0'].payload.value, false);
  assert.equal(w['checklist_set:grow:1'].payload.value, true);
  assert.equal(w['rank_seen'].payload.rank, 'Investigator');
  assert.equal(w['profile_set:emoji'].payload.value, 'x');
  for (let i = 0; i < 100; i++) assert.deepEqual(lastWins(shuffled(E, next), NOW), w, 'run ' + i);
  assert.deepEqual(lastWins([], NOW), {});
  assert.deepEqual(lastWins(undefined, NOW), {});
  assert.deepEqual(lastWins([null, 5, {}], NOW), {});
});

test('US7.4: "Letzte gilt" nutzt dieselbe Uhrenregel; zwei Geraete mit denselben Ereignissen entscheiden gleich', () => {
  const r = bytesOf(seeded(37)), vorn = name('Falsch', NOW + 3 * DAY_MS, 'd_x1', r), echt = name('Echt', NOW - HOUR, 'd_y1', r), echtJetzt = name('Echt jetzt', NOW, 'd_a1', r);
  assert.equal(lastWins([echt, vorn], NOW)['profile_set:name'].payload.value, 'Falsch', 'the wrong clock beats an older value ...');
  assert.equal(lastWins([echt, vorn, echtJetzt], NOW)['profile_set:name'].payload.value, 'Falsch', '... and ties with "now": the larger device ID (d_x1) wins');
  const klein = name('Klein', NOW + 3 * DAY_MS, 'd_0a', r);
  assert.equal(lastWins([klein, echtJetzt], NOW)['profile_set:name'].payload.value, 'Echt jetzt', 'a tie at "now": d_a1 > d_0a');
});

/* ---------- known remaining risk (concept 9.2): not solved here, pinned ---------- */
test('Restrisiko: Werte von einer 3 Tage vorgestellten Uhr gewinnen bis zu 3 Tage lang gegen echte, spaetere Werte', () => {
  const r = bytesOf(seeded(41)), T = Date.parse('2026-11-02T10:00:00Z');
  const falsch = name('Falsch (Uhr +3 Tage)', T + 3 * DAY_MS, 'd_x1', r);
  const echt1 = name('Echt 1h', T + 1 * HOUR, 'd_y1', r), echt2 = name('Echt 2 Tage', T + 2 * DAY_MS, 'd_y1', r), echt3 = name('Echt nach 3 Tagen', T + 3 * DAY_MS + 30 * 60000, 'd_y1', r);
  const wer = (events, jetzt) => lastWins(events, jetzt)['profile_set:name'].payload.value;
  assert.equal(wer([falsch, echt1], T + 2 * HOUR), 'Falsch (Uhr +3 Tage)', 'at the first sync the wrong value counts as "now" and beats the older real one');
  assert.equal(wer([falsch, echt1, echt2], T + 2 * DAY_MS + HOUR), 'Falsch (Uhr +3 Tage)', 'still 23 hours ahead: counts with its own time, beats the real value of 2 days');
  assert.equal(wer([falsch, echt1, echt2, echt3], T + 3 * DAY_MS + HOUR), 'Echt nach 3 Tagen', 'only a real value after the wrong time wins again');
  // the improvement for later: remember "first seen" per event and measure against that
});

/* ---------- gaps (task 3b-0): gap_state per standard, gap_active ---------- */
const gap = (standard, state, by, { ms = NOW - HOUR, device = 'd_a1', schoolDay = '2026-10-20', rand = rand0, ...rest } = {}) =>
  ev('gap_state', { standard, state, by, schoolDay, day: iso(ms).slice(0, 10), ...rest }, { at: iso(ms), device, rand });
const aktiv = (standard, { ms = NOW - HOUR, device = 'd_e1', rand = rand0 } = {}) => ev('gap_active', { standard }, { at: iso(ms), device, rand });

test('3b-0 Format: gap_state und gap_active gueltig; unbekannter Zustand, fehlender Standard usw. abgelehnt', () => {
  for (const [state, by] of [['closed', 'app'], ['closed', 'parents'], ['hold', 'parents'], ['open', 'parents']]) assert.deepEqual(checkEvent(gap('X', state, by)), [], state + ' ' + by);
  assert.deepEqual(checkEvent(gap('X', 'closed', 'app', { quest: 'round' })), [], 'with quest');
  assert.deepEqual(checkEvent(aktiv('X')), []);
  assert.deepEqual(checkEvent(aktiv(null)), [], 'no active gap (null) is a value');
  assert.deepEqual(PAYLOAD_FIELDS.gap_state, ['standard', 'state', 'by', 'schoolDay', 'day']);
  assert.deepEqual(PAYLOAD_OPTIONAL.gap_state, ['quest']);
  assert.deepEqual(PAYLOAD_FIELDS.gap_active, ['standard']);
  const g = gap('X', 'closed', 'app'), a = aktiv('X');
  for (const [wo, e, re] of [
    ['unbekannter Zustand', { ...g, payload: { ...g.payload, state: 'done' } }, /^payload\.state: invalid$/],
    ['Zustand gross', { ...g, payload: { ...g.payload, state: 'Closed' } }, /^payload\.state: invalid$/],
    ['fehlender Standard', { ...g, payload: { ...g.payload, standard: undefined } }, /^payload\.standard: missing$/],
    ['leerer Standard', { ...g, payload: { ...g.payload, standard: '' } }, /^payload\.standard: invalid$/],
    ['Standard null', { ...g, payload: { ...g.payload, standard: null } }, /^payload\.standard: invalid$/],
    ['by unbekannt', { ...g, payload: { ...g.payload, by: 'teacher' } }, /^payload\.by: invalid$/],
    ['by fehlt', { ...g, payload: { ...g.payload, by: undefined } }, /^payload\.by: missing$/],
    ['schoolDay kein Tag', { ...g, payload: { ...g.payload, schoolDay: '2026-13-01' } }, /^payload\.schoolDay: invalid$/],
    ['day fehlt', { ...g, payload: { ...g.payload, day: undefined } }, /^payload\.day: missing$/],
    ['quest leer', { ...g, payload: { ...g.payload, quest: '' } }, /^payload\.quest: invalid$/],
    ['Zusatzfeld', { ...g, payload: { ...g.payload, active: 'X' } }, /^payload\.active: unknown field$/],
    ['gap_active ohne Standard', { ...a, payload: {} }, /^payload\.standard: missing$/],
    ['gap_active leer', { ...a, payload: { standard: '' } }, /^payload\.standard: invalid$/],
    ['gap_active Liste', { ...a, payload: { standard: ['X'] } }, /^payload\.standard: invalid$/],
  ]) mitGrund(e, re, wo);
});

test('3b-0 Zusammenfuehren: Kindergeraet schliesst X, Eltern-Handy waehlt Y und haelt Z -> alle drei Aenderungen da, in jeder Reihenfolge', () => {
  const r = bytesOf(seeded(47)), next = seeded(48), t0 = NOW - 3 * HOUR;
  const kind = [gap('X', 'closed', 'app', { ms: t0 + 60000, device: 'd_k1', quest: 'round', rand: r })];
  const eltern = [aktiv('Y', { ms: t0, rand: r }), gap('Z', 'hold', 'parents', { ms: t0 + 120000, device: 'd_e1', rand: r })];
  const w = lastWins(mergeLog([kind, eltern], NOW).events, NOW);
  assert.deepEqual(Object.keys(w), ['gap_active', 'gap_state:X', 'gap_state:Z'], 'three fields, none overwrites another');
  assert.equal(w['gap_state:X'].payload.state, 'closed');
  assert.equal(w['gap_state:Z'].payload.state, 'hold');
  assert.equal(w.gap_active.payload.standard, 'Y');
  for (let i = 0; i < 50; i++) {
    const mix = shuffled([...kind, ...eltern, ...kind], next);
    assert.deepEqual(lastWins(mergeLog([mix.slice(0, 2), mix.slice(2)], NOW).events, NOW), w, 'run ' + i);
  }
  assert.deepEqual(lastWins(mergeLog([eltern, kind], NOW).events, NOW), w, 'the other direction');
});

test('3b-0 gleicher Standard auf zwei Geraeten: die juengste Aenderung gilt; Gleichstand wie lastWins (groessere Geraete-Kennung, dann id)', () => {
  const r = bytesOf(seeded(53)), t0 = NOW - 2 * HOUR;
  const zu = gap('X', 'closed', 'app', { ms: t0, device: 'd_k1', rand: r }), halten = gap('X', 'hold', 'parents', { ms: t0 + 1000, device: 'd_e1', rand: r });
  for (const l of [[zu, halten], [halten, zu]]) assert.equal(lastWins(l, NOW)['gap_state:X'], halten, 'the youngest wins');
  const zuGleich = gap('X', 'closed', 'app', { ms: t0 + 1000, device: 'd_k1', rand: r });
  for (const l of [[zuGleich, halten], [halten, zuGleich]]) assert.equal(lastWins(l, NOW)['gap_state:X'], zuGleich, 'same time: d_k1 > d_e1');
  const a1 = aktiv('A', { ms: t0, device: 'd_e1', rand: r }), a2 = aktiv('B', { ms: t0, device: 'd_e1', rand: r }), gross = a1.id > a2.id ? a1 : a2;
  for (const l of [[a1, a2], [a2, a1]]) assert.equal(lastWins(l, NOW).gap_active, gross, 'same time, same device: the larger id');
});

test('3b-0 lastWinsOrder: Zeit, dann Geraete-Kennung, dann id; nur gueltige "Letzte gilt"-Ereignisse, jede id einmal; das letzte je Feld ist der lastWins-Gewinner', () => {
  const next = seeded(59), r = bytesOf(next), t0 = NOW - 9 * HOUR, E = [];
  for (let i = 0; i < 300; i++) {
    const ms = t0 + Math.floor(next() * 20) * 1000, device = ['d_a1', 'd_b1', 'd_k1'][Math.floor(next() * 3)], s = ['X', 'Y', 'Z'][Math.floor(next() * 3)];
    const k = next();
    E.push(k < 0.5 ? gap(s, ['closed', 'hold', 'open'][i % 3], i % 2 ? 'app' : 'parents', { ms, device, rand: r }) : k < 0.7 ? aktiv(next() < 0.2 ? null : s, { ms, device, rand: r }) : k < 0.9 ? name('n' + i, ms, device, r) : answer(device, i, ms, r));
  }
  E.push(E[0], E[5], { ...E[1], v: 2 });
  const o = lastWinsOrder(E, NOW);
  assert.equal(new Set(o.map((e) => e.id)).size, o.length, 'each id once');
  assert.ok(o.every((e) => fieldKey(e) && checkEvent(e).length === 0), 'only valid "last wins" events');
  assert.equal(o.length, new Set(E.filter((e) => fieldKey(e) && !checkEvent(e).length).map((e) => e.id)).size);
  for (let i = 1; i < o.length; i++) {
    const a = o[i - 1], b = o[i], ta = Date.parse(a.at), tb = Date.parse(b.at);
    assert.ok(ta < tb || (ta === tb && (a.device < b.device || (a.device === b.device && a.id < b.id))), 'order at ' + i);
  }
  const last = {}; for (const e of o) last[fieldKey(e)] = e;
  assert.deepEqual(lastWins(E, NOW), Object.fromEntries(Object.keys(last).sort().map((k) => [k, last[k]])));
  for (let i = 0; i < 20; i++) assert.deepEqual(lastWinsOrder(shuffled(E, next), NOW), o, 'run ' + i);
  assert.deepEqual(lastWinsOrder(undefined, NOW), []);
});

/* ---------- size and source ---------- */
test('Groessenordnung: 2 x 5 000 Ereignisse (Konzept 9.3) lassen sich zusammenfuehren', () => {
  const r = bytesOf(seeded(43)), A = [], B = [];
  for (let i = 0; i < 5000; i++) { A.push(answer('d_a1', i, NOW - 200 * HOUR + i * 60000, r)); B.push(answer('d_b1', 10000 + i, NOW - 200 * HOUR + i * 60000 + 30000, r)); }
  const t = Date.now(), m = mergeLog([A, B], NOW);
  console.log(`  mergeLog 2 x 5 000 Ereignisse (Node, dieser Rechner): ${Date.now() - t} ms`);
  assert.equal(m.events.length, 10000);
  assert.deepEqual(m.events, mergeLog([B, A], NOW).events);
});

test('Zufall und Uhr nur uebergeben: kein Math.random, kein Date.now, kein new Date() ohne Argument im Modul', () => {
  const src = fs.readFileSync(new URL('../../src/module/ereignisse.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random/);
  assert.doesNotMatch(src, /Date\.now/);
  assert.doesNotMatch(src, /new Date\(\s*\)/);
  assert.doesNotMatch(src, /\b(localStorage|sessionStorage|indexedDB|fetch|document|window)\b/);
});
