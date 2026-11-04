// Module geraeteabgleich - one device syncs the app's events with the storage (S12 task 3b-2b, M3; concept 9.1, 11).
// Test build only (module.json: bau "test", after lesen). No screen, no timer, no clock: the app (later a button or
// every 30 s) or a test calls geraetAbgleichen; device storage, storage access, keys, time are passed in.
//
//   The app writes its events unsigned into its own logs: bq2_<child>__events (bq2_events without accounts) and
//   bq2_personEvents. For every area this device takes part in, geraetAbgleichen
//     1. fetches it (zulassung.bereichHolen: keys, admission built from the area's own events, anchored at the founding
//        parent) - with the key of a person on this device, if one has a key entry there
//     2. hands out the keys if a distributor is on this device (a parent who belongs to a child's area; the person
//        itself for person:<id>): holders = bereiche.halter with the grants found in the child's log; the events of
//        schluesselVerteilen (member_added, member_removed, key_rotated) are signed by him and queued
//     3. registers this device (device_added) for every person here who belongs to the area and holds its current key
//     4. signs the app's own new events of this area (written on this device; the author's keys are here) and queues them
//     5. sends them (abgleich.senden) with the current key
//     6. writes what other devices wrote - accepted by module annahme - into the app's log (never admission events);
//        the app reads it after evNeuLaden()
//   In the area of a grant (freigabe:<id>) the distributor also writes a copy of the grant (grant_set without the consent
//   text; grant_revoked once it was ended - sent BEFORE the key changes, with the key the recipient still holds), so the
//   recipient's app knows its grant, finds the child and learns that it ended (task "Lehrkraft sieht ihre Schueler").
//   Device storage (plain JSON, technical, never synced): bq_abgleich = { <area>: device state of module abgleich },
//   bq_abgleichVerworfen = everything dropped, with reason (module abgleich reports it once, so it is kept here).
//   A storage error (err.code, e.g. "offline") ends only that area; its state stays as it was, nothing is lost.
//
// Names: every helper starts with "gab"/"GAB_" because all modules and index.html share one scope in the app.

import { newEvent, mergeLog } from './ereignisse.mjs';
import { signEvent } from './annahme.mjs';
import { BEREICH_AUCH, bereichName, bereichVonEreignis, passtZumBereich, halter, schluesselLesen, schluesselVerteilen } from './bereiche.mjs';
import { abgleichStand, vormerken, senden } from './abgleich.mjs';
import { zulassungAus, aktiveMitglieder, bereichHolen } from './zulassung.mjs';

/* keys in the device storage */
export const GERAETEABGLEICH_SPEICHER = Object.freeze({ staende: 'bq_abgleich', verworfen: 'bq_abgleichVerworfen', geraet: 'bq2_evDevice', personen: 'bq2_personEvents' });
/* at most this many dropped entries are kept on the device (the newest) */
export const GERAETEABGLEICH_VERWORFEN_MAX = 1000;

const GAB_KIND_ARTEN = ['kind:lern', 'kind:privat', 'schule', 'eltern:allg'];
const GAB_ROLLEN = ['parent', 'child', 'teacher', 'admin'];        // who reads first on a shared device
const gabObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const gabPid = (x) => typeof x === 'string' && /^p_[0-9A-Za-z]{1,40}$/.test(x);
const gabTag = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const gabCmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
function gabFehler(text) { return new Error('geraeteabgleich: ' + text); }
function gabJson(ablage, k, d) {
  const v = ablage.getItem(k);
  if (v === null || v === undefined) return d;
  try { return JSON.parse(v); } catch (e) { return d; }
}
const gabListe = (x) => (Array.isArray(x) ? x : []);
const gabPub = (p) => gabObj(p) && typeof p.ecdh === 'string' && typeof p.ecdsa === 'string';
/* must this device be registered for this member now? -> null or { ab: earliest time } - when it never was, or when its
   registration ended with an earlier membership (after being added again a device registers anew). Not when it was
   removed during the current membership (device_removed): a removed device does not register itself again. The time is
   after the start of the membership, so the order is right whatever the clocks of the two devices say. */
function gabAnmelden(zul, pid, geraet) {
  const m = zul.members[pid], p = m && m.perioden[m.perioden.length - 1];
  if (!p || p.bis !== null) return null;
  const l = (m.geraete || {})[geraet], letzte = Array.isArray(l) && l.length ? l[l.length - 1] : null;
  if (letzte && (letzte.bis === null || p.von === null || letzte.bis > p.von)) return null;
  return { ab: p.von === null ? 0 : p.von + 1 };
}

