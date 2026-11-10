// Schulbewertungen uebernehmen (Vorbereitung Stufe 4, 05.11.): werkzeug/schulbewertungen-uebernehmen.mjs schreibt die
// Bewertungen der Schule als school_import in den Bereich schule:<Kind> eines NEUEN Kontos - unterschrieben von einem
// Elternteil, mit Zaehlprobe vorher/nachher. Testpersonen "Peter/Anna/Kathie Beispiel", Testdaten mit der Struktur von
// werkzeug/schuldaten.json und erfundenen Werten (tests/schuldaten-beispiel.json). Kathies echte Datei wird nur gelesen
// (Struktur), nie veraendert. Jede Pruefung gegen die Simulation UND den nachgebauten GitHub-Server; dazu der Testbau:
// der Elternbereich zeigt danach dieselben Einstufungen, Luecken und denselben Fokus wie heute.
//   node --test tests/schulimport.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import {
  schulbewertungenUebernehmen, schuldatenPruefen, schulZaehlen, zaehlUnterschiede, schalterLesen, nurLesen, kanon,
  SCHULIMPORT_FEHLER, SCHULIMPORT_DATEI, SCHULIMPORT_GERAET,
} from '../werkzeug/schulbewertungen-uebernehmen.mjs';
import { abgleichMitVerbindungen, verbindungen, kindAnlegen, elternteilEinladen } from '../src/module/einladung.mjs';
import { startcodeAusstellen, ersteAnmeldung } from '../src/module/konto.mjs';
import { meineGeraete } from '../src/module/geraete.mjs';
import { deriveSchool } from '../src/module/ableitung.mjs';
import { newEvent } from '../src/module/ereignisse.mjs';
import { lokalerSpeicher } from '../src/module/speicher.mjs';
import { githubSpeicher } from '../src/module/github.mjs';
import { githubNachbau } from './module/github-nachbau.mjs';
import { appSandbox } from './app-sandbox.mjs';
import { konto as altKonto } from './konten-hilfen.mjs';
import { kontenEinsetzen } from '../werkzeug/konten.mjs';

const R = 1000;                                                   // PBKDF2-Runden in den Tests (die App: 600 000)
const T0 = Date.UTC(2026, 10, 5, 9, 0, 0), HEUTE = '2026-11-05';
const PW = { verwalter: 'Tiger-Lamp-River-4271', peter: 'Otter-Cake-Moss-1234', anna: 'Koala-Bread-Cliff-5502', kathie: 'Puffin-Jam-Lake-9876', peterb: 'Gecko-Plum-Reef-6060', kathieb: 'Walrus-Taco-Pine-1357' };
const BEISPIEL = JSON.parse(fs.readFileSync(new URL('./schuldaten-beispiel.json', import.meta.url), 'utf8'));
const ZUORDNUNG = { kathie: 'kathie.beispiel' };
const REPO = 'pahlborn/bis-school-app-testdaten';
const TOKEN = 'github_pat_SCHULIMPORT_' + 'q8W3'.repeat(10);
const sha = (p) => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const ECHT_VORHER = fs.existsSync(SCHULIMPORT_DATEI) ? sha(SCHULIMPORT_DATEI) : null;
let N, lauf = 0;
before(async () => { N = await githubNachbau({ token: TOKEN, repos: [REPO] }); });
after(async () => {
  await N.schliessen();
  if (ECHT_VORHER) assert.equal(sha(SCHULIMPORT_DATEI), ECHT_VORHER, 'Kathies echte schuldaten.json ist unveraendert');
});

/* eine Welt = ein Speicher mit stellbarer Uhr; schreibzaehler: was wirklich im Speicher ankommt (je Geraet) */
const WELTEN = {
  Simulation: () => { const uhr = { t: T0 }, s = lokalerSpeicher({ now: () => uhr.t }); return { uhr, roh: (d) => s.geraet(d) }; },
  'GitHub (Nachbau)': () => {
    const uhr = { t: T0 }, wurzel = 'schulimport-' + (++lauf);
    return { uhr, roh: (d) => githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis, wurzel, now: () => uhr.t }).geraet(d) };
  },
};
/* ersetzt Funktionen eines Zugangs - auch in seinen Sitzungen (Modul github: eine Sitzung schreibt ueber den
   urspruenglichen Zugang, Aufgabe "Abgleich in der App") */
