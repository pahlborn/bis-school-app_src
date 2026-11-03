// Modul zulassung ohne Browser (S12 P3b-2a; Konzept 6, 8.3, 9.1). Die Zulassung eines Bereichs entsteht aus seinen
// eigenen, unterschriebenen Ereignissen; vorgegeben ist nur der Gruender-Elternteil (Anker).
//   node --test tests/module/zulassung.test.mjs

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ZULASSUNG_TYPEN, zulassungAus, aktiveMitglieder, bereichHolen } from '../../src/module/zulassung.mjs';
import { newPersonKeys, publicKeysOf, createKeyring, signBytes } from '../../src/module/krypto.mjs';
import { newEvent, checkEvent } from '../../src/module/ereignisse.mjs';
import { signEvent, acceptEvent, ANNAHME_GRUENDE } from '../../src/module/annahme.mjs';
import { halter, schluesselLesen, schluesselVerteilen } from '../../src/module/bereiche.mjs';
import { lokalerSpeicher } from '../../src/module/speicher.mjs';
import { abgleichStand, vormerken, senden, holen, ABGLEICH_GRUENDE } from '../../src/module/abgleich.mjs';

const L = 'kind:lern:p_k1', T0 = Date.UTC(2026, 10, 3, 8, 0, 0), JETZT = Date.UTC(2026, 10, 3, 12, 0, 0);
const ROLLE = { p_e1: 'parent', p_e2: 'parent', p_k1: 'child', p_l1: 'teacher', p_x1: 'parent' };
const KEYS = {}, PUB = {};
let ANKER, neuE2, neuE2pub;
before(async () => {
  for (const p of Object.keys(ROLLE)) { KEYS[p] = await newPersonKeys(); PUB[p] = await publicKeysOf(KEYS[p]); }
  neuE2 = await newPersonKeys(); neuE2pub = await publicKeysOf(neuE2);
  ANKER = { person: 'p_e1', role: 'parent', pub: PUB.p_e1 };
});
const at = (min) => new Date(T0 + min * 60000).toISOString();
let n = 0;
const rand = (k) => { n++; return Uint8Array.from({ length: k }, (_, i) => (n * 37 + i * 11) & 255); };
/* ein unterschriebenes Ereignis; Geraet standardmaessig d_ + Kuerzel der Person */
const ev = (pid, type, payload, min, { device = 'd_' + pid.slice(2), keys = KEYS[pid], area = L } = {}) =>
  signEvent(newEvent({ type, author: pid, device, at: at(min), payload }, { rand }), area, keys);
const geraet = (pid, min, device = 'd_' + pid.slice(2)) => ev(pid, 'device_added', { device }, min, { device });
const dazu = (von, wer, min, extra = {}) => ev(von, 'member_added', { person: wer, role: ROLLE[wer] || 'parent', pub: PUB[wer], ...extra }, min);
const aus = (liste, opts = {}) => zulassungAus(liste, { area: L, anker: ANKER, now: JETZT, ...opts });
/* die Familie: Gruender p_e1, zweiter Elternteil p_e2, Kind p_k1 mit zwei iPads */
async function grundstock() {
  return [await geraet('p_e1', 1), await dazu('p_e1', 'p_e2', 2), await dazu('p_e1', 'p_k1', 3), await geraet('p_e2', 4), await geraet('p_k1', 5), await geraet('p_k1', 6, 'd_k9')];
}

test('Aufbau: Mitglieder, Rollen, Schluessel und Geraete aus den Ereignissen; das Kindergeraet meldet sich selbst an', async () => {
  const z = await aus(await grundstock());
  assert.deepEqual(z.verworfen, []);
  assert.deepEqual(Object.keys(z.members), ['p_e1', 'p_e2', 'p_k1']);
  assert.deepEqual([z.members.p_e1.role, z.members.p_e2.role, z.members.p_k1.role], ['parent', 'parent', 'child']);
  assert.deepEqual(z.members.p_k1.pub, PUB.p_k1);
  assert.deepEqual(z.members.p_k1.devices, ['d_k1', 'd_k9']);
  assert.deepEqual(z.members.p_e1.perioden, [{ von: null, bis: null, role: 'parent', pub: PUB.p_e1 }], 'der Anker gehoert von Anfang an dazu');
  assert.deepEqual(z.members.p_k1.geraete.d_k9, [{ von: T0 + 6 * 60000, bis: null }]);
  // mit dieser Zulassung: eine Antwort vom zweiten iPad des Kindes wird angenommen, eine vom nicht angemeldeten Geraet nicht
  const antwort = { day: '2026-11-03', skill: 'round', level: 2, attempt: 1, ok: true, qid: 'q1' };
  assert.deepEqual(await acceptEvent(await ev('p_k1', 'answer', antwort, 7, { device: 'd_k9' }), z), { ok: true });
  assert.deepEqual(await acceptEvent(await ev('p_k1', 'answer', antwort, 7, { device: 'd_k5' }), z), { ok: false, grund: 'geraet-fremd' });
  assert.deepEqual(ZULASSUNG_TYPEN, ['member_added', 'member_removed', 'device_added', 'device_removed']);
});

