// Modul kinddaten (Vorbereitung Stufe 4, Aufgabe "Export und Loeschen"; EP12: US12.1, US12.2, E8; Konzept 7.2, 13).
// Jede Pruefung laeuft gegen die Simulation UND den nachgebauten GitHub-Server. Geraete sind Ablagen ohne App.
//   node --test tests/module/kinddaten.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { KINDDATEN_FEHLER, KINDDATEN_FORMAT, KINDDATEN_STELLEN, kindDatenExport, kindDatenLoeschen, kontoDatenLoeschen } from '../../src/module/kinddaten.mjs';
import { verbindungen, kindAnlegen, elternteilEinladen, abgleichMitVerbindungen, kindLokalEntfernen, EINLADUNG_FEHLER } from '../../src/module/einladung.mjs';
import { KONTO_FEHLER, startcodeAusstellen, ersteAnmeldung, anmelden, kontoLookup } from '../../src/module/konto.mjs';
import { lokalerSpeicher, SPEICHER_FEHLER } from '../../src/module/speicher.mjs';
import { githubSpeicher } from '../../src/module/github.mjs';
import { githubNachbau } from './github-nachbau.mjs';
import { GERAETEABGLEICH_SPEICHER } from '../../src/module/geraeteabgleich.mjs';
import { newEvent } from '../../src/module/ereignisse.mjs';
import { schluesselLesen } from '../../src/module/bereiche.mjs';
import { appLesen } from '../../werkzeug/module.mjs';

const R = 1000;
const T0 = Date.UTC(2026, 10, 5, 8, 0, 0), HEUTE = '2026-11-05';
const PW = { verwalter: 'Tiger-Lamp-River-4271', peter: 'Otter-Cake-Moss-1234', anna: 'Koala-Bread-Cliff-5502', kathie: 'Puffin-Jam-Lake-9876', berta: 'Heron-Fig-Dune-2468', kathieb: 'Walrus-Taco-Pine-1357', neu: 'Gecko-Plum-Reef-6060' };
const REPO = 'pahlborn/bis-school-app-testdaten';
const TOKEN = 'github_pat_KINDDATEN_' + 'q7W2'.repeat(10);
let N, lauf = 0;
before(async () => { N = await githubNachbau({ token: TOKEN, repos: [REPO] }); });
after(async () => { await N.schliessen(); });

const WELTEN = {
  Simulation: () => { const uhr = { t: T0 }, s = lokalerSpeicher({ now: () => uhr.t }); return { uhr, geraet: (d) => s.geraet(d), dateien: null }; },
  'GitHub (Nachbau)': () => {
    const uhr = { t: T0 }, wurzel = 'kinddaten-' + (++lauf);
    return { uhr, geraet: (d) => githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis, wurzel, now: () => uhr.t }).geraet(d), dateien: () => [...N.dateien().keys()].filter((p) => p.startsWith(wurzel + '/')) };
  },
};
const jedeWelt = (name, fn) => { for (const [w, neu] of Object.entries(WELTEN)) test(`${w}: ${name}`, () => fn(neu())); };
const weiter = (W, ms = 60 * 1000) => (W.uhr.t += ms);
async function fehlt(p, code, text) {
  assert.ok(KINDDATEN_FEHLER.includes(code) || KONTO_FEHLER.includes(code) || SPEICHER_FEHLER.includes(code) || EINLADUNG_FEHLER.includes(code), 'bekannter Code ' + code);
  await assert.rejects(p, (e) => { assert.equal(e.code, code, text); return true; }, text);
}

