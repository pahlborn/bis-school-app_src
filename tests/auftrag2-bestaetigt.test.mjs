// Auftrag 2 (docs/konzept/dev-auftraege-2026-11-03.md, Entscheidung Peter 03.11.): „bestätigt“ ohne 14 Kalendertage;
// der Lücken-Balken zeigt alle drei Bedingungen (20 erste Versuche, 5 Übungstage, „Sicher“ auf Klassenniveau) und ist
// erst voll, wenn alle erfüllt sind; der Text nennt, was als Nächstes fehlt (DE/EN, keine Zeitwörter).
// Erfundene Schuldaten, keine echten. Echte Klicks.
//   node --test tests/auftrag2-bestaetigt.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'ABCD-EFGH', papa: 'PAPA-2345' };
const tag = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const txt = (de, en) => ({ de, en });
// one gap: M-N1 (Time & Numbers, RS); forces is the current topic
const SCHULE = { version: 1, kinder: { mia: { asOf: tag(-1), tasks: [
  { day: tag(-20), area: 'math', title: 'Check B', std: { 'M-N1': 'RS' }, quests: ['numbers'], focusNext: [], good: txt('b', 'b'), next: txt('', '') },
  { day: tag(-5), area: 'science', title: 'Forces', std: { 'S-F1': 'M' }, quests: ['forces'], focusNext: ['forces'], good: txt('c', 'c'), next: txt('Begründen.', 'Explain.') }
] } } };
const HAKEN = (app) => app.replace(/\}\)\(\);\s*<\/script>/, 'window.__g={assessQuest,openGaps};})();</script>');

let browser, server;
before(async () => {
  server = await kontenServer({ users: [await konto('mia', 'student', C.mia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] })] }, { schule: SCHULE, anpassen: HAKEN });
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); });

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

// the three cases where exactly one condition is missing, and the next missing step of condition 4
const FAELLE = [
  { name: 'nur Bedingung 1 fehlt (12 erste Versuche, 5 Übungstage, sicher)', a: mal(12, [0, 1, 2, 4, 5]),
    de: /noch etwa 8 Aufgaben/, en: /about 8 more tasks/, w: 60 },
  { name: 'nur Bedingung 2 fehlt (20 erste Versuche an 3 Übungstagen, sicher)', a: mal(20, [0, 1, 2]),
    de: /noch an 2 Übungstagen/, en: /on 2 more practice days/, w: 60 },
  { name: 'nur Bedingung 4 fehlt: 70 % auf Klassenniveau richtig', a: mal(6, [0, 1, 2, 4, 5], false).concat(mal(14, [0, 1, 2, 4, 5])),
    de: /noch 2 Aufgaben auf Klassenniveau richtig/, en: /2 more grade-level tasks right/, w: 90 },
  { name: 'nur Bedingung 4 fehlt: auf Klassenniveau richtig erst an 2 Übungstagen', a: mal(8, [0, 1]).concat(mal(12, [2, 4, 5], true, 1)),
    de: /noch an einem weiteren Übungstag richtig/, en: /right on one more practice day/, w: 66 },
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
    assert.ok(!(['m', 'e'].includes(a.level) && a.sure === 'confirmed'), f.name + ': not confirmed secure');
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

test('Auftrag 2: 20 Aufgaben an 5 Übungstagen innerhalb von 6 Kalendertagen, 80 % auf Klassenniveau an 3 Tagen → bestätigt, Lücke geschlossen', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  // 4 wrong (oldest), then 16 right: 16 of the last 20 year-level answers = 80 %, right on all 5 days; days 0..5 back
  await setze(page, daten(reihe(mal(4, [5, 4, 2, 1], false).concat(mal(16, [5, 4, 2, 1, 0])))));
  const a = await page.evaluate(() => window.__g.assessQuest('numbers'));
  assert.equal(a.n, 20); assert.equal(a.days, 5);
  assert.equal(a.sure, 'confirmed', 'confirmed without 14 calendar days');
  assert.equal(a.level, 'm');
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'papa', C.papa); await passwortSetzen(page, 'Moon-Glass-Paper-8812');
  await page.waitForSelector('#parentClose');
  let t = await mathe(page);
  assert.match(t, /Lücke geschlossen ✓[^\n]*Stellenwert[^\n]*laut den Antworten in der App/);
  // the parents keep it open: now all three conditions are met → full bar, no "keep practising" any more
  await page.locator('[data-gapact="hold"][data-gapstd="M-N1"]').click();
  await page.waitForFunction(() => /von Ihnen offen gehalten/.test(document.querySelector('#pSchool .pgaps')?.innerText || ''));
  t = await page.locator('#pSchool .pgaps').innerText();
  assert.match(t, /bestätigt sicher/); assert.equal(await breite(page, '#pSchool'), 100);
  assert.match(await mathe(page, 'en'), /confirmed secure/);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Auftrag 2: Texte ohne „zwei Wochen“ / „14 Tage“ (DE und EN); die Rückschau „in den letzten 14 Tagen“ bleibt', async () => {
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  for (const alt of ['über zwei Wochen', 'over two weeks', 'über mindestens 14 Tage', 'over at least 14 days']) assert.ok(!html.includes(alt), 'old threshold text: ' + alt);
  assert.ok(html.includes('Belastbar ab etwa 20 Aufgaben an 5 Übungstagen.') && html.includes('Reliable from about 20 tasks on 5 practice days.'));
  assert.ok(html.includes('<b>Bestätigt:</b> nach etwa 20 Aufgaben an 5 Übungstagen.') && html.includes('<b>Confirmed:</b> after about 20 tasks on 5 practice days.'));
  assert.ok(html.includes('„Bestätigt“ ab 20 ersten Versuchen an mindestens 5 Übungstagen') && html.includes('“Confirmed” from 20 first tries on at least 5 practice days'));
  assert.ok(html.includes('in den letzten 14 Tagen') && html.includes('in the last 14 days'), 'the look back (sumIntro) stays');
});
