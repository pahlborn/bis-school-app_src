// Modul konto (Stufe 3b, Aufgabe "Konto-Modul"; US9.1-US9.4): Verzeichnis ohne Namen, Personenschluessel mit Passwort
// und Wiederherstellungscode, Einmal-Startcode, Anmeldung auf einem neuen Geraet. Jede Pruefung laeuft gegen die
// Simulation UND den nachgebauten GitHub-Server (gleicher Vertrag). Ohne App, ohne Browser (der steht in testbau).
//   node --test tests/module/konto.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  KONTO_ARTEN, KONTO_AUSSTELLER, KONTO_FEHLER, KONTO_STARTCODE_MS, KONTO_STAENDE_MAX,
  kontoName, kontoLookup, kontoKennung, startcodeAusstellen, ersteAnmeldung, anmelden, wiederherstellen, kontoPersonen,
} from '../../src/module/konto.mjs';
import { lokalerSpeicher, SPEICHER_FEHLER } from '../../src/module/speicher.mjs';
import { githubSpeicher } from '../../src/module/github.mjs';
import { githubNachbau } from './github-nachbau.mjs';
import { geraetAbgleichen, GERAETEABGLEICH_SPEICHER } from '../../src/module/geraeteabgleich.mjs';
import { newEvent } from '../../src/module/ereignisse.mjs';
import { PBKDF2_ROUNDS, newPersonKeys, publicKeysOf, lockPersonKeys, signBytes, sealEntry, keyFingerprint } from '../../src/module/krypto.mjs';
import { pwWeak } from '../../src/module/passwort.mjs';
import { appLesen } from '../../werkzeug/module.mjs';

const R = 1000;                                   // PBKDF2-Runden in den Tests (die App: 600 000, eigener Test unten)
const T0 = Date.UTC(2026, 10, 4, 15, 0, 0), HEUTE = '2026-11-04';
const PW = { verwalter: 'Tiger-Lamp-River-4271', peter: 'Otter-Cake-Moss-1234', kathie: 'Puffin-Jam-Lake-9876', anna: 'Koala-Bread-Cliff-5502' };
const REPO = 'pahlborn/bis-school-app-testdaten';
const TOKEN = 'github_pat_KONTOTEST_' + 'q8W1'.repeat(10);
let N, lauf = 0;
before(async () => { N = await githubNachbau({ token: TOKEN, repos: [REPO] }); });
after(async () => { await N.schliessen(); });

/* eine Welt = ein Speicher mit stellbarer Uhr; geraet(d) -> Zugang. GitHub: je Geraet ein eigener Speicher (eigener Tab). */
const WELTEN = {
  Simulation: () => { const uhr = { t: T0 }; const s = lokalerSpeicher({ now: () => uhr.t }); return { uhr, geraet: (d) => s.geraet(d), dump: null }; },
  'GitHub (Nachbau)': () => {
    const uhr = { t: T0 }, wurzel = 'konto-' + (++lauf);
    const neu = () => githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis, wurzel, now: () => uhr.t });
    return { uhr, geraet: (d) => neu().geraet(d), dump: () => [...N.dateien().entries()].filter(([p]) => p.startsWith(wurzel + '/')) };
  },
};
const jedeWelt = (name, fn) => { for (const [w, neu] of Object.entries(WELTEN)) test(`${w}: ${name}`, () => fn(neu())); };

/* erwartet einen abgelehnten Aufruf mit diesem Code */
async function fehlt(p, code, text) {
  assert.ok(KONTO_FEHLER.includes(code) || SPEICHER_FEHLER.includes(code), 'bekannter Code ' + code);
  await assert.rejects(p, (e) => { assert.equal(e.code, code, text); return true; }, text);
}
/* der erste Admin (vom Werkzeug ausgestellt) und eine Familie: Peter (Elternteil, vom Admin), Kathie (Kind, von Peter) */
async function familie(W, { peter = 'peter', kathie = 'kathie', admin = null } = {}) {
  const z = W.geraet('d_W1');
  if (!admin) {
    const sa = await startcodeAusstellen({ zugang: z, aussteller: null, anmeldename: 'verwalter', art: 'admin', now: W.uhr.t });
    admin = await ersteAnmeldung({ zugang: W.geraet('d_A1'), code: sa.code, passwort: PW.verwalter, now: W.uhr.t, runden: R });
  }
  const sp = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: admin, anmeldename: peter, art: 'parent', now: W.uhr.t });
  const p = await ersteAnmeldung({ zugang: W.geraet('d_P1'), code: sp.code, passwort: PW.peter, now: W.uhr.t, runden: R });
  const sk = await startcodeAusstellen({ zugang: W.geraet('d_P1'), aussteller: p, anmeldename: kathie, art: 'child', now: W.uhr.t });
  const k = await ersteAnmeldung({ zugang: W.geraet('d_K1'), code: sk.code, passwort: PW.kathie, now: W.uhr.t, runden: R });
  return { admin, p, k, codes: [sp.code, sk.code] };
}

/* ein Geraet ohne App: eigener Speicher mit Kennung; die App schreibt Einstellungen der Person in ihr Protokoll */
const ablage = (m = new Map()) => ({ m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } });
function geraet(W, d) {
  const a = ablage(); a.setItem('bq2_evDevice', JSON.stringify(d));
  return {
    a, d,
    sync: (konto, now) => geraetAbgleichen({ ablage: a, zugang: W.geraet(d), personen: kontoPersonen(konto), kinder: [], verzeichnis: {}, now, heute: HEUTE }),
    schreibt: (pid, field, value, at) => {
      const K = GERAETEABGLEICH_SPEICHER.personen, alle = JSON.parse(a.getItem(K) || '{}');
      (alle[pid] = alle[pid] || []).push(newEvent({ type: 'person_set', author: pid, device: d, at: new Date(at).toISOString(), payload: { field, value } }));
      a.setItem(K, JSON.stringify(alle));
    },
    log: (pid) => (JSON.parse(a.getItem(GERAETEABGLEICH_SPEICHER.personen) || '{}')[pid] || []),
    geraeteIm: (bereich) => (JSON.parse(a.getItem(GERAETEABGLEICH_SPEICHER.staende))[bereich].log.filter((x) => x.event.type === 'device_added').map((x) => x.event.payload.device)),
  };
}
const ids = (l) => l.map((e) => e.id).sort();

