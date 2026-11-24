// Grown-ups view v2 (Peter, 31.10.): same structure as the child's page plus a careful summary in words.
//   node --test tests/elternansicht.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, elternOeffnen } from './app-hilfen.mjs';

let browser, server;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

const tag = (back) => { const d = new Date(); d.setDate(d.getDate() - back); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
/** first tries for a quest: [daysAgo, ok] pairs → attempts log + evidence for the internal stand */
function serie(skill, paare) {
  return { attempts: paare.map(([b, ok]) => ({ day: tag(b), skill, level: 2, attempt: 1, ok, help: false })), ev: paare.map(([b, ok]) => [tag(b), 2, ok ? 1 : 0]) };
}
async function mitDaten(page, serien) {
  const attempts = [], ev = {};
  for (const [k, s] of Object.entries(serien)) { attempts.push(...s.attempts); ev[k] = s.ev; }
  await page.evaluate(([a, e]) => { localStorage.setItem('bq2_attempts', JSON.stringify(a)); localStorage.setItem('bq2_ev', JSON.stringify(e)); }, [attempts, ev]);
}
const SERIEN = {
  // 25 first tries, all right → secure with a broader descriptive evidence sample
  round: serie('round', Array.from({ length: 25 }, (_, i) => [[16, 13, 10, 7, 4, 1][i % 6], true])),
  // 10 first tries, mostly wrong → needs support with initial evidence
  units: serie('units', Array.from({ length: 10 }, (_, i) => [[5, 3, 1][i % 3], i % 5 === 0])),
  // only 4 tries → not yet possible to judge
  graphs: serie('graphs', [[2, true], [2, false], [1, true], [1, true]]),
  // 7 correct L2 tries: common secure status, still a small descriptive evidence sample
  sentences: serie('sentences', Array.from({ length: 7 }, (_, i) => [[3, 2][i % 2], true])),
  // practised long ago → older evidence
  combos: serie('combos', Array.from({ length: 9 }, (_, i) => [[40, 35, 30][i % 3], true]))
};

test('overview: same subjects as the child, summary in words, colours explained, fits a phone', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const kinderFaecher = await page.$$eval('#subjects button.subject .name', (n) => n.map((x) => x.textContent));
  await mitDaten(page, SERIEN);
  await elternOeffnen(page);
  assert.deepEqual(await page.$$eval('#aboutBody .psubject .pname', (n) => n.map((x) => x.textContent)), kinderFaecher);
  const s = await page.textContent('#pSummary');
  // F6: on the overview "what works" is in "At a glance" only, not again in the summary
  assert.doesNotMatch(s, /Das gelingt schon gut/); assert.match(await page.locator('#pGlance').innerText(), /⭐ Das gelingt:[^\n]*Rounding Road/);
  assert.match(s, /Hier hilft Unterstützung/); assert.match(s, /Units & Measuring:.*wiegen/);
  assert.match(s, /Noch nicht einschätzbar/); assert.match(s, /Bar Graphs/);
  assert.match(s, /Länger nicht geübt/); assert.match(s, /Number Combinations/);
  assert.match(s, /keine schulische Beurteilung/);
  assert.doesNotMatch(await page.textContent('#aboutBody'), /So lesen Sie diese Seite/, 'no self-explanation (B4)');
  assert.deepEqual(await page.$$eval('#aboutBody .pleg-line .pleg', (l) => l.map((x) => x.textContent.trim())),
    ['Meeting expectations (M)', 'Extending (E)', 'Consolidating (C)', 'Requires support (RS)', 'Noch nicht einschätzbar'], 'colours explained in one line');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal overflow');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('subject page: status with school term, how sure, basis, trend, recency, tip; careful with little data', async () => {
  const { ctx, page } = await appOeffnen(browser, server.url);
  await mitDaten(page, SERIEN);
  await elternOeffnen(page);
  await page.locator('[data-psubj="science"]').click();
  const units = await page.locator('.pquest', { hasText: 'Units & Measuring' }).textContent();
  assert.match(units, /Requires support \(RS\)/); assert.match(units,/erste Belege/);
  assert.match(units, /10 Aufgaben · 2 selbst gelöst/);   // E1: level 2
  await page.locator('.pquest', { hasText: 'Units & Measuring' }).locator('details.pbasis > summary').click();
  assert.match(await page.locator('.pquest', { hasText: 'Units & Measuring' }).locator('details.pbasis table').innerText(), /10 Aufgaben an 3 Tagen[\s\S]*selbst gelöst\s+2/);
  assert.match(units, /noch keine verlässliche Tendenz/);
  assert.match(units,/Breitere Belege ab etwa 20 ersten Versuchen; der Quest-Stand gilt schon vorher/);
  assert.match(units, /So helfen Sie/);
  const graphs = await page.locator('.pquest', { hasText: 'Bar Graphs' }).textContent();
  assert.match(graphs, /Noch nicht einschätzbar/);
  assert.ok(!/Requires|Consolidating|Meeting|Extending/.test(graphs), 'no level word with too little evidence');
  await page.locator('#pBack').click();
  await page.locator('[data-psubj="maths"]').click();
  const round = await page.locator('.pquest', { hasText: 'Rounding Road' }).textContent();
  assert.match(round, /Meeting expectations \(M\)/); assert.match(round,/breitere Belege/);
  assert.doesNotMatch(round,/Breitere Belege ab etwa 20/,'already a broader sample: no early-sample note');
  await page.locator('#pBack').click();
  await page.locator('[data-psubj="english"]').click();
  const sent = await page.locator('.pquest', { hasText: 'Capital Letters' }).textContent();
  assert.match(sent,/Meeting expectations \(M\)/,'seven correct L2 answers meet the common stand without a day veto');
  assert.match(sent,/wenig Belege/,'fewer than eight describes quantity separately');
  await page.locator('#pBack').click();
  await page.locator('[data-psubj="maths"]').click();
  const combos = await page.locator('.pquest', { hasText: 'Number Combinations' }).textContent();
  assert.match(combos, /Ältere Belege – bei Gelegenheit neu prüfen/);
  await ctx.close();
});

