// School ratings (Peter, 01.11.): overview in the grown-ups area, the school line at each quest, and the
// ratings as the starting point for choosing tasks while there is too little own practice. Real clicks.
//   node --test tests/schule.test.mjs

import { test, before, after } from 'node:test';
import { appLesen } from '../werkzeug/module.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { WURZEL, QUELLEN } from '../werkzeug/bauen.mjs';
import { kontenEinsetzen, pbkdf2Hex, normCode, ausV1 } from '../werkzeug/konten.mjs';
import { schuleEinsetzen, schuleLesen } from '../werkzeug/schule.mjs';
import { browserStarten, zustand } from './app-hilfen.mjs';

const CODES = { kathie: 'KATH-2345', lia: 'LIAA-2345', papa: 'PAPA-2345' };
const konto = async (user, role, x = {}) => { const salt = Array.from({ length: 16 }, (_, i) => i + user.length); return { user, role, ...x, start: { salt, hash: await pbkdf2Hex(normCode(CODES[user]), salt) } }; };
const KONTEN = { users: [await konto('kathie', 'student'), await konto('lia', 'student'), await konto('papa', 'parent', { kinder: ['kathie', 'lia'] })] };
// school data come from werkzeug/schuldaten.json and are assigned by the ID of the account "kathie" (S11 P2)
const K2 = ausV1(KONTEN);
const app = schuleEinsetzen(kontenEinsetzen(await appLesen(), K2), await schuleLesen(), K2);
let browser, server;
before(async () => {
  browser = await browserStarten();
  server = http.createServer((q, r) => { if (q.url.split('?')[0] !== '/') { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end(app); });
  await new Promise((r) => server.listen(0, '127.0.0.1', r)); server.url = `http://127.0.0.1:${server.address().port}/`;
});
after(async () => { await browser?.close(); server?.close(); });

async function oeffnen() {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  await ctx.route('**/*', (r) => (r.request().url().startsWith(server.url) ? r.continue() : r.abort()));
  await ctx.addInitScript(() => { window.claude = { hot: { snapshot(fn) { try { window.__bq = JSON.parse(JSON.stringify(fn())); } catch (e) {} } } }; window.AudioContext = undefined; });
  const page = await ctx.newPage(); const fehler = []; page.on('pageerror', (e) => fehler.push(e.message));
  await page.goto(server.url); await page.waitForSelector('#roleStudent');
  return { ctx, page, fehler };
}
async function login(page, rolle, user, pw) {
  if (await page.locator('#roleStudent').isVisible().catch(() => false)) await page.locator(rolle === 'student' ? '#roleStudent' : '#roleAdult').click();
  await page.locator('#loginUser').fill(user); await page.locator('#loginPw').fill(CODES[user]); await page.locator('#loginGo').click();
  await page.locator('#newPw1').fill(pw); await page.locator('#newPw2').fill(pw); await page.locator('#setPwGo').click();
  await page.locator('#welcomeGo').click();
}
async function quest(page, name) {
  const n = await page.$$eval('#subjects button.subject', (b) => b.length);
  for (let i = 0; i < n; i++) {
    await page.locator('#subjects button.subject').nth(i).click();
    const k = page.locator('#subjectBody button.world', { hasText: name });
    if (await k.count()) { await k.first().click(); await page.waitForSelector('#play:not([hidden])'); return zustand(page); }
    await page.locator('#subjectBack').click();
  }
  throw new Error('quest not found ' + name);
}

test('overview of the school ratings in the grown-ups area: standards, history, assignments, awaiting evaluation', async () => {
  const { ctx, page, fehler } = await oeffnen();
  await login(page, 'student', 'kathie', 'Tiger-Lamp-River-4271');
  await page.locator('#adultBtn').click(); await login(page, 'adult', 'papa', 'langes-passwort');
  await page.waitForSelector('#parentClose');
  await page.locator('details.psec[data-psec="school"] > summary').click();
  const t = await page.locator('details.psec[data-psec="school"]').innerText();
  assert.match(t, /Rundung|Runden auf Zehner/);
  assert.match(t, /Runden auf Zehner, Hunderter und Tausender\s+Sicher \(Meeting expectations\) 27\.10\.2026\s+vorher: Wird sicherer \(03\.10\.2026\)/);
  assert.match(t, /Stellenwert[^\n]*\s+Wird sicherer/);
  for (const w of ['Mastering Basic Numbers and Calculations – Milestone', 'Persuade for the Park!', 'Friction Frenzy', 'Lesson 4', 'Wartet auf Bewertung', 'Glows and Grows', 'ES = mit Unterstützung']) assert.ok(t.includes(w), w);
  assert.ok(!/Toddle|BIS\b|3B/.test(t), 'neutral wording');
  // rubric: the teacher's rating and the child's own rating side by side (Peter 01.11.)
  await page.locator('details.psec[data-psec="school"] details.about-sec', { hasText: 'Milestone' }).locator('summary').click();
  const ms = await page.locator('details.psec[data-psec="school"] details.about-sec', { hasText: 'Milestone' }).innerText();
  assert.match(ms, /Sticker combinations: Lehrkraft Wird sicherer \(Consolidating\) · selbst eingeschätzt Darüber hinaus \(Extending\)/);
  assert.match(t, /Alle Einstufungen hier sind die der Lehrkraft/);
  assert.match(ms, /Daraus im automatischen Fokus: Word Problems/);
  // the school line at the quest
  await page.locator('[data-psubj="maths"]').click();
  const round = await page.locator('.pquest', { has: page.locator('[data-pfocus="round"]') }).innerText();
  assert.match(round, /🏫 Schule: Sicher \(Meeting expectations\) 27\.10\.2026/);
  // automatic focus = the teacher's next steps (Peter 01.11.): word problems yes, data detective no
  assert.equal(await page.getAttribute('[data-pfocus="wordprob"]', 'aria-pressed'), 'true');
  assert.equal(await page.getAttribute('[data-pfocus="detective"]', 'aria-pressed'), 'false');
  assert.match(round, /nächster Schritt laut Schule/);
  // English
  await page.locator('.phdr [data-plang="en"]').click();
  assert.match(await page.locator('.pquest', { has: page.locator('[data-pfocus="round"]') }).innerText(), /🏫 School: Secure/);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('the school rating is the starting point for the task mix while there is too little own practice', async () => {
  const { ctx, page } = await oeffnen();
  await login(page, 'student', 'kathie', 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  // rounding: school "secure" (M) -> 2 to 3 challenge tasks; number combinations: "consolidating" (C) -> at most 1
  for (let r = 0; r < 3; r++) {
    const s = await quest(page, 'Rounding Road');
    const l3 = s.round.filter((q) => q.level === 3).length;
    assert.ok(l3 >= 2 && l3 <= 3, 'rounding challenge tasks: ' + l3);
    await page.locator('#quitBtn').click(); await page.waitForSelector('#home:not([hidden]), #subject:not([hidden])');
    if (await page.locator('#subjectBack').isVisible()) await page.locator('#subjectBack').click();
    const c = await quest(page, 'Number Combinations');
    assert.ok(c.round.filter((q) => q.level === 3).length <= 1, 'combos: at most one challenge');
    await page.locator('#quitBtn').click(); await page.waitForSelector('#home:not([hidden]), #subject:not([hidden])');
    if (await page.locator('#subjectBack').isVisible()) await page.locator('#subjectBack').click();
  }
  await ctx.close();
});

test('another child has no school ratings: overview says so, no starting point', async () => {
  const { ctx, page, fehler } = await oeffnen();
  await login(page, 'student', 'lia', 'Owl-Cake-Moon-1357');
  await page.locator('#adultBtn').click(); await login(page, 'adult', 'papa', 'langes-passwort');
  await page.waitForSelector('#parentClose');
  await page.locator('details.psec[data-psec="school"] > summary').click();
  assert.match(await page.locator('details.psec[data-psec="school"]').innerText(), /noch keine Einstufungen/);
  await page.locator('[data-psubj="maths"]').click();
  assert.equal(await page.locator('.pquest', { hasText: '🏫 Schule' }).count(), 0);
  assert.deepEqual(fehler, []);
  await ctx.close();
});
