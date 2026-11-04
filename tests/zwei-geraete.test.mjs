// Aufgabe 3b-2b (S12, Abschluss Stufe 2 = M3): echte App-Instanzen (Testbau in der Node-Sandbox, tests/app-sandbox.mjs)
// gleichen ueber den simulierten Speicher ab - lokalerSpeicher + abgleich, mit bereiche, zulassung, annahme; die Bruecke
// zwischen dem Ereignis-Speicher der App und dem Abgleich ist das Modul geraeteabgleich (von Hand ausgeloest).
// Jedes Geraet hat seinen eigenen localStorage und seine eigene Geraete-Kennung; gemeinsam ist nur der Speicher.
// Vor dem Start der App wird jedes Geraet einmal eingerichtet (wie spaeter die Anmeldung mit Schluesseln, EP9).
//   E1  zwei Familien mit gleichen Namen: nichts Gemeinsames, kein Rollen-Paar liest fremde Bereiche, Fremdes wird verworfen
//   E4  Kind uebt offline auf zwei Geraeten, Eltern aendern offline den Fokus -> alle zeigen denselben Stand, 0 verloren, 0 doppelt
//   E6  Freigabe beendet (widerrufen / abgelaufen) -> das Geraet der Lehrkraft liest nichts Neues mehr
//   E10 Eintrag der Lehrkraft, von einem fremden Geraet oder kaputt -> von allen verworfen, nicht angezeigt
//   node --test tests/zwei-geraete.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appSandbox } from './app-sandbox.mjs';
import { konto } from './konten-hilfen.mjs';
import { kontenEinsetzen, kennungErzeugen } from '../werkzeug/konten.mjs';
import { newPersonKeys, publicKeysOf, sealEntry } from '../src/module/krypto.mjs';
import { newEvent } from '../src/module/ereignisse.mjs';
import { signEvent } from '../src/module/annahme.mjs';
import { schluesselLesen, bereichName } from '../src/module/bereiche.mjs';
import { abgleichStand, vormerken, senden } from '../src/module/abgleich.mjs';
import { lokalerSpeicher } from '../src/module/speicher.mjs';
import { newDeviceId } from '../src/module/schreiber.mjs';
import { geraetAbgleichen, GERAETEABGLEICH_SPEICHER } from '../src/module/geraeteabgleich.mjs';

const pad = (n) => String(n).padStart(2, '0');
const tag = (plus = 0) => { const d = new Date(Date.now() + plus * 864e5); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const ROLLE = { student: 'child', parent: 'parent', teacher: 'teacher', admin: 'admin' };
const roh = (x) => (x === undefined ? x : JSON.parse(JSON.stringify(x)));          // values of the sandbox's realm

/* eine Familie: Konten (v2, wie werkzeug/konten.json) mit Schluesseln je Person. namen: { kathie: 'student', ... } */
async function familie(namen) {
  const P = {}, users = [], guardians = [];
  for (const [user, role] of Object.entries(namen)) {
    const keys = await newPersonKeys(), id = kennungErzeugen();
    P[user] = { id, user, role: ROLLE[role], keys, pub: await publicKeysOf(keys) };
    users.push({ id, user, kind: role === 'student' ? 'child' : 'adult', ...(role === 'teacher' ? { teacher: true } : {}), ...(role === 'admin' ? { admin: true } : {}), start: (await konto(user, role, 'START' + user)).start });
  }
  for (const e of Object.values(P)) if (e.role === 'parent') for (const k of Object.values(P)) if (k.role === 'child') guardians.push({ adult: e.id, child: k.id });
  const konten = { version: 2, users, guardians };
  const eltern = Object.values(P).find((x) => x.role === 'parent');
  return {
    P, anpassen: (h) => kontenEinsetzen(h, konten).toString('utf8'),
    verzeichnis: Object.fromEntries(Object.values(P).map((x) => [x.id, { role: x.role, pub: x.pub }])),
    kind: (user) => ({ id: P[user].id, pre: 'bq2_' + P[user].id + '__', anker: { person: eltern.id, role: 'parent', pub: eltern.pub } }),
  };
}
const mapAblage = (m) => ({ getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } });

/* ein Geraet: wer (angemeldete Person, deren Schluessel hier liegen), kinder (deren Daten hier liegen).
   Einrichten vor dem Start der App, dann die App starten (eigener localStorage). */
async function geraet(t, welt, fam, { name, wer, kinder = [], verzeichnis = fam.verzeichnis, app = true }) {
  const p = fam.P[wer], d = newDeviceId(), vor = new Map([['bq2_evDevice', JSON.stringify(d)]]);
  vor.set(p.role === 'child' ? 'bq2_session' : 'bq2_adultSession', JSON.stringify({ user: p.user, id: p.id }));
  const zugang = welt.geraet(d);
  const G = { name, d, p, zugang, kinder: kinder.map((k) => fam.kind(k)), S: null };
  G.opts = (extra = {}) => ({ zugang, personen: { [p.id]: { role: p.role, keys: p.keys, pub: p.pub } }, kinder: G.kinder, verzeichnis, now: Date.now(), heute: tag(), ...extra });
  G.ablage = () => (G.S ? G.S.ctx.localStorage : mapAblage(vor));
  G.abgleichen = async (extra) => {
    const r = await geraetAbgleichen({ ablage: G.ablage(), ...G.opts(extra) });
    if (G.S) {
      if (r.inDieApp) G.S.holen('evNeuLaden')();
      if (p.role !== 'child') G.S.lauf(() => G.S.holen('syncViewUser')());
    }
    return r;
  };
  await G.abgleichen();                                                          // einrichten (EP9: Anmeldung mit Schluesseln)
  if (app) {
    G.S = appSandbox({ bauart: 'test', seite: true, anpassen: fam.anpassen, speicher: Object.fromEntries(vor) });
    t.diagnostic(name + ': BQ_SEED=' + G.S.seed);
  }
  G.wert = (k, d) => roh(G.S.lauf(() => G.S.holen('store').get(k, d)));
  G.log = (kid) => JSON.parse(G.ablage().getItem(fam.kind(kid).pre + 'events') || '[]');
  G.offline = () => zugang.offline(); G.online = () => zugang.online();
  return G;
}

/* eine Runde ueben, mit echten Klicks; falsch: Fragen, die falsch beantwortet werden */
function runde(S, item, falsch = []) {
  S.karteOeffnen(S.alleKarten().find((k) => k.item === item));
  for (let f = 0; f < 8; f++) {
    const s = S.zustand(), q = s.round[s.idx];
    if (falsch.includes(f)) {
      S.lauf(() => {
        const A = S.$('#qAnswers');
        if (q.kind === 'mc') A.querySelector(`.opt[data-i="${(q.answer + 1) % q.options.length}"]`).click();
        else if (q.kind === 'type') { for (const z of String(+q.answer + 1)) A.querySelector(`.key[aria-label="${z}"]`).click(); A.querySelector('.key.go').click(); }
        else { for (const k of [...q.correct].reverse()) A.querySelector(`.ord[data-i="${k}"]`).click(); A.querySelector('#checkOrder').click(); }
      });
      if (S.$('#nextBtn').hidden) S.klick('#answerBtn');
    } else S.frageBeantworten(q);
    S.klick('#nextBtn');
  }
  S.klick('#homeBtn');
}
const STAND = ['attempts', 'ev', 'due', 'total', 'badges', 'tried', 'rankSeen', 'focusMode', 'focusManual', 'unlocked', 'sheets', 'best_round', 'best_numbers', 'best_units'];
const stand = (G) => Object.fromEntries(STAND.map((k) => [k, G.wert(k, null)]));
const fokus = (G) => roh(G.S.lauf(() => G.S.holen('focusTopics')()));
const ids = (l) => l.map((e) => e.id);
const doppelt = (l) => l.length - new Set(ids(l)).size;
const antworten = (l) => l.filter((e) => e.type === 'answer');

/* die Familie aus der Aufgabe: Kathie (iPad), Peter (Laptop), eine Lehrkraft */
async function familieMeier() { return familie({ kathie: 'student', peter: 'parent', lehrer: 'teacher' }); }

