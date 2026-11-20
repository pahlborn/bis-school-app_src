// EP04 real UI, synthetic family. These explicit modes also work when the runner selects the event build.
import{test,before,after}from'node:test';
import assert from'node:assert/strict';
import{createHash}from'node:crypto';
import{readFile}from'node:fs/promises';
import{konto,kontenServer,oeffnen,anmelden,passwortSetzen}from'./konten-hilfen.mjs';
import{appServer,appOeffnen,elternOeffnen,browserStarten,zustand,frageBeantworten,klick}from'./app-hilfen.mjs';
import{mkdir}from'node:fs/promises';
import path from'node:path';
const code={mia:'ABCD-EFGH',papa:'PAPA-2345',frau:'FRAU-2345',chef:'CHEF-2345'},password={mia:'Tiger-Lamp-River-4271',papa:'Moon-Glass-Paper-8812',frau:'Teacher-Only-Ready-123',chef:'Admin-Only-Ready-123'};
const hook=h=>h.replace(/\}\)\(\);\s*<\/script>/,()=>`window.__contentTest={read:(k,d)=>store.get(k,d),day:dayKey,home:()=>{show('home');renderHome();},start:startRound,word:()=>dailyContent(DAILY_WORD_DATA.items,dayKey()),explain:()=>dailyContent(DAILY_EXPLAIN_DATA.items,dayKey()),events:()=>EV_LESEN?evKindZielLog(evPre()).liste():[],errors:()=>eventErrors};})();</script>`);
let browser,accounts;const servers=[];
before(async()=>{browser=await browserStarten();accounts={users:[await konto('mia','student',code.mia),await konto('papa','parent',code.papa,{kinder:['mia']}),await konto('frau','teacher',code.frau),await konto('chef','parent',code.chef,{admin:true})]};});
after(async()=>{await browser?.close();for(const s of servers)s.close();});
async function setup(bauart,lang='en',viewport={width:768,height:1024}){
 const server=await kontenServer(accounts,{bauart,anpassen:hook});servers.push(server);
 const a=await oeffnen(browser,server,{viewport,hasTouch:true,isMobile:true,reducedMotion:'reduce'});
 await a.page.clock.setFixedTime(new Date('2026-11-20T10:00:00Z'));await anmelden(a.page,'student','mia',code.mia);await passwortSetzen(a.page,password.mia);await a.page.waitForSelector('#home:not([hidden])');
 if(await a.page.locator('#greetDlg[open]').count())await a.page.locator('#greetSkip').tap();
 const id=server.konten.users.find(u=>u.user==='mia').id,pre='bq2_'+id+'__';
 if(lang==='de'){await a.page.evaluate(pre=>localStorage.setItem(pre+'kidLang','"de"'),pre);await a.page.reload();await a.page.waitForSelector('#home:not([hidden])');}
 return{...a,server,id,pre};
}
const learning=page=>page.evaluate(()=>Object.fromEntries(['total','ev','attempts','tried','badges'].map(k=>[k,window.__contentTest.read(k,null)])));
async function parent(page,user='papa'){await page.locator('#adultBtn').tap();await anmelden(page,'adult',user,code[user]);await passwortSetzen(page,password[user]);await page.waitForSelector('#parentClose');}
for(const bauart of['live','test'])test(`${bauart}: daily word has no learning credit; real round story/joke feedback survives reload and parent read`,async()=>{
 const{ctx,page,fehler}=await setup(bauart);try{
  const before=await learning(page),word=await page.evaluate(()=>window.__contentTest.word());
  assert.equal(await page.locator('#totalStars').textContent(),'0');assert.equal(await page.locator('#pDailyExplain:visible').count(),0);
  await page.locator('[data-open-word]').tap();assert.deepEqual(await page.locator('[data-word-option]').allTextContents(),word.options);
  await page.locator(`[data-word-option="${word.answer}"]`).tap();assert.ok((await page.locator('#dailyWord').innerText()).includes(word.example));await page.locator('#dailyWord [data-content-vote="up"]').tap();
  assert.deepEqual(await learning(page),before,'word exploration and its vote produce no stars, attempts or knowledge');
  await page.evaluate(()=>window.__contentTest.start('numbers'));
  for(let i=0;i<8;i++){const s=await zustand(page);await frageBeantworten(page,s.round[s.idx]);await klick(page,'#nextBtn');}
  await page.locator('[data-treat="story"]').tap();await page.locator('[data-story]').first().tap();await page.locator('#storyText [data-content-vote="down"]').tap();
  const story=await page.locator('#storyText [data-content-vote]').first().getAttribute('data-content-item');
  await page.locator('[data-treat="joke"]').tap();const rejected=await page.locator('#treatBody [data-content-vote]').first().getAttribute('data-content-item');
  await page.locator('#treatBody [data-content-vote="down"]').tap();await page.locator('#treatBody [data-content-vote="up"]').tap();await page.locator('[data-treat="joke"]').tap();
  assert.notEqual(await page.locator('#treatBody [data-content-vote]').first().getAttribute('data-content-item'),rejected);
  await page.reload();await page.waitForSelector('#home:not([hidden])');
  assert.ok((await page.evaluate(()=>window.__contentTest.read('jokeRejected',[]))).includes(rejected));
  assert.equal((await page.evaluate(()=>window.__contentTest.read('contentFeedback',{})))['story:'+story].value,'down');
  await page.locator('[data-open-word]').tap();assert.equal(await page.locator('#dailyWord h3').textContent(),word.word);assert.equal(await page.locator('#dailyWord [data-content-vote="up"]').getAttribute('aria-pressed'),'true');
  await parent(page);assert.equal(await page.locator('#pContentFeedback').count(),1);assert.ok((await page.locator('#pContentFeedback').innerText()).includes('👍'));assert.ok((await page.locator('#pContentFeedback').innerText()).includes('Pisolala'));
  assert.equal(await page.locator('#pDailyExplain [data-content-vote]').count(),0);assert.ok((await page.locator('#pDailyExplain').innerText()).includes((await page.evaluate(()=>window.__contentTest.explain())).question));
  const saved=await page.evaluate(()=>window.__contentTest.read('contentFeedback',{}));await page.reload();await page.waitForSelector('#parentClose');assert.deepEqual(await page.evaluate(()=>window.__contentTest.read('contentFeedback',{})),saved);assert.equal(await page.locator('[data-content-vote]:visible').count(),0);
  assert.deepEqual(fehler,[]);
 }finally{await ctx.close();}
});
test('live: real file backup/restore and undo keep permanent joke rejection; event build remains blocked elsewhere',async()=>{
 const{ctx,page,fehler,server,id,pre}=await setup('live');try{
  // Actual child UI creates the ban before entering the existing parent restore route.
  await page.evaluate(()=>window.__contentTest.start('numbers'));for(let i=0;i<8;i++){const s=await zustand(page);await frageBeantworten(page,s.round[s.idx]);await klick(page,'#nextBtn');}
  await page.locator('[data-treat="joke"]').tap();const rejected=await page.locator('#treatBody [data-content-vote]').first().getAttribute('data-content-item');await page.locator('#treatBody [data-content-vote="down"]').tap();
  await page.locator('#homeBtn').tap();await parent(page);await page.locator('#pSettings').tap();await page.locator('details[data-psec="backup"] > summary').tap();
  const[download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-backup]').click()]);const backup=JSON.parse(await readFile(await download.path(),'utf8'));assert.ok(JSON.parse(backup.data.jokeRejected).includes(rejected));assert.ok(JSON.parse(backup.data.contentFeedback)['joke:'+rejected]);
  const data={total:'0'},audio=[],body={format:'bq-sicherung-1',child:id,user:'mia',createdAt:'2026-11-20T08:00:00Z',data,audio};body.sha256=createHash('sha256').update(JSON.stringify({data,audio})).digest('hex');
  await page.locator('#pRestoreFile').setInputFiles({name:'synthetic-older-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(body))});await page.waitForSelector('#pRestoreGo');await page.locator('#pRestoreGo').tap();
  assert.ok((await page.evaluate(()=>window.__contentTest.read('jokeRejected',[]))).includes(rejected),'an older valid file cannot undo a joke rejection');
  await page.locator('[data-restoreundo]').tap();assert.ok((await page.evaluate(()=>window.__contentTest.read('jokeRejected',[]))).includes(rejected));assert.deepEqual(fehler,[]);
 }finally{await ctx.close();}
});
for(const user of['frau','chef'])test(`${user}: a granted adult neither sees private feedback/Explain nor changes it on navigation/reload`,async()=>{
 const{ctx,page,fehler,server,id,pre}=await setup('live');try{
  const adult=server.konten.users.find(u=>u.user===user).id,parentID=server.konten.users.find(u=>u.user==='papa').id;
  await page.evaluate(({pre,adult,parentID})=>{
   localStorage.setItem(pre+'contentFeedback',JSON.stringify({'joke:gb-bored-goat':{kind:'joke',item:'gb-bored-goat',value:'down'}}));localStorage.setItem(pre+'jokeRejected','["gb-bored-goat"]');
   localStorage.setItem(pre+'grants',JSON.stringify([{id:'g-content',grantee:adult,by:parentID,scope:['learning','school'],from:'2026-11-20',until:'2026-11-30'}]));
  },{pre,adult,parentID});
  const raw=()=>page.evaluate(pre=>['contentFeedback','jokeRejected','events'].map(k=>localStorage.getItem(pre+k)),pre),before=await raw();
  await parent(page,user);assert.equal(await page.locator('#pContentFeedback').count(),0);assert.equal(await page.locator('#pDailyExplain').count(),0);assert.equal(await page.locator('[data-content-vote]:visible').count(),0);
  await page.locator('[data-psubj="maths"]').tap();await page.locator('#pBack').tap();await page.reload();await page.waitForSelector('#parentClose');assert.deepEqual(await raw(),before);assert.equal(await page.locator('#pContentFeedback').count(),0);assert.equal(await page.locator('#pDailyExplain').count(),0);assert.deepEqual(fehler,[]);
 }finally{await ctx.close();}
});
test('DE/US-EN daily word and existing parent overview are touch-readable at 320/768/1024 without hover',async()=>{
 const source=await appServer({bauart:'live'});servers.push(source);
 for(const lang of['de','en'])for(const [width,height]of[[320,768],[768,1024],[1024,768]]){
  const{ctx,page,fehler}=await appOeffnen(browser,source.url,{viewport:{width,height},hasTouch:true,isMobile:true,reducedMotion:'reduce',zeit:'2026-11-20T10:00:00Z'});try{
   await page.evaluate(lang=>localStorage.setItem('bq2_kidLang',JSON.stringify(lang)),lang);await page.reload();await page.waitForSelector('#home:not([hidden])');
   await page.locator('[data-open-word]').tap();await page.locator('[data-word-option]').first().tap();await page.locator('#dailyWord [data-content-vote="up"]').tap();
   assert.equal(await page.evaluate(()=>matchMedia('(hover: none)').matches),true);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'word has no horizontal overflow at '+width);
   for(const selector of['[data-open-word]','#dailyWord [data-content-vote="up"]','#dailyWord [data-content-vote="down"]']){const r=await page.locator(selector).boundingBox();assert.ok(r.width>=44&&r.height>=44,selector);}
   if(process.env.BQ_SCREEN_DIR){await mkdir(process.env.BQ_SCREEN_DIR,{recursive:true});await page.locator('#dailyWord').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(process.env.BQ_SCREEN_DIR,`word-${lang}-${width}.png`)});}
   await elternOeffnen(page);await page.locator(`.phdr [data-plang="${lang}"]`).tap();assert.equal(await page.locator('#pContentFeedback').count(),1);assert.equal(await page.locator('#pDailyExplain').count(),1);assert.equal(await page.locator('#pDailyExplain [data-content-vote]').count(),0);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'parent has no horizontal overflow at '+width);
   if(process.env.BQ_SCREEN_DIR){await page.locator('#pContentFeedback').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(process.env.BQ_SCREEN_DIR,`parent-${lang}-${width}.png`)});}
   assert.deepEqual(fehler,[]);
  }finally{await ctx.close();}
 }
});
