// S7 (30.10.): version set automatically at build time, only inside the encrypted vault.
//   node --test tests/version.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { WURZEL, QUELLEN, distBauen, liveVergleichen } from '../werkzeug/bauen.mjs';
import { entschluesseln, tresorAusHuelle, ohneTresor } from '../werkzeug/kern.mjs';
import { versionErmitteln, versionEinsetzen, versionAuslesen, berlinZeit, MARKE } from '../werkzeug/version.mjs';
import { TEST_PW } from './hilfen.mjs';
import { kontenEinsetzen, kontenLesen } from '../werkzeug/konten.mjs';
import { browserStarten, appOeffnen, elternOeffnen } from './app-hilfen.mjs';

const tmp = () => fs.mkdtemp(path.join(os.tmpdir(), 'bq-version-'));
const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8' }).trim();
const V = { n: 13, hash: 'a1b2c3d', date: '30.10.2026 14:05', draft: false };
const appQuelle = await fs.readFile(path.join(WURZEL, QUELLEN.app));

test('version comes from git: number of first-parent commits, 7-character hash, Berlin time', () => {
  const v = versionErmitteln(WURZEL, new Date('2026-10-30T13:05:00Z'));
  assert.equal(v.n, Number(git(WURZEL, 'rev-list', '--count', '--first-parent', 'HEAD')));
  assert.equal(v.hash, git(WURZEL, 'rev-parse', 'HEAD').slice(0, 7));
  assert.match(v.hash, /^[0-9a-f]{7}$/);
  assert.equal(v.date, '30.10.2026 14:05');
  assert.equal(berlinZeit(new Date('2026-07-01T22:30:00Z')), '02.07.2026 00:30', 'summer time');
});

test('same commit gives the same number and hash; uncommitted changes mark the version as draft', async () => {
  const repo = await tmp();
  git(repo, 'init', '-q'); git(repo, 'config', 'user.email', 't@t'); git(repo, 'config', 'user.name', 't');
  await fs.writeFile(path.join(repo, 'a.txt'), 'x'); git(repo, 'add', '.'); git(repo, 'commit', '-qm', 'one');
  const a = versionErmitteln(repo), b = versionErmitteln(repo);
  assert.equal(a.n, 1); assert.equal(a.hash, b.hash); assert.equal(a.draft, false);
  await fs.writeFile(path.join(repo, 'a.txt'), 'y');
  assert.equal(versionErmitteln(repo).draft, true);
  assert.throws(() => versionErmitteln(os.tmpdir() + path.sep + 'gibt-es-nicht-' + Date.now()), /nicht ermittelbar/);
});

test('the app contains the version marker exactly once; inserting and reading back works', () => {
  assert.equal(appQuelle.toString('utf8').split(MARKE).length, 2);
  const mit = versionEinsetzen(appQuelle, V);
  assert.deepEqual(versionAuslesen(mit.toString('utf8')), V);
  assert.throws(() => versionEinsetzen('ohne Marke', V), /genau einmal/);
  assert.throws(() => versionEinsetzen(MARKE + MARKE, V), /genau einmal/);
});

test('dist: vault holds the app with version byte for byte; shell and manifest contain no version data', async () => {
  const ziel = await tmp();
  const r = await distBauen(TEST_PW, { ziel, version: V });
  const html = await fs.readFile(path.join(ziel, 'index.html'), 'utf8');
  const klar = Buffer.from(await entschluesseln(tresorAusHuelle(html), TEST_PW));
  assert.ok(klar.equals(kontenEinsetzen(versionEinsetzen(appQuelle, V), await kontenLesen())));
  assert.deepEqual(r.version, V);
  const offen = ohneTresor(html) + await fs.readFile(path.join(ziel, 'manifest.webmanifest'), 'utf8');
  for (const x of ['a1b2c3d', '30.10.2026 14:05', 'v13', 'APP_VERSION']) assert.ok(!offen.includes(x), x);
});

