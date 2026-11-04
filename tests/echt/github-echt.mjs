// Stufe 3a, Teil 2: der GitHub-Speicher gegen das ECHTE Repo (pahlborn/bis-school-app-testdaten).
// NICHT Teil von npm test. Nur ueber den Starter laufen lassen (der raeumt danach auf und prueft die Ausgabe):
//   node werkzeug/github-probe.mjs [--ort firmennetz|zuhause]
// Umgebung (setzt der Starter):
//   BQ_GH_LAUF        Kennung dieses Laufs; alles liegt unter laeufe/<Kennung>/ im Repo
//   BQ_GH_TOKEN_DATEI Pfad der Token-Datei (der Token selbst steht nie in der Umgebung, nie in einer Ausgabe)
//   BQ_GH_MESSUNG     Datei fuer die Messwerte (JSON, ohne Token)
//   BQ_GH_REPO        optional, Vorgabe pahlborn/bis-school-app-testdaten
//
// Inhalt: die 12 Vertragstests (tests/module/speicher-vertrag.mjs) mit eigenem Unterordner je frischem Speicher,
// dazu: ETag/304 beim echten GitHub, Fehler-Abbildung (falscher Token, Repo ausserhalb des Tokens), Abgleich
// zweier Geraete mit Messung der Anfragen je Abgleich, CORS fuer die App unter pahlborn.github.io.
// Schreibzugriffe werden gedrosselt (GitHub erlaubt hoechstens 80 inhaltserzeugende Anfragen je Minute).

