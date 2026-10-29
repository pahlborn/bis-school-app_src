// Baut dist/ aus der Klartext-App: verschluesselte Huelle, neutrales Manifest,
// Icons. Fragt nichts ab - das Passwort kommt vom Aufrufer (verschluesseln.mjs
// fragt es verdeckt ab, die Tests geben ein Testpasswort).
//
// Bricht ab, bevor etwas geschrieben wird, wenn
//  - das Passwort zu kurz ist,
//  - ausserhalb des verschluesselten Blocks ein verbotenes Wort steht,
//  - die Probe-Entschluesselung nicht Byte fuer Byte die App ergibt.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  passwortPruefen, verschluesseln, entschluesseln, huelleBauen, tresorAusHuelle,
  ohneTresor, woerterLesen, verboteneTreffer, unb64
} from './kern.mjs';

export const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const QUELLEN = {
  app: 'index.html',
  vorlage: 'werkzeug/huelle.html',
  manifest: 'werkzeug/manifest.webmanifest',
  salz: 'werkzeug/salz.json',
  woerter: 'werkzeug/verbotene-woerter.txt'
};

export const ICONS = ['icon-180.png', 'icon-192.png', 'icon-512.png'];

export async function quellenLesen(wurzel = WURZEL) {
  const lies = (rel, enc) => fs.readFile(path.join(wurzel, rel), enc);
  const salz = JSON.parse(await lies(QUELLEN.salz, 'utf8'));
  const salt = unb64(salz.salt || '');
  if (salt.length < 16) throw new Error(`${QUELLEN.salz}: Salt fehlt oder ist kuerzer als 16 Bytes.`);
  return {
    app: await lies(QUELLEN.app),
    vorlage: await lies(QUELLEN.vorlage, 'utf8'),
    manifest: await lies(QUELLEN.manifest, 'utf8'),
    salt,
    woerter: woerterLesen(await lies(QUELLEN.woerter, 'utf8'))
  };
}

/**
 * Prueft die oeffentlichen Teile (Huelle ohne Tresor, Manifest) auf verbotene
 * Woerter und gibt die Treffer als "Datei: Wort" zurueck.
 */
export function oeffentlichPruefen(html, manifest, woerter) {
  return [
    ...verboteneTreffer(ohneTresor(html), woerter).map((w) => `index.html: "${w}"`),
    ...verboteneTreffer(manifest, woerter).map((w) => `manifest.webmanifest: "${w}"`)
  ];
}

export async function distBauen(passwort, { wurzel = WURZEL, ziel = path.join(wurzel, 'dist') } = {}) {
  passwortPruefen(passwort);
  const q = await quellenLesen(wurzel);
  if (q.woerter.length === 0) throw new Error(`${QUELLEN.woerter} ist leer - ohne Liste prueft der Lauf nichts.`);

  const tresor = await verschluesseln(q.app, passwort, q.salt);
  const html = huelleBauen(q.vorlage, tresor);

  const treffer = oeffentlichPruefen(html, q.manifest, q.woerter);
  if (treffer.length) {
    throw new Error('Verbotene Woerter im oeffentlichen Teil, nichts geschrieben: ' + treffer.join(', '));
  }

  const zurueck = await entschluesseln(tresorAusHuelle(html), passwort);
  if (!Buffer.from(zurueck).equals(q.app)) {
    throw new Error('Probe-Entschluesselung ergibt nicht die App, nichts geschrieben.');
  }

  await fs.mkdir(ziel, { recursive: true });
  await fs.writeFile(path.join(ziel, 'index.html'), html, 'utf8');
  await fs.writeFile(path.join(ziel, 'manifest.webmanifest'), q.manifest, 'utf8');
  for (const icon of ICONS) await fs.copyFile(path.join(wurzel, icon), path.join(ziel, icon));

  return { ziel, dateien: ['index.html', 'manifest.webmanifest', ...ICONS], appBytes: q.app.length, huelleBytes: Buffer.byteLength(html) };
}