function gabPruefen({ ablage, zugang, personen, kinder, verzeichnis, now, heute }) {
  if (!gabObj(ablage) || typeof ablage.getItem !== 'function' || typeof ablage.setItem !== 'function') throw gabFehler('ablage (getItem/setItem) fehlt.');
  if (!gabObj(zugang) || typeof zugang.list !== 'function') throw gabFehler('zugang fehlt.');
  if (!gabObj(personen) || !Object.keys(personen).length) throw gabFehler('personen fehlen.');
  for (const [pid, p] of Object.entries(personen)) {
    if (!gabPid(pid) || !gabObj(p) || !GAB_ROLLEN.includes(p.role) || !gabObj(p.keys) || !gabPub(p.pub)) throw gabFehler('Person ' + pid + ' braucht role, keys und pub.');
  }
  if (!Array.isArray(kinder) || kinder.some((c) => !gabObj(c) || !gabPid(c.id) || typeof c.pre !== 'string' || !c.pre.startsWith('bq2_') || !gabObj(c.anker))) throw gabFehler('kinder: [{ id, pre, anker }] erwartet.');
  if (kinder.some((c) => c.freigaben !== undefined && (!Array.isArray(c.freigaben) || c.freigaben.some((g) => typeof g !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(g))))) throw gabFehler('kinder[].freigaben: Liste von Freigabe-Kennungen erwartet.');
  if (!gabObj(verzeichnis)) throw gabFehler('verzeichnis erwartet.');
  if (!Number.isFinite(now)) throw gabFehler('"now" fehlt.');
  if (!gabTag(heute)) throw gabFehler('"heute" (JJJJ-MM-TT) fehlt.');
}

/* the grants of a child, as module bereiche expects them, from the child's log in the app */
function gabFreigaben(log) {
  const g = new Map();
  for (const e of log) {
    if (!gabObj(e) || !gabObj(e.payload)) continue;
    if (e.type === 'grant_set') g.set(e.payload.grant, { grant: e.payload.grant, grantee: e.payload.grantee, scope: e.payload.scope, from: e.payload.from, until: e.payload.until, widerrufen: g.has(e.payload.grant) && g.get(e.payload.grant).widerrufen === true });
    else if (e.type === 'grant_revoked' && g.has(e.payload.grant)) g.get(e.payload.grant).widerrufen = true;
  }
  return [...g.values()];
}

/* the app's log of a target: { lesen, schreiben } */
function gabZiel(ablage, ziel) {
  if (ziel.pre) {
    const k = ziel.pre + 'events';
    return { lesen: () => gabListe(gabJson(ablage, k, [])), schreiben: (l) => ablage.setItem(k, JSON.stringify(l)) };
  }
  const K = GERAETEABGLEICH_SPEICHER.personen;
  return {
    lesen: () => gabListe(gabJson(ablage, K, {})[ziel.person]),
    schreiben: (l) => { const alle = gabJson(ablage, K, {}); alle[ziel.person] = l; ablage.setItem(K, JSON.stringify(alle)); },
  };
}

