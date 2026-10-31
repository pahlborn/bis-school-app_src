// Accounts for the login (S3, Peter 30.10.): user + password, role "student" or "parent"/"teacher".
// Phase 1: the admin creates accounts from here; each account gets a START CODE. On the first login
// on a device the user enters name + start code and then chooses an own password (stored only on
// that device). The start code keeps working as a fallback (e.g. on a new device); it can be renewed.
//
// werkzeug/konten.json holds names, roles, assignments and only a salted PBKDF2 hash of each start
// code - never the code itself. The build inserts the list into the ENCRYPTED app (marker below).
// Start codes are shown once in the terminal and written to a file OUTSIDE the repo
// (%LOCALAPPDATA%\bis-school-app\startcodes.txt), never into chat logs or the repository.
//
//   node werkzeug/konten.mjs neu <name> <student|parent|teacher> [--kind <name>] [--admin] [--test]
//     --test: test child account (own data, "+1 day" and "reset" on the start page)
//   node werkzeug/konten.mjs code-neu <name>
//   node werkzeug/konten.mjs entfernen <name>
//   node werkzeug/konten.mjs liste
//
// Output in ASCII only (Windows console).

import fs from 'node:fs/promises';
import path from 'node:path';
import { webcrypto, randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ablageOrdner } from './schluesselablage.mjs';

export const MARKE = '/*BQ_KONTEN*/null';
export const ROLLEN = ['student', 'parent', 'teacher'];
export const ITER = 100000;
const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const kontenDatei = (wurzel = WURZEL) => path.join(wurzel, 'werkzeug', 'konten.json');
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I/L

export const normName = (s) => String(s || '').trim().toLowerCase();
export const normCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export function codeErzeugen() {
  const b = randomBytes(8); let c = '';
  for (let i = 0; i < 8; i++) c += ALPHABET[b[i] % ALPHABET.length];
  return c.slice(0, 4) + '-' + c.slice(4);
}

export async function pbkdf2Hex(text, saltBytes, iter = ITER) {
  const material = await webcrypto.subtle.importKey('raw', new TextEncoder().encode(text), 'PBKDF2', false, ['deriveBits']);
  const bits = await webcrypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new Uint8Array(saltBytes), iterations: iter }, material, 256);
  return Buffer.from(bits).toString('hex');
}

