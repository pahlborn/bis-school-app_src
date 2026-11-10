import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkEvent, newEvent } from '../../src/module/ereignisse.mjs';
import { deriveSchool } from '../../src/module/ableitung.mjs';
import { appSandbox } from '../app-sandbox.mjs';

const day = '2026-11-05';
const at = day + 'T12:00:00Z';
const now = Date.parse(at);
const evaluation = '7d97af5e-6e19-46b8-85c6-d3c950a77680';
const base = {
  child: 'p_k1', evaluation, revision: '7d97af5e-6e19-46b8-85c6-d3c950a77681',
  title: 'Fiktive Evaluation', day: '2026-11-03', standard: 'M-N5', rating: 'C', focus: 'two-step',
};
function event(type, payload, n) {
  return newEvent({ type, payload, at, author: 'p_e1', device: 'd_e1' }, { rand: () => new Uint8Array(12).fill(n) });
}

test('school history retains both concurrent evaluations with the same title and date, the legacy import and only one retry', () => {
  const oldTask = { title: 'Fiktiver Altbestand', day, std: { 'M-N3': 'M' }, area: 'math' };
  const legacy = event('school_import', { asOf: day, data: { asOf: day, tasks: [oldTask] } }, 1);
  const first = event('school_evaluation', base, 2);
  const other = event('school_evaluation', {
    ...base, evaluation: '7d97af5e-6e19-46b8-85c6-d3c950a77682', revision: '7d97af5e-6e19-46b8-85c6-d3c950a77683',
    rating: 'M', focus: 'none',
  }, 3);
  const retry = event('school_evaluation', base, 4);
  const school = deriveSchool([retry, first, legacy, other, first], { now });
  assert.equal(school.asOf, day);
  assert.deepEqual(school.tasks[0], oldTask);
  assert.equal(school.tasks.length, 3);
  assert.equal(school.tasks[1].manual.evaluation, evaluation);
  assert.deepEqual(school.tasks[1].focusNext, ['wordprob']);
  assert.deepEqual(school.tasks[2].focusNext, []);
  assert.deepEqual(deriveSchool([legacy, other, retry, first], { now }), school);
});

test('manual event rejects out-of-scope fields, dates and incompatible ratings', () => {
  assert.deepEqual(checkEvent(event('school_evaluation', base, 1)), []);
  for (const [invalid, expected] of [
    [{ ...base, notes: 'Raw teacher remarks' }, 'payload.notes: unknown field'],
    [{ ...base, title: 'First line\nSecond line' }, 'payload.title: invalid'],
    [{ ...base, rating: 'M' }, 'payload.focus: incompatible with rating'],
    [{ ...base, standard: 'M-N1' }, 'payload.standard: invalid'],
    [{ ...base, standard: 'M-N3' }, 'payload.focus: incompatible with standard'],
    [{ ...base, focus: 'round-distance' }, 'payload.focus: incompatible with standard'],
    [{ ...base, day: '2026-02-31' }, 'payload.day: invalid'],
  ]) assert.ok(checkEvent(event('school_evaluation', invalid, 1)).includes(expected), expected);
});

test('a confirmed rounding evaluation maps to Rounding Road alongside an existing subtraction evaluation', () => {
  const rounding = {
    ...base, evaluation: '7d97af5e-6e19-46b8-85c6-d3c950a77684', revision: '7d97af5e-6e19-46b8-85c6-d3c950a77685',
    standard: 'M-N3', focus: 'round-distance',
  };
  const events = [event('school_evaluation', base, 1), event('school_evaluation', rounding, 2)];
  assert.deepEqual(checkEvent(events[1]), []);
  const { tasks } = deriveSchool(events, { now });
  assert.deepEqual(tasks.map(t => [t.manual.standard, t.focusNext]), [
    ['M-N5', ['wordprob']], ['M-N3', ['round']],
  ]);
});

test('a worked-answer bridge preserves a following school card and queues excess support', () => {
  const app = appSandbox({ seed: 42 });
  const makeQuestion = app.holen('twoStepQ');
  const source = makeQuestion();
  const schoolCard = Object.defineProperty(makeQuestion(), 'schoolRevision', { value: base.revision });
  const state = app.holen('state');
  state.round = [source, schoolCard, makeQuestion()];
  state.idx = 0;

  app.holen('queueBridge')(source);

  assert.equal(state.round[1], schoolCard);
  assert.equal(state.round[2].bridgePart, 'practice');
  assert.equal(state.round.length, 3);
  assert.equal(app.holen('store').get('bridgeNext', []).length, 2);
});

