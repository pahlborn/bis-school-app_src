// Baut dist/ aus der Klartext-App: verschluesselte Huelle, neutrales Manifest,
// Icons. Fragt nichts ab - Passwort oder gemerkter Schluessel kommen vom
// Aufrufer (verschluesseln.mjs, die Tests geben ein Testpasswort).
//
// Bricht ab, bevor etwas geschrieben wird, wenn
//  - das Passwort zu kurz ist,
//  - ausserhalb des verschluesselten Blocks ein verbotenes Wort steht,
//  - die Probe-Entschluesselung nicht Byte fuer Byte die App ergibt,
//  - die Version nicht ermittelbar ist oder im oeffentlichen Teil auftauchen wuerde,
//  - die Schrift-Marke fehlt oder die App noch etwas von Google Fonts laedt (werkzeug/schriften.mjs).
//
// Die Version (S7) wird vor dem Verschluesseln in die App eingesetzt, steht also nur im
// Tresor. Ohne Angabe wird sie aus dem Git-Stand dieses Repos ermittelt.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  passwortPruefen, schluesselAusPasswort, schluesselAusRoh, schluesselRoh, verschluesselnMitSchluessel,
  entschluesseln, entschluesselnMitSchluessel, huelleBauen, tresorAusHuelle,
  ohneTresor, woerterLesen, verboteneTreffer, unb64
} from './kern.mjs';
import { versionErmitteln, versionEinsetzen, versionAuslesen, versionText } from './version.mjs';
import { kontenLesen, kontenEinsetzen } from './konten.mjs';
import { schuleLesen, schuleEinsetzen } from './schule.mjs';
import { moduleEinsetzen } from './module.mjs';
import { TESTINSTANZ, ersatzLesen, testinstanzUmwandeln, testinstanzManifest, testinstanzPruefen } from './testinstanz.mjs';
import { FAMILIE, familieUmwandeln, familiePruefen } from './familie.mjs';
import { schriftenLesen, schriftenEinsetzen, schriftenPruefen } from './schriften.mjs';

/** The app as it goes into the vault: version, accounts (S3/S11), school data by ID (S11 P2) and the embedded fonts
 *  (werkzeug/schriften.mjs - nothing is loaded from Google Fonts any more). */
export function appZusammensetzen(app, version, konten, schule, schriften = schriftenLesen(WURZEL)) {
  return schriftenEinsetzen(schuleEinsetzen(kontenEinsetzen(versionEinsetzen(app, version), konten), konten ? schule : null, konten), schriften);
}

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
    app: moduleEinsetzen(await lies(QUELLEN.app), { ordner: path.join(wurzel, 'src', 'module') }),   // modules (src/module) into the one file
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

/**
 * zugang: das Passwort (Text) oder { schluesselRoh } - die 32 gemerkten
 * Schluessel-Bytes (schluesselablage.mjs). Mit Passwort wird zusaetzlich
 * mit dem Passwort probe-entschluesselt, also genau so, wie die Huelle es tut.
 */
