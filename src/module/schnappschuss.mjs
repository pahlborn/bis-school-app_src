// Module schnappschuss - a new device gets up to date quickly (S12 P2, task 5; EP7: US7.6; concept 9.3).
// Pure functions: no screen, no storage, no network; "now" is passed in. Test build only (module.json: bau "test").
//
//   snapshot:  an event "snapshot", written by a parent device (signing and accepting: module annahme) with
//                upTo     time of the newest event it contains; always strictly before "now" of the writing device,
//                         so no event from a wrong clock (more than 24 h ahead, counted as "now") is inside
//                count    how many events it contains: every event with effective time <= upTo (snapshots not counted)
//                idsHash  SHA-256 over exactly these events, sorted by id (id and content, see snHash)
//                state    derive() of these events (module ableitung)
//   use:       stateFrom compares the events the device knows up to upTo with the snapshot:
//                knows none of them (new device: only the snapshot and what came after)  -> "schnappschuss"
//                knows exactly these (same count and checksum)                            -> "schnappschuss"
//                knows others, at least as many (a late event: practised offline,
//                synced after the snapshot)                                               -> "voll" (derive over all)
//                knows fewer and others (a new device got a late event)                   -> "nachladen": first load the
//                                                                                            old events, then again
//   So snapshot + the events after it always give the same state as all events without the snapshot.
//
// Names: helpers start with "sn"/"SN_" because all modules and index.html share one scope in the app.

import { checkEvent, effectiveTime, mergeLog, newEvent, EVENT_FUTURE_MS } from './ereignisse.mjs';
import { derive } from './ableitung.mjs';
import {RANK_POLICY,rankIdx,higherRank} from './titel.mjs';

export const SNAPSHOT_EVERY = 5000;

const snMs = (x) => (typeof x === 'number' ? x : x instanceof Date ? x.getTime() : typeof x === 'string' ? Date.parse(x) : NaN);
function snNow(now, wo) {
  const n = snMs(now);
  if (now === undefined || now === null || Number.isNaN(n)) throw new Error('schnappschuss: "now" fehlt (' + wo + ')');
  return n;
}
const snCmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
function snCanon(x) {
  if (x === null || typeof x !== 'object') return JSON.stringify(x);
  if (Array.isArray(x)) return '[' + x.map((v) => snCanon(v === undefined ? null : v)).join(',') + ']';
  return '{' + Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => JSON.stringify(k) + ':' + snCanon(x[k])).join(',') + '}';
}
/* the events that count: valid, each id once (mergeLog decides between variants), no snapshots */
const snKnown = (events, n) => mergeLog([Array.isArray(events) ? events : []], n).events.filter((e) => e.type !== 'snapshot');
/* the events a snapshot up to upTo contains: effective time <= upTo (the same cut derive uses for its base) */
const snUpTo = (known, upTo, n) => known.filter((e) => effectiveTime(e.at, n) <= upTo);
/* SHA-256 (hex) over the events sorted by id, one line per event: id and content, so a different variant of the same
   id is noticed, too */
async function snHash(list) {
  const text = 'bq-snap1\n' + list.slice().sort((a, b) => snCmp(a.id, b.id)).map(snCanon).join('\n');
  const d = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  return Array.from(d, (b) => b.toString(16).padStart(2, '0')).join('');
}
function snCheck(snapshot) {
  if (!snapshot || snapshot.type !== 'snapshot' || checkEvent(snapshot).length) throw new Error('schnappschuss: kein gueltiger Schnappschuss');
}

/* yes, if at least SNAPSHOT_EVERY events came after the last snapshot (time after its upTo; without one: all events).
   Only valid events count, each id once, snapshots not. */
export function needsSnapshot(events, lastSnapshot) {
  let upTo = -Infinity;
  if (lastSnapshot) { snCheck(lastSnapshot); upTo = Date.parse(lastSnapshot.payload.upTo); }
  const ids = new Set();
  for (const e of Array.isArray(events) ? events : []) {
    if (!e || e.type === 'snapshot' || ids.has(e.id) || checkEvent(e).length) continue;
    if (Date.parse(e.at) > upTo) ids.add(e.id);
  }
  return ids.size >= SNAPSHOT_EVERY;
}

/* -> the event "snapshot" (not yet signed: module annahme), or null if there is no event before "now".
   author/device: the parent and its device; rand only for tests (as in newEvent). */
export async function makeSnapshot(events, { now, author, device, rand } = {}) {
  const n = snNow(now, 'makeSnapshot');
  const known = snKnown(events, n);
  let upTo = -Infinity;
  for (const e of known) { const t = Date.parse(e.at); if (t < n && t > upTo) upTo = t; }   // the newest event strictly before "now"
  if (upTo === -Infinity) return null;
  const inside = snUpTo(known, upTo, n);
  const payload = { upTo: new Date(upTo).toISOString(), count: inside.length, idsHash: await snHash(inside), state: derive(inside, { now: n }) };
  const snap = newEvent({ type: 'snapshot', author, device, at: new Date(n).toISOString(), payload }, rand ? { rand } : {});
  const errors = checkEvent(snap);
  if (errors.length) throw new Error('schnappschuss: Schnappschuss ungueltig (' + errors.join('; ') + ')');
  return snap;
}

/* A trusted snapshot's already retained EP03 title cannot be erased by a
   full fallback caused by later arrivals from a slower device. Only these two
   monotone title fields are carried over; raw evidence and path decisions stay. */
function snRetainedTitle(state,stored){
  if(stored?.rankPolicy===RANK_POLICY && rankIdx(stored.rankSeen)>=0){
    state.rankSeen=higherRank(state.rankSeen,stored.rankSeen);
    state.rankPolicy=RANK_POLICY;
  }
  return state;
}

/* -> { state, weg }: weg "schnappschuss" (snapshot + later events), "voll" (all events, the snapshot does not fit) or
   "nachladen" (state null: the device has a late event but not the old events - load them, then call again).
   Without a snapshot: "voll". The snapshot must be valid (accepted by module annahme before). */
export async function stateFrom(events, snapshot, { now } = {}) {
  const n = snNow(now, 'stateFrom');
  const known = snKnown(events, n);
  if (!snapshot) return { state: derive(known, { now: n }), weg: 'voll' };
  snCheck(snapshot);
  const p = snapshot.payload, upTo = Date.parse(p.upTo);
  const inside = snUpTo(known, upTo, n);
  // a clock more than 24 h behind the writing device would put events before upTo in another order: never use it then
  const clockOk = upTo <= n + EVENT_FUTURE_MS;
  if (clockOk && (inside.length === 0 || (inside.length === p.count && (await snHash(inside)) === p.idsHash))) {
    return { state: derive(known, { now: n, base: { upTo: p.upTo, state: p.state } }), weg: 'schnappschuss' };
  }
  if (inside.length >= p.count) return { state: snRetainedTitle(derive(known, { now: n }),p.state), weg: 'voll' };
  return { state: null, weg: 'nachladen' };
}
