// Modul bereiche ohne Browser (S12 P3b, US10.4; Konzept 6, 7.1, 8; Erfolgskriterien E5, E6, E10 in der Simulation).
// Jede Zelle der Lese-Matrix mit echten Schluesseln: Schluessel verteilen (Modul bereiche), schreiben und lesen ueber
// den simulierten Speicher (Module speicher, abgleich), pruefen mit annahme.
//   node --test tests/module/bereiche.test.mjs

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { BEREICH_ARTEN, BEREICH_JE_TYP, bereichName, bereichZerlegen, bereichVonEreignis, passtZumBereich, bereicheFuer, halter, schluesselLesen, schluesselVerteilen } from '../../src/module/bereiche.mjs';
import { lokalerSpeicher } from '../../src/module/speicher.mjs';
import { abgleichStand, vormerken, senden, holen } from '../../src/module/abgleich.mjs';
import { newPersonKeys, publicKeysOf, newAreaKey, wrapKeyFor, signBytes, openEntryText, entryAad } from '../../src/module/krypto.mjs';
import { newEvent, EVENT_TYPES } from '../../src/module/ereignisse.mjs';
import { signEvent, acceptEvent, ANNAHME_RECHTE } from '../../src/module/annahme.mjs';
import { derive } from '../../src/module/ableitung.mjs';

/* ---------- die Personen ----------
   Familie von Kathie (p_k1): Geschwister p_k2, Eltern p_e1 und p_e2 (p_e3 kommt spaeter dazu).
   Lehrkraft p_l1 (Freigabe g1 "Lernstand"), p_l2 (g2 "Lernstand + Schuldaten"), p_l3 (ohne Freigabe).
   Admin p_a1 (ohne Freigabe), p_a2 (g3 "Lernstand"). Fremde Familie: Kind p_k7 (heisst auch Kathie), Elternteil p_e7. */
const ROLLE = { p_k1: 'child', p_k2: 'child', p_e1: 'parent', p_e2: 'parent', p_e3: 'parent', p_l1: 'teacher', p_l2: 'teacher', p_l3: 'teacher', p_a1: 'admin', p_a2: 'admin', p_k7: 'child', p_e7: 'parent' };
const DEV = (pid) => 'd_' + pid.slice(2);
const KEYS = {}, PUB = {};
let M, FM, stranger;          // M: Familie p_k1 + Freigabe-Empfaenger; FM: fremde Familie
const mitglied = (pid) => ({ role: ROLLE[pid], pub: PUB[pid], devices: [DEV(pid)] });
before(async () => {
  for (const pid of Object.keys(ROLLE)) { KEYS[pid] = await newPersonKeys(); PUB[pid] = await publicKeysOf(KEYS[pid]); }
  stranger = await newPersonKeys();
  M = Object.fromEntries(['p_k1', 'p_k2', 'p_e1', 'p_e2', 'p_l1', 'p_l2', 'p_l3', 'p_a1', 'p_a2'].map((p) => [p, mitglied(p)]));
  FM = Object.fromEntries(['p_k7', 'p_e7'].map((p) => [p, mitglied(p)]));
});

const HEUTE = '2026-11-03', TAG = '2026-11-02', JETZT = Date.UTC(2026, 10, 3, 12, 0, 0);
const FREIGABEN = [
  { grant: 'g1', grantee: 'p_l1', scope: ['learning'], from: '2026-11-01', until: '2026-11-14' },
  { grant: 'g2', grantee: 'p_l2', scope: ['learning', 'school'], from: '2026-11-01', until: '2026-11-30' },
  { grant: 'g3', grantee: 'p_a2', scope: ['learning'], from: '2026-11-01', until: '2026-11-30' },
];
const L = 'kind:lern:p_k1', PR = 'kind:privat:p_k1', S = 'schule:p_k1', EA = 'eltern:allg:p_k1', F1 = 'freigabe:g1', F2 = 'freigabe:g2', F3 = 'freigabe:g3', PE1 = 'person:p_e1';
const BEREICHE = [L, PR, S, EA, F1, F2, PE1];                       // Spalten der Lese-Matrix
const FREMD = ['kind:lern:p_k7', 'kind:privat:p_k7', 'schule:p_k7', 'eltern:allg:p_k7'];

/* ---------- Ereignisse ---------- */
let uhr = 0, qn = 0;
const at = () => new Date(JETZT - 86400000 + (uhr += 1013)).toISOString();
const NUTZ = {
  answer: () => ({ day: TAG, skill: 'round', level: 2, attempt: 1, ok: true, qid: 'q' + (++qn) }),
  name: (v) => ({ field: 'name', value: v }),
  sheet: () => ({ sheet: TAG + '-s' + (++qn), day: TAG, no: qn, writing: 'en', items: [] }),
  schule: () => ({ asOf: TAG, data: { 'MA.3.NBT.2': 'RS', 'MA.3.OA.1': 'C' } }),
  luecke: (state = 'closed', by = 'app') => ({ standard: 'MA.3.NBT.2', state, by, schoolDay: '2026-10-20', day: TAG }),
  snap: () => ({ upTo: '2026-11-02T16:00:00Z', count: 0, idsHash: '0'.repeat(64), state: {} }),
};
const signiert = (area, pid, type, payload, keys = KEYS[pid]) => signEvent(newEvent({ type, author: pid, device: DEV(pid), at: at(), payload }), area, keys);

