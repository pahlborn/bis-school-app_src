// Modul grundlage ohne Browser (Auftrag 1, Peter 03.11.): Grundlage-Aufgaben der Text-Quests mit Hauptstandard.
// Je Quest mindestens 6, alle Stufe 1, mit eigenem Tipp; die richtige Antwort ist nicht an der Laenge erkennbar
// (Pruefmass wie im Modul textfragen); keine Schul-, Klassen-, Lehrer- oder Ortsnamen.
//   node --test tests/module/grundlage.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GRUNDLAGE } from '../../src/module/grundlage.mjs';

const ohneTags = (t) => String(t).replace(/<[^>]+>/g, '');
const len = (t) => ohneTags(t).length;
const QUESTS = ['forces', 'sentences', 'words', 'anleitung', 'library'];
const MAX_ANTEIL = 0.4;   // wie textfragen: laengste bzw. kuerzeste Antwort hoechstens in 40 % der Fragen die richtige

test('jede Text-Quest mit Hauptstandard hat mindestens 6 Grundlage-Aufgaben, nur diese Quests', () => {
  assert.deepEqual(Object.keys(GRUNDLAGE).sort(), QUESTS.slice().sort());
  for (const k of QUESTS) assert.ok(GRUNDLAGE[k].length >= 6, `${k}: ${GRUNDLAGE[k].length} Aufgaben`);
});

test('Eintraege vollstaendig: Frage, richtige, 2-3 falsche Antworten, Erklaerung, Stufe 1, eigener Tipp, Bild optional', () => {
  for (const k of QUESTS) for (const r of GRUNDLAGE[k]) {
    const wo = `${k}: ${ohneTags(r[0]).slice(0, 50)}`;
    assert.ok(r.length === 6 || r.length === 7, wo);
    assert.ok(r[0] && r[1] && r[3], wo);
    assert.ok(Array.isArray(r[2]) && r[2].length >= 2 && r[2].length <= 3, 'falsche Antworten: ' + wo);
    assert.ok(!r[2].includes(r[1]) && new Set(r[2]).size === r[2].length, 'doppelte Antwort: ' + wo);
    assert.equal(r[4], 1, 'Stufe 1: ' + wo);
    assert.ok(typeof r[5] === 'string' && r[5].length > 15, 'Tipp: ' + wo);
    assert.ok(!ohneTags(r[5]).toLowerCase().includes(ohneTags(r[1]).toLowerCase()) || r[1].length < 3, 'der Tipp verraet die Antwort nicht: ' + wo);
    if (r.length === 7) assert.ok(typeof r[6] === 'string' && r[6], 'Bildtext: ' + wo);
  }
});

test('keine Frage doppelt, auch nicht gleich einer Frage der Klassenstufe', () => {
  const app = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  for (const k of QUESTS) {
    const fragen = GRUNDLAGE[k].map((r) => r[0] + '|' + r[1]);
    assert.equal(new Set(fragen).size, fragen.length, k + ': doppelte Frage');
    for (const r of GRUNDLAGE[k]) assert.ok(!app.includes(JSON.stringify(r[0]).slice(1, -1) + '","' + r[1]), 'gleiche Frage schon in der App: ' + r[0]);
  }
});

test('Laengenpruefung: die laengste (oder kuerzeste) Antwort ist hoechstens in 40 % der Fragen die richtige', () => {
  for (const k of QUESTS) {
    const bank = GRUNDLAGE[k];
    const laengste = bank.filter((r) => len(r[1]) > Math.max(...r[2].map(len))).length;
    const kuerzeste = bank.filter((r) => len(r[1]) < Math.min(...r[2].map(len))).length;
    assert.ok(laengste / bank.length <= MAX_ANTEIL, `${k}: laengste richtig in ${laengste}/${bank.length}`);
    assert.ok(kuerzeste / bank.length <= MAX_ANTEIL, `${k}: kuerzeste richtig in ${kuerzeste}/${bank.length}`);
  }
});

test('keine verbotenen Woerter (Schule, Ort, Klasse, Lehrkraefte, Plattform, Aufgabentitel)', () => {
  const verboten = fs.readFileSync(new URL('../../werkzeug/verbotene-woerter.txt', import.meta.url), 'utf8')
    .split(/\r?\n/).map((z) => z.trim()).filter((z) => z && !z.startsWith('#')).map((z) => z.toLowerCase());
  const text = JSON.stringify(GRUNDLAGE).toLowerCase();
  for (const w of verboten) assert.ok(!text.includes(w), 'verbotenes Wort: ' + w);
});

test('Deutsch nur in der Anleitung, sonst Englisch', () => {
  const deutsch = /\b(der|die|das|und|nicht|welche[rs]?|man)\b/i;
  for (const k of QUESTS) for (const r of GRUNDLAGE[k]) {
    const t = ohneTags(r[0] + ' ' + r[5]);
    if (k === 'anleitung') assert.ok(deutsch.test(t), 'Anleitung auf Deutsch: ' + t);
    else assert.ok(!/\b(der|und|nicht|welche[rs]?)\b/i.test(t), 'Englisch: ' + t);
  }
});
