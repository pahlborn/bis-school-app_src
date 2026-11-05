// Aufgabe "Anmeldung im Testbau" (Stufe 3b; Konzept 10.2-10.6, US9.2-US9.4): die Oberflaeche des Testbaus meldet ueber das
// Konto-Modul an statt ueber konten.json. Mehrere echte App-Instanzen (Testbau in der Node-Sandbox, tests/app-sandbox.mjs)
// mit eigenem localStorage teilen nur den simulierten Speicher (lokalerSpeicher). Bedient wird mit Klicks auf die Knoepfe
// der App und Eingaben in ihre Felder; ein Formular wird wie im Browser ueber seinen Knopf abgeschickt.
//   1 Erwachsener: Startlink -> eigenes Passwort -> Wiederherstellungscode (Eintrag im Passwortspeicher, Datei) ->
//     Willkommen -> Elternbereich; Startcode verbraucht; zweites Geraet nur mit Name und Passwort; falsches Passwort
//   2 Kind: Startcode getippt -> Passwort -> kein Wiederherstellungscode; zweites Geraet; Geschwister; Rolle passt nicht
//   3 Passwort vergessen: Code -> neues Passwort -> neuer Code; altes Passwort und alter Code gelten nicht mehr
//   4 Testinstanz: Zugang zum Testspeicher einmal je Geraet
//   5 Kathies App und der Testbau mit konten.json bleiben beim alten Weg (Suchlauf: kein Konto-Modul im Live-Bau)
//   6 Anleitungen und Hilfe im Konto-Modus
//   node --test tests/konto-anmeldung.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appSandbox } from './app-sandbox.mjs';
import { appLesen } from '../werkzeug/module.mjs';
import { kontenEinsetzen, kennungErzeugen } from '../werkzeug/konten.mjs';
import { konto } from './konten-hilfen.mjs';
import { lokalerSpeicher } from '../src/module/speicher.mjs';
import { startcodeAusstellen, ersteAnmeldung, anmelden as kontoAnmelden, kontoLookup } from '../src/module/konto.mjs';
import { anmStartlink } from '../src/module/anmeldung.mjs';
import { testinstanzUmwandeln, ersatzLesen } from '../werkzeug/testinstanz.mjs';

const RUNDEN = 1000;                                          // nur fuer Konten, die das Werkzeug anlegt (Aussteller)
const warte = (ms) => new Promise((r) => setTimeout(r, ms));
const roh = (x) => (x === undefined ? x : JSON.parse(JSON.stringify(x)));

/* eine App-Instanz (ein Geraet) am gemeinsamen Speicher; hash = Startlink in der Adresse */
function geraet(t, welt, { name, hash = '', speicher = {}, extra = {}, anpassen, praefix = 'bq2_' } = {}) {
  const geteilt = [];
  const S = appSandbox({
    bauart: 'test', seite: true, speicher,
    anpassen: (h) => { const a = h.replace('/*BQ_SPEICHER*/null', 'globalThis.__bqWelt'); return anpassen ? anpassen(a) : a; },
    globale: {
      __bqWelt: welt,
      location: { href: 'http://127.0.0.1/' + hash, origin: 'http://127.0.0.1', protocol: 'http:', host: '127.0.0.1', hostname: '127.0.0.1', pathname: '/', search: '', hash, replace() {}, reload() {}, assign() {} },
      File: class { constructor(teile, n, o) { this.text = teile.join(''); this.name = n; this.type = o && o.type; } },
      navigator: { userAgent: 'node-sandbox', language: 'en-GB', languages: ['en-GB'], onLine: true, standalone: false, canShare: () => true, share: async (d) => { geteilt.push(d); } },
      ...extra
    }
  });
  t.diagnostic(name + ': BQ_SEED=' + S.seed);
  const G = { S, name, geteilt };
  G.im = (sel) => S.lauf(() => S.$('#loginBody').querySelector(sel));            // nur, was die App gerade gebaut hat
  G.da = (sel) => !!G.im(sel);
  G.text = () => S.lauf(() => S.$('#loginBody').textContent);
  G.klick = (sel) => S.lauf(() => { const e = G.im(sel) || S.$(sel); if (!e) throw new Error(name + ': nicht gefunden ' + sel); e.click(); });
  G.tippe = (sel, v) => S.lauf(() => { const e = G.im(sel); if (!e) throw new Error(name + ': Feld fehlt ' + sel); e.value = v; });
  /* Knopf eines Formulars druecken: Klick, dann "submit" am Formular - wie im Browser */
  G.absenden = (knopf) => S.lauf(() => {
    const k = G.im(knopf); if (!k) throw new Error(name + ': Knopf fehlt ' + knopf);
    k.click(); const f = k.closest('form');
    f.dispatchEvent({ type: 'submit', target: f, currentTarget: f, preventDefault() {}, stopPropagation() {} });
  });
  G.warten = async (bed, was, ms = 30000) => {
    const t0 = Date.now();
    for (;;) { if (S.lauf(bed)) return; if (Date.now() - t0 > ms) throw new Error(name + ': wartet vergeblich auf ' + was + ' - Seite: ' + G.text().slice(0, 300)); await warte(15); }
  };
  G.wartenAuf = (sel) => G.warten(() => G.da(sel), sel);
  G.meldung = async (sel) => { await G.warten(() => { const m = G.im(sel); return m && m.textContent && !/Moment/.test(m.textContent); }, 'Meldung ' + sel); return G.im(sel).textContent; };
  G.wert = (n) => roh(S.lauf(() => S.holen(n)));
  G.erwachsen = () => G.wert('adultUser');
  G.sitzung = () => JSON.parse(S.ablage.get(praefix + 'session') || 'null');
  G.liste = () => JSON.parse(S.ablage.get(praefix + 'kontoListe') || '[]');
  G.offen = () => S.lauf(() => [...S.holen('kontoOffen').keys()]);
  G.ablageText = () => [...S.ablage].map(([k, v]) => k + '=' + v).join('\n');
  return G;
}

