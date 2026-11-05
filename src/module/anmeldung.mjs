// Module anmeldung - helpers of the login screens with accounts in the storage (stage 3b, task "Anmeldung im Testbau";
// concept 10.2, 10.3, 10.6). Test build only (module.json: bau "test", after konto). Pure functions: no screen, no
// browser storage, no clock. The screens are in index.html (KONTO_UI), the accounts themselves in module konto.
//
//   Start link (US9.2): <address>#start=<login name>/<start code>[/<fingerprint>]
//     start code = 22 characters base64url (module konto); fingerprint = the issuer's 6 words (krypto.keyFingerprint),
//     optional - the QR code of task "Einladungen" carries it. "/" never occurs in a name, a code or a fingerprint.
//     The app reads the link once and removes it from the address (browser history).
//   Recovery code in the password manager (concept 10.6): an own entry with the user name "<name> (Wiederherstellungscode)"
//     (EN "(recovery code)") - so it never replaces the login entry "<name>". When the password manager fills that entry
//     into "Forgot your password?", anmNameAusEintrag gives back the login name.
//   Recovery code as a file: anmCodeDatei (text for the share menu / download).
//   Device list: the accounts that logged in on this device [{ id, user, art }] (device data, never synced). The app
//     turns it into accounts v2 like konten.json (anmGeraetKonten -> rechte.normAccounts); children, parents and grants
//     come with task "Einladungen".
//   Guides: anmPunkteErsetzen swaps single points of a guide (<li><b>Label</b> ...</li>) for the login with accounts.
//   The way to the storage and the accounts: index.html calls only this module (anmZugang, anmVersuch, anmErstesMal,
//     anmWiederherstellen, anmName ...), never konto or github directly - so the live build, which has none of these
//     modules, does not even name their functions (search in tests/module/konto.test.mjs).
//
// Names: every helper starts with "anm"/"ANM_" because all modules and index.html share one scope in the app.

//   Task "Einladungen - Oberflaeche" (05.11.): the screens for invitations, devices and new keys call these helpers too
//     (anmAbgleich, anmKindAnlegen, anmElternEinladen, anmKindNeu, anmZurueckziehen, anmGeraete, anmGeraetEntfernen,
//     anmErneuern, anmKindBereit, anmQr ...) - thin wrappers of modules einladung, geraete, konto and qrcode.

import { KONTO_ARTEN, kontoName, kontoLookup, ersteAnmeldung, anmelden, wiederherstellen, schluesselErneuern, kontoFingerabdruck } from './konto.mjs';
import { githubSpeicher, githubTokenLesen, githubTokenSpeichern } from './github.mjs';
import { verbindungen, kindAnlegen, elternteilEinladen, kindPasswortNeu, einladungZurueckziehen, abgleichMitVerbindungen, anmeldenameVorschlag, kindLokalEntfernen } from './einladung.mjs';
import { meineGeraete, geraetEntfernen } from './geraete.mjs';
import { GERAETEABGLEICH_SPEICHER } from './geraeteabgleich.mjs';
import { bereichName, schluesselLesen } from './bereiche.mjs';
import { zulassungAus, aktiveMitglieder } from './zulassung.mjs';
import { qrSvg } from './qrcode.mjs';
import { kindDatenExport, kindDatenLoeschen, kontoDatenLoeschen } from './kinddaten.mjs';
import { deriveSchool } from './ableitung.mjs';

/* a start code as module konto issues it: 16 random bytes, base64url */
export const ANM_STARTCODE = /^[A-Za-z0-9_-]{22}$/;
/* the second user name of the recovery code in the password manager (one entry per language) */
export const ANM_EINTRAG = Object.freeze({ de: ' (Wiederherstellungscode)', en: ' (recovery code)' });

const anmFp = (t) => (typeof t === 'string' && /^[a-z]+(-[a-z]+){5}$/i.test(t) ? t : null);
const anmPid = (x) => typeof x === 'string' && /^p_[0-9A-Za-z]{1,40}$/.test(x);
const anmEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* is this typed text a start code (and not a password)? A start code is random; the form of the app's password suggestion
   ("Judo-Anchor-Key-2947": words, dashes, a number - 15 % of them have 22 characters) is never taken for one. */
export function anmIstStartcode(text) {
  if (typeof text !== 'string') return false;
  const t = text.trim();
  return ANM_STARTCODE.test(t) && !/^[A-Za-z]+(-[A-Za-z]+)*-\d+$/.test(t);
}

