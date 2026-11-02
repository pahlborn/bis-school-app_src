// S11 Stufe 1, Phase P4: Freigaben fuer Lehrkraft und Admin (Umfang, Dauer, Einwilligung, Widerruf,
// Ablauf, Protokoll), Admin-Metadaten, Rechtematrix Stufe 1. Kriterien K1, K9, K10.
//   node --test tests/stufe1-p4.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { schuleLesen } from '../werkzeug/schule.mjs';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'MIAA-2345', lia: 'LIAA-2345', papa: 'PAPA-2345', frau: 'FRAU-2345', chef: 'CHEF-2345', fremd: 'FREM-2345' };
const PW = { mia: 'Tiger-Lamp-River-4271', lia: 'Owl-Cake-Moon-1357', papa: 'Papa-Eltern-Test-1', frau: 'Lehrkraft-Test-22', chef: 'Admin-Test-Konto-3', fremd: 'Fremd-Eltern-Test-4' };
const KONTEN = { users: [
  await konto('mia', 'student', C.mia), await konto('lia', 'student', C.lia),
  await konto('papa', 'parent', C.papa, { kinder: ['mia'] }), await konto('fremd', 'parent', C.fremd, { kinder: ['lia'] }),
  await konto('frau', 'teacher', C.frau), await konto('chef', 'parent', C.chef, { admin: true })
] };
let browser, server;
before(async () => {
  browser = await browserStarten();
  const s = await schuleLesen();   // the school data of the real child, here for "mia"
  server = await kontenServer(KONTEN, { schule: { version: 1, kinder: { mia: s.kinder.kathie } } });
});
after(async () => { await browser?.close(); server?.close(); });

const ID = (n) => server.konten.users.find((u) => u.user === n).id;
const tag = (plus = 0) => new Date(Date.now() + plus * 864e5).toISOString().slice(0, 10);

/** device with mia's data (and lia's), every grown-up already has an own password there */
async function geraet() {
  const g = await oeffnen(browser, server);
  const { page } = g;
  for (const k of ['lia', 'mia']) {
    await anmelden(page, 'student', k, C[k]); await passwortSetzen(page, PW[k]);
    await page.waitForSelector('#home:not([hidden])');
    await page.evaluate(([id, n]) => { localStorage.setItem('bq2_' + id + '__name', JSON.stringify(n)); localStorage.setItem('bq2_' + id + '__attempts', JSON.stringify(Array.from({ length: 12 }, (_, i) => ({ day: new Date(Date.now() - (i % 4) * 864e5).toISOString().slice(0, 10), skill: 'round', level: 2, attempt: 1, ok: i % 3 > 0, help: false })))); }, [ID(k), k === 'mia' ? 'Mia Sonnenschein' : 'Lia']);
    if (k === 'lia') await page.locator('#logoutBtn').click();
  }
  return g;
}
async function kapitel(page, id) {
  const d = page.locator(`details.psec[data-psec="${id}"]`);
  if (!(await d.evaluate((e) => e.open))) await d.locator('summary').first().click();
}
async function erwachsen(page, wer) {
  if (await page.locator('#parentClose').count()) { await page.locator('#parentClose').click(); await page.waitForSelector('#home:not([hidden]), #login:not([hidden])'); }
  if (await page.locator('#adultBtn').isVisible().catch(() => false)) await page.locator('#adultBtn').click();
  else if (await page.locator('#roleAdult').count()) await page.locator('#roleAdult').click();
  await page.locator('#loginUser').fill(wer);
  const ersterMal = !(await page.evaluate((id) => localStorage.getItem('bq2_pw_' + id), ID(wer)));
  await page.locator('#loginPw').fill(ersterMal ? C[wer] : PW[wer]); await page.locator('#loginGo').click();
  if (ersterMal) { await page.waitForSelector('#setPwForm'); await page.locator('#newPw1').fill(PW[wer]); await page.locator('#newPw2').fill(PW[wer]); await page.locator('#setPwGo').click(); await page.locator('#welcomeGo').click(); }
  await page.waitForSelector('#parentClose');
}
const setzeFreigabe = (page, g) => page.evaluate(([id, gs]) => localStorage.setItem('bq2_' + id + '__grants', JSON.stringify(gs)), [ID('mia'), g ? [g] : []]);
const freigabe = (wer, scope, extra = {}) => ({ id: 'g-' + wer, grantee: ID(wer), scope, from: tag(), until: tag(13), by: ID('papa'), ...extra });