/* Ablage wie der Browser-Speicher (key/length/removeItem: so raeumt kindLokalEntfernen alles weg) */
function ablage() {
  const m = new Map();
  return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); }, key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; } };
}
function geraet(W, d, konto, name) {
  const a = ablage(); a.setItem('bq2_evDevice', JSON.stringify(d));
  const g = {
    a, d, konto,
    z: () => W.geraet(d),
    sync: () => abgleichMitVerbindungen({ ablage: a, zugang: W.geraet(d), konten: [g.konto], now: weiter(W), heute: HEUTE, geraetName: name }),
    v: () => verbindungen({ ablage: a, konto: g.konto, now: W.uhr.t }),
    log: (kind) => JSON.parse(a.getItem('bq2_' + kind + '__events') || '[]'),
    antworten: (kind) => g.log(kind).filter((e) => e.type === 'answer').length,
    schreibt: (kind, type, payload) => {
      const k = 'bq2_' + kind + '__events', l = JSON.parse(a.getItem(k) || '[]');
      l.push(newEvent({ type, author: g.konto.kennung, device: d, at: new Date(weiter(W, 1000)).toISOString(), payload }));
      a.setItem(k, JSON.stringify(l));
    },
    ueben: (n) => { for (let i = 0; i < n; i++) g.schreibt(g.konto.kennung, 'answer', { day: HEUTE, skill: 'numbers', level: 2, attempt: 1, ok: true, qid: 'q' + i + '_' + W.uhr.t }); },
    spuren: (kind) => [...a.m.keys()].filter((k) => k.includes(kind)).concat(Object.keys(JSON.parse(a.getItem(GERAETEABGLEICH_SPEICHER.staende) || '{}')).filter((x) => x.endsWith(':' + kind))),
  };
  return g;
}
async function einloesen(W, d, qr, passwort, name) {
  return geraet(W, d, await ersteAnmeldung({ zugang: W.geraet(d), code: qr.code, passwort, fingerabdruck: qr.fingerabdruck, now: W.uhr.t, runden: R }), name);
}
async function adminAnlegen(W) {
  const sa = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: null, anmeldename: 'verwalter', art: 'admin', now: W.uhr.t });
  return ersteAnmeldung({ zugang: W.geraet('d_A1'), code: sa.code, passwort: PW.verwalter, now: W.uhr.t, runden: R });
}
/* eine Familie: Elternteil (Gruender), wahlweise zweiter Elternteil, ein Kind, das uebt */
async function familie(W, admin, { eltern, kind, zweiter, pw, d }) {
  const sp = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: admin, anmeldename: eltern, art: 'parent', now: W.uhr.t });
  const P1 = await einloesen(W, 'd_' + d + '1', sp, pw.eltern, eltern + ' Laptop');
  await P1.sync();
  let P2 = null;
  if (zweiter) {
    const e = await elternteilEinladen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, anmeldename: zweiter, now: weiter(W) });
    P2 = await einloesen(W, 'd_' + d + '2', e, pw.zweiter, zweiter + ' Handy');
    await P2.sync(); await P1.sync(); await P2.sync();
  }
  const qr = await kindAnlegen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, anmeldename: kind, anzeigename: 'Kathie', now: weiter(W) });
  const K = await einloesen(W, 'd_' + d + 'K', qr, pw.kind, kind + ' iPad');
  await K.sync(); await P1.sync(); await K.sync();
  if (P2) await P2.sync();
  await P1.sync();
  K.ueben(3); await K.sync(); await P1.sync();
  if (P2) await P2.sync();
  return { P1, P2, K };
}
/* Familie A (Peter, Anna, Kathie) mit Daten in jeder Speicherstelle des Kindes, Familie B (Berta, Kathie B) */
async function welt(W, { mitAnna = true } = {}) {
  const admin = await adminAnlegen(W);
  const A = await familie(W, admin, { eltern: 'peter', zweiter: mitAnna ? 'anna' : null, kind: 'kathie', d: 'P', pw: { eltern: PW.peter, zweiter: PW.anna, kind: PW.kathie } });
  const B = await familie(W, admin, { eltern: 'berta', kind: 'kathie.b', d: 'B', pw: { eltern: PW.berta, kind: PW.kathieb } });
  const { P1, K } = A, kk = K.konto.kennung;
  // Kind: Profil, Lernen, Einstellungen des Kindes
  for (const [t, p] of [['profile_set', { field: 'emoji', value: '🦊' }], ['profile_set', { field: 'kidLang', value: 'en' }], ['profile_set', { field: 'muted', value: true }],
    ['round_done', { day: HEUTE, skill: 'numbers', stars: 3, count: 5 }], ['badge', { day: HEUTE, badge: 'first-steps' }], ['review', { day: HEUTE, qid: 'q0', box: 0 }],
    ['practice_day', { day: HEUTE }], ['rank_seen', { rank: 'Investigator' }], ['sheet_created', { sheet: 's1', day: HEUTE, no: 1, writing: 'en', items: [] }],
    ['checklist_set', { studio: 'reading', index: 0, value: true }], ['day_flag', { flag: 'greetDay', day: HEUTE }], ['day_flag', { flag: 'mysteryDone', day: HEUTE }], ['day_flag', { flag: 'bdayParty', day: HEUTE }],
    ['advent_open', { year: 2026, door: 1 }], ['joke_seen', { joke: 'j1' }], ['story_read', { story: 's1' }]]) K.schreibt(kk, t, p);
  // Eltern: Nachname, Geburtstag, Einstellungen, Schule, Luecken, Freigabe, Sicherung
  for (const [t, p] of [['profile_set', { field: 'lastName', value: 'Beispiel' }], ['profile_set', { field: 'birthday', value: '2017-05-14' }],
    ['setting_set', { setting: 'focusMode', value: 'manual' }], ['setting_set', { setting: 'storyCap', value: 2 }], ['list_set', { list: 'focusManual', item: 'numbers', on: true }], ['list_set', { list: 'unlocked', item: 'space', on: true }],
    ['school_import', { asOf: '2026-11-01', source: 'test', data: { 'MA.3.1': [{ day: '2026-10-20', level: 'Meeting expectations' }], 'EN.3.2': [{ day: '2026-10-22', level: 'Consolidating' }] } }],
    ['gap_state', { standard: 'EN.3.2', state: 'hold', by: 'parents', schoolDay: '2026-10-22', day: HEUTE }], ['gap_active', { standard: 'EN.3.2' }],
    ['grant_set', { grant: 'g1', grantee: 'p_LEHRKRAFT1', scope: ['learning', 'school'], from: HEUTE, until: '2026-11-30', text: 'Einwilligung' }],
    ['backup_made', { day: HEUTE }]]) P1.schreibt(kk, t, p);
  await K.sync(); await P1.sync(); await K.sync();
  if (A.P2) await A.P2.sync();
  await P1.sync();
  B.K.ueben(2); await B.K.sync(); await B.P1.sync();
  return { admin, ...A, B };
}
const KIND_BEREICHE = (kk) => ['kind:lern', 'kind:privat', 'schule', 'eltern:allg', 'person'].map((a) => a + ':' + kk);
/* findet irgendjemand im Speicher noch etwas von diesem Bereich? */
async function leer(W, area) {
  const z = W.geraet('d_PRUEF');
  return (await z.list(area)).kennungen.length === 0 && Object.keys(await z.keys(area)).length === 0;
}

