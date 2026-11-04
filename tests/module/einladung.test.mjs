// Modul einladung (Stufe 3b, Aufgabe "Einladungen"; US9.5, US9.6, US8.3, US6.5): zweiten Elternteil einladen, Kind
// anlegen, Passwort des Kindes neu setzen, Einladung zurueckziehen - ohne Oberflaeche. Jede Pruefung laeuft gegen die
// Simulation UND den nachgebauten GitHub-Server. Geraete sind Ablagen ohne App; "ueben" = answer-Ereignisse ins Protokoll.
//   node --test tests/module/einladung.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  EINLADUNG_FEHLER, verbindungen, kindAnlegen, elternteilEinladen, kindPasswortNeu, einladungZurueckziehen,
  einladungenPruefen, abgleichMitVerbindungen, anmeldenameVorschlag,
} from '../../src/module/einladung.mjs';
import { KONTO_FEHLER, startcodeAusstellen, ersteAnmeldung, anmelden, kontoLookup, kontoStand, neustartAusstellen } from '../../src/module/konto.mjs';
import { lokalerSpeicher, SPEICHER_FEHLER } from '../../src/module/speicher.mjs';
import { githubSpeicher } from '../../src/module/github.mjs';
import { githubNachbau } from './github-nachbau.mjs';
import { GERAETEABGLEICH_SPEICHER } from '../../src/module/geraeteabgleich.mjs';
import { newEvent } from '../../src/module/ereignisse.mjs';
import { canonicalBytes } from '../../src/module/annahme.mjs';
import { newPersonKeys, publicKeysOf, lockPersonKeys, signBytes, keyFingerprint } from '../../src/module/krypto.mjs';
import { appLesen } from '../../werkzeug/module.mjs';

const R = 1000;                                       // PBKDF2-Runden in den Tests (die App: 600 000)
const T0 = Date.UTC(2026, 10, 4, 18, 0, 0), HEUTE = '2026-11-04', TAG = 24 * 3600 * 1000;
const PW = { verwalter: 'Tiger-Lamp-River-4271', peter: 'Otter-Cake-Moss-1234', anna: 'Koala-Bread-Cliff-5502', kathie: 'Puffin-Jam-Lake-9876', ben: 'Gecko-Plum-Reef-6060', neu: 'Walrus-Taco-Pine-1357', neu2: 'Heron-Fig-Dune-2468' };
const REPO = 'pahlborn/bis-school-app-testdaten';
const TOKEN = 'github_pat_EINLADUNG_' + 'k7Z2'.repeat(10);
let N, lauf = 0;
before(async () => { N = await githubNachbau({ token: TOKEN, repos: [REPO] }); });
after(async () => { await N.schliessen(); });

/* eine Welt = ein Speicher mit stellbarer Uhr. GitHub: je Geraet ein eigener Speicher (eigener Tab).
   tauschen(lookup, eintrag): jemand mit Schreibzugriff ersetzt einen Verzeichniseintrag (GitHub: die Datei im Repo). */
const WELTEN = {
  Simulation: () => {
    const uhr = { t: T0 }, s = lokalerSpeicher({ now: () => uhr.t }), getauscht = new Map();
    const geraet = (d) => { const z = s.geraet(d); return { ...z, directory: async (l) => (getauscht.has(l) ? JSON.parse(getauscht.get(l)) : z.directory(l)) }; };
    return { uhr, geraet, tauschen: (l, e) => getauscht.set(l, JSON.stringify(e)), dump: null };
  },
  'GitHub (Nachbau)': () => {
    const uhr = { t: T0 }, wurzel = 'einladung-' + (++lauf);
    const neu = () => githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis, wurzel, now: () => uhr.t });
    return {
      uhr, geraet: (d) => neu().geraet(d),
      tauschen: (l, e) => N.dateien().set(wurzel + '/directory/' + l + '.json', JSON.stringify(e)),
      dump: () => [...N.dateien().entries()].filter(([p]) => p.startsWith(wurzel + '/')),
    };
  },
};
const jedeWelt = (name, fn) => { for (const [w, neu] of Object.entries(WELTEN)) test(`${w}: ${name}`, () => fn(neu())); };
const weiter = (W, ms = 60 * 1000) => (W.uhr.t += ms);

async function fehlt(p, code, text) {
  assert.ok(EINLADUNG_FEHLER.includes(code) || KONTO_FEHLER.includes(code) || SPEICHER_FEHLER.includes(code), 'bekannter Code ' + code);
  await assert.rejects(p, (e) => { assert.equal(e.code, code, text); return true; }, text);
}

