// Uebungsblaetter zum Ausdrucken, Eingabe der Ergebnisse, Seite "About".
//   node --test tests/blaetter.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { WURZEL, QUELLEN } from '../werkzeug/bauen.mjs';
import { appServer, browserStarten, appOeffnen, klick, zurStart, elternOeffnen } from './app-hilfen.mjs';

const quelltext = await fs.readFile(path.join(WURZEL, QUELLEN.app), 'utf8');
const FOCUS = new Function('return ' + quelltext.match(/const FOCUS=(\[[^\]]*\]);/)[1])();
const VERBOTEN = ['requires support', 'consolidating', 'meeting expectations', 'extending', 'level '];

let browser, server;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

async function app() {
  const a = await appOeffnen(browser, server.url);
  await a.page.evaluate(() => { window.print = () => { window.__gedruckt = (window.__gedruckt || 0) + 1; }; });
  return a;
}
const lies = (page, k) => page.evaluate((key) => JSON.parse(localStorage.getItem('bq2_' + key) || 'null'), k);

test('Uebungsblatt: 6 Aufgaben aus den Fokus-Themen, Schreibaufgabe, Loesungsseite, Druck ausgeloest', async () => {
  const { ctx, page, fehler } = await app();
  await klick(page, '#sheetBtn');
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => window.__gedruckt), 1);
  const seiten = await page.$$eval('#printArea .sheet', (s) => s.length);
  assert.equal(seiten, 2, 'Aufgabenseite und Loesungsseite');
  const aufgaben = await page.$$eval('#printArea .sheet:first-child .task', (t) => t.length);
  assert.equal(aufgaben, 8, '6 Aufgaben + Schreibaufgabe + Haken/Glow-Grow');
  assert.equal(await page.$$eval('#printArea .answers-page li', (l) => l.length), 7);
  assert.ok(await page.$$eval('#printArea .work', (w) => w.length) >= 1, 'Kasten fuer den Rechenweg');
  const blaetter = await lies(page, 'sheets');
  assert.equal(blaetter.length, 1);
  assert.equal(blaetter[0].items.length, 6);
  assert.deepEqual(blaetter[0].items.map((i) => i.q.world).filter((w) => !FOCUS.includes(w)), []);
  const text = (await page.evaluate(() => document.querySelector('#printArea').innerText)).toLowerCase();
  assert.deepEqual(VERBOTEN.filter((w) => text.includes(w)), []);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('beim Drucken erscheint nur das Blatt, hell', async () => {
  const { ctx, page } = await app();
  await klick(page, '#sheetBtn');
  await page.emulateMedia({ media: 'print', colorScheme: 'dark' });
  const anzeige = await page.evaluate(() => ({
    app: getComputedStyle(document.querySelector('#app')).display,
    blatt: getComputedStyle(document.querySelector('#printArea')).display,
    farbe: getComputedStyle(document.querySelector('#printArea')).color
  }));
  assert.equal(anzeige.app, 'none');
  assert.equal(anzeige.blatt, 'block');
  assert.equal(anzeige.farbe, 'rgb(0, 0, 0)');
  await page.emulateMedia({ media: 'screen' });
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#printArea')).display), 'none');
  await ctx.close();
});

test('Ergebnisse eines Blattes eintragen: richtig, mit Hilfe, noch nicht', async () => {
  const { ctx, page, fehler } = await app();
  await klick(page, '#sheetBtn');
  await zurStart(page);
  await elternOeffnen(page);
  const blatt = (await lies(page, 'sheets'))[0];
  await klick(page, `button[data-i="0"][data-res="ok"]`);
  await klick(page, `button[data-i="1"][data-res="help"]`);
  await klick(page, `button[data-i="2"][data-res="no"]`);
  await klick(page, `button[data-i="0"][data-res="no"]`); // zweiter Klick zaehlt nicht (Knopf gesperrt)
  const ev = await lies(page, 'ev');
  const q = (i) => blatt.items[i].q;
  const eintraege = (i) => ev[q(i).world];
  assert.ok(eintraege(0).some((e) => e[2] === 1));
  assert.ok(eintraege(1).some((e) => e[1] === 1 && e[2] === 1), 'mit Hilfe zaehlt als Grundlage');
  assert.ok(eintraege(2).some((e) => e[2] === 0));
  const due = await lies(page, 'due');
  assert.ok(due.some((d) => d.q.prompt === q(2).prompt), 'noch nicht -> wird wiederholt');
  const gespeichert = (await lies(page, 'sheets'))[0].items.map((i) => i.res);
  assert.deepEqual(gespeichert.slice(0, 3), ['ok', 'help', 'no']);
  assert.equal(await page.$$eval('button[data-i="0"][data-res]', (b) => b.every((x) => x.disabled)), true);
  // auch wenn die Sperre fehlt (zweiter Mechanismus, eigener Test): die Aufgabe zaehlt nur einmal
  await page.evaluate(() => { const b = document.querySelector('button[data-i="0"][data-res="no"]'); b.disabled = false; b.click(); });
  const gesamt = Object.values(await lies(page, 'ev')).reduce((s, l) => s + l.length, 0);
  assert.equal(gesamt, 3, 'jede Aufgabe nur einmal gezaehlt');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('About: Hinweis, Leitgedanken, Lernlogik, Herkunft, Datenschutz und Quellen, deutsch und englisch', async () => {
  const { ctx, page, fehler } = await app();
  await klick(page, '#aboutBtn');
  const de = await page.textContent('#aboutBody');
  for (const t of ['Wichtiger Hinweis', 'ohne pädagogische Herkunft', 'Leitgedanken', 'Lernlogik', 'Herkunft der Aufgaben', 'Datenschutz', 'Quellen', 'KI-Assistenten']) assert.ok(de.includes(t), t);
  assert.ok(await page.$$eval('#aboutBody a[href^="https://"]', (a) => a.length) >= 8);
  await klick(page, '#tabEn');
  const en = await page.textContent('#aboutBody');
  for (const t of ['Please note', 'without any pedagogical origin', 'Sources']) assert.ok(en.includes(t), t);
  await klick(page, '#aboutBack');
  assert.ok(await page.isVisible('#home'));
  assert.deepEqual(fehler, []);
  await ctx.close();
});