/* ---------- Export ---------- */
jedeWelt('Export: jede Speicherstelle aus 7.2 kommt vor, mit Wert oder Grund; JSON und lesbare Seite; beide Eltern bekommen dieselben Daten', async (W) => {
  const { P1, P2, K, B } = await welt(W);
  const kk = K.konto.kennung;
  await P1.sync(); await P2.sync();
  const x = await kindDatenExport({ ablage: P1.a, konto: P1.konto, kind: kk, now: weiter(W), heute: HEUTE });
  const d = JSON.parse(x.json);
  assert.deepEqual(d, JSON.parse(JSON.stringify(x.daten)), 'JSON = Objekt');
  assert.deepEqual([d.format, d.v, d.kind.kennung, d.kind.anmeldename, d.von.anmeldename], [KINDDATEN_FORMAT, 1, kk, 'kathie', 'peter']);
  assert.deepEqual(x.dateiname, { json: 'big-quest-kathie-' + HEUTE + '.json', html: 'big-quest-kathie-' + HEUTE + '.html' });
  // jede Speicherstelle (werkzeug/speicherstellen.json, alle Abschnitte) steht im Export
  const json = JSON.parse(fs.readFileSync(new URL('../../werkzeug/speicherstellen.json', import.meta.url), 'utf8'));
  const tabelle = Object.entries(json).filter(([k]) => !k.startsWith('_')).flatMap(([, l]) => l.map((s) => s.key.replace(/^bq2?_|^bq/, '')));
  assert.deepEqual([...new Set(tabelle)].sort(), Object.keys(d.speicherstellen).sort(), 'Export nennt genau die Speicherstellen aus 7.2');
  for (const s of KINDDATEN_STELLEN) {
    const e = d.speicherstellen[s.key];
    if (s.bereich === 'geraet' || s.bereich === 'person') assert.ok(e.imExport === false && e.grund, s.key + ': Grund, warum nicht');
    else assert.equal(e.imExport, true, s.key);
  }
  // die Werte des Kindes (aus allen Bereichen) sind da
  const w = d.daten;
  assert.deepEqual([w.name, w.lastName, w.birthday, w.emoji, w.kidLang, w.muted], ['Kathie', 'Beispiel', '2017-05-14', '🦊', 'en', true]);
  assert.ok(w.attempts.length === 3 && w.total >= 3 && w.badges['first-steps'] && w.rankSeen === 'Investigator' && w.sheetNo === 1, 'Lernstand');
  assert.ok(w.best_ && Object.keys(w.best_).length && w.chk_ && w.advent && w.ev && w.due && w.tried, 'Praefix-Stellen und abgeleitete Werte');
  assert.deepEqual([w.focusMode, w.focusManual, w.unlocked, w.storyCap, w.greetDay, w.mysteryDone, w.bdayParty, w.storyRead, w.jokeSeen], ['manual', ['numbers'], ['space'], 2, HEUTE, HEUTE, HEUTE, ['s1'], ['j1']]);
  assert.equal(w.gaps.active, 'EN.3.2');
  assert.deepEqual(w.grants.map((g) => [g.id || g.grant, g.grantee]).map((g) => g[1]), ['p_LEHRKRAFT1']);
  assert.ok(w.grantlog.length >= 1 && w.lastBackup === HEUTE, 'Freigaben mit Protokoll, Sicherung');
  assert.ok(w.events.length >= 30 && w.events.every((e) => e.id && e.type), 'alle Ereignisse');
  assert.deepEqual(d.schulbewertungen.map((s) => [s.asOf, Object.keys(s.data).sort()]), [['2026-11-01', ['EN.3.2', 'MA.3.1']]], 'Schulbewertungen');
  assert.deepEqual(d.geraete.map((g) => [g.geraet, g.name]), [['d_PK', 'kathie iPad']], 'Geraete des Kindes');
  const lern = d.zugriff.find((z) => z.bereich === 'kind:lern:' + kk);
  assert.deepEqual(lern.mitglieder.map((m) => [m.name, m.rolle]).sort(), [['anna', 'parent'], ['kathie', 'child'], ['peter', 'parent']], 'wer einen Schluessel hat');
  assert.ok(d.zugriff.some((z) => z.bereich === 'freigabe:g1'), 'Bereich der Freigabe');
  assert.ok(d.hinweise.some((h) => /Versionsgeschichte/.test(h)), 'Hinweis Git-Historie');
  // lesbare Seite
  for (const t of ['Alle Daten von Kathie Beispiel', 'Profil', 'Lernstand', 'Schulische Einstufungen', 'MA.3.1', 'Freigaben', 'Protokoll der Freigaben', 'Geräte', 'kathie iPad', 'Wer hat einen Schlüssel', 'Jede Speicherstelle der App', 'Versionsgeschichte', 'p_LEHRKRAFT1']) assert.ok(x.html.includes(t), 'Seite: ' + t);
  for (const s of KINDDATEN_STELLEN) assert.ok(x.html.includes('<code>' + s.key + '</code>'), 'Seite nennt ' + s.key);
  assert.equal(/<\/script|<script/i.test(x.html), false, 'kein Skript in der Seite');
  const en = await kindDatenExport({ ablage: P1.a, konto: P1.konto, kind: kk, now: W.uhr.t, heute: HEUTE, sprache: 'en' });
  assert.ok(en.html.includes('All data of Kathie Beispiel') && en.html.includes('<html lang="en">') && en.html.includes('School assessments'));
  // Anna bekommt dieselben Daten
  const y = await kindDatenExport({ ablage: P2.a, konto: P2.konto, kind: kk, now: W.uhr.t, heute: HEUTE });
  const ohne = (o) => { const c = { ...o }; delete c.events; return c; };
  assert.deepEqual(ohne(y.daten.daten), ohne(x.daten.daten), 'beide Eltern: dieselben Werte');
  // (Annas Protokoll hat zusaetzlich Peters Kopie der Freigabe aus dem Bereich der Freigabe - ohne Einwilligungstext)
  const ids = new Set(y.daten.daten.events.map((e) => e.id));
  assert.ok(x.daten.daten.events.every((e) => ids.has(e.id)), 'jedes Ereignis bei Peter ist auch bei Anna');
  assert.ok(y.daten.daten.events.filter((e) => !x.daten.daten.events.some((f) => f.id === e.id)).every((e) => e.type === 'grant_set' && !('text' in e.payload)), 'Rest: nur die Kopie der Freigabe');
  assert.deepEqual(y.daten.schulbewertungen, x.daten.schulbewertungen);
  // Rechte: Kind, Admin, Lehrkraft, fremde Familie
  await fehlt(kindDatenExport({ ablage: K.a, konto: K.konto, kind: kk, now: W.uhr.t, heute: HEUTE }), 'nicht-erlaubt', 'das Kind selbst');
  await fehlt(kindDatenExport({ ablage: P1.a, konto: { ...P1.konto, art: 'teacher' }, kind: kk, now: W.uhr.t, heute: HEUTE }), 'nicht-erlaubt', 'Lehrkraft');
  await fehlt(kindDatenExport({ ablage: P1.a, konto: { ...P1.konto, art: 'admin' }, kind: kk, now: W.uhr.t, heute: HEUTE }), 'nicht-erlaubt', 'Admin');
  await fehlt(kindDatenExport({ ablage: B.P1.a, konto: B.P1.konto, kind: kk, now: W.uhr.t, heute: HEUTE }), 'kind-unbekannt', 'fremde Familie');
  await fehlt(kindDatenExport({ ablage: P1.a, konto: P1.konto, kind: B.K.konto.kennung, now: W.uhr.t, heute: HEUTE }), 'kind-unbekannt', 'Kind der anderen Familie');
});