/* ein Geraet ohne App: eigene Ablage mit Kennung */
const ablage = () => { const m = new Map(); return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } }; };
function geraet(W, d, konto) {
  const a = ablage(); a.setItem('bq2_evDevice', JSON.stringify(d));
  const g = {
    a, d, konto,
    z: () => W.geraet(d),
    sync: () => abgleichMitVerbindungen({ ablage: a, zugang: W.geraet(d), konten: [g.konto], now: weiter(W), heute: HEUTE }),
    v: () => verbindungen({ ablage: a, konto: g.konto, now: W.uhr.t }),
    kinder: () => g.v().kinder.map((c) => c.id).sort(),
    log: (kind) => JSON.parse(a.getItem('bq2_' + kind + '__events') || '[]'),
    antworten: (kind) => g.log(kind).filter((e) => e.type === 'answer').map((e) => e.id).sort(),
    name: (kind) => g.log(kind).filter((e) => e.type === 'profile_set' && e.payload.field === 'name').map((e) => e.payload.value).pop(),
    /* das Kind uebt auf diesem Geraet: n Antworten in sein Protokoll */
    ueben: (n) => {
      const k = 'bq2_' + g.konto.kennung + '__events', l = JSON.parse(a.getItem(k) || '[]');
      for (let i = 0; i < n; i++) l.push(newEvent({ type: 'answer', author: g.konto.kennung, device: d, at: new Date(weiter(W, 1000)).toISOString(), payload: { day: HEUTE, skill: 'numbers', level: 2, attempt: 1, ok: i % 3 !== 0, qid: 'q' + i } }));
      a.setItem(k, JSON.stringify(l));
    },
    schluesselIn: async (bereich) => Object.keys(await W.geraet(d).keys(bereich)).sort(),
  };
  return g;
}
/* erste Anmeldung mit dem Code aus dem QR-Code (Code + Fingerabdruck); das Geraet gleicht mit diesem Ergebnis ab
   (es traegt Anker bzw. Familie - der erste Abgleich vermerkt sie) */
async function einloesen(W, d, qr, passwort) {
  const k = await ersteAnmeldung({ zugang: W.geraet(d), code: qr.code, passwort, fingerabdruck: qr.fingerabdruck, now: W.uhr.t, runden: R });
  return geraet(W, d, k);
}
/* Admin (vom Werkzeug), erstes Elternteil Peter (Gruender, Start-QR vom Admin) mit eingerichtetem Geraet */
async function gruender(W) {
  const sa = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: null, anmeldename: 'verwalter', art: 'admin', now: W.uhr.t });
  const admin = await ersteAnmeldung({ zugang: W.geraet('d_A1'), code: sa.code, passwort: PW.verwalter, now: W.uhr.t, runden: R });
  const sp = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: admin, anmeldename: 'peter', art: 'parent', now: W.uhr.t });
  const P1 = await einloesen(W, 'd_P1', sp, PW.peter);
  await P1.sync();
  return { admin, P1 };
}
/* ein Kind, angelegt von einem Elternteil, eingeloest auf eigenem Geraet; danach gleichen Elternteil und Kind ab */
async function kindDazu(W, E, name, d, passwort) {
  const qr = await kindAnlegen({ zugang: E.z(), ablage: E.a, konto: E.konto, anmeldename: name, anzeigename: name[0].toUpperCase() + name.slice(1), now: weiter(W) });
  const K = await einloesen(W, d, qr, passwort);
  await K.sync();                                                     // noch ohne Schluessel: wartet auf die Eltern
  const r = await E.sync();
  assert.deepEqual(r.bestaetigt.map((b) => [b.art, b.person]), [['child', K.konto.kennung]], 'Elterngeraet prueft und nimmt das Kind auf');
  await K.sync();
  return { K, qr };
}

