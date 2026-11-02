// Modulrahmen (werkzeug/module.mjs): Module werden genau einmal und unveraendert in die App gesetzt;
// Regelverstoesse brechen den Bau ab.
//   node --test tests/module/rahmen.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { moduleEinsetzen, modulUmwandeln, modulListe, exportNamen, appLesen, MARKE, MODUL_ORDNER } from '../../werkzeug/module.mjs';

function ordner(module, dateien) {
  const o = fs.mkdtempSync(path.join(os.tmpdir(), 'bq-module-'));
  fs.writeFileSync(path.join(o, 'module.json'), JSON.stringify({ module }));
  for (const [n, t] of Object.entries(dateien)) fs.writeFileSync(path.join(o, n + '.mjs'), t);
  return o;
}
const APP = `<script>\n(function(){\n'use strict';\n${MARKE}\nconst x=1;\n})();\n</script>\n`;

test('die App enthaelt jedes Live-Modul genau einmal und ohne import/export', () => {
  const app = appLesen('utf8');
  assert.equal(app.includes(MARKE), false);
  for (const m of modulListe('live')) {
    const quelle = fs.readFileSync(path.join(MODUL_ORDNER, m.name + '.mjs'), 'utf8');
    assert.equal(app.split(`/* ---- Modul ${m.name} `).length - 1, 1, m.name);
    assert.ok(app.includes(modulUmwandeln(m.name, quelle).replace(/\n/g, '\r\n').trim()) || app.includes(modulUmwandeln(m.name, quelle).trim()), m.name + ' unchanged');
    for (const n of exportNamen(quelle)) assert.match(app, new RegExp(`(function|const|let|class) ${n}\\b`), n);
  }
  assert.doesNotMatch(app.slice(app.indexOf('<script>')), /^\s*export\s/m);
});

test('echte App: Testbau setzt sich ohne Namenskonflikt zusammen; Live-Bau enthaelt keine Stufe-2-Module (US11.1)', () => {
  const live = appLesen('utf8'), testbau = appLesen('utf8', { bauart: 'test' });
  const nurTest = modulListe('test').filter((m) => m.bau === 'test');
  assert.ok(nurTest.some((m) => m.name === 'krypto'));
  for (const m of nurTest) {
    assert.equal(live.includes(`/* ---- Modul ${m.name} `), false, m.name + ' not live');
    assert.equal(testbau.includes(`/* ---- Modul ${m.name} `), true, m.name + ' in the test build');
  }
  for (const wort of ['sealEntry', 'wrapKeyFor', 'api.github.com', 'bqt_']) assert.equal(live.includes(wort), false, 'live: ' + wort);
});

test('Testbau-Module fehlen im Live-Bau', () => {
  const o = ordner([{ name: 'a', bau: 'live' }, { name: 'b', bau: 'test' }], { a: 'export const aa = 1;\n', b: 'export const bb = 2;\n' });
  const live = moduleEinsetzen(APP, { ordner: o }), test = moduleEinsetzen(APP, { ordner: o, bauart: 'test' });
  assert.ok(live.includes('const aa = 1;') && !live.includes('bb'));
  assert.ok(test.includes('const aa = 1;') && test.includes('const bb = 2;'));
});

test('Importe zwischen Modulen fallen weg; CRLF bleibt CRLF; Buffer bleibt Buffer', () => {
  const o = ordner([{ name: 'a', bau: 'live' }, { name: 'b', bau: 'live' }], { a: 'export function fa(){ return 1; }\n', b: "import { fa } from './a.mjs';\nexport const fb = () => fa() + 1;\n" });
  const out = moduleEinsetzen(Buffer.from(APP.replace(/\n/g, '\r\n')), { ordner: o });
  assert.ok(Buffer.isBuffer(out));
  const t = out.toString('utf8');
  assert.ok(!t.includes('import ') && t.includes('function fa(){') && t.includes('const fb = () =>'));
  assert.equal(t.replace(/\r\n/g, '').includes('\n'), false, 'only CRLF');
});

test('Regelverstoesse brechen ab', () => {
  const fall = (dateien, re, app = APP) => assert.throws(() => moduleEinsetzen(app, { ordner: ordner(Object.keys(dateien).map((name) => ({ name, bau: 'live' })), dateien) }), re);
  fall({ a: 'export default 1;\n' }, /nur benannte Exporte/);
  fall({ a: 'const a=1;\nexport { a };\n' }, /nur benannte Exporte/);
  fall({ a: "import fs from 'node:fs';\nexport const a=1;\n" }, /Importe nur zwischen Modulen/);
  fall({ a: 'export const dup=1;\n', b: 'export const dup=2;\n' }, /dup doppelt/);
  fall({ a: 'export const x=2;\n' }, /x aus Modul a gibt es auch in index.html/);
  fall({ a: 'export const a=1;\n' }, /Marke/, APP.replace(MARKE, ''));
  fall({ a: 'export const a=1;\n' }, /Marke/, APP + MARKE);
});
