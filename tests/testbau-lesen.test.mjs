// Aufgabe 3b-2a (S12; US7.2): der Testbau liest die abzugleichenden Werte aus den Ereignissen - die echte App ohne
// Browser (Node-Sandbox, tests/app-sandbox.mjs). Dazu laufen die langen Aufgaben-Durchlaeufe und einige Bedienwege im
// Browser hier noch einmal gegen den Testbau (BQ_BAUART=test; Browser-Tests lesen den Speicher ueber tests/testbau-leser.mjs).
// Der Vergleich "Live-Bau gespeichert = Testbau aus Ereignissen" mit echten Klicks steht in tests/ableitung-vergleich.test.mjs.
//   node --test tests/testbau-lesen.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { appSandbox } from './app-sandbox.mjs';
import { derive } from '../src/module/ableitung.mjs';
import { newEvent } from '../src/module/ereignisse.mjs';
import { lesenArt } from '../src/module/lesen.mjs';

const pad = (n) => String(n).padStart(2, '0');
const heute = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const app = (t, opt = {}) => { const S = appSandbox({ bauart: 'test', ...opt }); t.diagnostic('BQ_SEED=' + S.seed); return S; };
const roh = (S) => Object.fromEntries([...S.ablage.entries()].filter(([k]) => k.startsWith('bq2_')).map(([k, v]) => [k.slice(4), JSON.parse(v)]));
const wert = (S, k, d) => { const v = S.lauf(() => S.holen('store').get(k, d)); return v === undefined ? v : JSON.parse(JSON.stringify(v)); };   // (values of the sandbox's realm)
const log = (S) => S.holen('evKindLog')(S.holen('evPre')());
const JETZT = () => Date.now() + 864e5;

/** eine Runde: die genannten Fragen falsch (dann die Loesung), mit Tipp oder richtig */
function runde(S, item, plan = {}) {
  S.karteOeffnen(S.alleKarten().find((k) => k.item === item));
  for (let f = 0; f < 8; f++) {
    const s = S.zustand(), q = s.round[s.idx];
    if (plan[f] === 'falsch') {
      S.lauf(() => {
        const A = S.$('#qAnswers');
        if (q.kind === 'mc') A.querySelector(`.opt[data-i="${(q.answer + 1) % q.options.length}"]`).click();
        else if (q.kind === 'type') { for (const z of String(+q.answer + 1)) A.querySelector(`.key[aria-label="${z}"]`).click(); A.querySelector('.key.go').click(); }
        else { for (const k of [...q.correct].reverse()) A.querySelector(`.ord[data-i="${k}"]`).click(); A.querySelector('#checkOrder').click(); }
      });
      if (S.$('#nextBtn').hidden) S.klick('#answerBtn');
    } else {
      if (plan[f] === 'tipp' && !S.$('#helpBtn').hidden) S.klick('#helpBtn');
      S.frageBeantworten(q);
    }
    S.klick('#nextBtn');
  }
  S.klick('#homeBtn');
}

