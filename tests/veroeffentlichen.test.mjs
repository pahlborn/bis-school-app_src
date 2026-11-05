// werkzeug/veroeffentlichen.mjs ohne Netz: kopiert nur eine gepruefte, verschluesselte Huelle in das Ziel-Repo
// und committet sie mit Version; bricht bei Entwurf, verbotenen Woertern, fehlendem Tresor oder unsauberem Ziel ab.
//   node --test tests/veroeffentlichen.test.mjs

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { distBauen } from '../werkzeug/bauen.mjs';
import { veroeffentlichen } from '../werkzeug/veroeffentlichen.mjs';
import { TEST_PW } from './hilfen.mjs';

const V = { n: 7, hash: 'abc1234', date: '2026-11-03 16:00', draft: false };
const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8' }).trim();
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'bq-veroeff-'));
let dist;
before(async () => { dist = path.join(tmp(), 'dist'); await distBauen(TEST_PW, { ziel: dist, version: V, konten: null, schule: null }); });

function zielRepo() {
  const z = tmp();
  git(z, 'init', '-q'); git(z, 'config', 'user.email', 'test@example.invalid'); git(z, 'config', 'user.name', 'Test');
  fs.writeFileSync(path.join(z, 'index.html'), 'alt'); git(z, 'add', '.'); git(z, 'commit', '-q', '-m', 'start');
  return z;
}
function distMit(aendern) {
  const d = path.join(tmp(), 'dist'); fs.mkdirSync(d, { recursive: true });
  for (const f of fs.readdirSync(dist)) fs.copyFileSync(path.join(dist, f), path.join(d, f));
  const p = path.join(d, 'index.html'); fs.writeFileSync(p, aendern(fs.readFileSync(p, 'utf8')));
  return d;
}

test('gepruefte Huelle wird kopiert und mit Version committet; zweiter Lauf tut nichts', async () => {
  const z = zielRepo();
  const r = await veroeffentlichen({ dist, ziel: z, text: 'Probe', ohnePush: true, version: V });
  assert.equal(r.geaendert, true);
  assert.equal(git(z, 'log', '-1', '--format=%s'), 'Big Quest v7: Probe');
  assert.equal(fs.readFileSync(path.join(z, 'index.html'), 'utf8'), fs.readFileSync(path.join(dist, 'index.html'), 'utf8'));
  const r2 = await veroeffentlichen({ dist, ziel: z, ohnePush: true, version: V });
  assert.equal(r2.geaendert, false);
});

test('neue Fassung gleicher Groesse mit alter Aenderungszeit wird trotzdem veroeffentlicht (Fund 04.11.)', async () => {
  const z = zielRepo();
  await veroeffentlichen({ dist, ziel: z, text: 'erste', ohnePush: true, version: V });
  // second build: same size, one character different, file time far in the past (as Windows keeps it when copying)
  const d2 = distMit((h) => { const i = h.lastIndexOf('</body>'); return h.slice(0, i - 1) + (h[i - 1] === ' ' ? '\n' : ' ') + h.slice(i); });
  const f2 = path.join(d2, 'index.html');
  assert.equal(fs.statSync(f2).size, fs.statSync(path.join(dist, 'index.html')).size, 'same size');
  // the dangerous case: size AND modification time equal to what git recorded for the last version - git then trusts
  // its index and does not look at the content (copyFileSync keeps the time of the source file)
  const alt = fs.statSync(path.join(z, 'index.html'));
  fs.utimesSync(f2, alt.atime, alt.mtime);
  const r = await veroeffentlichen({ dist: d2, ziel: z, text: 'zweite', ohnePush: true, version: { ...V, n: 8 } });
  assert.equal(r.geaendert, true, 'the change was noticed');
  assert.equal(git(z, 'log', '-1', '--format=%s'), 'Big Quest v8: zweite');
  assert.ok(fs.readFileSync(path.join(z, 'index.html')).equals(fs.readFileSync(f2)));
});

test('Entwurf (nicht eingecheckte Aenderungen) wird nicht veroeffentlicht', async () => {
  const z = zielRepo();
  await assert.rejects(veroeffentlichen({ dist, ziel: z, ohnePush: true, version: { ...V, draft: true } }), /nicht eingecheckte/);
  assert.equal(fs.readFileSync(path.join(z, 'index.html'), 'utf8'), 'alt');
});

test('verbotenes Wort ausserhalb des Tresors, fehlender Tresor oder fehlendes dist brechen ab, ohne zu kopieren', async () => {
  const z = zielRepo();
  await assert.rejects(veroeffentlichen({ dist: distMit((h) => h.replace('</body>', '<p>Grade 3B</p></body>')), ziel: z, ohnePush: true, version: V }), /Verbotene Woerter/);
  await assert.rejects(veroeffentlichen({ dist: distMit(() => '<html><body>ohne Tresor</body></html>'), ziel: z, ohnePush: true, version: V }));
  await assert.rejects(veroeffentlichen({ dist: path.join(tmp(), 'gibt-es-nicht'), ziel: z, ohnePush: true, version: V }), /dist\/ fehlt/);
  assert.equal(fs.readFileSync(path.join(z, 'index.html'), 'utf8'), 'alt');
});

test('unsauberes Ziel-Repo oder fehlendes Ziel brechen ab', async () => {
  const z = zielRepo(); fs.writeFileSync(path.join(z, 'fremd.txt'), 'x');
  await assert.rejects(veroeffentlichen({ dist, ziel: z, ohnePush: true, version: V }), /lokale Aenderungen/);
  await assert.rejects(veroeffentlichen({ dist, ohnePush: true, version: V }), /--ziel fehlt/);
  await assert.rejects(veroeffentlichen({ dist, ziel: tmp(), ohnePush: true, version: V }), /kein Git-Repo/);
});
