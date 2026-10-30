// S1 (30.10.): "Show me how" before any own try is not a failure: no evidence, neutral for the
// child, review and bridge stay. Help after a mistake is unchanged. Real clicks.
//   node --test tests/showme.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, zustand } from './app-hilfen.mjs';

let server, browser;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

const roundQ = () => ({ kind: 'mc', world: 'round', label: 'Rounding Road', level: 2, prompt: 'Round 470 to the nearest hundred.', options: ['400', '500', '470', '600'], answer: 1, explain: '470 is 70 from 400 and 30 from 500.', coach: { family: 'round', n: 470, step: 100 } });
const rest = () => Array.from({ length: 7 }, (_, i) => ({ kind: 'mc', world: 'round', label: 'Rounding Road', prompt: `Starter ${i}`, options: ['yes', 'no', 'maybe'], answer: 0, explain: 'A starting question.' }));
const open = (q = roundQ()) => appOeffnen(browser, server.url, { fixture: { world: q.world, round: [q, ...rest()] }, reducedMotion: 'reduce' });
const data = (p, k) => p.evaluate((k) => JSON.parse(localStorage.getItem('bq2_' + k) || 'null'), k);
const morgen = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

test('show me before any try: no evidence, logged as beforeTry, review tomorrow, bridge follows, round stays 8', async () => {
  const { ctx, page, fehler } = await open();
  await page.locator('#helpBtn').click();
  assert.equal(await data(page, 'ev'), null, 'no evidence at all');
  const log = await data(page, 'attempts');
  assert.equal(log.length, 1);
  assert.deepEqual([log[0].attempt, log[0].solutionShown, log[0].beforeTry, log[0].help], [0, true, true, true]);
  const due = await data(page, 'due');
  assert.equal(due.length, 1); assert.equal(due[0].box, 0); assert.equal(due[0].at, morgen());
  const s = await zustand(page);
  assert.deepEqual(s.round.slice(1, 4).map((q) => q.bridgePart), ['practice', 'practice', 'return']);
  assert.equal(s.round.length, 8);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('show me before any try is neutral for the child: no star, no red dot, no "Not quite", streak unchanged', async () => {
  const { ctx, page } = await open();
  await page.locator('#helpBtn').click();
  assert.equal(await page.textContent('#roundStars'), '0');
  assert.equal(await page.locator('#dots .dot.bad').count() + await page.locator('.dot.bad').count(), 0);
  assert.equal(await page.locator('.dot.seen').count(), 1);
  assert.ok(await page.isVisible('#feedback.hint'));
  assert.equal(await page.locator('#feedback.bad').count(), 0);
  const text = await page.textContent('#feedback');
  assert.ok(text.includes('Let’s look at it together'), text.slice(0, 80));
  assert.ok(!/Not quite|wrong|Requires|Consolidating|Meeting|Extending|%/.test(text));
  assert.ok(await page.isVisible('#nextBtn'));
  assert.equal((await zustand(page)).streak, 0);
  await ctx.close();
});

test('show me before trying leaves existing evidence (and so the internal stand) untouched', async () => {
  const { ctx, page } = await open();
  const ev = { round: Array.from({ length: 12 }, (_, i) => ['2026-10-' + (20 + (i % 4)), 2, 1]) };
  await page.evaluate((e) => localStorage.setItem('bq2_ev', JSON.stringify(e)), ev);
  await page.locator('#helpBtn').click();
  assert.deepEqual(await data(page, 'ev'), ev, 'evidence untouched');
  await ctx.close();
});

test('help after a mistake is unchanged: the first wrong answer counts, red dot, not beforeTry', async () => {
  const { ctx, page } = await open();
  await page.locator('#qAnswers .opt[data-i="0"]').click();
  await page.locator('#helpBtn').click();
  const ev = (await data(page, 'ev')).round;
  assert.equal(ev.length, 1); assert.equal(ev[0][2], 0);
  const log = await data(page, 'attempts');
  assert.notEqual(log[log.length - 1].beforeTry, true);
  assert.equal(await page.locator('.dot.bad').count(), 1);
  assert.ok(await page.isVisible('#feedback.bad'));
  await ctx.close();
});

test('wrong first answer still records exactly one error with its level', async () => {
  const { ctx, page } = await open();
  await page.locator('#qAnswers .opt[data-i="0"]').click();
  assert.deepEqual((await data(page, 'ev')).round.map((e) => [e[1], e[2]]), [[2, 0]]);
  await ctx.close();
});
