// Accounts for the login. Account model v2 (S11 Stufe 1, 02.11.2026): every person has a fixed,
// random ID ("p_" + 26 characters, 128 bits). Login name and ID are separate; everything that
// belongs together (parent - child) is linked by ID only. Display names are NOT part of the
// accounts (they live in the child's profile on the device).
//
//   { "version": 2,
//     "users": [ { "id", "user", "kind": "child"|"adult", "teacher", "admin", "test", "teacherOf", "start": {salt, hash} } ],
//     "guardians": [ { "adult": "p_...", "child": "p_...", "since": "YYYY-MM-DD" } ] }
//
// "teacherOf" (IDs) is an interim field until local grants arrive (S11 P4) and then removed.
//
// werkzeug/konten.json holds only a salted PBKDF2 hash of each start code - never the code itself.
// The build inserts the list into the ENCRYPTED app (marker below). Start codes and start links are
// written to a folder OUTSIDE the repo (%LOCALAPPDATA%\bis-school-app\), never into the repository.
//
//   node werkzeug/konten.mjs neu <name> kind [--test]
//   node werkzeug/konten.mjs neu <name> erwachsen [--lehrkraft] [--admin]
//   node werkzeug/konten.mjs eltern <erwachsener> <kind>        (parent - child)
//   node werkzeug/konten.mjs eltern-entfernen <erwachsener> <kind>
//   node werkzeug/konten.mjs code-neu <name>                    (new start code)
//   node werkzeug/konten.mjs startlink <name>                   (new start code as link + QR code)
//   node werkzeug/konten.mjs entfernen <name>
//   node werkzeug/konten.mjs liste
//   node werkzeug/konten.mjs migrieren                          (v1 -> v2, once)
//   add --still to never print a start code (e.g. when run by an assistant whose output is logged)
//
// Output in ASCII only (Windows console). The QR code needs "npm install" once in werkzeug/.

import fs from 'node:fs/promises';
import path from 'node:path';
import { webcrypto, randomBytes } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ablageOrdner } from './schluesselablage.mjs';

export const MARKE = '/*BQ_KONTEN*/null';
export const ITER = 100000;
export const APP_URL = 'https://pahlborn.github.io/bis-school-app/';
const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const kontenDatei = (wurzel = WURZEL) => path.join(wurzel, 'werkzeug', 'konten.json');
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I/L
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const ID_RE = /^p_[0-9A-HJKMNP-TV-Z]{26}$/;
export const NAME_RE = /^[a-z0-9][a-z0-9.-]{2,19}$/;

export const normName = (s) => String(s || '').trim().toLowerCase();
export const normCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export function codeErzeugen() {
  const b = randomBytes(8); let c = '';
  for (let i = 0; i < 8; i++) c += ALPHABET[b[i] % ALPHABET.length];
  return c.slice(0, 4) + '-' + c.slice(4);
}

/** Random person ID: "p_" + 26 Crockford base32 characters from 128 random bits. */
export function kennungErzeugen() {
  let n = 0n; for (const x of randomBytes(16)) n = (n << 8n) | BigInt(x);
  let s = ''; for (let i = 0; i < 26; i++) { s = CROCKFORD[Number(n & 31n)] + s; n >>= 5n; }
  return 'p_' + s;
}

export async function pbkdf2Hex(text, saltBytes, iter = ITER) {
  const material = await webcrypto.subtle.importKey('raw', new TextEncoder().encode(text), 'PBKDF2', false, ['deriveBits']);
  const bits = await webcrypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new Uint8Array(saltBytes), iterations: iter }, material, 256);
  return Buffer.from(bits).toString('hex');
}

