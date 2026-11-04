// Schreibhaken 3b-1b-1 (S12, Aufgabe 3b-1): Profil, Sprache des Kindes, Spannungsgrenze (storyCap), Tageshinweise
// (Begruessung, Raetsel, Geburtstagsfeier) und Checklisten schreiben im Testbau je ein Ereignis ("Letzte gilt").
// Mit echten Klicks; danach liefert derive(Ereignisse) fuer diese Werte genau das, was die App gespeichert hat.
// Dazu 3b-1b-2 bis -4 (Listen, Luecken, Witze/Geschichten/Ton) und 3b-1c (Freigaben, Sicherung, Personen-Einstellungen).
//   node --test tests/schreibhaken-1b.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, zustand, klick, zurStart, elternOeffnen, elternSeite, alleKarten, karteOeffnen, frageBeantworten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';
import { derive } from '../src/module/ableitung.mjs';
import { bereichVonEreignis } from '../src/module/bereiche.mjs';

const WERTE = ['name', 'birthday', 'emoji', 'kidLang', 'storyCap', 'greetDay', 'mysteryDone', 'bdayParty', 'unlocked', 'focusMode', 'focusManual', 'gaps', 'jokeSeen', 'storyRead', 'muted', 'grants', 'grantlog', 'lastBackup'];
const betroffen = (k) => WERTE.includes(k) || k.startsWith('chk_') || /^advent\d{4}$/.test(k);
function haken() { window.__bqh = { listEvents, eventHook, jokesFor, themeNow, ohneKind: () => eventNoChild.slice(), ohnePerson: () => eventNoPerson.slice(), probleme: () => ({ abgelehnt: eventSink ? eventSink.problems.concat(personSink.problems) : null, fehler: eventErrors }) }; }
/* 3b-1c: what the app keeps on the device only and computes from "until" when reading (task 3b-2) - not in the events */
const ohneGeraetenotiz = (k, v) => (k === 'grants' && Array.isArray(v) ? v.map(({ expiredLogged, ...g }) => g) : k === 'grantlog' && Array.isArray(v) ? v.filter((e) => e.ev !== 'abgelaufen') : v);
const mitHaken = (h) => h.replace(/\}\)\(\);\s*<\/script>/, () => `(${haken.toString()})();})();</script>`);

/* the stored values of one child namespace ('' = without accounts) and derive of its events */
async function vergleich(page, ns = '') {
  const app = await page.evaluate((p) => Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith(p)).map((k) => [k.slice(p.length), JSON.parse(localStorage.getItem(k))])), 'bq2_' + (ns ? ns + '__' : ''));
  const st = derive(app.events || [], { now: Date.parse('2027-01-01T00:00:00Z') });
  const keys = [...new Set([...Object.keys(app), ...Object.keys(st)])].filter(betroffen).sort();
  for (const k of keys) assert.deepEqual(st[k], ohneGeraetenotiz(k, app[k]), 'Wert ' + k);
  assert.deepEqual(await page.evaluate(() => window.__bqh.probleme()), { abgelehnt: [], fehler: [] }, 'nichts abgelehnt, kein Fehler im Schreiber');
  return { app, keys, events: app.events || [] };
}
const arten = (events) => events.reduce((a, e) => { const k = e.type + (e.payload.field || e.payload.setting || e.payload.flag ? ':' + (e.payload.field || e.payload.setting || e.payload.flag) : ''); a[k] = (a[k] || 0) + 1; return a; }, {});

let browser, server;
before(async () => { browser = await browserStarten(); server = await appServer({ bauart: 'test', anpassen: mitHaken }); });
after(async () => { await browser?.close(); server?.close(); });