export async function kontenLesen(wurzel = WURZEL) {
  try { return JSON.parse(await fs.readFile(kontenDatei(wurzel), 'utf8')); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}

/** Checks the account list; throws on anything that would lock people out or leak codes. */
export function kontenPruefen(k) {
  if (!k || !Array.isArray(k.users) || !k.users.length) throw new Error('konten.json: keine Konten.');
  const namen = new Set();
  for (const u of k.users) {
    if (!/^[a-z0-9._-]{2,24}$/.test(u.user)) throw new Error(`Konto "${u.user}": Name 2-24 Zeichen, nur a-z 0-9 . _ -`);
    if (namen.has(u.user)) throw new Error(`Konto "${u.user}" doppelt.`);
    namen.add(u.user);
    if (!ROLLEN.includes(u.role)) throw new Error(`Konto "${u.user}": Rolle muss student, parent oder teacher sein.`);
    if (!u.start || !/^[0-9a-f]{64}$/.test(u.start.hash) || !Array.isArray(u.start.salt) || u.start.salt.length < 16) throw new Error(`Konto "${u.user}": Startcode-Hash fehlt.`);
    if ('code' in u || 'startCode' in u) throw new Error(`Konto "${u.user}": Startcode darf nicht im Klartext gespeichert sein.`);
  }
  for (const u of k.users) for (const kid of u.kinder || []) {
    const kind = k.users.find((x) => x.user === kid);
    if (!kind || kind.role !== 'student') throw new Error(`Konto "${u.user}": zugeordnetes Kind "${kid}" fehlt.`);
  }
  if (!k.users.some((u) => u.role === 'student')) throw new Error('konten.json: mindestens ein Kinderkonto noetig.');
  if (!k.users.some((u) => u.role === 'parent')) throw new Error('konten.json: mindestens ein Elternkonto noetig.');
  return k;
}

export function kontenEinsetzen(app, konten) {
  const text = Buffer.isBuffer(app) ? app.toString('utf8') : String(app);
  const teile = text.split(MARKE);
  if (teile.length !== 2) throw new Error(`index.html muss die Kontenmarke ${MARKE} genau einmal enthalten.`);
  if (!konten) return Buffer.from(text, 'utf8');
  const daten = { users: kontenPruefen(konten).users.map((u) => ({ user: u.user, role: u.role, admin: !!u.admin, ...(u.test ? { test: true } : {}), kinder: u.kinder || [], start: u.start })) };
  return Buffer.from(teile[0] + JSON.stringify(daten) + teile[1], 'utf8');
}

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

async function main() {
  // --still: do not print start codes (e.g. when run by an assistant whose output is logged)
  const still = process.argv.includes('--still');
  const [befehl, name, rolle, ...rest] = process.argv.slice(2).filter((a) => a !== '--still');
  const zeige = (text, code) => console.log(still ? text : `${text} Startcode: ${code}`);
  const datei = kontenDatei();
  const k = (await kontenLesen()) || { users: [] };
  const speichern = async () => { await fs.writeFile(datei, JSON.stringify(k, null, 2) + '\n', 'utf8'); };
  const finde = (n) => k.users.find((u) => u.user === normName(n));
  if (befehl === 'liste') {
    for (const u of k.users) console.log(`${u.user.padEnd(16)} ${u.role.padEnd(8)}${u.admin ? ' admin' : ''}${u.kinder && u.kinder.length ? '  Kinder: ' + u.kinder.join(', ') : ''}`);
    return;
  }
  if (befehl === 'neu') {
    const n = normName(name);
    if (finde(n)) throw new Error(`Konto "${n}" gibt es schon.`);
    if (!ROLLEN.includes(rolle)) throw new Error('Rolle: student, parent oder teacher');
    const u = { user: n, role: rolle };
    if (rest.includes('--admin')) u.admin = true;
    if (rest.includes('--test')) { if (rolle !== 'student') throw new Error('--test nur fuer Kinderkonten'); u.test = true; }
    const i = rest.indexOf('--kind'); if (i >= 0) u.kinder = [normName(rest[i + 1])];
    const code = await mitNeuemCode(u);
    k.users.push(u);
    if (k.users.some((x) => x.role === 'student') && k.users.some((x) => x.role === 'parent')) kontenPruefen(k);
    await speichern();
    zeige(`Konto angelegt: ${n} (${rolle}${u.admin ? ', admin' : ''}).`, code);
    console.log(`Der Startcode steht auch in: ${await codeMerken(n, code)}`);
    return;
  }
  if (befehl === 'code-neu') {
    const u = finde(name); if (!u) throw new Error(`Konto "${name}" fehlt.`);
    const code = await mitNeuemCode(u); await speichern();
    zeige(`Neuer Startcode fuer ${u.user} (der alte gilt nach dem naechsten Veroeffentlichen nicht mehr).`, code);
    console.log(`Steht auch in: ${await codeMerken(u.user, code)}`);
    return;
  }
  if (befehl === 'entfernen') {
    const u = finde(name); if (!u) throw new Error(`Konto "${name}" fehlt.`);
    k.users = k.users.filter((x) => x !== u); k.users.forEach((x) => { if (x.kinder) x.kinder = x.kinder.filter((c) => c !== u.user); });
    await speichern(); console.log(`Konto entfernt: ${u.user}`);
    return;
  }
  console.log('Befehle: neu <name> <student|parent|teacher> [--kind <name>] [--admin] | code-neu <name> | entfernen <name> | liste');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error('FEHLER: ' + e.message); process.exit(1); });
}
