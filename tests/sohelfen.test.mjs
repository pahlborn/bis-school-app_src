// "How you can help" per quest (Peter, 01.11.): concrete help at the assessment, "where it got stuck"
// with the child's first answer, and a practice sheet on one topic. Real clicks.
//   node --test tests/sohelfen.test.mjs

import { test, before, after } from 'node:test';
import { appLesen } from '../werkzeug/module.mjs';
import { schoolStandardsByQuest } from '../src/module/standardkatalog.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { WURZEL, QUELLEN } from '../werkzeug/bauen.mjs';
import { appServer, browserStarten, appOeffnen, elternOeffnen, questStarten, zustand, zurStart } from './app-hilfen.mjs';

const quelltext = (await appLesen('utf8')).replace(/\r\n/g, '\n');
let browser, server;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

const tag = (back) => { const d = new Date(); d.setDate(d.getDate() - back); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function serie(skill, paare) {
  return { attempts: paare.map(([b, ok]) => ({ day: tag(b), skill, level: 2, attempt: 1, ok, help: false })), ev: paare.map(([b, ok]) => [tag(b), 2, ok ? 1 : 0]) };
}
async function mitDaten(page, serien) {
  const attempts = [], ev = {};
  for (const [k, s] of Object.entries(serien)) { attempts.push(...s.attempts); ev[k] = s.ev; }
  await page.evaluate(([a, e]) => { localStorage.setItem('bq2_attempts', JSON.stringify(a)); localStorage.setItem('bq2_ev', JSON.stringify(e)); }, [attempts, ev]);
}

test('every quest with an assessment has help in German and English (4 parts and a basis)', () => {
  const keys = Object.keys(schoolStandardsByQuest());
  assert.ok(keys.length >= 14);
  const block = quelltext.match(/const HELP_Q=\{([\s\S]*?)\n\};/)[1];
  for (const k of [...keys, 'finish']) {
    const m = block.match(new RegExp(`\\n  ${k}:\\{de:\\[([\\s\\S]*?)\\],\\n    en:\\[([\\s\\S]*?)\\]\\}`));
    assert.ok(m, 'help for ' + k);
    for (const teil of [m[1], m[2]]) assert.equal(new Function('return [' + teil + ']')().length, 5, k);
  }
});

test('help sits at the quest: open and highlighted where support helps, closed elsewhere; German and English', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await mitDaten(page, {
    units: serie('units', Array.from({ length: 10 }, (_, i) => [[5, 3, 1][i % 3], i % 5 === 0])),
    forces: serie('forces', Array.from({ length: 25 }, (_, i) => [[16, 13, 10, 7, 4, 1][i % 6], true]))
  });
  await elternOeffnen(page);
  await page.locator('[data-psubj="science"]').click();
  const karte = (k) => page.locator('.pquest', { has: page.locator(`[data-pfocus="${k}"]`) });
  assert.ok(await karte('units').locator('details.phelpq.need').evaluate((d) => d.open), 'needs support → open');
  assert.equal(await karte('forces').locator('details.phelpq').evaluate((d) => d.open), false, 'secure → closed');
  const text = await karte('units').locator('.phelpq-body').innerText();
  // E1: fixed parts in a fixed order (concept 5.11)
  for (const w of ['🎯 Ziel', '⚠️ Stolperstein', '💡 Ideen für zu Hause', 'Besser nicht', 'Grundlage']) assert.ok(text.includes(w), w);
  assert.ok(text.indexOf('Ziel') < text.indexOf('Stolperstein') && text.indexOf('Stolperstein') < text.indexOf('Ideen für zu Hause'), 'order of the parts');
  assert.ok(await karte('units').locator('.phelpq-body').isVisible());
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'fits a phone');
  await page.locator('.phdr [data-plang="en"]').click();
  const en = await karte('units').locator('.phelpq-body').innerText();
  for (const w of ['🎯 Goal', '⚠️ Stumbling block', '💡 Ideas for home', 'Better not', 'Based on']) assert.ok(en.includes(w), w);
  assert.ok(!/[äöüß]/.test(en.replace(/Als Erstes|Als Nächstes|Danach|Zum Schluss/g, '')), 'English text');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('"where it got stuck" shows an open review with the right answer and the child’s first answer', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  let q;
  for (let i = 0; i < 10; i++) {
    await questStarten(page, 'Rounding');
    q = (await zustand(page)).round[0];
    if (q.kind === 'mc') break;
    await page.locator('#quitBtn').click(); await zurStart(page);
  }
  assert.equal(q.kind, 'mc');
  const falsch = q.options.findIndex((_, i) => i !== q.answer);
  await page.locator(`#qAnswers .opt[data-i="${falsch}"]`).click();
  await page.locator('#quitBtn').click(); await zurStart(page);
  await elternOeffnen(page);
  await page.locator('[data-psubj="maths"]').click();
  const stuck = page.locator('.pquest', { has: page.locator('[data-pfocus="round"]') }).locator('.pstuck li');
  assert.equal(await stuck.count(), 1);
  const t = await stuck.innerText();
  assert.match(t, /richtig: /);
  assert.match(t, /erste Antwort: /);
  assert.ok(t.includes(String(q.options[falsch]).replace(/<[^>]+>/g, '').trim().slice(0, 10)), 'first answer shown');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('a practice sheet on one topic straight from the quest', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  await page.evaluate(() => { window.print = () => {}; });
  await elternOeffnen(page);
  await page.locator('[data-psubj="science"]').click();
  await page.locator('[data-psheetq="units"]').click();
  assert.ok(await page.locator('#sheetDlg').isVisible());
  const blatt = await page.evaluate(() => JSON.parse(localStorage.getItem('bq2_sheets')).slice(-1)[0]);
  assert.ok(blatt.items.length >= 4 && blatt.items.every((i) => i.q.world === 'units'), 'only the chosen topic');
  await page.locator('#sheetClose').click();
  await page.locator('#pBack').click();
  assert.ok(await page.locator('.psheet-note').isVisible(), 'the new sheet is waiting to be entered');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('basis line shows how much help was used: with help, of them with an example', async () => {
  const { ctx, page } = await appOeffnen(browser, server.url);
  const a = (o) => ({ day: tag(1), skill: 'round', level: 2, attempt: 1, ok: true, help: false, ...o });
  await page.evaluate((log) => localStorage.setItem('bq2_attempts', JSON.stringify(log)),
    [a({}), a({}), a({ help: true }), a({ help: true, example: true }), a({ ok: false }), a({ attempt: 2, ok: true, help: true })].filter((x) => x.attempt === 1 || true));
  await elternOeffnen(page);
  await page.locator('[data-psubj="maths"]').click();
  // E1: level 2 is one line, the details are in "ⓘ Worauf beruht das?"
  const k = page.locator('.pquest', { has: page.locator('[data-pfocus="round"]') });
  assert.match(await k.locator('.pq2').innerText(), /^\d+ Aufgaben · 2 selbst gelöst/);
  await k.locator('details.pbasis > summary').click();
  const tab = await k.locator('details.pbasis table').innerText();
  assert.match(tab, /selbst gelöst\s+2/); assert.match(tab, /mit Hilfe\s+3 \(davon 1 mit Beispiel\)/);
  await ctx.close();
});
