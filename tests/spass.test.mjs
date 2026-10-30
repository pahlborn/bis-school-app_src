// Spass-Teil: Leckerli nach der Runde, Mystery Question, Lernbaum, Abzeichen, Challenge,
// Leitsatz-Botschaften, Mottozeiten, Adventskalender, Geburtstag, Pisolala-Einstellung.
//   node --test tests/spass.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, zustand, klick, alleKarten, karteOeffnen, zurStart, frageBeantworten, elternOeffnen } from './app-hilfen.mjs';

let browser, server;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });
const app = (o = {}) => appOeffnen(browser, server.url, o);
const lies = (page, k) => page.evaluate((key) => JSON.parse(localStorage.getItem('bq2_' + key) || 'null'), k);
const pad = (n) => String(n).padStart(2, '0');
const tag = (minus) => { const d = new Date(); d.setDate(d.getDate() - minus); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

async function rundeSpielen(page, falsch = false) {
  for (let f = 0; f < 8; f++) {
    const s = await zustand(page);
    if (s.screen !== 'play') break;
    const q = s.round[s.idx];
    if (falsch && q.kind === 'mc') await klick(page, `#qAnswers .opt[data-i="${(q.answer + 1) % q.options.length}"]`);
    else await frageBeantworten(page, q);
    await klick(page, '#nextBtn');
  }
}

test('nach einer Runde: Leckerli waehlen – Witz mit Aufloesung, Mystery Question einmal am Tag, freigegebene Pisolala-Geschichte', async () => {
  const { ctx, page, fehler } = await app();
  await karteOeffnen(page, (await alleKarten(page)).find((k) => k.item === 'numbers'));
  await rundeSpielen(page);
  assert.ok(await page.isVisible('#results'));
  const knoepfe = await page.$$eval('#treat [data-treat]', (b) => b.map((x) => x.dataset.treat));
  // Pisolala-Knopf nur, wenn eine Geschichte freigegeben ist (approved:true); Spannung bis zur Obergrenze (Voreinstellung 2)
  assert.deepEqual(knoepfe, ['joke', 'mystery', 'story']);
  await klick(page, '#treat [data-treat="story"]');
  assert.deepEqual(await page.$$eval('#treatBody [data-story]', (b) => b.map((x) => x.dataset.l)), ['1', '2']);
  await klick(page, '#treatBody [data-story][data-l="1"]');
  const geschichte = await page.textContent('#storyText');
  assert.ok(geschichte.includes('Pisolala'));
  for (const w of ['Ohren', 'Augen', 'Fell', 'groß wie', 'aussah']) assert.ok(!geschichte.includes(w), 'Pisolala bleibt unsichtbar: ' + w);
  await klick(page, '#treat [data-treat="joke"]');
  await klick(page, '#jokeAnswer');
  assert.equal(await page.$$eval('#treatBody .story', (s) => s.length), 2, 'Frage und Aufloesung');
  await klick(page, '#treat [data-treat="mystery"]');
  await klick(page, '#treatBody [data-m]');
  assert.equal(await lies(page, 'mysteryDone'), tag(0));
  await klick(page, '#treat [data-treat="mystery"]');
  assert.ok((await page.textContent('#treatBody')).includes('A new one comes tomorrow'));
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('die Mystery Question ist den ganzen Tag dieselbe und wechselt am naechsten Tag', async () => {
  const frage = async (zeit) => {
    const { ctx, page } = await app({ zeit });
    await karteOeffnen(page, (await alleKarten(page)).find((k) => k.item === 'numbers'));
    await rundeSpielen(page);
    await klick(page, '#treat [data-treat="mystery"]');
    const t = await page.textContent('#treatBody .story');
    await ctx.close();
    return t;
  };
  const a = await frage('2026-11-03T08:00:00'), b = await frage('2026-11-03T19:00:00'), c = await frage('2026-11-04T08:00:00');
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test('Lernbaum waechst mit Uebungstagen und meldet sich einmal', async () => {
  const { ctx, page } = await app();
  await page.evaluate((ev) => localStorage.setItem('bq2_ev', JSON.stringify(ev)), { numbers: [0, 1, 2, 3, 4, 5].map((i) => [tag(i), 2, 1]) });
  await page.reload(); await page.waitForSelector('#home h1');
  assert.equal(await page.textContent('#treeText'), 'A strong young plant.');
  assert.ok((await page.textContent('#homeNote')).includes('Your tree is growing'));
  await page.reload(); await page.waitForSelector('#home h1');
  assert.equal(await page.isVisible('#homeNote'), false, 'die Meldung kommt nur beim Wachsen');
  await ctx.close();
});

test('Challenge: freiwillig; annehmen gibt Risk-taker (auch bei Fehler), danach Glow-Frage -> Reflective', async () => {
  const { ctx, page, fehler } = await app();
  await page.evaluate((ev) => localStorage.setItem('bq2_ev', JSON.stringify(ev)), { round: Array.from({ length: 10 }, (_, i) => [tag(i % 3), 2, 1]) });
  await zurStart(page);
  await klick(page, '#todayBtn');
  for (let f = 0; f < 7; f++) { const s = await zustand(page); await frageBeantworten(page, s.round[s.idx]); await klick(page, '#nextBtn'); }
  assert.ok(await page.isVisible('#takeChallenge'), 'Angebot statt Frage');
  await klick(page, '#takeChallenge');
  const s = await zustand(page); const q = s.round[s.idx];
  if (q.kind === 'mc') await klick(page, `#qAnswers .opt[data-i="${(q.answer + 1) % q.options.length}"]`); else await frageBeantworten(page, q);
  assert.equal((await lies(page,'badges')).riskTaker,1,'attempt earns the badge even if the one-per-round message was already used');
  if (!(await page.isVisible('#nextBtn'))) await klick(page, '#helpBtn');
  await klick(page, '#nextBtn');
  assert.ok(await page.isVisible('#reflect'));
  await klick(page, '#reflect [data-glow]');
  const b = await lies(page, 'badges');
  assert.equal(b.riskTaker, 1);
  assert.equal(b.reflective, 1);
  await zurStart(page);
  const chips = await page.textContent('#badges');
  assert.ok(chips.includes('Risk-taker') && chips.includes('Reflective'));
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Challenge ablehnen beendet die Runde ohne Fehler', async () => {
  const { ctx, page, fehler } = await app();
  await page.evaluate((ev) => localStorage.setItem('bq2_ev', JSON.stringify(ev)), { round: Array.from({ length: 10 }, (_, i) => [tag(i % 3), 2, 1]) });
  await zurStart(page);
  await klick(page, '#todayBtn');
  for (let f = 0; f < 7; f++) { const s = await zustand(page); await frageBeantworten(page, s.round[s.idx]); await klick(page, '#nextBtn'); }
  await klick(page, '#skipChallenge');
  assert.ok(await page.isVisible('#results'));
  assert.equal((await zustand(page)).round.length, 7);
  assert.equal((await lies(page, 'badges') || {}).riskTaker, undefined);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Leitsatz-Botschaften: hoechstens eine pro Runde, auch bei vielen Fehlern', async () => {
  const { ctx, page } = await app();
  for (let r = 0; r < 6; r++) {
    await karteOeffnen(page, (await alleKarten(page)).find((k) => k.item === 'sentences'));
    let zaehler = 0;
    for (let f = 0; f < 8; f++) {
      const s = await zustand(page);
      if (s.screen !== 'play') break;
      if (await page.isVisible('#playNote')) zaehler++;
      const q = s.round[s.idx];
      if (q.kind === 'mc') await klick(page, `#qAnswers .opt[data-i="${(q.answer + 1) % q.options.length}"]`); else await frageBeantworten(page, q);
      if (!(await page.isVisible('#nextBtn'))) await klick(page, '#helpBtn');
      zaehler += await page.$$eval('#feedback .note-banner', (n) => n.length);
      await klick(page, '#nextBtn');
    }
    assert.ok(zaehler <= 1, `Runde ${r}: ${zaehler} Botschaften`);
    await zurStart(page);
  }
  await ctx.close();
});

test('Mottozeiten: Halloween-Kuerbis, Adventskalender mit Tuerchen bis heute', async () => {
  let a = await app({ zeit: '2026-10-30T10:00:00' });
  assert.equal(await a.page.textContent('#themeIcon'), '🎃');
  assert.equal(await a.page.isVisible('#advent'), false);
  await a.ctx.close();

  a = await app({ zeit: '2026-12-05T10:00:00' });
  const { page, fehler } = a;
  assert.ok(await page.isVisible('#advent'));
  assert.equal(await page.isEnabled('.door[data-door="5"]'), true);
  assert.equal(await page.isEnabled('.door[data-door="6"]'), false);
  await klick(page, '.door[data-door="3"]');
  await klick(page, '#doorBody button[data-a]');
  assert.deepEqual(await lies(page, 'advent2026'), [3]);
  assert.equal(await page.textContent('.door[data-door="3"]'), '✓');
  assert.ok((await page.textContent('#doorBody')).includes('Door 3'));
  assert.deepEqual(fehler, []);
  await a.ctx.close();

  a = await app({ zeit: '2026-07-10T10:00:00' });
  assert.equal(await a.page.textContent('#themeIcon'), '');
  await a.ctx.close();
});

test('Geburtstag: das Kind traegt ihn selbst ein; zwei Tage vorher Vorfreude, am Tag Glueckwunsch', async () => {
  let a = await app({ zeit: '2026-11-01T10:00:00' });
  await klick(a.page, '#bdayBtn');
  await a.page.selectOption('#bdDay', '02');
  await a.page.selectOption('#bdMonth', '11');
  await klick(a.page, '#bdSave');
  assert.equal(await lies(a.page, 'birthday'), '11-02');
  assert.ok((await a.page.textContent('#homeNote')).includes('coming in 1 day'));
  await a.ctx.close();

  a = await app({ zeit: '2026-11-02T10:00:00' });
  await a.page.evaluate(() => { localStorage.setItem('bq2_birthday', '"11-02"'); localStorage.setItem('bq2_name', '"Alex"'); });
  await a.page.reload(); await a.page.waitForSelector('#home h1');
  assert.ok((await a.page.textContent('#homeNote')).includes('Happy birthday, Alex'));
  await a.ctx.close();
});

test('Elternbereich: Spannungsgrenze fuer Pisolala einstellbar (Voreinstellung: ein bisschen spannend)', async () => {
  const { ctx, page } = await app();
  await elternOeffnen(page);
  assert.equal(await page.inputValue('#storyCap'), '2');
  await page.selectOption('#storyCap', '1');
  assert.equal(await lies(page, 'storyCap'), 1);
  await ctx.close();
});
