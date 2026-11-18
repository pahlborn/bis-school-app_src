// EV-1.3: real built web page and existing access validation, with a synthetic
// native bridge and storage server. This is not an iPad/Keychain execution.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten } from './app-hilfen.mjs';
import { githubNachbau } from './module/github-nachbau.mjs';
import { githubSpeicher } from '../src/module/github.mjs';
import { startcodeAusstellen, ersteAnmeldung } from '../src/module/konto.mjs';
import { anmStartlink } from '../src/module/anmeldung.mjs';

const REPO = 'example/synthetic-device-storage';
const TOKEN = 'synthetic-device-access-for-browser-test';
const OLD = 'synthetic-rejected-device-access';
const ADMIN_PASSWORD = 'Synthetic-Admin-Fixture-1';
let storage, server, browser, invitation;
before(async () => {
  storage = await githubNachbau({ token: TOKEN, repos: [REPO] });
  const access = githubSpeicher({ repo: REPO, token: TOKEN, basis: storage.basis }).geraet('d_SyntheticTool');
  const initial = await startcodeAusstellen({ zugang: access, aussteller: null, anmeldename: 'admin', art: 'admin', now: Date.now() });
  const admin = await ersteAnmeldung({ zugang: access, code: initial.code, passwort: ADMIN_PASSWORD, now: Date.now() });
  invitation = await startcodeAusstellen({ zugang: access, aussteller: admin, anmeldename: 'testparent', art: 'parent', now: Date.now() });
  assert.equal(await access.verbunden(), true, 'fixture includes the account directory required by the existing access check');
  const config = JSON.stringify({ art: 'github', repo: REPO, wurzel: '', basis: storage.basis });
  server = await appServer({ bauart: 'test', anpassen: h => h.replace('/*BQ_SPEICHER*/null', () => config) });
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); await storage?.schliessen(); });

async function device({ native = null, existing = null, bridge = true, locale = 'en-US', readGate = null, rememberGate = null, failSave = false, hash = '' } = {}) {
  const context = await browser.newContext({ locale });
  await context.route('**/*', r => r.request().url().startsWith(server.url) || r.request().url().startsWith(storage.basis) ? r.continue() : r.abort());
  const calls = [], errors = [];
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  await page.exposeFunction('syntheticNativeDevice', async message => {
    calls.push(message.action);
    if (message.action === 'read') {
      const old = native;
      if (readGate) await readGate;
      return old ? { status: 'ok', code: old } : { status: 'missing' };
    }
    if (message.action === 'remember') {
      if (rememberGate) await rememberGate;
      if (failSave) return { status: 'error' };
      native = message.code;
    }
    if (message.action === 'forget' && native === message.code) native = null;
    return { status: 'ok' };
  });
  await context.addInitScript(({ bridge, existing }) => {
    window.AudioContext = undefined; window.webkitAudioContext = undefined;
    if (!sessionStorage.getItem('prepared-device')) {
      if (existing) localStorage.setItem('bqt_gh', existing);
      sessionStorage.setItem('prepared-device', '1');
    }
    if (bridge) window.webkit = { messageHandlers: { bigQuestDeviceConnection: { postMessage: m => window.syntheticNativeDevice(m) } } };
  }, { bridge, existing });
  await page.goto(server.url + hash);
  return { context, page, calls, errors, native: () => native };
}
async function connect(page, value = TOKEN) {
  await page.locator('#verbLink').fill(value);
  await page.locator('#verbGo').click();
}

test('EV-1.3: only a validated manual device connection is remembered; no credential in visible fields', async () => {
  const d = await device();
  try {
    await d.page.locator('#verbLink').waitFor();
    await connect(d.page, OLD);
    await d.page.waitForFunction(() => /expired|abgelaufen/.test(document.querySelector('#verbMeldung')?.textContent || ''));
    assert.deepEqual(d.calls, ['read']);
    assert.equal(d.native(), null);
    await connect(d.page);
    await d.page.locator('#roleAdult').waitFor();
    await d.page.waitForFunction(() => !document.querySelector('#verbLink'));
    assert.deepEqual(d.calls, ['read', 'remember']);
    assert.equal(d.native(), TOKEN);
    assert.equal(await d.page.evaluate(() => localStorage.getItem('bqt_gh')), TOKEN);
    assert.equal(await d.page.evaluate(t => document.body.innerText.includes(t) || [...document.querySelectorAll('input')].some(i => i.value.includes(t)), TOKEN), false);
    assert.deepEqual(d.errors, []);
  } finally { await d.context.close(); }
});

test('EV-1.3: restart restores absent web access once; an existing binding is never replaced', async () => {
  const d = await device({ native: TOKEN });
  try {
    await d.page.locator('#roleAdult').waitFor();
    assert.equal(await d.page.evaluate(() => localStorage.getItem('bqt_gh')), TOKEN);
    assert.deepEqual(d.calls, ['read']);
    await d.page.reload();
    await d.page.locator('#roleAdult').waitFor();
    assert.deepEqual(d.calls, ['read'], 'an existing web connection does not request native access');
    await d.page.evaluate(() => localStorage.removeItem('bqt_gh'));
    await d.page.reload();
    await d.page.locator('#roleAdult').waitFor();
    assert.deepEqual(d.calls, ['read', 'read']);
    assert.deepEqual(d.errors, []);
  } finally { await d.context.close(); }
  const bound = await device({ native: OLD, existing: TOKEN });
  try {
    await bound.page.locator('#roleAdult').waitFor();
    assert.deepEqual(bound.calls, []);
    assert.equal(await bound.page.evaluate(() => localStorage.getItem('bqt_gh')), TOKEN);
  } finally { await bound.context.close(); }
});

