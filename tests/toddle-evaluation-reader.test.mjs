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


test('captures six explicitly paired rubric grades even when shown as controls', async () => {
 const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined});
 try {
  const page = await browser.newPage({ viewport: {width: 820,height: 1180} });
  await page.route('**/*', route => route.fulfill({contentType:'text/html',body:'<html><body></body></html>'}));
  await page.goto('https://web.toddleapp.com/');
  const expected = ['C','M','M','C','C','C'];
  const labels = expected.map((_,i) => 'Criterion '+(i+1)+' with a fully stated synthetic learning objective');
  const rows = labels.map((label,i) => {
   const grade = i===1 ? '<span>M</span>'
    : i===2 ? '<button type="button"><span>M</span></button>'
    : i===4 ? '<input type="text" readonly value="C">'
    : '<button type="button">'+expected[i]+'</button>';
   return '<div role="row" style="display:flex;align-items:center;min-height:72px;width:720px">'
    +'<div style="width:590px">'+label+'</div><div>'+grade+'</div></div>';
  }).join('');
  await page.setContent('<main>Learning intentions<div>Assessment Criteria</div><section aria-label="Evaluation" style="width:720px">'+rows+'</section><div>Your response</div></main>');
  const captured = await page.evaluate(script);
  assert.ok(captured.text, 'source text returned');
  for (let i=0;i<labels.length;i++){
    assert.ok(captured.text.includes(labels[i]+' '+expected[i]), 'grade '+(i+1)+' stays with its own criterion');
  }
  assert.equal((captured.text.match(/Visible rubric criterion and rating in the same row:/g)||[]).length,1);
  assert.equal(await page.evaluate(()=>getSelection().toString()), '');
 } finally { await browser.close(); }
});

test('ambiguous grades in one rubric row are not assigned to a criterion', async () => {
 const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined});
 try {
  const page=await browser.newPage({ viewport:{width:820,height:1180}});
  await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<html><body></body></html>'}));
  await page.goto('https://web.toddleapp.com/');
  await page.setContent('<main>Learning intentions<div>Assessment Criteria</div><div style="display:flex;width:720px;align-items:center">'
    +'<div style="width:580px">A synthetic but sufficiently long criterion statement</div>'
    +'<button>C</button><button>M</button></div><div>Your response</div></main>');
  const captured=await page.evaluate(script);
  assert.ok(captured.text);
  assert.doesNotMatch(captured.text,/Visible rubric criterion and rating in the same row:/);
 } finally { await browser.close(); }
});


test('OREO instructional E outside Assessment Criteria cannot become a rubric grade', async () => {
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});
 try{
  const page=await browser.newPage({viewport:{width:820,height:1180}});
  await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<html><body></body></html>'}));
  await page.goto('https://web.toddleapp.com/');
  await page.setContent('<main>Learning intentions'
    +'<div style="display:flex;width:720px;align-items:center"><div style="width:560px">Use O pinion, R eason, E xample, O pinion. Explain a convincing viewpoint.</div><button>E</button></div>'
    +'<div>Assessment Criteria</div><div>SPEAKING AND LISTENING STRAND</div><div>-</div>'
    +'<div style="display:flex;align-items:center"><div style="width:600px">Communicate with listeners respectfully and clearly</div><button>C</button></div>'
    +'<div style="display:flex;align-items:center"><div style="width:600px">Present a clear opinion supported by relevant examples</div><button>M</button></div>'
    +'<div>Your response</div></main>');
  const result=await page.evaluate(script);
  const appended=result.text.split('Visible rubric criterion and rating in the same row:')[1]||'';
  assert.match(appended,/Communicate with listeners respectfully and clearly C/);
  assert.match(appended,/Present a clear opinion supported by relevant examples M/);
  assert.doesNotMatch(appended,/Explain a convincing viewpoint|O pinion/);
 }finally{await browser.close()}
});