// ---- browser: what child and adults see, and the update check ----
let browser, server, inhalt = { '/app/': '' };
before(async () => {
  browser = await browserStarten();
  server = http.createServer((req, res) => {
    const p = new URL(req.url, 'http://x').pathname;
    if (!(p in inhalt)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(inhalt[p]);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  server.url = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await browser?.close(); server?.close(); });

test('unbuilt app: About shows "Entwicklungsstand", no errors', async () => {
  inhalt['/plain/'] = appQuelle;
  const { ctx, page, fehler } = await appOeffnen(browser, server.url + '/plain/');
  await page.locator('#aboutBtn').click();
  assert.equal(await page.textContent('#aboutBody .app-version'), 'Entwicklungsstand');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('built app: child sees only "v13" at the end of About (DE and EN); adults see number, build time and hash', async () => {
  inhalt['/built/'] = versionEinsetzen(appQuelle, V);
  const { ctx, page, fehler } = await appOeffnen(browser, server.url + '/built/');
  const start = await page.evaluate(() => document.body.innerText);
  for (const x of ['v13', 'a1b2c3d', '30.10.2026 14:05']) assert.ok(!start.includes(x), 'start page: ' + x);
  await page.locator('#aboutBtn').click();
  assert.equal(await page.locator('#aboutBody .app-version').count(), 1);
  assert.equal(await page.textContent('#aboutBody .app-version'), 'v13');
  assert.ok(!(await page.textContent('#aboutBody')).includes('a1b2c3d'), 'no hash for the child');
  await page.locator('#tabEn').click();
  assert.equal(await page.textContent('#aboutBody .app-version'), 'v13');
  await page.locator('#aboutBack').click();
  await elternOeffnen(page);
  const info = await page.textContent('#versionInfo');
  assert.ok(info.includes('v13') && info.includes('30.10.2026 14:05') && info.includes('a1b2c3d'), info);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('published shell: "check for new version" says current, then reports a newer one; only own address is contacted', async () => {
  const ziel = await tmp();
  const r = await distBauen(TEST_PW, { ziel, version: V, konten: null });
  const schluessel = Buffer.from(r.schluesselRoh).toString('base64');
  inhalt['/app/'] = await fs.readFile(path.join(ziel, 'index.html'), 'utf8');
  const ctx = await browser.newContext();
  await ctx.route('**/*', (rt) => (rt.request().url().startsWith(server.url) ? rt.continue() : rt.abort()));
  await ctx.addInitScript((k) => localStorage.setItem('bq_schluessel', k), schluessel);
  const page = await ctx.newPage(); const fehler = [], anfragen = [];
  page.on('pageerror', (e) => fehler.push(e.message));
  page.on('request', (q) => { if (!q.url().startsWith(server.url) && !q.url().includes('fonts.g')) anfragen.push(q.url()); });
  await page.goto(server.url + '/app/'); await page.waitForSelector('#home h1');
  await elternOeffnen(page);
  await page.locator('#checkUpdate').click();
  await page.waitForFunction(() => !document.querySelector('#updateMessage').textContent.includes('Prüfe'));
  assert.match(await page.textContent('#updateMessage'), /^Aktuell/);
  const ziel2 = await tmp();
  await distBauen(TEST_PW, { ziel: ziel2, version: { ...V, n: 14, hash: 'b2c3d4e', date: '31.10.2026 09:00' }, konten: null });
  inhalt['/app/'] = await fs.readFile(path.join(ziel2, 'index.html'), 'utf8');
  await page.locator('#checkUpdate').click();
  await page.waitForFunction(() => document.querySelector('#updateMessage').textContent.includes('v14'));
  assert.equal(await page.textContent('#updateMessage'), 'Neuer Stand v14 verfügbar – App schließen und neu öffnen.');
  assert.deepEqual(anfragen, []);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('live check: same version, other version, unreachable', async () => {
  const ziel = await tmp();
  const r = await distBauen(TEST_PW, { ziel, version: V });
  inhalt['/live/'] = await fs.readFile(path.join(ziel, 'index.html'), 'utf8');
  assert.equal((await liveVergleichen(V, r.schluesselRoh, server.url + '/live/')).ergebnis, 'gleich');
  const anders = await liveVergleichen({ ...V, n: 12, hash: '0000000' }, r.schluesselRoh, server.url + '/live/');
  assert.equal(anders.ergebnis, 'anders'); assert.equal(anders.text, 'v13');
  assert.equal((await liveVergleichen(V, r.schluesselRoh, 'http://127.0.0.1:9/nix/')).ergebnis, 'nicht erreichbar');
});
