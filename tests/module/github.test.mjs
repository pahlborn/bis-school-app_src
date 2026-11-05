// Modul github ohne Netz (Stufe 3a, Teil 1): derselbe Vertrag wie die Simulation, gegen einen nachgebauten
// GitHub-Server auf 127.0.0.1 (tests/module/github-nachbau.mjs). Dazu: Fehler-Abbildung, ETag, Token-Schutz,
// Abgleich zweier Geraete ueber den GitHub-Speicher.
//   node --test tests/module/github.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import util from 'node:util';
import { githubSpeicher, githubTokenLesen, githubTokenSpeichern, GITHUB_TOKEN_SCHLUESSEL, GITHUB_API, GITHUB_VERSUCHE } from '../../src/module/github.mjs';
import { SPEICHER_FEHLER, SPEICHER_FUNKTIONEN } from '../../src/module/speicher.mjs';
import { speicherVertrag, fehlt } from './speicher-vertrag.mjs';
import { githubNachbau } from './github-nachbau.mjs';
import { abgleichStand, vormerken, abgleichen } from '../../src/module/abgleich.mjs';
import { newPersonKeys, publicKeysOf, newAreaKey } from '../../src/module/krypto.mjs';
import { newEvent } from '../../src/module/ereignisse.mjs';
import { signEvent } from '../../src/module/annahme.mjs';

const REPO = 'pahlborn/bis-school-app-testdaten';
const TOKEN = 'github_pat_TESTTOKEN_' + 'x7Q2'.repeat(10);      // nur im Nachbau gueltig
const B = 'kind:lern:p_k1';
let N, lauf = 0;
before(async () => { N = await githubNachbau({ token: TOKEN, repos: [REPO, 'pahlborn/zweites'] }); });
after(async () => { await N.schliessen(); });

/* ein frischer, leerer Speicher je Aufruf: eigener Unterordner im Nachbau (wie spaeter je Lauf im echten Repo) */
const neu = (o = {}) => githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis, wurzel: 'lauf-' + (++lauf), ...o });

speicherVertrag('GitHub (Nachbau)', (o) => neu(o));

test('GitHub: Ablage im Repo nach Konzept 12 - events/, keys/, directory/, invites/ unter dem Unterordner', async () => {
  const s = neu(), w = 'lauf-' + lauf, a = s.geraet('d_a1');
  await a.put(B, 'd_a1', { nr: 1, inhalt: { v: 1 } });
  await a.putKey(B, 'p_e1', { w: 'W' });
  await a.putDirectory({ lookup: 'h1234', kennung: 'p_e1' });
  await a.invite.put('i1', 'x');
  const pfade = [...N.dateien().keys()].filter((p) => p.startsWith(w + '/')).sort();
  assert.deepEqual(pfade, [w + '/directory/h1234.json', w + '/events/' + B + '/d_a1/1.json', w + '/invites/i1.json', w + '/keys/' + B + '/p_e1.json']);
  assert.equal(N.dateien().get(w + '/events/' + B + '/d_a1/1.json'), '{"v":1}', 'Inhalt unveraendert als JSON');
  // UTF-8 ueber base64 (GitHub liefert Inhalte base64 mit Zeilenumbruechen)
  await a.put(B, 'd_a1', { nr: 2, inhalt: 'Größe – Äpfel 🍎' });
  assert.equal(N.dateien().get(w + '/events/' + B + '/d_a1/2.json'), '"Größe – Äpfel 🍎"');
  assert.equal(await s.geraet('d_b1').get(B, 'd_a1/2'), 'Größe – Äpfel 🍎');
  // ohne Unterordner: direkt im Repo, anderes Repo bleibt leer
  const s2 = githubSpeicher({ repo: 'pahlborn/zweites', token: TOKEN, basis: N.basis });
  await s2.geraet('d_b1').put(B, 'd_b1', { nr: 1, inhalt: 1 });
  assert.deepEqual([...N.dateien('pahlborn/zweites').keys()], ['events/' + B + '/d_b1/1.json']);
  assert.equal(GITHUB_API, 'https://api.github.com');
});