function umhuellen(z, ersatz) {
  const out = { ...z, ...ersatz(z) };
  if (typeof z.sitzung === 'function') out.sitzung = () => umhuellen(z.sitzung(), ersatz);
  return out;
}
const SCHREIBEN = ['put', 'putKey', 'putDirectory', 'removeArea', 'removeDirectory'];
function welt(neu) {
  const W = neu();
  W.schreibvorgaenge = [];
  W.geraet = (d) => umhuellen(W.roh(d), (z) => ({
    ...Object.fromEntries(SCHREIBEN.map((f) => [f, async (...a) => { W.schreibvorgaenge.push([d, f]); return z[f](...a); }])),
    invite: { ...z.invite, put: async (...a) => { W.schreibvorgaenge.push([d, 'invite.put']); return z.invite.put(...a); }, delete: async (...a) => { W.schreibvorgaenge.push([d, 'invite.delete']); return z.invite.delete(...a); } },
  }));
  W.speicher = { geraet: (d) => W.geraet(d) };
  return W;
}
const jedeWelt = (name, fn) => { for (const [w, neu] of Object.entries(WELTEN)) test(`${w}: ${name}`, () => fn(welt(neu))); };
const weiter = (W, ms = 60 * 1000) => (W.uhr.t += ms);

const ablage = () => { const m = new Map(); return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } }; };
function geraet(W, d, konto) {
  const a = ablage(); a.setItem('bq2_evDevice', JSON.stringify(d));
  const g = {
    a, d, konto, z: () => W.geraet(d),
    sync: () => abgleichMitVerbindungen({ ablage: a, zugang: W.geraet(d), konten: [g.konto], now: weiter(W), heute: HEUTE }),
    log: (kind) => JSON.parse(a.getItem('bq2_' + kind + '__events') || '[]'),
    importe: (kind) => g.log(kind).filter((e) => e.type === 'school_import'),
  };
  return g;
}
async function einloesen(W, d, qr, passwort) {
  return geraet(W, d, await ersteAnmeldung({ zugang: W.geraet(d), code: qr.code, passwort, fingerabdruck: qr.fingerabdruck, now: W.uhr.t, runden: R }));
}
/* Familie A: Peter (Gruender), Anna (eingeladen), Kathie (von Peter angelegt); Familie B: Peter B und Kathie B */
async function familien(W) {
  const sa = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: null, anmeldename: 'verwalter', art: 'admin', now: W.uhr.t });
  const admin = await ersteAnmeldung({ zugang: W.geraet('d_A1'), code: sa.code, passwort: PW.verwalter, now: W.uhr.t, runden: R });
  const eltern = async (name, d, pw) => { const s = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: admin, anmeldename: name, art: 'parent', now: W.uhr.t }); const E = await einloesen(W, d, s, pw); await E.sync(); return E; };
  const kind = async (E, name, anzeige, d, pw) => {
    const qr = await kindAnlegen({ zugang: E.z(), ablage: E.a, konto: E.konto, anmeldename: name, anzeigename: anzeige, now: weiter(W) });
    const K = await einloesen(W, d, qr, pw);
    await K.sync(); await E.sync(); await K.sync();
    return K;
  };
  const P = await eltern('peter.beispiel', 'd_P1', PW.peter);
  const K = await kind(P, 'kathie.beispiel', 'Kathie Beispiel', 'd_K1', PW.kathie);
  const e = await elternteilEinladen({ zugang: P.z(), ablage: P.a, konto: P.konto, anmeldename: 'anna.beispiel', now: weiter(W) });
  const A = await einloesen(W, 'd_N1', e, PW.anna);
  await A.sync(); await P.sync(); await A.sync();
  const PB = await eltern('peter.b', 'd_P2', PW.peterb);
  const KB = await kind(PB, 'kathie.b', 'Kathie Beispiel', 'd_K2', PW.kathieb);
  assert.deepEqual(verbindungen({ ablage: A.a, konto: A.konto, now: W.uhr.t }).kinder.map((c) => c.id), [K.konto.kennung], 'Anna sieht Kathie');
  return { P, K, A, PB, KB };
}
const uebernehmen = (W, extra = {}) => schulbewertungenUebernehmen({ speicher: W.speicher, anmeldename: 'peter.beispiel', passwort: PW.peter, schule: BEISPIEL, zuordnung: ZUORDNUNG, now: weiter(W), heute: HEUTE, runden: R, ...extra });
async function fehlt(p, code) {
  assert.ok(SCHULIMPORT_FEHLER.includes(code), 'bekannter Code ' + code);
  await assert.rejects(p, (e) => { assert.equal(e.code, code, e.message); return true; });
}

