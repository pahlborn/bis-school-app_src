// Testbau (S12, D3): die App mit den Stufe-2-Modulen startet im echten Browser ohne Fehler, und das Modul
// krypto und ereignisse arbeiten dort genauso wie in Node (Web Crypto, Datum und Zeitformate in Chromium; Safari folgt im Feldtest).
//   node --test tests/testbau.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen } from './app-hilfen.mjs';

let browser, server;
before(async () => {
  browser = await browserStarten();
  server = await appServer({ bauart: 'test', anpassen: (h) => h.replace(/\}\)\(\);\s*<\/script>/, 'window.__bqk={sealEntry,openEntryText,entryAad,newAreaKey,newPersonKeys,publicKeysOf,lockPersonKeys,unlockPersonKeys,createKeyring,rotateKeyring,keysForHolder,keyFingerprint};window.__bqe={newEvent,checkEvent,effectiveTime,mergeLog,fieldKey,lastWins};})();</script>') });
});
after(async () => { await browser?.close(); server?.close(); });

test('Testbau startet ohne Fehler; Verschluesseln, Sperren, Verpacken und Schluesselwechsel laufen im Browser', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  const r = await page.evaluate(async () => {
    const K = window.__bqk, person = async (id) => { const keys = await K.newPersonKeys(); return { id, keys, pub: await K.publicKeysOf(keys) }; };
    const peter = await person('p_e1'), frau = await person('p_l1');
    const locked = await K.lockPersonKeys(peter.keys, 'p_e1', ['Tiger-Lamp-River-4271'], { rounds: 1000 });
    let falsch = ''; try { await K.unlockPersonKeys(locked, 'p_e1', 'falsch'); } catch (e) { falsch = e.message; }
    const offen = await K.unlockPersonKeys(locked, 'p_e1', 'Tiger-Lamp-River-4271');
    let { ring, key } = await K.createKeyring('kid:p_k1', [peter, frau]);
    const alt = await K.sealEntry(key, 'old', K.entryAad('kid:p_k1', 1, 'e_1'));
    ({ ring, key } = await K.rotateKeyring(ring, [peter]));
    const neu = await K.sealEntry(key, 'new', K.entryAad('kid:p_k1', 2, 'e_2'));
    const kp = await K.keysForHolder(ring, offen, 'p_e1'), kf = await K.keysForHolder(ring, frau.keys, 'p_l1');
    return { aktuell: ring.current, falsch, peterNeu: await K.openEntryText(kp.get(2), neu, K.entryAad('kid:p_k1', 2, 'e_2')), frauAlt: await K.openEntryText(kf.get(1), alt, K.entryAad('kid:p_k1', 1, 'e_1')), frauVersionen: [...kf.keys()], fp: await K.keyFingerprint(peter.pub) };
  });
  assert.equal(r.aktuell, 2, 'nach dem Schluesselwechsel ist Version 2 die aktuelle');
  assert.equal(r.falsch, 'Anmeldung fehlgeschlagen');
  assert.equal(r.peterNeu, 'new');
  assert.equal(r.frauAlt, 'old');
  assert.deepEqual(r.frauVersionen, [1]);
  assert.match(r.fp, /^[a-z]+(-[a-z]+){5}$/);
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Testbau: Ereignisse (Format, Zusammenfuehren, "Letzte gilt", Uhrenregel) liefern im Browser dasselbe wie in Node', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  const r = await page.evaluate(() => {
    const E = window.__bqe, tag = '2026-11-02', jetzt = Date.UTC(2026, 10, 3, 12, 0, 0);
    const at = (min) => new Date(Date.UTC(2026, 10, 2, 10, min, 0)).toISOString().replace('.000Z', 'Z');
    const mk = (dev, i, min) => E.newEvent({ type: 'answer', author: 'p_k1', device: dev, at: at(min), payload: { day: tag, skill: 'round', level: 2, attempt: 1, ok: true, qid: dev + i } });
    const A = Array.from({ length: 50 }, (_, i) => mk('d_a1', i, i)), B = Array.from({ length: 50 }, (_, i) => mk('d_b1', i, i));
    const ab = E.mergeLog([A, B], jetzt), ba = E.mergeLog([B, A], jetzt), nochmal = E.mergeLog([ab.events, A, B, ab.events], jetzt);
    const name = (v, dev) => E.newEvent({ type: 'profile_set', author: 'p_k1', device: dev, at: at(5), payload: { field: 'name', value: v } });
    return {
      gesamt: ab.events.length, ids: new Set(ab.events.map((e) => e.id)).size, gleich: JSON.stringify(ab.events) === JSON.stringify(ba.events), nochmal: nochmal.events.length,
      fehler: [...A, ...B].flatMap(E.checkEvent).length, konflikte: ab.conflicts.length + ab.invalid.length,
      gewinner: E.lastWins([name('Anna', 'd_a1'), name('Berta', 'd_b1')], jetzt)['profile_set:name'].payload.value,
      voraus3: E.effectiveTime('2026-11-06T12:00:00Z', jetzt) === jetzt, voraus23: E.effectiveTime('2026-11-04T11:00:00Z', jetzt) === Date.UTC(2026, 10, 4, 11, 0, 0),
      zeitzone: E.checkEvent({ ...A[0], at: '2026-11-02T10:00:00+01:00' }).length > 0, februar30: E.checkEvent({ ...A[0], at: '2026-02-30T10:00:00Z' }).length > 0,
    };
  });
  assert.deepEqual(r, { gesamt: 100, ids: 100, gleich: true, nochmal: 100, fehler: 0, konflikte: 0, gewinner: 'Berta', voraus3: true, voraus23: true, zeitzone: true, februar30: true });
  assert.deepEqual(fehler, []);
  await ctx.close();
});
