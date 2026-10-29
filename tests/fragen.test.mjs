// Prueft die Fragen der App: jede Quest viele Runden erzeugen und jede Frage
// auf Widersprueche pruefen, dazu Runden mit den richtigen Antworten
// durchspielen.
//   node --test tests/fragen.test.mjs
//
// Zugang zu den Fragen: die App ruft an mehreren Stellen
// window.claude.hot.snapshot(() => state) auf (Rest aus der Claude-Vorschau).
// Der Test setzt dort einen eigenen Empfaenger ein und bekommt so jede Runde
// samt Musterloesung, ohne dass die App dafuer geaendert werden muss.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { WURZEL, QUELLEN } from '../werkzeug/bauen.mjs';

const RUNDEN_JE_QUEST = 100;      // nur erzeugen und pruefen
const MIX_DURCHGESPIELT = 100;   // Mixed Quest: hing bis 29.10. in etwa jeder 4. Runde
const ANDERE_DURCHGESPIELT = 5;

const quelltext = await fs.readFile(path.join(WURZEL, QUELLEN.app), 'utf8');
const SENTS = new Function('return ' + quelltext.match(/const SENTS=(\[[\s\S]*?\n\]);/)[1])();

let browser, server, url;

before(async () => {
  server = http.createServer(async (req, res) => {
    if (req.url.split('?')[0] !== '/') { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(await fs.readFile(path.join(WURZEL, QUELLEN.app)));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  url = `http://127.0.0.1:${server.address().port}/`;
  const pfad = process.env.CHROMIUM_PATH;
  browser = await chromium.launch(pfad ? { executablePath: pfad } : {});
});

after(async () => {
  await browser?.close();
  server?.close();
});

async function app() {
  const ctx = await browser.newContext();
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

const zustand = (page) => page.evaluate(() => window.__bq);
// Klicks direkt im Seitenkontext: Playwrights Wartelogik kostet je Klick
// mehrere hundert ms, bei ueber tausend Klicks pro Lauf zu viel. Ein
// gesperrter Knopf reagiert auf click() genauso wenig wie auf einen Finger.
const klick = (page, sel) => page.evaluate((s) => {
  const e = document.querySelector(s);
  if (!e) throw new Error('nicht gefunden: ' + s);
  e.click();
}, sel);
const anzahlKarten = (page) => page.evaluate(() => document.querySelectorAll('#chapters button.world').length);
const karte = (page, i) => page.evaluate((n) => document.querySelectorAll('#chapters button.world')[n].click(), i);
const sichtbar = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); return !!e && !e.hidden && !e.closest('[hidden]'); }, sel);
const kartenIndex = (page, text) => page.evaluate((t) => [...document.querySelectorAll('#chapters button.world')].findIndex((b) => b.textContent.includes(t)), text);
const textAus = (html) => html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const ohneZeichen = (w) => w.replace(/[.,!?]/g, '');
const fmt = (n) => Number(n).toLocaleString('en-GB');

/** Gibt Widersprueche einer Frage zurueck (leer = in Ordnung). */
function pruefeFrage(q) {
  const p = [];
  if (q.kind === 'mc') {
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) p.push('Loesungsindex ausserhalb');
    if (new Set(q.options).size !== q.options.length) p.push('doppelte Antwortknoepfe: ' + q.options.map(textAus).join(' | '));
    if (q.options.length < 2) p.push('weniger als zwei Antworten');
  }
  if (q.kind === 'type' && !/^\d{1,4}$/.test(q.answer)) p.push('Tippantwort nicht 1-4 Ziffern: ' + q.answer);
  if (q.kind === 'order' && [...q.correct].sort((a, b) => a - b).join() !== q.items.map((_, i) => i).join()) p.push('Reihenfolge keine Permutation');

  // Stellenwert: die gefragte Ziffer darf nur einmal in der Zahl stehen
  const sw = q.prompt.match(/What is the value of the <b>(\d)<\/b> in <b>([\d,]+)<\/b>/);
  if (sw) {
    const ziffern = sw[2].replace(/,/g, '');
    if (ziffern.split(sw[1]).length - 1 !== 1) p.push(`Stellenwert mehrdeutig: ${sw[1]} in ${sw[2]}`);
    const richtig = q.options[q.answer];
    const werte = [...ziffern].map((z, i) => (z === sw[1] ? fmt(+z * 10 ** (ziffern.length - 1 - i)) : null)).filter(Boolean);
    for (const o of q.options) if (o !== richtig && werte.includes(o)) p.push(`Stellenwert: ${o} als falsch angeboten, ist aber auch ein Wert der ${sw[1]}`);
  }

  // Grossbuchstaben zaehlen: Loesung = Anzahl Grossbuchstaben im richtigen Satz
  if (q.prompt.includes('How many capital letters are missing')) {
    const satz = q.explain.match(/^Correct: (.*?) That is/)[1];
    const n = (satz.match(/[A-ZÄÖÜ]/g) || []).length;
    if (String(n) !== q.answer) p.push(`Grossbuchstaben: erwartet ${q.answer}, im Satz "${satz}" stehen ${n}`);
  }

  // Welches Wort braucht einen Grossbuchstaben: falsche Antworten muessen klein stehen
  if (q.prompt.includes('MUST have a capital letter')) {
    const zitat = textAus(q.visual);
    const satz = SENTS.find((s) => s[0].toLowerCase() === zitat);
    if (!satz) p.push('Satz nicht gefunden: ' + zitat);
    else {
      const woerter = satz[0].split(' ').map(ohneZeichen);
      const gross = (o) => woerter.some((w, i) => i > 0 && w.toLowerCase() === o && /^[A-ZÄÖÜ]/.test(w));
      q.options.forEach((o, i) => {
        if (i === q.answer && !gross(o)) p.push(`Eigenname: Loesung "${o}" steht im Satz nicht gross`);
        if (i !== q.answer && gross(o)) p.push(`Eigenname: "${o}" als falsch angeboten, steht im Satz aber gross`);
      });
    }
  }
  return p;
}

