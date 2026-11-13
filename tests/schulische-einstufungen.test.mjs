// Schulische Einstufungen neu gestaltet (Peter, 05.11., Punkt 4). Erfundene Schuldaten (60 Aufgaben über gut ein Schuljahr),
// keine echten. Echte Klicks.
//  T1  Tabelle: eine Zeile je bewerteter Aufgabe (Datum · Fach · Aufgabe · Einstufungen in Worten · Details), neueste zuerst;
//      „Wartet auf Bewertung“ als eigener kleiner Block; Stand aus den Daten (asOf, neueste Bewertung), kein festes Datum.
//  T2  Filter Fach, Zeitraum (letzte 8 Wochen, dieses Schuljahr), nur „Braucht Unterstützung / Wird sicherer“; Sortierung
//      Datum, Fach, Einstufung; leeres Ergebnis mit „Filter zurücksetzen“. Erwartung unabhängig von der App gerechnet.
//  T3  Details in fester Gliederung (Standards · Bewertungsraster · Stärken · Nächste Schritte) für JEDE Aufgabe, kurze Punkte;
//      Raster Lehrkraft / Selbst nebeneinander.
//  T4  Englisch: dieselbe Ansicht, kein Deutsch.
//  T5  iPhone-Breite: Karten statt Tabelle, nichts ragt über den Rand.
//  T6  Kind sieht nichts davon; Lehrkraft nur mit Freigabe „Schuldaten“ – dann dieselbe Ansicht.
//  T7  Keine fest eingetragenen Daten mehr: Seite „Das Konzept von Big Quest“ nimmt den Stand aus der Version, Startseite ohne Datum.
//   node --test tests/schulische-einstufungen.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appLesen } from '../werkzeug/module.mjs';
import { browserStarten, appServer, appOeffnen } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'ABCD-EFGH', papa: 'PAPA-2345', frau: 'TEAC-HER2' };
const tag = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const txt = (de, en) => ({ de, en });
// 60 invented assignments, every 5 days from 3 days ago back to ~10 months ago (so some lie before 1 August)
const AREAS = ['math', 'english', 'science', 'learner', 'deutsch'];
const STD = { math: ['M-N1', 'M-N3', 'M-N4'], english: ['E-S1', 'E-S2'], science: ['S-F1', 'M-M1'], deutsch: ['D-W1'], learner: [] };
const R = ['C', 'M', 'RS', 'E', 'M', 'C', 'N', 'M', 'E'];
const AUFGABEN = Array.from({ length: 60 }, (_, i) => {
  const area = AREAS[i % 5], std = Object.fromEntries(STD[area].map((s, j) => [s, R[(i + j * 2) % R.length]]));
  return {
    day: tag(-3 - 5 * ((i * 7) % 60)), area, title: 'Task ' + String(i + 1).padStart(2, '0'), std, quests: area === 'math' ? ['round'] : [], focusNext: [],
    ...(area === 'learner' ? { atl: { Thinkers: ['ES', 'Obs.', 'Ind.'][i % 3] } } : {}),
    ...(i % 4 === 0 ? { rubric: [{ crit: 'Accuracy', teacher: 'C', self: 'E' }, { crit: 'Explaining', teacher: 'M', self: 'M' }] } : {}),
    good: txt('Rundet sicher. Begründet klar; arbeitet gut mit.', 'Rounds securely. Explains clearly; works well with others.'),
    next: i % 6 === 0 ? txt('', '') : txt('Genauer lesen; Einheiten notieren.', 'Read more carefully; write down units.'),
  };
});
const WARTET = { day: tag(-1), area: 'english', title: 'Glows check', std: {}, quests: [], focusNext: [], pending: true, good: txt('', ''), next: txt('', '') };
const ASOF = tag(-1);
const SCHULE = { version: 1, kinder: { mia: { asOf: ASOF, tasks: [...AUFGABEN, WARTET] } } };
const GLIEDERUNG = { de: ['Standards', 'Bewertungsraster', 'Stärken', 'Nächste Schritte'], en: ['Standards', 'Rubric', 'Strengths', 'Next steps'] };
const WORT = { de: { rs: 'Braucht Unterstützung', c: 'Wird sicherer', m: 'Sicher', e: 'Darüber hinaus' }, en: { rs: 'Needs support', c: 'Getting there', m: 'Secure', e: 'Going beyond' } };
const LV = { RS: 'rs', N: 'rs', C: 'c', M: 'm', E: 'e' }, ORDER = ['rs', 'c', 'm', 'e'];

