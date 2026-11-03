// Modul annahme ohne Browser (S12 P2, Aufgabe 4; EP7: US7.5; Erfolgskriterium E10).
//   node --test tests/module/annahme.test.mjs

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { canonicalBytes, signEvent, acceptEvent, acceptAll, roleMayWrite, ANNAHME_GRUENDE, ANNAHME_RECHTE } from '../../src/module/annahme.mjs';
import { newPersonKeys, publicKeysOf, signBytes, bytesToB64, b64ToBytes } from '../../src/module/krypto.mjs';
import { newEvent, EVENT_TYPES } from '../../src/module/ereignisse.mjs';
import { bereichVonEreignis, bereichName } from '../../src/module/bereiche.mjs';

/* ---------- the family: one person per role, each with one device ----------
   Since P3b every type has its area (module bereiche); AREA is the learning area of the child. */
const AREA = 'kind:lern:p_k1';
const areaOf = (e) => { const art = bereichVonEreignis(e); return !art || art === '*' ? AREA : bereichName(art, art === 'freigabe' ? e.payload.grant : 'p_k1'); };
const WHO = { child: ['p_k1', 'd_k1'], parent: ['p_e1', 'd_e1'], teacher: ['p_l1', 'd_l1'], admin: ['p_a1', 'd_a1'] };
const ROLES = Object.keys(WHO);
let KEYS = {}, Z;            // KEYS: personId -> private keys; Z: the admission for AREA
let stranger;                // keys of somebody who is not admitted
before(async () => {
  const members = {};
  for (const [role, [pid, did]] of Object.entries(WHO)) {
    KEYS[pid] = await newPersonKeys();
    members[pid] = { role, pub: await publicKeysOf(KEYS[pid]), devices: [did] };
  }
  KEYS.p_e2 = await newPersonKeys();
  members.p_e2 = { role: 'parent', pub: await publicKeysOf(KEYS.p_e2), devices: ['d_e2', 'd_e3'] };
  stranger = await newPersonKeys();
  Z = { area: AREA, members };
});

/* ---------- a valid payload per type (the "self" fields point to the author) ---------- */
const DAY = '2026-11-02';
function payloadFor(type, author, device) {
  return {
    answer: { day: DAY, skill: 'round', level: 2, attempt: 1, ok: true, qid: 'q1' },
    round_done: { day: DAY, skill: 'round', stars: 7, count: 8 },
    badge: { day: DAY, badge: 'principled' },
    review: { day: DAY, qid: 'q1', box: 1 },
    practice_day: { day: DAY },
    profile_set: { field: 'name', value: 'Kim' },
    rank_seen: { rank: 'Investigator' },
    sheet_created: { sheet: DAY + '-abc', day: DAY, no: 1, writing: 'en', items: [] },
    sheet_result: { sheet: DAY + '-abc', index: 0, res: 'ok', day: DAY, qid: 'q1' },
    sheet_discarded: { sheet: DAY + '-abc' },
    setting_set: { setting: 'storyCap', value: 2 },
    checklist_set: { studio: 'grow', index: 0, value: true },
    day_flag: { flag: 'greetDay', day: DAY },
    school_import: { asOf: DAY, data: { round: 'M' } },
    grant_set: { grant: 'g1', grantee: 'p_l1', scope: ['learning'], from: DAY, until: '2026-11-16' },
    grant_revoked: { grant: 'g1', grantee: 'p_l1' },
    grant_opened: { grant: 'g1', grantee: author },
    member_added: { person: 'p_e9', role: 'parent', pub: { ecdh: 'QUJD', ecdsa: 'REVG' } },
    member_removed: { person: 'p_e9' },
    device_added: { device },
    device_removed: { device: 'd_k1' },
    key_rotated: { version: 2, entfernt: [], stand: { d_e1: 1 } },
    snapshot: { upTo: '2026-11-02T16:00:00Z', count: 5000, idsHash: '0'.repeat(64), state: {} },
    gap_state: { standard: 'MA.3.NBT.2', state: 'closed', by: 'app', schoolDay: '2026-10-20', day: DAY, quest: 'round' },
    gap_active: { standard: 'MA.3.NBT.2' },
    list_set: { list: 'unlocked', item: 'fractions', on: true },
    advent_open: { year: 2026, door: 3 },
    joke_seen: { joke: 'gb-tired' },
    story_read: { story: 'alltag-stern-trampolin' },
  }[type];
}
let n = 0;
const rand = (k) => { n++; return Uint8Array.from({ length: k }, (_, i) => (n * 31 + i * 7) & 255); };
const mk = (type, author, device, payload = payloadFor(type, author, device), at = '2026-11-02T16:04:11.123Z') => newEvent({ type, author, device, payload, at }, { rand });
const signed = (role, type, opts = {}) => { const [pid, did] = WHO[role]; const e = mk(type, pid, did); return signEvent(e, opts.area || areaOf(e), opts.keys || KEYS[pid]); };
const sg = (e, keys) => signEvent(e, areaOf(e), keys);                       // signed for the area of its type
const zOf = (item) => ({ ...Z, area: item && item.event ? areaOf(item.event) : AREA });
const reason = async (item, z = zOf(item)) => { const r = await acceptEvent(item, z); return r.ok ? 'ok' : r.grund; };

