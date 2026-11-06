// Aufgabe "Erstanmeldung per QR-Code" (06.11.), Bausteine ohne Browser: Einladungslink lesen und bauen, eingefuegten
// Link / gescannten Code lesen, Zugangscode pruefen und uebernehmen (ersetzt immer, Fehler behalten nichts), Startcode
// ansehen ohne ihn zu verbrauchen, Link wiederverwenden, Geraetename, Einladung als E-Mail-Entwurf, QR-Code lesen
// (Bild -> jsQR -> Text). Speicher: Simulation und der nachgebaute GitHub-Server. Nur Fantasienamen.
//   node --test tests/module/erstanmeldung.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import {
  anmEinladungLesen, anmEinladungslink, anmEingefuegt, anmZugangPruefen, anmZugangUebernehmen, anmLinkPruefen,
  anmGeraetName, anmEinladungMail, anmStartlinkLesen, anmQr, anmQrLesen, ANM_QR_LESER, anmErstesMal
} from '../../src/module/anmeldung.mjs';
import { startcodeAusstellen, ersteAnmeldung, startcodeAnsehen, KONTO_STARTCODE_MS } from '../../src/module/konto.mjs';
import { lokalerSpeicher } from '../../src/module/speicher.mjs';
import { githubSpeicher, GITHUB_TOKEN_SCHLUESSEL } from '../../src/module/github.mjs';
import { qrMatrix } from '../../src/module/qrcode.mjs';
import { qrLesen } from '../../src/module/qrlesen.mjs';
import { githubNachbau } from './github-nachbau.mjs';

