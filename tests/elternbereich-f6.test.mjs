// Paket F6 (Konzept Elternbereich 7.0, 7.6, 7.9): Schlussdurchgang. Erfundene Schuldaten, keine echten.
//  Gesammelt wird der sichtbare Text aller Elternseiten (Übersicht, alle Fächer, alle Kapitel, ⚙ mit allen Abschnitten,
//  ? Hilfe) und aller ⓘ-Texte, je Sprache.
//  T5:  jeder Ortsname in „…“ mit Symbol (📖 ⚙️ 💡 🎯 🔐 💾 🤝 🏫 👧 🛠 ℹ️ 📄) in Hilfe- und ⓘ-Texten gibt es auf den Seiten.
//  T12: die Sätze der Streichliste kommen nicht vor (Kennungen und Prüfwerte nur im Datenschutz).
//  T17: keine Zeitwörter; Lücken-Fortschritt in Aufgaben. Dazu: „Das gelingt“ einmal in der Übersicht; „?“ gedrückt lesbar.
//   node --test tests/elternbereich-f6.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'ABCD-EFGH', papa: 'PAPA-2345' };
const tag = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const txt = (de, en) => ({ de, en });
const SCHULE = { version: 1, kinder: { mia: { asOf: tag(-1), tasks: [
  { day: tag(-20), area: 'math', title: 'Check B', std: { 'M-N1': 'RS' }, quests: ['numbers'], focusNext: [], good: txt('b', 'b'), next: txt('', '') },
  { day: tag(-5), area: 'science', title: 'Forces', std: { 'S-F1': 'M' }, quests: ['forces'], focusNext: ['forces'], good: txt('c', 'c'), next: txt('Begründen.', 'Explain.') }
] } } };
let browser, server;
before(async () => {
  server = await kontenServer({ users: [await konto('mia', 'student', C.mia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] })] }, { schule: SCHULE });
  browser = await browserStarten();
});
after(async () => { await browser?.close(); server?.close(); });

const ZEIT = /\b(fällig\w*|Rückstand|verpasst\w*|overdue|behind|im Verzug)\b/i;
const STREICHEN = ['So lesen Sie diese Seite', 'Was kann ich hier tun', 'Kurzanleitung', 'Quick guide', 'eigenen Speicher', 'own storage', 'in Vorbereitung', 'being prepared',
  'Neue Versionen lädt', 'loads new versions', 'kürzeres Passwort', 'shorter password', 'Face ID', 'Touch ID', 'veränderte Datei', 'changed file', 'mit Stufe 2', 'with stage 2',
  'Einzelheiten stehen im Elternbereich', 'die Eltern legen fest, welche Themen'];
const NUR_DATENSCHUTZ = ['Prüfwert', 'check value', 'zufälligen Kennung', 'random ID'];
const ID = (n) => server.konten.users.find((u) => u.user === n).id;

/** visible text of every grown-ups page and every ⓘ, in the current language */
async function allesSammeln(page) {
  const seiten = [], infos = [];
  const auf = () => page.evaluate(() => document.querySelectorAll('#aboutBody details').forEach((d) => { d.open = true; }));
  const infosLesen = async () => {
    for (const k of await page.locator('#aboutBody .info-btn').evaluateAll((b) => [...new Set(b.map((x) => x.dataset.help))])) {
      await page.locator(`#aboutBody .info-btn[data-help="${k}"]`).first().click();
      infos.push(await page.locator('#helpDlg').innerText());
      await page.locator('#helpClose').click();
    }
  };
  if (await page.$('#pBack')) await page.locator('#pBack').click();
  await auf(); seiten.push(await page.locator('#aboutBody').innerText()); await infosLesen();
  for (const f of await page.locator('[data-psubj]').evaluateAll((b) => b.map((x) => x.dataset.psubj))) {
    await page.locator(`.psubject[data-psubj="${f}"]`).click(); await page.waitForSelector('#pBack');
    await auf(); seiten.push(await page.locator('#aboutBody').innerText()); await infosLesen();
    await page.locator('#pBack').click(); await page.waitForSelector('#pBack', { state: 'detached' });
  }
  await page.locator('#pSettings').click(); await page.waitForSelector('#pSetBack');
  await auf();
  const datenschutz = await page.locator('#aboutBody details[data-about="privacy"]').innerText();
  seiten.push((await page.locator('#aboutBody').innerText()).replace(datenschutz, '')); await infosLesen();
  await page.locator('#pHelp').click(); await page.waitForSelector('#pHelpBack');
  seiten.push(await page.locator('#aboutBody').innerText());
  const hilfe = await page.locator('.phelp-view').innerText();
  await page.locator('#pHelpBack').click(); await page.waitForSelector('#pHelpBack', { state: 'detached' });
  return { seiten: seiten.join('\n'), infos, hilfe, datenschutz };
}

