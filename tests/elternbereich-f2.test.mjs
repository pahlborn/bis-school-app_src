// Paket F2 (Konzept Elternbereich 7.2 Punkte 1–3, Befunde B2, B3): So funktioniert Big Quest, Teil 1.
//  T6: die Kernsätze („nach 1, 3 und 7 Tagen“, „keinen zweiten Weg“) je Sprache genau einmal im Elternbereich.
//  Dazu: Grundidee, Aufbau, So lernt das Kind in dieser Reihenfolge; Fokus aus nächsten Schritten und Lücken;
//  keine falschen Sätze aus B2/B3; jede Regel einmal; höchstens 3 600 Zeichen für die drei Abschnitte.
//   node --test tests/elternbereich-f2.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, elternOeffnen, elternSeite } from './app-hilfen.mjs';

let browser, server;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

const zaehle = (t, w) => t.split(w).length - 1;
const abschnitt = (page, titel) => page.locator('#aboutBody details.psec[data-psec="concept"] details.about-sec').filter({ has: page.locator('summary', { hasText: titel }) }).first().locator('.about-sec-body').textContent();

test('T6 core sentences once per language in the grown-ups area; parts 1–3 in order, correct and short', async () => {
  const { ctx, page } = await appOeffnen(browser, server.url);
  await elternOeffnen(page);
  for (const [lang, S] of [['de', { titel: ['Grundidee', 'Aufbau', 'So lernt das Kind'], kern: ['nach 1, 3 und 7 Tagen', 'keinen zweiten Weg'], luecke: /Lücken/, falsch: ['die Eltern legen fest', 'Einzelheiten stehen im Elternbereich', 'Exkurs', 'Lernlogik', 'nach drei und nach sieben Tagen'] }],
                           ['en', { titel: ['Core idea', 'Structure', 'How your child learns'], kern: ['after 1, 3 and 7 days'], luecke: /gaps/, falsch: ['the parents decide', 'details are in the', 'Side note', 'after three and seven days'] }]]) {
    await page.locator(`.phdr [data-plang="${lang}"]`).click();
    await elternSeite(page, 'concept');
    const titel = await page.locator('#aboutBody details.psec[data-psec="concept"] details.about-sec > summary').allInnerTexts();
    assert.deepEqual(titel.slice(0, 3), S.titel, lang + ': parts 1–3 in this order');
    const alles = await page.locator('#aboutBody').textContent();
    for (const k of S.kern) assert.equal(zaehle(alles, k), 1, `${lang}: „${k}“ exactly once`);
    for (const f of S.falsch) assert.ok(!alles.includes(f), `${lang}: gone: ${f}`);
    const [idee, aufbau, lernen] = await Promise.all(S.titel.map((t) => abschnitt(page, t)));
    assert.match(idee, S.luecke, lang + ': the focus also comes from the gaps (core idea)');
    assert.match(aufbau, S.luecke, lang + ': … and in the structure');
    assert.match(aufbau, lang === 'de' ? /Manuell/ : /Manual/, lang + ': parents can switch to manual');
    for (const w of lang === 'de' ? ['Zeig mir, wie', 'zwei leichtere Aufgaben', 'zeigt die Lösung', 'nicht geschafft'] : ['Show me how', 'two easier tasks', 'shows the solution', 'not yet done']) assert.equal(zaehle(lernen, w), 1, `${lang}: each rule once: ${w}`);
    const n = [idee, aufbau, lernen].map((t) => t.replace(/\s+/g, ' ').trim().length).reduce((a, b) => a + b, 0);
    assert.ok(n <= 3600, `${lang}: ${n} characters for parts 1–3`);
  }
  await ctx.close();
});
