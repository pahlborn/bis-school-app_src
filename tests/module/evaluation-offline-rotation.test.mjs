// REST-ROT-01: a confirmed school evaluation, signed and prepared for upload, then the upload is interrupted; the same
// parent renews the keys on another device and logs in again -> the original event reaches the other parent exactly once.
//   node --test tests/module/evaluation-offline-rotation.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { verbindungen, kindAnlegen, elternteilEinladen, abgleichMitVerbindungen } from '../../src/module/einladung.mjs';
import { startcodeAusstellen, ersteAnmeldung, anmelden, schluesselErneuern, kontoPersonen } from '../../src/module/konto.mjs';
import { lokalerSpeicher } from '../../src/module/speicher.mjs';
import { newEvent, checkEvent, mergeLog } from '../../src/module/ereignisse.mjs';
import { deriveSchool } from '../../src/module/ableitung.mjs';
import { GERAETEABGLEICH_SPEICHER } from '../../src/module/geraeteabgleich.mjs';
import { abgleichStand, buendelErneuern } from '../../src/module/abgleich.mjs';

const R = 1000, T0 = Date.UTC(2026, 10, 4, 8), HEUTE = '2026-11-04';
const PW = { verwalter: 'Tiger-Lamp-River-4271', peter: 'Otter-Cake-Moss-1234', anna: 'Koala-Bread-Cliff-5502', kathie: 'Puffin-Jam-Lake-9876', neu: 'Walrus-Taco-Pine-1357' };
const weiter = (W, ms = 60000) => (W.uhr.t += ms);
const ablage = () => { const m = new Map(); return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } }; };
/* Execute the actual app adapters. They deliberately create new account containers; an IndexedDB roundtrip clones
   CryptoKeys as well. The recovery permission must survive the former and must never survive the latter. */
function appKontenAdapter() {
  const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  const sourceOf = (name, prefix = '') => {
    const begin = html.indexOf(prefix + 'function ' + name + '('), end = html.indexOf('\n}', begin) + 2;
    assert.ok(begin >= 0 && end > begin); return html.slice(begin, end);
  };
  let idbKopie;
  const context = vm.createContext({ kontoOffen: new Map(), kontoAlt: new Map(), kontoListe: () => [], kontoFehlerListe: [],
    kontoIdbTun: async (_, action) => action({ put: (v) => { idbKopie = structuredClone(v); } }) });
  vm.runInContext(sourceOf('kontoMerken', 'async ') + '\n' + sourceOf('kontoKonto'), context);
  return { merken: (k) => context.kontoMerken(k), konto: (id) => context.kontoKonto(id), idbKopie: () => idbKopie };
}
function geraet(W, d, konto) {
  const a = ablage(); a.setItem('bq2_evDevice', JSON.stringify(d));
  const g = {
    a, d, konto,
    z: () => W.geraet(d),
    sync: () => abgleichMitVerbindungen({ ablage: a, zugang: W.geraet(d), konten: [g.konto], now: weiter(W), heute: HEUTE }),
    v: () => verbindungen({ ablage: a, konto: g.konto, now: W.uhr.t }),
    log: (kind) => JSON.parse(a.getItem('bq2_' + kind + '__events') || '[]'),
    antworten: (kind) => g.log(kind).filter((e) => e.type === 'answer').map((e) => e.id).sort(),
    ueben: (n) => {
      const k = 'bq2_' + g.konto.kennung + '__events', l = JSON.parse(a.getItem(k) || '[]');
      for (let i = 0; i < n; i++) l.push(newEvent({ type: 'answer', author: g.konto.kennung, device: d, at: new Date(weiter(W, 1000)).toISOString(), payload: { day: HEUTE, skill: 'numbers', level: 2, attempt: 1, ok: true, qid: 'q' + l.length } }));
      a.setItem(k, JSON.stringify(l));
    },
    schreibt: (kind, type, payload) => {
      const k = 'bq2_' + kind + '__events', l = JSON.parse(a.getItem(k) || '[]');
      l.push(newEvent({ type, author: g.konto.kennung, device: d, at: new Date(weiter(W, 1000)).toISOString(), payload }));
      a.setItem(k, JSON.stringify(l));
    },
    fertig: (r) => { assert.deepEqual(r.erneuerungOffen, [], 'alle Bereiche haben den neuen Schluessel'); if (g.konto.alt) { g.konto = { ...g.konto }; delete g.konto.alt; } },
  };
  return g;
}
async function einloesen(W, d, qr, passwort) {
  return geraet(W, d, await ersteAnmeldung({ zugang: W.geraet(d), code: qr.code, passwort, fingerabdruck: qr.fingerabdruck, now: W.uhr.t, runden: R }));
}
async function familie(W) {
  const sa = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: null, anmeldename: 'verwalter', art: 'admin', now: W.uhr.t });
  const admin = await ersteAnmeldung({ zugang: W.geraet('d_A1'), code: sa.code, passwort: PW.verwalter, now: W.uhr.t, runden: R });
  const sp = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: admin, anmeldename: 'peter', art: 'parent', now: W.uhr.t });
  const P1 = await einloesen(W, 'd_P1', sp, PW.peter);
  await P1.sync();
  const e = await elternteilEinladen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, anmeldename: 'anna', now: weiter(W) });
  const P2 = await einloesen(W, 'd_P2', e, PW.anna);
  await P2.sync(); await P1.sync(); await P2.sync();
  const qr = await kindAnlegen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, anmeldename: 'kathie', anzeigename: 'Kathie', now: weiter(W) });
  const K = await einloesen(W, 'd_K1', qr, PW.kathie);
  await K.sync(); await P1.sync(); await K.sync(); await P2.sync(); await P1.sync();
  K.ueben(3); await K.sync(); await P1.sync(); await P2.sync();
  assert.equal(P2.antworten(K.konto.kennung).length, 3, 'Ausgangslage: Anna sieht 3 Antworten');
  return { admin, P1, P2, K };
}