test('Anker: ohne ihn zaehlt nichts; Fremde, Kinder und Eltern ohne Geraet nehmen niemanden auf', async () => {
  const g = await grundstock();
  const vomKind = await dazu('p_k1', 'p_x1', 10);                              // das Kind nimmt jemanden auf
  const selbst = await dazu('p_x1', 'p_x1', 11);                               // ein "zweiter Gruender" nimmt sich selbst auf
  const ohneGeraet = await ev('p_e2', 'member_added', { person: 'p_x1', role: 'parent', pub: PUB.p_x1 }, 12, { device: 'd_e7' });
  const z = await aus([...g, vomKind, selbst, ohneGeraet]);
  assert.deepEqual(Object.keys(z.members), ['p_e1', 'p_e2', 'p_k1']);
  assert.deepEqual(z.verworfen.map((v) => [v.id, v.grund]), [[vomKind.event.id, 'rolle-darf-nicht'], [selbst.event.id, 'autor-unbekannt'], [ohneGeraet.event.id, 'geraet-fremd']]);
  // falscher Anker (anderer oeffentlicher Schluessel): niemand ausser ihm selbst, alles verworfen
  const falsch = await aus(g, { anker: { ...ANKER, pub: PUB.p_x1 } });
  assert.deepEqual(Object.keys(falsch.members), ['p_e1']);
  assert.equal(falsch.verworfen.length, g.length);
  assert.deepEqual(falsch.verworfen.map((v) => v.grund), ['unterschrift', 'geraet-fremd', 'geraet-fremd', 'autor-unbekannt', 'autor-unbekannt', 'autor-unbekannt']);
  // anderer Anker (der zweite Elternteil, ohne dass der Gruender ihn kennt): dessen Aufnahme durch p_e1 zaehlt nicht
  const andersrum = await aus(g, { anker: { person: 'p_e2', role: 'parent', pub: PUB.p_e2 } });
  assert.deepEqual(Object.keys(andersrum.members), ['p_e2']);
});