/* Rollenwahl, Name und Passwort/Startcode, "Log in" */
async function anmelden(G, rolle, name, pw) {
  if (G.da('#roleStudent')) G.klick(rolle === 'student' ? '#roleStudent' : '#roleAdult');
  G.tippe('#loginUser', name); G.tippe('#loginPw', pw);
  G.absenden('#loginGo');
}
/* nach dem Startcode: Vorschlag uebernehmen und speichern -> das gewaehlte Passwort */
async function passwortWaehlen(G) {
  await G.wartenAuf('#setPwForm');
  G.klick('#pwUse');
  const pw = G.im('#newPw1').value;
  G.absenden('#setPwGo');
  return pw;
}

/* ein Admin (vom Werkzeug angelegt) als Aussteller; startcode(name, art) stellt einen Startcode aus */
async function welt() {
  const w = lokalerSpeicher(), z = w.geraet('d_Werkzeug1');
  const sc = await startcodeAusstellen({ zugang: z, aussteller: null, anmeldename: 'admin', art: 'admin', now: Date.now() });
  const admin = await ersteAnmeldung({ zugang: z, code: sc.code, passwort: 'Werkzeug-Admin-Passwort-1', now: Date.now(), runden: RUNDEN });
  const offen = { admin };
  return {
    w, z,
    startcode: async (name, art, von = 'admin') => (await startcodeAusstellen({ zugang: z, aussteller: offen[von], anmeldename: name, art, now: Date.now() })).code,
    elternteil: async (name) => { const c = (await startcodeAusstellen({ zugang: z, aussteller: admin, anmeldename: name, art: 'parent', now: Date.now() })).code; offen[name] = await ersteAnmeldung({ zugang: z, code: c, passwort: 'Werkzeug-Eltern-Passwort-' + name, now: Date.now(), runden: RUNDEN }); }
  };
}