/* ---------- the expected table, written out here on purpose (concept 6 "Schreiben", 5.2, 9.3) ----------
   c = child, p = parent, t = teacher, a = admin. A9/A10 (02.11.): the child enters its sheet itself, so
   sheet_result (and the review and badge it causes) belongs to the child; parents write no learning data at all.
   Gaps (3b-0): gap_state 'cp' with the sample "closed by app" - the child may ONLY write that one (test below). */
const ERWARTET = {
  answer: 'c', round_done: 'c', practice_day: 'c', rank_seen: 'c', checklist_set: 'c', day_flag: 'c',
  badge: 'c', review: 'c', sheet_result: 'c',
  profile_set: 'cp', sheet_created: 'cp', gap_state: 'cp', device_added: 'cpta',
  sheet_discarded: 'p', setting_set: 'p', school_import: 'p', grant_set: 'p', grant_revoked: 'p',
  member_added: 'p', member_removed: 'p', device_removed: 'p', key_rotated: 'p', snapshot: 'p', gap_active: 'p', list_set: 'p', advent_open: 'cp', joke_seen: 'cp', story_read: 'cp',
  grant_opened: 'ta',
};
const darf = (role, type) => ERWARTET[type].includes(role[0]);

/* ---------- 1 accept ---------- */
test('Annehmen: gueltig unterschriebene Ereignisse je Rolle und erlaubtem Typ zaehlen', async () => {
  let k = 0;
  for (const role of ROLES) for (const type of EVENT_TYPES) if (darf(role, type)) { assert.equal(await reason(await signed(role, type)), 'ok', `${role} ${type}`); k++; }
  assert.equal(k, 9 + 6 * 2 + 4 + 12 + 2, 'every allowed pair was tried once');   // cp: profile_set, sheet_created, gap_state, advent_open, joke_seen, story_read
  const p2 = await sg(mk('setting_set', 'p_e2', 'd_e3'), KEYS.p_e2);
  assert.deepEqual(await acceptEvent(p2, zOf(p2)), { ok: true }, 'second parent from his second device');
});

