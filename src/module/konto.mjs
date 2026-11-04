// Module konto - accounts without names in the storage (stage 3b, task "Konto-Modul"; concept 8.2, 10.2, 10.3, 10.6,
// 11, 12; US9.1-US9.4). Test build only (module.json: bau "test", after geraeteabgleich). No screen, no browser storage,
// no clock, no network of its own: it talks to the storage only through the access handed in (module speicher or github).
//
//   Directory (US9.1): an account lies under a hash of the login name with a fixed app salt (kontoLookup), never under
//   the name. Entry 1 is the account, created once - a second account with the same name -> "name-vergeben":
//     { v: 1, lookup, kennung, art, pub, gesperrt }
//   gesperrt = krypto.lockPersonKeys: the person keys locked with the password (locks[0]) and, for grown-ups, a second
//   time with the recovery code (locks[1]); 600 000 rounds in the app. A new password (US9.4) is one more entry
//   "<lookup>-<n>" (n = 2, 3, ...), also created once and signed by the person:
//     { v: 1, lookup: "<lookup>-<n>", stand: n, kennung, pub, gesperrt, sig }
//   The valid entry with the largest n counts; a broken or foreign one is skipped. The keys stay the same (same pub).
//   Start code (US9.2): one-time, 7 days. An invitation in the storage (invite) under a hash of the code; its content
//   (login name, person id, kind of account, issuer) is encrypted with a key from the code and signed by the issuer -
//   the admin for grown-ups, a parent for children (only the very first admin is issued without an issuer, by the tool).
//   Login on a new device (US9.3): directory -> newest entry -> open with the password -> keys checked against pub. A
//   wrong name and a wrong password give the same error after the same work (one PBKDF2). Registering the device
//   (device_added) and fetching the areas is the work of module geraeteabgleich (kontoPersonen hands it the person).
//   Recovery code (US9.4, grown-ups only): opens the keys, sets a new password, and there is a new code at once; the old
//   password and the old code no longer open the account in the app.
//
// Errors: Error with err.code - one of KONTO_FEHLER, or a storage error passed on (offline, zugang, limit, ...).
// Wrong use (missing access, clock, ...) throws a plain Error without code.
// Names: every helper starts with "kto"/"KTO_" because all modules and index.html share one scope in the app.

import { PBKDF2_ROUNDS, bytesToB64, b64ToBytes, sealEntry, openEntryText, pbkdf2Bits, newPersonKeys, publicKeysOf, lockPersonKeys, unlockPersonKeys, keyFingerprint, signBytes, verifyBytes, newAreaKey, wrapKeyFor, unwrapKey } from './krypto.mjs';
import { pwWeak } from './passwort.mjs';

/* kinds of account (the roles of the events) */
export const KONTO_ARTEN = Object.freeze(['child', 'parent', 'teacher', 'admin']);
/* who issues start codes for whom (concept 10.6): the admin for grown-ups, a parent for its children */
export const KONTO_AUSSTELLER = Object.freeze({ admin: Object.freeze(['parent', 'teacher', 'admin']), parent: Object.freeze(['child']) });
/* error codes of this module (storage errors keep their own code) */
export const KONTO_FEHLER = Object.freeze(['anmeldung', 'name-ungueltig', 'name-vergeben', 'passwort-schwach', 'startcode-ungueltig', 'startcode-abgelaufen', 'nicht-erlaubt', 'konflikt']);
/* a start code is valid this long (concept 10.6) */
export const KONTO_STARTCODE_MS = 7 * 24 * 3600 * 1000;
/* fixed app salt of the directory hash (not secret; it only keeps the hashes apart from any other use) */
export const KONTO_SALZ = 'bq-verzeichnis-1|Yk3vQ8rT2mZp6wN4';
/* login names as in konten.json (werkzeug/konten.mjs NAME_RE) */
export const KONTO_NAME = /^[a-z0-9][a-z0-9.-]{2,19}$/;
/* at most this many directory entries of one account are read (new passwords) */
export const KONTO_STAENDE_MAX = 64;
/* a lock with more rounds than this is refused (it would freeze the app) */
export const KONTO_RUNDEN_MAX = 10 * PBKDF2_ROUNDS;

