// Gemeinsame Werkzeuge fuer die Tests der Klartext-App (index.html).
//
// Zugang zu den Fragen: die App ruft an mehreren Stellen
// window.claude.hot.snapshot(() => state) auf (Rest aus der Claude-Vorschau).
// appOeffnen() setzt dort einen eigenen Empfaenger ein und bekommt so jede
// Runde samt Musterloesung, ohne dass die App dafuer geaendert werden muss.
//
// Klicks laufen direkt im Seitenkontext: Playwrights Wartelogik kostet je
// Klick mehrere hundert ms, bei ueber tausend Klicks pro Lauf zu viel. Ein
// gesperrter Knopf reagiert auf click() genauso wenig wie auf einen Finger.

import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { WURZEL, QUELLEN } from '../werkzeug/bauen.mjs';

export async function appServer() {
  const server = http.createServer(async (req, res) => {
    if (req.url.split('?')[0] !== '/') { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(await fs.readFile(path.join(WURZEL, QUELLEN.app)));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  server.url = `http://127.0.0.1:${server.address().port}/`;
  return server;
}

export function browserStarten() {
  const pfad = process.env.CHROMIUM_PATH;
  return chromium.launch(pfad ? { executablePath: pfad } : {});
}

export async function appOeffnen(browser, url, kontext = {}) {
  const ctx = await browser.newContext(kontext);
  await ctx.route('**/*', (r) => (r.request().url().startsWith(url) ? r.continue() : r.abort()));
  await ctx.addInitScript(() => {
    window.claude = { hot: { snapshot(fn) { try { window.__bq = JSON.parse(JSON.stringify(fn())); } catch (e) { /* egal */ } } } };
    window.AudioContext = undefined; window.webkitAudioContext = undefined; // kein Ton im Test
  });
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(e.message));
  await page.goto(url);
  await page.waitForSelector('#home h1');
  return { ctx, page, fehler };
}

export const zustand = (page) => page.evaluate(() => window.__bq);

export const klick = (page, sel) => page.evaluate((s) => {
  const e = document.querySelector(s);
  if (!e) throw new Error('nicht gefunden: ' + s);
  e.click();
}, sel);

export const sichtbar = (page, sel) => page.evaluate((s) => {
  const e = document.querySelector(s);
  return !!e && !e.hidden && !e.closest('[hidden]');
}, sel);

export const textAus = (html) => html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** Alle Quest- und Studio-Karten der Startseite (Index fuer karteKlicken). */
export const anzahlKarten = (page) => page.evaluate(() => document.querySelectorAll('#chapters button.world').length);
export const karteKlicken = (page, i) => page.evaluate((n) => document.querySelectorAll('#chapters button.world')[n].click(), i);

/** Startet die Quest, deren Karte den Text enthaelt. */
export async function questStarten(page, text) {
  const ok = await page.evaluate((t) => {
    const b = [...document.querySelectorAll('#chapters button.world')].find((x) => x.textContent.includes(t));
    if (b) b.click();
    return !!b;
  }, text);
  if (!ok) throw new Error('Quest nicht gefunden: ' + text);
}

/** Beantwortet die angezeigte Frage richtig. */
export async function frageBeantworten(page, q) {
  if (q.kind === 'mc') await klick(page, `#qAnswers .opt[data-i="${q.answer}"]`);
  else if (q.kind === 'type') {
    for (const z of q.answer) await klick(page, `#qAnswers .key[aria-label="${z}"]`);
    await klick(page, '#qAnswers .key.go');
  } else {
    for (const k of q.correct) await klick(page, `#qAnswers .ord[data-i="${k}"]`);
    await klick(page, '#checkOrder');
  }
}