/* ---------- Erfolgskriterium: zweites Geraet nur mit Name und Passwort ---------- */
jedeWelt('E2 - Anmeldung auf dem zweiten Geraet nur mit Anmeldename und Passwort: gleiche Person, gleiche Schluessel, gleicher Stand; das Geraet traegt sich ein', async (W) => {
  const { p, k } = await familie(W);
  const P1 = geraet(W, 'd_P1'), K1 = geraet(W, 'd_K1');
  await P1.sync(p, T0 + 1000); await K1.sync(k, T0 + 1000);
  P1.schreibt(p.kennung, 'parentLang', 'de', T0 + 2000);
  P1.schreibt(p.kennung, 'conceptSeen', HEUTE, T0 + 2001);
  K1.schreibt(k.kennung, 'muted', true, T0 + 2002);
  assert.equal((await P1.sync(p, T0 + 3000)).bereiche['person:' + p.kennung].gesendet, 2);
  await K1.sync(k, T0 + 3000);

  // zweites Geraet: nichts ausser Anmeldename und Passwort
  const p2 = await anmelden({ zugang: W.geraet('d_P2'), anmeldename: 'peter', passwort: PW.peter, runden: R });
  const k2 = await anmelden({ zugang: W.geraet('d_K2'), anmeldename: 'Kathie ', passwort: PW.kathie, runden: R });
  assert.deepEqual([p2.kennung, p2.art, p2.anmeldename, p2.pub, p2.stand], [p.kennung, 'parent', 'peter', p.pub, 1]);
  assert.deepEqual([k2.kennung, k2.art, k2.anmeldename, k2.pub], [k.kennung, 'child', 'kathie', k.pub]);
  assert.equal(p2.schluessel.ecdsa.privateKey.extractable, false, 'Kopie auf dem Geraet nicht exportierbar');
  assert.equal(p2.schluessel.ecdh.privateKey.extractable, false);
  assert.equal(p.schluessel.ecdsa.privateKey.extractable, false, 'auch nach der ersten Anmeldung');
  const P2 = geraet(W, 'd_P2'), K2 = geraet(W, 'd_K2');
  const r = await P2.sync(p2, T0 + 4000);
  assert.equal(r.bereiche['person:' + p.kennung].ok, true);
  assert.deepEqual(ids(P2.log(p.kennung)), ids(P1.log(p.kennung)), 'gleicher Stand');
  assert.equal(P2.log(p.kennung).length, 2);
  await K2.sync(k2, T0 + 4000);
  assert.deepEqual(ids(K2.log(k.kennung)), ids(K1.log(k.kennung)));
  // das neue Geraet ist eingetragen (device_added) und schreibt mit: das erste Geraet bekommt es
  assert.deepEqual(P2.geraeteIm('person:' + p.kennung).sort(), ['d_P1', 'd_P2']);
  P2.schreibt(p.kennung, 'parentLang', 'en', T0 + 5000);
  await P2.sync(p2, T0 + 6000);
  const r1 = await P1.sync(p, T0 + 7000);
  assert.equal(r1.inDieApp, 1);
  assert.deepEqual(r1.verworfen, []);
  assert.deepEqual(ids(P1.log(p.kennung)), ids(P2.log(p.kennung)));
});

/* ---------- US9.2 Startcode ---------- */
jedeWelt('US9.2 - Startcode: einmal nutzbar; 7 Tage gueltig (kurz davor ja, danach nein); der Code selbst liegt nie im Speicher', async (W) => {
  const { admin } = await familie(W);
  const z = W.geraet('d_A1');
  const s1 = await startcodeAusstellen({ zugang: z, aussteller: admin, anmeldename: 'anna', art: 'parent', now: W.uhr.t });
  assert.equal(s1.gueltigBis, W.uhr.t + KONTO_STARTCODE_MS);
  assert.match(s1.code, /^[A-Za-z0-9_-]{22}$/);
  const a = await ersteAnmeldung({ zugang: W.geraet('d_N1'), code: s1.code, passwort: PW.anna, now: W.uhr.t, runden: R });
  assert.equal(a.kennung, s1.kennung);
  await fehlt(ersteAnmeldung({ zugang: W.geraet('d_N2'), code: s1.code, passwort: PW.anna, now: W.uhr.t, runden: R }), 'startcode-ungueltig', 'zweimal benutzt');
  await fehlt(ersteAnmeldung({ zugang: W.geraet('d_N2'), code: s1.code, passwort: 'Ganz-Anderes-Pass-77', now: W.uhr.t, runden: R }), 'startcode-ungueltig', 'zweimal, anderes Passwort');

  const start = W.uhr.t;
  const s2 = await startcodeAusstellen({ zugang: z, aussteller: admin, anmeldename: 'lehrerin', art: 'teacher', now: start });
  const s3 = await startcodeAusstellen({ zugang: z, aussteller: admin, anmeldename: 'opa', art: 'parent', now: start });
  const SIEBEN_TAGE = 7 * 24 * 3600 * 1000;               // Konzept 10.6 - fest, nicht aus dem Modul
  assert.equal(s2.gueltigBis, start + SIEBEN_TAGE);
  W.uhr.t = start + SIEBEN_TAGE - 1000;
  const l = await ersteAnmeldung({ zugang: W.geraet('d_L1'), code: s2.code, passwort: 'Lynx-Pear-Dune-3141', now: W.uhr.t, runden: R });
  assert.equal(l.art, 'teacher');
  W.uhr.t = start + SIEBEN_TAGE;
  await fehlt(ersteAnmeldung({ zugang: W.geraet('d_O1'), code: s3.code, passwort: 'Owl-Fig-Brook-2718', now: W.uhr.t, runden: R }), 'startcode-abgelaufen', 'nach 7 Tagen');
  await fehlt(ersteAnmeldung({ zugang: W.geraet('d_O1'), code: s3.code, passwort: 'Owl-Fig-Brook-2718', now: W.uhr.t, runden: R }), 'startcode-ungueltig', 'abgelaufene Einladung wird geloescht');
  // der Name ist danach frei: ein neuer Code geht
  const s4 = await startcodeAusstellen({ zugang: z, aussteller: admin, anmeldename: 'opa', art: 'parent', now: W.uhr.t });
  await ersteAnmeldung({ zugang: W.geraet('d_O1'), code: s4.code, passwort: 'Owl-Fig-Brook-2718', now: W.uhr.t, runden: R });
  if (W.dump) {
    const alles = W.dump().map(([p, t]) => p + '\n' + t).join('\n');
    for (const c of [s1.code, s2.code, s3.code, s4.code]) assert.equal(alles.includes(c), false, 'Code im Repo');
    assert.equal(W.dump().filter(([p]) => p.includes('/invites/')).length, 0, 'keine Einladung bleibt liegen');
  }
});