/* schreibt ueber den Abgleich: Schluessel aus dem Speicher holen, vormerken, senden */
async function schreiben(f, area, pid, liste, mitglieder = M) {
  const z = f.s.geraet(DEV(pid)), k = area + '|' + pid;
  if (!f.st.has(k)) f.st.set(k, abgleichStand(area, DEV(pid)));
  const st = f.st.get(k), sch = await schluesselLesen(z, area, { ich: pid, meineSchluessel: KEYS[pid], mitglieder });
  const items = [];
  for (const [type, payload] of liste) { const x = await signiert(area, pid, type, payload); vormerken(st, x, { now: JETZT }); items.push(x); }
  await senden(st, { zugang: z, schluessel: sch });
  for (const x of items) f.ids.set(area, [...(f.ids.get(area) || []), x.event.id]);
  return items;
}
/* liest einen Bereich mit einem frischen Geraetestand -> { sch, h, events } */
async function lesen(f, area, pid, mitglieder = M) {
  const z = f.s.geraet(DEV(pid));
  const sch = await schluesselLesen(z, area, { ich: pid, meineSchluessel: KEYS[pid], mitglieder });
  const st = abgleichStand(area, DEV(pid));
  const h = await holen(st, { zugang: z, schluessel: sch, zulassung: { area, members: mitglieder }, now: JETZT });
  return { sch, h, events: st.log.map((x) => x.event) };
}
const verteilen = (f, area, { heute = HEUTE, freigaben = FREIGABEN, ich = 'p_e1', mitglieder = M } = {}) =>
  schluesselVerteilen(f.s.geraet(DEV(ich)), area, { soll: halter(area, mitglieder, freigaben, heute), ich, meineSchluessel: KEYS[ich], mitglieder });

/* die Familie mit Schluesseln und Daten in jedem Bereich; dazu die fremde Familie im selben Speicher */
async function familie() {
  const f = { s: lokalerSpeicher({ now: () => JETZT }), st: new Map(), ids: new Map() };
  for (const area of [L, PR, S, EA, F1, F2, F3, PE1]) assert.equal((await verteilen(f, area)).aktion, 'angelegt', area);
  await schreiben(f, L, 'p_k1', [['answer', NUTZ.answer()], ['answer', NUTZ.answer()], ['profile_set', NUTZ.name('Kathie')]]);
  await schreiben(f, L, 'p_e1', [['sheet_created', NUTZ.sheet()]]);
  await schreiben(f, PR, 'p_k1', [['profile_set', { field: 'birthday', value: '2017-05-14' }], ['profile_set', { field: 'emoji', value: 'fox' }], ['day_flag', { flag: 'greetDay', day: TAG }]]);
  await schreiben(f, PR, 'p_e1', [['setting_set', { setting: 'storyCap', value: 2 }]]);
  await schreiben(f, S, 'p_e1', [['school_import', NUTZ.schule()]]);
  await schreiben(f, S, 'p_k1', [['gap_state', NUTZ.luecke()]]);
  await schreiben(f, EA, 'p_e2', [['grant_set', { grant: 'g1', grantee: 'p_l1', scope: ['learning'], from: '2026-11-01', until: '2026-11-14' }], ['member_added', { person: 'p_e2', role: 'parent' }]]);
  await schreiben(f, F1, 'p_l1', [['grant_opened', { grant: 'g1', grantee: 'p_l1' }]]);
  await schreiben(f, F2, 'p_l2', [['grant_opened', { grant: 'g2', grantee: 'p_l2' }]]);
  await schreiben(f, PE1, 'p_e1', [['snapshot', NUTZ.snap()]]);
  for (const area of FREMD) await verteilen(f, area, { ich: 'p_e7', mitglieder: FM, freigaben: [] });
  await schreiben(f, FREMD[0], 'p_k7', [['profile_set', NUTZ.name('Kathie')], ['answer', NUTZ.answer()]], FM);
  await schreiben(f, FREMD[1], 'p_k7', [['profile_set', { field: 'birthday', value: '2017-02-02' }]], FM);
  return f;
}
const gleich = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();
async function zelle(f, pid, area) {
  const r = await lesen(f, area, pid, ROLLE[pid] && FM[pid] ? FM : M);
  if (r.sch.keys.size === 0 && r.events.length === 0) return '--';
  return gleich(r.events.map((e) => e.id), f.ids.get(area)) && r.h.verworfen.length === 0 && r.h.wartend.length === 0 ? 'ja' : '??';
}

