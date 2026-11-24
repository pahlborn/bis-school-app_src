// Paket D4 (Konzept Elternbereich 6.6, R10, R11): die Lücke für Eltern. Erfundene Schuldaten, keine echten.
//  T19: „Jetzt angehen“, „Als geschlossen markieren“, „Weiter üben“ wirken und werden vermerkt; Lehrkraft sieht keine Knöpfe.
//  T17: Fortschritt in Aufgaben, keine Zeitwörter; „Learning goal geschlossen ✓“ im Block „Aus der Schule“.
//   node --test tests/elternbereich-d4.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'ABCD-EFGH', papa: 'PAPA-2345', frau: 'TEAC-HER2',admin:'ADMI-N234' };
const tag = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const txt = (de, en) => ({ de, en });
// gaps in maths: M-N1 (Time & Numbers, RS, active), M-N2 (Data Detective, C, waits); forces is the current topic
const SCHULE = { version: 1, kinder: { mia: { asOf: tag(-1), tasks: [
  { day: tag(-40), area: 'math', title: 'Check A', std: { 'M-N2': 'C' }, quests: ['detective'], focusNext: [], good: txt('a', 'a'), next: txt('', '') },
  { day: tag(-20), area: 'math', title: 'Check B', std: { 'M-N1': 'RS' }, quests: ['numbers'], focusNext: [], good: txt('b', 'b'), next: txt('', '') },
  { day: tag(-5), area: 'science', title: 'Forces', std: { 'S-F1': 'M' }, quests: ['forces'], focusNext: ['forces'], good: txt('c', 'c'), next: txt('Begründen.', 'Explain.') }
] } } };

let browser, server;
before(async () => {
  server = await kontenServer({ users: [await konto('mia', 'student', C.mia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] }), await konto('frau', 'teacher', C.frau),await konto('admin','parent',C.admin,{admin:true})] }, { schule: SCHULE,anpassen:app=>app.replace(/\}\)\(\);\s*<\/script>/,'window.__gapRecord=recordAnswer;window.__gapControl={gapAct,openGaps};})();</script>') });
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); });

const ID = (n) => server.konten.users.find((u) => u.user === n).id;
const versuche = (skill, n, tage) => Array.from({ length: n }, (_, i) => ({ day: tag(-tage[i % tage.length]), skill, level: 2, attempt: 1, ok: true, help: false }));
const uebung = (skill, n, tage) => { const a = versuche(skill, n, tage); return { attempts: a, ev: { [skill]: a.map((x) => [x.day, x.level, 1]) } }; };
const setze = (page, d) => page.evaluate(([id, daten]) => { for (const [k, v] of Object.entries(daten)) { if (v === null) localStorage.removeItem('bq2_' + id + '__' + k); else localStorage.setItem('bq2_' + id + '__' + k, JSON.stringify(v)); } }, [ID('mia'), d]);
const lies = (page) => page.evaluate((id) => JSON.parse(localStorage.getItem('bq2_' + id + '__gaps') || 'null'), ID('mia'));
const liste = (page) => page.locator('#pSchool .pgaps').innerText();
async function mathe(page) {
  if (await page.$('#pBack')) await page.locator('#pBack').click();
  await page.locator('.phdr [data-plang="en"]').click(); await page.locator('.phdr [data-plang="de"]').click();   // render again
  await page.locator('[data-psubj="maths"]').click(); await page.waitForSelector('#pSchool');
}
const karte = (page, k) => page.locator('.pquest', { has: page.locator(`[data-pfocus="${k}"]`) });

