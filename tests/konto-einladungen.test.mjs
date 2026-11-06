// Aufgabe "Einladungen - Oberflaeche" (Stufe 3b/4; Konzept 10.2-10.4, US9.5-US9.7): die Oberflaeche des Testbaus fuer
// "Kind anlegen" (Start-QR-Code), "Zweiten Elternteil einladen" (QR mit Fingerabdruck), "Einladung zurueckziehen",
// "Passwort des Kindes neu setzen", "Meine Geraete" mit "Geraet entfernen" und "Schluessel erneuern" - und die Korrektur
// zu #134: "Schliessen" laesst Erwachsene angemeldet, am Kindergeraet einmal die Erinnerung ans Abmelden.
// Mehrere echte App-Instanzen (Testbau in der Node-Sandbox) mit eigenem localStorage teilen nur den simulierten Speicher.
// Bedient wird mit Klicks auf die Knoepfe der App und Eingaben in ihre Felder. Zeitgeber laufen in der Sandbox nicht: was
// in der App der Takt (QR-Code alle 4 s, sonst jede Minute) ausloest, ruft der Test als kontoAbgleich() der App auf.
//   1 Familie: Kind anlegen (vorher abgeglichen) -> Kind wartet -> Eltern nehmen auf -> uebt; zweiter Elternteil mit
//     Fingerabdruck sieht dasselbe Kind; Einladungen zurueckziehen (im QR und in der Liste); neues Passwort des Kindes
//     ohne Datenverlust (Zaehlprobe); Schluessel erneuern -> der andere Elternteil sieht die neuen Pruefwoerter
//   2 Meine Geraete: Liste (Name, dieses Geraet), Kindergeraet entfernen -> "Jetzt neues Passwort fuer ...?"; eigenes
//     Geraet entfernen mit neuem Schluessel; was das entfernte Geraet danach schickt, zaehlt nicht
//   3 Schliessen / Abmelden (Konzept 10.4)
//   4 Kathies App (Live-Bau) und Testbau mit konten.json: nichts davon
//   node --test tests/konto-einladungen.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appSandbox } from './app-sandbox.mjs';
import { appLesen } from '../werkzeug/module.mjs';
import { kontenEinsetzen, kennungErzeugen } from '../werkzeug/konten.mjs';
import { konto } from './konten-hilfen.mjs';
import { lokalerSpeicher } from '../src/module/speicher.mjs';
import { startcodeAusstellen, ersteAnmeldung, anmelden as kontoAnmelden, kontoLookup } from '../src/module/konto.mjs';
import { anmStartlink } from '../src/module/anmeldung.mjs';
import { qrSvg } from '../src/module/qrcode.mjs';
import { keyFingerprint } from '../src/module/krypto.mjs';

const RUNDEN = 1000;
const warte = (ms) => new Promise((r) => setTimeout(r, ms));
const roh = (x) => (x === undefined ? x : JSON.parse(JSON.stringify(x)));
const UA = {
  ipad: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
};

