// Merkt den abgeleiteten Schluessel auf diesem Rechner, damit nicht bei jeder
// Veroeffentlichung das Passwort eingetippt werden muss.
//
// - Gemerkt wird nie das Passwort, nur die 32 Schluessel-Bytes.
// - Ort: %LOCALAPPDATA%\bis-school-app\schluessel.json - ausserhalb des Repos,
//   kann also nicht versehentlich eingecheckt werden.
// - Unter Windows mit DPAPI geschuetzt ("CurrentUser"): lesbar nur unter
//   demselben Windows-Konto auf diesem Rechner. Eine kopierte Datei nuetzt
//   anderswo nichts. Anderswo (Linux/Mac) nur mit Dateirechten 600.
// - Der Schluessel gilt fuer genau ein Salt und eine Rundenzahl. Aendert sich
//   eins davon, wird er nicht benutzt.
//
// Fuer Tests laesst sich der Ordner mit BQ_SCHLUESSEL_ORDNER umlenken.

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { b64, unb64 } from './kern.mjs';

export const DATEI = 'schluessel.json';

export function ablageOrdner() {
  if (process.env.BQ_SCHLUESSEL_ORDNER) return process.env.BQ_SCHLUESSEL_ORDNER;
  if (process.platform === 'win32') return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'bis-school-app');
  return path.join(os.homedir(), '.bis-school-app');
}

export const ablagePfad = () => path.join(ablageOrdner(), DATEI);

/** DPAPI ueber PowerShell. Daten gehen ueber stdin, nicht ueber die Befehlszeile. */
function dpapi(methode, eingabeB64) {
  const skript = 'Add-Type -AssemblyName System.Security; ' +
    '$d = [Convert]::FromBase64String([Console]::In.ReadToEnd().Trim()); ' +
    `[Convert]::ToBase64String([Security.Cryptography.ProtectedData]::${methode}($d, $null, 'CurrentUser'))`;
  const kodiert = Buffer.from(skript, 'utf16le').toString('base64');
  const r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', kodiert], { input: eingabeB64, encoding: 'utf8' });
  if (r.status !== 0) throw new Error('Windows-Schutz (DPAPI) fehlgeschlagen: ' + String(r.stderr || r.error || '').trim().split('\n')[0]);
  return r.stdout.trim();
}

export async function speichern(roh, salt, iterationen) {
  if (roh.length !== 32) throw new Error('Schluessel muss 32 Bytes haben.');
  const windows = process.platform === 'win32';
  const inhalt = {
    v: 1,
    hinweis: 'Gemerkter Schluessel fuer bis-school-app (nicht das Passwort). Loeschen mit: node werkzeug/verschluesseln.mjs --vergessen',
    salt: b64(salt),
    iter: iterationen,
    schutz: windows ? 'dpapi-currentuser' : 'dateirechte',
    schluessel: windows ? dpapi('Protect', b64(roh)) : b64(roh)
  };
  await fs.mkdir(ablageOrdner(), { recursive: true });
  await fs.writeFile(ablagePfad(), JSON.stringify(inhalt, null, 2), { encoding: 'utf8', mode: 0o600 });
  return ablagePfad();
}

/**
 * Liest den gemerkten Schluessel.
 * Ergebnis: { roh } oder { fehlt: true } oder { unbrauchbar: 'Grund' }.
 */
export async function lesen(salt, iterationen) {
  let inhalt;
  try { inhalt = JSON.parse(await fs.readFile(ablagePfad(), 'utf8')); } catch (e) {
    if (e.code === 'ENOENT') return { fehlt: true };
    return { unbrauchbar: 'Datei nicht lesbar' };
  }
  if (inhalt.v !== 1 || inhalt.salt !== b64(salt) || inhalt.iter !== iterationen) {
    return { unbrauchbar: 'gehoert zu einem anderen Salt oder einer anderen Rundenzahl' };
  }
  try {
    const roh = unb64(inhalt.schutz === 'dpapi-currentuser' ? dpapi('Unprotect', inhalt.schluessel) : inhalt.schluessel);
    if (roh.length !== 32) return { unbrauchbar: 'Schluessel hat nicht 32 Bytes' };
    return { roh };
  } catch (e) {
    return { unbrauchbar: e.message };
  }
}

export async function vergessen() {
  try { await fs.rm(ablagePfad()); return true; } catch (e) { if (e.code === 'ENOENT') return false; throw e; }
}