test('GitHub: vorhandene Datei wird nie ueberschrieben - weder Buendel noch Verzeichnis noch Einladung', async () => {
  const s = neu(), w = 'lauf-' + lauf, a = s.geraet('d_a1');
  await a.put(B, 'd_a1', { nr: 1, inhalt: 'erst' });
  const zweiterZugang = neu({ wurzel: w }).geraet('d_a1');      // anderer Tab: kennt nichts im Voraus
  await assert.rejects(zweiterZugang.put(B, 'd_a1', { nr: 1, inhalt: 'neu' }), (e) => e.code === 'vorhanden' && e.gleicherInhalt === false);
  await assert.rejects(zweiterZugang.put(B, 'd_a1', { nr: 1, inhalt: 'erst' }), (e) => e.code === 'vorhanden' && e.gleicherInhalt === true);
  assert.equal(N.dateien().get(w + '/events/' + B + '/d_a1/1.json'), '"erst"');
  const puts = N.log.filter((x) => x.methode === 'PUT' && x.url.includes('/' + w + '/events/'));
  assert.equal(puts.length, 3, 'erst, neu, erst');
  assert.ok(puts.every((x) => !('sha' in JSON.parse(x.body))), 'Buendel werden nie mit sha (= ersetzen) geschrieben');
  await a.putDirectory({ lookup: 'h1', kennung: 'p_e1' });
  await fehlt(zweiterZugang.putDirectory({ lookup: 'h1', kennung: 'p_x9' }), 'vorhanden');
  assert.match(N.dateien().get(w + '/directory/h1.json'), /p_e1/);
  // Schluessel: ersetzen geht nur mit der sha der alten Fassung
  await a.putKey(B, 'p_e1', { w: 1 });
  await a.putKey(B, 'p_e1', { w: 2 });
  const keyPuts = N.log.filter((x) => x.methode === 'PUT' && x.url.includes('/' + w + '/keys/')).map((x) => JSON.parse(x.body));
  assert.equal('sha' in keyPuts[0], false); assert.equal(typeof keyPuts[1].sha, 'string');
});

test('GitHub: 409/422 beim Anlegen -> vorhanden; 409 ohne Datei (anderer Commit kam zuerst) -> wiederholen, dann offline', async () => {
  const s = neu(), w = 'lauf-' + lauf, a = s.geraet('d_a1');
  // 422 vom Server, die Datei liegt da (anderes Geraet schrieb sie gerade) -> vorhanden, mit gleicherInhalt
  await a.put(B, 'd_a1', { nr: 1, inhalt: 'A' });
  N.dateien().set(w + '/events/' + B + '/d_a1/2.json', '"B"');
  await assert.rejects(a.put(B, 'd_a1', { nr: 2, inhalt: 'B' }), (e) => e.code === 'vorhanden' && e.gleicherInhalt === true);
  // 409 ohne Wirkung, Datei fehlt -> nochmals; danach angelegt
  N.stoerung({ methode: 'PUT', pfad: w + '/events/', status: 409, anzahl: 2 });
  assert.equal(await a.put(B, 'd_a1', { nr: 3, inhalt: 'C' }), 'd_a1/3');
  assert.equal(N.dateien().get(w + '/events/' + B + '/d_a1/3.json'), '"C"');
  // 409 bleibt -> offline (der Abgleich versucht es spaeter), nichts angelegt
  N.stoerung({ methode: 'PUT', pfad: w + '/events/', status: 409, anzahl: GITHUB_VERSUCHE });
  await fehlt(a.put(B, 'd_a1', { nr: 4, inhalt: 'D' }), 'offline');
  assert.equal(N.dateien().has(w + '/events/' + B + '/d_a1/4.json'), false);
  assert.equal(await a.put(B, 'd_a1', { nr: 4, inhalt: 'D' }), 'd_a1/4', 'danach geht es');
  // 422 bei Verzeichnis und Einladung
  N.dateien().set(w + '/directory/h9.json', '{"lookup":"h9"}');
  await fehlt(a.putDirectory({ lookup: 'h9', kennung: 'p_e1' }), 'vorhanden');
  N.dateien().set(w + '/invites/i9.json', '{"angelegt":0,"inhalt":1}');
  await fehlt(a.invite.put('i9', 2), 'vorhanden');
  N.stoerungenLeeren();
});