test('Export: Werte werden auf der Seite nie als HTML gelesen', async () => {
  const W = WELTEN.Simulation();
  const admin = await adminAnlegen(W);
  const { P1, K } = await familie(W, admin, { eltern: 'peter', kind: 'kathie', d: 'P', pw: { eltern: PW.peter, kind: PW.kathie } });
  const kk = K.konto.kennung;
  P1.schreibt(kk, 'profile_set', { field: 'name', value: '<img src=x onerror=alert(1)>' });
  P1.schreibt(kk, 'profile_set', { field: 'lastName', value: '</script><b>"&' });
  const x = await kindDatenExport({ ablage: P1.a, konto: P1.konto, kind: kk, now: weiter(W), heute: HEUTE });
  assert.equal(x.html.includes('<img'), false);
  assert.equal(/<\/script|<b>/i.test(x.html), false);
  assert.ok(x.html.includes('&lt;img src=x onerror=alert(1)&gt;') && x.html.includes('&lt;/script&gt;&lt;b&gt;&quot;&amp;'));
  assert.equal(x.daten.daten.name, '<img src=x onerror=alert(1)>', 'im JSON unveraendert');
});

/* ---------- Kind loeschen ---------- */
jedeWelt('Kind loeschen: alle Bereiche, Schluessel, Freigabe, Verzeichnis weg - niemand findet mehr etwas (auch Anna, das Kindergeraet), nichts entsteht neu; Familie B unberuehrt', async (W) => {
  const { P1, P2, K, B } = await welt(W);
  const kk = K.konto.kennung, bk = B.K.konto.kennung;
  const vorherB = W.dateien ? W.dateien().filter((p) => p.includes(bk) || p.includes(B.P1.konto.kennung)).sort() : null;
  const lookup = await kontoLookup('kathie');
  assert.ok(await W.geraet('d_PRUEF').directory(lookup), 'Ausgangslage: Verzeichniseintrag da');
  for (const a of [...KIND_BEREICHE(kk), 'freigabe:g1']) assert.equal(await leer(W, a), false, 'Ausgangslage: ' + a);
  // Rechte
  await fehlt(kindDatenLoeschen({ ablage: K.a, zugang: K.z(), konto: K.konto, kind: kk, now: weiter(W), heute: HEUTE }), 'nicht-erlaubt', 'das Kind selbst');
  await fehlt(kindDatenLoeschen({ ablage: B.P1.a, zugang: B.P1.z(), konto: B.P1.konto, kind: kk, now: weiter(W), heute: HEUTE }), 'kind-unbekannt', 'fremde Familie');
  await fehlt(kindDatenLoeschen({ ablage: P1.a, zugang: P1.z(), konto: { ...P1.konto, art: 'admin' }, kind: kk, now: weiter(W), heute: HEUTE }), 'nicht-erlaubt', 'Admin');
  assert.equal(await leer(W, 'kind:lern:' + kk), false, 'abgelehnt -> nichts geloescht');

  const r = await kindDatenLoeschen({ ablage: P1.a, zugang: P1.z(), konto: P1.konto, kind: kk, now: weiter(W), heute: HEUTE });
  assert.deepEqual(r.bereiche.map((b) => b.bereich).sort(), [...KIND_BEREICHE(kk), 'freigabe:g1'].sort());
  assert.ok(r.bereiche.find((b) => b.bereich === 'kind:lern:' + kk).buendel > 0 && r.verzeichnis >= 1, JSON.stringify(r));
  for (const a of [...KIND_BEREICHE(kk), 'freigabe:g1']) assert.equal(await leer(W, a), true, 'geloescht: ' + a);
  assert.equal(await W.geraet('d_PRUEF').directory(lookup), null, 'Verzeichniseintrag weg');
  assert.deepEqual(P1.spuren(kk), [], 'Peters Geraet: nichts mehr vom Kind');
  assert.deepEqual(P1.v().kinder, [], 'Peter sieht kein Kind mehr');
  // Anna: ihr naechster Abgleich raeumt auf
  const ra = await P2.sync();
  assert.deepEqual(ra.geloescht, [kk]);
  assert.deepEqual(P2.spuren(kk), [], 'Annas Geraet: nichts mehr vom Kind');
  assert.deepEqual(P2.v().kinder, []);
  await fehlt(kindDatenExport({ ablage: P2.a, konto: P2.konto, kind: kk, now: W.uhr.t, heute: HEUTE }), 'kind-unbekannt', 'Anna exportiert nichts mehr');
  // das Kindergeraet: Bereiche weg, es legt nichts neu an, raeumt auf; Anmelden geht nicht mehr
  K.ueben(2);
  const rk = await K.sync();
  assert.equal(rk.bericht.bereiche['kind:lern:' + kk].fehler, 'geloescht');
  assert.deepEqual(rk.geloescht, [kk]);
  assert.deepEqual(K.spuren(kk), [], 'Kindergeraet: nichts mehr');
  await fehlt(anmelden({ zugang: W.geraet('d_PK2'), anmeldename: 'kathie', passwort: PW.kathie, runden: R }), 'anmeldung', 'Konto des Kindes gibt es nicht mehr');
  for (const G of [P1, P2, K, P1, P2]) await G.sync();
  for (const a of [...KIND_BEREICHE(kk), 'freigabe:g1']) assert.equal(await leer(W, a), true, 'nach allen Abgleichen weiter leer: ' + a);
  if (W.dateien) assert.deepEqual(W.dateien().filter((p) => p.includes(kk) || p.includes('freigabe:g1') || p.includes(lookup)), [], 'keine Datei mit dem Kind mehr im Repo');
  // die Familie arbeitet weiter: der Name ist wieder frei
  const qr = await kindAnlegen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, anmeldename: 'kathie', anzeigename: 'Kathie', now: weiter(W) });
  const K2 = await einloesen(W, 'd_PK3', qr, PW.neu, 'neues iPad');
  await K2.sync(); await P1.sync(); await K2.sync(); await P2.sync();
  K2.ueben(1); await K2.sync(); await P2.sync();
  assert.equal(P2.antworten(K2.konto.kennung), 1, 'neues Kind kommt bei Anna an');
  assert.equal(P2.antworten(kk), 0);
  // Familie B unberuehrt
  const nB = B.P1.antworten(bk);
  assert.equal(nB, 5, 'Familie B: alles da');
  B.K.ueben(1);
  for (const G of [B.K, B.P1]) { const x = await G.sync(); assert.deepEqual(x.bericht.verworfen, [], G.d); }
  assert.equal(B.P1.antworten(bk), nB + 1, 'Familie B gleicht weiter ab');
  if (vorherB) assert.ok(vorherB.every((p) => W.dateien().includes(p)), 'Familie B: keine Datei geloescht');
  await kindDatenExport({ ablage: B.P1.a, konto: B.P1.konto, kind: bk, now: W.uhr.t, heute: HEUTE });
});