/* ---------- 1 Lese-Matrix (Konzept 6) ---------- */
test('Lese-Matrix: jede Zelle mit echten Schluesseln - erlaubt -> entschluesselt, verboten -> kein Schluessel', async () => {
  const f = await familie();
  //                 L     PR    S     EA    F1    F2    PE1
  const ERWARTET = {
    p_k1: ['ja', 'ja', 'ja', '--', '--', '--', '--'],   // Kind (Schuldaten im Konto zum Rechnen, nie angezeigt)
    p_k2: ['--', '--', '--', '--', '--', '--', '--'],   // Geschwisterkind
    p_e1: ['ja', 'ja', 'ja', 'ja', 'ja', 'ja', 'ja'],   // Elternteil
    p_e2: ['ja', 'ja', 'ja', 'ja', 'ja', 'ja', '--'],   // zweiter Elternteil (Personen-Bereich von p_e1 nicht)
    p_l1: ['ja', '--', '--', '--', 'ja', '--', '--'],   // Lehrkraft, Freigabe "Lernstand"
    p_l2: ['ja', '--', 'ja', '--', '--', 'ja', '--'],   // Lehrkraft, Freigabe "Lernstand + Schuldaten"
    p_l3: ['--', '--', '--', '--', '--', '--', '--'],   // Lehrkraft ohne Freigabe
    p_a1: ['--', '--', '--', '--', '--', '--', '--'],   // Admin ohne Freigabe
    p_a2: ['ja', '--', '--', '--', '--', '--', '--'],   // Admin mit Freigabe "Lernstand"
    p_k7: ['--', '--', '--', '--', '--', '--', '--'],   // fremde Familie, Kind mit gleichem Namen
    p_e7: ['--', '--', '--', '--', '--', '--', '--'],   // fremde Familie, Elternteil
  };
  const ist = {};
  for (const pid of Object.keys(ERWARTET)) { ist[pid] = []; for (const area of BEREICHE) ist[pid].push(await zelle(f, pid, area)); }
  assert.deepEqual(ist, ERWARTET);
  // umgekehrt: unsere Familie liest nichts von der fremden
  for (const pid of ['p_e1', 'p_e2', 'p_k1', 'p_l2']) for (const area of FREMD) assert.equal((await lesen(f, area, pid)).sch.keys.size, 0, pid + ' ' + area);
  assert.equal(await zelle(f, 'p_e7', FREMD[0]), 'ja', 'die fremde Familie liest ihre eigenen Daten');

  // Querprobe: auch mit allen Schluesseln, die eine Person irgendwo hat, oeffnet sich kein verbotener Eintrag
  for (const [pid, zeile] of Object.entries(ERWARTET)) {
    const z = f.s.geraet(DEV(pid)), alle = [];
    for (const area of [L, PR, S, EA, F1, F2, F3, PE1, ...FREMD]) for (const k of (await schluesselLesen(z, area, { ich: pid, meineSchluessel: KEYS[pid], mitglieder: FM[pid] ? FM : M })).keys.values()) alle.push(k);
    for (const [i, area] of BEREICHE.entries()) {
      if (zeile[i] === 'ja') continue;
      for (const kennung of (await z.list(area, null)).kennungen) {
        const b = await z.get(area, kennung);
        for (const x of b.eintraege) for (const key of alle) await assert.rejects(openEntryText(key, { iv: x.iv, ct: x.ct }, entryAad(area, b.kv, x.id)), `${pid} oeffnet ${area}`);
      }
    }
  }
});

/* ---------- 2 Profil ---------- */
test('Profil: Lehrkraft mit Freigabe liest Antworten und den Namen, aber keinen Geburtstag, kein Emoji, keine Einstellungen', async () => {
  const f = await familie();
  for (const pid of ['p_l1', 'p_l2', 'p_a2']) {
    const r = await lesen(f, L, pid);
    assert.deepEqual(r.events.map((e) => e.type).sort(), ['answer', 'answer', 'profile_set', 'sheet_created'], pid);
    const st = derive(r.events, { now: JETZT });
    assert.equal(st.name, 'Kathie', pid + ' sieht, mit welchem Kind sie arbeitet');
    assert.equal(st.attempts.length, 2);
    assert.equal(st.birthday, undefined);
    // alles, was diese Person ueberhaupt entschluesseln kann
    let klartext = '';
    for (const area of [L, PR, S, EA, F1, F2, F3, PE1]) klartext += JSON.stringify((await lesen(f, area, pid)).events);
    assert.ok(klartext.includes('Kathie'));
    for (const w of ['2017-05-14', 'birthday', '"fox"', 'emoji', 'storyCap', 'greetDay', 'member_added', 'grant_set']) assert.equal(klartext.includes(w), false, pid + ': ' + w);
  }
  const r2 = await lesen(f, PR, 'p_e2');
  assert.deepEqual(r2.events.map((e) => e.payload.field || e.payload.setting || e.payload.flag).sort(), ['birthday', 'emoji', 'greetDay', 'storyCap'], 'Eltern lesen das ganze Profil');
});

/* ---------- 3 Kind und Schule ---------- */
test('Kind und Schule: das Konto des Kindes rechnet mit Schuldaten, schreibt nur das automatische Schliessen, keine Elternsachen', async () => {
  const f = await familie();
  const kind = await lesen(f, S, 'p_k1');
  assert.deepEqual(kind.events.map((e) => e.type).sort(), ['gap_state', 'school_import'], 'Schuldaten im Konto des Kindes (zum Rechnen)');
  // das Kind schreibt in "schule": das automatische Schliessen wird angenommen, alles andere verworfen
  const [zu] = await schreiben(f, S, 'p_k1', [['gap_state', NUTZ.luecke('closed', 'app')]]);
  const [halten, schule] = await schreiben(f, S, 'p_k1', [['gap_state', NUTZ.luecke('hold', 'parents')], ['school_import', NUTZ.schule()]]);
  const [l2] = await schreiben(f, S, 'p_l2', [['school_import', NUTZ.schule()]]);
  const eltern = await lesen(f, S, 'p_e1');
  assert.ok(eltern.events.some((e) => e.id === zu.event.id), 'automatisch geschlossen: angenommen');
  assert.deepEqual(eltern.h.verworfen.map((v) => [v.id, v.grund]).sort(), [[halten.event.id, 'rolle-darf-nicht'], [schule.event.id, 'rolle-darf-nicht'], [l2.event.id, 'rolle-darf-nicht']].sort());
  // keine Freigaben, keine Elternsachen: kein Schluessel fuer eltern:allg, also kann das Kind dort nichts ablegen
  await assert.rejects(schreiben(f, EA, 'p_k1', [['device_added', { device: 'd_k1' }]]), /aktueller Schluessel fehlt/);
  await assert.rejects(schreiben(f, F1, 'p_k1', [['grant_opened', { grant: 'g1', grantee: 'p_k1' }]]), /aktueller Schluessel fehlt/);
  // und es verteilt keine Schluessel
  await assert.rejects(verteilen(f, S, { ich: 'p_k1' }), /nur Eltern/);
  await assert.rejects(verteilen(f, L, { ich: 'p_l1' }), /nur Eltern/);
  await assert.rejects(verteilen(f, PE1, { ich: 'p_e2' }), /nur Eltern|Person selbst/);
});

