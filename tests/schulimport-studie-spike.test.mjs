import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadSpikeFixtures,
  mapEnvelopeToAccounts,
  normalizeFileCsv,
  normalizeSchoolsBuddyCsv,
  normalizeToddleCapture,
  runFixtureStudy,
  toCurrentImport,
  validateNeutralEnvelope,
} from '../spikes/schulimport-studie/spike.mjs';

test('Toddle-Capture: neutrales Zwischenformat ist gueltig und wird per Name+Geburtsdatum zugeordnet', async () => {
  const fixtures = await loadSpikeFixtures();
  const envelope = normalizeToddleCapture(fixtures.toddle);
  assert.deepEqual(validateNeutralEnvelope(envelope), []);
  const mapped = mapEnvelopeToAccounts(envelope, fixtures.accounts);
  assert.deepEqual(mapped.unresolved, []);
  assert.equal(mapped.students[0].account.login, 'mira.sonnental');
  assert.equal(mapped.students[0].mapping.method, 'name-birthdate');
  const converted = toCurrentImport(mapped);
  assert.deepEqual(converted.problems, []);
  assert.deepEqual(Object.keys(converted.current.kinder), ['mira.sonnental']);
  assert.equal(converted.current.kinder['mira.sonnental'].tasks.length, 2);
});

test('Dateiimport: zwei Kinder werden automatisch einem Konto zugeordnet und ins aktuelle Zielformat gewandelt', async () => {
  const fixtures = await loadSpikeFixtures();
  const envelope = normalizeFileCsv(fixtures.fileCsv);
  assert.deepEqual(validateNeutralEnvelope(envelope), []);
  const mapped = mapEnvelopeToAccounts(envelope, fixtures.accounts);
  assert.deepEqual(mapped.unresolved, []);
  assert.deepEqual(mapped.students.map((student) => student.account.login).sort(), ['mira.sonnental', 'noah.berg']);
  const converted = toCurrentImport(mapped);
  assert.deepEqual(converted.problems, []);
  assert.deepEqual(Object.keys(converted.current.kinder).sort(), ['mira.sonnental', 'noah.berg']);
});

test('SchoolsBuddy-Export: ohne gespeicherte Quell-ID-Zuordnung bleibt Mira mehrdeutig, mit Zuordnung wird der Weg belastbar', async () => {
  const fixtures = await loadSpikeFixtures();
  const envelope = normalizeSchoolsBuddyCsv(fixtures.schoolsBuddyCsv);
  const auto = mapEnvelopeToAccounts(envelope, fixtures.accounts);
  assert.equal(auto.unresolved.length, 1);
  assert.equal(auto.unresolved[0].externalStudentId, 'sb-pupil-201');
  assert.equal(auto.unresolved[0].reason, 'name-mehrdeutig');
  const mapped = mapEnvelopeToAccounts(envelope, fixtures.accounts, fixtures.maps['schoolsbuddy-csv']);
  assert.deepEqual(mapped.unresolved, []);
  assert.equal(mapped.students.find((student) => student.externalStudentId === 'sb-pupil-201').account.login, 'mira.sonnental.zwei');
  const converted = toCurrentImport(mapped);
  assert.deepEqual(converted.problems, []);
  assert.deepEqual(Object.keys(converted.current.kinder).sort(), ['mira.sonnental.zwei', 'noah.berg']);
});

test('Studienlauf: alle drei Wege liefern mit ihrer passenden Zuordnung ein aktuelles, validiertes Zielformat', async () => {
  const results = await runFixtureStudy();
  assert.deepEqual(results.map((row) => row.adapter), ['toddle-cdp', 'file-csv', 'schoolsbuddy-csv']);
  assert.ok(results.every((row) => row.currentTargetValid), JSON.stringify(results));
  assert.deepEqual(results.find((row) => row.adapter === 'toddle-cdp').currentTargetChildren, ['mira.sonnental']);
  assert.deepEqual(results.find((row) => row.adapter === 'file-csv').currentTargetChildren.sort(), ['mira.sonnental', 'noah.berg']);
  assert.ok(results.find((row) => row.adapter === 'toddle-cdp').blockers.some((item) => /interaktive Anmeldung/.test(item)));
});
