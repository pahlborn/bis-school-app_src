// W1: common knowledge status and gap progress without day gates.
// Synthetic school/account histories; actual app answers and parent touch rendering.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browserStarten, zustand } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'ABCD-EFGH', papa: 'PAPA-2345' };
const tag = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const txt = (de, en) => ({ de, en });
// one gap: M-N1 (Time & Numbers, RS); forces is the current topic
const SCHULE = { version: 1, kinder: { mia: { asOf: tag(-1), tasks: [
  { day: tag(-20), area: 'math', title: 'Check B', std: { 'M-N1': 'RS' }, quests: ['numbers'], focusNext: [], good: txt('b', 'b'), next: txt('', '') },
  { day: tag(-5), area: 'science', title: 'Forces', std: { 'S-F1': 'M' }, quests: ['forces'], focusNext: ['forces'], good: txt('c', 'c'), next: txt('Begründen.', 'Explain.') }
] } } };
const HAKEN = (app) => app.replace(/\}\)\(\);\s*<\/script>/, 'window.__g={assessQuest,openGaps,standOf,questProgress,recordAnswer,gapData};})();</script>');

let browser, server, meetingServer;
before(async () => {
  server = await kontenServer({ users: [await konto('mia', 'student', C.mia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] })] }, { schule: SCHULE, anpassen: HAKEN });
  const meeting=structuredClone(SCHULE);meeting.kinder.mia.tasks[0].std['M-N1']='M';
  meetingServer=await kontenServer({users:[await konto('mia','student',C.mia),await konto('papa','parent',C.papa,{kinder:['mia']})]},{schule:meeting,anpassen:HAKEN});
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); meetingServer?.close(); });

const ID = (n) => server.konten.users.find((u) => u.user === n).id;
/** first attempts on numbers: [days back, right?, level in the evidence (2 year level, 1 with help)] */
const reihe = (spec) => spec.map(([d, ok, lvl = 2]) => ({ day: tag(-d), skill: 'numbers', level: lvl, attempt: 1, ok, help: false }));
const daten = (a) => ({ attempts: a, ev: { numbers: a.map((x) => [x.day, x.level, x.ok ? 1 : 0]) }, gaps: null });
const mal = (n, tage, ok = true, lvl = 2) => Array.from({ length: n }, (_, i) => [tage[i % tage.length], ok, lvl]);
const setze = (page, d) => page.evaluate(([id, daten]) => { for (const [k, v] of Object.entries(daten)) { if (v === null) localStorage.removeItem('bq2_' + id + '__' + k); else localStorage.setItem('bq2_' + id + '__' + k, JSON.stringify(v)); } }, [ID('mia'), d]);
const sprache = async (page, l) => { await page.locator(`.phdr [data-plang="${l === 'de' ? 'en' : 'de'}"]`).click(); await page.locator(`.phdr [data-plang="${l}"]`).click(); };
async function mathe(page, l = 'de') {
  if (await page.$('#pBack')) await page.locator('#pBack').click();
  await sprache(page, l);   // render again with the new data
  await page.locator('[data-psubj="maths"]').click(); await page.waitForSelector('#pSchool');
  return page.locator('#pSchool .pgaps').innerText();
}
async function blick(page, l = 'de') {
  if (await page.$('#pBack')) await page.locator('#pBack').click();
  await sprache(page, l);
  return page.locator('#pGlance').innerText();
}
const breite = async (page, wo) => +(/width:(\d+)%/.exec(await page.locator(wo + ' .pgapbar i').getAttribute('style'))[1]);

// Synthetic non-secure cases: exact quantity/accuracy, no descriptive20/day gate.
const FAELLE = [
  {name:'five correct L2, weak school fallback until six',a:mal(5,[0]),de:/noch 1 Aufgabe auf Klassenniveau richtig/,en:/1 more grade-level task right/,w:83},
  {name:'70 percent L2: two sliding-window successes needed',a:mal(6,[0],false).concat(mal(14,[0])),de:/noch 2 Aufgaben auf Klassenniveau richtig/,en:/2 more grade-level tasks right/,w:90},
  {name:'20 successful foundations are not year-level mastery',a:mal(20,[0],true,1),de:/noch 6 Aufgaben auf Klassenniveau richtig/,en:/6 more grade-level tasks right/,w:0},
  {name:'five L2 plus foundations still needs one relevant L2',a:mal(5,[0]).concat(mal(12,[0],true,1)),de:/noch 1 Aufgabe auf Klassenniveau richtig/,en:/1 more grade-level task right/,w:83},
];

