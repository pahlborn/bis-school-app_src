import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { startSchoolAI } from './server.mjs';

test('local Big Quest host prepares all six rows without sending grades or account data to the matcher', async t => {
  const source = JSON.parse(await readFile(new URL('./bis-referenz.json', import.meta.url), 'utf8'));
  source.strengths = 'Runden klappt sicher.';
  source.nextSteps = 'Mehrschrittige Sachaufgaben üben.';
  const local = await startSchoolAI({ source, match: rows => {
    assert.deepEqual(rows, source.rows.map(({ criterion }, row) => ({ row, criterion })));
    return { matches: [{ row: 2, standard: 'M-N3' }, { row: 4, standard: 'M-N5' }] };
  } });
  t.after(() => local.close());
  assert.match(await (await fetch(local.origin)).text(), /const SCHULE_KI=".*Mastering Basic Numbers/);
  const endpoint = local.origin + '/__bq_school_ai';
  const request = (origin, body = JSON.stringify(source)) => fetch(endpoint, {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body,
  });
  assert.equal((await request('https://example.invalid')).status, 403);
  assert.equal((await request(local.origin, '{')).status, 400);
  const result = await request(local.origin);
  assert.equal(result.status, 200);
  const preview = await result.json();
  assert.equal(preview.title, source.title);
  assert.equal(preview.day, source.day);
  assert.equal(preview.strengths, source.strengths);
  assert.equal(preview.nextSteps, source.nextSteps);
  assert.deepEqual(preview.rows, source.rows.map((row, i) => ({ ...row, standard: ({ 2: 'M-N3', 4: 'M-N5' })[i] ?? null })));
});
