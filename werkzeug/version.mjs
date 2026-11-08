// Version of the app, set automatically at build time (S7, 30.10.2026).
//
// Source of truth: package.json version
//   0.148.0-beta  -> visible as "V 0.148 (Betaversion)"
//   0.148.1-beta  -> visible as "V 0.148.1 (Betaversion)"
//   1.0.0         -> visible as "V 1.0.0"
//
// Added build metadata from git:
//   hash  first 7 characters of the commit
//   date  build time, Europe/Berlin, "DD.MM.YYYY HH:MM"
//   draft true if the working tree has uncommitted changes (shown as " - Entwurf")
//
// The values are inserted into the app before encryption, i.e. only inside the encrypted
// vault. The public shell and manifest never contain them.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const MARKE = '/*BQ_VERSION*/null';
export const VERSION_DATEI = 'package.json';
const VERSION_RE = /^(\d+)\.(\d+)\.(\d+)(?:-(beta))?$/;
const KANAL_ORDNUNG = { beta: 0, final: 1 };

function git(wurzel, args) {
  return execFileSync('git', args, { cwd: wurzel, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function versionsQuelleLesen(wurzel) {
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(path.join(wurzel, VERSION_DATEI), 'utf8'));
  } catch {
    throw new Error(`Version nicht ermittelbar (${VERSION_DATEI} fehlt oder ist unlesbar) - nichts geschrieben.`);
  }
  const roh = String(pkg && pkg.version || '').trim();
  const m = VERSION_RE.exec(roh);
  if (!m) throw new Error(`Version nicht ermittelbar (${VERSION_DATEI}: erwartet x.y.z oder x.y.z-beta) - nichts geschrieben.`);
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]), kanal: m[4] || 'final' };
}

export function berlinZeit(d = new Date()) {
  const t = Object.fromEntries(new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(d).map((p) => [p.type, p.value]));
  return `${t.day}.${t.month}.${t.year} ${t.hour}:${t.minute}`;
}

export function versionRoh(v) {
  const basis = `${v.major}.${v.minor}.${v.patch}`;
  return v.kanal === 'beta' ? basis + '-beta' : basis;
}

export function versionNummer(v) {
  return v.kanal === 'beta' && v.patch === 0 ? `${v.major}.${v.minor}` : `${v.major}.${v.minor}.${v.patch}`;
}

export function versionText(v, { sprache = 'de', mitEntwurf = true } = {}) {
  const beta = v.kanal === 'beta' ? (sprache === 'en' ? ' (Beta version)' : ' (Betaversion)') : '';
  const entwurf = mitEntwurf && v.draft ? (sprache === 'en' ? ' - draft' : ' - Entwurf') : '';
  return `V ${versionNummer(v)}${beta}${entwurf}`;
}

export function versionVergleich(a, b) {
  for (const [x, y] of [[a.major, b.major], [a.minor, b.minor], [a.patch, b.patch], [KANAL_ORDNUNG[a.kanal], KANAL_ORDNUNG[b.kanal]]]) {
    if (x < y) return -1;
    if (x > y) return 1;
  }
  return 0;
}

export const versionReleaseGleich = (a, b) => !!a && !!b && versionVergleich(a, b) === 0;
export const versionQuelleGleich = (a, b) => versionReleaseGleich(a, b) && a.hash === b.hash && !!a.draft === !!b.draft;
export const versionStandGleich = (a, b) => versionQuelleGleich(a, b) && a.date === b.date;
export const versionIstNeuer = (a, b) => !!a && !!b && (versionVergleich(a, b) > 0 || (versionReleaseGleich(a, b) && !!a.hash && !!b.hash && a.hash !== b.hash));
export const versionKennung = (v) => `${versionRoh(v)}${v.hash ? '-' + v.hash : ''}`;

export function versionErmitteln(wurzel, jetzt = new Date()) {
  let voll, status;
  const quelle = versionsQuelleLesen(wurzel);
  try {
    voll = git(wurzel, ['rev-parse', 'HEAD']);
    status = git(wurzel, ['status', '--porcelain', '--untracked-files=no']);
  } catch (e) {
    throw new Error('Version nicht ermittelbar (kein Git-Repo oder git fehlt) - nichts geschrieben.');
  }
  if (!/^[0-9a-f]{40}$/.test(voll)) throw new Error('Version nicht ermittelbar - nichts geschrieben.');
  return { ...quelle, hash: voll.slice(0, 7), date: berlinZeit(jetzt), draft: status !== '' };
}

/** Inserts the version into the app (Buffer or string); the marker must occur exactly once. */
export function versionEinsetzen(app, v) {
  const text = Buffer.isBuffer(app) ? app.toString('utf8') : String(app);
  const teile = text.split(MARKE);
  if (teile.length !== 2) throw new Error(`index.html muss die Versionsmarke ${MARKE} genau einmal enthalten.`);
  const json = JSON.stringify({ major: v.major, minor: v.minor, patch: v.patch, kanal: v.kanal, hash: v.hash, date: v.date, draft: !!v.draft });
  return Buffer.from(teile[0] + json + teile[1], 'utf8');
}

/** Reads the version back out of a (decrypted) app; null if none was inserted. */
export function versionAuslesen(appText) {
  const m = String(appText).match(/const APP_VERSION=(\{[^}]*\});/);
  return m ? JSON.parse(m[1]) : null;
}