export async function distBauen(zugang, { wurzel = WURZEL, ziel = path.join(wurzel, 'dist'), version = null, konten, schule } = {}) {
  const passwort = typeof zugang === 'string' ? zugang : null;
  if (passwort === null && !(zugang && zugang.schluesselRoh)) throw new Error('distBauen braucht ein Passwort oder einen gemerkten Schluessel.');
  if (passwort !== null) passwortPruefen(passwort);
  const q = await quellenLesen(wurzel);
  if (q.woerter.length === 0) throw new Error(`${QUELLEN.woerter} ist leer - ohne Liste prueft der Lauf nichts.`);

  const v = version || versionErmitteln(WURZEL);
  // Accounts (S3): from werkzeug/konten.json if present; without the file the app runs without login.
  const k = konten !== undefined ? konten : await kontenLesen(wurzel);
  const schriften = schriftenLesen(wurzel);
  const app = appZusammensetzen(q.app, v, k, schule !== undefined ? schule : await schuleLesen(wurzel), schriften);
  const schriftFunde = schriftenPruefen(app.toString('utf8'), schriften);
  if (schriftFunde.length) throw new Error('Schriften, nichts geschrieben: ' + schriftFunde.join(', '));

  const schluessel = passwort !== null
    ? await schluesselAusPasswort(passwort, q.salt)
    : await schluesselAusRoh(zugang.schluesselRoh);
  const tresor = await verschluesselnMitSchluessel(app, schluessel, q.salt);
  const html = huelleBauen(q.vorlage, tresor);

  const treffer = oeffentlichPruefen(html, q.manifest, q.woerter);
  if (treffer.length) {
    throw new Error('Verbotene Woerter im oeffentlichen Teil, nichts geschrieben: ' + treffer.join(', '));
  }
  const offen = ohneTresor(html) + q.manifest;
  if ([v.hash, v.date].some((x) => offen.includes(x))) {
    throw new Error('Version wuerde im oeffentlichen Teil stehen, nichts geschrieben.');
  }

  const zurueck = passwort !== null
    ? await entschluesseln(tresorAusHuelle(html), passwort)
    : await entschluesselnMitSchluessel(tresorAusHuelle(html), schluessel);
  if (!Buffer.from(zurueck).equals(app)) {
    throw new Error('Probe-Entschluesselung ergibt nicht die App, nichts geschrieben.');
  }

  await fs.mkdir(ziel, { recursive: true });
  await fs.writeFile(path.join(ziel, 'index.html'), html, 'utf8');
  await fs.writeFile(path.join(ziel, 'manifest.webmanifest'), q.manifest, 'utf8');
  for (const icon of ICONS) await fs.copyFile(path.join(wurzel, icon), path.join(ziel, icon));

  return {
    ziel, dateien: ['index.html', 'manifest.webmanifest', ...ICONS], appBytes: app.length, version: v, konten: k ? k.users.length : 0, huelleBytes: Buffer.byteLength(html),
    schluesselRoh: await schluesselRoh(schluessel), salt: q.salt
  };
}

/**
 * Womit der Suchlauf der Testinstanz vergleicht (testinstanzPruefen): verbotene Woerter + Ersatzliste, Kathies
 * Schuldaten und Konten (soweit vorhanden) und das Salz des Familienpassworts. Fuer Bau und Veroeffentlichen gleich.
 */
export async function testinstanzKontext(wurzel = WURZEL, ersatz = null) {
  const lies = (rel) => fs.readFile(path.join(wurzel, rel), 'utf8');
  const woerter = woerterLesen(await lies(QUELLEN.woerter));
  if (woerter.length === 0) throw new Error(`${QUELLEN.woerter} ist leer - ohne Liste prueft der Suchlauf nichts.`);
  return {
    woerter, auchVerboten: (ersatz || await ersatzLesen(wurzel)).auchVerboten, schule: await schuleLesen(wurzel), konten: await kontenLesen(wurzel),
    salt: JSON.parse(await lies(QUELLEN.salz)).salt || '', schriften: schriftenLesen(wurzel)
  };
}

/**
 * Bauart "Testinstanz" (Stufe 3c, werkzeug/testinstanz.mjs): Testbau ohne Schuldaten, ohne konten.json, ohne
 * Familienpasswort (keine Huelle - die App liegt im Klartext), Speicher unter bqt_. Schreibt erst, wenn der Suchlauf
 * (testinstanzPruefen) nichts findet. Ziel: dist-test/ (nicht eingecheckt).
 */
