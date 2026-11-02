// Prueft die Fragen der App: jede Quest viele Runden erzeugen und jede Frage
// auf Widersprueche pruefen, dazu Runden mit den richtigen Antworten
// durchspielen.
//   node --test tests/fragen.test.mjs

import { test, before, after } from 'node:test';
import { appLesen } from '../werkzeug/module.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { WURZEL, QUELLEN } from '../werkzeug/bauen.mjs';
import {
  appServer, browserStarten, appOeffnen, zustand, klick, sichtbar, textAus,
  alleKarten, karteOeffnen, zurStart, frageBeantworten
} from './app-hilfen.mjs';

const RUNDEN_JE_QUEST = 100;      // nur erzeugen und pruefen
const HEUTE_DURCHGESPIELT = 60;  // Practise Today: mischt Fragen aus mehreren Quests
const MIX_DURCHGESPIELT = 15;    // je Fach-Mix (die alte Mixed Quest hing bis 29.10. in etwa jeder 4. Runde)
const ANDERE_DURCHGESPIELT = 5;

const quelltext = await appLesen('utf8');
const SENTS = new Function('return ' + quelltext.match(/const SENTS=(\[[\s\S]*?\n\]);/)[1])();

let browser, server;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

const app = () => appOeffnen(browser, server.url);
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
  const karten = (await alleKarten(page)).filter((k) => !k.studio);
  const befunde = new Map();
  const welten = new Set();
  for (const k of karten) {
    for (let r = 0; r < RUNDEN_JE_QUEST; r++) {
      await karteOeffnen(page, k);
      if (await sichtbar(page, '#studioScreen')) break;
      const s = await zustand(page);
      welten.add(s.world);
      for (const q of s.round) for (const b of pruefeFrage(q)) befunde.set(`${s.world}: ${b}`, (befunde.get(`${s.world}: ${b}`) || 0) + 1);
      await klick(page, '#quitBtn');
    }
  }
  assert.ok(welten.size >= 20, `nur ${welten.size} Quests gefunden`);
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
    await frageBeantworten(page, q);
    assert.ok(await page.evaluate(() => { const fb = document.querySelector('#feedback'); return !fb.hidden && fb.classList.contains('good'); }),
      `${s.world}: richtige Antwort nicht als richtig gewertet: ${textAus(q.prompt)}`);
    await klick(page, '#nextBtn');
    assert.deepEqual(fehler, [], `${s.world}: Fehler nach Frage ${f + 1}`);
  }
  assert.ok(await sichtbar(page, '#results'), 'Ergebnisseite nach Frage 8');
  assert.equal(await page.textContent('#resScore'), '8');
  await klick(page, '#homeBtn');
}

test('Practise Today und Fach-Mixe: viele Runden durchspielbar, ohne Haenger', async () => {
  const { ctx, page, fehler } = await app();
  for (let r = 0; r < HEUTE_DURCHGESPIELT; r++) {
    await zurStart(page);
    await klick(page, '#todayBtn');
    await durchspielen(page, fehler);
  }
  const mixe = (await alleKarten(page)).filter((k) => k.item.startsWith('mix_'));
  assert.ok(mixe.length >= 4, `nur ${mixe.length} Fach-Mixe`);
  for (const m of mixe) {
    for (let r = 0; r < MIX_DURCHGESPIELT; r++) {
      await karteOeffnen(page, m);
      await durchspielen(page, fehler);
    }
  }
  await ctx.close();
});

// Strategie- und Verstaendnisfragen (01.11.): falsche Antworten sollen typische
// Denkfehler sein, keine Scherzantworten, die man ohne Nachdenken ausschliesst;
// Runden nach dem Schulmodell (Nachbarzahlen und Mitte), nicht "ab 5 aufrunden".
test('Strategiefragen: keine Scherz-Ablenker, Runden nach dem Schulmodell', () => {
  const SCHERZ = ['Take a selfie', 'Ask the sticker', 'Colour the page', 'The first letter', 'Draw a map',
    'Ask a stranger', 'Hide it', 'Throw it away', 'Write it bigger', 'So the numbers look pretty',
    'Tens look nicer', 'Erase the question', 'Draw on the back', 'Fold it', 'Because it is a rule for colouring'];
  for (const s of SCHERZ) assert.ok(!quelltext.includes(`"${s}"`), `Scherz-Ablenker noch da: ${s}`);
  assert.ok(!/digit 5 or more: round up/i.test(quelltext), 'Rundungsregel "ab 5" statt Nachbarzahlen und Mitte');
  assert.match(quelltext, /Round 347 to the nearest hundred\. How do you decide\?","Find the halfway point 350/);
  assert.match(quelltext, /You made 905 as 500 \+ 400 \+ 5\. Which is ANOTHER correct way\?","600 \+ 300 \+ 5"/);
});

test('jede Quest: Runden mit richtigen Antworten ergeben 8 von 8', async () => {
  const { ctx, page, fehler } = await app();
  for (const k of await alleKarten(page)) {
    for (let r = 0; r < ANDERE_DURCHGESPIELT; r++) {
      await karteOeffnen(page, k);
      if (await sichtbar(page, '#studioScreen')) break;
      await durchspielen(page, fehler);
    }
  }
  await ctx.close();
});