/* "#start=<name>/<code>[/<fingerprint>]" -> { anmeldename, code, fingerabdruck (or null) }; anything else -> null */
export function anmStartlinkLesen(hash) {
  const m = /^#start=([^/]+)\/([A-Za-z0-9_-]{22})(?:\/([^/]+))?$/.exec(String(hash === undefined || hash === null ? '' : hash));
  if (!m) return null;
  let name;
  try { name = decodeURIComponent(m[1]); } catch (e) { return null; }
  const n = kontoName(name);
  if (!n) return null;
  const fp = m[3] === undefined ? null : anmFp(m[3]);
  if (m[3] !== undefined && !fp) return null;
  return { anmeldename: n, code: m[2], fingerabdruck: fp };
}

/* the start link for a start code (tool, later the screen of task "Einladungen") */
export function anmStartlink(adresse, { anmeldename, code, fingerabdruck = null } = {}) {
  const n = kontoName(anmeldename);
  if (!n || typeof code !== 'string' || !ANM_STARTCODE.test(code)) throw new Error('anmeldung: Name oder Startcode ungueltig.');
  if (fingerabdruck !== null && !anmFp(fingerabdruck)) throw new Error('anmeldung: Fingerabdruck ungueltig.');
  return String(adresse || '').split('#')[0] + '#start=' + encodeURIComponent(n) + '/' + code + (fingerabdruck ? '/' + fingerabdruck : '');
}

/* user name of the recovery code's own entry in the password manager */
export function anmCodeEintrag(anmeldename, sprache = 'de') {
  return String(anmeldename) + (sprache === 'en' ? ANM_EINTRAG.en : ANM_EINTRAG.de);
}
/* typed or filled-in user name -> the login name (without the recovery entry's addition, trimmed, small letters) */
export function anmNameAusEintrag(text) {
  let t = String(text === undefined || text === null ? '' : text).trim();
  for (const z of Object.values(ANM_EINTRAG)) if (t.toLowerCase().endsWith(z.toLowerCase())) t = t.slice(0, t.length - z.length).trim();
  return t.toLowerCase();
}

/* the recovery code as a file to share or keep: { name, text } (datum: "YYYY-MM-DD") */
export function anmCodeDatei({ anmeldename, code, datum, sprache = 'de' } = {}) {
  const n = kontoName(anmeldename);
  if (!n || typeof code !== 'string' || !code) throw new Error('anmeldung: Name oder Code fehlt.');
  const de = sprache !== 'en';
  const text = de ? [
    'Big Quest - Wiederherstellungscode',
    '',
    'Anmeldename: ' + n,
    'Wiederherstellungscode: ' + code,
    'Erstellt am: ' + datum,
    '',
    'Wofuer: Passwort vergessen? Auf der Anmeldeseite "Passwort vergessen?" tippen, Anmeldename und diesen Code eingeben',
    'und ein neues Passwort waehlen. Danach zeigt die App einen neuen Code - dieser hier gilt dann nicht mehr.',
    'Sicher aufbewahren und nicht weitergeben.'
  ] : [
    'Big Quest - recovery code',
    '',
    'Login name: ' + n,
    'Recovery code: ' + code,
    'Created on: ' + datum,
    '',
    'What for: forgot your password? On the login page tap "Forgot your password?", enter your login name and this code',
    'and choose a new password. Then the app shows a new code - this one no longer works.',
    'Keep it safe and do not share it.'
  ];
  return { name: (de ? 'Big-Quest-Wiederherstellungscode-' : 'Big-Quest-recovery-code-') + n + '.txt', text: text.join('\n') + '\n' };
}

/* ---------- accounts on this device ---------- */
/* the entry of an opened account (module konto) for the device list */
export function anmEintragAus(konto) {
  return { id: konto.kennung, user: konto.anmeldename, art: konto.art };
}
/* checked device list: only well-formed entries, one per id and per name (the later one wins) */
export function anmListe(liste) {
  const out = [];
  for (const e of Array.isArray(liste) ? liste : []) {
    if (!e || typeof e !== 'object' || !anmPid(e.id) || kontoName(e.user) !== e.user || !KONTO_ARTEN.includes(e.art)) continue;
    for (let i = out.length - 1; i >= 0; i--) if (out[i].id === e.id || out[i].user === e.user) out.splice(i, 1);
    out.push({ id: e.id, user: e.user, art: e.art });
  }
  return out;
}
/* the device list with this entry (replaces an entry with the same id or name) */
export function anmListeMit(liste, eintrag) {
  return anmListe([...anmListe(liste), eintrag]);
}
/* device list -> accounts v2 as in konten.json (without start codes: they are in the storage); rechte.normAccounts
   derives role, admin and children. No guardians yet (task "Einladungen"). */
