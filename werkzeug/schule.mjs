// School ratings per child (S11 Stufe 1, P2, 02.11.2026). werkzeug/schuldaten.json is keyed by the login
// name (readable); the build inserts the data keyed by the account ID into the ENCRYPTED app, so the app
// assigns them by ID only. A name in the file without a child account of that name stops the build.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const MARKE = '/*BQ_SCHULE*/null';
const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const schuleDatei = (wurzel = WURZEL) => path.join(wurzel, 'werkzeug', 'schuldaten.json');

export async function schuleLesen(wurzel = WURZEL) {
  try { return JSON.parse(await fs.readFile(schuleDatei(wurzel), 'utf8')); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}

/** { <id>: data } for the given accounts (v2). Throws on a name that is not a child account. */
export function schuleNachKennung(schule, konten) {
  if (!schule || !konten) return null;
  if (schule.version !== 1 || typeof schule.kinder !== 'object') throw new Error('schuldaten.json: Version 1 mit "kinder" noetig.');
  const out = {};
  for (const [name, daten] of Object.entries(schule.kinder)) {
    const u = (konten.users || []).find((x) => x.user === name);
    if (!u || u.kind !== 'child') throw new Error(`schuldaten.json: "${name}" ist kein Kinderkonto.`);
    out[u.id] = daten;
  }
  return out;
}

export function schuleEinsetzen(app, schule, konten) {
  const text = Buffer.isBuffer(app) ? app.toString('utf8') : String(app);
  const teile = text.split(MARKE);
  if (teile.length !== 2) throw new Error(`index.html muss die Schulmarke ${MARKE} genau einmal enthalten.`);
  const daten = schuleNachKennung(schule, konten);
  return Buffer.from(teile[0] + (daten ? JSON.stringify(daten) : 'null') + teile[1], 'utf8');
}