/* ---------- 2 E10 ---------- */
test('E10: Lehrkraft schreibt answer -> verworfen; fremdes Geraet; unbekannter Autor', async () => {
  assert.deepEqual(await acceptEvent(await signed('teacher', 'answer'), Z), { ok: false, grund: 'rolle-darf-nicht' });
  assert.equal(await reason(await signed('admin', 'answer')), 'rolle-darf-nicht', 'admin neither');
  assert.equal(await reason(await signed('teacher', 'setting_set')), 'rolle-darf-nicht');
  // the child signs correctly, but from the parent's device
  assert.deepEqual(await acceptEvent(await signEvent(mk('answer', 'p_k1', 'd_e1'), AREA, KEYS.p_k1), Z), { ok: false, grund: 'geraet-fremd' });
  assert.equal(await reason(await signEvent(mk('answer', 'p_k1', 'd_x9'), AREA, KEYS.p_k1)), 'geraet-fremd', 'unknown device');
  // somebody who is not admitted, with his own valid keys
  assert.deepEqual(await acceptEvent(await signEvent(mk('answer', 'p_x1', 'd_x1'), AREA, stranger), Z), { ok: false, grund: 'autor-unbekannt' });
  // names that exist on every JavaScript object are no members
  for (const pid of ['p_constructor', 'p_toString', 'p_hasOwnProperty']) assert.equal(await reason(await signEvent(mk('answer', pid, 'd_k1'), AREA, stranger)), 'autor-unbekannt', pid);
});

test('E10: nur fuer sich selbst - Geraet anmelden und "angesehen" protokollieren', async () => {
  assert.equal(await reason(await sg(mk('device_added', 'p_k1', 'd_k1', { device: 'd_x2' }), KEYS.p_k1)), 'rolle-darf-nicht', 'child adds a foreign device');
  assert.equal(await reason(await sg(mk('device_added', 'p_e1', 'd_e1', { device: 'd_k1' }), KEYS.p_e1)), 'rolle-darf-nicht', 'parent adds a device that is not his');
  assert.equal(await reason(await sg(mk('grant_opened', 'p_l1', 'd_l1', { grant: 'g1', grantee: 'p_a1' }), KEYS.p_l1)), 'rolle-darf-nicht', 'teacher logs for the admin');
  assert.equal(await reason(await sg(mk('grant_opened', 'p_e1', 'd_e1', { grant: 'g1', grantee: 'p_e1' }), KEYS.p_e1)), 'rolle-darf-nicht', 'parent cannot fake an opening');
  assert.equal(await reason(await sg(mk('device_removed', 'p_k1', 'd_k1', { device: 'd_k1' }), KEYS.p_k1)), 'rolle-darf-nicht', 'the child does not remove devices (concept 6)');
  for (const badge of ['inquirer', 'thinker', 'reflective', 'principled']) {
    assert.equal(await reason(await signEvent(mk('badge', 'p_e1', 'd_e1', { day: DAY, badge }), AREA, KEYS.p_e1)), 'rolle-darf-nicht', 'parent cannot hand out ' + badge);
    assert.equal(await reason(await signEvent(mk('badge', 'p_k1', 'd_k1', { day: DAY, badge }), AREA, KEYS.p_k1)), 'ok', 'child earns ' + badge);
  }
  assert.equal(await reason(await signEvent(mk('answer', 'p_e1', 'd_e1'), AREA, KEYS.p_e1)), 'rolle-darf-nicht', 'parents never answer for the child');
  const z = { area: AREA, members: { ...Z.members, p_k1: { ...Z.members.p_k1, role: 'guest' } } };
  assert.equal(await reason(await signed('child', 'answer'), z), 'rolle-darf-nicht', 'unknown role has no rights');
  const z3 = { area: AREA, members: { ...Z.members, p_k1: { ...Z.members.p_k1, role: 'toString' } } };
  assert.equal(await reason(await signed('child', 'answer'), z3), 'rolle-darf-nicht', 'role name from Object.prototype');
});

