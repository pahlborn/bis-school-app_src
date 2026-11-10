import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluationEntwurf, claudeZuordnung } from './entwurf.mjs';
import { checkEvent, newEvent } from '../../src/module/ereignisse.mjs';

const fixture = {
  title: 'Zahlen und Rechnen',
  day: '2026-10-27',
  rows: [
    { criterion: 'Rounds whole numbers to the nearest 10, 100 and 1000', teacherRating: 'M' },
    { criterion: 'Solves two-step subtraction word problems', teacherRating: 'C' },
    { criterion: 'Place value to 9999', teacherRating: 'C' },
    { criterion: 'Adds three numbers', selfRating: 'E' },
  ],
};

test('matches map to valid Big Quest drafts and keep the teacher grades', async () => {
  const output = await evaluationEntwurf(fixture, rows => {
    assert.deepEqual(rows.map(({ row }) => row), [0, 1, 2]);
    assert.ok(rows.every(r => !Object.hasOwn(r, 'teacherRating')));
    return { matches: [{ row: 0, standard: 'M-N3' }, { row: 1, standard: 'M-N5' }] };
  });
  assert.deepEqual(output.proposals.map(p => [p.standard, p.rating, p.focus]), [
    ['M-N3', 'M', 'none'], ['M-N5', 'C', 'two-step'],
  ]);
  assert.deepEqual(output.unresolved, fixture.rows.slice(2));
  for (const { criterion, ...draft } of output.proposals) {
    assert.deepEqual(checkEvent(newEvent({ type: 'school_evaluation', author: 'p_Parent', device: 'd_Device',
      at: '2026-11-10T12:00:00.000Z', payload: { ...draft, child: 'p_Child',
        evaluation: crypto.randomUUID(), revision: crypto.randomUUID() } })), []);
  }
});

test('a missing grade, invented source row, unsupported standard or model-assigned grade cannot enter the draft', async () => {
  for (const match of [
    { row: 3, standard: 'M-N3' }, { row: 99, standard: 'M-N3' }, { row: 0, standard: 'M-N1' },
    { row: 0, standard: 'M-N3', rating: 'RS' },
  ]) await assert.rejects(evaluationEntwurf(fixture, () => ({ matches: [match] })), /ungültig/);
  const unknown = await evaluationEntwurf({ ...fixture, rows: [{ criterion: 'Rounding', teacherRating: '?' }] },
    () => assert.fail('Model should not be called.'));
  assert.equal(unknown.proposals.length, 0);
});

test('multiple possible mappings stay open rather than selecting one silently', async () => {
  const output = await evaluationEntwurf(fixture, () => ({
    matches: [{ row: 0, standard: 'M-N3' }, { row: 2, standard: 'M-N3' }],
  }));
  assert.deepEqual(output, { proposals: [], unresolved: fixture.rows });
});

test('Claude receives only numbered criterion text and returns a structured proposal', async () => {
  const rows = [{ row: 0, criterion: 'Round to the nearest hundred' }];
  const result = { matches: [{ row: 0, standard: 'M-N3' }] };
  assert.deepEqual(await claudeZuordnung(rows, { apiKey: 'test-only', request: async (url, options) => {
    assert.equal(url, 'https://api.anthropic.com/v1/messages');
    const body = JSON.parse(options.body);
    assert.deepEqual(JSON.parse(body.messages[0].content), rows);
    assert.equal(body.output_config.format.type, 'json_schema');
    return Response.json({ stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(result) }] });
  } }), result);
});
