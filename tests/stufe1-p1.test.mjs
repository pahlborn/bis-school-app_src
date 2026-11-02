// S11 Stufe 1, Phase P1: Kontenmodell v2, Konten-Werkzeug, Startlink, Sicherung und Wiederherstellung,
// Speicherstellen-Verzeichnis. Kriterien K6 und K11 der Spezifikation.
//   node --test tests/stufe1-p1.test.mjs

import { test, before, after } from 'node:test';
import { appLesen } from '../werkzeug/module.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { WURZEL, QUELLEN } from '../werkzeug/bauen.mjs';
import { ausV1, kontenPruefen, kontenLesen, kennungErzeugen, startlink, ID_RE, APP_URL } from '../werkzeug/konten.mjs';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const quelltext = await appLesen('utf8');
const VERZ = JSON.parse(await fs.readFile(path.join(WURZEL, 'werkzeug', 'speicherstellen.json'), 'utf8'));

const C = { mia: 'MIAA-2345', lia: 'LIAA-2345', papa: 'PAPA-2345', chef: 'CHEF-2345', frau: 'FRAU-2345' };
const V1 = { users: [
  await konto('mia', 'student', C.mia), await konto('lia', 'student', C.lia),
  await konto('papa', 'parent', C.papa, { kinder: ['mia'] }),
  await konto('chef', 'parent', C.chef, { kinder: ['mia'], admin: true }),
  await konto('frau', 'teacher', C.frau, { kinder: ['mia'] })
] };

let browser, server;
before(async () => { browser = await browserStarten(); server = await kontenServer(V1); });
after(async () => { await browser?.close(); server?.close(); });

// ---------------------------------------------------------------- werkzeug

test('Kontenmodell v2: Umstellung behaelt Reihenfolge und Startcodes; Admin wird kein Elternteil (B3); Lehrkraft-Zuordnung entfaellt (P4: nur Freigaben)', () => {
  const v2 = ausV1(V1);
  assert.equal(v2.version, 2);
  assert.deepEqual(v2.users.map((u) => u.user), ['mia', 'lia', 'papa', 'chef', 'frau']);
  for (const [i, u] of v2.users.entries()) { assert.match(u.id, ID_RE); assert.deepEqual(u.start, V1.users[i].start); }
  const id = (n) => v2.users.find((u) => u.user === n).id;
  assert.deepEqual(v2.guardians.map((g) => [g.adult, g.child]), [[id('papa'), id('mia')]], 'only papa is a parent; the admin is not (B3)');
  assert.equal('teacherOf' in v2.users.find((u) => u.user === 'frau'), false, 'teachers only through grants');
  assert.equal(v2.users.find((u) => u.user === 'chef').admin, true);
  assert.equal(new Set(v2.users.map((u) => u.id)).size, 5);
  kontenPruefen(v2);
});

test('Bauprüfung v2 bricht ab: doppelter Name, unbekannte Kennung, Lehrkraft als Elternteil, Version 1, Klartext-Code', () => {
  const v2 = ausV1(V1), u = v2.users, frau = u.find((x) => x.user === 'frau'), mia = u.find((x) => x.user === 'mia');
  assert.throws(() => kontenPruefen({ ...v2, users: [...u, { ...u[0], id: kennungErzeugen() }] }), /doppelt/);
  assert.throws(() => kontenPruefen({ ...v2, guardians: [{ adult: u[2].id, child: kennungErzeugen() }] }), /unbekannter Kennung/);
  assert.throws(() => kontenPruefen({ ...v2, guardians: [...v2.guardians, { adult: frau.id, child: mia.id }] }), /Lehrkraft ist nicht zugleich Elternteil/);
  assert.throws(() => kontenPruefen(V1), /Version 2/);
  assert.throws(() => kontenPruefen({ ...v2, users: u.map((x, i) => (i ? x : { ...x, code: 'ABCD-EFGH' })) }), /Klartext/);
  assert.throws(() => kontenPruefen({ ...v2, users: u.map((x, i) => (i ? x : { ...x, id: 'kathie' })) }), /Kennung/);
});

test('Kennungen: Form p_ + 26 Zeichen, 2 000 ohne Wiederholung; Startlink-Form', () => {
  const ids = Array.from({ length: 2000 }, kennungErzeugen);
  assert.ok(ids.every((x) => ID_RE.test(x)));
  assert.equal(new Set(ids).size, 2000);
  assert.equal(startlink('mia', 'miaa-2345'), APP_URL + '#start=mia.MIAA2345');
});

