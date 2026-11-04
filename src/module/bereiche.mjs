// Module bereiche - which data lies in which area, who holds which area key, and how keys are handed out and
// changed (S12 P3b, US10.4; concept 6, 7.1, 8). Test build only (module.json: bau "test", before annahme).
// No screen, no browser storage, no network: the storage access (module speicher) is passed in.
//
//   area names (one key ring each):
//     kind:lern:<childId>    learning progress + the child's name          child, parents, grant with "learning"
//     kind:privat:<childId>  rest of the profile, settings, day hints ...  child, parents
//     schule:<childId>       school data and gaps (the child's app computes with them, never shows them)
//                                                                          child, parents, grant with "school"
//     eltern:allg:<childId>  grants, last backup                           parents
//     freigabe:<grantId>     the recipient's log "opened" (grant_opened)    parents, the recipient while the grant runs
//     person:<personId>      settings of one person (person_set, glance_set; task 3b-1c)   the person
//                            - only the person itself writes there: an event of somebody else does not fit the area
//   The area follows from the event type (for profile_set: from the field). snapshot and the admission events
//   (member_*, device_*, key_rotated; task P3b-2) fit every area: each area carries its own admission.
//
//   key entry in the storage (speicher.keys / putKey), one per holder and area:
//     { v: 1, von: <personId of the distributor>, versionen: { "<n>": wrapped key (krypto.wrapKeyFor) }, sig }
//     sig = signature of the distributor over "bq-key1|" + area + "|" + holder + "|" + entry without sig.
//     Only parents distribute (person areas: the person). An entry with another or a broken signature is ignored -
//     so nobody with write access to the storage can slip in a key version he knows.
//
// Names: every helper starts with "ber"/"BER_" because all modules and index.html share one scope in the app.

import { createKeyring, rotateKeyring, wrapKeyFor, unwrapKey, signBytes, verifyBytes } from './krypto.mjs';

/* the kinds of area, in this order everywhere */
export const BEREICH_ARTEN = Object.freeze(['kind:lern', 'kind:privat', 'schule', 'eltern:allg', 'freigabe', 'person']);

/* ---------- type -> area (decided by Peter, 03.11.: the teacher sees the name; the child's account holds the
   school data so the app can compute focus and gaps, but never shows them) ---------- */
const BER_TYP = {
  answer: 'kind:lern', round_done: 'kind:lern', badge: 'kind:lern', review: 'kind:lern', practice_day: 'kind:lern', rank_seen: 'kind:lern',
  sheet_created: 'kind:lern', sheet_result: 'kind:lern', sheet_discarded: 'kind:lern',
  profile_set: { name: 'kind:lern', birthday: 'kind:privat', emoji: 'kind:privat', kidLang: 'kind:privat', muted: 'kind:privat' },
  setting_set: 'kind:privat', list_set: 'kind:privat', checklist_set: 'kind:privat', day_flag: 'kind:privat', advent_open: 'kind:privat',
  joke_seen: 'kind:privat', story_read: 'kind:privat',
  school_import: 'schule', gap_state: 'schule', gap_active: 'schule',
  grant_set: 'eltern:allg', grant_revoked: 'eltern:allg', backup_made: 'eltern:allg',
  grant_opened: 'freigabe',
  person_set: 'person', glance_set: 'person',                       // task 3b-1c: settings of one person, its own area only
  // every area carries its own admission (task P3b-2): members, devices and key changes of THIS area
  member_added: '*', member_removed: '*', device_added: '*', device_removed: '*', key_rotated: '*',
  snapshot: '*',
};
export const BEREICH_JE_TYP = Object.freeze(Object.fromEntries(Object.entries(BER_TYP).map(([t, b]) => [t, typeof b === 'string' ? b : Object.freeze({ ...b })])));

/* ---------- who gets which kind of area ---------- */
const BER_ROLLE = { child: ['kind:lern', 'kind:privat', 'schule'], parent: ['kind:lern', 'kind:privat', 'schule', 'eltern:allg', 'freigabe'] };
const BER_UMFANG = { learning: 'kind:lern', school: 'schule' };

/* ---------- helpers ---------- */
const berObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const berOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const berPid = (x) => typeof x === 'string' && /^p_[0-9A-Za-z]{1,40}$/.test(x);
const berGid = (x) => typeof x === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(x);
const berTag = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const berTE = new TextEncoder();
const berCmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
function berCanon(x) {
  if (x === null || typeof x !== 'object') return JSON.stringify(x);
  if (Array.isArray(x)) return '[' + x.map((v) => berCanon(v === undefined ? null : v)).join(',') + ']';
  return '{' + Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => JSON.stringify(k) + ':' + berCanon(x[k])).join(',') + '}';
}
function berFehler(text) { return new Error('bereiche: ' + text); }
const BER_PRAEFIX = [['kind:lern:', 'kind:lern'], ['kind:privat:', 'kind:privat'], ['schule:', 'schule'], ['eltern:allg:', 'eltern:allg'], ['freigabe:', 'freigabe'], ['person:', 'person']];

