// Vertragstests fuer jede Speicher-Umsetzung (Konzept 11; S12 P3a, US8.1).
// Wiederverwendbar: die Simulation (tests/module/speicher.test.mjs), spaeter GitHub (P4) und iCloud (Stufe 3).
//
//   speicherVertrag(name, neu)
//     neu({ now }) -> frischer, leerer Speicher (auch async) mit geraet(kennung) -> Zugang eines Geraets.
//     now: stellbare Uhr in Millisekunden; die Umsetzung muss sie fuer den Ablauf der Einladungen nutzen.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPEICHER_FUNKTIONEN, SPEICHER_FEHLER, SPEICHER_EINLADUNG_MS, SPEICHER_DATEI_FORMAT } from '../../src/module/speicher.mjs';
import { newAreaKey, sealEntry, openEntryText, entryAad } from '../../src/module/krypto.mjs';

const B = 'kid:p_k1', B2 = 'kid:p_k2';
const START = Date.UTC(2026, 10, 2, 16, 0, 0);
const json = (x) => JSON.parse(JSON.stringify(x));

/** erwartet einen abgelehnten Aufruf mit diesem Fehlercode */
export async function fehlt(p, code, nachricht) {
  assert.ok(SPEICHER_FEHLER.includes(code), 'bekannter Code ' + code);
  await assert.rejects(p, (e) => { assert.equal(e.code, code, nachricht); return true; }, nachricht);
}
const inhalt = (geraet, nr) => ({ v: 1, eintraege: [{ id: `e_${geraet}_${nr}`, iv: 'aXY=', ct: `Y3Q${nr}` }] });