/* ---------- Bausteine ohne Speicher ---------- */
test('Testdaten haben die Struktur von Kathies Datei; Kathies Datei wird angenommen (nur gelesen) - Zaehlprobe so, wie die App zaehlt', () => {
  assert.deepEqual(schuldatenPruefen(BEISPIEL), []);
  const z = schulZaehlen(BEISPIEL.kinder.kathie);
  assert.deepEqual([z.aufgaben, z.wartend, z.bewertungen], [6, 1, 16]);
  assert.equal(z.jeStandardUndTag['2026-10-20 M-N1'], 1);
  assert.equal(z.jeStandardUndTag['2026-09-24 M-N3'], 1);
  assert.equal(Object.keys(z.jeStandardUndTag).length, 16);
  const wartend = JSON.parse(JSON.stringify(BEISPIEL.kinder.kathie)); wartend.tasks[5].std = { 'M-N1': 'C' };
  assert.equal(schulZaehlen(wartend).bewertungen, 16, 'eine wartende Aufgabe zaehlt nicht (wie index.html schoolRatings)');
  if (!ECHT_VORHER) return;                                       // ohne die Datei (z. B. anderer Rechner): nur die Testdaten
  const echt = JSON.parse(fs.readFileSync(SCHULIMPORT_DATEI, 'utf8'));
  assert.deepEqual(schuldatenPruefen(echt), [], 'das Werkzeug nimmt Kathies Datei an');
  assert.deepEqual(Object.keys(echt.kinder), Object.keys(BEISPIEL.kinder), 'gleiche alte Kennung');
  const felder = (d) => [...new Set(d.tasks.flatMap((t) => Object.keys(t)))].sort();
  assert.deepEqual(felder(BEISPIEL.kinder.kathie), felder(echt.kinder.kathie), 'gleiche Felder je Aufgabe');
  assert.ok(schulZaehlen(echt.kinder.kathie).bewertungen > 0);
  for (const t of BEISPIEL.kinder.kathie.tasks) assert.ok(!echt.kinder.kathie.tasks.some((x) => x.title === t.title || x.good.de === t.good.de), 'erfundene Werte, keine echten');
});

test('Pruefungen der Datei und der Zuordnung: unbekannte Einstufung, fehlende Zuordnung, Passwort als Schalter, Repo der App', () => {
  const kaputt = JSON.parse(JSON.stringify(BEISPIEL)); kaputt.kinder.kathie.tasks[0].std['M-N1'] = 'X';
  assert.match(schuldatenPruefen(kaputt).join(), /Einstufung von M-N1 unbekannt/);
  const ohneDatum = JSON.parse(JSON.stringify(BEISPIEL)); ohneDatum.kinder.kathie.asOf = '2026-13-01';
  assert.match(schuldatenPruefen(ohneDatum).join(), /asOf/);
  assert.deepEqual(schalterLesen(['--repo', 'pahlborn/bis-school-app-testdaten', '--zuordnung', 'kathie=kathie.beispiel', '--probe']).zuordnung, ZUORDNUNG);
  assert.throws(() => schalterLesen(['--zuordnung', 'kathie=kathie.beispiel']), /--repo/);
  assert.throws(() => schalterLesen(['--repo', 'pahlborn/bis-school-app', '--zuordnung', 'kathie=k.b']), /Repo der App/);
  assert.throws(() => schalterLesen(['--repo', 'pahlborn/bis-school-app-test', '--zuordnung', 'kathie=k.b']), /Repo der App/);
  assert.throws(() => schalterLesen(['--repo', 'a/b', '--passwort', 'x']), /nie als Schalter/);
  assert.throws(() => schalterLesen(['--repo', 'a/b', '--zuordnung', 'kathie']), /alte Kennung/);
  const a = schulZaehlen(BEISPIEL.kinder.kathie), b = schulZaehlen({ ...BEISPIEL.kinder.kathie, tasks: BEISPIEL.kinder.kathie.tasks.slice(1) });
  assert.ok(zaehlUnterschiede(a, b).some((x) => /2026-10-20 M-N1: vorher 1, nachher 0/.test(x)));
  assert.deepEqual(zaehlUnterschiede(a, schulZaehlen(JSON.parse(JSON.stringify(BEISPIEL.kinder.kathie)))), []);
  const text = JSON.parse(JSON.stringify(BEISPIEL.kinder.kathie)); text.tasks[0].next.en += '!';
  assert.deepEqual(zaehlUnterschiede(a, schulZaehlen(text)), ['Pruefsumme ueber alle Inhalte verschieden'], 'gleiche Zahlen, anderer Text: Pruefsumme');
});

