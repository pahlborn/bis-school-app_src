// Gemerkter Schluessel: Ablage, dist-Bau damit und das Skript ohne Passwort.
//   node --test tests/ablage.test.mjs
// Ablage und "veroeffentlichte Seite" sind auf Temp-Ordner und einen lokalen
// Server umgelenkt - der echte gemerkte Schluessel und dist/ bleiben unberuehrt.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { schluesselAusPasswort, schluesselRoh, entschluesseln, tresorAusHuelle, ITERATIONEN, b64 } from '../werkzeug/kern.mjs';
import { WURZEL, quellenLesen, distBauen } from '../werkzeug/bauen.mjs';
import { TEST_PW } from './hilfen.mjs';

const tmp = () => fs.mkdtemp(path.join(os.tmpdir(), 'bq-ablage-'));
const gibtEs = (p) => fs.access(p).then(() => true, () => false);
const q = await quellenLesen();
const rohAus = async (pw) => schluesselRoh(await schluesselAusPasswort(pw, q.salt));

// Ablage-Modul mit umgelenktem Ordner laden (liest die Umgebung bei jedem Aufruf)
const ablageOrdner = await tmp();
process.env.BQ_SCHLUESSEL_ORDNER = ablageOrdner;
const ablage = await import('../werkzeug/schluesselablage.mjs');

let server, url, veroeffentlicht = '';
before(async () => {
  server = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(veroeffentlicht); });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  url = `http://127.0.0.1:${server.address().port}/`;
  veroeffentlicht = await fs.readFile(path.join((await distBauen(TEST_PW, { ziel: await tmp() })).ziel, 'index.html'), 'utf8');
});
after(() => server?.close());

/**
 * Startet das Skript ohne Terminal (wie aus einem Agenten oder einer Pipe).
 * Asynchron: der lokale Server laeuft im selben Prozess und muss antworten koennen.
 */
function skript(args, ordner) {
  return new Promise((resolve) => {
    const k = spawn(process.execPath, [path.join(WURZEL, 'werkzeug/verschluesseln.mjs'), ...args], {
      env: { ...process.env, BQ_SCHLUESSEL_ORDNER: ordner, BQ_VEROEFFENTLICHT: url }, stdio: ['ignore', 'pipe', 'pipe']
    });
    let aus = '';
    k.stdout.on('data', (d) => { aus += d; });
    k.stderr.on('data', (d) => { aus += d; });
    k.on('close', (code) => resolve({ code, aus }));
  });
}

test('Ablage: speichern, lesen, anderes Salt, vergessen', async () => {
  await ablage.vergessen();
  assert.deepEqual(await ablage.lesen(q.salt, ITERATIONEN), { fehlt: true });
  const roh = await rohAus(TEST_PW);
  const ort = await ablage.speichern(roh, q.salt, ITERATIONEN);
  assert.equal(path.dirname(ort), ablageOrdner);
  const g = await ablage.lesen(q.salt, ITERATIONEN);
  assert.ok(Buffer.from(g.roh).equals(Buffer.from(roh)));

  const datei = await fs.readFile(ort, 'utf8');
  assert.ok(!datei.includes(TEST_PW), 'Passwort darf nie in der Datei stehen');
  if (process.platform === 'win32') assert.ok(!datei.includes(b64(roh)), 'unter Windows nur DPAPI-geschuetzt ablegen');

  const anderesSalt = new Uint8Array(16).fill(7);
  assert.ok((await ablage.lesen(anderesSalt, ITERATIONEN)).unbrauchbar);
  assert.ok((await ablage.lesen(q.salt, ITERATIONEN + 1)).unbrauchbar);

  assert.equal(await ablage.vergessen(), true);
  assert.deepEqual(await ablage.lesen(q.salt, ITERATIONEN), { fehlt: true });
});

test('Ablage liegt ausserhalb des Repos', () => {
  delete process.env.BQ_SCHLUESSEL_ORDNER;
  try {
    assert.ok(!path.resolve(ablage.ablagePfad()).startsWith(path.resolve(WURZEL)), ablage.ablagePfad());
  } finally {
    process.env.BQ_SCHLUESSEL_ORDNER = ablageOrdner;
  }
});

test('dist mit gemerktem Schluessel laesst sich mit dem Passwort oeffnen', async () => {
  const r = await distBauen({ schluesselRoh: await rohAus(TEST_PW) }, { ziel: await tmp() });
  const html = await fs.readFile(path.join(r.ziel, 'index.html'), 'utf8');
  assert.ok(Buffer.from(await entschluesseln(tresorAusHuelle(html), TEST_PW)).equals(q.app));
});

test('Skript: mit gemerktem Schluessel ohne Passwort, Abgleich passt', async () => {
  const ordner = await tmp();
  process.env.BQ_SCHLUESSEL_ORDNER = ordner;
  await ablage.speichern(await rohAus(TEST_PW), q.salt, ITERATIONEN);
  process.env.BQ_SCHLUESSEL_ORDNER = ablageOrdner;
  const ziel = path.join(await tmp(), 'dist');
  const r = await skript(['--ziel', ziel], ordner);
  assert.equal(r.code, 0, r.aus);
  assert.match(r.aus, /kein Passwort noetig/);
  assert.match(r.aus, /Abgleich: Der Schluessel oeffnet die veroeffentlichte Seite/);
  const html = await fs.readFile(path.join(ziel, 'index.html'), 'utf8');
  assert.ok(Buffer.from(await entschluesseln(tresorAusHuelle(html), TEST_PW)).equals(q.app));
});

test('Skript: gemerkter Schluessel passt nicht zur veroeffentlichten Seite -> Abbruch, nichts geschrieben', async () => {
  const ordner = await tmp();
  process.env.BQ_SCHLUESSEL_ORDNER = ordner;
  await ablage.speichern(await rohAus(TEST_PW + '-anders'), q.salt, ITERATIONEN);
  process.env.BQ_SCHLUESSEL_ORDNER = ablageOrdner;
  const ziel = path.join(await tmp(), 'dist');
  const r = await skript(['--ziel', ziel], ordner);
  assert.equal(r.code, 1, r.aus);
  assert.match(r.aus, /oeffnet die veroeffentlichte Seite nicht/);
  assert.equal(await gibtEs(ziel), false);
});

test('Skript: ohne gemerkten Schluessel und ohne Terminal -> Abbruch mit Hinweis', async () => {
  const ziel = path.join(await tmp(), 'dist');
  const r = await skript(['--ziel', ziel], await tmp());
  assert.equal(r.code, 1, r.aus);
  assert.match(r.aus, /Passwort noetig, aber kein Terminal/);
  assert.equal(await gibtEs(ziel), false);
});

test('Skript: --vergessen loescht den gemerkten Schluessel', async () => {
  const ordner = await tmp();
  process.env.BQ_SCHLUESSEL_ORDNER = ordner;
  await ablage.speichern(await rohAus(TEST_PW), q.salt, ITERATIONEN);
  process.env.BQ_SCHLUESSEL_ORDNER = ablageOrdner;
  const r = await skript(['--vergessen'], ordner);
  assert.equal(r.code, 0, r.aus);
  assert.equal(await gibtEs(path.join(ordner, ablage.DATEI)), false);
});
