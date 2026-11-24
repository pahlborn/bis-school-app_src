// J: card presentation uses existing selection and history; fixtures contain no accounts.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { testinstanzBauen, familieBauen } from '../werkzeug/bauen.mjs';
import { schluesselAusRoh, entschluesselnMitSchluessel, tresorAusHuelle } from '../werkzeug/kern.mjs';
import { neulandCandidates } from '../src/module/practise-heute.mjs';
import { appServer, browserStarten, appOeffnen } from './app-hilfen.mjs';
import { testbauLeser } from './testbau-leser.mjs';

let browser, server;
const hook = html => html.replace(/\}\)\(\);\s*<\/script>/, `window.__questJ={
  store, focusTopics, activeGapQuests, SUBJECTS, questsIn, WORLDS, openSubject, renderHome,
  render:(item, active)=>{
    const original=activeGap;
    try { if(active!==undefined) activeGap=()=>active.length?{quests:active}:null;
      return questCard(item,'maths').outerHTML;
    } finally {activeGap=original;}
  }
};})();</script>`);
before(async()=>{ server=await appServer({anpassen:hook}); browser=await browserStarten(); });
after(async()=>{await browser?.close();server?.close();});

async function render(page,{quest='numbers',mode='manual',focus=[],active=[],history={},lang='en',unlocked=[]}={}){
 return page.evaluate(({quest,mode,focus,active,history,lang,unlocked})=>{
   const G=window.__questJ;
   for(const [k,v] of Object.entries({focusMode:mode,focusManual:focus,kidLang:lang,unlocked,ev:{},attempts:[],tried:[],due:[],...history}))G.store.set(k,v);
   G.store.set('best_'+quest,history.best??null);
   const root=document.querySelector('#subjectBody');root.innerHTML=G.render(quest,active);
   return {badge:root.querySelector('.quest-marker')?.textContent||'',label:root.querySelector('.quest-marker')?.getAttribute('aria-label')||'',count:root.querySelectorAll('.quest-marker').length};
 },{quest,mode,focus,active,history,lang,unlocked});
}

test('J counterprobe: a manually focused card shows one visible target',async()=>{
 const {ctx,page}=await appOeffnen(browser,server.url);
 try{assert.deepEqual(await render(page,{focus:['numbers']}),{badge:'🎯 Focus',label:'Focus',count:1});}
 finally{await ctx.close();}
});

test('J precedence: active goal, automatic focus, manual focus, inactive goal and no marker',async()=>{
 const{ctx,page,fehler}=await appOeffnen(browser,server.url);
 try{
   const auto=await page.evaluate(()=>window.__questJ.focusTopics());
   assert.ok(auto.length>0);
   assert.equal((await render(page,{quest:auto[0],mode:'auto',active:[auto[0]]})).badge,'🧩 Learning goal');
   assert.equal((await render(page,{quest:auto[0],mode:'auto'})).badge,'🎯 Focus');
   assert.equal((await render(page,{focus:['numbers'],active:['numbers']})).badge,'🎯 Focus');
   assert.equal((await render(page,{active:['numbers']})).badge,'🌱 New');
   assert.equal((await render(page,{history:{tried:['numbers']}})).count,0);
   assert.deepEqual(fehler,[]);
 }finally{await ctx.close();}
});

test('J New uses every existing practice trace and unlocking',async()=>{
 const{ctx,page,fehler}=await appOeffnen(browser,server.url);
 try{
   assert.equal((await render(page)).badge,'🌱 New');
   assert.equal((await render(page,{quest:'times'})).count,0);
   assert.equal((await render(page,{quest:'times',unlocked:['times']})).badge,'🌱 New');
   for(const history of [{ev:{numbers:[['2026-11-24',2,0]]}},{attempts:[{skill:'numbers'}]},{tried:['numbers']},{best:0},{due:[{q:{world:'numbers'}}]}]){
     assert.equal((await render(page,{history})).count,0,'any existing trace suppresses New');
   }
   assert.deepEqual(fehler,[]);
 }finally{await ctx.close();}
});