test('Zeitfolge: wer entfernt ist, nimmt niemanden mehr auf; Neuaufnahme mit neuem Schluessel ist ein neuer Zeitraum', async () => {
  const g = await grundstock();
  const vorher = await dazu('p_e2', 'p_l1', 9);
  const raus = await ev('p_e1', 'member_removed', { person: 'p_e2' }, 10);
  const nachher = await dazu('p_e2', 'p_x1', 11);
  const wieder = await ev('p_e1', 'member_added', { person: 'p_e2', role: 'parent', pub: neuE2pub }, 12);
  const geraetWeg = await ev('p_e1', 'device_removed', { device: 'd_k9' }, 13);
  const kindEntfernt = await ev('p_k1', 'device_removed', { device: 'd_k1' }, 14);
  const z = await aus([...g, vorher, raus, nachher, wieder, geraetWeg, kindEntfernt]);
  assert.deepEqual(Object.keys(z.members), ['p_e1', 'p_e2', 'p_k1', 'p_l1'], 'vor dem Entfernen aufgenommen: zaehlt');
  assert.deepEqual(z.verworfen.map((v) => [v.id, v.grund]), [[nachher.event.id, 'autor-unbekannt'], [kindEntfernt.event.id, 'rolle-darf-nicht']]);
  const e2 = z.members.p_e2;
  assert.deepEqual(e2.perioden.map((p) => [p.von, p.bis, p.pub.ecdsa === PUB.p_e2.ecdsa]), [[T0 + 2 * 60000, T0 + 10 * 60000, true], [T0 + 12 * 60000, null, false]]);
  assert.deepEqual(e2.pub, neuE2pub, 'role und pub: aus dem letzten Zeitraum');
  assert.deepEqual(e2.geraete.d_e2, [{ von: T0 + 4 * 60000, bis: T0 + 10 * 60000 }], 'Entfernen beendet auch die Geraete');
  assert.deepEqual(z.members.p_k1.geraete.d_k9, [{ von: T0 + 6 * 60000, bis: T0 + 13 * 60000 }]);
  assert.deepEqual(z.members.p_k1.geraete.d_k1, [{ von: T0 + 5 * 60000, bis: null }]);
  assert.deepEqual(Object.keys(aktiveMitglieder(z)), ['p_e1', 'p_e2', 'p_k1', 'p_l1']);
  // nach dem Wiederaufnehmen muss sich das Geraet neu anmelden; dann schreibt p_e2 mit dem neuen Schluessel
  const neuGeraet = await ev('p_e2', 'device_added', { device: 'd_e2' }, 15, { keys: neuE2 });
  const neuAuf = await ev('p_e2', 'member_added', { person: 'p_x1', role: 'parent', pub: PUB.p_x1 }, 16, { keys: neuE2 });
  const altSchluessel = await ev('p_e2', 'member_removed', { person: 'p_l1' }, 17);
  const z2 = await aus([...g, vorher, raus, nachher, wieder, geraetWeg, neuGeraet, neuAuf, altSchluessel]);
  assert.ok('p_x1' in z2.members);
  assert.deepEqual(z2.verworfen.map((v) => v.grund), ['autor-unbekannt', 'unterschrift'], 'mit dem alten Schluessel unterschreibt er nicht mehr');
  // gleiche Rolle und gleicher Schluessel noch einmal: kein neuer Zeitraum
  const z3 = await aus([...g, await dazu('p_e1', 'p_e2', 20)]);
  assert.equal(z3.members.p_e2.perioden.length, 1);
  // aus "jetzt" gesehen mehr als 24 h in der Zukunft: zaehlt als "jetzt"
  const zukunft = await ev('p_e1', 'member_removed', { person: 'p_k1' }, 3 * 24 * 60);
  assert.equal((await aus([...g, zukunft])).members.p_k1.perioden[0].bis, JETZT);
});

test('Lehrkraft und Admin melden nur ihr eigenes Geraet an', async () => {
  const g = [...(await grundstock()), await dazu('p_e1', 'p_l1', 8)];
  const eigen = await geraet('p_l1', 9), fremd = await ev('p_l1', 'device_added', { device: 'd_e1' }, 10);
  const z = await aus([...g, eigen, fremd]);
  assert.deepEqual(z.members.p_l1.devices, ['d_l1']);
  assert.deepEqual(z.verworfen.map((v) => [v.id, v.grund]), [[fremd.event.id, 'rolle-darf-nicht']]);
  assert.deepEqual(z.members.p_l1.role, 'teacher');
});

test('Reihenfolge egal: gemischt, doppelt, mit fremden Eintraegen -> dieselbe Zulassung (E4)', async () => {
  const g = await grundstock();
  const rest = [await dazu('p_e2', 'p_l1', 9), await ev('p_e1', 'member_removed', { person: 'p_e2' }, 10), await dazu('p_e2', 'p_x1', 11), await ev('p_e1', 'device_removed', { device: 'd_k9' }, 12)];
  const alle = [...g, ...rest], soll = JSON.stringify(await aus(alle));
  let s = 7;
  const zufall = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  for (let i = 0; i < 15; i++) {
    const gemischt = [...alle, ...alle.slice(0, i % 5), null, 'x', { event: null }].sort(() => zufall() - 0.5);
    assert.equal(JSON.stringify(await aus(gemischt)), soll, 'Lauf ' + i);
  }
});

/* ---------- mit Speicher und Abgleich ---------- */
const sk = (d) => lokalerSpeicher({ now: () => JETZT }).geraet(d);
async function senden1(z, area, pid, items, sch) {
  const st = abgleichStand(area, 'd_' + pid.slice(2));
  for (const x of items) vormerken(st, x, { now: JETZT });
  await senden(st, { zugang: z, schluessel: sch });
}
const M = () => Object.fromEntries(Object.keys(ROLLE).filter((p) => p !== 'p_x1').map((p) => [p, { role: ROLLE[p], pub: PUB[p], devices: ['d_' + p.slice(2)] }]));

