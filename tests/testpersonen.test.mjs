// Stufe 3c, Werkzeug-Teil: Testpersonen fuer die Testinstanz (werkzeug/testpersonen.mjs). Zwei Familien mit gleichen
// Namen, eine Lehrkraft, ein Admin - im Verzeichnis ueber das Konto-Modul; Startcodes, Passwoerter und
// Wiederherstellungscodes nur in der lokalen Datei, nie in der Ausgabe, nie im Speicher im Klartext.
// Gegen die Simulation UND den nachgebauten GitHub-Server (gleicher Vertrag). Ohne Browser.
//   node --test tests/testpersonen.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TESTPERSONEN, STARTCODE_RESERVE_MS, testpersonenLauf, geheimnisse } from '../werkzeug/testpersonen.mjs';
import { TESTINSTANZ } from '../werkzeug/testinstanz.mjs';
import { KONTO_STARTCODE_MS, kontoLookup, ersteAnmeldung, anmelden, wiederherstellen } from '../src/module/konto.mjs';
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

test('Liste: zwei Familien mit gleichen Namen, eine Lehrkraft, ein Admin; Aussteller kommt vor der Person', () => {
  assert.deepEqual(TESTPERSONEN.map((p) => p.name), ['admin', 'lehrkraft', 'peter.a', 'anna.a', 'kathie.a', 'peter.b', 'anna.b', 'kathie.b']);
  const fam = (f) => TESTPERSONEN.filter((p) => p.familie === f).map((p) => [p.art, p.eintragen.replace(/, Geburtsdatum.*/, '')]);
  assert.deepEqual(fam('A'), fam('B'), 'gleiche Namen in beiden Familien');
  assert.notEqual(TESTPERSONEN.find((p) => p.name === 'kathie.a').eintragen, TESTPERSONEN.find((p) => p.name === 'kathie.b').eintragen, 'Geburtsdatum unterscheidet');
  assert.deepEqual(TESTPERSONEN.filter((p) => p.art === 'teacher').length, 1);
  assert.deepEqual(TESTPERSONEN.filter((p) => p.art === 'admin').length, 1);
  TESTPERSONEN.forEach((p, i) => { if (p.von) assert.ok(TESTPERSONEN.findIndex((x) => x.name === p.von) < i, p.name); });
  assert.equal(TESTPERSONEN.find((p) => p.name === 'kathie.a').von, 'peter.a');
  assert.equal(TESTPERSONEN.find((p) => p.name === 'kathie.b').von, 'peter.b');
});

jedeWelt('ohne --anlegen: nur ansehen - nichts im Speicher, keine lokale Datei', async (W, ordner) => {
  const r = await L(W, ordner, false);
  assert.deepEqual(Object.values(status(r)), Array(8).fill('fehlt'));
  assert.equal(fs.existsSync(path.join(ordner, 'testpersonen.json')), false);
  if (W.dateien) assert.deepEqual(W.dateien(), []);
  assert.match(r.aus, /nur angesehen, nichts geschrieben/);
});