jedeWelt('US9.2 - wer ausstellt: der Admin fuer Erwachsene, ein Elternteil fuer Kinder und (Einladungen) den zweiten Elternteil seiner Familie, sonst niemand; nur der erste Admin ohne Aussteller', async (W) => {
  const { admin, p, k } = await familie(W);
  const l = await ersteAnmeldung({ zugang: W.geraet('d_L1'), code: (await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: admin, anmeldename: 'lehrerin', art: 'teacher', now: W.uhr.t })).code, passwort: 'Lynx-Pear-Dune-3141', now: W.uhr.t, runden: R });
  const wer = { admin, parent: p, child: k, teacher: l };
  const fam = { person: p.kennung, pub: p.pub };
  let n = 0;
  for (const von of KONTO_ARTEN) {
    for (const fuer of KONTO_ARTEN) {
      const zweiter = von === 'parent' && fuer === 'parent';
      const p0 = startcodeAusstellen({ zugang: W.geraet('d_X1'), aussteller: wer[von], anmeldename: 'neu' + (++n), art: fuer, ...(zweiter ? { familie: fam } : {}), now: W.uhr.t });
      if ((KONTO_AUSSTELLER[von] || []).includes(fuer)) assert.ok((await p0).code, von + ' -> ' + fuer);
      else await fehlt(p0, 'nicht-erlaubt', von + ' -> ' + fuer);
    }
  }
  assert.deepEqual(KONTO_AUSSTELLER, { admin: ['parent', 'teacher', 'admin'], parent: ['child', 'parent'] });
  // der zweite Elternteil nur mit Familie; Familie nur dort
  await fehlt(startcodeAusstellen({ zugang: W.geraet('d_X1'), aussteller: p, anmeldename: 'ohnefam', art: 'parent', now: W.uhr.t }), 'nicht-erlaubt', 'Elternteil -> Elternteil ohne Familie');
  await fehlt(startcodeAusstellen({ zugang: W.geraet('d_X1'), aussteller: admin, anmeldename: 'mitfam', art: 'parent', familie: fam, now: W.uhr.t }), 'nicht-erlaubt', 'Admin mit Familie');
  await fehlt(startcodeAusstellen({ zugang: W.geraet('d_X1'), aussteller: p, anmeldename: 'kindfam', art: 'child', familie: fam, now: W.uhr.t }), 'nicht-erlaubt', 'Kind mit Familie');
  for (const fuer of ['parent', 'teacher', 'child']) await fehlt(startcodeAusstellen({ zugang: W.geraet('d_X1'), aussteller: null, anmeldename: 'ohne' + fuer, art: fuer, now: W.uhr.t }), 'nicht-erlaubt', 'ohne Aussteller: ' + fuer);
  await fehlt(startcodeAusstellen({ zugang: W.geraet('d_X1'), aussteller: admin, anmeldename: 'x', art: 'parent', now: W.uhr.t }), 'name-ungueltig');
  await fehlt(startcodeAusstellen({ zugang: W.geraet('d_X1'), aussteller: admin, anmeldename: 'eltern', art: 'king', now: W.uhr.t }), 'nicht-erlaubt');
  // der Aussteller kommt mit (fuer die Einladungen: Fingerabdruck pruefen)
  const s = await startcodeAusstellen({ zugang: W.geraet('d_P1'), aussteller: p, anmeldename: 'ben', art: 'child', now: W.uhr.t });
  const b = await ersteAnmeldung({ zugang: W.geraet('d_B1'), code: s.code, passwort: 'Gecko-Plum-Reef-6060', now: W.uhr.t, runden: R });
  assert.deepEqual({ ...b.aussteller, fingerabdruck: undefined }, { kennung: p.kennung, art: 'parent', pub: p.pub, fingerabdruck: undefined });
  assert.match(b.aussteller.fingerabdruck, /^[a-z]+(-[a-z]+){5}$/);
  assert.equal(b.wiederherstellungscode, null, 'Kinder haben keinen Wiederherstellungscode');
});

jedeWelt('US9.2 - Name vergeben: beim Ausstellen und bei der ersten Anmeldung (zwei Codes fuer denselben Namen) -> name-vergeben, erster Eintrag bleibt', async (W) => {
  const { admin, p } = await familie(W);
  await fehlt(startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: admin, anmeldename: 'PETER', art: 'parent', now: W.uhr.t }), 'name-vergeben');
  const c1 = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: admin, anmeldename: 'anna', art: 'parent', now: W.uhr.t });
  const c2 = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: admin, anmeldename: 'anna', art: 'parent', now: W.uhr.t });
  const a = await ersteAnmeldung({ zugang: W.geraet('d_N1'), code: c2.code, passwort: PW.anna, now: W.uhr.t, runden: R });
  await fehlt(ersteAnmeldung({ zugang: W.geraet('d_N2'), code: c1.code, passwort: 'Ganz-Anderes-Pass-77', now: W.uhr.t, runden: R }), 'name-vergeben');
  assert.equal((await anmelden({ zugang: W.geraet('d_N3'), anmeldename: 'anna', passwort: PW.anna, runden: R })).kennung, a.kennung);
  await fehlt(anmelden({ zugang: W.geraet('d_N3'), anmeldename: 'anna', passwort: 'Ganz-Anderes-Pass-77', runden: R }), 'anmeldung');
  assert.equal((await anmelden({ zugang: W.geraet('d_N3'), anmeldename: 'peter', passwort: PW.peter, runden: R })).kennung, p.kennung);
});

jedeWelt('US9.2 - schwaches Passwort und Speicherausfall verbrauchen den Code nicht; verlorene Antwort: derselbe Code mit demselben Passwort schliesst ab (neuer Wiederherstellungscode)', async (W) => {
  const { admin } = await familie(W);
  const schwach = 'Anna-2026!xyz';
  assert.equal(pwWeak(schwach), false); assert.equal(pwWeak(schwach, 'anna'), true, 'Vorbedingung: nur mit dem Namen schwach');
  const c = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: admin, anmeldename: 'anna', art: 'parent', now: W.uhr.t });
  await fehlt(ersteAnmeldung({ zugang: W.geraet('d_N1'), code: c.code, passwort: 'kurz', now: W.uhr.t, runden: R }), 'passwort-schwach');
  await fehlt(ersteAnmeldung({ zugang: W.geraet('d_N1'), code: c.code, passwort: schwach, now: W.uhr.t, runden: R }), 'passwort-schwach');
  // Speicher faellt beim Anlegen aus (nichts angelegt): Code bleibt gueltig
  const z = W.geraet('d_N1');
  const aus = { ...z, invite: z.invite, putDirectory: async () => { const e = new Error('speicher: offline'); e.code = 'offline'; throw e; } };
  await fehlt(ersteAnmeldung({ zugang: aus, code: c.code, passwort: PW.anna, now: W.uhr.t, runden: R }), 'offline');
  await fehlt(anmelden({ zugang: z, anmeldename: 'anna', passwort: PW.anna, runden: R }), 'anmeldung', 'kein Konto angelegt');
  // verlorene Antwort: angelegt, aber "offline" gemeldet
  const verloren = { ...z, invite: z.invite, putDirectory: async (e) => { await z.putDirectory(e); const x = new Error('speicher: offline'); x.code = 'offline'; throw x; } };
  await fehlt(ersteAnmeldung({ zugang: verloren, code: c.code, passwort: PW.anna, now: W.uhr.t, runden: R }), 'offline');
  const a = await ersteAnmeldung({ zugang: W.geraet('d_N1'), code: c.code, passwort: PW.anna, now: W.uhr.t, runden: R });
  assert.equal(a.kennung, c.kennung);
  assert.equal(a.stand, 2, 'neuer Stand mit neuem Wiederherstellungscode');
  assert.match(a.wiederherstellungscode, /^([A-HJKMNP-Z2-9]{4}-){4}[A-HJKMNP-Z2-9]{4}$/);
  const r = await wiederherstellen({ zugang: W.geraet('d_N2'), anmeldename: 'anna', code: a.wiederherstellungscode, neuesPasswort: 'Anna-Neu-Wombat-4242', runden: R });
  assert.equal(r.kennung, a.kennung);
  await fehlt(ersteAnmeldung({ zugang: W.geraet('d_N1'), code: c.code, passwort: PW.anna, now: W.uhr.t, runden: R }), 'startcode-ungueltig', 'jetzt verbraucht');
});