test('Testbau: nach Runden kein alter Speicher fuer abzugleichende Werte; die App liest, was derive aus ihren Ereignissen rechnet; fortgeschrieben, nicht neu gerechnet', (t) => {
  const S = app(t, { seed: 192054348 }); // original CI seed; fixed original-L3/bridge mixture
  runde(S, 'round', { 1: 'falsch', 3: 'tipp' });
  runde(S, 'numbers', { 0: 'falsch', 5: 'falsch' });
  runde(S, 'round');
  const r = roh(S);
  assert.deepEqual(Object.keys(r).filter((k) => lesenArt(k)), [], 'nichts davon im alten Speicher: ' + Object.keys(r));
  assert.ok(Array.isArray(r.events) && r.events.length > 30, 'Ereignisse: ' + (r.events || []).length);
  const st = derive(r.events, { now: JETZT() });
  for (const k of ['attempts', 'ev', 'due', 'total', 'badges', 'tried', 'rankSeen', 'best_round', 'best_numbers']) assert.deepEqual(wert(S, k), st[k], k);
  // 21 correct answers remain 21: four initially paid answers in the last round reach M,
  // its following original L3 still pays 1, and its final three ordinary answers pay 0.
  assert.deepEqual(r.events.filter(e => e.type === 'round_reward').map(e => [e.payload.skill, e.payload.correct, e.payload.stars, e.payload.count]),
    [['round', 7, 7, 8], ['numbers', 6, 6, 8], ['round', 8, 5, 8]], 'correct answers and actual currency are separate');
  assert.equal(wert(S, 'total'), 18, '7 + 6 + 5 earned stars, no first-discovery bonus in these direct rounds');
  assert.equal(wert(S, 'best_round'), 8, '8/8 correctness survives the reduced payment');
  assert.equal(wert(S, 'best_numbers'), 6);
  assert.equal(wert(S, 'due').length, 3, 'three actual first-answer errors stay scheduled');
  assert.equal(wert(S, 'attempts').length, 28, '24 tasks plus four actual subsequent help/solution attempts');
  const z = log(S).zaehler;
  assert.equal(z.voll, 1, 'einmal ganz gerechnet (beim ersten Lesen), danach nur fortgeschrieben: ' + JSON.stringify(z));
  assert.ok(z.weiter >= r.events.length - 1, JSON.stringify(z));
  assert.equal(JSON.stringify(S.holen('eventErrors')), '[]');
});

test('Abgleich: Ereignisse eines anderen Geraets landen im Speicher - nach evNeuLaden (einmal) liest die App sie mit, vorher nicht', (t) => {
  const S = app(t);
  runde(S, 'round');
  const vorher = wert(S, 'attempts').length, eigen = roh(S).events, zv = log(S).zaehler.voll;
  const t0 = Date.parse(eigen[0].at) - 3600e3;
  const fremd = Array.from({ length: 6 }, (_, i) => newEvent({ type: 'answer', author: 'p_kind', device: 'd_ANDERESGERAET000001', at: new Date(t0 + i * 1000).toISOString(),
    payload: { day: heute(), skill: 'units', level: 2, attempt: 1, ok: i % 2 === 0, qid: 'fremd' + i } }));
  S.ablage.set('bq2_events', JSON.stringify(eigen.concat(fremd)));          // what the sync writes (task 3b-2b)
  assert.equal(wert(S, 'attempts').length, vorher, 'ohne neu Laden: der Zwischenstand von vorher');
  S.holen('evNeuLaden')();
  assert.equal(wert(S, 'attempts').length, vorher + 6);
  assert.deepEqual(wert(S, 'ev').units.length, 6, 'fremde Antworten zaehlen als Belege');
  assert.deepEqual(wert(S, 'attempts'), derive(eigen.concat(fremd), { now: JETZT() }).attempts, 'zeitlich einsortiert, wie derive');
  assert.equal(log(S).zaehler.voll, zv + 1, 'nach dem Abgleich genau einmal neu gerechnet');
  runde(S, 'round');                                                         // own events again: carried forward
  assert.equal(log(S).zaehler.voll, zv + 1, 'danach wieder fortgeschrieben');
  assert.equal(wert(S, 'attempts').length, vorher + 6 + 8);
});

test('Ton je Person: Kind und Erwachsener auf demselben Geraet haben je ihre eigene Einstellung; das Geraet speichert keinen Ton', (t) => {
  const S = app(t);
  const stumm = () => S.lauf(() => S.holen('isMuted')());
  assert.equal(stumm(), false);
  S.klick('#soundBtn');                                                      // the child switches the sound off
  assert.equal(stumm(), true);
  assert.equal(S.$('#soundBtn').textContent, 'Sound: off');
  S.holen('parentAccess=true');                                             // the grown-up acts (grown-ups' area open)
  assert.equal(stumm(), false, 'der Erwachsene hat seinen eigenen Ton');
  S.klick('#soundBtn'); S.klick('#soundBtn'); S.klick('#soundBtn');         // off, on, off
  assert.equal(stumm(), true);
  S.holen('parentAccess=false');
  assert.equal(stumm(), true, 'das Kind: weiter aus');
  S.klick('#soundBtn');
  assert.equal(stumm(), false, 'das Kind: an');
  S.holen('parentAccess=true');
  assert.equal(stumm(), true, 'der Erwachsene: weiter aus');
  const r = roh(S);
  assert.equal('muted' in r, false, 'kein Ton im Geraetespeicher');
  assert.deepEqual(r.events.filter((e) => e.type === 'profile_set').map((e) => [e.author, e.payload.value]), [['p_kind', true], ['p_kind', false]]);
  assert.deepEqual(r.personEvents.p_eltern.map((e) => e.payload.value), [true, false, true]);
});

