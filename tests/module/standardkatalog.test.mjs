import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SCHOOL_STANDARD_CATALOG, schoolStandardInfo, schoolStandardsByQuest } from '../../src/module/standardkatalog.mjs';
import { appSandbox } from '../app-sandbox.mjs';
import { appLesen } from '../../werkzeug/module.mjs';

const plain = value => JSON.parse(JSON.stringify(value));

test('EV3.2: jeder bekannte Code ist eindeutig und hat Text in beiden Sprachen', () => {
  const source = fs.readFileSync(new URL('../../src/module/standardkatalog.mjs', import.meta.url), 'utf8');
  const codes = [...source.matchAll(/^  '([^']+)':/gm)].map(match => match[1]);
  assert.equal(codes.length, 15, '15 aus der bisherigen Standardliste übernommene Codes');
  assert.equal(new Set(codes).size, codes.length, 'kein überschriebener doppelter Objektschlüssel');
  assert.deepEqual(codes, Object.keys(SCHOOL_STANDARD_CATALOG));
  for (const [code, entry] of Object.entries(SCHOOL_STANDARD_CATALOG)) {
    assert.match(code, /^[A-Z]-[A-Z]\d+$/);
    for (const lang of ['de', 'en']) assert.ok(entry.text[lang]?.trim(), `${code}: ${lang}`);
    assert.equal(schoolStandardInfo(code), entry);
  }
});

test('EV3.2: Fach und alle Questbezüge existieren; jeder Haupt- und Nebenstandard ist erfasst', () => {
  const app = appSandbox(), get = app.holen;
  const worlds = get('WORLDS'), subjects = get('SUBJECTS'), standards = plain(get('STANDARDS'));
  for (const [code, entry] of Object.entries(SCHOOL_STANDARD_CATALOG)) {
    assert.ok(subjects.some(subject => subject.key === entry.subject), `${code}: bekanntes Fach`);
    assert.deepEqual(entry.quests, Object.keys(entry.questRanks));
    assert.equal(new Set(entry.quests).size, entry.quests.length, `${code}: eindeutige Questbezüge`);
    for (const quest of entry.quests) assert.ok(worlds[quest], `${code}: Quest ${quest} existiert`);
    assert.deepEqual(entry.quests.slice().sort(), Object.keys(standards).filter(quest => standards[quest].includes(code)).sort(), `${code}: bestehende Bezüge`);
  }
  assert.deepEqual(schoolStandardsByQuest(), standards, 'Haupt- und Nebenreihenfolge bleiben exakt gleich');
  for (const [quest, codes] of Object.entries(standards)) {
    for (const code of codes) assert.ok(schoolStandardInfo(code)?.quests.includes(quest), `${quest}: ${code}`);
  }
});

test('EV3.1: gültiger Standard ohne Quest und striktes Lookup ohne Prototyp-Treffer', () => {
  assert.deepEqual(schoolStandardInfo('E-S1').quests, []);
  for (const code of ['M-N999', 'none', 'toString', '__proto__', '', ' M-N1', 'm-n1', null, undefined, 1, {}]) {
    assert.equal(schoolStandardInfo(code), null, String(code));
  }
  assert.throws(() => { SCHOOL_STANDARD_CATALOG['E-S1'].quests.push('opinion'); }, TypeError);
});

test('EV3.2: Katalog steht in beiden App-Bauarten vor den Verbrauchern und ohne Namenskollision', () => {
  for (const bauart of ['live', 'test']) {
    const app = appLesen('utf8', { bauart });
    assert.equal(app.split('const SCHOOL_STANDARD_CATALOG =').length - 1, 1);
    assert.ok(app.indexOf('const SCHOOL_STANDARD_CATALOG =') < app.indexOf('const STANDARDS='));
    if (bauart === 'test') assert.ok(app.indexOf('const SCHOOL_STANDARD_CATALOG =') < app.indexOf('/* ---- Modul ereignisse '));
  }
});

test('EV3.2: unvollständige oder doppelte Ränge werden abgelehnt', () => {
  assert.throws(() => schoolStandardsByQuest({ a: { questRanks: { q: 1 } } }), /unvollständig/);
  assert.throws(() => schoolStandardsByQuest({ a: { questRanks: { q: 0 } }, b: { questRanks: { q: 0 } } }), /doppelt/);
});
