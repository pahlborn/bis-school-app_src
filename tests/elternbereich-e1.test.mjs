// Paket E1 (Konzept Elternbereich 5.4, 5.11): einheitliche Quest-Karte mit drei Ebenen.
//  T16 (Aufbau): jede Quest hat Ebene 1 (Name, App-Stand), Ebene 2 (eine Zeile), Ebene 3 („💡 So helfen Sie“, „ⓘ Worauf beruht
//  das?“, Übungsblatt und Fokus-Schalter); „So helfen Sie“ nur mit den Teilen aus 5.11 in fester Reihenfolge;
//  kein „Was kann ich hier tun?“, Fokus in einem Satz mit ⓘ.
//   node --test tests/elternbereich-e1.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen, elternOeffnen } from './app-hilfen.mjs';

let browser, server;
before(async () => { server = await appServer(); browser = await browserStarten(); });
after(async () => { await browser?.close(); server?.close(); });

const TEILE = ['stuck', 'goal', 'trip', 'way', 'ask', 'home'];

test('T16 every quest card in every subject has the three levels; "How to help" has only the parts of 5.11 in their order', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await elternOeffnen(page);
  const faecher = await page.$$eval('[data-psubj]', (b) => [...new Set(b.map((x) => x.dataset.psubj))]);
  let karten = 0;
  for (const f of faecher) {
    await page.locator(`[data-psubj="${f}"]`).first().click(); await page.waitForSelector('#pBack');
    const t = await page.textContent('#aboutBody');
    assert.ok(!t.includes('Was kann ich hier tun?'), 'no self-explanation in ' + f);
    assert.match(await page.textContent('.pfmode'), /Automatisch: die App wählt\. Manuell: Sie wählen\./);
    assert.equal(await page.locator('.pfmode .info-btn[data-help="focusmode"]').count(), 1);
    const r = await page.$$eval('.pquest', (qs) => qs.map((q) => ({
      name: q.querySelector('.pqn')?.textContent || '',
      stand: !!q.querySelector('.phead .pqchips .pst'),
      zeile: q.querySelector('.pq2')?.textContent.trim() || '',
      hilfe: !!q.querySelector('details.phelpq, .phelp'),
      teile: [...q.querySelectorAll('details.phelpq .phpart')].map((p) => [...p.classList].find((c) => c !== 'phpart')),
      fuss: !!q.querySelector('details.phelpq .pfoot') || !q.querySelector('details.phelpq'),
      basis: !!q.querySelector('details.pbasis > summary'),
      blatt: !!q.querySelector('.pq3 [data-psheetq]'),
      fokus: !!q.querySelector('.pq3 [data-pfocus]')
    })));
    for (const q of r) {
      karten++;
      assert.ok(q.name && q.stand, 'level 1: ' + JSON.stringify(q));
      assert.match(q.zeile, /^(Noch nicht geübt|\d+ Aufgaben · \d+ selbst gelöst)/, 'level 2: ' + q.name);
      assert.ok(q.hilfe && q.basis && q.blatt && q.fokus, 'level 3: ' + JSON.stringify(q));
      assert.ok(q.fuss, 'source as a footer: ' + q.name);
      assert.ok(q.teile.every((x) => TEILE.includes(x)), 'only the parts of 5.11: ' + q.teile.join(','));
      assert.deepEqual(q.teile, TEILE.filter((x) => q.teile.includes(x)), 'fixed order: ' + q.name + ' ' + q.teile.join(','));
      if (q.teile.length) assert.ok(['goal', 'trip', 'home'].every((x) => q.teile.includes(x)), 'goal, stumbling block, ideas always: ' + q.name);
    }
    await page.locator('#pBack').click();
  }
  assert.ok(karten >= 15, 'all quest cards checked: ' + karten);
  // "ⓘ What is this based on?" opens a table
  await page.locator('[data-psubj="maths"]').first().click();
  const b = page.locator('.pquest').first().locator('details.pbasis');
  await b.locator('summary').click();
  assert.ok((await b.innerText()).includes('Worauf beruht das?'));
  assert.deepEqual(fehler, []);
  await ctx.close();
});