test('ohne Konten: Profil, Geburtstagsfeier, Checkliste, Raetsel, Spannungsgrenze und Profil loeschen -> derive = gespeicherter Stand', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url, { zeit: '2026-11-02T09:00:00' });

  // Profil: Name, Geburtstag heute (-> Geburtstagsfeier auf der Startseite), Emoji
  await page.locator('#profileBtn').click();
  await page.fill('#pfName', 'Alex');
  await page.selectOption('#pfDay', '02'); await page.selectOption('#pfMonth', '11');
  await page.locator('#pfEmojis button').nth(2).click();
  await page.locator('#pfSave').click();
  let r = await vergleich(page);
  assert.equal(r.app.name, 'Alex'); assert.equal(r.app.birthday, '11-02'); assert.equal(r.app.bdayParty, '2026-11-02');
  // der Name wird geaendert, der Geburtstag bleibt (kein zweites Ereignis dafuer)
  await page.locator('#profileBtn').click(); await page.fill('#pfName', 'Sam'); await page.locator('#pfSave').click();
  r = await vergleich(page);
  assert.equal(r.app.name, 'Sam');
  assert.equal(arten(r.events)['profile_set:birthday'], 1, 'unchanged values write nothing');

  // Checkliste: zwei Haken, einen zurueck, alles leeren, wieder einen
  await karteOeffnen(page, (await alleKarten(page)).find((k) => k.item === 'studio:read'));
  for (const i of [1, 3, 1]) await klick(page, `#checks .chk[data-i="${i}"]`);
  r = await vergleich(page);
  assert.deepEqual(r.app.chk_read.map(Boolean).indexOf(true), 3);
  await klick(page, '#chkReset');
  await klick(page, '#checks .chk[data-i="0"]');
  r = await vergleich(page);
  assert.ok(r.app.chk_read.length > 4 && r.app.chk_read[0] === true && r.app.chk_read.filter(Boolean).length === 1, JSON.stringify(r.app.chk_read));
  await zurStart(page);
  // leeren, obwohl nichts angehakt ist: die App speichert die leere Liste - das Ereignis auch
  const zweites = (await alleKarten(page)).find((k) => k.studio && k.item !== 'studio:read');
  await karteOeffnen(page, zweites); await klick(page, '#chkReset');
  r = await vergleich(page);
  assert.ok(Array.isArray(r.app['chk_' + zweites.item.slice(7)]), 'empty list stored');
  await zurStart(page);

  // eine Runde, danach das Raetsel des Tages
  await karteOeffnen(page, (await alleKarten(page)).find((k) => k.item === 'round'));
  const n = (await zustand(page)).round.length;
  for (let i = 0; i < n; i++) { const z = await zustand(page); await frageBeantworten(page, z.round[z.idx]); await klick(page, '#nextBtn'); }
  await klick(page, '#treat [data-treat="mystery"]');
  await klick(page, '#treatBody [data-m]');
  await zurStart(page);

  // Eltern: Spannungsgrenze, dann Name/Geburtstag/Emoji loeschen
  await elternOeffnen(page);
  await elternSeite(page, 'settings');
  await page.selectOption('#storyCap', '3');
  r = await vergleich(page);
  assert.equal(r.app.storyCap, 3); assert.equal(r.app.mysteryDone, '2026-11-02');
  page.once('dialog', (d) => d.accept());
  await page.locator('#profileDelete').click();
  await page.locator('#parentClose').click();
  r = await vergleich(page);
  for (const k of ['name', 'birthday', 'emoji']) assert.equal(k in r.app, false, k + ' deleted');

  const a = arten(r.events);
  for (const t of ['profile_set:name', 'profile_set:birthday', 'profile_set:emoji', 'day_flag:bdayParty', 'day_flag:mysteryDone', 'setting_set:storyCap', 'checklist_set']) assert.ok(a[t] > 0, 'reached: ' + t);
  assert.deepEqual([...new Set(r.events.filter((e) => e.author === 'p_eltern').map((e) => e.type + ':' + (e.payload.field || e.payload.setting)))].sort(), ['profile_set:birthday', 'profile_set:emoji', 'profile_set:name', 'setting_set:storyCap'], 'grown-up: only storyCap and the deletion');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('mit Konten: Begruessung am naechsten Tag und Sprache der Kinder-Anleitung -> Ereignisse des Kindes, derive = gespeicherter Stand', async () => {
  const C = { mia: 'MIAA-2345' }, PW = 'Tiger-Lamp-River-4271';
  const ks = await kontenServer({ users: [await konto('mia', 'student', C.mia), await konto('papa', 'parent', 'PAPA-2345', { kinder: ['mia'] })] }, { bauart: 'test', anpassen: mitHaken });
  try {
    const mia = ks.konten.users.find((u) => u.user === 'mia').id;
    const { ctx, page, fehler } = await oeffnen(browser, ks);
    await page.clock.setFixedTime(new Date('2026-11-02T09:00:00'));
    await page.reload(); await page.waitForSelector('#login:not([hidden])');
    await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, PW);
    await page.waitForSelector('#home:not([hidden])');
    let r = await vergleich(page, mia);
    assert.equal(r.app.greetDay, '2026-11-02', 'first day: the welcome counts as greeting');
    await page.locator('#guideBtn').click();                                         // the child's guide: kidLang
    await page.waitForSelector('#aboutBody');
    r = await vergleich(page, mia);
    assert.equal(r.app.kidLang, 'en');
    await page.clock.setFixedTime(new Date('2026-11-03T09:00:00'));
    await page.reload(); await page.waitForSelector('#home:not([hidden])');
    assert.equal(await page.locator('#greetDlg').evaluate((d) => d.open), true, 'greeting on the next day');
    await page.locator('#greetSkip').click();
    r = await vergleich(page, mia);
    assert.equal(r.app.greetDay, '2026-11-03');
    const a = arten(r.events);
    assert.ok(a['day_flag:greetDay'] >= 2 && a['profile_set:kidLang'] >= 1, JSON.stringify(a));
    assert.ok(r.events.every((e) => e.author === mia), 'all written by the child');
    // a parent switches the language of the grown-ups' area: that is parentLang (task 3b-1c), not the child's language
    await page.locator('#adultBtn').click();
    await anmelden(page, 'adult', 'papa', 'PAPA-2345'); await passwortSetzen(page, 'Papa-Eltern-Test-1');
    await page.waitForSelector('#parentClose');
    await page.locator('.phdr [data-plang="de"]').click();
    await page.locator('.phdr [data-plang="en"]').click();
    r = await vergleich(page, mia);
    assert.equal(r.app.kidLang, 'en');
    assert.equal(r.events.filter((e) => e.payload.field === 'kidLang').every((e) => e.author === mia), true, 'kidLang only from the child');
    assert.deepEqual(fehler, []);
    await ctx.close();
  } finally { ks.close(); }
});

