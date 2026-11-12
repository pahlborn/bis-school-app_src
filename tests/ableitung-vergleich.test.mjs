// Vergleich mit der echten App (S12 P2, Aufgabe 3a; US7.2): ein Verlauf mit echten Klicks - Runden mit richtigen und
// falschen Antworten, Tipps, Beispiel, Loesung, einer abgebrochenen Quest, zwei Uebungsblaettern (eines traegt das Kind
// selbst ein, unterbrochen und fertig - A9; eines verwirft ein Erwachsener) und Wiederholungen an mehreren Tagen. Die App schreibt dabei ihren Stand wie immer in den Speicher.
// Seit Aufgabe 3b-1a schreibt der Testbau selbst an jeder Schreibstelle ein Ereignis (Modul schreiber, eventHook in
// index.html) nach bq2_events. Danach muss derive(Ereignisse) denselben Stand liefern, den die App gespeichert hat:
// attempts, ev, due, total, best_*, badges, tried, treeStage, rankSeen, sheets, sheetNo. (Bis 3b-0 erzeugte hier ein
// Mitschreiber im Test die Ereignisse aus den Speicheraenderungen.)
//   node --test tests/ableitung-vergleich.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, zustand, klick, sichtbar, zurStart, elternOeffnen, elternSeite, alleKarten, karteOeffnen, frageBeantworten } from './app-hilfen.mjs';
import { derive, DERIVE_LIMITS, DERIVE_GAPS, DERIVE_TREE_AT, DERIVE_RANKS } from '../src/module/ableitung.mjs';
import { checkEvent } from '../src/module/ereignisse.mjs';
import { lesenArt } from '../src/module/lesen.mjs';

/* ---------- Zugang zum Bereich der App (nur lesen) ---------- */
function haken() {
  window.__bqa = {
    derive, checkEvent,
    konst: () => ({ EVIDENCE_MAX, DUE_MAX, GAPS, TREE_AT, RANKS: RANKS.map((r) => r[1]) }),
    probleme: () => ({ abgelehnt: eventSink ? eventSink.problems : null, fehler: eventErrors }),
  };
}

/* the same random numbers in both builds (3b-2a): the same clicks then give the same questions */
const zufall = (h) => h.replace(/(\(function\(\)\{\r?\n'use strict';)/, (m) => m + ' (function(M){ let s=20261104; M.random=()=>{ s=(s+0x6D2B79F5)|0; let t=Math.imul(s^(s>>>15),1|s); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; })(Math);');

let browser, server, liveServer;
before(async () => {
  browser = await browserStarten();
  server = await appServer({ bauart: 'test', anpassen: (h) => zufall(h).replace(/\}\)\(\);\s*<\/script>/, () => `(${haken.toString()})();})();</script>`) });
  liveServer = await appServer({ bauart: 'live', anpassen: zufall });
});
after(async () => { await browser?.close(); server?.close(); liveServer?.close(); });

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

/* ---------- der Vergleich ---------- */
const STANDARD = { attempts: [], ev: {}, due: [], total: 0, badges: {}, tried: [], treeStage: 0, sheets: [], sheetNo: 0 };

/** der Verlauf mit echten Klicks (in beiden Bauarten derselbe) */
async function verlauf(url) {
  const { ctx, page, fehler } = await appOeffnen(browser, url, { zeit: '2026-11-02T09:00:00' });
  // Rendering effects such as confetti consume Math.random; their timing varies
  // between the live and event-sourcing builds and must not change quiz selection.
  await page.emulateMedia({ reducedMotion: 'reduce' });
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
  const [b1, b2] = await lies(page, 'sheets');
  // A9: das Kind traegt Blatt 1 selbst ein (Runde wie Practise Today), unterbrochen und spaeter fertig: Principled
  await klick(page, `#mySheets [data-mysheet="${b1.id}"]`);
  await runde(page, ['richtig', 'tipp+richtig', 'falsch']);
  await klick(page, '#quitBtn');
  await klick(page, `#mySheets [data-mysheet="${b1.id}"]`);
  await runde(page, ['falsch+richtig', 'tipp+beispiel+richtig', 'tipp+loesung']);
  await zurStart(page);
  await elternOeffnen(page);
  await elternSeite(page, 'sheets');
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

  return { ctx, page, fehler, wartend };
}