/* ---------- 4 E6 ---------- */
test('E6: Freigabe endet (Ablauf, Widerruf) -> Schluesselwechsel; Ex-Lehrkraft liest alte Eintraege, keine neuen', async () => {
  const f = await familie();
  const nach = '2026-11-15';                                            // g1 lief bis 14.11.
  const r = {};
  for (const a of [L, PR, S, EA, F1, F2, F3, PE1]) r[a] = await verteilen(f, a, { heute: nach });
  assert.deepEqual(r[L], { aktion: 'gewechselt', version: 2, neu: [], entfernt: ['p_l1'] });
  assert.deepEqual(r[F1], { aktion: 'gewechselt', version: 2, neu: [], entfernt: ['p_l1'] });
  for (const a of [PR, S, EA, F2, F3, PE1]) assert.deepEqual(r[a], { aktion: 'unveraendert', version: 1, neu: [], entfernt: [] }, a);
  for (const a of [L, F1]) assert.equal((await verteilen(f, a, { heute: nach })).aktion, 'unveraendert', 'ein zweites Mal aendert nichts');

  const alt = f.ids.get(L).slice();
  const [neu] = await schreiben(f, L, 'p_k1', [['answer', NUTZ.answer()]]);
  const ex = await lesen(f, L, 'p_l1');
  assert.deepEqual([ex.sch.aktuell, [...ex.sch.keys.keys()]], [2, [1]]);
  assert.ok(gleich(ex.events.map((e) => e.id), alt), 'alte Eintraege bleiben lesbar');
  assert.equal(ex.events.some((e) => e.id === neu.event.id), false, 'den neuen nicht');
  assert.equal(ex.h.wartend.length, 1, 'das neue Buendel bleibt fuer sie verschlossen');
  assert.equal(derive(ex.events, { now: JETZT }).attempts.length, 2);
  await assert.rejects(schreiben(f, F1, 'p_l1', [['grant_opened', { grant: 'g1', grantee: 'p_l1' }]]), /aktueller Schluessel fehlt/, 'sie protokolliert nichts mehr');
  for (const pid of ['p_l2', 'p_a2', 'p_k1', 'p_e2']) assert.ok((await lesen(f, L, pid)).events.some((e) => e.id === neu.event.id), pid + ' liest den neuen Eintrag');

  // Widerruf von g2 am selben Tag: Lernstand und Schuldaten wechseln
  const ohneG2 = FREIGABEN.map((g) => (g.grant === 'g2' ? { ...g, widerrufen: true } : g));
  assert.deepEqual(await verteilen(f, L, { heute: nach, freigaben: ohneG2 }), { aktion: 'gewechselt', version: 3, neu: [], entfernt: ['p_l2'] });
  assert.deepEqual(await verteilen(f, S, { heute: nach, freigaben: ohneG2 }), { aktion: 'gewechselt', version: 2, neu: [], entfernt: ['p_l2'] });
  assert.deepEqual(await verteilen(f, F2, { heute: nach, freigaben: ohneG2 }), { aktion: 'gewechselt', version: 2, neu: [], entfernt: ['p_l2'] });
  const [imp] = await schreiben(f, S, 'p_e1', [['school_import', NUTZ.schule()]]);
  const [neu2] = await schreiben(f, L, 'p_k1', [['answer', NUTZ.answer()]]);
  const l2s = await lesen(f, S, 'p_l2'), l2l = await lesen(f, L, 'p_l2');
  assert.equal(l2s.events.some((e) => e.id === imp.event.id), false, 'keine neuen Schuldaten');
  assert.equal(l2s.events.length, 2, 'die alten Schuldaten bleiben gesehen');
  assert.ok(l2l.events.some((e) => e.id === neu.event.id) && !l2l.events.some((e) => e.id === neu2.event.id));
  const kind = await lesen(f, L, 'p_k1');
  assert.deepEqual([kind.sch.aktuell, [...kind.sch.keys.keys()].sort()], [3, [1, 2, 3]], 'das Kind liest alles');
  assert.ok(gleich(kind.events.map((e) => e.id), f.ids.get(L)));
});

