// Aufgabe "Schule und Klasse" (Peter, 05.11.): Das Kind nennt Jahrgangsstufe (Pflicht), Klasse und Schule (freiwillig) -
// unter "My school" (Kinderseite, Englisch); die Eltern tragen es im Elternbereich ein oder aendern es (DE/EN); eine
// Lehrkraft sieht Klasse und Schule nur mit Freigabe. Neues Schuljahr: die Eltern werden einmal gefragt. Feste Texte nennen
// keine Schule, Klasse oder Lehrkraft - nur was die Familie eintraegt, erscheint. Echte Klicks, Live-Bau mit Konten.
// Abgleich im Testbau: tests/lehrkraft-schueler.test.mjs ("Schule und Klasse").
//   node --test tests/schule-klasse.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { browserStarten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen as kontenOeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';

const C = { mia: 'MIAA-2345', lia: 'LIAA-2345', papa: 'PAPA-2345', frau: 'FRAU-2345' };
const PW = { mia: 'Tiger-Lamp-River-4271', lia: 'Owl-Cake-Moon-1357', papa: 'Papa-Eltern-Test-1', frau: 'Lehrkraft-Test-22' };
const KONTEN = { users: [
  await konto('mia', 'student', C.mia), await konto('lia', 'student', C.lia),
  await konto('papa', 'parent', C.papa, { kinder: ['mia', 'lia'] }), await konto('frau', 'teacher', C.frau)
] };
let browser, server;
before(async () => { browser = await browserStarten(); server = await kontenServer(KONTEN); });
after(async () => { await browser?.close(); server?.close(); });

// fehlt ein Element, wird der Test nach 20 s rot statt endlos zu warten (Gegenproben)
async function oeffnen(...a) { const g = await kontenOeffnen(...a); g.page.setDefaultTimeout(20000); return g; }
const ID = (n) => server.konten.users.find((u) => u.user === n).id;
const pad = (n) => String(n).padStart(2, '0');
const heute = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const tag = (plus = 0) => new Date(Date.now() + plus * 864e5).toISOString().slice(0, 10);
// Schuljahr ab 1. August, hier unabhaengig von der App gerechnet
const schuljahr = (minus = 0) => { const [y, m] = heute().split('-').map(Number), s = (m >= 8 ? y : y - 1) - minus; return s + '/' + pad((s + 1) % 100); };
const lies = (page, kid, k) => page.evaluate(([id, key]) => JSON.parse(localStorage.getItem('bq2_' + id + '__' + key) || 'null'), [ID(kid), k]);
const setze = (page, kid, k, v) => page.evaluate(([id, key, val]) => localStorage.setItem('bq2_' + id + '__' + key, JSON.stringify(val)), [ID(kid), k, v]);
const imBild = (page, sel) => page.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth; });
const DEUTSCH = /Klasse|Schule|Jahrgang|Bitte|Später|Speichern/;