test('REST-ROT-01: prepared in-flight (signed, bundle prepared, upload interrupted) -> the confirmed evaluation reaches the other parent once after the renewal, bytes unchanged', async () => {
  const uhr = { t: T0 }, storage = lokalerSpeicher({ now: () => uhr.t });
  let blocked = null;
  const W = { uhr, geraet(d) { const z = storage.geraet(d); return { ...z, async put(area, ...args) { if (blocked && blocked.device === d && blocked.area === area) { const e = new Error('Synthetic dropped upload'); e.code = 'offline'; throw e; } return z.put(area, ...args); } }; } };
  const { P1, P2, K } = await familie(W), child = K.konto.kennung, area = 'schule:' + child;
  const P1b = geraet(W, 'd_P1b', await anmelden({ zugang: W.geraet('d_P1b'), anmeldename: 'peter', passwort: PW.peter, runden: R }));
  await P1b.sync();
  const evaluation = '0a667a6c-8d8c-4520-a6ec-000000000001', revision = '0a667a6c-8d8c-4520-a6ec-000000000002';
  P1.schreibt(child, 'school_evaluation', { child, evaluation, revision, title: 'Synthetic REST rotation evaluation', day: HEUTE, assessment: { area: 'maths', goal: '', instructions: '', feedback: '', criteria: [{ criterion: 'Synthetic place value criterion', rating: 'C', standard: 'M-N1', evidence: '' }] } });
  const event = P1.log(child).find((e) => e.payload && e.payload.evaluation === evaluation);
  assert.deepEqual(checkEvent(event), []);
  blocked = { device: P1.d, area };
  await P1.sync();
  const st = JSON.parse(P1.a.getItem(GERAETEABGLEICH_SPEICHER.staende))[area];
  assert.ok(st.ausgang.some((x) => x.event.id === event.id && x.sig), 'signed outbox');
  assert.ok(st.unterwegs && st.unterwegs.inhalt && st.unterwegs.anzahl > 0, 'prepared in-flight');
  const signiert = st.ausgang.find((x) => x.event.id === event.id);
  await P2.sync(); assert.equal(P2.log(child).filter((e) => e.id === event.id).length, 0);
  const beforePub = JSON.stringify(P1.konto.pub);
  P1b.konto = await schluesselErneuern({ zugang: P1b.z(), anmeldename: 'peter', passwort: PW.peter, neuesPasswort: PW.neu, runden: R });
  P1b.fertig(await P1b.sync());
  assert.notEqual(JSON.stringify(P1b.konto.pub), beforePub);
  P1.konto = await anmelden({ zugang: P1.z(), anmeldename: 'peter', passwort: PW.neu, runden: R });
  assert.equal(JSON.stringify(P1.konto.pub), JSON.stringify(P1b.konto.pub));
  assert.ok(P1.v().kinder.some((x) => x.id === child), 'same child, still authorized');
  blocked = null;
  await P1.sync(); await P2.sync(); await P1b.sync(); await K.sync();
  for (let n = 0; n < 3; n++) for (const g of [P1, P1b, P2, K]) await g.sync();   // stable: no duplicate, no change
  for (const g of [P1, P2]) {
    const mine = g.log(child).filter((e) => e.id === event.id);
    assert.equal(mine.length, 1, g.d + ': the evaluation exactly once');
    assert.equal(mine[0].type, 'school_evaluation');
    assert.equal(mine[0].author, event.author);
    assert.equal(mine[0].at, event.at, g.d + ': same time (no new variant)');
    assert.deepEqual(mine[0].payload, event.payload, g.d + ': same child, evaluation, revision');
    assert.equal(g.log(child).filter((e) => e.payload && e.payload.evaluation === evaluation && e.payload.revision === revision).length, 1, g.d + ': same revision once');
  }
  assert.equal(P2.log(child).filter((e) => e.payload && e.payload.evaluation === evaluation).length, 1, 'no second evaluation');
  const st2 = JSON.parse(P1.a.getItem(GERAETEABGLEICH_SPEICHER.staende))[area];
  assert.equal(st2.ausgang.length, 0); assert.equal(st2.unterwegs, null);
  const imLog = st2.log.find((x) => x.event.id === event.id);
  assert.deepEqual(imLog, signiert, 'event and signature byte for byte as first signed');
});