test('Fragen aller Quests: keine Widersprueche', async () => {
  const { ctx, page, fehler } = await app();
  const n = await anzahlKarten(page);
  const befunde = new Map();
  let quests = 0;
  for (let i = 0; i < n; i++) {
    for (let r = 0; r < RUNDEN_JE_QUEST; r++) {
      await karte(page, i);
      if (await sichtbar(page, '#studioScreen')) { await klick(page, '#studioBack'); break; }
      const s = await zustand(page);
      if (r === 0) quests++;
      for (const q of s.round) for (const b of pruefeFrage(q)) befunde.set(`${s.world}: ${b}`, (befunde.get(`${s.world}: ${b}`) || 0) + 1);
      await klick(page, '#quitBtn');
    }
  }
  assert.ok(quests >= 20, `nur ${quests} Quests gefunden`);
  assert.deepEqual([...befunde].map(([b, k]) => `${b} (${k}x)`), []);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

/** Spielt die laufende Runde mit den richtigen Antworten durch. */
async function durchspielen(page, fehler) {
  for (let f = 0; f < 8; f++) {
    const s = await zustand(page);
    const q = s.round[s.idx];
    assert.equal(s.idx, f, `${s.world}: Frage ${f + 1} wurde nicht angezeigt (haengt)`);
    if (q.kind === 'mc') await klick(page, `#qAnswers .opt[data-i="${q.answer}"]`);
    else if (q.kind === 'type') {
      for (const z of q.answer) await klick(page, `#qAnswers .key[aria-label="${z}"]`);
      await klick(page, '#qAnswers .key.go');
    } else {
      for (const k of q.correct) await klick(page, `#qAnswers .ord[data-i="${k}"]`);
      await klick(page, '#checkOrder');
    }
    assert.ok(await page.evaluate(() => { const fb = document.querySelector('#feedback'); return !fb.hidden && fb.classList.contains('good'); }),
      `${s.world}: richtige Antwort nicht als richtig gewertet: ${textAus(q.prompt)}`);
    await klick(page, '#nextBtn');
    assert.deepEqual(fehler, [], `${s.world}: Fehler nach Frage ${f + 1}`);
  }
  assert.ok(await sichtbar(page, '#results'), 'Ergebnisseite nach Frage 8');
  assert.equal(await page.textContent('#resScore'), '8');
  await klick(page, '#homeBtn');
}

test('Mixed Quest: viele Runden durchspielbar, ohne Haenger', async () => {
  const { ctx, page, fehler } = await app();
  const i = await kartenIndex(page, 'Mixed Quest');
  assert.ok(i >= 0, 'Mixed Quest nicht gefunden');
  for (let r = 0; r < MIX_DURCHGESPIELT; r++) {
    await karte(page, i);
    await durchspielen(page, fehler);
  }
  await ctx.close();
});

test('jede Quest: Runden mit richtigen Antworten ergeben 8 von 8', async () => {
  const { ctx, page, fehler } = await app();
  const n = await anzahlKarten(page);
  for (let i = 0; i < n; i++) {
    for (let r = 0; r < ANDERE_DURCHGESPIELT; r++) {
      await karte(page, i);
      if (await sichtbar(page, '#studioScreen')) { await klick(page, '#studioBack'); break; }
      await durchspielen(page, fehler);
    }
  }
  await ctx.close();
});