const R = 1000;
const CODE = 'Ab3_-xY9Ab3_-xY9Ab3_-x';
const FP = 'tiger-lamp-river-apple-stone-cloud';
const TOKEN = 'github_pat_ERSTANMELDUNG_' + 'q7Zx'.repeat(15);
const ADR = 'https://big-quest-test.github.io/';
const REPO = 'pahlborn/bis-school-app-testdaten';
let N;
before(async () => { N = await githubNachbau({ token: TOKEN, repos: [REPO] }); });
after(async () => { await N.schliessen(); });
const ablage = (init = {}) => { const m = new Map(Object.entries(init)); return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const GH = () => ({ art: 'github', repo: REPO, wurzel: '', basis: N.basis });

test('Link lesen: Zugangscode und Startlink, einzeln oder zusammen; alles andere -> null', () => {
  const l = anmEinladungslink(ADR, { zugang: TOKEN, anmeldename: 'mira.sonnental', code: CODE, fingerabdruck: FP });
  assert.equal(l, ADR + '#zugang=' + TOKEN + '&start=mira.sonnental/' + CODE + '/' + FP);
  assert.deepEqual(anmEinladungLesen(l.slice(l.indexOf('#'))), { zugang: TOKEN, start: { anmeldename: 'mira.sonnental', code: CODE, fingerabdruck: FP } });
  assert.deepEqual(anmEinladungLesen('#zugang=' + TOKEN), { zugang: TOKEN, start: null }, 'nur Zugangscode ("Weiteres Geraet verbinden")');
  assert.deepEqual(anmEinladungLesen('#start=lio.sonnental/' + CODE), { zugang: null, start: anmStartlinkLesen('#start=lio.sonnental/' + CODE) }, 'bisheriger Startlink bleibt gueltig');
  assert.deepEqual(anmEinladungLesen('#start=lio.sonnental/' + CODE + '&zugang=' + TOKEN).zugang, TOKEN, 'Reihenfolge egal');
  // Sonderzeichen im Zugangscode werden kodiert
  const sonder = 'abc&def#ghi=jkl%mno';
  const ls = anmEinladungslink(ADR, { zugang: sonder });
  assert.ok(!ls.slice(ls.indexOf('#') + 1).includes('#'));
  assert.equal(anmEinladungLesen(ls.slice(ls.indexOf('#'))).zugang, sonder);
  for (const h of ['', '#', '#zugang=', '#zugang=kurz', '#zugang=' + TOKEN + '&zugang=' + TOKEN, '#zugang=' + TOKEN + '&x=1', '#zugang=' + TOKEN + '&start=kaputt',
    '#eltern/einstellungen', '#zugang=%E0%A4%A', '#zugang=mit leerzeichen', 'zugang=' + TOKEN, null, undefined])
    assert.equal(anmEinladungLesen(h), null, String(h));
  assert.throws(() => anmEinladungslink(ADR, {}), /fehlt/);
  assert.throws(() => anmEinladungslink(ADR, { zugang: 'kurz' }), /Zugangscode/);
});

test('Link einfuegen / QR-Code: ganzer Link oder nur der Code; Umbrueche egal; Link einer anderen Fassung -> fremd', () => {
  const l = anmEinladungslink(ADR, { zugang: TOKEN, anmeldename: 'jonas.sonnental', code: CODE });
  assert.deepEqual(anmEingefuegt(l, ADR), anmEinladungLesen(l.slice(l.indexOf('#'))));
  assert.deepEqual(anmEingefuegt('  ' + l.slice(0, 40) + '\n' + l.slice(40) + ' ', ADR + 'index.html'), anmEinladungLesen(l.slice(l.indexOf('#'))), 'vom Mailprogramm umbrochen');
  assert.deepEqual(anmEingefuegt(' ' + TOKEN + '\n', ADR), { zugang: TOKEN, start: null }, 'nur der Code');
  assert.deepEqual(anmEingefuegt(anmEinladungslink('https://big-quest.github.io/', { zugang: TOKEN }), ADR), { fremd: true }, 'Produktion statt Test');
  assert.deepEqual(anmEingefuegt(anmEinladungslink('https://pahlborn.github.io/bis-school-app/', { zugang: TOKEN }), ADR), { fremd: true });
  for (const t of ['', '   ', 'https://big-quest-test.github.io/', 'kurz', 'Hallo Welt', 'https://example.org/?x=1', ADR + '#eltern', 'a=b&c=d'])
    assert.equal(anmEingefuegt(t, ADR), null, JSON.stringify(t));
});

test('Zugangscode pruefen und uebernehmen (GitHub-Nachbau): eine Anfrage; ersetzt immer einen alten; falsch, kein Netz, Limit -> nicht behalten', async () => {
  // das Repo hat ein Konto (sonst "fremd": kein Speicher dieser App)
  const zw = githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis }).geraet('d_Werkzeug1');
  const sc = await startcodeAusstellen({ zugang: zw, aussteller: null, anmeldename: 'admin', art: 'admin', now: Date.now() });
  await ersteAnmeldung({ zugang: zw, code: sc.code, passwort: 'Werkzeug-Admin-Passwort-1', now: Date.now(), runden: R });

  const vorher = N.zaehler.anfragen;
  assert.equal(await anmZugangPruefen({ speicher: GH(), token: TOKEN }), 'ok');
  assert.equal(N.zaehler.anfragen - vorher, 1, 'genau eine Anfrage');
  assert.equal(await anmZugangPruefen({ speicher: GH(), token: 'github_pat_FALSCH_' + 'x'.repeat(30) }), 'falsch', '401');
  assert.equal(await anmZugangPruefen({ speicher: { ...GH(), repo: 'pahlborn/gibt-es-nicht' }, token: TOKEN }), 'falsch', 'anderes Repo: 404 -> kein Speicher dieser App');
  N.stoerung({ abbruch: true });
  assert.equal(await anmZugangPruefen({ speicher: GH(), token: TOKEN }), 'offline');
  N.stoerung({ status: 403, header: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 60) } });
  assert.equal(await anmZugangPruefen({ speicher: GH(), token: TOKEN }), 'limit');
  assert.equal(await anmZugangPruefen({ speicher: lokalerSpeicher(), token: '' }), 'ok', 'Simulation braucht keinen Zugangscode');

  // uebernehmen: ein alter Code wird durch einen funktionierenden ersetzt
  const a = ablage({ [GITHUB_TOKEN_SCHLUESSEL]: 'github_pat_ALT_' + 'y'.repeat(30) });
  assert.equal(await anmZugangUebernehmen({ ablage: a, speicher: GH(), token: '  ' + TOKEN + ' ' }), 'ok');
  assert.equal(a.getItem(GITHUB_TOKEN_SCHLUESSEL), TOKEN, 'ersetzt (getrimmt)');
  // ein falscher, einer ohne Netz: nicht behalten - der funktionierende bleibt
  assert.equal(await anmZugangUebernehmen({ ablage: a, speicher: GH(), token: 'github_pat_FALSCH_' + 'x'.repeat(30) }), 'falsch');
  N.stoerung({ abbruch: true });
  assert.equal(await anmZugangUebernehmen({ ablage: a, speicher: GH(), token: 'github_pat_NEU_' + 'z'.repeat(30) }), 'offline');
  assert.equal(await anmZugangUebernehmen({ ablage: a, speicher: GH(), token: 'kurz' }), 'falsch');
  assert.equal(a.getItem(GITHUB_TOKEN_SCHLUESSEL), TOKEN, 'ein Code, der nicht geht, wird nie gespeichert');
  const leer = ablage();
  assert.equal(await anmZugangUebernehmen({ ablage: leer, speicher: GH(), token: 'github_pat_FALSCH_' + 'x'.repeat(30) }), 'falsch');
  assert.equal(leer.getItem(GITHUB_TOKEN_SCHLUESSEL), null);
});

