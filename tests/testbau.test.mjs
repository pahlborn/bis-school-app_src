// Testbau (S12, D3): die App mit den Stufe-2-Modulen startet im echten Browser ohne Fehler, und das Modul
// krypto, ereignisse, schnappschuss und bereiche arbeiten dort genauso wie in Node (Web Crypto, Datum und Zeitformate in Chromium; Safari folgt im Feldtest).
// Seit Stufe 3a auch der GitHub-Speicher gegen den Nachbau auf 127.0.0.1 (fetch, CORS, 304, base64 im Browser).
//   node --test tests/testbau.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, appOeffnen } from './app-hilfen.mjs';
import { githubNachbau } from './module/github-nachbau.mjs';

const GH_TOKEN = 'github_pat_BROWSERTEST_' + 'k3'.repeat(20);   // nur im Nachbau gueltig
let browser, server, gh;
before(async () => {
  browser = await browserStarten();
  server = await appServer({ bauart: 'test', anpassen: (h) => h.replace(/\}\)\(\);\s*<\/script>/, 'window.__bqk={sealEntry,openEntryText,entryAad,newAreaKey,newPersonKeys,publicKeysOf,lockPersonKeys,unlockPersonKeys,createKeyring,rotateKeyring,keysForHolder,keyFingerprint};window.__bqe={newEvent,checkEvent,effectiveTime,mergeLog,fieldKey,lastWins};window.__bqs={makeSnapshot,stateFrom,needsSnapshot,derive};window.__bqb={halter,schluesselVerteilen,schluesselLesen,passtZumBereich,lokalerSpeicher,signEvent,acceptEvent,zulassungAus};window.__bqg={githubSpeicher};})();</script>') });
  gh = await githubNachbau({ token: GH_TOKEN });
});
after(async () => { await browser?.close(); server?.close(); await gh?.schliessen(); });

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
    const geb = E.newEvent({ type: 'profile_set', author: 'p_k1', device: 'd_k1', at: '2026-11-03T10:00:00.000Z', payload: { field: 'emoji', value: 'fox' } });
    const falsch = await B.acceptEvent(await B.signEvent(geb, L, keys.p_k1), { area: L, members: M });
    // Aufgabe "Name und Geburtsdatum" (04.11.): Nachname und Geburtsdatum gehoeren zum Namen in kind:lern, das Emoji nicht
    const p = (field, value) => B.passtZumBereich({ ...geb, payload: { field, value } }, L);
    return { a: a.aktion, b: b.aktion + b.version + b.entfernt.join(), lehrkraft: [lehrkraft.aktuell, ...lehrkraft.keys.keys()].join(), kind: [kind.aktuell, ...kind.keys.keys()].join(), falsch: falsch.grund, name: p('name', 'K') && p('lastName', 'B') && p('birthday', '2017-05-14') };
  });
  assert.deepEqual(r, { a: 'angelegt', b: 'gewechselt2p_l1', lehrkraft: '2,1', kind: '2,1,2', falsch: 'bereich-falsch', name: true });
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Testbau: Zulassung aus den Ereignissen des Bereichs (P3b-2a)', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  const r = await page.evaluate(async () => {
    const K = window.__bqk, B = window.__bqb, E = window.__bqe, L = 'kind:lern:p_k1', keys = {}, pub = {};
    for (const p of ['p_e1', 'p_k1', 'p_x1']) { keys[p] = await K.newPersonKeys(); pub[p] = await K.publicKeysOf(keys[p]); }
    const at = (m) => new Date(Date.UTC(2026, 10, 3, 8, m, 0)).toISOString();
    const ev = (p, type, payload, m) => B.signEvent(E.newEvent({ type, author: p, device: 'd_' + p.slice(2), at: at(m), payload }), L, keys[p]);
    const liste = [await ev('p_e1', 'device_added', { device: 'd_e1' }, 1), await ev('p_e1', 'member_added', { person: 'p_k1', role: 'child', pub: pub.p_k1 }, 2),
      await ev('p_k1', 'device_added', { device: 'd_k1' }, 3), await ev('p_x1', 'member_added', { person: 'p_x1', role: 'parent', pub: pub.p_x1 }, 4)];
    const z = await B.zulassungAus(liste, { area: L, anker: { person: 'p_e1', role: 'parent', pub: pub.p_e1 }, now: Date.UTC(2026, 10, 3, 12, 0, 0) });
    return { mitglieder: Object.keys(z.members).join(), kind: z.members.p_k1.devices.join(), verworfen: z.verworfen.map((v) => v.grund).join() };
  });
  assert.deepEqual(r, { mitglieder: 'p_e1,p_k1', kind: 'd_k1', verworfen: 'autor-unbekannt' });
  assert.deepEqual(fehler, []);
  await ctx.close();
});