test('T19/T17 parents: work on it now, mark as closed, keep practising - with notes; progress in tasks; no time words', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  await setze(page, uebung('numbers', 5, [0]));
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'papa', C.papa); await passwortSetzen(page, 'Moon-Glass-Paper-8812');
  await page.waitForSelector('#parentClose');
  await mathe(page);
  let t = await liste(page);
  assert.match(t, /🎯[^\n]*Stellenwert[\s\S]*noch 1 Aufgabe auf Klassenniveau richtig/, 'active gap needs one more relevant answer (five of six)');
  assert.match(t, /Zahlen vergleichen[\s\S]*wartet/);
  assert.equal(await page.locator('#pSchool .pgapbar').count(), 1, 'one bar: the active gap');
  for (const w of ['fällig', 'Rückstand', 'verpasst', 'Tage bis', 'noch 3 Tage']) assert.ok(!t.includes(w), 'no time words: ' + w);
  // "work on it now": Data Detective becomes active
  await page.locator('[data-gapact="go"][data-gapstd="M-N2"]').click();
  await page.waitForSelector('[data-gapact="go"][data-gapstd="M-N1"]');
  assert.equal((await lies(page)).active, 'M-N2');
  assert.equal(await karte(page, 'detective').locator('.ptag.gap').count(), 1, 'Data Detective now the active gap');
  // "mark as closed": closed by the parents, with a note; Time & Numbers active again
  await page.locator('[data-gapact="close"][data-gapstd="M-N2"]').click();
  await page.waitForFunction(() => /von Ihnen geschlossen/.test(document.querySelector('#pSchool .pgaps')?.innerText || ''));
  t = await liste(page);
  assert.match(t, /Learning goal geschlossen ✓[^\n]*Zahlen vergleichen[^\n]*von Ihnen geschlossen/);
  assert.equal((await lies(page)).closed['M-N2'].by, 'parents');
  assert.equal(await karte(page, 'numbers').locator('.ptag.gap').count(), 1);
  // the app closes Time & Numbers after six following answers at the common secure stand → "keep practising"
  await setze(page, uebung('numbers', 24, [1, 3, 5, 8, 12, 16]));
  await page.evaluate(()=>{for(let i=0;i<6;i++)window.__gapRecord({world:'numbers',level:2},true);});
  await mathe(page);
  t = await liste(page);
  assert.match(t, /Learning goal geschlossen ✓[^\n]*Stellenwert[^\n]*laut den Antworten in Big Quest/);
  await page.locator('[data-gapact="hold"][data-gapstd="M-N1"]').click();
  await page.waitForFunction(() => /von Ihnen offen gehalten/.test(document.querySelector('#pSchool .pgaps')?.innerText || ''));
  let g = await lies(page);
  assert.ok(!g.closed['M-N1'] && g.hold['M-N1'], 'kept open, noted');
  // stays open although the app would close it
  await mathe(page);
  assert.match(await liste(page), /🎯[^\n]*Stellenwert[\s\S]*von Ihnen offen gehalten/, 'the app does not close a gap kept open');
  // the parents close it
  await page.locator('[data-gapact="close"][data-gapstd="M-N1"]').click();
  await page.waitForFunction(() => /Stellenwert[^\n]*von Ihnen geschlossen/.test(document.querySelector('#pSchool .pgaps')?.innerText || ''));
  g = await lies(page);
  assert.equal(g.closed['M-N1'].by, 'parents'); assert.ok(!g.hold['M-N1']);
  // ⓘ explains, honestly (R11), without time words
  await page.locator('#pSchool .info-btn[data-help="gaps"]').click();
  const h = await page.locator('#helpDlg').innerText();
  assert.match(h, /nächsten 6 Aufgaben zum Thema/); assert.ok(!/fällig|Rückstand|verpasst/.test(h));
  await page.locator('#helpClose').click();
  // English
  await page.locator('.phdr [data-plang="en"]').click();
  assert.match(await liste(page), /Learning goal closed ✓[\s\S]*closed by you/);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

for(const viewer of['frau','admin'])test(`T19 ${viewer} with a grant reads the journey without actions, movement or persistence`, async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server,{viewport:{width:768,height:1024},hasTouch:true});
  try{
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  await setze(page, { grants: [{ id: 'g1', grantee: ID(viewer), scope: ['learning', 'school'], from: tag(0), until: tag(10), by: ID('papa') }] });
  await page.evaluate(()=>{for(let i=0;i<12;i++)window.__gapRecord({world:'numbers',level:2},true);});
  const before=await lies(page);
  await page.locator('#adultBtn').tap();
  await anmelden(page, 'adult', viewer, C[viewer]); await passwortSetzen(page, 'Moon-Glass-Paper-8812');
  await page.waitForSelector('#parentClose');
  await page.locator('[data-psubj="maths"]').tap(); await page.waitForSelector('#pSchool');
  assert.match(await liste(page), /Stellenwert/);assert.equal(await page.locator('[data-gapact]').count(), 0, 'no gap buttons through grant');
  await page.evaluate(()=>{for(const a of['go','close','hold'])window.__gapControl.gapAct(a,'M-N2');window.__gapControl.openGaps();});
  await page.locator('.phdr [data-plang="en"]').tap();assert.deepEqual(await lies(page),before,'render, attempted actions and language change preserve the exact gap state');
  assert.deepEqual(fehler, []);
  }finally{await ctx.close();}
});