test('3b-1b-2 Listen: Advent-Tuerchen (Kind), Freischalten und Fokus je Quest, Fokus automatisch/manuell (Eltern) -> derive = gespeicherter Stand', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url, { zeit: '2026-12-05T09:00:00' });
  // Advent: two doors, one opened twice (the second time only shows the treat)
  for (const d of [3, 1, 3]) {
    await page.locator(`#advent .door[data-door="${d}"]`).click();
    if (await page.locator('#doorBody button[data-a]').count()) await page.locator('#doorBody button[data-a]').first().click();
  }
  let r = await vergleich(page);
  assert.deepEqual(r.app.advent2026, [3, 1]);
  // grown-ups: unlock a preview quest, switch its focus on and off, automatic, manual, lock it again
  await elternOeffnen(page);
  await page.locator('[data-psubj="maths"]').click();
  await page.locator('.ppreview [data-punlock="fractions"]').click();
  const zweite = (await page.locator('.ppreview [data-punlock]').evaluateAll((b) => b.map((x) => x.dataset.punlock))).find((k) => k !== 'fractions');
  await page.locator(`.ppreview [data-punlock="${zweite}"]`).click();
  r = await vergleich(page);
  assert.ok(r.app.unlocked.includes('fractions'));
  await page.locator('[data-pfocus="fractions"]').click();                       // automatic -> manual with the automatic list +- fractions
  r = await vergleich(page);
  assert.equal(r.app.focusMode, 'manual'); assert.ok(Array.isArray(r.app.focusManual));
  await page.locator('[data-pfocus="fractions"]').click();
  r = await vergleich(page);
  await page.locator('[data-fmode="auto"]').click();
  r = await vergleich(page);
  assert.equal('focusMode' in r.app, false); assert.equal('focusManual' in r.app, false);
  await page.locator('[data-fmode="manual"]').click();
  await page.locator('.ppreview [data-punlock="fractions"]').click();              // lock again
  r = await vergleich(page);
  assert.equal(r.app.unlocked.includes('fractions'), false);
  assert.equal(r.app.focusMode, 'manual');
  const wer = (t) => [...new Set(r.events.filter((e) => e.type === t).map((e) => e.author))];
  assert.deepEqual(wer('advent_open'), ['p_kind']);
  assert.deepEqual(wer('list_set'), ['p_eltern']);
  assert.ok(r.events.filter((e) => e.type === 'list_set').length >= 4, 'list events were written');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('3b-1b-2 listEvents: aus jeder alten Liste wird durch die Ereignisse genau die neue (500 Zufallsfaelle, auch umsortiert); sonst nur die Aenderungen', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  const r = await page.evaluate(() => {
    let a = 7; const next = () => { a = (a * 1103515245 + 12345) % 2147483648; return a / 2147483648; };
    const pool = ['a', 'b', 'c', 'd', 'e', 'f'], pickList = () => pool.filter(() => next() < 0.5).sort(() => next() - 0.5);
    const replay = (old, evs) => evs.reduce((l, p) => (p.on ? (l.includes(p.item) ? l : l.concat([p.item])) : l.filter((x) => x !== p.item)), old.slice());
    const falsch = [];
    for (let i = 0; i < 500; i++) {
      const o = pickList(), n = pickList(), evs = window.__bqh.listEvents('unlocked', o, n);
      if (JSON.stringify(replay(o, evs)) !== JSON.stringify(n) || evs.some((p) => p.list !== 'unlocked')) falsch.push([o, n]);
    }
    const L = window.__bqh.listEvents;
    return { falsch, anhaengen: L('unlocked', ['a', 'b'], ['a', 'b', 'c']), entfernen: L('unlocked', ['a', 'b', 'c'], ['a', 'c']), gleich: L('unlocked', ['a'], ['a']), umsortiert: L('unlocked', ['a', 'b'], ['b', 'a']).length };
  });
  assert.deepEqual(r.falsch, []);
  assert.deepEqual(r.anhaengen, [{ list: 'unlocked', item: 'c', on: true }], 'only the new entry');
  assert.deepEqual(r.entfernen, [{ list: 'unlocked', item: 'b', on: false }], 'only the removed entry');
  assert.deepEqual(r.gleich, [], 'unchanged: nothing');
  assert.equal(r.umsortiert, 4, 'new order: all off, all on');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

/* ---------- 3b-1b-3: gaps (school data invented, as in elternbereich-d4) ---------- */
const tagIn = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const txt = (de, en) => ({ de, en });
const SCHULE = { version: 1, kinder: { mia: { asOf: tagIn(-1), tasks: [
  { day: tagIn(-40), area: 'math', title: 'Check A', std: { 'M-N2': 'C' }, quests: ['detective'], focusNext: [], good: txt('a', 'a'), next: txt('', '') },
  { day: tagIn(-20), area: 'math', title: 'Check B', std: { 'M-N1': 'RS' }, quests: ['numbers'], focusNext: [], good: txt('b', 'b'), next: txt('', '') },
  { day: tagIn(-5), area: 'science', title: 'Forces', std: { 'S-F1': 'M' }, quests: ['forces'], focusNext: ['forces'], good: txt('c', 'c'), next: txt('Begruenden.', 'Explain.') },
] } } };
const uebung = (skill, n, tage) => { const a = Array.from({ length: n }, (_, i) => ({ day: tagIn(-tage[i % tage.length]), skill, level: 2, attempt: 1, ok: true, help: false })); return { attempts: a, ev: { [skill]: a.map((x) => [x.day, x.level, 1]) } }; };

test('3b-1b-3 Luecken: Eltern waehlen, schliessen, halten; die App schliesst (Eltern- und Kindergeraet) -> derive = gespeicherte gaps', async () => {
  const C = { mia: 'ABCD-EFGH', papa: 'PAPA-2345' };
  const ks = await kontenServer({ users: [await konto('mia', 'student', C.mia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] })] }, { bauart: 'test', anpassen: mitHaken, schule: SCHULE });
  try {
    const mia = ks.konten.users.find((u) => u.user === 'mia').id, papa = ks.konten.users.find((u) => u.user === 'papa').id;
    const setze = (page, d) => page.evaluate(([id, daten]) => { for (const [k, v] of Object.entries(daten)) localStorage.setItem('bq2_' + id + '__' + k, JSON.stringify(v)); }, [mia, d]);
    async function mathe(page) {
      if (await page.$('#pBack')) await page.locator('#pBack').click();
      await page.locator('.phdr [data-plang="en"]').click(); await page.locator('.phdr [data-plang="de"]').click();   // render again
      await page.locator('[data-psubj="maths"]').click(); await page.waitForSelector('#pSchool');
    }
    const { ctx, page, fehler } = await oeffnen(browser, ks);
    await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, 'Tiger-Lamp-River-4271');
    await page.waitForSelector('#home:not([hidden])');
    await setze(page, uebung('numbers', 12, [1, 2, 3, 4]));
    await page.locator('#adultBtn').click();
    await anmelden(page, 'adult', 'papa', C.papa); await passwortSetzen(page, 'Moon-Glass-Paper-8812');
    await page.waitForSelector('#parentClose');
    await mathe(page);
    await page.locator('[data-gapact="go"][data-gapstd="M-N2"]').click();
    await page.waitForSelector('[data-gapact="go"][data-gapstd="M-N1"]');
    let r = await vergleich(page, mia);
    assert.equal(r.app.gaps.active, 'M-N2');
    // the start page behind the login stores bq2_rankSeen outside any child's area: no event, noted (not refused)
    assert.deepEqual([...new Set(await page.evaluate(() => window.__bqh.ohneKind()))], ['rank_seen']);
    await page.locator('[data-gapact="close"][data-gapstd="M-N2"]').click();
    await page.waitForFunction(() => /von Ihnen geschlossen/.test(document.querySelector('#pSchool .pgaps')?.innerText || ''));
    r = await vergleich(page, mia);
    assert.equal(r.app.gaps.closed['M-N2'].by, 'parents');
    await setze(page, uebung('numbers', 24, [1, 3, 5, 8, 12, 16]));                  // confirmed secure: the app closes M-N1
    await mathe(page);
    r = await vergleich(page, mia);
    assert.equal(r.app.gaps.closed['M-N1'].by, 'app');
    await page.locator('[data-gapact="hold"][data-gapstd="M-N1"]').click();
    await page.waitForFunction(() => /von Ihnen offen gehalten/.test(document.querySelector('#pSchool .pgaps')?.innerText || ''));
    await mathe(page);                                                                // held: the app does not close it again
    r = await vergleich(page, mia);
    assert.ok(r.app.gaps.hold['M-N1'] && !r.app.gaps.closed['M-N1']);
    await page.locator('[data-gapact="close"][data-gapstd="M-N1"]').click();
    await page.waitForFunction(() => /Stellenwert[^\n]*von Ihnen geschlossen/.test(document.querySelector('#pSchool .pgaps')?.innerText || ''));
    r = await vergleich(page, mia);
    const art = (e) => e.type + ':' + (e.payload.state || '') + ':' + (e.payload.by || '');
    assert.deepEqual(r.events.filter((e) => e.type.startsWith('gap')).map(art), ['gap_active::', 'gap_state:closed:parents', 'gap_state:closed:app', 'gap_state:hold:parents', 'gap_state:closed:parents']);
    assert.ok(r.events.filter((e) => e.type.startsWith('gap')).every((e) => e.author === papa), 'all by the parent (also the automatic close on his device)');
    assert.deepEqual(fehler, []);
    await ctx.close();

    // the child's device closes a gap by itself (as the child): accepted, derive = stored
    const k = await oeffnen(browser, ks);
    await anmelden(k.page, 'student', 'mia', C.mia); await passwortSetzen(k.page, 'Tiger-Lamp-River-4271');
    await k.page.waitForSelector('#home:not([hidden])');
    await setze(k.page, uebung('numbers', 24, [1, 3, 5, 8, 12, 16]));
    await k.page.reload(); await k.page.waitForSelector('#home:not([hidden])');
    r = await vergleich(k.page, mia);
    assert.equal(r.app.gaps.closed['M-N1'].by, 'app');
    assert.deepEqual(r.events.filter((e) => e.type.startsWith('gap')).map((e) => [e.type, e.payload.state, e.payload.by, e.author]), [['gap_state', 'closed', 'app', mia]]);
    assert.deepEqual(k.fehler, []);
    await k.ctx.close();
  } finally { ks.close(); }
});