export function speicherVertrag(name, neu) {
  async function aufbau(...geraete) {
    const uhr = { t: START };
    const s = await neu({ now: () => uhr.t });
    const zugaenge = [];
    for (const g of geraete) zugaenge.push(await s.geraet(g));
    return { uhr, s, z: zugaenge };
  }
  async function schreibe(zugang, bereich, von, bis) {
    for (let nr = von; nr <= bis; nr++) await zugang.put(bereich, zugang.geraet, { nr, inhalt: inhalt(zugang.geraet, nr) });
  }

  test(`${name}: Schnittstelle vollstaendig, alle Aufrufe asynchron (auch Fehler)`, async () => {
    const { z: [a] } = await aufbau('d_a1');
    for (const f of SPEICHER_FUNKTIONEN) {
      const fn = f.split('.').reduce((o, k) => o?.[k], a);
      assert.equal(typeof fn, 'function', f);
    }
    assert.equal(a.geraet, 'd_a1');
    const p = a.put('a/b', 'd_a1', { nr: 1, inhalt: 1 });
    assert.equal(typeof p?.then, 'function', 'Fehler kommt als abgelehntes Promise, nicht als Ausnahme');
    await fehlt(p, 'ungueltig');
    assert.equal(typeof a.list(B).then, 'function');
  });

  test(`${name}: put/get - Kennung = Geraet/Nummer, genau der abgelegte Inhalt, Kopien`, async () => {
    const { z: [a, b] } = await aufbau('d_a1', 'd_b1');
    const ein = { v: 1, eintraege: [{ id: 'e_1', iv: 'aXY=', ct: 'Y3Q=' }], zahl: 0.1, leer: null, liste: [1, 'x', { y: true }] };
    assert.equal(await a.put(B, 'd_a1', { nr: 1, inhalt: ein }), 'd_a1/1');
    const erwartet = json(ein);
    ein.eintraege[0].ct = 'veraendert'; ein.neu = 1;
    const aus = await b.get(B, 'd_a1/1');
    assert.deepEqual(aus, erwartet, 'Aenderung nach put erreicht den Speicher nicht');
    aus.eintraege.length = 0;
    assert.deepEqual(await a.get(B, 'd_a1/1'), erwartet, 'Aenderung am Ergebnis erreicht den Speicher nicht');
    assert.equal(await a.put(B, 'd_a1', { nr: 2, inhalt: 'nur Text' }), 'd_a1/2');
    assert.equal(await a.get(B, 'd_a1/2'), 'nur Text');
    await fehlt(a.get(B, 'd_a1/3'), 'unbekannt');
    await fehlt(a.get(B, 'd_x9/1'), 'unbekannt');
    await fehlt(a.get(B2, 'd_a1/1'), 'unbekannt', 'anderer Bereich');
    for (const k of ['d_a1-1', 'd_a1/0', 'd_a1/01', 'd_a1/-1', '/1', 'd_a1/1/2', '../d_a1/1', 1, null]) await fehlt(a.get(B, k), 'ungueltig', String(k));
  });

  test(`${name}: ein Geraet schreibt nur eigene Buendel`, async () => {
    const { z: [a, b] } = await aufbau('d_a1', 'd_b1');
    await fehlt(a.put(B, 'd_b1', { nr: 1, inhalt: 1 }), 'fremdes-geraet');
    await fehlt(a.put(B, 'd_x9', { nr: 1, inhalt: 1 }), 'fremdes-geraet');
    assert.deepEqual((await b.list(B)).kennungen, []);
    await b.put(B, 'd_b1', { nr: 1, inhalt: 'echt' });
    await fehlt(a.put(B, 'd_b1', { nr: 2, inhalt: 'fremd' }), 'fremdes-geraet');
    assert.deepEqual((await b.list(B)).kennungen, ['d_b1/1']);
  });

  test(`${name}: gleiche Nummer zweimal -> Fehler, nie ueberschreiben (auch gleichzeitig)`, async () => {
    const { z: [a, b] } = await aufbau('d_a1', 'd_b1');
    await a.put(B, 'd_a1', { nr: 1, inhalt: 'X' });
    await assert.rejects(a.put(B, 'd_a1', { nr: 1, inhalt: 'Y' }), (e) => e.code === 'vorhanden' && e.gleicherInhalt === false);
    await assert.rejects(a.put(B, 'd_a1', { nr: 1, inhalt: 'X' }), (e) => e.code === 'vorhanden' && e.gleicherInhalt === true, 'Wiederholung nach verlorener Antwort erkennbar');
    assert.equal(await b.get(B, 'd_a1/1'), 'X');
    const r = await Promise.allSettled(['A', 'B', 'C', 'D', 'E'].map((x) => a.put(B, 'd_a1', { nr: 2, inhalt: x })));
    const gut = r.filter((x) => x.status === 'fulfilled');
    assert.equal(gut.length, 1, 'genau einer gewinnt');
    assert.ok(r.filter((x) => x.status === 'rejected').every((x) => x.reason.code === 'vorhanden'));
    const gewinner = ['A', 'B', 'C', 'D', 'E'][r.indexOf(gut[0])];
    assert.equal(await b.get(B, 'd_a1/2'), gewinner);
    assert.deepEqual((await b.list(B)).kennungen, ['d_a1/1', 'd_a1/2']);
  });

  test(`${name}: laufende Nummer ohne Luecke; kaputte Eingaben -> ungueltig, nichts abgelegt`, async () => {
    const { z: [a] } = await aufbau('d_a1');
    await fehlt(a.put(B, 'd_a1', { nr: 2, inhalt: 1 }), 'luecke', 'erstes Buendel muss 1 sein');
    await a.put(B, 'd_a1', { nr: 1, inhalt: 1 });
    await fehlt(a.put(B, 'd_a1', { nr: 3, inhalt: 3 }), 'luecke');
    for (const nr of [0, -1, 1.5, '2', NaN, Infinity, null, 1e12]) await fehlt(a.put(B, 'd_a1', { nr, inhalt: 1 }), 'ungueltig', 'nr ' + nr);
    await fehlt(a.put(B, 'd_a1', { nr: 2 }), 'ungueltig', 'Inhalt fehlt');
    await fehlt(a.put(B, 'd_a1', { nr: 2, inhalt: () => 1 }), 'ungueltig', 'Funktion ist kein Inhalt');
    await fehlt(a.put(B, 'd_a1', { nr: 2, inhalt: 1, extra: 1 }), 'ungueltig', 'Zusatzfeld');
    for (const b of [null, 2, 'x', [2, 1]]) await fehlt(a.put(B, 'd_a1', b), 'ungueltig', 'Buendel ' + b);
    for (const bereich of ['', 'a/b', '../x', '__proto__', 'kid p_k1', 7, null]) await fehlt(a.put(bereich, 'd_a1', { nr: 1, inhalt: 1 }), 'ungueltig', 'Bereich ' + bereich);
    assert.deepEqual((await a.list(B)).kennungen, ['d_a1/1']);
  });

  test(`${name}: list - stabile Reihenfolge, Merker liefert nur Neues, Bereiche getrennt`, async () => {
    const { z: [a, b, c] } = await aufbau('d_a1', 'd_b1', 'd_c1');
    await schreibe(b, B, 1, 2);
    await schreibe(a, B, 1, 12);
    await schreibe(c, B2, 1, 1);
    const erst = await c.list(B);
    const erwartet = [...Array.from({ length: 12 }, (_, i) => 'd_a1/' + (i + 1)), 'd_b1/1', 'd_b1/2'];
    assert.deepEqual(erst.kennungen, erwartet, 'Geraet, dann Nummer (10 nach 9)');
    assert.deepEqual((await a.list(B)).kennungen, erwartet, 'gleich fuer jedes Geraet');
    assert.deepEqual((await c.list(B, null)).kennungen, erwartet, 'null = von vorn');
    const merker = json(erst.merker);
    assert.deepEqual(merker, erst.merker, 'Merker ist reines JSON');
    assert.deepEqual((await c.list(B, merker)).kennungen, []);
    await schreibe(b, B, 3, 3);
    await schreibe(a, B, 13, 13);
    const zwei = await c.list(B, merker);
    assert.deepEqual(zwei.kennungen, ['d_a1/13', 'd_b1/3']);
    assert.deepEqual((await c.list(B, zwei.merker)).kennungen, []);
    assert.deepEqual((await c.list(B, merker)).kennungen, ['d_a1/13', 'd_b1/3'], 'gleicher Merker -> gleiche Antwort');
    assert.deepEqual((await a.list(B2)).kennungen, ['d_c1/1']);
    assert.deepEqual((await a.list('kid:p_k9')).kennungen, []);
    await fehlt(a.list(B2, merker), 'ungueltig', 'Merker eines anderen Bereichs');
    for (const m of ['x', 7, {}, { bereich: B }, { bereich: B, stand: { d_a1: -1 } }, { bereich: B, stand: { d_a1: 1.5 } }, { bereich: B, stand: { d_a1: 99 } }]) await fehlt(a.list(B, m), 'ungueltig', JSON.stringify(m));
  });

  test(`${name}: keys/putKey - ersetzt nur den Eintrag dieses Halters`, async () => {
    const { z: [a, b] } = await aufbau('d_a1', 'd_b1');
    assert.deepEqual(await a.keys(B), {});
    await a.putKey(B, 'p_e1', { v: 1, w: 'W1' });
    await b.putKey(B, 'p_e2', { v: 1, w: 'W2' });
    await a.putKey(B2, 'p_e1', { v: 1, w: 'anderer Bereich' });
    assert.deepEqual(await b.keys(B), { p_e1: { v: 1, w: 'W1' }, p_e2: { v: 1, w: 'W2' } });
    await a.putKey(B, 'p_e1', { v: 2, w: 'W1b' });
    const k = await b.keys(B);
    assert.deepEqual(k, { p_e1: { v: 2, w: 'W1b' }, p_e2: { v: 1, w: 'W2' } });
    k.p_e2.w = 'veraendert';
    assert.equal((await a.keys(B)).p_e2.w, 'W2', 'Kopie');
    assert.deepEqual(await a.keys(B2), { p_e1: { v: 1, w: 'anderer Bereich' } });
    for (const h of ['', 'a/b', '__proto__', null]) await fehlt(a.putKey(B, h, { w: 1 }), 'ungueltig', 'Halter ' + h);
    await fehlt(a.putKey(B, 'p_e3'), 'ungueltig', 'nichts verpackt');
    await fehlt(a.keys('a/b'), 'ungueltig');
    assert.deepEqual(Object.keys(await a.keys(B)), ['p_e1', 'p_e2']);
  });

  test(`${name}: directory/putDirectory - zweites Anlegen desselben Hash -> Fehler`, async () => {
    const { z: [a, b] } = await aufbau('d_a1', 'd_b1');
    const h = 'h7f3a09c1';
    assert.equal(await a.directory(h), null);
    const eintrag = { lookup: h, kennung: 'p_e1', art: 'parent', pub: { ecdh: 'AAA', ecdsa: 'BBB' }, gesperrt: { locks: [] } };
    await a.putDirectory(eintrag);
    assert.deepEqual(await b.directory(h), eintrag);
    await fehlt(b.putDirectory({ lookup: h, kennung: 'p_x1', art: 'parent' }), 'vorhanden');
    assert.deepEqual(await a.directory(h), eintrag, 'erster Eintrag bleibt');
    for (const e of [{}, null, 'x', { lookup: 'a/b' }, { lookup: '' }, []]) await fehlt(a.putDirectory(e), 'ungueltig', JSON.stringify(e));
    await fehlt(a.directory('a/b'), 'ungueltig');
    assert.equal(await a.directory('h00000000'), null);
  });

  test(`${name}: Einladungen - 10 Minuten gueltig (stellbare Uhr), einmal nutzbar, delete`, async () => {
    const { uhr, z: [a, b] } = await aufbau('d_a1', 'd_b1');
    assert.equal(SPEICHER_EINLADUNG_MS, 600000);
    await a.invite.put('i1', { fuer: 'zweiter Elternteil', ct: 'abc' });
    uhr.t = START + SPEICHER_EINLADUNG_MS - 1;
    assert.deepEqual(await b.invite.get('i1'), { fuer: 'zweiter Elternteil', ct: 'abc' }, 'kurz vor Ablauf gueltig, anderes Geraet holt ab');
    await fehlt(b.invite.get('i1'), 'unbekannt', 'zweite Nutzung');
    await fehlt(a.invite.get('i1'), 'unbekannt', 'zweite Nutzung, anderes Geraet');
    uhr.t = START;
    await a.invite.put('i2', 'x');
    uhr.t = START + SPEICHER_EINLADUNG_MS;
    await fehlt(b.invite.get('i2'), 'abgelaufen', 'nach genau 10 Minuten');
    uhr.t += 24 * 3600 * 1000;
    await fehlt(b.invite.get('i2'), 'abgelaufen');
    assert.equal(await a.invite.delete('i2'), true);
    await fehlt(b.invite.get('i2'), 'unbekannt', 'nach delete weg');
    assert.equal(await a.invite.delete('i2'), false);
    await a.invite.put('i3', 'y');
    assert.equal(await a.invite.delete('i3'), true);
    await fehlt(b.invite.get('i3'), 'unbekannt', 'zurueckgezogen');
    await a.invite.put('i4', 'z');
    await fehlt(b.invite.put('i4', 'anders'), 'vorhanden');
    assert.equal(await b.invite.get('i4'), 'z');
    for (const k of ['', 'a/b', null]) await fehlt(a.invite.put(k, 1), 'ungueltig');
    await fehlt(a.invite.put('i5'), 'ungueltig', 'ohne Inhalt');
    await fehlt(a.invite.get('a/b'), 'ungueltig');
  });

  test(`${name}: exportFile/importFile - festes Format, nur Fehlendes, doppelt einlesen aendert nichts`, async () => {
    const { z: [a, b] } = await aufbau('d_a1', 'd_b1');
    await schreibe(a, B, 1, 3);
    await schreibe(b, B, 1, 2);
    await schreibe(a, B2, 1, 1);
    const datei = await a.exportFile(B);
    assert.equal(typeof datei, 'string');
    const d = JSON.parse(datei);
    assert.equal(d.format, SPEICHER_DATEI_FORMAT); assert.equal(d.v, 1); assert.equal(d.bereich, B);
    assert.deepEqual(d.buendel.map((x) => x.geraet + '/' + x.nr), ['d_a1/1', 'd_a1/2', 'd_a1/3', 'd_b1/1', 'd_b1/2']);
    assert.deepEqual(d.buendel[2].inhalt, inhalt('d_a1', 3));

    const { z: [c] } = await aufbau('d_c1');
    assert.deepEqual(await c.importFile(datei), { neu: 5, gleich: 0, abweichend: 0 });
    const l = await c.list(B);
    assert.deepEqual(l.kennungen, d.buendel.map((x) => x.geraet + '/' + x.nr));
    for (const x of d.buendel) assert.deepEqual(await c.get(B, x.geraet + '/' + x.nr), x.inhalt);
    assert.deepEqual(await c.importFile(datei), { neu: 0, gleich: 5, abweichend: 0 }, 'doppelt einlesen');
    assert.deepEqual((await c.list(B, l.merker)).kennungen, [], 'nichts doppelt abgelegt');
    assert.equal(await c.exportFile(B), datei, 'Export danach gleich');
    assert.deepEqual((await c.list(B2)).kennungen, [], 'nur der Bereich der Datei');

    const { z: [a2] } = await aufbau('d_a1');
    await schreibe(a2, B, 1, 2);
    assert.deepEqual(await a2.importFile(datei), { neu: 3, gleich: 2, abweichend: 0 }, 'nur Fehlendes');
    assert.deepEqual((await a2.list(B)).kennungen, d.buendel.map((x) => x.geraet + '/' + x.nr));

    const { z: [a3] } = await aufbau('d_a1');
    await a3.put(B, 'd_a1', { nr: 1, inhalt: 'anders' });
    assert.deepEqual(await a3.importFile(datei), { neu: 4, gleich: 0, abweichend: 1 });
    assert.equal(await a3.get(B, 'd_a1/1'), 'anders', 'nie ueberschreiben');

    const { z: [e] } = await aufbau('d_e1');
    const kaputt = (f) => JSON.stringify({ ...d, ...f });
    const faelle = [
      'kein JSON', '{}', 'null', '7', JSON.stringify([d]), kaputt({ format: 'x' }), kaputt({ v: 2 }), kaputt({ bereich: 'a/b' }), kaputt({ buendel: 'x' }),
      kaputt({ buendel: d.buendel.filter((x) => x.nr !== 2) }),                       // Luecke bei d_a1
      kaputt({ buendel: d.buendel.filter((x) => !(x.geraet === 'd_b1' && x.nr === 1)) }),  // d_b1 beginnt bei 2
      kaputt({ buendel: [...d.buendel, d.buendel[0]] }),                               // doppelt in der Datei
      kaputt({ buendel: [...d.buendel, { geraet: 'a/b', nr: 1, inhalt: 1 }] }),
      kaputt({ buendel: [...d.buendel, { geraet: 'd_f1', nr: 1 }] }),
      kaputt({ buendel: [...d.buendel, { geraet: 'd_f1', nr: 1, inhalt: 1, extra: 1 }] }),
      kaputt({ buendel: [...d.buendel, null] }),
    ];
    for (const f of faelle) await fehlt(e.importFile(f), 'ungueltig', f.slice(0, 60));
    await fehlt(e.importFile(d), 'ungueltig', 'Objekt statt Datei');
    assert.deepEqual((await e.list(B)).kennungen, [], 'abgelehnte Datei legt nichts ab');
    const leer = await e.exportFile('kid:p_k9');
    assert.deepEqual(JSON.parse(leer).buendel, []);
    assert.deepEqual(await e.importFile(leer), { neu: 0, gleich: 0, abweichend: 0 });
    const umsortiert = kaputt({ buendel: [...d.buendel].reverse() });
    assert.deepEqual(await e.importFile(umsortiert), { neu: 5, gleich: 0, abweichend: 0 }, 'Reihenfolge in der Datei egal');
    assert.equal(await e.exportFile(B), datei);
  });

  test(`${name}: drei Geraete schreiben abwechselnd - jedes sieht jedes fremde Buendel genau einmal`, async () => {
    const { z } = await aufbau('d_a1', 'd_b1', 'd_c1');
    const merker = new Map(z.map((g) => [g.geraet, null])), gesehen = new Map(z.map((g) => [g.geraet, []])), nr = new Map(z.map((g) => [g.geraet, 0]));
    const abholen = async (g) => {
      const r = await g.list(B, merker.get(g.geraet));
      gesehen.get(g.geraet).push(...r.kennungen);
      merker.set(g.geraet, json(r.merker));                // so liegt er auf dem Geraet
    };
    for (let runde = 0; runde < 6; runde++) {
      for (const g of z) {
        const n = nr.get(g.geraet) + 1 + (runde % 2);         // mal ein, mal zwei Buendel
        for (let i = nr.get(g.geraet) + 1; i <= n; i++) await g.put(B, g.geraet, { nr: i, inhalt: inhalt(g.geraet, i) });
        nr.set(g.geraet, n);
        await abholen(z[(z.indexOf(g) + runde) % 3]);       // abwechselnd holt ein anderes Geraet ab
      }
    }
    for (const g of z) await abholen(g);
    const alle = z.flatMap((g) => Array.from({ length: nr.get(g.geraet) }, (_, i) => g.geraet + '/' + (i + 1)));
    assert.equal(alle.length, 27);
    for (const g of z) {
      const s = gesehen.get(g.geraet);
      assert.equal(new Set(s).size, s.length, g.geraet + ': nichts doppelt');
      assert.deepEqual([...s].sort(), [...alle].sort(), g.geraet + ': alle genau einmal (fremde und eigene)');
    }
  });

  test(`${name}: undurchsichtig - abgelegt werden nur verschluesselte Buendel aus krypto, kein Klartext`, async () => {
    const { z: [a, b] } = await aufbau('d_a1', 'd_b1');
    const key = await newAreaKey(), klar = ['Tiger stars: 13', 'KLARTEXT-answer-ok', 'Kathie Geheimnis'];
    const eintraege = [];
    for (const [i, t] of klar.entries()) eintraege.push({ id: 'e_' + i, ...(await sealEntry(key, t, entryAad(B, 1, 'e_' + i))) });
    await a.put(B, 'd_a1', { nr: 1, inhalt: { v: 1, kv: 1, eintraege } });
    const datei = await b.exportFile(B), roh = JSON.stringify(await b.get(B, 'd_a1/1'));
    for (const t of [...klar, 'Tiger', 'KLARTEXT', 'Kathie']) {
      assert.equal(datei.includes(t), false, 'Datei: ' + t);
      assert.equal(roh.includes(t), false, 'Buendel: ' + t);
    }
    const zurueck = await b.get(B, 'd_a1/1');
    for (const [i, e] of zurueck.eintraege.entries()) assert.equal(await openEntryText(key, e, entryAad(B, 1, e.id)), klar[i], 'Bytes unveraendert');
  });
}