test('Simulation: Kind loeschen ohne Netz - erst den Vermerk senden, sonst nichts loeschen; zweiter Versuch schafft es', async () => {
  const W = WELTEN.Simulation();
  const admin = await adminAnlegen(W);
  const { P1, K } = await familie(W, admin, { eltern: 'peter', kind: 'kathie', d: 'P', pw: { eltern: PW.peter, kind: PW.kathie } });
  const kk = K.konto.kennung, z = P1.z();
  z.offline();
  await fehlt(kindDatenLoeschen({ ablage: P1.a, zugang: z, konto: P1.konto, kind: kk, now: weiter(W), heute: HEUTE }), 'nicht-gesendet');
  for (const a of KIND_BEREICHE(kk).slice(0, 4)) assert.equal(await leer(W, a), false, 'nichts geloescht: ' + a);
  assert.deepEqual(P1.v().entfernt, [{ person: kk, role: 'child' }], 'die Familie hat das Kind schon ausgetragen');
  const r = await kindDatenLoeschen({ ablage: P1.a, zugang: P1.z(), konto: P1.konto, kind: kk, now: weiter(W), heute: HEUTE });
  assert.ok(r.verzeichnis >= 1);
  for (const a of KIND_BEREICHE(kk)) assert.equal(await leer(W, a), true, a);
  const rk = await K.sync();
  assert.deepEqual(rk.geloescht, [kk]);
});