export async function testinstanzBauen({ wurzel = WURZEL, ziel = path.join(wurzel, TESTINSTANZ.ordner), version = null } = {}) {
  const lies = (rel, enc) => fs.readFile(path.join(wurzel, rel), enc);
  const v = version || versionErmitteln(wurzel);
  const testbau = moduleEinsetzen(await lies(QUELLEN.app), { bauart: 'test', ordner: path.join(wurzel, 'src', 'module') });
  const ersatz = await ersatzLesen(wurzel);
  // konten und schule bewusst null: die Marken bleiben leer (nicht aus werkzeug/konten.json, werkzeug/schuldaten.json)
  const app = testinstanzUmwandeln(appZusammensetzen(testbau, v, null, null, schriftenLesen(wurzel)).toString('utf8'), ersatz);
  const manifest = testinstanzManifest(await lies(QUELLEN.manifest, 'utf8'));
  const { funde, pruefungen } = testinstanzPruefen(app, manifest, await testinstanzKontext(wurzel, ersatz));
  if (funde.length) throw new Error('Suchlauf Testinstanz, nichts geschrieben:\n  - ' + funde.join('\n  - '));
  await fs.mkdir(ziel, { recursive: true });
  await fs.writeFile(path.join(ziel, 'index.html'), app, 'utf8');
  await fs.writeFile(path.join(ziel, 'manifest.webmanifest'), manifest, 'utf8');
  for (const icon of ICONS) await fs.copyFile(path.join(wurzel, icon), path.join(ziel, icon));
  return { ziel, dateien: ['index.html', 'manifest.webmanifest', ...ICONS], appBytes: Buffer.byteLength(app), version: v, pruefungen };
}

/**
 * Bauart "Familie" (Vorbereitung Stufe 4, werkzeug/familie.mjs): Testbau ohne Schuldaten und ohne konten.json, mit dem
 * Familien-Repo verbunden, Speicher unter bqf_ - verschluesselt mit dem Familienpasswort wie Kathies App. zugang wie bei
 * distBauen (Passwort oder { schluesselRoh }). Schreibt erst, wenn der Suchlauf (familiePruefen) nichts findet und die
 * Probe-Entschluesselung die App Byte fuer Byte ergibt. Ziel: dist-familie/ (nicht eingecheckt). Veroeffentlicht nichts.
 */
export async function familieBauen(zugang, { wurzel = WURZEL, ziel = path.join(wurzel, FAMILIE.ordner), version = null } = {}) {
  const passwort = typeof zugang === 'string' ? zugang : null;
  if (passwort === null && !(zugang && zugang.schluesselRoh)) throw new Error('familieBauen braucht ein Passwort oder einen gemerkten Schluessel.');
  if (passwort !== null) passwortPruefen(passwort);
  const lies = (rel, enc) => fs.readFile(path.join(wurzel, rel), enc);
  const q = await quellenLesen(wurzel);
  if (q.woerter.length === 0) throw new Error(`${QUELLEN.woerter} ist leer - ohne Liste prueft der Lauf nichts.`);
  const v = version || versionErmitteln(wurzel);
  const testbau = moduleEinsetzen(await lies(QUELLEN.app), { bauart: 'test', ordner: path.join(wurzel, 'src', 'module') });
  // konten und schule bewusst null: die Marken bleiben leer (Neubeginn; Schulbewertungen kommen ins Konto des Kindes)
  const schriften = schriftenLesen(wurzel);
  const text = familieUmwandeln(appZusammensetzen(testbau, v, null, null, schriften).toString('utf8'));
  const app = Buffer.from(text, 'utf8');
  const schluessel = passwort !== null ? await schluesselAusPasswort(passwort, q.salt) : await schluesselAusRoh(zugang.schluesselRoh);
  const html = huelleBauen(q.vorlage, await verschluesselnMitSchluessel(app, schluessel, q.salt));
  const { funde, pruefungen } = familiePruefen(text, html, q.manifest, { woerter: q.woerter, schule: await schuleLesen(wurzel), konten: await kontenLesen(wurzel), version: v, schriften });
  if (funde.length) throw new Error('Suchlauf Familienfassung, nichts geschrieben:\n  - ' + funde.join('\n  - '));
  const zurueck = passwort !== null ? await entschluesseln(tresorAusHuelle(html), passwort) : await entschluesselnMitSchluessel(tresorAusHuelle(html), schluessel);
  if (!Buffer.from(zurueck).equals(app)) throw new Error('Probe-Entschluesselung ergibt nicht die App, nichts geschrieben.');
  await fs.mkdir(ziel, { recursive: true });
  await fs.writeFile(path.join(ziel, 'index.html'), html, 'utf8');
  await fs.writeFile(path.join(ziel, 'manifest.webmanifest'), q.manifest, 'utf8');
  for (const icon of ICONS) await fs.copyFile(path.join(wurzel, icon), path.join(ziel, icon));
  return {
    ziel, dateien: ['index.html', 'manifest.webmanifest', ...ICONS], appBytes: app.length, huelleBytes: Buffer.byteLength(html), version: v, pruefungen,
    schluesselRoh: await schluesselRoh(schluessel), salt: q.salt
  };
}