test('E4 mit der echten App: Kind uebt offline auf zwei Geraeten, Eltern aendern offline den Fokus -> nach dem Abgleich derselbe Stand auf allen, nichts verloren, nichts doppelt', async (t) => {
  const welt = lokalerSpeicher(), fam = await familieMeier();
  const B = await geraet(t, welt, fam, { name: 'Peters Laptop', wer: 'peter', kinder: ['kathie'] });
  const A = await geraet(t, welt, fam, { name: 'Kathies iPad', wer: 'kathie', kinder: ['kathie'] });
  const A2 = await geraet(t, welt, fam, { name: 'Familien-Laptop (Kathie)', wer: 'kathie', kinder: ['kathie'] });
  for (const G of [A, A2, B]) { const r = await G.abgleichen(); assert.deepEqual(r.verworfen, [], G.name); }
  assert.ok(B.log('kathie').length > 0, 'Peters Laptop kennt Kathie nach dem ersten Abgleich');
  assert.equal(B.S.holen('viewUser'), 'kathie', 'Peter sieht Kathies Daten');

  // alle offline: Kathie uebt auf beiden Geraeten je 7 Runden (56 Antworten), Peter waehlt ein Fokus-Thema
  for (const G of [A, A2, B]) G.offline();
  const items = ['round', 'numbers', 'units', 'round', 'numbers', 'units', 'round'];
  items.forEach((it, i) => runde(A.S, it, i % 3 === 0 ? [2] : []));
  items.forEach((it, i) => runde(A2.S, it, i % 2 === 0 ? [5] : []));
  const thema = ['graphs', 'units', 'numbers'].find((k) => !fokus(B).includes(k));
  B.S.lauf(() => B.S.holen('toggleFocus')(thema));
  assert.ok(fokus(B).includes(thema) && B.wert('focusMode') === 'manual', 'Peter sieht seine Wahl sofort');
  for (const G of [A, A2, B]) {
    const r = await G.abgleichen();
    assert.ok(Object.values(r.bereiche).every((b) => !b.ok && b.fehler === 'offline'), G.name + ' offline: ' + JSON.stringify(Object.values(r.bereiche).map((b) => b.fehler)));
  }
  assert.equal(fokus(A).includes(thema), false, 'offline: Kathie sieht Peters Wahl noch nicht');
  const eigen = (G) => G.log('kathie').filter((e) => e.device === G.d);
  const vorher = { A: ids(eigen(A)), A2: ids(eigen(A2)), B: ids(eigen(B)) };
  assert.ok(antworten(eigen(A)).length >= 56 && antworten(eigen(A2)).length >= 56, 'je mindestens 56 Antworten');

  // wieder online, Abgleich in gemischter Reihenfolge, zweimal
  for (const G of [A, A2, B]) G.online();
  for (const G of [A2, B, A, B, A2, A]) { const r = await G.abgleichen(); assert.deepEqual(r.verworfen, [], G.name); assert.ok(Object.values(r.bereiche).every((b) => b.ok), G.name + ' ' + JSON.stringify(r.bereiche)); }

  const lA = A.log('kathie'), lA2 = A2.log('kathie'), lB = B.log('kathie');
  assert.deepEqual(ids(lA2).slice().sort(), ids(lA).slice().sort(), 'iPad und Familien-Laptop: dieselben Ereignisse');
  assert.deepEqual(ids(lB).slice().sort(), ids(lA).slice().sort(), 'iPad und Peters Laptop: dieselben Ereignisse');
  for (const l of [lA, lA2, lB]) assert.equal(doppelt(l), 0, 'nichts doppelt');
  for (const [n, l] of Object.entries(vorher)) for (const id of l) assert.ok(ids(lB).includes(id) && ids(lA).includes(id), 'nichts verloren: ' + n + ' ' + id);
  assert.equal(antworten(lA).length, antworten(eigen(A)).length + antworten(eigen(A2)).length, 'alle Antworten beider Geraete, einmal');
  // derselbe Stand in der App - beim Kind auf beiden Geraeten und bei Peter
  const sA = stand(A);
  assert.deepEqual(stand(A2), sA, 'Familien-Laptop = iPad');
  assert.deepEqual(stand(B), sA, 'Peters Laptop = iPad');
  assert.equal(sA.attempts.length, antworten(lA).length, 'jede Antwort einmal in "attempts"');
  assert.equal(sA.focusMode, 'manual');
  for (const G of [A, A2]) assert.ok(fokus(G).includes(thema), G.name + ': Peters Fokus-Thema kommt an');
  assert.deepEqual(fokus(A), fokus(B)); assert.deepEqual(fokus(A2), fokus(B));
  // noch einmal abgleichen aendert nichts
  for (const G of [A, A2, B]) { const r = await G.abgleichen(); assert.equal(r.inDieApp, 0); assert.ok(Object.values(r.bereiche).every((b) => b.gesendet === 0 && b.neu === 0), G.name); }
  assert.deepEqual(stand(B), sA);
  // ein neues Geraet (Peters Handy) holt alles in einem Zug: derselbe Stand (Reihenfolge des Eintreffens egal)
  const H = await geraet(t, welt, fam, { name: 'Peters Handy', wer: 'peter', kinder: ['kathie'] });
  await H.abgleichen();
  assert.deepEqual(ids(H.log('kathie')).slice().sort(), ids(lA).slice().sort());
  assert.deepEqual(stand(H), sA, 'neues Geraet = alle anderen');
  for (const G of [A, A2, B, H]) assert.equal(JSON.stringify(G.S.holen('eventErrors')), '[]', G.name);
});