/* ---------- 3 signature ---------- */
test('Unterschrift: anderer Schluessel, ein veraendertes Byte, fehlende oder kaputte Unterschrift', async () => {
  const good = await signed('child', 'answer');
  assert.equal(await reason(good), 'ok');
  assert.equal(await reason(await signEvent(good.event, AREA, KEYS.p_e1)), 'unterschrift', 'signed with the parent key in the name of the child');
  assert.equal(await reason(await signEvent(good.event, AREA, stranger)), 'unterschrift', 'stranger key');
  for (const [what, change] of [
    ['payload ok', (e) => { e.payload.ok = false; }], ['payload level', (e) => { e.payload.level = 3; }], ['payload qid one byte', (e) => { e.payload.qid = 'q2'; }],
    ['time', (e) => { e.at = '2026-11-02T16:04:11.124Z'; }], ['type', (e) => { e.type = 'round_done'; e.payload = payloadFor('round_done'); }],
    ['id', (e) => { e.id = 'e_' + 'f'.repeat(24); }], ['extra optional field', (e) => { e.payload.help = true; }],
  ]) {
    const ev = JSON.parse(JSON.stringify(good.event)); change(ev);
    assert.equal(await reason({ event: ev, sig: good.sig }), 'unterschrift', what);
  }
  const bytes = b64ToBytes(good.sig); bytes[10] ^= 1;
  assert.equal(await reason({ event: good.event, sig: bytesToB64(bytes) }), 'unterschrift', 'one bit of the signature');
  for (const sig of [undefined, null, '', 'abc', 42, '!!!not base64!!!']) assert.equal(await reason(sig === undefined ? { event: good.event } : { event: good.event, sig }), 'unterschrift', 'sig ' + String(sig));
  const other = await signed('child', 'badge');
  assert.equal(await reason({ event: good.event, sig: other.sig }), 'unterschrift', 'signature of another event');
  const raw = await signBytes(KEYS.p_k1, JSON.stringify(good.event));
  assert.equal(await reason({ event: good.event, sig: raw }), 'unterschrift', 'signature without the fixed byte sequence');
  const noPub = { area: AREA, members: { ...Z.members, p_k1: { role: 'child', devices: ['d_k1'] } } };
  assert.equal(await reason(good, noPub), 'unterschrift', 'member without public key');
});

/* ---------- 4 area ---------- */
test('Bereich: dasselbe unterschriebene Ereignis in einem anderen Bereich wird verworfen', async () => {
  const good = await signed('parent', 'school_import');
  assert.equal(await reason(good), 'ok');
  for (const area of ['schule:p_k2', 'kind:lern:p_k1', 'kid:p_k2', 'parents:p_k1', 'schule:p_k1 ', 'SCHULE:p_k1']) assert.equal(await reason(good, { ...Z, area }), 'unterschrift', area);
  const there = await signed('parent', 'school_import', { area: 'schule:p_k2' });
  assert.equal(await reason(there), 'unterschrift', 'signed for another area, read here');
  assert.equal(await reason(there, { ...Z, area: 'schule:p_k2' }), 'ok', 'fine in its own area');
  // P3b: signed for the area it was read in, but the type does not belong there -> bereich-falsch
  for (const area of ['kind:lern:p_k1', 'eltern:allg:p_k1', 'kid:p_k1']) assert.equal(await reason(await signed('parent', 'school_import', { area }), { ...Z, area }), 'bereich-falsch', area);
});

test('canonicalBytes: feste Bytefolge, unabhaengig von der Schluesselreihenfolge; Bereich gehoert dazu', () => {
  const e = mk('answer', 'p_k1', 'd_k1');
  const turned = Object.fromEntries(Object.entries(e).reverse()); turned.payload = Object.fromEntries(Object.entries(e.payload).reverse());
  const a = Buffer.from(canonicalBytes(e, AREA)).toString('utf8');
  assert.equal(Buffer.from(canonicalBytes(turned, AREA)).toString('utf8'), a);
  assert.ok(a.startsWith('bq-sig1|kind:lern:p_k1|{"at":'), a.slice(0, 40));
  assert.ok(a.includes('"payload":{"attempt":1,"day":"2026-11-02","level":2,"ok":true,"qid":"q1","skill":"round"}'), 'sorted, no blanks');
  assert.notEqual(Buffer.from(canonicalBytes(e, 'kid:p_k2')).toString('utf8'), a);
  assert.notEqual(Buffer.from(canonicalBytes({ ...e, payload: { ...e.payload, ok: false } }, AREA)).toString('utf8'), a);
  for (const area of ['', undefined, null, 7]) assert.throws(() => canonicalBytes(e, area), /Bereich/);
});

