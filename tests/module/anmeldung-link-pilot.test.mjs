import test from 'node:test';
import assert from 'node:assert/strict';
import { anmEingefuegt } from '../../src/module/anmeldung.mjs';

const pilot = 'https://big-quest-test.github.io/probe-evaluation-form/';
const root = 'https://big-quest-test.github.io/';
const token = 'pilot-access-abcdefghijklmnop';
const start = 'C'.repeat(22);

test('isolated pilot accepts the main test-app device invitation without weakening storage authentication', () => {
  const invitation = root + '#zugang=' + token;
  assert.deepEqual(anmEingefuegt(invitation, pilot), { zugang: token, start: null });
  assert.deepEqual(anmEingefuegt(token, pilot), { zugang: token, start: null });
  assert.deepEqual(anmEingefuegt(root + '#zugang=' + token + '&start=max.mustermann/' + start, pilot), {
    zugang: token, start: { anmeldename: 'max.mustermann', code: start, fingerabdruck: null },
  });
});

test('cross-path exception applies ONLY to the exact pilot and test root', () => {
  assert.deepEqual(anmEingefuegt(root + '#zugang=' + token, 'https://big-quest-test.github.io/probe-other/'), { fremd: true });
  assert.deepEqual(anmEingefuegt('https://big-quest-test.github.io/unrelated/#zugang=' + token, pilot), { fremd: true });
  assert.deepEqual(anmEingefuegt('https://other.example/#zugang=' + token, pilot), { fremd: true });
  assert.deepEqual(anmEingefuegt(pilot + '#zugang=' + token, root), { fremd: true });
});