/* ---------- Freigaben in der App (Peters Laptop): erteilen und beenden mit dem Formular des Elternbereichs ---------- */
function freigeben(B, wer, tage = 10) {
  B.S.lauf(() => {
    B.S.holen('state').pview = 'settings'; B.S.holen('renderSheets')();
    B.S.$('#pGrantWho').value = wer; B.S.$('#pGrantDays').value = String(tage);
    B.S.$('#pGrantForm').dispatchEvent({ type: 'submit', preventDefault() {} });
  });
  const g = B.wert('grants', []).filter((x) => !x.revokedAt).at(-1);
  assert.ok(g, 'Freigabe erteilt: ' + B.S.$('#pGrantMsg').textContent);
  return g;
}
function beenden(B, g) {
  B.S.lauf(() => {
    B.S.holen('state').pview = 'settings'; B.S.holen('renderSheets')();
    const k = B.S.$('#aboutBody').querySelectorAll('[data-grantrevoke]').find((x) => x.dataset.grantrevoke === g.id);
    assert.ok(k, 'Knopf "Beenden" fuer ' + g.id); k.click();
  });
  assert.ok(B.wert('grants', []).find((x) => x.id === g.id).revokedAt, 'beendet');
}
/* was die App der Lehrkraft vom Kind zeigen kann: das Protokoll des Kindes auf ihrem Geraet (kidRead, wie die App liest) */
const beiLehrkraft = (C, kid) => roh(C.S.lauf(() => { const acc = C.S.holen('APP_ACCOUNTS').users.find((u) => u.user === kid); return C.S.holen('kidRead')(acc, 'attempts', []); }));
const lern = (G, kid) => G.r && G.r.bereiche[bereichName('kind:lern', G.kinder.find((k) => k.id === kid).id)];