/* eine App-Instanz (ein Geraet) am gemeinsamen Speicher */
function geraet(t, welt, { name, hash = '', ua = UA.ipad, speicher = {}, anpassen } = {}) {
  const S = appSandbox({
    bauart: 'test', seite: true, speicher,
    anpassen: (h) => { const a = h.replace('/*BQ_SPEICHER*/null', 'globalThis.__bqWelt'); return anpassen ? anpassen(a) : a; },
    globale: {
      __bqWelt: welt,
      location: { href: 'http://127.0.0.1/' + hash, origin: 'http://127.0.0.1', protocol: 'http:', host: '127.0.0.1', hostname: '127.0.0.1', pathname: '/', search: '', hash, replace() {}, reload() {}, assign() {} },
      File: class { constructor(teile, n, o) { this.text = teile.join(''); this.name = n; this.type = o && o.type; } },
      navigator: { userAgent: ua, language: 'de-DE', languages: ['de-DE'], onLine: true, standalone: false, canShare: () => false }
    }
  });
  t.diagnostic(name + ': BQ_SEED=' + S.seed);
  const G = { S, name };
  const finde = (sel) => S.lauf(() => S.$('#loginBody').querySelector(sel) || S.$('#aboutBody').querySelector(sel));
  G.im = finde;
  G.da = (sel) => !!finde(sel);
  G.text = () => S.lauf(() => S.$('#loginBody').textContent);
  G.eltern = () => S.lauf(() => S.$('#aboutBody').textContent);
  G.klick = (sel) => S.lauf(() => { const e = finde(sel) || (/^#[\w-]+$/.test(sel) && S.ctx.document.querySelector('body').querySelector(sel)); if (!e) throw new Error(name + ': nicht gefunden ' + sel); e.click(); });
  G.tippe = (sel, v) => S.lauf(() => { const e = finde(sel); if (!e) throw new Error(name + ': Feld fehlt ' + sel); e.value = v; });
  G.absenden = (knopf) => S.lauf(() => {
    const k = finde(knopf); if (!k) throw new Error(name + ': Knopf fehlt ' + knopf);
    k.click(); const f = k.closest('form');
    f.dispatchEvent({ type: 'submit', target: f, currentTarget: f, preventDefault() {}, stopPropagation() {} });
  });
  G.warten = async (bed, was, ms = 30000) => {
    const t0 = Date.now();
    for (;;) { if (S.lauf(bed)) return; if (Date.now() - t0 > ms) throw new Error(name + ': wartet vergeblich auf ' + was + ' - Login: ' + G.text().slice(0, 200) + ' | Eltern: ' + G.eltern().slice(0, 400)); await warte(15); }
  };
  G.wartenAuf = (sel) => G.warten(() => G.da(sel), sel);
  G.meldung = async (sel) => { await G.warten(() => { const m = finde(sel); return m && m.textContent && !/[Mm]oment/.test(m.textContent); }, 'Meldung ' + sel); return finde(sel).textContent; };
  G.wert = (n) => roh(S.lauf(() => S.holen(n)));
  G.erwachsen = () => G.wert('adultUser');
  G.sitzung = () => JSON.parse(S.ablage.get('bq2_session') || 'null');
  G.liste = () => JSON.parse(S.ablage.get('bq2_kontoListe') || '[]');
  G.offen = () => S.lauf(() => [...S.holen('kontoOffen').keys()]);
  /* was in der App der Takt ausloest: ein Abgleich */
  G.sync = () => S.lauf(() => S.holen('kontoAbgleich')());
  /* ⚙ Einstellungen (im Browser: Klick auf ⚙ -> Adresse #eltern/einstellungen -> hashchange) */
  G.einstellungen = (sec) => S.lauf(() => { S.ctx.location.hash = '#eltern/einstellungen' + (sec ? '/' + sec : ''); S.holen('applyParentRoute')(); });
  G.abschnitt = (id) => S.lauf(() => { const d = S.$('#aboutBody').querySelector(`details.psec[data-psec="${id}"]`); return d ? d.textContent : null; });
  G.antworten = (kind) => JSON.parse(S.ablage.get('bq2_' + kind + '__events') || '[]').filter((e) => e.type === 'answer').map((e) => e.id).sort();
  return G;
}

async function anmelden(G, rolle, name, pw) {
  if (G.da('#roleStudent')) G.klick(rolle === 'student' ? '#roleStudent' : '#roleAdult');
  G.tippe('#loginUser', name); G.tippe('#loginPw', pw);
  G.absenden('#loginGo');
}
async function passwortWaehlen(G) {
  await G.wartenAuf('#setPwForm');
  G.klick('#pwUse');
  const pw = G.im('#newPw1').value;
  G.absenden('#setPwGo');
  return pw;
}
/* Erwachsener mit Startlink (Rolle, Passwort, Code, Willkommen) -> { pw, code } */
async function erwachsenStart(G) {
  G.klick('#roleAdult'); G.absenden('#loginGo');
  const pw = await passwortWaehlen(G);
  await G.wartenAuf('#recCode');
  const rc = G.im('#recCode').textContent;
  G.klick('#recGo'); await G.wartenAuf('#welcomeGo'); G.klick('#welcomeGo');
  await G.sync();
  return { pw, rc };
}
const link = (l) => l.slice(l.indexOf('#'));
/* der Startlink, den der QR-Code zeigt (das SVG des QR-Codes muss genau diesen Link tragen) */
function qrLink(G, anmeldename) {
  const code = G.im('#kCode').textContent, d = G.S.lauf(() => G.S.$('#aboutBody').querySelector('#kQr path').getAttribute('d'));
  for (const fp of [G.fp]) {
    const l = anmStartlink('http://127.0.0.1/', { anmeldename, code, fingerabdruck: fp });
    if (d && d === /<path fill="#000" d="([^"]*)"/.exec(qrSvg(l, { ecc: 'M', rand: 4 }))[1]) return { code, link: l };
  }
  throw new Error('QR-Code traegt nicht den erwarteten Startlink');
}
/* ein Admin vom Werkzeug; startlink(name) = Startlink mit Fingerabdruck fuer einen Erwachsenen */
async function welt() {
  const w = lokalerSpeicher(), z = w.geraet('d_Werkzeug1');
  const sc = await startcodeAusstellen({ zugang: z, aussteller: null, anmeldename: 'admin', art: 'admin', now: Date.now() });
  const admin = await ersteAnmeldung({ zugang: z, code: sc.code, passwort: 'Werkzeug-Admin-Passwort-1', now: Date.now(), runden: RUNDEN });
  return {
    w, z,
    startlink: async (name) => { const s = await startcodeAusstellen({ zugang: z, aussteller: admin, anmeldename: name, art: 'parent', now: Date.now() }); return link(anmStartlink('http://127.0.0.1/', { anmeldename: name, code: s.code, fingerabdruck: s.fingerabdruck })); }
  };
}
/* Peter auf seinem Geraet, im ⚙ "Familie" */
async function peter(t, W, name = 'peter.a', ua = UA.windows) {
  const P = geraet(t, W.w, { name: 'Peters Laptop', hash: await W.startlink(name), ua });
  const { pw, rc } = await erwachsenStart(P);
  P.pw = pw; P.rc = rc; P.kennung = P.liste()[0].id;
  P.fp = await keyFingerprint(P.S.lauf(() => P.S.holen('kontoOffen').get(P.kennung).pub));
  return P;
}
/* Kind anlegen in der App (Klicks) -> QR -> { code, link, name } */
async function kindAnlegen(P, vorname, erwarteterName) {
  P.einstellungen('familie');
  P.klick('#kKindAnlegen');
  await P.wartenAuf('#kKindForm');
  P.tippe('#kKindName', vorname); P.absenden('#kKindWeiter');
  await P.wartenAuf('#kKind2Form');
  assert.equal(P.im('#kKindLogin').value, erwarteterName, 'Vorschlag der App fuer den Anmeldenamen');
  P.absenden('#kKindGo');
  await P.wartenAuf('#kQr');
  return { ...qrLink(P, erwarteterName), name: erwarteterName };
}
/* das Kind meldet sich mit dem QR-Link an, waehlt ein Passwort und wartet auf die Eltern -> Passwort */
async function kindStart(K, P) {
  K.klick('#roleStudent'); K.absenden('#loginGo');
  const pw = await passwortWaehlen(K);
  await K.wartenAuf('#kidWait');
  assert.equal(K.sitzung(), null, 'noch nicht angemeldet: wartet');
  await P.sync();                                                       // = Takt des QR-Codes auf dem Elterngeraet
  K.klick('#kidWaitAgain');
  await K.wartenAuf('#welcomeGo'); K.klick('#welcomeGo');
  return pw;
}
function ueben(K, n = 1) {
  for (let i = 0; i < n; i++) { K.S.karteOeffnen(K.S.alleKarten().find((x) => !x.studio)); K.S.frageBeantworten(K.S.zustand().round[0]); }
}

test('1 Familie: Kind anlegen (Start-QR), Kind wartet bis zur Aufnahme; zweiter Elternteil mit Fingerabdruck; zurueckziehen; neues Passwort ohne Datenverlust; Schluessel erneuern', async (t) => {
  const W = await welt();
  const P = await peter(t, W);
  assert.equal(P.erwachsen().user, 'peter.a');
  assert.ok(P.da('#parentLeave') && P.da('#parentClose'), 'Kopf: Schliessen und Abmelden');

  // ⚙ Familie: noch kein Kind, Knopf "Kind anlegen", "Zweiten Elternteil einladen"
  P.einstellungen('familie');
  assert.match(P.abschnitt('family'), /Noch kein Kind angelegt\./);
  assert.ok(P.da('#kElternEinladen'));

  // Kind anlegen: Vorname -> Vorschlag -> Start-QR-Code; das Elterngeraet hat vorher und nachher abgeglichen
  const kq = await kindAnlegen(P, 'Kathie', 'kathie');
  // vorher und nachher abgeglichen: die Einladung (invite_set) ist schon gesendet, wenn der QR-Code erscheint
  const pst = JSON.parse(P.S.ablage.get('bq_abgleich'))['person:' + P.kennung];
  assert.ok(pst.log.some((x) => x.event.type === 'invite_set') && pst.ausgang.length === 0, 'Einladung schon im Speicher');
  assert.match(P.eltern(), /Start-QR-Code für Kathie/);
  assert.match(P.im('#kQrStatus').textContent, /Warte auf die erste Anmeldung/);
  assert.ok(kq.link.endsWith('/' + P.fp), 'der QR-Code traegt die Pruefwoerter (Fingerabdruck) des Elternteils');
  // die Einladung liegt schon im Speicher: der Code gilt (ohne ihn zu verbrauchen sieht man das am Verzeichnis nicht -
  // darum direkt mit dem Kindergeraet)
  const K = geraet(t, W.w, { name: 'Kathies iPad', hash: link(kq.link) });
  const pwK = await kindStart(K, P);
  assert.equal(K.sitzung().user, 'kathie');
  assert.match(P.im('#kQrStatus').textContent, /✓ Kathie ist angemeldet/, 'QR-Code: Status nach dem Takt');
  assert.equal(P.da('#kQrWeg'), false, 'eingeloest: nichts mehr zurueckzuziehen');
  P.klick('#kQrFertig');
  assert.match(P.abschnitt('family'), /✓ Kathie ist angemeldet und gehört zur Familie\./);
  assert.match(P.abschnitt('family'), /Kathie\s*\(kathie\)/);

  // Kathie uebt; nach dem Abgleich sieht Peter ihren Stand
  ueben(K, 3);
  const antwortenK = K.antworten(K.sitzung().id);
  assert.equal(antwortenK.length, 3);
  await K.sync(); await P.sync();
  assert.deepEqual(P.antworten(K.sitzung().id), antwortenK, 'Peter hat Kathies Antworten');
  assert.deepEqual(P.wert('kidChoices()'), ['kathie'], 'Kathie in Peters Kinderauswahl');

  // zweiten Elternteil einladen: QR mit Peters Fingerabdruck
  P.einstellungen('familie');
  P.klick('#kElternEinladen');
  await P.wartenAuf('#kElternForm');
  P.tippe('#kElternLogin', 'Anna.A'); P.absenden('#kElternGo');
  await P.wartenAuf('#kQr');
  assert.match(P.eltern(), /Einladung für anna\.a/);
  const aq = qrLink(P, 'anna.a');
  const A = geraet(t, W.w, { name: 'Annas iPhone', hash: link(aq.link), ua: UA.iphone });
  const annaPw = (await erwachsenStart(A)).pw;
  await P.sync();
  assert.match(P.im('#kQrStatus').textContent, /✓ anna\.a gehört jetzt zur Familie\./);
  P.klick('#kQrFertig');
  assert.equal(P.da('#kElternEinladen'), false, 'zwei Eltern: kein Einladen mehr');
  await A.sync();
  assert.deepEqual(A.wert('kidChoices()'), ['kathie'], 'Anna sieht dasselbe Kind');
  assert.deepEqual(A.antworten(K.sitzung().id), antwortenK, 'mit demselben Stand');
  A.einstellungen('familie');
  assert.match(A.abschnitt('family'), /Kathie\s*\(kathie\)/);

  // zurueckziehen: im QR-Code ...
  P.einstellungen('familie');
  const bq = await kindAnlegen(P, 'Ben', 'ben');
  P.klick('#kQrWeg');
  await P.warten(() => !P.da('#kQr'), 'zurueck in ⚙');
  assert.match(P.abschnitt('family'), /Die Einladung für Ben ist zurückgezogen\./);
  // ... und in der Liste der offenen Einladungen
  const lq = await kindAnlegen(P, 'Lena', 'lena');
  P.klick('#kQrFertig');
  assert.match(P.abschnitt('family'), /Offene Einladungen[\s\S]*Lena – Kind, gültig bis/);
  const knopf = P.S.lauf(() => P.S.$('#aboutBody').querySelector('[data-kzurueck]').dataset.kzurueck);
  P.klick(`[data-kzurueck="${knopf}"]`);
  await P.warten(() => !/Offene Einladungen/.test(P.abschnitt('family') || ''), 'Liste leer');
  for (const [q, n] of [[bq, 'ben'], [lq, 'lena']]) {
    const X = geraet(t, W.w, { name: 'Geraet ' + n, hash: link(q.link) });
    X.klick('#roleStudent'); X.absenden('#loginGo');
    await passwortWaehlen(X);
    assert.equal(await X.meldung('#setPwMsg'), 'This start code does not work (any more). Please ask for a new one.', n + ': zurueckgezogen');
  }

  // Passwort des Kindes neu setzen: neuer Start-QR-Code, Kathie meldet sich auf einem neuen Geraet an - alles noch da
  P.einstellungen('familie');
  P.klick(`[data-kneu="${K.sitzung().id}"]`);
  await P.wartenAuf('#kQr');
  assert.match(P.eltern(), /Neues Passwort für Kathie/);
  const nq = qrLink(P, 'kathie');
  const K2 = geraet(t, W.w, { name: 'Kathies neues iPad' });
  K2.klick('#roleStudent'); K2.tippe('#loginUser', 'kathie'); K2.tippe('#loginPw', nq.code); K2.absenden('#loginGo');
  const pwK2 = await passwortWaehlen(K2);
  await K2.wartenAuf('#kidWait');
  await P.sync();
  assert.match(P.im('#kQrStatus').textContent, /✓ Kathie hat ein neues Passwort\./);
  K2.klick('#kidWaitAgain');
  await K2.wartenAuf('#welcomeGo'); K2.klick('#welcomeGo');
  assert.equal(K2.sitzung().id, K.sitzung().id, 'dieselbe Kennung');
  assert.deepEqual(K2.antworten(K2.sitzung().id), antwortenK, 'Zaehlprobe: dieselben 3 Antworten, nichts verloren');
  await assert.rejects(kontoAnmelden({ zugang: W.z, anmeldename: 'kathie', passwort: pwK }), (e) => e.code === 'anmeldung', 'altes Passwort gilt nicht mehr');
  assert.equal((await kontoAnmelden({ zugang: W.z, anmeldename: 'kathie', passwort: pwK2 })).art, 'child');

  // Schluessel erneuern (Peter): falsches/gleiches Passwort -> Meldung; dann neuer Code und neue Pruefwoerter
  P.klick('#kQrFertig');
  P.einstellungen('geraete');
  P.klick('#kErneuern');
  await P.wartenAuf('#kErnForm');
  assert.equal(P.im('#kErnForm input[autocomplete="username"]').value, 'peter.a');
  assert.equal(P.im('#kErnAlt').getAttribute('autocomplete'), 'current-password');
  assert.equal(P.S.lauf(() => P.S.$('#aboutBody').querySelectorAll('#kErnForm input[autocomplete="new-password"]').length), 2);
  P.tippe('#kErnAlt', P.pw + 'x'); P.klick('#kErnUse'); P.absenden('#kErnGo');
  assert.equal(await P.meldung('#kMsg'), 'Das aktuelle Passwort stimmt nicht.');
  P.tippe('#kErnAlt', P.pw); P.tippe('#kErnNeu1', P.pw); P.tippe('#kErnNeu2', P.pw); P.absenden('#kErnGo');
  assert.equal(await P.meldung('#kMsg'), 'Das neue Passwort muss sich vom aktuellen unterscheiden.');
  P.klick('#kErnUse'); const neuPw = P.im('#kErnNeu1').value; P.absenden('#kErnGo');
  await P.wartenAuf('#kCodeBox #recCode');
  const fpNeu = P.im('#kFpNeu').textContent;
  assert.notEqual(fpNeu, P.fp, 'neue Pruefwoerter');
  assert.notEqual(P.im('#recCode').textContent, P.rc, 'neuer Wiederherstellungscode');
  assert.equal(P.im('#recUser').value, 'peter.a (Wiederherstellungscode)');
  P.klick('#recGo');
  await P.sync();
  assert.deepEqual(P.wert('[...kontoAlt.keys()]'), [], 'alle Bereiche haben den neuen Schluessel (alt ist weg)');
  await A.sync();
  A.einstellungen('familie');
  assert.ok(A.abschnitt('family').includes('Der andere Elternteil hat einen neuen Schlüssel. Prüfwörter: ' + fpNeu), 'Anna sieht die neuen Pruefwoerter: ' + A.abschnitt('family'));
  // Peters neues Passwort gilt, das alte nicht; Peter sieht weiter alles (neues Kind-Ereignis kommt an)
  await assert.rejects(kontoAnmelden({ zugang: W.z, anmeldename: 'peter.a', passwort: P.pw }), (e) => e.code === 'anmeldung');
  assert.equal((await kontoAnmelden({ zugang: W.z, anmeldename: 'peter.a', passwort: neuPw })).art, 'parent');
  ueben(K2, 1); await K2.sync(); await P.sync();
  assert.equal(P.antworten(K.sitzung().id).length, 4, 'nach dem neuen Schluessel kommt Neues an');
  assert.equal(annaPw.length > 11, true);
  // Warnungen des Abgleichs (untergeschobener Schluessel: Modul einladung, #131) erscheinen im Abschnitt "Familie"
  P.S.lauf(() => P.S.holen('kontoNachAbgleich')({ inDieApp: 0, erneuerungOffen: [], bestaetigt: [], abgelaufen: [], erneuert: [], warnungen: [{ id: 'inv_x', art: 'child', person: 'p_X', grund: 'fingerabdruck' }, { id: 'ev_y', art: 'schluessel', person: null, grund: 'unterschrift' }] }, new Map([['inv_x', { name: 'mia', display: 'Mia' }]])));
  P.einstellungen('familie');
  assert.match(P.abschnitt('family'), /⚠️ Die Einladung für Mia wurde nicht mit dem richtigen Schlüssel eingelöst\. Es wurde nichts übernommen\./);
  assert.match(P.abschnitt('family'), /⚠️ Ein Gerät wollte einen fremden Schlüssel eintragen\. Er wurde abgelehnt/);
  for (const G of [P, A, K, K2]) assert.deepEqual(G.wert('kontoFehlerListe'), [], G.name + ': keine Fehler');
});

test('2 Meine Geraete: Liste; Kindergeraet entfernen -> "Jetzt neues Passwort fuer ...?"; eigenes Geraet entfernen mit neuem Schluessel; danach zaehlt nichts vom entfernten Geraet', async (t) => {
  const W = await welt();
  const P = await peter(t, W);
  const kq = await kindAnlegen(P, 'Kathie', 'kathie');
  const K1 = geraet(t, W.w, { name: 'Kathies iPad', hash: link(kq.link), ua: UA.ipad });
  const pwK = await kindStart(K1, P);
  P.klick('#kQrFertig');
  const kid = K1.sitzung().id;
  // zweites Geraet des Kindes und Peters iPhone - nur Name und Passwort
  const K2 = geraet(t, W.w, { name: 'Familien-iPhone', ua: UA.iphone });
  await anmelden(K2, 'student', 'kathie', pwK);
  await K2.warten(() => K2.sitzung(), 'Kathie auf dem zweiten Geraet (schon aufgenommen: ohne Warten)');
  const P2 = geraet(t, W.w, { name: 'Peters iPhone', ua: UA.iphone });
  await anmelden(P2, 'adult', 'peter.a', P.pw);
  await P2.warten(() => P2.erwachsen(), 'Peter auf dem iPhone');
  await P2.sync(); await K2.sync(); await P.sync();

  P.einstellungen('geraete');
  const g = P.abschnitt('devices');
  assert.match(g, /Meine Geräte[\s\S]*Windows · Chrome \(dieses Gerät\)[\s\S]*iPhone · Safari/, g);
  assert.match(g, /Geräte von Kathie[\s\S]*iPad · Safari[\s\S]*iPhone · Safari/, g);
  const d = (G) => JSON.parse(G.S.ablage.get('bq2_evDevice'));
  assert.equal(P.da(`[data-kweg="${P.kennung}|${d(P)}"]`), false, 'dieses Geraet: kein "Entfernen" (das ist "Abmelden")');

  // Kindergeraet entfernen -> Frage nach dem neuen Passwort
  ueben(K2, 1); await K2.sync(); await P.sync();
  const vorher = P.antworten(kid);
  P.klick(`[data-kweg="${kid}|${d(K2)}"]`);
  await P.wartenAuf('#kWegJa');
  assert.match(P.eltern(), /„iPhone · Safari“ von Kathie entfernen\?/);
  P.klick('#kWegJa');
  await P.wartenAuf('#kNeuJa');
  assert.match(P.eltern(), /Jetzt neues Passwort für Kathie\?/);
  // was K2 jetzt noch schickt, zaehlt nicht
  ueben(K2, 2); await K2.sync(); await P.sync();
  assert.deepEqual(P.antworten(kid), vorher, 'nichts vom entfernten Geraet');
  ueben(K1, 1); await K1.sync(); await P.sync();
  assert.equal(P.antworten(kid).length, vorher.length + 1, 'Kathies anderes Geraet zaehlt weiter');
  P.klick('#kNeuJa');
  await P.wartenAuf('#kQr');
  assert.match(P.eltern(), /Neues Passwort für Kathie/);
  P.klick('#kQrFertig');
  P.einstellungen('geraete');
  assert.match(P.abschnitt('devices'), /Geräte von Kathie[\s\S]*iPhone · Safari[\s\S]*entfernt am/);

  // eigenes Geraet entfernen: aktuelles + neues Passwort -> neuer Schluessel, neuer Code
  P.klick(`[data-kweg="${P.kennung}|${d(P2)}"]`);
  await P.wartenAuf('#kErnForm');
  assert.match(P.eltern(), /Eigenes Gerät entfernen[\s\S]*„iPhone · Safari“ wird entfernt/);
  P.tippe('#kErnAlt', P.pw); P.klick('#kErnUse'); const neuPw = P.im('#kErnNeu1').value; P.absenden('#kErnGo');
  await P.wartenAuf('#kCodeBox #recCode');
  P.klick('#recGo');
  await P.sync();
  P.einstellungen('geraete');
  assert.match(P.abschnitt('devices').split('Geräte von')[0], /Meine Geräte[\s\S]*iPhone · Safari[\s\S]*entfernt am/);
  // das entfernte iPhone sieht nichts Neues mehr
  ueben(K1, 1); await K1.sync(); await P.sync(); await P2.sync();
  assert.equal(P.antworten(kid).length, vorher.length + 2);
  assert.equal(P2.antworten(kid).length < P.antworten(kid).length, true, 'entferntes Geraet liest das Neue nicht');
  // ein neues Geraet: neues Passwort geht, altes nicht
  const P3 = geraet(t, W.w, { name: 'Peters neues iPad' });
  await anmelden(P3, 'adult', 'peter.a', P.pw);
  assert.equal(await P3.meldung('#loginMsg'), 'Benutzername oder Passwort stimmt nicht.');
  P3.tippe('#loginPw', neuPw); P3.absenden('#loginGo');
  await P3.warten(() => P3.erwachsen(), 'neues Passwort');
  await P3.sync();
  assert.equal(P3.antworten(kid).length, P.antworten(kid).length, 'neues Geraet hat alles');
  for (const G of [P, K1, P3]) assert.deepEqual(G.wert('kontoFehlerListe'), [], G.name + ': keine Fehler');
});

test('3 Schliessen laesst Erwachsene angemeldet (Schluessel bleiben); am Kindergeraet einmal die Erinnerung ans Abmelden; Abmelden loescht nur den Schluessel des Erwachsenen', async (t) => {
  const W = await welt();
  const P = await peter(t, W);
  // eigenes Geraet ohne Kind: Schliessen -> Anmeldeseite, keine Erinnerung; "Parent / Teacher" -> wieder drin
  P.klick('#parentLeave');
  assert.equal(P.da('#kErinnerung'), false, 'kein Kindergeraet: keine Erinnerung');
  assert.equal(P.erwachsen(), null);
  assert.ok(P.S.ablage.get('bq2_adultSession'), 'angemeldet geblieben');
  assert.deepEqual(P.offen(), [P.kennung], 'Schluessel bleibt');
  P.klick('#roleAdult');
  assert.equal(P.erwachsen().user, 'peter.a', 'ohne Passwort zurueck im Elternbereich');

  // Kindergeraet: Kathie uebt, Peter meldet sich dort an
  const kq = await kindAnlegen(P, 'Kathie', 'kathie');
  const K = geraet(t, W.w, { name: 'Kathies iPad', hash: link(kq.link) });
  await kindStart(K, P);
  const kid = K.sitzung().id;
  K.klick('#adultBtn');
  await K.wartenAuf('#loginForm');
  K.tippe('#loginUser', 'peter.a'); K.tippe('#loginPw', P.pw); K.absenden('#loginGo');
  await K.warten(() => K.erwachsen(), 'Peter am Kindergeraet');
  assert.deepEqual(K.offen().sort(), [kid, P.kennung].sort());
  K.klick('#parentLeave');
  assert.ok(K.da('#kErinnerung'), 'Erinnerung ans Abmelden');
  assert.match(K.eltern(), /Auf diesem Gerät übt auch ein Kind\. Bitte melden Sie sich ab/);
  K.klick('#kErBleiben');
  assert.equal(K.S.zustand().screen, 'home', 'zurueck bei Kathie');
  assert.equal(K.sitzung().id, kid);
  assert.deepEqual(K.offen().sort(), [kid, P.kennung].sort(), 'Peter bleibt angemeldet (Schluessel bleiben)');
  K.klick('#adultBtn');
  assert.equal(K.erwachsen().user, 'peter.a', 'ohne Passwort wieder im Elternbereich');
  K.klick('#parentLeave');
  assert.equal(K.da('#kErinnerung'), false, 'nur einmal erinnert');
  assert.equal(K.S.zustand().screen, 'home');
  // Abmelden aus der Erinnerung: Peters Schluessel weg, Kathie bleibt
  K.klick('#adultBtn'); K.S.lauf(() => K.S.holen('kontoErinnert').clear());
  K.klick('#parentLeave'); K.klick('#kErAbmelden');
  assert.deepEqual(K.offen(), [kid], 'nur Kathies Schluessel bleibt');
  assert.equal(K.S.ablage.get('bq2_adultSession'), undefined);
  assert.equal(K.sitzung().id, kid, 'Kathie bleibt angemeldet');
  K.klick('#adultBtn');
  await K.wartenAuf('#loginForm');
  assert.equal(K.erwachsen(), null, 'Peter muss sich neu anmelden');
  // Abmelden im Kopf (#parentClose) am eigenen Geraet: Schluessel weg
  P.klick('#parentClose');
  assert.deepEqual(P.offen(), []);
});

test('4 Kathies App (Live-Bau) und Testbau mit konten.json: keine Familie, keine Geraete, kein Schliessen; kein Konto-Modul im Live-Bau', async (t) => {
  const live = appLesen('utf8', { bauart: 'live' }), testbau = appLesen('utf8', { bauart: 'test' });
  for (const w of ['qrMatrix', 'qrSvg', 'meineGeraete', 'geraetEntfernen', 'schluesselErneuern', 'kindPasswortNeu', 'elternteilEinladen', 'abgleichMitVerbindungen', 'anmeldenameVorschlag', 'function anmKindBereit', 'GERAETEABGLEICH_SPEICHER'])
    assert.equal(live.includes(w), false, 'Live-Bau nennt ' + w);
  for (const w of ['function qrMatrix(', 'function qrSvg(', 'function anmKindBereit(']) assert.equal(testbau.includes(w), true, 'Testbau hat ' + w);
  // Live-Bau mit Kathies Konten: Elternbereich wie bisher
  const mia = kennungErzeugen(), papa = kennungErzeugen();
  const konten = { version: 2, users: [{ id: mia, user: 'mia', kind: 'child', start: (await konto('mia', 'student', 'MIA-1234')).start }, { id: papa, user: 'papa', kind: 'adult', start: (await konto('papa', 'parent', 'PAPA-1234')).start }], guardians: [{ adult: papa, child: mia }] };
  for (const bauart of ['live', 'test']) {
    const L = appSandbox({ bauart, seite: true, anpassen: (h) => kontenEinsetzen(h, konten).toString('utf8') });
    assert.equal(L.lauf(() => L.holen('KONTO_UI')), false);
    L.lauf(() => L.holen('loginDone')(L.holen('APP_ACCOUNTS').users.find((u) => u.user === 'papa')));
    const kopf = L.lauf(() => L.$('#aboutBody').innerHTML);
    assert.ok(kopf.includes('id="parentClose"') && !kopf.includes('parentLeave'), bauart + ': nur Abmelden');
    L.lauf(() => { L.ctx.location.hash = '#eltern/einstellungen'; L.holen('applyParentRoute')(); });
    const set = L.lauf(() => L.$('#aboutBody').innerHTML);
    assert.ok(!set.includes('data-psec="family"') && !set.includes('data-psec="devices"'), bauart + ': keine Familie/Geraete');
    L.klick('#parentClose');
    assert.equal(L.lauf(() => L.holen('adultUser')), null, bauart + ': Abmelden wie bisher');
  }
});

/* was von einer Person (Kennung) noch auf einem Geraet liegt: Schluessel oder Werte, die sie nennen */
const reste = (G, id) => [...G.S.ablage.entries()].filter(([k, v]) => k.includes(id) || String(v).includes(id)).map(([k]) => k);

/* Familie fuer Test 5/6: Peter (Laptop + iPhone), Anna (iPhone), Kathie (iPad), Kathie hat 2 Antworten gegeben */
async function familieMitZweiElternGeraeten(t) {
  const W = await welt();
  const P = await peter(t, W);
  const kq = await kindAnlegen(P, 'Kathie', 'kathie');
  const K = geraet(t, W.w, { name: 'Kathies iPad', hash: link(kq.link) });
  await kindStart(K, P);
  P.klick('#kQrFertig');
  const kid = K.sitzung().id;
  P.einstellungen('familie');
  P.klick('#kElternEinladen'); await P.wartenAuf('#kElternForm');
  P.tippe('#kElternLogin', 'anna.a'); P.absenden('#kElternGo'); await P.wartenAuf('#kQr');
  const A = geraet(t, W.w, { name: 'Annas iPhone', hash: link(qrLink(P, 'anna.a').link), ua: UA.iphone });
  A.pw = (await erwachsenStart(A)).pw;
  await P.sync();
  P.klick('#kQrFertig');
  const P2 = geraet(t, W.w, { name: 'Peters iPhone', ua: UA.iphone });
  await anmelden(P2, 'adult', 'peter.a', P.pw);
  await P2.warten(() => P2.erwachsen(), 'Peter auf dem iPhone');
  ueben(K, 2);
  await K.sync(); await P.sync(); await A.sync(); await P2.sync(); await P2.sync();
  A.kennung = A.liste()[0].id;
  return { W, P, P2, A, K, kid };
}
async function kontoLoeschen(G) {
  G.einstellungen('familie');
  G.klick('#kKontoLoeschen'); await G.wartenAuf('#kKlForm');
  G.tippe('#kKlPw', G.pw); G.absenden('#kKlGo');
  await G.wartenAuf('#kKontoWeg');
}

/* die Gegenprobe zu 5 (Anna loescht ihr Konto, Peters Geraete behalten alles) und Faelle ohne App: tests/module/kinddaten.test.mjs */
test('5 Ein Elternteil loescht sein Konto, der andere bleibt: seine anderen Geraete raeumen die Kinderdaten beim naechsten Abgleich selbst weg', async (t) => {
  const { W, P, P2, A, K, kid } = await familieMitZweiElternGeraeten(t);
  assert.equal(P2.antworten(kid).length, 2, 'vorher: Peters iPhone kennt Kathies Stand');
  assert.ok(reste(P2, kid).length > 0 && reste(A, kid).length > 0);

  await kontoLoeschen(P);
  assert.equal(await W.z.directory(await kontoLookup('peter.a')), null, 'Verzeichniseintrag weg');
  assert.deepEqual(reste(P, P.kennung), [], 'Peters Laptop: nichts mehr von Peter');
  assert.deepEqual(reste(P, kid), [], 'Peters Laptop: nichts mehr von Kathie');
  // das andere Geraet weiss noch nichts - bis zum naechsten Abgleich
  assert.ok(reste(P2, kid).length > 0, 'iPhone vor dem Abgleich');
  await P2.sync();
  await P2.warten(() => !P2.erwachsen() && P2.S.sichtbar('#login'), 'Peters iPhone abgemeldet');
  assert.deepEqual(reste(P2, kid), [], 'Peters iPhone: nichts mehr von Kathie');
  assert.deepEqual(reste(P2, P.kennung), [], 'Peters iPhone: nichts mehr von Peter');
  assert.deepEqual(P2.liste(), []);
  assert.deepEqual(JSON.parse(P2.S.ablage.get('bq_abgleich') || '{}'), {}, 'kein Bereichsstand mehr');

  // Anna und Kathie sind davon nicht beruehrt: sie uebt weiter, Anna sieht es mit den neuen Schluesseln
  await A.sync(); await P2.sync();
  assert.equal(K.sitzung().id, kid, 'Kathie bleibt auf ihrem iPad angemeldet');
  ueben(K, 1); await K.sync(); await A.sync();
  assert.equal(A.antworten(kid).length, 3, 'Anna sieht Kathies Stand weiter');
  assert.equal(A.wert('kidChoices()').length, 1);
  assert.deepEqual(reste(P2, kid), [], 'Peters iPhone hat nach weiteren Abgleichen nichts neu angelegt');
  for (const G of [P, A, K, P2]) assert.deepEqual(G.wert('kontoFehlerListe'), [], G.name + ': keine Fehler');
});
