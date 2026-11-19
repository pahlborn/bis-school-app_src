// Aufgaben-Durchlaeufe ohne Browser (Aufgabe "Tests schneller", 04.11.). Die sechs langen Browser-Durchlaeufe
// (fragen, lernlogik, beispiele) rechnen hier in Node: das unveraenderte App-Skript laeuft in einer Sandbox
// (tests/app-sandbox.mjs), Karten und Antwortknoepfe werden wie im Browser angeklickt, nur ohne Darstellung.
// Dazu, was seit #112 (Modul grundlage) und #115 (Modul runde) in jeder Runde stecken muss: 8 Aufgaben, keine
// doppelt, in den 10 Quests aus Auftrag 1 immer eine Grundlage-Aufgabe, andere Beispiele auf derselben Grundlage-Stufe (EV-3.3).
// Zufall mit Startwert: steht bei jedem Test als BQ_SEED=… in der Ausgabe; damit laesst sich ein Rot wiederholen.
//   node --test tests/aufgaben-node.test.mjs
// Im Browser bleibt je Fach ein kurzer Bedienweg (fragen.test.mjs, beispiele.test.mjs).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appSandbox, text } from './app-sandbox.mjs';
import { appLesen } from '../werkzeug/module.mjs';

const RUNDEN_JE_QUEST = 100;      // nur erzeugen und pruefen
const HEUTE_DURCHGESPIELT = 60;   // Practise Today: mischt Fragen aus mehreren Quests
const MIX_DURCHGESPIELT = 15;     // je Fach-Mix (die alte Mixed Quest hing bis 29.10. in etwa jeder 4. Runde)
const ANDERE_DURCHGESPIELT = 5;
const ZEITLIMIT = 5000;           // ms je Klick: eine Endlosschleife in der App wird rot statt zum Haenger
const RUNDENLIMIT = 20000;       // ms je durchgespielter Runde (ein Zeitlimit je Runde statt je Klick: schneller)
// die 10 Quests aus Auftrag 1: jede Runde hat eine Grundlage-Aufgabe (Stufe 1)
const GRUNDLAGE_QUESTS = ['numbers', 'combos', 'wordprob', 'forces', 'units', 'graphs', 'sentences', 'words', 'anleitung', 'library'];

const quelltext = appLesen('utf8');
const SENTS = new Function('return ' + quelltext.match(/const SENTS=(\[[\s\S]*?\n\]);/)[1])();
const ohneZeichen = (w) => w.replace(/[.,!?]/g, '');
const fmt = (n) => Number(n).toLocaleString('en-GB');
const level = (q) => q.level || 2;

/** Sandbox mit Startwert in der Testausgabe. */
function app(t, opt) { const S = appSandbox(opt); t.diagnostic('BQ_SEED=' + S.seed); return S; }

