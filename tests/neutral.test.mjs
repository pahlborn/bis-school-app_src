// S8 (30.10.): no class, school, teacher names or home/school places anywhere in the app.
//   node --test tests/neutral.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { WURZEL, QUELLEN } from '../werkzeug/bauen.mjs';
import { browserStarten, appOeffnen, elternOeffnen, elternSeite, zustand } from './app-hilfen.mjs';

// The app runs in a closed function. For these tests only, the served copy exposes a few
// internals at the very end of that function; the app file itself is not changed.
async function appServer() {
  const html = (await fs.readFile(path.join(WURZEL, QUELLEN.app), 'utf8'))
    .replace(/\}\)\(\);\s*<\/script>/, 'window.__bqi={WORLDS,isPrivate,neutralQ,dueToday};})();</script>');
  if (!html.includes('window.__bqi=')) throw new Error('test hook not inserted');
  const server = http.createServer((req, res) => {
    if (req.url.split('?')[0] !== '/') { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  server.url = `http://127.0.0.1:${server.address().port}/`;
  return server;
}

// Patterns that must never be visible. BIS is checked case-sensitively (German "bis" is fine).
const MUSTER = [/\b3B\b/, /Grade 3B/i, /Bavaria/i, /\bBIS\b/, /International School/i, /Zeckser/i, /Bhan/i, /Schl(?:ü|u)er/i,
  /Haimhausen/i, /Munich/i, /Toddle/i, /Legoland/i, /bis-school\.com/i, /our school is in/i, /we live in/i];
const treffer = (text) => MUSTER.filter((m) => m.test(text)).map(String);

const quelltext = await fs.readFile(path.join(WURZEL, QUELLEN.app), 'utf8');

let browser, server;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

test('source: every question pool, text and archived quest is free of class, school, teacher and place names', () => {
  const ohne = quelltext
    .replace(/\/\*[\s\S]*?\*\//g, '')                       // code comments (never visible)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/const PRIVATE_RE=.*\r?\n/, '')                  // the detector itself
    .replace(/const LEGACY_TEXT=\[[\s\S]*?\n\];/, '')         // rewrite table for old stored copies
    .replace(/const SCHOOL_SOURCES=\[[\s\S]*?\n\];/, '')      // adult-only links (URLs only, neutral labels)
    .replace(/https:\/\/pahlborn\.github\.io\/bis-school-app\//g, ''); // public address (Peter decides)
  const zeilen = ohne.split('\n').map((z, i) => [i, z]).filter(([, z]) => treffer(z).length);
  assert.deepEqual(zeilen.map(([, z]) => z.trim().slice(0, 120)), []);
});

test('generated questions of every quest (50 builds each, incl. archived) contain no private names', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  const funde = await page.evaluate(() => {
    const { WORLDS, isPrivate } = window.__bqi, out = [];
    for (const k of Object.keys(WORLDS)) {
      if (!WORLDS[k].build) continue;
      for (let i = 0; i < 50; i++) WORLDS[k].build().forEach((q) => { if (isPrivate(q)) out.push(k + ': ' + JSON.stringify(q).slice(0, 100)); });
    }
    return out;
  });
  assert.deepEqual(funde, []);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('title, eyebrow and home screen are neutral; eyebrow fully visible on a 320 px phone', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url, { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  assert.equal(await page.title(), 'Grade 3 – Big Quest');
  assert.equal(await page.textContent('#home h1'), 'Grade 3 – Big Quest');
  // On small phones the eyebrow uses the short form "IB" (S8 fallback for lack of space)
  const sichtbarerText = (p) => p.$eval('#home .hero .eyebrow', (e) => [...e.childNodes].filter((n) => n.nodeType === 3 || getComputedStyle(n).display !== 'none').map((n) => n.textContent).join(''));
  assert.equal(await sichtbarerText(page), 'Grade 3 · IB Primary Years Programme');
  await page.setViewportSize({ width: 1366, height: 768 });
  assert.equal(await sichtbarerText(page), 'Grade 3 · International Baccalaureate Primary Years Programme');
  await page.setViewportSize({ width: 320, height: 568 });
  assert.equal(await page.getAttribute('meta[name="apple-mobile-web-app-title"]', 'content'), 'Big Quest');
  const eb = await page.$eval('#home .hero .eyebrow', (e) => ({ sw: e.scrollWidth, cw: e.clientWidth, to: getComputedStyle(e).textOverflow }));
  assert.ok(eb.sw <= eb.cw && eb.to !== 'ellipsis', JSON.stringify(eb));
  assert.deepEqual(treffer(await page.evaluate(() => document.body.innerText)), []);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('About (DE/EN) names no school, class or place and links no school website; adults see 4 neutral school links', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  await page.locator('#aboutBtn').click();
  // overview and every sub-page of the About menu, German and English
  for (const tab of ['#tabDe', '#tabEn']) {
    await page.locator(tab).click();
    const n = await page.locator('#aboutBody .about-item').count();
    assert.ok(n >= 7, 'menu items: ' + n);
    const seiten = [await page.textContent('#aboutBody')];
    for (let i = 0; i < n; i++) {
      await page.locator('#aboutBody .about-item').nth(i).click();
      seiten.push(await page.textContent('#aboutBody'));
      assert.equal(await page.locator('#aboutBody a[href*="bis-school.com"]').count(), 0);
      await page.locator('#aboutUp').click();
    }
    for (const s of seiten) {
      assert.deepEqual(treffer(s), []);
      assert.ok(!/Requires support|Consolidating|Meeting expectations|Extending/.test(s), 'child-reachable About must not list the internal levels');
    }
  }
  await page.locator('#aboutBack').click();
  await elternOeffnen(page);
  await elternSeite(page, 'help');
  const links = page.locator('#aboutBody a[href*="bis-school.com"]');
  assert.equal(await links.count(), 4);
  for (const t of await links.allTextContents()) { assert.match(t, /^Website der Schule/); assert.deepEqual(treffer(t), []); }
  assert.deepEqual(treffer(await page.textContent('#aboutBody')), []);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

const ALT_861 = { kind: 'mc', prompt: '3B looked up force words with Ms. Zeckser using books, Britannica and…', options: ['telescopes', 'iPads', 'microwaves', 'typewriters'], answer: 1, explain: 'Books, iPads and Britannica.', label: 'Library Research', world: 'library', dueId: 'alt-861' };
const ALT_BHAN = { kind: 'mc', prompt: 'Which word MUST have a capital letter, even in the middle of a sentence?', visual: '<div class="quote">my teacher is ms. bhan.</div>', options: ['bhan', 'teacher', 'is', 'my'], answer: 0, explain: '‘Bhan’ is a name.', label: 'Capital Letters & Full Stops', world: 'sentences', dueId: 'alt-cap', grid: true };
const gestern = () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); };

test('old stored reviews are shown with neutral text, keep their id, and storage stays byte-identical', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  const due = [{ id: 'alt-861', box: 0, at: gestern(), q: ALT_861 }, { id: 'alt-cap', box: 1, at: gestern(), q: ALT_BHAN }];
  await page.evaluate((d) => localStorage.setItem('bq2_due', JSON.stringify(d)), due);
  const vorher = await page.evaluate(() => localStorage.getItem('bq2_due'));
  const heute = await page.evaluate(() => window.__bqi.dueToday());
  const a = heute.find((q) => q.dueId === 'alt-861'), b = heute.find((q) => q.dueId === 'alt-cap');
  assert.ok(a && b, 'both reviews are still due');
  assert.equal(a.prompt, 'Your class looked up force words using books, Britannica and…');
  assert.equal(a.options[a.answer], 'iPads', 'learning goal and right answer stay');
  assert.equal(b.world, 'sentences'); assert.equal(b.kind, 'mc');
  assert.deepEqual(heute.filter((q) => treffer(JSON.stringify(q)).length).map((q) => JSON.stringify(q).slice(0, 300)), []);
  // real click: Practise Today puts the rewritten review into the round
  await page.locator('#todayBtn').click();
  const runde = (await zustand(page)).round;
  assert.deepEqual(treffer(JSON.stringify(runde)), []);
  assert.ok(runde.some((q) => q.dueId === 'alt-861'));
  assert.equal(await page.evaluate(() => localStorage.getItem('bq2_due')), vorher, 'stored copies are never rewritten');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('old practice sheets and pending bridges are shown without private names', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  await page.evaluate((q) => {
    localStorage.setItem('bq2_sheets', JSON.stringify([{ id: 'alt', day: '2026-10-28', items: [{ q, res: null }], writing: 'en' }]));
    localStorage.setItem('bq2_bridgeNext', JSON.stringify([q]));
  }, ALT_861);
  await elternOeffnen(page);
  await elternSeite(page, 'sheets');
  const text = await page.textContent('#aboutBody');
  assert.ok(text.includes('Your class looked up force words'), 'old sheet prompt rewritten');
  assert.deepEqual(treffer(text), []);
  await page.locator('#aboutBack').click();
  await page.locator('#todayBtn').click();
  assert.deepEqual(treffer(JSON.stringify((await zustand(page)).round)), []);
  assert.deepEqual(fehler, []);
  await ctx.close();
});
