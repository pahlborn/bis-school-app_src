// "Show me an example" in maths (Peter, 01.11.): wherever a simpler example of the same kind makes sense,
// it is offered, it is easier (support level) and it never shows the task's own answer. Real clicks.
//   node --test tests/beispiele.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, alleKarten, karteOeffnen, zustand, klick, zurStart } from './app-hilfen.mjs';

let server, browser;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

const MATHE = ['numbers', 'round', 'combos', 'wordprob', 'detective', 'units', 'graphs'];
// conceptual questions (why / what is / what to do) get a tip but no example
const KONZEPT = /^(Why|What should|What is the problem|What goes|Which digit|A problem has|How do you check|How can you check|You found|The problem says|Which answer is correctly|Your |This bar graph|Which hypothesis|You finished|How many centimetres are in 1 metre)/;
const antwort = (q) => q.kind === 'mc' ? String(q.options[q.answer]).replace(/<[^>]+>/g, '') : String(q.answer);

test('maths: an easier example for (almost) every computable task; never the task’s own answer', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  const karten = (await alleKarten(page)).filter((k) => MATHE.includes(k.item));
  let rechen = 0, mitBeispiel = 0; const ohne = new Set();
  for (const k of karten) {
    for (let r = 0; r < 4; r++) {
      await karteOeffnen(page, k);
      for (let i = 0; i < 8; i++) {
        const s = await zustand(page); const q = s.round[s.idx];
        if (await page.$('#takeChallenge')) { await klick(page, '#takeChallenge'); }
        const text = String(q.prompt).replace(/<[^>]+>/g, '');
        await page.locator('#helpBtn').click();
        const angeboten = (await page.isVisible('#helpBtn')) && (await page.textContent('#helpBtn')) === 'Show me an example';
        const zaehlt = (q.level || 2) > 1 && !KONZEPT.test(text) && MATHE.includes(q.world);
        if (zaehlt) { rechen++; if (angeboten) mitBeispiel++; else ohne.add(text.replace(/\d[\d,.:]*/g, '#').slice(0, 70)); }
        if (angeboten) {
          await page.locator('#helpBtn').click();
          const fb = await page.textContent('#feedback');
          assert.match(fb, /An easier example/, text);
          const exAnswer = fb.match(/Answer: (.*?)Now you/s)[1].trim();
          assert.notEqual(exAnswer.toLowerCase(), antwort(q).toLowerCase(), 'gives away the answer: ' + text);
          if ((q.level || 2) <= 1) assert.fail('example for a support-level task: ' + text);
        }
        await klick(page, '#answerBtn');
        await klick(page, '#nextBtn');
        if (await page.isVisible('#results')) break;
      }
      await zurStart(page);
    }
  }
  console.log(`maths with example: ${mitBeispiel}/${rechen}`, [...ohne]);
  assert.ok(mitBeispiel / rechen >= 0.85, `coverage ${mitBeispiel}/${rechen}: ` + [...ohne].join(' | '));
  assert.deepEqual(fehler, []);
  await ctx.close();
});
