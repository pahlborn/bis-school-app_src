// S9 phase 4 (30.10.): the title chip gets a symbol and colour, one celebration per new title,
// and a path of all five titles. EP03: knowledge promotes; legacy titles stay.
//   node --test tests/titel.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import{createHash}from'node:crypto';
import{readFile}from'node:fs/promises';
import{konto,kontenServer,oeffnen,anmelden,passwortSetzen}from'./konten-hilfen.mjs';
import { titleRows } from './module/titel-fixtures.mjs';
import { RANK_POLICY } from '../src/module/titel.mjs';
import { appServer, browserStarten, appOeffnen,frageBeantworten,zustand,klick } from './app-hilfen.mjs';

let browser, server, family;
const CODE={mia:"ABCD-EFGH",papa:"PAPA-2345",frau:"FRAU-2345",chef:"CHEF-2345"};
const PASSWORD={mia:"Tiger-Lamp-River-4271",papa:"Moon-Glass-Paper-8812",frau:"Teacher-Only-Ready-123",chef:"Admin-Only-Ready-123"};
before(async () => { server = await appServer(); browser = await browserStarten(); family=await kontenServer({users:[await konto('mia','student',CODE.mia),await konto('papa','parent',CODE.papa,{kinder:['mia']}),await konto('frau','teacher',CODE.frau),await konto('chef','parent',CODE.chef,{admin:true})]},{anpassen:h=>h.replace(/\}\)\(\);\s*<\/script>/,()=>`window.__titleTest={start:startRound,home:()=>{show('home');renderHome();},read:k=>store.get(k,0),title:shownRank,render:renderRank};})();</script>`)}); });
after(async () => { await browser?.close(); server?.close(); family?.close(); });

const TITEL = [[0, '🧭', 'Explorer'], [25, '🔍', 'Investigator'], [60, '🔬', 'Scientist'], [120, '🎓', 'Professor'], [250, '🌟', 'Legend']];
const VERBOTEN = /\b(grade|score|better|best|Requires|Consolidating|Meeting|Extending)\b/i;
const evFor=(keys,ext=0)=>Object.fromEntries(keys.map((k,i)=>[k,titleRows(i<ext?'E':'M')]));

async function mitDaten(daten, kontext = {}) {
  const a = await appOeffnen(browser, server.url, kontext);
  await a.page.evaluate((d) => { for (const [k, v] of Object.entries(d)) { if(v===null)localStorage.removeItem('bq2_'+k);else localStorage.setItem('bq2_' + k, JSON.stringify(v)); } }, {total:0,rankSeen:'Explorer',rankPolicy:RANK_POLICY,...daten});
  await a.page.reload(); await a.page.waitForSelector('#home h1');
  return a;
}
const lies = (page, k) => page.evaluate((key) => JSON.parse(localStorage.getItem('bq2_' + key)), k);
const feiern = (page) => page.evaluate(() => +(document.querySelector('#confetti').dataset.runs || 0));
const kontrast = (page) => page.$eval('#rank', (e) => {
  const rgb = (s) => s.match(/\d+/g).slice(0, 3).map(Number);
  const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const s = getComputedStyle(e), a = lum(rgb(s.color)), b = lum(rgb(s.backgroundColor));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
});

for (const [sterne, symbol, name] of TITEL) {
  test(`${sterne} stars: chip shows ${symbol} ${name} with readable contrast`, async () => {
    const { ctx, page, fehler } = await mitDaten({ total: sterne, rankSeen: name });
    assert.equal(await page.textContent('#rankIcon'), symbol);
    assert.equal(await page.textContent('#rankName'), name);
    assert.ok(await kontrast(page) >= 4.5, 'contrast ' + await kontrast(page));
    assert.deepEqual(fehler, []);
    await ctx.close();
  });
}