test('E6 mit der echten App: ohne Freigabe liest die Lehrkraft nichts, mit Freigabe alles, nach dem Ende (widerrufen oder abgelaufen) nichts Neues', async (t) => {
  const welt = lokalerSpeicher(), fam = await familieMeier(), K = fam.P.kathie.id;
  const B = await geraet(t, welt, fam, { name: 'Peters Laptop', wer: 'peter', kinder: ['kathie'] });
  const A = await geraet(t, welt, fam, { name: 'Kathies iPad', wer: 'kathie', kinder: ['kathie'] });
  const C = await geraet(t, welt, fam, { name: 'Geraet der Lehrkraft', wer: 'lehrer', kinder: ['kathie'] });
  const sync = async (...gs) => { for (const G of gs) { G.r = await G.abgleichen(); assert.deepEqual(G.r.verworfen, [], G.name); } };
  const ueben = async (n) => { for (let i = 0; i < n; i++) runde(A.S, ['round', 'numbers', 'units'][i % 3]); await sync(A); };
  await sync(A, B); await ueben(2);
  // ohne Freigabe: kein Schluessel, nichts auf dem Geraet der Lehrkraft
  await sync(C);
  assert.deepEqual(beiLehrkraft(C, 'kathie'), [], 'ohne Freigabe: nichts');
  assert.equal(C.log('kathie').length, 0);
  assert.deepEqual((await schluesselLesen(C.zugang, bereichName('kind:lern', K), { ich: fam.P.lehrer.id, meineSchluessel: fam.P.lehrer.keys, mitglieder: { [fam.P.peter.id]: { role: 'parent', pub: fam.P.peter.pub } } })).lesbar.size, 0);
  // Peter gibt frei (Lernstand, 10 Tage) -> beim naechsten Abgleich bekommt die Lehrkraft den Schluessel und liest alles
  const g1 = freigeben(B, 'lehrer');
  await sync(B);
  assert.equal(lern(B, K).aktion, 'ergaenzt');
  await sync(C);
  const n1 = A.wert('attempts').length;
  assert.equal(beiLehrkraft(C, 'kathie').length, n1, 'mit Freigabe: der ganze Lernstand');
  await ueben(1); await sync(C);
  assert.equal(beiLehrkraft(C, 'kathie').length, n1 + 8, 'waehrend die Freigabe laeuft: auch Neues');
  // Peter beendet die Freigabe -> neuer Schluessel; Kathie uebt weiter; die Lehrkraft liest nichts Neues
  beenden(B, g1);
  await sync(B);
  assert.equal(lern(B, K).aktion, 'gewechselt');
  await ueben(2); await sync(C);
  const n2 = A.wert('attempts').length;
  assert.equal(n2, n1 + 24);
  assert.equal(beiLehrkraft(C, 'kathie').length, n1 + 8, 'nach dem Ende: nichts Neues');
  assert.ok(lern(C, K).neu === 0 && C.r.inDieApp === 0, 'nichts angenommen: ' + JSON.stringify(lern(C, K)));
  const stC = JSON.parse(C.ablage().getItem(GERAETEABGLEICH_SPEICHER.staende))[bereichName('kind:lern', K)];
  assert.ok(stC.wartend.length > 0, 'die neuen Buendel liegen fuer die Lehrkraft ungelesen (anderer Schluessel)');
  await sync(B); assert.equal(B.wert('attempts').length, n2, 'Peter sieht alles');
  // neue Freigabe: die Lehrkraft bekommt alle Versionen (auch die Luecke) - dann laeuft sie ab: wieder nichts Neues
  const g2 = freigeben(B, 'lehrer', 1);
  assert.equal(g2.until, tag(), 'ein Tag: bis heute');
  await sync(B, C);
  assert.equal(beiLehrkraft(C, 'kathie').length, n2, 'neue Freigabe: alles bis jetzt');
  await sync(B);
  B.r = await B.abgleichen({ heute: tag(1) });                                  // morgen: die Freigabe ist abgelaufen
  assert.equal(lern(B, K).aktion, 'gewechselt', 'Ablauf -> neuer Schluessel');
  await ueben(1); await sync(C);
  assert.equal(beiLehrkraft(C, 'kathie').length, n2, 'nach dem Ablauf: nichts Neues');
  assert.equal(A.wert('attempts').length, n2 + 8);
  for (const G of [A, B, C]) assert.equal(JSON.stringify(G.S.holen('eventErrors')), '[]', G.name);
});