test('focus: "Automatic" (class topics + where support helps) or "Manual", each explained; a switch starts manual mode', async () => {
  const { ctx, page } = await appOeffnen(browser, server.url);
  // detective is not a class topic, but needs support → in focus automatically
  await mitDaten(page, { ...SERIEN, detective: serie('detective', Array.from({ length: 10 }, (_, i) => [[5, 3, 1][i % 3], i % 5 === 0])) });
  await elternOeffnen(page);
  await page.locator('[data-psubj="maths"]').click();
  assert.equal(await page.getAttribute('[data-pfocus="detective"]', 'aria-pressed'), 'true', 'needs support → automatic focus');
  assert.equal(await page.getAttribute('[data-pfocus="round"]', 'aria-pressed'), 'true', 'class topic → automatic focus');
  assert.equal(await page.getAttribute('[data-fmode="auto"]', 'aria-pressed'), 'true', 'automatic by default');
  assert.match(await page.textContent('.pfmode'), /Automatisch: Big Quest wählt\. Manuell: Sie wählen\./);   // E1: one sentence, the rest in ⓘ
  await page.locator('.pfmode .info-btn[data-help="focusmode"]').click();
  assert.match(await page.locator('#helpDlg').innerText(), /Big Quest wählt selbst[\s\S]*Sie legen selbst fest/);
  await page.locator('#helpClose').click();
  // a switch in automatic mode starts manual mode from the current choice
  await page.locator('[data-pfocus="round"]').click();
  assert.equal(await page.getAttribute('[data-fmode="manual"]', 'aria-pressed'), 'true');
  assert.equal(await page.getAttribute('[data-fmode="manual"]', 'aria-pressed'), 'true', 'manual is marked');
  assert.equal(await page.getAttribute('[data-pfocus="round"]', 'aria-pressed'), 'false');
  assert.equal(await page.getAttribute('[data-pfocus="detective"]', 'aria-pressed'), 'true', 'the rest of the choice stays');
  await page.locator('[data-pfocus="numbers"]').click();
  assert.equal(await page.getAttribute('[data-pfocus="numbers"]', 'aria-pressed'), 'true');
  // back to automatic
  await page.locator('[data-fmode="auto"]').click();
  assert.equal(await page.getAttribute('[data-pfocus="round"]', 'aria-pressed'), 'true');
  assert.equal(await page.getAttribute('[data-pfocus="numbers"]', 'aria-pressed'), 'false');
  // manual without changing anything keeps the current choice
  await page.locator('[data-fmode="manual"]').click();
  assert.equal(await page.getAttribute('[data-pfocus="detective"]', 'aria-pressed'), 'true');
  // inside a subject no other chapters (Peter 01.11.)
  assert.equal(await page.locator('#aboutBody .psecs').count(), 0);
  await page.locator('#pBack').click();
  assert.equal(await page.locator('#aboutBody .psecs').count(), 1);
  await ctx.close();
});

test('DE/EN switch changes the whole grown-ups view and is remembered', async () => {
  const { ctx, page } = await appOeffnen(browser, server.url);
  await mitDaten(page, SERIEN);
  await elternOeffnen(page);
  await page.locator('[data-plang="en"]').click();
  const s = await page.textContent('#aboutBody');
  assert.match(s, /Grown-ups area/); assert.match(s, /Requires support \(RS\)/); assert.match(s, /Going well/); assert.match(s, /not a school assessment/);
  await page.locator('[data-psubj="science"]').click();
  assert.match(await page.textContent('#aboutBody'), /What is this based on\?.*Requires support \(RS\)/s);
  await page.reload(); await page.waitForSelector('#aboutBtn');
  await elternOeffnen(page);
  assert.match(await page.textContent('#aboutBody'), /Grown-ups area/);
  await ctx.close();
});

test('without any practice the summary says so and every quest is "not yet possible to judge"', async () => {
  const { ctx, page } = await appOeffnen(browser, server.url);
  await elternOeffnen(page);
  assert.match(await page.textContent('#pSummary'), /noch nicht geübt/);
  const chips = await page.$$eval('.psubject .pst', (c) => c.map((x) => x.textContent));
  assert.ok(chips.every((c) => c.startsWith('Noch nicht einschätzbar')));
  await ctx.close();
});