test('Auftrag 2: Balken unter 100 % und der passende Text, wenn genau eine Bedingung fehlt (DE/EN, Fachansicht und Auf einen Blick)', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'papa', C.papa); await passwortSetzen(page, 'Moon-Glass-Paper-8812');
  await page.waitForSelector('#parentClose');
  for (const f of FAELLE) {
    await setze(page, daten(reihe(f.a)));
    const a = await page.evaluate(() => window.__g.assessQuest('numbers'));
    assert.ok(!['m','e'].includes(a.level),f.name+': common status is not secure');
    let t = await mathe(page);
    assert.match(t, f.de, f.name + ': text (subject view)');
    assert.ok(!/Lücke geschlossen/.test(t), f.name + ': gap still open');
    const w = await breite(page, '#pSchool');
    assert.ok(w < 100, f.name + ': bar below 100 %'); assert.equal(w, f.w, f.name + ': bar = smallest share');
    for (const z of ['fällig', 'Rückstand', 'verpasst', 'Tage bis', 'Wochen', 'bis zum', 'weiter üben']) assert.ok(!t.includes(z), f.name + ': no ' + z);
    t = await mathe(page, 'en');
    assert.match(t, f.en, f.name + ': text in English');
    for (const z of [/overdue/, /behind/, /weeks/, /days until/, /\bdue\b/, /until the/]) assert.ok(!z.test(t), f.name + ': no ' + z);
    // "At a glance" uses the same function
    t = await blick(page);
    assert.match(t, f.de, f.name + ': same text at a glance');
    assert.equal(await breite(page, '#pGlance'), f.w, f.name + ': same bar at a glance');
  }
  assert.deepEqual(fehler, []);
  await ctx.close();
});