/* ---------- Konto loeschen ---------- */
jedeWelt('Konto loeschen, Anna (zweiter Elternteil): nur mit Passwort; ihr Bereich und Verzeichnis weg; Peters naechster Abgleich wechselt jeden Schluessel ohne sie; Kathie bleibt bei Peter', async (W) => {
  const { P1, P2, K } = await welt(W);
  const kk = K.konto.kennung, ak = P2.konto.kennung;
  await fehlt(kontoDatenLoeschen({ ablage: P2.a, zugang: P2.z(), konto: P2.konto, passwort: 'Falsch-Falsch-Pass-1', now: weiter(W), heute: HEUTE, runden: R }), 'anmeldung', 'falsches Passwort');
  await fehlt(kontoDatenLoeschen({ ablage: K.a, zugang: K.z(), konto: K.konto, passwort: PW.kathie, now: weiter(W), heute: HEUTE, runden: R }), 'nicht-erlaubt', 'ein Kind loescht kein Konto');
  assert.equal(await leer(W, 'person:' + ak), false, 'abgelehnt -> nichts geloescht');
  const r = await kontoDatenLoeschen({ ablage: P2.a, zugang: P2.z(), konto: P2.konto, passwort: PW.anna, now: weiter(W), heute: HEUTE, runden: R });
  assert.deepEqual([r.familieGeloescht, r.kinder, r.bereiche.map((b) => b.bereich)], [false, [], ['person:' + ak]]);
  assert.equal(await leer(W, 'person:' + ak), true);
  assert.equal(await W.geraet('d_PRUEF').directory(await kontoLookup('anna')), null);
  await fehlt(anmelden({ zugang: W.geraet('d_X'), anmeldename: 'anna', passwort: PW.anna, runden: R }), 'anmeldung');
  // Peter: Anna ist ausgetreten, jeder Bereich wechselt den Schluessel ohne sie
  const rp = await P1.sync();
  assert.deepEqual(rp.bericht.verworfen, []);
  assert.deepEqual(P1.v().eltern, [P1.konto.kennung]);
  const mitglieder = { [P1.konto.kennung]: { role: 'parent', pub: P1.konto.pub }, [kk]: { role: 'child', pub: K.konto.pub } };
  for (const a of [...KIND_BEREICHE(kk).slice(0, 4), 'familie:' + P1.konto.kennung]) {
    const st = JSON.parse(P1.a.getItem(GERAETEABGLEICH_SPEICHER.staende))[a];
    assert.ok(st.log.some((x) => x.event.type === 'member_removed' && x.event.payload.person === ak), 'member_removed: ' + a);
    const s = await schluesselLesen(W.geraet('d_PRUEF'), a, { ich: ak, meineSchluessel: P2.konto.schluessel, mitglieder });
    assert.ok(s.aktuell > 1 && !s.keys.has(s.aktuell), 'Annas alter Schluessel oeffnet die neue Version nicht: ' + a);
  }
  // Kathie uebt weiter, Peter sieht es; nichts verworfen
  K.ueben(2);
  for (const G of [K, P1, K, P1]) { const x = await G.sync(); assert.deepEqual(x.bericht.verworfen, [], G.d); }
  assert.equal(P1.antworten(kk), 5);
  const x = await kindDatenExport({ ablage: P1.a, konto: P1.konto, kind: kk, now: W.uhr.t, heute: HEUTE });
  assert.deepEqual(x.daten.zugriff.find((z) => z.bereich === 'kind:lern:' + kk).mitglieder.map((m) => m.name).sort(), ['kathie', 'peter'], 'Anna hat keinen Schluessel mehr');
});