test('Freigaben: "abgelaufen" folgt beim Lesen aus dem Enddatum - einmal im Protokoll, am ersten Tag danach; kein alter Speicher', (t) => {
  const S = app(t);
  S.holen('parentAccess=true');
  const hook = S.holen('eventHook');
  S.lauf(() => {
    hook('grant_set', { grant: 'g1', grantee: 'p_l1', scope: ['learning'], from: '2026-10-01', until: '2026-10-05' });
    hook('grant_set', { grant: 'g2', grantee: 'p_l2', scope: ['learning', 'school'], from: '2026-10-01', until: '2099-01-01' });
    hook('grant_set', { grant: 'g3', grantee: 'p_l3', scope: ['learning'], from: '2026-10-01', until: '2026-10-02' });
    hook('grant_revoked', { grant: 'g3', grantee: 'p_l3' });
  });
  const gs = wert(S, 'grants'), lg = wert(S, 'grantlog');
  assert.deepEqual(gs.map((g) => [g.id, !!g.expiredLogged, !!g.revokedAt]), [['g1', true, false], ['g2', false, false], ['g3', false, true]]);
  assert.deepEqual(lg.filter((e) => e.ev === 'abgelaufen').map((e) => [e.grant, e.at]), [['g1', '2026-10-06T00:00:00.000Z']]);
  assert.equal(lg.length, 5, 'drei erteilt, ein beendet, ein abgelaufen');
  assert.deepEqual(wert(S, 'grantlog'), lg, 'beim zweiten Lesen nicht noch einmal');
  assert.equal('grants' in roh(S) || 'grantlog' in roh(S), false);
  assert.equal(roh(S).events.some((e) => /abgelaufen/.test(JSON.stringify(e))), false, 'kein Ereignis fuer "abgelaufen"');
});

test('Sicherung im Testbau: die Datei enthaelt die Werte aus den Ereignissen (Zurueckspielen erst mit Aufgabe 6)', (t) => {
  const S = app(t);
  runde(S, 'round', { 2: 'falsch' });
  const data = JSON.parse(JSON.stringify(S.lauf(() => S.holen('backupData')())));
  for (const k of ['attempts', 'ev', 'due', 'total', 'badges', 'best_round', 'rankSeen']) assert.deepEqual(JSON.parse(data[k]), wert(S, k), k);
  assert.equal('events' in data, false, 'Ereignisse kommen mit Aufgabe 6 in die Sicherung');
  assert.deepEqual(Object.keys(data), Object.keys(data).slice().sort());
});

test('Live-Bau: liest keine Ereignisse, schreibt keine - auch wenn welche im Speicher liegen', (t) => {
  const e = newEvent({ type: 'answer', author: 'p_kind', device: 'd_ANDERESGERAET000001', at: new Date(Date.now() - 3600e3).toISOString(), payload: { day: heute(), skill: 'units', level: 2, attempt: 1, ok: true, qid: 'x' } });
  const alt = [{ day: heute(), skill: 'round', level: 2, attempt: 1, ok: true, qid: 'alt' }];
  const S = appSandbox({ bauart: 'live', speicher: { bq2_events: JSON.stringify([e]), bq2_attempts: JSON.stringify(alt) } });
  t.diagnostic('BQ_SEED=' + S.seed);
  assert.deepEqual(wert(S, 'attempts'), alt, 'der alte Speicher gilt');
  runde(S, 'round');
  const r = roh(S);
  assert.equal(r.attempts.length, 9, 'wie gewohnt gespeichert');
  assert.deepEqual(r.events, [e], 'Ereignisse unberuehrt'); assert.equal('evDevice' in r, false);
  assert.throws(() => S.holen('lesenArt'), /not defined/, 'kein Modul lesen im Live-Bau'); assert.equal(S.holen('EV_LESEN'), false);
});