jedeWelt('US9.2 - gefaelschte oder kaputte Startcodes werden abgelehnt (Inhalt veraendert, falsche Unterschrift, Kind ohne Aussteller, Lehrkraft stellt aus)', async (W) => {
  const { admin, p } = await familie(W);
  const z = W.geraet('d_X1');
  const sha = async (t) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)));
  const hex = (u) => Array.from(u, (b) => b.toString(16).padStart(2, '0')).join('');
  /* eine Einladung so bauen, wie konto sie liest (Format im Modulkopf) */
  async function bauen(code, inhalt, sig) {
    const id = 's' + hex(await sha('bq-start-id|' + code));
    const key = await crypto.subtle.importKey('raw', await sha('bq-start-key|' + code), { name: 'AES-GCM' }, false, ['encrypt']);
    const s = await sealEntry(key, JSON.stringify({ inhalt, sig }), new TextEncoder().encode('bq-start|' + id));
    await z.invite.put(id, { v: 1, ...s }, { gueltigMs: KONTO_STARTCODE_MS });
  }
  const basis = (o) => ({ v: 1, anmeldename: 'falsch', kennung: kontoKennung(), art: 'child', ausgestellt: W.uhr.t, gueltigBis: W.uhr.t + KONTO_STARTCODE_MS, ...o });
  const kanon = (x) => (x === null || typeof x !== 'object' ? JSON.stringify(x) : Array.isArray(x) ? '[' + x.map(kanon).join(',') + ']' : '{' + Object.keys(x).sort().map((k) => JSON.stringify(k) + ':' + kanon(x[k])).join(',') + '}');
  const fremd = await newPersonKeys(), fremdPub = await publicKeysOf(fremd);
  const faelle = [];
  const echtVonP = basis({ anmeldename: 'echt1', aussteller: { kennung: p.kennung, art: 'parent', pub: p.pub } });
  faelle.push(['Kontrolle: echt', 'echt1code' + 'x'.repeat(13), echtVonP, await signBytes(p.schluessel, 'bq-start|' + kanon(echtVonP)), true]);
  const unterschobenerSchluessel = basis({ aussteller: { kennung: p.kennung, art: 'parent', pub: fremdPub } });
  faelle.push(['fremder Schluessel, gueltig unterschrieben - Fingerabdruck verraet ihn', 'fremdcode' + 'y'.repeat(13), unterschobenerSchluessel, await signBytes(fremd, 'bq-start|' + kanon(unterschobenerSchluessel)), 'fingerabdruck']);
  const falscheSig = basis({ aussteller: { kennung: p.kennung, art: 'parent', pub: p.pub } });
  faelle.push(['Unterschrift mit anderem Schluessel', 'falschsig' + 'z'.repeat(13), falscheSig, await signBytes(fremd, 'bq-start|' + kanon(falscheSig)), false]);
  const veraendert = basis({ aussteller: { kennung: p.kennung, art: 'parent', pub: p.pub } });
  const sigV = await signBytes(p.schluessel, 'bq-start|' + kanon(veraendert));
  faelle.push(['nach dem Unterschreiben zum Admin gemacht', 'veraendert' + 'w'.repeat(12), { ...veraendert, art: 'admin' }, sigV, false]);
  faelle.push(['Kind ohne Aussteller', 'ohneaussteller' + 'v'.repeat(8), basis({ aussteller: null }), null, false]);
  const lehr = basis({ art: 'parent', aussteller: { kennung: admin.kennung, art: 'teacher', pub: admin.pub } });
  faelle.push(['Lehrkraft stellt fuer Eltern aus', 'lehrkraft' + 'u'.repeat(13), lehr, await signBytes(admin.schluessel, 'bq-start|' + kanon(lehr)), false]);
  const lang = basis({ aussteller: { kennung: p.kennung, art: 'parent', pub: p.pub }, gueltigBis: W.uhr.t + 30 * 864e5 });
  faelle.push(['laenger als 7 Tage', 'langgueltig' + 't'.repeat(11), lang, await signBytes(p.schluessel, 'bq-start|' + kanon(lang)), false]);
  for (const [text, code, inhalt, sig, gut] of faelle) {
    assert.equal(code.length, 22, text);
    await bauen(code, inhalt, sig);
    const r = ersteAnmeldung({ zugang: W.geraet('d_X2'), code, passwort: 'Heron-Kiwi-Fern-8080', now: W.uhr.t, runden: R });
    if (gut === true) assert.equal((await r).anmeldename, 'echt1', text);
    else if (gut === 'fingerabdruck') {
      // der Startcode allein beweist nicht, WER ihn ausgestellt hat - das zeigt der Fingerabdruck (Konzept 8.3; Aufgabe Einladungen)
      const k = await r;
      assert.notEqual(k.aussteller.fingerabdruck, await keyFingerprint(p.pub), text);
      assert.equal(k.aussteller.fingerabdruck, await keyFingerprint(fremdPub), text);
    }
    else await fehlt(r, 'startcode-ungueltig', text);
  }
  // Inhalt im Speicher veraendert
  const s = await startcodeAusstellen({ zugang: W.geraet('d_P1'), aussteller: p, anmeldename: 'zahl', art: 'child', now: W.uhr.t });
  const id = 's' + hex(await sha('bq-start-id|' + s.code));
  const e = await z.invite.get(id);
  await z.invite.put(id, { ...e, ct: e.ct.slice(0, 10) + (e.ct[10] === 'A' ? 'B' : 'A') + e.ct.slice(11) }, { gueltigMs: KONTO_STARTCODE_MS });
  await fehlt(ersteAnmeldung({ zugang: W.geraet('d_X2'), code: s.code, passwort: 'Heron-Kiwi-Fern-8080', now: W.uhr.t, runden: R }), 'startcode-ungueltig', 'ein Zeichen veraendert');
  for (const c of ['', 'kurz', 'x'.repeat(23), 'a b'.padEnd(22, 'c'), null, 7]) await fehlt(ersteAnmeldung({ zugang: W.geraet('d_X2'), code: c, passwort: 'Heron-Kiwi-Fern-8080', now: W.uhr.t, runden: R }), 'startcode-ungueltig', String(c));
});

