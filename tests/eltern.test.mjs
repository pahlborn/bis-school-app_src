import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {appServer,browserStarten,appOeffnen,klick,elternOeffnen,elternSeite,zurStart,zustand} from './app-hilfen.mjs';
let server,browser;
before(async()=>{server=await appServer();browser=await browserStarten();});
after(async()=>{await browser?.close();server?.close();});
const open=o=>appOeffnen(browser,server.url,o);
const data=(p,k)=>p.evaluate(k=>JSON.parse(localStorage.getItem('bq2_'+k)||'null'),k);
async function unlock(page,pin='4826'){
  await page.fill('#parentPin',pin);
  await page.locator('#parentForm button[type="submit"]').click();
}

test('first setup stores a salted PIN verifier, not the PIN; mismatched confirmation does not unlock',async()=>{
  const {ctx,page}=await open();
  await klick(page,'#aboutBtn');await klick(page,'#tabSheets');
  await page.fill('#parentPin','4826');await page.fill('#parentPinAgain','4827');
  await page.locator('#parentForm button').click();
  assert.equal(await data(page,'parentPin'),null);
  assert.equal(await page.locator('#storyCap').count(),0);
  await page.fill('#parentPinAgain','4826');await page.locator('#parentForm button').click();
  await page.waitForSelector('#parentClose');
  const stored=await data(page,'parentPin');
  assert.equal(stored.salt.length,16);assert.equal(stored.hash.length,64);
  assert.ok(!JSON.stringify(stored).includes('4826'));
  await ctx.close();
});

test('wrong PIN and reload never expose observations or settings; correct PIN opens them',async()=>{
  const {ctx,page,fehler}=await open();
  await elternOeffnen(page);await page.reload();
  await page.waitForSelector('#aboutBtn');await klick(page,'#aboutBtn');await klick(page,'#tabSheets');
  assert.equal(await page.locator('#focusForm').count(),0);assert.equal(await page.locator('.psubject').count(),0);
  await unlock(page,'1111');await page.waitForFunction(()=>document.querySelector('#parentMessage').textContent.includes('stimmt nicht'));
  assert.equal(await page.locator('.psubject').count(),0);
  await unlock(page);await page.waitForSelector('#parentClose');
  assert.ok(await page.locator('.psubject').count()>0);
  assert.deepEqual(fehler,[]);await ctx.close();
});

test('leaving or explicitly locking removes protected content; direct #eltern still requires PIN',async()=>{
  const {ctx,page}=await open();
  await elternOeffnen(page);await klick(page,'#aboutBack');
  assert.equal(await page.locator('.psubject').count(),0);
  await page.evaluate(()=>location.hash='eltern');await page.waitForSelector('#parentForm');
  assert.equal(await page.locator('#focusForm').count(),0);
  await unlock(page);await page.waitForSelector('#parentClose');await klick(page,'#parentClose');
  assert.equal(await page.locator('#storyCap').count(),0);
  await ctx.close();
});

test('idle and background locks do not leave hidden observation DOM behind',async()=>{
  const {ctx,page}=await open();await page.clock.install();
  await elternOeffnen(page);
  await page.clock.fastForward(5*60*1000+1);
  await page.waitForSelector('#parentForm');
  assert.equal(await page.locator('.psubject').count(),0);
  await unlock(page);await page.waitForSelector('#parentClose');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  assert.equal(await page.locator('.psubject').count(),0);
  assert.ok(await page.isVisible('#parentForm'));
  await ctx.close();
});

test('an in-flight PIN check cannot reopen the area after it was left or hidden',async()=>{
  const {ctx,page}=await open();await elternOeffnen(page);await klick(page,'#parentClose');
  await page.fill('#parentPin','4826');
  await page.evaluate(()=>{
    const original=crypto.subtle.deriveBits.bind(crypto.subtle);
    crypto.subtle.deriveBits=async(...args)=>{await new Promise(r=>setTimeout(r,200));return original(...args);};
    document.querySelector('#parentForm').requestSubmit();
    document.querySelector('#aboutBack').click();
    document.querySelector('#aboutBtn').click();
    document.querySelector('#tabSheets').click();
  });
  await page.waitForTimeout(350);
  assert.ok(await page.isVisible('#parentForm'));
  assert.equal(await page.locator('.psubject').count(),0);
  await ctx.close();
});

