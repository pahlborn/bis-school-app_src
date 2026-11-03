// Paket F4 (Konzept Elternbereich 7.4): Quellen in sechs zugeklappten Gruppen, keine gestrichen.
//  T9: Linkzahl vorher = nachher (DE/EN), 6 Gruppen, zugeklappt. Vorher: 55 Quellen, im Elternbereich dazu 4 Links zur
//  Website der Schule; die für Kinder erreichbare Info-Seite verlinkt die Schule nie.
//   node --test tests/elternbereich-f4.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, elternOeffnen, elternSeite, aboutAbschnitt } from './app-hilfen.mjs';

let browser, server;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

const GRUPPEN = {
  de: ['Forschung zu Lernen, Feedback und Hilfe', 'IB und Schule', 'Lehrpläne zum Vergleich', 'Lernprogramme und Materialien', 'Technik und Datenschutz', 'Nicht öffentliche Quellen'],
  en: ['Research on learning, feedback and help', 'IB and school', 'Curricula for comparison', 'Learning programs and materials', 'Technology and privacy', 'Non-public sources']
};
const QUELLEN = 55, SCHULE = 4;
// spot checks: a source sits in its group
const STICH = { 1: 'doi.org/10.3102/0034654308325185', 2: 'ibo.org/terms-and-conditions', 3: 'lehrplanplus.bayern.de', 4: 'typing.com', 5: 'ico.org.uk' };

async function pruefen(page, scope, lang, links) {
  const sec = page.locator(`${scope} details.about-sec`).filter({ has: page.locator('summary', { hasText: lang === 'de' ? 'Quellen' : 'Sources' }) }).first();
  const g = sec.locator('details.psrc');
  assert.deepEqual((await g.locator('> summary').allTextContents()).map((t) => t.trim()), GRUPPEN[lang], `${lang}: six groups in order`);
  assert.deepEqual(await g.evaluateAll((d) => d.map((x) => x.open)), Array(6).fill(false), `${lang}: all folded`);
  assert.equal(await sec.locator('a[href^="http"]').count(), links, `${lang}: number of links unchanged`);
  for (const [i, u] of Object.entries(STICH)) assert.equal(await sec.locator(`details.psrc[data-src="${i}"] a[href*="${u}"]`).count(), 1, `${lang}: ${u} in group ${i}`);
  assert.match(await sec.locator('details.psrc[data-src="6"]').textContent(), lang === 'de' ? /Nicht öffentliche Quellen: Unterrichtsmaterialien/ : /Private sources: Grade 3 class materials/);
  assert.match(await sec.locator('.about-sec-body > p.small').first().textContent(), lang === 'de' ? /Die Forschung hat die Gestaltung geprägt/ : /Research informs the design/);
  return sec;
}

test('T9 sources: six folded groups, the same number of links, school website only in the grown-ups area (group 2)', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  // info page (child-reachable without accounts): no school links
  await page.locator('#aboutBtn').click();
  for (const [tab, lang] of [['#tabDe', 'de'], ['#tabEn', 'en']]) {
    await page.locator(tab).click();
    await aboutAbschnitt(page, lang === 'de' ? 'Quellen' : 'Sources');
    await pruefen(page, '#aboutBody', lang, QUELLEN);
    assert.equal(await page.locator('#aboutBody a[href*="bis-school.com"]').count(), 0);
  }
  await page.locator('#aboutBack').click();
  // grown-ups area: the school website in group 2
  await elternOeffnen(page);
  for (const lang of ['de', 'en']) {
    await page.locator(`.phdr [data-plang="${lang}"]`).click();
    await elternSeite(page, 'concept');
    const sec = await pruefen(page, '#aboutBody details.psec[data-psec="concept"]', lang, QUELLEN + SCHULE);
    assert.equal(await sec.locator('details.psrc[data-src="2"] a[href*="bis-school.com"]').count(), SCHULE, `${lang}: school website in group 2`);
  }
  assert.deepEqual(fehler, []);
  await ctx.close();
});
