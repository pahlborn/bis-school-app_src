// Paket B3 (Konzept Elternbereich 5.8, R11): ⚙ → Über die App.
//  T11: Über Big Quest, Wichtiger Hinweis (mit Satz zur Verantwortung), Datenschutz, Impressum (Platzhalter), Version;
//       Datenschutz und Hinweis nicht mehr im Konzept-Kapitel des Elternbereichs; Satz zur Verantwortung auch im ⓘ der Einschätzung;
//       die Info-Seite außerhalb des Elternbereichs zeigt Hinweis und Datenschutz weiter.
// Echte Klicks.
//   node --test tests/elternbereich-b3.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browserStarten, appServer, appOeffnen, klick } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'ABCD-EFGH', papa: 'PAPA-2345', frau: 'TEAC-HER2', chef: 'CHEF-2345' };
const RELEASES = [{
  version: 'v152',
  date: '08.11.2026 18:40',
  epics: [{ de: 'Releasedokumentation ist jetzt direkt im Admin-Bereich sichtbar.', en: 'Release notes are now visible directly in the admin area.' }],
  stories: [{ de: 'Der Admin sieht jede Fassung gegliedert nach Epic, User Story und Bugfix.', en: 'The admin sees each version grouped by epic, user story and bugfix.' }],
  bugfixes: [{ de: 'Fehlende Einträge zeigen nur einen ruhigen Hinweis.', en: 'Missing entries only show a calm note.' }]
}];
const mitReleases = (app) => app.replace('const APP_RELEASES=/*BQ_RELEASES*/null;', 'const APP_RELEASES=' + JSON.stringify(RELEASES) + ';');
let browser, server, serverMitRelease, ohneKonten;
before(async () => {
  const users = [
    await konto('mia', 'student', C.mia),
    await konto('papa', 'parent', C.papa, { kinder: ['mia'] }),
    await konto('frau', 'teacher', C.frau),
    await konto('chef', 'parent', C.chef, { admin: true })
  ];
  server = await kontenServer({ users });
  serverMitRelease = await kontenServer({ users }, { anpassen: mitReleases });
  ohneKonten = await appServer();
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); serverMitRelease?.close(); ohneKonten?.close(); });

async function kindDann(page, wer) {
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', wer, C[wer]); await passwortSetzen(page, 'Moon-Glass-Paper-8812');
  await page.waitForSelector('#parentClose');
}
async function ueberDieApp(page) {
  await page.locator('#pSettings').click(); await page.waitForSelector('#pSetBack');
  const d = page.locator('#aboutBody details.psec[data-psec="aboutapp"]');
  await d.locator(':scope > summary').click();
  await d.evaluate((e) => e.querySelectorAll('details').forEach((x) => { x.open = true; }));
  return d;
}
async function administration(page) {
  const d = page.locator('#aboutBody details.psec[data-psec="administration"]');
  await d.locator(':scope > summary').click();
  await d.evaluate((e) => e.querySelectorAll('details').forEach((x) => { x.open = true; }));
  return d;
}
const VERANTWORTUNG_DE = 'Big Quest weiß nicht, wer eine Aufgabe gelöst hat und mit welchen Hilfsmitteln.';
const VERANTWORTUNG_EN = 'Big Quest does not know who solved a task or with what help.';

test('T11 ⚙ → Über die App: intro, important note with responsibility, privacy, legal notice, version (DE/EN); not in the concept chapter', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await kindDann(page, 'papa');
  // concept chapter on the overview: neither intro nor note nor privacy
  const konzept = page.locator('#aboutBody details.psec[data-psec="concept"]');
  await konzept.locator(':scope > summary').click();
  await konzept.evaluate((e) => e.querySelectorAll('details').forEach((x) => { x.open = true; }));
  const k = await konzept.innerText();
  for (const s of ['Über Big Quest', 'Wichtiger Hinweis', 'Konten und Rechte', 'Leseaufnahmen:']) assert.ok(!k.includes(s), 'not in the concept chapter: ' + s);
  assert.deepEqual(await konzept.locator('details.about-sec > summary').allInnerTexts().then((x) => x.filter((s) => /Datenschutz/.test(s))), []);
  // ⚙ → Über die App
  const d = await ueberDieApp(page);
  const t = await d.innerText();
  assert.match(t, /privat entwickeltes, spielerisches Übungsangebot/);
  assert.match(t, /Wichtiger Hinweis\./);
  assert.ok(t.includes(VERANTWORTUNG_DE) && t.includes('die Verantwortung für das Lernen und für Entscheidungen liegt bei den Eltern'), 'responsibility (R11)');
  assert.deepEqual(await d.locator('details.about-sec > summary').allInnerTexts(), ['Datenschutz', 'Impressum']);
  assert.match(t, /Konten und Rechte:[\s\S]*Leseaufnahmen:/);
  assert.match(await d.locator('details[data-about="imprint"]').innerText(), /Wird ergänzt\./);
  assert.ok(await d.locator('#versionInfo').isVisible(), 'version');
  assert.match(t, /Betafassungen tragen sichtbar „\(Betaversion\)“\./);
  assert.match(t, /Finale Freigaben erscheinen später als „V 1\.0\.0“\./);
  assert.equal(await page.locator('#aboutBody h2', { hasText: 'Über Big Quest' }).count(), 0, 'no second page title inside the section');
  // English
  await page.locator('.phdr [data-plang="en"]').click();
  const en = await page.locator('#aboutBody details.psec[data-psec="aboutapp"]');
  await en.evaluate((e) => { e.open = true; e.querySelectorAll('details').forEach((x) => { x.open = true; }); });
  const te = await en.innerText();
  assert.ok(te.includes('Please note.') && te.includes(VERANTWORTUNG_EN));
  assert.deepEqual(await en.locator('details.about-sec > summary').allInnerTexts(), ['Privacy', 'Legal notice']);
  assert.match(te, /To be added\./);
  assert.match(te, /Beta releases visibly carry “\(Beta version\)”\./);
  assert.match(te, /Final releases later appear as “V 1\.0\.0”\./);
  // teacher: "about the app" too
  const l = await oeffnen(browser, server);
  await kindDann(l.page, 'frau');
  const dl = await ueberDieApp(l.page);
  assert.ok((await dl.innerText()).includes(VERANTWORTUNG_DE));
  assert.deepEqual([...fehler, ...l.fehler], []);
  await ctx.close(); await l.ctx.close();
});