test('new title: exactly one celebration and one line; reload does not celebrate again', async () => {
  const { ctx, page, fehler } = await mitDaten({ total: 0, rankSeen: 'Explorer',ev:evFor(['numbers','round','combos']) });
  await page.waitForTimeout(400);
  assert.equal(await feiern(page), 1);
  assert.equal(await page.locator('#rankNote:visible').count(), 1);
  assert.equal(await page.textContent('#rankNote'), 'New title: 🔍 Investigator!');
  assert.equal(await lies(page, 'rankSeen'), 'Investigator');
  await page.reload(); await page.waitForSelector('#home h1'); await page.waitForTimeout(400);
  assert.equal(await feiern(page), 0);
  assert.equal(await page.isVisible('#rankNote'), false);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('first start with many stars: title remembered quietly, no celebration', async () => {
  const { ctx, page } = await mitDaten({ total: 130,rankPolicy:null });
  await page.evaluate(() => {localStorage.removeItem('bq2_rankSeen');localStorage.removeItem('bq2_rankPolicy');});
  await page.reload(); await page.waitForSelector('#home h1'); await page.waitForTimeout(400);
  assert.equal(await feiern(page), 0);
  assert.equal(await page.isVisible('#rankNote'), false);
  assert.equal(await lies(page, 'rankSeen'), 'Professor');
  await ctx.close();
});

test('knowledge jumps over several titles: one celebration for the highest', async () => {
  const { ctx, page } = await mitDaten({ total: 0, rankSeen: 'Investigator',ev:evFor(['numbers','round','combos','wordprob','detective','forces','units','graphs','words','opinion','sentences','anleitung'],2) });
  await page.waitForTimeout(400);
  assert.equal(await feiern(page), 1);
  assert.equal(await page.textContent('#rankNote'), 'New title: 🎓 Professor!');
  await ctx.close();
});

test('title never goes down', async () => {
  const { ctx, page } = await mitDaten({ total: 30, rankSeen: 'Scientist' });
  assert.equal(await page.textContent('#rankName'), 'Scientist');
  await ctx.close();
});

test('reduced motion: no confetti, the line still appears', async () => {
  const { ctx, page } = await mitDaten({ total: 0, rankSeen: 'Investigator',ev:evFor(['numbers','round','combos','wordprob','detective','forces']) }, { reducedMotion: 'reduce' });
  await page.waitForTimeout(400);
  assert.equal(await feiern(page), 0);
  assert.equal(await page.textContent('#rankNote'), 'New title: 🔬 Scientist!');
  await ctx.close();
});

for (const [sterne, satz] of [[13, 'Next: Investigator · 3 more secure quests'], [59, 'Next: Scientist · 6 more secure quests · 2 more subjects'], [250, 'You are a Legend! Keep exploring.']]) {
  test(`explorer path with ${sterne} stars (real click, fully on a 320 px phone): "${satz}"`, async () => {
    const { ctx, page, fehler } = await mitDaten({ total: sterne, rankSeen: TITEL.filter((t) => sterne >= t[0]).pop()[2] }, { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
    await page.locator('#rank').click();
    assert.deepEqual(await page.$$eval('#rankPath li', (l) => l.map((x) => x.children[1].textContent)), TITEL.map((t) => t[2]));
    assert.equal(await page.textContent('#rankNext'), satz);
    const imBild = await page.$eval('#rankDlg', (d) => { const r = d.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && d.scrollWidth <= d.clientWidth; });
    assert.ok(imBild, 'path fully on screen');
    const text = await page.textContent('#rankDlg') + await page.textContent('#rank');
    assert.ok(!VERBOTEN.test(text), text);
    await page.locator('#rankClose').click();
    assert.equal(await page.isVisible('#rankDlg'), false);
    assert.deepEqual(fehler, []);
    await ctx.close();
  });
}

const familyID=user=>family.konten.users.find(u=>u.user===user).id;
const familyPrefix=()=>`bq2_${familyID('mia')}__`;
async function child(page){await anmelden(page,'student','mia',CODE.mia);await passwortSetzen(page,PASSWORD.mia);await page.waitForSelector('#home:not([hidden])');}
async function grownup(page,user){await page.locator('#adultBtn').click();await anmelden(page,'adult',user,CODE[user]);await passwortSetzen(page,PASSWORD[user]);await page.waitForSelector('#parentClose');}
const rawTitle=page=>page.evaluate(pre=>Object.fromEntries(['rankSeen','rankPolicy'].map(k=>[k,localStorage.getItem(pre+k)])),familyPrefix());

test('actual family login and real Numbers tasks reach the third M at zero total stars; reload keeps title without another celebration',async()=>{
 const{ctx,page,fehler}=await oeffnen(browser,family,{viewport:{width:768,height:1024},hasTouch:true});await child(page);
 const ev=evFor(['round','combos']);ev.numbers=titleRows().slice(0,5);
 await page.evaluate(([pre,ev])=>{localStorage.setItem(pre+'ev',JSON.stringify(ev));window.__titleTest.start('numbers');},[familyPrefix(),ev]);
 let reached=false;for(let i=0;i<8;i++){const state=await zustand(page);await frageBeantworten(page,state.round[state.idx]);if(await page.evaluate(()=>window.__titleTest.title())==='Investigator'){reached=true;break;}await klick(page,'#nextBtn');}
 assert.ok(reached,'an actual generated L2 response completes the third common M');await page.evaluate(()=>window.__titleTest.home());
 assert.equal(await page.textContent('#rankName'),'Investigator');assert.equal(await page.textContent('#totalStars'),'0');await page.waitForTimeout(400);assert.equal(await feiern(page),1);
 await page.reload();await page.waitForSelector('#home:not([hidden])');assert.equal(await page.textContent('#rankName'),'Investigator');assert.equal(await feiern(page),0);assert.deepEqual(fehler,[]);await ctx.close();
});
for(const[lang,width,height]of[['de',768,1024],['en',1024,768],['de',320,568]])test(`${lang} existing title path: real touch ${width}×${height}, no overflow and readable next requirements`,async()=>{
 const{ctx,page,fehler}=await mitDaten({kidLang:lang,rankSeen:'Professor',total:0,ev:evFor(['numbers'])},{viewport:{width,height},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
 await page.locator('#rank').tap();assert.match(await page.textContent('#rankNext'),lang==='de'?/Nächstes Ziel: Legend.*17 sichere Quests.*4 Fächer.*5 auf E/:/Next: Legend.*17 more secure quests.*4 more subjects.*5 more on E/);
 assert.ok(await page.$eval('#rankDlg',e=>{const r=e.getBoundingClientRect();return e.scrollWidth<=e.clientWidth&&r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1;}));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 assert.equal(await page.locator('#rankPath li').count(),5);assert.match(await page.textContent('#rankRule'),/Me as a Learner/);
 if(width>320 && process.env.BQ_EP03_SCREENSHOTS)await page.screenshot({path:`${process.env.BQ_EP03_SCREENSHOTS}/${lang}-${width}.png`});
 await page.locator('#rankClose').tap();assert.equal(await page.locator('#rankDlg[open]').count(),0);assert.deepEqual(fehler,[]);await ctx.close();
});
test('real parent file restore converts legacy once, preserves a higher earned title, exports checkpoint and blocks new-star promotion after reload',async()=>{
 const{ctx,page,fehler}=await oeffnen(browser,family);await child(page);await grownup(page,'papa');await page.locator('#pSettings').click();
 const backup=page.locator('details[data-psec="backup"]');await backup.locator('> summary').click();
 async function restore(data){const audio=[],body={format:'bq-sicherung-1',child:familyID('mia'),user:'mia',createdAt:'2026-11-20T08:00:00.000Z',data,audio};body.sha256=createHash('sha256').update(JSON.stringify({data,audio})).digest('hex');await page.locator('#pRestoreFile').setInputFiles({name:'synthetic-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(body))});await page.locator('#pRestoreGo').click();}
 await restore({total:'130',rankSeen:'"Explorer"'});assert.deepEqual(await rawTitle(page),{rankSeen:'"Professor"',rankPolicy:'"knowledge.v1"'});
 await restore({total:'1000',rankSeen:'"Explorer"',rankPolicy:'"knowledge.v1"'});assert.deepEqual(await rawTitle(page),{rankSeen:'"Professor"',rankPolicy:'"knowledge.v1"'});
 const[download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-backup]').click()]);const body=JSON.parse(await readFile(await download.path(),'utf8'));assert.equal(body.data.rankPolicy,'"knowledge.v1"');assert.equal(body.data.rankSeen,'"Professor"');
 assert.equal(await feiern(page),0,'no adult celebration');await page.locator('#pSetBack').click();await page.locator('#parentClose').click();await page.reload();await page.waitForSelector('#home:not([hidden])');assert.equal(await page.textContent('#rankName'),'Professor');assert.equal(await page.locator('#rankNote:visible').count(),0);assert.deepEqual(fehler,[]);await ctx.close();
});
for(const user of['papa','frau','chef'])test(`${user}: adult/grant view reads the knowledge title, does not migrate/write a child's title or celebrate`,async()=>{
 const{ctx,page,fehler}=await oeffnen(browser,family);await child(page);
 await page.evaluate(([pre,grantee,parent])=>{localStorage.setItem(pre+'total','130');localStorage.removeItem(pre+'rankPolicy');localStorage.setItem(pre+'grants',JSON.stringify([{id:'g-title',grantee,by:parent,scope:['learning','school'],from:new Date().toISOString().slice(0,10),until:new Date(Date.now()+14*864e5).toISOString().slice(0,10)}]));},[familyPrefix(),familyID(user),familyID('papa')]);
 const before=await rawTitle(page);await grownup(page,user);assert.match(await page.locator('#pGlance').innerText(),/Professor/);
 await page.locator('.phdr [data-plang="en"]').click();assert.match(await page.locator('#pGlance').innerText(),/Next: Legend/);
 await page.evaluate(()=>window.__titleTest.render());assert.deepEqual(await rawTitle(page),before);assert.equal(await feiern(page),0);assert.equal(await page.locator('#rankNote:visible').count(),0);
 await page.locator('[data-psubj="maths"]').click();await page.locator('#pBack').click();await page.reload();await page.waitForSelector('#parentClose');assert.deepEqual(await rawTitle(page),before);assert.equal(await feiern(page),0);assert.deepEqual(fehler,[]);await ctx.close();
});