/* ---------- US9.6 + US9.5: zweiter Elternteil, Kinder in beliebiger Reihenfolge ---------- */
jedeWelt('US9.6/US9.5 - Kind vorher und nachher, zweiter Elternteil mit Fingerabdruck: beide Eltern sehen dieselben Kinder; ein neues Kind uebt auf eigenem Geraet, die Eltern sehen es; zweites Geraet nur mit Name und Passwort', async (W) => {
  const { P1 } = await gruender(W);
  assert.equal(P1.v().familie, P1.konto.kennung, 'der erste Elternteil gruendet die Familie');

  // Kind 1 (vor dem zweiten Elternteil)
  const { K: K1, qr } = await kindDazu(W, P1, 'kathie', 'd_K1', PW.kathie);
  assert.equal(qr.fingerabdruck, await keyFingerprint(P1.konto.pub), 'der QR-Code traegt den Fingerabdruck des Ausstellers');
  assert.equal(K1.name(K1.konto.kennung), 'Kathie', 'Anzeigename kommt beim Kind an');
  K1.ueben(3); await K1.sync(); await P1.sync();
  assert.equal(P1.antworten(K1.konto.kennung).length, 3, 'Eltern sehen, was das neue Kind geuebt hat');

  // zweiter Elternteil: Einladung mit Fingerabdruck
  const e = await elternteilEinladen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, anmeldename: 'anna', now: weiter(W) });
  const P2 = await einloesen(W, 'd_P2', e, PW.anna);
  assert.deepEqual(P2.konto.familie, { person: P1.konto.kennung, role: 'parent', pub: P1.konto.pub }, 'Anna weiss, zu welcher Familie sie gehoert');
  assert.equal(P2.konto.wiederherstellungscode.length, 24, 'Erwachsene: Wiederherstellungscode');
  await P2.sync();
  assert.deepEqual(P2.kinder(), [], 'vor der Pruefung durch Peter: nichts');
  const r1 = await P1.sync();
  assert.deepEqual(r1.bestaetigt.map((b) => [b.art, b.person]), [['parent', P2.konto.kennung]]);
  await P2.sync();
  assert.deepEqual(P2.kinder(), [K1.konto.kennung], 'Anna sieht Kathie');
  assert.deepEqual(P2.antworten(K1.konto.kennung), P1.antworten(K1.konto.kennung), 'und ihren ganzen Stand');

  // Kind 2 (vom zweiten Elternteil angelegt): Peter sieht es auch
  const { K: K2 } = await kindDazu(W, P2, 'ben', 'd_B1', PW.ben);
  K2.ueben(2); await K2.sync();
  await P1.sync();
  assert.deepEqual(P1.kinder(), [K1.konto.kennung, K2.konto.kennung].sort(), 'Peter sieht beide Kinder');
  assert.deepEqual(P2.kinder(), P1.kinder());
  assert.equal(P1.antworten(K2.konto.kennung).length, 2, 'und was Ben geuebt hat');
  assert.equal(P1.v().kinder.find((c) => c.id === K2.konto.kennung).anker.person, P2.konto.kennung, 'Anker von Ben ist Anna');
  // auch umgekehrt: Peter darf Bens Passwort neu setzen (Annas Vermerk ueber Peter ist seine Buergschaft)
  assert.match((await kindPasswortNeu({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, kind: K2.konto.kennung, now: weiter(W) })).code, /^[A-Za-z0-9_-]{22}$/);

  // weitere Geraete nur mit Anmeldename und Passwort
  const P2b = geraet(W, 'd_P2b', await anmelden({ zugang: W.geraet('d_P2b'), anmeldename: 'anna', passwort: PW.anna, runden: R }));
  const r = await P2b.sync();
  assert.ok(r.runden >= 2, 'erst die eigene Person, dann Familie und Kinder');
  assert.deepEqual(P2b.kinder(), P1.kinder(), 'zweites Geraet: dieselben Kinder');
  assert.deepEqual(P2b.antworten(K1.konto.kennung), P1.antworten(K1.konto.kennung));
  assert.deepEqual(P2b.antworten(K2.konto.kennung), P1.antworten(K2.konto.kennung));
  const K1b = geraet(W, 'd_K1b', await anmelden({ zugang: W.geraet('d_K1b'), anmeldename: 'kathie', passwort: PW.kathie, runden: R }));
  await K1b.sync();
  assert.deepEqual(K1b.kinder(), [K1.konto.kennung], 'das Kind findet sich auf dem neuen Geraet');
  assert.deepEqual(K1b.antworten(K1.konto.kennung), P1.antworten(K1.konto.kennung));
  assert.equal(K1b.name(K1.konto.kennung), 'Kathie');
  // das Kind sieht keine Familie, keine Geschwister
  assert.deepEqual([K1.v().familien, Object.keys(K1.v().verzeichnis)], [[], []]);
  assert.deepEqual(await K1.schluesselIn('familie:' + P1.konto.kennung), [P1.konto.kennung, P2.konto.kennung].sort(), 'Familienbereich: nur die Eltern');
  assert.deepEqual(K1.antworten(K2.konto.kennung), []);
});

