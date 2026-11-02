// Uebungsblaetter zum Ausdrucken, Eingabe der Ergebnisse, Seite "About".
//   node --test tests/blaetter.test.mjs

import { test, before, after } from 'node:test';
import { appLesen } from '../werkzeug/module.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { WURZEL, QUELLEN } from '../werkzeug/bauen.mjs';
import { appServer, browserStarten, appOeffnen, klick, zurStart, elternOeffnen, elternSeite, aboutAbschnitt } from './app-hilfen.mjs';

const quelltext = await appLesen('utf8');
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
  await page.locator('#sheetBtn').click();
  await page.locator('#sheetPrint').click();
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

const blattKnopf = (page, i, res) => page.locator(`#aboutBody details.psheet[open] button[data-i="${i}"][data-res="${res}"]`);
const gesamtEv = async (page) => Object.values((await lies(page, 'ev')) || {}).reduce((s, l) => s + l.length, 0);

test('Ergebnisse eintragen: richtig, mit Hilfe, noch nicht – zählen auch in der Einschätzung', async () => {
  const { ctx, page, fehler } = await app();
  await klick(page, '#sheetBtn');
  await page.locator('#sheetClose').click();
  await zurStart(page);
  await elternOeffnen(page);
  await elternSeite(page, 'sheets');
  const blatt = (await lies(page, 'sheets'))[0];
  assert.equal(blatt.no, 1, 'running number');
  await page.locator(`details.psheet[data-sheetid="${blatt.id}"] > summary`).click();
  assert.match(await page.textContent(`details.psheet[data-sheetid="${blatt.id}"] > summary`), /Blatt 1 · .*noch offen/);
  await blattKnopf(page, 0, 'ok').click();
  await blattKnopf(page, 1, 'help').click();
  await blattKnopf(page, 2, 'no').click();
  const ev = await lies(page, 'ev');
  const q = (i) => blatt.items[i].q;
  assert.ok(ev[q(0).world].some((e) => e[2] === 1));
  assert.ok(ev[q(1).world].some((e) => e[1] === 1 && e[2] === 1), 'mit Hilfe zaehlt als Grundlage');
  assert.ok(ev[q(2).world].some((e) => e[2] === 0));
  assert.ok((await lies(page, 'due')).some((d) => d.q.prompt === q(2).prompt), 'noch nicht -> wird wiederholt');
  const versuche = (await lies(page, 'attempts')).filter((a) => a.sheet);
  assert.deepEqual(versuche.map((a) => [a.ok, a.help]), [[true, false], [true, true], [false, false]], 'counts in the grown-ups summary too');
  assert.deepEqual((await lies(page, 'sheets'))[0].items.map((i) => i.res).slice(0, 3), ['ok', 'help', 'no']);
  assert.match(await page.textContent(`details.psheet[data-sheetid="${blatt.id}"] > summary`), /teilweise eingetragen \(3\/6\)/);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Vertippt: ein anderer Knopf korrigiert genau – nichts doppelt, Wiederholung passt', async () => {
  const { ctx, page, fehler } = await app();
  await klick(page, '#sheetBtn'); await page.locator('#sheetClose').click(); await zurStart(page);
  await elternOeffnen(page); await elternSeite(page, 'sheets');
  const blatt = (await lies(page, 'sheets'))[0], q0 = blatt.items[0].q;
  await page.locator(`details.psheet[data-sheetid="${blatt.id}"] > summary`).click();
  await blattKnopf(page, 0, 'ok').click();
  await blattKnopf(page, 0, 'no').click();            // correction
  assert.equal(await gesamtEv(page), 1, 'only one entry for the task');
  assert.equal((await lies(page, 'ev'))[q0.world].slice(-1)[0][2], 0);
  assert.ok((await lies(page, 'due')).some((d) => d.q.prompt === q0.prompt), 'now repeated');
  assert.equal((await lies(page, 'attempts')).filter((a) => a.sheet).length, 1);
  await blattKnopf(page, 0, 'ok').click();            // and back again
  assert.equal(await gesamtEv(page), 1);
  assert.equal((await lies(page, 'ev'))[q0.world].slice(-1)[0][2], 1);
  assert.ok(!(await lies(page, 'due')).some((d) => d.q.prompt === q0.prompt), 'no longer repeated');
  assert.deepEqual((await lies(page, 'attempts')).filter((a) => a.sheet).map((a) => a.ok), [true]);
  assert.equal(await blattKnopf(page, 0, 'ok').getAttribute('aria-pressed'), 'true');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

// Abzeichen Principled (01.11.): ein Blatt bis zum Ende bearbeitet, genau einmal je Blatt.
test('Abzeichen Principled: erst wenn jede Aufgabe des Blatts ein Ergebnis hat, einmal je Blatt', async () => {
  const { ctx, page, fehler } = await app();
  await klick(page, '#sheetBtn'); await page.locator('#sheetClose').click(); await zurStart(page);
  await elternOeffnen(page); await elternSeite(page, 'sheets');
  const blatt = (await lies(page, 'sheets'))[0], n = blatt.items.length;
  await page.locator(`details.psheet[data-sheetid="${blatt.id}"] > summary`).click();
  for (let i = 0; i < n - 1; i++) await blattKnopf(page, i, i % 2 ? 'help' : 'ok').click();
  assert.equal(((await lies(page, 'badges')) || {}).principled || 0, 0, 'not yet - one task still open');
  await blattKnopf(page, n - 1, 'no').click();       // "not yet" also counts as worked on
  assert.equal((await lies(page, 'badges')).principled, 1);
  await blattKnopf(page, 0, 'no').click();           // correction
  await blattKnopf(page, 0, 'ok').click();
  assert.equal((await lies(page, 'badges')).principled, 1, 'a correction does not count twice');
  await page.reload();
  await page.waitForSelector('#home');
  assert.match(await page.textContent('#badges'), /Principled/);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('alte Eintraege ohne Protokoll bleiben gesperrt; leeres Blatt verwerfen; Hinweis in der Uebersicht fuehrt hin', async () => {
  const { ctx, page, fehler } = await app();
  await klick(page, '#sheetBtn'); await page.locator('#sheetClose').click(); await zurStart(page);
  await klick(page, '#sheetBtn'); await page.locator('#sheetClose').click(); await zurStart(page);
  const [b1, b2] = await lies(page, 'sheets');
  assert.deepEqual([b1.no, b2.no], [1, 2], 'two sheets on the same day are told apart');
  // an old sheet (earlier version): result without record
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('bq2_sheets')); s[0].items[0].res = 'ok'; localStorage.setItem('bq2_sheets', JSON.stringify(s)); });
  await elternOeffnen(page);
  // calm note on the overview, straight to the newest waiting sheet
  assert.match(await page.textContent('.psheet-note'), /2 Übungsblätter warten/);
  await page.locator('.psheet-note button').click();
  assert.ok(await page.locator(`details.psheet[data-sheetid="${b2.id}"]`).evaluate((d) => d.open), 'sheet opened');
  assert.ok(await page.locator(`details.psheet[data-sheetid="${b2.id}"] button[data-res="ok"]`).first().isVisible());
  // discard the empty sheet 2
  page.once('dialog', (d) => d.accept());
  await page.locator(`details.psheet[data-sheetid="${b2.id}"] [data-discard]`).click();
  assert.deepEqual((await lies(page, 'sheets')).map((s) => s.id), [b1.id]);
  assert.equal(await gesamtEv(page), 0, 'discarding counts nothing');
  // sheet 1 has an old entry: no discard button, old result locked, others open
  await page.locator(`details.psheet[data-sheetid="${b1.id}"] > summary`).click();
  assert.equal(await page.locator(`details.psheet[data-sheetid="${b1.id}"] [data-discard]`).count(), 0);
  assert.ok(await blattKnopf(page, 0, 'no').isDisabled(), 'old entry stays locked');
  assert.ok(!(await blattKnopf(page, 1, 'no').isDisabled()));
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('nicht eingetragen nach 14 Tagen: zaehlt nicht, ruhiger Vermerk, kein Hinweis mehr', async () => {
  const { ctx, page } = await app();
  await klick(page, '#sheetBtn'); await page.locator('#sheetClose').click(); await zurStart(page);
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('bq2_sheets')); s[0].day = '2026-09-01'; localStorage.setItem('bq2_sheets', JSON.stringify(s)); });
  await elternOeffnen(page);
  assert.equal(await page.locator('.psheet-note').count(), 0);
  await elternSeite(page, 'sheets');
  assert.match(await page.textContent('details.psheet > summary'), /zählt nicht, ist in Ordnung/);
  await page.locator('.phdr [data-plang="en"]').click();
  assert.match(await page.textContent('details.psheet > summary'), /Sheet 1 · Sep 1, 2026.*doesn’t count, and that’s fine/);
  await ctx.close();
});

