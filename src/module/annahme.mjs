// Module annahme - signature and rights check when reading (concept 6, 7.2, 8.5; EP7: US7.5; success criterion E10).
// Pure functions: no screen, no storage, no network. Test build only (module.json: bau "test").
//
//   sign:     the author signs a fixed byte sequence: "bq-sig1|" + area + "|" + the event with sorted keys.
//             The area is part of the signature, so an event cannot be copied into another area.
//   accept:   an event counts only if it is well-formed, its author is admitted, the device belongs to the author,
//             the signature is valid, its type (for profile_set: the field) belongs into this area (module bereiche,
//             task P3b) and the role may write this type. Checked in exactly this order; the first failing check is
//             the reason. An area name outside the scheme of module bereiche fits no event.
//   admission (input, computed from member_* / device_* events later, EP9):
//             { area, members: { <personId>: { role: 'child'|'parent'|'teacher'|'admin', pub: { ecdh, ecdsa }, devices: [<deviceId>] } } }
//
// Names: every helper starts with "ann"/"ANN_" because all modules and index.html share one scope in the app.

import { signBytes, verifyBytes } from './krypto.mjs';
import { checkEvent } from './ereignisse.mjs';
import { passtZumBereich } from './bereiche.mjs';

/* reasons, in the order they are checked */
export const ANNAHME_GRUENDE = ['format', 'autor-unbekannt', 'geraet-fremd', 'unterschrift', 'bereich-falsch', 'rolle-darf-nicht'];

/* ---------- who may write which type (concept 6 "Schreiben", table 7.2, 5.2, 9.3) ----------
   child:   learning progress, profile, own sheets (create, enter the results), day hints, checklist; registers its own device
   parent:  profile (correct), sheets (create, discard), settings, school data, grants, members, devices,
            key change, snapshot - but no answers, rounds, sheet results or day hints of the child (concept 6: "Antwort ... Elternteil ❌").
            A9/A10 (02.11.): the child enters its sheet itself (index.html sheetResult); grown-ups only see the state.
            So "sheet_result" - and the review and the badge "principled" it causes - are the child's; the former
            exception for parents (review, badge "principled") is gone.
   gaps (task 3b-0, index.html openGaps/gapAct): parents choose, close, keep open; the child's device only does
            what the app does there today: close a gap automatically (state "closed", by "app"). The parents'
            devices close automatically, too, so parents may write by "app" as well.
   lists (task 3b-1b-2): unlocked quests and the manual focus are set by parents (list_set); an Advent door is opened
            by the child - or by a parent while the grown-ups' area is open (advent_open)
   teacher, admin: only the protocol entry "opened" for their own grant (5.2) and - since P3b-2, where every area carries its
            own admission - the registration of their own device; they never write into child data */
const ANN_RIGHTS = {
  child: ['answer', 'round_done', 'badge', 'review', 'practice_day', 'profile_set', 'rank_seen', 'sheet_created', 'sheet_result', 'checklist_set', 'day_flag', 'device_added', 'gap_state', 'advent_open'],
  parent: ['profile_set', 'sheet_created', 'sheet_discarded', 'setting_set', 'school_import', 'grant_set', 'grant_revoked', 'member_added', 'member_removed', 'device_added', 'device_removed', 'key_rotated', 'snapshot', 'gap_state', 'gap_active', 'list_set', 'advent_open'],
  teacher: ['grant_opened', 'device_added'],
  admin: ['grant_opened', 'device_added'],
};
export const ANNAHME_RECHTE = Object.freeze(Object.fromEntries(Object.entries(ANN_RIGHTS).map(([r, t]) => [r, Object.freeze(t.slice())])));

/* conditions beyond role and type (e = event, role = role of the author) */
const ANN_LIMITS = {
  device_added: (e) => e.payload.device === e.device,                         // a device registers itself, nobody adds a foreign device
  grant_opened: (e) => e.payload.grantee === e.author,                        // the recipient logs his own opening, nobody else's
  gap_state: (e, role) => role !== 'child' || (e.payload.state === 'closed' && e.payload.by === 'app'),   // the child: only the automatic close
};