/** Gibt Widersprueche einer Frage zurueck (leer = in Ordnung). Wie bisher in fragen.test.mjs. */
function pruefeFrage(q) {
  const p = [];
  if (q.kind === 'mc') {
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) p.push('Loesungsindex ausserhalb');
    if (new Set(q.options).size !== q.options.length) p.push('doppelte Antwortknoepfe: ' + q.options.map(text).join(' | '));
    if (q.options.length < 2) p.push('weniger als zwei Antworten');
  }
  if (q.kind === 'type' && !/^\d{1,4}$/.test(q.answer)) p.push('Tippantwort nicht 1-4 Ziffern: ' + q.answer);
  if (q.kind === 'order' && [...q.correct].sort((a, b) => a - b).join() !== q.items.map((_, i) => i).join()) p.push('Reihenfolge keine Permutation');

  // Stellenwert: die gefragte Ziffer darf nur einmal in der Zahl stehen
  const sw = q.prompt.match(/What is the value of the <b>(\d)<\/b> in <b>([\d,]+)<\/b>/);
  if (sw) {
    const ziffern = sw[2].replace(/,/g, '');
    if (ziffern.split(sw[1]).length - 1 !== 1) p.push(`Stellenwert mehrdeutig: ${sw[1]} in ${sw[2]}`);
    const richtig = q.options[q.answer];
    const werte = [...ziffern].map((z, i) => (z === sw[1] ? fmt(+z * 10 ** (ziffern.length - 1 - i)) : null)).filter(Boolean);
    for (const o of q.options) if (o !== richtig && werte.includes(o)) p.push(`Stellenwert: ${o} als falsch angeboten, ist aber auch ein Wert der ${sw[1]}`);
  }

  // Grossbuchstaben zaehlen: Loesung = Anzahl Grossbuchstaben im richtigen Satz
  if (q.prompt.includes('How many capital letters are missing')) {
    const satz = q.explain.match(/^Correct: (.*?) That is/)[1];
    const n = (satz.match(/[A-ZÄÖÜ]/g) || []).length;
    if (String(n) !== q.answer) p.push(`Grossbuchstaben: erwartet ${q.answer}, im Satz "${satz}" stehen ${n}`);
  }

  // Welches Wort braucht einen Grossbuchstaben: falsche Antworten muessen klein stehen
  if (q.prompt.includes('MUST have a capital letter')) {
    const zitat = text(q.visual);
    const satz = SENTS.find((s) => s[0].toLowerCase() === zitat);
    if (!satz) p.push('Satz nicht gefunden: ' + zitat);
    else {
      const woerter = satz[0].split(' ').map(ohneZeichen);
      if(q.prompt.startsWith('Which sentence correctly shows')){
        const canonical=satz[0];
        if(q.options[q.answer]!==canonical)p.push('proper-name sentence: wrong canonical capitalization');
        if(q.options.filter(o=>o===canonical).length!==1)p.push('proper-name sentence: duplicate/missing correct answer');
      }else{
      const gross = (o) => woerter.some((w, i) => i > 0 && w.toLowerCase() === o && /^[A-ZÄÖÜ]/.test(w));
      q.options.forEach((o, i) => {
        if (i === q.answer && !gross(o)) p.push(`Eigenname: Loesung "${o}" steht im Satz nicht gross`);
        if (i !== q.answer && gross(o)) p.push(`Eigenname: "${o}" als falsch angeboten, steht im Satz aber gross`);
      });
      }
    }
  }
  return p;
}

/** Was jede Runde seit #112/#115 erfuellen muss: 8 Aufgaben, keine doppelt (Modul runde), Grundlage (Modul grundlage). */
function pruefeRunde(S, welt, runde) {
  const p = [], qId = S.holen('qId'), ids = runde.map(qId);
  if (runde.length !== 8) p.push(`${runde.length} statt 8 Aufgaben`);
  if (new Set(ids).size !== ids.length) p.push('Aufgabe doppelt: ' + text(runde[ids.findIndex((x, i) => ids.indexOf(x) !== i)].prompt).slice(0, 60));
  if (GRUNDLAGE_QUESTS.includes(welt) && !runde.some((q) => level(q) === 1)) p.push('keine Grundlage-Aufgabe');
  return p;
}

test('Fragen aller Quests: keine Widersprueche; jede Runde 8 Aufgaben, keine doppelt, Grundlage wo vorgesehen (Node)', (t) => {
  const S = app(t);
  const karten = S.alleKarten().filter((k) => !k.studio);
  const befunde = new Map(), welten = new Set();
  const merke = (b) => befunde.set(b, (befunde.get(b) || 0) + 1);
  for (const k of karten) {
    for (let r = 0; r < RUNDEN_JE_QUEST; r++) {
      const s = S.karteOeffnen(k, ZEITLIMIT);
      assert.equal(s.screen, 'play', k.item + ': Quest startet');
      welten.add(s.world);
      for (const q of s.round) for (const b of pruefeFrage(q)) merke(`${s.world}: ${b}`);
      for (const b of pruefeRunde(S, s.world, s.round)) merke(`${s.world}: Runde: ${b}`);
      S.klick('#quitBtn');
    }
  }
  assert.ok(welten.size >= 20, `nur ${welten.size} Quests gefunden`);
  assert.ok(GRUNDLAGE_QUESTS.every((w) => welten.has(w)), 'alle 10 Quests aus Auftrag 1 dabei');
  assert.deepEqual([...befunde].map(([b, k]) => `${b} (${k}x)`), []);
});

