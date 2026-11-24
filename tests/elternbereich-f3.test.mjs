// Paket F3 (Konzept Elternbereich 6, 7.2 Punkte 4–6): So funktioniert Big Quest, Teil 2. Erfundene Schuldaten, keine echten.
//  T6: „keinen zweiten Weg“ / „don’t add a second method“ je Sprache genau einmal.
//  T7: „So funktioniert Big Quest“ höchstens 7 000 Zeichen ohne Quellen (sichtbarer Text; „Genaue Schwellen“ zugeklappt zählt nicht).
//  Dazu: Helfen wie die Schule höchstens 3 Sätze; Wie die App einstuft mit Kurzfassung, „Learning goals erreichen“ (mit dem
//  ehrlichen Satz) und „Genaue Schwellen“ zugeklappt; keine Schulbegriffe; Fokus-ⓘ und „Aus der Schule“ nennen die Lücke.
//   node --test tests/elternbereich-f3.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'ABCD-EFGH', papa: 'PAPA-2345' };
const tag = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const txt = (de, en) => ({ de, en });
const SCHULE = { version: 1, kinder: { mia: { asOf: tag(-1), tasks: [
  { day: tag(-20), area: 'math', title: 'Check B', std: { 'M-N1': 'RS' }, quests: ['numbers'], focusNext: [], good: txt('b', 'b'), next: txt('', '') }
] } } };
let browser, server;
before(async () => {
  server = await kontenServer({ users: [await konto('mia', 'student', C.mia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] })] }, { schule: SCHULE });
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); });

const zaehle = (t, w) => t.split(w).length - 1;
const sec = (page, titel) => page.locator('#aboutBody details.psec[data-psec="concept"] details.about-sec').filter({ has: page.locator('summary', { hasText: titel }) }).first();

test('T6/T7 part 2: short, gaps explained honestly, exact thresholds folded away, no school terms; focus ⓘ and "From school" name the gap', async (t) => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'papa', C.papa); await passwortSetzen(page, 'Moon-Glass-Paper-8812');
  await page.waitForSelector('#parentClose');
  const S = {
    de: { helfen: 'Helfen wie die Schule', ein: 'Wie die App einstuft', kern: 'keinen zweiten Weg', luecken: 'Learning goals erreichen', genau: 'Genaue Schwellen', quellen: 'Quellen',
      ehrlich: 'Meeting expectations (M) beschreibt die Antworten in der App. Wer geantwortet hat und mit welchen Hilfsmitteln, weiß die App nicht', knoepfe: ['Jetzt angehen', 'Als geschlossen markieren', 'Weiter üben'] },
    en: { helfen: 'Helping the way school does', ein: 'How the app judges', kern: 'don’t add a second method', luecken: 'Reaching learning goals', genau: 'Exact thresholds', quellen: 'Sources',
      ehrlich: 'Meeting expectations (M) describes the answers in the app. The app does not know who answered', knoepfe: ['Work on it now', 'Mark as closed', 'Keep practicing'] }
  };
  for (const lang of ['de', 'en']) {
    const L = S[lang];
    await page.locator(`.phdr [data-plang="${lang}"]`).click();
    const konzept = page.locator('#aboutBody details.psec[data-psec="concept"]');
    if (!(await konzept.evaluate((d) => d.open))) await konzept.locator(':scope > summary').click();
    const alles = await page.locator('#aboutBody').textContent();
    assert.equal(zaehle(alles, L.kern), 1, `${lang}: „${L.kern}“ exactly once`);
    // T7: the chapter without the sources
    const kapitel = (await konzept.locator('.psec-body').textContent()).replace(/\s+/g, ' ');
    const quellen = (await sec(page, L.quellen).textContent()).replace(/\s+/g, ' ');
    // the folded "exact thresholds" keep today's content (concept 7.2) and are not counted: T7 measures what is shown
    const genauText = (await sec(page, L.ein).locator('details.about-sub').textContent()).replace(/\s+/g, ' ');
    const n = kapitel.length - quellen.length - genauText.length;
    assert.ok(n <= 7000, `${lang}: ${n} characters without sources and folded thresholds`);
    t.diagnostic(`C/G concept text ${lang}: ${n}/7000 characters`);
    // helping the way school does: the why in at most 3 sentences
    const helfen = (await sec(page, L.helfen).locator('.about-sec-body').textContent()).trim();
    assert.ok(helfen.split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ„“])/).length <= 3, `${lang}: at most 3 sentences: ${helfen}`);
    assert.match(helfen, /Patall et al\. 2008/); assert.match(helfen, /Maloney et al\. 2015/);
    // how the app judges: summary, closing gaps with the honest sentence, exact thresholds folded away
    const ein = sec(page, L.ein);
    assert.equal(await ein.locator('.about-sec-body > ul').first().locator('> li').count(), 5, `${lang}: summary in 5 lines`);
    const et = await ein.textContent();
    assert.ok(et.includes(L.luecken) && et.includes(L.ehrlich), `${lang}: closing gaps with the honest sentence`);
    for (const k of L.knoepfe) assert.ok(et.includes(k), `${lang}: names the button ${k}`);
    const genau = ein.locator('details.about-sub');
    assert.equal((await genau.locator('summary').textContent()).trim(), L.genau);
    assert.equal(await genau.evaluate((d) => d.open), false, `${lang}: exact thresholds folded away`);
    for (const term of ['Requires support (RS)', 'Consolidating (C)', 'Meeting expectations (M)', 'Extending (E)']) assert.ok(et.includes(term), `${lang}: original level ${term}`);
  }
  await page.locator('.phdr [data-plang="de"]').click();
  // focus ⓘ and the introduction "From school" name the gap
  await page.locator('[data-psubj="maths"]').click(); await page.waitForSelector('#pSchool');
  assert.match(await page.locator('#pSchool > p.small').first().innerText(), /Learning goals mit Consolidating \(C\) oder Requires support \(RS\) übt die App, bis sie geschlossen sind\./);
  const fokus = await page.evaluate(() => { const b = document.createElement('button'); b.className = 'info-btn'; b.dataset.help = 'focus'; document.body.append(b); b.click(); const t = document.querySelector('#helpText').innerText; b.remove(); return t; });
  assert.match(fokus, /aktive Learning goal/);
  assert.deepEqual(fehler, []);
  await ctx.close();
});