test('holen mit Zulassung als Funktion: wer im selben Abruf aufgenommen wird, zaehlt schon', async () => {
  const s = lokalerSpeicher({ now: () => JETZT }), m = M();
  const ze = s.geraet('d_e1');
  await schluesselVerteilen(ze, L, { soll: halter(L, m, [], '2026-11-03'), ich: 'p_e1', meineSchluessel: KEYS.p_e1, mitglieder: m });
  const schE = await schluesselLesen(ze, L, { ich: 'p_e1', meineSchluessel: KEYS.p_e1, mitglieder: m });
  await senden1(ze, L, 'p_e1', [await geraet('p_e1', 1), await dazu('p_e1', 'p_k1', 2)], schE);
  const antwort = await ev('p_k1', 'answer', { day: '2026-11-03', skill: 'round', level: 2, attempt: 1, ok: true, qid: 'q1' }, 4);
  await senden1(s.geraet('d_k1'), L, 'p_k1', [await geraet('p_k1', 3), antwort], schE);
  const st = abgleichStand(L, 'd_e2');
  const h = await holen(st, { zugang: s.geraet('d_e2'), schluessel: schE, zulassung: (x) => zulassungAus(x, { area: L, anker: ANKER, now: JETZT }), now: JETZT });
  assert.deepEqual([h.neu, h.verworfen], [4, []]);
  assert.ok(st.log.some((x) => x.event.id === antwort.event.id));
  // ohne die Zulassungs-Ereignisse (nur Anker): die Antwort des Kindes wird verworfen
  const st2 = abgleichStand(L, 'd_e2');
  const h2 = await holen(st2, { zugang: s.geraet('d_e2'), schluessel: schE, zulassung: { area: L, members: { p_e1: { role: 'parent', pub: PUB.p_e1, devices: ['d_e1'] } } }, now: JETZT });
  assert.ok(h2.verworfen.some((v) => v.id === antwort.event.id && v.grund === 'autor-unbekannt'));
});