test('GitHub: Fehler-Abbildung - Netz weg, 5xx, 401, 403, 404, Limit mit Wartezeit', async () => {
  const s = neu(), w = 'lauf-' + lauf, a = s.geraet('d_a1');
  await a.put(B, 'd_a1', { nr: 1, inhalt: 1 });
  N.stoerung({ abbruch: true });
  await fehlt(a.list(B), 'offline', 'Verbindung bricht ab');
  N.stoerung({ status: 502 });
  await fehlt(a.get(B, 'd_a1/1'), 'offline', '5xx');
  N.stoerung({ status: 401 });
  await fehlt(a.keys(B), 'zugang', '401');
  N.stoerung({ status: 403 });
  await fehlt(a.directory('h1'), 'zugang', '403 ohne Limit-Angabe = keine Berechtigung');
  await fehlt(githubSpeicher({ repo: REPO, token: 'falscher-token-123', basis: N.basis, wurzel: w }).geraet('d_a1').list(B), 'zugang', 'falscher Token');
  await fehlt(githubSpeicher({ repo: 'pahlborn/gibtsnicht', token: TOKEN, basis: N.basis }).geraet('d_a1').put(B, 'd_a1', { nr: 1, inhalt: 1 }), 'zugang', '404 beim Schreiben = Repo nicht erreichbar');
  await fehlt(a.get(B, 'd_a1/7'), 'unbekannt', '404 beim Lesen eines Buendels');
  assert.equal(await a.directory('h404'), null, '404 beim Verzeichnis = kein Eintrag');
  assert.deepEqual(await a.keys('kind:lern:p_k9'), {}, '404 beim Ordner = leer');
  await fehlt(a.invite.get('i404'), 'unbekannt');
  // Limit: 403 mit x-ratelimit-remaining 0 -> Wartezeit bis reset; 403/429 mit retry-after; 429 ohne Angabe -> 60 s
  const jetzt = Date.UTC(2026, 10, 4, 12, 0, 0), uhr = () => jetzt;
  const b = githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis, wurzel: w, now: uhr }).geraet('d_b1');
  N.stoerung({ status: 403, header: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(jetzt / 1000 + 900) } });
  await assert.rejects(b.list(B), (e) => e.code === 'limit' && e.wartezeit === 900000);
  N.stoerung({ status: 403, header: { 'retry-after': '30' } });
  await assert.rejects(b.get(B, 'd_a1/1'), (e) => e.code === 'limit' && e.wartezeit === 30000, 'zweites Limit (retry-after)');
  N.stoerung({ status: 429, header: { 'retry-after': '5' } });
  await assert.rejects(b.put(B, 'd_b1', { nr: 1, inhalt: 1 }), (e) => e.code === 'limit' && e.wartezeit === 5000);
  N.stoerung({ status: 429 });
  await assert.rejects(b.keys(B), (e) => e.code === 'limit' && e.wartezeit === 60000);
  assert.ok(SPEICHER_FEHLER.includes('zugang') && SPEICHER_FEHLER.includes('limit'));
  // nach einer Stoerung arbeitet alles weiter; das abgebrochene Buendel kam nicht an
  assert.equal(N.dateien().has(w + '/events/' + B + '/d_b1/1.json'), false);
  assert.equal(await b.put(B, 'd_b1', { nr: 1, inhalt: 1 }), 'd_b1/1');
  N.stoerungenLeeren();
});