test('T12 release notes: only the admin sees them; Epic / User Story / Bugfix are clear; missing entries stay calm', async () => {
  const p = await oeffnen(browser, serverMitRelease);
  await kindDann(p.page, 'papa');
  const dp = await ueberDieApp(p.page);
  assert.equal(await dp.locator('#releaseDocs').count(), 0, 'parent does not see release notes');

  const l = await oeffnen(browser, serverMitRelease);
  await kindDann(l.page, 'frau');
  const dl = await ueberDieApp(l.page);
  assert.equal(await dl.locator('#releaseDocs').count(), 0, 'teacher does not see release notes');

  const a = await oeffnen(browser, serverMitRelease);
  await kindDann(a.page, 'chef');
  const da = await administration(a.page);
  assert.deepEqual(await da.locator('details[data-admin] > summary').allInnerTexts(), ['Kontenübersicht', 'Versions- und Releaseinformationen']);
  assert.ok(await da.locator('details[data-admin="version"] #versionInfo').isVisible(), 'admin sees version info there');
  assert.ok(await da.locator('details[data-admin="version"] #releaseDocs').isVisible(), 'admin sees release notes');
  const ta = await da.locator('details[data-admin="version"] #releaseDocs').innerText();
  for (const x of ['Releasedokumentation', 'Nur für den Admin sichtbar', 'Epic', 'User Story', 'Bugfix', 'Releasedokumentation ist jetzt direkt im Admin-Bereich sichtbar.']) assert.ok(ta.includes(x), x);
  const ua = await ueberDieApp(a.page);
  assert.equal(await ua.locator('#releaseDocs').count(), 0, 'release notes moved out of about the app');
  await a.page.locator('#pSetBack').click(); await a.page.waitForSelector('#pSetBack', { state: 'detached' });

  const leer = await oeffnen(browser, server);
  await kindDann(leer.page, 'chef');
  const dLeer = await administration(leer.page);
  assert.match(await dLeer.locator('details[data-admin="version"] #releaseDocs').innerText(), /Noch keine Releaseeinträge hinterlegt\./);

  assert.deepEqual([...p.fehler, ...l.fehler, ...a.fehler, ...leer.fehler], []);
  await p.ctx.close(); await l.ctx.close(); await a.ctx.close(); await leer.ctx.close();
});

test('T11 ⓘ of the assessment names the responsibility; the info page outside the grown-ups area keeps note and privacy', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await kindDann(page, 'papa');
  await page.locator('#aboutBody .info-btn[data-help="overview"]').first().click();
  assert.ok((await page.locator('#helpDlg').innerText()).includes(VERANTWORTUNG_DE), 'ⓘ of the assessment');
  await page.locator('#helpClose').click();
  // info page without accounts (what a grown-up reads before setting up): note and privacy stay
  const o = await appOeffnen(browser, ohneKonten.url);
  await klick(o.page, '#aboutBtn');
  const info = await o.page.locator('#aboutBody').innerText();
  assert.ok(info.includes('Wichtiger Hinweis') && info.includes(VERANTWORTUNG_DE), 'note on the info page');
  assert.ok((await o.page.locator('#aboutBody details.about-sec > summary').allInnerTexts()).includes('Datenschutz'), 'privacy on the info page');
  assert.deepEqual([...fehler, ...o.fehler], []);
  await ctx.close(); await o.ctx.close();
});
