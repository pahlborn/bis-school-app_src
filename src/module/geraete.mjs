// Module geraete - "Meine Geraete" and "Geraet entfernen" without a screen (preparation of stage 4, task "Neuer Schluessel
// und Meine Geraete", part b; US9.7, concept 8.4, 10.2, 10.3). Test build only (module.json: bau "test", after einladung).
// No screen, no timer, no clock, no network of its own: device storage, storage access, opened account, time are passed in.
//
//   meineGeraete: the devices of one person (oneself, or - for a parent - a child of the family), from the signed
//     admission events this device holds (module geraeteabgleich keeps them per area): device_added (first time, name),
//     device_removed, and the newest event the person wrote on it ("zuletzt" = last sync with something new).
//   geraetEntfernen: notes the device to remove on this device (bq_geraetEntfernen); the next sync (module einladung
//     abgleichMitVerbindungen -> geraeteabgleich) writes device_removed into every area where it is registered and changes
//     the key there (key_rotated names the device - module abgleich drops whatever it sends afterwards).
//     - a grown-up's own device: at once a NEW person key (module konto schluesselErneuern - current and new password),
//       otherwise the removed device would open the new versions with its copy of the old key (concept 8.4)
//     - a child's device (a parent removes it): the child's areas change their key; the parents are told to give the
//       child a new password (passwortNeu) - until then the removed device still holds the child's key
//     A removed device does not register itself again (module geraeteabgleich, decision 3b-2b).
//
// Errors: Error with err.code - one of GERAETE_FEHLER, or a code of module konto (anmeldung, passwort-schwach, ...).
// Names: every helper starts with "ger"/"GER_" because all modules and index.html share one scope in the app.

import { GERAETEABGLEICH_SPEICHER } from './geraeteabgleich.mjs';
import { schluesselErneuern } from './konto.mjs';
import { verbindungen } from './einladung.mjs';

/* error codes of this module */
export const GERAETE_FEHLER = Object.freeze(['nicht-erlaubt', 'geraet-unbekannt']);

const gerObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const gerPid = (x) => typeof x === 'string' && /^p_[0-9A-Za-z]{1,40}$/.test(x);
const gerDid = (x) => typeof x === 'string' && /^d_[0-9A-Za-z]{1,40}$/.test(x);
const gerMs = (x) => { const t = typeof x === 'string' ? Date.parse(x) : NaN; return Number.isFinite(t) ? t : null; };
function gerFehler(code) { const e = new Error('geraete: ' + code); e.code = code; return e; }
function gerFalsch(text) { return new Error('geraete: ' + text); }
function gerJson(ablage, k, d) {
  const v = ablage.getItem(k);
  if (v === null || v === undefined) return d;
  try { return JSON.parse(v); } catch (e) { return d; }
}
function gerAblage(ablage) {
  if (!gerObj(ablage) || typeof ablage.getItem !== 'function' || typeof ablage.setItem !== 'function') throw gerFalsch('ablage (getItem/setItem) fehlt.');
}
const gerIso = (ms) => (ms === null ? null : new Date(ms).toISOString());

/* the devices of "person" as this device knows them, oldest first:
   -> [{ geraet, name (label of device_added or null), erstesMal, zuletzt, entfernt (ISO or null), wartet (removal noted
        here, not synced yet), diesesGeraet }] */
