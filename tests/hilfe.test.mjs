import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, zustand, klick, frageBeantworten, alleKarten, karteOeffnen, elternOeffnen, elternSeite, aboutAbschnitt } from './app-hilfen.mjs';

let server, browser;
before(async()=>{ server=await appServer(); browser=await browserStarten(); });
after(async()=>{ await browser?.close(); server?.close(); });
const roundQ=()=>({kind:'mc',world:'round',label:'Rounding Road',level:2,prompt:'Round 470 to the nearest hundred.',options:['400','500','470','600'],answer:1,explain:'470 is 70 from 400 and 30 from 500; choose the shorter distance.',coach:{family:'round',n:470,step:100}});
const rest=()=>Array.from({length:7},(_,i)=>({kind:'mc',world:'round',label:'Rounding Road',prompt:`Starter ${i}`,options:['yes','no','maybe'],answer:0,explain:'A starting question.'}));
const open=(q=roundQ(),other=rest())=>appOeffnen(browser,server.url,{fixture:{world:q.world,round:[q,...other]},reducedMotion:'reduce'});
const data=(p,k)=>p.evaluate(k=>JSON.parse(localStorage.getItem('bq2_'+k)||'null'),k);

test('first error offers a model and retry, with no correct option highlighted and no Next button',async()=>{
  const {ctx,page,fehler}=await open();
  await klick(page,'#qAnswers .opt[data-i="0"]');
  assert.ok(await page.isVisible('#feedback.hint'));
  assert.equal(await page.isVisible('#nextBtn'),false);
  assert.equal(await page.locator('#qAnswers .correct').count(),0);
  assert.equal(await page.isEnabled('#qAnswers .opt[data-i="0"]'),false);
  assert.equal(await page.isEnabled('#qAnswers .opt[data-i="1"]'),true);
  assert.ok(await page.locator('#feedback svg').count()>0);
  assert.ok(!(await page.textContent('#feedback')).includes('choose the shorter distance.'),'full solution not disclosed');
  assert.equal((await data(page,'ev')).round.length,1);
  await page.evaluate(()=>{const b=document.querySelector('#qAnswers .opt[data-i="0"]');b.disabled=false;b.click();});
  assert.equal((await data(page,'attempts')).length,1,'a rejected answer is not counted again even if button state is lost');
  assert.deepEqual(fehler,[]);
  await ctx.close();
});

test('correct second attempt earns one star but not independent mastery or a cleared review item',async()=>{
  const q=roundQ();q.dueId='known-review';
  const {ctx,page}=await open(q);
  await page.evaluate(q=>localStorage.setItem('bq2_due',JSON.stringify([{id:q.dueId,box:0,at:'2000-01-01',q}])),q);
  await klick(page,'#qAnswers .opt[data-i="0"]');
  await klick(page,'#qAnswers .opt[data-i="1"]');
  assert.equal(await page.textContent('#roundStars'),'1');
  assert.ok(await page.isVisible('#feedback.good'));
  const ev=(await data(page,'ev')).round;
  assert.equal(ev.length,1); assert.equal(ev[0][2],0);
  const log=await data(page,'attempts');
  assert.equal(log[1].help,true); assert.equal(log[1].ok,true);
  assert.equal((await data(page,'due')).length,1);
  assert.equal((await data(page,'due'))[0].box,0,'supported retry does not advance the review box');
  await klick(page,'#qAnswers .opt[data-i="1"]');
  assert.equal(await page.textContent('#roundStars'),'1','double click does not score twice');
  await ctx.close();
});

test('second error gives worked solution, two simpler tasks, then a parallel task with new numbers',async()=>{
  const {ctx,page,fehler}=await open();
  await klick(page,'#qAnswers .opt[data-i="0"]');
  await klick(page,'#qAnswers .opt[data-i="2"]');
  assert.ok(await page.isVisible('#feedback .worked'));
  assert.ok(await page.isVisible('#nextBtn'));
  const s=await zustand(page);
  assert.equal(s.round.length,8);
  const bridge=s.round.slice(1,4);
  assert.deepEqual(bridge.map(q=>q.bridgePart),['practice','practice','return']);
  assert.deepEqual(bridge.map(q=>q.level),[1,1,2]);
  assert.ok(bridge.every(q=>q.coach.family==='round'&&q.assisted));
  assert.notEqual(bridge[2].coach.n,470);
  await klick(page,'#nextBtn');
  await frageBeantworten(page,bridge[0]);
  assert.equal((await data(page,'ev')).round[1][1],1,'bridge success recorded as supported');
  assert.deepEqual(fehler,[]);
  await ctx.close();
});

