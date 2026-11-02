// Neue Themen aus den Standards der Schule (01.11.): Runden auf 1.000, erweiterte Schreibweise mit
// der 0 als Platzhalter, Skalen in 2er-, 5er- und 10er-Schritten, Liniendiagramme, Subtraktion bis
// 9.999 in zwei Schritten und Pruefen mit dem Taschenrechner.
//   node --test tests/themen.test.mjs

import { test, before, after } from 'node:test';
import { appLesen } from '../werkzeug/module.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { WURZEL, QUELLEN } from '../werkzeug/bauen.mjs';
import { browserStarten, appOeffnen } from './app-hilfen.mjs';

// Test hook as in neutral.test.mjs: the served copy exposes a few internals; the app file is unchanged.
async function appServer() {
  const html = (await appLesen('utf8'))
    .replace(/\}\)\(\);\s*<\/script>/, 'window.__bqi={WORLDS,roundThousandQ,expandedZeroQ,scaleStepQ,lineGraphQ,subtract4Q,calcCheckQ,guidance,exampleFor,bridgeFor,strip};})();</script>');
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

const N = 200;

test('neue Themen: jede erzeugte Aufgabe ist rechnerisch richtig und eindeutig', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  const probleme = await page.evaluate((N) => {
    const B = window.__bqi, out = [], num = (t) => Number(String(t).replace(/[^\d]/g, ''));
    const ans = (q) => (q.kind === 'mc' ? B.strip(q.options[q.answer]) : String(q.answer));
    const sum = (t) => t.split(' + ').reduce((a, b) => a + num(b), 0);
    const check = (name, q, ok, info) => { if (!ok) out.push(name + ': ' + info + ' | ' + B.strip(q.prompt)); };
    const basics = (name, q) => {
      if (q.kind === 'mc') {
        check(name, q, new Set(q.options).size === q.options.length && q.options.length >= 2, 'options ' + q.options.join(' / '));
        check(name, q, q.answer >= 0 && q.answer < q.options.length, 'answer index');
      } else check(name, q, /^\d{1,4}$/.test(q.answer), 'typed answer ' + q.answer);
    };
    for (let i = 0; i < N; i++) {
      let q = B.roundThousandQ(); basics('thousand', q);
      const n = num(B.strip(q.prompt).match(/Round ([\d,]+)/)[1]);
      check('thousand', q, num(ans(q)) === Math.round(n / 1000) * 1000 && n % 500 !== 0, 'n=' + n + ' answer=' + ans(q));
      check('thousand', q, /halfway point is [\d,]+500/.test(B.guidance(q, null, false).text), 'tip without halfway point');

      q = B.expandedZeroQ(); basics('expanded', q);
      if (q.kind === 'mc') {
        const n2 = num(B.strip(q.prompt).match(/Which shows ([\d,]+)/)[1]);
        check('expanded', q, sum(ans(q)) === n2, 'right option does not add up');
        check('expanded', q, q.options.filter((o, j) => j !== q.answer).every((o) => sum(B.strip(o)) !== n2), 'a wrong option is also right');
        check('expanded', q, /0/.test(String(n2).slice(1, 3)), 'no zero placeholder in ' + n2);
      } else {
        const t = B.strip(q.prompt).match(/What number is ([\d,+ ]+)\?/)[1];
        check('expanded', q, Number(q.answer) === sum(t), 'typed sum');
        check('expanded', q, /0/.test(String(q.answer).slice(1, 3)), 'no zero placeholder in ' + q.answer);
      }

      q = B.scaleStepQ(); basics('scale', q);
      const step = Number(q.explain.match(/each step is (\d+)/)[1]), mark = Number(ans(q));
      check('scale', q, [2, 5, 10].includes(step) && mark % step === 0 && (mark / step) % 2 === 1, 'mark ' + mark + ' step ' + step);
      check('scale', q, (q.visual.match(/<text/g) || []).length === 6, 'only every second mark labelled');

      q = B.lineGraphQ(); basics('line', q);
      const pts = [...q.visual.matchAll(/<circle cx="[\d.]+" cy="([\d.]+)"/g)].map((m) => Number(m[1]));
      const days = [...q.visual.matchAll(/font-weight="600"[^>]*>([A-Z][a-z]{2})</g)].map((m) => m[1]);
      const val = (cy) => Math.round((260 - cy) / 210 * 30);
      const vals = pts.map(val);
      const p = B.strip(q.prompt);
      if (/warmest|coldest/.test(p)) {
        const target = /warmest/.test(p) ? Math.max(...vals) : Math.min(...vals);
        check('line', q, days[vals.indexOf(target)] === ans(q), 'day ' + ans(q) + ' values ' + vals.join(','));
      } else {
        const d = p.match(/on (\w+)\?/)[1];
        check('line', q, vals[days.indexOf(d)] + ' °C' === ans(q), 'value ' + ans(q) + ' values ' + vals.join(','));
      }

      q = B.subtract4Q(); basics('subtract', q);
      const [a, b] = (B.strip(q.visual).match(/[\d,]{5}/g) || []).map(num);
      check('subtract', q, a >= 1000 && b >= 1000 && a - b === Number(q.answer) && a - b > 0, a + ' - ' + b + ' != ' + q.answer);
      check('subtract', q, B.guidance(q, null, false).text.includes('two steps'), 'tip');

      q = B.calcCheckQ(); basics('calc', q);
      const m = B.strip(q.prompt).match(/([\d,]+) − ([\d,]+) = ([\d,]+)/), A = num(m[1]), Bn = num(m[2]), W = num(m[3]);
      if (/keys check/.test(q.prompt)) {
        const k = ans(q).match(/^(\d+) \+ (\d+) =$/);
        check('calc', q, k && Number(k[1]) + Number(k[2]) === A, 'keys ' + ans(q));
      } else check('calc', q, (W === A - Bn) === /right/.test(ans(q)), 'right/wrong ' + ans(q));
    }
    return out.slice(0, 10);
  }, N);
  assert.deepEqual(probleme, []);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('neue Themen: in den Quests enthalten, mit eigenem Tipp und leichterem Beispiel', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  const r = await page.evaluate(() => {
    const B = window.__bqi, seen = {}, noEx = [], ans = (q) => (q.kind === 'mc' ? B.strip(q.options[q.answer]) : String(q.answer));
    const MARK = { thousand: /nearest thousand/, expanded: /expanded form|What number is [\d,]+ \+/, scale: /every second mark/, line: /line graph/, subtract: /still on the shelves|still free|kilometres are left|bottle caps are left/, calc: /calculator/ };
    for (const w of ['round', 'numbers', 'graphs', 'wordprob']) for (let i = 0; i < 40; i++) B.WORLDS[w].build().forEach((q) => {
      const p = B.strip(q.prompt);
      for (const [k, re] of Object.entries(MARK)) if (re.test(p)) {
        seen[k] = (seen[k] || 0) + 1;
        const ex = B.exampleFor(q);
        if (!ex || ans(ex).toLowerCase() === ans(q).toLowerCase()) noEx.push(k + ': ' + p);
      }
    });
    const t = B.roundThousandQ(), bridge = B.bridgeFor(t).map((b) => B.strip(b.prompt));
    return { seen, noEx: noEx.slice(0, 5), bridge };
  });
  for (const k of ['thousand', 'expanded', 'scale', 'line', 'subtract', 'calc']) assert.ok((r.seen[k] || 0) >= 5, k + ' too rare: ' + (r.seen[k] || 0));
  assert.deepEqual(r.noEx, []);
  assert.ok(r.bridge.every((p) => /nearest thousand/.test(p)), 'bridge for thousands: ' + r.bridge.join(' | '));
  assert.deepEqual(fehler, []);
  await ctx.close();
});