export function anmGeraetKonten(liste) {
  return {
    version: 2,
    users: anmListe(liste).map((e) => ({ id: e.id, user: e.user, kind: e.art === 'child' ? 'child' : 'adult', ...(e.art === 'teacher' ? { teacher: true } : {}), ...(e.art === 'admin' ? { admin: true } : {}) })),
    guardians: []
  };
}

/* ---------- storage and accounts (the only way of index.html to modules konto and github) ---------- */
/* the access of this device to the storage of the accounts.
   speicher: KONTO_SPEICHER of the app - a storage with geraet() (tests: the simulation) or { art: 'github', repo, wurzel,
   basis? } (test instance); ablage: the browser storage (access key: GITHUB_TOKEN_SCHLUESSEL); geraet: the device id; fetch: for GitHub.
   -> the access, or null (no storage; test instance without access key) */
export function anmZugang(speicher, { ablage, geraet, fetch } = {}) {
  if (speicher && typeof speicher.geraet === 'function') return speicher.geraet(geraet);
  if (speicher && speicher.art === 'github') {
    const token = githubTokenLesen(ablage);
    if (!token) return null;
    return githubSpeicher({ repo: speicher.repo, token, wurzel: speicher.wurzel || '', ...(speicher.basis ? { basis: speicher.basis } : {}), ...(fetch ? { fetch } : {}) }).geraet(geraet);
  }
  return null;
}
/* does this device still need the access key of the test storage? */
export function anmTokenNoetig(speicher, ablage) {
  return !!speicher && speicher.art === 'github' && !githubTokenLesen(ablage);
}
/* stores the access key (trimmed); a broken one -> error (without the value) */
export function anmTokenSpeichern(ablage, token) {
  githubTokenSpeichern(ablage, token);
}
/* login name as module konto compares it, or null */
export const anmName = (text) => kontoName(text);
/* the login form: user name + password or start code.
   -> { erstesMal: { anmeldename, code } } when it is a start code for a name without an account (first login: the person
      chooses a password next), else { konto } (module konto: anmelden; wrong name or password -> error "anmeldung") */
export async function anmVersuch({ zugang, anmeldename, text }) {
  const n = kontoName(anmeldename), code = String(text === undefined || text === null ? '' : text).trim();
  if (n && anmIstStartcode(code) && (await zugang.directory(await kontoLookup(n))) === null) return { erstesMal: { anmeldename: n, code } };
  try {
    return { konto: await anmelden({ zugang, anmeldename, passwort: text }) };
  } catch (err) {
    // a child's "new password" (task "Einladungen"): its account exists, the start code is not its password - the start
    // code itself decides next (konto.ersteAnmeldung: a wrong one -> "startcode-ungueltig")
    if (err && err.code === 'anmeldung' && n && anmIstStartcode(code)) return { erstesMal: { anmeldename: n, code } };
    throw err;
  }
}
/* first login with the start code (module konto: ersteAnmeldung); fingerabdruck only if the QR code / link had one */
export function anmErstesMal({ zugang, code, passwort, fingerabdruck = null, now }) {
  return ersteAnmeldung({ zugang, code, passwort, now, ...(fingerabdruck ? { fingerabdruck } : {}) });
}
/* "Forgot your password?" (module konto: wiederherstellen) */
export function anmWiederherstellen({ zugang, anmeldename, code, neuesPasswort }) {
  return wiederherstellen({ zugang, anmeldename, code, neuesPasswort });
}

