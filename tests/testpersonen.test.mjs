// Stufe 3c, Werkzeug-Teil: Testpersonen fuer die Testinstanz (werkzeug/testpersonen.mjs). Minimalset fuer die
// naechste Probe: ein Admin und zwei unabhaengige Elternteile; Kathie wird absichtlich nicht vorangelegt.
// Startcodes, Passwoerter und Wiederherstellungscodes nur in der lokalen Datei, nie in der Ausgabe, nie im Speicher
// im Klartext.
// Gegen die Simulation UND den nachgebauten GitHub-Server (gleicher Vertrag). Ohne Browser.
//   node --test tests/testpersonen.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TESTPERSONEN, NICHT_VORANGELEGT, STARTCODE_RESERVE_MS, testpersonenLauf, geheimnisse } from '../werkzeug/testpersonen.mjs';
import { TESTINSTANZ } from '../werkzeug/testinstanz.mjs';
import { KONTO_STARTCODE_MS, kontoLookup, ersteAnmeldung, anmelden, wiederherstellen, startcodeAnsehen } from '../src/module/konto.mjs';
import { anmEinladungslink, anmEinladungLesen, anmQr } from '../src/module/anmeldung.mjs';
import { lokalerSpeicher } from '../src/module/speicher.mjs';
import { githubSpeicher } from '../src/module/github.mjs';
import { pwWeak } from '../src/module/passwort.mjs';
import { githubNachbau } from './module/github-nachbau.mjs';

const R = 1000;                                                  // PBKDF2-Runden im Test (das Werkzeug: 600 000)
const T0 = Date.UTC(2026, 10, 4, 17, 0, 0), TAG = 864e5;
const REPO = TESTINSTANZ.repoDaten;
const TOKEN = 'github_pat_TESTPERSONEN_' + 'k3'.repeat(20);
let N, lauf = 0;
before(async () => { N = await githubNachbau({ token: TOKEN, repos: [REPO] }); });
after(async () => { await N.schliessen(); });

const WELTEN = {
  Simulation: () => { const uhr = { t: T0 }; const s = lokalerSpeicher({ now: () => uhr.t }); return { uhr, geraet: (d) => s.geraet(d), dateien: null }; },
  'GitHub (Nachbau)': () => {
    const uhr = { t: T0 }, wurzel = 'personen-' + (++lauf);
    return { uhr, geraet: (d) => githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis, wurzel, now: () => uhr.t }).geraet(d), dateien: () => [...N.dateien().entries()].filter(([p]) => p.startsWith(wurzel + '/')) };
  },
};
const jedeWelt = (name, fn) => { for (const [w, neu] of Object.entries(WELTEN)) test(`${w}: ${name}`, async () => { const ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'bq-tp-')); try { await fn(neu(), ordner); } finally { fs.rmSync(ordner, { recursive: true, force: true }); } }); };
const L = (W, ordner, anlegen, extra = {}) => { const aus = []; return testpersonenLauf({ zugang: W.geraet('d_Werkzeug1'), now: W.uhr.t, anlegen, ordner, runden: R, ausgabe: (t) => aus.push(t), ...extra }).then((r) => ({ ...r, aus: aus.join('\n') })); };
const status = (r) => Object.fromEntries(r.zeilen.map((z) => [z.name, z.status]));
const lesen = (ordner) => JSON.parse(fs.readFileSync(path.join(ordner, 'testpersonen.json'), 'utf8'));

