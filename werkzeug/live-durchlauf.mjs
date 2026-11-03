// Live-Durchlauf nach dem Veroeffentlichen (docs/veroeffentlichen.md): echte Seite, frisches Browserprofil,
// Anmeldung Kind (kathie) und Elternteil (peter) mit ihren Startcodes, Practise Today, Elternbereich.
// Die Startcodes kommen nur aus %LOCALAPPDATA%\bis-school-app\startcodes.txt und werden nie ausgegeben.
// Die neuen Passwoerter gelten nur im voruebergehenden Profil.
//
//   $env:CHROMIUM_PATH = "...\chromium-1223\chrome-win64\chrome.exe"
//   node werkzeug/live-durchlauf.mjs            (erwartet die Version des Quellstands)
//   node werkzeug/live-durchlauf.mjs v103       (oder eine bestimmte Version)

import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { b64, ITERATIONEN } from './kern.mjs';
import { quellenLesen, VEROEFFENTLICHT, WURZEL } from './bauen.mjs';
import { ablageOrdner, lesen } from './schluesselablage.mjs';
import { versionErmitteln } from './version.mjs';

const V = process.argv[2] || 'v' + versionErmitteln(WURZEL).n;
const codes = {};
for (const l of (await fs.readFile(path.join(ablageOrdner(), 'startcodes.txt'), 'utf8')).split('\n')) { const m = l.trim().split(/\s+/); if (m.length >= 3) codes[m[1]] = m[2]; }
for (const u of ['kathie', 'peter']) if (!codes[u]) throw new Error('Startcode fehlt fuer ' + u + ' (startcodes.txt)');
const q = await quellenLesen();
const { roh } = await lesen(q.salt, ITERATIONEN);
// names that must never show up (school, teachers) - kept encoded so the word list does not trip
const PRIV = new RegExp(Buffer.from('WmVja3NlcnxcYjNCXGJ8QmhhbnxMZWdvbGFuZA==', 'base64').toString(), 'i');

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
async function login(page, role, user, pw) {
  if (await page.locator('#roleStudent').isVisible().catch(() => false)) await page.locator(role === 'student' ? '#roleStudent' : '#roleAdult').click();
  await page.locator('#loginUser').fill(user); await page.locator('#loginPw').fill(codes[user]); await page.locator('#loginGo').click();
  await page.waitForSelector('#setPwForm'); await page.locator('#newPw1').fill(pw); await page.locator('#newPw2').fill(pw); await page.locator('#setPwGo').click();
  await page.waitForSelector('#welcomeGo'); await page.locator('#welcomeGo').click();
}
try {
  const ctx = await browser.newContext({ viewport: { width: 744, height: 1133 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript((k) => localStorage.setItem('bq_schluessel', k), b64(roh));
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(VEROEFFENTLICHT + '?t=' + Date.now());
  await page.waitForSelector('#login:not([hidden])');
  assert.match(await page.textContent('#loginVersion'), new RegExp('^' + V + '\\b'), 'live version');
  await page.locator('.login-help summary').click();
  assert.ok(/your start code still works/.test(await page.textContent('.login-help')), 'login help (English)');
  await login(page, 'student', 'kathie', 'Live-Probe-Tiger-4271');
  await page.waitForSelector('#home:not([hidden])');
  await page.locator('#todayBtn').click(); await page.waitForSelector('#play:not([hidden])');
  assert.ok(!PRIV.test(await page.evaluate(() => document.body.innerText)), 'round neutral');
  await page.locator('#quitBtn').click(); await page.waitForSelector('#home:not([hidden])');
  await page.locator('#adultBtn').click(); await login(page, 'adult', 'peter', 'Live-Probe-Eltern-2026');
  await page.waitForSelector('#parentClose');
  assert.match(await page.textContent('#pKid'), /kathie/, 'peter sees kathie');
  assert.ok(!PRIV.test(await page.evaluate(() => document.body.innerText)), 'grown-ups area neutral');
  assert.deepEqual(errors, [], 'no page errors');
  console.log('LIVE ' + V + ' OK');
} finally { await browser.close(); }
