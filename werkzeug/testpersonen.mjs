// Testpersonen fuer die naechste Probe der Testinstanz (Stufe 3c): nur ein Admin und zwei unabhaengige Elternteile.
// Kathie wird absichtlich NICHT hier angelegt; Peter legt sie spaeter selbst in der App an. Startcodes, Passwoerter
// und Wiederherstellungscodes stehen NUR lokal (%LOCALAPPDATA%\bis-school-app\testinstanz\), nie im Repo, nie in
// der Ausgabe.
//
//   node werkzeug/testpersonen.mjs              zeigt den Stand (liest nur)
//   node werkzeug/testpersonen.mjs --anlegen    legt an, was fehlt; abgelaufene Startcodes werden neu ausgestellt
//   weitere Schalter: --repo owner/name, --wurzel <ordner im Repo>
//
// Der Token kommt aus %LOCALAPPDATA%\bis-school-app\testdaten-token.txt (anderer Pfad: BQ_GH_TOKEN_DATEI). Er ist zugleich der
// Zugangscode der Geraete (Aufgabe "Erstanmeldung per QR-Code", 06.11.): Mit --anlegen schreibt das Werkzeug je Person eine
// Einladung als HTML-Datei (QR-Code und Link mit Zugangscode und Startcode) NUR lokal nach ...\testinstanz\einladungen\ -
// nie ins Repo, nie in die Ausgabe. Peter verschickt sie selbst. Erwachsene: E-Mail-Entwurf; Kinder: keine E-Mail, eine
// Seite mit dem QR-Code zum Zeigen; Konten des Werkzeugs (ohne Startcode): "Geraet verbinden" (nur der Zugangscode).
//
// Wer was bekommt (Ausstellerkette wie im Konto-Modul: Admin -> Erwachsene):
//  - admin: legt das Werkzeug selbst an (Passwort + Wiederherstellungscode in der lokalen Datei). Das ist noetig,
//    weil nur ein angemeldeter Admin Startcodes unterschreiben kann. Auf dem Geraet: Anmeldung mit Name und Passwort
//    (Weg "weiteres Geraet").
//  - peter.ahlborn, jonas.testpapa: Startcode vom Admin. Auf dem Geraet: erste Anmeldung mit dem Startcode,
//    eigenes Passwort. Weitere Kinder oder eine Lehrkraft gehoeren nicht zu diesem Minimalset.

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PBKDF2_ROUNDS } from '../src/module/krypto.mjs';
import { pwSuggest } from '../src/module/passwort.mjs';
import { kontoLookup, startcodeAusstellen, ersteAnmeldung, anmelden } from '../src/module/konto.mjs';
import { anmStartlink, anmEinladungslink, anmEinladungMail, anmQr } from '../src/module/anmeldung.mjs';
import { ablageOrdner } from './schluesselablage.mjs';
import { TESTINSTANZ } from './testinstanz.mjs';

/* Reihenfolge = Reihenfolge des Anlegens (Aussteller zuerst) */
export const TESTPERSONEN = Object.freeze([
  { name: 'admin', art: 'admin', von: null, werkzeug: true, familie: '-', eintragen: 'Admin' },
  { name: 'peter.ahlborn', art: 'parent', von: 'admin', familie: 'A', eintragen: 'Peter Ahlborn' },
  { name: 'jonas.testpapa', art: 'parent', von: 'admin', familie: 'B', eintragen: 'Jonas Testpapa' }
].map((p) => Object.freeze(p)));

/* gehoert fuer die naechste Probe absichtlich NICHT zum vorangelegten Minimalset */
export const NICHT_VORANGELEGT = Object.freeze(['kathie', 'anna', 'lehrkraft']);
const BREIT = Math.max(...TESTPERSONEN.map((p) => p.name.length));

/* ein Startcode, der in weniger als einem Tag ablaeuft, wird neu ausgestellt */
export const STARTCODE_RESERVE_MS = 24 * 3600 * 1000;
const ARTEN = { admin: 'Admin', teacher: 'Lehrkraft', parent: 'Elternteil', child: 'Kind' };

export const lokalerOrdner = () => path.join(ablageOrdner(), 'testinstanz');
const tag = (ms) => new Date(ms).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

/**
 * Legt an, was fehlt (anlegen = true), oder zeigt nur den Stand. Liest und schreibt nur ueber "zugang" (Speicher-
 * Schnittstelle: Simulation oder GitHub). stand = bisheriger lokaler Stand ({ personen: { <name>: {...} } }).
 * -> { stand (neu), zeilen: [{ name, art, familie, status }] } - die Zeilen enthalten nie Codes oder Passwoerter.
 */