/* ---------- US9.1 Verzeichnis ohne Namen ---------- */
test('US9.1 - Hash des Anmeldenamens: fest, Gross/Klein und Leerzeichen egal, je Name verschieden; ungueltige Namen nie im Verzeichnis', async () => {
  const h = await kontoLookup('kathie');
  assert.match(h, /^v[0-9a-f]{64}$/);
  assert.equal(await kontoLookup(' KATHIE '), h);
  assert.equal(h, 'v' + Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('bq-verzeichnis|bq-verzeichnis-1|Yk3vQ8rT2mZp6wN4|kathie'))), (b) => b.toString(16).padStart(2, '0')).join(''), 'festes App-Salz - aendert es sich, findet niemand sein Konto');
  const alle = await Promise.all(['kathie', 'kathie.b', 'peter', 'peter.b', 'kathie1'].map(kontoLookup));
  assert.equal(new Set(alle).size, 5);
  for (const n of ['', 'ab', 'a'.repeat(21), '-peter', 'pe ter', 'pëter', 'peter/x', null, undefined]) {
    assert.equal(kontoName(n), null, String(n));
    await assert.rejects(kontoLookup(n), (e) => e.code === 'name-ungueltig');
  }
  assert.equal(kontoName('Peter.B'), 'peter.b');
  assert.match(kontoKennung(), /^p_[0-9A-HJKMNP-TV-Z]{26}$/);
});

jedeWelt('US9.1 + E5 - im Speicher stehen weder Anmeldenamen noch Passwoerter, Codes oder Wiederherstellungscodes; Eintrag genau: v, lookup, kennung, art, pub, gesperrt, beweis (Einladungen; Kind: anker)', async (W) => {
  // alles mitschreiben, was ueber die Zugaenge in den Speicher geht
  const geschrieben = [];
  const mit = (z) => ({ ...z, putDirectory: (e) => { geschrieben.push(JSON.stringify(e)); return z.putDirectory(e); }, putKey: (b, h, x) => { geschrieben.push(b + h + JSON.stringify(x)); return z.putKey(b, h, x); }, put: (b, g, x) => { geschrieben.push(b + JSON.stringify(x)); return z.put(b, g, x); }, invite: { ...z.invite, put: (i, x, o) => { geschrieben.push(i + JSON.stringify(x)); return z.invite.put(i, x, o); } } });
  const roh = W.geraet; W.geraet = (d) => mit(roh(d));
  const f1 = await familie(W);
  const f2 = await familie(W, { peter: 'peter.b', kathie: 'kathie.b', admin: f1.admin });
  const r = await wiederherstellen({ zugang: W.geraet('d_P2'), anmeldename: 'peter', code: f1.p.wiederherstellungscode, neuesPasswort: 'Walrus-Taco-Pine-1357', runden: R });
  const P1 = geraet(W, 'd_P1'); await P1.sync(r, T0 + 1000);
  const verboten = ['verwalter', 'peter', 'kathie', 'Peter', 'Kathie', 'PETER', ...Object.values(PW), 'Walrus-Taco-Pine-1357', f1.admin.wiederherstellungscode, f1.p.wiederherstellungscode, r.wiederherstellungscode, f2.p.wiederherstellungscode, ...f1.codes, ...f2.codes];
  for (const c of [f1.admin.wiederherstellungscode, f1.p.wiederherstellungscode, r.wiederherstellungscode]) verboten.push(c.replace(/-/g, ''));
  const texte = W.dump ? W.dump().map(([p, t]) => p + '\n' + t) : geschrieben;
  assert.ok(texte.length >= 8, 'es wurde etwas geschrieben');
  // kurze Namen nur als eigenes Wort (nicht mitten in base64 - dort koennen fuenf Buchstaben zufaellig vorkommen)
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const t of texte) {
    for (const v of verboten) {
      const treffer = v.length >= 10 ? t.includes(v) : new RegExp('(^|[^A-Za-z0-9+/_-])' + esc(v) + '($|[^A-Za-z0-9+/_-])', 'i').test(t);
      assert.equal(treffer, false, `"${v}" im Speicher: ${t.slice(0, 80)}`);
    }
  }
  if (W.dump) assert.ok(W.dump().some(([p]) => p.includes('/directory/v')), 'Ablage nach Konzept 12: directory/<Hash>.json');
  // der Eintrag hat genau diese Felder
  const z = roh('d_X1');
  const e = await z.directory(await kontoLookup('kathie'));
  assert.deepEqual(Object.keys(e).sort(), ['anker', 'art', 'beweis', 'gesperrt', 'kennung', 'lookup', 'pub', 'v']);
  assert.deepEqual([e.kennung, e.art, e.pub, e.gesperrt.locks.length, e.gesperrt.locks[0].rounds], [f1.k.kennung, 'child', f1.k.pub, 1, R]);
  assert.deepEqual(e.anker, { kennung: f1.p.kennung, pub: f1.p.pub }, 'Kind: der Elternteil, der es angelegt hat');
  const ep = await z.directory(await kontoLookup('peter'));
  assert.deepEqual(Object.keys(ep).sort(), ['art', 'beweis', 'gesperrt', 'kennung', 'lookup', 'pub', 'v']);
  assert.equal(ep.gesperrt.locks.length, 2, 'Erwachsene: Passwort und Wiederherstellungscode');
  const e2 = await z.directory((await kontoLookup('peter')) + '-2');
  // Wiederherstellen = neue Schluessel (Aufgabe "Neuer Schluessel"): mit dem alten Schluessel angekuendigt (wechsel)
  assert.deepEqual(Object.keys(e2).sort(), ['gesperrt', 'kennung', 'lookup', 'pub', 'sig', 'stand', 'v', 'wechsel']);
  assert.equal(await z.directory((await kontoLookup('peter')) + '-3'), null);
});