/* ---------- 5 Typ und Bereich ---------- */
test('Typ und Bereich: jeder Typ hat genau einen Bereich; Ereignis im falschen Bereich -> verworfen (bereich-falsch)', async () => {
  assert.deepEqual(Object.keys(BEREICH_JE_TYP).sort(), EVENT_TYPES.slice().sort(), 'jeder Ereignistyp hat einen Bereich (neuer Typ -> hier eintragen)');
  // ausgeschrieben, nicht aus dem Modul abgeleitet
  const SOLL = {
    'kind:lern': ['answer', 'round_done', 'badge', 'review', 'practice_day', 'rank_seen', 'sheet_created', 'sheet_result', 'sheet_discarded', 'profile_set:name'],
    'kind:privat': ['profile_set:birthday', 'profile_set:emoji', 'profile_set:kidLang', 'profile_set:muted', 'setting_set', 'list_set', 'checklist_set', 'day_flag', 'advent_open', 'joke_seen', 'story_read'],
    schule: ['school_import', 'gap_state', 'gap_active'],
    'eltern:allg': ['grant_set', 'grant_revoked', 'member_added', 'member_removed', 'device_added', 'device_removed', 'key_rotated'],
    freigabe: ['grant_opened'], person: [], '*': ['snapshot'],
  };
  const ist = {};
  for (const [t, b] of Object.entries(BEREICH_JE_TYP)) for (const [name, art] of typeof b === 'string' ? [[t, b]] : Object.entries(b).map(([fd, a]) => [t + ':' + fd, a])) (ist[art] = ist[art] || []).push(name);
  for (const k of Object.keys(SOLL)) assert.deepEqual((ist[k] || []).sort(), SOLL[k].slice().sort(), k);
  assert.deepEqual(Object.keys(ist).filter((k) => !Object.keys(SOLL).includes(k)), [], 'keine anderen Bereiche');
  assert.ok(Object.isFrozen(BEREICH_JE_TYP) && Object.isFrozen(BEREICH_JE_TYP.profile_set));
  assert.equal(bereichVonEreignis({ type: 'profile_set', payload: { field: 'name' } }), 'kind:lern');
  assert.equal(bereichVonEreignis({ type: 'profile_set', payload: { field: 'toString' } }), null);
  assert.equal(bereichVonEreignis({ type: 'toString', payload: {} }), null);

  // mit echten Unterschriften: richtig unterschrieben, aber im falschen Bereich
  const z = (area) => ({ area, members: M });
  const grund = async (area, pid, type, payload) => { const r = await acceptEvent(await signiert(area, pid, type, payload), z(area)); return r.ok ? 'ok' : r.grund; };
  const FALSCH = [
    [L, 'p_k1', 'profile_set', { field: 'birthday', value: '2017-05-14' }], [L, 'p_e1', 'profile_set', { field: 'emoji', value: 'fox' }],
    [L, 'p_e1', 'setting_set', { setting: 'storyCap', value: 2 }], [L, 'p_e1', 'school_import', NUTZ.schule()], [L, 'p_e1', 'grant_set', FREIGABEN[0]],
    [PR, 'p_k1', 'answer', NUTZ.answer()], [PR, 'p_k1', 'profile_set', NUTZ.name('Kathie')], [PR, 'p_e1', 'gap_active', { standard: 'X' }],
    [S, 'p_k1', 'answer', NUTZ.answer()], [S, 'p_e1', 'grant_revoked', { grant: 'g1', grantee: 'p_l1' }],
    [EA, 'p_e1', 'school_import', NUTZ.schule()], [EA, 'p_l1', 'grant_opened', { grant: 'g1', grantee: 'p_l1' }],
    [F1, 'p_l2', 'grant_opened', { grant: 'g2', grantee: 'p_l2' }], [F2, 'p_e1', 'grant_set', FREIGABEN[0]],
    [PE1, 'p_e1', 'setting_set', { setting: 'storyCap', value: 2 }],
    ['kid:p_k1', 'p_k1', 'answer', NUTZ.answer()], ['kind:lern', 'p_k1', 'answer', NUTZ.answer()], ['kind:lern:p_k1 ', 'p_k1', 'answer', NUTZ.answer()],
  ];
  for (const [area, pid, type, p] of FALSCH) assert.equal(await grund(area, pid, type, p), 'bereich-falsch', `${type} in ${area}`);
  for (const [area, pid, type, p] of [[L, 'p_k1', 'profile_set', NUTZ.name('K')], [PR, 'p_k1', 'profile_set', { field: 'kidLang', value: 'de' }], [F1, 'p_l1', 'grant_opened', { grant: 'g1', grantee: 'p_l1' }], [S, 'p_k1', 'gap_state', NUTZ.luecke()]]) {
    assert.equal(await grund(area, pid, type, p), 'ok', `${type} in ${area}`);
  }
  for (const area of [L, PR, S, EA, F1, PE1]) assert.equal(await grund(area, 'p_e1', 'snapshot', NUTZ.snap()), 'ok', 'Schnappschuss in ' + area);
  assert.equal(await grund(L, 'p_l1', 'setting_set', { setting: 'storyCap', value: 9 }), 'bereich-falsch', 'erst der Bereich, dann die Rolle');

  // ueber den Abgleich: das Kind legt seinen Geburtstag in kind:lern ab (es hat den Schluessel) -> Eltern verwerfen ihn
  const f = await familie();
  const [geb] = await schreiben(f, L, 'p_k1', [['profile_set', { field: 'birthday', value: '2017-05-14' }]]);
  const e = await lesen(f, L, 'p_e1');
  assert.deepEqual(e.h.verworfen.map((v) => [v.id, v.grund]), [[geb.event.id, 'bereich-falsch']]);
  assert.equal(e.events.some((x) => x.id === geb.event.id), false);
});