export async function testpersonenAnlegen({ zugang, now, anlegen = false, stand = {}, runden = PBKDF2_ROUNDS, rand, passwortNeu = () => pwSuggest(), merken = async () => {} } = {}) {
  if (!Number.isFinite(now)) throw new Error('"now" fehlt.');
  const st = { v: 1, personen: { ...(stand.personen || {}) } };
  const offen = {}, zeilen = [];
  const zr = rand ? { rand } : {};
  for (const p of TESTPERSONEN) {
    const alt = st.personen[p.name] || {};
    const da = (await zugang.directory(await kontoLookup(p.name))) !== null;
    let status;
    if (p.werkzeug) {
      if (da) {
        if (!alt.passwort) throw new Error(`Konto ${p.name} gibt es schon, aber die lokale Datei kennt sein Passwort nicht - anderer Rechner? Abbruch.`);
        try { offen[p.name] = await anmelden({ zugang, anmeldename: p.name, passwort: alt.passwort, runden }); }
        catch (e) { throw new Error(`Konto ${p.name}: das Passwort aus der lokalen Datei oeffnet es nicht mehr (${e.code || e.message}). Abbruch.`); }
        status = 'angelegt (Anmeldung mit Name und Passwort)';
      } else if (!anlegen) status = 'fehlt';
      else {
        const aussteller = p.von ? offen[p.von] : null;
        if (p.von && !aussteller) throw new Error(`Aussteller ${p.von} fuer ${p.name} fehlt.`);
        const sc = await startcodeAusstellen({ zugang, aussteller, anmeldename: p.name, art: p.art, now, ...zr });
        const passwort = passwortNeu();
        const k = await ersteAnmeldung({ zugang, code: sc.code, passwort, now, runden, ...zr });
        offen[p.name] = k;
        st.personen[p.name] = { kennung: k.kennung, passwort, wiederherstellungscode: k.wiederherstellungscode, angelegt: now };
        await merken(st);                               // sofort: ohne die Datei waere das Passwort verloren
        status = 'neu angelegt (Anmeldung mit Name und Passwort)';
      }
    } else if (da) {
      status = 'angemeldet (Startcode benutzt)';
      if (alt.startcode) st.personen[p.name] = { ...alt, startcode: null, benutzt: true };
    } else if (alt.startcode && alt.startcode.gueltigBis - now > STARTCODE_RESERVE_MS) {
      status = 'Startcode gueltig bis ' + tag(alt.startcode.gueltigBis);
    } else if (!anlegen) {
      status = alt.startcode ? 'Startcode abgelaufen oder laeuft heute ab' : 'fehlt';
    } else {
      const aussteller = offen[p.von];
      if (!aussteller) throw new Error(`Aussteller ${p.von} fuer ${p.name} fehlt.`);
      const sc = await startcodeAusstellen({ zugang, aussteller, anmeldename: p.name, art: p.art, now, ...zr });
      st.personen[p.name] = { kennung: sc.kennung, startcode: { code: sc.code, gueltigBis: sc.gueltigBis, ausgestellt: now, fp: sc.fingerabdruck }, von: p.von };
      await merken(st);
      status = (alt.startcode ? 'Startcode neu' : 'Startcode ausgestellt') + ', gueltig bis ' + tag(sc.gueltigBis);
    }
    zeilen.push({ name: p.name, art: p.art, familie: p.familie, status });
  }
  return { stand: st, zeilen };
}

/** Text fuer die lokale Datei (mit Codes und Passwoertern - nur dorthin). */
export function uebersichtText(stand, { repo, wurzel, jetzt }) {
  const z = [
    'Big Quest Testinstanz - Testpersonen (NUR auf diesem Rechner; nicht weitergeben ausser an die Testperson)',
    `Stand: ${tag(jetzt)}   Daten: ${repo}${wurzel ? '/' + wurzel : ''}   App: ${TESTINSTANZ.adresse}`,
    'Zugangscode (verbindet ein Geraet, einmal je Geraet - nicht das Passwort einer Person): steht in ' + ZUGANG_DATEI_TEXT + '; die Einladungen in einladungen\\ enthalten ihn schon.',
    'Minimalset fuer die naechste Probe: nur admin, peter.ahlborn und jonas.testpapa; Kathie legt Peter spaeter selbst in der App an.',
    ''
  ];
  const ein = ' '.repeat(BREIT + 1);
  for (const p of TESTPERSONEN) {
    const s = stand.personen[p.name] || {};
    z.push(`${p.name.padEnd(BREIT)} ${ARTEN[p.art].padEnd(10)} Familie ${p.familie}   in der App eintragen: ${p.eintragen}`);
    if (p.werkzeug && s.passwort) z.push(ein + `Anmeldename: ${p.name}   Passwort: ${s.passwort}` + (s.wiederherstellungscode ? `   Wiederherstellungscode: ${s.wiederherstellungscode}` : ''));
    else if (s.startcode) {
      z.push(ein + `Startcode (einmal, ausgestellt von ${p.von}): ${s.startcode.code}   gueltig bis ${tag(s.startcode.gueltigBis)}`);
      z.push(ein + `Startlink: ${anmStartlink(TESTINSTANZ.adresse, { anmeldename: p.name, code: s.startcode.code })}`);
    }
    else if (s.benutzt) z.push(ein + 'Startcode benutzt - Anmeldung mit Name und eigenem Passwort');
    else z.push(ein + 'noch nicht angelegt (node werkzeug/testpersonen.mjs --anlegen)');
  }
  return z.join('\n') + '\n';
}

