// Kern der Verschluesselung. Wird vom Skript (verschluesseln.mjs) und von
// den Tests benutzt. Die Huelle (huelle.html) rechnet im Browser genau
// dasselbe nach - wer hier etwas aendert, aendert es dort mit; der
// Browser-Test (tests/huelle.test.mjs) wird sonst rot.
//
// Verfahren: PBKDF2-SHA256 leitet aus Passwort + Salt einen AES-256-Schluessel
// ab, AES-GCM verschluesselt die ganze App. GCM erkennt ein falsches Passwort
// selbst (die Entschluesselung schlaegt fehl), es braucht keinen Pruefwert.

import { webcrypto } from 'node:crypto';

const { subtle } = webcrypto;

export const FORMAT = 1;
export const ITERATIONEN = 600000;
export const MIN_ZEICHEN = 20;
export const PLATZHALTER = '/*TRESOR*/';

const b64 = (u8) => Buffer.from(u8).toString('base64');
const unb64 = (s) => new Uint8Array(Buffer.from(s, 'base64'));

/**
 * Passwort vereinheitlichen, genau wie in der Huelle: Unicode-NFC (ein "ue"
 * vom iPad ist sonst ein anderes Byte-Muster als eines von Windows) und
 * Leerzeichen am Rand weg (iOS haengt gern eines an).
 */
export function passwortNormal(passwort) {
  return String(passwort).normalize('NFC').trim();
}

/** Wirft, wenn das Passwort zu kurz ist. */
export function passwortPruefen(passwort) {
  const n = Array.from(passwortNormal(passwort)).length;
  if (n < MIN_ZEICHEN) {
    throw new Error(`Passwort zu kurz: ${n} Zeichen, mindestens ${MIN_ZEICHEN} noetig (z. B. vier zufaellige Woerter).`);
  }
}

export async function schluesselAusPasswort(passwort, salt, iterationen = ITERATIONEN) {
  const basis = await subtle.importKey(
    'raw', new TextEncoder().encode(passwortNormal(passwort)), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iterationen },
    basis, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

/** Die 32 Bytes des Schluessels - so wird er gemerkt (schluesselablage.mjs). */
export async function schluesselRoh(schluessel) {
  return new Uint8Array(await subtle.exportKey('raw', schluessel));
}

export function schluesselAusRoh(roh) {
  return subtle.importKey('raw', roh, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}

/**
 * Verschluesselt Bytes mit einem fertigen Schluessel. Salt und Runden werden
 * nur mitgeschrieben, damit die Huelle das Passwort genauso ableiten kann.
 * Jeder Aufruf bekommt einen neuen Zufalls-IV.
 */
export async function verschluesselnMitSchluessel(bytes, schluessel, salt, iterationen = ITERATIONEN) {
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const daten = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, schluessel, bytes));
  return { v: FORMAT, iter: iterationen, salt: b64(salt), iv: b64(iv), daten: b64(daten) };
}

/** Verschluesselt Bytes mit einem Passwort. */
export async function verschluesseln(bytes, passwort, salt, iterationen = ITERATIONEN) {
  return verschluesselnMitSchluessel(bytes, await schluesselAusPasswort(passwort, salt, iterationen), salt, iterationen);
}

/** Entschluesselt einen Tresor mit einem fertigen Schluessel. Wirft, wenn er nicht passt. */
export async function entschluesselnMitSchluessel(tresor, schluessel) {
  const klar = await subtle.decrypt({ name: 'AES-GCM', iv: unb64(tresor.iv) }, schluessel, unb64(tresor.daten));
  return new Uint8Array(klar);
}

/** Entschluesselt einen Tresor. Wirft bei falschem Passwort. */
export async function entschluesseln(tresor, passwort) {
  return entschluesselnMitSchluessel(tresor, await schluesselAusPasswort(passwort, unb64(tresor.salt), tresor.iter));
}

/** Setzt den Tresor in die Vorlage ein. Der Platzhalter muss genau einmal vorkommen. */
export function huelleBauen(vorlage, tresor) {
  const teile = vorlage.split(PLATZHALTER);
  if (teile.length !== 2) {
    throw new Error(`Platzhalter ${PLATZHALTER} muss genau einmal in der Huelle stehen (gefunden: ${teile.length - 1}).`);
  }
  return teile[0] + JSON.stringify(tresor) + teile[1];
}

/** Liest den Tresor aus einer fertigen Huelle. */
export function tresorAusHuelle(html) {
  const m = html.match(/<script type="application\/json" id="tresor">([\s\S]*?)<\/script>/);
  if (!m) throw new Error('Kein Tresor in der Huelle gefunden.');
  return JSON.parse(m[1]);
}

/**
 * Die Huelle ohne den verschluesselten Block. Nur darin wird nach verbotenen
 * Woertern gesucht: im Base64-Block tauchen kurze Woerter zufaellig auf
 * ("Bhan" bei rund 200 KB mit etwa 1 % Wahrscheinlichkeit) und wuerden den
 * Lauf grundlos abbrechen.
 */
export function ohneTresor(html) {
  return html.replace(/(<script type="application\/json" id="tresor">)[\s\S]*?(<\/script>)/, '$1$2');
}

/** Liest die Liste verbotener Woerter (eine Zeile je Wort, # = Kommentar). */
export function woerterLesen(text) {
  return text.split(/\r?\n/).map((z) => z.trim()).filter((z) => z && !z.startsWith('#'));
}

/** Gibt die verbotenen Woerter zurueck, die im Text vorkommen (ohne Ruecksicht auf Gross/klein). */
export function verboteneTreffer(text, woerter) {
  const t = text.toLowerCase();
  return woerter.filter((w) => t.includes(w.toLowerCase()));
}

export { b64, unb64 };
