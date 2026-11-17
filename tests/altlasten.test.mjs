// Altlasten entfernt (04.11., "Was bleibt auf dem Geraet" Gruppe D): alte Fokus-Form (focus, focusOn, focusOff) und
// alte Eltern-PIN (parentPin). Nichts liest oder wandelt sie mehr um; beim Start werden vorhandene Schluessel geloescht.
// Die PIN bleibt nur ohne Konten (unbebauter Stand, Tests) das Tor zum Elternbereich.
//   node --test tests/altlasten.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { appServer, browserStarten, appOeffnen, elternOeffnen } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen, alleSchluessel } from './konten-hilfen.mjs';

const ALT = ['focus', 'focusOn', 'focusOff'];
const quelltext = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const C = { mia: 'MIAA-2345', papa: 'PAPA-2345' };
let browser, ohne, mit;
before(async () => {
  browser = await browserStarten();
  ohne = await appServer();
  mit = await kontenServer({ users: [await konto('mia', 'student', C.mia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] })] });
});
after(async () => { await browser?.close(); ohne?.close(); mit?.close(); });
const MIA = () => mit.konten.users.find((u) => u.user === 'mia').id;

test('Quelltext: nichts liest, schreibt oder wandelt die alte Fokus-Form; parentPin nur noch im PIN-Tor ohne Konten', () => {
  for (const k of ALT) assert.doesNotMatch(quelltext, new RegExp(`store\\.(get|set|del)\\(\\s*'${k}'`), k);
  assert.doesNotMatch(quelltext, /migrateFocus/);
  // the old names appear only in dropOldKeys (the list of keys deleted at start)
  const a = quelltext.indexOf('/* Old keys without any function'), e = quelltext.indexOf('migrateToIds();', a);
  assert.ok(a > 0 && e > a, 'dropOldKeys found');
  assert.match(quelltext.slice(a, e), /const old=\['focus','focusOn','focusOff'\]/);
  const rest = quelltext.slice(0, a) + quelltext.slice(e);
  for (const k of ['focusOn', 'focusOff', "'focus'"]) assert.ok(!rest.includes(k), k + ' only in dropOldKeys');
  // backup: old keys are neither saved nor restored
  const B = new Function('return ' + quelltext.match(/const BACKUP_KEYS=(\{[^;]*\});/)[1])();
  for (const k of ALT) assert.ok(!B.exact.includes(k), 'backup: ' + k);
  // parentPin: read and written only by the PIN gate, which runs only without accounts
  const gateStart = quelltext.indexOf('function renderParentGate(){'), gateEnd = quelltext.indexOf('const STANDARD_TEXT=');
  assert.ok(gateStart >= 0 && gateEnd > gateStart, 'PIN gate has both source boundaries');
  const gate = quelltext.slice(gateStart, gateEnd);
  assert.match(gate, /^function renderParentGate\(\)\{\s*if\(accountsOn\(\)\)\{[^\n]*return; \}/, 'with accounts the gate returns before the PIN');
  const ausserhalb = quelltext.replace(gate, '').match(/store\.(get|set|del)\(\s*'parentPin'/g);
  assert.equal(ausserhalb, null, 'no other place uses parentPin');
  // the speicherstellen list knows only what still exists
  const verz = JSON.parse(fs.readFileSync(new URL('../werkzeug/speicherstellen.json', import.meta.url), 'utf8')).localStorage.map((e) => e.key);
  for (const k of ALT) assert.ok(!verz.includes(k), 'speicherstellen.json: ' + k);
  assert.ok(verz.includes('parentPin'));
});

test('mit Konten: Start loescht alte Fokus-Form in jedem Bereich und die alte PIN; nichts wird uebernommen', async () => {
  const ctx = await browser.newContext(); const page = await ctx.newPage(); const fehler = []; page.on('pageerror', (e) => fehler.push(e.message));
  // storage of an old device: plain keys (first child, before the move to IDs), a legacy namespace, the ID area
  await page.goto(mit.url + 'leer');
  const id = MIA();
  await page.evaluate((id) => {
    const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
    set('bq2_focus', ['units']); set('bq2_focusOn', ['graphs']); set('bq2_focusOff', ['round']);
    set('bq2_tim__focus', ['units']);
    set('bq2_' + id + '__focus', ['units']); set('bq2_' + id + '__focusOn', ['graphs']); set('bq2_' + id + '__focusOff', ['round']);
    set('bq2_parentPin', { salt: [1, 2, 3], hash: 'ab' });
    set('bq2_' + id + '__unlocked', ['x']);   // a key that stays
  }, id);
  await page.goto(mit.url); await page.waitForSelector('#login:not([hidden]), #home:not([hidden])');
  const keys = await alleSchluessel(page);
  for (const k of keys) assert.ok(!/(^|__|_)(focus|focusOn|focusOff)$/.test(k.replace(/^bq2_/, '_')) && k !== 'bq2_parentPin', 'deleted: ' + k);
  assert.ok(keys.includes('bq2_' + id + '__unlocked'), 'other keys stay');
  // the child logs in: focus is automatic, nothing of the old form was taken over (also not after the move to IDs)
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  const nach = await page.evaluate((id) => ({ mode: localStorage.getItem('bq2_' + id + '__focusMode'), manual: localStorage.getItem('bq2_' + id + '__focusManual'), alt: Object.keys(localStorage).filter((k) => /(focus|focusOn|focusOff)$/.test(k) || k.endsWith('parentPin')) }), id);
  assert.deepEqual(nach, { mode: null, manual: null, alt: [] });
  // a new start: still nothing
  await page.reload(); await page.waitForSelector('#home:not([hidden])');
  assert.deepEqual((await alleSchluessel(page)).filter((k) => /(focus|focusOn|focusOff|parentPin)$/.test(k)), []);
  // an old backup file (from before, with the old focus form) is restored without it
  const data = { attempts: JSON.stringify([{ day: '2026-10-30', skill: 'round', level: 2, attempt: 1, ok: true, help: false, qid: 'q1' }]), total: '5', focus: '["units"]', focusOn: '["graphs"]', focusOff: '["round"]' };
  const body = { format: 'bq-sicherung-1', child: id, user: 'mia', createdAt: '2026-10-30T10:00:00.000Z', appVersion: 'v40', data, audio: [] };
  body.sha256 = createHash('sha256').update(JSON.stringify({ data, audio: [] })).digest('hex');
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'papa', C.papa); await passwortSetzen(page, 'Papa-Eltern-Test-1');
  await page.waitForSelector('#parentClose');
  await page.locator('#pSettings').click(); await page.waitForSelector('#pSetBack');
  await page.locator('details.psec[data-psec="backup"] > summary').click();
  await page.setInputFiles('#pRestoreFile', { name: 'alt.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(body)) });
  await page.waitForSelector('#pRestoreGo'); await page.locator('#pRestoreGo').click();
  await page.waitForFunction(() => /Zurückgespielt/.test(document.querySelector('#pBackupMsg').textContent));
  const zurueck = await page.evaluate((id) => Object.keys(localStorage).filter((k) => k.startsWith('bq2_' + id + '__')).map((k) => k.slice(id.length + 6)), id);
  assert.ok(zurueck.includes('attempts') && zurueck.includes('total'), 'the rest is restored');
  assert.deepEqual(zurueck.filter((k) => ALT.includes(k)), [], 'old focus form not restored');
  assert.equal(await page.evaluate((id) => localStorage.getItem('bq2_' + id + '__focusMode'), id), null);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('ohne Konten: alte Fokus-Form wird beim Start geloescht, die PIN bleibt das Tor zum Elternbereich', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, ohne.url);
  // the current focus (manual: units) next to the old form: only the old form goes, nothing is mixed in
  await page.evaluate(() => { localStorage.setItem('bq2_focusMode', '"manual"'); localStorage.setItem('bq2_focusManual', '["units"]'); localStorage.setItem('bq2_focus', '["graphs"]'); localStorage.setItem('bq2_focusOn', '["graphs"]'); localStorage.setItem('bq2_focusOff', '["units"]'); });
  await page.reload(); await page.waitForSelector('#home h1');
  const fokus = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((k) => /focus/i.test(k)).sort().map((k) => [k, localStorage.getItem(k)])));
  assert.deepEqual(await fokus(), { bq2_focusManual: '["units"]', bq2_focusMode: '"manual"' }, 'old form deleted, current focus unchanged');
  await elternOeffnen(page);   // sets up the PIN; the parents' area reads the focus
  await page.locator('#parentClose').click();
  await page.reload(); await page.waitForSelector('#home h1');
  assert.ok((await alleSchluessel(page)).includes('bq2_parentPin'), 'without accounts the PIN stays');
  assert.deepEqual(await fokus(), { bq2_focusManual: '["units"]', bq2_focusMode: '"manual"' });
  assert.deepEqual(fehler, []);
  await ctx.close();
});