// the expectation, computed here (not taken from the app)
const tage = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
const schwach = (t) => { const l = Object.values(t.std).map((r) => ORDER.indexOf(LV[r])); return l.length ? Math.min(...l) : 4; };
function erwartet(f, heute) {
  const [y, m] = heute.split('-').map(Number), jahr = (m >= 8 ? y : y - 1) + '-08-01';
  let l = AUFGABEN.map((t, i) => ({ t, i }));
  if (f.area) l = l.filter((x) => x.t.area === f.area);
  if (f.period === '8w') l = l.filter((x) => tage(x.t.day, heute) <= 56);
  if (f.period === 'year') l = l.filter((x) => x.t.day >= jahr);
  if (f.weak) l = l.filter((x) => Object.values(x.t.std).some((r) => ['RS', 'N', 'C'].includes(r)));
  const datum = (a, b) => (a.t.day < b.t.day ? 1 : a.t.day > b.t.day ? -1 : a.i - b.i);
  const fach = ['math', 'science', 'english', 'deutsch', 'learner'];   // the school's order (Maths, Science, English, Deutsch, Me as a Learner)
  const cmp = f.sort === 'subject' ? (a, b) => fach.indexOf(a.t.area) - fach.indexOf(b.t.area) || datum(a, b) : f.sort === 'level' ? (a, b) => schwach(a.t) - schwach(b.t) || datum(a, b) : datum;
  return l.sort(cmp).map((x) => x.i);
}

let browser, server;
before(async () => {
  server = await kontenServer({ users: [await konto('mia', 'student', C.mia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] }), await konto('frau', 'teacher', C.frau)] }, { schule: SCHULE });
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); });

const ID = (n) => server.konten.users.find((u) => u.user === n).id;
async function kindAnmelden(page) {
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
}
async function erwachsen(page, wer, pw = C[wer]) {
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', wer, pw);
  if (pw === C[wer]) await passwortSetzen(page, 'Moon-Glass-Paper-8812');
  await page.waitForSelector('#parentClose');
}
const kapitel = (page) => page.locator('details.psec[data-psec="school"]');
async function kapitelOeffnen(page) { if (!(await kapitel(page).evaluate((e) => e.open))) await kapitel(page).locator('> summary').click(); }
const zeilen = (page) => page.$$eval('details.psec[data-psec="school"] tr.psrow', (r) => r.map((x) => Number(x.dataset.psrow)));
async function filtern(page, f) {
  for (const k of ['area', 'period', 'sort']) if (f[k] !== undefined) await kapitel(page).locator(`select[data-psf="${k}"]`).selectOption(f[k]);
  if (f.weak !== undefined) await kapitel(page).locator('input[data-psf="weak"]').setChecked(f.weak);
}
const fmtDe = (d) => d.split('-').reverse().join('.');

