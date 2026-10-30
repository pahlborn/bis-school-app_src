// Version of the app, set automatically at build time (S7, 30.10.2026).
//
//   v<N>  N = number of commits on the first-parent line of the private source repo
//         (every merged PR raises it by one; the same commit always gives the same N)
//   hash  first 7 characters of the commit
//   date  build time, Europe/Berlin, "DD.MM.YYYY HH:MM"
//   draft true if the working tree has uncommitted changes (shown as "-entwurf")
//
// The values are inserted into the app before encryption, i.e. only inside the encrypted
// vault. The public shell and manifest never contain them.

import { execFileSync } from 'node:child_process';

export const MARKE = '/*BQ_VERSION*/null';

function git(wurzel, args) {
  return execFileSync('git', args, { cwd: wurzel, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

export function berlinZeit(d = new Date()) {
  const t = Object.fromEntries(new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(d).map((p) => [p.type, p.value]));
  return `${t.day}.${t.month}.${t.year} ${t.hour}:${t.minute}`;
}

export function versionErmitteln(wurzel, jetzt = new Date()) {
  let n, voll, status;
  try {
    n = Number(git(wurzel, ['rev-list', '--count', '--first-parent', 'HEAD']));
    voll = git(wurzel, ['rev-parse', 'HEAD']);
    status = git(wurzel, ['status', '--porcelain', '--untracked-files=no']);
  } catch (e) {
    throw new Error('Version nicht ermittelbar (kein Git-Repo oder git fehlt) - nichts geschrieben.');
  }
  if (!Number.isInteger(n) || n < 1 || !/^[0-9a-f]{40}$/.test(voll)) throw new Error('Version nicht ermittelbar - nichts geschrieben.');
  return { n, hash: voll.slice(0, 7), date: berlinZeit(jetzt), draft: status !== '' };
}

export const versionText = (v) => 'v' + v.n + (v.draft ? '-entwurf' : '');

/** Inserts the version into the app (Buffer or string); the marker must occur exactly once. */
export function versionEinsetzen(app, v) {
  const text = Buffer.isBuffer(app) ? app.toString('utf8') : String(app);
  const teile = text.split(MARKE);
  if (teile.length !== 2) throw new Error(`index.html muss die Versionsmarke ${MARKE} genau einmal enthalten.`);
  const json = JSON.stringify({ n: v.n, hash: v.hash, date: v.date, draft: !!v.draft });
  return Buffer.from(teile[0] + json + teile[1], 'utf8');
}

/** Reads the version back out of a (decrypted) app; null if none was inserted. */
export function versionAuslesen(appText) {
  const m = String(appText).match(/const APP_VERSION=(\{[^}]*\});/);
  return m ? JSON.parse(m[1]) : null;
}