jedeWelt('Konto loeschen, Peter (Gruender) - Anna bleibt: Anna fuehrt die Familie weiter, Kathie uebt weiter, Anna legt ein Kind an', async (W) => {
  const { P1, P2, K } = await welt(W);
  const kk = K.konto.kennung, pk = P1.konto.kennung;
  const r = await kontoDatenLoeschen({ ablage: P1.a, zugang: P1.z(), konto: P1.konto, passwort: PW.peter, now: weiter(W), heute: HEUTE, runden: R });
  assert.deepEqual([r.familieGeloescht, r.bereiche.map((b) => b.bereich)], [false, ['person:' + pk]]);
  assert.equal(await W.geraet('d_PRUEF').directory(await kontoLookup('peter')), null);
  const ra = await P2.sync();
  assert.deepEqual(ra.bericht.verworfen, []);
  assert.deepEqual([P2.v().eltern, P2.v().kinder.map((c) => c.id)], [[P2.konto.kennung], [kk]]);
  K.ueben(2);
  for (const G of [K, P2, K, P2]) { const x = await G.sync(); assert.deepEqual(x.bericht.verworfen, [], G.d); }
  assert.equal(P2.antworten(kk), 5, 'Kathie kommt bei Anna an');
  const st = JSON.parse(P2.a.getItem(GERAETEABGLEICH_SPEICHER.staende))['kind:lern:' + kk];
  assert.ok(st.log.some((x) => x.event.type === 'member_removed' && x.event.payload.person === pk), 'Peter ausgetragen');
  const qr = await kindAnlegen({ zugang: P2.z(), ablage: P2.a, konto: P2.konto, anmeldename: 'paul', anzeigename: 'Paul', now: weiter(W) });
  const K2 = await einloesen(W, 'd_PL', qr, PW.neu, 'Pauls iPad');
  await K2.sync(); await P2.sync(); await K2.sync(); K2.ueben(1); await K2.sync(); await P2.sync();
  assert.equal(P2.antworten(K2.konto.kennung), 1, 'Anna legt ein Kind an');
});