test('Bereichsnamen: nur das feste Schema; alles andere passt zu nichts', () => {
  assert.deepEqual(BEREICH_ARTEN, ['kind:lern', 'kind:privat', 'schule', 'eltern:allg', 'freigabe', 'person']);
  assert.equal(bereichName('kind:lern', 'p_k1'), L);
  assert.equal(bereichName('freigabe', 'g1'), F1);
  assert.deepEqual(bereichZerlegen('eltern:allg:p_k1'), { art: 'eltern:allg', id: 'p_k1' });
  assert.deepEqual(bereichZerlegen('freigabe:g-7_x'), { art: 'freigabe', id: 'g-7_x' });
  for (const n of ['kind:lern:', 'kind:lern:p_', 'kind:lern:k1', 'KIND:lern:p_k1', 'kind:lern:p_k1 ', 'kind:lern:p_k1:x', 'kind:p_k1', 'freigabe:', 'freigabe:a/b', 'freigabe:a:b', 'person:p_e1:x', 'kid:p_k1', '__proto__', 'toString', '', null, 7, {}]) {
    assert.equal(bereichZerlegen(n), null, String(n));
    assert.equal(passtZumBereich({ type: 'snapshot', payload: {} }, n), false, 'snapshot in ' + String(n));
  }
  for (const [a, i] of [['kind:lern', 'g1'], ['freigabe', 'a/b'], ['schule', ''], ['kind', 'p_k1'], ['person', 'p_e1:x']]) assert.throws(() => bereichName(a, i), /Bereich ungueltig/, a + ' ' + i);
});

/* ---------- Halter und Rollen ---------- */
test('bereicheFuer und halter: Rolle, Umfang, Datum, Widerruf, Geschwister, fremde Rollen', () => {
  assert.deepEqual(bereicheFuer('child'), ['kind:lern', 'kind:privat', 'schule']);
  assert.deepEqual(bereicheFuer('parent'), ['kind:lern', 'kind:privat', 'schule', 'eltern:allg', 'freigabe']);
  for (const r of ['teacher', 'admin']) {
    for (const u of [undefined, null, [], ['toString'], 'learning']) assert.deepEqual(bereicheFuer(r, u), [], `${r} ${JSON.stringify(u)}`);
    assert.deepEqual(bereicheFuer(r, ['learning']), ['kind:lern', 'freigabe']);
    assert.deepEqual(bereicheFuer(r, ['school']), ['schule', 'freigabe']);
    assert.deepEqual(bereicheFuer(r, ['school', 'learning', '__proto__']), ['kind:lern', 'schule', 'freigabe']);
  }
  for (const r of ['guest', 'toString', '__proto__', undefined, null, 7]) assert.deepEqual(bereicheFuer(r, ['learning', 'school']), [], String(r));
  const ids = (area, fr = FREIGABEN, heute = HEUTE, m = M) => halter(area, m, fr, heute).map((h) => h.id);
  assert.deepEqual(ids(L), ['p_a2', 'p_e1', 'p_e2', 'p_k1', 'p_l1', 'p_l2']);
  assert.deepEqual(ids(PR), ['p_e1', 'p_e2', 'p_k1']);
  assert.deepEqual(ids(S), ['p_e1', 'p_e2', 'p_k1', 'p_l2']);
  assert.deepEqual(ids(EA), ['p_e1', 'p_e2']);
  assert.deepEqual(ids(F1), ['p_e1', 'p_e2', 'p_l1']);
  assert.deepEqual(ids(PE1), ['p_e1']);
  assert.deepEqual(ids('kind:lern:p_k2', []), ['p_e1', 'p_e2', 'p_k2'], 'Geschwister: eigener Bereich (mit seinen eigenen Freigaben), nicht der von p_k1');
  assert.deepEqual(ids('person:p_x1'), []);
  assert.deepEqual(halter(L, M, FREIGABEN, HEUTE).find((h) => h.id === 'p_k1'), { id: 'p_k1', pub: PUB.p_k1 });
  // Datum: beide Tage zaehlen mit
  const g = (extra) => [{ grant: 'g9', grantee: 'p_l3', scope: ['learning'], from: '2026-11-03', until: '2026-11-10', ...extra }];
  for (const [heute, drin] of [['2026-11-02', false], ['2026-11-03', true], ['2026-11-10', true], ['2026-11-11', false]]) assert.equal(ids(L, g(), heute).includes('p_l3'), drin, heute);
  for (const extra of [{ widerrufen: true }, { from: 'gestern' }, { until: undefined }, { grantee: 'p_x1' }, { grantee: 'toString' }, { scope: ['school'] }]) assert.equal(ids(L, g(extra)).includes(extra.grantee || 'p_l3'), false, JSON.stringify(extra));
  assert.equal(ids(S, g({ scope: ['school'] })).includes('p_l3'), true);
  assert.equal(ids('freigabe:g9', g()).includes('p_l3'), true);
  assert.equal(ids(F1, g()).includes('p_l3'), false, 'nur das Protokoll der eigenen Freigabe');
  // eine "Freigabe" an ein Kind oder einen Elternteil oeffnet nichts zusaetzlich
  assert.deepEqual(ids(EA, [{ grant: 'g8', grantee: 'p_k2', scope: ['learning', 'school'], from: '2026-11-01', until: '2026-11-30' }]), ['p_e1', 'p_e2']);
  assert.deepEqual(ids(PR, [{ grant: 'g8', grantee: 'p_k2', scope: ['learning', 'school'], from: '2026-11-01', until: '2026-11-30' }]), ['p_e1', 'p_e2', 'p_k1']);
  const ohnePub = { ...M, p_e2: { role: 'parent', devices: ['d_e2'] } };
  assert.deepEqual(ids(EA, FREIGABEN, HEUTE, ohnePub), ['p_e1'], 'ohne oeffentlichen Schluessel kein Halter');
  for (const [a, m, fr, h] of [['kid:p_k1', M, [], HEUTE], [L, null, [], HEUTE], [L, M, null, HEUTE], [L, M, [], '3.11.2026']]) assert.throws(() => halter(a, m, fr, h), /bereiche/);
});