test('Liste: Minimalset mit Admin und zwei Elternteilen; Aussteller kommt vor der Person', () => {
  assert.deepEqual(TESTPERSONEN.map((p) => p.name), ['admin', 'peter.ahlborn', 'jonas.testpapa']);
  const fam = (f) => TESTPERSONEN.filter((p) => p.familie === f);
  assert.deepEqual(fam('A').map((p) => [p.art, p.eintragen]), [['parent', 'Peter Ahlborn']]);
  assert.deepEqual(fam('B').map((p) => [p.art, p.eintragen]), [['parent', 'Jonas Testpapa']]);
  for (const p of TESTPERSONEN) for (const w of NICHT_VORANGELEGT) assert.equal(new RegExp('\\b' + w + '\\b', 'i').test(p.name + ' ' + p.eintragen + ' ' + (p.von || '')), false, p.name + ': ' + w);
  assert.deepEqual(TESTPERSONEN.filter((p) => p.art === 'teacher').length, 0);
  assert.deepEqual(TESTPERSONEN.filter((p) => p.art === 'admin').length, 1);
  assert.deepEqual(TESTPERSONEN.filter((p) => p.art === 'parent').length, 2);
  assert.deepEqual(TESTPERSONEN.filter((p) => p.art === 'child').length, 0);
  TESTPERSONEN.forEach((p, i) => { if (p.von) assert.ok(TESTPERSONEN.findIndex((x) => x.name === p.von) < i, p.name); });
  assert.equal(TESTPERSONEN.find((p) => p.name === 'peter.ahlborn').von, 'admin');
  assert.equal(TESTPERSONEN.find((p) => p.name === 'jonas.testpapa').von, 'admin');
});

jedeWelt('ohne --anlegen: nur ansehen - nichts im Speicher, keine lokale Datei', async (W, ordner) => {
  const r = await L(W, ordner, false);
  assert.deepEqual(Object.values(status(r)), Array(3).fill('fehlt'));
  assert.equal(fs.existsSync(path.join(ordner, 'testpersonen.json')), false);
  if (W.dateien) assert.deepEqual(W.dateien(), []);
  assert.match(r.aus, /nur angesehen, nichts geschrieben/);
});