/* ---------- US6.5: untergeschobene Schluessel ---------- */
jedeWelt('US6.5 - untergeschobener Schluessel: getauschter Verzeichniseintrag -> Warnung, nichts verpackt; falscher Fingerabdruck im QR -> abgelehnt, Code bleibt gueltig; gefaelschter Neustart-Eintrag zaehlt nicht', async (W) => {
  const { P1 } = await gruender(W);
  const e = await elternteilEinladen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, anmeldename: 'anna', now: weiter(W) });

  // falscher Fingerabdruck im QR-Code: nichts angelegt, Code bleibt gueltig
  const fremd = await keyFingerprint(await publicKeysOf(await newPersonKeys()));
  await fehlt(ersteAnmeldung({ zugang: W.geraet('d_P2'), code: e.code, passwort: PW.anna, fingerabdruck: fremd, now: W.uhr.t, runden: R }), 'fingerabdruck');
  assert.equal(await W.geraet('d_X').directory(await kontoLookup('anna')), null, 'nichts angelegt');
  const P2 = await einloesen(W, 'd_P2', { code: e.code, fingerabdruck: e.fingerabdruck.toUpperCase().replace(/-/g, ' ') }, PW.anna);   // gross, mit Leerzeichen: gleich

  // jemand mit Schreibzugriff tauscht Annas Eintrag gegen eigene Schluessel (gleiche Kennung, gleiche Form)
  const lookup = await kontoLookup('anna'), echt = await W.geraet('d_X').directory(lookup);
  const boese = await newPersonKeys(), bpub = await publicKeysOf(boese);
  const falsch = { ...echt, pub: bpub, gesperrt: await lockPersonKeys(boese, echt.kennung, ['Boese-Bohne-Moos-1111', 'AAAA-BBBB-CCCC-DDDD-EEEE'], { rounds: R }) };
  W.tauschen(lookup, falsch);
  const r = await P1.sync();
  assert.deepEqual(r.bestaetigt, [], 'nichts bestaetigt');
  assert.deepEqual(r.warnungen.map((w) => [w.art, w.person, w.grund]), [['parent', P2.konto.kennung, 'fingerabdruck']], 'Warnung');
  assert.equal(P1.v().verzeichnis[P2.konto.kennung], undefined, 'nicht in der Familie');
  assert.deepEqual(await P1.schluesselIn('familie:' + P1.konto.kennung), [P1.konto.kennung], 'kein Schluessel verpackt');
  assert.equal(P1.v().offen.length, 1, 'die Einladung bleibt offen');
  // auch ein Eintrag mit falschem Beweis aus einer anderen Einladung hilft nicht
  W.tauschen(lookup, { ...falsch, beweis: echt.beweis });
  assert.deepEqual((await P1.sync()).bestaetigt, []);
  // zurueck zum echten Eintrag: jetzt geht es
  W.tauschen(lookup, echt);
  assert.deepEqual((await P1.sync()).bestaetigt.map((b) => b.person), [P2.konto.kennung]);
  assert.deepEqual(await P1.schluesselIn('familie:' + P1.konto.kennung), [P1.konto.kennung, P2.konto.kennung].sort());

  // ein Kind; danach legt jemand einen gefaelschten "Neustart" mit eigenem Schluessel und selbst unterschriebener Vollmacht ab
  const { K } = await kindDazu(W, P1, 'kathie', 'd_K1', PW.kathie);
  const kl = await kontoLookup('kathie'), basis = await W.geraet('d_X').directory(kl);
  const fk = await newPersonKeys(), fpub = await publicKeysOf(fk);
  const fremderElternteil = { kennung: 'p_FREMD', art: 'parent', pub: fpub, schluessel: fk };
  await fehlt(neustartAusstellen({ zugang: W.geraet('d_X'), aussteller: fremderElternteil, anmeldename: 'kathie', kennung: K.konto.kennung, anker: { kennung: 'p_FREMD', pub: fpub }, now: W.uhr.t }), 'nicht-erlaubt', 'fremder Anker');
  await fehlt(neustartAusstellen({ zugang: W.geraet('d_X'), aussteller: fremderElternteil, anmeldename: 'kathie', kennung: K.konto.kennung, anker: basis.anker, now: W.uhr.t }), 'nicht-erlaubt', 'ohne Buergschaft des Ankers');
  // eine Buergschaft, die aussieht wie Peters Vermerk, aber nicht von Peter unterschrieben ist
  const area = 'familie:' + P1.konto.kennung;
  const unecht = newEvent({ type: 'family_set', author: P1.konto.kennung, device: 'd_P1', at: new Date(W.uhr.t).toISOString(), payload: { person: 'p_FREMD', role: 'parent', pub: fpub, stand: 1 } });
  await fehlt(neustartAusstellen({ zugang: W.geraet('d_X'), aussteller: fremderElternteil, anmeldename: 'kathie', kennung: K.konto.kennung, anker: basis.anker, buergschaft: { area, event: unecht, sig: await signBytes(fk, canonicalBytes(unecht, area)) }, now: W.uhr.t }), 'nicht-erlaubt', 'gefaelschte Buergschaft');
  const inhalt = { v: 1, anmeldename: 'kathie', kennung: K.konto.kennung, art: 'child', ausgestellt: W.uhr.t, gueltigBis: W.uhr.t + 7 * TAG, aussteller: { kennung: 'p_FREMD', art: 'parent', pub: fpub }, neu: true, id: 's' + 'a'.repeat(64), anker: basis.anker };
  const kanon = (x) => (x === null || typeof x !== 'object' ? JSON.stringify(x) : Array.isArray(x) ? '[' + x.map(kanon).join(',') + ']' : '{' + Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => JSON.stringify(k) + ':' + kanon(x[k])).join(',') + '}');
  const g = { v: 1, lookup: kl + '-2', stand: 2, kennung: K.konto.kennung, pub: fpub, gesperrt: await lockPersonKeys(fk, K.konto.kennung, ['Boese-Bohne-Moos-1111'], { rounds: R }), beweis: 'eA==', vollmacht: { inhalt, sig: await signBytes(fk, 'bq-start|' + kanon(inhalt)) } };
  g.sig = await signBytes(fk, 'bq-konto-neu|' + kanon(g));
  await W.geraet('d_X').putDirectory(g);
  assert.deepEqual([(await kontoStand({ zugang: W.geraet('d_X'), anmeldename: 'kathie' })).stand, (await kontoStand({ zugang: W.geraet('d_X'), anmeldename: 'kathie' })).pub], [1, K.konto.pub], 'zaehlt nicht');
  await fehlt(anmelden({ zugang: W.geraet('d_X'), anmeldename: 'kathie', passwort: 'Boese-Bohne-Moos-1111', runden: R }), 'anmeldung', 'der Faelscher kommt nicht hinein');
  const k2 = await anmelden({ zugang: W.geraet('d_K2'), anmeldename: 'kathie', passwort: PW.kathie, runden: R });
  assert.deepEqual([k2.stand, k2.pub], [1, K.konto.pub], 'Kathie kommt weiter mit ihrem Passwort hinein');
});

