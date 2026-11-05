// Schriftarten der App eingebettet (Peter, 05.11.: "ja, einbetten" - Datenschutz-Entwurf, offener Punkt 2).
//
// Vorher lud index.html Fredoka und Nunito von Google Fonts; dabei sah Google die Internetadresse jedes Geraets. Jetzt
// liegen die Schriften als Text (Base64) in werkzeug/schriften/schriften.json und werden BEIM BAUEN an der Marke
// /*BQ_SCHRIFTEN*/ als @font-face mit data:-Adressen eingesetzt (wie Version, Konten, Schuldaten). Kein Binaerdatei-Push
// noetig (das Firmennetz sperrt teils Binaerdateien zu GitHub).
//
//  - nur WOFF2, nur der lateinische Teilsatz von Google Fonts (Grundlatein, Latin-1 mit Umlauten und ss, typografische
//    Anfuehrungszeichen und Striche U+2000-206F, Euro). Beide Schriften sind variable Schriften: EINE Datei je Familie
//    traegt alle Staerken (Fredoka 500-700, Nunito 400-800 - so viele, wie die App vorher bestellt hat).
//  - Lizenz: SIL Open Font License 1.1, Text in werkzeug/schriften/OFL.txt; genannt in "Ueber die App -> Quellen".
//  - gilt fuer Kathies App (distBauen), die Testinstanz (testinstanzBauen) und jede weitere Bauart ueber
//    appZusammensetzen.
//  - Tests, die index.html ohne Bau oeffnen (appLesen), haben keine Schriften (Systemschrift) - kleiner und schneller.
//
// schriftenPruefen() ist der Suchlauf: kein fonts.googleapis.com / fonts.gstatic.com, Marke weg, jede Schrift genau
// einmal eingebettet. distBauen und der Suchlauf der Testinstanz brechen bei einem Fund ab.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const SCHRIFT_MARKE = '/*BQ_SCHRIFTEN*/';
export const SCHRIFTEN_DATEI = 'werkzeug/schriften/schriften.json';
export const GOOGLE_FONTS = /fonts\.googleapis\.com|fonts\.gstatic\.com/i;
/** genau eine eingebettete Schrift (WOFF2 als data:-Adresse) - nur Base64-Zeichen dazwischen */
export const DATEN_RE = /url\(data:font\/woff2;base64,([A-Za-z0-9+/]+={0,2})\)/g;

const cache = new Map();

/** Liest werkzeug/schriften/schriften.json und prueft jede Schrift (WOFF2-Kopf, Groesse, SHA-256). */
export function schriftenLesen(wurzel) {
  const datei = path.join(wurzel, SCHRIFTEN_DATEI);
  if (cache.has(datei)) return cache.get(datei);
  let roh;
  try { roh = fs.readFileSync(datei, 'utf8'); } catch { throw new Error(`${SCHRIFTEN_DATEI} fehlt - ohne Schriften wird nicht gebaut.`); }
  const j = JSON.parse(roh);
  if (!Array.isArray(j.schriften) || !j.schriften.length) throw new Error(`${SCHRIFTEN_DATEI}: "schriften" fehlt.`);
  for (const s of j.schriften) {
    if (!/^[A-Za-z][A-Za-z ]*$/.test(s.familie || '') || !/^\d{3} \d{3}$/.test(s.gewicht || '')) throw new Error(`${SCHRIFTEN_DATEI}: Familie/Gewicht von ${s.datei} ungueltig.`);
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(s.base64 || '')) throw new Error(`${SCHRIFTEN_DATEI}: ${s.datei} ist kein Base64.`);
    const b = Buffer.from(s.base64, 'base64');
    if (b.subarray(0, 4).toString('latin1') !== 'wOF2') throw new Error(`${SCHRIFTEN_DATEI}: ${s.datei} ist kein WOFF2.`);
    if (b.length !== s.bytes) throw new Error(`${SCHRIFTEN_DATEI}: ${s.datei} hat ${b.length} statt ${s.bytes} Bytes.`);
    if (crypto.createHash('sha256').update(b).digest('hex') !== s.sha256) throw new Error(`${SCHRIFTEN_DATEI}: Pruefsumme von ${s.datei} stimmt nicht.`);
  }
  cache.set(datei, j.schriften);
  return j.schriften;
}

/** @font-face-Regeln, alle in EINER Zeile (die Marke steht in einer eigenen Zeile - Zeilenzahl bleibt gleich). */
export function schriftenCss(schriften) {
  return schriften.map((s) => `@font-face{font-family:'${s.familie}';font-style:normal;font-weight:${s.gewicht};font-display:swap;src:url(data:font/woff2;base64,${s.base64}) format('woff2')}`).join('');
}

/** Setzt die Schriften an der Marke ein. Die Marke muss genau einmal vorkommen, sonst Abbruch. app: Buffer oder Text. */
export function schriftenEinsetzen(app, schriften) {
  const istBuffer = Buffer.isBuffer(app);
  const text = istBuffer ? app.toString('utf8') : String(app);
  const n = text.split(SCHRIFT_MARKE).length - 1;
  if (n !== 1) throw new Error(`index.html: Marke ${SCHRIFT_MARKE} ${n}x statt 1x - Schriften nicht eingesetzt, nichts gebaut.`);
  const out = text.replace(SCHRIFT_MARKE, () => schriftenCss(schriften));
  return istBuffer ? Buffer.from(out, 'utf8') : out;
}

/** Text ohne die eingebetteten Schriftdaten (fuer Wortsuchen: in Base64 tauchen kurze Woerter zufaellig auf). */
export const ohneSchriften = (text) => String(text).replace(DATEN_RE, 'url(data:font/woff2;base64,)');

/** Suchlauf fuer die fertige App: Liste der Funde (leer = bestanden). */
export function schriftenPruefen(app, schriften) {
  const t = String(app), funde = [];
  const g = t.match(GOOGLE_FONTS);
  if (g) funde.push(`Google Fonts noch in der App (${g[0]})`);
  if (t.includes(SCHRIFT_MARKE)) funde.push(`Marke ${SCHRIFT_MARKE} nicht ersetzt`);
  const drin = [...t.matchAll(DATEN_RE)].map((m) => m[1]);
  for (const s of schriften) {
    const k = drin.filter((d) => d === s.base64).length;
    if (k !== 1) funde.push(`${s.familie} ${k}x statt 1x eingebettet`);
    else if (!t.includes(`font-family:'${s.familie}';font-style:normal;font-weight:${s.gewicht};`)) funde.push(`${s.familie}: @font-face unvollstaendig`);
  }
  if (drin.length !== schriften.length) funde.push(`${drin.length} eingebettete Schriften statt ${schriften.length}`);
  return funde;
}
