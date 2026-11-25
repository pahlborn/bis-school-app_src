// Startseite und Faecher (Gliederung seit 29.10.).
//   node --test tests/startseite.test.mjs

import { test, before, after } from 'node:test';
import { appLesen } from '../werkzeug/module.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { WURZEL, QUELLEN } from '../werkzeug/bauen.mjs';
import { appServer, browserStarten, appOeffnen, zustand, klick, alleKarten, karteOeffnen, zurStart, frageBeantworten } from './app-hilfen.mjs';

const FAECHER = ['Maths', 'Science', 'English', 'Deutsch', 'Library & Reading', 'Me as a Learner', 'Events'];
const QUESTS = ['numbers', 'round', 'combos', 'wordprob', 'detective', 'forces', 'units', 'graphs', 'opinion', 'sentences',
  'examples', 'words', 'anleitung', 'library', 'poetry', 'finish', 'team', 'school', 'music', 'trip'];
const MIXE = ['mix_maths', 'mix_science', 'mix_english', 'mix_reading', 'mix_learner'];
const STUDIOS = ['studio:read', 'studio:grow', 'studio:stage'];

const quelltext = await appLesen('utf8');
const FOCUS = new Function('return ' + quelltext.match(/const FOCUS=(\[[^\]]*\]);/)[1])();

let browser, server;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });
const app = () => appOeffnen(browser, server.url);

test('Startseite: Practise Today und sieben Faecher in Schulreihenfolge', async () => {
  const { ctx, page, fehler } = await app();
  assert.ok(await page.isVisible('#todayBtn'));
  assert.deepEqual(await page.$$eval('#subjects button.subject .name', (n) => n.map((x) => x.textContent)), FAECHER);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('jede Quest, jeder Mix und jedes Studio steht genau einmal in einem Fach und oeffnet das Richtige', async () => {
  const { ctx, page, fehler } = await app();
  const karten = await alleKarten(page);
  const items = karten.map((k) => k.item);
  assert.deepEqual(items.filter((x, i) => items.indexOf(x) !== i), [], 'doppelt');
  assert.deepEqual([...items].sort(), [...QUESTS, ...MIXE, ...STUDIOS].sort());
  for (const k of karten) {
    await karteOeffnen(page, k);
    if (k.studio) {
      assert.ok(await page.isVisible('#studioScreen'), k.item);
      assert.equal((await zustand(page)).studio, k.item.slice(7));
    } else {
      assert.ok(await page.isVisible('#play'), k.item);
      assert.equal((await zustand(page)).world, k.item);
    }
  }
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Focus: jedes Fokus-Thema traegt das Zeichen, die Kacheln zaehlen richtig', async () => {
  const { ctx, page } = await app();
  const kacheln = await page.$$eval('#subjects button.subject', (b) => b.map((x) => +((x.querySelector('.focus') || {}).textContent || '0').split(' ')[0]));
  assert.equal(kacheln.reduce((a, b) => a + b, 0), FOCUS.length);
  const mitZeichen = [];
  for (let f = 0; f < FAECHER.length; f++) {
    await zurStart(page);
    await page.evaluate((i) => document.querySelectorAll('#subjects button.subject')[i].click(), f);
    mitZeichen.push(...await page.$$eval('#subjectBody button.world', (b) => b.filter((x) => x.querySelector('.quest-marker[aria-label="Focus"]')).map((x) => x.dataset.item)));
  }
  assert.deepEqual(mitZeichen.sort(), [...FOCUS].sort());
  await ctx.close();
});

test('Archiv: nur der Schulausflug (trip) liegt im Archiv', async () => {
  const { ctx, page } = await app();
  const archiv = (await alleKarten(page)).filter((k) => k.archiv).map((k) => k.item);
  assert.deepEqual(archiv, ['trip']);
  await ctx.close();
});

test('Zurueck fuehrt ins Fach, aus dem die Quest kam; Practise Today zurueck zur Startseite', async () => {
  const { ctx, page, fehler } = await app();
  const maths = (await alleKarten(page)).find((k) => k.item === 'numbers');
  await karteOeffnen(page, maths);
  await klick(page, '#quitBtn');
  assert.ok(await page.isVisible('#subject'));
  assert.equal(await page.textContent('#subjectChip'), 'Maths');

  await page.evaluate(() => document.querySelector('#subjectBody button.world[data-item="numbers"]').click());
  for (let f = 0; f < 8; f++) {
    const s = await zustand(page);
    await frageBeantworten(page, s.round[s.idx]);
    await klick(page, '#nextBtn');
  }
  await klick(page, '#homeBtn');
  assert.ok(await page.isVisible('#subject'), 'nach dem Ergebnis zurueck ins Fach');

  await zurStart(page);
  await klick(page, '#todayBtn');
  assert.equal((await zustand(page)).world, 'today');
  await klick(page, '#quitBtn');
  assert.ok(await page.isVisible('#home'));
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Practise Today behaelt die Fokus-Themen neben genau einem Neuland-Platz', async () => {
  const { ctx, page } = await app();
  const gesehen = new Set();
  for (let r = 0; r < 20; r++) {
    await zurStart(page);
    await klick(page, '#todayBtn');
    const round=(await zustand(page)).round;
    assert.equal(round.length,8);
    assert.equal(round.filter(q=>q.neuland).length,1,'genau ein Neuland-Platz');
    round.filter(q=>!q.neuland).forEach((q) => gesehen.add(q.world));
  }
  assert.deepEqual([...gesehen].filter((w) => !FOCUS.includes(w)), []);
  assert.ok(gesehen.size >= FOCUS.length - 1, `nur ${gesehen.size} Fokus-Themen in 20 Runden`);
  await ctx.close();
});