/* ---------- US9.3 Anmeldung ---------- */
jedeWelt('US9.3 - falscher Name und falsches Passwort: dieselbe Meldung, dieselben Anfragen, nichts geschrieben', async (W) => {
  await familie(W);
  const zaehler = [];
  const zaehlend = (z) => { const n = { lesen: 0, schreiben: 0 }; zaehler.push(n); return { ...z, directory: (l) => { n.lesen++; return z.directory(l); }, putDirectory: (e) => { n.schreiben++; return z.putDirectory(e); }, invite: { get: () => { n.schreiben++; }, put: () => { n.schreiben++; }, delete: () => { n.schreiben++; } } }; };
  const meldungen = [];
  for (const [name, pw] of [['peter', 'Falsch-Falsch-Pass-1'], ['petra', PW.peter], ['nieda', 'Falsch-Falsch-Pass-1'], ['kathie', PW.peter]]) {
    await assert.rejects(anmelden({ zugang: zaehlend(W.geraet('d_X1')), anmeldename: name, passwort: pw, runden: R }), (e) => { meldungen.push([e.code, e.message]); return true; });
  }
  assert.deepEqual(new Set(meldungen.map((m) => JSON.stringify(m))), new Set([JSON.stringify(['anmeldung', 'konto: anmeldung'])]));
  assert.deepEqual(zaehler.map((n) => [n.lesen, n.schreiben]), [[2, 0], [2, 0], [2, 0], [2, 0]]);
  for (const [name, pw] of [['', PW.peter], ['peter', ''], ['peter', undefined], ['p', PW.peter]]) await fehlt(anmelden({ zugang: W.geraet('d_X1'), anmeldename: name, passwort: pw, runden: R }), 'anmeldung');
});

test('US9.3 - falscher Name und falsches Passwort dauern gleich lang (je einmal PBKDF2; 300 000 Runden)', async () => {
  const W = WELTEN.Simulation();
  await familie(W);
  const z = W.geraet('d_X1'), RR = 300000;
  // Peters Konto mit vielen Runden (sonst wuerde das Schloss unter der Mindestzahl abgelehnt)
  const admin = await anmelden({ zugang: z, anmeldename: 'verwalter', passwort: PW.verwalter, runden: R });
  const c = await startcodeAusstellen({ zugang: z, aussteller: admin, anmeldename: 'zeit', art: 'parent', now: W.uhr.t });
  await ersteAnmeldung({ zugang: z, code: c.code, passwort: PW.anna, now: W.uhr.t, runden: RR });
  const dauer = async (name, pw) => { const t = performance.now(); await anmelden({ zugang: z, anmeldename: name, passwort: pw, runden: RR }).catch(() => {}); return performance.now() - t; };
  const a = [], b = [];
  for (let i = 0; i < 3; i++) { a.push(await dauer('zeit', 'Falsch-Falsch-Pass-1')); b.push(await dauer('niemand', 'Falsch-Falsch-Pass-1')); }
  const med = (l) => l.sort((x, y) => x - y)[1];
  const v = med(a) / med(b);
  assert.ok(v > 0.6 && v < 1.6, `falsches Passwort ${med(a).toFixed(0)} ms, falscher Name ${med(b).toFixed(0)} ms`);
  assert.ok(med(b) > 20, 'falscher Name rechnet auch');
});

jedeWelt('US9.3 - untergeschobene Schloesser zaehlen nicht: fremder Schluessel, fremde Unterschrift, Muell auf dem naechsten Platz; zu wenige Runden', async (W) => {
  const { p } = await familie(W);
  const z = W.geraet('d_X1'), lookup = await kontoLookup('peter');
  // ein Angreifer mit Schreibzugriff legt Stand 2 an: eigene Schluessel, eigenes Passwort, selbst unterschrieben
  const fremd = await newPersonKeys(), fremdPub = await publicKeysOf(fremd);
  const gesperrt = await lockPersonKeys(fremd, p.kennung, ['Boeser-Angreifer-123', 'XXXX-XXXX-XXXX-XXXX-XXXX'], { rounds: R });
  const kanon = (x) => (x === null || typeof x !== 'object' ? JSON.stringify(x) : Array.isArray(x) ? '[' + x.map(kanon).join(',') + ']' : '{' + Object.keys(x).sort().map((k) => JSON.stringify(k) + ':' + kanon(x[k])).join(',') + '}');
  const e = { v: 1, lookup: lookup + '-2', stand: 2, kennung: p.kennung, pub: fremdPub, gesperrt };
  e.sig = await signBytes(fremd, 'bq-konto-stand|' + kanon({ lookup: e.lookup, stand: 2, kennung: p.kennung, pub: fremdPub, gesperrt }));
  await z.putDirectory(e);
  // dazu: richtige pub vorgetaeuscht, aber fremde Schluessel im Schloss und fremde Unterschrift
  const g3 = { ...gesperrt, pub: p.pub };
  const e3 = { v: 1, lookup: lookup + '-3', stand: 3, kennung: p.kennung, pub: p.pub, gesperrt: g3 };
  e3.sig = await signBytes(fremd, 'bq-konto-stand|' + kanon({ lookup: e3.lookup, stand: 3, kennung: p.kennung, pub: p.pub, gesperrt: g3 }));
  await z.putDirectory(e3);
  await z.putDirectory({ lookup: lookup + '-4', muell: true });
  await fehlt(anmelden({ zugang: z, anmeldename: 'peter', passwort: 'Boeser-Angreifer-123', runden: R }), 'anmeldung', 'Passwort des Angreifers');
  const echt = await anmelden({ zugang: z, anmeldename: 'peter', passwort: PW.peter, runden: R });
  assert.deepEqual([echt.kennung, echt.pub, echt.stand], [p.kennung, p.pub, 1]);
  // Wiederherstellen schreibt auf den naechsten freien Platz (5) - und zaehlt dann
  const r = await wiederherstellen({ zugang: z, anmeldename: 'peter', code: p.wiederherstellungscode, neuesPasswort: 'Walrus-Taco-Pine-1357', runden: R });
  assert.equal(r.stand, 5);
  assert.equal((await anmelden({ zugang: z, anmeldename: 'peter', passwort: 'Walrus-Taco-Pine-1357', runden: R })).stand, 5);
  // ein Schloss mit weniger Runden als verlangt wird nicht geoeffnet (die App verlangt 600 000)
  await fehlt(anmelden({ zugang: z, anmeldename: 'kathie', passwort: PW.kathie, runden: R + 1 }), 'anmeldung');
  assert.ok(KONTO_STAENDE_MAX >= 16);
});

