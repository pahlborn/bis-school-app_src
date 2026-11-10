import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkEvent, newEvent } from '../../src/module/ereignisse.mjs';
import { deriveSchool } from '../../src/module/ableitung.mjs';

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
    [{ ...base, standard: 'M-N3' }, 'payload.standard: invalid'],
    [{ ...base, day: '2026-02-31' }, 'payload.day: invalid'],
  ]) assert.ok(checkEvent(event('school_evaluation', invalid, 1)).includes(expected), expected);
});