/**
 * Prueft, ob ein Schluessel die veroeffentlichte Seite oeffnet. So faellt auf,
 * wenn der gemerkte Schluessel nicht mehr zum Passwort der Geraete passt -
 * sonst muessten sich nach dem Hochladen alle Geraete neu anmelden.
 * Ergebnis: 'passt', 'passt-nicht' oder 'unbekannt' (Seite nicht erreichbar).
 */
export async function mitVeroeffentlichterPruefen(schluesselBytes, url = VEROEFFENTLICHT) {
  let html;
  try {
    const antwort = await fetch(url + '?t=' + Date.now(), { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!antwort.ok) return { ergebnis: 'unbekannt', grund: `HTTP ${antwort.status}` };
    html = await antwort.text();
  } catch (e) {
    return { ergebnis: 'unbekannt', grund: e.message };
  }
  try {
    await entschluesselnMitSchluessel(tresorAusHuelle(html), await schluesselAusRoh(schluesselBytes));
    return { ergebnis: 'passt' };
  } catch {
    return { ergebnis: 'passt-nicht' };
  }
}

/**
 * Liest die Version der veroeffentlichten Seite (mit dem gemerkten Schluessel entschluesselt)
 * und vergleicht sie mit dem gebauten Stand. Ergebnis: 'gleich', 'anders' (mit Text der
 * veroeffentlichten Version) oder 'nicht erreichbar'. Ein Aufruf, keine Wiederholung.
 */
export async function liveVergleichen(gebaut, schluesselBytes, url = VEROEFFENTLICHT) {
  let html;
  try {
    const antwort = await fetch(url + '?t=' + Date.now(), { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!antwort.ok) return { ergebnis: 'nicht erreichbar', grund: `HTTP ${antwort.status}` };
    html = await antwort.text();
  } catch (e) {
    return { ergebnis: 'nicht erreichbar', grund: e.message };
  }
  let v;
  try {
    const klar = await entschluesselnMitSchluessel(tresorAusHuelle(html), await schluesselAusRoh(schluesselBytes));
    v = versionAuslesen(Buffer.from(klar).toString('utf8'));
  } catch {
    return { ergebnis: 'nicht erreichbar', grund: 'Schluessel oeffnet die Seite nicht' };
  }
  const gleich = v && v.n === gebaut.n && v.hash === gebaut.hash && v.date === gebaut.date && !!v.draft === !!gebaut.draft;
  return gleich ? { ergebnis: 'gleich', veroeffentlicht: v } : { ergebnis: 'anders', veroeffentlicht: v, text: v ? versionText(v) : 'ohne Version' };
}

// Fuer Tests mit BQ_VEROEFFENTLICHT auf einen lokalen Server umlenkbar.
export const VEROEFFENTLICHT = process.env.BQ_VEROEFFENTLICHT || 'https://pahlborn.github.io/bis-school-app/';