test('Schreibrechte passen zu den Schluesseln: jede Rolle hat fuer jeden erlaubten Typ den Schluessel des Bereichs (eine Ausnahme)', () => {
  const ohne = [];
  for (const [rolle, typen] of Object.entries(ANNAHME_RECHTE)) {
    const arten = bereicheFuer(rolle, ['learning', 'school']).concat(['*']);
    for (const t of typen) {
      const b = BEREICH_JE_TYP[t], noetig = typeof b === 'string' ? [b] : Object.values(b);
      if (!noetig.some((a) => arten.includes(a))) ohne.push(rolle + ' ' + t);
    }
  }
  // offen fuer P3b-2: das Kindergeraet meldet sich in eltern:allg an, hat dort aber keinen Schluessel
  assert.deepEqual(ohne, ['child device_added']);
});

/* ---------- 6 Speicher sieht nichts (E5) ---------- */
test('E5: im Speicherabzug kein Klartext und keine Namen', async () => {
  const f = await familie(), z = f.s.geraet('d_x1');
  let abzug = '';
  for (const area of [L, PR, S, EA, F1, F2, F3, PE1, ...FREMD]) abzug += (await z.exportFile(area)) + JSON.stringify(await z.keys(area));
  assert.ok(abzug.length > 5000, 'der Abzug enthaelt die Daten (verschluesselt)');
  for (const w of ['Kathie', '2017-05-14', '2017-02-02', 'storyCap', 'greetDay', 'MA.3.NBT.2', 'school_import', 'profile_set', 'grant_opened', 'birthday', '"type"', '"payload"', '"fox"']) assert.equal(abzug.includes(w), false, w);
});

/* ---------- untergeschobene Schluessel ---------- */
const canon = (x) => (x === null || typeof x !== 'object' ? JSON.stringify(x) : Array.isArray(x) ? '[' + x.map(canon).join(',') + ']' : '{' + Object.keys(x).sort().map((k) => JSON.stringify(k) + ':' + canon(x[k])).join(',') + '}');
const keyBytes = (area, holder, e) => 'bq-key1|' + area + '|' + holder + '|' + canon({ v: e.v, von: e.von, versionen: e.versionen });
test('Untergeschobene Schluessel: wer nur in den Speicher schreiben kann, bringt keine eigene Schluesselversion unter', async () => {
  const f = await familie(), x = f.s.geraet('d_x1');
  const eigen = await newAreaKey(), w2 = async (holder) => ({ 2: await wrapKeyFor(eigen, { id: holder, pub: PUB[holder] || PUB.p_k1 }, L, 2) });
  const roh = async (holder, von, versionen, keys) => { const e = { v: 1, von, versionen }; return { ...e, sig: await signBytes(keys, keyBytes(L, holder, e)) }; };
  const echt = (await x.keys(L)).p_k1, ausS = (await x.keys(S)).p_k1;
  await x.putKey(L, 'p_x9', await roh('p_x9', 'p_e1', await w2('p_k1'), stranger));          // fremde Unterschrift im Namen der Eltern
  await x.putKey(L, 'p_x8', await roh('p_x8', 'p_k1', await w2('p_k1'), KEYS.p_k1));         // echte Unterschrift, aber das Kind verteilt nicht
  await x.putKey(L, 'p_x7', echt);                                                         // gueltiger Eintrag, anderer Halter
  await x.putKey(L, 'p_x6', ausS);                                                         // gueltiger Eintrag, anderer Bereich
  await x.putKey(L, 'p_x5', { ...(await roh('p_x5', 'p_e1', await w2('p_k1'), KEYS.p_e1)), v: 2 });   // falsches Format
  await x.putKey(L, 'p_x4', { v: 1, von: 'p_e1', versionen: await w2('p_k1') });           // ohne Unterschrift
  await x.putKey(L, 'p_x3', await roh('p_x3', 'p_x3', await w2('p_k1'), stranger));          // Verteiler unbekannt
  const k = await schluesselLesen(x, L, { ich: 'p_k1', meineSchluessel: KEYS.p_k1, mitglieder: M });
  assert.deepEqual([k.aktuell, [...k.keys.keys()], k.ungueltig.sort()], [1, [1], ['p_x3', 'p_x4', 'p_x5', 'p_x6', 'p_x7', 'p_x8', 'p_x9']]);
  assert.deepEqual(await verteilen(f, L), { aktion: 'unveraendert', version: 1, neu: [], entfernt: [] }, 'die Eltern lassen sich nicht beirren');
  const [a] = await schreiben(f, L, 'p_k1', [['answer', NUTZ.answer()]]);
  assert.equal((await x.get(L, 'd_k1/2')).kv, 1, 'das Kind schreibt weiter mit Version 1');
  assert.ok((await lesen(f, L, 'p_e2')).events.some((e) => e.id === a.event.id));
  // ein Eintrag wird ueberschrieben (Speicher kann loeschen): das Kind liest nichts mehr, bis die Eltern neu verteilen
  await x.putKey(L, 'p_k1', await roh('p_k1', 'p_e1', await w2('p_k1'), stranger));
  assert.equal((await lesen(f, L, 'p_k1')).sch.keys.size, 0);
  assert.deepEqual(await verteilen(f, L), { aktion: 'ergaenzt', version: 1, neu: ['p_k1'], entfernt: [] });
  assert.ok(gleich((await lesen(f, L, 'p_k1')).events.map((e) => e.id), f.ids.get(L)), 'wieder alles lesbar');
});