jedeWelt('Konto loeschen, letzter Elternteil: die ganze Familie ist weg (Kind, Familie, Verzeichnis); Familie B unberuehrt', async (W) => {
  const { P1, K, B } = await welt(W, { mitAnna: false });
  const kk = K.konto.kennung, pk = P1.konto.kennung, bk = B.K.konto.kennung;
  const r = await kontoDatenLoeschen({ ablage: P1.a, zugang: P1.z(), konto: P1.konto, passwort: PW.peter, now: weiter(W), heute: HEUTE, runden: R });
  assert.equal(r.familieGeloescht, true);
  assert.deepEqual(r.kinder.map((x) => x.kind), [kk]);
  for (const a of [...KIND_BEREICHE(kk), 'freigabe:g1', 'familie:' + pk, 'person:' + pk]) assert.equal(await leer(W, a), true, a);
  for (const n of ['peter', 'kathie']) assert.equal(await W.geraet('d_PRUEF').directory(await kontoLookup(n)), null, n);
  if (W.dateien) assert.deepEqual(W.dateien().filter((p) => p.includes(kk) || p.includes(pk)), [], 'nichts mehr von Familie A im Repo');
  const rk = await K.sync();
  assert.deepEqual(rk.geloescht, [kk]);
  for (const a of KIND_BEREICHE(kk)) assert.equal(await leer(W, a), true, 'Kindergeraet legt nichts neu an: ' + a);
  const rk2 = await K.sync();
  assert.deepEqual(rk2.kontoGeloescht, [kk], 'weiterer Abgleich des Kindergeraets: Konto gibt es nicht mehr');
  for (const a of KIND_BEREICHE(kk)) assert.equal(await leer(W, a), true, 'auch danach nichts neu: ' + a);
  B.K.ueben(1);
  for (const G of [B.K, B.P1]) { const x = await G.sync(); assert.deepEqual(x.bericht.verworfen, [], G.d); }
  assert.equal(B.P1.antworten(bk), 6);
});

test('kindLokalEntfernen: nur das Kind, auch ohne key/removeItem (dann wird sein Protokoll geleert)', () => {
  const m = new Map([['bq2_p_K1__events', '[1]'], ['bq2_p_K1__total', '3'], ['bq2_p_K2__events', '[2]'],
    [GERAETEABGLEICH_SPEICHER.staende, JSON.stringify({ 'kind:lern:p_K1': { log: [] }, 'kind:lern:p_K2': { log: [] }, 'person:p_K1': {} })]]);
  const a = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
  const r = kindLokalEntfernen({ ablage: a, kind: 'p_K1' });
  assert.deepEqual(r, { bereiche: ['kind:lern:p_K1', 'person:p_K1'], schluessel: 1 });
  assert.deepEqual(Object.keys(JSON.parse(m.get(GERAETEABGLEICH_SPEICHER.staende))), ['kind:lern:p_K2']);
  assert.equal(m.get('bq2_p_K1__events'), '[]');
  assert.equal(m.get('bq2_p_K2__events'), '[2]', 'anderes Kind unberuehrt');
});

test('Reinheit: kein Netz, kein Browser-Speicher, keine Uhr, kein Math.random; Hilfsnamen kdt/KDT_; nur im Testbau, nach geraete; keine Speicherstelle vergessen', () => {
  const src = fs.readFileSync(new URL('../../src/module/kinddaten.mjs', import.meta.url), 'utf8');
  for (const w of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'indexedDB', 'Math.random', 'Date.now', 'setTimeout', 'setInterval', 'document.', 'window.', '</script']) assert.equal(src.includes(w), false, w);
  for (const m of src.matchAll(/^(?:export\s+)?(?:async\s+)?(?:function\s+([\w$]+)|(?:const|let|class)\s+([\w$]+))/gm)) {
    const name = m[1] || m[2];
    assert.ok(m[0].startsWith('export') || /^(kdt|KDT_)/.test(name), name);
  }
  const liste = JSON.parse(fs.readFileSync(new URL('../../src/module/module.json', import.meta.url), 'utf8')).module;
  const mod = liste.find((x) => x.name === 'kinddaten');
  assert.equal(mod.bau, 'test');
  assert.ok(liste.indexOf(mod) > liste.findIndex((x) => x.name === 'geraete'), 'nach geraete');
  const live = appLesen('utf8', { bauart: 'live' }), testbau = appLesen('utf8', { bauart: 'test' });
  for (const w of ['kindDatenExport', 'kindDatenLoeschen', 'kontoDatenLoeschen', 'kindLokalEntfernen', 'removeArea']) assert.equal(live.includes(w), false, 'nicht im Live-Bau: ' + w);
  assert.equal(testbau.includes('async function kindDatenExport('), true, 'im Testbau');
  assert.equal(testbau.includes('</script><b>'), false);
  assert.deepEqual(KINDDATEN_STELLEN.map((s) => s.key).length, new Set(KINDDATEN_STELLEN.map((s) => s.key)).size, 'keine doppelte Stelle');
});
