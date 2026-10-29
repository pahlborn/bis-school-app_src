// Bedienbarkeit auf kleinen und breiten Bildschirmen.
//   node --test tests/geraete.test.mjs
//
// Anlass (Geraetepruefung 29.10.): Nach dem Antworten lag "Weiter" auf dem
// iPhone SE bei 43 von 48 Fragen unter dem Bildschirmrand, auf dem Laptop
// 1366x768 bei 21 von 48. Das Kind musste selbst suchen.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, questStarten, frageBeantworten, zustand, klick } from './app-hilfen.mjs';

const IPHONE_SE = { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
// [Name, Kontext, Wartezeit nach der Antwort] - mit Bewegung scrollt die App weich, das dauert.
const GERAETE = [
  ['iPhone SE', { ...IPHONE_SE, reducedMotion: 'reduce' }, 0],
  ['iPhone SE, weiches Scrollen', { ...IPHONE_SE, reducedMotion: 'no-preference' }, 800],
  ['Laptop 1366', { viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' }, 0]
];
const QUESTS = ['Time & Numbers', 'Forces', 'Bar Graphs'];
const RUNDEN = (warten) => (warten ? 1 : 2);

let browser, server;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

// Geraetepruefung 29.10.: auf dem Handy war beim Start keine einzige Quest zu sehen.
test('iPhone SE: beim Start sind Practise Today und mindestens vier Faecher zu sehen', async () => {
  const { ctx, page } = await appOeffnen(browser, server.url, IPHONE_SE);
  const ganz = await page.evaluate(() => {
    const drin = (e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; };
    return { heute: drin(document.querySelector('#todayBtn')), faecher: [...document.querySelectorAll('#subjects button.subject')].filter(drin).length };
  });
  assert.ok(ganz.heute, 'Practise Today');
  assert.ok(ganz.faecher >= 4, `nur ${ganz.faecher} Faecher ganz zu sehen`);
  await ctx.close();
});

for (const [name, opts, warten] of GERAETE) {
  test(`${name}: nach jeder Antwort ist "Weiter" ganz zu sehen`, async () => {
    const { ctx, page, fehler } = await appOeffnen(browser, server.url, opts);
    const verdeckt = [];
    let fragen = 0;
    for (const quest of QUESTS) {
      for (let runde = 0; runde < RUNDEN(warten); runde++) {
        await questStarten(page, quest);
        for (let f = 0; f < 8; f++) {
          const s = await zustand(page);
          await frageBeantworten(page, s.round[s.idx]);
          if (warten) await page.waitForTimeout(warten);
          const lage = await page.evaluate(() => { const r = document.querySelector('#nextBtn').getBoundingClientRect(); return { oben: r.top, unten: r.bottom, h: innerHeight }; });
          fragen++;
          if (lage.oben < 0 || lage.unten > lage.h) verdeckt.push(`${quest} F${f + 1}: ${Math.round(lage.oben)}..${Math.round(lage.unten)} bei Hoehe ${lage.h}`);
          await klick(page, '#nextBtn');
        }
        await klick(page, '#homeBtn');
      }
    }
    assert.ok(fragen >= 24);
    assert.deepEqual(verdeckt, []);
    assert.deepEqual(fehler, []);
    await ctx.close();
  });
}