/* Simulation mit Admin und Elternteil (Aussteller) */
async function welt() {
  const w = lokalerSpeicher(), z = w.geraet('d_Werkzeug1');
  const sa = await startcodeAusstellen({ zugang: z, aussteller: null, anmeldename: 'admin', art: 'admin', now: Date.now() });
  const admin = await ersteAnmeldung({ zugang: z, code: sa.code, passwort: 'Werkzeug-Admin-Passwort-1', now: Date.now(), runden: R });
  return { w, z, admin };
}

test('Startcode ansehen: verbraucht ihn nicht; Name und Art aus dem Code; zurueckgezogen/abgelaufen/fremder Fingerabdruck', async () => {
  const { z, admin } = await welt();
  const sc = await startcodeAusstellen({ zugang: z, aussteller: admin, anmeldename: 'mira.sonnental', art: 'parent', now: Date.now() });
  const a = await startcodeAnsehen({ zugang: z, code: sc.code, fingerabdruck: sc.fingerabdruck, now: Date.now() });
  assert.deepEqual([a.anmeldename, a.art, a.neu], ['mira.sonnental', 'parent', false]);
  const b = await startcodeAnsehen({ zugang: z, code: sc.code, now: Date.now() });
  assert.equal(b.anmeldename, 'mira.sonnental', 'zweimal ansehen geht: der Code liegt wieder im Speicher');
  await assert.rejects(startcodeAnsehen({ zugang: z, code: sc.code, fingerabdruck: 'falsch-falsch-falsch-falsch-falsch-falsch', now: Date.now() }), (e) => e.code === 'fingerabdruck');
  // danach gilt er noch: die erste Anmeldung klappt
  const k = await ersteAnmeldung({ zugang: z, code: sc.code, passwort: 'Puffin-Jam-Lake-9876', now: Date.now(), runden: R });
  assert.equal(k.anmeldename, 'mira.sonnental');
  await assert.rejects(startcodeAnsehen({ zugang: z, code: sc.code, now: Date.now() }), (e) => e.code === 'startcode-ungueltig', 'verbraucht');
  await assert.rejects(startcodeAnsehen({ zugang: z, code: CODE, now: Date.now() }), (e) => e.code === 'startcode-ungueltig', 'unbekannt');
  await assert.rejects(startcodeAnsehen({ zugang: z, code: 'kurz', now: Date.now() }), (e) => e.code === 'startcode-ungueltig');
  const alt = await startcodeAusstellen({ zugang: z, aussteller: admin, anmeldename: 'jonas.sonnental', art: 'parent', now: Date.now() - KONTO_STARTCODE_MS - 1000 });
  await assert.rejects(startcodeAnsehen({ zugang: z, code: alt.code, now: Date.now() }), (e) => e.code === 'startcode-abgelaufen');
});

test('Startcode ansehen im GitHub-Nachbau: holen und zuruecklegen, danach erste Anmeldung', async () => {
  const zw = githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis, wurzel: 'ansehen' }).geraet('d_Werkzeug1');
  const sa = await startcodeAusstellen({ zugang: zw, aussteller: null, anmeldename: 'admin', art: 'admin', now: Date.now() });
  const admin = await ersteAnmeldung({ zugang: zw, code: sa.code, passwort: 'Werkzeug-Admin-Passwort-1', now: Date.now(), runden: R });
  const sc = await startcodeAusstellen({ zugang: zw, aussteller: admin, anmeldename: 'lehrkraft', art: 'teacher', now: Date.now() });
  const z = githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis, wurzel: 'ansehen' }).geraet('d_Lehrkraft');
  assert.equal((await startcodeAnsehen({ zugang: z, code: sc.code, now: Date.now() })).art, 'teacher');
  assert.ok([...N.dateien().keys()].some((p) => p.startsWith('ansehen/invites/')), 'Einladung liegt wieder im Repo');
  assert.equal((await ersteAnmeldung({ zugang: z, code: sc.code, passwort: 'Koala-Bread-Cliff-5502', now: Date.now(), runden: R })).art, 'teacher');
});