test('3b-1b-4 Witze, Geschichten, Ton: drei Runden mit Witz und Geschichte, Ton aus und an -> derive = gespeicherter Stand', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url, { zeit: '2026-11-10T09:00:00' });
  // earlier: every English joke of this moment was shown (stored AND written through the app's hook) - so the first
  // joke now starts the round again and the event has to say what the app forgets
  const vorher = await page.evaluate(() => { const ids = window.__bqh.jokesFor('en', window.__bqh.themeNow()).map((j) => j.id); localStorage.setItem('bq2_jokeSeen', JSON.stringify(ids)); ids.forEach((id) => window.__bqh.eventHook('joke_seen', { joke: id })); return ids.length; });
  assert.ok(vorher > 5, 'jokes of this moment: ' + vorher);
  for (let runde = 0; runde < 3; runde++) {
    await karteOeffnen(page, (await alleKarten(page)).find((k) => k.item === 'round'));
    const n = (await zustand(page)).round.length;
    for (let i = 0; i < n; i++) { const z = await zustand(page); await frageBeantworten(page, z.round[z.idx]); await klick(page, '#nextBtn'); }
    await klick(page, '#treat [data-treat="joke"]');
    await klick(page, '#treat [data-treat="joke"]');                                 // the same joke again: no second event
    await klick(page, '#treat [data-treat="story"]');
    await klick(page, '#treatBody [data-story][data-l="1"]');
    await zurStart(page);
  }
  await page.locator('#soundBtn').click(); await page.locator('#soundBtn').click(); await page.locator('#soundBtn').click();
  const r = await vergleich(page);
  assert.equal(r.app.jokeSeen.length, 3, 'one joke per round');
  assert.equal(r.app.storyRead.length, 3, 'one story per round');
  assert.equal(r.app.muted, true);
  const a = arten(r.events);
  assert.deepEqual([a.joke_seen - vorher, a.story_read, a['profile_set:muted']], [3, 3, 3]);
  assert.ok(r.events.some((e) => e.type === 'joke_seen' && e.payload.forget && e.payload.forget.length === vorher - 1), 'the restart was written with forget (all of the moment except the new joke)');
  assert.deepEqual(fehler, []);
  await ctx.close();
});