test('1 Erwachsener: Startlink -> eigenes Passwort -> Wiederherstellungscode (Passwortspeicher, Datei) -> Elternbereich; zweites Geraet nur mit Name und Passwort', async (t) => {
  const W = await welt();
  const code = await W.startcode('peter.a', 'parent');
  const link = anmStartlink('http://127.0.0.1/', { anmeldename: 'peter.a', code });
  const A = geraet(t, W.w, { name: 'Peters Laptop', hash: link.slice(link.indexOf('#')) });
  assert.equal(A.wert('KONTO_UI'), true, 'Testbau mit Speicher, ohne konten.json: Konto-Modus');

  // der Startlink fuehrt zur Rollenwahl (Rolle zuerst), danach ist das Formular ausgefuellt
  assert.ok(A.da('#roleAdult') && A.da('#roleStudent'), 'Rollenwahl');
  assert.equal(A.da('#kontoTokenForm'), false, 'simulierter Speicher braucht keinen Zugangsschluessel');
  assert.ok(/recovery code/.test(A.text()) && !/only works on this device/.test(A.text()), 'Hilfe auf der Anmeldeseite passt zum Konto-Modus');
  A.klick('#roleAdult');
  assert.equal(A.im('#loginUser').value, 'peter.a'); assert.equal(A.im('#loginPw').value, code);
  A.absenden('#loginGo');
  await A.wartenAuf('#setPwForm');
  assert.ok(A.text().includes('Es gilt auf allen Geräten'), 'Passwort gilt auf allen Geraeten (DE fuer Erwachsene)');
  assert.equal(A.im('input[autocomplete="username"]').value, 'peter.a', 'Passwortspeicher: Anmeldename im Formular');
  assert.equal(A.S.lauf(() => A.S.$('#loginBody').querySelectorAll('input[autocomplete="new-password"]').length), 2);
  const pw = await passwortWaehlen(A);

  // Wiederherstellungscode: angezeigt, eigener Eintrag im Passwortspeicher, als Datei ueber das Teilen-Menue
  await A.wartenAuf('#recCode');
  const rc = A.im('#recCode').textContent;
  assert.match(rc, /^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){4}$/, 'Code ' + rc);
  const nutzer = A.im('#recForm input[autocomplete="username"]'), feld = A.im('#recForm input[autocomplete="new-password"]');
  assert.equal(nutzer.value, 'peter.a (Wiederherstellungscode)', 'eigener Eintrag, nicht der Eintrag der Anmeldung');
  assert.equal(nutzer.getAttribute('name'), 'username');
  assert.equal(feld.type, 'password'); assert.equal(feld.getAttribute('name'), 'password'); assert.equal(feld.value, rc);
  A.klick('#recFile');
  await A.warten(() => A.geteilt.length === 1, 'Teilen-Menue');
  const datei = A.geteilt[0].files[0];
  assert.equal(datei.name, 'Big-Quest-Wiederherstellungscode-peter.a.txt');
  assert.ok(datei.text.includes(rc) && datei.text.includes('peter.a') && !datei.text.includes(pw), 'Datei: Name und Code, nie das Passwort');
  A.absenden('#recSave');
  assert.ok(A.da('#recSaved') && !A.da('#recForm'), 'nach dem Sichern verschwindet das Formular (dann bietet der Passwortspeicher an)');
  A.klick('#recGo');
  await A.wartenAuf('#welcomeGo');
  assert.ok(A.text().includes('Ihr Passwort gilt auf allen Ihren Geräten'), 'Willkommen: Passwort fuer alle Geraete');
  assert.ok(!A.text().includes('gilt nur auf diesem Gerät'));
  A.klick('#welcomeGo');
  assert.equal(A.erwachsen().user, 'peter.a', 'im Elternbereich angemeldet');
  const kennung = A.liste()[0].id;
  assert.deepEqual(A.liste(), [{ id: kennung, user: 'peter.a', art: 'parent' }], 'Geraeteliste: nur Kennung, Name, Art');
  assert.deepEqual(A.offen(), [kennung], 'Schluesselkopie auf dem Geraet');
  assert.equal(JSON.parse(A.S.ablage.get('bq2_adultSession')).id, kennung);
  for (const g of [pw, rc, code]) assert.ok(!A.ablageText().includes(g), 'nichts Geheimes im Speicher des Geraets');
  assert.deepEqual(A.wert('kontoFehlerListe'), []);
  assert.ok((await W.z.directory(await kontoLookup('peter.a'))) !== null, 'Konto liegt im Speicher');

  // der Startcode ist verbraucht: ein zweites Geraet kommt damit nicht hinein
  const B = geraet(t, W.w, { name: 'Peters iPhone' });
  await anmelden(B, 'adult', 'peter.a', code);
  assert.equal(await B.meldung('#loginMsg'), 'Benutzername oder Passwort stimmt nicht.');
  assert.equal(B.erwachsen(), null);
  await assert.rejects(ersteAnmeldung({ zugang: W.z, code, passwort: 'Noch-ein-Passwort-123', now: Date.now(), runden: RUNDEN }), (e) => e.code === 'startcode-ungueltig');

  // falscher Name und falsches Passwort: dieselbe Meldung
  B.tippe('#loginUser', 'peter.x'); B.tippe('#loginPw', pw); B.absenden('#loginGo');
  assert.equal(await B.meldung('#loginMsg'), 'Benutzername oder Passwort stimmt nicht.');
  B.tippe('#loginUser', 'peter.a'); B.tippe('#loginPw', pw + 'x'); B.absenden('#loginGo');
  assert.equal(await B.meldung('#loginMsg'), 'Benutzername oder Passwort stimmt nicht.');

  // zweites Geraet: nur Anmeldename und Passwort -> dieselbe Person, ohne Startcode, ohne Wiederherstellungscode
  B.tippe('#loginUser', 'peter.a'); B.tippe('#loginPw', pw); B.absenden('#loginGo');
  await B.warten(() => B.wert('adultUser'), 'Anmeldung auf dem zweiten Geraet');
  assert.equal(B.erwachsen().user, 'peter.a');
  assert.deepEqual(B.liste(), [{ id: kennung, user: 'peter.a', art: 'parent' }], 'gleiche Kennung auf beiden Geraeten');
  assert.deepEqual(B.offen(), [kennung]);
  assert.notEqual(JSON.parse(B.S.ablage.get('bq2_evDevice')), JSON.parse(A.S.ablage.get('bq2_evDevice')), 'je Geraet eigene Kennung');

  // Abmelden: Sitzung und Schluesselkopie weg; Geraeteliste bleibt (Who's here, Anmeldename)
  B.S.lauf(() => B.S.holen('logout')());
  assert.equal(B.erwachsen(), null); assert.deepEqual(B.offen(), []); assert.equal(B.S.ablage.get('bq2_adultSession'), undefined);
  assert.equal(B.liste().length, 1);
});