test('GitHub: offline bei jeder Funktion - nichts geschrieben, Einladung nicht verbraucht', async () => {
  const s = neu(), w = 'lauf-' + lauf, a = s.geraet('d_a1'), b = s.geraet('d_b1');
  await b.put(B, 'd_b1', { nr: 1, inhalt: 'da' });
  await b.invite.put('i1', 'Einladung');
  await b.putDirectory({ lookup: 'h1', kennung: 'p_e1' });
  const vorher = new Map(N.dateien());
  const aufrufe = {
    put: () => a.put(B, 'd_a1', { nr: 1, inhalt: 'x' }), list: () => a.list(B), get: () => a.get(B, 'd_b1/1'), keys: () => a.keys(B),
    putKey: () => a.putKey(B, 'p_e1', { w: 1 }), directory: () => a.directory('h1'), putDirectory: () => a.putDirectory({ lookup: 'h2' }),
    'invite.put': () => a.invite.put('i2', 1), 'invite.get': () => a.invite.get('i1'), 'invite.delete': () => a.invite.delete('i1'),
    exportFile: () => a.exportFile(B), importFile: () => a.importFile(JSON.stringify({ format: 'bq-buendel-datei', v: 1, bereich: B, buendel: [{ geraet: 'd_x1', nr: 1, inhalt: 1 }] })),
    removeArea: () => a.removeArea(B), removeDirectory: () => a.removeDirectory('h1'),
  };
  assert.deepEqual(Object.keys(aufrufe), [...SPEICHER_FUNKTIONEN]);
  for (const [name, f] of Object.entries(aufrufe)) {
    N.stoerung({ abbruch: true, anzahl: 50 });
    await fehlt(f(), 'offline', name);
    N.stoerungenLeeren();
  }
  assert.deepEqual(new Map(N.dateien()), vorher, 'nichts geschrieben, nichts geloescht');
  assert.equal(await a.invite.get('i1'), 'Einladung', 'nicht verbraucht');
  assert.equal(N.dateien().has(w + '/invites/i1.json'), false, 'nach Gebrauch geloescht');
});

test('GitHub: removeArea loescht genau die Dateien des Bereichs (je Datei ein DELETE); bricht es ab, holt ein zweiter Aufruf den Rest nach', async () => {
  const s = neu(), w = 'lauf-' + lauf, a = s.geraet('d_a1'), b = s.geraet('d_b1'), B2 = 'kind:privat:p_k1';
  for (let nr = 1; nr <= 3; nr++) await a.put(B, 'd_a1', { nr, inhalt: nr });
  await b.put(B, 'd_b1', { nr: 1, inhalt: 'b' });
  await a.put(B2, 'd_a1', { nr: 1, inhalt: 'bleibt' });
  await a.putKey(B, 'p_e1', { w: 1 }); await a.putKey(B2, 'p_e1', { w: 2 });
  await a.putDirectory({ lookup: 'h1', kennung: 'p_e1' });
  const unter = (p) => [...N.dateien().keys()].filter((k) => k.startsWith(w + '/' + p)).sort();
  const vorher = N.zaehler.je.DELETE || 0;
  N.stoerung({ abbruch: true, methode: 'DELETE', anzahl: 1 });
  await fehlt(a.removeArea(B), 'offline', 'Abbruch mitten im Loeschen');
  N.stoerungenLeeren();
  assert.deepEqual(await b.removeArea(B), { buendel: 4, schluessel: 1 }, 'zweiter Aufruf holt den Rest nach');
  assert.deepEqual(unter('events/' + B + '/'), []);
  assert.deepEqual(unter('keys/' + B + '/'), []);
  assert.deepEqual(unter('events/' + B2 + '/'), [w + '/events/' + B2 + '/d_a1/1.json'], 'anderer Bereich bleibt');
  assert.deepEqual(unter('keys/' + B2 + '/'), [w + '/keys/' + B2 + '/p_e1.json']);
  assert.deepEqual(unter('directory/'), [w + '/directory/h1.json']);
  assert.ok((N.zaehler.je.DELETE || 0) - vorher >= 5, 'je Datei ein DELETE');
  assert.deepEqual((await a.list(B)).kennungen, []);
  assert.equal(await a.put(B, 'd_a1', { nr: 1, inhalt: 'neu' }), 'd_a1/1', 'danach wie neu (der Zugang vergisst, was er kannte)');
});

