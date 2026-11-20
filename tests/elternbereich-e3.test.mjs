// Paket E3 (Konzept Elternbereich 5.10, R10, R11): „Auf einen Blick“ oben in der Übersicht. Erfundene Schuldaten, keine echten.
//  T15: Zählung seit dem letzten Besuch je Erwachsenem; Satz ohne Übung; Idee wechselt; Lehrkraft ohne erste Zeile.
//   node --test tests/elternbereich-e3.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'ABCD-EFGH', papa: 'PAPA-2345', mama: 'MAMA-2345', frau: 'TEAC-HER2' };
const PW = { mia: 'Tiger-Lamp-River-4271', papa: 'Moon-Glass-Paper-8812', mama: 'Sun-Stone-Water-5521', frau: 'Leaf-Cloud-Bridge-3390' };
const tag = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const txt = (de, en) => ({ de, en });
// gap in maths: M-N1 (Time & Numbers, RS) is the active gap; forces is the current topic
const SCHULE = { version: 1, kinder: { mia: { asOf: tag(-1), tasks: [
  { day: tag(-20), area: 'math', title: 'Check B', std: { 'M-N1': 'RS' }, quests: ['numbers'], focusNext: [], good: txt('b', 'b'), next: txt('', '') },
  { day: tag(-5), area: 'science', title: 'Forces', std: { 'S-F1': 'M' }, quests: ['forces'], focusNext: ['forces'], good: txt('c', 'c'), next: txt('Begründen.', 'Explain.') }
] } } };

let browser, server;
before(async () => {
  server = await kontenServer({ users: [await konto('mia', 'student', C.mia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] }), await konto('mama', 'parent', C.mama, { kinder: ['mia'] }), await konto('frau', 'teacher', C.frau)] }, { schule: SCHULE });
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); });

const ID = (n) => server.konten.users.find((u) => u.user === n).id;
const versuche = (skill, n, tage) => Array.from({ length: n }, (_, i) => ({ day: tag(-tage[i % tage.length]), skill, level: 2, attempt: 1, ok: true, help: false }));
const setze = (page, d) => page.evaluate(([id, daten]) => { for (const [k, v] of Object.entries(daten)) localStorage.setItem('bq2_' + id + '__' + k, JSON.stringify(v)); }, [ID('mia'), d]);
const blick = (page) => page.locator('#pGlance').innerText();
const erste = new Set();
/** one visit of a grown-up: in through the grown-ups button, out by logging out */
async function besuch(page, wer) {
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', wer, erste.has(wer) ? PW[wer] : C[wer]);
  if (!erste.has(wer)) { await passwortSetzen(page, PW[wer]); erste.add(wer); }
  await page.waitForSelector('#parentClose');
  return blick(page);
}
async function raus(page) { await page.locator('#parentClose').click(); await page.locator('#parentClose').waitFor({ state: 'detached' }).catch(() => {}); }
const idee = (t) => (t.match(/💡[^\n]*/) || [''])[0];

test('T15 at a glance: counted since the last visit of each grown-up; sentence without practice; the idea changes; teacher without the first line', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, PW.mia);
  await page.waitForSelector('#home:not([hidden])');
  await setze(page, { attempts: versuche('numbers', 6, [1, 2, 3]).concat(versuche('forces', 12, [1, 2, 3, 4])), ev: { forces: versuche('forces', 12, [1, 2, 3, 4]).map((x) => [x.day, 2, 1]) } });
  // first visit of papa: no line "since your last visit"
  let t = await besuch(page, 'papa');
  assert.match(t, /Auf einen Blick · mia/);
  assert.ok(!t.includes('🌱'), 'first visit: no first line');
  assert.match(t, /⭐ Das gelingt: Forces/);
  assert.match(t, /🎯 Daran arbeiten wir: Time & Numbers[\s\S]*noch 6 Aufgaben auf Klassenniveau richtig/);
  assert.equal(await page.locator('#pGlance .pgapbar').count(), 1, 'the active gap with its bar');
  const idee1 = idee(t); assert.ok(idee1.length > 20, 'an idea for home');
  for (const w of ['fällig', 'Rückstand', 'verpasst', 'Tage bis']) assert.ok(!t.includes(w), 'no time words: ' + w);
  await raus(page);
  // mia practices 5 tasks and earns a badge; papa's second visit counts them
  await setze(page, { attempts: versuche('numbers', 11, [1, 2, 3]).concat(versuche('forces', 12, [1, 2, 3, 4])), badges: { thinker: 1 } });
  t = await besuch(page, 'papa');
  assert.match(t, /🌱 Seit Ihrem letzten Besuch: 5 Aufgaben, 1 neues Abzeichen/);
  const idee2 = idee(t); assert.notEqual(idee2, idee1, 'the next idea on every visit');
  // rendering again inside the same visit keeps the count and the idea
  await page.locator('.phdr [data-plang="en"]').click();
  assert.match(await blick(page), /🌱 Since your last visit: 5 tasks, 1 new badge/);
  await page.locator('.phdr [data-plang="de"]').click();
  assert.equal(idee(await blick(page)), idee2);
  // "More" opens the subject of what we work on
  await page.locator('#pGlance [data-pmore]').click(); await page.waitForSelector('#pSchool');
  await raus(page);
  // nothing practised: the calm sentence
  t = await besuch(page, 'papa');
  assert.match(t, /🌱 Seit Ihrem letzten Besuch wurde nicht geübt – das ist in Ordnung\./);
  await raus(page);
  // mama's first visit: her own last visit, so no first line
  t = await besuch(page, 'mama');
  assert.ok(!t.includes('🌱'), 'the last visit is kept per grown-up');
  await raus(page);
  // the glance stays on the device, not in the backup
  const gl = await page.evaluate(() => JSON.parse(localStorage.getItem('bq2_glance') || '{}'));
  assert.deepEqual(Object.keys(gl).sort(), [ID('mama') + '|' + ID('mia'), ID('papa') + '|' + ID('mia')].sort());
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('T15 a teacher with a grant: no line "since your last visit", the rest is shown', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, PW.mia);
  await page.waitForSelector('#home:not([hidden])');
  await setze(page, { attempts: versuche('numbers', 6, [1, 2, 3]), grants: [{ id: 'g1', grantee: ID('frau'), scope: ['learning', 'school'], from: tag(0), until: tag(10), by: ID('papa') }] });
  erste.delete('frau');
  await besuch(page, 'frau'); await raus(page);
  await setze(page, { attempts: versuche('numbers', 10, [1, 2, 3]) });
  const t = await besuch(page, 'frau');
  assert.ok(!t.includes('🌱'), 'no first line for the teacher');
  assert.match(t, /🎯 Daran arbeiten wir: Time & Numbers/);
  assert.equal(await page.locator('#pGlance [data-gapact]').count(), 0);
  assert.deepEqual(fehler, []);
  await ctx.close();
});