/* ---------- area names ---------- */
/* "kind:lern" + "p_k1" -> "kind:lern:p_k1"; freigabe takes a grant id, all others a person id */
export function bereichName(art, id) {
  if (!BEREICH_ARTEN.includes(art) || !(art === 'freigabe' ? berGid(id) : berPid(id))) throw berFehler('Bereich ungueltig (' + art + ', ' + id + ').');
  return art + ':' + id;
}
/* "kind:lern:p_k1" -> { art: "kind:lern", id: "p_k1" }; anything else -> null */
export function bereichZerlegen(name) {
  if (typeof name !== 'string') return null;
  for (const [p, art] of BER_PRAEFIX) {
    if (!name.startsWith(p)) continue;
    const id = name.slice(p.length);
    return (art === 'freigabe' ? berGid(id) : berPid(id)) ? { art, id } : null;
  }
  return null;
}
/* kind of area an event belongs to: one of BEREICH_ARTEN, "*" (snapshot: every area) or null (unknown) */
export function bereichVonEreignis(e) {
  if (!berObj(e) || typeof e.type !== 'string' || !berOwn(BER_TYP, e.type)) return null;
  const b = BER_TYP[e.type];
  if (typeof b === 'string') return b;
  const feld = berObj(e.payload) ? e.payload.field : undefined;
  return typeof feld === 'string' && berOwn(b, feld) ? b[feld] : null;
}
/* does this event belong into this area? (module annahme drops it otherwise). An unknown area name fits nothing. */
export function passtZumBereich(e, bereich) {
  const z = bereichZerlegen(bereich), art = bereichVonEreignis(e);
  if (!z || !art) return false;
  if (art === '*') return true;
  if (art !== z.art) return false;
  if (art === 'person') return e.author === z.id;            // task 3b-1c: a person writes its own settings, nobody else's
  return art !== 'freigabe' || e.payload.grant === z.id;      // the log of grant g1 lies in freigabe:g1 only
}

/* ---------- rights to read ---------- */
/* kinds of area a role gets a key for. umfang (scope of a grant, ['learning'], ['learning', 'school'] ...) counts
   for teacher and admin only; without a grant they get nothing. person:<id> is always the person's own. */
export function bereicheFuer(rolle, umfang) {
  let arten = [];
  if (rolle === 'child' || rolle === 'parent') arten = BER_ROLLE[rolle];
  else if ((rolle === 'teacher' || rolle === 'admin') && Array.isArray(umfang)) {
    arten = umfang.filter((u) => typeof u === 'string' && berOwn(BER_UMFANG, u)).map((u) => BER_UMFANG[u]);
    if (arten.length) arten = [...arten, 'freigabe'];
  }
  return BEREICH_ARTEN.filter((a) => arten.includes(a));
}
/* a grant counts on "heute" if it is not revoked and heute lies between from and until (both days included) */
const berAktiv = (g, heute) => berObj(g) && g.widerrufen !== true && berTag(g.from) && berTag(g.until) && g.from <= heute && heute <= g.until;

/* who must hold the key of this area today -> [{ id, pub }] sorted by id
   mitglieder: { <personId>: { role, pub } } - the family of the child (plus the grant recipients), as in annahme
   freigaben:  [{ grant, grantee, scope, from, until, widerrufen? }] - the grants of this child (from its eltern:allg)
   heute:      "YYYY-MM-DD" */
export function halter(bereich, mitglieder, freigaben, heute) {
  const z = bereichZerlegen(bereich);
  if (!z) throw berFehler('unbekannter Bereich ' + bereich + '.');
  if (!berObj(mitglieder) || !Array.isArray(freigaben) || !berTag(heute)) throw berFehler('halter braucht mitglieder, freigaben und heute.');
  const out = new Map();
  const dazu = (id) => { const m = berOwn(mitglieder, id) ? mitglieder[id] : null; if (berObj(m) && berObj(m.pub)) out.set(id, { id, pub: m.pub }); };
  if (z.art === 'person') dazu(z.id);
  else {
    for (const [id, m] of Object.entries(mitglieder)) {
      if (!berObj(m)) continue;
      if (m.role === 'parent' && bereicheFuer('parent').includes(z.art)) dazu(id);
      if (m.role === 'child' && id === z.id && bereicheFuer('child').includes(z.art)) dazu(id);   // only this child, no sibling
    }
    for (const g of freigaben) {                    // grants open something for teachers and admins only
      const m = berAktiv(g, heute) && berOwn(mitglieder, g.grantee) ? mitglieder[g.grantee] : null;
      if (!berObj(m) || (m.role !== 'teacher' && m.role !== 'admin')) continue;
      const arten = bereicheFuer(m.role, g.scope);
      if (z.art === 'freigabe' ? g.grant === z.id && arten.includes('freigabe') : arten.includes(z.art)) dazu(g.grantee);
    }
  }
  return [...out.values()].sort((a, b) => berCmp(a.id, b.id));
}