test('bereichHolen: neues Geraet kennt nur den Anker - auch nach einem Schluesselwechsel durch den zweiten Elternteil; ein entfernter Elternteil schiebt keinen Schluessel unter', async () => {
  const s = lokalerSpeicher({ now: () => JETZT }), m = M();
  const ze1 = s.geraet('d_e1'), ze2 = s.geraet('d_e2'), zk = s.geraet('d_k1');
  const fr = [{ grant: 'g1', grantee: 'p_l1', scope: ['learning'], from: '2026-11-01', until: '2026-11-10' }];
  const verteilen = async (z, ich, heute, extra = []) => {
    const r = await schluesselVerteilen(z, L, { soll: halter(L, m, fr, heute), ich, meineSchluessel: KEYS[ich], mitglieder: m });
    const sch = await schluesselLesen(z, L, { ich, meineSchluessel: KEYS[ich], mitglieder: m });
    const items = [...extra];
    for (const [i, e] of r.ereignisse.entries()) items.push(await ev(ich, e.type, e.payload, 20 + i + (heute > '2026-11-05' ? 100 : 0)));
    if (items.length) await senden1(z, L, ich, items, sch);
    return r;
  };
  assert.equal((await verteilen(ze1, 'p_e1', '2026-11-03', [await geraet('p_e1', 1)])).aktion, 'angelegt');
  const schK = await schluesselLesen(zk, L, { ich: 'p_k1', meineSchluessel: KEYS.p_k1, mitglieder: m });
  await senden1(zk, L, 'p_k1', [await geraet('p_k1', 30), await ev('p_k1', 'answer', { day: '2026-11-03', skill: 'round', level: 1, attempt: 1, ok: true, qid: 'a' }, 31)], schK);
  // der zweite Elternteil beendet die Freigabe: neue Version, alle Eintraege jetzt von ihm unterschrieben
  const r2 = await verteilen(ze2, 'p_e2', '2026-11-11', [await geraet('p_e2', 110)]);
  assert.deepEqual([r2.aktion, r2.version, r2.entfernt], ['gewechselt', 2, ['p_l1']]);
  assert.deepEqual(r2.ereignisse.map((e) => e.type), ['member_removed', 'key_rotated']);
  assert.deepEqual(r2.ereignisse[1].payload, { version: 2, entfernt: ['p_l1'], stand: { d_e1: 1, d_k1: 1 } });
  const schK2 = await schluesselLesen(zk, L, { ich: 'p_k1', meineSchluessel: KEYS.p_k1, mitglieder: m });
  await senden1(zk, L, 'p_k1', [await ev('p_k1', 'answer', { day: '2026-11-11', skill: 'round', level: 1, attempt: 1, ok: true, qid: 'b' }, 140)], schK2);
  // ein neues iPad des Kindes kennt nur den Anker: der Eintrag des Kindes stammt von p_e2 -> erst lesen, dann pruefen
  const nurAnker = await schluesselLesen(zk, L, { ich: 'p_k1', meineSchluessel: KEYS.p_k1, mitglieder: { p_e1: { role: 'parent', pub: PUB.p_e1 } } });
  assert.deepEqual([nurAnker.keys.size, nurAnker.lesbar.size], [0, 2], 'zum Schreiben nichts, zum Lesen alles');
  const st = abgleichStand(L, 'd_k5');
  const r = await bereichHolen(st, { zugang: s.geraet('d_k5'), ich: 'p_k1', meineSchluessel: KEYS.p_k1, anker: ANKER, now: JETZT });
  assert.deepEqual([r.verworfen, r.wartend, r.schluessel.aktuell, [...r.schluessel.keys.keys()].sort()], [[], [], 2, [1, 2]]);
  assert.equal(st.log.filter((x) => x.event.type === 'answer').length, 2);
  assert.deepEqual(Object.keys(aktiveMitglieder(r.zulassung)), ['p_e1', 'p_e2', 'p_k1']);
  assert.equal(r.zulassung.members.p_l1.perioden.at(-1).bis !== null, true, 'die Lehrkraft ist entfernt');
  // p_e1 entfernt p_e2 und wechselt; danach schiebt p_e2 (er kennt den Speicher) eine eigene Version 4 unter
  const m2 = { ...m }; delete m2.p_e2;
  const r3 = await schluesselVerteilen(ze1, L, { soll: halter(L, m2, fr, '2026-11-12'), ich: 'p_e1', meineSchluessel: KEYS.p_e1, mitglieder: m });
  const sch3 = await schluesselLesen(ze1, L, { ich: 'p_e1', meineSchluessel: KEYS.p_e1, mitglieder: m });
  const items3 = [];
  for (const [i, e] of r3.ereignisse.entries()) items3.push(await ev('p_e1', e.type, e.payload, 200 + i));
  await senden1(ze1, L, 'p_e1', items3, sch3);
  assert.equal(r3.version, 3);
  const fremd = await createKeyring(L, [{ id: 'p_k1', pub: PUB.p_k1 }]);
  const canon = (x) => (x === null || typeof x !== 'object' ? JSON.stringify(x) : '{' + Object.keys(x).sort().map((k) => JSON.stringify(k) + ':' + canon(x[k])).join(',') + '}');
  const alt = (await ze1.keys(L)).p_k1, versionen = { ...alt.versionen, 4: fremd.ring.versions[1].p_k1 };
  await ze2.putKey(L, 'p_k1', { v: 1, von: 'p_e2', versionen, sig: await signBytes(KEYS.p_e2, 'bq-key1|' + L + '|p_k1|' + canon({ v: 1, von: 'p_e2', versionen })) });
  const st4 = abgleichStand(L, 'd_k6');
  const r4 = await bereichHolen(st4, { zugang: s.geraet('d_k6'), ich: 'p_k1', meineSchluessel: KEYS.p_k1, anker: ANKER, now: JETZT });
  assert.ok(!('p_e2' in aktiveMitglieder(r4.zulassung)), 'p_e2 gehoert nicht mehr dazu');
  assert.equal(r4.schluessel.keys.size, 0, 'sein Eintrag zaehlt fuer das Schreiben nicht - das Kind schreibt nicht mit seiner Version 4');
  assert.equal(r4.schluessel.aktuell, 3, 'aktuell bleibt die Version der Eltern');
});

