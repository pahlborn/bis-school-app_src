// Modul schnappschuss ohne Browser (S12 P2, Aufgabe 5; US7.6; Konzept 9.3).
// Erfolgskriterium: Schnappschuss + Rest ergibt immer denselben Stand wie alle Ereignisse ohne Schnappschuss -
// auch wenn Ereignisse verspaetet, doppelt, gemischt oder mit falscher Uhr eintreffen.
//   node --test tests/module/schnappschuss.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { newEvent, checkEvent, mergeLog, EVENT_FUTURE_MS } from '../../src/module/ereignisse.mjs';
import { derive, DERIVE_LIMITS, DERIVE_RANKS } from '../../src/module/ableitung.mjs';
import { signEvent, acceptEvent } from '../../src/module/annahme.mjs';
import { newPersonKeys, publicKeysOf } from '../../src/module/krypto.mjs';
import { SNAPSHOT_EVERY, needsSnapshot, makeSnapshot, stateFrom } from '../../src/module/schnappschuss.mjs';

/* ---------- helpers: fixed random numbers, so every run is the same ---------- */
function seeded(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const bytesOf = (next) => (n) => Uint8Array.from({ length: n }, () => Math.floor(next() * 256));
const shuffled = (list, next) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const iso = (ms) => new Date(ms).toISOString();
const T0 = Date.parse('2026-09-01T07:00:00Z'), NOW = Date.parse('2027-01-15T12:00:00Z'), DAY_MS = 24 * 3600 * 1000;
const PARENT = { author: 'p_e1', device: 'd_e1' };
const SKILLS = ['round', 'units', 'graphs', 'numbers'];
const json = (x) => JSON.parse(JSON.stringify(x));
const run = (events, now = NOW) => derive(events, { now });

/* one child with two iPads, one parent; every type the state knows; 5 % of the events share the time of the one before */
function familie(seed, n, start = T0) {
  const next = seeded(seed), rand = bytesOf(seeded(seed + 1000)), pick = (a) => a[Math.floor(next() * a.length)];
  const list = [], sheetIds = [];
  let ms = start;
  const add = (type, payload, { author = 'p_k1', device = pick(['d_k1', 'd_k2']) } = {}) => list.push(newEvent({ type, author, device, at: iso(ms), payload }, { rand }));
  for (let i = 0; i < n; i++) {
    if (i > 0 && next() > 0.05) ms += 1 + Math.floor(next() * 40 * 60000);
    const d = iso(ms).slice(0, 10), r = next(), skill = pick(SKILLS), qid = 'q' + Math.floor(next() * 300);
    if (r < 0.40) {
      const k = next(), attempt = pick([0, 1, 1, 1, 2]), flag = k < 0.1 ? { hintShown: true } : k < 0.18 ? { exampleShown: true } : k < 0.28 ? { solutionShown: true, ...(attempt === 0 ? { beforeTry: true } : {}) } : {};
      add('answer', { day: d, skill, level: pick([1, 2, 3]), attempt, ok: next() < 0.6 && !flag.solutionShown, qid, help: next() < 0.3 || !!flag.hintShown, ...flag });
    } else if (r < 0.46) add('round_done', { day: d, skill: pick([...SKILLS, 'today']), stars: Math.floor(next() * 9), count: 8 });
    else if (r < 0.50) add('badge', { day: d, badge: pick(['inquirer', 'thinker', 'principled']), ...(next() < 0.6 ? { skill } : {}) });
    else if (r < 0.64) { const box = pick([0, 0, 0, 1, 2, 3]); add('review', { day: d, qid, box, ...(box === 0 ? { question: { world: skill, prompt: qid } } : {}), ...(next() < 0.5 && box < 3 ? { dueAt: d } : {}) }); }
    else if (r < 0.66) add('rank_seen', { rank: pick(DERIVE_RANKS) });
    else if (r < 0.68) add('practice_day', { day: d });
    else if (r < 0.72) { const id = 's' + sheetIds.length; sheetIds.push(id); add('sheet_created', { sheet: id, day: d, no: sheetIds.length, writing: 'en', items: [0, 1, 2].map(() => ({ q: { world: pick(SKILLS), prompt: 'p' + Math.floor(next() * 50), ...(next() < 0.5 ? { level: pick([1, 2, 3]) } : {}) }, res: null })) }); }
    else if (r < 0.82 && sheetIds.length) add('sheet_result', { sheet: pick(sheetIds.slice(-10)), index: Math.floor(next() * 3), res: pick(['ok', 'help', 'no']), day: d, qid });
    else if (r < 0.83 && sheetIds.length) add('sheet_discarded', { sheet: pick(sheetIds.slice(-10)) }, { ...PARENT });
    else if (r < 0.87) add('profile_set', { field: pick(['name', 'emoji', 'birthday']), value: next() < 0.2 ? null : pick(['a', 'b', 'c']) });
    else if (r < 0.90) add('setting_set', { setting: pick(['focusMode', 'storyCap', 'unlocked']), value: pick(['x', 3, ['a']]) }, { ...PARENT });
    else if (r < 0.92) add('day_flag', { flag: pick(['greetDay', 'mysteryDone', 'bdayParty']), day: d });
    else if (r < 0.94) add('checklist_set', { studio: pick(['grow', 'read']), index: Math.floor(next() * 5), value: next() < 0.5 });
    else if (r < 0.98) { const by = pick(['app', 'parents']); add('gap_state', { standard: pick(['S1', 'S2', 'S3']), state: by === 'app' ? 'closed' : pick(['closed', 'hold', 'open']), by, schoolDay: pick(['2026-08-20', '2026-10-01', '2026-12-01']), day: d }, by === 'parents' ? { ...PARENT } : {}); }
    else if (r < 0.99) add('gap_active', { standard: next() < 0.3 ? null : pick(['S1', 'S2', 'S3']) }, { ...PARENT });
    else add('school_import', { asOf: d, data: { round: 'M' } }, { ...PARENT });          // not part of the state: still counted
  }
  return list;
}
/* the events in the order derive uses; split at k so that no event of the second part has the time of the first part's last */
const sortiert = (list, now = NOW) => mergeLog([list], now).events;
function teile(list, k) {
  const s = sortiert(list);
  while (k < s.length && s[k].at === s[k - 1].at) k++;
  return [s.slice(0, k), s.slice(k)];
}
let extraN = 0;
const extraRand = (n) => { extraN++; return Uint8Array.from({ length: n }, (_, i) => (extraN * 37 + i * 11 + 200) & 255); };
const answerAt = (ms, qid = 'spaet', device = 'd_k2') => newEvent({ type: 'answer', author: 'p_k1', device, at: iso(ms), payload: { day: iso(ms).slice(0, 10), skill: 'round', level: 2, attempt: 1, ok: false, qid } }, { rand: extraRand });
const snap = (events, now = NOW) => makeSnapshot(events, { now, ...PARENT });

const FAM = familie(5, 6000);
const [ALT, NEU] = teile(FAM, 5000);                       // ALT: what the parent knows when it writes the snapshot

/* ---------- 1 US7.6 ---------- */
test('US7.6: 6 000 Ereignisse - Schnappschuss + Rest = alle ohne Schnappschuss, auf dem alten und auf einem neuen Geraet', async () => {
  const s = await snap(ALT);
  assert.deepEqual(checkEvent(s), [], 'a valid event of format v1');
  assert.equal(s.type, 'snapshot');
  assert.equal(s.payload.count, ALT.length);
  assert.equal(s.payload.upTo, ALT[ALT.length - 1].at, 'upTo = time of the newest event it contains');
  assert.match(s.payload.idsHash, /^[0-9a-f]{64}$/);
  assert.deepEqual(s.payload.state, json(run(ALT)), 'state = derive of these events');
  const plus1 = answerAt(Date.parse(s.payload.upTo) + 1, 'plus1');            // exactly one millisecond after upTo: belongs to the rest
  const alle = [...FAM, plus1], soll = run(alle);
  const altesGeraet = await stateFrom([...alle, s], s, { now: NOW });
  assert.equal(altesGeraet.weg, 'schnappschuss');
  assert.deepEqual(altesGeraet.state, soll);
  const neuesGeraet = await stateFrom([...NEU, plus1], s, { now: NOW });       // only the snapshot and what came after
  assert.equal(neuesGeraet.weg, 'schnappschuss');
  assert.deepEqual(neuesGeraet.state, soll);
  assert.deepEqual(await stateFrom(alle, null, { now: NOW }), { state: soll, weg: 'voll' }, 'without a snapshot: all events');
  assert.deepEqual(s.payload.state, json(run(ALT)), 'stateFrom does not change the snapshot');
});

/* ---------- 2 late events ---------- */
test('Verspaetet: Ereignis mit frueherem Zeitpunkt nach dem Schnappschuss -> "voll" mit allen Ereignissen; neues Geraet -> erst nachladen', async () => {
  const s = await snap(ALT);
  const upTo = Date.parse(s.payload.upTo);
  for (const [wo, ms] of [['mitten drin', upTo - 30 * DAY_MS], ['genau auf upTo', upTo], ['ganz am Anfang', T0 - 1]]) {
    const L = answerAt(ms, 'offline-' + wo.length);
    const alle = [...FAM, L], soll = run(alle);
    assert.deepEqual(await stateFrom(alle, s, { now: NOW }), { state: soll, weg: 'voll' }, wo + ': device with all events');
    assert.deepEqual(await stateFrom([...NEU, L], s, { now: NOW }), { state: null, weg: 'nachladen' }, wo + ': new device');
    // the parent writes a new snapshot that contains the late event; old and new devices use it again
    const s2 = await snap([...alle, s], NOW + DAY_MS);                       // the old snapshot is in the log, too
    assert.equal(s2.payload.count, alle.length, 'an old snapshot is not counted');
    assert.equal(s2.payload.upTo, FAM[FAM.length - 1].at, 'and does not move upTo');
    assert.notEqual(s2.payload.idsHash, s.payload.idsHash);
    const spaeter = familie(77, 200, Date.parse(FAM[FAM.length - 1].at) + 60000);
    const soll2 = run([...alle, ...spaeter]);
    assert.deepEqual(await stateFrom([...alle, ...spaeter], s2, { now: NOW + 30 * DAY_MS }), { state: soll2, weg: 'schnappschuss' }, wo + ': old device, new snapshot');
    assert.deepEqual(await stateFrom(spaeter, s2, { now: NOW + 30 * DAY_MS }), { state: soll2, weg: 'schnappschuss' }, wo + ': new device, new snapshot');
  }
});

test('Gleiche Anzahl, andere Ereignisse: eines fehlt, ein verspaetetes ist da -> nicht der Schnappschuss, sondern "voll"', async () => {
  const s = await snap(ALT);
  // missing: a round with stars (the total counts every round); late: a badge (the badge count counts every one)
  const fehlt = ALT.findIndex((e) => e.type === 'round_done' && e.payload.stars > 0);
  const L = newEvent({ type: 'badge', author: 'p_k1', device: 'd_k2', at: iso(Date.parse(ALT[10].at) + 1), payload: { day: ALT[10].at.slice(0, 10), badge: 'thinker' } }, { rand: extraRand });
  const kennt = [...ALT.filter((_, i) => i !== fehlt), L, ...NEU];
  const r = await stateFrom(kennt, s, { now: NOW });
  assert.equal(r.weg, 'voll');
  assert.deepEqual(r.state, run(kennt), 'the same as these events without a snapshot');
  const ueberSchnappschuss = derive(kennt, { now: NOW, base: { upTo: s.payload.upTo, state: s.payload.state } });
  assert.notDeepEqual(ueberSchnappschuss.total, r.state.total, '(the snapshot would really give another state)');
});

test('Gleiche Kennung, anderer Inhalt (zweite Fassung eines Ereignisses) -> Pruefsumme passt nicht, "voll"', async () => {
  const s = await snap(ALT);
  const i = ALT.findIndex((e) => e.type === 'round_done' && e.payload.stars > 0);
  const fassung = json(ALT[i]); fassung.payload.stars = 0;                     // same id, other content (the device only has this one)
  const kennt = [...ALT.filter((_, j) => j !== i), fassung, ...NEU];
  const r = await stateFrom(kennt, s, { now: NOW });
  assert.equal(r.weg, 'voll');
  assert.deepEqual(r.state, run(kennt));
  assert.notEqual(r.state.total, run(FAM).total, '(the other content really changes the state)');
});

test('Fehlen nur alte Ereignisse (Geraet war offline, nichts verspaetet) -> nachladen; danach passt der Schnappschuss', async () => {
  const s = await snap(ALT);
  assert.deepEqual(await stateFrom([...ALT.slice(0, 4000), ...NEU], s, { now: NOW }), { state: null, weg: 'nachladen' });
  assert.equal((await stateFrom([...ALT, ...NEU], s, { now: NOW })).weg, 'schnappschuss');
});

/* ---------- 3 doubles and order ---------- */
test('Doppelt und gemischt: Reihenfolge und Wiederholungen aendern weder den Schnappschuss noch den Stand (10 Laeufe)', async () => {
  const s = await snap(ALT), soll = run(FAM), next = seeded(9);
  for (let lauf = 0; lauf < 10; lauf++) {
    const mix = shuffled(ALT, next).flatMap((e) => (next() < 0.2 ? [e, json(e)] : [e]));
    const s2 = await snap(mix);
    assert.deepEqual(s2.payload, s.payload, 'snapshot payload, run ' + lauf);
    const kennt = shuffled([...FAM, ...FAM.slice(0, 500), s, s2], next);
    assert.deepEqual(await stateFrom(kennt, s2, { now: NOW }), { state: soll, weg: 'schnappschuss' }, 'state, run ' + lauf);
  }
});

/* ---------- 4 threshold ---------- */
test('Schwelle: 4 999 -> kein Schnappschuss, 5 000 -> ja; nach einem Schnappschuss zaehlt neu; Doppelte, Ungueltige und Schnappschuesse zaehlen nicht', async () => {
  assert.equal(SNAPSHOT_EVERY, 5000);
  const s = sortiert(FAM);
  assert.equal(needsSnapshot(s.slice(0, 4999), null), false);
  assert.equal(needsSnapshot(s.slice(0, 5000), null), true);
  assert.equal(needsSnapshot([...s.slice(0, 4999), ...s.slice(0, 100), json(s[0])], null), false, 'doubles count once');
  assert.equal(needsSnapshot([...s.slice(0, 4999), { ...s[5000], v: 2 }], null), false, 'invalid events do not count');
  assert.equal(needsSnapshot([], null), false);
  const snap1 = await snap(s.slice(0, 5000));
  assert.equal(needsSnapshot([...s.slice(0, 5000), snap1], null), true);
  assert.equal(needsSnapshot([...s.slice(0, 4999), snap1], null), false, 'a snapshot is no event that counts');
  const danach = familie(41, 5000, Date.parse(snap1.payload.upTo) + 1000);
  assert.equal(needsSnapshot([...s.slice(0, 5000), snap1, ...danach.slice(0, 4999)], snap1), false);
  assert.equal(needsSnapshot([...s.slice(0, 5000), snap1, ...danach], snap1), true);
});

/* ---------- 5 limits ---------- */
test('Kuerzungen: attempts 200, ev 60, due 40 (und Blaetter 8) sind ueber den Schnappschuss hinweg gleich', async () => {
  const s = await snap(ALT), st = s.payload.state;
  assert.equal(st.attempts.length, DERIVE_LIMITS.attempts, 'the snapshot holds full lists');
  assert.ok(Object.values(st.ev).some((rows) => rows.length === DERIVE_LIMITS.evidence));
  assert.equal(st.due.length, DERIVE_LIMITS.due);
  assert.equal(st.sheets.length, DERIVE_LIMITS.sheets);
  assert.ok(st.gaps && st.name !== undefined && st.rankSeen && st._days.length > 30, 'the story reaches gaps, profile, rank, days');
  const r = await stateFrom(FAM, s, { now: NOW }), soll = run(FAM);
  assert.equal(r.weg, 'schnappschuss');
  for (const k of ['attempts', 'ev', 'due', 'sheets', 'treeStage', '_days', 'gaps', 'badges', 'total']) assert.deepEqual(r.state[k], soll[k], k);
  assert.notDeepEqual(r.state.attempts, st.attempts, '(the rest really moves the lists on)');
});

/* ---------- 6 clock ---------- */
test('Uhr: Ereignis mehr als 24 h in der Zukunft verhaelt sich wie in effectiveTime (zaehlt als "jetzt")', async () => {
  // a) after the snapshot an event from an iPad with a wrong clock arrives: it counts as "now" and belongs to the rest
  const s = await snap(ALT);
  const zukunft = answerAt(NOW + 3 * DAY_MS, 'zukunft');
  assert.deepEqual(await stateFrom([...FAM, zukunft], s, { now: NOW }), { state: run([...FAM, zukunft]), weg: 'schnappschuss' });
  // b) the event is already there when the snapshot is written: not inside (it is "now", not before), stays in the rest
  const jetzt = Date.parse(ALT[ALT.length - 1].at) + 1000;
  const sz = await snap([...ALT, zukunft], jetzt);
  assert.equal(sz.payload.count, ALT.length, 'not counted');
  assert.equal(sz.payload.upTo, ALT[ALT.length - 1].at);
  for (const spaeter of [jetzt + 1000, NOW, NOW + 10 * DAY_MS]) {
    assert.deepEqual(await stateFrom([...FAM, zukunft], sz, { now: spaeter }), { state: run([...FAM, zukunft], spaeter), weg: 'schnappschuss' }, 'now ' + iso(spaeter));
  }
  // c) between 0 and 24 h ahead counts with its own time - also not inside
  const bald = answerAt(jetzt + 23 * 3600 * 1000, 'bald');
  assert.equal((await snap([...ALT, bald], jetzt)).payload.count, ALT.length);
  // d) a device whose clock is more than 24 h behind the snapshot: never the snapshot
  const zurueck = Date.parse(s.payload.upTo) - 2 * DAY_MS;
  assert.ok(Date.parse(s.payload.upTo) > zurueck + EVENT_FUTURE_MS);
  assert.deepEqual(await stateFrom(FAM, s, { now: zurueck }), { state: run(FAM, zurueck), weg: 'voll' });
  assert.deepEqual(await stateFrom(NEU, s, { now: zurueck }), { state: null, weg: 'nachladen' });
  // the same events as in the snapshot (count and checksum fit), but this clock puts the last two days in another order
  const gleich = await stateFrom(ALT, s, { now: zurueck });
  assert.deepEqual(gleich, { state: run(ALT, zurueck), weg: 'voll' });
  assert.notDeepEqual(gleich.state.attempts, s.payload.state.attempts, '(the order really differs)');
});

/* ---------- writing and accepting ---------- */
test('Schnappschuss: nur ein Elternteil darf ihn schreiben (Modul annahme); ohne Ereignisse vor "jetzt" gibt es keinen', async () => {
  const area = 'kind:lern:p_k1', eltern = await newPersonKeys(), kind = await newPersonKeys();
  const z = { area, members: { p_e1: { role: 'parent', pub: await publicKeysOf(eltern), devices: ['d_e1'] }, p_k1: { role: 'child', pub: await publicKeysOf(kind), devices: ['d_k1'] } } };
  const s = await snap(ALT.slice(0, 300));
  assert.deepEqual(await acceptEvent(await signEvent(s, area, eltern), z), { ok: true });
  const vomKind = await makeSnapshot(ALT.slice(0, 300), { now: NOW, author: 'p_k1', device: 'd_k1' });
  assert.deepEqual(await acceptEvent(await signEvent(vomKind, area, kind), z), { ok: false, grund: 'rolle-darf-nicht' });
  assert.equal(await snap([]), null);
  assert.equal(await snap([answerAt(NOW + 1000)]), null, 'only events after "now"');
});

test('Eingaben: "now" ist Pflicht; ungueltiger Schnappschuss oder ungueltiger Autor bricht ab', async () => {
  const s = await snap(ALT.slice(0, 50));
  await assert.rejects(() => makeSnapshot(ALT, PARENT), /"now" fehlt/);
  await assert.rejects(() => stateFrom(ALT, s, {}), /"now" fehlt/);
  await assert.rejects(() => stateFrom(ALT, s, { now: 'gestern' }), /"now" fehlt/);
  await assert.rejects(() => makeSnapshot(ALT, { now: NOW, author: 'Peter', device: 'd_e1' }), /Schnappschuss ungueltig/);
  for (const kaputt of [ALT[0], { ...s, payload: { ...s.payload, idsHash: undefined } }, { ...s, payload: { ...s.payload, count: -1 } }, {}]) {
    await assert.rejects(() => stateFrom(ALT, kaputt, { now: NOW }), /kein gueltiger Schnappschuss/);
    assert.throws(() => needsSnapshot(ALT, kaputt), /kein gueltiger Schnappschuss/);
  }
});

test('Reinheit: kein Netz, kein Speicher, keine Uhr, kein Zufall; Importe nur aus Modulen; Hilfsnamen mit sn/SN_', () => {
  const src = fs.readFileSync(new URL('../../src/module/schnappschuss.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /\bfetch\s*\(/);
  for (const w of ['XMLHttpRequest', 'localStorage', 'indexedDB', 'Math.random', 'Date.now', 'getRandomValues', 'setTimeout']) assert.equal(src.includes(w), false, w);
  assert.deepEqual([...src.matchAll(/^import .* from '(.+)';$/gm)].map((m) => m[1]), ['./ereignisse.mjs', './ableitung.mjs']);
  for (const m of src.matchAll(/^(?:export\s+)?(?:async\s+)?(?:function\s+([\w$]+)|(?:const|let|class)\s+([\w$]+))/gm)) {
    const name = m[1] || m[2];
    assert.ok(m[0].startsWith('export') || /^(sn|SN_)/.test(name), name);
  }
});