test('parent-selected focus persists and controls Today, badges and paper worksheets',async()=>{
  const {ctx,page}=await open();await elternOeffnen(page);await elternSeite(page,'settings');
  await page.locator('#focusForm input').evaluateAll(inputs=>inputs.forEach(i=>i.checked=i.value==='units'));
  await page.locator('#focusForm button[type="submit"]').click();
  assert.deepEqual(await data(page,'focus'),['units']);
  await zurStart(page);
  const signs=await page.$$eval('#subjects .focus',e=>e.map(x=>x.textContent));
  assert.deepEqual(signs,['1 focus']);
  await klick(page,'#todayBtn');assert.ok((await zustand(page)).round.every(q=>q.world==='units'));
  await zurStart(page);await page.evaluate(()=>window.print=()=>{});await klick(page,'#sheetBtn');await page.locator('#sheetClose').click();
  assert.ok((await data(page,'sheets'))[0].items.every(i=>i.q.world==='units'));
  await page.reload();await klick(page,'#todayBtn');assert.ok((await zustand(page)).round.every(q=>q.world==='units'));
  await ctx.close();
});

test('empty focus remains empty but allows mixed practice; restore-default control works',async()=>{
  const {ctx,page}=await open();await elternOeffnen(page);await elternSeite(page,'settings');
  await page.locator('#focusForm input').evaluateAll(inputs=>inputs.forEach(i=>i.checked=false));
  await page.locator('#focusForm button[type="submit"]').click();
  assert.deepEqual(await data(page,'focus'),[]);
  await zurStart(page);await klick(page,'#todayBtn');assert.equal((await zustand(page)).round.length,8);
  await zurStart(page);await elternOeffnen(page);await elternSeite(page,'settings');await klick(page,'#focusDefault');
  assert.equal((await data(page,'focus')).length,8);await ctx.close();
});

test('observation overview uses the school words only behind PIN and labels shared evidence honestly',async()=>{
  const {ctx,page}=await open();
  await page.evaluate(()=>{
    localStorage.setItem('bq2_ev',JSON.stringify({round:Array.from({length:10},(_,i)=>['2026-10-'+(20+i%3),2,1])}));
    localStorage.setItem('bq2_attempts',JSON.stringify(Array.from({length:10},(_,i)=>({day:'2026-10-'+(20+i%3),skill:'round',level:2,attempt:1,ok:true,help:false}))));
  });
  await elternOeffnen(page);
  await page.locator('[data-psubj="maths"]').click();
  const text=await page.textContent('#aboutBody');
  assert.ok(text.includes('Meeting expectations'));
  assert.ok(text.includes('vorläufig'),'10 tasks on 3 days: only provisional');
  assert.ok(text.includes('Worauf beruht das?'));
  assert.ok(text.includes('keine schulische Beurteilung'));
  await zurStart(page);
  assert.ok(!(await page.evaluate(()=>document.body.innerText)).includes('Meeting expectations'));
  await ctx.close();
});

test('calendar download has valid recurrence, escaping, folding and reminder with no child identity',async()=>{
  const {ctx,page}=await open();await elternOeffnen(page);await elternSeite(page,'settings');
  await page.locator('#reminderForm input[value="MO"]').check();
  await page.locator('#reminderForm input[value="TH"]').check();
  await page.fill('#reminderTime','17:30');
  await page.fill('#reminderText','Rätsel, Spaß; '+ 'Überraschung '.repeat(5));
  const downloaded=page.waitForEvent('download');
  await page.locator('#reminderForm button').click();const download=await downloaded;
  const stream=await download.createReadStream();let text='';for await(const chunk of stream)text+=chunk;
  const unfolded=text.replace(/\r\n /g,'');
  assert.ok(unfolded.includes('RRULE:FREQ=WEEKLY;BYDAY=MO,TH'));
  assert.ok(unfolded.includes('SUMMARY:Rätsel\\, Spaß\\;'));
  assert.match(unfolded,/DTSTART:\d{8}T173000\r\n/);
  assert.ok(unfolded.includes('BEGIN:VALARM'));
  assert.ok(!unfolded.includes('bq2_'));
  assert.ok(text.split('\r\n').every(l=>Buffer.byteLength(l,'utf8')<=75));
  assert.ok(text.endsWith('END:VCALENDAR\r\n'));await ctx.close();
});

test('calendar requires selected days instead of inventing a practice schedule',async()=>{
  const {ctx,page}=await open();await elternOeffnen(page);await elternSeite(page,'settings');await page.fill('#reminderTime','17:30');
  await page.locator('#reminderForm button').click();
  assert.ok((await page.textContent('#reminderMessage')).includes('mindestens einen Tag'));
  await ctx.close();
});

test('focus and PIN forms fit on a small phone',async()=>{
  const {ctx,page}=await open({viewport:{width:320,height:568}});await elternOeffnen(page);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await ctx.close();
});