/* ---------- helpers ---------- */
const annObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const annOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const annEnc = new TextEncoder();
function annCanon(x) {
  if (x === null || typeof x !== 'object') return JSON.stringify(x);
  if (Array.isArray(x)) return '[' + x.map((v) => annCanon(v === undefined ? null : v)).join(',') + ']';
  return '{' + Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => JSON.stringify(k) + ':' + annCanon(x[k])).join(',') + '}';
}
function annCheckAdmission(z) {
  if (!annObj(z) || typeof z.area !== 'string' || !z.area || !annObj(z.members)) throw new Error('annahme: Zulassung braucht area und members.');
}

/* ---------- sign ---------- */
/* the fixed byte sequence that is signed: area + event with sorted keys */
export function canonicalBytes(event, area) {
  if (typeof area !== 'string' || !area) throw new Error('annahme: Bereich fehlt.');
  return annEnc.encode('bq-sig1|' + area + '|' + annCanon(event));
}
/* -> { event, sig }; a malformed event is not signed */
export async function signEvent(event, area, myKeys) {
  const errors = checkEvent(event);
  if (errors.length) throw new Error('annahme: Ereignis ungueltig, nicht unterschrieben (' + errors.join('; ') + ')');
  const copy = JSON.parse(JSON.stringify(event));
  return { event: copy, sig: await signBytes(myKeys, canonicalBytes(copy, area)) };
}

/* ---------- accept ---------- */
/* item = { event, sig } -> { ok: true } or { ok: false, grund } (grund: one of ANNAHME_GRUENDE) */
export async function acceptEvent(item, zulassung) {
  annCheckAdmission(zulassung);
  if (!annObj(item) || Object.keys(item).some((k) => k !== 'event' && k !== 'sig') || checkEvent(item.event).length) return { ok: false, grund: 'format' };
  const e = item.event;
  const member = annOwn(zulassung.members, e.author) ? zulassung.members[e.author] : null;
  if (!annObj(member)) return { ok: false, grund: 'autor-unbekannt' };
  if (!Array.isArray(member.devices) || !member.devices.includes(e.device)) return { ok: false, grund: 'geraet-fremd' };
  if (typeof item.sig !== 'string' || !item.sig || !annObj(member.pub) || !(await verifyBytes(member.pub, canonicalBytes(e, zulassung.area), item.sig))) return { ok: false, grund: 'unterschrift' };
  if (!passtZumBereich(e, zulassung.area)) return { ok: false, grund: 'bereich-falsch' };
  if (!roleMayWrite(member.role, e)) return { ok: false, grund: 'rolle-darf-nicht' };
  return { ok: true };
}
/* may this role write this (well-formed) event? Type and the extra conditions; the same rule the writer
   (module schreiber) applies before it stores an event. Unknown roles may nothing. */
export function roleMayWrite(role, e) {
  const allowed = typeof role === 'string' && annOwn(ANN_RIGHTS, role) ? ANN_RIGHTS[role] : [];
  return !!e && allowed.includes(e.type) && !(annOwn(ANN_LIMITS, e.type) && !ANN_LIMITS[e.type](e, role));
}
/* checks every item; nothing is dropped silently: each item is either accepted or rejected with a reason.
   Order is kept. -> { angenommen: [item], verworfen: [{ item, grund }] } */
export async function acceptAll(items, zulassung) {
  annCheckAdmission(zulassung);
  if (!Array.isArray(items)) throw new Error('annahme: Liste erwartet.');
  const angenommen = [], verworfen = [];
  for (const item of items) {
    const r = await acceptEvent(item, zulassung);
    if (r.ok) angenommen.push(item); else verworfen.push({ item, grund: r.grund });
  }
  return { angenommen, verworfen };
}
