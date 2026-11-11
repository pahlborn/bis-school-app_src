import test from 'node:test';
import assert from 'node:assert/strict';
import { newPersonKeys, publicKeysOf, signBytes } from '../../src/module/krypto.mjs';
import { createSchoolAiServer } from './server.mjs';

test('hosted KI requires a permitted parent signature and limits replay and model calls', async t => {
  const parent = await newPersonKeys();
  const outsider = await newPersonKeys();
  const origin = 'https://big-quest-test.github.io';
  const now = Date.now();
  const rows = [{ row: 0, criterion: 'Two-step subtraction word problems' }];
  let calls = 0;
  const server = createSchoolAiServer({ origin, parents: { p_Parent: (await publicKeysOf(parent)).ecdsa }, now: () => now,
    match: input => { calls++; assert.deepEqual(input, rows); return { matches: [{ row: 0, standard: 'M-N5' }] }; } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = 'http://127.0.0.1:' + server.address().port + '/v1/school-assessment';
  const request = async ({ sourceOrigin = origin, keys = parent, payload = {}, alter = false } = {}) => {
    const body = JSON.stringify({ account: 'p_Parent', nonce: crypto.randomUUID(), at: now, rows, ...payload });
    const signature = await signBytes(keys, 'bq-school-ai-v1\n' + origin + '\n' + body);
    return fetch(url, { method: 'POST', headers: {
      'Content-Type': 'application/json', Origin: sourceOrigin, 'X-BQ-Signature': signature,
    }, body: alter ? body + ' ' : body });
  };
  assert.equal((await request({ sourceOrigin: 'https://other.invalid' })).status, 403);
  assert.equal((await request({ keys: outsider })).status, 403);
  assert.equal((await request({ alter: true })).status, 403);
  assert.equal((await request({ payload: { at: now - 61000 } })).status, 403);
  assert.equal((await request({ payload: { rows: [{ ...rows[0], teacherRating: 'C' }] } })).status, 400);
  assert.equal(calls, 0);
  const nonce = crypto.randomUUID();
  const accepted = await request({ payload: { nonce } });
  assert.equal(accepted.status, 200);
  assert.deepEqual(await accepted.json(), { matches: [{ row: 0, standard: 'M-N5' }] });
  assert.equal((await request({ payload: { nonce } })).status, 409);
  for (let i = 0; i < 3; i++) assert.equal((await request()).status, 200);
  assert.equal((await request()).status, 429);
  assert.equal(calls, 4);
});
