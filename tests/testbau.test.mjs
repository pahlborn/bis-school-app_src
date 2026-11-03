// Testbau (S12, D3): die App mit den Stufe-2-Modulen startet im echten Browser ohne Fehler, und das Modul
// krypto, ereignisse, schnappschuss und bereiche arbeiten dort genauso wie in Node (Web Crypto, Datum und Zeitformate in Chromium; Safari folgt im Feldtest).
//   node --test tests/testbau.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen } from './app-hilfen.mjs';

let browser, server;
before(async () => {
  browser = await browserStarten();
  server = await appServer({ bauart: 'test', anpassen: (h) => h.replace(/\}\)\(\);\s*<\/script>/, 'window.__bqk={sealEntry,openEntryText,entryAad,newAreaKey,newPersonKeys,publicKeysOf,lockPersonKeys,unlockPersonKeys,createKeyring,rotateKeyring,keysForHolder,keyFingerprint};window.__bqe={newEvent,checkEvent,effectiveTime,mergeLog,fieldKey,lastWins};window.__bqs={makeSnapshot,stateFrom,needsSnapshot,derive};window.__bqb={halter,schluesselVerteilen,schluesselLesen,passtZumBereich,lokalerSpeicher,signEvent,acceptEvent};})();</script>') });
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

test('Testbau: Schnappschuss (Pruefsumme mit Web Crypto) liefert im Browser denselben Stand wie alle Ereignisse', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  const r = await page.evaluate(async () => {
    const E = window.__bqe, S = window.__bqs, jetzt = Date.UTC(2026, 10, 3, 12, 0, 0);
    const at = (min) => new Date(Date.UTC(2026, 10, 2, 8, 0, 0) + min * 60000).toISOString();
    const mk = (i) => E.newEvent({ type: 'answer', author: 'p_k1', device: 'd_k1', at: at(i), payload: { day: '2026-11-02', skill: 'round', level: 2, attempt: 1, ok: i % 3 !== 0, qid: 'q' + i } });
    const alle = Array.from({ length: 300 }, (_, i) => mk(i)), alt = alle.slice(0, 200), neu = alle.slice(200);
    const s = await S.makeSnapshot(alt, { now: jetzt, author: 'p_e1', device: 'd_e1' });
    const soll = JSON.stringify(S.derive(alle, { now: jetzt }));
    const a = await S.stateFrom(alle, s, { now: jetzt }), b = await S.stateFrom(neu, s, { now: jetzt });
    const spaet = E.newEvent({ type: 'answer', author: 'p_k1', device: 'd_k2', at: at(50.5), payload: { day: '2026-11-02', skill: 'round', level: 1, attempt: 1, ok: true, qid: 'spaet' } });
    const c = await S.stateFrom([...alle, spaet], s, { now: jetzt }), d = await S.stateFrom([...neu, spaet], s, { now: jetzt });
    return { count: s.payload.count, hash: /^[0-9a-f]{64}$/.test(s.payload.idsHash), fehlerFrei: E.checkEvent(s).length === 0, a: a.weg + (JSON.stringify(a.state) === soll), b: b.weg + (JSON.stringify(b.state) === soll), c: c.weg + (JSON.stringify(c.state) === JSON.stringify(S.derive([...alle, spaet], { now: jetzt }))), d: d.weg, schwelle: S.needsSnapshot(alle, null) };
  });
  assert.deepEqual(r, { count: 200, hash: true, fehlerFrei: true, a: 'schnappschusstrue', b: 'schnappschusstrue', c: 'volltrue', d: 'nachladen', schwelle: false });
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Testbau: Bereiche - Schluessel verteilen, nach Ablauf wechseln, falscher Bereich wird verworfen (P3b)', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  const r = await page.evaluate(async () => {
    const K = window.__bqk, B = window.__bqb, E = window.__bqe, L = 'kind:lern:p_k1';
    const keys = {}, M = {};
    for (const [p, role] of [['p_k1', 'child'], ['p_e1', 'parent'], ['p_l1', 'teacher']]) { keys[p] = await K.newPersonKeys(); M[p] = { role, pub: await K.publicKeysOf(keys[p]), devices: ['d_' + p.slice(2)] }; }
    const fr = [{ grant: 'g1', grantee: 'p_l1', scope: ['learning'], from: '2026-11-01', until: '2026-11-14' }];
    const z = B.lokalerSpeicher().geraet('d_e1');
    const verteilen = (heute) => B.schluesselVerteilen(z, L, { soll: B.halter(L, M, fr, heute), ich: 'p_e1', meineSchluessel: keys.p_e1, mitglieder: M });
    const a = await verteilen('2026-11-03'), b = await verteilen('2026-11-15');
    const lehrkraft = await B.schluesselLesen(z, L, { ich: 'p_l1', meineSchluessel: keys.p_l1, mitglieder: M });
    const kind = await B.schluesselLesen(z, L, { ich: 'p_k1', meineSchluessel: keys.p_k1, mitglieder: M });
    const geb = E.newEvent({ type: 'profile_set', author: 'p_k1', device: 'd_k1', at: '2026-11-03T10:00:00.000Z', payload: { field: 'birthday', value: '2017-05-14' } });
    const falsch = await B.acceptEvent(await B.signEvent(geb, L, keys.p_k1), { area: L, members: M });
    return { a: a.aktion, b: b.aktion + b.version + b.entfernt.join(), lehrkraft: [lehrkraft.aktuell, ...lehrkraft.keys.keys()].join(), kind: [kind.aktuell, ...kind.keys.keys()].join(), falsch: falsch.grund, name: B.passtZumBereich({ ...geb, payload: { field: 'name', value: 'K' } }, L) };
  });
  assert.deepEqual(r, { a: 'angelegt', b: 'gewechselt2p_l1', lehrkraft: '2,1', kind: '2,1,2', falsch: 'bereich-falsch', name: true });
  assert.deepEqual(fehler, []);
  await ctx.close();
});