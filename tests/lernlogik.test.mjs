// Lernlogik im Hintergrund: Antworten merken, Fehler wiederholen, Schwierigkeit anpassen.
// Das Kind darf davon nichts sehen (Vorgabe Peter, 29.10.).
//   node --test tests/lernlogik.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, zustand, klick, alleKarten, karteOeffnen, zurStart, frageBeantworten } from './app-hilfen.mjs';

let browser, server;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });
const app = () => appOeffnen(browser, server.url);

const pad = (n) => String(n).padStart(2, '0');
const tag = (minus) => { const d = new Date(); d.setDate(d.getDate() - minus); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
/** n Antworten auf Stufe `stufe`, verteilt auf die letzten `tage` Tage; die ersten `richtig` davon richtig. */
const belege = (n, stufe, richtig, tage) => Array.from({ length: n }, (_, i) => [tag(i % tage), stufe, i < richtig ? 1 : 0]);
const setzeBelege = (page, ev) => page.evaluate((e) => localStorage.setItem('bq2_ev', JSON.stringify(e)), ev);
const lies = (page, k) => page.evaluate((key) => JSON.parse(localStorage.getItem('bq2_' + key) || 'null'), k);
const level = (q) => q.level || 2;
// klein verglichen: innerText liefert Text so, wie CSS ihn zeigt (z. B. in Grossbuchstaben)
const VERBOTEN = ['requires support', 'consolidating', 'meeting expectations', 'extending', 'not applicable', 'level '];

async function quest(page, item) {
  const k = (await alleKarten(page)).find((x) => x.item === item);
  await karteOeffnen(page, k);
  return zustand(page);
}
/** Beantwortet die aktuelle Frage absichtlich falsch. */
async function falschBeantworten(page, q) {
  if (q.kind === 'mc') await klick(page, `#qAnswers .opt[data-i="${(q.answer + 1) % q.options.length}"]`);
  else if (q.kind === 'type') { for (const z of String(+q.answer + 1)) await klick(page, `#qAnswers .key[aria-label="${z}"]`); await klick(page, '#qAnswers .key.go'); }
  else { for (const k of [...q.correct].reverse()) await klick(page, `#qAnswers .ord[data-i="${k}"]`); await klick(page, '#checkOrder'); }
  if (!(await page.isVisible('#nextBtn'))) await klick(page, '#helpBtn');
}

test('jede Antwort wird mit Tag, Stufe und Ergebnis gemerkt', async () => {
  const { ctx, page, fehler } = await app();
  let s = await quest(page, 'round');
  await frageBeantworten(page, s.round[0]);
  await klick(page, '#nextBtn');
  s = await zustand(page);
  await falschBeantworten(page, s.round[1]);
  const ev = (await lies(page, 'ev')).round;
  assert.equal(ev.length, 2);
  assert.deepEqual(ev.map((e) => e[0]), [tag(0), tag(0)]);
  assert.deepEqual(ev.map((e) => e[2]), [1, 0]);
  assert.ok(ev.every((e) => [1, 2, 3].includes(e[1])));
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('eine schwierige Aufgabe bleibt nach der Hilfe zur späteren Wiederholung gespeichert', async () => {
  const { ctx, page, fehler } = await app();
  const s = await quest(page, 'numbers');
  const q = s.round[0];
  await falschBeantworten(page, q);
  const nach = await zustand(page);
  assert.equal(nach.round.length, 8, 'Hilfen verlängern die Runde nicht');
  const due = await lies(page, 'due');
  assert.equal(due.length, 1);
  assert.equal(due[0].at, tag(-1), 'faellig am naechsten Tag');
  assert.equal(due[0].q.prompt, q.prompt);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('faellige Wiederholungen kommen in Practise Today und wandern nach richtiger Antwort weiter', async () => {
  const { ctx, page, fehler } = await app();
  const s = await quest(page, 'numbers');
  await falschBeantworten(page, s.round[0]);
  await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('bq2_due')); d[0].at = '2000-01-01'; localStorage.setItem('bq2_due', JSON.stringify(d)); });
  await zurStart(page);
  await klick(page, '#todayBtn');
  const heute = await zustand(page);
  const i = heute.round.findIndex((q) => q.dueId);
  assert.ok(i >= 0, 'Wiederholung in Practise Today');
  for (let f = 0; f <= i; f++) {
    const z = await zustand(page);
    await frageBeantworten(page, z.round[z.idx]);
    await klick(page, '#nextBtn');
  }
  const due = await lies(page, 'due');
  assert.equal(due[0].box, 1);
  assert.equal(due[0].at, tag(-3), 'nach richtiger Antwort in 3 Tagen wieder');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('sitzt eine Fähigkeit (Meeting expectations), kommen mehr Herausforderungen', async () => {
  const { ctx, page } = await app();
  // Bar Graphs hat von sich aus nur eine Erklaer-Aufgabe je Runde - so wird sichtbar, ob die Anpassung wirkt.
  await setzeBelege(page, { graphs: belege(10, 2, 10, 3) });
  for (let r = 0; r < 8; r++) {
    const s = await quest(page, 'graphs');
    const n3 = s.round.filter((q) => level(q) === 3).length;
    assert.ok(n3 >= 2, `Runde ${r}: nur ${n3} Herausforderungen`);
    await klick(page, '#quitBtn');
  }
  await ctx.close();
});

test('hakt es noch (Requires support), gibt es keine Herausforderungen, dafuer Aufgaben mit Hilfe', async () => {
  const { ctx, page } = await app();
  await setzeBelege(page, { round: belege(10, 2, 2, 3) });
  for (let r = 0; r < 8; r++) {
    const s = await quest(page, 'round');
    assert.equal(s.round.filter((q) => level(q) === 3).length, 0, `Runde ${r}: Herausforderung trotz Unsicherheit`);
    assert.ok(s.round.filter((q) => level(q) === 1).length >= 2, `Runde ${r}: zu wenig Aufgaben mit Hilfe`);
    await klick(page, '#quitBtn');
  }
  await ctx.close();
});

test('ohne genug Belege bleibt die Runde, wie sie ist (Not applicable)', async () => {
  const { ctx, page } = await app();
  await setzeBelege(page, { round: belege(3, 2, 3, 1) });
  let mit3 = 0;
  for (let r = 0; r < 10; r++) {
    const s = await quest(page, 'round');
    if (s.round.some((q) => level(q) === 3)) mit3++;
    await klick(page, '#quitBtn');
  }
  assert.ok(mit3 >= 8, 'ohne Belege kommt die normale Mischung, mit Erklaer-Aufgaben');
  await ctx.close();
});

test('Practise Today: Aufwaermfrage zuerst, Herausforderung am Ende, sobald ein Fokus-Thema sitzt', async () => {
  const { ctx, page } = await app();
  await setzeBelege(page, { round: belege(10, 2, 10, 3) });
  for (let r = 0; r < 10; r++) {
    await zurStart(page);
    await klick(page, '#todayBtn');
    const s = await zustand(page);
    assert.equal(s.round.length, 8);
    assert.equal(s.round[0].warmup, true, 'Aufwaermfrage zuerst');
    assert.ok(level(s.round[0]) < 3, 'Aufwaermen ist keine Herausforderung');
    assert.equal(level(s.round[7]), 3, 'Herausforderung am Ende');
  }
  await ctx.close();
});

test('das Kind sieht nie Stufen oder Bewertungswoerter', async () => {
  const { ctx, page, fehler } = await app();
  await setzeBelege(page, { round: belege(10, 2, 10, 3), numbers: belege(10, 2, 2, 3) });
  const texte = [await page.evaluate(() => document.body.innerText)];
  for (const item of ['round', 'numbers']) {
    const s = await quest(page, item);
    for (let f = 0; f < 8; f++) {
      const z = await zustand(page);
      if (f % 2) await falschBeantworten(page, z.round[z.idx]); else await frageBeantworten(page, z.round[z.idx]);
      texte.push(await page.evaluate(() => document.body.innerText));
      await klick(page, '#nextBtn');
    }
    texte.push(await page.evaluate(() => document.body.innerText));
    await zurStart(page);
  }
  const treffer = VERBOTEN.filter((w) => texte.some((t) => t.toLowerCase().includes(w)));
  assert.deepEqual(treffer, []);
  assert.deepEqual(fehler, []);
  await ctx.close();
});