test('2 Kind: Startcode getippt -> eigenes Passwort, kein Wiederherstellungscode; zweites Geraet; Geschwister; falsche Rolle', async (t) => {
  const W = await welt();
  await W.elternteil('mama.b');
  const codeK = await W.startcode('kathie.b', 'child', 'mama.b'), codeL = await W.startcode('lena.b', 'child', 'mama.b');
  const A = geraet(t, W.w, { name: 'Kathies iPad' });
  await anmelden(A, 'student', 'kathie.b', codeK);
  await A.wartenAuf('#setPwForm');
  assert.ok(A.text().includes('It works on every device you log in to'), 'Kinder: Englisch');
  assert.ok(A.text().includes('Idea'));
  const pwK = await passwortWaehlen(A);
  await A.wartenAuf('#welcomeGo');
  assert.equal(A.da('#recCode'), false, 'Kinder haben keinen Wiederherstellungscode');
  assert.ok(A.text().includes('Welcome to Big Quest!'));
  A.klick('#welcomeGo');
  const k = A.liste()[0];
  assert.deepEqual([k.user, k.art], ['kathie.b', 'child']);
  assert.deepEqual(A.sitzung(), { user: 'kathie.b', id: k.id }, 'Kind angemeldet, Daten unter seiner Kennung');
  assert.deepEqual(A.wert("store.get('kidsHere',[])"), [k.id]);
  assert.equal(A.S.zustand().screen, 'home');

  // ueben schreibt unter der Kennung des Kindes
  A.S.karteOeffnen(A.S.alleKarten().find((x) => !x.studio));
  A.S.frageBeantworten(A.S.zustand().round[0]);
  assert.ok([...A.S.ablage.keys()].some((x) => x.startsWith('bq2_' + k.id + '__events')), 'Ereignisse unter der Kennung');

  // ein Geschwisterkind nimmt das iPad, waehrend Kathie noch angemeldet ist ("Someone else?" auf der Anmeldeseite)
  A.S.lauf(() => A.S.holen('showLogin')('student'));
  assert.deepEqual(A.offen(), [k.id], 'Kathies Schluessel noch da');
  // "Passwort vergessen?" beim Kind: Hinweis auf einen neuen Startcode, keine Wiederherstellung
  assert.ok(A.text().includes("Who's here?") && A.text().includes('kathie.b'), "Who's here? zeigt Kathie");
  A.klick('#loginForgot');
  assert.equal(A.im('#loginMsg').textContent, 'Ask your grown-up for a new start code.');
  assert.equal(A.da('#forgotForm'), false);

  // Geschwister am selben Geraet: Lena meldet sich an, Kathies Schluessel verlaesst das Geraet
  await anmelden(A, 'student', 'lena.b', codeL);
  const pwL = await passwortWaehlen(A);
  await A.wartenAuf('#welcomeGo'); A.klick('#welcomeGo');
  const lena = A.liste().find((e) => e.user === 'lena.b');
  assert.deepEqual(A.offen(), [lena.id], 'nur das angemeldete Kind behaelt seine Schluesselkopie');
  // Wechsel zurueck zu Kathie ueber "Who's here?" - mit ihrem Passwort
  A.S.lauf(() => A.S.holen('logout')());
  A.klick('#roleStudent');
  A.klick('[data-kidpick="kathie.b"]');
  assert.equal(A.im('#loginUser').value, 'kathie.b');
  A.tippe('#loginPw', pwK); A.absenden('#loginGo');
  await A.warten(() => A.sitzung() && A.sitzung().user === 'kathie.b', 'Kathie wieder angemeldet');
  assert.deepEqual(A.offen(), [k.id]);

  // zweites Geraet: Name und Passwort; die Rolle muss passen
  const B = geraet(t, W.w, { name: 'Familien-Laptop' });
  await anmelden(B, 'adult', 'kathie.b', pwK);
  assert.equal(await B.meldung('#loginMsg'), 'Benutzername oder Passwort stimmt nicht.', 'Kinderkonto im Erwachsenen-Formular');
  B.klick('#loginBack'); await anmelden(B, 'student', 'kathie.b', pwK);
  await B.warten(() => B.sitzung(), 'Kind auf dem zweiten Geraet');
  assert.deepEqual(B.sitzung(), { user: 'kathie.b', id: k.id }, 'dieselbe Kennung');
  assert.equal(B.wert('adultUser'), null);
  const pw2 = await kontoAnmelden({ zugang: W.z, anmeldename: 'lena.b', passwort: pwL });
  assert.equal(pw2.art, 'child', 'Lenas Passwort oeffnet ihr Konto im Speicher');
});

