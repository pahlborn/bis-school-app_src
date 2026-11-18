// Actual EP02 touch path; history preparation is a labelled stored-data fixture.
// The app builds the round, renders the badge and records every answer itself.
import{test,before,after}from'node:test';import assert from'node:assert/strict';
import{appServer,browserStarten,appOeffnen,zustand}from'./app-hilfen.mjs';
let browser,server;
const hook=h=>h.replace(/\}\)\(\);\s*<\/script>/,'window.__ep02={SUBJECTS,questsIn,qId,levelOf,WORLDS};})();</script>');
before(async()=>{server=await appServer({anpassen:hook});browser=await browserStarten();});
after(async()=>{await browser?.close();server?.close();});
async function prepare(page,target='numbers'){
 await page.evaluate(target=>{
  const G=window.__ep02,secure=()=>Array.from({length:10},(_,i)=>['2026-11-'+(16+i%3),2,1]);
  const quests=G.SUBJECTS.flatMap(G.questsIn);localStorage.setItem('bq2_ev',JSON.stringify(Object.fromEntries(quests.filter(k=>k!==target).map(k=>[k,secure()]))));
  localStorage.setItem('bq2_focusMode','"manual"');localStorage.setItem('bq2_focusManual','["graphs"]');
 },target);
}
async function answer(page){
 let s=await zustand(page),q=s.round[s.idx];
 if(await page.locator('#takeChallenge').isVisible())await page.locator('#takeChallenge').tap();
 if(q.kind==='mc')await page.locator('#qAnswers .opt[data-i="'+q.answer+'"]').tap();
 else if(q.kind==='type'){for(const digit of String(q.answer))await page.locator('#qAnswers .key[aria-label="'+digit+'"]').tap();await page.locator('#qAnswers .key.go').tap();}
 else{for(const i of q.correct)await page.locator('#qAnswers .ord[data-i="'+i+'"]').tap();await page.locator('#checkOrder').tap();}
 assert.ok(await page.locator('#feedback.good').isVisible());
}
async function reach(page){
 for(let i=0;i<8;i++){
  const s=await zustand(page);if(s.round[s.idx].neuland)return s.round[s.idx];
  await answer(page);await page.locator('#nextBtn').tap();
 }
 assert.fail('actual round must contain one discovery');
}
async function finish(page){
 while(await page.locator('#play').isVisible()){await answer(page);await page.locator('#nextBtn').tap();}
 assert.equal(await page.locator('#resScore').textContent(),'8');
}

test('EP02 touch: actual Today badge, portrait/landscape, self success, 8/8 and next year-level after reload',async()=>{
 const{ctx,page,fehler}=await appOeffnen(browser,server.url,{hasTouch:true,viewport:{width:390,height:844}});
 try{
  await prepare(page);await page.locator('#todayBtn').tap();const start=await zustand(page);
  assert.equal(start.round.length,8);assert.equal(start.round.filter(q=>q.neuland).length,1);
  const q=await reach(page);assert.equal(q.level,1);assert.equal(q.world,'numbers');
  for(const viewport of[{width:390,height:844},{width:844,height:390}]){
   await page.setViewportSize(viewport);await page.locator('#qLabel').scrollIntoViewIfNeeded();
   assert.match(await page.locator('#qLabel').textContent(),/🧭 Neu entdeckt/);
   const box=await page.locator('#qLabel').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=viewport.width+1);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal clipping');
   assert.ok(await page.locator('#qAnswers button').first().evaluate(e=>e.getBoundingClientRect().height>=44));
  }
  await finish(page);assert.equal(await page.locator('#resCount').textContent(),'8');
  await page.reload();await page.waitForSelector('#home:not([hidden])');await page.locator('#todayBtn').tap();
  const next=(await zustand(page)).round.find(q=>q.neuland);assert.ok(next);assert.equal(next.world,'numbers');assert.equal(next.level||2,2);
  assert.deepEqual(fehler,[]);
 }finally{await ctx.close();}
});
test('EP02 touch: helped discovery still earns its star, keeps foundation next time and retains a real help bridge',async()=>{
 const{ctx,page,fehler}=await appOeffnen(browser,server.url,{hasTouch:true,viewport:{width:390,height:844}});
 try{
  await prepare(page,'round');await page.locator('#todayBtn').tap();const q=await reach(page);assert.equal(q.level,1);
  await page.locator('#helpBtn').tap();assert.ok(await page.locator('#feedback.hint').isVisible());
  if(/example/i.test(await page.locator('#helpBtn').textContent())&&await page.locator('#helpBtn').isVisible())await page.locator('#helpBtn').tap();
  const stars=(await zustand(page)).stars;await answer(page);assert.equal((await zustand(page)).stars,stars+1,'help is not penalised');await page.locator('#nextBtn').tap();
  await finish(page);await page.locator('#againBtn').tap();assert.equal((await zustand(page)).round.find(q=>q.neuland).level,1);
  // Real help route from the unchanged Rounding Road quest. Never install a
  // synthetic round: the ordinary builder provides the coach question.
  await page.locator('#quitBtn').tap();await page.locator('#subjects button.subject').filter({hasText:'Maths'}).tap();await page.locator('[data-item="round"]').tap();
  let bridged=false;
  for(let i=0;i<8;i++){
   const s=await zustand(page),current=s.round[s.idx];
   if(current.coach){
    await page.locator('#helpBtn').tap();await page.locator('#answerBtn').tap();
    const changed=await zustand(page),queued=await page.evaluate(()=>JSON.parse(localStorage.getItem('bq2_bridgeNext')||'[]'));
    const tasks=changed.round.slice(changed.idx+1).filter(q=>q.bridge).concat(queued);
    assert.ok(tasks.length>=3);assert.equal(tasks[0].level,1);assert.equal(tasks[1].level,1);assert.equal(tasks[2].bridgePart,'return');bridged=true;break;
   }
   await answer(page);await page.locator('#nextBtn').tap();
  }
  assert.ok(bridged);assert.deepEqual(fehler,[]);
 }finally{await ctx.close();}
});