test('T1–T3 table, filters, sorting and fixed outline (German, 60 assignments)', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server, { viewport: { width: 1366, height: 768 } });
  await kindAnmelden(page); await erwachsen(page, 'papa');
  await kapitelOeffnen(page);
  const heute = await page.evaluate(() => { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); });
  const k = kapitel(page), text = await k.innerText();
  // T1: data date from the data, newest evaluation, no old hard-coded status line
  const neueste = AUFGABEN.map((t) => t.day).sort().pop();
  assert.ok(text.includes(`Stand der Daten: ${fmtDe(ASOF)} · neueste Bewertung: ${fmtDe(neueste)}.`), text.slice(0, 300));
  assert.ok(!/Stand:\s*30\. Oktober 2026\.?|Stand:\s*30\.10\.2026\.?/.test(text), 'no old fixed status line');
  // waiting assignment: its own small block, not in the table
  assert.match(await k.locator('.pspend').innerText(), /Wartet auf Bewertung[\s\S]*Glows check/);
  assert.ok(!(await k.locator('table.pstab').innerText()).includes('Glows check'));
  // T1: one row per evaluated assignment, newest first, columns in this order
  assert.deepEqual(await k.locator('table.pstab > thead th').allInnerTexts().then((x) => x.slice(0, 4)), ['Datum', 'Fach', 'Aufgabe', 'Einstufung']);
  assert.deepEqual(await zeilen(page), erwartet({}, heute));
  assert.equal((await k.locator('.pscount').innerText()).trim(), '60 von 60 Aufgaben');
  const erste = AUFGABEN[(await zeilen(page))[0]];
  const zelle = await k.locator('tr.psrow').first().locator('td').allInnerTexts();
  assert.deepEqual(zelle.slice(0, 3), [fmtDe(erste.day), { math: 'Mathe', english: 'Englisch', science: 'Science', learner: 'Lernen', deutsch: 'Deutsch' }[erste.area], erste.title]);
  // ratings in words, weakest first, with the number of standards; never letter codes
  for (const i of [0, 1, 2, 4]) {
    const t = AUFGABEN[i], n = {};
    Object.values(t.std).forEach((r) => { n[LV[r]] = (n[LV[r]] || 0) + 1; });
    const soll = ORDER.filter((x) => n[x]).map((x) => (n[x] > 1 ? n[x] + '× ' : '') + WORT.de[x]);
    assert.deepEqual(await k.locator(`tr.psrow[data-psrow="${i}"] .pslv .pst`).allInnerTexts(), soll, t.title);
  }
  const chips = (await k.locator('tr.psrow .pslv').allInnerTexts()).join(' | ');
  assert.ok(!/\b(RS|C|M|E|N)\b/.test(chips), 'no letter codes: ' + chips.slice(0, 200));
  // T2: filters (each alone and combined) and sorting - expectation computed here
  const faelle = [{ area: 'math' }, { area: 'learner' }, { period: '8w' }, { period: 'year' }, { weak: true }, { sort: 'subject' }, { sort: 'level' },
    { area: 'english', period: 'year', weak: true, sort: 'level' }, { area: 'science', period: '8w', sort: 'date' }];
  for (const f of faelle) {
    const voll = { area: '', period: 'all', weak: false, sort: 'date', ...f };
    await filtern(page, voll);
    const soll = erwartet(voll, heute);
    assert.ok(soll.length > 0, 'test data cover ' + JSON.stringify(f));
    assert.deepEqual(await zeilen(page), soll, JSON.stringify(f));
    assert.equal((await k.locator('.pscount').innerText()).trim(), `${soll.length} von 60 Aufgaben`);
  }
  assert.ok(erwartet({ period: '8w' }, heute).length < erwartet({ period: 'year' }, heute).length && erwartet({ period: 'year' }, heute).length < 60, 'periods differ');
  // nothing matches: a clear sentence and "reset"
  await filtern(page, { area: 'learner', period: 'all', weak: true, sort: 'date' });
  assert.match(await k.locator('#psList').innerText(), /Keine Aufgabe passt zu diesem Filter/);
  await k.locator('[data-psreset]').click();
  assert.deepEqual(await zeilen(page), erwartet({}, heute));
  assert.equal(await k.locator('select[data-psf="area"]').inputValue(), '');
  assert.equal(await k.locator('input[data-psf="weak"]').isChecked(), false);
  // T3: details - the same outline for EVERY assignment; short points; rubric side by side
  const gliederung = await k.locator('tr.psdet').evaluateAll((r) => r.map((x) => [...x.querySelectorAll('h4')].map((h) => h.textContent)));
  assert.equal(gliederung.length, 60);
  for (const g of gliederung) assert.deepEqual(g, GLIEDERUNG.de);
  assert.equal(await k.locator('tr.psdet:not([hidden])').count(), 0, 'details closed at first');
  const b = k.locator('tr.psrow[data-psrow="0"] [data-psdet]');
  assert.equal((await b.innerText()).trim(), 'Details');
  await b.click();
  const d0 = k.locator('tr.psdet[data-psdetrow="0"]');
  assert.ok(await d0.isVisible());
  assert.equal(await b.getAttribute('aria-expanded'), 'true');
  assert.deepEqual(await d0.locator('table.psrub thead th').allInnerTexts(), ['Kriterium', 'Lehrkraft', 'Selbst']);
  assert.deepEqual(await d0.locator('table.psrub tbody tr').first().locator('td').allInnerTexts(), ['Accuracy', 'Wird sicherer', 'Darüber hinaus']);
  const punkte = await d0.locator('h4:has-text("Stärken") + ul > li').allInnerTexts();
  assert.deepEqual(punkte, ['Rundet sicher', 'Begründet klar', 'arbeitet gut mit']);
  assert.deepEqual(await d0.locator('h4:has-text("Nächste Schritte") + p').allInnerTexts(), ['keine Angabe'], 'empty next steps: the heading stays');
  const std0 = await d0.locator('h4:has-text("Standards") + ul > li').allInnerTexts();
  assert.equal(std0.length, Object.keys(AUFGABEN[0].std).length);
  // learner: learning skills in words
  await k.locator('tr.psrow[data-psrow="3"] [data-psdet]').click();
  assert.deepEqual(await k.locator('tr.psdet[data-psdetrow="3"] h4:has-text("Standards") + ul > li').allInnerTexts(), ['Thinkers: mit Unterstützung']);
  // details stay open while filtering
  await filtern(page, { area: 'math' });
  assert.ok(await k.locator('tr.psdet[data-psdetrow="0"]').isVisible(), 'still open after filtering');
  await k.locator('tr.psrow[data-psrow="0"] [data-psdet]').click();
  assert.ok(!(await k.locator('tr.psdet[data-psdetrow="0"]').isVisible()));
  // the ⓘ explains the view
  await k.locator('h2 .info-btn').click(); await page.waitForSelector('#helpDlg[open]');
  assert.match(await page.textContent('#helpText'), /Eine Zeile je bewerteter Aufgabe/);
  await page.locator('#helpClose').click();
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('T4 English: the same view, no German', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server, { viewport: { width: 1366, height: 768 } });
  await kindAnmelden(page); await erwachsen(page, 'papa');
  await page.locator('.phdr [data-plang="en"]').click();
  await kapitelOeffnen(page);
  const k = kapitel(page);
  assert.deepEqual(await k.locator('table.pstab > thead th').allInnerTexts().then((x) => x.slice(0, 4)), ['Date', 'Subject', 'Assignment', 'Rating']);
  assert.equal((await k.locator('.pscount').innerText()).trim(), '60 of 60 assignments');
  for (const g of await k.locator('tr.psdet').evaluateAll((r) => r.map((x) => [...x.querySelectorAll('h4')].map((h) => h.textContent))))
    assert.deepEqual(g, GLIEDERUNG.en);
  await k.locator('tr.psrow[data-psrow="0"] [data-psdet]').click();
  assert.deepEqual(await k.locator('tr.psdet[data-psdetrow="0"] table.psrub tbody tr').first().locator('td').allInnerTexts(), ['Accuracy', 'Getting there', 'Going beyond']);
  assert.deepEqual(await k.locator('tr.psdet[data-psdetrow="0"] h4:has-text("Strengths") + ul > li').allInnerTexts(), ['Rounds securely', 'Explains clearly', 'works well with others']);
  const text = await k.innerText();
  assert.match(text, /Data as of: .* · latest evaluation: /);
  assert.match(text, /Awaiting evaluation[\s\S]*Glows check/);
  for (const w of ['Stärken', 'Zeitraum', 'Sortieren', 'Aufgabe', 'Einstufung', 'Wird sicherer', 'Lehrkraft', 'Datum', 'Mathe', 'Englisch', 'Lernen', 'Stand der Daten', 'keine Angabe', 'Filter zurücksetzen'])
    assert.ok(!text.includes(w), 'German in English: ' + w);
  assert.deepEqual(await k.locator('select[data-psf="period"] option').allInnerTexts(), ['All', 'Last 8 weeks', 'This school year']);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('T5 iPhone width: cards instead of the table, nothing sticks out', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await kindAnmelden(page); await erwachsen(page, 'papa');
  await kapitelOeffnen(page);
  const k = kapitel(page);
  assert.equal(await k.locator('table.pstab > thead').isVisible(), false, 'no table head');
  const karte = k.locator('tr.psrow').first();
  assert.equal(await karte.evaluate((e) => getComputedStyle(e).display), 'block');
  const td = await karte.locator('td').evaluateAll((t) => t.map((x) => [x.dataset.l || '', getComputedStyle(x).display, getComputedStyle(x, '::before').content]));
  assert.deepEqual(td.slice(0, 4).map((x) => x[0]), ['Datum', 'Fach', 'Aufgabe', 'Einstufung'], 'every line of the card is labeled');
  assert.ok(td.every((x) => x[1] === 'block') && /Datum/.test(td[0][2]), JSON.stringify(td[0]));
  await karte.locator('[data-psdet]').click();
  assert.ok(await k.locator('tr.psdet[data-psdetrow="0"]').isVisible());
  const breit = await page.evaluate(() => ({ seite: document.documentElement.scrollWidth, fenster: window.innerWidth, zu: [...document.querySelectorAll('details.psec[data-psec="school"] *')].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1).map((e) => e.tagName + '.' + e.className).slice(0, 5) }));
  assert.ok(breit.seite <= breit.fenster, JSON.stringify(breit));
  assert.deepEqual(breit.zu, []);
  // closed details stay hidden in the card layout
  assert.equal(await k.locator('tr.psdet[data-psdetrow="1"]').isVisible(), false);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('T6 the child sees none of it; a teacher only with the grant "school data" - then the same view', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server, { viewport: { width: 1366, height: 768 } });
  await kindAnmelden(page);
  const kind = await page.evaluate(() => document.body.innerText);
  for (const w of ['Schulische Einstufungen', 'School assessments', 'Task 01', 'Glows check', 'Stand der Daten', 'Data as of']) assert.ok(!kind.includes(w), 'child sees ' + w);
  assert.equal(await page.locator('.pstab, #pSchoolAll').count(), 0);
  const freigabe = (scope) => page.evaluate(([id, g]) => localStorage.setItem('bq2_' + id + '__grants', JSON.stringify([g])), [ID('mia'), { id: 'g1', grantee: ID('frau'), scope, from: tag(0), until: tag(10), by: ID('papa') }]);
  await freigabe(['learning']);
  await erwachsen(page, 'frau');
  assert.equal(await page.locator('details.psec[data-psec="school"], .pstab').count(), 0, 'learning only: no school assessments');
  await page.locator('#parentClose').click(); await page.waitForSelector('#home:not([hidden])');
  await freigabe(['learning', 'school']);
  await erwachsen(page, 'frau', 'Moon-Glass-Paper-8812');
  await kapitelOeffnen(page);
  assert.equal(await kapitel(page).locator('tr.psrow').count(), 60, 'the same table');
  await kapitel(page).locator('select[data-psf="area"]').selectOption('math');
  assert.equal(await kapitel(page).locator('tr.psrow').count(), 12, 'the teacher can filter');
  await kapitel(page).locator('tr.psrow').first().locator('[data-psdet]').click();
  assert.equal(await kapitel(page).locator('tr.psdet:not([hidden]) h4').count(), 4);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('T7 no fixed dates: the concept page is as of the build of the version; the home page names no date', async () => {
  const html = (await appLesen()).toString('utf8');
  for (const w of ['Stand: 30. Oktober 2026', 'Last updated: 30 October 2026', 'updated 30 October']) assert.ok(!html.includes(w), w);
  const s = await appServer({ anpassen: (a) => a.replace('/*BQ_VERSION*/null', JSON.stringify({ major: 0, minor: 150, patch: 0, kanal: 'beta', hash: 'abc1234', date: '04.12.2026 18:05', draft: false })) });
  try {
    const { ctx, page, fehler } = await appOeffnen(browser, s.url);
    await page.locator('#aboutBtn').click();
    assert.equal((await page.locator('#aboutBody .about-stand').innerText()).trim(), 'Stand: 04.12.2026.');
    assert.ok(!(await page.locator('#home').innerText().catch(() => '')).includes('30 October'));
    await page.locator('#tabEn').click();
    assert.equal((await page.locator('#aboutBody .about-stand').innerText()).trim(), 'Last updated: Dec 4, 2026.');
    assert.deepEqual(fehler, []);
    await ctx.close();
  } finally { s.close(); }
});