test('3 Passwort vergessen (Erwachsene): Wiederherstellungscode -> neues Passwort -> neuer Code; alte gelten nicht mehr', async (t) => {
  const W = await welt();
  const A = geraet(t, W.w, { name: 'Lehrkraft-Laptop' });
  await anmelden(A, 'adult', 'lehrkraft', await W.startcode('lehrkraft', 'teacher'));
  const pw1 = await passwortWaehlen(A);
  await A.wartenAuf('#recCode');
  const code1 = A.im('#recCode').textContent;
  A.klick('#recGo'); await A.wartenAuf('#welcomeGo'); A.klick('#welcomeGo');
  assert.equal(A.erwachsen().role, 'teacher');
  const kennung = A.liste()[0].id;

  // anderes Geraet: "Passwort vergessen?" - der Passwortspeicher fuellt den eigenen Eintrag des Codes aus
  const B = geraet(t, W.w, { name: 'Lehrkraft-iPad' });
  B.klick('#roleAdult'); B.klick('#loginForgot');
  await B.wartenAuf('#forgotForm');
  assert.equal(B.im('#forgotUser').getAttribute('autocomplete'), 'username');
  assert.equal(B.im('#forgotCode').getAttribute('autocomplete'), 'current-password');
  // erst ein falscher Code: zurueck mit Meldung, nichts geaendert
  B.tippe('#forgotUser', 'lehrkraft (Wiederherstellungscode)'); B.tippe('#forgotCode', 'ABCD-EFGH-JKMN-PQRS-TUVW');
  B.absenden('#forgotGo');
  await B.wartenAuf('#setPwForm');
  assert.ok(B.text().includes('Neues Passwort wählen'));
  assert.equal(B.im('input[autocomplete="username"]').value, 'lehrkraft', 'neues Passwort fuer den Eintrag der Anmeldung, nicht den des Codes');
  await passwortWaehlen(B);
  await B.wartenAuf('#forgotForm');
  assert.equal(await B.meldung('#forgotMsg'), 'Benutzername oder Wiederherstellungscode stimmt nicht.');
  // jetzt der richtige Code (klein und ohne Striche getippt geht auch)
  B.tippe('#forgotUser', 'lehrkraft (Wiederherstellungscode)'); B.tippe('#forgotCode', code1.toLowerCase().replace(/-/g, ' '));
  B.absenden('#forgotGo');
  const pw2 = await passwortWaehlen(B);
  await B.wartenAuf('#recCode');
  const code2 = B.im('#recCode').textContent;
  assert.notEqual(code2, code1, 'sofort ein neuer Code');
  assert.equal(B.im('#recForm input[autocomplete="username"]').value, 'lehrkraft (Wiederherstellungscode)', 'derselbe eigene Eintrag bekommt den neuen Code');
  B.klick('#recGo');
  assert.equal(B.erwachsen().user, 'lehrkraft', 'danach angemeldet');
  assert.deepEqual(B.liste().map((e) => e.id), [kennung], 'dieselbe Person');

  // drittes Geraet: altes Passwort nein, neues ja; alter Code nein
  const C = geraet(t, W.w, { name: 'Schul-PC' });
  await anmelden(C, 'adult', 'lehrkraft', pw1);
  assert.equal(await C.meldung('#loginMsg'), 'Benutzername oder Passwort stimmt nicht.', 'altes Passwort gilt nicht mehr');
  C.tippe('#loginPw', pw2); C.absenden('#loginGo');
  await C.warten(() => C.wert('adultUser'), 'neues Passwort');
  C.S.lauf(() => C.S.holen('logout')());
  C.klick('#roleAdult'); C.klick('#loginForgot');
  C.tippe('#forgotUser', 'lehrkraft'); C.tippe('#forgotCode', code1); C.absenden('#forgotGo');
  await passwortWaehlen(C);
  await C.wartenAuf('#forgotForm');
  assert.equal(await C.meldung('#forgotMsg'), 'Benutzername oder Wiederherstellungscode stimmt nicht.', 'alter Code gilt nicht mehr');
  // und das erste Geraet bleibt angemeldet (kein Abmelden aus der Ferne in dieser Aufgabe)
  assert.equal(A.erwachsen().user, 'lehrkraft');
});

