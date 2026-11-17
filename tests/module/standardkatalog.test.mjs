import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SCHOOL_STANDARD_CATALOG, schoolStandardInfo, schoolStandardsByQuest } from '../../src/module/standardkatalog.mjs';
import { appSandbox } from '../app-sandbox.mjs';
import { appLesen } from '../../werkzeug/module.mjs';

const plain = value => JSON.parse(JSON.stringify(value));

test('EV3.2: jeder bekannte Code ist eindeutig und hat Text in beiden Sprachen', () => {
  const source = fs.readFileSync(new URL('../../src/module/standardkatalog.mjs', import.meta.url), 'utf8');
  const codes = [...source.matchAll(/^\s*(['"])([A-Z]-[A-Z]\d+)\1\s*:/gm)].map(match => match[2]);
  assert.ok(codes.length >= 15, 'alle 15 aus der bisherigen Standardliste übernommenen Codes');
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

test('EV3: bisherige Haupt-/Nebenstandards bleiben unverändert, auch nach Umsortieren des Katalogs', () => {
  const expected = {
    numbers: ['M-N1', 'M-N2'], round: ['M-N3', 'M-N6'], combos: ['M-N4', 'M-N6'], wordprob: ['M-N4', 'M-N5'], detective: ['M-N2', 'M-N3', 'M-D1'],
    forces: ['S-F1'], units: ['M-M1'], graphs: ['M-D1'], opinion: ['E-W1', 'E-S2'], sentences: ['E-W1'], examples: ['E-W1'], words: ['E-R1'],
    anleitung: ['D-W1'], library: ['E-W2'],
  };
  assert.deepEqual(plain(appSandbox().holen('STANDARDS')), expected);
  assert.deepEqual(schoolStandardsByQuest(Object.fromEntries(Object.entries(SCHOOL_STANDARD_CATALOG).reverse())), expected);
});

test('EV3: beide Sprachsichten, Fachzuordnung und Leseliste verwenden den Katalog', () => {
  const app = appSandbox(), get = app.holen;
  for (const lang of ['de', 'en']) {
    get('store').set(get('langKey')(), lang);
    const texts = get(lang === 'de' ? 'STANDARD_TEXT' : 'STANDARD_TEXT_EN');
    for (const [code, entry] of Object.entries(SCHOOL_STANDARD_CATALOG)) {
      assert.equal(texts[code], entry.text[lang]);
      assert.equal(get('stdSubject')(code), entry.subject);
    }
    const html = get('schoolStandardCatalogHTML')();
    assert.equal([...html.matchAll(/data-standard-code=/g)].length, Object.keys(SCHOOL_STANDARD_CATALOG).length);
    assert.match(html, /data-standard-subject="reading"/);
    assert.match(html, lang === 'de' ? /wird angezeigt, keine Übung in Big Quest/ : /shown here, no exercise in Big Quest/);
    assert.ok(get('schoolHTML')().includes('id="pStandardCatalog"'), 'Liste auch ohne Schulbewertungen sichtbar');
  }
  assert.equal(get('stdSubject')('M-ALT'), 'maths', 'unbekannte Altdaten behalten ihren Fallback');
});

test('EV3.2: synthetischer neuer Standard braucht nur einen Katalogeintrag', () => {
  const entry = "'T-X1': { subject: 'english', text: { de: 'Erfundenes Testlernziel', en: 'Invented test learning goal' }, questRanks: {} },";
  const app = appSandbox({ anpassen: html => html.replace('const SCHOOL_STANDARD_CATALOG = {', `const SCHOOL_STANDARD_CATALOG = {\n  ${entry}`) });
  assert.equal(app.holen('schoolStandardInfo')('T-X1').text.de, 'Erfundenes Testlernziel');
  assert.equal(app.holen('STANDARD_TEXT_EN')['T-X1'], 'Invented test learning goal');
  assert.equal(app.holen('stdSubject')('T-X1'), 'english');
  assert.match(app.holen('schoolStandardCatalogHTML')(), /data-standard-code="T-X1"/);
});

test('EV3.1: ohne Quest kein Fokus; reine Nebenbezüge bleiben Nebenbezüge; spätere Hauptquest wirkt mit bestehender Regel', () => {
  const data = { asOf: '2026-11-17', tasks: [{ day: '2026-11-17', area: 'english', title: 'Invented check', std: { 'E-S1': 'C', 'E-S2': 'C', 'M-N5': 'C', 'M-N6': 'C' }, quests: [], focusNext: [] }] };
  const adapt = addQuest => html => {
    const school = html.replace(/^const schoolData = .*$/m, `const schoolData = () => (${JSON.stringify(data)});`);
    return addQuest ? school.replace(/('E-S1': .*?questRanks: )\{\}/, '$1{ times: 0 }') : school;
  };
  const before = appSandbox({ anpassen: adapt(false) });
  assert.deepEqual(plain(before.holen('openGaps')()), [], 'keine Lücke allein durch fehlende oder sekundäre Questbezüge');
  assert.deepEqual(plain(before.holen('activeGapQuests')()), []);
  const after = appSandbox({ anpassen: adapt(true) });
  after.holen('store').set('unlocked', ['times']); // bestehende Vorschauquest für diese Testinstanz freigeben
  assert.deepEqual(plain(after.holen('gapQuests')('E-S1')), ['times']);
  assert.deepEqual(plain(after.holen('openGaps')()).map(gap => [gap.s, gap.quests]), [['E-S1', ['times']]]);
  assert.deepEqual(plain(after.holen('activeGapQuests')()), ['times']);
  assert.ok(after.holen('focusAuto')().includes('times'));
});