test('Link pruefen: registrieren (neu, neues Kinderpasswort), anmelden (Link wiederverwendet), Fehler', async () => {
  const { w, z, admin } = await welt();
  const jetzt = () => Date.now();
  const sc = await startcodeAusstellen({ zugang: z, aussteller: admin, anmeldename: 'mira.wellenberg', art: 'parent', now: jetzt() });
  const start = { anmeldename: 'mira.wellenberg', code: sc.code, fingerabdruck: sc.fingerabdruck };
  const g = w.geraet('d_Mira');
  assert.deepEqual(await anmLinkPruefen({ zugang: g, start, now: jetzt() }), { art: 'registrieren', anmeldename: 'mira.wellenberg', rolle: 'parent', neu: false });
  // der Name im Link zaehlt nicht - der Code sagt, fuer wen er ist
  assert.equal((await anmLinkPruefen({ zugang: g, start: { ...start, anmeldename: 'jonas.wellenberg' }, now: jetzt() })).anmeldename, 'mira.wellenberg');
  const k = await anmErstesMal({ zugang: g, code: sc.code, passwort: 'Puffin-Jam-Lake-9876', fingerabdruck: sc.fingerabdruck, now: jetzt() });
  assert.equal(k.anmeldename, 'mira.wellenberg');
  // derselbe Link noch einmal (Safari hat die Seite vergessen, neues Geraet): Konto da -> anmelden
  assert.deepEqual(await anmLinkPruefen({ zugang: w.geraet('d_Mira2'), start, now: jetzt() }), { art: 'anmelden', anmeldename: 'mira.wellenberg', rolle: 'parent' });
  // ... auch nach Ablauf der 7 Tage
  assert.deepEqual(await anmLinkPruefen({ zugang: w.geraet('d_Mira3'), start, now: jetzt() + KONTO_STARTCODE_MS + 1 }), { art: 'anmelden', anmeldename: 'mira.wellenberg', rolle: 'parent' });
  // ohne Konto: Fehler
  assert.deepEqual(await anmLinkPruefen({ zugang: g, start: { anmeldename: 'jonas.wellenberg', code: CODE, fingerabdruck: null }, now: jetzt() }), { art: 'fehler', code: 'startcode-ungueltig' });
  const alt = await startcodeAusstellen({ zugang: z, aussteller: admin, anmeldename: 'jonas.wellenberg', art: 'parent', now: jetzt() - KONTO_STARTCODE_MS - 5 });
  assert.deepEqual(await anmLinkPruefen({ zugang: g, start: { anmeldename: 'jonas.wellenberg', code: alt.code, fingerabdruck: null }, now: jetzt() }), { art: 'fehler', code: 'startcode-abgelaufen' });
  const sc2 = await startcodeAusstellen({ zugang: z, aussteller: admin, anmeldename: 'jonas.wellenberg', art: 'parent', now: jetzt() });
  assert.deepEqual(await anmLinkPruefen({ zugang: g, start: { anmeldename: 'jonas.wellenberg', code: sc2.code, fingerabdruck: FP }, now: jetzt() }), { art: 'fehler', code: 'fingerabdruck' });
  assert.equal((await anmLinkPruefen({ zugang: g, start: { anmeldename: 'jonas.wellenberg', code: sc2.code, fingerabdruck: sc2.fingerabdruck }, now: jetzt() })).art, 'registrieren', 'nach dem Fehler gilt der Code noch');
  // kein Netz: Fehler des Speichers kommt durch (die App sagt "Kein Netz")
  g.offline();
  await assert.rejects(anmLinkPruefen({ zugang: g, start, now: jetzt() }), (e) => e.code === 'offline');
});

test('Geraetename: Browser und Home-Bildschirm-App verstaendlich getrennt', () => {
  const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
  const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
  const WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
  assert.equal(anmGeraetName({ ua: IPHONE }), 'iPhone (Safari)');
  assert.equal(anmGeraetName({ ua: IPHONE, standalone: true }), 'iPhone (App)');
  assert.equal(anmGeraetName({ ua: IPAD, touch: true }), 'iPad (Safari)');
  assert.equal(anmGeraetName({ ua: IPAD, touch: true, standalone: true }), 'iPad (App)');
  assert.equal(anmGeraetName({ ua: IPAD }), 'Mac (Safari)');
  assert.equal(anmGeraetName({ ua: WIN }), 'Windows (Chrome)');
  assert.equal(anmGeraetName({ ua: 'node-sandbox' }), '');
});