test('GitHub: ETag - unveraenderter Ordner kostet nichts (304), Baum nur bei Aenderung im eigenen Bereich', async () => {
  const s = neu(), a = s.geraet('d_a1'), c = s.geraet('d_c1');
  for (let nr = 1; nr <= 3; nr++) await a.put(B, 'd_a1', { nr, inhalt: nr });
  const l1 = await c.list(B);
  const z0 = { ...N.zaehler }, s0 = s.anfragen();
  const l2 = await c.list(B, l1.merker);
  assert.deepEqual(l2.kennungen, []);
  assert.equal(N.zaehler.anfragen - z0.anfragen, 1, 'eine Anfrage');
  assert.equal(N.zaehler.unveraendert - z0.unveraendert, 1, 'mit 304 beantwortet');
  assert.equal(N.zaehler.baum - z0.baum, 0, 'kein Baum geholt');
  assert.deepEqual(s.anfragen().unveraendert - s0.unveraendert, 1, 'Zaehler im Modul');
  // zehnmal ohne Aenderung: zehn 304, keine einzige zaehlende Anfrage
  const z1 = { ...N.zaehler };
  for (let i = 0; i < 10; i++) await c.list(B, l1.merker);
  assert.equal(N.zaehler.anfragen - z1.anfragen, 10); assert.equal(N.zaehler.unveraendert - z1.unveraendert, 10);
  // Aenderung in einem anderen Bereich: Ordner neu (200), Baum dieses Bereichs bleibt (gleiche sha)
  await a.put('kind:lern:p_k2', 'd_a1', { nr: 1, inhalt: 1 });
  const z2 = { ...N.zaehler };
  assert.deepEqual((await c.list(B, l1.merker)).kennungen, []);
  assert.equal(N.zaehler.unveraendert - z2.unveraendert, 0); assert.equal(N.zaehler.baum - z2.baum, 0);
  // Aenderung im eigenen Bereich: Ordner + Baum = 2 Anfragen
  await a.put(B, 'd_a1', { nr: 4, inhalt: 4 });
  const z3 = { ...N.zaehler };
  assert.deepEqual((await c.list(B, l1.merker)).kennungen, ['d_a1/4']);
  assert.equal(N.zaehler.anfragen - z3.anfragen, 2); assert.equal(N.zaehler.baum - z3.baum, 1);
  // put kennt eigene Nummern: kein Nachsehen der Vornummer
  const z4 = { ...N.zaehler };
  await a.put(B, 'd_a1', { nr: 5, inhalt: 5 });
  assert.equal(N.zaehler.anfragen - z4.anfragen, 1, 'ein PUT, sonst nichts');
});