const rev = n => '7d97af5e-6e19-46b8-85c6-d3c950a776' + String(n).padStart(2, '0');
const edit = (n, parent, fields = {}) => event('school_evaluation', {
  ...base, revision: rev(n), base: parent, ...fields,
}, n);
const read = entries => deriveSchool(entries, { now }).tasks[0];
const original = event('school_evaluation', base, 1);

test('revisions keep the original history and withdrawal disables the targeted practice', () => {
  const correction = { title: 'Korrigierter Titel', standard: 'M-N3', focus: 'round-distance' };
  const changed = edit(10, base.revision, correction);
  const retry = edit(10, base.revision, correction);
  retry.id = 'e_' + 'f'.repeat(24);
  const withdrawn = edit(11, rev(10), { ...correction, withdrawn: true, focus: 'none' });
  assert.equal(deriveSchool([changed], { now }), null, 'a correction can arrive before its base');
  assert.deepEqual(read([changed, original, retry]).focusNext, ['round']);
  const task = read([withdrawn, changed, original, retry]);
  assert.equal(task.manual.evaluation, base.evaluation);
  assert.equal(task.manual.revision, rev(11));
  assert.equal(task.manual.withdrawn, true);
  assert.deepEqual(task.focusNext, []);
  assert.deepEqual(task.manual.history.map(p => p.revision), [base.revision, rev(10), rev(11)]);
});

test('parallel corrections preserve the common version and converge after explicit resolution', () => {
  const a = edit(12, base.revision, { title: 'A', standard: 'M-N3', focus: 'round-distance' });
  const b = edit(13, base.revision, { title: 'B', rating: 'M', focus: 'none' });
  const following = edit(14, rev(12), { title: 'A2', standard: 'M-N3', focus: 'round-distance' });
  const resolution = edit(15, base.revision, { title: 'Gewählt', standard: 'M-N3', focus: 'round-distance', resolves: [rev(12), rev(13)] });
  const parallel = edit(16, base.revision, { title: 'Alternativ', withdrawn: true, focus: 'none', resolves: [rev(12), rev(13)] });
  const late = edit(17, base.revision, { title: 'Spät' });
  const after = edit(18, base.revision, { title: 'Erneut gewählt', resolves: [rev(15), rev(16)] });
  const fork = [original, a, b, following];
  const conflicted = read(fork);
  assert.equal(conflicted.manual.revision, base.revision);
  assert.deepEqual(conflicted.manual.conflicts, [rev(12), rev(13)]);
  assert.ok(conflicted.manual.history.some(p => p.title === 'A2'));
  assert.equal(read([...fork, resolution]).manual.revision, rev(15));
  assert.deepEqual(read([...fork, resolution, late]).manual.conflicts, [rev(15), rev(17)]);
  assert.deepEqual(read([...fork, resolution, parallel]).manual.conflicts, [rev(15), rev(16)]);
  assert.deepEqual(read([...fork, resolution, parallel, after]).focusNext, ['wordprob']);
  assert.deepEqual(read([after, parallel, resolution, ...fork].reverse()), read([after, parallel, resolution, ...fork]));
  const foreign = edit(19, base.revision, { child: 'p_k2' });
  assert.deepEqual(read([...fork, foreign]), conflicted);
});

test('revision event rejects invalid bases, premature withdrawals and malformed resolutions', () => {
  for (const [payload, message] of [
    [{ ...base, base: base.revision }, 'payload.base: invalid revision base'],
    [{ ...base, focus: 'none', withdrawn: true }, 'payload.base: invalid revision base'],
    [{ ...base, base: rev(10), withdrawn: true }, 'payload.focus: withdrawn evaluation'],
    [{ ...base, base: rev(10), resolves: [rev(11), rev(11)] }, 'payload.resolves: invalid'],
    [{ ...base, base: rev(10), resolves: [rev(10), rev(11)] }, 'payload.resolves: invalid conflict revisions'],
  ]) assert.ok(checkEvent(event('school_evaluation', payload, 1)).includes(message), message);
});