/** Spielt die laufende Runde mit den richtigen Antworten durch (ueber die Knoepfe der App). */
function durchspielen(S) {
  const start = S.zustand();
  assert.deepEqual(pruefeRunde(S, start.world, start.round), [], start.world);
  for (let f = 0; f < 8; f++) {
    const s = S.zustand(), q = s.round[s.idx];
    assert.equal(s.idx, f, `${s.world}: Frage ${f + 1} wurde nicht angezeigt (haengt)`);
    S.frageBeantworten(q, ZEITLIMIT);
    const fb = S.$('#feedback');
    assert.ok(!fb.hidden && fb.classList.contains('good'), `${s.world}: richtige Antwort nicht als richtig gewertet: ${text(q.prompt)}`);
    S.klick('#nextBtn', ZEITLIMIT);
  }
  assert.ok(S.sichtbar('#results'), 'Ergebnisseite nach Frage 8');
  assert.equal(S.$('#resScore').textContent, '8');
  S.klick('#homeBtn', ZEITLIMIT);
}

test('Practise Today und Fach-Mixe: viele Runden durchspielbar, ohne Haenger (Node, mit Zeitlimit)', (t) => {
  const S = app(t);
  for (let r = 0; r < HEUTE_DURCHGESPIELT; r++) {
    S.lauf(() => { S.klick('#todayBtn'); durchspielen(S); }, RUNDENLIMIT);
  }
  const mixe = S.alleKarten().filter((k) => k.item.startsWith('mix_'));
  assert.ok(mixe.length >= 4, `nur ${mixe.length} Fach-Mixe`);
  for (const m of mixe) for (let r = 0; r < MIX_DURCHGESPIELT; r++) S.lauf(() => { S.karteOeffnen(m); durchspielen(S); }, RUNDENLIMIT);
});

test('jede Quest: Runden mit richtigen Antworten ergeben 8 von 8 (Node)', (t) => {
  const S = app(t);
  const karten = S.alleKarten().filter((k) => !k.studio);
  assert.ok(karten.length >= 20, 'Karten: ' + karten.length);
  for (const k of karten) for (let r = 0; r < ANDERE_DURCHGESPIELT; r++) S.lauf(() => { S.karteOeffnen(k); durchspielen(S); }, RUNDENLIMIT);
});

/* ---------- "Show me an example" (bisher beispiele.test.mjs, echte Klicks) ---------- */
const antwort = (q) => q.kind === 'mc' ? text(String(q.options[q.answer])) : String(q.answer);
const FIXED_ANSWER_EXCEPTIONS = { sentences: [2, 3], anleitung: [2, 4], library: [1, 4] };
const foundationException = q => (FIXED_ANSWER_EXCEPTIONS[q.world] || []).includes(q.foundationFamily)
  || (q.world === 'units' && q.foundationFamily === 3 && antwort(q) === '1 m');

/** Je Karte `runden` Runden: Tipp, dann "Show me an example", falls angeboten; zaehlt, wo es eins gibt. */
function beispieleDurchgehen(S, items, runden, { zaehlt, beschriftung, kennung, beispielText, loesung }) {
  const karten = S.alleKarten().filter((k) => items.includes(k.item));
  assert.equal(karten.length, items.length, 'Karten gefunden: ' + karten.map((k) => k.item).join(','));
  let n = 0, mit = 0; const ohne = new Set(), fehl = [];
  for (const k of karten) {
    for (let r = 0; r < runden; r++) S.lauf(() => {
      S.karteOeffnen(k);
      for (let i = 0; i < 8; i++) {
        const s = S.zustand(), q = s.round[s.idx];
        if (S.$('#qAnswers').querySelector('#takeChallenge')) S.klick('#takeChallenge');
        const prompt = text(String(q.prompt));
        S.klick('#helpBtn');                                                   // Tipp
        const angeboten = S.sichtbar('#helpBtn') && beschriftung.test(S.$('#helpBtn').textContent);
        if (q.foundationFamily !== undefined && level(q) === 1 && angeboten === foundationException(q)) fehl.push('example/exception matrix violated: ' + q.world + '/' + q.foundationFamily);
        if (zaehlt(q, prompt)) { n++; if (angeboten) mit++; else ohne.add(kennung(q, prompt)); }
        if (angeboten) {
          S.klick('#helpBtn');                                                 // leichteres Beispiel
          const fb = S.$('#feedback').textContent;
          if (q.foundationFamily !== undefined && level(q) === 1) {
            const ex = s.example;
            if (!/An example|Ein Beispiel/.test(fb) || !ex || ex.foundationFamily !== q.foundationFamily || ex.prompt + (ex.visual || '') === q.prompt + (q.visual || '')) fehl.push('bad foundation example: ' + prompt);
          } else {
          if (!beispielText.test(fb)) fehl.push('kein Beispiel-Text: ' + prompt);
          const ex = ((fb.match(loesung) || [])[1] || '').trim();
          if (ex.toLowerCase() === antwort(q).trim().toLowerCase()) fehl.push('gives away the answer: ' + prompt);
          if (level(q) <= 1) fehl.push('example for an unrelated support-level task: ' + prompt);
          }
        }
        S.klick('#answerBtn'); S.klick('#nextBtn');
        if (S.sichtbar('#results')) break;
      }
      S.klick('#homeBtn');
    }, RUNDENLIMIT);
  }
  return { n, mit, ohne: [...ohne], fehl };
}