test('Testbau = Live-Bau (3b-2a): derselbe Verlauf; was der Live-Bau speichert, liest der Testbau aus den Ereignissen - und derive rechnet es nach', async () => {
  const lv = await verlauf(liveServer.url);
  const live = await lv.page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith('bq2_')).map((k) => [k.slice(4), JSON.parse(localStorage.getItem(k))])));
  assert.deepEqual(lv.fehler, []);
  await lv.ctx.close();
  const { ctx, page, fehler, wartend } = await verlauf(server.url);

  /* der Testbau: im Speicher nur Ereignisse und Geraetenotizen, die Werte liest er aus den Ereignissen */
  const roh = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('bq2_')).map((k) => k.slice(4)).sort());
  assert.deepEqual(roh.filter((k) => lesenArt(k)), [], 'der alte Speicher wird fuer abzugleichende Werte nicht mehr geschrieben');
  const schluessel = Object.keys(live).filter((k) => lesenArt(k) === 'kind');
  assert.ok(schluessel.length >= 10, 'der Live-Bau hat gespeichert: ' + schluessel);
  const app = { events: await lies(page, 'events'), evDevice: await lies(page, 'evDevice'), treeStage: await lies(page, 'treeStage') };
  for (const k of schluessel) app[k] = await lies(page, k);
  for (const k of schluessel) assert.deepEqual(app[k], live[k], 'Testbau aus Ereignissen = Live-Bau gespeichert: ' + k);
  assert.equal(app.treeStage, live.treeStage, 'treeStage (Geraetenotiz, in beiden gespeichert)');
  const ereignisse = app.events, jetzt = Date.parse('2026-11-20T00:00:00Z');
  assert.ok(Array.isArray(ereignisse) && ereignisse.length > 50, 'die App hat Ereignisse geschrieben: ' + (ereignisse && ereignisse.length));
  assert.deepEqual(await page.evaluate(() => window.__bqa.probleme()), { abgelehnt: [], fehler: [] }, 'nichts abgelehnt, kein Fehler im Schreiber');
  assert.deepEqual(fehler, []);
  assert.match(app.evDevice, /^d_[0-9A-Z]{20}$/, 'eine Geraete-Kennung');
  assert.ok(ereignisse.every((e) => e.device === app.evDevice), 'alle vom selben Geraet');
  const wer = {}; for (const e of ereignisse) wer[e.author] = (wer[e.author] || 0) + 1;
  assert.deepEqual(Object.keys(wer).sort(), ['p_eltern', 'p_kind'], 'Kind und (beim Verwerfen) Eltern: ' + JSON.stringify(wer));
  assert.deepEqual(ereignisse.filter((e) => e.author === 'p_eltern').map((e) => e.type), ['sheet_discarded'], 'die Eltern haben nur das Blatt verworfen');
  assert.deepEqual([ereignisse[0].type, ereignisse[0].payload], ['rank_seen', { rank: DERIVE_RANKS[0] }], 'erster Start: der erste Titel wird still gemerkt - auch als Ereignis');
  for (let i = 1; i < ereignisse.length; i++) assert.ok(Date.parse(ereignisse[i].at) > Date.parse(ereignisse[i - 1].at), 'Zeiten steigen: ' + i);

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

test('Live-Bau (3b-1): dieselben Klicks schreiben keine Ereignisse und keine Geraete-Kennung; Stand wie gewohnt', async () => {
  const live = await appServer({ bauart: 'live' });
  try {
    const { ctx, page, fehler } = await appOeffnen(browser, live.url, { zeit: '2026-11-02T09:00:00' });
    await page.evaluate(() => { window.print = () => {}; });
    await quest(page, 'round');
    await runde(page, ['richtig', 'falsch', 'tipp+richtig', 'tipp+loesung', 'richtig', 'richtig', 'falsch+richtig', 'richtig']);
    await zurStart(page);
    await klick(page, '#sheetBtn'); await page.locator('#sheetClose').click(); await zurStart(page);
    // 3b-1c: the grown-ups' area (glance, language, "How it works") writes no person log either
    await elternOeffnen(page);
    await page.locator('.phdr [data-plang="en"]').click();
    await page.locator('details.psec[data-psec="concept"] > summary').click();
    await page.waitForFunction(() => localStorage.getItem('bq2_conceptSeen') !== null);   // the toggle event comes a moment later
    const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('bq2_')).sort());
    assert.ok(keys.includes('bq2_attempts') && keys.includes('bq2_sheets') && keys.includes('bq2_due'), 'the app stored as usual: ' + keys);
    assert.ok(keys.includes('bq2_parentLang') && keys.includes('bq2_conceptSeen') && keys.includes('bq2_glance'), 'grown-ups area stored as usual: ' + keys);
    assert.deepEqual(keys.filter((k) => /events|evDevice/i.test(k)), [], 'no events in the live build (also no person log)');
    assert.deepEqual(fehler, []);
    await ctx.close();
  } finally { live.close(); }
});
