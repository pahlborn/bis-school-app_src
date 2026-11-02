// Vergleich mit der echten App (S12 P2, Aufgabe 3a; US7.2): ein Verlauf mit echten Klicks - Runden mit richtigen und
// falschen Antworten, Tipps, Beispiel, Loesung, einer abgebrochenen Quest, zwei Uebungsblaettern (Ergebnisse, Korrektur,
// verworfen) und Wiederholungen an mehreren Tagen. Die App schreibt dabei ihren Stand wie immer in den Speicher.
// Ein Mitschreiber im Testbau (Haken im Seitenkontext) faengt jede Aenderung der Speicherstellen ab und macht daraus
// Ereignisse - genau das, was die App in Aufgabe 3b schreiben soll. Danach muss derive(Ereignisse) denselben Stand
// liefern, den die App gespeichert hat: attempts, ev, due, total, best_*, badges, tried, treeStage, rankSeen, sheets, sheetNo.
//   node --test tests/ableitung-vergleich.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, zustand, klick, sichtbar, zurStart, elternOeffnen, elternSeite, alleKarten, karteOeffnen, frageBeantworten } from './app-hilfen.mjs';
import { derive, DERIVE_LIMITS, DERIVE_GAPS, DERIVE_TREE_AT, DERIVE_RANKS } from '../src/module/ableitung.mjs';
import { checkEvent } from '../src/module/ereignisse.mjs';

/* ---------- der Mitschreiber: laeuft in der Seite, im Bereich der App ---------- */
function haken() {
  window.__bqa = {
    derive, checkEvent,
    konst: () => ({ EVIDENCE_MAX, DUE_MAX, GAPS, TREE_AT, RANKS: RANKS.map((r) => r[1]) }),
  };
  const E = (window.__ereignisse = []); let letzte = 0;
  const senden = (type, payload) => { letzte = Math.max(Date.now(), letzte + 1); E.push(newEvent({ type, author: 'p_k1', device: 'd_a1', at: new Date(letzte).toISOString(), payload })); };
  const r0 = store.get('rankSeen', null);                                            // the first start (before this hook) already wrote the title
  if (r0) senden('rank_seen', { rank: r0 });
  const orig = store.set;
  store.set = function (k, v) {
    let vor; try { vor = store.get(k, undefined); } catch (e) { /* egal */ }
    orig.call(store, k, v);
    try { schreiben(k, vor, v); } catch (e) { (window.__fehler = window.__fehler || []).push(k + ': ' + ((e && e.stack) || e)); }
  };
  function schreiben(k, vor, v) {
    const heute = dayKey();
    if (k === 'attempts') {
      const alt = vor || [];
      if (v.length === alt.length + 1) { const zeile = v[v.length - 1]; if (!zeile.sheet) senden('answer', zeile); }   // Blattzeilen kommen als sheet_result
      else if (v.length > alt.length + 1) throw new Error('attempts: mehr als eine Zeile auf einmal');
    } else if (k === 'total') {
      senden('round_done', { day: heute, skill: state.world, stars: v - (vor || 0), count: state.round.length });
    } else if (k === 'badges') {
      for (const b of Object.keys(v)) for (let i = (vor && vor[b]) || 0; i < v[b]; i++) senden('badge', b === 'inquirer' ? { day: heute, badge: b, skill: state.world } : { day: heute, badge: b });
    } else if (k === 'rankSeen') {
      senden('rank_seen', { rank: v });
    } else if (k === 'due') {
      const alt = vor || [], neu = new Map(v.map((d) => [d.id, d])), vorher = new Map(alt.map((d) => [d.id, d]));
      for (const d of v) {
        const o = vorher.get(d.id);
        if (!o || (d.box === 0 && (o.box !== 0 || o.at !== d.at))) senden('review', { day: heute, qid: d.id, box: 0, dueAt: d.at, question: d.q });   // rememberWrong
        else if (o.box !== d.box) senden('review', { day: heute, qid: d.id, box: d.box, dueAt: d.at });                                                // advanceDue
      }
      for (const o of alt) if (!neu.has(o.id)) senden('review', { day: heute, qid: o.id, box: DERIVE_GAPS.length });                                      // done or taken back
    } else if (k === 'sheets') {
      const alt = vor || [], vorher = new Map(alt.map((s) => [s.id, s]));
      for (const s of v) {
        const o = vorher.get(s.id);
        if (!o) senden('sheet_created', { sheet: s.id, day: s.day, no: s.no, writing: s.writing, items: s.items.map((i) => ({ q: i.q, res: i.res })) });
        else s.items.forEach((it, i) => { if (it.res && it.res !== (o.items[i] && o.items[i].res)) senden('sheet_result', { sheet: s.id, index: i, res: it.res, day: heute, qid: it.q.dueId || qId(it.q) }); });
      }
      for (const o of alt) if (!v.some((s) => s.id === o.id)) senden('sheet_discarded', { sheet: o.id });
    }
  }
}