test('Eingaben: Anker, Bereich, now und Liste sind Pflicht', async () => {
  for (const anker of [undefined, null, {}, { person: 'p_e1', role: 'parent' }, { person: 'x', role: 'parent', pub: PUB.p_e1 }, { person: 'p_e1', role: 'king', pub: PUB.p_e1 }]) {
    await assert.rejects(zulassungAus([], { area: L, anker, now: JETZT }), /Anker/, JSON.stringify(anker));
  }
  await assert.rejects(zulassungAus([], { area: '', anker: ANKER, now: JETZT }), /Bereich/);
  await assert.rejects(zulassungAus([], { area: L, anker: ANKER }), /now/);
  await assert.rejects(zulassungAus(null, { area: L, anker: ANKER, now: JETZT }), /Liste/);
  assert.throws(() => aktiveMitglieder(null), /Zulassung/);
  // Format v1 (P3b-2a): member_added mit Rolle und oeffentlichen Schluesseln, key_rotated mit entfernt und stand
  const mk = (type, payload) => checkEvent(newEvent({ type, author: 'p_e1', device: 'd_e1', at: at(1), payload }, { rand }));
  assert.deepEqual(mk('member_added', { person: 'p_k1', role: 'child', pub: PUB.p_k1 }), []);
  for (const pub of [undefined, {}, { ecdh: PUB.p_k1.ecdh }, { ...PUB.p_k1, x: 'A' }, { ecdh: 'nicht base64!', ecdsa: 'AAAA' }, { ecdh: 1, ecdsa: 'AAAA' }]) assert.notDeepEqual(mk('member_added', { person: 'p_k1', role: 'child', pub }), [], JSON.stringify(pub));
  for (const role of [undefined, 'guest', 'Child']) assert.notDeepEqual(mk('member_added', { person: 'p_k1', role, pub: PUB.p_k1 }), [], String(role));
  assert.deepEqual(mk('key_rotated', { version: 2, entfernt: [], stand: {} }), []);
  for (const [entfernt, stand] of [[['p_l1', 'p_l1'], {}], [['l1'], {}], [[], { x1: 1 }], [[], { d_e1: -1 }], [[], { d_e1: 1.5 }], [undefined, {}], [[], undefined]]) assert.notDeepEqual(mk('key_rotated', { version: 2, entfernt, stand }), [], JSON.stringify([entfernt, stand]));
  await assert.rejects(bereichHolen(null, { anker: ANKER }), /Geraetestand/);
  assert.deepEqual((await aus([])).members, { p_e1: { role: 'parent', pub: PUB.p_e1, devices: [], perioden: [{ von: null, bis: null, role: 'parent', pub: PUB.p_e1 }], geraete: {} } });
});

test('Reinheit: kein Netz, kein Speicher, keine Uhr, kein Zufall; Importe nur aus Modulen; Hilfsnamen mit zul/ZUL_', () => {
  const src = fs.readFileSync(new URL('../../src/module/zulassung.mjs', import.meta.url), 'utf8');
  for (const w of ['fetch(', 'XMLHttpRequest', 'localStorage', 'indexedDB', 'Math.random', 'Date.now', 'new Date(', 'setTimeout', 'document.', 'window.']) assert.equal(src.includes(w), false, w);
  assert.deepEqual([...src.matchAll(/^import .* from '(.+)';$/gm)].map((m) => m[1]), ['./ereignisse.mjs', './annahme.mjs', './bereiche.mjs', './abgleich.mjs']);
  for (const m of src.matchAll(/^(?:export\s+)?(?:async\s+)?(?:function\s+([\w$]+)|(?:const|let|class)\s+([\w$]+))/gm)) {
    const name = m[1] || m[2];
    assert.ok(m[0].startsWith('export') || /^(zul|ZUL_)/.test(name), name);
  }
  const liste = JSON.parse(fs.readFileSync(new URL('../../src/module/module.json', import.meta.url), 'utf8')).module.map((x) => x.name);
  assert.ok(liste.indexOf('zulassung') > liste.indexOf('abgleich'), 'nach abgleich');
});

/* ---------- 2b: zu diesem Zeitpunkt ---------- */
const blatt = (min) => ({ sheet: 's' + String(min).replace('.', '-'), day: '2026-11-03', no: 1, writing: 'en', items: [] });
const antwort = (q) => ({ day: '2026-11-03', skill: 'round', level: 2, attempt: 1, ok: true, qid: q });

