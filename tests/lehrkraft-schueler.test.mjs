// Aufgabe "Lehrkraft sieht ihre Schueler" (04.11., Vorgabe Peter): Eine Lehrkraft sieht die Kinder, fuer die sie eine
// Freigabe der Eltern hat - mehrere Kinder, auch aus verschiedenen Familien - mit Name und Lernstand, Schulbewertungen nur
// mit Freigabe "Schuldaten". Nur mit Freigabe, befristet, nur lesend. Echte App-Instanzen (Testbau in der Node-Sandbox),
// gemeinsam ist nur der simulierte Speicher (wie tests/zwei-geraete.test.mjs).
//   Die Freigabe (grant_set, grant_revoked) liegt zusaetzlich im Bereich freigabe:<Kennung>, den die Lehrkraft liest; ihr
//   Geraet kennt die Kennung aus der Einladung (EP9) und findet so das Kind. Das Ende der Freigabe geht dort noch mit dem
//   alten Schluessel raus, damit ihre App es erfaehrt.
//   node --test tests/lehrkraft-schueler.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appSandbox } from './app-sandbox.mjs';
import { konto } from './konten-hilfen.mjs';
import { kontenEinsetzen, kennungErzeugen } from '../werkzeug/konten.mjs';
import { newPersonKeys, publicKeysOf } from '../src/module/krypto.mjs';
import { newEvent } from '../src/module/ereignisse.mjs';
import { schluesselLesen, bereichName, bereichVonEreignis } from '../src/module/bereiche.mjs';
import { lokalerSpeicher } from '../src/module/speicher.mjs';
import { newDeviceId } from '../src/module/schreiber.mjs';
import { geraetAbgleichen } from '../src/module/geraeteabgleich.mjs';

const pad = (n) => String(n).padStart(2, '0');
const tag = (plus = 0) => { const d = new Date(Date.now() + plus * 864e5); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const ROLLE = { student: 'child', parent: 'parent', teacher: 'teacher', admin: 'admin' };
const roh = (x) => (x === undefined ? x : JSON.parse(JSON.stringify(x)));

/* eine Installation (eine Kontenliste, wie werkzeug/konten.json) mit mehreren Familien und Lehrkraeften.
   wer: { anmeldename: [rolle, familie] } - Familie 0 = keine (Lehrkraefte). Jede Familie: Elternteil -> Kind. */
async function installation(wer) {
  const P = {}, users = [], guardians = [];
  for (const [user, [role, fam]] of Object.entries(wer)) {
    const keys = await newPersonKeys(), id = kennungErzeugen();
    P[user] = { id, user, role: ROLLE[role], fam, keys, pub: await publicKeysOf(keys) };
    users.push({ id, user, kind: role === 'student' ? 'child' : 'adult', ...(role === 'teacher' ? { teacher: true } : {}), start: (await konto(user, role, 'START' + user)).start });
  }
  for (const e of Object.values(P)) if (e.role === 'parent') for (const k of Object.values(P)) if (k.role === 'child' && k.fam === e.fam) guardians.push({ adult: e.id, child: k.id });
  const konten = { version: 2, users, guardians };
  const gruender = (fam) => Object.values(P).find((x) => x.role === 'parent' && x.fam === fam);
  return {
    P, anpassen: (h) => kontenEinsetzen(h, konten).toString('utf8'),
    // oeffentliche Schluessel, die ein Elternteil kennt: die eigene Familie und die Lehrkraefte (EP9: Einladungen)
    verzeichnis: (fam) => Object.fromEntries(Object.values(P).filter((x) => x.fam === fam || x.fam === 0).map((x) => [x.id, { role: x.role, pub: x.pub }])),
    kind: (user, freigaben) => ({ id: P[user].id, pre: 'bq2_' + P[user].id + '__', anker: { person: gruender(P[user].fam).id, role: 'parent', pub: gruender(P[user].fam).pub }, ...(freigaben ? { freigaben } : {}) }),
  };
}
const mapAblage = (m) => ({ getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } });

/* ein Geraet: wer (angemeldete Person), kinder (deren Daten hier liegen, mit Freigabe-Kennungen aus Einladungen) */
async function geraet(t, welt, ins, { name, wer, kinder = [] }) {
  const p = ins.P[wer], d = newDeviceId(), vor = new Map([['bq2_evDevice', JSON.stringify(d)]]);
  vor.set(p.role === 'child' ? 'bq2_session' : 'bq2_adultSession', JSON.stringify({ user: p.user, id: p.id }));
  const zugang = welt.geraet(d);
  const G = { name, d, p, zugang, kinder, S: null };
  G.abgleichen = async (extra = {}) => {
    const r = await geraetAbgleichen({ ablage: G.ablage(), zugang, personen: { [p.id]: { role: p.role, keys: p.keys, pub: p.pub } }, kinder: G.kinder, verzeichnis: ins.verzeichnis(p.fam), now: Date.now(), heute: tag(), ...extra });
    if (G.S) {
      if (r.inDieApp) G.S.holen('evNeuLaden')();
      if (p.role !== 'child') G.S.lauf(() => G.S.holen('syncViewUser')());
    }
    G.r = r;
    return r;
  };
  G.ablage = () => (G.S ? G.S.ctx.localStorage : mapAblage(vor));
  await G.abgleichen();                                                          // einrichten (EP9)
  G.S = appSandbox({ bauart: 'test', seite: true, anpassen: ins.anpassen, speicher: Object.fromEntries(vor) });
  t.diagnostic(name + ': BQ_SEED=' + G.S.seed);
  G.wert = (k, d) => roh(G.S.lauf(() => G.S.holen('store').get(k, d)));
  G.log = (kid) => JSON.parse(G.ablage().getItem('bq2_' + ins.P[kid].id + '__events') || '[]');
  /* ein Ereignis, wie es die App dieses Geraets schreiben wuerde (fuer Typen ohne Knopf in der Sandbox) */
  G.schreiben = (kid, type, payload) => {
    const k = 'bq2_' + ins.P[kid].id + '__events';
    G.ablage().setItem(k, JSON.stringify(G.log(kid).concat([newEvent({ type, author: p.id, device: d, at: new Date().toISOString(), payload })])));
    G.S.holen('evNeuLaden')();
  };
  return G;
}

/* eine Runde ueben, mit echten Klicks */
function runde(S, item) {
  S.karteOeffnen(S.alleKarten().find((k) => k.item === item));
  for (let f = 0; f < 8; f++) { const s = S.zustand(); S.frageBeantworten(s.round[s.idx]); S.klick('#nextBtn'); }
  S.klick('#homeBtn');
}
/* das Kind traegt im Profil seinen Namen ein (und den Geburtstag, der nur in kind:privat liegt) */
function profil(S, name, [monat, tagNr] = []) {
  S.lauf(() => {
    S.holen('openProfile')();
    S.$('#pfName').value = name;
    if (monat) { S.$('#pfMonth').value = monat; S.$('#pfDay').value = tagNr; }
    S.holen('saveProfile')();
  });
}
/* Freigabe im Elternbereich erteilen bzw. beenden - mit dem Formular und dem Knopf der App */
function freigeben(B, wer, { schule = false, tage = 10 } = {}) {
  B.S.lauf(() => {
    B.S.holen('state').pview = 'settings'; B.S.holen('renderSheets')();
    B.S.$('#pGrantWho').value = wer; B.S.$('#pGrantDays').value = String(tage); B.S.$('#pGrantSchool').checked = schule;
    B.S.$('#pGrantForm').dispatchEvent({ type: 'submit', preventDefault() {} });
  });
  const g = B.wert('grants', []).filter((x) => !x.revokedAt).at(-1);
  assert.ok(g && B.S.holen('APP_ACCOUNTS').users.find((u) => u.id === g.grantee).user === wer, 'Freigabe erteilt: ' + B.S.$('#pGrantMsg').textContent);
  B.S.lauf(() => { B.S.holen('state').pview = null; });
  return g;
}
function beenden(B, g) {
  B.S.lauf(() => {
    B.S.holen('state').pview = 'settings'; B.S.holen('renderSheets')();
    const k = B.S.$('#aboutBody').querySelectorAll('[data-grantrevoke]').find((x) => x.dataset.grantrevoke === g.id);
    assert.ok(k, 'Knopf "Beenden" fuer ' + g.id); k.click();
    B.S.holen('state').pview = null;
  });
  assert.ok(B.wert('grants', []).find((x) => x.id === g.id).revokedAt, 'beendet');
}