/* ---------- key entries in the storage ---------- */
/* who may hand out keys of this area: parents; for person:<id> only the person */
function berVerteiler(bereich, mitglieder) {
  const z = bereichZerlegen(bereich);
  if (!z) return [];
  if (z.art === 'person') return berOwn(mitglieder, z.id) ? [z.id] : [];
  return Object.keys(mitglieder).filter((id) => berObj(mitglieder[id]) && mitglieder[id].role === 'parent');
}
const berSignTeil = (bereich, h, e) => berTE.encode('bq-key1|' + bereich + '|' + h + '|' + berCanon({ v: e.v, von: e.von, versionen: e.versionen }));
async function berGueltige(zugang, bereich, mitglieder) {
  const alle = await zugang.keys(bereich), erlaubt = berVerteiler(bereich, mitglieder);
  const gueltig = new Map(), ungueltig = [];
  for (const [h, e] of Object.entries(alle)) {
    const form = berObj(e) && e.v === 1 && typeof e.sig === 'string' && berObj(e.versionen) && Object.keys(e.versionen).length > 0 &&
      Object.entries(e.versionen).every(([v, w]) => /^[1-9][0-9]{0,8}$/.test(v) && berObj(w));
    const m = form && erlaubt.includes(e.von) ? mitglieder[e.von] : null;
    if (m && berObj(m.pub) && await verifyBytes(m.pub, berSignTeil(bereich, h, e), e.sig)) gueltig.set(h, e);
    else ungueltig.push(h);
  }
  return { gueltig, ungueltig, alle };
}
function berRing(bereich, gueltig) {
  const ring = { area: bereich, current: 0, versions: {} };
  for (const [h, e] of gueltig) for (const [v, w] of Object.entries(e.versionen)) {
    (ring.versions[v] = ring.versions[v] || {})[h] = w;
    ring.current = Math.max(ring.current, Number(v));
  }
  return ring;
}
/* all versions this person can open: Map version -> key (a version that does not open is left out) */
async function berMeine(ring, ich, meineSchluessel) {
  const out = new Map();
  for (const [v, hs] of Object.entries(ring.versions)) {
    if (!berOwn(hs, ich)) continue;
    try { out.set(Number(v), await unwrapKey(hs[ich], meineSchluessel, ich, ring.area, Number(v))); } catch (e) { /* not for these keys */ }
  }
  return out;
}

/* the keys of one person for one area, ready for module abgleich -> { aktuell, keys: Map version -> key, lesbar, ungueltig }
   aktuell = the newest version any valid entry knows (0 = no key yet). A person without the current version can
   still read what was written before, but cannot write (abgleich: "aktueller Schluessel fehlt"). */
export async function schluesselLesen(zugang, bereich, { ich, meineSchluessel, mitglieder } = {}) {
  if (!bereichZerlegen(bereich) || !berPid(ich) || !berObj(mitglieder)) throw berFehler('schluesselLesen braucht Bereich, ich und mitglieder.');
  const { gueltig, ungueltig, alle } = await berGueltige(zugang, bereich, mitglieder);
  const ring = berRing(bereich, gueltig), keys = await berMeine(ring, ich, meineSchluessel);
  // lesbar (task P3b-2): also the versions of my own entry whose distributor I do not know yet (a new device knows
  // only the anchor; the second parent who changed the key becomes known by reading). Reading with them is safe -
  // module annahme checks every event against the admission anchored at the founding parent. Writing: keys only.
  const lesbar = new Map(keys), eigen = berOwn(alle, ich) ? alle[ich] : null;
  if (!gueltig.has(ich) && berObj(eigen) && berObj(eigen.versionen)) {
    const roh = { area: bereich, current: 0, versions: {} };
    for (const [v, w] of Object.entries(eigen.versionen)) if (/^[1-9][0-9]{0,8}$/.test(v) && berObj(w)) roh.versions[v] = { [ich]: w };
    for (const [v, k] of await berMeine(roh, ich, meineSchluessel)) if (!lesbar.has(v)) lesbar.set(v, k);
  }
  return { aktuell: ring.current, keys, lesbar, ungueltig };
}