jedeWelt('--anlegen: Admin wird lokal angelegt, die beiden Elternteile bekommen Startcodes; alles nur in der lokalen Datei', async (W, ordner) => {
  const r = await L(W, ordner, true);
  const s = status(r);
  assert.equal(s.admin, 'neu angelegt (Anmeldung mit Name und Passwort)');
  for (const n of ['peter.ahlborn', 'jonas.testpapa']) assert.match(s[n], /^Startcode ausgestellt, gueltig bis 2026-11-11 17:00 UTC$/, n);
  const st = lesen(ordner), text = fs.readFileSync(path.join(ordner, 'testpersonen.txt'), 'utf8');
  const g = geheimnisse(st);
  assert.equal(g.length, 4, 'ein Passwort, ein Wiederherstellungscode, zwei Startcodes');
  const pw = st.personen.admin.passwort;
  assert.equal(pwWeak(pw, 'admin'), false, 'Admin-Passwort stark');
  for (const x of g) { assert.ok(text.includes(x), 'in der Datei'); assert.equal(r.aus.includes(x), false, 'nie in der Ausgabe'); }
  // Startlink fuer die Anmeldung im Testbau (Aufgabe "Anmeldung im Testbau"): #start=<name>/<code>
  for (const [n, s] of Object.entries(st.personen)) if (s.startcode) assert.ok(text.includes('Startlink: https://big-quest-test.github.io/#start=' + n + '/' + s.startcode.code), 'Startlink ' + n);
  assert.match(text, /peter\.ahlborn .*Peter Ahlborn/);
  assert.match(text, /jonas\.testpapa .*Jonas Testpapa/);
  assert.match(text, /Kathie legt Peter spaeter selbst in der App an/);
  assert.match(r.aus, /testpersonen\.txt/);
  if (W.dateien) {
    const d = W.dateien();
    assert.equal(d.filter(([p]) => /\/directory\//.test(p)).length, 1, 'ein Konto im Verzeichnis');
    assert.equal(d.filter(([p]) => /\/invites\//.test(p)).length, 2, 'zwei Einladungen');
    const alles = d.map(([p, v]) => p + ' ' + (typeof v === 'string' ? v : JSON.stringify(v))).join('\n').toLowerCase();
    // (die Art des Kontos - "admin", "parent" ... - steht absichtlich lesbar im Verzeichnis, Konto-Modul; Namen nie)
    // kurze Woerter nur als eigenes Wort (mitten in base64 kommen kurze Woerter wie "anna" zufaellig vor - 05.11. einmal rot)
    const wortIn = (w) => (w.length >= 10 ? alles.includes(w) : new RegExp('(^|[^a-z0-9+/_=-])' + w + '($|[^a-z0-9+/_=-])').test(alles));
    for (const wort of [...NICHT_VORANGELEGT, 'peter', 'ahlborn', 'jonas', 'testpapa', ...g.map((x) => x.toLowerCase())]) assert.equal(wortIn(wort), false, 'nicht im Speicher: ' + wort);
  }
});

jedeWelt('die Startcodes und Passwoerter funktionieren: beide Elternteile kommen vom Admin; der Admin meldet sich mit Passwort an', async (W, ordner) => {
  await L(W, ordner, true);
  const st = lesen(ordner).personen;
  const erst = async (n, pw) => ersteAnmeldung({ zugang: W.geraet('d_' + n.replace('.', '')), code: st[n].startcode.code, passwort: pw, now: W.uhr.t + 1000, runden: R });
  for (const n of ['peter.ahlborn', 'jonas.testpapa']) {
    const k = await erst(n, 'Koala-Bread-Cliff-5502');
    assert.equal(k.aussteller.kennung, st.admin.kennung, n + ' vom Admin');
    assert.equal(k.aussteller.art, 'admin');
    assert.equal(k.art, 'parent');
    assert.equal(k.anmeldename, n);
  }
  await assert.rejects(erst('peter.ahlborn', 'Koala-Bread-Cliff-5502'), (e) => e.code === 'startcode-ungueltig', 'Startcode nur einmal');
  const a = await anmelden({ zugang: W.geraet('d_Xadmin'), anmeldename: 'admin', passwort: st.admin.passwort, runden: R });
  assert.equal(a.kennung, st.admin.kennung, 'admin: Anmeldung mit Name und Passwort');
  const w = await wiederherstellen({ zugang: W.geraet('d_W'), anmeldename: 'admin', code: st.admin.wiederherstellungscode, neuesPasswort: 'Lemur-Kite-Fern-7319', runden: R });
  assert.equal(w.kennung, st.admin.kennung, 'Wiederherstellungscode aus der Datei passt');
});

jedeWelt('zweiter Lauf: nichts doppelt, gueltige Codes bleiben, benutzte werden vermerkt; nach Ablauf neue Codes, alte gelten nicht mehr', async (W, ordner) => {
  await L(W, ordner, true);
  const st1 = lesen(ordner).personen;
  await ersteAnmeldung({ zugang: W.geraet('d_PA'), code: st1['peter.ahlborn'].startcode.code, passwort: 'Puffin-Jam-Lake-9876', now: W.uhr.t, runden: R });
  W.uhr.t += 2 * TAG;
  const r2 = await L(W, ordner, true), s2 = status(r2), st2 = lesen(ordner).personen;
  assert.equal(s2['peter.ahlborn'], 'angemeldet (Startcode benutzt)');
  assert.equal(st2['peter.ahlborn'].benutzt, true); assert.equal(st2['peter.ahlborn'].startcode, null);
  assert.equal(s2.admin, 'angelegt (Anmeldung mit Name und Passwort)');
  assert.match(s2['jonas.testpapa'], /^Startcode gueltig bis 2026-11-11/, 'jonas.testpapa');
  assert.equal(st2['jonas.testpapa'].startcode.code, st1['jonas.testpapa'].startcode.code, 'jonas.testpapa gleicher Code');
  assert.equal(st2.admin.passwort, st1.admin.passwort);
  // weniger als ein Tag Rest: ansehen meldet es, anlegen stellt neu aus
  W.uhr.t = T0 + KONTO_STARTCODE_MS - STARTCODE_RESERVE_MS + 1000;
  assert.equal(status(await L(W, ordner, false))['jonas.testpapa'], 'Startcode abgelaufen oder laeuft heute ab');
  W.uhr.t = T0 + KONTO_STARTCODE_MS + 1000;
  const r3 = await L(W, ordner, true), st3 = lesen(ordner).personen;
  assert.match(status(r3)['jonas.testpapa'], /^Startcode neu, gueltig bis 2026-11-18/, 'jonas.testpapa');
  assert.notEqual(st3['jonas.testpapa'].startcode.code, st1['jonas.testpapa'].startcode.code);
  await assert.rejects(ersteAnmeldung({ zugang: W.geraet('d_AA'), code: st1['jonas.testpapa'].startcode.code, passwort: 'Koala-Bread-Cliff-5502', now: W.uhr.t, runden: R }), (e) => e.code === 'startcode-abgelaufen');
  const a = await ersteAnmeldung({ zugang: W.geraet('d_AA'), code: st3['jonas.testpapa'].startcode.code, passwort: 'Koala-Bread-Cliff-5502', now: W.uhr.t, runden: R });
  assert.equal(a.aussteller.kennung, st1.admin.kennung);
});

jedeWelt('Schutz: fremde Konten ohne lokales Passwort und ein geaendertes Passwort brechen ab; schon Angelegtes bleibt gemerkt', async (W, ordner) => {
  await L(W, ordner, true);
  const anderer = fs.mkdtempSync(path.join(os.tmpdir(), 'bq-tp-anderer-'));
  try { await assert.rejects(L(W, anderer, true), /Konto admin gibt es schon, aber die lokale Datei kennt sein Passwort nicht/); }
  finally { fs.rmSync(anderer, { recursive: true, force: true }); }
  const st = lesen(ordner);
  st.personen.admin.passwort = 'Falsch-Falsch-Falsch-0000';
  fs.writeFileSync(path.join(ordner, 'testpersonen.json'), JSON.stringify(st));
  await assert.rejects(L(W, ordner, true), /Konto admin: das Passwort aus der lokalen Datei oeffnet es nicht mehr/);
  // Abbruch mitten im Anlegen (Speicher weg nach dem Admin): das Admin-Passwort ist trotzdem in der Datei
  const neu = fs.mkdtempSync(path.join(os.tmpdir(), 'bq-tp-abbruch-'));
  try {
    const W2 = WELTEN.Simulation(), z = W2.geraet('d_Werkzeug1');
    let n = 0;
    const kaputt = { ...z, directory: async (l) => { if (++n > 2) { const e = new Error('offline'); e.code = 'offline'; throw e; } return z.directory(l); } };
    await assert.rejects(testpersonenLauf({ zugang: kaputt, now: W2.uhr.t, anlegen: true, ordner: neu, runden: R, ausgabe: () => {} }), /offline/);
    const gemerkt = JSON.parse(fs.readFileSync(path.join(neu, 'testpersonen.json'), 'utf8')).personen;
    assert.ok(gemerkt.admin && gemerkt.admin.passwort, 'Admin-Passwort gemerkt');
    assert.equal((await anmelden({ zugang: z, anmeldename: 'admin', passwort: gemerkt.admin.passwort, runden: R })).kennung, gemerkt.admin.kennung);
  } finally { fs.rmSync(neu, { recursive: true, force: true }); }
});

jedeWelt('Einladungen (Aufgabe "Erstanmeldung per QR-Code"): je Person eine HTML-Datei mit QR-Code und Link (Zugangscode + Startcode), nur lokal; benutzte Codes ohne Datei', async (W, ordner) => {
  const ZC = 'github_pat_ZUGANGSCODE_' + 'w4'.repeat(20);
  const r = await L(W, ordner, true, { zugangscode: ZC });
  const dir = path.join(ordner, 'einladungen'), dateien = fs.readdirSync(dir).sort();
  assert.deepEqual(dateien, ['Big-Quest-Einladung-jonas.testpapa.html', 'Big-Quest-Einladung-peter.ahlborn.html', 'Geraet-verbinden-admin.html']);
  assert.deepEqual([...r.einladungen].sort(), dateien);
  assert.equal(r.aus.includes(ZC), false, 'Zugangscode nie in der Ausgabe');
  assert.match(r.aus, /Einladungen \(3, nur auf diesem Rechner/);
  const st = lesen(ordner).personen, lies = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
  // Erwachsene: E-Mail-Entwurf mit Link und QR-Code; der Link traegt Zugangscode, Startcode und die Pruefwoerter des Ausstellers
  const mail = lies('Big-Quest-Einladung-peter.ahlborn.html');
  const link = anmEinladungslink(TESTINSTANZ.adresse, { zugang: ZC, anmeldename: 'peter.ahlborn', code: st['peter.ahlborn'].startcode.code, fingerabdruck: st['peter.ahlborn'].startcode.fp });
  assert.ok(mail.includes('href="' + link.replace(/&/g, '&amp;') + '"'), 'Link');
  assert.ok(mail.includes(/<path fill="#000" d="([^"]*)"/.exec(anmQr(link, 'x'))[1]), 'QR-Code traegt genau diesen Link');
  for (const s of ['tippen Sie auf den Link', 'gilt 7 Tage', 'nur für eine Anmeldung']) assert.ok(mail.includes(s), s);
  // der Link oeffnet die Registrierung: Pruefwoerter passen (der Code bleibt gueltig)
  const e = anmEinladungLesen(link.slice(link.indexOf('#')));
  assert.equal(e.zugang, ZC);
  assert.equal((await startcodeAnsehen({ zugang: W.geraet('d_Peter'), code: e.start.code, fingerabdruck: e.start.fingerabdruck, now: W.uhr.t })).anmeldename, 'peter.ahlborn');
  // Werkzeug-Konto: nur "Geraet verbinden" (kein Passwort in der Datei)
  const verb = lies('Geraet-verbinden-admin.html');
  assert.ok(verb.includes('#zugang=' + ZC + '"') && !verb.includes('start='), 'nur der Zugangscode');
  assert.equal(verb.includes(st.admin.passwort), false, 'kein Passwort in der Datei');
  // ein benutzter Startcode: beim naechsten Lauf keine Einladung mehr fuer diese Person
  await ersteAnmeldung({ zugang: W.geraet('d_PS'), code: st['peter.ahlborn'].startcode.code, passwort: 'Koala-Bread-Cliff-5502', now: W.uhr.t, runden: R });
  await L(W, ordner, true, { zugangscode: ZC });
  assert.equal(fs.existsSync(path.join(dir, 'Big-Quest-Einladung-peter.ahlborn.html')), false);
  // ohne Zugangscode (z. B. Tests): keine Einladungen; testpersonen.txt nennt, wo der Zugangscode liegt (ohne ihn)
  const txt = fs.readFileSync(path.join(ordner, 'testpersonen.txt'), 'utf8');
  assert.match(txt.split('\n')[2], /^Zugangscode \(verbindet ein Geraet, einmal je Geraet - nicht das Passwort einer Person\): steht in %LOCALAPPDATA%\\bis-school-app\\testdaten-token\.txt/);
  assert.equal(txt.includes(ZC), false);
});

test('Ausgabe: ein Geheimnis in der Ausgabe wird nicht ausgegeben (Gegenprobe der Pruefung)', async () => {
  const W = WELTEN.Simulation(), ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'bq-tp-aus-'));
  try {
    await L(W, ordner, true);
    const st = lesen(ordner);
    // ein "Startcode", der zufaellig in der normalen Ausgabe steht: die Pruefung muss ihn finden und nichts ausgeben
    st.personen['jonas.testpapa'].startcode.code = 'Testpersonen';
    fs.writeFileSync(path.join(ordner, 'testpersonen.json'), JSON.stringify(st));
    const aus = [];
    await assert.rejects(testpersonenLauf({ zugang: W.geraet('d_Werkzeug1'), now: W.uhr.t, anlegen: false, ordner, runden: R, ausgabe: (t) => aus.push(t) }), /Ausgabe enthielte 1 Geheimnis/);
    assert.deepEqual(aus, []);
    assert.ok(await kontoLookup('jonas.testpapa'));
  } finally { fs.rmSync(ordner, { recursive: true, force: true }); }
});
