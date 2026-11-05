// Modul geraete (Vorbereitung Stufe 4, Teil b: "Meine Geraete" und "Geraet entfernen"; US9.7, Konzept 8.4, 10.2, 10.3).
// Jede Pruefung laeuft gegen die Simulation UND den nachgebauten GitHub-Server. Geraete sind Ablagen ohne App.
//   node --test tests/module/geraete.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GERAETE_FEHLER, meineGeraete, geraetEntfernen } from '../../src/module/geraete.mjs';
import { verbindungen, kindAnlegen, elternteilEinladen, kindPasswortNeu, abgleichMitVerbindungen } from '../../src/module/einladung.mjs';
import { KONTO_FEHLER, startcodeAusstellen, ersteAnmeldung, anmelden, kontoPersonen } from '../../src/module/konto.mjs';
import { lokalerSpeicher, SPEICHER_FEHLER } from '../../src/module/speicher.mjs';
import { githubSpeicher } from '../../src/module/github.mjs';
import { githubNachbau } from './github-nachbau.mjs';
import { geraetAbgleichen, GERAETEABGLEICH_SPEICHER } from '../../src/module/geraeteabgleich.mjs';
import { newEvent } from '../../src/module/ereignisse.mjs';
import { signEvent } from '../../src/module/annahme.mjs';
import { schluesselLesen } from '../../src/module/bereiche.mjs';
import { sealEntry, entryAad } from '../../src/module/krypto.mjs';
import { appLesen } from '../../werkzeug/module.mjs';

const R = 1000;
const T0 = Date.UTC(2026, 10, 5, 8, 0, 0), HEUTE = '2026-11-05';
const PW = { verwalter: 'Tiger-Lamp-River-4271', peter: 'Otter-Cake-Moss-1234', anna: 'Koala-Bread-Cliff-5502', kathie: 'Puffin-Jam-Lake-9876', lehrer: 'Gecko-Plum-Reef-6060', neu: 'Walrus-Taco-Pine-1357', neu2: 'Heron-Fig-Dune-2468' };
const REPO = 'pahlborn/bis-school-app-testdaten';
const TOKEN = 'github_pat_GERAETE_' + 'm4K7'.repeat(10);
let N, lauf = 0;
before(async () => { N = await githubNachbau({ token: TOKEN, repos: [REPO] }); });
after(async () => { await N.schliessen(); });

const WELTEN = {
  Simulation: () => { const uhr = { t: T0 }, s = lokalerSpeicher({ now: () => uhr.t }); return { uhr, geraet: (d) => s.geraet(d) }; },
  'GitHub (Nachbau)': () => {
    const uhr = { t: T0 }, wurzel = 'geraete-' + (++lauf);
    return { uhr, geraet: (d) => githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis, wurzel, now: () => uhr.t }).geraet(d) };
  },
};
const jedeWelt = (name, fn) => { for (const [w, neu] of Object.entries(WELTEN)) test(`${w}: ${name}`, () => fn(neu())); };
const weiter = (W, ms = 60 * 1000) => (W.uhr.t += ms);
async function fehlt(p, code, text) {
  assert.ok(GERAETE_FEHLER.includes(code) || KONTO_FEHLER.includes(code) || SPEICHER_FEHLER.includes(code), 'bekannter Code ' + code);
  await assert.rejects(p, (e) => { assert.equal(e.code, code, text); return true; }, text);
}

