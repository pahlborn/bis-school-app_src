// "Show me an example" (Peter, 01.11.): wherever a simpler example of the same kind makes sense, it is offered, it is
// easier and it never shows the task's own answer. In the browser: a short way per subject with real clicks (tip, then
// the example). The long runs over many rounds (coverage >= 85 %, never the answer, never below the support level)
// run without a browser since 04.11.: tests/aufgaben-node.test.mjs.
// This file covers higher-level easier examples. The explicit foundation example/exception matrix
// and neutral headings are checked in tests/auftrag1-grundlage.test.mjs (EV33-CC-M1).
//   node --test tests/beispiele.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, alleKarten, karteOeffnen, zustand, klick, zurStart } from './app-hilfen.mjs';

let server, browser;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

const antwort = (q) => q.kind === 'mc' ? String(q.options[q.answer]).replace(/<[^>]+>/g, '') : String(q.answer);
// one quest per subject that has easier examples: maths, science, English, German, library
const WEGE = ['round', 'forces', 'words', 'anleitung', 'library'];

test('Bedienweg je Fach: Tipp, dann "Show me an example" / "Zeig mir ein Beispiel" - leichter, nie die eigene Loesung', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  const karten = await alleKarten(page);
  for (const item of WEGE) {
    const k = karten.find((x) => x.item === item);
    assert.ok(k, 'quest card: ' + item);
    let gesehen = false;
    for (let r = 0; r < 3 && !gesehen; r++) {
      await karteOeffnen(page, k);
      for (let i = 0; i < 8 && !gesehen; i++) {
        const s = await zustand(page); const q = s.round[s.idx];
        const text = String(q.prompt).replace(/<[^>]+>/g, '');
        await page.locator('#helpBtn').click();                                // the tip
        const label = await page.textContent('#helpBtn');
        if ((q.level || 2) > 1 && (await page.isVisible('#helpBtn')) && /Show me an example|Zeig mir ein Beispiel/.test(label)) {
          await page.locator('#helpBtn').click();                              // the easier example
          const fb = await page.textContent('#feedback');
          assert.match(fb, /An easier example|Ein leichteres Beispiel/, text);
          const ex = ((fb.match(/(?:Answer|Lösung): (.*?)(?:Now you|Jetzt du)/s) || [])[1] || '').trim();
          assert.ok(ex, 'the example shows its answer: ' + fb);
          assert.notEqual(ex.toLowerCase(), antwort(q).trim().toLowerCase(), 'gives away the answer: ' + text);
          gesehen = true;
        }
        await klick(page, '#answerBtn'); await klick(page, '#nextBtn');
        if (await page.isVisible('#results')) break;
      }
      await zurStart(page);
    }
    assert.ok(gesehen, item + ': an easier example within 3 rounds');
  }
  assert.deepEqual(fehler, []);
  await ctx.close();
});