test('EV-1.3: expired native access shows the normal connection route in DE/en-US without an automatic loop', async () => {
  for (const locale of ['de-DE', 'en-US']) {
    const d = await device({ native: OLD, locale });
    try {
      await d.page.waitForFunction(() => /expired|abgelaufen/.test(document.querySelector('#verbMeldung')?.textContent || ''));
      assert.match(await d.page.locator('#verbMeldung').textContent(), locale === 'de-DE' ? /Zugangscode.*abgelaufen/ : /access code.*expired/);
      assert.equal(await d.page.locator('#verbLink').inputValue(), '');
      assert.equal(await d.page.evaluate(() => localStorage.getItem('bqt_gh')), null);
      await d.page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
      assert.deepEqual(d.calls, ['read', 'forget']);
      assert.equal(d.native(), null);
      await connect(d.page);
      await d.page.locator('#roleAdult').waitFor();
      assert.equal(d.native(), TOKEN);
      assert.deepEqual(d.calls, ['read', 'forget', 'remember']);
      assert.deepEqual(d.errors, []);
    } finally { await d.context.close(); }
  }
});

test('EV-1.3: a late old native reply cannot overwrite a successful manual connection', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const d = await device({ native: OLD, readGate: gate });
  try {
    await d.page.locator('#verbLink').waitFor();
    await connect(d.page);
    await d.page.locator('#roleAdult').waitFor();
    release();
    await d.page.evaluate(() => new Promise(resolve => setTimeout(resolve, 30)));
    assert.equal(await d.page.evaluate(() => localStorage.getItem('bqt_gh')), TOKEN);
    assert.equal(d.native(), TOKEN);
    assert.deepEqual(d.calls, ['read', 'remember']);
    assert.equal(await d.page.locator('#roleAdult').isVisible(), true);
    assert.deepEqual(d.errors, []);
  } finally { release(); await d.context.close(); }
});

test('EV-1.3: native restore preserves an existing start-only invitation', async () => {
  const hash = anmStartlink('', { anmeldename: 'testparent', code: invitation.code, fingerabdruck: invitation.fingerabdruck });
  const d = await device({ native: TOKEN, hash });
  try {
    await d.page.locator('#kontoNeuForm').waitFor();
    assert.equal(await d.page.locator('#kontoNeuName').inputValue(), 'testparent');
    assert.equal(await d.page.locator('#kontoNeuName').isVisible(), true);
    assert.equal(await d.page.evaluate(() => location.hash), '');
    assert.equal(await d.page.evaluate(() => localStorage.getItem('bqt_gh')), TOKEN);
    assert.deepEqual(d.calls, ['read']);
    assert.deepEqual(d.errors, []);
  } finally { await d.context.close(); }
});

test('EV-1.3: browser-only behavior is unchanged and a native save failure is visible without undoing connection', async () => {
  const plain = await device({ bridge: false });
  try {
    await connect(plain.page);
    await plain.page.locator('#roleAdult').waitFor();
    assert.deepEqual(plain.calls, []);
    assert.deepEqual(plain.errors, []);
  } finally { await plain.context.close(); }
  const failed = await device({ failSave: true });
  try {
    await connect(failed.page);
    await failed.page.locator('#roleAdult').waitFor();
    await failed.page.getByText('The device connection could not be remembered.', { exact: false }).waitFor();
    assert.equal(await failed.page.evaluate(() => localStorage.getItem('bqt_gh')), TOKEN);
    assert.equal(failed.native(), null);
    assert.deepEqual(failed.errors, []);
  } finally { await failed.context.close(); }
});

test('EV-1.3: parent reconnect keeps fast and late save failures visible after the final render', async () => {
  for (const late of [false, true]) {
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const d = await device({ existing: TOKEN, native: OLD, failSave: true, rememberGate: late ? gate : null });
    try {
      await d.page.locator('#roleAdult').click();
      await d.page.locator('#loginUser').fill('admin');
      await d.page.locator('#loginPw').fill(ADMIN_PASSWORD);
      await d.page.locator('#loginGo').click();
      await d.page.locator('#parentClose').waitFor();
      await d.page.evaluate(value => localStorage.setItem('bqt_gh', value), OLD);
      await d.page.reload();
      await d.page.locator('#kTokenNeu').click();
      await d.page.locator('#kTokenNeuWert').fill(TOKEN);
      await d.page.locator('#kTokenGo').click();
      await d.page.waitForFunction(() => !document.querySelector('#kTokenForm'));
      release();
      const notice = d.page.locator('#aboutBody').getByText(/could not be remembered|konnte nicht gemerkt werden/);
      await notice.waitFor({ state: 'visible', timeout: 5000 });
      assert.equal(await d.page.locator('#login').isVisible(), false);
      assert.equal(await d.page.evaluate(() => localStorage.getItem('bqt_gh')), TOKEN);
      assert.equal(d.native(), OLD, 'failed save does not become a native success');
      await d.page.locator('#pSettings').click();
      await notice.waitFor({ state: 'visible', timeout: 5000 });
      assert.deepEqual(d.errors, []);
    } finally { release(); await d.context.close(); }
  }
});