const ablage = () => { const m = new Map(); return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } }; };
function geraet(W, d, konto, name) {
  const a = ablage(); a.setItem('bq2_evDevice', JSON.stringify(d));
  const g = {
    a, d, konto,
    z: () => W.geraet(d),
    sync: () => abgleichMitVerbindungen({ ablage: a, zugang: W.geraet(d), konten: [g.konto], now: weiter(W), heute: HEUTE, geraetName: name }),
    v: () => verbindungen({ ablage: a, konto: g.konto, now: W.uhr.t }),
    geraete: (person = g.konto.kennung) => meineGeraete({ ablage: a, person, now: W.uhr.t }),
    log: (kind) => JSON.parse(a.getItem('bq2_' + kind + '__events') || '[]'),
    antworten: (kind) => g.log(kind).filter((e) => e.type === 'answer').map((e) => e.id).sort(),
    name: (kind) => g.log(kind).filter((e) => e.type === 'profile_set' && e.payload.field === 'name').map((e) => e.payload.value).pop(),
    ueben: (n) => {
      const k = 'bq2_' + g.konto.kennung + '__events', l = JSON.parse(a.getItem(k) || '[]');
      for (let i = 0; i < n; i++) l.push(newEvent({ type: 'answer', author: g.konto.kennung, device: d, at: new Date(weiter(W, 1000)).toISOString(), payload: { day: HEUTE, skill: 'numbers', level: 2, attempt: 1, ok: true, qid: 'q' + l.length } }));
      a.setItem(k, JSON.stringify(l));
    },
    schreibt: (kind, type, payload) => {
      const k = 'bq2_' + kind + '__events', l = JSON.parse(a.getItem(k) || '[]');
      l.push(newEvent({ type, author: g.konto.kennung, device: d, at: new Date(weiter(W, 1000)).toISOString(), payload }));
      a.setItem(k, JSON.stringify(l));
    },
    fertig: (r) => { assert.deepEqual(r.erneuerungOffen, [], 'alle Bereiche haben den neuen Schluessel'); if (g.konto.alt) { g.konto = { ...g.konto }; delete g.konto.alt; } },
    /* key_rotated-Ereignisse, die dieses Geraet in einem Bereich kennt */
    wechsel: (area) => ((JSON.parse(a.getItem(GERAETEABGLEICH_SPEICHER.staende) || '{}')[area] || { log: [] }).log).filter((x) => x.event.type === 'key_rotated').map((x) => x.event.payload),
  };
  return g;
}
async function einloesen(W, d, qr, passwort, name) {
  return geraet(W, d, await ersteAnmeldung({ zugang: W.geraet(d), code: qr.code, passwort, fingerabdruck: qr.fingerabdruck, now: W.uhr.t, runden: R }), name);
}
async function familie(W) {
  const sa = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: null, anmeldename: 'verwalter', art: 'admin', now: W.uhr.t });
  const admin = await ersteAnmeldung({ zugang: W.geraet('d_A1'), code: sa.code, passwort: PW.verwalter, now: W.uhr.t, runden: R });
  const sp = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: admin, anmeldename: 'peter', art: 'parent', now: W.uhr.t });
  const P1 = await einloesen(W, 'd_P1', sp, PW.peter, 'Peters Laptop');
  await P1.sync();
  const e = await elternteilEinladen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, anmeldename: 'anna', now: weiter(W) });
  const P2 = await einloesen(W, 'd_P2', e, PW.anna, 'Annas Handy');
  await P2.sync(); await P1.sync(); await P2.sync();
  const qr = await kindAnlegen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, anmeldename: 'kathie', anzeigename: 'Kathie', now: weiter(W) });
  const K = await einloesen(W, 'd_K1', qr, PW.kathie, 'Kathies iPad');
  await K.sync(); await P1.sync(); await K.sync(); await P2.sync(); await P1.sync();
  K.ueben(3); await K.sync(); await P1.sync(); await P2.sync();
  const P1b = geraet(W, 'd_P1b', await anmelden({ zugang: W.geraet('d_P1b'), anmeldename: 'peter', passwort: PW.peter, runden: R }), 'Peters altes iPad');
  await P1b.sync(); await P1.sync();
  assert.equal(P2.antworten(K.konto.kennung).length, 3, 'Ausgangslage');
  return { admin, P1, P1b, P2, K };
}
const KIND_BEREICHE = (kk) => ['kind:lern', 'kind:privat', 'schule', 'eltern:allg'].map((a) => a + ':' + kk);
/* ein Buendel unter dem Pfad "pfad" mit einem Ereignis (Geraet "dev"), unterschrieben mit "keys", verschluesselt mit "s" */
async function einschleusen(W, area, pfad, event, keys, s) {
  const item = await signEvent(event, area, keys), kv = s.aktuell;
  const z = W.geraet(pfad), { kennungen } = await z.list(area, null);
  const nr = 1 + Math.max(0, ...kennungen.filter((k) => k.startsWith(pfad + '/')).map((k) => Number(k.split('/')[1])));
  const sealed = await sealEntry(s.keys.get(kv), JSON.stringify(item), entryAad(area, kv, item.event.id));
  await z.put(area, pfad, { nr, inhalt: { v: 1, kv, eintraege: [{ id: item.event.id, ...sealed }] } });
}

