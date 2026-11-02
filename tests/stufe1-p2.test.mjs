// S11 Stufe 1, Phase P2: Umzug der Daten auf Kennungen (Kopie, Zaehlprobe, Abbruch, 30 Tage,
// Aufnahmen) – Kriterien K4 und K5 der Spezifikation. Schuldaten nach Kennung: tests/stufe1-ist.test.mjs.
//   node --test tests/stufe1-p2.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ausV1, pbkdf2Hex } from '../werkzeug/konten.mjs';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, anmelden } from './konten-hilfen.mjs';

const C = { mia: 'MIAA-2345', lia: 'LIAA-2345', papa: 'PAPA-2345' };
const V1 = { users: [await konto('mia', 'student', C.mia), await konto('lia', 'student', C.lia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] })] };
const SALT = Array.from({ length: 16 }, (_, i) => 30 + i);
const PW = { mia: { salt: SALT, hash: await pbkdf2Hex('mond', SALT) }, lia: { salt: SALT, hash: await pbkdf2Hex('sonne', SALT) }, papa: { salt: SALT, hash: await pbkdf2Hex('langes-passwort', SALT) } };
const TAG = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
// realistic data in the OLD layout (before S11 P2): first child without prefix, other children with the name
const ALT = {
  attempts: Array.from({ length: 220 }, (_, i) => ({ day: TAG(i % 25), skill: ['round', 'numbers', 'graphs', 'opinion', 'units', 'combos', 'wordprob', 'detective', 'forces', 'sentences', 'words'][i % 11], level: 1 + (i % 3), attempt: 1, ok: i % 4 !== 0, help: i % 7 === 0, qid: 'q' + i })),
  ev: Object.fromEntries(['round', 'numbers', 'graphs', 'opinion', 'units', 'combos', 'wordprob', 'detective', 'forces', 'sentences', 'words'].map((k, i) => [k, Array.from({ length: 6 + i }, (_, j) => [TAG(j), 2, j % 3 ? 1 : 0])])),
  due: [{ id: 'd1', q: { world: 'round', prompt: 'Round 347 to the nearest hundred.', kind: 'mc', options: ['300', '400'], answer: 0 }, box: 1, next: TAG(-1) }],
  badges: { thinker: 3, inquirer: 5, principled: 1 }, total: 77, best_round: 7, best_numbers: 6, name: 'Mia', emoji: '🦊',
  sheets: [1, 2, 3].map((n) => ({ id: 's' + n, no: n, day: TAG(n), items: [] })), sheetNo: 3, chk_grow: [true, false], focusMode: 'manual', focusManual: ['round'], greetDay: TAG(0)
};
let browser, server, K2;
before(async () => {
  browser = await browserStarten();
  server = await kontenServer(V1);
  // the server converts the fixture with ausV1 (random IDs); read the IDs back from the app
});
after(async () => { await browser?.close(); server?.close(); });

/** Opens the origin on an empty page, seeds the OLD layout (localStorage and one recording), then loads the app. */
async function mitAltdaten({ voll, marker } = {}) {
  const ctx = await browser.newContext();
  await ctx.route('**/*', (r) => (r.request().url().startsWith(server.url) ? r.continue() : r.abort()));
  await ctx.addInitScript(() => { window.AudioContext = undefined; });
  const page = await ctx.newPage(); const fehler = []; page.on('pageerror', (e) => fehler.push(e.message));
  await page.goto(server.url + 'leer');   // 404 page, same origin: nothing of the app runs here
  await page.evaluate(async ([alt, pw, voll, marker]) => {
    for (const [k, v] of Object.entries(alt)) localStorage.setItem('bq2_' + k, JSON.stringify(v));
    localStorage.setItem('bq2_lia__attempts', JSON.stringify(alt.attempts.slice(0, 5)));
    localStorage.setItem('bq2_lia__total', '3');
    localStorage.setItem('bq2_pw_mia', JSON.stringify(pw.mia)); localStorage.setItem('bq2_pw_lia', JSON.stringify(pw.lia)); localStorage.setItem('bq2_pw_papa', JSON.stringify(pw.papa));
    localStorage.setItem('bq2_session', JSON.stringify({ user: 'mia' }));
    if (marker) localStorage.setItem('bq2_migr', JSON.stringify(marker));
    await new Promise((res, rej) => { const r = indexedDB.open('bq2_audio', 1); r.onupgradeneeded = () => r.result.createObjectStore('rec', { keyPath: 'id' }); r.onsuccess = () => { const t = r.result.transaction('rec', 'readwrite'); t.objectStore('rec').put({ id: 'r1', created: 1, durationMs: 1000, mime: 'audio/webm', blob: new Blob([new Uint8Array(3000).fill(7)], { type: 'audio/webm' }) }); t.oncomplete = () => { r.result.close(); res(); }; t.onerror = () => rej(t.error); }; r.onerror = () => rej(r.error); });
    if (voll) {
      // a large value that will not fit a second time, then fill the storage almost to the limit
      localStorage.setItem('bq2_bigdata', 'x'.repeat(300000));
      try { for (let i = 0; i < 1000; i++) localStorage.setItem('junk' + i, 'y'.repeat(100000)); } catch (e) { /* full */ }
      for (let i = 999; i >= 0; i--) if (localStorage.getItem('junk' + i) !== null) { localStorage.removeItem('junk' + i); break; }
    }
  }, [ALT, PW, !!voll, marker || null]);
  await page.goto(server.url); await page.waitForSelector('#login:not([hidden]), #home:not([hidden])');
  return { ctx, page, fehler };
}
const ids = (page) => page.evaluate(() => Object.fromEntries(['mia', 'lia', 'papa'].map((n) => [n, null])));
const migr = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('bq2_migr') || 'null'));
const sitzung = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('bq2_session') || 'null'));

