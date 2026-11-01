// Ausblick (01.11.): Mathe-Themen fuer spaeter (Einmaleins, Brueche, Flaeche/Umfang, Zeitspannen,
// Gewicht/Rauminhalt). Fuer das Kind unsichtbar, bis Erwachsene sie je Kind freigeben – nur an einer
// Stelle (Elternbereich, Maths, "Ausblick"). Gesperrt: nicht im Fokus, nicht im Mix, nicht auf Blaettern.
//   node --test tests/ausblick.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { WURZEL, QUELLEN } from '../werkzeug/bauen.mjs';
import { browserStarten, appOeffnen, elternOeffnen, zurStart, klick } from './app-hilfen.mjs';

const VORSCHAU = ['times', 'fractions', 'area', 'elapsed', 'mass'];
const NAMEN = ['Times Tables', 'Fractions', 'Area & Perimeter', 'Time Passes', 'Mass & Capacity'];

async function appServer() {
  const html = (await fs.readFile(path.join(WURZEL, QUELLEN.app), 'utf8'))
    .replace(/\}\)\(\);\s*<\/script>/, 'window.__bqi={WORLDS,focusTopics,strip,guidance};})();</script>');
  if (!html.includes('window.__bqi=')) throw new Error('test hook not inserted');
  const server = http.createServer((req, res) => {
    if (req.url.split('?')[0] !== '/') { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  server.url = `http://127.0.0.1:${server.address().port}/`;
  return server;
}

let browser, server;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

const mathsKarten = async (page) => {
  await zurStart(page);
  await page.evaluate(() => [...document.querySelectorAll('#subjects button.subject')].find((b) => b.textContent.includes('Maths')).click());
  return page.$$eval('#subjectBody button.world .name', (n) => n.map((x) => x.textContent));
};

test('Ausblick: fuer das Kind unsichtbar, nicht im Fokus und nicht im Mix, solange nicht freigegeben', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  const karten = await mathsKarten(page);
  assert.deepEqual(NAMEN.filter((n) => karten.includes(n)), [], 'no preview quest on the child page');
  const r = await page.evaluate((V) => {
    const B = window.__bqi, mix = new Set();
    for (let i = 0; i < 40; i++) B.WORLDS.mix_maths.build().forEach((q) => mix.add(q.world));
    return { focus: B.focusTopics().filter((k) => V.includes(k)), mix: V.filter((k) => mix.has(k)) };
  }, VORSCHAU);
  assert.deepEqual(r, { focus: [], mix: [] });
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Ausblick: Erwachsene geben ein Thema frei – es erscheint fuer das Kind, nur dieses; wieder sperren geht', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  await elternOeffnen(page);
  await page.locator('[data-psubj="maths"]').click();
  const block = page.locator('.ppreview');
  await block.waitFor();
  assert.equal(await block.locator('[data-punlock]').count(), 5);
  assert.deepEqual(await block.locator('[data-punlock]').evaluateAll((b) => b.map((x) => x.getAttribute('aria-pressed'))), ['false', 'false', 'false', 'false', 'false']);
  await block.locator('[data-punlock="fractions"]').click();
  assert.equal(await page.locator('.ppreview [data-punlock="fractions"]').getAttribute('aria-pressed'), 'true');
  // only one place to switch it: no focus switch for a locked quest, one for the unlocked one
  assert.equal(await page.locator('[data-pfocus="times"]').count(), 0);
  assert.equal(await page.locator('[data-pfocus="fractions"]').count(), 1);
  await page.reload();
  await page.waitForSelector('#home');
  let karten = await mathsKarten(page);
  assert.ok(karten.includes('Fractions'), 'unlocked quest visible');
  assert.deepEqual(NAMEN.filter((n) => n !== 'Fractions' && karten.includes(n)), []);
  // play it: 8 questions
  await page.evaluate(() => [...document.querySelectorAll('#subjectBody button.world')].find((b) => b.textContent.includes('Fractions')).click());
  await page.waitForSelector('#play:not([hidden])');
  assert.equal((await page.evaluate(() => window.__bq.round.length)), 8);
  assert.ok((await page.evaluate(() => window.__bq.round.every((q) => q.world === 'fractions'))));
  // lock again
  await zurStart(page);
  await elternOeffnen(page);
  await page.locator('[data-psubj="maths"]').click();
  await page.locator('.ppreview [data-punlock="fractions"]').click();
  await page.reload();
  await page.waitForSelector('#home');
  karten = await mathsKarten(page);
  assert.ok(!karten.includes('Fractions'));
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Ausblick: alle Aufgaben rechnerisch richtig, mit eigenem Tipp', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  const probleme = await page.evaluate((V) => {
    const B = window.__bqi, out = [], ans = (q) => (q.kind === 'mc' ? B.strip(q.options[q.answer]) : String(q.answer));
    for (const k of V) for (let i = 0; i < 60; i++) for (const q of B.WORLDS[k].build()) {
      const p = B.strip(q.prompt), bad = (m) => out.push(k + ': ' + m + ' | ' + p + ' -> ' + ans(q));
      if (q.kind === 'mc' && (new Set(q.options).size !== q.options.length || q.options.length < 2 || q.answer < 0)) bad('options');
      if (q.kind === 'type' && !/^\d{1,4}$/.test(q.answer)) bad('typed');
      if (!q.tip || B.guidance(q, null, false).text !== q.tip) bad('no own tip');
      let m;
      if ((m = p.match(/^There are (\d+) \w+ with (\d+)/)) && +q.answer !== m[1] * m[2]) bad('groups');
      if ((m = p.match(/^(\d+) × (\d+) = \?/)) && +q.answer !== m[1] * m[2]) bad('fact');
      if (/fits the dots/.test(p)) { const n = (q.visual.match(/<circle/g) || []).length, [a, b] = ans(q).split(' × ').map(Number); if (a * b !== n) bad('array'); }
      if (/fraction of the bar/.test(p)) { const all = (q.visual.match(/<rect/g) || []).length, col = (q.visual.match(/fill="var\(--world\)"/g) || []).length; if (ans(q) !== col + '/' + all) bad('shaded'); }
      if ((m = p.match(/^What is (half|one third|one quarter) of (\d+)/)) && +q.answer * { half: 2, 'one third': 3, 'one quarter': 4 }[m[1]] !== +m[2]) bad('of set');
      if ((m = p.match(/^Which is bigger: 1\/(\d+) or 1\/(\d+)/)) && ans(q) !== '1/' + Math.min(m[1], m[2])) bad('compare');
      if (/area/.test(p) && /squares cover/.test(p) && +q.answer !== (q.visual.match(/<rect/g) || []).length) bad('area');
      if (/^How far is it all the way around the rectangle/.test(p)) { const [w, h] = [...q.visual.matchAll(/>(\d+) cm</g)].map((x) => +x[1]); if (+q.answer !== 2 * (w + h)) bad('perimeter'); }
      if ((m = p.match(/^How many minutes from (\d+):(\d+) to (\d+):(\d+)/)) && +q.answer !== (m[3] * 60 + +m[4]) - (m[1] * 60 + +m[2])) bad('elapsed');
      if ((m = p.match(/^It is (\d+):(\d+)\. What time is it (\d+) minutes later/))) { const t = +m[1] * 60 + +m[2] + +m[3], h = (Math.floor(t / 60) - 1) % 12 + 1, mm = String(t % 60).padStart(2, '0'); if (ans(q) !== h + ':' + mm) bad('later'); }
      if ((m = p.match(/^(\d) kg = how many g/)) && +q.answer !== m[1] * 1000) bad('kg');
      if (/kitchen scale/.test(p) && (parseInt(ans(q), 10) / 100) % 2 !== 1) bad('scale');
    }
    return out.slice(0, 10);
  }, VORSCHAU);
  assert.deepEqual(probleme, []);
  assert.deepEqual(fehler, []);
  await ctx.close();
});