/* ---------- US9.5: Passwort des Kindes neu setzen ---------- */
jedeWelt('US9.5 - Passwort des Kindes neu setzen (neuer Start-QR, neue Schluessel) ohne Datenverlust: Zaehlprobe; auch durch den zweiten Elternteil (Buergschaft); altes Passwort geht nicht mehr', async (W) => {
  const { P1 } = await gruender(W);
  const e = await elternteilEinladen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, anmeldename: 'anna', now: weiter(W) });
  const P2 = await einloesen(W, 'd_P2', e, PW.anna);
  await P1.sync(); await P2.sync(); await P1.sync();
  const { K } = await kindDazu(W, P1, 'kathie', 'd_K1', PW.kathie);
  K.ueben(7); await K.sync(); await P1.sync(); await P2.sync();
  const vorher = P2.antworten(K.konto.kennung);
  assert.equal(vorher.length, 7);
  const zaehle = (G) => G.antworten(K.konto.kennung).length;

  // Anna (nicht der Anker) setzt das Passwort neu: Buergschaft von Peter liegt in der Familie
  const qr = await kindPasswortNeu({ zugang: P2.z(), ablage: P2.a, konto: P2.konto, kind: K.konto.kennung, now: weiter(W) });
  assert.equal(qr.fingerabdruck, await keyFingerprint(P2.konto.pub));
  const K2 = await einloesen(W, 'd_K2', qr, PW.neu);
  assert.deepEqual([K2.konto.kennung, K2.konto.neu, K2.konto.stand], [K.konto.kennung, true, 2]);
  assert.notDeepEqual(K2.konto.pub, K.konto.pub, 'neue Schluessel');
  assert.deepEqual(K2.konto.anker.person, P1.konto.kennung, 'Anker bleibt Peter');
  await K2.sync();
  const r = await P2.sync();
  assert.deepEqual(r.bestaetigt.map((b) => [b.art, b.person]), [['reset', K.konto.kennung]]);
  assert.deepEqual(r.warnungen, []);
  await K2.sync();
  assert.deepEqual(K2.antworten(K.konto.kennung), vorher, 'Zaehlprobe: alles da, nichts verloren');
  assert.equal(K2.name(K.konto.kennung), 'Kathie');
  K2.ueben(4); await K2.sync();
  await P1.sync(); await P2.sync();
  assert.equal(zaehle(P1), 11, 'Peter sieht 7 + 4');
  assert.equal(zaehle(P2), 11, 'Anna sieht 7 + 4');
  // Peters Geraet stellt die alten Schluessel nicht zurueck: ein weiteres Geraet von Kathie liest und schreibt
  await P1.sync();
  const K3 = geraet(W, 'd_K3', await anmelden({ zugang: W.geraet('d_K3'), anmeldename: 'kathie', passwort: PW.neu, runden: R }));
  assert.deepEqual([K3.konto.stand, K3.konto.pub], [2, K2.konto.pub]);
  await K3.sync();
  assert.equal(zaehle(K3), 11);
  await fehlt(anmelden({ zugang: W.geraet('d_K4'), anmeldename: 'kathie', passwort: PW.kathie, runden: R }), 'anmeldung', 'altes Passwort');
  // der Eintrag mit den neuen Schluesseln, veraendert: zaehlt nicht (Unterschrift, Beweis, Vollmacht)
  const kl = await kontoLookup('kathie'), e2 = await W.geraet('d_X').directory(kl + '-2');
  const stand = async () => (await kontoStand({ zugang: W.geraet('d_X'), anmeldename: 'kathie' })).stand;
  const boese = await newPersonKeys(), bpub = await publicKeysOf(boese);
  for (const [was, x] of [['Unterschrift', { ...e2, sig: e2.sig.slice(0, -8) + 'AAAAAAA=' }], ['ohne Beweis', { ...e2, beweis: undefined }],
    ['fremde Schluessel', { ...e2, pub: bpub }], ['Vollmacht veraendert', { ...e2, vollmacht: { ...e2.vollmacht, inhalt: { ...e2.vollmacht.inhalt, kennung: P2.konto.kennung } } }]]) {
    W.tauschen(kl + '-2', JSON.parse(JSON.stringify(x)));
    assert.equal(await stand(), 1, was);
  }
  const kanon = (x) => (x === null || typeof x !== 'object' ? JSON.stringify(x) : Array.isArray(x) ? '[' + x.map(kanon).join(',') + ']' : '{' + Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => JSON.stringify(k) + ':' + kanon(x[k])).join(',') + '}');
  // ohne Beweis, aber mit Kathies neuem Schluessel sauber unterschrieben: zaehlt auch nicht (die Eltern koennten ihn nie pruefen)
  const ohneBeweis = { ...e2, beweis: undefined, sig: undefined };
  W.tauschen(kl + '-2', { ...JSON.parse(JSON.stringify(ohneBeweis)), sig: await signBytes(K2.konto.schluessel, 'bq-konto-neu|' + kanon(ohneBeweis)) });
  assert.equal(await stand(), 1, 'ohne Beweis, gueltig unterschrieben');
  W.tauschen(kl + '-2', e2);
  assert.equal(await stand(), 2);
  // dieselbe Vollmacht ein zweites Mal (mit eigenen Schluesseln, sauber unterschrieben): zaehlt nicht
  const nochmal = { v: 1, lookup: kl + '-3', stand: 3, kennung: K.konto.kennung, pub: bpub, gesperrt: await lockPersonKeys(boese, K.konto.kennung, ['Boese-Bohne-Moos-1111'], { rounds: R }), beweis: e2.beweis, vollmacht: e2.vollmacht };
  nochmal.sig = await signBytes(boese, 'bq-konto-neu|' + kanon(nochmal));
  await W.geraet('d_X').putDirectory(nochmal);
  assert.equal(await stand(), 2, 'eine Vollmacht zaehlt nur einmal');
  await fehlt(anmelden({ zugang: W.geraet('d_X'), anmeldename: 'kathie', passwort: 'Boese-Bohne-Moos-1111', runden: R }), 'anmeldung');
  // das alte Geraet mit den alten Schluesseln schreibt nichts mehr, was zaehlt
  K.ueben(1); await K.sync(); await P1.sync();
  assert.equal(zaehle(P1), 11, 'Eintrag mit altem Schluessel nach dem Neustart zaehlt nicht');

  // noch einmal, diesmal durch Peter (Anker, ohne Buergschaft); die Einladung gilt nur einmal
  const qr2 = await kindPasswortNeu({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, kind: K.konto.kennung, now: weiter(W) });
  const K5 = await einloesen(W, 'd_K5', qr2, PW.neu2);
  assert.equal(K5.konto.stand, 4, 'naechster freier Eintrag (3 ist der ungueltige von oben)');
  await fehlt(ersteAnmeldung({ zugang: W.geraet('d_K6'), code: qr2.code, passwort: PW.neu2, now: W.uhr.t, runden: R }), 'startcode-ungueltig', 'einmal');
  await P1.sync(); await K5.sync();
  assert.equal(zaehle(K5), 11, 'auch nach dem zweiten Neustart nichts verloren');
  await P2.sync();
  assert.deepEqual(P2.v().verzeichnis[K.konto.kennung].pub, K5.konto.pub, 'Anna kennt die neuesten Schluessel');
  assert.equal(P2.v().verzeichnis[K.konto.kennung].stand, 4);
});