/* unit tests of buendelErneuern: a made-up device state, only the fields the function reads */
function stand0({ kv = 1, nr = 5, autor = 'p_a', geraet = 'd_x', wechsel = {} } = {}) {
  const s = abgleichStand('schule:p_k', geraet);
  const ev = { id: 'e_1', type: 'school_evaluation', author: autor, device: geraet, at: '2026-11-04T08:00:00.000Z', payload: {} };
  s.ausgang.push({ event: ev, sig: 'x' });
  s.unterwegs = { nr, anzahl: 1, inhalt: { v: 1, kv, eintraege: [] } };
  s.naechsteNr = nr;
  s.log.push({ event: { id: 'e_k', type: 'key_rotated', author: 'p_b', device: 'd_b', at: '2026-11-04T09:00:00.000Z', payload: { version: 2, entfernt: [], stand: { [geraet]: 4 }, erneuert: ['p_a'], ...wechsel } }, sig: 'y' });
  return s;
}
const neuerSchluessel = { aktuell: 2, keys: new Map() };
const ja = async () => true, nein = async () => false;

test('buendelErneuern: a renewed author, bundle beyond the stand of the change, caller allows -> prepared bundle dropped, entries untouched', async () => {
  const s = stand0(), vorher = JSON.stringify(s.ausgang);
  assert.equal(await buendelErneuern(s, { schluessel: neuerSchluessel, erlaubt: ja }), true);
  assert.equal(s.unterwegs, null); assert.equal(JSON.stringify(s.ausgang), vorher); assert.equal(s.naechsteNr, 5);
});
test('buendelErneuern: the caller does not allow the entry (foreign device, unknown keys, ...) -> nothing changes', async () => {
  const s = stand0();
  assert.equal(await buendelErneuern(s, { schluessel: neuerSchluessel, erlaubt: nein }), false);
  assert.ok(s.unterwegs);
});
test('buendelErneuern: author removed by the key change -> stays as it is (still dropped by readers)', async () => {
  const s = stand0({ wechsel: { entfernt: ['p_a'], erneuert: [] } });
  assert.equal(await buendelErneuern(s, { schluessel: neuerSchluessel, erlaubt: ja }), false);
  assert.ok(s.unterwegs);
});
test('buendelErneuern: this device was removed by the key change -> stays as it is', async () => {
  const s = stand0({ wechsel: { geraete: ['d_x'] } });
  assert.equal(await buendelErneuern(s, { schluessel: neuerSchluessel, erlaubt: ja }), false);
  assert.ok(s.unterwegs);
});
test('buendelErneuern: bundle number within the stand of the change (readers accept it) -> not touched', async () => {
  const s = stand0({ nr: 4 });
  assert.equal(await buendelErneuern(s, { schluessel: neuerSchluessel, erlaubt: ja }), false);
  assert.ok(s.unterwegs);
});
test('buendelErneuern: no newer key version here, or an author who did not renew -> not touched', async () => {
  const s = stand0();
  assert.equal(await buendelErneuern(s, { schluessel: { aktuell: 1, keys: new Map() }, erlaubt: ja }), false);
  const t = stand0({ wechsel: { erneuert: ['p_other'] } });
  assert.equal(await buendelErneuern(t, { schluessel: neuerSchluessel, erlaubt: ja }), false);
  assert.ok(s.unterwegs && t.unterwegs);
});

