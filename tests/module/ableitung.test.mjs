// Modul ableitung ohne Browser (S12 P2, Aufgabe 3a; US7.2): der Stand in den bisherigen Speicherformaten aus Ereignissen.
// Jeder Wert hat einen Fall mit von Hand gerechnetem Ergebnis; dazu Reihenfolge, Wiederholung und Basisstand.
// Der Vergleich mit der echten App steht in tests/ableitung-vergleich.test.mjs.
//   node --test tests/module/ableitung.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { newEvent } from '../../src/module/ereignisse.mjs';
import { derive, DERIVE_LIMITS, DERIVE_GAPS, DERIVE_TREE_AT, DERIVE_RANKS } from '../../src/module/ableitung.mjs';

/* ---------- helpers ---------- */
function seeded(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const bytesOf = (next) => (n) => Uint8Array.from({ length: n }, () => Math.floor(next() * 256));
const shuffled = (list, next) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const iso = (ms) => new Date(ms).toISOString().replace('.000Z', 'Z');
const T0 = Date.parse('2026-11-02T10:00:00Z'), NOW = Date.parse('2027-03-01T00:00:00Z');
const dayOf = (i) => new Date(Date.parse('2026-11-02T12:00:00Z') + i * 86400000).toISOString().slice(0, 10);
const D1 = dayOf(0), D2 = dayOf(1), D3 = dayOf(2);
const NEU = { attempts: [], ev: {}, due: [], total: 0, badges: {}, tried: [], treeStage: 0, sheets: [], sheetNo: 0, _days: [] };

/* a story: events with strictly increasing times, one minute apart (gap: minutes to the previous one) */
function story(seed = 1) {
  const rand = bytesOf(seeded(seed)), list = []; let min = 0;
  const add = (type, payload, { gap = 1, device = 'd_a1' } = {}) => { min += gap; const e = newEvent({ type, author: 'p_k1', device, at: iso(T0 + min * 60000), payload }, { rand }); list.push(e); return e; };
  const answer = (p, o) => add('answer', { day: D1, skill: 'round', level: 2, attempt: 1, ok: true, qid: 'q1', ...p }, o);
  return { list, add, answer, rows: () => list.map((e) => e.payload) };
}
const run = (events, opts = {}) => derive(events, { now: NOW, ...opts });
const q = (world, extra = {}) => ({ world, kind: 'type', prompt: 'prompt of ' + world, answer: '4', ...extra });

/* ---------- start ---------- */
test('Leere Liste: die Werte eines neuen Kindes; "now" ist Pflicht', () => {
  assert.deepEqual(run([]), NEU);
  assert.deepEqual(run(undefined), NEU);
  assert.deepEqual(run(null), NEU);
  assert.throws(() => derive([]), /"now" is missing/);
  assert.throws(() => derive([], { now: NOW, base: { upTo: 'gestern', state: NEU } }), /base\.upTo/);
  assert.deepEqual(DERIVE_LIMITS, { attempts: 200, evidence: 60, due: 40, sheets: 8 });
  assert.deepEqual(DERIVE_GAPS, [1, 3, 7]);
  assert.deepEqual(DERIVE_TREE_AT, [0, 1, 3, 6, 10, 15, 25]);
  assert.deepEqual(DERIVE_RANKS, ['Explorer', 'Investigator', 'Scientist', 'Professor', 'Legend']);
});

/* ---------- attempts and ev ---------- */
test('attempts: jede Antwort steht so da, wie die App sie heute speichert, in Zeitfolge; ev: erste Antwort zaehlt, Hilfe = Stuetzstufe', () => {
  const v = story();
  v.answer({ ok: true });                                                                                       // 1  [D1,2,1]
  v.answer({ ok: false, qid: 'q2', family: 'rounding', response: '7', help: false, example: false });          // 2  [D1,2,0]
  v.answer({ attempt: 2, ok: true, qid: 'q2', help: true });                                                    // 3  second try: no ev row
  v.answer({ attempt: 0, ok: false, help: true, hintShown: true, qid: 'q3', level: 3 });                        // 4  tip before the first try: no ev row
  v.answer({ attempt: 1, ok: true, help: true, level: 3, qid: 'q3' });                                          // 5  with help: support level  [D1,1,1]
  v.answer({ attempt: 0, ok: false, help: true, exampleShown: true, qid: 'q4', level: 3 });                    // 6  no ev row
  v.answer({ attempt: 1, ok: true, help: false, level: 3, qid: 'q4' });                                         // 7  [D1,3,1]
  v.answer({ attempt: 0, ok: false, help: true, solutionShown: true, beforeTry: true, qid: 'q5', level: 3 });   // 8  answer shown first: not passed, support level  [D1,1,0]
  v.answer({ attempt: 1, ok: false, qid: 'q6' });                                                               // 9  [D1,2,0]
  v.answer({ attempt: 1, ok: false, help: true, solutionShown: true, qid: 'q6' });                              // 10 after the try: no new row
  v.answer({ skill: 'units', level: 1, qid: 'u1' });                                                            // 11 [D1,1,1] (other skill)
  v.answer({ attempt: 1, ok: true, level: 2, qid: 'q7', day: D2 });                                             // 12 [D2,2,1]
  const s = run(shuffledCopy(v.list, 5));
  assert.deepEqual(s.attempts, v.rows(), 'attempts = the stored rows, in the order of the events');
  assert.deepEqual(s.ev, { round: [[D1, 2, 1], [D1, 2, 0], [D1, 1, 1], [D1, 3, 1], [D1, 1, 0], [D1, 2, 0], [D2, 2, 1]], units: [[D1, 1, 1]] });
  assert.deepEqual(s._days, [D1, D2]);
});
const shuffledCopy = (list, seed) => shuffled(list, seeded(seed));

test('Kuerzungen: attempts auf 200, ev auf 60 je Quest (die juengsten bleiben)', () => {
  const v = story(2);
  for (let i = 0; i < 250; i++) v.answer({ skill: i % 5 === 0 ? 'units' : 'round', level: 1 + (i % 3), ok: i % 2 === 0, qid: 'q' + i });
  const s = run(v.list);
  assert.equal(s.attempts.length, 200);
  assert.deepEqual(s.attempts, v.rows().slice(-200), 'the latest 200');
  const round = v.rows().filter((r) => r.skill === 'round'), units = v.rows().filter((r) => r.skill === 'units');
  assert.equal(round.length, 200); assert.equal(units.length, 50);
  assert.equal(s.ev.round.length, 60);
  assert.deepEqual(s.ev.round, round.slice(-60).map((r) => [r.day, r.level, r.ok ? 1 : 0]));
  assert.equal(s.ev.units.length, 50, 'less than 60: all of them');
  assert.equal(DERIVE_LIMITS.attempts, 200); assert.equal(DERIVE_LIMITS.evidence, 60);
});

/* ---------- due ---------- */
test('due: Wiederholungen aus den "review"-Ereignissen (Stufe 0 -> 1 -> 2 -> erledigt), Ersetzen rueckt ans Ende', () => {
  const v = story(3), qa = { world: 'numbers', prompt: 'A', dueId: 'a' }, qb = { world: 'units', prompt: 'B', dueId: 'b' };
  v.add('review', { day: D1, qid: 'a', box: 0, dueAt: D2, question: qa });
  v.add('review', { day: D2, qid: 'a', box: 1, dueAt: dayOf(4) });                                  // 3 days later
  v.add('review', { day: D2, qid: 'b', box: 0, question: qb });                                    // dueAt missing: next day
  assert.deepEqual(run(v.list).due, [{ id: 'a', box: 1, at: dayOf(4), q: qa }, { id: 'b', box: 0, at: D3, q: qb }]);
  v.add('review', { day: dayOf(4), qid: 'a', box: 2 });                                            // dueAt missing: 7 days later
  assert.deepEqual(run(v.list).due[0], { id: 'a', box: 2, at: dayOf(11), q: qa });
  v.add('review', { day: dayOf(11), qid: 'a', box: 3 });                                           // done
  assert.deepEqual(run(v.list).due.map((d) => d.id), ['b']);
  v.add('review', { day: dayOf(12), qid: 'a', box: 0, question: qa });                             // wrong again later: new entry at the end
  assert.deepEqual(run(v.list).due.map((d) => [d.id, d.box, d.at]), [['b', 0, D3], ['a', 0, dayOf(13)]]);
  v.add('review', { day: dayOf(13), qid: 'b', box: 0, question: qb });                             // wrong again: replaced, moves to the end
  assert.deepEqual(run(v.list).due.map((d) => [d.id, d.box, d.at]), [['a', 0, dayOf(13)], ['b', 0, dayOf(14)]]);
  v.add('review', { day: dayOf(14), qid: 'zzz', box: 1 });                                         // unknown: ignored
  v.add('review', { day: dayOf(14), qid: 'n', box: 0 });                                           // no question: nothing to repeat
  v.add('review', { day: dayOf(14), qid: 'zzz', box: 3 });
  assert.deepEqual(run(v.list).due.map((d) => d.id), ['a', 'b']);
  assert.deepEqual(DERIVE_GAPS, [1, 3, 7]);
});

test('due: Datumsrechnung ueber Monats- und Jahresgrenze; hoechstens 40, aelteste fallen weg, Weiterschieben eines gefallenen geht ins Leere', () => {
  const v = story(4);
  v.add('review', { day: '2026-12-31', qid: 'j', box: 0, question: { world: 'numbers', prompt: 'J' } });
  v.add('review', { day: '2027-01-01', qid: 'j', box: 1 });
  v.add('review', { day: '2027-01-04', qid: 'j', box: 2 });
  v.add('review', { day: '2027-02-27', qid: 'k', box: 0, question: { world: 'numbers', prompt: 'K' } });
  const d = run(v.list).due;
  assert.deepEqual(d.map((x) => [x.id, x.box, x.at]), [['j', 2, '2027-01-11'], ['k', 0, '2027-02-28']]);
  const w = story(5);
  for (let i = 0; i < 45; i++) w.add('review', { day: D1, qid: 'q' + i, box: 0, question: { world: 'numbers', prompt: 'P' + i } });
  w.add('review', { day: D2, qid: 'q0', box: 1 });                                                 // q0 was dropped long ago
  w.add('review', { day: D2, qid: 'q44', box: 1 });
  const due = run(w.list).due;
  assert.equal(due.length, 40);
  assert.deepEqual(due.map((x) => x.id), Array.from({ length: 40 }, (_, i) => 'q' + (i + 5)));
  assert.ok(!due.some((x) => x.id === 'q0'));
  assert.equal(due[39].box, 1);
  assert.equal(DERIVE_LIMITS.due, 40);
});

/* ---------- total, best, badges, tried, rank ---------- */
test('total = Summe der Sterne, best_<quest> = Maximum (nur wenn mindestens 1 Stern), auch fuer "today"', () => {
  const v = story(6);
  assert.equal(run(v.list).total, 0);
  v.add('round_done', { day: D1, skill: 'round', stars: 5, count: 8 });
  v.add('round_done', { day: D1, skill: 'round', stars: 8, count: 8 });
  v.add('round_done', { day: D1, skill: 'round', stars: 3, count: 8 });
  v.add('round_done', { day: D1, skill: 'units', stars: 0, count: 8 });
  v.add('round_done', { day: D1, skill: 'today', stars: 6, count: 8 });
  const s = run(v.list);
  assert.equal(s.total, 22);
  assert.equal(s.best_round, 8, 'maximum, not the sum (16)');
  assert.equal('best_units' in s, false, 'no stars: the app stores nothing');
  assert.equal(s.best_today, 6);
});

test('badges zaehlen je Art; tried nur durch "inquirer" mit Quest, in der Reihenfolge des ersten Mals, ohne Doppelte', () => {
  const v = story(7);
  v.add('badge', { day: D1, badge: 'inquirer', skill: 'round' });
  v.add('badge', { day: D1, badge: 'thinker' });
  v.add('badge', { day: D1, badge: 'thinker', skill: 'graphs' });                                  // a skill on another badge says nothing about "tried"
  v.add('badge', { day: D1, badge: 'inquirer', skill: 'units' });
  v.add('badge', { day: D2, badge: 'inquirer', skill: 'round' });                                  // same quest again: counted, not listed twice
  v.add('badge', { day: D2, badge: 'principled' });
  v.add('badge', { day: D2, badge: 'inquirer' });                                                  // without quest: counted only
  const s = run(v.list);
  assert.deepEqual(s.badges, { inquirer: 4, thinker: 2, principled: 1 });
  assert.deepEqual(s.tried, ['round', 'units']);
});

test('rankSeen: der hoechste Titel; nie niedriger; unbekannte Titel zaehlen nicht; ohne Ereignis kein Schluessel', () => {
  const v = story(8);
  assert.equal('rankSeen' in run(v.list), false);
  v.add('rank_seen', { rank: 'Explorer' });
  assert.equal(run(v.list).rankSeen, 'Explorer');
  v.add('rank_seen', { rank: 'Scientist' });
  v.add('rank_seen', { rank: 'Investigator' });                                                    // later, but lower
  v.add('rank_seen', { rank: 'Grandmaster' });                                                     // not a title
  assert.equal(run(v.list).rankSeen, 'Scientist');
  v.add('rank_seen', { rank: 'Legend' });
  assert.equal(run(v.list).rankSeen, 'Legend');
});

/* ---------- tree ---------- */
test('treeStage: Stufe aus den Uebungstagen (1, 3, 6, 10, 15, 25), jeder Tag einmal, steigt nur', () => {
  const erwartet = [[0, 0], [1, 1], [2, 1], [3, 2], [5, 2], [6, 3], [9, 3], [10, 4], [14, 4], [15, 5], [24, 5], [25, 6], [40, 6]];
  for (const [tage, stufe] of erwartet) {
    const v = story(9);
    for (let i = 0; i < tage; i++) v.add('practice_day', { day: dayOf(i) });
    for (let i = 0; i < tage; i++) v.add('practice_day', { day: dayOf(i) });                       // the same days again: still counted once
    const s = run(v.list);
    assert.equal(s.treeStage, stufe, tage + ' days');
    assert.equal(s._days.length, tage);
  }
  // days also come from answers (first tries and answers shown) and from sheets with an entry
  const v = story(10);
  v.answer({ day: dayOf(0) }); v.answer({ day: dayOf(0), qid: 'x' }); v.answer({ day: dayOf(1), ok: false });
  v.answer({ day: dayOf(2), attempt: 2 });                                                          // a second try is no new evidence: no day
  v.answer({ day: dayOf(3), hintShown: true, attempt: 0, ok: false, help: true });                 // a tip alone is no practice day
  v.answer({ day: dayOf(4), solutionShown: true, beforeTry: true, attempt: 0, ok: false, help: true });
  assert.deepEqual(run(v.list)._days, [dayOf(0), dayOf(1), dayOf(4)]);
  v.add('sheet_created', { sheet: 's1', day: dayOf(7), no: 1, writing: 'en', items: [{ q: q('round'), res: null }] });
  assert.deepEqual(run(v.list)._days, [dayOf(0), dayOf(1), dayOf(4)], 'a sheet without an entry is no day');
  v.add('sheet_result', { sheet: 's1', index: 0, res: 'ok', day: dayOf(9), qid: 'qq' });
  assert.deepEqual(run(v.list)._days, [dayOf(0), dayOf(1), dayOf(4), dayOf(7), dayOf(9)], 'the day of the sheet and the day of the entry');
  assert.equal(run(v.list).treeStage, 2);
});

/* ---------- sheets ---------- */
function blatt(v, id, no, day = D1) {
  return v.add('sheet_created', { sheet: id, day, no, writing: 'en', items: [{ q: q('round', { level: 2 }), res: null }, { q: q('units', { level: 3 }), res: null }, { q: q('round'), res: null }] });
}
test('sheets: Ergebnisse eintragen wie die App (Eintrag in ev und attempts, Merkzettel rec), Korrektur nimmt den alten Eintrag genau zurueck, principled einmal', () => {
  const v = story(11);
  blatt(v, 's1', 1);
  let s = run(v.list);
  assert.deepEqual(s.sheets, [{ id: 's1', day: D1, no: 1, writing: 'en', items: [{ q: q('round', { level: 2 }), res: null }, { q: q('units', { level: 3 }), res: null }, { q: q('round'), res: null }] }]);
  assert.equal(s.sheetNo, 1);
  v.add('sheet_result', { sheet: 's1', index: 0, res: 'ok', day: D2, qid: 'k0' });
  v.add('sheet_result', { sheet: 's1', index: 1, res: 'help', day: D2, qid: 'k1' });
  s = run(v.list);
  assert.deepEqual(s.ev, { round: [[D2, 2, 1]], units: [[D2, 1, 1]] }, 'help = support level, whatever the level of the task');
  assert.deepEqual(s.attempts, [
    { day: D2, skill: 'round', level: 2, attempt: 1, ok: true, help: false, sheet: 's1:0' },
    { day: D2, skill: 'units', level: 3, attempt: 1, ok: true, help: true, sheet: 's1:1' },
  ]);
  assert.deepEqual(s.sheets[0].items[0], { q: q('round', { level: 2 }), res: 'ok', rec: { ev: [D2, 2, 1], key: 's1:0', due: null } });
  assert.equal(s.sheets[0].principled, undefined, 'one task is still open');
  v.add('sheet_result', { sheet: 's1', index: 2, res: 'no', day: D2, qid: 'k2' });
  s = run(v.list);
  assert.deepEqual(s.ev.round, [[D2, 2, 1], [D2, 2, 0]], 'a task without a level counts as level 2');
  assert.deepEqual(s.sheets[0].items[2], { q: q('round'), res: 'no', rec: { ev: [D2, 2, 0], key: 's1:2', due: 'k2' } });
  assert.equal(s.sheets[0].principled, true, 'every task has an entry');
  assert.deepEqual(s.badges, {}, 'the badge itself is its own event');
  // correction: the first task was entered wrongly
  v.add('sheet_result', { sheet: 's1', index: 0, res: 'no', day: D3, qid: 'k0' });
  s = run(v.list);
  assert.deepEqual(s.ev.round, [[D2, 2, 0], [D3, 2, 0]], 'the old entry is taken back, the new one is appended');
  assert.deepEqual(s.attempts.map((a) => a.sheet), ['s1:1', 's1:2', 's1:0']);
  assert.equal(s.attempts[2].ok, false);
  assert.deepEqual(s.sheets[0].items[0].rec, { ev: [D3, 2, 0], key: 's1:0', due: 'k0' });
  assert.equal(s.sheets[0].principled, true, 'stays');
  // the same result again changes nothing
  const vorher = run(v.list);
  v.add('sheet_result', { sheet: 's1', index: 0, res: 'no', day: dayOf(5), qid: 'k0' });
  assert.deepEqual(run(v.list), vorher);
  // back again: one entry for the task
  v.add('sheet_result', { sheet: 's1', index: 0, res: 'ok', day: dayOf(6), qid: 'k0' });
  s = run(v.list);
  assert.equal(s.ev.round.length, 2);
  assert.deepEqual(s.ev.round.slice(-1), [[dayOf(6), 2, 1]]);
  assert.equal(s.attempts.filter((a) => a.sheet === 's1:0').length, 1);
});

test('sheets: Blatt ohne Ergebnis verwerfen; hoechstens 8 Blaetter; sheetNo = hoechste Nummer; Ergebnisse fuer unbekannte Blaetter oder Aufgaben zaehlen nicht', () => {
  const v = story(12);
  blatt(v, 's1', 1); blatt(v, 's2', 2);
  v.add('sheet_discarded', { sheet: 's2' });
  let s = run(v.list);
  assert.deepEqual(s.sheets.map((x) => x.id), ['s1']);
  assert.equal(s.sheetNo, 2, 'the number was used');
  v.add('sheet_result', { sheet: 'nope', index: 0, res: 'ok', day: D1, qid: 'x' });
  v.add('sheet_result', { sheet: 's1', index: 9, res: 'ok', day: D1, qid: 'x' });
  v.add('sheet_result', { sheet: 's2', index: 0, res: 'ok', day: D1, qid: 'x' });                  // discarded
  s = run(v.list);
  assert.deepEqual([s.ev, s.attempts], [{}, []]);
  v.add('sheet_created', { sheet: 's1', day: D2, no: 7, writing: 'de', items: [] });               // the same sheet twice: the first one stays
  s = run(v.list);
  assert.deepEqual([s.sheets.length, s.sheets[0].no, s.sheets[0].items.length, s.sheetNo], [1, 1, 3, 2]);
  // 8 at most; a result for a sheet that fell out is ignored, what it wrote before stays
  const w = story(13);
  blatt(w, 'a1', 1);
  w.add('sheet_result', { sheet: 'a1', index: 0, res: 'ok', day: D1, qid: 'x' });
  for (let i = 2; i <= 10; i++) blatt(w, 'a' + i, i);
  w.add('sheet_result', { sheet: 'a1', index: 1, res: 'ok', day: D2, qid: 'x' });
  w.add('sheet_created', { sheet: 'z', day: D2, no: 3, writing: 'en', items: [{ q: q('round'), res: null }] });   // a lower number than before
  s = run(w.list);
  assert.deepEqual(s.sheets.map((x) => x.id), ['a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10', 'z']);
  assert.equal(s.sheetNo, 10, 'highest number, not the count');
  assert.deepEqual(s.ev, { round: [[D1, 2, 1]] }, 'the early entry stays, the late one for a dropped sheet is ignored');
  assert.equal(s.attempts.length, 1);
  assert.equal(DERIVE_LIMITS.sheets, 8);
});

/* ---------- last wins ---------- */
test('"Letzte gilt": Profil, Einstellungen, Tageshinweise und Haken der Checkliste in den bisherigen Schluesseln', () => {
  const v = story(14);
  v.add('profile_set', { field: 'name', value: 'Anna' }); v.add('profile_set', { field: 'name', value: 'Kathie' });
  v.add('profile_set', { field: 'birthday', value: '2017-05-12' }); v.add('profile_set', { field: 'emoji', value: '🦊' });
  v.add('profile_set', { field: 'kidLang', value: 'de' });
  v.add('setting_set', { setting: 'focusMode', value: 'manual' });
  v.add('setting_set', { setting: 'focusManual', value: ['round', 'units'] });
  v.add('setting_set', { setting: 'unlocked', value: ['x'] }); v.add('setting_set', { setting: 'storyCap', value: 3 });
  v.add('day_flag', { flag: 'greetDay', day: D1 }); v.add('day_flag', { flag: 'greetDay', day: D2 });
  v.add('day_flag', { flag: 'mysteryDone', day: D1 }); v.add('day_flag', { flag: 'bdayParty', day: D3 });
  v.add('checklist_set', { studio: 'grow', index: 2, value: true });
  v.add('checklist_set', { studio: 'grow', index: 0, value: true });
  v.add('checklist_set', { studio: 'grow', index: 0, value: false });
  v.add('checklist_set', { studio: 'read', index: 1, value: true });
  const s = run(shuffledCopy(v.list, 3));
  const { attempts, ev, due, total, badges, tried, treeStage, sheets, sheetNo, _days, ...rest } = s;
  assert.deepEqual(rest, {
    name: 'Kathie', birthday: '2017-05-12', emoji: '🦊', kidLang: 'de', focusMode: 'manual', focusManual: ['round', 'units'], unlocked: ['x'], storyCap: 3,
    greetDay: D2, mysteryDone: D1, bdayParty: D3, chk_grow: [false, false, true], chk_read: [false, true],
  });
  // a cleared field is no stored key; a later value brings it back
  v.add('profile_set', { field: 'birthday', value: null }); v.add('profile_set', { field: 'emoji', value: null });
  v.add('profile_set', { field: 'emoji', value: 'x' });
  const t = run(v.list);
  assert.equal('birthday' in t, false);
  assert.equal(t.emoji, 'x');
});

test('"Letzte gilt": bei gleichem Zeitpunkt entscheidet die groessere Geraete-Kennung, auf beiden Geraeten gleich', () => {
  const rand = bytesOf(seeded(15)), at = iso(T0);
  const mk = (value, device) => newEvent({ type: 'profile_set', author: 'p_k1', device, at, payload: { field: 'name', value } }, { rand });
  const a = mk('A', 'd_a1'), b = mk('B', 'd_b1');
  assert.equal(run([a, b]).name, 'B'); assert.equal(run([b, a]).name, 'B');
});

/* ---------- order, repetition, base ---------- */
function bigStory(seed, n = 260) {
  const next = seeded(seed), v = story(seed), pick = (arr) => arr[Math.floor(next() * arr.length)];
  const skills = ['round', 'units', 'graphs', 'numbers'], sheetIds = [];
  let day = 0;
  for (let i = 0; i < n; i++) {
    if (i % 15 === 0) day++;
    const d = dayOf(day), r = next(), skill = pick(skills), qid = 'q' + Math.floor(next() * 14);
    if (r < 0.38) {
      const k = next(), attempt = pick([0, 1, 1, 1, 2]), flag = k < 0.1 ? { hintShown: true } : k < 0.18 ? { exampleShown: true } : k < 0.28 ? { solutionShown: true, ...(attempt === 0 ? { beforeTry: true } : {}) } : {};
      v.add('answer', { day: d, skill, level: pick([1, 2, 3]), attempt, ok: next() < 0.6 && !flag.solutionShown, qid, help: next() < 0.3 || !!flag.hintShown, ...flag }, { device: pick(['d_a1', 'd_b1']) });
    } else if (r < 0.46) v.add('round_done', { day: d, skill: pick([...skills, 'today']), stars: Math.floor(next() * 9), count: 8 });
    else if (r < 0.52) v.add('badge', { day: d, badge: pick(['inquirer', 'thinker', 'riskTaker']), ...(next() < 0.6 ? { skill } : {}) });
    else if (r < 0.64) { const box = pick([0, 0, 1, 2, 3]); v.add('review', { day: d, qid, box, ...(box === 0 ? { question: { world: skill, prompt: qid } } : {}), ...(next() < 0.5 && box < 3 ? { dueAt: dayOf(day + 1 + box) } : {}) }); }
    else if (r < 0.68) v.add('rank_seen', { rank: pick([...DERIVE_RANKS, 'Nobody']) });
    else if (r < 0.71) v.add('practice_day', { day: d });
    else if (r < 0.77) { const id = 's' + sheetIds.length; sheetIds.push(id); v.add('sheet_created', { sheet: id, day: d, no: sheetIds.length, writing: 'en', items: [0, 1, 2].map((j) => ({ q: q(pick(skills), next() < 0.5 ? { level: pick([1, 2, 3]) } : {}), res: null })) }); }
    else if (r < 0.89 && sheetIds.length) v.add('sheet_result', { sheet: pick(sheetIds), index: Math.floor(next() * 3), res: pick(['ok', 'help', 'no']), day: d, qid });
    else if (r < 0.9 && sheetIds.length) v.add('sheet_discarded', { sheet: pick(sheetIds) });
    else if (r < 0.94) v.add('profile_set', { field: pick(['name', 'emoji', 'birthday']), value: next() < 0.2 ? null : pick(['a', 'b', 'c']) }, { device: pick(['d_a1', 'd_b1']) });
    else if (r < 0.97) v.add('setting_set', { setting: pick(['focusMode', 'storyCap', 'unlocked']), value: pick(['x', 3, ['a']]) });
    else if (r < 0.98) v.add('day_flag', { flag: pick(['greetDay', 'mysteryDone', 'bdayParty']), day: d });
    else v.add('checklist_set', { studio: pick(['grow', 'read']), index: Math.floor(next() * 5), value: next() < 0.5 });
  }
  return v.list;
}

test('Reihenfolge und Wiederholung: gemischt, in Teilen und doppelt geliefert ergibt denselben Stand (100 Laeufe)', () => {
  const list = bigStory(21), soll = run(list), next = seeded(22);
  assert.ok(soll.attempts.length > 50 && Object.keys(soll.ev).length >= 3 && soll.due.length > 0 && soll.sheets.length > 0 && soll.total > 0 && soll.tried.length > 0, 'the story reaches every value');
  for (let lauf = 0; lauf < 100; lauf++) {
    const mix = shuffled(list, next), a = [], b = [];
    for (const e of mix) { (next() < 0.5 ? a : b).push(e); if (next() < 0.25) a.push(e); if (next() < 0.25) b.push(e); }
    assert.deepEqual(run([...a, ...b]), soll, 'run ' + lauf);
  }
});

test('Basisstand: Stand der fruehen Ereignisse + spaetere Ereignisse = alle Ereignisse zusammen (zufaellige Schnitte, auch genau auf einem Ereignis)', () => {
  const list = bigStory(23), alle = run(list), next = seeded(24);
  const sortiert = list.slice().sort((x, y) => (Date.parse(x.at) - Date.parse(y.at)) || (x.id < y.id ? -1 : 1));
  for (let lauf = 0; lauf < 60; lauf++) {
    const k = lauf === 0 ? 0 : lauf === 1 ? sortiert.length - 1 : Math.floor(next() * sortiert.length);
    const upTo = sortiert[k].at;                                                                   // the cut lies exactly on an event: that one belongs to the base
    const frueh = sortiert.filter((e) => Date.parse(e.at) <= Date.parse(upTo)), spaet = sortiert.filter((e) => Date.parse(e.at) > Date.parse(upTo));
    const basis = JSON.parse(JSON.stringify(run(frueh)));                                          // as if it came from a snapshot
    const kopie = JSON.stringify(basis);
    assert.deepEqual(run(spaet, { base: { upTo, state: basis } }), alle, 'cut ' + k);
    assert.equal(JSON.stringify(basis), kopie, 'the base is not changed');
    assert.deepEqual(run(shuffled(list, next), { base: { upTo, state: basis } }), alle, 'all events plus base: the early ones count once (cut ' + k + ')');
  }
  assert.deepEqual(run([], { base: { upTo: iso(T0), state: alle } }), alle, 'a base alone is returned unchanged');
});

test('Basisstand aus einer aelteren Quelle (nur Speicherformat, ohne _days): treeStage sinkt nie, Listen werden fortgefuehrt', () => {
  const basis = { attempts: [{ day: D1, skill: 'round', level: 2, attempt: 1, ok: true, qid: 'a' }], ev: { round: [[D1, 2, 1]] }, due: [], total: 12, badges: { thinker: 1 }, tried: ['round'], treeStage: 3, sheets: [], sheetNo: 4, rankSeen: 'Investigator', best_round: 7, name: 'Kathie' };
  const v = story(26);
  v.answer({ day: D2, qid: 'b', level: 3 });
  v.add('round_done', { day: D2, skill: 'round', stars: 5, count: 8 });
  v.add('rank_seen', { rank: 'Explorer' });
  const s = run(v.list, { base: { upTo: iso(T0 - 1000), state: basis } });
  assert.equal(s.treeStage, 3, 'one new day does not lower the stage the child already has');
  assert.equal(s.total, 17); assert.equal(s.best_round, 7); assert.equal(s.rankSeen, 'Investigator');
  assert.equal(s.attempts.length, 2); assert.deepEqual(s.ev.round, [[D1, 2, 1], [D2, 3, 1]]);
  assert.equal(s.name, 'Kathie'); assert.deepEqual(s.tried, ['round']); assert.equal(s.sheetNo, 4);
  assert.deepEqual(s._days, [D2]);
});

test('Ungueltiges und Boeses: ungueltige Ereignisse zaehlen nicht, Namen aus Ereignissen sind keine Objekt-Eigenschaften', () => {
  const v = story(25);
  v.answer({ qid: 'ok1' });
  const kaputt = { ...v.answer({ qid: 'bad' }), v: 2 };
  v.list.pop(); v.list.push(kaputt);
  assert.equal(run(v.list).attempts.length, 1);
  v.answer({ skill: '__proto__', qid: 'p' });                                                      // would change the prototype of ev
  v.answer({ skill: 'constructor', qid: 'c' });
  v.add('badge', { day: D1, badge: '__proto__' }); v.add('badge', { day: D1, badge: 'constructor' }); v.add('badge', { day: D1, badge: 'toString' });
  v.add('round_done', { day: D1, skill: '__proto__', stars: 3, count: 8 });
  v.add('sheet_created', { sheet: 'h', day: D1, no: 1, writing: 'en', items: [{ q: q('__proto__'), res: null }] });
  v.add('sheet_result', { sheet: 'h', index: 0, res: 'ok', day: D1, qid: 'x' });
  v.add('sheet_result', { sheet: 'h', index: 0, res: 'no', day: D1, qid: 'x' });
  const s = run(v.list);
  assert.deepEqual(Object.keys(s.ev).sort(), ['constructor', 'round'], 'only real own keys');
  assert.equal(Object.getPrototypeOf(s.ev), Object.prototype);
  assert.equal(s.ev.constructor.length, 1);
  assert.deepEqual(s.badges, { constructor: 1, toString: 1 });
  assert.equal(s.total, 3);
  assert.equal({}.polluted, undefined);
});

test('Nur uebergebene Uhr, kein Zufall, kein Speicher, kein Netz im Modul', () => {
  const src = fs.readFileSync(new URL('../../src/module/ableitung.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|new Date\(\s*\)/);
  assert.doesNotMatch(src, /\b(localStorage|sessionStorage|indexedDB|fetch|document|window|crypto)\b/);
});