export function meineGeraete({ ablage, person, now } = {}) {
  gerAblage(ablage);
  if (!gerPid(person)) throw gerFalsch('person fehlt.');
  if (!Number.isFinite(now)) throw gerFalsch('"now" fehlt.');
  const dieses = gerJson(ablage, GERAETEABGLEICH_SPEICHER.geraet, null);
  const staende = gerJson(ablage, GERAETEABGLEICH_SPEICHER.staende, {});
  const g = new Map(), ereignisse = [];
  for (const st of Object.values(gerObj(staende) ? staende : {})) {
    if (!gerObj(st) || !Array.isArray(st.log)) continue;
    for (const x of st.log) if (gerObj(x) && gerObj(x.event) && gerObj(x.event.payload) && gerMs(x.event.at) !== null) ereignisse.push(x.event);
  }
  for (const e of ereignisse) {
    if (e.type !== 'device_added' || e.author !== person || !gerDid(e.payload.device)) continue;
    const t = gerMs(e.at), d = g.get(e.payload.device) || { geraet: e.payload.device, name: null, erst: t, hinzu: t, weg: null, zuletzt: t };
    if (t < d.erst) d.erst = t;
    if (t >= d.hinzu) { d.hinzu = t; if (typeof e.payload.label === 'string' && e.payload.label) d.name = e.payload.label; }
    if (!d.name && typeof e.payload.label === 'string' && e.payload.label) d.name = e.payload.label;
    g.set(d.geraet, d);
  }
  for (const e of ereignisse) {
    const t = gerMs(e.at);
    if (e.type === 'device_removed' && g.has(e.payload.device)) { const d = g.get(e.payload.device); if (d.weg === null || t > d.weg) d.weg = t; }
    if (e.author === person && g.has(e.device)) { const d = g.get(e.device); if (t > d.zuletzt) d.zuletzt = t; }
  }
  const offen = new Set((Array.isArray(gerJson(ablage, GERAETEABGLEICH_SPEICHER.entfernen, [])) ? gerJson(ablage, GERAETEABGLEICH_SPEICHER.entfernen, []) : []).filter((x) => gerObj(x) && x.person === person).map((x) => x.geraet));
  return [...g.values()].sort((a, b) => (a.erst - b.erst) || (a.geraet < b.geraet ? -1 : 1)).map((d) => {
    const entfernt = d.weg !== null && d.weg >= d.hinzu ? gerIso(d.weg) : null;
    return { geraet: d.geraet, name: d.name, erstesMal: gerIso(d.erst), zuletzt: gerIso(d.zuletzt), entfernt, wartet: !entfernt && offen.has(d.geraet), diesesGeraet: d.geraet === dieses };
  });
}

/* removes a device of "person" (default: the account itself). konto = the opened account on this device.
   - own device of a grown-up: passwort (current) and neuesPasswort are needed - the key is renewed at once
   - a child's device: only a parent of the family; no password
   This very device cannot be removed (that is "Abmelden").
   -> { konto: the renewed account with alt (grown-up; the app syncs with it and drops alt once erneuerungOffen is empty)
        or null, wiederherstellungscode, fingerabdruck (grown-up: new; else null), passwortNeu (child: give it a new
        password, module einladung kindPasswortNeu) } - the device is removed with the next sync */
export async function geraetEntfernen({ ablage, zugang, konto, person, geraet, passwort, neuesPasswort, now, runden, rand } = {}) {
  gerAblage(ablage);
  if (!gerObj(konto) || !gerPid(konto.kennung) || typeof konto.art !== 'string' || !gerObj(konto.schluessel)) throw gerFalsch('geoeffnetes Konto erwartet.');
  if (!Number.isFinite(now)) throw gerFalsch('"now" fehlt.');
  const wer = person === undefined || person === null ? konto.kennung : person;
  if (!gerPid(wer) || !gerDid(geraet)) throw gerFehler('geraet-unbekannt');
  if (geraet === gerJson(ablage, GERAETEABGLEICH_SPEICHER.geraet, null)) throw gerFehler('nicht-erlaubt');
  let kind = false;
  if (wer !== konto.kennung) {
    // a parent removes a device of a child of his family; nobody removes another grown-up's device
    if (konto.art !== 'parent' || !verbindungen({ ablage, konto, now }).kinder.some((c) => c.id === wer)) throw gerFehler('nicht-erlaubt');
    kind = true;
  } else if (konto.art === 'child') throw gerFehler('nicht-erlaubt');   // a child's devices: its parents
  const d = meineGeraete({ ablage, person: wer, now }).find((x) => x.geraet === geraet);
  if (!d || d.entfernt) throw gerFehler('geraet-unbekannt');
  let neu = null;
  if (!kind) {
    neu = await schluesselErneuern({ zugang, anmeldename: konto.anmeldename, passwort, neuesPasswort, ...(runden !== undefined ? { runden } : {}), ...(rand ? { rand } : {}) });
    neu = { ...konto, ...neu };                                         // keeps what the app knows of the account (familie, anker ...)
  }
  const liste = gerJson(ablage, GERAETEABGLEICH_SPEICHER.entfernen, []), l = Array.isArray(liste) ? liste.filter(gerObj) : [];
  if (!l.some((x) => x.person === wer && x.geraet === geraet)) l.push({ person: wer, geraet, am: new Date(now).toISOString() });
  ablage.setItem(GERAETEABGLEICH_SPEICHER.entfernen, JSON.stringify(l));
  return { konto: neu, wiederherstellungscode: neu ? neu.wiederherstellungscode : null, fingerabdruck: neu ? neu.fingerabdruck : null, passwortNeu: kind };
}