/* ---------- Meine Geraete ---------- */
jedeWelt('Meine Geraete: Liste mit Name, erstem und letztem Auftauchen, dieses Geraet; Eltern sehen die Geraete des Kindes; Rechte beim Entfernen', async (W) => {
  const { P1, P1b, P2, K } = await familie(W);
  const pk = P1.konto.kennung, kk = K.konto.kennung;
  const l = P1.geraete();
  assert.deepEqual(l.map((g) => [g.geraet, g.name, g.diesesGeraet, g.entfernt, g.wartet]), [['d_P1', 'Peters Laptop', true, null, false], ['d_P1b', 'Peters altes iPad', false, null, false]]);
  for (const g of l) assert.ok(Date.parse(g.erstesMal) <= Date.parse(g.zuletzt), g.geraet);
  assert.ok(Date.parse(l[0].zuletzt) > Date.parse(l[0].erstesMal), 'Peters Laptop hat seither geschrieben');
  assert.deepEqual(P1.geraete(kk).map((g) => [g.geraet, g.name]), [['d_K1', 'Kathies iPad']], 'Peter sieht Kathies Geraete');
  assert.ok(Date.parse(P1.geraete(kk)[0].zuletzt) >= Date.parse(P1.geraete(kk)[0].erstesMal) + 3000, 'zuletzt: Kathies letzte Antwort');
  assert.deepEqual(P1b.geraete().map((g) => [g.geraet, g.diesesGeraet]), [['d_P1', false], ['d_P1b', true]], 'jedes Geraet weiss, welches es selbst ist');
  // Rechte
  await fehlt(geraetEntfernen({ ablage: P2.a, zugang: P2.z(), konto: P2.konto, person: pk, geraet: 'd_P1b', now: weiter(W) }), 'nicht-erlaubt', 'Anna entfernt keine Geraete von Peter');
  await fehlt(geraetEntfernen({ ablage: P2.a, zugang: P2.z(), konto: P2.konto, person: kk, geraet: 'd_K9', now: weiter(W) }), 'geraet-unbekannt', 'ein Geraet, das Kathie nie hatte');
  await fehlt(geraetEntfernen({ ablage: K.a, zugang: K.z(), konto: K.konto, geraet: 'd_P1', now: weiter(W) }), 'nicht-erlaubt', 'ein Kind entfernt keine Geraete');
  await fehlt(geraetEntfernen({ ablage: P1.a, zugang: P1.z(), konto: P1.konto, geraet: 'd_P1', passwort: PW.peter, neuesPasswort: PW.neu, now: weiter(W) }), 'nicht-erlaubt', 'dieses Geraet: Abmelden');
  await fehlt(geraetEntfernen({ ablage: P1.a, zugang: P1.z(), konto: P1.konto, geraet: 'd_UNBEKANNT', passwort: PW.peter, neuesPasswort: PW.neu, now: weiter(W) }), 'geraet-unbekannt');
  await fehlt(geraetEntfernen({ ablage: P1.a, zugang: P1.z(), konto: P1.konto, geraet: 'd_P1b', passwort: 'Falsch-Falsch-Pass-1', neuesPasswort: PW.neu, runden: R, now: weiter(W) }), 'anmeldung', 'eigenes Geraet: nur mit Passwort');
  assert.equal(P1.a.getItem(GERAETEABGLEICH_SPEICHER.entfernen), null, 'nichts vorgemerkt');
});