test('E10 mit der echten App: Eintraege der Lehrkraft, eines fremden Geraets, mit fremder Unterschrift oder kaputt werden von allen verworfen und nicht angezeigt', async (t) => {
  const welt = lokalerSpeicher(), fam = await familieMeier(), K = fam.P.kathie.id, L = fam.P.lehrer;
  const B = await geraet(t, welt, fam, { name: 'Peters Laptop', wer: 'peter', kinder: ['kathie'] });
  const A = await geraet(t, welt, fam, { name: 'Kathies iPad', wer: 'kathie', kinder: ['kathie'] });
  const C = await geraet(t, welt, fam, { name: 'Geraet der Lehrkraft', wer: 'lehrer', kinder: ['kathie'] });
  runde(A.S, 'round');
  await A.abgleichen(); await B.abgleichen();
  freigeben(B, 'lehrer');
  await B.abgleichen(); await C.abgleichen(); await A.abgleichen();
  const vorher = { A: stand(A), B: stand(B), fokusA: fokus(A) };
  assert.equal(beiLehrkraft(C, 'kathie').length, vorher.A.attempts.length, 'die Lehrkraft liest (Freigabe laeuft)');
  // 1) eine veraenderte App der Lehrkraft schreibt eine Antwort und ein Fokus-Thema - unterschrieben mit ihrem echten Schluessel
  const at = new Date().toISOString(), heute = tag();
  const falsch = [
    newEvent({ type: 'answer', author: L.id, device: C.d, at, payload: { day: heute, skill: 'round', level: 3, attempt: 1, ok: true, qid: 'gefaelscht' } }),
    newEvent({ type: 'list_set', author: L.id, device: C.d, at, payload: { list: 'focusManual', item: 'graphs', on: true } }),
  ];
  const lk = fam.kind('kathie').pre + 'events';
  C.ablage().setItem(lk, JSON.stringify(C.log('kathie').concat(falsch)));
  const rc = await C.abgleichen();
  assert.equal(rc.bereiche[bereichName('kind:lern', K)].gesendet + rc.bereiche[bereichName('kind:privat', K)].gesendet, 1, 'die Antwort geht raus (kind:privat hat sie keinen Schluessel)');
  // 2) jemand mit dem Bereichsschluessel (die Lehrkraft) legt auf einem eigenen Geraet Eintraege "von Kathie" ab
  const X = 'd_FREMDESGERAET000001', area = bereichName('kind:lern', K), zx = welt.geraet(X);
  const sch = await schluesselLesen(zx, area, { ich: L.id, meineSchluessel: L.keys, mitglieder: { [fam.P.peter.id]: { role: 'parent', pub: fam.P.peter.pub } } });
  const alsKathie = (device) => newEvent({ type: 'answer', author: K, device, at, payload: { day: heute, skill: 'round', level: 3, attempt: 1, ok: true, qid: 'als-kathie' } });
  const fremdGeraet = await signEvent(alsKathie(X), area, L.keys);
  const stX = abgleichStand(area, X);
  vormerken(stX, fremdGeraet);
  await senden(stX, { zugang: zx, schluessel: { aktuell: sch.aktuell, keys: sch.keys } });
  // ... und auf Kathies Geraete-Kennung (fremde Unterschrift), dazu ein Buendel mit kaputtem Inhalt
  const zA = welt.geraet(A.d), naechste = (await zA.list(area, null)).kennungen.filter((k) => k.startsWith(A.d + '/')).length + 1;
  const fremdeUnterschrift = await signEvent(alsKathie(A.d), area, L.keys);
  const versiegelt = await sealEntry(sch.keys.get(sch.aktuell), JSON.stringify(fremdeUnterschrift), new TextEncoder().encode('bq1|' + area + '|' + sch.aktuell + '|' + fremdeUnterschrift.event.id));
  const kaputt = { id: 'e_kaputt00000000000000001', iv: versiegelt.iv, ct: versiegelt.ct.slice(0, -4) + 'AAAA' };
  await zA.put(area, A.d, { nr: naechste, inhalt: { v: 1, kv: sch.aktuell, eintraege: [{ id: fremdeUnterschrift.event.id, ...versiegelt }, kaputt] } });
  // alle Apps der Familie (auch ein neues Geraet) verwerfen das - mit Grund - und zeigen nichts davon
  const H = await geraet(t, welt, fam, { name: 'Peters Handy', wer: 'peter', kinder: ['kathie'] });
  const soll = [[falsch[0].id, 'rolle-darf-nicht'], [fremdGeraet.event.id, 'geraet-fremd'], [fremdeUnterschrift.event.id, 'unterschrift'], [kaputt.id, 'entschluesseln']].sort();
  for (const G of [A, B, H]) {
    const r = await G.abgleichen();
    const v = (G === H ? JSON.parse(G.ablage().getItem(GERAETEABGLEICH_SPEICHER.verworfen)) : r.verworfen).filter((x) => x.bereich === area).map((x) => [x.id, x.grund]).sort();
    assert.deepEqual(v, soll, G.name);
    assert.ok(JSON.parse(G.ablage().getItem(GERAETEABGLEICH_SPEICHER.verworfen)).length >= 4, G.name + ': festgehalten');
    for (const e of [falsch[0], falsch[1], fremdGeraet.event, fremdeUnterschrift.event]) assert.equal(ids(G.log('kathie')).includes(e.id), false, G.name + ': nicht in der App');
  }
  assert.deepEqual(stand(A), vorher.A, 'Kathies iPad: unveraendert');
  assert.deepEqual(stand(B), vorher.B, 'Peters Laptop: unveraendert');
  assert.deepEqual(stand(H), vorher.A, 'Peters Handy: derselbe Stand, ohne das Gefaelschte');
  assert.deepEqual(fokus(A), vorher.fokusA, 'kein Fokus-Thema der Lehrkraft');
  // die Familie arbeitet normal weiter: Kathies naechste Runde kommt bei Peter an
  runde(A.S, 'numbers'); await A.abgleichen(); await B.abgleichen();
  assert.equal(B.wert('attempts').length, vorher.B.attempts.length + 8);
});

