// S7 (30.10.): version set automatically at build time, only inside the encrypted vault.
//   node --test tests/version.test.mjs

import { test, before, after } from 'node:test';
import { appLesen } from '../werkzeug/module.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { WURZEL, QUELLEN, distBauen, liveVergleichen, appZusammensetzen } from '../werkzeug/bauen.mjs';
import { schuleLesen } from '../werkzeug/schule.mjs';
import { entschluesseln, tresorAusHuelle, ohneTresor } from '../werkzeug/kern.mjs';
import { versionErmitteln, versionEinsetzen, versionAuslesen, berlinZeit, MARKE, versionRoh, versionText } from '../werkzeug/version.mjs';
import { MARKE as RELEASE_MARKE, releaseEinsetzen, releaseEintraege } from '../werkzeug/releases.mjs';
import { TEST_PW } from './hilfen.mjs';
import { kontenEinsetzen, kontenLesen } from '../werkzeug/konten.mjs';
import { browserStarten, appOeffnen, elternOeffnen, elternSeite } from './app-hilfen.mjs';

const tmp = () => fs.mkdtemp(path.join(os.tmpdir(), 'bq-version-'));
const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8' }).trim();
const beta = (minor, patch, rest = {}) => ({ major: 0, minor, patch, kanal: 'beta', ...rest });
const V = beta(13, 0, { hash: 'a1b2c3d', date: '30.10.2026 14:05', draft: false });
const V14 = beta(14, 0, { hash: 'b2c3d4e', date: '31.10.2026 09:00', draft: false });
const V15 = beta(15, 0, { hash: 'c3d4e5f', date: '31.10.2026 10:00', draft: false });
const appQuelle = await appLesen();

test('version comes from package.json plus git metadata', () => {
  const v = versionErmitteln(WURZEL, new Date('2026-10-30T13:05:00Z'));
  assert.deepEqual({ major: v.major, minor: v.minor, patch: v.patch, kanal: v.kanal }, { major: 0, minor: 153, patch: 1, kanal: 'beta' });
  assert.equal(v.n, Number(git(WURZEL, 'rev-list', '--count', '--first-parent', 'HEAD')));
  assert.equal(versionRoh(v), '0.153.1-beta');
  assert.equal(v.hash, git(WURZEL, 'rev-parse', 'HEAD').slice(0, 7));
  assert.match(v.hash, /^[0-9a-f]{7}$/);
  assert.equal(v.date, '30.10.2026 14:05');
  assert.equal(berlinZeit(new Date('2026-07-01T22:30:00Z')), '02.07.2026 00:30', 'summer time');
});

test('same commit gives the same release and hash; uncommitted changes mark the version as draft', async () => {
  const repo = await tmp();
  git(repo, 'init', '-q'); git(repo, 'config', 'user.email', 't@t'); git(repo, 'config', 'user.name', 't');
  await fs.writeFile(path.join(repo, 'package.json'), JSON.stringify({ version: '0.13.0-beta' }));
  await fs.writeFile(path.join(repo, 'a.txt'), 'x'); git(repo, 'add', '.'); git(repo, 'commit', '-qm', 'one');
  const a = versionErmitteln(repo), b = versionErmitteln(repo);
  assert.deepEqual({ major: a.major, minor: a.minor, patch: a.patch, kanal: a.kanal }, { major: 0, minor: 13, patch: 0, kanal: 'beta' });
  assert.equal(a.hash, b.hash); assert.equal(a.draft, false);
  await fs.writeFile(path.join(repo, 'a.txt'), 'y');
  assert.equal(versionErmitteln(repo).draft, true);
  assert.throws(() => versionErmitteln(os.tmpdir() + path.sep + 'gibt-es-nicht-' + Date.now()), /nicht ermittelbar/);
});