test('Testbau: GitHub-Speicher im Browser gegen den Nachbau (Stufe 3a) - base64 mit Umlauten, 304 bei unveraendertem Ordner, Fehlercodes', async () => {
  const { ctx, page, fehler } = await appOeffnen(browser, server.url);
  await ctx.route(gh.basis + '/**', (r) => r.continue());          // nur der Nachbau auf 127.0.0.1; alles andere bleibt gesperrt
  const vorher = { ...gh.zaehler };
  const r = await page.evaluate(async ({ basis, token }) => {
    const G = window.__bqg, B = 'kind:lern:p_k1';
    const s = G.githubSpeicher({ repo: 'pahlborn/bis-school-app-testdaten', token, basis, wurzel: 'browser' });
    const a = s.geraet('d_a1'), b = s.geraet('d_b1');
    const code = async (p) => { try { await p; return 'ok'; } catch (e) { return e.code + (e.message.includes(token.slice(-10)) ? ' MIT TOKEN' : ''); } };
    await a.put(B, 'd_a1', { nr: 1, inhalt: { text: 'Größe – Äpfel 🍎' } });
    const l1 = await b.list(B);
    const l2 = await b.list(B, l1.merker);
    await a.invite.put('i1', { fuer: 'zweiter Elternteil' });
    return {
      kennungen: l1.kennungen.join(), leer: l2.kennungen.length, inhalt: (await b.get(B, 'd_a1/1')).text,
      vorhanden: await code(a.put(B, 'd_a1', { nr: 1, inhalt: 'x' })), luecke: await code(a.put(B, 'd_a1', { nr: 3, inhalt: 'x' })),
      unbekannt: await code(b.get(B, 'd_a1/9')), einladung: (await b.invite.get('i1')).fuer, zweimal: await code(b.invite.get('i1')),
      zugang: await code(G.githubSpeicher({ repo: 'pahlborn/bis-school-app-testdaten', token: 'falsch-falsch-falsch', basis }).geraet('d_a1').list(B)),
      offline: await code(G.githubSpeicher({ repo: 'pahlborn/bis-school-app-testdaten', token, basis: 'http://127.0.0.1:9' }).geraet('d_a1').list(B)),
      unveraendert: s.anfragen().unveraendert,
    };
  }, { basis: gh.basis, token: GH_TOKEN });
  assert.deepEqual(r, { kennungen: 'd_a1/1', leer: 0, inhalt: 'Größe – Äpfel 🍎', vorhanden: 'vorhanden', luecke: 'luecke', unbekannt: 'unbekannt', einladung: 'zweiter Elternteil', zweimal: 'unbekannt', zugang: 'zugang', offline: 'offline', unveraendert: 1 });
  assert.equal(gh.zaehler.unveraendert - vorher.unveraendert, 1, 'der Browser reicht 304 an das Modul durch (kein eigener Zwischenspeicher)');
  assert.equal(gh.dateien().get('browser/events/kind:lern:p_k1/d_a1/1.json'), '{"text":"Größe – Äpfel 🍎"}', 'UTF-8 unveraendert im Repo');
  assert.deepEqual(fehler, []);
  await ctx.close();
});