export async function kontenLesen(wurzel = WURZEL) {
  try { return JSON.parse(await fs.readFile(kontenDatei(wurzel), 'utf8')); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}

const heute = () => new Date().toISOString().slice(0, 10);

/**
 * Account list v1 (name, role student|parent|teacher, kinder by name) -> v2. Keeps the order of the
 * accounts and the start code hashes (nobody has to start over). Admin accounts do NOT become
 * parents (finding B3: the admin sees a child only with a grant). Teacher assignments become the
 * interim field teacherOf.
 */
export function ausV1(k1) {
  if (k1 && k1.version === 2) return k1;
  const users = k1.users.map((u) => ({
    id: kennungErzeugen(), user: u.user, kind: u.role === 'student' ? 'child' : 'adult',
    ...(u.role === 'teacher' ? { teacher: true } : {}), ...(u.admin ? { admin: true } : {}), ...(u.test ? { test: true } : {}),
    start: u.start
  }));
  const id = (name) => (users.find((x) => x.user === name) || {}).id;
  const guardians = [];
  k1.users.forEach((u, i) => {
    if (u.role === 'parent' && !u.admin) for (const kid of u.kinder || []) if (id(kid)) guardians.push({ adult: users[i].id, child: id(kid), since: heute() });
    if (u.role === 'teacher' && (u.kinder || []).length) users[i].teacherOf = u.kinder.map(id).filter(Boolean);
  });
  return { version: 2, users, guardians };
}

/** Checks the account list v2; throws on anything that would mix people up, lock them out or leak codes. */
export function kontenPruefen(k) {
  if (!k || k.version !== 2) throw new Error('konten.json: Version 2 noetig (node werkzeug/konten.mjs migrieren).');
  if (!Array.isArray(k.users) || !k.users.length) throw new Error('konten.json: keine Konten.');
  if (!Array.isArray(k.guardians)) throw new Error('konten.json: "guardians" fehlt.');
  const ids = new Set(), namen = new Set(), byId = new Map();
  for (const u of k.users) {
    if ('code' in u || 'startCode' in u) throw new Error(`Konto "${u.user}": Startcode darf nicht im Klartext gespeichert sein.`);
    if (!ID_RE.test(u.id || '')) throw new Error(`Konto "${u.user}": Kennung fehlt oder ungueltig.`);
    if (ids.has(u.id)) throw new Error(`Kennung ${u.id} doppelt.`);
    if (!NAME_RE.test(u.user || '')) throw new Error(`Konto "${u.user}": Anmeldename 3-20 Zeichen, nur a-z 0-9 . -`);
    if (namen.has(u.user)) throw new Error(`Anmeldename "${u.user}" doppelt.`);
    if (!['child', 'adult'].includes(u.kind)) throw new Error(`Konto "${u.user}": Art muss child oder adult sein.`);
    if (u.kind === 'child' && (u.teacher || u.admin)) throw new Error(`Konto "${u.user}": ein Kind kann nicht Lehrkraft oder Admin sein.`);
    if (u.kind === 'adult' && u.test) throw new Error(`Konto "${u.user}": nur Kinder koennen Testkonten sein.`);
    if (u.teacherOf && !u.teacher) throw new Error(`Konto "${u.user}": teacherOf nur fuer Lehrkraefte.`);
    if (!u.start || !/^[0-9a-f]{64}$/.test(u.start.hash) || !Array.isArray(u.start.salt) || u.start.salt.length < 16) throw new Error(`Konto "${u.user}": Startcode-Hash fehlt.`);
    ids.add(u.id); namen.add(u.user); byId.set(u.id, u);
  }
  const paare = new Set();
  for (const g of k.guardians) {
    const a = byId.get(g.adult), c = byId.get(g.child);
    if (!a || !c) throw new Error(`Eltern-Kind-Beziehung mit unbekannter Kennung: ${g.adult} -> ${g.child}`);
    if (a.kind !== 'adult' || c.kind !== 'child') throw new Error(`Beziehung ${a.user} -> ${c.user}: nur Erwachsener -> Kind.`);
    if (a.teacher) throw new Error(`Beziehung ${a.user} -> ${c.user}: eine Lehrkraft ist nicht zugleich Elternteil.`);
    const key = g.adult + g.child; if (paare.has(key)) throw new Error(`Beziehung ${a.user} -> ${c.user} doppelt.`); paare.add(key);
  }
  for (const u of k.users) for (const c of u.teacherOf || []) {
    if (!byId.has(c) || byId.get(c).kind !== 'child') throw new Error(`Konto "${u.user}": zugeordnetes Kind ${c} fehlt.`);
  }
  if (!k.users.some((u) => u.kind === 'child')) throw new Error('konten.json: mindestens ein Kinderkonto noetig.');
  if (!k.users.some((u) => u.kind === 'adult')) throw new Error('konten.json: mindestens ein Erwachsenenkonto noetig.');
  return k;
}

/** Inserts the checked account list v2 into the app (only names, IDs, kinds, start code hashes). */
export function kontenEinsetzen(app, konten) {
  const text = Buffer.isBuffer(app) ? app.toString('utf8') : String(app);
  const teile = text.split(MARKE);
  if (teile.length !== 2) throw new Error(`index.html muss die Kontenmarke ${MARKE} genau einmal enthalten.`);
  if (!konten) return Buffer.from(text, 'utf8');
  const k = kontenPruefen(konten);
  const daten = {
    version: 2,
    users: k.users.map((u) => ({ id: u.id, user: u.user, kind: u.kind, ...(u.teacher ? { teacher: true } : {}), ...(u.admin ? { admin: true } : {}), ...(u.test ? { test: true } : {}), ...(u.teacherOf ? { teacherOf: u.teacherOf } : {}), start: u.start })),
    guardians: k.guardians.map((g) => ({ adult: g.adult, child: g.child }))
  };
  return Buffer.from(teile[0] + JSON.stringify(daten) + teile[1], 'utf8');
}

/** Start link: the part after "#" never reaches the server; the app fills in name and code. */
export const startlink = (name, code) => `${APP_URL}#start=${encodeURIComponent(name)}.${normCode(code)}`;

async function codeMerken(name, code) {
  const datei = path.join(ablageOrdner(), 'startcodes.txt');
  await fs.mkdir(ablageOrdner(), { recursive: true });
  await fs.appendFile(datei, `${new Date().toISOString().slice(0, 16)}  ${name}  ${code}\n`, { mode: 0o600 });
  return datei;
}

async function mitNeuemCode(u) {
  const code = codeErzeugen(), salt = Array.from(randomBytes(16));
  u.start = { salt, hash: await pbkdf2Hex(normCode(code), salt) };
  return code;
}

async function qrSchreiben(name, link) {
  let QR;
  try { QR = (await import(pathToFileURL(path.join(WURZEL, 'werkzeug', 'node_modules', 'qrcode', 'lib', 'index.js')).href)).default; }
  catch (e) { throw new Error('QR-Code: einmal "npm install" im Ordner werkzeug ausfuehren.'); }
  const svg = await QR.toString(link, { type: 'svg', errorCorrectionLevel: 'M', margin: 2, width: 320 });
  await fs.mkdir(ablageOrdner(), { recursive: true });
  const datei = path.join(ablageOrdner(), `startlink-${name}.svg`);
  const html = path.join(ablageOrdner(), `startlink-${name}.html`);
  await fs.writeFile(datei, svg, { mode: 0o600 });
  await fs.writeFile(html, `<!doctype html><meta charset="utf-8"><title>Startlink ${name}</title><body style="font-family:sans-serif;text-align:center"><h1>Big Quest – Start für ${name}</h1><p>Mit der Kamera scannen oder den Link öffnen. Nur persönlich weitergeben.</p>${svg}<p><a href="${link}">${link}</a></p></body>`, { mode: 0o600 });
  return html;
}

async function main() {
  const still = process.argv.includes('--still');
  const args = process.argv.slice(2).filter((a) => a !== '--still');
  const [befehl, name, zweites, ...rest] = args;
  const zeige = (text, code) => console.log(still ? text : `${text} Startcode: ${code}`);
  const datei = kontenDatei();
  const k = (await kontenLesen()) || { version: 2, users: [], guardians: [] };
  if (befehl === 'migrieren') {
    if (k.version === 2) { console.log('konten.json ist schon Version 2.'); return; }
    await fs.mkdir(ablageOrdner(), { recursive: true });
    const bak = path.join(ablageOrdner(), 'konten.v1.bak.json');
    await fs.writeFile(bak, JSON.stringify(k, null, 2) + '\n', { mode: 0o600 });
    const v2 = kontenPruefen(ausV1(k));
    await fs.writeFile(datei, JSON.stringify(v2, null, 2) + '\n', 'utf8');
    console.log(`konten.json auf Version 2 umgestellt (${v2.users.length} Konten, ${v2.guardians.length} Eltern-Kind-Beziehungen). Alte Fassung: ${bak}`);
    return;
  }
  if (k.version !== 2) throw new Error('konten.json ist noch Version 1: zuerst "node werkzeug/konten.mjs migrieren".');
  const speichern = async () => { kontenPruefen(k); await fs.writeFile(datei, JSON.stringify(k, null, 2) + '\n', 'utf8'); };
  const finde = (n) => k.users.find((u) => u.user === normName(n));
  const muss = (n) => { const u = finde(n); if (!u) throw new Error(`Konto "${n}" fehlt.`); return u; };
  if (befehl === 'liste') {
    for (const u of k.users) {
      const kinder = k.guardians.filter((g) => g.adult === u.id).map((g) => k.users.find((x) => x.id === g.child)?.user);
      const merkmale = [u.kind === 'child' ? 'Kind' : 'Erwachsen', u.teacher && 'Lehrkraft', u.admin && 'Admin', u.test && 'Testkind'].filter(Boolean).join(', ');
      console.log(`${u.user.padEnd(14)} ${merkmale.padEnd(24)} ${u.id.slice(0, 10)}...${kinder.length ? '  Kinder: ' + kinder.join(', ') : ''}`);
    }
    return;
  }
  if (befehl === 'neu') {
    const n = normName(name);
    if (finde(n)) throw new Error(`Konto "${n}" gibt es schon.`);
    if (!['kind', 'erwachsen'].includes(zweites)) throw new Error('Art: kind oder erwachsen');
    const u = { id: kennungErzeugen(), user: n, kind: zweites === 'kind' ? 'child' : 'adult' };
    while (k.users.some((x) => x.id === u.id)) u.id = kennungErzeugen();
    if (rest.includes('--lehrkraft')) u.teacher = true;
    if (rest.includes('--admin')) u.admin = true;
    if (rest.includes('--test')) u.test = true;
    const code = await mitNeuemCode(u);
    k.users.push(u); await speichern();
    zeige(`Konto angelegt: ${n} (${zweites}${u.teacher ? ', Lehrkraft' : ''}${u.admin ? ', Admin' : ''}${u.test ? ', Testkind' : ''}).`, code);
    console.log(`Der Startcode steht auch in: ${await codeMerken(n, code)}`);
    return;
  }
  if (befehl === 'eltern' || befehl === 'eltern-entfernen') {
    const a = muss(name), c = muss(zweites);
    if (befehl === 'eltern') {
      if (k.guardians.some((g) => g.adult === a.id && g.child === c.id)) { console.log('Beziehung besteht schon.'); return; }
      k.guardians.push({ adult: a.id, child: c.id, since: heute() });
    } else k.guardians = k.guardians.filter((g) => !(g.adult === a.id && g.child === c.id));
    await speichern(); console.log(`${befehl === 'eltern' ? 'Beziehung angelegt' : 'Beziehung entfernt'}: ${a.user} -> ${c.user}`);
    return;
  }
  if (befehl === 'code-neu' || befehl === 'startlink') {
    const u = muss(name);
    const code = await mitNeuemCode(u); await speichern();
    await codeMerken(u.user, code);
    if (befehl === 'code-neu') { zeige(`Neuer Startcode fuer ${u.user} (der alte gilt nach dem naechsten Veroeffentlichen nicht mehr).`, code); console.log(`Steht auch in: ${path.join(ablageOrdner(), 'startcodes.txt')}`); return; }
    const link = startlink(u.user, code);
    const html = await qrSchreiben(u.user, link);
    console.log(`Neuer Startcode fuer ${u.user} als Link und QR-Code (der alte gilt nach dem naechsten Veroeffentlichen nicht mehr).`);
    if (!still) console.log(`Startlink: ${link}`);
    console.log(`QR-Code und Link zum Oeffnen/Zeigen: ${html}`);
    return;
  }
  if (befehl === 'entfernen') {
    const u = muss(name);
    k.users = k.users.filter((x) => x !== u);
    k.guardians = k.guardians.filter((g) => g.adult !== u.id && g.child !== u.id);
    k.users.forEach((x) => { if (x.teacherOf) { x.teacherOf = x.teacherOf.filter((c) => c !== u.id); if (!x.teacherOf.length) delete x.teacherOf; } });
    await speichern(); console.log(`Konto entfernt: ${u.user} (Kennung wird nie wieder vergeben)`);
    return;
  }
  console.log('Befehle: neu <name> kind [--test] | neu <name> erwachsen [--lehrkraft] [--admin] | eltern <erwachsener> <kind> | eltern-entfernen <erwachsener> <kind> | code-neu <name> | startlink <name> | entfernen <name> | liste | migrieren   (--still: Startcode nie anzeigen)');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error('FEHLER: ' + e.message); process.exit(1); });
}
