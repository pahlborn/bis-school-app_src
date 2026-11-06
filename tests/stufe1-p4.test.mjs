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
    await page.evaluate(([id, n]) => { localStorage.setItem('bq2_' + id + '__name', JSON.stringify(n)); if (n !== 'Lia') { localStorage.setItem('bq2_' + id + '__birthday', JSON.stringify('05-17')); localStorage.setItem('bq2_' + id + '__emoji', JSON.stringify('🦉')); } localStorage.setItem('bq2_' + id + '__attempts', JSON.stringify(Array.from({ length: 12 }, (_, i) => ({ day: new Date(Date.now() - (i % 4) * 864e5).toISOString().slice(0, 10), skill: 'round', level: 2, attempt: 1, ok: i % 3 > 0, help: false })))); }, [ID(k), k === 'mia' ? 'Mia Sonnenschein' : 'Lia']);
    if (k === 'lia') await page.locator('#logoutBtn').click();
  }
  return g;
}
const IN_EINSTELLUNGEN = ['settings', 'backup', 'grants', 'accounts', 'aboutapp'];
async function kapitel(page, id) {
  // B1: settings, backup, grants and accounts are in ⚙
  const inSet = !!(await page.$('#pSetBack'));
  if (IN_EINSTELLUNGEN.includes(id) && !inSet) { await page.locator('#pSettings').click(); await page.waitForSelector('#pSetBack'); }
  if (!IN_EINSTELLUNGEN.includes(id) && inSet) { await page.locator('#pSetBack').click(); await page.waitForSelector('#pSetBack', { state: 'detached' }); }
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

// profile beyond the name: birthday (17.05.) and emoji (🦉) of mia
const PROFIL = (t) => t.includes('17.05.') || t.includes('🦉');
async function sicht(page) {
  const n = async (sel) => (await page.locator(sel).count()) > 0;
  const uebersichtText = await page.textContent('#aboutBody');
  const r = {
    kind: (await page.textContent('.phdr')).includes('mia'),
    fremd: (await page.textContent('.phdr')).includes('lia'),
    // Peter, 03.11.: with a grant the teacher/admin sees the name (display name) - in the header and in the overview
    kopfname: (await page.textContent('.phdr')).includes('Mia Sonnenschein (mia)'),
    name: uebersichtText.includes('Sonnenschein'),
    profil: PROFIL(uebersichtText),
    uebersicht: await n('.psubject'), schule: await n('details.psec[data-psec="school"]'), einstellungen: false,
    sicherung: false, freigaben: false, konten: false, fokus: false, schulzeile: false
  };
  if (r.uebersicht) { await page.locator('[data-psubj="maths"]').click(); const t = await page.textContent('#aboutBody'); r.fokus = await n('[data-pfocus]'); r.schulzeile = /🏫 Schule/.test(t); r.profil = r.profil || PROFIL(t); await page.locator('#pBack').click(); }
  // ⚙ settings (B1): the child's settings (with the profile), backup, grants, accounts
  await page.locator('#pSettings').click(); await page.waitForSelector('#pSetBack');
  r.profil = r.profil || PROFIL(await page.textContent('#aboutBody'));
  r.einstellungen = await n('details.psec[data-psec="settings"]'); r.sicherung = await n('details.psec[data-psec="backup"]');
  r.freigaben = await n('details.psec[data-psec="grants"]'); r.konten = await n('details.psec[data-psec="accounts"]');
  await page.locator('#pSetBack').click(); await page.waitForSelector('#pSetBack', { state: 'detached' });
  return r;
}
// kind: mia is shown; fremd: lia (the other family's child) is shown
const NICHTS = { kind: false, fremd: false, kopfname: false, name: false, profil: false, uebersicht: false, schule: false, einstellungen: false, sicherung: false, freigaben: false, konten: false, fokus: false, schulzeile: false };
// parents see the name in the overview and the whole profile; the header keeps the login name for them
const ELTERN = { ...NICHTS, kind: true, name: true, profil: true, uebersicht: true, schule: true, einstellungen: true, sicherung: true, freigaben: true, fokus: true, schulzeile: true };
// with a grant: name in the header and the overview, but no birthday, emoji or settings (Peter, 03.11.)
const MIT_FREIGABE = { ...NICHTS, kind: true, kopfname: true, name: true, uebersicht: true };

test('Rechtematrix Stufe 1: jede Rolle sieht genau, was sie darf (K10, K1); mit Freigabe den Namen, sonst nichts vom Profil', async () => {
  const { ctx, page, fehler } = await geraet();
  const faelle = [
    ['papa (Elternteil)', 'papa', null, ELTERN],
    ['fremd (Elternteil von lia): nichts von mia, nur sein eigenes Kind', 'fremd', null, { ...NICHTS, fremd: true, uebersicht: true, schule: true, einstellungen: true, sicherung: true, freigaben: true, fokus: true }],
    ['frau ohne Freigabe', 'frau', null, { ...NICHTS }],
    ['frau mit Freigabe Lernstand', 'frau', freigabe('frau', ['learning']), MIT_FREIGABE],
    ['frau mit Freigabe Lernstand + Schule', 'frau', freigabe('frau', ['learning', 'school']), { ...MIT_FREIGABE, schule: true, schulzeile: true }],
    ['frau mit abgelaufener Freigabe', 'frau', freigabe('frau', ['learning', 'school'], { from: tag(-20), until: tag(-6) }), { ...NICHTS }],
    ['frau mit widerrufener Freigabe', 'frau', freigabe('frau', ['learning'], { revokedAt: new Date().toISOString() }), { ...NICHTS }],
    ['chef (Admin) ohne Freigabe', 'chef', null, { ...NICHTS, konten: true }],
    ['chef (Admin) mit Freigabe Lernstand', 'chef', freigabe('chef', ['learning']), { ...MIT_FREIGABE, konten: true }],
    ['papa mit Freigabe an frau (eigene Rechte unveraendert)', 'papa', freigabe('frau', ['learning']), ELTERN]
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
  assert.equal(await page.textContent('#pGrantConsent'), 'Sie geben frau für 10 Tage Einblick in: Lernstand. frau sieht dabei Vor- und Nachnamen und das Geburtsdatum Ihres Kindes (und Jahrgangsstufe, Klasse und Schule, falls eingetragen), aber nicht Emoji und Einstellungen. frau kann nichts ändern. Sie können das jederzeit beenden. Was frau bis dahin gesehen hat, kann man nicht ungesehen machen.');
  await page.locator('.phdr [data-plang="en"]').click();
  await page.waitForFunction(() => /You give/.test(document.querySelector('#pGrantConsent')?.textContent || ''));
  await page.locator('#pGrantWho').fill('frau'); await page.locator('#pGrantDays').fill('10');
  assert.equal(await page.textContent('#pGrantConsent'), 'You give frau access for 10 days to: learning progress. frau will see your child’s first and last name and date of birth (and the grade, class and school, if entered), but not the emoji or settings. frau cannot change anything. You can end this at any time. What frau has seen until then cannot be unseen.');
  await page.locator('.phdr [data-plang="de"]').click();
  await page.waitForFunction(() => /Sie geben/.test(document.querySelector('#pGrantConsent')?.textContent || ''));
  await page.locator('#pGrantWho').fill('frau'); await page.locator('#pGrantDays').fill('10');
  await page.locator('#pGrantForm button[type="submit"]').click();
  await page.waitForSelector('[data-grantrevoke]');
  assert.match(await page.textContent('.pgrants'), /frau · Lernstand · läuft bis/);
  // the consent text as given is kept in the log and in the event
  const erteilt = await page.evaluate((id) => JSON.parse(localStorage.getItem('bq2_' + id + '__grantlog') || '[]').find((e) => e.ev === 'erteilt'), ID('mia'));
  assert.match(erteilt.text, /sieht dabei Vor- und Nachnamen und das Geburtsdatum Ihres Kindes \(und Jahrgangsstufe, Klasse und Schule, falls eingetragen\), aber nicht Emoji und Einstellungen/);
  // the teacher looks: read-only, without school ratings; the name, but no other profile details; logged as viewed (once a day)
  await erwachsen(page, 'frau');
  assert.equal((await page.textContent('#pKid')).trim(), '👧 Mia Sonnenschein (mia)', 'Peter, 03.11.: she must see whom she works with');
  assert.equal(await page.locator('details.psec[data-psec="school"]').count(), 0);
  const ueb = await page.textContent('#aboutBody');
  assert.match(ueb, /Auf einen Blick · Mia Sonnenschein/);
  assert.ok(!PROFIL(ueb), 'no emoji for the teacher; the birthday only when two children have the same name');
  // the header fits on a small screen
  await page.setViewportSize({ width: 320, height: 640 });
  assert.ok(await page.locator('#pKid').evaluate((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right <= innerWidth + 1; }), 'name in view on 320 px');
  await page.setViewportSize({ width: 1280, height: 720 });
  // her guide says so (DE and EN)
  await page.locator('#pHelp').click(); await page.waitForSelector('#pHelpBack');
  assert.match(await page.locator('.phelp-view').innerText(), /Oben stehen Vor- und Nachname des Kindes, damit Sie wissen, mit wem Sie arbeiten; heißen zwei Kinder gleich, auch das Geburtsdatum\. Klasse und Schule stehen dabei, wenn die Familie sie eingetragen hat\. Emoji und Einstellungen sehen Sie nicht\./);
  await page.locator('.phdr [data-plang="en"]').click();
  await page.waitForFunction(() => /Help for teachers/.test(document.querySelector('.phelp-view')?.innerText || ''));
  assert.match(await page.locator('.phelp-view').innerText(), /The child’s first and last name are shown at the top, so you know whom you are working with; if two children have the same name, the date of birth too\. The class and school are shown if the family entered them\. You do not see the emoji or settings\./);
  await page.locator('.phdr [data-plang="de"]').click();
  await page.waitForFunction(() => /Hilfe für Lehrkräfte/.test(document.querySelector('.phelp-view')?.innerText || ''));
  await page.locator('#pHelpBack').click();
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

test('Name mit Freigabe (Peter, 03.11.): Kinderliste der Lehrkraft mit Namen, Eltern unveraendert, Ende der Freigabe nimmt den Namen mit', async () => {
  const { ctx, page, fehler } = await geraet();
  // frau has grants for both children (two families): the list shows name and login name
  await page.evaluate(([mia, lia, gm, gl]) => { localStorage.setItem('bq2_' + mia + '__grants', JSON.stringify([gm])); localStorage.setItem('bq2_' + lia + '__grants', JSON.stringify([gl])); },
    [ID('mia'), ID('lia'), freigabe('frau', ['learning']), { ...freigabe('frau', ['learning']), id: 'g-frau-lia', by: ID('fremd') }]);
  await erwachsen(page, 'frau');
  const liste = await page.$$eval('#pKidSel option', (o) => o.map((x) => x.textContent.trim()));
  assert.deepEqual(liste.sort(), ['👧 Lia (lia)', '👧 Mia Sonnenschein (mia)']);
  // papa (parent): his header keeps the login name only
  await erwachsen(page, 'papa');
  assert.equal((await page.textContent('#pKid')).trim(), '👧 mia');
  // the grant for mia ends: frau keeps only lia, with her name
  await page.evaluate((mia) => { const g = JSON.parse(localStorage.getItem('bq2_' + mia + '__grants')); g[0].revokedAt = new Date().toISOString(); localStorage.setItem('bq2_' + mia + '__grants', JSON.stringify(g)); }, ID('mia'));
  await erwachsen(page, 'frau');
  assert.equal((await page.textContent('#pKid')).trim(), '👧 Lia (lia)');
  assert.ok(!(await page.textContent('#aboutBody')).includes('Sonnenschein'), 'no name of mia after the end');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Name und Geburtsdatum (Peter, 04.11.): zwei Kinder gleichen Namens - die Lehrkraft unterscheidet sie mit Nachnamen, bei gleichem Namen mit Geburtsdatum (DE und EN); Eltern unveraendert', async () => {
  const { ctx, page, fehler } = await geraet();
  const setze = (werte) => page.evaluate((w) => { for (const [k, v] of w) v === null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); }, werte);
  const P = (k, f) => 'bq2_' + ID(k) + '__' + f;
  await page.evaluate(([mia, lia, gm, gl]) => { localStorage.setItem('bq2_' + mia + '__grants', JSON.stringify([gm])); localStorage.setItem('bq2_' + lia + '__grants', JSON.stringify([gl])); },
    [ID('mia'), ID('lia'), freigabe('frau', ['learning']), { ...freigabe('frau', ['learning']), id: 'g-frau-lia', by: ID('fremd') }]);
  // beide heissen Mia, verschiedene Nachnamen -> ohne Geburtsdatum
  await setze([[P('mia', 'name'), 'Mia'], [P('mia', 'lastName'), 'Sonnenschein'], [P('mia', 'birthday'), '2017-05-17'], [P('lia', 'name'), 'Mia'], [P('lia', 'lastName'), 'Regen'], [P('lia', 'birthday'), '09-03']]);
  await erwachsen(page, 'frau');
  let liste = await page.$$eval('#pKidSel option', (o) => o.map((x) => x.textContent.trim()));
  assert.deepEqual(liste.sort(), ['👧 Mia Regen (lia)', '👧 Mia Sonnenschein (mia)']);
  // gleicher Vor- und Nachname -> Geburtsdatum dazu (mit Jahr, wenn eingetragen)
  await setze([[P('lia', 'lastName'), 'Sonnenschein']]);
  await erwachsen(page, 'frau');
  liste = await page.$$eval('#pKidSel option', (o) => o.map((x) => x.textContent.trim()));
  assert.deepEqual(liste.sort(), ['👧 Mia Sonnenschein, 03.09. (lia)', '👧 Mia Sonnenschein, 17.05.2017 (mia)']);
  await page.locator('#pKidSel').selectOption('mia');
  await page.waitForFunction(() => /Auf einen Blick · Mia Sonnenschein, 17\.05\.2017/.test(document.querySelector('#aboutBody')?.textContent || ''));
  assert.ok(!(await page.textContent('#aboutBody')).includes('🦉'), 'kein Emoji');
  await page.locator('.phdr [data-plang="en"]').click();
  await page.waitForFunction(() => [...document.querySelectorAll('#pKidSel option')].some((o) => o.textContent.includes('May 17, 2017')));
  liste = await page.$$eval('#pKidSel option', (o) => o.map((x) => x.textContent.trim()));
  assert.deepEqual(liste.sort(), ['👧 Mia Sonnenschein, May 17, 2017 (mia)', '👧 Mia Sonnenschein, September 3 (lia)']);
  await page.locator('.phdr [data-plang="de"]').click();
  // die Eltern: Kopf unveraendert, im Profil Name, Nachname und Geburtsdatum
  await erwachsen(page, 'papa');
  assert.equal((await page.textContent('#pKid')).trim(), '👧 mia');
  await kapitel(page, 'settings');
  const t = await page.textContent('details.psec[data-psec="settings"]');
  assert.ok(t.includes('Mia Sonnenschein') && t.includes('17.05.2017'), t);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

// Aufgabe "Name und Geburtsdatum" (Peter, 04.11.): mit Freigabe auch Nachname und Geburtsdatum; Emoji und Einstellungen nie
test('Anleitungen und Freigabe-Hinweis nennen Name, Nachname und Geburtsdatum (Eltern, Lehrkraft, Admin; DE und EN)', async () => {
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  // (seit "Anmeldung im Testbau": const X=kontoTexte(`...`, KONTO_GUIDE.x); - der Text selbst ist der von Kathies App)
  const teil = (name) => { const m = html.match(new RegExp('const ' + name + '=(?:kontoTexte\\()?`([\\s\\S]*?)`(?:, KONTO_GUIDE\\.\\w+\\))?;')); assert.ok(m, name); return m[1]; };
  for (const g of ['GUIDE_ADULT_DE', 'GUIDE_TEACHER_DE', 'GUIDE_ADMIN_DE']) assert.match(teil(g), /Vor- und Nachname[^<]*Geburtsdatum[^<]*Emoji und Einstellungen/, g);
  for (const g of ['GUIDE_ADULT_EN', 'GUIDE_TEACHER_EN', 'GUIDE_ADMIN_EN']) assert.match(teil(g), /first and last name[^<]*date of birth[^<]*emoji (and|or) settings/, g);
  for (const alt of ['Den Namen aus dem Profil sehen Sie nicht', 'You do not see the name from the profile', 'Geburtstag, Emoji und Einstellungen', 'birthday, emoji or settings', 'birthday, emoji and settings', 'Geburtstag (ohne Jahr)', 'birthday (without year)']) assert.ok(!html.includes(alt), alt);
  // Aufgabe "Schule und Klasse" (Peter, 05.11.): Klasse und Schule kommen dazu
  assert.match(html, /sieht den Lernstand, Namen, Geburtsdatum, Klasse und Schule Ihres Kindes nur, wenn Sie es hier freigeben/);
  assert.match(html, /sees your child’s progress, name, date of birth, class and school only if you allow it here/);
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