test('Einladung als E-Mail-Entwurf: Betreff, Link, QR-Code, 7 Tage, einmal; DE und EN', () => {
  const link = anmEinladungslink(ADR, { zugang: TOKEN, anmeldename: 'jonas.sonnental', code: CODE });
  const bis = Date.UTC(2026, 10, 13, 9, 30);
  const de = anmEinladungMail({ link, qr: anmQr(link, 'QR'), anmeldename: 'jonas.sonnental', bis, sprache: 'de' });
  assert.equal(de.dateiname, 'Big-Quest-Einladung-jonas.sonnental.html');
  assert.match(de.betreff, /Einladung.*jonas\.sonnental/);
  for (const s of ['tippen Sie auf den Link', 'QR-Code', 'gilt 7 Tage', 'nur für eine Anmeldung', '<svg', 'href="' + link.replace(/&/g, '&amp;') + '"']) assert.ok(de.html.includes(s), s);
  const en = anmEinladungMail({ link, qr: anmQr(link, 'QR'), anmeldename: 'jonas.sonnental', bis, sprache: 'en' });
  for (const s of ['tap the link', 'works for 7 days', 'for one sign-up', 'Big-Quest-invitation-jonas.sonnental.html']) assert.ok(en.html.includes(s) || en.dateiname === s, s);
  assert.throws(() => anmEinladungMail({ link, qr: '', anmeldename: 'jonas.sonnental', bis }), /unvollstaendig/);
});

/* QR-Code -> Bild (RGBA, mit Rand, s Pixel je Modul, optional verrauscht und invertiert) */
function bild(text, { s = 4, rand = 4, rauschen = 0, invertiert = false } = {}) {
  const q = qrMatrix(text, { ecc: 'M' }), n = (q.size + 2 * rand) * s, px = new Uint8ClampedArray(n * n * 4);
  let r = 12345; const zufall = () => ((r = (r * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const my = Math.floor(y / s) - rand, mx = Math.floor(x / s) - rand;
    const dunkel = !!(my >= 0 && mx >= 0 && my < q.size && mx < q.size && q.zeilen[my][mx]);
    let v = (dunkel !== invertiert) ? 20 : 235;
    v = Math.max(0, Math.min(255, v + (zufall() - 0.5) * 2 * rauschen));
    const i = (y * n + x) * 4; px[i] = px[i + 1] = px[i + 2] = v; px[i + 3] = 255;
  }
  return { px, n };
}

test('QR-Code lesen (jsQR): Bild eines erzeugten QR-Codes -> derselbe Link; auch verrauscht und hell auf dunkel; sonst null', () => {
  const link = anmEinladungslink(ADR, { zugang: 'github_pat_' + 'A1b2C3d4E5'.repeat(8) + 'xy', anmeldename: 'lio.wellenberg', code: CODE, fingerabdruck: FP });
  for (const o of [{}, { s: 3 }, { rauschen: 60 }, { invertiert: true }]) {
    const { px, n } = bild(link, o);
    assert.equal(qrLesen(px, n, n), link, JSON.stringify(o));
    assert.equal(anmQrLesen(px, n, n), link);
  }
  const leer = new Uint8ClampedArray(100 * 100 * 4).fill(255);
  assert.equal(qrLesen(leer, 100, 100), null, 'kein Code im Bild');
  assert.equal(qrLesen(leer, 99, 100), null, 'falsche Groesse');
  assert.equal(qrLesen(null, 1, 1), null);
  assert.deepEqual({ ...ANM_QR_LESER }, { name: 'jsQR', version: '1.4.0', lizenz: 'Apache License 2.0', url: 'https://github.com/cozmo/jsQR' });
});

test('jsQR ist unveraendert eingebettet (npm jsqr@1.4.0, dist/jsQR.js) und hat weder Netz noch Speicher', () => {
  const t = fs.readFileSync(new URL('../../src/module/qrlesen.mjs', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  const a = t.indexOf('const module = { exports: {} }, exports = module.exports, define = undefined;\n') + 'const module = { exports: {} }, exports = module.exports, define = undefined;\n'.length;
  const b = t.indexOf('\n  return module.exports;\n})();');
  const js = t.slice(a, b - 1);   // genau die Datei (sie endet ohne Zeilenumbruch)
  assert.equal(createHash('sha256').update(js).digest('hex'), JSQR_SHA256, 'Inhalt wie npm jsqr@1.4.0');
  assert.match(t, /Apache License 2\.0/);
  assert.doesNotMatch(js, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|eval\(|new Function/);
});
/* SHA-256 von dist/jsQR.js aus npm jsqr@1.4.0 */
const JSQR_SHA256 = 'bc40c8a15196236b2314db0856f72ca0b49980cd5413b8c852a7349f5fee0859';