jedeWelt('US9.3 - ein Schloss, das andere Schluessel enthaelt als die oeffentlichen im Verzeichnis, oeffnet nicht (auch wenn es richtig unterschrieben ist)', async (W) => {
  const { p } = await familie(W);
  const z = W.geraet('d_X1'), lookup = await kontoLookup('peter');
  // z. B. eine veraenderte App der Person selbst: fremde Schluessel im Schloss, mit Peters Schluessel unterschrieben
  const fremd = await newPersonKeys();
  const g = { ...(await lockPersonKeys(fremd, p.kennung, ['Fremde-Schluessel-77', 'YYYY-YYYY-YYYY-YYYY-YYYY'], { rounds: R })), pub: p.pub };
  const kanon = (x) => (x === null || typeof x !== 'object' ? JSON.stringify(x) : Array.isArray(x) ? '[' + x.map(kanon).join(',') + ']' : '{' + Object.keys(x).sort().map((k) => JSON.stringify(k) + ':' + kanon(x[k])).join(',') + '}');
  const e = { v: 1, lookup: lookup + '-2', stand: 2, kennung: p.kennung, pub: p.pub, gesperrt: g };
  e.sig = await signBytes(p.schluessel, 'bq-konto-stand|' + kanon({ lookup: e.lookup, stand: 2, kennung: p.kennung, pub: p.pub, gesperrt: g }));
  await z.putDirectory(e);
  await fehlt(anmelden({ zugang: z, anmeldename: 'peter', passwort: 'Fremde-Schluessel-77', runden: R }), 'anmeldung');
  await fehlt(wiederherstellen({ zugang: z, anmeldename: 'peter', code: 'YYYY-YYYY-YYYY-YYYY-YYYY', neuesPasswort: 'Walrus-Taco-Pine-1357', runden: R }), 'anmeldung');
});

/* ---------- US9.4 Wiederherstellungscode ---------- */
jedeWelt('US9.4 - Wiederherstellungscode: neues Passwort, sofort neuer Code; alter Code und altes Passwort gelten nicht mehr; gleiche Person, NEUE Schluessel (Aufgabe "Neuer Schluessel")', async (W) => {
  const { p, k } = await familie(W);
  const alt = p.wiederherstellungscode;
  // Code beliebig getippt: klein, ohne Striche, mit Leerzeichen
  const getippt = ' ' + alt.toLowerCase().replace(/-/g, ' ') + ' ';
  await fehlt(wiederherstellen({ zugang: W.geraet('d_P3'), anmeldename: 'peter', code: getippt, neuesPasswort: 'peter1234567', runden: R }), 'passwort-schwach', 'schwaches neues Passwort');
  assert.equal((await anmelden({ zugang: W.geraet('d_P3'), anmeldename: 'peter', passwort: PW.peter, runden: R })).stand, 1, 'nichts geschrieben');
  const r = await wiederherstellen({ zugang: W.geraet('d_P3'), anmeldename: 'Peter', code: getippt, neuesPasswort: 'Walrus-Taco-Pine-1357', runden: R });
  assert.deepEqual([r.kennung, r.art, r.stand, r.ursprung, r.alt.pub], [p.kennung, 'parent', 2, p.pub, p.pub]);
  assert.notDeepEqual(r.pub, p.pub, 'neue Schluessel');
  assert.equal(r.fingerabdruck, await keyFingerprint(r.pub));
  assert.notEqual(r.wiederherstellungscode, alt);
  assert.equal(r.schluessel.ecdsa.privateKey.extractable, false);
  await fehlt(wiederherstellen({ zugang: W.geraet('d_P3'), anmeldename: 'peter', code: alt, neuesPasswort: 'Noch-Ein-Passwort-99', runden: R }), 'anmeldung', 'alter Code');
  await fehlt(anmelden({ zugang: W.geraet('d_P4'), anmeldename: 'peter', passwort: PW.peter, runden: R }), 'anmeldung', 'altes Passwort');
  await fehlt(anmelden({ zugang: W.geraet('d_P4'), anmeldename: 'peter', passwort: alt, runden: R }), 'anmeldung', 'der Code ist kein Passwort');
  const p4 = await anmelden({ zugang: W.geraet('d_P4'), anmeldename: 'peter', passwort: 'Walrus-Taco-Pine-1357', runden: R });
  assert.equal(p4.stand, 2);
  // der neue Code geht genau einmal weiter
  const r2 = await wiederherstellen({ zugang: W.geraet('d_P4'), anmeldename: 'peter', code: r.wiederherstellungscode, neuesPasswort: 'Gazelle-Bun-Cave-2468', runden: R });
  assert.equal(r2.stand, 3);
  // Kinder haben keinen Code (die Eltern geben einen neuen Start-QR-Code); falscher Code, falscher Name: anmeldung
  await fehlt(wiederherstellen({ zugang: W.geraet('d_K3'), anmeldename: 'kathie', code: alt, neuesPasswort: 'Gazelle-Bun-Cave-2468', runden: R }), 'anmeldung');
  await fehlt(wiederherstellen({ zugang: W.geraet('d_K3'), anmeldename: 'peter', code: 'AAAA-BBBB-CCCC-DDDD-EEEE', neuesPasswort: 'Gazelle-Bun-Cave-2468', runden: R }), 'anmeldung');
  await fehlt(wiederherstellen({ zugang: W.geraet('d_K3'), anmeldename: 'nieda', code: alt, neuesPasswort: 'Gazelle-Bun-Cave-2468', runden: R }), 'anmeldung');
  for (const c of ['', 'AAAA', alt + 'A', alt.replace(/./, '0'), null]) await fehlt(wiederherstellen({ zugang: W.geraet('d_K3'), anmeldename: 'peter', code: c, neuesPasswort: 'Gazelle-Bun-Cave-2468', runden: R }), 'anmeldung', String(c));
  assert.equal(k.wiederherstellungscode, null);
});