test('2b Zeitpunkt: Mitglied und Geraet zaehlen nur in ihrem Zeitraum; die Grenze gehoert zum neuen Zustand; Uhrenregel', async () => {
  // p_x1 wird 12 Stunden nach "jetzt" aufgenommen (Uhr des Geraets etwas voraus, unter 24 h: zaehlt so)
  const z = await aus([...(await grundstock()), await ev('p_e1', 'member_removed', { person: 'p_e2' }, 10), await ev('p_e1', 'device_removed', { device: 'd_k9' }, 13),
    await dazu('p_e1', 'p_x1', 960), await geraet('p_x1', 961)]);
  assert.equal(z.now, JETZT);
  const grund = async (x) => { const r = await acceptEvent(x, z); return r.ok ? 'ok' : r.grund; };
  const fall = [
    ['p_e2', 'sheet_created', blatt(1), 1, {}, 'nicht-mitglied', 'vor der Aufnahme'],
    ['p_e2', 'sheet_created', blatt(2), 2, {}, 'geraet-nicht-angemeldet', 'genau bei der Aufnahme, Geraet erst ab 4'],
    ['p_e2', 'sheet_created', blatt(4), 4, {}, 'ok', 'genau bei der Geraeteanmeldung'],
    ['p_e2', 'sheet_created', blatt(9.5), 9.5, {}, 'ok', 'kurz vor dem Entfernen'],
    ['p_e2', 'sheet_created', blatt(10), 10, {}, 'nicht-mitglied', 'genau beim Entfernen'],
    ['p_e2', 'sheet_created', blatt(11), 11, {}, 'nicht-mitglied', 'nach dem Entfernen'],
    ['p_e2', 'sheet_created', blatt(3 * 24 * 60), 3 * 24 * 60, {}, 'nicht-mitglied', 'mehr als 24 h voraus zaehlt als jetzt'],
    ['p_k1', 'answer', antwort('a'), 5.5, { device: 'd_k9' }, 'geraet-nicht-angemeldet', 'zweites iPad vor seiner Anmeldung'],
    ['p_k1', 'answer', antwort('b'), 7, { device: 'd_k9' }, 'ok', 'zweites iPad angemeldet'],
    ['p_k1', 'answer', antwort('c'), 13, { device: 'd_k9' }, 'geraet-nicht-angemeldet', 'zweites iPad entfernt'],
    ['p_k1', 'answer', antwort('d'), 13, { device: 'd_k1' }, 'ok', 'erstes iPad bleibt'],
    ['p_k1', 'answer', antwort('e'), 7, { device: 'd_k5' }, 'geraet-fremd', 'nie angemeldet'],
    ['p_e1', 'sheet_created', blatt(0.5), 0.5, {}, 'geraet-nicht-angemeldet', 'auch der Anker braucht sein Geraet'],
    ['p_x1', 'sheet_created', blatt(970), 970, {}, 'ok', 'unter 24 h voraus: so wie geschrieben'],
    ['p_x1', 'sheet_created', blatt(4320), 4320, {}, 'nicht-mitglied', 'mehr als 24 h voraus zaehlt als jetzt - da war er noch nicht dabei'],
  ];
  for (const [pid, type, payload, min, opts, soll, was] of fall) assert.equal(await grund(await ev(pid, type, payload, min, opts)), soll, was);
  // eine Zulassung mit Zeitraeumen ohne "now" ist ein Programmfehler
  await assert.rejects(acceptEvent(await ev('p_e1', 'sheet_created', blatt(5), 5), { area: L, members: z.members }), /now/);
  assert.deepEqual(ANNAHME_GRUENDE, ['format', 'autor-unbekannt', 'nicht-mitglied', 'geraet-fremd', 'geraet-nicht-angemeldet', 'unterschrift', 'bereich-falsch', 'rolle-darf-nicht']);
  assert.ok(ABGLEICH_GRUENDE.includes('nach-entfernung'));
});

test('2b Neuer Schluessel: jeder Zeitraum prueft mit seinem eigenen Schluessel und seiner eigenen Rolle', async () => {
  const z = await aus([...(await grundstock()), await ev('p_e1', 'member_removed', { person: 'p_e2' }, 10),
    await ev('p_e1', 'member_added', { person: 'p_e2', role: 'parent', pub: neuE2pub }, 12), await ev('p_e2', 'device_added', { device: 'd_e2' }, 15, { keys: neuE2 }),
    await ev('p_e1', 'member_added', { person: 'p_k1', role: 'parent', pub: PUB.p_k1 }, 20)]);
  const grund = async (x) => { const r = await acceptEvent(x, z); return r.ok ? 'ok' : r.grund; };
  assert.equal(await grund(await ev('p_e2', 'sheet_created', blatt(5), 5)), 'ok', 'alter Schluessel im alten Zeitraum');
  assert.equal(await grund(await ev('p_e2', 'sheet_created', blatt(16), 16)), 'unterschrift', 'alter Schluessel im neuen Zeitraum');
  assert.equal(await grund(await ev('p_e2', 'sheet_created', blatt(5.5), 5.5, { keys: neuE2 })), 'unterschrift', 'neuer Schluessel im alten Zeitraum');
  assert.equal(await grund(await ev('p_e2', 'sheet_created', blatt(16.5), 16.5, { keys: neuE2 })), 'ok', 'neuer Schluessel im neuen Zeitraum');
  assert.equal(await grund(await ev('p_e2', 'sheet_created', blatt(11), 11, { keys: neuE2 })), 'nicht-mitglied', 'dazwischen');
  assert.equal(await grund(await ev('p_e2', 'sheet_created', blatt(13), 13, { keys: neuE2 })), 'geraet-nicht-angemeldet', 'wieder dabei, Geraet noch nicht neu angemeldet');
  // Rolle je Zeitraum: als Kind schreibt p_k1 Antworten, nach dem Wechsel der Rolle nicht mehr
  assert.equal(await grund(await ev('p_k1', 'answer', antwort('x'), 19)), 'ok');
  assert.equal(await grund(await ev('p_k1', 'answer', antwort('y'), 21)), 'rolle-darf-nicht');
});