test('Blatt-Nummer steht auf dem Papier und in der PDF-Datei', async () => {
  const { ctx, page } = await app();
  await page.locator('#sheetBtn').click();
  await page.locator('#sheetPrint').click();
  const text = await page.evaluate(() => document.querySelector('#printArea').innerText);
  assert.match(text, /Sheet 1 · Date:/);
  assert.match(text, /Sheet 1 · \d{4}-\d{2}-\d{2}/);
  await ctx.close();
});

test('About: Hinweis, Leitgedanken, Lernlogik, Herkunft, Datenschutz und Quellen, deutsch und englisch', async () => {
  const { ctx, page, fehler } = await app();
  await klick(page, '#aboutBtn');
  const de = await page.textContent('#aboutBody');
  for (const t of ['Wichtiger Hinweis', 'ohne pädagogische Herkunft', 'Leitgedanken', 'Lernlogik', 'Herkunft der Aufgaben', 'Datenschutz', 'Quellen', 'KI-Assistenten']) assert.ok(de.includes(t), t);
  // Peter 30./31.10.: topics open in place - the sources are only visible when opened
  assert.equal(await page.locator('#aboutBody a[href^="https://"]:visible').count(), 0, 'overview without visible source list');
  await aboutAbschnitt(page, 'Quellen');
  assert.ok(await page.locator('#aboutBody a[href^="https://"]:visible').count() >= 8);
  await klick(page, '#tabEn');
  const en = await page.textContent('#aboutBody');
  for (const t of ['Please note', 'without any pedagogical origin', 'Sources']) assert.ok(en.includes(t), t);
  await klick(page, '#aboutBack');
  assert.ok(await page.isVisible('#home'));
  assert.deepEqual(fehler, []);
  await ctx.close();
});