/* ---------- Geraet eines Erwachsenen ---------- */
jedeWelt('Geraet eines Erwachsenen entfernen: neuer Schluessel sofort; das entfernte Geraet liest nichts Neues, seine neuen Eintraege werden verworfen (auch zurueckdatierte); es meldet sich nicht selbst wieder an; die anderen gleichen weiter ab', async (W) => {
  const { P1, P1b, P2, K } = await familie(W);
  const pk = P1.konto.kennung, kk = K.konto.kennung, L = 'kind:lern:' + kk;
  const r = await geraetEntfernen({ ablage: P1.a, zugang: P1.z(), konto: P1.konto, geraet: 'd_P1b', passwort: PW.peter, neuesPasswort: PW.neu, runden: R, now: weiter(W) });
  assert.deepEqual([r.passwortNeu, typeof r.wiederherstellungscode, r.konto.kennung], [false, 'string', pk]);
  assert.notDeepEqual(r.konto.pub, P1.konto.pub, 'neuer Schluessel');
  assert.equal(P1.geraete().find((g) => g.geraet === 'd_P1b').wartet, true, 'vorgemerkt bis zum Abgleich');
  P1.konto = r.konto;
  const rs = await P1.sync();
  P1.fertig(rs);
  assert.deepEqual(rs.bericht.verworfen, []);
  const weg = P1.geraete().find((g) => g.geraet === 'd_P1b');
  assert.ok(weg.entfernt && !weg.wartet, 'entfernt');
  for (const a of [...KIND_BEREICHE(kk), 'familie:' + pk, 'person:' + pk]) {
    assert.ok(P1.wechsel(a).some((w) => (w.geraete || []).includes('d_P1b')), 'Schluesselwechsel nennt das Geraet: ' + a);
  }
  // die Familie arbeitet weiter
  K.ueben(2);
  for (const G of [K, P2, P1, K, P2]) { const x = await G.sync(); assert.deepEqual(x.bericht.verworfen, [], G.d); }
  assert.equal(P2.antworten(kk).length, 5);
  assert.ok(P2.geraete(pk).find((g) => g.geraet === 'd_P1b').entfernt, 'Anna sieht es auch als entfernt');
  // das entfernte Geraet (alter Schluessel): nichts Neues, sein Schreiben kommt nicht an
  P1b.schreibt(kk, 'profile_set', { field: 'name', value: 'Vom-Entfernten' });
  await P1b.sync();
  assert.equal(P1b.antworten(kk).length, 3, 'liest nichts Neues');
  // jemand meldet sich auf dem entfernten Geraet mit dem neuen Passwort an: es liest, aber es meldet sich nicht selbst
  // wieder an - was es schreibt, zaehlt nicht
  P1b.konto = await anmelden({ zugang: W.geraet('d_P1b'), anmeldename: 'peter', passwort: PW.neu, runden: R });
  await P1b.sync();
  assert.equal(P1b.antworten(kk).length, 5, 'mit dem neuen Passwort liest es (wer das Passwort kennt, ist Peter)');
  P1b.schreibt(kk, 'profile_set', { field: 'name', value: 'Nach-dem-Entfernen' });
  await P1b.sync();
  const r2 = await P2.sync();
  assert.ok(r2.bericht.verworfen.length > 0 && r2.bericht.verworfen.every((v) => v.kennung.startsWith('d_P1b/') && ['geraet-nicht-angemeldet', 'nach-entfernung'].includes(v.grund)), JSON.stringify(r2.bericht.verworfen));
  await P1.sync(); await K.sync();
  for (const G of [P1, P2, K]) assert.equal(G.name(kk), 'Kathie', 'nichts vom entfernten Geraet: ' + G.d);
  assert.equal(P1.geraete().filter((g) => g.geraet === 'd_P1b' && !g.entfernt).length, 0, 'bleibt entfernt');
});