test('GitHub: Token-Schutz - nie in Meldungen, Fehlern, Ergebnissen, Adressen oder Inhalten; nur im Authorization-Kopf', async () => {
  const s = neu(), w = 'lauf-' + lauf, a = s.geraet('d_a1');
  const fehler = [];
  const fang = async (p) => { try { await p; } catch (e) { fehler.push(e); } };
  await a.put(B, 'd_a1', { nr: 1, inhalt: 1 });
  N.stoerung({ abbruch: true }); await fang(a.list(B));
  N.stoerung({ status: 500 }); await fang(a.list(B));
  N.stoerung({ status: 401 }); await fang(a.list(B));
  N.stoerung({ status: 403 }); await fang(a.list(B));
  N.stoerung({ status: 403, header: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1' } }); await fang(a.list(B));
  N.stoerung({ status: 429 }); await fang(a.list(B));
  await fang(a.get(B, 'd_a1/9'));
  await fang(a.put(B, 'd_a1', { nr: 1, inhalt: 2 }));
  await fang(a.put(B, 'd_a1', { nr: 5, inhalt: 2 }));
  await fang(a.put(B, 'd_x1', { nr: 1, inhalt: 2 }));
  await fang(a.put('a/b', 'd_a1', { nr: 1, inhalt: 2 }));
  await fang(githubSpeicher({ repo: 'pahlborn/gibtsnicht', token: TOKEN, basis: N.basis }).geraet('d_a1').put(B, 'd_a1', { nr: 1, inhalt: 1 }));
  for (const f of [() => githubSpeicher({ repo: 'x', token: TOKEN }), () => githubSpeicher({ repo: REPO, token: TOKEN, basis: 'kein url' }), () => githubSpeicher({ repo: REPO, token: TOKEN + ' leer' }), () => s.geraet('a/b')]) {
    try { f(); } catch (e) { fehler.push(e); }
  }
  // mit fetch, das selbst den Kopf in seine Meldung schreibt (wie manche Browser-Erweiterungen)
  const plaudernd = githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis, wurzel: w, fetch: async (url, o) => { throw new TypeError('failed ' + url + ' ' + JSON.stringify(o.headers)); } });
  await fang(plaudernd.geraet('d_a1').list(B));
  N.stoerungenLeeren();
  assert.deepEqual([...new Set(fehler.map((e) => e.code))].sort(), ['fremdes-geraet', 'limit', 'luecke', 'offline', 'unbekannt', 'ungueltig', 'vorhanden', 'zugang']);
  const teil = TOKEN.slice(-12);
  for (const e of fehler) {
    const alles = [e.message, e.stack, String(e), JSON.stringify(e), util.inspect(e, { depth: 5, showHidden: true }), ...Object.getOwnPropertyNames(e).map((k) => String(e[k])), e.cause ? util.inspect(e.cause) : ''].join('\n');
    assert.equal(alles.includes(teil), false, 'Fehler ' + e.code + ' nennt den Token');
    assert.equal(e.cause, undefined, 'keine Ursache mit Anfrage-Daten');
  }
  for (const x of [s, a, s.anfragen(), await a.list(B), await a.exportFile(B)]) {
    const t = typeof x === 'string' ? x : util.inspect(x, { depth: 8, showHidden: true }) + JSON.stringify(x);
    assert.equal(t.includes(teil), false, 'Ergebnis/Objekt nennt den Token');
  }
  for (const r of N.log) {
    assert.equal(r.url.includes(teil), false, 'Adresse');
    assert.equal(r.body.includes(teil), false, 'Inhalt');
    for (const [k, v] of Object.entries(r.header)) if (k !== 'authorization') assert.equal(String(v).includes(teil), false, 'Kopf ' + k);
  }
  for (const [p, t] of N.dateien()) assert.equal(p.includes(teil) || t.includes(teil), false, 'Datei im Repo');
});