/* ---------- 3b-1c: grants, backup, the settings of a person ---------- */
const personenLog = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('bq2_personEvents') || '{}'));
const geraetWert = (page, k) => page.evaluate((key) => JSON.parse(localStorage.getItem('bq2_' + key) || 'null'), k);
const JETZT = Date.parse('2027-01-01T00:00:00Z');

test('3b-1c mit Konten: Freigaben (erteilen, ersetzen, beenden, angesehen), Sicherung, Sprache, "So funktioniert", Blick -> derive = gespeicherter Stand', async () => {
  const C = { mia: 'MIAA-2345', papa: 'PAPA-2345', frau: 'FRAU-2345' }, PW = { mia: 'Tiger-Lamp-River-4271', papa: 'Papa-Eltern-Test-1', frau: 'Lehrkraft-Test-22' };
  const ks = await kontenServer({ users: [await konto('mia', 'student', C.mia), await konto('papa', 'parent', C.papa, { kinder: ['mia'] }), await konto('frau', 'teacher', C.frau)] }, { bauart: 'test', anpassen: mitHaken });
  try {
    const ID = (n) => ks.konten.users.find((u) => u.user === n).id, mia = ID('mia'), papa = ID('papa'), frau = ID('frau');
    const { ctx, page, fehler } = await oeffnen(browser, ks, { acceptDownloads: true });
    await anmelden(page, 'student', 'mia', C.mia); await passwortSetzen(page, PW.mia);
    await page.waitForSelector('#home:not([hidden])');
    async function erwachsen(wer) {                                                   // as in tests/stufe1-p4.test.mjs
      if (await page.locator('#parentClose').count()) { await page.locator('#parentClose').click(); await page.waitForSelector('#home:not([hidden]), #login:not([hidden])'); }
      if (await page.locator('#adultBtn').isVisible().catch(() => false)) await page.locator('#adultBtn').click();
      else if (await page.locator('#roleAdult').count()) await page.locator('#roleAdult').click();
      await page.locator('#loginUser').fill(wer);
      const ersterMal = !(await page.evaluate((id) => localStorage.getItem('bq2_pw_' + id), ID(wer)));
      await page.locator('#loginPw').fill(ersterMal ? C[wer] : PW[wer]); await page.locator('#loginGo').click();
      if (ersterMal) { await page.waitForSelector('#setPwForm'); await page.locator('#newPw1').fill(PW[wer]); await page.locator('#newPw2').fill(PW[wer]); await page.locator('#setPwGo').click(); await page.locator('#welcomeGo').click(); }
      await page.waitForSelector('#parentClose');
    }
    async function kapitel(id) {                                                      // grants and backup are in the settings
      if (!(await page.$('#pSetBack'))) { await page.locator('#pSettings').click(); await page.waitForSelector('#pSetBack'); }
      const d = page.locator(`details.psec[data-psec="${id}"]`);
      if (!(await d.evaluate((e) => e.open))) await d.locator('summary').first().click();
    }
    // papa: the overview (glance), the language of the grown-ups' area, "How Big Quest works"
    await erwachsen('papa');
    await page.locator('.phdr [data-plang="en"]').click(); await page.locator('.phdr [data-plang="de"]').click();
    await page.locator('details.psec[data-psec="concept"] > summary').click();
    // grant to the teacher, she looks, a new grant with school ratings replaces it, then papa ends it
    await kapitel('grants');
    await page.locator('#pGrantWho').fill('frau'); await page.locator('#pGrantDays').fill('10');
    await page.locator('#pGrantForm button[type="submit"]').click();
    await page.waitForSelector('[data-grantrevoke]');
    await erwachsen('frau');
    assert.match(await page.textContent('#pKid'), /mia/);
    await page.reload(); await page.waitForSelector('#parentClose');                    // viewed again the same day: logged once
    await erwachsen('papa');
    await kapitel('grants');
    await page.locator('#pGrantWho').fill('frau'); await page.locator('#pGrantSchool').check();
    await page.locator('#pGrantForm button[type="submit"]').click();
    await page.waitForFunction(() => document.querySelectorAll('.pgrants li').length === 2);
    await page.locator('[data-grantrevoke]').click();
    await page.waitForFunction(() => !document.querySelector('[data-grantrevoke]'));
    // backup
    await kapitel('backup');
    await Promise.all([page.waitForEvent('download'), page.locator('details.psec[data-psec="backup"] [data-backup]').first().click()]);
    await page.waitForFunction((id) => localStorage.getItem('bq2_' + id + '__lastBackup') !== null, mia);

    // the child's log: grants, their log and the backup (derive = stored, without the device notes)
    const r = await vergleich(page, mia);
    assert.equal(r.app.grants.length, 2); assert.ok(r.app.grants.every((g) => g.revokedAt), 'both ended');
    assert.deepEqual(r.app.grantlog.map((e) => e.ev), ['erteilt', 'geöffnet', 'widerrufen', 'erteilt', 'widerrufen']);
    assert.ok(r.app.lastBackup);
    const wer = (t) => r.events.filter((e) => e.type === t).map((e) => e.author);
    assert.deepEqual([wer('grant_set'), wer('grant_revoked'), wer('grant_opened'), wer('backup_made')], [[papa, papa], [papa, papa], [frau], [papa]]);
    assert.ok(r.events.every((e) => bereichVonEreignis(e) !== 'person'), 'no person setting in the child\'s log');
    // the log of each person: language, "How it works", glance of the parent; the teacher keeps no glance
    const pe = await personenLog(page), glance = await geraetWert(page, 'glance');
    const arten2 = (l) => (l || []).map((e) => e.type + (e.payload.field ? ':' + e.payload.field : ''));
    assert.deepEqual(Object.keys(pe).sort(), [papa, frau].sort(), JSON.stringify(Object.fromEntries(Object.entries(pe).map(([k, v]) => [k === papa ? 'papa' : k === frau ? 'frau' : k, arten2(v)]))));
    for (const p of [papa, frau]) assert.ok(pe[p].every((e) => e.author === p && bereichVonEreignis(e) === 'person'), 'each person writes into its own log');
    // the teacher: the chapter "How it works" was still open from papa's visit (state.popen) - so it counts as seen for her
    // as well (as the app stores it); no glance of the child in her area
    assert.deepEqual(arten2(pe[frau]), ['person_set:conceptSeen']);
    assert.equal(derive(pe[frau], { now: JETZT }).conceptSeen, (await geraetWert(page, 'conceptSeen'))[frau]);
    const st = derive(pe[papa], { now: JETZT });
    assert.equal(st.parentLang, await geraetWert(page, 'parentLang'));
    assert.equal(st.parentLang, 'de');
    assert.equal(st.conceptSeen, (await geraetWert(page, 'conceptSeen'))[papa]);
    assert.deepEqual(st.glance, { [mia]: glance[papa + '|' + mia] });
    assert.ok(glance[frau + '|' + mia], 'the teacher\'s glance stays on the device');
    assert.ok(pe[papa].filter((e) => e.type === 'glance_set').length >= 2, 'one glance per visit');
    assert.deepEqual(await page.evaluate(() => window.__bqh.ohnePerson()), []);
    // safety: a grant event meant for another child than the one the store shows is not written, but reported
    const vorher = (await vergleich(page, mia)).events.length;
    assert.equal(await page.evaluate(() => window.__bqh.eventHook('backup_made', { day: '2026-11-04' }, 'p_ANDERESKIND')), null);
    assert.deepEqual(await page.evaluate(() => window.__bqh.probleme().fehler), ['backup_made: anderes Kind']);
    assert.equal((await geraetWert(page, mia + '__events')).length, vorher);
    assert.deepEqual(fehler, []);
    await ctx.close();
  } finally { ks.close(); }
});

