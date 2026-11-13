import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { chromium } from 'playwright';
const html=readFileSync(new URL('../pilot/local-evaluation/index.html',import.meta.url),'utf8');
test('local pilot: no GitHub auth, manual save survives reload, two supported exercise types',async(t)=>{
 const server=createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>server.close());
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});t.after(()=>browser.close());
 const page=await browser.newPage();const requests=[];
 page.on('request',r=>requests.push(r.url()));
 await page.goto('http://127.0.0.1:'+server.address().port);
 assert.match(await page.locator('body').innerText(),/max\.mustermann/);
 assert.equal(await page.locator('#title').count(),1);
 assert.equal(await page.locator('#verbLink').count(),0);
 await page.locator('#title').fill('Fiktives Runden');
 await page.locator('#area').selectOption('Mathematik');
 await page.locator('[data-criterion="0"]').fill('Rounds whole numbers to 9999 to the nearest 10, 100 and 1000');
 await page.locator('[data-rating="0"]').selectOption('C');
 await page.locator('#preview').click();
 assert.match(await page.locator('#preview-content').innerText(),/Fiktives Runden/);
 assert.equal(await page.evaluate(()=>localStorage.length),0,'preview must not persist');
 await page.locator('#save').click();
 assert.match(await page.locator('#saved-list').innerText(),/Fiktives Runden/);
 await page.reload();
 await page.locator('#tab-saved').click();
 assert.match(await page.locator('#saved-list').innerText(),/Fiktives Runden/);
 await page.locator('#tab-practice').click();
 assert.match(await page.locator('#practice-list').innerText(),/nächsten Hunderter/);
 assert.equal(requests.some(x=>/api\.github\.com|github\.com\/repos/.test(x)),false);
});
test('local pilot: Toddle bridge and synthetic Claude response fill SAME form, fail-safe grades',async(t)=>{
 const server=createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>server.close());
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});t.after(()=>browser.close());
 const page=await browser.newPage();
 await page.addInitScript(()=>{
  window.webkit={messageHandlers:{bigQuestEvaluation:{postMessage:async({source})=>{
   if(source!=='Evaluation')throw Error('unexpected source');
   return {title:'Fiktive Toddle-Bewertung',date:'2026-11-13',goal:'Zahlen runden',instructions:'Denke an Hunderter',feedback:'Weiter üben',missing:[],
    criteria:[{criterion:'Fiktives Mathekriterium',rating:'C',evidence:'Fiktives Mathekriterium C'}]};
  }}}};
 });
 await page.goto('http://127.0.0.1:'+server.address().port);
 const bridge=await page.evaluate(()=>({
  context:window.bigQuestEvaluationForm.context(),
  status:window.bigQuestEvaluationForm.source(window.bigQuestEvaluationForm.context(),'00000000-0000-4000-8000-000000000001','Evaluation')
 }));
 assert.equal(bridge.status,'opened');
 await page.locator('#ai').click();
 await page.locator('#title').waitFor();
 await page.waitForFunction(()=>document.querySelector('#title').value==='Fiktive Toddle-Bewertung');
 assert.equal(await page.locator('[data-rating="0"]').inputValue(),'C');
 assert.equal(await page.locator('#area').inputValue(),'');
 assert.equal(await page.evaluate(()=>localStorage.length),0);
 await page.locator('#area').selectOption('Mathematik');
 await page.locator('#preview').click();
 assert.equal(await page.locator('#preview-box').isVisible(),true);
});


test('local pilot: stored C subtraction produces task without selecting an exercise, M rounding does not',async(t)=>{
 const server=createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>server.close());
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});t.after(()=>browser.close());
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.evaluate(()=>{
  const key='bq_local_eval_pilot_01532';
  localStorage.setItem(key,JSON.stringify([
   {id:'math1',title:'Milestone',area:'Mathematik',criteria:[
     {criterion:'Rounds whole numbers to 9999 to the nearest 10, 100 and 1000',rating:'M'},
     {criterion:'Selects appropriate mental and written strategies to solve real life subtraction problems to 9999, including two-step problems',rating:'C'}
   ],exercise:''},
   {id:'math2',title:'Travel for Work',area:'Sonstiges',criteria:[
     {criterion:'Rounds whole numbers to 9999 to the nearest 10, 100 and 1000',rating:'C'}
   ],exercise:''},
   {id:'empty',title:'Lesson 4',area:'Mathematik',criteria:[],exercise:''}
  ]));
 });
 await page.locator('#tab-practice').click();
 const cards=page.locator('#practice-list .piece');
 assert.equal(await cards.count(),2);
 assert.match(await cards.nth(0).innerText(),/532 − 140 − 27/);
 assert.match(await cards.nth(1).innerText(),/Runde \d+ auf den nächsten Hunderter/);
 assert.doesNotMatch(await page.locator('#practice-list').innerText(),/Lesson 4/);
 await page.reload();
 await page.locator('#tab-practice').click();
 assert.equal(await page.locator('#practice-list .piece').count(),2);
});

test('local pilot: evaluation without any rubric criteria cannot be saved',async(t)=>{
 const server=createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>server.close());
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});t.after(()=>browser.close());
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.locator('#title').fill('Unvollständige Bewertung');
 await page.locator('#area').selectOption('Mathematik');
 await page.locator('#preview').click();
 assert.match(await page.locator('#status').innerText(),/Mindestens ein Bewertungskriterium/);
 assert.equal(await page.evaluate(()=>localStorage.length),0);
});