/* ---------- invitations, devices, new keys (task "Einladungen - Oberflaeche") ---------- */
/* one sync of this device with everything its opened accounts are connected to (module einladung) */
export function anmAbgleich({ ablage, zugang, konten, now, heute, geraetName, inDieApp = true }) {
  return abgleichMitVerbindungen({ ablage, zugang, konten, now, heute, inDieApp, ...(geraetName ? { geraetName } : {}) });
}
/* families, children, other parents, open invitations of an opened account (from the logs on this device) */
export const anmVerbindungen = ({ ablage, konto, now }) => verbindungen({ ablage, konto, now });
/* a free login name for a child's first name */
export const anmNameVorschlag = ({ zugang, anzeigename }) => anmeldenameVorschlag({ zugang, anzeigename });
/* start QR code for a new child / invitation of the second parent / new password of a child / withdraw */
export const anmKindAnlegen = ({ zugang, ablage, konto, anmeldename, anzeigename, now }) => kindAnlegen({ zugang, ablage, konto, anmeldename, anzeigename, now });
export const anmElternEinladen = ({ zugang, ablage, konto, anmeldename, now }) => elternteilEinladen({ zugang, ablage, konto, anmeldename, now });
export const anmKindNeu = ({ zugang, ablage, konto, kind, now }) => kindPasswortNeu({ zugang, ablage, konto, kind, now });
export const anmZurueckziehen = ({ zugang, ablage, konto, id, now }) => einladungZurueckziehen({ zugang, ablage, konto, id, now });
/* "Meine Geraete" and "Geraet entfernen" (module geraete) */
export const anmGeraete = ({ ablage, person, now }) => meineGeraete({ ablage, person, now });
export const anmGeraetEntfernen = (o) => geraetEntfernen(o);
/* "Schluessel erneuern" (grown-ups: current and a new password) */
export const anmErneuern = ({ zugang, anmeldename, passwort, neuesPasswort }) => schluesselErneuern({ zugang, anmeldename, passwort, neuesPasswort });
/* the 6 words of public keys (shown next to a QR code: the other side compares them) */
export const anmFingerabdruck = (pub) => kontoFingerabdruck(pub);
/* the QR code of a start link as SVG */
export const anmQr = (text, titel) => qrSvg(text, { ecc: 'M', rand: 4, titel });
/* may a child practise on this device? Only once a parent's device took it in: the child holds the current key of its
   learning area (concept 10.3; before that its events would come before the device is registered there). Reads the key
   entries of that area once (one request). -> true / false; a storage error -> false (try again later) */
export async function anmKindBereit({ ablage, zugang, konto, now }) {
  if (!konto || konto.art !== 'child') return true;
  const k = verbindungen({ ablage, konto, now }).kinder.find((c) => c.id === konto.kennung);
  if (!k) return false;
  const area = bereichName('kind:lern', konto.kennung);
  let st = null;
  try { st = JSON.parse(ablage.getItem(GERAETEABGLEICH_SPEICHER.staende) || '{}')[area]; } catch (e) { st = null; }
  const log = st && Array.isArray(st.log) ? st.log : [];
  try {
    const zul = await zulassungAus(log, { area, anker: k.anker, now });
    const s = await schluesselLesen(zugang, area, { ich: konto.kennung, meineSchluessel: konto.schluessel, mitglieder: aktiveMitglieder(zul) });
    return !!(s.aktuell && s.keys.has(s.aktuell));
  } catch (err) {
    if (err && typeof err.code === 'string') return false;
    throw err;
  }
}

/* ---------- the sync in the app (task "Abgleich in der App"; concept 9.1, 9.4) ---------- */
const anmStaende = (ablage) => { try { const s = JSON.parse(ablage.getItem(GERAETEABGLEICH_SPEICHER.staende) || '{}'); return s && typeof s === 'object' && !Array.isArray(s) ? s : {}; } catch (e) { return {}; } };
const anmEvents = (st) => (st && Array.isArray(st.log) ? st.log.map((x) => x && x.event).filter((e) => e && typeof e === 'object' && e.payload && typeof e.payload === 'object') : []);
/* entries this device dropped while syncing (kept once, module geraeteabgleich) that the grown-ups are told of as a
   number: only forgeries and entries without the right to write them (Peter, 05.11., from #139) - never the harmless
   ones of the order of things (an author or device whose admission comes later, e.g. right after "Schluessel erneuern";
   an older stand) or of a newer app version (a format this one does not know yet).
     forged:          unterschrift, eintrag-passt-nicht, entschluesseln, geraet-fremd
     without a right: nicht-mitglied, rolle-darf-nicht, bereich-falsch, nach-entfernung (a removed device, old keys),
                      geraet-nicht-angemeldet from a device that was removed (the bundle "<device>/<n>" of a device with a
                      device_removed this device knows - depending on the order the admission drops a removed device's
                      entry with this reason before the check for nach-entfernung; found in the full test run, 05.11.)
   -> count */
