// Paket A1 (Konzept Elternbereich, 02.11.2026): drei falsche Texte.
//  - Das Willkommen fuer Erwachsene nennt ein Kapitel, das es im Elternbereich gibt (DE und EN).
//  - "So funktioniert Big Quest": der Fokus wird richtig beschrieben (die App waehlt, Eltern koennen umstellen).
//  - kein Satz "Einzelheiten stehen im Elternbereich" / "Details are in the parent area" im Elternbereich.
// Echte Klicks.
//   node --test tests/elternbereich-a1.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const CODES = { mia: 'ABCD-EFGH', papa: 'PAPA-2345' };
let browser, server;
before(async () => {
  server = await kontenServer({ users: [await konto('mia', 'student', CODES.mia), await konto('papa', 'parent', CODES.papa, { kinder: ['mia'] })] });
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); });

const kapitel = (page) => page.$$eval('#aboutBody details.psec > summary', (s) => s.map((x) => x.textContent.trim()));

test('A1: the welcome names an existing chapter, the concept describes the focus correctly, no "details are in the parent area"', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server, { viewport: { width: 1366, height: 768 } });
  await anmelden(page, 'student', 'mia', CODES.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'papa', CODES.papa);
  await page.waitForSelector('#setPwForm');
  await page.locator('#newPw1').fill('Moon-Glass-Paper-8812'); await page.locator('#newPw2').fill('Moon-Glass-Paper-8812');
  await page.locator('#setPwGo').click();
  await page.waitForSelector('#welcomeGo');

  // where the welcome's guide line points to (German, the default language of the grown-ups area): a chapter
  // in „…“ must exist; since B2 it points to the header buttons ? (help) and ⚙️ (settings), which must exist
  const genannt = await page.$$eval('.welcome li', (li) => [...(li.find((x) => x.textContent.startsWith('📖'))?.querySelectorAll('b') || [])].map((b) => b.textContent.trim()));
  assert.ok(genannt.length >= 1, 'the welcome says where the guide is');
  await page.locator('#welcomeGo').click();
  await page.waitForSelector('#parentClose');
  const ziele = async (namen) => {
    const k = await kapitel(page);
    for (const n of namen) {
      const kap = n.match(/^[„“]([^”“]+)[”“]$/)?.[1];
      if (kap) assert.ok(k.includes(kap), `chapter named in the welcome exists: ${kap} (chapters: ${k.join(' | ')})`);
      else if (n === '?') assert.equal(await page.locator('.phdr #pHelp').count(), 1, '? in the header');
      else if (n.startsWith('⚙')) assert.equal(await page.locator('.phdr #pSettings').count(), 1, '⚙ in the header');
      else assert.fail('unknown target in the welcome: ' + n);
    }
    return k;
  };
  const de = await ziele(genannt);
  assert.ok(!de.includes('📖 Anleitung & Hintergrund'));

  // "So funktioniert Big Quest": focus chosen by the app, grown-ups can switch to manual; no pointer to "the grown-ups area"
  const konzept = page.locator('#aboutBody details.psec[data-psec="concept"]');
  await konzept.locator(':scope > summary').click();
  await konzept.evaluate((d) => d.querySelectorAll('details').forEach((x) => { x.open = true; }));
  const deText = await konzept.innerText();
  assert.ok(!deText.includes('die Eltern legen fest, welche Themen'), 'old focus sentence gone');
  // F2: the wording of the focus sentence changed; still chosen by the app, manual possible
  assert.match(deText, /Die App wählt ihn selbst – aus den nächsten Schritten der Lehrkraft, den Lücken und den Quests, bei denen Übung hilft\. In der Fachansicht können Eltern auf „Manuell“ umstellen/);
  assert.ok(!deText.includes('Einzelheiten stehen im Elternbereich'), 'no pointer to the page the reader is on (DE)');

  // English: the welcome's chapter name exists as a chapter there too, and no "Details are in the parent area"
  await page.locator('.phdr [data-plang="en"]').click();
  await page.waitForFunction(() => document.querySelector('#parentClose')?.textContent.includes('Log out'));
  const welcomeEn = await page.evaluate(() => {
    const s = [...document.scripts].map((x) => x.textContent).join('\n');
    const li = s.match(/<li>📖 Help is at the top[^]*?<\/li>/);
    return li ? [...li[0].matchAll(/<b>([^<]+)<\/b>/g)].map((m) => m[1].trim()) : null;
  });
  assert.ok(welcomeEn && welcomeEn.length, 'English welcome found');
  await ziele(welcomeEn);
  const konzeptEn = page.locator('#aboutBody details.psec[data-psec="concept"]');
  await konzeptEn.evaluate((d) => { d.open = true; d.querySelectorAll('details').forEach((x) => { x.open = true; }); });
  assert.ok(!(await konzeptEn.innerText()).includes('Details are in the parent area'), 'no pointer to the page the reader is on (EN)');

  assert.deepEqual(fehler, []);
  await ctx.close();
});