/* ---------- 5 matrix ---------- */
test('Matrix: alle 29 Typen x 4 Rollen gegen die hier ausgeschriebene Tabelle', async () => {
  assert.deepEqual(Object.keys(ERWARTET).sort(), EVENT_TYPES.slice().sort(), 'the table covers every type');
  assert.equal(EVENT_TYPES.length, 29);
  const falsch = [];
  for (const type of EVENT_TYPES) for (const role of ROLES) {
    const got = await reason(await signed(role, type)), want = darf(role, type) ? 'ok' : 'rolle-darf-nicht';
    if (got !== want) falsch.push(`${role} ${type}: ${got} instead of ${want}`);
  }
  assert.deepEqual(falsch, []);
  for (const role of ROLES) assert.deepEqual(ANNAHME_RECHTE[role].slice().sort(), EVENT_TYPES.filter((t) => darf(role, t)).sort(), 'exported table ' + role);
  assert.ok(Object.isFrozen(ANNAHME_RECHTE) && Object.isFrozen(ANNAHME_RECHTE.child), 'the exported table cannot be changed');
});

/* ---------- 5b gaps (task 3b-0) ---------- */
test('3b-0 Luecken: Kind nur "automatisch geschlossen" (closed, by app); Eltern alles; Lehrkraft und Admin nichts', async () => {
  const lk = (role, type, payload) => { const [pid, did] = WHO[role]; return sg(mk(type, pid, did, payload), KEYS[pid]); };
  const st = (state, by, extra = {}) => ({ standard: 'MA.3.NBT.2', state, by, schoolDay: '2026-10-20', day: DAY, ...extra });
  assert.equal(await reason(await lk('child', 'gap_state', st('closed', 'app', { quest: 'round' }))), 'ok', 'child: the automatic close');
  assert.equal(await reason(await lk('child', 'gap_state', st('closed', 'app'))), 'ok', 'child: also without quest');
  for (const [state, by] of [['hold', 'parents'], ['open', 'parents'], ['closed', 'parents'], ['hold', 'app'], ['open', 'app']]) {
    assert.equal(await reason(await lk('child', 'gap_state', st(state, by))), 'rolle-darf-nicht', `child ${state} by ${by}`);
  }
  for (const s of ['MA.3.NBT.2', null]) assert.equal(await reason(await lk('child', 'gap_active', { standard: s })), 'rolle-darf-nicht', 'child chooses no gap: ' + s);
  for (const [state, by] of [['closed', 'app'], ['closed', 'parents'], ['hold', 'parents'], ['open', 'parents']]) {
    assert.equal(await reason(await lk('parent', 'gap_state', st(state, by))), 'ok', `parent ${state} by ${by}`);
  }
  for (const s of ['MA.3.NBT.2', null]) assert.equal(await reason(await lk('parent', 'gap_active', { standard: s })), 'ok', 'parent chooses ' + s);
  const p2 = await sg(mk('gap_state', 'p_e2', 'd_e2', st('hold', 'parents')), KEYS.p_e2);
  assert.equal(await reason(p2), 'ok', 'the second parent, too');
  for (const role of ['teacher', 'admin']) {
    for (const [state, by] of [['closed', 'app'], ['hold', 'parents']]) assert.equal(await reason(await lk(role, 'gap_state', st(state, by))), 'rolle-darf-nicht', `${role} ${state}`);
    assert.equal(await reason(await lk(role, 'gap_active', { standard: 'MA.3.NBT.2' })), 'rolle-darf-nicht', role + ' gap_active');
  }
  const gut = await lk('child', 'gap_state', st('closed', 'app'));
  assert.equal(await reason({ event: { ...gut.event, payload: { ...gut.event.payload, state: 'zu' } }, sig: gut.sig }), 'format', 'a wrong state is a format error first');
});