export const ANM_VERWORFEN_ZAEHLT = Object.freeze(['unterschrift', 'eintrag-passt-nicht', 'entschluesseln', 'geraet-fremd', 'nicht-mitglied', 'rolle-darf-nicht', 'bereich-falsch', 'nach-entfernung']);
export function anmVerworfen(ablage) {
  try {
    const l = JSON.parse(ablage.getItem(GERAETEABGLEICH_SPEICHER.verworfen) || '[]');
    if (!Array.isArray(l)) return 0;
    const entfernt = new Set();
    for (const st of Object.values(anmStaende(ablage))) for (const e of anmEvents(st)) if (e.type === 'device_removed' && typeof e.payload.device === 'string') entfernt.add(e.payload.device);
    const vomEntfernten = (v) => v.grund === 'geraet-nicht-angemeldet' && typeof v.kennung === 'string' && entfernt.has(v.kennung.split('/')[0]);
    return l.filter((v) => v && typeof v === 'object' && (ANM_VERWORFEN_ZAEHLT.includes(v.grund) || vomEntfernten(v))).length;
  } catch (e) { return 0; }
}
/* was this device removed (module geraete: device_removed with its id in an area it knows)? */
export function anmGeraetEntfernt({ ablage }) {
  let g = null;
  try { g = JSON.parse(ablage.getItem(GERAETEABGLEICH_SPEICHER.geraet) || 'null'); } catch (e) { g = null; }
  if (typeof g !== 'string') return false;
  return Object.values(anmStaende(ablage)).some((st) => anmEvents(st).some((e) => e.type === 'device_removed' && e.payload.device === g));
}
/* a removed device where somebody logs in again starts as a new device: the states of the sync belonged to the old
   device id (the app sets the new id itself) */
export function anmGeraetNeu({ ablage }) {
  ablage.setItem(GERAETEABGLEICH_SPEICHER.staende, '{}');
}
/* is the storage of this app version one with accounts at all? Only a storage that can tell (module github: verbunden)
   is asked - one request; an error of the storage -> not "foreign" (the normal messages say what is wrong) */
export async function anmSpeicherFremd(zugang) {
  if (!zugang || typeof zugang.verbunden !== 'function') return false;
  try { return !(await zugang.verbunden()); } catch (err) { if (err && typeof err.code === 'string') return false; throw err; }
}

/* ---------- task "Familienfassung bauen" (preparation of stage 4): export, deletion, school ratings ---------- */
/* all data of a child (module kinddaten, US12.1) -> { daten, json, html, dateiname: { json, html } } */
export const anmKindExport = ({ ablage, konto, kind, now, heute, sprache }) => kindDatenExport({ ablage, konto, kind, now, heute, sprache });
/* delete a child of the family (US12.2) - storage and this device; the app deletes its recordings itself */
export const anmKindLoeschen = ({ ablage, zugang, konto, kind, now, heute, geraetName }) => kindDatenLoeschen({ ablage, zugang, konto, kind, now, heute, ...(geraetName ? { geraetName } : {}) });
/* delete the own account of a parent, with his password (US12.2) */
export const anmKontoLoeschen = ({ ablage, zugang, konto, passwort, now, heute, geraetName }) => kontoDatenLoeschen({ ablage, zugang, konto, passwort, now, heute, ...(geraetName ? { geraetName } : {}) });
/* what this device holds of a child whose areas are gone from the storage (module einladung) */
export const anmKindLokalEntfernen = ({ ablage, kind }) => kindLokalEntfernen({ ablage, kind });
/* the school ratings of a child from its log (area schule, school_import; module ableitung) - or null. The family build
   has no SCHOOL_DATA: a child's ratings come into its account (werkzeug/schulbewertungen-uebernehmen.mjs). */
export const anmSchule = (events, now) => deriveSchool(events, { now });

/* ---------- guides ---------- */
/* replaces whole points "<li><b>Label</b> ...</li>" (or <p>) of a guide: ersatz = [[label, new text after the label]].
   A label that is missing is an error - a changed guide must not keep a wrong point silently. */
export function anmPunkteErsetzen(text, ersatz) {
  let t = String(text);
  for (const [label, neu] of ersatz) {
    const re = new RegExp('<(li|p)><b>' + anmEsc(label) + '</b>[\\s\\S]*?</\\1>');
    if (!re.test(t)) throw new Error('anmeldung: Punkt "' + label + '" nicht gefunden.');
    t = t.replace(re, (_, tag) => '<' + tag + '><b>' + label + '</b> ' + neu + '</' + tag + '>');
  }
  return t;
}