/* wo der Zugangscode liegt (fuer die Zeile oben in testpersonen.txt; ohne den Code selbst) */
const ZUGANG_DATEI_TEXT = '%LOCALAPPDATA%\\bis-school-app\\testdaten-token.txt';

/**
 * Einladungen als HTML-Dateien (Aufgabe "Erstanmeldung per QR-Code"): je Person mit gueltigem Startcode eine Datei mit
 * QR-Code und Link (Zugangscode + Startlink mit Pruefwoertern des Ausstellers); Konten des Werkzeugs: "Geraet verbinden"
 * (nur der Zugangscode - Anmeldename und Passwort stehen in testpersonen.txt). Benutzte Startcodes: keine Datei mehr.
 * Schreibt nur in ordner (vorher alte .html dort weg). -> Dateinamen (ohne Geheimnisse)
 */
export async function einladungenSchreiben({ stand, ordner, zugangscode, adresse = TESTINSTANZ.adresse }) {
  await fs.mkdir(ordner, { recursive: true });
  for (const f of await fs.readdir(ordner)) if (f.endsWith('.html')) await fs.rm(path.join(ordner, f));
  const namen = [];
  for (const p of TESTPERSONEN) {
    const s = stand.personen[p.name] || {};
    let datei, html;
    if (s.startcode) {
      const link = anmEinladungslink(adresse, { zugang: zugangscode, anmeldename: p.name, code: s.startcode.code, fingerabdruck: s.startcode.fp || null });
      if (p.art === 'child') {
        datei = 'QR-zum-Zeigen-' + p.name + '.html';
        html = seite(`Big Quest – QR-Code für ${p.name}`, `<p><b>Nicht verschicken</b> – Kinder bekommen keine E-Mail. Auf dem Gerät des Kindes die Kamera auf den Code richten (oder in Big Quest „📷 QR-Code scannen“), dann zusammen ein Passwort wählen. Gilt einmal, bis ${tag(s.startcode.gueltigBis)}.</p><div style="width:280px">${anmQr(link, 'Start-QR-Code')}</div><p style="font-size:.8rem;word-break:break-all;color:#556">${esc(link)}</p>`);
      } else {
        const m = anmEinladungMail({ link, qr: anmQr(link, 'Einladung'), anmeldename: p.name, bis: s.startcode.gueltigBis, sprache: p.art === 'teacher' ? 'en' : 'de' });
        datei = m.dateiname; html = m.html;
      }
    } else if (p.werkzeug && s.passwort) {
      const link = anmEinladungslink(adresse, { zugang: zugangscode });
      datei = 'Geraet-verbinden-' + p.name + '.html';
      html = seite(`Big Quest – Gerät verbinden (${p.name})`, `<p>Für ein neues Gerät oder die App auf dem Home-Bildschirm: Big Quest öffnen, „📷 QR-Code scannen“ – oder diesen Link öffnen bzw. einfügen. Danach mit <b>${esc(p.name)}</b> und dem Passwort aus testpersonen.txt anmelden. Der Code verbindet nur das Gerät; er ist kein Passwort.</p><p><a href="${esc(link)}">Gerät verbinden</a></p><div style="width:240px">${anmQr(link, 'Gerät verbinden')}</div>`);
    } else continue;
    await fs.writeFile(path.join(ordner, datei), html, { mode: 0o600 });
    namen.push(datei);
  }
  return namen;
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const seite = (titel, body) => `<!doctype html>\n<html lang="de">\n<head><meta charset="utf-8"><title>${esc(titel)}</title></head>\n<body style="font-family:-apple-system,system-ui,sans-serif;max-width:34rem;margin:1.5rem auto;padding:0 1rem;color:#1d2433">\n<h1 style="font-size:1.2rem">${esc(titel)}</h1>\n${body}\n</body>\n</html>\n`;

/** alle Geheimnisse des Stands (fuer die Pruefung der Ausgabe) */
export const geheimnisse = (stand) => Object.values(stand.personen || {}).flatMap((s) => [s.passwort, s.wiederherstellungscode, s.startcode && s.startcode.code]).filter((x) => typeof x === 'string' && x);

/**
 * Ein Lauf mit lokaler Ablage: Stand lesen, anlegen/zeigen, Stand und Uebersicht schreiben (nur bei anlegen).
 * ausgabe(text) bekommt die Zeilen fuer die Konsole - ohne Geheimnisse (wird hier geprueft).
 */
export async function testpersonenLauf({ zugang, now = Date.now(), anlegen = false, ordner = lokalerOrdner(), repo = TESTINSTANZ.repoDaten, wurzel = TESTINSTANZ.wurzelDaten, runden, rand, ausgabe = console.log, zugangscode = null } = {}) {
  const standDatei = path.join(ordner, 'testpersonen.json'), textDatei = path.join(ordner, 'testpersonen.txt');
  let stand = {};
  try { stand = JSON.parse(await fs.readFile(standDatei, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const zeilenAus = [];
  const sag = (t) => zeilenAus.push(t);
  // nach jeder Aenderung schreiben: was schon angelegt ist, bleibt auch nach einem Abbruch gemerkt
  const merken = async (st) => {
    await fs.mkdir(ordner, { recursive: true });
    await fs.writeFile(standDatei, JSON.stringify(st, null, 2) + '\n', { mode: 0o600 });
    await fs.writeFile(textDatei, uebersichtText(st, { repo, wurzel, jetzt: now }), { mode: 0o600 });
  };
  const r = await testpersonenAnlegen({ zugang, now, anlegen, stand, merken: anlegen ? merken : async () => {}, ...(runden ? { runden } : {}), ...(rand ? { rand } : {}) });
  if (anlegen) await merken(r.stand);
  // Einladungen (QR-Code + Link mit Zugangscode) - nur mit Zugangscode und nur beim Anlegen
  const einladungen = anlegen && zugangscode ? await einladungenSchreiben({ stand: r.stand, ordner: path.join(ordner, 'einladungen'), zugangscode }) : [];
  sag(`Testpersonen in ${repo}${wurzel ? '/' + wurzel : ''}${anlegen ? '' : ' (nur angesehen, nichts geschrieben)'}:`);
  for (const z of r.zeilen) sag(`  ${z.name.padEnd(BREIT)} ${ARTEN[z.art].padEnd(10)} Familie ${z.familie}  ${z.status}`);
  sag(anlegen ? `Startcodes, Passwoerter, Wiederherstellungscodes: ${textDatei}` : 'Anlegen mit: node werkzeug/testpersonen.mjs --anlegen');
  if (einladungen.length) sag(`Einladungen (${einladungen.length}, nur auf diesem Rechner; Peter verschickt sie selbst): ${path.join(ordner, 'einladungen')}`);
  const text = zeilenAus.join('\n');
  const geheim = [...geheimnisse(r.stand), ...(zugangscode ? [zugangscode] : [])].filter((g) => text.includes(g));
  if (geheim.length) throw new Error('Ausgabe enthielte ' + geheim.length + ' Geheimnis(se) - nicht ausgegeben.');
  ausgabe(text);
  return { ...r, standDatei, textDatei, einladungen };
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
  const bekannt = ['--anlegen', '--repo', '--wurzel'];
  const fremd = args.filter((a, i) => a.startsWith('--') && !bekannt.includes(a) && !['--repo', '--wurzel'].includes(args[i - 1]));
  if (fremd.length) throw new Error('Unbekannter Schalter: ' + fremd.join(' '));
  const repo = opt('--repo', TESTINSTANZ.repoDaten), wurzel = opt('--wurzel', TESTINSTANZ.wurzelDaten);
  const tokenDatei = process.env.BQ_GH_TOKEN_DATEI || path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'bis-school-app', 'testdaten-token.txt');
  let token;
  try { token = (await fs.readFile(tokenDatei, 'utf8')).trim(); } catch (e) { throw new Error('Token-Datei fehlt: ' + tokenDatei); }
  const schwaerzen = (t) => (token ? String(t).split(token).join('[TOKEN]') : String(t));
  const { githubSpeicher } = await import('../src/module/github.mjs');
  try {
    const zugang = githubSpeicher({ repo, token, wurzel }).geraet('d_Werkzeug1');
    await testpersonenLauf({ zugang, anlegen: args.includes('--anlegen'), repo, wurzel, zugangscode: token, ausgabe: (t) => console.log(schwaerzen(t)) });
  } catch (e) { throw new Error(schwaerzen((e && e.code ? e.code + ': ' : '') + (e && e.message))); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error('FEHLER: ' + String(e && e.message)); process.exit(1); });
}
