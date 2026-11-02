// Testbau (S12, D3): die App mit den Stufe-2-Modulen startet im echten Browser ohne Fehler, und das Modul
// krypto arbeitet dort genauso wie in Node (Web Crypto in Chromium; Safari folgt im Feldtest).
//   node --test tests/testbau.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen } from './app-hilfen.mjs';

let browser, server;
before(async () => {
  browser = await browserStarten();
  server = await appServer({ bauart: 'test', anpassen: (h) => h.replace(/\}\)\(\);\s*<\/script>/, 'window.__bqk={sealEntry,openEntryText,entryAad,newAreaKey,newPersonKeys,publicKeysOf,lockPersonKeys,unlockPersonKeys,createKeyring,rotateKeyring,keysForHolder,keyFingerprint};})();</script>') });
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