test('3b Fehler beim ersten Mal: abgelaufener oder fremder Startcode, kein Speicher - verstaendliche Meldung, zurueck moeglich', async (t) => {
  const W = await welt();
  // ein Startcode, der vor 8 Tagen ausgestellt wurde
  const alt = await startcodeAusstellen({ zugang: W.z, aussteller: null, anmeldename: 'admin.alt', art: 'admin', now: Date.now() - 8 * 864e5 });
  const A = geraet(t, W.w, { name: 'Geraet A' });
  await anmelden(A, 'adult', 'admin.alt', alt.code);
  await passwortWaehlen(A);
  assert.match(await A.meldung('#setPwMsg'), /abgelaufen|gilt nicht/, 'abgelaufen');
  A.klick('#setPwBack');
  assert.ok(A.da('#loginForm'), 'zurueck zur Anmeldung');
  // Startcode, den es nicht gibt
  A.tippe('#loginUser', 'niemand'); A.tippe('#loginPw', 'Ab3_-xY9Ab3_-xY9Ab3_-x'); A.absenden('#loginGo');
  await passwortWaehlen(A);
  assert.equal(await A.meldung('#setPwMsg'), 'Dieser Startcode gilt nicht (mehr). Bitte einen neuen geben lassen.');
  // Speicher nicht erreichbar
  const code = await W.startcode('anna.c', 'parent');
  const Z = W.w.geraet('d_aus');
  const B = geraet(t, { geraet: () => Z }, { name: 'Geraet offline' });
  Z.offline();
  await anmelden(B, 'adult', 'anna.c', code);
  assert.equal(await B.meldung('#loginMsg'), 'Die App erreicht ihren Speicher gerade nicht. Bitte später erneut versuchen.');
  Z.online();
  B.absenden('#loginGo');
  await B.wartenAuf('#setPwForm');
});

test('4 Testinstanz: ohne Zugangsschluessel fragt die Anmeldeseite einmal danach', async (t) => {
  const A = geraet(t, null, { name: 'iPad ohne Zugang', anpassen: (h) => h.replace('globalThis.__bqWelt', () => JSON.stringify({ art: 'github', repo: 'pahlborn/bis-school-app-testdaten', wurzel: '' })) });
  assert.equal(A.wert('KONTO_UI'), true);
  assert.ok(A.da('#kontoTokenForm'), 'Feld fuer den Zugang');
  A.klick('#roleAdult'); A.tippe('#loginUser', 'peter.a'); A.tippe('#loginPw', 'irgendwas-langes-1'); A.absenden('#loginGo');
  assert.equal(A.im('#loginMsg').textContent, 'Die App erreicht ihren Speicher gerade nicht. Bitte später erneut versuchen.');
  A.klick('#loginBack');
  A.tippe('#kontoToken', 'kein token'); A.absenden('#kontoTokenGo');
  assert.equal(A.im('#kontoTokenMsg').textContent, 'This key does not look right. Please check it.');
  assert.equal(A.S.ablage.get('bqt_gh'), undefined);
  A.tippe('#kontoToken', ' github_pat_' + 'A1b2C3d4'.repeat(10) + ' '); A.absenden('#kontoTokenGo');
  assert.equal(A.S.ablage.get('bqt_gh'), 'github_pat_' + 'A1b2C3d4'.repeat(10), 'gespeichert unter bqt_gh');
  assert.equal(A.da('#kontoTokenForm'), false, 'danach nicht mehr gefragt');
  assert.ok(A.da('#roleAdult'));
});

