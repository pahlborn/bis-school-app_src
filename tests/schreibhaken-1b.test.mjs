// Schreibhaken 3b-1b-1 (S12, Aufgabe 3b-1): Profil, Sprache des Kindes, Spannungsgrenze (storyCap), Tageshinweise
// (Begruessung, Raetsel, Geburtstagsfeier) und Checklisten schreiben im Testbau je ein Ereignis ("Letzte gilt").
// Mit echten Klicks; danach liefert derive(Ereignisse) fuer diese Werte genau das, was die App gespeichert hat.
//   node --test tests/schreibhaken-1b.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, zustand, klick, zurStart, elternOeffnen, elternSeite, alleKarten, karteOeffnen, frageBeantworten } from './app-hilfen.mjs';
import { konto, kontenServer, oeffnen, anmelden, passwortSetzen } from './konten-hilfen.mjs';
import { derive } from '../src/module/ableitung.mjs';

const WERTE = ['name', 'birthday', 'emoji', 'kidLang', 'storyCap', 'greetDay', 'mysteryDone', 'bdayParty', 'unlocked', 'focusMode', 'focusManual'];
const betroffen = (k) => WERTE.includes(k) || k.startsWith('chk_') || /^advent\d{4}$/.test(k);
function haken() { window.__bqh = { listEvents, probleme: () => ({ abgelehnt: eventSink ? eventSink.problems : null, fehler: eventErrors }) }; }
const mitHaken = (h) => h.replace(/\}\)\(\);\s*<\/script>/, () => `(${haken.toString()})();})();</script>`);

/* the stored values of one child namespace ('' = without accounts) and derive of its events */
async function vergleich(page, ns = '') {
  const app = await page.evaluate((p) => Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith(p)).map((k) => [k.slice(p.length), JSON.parse(localStorage.getItem(k))])), 'bq2_' + (ns ? ns + '__' : ''));
  const st = derive(app.events || [], { now: Date.parse('2027-01-01T00:00:00Z') });
  const keys = [...new Set([...Object.keys(app), ...Object.keys(st)])].filter(betroffen).sort();
  for (const k of keys) assert.deepEqual(st[k], app[k], 'Wert ' + k);
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