/* one area; changes "stand" (the caller stores it) and returns the report of this area */
async function gabBereich(o, area, ziel, anker, stand) {
  const { zugang, personen, geraet, now, heute, verzeichnis } = o;
  const bericht = { ok: true, fehler: null, aktion: null, gesendet: 0, neu: 0, verworfen: [], ohneSchluessel: 0, inDieApp: 0 };
  let t = now;                                                          // own new events: one millisecond apart, in order
  const zeit = (ab) => { t = Math.max(t, ab || 0); return new Date(t++).toISOString(); };
  const eintragen = async (pid, type, payload, ab) => vormerken(stand, await signEvent(newEvent({ type, author: pid, device: geraet, at: zeit(ab), payload }), area, personen[pid].keys), { now });
  const anmelden = async (zul, pid) => { const a = gabAnmelden(zul, pid, geraet); if (a) await eintragen(pid, 'device_added', { device: geraet }, a.ab); return !!a; };
  const reihe = Object.keys(personen).sort((a, b) => (GAB_ROLLEN.indexOf(personen[a].role) - GAB_ROLLEN.indexOf(personen[b].role)) || gabCmp(a, b));
  try {
    // 1. fetch with the key of a person here
    const eintraege = await zugang.keys(area);
    const leser = reihe.find((pid) => gabObj(eintraege) && Object.prototype.hasOwnProperty.call(eintraege, pid));
    if (leser) {
      const h = await bereichHolen(stand, { zugang, ich: leser, meineSchluessel: personen[leser].keys, anker, now });
      bericht.neu = h.neu;
      bericht.verworfen = h.verworfen.map((v) => ({ bereich: area, ...v }));
    }
    let zul = await zulassungAus(stand.log, { area, anker, now });
    const art = area.split(':').slice(0, -1).join(':');
    // 2. hand out the keys
    const verteiler = reihe.find((pid) => (art === 'person' ? area === 'person:' + pid : personen[pid].role === 'parent' && Object.prototype.hasOwnProperty.call(aktiveMitglieder(zul), pid)));
    if (verteiler) {
      // his device first: what he writes counts only from a registered device (also for the anchor)
      if (await anmelden(zul, verteiler)) zul = await zulassungAus(stand.log, { area, anker, now });
      const mitglieder = {};
      for (const [pid, m] of Object.entries(verzeichnis)) if (gabObj(m) && GAB_ROLLEN.includes(m.role) && gabPub(m.pub)) mitglieder[pid] = { role: m.role, pub: m.pub };
      for (const [pid, p] of Object.entries(personen)) mitglieder[pid] = { role: p.role, pub: p.pub };
      Object.assign(mitglieder, aktiveMitglieder(zul));
      const freigaben = ziel.pre ? gabFreigaben(gabZiel(o.ablage, ziel).lesen()) : [];
      // the area of a grant carries the grant itself, for its recipient (task "Lehrkraft sieht ihre Schueler"): a copy
      // by the distributor, without the consent text - the app's own grant_set was written before this area existed
      // (and maybe by the other parent), so it could never count here. The end goes out BEFORE the key changes, with the
      // key the recipient still holds, so his app learns it; an expired grant needs no entry (it follows from "until").
      const g = art === 'freigabe' ? freigaben.find((x) => x.grant === area.slice('freigabe:'.length)) : null;
      const kopien = async () => {
        const da = (type) => stand.log.some((x) => x.event.type === type && x.event.payload.grant === g.grant);
        if (!da('grant_set')) await eintragen(verteiler, 'grant_set', { grant: g.grant, grantee: g.grantee, scope: g.scope.slice(), from: g.from, until: g.until });
        if (g.widerrufen && !da('grant_revoked')) await eintragen(verteiler, 'grant_revoked', { grant: g.grant, grantee: g.grantee });
      };
      if (g && g.widerrufen) {
        const s = await schluesselLesen(zugang, area, { ich: verteiler, meineSchluessel: personen[verteiler].keys, mitglieder: aktiveMitglieder(zul) });
        if (s.aktuell && s.keys.has(s.aktuell)) {
          await kopien();
          bericht.gesendet += (await senden(stand, { zugang, schluessel: { aktuell: s.aktuell, keys: s.keys } })).gesendet;
        }
      }
      const r = await schluesselVerteilen(zugang, area, { soll: halter(area, mitglieder, freigaben, heute), ich: verteiler, meineSchluessel: personen[verteiler].keys, mitglieder });
      bericht.aktion = r.aktion;
      for (const e of r.ereignisse) await eintragen(verteiler, e.type, e.payload);
      if (r.ereignisse.length) zul = await zulassungAus(stand.log, { area, anker, now });
      if (g) await kopien();
    }
    // 3. register this device for everybody here who belongs and holds the current key
    const aktiv = aktiveMitglieder(zul);
    let schreiber = null;
    for (const pid of reihe) {
      if (!Object.prototype.hasOwnProperty.call(aktiv, pid)) continue;
      const s = await schluesselLesen(zugang, area, { ich: pid, meineSchluessel: personen[pid].keys, mitglieder: aktiv });
      if (!s.aktuell || !s.keys.has(s.aktuell)) continue;
      if (!schreiber) schreiber = { aktuell: s.aktuell, keys: s.keys };
      await anmelden(zul, pid);
    }
    // 4. the app's own new events of this area
    const bekannt = new Set([...stand.log, ...stand.ausgang].map((x) => x.event.id));
    for (const e of gabZiel(o.ablage, ziel).lesen()) {
      // (admission events and snapshots fit every area - they are this module's and module bereiche's, never the app's;
      // the grant itself goes into the area of the grant only as the distributor's copy, see step 2)
      if (!gabObj(e) || e.device !== geraet || bekannt.has(e.id) || bereichVonEreignis(e) === '*' || !passtZumBereich(e, area)) continue;
      if (art === 'freigabe' && BEREICH_AUCH[e.type] === 'freigabe') continue;
      if (!Object.prototype.hasOwnProperty.call(personen, e.author)) { bericht.ohneSchluessel++; continue; }
      vormerken(stand, await signEvent(e, area, personen[e.author].keys), { now });
    }
    // 5. send
    if (stand.ausgang.length || stand.unterwegs) {
      if (schreiber) bericht.gesendet += (await senden(stand, { zugang, schluessel: schreiber })).gesendet;
      else { bericht.ok = false; bericht.fehler = 'kein-schluessel'; }
    }
    // 6. into the app: what others wrote and annahme accepted (no admission events - they are the area's, not the app's)
    const app = gabZiel(o.ablage, ziel);
    const da = new Set(app.lesen().map((e) => gabObj(e) && e.id));
    const neu = stand.log.map((x) => x.event).filter((e) => e.device !== geraet && !da.has(e.id) && bereichVonEreignis(e) !== '*');
    if (neu.length) {
      app.schreiben(mergeLog([app.lesen(), neu], now).events);
      bericht.inDieApp = neu.length;
    }
  } catch (err) {
    if (!err || typeof err.code !== 'string') throw err;
    bericht.ok = false; bericht.fehler = err.code;
  }
  return bericht;
}

