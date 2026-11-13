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
 await page.locator('[data-criterion="0"]').fill('Runde Zahlen auf den nächsten Hunderter');
 await page.locator('[data-rating="0"]').selectOption('C');
 await page.locator('#exercise').selectOption('round');
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