test('deriveSchool: neuester Stand gewinnt, bei gleichem Stand der spaetere; ungueltige Importe zaehlen nie', () => {
  const ev = (asOf, at, data, id) => ({ ...newEvent({ type: 'school_import', author: 'p_A', device: 'd_A', at, payload: { asOf, data: { asOf: data.asOf ?? asOf, tasks: data.tasks ?? [] }, source: 'toddle' } }), ...(id ? { id } : {}) });
  const now = T0;
  assert.equal(deriveSchool([], { now }), null);
  const alt = ev('2026-10-01', '2026-10-02T10:00:00Z', { tasks: [{ n: 1 }] }), neu = ev('2026-10-20', '2026-10-03T10:00:00Z', { tasks: [{ n: 2 }] });
  const spaeterAlt = ev('2026-10-01', '2026-10-30T10:00:00Z', { tasks: [{ n: 3 }] });
  assert.deepEqual(deriveSchool([spaeterAlt, neu, alt], { now }).tasks, [{ n: 2 }], 'neuester Stand, nicht neueste Zeit');
  const gleich = ev('2026-10-20', '2026-10-04T10:00:00Z', { tasks: [{ n: 4 }] });
  assert.deepEqual(deriveSchool([gleich, neu], { now }).tasks, [{ n: 4 }], 'gleicher Stand: der spaetere');
  assert.equal(deriveSchool([ev('2026-10-20', '2026-10-04T10:00:00Z', { asOf: '2026-10-21' })], { now }), null, 'asOf passt nicht zu den Daten');
  assert.throws(() => deriveSchool([], {}), /now/);
  const r = deriveSchool([neu], { now }); r.tasks.push(1);
  assert.deepEqual(deriveSchool([neu], { now }).tasks, [{ n: 2 }], 'Kopie');
});

