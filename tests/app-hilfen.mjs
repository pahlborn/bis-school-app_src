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

/** Zurueck zur Startseite, egal wo die App gerade steht. */
export async function zurStart(page) {
  for (let i = 0; i < 4; i++) {
    const wo = await page.evaluate(() => ['home', 'subject', 'play', 'results', 'studioScreen'].find((id) => !document.getElementById(id).hidden));
    if (wo === 'home') return;
    await klick(page, { subject: '#subjectBack', play: '#quitBtn', results: '#homeBtn', studioScreen: '#studioBack' }[wo]);
  }
  throw new Error('Startseite nicht erreicht');
}

/**
 * Alle Karten aller Faecher: [{ fach, karte, item, studio, text, archiv }]. item ist der Schluessel (numbers, studio:read, mix_maths). fach/karte sind
 * die Positionen fuer karteOeffnen(). Karten im (zugeklappten) Archiv zaehlen mit.
 */
export async function alleKarten(page) {
  await zurStart(page);
  const n = await page.evaluate(() => document.querySelectorAll('#subjects button.subject').length);
  const alle = [];
  for (let fach = 0; fach < n; fach++) {
    await page.evaluate((i) => document.querySelectorAll('#subjects button.subject')[i].click(), fach);
    const karten = await page.evaluate(() => [...document.querySelectorAll('#subjectBody button.world')].map((b) => ({ item: b.dataset.item, studio: b.dataset.item.startsWith('studio:'), text: b.querySelector('.name').textContent, archiv: !!b.closest('details') })));
    karten.forEach((k, karte) => alle.push({ fach, karte, ...k }));
    await zurStart(page);
  }
  return alle;
}

/** Oeffnet eine Karte (Quest oder Studio) ueber Startseite -> Fach -> Karte. */
export async function karteOeffnen(page, { fach, karte }) {
  await zurStart(page);
  await page.evaluate(([f, k]) => {
    document.querySelectorAll('#subjects button.subject')[f].click();
    document.querySelectorAll('#subjectBody button.world')[k].click();
  }, [fach, karte]);
}

/** Startet die Quest, deren Name den Text enthaelt. */
export async function questStarten(page, text) {
  const k = (await alleKarten(page)).find((x) => x.text.includes(text));
  if (!k) throw new Error('Quest nicht gefunden: ' + text);
  await karteOeffnen(page, k);
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