test('T5/T12/T17 final pass over all grown-ups texts (DE/EN); "what works" once; pressed ? readable', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
  await page.waitForSelector('#home:not([hidden])');
  const v = (skill, n, t) => Array.from({ length: n }, (_, i) => ({ day: tag(-t[i % t.length]), skill, level: 2, attempt: 1, ok: true, help: false }));
  const f = v('forces', 12, [1, 2, 3, 4]);
  await page.evaluate(([id, d]) => { for (const [k, x] of Object.entries(d)) localStorage.setItem('bq2_' + id + '__' + k, JSON.stringify(x)); }, [ID('mia'), { attempts: v('numbers', 6, [1, 2, 3]).concat(f), ev: { forces: f.map((x) => [x.day, 2, 1]) } }]);
  await page.locator('#adultBtn').click();
  await anmelden(page, 'adult', 'papa', C.papa); await passwortSetzen(page, 'Moon-Glass-Paper-8812');
  await page.waitForSelector('#parentClose');
  for (const lang of ['de', 'en']) {
    await page.locator(`.phdr [data-plang="${lang}"]`).click();
    const { seiten, infos, hilfe, datenschutz } = await allesSammeln(page);
    const alles = seiten + '\n' + infos.join('\n');
    assert.ok(infos.length >= 8, `${lang}: ⓘ texts collected (${infos.length})`);
    // T17
    const z = alles.match(ZEIT); assert.equal(z, null, `${lang}: time word: ${z && z[0]}`);
    assert.match(alles, lang === 'de' ? /noch \d+ Aufgaben? auf Klassenniveau richtig/ : /\d+ more grade-level tasks? right/, `${lang}: gap progress in tasks`);
    // T12
    for (const w of STREICHEN) assert.ok(!alles.includes(w), `${lang}: struck out: ${w}`);
    for (const w of NUR_DATENSCHUTZ) assert.ok(!alles.includes(w), `${lang}: only in privacy: ${w}`);
    assert.ok(NUR_DATENSCHUTZ.some((w) => datenschutz.includes(w)), `${lang}: … and there it is`);
    // T5: every place name with a symbol, quoted in help and ⓘ texts, exists on the pages
    const orte = [...(hilfe + '\n' + infos.join('\n')).matchAll(/[„“]((?:📖|⚙️|💡|🎯|🔐|💾|🤝|🏫|👧|🛠|ℹ️|📄)[^“”„]*?)(?:\s→[^“”]*)?[“”]/g)].map((m) => m[1].trim());
    assert.ok(orte.length >= 3, `${lang}: places found in help/ⓘ: ${orte.join(' | ')}`);
    for (const o of new Set(orte)) assert.ok(seiten.includes(o), `${lang}: place named in help/ⓘ exists: „${o}“`);
  }
  await page.locator('.phdr [data-plang="de"]').click();
  // "what works" once on the overview (E3/F6)
  assert.equal((await page.locator('#aboutBody').innerText()).split('Das gelingt').length - 1, 1, '"Das gelingt" once on the overview');
  // pressed ? readable: white on blue
  await page.locator('#pHelp').click(); await page.waitForSelector('#pHelpBack');
  const farbe = await page.evaluate(() => getComputedStyle(document.querySelector('#pHelp')).color);
  assert.equal(farbe, 'rgb(255, 255, 255)', 'the pressed ? is white');
  assert.deepEqual(fehler, []);
  await ctx.close();
});