/* ---------- mit Speicher ---------- */
jedeWelt('Probelauf schreibt nichts; Uebernahme: Zaehlprobe gleich, Kind und beide Eltern rechnen denselben Stand; zweiter Lauf schreibt gar nichts', async (W) => {
  const { P, K, A, PB, KB } = await familien(W);
  // Probelauf: nichts kommt im Speicher an
  W.schreibvorgaenge.length = 0;
  const pr = await uebernehmen(W, { probe: true });
  assert.deepEqual(W.schreibvorgaenge, [], 'Probelauf: kein einziger Schreibzugriff');
  assert.deepEqual(pr.kinder.map((k) => [k.alt, k.neu, k.status, k.kennung]), [['kathie', 'kathie.beispiel', 'wuerde-uebernommen', K.konto.kennung]]);
  assert.match(pr.zeilen[0], /PROBELAUF/);
  assert.ok(pr.zeilen.some((z) => /kathie -> kathie\.beispiel: 6 Aufgaben \(1 wartet auf Bewertung\), 16 Bewertungen an 4 Tagen - wuerde uebernommen/.test(z)), pr.zeilen.join('\n'));
  await P.sync();
  assert.deepEqual(P.importe(K.konto.kennung), [], 'nach dem Probelauf: nichts da');

  // Uebernahme
  const r = await uebernehmen(W);
  assert.deepEqual(r.kinder.map((k) => k.status), ['uebernommen']);
  assert.deepEqual(r.kinder[0].nachher, r.kinder[0].vorher, 'Zaehlprobe gleich');
  assert.equal(r.geraete.length, 1);
  assert.ok(r.zeilen.some((z) => /Zaehlprobe gleich/.test(z)));
  assert.ok(r.zeilen.some((z) => /^\s+2026-10-20\s+M-N1\s+1\s+1$/.test(z)), r.zeilen.join('\n'));
  for (const z of r.zeilen) assert.ok(!z.includes(PW.peter), 'kein Passwort im Bericht');
  // Kind (zum Rechnen, Weg A), Peter und Anna: genau ein Import, unterschrieben von Peter, gleicher Stand wie die Datei
  for (const [G, wer] of [[K, 'Kathie'], [P, 'Peter'], [A, 'Anna']]) {
    await G.sync();
    const im = G.importe(K.konto.kennung);
    assert.equal(im.length, 1, wer + ': ein Import');
    assert.equal(im[0].author, P.konto.kennung, wer + ': von Peter');
    assert.equal(im[0].payload.source, 'toddle');
    assert.equal(kanon(deriveSchool(G.log(K.konto.kennung), { now: W.uhr.t })), kanon(BEISPIEL.kinder.kathie), wer + ': gleicher Stand');
  }
  // das Werkzeug ist ein Geraet von Peter (Meine Geraete)
  const g = meineGeraete({ ablage: P.a, person: P.konto.kennung, now: W.uhr.t });
  assert.ok(g.some((x) => x.geraet === r.geraete[0] && x.name === SCHULIMPORT_GERAET), JSON.stringify(g));
  // Familie B unberuehrt
  await PB.sync(); await KB.sync();
  assert.deepEqual(PB.importe(KB.konto.kennung), [], 'Familie B: nichts');
  assert.ok(!JSON.stringify([...PB.a.m.values()]).includes('Pocket Money Plan'), 'Familie B sieht nichts davon');

  // zweiter Lauf: gleicher Stand -> nichts geschrieben, Zaehlprobe trotzdem gelesen und gleich
  W.schreibvorgaenge.length = 0;
  const r2 = await uebernehmen(W);
  assert.deepEqual(r2.kinder.map((k) => k.status), ['schon-uebernommen']);
  assert.deepEqual(r2.kinder[0].nachher, r2.kinder[0].vorher);
  assert.deepEqual(r2.geraete, []);
  assert.deepEqual(W.schreibvorgaenge, [], 'zweiter Lauf: kein Schreibzugriff, kein neues Geraet');
  await P.sync();
  assert.equal(P.importe(K.konto.kennung).length, 1, 'keine Doppelung');
  // Probelauf nach der Uebernahme: "schon uebernommen"
  assert.deepEqual((await uebernehmen(W, { probe: true })).kinder.map((k) => k.status), ['schon-uebernommen']);
  for (const G of [P, A, K]) assert.deepEqual((await G.sync()).warnungen, []);
});

jedeWelt('Neuer Stand der Schule ersetzt den alten; aelterer Stand bricht ab ohne zu schreiben', async (W) => {
  const { P, K } = await familien(W);
  await uebernehmen(W);
  const neu = JSON.parse(JSON.stringify(BEISPIEL));
  neu.kinder.kathie.asOf = '2026-11-01';
  neu.kinder.kathie.tasks.unshift({ day: '2026-10-30', area: 'math', title: 'Fraction Pizza', std: { 'M-N2': 'M' }, quests: ['numbers'], focusNext: ['numbers'], good: { de: 'gut', en: 'good' }, next: { de: 'weiter', en: 'next' } });
  const r = await uebernehmen(W, { schule: neu });
  assert.deepEqual(r.kinder.map((k) => [k.status, k.ersetzt]), [['uebernommen', true]]);
  assert.equal(r.kinder[0].nachher.bewertungen, 17);
  await P.sync();
  assert.equal(P.importe(K.konto.kennung).length, 2);
  assert.equal(deriveSchool(P.log(K.konto.kennung), { now: W.uhr.t }).asOf, '2026-11-01', 'der neue Stand zaehlt');
  // die alte Datei noch einmal: aelter als der Stand im Speicher -> Abbruch, nichts geschrieben
  W.schreibvorgaenge.length = 0;
  await fehlt(uebernehmen(W), 'neuere-daten');
  assert.deepEqual(W.schreibvorgaenge, []);
});