test('version text formats beta and final releases for the UI', () => {
  assert.equal(versionText(beta(148, 0)), 'V 0.148 (Betaversion)');
  assert.equal(versionText(beta(148, 1)), 'V 0.148.1 (Betaversion)');
  assert.equal(versionText({ major: 1, minor: 0, patch: 0, kanal: 'final', hash: 'x', date: 'x', draft: false }), 'V 1.0.0');
  assert.equal(versionText({ n: 152, hash: 'abc1234', date: 'x', draft: false }), 'v152');
  assert.equal(versionText({ n: 152, hash: 'abc1234', date: 'x', draft: true }), 'v152-entwurf');
});

test('the app contains the version marker exactly once; inserting and reading back works', () => {
  assert.equal(appQuelle.toString('utf8').split(MARKE).length, 2);
  const mit = versionEinsetzen(appQuelle, V);
  assert.deepEqual(versionAuslesen(mit.toString('utf8')), V);
  assert.throws(() => versionEinsetzen('ohne Marke', V), /genau einmal/);
  assert.throws(() => versionEinsetzen(MARKE + MARKE, V), /genau einmal/);
});

test('the app contains the release marker exactly once; inserting the current release works', () => {
  assert.equal(appQuelle.toString('utf8').split(RELEASE_MARKE).length, 2);
  const mit = releaseEinsetzen(appQuelle, V).toString('utf8');
  assert.ok(mit.includes('const APP_RELEASES=' + JSON.stringify(releaseEintraege(V)) + ';'));
  assert.throws(() => releaseEinsetzen('ohne Marke', V), /genau einmal/);
  assert.throws(() => releaseEinsetzen(RELEASE_MARKE + RELEASE_MARKE, V), /genau einmal/);
});