test('bridge at end of round continues next time without lengthening the round',async()=>{
  const {ctx,page}=await open(roundQ(),[]);
  await klick(page,'#helpBtn');
  assert.equal((await data(page,'bridgeNext')).length,3);
  await klick(page,'#nextBtn');
  await klick(page,'#homeBtn');
  await klick(page,'#todayBtn');
  const s=await zustand(page);
  assert.equal(s.round.length,8);
  assert.deepEqual(s.round.slice(0,3).map(q=>q.bridgePart),['practice','practice','return']);
  await ctx.close();
});

test('later review uses fresh numbers, keeps its identity, and advances only after an independent success',async()=>{
  const {ctx,page}=await open();
  await klick(page,'#helpBtn');
  await page.evaluate(()=>{ const d=JSON.parse(localStorage.getItem('bq2_due'));d[0].at='2000-01-01';localStorage.setItem('bq2_due',JSON.stringify(d));localStorage.removeItem('bq2_bridgeNext'); });
  await klick(page,'#nextBtn');
  await klick(page,'#quitBtn');
  await klick(page,'#todayBtn');
  const s=await zustand(page), i=s.round.findIndex(q=>q.dueId);
  assert.ok(i>=0);
  assert.notEqual(s.round[i].coach.n,470);
  assert.equal(s.round[i].assisted,undefined);
  for(let f=0;f<=i;f++){ const z=await zustand(page);await frageBeantworten(page,z.round[z.idx]);await klick(page,'#nextBtn'); }
  assert.equal((await data(page,'due'))[0].box,1);
  await ctx.close();
});

test('place-value and two-step missing-part bridges keep the same family and valid answers',async()=>{
  const cases=[
    {kind:'mc',world:'numbers',label:'Numbers',prompt:'What is 7 worth in 5,678?',options:['7','70','700','7000'],answer:1,explain:'7 tens are 70.',coach:{family:'place-value',n:5678,pos:2}},
    {kind:'type',world:'wordprob',label:'Word Problems',prompt:'900 stickers, 200 and 300 counted: how many left?',answer:'400',explain:'200 + 300 + 400 = 900.',coach:{family:'missing-part',total:900,parts:[200,300]}}
  ];
  for(const q of cases){
    const {ctx,page,fehler}=await open(q);
    await klick(page,'#helpBtn');
    const s=await zustand(page), bridge=s.round.slice(1,4);
    assert.ok(bridge.every(b=>b.coach.family===q.coach.family));
    assert.deepEqual(bridge.map(b=>b.level),[1,1,2]);
    if(q.kind==='type') assert.equal(+bridge[2].answer,bridge[2].coach.total-bridge[2].coach.parts.reduce((a,b)=>a+b,0));
    else assert.notEqual(bridge[2].coach.n,q.coach.n);
    await klick(page,'#nextBtn');
    for(const b of bridge){await frageBeantworten(page,b);await klick(page,'#nextBtn');}
    assert.deepEqual(fehler,[]);
    await ctx.close();
  }
});

test('two options are explained immediately without a meaningless retry',async()=>{
  const q={kind:'mc',world:'numbers',label:'Numbers',prompt:'Is 8 odd or even?',options:['Odd','Even'],answer:1,explain:'8 can be paired without leftovers.'};
  const {ctx,page}=await open(q,[]);
  await klick(page,'#qAnswers .opt[data-i="0"]');
  assert.ok(await page.isVisible('#feedback .worked'));
  assert.ok(await page.isVisible('#nextBtn'));
  assert.equal(await page.locator('#feedback.hint').count(),0);
  await ctx.close();
});