/* was die Lehrkraft sieht: die Kinderliste im Kopf ihres Bereichs ("Meine Kinder") - mit echtem Aufbau der Seite */
function kopf(C) {
  return C.S.lauf(() => {
    C.S.holen('state').pview = null; C.S.holen('renderSheets')();
    const body = C.S.$('#aboutBody'), sel = body.querySelector('#pKidSel');     // (im Baum suchen: $ legt Fehlendes an)
    return sel ? sel.querySelectorAll('option').map((o) => o.textContent.trim()) : [body.querySelector('#pKid').textContent.trim()];
  });
}
const auswahl = (C) => roh(C.S.lauf(() => C.S.holen('kidChoices')()));
/* ein Kind in der Liste waehlen (wie der Finger: Auswahl aendern) */
function waehlen(C, user) {
  C.S.lauf(() => { const sel = C.S.$('#aboutBody').querySelector('#pKidSel'); sel.value = user; sel.dispatchEvent({ type: 'change' }); });
}
/* was die App der Lehrkraft von einem Kind liest (kidRead, wie die App liest) */
const liest = (C, kid, k, d) => roh(C.S.lauf(() => { const acc = C.S.holen('APP_ACCOUNTS').users.find((u) => u.user === kid); return C.S.holen('kidRead')(acc, k, d); }));
const grantsIn = (log) => [...new Set(log.filter((e) => /^grant_/.test(e.type)).map((e) => e.payload.grant))].sort();