test('Token nur aus bqt_gh - nie gh_token der Werkstatt-Apps (Ablage und Suchlauf ueber den App-Quelltext)', () => {
  assert.equal(GITHUB_TOKEN_SCHLUESSEL, 'bqt_gh');
  const ablage = (werte) => { const m = new Map(Object.entries(werte)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m }; };
  const nurWerkstatt = ablage({ gh_token: 'ghp_WERKSTATT0123456789' });
  assert.equal(githubTokenLesen(nurWerkstatt), null, 'der Token der Werkstatt-Apps wird nicht genommen');
  const beide = ablage({ gh_token: 'ghp_WERKSTATT0123456789', bqt_gh: TOKEN });
  assert.equal(githubTokenLesen(beide), TOKEN);
  const leer = ablage({});
  githubTokenSpeichern(leer, '  ' + TOKEN + '\n');
  assert.deepEqual([...leer.m.entries()], [['bqt_gh', TOKEN]], 'nur bqt_gh geschrieben, ohne Leerzeichen');
  for (const t of ['', 'kurz', 'mit leerzeichen drin', null, 7]) assert.throws(() => githubTokenSpeichern(leer, t), (e) => e.code === 'ungueltig' && !String(e.message).includes('leerzeichen'));
  assert.equal(githubTokenLesen({ getItem() { throw new Error('gesperrt'); } }), null);
  // Suchlauf: kein Quelltext der App (index.html, Module, Werkzeuge) nennt gh_token
  const wurzel = new URL('../../', import.meta.url);
  const dateien = [new URL('index.html', wurzel)];
  for (const o of ['src/module/', 'werkzeug/']) {
    const dir = new URL(o, wurzel);
    for (const n of fs.readdirSync(dir)) if (/\.(mjs|js|json|html)$/.test(n)) dateien.push(new URL(n, dir));
  }
  assert.ok(dateien.length > 20);
  for (const d of dateien) assert.equal(fs.readFileSync(d, 'utf8').includes('gh_token'), false, path.basename(d.pathname));
});