/* ---------- zwei Familien ---------- */
jedeWelt('Zwei Familien mit gleichen Namen bleiben getrennt: eigene Kennungen und Schluessel, auch bei gleichem Passwort; keiner liest den Bereich des anderen', async (W) => {
  const f1 = await familie(W);
  const f2 = await familie(W, { peter: 'peter.b', kathie: 'kathie.b', admin: f1.admin });   // gleiche Passwoerter wie Familie 1
  assert.notEqual(f1.p.kennung, f2.p.kennung); assert.notEqual(f1.k.kennung, f2.k.kennung);
  assert.notDeepEqual(f1.p.pub, f2.p.pub);
  assert.equal((await anmelden({ zugang: W.geraet('d_X1'), anmeldename: 'peter.b', passwort: PW.peter, runden: R })).kennung, f2.p.kennung);
  assert.equal((await anmelden({ zugang: W.geraet('d_X1'), anmeldename: 'kathie', passwort: PW.kathie, runden: R })).kennung, f1.k.kennung);
  // Peter aus Familie 1 schreibt; Peter aus Familie 2 gleicht ab und bekommt davon nichts
  const P1 = geraet(W, 'd_P1'), Q1 = geraet(W, 'd_Q1');
  await P1.sync(f1.p, T0 + 1000);
  P1.schreibt(f1.p.kennung, 'parentLang', 'de', T0 + 1500);
  await P1.sync(f1.p, T0 + 2000);
  const r = await Q1.sync(f2.p, T0 + 3000);
  assert.deepEqual(Object.keys(r.bereiche), ['person:' + f2.p.kennung]);
  assert.equal(Q1.log(f1.p.kennung).length, 0);
  assert.deepEqual(Object.keys(await W.geraet('d_Q1').keys('person:' + f1.p.kennung)), [f1.p.kennung], 'kein Schluessel fuer Familie 2');
  // Familie 2 mit dem Namen von Familie 1 anmelden geht nicht - auch nicht mit dem gleichen Passwort ueber den Namen der anderen
  await fehlt(anmelden({ zugang: W.geraet('d_Q1'), anmeldename: 'peter.c', passwort: PW.peter, runden: R }), 'anmeldung');
  await fehlt(startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: f1.admin, anmeldename: 'peter', art: 'parent', now: W.uhr.t }), 'name-vergeben', 'gleicher Anmeldename geht nur einmal');
});

/* ---------- echte Runden ---------- */
test('App-Einstellung: 600 000 Runden - erste Anmeldung (Erwachsener) und Anmeldung auf dem zweiten Geraet; Dauer im Pruefbericht', async () => {
  const W = WELTEN.Simulation();
  const t0 = performance.now();
  const s = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: null, anmeldename: 'verwalter', art: 'admin', now: W.uhr.t });
  const a = await ersteAnmeldung({ zugang: W.geraet('d_A1'), code: s.code, passwort: PW.verwalter, now: W.uhr.t });
  const t1 = performance.now();
  const b = await anmelden({ zugang: W.geraet('d_A2'), anmeldename: 'verwalter', passwort: PW.verwalter });
  const t2 = performance.now();
  assert.equal(b.kennung, a.kennung);
  const e = await W.geraet('d_A2').directory(await kontoLookup('verwalter'));
  assert.deepEqual(e.gesperrt.locks.map((l) => l.rounds), [PBKDF2_ROUNDS, PBKDF2_ROUNDS]);
  assert.equal(PBKDF2_ROUNDS, 600000);
  console.log(`# 600 000 Runden: erste Anmeldung ${(t1 - t0).toFixed(0)} ms, Anmeldung zweites Geraet ${(t2 - t1).toFixed(0)} ms`);
});

/* ---------- Eingaben, Reinheit ---------- */
test('Eingaben: Zugang, Uhr, Runden; kontoPersonen fuer geraeteabgleich', async () => {
  const W = WELTEN.Simulation(), z = W.geraet('d_X1');
  await assert.rejects(startcodeAusstellen({ zugang: {}, aussteller: null, anmeldename: 'abc', art: 'admin', now: T0 }), /zugang/);
  await assert.rejects(startcodeAusstellen({ zugang: z, aussteller: null, anmeldename: 'abc', art: 'admin' }), /now/);
  await assert.rejects(ersteAnmeldung({ zugang: z, code: 'x'.repeat(22), passwort: PW.anna, now: T0, runden: 0 }), /runden/);
  await assert.rejects(anmelden({ zugang: null, anmeldename: 'abc', passwort: 'x' }), /zugang/);
  await assert.rejects(anmelden({ zugang: z, anmeldename: 'abc', passwort: 'x', runden: 1e9 }), /runden/);
  await assert.rejects(startcodeAusstellen({ zugang: z, aussteller: { art: 'admin' }, anmeldename: 'abc', art: 'parent', now: T0 }), /aussteller/);
  const s = await startcodeAusstellen({ zugang: z, aussteller: null, anmeldename: 'verwalter', art: 'admin', now: T0 });
  const a = await ersteAnmeldung({ zugang: z, code: s.code, passwort: PW.verwalter, now: T0, runden: R });
  assert.deepEqual(Object.keys(a).sort(), ['anker', 'anmeldename', 'art', 'aussteller', 'familie', 'kennung', 'neu', 'pub', 'schluessel', 'stand', 'ursprung', 'wiederherstellungscode']);
  assert.deepEqual(a.ursprung, a.pub, 'Anker des eigenen Bereichs: die ersten Schluessel');
  assert.deepEqual([a.anker, a.familie, a.neu], [null, null, false]);
  const pers = kontoPersonen(a);
  assert.deepEqual(Object.keys(pers), [a.kennung]);
  assert.deepEqual([pers[a.kennung].role, pers[a.kennung].pub], ['admin', a.pub]);
  assert.equal(pers[a.kennung].keys, a.schluessel);
  assert.throws(() => kontoPersonen({ kennung: a.kennung }), /Konto/);
});

test('Reinheit: kein Netz, kein Browser-Speicher, keine Uhr, kein Math.random; Importe nur krypto, annahme (Buergschaft, Einladungen) und passwort; Hilfsnamen kto/KTO_; nur im Testbau, nach geraeteabgleich', () => {
  const src = fs.readFileSync(new URL('../../src/module/konto.mjs', import.meta.url), 'utf8');
  for (const w of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'indexedDB', 'Math.random', 'Date.now', 'new Date(', 'setTimeout', 'setInterval', 'document.', 'window.']) assert.equal(src.includes(w), false, w);
  assert.deepEqual([...src.matchAll(/^import .* from '(.+)';$/gm)].map((m) => m[1]), ['./krypto.mjs', './annahme.mjs', './passwort.mjs']);
  for (const m of src.matchAll(/^(?:export\s+)?(?:async\s+)?(?:function\s+([\w$]+)|(?:const|let|class)\s+([\w$]+))/gm)) {
    const name = m[1] || m[2];
    assert.ok(m[0].startsWith('export') || /^(kto|KTO_)/.test(name), name);
  }
  const liste = JSON.parse(fs.readFileSync(new URL('../../src/module/module.json', import.meta.url), 'utf8')).module;
  const mod = liste.find((x) => x.name === 'konto');
  assert.equal(mod.bau, 'test');
  assert.ok(liste.indexOf(mod) > liste.findIndex((x) => x.name === 'geraeteabgleich'), 'nach geraeteabgleich');
  const live = appLesen('utf8', { bauart: 'live' }), testbau = appLesen('utf8', { bauart: 'test' });
  for (const w of ['ersteAnmeldung', 'startcodeAusstellen', 'wiederherstellen', 'kontoLookup', 'bq-verzeichnis']) assert.equal(live.includes(w), false, 'nicht im Live-Bau: ' + w);
  assert.equal(testbau.includes('async function ersteAnmeldung('), true, 'im Testbau');
});