test('Umzug: jeder Wert zeichengleich unter der Kennung, Passwoerter und Sitzung mitgenommen, Aufnahme kopiert, alte Daten bleiben, kein zweiter Umzug (K4)', async () => {
  const { ctx, page, fehler } = await mitAltdaten();
  const m = await migr(page);
  assert.equal(m.ok, true);
  const s = await sitzung(page);
  assert.equal(s.user, 'mia'); assert.match(s.id, /^p_/, 'session carries the ID');
  const alt = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((k) => /^bq2_/.test(k)).map((k) => [k, localStorage.getItem(k)])));
  for (const k of Object.keys(ALT)) assert.equal(alt['bq2_' + s.id + '__' + k], alt['bq2_' + k], 'copied: ' + k);
  assert.ok(m.old.includes('bq2_attempts') && m.old.includes('bq2_lia__attempts') && m.old.includes('bq2_pw_mia'), 'old keys recorded for the cleanup');
  assert.ok(alt['bq2_attempts'], 'old keys stay for 30 days');
  // the child is on the start page with its stars; the other child's data moved under its own ID
  await page.waitForSelector('#home:not([hidden])');
  assert.equal(await page.textContent('#totalStars'), '77');
  const lia = Object.keys(alt).find((k) => /^bq2_p_[^_]+__total$/.test(k) && alt[k] === '3');
  assert.ok(lia, 'lia under her ID');
  // recordings: copied into bq2_audio__<id>
  await page.waitForFunction(() => (JSON.parse(localStorage.getItem('bq2_migr')) || {}).audio !== 'offen');
  assert.equal((await migr(page)).audio, 'ok');
  const rec = await page.evaluate((id) => new Promise((res) => { const r = indexedDB.open('bq2_audio__' + id, 1); r.onsuccess = () => { const q = r.result.transaction('rec').objectStore('rec').getAll(); q.onsuccess = () => { res(q.result.map((x) => [x.id, x.blob.size])); r.result.close(); }; }; }), s.id);
  assert.deepEqual(rec, [['r1', 3000]]);
  // own passwords still work (moved to bq2_pw_<id>)
  await page.locator('#logoutBtn').click();
  await anmelden(page, 'student', 'lia', 'sonne');
  await page.waitForSelector('#home:not([hidden])');
  assert.equal(await page.textContent('#totalStars'), '3');
  // a reload does not move again
  const at = m.at; await page.reload(); await page.waitForSelector('#home:not([hidden])');
  assert.equal((await migr(page)).at, at);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Umzug abgebrochen, wenn eine Kopie nicht gelingt: App arbeitet mit den alten Daten weiter, Hinweis fuer Erwachsene, erneut versuchen (K5)', async () => {
  const { ctx, page, fehler } = await mitAltdaten({ voll: true });
  const m = await migr(page);
  assert.equal(m.ok, false);
  const neu = await page.evaluate(() => Object.keys(localStorage).filter((k) => /^bq2_p_/.test(k)));
  assert.deepEqual(neu, [], 'partial copy removed');
  await page.waitForSelector('#home:not([hidden])');
  assert.equal(await page.textContent('#totalStars'), '77', 'old data still in use');
  // also after a restart: the failed move is remembered, the old data stay in use, no new attempt
  await page.reload(); await page.waitForSelector('#home:not([hidden])');
  assert.equal(await page.textContent('#totalStars'), '77', 'old data in use after a restart');
  assert.equal((await migr(page)).ok, false);
  // grown-ups see a calm note with "try again"
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'papa', 'langes-passwort');
  await page.waitForSelector('#parentClose');
  assert.match(await page.textContent('.pmigr-note'), /nicht geklappt/);
  // free the storage, try again
  await page.evaluate(() => { for (let i = 0; i < 1000; i++) localStorage.removeItem('junk' + i); });
  await Promise.all([page.waitForNavigation(), page.locator('[data-migrretry]').click()]);
  await page.waitForSelector('#parentClose, #home:not([hidden]), #login:not([hidden])');
  assert.equal((await migr(page)).ok, true);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('nach 30 Tagen werden die alten Daten entfernt, vorher nicht', async () => {
  const vor = (tage) => new Date(Date.now() - tage * 864e5).toISOString();
  for (const [tage, weg] of [[29, false], [31, true]]) {
    const { ctx, page } = await mitAltdaten();
    const m = await migr(page);
    await page.evaluate(([mm, at]) => localStorage.setItem('bq2_migr', JSON.stringify({ ...mm, at, audio: 'ok' })), [m, vor(tage)]);
    await page.reload(); await page.waitForSelector('#home:not([hidden])');
    const k = await page.evaluate(() => Object.keys(localStorage));
    assert.equal(k.includes('bq2_attempts'), !weg, tage + ' days');
    assert.equal(k.includes('bq2_pw_mia'), !weg);
    assert.ok(k.some((x) => /^bq2_p_[^_]+__attempts$/.test(x)), 'new data stay');
    assert.equal((await migr(page)).cleaned, weg);
    await ctx.close();
  }
});