async function sicht(page) {
  const n = async (sel) => (await page.locator(sel).count()) > 0;
  const r = {
    kind: (await page.textContent('.phdr')).includes('mia'),
    fremd: (await page.textContent('.phdr')).includes('lia'),
    profil: (await page.textContent('#aboutBody')).includes('Sonnenschein'),
    uebersicht: await n('.psubject'), schule: await n('details.psec[data-psec="school"]'), einstellungen: await n('details.psec[data-psec="settings"]'),
    sicherung: await n('details.psec[data-psec="backup"]'), freigaben: await n('details.psec[data-psec="grants"]'), konten: await n('details.psec[data-psec="accounts"]'), fokus: false, schulzeile: false
  };
  if (r.uebersicht) { await page.locator('[data-psubj="maths"]').click(); r.fokus = await n('[data-pfocus]'); r.schulzeile = /🏫 Schule/.test(await page.textContent('#aboutBody')); await page.locator('#pBack').click(); }
  return r;
}
// kind: mia is shown; fremd: lia (the other family's child) is shown
const NICHTS = { kind: false, fremd: false, profil: false, uebersicht: false, schule: false, einstellungen: false, sicherung: false, freigaben: false, konten: false, fokus: false, schulzeile: false };

test('Rechtematrix Stufe 1: jede Rolle sieht genau, was sie darf (K10, K1)', async () => {
  const { ctx, page, fehler } = await geraet();
  const faelle = [
    ['papa (Elternteil)', 'papa', null, { ...NICHTS, kind: true, profil: true, uebersicht: true, schule: true, einstellungen: true, sicherung: true, freigaben: true, fokus: true, schulzeile: true }],
    ['fremd (Elternteil von lia): nichts von mia, nur sein eigenes Kind', 'fremd', null, { ...NICHTS, fremd: true, uebersicht: true, schule: true, einstellungen: true, sicherung: true, freigaben: true, fokus: true }],
    ['frau ohne Freigabe', 'frau', null, { ...NICHTS }],
    ['frau mit Freigabe Lernstand', 'frau', freigabe('frau', ['learning']), { ...NICHTS, kind: true, uebersicht: true }],
    ['frau mit Freigabe Lernstand + Schule', 'frau', freigabe('frau', ['learning', 'school']), { ...NICHTS, kind: true, uebersicht: true, schule: true, schulzeile: true }],
    ['frau mit abgelaufener Freigabe', 'frau', freigabe('frau', ['learning', 'school'], { from: tag(-20), until: tag(-6) }), { ...NICHTS }],
    ['frau mit widerrufener Freigabe', 'frau', freigabe('frau', ['learning'], { revokedAt: new Date().toISOString() }), { ...NICHTS }],
    ['chef (Admin) ohne Freigabe', 'chef', null, { ...NICHTS, konten: true }],
    ['chef (Admin) mit Freigabe Lernstand', 'chef', freigabe('chef', ['learning']), { ...NICHTS, kind: true, uebersicht: true, konten: true }],
    ['papa mit Freigabe an frau (eigene Rechte unveraendert)', 'papa', freigabe('frau', ['learning']), { ...NICHTS, kind: true, profil: true, uebersicht: true, schule: true, einstellungen: true, sicherung: true, freigaben: true, fokus: true, schulzeile: true }]
  ];
  for (const [name, wer, g, soll] of faelle) {
    await setzeFreigabe(page, g);
    await erwachsen(page, wer);
    assert.deepEqual(await sicht(page), soll, name);
  }
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Freigabe mit echten Klicks: Einwilligungstext, nur Lehrkraft/Admin, Ersetzen, Widerruf, Protokoll (K9)', async () => {
  const { ctx, page, fehler } = await geraet();
  await erwachsen(page, 'papa');
  await kapitel(page, 'grants');
  // not a teacher/admin, unknown name
  for (const n of ['fremd', 'niemand']) {
    await page.locator('#pGrantWho').fill(n); await page.locator('#pGrantForm button[type="submit"]').click();
    assert.match(await page.textContent('#pGrantMsg'), /keine Lehrkraft und keinen Admin/);
  }
  await page.locator('#pGrantWho').fill('frau'); await page.locator('#pGrantDays').fill('10');
  assert.equal(await page.textContent('#pGrantConsent'), 'Sie geben frau für 10 Tage Einblick in: Lernstand. frau kann nichts ändern. Sie können das jederzeit beenden. Was frau bis dahin gesehen hat, kann man nicht ungesehen machen.');
  await page.locator('#pGrantForm button[type="submit"]').click();
  await page.waitForSelector('[data-grantrevoke]');
  assert.match(await page.textContent('.pgrants'), /frau · Lernstand · läuft bis/);
  // the teacher looks: read-only, without school ratings and profile; logged as viewed (once a day)
  await erwachsen(page, 'frau');
  assert.match(await page.textContent('#pKid'), /mia/);
  assert.equal(await page.locator('details.psec[data-psec="school"]').count(), 0);
  assert.ok(!(await page.textContent('#aboutBody')).includes('Sonnenschein'), 'no display name for the teacher');
  await page.reload(); await page.waitForSelector('#parentClose');
  // a new grant with school ratings replaces the old one
  await erwachsen(page, 'papa');
  await kapitel(page, 'grants');
  await page.locator('#pGrantWho').fill('frau'); await page.locator('#pGrantSchool').check();
  assert.match(await page.textContent('#pGrantConsent'), /Lernstand und Schuldaten/);
  await page.locator('#pGrantForm button[type="submit"]').click();
  await page.waitForFunction(() => document.querySelectorAll('.pgrants li').length === 2);
  assert.equal(await page.locator('[data-grantrevoke]').count(), 1, 'only one active grant per person');
  await erwachsen(page, 'frau');
  assert.equal(await page.locator('details.psec[data-psec="school"]').count(), 1);
  // the parent ends it: immediately nothing
  await erwachsen(page, 'papa');
  await kapitel(page, 'grants');
  await page.locator('[data-grantrevoke]').click();
  await page.waitForFunction(() => !document.querySelector('[data-grantrevoke]'));
  await page.locator('.pgrantlog > summary').click();
  const log = await page.textContent('.pgrantlog');
  for (const e of ['erteilt', 'angesehen', 'beendet']) assert.ok(log.includes(e), e);
  assert.equal((log.match(/angesehen/g) || []).length, 1, 'viewed is logged once a day');
  await erwachsen(page, 'frau');
  assert.ok(!(await page.textContent('.phdr')).includes('mia'));
  assert.match(await page.textContent('.pnokid'), /Noch keine Freigabe/);
  // the grant and its log travel with the backup (parents' area)
  const keys = await page.evaluate((id) => Object.keys(localStorage).filter((k) => k.startsWith('bq2_' + id + '__grant')), ID('mia'));
  assert.deepEqual(keys.sort(), ['bq2_' + ID('mia') + '__grantlog', 'bq2_' + ID('mia') + '__grants'].sort());
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Ablauf: nach dem Enddatum sieht die Lehrkraft nichts mehr, das Protokoll vermerkt es', async () => {
  const { ctx, page } = await geraet();
  await setzeFreigabe(page, freigabe('frau', ['learning'], { from: tag(), until: tag(1) }));
  await erwachsen(page, 'frau');
  assert.match(await page.textContent('#pKid'), /mia/);
  await page.clock.setFixedTime(new Date(Date.now() + 3 * 864e5));
  await page.reload(); await page.waitForSelector('#parentClose');
  assert.ok(!(await page.textContent('.phdr')).includes('mia'), 'expired');
  const log = await page.evaluate((id) => JSON.parse(localStorage.getItem('bq2_' + id + '__grantlog') || '[]').map((e) => e.ev), ID('mia'));
  assert.ok(log.includes('abgelaufen'));
  await ctx.close();
});

test('Admin ohne Freigabe: nur Verwaltungsangaben, keine Inhalte und keine Anzeigenamen', async () => {
  const { ctx, page } = await geraet();
  await erwachsen(page, 'chef');
  await kapitel(page, 'accounts');
  const t = await page.textContent('details.psec[data-psec="accounts"]');
  for (const n of ['mia', 'lia', 'papa', 'frau', 'chef', 'fremd']) assert.ok(t.includes(n), n);
  assert.ok(!t.includes('Sonnenschein'), 'no display names');
  assert.match(t, /Zuletzt auf diesem Gerät/);
  assert.ok(!(await page.textContent('.phdr')).includes('mia'));
  await ctx.close();
});