/* ---------- US8.3: 7 Tage, einmal, zurueckziehen ---------- */
jedeWelt('US8.3 - Einladungen: 7 Tage gueltig (nicht 10 Minuten), nur einmal, zurueckziehbar; Ablauf und Rueckzug werden vermerkt', async (W) => {
  const { P1 } = await gruender(W);
  // zurueckziehen
  const a = await kindAnlegen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, anmeldename: 'lia', anzeigename: 'Lia', now: weiter(W) });
  assert.deepEqual(P1.v().offen.map((o) => [o.invite, o.art, o.state]), [[a.id, 'child', 'open']]);
  assert.deepEqual(await einladungZurueckziehen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, id: a.id, now: weiter(W) }), { zurueckgezogen: true });
  await fehlt(ersteAnmeldung({ zugang: W.geraet('d_L1'), code: a.code, passwort: PW.kathie, now: W.uhr.t, runden: R }), 'startcode-ungueltig', 'zurueckgezogen');
  assert.deepEqual(P1.v().offen, []);
  await fehlt(einladungZurueckziehen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, id: a.id, now: weiter(W) }), 'nicht-erlaubt', 'nicht mehr offen');
  // nach 10 Minuten und nach 6 Tagen noch gueltig; einmal
  const b = await kindAnlegen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, anmeldename: 'tim', anzeigename: 'Tim', now: weiter(W) });
  const c = await kindAnlegen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, anmeldename: 'mia', anzeigename: 'Mia', now: W.uhr.t });
  const start = W.uhr.t;
  W.uhr.t = start + 10 * 60 * 1000 + 1;
  await P1.sync();
  assert.equal(P1.v().offen.length, 2, 'nach 10 Minuten noch offen');
  W.uhr.t = start + 6 * TAG;
  const T = await einloesen(W, 'd_T1', b, PW.ben);
  await fehlt(ersteAnmeldung({ zugang: W.geraet('d_T2'), code: b.code, passwort: PW.ben, now: W.uhr.t, runden: R }), 'startcode-ungueltig', 'zweimal');
  // zurueckziehen nach Gebrauch: geht nicht, die Pruefung nimmt das Kind auf
  assert.deepEqual(await einladungZurueckziehen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, id: b.id, now: weiter(W) }), { zurueckgezogen: false });
  const r = await P1.sync();
  assert.deepEqual(r.bestaetigt.map((x) => x.person), [T.konto.kennung]);
  // nach 7 Tagen: abgelaufen, wird vermerkt und aus dem Speicher geloescht
  W.uhr.t = start + 7 * TAG;
  await fehlt(ersteAnmeldung({ zugang: W.geraet('d_M1'), code: c.code, passwort: PW.kathie, now: W.uhr.t, runden: R }), 'startcode-abgelaufen');
  const r2 = await P1.sync();
  assert.deepEqual(r2.abgelaufen, [c.id]);
  assert.deepEqual(P1.v().offen, []);
  const zustand = JSON.parse(P1.a.getItem(GERAETEABGLEICH_SPEICHER.personen))[P1.konto.kennung].filter((x) => x.type === 'invite_set').map((x) => [x.payload.name, x.payload.state]);
  assert.deepEqual(zustand, [['lia', 'open'], ['lia', 'withdrawn'], ['tim', 'open'], ['mia', 'open'], ['tim', 'done'], ['mia', 'expired']]);
  if (W.dump) assert.equal(W.dump().filter(([p]) => p.includes('/invites/')).length, 0, 'keine Einladung bleibt liegen');
  // ein zweites Geraet von Peter kennt die Einladungen (Personen-Bereich) und koennte zurueckziehen
  const P1b = geraet(W, 'd_P1b', await anmelden({ zugang: W.geraet('d_P1b'), anmeldename: 'peter', passwort: PW.peter, runden: R }));
  const d = await kindAnlegen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, anmeldename: 'ole', anzeigename: 'Ole', now: weiter(W) });
  await P1.sync(); await P1b.sync();
  assert.deepEqual(P1b.v().offen.map((o) => o.invite), [d.id]);
  assert.deepEqual(await einladungZurueckziehen({ zugang: P1b.z(), ablage: P1b.a, konto: P1b.konto, id: d.id, now: weiter(W) }), { zurueckgezogen: true });
  await P1b.sync(); await P1.sync();
  assert.deepEqual(P1.v().offen, []);
});