test('dist: vault holds the app with version byte for byte; shell and manifest contain no version data', async () => {
  const ziel = await tmp();
  const r = await distBauen(TEST_PW, { ziel, version: V });
  const html = await fs.readFile(path.join(ziel, 'index.html'), 'utf8');
  const klar = Buffer.from(await entschluesseln(tresorAusHuelle(html), TEST_PW));
  assert.ok(klar.equals(appZusammensetzen(appQuelle, V, await kontenLesen(), await schuleLesen())));
  assert.ok(klar.toString('utf8').includes('const APP_RELEASES=' + JSON.stringify(releaseEintraege(V)) + ';'), 'release notes set');
  assert.deepEqual(r.version, V);
  const offen = ohneTresor(html) + await fs.readFile(path.join(ziel, 'manifest.webmanifest'), 'utf8');
  for (const x of ['a1b2c3d', '30.10.2026 14:05', versionText(V), 'APP_VERSION', 'APP_RELEASES', releaseEintraege(V)[0].epics[0].de]) assert.ok(!offen.includes(x), x);
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

test('built app: child sees the beta version at the end of About (DE and EN); adults see version, build time and hash', async () => {
  inhalt['/built/'] = versionEinsetzen(appQuelle, V);
  const { ctx, page, fehler } = await appOeffnen(browser, server.url + '/built/');
  const start = await page.evaluate(() => document.body.innerText);
  for (const x of [versionText(V), versionText(V, { sprache: 'en' }), 'a1b2c3d', '30.10.2026 14:05']) assert.ok(!start.includes(x), 'start page: ' + x);
  await page.locator('#aboutBtn').click();
  assert.equal(await page.locator('#aboutBody .app-version').count(), 1);
  assert.equal(await page.textContent('#aboutBody .app-version'), versionText(V));
  assert.ok(!(await page.textContent('#aboutBody')).includes('a1b2c3d'), 'no hash for the child');
  await page.locator('#tabEn').click();
  assert.equal(await page.textContent('#aboutBody .app-version'), versionText(V, { sprache: 'en' }));
  await page.locator('#aboutBack').click();
  await elternOeffnen(page);
  await elternSeite(page, 'aboutapp');
  const info = await page.textContent('#versionInfo');
  assert.ok(info.includes(versionText(V, { sprache: 'en' })) && info.includes('30.10.2026 14:05') && info.includes('a1b2c3d'), info);
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
  page.on('request', (q) => { if (!q.url().startsWith(server.url)) anfragen.push(q.url()); });
  await page.goto(server.url + '/app/'); await page.waitForSelector('#home h1');
  await elternOeffnen(page);
  await elternSeite(page, 'aboutapp');
  await page.locator('#checkUpdate').click();
  await page.waitForFunction(() => !document.querySelector('#updateMessage').textContent.includes('Prüfe'));
  assert.match(await page.textContent('#updateMessage'), /^Aktuell/);
  const ziel2 = await tmp();
  await distBauen(TEST_PW, { ziel: ziel2, version: V14, konten: null });
  inhalt['/app/'] = await fs.readFile(path.join(ziel2, 'index.html'), 'utf8');
  await page.locator('#checkUpdate').click();
  await page.waitForFunction(() => document.querySelector('#updateMessage').textContent.includes('V 0.14'));
  assert.equal(await page.textContent('#updateMessage'), `Neuer Stand ${versionText(V14)} verfügbar – App schließen und neu öffnen.`);
  assert.deepEqual(anfragen, []);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

async function huelleOeffnen(pfad, version) {
  const ziel = await tmp();
  const r = await distBauen(TEST_PW, { ziel, version, konten: null });
  inhalt[pfad] = await fs.readFile(path.join(ziel, 'index.html'), 'utf8');
  const ctx = await browser.newContext();
  await ctx.route('**/*', (rt) => (rt.request().url().startsWith(server.url) ? rt.continue() : rt.abort()));
  await ctx.addInitScript((k) => localStorage.setItem('bq_schluessel', k), Buffer.from(r.schluesselRoh).toString('base64'));
  const page = await ctx.newPage(); const fehler = []; page.on('pageerror', (e) => fehler.push(e.message));
  await page.goto(server.url + pfad); await page.waitForSelector('#home h1');
  return { ctx, page, fehler };
}
async function neuBauen(pfad, version) {
  const ziel = await tmp();
  await distBauen(TEST_PW, { ziel, version, konten: null });
  inhalt[pfad] = await fs.readFile(path.join(ziel, 'index.html'), 'utf8');
}

test('automatic update: a newer published version is loaded by itself (no manual reinstall)', async () => {
  const { ctx, page, fehler } = await huelleOeffnen('/auto/', V);
  await neuBauen('/auto/', V14);
  await page.waitForURL(/\?v=0\.14\.0-beta-b2c3d4e$/, { timeout: 10000 });
  await page.waitForSelector('#home h1');
  await page.locator('#aboutBtn').click();
  assert.equal(await page.textContent('#aboutBody .app-version'), versionText(V14));
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('automatic update waits while the child is in a round and updates back on the start page', async () => {
  const { ctx, page } = await huelleOeffnen('/auto2/', V);
  await page.locator('#todayBtn').click();
  await neuBauen('/auto2/', V15);
  await page.waitForTimeout(4500);
  assert.ok(await page.isVisible('#play'), 'no reload in the middle of a round');
  assert.ok(!page.url().includes('?v='));
  await page.locator('#quitBtn').click();
  await page.waitForURL(/\?v=0\.15\.0-beta-c3d4e5f$/, { timeout: 10000 });
  await ctx.close();
});

test('live check: same version, other version, unreachable', async () => {
  const ziel = await tmp();
  const r = await distBauen(TEST_PW, { ziel, version: V });
  inhalt['/live/'] = await fs.readFile(path.join(ziel, 'index.html'), 'utf8');
  assert.equal((await liveVergleichen(V, r.schluesselRoh, server.url + '/live/')).ergebnis, 'gleich');
  const anders = await liveVergleichen(beta(12, 0, { hash: '0000000', date: V.date, draft: false }), r.schluesselRoh, server.url + '/live/');
  assert.equal(anders.ergebnis, 'anders'); assert.equal(anders.text, versionText(V));
  assert.equal((await liveVergleichen(V, r.schluesselRoh, 'http://127.0.0.1:9/nix/')).ergebnis, 'nicht erreichbar');
});