test('Lehrkraft sieht ihre Schueler: zwei Familien, Kinder mit gleichem Namen - beide mit Name und Lernstand, Schuldaten nur mit Freigabe, nach dem Ende verschwindet nur dieses Kind, nichts aus eltern:allg oder kind:privat', async (t) => {
  const welt = lokalerSpeicher();
  const ins = await installation({ kathie: ['student', 1], peter: ['parent', 1], 'kathie.b': ['student', 2], 'peter.b': ['parent', 2], lehrer: ['teacher', 0], lehrer2: ['teacher', 0] });
  const K1 = ins.P.kathie.id, K2 = ins.P['kathie.b'].id, L = ins.P.lehrer;
  const B1 = await geraet(t, welt, ins, { name: 'Familie 1: Peters Laptop', wer: 'peter', kinder: [ins.kind('kathie')] });
  const A1 = await geraet(t, welt, ins, { name: 'Familie 1: Kathies iPad', wer: 'kathie', kinder: [ins.kind('kathie')] });
  const B2 = await geraet(t, welt, ins, { name: 'Familie 2: Peters Laptop', wer: 'peter.b', kinder: [ins.kind('kathie.b')] });
  const A2 = await geraet(t, welt, ins, { name: 'Familie 2: Kathies iPad', wer: 'kathie.b', kinder: [ins.kind('kathie.b')] });
  const C = await geraet(t, welt, ins, { name: 'Geraet der Lehrkraft', wer: 'lehrer' });
  const sync = async (...gs) => { for (const G of gs) { await G.abgleichen(); assert.deepEqual(G.r.verworfen, [], G.name); } };

  // beide Kinder heissen "Kathie"; Kathie 1 hat einen Geburtstag; Kathie 1 uebt zwei Runden, Kathie 2 eine
  profil(A1.S, 'Kathie', ['05', '14']); profil(A2.S, 'Kathie');
  runde(A1.S, 'round'); runde(A1.S, 'numbers'); runde(A2.S, 'units');
  await sync(A1, A2, B1, B2);
  // Familie 1: Schulbewertungen eingespielt, eine Sicherung gemacht, Freigabe fuer eine ANDERE Lehrkraft; Familie 2: Schulbewertungen
  B1.schreiben('kathie', 'school_import', { asOf: tag(), data: { round: 'M' }, source: 'toddle' });
  B1.schreiben('kathie', 'backup_made', { day: tag() });
  const g0 = freigeben(B1, 'lehrer2');
  B2.schreiben('kathie.b', 'school_import', { asOf: tag(), data: { units: 'C' }, source: 'toddle' });
  await sync(B1, B2, A1, A2);
  const n1 = A1.wert('attempts').length, n2 = A2.wert('attempts').length;
  assert.ok(n1 === 16 && n2 === 8, n1 + ' / ' + n2);

  // ohne Freigabe: kein Kind
  await sync(C);
  assert.deepEqual(auswahl(C), [], 'ohne Freigabe: kein Kind');
  assert.match(kopf(C)[0], /keine Daten/, 'Kopf: kein Kind');

  // Peter 1 gibt frei (Lernstand + Schuldaten), Peter 2 nur Lernstand; die Lehrkraft bekommt beide Einladungen (EP9)
  const g1 = freigeben(B1, 'lehrer', { schule: true }), g2 = freigeben(B2, 'lehrer');
  assert.deepEqual([g1.scope, g2.scope], [['learning', 'school'], ['learning']]);
  await sync(B1, B2);
  C.kinder = [ins.kind('kathie', [g1.id]), ins.kind('kathie.b', [g2.id])];
  await sync(C);

  // beide Kinder, mit Name und Lernstand - jedes mit seinen eigenen Daten
  assert.deepEqual(auswahl(C), ['kathie', 'kathie.b'], 'beide Kinder');
  assert.deepEqual(kopf(C), ['👧 Kathie (kathie)', '👧 Kathie (kathie.b)'], 'Name und Anmeldename im Kopf');
  assert.equal(liest(C, 'kathie', 'name', ''), 'Kathie'); assert.equal(liest(C, 'kathie.b', 'name', ''), 'Kathie');
  assert.equal(liest(C, 'kathie', 'attempts', []).length, n1, 'Lernstand Kathie 1');
  assert.equal(liest(C, 'kathie.b', 'attempts', []).length, n2, 'Lernstand Kathie 2');
  assert.deepEqual(liest(C, 'kathie', 'attempts', []), A1.wert('attempts'), 'genau Kathies 1 Antworten');
  assert.deepEqual(liest(C, 'kathie.b', 'attempts', []), A2.wert('attempts'), 'genau Kathies 2 Antworten');
  // jede Freigabe beim richtigen Kind - keine fremde (auch nicht die der anderen Lehrkraft)
  assert.deepEqual(grantsIn(C.log('kathie')), [g1.id], 'bei Kathie 1 nur g1');
  assert.deepEqual(grantsIn(C.log('kathie.b')), [g2.id], 'bei Kathie 2 nur g2');
  assert.equal(JSON.stringify(C.log('kathie')).includes(g0.id), false, 'die Freigabe der anderen Lehrkraft bleibt verborgen');
  // ihre Freigabe mit Umfang und Enddatum, ohne den Einwilligungstext der Eltern
  assert.deepEqual(liest(C, 'kathie', 'grants', []).map((g) => [g.id, g.grantee, g.scope, g.until]), [[g1.id, L.id, ['learning', 'school'], g1.until]]);
  assert.equal(C.log('kathie').concat(C.log('kathie.b')).some((e) => e.type === 'grant_set' && 'text' in e.payload), false, 'kein Einwilligungstext');
  // Schuldaten nur mit Freigabe "Schuldaten"
  const schule = (kid) => C.log(kid).filter((e) => bereichVonEreignis(e) === 'schule');
  assert.ok(schule('kathie').some((e) => e.type === 'school_import'), 'Kathie 1: Schulbewertungen (Freigabe mit Schuldaten)');
  assert.deepEqual(schule('kathie.b'), [], 'Kathie 2: keine Schulbewertungen (nur Lernstand)');
  waehlen(C, 'kathie');
  assert.ok(C.S.$('#aboutBody').querySelectorAll('details.psec').some((d) => d.dataset.psec === 'school'), 'Kathie 1: Kapitel Schulbewertungen');
  waehlen(C, 'kathie.b');
  assert.equal(C.S.$('#aboutBody').querySelectorAll('details.psec').some((d) => d.dataset.psec === 'school'), false, 'Kathie 2: kein Kapitel Schulbewertungen');
  // nichts aus eltern:allg (ausser ihrer eigenen Freigabe) und nichts aus kind:privat
  for (const kid of ['kathie', 'kathie.b']) {
    const fremd = C.log(kid).filter((e) => { const b = bereichVonEreignis(e); return b === 'kind:privat' || (b === 'eltern:allg' && !(/^grant_(set|revoked)$/.test(e.type) && e.payload.grantee === L.id)); });
    assert.deepEqual(fremd.map((e) => e.type), [], kid + ': nichts aus kind:privat / eltern:allg');
  }
  assert.equal(liest(C, 'kathie', 'birthday', null), null, 'kein Geburtstag');
  for (const [art, kid] of [['eltern:allg', K1], ['kind:privat', K1], ['eltern:allg', K2], ['kind:privat', K2], ['schule', K2]]) {
    const s = await schluesselLesen(C.zugang, bereichName(art, kid), { ich: L.id, meineSchluessel: L.keys, mitglieder: {} });
    assert.equal(s.lesbar.size, 0, 'kein Schluessel: ' + art + ' ' + (kid === K1 ? 'Kathie 1' : 'Kathie 2'));
  }
  // "angesehen": die App der Lehrkraft traegt es ein, die Eltern sehen es im Protokoll
  await sync(C, B1, B2);
  const angesehen = (B, kid) => B.wert('grantlog', []).filter((e) => e.ev === 'geöffnet' && e.grantee === L.id).length;
  assert.equal(angesehen(B1, 'kathie'), 1, 'Peter 1 sieht: angesehen');
  assert.equal(angesehen(B2, 'kathie.b'), 1, 'Peter 2 sieht: angesehen');
  assert.ok(C.log('kathie').some((e) => e.type === 'grant_opened' && e.author === L.id) && C.log('kathie.b').some((e) => e.type === 'grant_opened' && e.author === L.id));

  // waehrend die Freigaben laufen: auch Neues
  runde(A1.S, 'units'); runde(A2.S, 'round');
  await sync(A1, A2, C);
  assert.equal(liest(C, 'kathie', 'attempts', []).length, n1 + 8); assert.equal(liest(C, 'kathie.b', 'attempts', []).length, n2 + 8);

  // Peter 1 beendet seine Freigabe -> nur Kathie 1 verschwindet; alte Daten bleiben auf dem Geraet, aber nichts Neues
  beenden(B1, g1);
  await sync(B1);
  runde(A1.S, 'numbers'); runde(A2.S, 'numbers');
  await sync(A1, A2, C);
  assert.deepEqual(auswahl(C), ['kathie.b'], 'nach dem Ende: nur noch Kathie 2');
  assert.deepEqual(kopf(C), ['👧 Kathie (kathie.b)']);
  assert.ok(C.log('kathie').some((e) => e.type === 'grant_revoked' && e.payload.grant === g1.id), 'das Ende kommt bei der Lehrkraft an');
  assert.ok(liest(C, 'kathie', 'grants', []).find((g) => g.id === g1.id).revokedAt, 'ihre App kennt das Ende');
  assert.equal(liest(C, 'kathie', 'attempts', []).length, n1 + 8, 'Kathie 1: nichts Neues');
  assert.equal(liest(C, 'kathie.b', 'attempts', []).length, n2 + 16, 'Kathie 2: weiter alles');
  assert.equal(A1.wert('attempts').length, n1 + 16);
  assert.equal(C.r.bereiche[bereichName('kind:lern', K1)].neu, 0);
  for (const G of [A1, A2, B1, B2, C]) assert.equal(JSON.stringify(G.S.holen('eventErrors')), '[]', G.name);
});