import { test, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { githubSpeicher } from '../../src/module/github.mjs';
import { speicherVertrag, fehlt } from '../module/speicher-vertrag.mjs';
import { abgleichStand, vormerken, abgleichen } from '../../src/module/abgleich.mjs';
import { newPersonKeys, publicKeysOf, newAreaKey } from '../../src/module/krypto.mjs';
import { newEvent } from '../../src/module/ereignisse.mjs';
import { signEvent } from '../../src/module/annahme.mjs';

const LAUF = process.env.BQ_GH_LAUF || '';
const REPO = process.env.BQ_GH_REPO || 'pahlborn/bis-school-app-testdaten';
if (!/^[A-Za-z0-9_-]{1,48}$/.test(LAUF)) throw new Error('BQ_GH_LAUF fehlt - bitte ueber werkzeug/github-probe.mjs starten');
const TOKEN = fs.readFileSync(process.env.BQ_GH_TOKEN_DATEI || '', 'utf8').trim();
const WURZEL = 'laeufe/' + LAUF;

/* ---------- fetch mit Drossel und Messung ---------- */
const messung = { tests: [], abgleich: null, status: {}, wiederholt409: 0, limitAntworten: 0, rateUsed: null, rateRest: null, cors: null };
const zaehler = { gesamt: 0, unveraendert: 0, schreiben: 0, ms: 0 };
const SCHREIB_TAKT_MS = 900, SCHREIB_VORRAT = 10;            // ~66 je Minute, kurz bis 10 am Stueck
let vorrat = SCHREIB_VORRAT, zuletzt = Date.now(), kette = Promise.resolve();
const warte = (ms) => new Promise((r) => setTimeout(r, ms));
function schreibFreigabe() {
  kette = kette.then(async () => {
    const jetzt = Date.now();
    vorrat = Math.min(SCHREIB_VORRAT, vorrat + (jetzt - zuletzt) / SCHREIB_TAKT_MS);
    zuletzt = jetzt;
    if (vorrat < 1) { await warte((1 - vorrat) * SCHREIB_TAKT_MS); vorrat = 1; zuletzt = Date.now(); }
    vorrat -= 1;
  });
  return kette;
}
async function holer(url, o = {}) {
  const methode = o.method || 'GET';
  if (methode !== 'GET') { await schreibFreigabe(); zaehler.schreiben++; }
  const t0 = Date.now();
  const r = await fetch(url, o);
  zaehler.ms += Date.now() - t0;
  zaehler.gesamt++;
  if (r.status === 304) zaehler.unveraendert++;
  messung.status[r.status] = (messung.status[r.status] || 0) + 1;
  if (r.status === 409 && methode === 'PUT') messung.wiederholt409++;
  if (r.status === 429 || (r.status === 403 && (r.headers.get('retry-after') !== null || r.headers.get('x-ratelimit-remaining') === '0'))) messung.limitAntworten++;
  if (r.headers.get('x-ratelimit-used') !== null) { messung.rateUsed = Number(r.headers.get('x-ratelimit-used')); messung.rateRest = Number(r.headers.get('x-ratelimit-remaining')); }
  return r;
}

let nr = 0;
/* je frischem Speicher ein eigener Unterordner dieses Laufs */
const neu = (o = {}) => githubSpeicher({ repo: REPO, token: TOKEN, fetch: holer, wurzel: WURZEL + '/s' + (++nr), ...o });

let vorTest = null;
beforeEach(() => { vorTest = { ...zaehler, t: Date.now() }; });
afterEach((t) => {
  messung.tests.push({ name: t.name, anfragen: zaehler.gesamt - vorTest.gesamt, unveraendert: zaehler.unveraendert - vorTest.unveraendert, schreiben: zaehler.schreiben - vorTest.schreiben, sekunden: Math.round((Date.now() - vorTest.t) / 100) / 10 });
});
after(() => {
  if (process.env.BQ_GH_MESSUNG) fs.writeFileSync(process.env.BQ_GH_MESSUNG, JSON.stringify({ ...messung, gesamt: zaehler }, null, 1));
});

/* ---------- die Vertragstests, unveraendert ---------- */
speicherVertrag('GitHub (echt)', (o) => neu(o));

/* ---------- Eigenheiten des echten GitHub ---------- */
const B = 'kind:lern:p_k1';

test('echt: Ablage, Umlaute, ETag - unveraendert = 304, Baum nur bei Aenderung', async () => {
  const s = neu(), a = s.geraet('d_a1'), c = s.geraet('d_c1');
  await a.put(B, 'd_a1', { nr: 1, inhalt: 'Größe – Äpfel 🍎' });
  assert.equal(await c.get(B, 'd_a1/1'), 'Größe – Äpfel 🍎');
  await a.put(B, 'd_a1', { nr: 2, inhalt: 2 });
  const l1 = await c.list(B);
  assert.deepEqual(l1.kennungen, ['d_a1/1', 'd_a1/2']);
  const v = s.anfragen();
  for (let i = 0; i < 3; i++) assert.deepEqual((await c.list(B, l1.merker)).kennungen, []);
  const n = s.anfragen();
  assert.deepEqual([n.gesamt - v.gesamt, n.unveraendert - v.unveraendert], [3, 3], 'drei list ohne Aenderung = drei 304');
  await a.put(B, 'd_a1', { nr: 3, inhalt: 3 });
  const v2 = s.anfragen();
  assert.deepEqual((await c.list(B, l1.merker)).kennungen, ['d_a1/3']);
  assert.equal(s.anfragen().gesamt - v2.gesamt, 2, 'Ordner + Baum');
});

test('echt: Fehler - falscher Token -> zugang, Repo ausserhalb des Tokens -> zugang (Schreiben), Token nie in Fehlern', async () => {
  const fehler = [];
  const fang = (code) => (e) => { fehler.push(e); return e.code === code; };
  const falsch = githubSpeicher({ repo: REPO, token: 'github_pat_FALSCH_' + 'q9'.repeat(20), fetch: holer, wurzel: WURZEL + '/falsch' });
  await assert.rejects(falsch.geraet('d_a1').list(B), fang('zugang'));
  await assert.rejects(falsch.geraet('d_a1').put(B, 'd_a1', { nr: 1, inhalt: 1 }), fang('zugang'));
  // ein Repo, das es nicht gibt (nie ein echtes fremdes Repo beschreiben)
  const fremd = githubSpeicher({ repo: 'pahlborn/bis-school-app-gibtsnicht', token: TOKEN, fetch: holer });
  await assert.rejects(fremd.geraet('d_a1').put(B, 'd_a1', { nr: 1, inhalt: 1 }), fang('zugang'));
  assert.deepEqual((await fremd.geraet('d_a1').list(B)).kennungen, [], 'Lesen: leer (Entscheidung Teil 1)');
  await fehlt(neu().geraet('d_a1').get(B, 'd_a1/1'), 'unbekannt');
  const teil = TOKEN.slice(-12);
  for (const e of fehler) for (const t of [e.message, e.stack, JSON.stringify(e), String(e)]) assert.equal(String(t).includes(teil), false);
});

test('echt: CORS fuer die App unter pahlborn.github.io - Kopfzeilen erlaubt und lesbar', async () => {
  const url = 'https://api.github.com/repos/' + REPO + '/contents/' + WURZEL;
  const r = await fetch(url, { method: 'OPTIONS', headers: { Origin: 'https://pahlborn.github.io', 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'authorization,content-type,if-none-match,x-github-api-version' } });
  const erlaubt = (r.headers.get('access-control-allow-headers') || '').toLowerCase();
  const herkunft = r.headers.get('access-control-allow-origin');
  const methoden = (r.headers.get('access-control-allow-methods') || '').toUpperCase();
  const g = await fetch(url, { headers: { Origin: 'https://pahlborn.github.io', Authorization: 'Bearer ' + TOKEN } });
  const lesbar = (g.headers.get('access-control-expose-headers') || '').toLowerCase();
  messung.cors = { preflight: r.status, herkunft, methoden, erlaubt, lesbar };
  assert.ok(r.status === 204 || r.status === 200, 'Preflight ' + r.status);
  assert.ok(herkunft === '*' || herkunft === 'https://pahlborn.github.io', 'Origin');
  for (const m of ['GET', 'PUT', 'DELETE']) assert.ok(methoden.includes(m), m);
  for (const k of ['authorization', 'content-type', 'if-none-match', 'x-github-api-version']) assert.ok(erlaubt.includes(k), k);
  for (const k of ['etag', 'retry-after', 'x-ratelimit-remaining', 'x-ratelimit-reset']) assert.ok(lesbar.includes(k), 'lesbar ' + k);
});

/* ---------- Abgleich zweier Geraete ueber das echte Repo, Anfragen je Abgleich ---------- */
const AREA = 'kind:lern:p_k1', T0 = Date.UTC(2026, 10, 4, 8, 0, 0), JETZT = Date.UTC(2026, 10, 4, 18, 0, 0);
test('echt: Abgleich Kind- und Eltern-Geraet - gleiches Protokoll; Anfragen und Zeit je Abgleich', async (ctx) => {
  const kind = await newPersonKeys(), eltern = await newPersonKeys();
  const Z = { area: AREA, members: { p_k1: { role: 'child', pub: await publicKeysOf(kind), devices: ['d_k1'] }, p_e1: { role: 'parent', pub: await publicKeysOf(eltern), devices: ['d_e1'] } } };
  const SCH = { aktuell: 1, keys: new Map([[1, await newAreaKey()]]) };
  let t = 0, q = 0;
  const ereignis = (dev) => {
    const kindIst = dev === 'd_k1';
    const payload = kindIst ? { day: '2026-11-04', skill: 'round', level: 2, attempt: 1, ok: ++q % 2 === 0, qid: 'q' + q } : { field: 'name', value: 'Kim ' + ++q };
    return signEvent(newEvent({ type: kindIst ? 'answer' : 'profile_set', author: kindIst ? 'p_k1' : 'p_e1', device: dev, at: new Date(T0 + (t += 1003)).toISOString(), payload }), AREA, kindIst ? kind : eltern);
  };
  const s = neu();
  const g = ['d_k1', 'd_e1'].map((id) => ({ id, z: s.geraet(id), st: abgleichStand(AREA, id) }));
  const alle = new Set(), mitNeuem = [];
  const einmal = async (x) => {
    const vor = s.anfragen(), t0 = Date.now();
    const r = await abgleichen(x.st, { zugang: x.z, schluessel: SCH, zulassung: Z, now: JETZT });
    assert.equal(r.ok, true, JSON.stringify(r.fehler || ''));
    assert.deepEqual(r.verworfen, []);
    const n = s.anfragen();
    return { anfragen: n.gesamt - vor.gesamt, unveraendert: n.unveraendert - vor.unveraendert, ms: Date.now() - t0 };
  };
  for (let runde = 0; runde < 6; runde++) {
    for (const x of g) {
      for (let k = 0; k <= runde % 3; k++) { const e = await ereignis(x.id); vormerken(x.st, e, { now: JETZT }); alle.add(e.event.id); }
      mitNeuem.push({ geraet: x.id, ereignisse: (runde % 3) + 1, ...(await einmal(x)) });
    }
  }
  const nachholen = [];
  for (const x of g) nachholen.push(await einmal(x));
  const ohneNeues = [];
  for (let i = 0; i < 3; i++) for (const x of g) ohneNeues.push(await einmal(x));
  const ids = (st) => st.log.map((e) => e.event.id);
  assert.equal(ids(g[0].st).length, alle.size, 'kein Ereignis verloren');
  assert.deepEqual(ids(g[0].st), ids(g[1].st), 'gleiches Protokoll, gleiche Reihenfolge');
  messung.abgleich = { mitNeuem, nachholen, ohneNeues };
  ctx.diagnostic('Anfragen je Abgleich mit Neuem: ' + mitNeuem.map((m) => m.anfragen).join(', '));
  ctx.diagnostic('ohne Neues: ' + ohneNeues.map((m) => m.anfragen + '(' + m.unveraendert + 'x304)').join(', '));
  assert.ok(ohneNeues.every((m) => m.anfragen === 1 && m.unveraendert === 1), 'ohne Neues: eine Anfrage mit 304');
  assert.ok(Math.max(...mitNeuem.map((m) => m.anfragen)) <= 6, 'mit Neuem hoechstens 6');
});