jedeWelt('Gegenproben: falsches Passwort, Kind statt Elternteil, fremde Familie, kein Kind, unbekannt, Zuordnung fehlt/zu viel, kaputte Datei - nie ein Schreibzugriff', async (W) => {
  const { P, K } = await familien(W);
  W.schreibvorgaenge.length = 0;
  await fehlt(uebernehmen(W, { passwort: 'Falsch-Falsch-Falsch-0000' }), 'anmeldung');
  await fehlt(uebernehmen(W, { anmeldename: 'niemand.da' }), 'anmeldung');
  await fehlt(uebernehmen(W, { anmeldename: 'kathie.beispiel', passwort: PW.kathie }), 'nicht-elternteil');
  await fehlt(uebernehmen(W, { zuordnung: { kathie: 'kathie.b' } }), 'nicht-in-familie');
  await fehlt(uebernehmen(W, { zuordnung: { kathie: 'anna.beispiel' } }), 'kein-kind');
  await fehlt(uebernehmen(W, { zuordnung: { kathie: 'kathie.gibtsnicht' } }), 'kind-unbekannt');
  await fehlt(uebernehmen(W, { zuordnung: {} }), 'zuordnung');
  await fehlt(uebernehmen(W, { zuordnung: { kathie: 'kathie.beispiel', lia: 'lia.beispiel' } }), 'zuordnung');
  await fehlt(uebernehmen(W, { zuordnung: { kathie: 'Kathie Beispiel' } }), 'zuordnung');
  const zwei = JSON.parse(JSON.stringify(BEISPIEL)); zwei.kinder.lia = zwei.kinder.kathie;
  await fehlt(uebernehmen(W, { schule: zwei }), 'zuordnung');
  await fehlt(uebernehmen(W, { schule: zwei, zuordnung: { kathie: 'kathie.beispiel', lia: 'kathie.beispiel' } }), 'zuordnung');
  const kaputt = JSON.parse(JSON.stringify(BEISPIEL)); kaputt.kinder.kathie.tasks[1].std['E-S1'] = 'gut';
  await fehlt(uebernehmen(W, { schule: kaputt }), 'schuldaten');
  // auch der zweite Elternteil eines Kindes einer fremden Familie kann nichts: Peter B fuer Kathie A
  await fehlt(uebernehmen(W, { anmeldename: 'peter.b', passwort: PW.peterb }), 'nicht-in-familie');
  assert.deepEqual(W.schreibvorgaenge, [], 'kein einziger Schreibzugriff');
  await P.sync();
  assert.deepEqual(P.importe(K.konto.kennung), []);
});

jedeWelt('Gegenprobe Zaehlprobe: kommt im Speicher etwas anderes an als in der Datei, bricht das Werkzeug ab und meldet die Unterschiede', async (W) => {
  const { P, K } = await familien(W);
  // ein Speicher, der meldet "geschrieben", aber im Bereich schule nichts ablegt (verlorener Schreibzugriff)
  const echt = W.speicher;
  let verloren = 0;
  W.speicher = { geraet: (d) => umhuellen(echt.geraet(d), (z) => ({ put: async (b, g, x) => { if (/^schule:/.test(b)) { verloren++; return g + '/' + x.nr; } return z.put(b, g, x); } })) };
  await assert.rejects(uebernehmen(W), (e) => {
    assert.equal(e.code, 'zaehlprobe');
    assert.ok(e.unterschiede.includes('bewertungen: vorher 16, nachher 0') && e.unterschiede.some((u) => /2026-10-20 M-N1: vorher 1, nachher 0/.test(u)), e.unterschiede.join('; '));
    return true;
  });
  assert.ok(verloren > 0, 'das Werkzeug hat geschrieben - erst die Zaehlprobe merkt den Verlust');
  await P.sync();
  assert.deepEqual(P.importe(K.konto.kennung), []);
});

