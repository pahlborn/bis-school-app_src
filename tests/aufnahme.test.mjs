// Reading recording (Peter, 30.10.): record, listen, keep the last 3 on the device, share/save.
// Chromium runs with a fake microphone. Real clicks only.
//   node --test tests/aufnahme.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { appServer, appOeffnen, alleKarten, karteOeffnen } from './app-hilfen.mjs';

let browser, server;
before(async () => {
  server = await appServer();
  const pfad = process.env.CHROMIUM_PATH;
  browser = await chromium.launch({ ...(pfad ? { executablePath: pfad } : {}), args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
});
after(async () => { await browser?.close(); server?.close(); });

async function studio(kontext = {}) {
  const a = await appOeffnen(browser, server.url, { permissions: ['microphone'], ...kontext });
  await a.page.addInitScript(() => {});
  await a.page.evaluate(() => {
    window.__mic = 0; window.__tracksStopped = 0;
    const orig = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (c) => { window.__mic++; const s = await orig(c); s.getTracks().forEach((t) => { const st = t.stop.bind(t); t.stop = () => { window.__tracksStopped++; st(); }; }); return s; };
    window.confirm = () => true;
  });
  await karteOeffnen(a.page, (await alleKarten(a.page)).find((k) => k.item === 'studio:read'));
  return a;
}
async function aufnehmen(page, ms = 1300) {
  await page.locator('#recBtn').click();
  await page.waitForFunction(() => document.querySelector('#recBtn').textContent.includes('Stopp'));
  await page.waitForTimeout(ms);
  await page.locator('#recBtn').click();
  // "Gespeichert" is shown only after saving and pruning to the newest three have finished
  await page.waitForFunction(() => document.querySelector('#recMsg').textContent.includes('Gespeichert'));
}
const anzahl = (page) => page.locator('#recList .rec-item').count();
const gespeichert = (page) => page.evaluate(() => new Promise((res) => { const r = indexedDB.open('bq2_audio', 1); r.onsuccess = () => { const q = r.result.transaction('rec').objectStore('rec').getAll(); q.onsuccess = () => { res(q.result.map((x) => ({ size: x.blob.size, ms: x.durationMs, mime: x.mime }))); r.result.close(); }; }; }));

test('record, stop, listen: one saved recording with audio, microphone released, nothing sent', async () => {
  const { ctx, page, fehler } = await studio({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const anfragen = []; page.on('request', (q) => { if (!q.url().startsWith(server.url)) anfragen.push(q.url()); });
  assert.equal(await page.evaluate(() => window.__mic), 0, 'no microphone before the tap');
  await aufnehmen(page);
  await page.waitForFunction(() => document.querySelectorAll('#recList .rec-item').length === 1);
  assert.equal(await page.evaluate(() => window.__mic), 1);
  assert.ok(await page.evaluate(() => window.__tracksStopped) >= 1, 'microphone released after stop');
  const s = await gespeichert(page);
  assert.equal(s.length, 1); assert.ok(s[0].size > 0); assert.ok(s[0].ms >= 1000, 'duration ' + s[0].ms);
  assert.match(await page.getAttribute('#recList audio', 'src'), /^blob:/);
  assert.match(await page.textContent('#recMsg'), /Gespeichert/);
  assert.equal(await page.textContent('#recBtn'), '● Aufnahme starten');
  const box = await page.locator('#recBtn').boundingBox();
  assert.ok(box.width >= 44 && box.height >= 44);
  assert.deepEqual(anfragen, []);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('only the newest three recordings are kept; delete removes one', async () => {
  const { ctx, page } = await studio();
  for (let i = 0; i < 4; i++) { await aufnehmen(page, 400); await page.waitForFunction((n) => document.querySelectorAll('#recList .rec-item').length === n, Math.min(i + 1, 3)); }
  assert.equal((await gespeichert(page)).length, 3);
  await page.locator('#recList [data-del]').first().click();
  await page.waitForFunction(() => document.querySelectorAll('#recList .rec-item').length === 2);
  assert.equal((await gespeichert(page)).length, 2);
  await ctx.close();
});

test('recordings survive a reload of the app', async () => {
  const { ctx, page } = await studio();
  await aufnehmen(page, 500);
  await page.waitForFunction(() => document.querySelectorAll('#recList .rec-item').length === 1);
  await page.reload(); await page.waitForSelector('#home h1');
  await karteOeffnen(page, (await alleKarten(page)).find((k) => k.item === 'studio:read'));
  await page.waitForFunction(() => document.querySelectorAll('#recList .rec-item').length === 1);
  await ctx.close();
});

test('share/save: without a share sheet the recording is offered as a file to save', async () => {
  const { ctx, page } = await studio({ acceptDownloads: true });
  await aufnehmen(page, 500);
  await page.waitForFunction(() => document.querySelectorAll('#recList .rec-item').length === 1);
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#recList [data-share]').click()]);
  assert.match(download.suggestedFilename(), /^Leseaufnahme \d{4}-\d{2}-\d{2} \d{2}-\d{2}\.(webm|m4a|ogg)$/);
  await ctx.close();
});

test('leaving the studio while recording stops and saves the recording', async () => {
  const { ctx, page } = await studio();
  await page.locator('#recBtn').click();
  await page.waitForFunction(() => document.querySelector('#recBtn').textContent.includes('Stopp'));
  await page.waitForTimeout(800);
  await page.locator('#studioBack').click();
  await page.waitForFunction(() => window.__tracksStopped >= 1);
  await page.waitForTimeout(500);
  assert.equal((await gespeichert(page)).length, 1);
  await ctx.close();
});

test('microphone refused: friendly message, no error', async () => {
  const { ctx, page, fehler } = await studio();
  await page.evaluate(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' })); });
  await page.locator('#recBtn').click();
  await page.waitForFunction(() => document.querySelector('#recMsg').textContent.includes('erlaube'));
  assert.equal(await page.textContent('#recBtn'), '● Aufnahme starten');
  assert.deepEqual(fehler, []);
  await ctx.close();
});