test('roleMayWrite (fuer den Schreiber, 3b-1): dieselbe Regel wie beim Annehmen, ohne Unterschrift', async () => {
  for (const type of EVENT_TYPES) for (const role of ROLES) {
    const [pid, did] = WHO[role], e = mk(type, pid, did);
    assert.equal(roleMayWrite(role, e), darf(role, type), `${role} ${type}`);
    assert.equal(roleMayWrite(role, e), (await reason(await sg(e, KEYS[pid]))) === 'ok', `${role} ${type}: same as acceptEvent`);
  }
  const st = (state, by) => mk('gap_state', 'p_k1', 'd_k1', { standard: 'X', state, by, schoolDay: DAY, day: DAY });
  assert.equal(roleMayWrite('child', st('closed', 'app')), true);
  assert.equal(roleMayWrite('child', st('hold', 'parents')), false, 'the extra conditions count, too');
  for (const role of ['guest', 'toString', '__proto__', undefined, null, 7]) assert.equal(roleMayWrite(role, mk('answer', 'p_k1', 'd_k1')), false, String(role));
  assert.equal(roleMayWrite('child', null), false);
});

/* ---------- 6 reasons ---------- */
test('Gruende: feste Reihenfolge format -> autor-unbekannt -> geraet-fremd -> unterschrift -> bereich-falsch -> rolle-darf-nicht', async () => {
  assert.deepEqual(ANNAHME_GRUENDE, ['format', 'autor-unbekannt', 'nicht-mitglied', 'geraet-fremd', 'geraet-nicht-angemeldet', 'unterschrift', 'bereich-falsch', 'rolle-darf-nicht']);
  const t = await signed('teacher', 'answer');
  const tPriv = await signed('teacher', 'setting_set', { area: AREA });
  assert.equal(await reason(tPriv, Z), 'bereich-falsch', 'teacher + wrong area: area first');
  assert.equal(await reason({ ...tPriv, sig: t.sig }, Z), 'unterschrift', 'wrong area + bad signature: signature first');
  const bad = { ...t, sig: t.sig.slice(0, -4) + 'AAAA' };
  assert.equal(await reason(bad), 'unterschrift', 'teacher + bad signature: signature first');
  assert.equal(await reason({ event: { ...t.event, device: 'd_k1' }, sig: 'x' }), 'geraet-fremd', 'teacher + foreign device + bad signature');
  assert.equal(await reason({ event: { ...t.event, author: 'p_x1' }, sig: 'x' }), 'autor-unbekannt', 'unknown author + foreign device + bad signature');
  assert.equal(await reason({ event: { ...t.event, author: 'p_x1', v: 2 }, sig: 'x' }), 'format', 'everything wrong: format first');
  for (const item of [null, 'x', [], {}, { sig: t.sig }, { event: null, sig: t.sig }, { event: { ...t.event, payload: {} }, sig: t.sig }, { ...t, extra: 1 }, { event: { ...t.event, name: 'Kim' }, sig: t.sig }]) {
    assert.deepEqual(await acceptEvent(item, Z), { ok: false, grund: 'format' }, JSON.stringify(item)?.slice(0, 60));
  }
});