/* ---------- Kindergeraet ---------- */
jedeWelt('Kindergeraet entfernen: Bereiche des Kindes wechseln den Schluessel, Hinweis "Passwort neu"; Eintraege des Geraets zaehlen nicht mehr (auch zurueckdatiert oder unter fremdem Pfad); nach dem neuen Passwort liest es nichts Neues', async (W) => {
  const { P1, P2, K } = await familie(W);
  const kk = K.konto.kennung, L = 'kind:lern:' + kk;
  const vorher = Math.max(...P1.wechsel(L).map((w) => w.version), 1);
  const kErst = Date.parse(P1.geraete(kk).find((g) => g.geraet === 'd_K1').erstesMal);
  const r = await geraetEntfernen({ ablage: P1.a, zugang: P1.z(), konto: P1.konto, person: kk, geraet: 'd_K1', now: weiter(W) });
  assert.deepEqual([r.konto, r.passwortNeu, r.fingerabdruck], [null, true, null], 'kein Passwort noetig; Hinweis: Passwort des Kindes neu setzen');
  const rs = await P1.sync();
  assert.deepEqual(rs.bericht.verworfen, []);
  // (im Eltern-Bereich ist das Kindergeraet nie angemeldet - dort aendert sich nichts)
  for (const a of KIND_BEREICHE(kk).slice(0, 3)) assert.ok(P1.wechsel(a).some((w) => (w.geraete || []).includes('d_K1') && w.version > 1), 'neue Version, nennt das Geraet: ' + a);
  assert.equal(P1.wechsel('eltern:allg:' + kk).some((w) => (w.geraete || []).includes('d_K1')), false);
  assert.ok(Math.max(...P1.wechsel(L).map((w) => w.version)) > vorher);
  assert.ok(P1.geraete(kk).find((g) => g.geraet === 'd_K1').entfernt);
  await P2.sync();
  // das entfernte Geraet uebt weiter: zaehlt nicht
  K.ueben(2); await K.sync();
  const r1 = await P1.sync();
  assert.ok(r1.bericht.verworfen.some((v) => v.kennung.startsWith('d_K1/') && v.grund === 'geraet-nicht-angemeldet'), JSON.stringify(r1.bericht.verworfen));
  assert.equal(P1.antworten(kk).length, 3);
  // zurueckdatiert (vor dem Entfernen), mit der aktuellen Version (das Geraet hat Kathies Schluessel noch): unter dem
  // eigenen Pfad und unter einem fremden Pfad - beides verworfen
  const mitglieder = { [P1.konto.kennung]: { role: 'parent', pub: P1.konto.pub }, [P2.konto.kennung]: { role: 'parent', pub: P2.konto.pub }, [kk]: { role: 'child', pub: K.konto.pub } };
  const s = await schluesselLesen(W.geraet('d_K1'), L, { ich: kk, meineSchluessel: K.konto.schluessel, mitglieder });
  assert.ok(s.keys.has(s.aktuell), 'bis zum neuen Passwort hat das Geraet den aktuellen Schluessel (Restrisiko, darum der Hinweis)');
  const frueh = new Date(kErst + 1000).toISOString();
  const ant = (id) => newEvent({ type: 'answer', author: kk, device: 'd_K1', at: frueh, payload: { day: HEUTE, skill: 'numbers', level: 2, attempt: 1, ok: true, qid: id } });
  await einschleusen(W, L, 'd_K1', ant('alt-eigen'), K.konto.schluessel, s);
  await einschleusen(W, L, 'd_ZZ', ant('alt-fremd'), K.konto.schluessel, s);
  const r2 = await P1.sync();
  assert.deepEqual(r2.bericht.verworfen.filter((v) => v.bereich === L).map((v) => v.grund), ['nach-entfernung', 'nach-entfernung'], JSON.stringify(r2.bericht.verworfen));
  assert.equal(P1.antworten(kk).length, 3, 'nichts angekommen');
  // neues Passwort: das alte Geraet liest nichts Neues mehr
  const qr = await kindPasswortNeu({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, kind: kk, now: weiter(W) });
  const K2 = await einloesen(W, 'd_K2', qr, PW.neu, 'Kathies neues iPad');
  await K2.sync(); await P1.sync(); await K2.sync();
  assert.equal(K2.antworten(kk).length, 3);
  K2.ueben(2); await K2.sync(); await P1.sync(); await P2.sync();
  assert.equal(P2.antworten(kk).length, 5);
  const vorK = K.antworten(kk).length;
  await K.sync();
  assert.equal(K.antworten(kk).length, vorK, 'altes Geraet: nichts Neues');
  assert.deepEqual(P1.geraete(kk).map((g) => [g.geraet, !!g.entfernt]), [['d_K1', true], ['d_K2', false]]);
});

