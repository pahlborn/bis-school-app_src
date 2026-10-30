// Browser-Test der verschluesselten Seite: Maske, falsches/richtiges Passwort,
// angemeldet bleiben, #abmelden, alte Sterne bleiben erhalten.
//   node --test tests/huelle.test.mjs
// Mit vorinstalliertem Browser (wenn der von Playwright erwartete fehlt):
//   CHROMIUM_PATH=/pfad/zu/chrome node --test tests/huelle.test.mjs
//
// Externe Anfragen (Google Fonts der App) werden abgefangen: der Test soll
// nicht vom Netz abhaengen.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import { distBauen, quellenLesen, oeffentlichPruefen } from '../werkzeug/bauen.mjs';
import { ohneTresor } from '../werkzeug/kern.mjs';
import { TEST_PW } from './hilfen.mjs';
import { elternOeffnen } from './app-hilfen.mjs';
const PFAD = '/bis-school-app/';
const SCHLUESSEL = 'bq_schluessel';
const MIME = { '.html': 'text/html; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };

let browser, server, basis, ziel;

before(async () => {
  ziel = await fs.mkdtemp(path.join(os.tmpdir(), 'bq-browser-'));
  await distBauen(TEST_PW, { ziel });
  server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (!url.pathname.startsWith(PFAD)) { res.writeHead(404); return res.end(); }
    const rel = url.pathname.slice(PFAD.length) || 'index.html';
    try {
      const daten = await fs.readFile(path.join(ziel, path.basename(rel)));
      res.writeHead(200, { 'content-type': MIME[path.extname(rel)] || 'application/octet-stream' });
      res.end(daten);
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  basis = `http://127.0.0.1:${server.address().port}${PFAD}`;
  const pfad = process.env.CHROMIUM_PATH;
  browser = await chromium.launch(pfad ? { executablePath: pfad } : {});
});

after(async () => {
  await browser?.close();
  server?.close();
});

/** Neuer Kontext = frisches Geraet. Fehler der Seite werden gesammelt. */
async function geraet() {
  const ctx = await browser.newContext();
  await ctx.route('**/*', (route) => (route.request().url().startsWith(basis) ? route.continue() : route.abort()));
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(e.message));
  return { ctx, page, fehler };
}

const maskeSichtbar = (page) => page.locator('#maske').isVisible();
const appSichtbar = (page) => page.locator('#home h1').isVisible();

async function anmelden(page, pw, merken = true) {
  await page.fill('#passwort', pw);
  if (!merken) await page.uncheck('#merken');
  await page.click('#oeffnen');
}

test('ohne Passwort: nur die Maske, kein Klartext im Quelltext', async () => {
  const { ctx, page, fehler } = await geraet();
  const antwort = await page.goto(basis);
  const quelltext = await antwort.text();
  const q = await quellenLesen();
  assert.deepEqual(oeffentlichPruefen(quelltext, '', q.woerter), []);
  assert.ok(!ohneTresor(quelltext).includes('profileBtn'));
  assert.ok(await maskeSichtbar(page));
  assert.equal(await page.locator('#home').count(), 0);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('falsches Passwort: Meldung, App startet nicht, nichts gespeichert', async () => {
  const { ctx, page, fehler } = await geraet();
  await page.goto(basis);
  await anmelden(page, 'falsches-passwort-mit-genug-zeichen');
  await page.waitForSelector('#meldung.fehler');
  assert.equal(await page.textContent('#meldung'), 'Das Passwort stimmt nicht.');
  assert.equal(await page.locator('#home').count(), 0);
  assert.equal(await page.evaluate((k) => localStorage.getItem(k), SCHLUESSEL), null);
  assert.equal(await page.isEnabled('#oeffnen'), true, 'nach dem Fehler muss man es erneut versuchen koennen');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('richtiges Passwort: App startet, alte Sterne bleiben, Quest spielbar, nach Neuladen ohne Maske', async () => {
  const { ctx, page, fehler } = await geraet();
  await page.goto(basis);
  await page.evaluate(() => { localStorage.setItem('bq2_total', '7'); localStorage.setItem('bq2_name', '"Probe"'); });
  await anmelden(page, TEST_PW);
  await page.waitForSelector('#home h1');
  // S8 (30.10.): neutral title without class or school; "–" also checks non-ASCII after decryption
  assert.equal(await page.textContent('#home h1'), 'Grade 3 – Big Quest');
  assert.equal(await page.textContent('#totalStars'), '7', 'vorhandene Sterne muessen erhalten bleiben');
  assert.equal(await page.textContent('#profileName'), 'Probe');
  const start = await page.textContent('#home');
  assert.ok(start.includes('Grade 3 · International Baccalaureate'), 'Mittelpunkt kommt nach dem Entschluesseln richtig an');
  assert.ok(await page.evaluate(() => document.documentElement.outerHTML.includes('Ameisen aßen am Abend')), 'ß kommt nach dem Entschluesseln richtig an');
  assert.ok(await page.evaluate((k) => localStorage.getItem(k), SCHLUESSEL), 'Schluessel gemerkt');

  await page.locator('#subjects button.subject').first().click();
  await page.locator('#subjectBody button.world').first().click();
  await page.waitForSelector('#play:not([hidden])');
  assert.ok((await page.textContent('#qPrompt')).length > 0);

  await page.reload();
  await page.waitForSelector('#home h1');
  assert.equal(await maskeSichtbar(page), false);
  assert.ok(await appSichtbar(page));
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Browser rechnet das Passwort wie das Skript: Leerzeichen am Ende (iOS) stoert nicht', async () => {
  const { ctx, page, fehler } = await geraet();
  await page.goto(basis);
  await anmelden(page, TEST_PW + ' ');
  await page.waitForSelector('#home h1');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('die App startet oben, auch nach Scrollen und Neuladen', async () => {
  const { ctx, page, fehler } = await geraet();
  await page.goto(basis);
  await anmelden(page, TEST_PW);
  await page.waitForSelector('#home h1');
  assert.equal(await page.evaluate(() => scrollY), 0, 'nach der Anmeldung');
  await page.evaluate(() => scrollTo(0, 900));
  assert.ok(await page.evaluate(() => scrollY) > 0, 'Seite muss scrollbar sein, sonst prueft der Test nichts');
  await page.reload();
  await page.waitForSelector('#home h1');
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => scrollY), 0, 'nach dem Neuladen');
  assert.equal(await page.evaluate(() => history.scrollRestoration), 'manual', 'Browser darf die alte Position nicht wiederherstellen');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('#abmelden: Schluessel weg, Maske da, Adresse ohne #abmelden', async () => {
  const { ctx, page, fehler } = await geraet();
  await page.goto(basis);
  await anmelden(page, TEST_PW);
  await page.waitForSelector('#home h1');

  await page.goto(basis + '#abmelden');
  await page.reload(); // ein Sprung nur am # laedt nicht neu; so wie man es auf dem Geraet auch taete
  await page.waitForSelector('#maske:not([hidden])');
  assert.equal(await page.evaluate((k) => localStorage.getItem(k), SCHLUESSEL), null);
  assert.equal(new URL(page.url()).hash, '');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('ohne "angemeldet bleiben": nach Neuladen wieder die Maske', async () => {
  const { ctx, page, fehler } = await geraet();
  await page.goto(basis);
  await anmelden(page, TEST_PW, false);
  await page.waitForSelector('#home h1');
  assert.equal(await page.evaluate((k) => localStorage.getItem(k), SCHLUESSEL), null);
  await page.reload();
  await page.waitForSelector('#maske:not([hidden])');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('gemerkter Schluessel passt nicht mehr (neues Passwort): vergessen und neu fragen', async () => {
  const { ctx, page, fehler } = await geraet();
  await page.goto(basis);
  await page.evaluate((k) => localStorage.setItem(k, btoa(String.fromCharCode(...new Uint8Array(32)))), SCHLUESSEL);
  await page.reload();
  await page.waitForSelector('#maske:not([hidden])');
  assert.equal(await page.textContent('#meldung'), 'Bitte das Passwort neu eingeben.');
  assert.equal(await page.evaluate((k) => localStorage.getItem(k), SCHLUESSEL), null);

  await page.evaluate((k) => localStorage.setItem(k, '%%kein base64%%'), SCHLUESSEL);
  await page.reload();
  await page.waitForSelector('#maske:not([hidden])');
  assert.deepEqual(fehler, [], 'kaputter Speicherwert darf keinen Fehler werfen');
  await ctx.close();
});

test('auto-login removes login CSS: long About and parent PIN stay reachable with real clicks',async()=>{
  const {ctx,page,fehler}=await geraet();
  await page.goto(basis);await anmelden(page,TEST_PW);await page.waitForSelector('#home h1');
  await page.reload();await page.waitForSelector('#home h1');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).display),'block','login centering cannot persist');
  assert.equal(await page.locator('#loginStyles').count(),0);
  await elternOeffnen(page);
  assert.ok(await page.isVisible('#focusForm'));
  const box=await page.locator('#aboutBody').boundingBox();
  assert.ok(box.y>=0,'long page is not centred into negative coordinates');
  assert.deepEqual(fehler,[]);await ctx.close();
});