const KTO_TE = new TextEncoder();
const KTO_CODE = /^[A-Za-z0-9_-]{22}$/;                         // start code: 16 random bytes, base64url
const KTO_REC_ZEICHEN = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';        // recovery code: no 0/O, 1/I/L
const KTO_REC_LAENGE = 20;                                         // 5 groups of 4, about 99 bits
const KTO_CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ktoRand = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));
const ktoObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const ktoStr = (x) => typeof x === 'string' && x.length > 0;
const ktoPid = (x) => typeof x === 'string' && /^p_[0-9A-Za-z]{1,40}$/.test(x);
const ktoPub = (p) => ktoObj(p) && Object.keys(p).length === 2 && ktoStr(p.ecdh) && ktoStr(p.ecdsa);
const ktoGleichePub = (a, b) => ktoPub(a) && ktoPub(b) && a.ecdh === b.ecdh && a.ecdsa === b.ecdsa;

function ktoFehler(code) {
  const e = new Error('konto: ' + code);
  e.code = code;
  return e;
}
function ktoFalsch(text) { return new Error('konto: ' + text); }

/* canonical JSON (keys sorted): what is signed */
function ktoKanon(x) {
  if (x === null || typeof x !== 'object') return JSON.stringify(x);
  if (Array.isArray(x)) return '[' + x.map(ktoKanon).join(',') + ']';
  return '{' + Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => JSON.stringify(k) + ':' + ktoKanon(x[k])).join(',') + '}';
}
async function ktoSha(text) { return new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', KTO_TE.encode(text))); }
const ktoHex = (u8) => Array.from(u8, (b) => b.toString(16).padStart(2, '0')).join('');
const ktoB64url = (u8) => bytesToB64(u8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function ktoZugang(zugang) {
  if (!ktoObj(zugang) || typeof zugang.directory !== 'function' || typeof zugang.putDirectory !== 'function' || !ktoObj(zugang.invite) || typeof zugang.invite.get !== 'function' || typeof zugang.invite.put !== 'function' || typeof zugang.invite.delete !== 'function') throw ktoFalsch('zugang (directory, putDirectory, invite) fehlt.');
}
function ktoRunden(runden) {
  if (!Number.isInteger(runden) || runden < 1 || runden > KONTO_RUNDEN_MAX) throw ktoFalsch('runden ungueltig.');
}

/* ---------- names, ids, codes ---------- */
/* login name as it is compared (trimmed, small letters); null if it can never be a login name */
export function kontoName(anmeldename) {
  const n = String(anmeldename === undefined || anmeldename === null ? '' : anmeldename).normalize('NFC').trim().toLowerCase();
  return KONTO_NAME.test(n) ? n : null;
}
/* the directory key of a login name: "v" + SHA-256 (salt and name) as hex; the name itself is never stored */
export async function kontoLookup(anmeldename) {
  const n = kontoName(anmeldename);
  if (!n) throw ktoFehler('name-ungueltig');
  return 'v' + ktoHex(await ktoSha('bq-verzeichnis|' + KONTO_SALZ + '|' + n));
}
/* a new person id: "p_" + 26 Crockford characters from 128 random bits (like werkzeug/konten.mjs) */
export function kontoKennung(rand = ktoRand) {
  let n = 0n;
  for (const b of rand(16)) n = (n << 8n) | BigInt(b);
  let s = '';
  for (let i = 0; i < 26; i++) { s = KTO_CROCKFORD[Number(n & 31n)] + s; n >>= 5n; }
  return 'p_' + s;
}
/* a new recovery code "ABCD-EFGH-JKMN-PQRS-TUVW" (no 0/O, 1/I/L) */
function ktoNeuerCode(rand) {
  let s = '';
  while (s.length < KTO_REC_LAENGE) {
    for (const b of rand(KTO_REC_LAENGE)) if (b < 248 && s.length < KTO_REC_LAENGE) s += KTO_REC_ZEICHEN[b % 31];   // 248 = 8 x 31: no bias
  }
  return s.match(/.{4}/g).join('-');
}
/* a typed recovery code -> the form it was locked with; null if it cannot be one */
function ktoCodeForm(code) {
  const c = String(code === undefined || code === null ? '' : code).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (c.length !== KTO_REC_LAENGE || [...c].some((z) => !KTO_REC_ZEICHEN.includes(z))) return null;
  return c.match(/.{4}/g).join('-');
}
/* start code -> invitation id and key */
async function ktoStart(code) {
  const id = 's' + ktoHex(await ktoSha('bq-start-id|' + code));
  const key = await globalThis.crypto.subtle.importKey('raw', await ktoSha('bq-start-key|' + code), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  return { id, key, aad: KTO_TE.encode('bq-start|' + id) };
}

/* ---------- directory entries ---------- */
function ktoGesperrtOk(g, kennung, pub, art) {
  return ktoObj(g) && g.v === 1 && g.person === kennung && ktoGleichePub(g.pub, pub) && Array.isArray(g.locks) && g.locks.length === (art === 'child' ? 1 : 2)
    && g.locks.every((l) => ktoObj(l) && ktoStr(l.salt) && Number.isInteger(l.rounds) && ktoObj(l.box) && ktoStr(l.box.iv) && ktoStr(l.box.ct));
}
function ktoEintragOk(e, lookup) {
  return ktoObj(e) && e.v === 1 && e.lookup === lookup && ktoPid(e.kennung) && KONTO_ARTEN.includes(e.art) && ktoPub(e.pub) && ktoGesperrtOk(e.gesperrt, e.kennung, e.pub, e.art);
}
const ktoNachtragText = (e) => 'bq-konto-stand|' + ktoKanon({ lookup: e.lookup, stand: e.stand, kennung: e.kennung, pub: e.pub, gesperrt: e.gesperrt });
async function ktoNachtragOk(e, basis, n) {
  if (!ktoObj(e) || e.v !== 1 || e.lookup !== basis.lookup + '-' + n || e.stand !== n || e.kennung !== basis.kennung || !ktoGleichePub(e.pub, basis.pub)) return false;
  if (!ktoGesperrtOk(e.gesperrt, basis.kennung, basis.pub, basis.art) || !ktoStr(e.sig)) return false;
  return verifyBytes(basis.pub, ktoNachtragText(e), e.sig);
}
/* the lock that counts now -> { stand, gesperrt, naechster } (naechster = first free entry number, null if none left) */
async function ktoAktuell(zugang, basis) {
  let aktuell = { stand: 1, gesperrt: basis.gesperrt }, n = 2;
  for (; n <= KONTO_STAENDE_MAX; n++) {
    const e = await zugang.directory(basis.lookup + '-' + n);
    if (e === null) break;
    if (await ktoNachtragOk(e, basis, n)) aktuell = { stand: n, gesperrt: e.gesperrt };
  }
  return { ...aktuell, naechster: n <= KONTO_STAENDE_MAX ? n : null };
}

/* the same work as opening a lock, for a name that does not exist (same time for a wrong name and a wrong password) */
async function ktoBlind(geheimnis, runden) {
  await pbkdf2Bits(String(geheimnis === undefined || geheimnis === null ? '' : geheimnis), new Uint8Array(16), runden);
}
/* do the private keys belong to pub? (a lock someone put into the storage with other keys is refused) */
async function ktoPasst(keys, kennung, pub) {
  try {
    const sig = await signBytes(keys, 'bq-konto-probe|' + kennung);
    if (!(await verifyBytes(pub, 'bq-konto-probe|' + kennung, sig))) return false;
    const k = await newAreaKey();
    await unwrapKey(await wrapKeyFor(k, { id: kennung, pub }, 'konto-probe', 1), keys, kennung, 'konto-probe', 1);
    return true;
  } catch (e) { return false; }
}
/* opens lock number "nr" (0 = password, 1 = recovery code) -> keys or null. A lock below "runden" rounds or above
   KONTO_RUNDEN_MAX is refused (after the same work, so it takes the same time). */
async function ktoOeffnen(gesperrt, kennung, pub, nr, geheimnis, runden, exportierbar = false) {
  const l = gesperrt.locks[nr];
  if (!l || l.rounds < runden || l.rounds > KONTO_RUNDEN_MAX) { await ktoBlind(geheimnis, runden); return null; }
  let keys;
  try { keys = await unlockPersonKeys({ ...gesperrt, locks: [l] }, kennung, String(geheimnis), { exportierbar }); } catch (e) { return null; }
  return (await ktoPasst(keys, kennung, pub)) ? keys : null;
}
/* writes a new lock as entry "naechster", signed with the (open) keys */
async function ktoNeuerStand(zugang, basis, naechster, gesperrt, keys) {
  if (naechster === null) throw ktoFehler('konflikt');
  const e = { v: 1, lookup: basis.lookup + '-' + naechster, stand: naechster, kennung: basis.kennung, pub: { ...basis.pub }, gesperrt };
  e.sig = await signBytes(keys, ktoNachtragText(e));
  try { await zugang.putDirectory(e); } catch (err) { throw err && err.code === 'vorhanden' ? ktoFehler('konflikt') : err; }
  return naechster;
}
const ktoKonto = (e, n, schluessel, stand) => ({ kennung: e.kennung, art: e.art, anmeldename: n, pub: { ...e.pub }, schluessel, stand });

/* ---------- start code (US9.2) ---------- */
/* issues a one-time start code for a new account.
   aussteller: the opened account of the issuer ({ kennung, art, pub, schluessel }, from anmelden / ersteAnmeldung);
               null only for the very first admin (issued by the tool)
   -> { code, kennung, anmeldename, art, gueltigBis } - the code goes into the start link / QR code, never into the storage */
export async function startcodeAusstellen({ zugang, aussteller = null, anmeldename, art, now, rand = ktoRand } = {}) {
  ktoZugang(zugang);
  if (!Number.isFinite(now)) throw ktoFalsch('"now" fehlt.');
  if (!KONTO_ARTEN.includes(art)) throw ktoFehler('nicht-erlaubt');
  if (aussteller === null ? art !== 'admin' : !(ktoObj(aussteller) && (KONTO_AUSSTELLER[aussteller.art] || []).includes(art))) throw ktoFehler('nicht-erlaubt');
  if (aussteller !== null && (!ktoPid(aussteller.kennung) || !ktoPub(aussteller.pub) || !ktoObj(aussteller.schluessel))) throw ktoFalsch('aussteller braucht kennung, art, pub, schluessel.');
  const n = kontoName(anmeldename);
  if (!n) throw ktoFehler('name-ungueltig');
  if ((await zugang.directory(await kontoLookup(n))) !== null) throw ktoFehler('name-vergeben');
  const code = ktoB64url(rand(16)), kennung = kontoKennung(rand), gueltigBis = now + KONTO_STARTCODE_MS;
  const inhalt = { v: 1, anmeldename: n, kennung, art, ausgestellt: now, gueltigBis, aussteller: aussteller === null ? null : { kennung: aussteller.kennung, art: aussteller.art, pub: { ...aussteller.pub } } };
  const sig = aussteller === null ? null : await signBytes(aussteller.schluessel, 'bq-start|' + ktoKanon(inhalt));
  const s = await ktoStart(code);
  const sealed = await sealEntry(s.key, JSON.stringify({ inhalt, sig }), s.aad, rand);
  await zugang.invite.put(s.id, { v: 1, iv: sealed.iv, ct: sealed.ct }, { gueltigMs: KONTO_STARTCODE_MS });
  return { code, kennung, anmeldename: n, art, gueltigBis };
}

/* opens the content of an invitation; null if it is not a valid start code */
async function ktoStartLesen(s, gespeichert) {
  let x;
  try { x = JSON.parse(await openEntryText(s.key, gespeichert, s.aad)); } catch (e) { return null; }
  const i = ktoObj(x) ? x.inhalt : null;
  if (!ktoObj(i) || i.v !== 1 || kontoName(i.anmeldename) !== i.anmeldename || !ktoPid(i.kennung) || !KONTO_ARTEN.includes(i.art) || !Number.isFinite(i.ausgestellt) || i.gueltigBis !== i.ausgestellt + KONTO_STARTCODE_MS) return null;
  if (i.aussteller === null) return i.art === 'admin' && x.sig === null ? i : null;
  const a = i.aussteller;
  if (!ktoObj(a) || !ktoPid(a.kennung) || !ktoPub(a.pub) || !(KONTO_AUSSTELLER[a.art] || []).includes(i.art) || !ktoStr(x.sig)) return null;
  return (await verifyBytes(a.pub, 'bq-start|' + ktoKanon(i), x.sig)) ? i : null;
}

/* ---------- first login with the start code ---------- */
/* code + own password -> new person keys, account in the directory, the start code is used up.
   runden: PBKDF2 rounds of the locks (the app: 600 000; tests pass fewer); rand: randomness (tests).
   -> { kennung, art, anmeldename, pub, schluessel (not extractable), stand: 1, wiederherstellungscode (grown-ups; else null),
        aussteller: null | { kennung, art, pub, fingerabdruck } }
   If the storage fails after the code was fetched, the code is put back (still valid until its end). If an earlier try
   with this code created the account but the answer got lost, the same code and password finish it (with a new
   recovery code, since the first one was never shown). */
export async function ersteAnmeldung({ zugang, code, passwort, now, runden = PBKDF2_ROUNDS, rand = ktoRand } = {}) {
  ktoZugang(zugang); ktoRunden(runden);
  if (!Number.isFinite(now)) throw ktoFalsch('"now" fehlt.');
  if (typeof code !== 'string' || !KTO_CODE.test(code)) throw ktoFehler('startcode-ungueltig');
  if (typeof passwort !== 'string' || pwWeak(passwort)) throw ktoFehler('passwort-schwach');
  const s = await ktoStart(code);
  let gespeichert;
  try {
    gespeichert = await zugang.invite.get(s.id);
  } catch (err) {
    if (err && err.code === 'unbekannt') throw ktoFehler('startcode-ungueltig');
    if (err && err.code === 'abgelaufen') { try { await zugang.invite.delete(s.id); } catch (e) { /* stays until the next try */ } throw ktoFehler('startcode-abgelaufen'); }
    throw err;
  }
  const inhalt = await ktoStartLesen(s, gespeichert);
  if (!inhalt) throw ktoFehler('startcode-ungueltig');
  if (now >= inhalt.gueltigBis) throw ktoFehler('startcode-abgelaufen');
  // put the code back when this try ends without an account (password too weak, storage gone)
  const zurueck = async () => { try { await zugang.invite.put(s.id, gespeichert, { gueltigMs: Math.min(KONTO_STARTCODE_MS, inhalt.gueltigBis - now) }); } catch (e) { /* then a new code is needed */ } };
  if (pwWeak(passwort, inhalt.anmeldename)) { await zurueck(); throw ktoFehler('passwort-schwach'); }
  const aussteller = inhalt.aussteller === null ? null : { ...inhalt.aussteller, fingerabdruck: await keyFingerprint(inhalt.aussteller.pub) };
  try {
    const lookup = await kontoLookup(inhalt.anmeldename), kennung = inhalt.kennung, art = inhalt.art;
    const wcode = art === 'child' ? null : ktoNeuerCode(rand);
    const neu = await newPersonKeys(), pub = await publicKeysOf(neu);
    const gesperrt = await lockPersonKeys(neu, kennung, wcode ? [passwort, wcode] : [passwort], { rounds: runden, rand });
    const eintrag = { v: 1, lookup, kennung, art, pub, gesperrt };
    try {
      await zugang.putDirectory(eintrag);
    } catch (err) {
      if (!err || err.code !== 'vorhanden') throw err;
      // the name is taken: by an earlier try with this very code (same person id) - or by somebody else
      const da = await zugang.directory(lookup);
      if (!ktoEintragOk(da, lookup) || da.kennung !== kennung) throw ktoFehler('name-vergeben');
      const akt = await ktoAktuell(zugang, da);
      const offen = await ktoOeffnen(akt.gesperrt, kennung, da.pub, 0, passwort, runden, true);
      if (!offen) throw ktoFehler('name-vergeben');
      const wneu = da.art === 'child' ? null : ktoNeuerCode(rand);
      const g2 = await lockPersonKeys(offen, kennung, wneu ? [passwort, wneu] : [passwort], { rounds: runden, rand });
      const stand = await ktoNeuerStand(zugang, da, akt.naechster, g2, offen);
      const schluessel = await ktoOeffnen(g2, kennung, da.pub, 0, passwort, runden);
      return { ...ktoKonto(da, inhalt.anmeldename, schluessel, stand), wiederherstellungscode: wneu, aussteller };
    }
    // the device keeps a copy that cannot be exported: open the lock just written (this also proves it opens)
    const schluessel = await ktoOeffnen(gesperrt, kennung, pub, 0, passwort, runden);
    if (!schluessel) throw ktoFalsch('Schloss laesst sich nicht oeffnen.');
    return { ...ktoKonto(eintrag, inhalt.anmeldename, schluessel, 1), wiederherstellungscode: wcode, aussteller };
  } catch (err) {
    if (!err || err.code !== 'name-vergeben') await zurueck();
    throw err;
  }
}

/* ---------- login on a new device (US9.3) ---------- */
/* login name + password -> { kennung, art, anmeldename, pub, schluessel (not extractable), stand }.
   Wrong name and wrong password: the same error "anmeldung" after the same work. */
export async function anmelden({ zugang, anmeldename, passwort, runden = PBKDF2_ROUNDS } = {}) {
  ktoZugang(zugang); ktoRunden(runden);
  const n = kontoName(anmeldename);
  if (!n || typeof passwort !== 'string' || !passwort) throw ktoFehler('anmeldung');
  const lookup = await kontoLookup(n);
  const e = await zugang.directory(lookup);
  if (!ktoEintragOk(e, lookup)) {
    // the same requests and the same work as for a wrong password (the second directory read looks for a new password)
    await zugang.directory(lookup + '-2');
    await ktoBlind(passwort, runden);
    throw ktoFehler('anmeldung');
  }
  const akt = await ktoAktuell(zugang, e);
  const schluessel = await ktoOeffnen(akt.gesperrt, e.kennung, e.pub, 0, passwort, runden);
  if (!schluessel) throw ktoFehler('anmeldung');
  return ktoKonto(e, n, schluessel, akt.stand);
}

/* ---------- recovery code (US9.4) ---------- */
/* grown-ups: login name + recovery code + new password -> the account with a NEW recovery code (show it at once).
   A child has no recovery code (its parent gives a new start code - task "Einladungen"). */
export async function wiederherstellen({ zugang, anmeldename, code, neuesPasswort, runden = PBKDF2_ROUNDS, rand = ktoRand } = {}) {
  ktoZugang(zugang); ktoRunden(runden);
  const n = kontoName(anmeldename), form = ktoCodeForm(code);
  if (!n || !form) throw ktoFehler('anmeldung');
  if (typeof neuesPasswort !== 'string' || pwWeak(neuesPasswort, n)) throw ktoFehler('passwort-schwach');
  const lookup = await kontoLookup(n);
  const e = await zugang.directory(lookup);
  if (!ktoEintragOk(e, lookup) || e.art === 'child') { await zugang.directory(lookup + '-2'); await ktoBlind(form, runden); throw ktoFehler('anmeldung'); }
  const akt = await ktoAktuell(zugang, e);
  const offen = await ktoOeffnen(akt.gesperrt, e.kennung, e.pub, 1, form, runden, true);
  if (!offen) throw ktoFehler('anmeldung');
  const wcode = ktoNeuerCode(rand);
  const gesperrt = await lockPersonKeys(offen, e.kennung, [neuesPasswort, wcode], { rounds: runden, rand });
  const stand = await ktoNeuerStand(zugang, e, akt.naechster, gesperrt, offen);
  const schluessel = await ktoOeffnen(gesperrt, e.kennung, e.pub, 0, neuesPasswort, runden);
  return { ...ktoKonto(e, n, schluessel, stand), wiederherstellungscode: wcode };
}

/* ---------- for module geraeteabgleich ---------- */
/* an opened account -> the "personen" entry of geraetAbgleichen: { <kennung>: { role, keys, pub } } */
export function kontoPersonen(...konten) {
  const out = {};
  for (const k of konten) {
    if (!ktoObj(k) || !ktoPid(k.kennung) || !KONTO_ARTEN.includes(k.art) || !ktoObj(k.schluessel) || !ktoPub(k.pub)) throw ktoFalsch('geoeffnetes Konto erwartet.');
    out[k.kennung] = { role: k.art, keys: k.schluessel, pub: { ...k.pub } };
  }
  return out;
}