test('acceptAll: liefert jeden Eintrag genau einmal, Verworfene mit Grund, Reihenfolge bleibt', async () => {
  const items = [
    await signed('child', 'answer'), await signed('teacher', 'answer'), await signed('parent', 'sheet_discarded'),
    await signed('child', 'sheet_discarded'), null, await signEvent(mk('answer', 'p_x1', 'd_x1'), AREA, stranger),
    await signEvent(mk('answer', 'p_k1', 'd_e1'), AREA, KEYS.p_k1), { ...(await signed('child', 'badge')), sig: '' }, await signed('parent', 'profile_set'),
    await signed('parent', 'setting_set', { area: AREA }),
  ];
  const before = JSON.stringify(items);
  const r = await acceptAll(items, Z);
  assert.equal(JSON.stringify(items), before, 'inputs unchanged');
  assert.deepEqual(r.angenommen, [items[0], items[2], items[8]]);
  assert.deepEqual(r.verworfen.map((x) => x.grund), ['rolle-darf-nicht', 'rolle-darf-nicht', 'format', 'autor-unbekannt', 'geraet-fremd', 'unterschrift', 'bereich-falsch']);
  assert.deepEqual(r.verworfen.map((x) => x.item), [items[1], items[3], items[4], items[5], items[6], items[7], items[9]]);
  assert.equal(r.angenommen.length + r.verworfen.length, items.length, 'nothing lost');
  for (const v of r.verworfen) assert.ok(ANNAHME_GRUENDE.includes(v.grund), 'known reason');
  assert.deepEqual(await acceptAll([], Z), { angenommen: [], verworfen: [] });
  await assert.rejects(acceptAll(null, Z), /Liste/);
  await assert.rejects(acceptAll({ length: 1, 0: items[0] }, Z), /Liste/);
});

/* ---------- inputs and edges ---------- */
test('Zulassung ohne Bereich oder Mitglieder bricht ab (Programmfehler, nicht still verworfen)', async () => {
  const item = await signed('child', 'answer');
  for (const z of [null, {}, { area: AREA }, { members: Z.members }, { area: '', members: Z.members }, { area: AREA, members: [] }]) {
    await assert.rejects(acceptEvent(item, z), /Zulassung/, JSON.stringify(z)?.slice(0, 40));
    await assert.rejects(acceptAll([item], z), /Zulassung/);
  }
});

test('signEvent: unterschreibt nur gueltige Ereignisse und haelt eine Kopie fest', async () => {
  const e = mk('answer', 'p_k1', 'd_k1');
  const s = await signEvent(e, AREA, KEYS.p_k1);
  assert.deepEqual(Object.keys(s), ['event', 'sig']);
  assert.match(s.sig, /^[A-Za-z0-9+/]+=*$/);
  e.payload.ok = false;
  assert.equal(s.event.payload.ok, true, 'later changes to the input do not reach the signed copy');
  assert.equal(await reason(s), 'ok');
  await assert.rejects(signEvent({ ...e, v: 2 }, AREA, KEYS.p_k1), /ungueltig/);
  await assert.rejects(signEvent(mk('answer', 'p_k1', 'd_k1'), '', KEYS.p_k1), /Bereich/);
});

test('Modul ist rein: kein Zufall, keine Uhr, kein Speicher, kein Netz; Hilfsnamen mit ann-Praefix', () => {
  const src = fs.readFileSync(new URL('../../src/module/annahme.mjs', import.meta.url), 'utf8');
  for (const bad of ['Math.random', 'Date.now', 'new Date(', 'localStorage', 'fetch(', 'document.', 'window.']) assert.equal(src.includes(bad), false, bad);
  const top = [...src.matchAll(/^(?:export\s+)?(?:async\s+)?(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let)\s+([A-Za-z_$][\w$]*))/gm)].map((m) => m[1] || m[2]);
  const exported = ['ANNAHME_GRUENDE', 'ANNAHME_RECHTE', 'canonicalBytes', 'signEvent', 'acceptEvent', 'acceptAll', 'roleMayWrite'];
  for (const name of top) assert.ok(exported.includes(name) || /^(ann|ANN_)/.test(name), 'shared scope: ' + name);
});
