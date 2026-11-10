// Synthetic DOM counterexamples exercise the actual native script, not a Toddle simulation.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
const source = readFileSync(new URL('../ios/BigQuestMVP/ToddleField.swift', import.meta.url), 'utf8');
const script = source.split('static let evaluationScript = #"""')[1].split('"""#')[0];
const table = (rows, attrs = '') => `<table ${attrs}><tr><th>Standards</th><th>Assessment Criteria</th></tr>${rows}</table>`;
const row = (text, grade, attrs = '') => `<tr ${attrs}><td>${text}</td><td>${grade}</td></tr>`;
test('selection-free reader preserves pairs and rejects ambiguous or hidden sources', async () => {
 const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined});
 try {
  const page = await browser.newPage();
  await page.route('**/*', route => route.fulfill({contentType:'text/html',body:'<html><body></body></html>'}));
  await page.goto('https://web.toddleapp.com/');
  const read = async html => { await page.setContent(html); return page.evaluate(script); };
  const six = ['C','M','M','C','C','C'];
  let result = await read(table(six.map((g,i)=>row(`Synthetic criterion ${i}`,g)).join('')));
  assert.deepEqual(result.rows, six.map((rating,i)=>({criterion:`Synthetic criterion ${i}`,rating})));
  assert.equal(result.skipped,0);
  assert.equal(await page.evaluate(()=>getSelection().toString()), '');
  result = await read(table(row('A','C')) + table(row('B','M')));
  assert.equal(result.error,'ambiguous');
  result = await read(table(row('A','C')) + table(row('Hidden','M'),'style="display:none"'));
  assert.deepEqual(result.rows,[{criterion:'A',rating:'C'}]);
  result = await read(table(row('A','C')) + `<div role="dialog">${table(row('B','M'))}</div>`);
  assert.deepEqual(result.rows,[{criterion:'B',rating:'M'}]);
  result = await read(table(row('Header','-')+row('A','C')+row('Unknown','Q')+row('Hidden','E','hidden')));
  assert.equal(result.skipped,2); assert.equal(result.rows.length,1);
  assert.equal((await read(table(row('<input value="name">','C')))).error,'rows');
  for (const attr of ['style="opacity:0"','aria-hidden="true"','inert']) {
   assert.equal((await read(table(row(`Visible <span ${attr}>Hidden name</span>`,'C')))).error,'rows');
  }
  assert.equal((await read('<p>Evaluation C M</p>')).error,'header');
  result = await read('<div role="dialog">One</div><div role="dialog">Two</div>');
  assert.equal(result.error,'dialogs'); assert.equal(result.diagnostic.dialogs,2);
  result = await read('<iframe src="about:blank"></iframe><canvas></canvas><p>PRIVATE NAME</p>');
  assert.equal(result.error,'header'); assert.equal(result.diagnostic.frames,1);
  assert.equal(result.diagnostic.canvases,1);
  assert.ok(Object.values(result.diagnostic).every(Number.isInteger));
  assert.ok(!JSON.stringify(result).includes('PRIVATE'));
  await page.goto('https://example.org/');
  assert.equal((await read(table(row('A','C')))).error,'origin');
 } finally { await browser.close(); }
});