/* ---------- Kleinigkeiten ---------- */
jedeWelt('Anmeldename-Vorschlag, Rechte, Eingaben: Kind und Admin laden hier nicht ein; ohne Familie kein Kind; Buergschaft fehlt -> Fehler', async (W) => {
  const { admin, P1 } = await gruender(W);
  const z = P1.z();
  assert.equal(await anmeldenameVorschlag({ zugang: z, anzeigename: 'Kathie Müller' }), 'kathie.mueller');
  assert.equal(await anmeldenameVorschlag({ zugang: z, anzeigename: 'Zoë' }), 'zoe');
  assert.equal(await anmeldenameVorschlag({ zugang: z, anzeigename: '' }), 'kid');
  assert.match(await anmeldenameVorschlag({ zugang: z, anzeigename: 'Peter' }), /^peter[1-9][0-9]$/, 'vergeben -> mit Zahl');
  const { K } = await kindDazu(W, P1, 'kathie', 'd_K1', PW.kathie);
  await fehlt(kindAnlegen({ zugang: K.z(), ablage: K.a, konto: K.konto, anmeldename: 'geschwister', now: weiter(W) }), 'nicht-erlaubt', 'Kind legt kein Kind an');
  await fehlt(elternteilEinladen({ zugang: K.z(), ablage: K.a, konto: K.konto, anmeldename: 'mama', now: weiter(W) }), 'nicht-erlaubt');
  const Ad = geraet(W, 'd_A1', admin);
  await fehlt(kindAnlegen({ zugang: Ad.z(), ablage: Ad.a, konto: admin, anmeldename: 'testkind', now: weiter(W) }), 'nicht-erlaubt', 'Admin legt hier kein Kind an');
  // Elternteil ohne eingerichtete Familie
  const sp = await startcodeAusstellen({ zugang: Ad.z(), aussteller: admin, anmeldename: 'olaf', art: 'parent', now: W.uhr.t });
  const O = geraet(W, 'd_O1', await ersteAnmeldung({ zugang: W.geraet('d_O1'), code: sp.code, passwort: PW.neu, now: W.uhr.t, runden: R }));
  await fehlt(kindAnlegen({ zugang: O.z(), ablage: O.a, konto: O.konto, anmeldename: 'olafkind', now: weiter(W) }), 'familie-fehlt');
  await fehlt(kindPasswortNeu({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, kind: 'p_UNBEKANNT', now: weiter(W) }), 'kind-unbekannt');
  // zweiter Elternteil vor Peters Buergschaft: Fehler statt eines Codes, den Kathies Geraet ablehnen wuerde
  const e = await elternteilEinladen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, anmeldename: 'anna', now: weiter(W) });
  const P2 = await einloesen(W, 'd_P2', e, PW.anna);
  await P2.sync();                                                            // Anna vermerkt ihre Familie, hat aber noch keinen Schluessel
  await P1.sync();
  const fam = 'familie:' + P1.konto.kennung, st = JSON.parse(P2.a.getItem(GERAETEABGLEICH_SPEICHER.staende) || '{}');
  assert.deepEqual(st[fam].log.filter((x) => x.event.type === 'family_set'), [], 'Anna hat Peters Vermerk noch nicht');
  const ka = JSON.parse(P1.a.getItem(GERAETEABGLEICH_SPEICHER.familien));
  P2.a.setItem(GERAETEABGLEICH_SPEICHER.familien, JSON.stringify(ka));        // Familienliste ohne unterschriebene Buergschaft
  await fehlt(kindPasswortNeu({ zugang: P2.z(), ablage: P2.a, konto: P2.konto, kind: K.konto.kennung, now: weiter(W) }), 'buergschaft-fehlt');
  // Eingaben
  assert.throws(() => verbindungen({ ablage: {}, konto: P1.konto, now: 1 }), /ablage/);
  assert.throws(() => verbindungen({ ablage: P1.a, konto: {}, now: 1 }), /Konto/);
  assert.throws(() => verbindungen({ ablage: P1.a, konto: P1.konto }), /now/);
  await assert.rejects(abgleichMitVerbindungen({ ablage: P1.a, zugang: z, konten: [], now: 1, heute: HEUTE }), /konten/);
});