jedeWelt('--anlegen: Admin und die beiden Peter legt das Werkzeug an, die anderen bekommen Startcodes; alles nur in der lokalen Datei', async (W, ordner) => {
  const r = await L(W, ordner, true);
  const s = status(r);
  for (const n of ['admin', 'peter.a', 'peter.b']) assert.equal(s[n], 'neu angelegt (Anmeldung mit Name und Passwort)', n);
  for (const n of ['lehrkraft', 'anna.a', 'anna.b', 'kathie.a', 'kathie.b']) assert.match(s[n], /^Startcode ausgestellt, gueltig bis 2026-11-11 17:00 UTC$/, n);
  const st = lesen(ordner), text = fs.readFileSync(path.join(ordner, 'testpersonen.txt'), 'utf8');
  const g = geheimnisse(st);
  assert.equal(g.length, 3 * 2 + 5, 'drei Passwoerter, drei Wiederherstellungscodes, fuenf Startcodes');
  const pw = ['admin', 'peter.a', 'peter.b'].map((n) => st.personen[n].passwort);
  assert.equal(new Set(pw).size, 3, 'jedes Passwort zufaellig und eigen');
  for (const [i, p] of pw.entries()) assert.equal(pwWeak(p, ['admin', 'peter.a', 'peter.b'][i]), false, 'stark: ' + i);
  for (const x of g) { assert.ok(text.includes(x), 'in der Datei'); assert.equal(r.aus.includes(x), false, 'nie in der Ausgabe'); }
  assert.match(text, /kathie\.a .*Kathie Beispiel, Geburtsdatum 14\.05\.2017/);
  // Startlink fuer die Anmeldung im Testbau (Aufgabe "Anmeldung im Testbau"): #start=<name>/<code>
  for (const [n, s] of Object.entries(st.personen)) if (s.startcode) assert.ok(text.includes('Startlink: https://pahlborn.github.io/bis-school-app-test/#start=' + n + '/' + s.startcode.code), 'Startlink ' + n);
  assert.match(text, /kathie\.b .*Kathie Beispiel, Geburtsdatum 03\.09\.2017/);
  assert.match(r.aus, /testpersonen\.txt/);
  if (W.dateien) {
    const d = W.dateien();
    assert.equal(d.filter(([p]) => /\/directory\//.test(p)).length, 3, 'drei Konten im Verzeichnis');
    assert.equal(d.filter(([p]) => /\/invites\//.test(p)).length, 5, 'fuenf Einladungen');
    const alles = d.map(([p, v]) => p + ' ' + (typeof v === 'string' ? v : JSON.stringify(v))).join('\n').toLowerCase();
    // (die Art des Kontos - "admin", "parent" ... - steht absichtlich lesbar im Verzeichnis, Konto-Modul; Namen nie)
    // kurze Woerter nur als eigenes Wort (mitten in base64 kommen vier Buchstaben wie "anna" zufaellig vor - 05.11. einmal rot)
    const wortIn = (w) => (w.length >= 10 ? alles.includes(w) : new RegExp('(^|[^a-z0-9+/_=-])' + w + '($|[^a-z0-9+/_=-])').test(alles));
    for (const wort of ['kathie', 'peter', 'anna', 'lehrkraft', 'beispiel', '2017', ...g.map((x) => x.toLowerCase())]) assert.equal(wortIn(wort), false, 'nicht im Speicher: ' + wort);
  }
});

jedeWelt('die Startcodes und Passwoerter funktionieren: Kinder haengen an ihrem Peter, Anna und Lehrkraft am Admin; Familien getrennt', async (W, ordner) => {
  await L(W, ordner, true);
  const st = lesen(ordner).personen;
  const erst = async (n, pw) => ersteAnmeldung({ zugang: W.geraet('d_' + n.replace('.', '')), code: st[n].startcode.code, passwort: pw, now: W.uhr.t + 1000, runden: R });
  const ka = await erst('kathie.a', 'Puffin-Jam-Lake-9876'), kb = await erst('kathie.b', 'Otter-Cake-Moss-1234');
  assert.equal(ka.art, 'child'); assert.equal(ka.anmeldename, 'kathie.a');
  assert.equal(ka.aussteller.kennung, st['peter.a'].kennung, 'Kathie A haengt an Peter A');
  assert.equal(kb.aussteller.kennung, st['peter.b'].kennung, 'Kathie B haengt an Peter B');
  assert.notEqual(ka.aussteller.fingerabdruck, kb.aussteller.fingerabdruck);
  assert.equal(ka.kennung, st['kathie.a'].kennung);
  for (const n of ['anna.a', 'anna.b', 'lehrkraft']) {
    const k = await erst(n, 'Koala-Bread-Cliff-5502');
    assert.equal(k.aussteller.kennung, st.admin.kennung, n + ' vom Admin'); assert.equal(k.aussteller.art, 'admin');
    assert.equal(k.art, n === 'lehrkraft' ? 'teacher' : 'parent');
  }
  await assert.rejects(erst('kathie.a', 'Puffin-Jam-Lake-9876'), (e) => e.code === 'startcode-ungueltig', 'Startcode nur einmal');
  for (const n of ['admin', 'peter.a', 'peter.b']) {
    const k = await anmelden({ zugang: W.geraet('d_X' + n.replace('.', '')), anmeldename: n, passwort: st[n].passwort, runden: R });
    assert.equal(k.kennung, st[n].kennung, n + ': Anmeldung mit Name und Passwort');
  }
  const w = await wiederherstellen({ zugang: W.geraet('d_W'), anmeldename: 'peter.b', code: st['peter.b'].wiederherstellungscode, neuesPasswort: 'Lemur-Kite-Fern-7319', runden: R });
  assert.equal(w.kennung, st['peter.b'].kennung, 'Wiederherstellungscode aus der Datei passt');
});

jedeWelt('zweiter Lauf: nichts doppelt, gueltige Codes bleiben, benutzte werden vermerkt; nach Ablauf neue Codes, alte gelten nicht mehr', async (W, ordner) => {
  await L(W, ordner, true);
  const st1 = lesen(ordner).personen;
  await ersteAnmeldung({ zugang: W.geraet('d_KA'), code: st1['kathie.a'].startcode.code, passwort: 'Puffin-Jam-Lake-9876', now: W.uhr.t, runden: R });
  W.uhr.t += 2 * TAG;
  const r2 = await L(W, ordner, true), s2 = status(r2), st2 = lesen(ordner).personen;
  assert.equal(s2['kathie.a'], 'angemeldet (Startcode benutzt)');
  assert.equal(st2['kathie.a'].benutzt, true); assert.equal(st2['kathie.a'].startcode, null);
  assert.equal(s2.admin, 'angelegt (Anmeldung mit Name und Passwort)');
  for (const n of ['lehrkraft', 'anna.a', 'anna.b', 'kathie.b']) { assert.match(s2[n], /^Startcode gueltig bis 2026-11-11/, n); assert.equal(st2[n].startcode.code, st1[n].startcode.code, n + ' gleicher Code'); }
  assert.equal(st2.admin.passwort, st1.admin.passwort);
  // weniger als ein Tag Rest: ansehen meldet es, anlegen stellt neu aus
  W.uhr.t = T0 + KONTO_STARTCODE_MS - STARTCODE_RESERVE_MS + 1000;
  assert.equal(status(await L(W, ordner, false))['anna.a'], 'Startcode abgelaufen oder laeuft heute ab');
  W.uhr.t = T0 + KONTO_STARTCODE_MS + 1000;
  const r3 = await L(W, ordner, true), st3 = lesen(ordner).personen;
  for (const n of ['lehrkraft', 'anna.a', 'anna.b', 'kathie.b']) { assert.match(status(r3)[n], /^Startcode neu, gueltig bis 2026-11-18/, n); assert.notEqual(st3[n].startcode.code, st1[n].startcode.code); }
  await assert.rejects(ersteAnmeldung({ zugang: W.geraet('d_AA'), code: st1['anna.a'].startcode.code, passwort: 'Koala-Bread-Cliff-5502', now: W.uhr.t, runden: R }), (e) => e.code === 'startcode-abgelaufen');
  const a = await ersteAnmeldung({ zugang: W.geraet('d_AA'), code: st3['anna.a'].startcode.code, passwort: 'Koala-Bread-Cliff-5502', now: W.uhr.t, runden: R });
  assert.equal(a.aussteller.kennung, st1.admin.kennung);
});

jedeWelt('Schutz: fremde Konten ohne lokales Passwort und ein geaendertes Passwort brechen ab; schon Angelegtes bleibt gemerkt', async (W, ordner) => {
  await L(W, ordner, true);
  const anderer = fs.mkdtempSync(path.join(os.tmpdir(), 'bq-tp-anderer-'));
  try { await assert.rejects(L(W, anderer, true), /Konto admin gibt es schon, aber die lokale Datei kennt sein Passwort nicht/); }
  finally { fs.rmSync(anderer, { recursive: true, force: true }); }
  const st = lesen(ordner);
  st.personen['peter.a'].passwort = 'Falsch-Falsch-Falsch-0000';
  fs.writeFileSync(path.join(ordner, 'testpersonen.json'), JSON.stringify(st));
  await assert.rejects(L(W, ordner, true), /Konto peter\.a: das Passwort aus der lokalen Datei oeffnet es nicht mehr/);
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

test('Ausgabe: ein Geheimnis in der Ausgabe wird nicht ausgegeben (Gegenprobe der Pruefung)', async () => {
  const W = WELTEN.Simulation(), ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'bq-tp-aus-'));
  try {
    await L(W, ordner, true);
    const st = lesen(ordner);
    // ein "Startcode", der zufaellig in der normalen Ausgabe steht: die Pruefung muss ihn finden und nichts ausgeben
    st.personen['kathie.a'].startcode.code = 'Testpersonen';
    fs.writeFileSync(path.join(ordner, 'testpersonen.json'), JSON.stringify(st));
    const aus = [];
    await assert.rejects(testpersonenLauf({ zugang: W.geraet('d_Werkzeug1'), now: W.uhr.t, anlegen: false, ordner, runden: R, ausgabe: (t) => aus.push(t) }), /Ausgabe enthielte 1 Geheimnis/);
    assert.deepEqual(aus, []);
    assert.ok(await kontoLookup('kathie.a'));
  } finally { fs.rmSync(ordner, { recursive: true, force: true }); }
});