test('3b-1c ohne Konten: Sprache, "So funktioniert", Blick der Eltern -> Protokoll p_eltern, derive = gespeicherter Stand', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url, { zeit: '2026-11-04T09:00:00' });
  await elternOeffnen(page);
  await page.locator('.phdr [data-plang="en"]').click();
  await page.locator('details.psec[data-psec="concept"] > summary').click();
  await page.locator('#parentClose').click();
  await elternOeffnen(page);                                                         // a second visit: a new glance
  const r = await vergleich(page);
  assert.ok(r.events.every((e) => bereichVonEreignis(e) !== 'person'), 'no person setting in the child\'s log');
  const pe = await personenLog(page);
  assert.deepEqual(Object.keys(pe), ['p_eltern']);
  const st = derive(pe.p_eltern, { now: JETZT }), glance = await geraetWert(page, 'glance');
  assert.deepEqual([st.parentLang, st.conceptSeen], [await geraetWert(page, 'parentLang'), (await geraetWert(page, 'conceptSeen')).pin]);
  assert.equal(st.parentLang, 'en');
  assert.deepEqual(st.glance, { p_kind: glance['parent|kid'] });
  assert.equal(pe.p_eltern.filter((e) => e.type === 'glance_set').length, 2);
  assert.deepEqual(fehler, []);
  await ctx.close();
});