test('Reinheit: kein Netz, kein Browser-Speicher, keine Uhr, kein Math.random; Hilfsnamen eld/ELD_; nur im Testbau, nach konto', () => {
  const src = fs.readFileSync(new URL('../../src/module/einladung.mjs', import.meta.url), 'utf8');
  for (const w of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'indexedDB', 'Math.random', 'Date.now', 'setTimeout', 'setInterval', 'document.', 'window.']) assert.equal(src.includes(w), false, w);
  assert.deepEqual([...src.matchAll(/^import .* from '(.+)';$/gm)].map((m) => m[1]), ['./ereignisse.mjs', './bereiche.mjs', './geraeteabgleich.mjs', './konto.mjs']);
  for (const m of src.matchAll(/^(?:export\s+)?(?:async\s+)?(?:function\s+([\w$]+)|(?:const|let|class)\s+([\w$]+))/gm)) {
    const name = m[1] || m[2];
    assert.ok(m[0].startsWith('export') || /^(eld|ELD_)/.test(name), name);
  }
  const liste = JSON.parse(fs.readFileSync(new URL('../../src/module/module.json', import.meta.url), 'utf8')).module;
  const mod = liste.find((x) => x.name === 'einladung');
  assert.equal(mod.bau, 'test');
  assert.ok(liste.indexOf(mod) > liste.findIndex((x) => x.name === 'konto'), 'nach konto');
  const live = appLesen('utf8', { bauart: 'live' }), testbau = appLesen('utf8', { bauart: 'test' });
  for (const w of ['kindAnlegen', 'elternteilEinladen', 'kindPasswortNeu', 'einladungZurueckziehen', 'abgleichMitVerbindungen', 'family_set']) assert.equal(live.includes(w), false, 'nicht im Live-Bau: ' + w);
  assert.equal(testbau.includes('async function abgleichMitVerbindungen('), true, 'im Testbau');
});