test('nurLesen: Schreiben wird zurueckgehalten und gezaehlt, Einladungen werden nie verbraucht', async () => {
  const s = lokalerSpeicher(), z = nurLesen(s.geraet('d_X'));
  await s.geraet('d_Y').invite.put('echt1', { a: 1 });
  assert.equal(await z.put('kind:lern:p_A', 'd_X', { nr: 1, inhalt: {} }), 'd_X/1');
  await z.putKey('b', 'p_A', {}); await z.putDirectory({ lookup: 'v1' }); await z.invite.put('i1', {}); await z.invite.delete('i1');
  await assert.rejects(z.invite.get('i1'), (e) => e.code === 'unbekannt');
  await assert.rejects(z.invite.get('echt1'), (e) => e.code === 'unbekannt');
  assert.deepEqual(await s.geraet('d_Y').invite.get('echt1'), { a: 1 }, 'die echte Einladung ist nicht verbraucht');
  await s.geraet('d_X').putDirectory({ lookup: 'v2' }); await s.geraet('d_X').put('kind:lern:p_B', 'd_X', { nr: 1, inhalt: {} });
  await z.removeDirectory('v2'); await z.removeArea('kind:lern:p_B');
  assert.ok(await s.geraet('d_X').directory('v2'), 'Loeschen zurueckgehalten (Verzeichnis)');
  assert.deepEqual((await s.geraet('d_X').list('kind:lern:p_B', null)).kennungen, ['d_X/1'], 'Loeschen zurueckgehalten (Bereich)');
  assert.equal(z.zurueckgehalten(), 7);
  assert.deepEqual((await s.geraet('d_X').list('kind:lern:p_A', null)).kennungen, []);
  assert.equal(await s.geraet('d_X').directory('v1'), null);
});

/* ---------- Testbau: der Elternbereich zeigt danach dasselbe wie heute ---------- */
/* Heute: die Bewertungen sind in die App eingebaut (SCHOOL_DATA, Marke BQ_SCHULE). Nach der Uebernahme: die App rechnet
   sie aus dem Protokoll des Kindes (deriveSchool). Bis die Familienfassung das in index.html verdrahtet, setzt dieser
   Test genau diese Rechnung an der Marke ein - index.html bleibt unveraendert. */
const MARKE = '/*BQ_SCHULE*/null';
const AUS_PROTOKOLL = "(()=>{const o={};for(const u of APP_ACCOUNTS.users){if(u.role!=='student')continue;let l=[];try{l=JSON.parse(localStorage.getItem('bq2_'+u.id+'__events')||'[]');}catch(e){}const d=deriveSchool(l,{now:Date.now()});if(d)o[u.id]=d;}return o;})()";
function einsetzen(h, konten, schule) {
  const t = kontenEinsetzen(h, konten).toString('utf8'), teile = t.split(MARKE);
  assert.equal(teile.length, 2, 'Schulmarke genau einmal');
  return teile[0] + schule + teile[1];
}
function elternbereich(S) {
  return JSON.parse(JSON.stringify(S.lauf(() => {
    S.holen('state').pview = null; S.holen('renderSheets')();
    const h = S.holen;
    return {
      verlauf: h('schoolHTML')(),
      faecher: Object.fromEntries(h('SUBJECTS').map((s) => [s.key, h('schoolSubjectHTML')(s.key)])),
      luecken: JSON.parse(JSON.stringify(h('openGaps')())),
      fokus: h('classTopics')().slice(),
      autoFokus: h('focusTopics')().slice(),
      kapitel: S.$('#aboutBody').querySelectorAll('details.psec').map((d) => d.dataset.psec),
    };
  })));   // (eigene Kopie: die Sandbox hat eigene Array-Prototypen)
}

