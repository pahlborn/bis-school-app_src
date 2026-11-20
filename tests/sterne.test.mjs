// Authorized synthetic family; actual generated questions and UI handlers, no remote account/service.
import{test,before,after}from'node:test';import assert from'node:assert/strict';import{createHash}from'node:crypto';import{mkdir}from'node:fs/promises';import path from'node:path';
import{konto,kontenServer,oeffnen,anmelden,passwortSetzen}from'./konten-hilfen.mjs';import{appServer,appOeffnen,browserStarten,zustand,frageBeantworten,klick}from'./app-hilfen.mjs';import{appSandbox}from'./app-sandbox.mjs';
const DAY='2026-11-20',good=()=>Array.from({length:6},()=>[DAY,2,1,true]),seeded=appSandbox({seed:4}),eligible=Array.from(seeded.holen('SUBJECTS')).flatMap(s=>Array.from(seeded.holen('questsIn')(s)));
const hook=h=>h.replace(/\}\)\(\);\s*<\/script>/,()=>`window.__stars={read:(k,d)=>store.get(k,d),start:startRound,earned:earnedRound,ledger:()=>starRewards.read(),stand:standOf,results:showResults,home:()=>{show('home');renderHome();},errors:()=>eventErrors};})();</script>`);
let browser,accounts;const servers=[];
before(async()=>{browser=await browserStarten();accounts={users:[await konto('mia','student','ABCD-EFGH'),await konto('papa','parent','PAPA-2345',{kinder:['mia']})]};});
after(async()=>{await browser?.close();for(const s of servers)s.close();});
async function setup(bauart,data={ev:{numbers:good(),round:good()},total:13}){
 const server=await kontenServer(accounts,{bauart,anpassen:hook});servers.push(server);const a=await oeffnen(browser,server,{viewport:{width:768,height:1024},hasTouch:true,isMobile:true});await a.page.clock.setFixedTime(new Date(DAY+'T10:00:00Z'));
 const id=server.konten.users.find(u=>u.user==='mia').id,pre='bq2_'+id+'__';await a.page.evaluate(({pre,data,day})=>{for(const[k,v]of Object.entries({...data,greetDay:day,rankPolicy:'knowledge.v1',rankSeen:'Explorer'}))Storage.prototype.setItem.call(localStorage,pre+k,JSON.stringify(v));},{pre,data,day:DAY});
 await anmelden(a.page,'student','mia','ABCD-EFGH');await passwortSetzen(a.page,'Tiger-Lamp-River-4271');await a.page.waitForSelector('#home:not([hidden])');return{...a,server,id,pre};
}
async function finish(page){for(let i=0;i<8;i++){const s=await zustand(page);if(s.screen!=='play')return;await frageBeantworten(page,s.round[s.idx]);await klick(page,'#nextBtn');}}
async function reveal(page){await page.locator('#helpBtn').tap();await page.locator('#answerBtn').tap();}
for(const bauart of['live','test'])test(`${bauart}: actual safe8/8 shows0 earned, best8 and no treat/rain; direct challenge preserves originalL3 after hint/example`,async()=>{
 const{ctx,page,fehler}=await setup(bauart);try{
  await page.locator('#subjects .subject').first().tap();assert.match(await page.locator('[data-item="numbers"] .quest-star-rule').innerText(),/challenges/);await page.locator('[data-item="numbers"]').tap();assert.match(await page.locator('#roundStarRule').innerText(),/0 here/);
  await finish(page);if(process.env.BQ_STAR_SCREEN_DIR){await mkdir(process.env.BQ_STAR_SCREEN_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.BQ_STAR_SCREEN_DIR,`star-verified-zero-${bauart}.png`)});}assert.equal(await page.locator('#resScore').innerText(),'8');assert.equal(await page.locator('#resEarned').innerText(),'0 stars earned');assert.equal(await page.evaluate(()=>window.__stars.read('best_numbers')),8);assert.equal(await page.evaluate(()=>window.__stars.read('total')),13);assert.equal(await page.locator('[data-treat]').count(),0);assert.equal(await page.getAttribute('#confetti','data-runs'),null);
  await page.locator('[data-star-challenge]').tap();await page.locator('#takeChallenge').tap();let s=await zustand(page);assert.equal(s.round[0].level,3);await page.locator('#helpBtn').tap();await page.locator('#helpBtn').tap();s=await zustand(page);assert.equal(s.round[0].level,3);await frageBeantworten(page,s.round[0]);assert.equal(await page.locator('#roundStars').innerText(),'1');await klick(page,'#nextBtn');await finish(page);
  const paid=await page.evaluate(()=>window.__stars.earned());assert.ok(paid>=1&&paid<6);assert.equal(await page.locator('#resScore').innerText(),'8');assert.equal(await page.getAttribute('#confetti','data-runs'),null);const total=await page.evaluate(()=>window.__stars.read('total'));await page.evaluate(()=>window.__stars.results());assert.equal(await page.evaluate(()=>window.__stars.read('total')),total);assert.deepEqual(fehler,[]);
 }finally{await ctx.close();}
});
test('actual zero-success challenge round gives courage and a short next route, no treat; reveals never earn',async()=>{
 const{ctx,page,fehler}=await setup('live');try{
  await page.evaluate(()=>window.__stars.start('numbers'));await finish(page);await page.locator('[data-star-challenge]').tap();await page.locator('#takeChallenge').tap();let s=await zustand(page),q=s.round[s.idx];
  if(q.kind==='mc')await page.locator(`#qAnswers .opt[data-i="${(q.answer+1)%q.options.length}"]`).tap();else assert.fail('the actual first Rounding challenge in this fixture is MC');
  if(!(await zustand(page)).answered)await page.locator('#answerBtn').tap();await klick(page,'#nextBtn');
  for(let i=1;i<8;i++){await reveal(page);await klick(page,'#nextBtn');}
  assert.equal(await page.locator('#resScore').innerText(),'0');assert.equal(await page.locator('#resEarned').innerText(),'0 stars earned');assert.match(await page.locator('#treat').innerText(),/You tried a challenge/);assert.equal(await page.locator('[data-treat]').count(),0);assert.ok(await page.locator('[data-star-next]').isVisible());assert.deepEqual(fehler,[]);
 }finally{await ctx.close();}
});
test('actual novice paid round triggers star rain from earned currency; Word is an optional treat as well as a free home offer',async()=>{
 const{ctx,page,fehler}=await setup('live',{total:0});try{
  await page.evaluate(()=>window.__stars.start('numbers'));await finish(page);const earned=await page.evaluate(()=>window.__stars.earned());assert.ok(earned>=6);assert.equal(await page.getAttribute('#confetti','data-runs'),'1');
  await page.locator('[data-treat="word"]').tap();await page.locator('#treatWord [data-open-word]').tap();assert.equal(await page.locator('#treatWord [data-word-option]').count(),4);const before=await page.evaluate(()=>window.__stars.read('total'));await page.locator('#treatWord [data-word-option]').first().tap();assert.equal(await page.evaluate(()=>window.__stars.read('total')),before);await page.evaluate(()=>window.__stars.results());assert.equal(await page.getAttribute('#confetti','data-runs'),'1');assert.deepEqual(fehler,[]);
 }finally{await ctx.close();}
});
test('actual discovery after unsuccessful practice pays one bonus; older lower-total backup and undo retain earned currency/claims',async()=>{
 const initial={total:13,ev:Object.fromEntries(eligible.map(k=>[k,k==='numbers'?[[DAY,2,0,false]]:good()])),focusMode:'manual',focusManual:['numbers','round','combos']};
 const{ctx,page,fehler,id}=await setup('live',initial);try{
  await page.evaluate(()=>window.__stars.start('today'));let found=false;
  for(let i=0;i<8;i++){const s=await zustand(page),q=s.round[s.idx];if(q.neuland){found=true;assert.equal(q.world,'numbers');assert.equal(s.starOffer.bonus,true);const before=await page.evaluate(()=>window.__stars.read('total'));await page.locator('#helpBtn').tap();await frageBeantworten(page,q);assert.equal(await page.evaluate(()=>window.__stars.read('total')),before+1);}else await frageBeantworten(page,q);await klick(page,'#nextBtn');}
  assert.ok(found);const paid=await page.evaluate(()=>window.__stars.read('total'));assert.ok(paid>14);await page.locator('#homeBtn').tap();await page.locator('#adultBtn').tap();await anmelden(page,'adult','papa','PAPA-2345');await passwortSetzen(page,'Moon-Glass-Paper-8812');await page.waitForSelector('#parentClose');
  await page.locator('#pSettings').tap();await page.locator('details[data-psec="backup"] > summary').tap();
  const data={total:'2',ev:JSON.stringify(initial.ev),focusMode:'"manual"',focusManual:JSON.stringify(initial.focusManual)},audio=[],body={format:'bq-sicherung-1',child:id,user:'mia',createdAt:DAY+'T08:00:00Z',data,audio};body.sha256=createHash('sha256').update(JSON.stringify({data,audio})).digest('hex');
  await page.locator('#pRestoreFile').setInputFiles({name:'synthetic-older-2-star-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(body))});await page.waitForSelector('#pRestoreGo');await page.locator('#pRestoreGo').tap();assert.equal(await page.evaluate(()=>window.__stars.read('total')),paid);assert.ok((await page.evaluate(()=>window.__stars.ledger())).bonuses.includes('numbers'));
  await page.locator('[data-restoreundo]').tap();assert.equal(await page.evaluate(()=>window.__stars.read('total')),paid);assert.ok((await page.evaluate(()=>window.__stars.ledger())).bonuses.includes('numbers'));assert.deepEqual(fehler,[]);
 }finally{await ctx.close();}
});
test('DE/US-EN modified star cards/question/result routes work at320/768/1024 touch without hover or overflow',async()=>{
 const source=await appServer({bauart:'live',anpassen:hook});servers.push(source);
 for(const lang of['de','en'])for(const[width,height]of[[320,768],[768,1024],[1024,768]]){
  const{ctx,page,fehler}=await appOeffnen(browser,source.url,{viewport:{width,height},hasTouch:true,isMobile:true,reducedMotion:'reduce',zeit:DAY+'T10:00:00Z'});try{
   await page.evaluate(({lang,rows})=>{for(const[k,v]of Object.entries({kidLang:lang,total:13,ev:{numbers:rows},rankPolicy:'knowledge.v1',rankSeen:'Explorer'}))localStorage.setItem('bq2_'+k,JSON.stringify(v));},{lang,rows:good()});await page.reload();await page.waitForSelector('#home:not([hidden])');await page.locator('#subjects .subject').first().tap();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('[data-item="numbers"]').tap();assert.ok(await page.locator('#roundStarRule').isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await page.evaluate(()=>matchMedia('(hover:none)').matches),true);
   if(process.env.BQ_STAR_SCREEN_DIR){await mkdir(process.env.BQ_STAR_SCREEN_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.BQ_STAR_SCREEN_DIR,`star-question-${lang}-${width}.png`)});}
   await finish(page);assert.equal(await page.locator('#resScore').innerText(),'8');assert.match(await page.locator('#resEarned').innerText(),/^0 /);assert.equal(await page.locator('[data-treat]').count(),0);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.equal(await page.locator('[data-star-next]').count(),1);for(const sel of['[data-star-next]','[data-star-challenge]']){if(!await page.locator(sel).count())continue;const r=await page.locator(sel).boundingBox();assert.ok(r.width>=44&&r.height>=44);}
   if(process.env.BQ_STAR_SCREEN_DIR)await page.screenshot({path:path.join(process.env.BQ_STAR_SCREEN_DIR,`star-result-${lang}-${width}.png`)});assert.deepEqual(fehler,[]);
  }finally{await ctx.close();}
 }
});