test('5 Kathies App und der Testbau mit konten.json bleiben beim alten Weg; kein Konto-Modul im Live-Bau', async (t) => {
  const live = appLesen('utf8', { bauart: 'live' }), testbau = appLesen('utf8', { bauart: 'test' });
  for (const s of ['function ersteAnmeldung(', 'function kontoLookup(', 'function anmStartlinkLesen(', 'function anmCodeDatei(', 'function githubSpeicher(', 'function lokalerSpeicher('])
    { assert.equal(live.includes(s), false, 'Live-Bau ohne ' + s); assert.equal(testbau.includes(s), true, 'Testbau mit ' + s); }
  // Suchlauf: nicht einmal die Namen der Konto- und GitHub-Funktionen stehen im Live-Bau (index.html ruft nur Modul anmeldung)
  for (const w of ['ersteAnmeldung', 'startcodeAusstellen', 'wiederherstellen', 'kontoLookup', 'kontoName', 'bq-verzeichnis', 'githubSpeicher', 'githubToken', 'api.github.com', 'bqt_'])
    assert.equal(live.includes(w), false, 'Live-Bau nennt ' + w);
  // Live-Bau: auch mit einem Speicher an der Marke kein Konto-Modus (die Module fehlen)
  const L = appSandbox({ bauart: 'live', anpassen: (h) => h.replace('/*BQ_SPEICHER*/null', '{art:"github",repo:"x/y"}') });
  assert.equal(L.lauf(() => L.holen('KONTO_UI')), false);
  assert.equal(L.lauf(() => L.holen('accountsOn')()), false, 'ohne konten.json: ohne Anmeldung wie bisher');
  // Testbau ohne Speicher (alle bisherigen Testbau-Tests): kein Konto-Modus
  const T = appSandbox({ bauart: 'test' });
  assert.equal(T.lauf(() => T.holen('KONTO_UI')), false);
  assert.equal(T.lauf(() => T.holen('APP_ACCOUNTS')), null);
  // Testbau mit konten.json und Speicher: konten.json gilt (Kathies Konten), kein Konto-Modus
  const mia = kennungErzeugen(), papa = kennungErzeugen();
  const konten = { version: 2, users: [{ id: mia, user: 'mia', kind: 'child', start: (await konto('mia', 'student', 'MIA-1234')).start }, { id: papa, user: 'papa', kind: 'adult', start: (await konto('papa', 'parent', 'PAPA-1234')).start }], guardians: [{ adult: papa, child: mia }] };
  const K = appSandbox({ bauart: 'test', anpassen: (h) => kontenEinsetzen(h, konten).toString('utf8').replace('/*BQ_SPEICHER*/null', '{art:"github",repo:"x/y"}') });
  assert.equal(K.lauf(() => K.holen('KONTO_UI')), false);
  assert.deepEqual(roh(K.lauf(() => K.holen('APP_ACCOUNTS').users.map((u) => u.user))), ['mia', 'papa']);
  // die Anleitungen im Live-Bau sind die bisherigen
  const g = L.lauf(() => L.holen('GUIDE_ADULT_DE'));
  assert.ok(g.includes('Der Startcode gilt weiter') && !g.includes('Wiederherstellungscode'));
});

