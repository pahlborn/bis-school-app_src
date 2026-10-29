// Tests fuer Verschluesselung, Wortliste und dist-Bau (ohne Browser).
//   node --test tests/kern.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { webcrypto } from 'node:crypto';
import {
  verschluesseln, entschluesseln, schluesselAusPasswort, passwortPruefen, huelleBauen,
  tresorAusHuelle, ohneTresor, MIN_ZEICHEN, PLATZHALTER
} from '../werkzeug/kern.mjs';
import { WURZEL, QUELLEN, ICONS, quellenLesen, oeffentlichPruefen, distBauen } from '../werkzeug/bauen.mjs';
import { TEST_PW } from './hilfen.mjs';

const q = await quellenLesen();
const appText = q.app.toString('utf8');
const tmp = () => fs.mkdtemp(path.join(os.tmpdir(), 'bq-test-'));
const gibtEs = (p) => fs.access(p).then(() => true, () => false);

test('Rundweg: entschluesselt ergibt die App Byte fuer Byte', async () => {
  const t = await verschluesseln(q.app, TEST_PW, q.salt);
  const zurueck = await entschluesseln(t, TEST_PW);
  assert.ok(Buffer.from(zurueck).equals(q.app));
});

test('falsches Passwort wird abgelehnt', async () => {
  const t = await verschluesseln(q.app, TEST_PW, q.salt);
  await assert.rejects(entschluesseln(t, TEST_PW + 'x'));
});

test('jeder Lauf hat einen neuen IV, der Schluessel bleibt bei gleichem Salt gleich', async () => {
  const a = await verschluesseln(q.app, TEST_PW, q.salt);
  const b = await verschluesseln(q.app, TEST_PW, q.salt);
  assert.notEqual(a.iv, b.iv);
  assert.notEqual(a.daten, b.daten);
  const roh = async () => Buffer.from(await webcrypto.subtle.exportKey('raw', await schluesselAusPasswort(TEST_PW, q.salt)));
  assert.ok((await roh()).equals(await roh()), 'gleiches Passwort + Salt muss denselben Schluessel ergeben (sonst nach jedem Update neu anmelden)');
});

test('Passwort: Unicode-Form und Rand-Leerzeichen spielen keine Rolle', async () => {
  const zusammen = 'Grüne Tür vier Wörter lang';           // ü als ein Zeichen
  const zerlegt = zusammen.normalize('NFD') + ' ';         // ü als u + Punkte, Leerzeichen am Ende
  assert.notEqual(zusammen, zerlegt);
  const t = await verschluesseln(q.app, zusammen, q.salt);
  const zurueck = await entschluesseln(t, zerlegt);
  assert.ok(Buffer.from(zurueck).equals(q.app));
});

test(`Passwort unter ${MIN_ZEICHEN} Zeichen wird abgelehnt, ab ${MIN_ZEICHEN} angenommen`, () => {
  assert.throws(() => passwortPruefen('x'.repeat(MIN_ZEICHEN - 1)), /zu kurz/);
  assert.throws(() => passwortPruefen('  ' + 'x'.repeat(MIN_ZEICHEN - 1) + '  '), /zu kurz/, 'Rand-Leerzeichen zaehlen nicht');
  passwortPruefen('x'.repeat(MIN_ZEICHEN));
});

test('Huelle: Platzhalter genau einmal, sonst Abbruch', () => {
  assert.equal(q.vorlage.split(PLATZHALTER).length, 2, 'werkzeug/huelle.html muss den Platzhalter genau einmal enthalten');
  assert.throws(() => huelleBauen('<p>ohne</p>', {}), /genau einmal/);
  assert.throws(() => huelleBauen(PLATZHALTER + PLATZHALTER, {}), /genau einmal/);
});

test('jedes verbotene Wort steht tatsaechlich in der App (sonst schuetzt es nichts)', () => {
  const fehlt = q.woerter.filter((w) => !appText.toLowerCase().includes(w.toLowerCase()));
  assert.deepEqual(fehlt, [], 'Diese Woerter stehen nicht in index.html - Liste nachziehen: ' + fehlt.join(', '));
});

test('Wortpruefung greift ausserhalb des Tresors und nicht innerhalb', () => {
  const vorlage = q.vorlage.replace('<title>Big Quest</title>', '<title>Toddle</title>');
  const html = huelleBauen(vorlage, { daten: 'x' });
  assert.deepEqual(oeffentlichPruefen(html, q.manifest, q.woerter), ['index.html: "Toddle"']);

  const imTresor = huelleBauen(q.vorlage, { daten: 'Toddle Bhan' });
  assert.deepEqual(oeffentlichPruefen(imTresor, q.manifest, q.woerter), []);
  assert.ok(!ohneTresor(imTresor).includes('Toddle'));

  assert.deepEqual(oeffentlichPruefen(q.vorlage, '{"name":"3B Big Quest"}', q.woerter), ['manifest.webmanifest: "3B Big Quest"']);
});

test('Huelle und Manifest sind sauber', () => {
  assert.deepEqual(oeffentlichPruefen(q.vorlage, q.manifest, q.woerter), []);
});

test('dist: alle Dateien da, oeffentlicher Teil sauber, Tresor ergibt die App', async () => {
  const ziel = await tmp();
  const r = await distBauen(TEST_PW, { ziel });
  assert.deepEqual(r.dateien.sort(), ['index.html', 'manifest.webmanifest', ...ICONS].sort());
  assert.deepEqual((await fs.readdir(ziel)).sort(), r.dateien.sort());

  const html = await fs.readFile(path.join(ziel, 'index.html'), 'utf8');
  assert.deepEqual(oeffentlichPruefen(html, await fs.readFile(path.join(ziel, 'manifest.webmanifest'), 'utf8'), q.woerter), []);
  assert.ok(!html.includes('playerName'), 'App-Code darf nicht im Klartext in der Huelle stehen');
  assert.ok(Buffer.from(await entschluesseln(tresorAusHuelle(html), TEST_PW)).equals(q.app));
  for (const icon of ICONS) {
    assert.ok((await fs.readFile(path.join(ziel, icon))).equals(await fs.readFile(path.join(WURZEL, icon))), icon);
  }
});

test('dist: zu kurzes Passwort schreibt nichts', async () => {
  const ziel = path.join(await tmp(), 'dist');
  await assert.rejects(distBauen('zu-kurz', { ziel }), /zu kurz/);
  assert.equal(await gibtEs(ziel), false);
});

test('dist: verbotenes Wort in der Huelle bricht ab und schreibt nichts', async () => {
  const wurzel = await tmp();
  for (const rel of [QUELLEN.app, QUELLEN.manifest, QUELLEN.salz, QUELLEN.woerter, ...ICONS]) {
    await fs.mkdir(path.dirname(path.join(wurzel, rel)), { recursive: true });
    await fs.copyFile(path.join(WURZEL, rel), path.join(wurzel, rel));
  }
  await fs.writeFile(path.join(wurzel, QUELLEN.vorlage), q.vorlage.replace('Big Quest</h1>', 'Grade 3B</h1>'));
  const ziel = path.join(wurzel, 'dist');
  await assert.rejects(distBauen(TEST_PW, { wurzel, ziel }), /Verbotene Woerter.*Grade 3B/);
  assert.equal(await gibtEs(ziel), false);
});