test('Lehrkraft: eine Freigabe der anderen Familie wird keinem Kind gleichen Namens zugeordnet (falsche Einladung)', async (t) => {
  const welt = lokalerSpeicher();
  const ins = await installation({ kathie: ['student', 1], peter: ['parent', 1], 'kathie.b': ['student', 2], 'peter.b': ['parent', 2], lehrer: ['teacher', 0] });
  const B1 = await geraet(t, welt, ins, { name: 'Familie 1: Peters Laptop', wer: 'peter', kinder: [ins.kind('kathie')] });
  const A1 = await geraet(t, welt, ins, { name: 'Familie 1: Kathies iPad', wer: 'kathie', kinder: [ins.kind('kathie')] });
  const B2 = await geraet(t, welt, ins, { name: 'Familie 2: Peters Laptop', wer: 'peter.b', kinder: [ins.kind('kathie.b')] });
  const A2 = await geraet(t, welt, ins, { name: 'Familie 2: Kathies iPad', wer: 'kathie.b', kinder: [ins.kind('kathie.b')] });
  profil(A1.S, 'Kathie'); profil(A2.S, 'Kathie');
  runde(A1.S, 'round'); runde(A2.S, 'units');
  for (const G of [A1, A2, B1, B2]) await G.abgleichen();
  // nur Familie 2 gibt frei; die Einladung nennt aber Kathie 1 (gleicher Name, andere Familie)
  const g2 = freigeben(B2, 'lehrer');
  await B2.abgleichen();
  const C = await geraet(t, welt, ins, { name: 'Geraet der Lehrkraft', wer: 'lehrer', kinder: [ins.kind('kathie', [g2.id])] });
  await C.abgleichen();
  assert.deepEqual(auswahl(C), [], 'kein Kind: die Freigabe gehoert nicht zu Kathie 1');
  assert.deepEqual(C.log('kathie'), [], 'nichts bei Kathie 1');
  const v = JSON.parse(C.ablage().getItem('bq_abgleichVerworfen') || '[]').filter((x) => x.bereich === bereichName('freigabe', g2.id));
  assert.ok(v.length > 0 && v.every((x) => ['autor-unbekannt', 'nicht-mitglied', 'geraet-fremd'].includes(x.grund)), 'verworfen mit Grund: ' + JSON.stringify(v));
  // mit der richtigen Einladung: Kathie 2 - und nur sie (auf einem zweiten Geraet der Lehrkraft; auf C ist der Bereich
  // unter Kathie 1 schon gelesen und verworfen - siehe Prufbericht, Befund fuer EP9)
  const C2 = await geraet(t, welt, ins, { name: 'zweites Geraet der Lehrkraft', wer: 'lehrer', kinder: [ins.kind('kathie.b', [g2.id])] });
  await C2.abgleichen();
  assert.deepEqual(auswahl(C2), ['kathie.b']);
  assert.equal(liest(C2, 'kathie.b', 'attempts', []).length, A2.wert('attempts').length);
  assert.deepEqual(C2.log('kathie'), []);
});