test('Messwert in der App: 5 000 Ereignisse im Speicher - Start, erste Seite und eine Antwort', (t) => {
  const t0 = Date.now() - 200 * 864e5, l = [];
  for (let i = 0; i < 5000; i++) {
    const at = t0 + i * 3456e3, day = new Date(at).toISOString().slice(0, 10), skill = ['round', 'numbers', 'units', 'graphs'][i % 4];
    l.push(i % 10 === 9 ? newEvent({ type: 'round_done', author: 'p_kind', device: 'd_ALTESGERAET00000001', at: new Date(at).toISOString(), payload: { day, skill, stars: 6, count: 8 } })
      : newEvent({ type: 'answer', author: 'p_kind', device: 'd_ALTESGERAET00000001', at: new Date(at).toISOString(), payload: { day, skill, level: 1 + (i % 3), attempt: 1, ok: i % 3 !== 0, qid: 'q' + (i % 300) } }));
  }
  let a = performance.now();
  const S = app(t, { speicher: { bq2_events: JSON.stringify(l) } });
  const start = performance.now() - a;
  const zeiten = [];
  S.karteOeffnen(S.alleKarten().find((k) => k.item === 'round'));
  for (let f = 0; f < 8; f++) {
    const s = S.zustand(), q = s.round[s.idx];
    a = performance.now(); S.frageBeantworten(q); S.klick('#nextBtn'); zeiten.push(performance.now() - a);
  }
  a = performance.now(); S.klick('#homeBtn'); const heim = performance.now() - a;
  zeiten.sort((x, y) => x - y);
  t.diagnostic(`5000 Ereignisse: Start der App ${start.toFixed(0)} ms; eine Antwort Median ${zeiten[4].toFixed(1)} ms, hoechstens ${zeiten[7].toFixed(1)} ms; Startseite nach der Runde ${heim.toFixed(0)} ms`);
  assert.equal(wert(S, 'attempts').length, 200, 'die letzten 200 wie immer');
  assert.ok(wert(S, 'total') > 0);
  assert.equal(log(S).zaehler.voll, 1, 'nur einmal ganz gerechnet');
  // alone ~4 ms; in the full run (7 test files at once, browsers) up to ~115 ms were measured - the limit catches a full recompute per answer
  assert.ok(zeiten[4] < 250, 'eine Antwort bleibt fluessig: ' + zeiten[4].toFixed(1) + ' ms');
});

test('Fokus-Themen (Zwischenspeicher der Startseite) folgen den Ereignissen: Eltern waehlen ein Thema und nehmen es wieder heraus', (t) => {
  const S = app(t);
  S.holen('parentAccess=true');
  const fokus = () => JSON.parse(JSON.stringify(S.lauf(() => S.holen('focusTopics')())));
  const vorher = fokus();
  const neu = ['units', 'graphs', 'numbers'].find((k) => !vorher.includes(k));
  S.lauf(() => S.holen('toggleFocus')(neu));
  assert.ok(fokus().includes(neu), 'gewaehlt: ' + neu + ' in ' + fokus());
  assert.equal(wert(S, 'focusMode'), 'manual');
  S.lauf(() => S.holen('toggleFocus')(neu));
  assert.equal(fokus().includes(neu), false, 'wieder heraus');
  assert.deepEqual(wert(S, 'focusManual'), fokus());
  assert.equal('focusMode' in roh(S) || 'focusManual' in roh(S), false, 'nicht im alten Speicher');
});