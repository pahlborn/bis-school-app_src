// Gemeinsame Werkzeuge fuer Tests mit Anmeldung (Stufe 1 des Rechte- und Speicherkonzepts).
// Ein Testserver liefert die App mit eingesetzten Testkonten; Anmelden mit echten Klicks.

import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { WURZEL, QUELLEN } from '../werkzeug/bauen.mjs';
import { kontenEinsetzen, pbkdf2Hex, normCode, ausV1 } from '../werkzeug/konten.mjs';
import { schuleEinsetzen } from '../werkzeug/schule.mjs';

/** Konto im alten Format (Name, Rolle, Kinder) mit Startcode-Hash. */
export async function konto(user, role, code, extra = {}) {
  const salt = Array.from({ length: 16 }, (_, i) => i + user.length);
  return { user, role, ...extra, start: { salt, hash: await pbkdf2Hex(normCode(code), salt) } };
}

/** Testserver mit eingesetzten Konten (altes Format wird mit ausV1 ins Kontenmodell v2 umgestellt). */
export async function kontenServer(konten, { anpassen, schule } = {}) {
  const k2 = ausV1(konten);
  let app = schuleEinsetzen(kontenEinsetzen(await fs.readFile(path.join(WURZEL, QUELLEN.app)), k2), schule || null, k2).toString('utf8');
  if (anpassen) app = anpassen(app);
  const server = http.createServer((q, r) => {
    // /leer: an empty page of the same origin, to prepare storage before the app runs (S11 P2 tests)
    if (q.url.split('?')[0] === '/leer') { r.writeHead(200, { 'content-type': 'text/html' }); return r.end('<!doctype html><title>leer</title>'); }
    if (q.url.split('?')[0] !== '/') { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end(app); });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  server.url = `http://127.0.0.1:${server.address().port}/`;
  return server;
}

export async function oeffnen(browser, server, kontext = {}) {
  const ctx = await browser.newContext(kontext);
  await ctx.route('**/*', (r) => (r.request().url().startsWith(server.url) ? r.continue() : r.abort()));
  // same window into the round as app-hilfen.mjs (snapshot of the state), no sound
  await ctx.addInitScript(() => {
    window.claude = { hot: { snapshot(fn) { try { window.__bq = JSON.parse(JSON.stringify(fn())); } catch (e) { /* egal */ } } } };
    window.AudioContext = undefined; window.webkitAudioContext = undefined;
  });
  const page = await ctx.newPage(); const fehler = []; page.on('pageerror', (e) => fehler.push(e.message));
  await page.goto(server.url); await page.waitForSelector('#login:not([hidden]), #home:not([hidden])');
  return { ctx, page, fehler };
}

export async function anmelden(page, rolle, name, pw) {
  if (await page.locator('#roleStudent').count()) await page.locator(rolle === 'student' ? '#roleStudent' : '#roleAdult').click();
  await page.locator('#loginUser').fill(name); await page.locator('#loginPw').fill(pw);
  await page.locator('#loginGo').click();
}

/** Nach dem Startcode: eigenes Passwort setzen und das Willkommen bestaetigen. */
export async function passwortSetzen(page, pw) {
  await page.waitForSelector('#setPwForm');
  await page.locator('#newPw1').fill(pw); await page.locator('#newPw2').fill(pw); await page.locator('#setPwGo').click();
  await page.waitForSelector('#welcomeGo');
  await page.locator('#welcomeGo').click();
}

export const lies = (page, k) => page.evaluate((key) => JSON.parse(localStorage.getItem('bq2_' + key) || 'null'), k);
export const alleSchluessel = (page) => page.evaluate(() => Object.keys(localStorage).sort());