test('Reinheit: kein Browser-Speicher, kein Zufall, keine Ausgabe; Netz nur ueber das uebergebene fetch; Hilfsnamen mit ghs/GHS_', () => {
  const src = fs.readFileSync(new URL('../../src/module/github.mjs', import.meta.url), 'utf8');
  for (const wort of ['localStorage', 'sessionStorage', 'indexedDB', 'XMLHttpRequest', 'Math.random', 'console.', 'gh_token', 'document.', 'window.']) assert.equal(src.includes(wort), false, wort);
  const fetchAufrufe = [...src.matchAll(/\bfetch\b/g)].length;
  assert.equal((src.match(/fetch: holer = globalThis\.fetch/g) || []).length, 1, 'fetch nur als Vorgabe des Parameters');
  assert.ok(fetchAufrufe >= 1);
  assert.equal(/[^.\w]fetch\(/.test(src), false, 'kein direkter Aufruf von fetch');
  const oben = [...src.matchAll(/^(?:export\s+)?(?:async\s+)?(?:function\s+([\w$]+)|(?:const|let|class)\s+([\w$]+))/gm)];
  for (const m of oben) {
    const name = m[1] || m[2];
    assert.ok(m[0].startsWith('export') || /^(ghs|GHS_)/.test(name), name);
  }
});

/* ---------- Abgleich zweier Geraete ueber den GitHub-Speicher (Modul abgleich unveraendert) ---------- */
const AREA = 'kind:lern:p_k1', T0 = Date.UTC(2026, 10, 4, 8, 0, 0), JETZT = Date.UTC(2026, 10, 4, 18, 0, 0);
test('Abgleich ueber GitHub: Kind- und Eltern-Geraet, mal ohne Netz - gleiches Protokoll; Anfragen je Abgleich gemessen', async (ctx) => {
  const kind = await newPersonKeys(), eltern = await newPersonKeys();
  const Z = { area: AREA, members: { p_k1: { role: 'child', pub: await publicKeysOf(kind), devices: ['d_k1'] }, p_e1: { role: 'parent', pub: await publicKeysOf(eltern), devices: ['d_e1'] } } };
  const SCH = { aktuell: 1, keys: new Map([[1, await newAreaKey()]]) };
  let t = 0, q = 0;
  const ereignis = (dev) => {
    const kindIst = dev === 'd_k1';
    const typ = kindIst ? 'answer' : 'profile_set';
    const payload = kindIst ? { day: '2026-11-04', skill: 'round', level: 2, attempt: 1, ok: ++q % 2 === 0, qid: 'q' + q } : { field: 'name', value: 'Kim ' + ++q };
    return signEvent(newEvent({ type: typ, author: kindIst ? 'p_k1' : 'p_e1', device: dev, at: new Date(T0 + (t += 1003)).toISOString(), payload }), AREA, kindIst ? kind : eltern);
  };
  const s = neu();
  const g = ['d_k1', 'd_e1'].map((id) => ({ id, z: s.geraet(id), st: abgleichStand(AREA, id) }));
  const alle = new Set(), messung = [];
  for (let runde = 0; runde < 6; runde++) {
    for (const [i, x] of g.entries()) {
      for (let k = 0; k <= runde % 3; k++) { const e = await ereignis(x.id); vormerken(x.st, e, { now: JETZT }); alle.add(e.event.id); }
      const ohneNetz = (runde + i) % 4 === 1;
      if (ohneNetz) N.stoerung({ abbruch: true, anzahl: 100 });
      const vor = s.anfragen();
      const r = await abgleichen(x.st, { zugang: x.z, schluessel: SCH, zulassung: Z, now: JETZT });
      N.stoerungenLeeren();
      assert.equal(r.ok, !ohneNetz, 'Runde ' + runde + ' ' + x.id);
      if (ohneNetz) assert.equal(r.fehler, 'offline');
      else { assert.deepEqual(r.verworfen, []); messung.push(s.anfragen().gesamt - vor.gesamt); }
    }
  }
  for (let n = 0; n < 2; n++) for (const x of g) assert.equal((await abgleichen(x.st, { zugang: x.z, schluessel: SCH, zulassung: Z, now: JETZT })).ok, true);
  const ids = (st) => st.log.map((e) => e.event.id);
  assert.equal(ids(g[0].st).length, alle.size, 'kein Ereignis verloren');
  assert.deepEqual(ids(g[0].st), ids(g[1].st), 'gleiches Protokoll, gleiche Reihenfolge');
  assert.deepEqual(new Set(ids(g[1].st)), alle);
  // ein Abgleich mit Neuem: senden (PUT) + list (Ordner, Baum) + je fremdem Buendel ein GET - hier hoechstens 6
  ctx.diagnostic('Anfragen je Abgleich mit Neuem: ' + messung.join(', '));
  assert.ok(Math.max(...messung) <= 6, 'Anfragen je Abgleich: ' + messung.join(', '));
  // ohne Neues: eine einzige Anfrage, beantwortet mit 304
  const vor = s.anfragen();
  await abgleichen(g[0].st, { zugang: g[0].z, schluessel: SCH, zulassung: Z, now: JETZT });
  assert.deepEqual([s.anfragen().gesamt - vor.gesamt, s.anfragen().unveraendert - vor.unveraendert], [1, 1]);
});

test('githubSpeicher: Eingaben werden geprueft (ohne den Token zu nennen)', () => {
  const gut = { repo: REPO, token: TOKEN, basis: 'http://127.0.0.1:1' };
  for (const x of [{ repo: 'kein-repo' }, { repo: 'a/../b' }, { repo: 'a/b/c' }, { token: '' }, { token: 'mit leer zeichen' }, { token: 7 }, { fetch: 'x' }, { now: 1 }, { basis: 'ftp://x' }, { basis: 'https://x/pfad' }, { zweig: 'a b' }, { zweig: '..' }, { wurzel: '../x' }, { wurzel: '/x' }, { wurzel: 'a//b' }]) {
    assert.throws(() => githubSpeicher({ ...gut, ...x }), (e) => e.code === 'ungueltig' && !e.message.includes(TOKEN.slice(-12)), JSON.stringify(x));
  }
  assert.throws(() => githubSpeicher(), (e) => e.code === 'ungueltig');
  const s = githubSpeicher({ ...gut, basis: 'https://api.github.com/', wurzel: 'laeufe/l-1', zweig: 'test-daten' });
  assert.equal(typeof s.geraet('d_a1').put, 'function');
  for (const g of ['', 'a/b', '__proto__', null, 7]) assert.throws(() => s.geraet(g), (e) => e.code === 'ungueltig', String(g));
});