test('E1 mit der echten App: zwei Familien mit gleichen Namen (zweimal kathie, zweimal peter) im selben Speicher - nichts Gemeinsames, kein Rollen-Paar liest fremde Bereiche, Fremdes wird verworfen', async (t) => {
  const welt = lokalerSpeicher();
  const f1 = await familie({ kathie: 'student', peter: 'parent' }), f2 = await familie({ kathie: 'student', peter: 'parent', lehrer: 'teacher', chef: 'admin' });
  const K1 = f1.P.kathie.id, P1 = f1.P.peter;
  const B1 = await geraet(t, welt, f1, { name: 'Familie 1: Peters Laptop', wer: 'peter', kinder: ['kathie'] });
  const A1 = await geraet(t, welt, f1, { name: 'Familie 1: Kathies iPad', wer: 'kathie', kinder: ['kathie'] });
  const B2 = await geraet(t, welt, f2, { name: 'Familie 2: Peters Laptop', wer: 'peter', kinder: ['kathie'] });
  const A2 = await geraet(t, welt, f2, { name: 'Familie 2: Kathies iPad', wer: 'kathie', kinder: ['kathie'] });
  runde(A1.S, 'round', [1]); runde(A2.S, 'numbers'); runde(A2.S, 'units', [0, 4]);
  B1.S.lauf(() => B1.S.holen('toggleFocus')('graphs'));
  for (const G of [A1, A2, B1, B2, A1, A2]) { const r = await G.abgleichen(); assert.deepEqual(r.verworfen, [], G.name); }
  // nichts Gemeinsames: jede Familie sieht genau ihr Kind
  assert.deepEqual(stand(B1), stand(A1)); assert.deepEqual(stand(B2), stand(A2));
  const n1 = A1.wert('attempts').length;
  assert.equal(n1, antworten(A1.log('kathie')).length); assert.equal(A2.wert('attempts').length, antworten(A2.log('kathie')).length); assert.ok(n1 >= 8 && A2.wert('attempts').length >= 16);
  const l1 = new Set(ids(A1.log('kathie'))), l2 = ids(A2.log('kathie'));
  assert.equal(l2.filter((id) => l1.has(id)).length, 0, '0 gemeinsame Ereignisse');
  for (const G of [A2, B2]) {
    const st = G.ablage();
    for (let i = 0; i < st.length; i++) assert.equal(String(st.key(i)).includes(K1) || String(st.getItem(st.key(i))).includes(K1), false, G.name + ': ' + st.key(i));
  }
  for (const G of [A1, B1]) { const st = G.ablage(); for (let i = 0; i < st.length; i++) assert.equal(String(st.getItem(st.key(i))).includes(f2.P.kathie.id), false, G.name); }
  // jedes Rollen-Paar: keine Person der Familie 2 (Kind, Elternteil, Lehrkraft, Admin) bekommt einen Schluessel zu einem Bereich der Familie 1
  const bereiche1 = [...['kind:lern', 'kind:privat', 'schule', 'eltern:allg'].map((a) => bereichName(a, K1)), bereichName('person', K1), bereichName('person', P1.id)];
  for (const p of Object.values(f2.P)) {
    for (const area of bereiche1) {
      const s = await schluesselLesen(welt.geraet('d_PRUEFGERAET00000001'), area, { ich: p.id, meineSchluessel: p.keys, mitglieder: { [P1.id]: { role: 'parent', pub: P1.pub } } });
      assert.equal(s.lesbar.size, 0, p.user + ' (' + p.role + ') -> ' + area);
    }
    // ... auch nicht mit einer App, die Kathie 1 abgleichen will (Anker richtig)
    const vor = new Map([['bq2_evDevice', JSON.stringify(newDeviceId())]]);
    const r = await geraetAbgleichen({ ablage: mapAblage(vor), zugang: welt.geraet(JSON.parse(vor.get('bq2_evDevice'))), personen: { [p.id]: { role: p.role, keys: p.keys, pub: p.pub } }, kinder: [f1.kind('kathie')], verzeichnis: f2.verzeichnis, now: Date.now(), heute: tag() });
    assert.equal(r.inDieApp, 0, p.user);
    assert.equal(vor.has(f1.kind('kathie').pre + 'events'), false, p.user + ': nichts von Kathie 1 im Speicher');
  }
  // Peter 2 gibt sich als Gruender von Kathie 1 aus (veraenderte App): eigener Schluessel, eigene Eintraege in ihren Bereichen
  const vor = new Map([['bq2_evDevice', JSON.stringify(newDeviceId())]]), dX = JSON.parse(vor.get('bq2_evDevice'));
  const P2 = f2.P.peter, falscherAnker = { ...f1.kind('kathie'), anker: { person: P2.id, role: 'parent', pub: P2.pub } };
  const vorAngriff = { A1: stand(A1), B1: stand(B1), fokus: fokus(A1) };
  vor.set(falscherAnker.pre + 'events', JSON.stringify([newEvent({ type: 'list_set', author: P2.id, device: dX, at: new Date(Date.now() + 5).toISOString(), payload: { list: 'focusManual', item: 'units', on: true } })]));
  const rx = await geraetAbgleichen({ ablage: mapAblage(vor), zugang: welt.geraet(dX), personen: { [P2.id]: { role: 'parent', keys: P2.keys, pub: P2.pub } }, kinder: [falscherAnker], verzeichnis: f2.verzeichnis, now: Date.now(), heute: tag() });
  assert.ok(rx.bereiche[bereichName('kind:privat', K1)].gesendet >= 1, 'er legt Eintraege ab');
  for (const G of [A1, B1]) {
    const r = await G.abgleichen();
    assert.ok(r.verworfen.length > 0 && r.verworfen.every((v) => v.kennung.startsWith(dX + '/') && v.grund === 'entschluesseln'), G.name + ': ' + JSON.stringify(r.verworfen));
    assert.equal(r.inDieApp, 0);
  }
  assert.deepEqual(stand(A1), vorAngriff.A1, 'Kathies iPad unveraendert'); assert.deepEqual(stand(B1), vorAngriff.B1, 'Peters Laptop unveraendert');
  assert.deepEqual(fokus(A1), vorAngriff.fokus, 'sein Fokus-Eintrag kommt nicht an');
  const seine = JSON.parse(vor.get(falscherAnker.pre + 'events')).map((e) => e.id);
  for (const G of [A1, B1]) assert.equal(ids(G.log('kathie')).some((id) => seine.includes(id)), false, G.name);
  // Familie 1 arbeitet weiter (ihre Schluessel sind unberuehrt)
  runde(A1.S, 'numbers'); await A1.abgleichen(); const r1 = await B1.abgleichen();
  assert.equal(B1.wert('attempts').length, n1 + 8); assert.ok(Object.values(r1.bereiche).every((b) => b.ok), JSON.stringify(r1.bereiche));
});
