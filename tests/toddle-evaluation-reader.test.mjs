// Synthetic DOM fixtures test the production capture script and original-form handoff.
// Real Toddle data and real Claude responses remain device acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
const reader = readFileSync(new URL('../ios/BigQuestMVP/ToddleField.swift', import.meta.url), 'utf8');
const script = reader.split('static let evaluationScript = #"""')[1].split('"""#')[0];
test('capture reads custom rendered evaluation layouts and nested dialogs without marking', async () => {
 const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined});
 try {
  const page = await browser.newPage();
  await page.route('**/*', route => route.fulfill({contentType:'text/html',body:'<html><body></body></html>'}));
  await page.goto('https://web.toddleapp.com/');
  await page.setContent('<div role="dialog" style="position:fixed;inset:0">Learning intentions<div>Learn rounding</div><div role="dialog" style="position:fixed;inset:10px;background:white">Evaluation<div><span>Round to 100</span><span>C</span></div><div style="display:none">SECRET</div><div aria-hidden="true">HIDDEN</div><input value="PASSWORD"><button>Messaging</button></div></div>');
  const result = await page.evaluate(script);
  assert.match(result.text, /Learning intentions[\s\S]*Learn rounding[\s\S]*Round to 100\nC/);
  assert.doesNotMatch(result.text,/SECRET|HIDDEN|PASSWORD|Messaging/);
  assert.equal(await page.evaluate(()=>getSelection().toString()), '');
  await page.setContent('<div role="dialog" aria-hidden="true" style="position:fixed;inset:0">BACKGROUND<div role="dialog" style="position:fixed;inset:10px;background:white">Evaluation<div>Communicate clearly</div><div>C</div></div></div>');
  assert.equal((await page.evaluate(script)).text,'Evaluation\nCommunicate clearly\nC');
  await page.setContent('<main>Learning intentions<div style="opacity:0">PRIVATE</div><p>Actual goal</p></main>');
  assert.equal((await page.evaluate(script)).text,'Learning intentions\nActual goal');
  await page.setContent('<main>Learning intentions '+ 'x'.repeat(48001) + '</main>');
  assert.equal((await page.evaluate(script)).error,'size');
  await page.goto('https://example.org/');
  assert.equal((await page.evaluate(script)).error,'origin');
 } finally { await browser.close(); }
});