test('echte konten.json: Version 2, gueltig, Admin ist kein Elternteil, kein Startcode im Klartext', async () => {
  const k = await kontenLesen();
  kontenPruefen(k);
  const admin = k.users.filter((u) => u.admin).map((u) => u.id);
  assert.ok(!k.guardians.some((g) => admin.includes(g.adult)), 'B3');
  const roh = await fs.readFile(path.join(WURZEL, 'werkzeug', 'konten.json'), 'utf8');
  assert.ok(!/\b[A-HJ-NP-Z2-9]{4}-?[A-HJ-NP-Z2-9]{4}\b/.test(roh.replace(/"hash": "[0-9a-f]+"/g, '')), 'no start code in konten.json');
});

// ---------------------------------------------------------------- Speicherstellen

function stellenImCode() {
  const s = new Set();
  for (const m of quelltext.matchAll(/store\.(?:get|set|del)\(\s*'([^']+)'/g)) s.add('ls:' + m[1]);
  for (const m of quelltext.matchAll(/const key='(\w+)'\+/g)) s.add('ls:' + m[1]);
  for (const m of quelltext.matchAll(/\?\s*'(kidLang)'\s*:\s*'(parentLang)'/g)) { s.add('ls:' + m[1]); s.add('ls:' + m[2]); }
  for (const m of quelltext.matchAll(/\['(name)','(birthday)','(emoji)'\]\.forEach\(k=>store\.del\(k\)\)/g)) { s.add('ls:' + m[1]); s.add('ls:' + m[2]); s.add('ls:' + m[3]); }
  for (const m of quelltext.matchAll(/localStorage\.(?:getItem|setItem|removeItem)\(\s*'([^']+)'/g)) s.add('lsd:' + m[1]);
  for (const m of quelltext.matchAll(/sessionStorage\.(?:getItem|setItem|removeItem)\(\s*'([^']+)'/g)) s.add('ss:' + m[1]);
  for (const m of quelltext.matchAll(/indexedDB\.(?:open|deleteDatabase)\(\s*'([^']+)'/g)) s.add('idb:' + m[1]);
  return [...s];
}
const passt = (liste, key) => liste.some((e) => (e.praefix ? key.startsWith(e.key) : key === e.key));

test('Speicherstellen: jede Stelle im Code steht im Verzeichnis (K11)', () => {
  const fehlt = stellenImCode().filter((x) => {
    const [art, key] = x.split(/:(.*)/);
    if (art === 'ls') return !passt(VERZ.localStorage, key);
    if (art === 'lsd') return !passt(VERZ.localStorageDirekt, key);
    if (art === 'ss') return !passt(VERZ.sessionStorage, key);
    return !passt(VERZ.indexedDB, key);
  });
  assert.deepEqual(fehlt, []);
  // dynamic first arguments are only the known ones (advent<year>, langKey(), the profile reset)
  const dyn = [...quelltext.matchAll(/store\.(?:get|set|del)\(\s*([^'\s][^,)]*)/g)].map((m) => m[1].trim());
  assert.deepEqual([...new Set(dyn)].sort(), ['k', 'key', 'langKey(', 'pwKey(u'].sort());
});

test('Sicherung nimmt genau die Speicherstellen mit "sicherung": true', () => {
  const m = quelltext.match(/const BACKUP_KEYS=(\{[^;]*\});/);
  const B = new Function('return ' + m[1])();
  const soll = VERZ.localStorage.filter((e) => e.sicherung);
  assert.deepEqual([...B.exact].sort(), soll.filter((e) => !e.praefix).map((e) => e.key).sort());
  assert.deepEqual([...B.prefix].sort(), soll.filter((e) => e.praefix).map((e) => e.key).sort());
});

// ---------------------------------------------------------------- Startlink in der App

test('Startlink fuellt die Anmeldung einmal aus und entfernt den Code aus der Adresse', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await page.goto(server.url + '#start=mia.' + C.mia);
  await page.waitForSelector('#loginForm');
  assert.equal(await page.inputValue('#loginUser'), 'mia');
  assert.equal(await page.inputValue('#loginPw'), C.mia);
  assert.equal(await page.evaluate(() => location.hash), '', 'code removed from the address');
  await page.locator('#loginGo').click();
  await page.waitForSelector('#setPwForm');
  // an unknown name does nothing
  await page.goto(server.url + '#start=niemand.ABCD-EFGH');
  await page.waitForSelector('#login:not([hidden])');
  assert.equal(await page.locator('#loginForm').count(), 0);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

// ---------------------------------------------------------------- Sicherung (K6)

// derived celebration markers (title, tree stage): the app recomputes them whenever the start page is drawn
const ABGELEITET = ['rankSeen', 'treeStage'];
// the logged-in child's storage area (since S11 P2: bq2_<id>__)
const KIND = () => { const s = JSON.parse(localStorage.getItem('bq2_session')); return { pre: 'bq2_' + s.id + '__', audio: 'bq2_audio__' + s.id }; };
const KEINE_TEILEN_FUNKTION = () => { Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true }); };
const TAG = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const DATEN = {
  attempts: Array.from({ length: 210 }, (_, i) => ({ day: TAG(i % 20), skill: ['round', 'numbers', 'graphs'][i % 3], level: 2, attempt: 1, ok: i % 4 !== 0, help: false, qid: 'q' + i })),
  badges: { thinker: 3, inquirer: 5, principled: 1 }, total: 77, best_round: 7, name: 'Mia', emoji: '🦊',
  sheets: [1, 2, 3].map((n) => ({ id: 's' + n, no: n, day: TAG(n), items: [] })), chk_grow: [true, false], focusMode: 'manual', focusManual: ['round']
};
async function kindMitDaten(page) {
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  await page.evaluate(([d, kind]) => { const { pre } = new Function('return ' + kind)()(); for (const [k, v] of Object.entries(d)) localStorage.setItem(pre + k, JSON.stringify(v)); }, [DATEN, KIND.toString()]);
  // one recording, written the way the app stores it (database bq2_audio__<id>)
  await page.evaluate((kind) => new Promise((res, rej) => {
    const r = indexedDB.open(new Function('return ' + kind)()().audio, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('rec', { keyPath: 'id' });
    r.onsuccess = () => { const t = r.result.transaction('rec', 'readwrite'); t.objectStore('rec').put({ id: 'r1', created: 1, durationMs: 1000, mime: 'audio/webm', blob: new Blob([new Uint8Array(3000).fill(7)], { type: 'audio/webm' }) }); t.oncomplete = () => { r.result.close(); res(); }; t.onerror = () => rej(t.error); };
    r.onerror = () => rej(r.error);
  }), KIND.toString());
}
async function elternbereich(page, wer, pw) {
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', wer, C[wer]); await passwortSetzen(page, pw);
  await page.waitForSelector('#parentClose');
}
const kinderSchluessel = (page) => page.evaluate((kind) => { const { pre } = new Function('return ' + kind)()(); return Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith(pre)).map((k) => [k.slice(pre.length), localStorage.getItem(k)]).filter(([k]) => !/^(lastBackup|vorRueckspielen|bridgeNext|dayOffset)$/.test(k))); }, KIND.toString());
const aufnahmen = (page) => page.evaluate((kind) => new Promise((res) => { const r = indexedDB.open(new Function('return ' + kind)()().audio, 1); r.onupgradeneeded = () => r.result.createObjectStore('rec', { keyPath: 'id' }); r.onsuccess = () => { const q = r.result.transaction('rec').objectStore('rec').getAll(); q.onsuccess = () => { res(q.result.map((x) => [x.id, x.blob.size])); r.result.close(); }; }; }), KIND.toString());

test('Sicherung: nur Eltern des Kindes; Datei vollstaendig ohne Passwoerter; Zurueckspielen auf frischem Geraet gleich; falsche oder veraenderte Datei abgelehnt; Rueckgaengig (K6)', async () => {
  // device 1: the child practises, a parent backs up
  const a = await oeffnen(browser, server, { acceptDownloads: true });
  await a.ctx.addInitScript(KEINE_TEILEN_FUNKTION);
  await a.page.evaluate(KEINE_TEILEN_FUNKTION);
  await kindMitDaten(a.page);
  const vorher = await kinderSchluessel(a.page);
  await elternbereich(a.page, 'papa', 'langes-passwort');
  assert.match(await a.page.textContent('.pbackup-note'), /Letzte Sicherung: noch nie/);
  const [dl] = await Promise.all([a.page.waitForEvent('download'), a.page.locator('.pbackup-note [data-backup]').click()]);
  const datei = path.join(await fs.mkdtemp(path.join((await import('node:os')).tmpdir(), 'bq-sich-')), dl.suggestedFilename());
  await dl.saveAs(datei);
  assert.match(dl.suggestedFilename(), /^big-quest-sicherung-mia-\d{4}-\d{2}-\d{2}\.json$/);
  const body = JSON.parse(await fs.readFile(datei, 'utf8'));
  const beimSichern = await kinderSchluessel(a.page);
  for (const [k, v] of Object.entries(beimSichern)) if (!ABGELEITET.includes(k)) assert.equal(body.data[k], v, 'backup holds ' + k);
  assert.equal(body.format, 'bq-sicherung-1'); assert.match(body.child, ID_RE); assert.equal(body.user, 'mia');
  const keys = Object.keys(body.data);
  for (const k of ['attempts', 'badges', 'total', 'best_round', 'name', 'emoji', 'sheets', 'chk_grow', 'focusMode', 'focusManual']) assert.ok(keys.includes(k), k);
  assert.ok(!keys.some((k) => /^(pw_|session|adultSession|sessionPrev|parentLang|muted|lastBackup)/.test(k)), 'no device keys: ' + keys.join(','));
  assert.deepEqual(body.audio.map((x) => [x.id, x.size]), [['r1', 3000]]);
  await a.page.waitForFunction(() => !document.querySelector('.pbackup-note [data-backup]'));
  assert.match(await a.page.textContent('.pbackup-note'), /Letzte Sicherung: \d\d\.\d\d\.\d{4}/);

  // the admin (not a parent, B3) and the teacher see no backup
  for (const wer of ['chef', 'frau']) {
    const b = await oeffnen(browser, server);
    await anmelden(b.page, 'student', 'mia', C.mia); await passwortSetzen(b.page, 'Tiger-Lamp-River-4271');
    await b.page.waitForSelector('#home:not([hidden])');
    await elternbereich(b.page, wer, 'langes-passwort');
    assert.equal(await b.page.locator('details.psec[data-psec="backup"]').count(), 0, wer);
    assert.equal(await b.page.locator('.pbackup-note').count(), 0, wer);
    await b.ctx.close();
  }

  // device 2: fresh, the same child, restore
  const c = await oeffnen(browser, server);
  await anmelden(c.page, 'student', 'mia', C.mia); await passwortSetzen(c.page, 'Tiger-Lamp-River-4271');
  await c.page.waitForSelector('#home:not([hidden])');
  const frisch = await kinderSchluessel(c.page);
  await elternbereich(c.page, 'papa', 'langes-passwort');
  await c.page.locator('details.psec[data-psec="backup"] > summary').click();
  // a changed file is refused
  const veraendert = JSON.parse(JSON.stringify(body)); veraendert.data.total = '78';
  await c.page.setInputFiles('#pRestoreFile', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(veraendert)) });
  await c.page.waitForFunction(() => /beschädigt|verändert/.test(document.querySelector('#pBackupMsg').textContent));
  // a backup of another child is refused
  const fremd = { ...body, child: 'p_0000000000000000000000000Z' };
  await c.page.setInputFiles('#pRestoreFile', { name: 'y.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fremd)) });
  await c.page.waitForFunction(() => /anderen Kind/.test(document.querySelector('#pBackupMsg').textContent));
  // the right file: preview, then restore
  await c.page.setInputFiles('#pRestoreFile', datei);
  await c.page.waitForSelector('#pRestoreGo');
  assert.match(await c.page.textContent('#pRestorePreview'), /210 Antworten · 77 Sterne · 9 Abzeichen · 3 Übungsblätter · 1 Aufnahmen/);
  await c.page.locator('#pRestoreGo').click();
  await c.page.waitForFunction(() => /Zurückgespielt/.test(document.querySelector('#pBackupMsg').textContent));
  const nachher = await kinderSchluessel(c.page);
  for (const [k, v] of Object.entries(body.data)) if (!ABGELEITET.includes(k)) assert.equal(nachher[k], v, k);
  assert.deepEqual(await aufnahmen(c.page), [['r1', 3000]]);
  // undo once
  await c.page.locator('[data-restoreundo]').click();
  await c.page.waitForFunction(() => /vor dem Zurückspielen/.test(document.querySelector('#pBackupMsg').textContent));
  const zurueck = await kinderSchluessel(c.page);
  for (const k of Object.keys(vorher)) if (!ABGELEITET.includes(k)) assert.equal(zurueck[k], frisch[k], 'undo ' + k);
  assert.deepEqual([...a.fehler, ...c.fehler], []);
  await a.ctx.close(); await c.ctx.close();
});