async function kindAnmelden(page, k, erstesMal) {
  await anmelden(page, 'student', k, erstesMal ? C[k] : PW[k]);
  if (erstesMal) await passwortSetzen(page, PW[k]);
  await page.waitForSelector('#home:not([hidden])');
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
async function einstellungen(page) {
  if (!(await page.$('#pSetBack'))) { await page.locator('#pSettings').click(); await page.waitForSelector('#pSetBack'); }
  const d = page.locator('details.psec[data-psec="settings"]');
  if (!(await d.evaluate((e) => e.open))) await d.locator('summary').first().click();
}
async function uebersicht(page) {
  if (await page.$('#pSetBack')) { await page.locator('#pSetBack').click(); await page.waitForSelector('#pSetBack', { state: 'detached' }); }
}
async function kindWaehlen(page, k) {
  if (await page.locator('#pKidSel').count()) { await page.locator('#pKidSel').selectOption(k); return; }
  assert.match(await page.textContent('#pKid'), new RegExp('\\(?' + k + '\\b'), 'nur ein Kind: ' + k);
}

test('Kind, erste Anmeldung: Startseite fragt nach der Jahrgangsstufe, "My school" auf Englisch, ohne Jahrgangsstufe nichts gespeichert, Klasse und Schule freiwillig', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server, { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  await kindAnmelden(page, 'mia', true);
  assert.ok(await page.locator('#schoolAsk').isVisible(), 'die Startseite fragt gleich nach dem Passwort');
  assert.equal((await page.locator('#schoolAsk').innerText()).trim().replace(/\s+/g, ' '), '🏫 Which grade are you in? My school');
  assert.ok(await page.locator('#todayBtn').isVisible(), 'nichts wartet darauf: ueben geht sofort');
  await page.locator('#schoolAskBtn').click();
  assert.ok(await page.locator('#schoolDlg').isVisible());
  for (const sel of ['#msGrades', '#msClass', '#msSchool', '#msClose', '#msSave']) assert.ok(await imBild(page, sel), sel + ' ganz im Bild (iPhone SE)');
  const klein = await page.$$eval('#schoolDlg button, #schoolDlg input', (b) => b.filter((x) => { const r = x.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).map((x) => x.id || x.textContent));
  assert.deepEqual(klein, [], 'Tippflaechen mindestens 44 px');
  assert.ok(await page.$eval('#schoolDlg', (d) => d.scrollWidth <= d.clientWidth), 'kein seitliches Scrollen');
  const text = await page.textContent('#schoolDlg');
  assert.ok(!DEUTSCH.test(text), 'Kinderseite Englisch: ' + text);
  assert.deepEqual(await page.$$eval('#msGrades button', (b) => b.map((x) => x.textContent)), ['1', '2', '3', '4', '5', '6']);
  // ohne Jahrgangsstufe: Hinweis, nichts gespeichert
  await page.fill('#msClass', 'Blue Owls');
  await page.locator('#msSave').click();
  assert.equal(await page.textContent('#msMessage'), 'Please choose your grade.');
  assert.ok(await page.locator('#schoolDlg').isVisible());
  assert.equal(await lies(page, 'mia', 'mySchool'), null);
  // "Later": zu, die Frage bleibt (Pflicht)
  await page.locator('#msClose').click();
  assert.equal(await page.locator('#schoolDlg').isVisible(), false);
  assert.ok(await page.locator('#schoolAsk').isVisible(), 'bleibt, bis die Jahrgangsstufe da ist');
  // mit Jahrgangsstufe; Klasse und Schule als reiner Text
  await page.locator('#schoolAskBtn').click();
  await page.locator('#msGrades button', { hasText: '3' }).click();
  assert.equal(await page.getAttribute('#msGrades button[data-grade="3"]', 'aria-pressed'), 'true');
  await page.fill('#msClass', ' Blue Owls '); await page.fill('#msSchool', 'Sunny <b>Hill</b> "School"');
  await page.locator('#msSave').click();
  assert.equal(await page.locator('#schoolDlg').isVisible(), false);
  assert.equal(await page.locator('#schoolAsk').isVisible(), false, 'Frage verschwunden');
  assert.ok(await page.locator('#savedNote').isVisible(), 'Saved ✓');
  assert.deepEqual(await lies(page, 'mia', 'mySchool'), { grade: 3, cls: 'Blue Owls', school: 'Sunny <b>Hill</b> "School"', year: schuljahr() });
  // nur Jahrgangsstufe: Klasse und Schule duerfen leer bleiben
  await page.locator('#profileBtn').click();
  await page.locator('#pfSchool').click();
  assert.ok(await page.locator('#schoolDlg').isVisible(), '"My school" auch ueber "My profile"');
  assert.deepEqual([await page.inputValue('#msClass'), await page.inputValue('#msSchool')], ['Blue Owls', 'Sunny <b>Hill</b> "School"'], 'vorbelegt, als Wert');
  await page.fill('#msClass', ''); await page.fill('#msSchool', '');
  await page.locator('#msGrades button[data-grade="4"]').click();
  await page.locator('#msSave').click();
  assert.deepEqual(await lies(page, 'mia', 'mySchool'), { grade: 4, year: schuljahr() });
  assert.ok(await page.locator('#profileDlg').isVisible(), '"My profile" bleibt offen, Eingetipptes bleibt');
  await page.locator('#pfClose').click();
  // nach dem Neuladen: keine Frage mehr
  await page.reload(); await page.waitForSelector('#home:not([hidden])');
  assert.equal(await page.locator('#schoolAsk').isVisible(), false);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('bestehendes Kind: beim naechsten Start einmal gefragt (bis zur Eintragung); ein anderes Kind sieht nichts davon', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await kindAnmelden(page, 'lia', true);
  await page.locator('#logoutBtn').click();
  await kindAnmelden(page, 'mia', true);
  await setze(page, 'mia', 'mySchool', { grade: 3, cls: 'Blue Owls', school: 'Sunny Hill', year: schuljahr() });
  await page.locator('#logoutBtn').click();
  // lia hatte schon Daten (aelterer Stand ohne Schule) - beim naechsten Start die Frage
  await setze(page, 'lia', 'total', 12);
  await kindAnmelden(page, 'lia', false);
  assert.ok(await page.locator('#schoolAsk').isVisible(), 'bestehendes Kind wird gefragt');
  assert.ok(!(await page.textContent('body')).includes('Blue Owls') && !(await page.textContent('body')).includes('Sunny Hill'), 'nichts von Mia');
  await page.locator('#schoolAskBtn').click();
  assert.equal(await page.inputValue('#msClass'), '', 'nicht vorbelegt mit Mias Angaben');
  assert.equal(await page.locator('#msGrades button[aria-pressed="true"]').count(), 0);
  await page.locator('#msGrades button[data-grade="3"]').click(); await page.locator('#msSave').click();
  assert.deepEqual(await lies(page, 'lia', 'mySchool'), { grade: 3, year: schuljahr() });
  assert.deepEqual(await lies(page, 'mia', 'mySchool'), { grade: 3, cls: 'Blue Owls', school: 'Sunny Hill', year: schuljahr() }, 'Mias Angaben unberuehrt');
  await page.locator('#logoutBtn').click();
  await kindAnmelden(page, 'lia', false);
  assert.equal(await page.locator('#schoolAsk').isVisible(), false, 'nur einmal');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Eltern: Schule und Klasse sehen, eintragen und aendern (DE und EN); Jahrgangsstufe Pflicht; andere Stufe -> Hinweis, dass es noch keine Aufgaben gibt; nur als Text', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  await kindAnmelden(page, 'mia', true);
  await erwachsen(page, 'papa');
  await kindWaehlen(page, 'mia');
  await einstellungen(page);
  const sek = page.locator('details.psec[data-psec="settings"]');
  assert.match(await sek.textContent(), /Schule und Klasse\s*Noch nicht eingetragen\./);
  await page.locator('.pschool-edit summary').click();
  await page.fill('#psClass', 'Blue Owls');
  await page.locator('#pSchoolForm button[type="submit"]').click();
  assert.equal(await page.textContent('#pSchoolMsg'), 'Bitte die Jahrgangsstufe wählen.');
  assert.equal(await lies(page, 'mia', 'mySchool'), null);
  await page.selectOption('#psGrade', '3'); await page.fill('#psClass', 'B <i>Owl</i>'); await page.fill('#psSchool', 'Sunny Hill');
  await page.locator('#pSchoolForm button[type="submit"]').click();
  assert.deepEqual(await lies(page, 'mia', 'mySchool'), { grade: 3, cls: 'B <i>Owl</i>', school: 'Sunny Hill', year: schuljahr() });
  await einstellungen(page);
  assert.equal((await page.textContent('#pSchoolLine')).trim(), `Jahrgangsstufe 3 · Klasse B <i>Owl</i> · Sunny Hill · Schuljahr ${schuljahr()}`);
  assert.equal(await page.locator('#pSchoolLine i').count(), 0, 'nie als HTML');
  assert.equal(await page.locator('.pgrade-note').count(), 0, 'Jahrgangsstufe 3: kein Hinweis');
  await page.locator('.pschool-edit summary').click();
  assert.deepEqual([await page.inputValue('#psGrade'), await page.inputValue('#psClass'), await page.inputValue('#psSchool')], ['3', 'B <i>Owl</i>', 'Sunny Hill']);
  // Jahrgangsstufe 4: Hinweis in den Einstellungen und auf der Uebersicht
  await page.selectOption('#psGrade', '4');
  await page.locator('#pSchoolForm button[type="submit"]').click();
  await einstellungen(page);
  const hinweis = 'Für Jahrgangsstufe 4 gibt es in Big Quest noch keine Aufgaben. Ihr Kind übt weiter mit den Aufgaben der Jahrgangsstufe 3.';
  assert.equal((await page.textContent('#aboutBody .pgrade-note')).trim(), hinweis);
  await uebersicht(page);
  assert.equal((await page.textContent('#aboutBody .pgrade-note')).trim(), hinweis, 'auch auf der Übersicht');
  // EN (amerikanisch)
  await page.locator('.phdr [data-plang="en"]').click();
  await page.waitForFunction(() => /Big Quest has no tasks/.test(document.querySelector('#aboutBody')?.textContent || ''));
  assert.equal((await page.textContent('#aboutBody .pgrade-note')).trim(), 'Big Quest has no tasks for grade 4 yet. Your child keeps practicing with the grade 3 tasks.');
  await einstellungen(page);
  assert.match(await sek.textContent(), /School and class/);
  assert.equal((await page.textContent('#pSchoolLine')).trim(), `Grade 4 · Class B <i>Owl</i> · Sunny Hill · school year ${schuljahr()}`);
  assert.match(await sek.textContent(), /A teacher sees the class and school only with your grant\./);
  await page.locator('.phdr [data-plang="de"]').click();
  await page.waitForFunction(() => /Schule und Klasse/.test(document.querySelector('#aboutBody')?.textContent || ''));
  // "Angaben löschen" entfernt auch Schule und Klasse (Profilangaben), Lerndaten bleiben
  await setze(page, 'mia', 'total', 7);
  await einstellungen(page);
  page.once('dialog', (d) => d.accept());
  await page.locator('#profileDelete').click();
  assert.equal(await lies(page, 'mia', 'mySchool'), null);
  assert.equal(await lies(page, 'mia', 'total'), 7);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

for (const [antwort, erwartet, knopf] of [['Ja', { grade: 4, school: 'Sunny Hill' }, 'Ja, Jahrgangsstufe 4'], ['Nein', { grade: 3, cls: 'Blue Owls', school: 'Sunny Hill' }, 'Nein, bleibt 3']]) {
  test(`neues Schuljahr: die Eltern werden einmal gefragt - "${antwort}"; das Kind und die Lehrkraft nicht`, async () => {
    const { ctx, page, fehler } = await oeffnen(browser, server);
    await kindAnmelden(page, 'mia', true);
    await setze(page, 'mia', 'mySchool', { grade: 3, cls: 'Blue Owls', school: 'Sunny Hill', year: schuljahr(1) });
    await page.reload(); await page.waitForSelector('#home:not([hidden])');
    assert.equal(await page.locator('#schoolAsk').isVisible(), false, 'das Kind wird nicht gefragt');
    assert.ok(!(await page.textContent('#home')).includes(schuljahr()), 'kein Schuljahr auf der Kinderseite');
    await erwachsen(page, 'papa');
    await kindWaehlen(page, 'mia');
    const frage = page.locator('#aboutBody .pyear-note');
    assert.equal(await frage.count(), 1, 'Frage zum neuen Schuljahr');
    assert.equal((await frage.textContent()).trim().replace(/\s+/g, ' '), `📅 Neues Schuljahr ${schuljahr()}: Ist Ihr Kind jetzt in Jahrgangsstufe 4? Ja, Jahrgangsstufe 4 Nein, bleibt 3`);
    await page.locator('.phdr [data-plang="en"]').click();
    await page.waitForFunction(() => /New school year/.test(document.querySelector('#aboutBody')?.textContent || ''));
    assert.equal((await frage.textContent()).trim().replace(/\s+/g, ' '), `📅 New school year ${schuljahr()}: Is your child in grade 4 now? Yes, grade 4 No, stays in 3`);
    await page.locator('.phdr [data-plang="de"]').click();
    await page.waitForFunction(() => /Neues Schuljahr/.test(document.querySelector('#aboutBody')?.textContent || ''));
    await page.locator('#aboutBody [data-pyear]', { hasText: knopf }).click();
    assert.deepEqual(await lies(page, 'mia', 'mySchool'), { ...erwartet, year: schuljahr() });
    assert.match((await frage.textContent()).trim(), antwort === 'Ja' ? /^✓ Gespeichert: Jahrgangsstufe 4\. Die neue Klasse können Sie unter ⚙ bei „Schule und Klasse“ eintragen\.$/ : /^✓ Gespeichert: Jahrgangsstufe 3\.$/);
    // die Frage kommt nicht wieder (auch nicht nach dem Neuladen)
    await page.reload(); await page.waitForSelector('#parentClose');
    await kindWaehlen(page, 'mia').catch(() => {});
    assert.equal(await page.locator('#aboutBody .pyear-note').count(), 0, 'nur einmal');
    assert.equal(await page.locator('#aboutBody .pgrade-note').count(), antwort === 'Ja' ? 1 : 0, 'Jahrgangsstufe 4: Hinweis, dass es noch keine Aufgaben gibt');
    // eine Lehrkraft mit Freigabe wird nie gefragt
    await setze(page, 'mia', 'mySchool', { grade: 3, cls: 'Blue Owls', school: 'Sunny Hill', year: schuljahr(1) });
    await setze(page, 'mia', 'grants', [{ id: 'g-frau', grantee: ID('frau'), scope: ['learning'], from: tag(), until: tag(13), by: ID('papa') }]);
    await erwachsen(page, 'frau');
    assert.equal(await page.locator('#aboutBody [data-pyear]').count(), 0, 'Lehrkraft: keine Frage');
    assert.equal(await page.locator('#pSchoolForm').count(), 0, 'Lehrkraft: kein Formular');
    assert.deepEqual(fehler, []);
    await ctx.close();
  });
}

test('Lehrkraft: Klasse und Schule nur mit Freigabe (Liste und Kopf, DE und EN); ohne Freigabe nichts', async () => {
  const { ctx, page, fehler } = await oeffnen(browser, server);
  for (const k of ['lia', 'mia']) { await kindAnmelden(page, k, true); await page.locator('#logoutBtn').click(); }
  await setze(page, 'mia', 'name', 'Mia'); await setze(page, 'mia', 'lastName', 'Sonnenschein');
  await setze(page, 'mia', 'mySchool', { grade: 3, cls: 'Blue Owls', school: 'Sunny Hill', year: schuljahr() });
  await setze(page, 'lia', 'name', 'Lia'); await setze(page, 'lia', 'mySchool', { grade: 3, cls: 'Red Foxes', school: 'Hill Top', year: schuljahr() });
  // ohne Freigabe: kein Kind, keine Angabe
  await erwachsen(page, 'frau');
  let t = await page.textContent('#app');
  for (const w of ['Blue Owls', 'Sunny Hill', 'Red Foxes', 'Hill Top', 'Sonnenschein']) assert.ok(!t.includes(w), 'ohne Freigabe: ' + w);
  // Freigabe nur fuer Mia
  await setze(page, 'mia', 'grants', [{ id: 'g-frau', grantee: ID('frau'), scope: ['learning'], from: tag(), until: tag(13), by: ID('papa') }]);
  await erwachsen(page, 'frau');
  assert.equal((await page.textContent('#pKid')).trim(), '👧 Mia Sonnenschein (mia) · Klasse Blue Owls · Sunny Hill');
  t = await page.textContent('#app');
  assert.ok(!t.includes('Red Foxes') && !t.includes('Hill Top'), 'Lia ohne Freigabe: nichts');
  await page.locator('.phdr [data-plang="en"]').click();
  await page.waitForFunction(() => /Class Blue Owls/.test(document.querySelector('#pKid')?.textContent || ''));
  assert.equal((await page.textContent('#pKid')).trim(), '👧 Mia Sonnenschein (mia) · Class Blue Owls · Sunny Hill');
  await page.locator('.phdr [data-plang="de"]').click();
  // nur die Schule eingetragen: nur sie
  await setze(page, 'mia', 'mySchool', { grade: 3, school: 'Sunny Hill', year: schuljahr() });
  await erwachsen(page, 'frau');
  assert.equal((await page.textContent('#pKid')).trim(), '👧 Mia Sonnenschein (mia) · Sunny Hill');
  // Freigabe abgelaufen: wieder nichts
  await setze(page, 'mia', 'grants', [{ id: 'g-frau', grantee: ID('frau'), scope: ['learning'], from: tag(-20), until: tag(-1), by: ID('papa') }]);
  await erwachsen(page, 'frau');
  assert.ok(!(await page.textContent('#app')).includes('Sunny Hill'), 'nach Ablauf nichts');
  // die Eltern sehen im Kopf weiter den Anmeldenamen (wie bisher), die Angaben unter ⚙
  await erwachsen(page, 'papa');
  assert.ok(!(await page.textContent('.phdr')).includes('Sunny Hill'));
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('feste Texte nennen keine Schule, Klasse oder Lehrkraft (nur Eingetragenes erscheint); Hilfe und Freigabe-Text nennen Klasse und Schule', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const teil = (von, bis) => { const a = html.indexOf(von); assert.ok(a >= 0, von); return html.slice(a, html.indexOf(bis, a)); };
  const fest = teil('<dialog id="schoolDlg"', '</dialog>') + teil('<div id="schoolAsk"', '</div>') + teil('function mySchoolAdminHTML', 'function bindMySchoolAdmin') + teil('function schoolYearLine', 'function answerSchoolYear') + teil('const gradeNoteText', 'function mySchoolAdminHTML');
  const verboten = fs.readFileSync(new URL('../werkzeug/verbotene-woerter.txt', import.meta.url), 'utf8').split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
  for (const w of verboten.concat(['3B', 'IB school'])) assert.ok(!fest.toLowerCase().includes(w.toLowerCase()), 'fester Text nennt: ' + w);
  assert.ok(!/placeholder=/.test(teil('<dialog id="schoolDlg"', '</dialog>')), 'keine Beispiel-Klasse als Platzhalter');
  assert.match(html, /\(und Jahrgangsstufe, Klasse und Schule, falls eingetragen\)/);
  assert.match(html, /\(and the grade, class and school, if entered\)/);
  assert.match(html, /<b>My school<\/b> is there too: your grade, class and school\./);
});
