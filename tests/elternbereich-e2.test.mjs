// Pakete E2a–e (Konzept Elternbereich 5.11, 7.0): „So helfen Sie“ je Fach umsortiert und gekürzt (freigegeben von Peter).
//  E2a Mathe: Ziel ein kurzer Satz, Stolperstein 1–2 Stichpunkte + „Besser nicht“, höchstens 2 Ideen; Word Problems ohne die
//  doppelte Idee (Peter 02.11.: „2“); die alten langen Sätze fehlen; DE und EN.
//  E2b English: dieselben Regeln; Opinion Writing ohne die Idee, die „Fragen statt erklären“ wiederholt.
//   node --test tests/elternbereich-e2.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, elternOeffnen } from './app-hilfen.mjs';

let browser, server;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

const woerter = (s) => s.trim().split(/\s+/).length;
async function teile(page, fach) {
  if (await page.$('#pBack')) await page.locator('#pBack').click();
  await page.locator(`[data-psubj="${fach}"]`).first().click(); await page.waitForSelector('#pBack');
  await page.$$eval('details.phelpq', (d) => d.forEach((x) => { x.open = true; }));
  return page.$$eval('.pquest', (qs) => qs.filter((q) => q.querySelector('details.phelpq')).map((q) => {
    const p = (c) => q.querySelector(`.phpart.${c}`);
    return {
      k: q.querySelector('[data-pfocus]')?.dataset.pfocus,
      ziel: p('goal')?.querySelector('p:not(.ph)')?.innerText || '',
      stolper: [...(p('trip')?.querySelectorAll('li') || [])].map((x) => x.innerText),
      ideen: [...(p('home')?.querySelectorAll('li') || [])].map((x) => x.innerText),
      schule: p('way')?.querySelector('p:not(.ph)')?.innerText || '',
      alles: q.querySelector('.phelpq-body').innerText
    };
  }));
}
function regeln(q, besser) {
  assert.ok(woerter(q.ziel) <= 20, 'goal: one short sentence: ' + q.ziel);
  const nicht = q.stolper.filter((s) => s.startsWith(besser));
  assert.equal(nicht.length, 1, '"better not" once: ' + q.k);
  assert.ok(q.stolper.length - 1 >= 1 && q.stolper.length - 1 <= 2, 'stumbling block 1–2 points: ' + q.k + ' ' + q.stolper.join(' | '));
  assert.ok(q.ideen.length >= 1 && q.ideen.length <= 2, 'at most 2 ideas: ' + q.k);
  for (const s of [q.ziel, ...q.stolper, ...q.ideen, q.schule].filter(Boolean)) assert.ok(woerter(s) <= 24, 'short: ' + s);
}

test('E2a maths: shortened "How to help" in the parts of 5.11, German and English', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  await elternOeffnen(page);
  const de = await teile(page, 'maths');
  assert.deepEqual(de.map((q) => q.k).sort(), ['combos', 'detective', 'numbers', 'round', 'wordprob']);
  for (const q of de) regeln(q, 'Besser nicht:');
  const W = de.find((q) => q.k === 'wordprob');
  assert.equal(W.ideen.length, 1, 'word problems: the doubled idea is gone');
  assert.ok(!W.ideen.join(' ').includes('278'), 'no repeat of the school example in the ideas');
  assert.equal(de.find((q) => q.k === 'round').ziel, 'Auf Zehner und Hunderter runden und erklären, woher man es weiß.');
  const alt = ['Erst mit Begründung erfüllt', 'eine Regel wird aufgesagt', 'Zahlen im Text ungenau gelesen', '400 + 90 + 13', 'A hat 278', '+22 → 300', 'Markieren Sie 100 und 200'];
  for (const s of alt) assert.ok(!de.some((q) => q.alles.includes(s)), 'old long text gone: ' + s);
  await page.locator('.phdr [data-plang="en"]').click();
  const en = await teile(page, 'maths');
  for (const q of en) regeln(q, 'Better not:');
  assert.equal(en.find((q) => q.k === 'wordprob').ideen.length, 1);
  assert.ok(!en.some((q) => /[äöüß]|„/.test(q.alles)), 'English only');
  assert.ok(!en.some((q) => /practis(ed|ing)|colour/.test(q.alles)), 'American English');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('E2b English: shortened "How to help" in the parts of 5.11, German and English', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  await elternOeffnen(page);
  const de = await teile(page, 'english');
  assert.deepEqual(de.map((q) => q.k).sort(), ['examples', 'opinion', 'sentences', 'words']);
  for (const q of de) regeln(q, 'Besser nicht:');
  const O = de.find((q) => q.k === 'opinion');
  assert.equal(O.ideen.length, 1, 'opinion writing: the idea repeating "ask instead of explaining" is gone');
  assert.ok(!O.ideen.join(' ').includes('Hast du ein Beispiel'));
  for (const s of ['in logischer Reihenfolge', 'Eigennamen klein', 'Vorsilbe benannt, aber nicht gesagt, was sie bewirkt']) assert.ok(!de.some((q) => q.alles.includes(s)), 'old text gone: ' + s);
  await page.locator('.phdr [data-plang="en"]').click();
  const en = await teile(page, 'english');
  for (const q of en) regeln(q, 'Better not:');
  assert.equal(en.find((q) => q.k === 'opinion').ideen.length, 1);
  assert.ok(!en.some((q) => /[äöüß]|„/.test(q.alles)), 'English only');
  assert.ok(!en.some((q) => /practis(ed|ing)|colour/.test(q.alles)), 'American English');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

/** E2c–e: one subject, same rules, plus quest-specific checks */
async function fachPruefen(page, fach, quests, extra = () => {}) {
  const de = await teile(page, fach);
  assert.deepEqual(de.map((q) => q.k).sort(), quests.slice().sort());
  for (const q of de) regeln(q, 'Besser nicht:');
  extra(de);
  await page.locator('.phdr [data-plang="en"]').click();
  const en = await teile(page, fach);
  for (const q of en) regeln(q, 'Better not:');
  assert.ok(!en.some((q) => /[äöüß]|„/.test(q.alles.replace(/Als Erstes|Als Nächstes|Danach|Zum Schluss|Zuerst faltet man|Danach schneidet man|Dann schneidet man das Papier|aus\.“|“du”|“man”/g, ''))), 'English only');
  assert.ok(!en.some((q) => /practis(ed|ing)|colour/.test(q.alles)), 'American English');
  await page.locator('.phdr [data-plang="de"]').click();
}

test('E2c German: "Anleitung schreiben" shortened; the goal no longer repeats "how school shows it"', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  await elternOeffnen(page);
  await fachPruefen(page, 'deutsch', ['anleitung'], (de) => {
    const a = de[0];
    assert.equal(a.ziel, 'Eine vollständige Anleitung in richtiger Reihenfolge schreiben und selbst prüfen.');
    assert.ok(!/Man-Form|Vorsilbe|zusammengesetzte/.test(a.ziel), 'details only in "how school shows it"');
    assert.match(a.schule, /Man-Form/);
  });
  assert.deepEqual(fehler, []);
  await ctx.close();
});