test('2b Ex-Halter (E6): rueckdatierte Buendel mit alter Version nach dem Wechsel -> nach-entfernung; nach erneuter Aufnahme zaehlt Neues', async () => {
  const F1 = 'freigabe:g1', s = lokalerSpeicher({ now: () => JETZT }), m = M();
  const zug = { p_e1: s.geraet('d_e1'), p_l1: s.geraet('d_l1') };
  const g1 = (until) => [{ grant: 'g1', grantee: 'p_l1', scope: ['learning'], from: '2026-11-01', until }];
  const stL = abgleichStand(F1, 'd_l1'), stE = abgleichStand(F1, 'd_e1');
  const sendeAls = async (pid, st, items, sch) => { for (const x of items) vormerken(st, x, { now: JETZT }); await senden(st, { zugang: zug[pid], schluessel: sch }); };
  const schVon = (pid) => schluesselLesen(zug[pid], F1, { ich: pid, meineSchluessel: KEYS[pid], mitglieder: m });
  const verteile = async (heute, fr, min, extra = []) => {
    const r = await schluesselVerteilen(zug.p_e1, F1, { soll: halter(F1, m, fr, heute), ich: 'p_e1', meineSchluessel: KEYS.p_e1, mitglieder: m });
    const items = [...extra];
    for (const [i, e] of r.ereignisse.entries()) items.push(await ev('p_e1', e.type, e.payload, min + i, { area: F1 }));
    await sendeAls('p_e1', stE, items, await schVon('p_e1'));
    return r;
  };
  const offen = (min) => ev('p_l1', 'grant_opened', { grant: 'g1', grantee: 'p_l1' }, min, { area: F1 });
  await verteile('2026-11-03', g1('2026-11-10'), 20, [await ev('p_e1', 'device_added', { device: 'd_e1' }, 1, { area: F1 })]);
  const echt = await offen(31);
  await sendeAls('p_l1', stL, [await ev('p_l1', 'device_added', { device: 'd_l1' }, 30, { area: F1 }), echt], await schVon('p_l1'));     // d_l1/1
  const altSch = await schVon('p_l1');
  const r = await verteile('2026-11-11', g1('2026-11-10'), 100);                                       // Ablauf -> Wechsel
  assert.deepEqual(r.ereignisse[1].payload, { version: 2, entfernt: ['p_l1'], stand: { d_e1: 1, d_l1: 1 } });
  // die Ex-Lehrkraft legt mit ihrer alten Version Eintraege ab, die angeblich vor dem Ende liegen
  const rueck = await offen(35), spaetEcht = await offen(40);
  await sendeAls('p_l1', stL, [rueck, spaetEcht], altSch);                                            // d_l1/2, Version 1
  assert.equal((await zug.p_l1.get(F1, 'd_l1/2')).kv, 1);
  // Verlaengerung: sie gehoert wieder dazu, bekommt Version 2 und meldet ihr Geraet neu an
  assert.equal((await verteile('2026-11-20', g1('2026-11-30'), 200)).aktion, 'ergaenzt');
  const neu = await offen(210);
  await sendeAls('p_l1', stL, [await ev('p_l1', 'device_added', { device: 'd_l1' }, 205, { area: F1 }), neu], await schVon('p_l1'));   // d_l1/3, Version 2
  // ein zweiter Elternteil liest den Bereich frisch
  const st = abgleichStand(F1, 'd_e2');
  const h = await bereichHolen(st, { zugang: s.geraet('d_e2'), ich: 'p_e2', meineSchluessel: KEYS.p_e2, anker: ANKER, now: JETZT });
  const ids = st.log.map((x) => x.event.id);
  assert.ok(ids.includes(echt.event.id) && ids.includes(neu.event.id), 'echt vor dem Ende und nach der Verlaengerung: angenommen');
  assert.deepEqual(h.verworfen.map((v) => [v.kennung, v.id, v.grund]).sort(), [['d_l1/2', rueck.event.id, 'nach-entfernung'], ['d_l1/2', spaetEcht.event.id, 'nach-entfernung']].sort());
});