test('Testbau: nach der Uebernahme zeigt der Elternbereich dieselben Einstufungen der Schule, Luecken und denselben Fokus wie heute', async () => {
  const W = welt(WELTEN.Simulation);
  const { P, K } = await familien(W);
  // Peters Laptop: Kontenliste der App mit denselben Kennungen
  const konten = { version: 2, users: [{ id: K.konto.kennung, user: 'kathie.beispiel', kind: 'child', start: (await altKonto('kathie.beispiel', 'student', 'KATH-2345')).start }, { id: P.konto.kennung, user: 'peter.beispiel', kind: 'adult', start: (await altKonto('peter.beispiel', 'parent', 'PAPA-2345')).start }], guardians: [{ adult: P.konto.kennung, child: K.konto.kennung }] };
  const app = (schule) => {
    const speicher = Object.fromEntries(P.a.m); speicher.bq2_adultSession = JSON.stringify({ user: 'peter.beispiel', id: P.konto.kennung });
    return appSandbox({ bauart: 'test', seite: true, seed: 4711, speicher, anpassen: (h) => einsetzen(h, konten, schule) });
  };
  const ohne = elternbereich(app(AUS_PROTOKOLL));                  // Gegenprobe: vor der Uebernahme nichts
  assert.match(ohne.verlauf, /Noch keine|No school|keine/i, 'vor der Uebernahme: keine Schuldaten');
  assert.deepEqual(ohne.luecken, []);

  await uebernehmen(W);
  await P.sync();
  const heute = elternbereich(app(JSON.stringify({ [K.konto.kennung]: BEISPIEL.kinder.kathie })));
  const S = app(AUS_PROTOKOLL), nachher = elternbereich(S);
  // es gibt wirklich etwas zu sehen
  assert.ok(heute.verlauf.includes('Pocket Money Plan') && heute.verlauf.includes('Goal Setting Reflection'), 'Verlauf mit den Aufgaben');
  assert.ok(heute.faecher.maths.includes('Aus der Schule') || heute.faecher.maths.includes('From school'), 'Mathe: aus der Schule');
  assert.ok(heute.luecken.length >= 2, 'schwache Einstufungen sind Luecken: ' + JSON.stringify(heute.luecken.map((g) => g.s)));
  assert.ok(heute.luecken.some((g) => g.s === 'M-N3' && g.st === 'C'), 'M-N3 (zuletzt C) ist eine Luecke');
  assert.ok(heute.fokus.includes('wordprob'), 'naechster Schritt der Schule im Fokus');
  assert.ok(heute.kapitel.includes('school'));
  // und genau dasselbe nach der Uebernahme
  assert.deepEqual(nachher, heute, 'Elternbereich gleich');
  assert.notDeepEqual(ohne.fokus, heute.fokus, 'Gegenprobe: ohne Schuldaten ein anderer Fokus');
  assert.equal(JSON.stringify(S.holen('eventErrors')), '[]');
});

jedeWelt('Zwei Eltern schreiben parallel: Konflikt, gemeinsame Fassung und Auflösung werden abgeglichen', async (W) => {
  const { P, A, K } = await familien(W);
  const child = K.konto.kennung;
  const id = n => '7d97af5e-6e19-46b8-85c6-d3c950a776' + n;
  const initial = { child, evaluation: id('80'), revision: id('81'), title: 'Fiktive Bewertung', day: HEUTE,
    standard: 'M-N5', rating: 'C', focus: 'two-step' };
  const append = (device, payload) => {
    const e = newEvent({ type: 'school_evaluation', author: device.konto.kennung, device: device.d,
      at: new Date(weiter(W)).toISOString(), payload });
    device.a.setItem('bq2_' + child + '__events', JSON.stringify([...device.log(child), e]));
  };
  const task = device => deriveSchool(device.log(child), { now: W.uhr.t }).tasks[0];

  append(P, initial);
  await P.sync();
  await A.sync();
  assert.equal(task(A).manual.revision, initial.revision);
  append(P, { ...initial, base: initial.revision, revision: id('82'), title: 'Elternteil A' });
  append(A, { ...initial, base: initial.revision, revision: id('83'), title: 'Elternteil B',
    standard: 'M-N3', focus: 'round-distance' });
  await P.sync();
  await A.sync();
  await K.sync();
  await P.sync();
  for (const device of [P, A, K]) {
    assert.equal(task(device).manual.revision, initial.revision);
    assert.deepEqual(task(device).manual.conflicts, [id('82'), id('83')]);
    assert.deepEqual(task(device).focusNext, ['wordprob']);
  }

  append(A, { ...initial, base: initial.revision, revision: id('84'), title: 'Gemeinsam bestätigte Fassung',
    standard: 'M-N3', focus: 'round-distance', resolves: [id('82'), id('83')] });
  await A.sync();
  await P.sync();
  await K.sync();
  for (const device of [P, A, K]) {
    assert.equal(task(device).manual.revision, id('84'));
    assert.deepEqual(task(device).manual.conflicts, []);
    assert.deepEqual(task(device).focusNext, ['round']);
    assert.equal(task(device).manual.history.length, 4);
  }
});