/* syncs every area this device takes part in.
   ablage:      { getItem, setItem } - the device's storage (in the app: the browser storage); the device id is bq2_evDevice
   zugang:      storage access of this device (module speicher: store.geraet(<device id>))
   personen:    { <personId>: { role, keys, pub } } - the persons whose keys are on this device (unlocked at login, EP9)
   kinder:      [{ id, pre, anker, freigaben? }] - children whose data this device holds: person id, prefix of the app's
                storage (bq2_<id>__; without accounts bq2_) and anker = the founding parent { person, role, pub };
                freigaben = ids of grants for this child this device was invited to (a teacher's or the admin's device;
                EP9: the invitation). A teacher's device finds its grant there (freigabe:<id>: grant_set, grant_revoked)
                and with it the child; parents' devices find the grants in the child's log.
   verzeichnis: { <personId>: { role, pub } } - public keys a parent knows (family, grant recipients; EP9: invitations)
   now (ms), heute ("YYYY-MM-DD", for the grants)
   -> { bereiche: { <area>: { ok, fehler, aktion, gesendet, neu, verworfen, ohneSchluessel, inDieApp } },
        inDieApp: events written into the app's logs (the app then calls evNeuLaden), verworfen: [{ bereich, kennung, id, grund }] } */
export async function geraetAbgleichen({ ablage, zugang, personen, kinder = [], verzeichnis = {}, now, heute } = {}) {
  gabPruefen({ ablage, zugang, personen, kinder, verzeichnis, now, heute });
  const geraet = gabJson(ablage, GERAETEABGLEICH_SPEICHER.geraet, null);
  if (typeof geraet !== 'string' || !/^d_[0-9A-Za-z]{1,40}$/.test(geraet)) throw gabFehler('Geraet ohne Kennung (bq2_evDevice).');
  const o = { ablage, zugang, personen, geraet, now, heute, verzeichnis };
  const plan = [];                                                      // [area, target, anchor]
  for (const c of kinder) {
    for (const art of GAB_KIND_ARTEN) plan.push([bereichName(art, c.id), { pre: c.pre }, c.anker]);
    // the grants of this child: those in its log (parents) and those this device was invited to (teacher, admin) - the
    // area of a grant is checked against THIS child's founding parent, so a grant of another family never counts here
    const grants = new Set(gabListe(gabZiel(ablage, { pre: c.pre }).lesen()).filter((e) => gabObj(e) && gabObj(e.payload) && /^grant_/.test(e.type)).map((e) => e.payload.grant));
    for (const g of c.freigaben || []) grants.add(g);
    for (const g of [...grants].sort(gabCmp)) plan.push([bereichName('freigabe', g), { pre: c.pre }, c.anker]);
  }
  for (const pid of Object.keys(personen).sort(gabCmp)) plan.push([bereichName('person', pid), { person: pid }, { person: pid, role: personen[pid].role, pub: personen[pid].pub }]);

  const staende = gabJson(ablage, GERAETEABGLEICH_SPEICHER.staende, {});
  const out = { bereiche: {}, inDieApp: 0, verworfen: [] };
  for (const [area, ziel, anker] of plan) {
    if (out.bereiche[area]) continue;
    // the state is kept also after a storage error: holen changes it in one step only, and what was queued (own
    // events, signed) stays queued for the next time - that is how offline works
    const stand = gabObj(staende[area]) ? staende[area] : abgleichStand(area, geraet);
    const b = await gabBereich(o, area, ziel, anker, stand);
    staende[area] = stand;
    ablage.setItem(GERAETEABGLEICH_SPEICHER.staende, JSON.stringify(staende));
    out.bereiche[area] = b;
    out.inDieApp += b.inDieApp;
    out.verworfen.push(...b.verworfen);
  }
  if (out.verworfen.length) {
    const alt = gabListe(gabJson(ablage, GERAETEABGLEICH_SPEICHER.verworfen, []));
    ablage.setItem(GERAETEABGLEICH_SPEICHER.verworfen, JSON.stringify(alt.concat(out.verworfen.map((v) => ({ ...v, am: new Date(now).toISOString() }))).slice(-GERAETEABGLEICH_VERWORFEN_MAX)));
  }
  return out;
}
