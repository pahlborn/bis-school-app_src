// Uebungsblaetter zum Ausdrucken, Eintragen durch das Kind (A9), Stand fuer Erwachsene (A10), Seite "About".
//   node --test tests/blaetter.test.mjs

import { test, before, after } from 'node:test';
import { appLesen } from '../werkzeug/module.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { WURZEL, QUELLEN } from '../werkzeug/bauen.mjs';
import { appServer, browserStarten, appOeffnen, klick, zurStart, elternOeffnen, elternSeite, aboutAbschnitt, zustand, sichtbar, frageBeantworten } from './app-hilfen.mjs';

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

const gesamtEv = async (page) => Object.values((await lies(page, 'ev')) || {}).reduce((s, l) => s + l.length, 0);

/* A9 (02.11.): the child enters its sheet itself - with real clicks, like Practise Today */
async function falschGeben(page, q) {
  if (q.kind === 'mc') await klick(page, `#qAnswers .opt[data-i="${(q.answer + 1) % q.options.length}"]`);
  else if (q.kind === 'type') { for (const z of String(+q.answer + 1)) await klick(page, `#qAnswers .key[aria-label="${z}"]`); await klick(page, '#qAnswers .key.go'); }
  else { for (const k of [...q.correct].reverse()) await klick(page, `#qAnswers .ord[data-i="${k}"]`); await klick(page, '#checkOrder'); }
}
/** one task of the running sheet round; returns the result the app should write */
async function blattAufgabe(page, wie) {
  const z = await zustand(page), q = z.round[z.idx];
  let erwartet;
  if (wie === 'richtig') { await frageBeantworten(page, q); erwartet = 'ok'; }
  else if (wie === 'tipp') { await klick(page, '#helpBtn'); await frageBeantworten(page, q); erwartet = 'help'; }
  else if (wie === 'loesung') { await falschGeben(page, q); if (!(await sichtbar(page, '#nextBtn'))) await klick(page, '#answerBtn'); erwartet = 'no'; }
  else { await falschGeben(page, q); if (await sichtbar(page, '#nextBtn')) erwartet = 'no'; else { await frageBeantworten(page, q); erwartet = 'help'; } }   // second try
  assert.ok(await sichtbar(page, '#nextBtn'), 'task decided: ' + wie);
  await klick(page, '#nextBtn');
  return erwartet;
}
async function neuesBlatt(page) { await klick(page, '#sheetBtn'); await page.locator('#sheetClose').click(); await zurStart(page); }