async function tapRight(page,q){
 if(await page.locator('#takeChallenge').isVisible())await page.locator('#takeChallenge').tap();
 if(q.kind==='mc')await page.locator('#qAnswers .opt[data-i="'+q.answer+'"]').tap();
 else if(q.kind==='type'){for(const digit of String(q.answer))await page.locator('#qAnswers .key[aria-label="'+digit+'"]').tap();await page.locator('#qAnswers .key.go').tap();}
 else{for(const i of q.correct)await page.locator('#qAnswers .ord[data-i="'+i+'"]').tap();await page.locator('#checkOrder').tap();}
 assert.ok(await page.locator('#feedback.good').isVisible());
}
test('W1 real touch journey separates reached M and held, permits help, survives a pause and shows later shaky answers',async()=>{
 const{ctx,page,fehler}=await oeffnen(browser,server,{viewport:{width:768,height:1024},hasTouch:true});
 try{
  await anmelden(page,'student','mia',C.mia);await passwortSetzen(page,'Tiger-Lamp-River-4271');await page.waitForSelector('#home:not([hidden])');
  const openNumbers=async()=>{await page.locator('#subjects button.subject').filter({hasText:'Maths'}).tap();await page.locator('[data-item="numbers"]').tap();};
  const home=async()=>{await page.locator('#homeBtn').tap();if(await page.locator('#subjectBack').isVisible())await page.locator('#subjectBack').tap();};
  const enterParent=async(first=false)=>{await page.locator('#adultBtn').tap();await anmelden(page,'adult','papa',C.papa);if(first)await passwortSetzen(page,'Moon-Glass-Paper-8812');await page.waitForSelector('#parentClose');};
  await openNumbers();let relevant=0;
  for(let i=0;i<8;i++){const s=await zustand(page),q=s.round[s.idx];if((q.level||2)===2)relevant++;await tapRight(page,q);await page.locator('#nextBtn').tap();}
  assert.ok(relevant>=6);assert.equal(await page.locator('#resScore').textContent(),'8');await home();
  let a=await page.evaluate(()=>window.__g.assessQuest('numbers'));assert.equal(a.level,'m');assert.equal(a.days,1);
  assert.equal(await page.evaluate(()=>window.__g.openGaps().length),1,'M alone leaves gap open');
  await enterParent(true);let t=await mathe(page);assert.match(t,/Sicher erreicht/);assert.match(t,/Lücke noch offen/);
  const journey=page.locator('[data-journey="M-N1"]');assert.equal(await journey.locator('.gjstations>li').count(),4);assert.equal(await journey.locator('[data-stage="4"].done').count(),0);
  assert.match(await journey.innerText(),/Erste Antworten nach der Schulbewertung/);assert.match(await journey.innerText(),/von 6 bearbeitet/);
  await page.locator('#parentClose').tap();await page.waitForSelector('#home:not([hidden])');await openNumbers();
  for(let i=0;i<8;i++){const s=await zustand(page),q=s.round[s.idx];if(i===0){if(await page.locator('#takeChallenge').isVisible())await page.locator('#takeChallenge').tap();await page.locator('#helpBtn').tap();}await tapRight(page,q);await page.locator('#nextBtn').tap();}
  await home();await enterParent();t=await mathe(page);assert.match(t,/Lücke geschlossen/);assert.equal(await journey.locator('[data-stage="4"].done').count(),1);
  assert.match(await journey.innerText(),/Gehalten · 6 von 6 richtig/);assert.ok(await page.evaluate(()=>window.__g.gapData().journey['M-N1'].quests.numbers.checks.some(x=>x.help)),'real help-first answer still confirms');
  for(const lang of['de','en']){await mathe(page,lang);for(const viewport of[{width:768,height:1024},{width:1024,height:768}]){
   await page.setViewportSize(viewport);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert.equal(await journey.locator('.gjstations>li').count(),4);
   const boxes=await journey.locator('.gjstations>li').evaluateAll(es=>es.map(e=>({x:Math.round(e.getBoundingClientRect().x),y:Math.round(e.getBoundingClientRect().y)})));
   if(viewport.width===768)assert.equal(new Set(boxes.map(b=>b.x)).size,1,'portrait: one vertical connected track');else assert.equal(new Set(boxes.map(b=>b.y)).size,1,'landscape: four stations in one connected row');
   assert.ok(await page.locator('[data-gapact="hold"][data-gapstd="M-N1"]').evaluate(e=>e.getBoundingClientRect().height>=44));
   await journey.screenshot({path:process.env.BQ_HELD_SCREENSHOTS?process.env.BQ_HELD_SCREENSHOTS+'/'+lang+'-'+viewport.width+'.png':'/tmp/bq-held-'+lang+'-'+viewport.width+'.png'});
  }}
  await page.locator('[data-gapact="hold"][data-gapstd="M-N1"]').tap();assert.equal(await page.evaluate(()=>window.__g.openGaps().length),1);assert.match(await journey.innerText(),/kept open by you/);
  await page.locator('[data-gapact="close"][data-gapstd="M-N1"]').tap();assert.match(await journey.innerText(),/Closed by you/);
  await page.evaluate(()=>{for(let i=0;i<25;i++)window.__g.recordAnswer({world:'numbers',level:2},false);});
  t=await mathe(page,'en');assert.match(t,/Shaky lately/);assert.equal(await page.evaluate(()=>window.__g.openGaps().length),0);
  await page.clock.install({time:Date.now()});await page.clock.setFixedTime(new Date(Date.now()+31*864e5));await page.reload();await page.waitForSelector('#parentClose:visible,#home:not([hidden]),#login:not([hidden])');
  if(!await page.locator('#parentClose').isVisible()){
   if(await page.locator('#home').isVisible())await page.locator('#adultBtn').tap();
   await anmelden(page,'adult','papa','Moon-Glass-Paper-8812');await page.waitForSelector('#parentClose');
  }
  t=await mathe(page,'en');assert.match(t,/Gap closed/);assert.match(t,/Shaky lately/);assert.deepEqual(fehler,[]);
 }finally{await ctx.close();}
});
test('W1 parent shows the school M starting point with five wrong own answers and its actual basis',async()=>{
 const{ctx,page,fehler}=await oeffnen(browser,meetingServer,{viewport:{width:768,height:1024},hasTouch:true});
 try{
  await anmelden(page,'student','mia',C.mia);await passwortSetzen(page,'Tiger-Lamp-River-4271');await page.waitForSelector('#home:not([hidden])');
  const id=meetingServer.konten.users.find(u=>u.user==='mia').id;
  await page.evaluate(([id,day])=>{const a=Array.from({length:5},()=>({day,skill:'numbers',level:2,attempt:1,ok:false,help:false}));localStorage.setItem('bq2_'+id+'__attempts',JSON.stringify(a));localStorage.setItem('bq2_'+id+'__ev',JSON.stringify({numbers:a.map(x=>[x.day,2,0])}));},[id,tag(0)]);
  await page.locator('#adultBtn').tap();await anmelden(page,'adult','papa',C.papa);await passwortSetzen(page,'Moon-Glass-Paper-8812');await page.waitForSelector('#parentClose');
  for(const lang of['de','en']){
   if(await page.locator('#pBack').count())await page.locator('#pBack').tap();await sprache(page,lang);await page.locator('[data-psubj="maths"]').tap();
   const card=page.locator('.pquest').filter({has:page.locator('[data-pfocus="numbers"]')});
   assert.match(await card.locator('.pqchips .pst').first().innerText(),lang==='de'?/Sicher/:/Secure/);await card.locator('.pbasis summary').tap();
   assert.match(await card.innerText(),lang==='de'?/Ausgangspunkt laut Schule/:/Starting point from school/);assert.doesNotMatch(await card.innerText(),/Noch nicht einschätzbar|Not yet possible to judge/);
  }
  assert.deepEqual(fehler,[]);
 }finally{await ctx.close();}
});
test('W1 affected explanatory text removes knowledge-day demands while descriptive calendars remain',async()=>{
 const{appLesen}=await import('../werkzeug/module.mjs');const html=appLesen('utf8');
 for(const old of['6 Antworten an 2 Tagen','6 answers on 2 days','KEY.minDays','KEY.meetsDays','KEY.extDays','CONF.days','8 Aufgaben an 3 Tagen','8 tasks on 3 days','20 Aufgaben an 5 Übungstagen','20 tasks on 5 practice days','fewer than 6 answers or fewer than 2 days'])assert.ok(!html.includes(old),old);
 assert.ok(html.includes('Belegumfang')&&html.includes('Evidence amount'));assert.ok(html.includes('in den letzten 14 Tagen')&&html.includes('in the last 14 days'));
 assert.ok(html.includes('nach 1, 3, 6, 10, 15 und 25 Tagen')&&html.includes('after 1, 3, 6, 10, 15 and 25 days'),'tree remains for later EP05');
});