/* ---------- neue Halter ---------- */
test('Neuer Halter bekommt die ganze Geschichte: dritter Elternteil, erneute Freigabe; der zweite Elternteil verteilt auch', async () => {
  const f = await familie();
  for (const a of [L, F1]) assert.equal((await verteilen(f, a, { heute: '2026-11-15', ich: 'p_e2' })).aktion, 'gewechselt');
  const [neu] = await schreiben(f, L, 'p_k1', [['answer', NUTZ.answer()]]);
  const M3 = { ...M, p_e3: mitglied('p_e3') };
  assert.deepEqual(await verteilen(f, L, { heute: '2026-11-15', mitglieder: M3 }), { aktion: 'ergaenzt', version: 2, neu: ['p_e3'], entfernt: [] });
  const e3 = await lesen(f, L, 'p_e3', M3);
  assert.deepEqual([...e3.sch.keys.keys()].sort(), [1, 2]);
  assert.ok(gleich(e3.events.map((e) => e.id), f.ids.get(L)), 'alles von Anfang an');
  // p_l1 bekommt spaeter wieder eine Freigabe
  const wieder = [...FREIGABEN, { grant: 'g4', grantee: 'p_l1', scope: ['learning'], from: '2026-11-20', until: '2026-11-30' }];
  assert.deepEqual(await verteilen(f, L, { heute: '2026-11-20', freigaben: wieder, mitglieder: M3 }), { aktion: 'ergaenzt', version: 2, neu: ['p_l1'], entfernt: [] });
  assert.ok((await lesen(f, L, 'p_l1')).events.some((e) => e.id === neu.event.id));
  // wer selbst nicht den aktuellen Schluessel hat, kann nicht verteilen
  const M4 = { ...M, p_e3: mitglied('p_e3') };
  const g = lokalerSpeicher().geraet('d_e3');
  await schluesselVerteilen(g, EA, { soll: halter(EA, M, [], HEUTE), ich: 'p_e1', meineSchluessel: KEYS.p_e1, mitglieder: M });
  await assert.rejects(schluesselVerteilen(g, EA, { soll: halter(EA, M4, [], HEUTE), ich: 'p_e3', meineSchluessel: KEYS.p_e3, mitglieder: M4 }), /aktueller Schluessel fehlt/);
  await assert.rejects(schluesselVerteilen(g, EA, { soll: [halter(EA, M, [], HEUTE)[0], halter(EA, M, [], HEUTE)[0]], ich: 'p_e1', meineSchluessel: KEYS.p_e1, mitglieder: M }), /soll ungueltig/);
  await assert.rejects(schluesselVerteilen(g, 'kid:p_k1', { soll: [], ich: 'p_e1', meineSchluessel: KEYS.p_e1, mitglieder: M }), /bereiche/);
  await assert.rejects(schluesselLesen(g, 'kid:p_k1', { ich: 'p_e1', meineSchluessel: KEYS.p_e1, mitglieder: M }), /bereiche/);
});

/* ---------- Reinheit ---------- */
test('Reinheit: kein Netz, kein Browser-Speicher, kein eigener Zufall, keine Uhr; Importe nur aus krypto; Hilfsnamen mit ber/BER_', () => {
  const src = fs.readFileSync(new URL('../../src/module/bereiche.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /\bfetch\s*\(/);
  for (const w of ['XMLHttpRequest', 'localStorage', 'indexedDB', 'Math.random', 'Date.now', 'new Date(', 'api.github.com', 'setTimeout', 'document.', 'window.']) assert.equal(src.includes(w), false, w);
  assert.deepEqual([...src.matchAll(/^import .* from '(.+)';$/gm)].map((m) => m[1]), ['./krypto.mjs']);
  for (const m of src.matchAll(/^(?:export\s+)?(?:async\s+)?(?:function\s+([\w$]+)|(?:const|let|class)\s+([\w$]+))/gm)) {
    const name = m[1] || m[2];
    assert.ok(m[0].startsWith('export') || /^(ber|BER_)/.test(name), name);
  }
  const ann = fs.readFileSync(new URL('../../src/module/annahme.mjs', import.meta.url), 'utf8');
  assert.match(ann, /import \{ passtZumBereich \} from '\.\/bereiche\.mjs';/);
  const liste = JSON.parse(fs.readFileSync(new URL('../../src/module/module.json', import.meta.url), 'utf8')).module.map((m) => m.name);
  assert.ok(liste.indexOf('bereiche') > liste.indexOf('krypto') && liste.indexOf('bereiche') < liste.indexOf('annahme'), 'Reihenfolge: krypto vor bereiche vor annahme');
});