test('typed answer stays visible for retry; corrected answer is not independent evidence',async()=>{
  const q={kind:'type',world:'wordprob',label:'Word Problems',prompt:'50 stickers. 20 counted. How many are left?',answer:'30',explain:'20 + 30 = 50.',coach:{family:'missing-part',total:50,parts:[20]}};
  const {ctx,page}=await open(q,[]);
  await klick(page,'#qAnswers .key[aria-label="2"]');
  await klick(page,'#qAnswers .key.go');
  assert.equal(await page.textContent('#typedOut'),'2');
  assert.ok(await page.isVisible('#feedback.hint'));
  await frageBeantworten(page,q);
  assert.equal(await page.textContent('#typedOut'),'30');
  assert.equal(await page.textContent('#roundStars'),'1');
  assert.equal((await data(page,'ev')).wordprob.length,1);
  await ctx.close();
});

test('order retry keeps correct prefix, marks right positions, and permits a corrected sequence',async()=>{
  const q={kind:'order',world:'anleitung',label:'Anleitung',prompt:'Ordne die Schritte.',items:['Wasser holen','Wasser einfüllen','Pflanze gießen','Aufräumen'],correct:[0,1,2,3],explain:'Erst holen, dann einfüllen, dann gießen, dann aufräumen.'};
  const {ctx,page,fehler}=await open(q,[]);
  for(const i of [0,2,1,3]) await klick(page,`#qAnswers .ord[data-i="${i}"]`);
  await klick(page,'#checkOrder');
  assert.ok(await page.isVisible('#feedback.hint'));
  assert.equal(await page.isEnabled('#qAnswers .ord[data-i="0"]'),false);
  for(const i of [1,2,3]) await klick(page,`#qAnswers .ord[data-i="${i}"]`);
  await klick(page,'#checkOrder');
  assert.ok(await page.isVisible('#feedback.good'));
  assert.deepEqual(fehler,[]);
  await ctx.close();
});

test('parent guidance and new research sources are included; unconfirmed methods identified',async()=>{
  const {ctx,page}=await appOeffnen(browser,server.url);
  await klick(page,'#aboutBtn');
  const ll=await aboutAbschnitt(page,'Lernlogik');
  assert.ok((await ll.textContent()).includes('begründeter Entwurf'));
  await aboutAbschnitt(page,'Quellen');
  assert.ok(await page.locator('#aboutBody a[href="https://doi.org/10.3102/0034654314564881"]').isVisible());
  await page.locator('#aboutBack').click();
  await elternOeffnen(page);await elternSeite(page,'guide');
  assert.ok((await page.textContent('#aboutBody')).includes('keine bestätigte schulweite Methode'));
  assert.equal(await page.locator('#aboutBody details.parent-method').count(),3);
  // Peter 31.10.: the planning list of later topics (no links, no use) is gone
  assert.ok(!(await page.textContent('#aboutBody')).includes('Lernlandkarte'));
  await page.locator('.phdr [data-plang="en"]').click();
  assert.ok((await page.textContent('#aboutBody')).includes('not a confirmed school-wide method'), 'cards in English too');
  await ctx.close();
});

test('column algorithm and grading references cannot reappear in randomly generated tasks or studios',async()=>{
  const {ctx,page}=await appOeffnen(browser,server.url);
  for(const card of await alleKarten(page)){
    await karteOeffnen(page,card);
    const text=await page.evaluate(()=>document.body.innerText.toLowerCase());
    assert.ok(!/extending|rubric tip|column subtraction|borrow from/.test(text));
  }
  await ctx.close();
});

for(const [name,width,height] of [['iPad mini',768,1024],['iPad',810,1080],['Smartphone',390,844],['Laptop',1366,768]]){
  test(`${name}: hint and correction can be used without horizontal overflow`,async()=>{
    const {ctx,page,fehler}=await appOeffnen(browser,server.url,{fixture:{world:'round',round:[roundQ(),...rest()]},viewport:{width,height},reducedMotion:'reduce'});
    await page.locator('#qAnswers .opt[data-i="0"]').click();
    assert.ok(await page.isVisible('#feedback.hint'));
    await page.locator('#qAnswers .opt[data-i="1"]').click();
    assert.ok(await page.isVisible('#feedback.good'));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    const rect=await page.locator('#nextBtn').boundingBox();
    assert.ok(rect.y>=0&&rect.y+rect.height<=height+1);
    await page.locator('#nextBtn').click();
    assert.equal((await zustand(page)).idx,1);
    assert.equal(await page.evaluate(()=>scrollY),0,'next question begins at the top');
    assert.deepEqual(fehler,[]);
    await ctx.close();
  });
}