test('REST-ROT-UNSIGNED-01: persisted confirmation survives restart, exact-account login, renewal and upgraded replay exactly once', async () => {
  const uhr = { t: T0 }, storage = lokalerSpeicher({ now: () => uhr.t }), W = { uhr, geraet: (d) => storage.geraet(d) };
  const { P1, P2, K } = await familie(W), child = K.konto.kennung, area = 'schule:' + child;
  const P1b = geraet(W, 'd_P1b', await anmelden({ zugang: W.geraet('d_P1b'), anmeldename: 'peter', passwort: PW.peter, runden: R }));
  await P1b.sync();
  const evaluation = '0a667a6c-8d8c-4520-a6ec-000000000011', revision = '0a667a6c-8d8c-4520-a6ec-000000000012';
  P1.schreibt(child, 'school_evaluation', { child, evaluation, revision, title: 'Synthetic persisted unsigned assessment', day: HEUTE,
    assessment: { area: 'maths', goal: '', instructions: '', feedback: '', criteria: [{ criterion: 'Synthetic criterion', rating: 'C', standard: 'M-N1', evidence: '' }] } });
  const event = P1.log(child).find((e) => e.payload?.evaluation === evaluation), bytes = JSON.stringify(event);
  assert.deepEqual(checkEvent(event), []);
  const stateOf = (g) => JSON.parse(g.a.getItem(GERAETEABGLEICH_SPEICHER.staende))[area];
  assert.equal(stateOf(P1).log.some((x) => x.event.id === event.id), false, 'no first signature');
  assert.equal(stateOf(P1).ausgang.some((x) => x.event.id === event.id), false, 'no prepared entry');
  const persisted = JSON.parse(JSON.stringify([...P1.a.m]));
  P1b.konto = await schluesselErneuern({ zugang: P1b.z(), anmeldename: 'peter', passwort: PW.peter, neuesPasswort: PW.neu, runden: R });
  P1b.fertig(await P1b.sync());
  const origin = geraet(W, P1.d, { ...P1b.konto }); // restored local data plus a cloned current account is not a login
  for (const [k, v] of persisted) origin.a.setItem(k, v);
  assert.equal(kontoPersonen(origin.konto)[origin.konto.kennung].nachAnmeldung, undefined);
  await origin.sync();
  assert.equal(JSON.stringify(origin.log(child).find((e) => e.id === event.id)), bytes, 'stale cache leaves confirmed data intact');
  assert.equal(stateOf(origin).log.some((x) => x.event.id === event.id), false, 'stale cache cannot permanently queue a bad signature');
  assert.equal(stateOf(origin).ausgang.some((x) => x.event.id === event.id), false);
  const login = await anmelden({ zugang: origin.z(), anmeldename: 'peter', passwort: PW.neu, runden: R });
  const adapter = appKontenAdapter();
  await adapter.merken(login);
  origin.konto = adapter.konto(login.kennung);
  assert.notEqual(origin.konto, login, 'actual UI adapter copies the login account');
  assert.equal(origin.konto.schluessel.ecdsa.privateKey, login.schluessel.ecdsa.privateKey, 'in-memory adapter retains actual CryptoKey identity');
  const cached = adapter.idbKopie();
  assert.notEqual(cached.schluessel.ecdsa.privateKey, login.schluessel.ecdsa.privateKey, 'IDB structured clone creates a new CryptoKey identity');
  assert.equal(kontoPersonen(cached)[cached.kennung].nachAnmeldung, undefined, 'IDB cache cannot confer fresh login');
  assert.equal(kontoPersonen(JSON.parse(JSON.stringify(cached)))[cached.kennung].nachAnmeldung, undefined, 'serialized account cannot confer fresh login');
  origin.sync = () => abgleichMitVerbindungen({ ablage: origin.a, zugang: origin.z(), konten: [adapter.konto(login.kennung)], now: weiter(W), heute: HEUTE });
  const p = kontoPersonen(origin.konto)[origin.konto.kennung], can = p.nachAnmeldung;
  assert.equal(typeof can, 'function');
  assert.equal(can(event, 'd_foreign'), false, 'bound to the actual login device');
  assert.equal(can({ ...event, author: P2.konto.kennung }, origin.d), false, 'same parent only');
  const keys = origin.konto.schluessel;
  origin.konto.schluessel = { ...keys };
  assert.equal(can(event, origin.d), true, 'ordinary in-memory key containers may be copied while actual CryptoKeys stay identical');
  origin.konto.schluessel = keys;
  const privateKey = keys.ecdsa.privateKey;
  keys.ecdsa.privateKey = P2.konto.schluessel.ecdsa.privateKey;
  assert.equal(can(event, origin.d), false, 'exact private CryptoKey object');
  keys.ecdsa.privateKey = privateKey;
  const exchangeKey = keys.ecdh.privateKey;
  keys.ecdh.privateKey = P2.konto.schluessel.ecdh.privateKey;
  assert.equal(can(event, origin.d), false, 'exchange CryptoKey identity is bound as well');
  keys.ecdh.privateKey = exchangeKey;
  const person = origin.konto.kennung, role = origin.konto.art, pub = origin.konto.pub;
  origin.konto.kennung = P2.konto.kennung; assert.equal(can(event, origin.d), false); origin.konto.kennung = person;
  origin.konto.art = 'teacher'; assert.equal(can(event, origin.d), false); origin.konto.art = role;
  origin.konto.pub = P2.konto.pub; assert.equal(can(event, origin.d), false); origin.konto.pub = pub;
  assert.equal(can(event, origin.d), true);
  assert.equal(origin.konto.kennung, P1.konto.kennung);
  assert.ok(origin.v().kinder.some((c) => c.id === child));
  await origin.sync();
  const signed = stateOf(origin).log.find((x) => x.event.id === event.id);
  assert.equal(signed.bestaetigt.v, 1);
  assert.equal(JSON.stringify(signed.event), bytes, 'all domain bytes unchanged');
  for (let n = 0; n < 3; n++) for (const g of [origin, P1b, P2, K]) await g.sync();
  for (const g of [origin, P1b, P2, K]) {
    assert.deepEqual(g.log(child).filter((e) => e.id === event.id), [event], g.d + ': exactly once');
    assert.equal(g.log(child).filter((e) => e.payload?.evaluation === evaluation && e.payload.revision === revision).length, 1);
    assert.equal(deriveSchool(g.log(child), { now: W.uhr.t }).asOf, deriveSchool([event], { now: W.uhr.t }).asOf, 'school asOf unchanged');
    assert.deepEqual(mergeLog([[event], g.log(child)], W.uhr.t).conflicts, []);
    const restored = JSON.parse(JSON.stringify([...g.a.m]));
    g.a.m.clear(); for (const [k, v] of restored) g.a.setItem(k, v);
    await g.sync();
    assert.deepEqual(stateOf(g).log.find((x) => x.event.id === event.id), signed, 'JSON restore preserves signed envelope');
  }
  // A previous reader may have rejected the envelope and advanced its old cursor. Upgrade must reread server bundles.
  const beforeUpgrade = JSON.parse(P2.a.getItem(GERAETEABGLEICH_SPEICHER.staende));
  beforeUpgrade[area].log = beforeUpgrade[area].log.filter((x) => x.event.id !== event.id);
  beforeUpgrade[area].merker.schuleLesestand = 1;
  P2.a.setItem(GERAETEABGLEICH_SPEICHER.staende, JSON.stringify(beforeUpgrade));
  P2.a.setItem('bq2_' + child + '__events', JSON.stringify(P2.log(child).filter((e) => e.id !== event.id)));
  await P2.sync(); await P2.sync();
  assert.deepEqual(P2.log(child).filter((e) => e.id === event.id), [event], 'upgraded reader restores original exactly once');
  assert.equal(stateOf(P2).merker.schuleLesestand, 2);
  assert.deepEqual(stateOf(P2).log.find((x) => x.event.id === event.id), signed);
  // Another renewal must not replace this already signed envelope or invalidate its signing period.
  P1b.konto = await schluesselErneuern({ zugang: P1b.z(), anmeldename: 'peter', passwort: PW.neu, neuesPasswort: 'Heron-Fig-Dune-2468', runden: R });
  P1b.fertig(await P1b.sync());
  await adapter.merken(await anmelden({ zugang: origin.z(), anmeldename: 'peter', passwort: 'Heron-Fig-Dune-2468', runden: R }));
  origin.konto = adapter.konto(login.kennung);
  for (const g of [origin, P1b, P2, K]) {
    await g.sync(); assert.deepEqual(stateOf(g).log.find((x) => x.event.id === event.id), signed, 'subsequent renewal keeps earlier envelope');
    assert.deepEqual(g.log(child).filter((e) => e.id === event.id), [event]);
  }
});