/* brings the keys of the area in line with "soll" (= halter(...)); only a distributor may do it:
   - no key yet                     -> version 1 for everybody in soll ("angelegt")
   - somebody holds the current version but is no longer in soll -> new version for soll only ("gewechselt", E6);
                                       earlier versions stay, so everybody keeps reading what he could read before
   - somebody in soll lacks the current version -> he gets every version the distributor has ("ergaenzt"), so a
                                       second parent or a new grant reads the history, too
   -> { aktion: 'angelegt' | 'gewechselt' | 'ergaenzt' | 'unveraendert', version, neu: [id], entfernt: [id], ereignisse }
   ereignisse (task P3b-2): what the distributor must write into this area now, as [{ type, payload }] - member_added
   for everybody new (role and public keys from mitglieder), member_removed and key_rotated (with the bundles per device
   at the change, speicher.list) for everybody removed. The app signs and sends them like any other event. */
export async function schluesselVerteilen(zugang, bereich, { soll, ich, meineSchluessel, mitglieder } = {}) {
  if (!bereichZerlegen(bereich) || !berObj(mitglieder) || !Array.isArray(soll)) throw berFehler('schluesselVerteilen braucht Bereich, soll und mitglieder.');
  if (!berVerteiler(bereich, mitglieder).includes(ich)) throw berFehler('nur Eltern verteilen Schluessel (person: nur die Person selbst).');
  const ids = soll.map((h) => (berObj(h) && berPid(h.id) && berObj(h.pub) ? h.id : null));
  if (ids.includes(null) || new Set(ids).size !== ids.length) throw berFehler('soll ungueltig.');
  const { gueltig } = await berGueltige(zugang, bereich, mitglieder);
  const schreiben = new Map();                       // holder -> versionen
  let aktion, version, neu, entfernt = [];
  if (gueltig.size === 0) {
    const { ring } = await createKeyring(bereich, soll);
    for (const h of soll) schreiben.set(h.id, { 1: ring.versions[1][h.id] });
    [aktion, version, neu] = ['angelegt', 1, ids.slice().sort(berCmp)];
  } else {
    const ring = berRing(bereich, gueltig), meine = await berMeine(ring, ich, meineSchluessel);
    if (!meine.has(ring.current)) throw berFehler('aktueller Schluessel fehlt - nichts verteilt.');
    const jetzt = Object.keys(ring.versions[ring.current]);
    entfernt = jetzt.filter((id) => !ids.includes(id)).sort(berCmp);
    neu = ids.filter((id) => !jetzt.includes(id)).sort(berCmp);
    version = ring.current;
    const alleVersionen = async (h) => {                // the whole history for somebody new
      const v = { ...(gueltig.has(h.id) ? gueltig.get(h.id).versionen : {}) };
      for (const [n, key] of meine) v[n] = await wrapKeyFor(key, h, bereich, n);
      return v;
    };
    if (entfernt.length) {
      const r = await rotateKeyring(ring, soll);
      version = r.ring.current;
      for (const h of soll) {
        const v = neu.includes(h.id) ? await alleVersionen(h) : { ...gueltig.get(h.id).versionen };
        v[version] = r.ring.versions[version][h.id];
        schreiben.set(h.id, v);
      }
      aktion = 'gewechselt';
    } else {
      for (const h of soll) if (neu.includes(h.id)) schreiben.set(h.id, await alleVersionen(h));
      aktion = neu.length ? 'ergaenzt' : 'unveraendert';
    }
  }
  for (const [h, versionen] of [...schreiben].sort((a, b) => berCmp(a[0], b[0]))) {
    const e = { v: 1, von: ich, versionen };
    await zugang.putKey(bereich, h, { ...e, sig: await signBytes(meineSchluessel, berSignTeil(bereich, h, e)) });
  }
  const ereignisse = neu.map((id) => ({ type: 'member_added', payload: { person: id, role: mitglieder[id].role, pub: { ...soll.find((h) => h.id === id).pub } } }));
  if (aktion === 'gewechselt') {
    for (const id of entfernt) ereignisse.push({ type: 'member_removed', payload: { person: id } });
    ereignisse.push({ type: 'key_rotated', payload: { version, entfernt: entfernt.slice(), stand: { ...(await zugang.list(bereich, null)).merker.stand } } });
  }
  return { aktion, version, neu, entfernt, ereignisse };
}