test('6 Konto-Modus: Anleitungen und Willkommen sprechen von einem Passwort fuer alle Geraete und vom Wiederherstellungscode', async (t) => {
  const A = geraet(t, lokalerSpeicher(), { name: 'Anleitungen' });
  const g = (n) => A.S.lauf(() => A.S.holen(n));
  const alle = ['GUIDE_KID', 'GUIDE_ADULT_DE', 'GUIDE_ADULT_EN', 'GUIDE_TEACHER_DE', 'GUIDE_TEACHER_EN', 'GUIDE_ADMIN_DE', 'GUIDE_ADMIN_EN'].map((n) => [n, g(n)]);
  for (const [n, txt] of alle) {
    assert.ok(!/Der Startcode gilt weiter|start code keeps working|nur auf diesem Gerät\.|only on this device\.|works only on this device|Familienpasswort eingeben|enter the family password/.test(txt), n + ': alter Weg erwaehnt');
  }
  for (const n of ['GUIDE_ADULT_DE', 'GUIDE_TEACHER_DE']) assert.ok(g(n).includes('Wiederherstellungscode') && g(n).includes('Passwort vergessen?'), n);
  for (const n of ['GUIDE_ADULT_EN', 'GUIDE_TEACHER_EN']) assert.ok(g(n).includes('recovery code') && g(n).includes('Forgot your password?'), n);
  assert.ok(g('GUIDE_KID').includes('On another iPad, use the same user name and password.'));
  assert.ok(!/recovery|Wiederherstellung/i.test(g('GUIDE_KID')), 'Kinderhilfe ohne Erwachsenen-Themen');
  assert.ok(g('GUIDE_ADMIN_DE').includes('gilt einmal und 7 Tage'));
});

test('7 Testinstanz (Praefix bqt_): Anmeldung mit Startcode und auf dem zweiten Geraet; nur bqt_-Eintraege, Kathies Eintraege bleiben gleich', async (t) => {
  const ERSATZ = await ersatzLesen();
  const KATHIE = { bq2_name: JSON.stringify('KATHIE-ECHT'), bq2_session: JSON.stringify({ user: 'kathie', id: 'p_71ANFJ3X5V35ZD7H22W1WB4107' }), bq2_evDevice: JSON.stringify('d_KATHIE'), bq2_kontoListe: '[]', bq_abgleich: '{}' };
  const W = await welt();
  await W.elternteil('peter.b');
  const codeP = await W.startcode('anna.b', 'parent'), codeK = await W.startcode('kathie.b', 'child', 'peter.b');
  const opt = { praefix: 'bqt_', speicher: { ...KATHIE }, anpassen: (h) => testinstanzUmwandeln(h, ERSATZ) };
  const A = geraet(t, W.w, { name: 'Testinstanz iPad', ...opt });
  assert.equal(A.wert('KONTO_UI'), true);
  await anmelden(A, 'adult', 'anna.b', codeP);
  const pw = await passwortWaehlen(A);
  await A.wartenAuf('#recCode'); A.klick('#recGo'); await A.wartenAuf('#welcomeGo'); A.klick('#welcomeGo');
  assert.equal(A.erwachsen().user, 'anna.b');
  A.S.lauf(() => A.S.holen('logout')());
  await anmelden(A, 'student', 'kathie.b', codeK);
  await passwortWaehlen(A); await A.wartenAuf('#welcomeGo'); A.klick('#welcomeGo');
  assert.equal(A.sitzung().user, 'kathie.b');
  A.S.karteOeffnen(A.S.alleKarten().find((x) => !x.studio));
  A.S.frageBeantworten(A.S.zustand().round[0]);
  const B = geraet(t, W.w, { name: 'Testinstanz Laptop', ...opt });
  await anmelden(B, 'adult', 'anna.b', pw);
  await B.warten(() => B.wert('adultUser'), 'zweites Geraet');
  for (const G of [A, B]) {
    for (const [k, v] of Object.entries(KATHIE)) assert.equal(G.S.ablage.get(k), v, G.name + ' unveraendert: ' + k);
    const neu = [...G.S.ablage.keys()].filter((k) => !(k in KATHIE));
    assert.deepEqual(neu.filter((k) => !k.startsWith('bqt_')), [], G.name + ': nur bqt_ geschrieben');
    assert.ok(neu.includes('bqt_kontoListe') && neu.includes('bqt_evDevice'), G.name + ': ' + neu.join(', '));
  }
  assert.deepEqual(A.liste().map((e) => e.user), ['anna.b', 'kathie.b']);
  assert.ok([...A.S.ablage.keys()].some((k) => k.startsWith('bqt_' + A.liste()[1].id + '__events')), 'Kathie (Test) uebt unter bqt_<Kennung>');
  assert.match(A.S.lauf(() => A.S.holen('GLOBAL_KEYS').source), /\|kontoListe\)\$$/, 'Geraeteliste geraeteweit (nie Daten eines Kindes)');
});
