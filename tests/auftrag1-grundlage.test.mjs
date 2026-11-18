// Auftrag 1 (docs/konzept/dev-auftraege-2026-11-03.md, Peter 03.11.): Grundlage-Aufgaben (Stufe 1) fuer die Quests mit
// Hauptstandard, die keine hatten. Abnahme: jede Quest mit Hauptstandard hat in 25 Runden mindestens eine Aufgabe auf
// Stufe 1; bei „braucht Unterstuetzung“ enthaelt eine Runde mindestens 2; jede neue Aufgabe hat einen eigenen Tipp,
// ein anderes passendes Beispiel oder eine konkrete D4-Ausnahme (EV33-CC-M1), genug Varianten. Echte Klicks fuer „Show me how“.
//   node --test tests/auftrag1-grundlage.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, zustand, klick, alleKarten, karteOeffnen, frageBeantworten } from './app-hilfen.mjs';
import { appSandbox } from './app-sandbox.mjs';

const HAKEN = (app) => app.replace(/\}\)\(\);\s*<\/script>/, 'window.__g={WORLDS,STANDARDS,GRUNDLAGE,levelOf,adaptRound,standOf,guidance,exampleFor,qId};})();</script>');
let browser, server;
before(async () => { server = await appServer({ anpassen: HAKEN }); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

// die 10 Quests aus dem Auftrag (Befund 03.11.)
const NEU = ['numbers', 'combos', 'wordprob', 'forces', 'units', 'graphs', 'sentences', 'words', 'anleitung', 'library'];
const FIXED_ANSWER_EXCEPTIONS = { sentences: [2, 3], anleitung: [2, 4], library: [1, 4] };
const answer = q => q.kind === 'mc' ? String(q.options[q.answer]).replace(/<[^>]+>/g, '') : String(q.answer);
const isException = q => (FIXED_ANSWER_EXCEPTIONS[q.world] || []).includes(q.foundationFamily)
  || (q.world === 'units' && q.foundationFamily === 3 && answer(q) === '1 m');
const pad = (n) => String(n).padStart(2, '0');
const tag = (minus) => { const d = new Date(); d.setDate(d.getDate() - minus); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

test('jede Quest mit Hauptstandard: in 25 Runden mindestens eine Aufgabe auf Stufe 1; die 10 neuen in jeder Runde', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  const r = await page.evaluate(() => {
    const G = window.__g, out = {};
    for (const k of Object.keys(G.STANDARDS)) {
      if (!G.WORLDS[k] || !(G.STANDARDS[k] || [])[0]) continue;
      const runden = Array.from({ length: 25 }, () => G.WORLDS[k].build());
      out[k] = { n: runden.map((rd) => rd.length), l1: runden.map((rd) => rd.filter((q) => G.levelOf(q) === 1).length) };
    }
    return out;
  });
  const ohne = Object.entries(r).filter(([, v]) => v.l1.every((x) => x === 0)).map(([k]) => k);
  assert.deepEqual(ohne, [], 'quests with a main standard without any foundation task');
  // 14 quests with a main standard (19 visible quests, 5 of them without one: poetry, finish, team, school, music)
  assert.ok(Object.keys(r).length >= 14, 'all quests with a main standard counted: ' + Object.keys(r).length);
  for (const k of NEU) {
    assert.ok(r[k], k + ' has a main standard');
    assert.ok(r[k].l1.every((x) => x >= 1), k + ': a foundation task in every round ' + r[k].l1.join(','));
    assert.ok(r[k].n.every((x) => x === 8), k + ': rounds stay at 8 tasks ' + r[k].n.join(','));
  }
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('jede neue Grundlage-Aufgabe: Stufe 1, eigener Tipp, Beispiel oder benannte Ausnahme, richtige Antwort waehlbar, mindestens 6 Varianten', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  const r = await page.evaluate(([NEU, exceptions]) => {
    const G = window.__g, out = {};
    for (const k of NEU) {
      const qs = []; for (let i = 0; i < 80; i++) qs.push(...G.WORLDS[k].build().filter((q) => G.levelOf(q) === 1));
      const fehlerListe = [];
      for (const q of qs) {
        const p = String(q.prompt).replace(/<[^>]+>/g, '').slice(0, 60);
        if (q.world !== k) fehlerListe.push('world ' + q.world + ': ' + p);
        // text quests: the task comes from the quest's own bank (module grundlage)
        if (G.GRUNDLAGE[k] && !G.GRUNDLAGE[k].some((r) => r[0] === q.prompt && r[1] === q.options[q.answer])) fehlerListe.push('not from the bank of ' + k + ': ' + p);
        if (!q.tip || G.guidance(q, null, false).text !== q.tip) fehlerListe.push('no own tip: ' + p);
        const ex = G.exampleFor(q);
        const excluded = (exceptions[k] || []).includes(q.foundationFamily) || (k === 'units' && q.foundationFamily === 3 && q.options[q.answer] === '1 m');
        if (excluded) { if (ex !== null) fehlerListe.push('fixed answer exposed in explicit exception: ' + p); }
        else if (!ex || ex.level !== 1 || ex.foundationFamily !== q.foundationFamily || ex.prompt + (ex.visual || '') === q.prompt + (q.visual || '')) fehlerListe.push('missing or repeated foundation example: ' + p);
        if (q.kind === 'mc') {
          if (!(q.answer >= 0 && q.answer < q.options.length)) fehlerListe.push('answer index: ' + p);
          if (new Set(q.options).size !== q.options.length) fehlerListe.push('options twice: ' + p);
          if (q.options.length < 2) fehlerListe.push('one option: ' + p);
        } else if (q.kind === 'type') { if (!/^\d+$/.test(String(q.answer))) fehlerListe.push('typed answer: ' + p); }
        if (!q.explain) fehlerListe.push('no explanation: ' + p);
      }
      out[k] = { anzahl: qs.length, varianten: new Set(qs.map(G.qId)).size, bild: qs.filter((q) => q.visual).length, fehler: fehlerListe.slice(0, 5) };
    }
    return out;
  }, [NEU, FIXED_ANSWER_EXCEPTIONS]);
  for (const k of NEU) {
    assert.deepEqual(r[k].fehler, [], k);
    assert.ok(r[k].varianten >= 6, `${k}: ${r[k].varianten} variants`);
  }
  // maths: wherever it helps with a picture or a model (units: choosing cm/m or g/kg has only a tip).
  // Measured 04.11. over 3 000 rounds: numbers/combos/graphs 100 %, wordprob 76 %, units 49 %. With 80 rounds the old
  // limit of 40 % for units failed in about 1 of 27 runs by chance; 30 % keeps the meaning and fails by chance < 1 in 4 000.
  for (const [k, min] of [['numbers', 0.6], ['combos', 0.6], ['wordprob', 0.6], ['graphs', 0.6], ['units', 0.3]]) assert.ok(r[k].bild / r[k].anzahl >= min, `${k}: foundation with a picture or model (${r[k].bild}/${r[k].anzahl})`);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('„braucht Unterstuetzung“: jede Runde der 10 Quests hat mindestens 2 Grundlage-Aufgaben, keine doppelt', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  // 12 answers at year level on 3 days, all wrong → requires support (RS) for every quest
  const ev = Object.fromEntries(NEU.map((k) => [k, Array.from({ length: 12 }, (_, i) => [tag(i % 3), 2, 0])]));
  await page.evaluate((e) => localStorage.setItem('bq2_ev', JSON.stringify(e)), ev);
  const r = await page.evaluate((NEU) => {
    const G = window.__g, out = {};
    for (const k of NEU) {
      const runden = Array.from({ length: 20 }, () => G.adaptRound(k, G.WORLDS[k].build()));
      out[k] = { st: G.standOf(k), l1: runden.map((rd) => rd.filter((q) => G.levelOf(q) === 1).length), l3: runden.map((rd) => rd.filter((q) => G.levelOf(q) === 3).length),
        // only the foundation tasks (other tasks of a quest can repeat already - finding, not part of Auftrag 1)
        doppelt: runden.filter((rd) => { const a = rd.filter((q) => G.levelOf(q) === 1).map(G.qId); return new Set(a).size !== a.length; }).length };
    }
    return out;
  }, NEU);
  for (const k of NEU) {
    assert.equal(r[k].st, 'RS', k);
    assert.ok(r[k].l1.every((x) => x >= 2), `${k}: at least 2 foundation tasks per round: ${r[k].l1.join(',')}`);
    assert.ok(r[k].l3.every((x) => x === 0), `${k}: no challenge`);
    assert.equal(r[k].doppelt, 0, k + ': no foundation task twice in a round');
  }
  assert.deepEqual(fehler, []);
  await ctx.close();
});

// EV-3.3: real card path for all ten quests, tip, another worked example, own answer (with help).
for (const quest of NEU) {
  const [hilfe, beispiel] = quest === 'anleitung' ? ['Zeig mir, wie', 'Zeig mir ein Beispiel'] : ['Show me how', 'Show me an example'];
  test(`Klick: ${quest} – Grundlage zeigt Tipp, prüft Beispiel/Ausnahme, eigene Antwort zählt mit Hilfe`, async () => {
    const { ctx, page, fehler } = await appOeffnen(browser, server.url);
    const karte = (await alleKarten(page)).find((x) => x.item === quest);
    await karteOeffnen(page, karte);
    let s = await zustand(page);
    const i = s.round.findIndex((q) => (q.level || 2) === 1);
    assert.ok(i >= 0, 'a foundation task in the round');
    for (let j = 0; j < i; j++) { await frageBeantworten(page, s.round[j]); await klick(page, '#nextBtn'); s = await zustand(page); }
    const q = s.round[s.idx];
    assert.equal(q.level, 1);
    const label = (await page.textContent('#helpBtn')).trim();
    assert.ok(label.includes(hilfe) || /Show me|Zeig mir/.test(label), 'help button: ' + label);
    await page.locator('#helpBtn').click();
    const fb = await page.textContent('#feedback');
    assert.ok(fb.includes(q.tip.replace(/<[^>]+>/g, '')), 'own tip shown: ' + fb);
    const nochKnopf = (await page.isVisible('#helpBtn')) && (await page.textContent('#helpBtn')).includes(beispiel);
    const withExample = !isException(q);
    assert.equal(nochKnopf, withExample, 'only the named exceptions omit the example');
    assert.ok(await page.isVisible('#answerBtn'), 'normal solution remains reachable');
    const vorher = await zustand(page);
    const evVorher = await page.evaluate(() => localStorage.getItem('bq2_ev'));
    if (withExample) {
      await page.locator('#helpBtn').click();
      assert.equal(await page.textContent('#feedback .mark'), quest === 'anleitung' ? 'Ein Beispiel' : 'An example');
    } else assert.equal(vorher.example, null);
    const danach = await zustand(page);
    assert.deepEqual(danach.round, vorher.round, 'own round untouched');
    assert.equal(danach.answered, false, 'own question remains open');
    assert.equal(await page.isVisible('#nextBtn'), false);
    assert.equal(await page.locator('#qAnswers .correct').count(), 0, 'own answer not highlighted');
    assert.equal(await page.evaluate(() => localStorage.getItem('bq2_ev')), evVorher, 'example writes no learning evidence');
    await frageBeantworten(page, q);
    const attempt = await page.evaluate(() => JSON.parse(localStorage.getItem('bq2_attempts')).at(-1));
    assert.deepEqual([attempt.ok, attempt.help, attempt.example], [true, true, withExample]);
    assert.equal((await zustand(page)).answered, true);
    assert.deepEqual(fehler, []);
    await ctx.close();
  });
}

// Exact family matrix, rather than relying on the random family in the real card paths above.
// The fixtures come from the actual generators, with invented values and fixed random seed.
const FAMILIEN = { numbers: 6, combos: 5, wordprob: 4, forces: 8, units: 4, graphs: 3, sentences: 8, words: 8, anleitung: 8, library: 8 };
for (const [quest, count] of Object.entries(FAMILIEN)) {
  test(`EV-3.3 Browsermatrix ${quest}: alle ${count} Familien, Beispiel löst eigene Aufgabe nicht, Antwort mit Hilfe`, async () => {
    const S = appSandbox({ seed: 3362 }), questions = [];
    if (['numbers', 'combos', 'wordprob', 'units', 'graphs'].includes(quest)) {
      for (let i = 0; i < count; i++) questions.push(S.holen(quest + 'BaseQ')(i));
      if (quest === 'units') {
        questions[3] = S.holen('unitsBaseQ')(3, { draw: () => 2, variant: { short: true } });
        questions.push(S.holen('unitsBaseQ')(3, { draw: () => 2, variant: { short: false } }));
      }
    } else {
      const byFamily = new Map();
      for (let i = 0; i < 200 && byFamily.size < count; i++) {
        const q = S.holen('baseQ')(quest, { world: quest, label: quest });
        byFamily.set(q.foundationFamily, q);
      }
      assert.equal(byFamily.size, count);
      questions.push(...[...byFamily].sort(([a], [b]) => a - b).map(([, q]) => q));
    }
    const round = questions.slice();
    while (round.length < 8) round.push(questions[round.length % questions.length]);
    const { ctx, page, fehler } = await appOeffnen(browser, server.url, { fixture: { world: quest, round } });
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i], withExample = !isException(q), before = await zustand(page);
      assert.equal(before.idx, i);
      const evidence = await page.evaluate(() => localStorage.getItem('bq2_ev'));
      const due = await page.evaluate(() => localStorage.getItem('bq2_due'));
      await klick(page, '#helpBtn');
      assert.ok((await page.textContent('#feedback')).includes(q.tip), 'own tip actually reachable');
      assert.equal(await page.isVisible('#helpBtn'), withExample, `${quest}/${q.foundationFamily}: explicit example/exception matrix`);
      assert.ok(await page.isVisible('#answerBtn'), 'normal solution remains available');
      if (withExample) {
        assert.equal(await page.textContent('#helpBtn'), quest === 'anleitung' ? 'Zeig mir ein Beispiel' : 'Show me an example');
        await klick(page, '#helpBtn');
      }
      const state = await zustand(page), ex = state.example;
      if (withExample) {
        assert.ok(ex, `${quest}/${i}`);
        assert.equal(ex.foundationFamily, q.foundationFamily);
        assert.notEqual(ex.prompt + (ex.visual || ''), q.prompt + (q.visual || ''), 'different stimulus, not just shuffled choices');
        assert.notEqual(answer(ex), answer(q), 'provided example does not supply the original answer');
        assert.equal(await page.textContent('#feedback .mark'), quest === 'anleitung' ? 'Ein Beispiel' : 'An example');
        assert.ok((await page.textContent('#feedback .worked')).includes(ex.explain));
      } else {
        assert.equal(ex, null, 'fixed-answer exception');
        assert.equal(await page.locator('#feedback .worked').count(), 0);
      }
      assert.equal(await page.evaluate(() => window.__g.qId(window.__bq.round[window.__bq.idx])), S.holen('qId')(q), 'own question ID unchanged');
      assert.equal(await page.textContent('#qPrompt'), String(q.prompt).replace(/<[^>]+>/g, ''));
      assert.deepEqual(state.round, before.round);
      assert.deepEqual(state.results, before.results);
      assert.equal(state.answered, false);
      assert.equal(state.stars, before.stars);
      assert.equal(await page.locator('#qAnswers .correct').count(), 0);
      assert.equal(await page.isVisible('#nextBtn'), false);
      assert.equal(await page.evaluate(() => localStorage.getItem('bq2_ev')), evidence);
      assert.equal(await page.evaluate(() => localStorage.getItem('bq2_due')), due);
      await frageBeantworten(page, q);
      const attempt = await page.evaluate(() => JSON.parse(localStorage.getItem('bq2_attempts')).at(-1));
      assert.deepEqual([attempt.ok, attempt.help, attempt.example, attempt.level], [true, true, withExample, 1]);
      assert.equal((await zustand(page)).stars, before.stars + 1);
      await klick(page, '#nextBtn');
    }
    assert.deepEqual(fehler, []);
    await ctx.close();
  });
}

const EXCEPTION_CASES = Object.entries(FIXED_ANSWER_EXCEPTIONS).flatMap(([world, families]) => families.map(family => [world, family]));
for (const [quest, family] of [...EXCEPTION_CASES, ['units', 3]]) {
  test(`EV33-CC-M1 Browserausnahme ${quest}/${family}: Tipp und normaler Lösungsweg bleiben erreichbar`, async () => {
    const S = appSandbox({ seed: 3331 });
    let q;
    if (quest === 'units') q = S.holen('unitsBaseQ')(3, { draw: () => 2, variant: { short: false } });
    else for (let i = 0; i < 200 && !q; i++) {
      const next = S.holen('baseQ')(quest, { world: quest, label: quest });
      if (next.foundationFamily === family) q = next;
    }
    assert.ok(q, 'real generated foundation question');
    const { ctx, page, fehler } = await appOeffnen(browser, server.url, { fixture: { world: quest, round: Array(8).fill(q) } });
    await klick(page, '#helpBtn');
    assert.ok((await page.textContent('#feedback')).includes(q.tip), 'tip actually shown');
    assert.equal(await page.isVisible('#helpBtn'), false, 'no answer-revealing example');
    assert.equal((await zustand(page)).answered, false);
    assert.equal(await page.locator('#qAnswers .correct').count(), 0);
    assert.equal(await page.textContent('#answerBtn'), quest === 'anleitung' ? 'Zeig mir die Lösung' : 'Show me the answer');
    assert.ok(await page.isVisible('#answerBtn'));
    await klick(page, '#answerBtn');
    assert.ok((await page.textContent('#feedback')).includes(q.explain), 'normal worked solution reached on request');
    assert.equal((await zustand(page)).answered, true);
    assert.ok(await page.isVisible('#nextBtn'));
    const attempts = await page.evaluate(() => JSON.parse(localStorage.getItem('bq2_attempts')));
    assert.ok(attempts.some(a => a.solutionShown && a.help));
    assert.ok(!attempts.some(a => a.exampleShown));
    assert.deepEqual(fehler, []);
    await ctx.close();
  });
}