test('A9: Kind traegt sein Blatt selbst ein – Ansicht wie Practise Today, Nummer vom Blatt, nur das Blatt-Ergebnis', async () => {
  const { ctx, page, fehler } = await app();
  assert.equal(await sichtbar(page, '#mySheets'), false, 'no open sheet: no "My sheets"');
  await neuesBlatt(page);
  const blatt = (await lies(page, 'sheets'))[0];
  assert.equal(blatt.no, 1, 'running number');
  assert.ok(await sichtbar(page, '#mySheets'), '"My sheets" under the sheet button');
  assert.match(await page.textContent('#mySheets'), /My sheets.*Sheet 1 · .*enter my answers/s);
  const vorher = { attempts: (await lies(page, 'attempts')) || [], total: (await lies(page, 'total')) || 0 };
  await page.locator('#mySheets [data-mysheet]').click();
  let z = await zustand(page);
  assert.ok(await sichtbar(page, '#play'));
  assert.equal(z.round.length, 6);
  assert.deepEqual(z.round.map((q) => q.prompt), blatt.items.map((i) => i.q.prompt), 'same tasks in the order of the paper');
  assert.match(await page.textContent('#qLabel'), /^Task 1 of 6 – on your sheet: number 1$/);
  if (z.round[0].kind === 'mc') assert.equal(await page.textContent('#qAnswers .opt[data-i="1"] .optletter'), 'B', 'the letter from the paper');
  // four tasks: right, with the tip, answer shown, wrong then a second try - then interrupted
  const erwartet = [];
  for (const wie of ['richtig', 'tipp', 'loesung', 'zweiter']) erwartet.push(await blattAufgabe(page, wie));
  await klick(page, '#quitBtn');
  let s = (await lies(page, 'sheets'))[0];
  assert.deepEqual(s.items.map((i) => i.res), [...erwartet, null, null]);
  const neu = ((await lies(page, 'attempts')) || []).slice(vorher.attempts.length);
  assert.deepEqual(neu.filter((a) => !a.sheet), [], 'no normal answers on top (would count twice)');
  assert.deepEqual(neu.map((a) => [a.ok, a.help]), erwartet.map((r) => [r !== 'no', r === 'help']), 'one line per task, like before');
  assert.equal(await gesamtEv(page), 4, 'one piece of evidence per task');
  const ev = await lies(page, 'ev');
  erwartet.forEach((r, i) => { const w = blatt.items[i].q.world; assert.ok(ev[w].some((e) => e[2] === (r === 'no' ? 0 : 1) && (r !== 'help' || e[1] === 1)), `task ${i + 1}: ${r}`); });
  assert.ok((await lies(page, 'due')).some((d) => d.q.prompt === blatt.items[2].q.prompt), 'not yet -> comes back later');
  assert.deepEqual(Object.keys((await lies(page, 'badges')) || {}), [], 'no badges on top while the sheet is not finished');
  assert.equal(((await lies(page, 'bridgeNext')) || []).length, 0, 'no bridge tasks');
  // later: go on with the rest
  assert.match(await page.textContent('#mySheets'), /4 of 6 done, go on/);
  await page.locator('#mySheets [data-mysheet]').click();
  z = await zustand(page);
  assert.equal(z.round.length, 2);
  assert.match(await page.textContent('#qLabel'), /^Task 1 of 2 – on your sheet: number 5$/);
  for (let i = 0; i < 2; i++) erwartet.push(await blattAufgabe(page, 'richtig'));
  assert.ok(await sichtbar(page, '#results'));
  assert.equal(await sichtbar(page, '#againBtn'), false, 'a sheet is entered once');
  s = (await lies(page, 'sheets'))[0];
  assert.deepEqual(s.items.map((i) => i.res), erwartet);
  assert.equal((await lies(page, 'badges')).principled, 1, 'Principled: the whole sheet');
  assert.ok((await lies(page, 'total')) > vorher.total, 'the stars count');
  await zurStart(page);
  assert.equal(await sichtbar(page, '#mySheets'), false, 'finished sheet leaves "My sheets"');
  const text = (await page.evaluate(() => document.body.innerText)).toLowerCase();
  assert.deepEqual(VERBOTEN.filter((w) => text.includes(w)), []);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('A10: Elternseite zeigt nur den Stand – keine Eingabeknoepfe; leeres Blatt verwerfen; Hinweis in der Uebersicht', async () => {
  const { ctx, page, fehler } = await app();
  await neuesBlatt(page);
  await page.clock.setFixedTime(new Date(Date.now() + 60000));   // the sheet id contains the time
  await neuesBlatt(page);
  const [b1, b2] = await lies(page, 'sheets');
  assert.deepEqual([b1.no, b2.no], [1, 2], 'two sheets on the same day are told apart');
  // the child enters three tasks of sheet 1
  await page.locator(`#mySheets [data-mysheet="${b1.id}"]`).click();
  for (const wie of ['richtig', 'tipp', 'loesung']) await blattAufgabe(page, wie);
  await zurStart(page);
  await elternOeffnen(page);
  // calm note on the overview, says where the child enters; the button only shows the state
  assert.match(await page.textContent('.psheet-note'), /2 Übungsblätter sind noch offen.*Ihr Kind trägt die Antworten selbst ein: Startseite → „My sheets“/);
  await page.locator('.psheet-note button').click();
  const d2 = page.locator(`details.psheet[data-sheetid="${b2.id}"]`);
  assert.ok(await d2.evaluate((d) => d.open), 'sheet opened');
  assert.equal(await page.locator('#aboutBody button[data-res]').count(), 0, 'no entering by grown-ups');
  assert.match(await page.textContent('#aboutBody'), /Ihr Kind trägt seine Antworten selbst in der App ein/);
  assert.match(await d2.locator('summary').textContent(), /Blatt 2 · .*noch nicht angefangen/);
  const d1 = page.locator(`details.psheet[data-sheetid="${b1.id}"]`);
  assert.match(await d1.locator('summary').textContent(), /Blatt 1 · .*3 von 6 erledigt/);
  await d1.locator('summary').click();
  assert.deepEqual(await d1.locator('.sres').allTextContents(), ['✓ Richtig', '🤝 Mit Hilfe', '↻ Noch nicht', '○ noch offen', '○ noch offen', '○ noch offen']);
  assert.equal(await d1.locator('[data-discard]').count(), 0, 'a sheet with entries stays');
  // discard the empty sheet 2 - only grown-ups, only here
  page.once('dialog', (d) => d.accept());
  await d2.locator('[data-discard]').click();
  assert.deepEqual((await lies(page, 'sheets')).map((s) => s.id), [b1.id]);
  await page.locator('.phdr [data-plang="en"]').click();
  assert.match(await page.textContent(`details.psheet[data-sheetid="${b1.id}"] > summary`), /Sheet 1 · .*3 of 6 done/);
  assert.match(await page.textContent('#aboutBody'), /your child enters the answers in the app – on the start page under “My sheets”/);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('nicht eingetragen nach 14 Tagen: zaehlt nicht, ruhiger Vermerk, kein Hinweis mehr', async () => {
  const { ctx, page } = await app();
  await klick(page, '#sheetBtn'); await page.locator('#sheetClose').click(); await zurStart(page);
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('bq2_sheets')); s[0].day = '2026-09-01'; localStorage.setItem('bq2_sheets', JSON.stringify(s)); });
  await page.reload(); await page.waitForSelector('#home h1');
  assert.equal(await sichtbar(page, '#mySheets'), false, 'an old, never entered sheet is not offered any more');
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