let browser, server;
before(async () => {
  browser = await browserStarten();
  server = await appServer({ bauart: 'test', anpassen: (h) => h.replace(/\}\)\(\);\s*<\/script>/, () => `(${haken.toString()})();})();</script>`) });
});
after(async () => { await browser?.close(); server?.close(); });

/* ---------- Spielen mit echten Klicks ---------- */
const lies = (page, k) => page.evaluate((key) => JSON.parse(localStorage.getItem('bq2_' + key) || 'null'), k);
async function quest(page, item) {
  const k = (await alleKarten(page)).find((x) => x.item === item);
  await karteOeffnen(page, k);
  return zustand(page);
}
async function falschGeben(page, q) {
  if (q.kind === 'mc') await klick(page, `#qAnswers .opt[data-i="${(q.answer + 1) % q.options.length}"]`);
  else if (q.kind === 'type') { for (const z of String(+q.answer + 1)) await klick(page, `#qAnswers .key[aria-label="${z}"]`); await klick(page, '#qAnswers .key.go'); }
  else { for (const k of [...q.correct].reverse()) await klick(page, `#qAnswers .ord[data-i="${k}"]`); await klick(page, '#checkOrder'); }
}
const tipp = async (page) => { if (await sichtbar(page, '#helpBtn')) await klick(page, '#helpBtn'); };
const beispiel = async (page) => { if (await sichtbar(page, '#helpBtn') && /example/i.test(await page.textContent('#helpBtn'))) await klick(page, '#helpBtn'); };

/** Eine Frage der laufenden Runde nach Verhalten beantworten und weiter. */
async function frage(page, verhalten) {
  const z = await zustand(page), q = z.round[z.idx];
  if (verhalten === 'richtig') await frageBeantworten(page, q);
  else if (verhalten === 'falsch') { await falschGeben(page, q); if (!(await sichtbar(page, '#nextBtn'))) await klick(page, '#answerBtn'); }
  else if (verhalten === 'falsch+richtig') { await falschGeben(page, q); if (!(await sichtbar(page, '#nextBtn'))) await frageBeantworten(page, q); }
  else if (verhalten === 'tipp+richtig') { await tipp(page); await frageBeantworten(page, q); }
  else if (verhalten === 'tipp+beispiel+richtig') { await tipp(page); await beispiel(page); await frageBeantworten(page, q); }
  else if (verhalten === 'tipp+loesung') { await tipp(page); await klick(page, '#answerBtn'); }
  else throw new Error('Verhalten unbekannt: ' + verhalten);
  await klick(page, '#nextBtn');
}
const runde = async (page, plan) => { for (const v of plan) await frage(page, v); };

/** Practise Today: faellige Wiederholungen abwechselnd richtig und falsch, den Rest richtig oder mit Tipp. */
async function heute(page, { falschDue = true } = {}) {
  await zurStart(page);
  await klick(page, '#todayBtn');
  const z0 = await zustand(page), n = z0.round.length;
  let d = 0;
  for (let i = 0; i < n; i++) {
    const z = await zustand(page), q = z.round[z.idx];
    await frage(page, q.dueId ? (falschDue && d++ % 2 === 1 ? 'falsch' : 'richtig') : (i % 3 === 0 ? 'tipp+richtig' : 'richtig'));
  }
  await zurStart(page);
}

