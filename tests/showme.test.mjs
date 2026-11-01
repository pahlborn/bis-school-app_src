// Help in two steps (Peter, 01.11.): first "Show me how" (a short tip, not the answer); if that does
// not help, "Show me the answer" appears next to it (the tip button stays). A success after the tip
// counts as with help; the answer counts as not passed and comes back. Real clicks.
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
const vorkommen = (text, teil) => text.split(teil).length - 1;

test('"Show me how" gives a short tip, not the answer: no evidence, no review, the child can still answer', async () => {
  const { ctx, page, fehler } = await open();
  assert.ok(await page.isVisible('#helpBtn'));
  assert.equal(await page.isVisible('#answerBtn'), false, 'first the tip, the answer only afterwards');
  await page.locator('#helpBtn').click();
  const text = await page.textContent('#feedback');
  assert.match(text, /Here’s a way to do it/);
  assert.match(text, /halfway point is 450/, 'the tip of the school’s model');
  assert.ok(!text.includes('Answer:') && !text.includes('470 is 70 from 400'), 'no answer given away');
  assert.ok(await page.isVisible('#feedback.hint'));
  assert.equal(await data(page, 'ev'), null, 'no evidence yet');
  assert.equal(await data(page, 'due'), null, 'no review yet');
  assert.ok(await page.locator('#qAnswers .opt[data-i="1"]').isEnabled(), 'answers still open');
  assert.ok(await page.isVisible('#helpBtn'), '"Show me how" stays');
  assert.equal(await page.textContent('#helpBtn'), 'Show me how');
  assert.ok(await page.isVisible('#answerBtn'), 'now the answer can be asked for');
  assert.equal(await page.textContent('#answerBtn'), 'Show me the answer');
  assert.equal(await page.isVisible('#nextBtn'), false);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('right answer after the tip: star, counted as "with help" (support level), not independent', async () => {
  const { ctx, page } = await open();
  await page.locator('#helpBtn').click();
  await page.locator('#qAnswers .opt[data-i="1"]').click();
  assert.equal(await page.textContent('#roundStars'), '1');
  assert.deepEqual((await data(page, 'ev')).round.map((e) => [e[1], e[2]]), [[1, 1]], 'support level, solved');
  const log = (await data(page, 'attempts')).filter((a) => !a.hintShown);
  assert.deepEqual([log[0].attempt, log[0].ok, log[0].help], [1, true, true]);
  await ctx.close();
});

test('wrong answer after the tip: no second tip, the explained answer once, review and bridge', async () => {
  const { ctx, page } = await open();
  await page.locator('#helpBtn').click();
  await page.locator('#qAnswers .opt[data-i="0"]').click();
  const text = await page.textContent('#feedback');
  assert.match(text, /Not quite\./);
  assert.equal(vorkommen(text, '470 is 70 from 400'), 1, 'explanation only once');
  assert.match(text, /Answer: 500/);
  assert.deepEqual((await data(page, 'ev')).round.map((e) => [e[1], e[2]]), [[1, 0]]);
  assert.equal((await data(page, 'due')).length, 1);
  assert.deepEqual((await zustand(page)).round.slice(1, 4).map((q) => q.bridgePart), ['practice', 'practice', 'return']);
  await ctx.close();
});

test('"Show me the answer" after the tip: solution once, not passed (yellow, no "Not quite"), review tomorrow, bridge', async () => {
  const { ctx, page, fehler } = await open();
  await page.locator('#helpBtn').click();
  await page.locator('#answerBtn').click();
  const text = await page.textContent('#feedback');
  assert.match(text, /Here’s the answer/);
  assert.ok(!/Not quite|wrong|Requires|Consolidating|Meeting|Extending|%/.test(text));
  assert.equal(vorkommen(text, '470 is 70 from 400'), 1, 'explanation only once');
  assert.equal(vorkommen(text, 'Answer: 500'), 1);
  assert.equal(await page.locator('.dot.seen').count(), 1);
  assert.equal(await page.locator('.dot.bad').count(), 0);
  assert.equal(await page.textContent('#roundStars'), '0');
  assert.deepEqual((await data(page, 'ev')).round.map((e) => [e[1], e[2]]), [[1, 0]], 'not passed, at support level');
  const due = await data(page, 'due');
  assert.equal(due.length, 1); assert.equal(due[0].at, morgen());
  const s = await zustand(page);
  assert.deepEqual(s.round.slice(1, 4).map((q) => q.bridgePart), ['practice', 'practice', 'return']);
  assert.equal(s.round.length, 8);
  assert.ok(await page.isVisible('#nextBtn'));
  assert.equal(await page.isVisible('#helpBtn'), false);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('the tip alone leaves existing evidence untouched', async () => {
  const { ctx, page } = await open();
  const ev = { round: Array.from({ length: 12 }, (_, i) => ['2026-10-' + (20 + (i % 4)), 2, 1]) };
  await page.evaluate((e) => localStorage.setItem('bq2_ev', JSON.stringify(e)), ev);
  await page.locator('#helpBtn').click();
  assert.deepEqual(await data(page, 'ev'), ev, 'evidence untouched');
  await ctx.close();
});

test('after a first mistake the tip comes by itself; the button then offers the answer: red dot, first error counts', async () => {
  const { ctx, page } = await open();
  await page.locator('#qAnswers .opt[data-i="0"]').click();
  assert.match(await page.textContent('#feedback'), /Try one more time/);
  assert.ok(await page.isVisible('#helpBtn'), '"Show me how" stays');
  assert.ok(await page.isVisible('#answerBtn'));
  await page.locator('#answerBtn').click();
  const ev = (await data(page, 'ev')).round;
  assert.equal(ev.length, 1); assert.equal(ev[0][2], 0);
  const log = await data(page, 'attempts');
  assert.notEqual(log[log.length - 1].beforeTry, true);
  assert.equal(await page.locator('.dot.bad').count(), 1);
  assert.ok(await page.isVisible('#feedback.bad'));
  assert.equal(vorkommen(await page.textContent('#feedback'), '470 is 70 from 400'), 1, 'explanation only once');
  await ctx.close();
});

test('wrong first answer still records exactly one error with its level', async () => {
  const { ctx, page } = await open();
  await page.locator('#qAnswers .opt[data-i="0"]').click();
  assert.deepEqual((await data(page, 'ev')).round.map((e) => [e[1], e[2]]), [[2, 0]]);
  await ctx.close();
});

test('German quest: "Zeig mir, wie" and "Zeig mir die Lösung"', async () => {
  const q = { kind: 'mc', world: 'anleitung', label: 'Anleitung', level: 2, prompt: 'Welcher Satz ist richtig?', options: ['Dann schneidet man das Papier.', 'Dann schneidet man das Papier aus.', 'Dann man schneidet aus.'], answer: 1, explain: 'Die Vorsilbe steht am Satzende.' };
  const { ctx, page } = await open(q);
  assert.equal(await page.textContent('#helpBtn'), 'Zeig mir, wie');
  assert.equal(await page.isVisible('#answerBtn'), false);
  await page.locator('#helpBtn').click();
  assert.match(await page.textContent('#feedback'), /So kannst du vorgehen/);
  assert.equal(await page.textContent('#answerBtn'), 'Zeig mir die Lösung');
  await page.locator('#answerBtn').click();
  assert.match(await page.textContent('#feedback'), /Das ist die Lösung.*Lösung: Dann schneidet man das Papier aus\./s);
  await ctx.close();
});