test('J English child labels in DE/EN fit touch cards without hover',async()=>{
 const{ctx,page,fehler}=await appOeffnen(browser,server.url,{hasTouch:true,viewport:{width:320,height:720}});
 try{
   for(const lang of ['de','en'])for(const [options,badge,label] of [
     [{mode:'auto',active:['numbers']},'🧩 Learning goal','Learning goal'],
     [{focus:['numbers']},'🎯 Focus','Focus'],[{},'🌱 New','New']]){
     assert.deepEqual(await render(page,{...options,lang}),{badge,label,count:1});
     await page.locator('#subjectBody').evaluate(e=>{e.closest('section').hidden=false;});
     const marker=page.locator('.quest-marker');assert.ok(await marker.isVisible());
     const box=await marker.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=320);
     assert.equal(await marker.getAttribute('title'),null);
   }
   assert.deepEqual(fehler,[]);
 }finally{await ctx.close();}
});


test('J weak Today fallback is practised, so it does not receive New',async()=>{
 const history={ev:{numbers:[['2026-11-24',2,0]]}};
 assert.deepEqual(neulandCandidates(['numbers'],history,()=> 'RS'),['numbers']);
 const{ctx,page}=await appOeffnen(browser,server.url);
 try{assert.equal((await render(page,{history})).count,0);}finally{await ctx.close();}
});

test('J drawing cards neither draws randomness nor writes stored progress',async()=>{
 const{ctx,page}=await appOeffnen(browser,server.url);
 try{
   await render(page);
   assert.deepEqual(await page.evaluate(()=>{
     const before=JSON.stringify(Object.entries(localStorage).sort()),random=Math.random;
     try{
       Math.random=()=>{throw new Error('card must not draw randomness');};
       for(const k of window.__questJ.SUBJECTS.flatMap(window.__questJ.questsIn))window.__questJ.render(k,[]);
       return {same:before===JSON.stringify(Object.entries(localStorage).sort())};
     }finally{Math.random=random;}
   }),{same:true});
 }finally{await ctx.close();}
});

test('J both real builds retain English labels, precedence and touch fit in DE/EN',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'bq-quest-j-builds-'));
 try{
   const testDir=path.join(dir,'test');await testinstanzBauen({ziel:testDir});
   const familyDir=path.join(dir,'family');
   const family=await familieBauen({schluesselRoh:randomBytes(32)},{ziel:familyDir});
   const encrypted=await fs.readFile(path.join(familyDir,'index.html'),'utf8');
   const decrypted=await entschluesselnMitSchluessel(tresorAusHuelle(encrypted),await schluesselAusRoh(family.schluesselRoh));
   const apps=[['test',await fs.readFile(path.join(testDir,'index.html'),'utf8')],['family',Buffer.from(decrypted).toString('utf8')]];
   for(const [kind,html] of apps){
     // Existing reader translates fixture storage for the built event-log app.
     const builtServer=await appServer({anpassen:()=>testbauLeser(hook(html))});
     try{
       const{ctx,page,fehler}=await appOeffnen(browser,builtServer.url,{hasTouch:true,viewport:{width:320,height:720}});
       try{
         for(const lang of ['de','en']){
           assert.deepEqual(await render(page,{lang,mode:'auto',active:['numbers']}),{badge:'🧩 Learning goal',label:'Learning goal',count:1},kind);
           assert.deepEqual(await render(page,{lang,focus:['numbers'],active:['numbers']}),{badge:'🎯 Focus',label:'Focus',count:1},kind);
           assert.deepEqual(await render(page,{lang}),{badge:'🌱 New',label:'New',count:1},kind);
           assert.equal((await render(page,{lang,history:{tried:['numbers']}})).count,0,kind);
         }
         assert.deepEqual(fehler,[],kind);
       }finally{await ctx.close();}
     }finally{builtServer.close();}
   }
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
