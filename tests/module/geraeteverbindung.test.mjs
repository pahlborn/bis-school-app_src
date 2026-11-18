import { test } from 'node:test';
import assert from 'node:assert/strict';
import { anmNativeGeraet, anmNativeZugangGueltig } from '../../src/module/geraeteverbindung.mjs';

// Entirely synthetic access values; no Keychain, real API, or stored credentials.
const CODE = 'synthetic-device-access';
const NEW = 'synthetic-new-device-access';
function fixture({ existing = false, result = 'ok', native = CODE } = {}) {
  const calls = [], accepted = [];
  let connected = existing, saved = native;
  const device = anmNativeGeraet({
    postMessage: async m => {
      calls.push(m.action);
      if (m.action === 'read') return saved ? { status: 'ok', code: saved } : { status: 'missing' };
      if (m.action === 'remember') saved = m.code;
      if (m.action === 'forget' && saved === m.code) saved = null;
      return { status: 'ok' };
    },
    verbunden: () => connected,
    pruefen: async () => { calls.push('validate'); return result; },
    uebernehmen: code => { accepted.push(code); connected = true; },
  });
  return { device, calls, accepted, connected: () => connected, saved: () => saved };
}

test('EV-1.3: restore validates and accepts a missing web connection exactly once', async () => {
  const f = fixture();
  assert.equal(await f.device.starten(), 'verbunden');
  assert.deepEqual(f.calls, ['read', 'validate']);
  assert.deepEqual(f.accepted, [CODE]);
  assert.equal(await f.device.starten(), 'uebersprungen');
  assert.deepEqual(f.calls, ['read', 'validate']);
});

test('EV-1.3: an existing connection is not read or overwritten; a normal browser does nothing', async () => {
  const f = fixture({ existing: true });
  assert.equal(await f.device.starten(), 'uebersprungen');
  assert.deepEqual(f.calls, []);
  assert.equal(await anmNativeGeraet({ verbunden: () => false }).starten(), 'uebersprungen');
});

test('EV-1.3: invalid access falls back once; offline and limit do not delete the saved value', async () => {
  for (const result of ['falsch', 'offline', 'limit']) {
    const f = fixture({ result });
    assert.equal(await f.device.starten(), result);
    assert.equal(f.connected(), false);
    assert.deepEqual(f.accepted, []);
    assert.equal(f.saved(), result === 'falsch' ? null : CODE);
    assert.equal(await f.device.starten(), 'uebersprungen');
    assert.deepEqual(f.calls, result === 'falsch' ? ['read', 'validate', 'forget'] : ['read', 'validate']);
  }
});

test('EV-1.3: missing, failed and malformed native replies never create a connection', async () => {
  assert.equal(await fixture({ native: null }).device.starten(), 'leer');
  for (const reply of [{ status: 'error' }, { status: 'ok', code: 'x' }, { status: 'ok', code: 'sk-ant-synthetic-only' }]) {
    const device = anmNativeGeraet({ postMessage: async () => reply, verbunden: () => false, pruefen: () => assert.fail(), uebernehmen: () => assert.fail() });
    assert.equal(await device.starten(), 'fehler');
  }
  assert.equal(anmNativeZugangGueltig(CODE), true);
  assert.equal(anmNativeZugangGueltig('with whitespace'), false);
});

test('EV-1.3: saving reports native failure and rejects provider keys before the bridge', async () => {
  const calls = [];
  const device = anmNativeGeraet({ postMessage: async m => { calls.push(m); return { status: 'error' }; } });
  assert.equal(await device.merken('sk-ant-synthetic-only'), 'fehler');
  assert.deepEqual(calls, []);
  assert.equal(await device.merken(CODE), 'fehler');
  assert.deepEqual(calls, [{ action: 'remember', code: CODE }]);
});

test('EV-1.3: manual connection while restore read/validation is pending wins', async () => {
  for (const phase of ['read', 'validate']) {
    let resume, connected = false, saved = CODE;
    const gate = new Promise(resolve => { resume = resolve; });
    let entered;
    const ready = new Promise(resolve => { entered = resolve; });
    const device = anmNativeGeraet({
      verbunden: () => connected,
      postMessage: async m => {
        if (m.action === 'remember') { saved = m.code; return { status: 'ok' }; }
        if (phase === 'read') { entered(); await gate; }
        return { status: 'ok', code: CODE };
      },
      pruefen: async () => { if (phase === 'validate') { entered(); await gate; } return 'ok'; },
      uebernehmen: () => assert.fail('late restoration must not overwrite the manual connection'),
    });
    const restoring = device.starten();
    await ready;
    connected = true;
    assert.equal(await device.merken(NEW), 'ok');
    resume();
    assert.equal(await restoring, 'uebersprungen');
    assert.equal(saved, NEW);
  }
});

test('EV-1.3: late invalid reply and conditional forget cannot undo a fresh manual binding', async () => {
  let connected = false, saved = CODE, resume, entered;
  const gate = new Promise(resolve => { resume = resolve; });
  const ready = new Promise(resolve => { entered = resolve; });
  const device = anmNativeGeraet({
    verbunden: () => connected,
    pruefen: async () => 'falsch',
    uebernehmen: () => assert.fail(),
    postMessage: async m => {
      if (m.action === 'read') return { status: 'ok', code: CODE };
      if (m.action === 'remember') { saved = m.code; return { status: 'ok' }; }
      if (m.action === 'forget') {
        entered(); await gate;
        if (saved === m.code) saved = null;
        return { status: 'ok' };
      }
    },
  });
  const restoring = device.starten();
  await ready;
  connected = true;
  await device.merken(NEW);
  resume();
  assert.equal(await restoring, 'uebersprungen');
  assert.equal(saved, NEW);
});