/* ---------- Lehrkraft ---------- */
jedeWelt('Lehrkraft entfernt ihr zweites Geraet: neuer Schluessel, Entfernen im eigenen Bereich (Rechte), Liste stimmt', async (W) => {
  const { admin } = await familie(W);
  const sl = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: admin, anmeldename: 'lehrer', art: 'teacher', now: W.uhr.t });
  const T1 = await einloesen(W, 'd_T1', sl, PW.lehrer, 'Schul-Laptop');
  const sync = (G) => geraetAbgleichen({ ablage: G.a, zugang: G.z(), personen: kontoPersonen(G.konto), now: weiter(W), heute: HEUTE, geraetName: G.d === 'd_T1' ? 'Schul-Laptop' : 'Privat' });
  await sync(T1);
  const T2 = geraet(W, 'd_T2', await anmelden({ zugang: W.geraet('d_T2'), anmeldename: 'lehrer', passwort: PW.lehrer, runden: R }));
  await sync(T2); await sync(T1);
  assert.deepEqual(T1.geraete().map((g) => [g.geraet, g.name]), [['d_T1', 'Schul-Laptop'], ['d_T2', 'Privat']]);
  const r = await geraetEntfernen({ ablage: T1.a, zugang: T1.z(), konto: T1.konto, geraet: 'd_T2', passwort: PW.lehrer, neuesPasswort: PW.neu2, runden: R, now: weiter(W) });
  T1.konto = r.konto;
  const rs = await sync(T1);
  assert.deepEqual([rs.verworfen, rs.erneuerungOffen], [[], []]);
  assert.deepEqual(rs.bereiche['person:' + T1.konto.kennung].entfernt, ['d_T2']);
  assert.ok(T1.geraete().find((g) => g.geraet === 'd_T2').entfernt);
  // ein neues Geraet der Lehrkraft sieht das auch
  const T3 = geraet(W, 'd_T3', await anmelden({ zugang: W.geraet('d_T3'), anmeldename: 'lehrer', passwort: PW.neu2, runden: R }));
  const r3 = await sync(T3);
  assert.deepEqual(r3.verworfen, []);
  assert.deepEqual(T3.geraete().map((g) => [g.geraet, !!g.entfernt]), [['d_T1', false], ['d_T2', true], ['d_T3', false]]);
});

test('Reinheit: kein Netz, kein Browser-Speicher, keine Uhr, kein Math.random; Hilfsnamen ger/GER_; nur im Testbau, nach einladung', () => {
  const src = fs.readFileSync(new URL('../../src/module/geraete.mjs', import.meta.url), 'utf8');
  for (const w of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'indexedDB', 'Math.random', 'Date.now', 'setTimeout', 'setInterval', 'document.', 'window.']) assert.equal(src.includes(w), false, w);
  assert.deepEqual([...src.matchAll(/^import .* from '(.+)';$/gm)].map((m) => m[1]), ['./geraeteabgleich.mjs', './konto.mjs', './einladung.mjs']);
  for (const m of src.matchAll(/^(?:export\s+)?(?:async\s+)?(?:function\s+([\w$]+)|(?:const|let|class)\s+([\w$]+))/gm)) {
    const name = m[1] || m[2];
    assert.ok(m[0].startsWith('export') || /^(ger|GER_)/.test(name), name);
  }
  const liste = JSON.parse(fs.readFileSync(new URL('../../src/module/module.json', import.meta.url), 'utf8')).module;
  const mod = liste.find((x) => x.name === 'geraete');
  assert.equal(mod.bau, 'test');
  assert.ok(liste.indexOf(mod) > liste.findIndex((x) => x.name === 'einladung'), 'nach einladung');
  const live = appLesen('utf8', { bauart: 'live' }), testbau = appLesen('utf8', { bauart: 'test' });
  for (const w of ['meineGeraete', 'geraetEntfernen', 'bq_geraetEntfernen']) assert.equal(live.includes(w), false, 'nicht im Live-Bau: ' + w);
  assert.equal(testbau.includes('async function geraetEntfernen('), true, 'im Testbau');
});
