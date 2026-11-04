// Prueft die Fragen der App im Browser: je Fach ein kurzer Bedienweg (eine Runde mit den richtigen Antworten, echte
// Klicks) und Practise Today. Die langen Durchlaeufe (alle Quests, viele Runden: Widersprueche, 8 von 8, Practise
// Today und Fach-Mixe) laufen seit 04.11. ohne Browser in tests/aufgaben-node.test.mjs.
//   node --test tests/fragen.test.mjs

import { test, before, after } from 'node:test';
import { appLesen } from '../werkzeug/module.mjs';
import assert from 'node:assert/strict';
import {
  appServer, browserStarten, appOeffnen, zustand, klick, sichtbar, textAus,
  alleKarten, karteOeffnen, zurStart, frageBeantworten
} from './app-hilfen.mjs';

const quelltext = await appLesen('utf8');

let browser, server;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

const app = () => appOeffnen(browser, server.url);

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

test('Bedienweg je Fach: erste Quest eine Runde mit richtigen Antworten (8 von 8), dazu Practise Today', async () => {
  const { ctx, page, fehler } = await app();
  const karten = (await alleKarten(page)).filter((k) => !k.studio);
  const faecher = [...new Set(karten.map((k) => k.fach))];
  assert.ok(faecher.length >= 7, `nur ${faecher.length} Faecher mit Quests`);
  for (const fach of faecher) {
    await karteOeffnen(page, karten.find((k) => k.fach === fach));
    await durchspielen(page, fehler);
  }
  await zurStart(page);
  await klick(page, '#todayBtn');
  await durchspielen(page, fehler);
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