const MATHE = ['numbers', 'round', 'combos', 'wordprob', 'detective', 'units', 'graphs'];
// conceptual questions (why / what is / what to do) get a tip but no example
const KONZEPT = /^(Why|What should|What is the problem|What goes|Which digit|A problem has|How do you check|How can you check|You found|The problem says|Which answer is correctly|Your |This bar graph|Which hypothesis|You finished|How many centimetres are in 1 metre)/;

test('maths: an easier example for (almost) every computable task; never the task’s own answer (Node)', (t) => {
  const S = app(t);
  const r = beispieleDurchgehen(S, MATHE, 4, {
    zaehlt: (q, p) => level(q) > 1 && !KONZEPT.test(p) && MATHE.includes(q.world),
    beschriftung: /^Show me an example$/, kennung: (q, p) => p.replace(/\d[\d,.:]*/g, '#').slice(0, 70),
    beispielText: /An easier example/, loesung: /Answer: (.*?)Now you/s
  });
  t.diagnostic(`maths with example: ${r.mit}/${r.n}`);
  assert.deepEqual(r.fehl, []);
  assert.ok(r.mit / r.n >= 0.85, `coverage ${r.mit}/${r.n}: ` + r.ohne.join(' | '));
});

// English, German, Science, Library: hand-written easier examples (Peter, 01.11.). Questions that only ask for
// a definition, a fact about the class or a rule get a tip but no example.
const SPRACHE = ['opinion', 'sentences', 'examples', 'words', 'anleitung', 'library', 'forces'];
const WISSEN = /^(What is|What does|What should|What did|What do you|Why did|Wofür|Was ist|Was prüfst|Who collected|Which fairy tale|On # October|When you use|You want a book|Which is the best FIRST|Your class looked up|The library celebrated|Which research source is an encyclopedia|What is Kiddle|In the extension|Your partner|Your group|How do you attach|Which tool|Which force pulls|Which is an example of gravity|A force is|How do bicycle|Three trials gave|Why do we|Why does MORE friction|Why do people put sand|Why did the car|The car stopped quickly|Which of these would make)/;

test('English, German, Science, Library: an easier example wherever a task type allows it; never the answer (Node)', (t) => {
  const S = app(t);
  const norm = (p) => p.replace(/\d[\d,.:]*/g, '#');
  const r = beispieleDurchgehen(S, SPRACHE, 3, {
    // support level (1) has nothing easier - like maths (since A7/A8 the text questions have levels)
    zaehlt: (q, p) => !WISSEN.test(norm(p)) && level(q) > 1,
    beschriftung: /Show me an example|Zeig mir ein Beispiel/, kennung: (q, p) => q.world + ': ' + norm(p).slice(0, 70),
    beispielText: /An easier example|Ein leichteres Beispiel/, loesung: /(?:Answer|Lösung): (.*?)(?:Now you|Jetzt du)/s
  });
  t.diagnostic(`language with example: ${r.mit}/${r.n}`);
  assert.deepEqual(r.fehl, []);
  assert.ok(r.mit / r.n >= 0.85, `coverage ${r.mit}/${r.n}: ` + r.ohne.join(' | '));
});

test('Sandbox: Endlosschleife wird zum Fehler (Zeitlimit), App-Fehler kommen an', (t) => {
  const S = app(t);
  assert.throws(() => S.lauf(() => { for (;;) {} }, 200), /timed out/);
  assert.throws(() => S.lauf(() => S.holen('startRound')('gibt-es-nicht')), { name: 'TypeError' });
});
