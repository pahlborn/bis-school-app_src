import{test}from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';
import{createHash}from'node:crypto';
import{dailyContent}from'../../src/module/tagesinhalte.mjs';
const words=JSON.parse(fs.readFileSync(new URL('../../docs/inhalte/words-trivia-365.json',import.meta.url))),explainFile=fs.readFileSync(new URL('../../docs/inhalte/explain-it-daily-365.json',import.meta.url)),explain=JSON.parse(explainFile);
const hash=x=>createHash('sha256').update(x).digest('hex');
test('365 original word options/answers/order and all Explain questions remain protected; contexts are present',()=>{
 const original={...words,items:words.items.map(({example,...w})=>w)};
 assert.equal(hash(JSON.stringify(original)),'a6022457272ee8dc45ef4f3e72f81f2f90fe5756ef0ef2c10743e17c2e5b79d0');
 assert.equal(hash(explainFile),'a1776e0f4b33cff612d91aa39ff8f12ded299f2fbf0cd7c6feff0f1476440505');
 assert.equal(words.items.length,365);assert.equal(explain.items.length,365);assert.equal(new Set(explain.items.map(x=>x.question)).size,303);
 for(const [i,w]of words.items.entries()){assert.equal(w.day,i+1);assert.equal(w.options.length,4);assert.ok(w.answer>=0&&w.answer<4);assert.ok(w.example.length>20);assert.ok(w.example.toLowerCase().includes(w.word.toLowerCase()));assert.notEqual(w.example,w.options[w.answer]);}
 assert.match(words.items[15].example,/helpful boy.*offered to carry/);
});
test('daily selection is stable on reopening, changes by day, and covers the original 365 in order',()=>{
 for(let i=0;i<365;i++){const day=new Date(Date.UTC(2026,0,1+i)).toISOString().slice(0,10);assert.equal(dailyContent(words.items,day),words.items[i]);assert.equal(dailyContent(explain.items,day),explain.items[i]);}
 assert.equal(dailyContent(words.items,'2026-11-20'),dailyContent(words.items,'2026-11-20'));
 assert.equal(dailyContent(words.items,'2028-12-31'),words.items[0]);
});