const blattKnopf = (page, i, res) => page.locator(`#aboutBody details.psheet[open] button[data-i="${i}"][data-res="${res}"]`);

/* ---------- der Vergleich ---------- */
const STANDARD = { attempts: [], ev: {}, due: [], total: 0, badges: {}, tried: [], treeStage: 0, sheets: [], sheetNo: 0 };

test('derive(Ereignisse) liefert denselben Stand, den die App nach einem Verlauf mit echten Klicks gespeichert hat', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url, { zeit: '2026-11-02T09:00:00' });
  await page.evaluate(() => { window.print = () => {}; });
  const wartend = { due: 0, boxMax: 0 };

  // Tag 1: eine Quest mit allem, was ein Kind tun kann
  await quest(page, 'round');
  await runde(page, ['richtig', 'falsch', 'tipp+richtig', 'tipp+beispiel+richtig', 'tipp+loesung', 'falsch+richtig', 'falsch+richtig', 'richtig']);
  await klick(page, '#homeBtn');
  await quest(page, 'numbers');                                                      // zweite Quest, nach drei Fragen abgebrochen (keine fertige Runde)
  await runde(page, ['falsch+richtig', 'falsch', 'richtig']);
  await klick(page, '#quitBtn');
  await zurStart(page);

  // zwei Uebungsblaetter; eines wird bearbeitet, eines verworfen
  await klick(page, '#sheetBtn'); await page.locator('#sheetClose').click(); await zurStart(page);
  await page.clock.setFixedTime(new Date('2026-11-02T09:05:00'));                    // the sheet id contains the time: stand still would give two equal ids
  await klick(page, '#sheetBtn'); await page.locator('#sheetClose').click(); await zurStart(page);
  await elternOeffnen(page);
  await elternSeite(page, 'sheets');
  const [b1, b2] = await lies(page, 'sheets');
  await page.locator(`details.psheet[data-sheetid="${b1.id}"] > summary`).click();
  const n = b1.items.length;
  for (let i = 0; i < n; i++) await blattKnopf(page, i, ['ok', 'help', 'no'][i % 3]).click();   // alle Aufgaben: das Abzeichen Principled
  await blattKnopf(page, 0, 'no').click();                                          // Korrektur: ok -> noch nicht
  await blattKnopf(page, 2, 'ok').click();                                          // Korrektur: noch nicht -> richtig (Wiederholung entfaellt)
  await blattKnopf(page, 0, 'no').click();                                          // dasselbe nochmal: nichts aendert sich
  await page.locator(`details.psheet[data-sheetid="${b2.id}"] > summary`).click();
  page.once('dialog', (d) => d.accept());
  await page.locator(`details.psheet[data-sheetid="${b2.id}"] [data-discard]`).click();
  await page.locator('#parentClose').click();

  // Tag 2, 5 und 12: Wiederholungen werden faellig, weitergeschoben, erneut falsch, erledigt
  for (const tag of ['2026-11-03', '2026-11-06', '2026-11-13', '2026-11-14']) {
    await page.clock.setFixedTime(new Date(tag + 'T09:00:00'));
    await heute(page);
    const due = (await lies(page, 'due')) || [];
    wartend.due = Math.max(wartend.due, due.length); wartend.boxMax = Math.max(wartend.boxMax, ...due.map((d) => d.box), 0);
  }
  await zurStart(page);

  /* was die App gespeichert hat */
  const app = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith('bq2_')).map((k) => [k.slice(4), JSON.parse(localStorage.getItem(k))])));
  const ereignisse = await page.evaluate(() => window.__ereignisse), jetzt = Date.parse('2026-11-20T00:00:00Z');
  assert.deepEqual(await page.evaluate(() => window.__fehler || []), [], 'der Mitschreiber lief ohne Fehler');
  assert.deepEqual(fehler, []);

  /* die Ereignisse sind gueltig und der Verlauf hat alles beruehrt */
  assert.deepEqual(await page.evaluate((e) => e.flatMap((x) => window.__bqa.checkEvent(x)), ereignisse), [], 'alle Ereignisse sind gueltig');
  const arten = {}; for (const e of ereignisse) arten[e.type] = (arten[e.type] || 0) + 1;
  console.log('  Ereignisse:', JSON.stringify(arten), '| Wiederholungen: hoechstens', wartend.due, 'wartend, hoechste Stufe', wartend.boxMax, '| attempts', app.attempts.length);

  /* derive in Node und in Chromium: derselbe Stand */
  const inNode = derive(ereignisse, { now: jetzt });
  const imBrowser = await page.evaluate(([e, now]) => window.__bqa.derive(e, { now }), [ereignisse, jetzt]);
  assert.deepEqual(imBrowser, inNode, 'Node und Chromium rechnen gleich');

  /* ... und derselbe Stand wie in der App */
  const mit = (o, k) => (k in o ? o[k] : STANDARD[k]);
  for (const k of Object.keys(STANDARD)) assert.deepEqual(mit(inNode, k), mit(app, k), 'Wert ' + k);
  assert.deepEqual(Object.keys(inNode).filter((k) => k.startsWith('best_')).sort(), Object.keys(app).filter((k) => k.startsWith('best_')).sort(), 'best_-Schluessel');
  for (const k of Object.keys(app).filter((k) => k.startsWith('best_'))) assert.equal(inNode[k], app[k], k);
  assert.equal(inNode.rankSeen, app.rankSeen, 'rankSeen');
  assert.ok(DERIVE_RANKS.indexOf(app.rankSeen) >= 1, 'a title above the first one was reached: ' + app.rankSeen);
  assert.ok(Object.keys(app.ev).length >= 3 && app.due.length >= 1 && app.sheets.length === 1, 'der Stand ist nicht leer');
  assert.ok(app.treeStage >= 2, 'treeStage: ' + app.treeStage);

  /* der Verlauf hat alles beruehrt (sonst waere der Vergleich zu schwach) */
  for (const t of ['answer', 'round_done', 'badge', 'review', 'rank_seen', 'sheet_created', 'sheet_result', 'sheet_discarded']) assert.ok(arten[t] > 0, 'Verlauf hat ' + t + ' erreicht');
  assert.ok(app.attempts.some((a) => a.hintShown) && app.attempts.some((a) => a.solutionShown), 'Tipp und Loesung kamen vor');
  assert.ok(app.attempts.some((a) => a.solutionShown && a.beforeTry && a.attempt === 0), 'Loesung vor dem ersten Versuch (attempt 0)');
  assert.ok(app.attempts.some((a) => a.attempt === 2), 'zweiter Versuch');
  assert.ok(app.attempts.some((a) => a.sheet), 'Blattzeilen');
  assert.ok(app.badges.principled >= 1 && app.badges.inquirer >= 2, 'Abzeichen: ' + JSON.stringify(app.badges));
  assert.ok(app.tried.includes('round') && app.tried.includes('numbers'), 'tried: ' + app.tried);
  assert.ok(arten.review >= 4, 'Wiederholungen wurden geplant');

  /* die Grenzen und Tabellen des Moduls sind die der App */
  const k = await page.evaluate(() => window.__bqa.konst());
  assert.equal(k.EVIDENCE_MAX, DERIVE_LIMITS.evidence);
  assert.equal(k.DUE_MAX, DERIVE_LIMITS.due);
  assert.deepEqual(k.GAPS, DERIVE_GAPS);
  assert.deepEqual(k.TREE_AT, DERIVE_TREE_AT);
  assert.deepEqual(k.RANKS, DERIVE_RANKS);
  await ctx.close();
});
