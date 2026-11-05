// Aufgabe "Abgleich in der App" (Stufe 3; Konzept 9.1, 9.4, 11): wann die App im Testbau von selbst abgleicht und was
// Erwachsene davon sehen. Echte App-Instanzen (Testbau in der Node-Sandbox) mit einer gemeinsamen stellbaren Uhr
// (tests/app-sandbox.mjs: Zeitgeber laufen erst, wenn der Test die Uhr weiterstellt) am nachgebauten GitHub-Server
// (tests/module/github-nachbau.mjs; jede Anfrage gezaehlt, 304 = zaehlt nicht gegen das Stundenlimit).
//   1 Takt: Start, Zurueckkehren, alle 30 s solange sichtbar, ohne Neues nur 304 - versteckt kein Abgleich
//   2 eigene Eintraege hoechstens alle 30 s gebuendelt; beim Verlassen der App gesendet
//   3 offline weiterueben, spaeter senden: nichts verloren, nichts doppelt, nichts ueberschrieben, Buendel lueckenlos
//   4 nie mitten in einer Runde: Neues kommt erst nach der Runde; ein eigener Eintrag waehrend des Abgleichs
//     ueberschreibt nicht, was der Abgleich gerade gebracht hat
//   5 Erwachsene: "Letzter Abgleich", kein Netz, Zugang abgelaufen (neuer Schluessel), Limit (warten statt fragen),
//     nicht Uebernommenes mit ⓘ - kein Token, keine Codes; das Kind sieht nichts davon
//   6 Schluessel auf einem anderen Geraet erneuert -> Hinweis; entferntes Geraet -> Hinweis, nach neuer Anmeldung neue
//     Geraetekennung (was es schreibt, zaehlt wieder); Kind: still
//   7 App mit einem anderen Speicher: klare Meldung gleich bei der Anmeldung
//   8 Messung: Anfragen je Stunde (Kind uebt 20 Min., Elterngeraet offen) bei 30 s und 60 s; ohne Neues
//   9 Kathies App (Live-Bau): nichts davon
//   node --test tests/abgleich-app.test.mjs

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { appSandbox, stellbareUhr } from './app-sandbox.mjs';
import { githubNachbau } from './module/github-nachbau.mjs';
import { githubSpeicher } from '../src/module/github.mjs';
import { startcodeAusstellen, ersteAnmeldung } from '../src/module/konto.mjs';
import { anmStartlink } from '../src/module/anmeldung.mjs';
import { keyFingerprint } from '../src/module/krypto.mjs';
import { appLesen } from '../werkzeug/module.mjs';
import { kontenEinsetzen, kennungErzeugen } from '../werkzeug/konten.mjs';
import { konto } from './konten-hilfen.mjs';

const RUNDEN = 1000;
const REPO = 'pahlborn/bis-school-app-testdaten';
const TOKEN = 'github_pat_ABGLEICH_' + 'k3'.repeat(20);
const MIN = 60000;
const warte = (ms) => new Promise((r) => setTimeout(r, ms));
const roh = (x) => (x === undefined ? x : JSON.parse(JSON.stringify(x)));
const UA = {
  ipad: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
};
const nachbauten = [];
after(async () => { for (const n of nachbauten) await n.schliessen(); });

/* eine Welt: GitHub-Nachbau, gemeinsame stellbare Uhr, Admin vom Werkzeug */
async function welt() {
  const N = await githubNachbau({ token: TOKEN, repos: [REPO] });
  nachbauten.push(N);
  const uhr = stellbareUhr(Date.now());
  const z = githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis }).geraet('d_Werkzeug1');
  const sc = await startcodeAusstellen({ zugang: z, aussteller: null, anmeldename: 'admin', art: 'admin', now: Date.now() });
  const admin = await ersteAnmeldung({ zugang: z, code: sc.code, passwort: 'Werkzeug-Admin-Passwort-1', now: Date.now(), runden: RUNDEN });
  return {
    N, uhr, z,
    startlink: async (name) => { const s = await startcodeAusstellen({ zugang: z, aussteller: admin, anmeldename: name, art: 'parent', now: Date.now() }); return link(anmStartlink('http://127.0.0.1/', { anmeldename: name, code: s.code, fingerabdruck: s.fingerabdruck })); }
  };
}
const link = (l) => l.slice(l.indexOf('#'));

/* IndexedDB eines Geraets (nur was die App braucht: Schluesselkopien bq2_konto) - damit ein Neustart der App die
   Schluessel wiederfindet wie im Browser */
function idbNachbau() {
  const dbs = new Map();
  return {
    open(name) {
      const r = { result: undefined, onsuccess: null, onerror: null, onupgradeneeded: null };
      Promise.resolve().then(() => {
        const neu = !dbs.has(name); if (neu) dbs.set(name, new Map());
        const daten = dbs.get(name);
        r.result = {
          createObjectStore() {}, close() {},
          transaction() {
            const t = { oncomplete: null, onerror: null, onabort: null };
            const s = {
              put(o) { daten.set(o.kennung, o); return { result: o.kennung }; },
              delete(k) { daten.delete(k); return { result: undefined }; },
              clear() { daten.clear(); return { result: undefined }; },
              getAll() { return { result: [...daten.values()] }; },
            };
            t.objectStore = () => s;
            Promise.resolve().then(() => t.oncomplete && t.oncomplete());
            return t;
          }
        };
        if (neu && r.onupgradeneeded) r.onupgradeneeded();
        if (r.onsuccess) r.onsuccess();
      });
      return r;
    },
    deleteDatabase() {}
  };
}

/* eine App-Instanz (ein Geraet) am Nachbau; zaehlt ihre Anfragen (gesamt, 304, je mit der Zeit der Uhr).
   repo: anderes Repo (Aufgabe 7); takt: [Takt, Senden] in ms statt der Vorgabe der App (Messung) */
function geraet(t, W, { name, hash = '', ua = UA.ipad, speicher = {}, idb = idbNachbau(), repo = REPO, takt = null } = {}) {
  const anfragen = { gesamt: 0, unveraendert: 0, liste: [] };
  const G = { name, anfragen, netz: true, halt: null, idb };
  const S = appSandbox({
    bauart: 'test', seite: true, uhr: W.uhr, speicher: { bqt_gh: TOKEN, ...speicher },
    anpassen: (h) => {
      let a = h.replace('/*BQ_SPEICHER*/null', JSON.stringify({ art: 'github', repo, wurzel: '', basis: W.N.basis }));
      if (takt) { const b = a; a = a.replace('const KONTO_TAKT_MS=30000, KONTO_SENDEN_MS=30000,', `const KONTO_TAKT_MS=${takt[0]}, KONTO_SENDEN_MS=${takt[1]},`); assert.notEqual(a, b, 'Takt nicht gefunden'); }
      return a;
    },
    globale: {
      location: { href: 'http://127.0.0.1/' + hash, origin: 'http://127.0.0.1', protocol: 'http:', host: '127.0.0.1', hostname: '127.0.0.1', pathname: '/', search: '', hash, replace() {}, reload() {}, assign() {} },
      File: class { constructor(teile, n, o) { this.text = teile.join(''); this.name = n; this.type = o && o.type; } },
      navigator: { userAgent: ua, language: 'de-DE', languages: ['de-DE'], onLine: true, standalone: false, canShare: () => false },
      indexedDB: idb,
      fetch: async (u, o) => {
        const s = String(u);
        if (!s.startsWith(W.N.basis + '/')) throw new TypeError('Failed to fetch');
        if (G.halt && G.halt.muster.test(s)) { const h = G.halt; G.halt = null; h.erreicht(); await h.weiter; }
        if (!G.netz) throw new TypeError('Failed to fetch');
        const pfad = decodeURIComponent(s.slice(W.N.basis.length).replace('/repos/' + repo, ''));
        const e = { zeit: W.uhr.jetzt(), methode: (o && o.method) || 'GET', pfad, status: 0 };
        anfragen.gesamt++; anfragen.liste.push(e);
        const r = await fetch(s, o);
        e.status = r.status;
        if (r.status === 304) anfragen.unveraendert++;
        return r;
      }
    }
  });
  t.diagnostic(name + ': BQ_SEED=' + S.seed);
  G.S = S;
  W.uhr.ruhe(() => S.holen('kontoLauf'));
  const finde = (sel) => S.lauf(() => S.$('#loginBody').querySelector(sel) || S.$('#aboutBody').querySelector(sel));
  G.im = finde;
  G.da = (sel) => !!finde(sel);
  G.text = () => S.lauf(() => S.$('#loginBody').textContent);
  G.eltern = () => S.lauf(() => S.$('#aboutBody').textContent);
  G.zeile = () => S.lauf(() => { const z = S.$('#aboutBody').querySelector('#kSync'); return z ? z.textContent : null; });
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
  G.wert = (n) => roh(S.lauf(() => S.holen(n)));
  G.erwachsen = () => G.wert('adultUser');
  G.sitzung = () => JSON.parse(S.ablage.get('bq2_session') || 'null');
  G.liste = () => JSON.parse(S.ablage.get('bq2_kontoListe') || '[]');
  G.sync = () => S.lauf(() => S.holen('kontoAbgleich')());
  G.einstellungen = (sec) => S.lauf(() => { S.ctx.location.hash = '#eltern/einstellungen' + (sec ? '/' + sec : ''); S.holen('applyParentRoute')(); });
  G.abschnitt = (id) => S.lauf(() => { const d = S.$('#aboutBody').querySelector(`details.psec[data-psec="${id}"]`); return d ? d.textContent : null; });
  G.log = (kind) => JSON.parse(S.ablage.get('bq2_' + kind + '__events') || '[]');
  G.antworten = (kind) => G.log(kind).filter((e) => e.type === 'answer').map((e) => e.id).sort();
  G.geraetId = () => JSON.parse(S.ablage.get('bq2_evDevice'));
  /* Anfragen seit einem Stand: { gesamt, zaehlend (ohne 304), puts, abgleiche (= Fragen nach dem Ordner events) } */
  G.seit = (n0) => {
    const l = anfragen.liste.slice(n0);
    return { gesamt: l.length, zaehlend: l.filter((e) => e.status !== 304).length, puts: l.filter((e) => e.methode === 'PUT' && e.pfad.includes('/contents/events/')).map((e) => e.zeit), abgleiche: l.filter((e) => e.methode === 'GET' && /^\/contents\/events\?/.test(e.pfad)).length };
  };
  G.n = () => anfragen.liste.length;
  /* Kinderseiten, wie das Kind sie sieht (Start, Runde, Ergebnis) */
  G.kindText = () => S.lauf(() => ['#home', '#play', '#results', '#subject'].map((s) => S.$(s).textContent).join(' | '));
  return G;
}

async function passwortWaehlen(G) {
  await G.wartenAuf('#setPwForm');
  G.klick('#pwUse');
  const pw = G.im('#newPw1').value;
  G.absenden('#setPwGo');
  return pw;
}
async function erwachsenStart(G) {
  G.klick('#roleAdult'); G.absenden('#loginGo');
  const pw = await passwortWaehlen(G);
  await G.wartenAuf('#recCode');
  G.klick('#recGo'); await G.wartenAuf('#welcomeGo'); G.klick('#welcomeGo');
  await G.sync();
  return pw;
}
async function anmelden(G, rolle, name, pw) {
  if (G.da('#roleStudent')) G.klick(rolle === 'student' ? '#roleStudent' : '#roleAdult');
  G.tippe('#loginUser', name); G.tippe('#loginPw', pw);
  G.absenden('#loginGo');
}
async function peter(t, W, name = 'peter.a') {
  const P = geraet(t, W, { name: 'Peters Laptop', hash: await W.startlink(name), ua: UA.windows });
  P.pw = await erwachsenStart(P);
  P.kennung = P.liste()[0].id;
  P.fp = await keyFingerprint(P.S.lauf(() => P.S.holen('kontoOffen').get(P.kennung).pub));
  return P;
}
/* Peter legt Kathie an, Kathie meldet sich auf ihrem iPad an und wird aufgenommen */
async function familie(t, W, { takt } = {}) {
  const P = await peterMitTakt(t, W, takt);
  P.einstellungen('familie');
  P.klick('#kKindAnlegen');
  await P.wartenAuf('#kKindForm');
  P.tippe('#kKindName', 'Kathie'); P.absenden('#kKindWeiter');
  await P.wartenAuf('#kKind2Form');
  P.absenden('#kKindGo');
  await P.wartenAuf('#kQr');
  const code = P.im('#kCode').textContent;
  const K = geraet(t, W, { name: 'Kathies iPad', takt, hash: link(anmStartlink('http://127.0.0.1/', { anmeldename: 'kathie', code, fingerabdruck: P.fp })) });
  K.klick('#roleStudent'); K.absenden('#loginGo');
  K.pw = await passwortWaehlen(K);
  await K.wartenAuf('#kidWait');
  // (die Uhr laeuft zwischen den Schritten etwas weiter - wie in echt; sonst laegen Kathies erste Eintraege auf derselben
  // Millisekunde wie die Aufnahme und vor der Anmeldung ihres Geraets)
  await W.uhr.vor(1000);
  await P.sync();
  await W.uhr.vor(1000);
  K.klick('#kidWaitAgain');
  await K.wartenAuf('#welcomeGo');
  await W.uhr.vor(1000);
  K.klick('#welcomeGo');
  P.klick('#kQrFertig');
  K.kennung = K.sitzung().id;
  await K.sync(); await P.sync();
  // einmal im Takt, damit beide denselben Stand haben
  await W.uhr.vor(30000);
  return { P, K };
}
async function peterMitTakt(t, W, takt) {
  if (!takt) return peter(t, W);
  const P = geraet(t, W, { name: 'Peters Laptop', hash: await W.startlink('peter.a'), ua: UA.windows, takt });
  P.pw = await erwachsenStart(P);
  P.kennung = P.liste()[0].id;
  P.fp = await keyFingerprint(P.S.lauf(() => P.S.holen('kontoOffen').get(P.kennung).pub));
  return P;
}

/* eine Frage beantworten (Runde laeuft) */
function antworten(K) { const z = K.S.zustand(); K.S.frageBeantworten(z.round[z.idx]); }
/* eine Runde ueben: Karte oeffnen, jede Frage beantworten, je Frage `proFrage` ms auf der Uhr; danach zur Startseite */
async function runde(K, W, proFrage = 15000) {
  const S = K.S;
  S.karteOeffnen(S.alleKarten().find((x) => !x.studio));
  for (;;) {
    const z = S.zustand();
    antworten(K);
    await W.uhr.vor(proFrage);
    const ende = z.idx >= z.round.length - 1;
    S.klick('#nextBtn');
    if (ende) break;
  }
  S.lauf(() => S.holen('goBack')());
}
const abstaende = (l) => l.slice(1).map((x, i) => x - l[i]);

test('1 Takt: Start, Zurueckkehren, alle 30 s solange sichtbar - ohne Neues nur 304; versteckt kein Abgleich', async (t) => {
  const W = await welt();
  const { P, K } = await familie(t, W);
  // sichtbar, nichts Neues: alle 30 s ein Abgleich, jede Anfrage 304
  const p0 = P.n(), k0 = K.n();
  await W.uhr.vor(5 * MIN);
  const p = P.seit(p0), k = K.seit(k0);
  assert.equal(p.abgleiche, 10, 'Peter: alle 30 s ein Abgleich: ' + JSON.stringify(p));
  assert.equal(k.abgleiche, 10, 'Kathie: alle 30 s ein Abgleich: ' + JSON.stringify(k));
  assert.equal(p.zaehlend + k.zaehlend, 0, 'ohne Neues zaehlt keine Anfrage gegen das Limit (alles 304)');
  assert.ok(p.gesamt <= 10 * 8, 'wenige Fragen je Abgleich (Sitzung): ' + p.gesamt);

  // versteckt (andere App, Bildschirm aus): kein Abgleich
  K.S.sichtbarkeit(false);
  const k1 = K.n();
  await W.uhr.vor(10 * MIN);
  assert.equal(K.seit(k1).gesamt, 0, 'versteckt: keine Anfrage');
  // in der Zeit hat Peter etwas geaendert (Kathies Name) - beim Zurueckkehren holt Kathie es sofort, ohne zu warten
  P.S.lauf(() => P.S.holen('eventHook')('profile_set', { field: 'name', value: 'Katharina' }));
  await W.uhr.vor(30000);
  K.S.sichtbarkeit(true);
  await W.uhr.still();
  assert.ok(K.seit(k1).abgleiche >= 1, 'zurueck: sofort abgeglichen');
  assert.equal(K.S.lauf(() => K.S.holen('playerName')()), 'Katharina', 'Peters Aenderung ist da');

  // Neustart der App (gleiches Geraet: localStorage und IndexedDB bleiben): gleicht beim Start von selbst ab
  P.S.lauf(() => P.S.holen('eventHook')('profile_set', { field: 'name', value: 'Kathie' }));
  await P.sync();
  K.S.sichtbarkeit(false);                                     // die alte Seite ist weg
  const K2 = geraet(t, W, { name: 'Kathies iPad (neu gestartet)', speicher: Object.fromEntries(K.S.ablage), idb: K.idb });
  await W.uhr.still();
  assert.ok(K2.seit(0).abgleiche >= 1, 'beim Start abgeglichen');
  assert.equal(K2.S.lauf(() => K2.S.holen('playerName')()), 'Kathie');
  assert.equal(K2.sitzung().id, K.kennung, 'angemeldet geblieben');
  const k2 = K2.n();
  await W.uhr.vor(60000);
  assert.equal(K2.seit(k2).abgleiche, 2, 'und dann im Takt');
  for (const G of [P, K, K2]) assert.deepEqual(G.wert('kontoFehlerListe'), [], G.name + ': keine Fehler');
});

test('2 eigene Eintraege: hoechstens alle 30 s gebuendelt gesendet; beim Verlassen der App sofort', async (t) => {
  const W = await welt();
  const { P, K } = await familie(t, W);
  await W.uhr.vor(30000);
  // Kathie uebt zwei Minuten: alle 5 s eine Antwort -> Buendel hoechstens alle 30 s
  const k0 = K.n();
  K.S.karteOeffnen(K.S.alleKarten().find((x) => !x.studio));
  for (let i = 0; i < 24; i++) {
    const z = K.S.zustand();
    antworten(K);
    await W.uhr.vor(5000);
    if (z.idx >= z.round.length - 1) { K.S.klick('#nextBtn'); K.S.lauf(() => K.S.holen('goBack')()); K.S.karteOeffnen(K.S.alleKarten().find((x) => !x.studio)); }
    else K.S.klick('#nextBtn');
  }
  const puts = K.seit(k0).puts;
  t.diagnostic('Sendezeiten (s): ' + puts.map((x) => Math.round((x - puts[0]) / 1000)).join(', '));
  assert.ok(puts.length >= 3 && puts.length <= 5, '2 Minuten: 3 bis 5 Buendel, nicht eines je Antwort: ' + puts.length);
  assert.ok(abstaende(puts).every((d) => d >= 30000), 'hoechstens alle 30 s: ' + abstaende(puts).join(', '));
  // ... und danach sofort geholt: Peter (sichtbar) hat sie mit seinem Takt
  await W.uhr.vor(30000);
  assert.deepEqual(P.antworten(K.kennung), K.antworten(K.kennung), 'Peter hat alle Antworten');

  // Verlassen: eine Antwort, sofort in eine andere App -> gesendet, ohne dass die Uhr weiterlaeuft
  await W.uhr.vor(30000);
  const k1 = K.n();
  antworten(K);
  const id = K.antworten(K.kennung).find((x) => !P.antworten(K.kennung).includes(x));
  assert.ok(id, 'neue Antwort');
  K.S.sichtbarkeit(false);
  await W.uhr.still();
  assert.equal(K.seit(k1).puts.length, 1, 'beim Verlassen gesendet');
  await P.sync();
  assert.ok(P.antworten(K.kennung).includes(id), 'Peter hat die Antwort');
  // versteckt ohne Neues: nichts mehr
  const k2 = K.n();
  K.S.sichtbarkeit(true); K.S.sichtbarkeit(false); await W.uhr.still();
  const nachher = K.seit(k2);
  assert.equal(nachher.puts.length, 0, 'nichts offen: beim Verlassen nichts gesendet');
  for (const G of [P, K]) assert.deepEqual(G.wert('kontoFehlerListe'), [], G.name + ': keine Fehler');
});

test('3 offline: weiterueben, spaeter senden - nichts verloren, nichts doppelt, nichts ueberschrieben, Buendel lueckenlos', async (t) => {
  const W = await welt();
  const { P, K } = await familie(t, W);
  await runde(K, W, 5000);
  await W.uhr.vor(30000);
  const vorher = new Map([...W.N.dateien(REPO)].filter(([p]) => p.startsWith('events/')));
  K.netz = false;
  await runde(K, W, 10000); await runde(K, W, 10000);
  await W.uhr.vor(MIN);
  assert.equal(K.wert('kontoStatus.fehler'), 'offline');
  assert.doesNotMatch(K.kindText(), /Abgleich|sync|Netz|connection|offline|Speicher|storage/i, 'das Kind sieht nichts davon');
  const lokal = K.antworten(K.kennung);
  assert.ok(lokal.length >= 24, 'drei Runden auf dem Geraet: ' + lokal.length);
  assert.ok(P.antworten(K.kennung).length < lokal.length, 'Peter hat die Offline-Antworten noch nicht');
  // wieder Netz - und Kathie wechselt sofort in eine andere App: das Offene geht beim Verlassen raus
  K.netz = true;
  const k9 = K.n();
  K.S.sichtbarkeit(false); await W.uhr.still();
  assert.ok(K.seit(k9).puts.length >= 1, 'beim Verlassen nachgeholt');
  assert.equal(K.wert('kontoStatus.fehler'), null);
  K.S.sichtbarkeit(true);
  await W.uhr.vor(30000);
  const beiP = P.log(K.kennung).filter((e) => e.type === 'answer').map((e) => e.id);
  assert.equal(new Set(beiP).size, beiP.length, 'nichts doppelt');
  assert.deepEqual([...beiP].sort(), lokal, 'nichts verloren');
  for (const [p, text] of vorher) assert.equal(W.N.dateien(REPO).get(p), text, 'nichts ueberschrieben: ' + p);
  // Kathies Buendel je Bereich ohne Luecke (1..n)
  const nr = new Map();
  for (const p of W.N.dateien(REPO).keys()) { const m = /^events\/([^/]+)\/(d_[^/]+)\/(\d+)\.json$/.exec(p); if (m && m[2] === K.geraetId()) { const k = m[1]; nr.set(k, [...(nr.get(k) || []), +m[3]]); } }
  for (const [b, l] of nr) assert.deepEqual(l.sort((a, c) => a - c), l.map((_, i) => i + 1), 'lueckenlos: ' + b);
  for (const G of [P, K]) assert.deepEqual(G.wert('kontoFehlerListe'), [], G.name + ': keine Fehler');
});

test('4 nie mitten in einer Runde: Neues kommt erst nach der Runde; ein eigener Eintrag waehrend des Abgleichs ueberschreibt nichts', async (t) => {
  const W = await welt();
  const { P, K } = await familie(t, W);
  // Kathie mitten in einer Runde; Peter aendert ihren Namen
  K.S.karteOeffnen(K.S.alleKarten().find((x) => !x.studio));
  antworten(K); K.S.klick('#nextBtn');
  const name = () => K.S.lauf(() => K.S.holen('playerName')());
  const vorLog = K.log(K.kennung).length;
  P.S.lauf(() => P.S.holen('eventHook')('profile_set', { field: 'name', value: 'Katharina' }));
  await P.sync();
  const k0 = K.n();
  for (let i = 0; i < 4; i++) { await W.uhr.vor(20000); antworten(K); K.S.klick('#nextBtn'); }
  const k = K.seit(k0);
  assert.ok(k.abgleiche >= 2 && k.puts.length >= 2, 'waehrend der Runde abgeglichen und gesendet: ' + JSON.stringify(k));
  assert.equal(name(), 'Kathie', 'mitten in der Runde: unveraendert');
  assert.equal(K.log(K.kennung).filter((e) => e.author === P.kennung).length, K.log(K.kennung).slice(0, vorLog).filter((e) => e.author === P.kennung).length, 'nichts von Peter ins Protokoll der Runde');
  assert.equal(K.S.zustand().screen, 'play');
  assert.ok(P.antworten(K.kennung).length >= 2, 'Peter sieht Antworten aus der laufenden Runde schon (einen Takt spaeter)');
  // Runde fertig -> mit dem naechsten Abgleich ist der neue Name da
  while (K.S.zustand().screen === 'play') { const z = K.S.zustand(); if (!z.answered) antworten(K); K.S.klick('#nextBtn'); }
  await W.uhr.vor(30000);
  assert.equal(name(), 'Katharina', 'nach der Runde: neuer Name');

  // ein eigener Eintrag, waehrend der Abgleich noch laeuft (nach Kathies Lernbereich, vor dem naechsten Bereich): das
  // eben Geholte bleibt im Protokoll
  await runde(K, W, 1000);
  await W.uhr.vor(30000);
  K.S.sichtbarkeit(false); await runde(K, W, 0); K.S.sichtbarkeit(false); await W.uhr.still();
  const neu = K.antworten(K.kennung).filter((x) => !P.antworten(K.kennung).includes(x));
  assert.ok(neu.length >= 8, 'Kathie hat Neues gesendet: ' + neu.length);
  P.S.lauf(() => P.S.holen('kidRead')({ id: K.kennung }, 'attempts', null));   // Peters App hat Kathies Protokoll gelesen (im Speicher)
  let erreicht; const halt = new Promise((r) => { erreicht = r; });
  let los; P.halt = { muster: /\/contents\/keys\/kind%3Aprivat/, erreicht, weiter: new Promise((r) => { los = r; }) };
  const lauf = P.sync();
  await halt;
  assert.ok(neu.every((x) => P.antworten(K.kennung).includes(x)), 'der Abgleich hat Kathies Antworten schon gebracht');
  P.S.lauf(() => P.S.holen('eventHook')('profile_set', { field: 'name', value: 'Kathie' }));
  assert.ok(neu.every((x) => P.antworten(K.kennung).includes(x)), 'gleich nach Peters Eintrag noch alles da (nicht erst nach einer weiteren Runde)');
  los(); await lauf;
  assert.ok(neu.every((x) => P.antworten(K.kennung).includes(x)), 'Peters Eintrag hat sie nicht ueberschrieben');
  assert.ok(P.log(K.kennung).some((e) => e.type === 'profile_set' && e.payload.value === 'Kathie' && e.author === P.kennung), 'Peters Eintrag ist da');
  for (const G of [P, K]) assert.deepEqual(G.wert('kontoFehlerListe'), [], G.name + ': keine Fehler');
});

test('5 Erwachsene sehen den Abgleich: letzter, kein Netz, Zugang, Limit (warten), nicht Uebernommenes mit ⓘ - ohne Token und Codes; das Kind sieht nichts', async (t) => {
  const W = await welt();
  const { P, K } = await familie(t, W);
  K.S.sichtbarkeit(false);                                     // nur Peter fragt
  P.einstellungen();
  await W.uhr.vor(30000);
  assert.match(P.zeile(), /🔄 Letzter Abgleich: gerade eben/);
  assert.doesNotMatch(P.zeile(), /Kein Netz|Zugang|zu viele|nicht übernommen/);
  // kein Netz: Satz in Alltagssprache, letzter Abgleich zaehlt weiter
  P.netz = false;
  await W.uhr.vor(2 * MIN);
  assert.match(P.zeile(), /📴 Kein Netz – wird nachgeholt\. · 🔄 Letzter Abgleich: vor 2 Min\./, P.zeile());
  P.netz = true;
  await W.uhr.vor(30000);
  assert.match(P.zeile(), /^🔄 Letzter Abgleich: gerade eben/, P.zeile());
  // Zugang abgelaufen: Hinweis + neuer Zugangsschluessel - nie der Token, nie ein Code
  const FALSCH = 'github_pat_ABGELAUFEN_' + 'q9'.repeat(20);
  P.S.ablage.set('bqt_gh', FALSCH); P.S.lauf(() => P.S.holen('kontoZug=null'));
  await W.uhr.vor(30000);
  const z = P.zeile();
  assert.match(z, /🔑 Der Zugang zum Speicher ist abgelaufen oder ungültig\.\s*Neuen Zugangsschlüssel eintragen/, z);
  for (const x of [FALSCH, TOKEN, 'github_pat', '401', '403', 'zugang', 'Bearer']) assert.equal(P.S.lauf(() => P.S.$('#aboutBody').innerHTML).includes(x), false, 'nicht in der Anzeige: ' + x);
  P.klick('#kTokenNeu');
  await P.wartenAuf('#kTokenForm');
  P.tippe('#kTokenNeuWert', '  ' + TOKEN + ' '); P.absenden('#kTokenGo');
  await P.warten(() => !P.da('#kTokenForm'), 'zurueck');
  assert.match(P.zeile(), /^🔄 Letzter Abgleich: gerade eben/, P.zeile());
  assert.equal(P.S.ablage.get('bqt_gh'), TOKEN);
  // Limit: warten statt wiederholen - auch nicht beim Zurueckkehren; danach geht es von selbst weiter
  W.N.stoerung({ status: 403, header: { 'retry-after': '600' } });
  await W.uhr.vor(30000);
  assert.match(P.zeile(), /⏳ Gerade zu viele Abgleiche – ab \d\d:\d\d geht es weiter\./, P.zeile());
  const p0 = P.n();
  await W.uhr.vor(4 * MIN);
  P.S.sichtbarkeit(false); P.S.sichtbarkeit(true);
  P.S.lauf(() => P.S.holen('eventHook')('profile_set', { field: 'name', value: 'Kathie M' }));
  await W.uhr.vor(5 * MIN);
  assert.equal(P.seit(p0).gesamt, 0, 'waehrend der Wartezeit keine Anfrage');
  await W.uhr.vor(MIN + 1000);
  assert.ok(P.seit(p0).puts.length >= 1, 'danach von selbst weiter (und gesendet)');
  assert.match(P.zeile(), /^🔄 Letzter Abgleich: gerade eben/, P.zeile());
  // nicht Uebernommenes: ein entferntes Geraet von Kathie schreibt weiter -> Zahl mit ⓘ
  const K2 = geraet(t, W, { name: 'Familien-iPhone', ua: UA.iphone });
  await anmelden(K2, 'student', 'kathie', K.pw);
  await K2.warten(() => K2.sitzung(), 'Kathie auf dem iPhone');
  await K2.sync(); await P.sync();
  P.einstellungen('geraete');
  P.klick(`[data-kweg="${K.kennung}|${K2.geraetId()}"]`);
  await P.wartenAuf('#kWegJa'); P.klick('#kWegJa'); await P.wartenAuf('#kNeuSpaeter'); P.klick('#kNeuSpaeter');
  await runde(K2, W, 0); await K2.sync(); await P.sync();
  assert.match(P.zeile(), /\d+ Einträge? nicht übernommen ⓘ$/, P.zeile());
  // ⓘ (im Browser oeffnet ein Klick darauf die Hilfe ueber den Klick-Waechter am Dokument)
  assert.equal(P.S.lauf(() => P.S.$('#aboutBody').querySelector('#kSync .info-btn').dataset.help), 'abgleich');
  P.S.lauf(() => P.S.holen('openHelp')('abgleich'));
  assert.equal(P.S.lauf(() => P.S.$('#helpTitle').textContent), 'Abgleich');
  assert.match(P.S.lauf(() => P.S.$('#helpText').textContent), /Nicht übernommen:.*entfernten Gerät/);
  // Englisch
  P.S.lauf(() => P.S.holen('setLang')('en'));
  assert.match(P.zeile(), /🔄 Last sync: (just now|\d+ min ago) · \d+ entr(y|ies) not taken over/, P.zeile());
  // das Kind: auch bei Problemen nichts vom Abgleich (offline, Zugang)
  K.S.sichtbarkeit(true); K.netz = false; await W.uhr.vor(MIN);
  K.S.ablage.set('bqt_gh', FALSCH); K.S.lauf(() => K.S.holen('kontoZug=null')); K.netz = true;
  await runde(K, W, 10000); await W.uhr.vor(MIN);
  assert.equal(K.wert('kontoStatus.fehler'), 'zugang');
  assert.doesNotMatch(K.kindText(), /Abgleich|sync|Netz|connection|Speicher|storage|Zugang|access key/i, 'das Kind sieht nichts davon');
  assert.equal(K.S.lauf(() => K.S.$('#home').querySelector('#kSync')), null);
  for (const G of [P, K]) assert.deepEqual(G.wert('kontoFehlerListe'), [], G.name + ': keine Fehler');
});

test('6 Schluessel woanders erneuert -> Hinweis; entferntes Geraet -> Hinweis, nach neuer Anmeldung neue Geraetekennung (zaehlt wieder); Kind still', async (t) => {
  const W = await welt();
  const { P, K } = await familie(t, W);
  const P2 = geraet(t, W, { name: 'Peters iPhone', ua: UA.iphone });
  await anmelden(P2, 'adult', 'peter.a', P.pw);
  await P2.warten(() => P2.erwachsen(), 'Peter auf dem iPhone');
  await P2.sync();
  P2.einstellungen();
  assert.doesNotMatch(P2.zeile(), /⚠️/);
  // Peter erneuert seinen Schluessel auf dem Laptop
  P.einstellungen('geraete'); P.klick('#kErneuern'); await P.wartenAuf('#kErnForm');
  P.tippe('#kErnAlt', P.pw); P.klick('#kErnUse'); const pw2 = P.im('#kErnNeu1').value; P.absenden('#kErnGo');
  await P.wartenAuf('#kCodeBox #recCode'); P.klick('#recGo');
  await W.uhr.vor(30000);
  assert.match(P2.zeile(), /⚠️ Ihr Schlüssel wurde auf einem anderen Gerät erneuert\. Bitte melden Sie sich hier neu an\./, P2.zeile());
  assert.doesNotMatch(P.zeile(), /⚠️/, 'nicht auf dem Geraet, das erneuert hat');
  P2.klick('#kNeuAnmelden');
  await P2.wartenAuf('#loginUser');
  assert.equal(P2.erwachsen(), null);
  await anmelden(P2, 'adult', 'peter.a', pw2);
  await P2.warten(() => P2.erwachsen(), 'mit dem neuen Passwort');
  await P2.sync(); P2.einstellungen();
  assert.doesNotMatch(P2.zeile(), /⚠️/, 'nach der Neuanmeldung kein Hinweis mehr');
  await runde(K, W, 1000); await W.uhr.vor(MIN);
  assert.deepEqual(P2.antworten(K.kennung), K.antworten(K.kennung), 'das iPhone sieht wieder Neues');

  // Peter entfernt das iPhone (mit neuem Schluessel)
  const altId = P2.geraetId();
  P.einstellungen('geraete');
  P.klick(`[data-kweg="${P.kennung}|${altId}"]`);
  await P.wartenAuf('#kErnForm');
  P.tippe('#kErnAlt', pw2); P.klick('#kErnUse'); const pw3 = P.im('#kErnNeu1').value; P.absenden('#kErnGo');
  await P.wartenAuf('#kCodeBox #recCode'); P.klick('#recGo');
  await W.uhr.vor(MIN);
  // (sein eigenes Geraet entfernt Peter immer mit neuem Schluessel - das iPhone liest danach nichts mehr, also auch das
  // Entfernen nicht: es sagt "Schluessel erneuert"; beides heisst: hier neu anmelden)
  assert.match(P2.zeile(), /⚠️ Ihr Schlüssel wurde auf einem anderen Gerät erneuert\. Bitte melden Sie sich hier neu an\./, P2.zeile());
  // ohne neue Anmeldung bleibt es ausgesperrt: was es schreibt, zaehlt nicht
  P2.S.lauf(() => P2.S.holen('eventHook')('profile_set', { field: 'lastName', value: 'Vom-Alten-iPhone' }));
  await P2.sync(); await P.sync();
  assert.equal(P.log(K.kennung).some((e) => e.payload && e.payload.value === 'Vom-Alten-iPhone'), false, 'entfernt: zaehlt nicht');
  // neue Anmeldung -> neue Geraetekennung -> zaehlt wieder
  P2.klick('#kNeuAnmelden'); await P2.wartenAuf('#loginUser');
  await anmelden(P2, 'adult', 'peter.a', pw3);
  await P2.warten(() => P2.erwachsen(), 'mit dem neuesten Passwort');
  await P2.sync();                                             // der erste Abgleich liest jetzt auch das Entfernen
  assert.notEqual(P2.geraetId(), altId, 'neue Geraetekennung');
  await P2.sync();
  P2.einstellungen();
  assert.doesNotMatch(P2.zeile(), /⚠️/, 'kein Hinweis mehr');
  assert.equal(P2.antworten(K.kennung).length, K.antworten(K.kennung).length, 'hat alles (neu geholt)');
  P2.S.lauf(() => P2.S.holen('eventHook')('profile_set', { field: 'lastName', value: 'Vom-Neuen-iPhone' }));
  await P2.sync(); await P.sync();
  assert.ok(P.log(K.kennung).some((e) => e.payload && e.payload.value === 'Vom-Neuen-iPhone'), 'nach der Neuanmeldung zaehlt es');
  P.einstellungen('geraete');
  assert.match(P.abschnitt('devices').split('Geräte von')[0], /iPhone · Safari[\s\S]*entfernt am[\s\S]*iPhone · Safari/, 'altes iPhone entfernt, neues in der Liste');

  // Kind: neues Passwort von Peter -> das alte iPad zeigt nichts davon (die Eltern sehen es)
  P.einstellungen('familie'); P.klick(`[data-kneu="${K.kennung}"]`); await P.wartenAuf('#kQr');
  const code = P.im('#kCode').textContent;
  const K3 = geraet(t, W, { name: 'Kathies neues iPad' });
  K3.klick('#roleStudent'); K3.tippe('#loginUser', 'kathie'); K3.tippe('#loginPw', code); K3.absenden('#loginGo');
  await passwortWaehlen(K3); await K3.wartenAuf('#kidWait');
  await P.sync(); K3.klick('#kidWaitAgain'); await K3.wartenAuf('#welcomeGo'); K3.klick('#welcomeGo');
  await W.uhr.vor(MIN);
  assert.doesNotMatch(K.kindText(), /Schlüssel|key|anmelden|log in again|entfernt|removed/i, 'Kind: still');
  for (const G of [P, P2, K, K3]) assert.deepEqual(G.wert('kontoFehlerListe'), [], G.name + ': keine Fehler');
});

test('6b Erwachsener auf einem entfernten Kindergeraet: Hinweis "Dieses Geraet wurde entfernt"; neue Anmeldung -> neue Kennung, alle anderen dort neu anmelden', async (t) => {
  const W = await welt();
  const { P, K } = await familie(t, W);
  // Familien-iPhone: Kathie uebt dort, Peter schaut dort auch hinein (angemeldet, Elternbereich offen)
  const F = geraet(t, W, { name: 'Familien-iPhone', ua: UA.iphone });
  await anmelden(F, 'student', 'kathie', K.pw);
  await F.warten(() => F.sitzung(), 'Kathie auf dem iPhone');
  await F.sync();
  F.klick('#adultBtn'); await F.wartenAuf('#loginUser');
  await anmelden(F, 'adult', 'peter.a', P.pw);
  await F.warten(() => F.erwachsen(), 'Peter auf dem iPhone');
  await F.sync(); await P.sync();
  F.einstellungen();
  // Peter entfernt das iPhone als Kathies Geraet (am Laptop)
  const altId = F.geraetId();
  P.einstellungen('geraete');
  P.klick(`[data-kweg="${K.kennung}|${altId}"]`);
  await P.wartenAuf('#kWegJa'); P.klick('#kWegJa'); await P.wartenAuf('#kNeuSpaeter'); P.klick('#kNeuSpaeter');
  await W.uhr.vor(MIN);
  assert.match(F.zeile(), /⚠️ Dieses Gerät wurde entfernt\. Bitte melden Sie sich hier neu an\./, F.zeile());
  F.klick('#kNeuAnmelden'); await F.wartenAuf('#loginUser');
  await anmelden(F, 'adult', 'peter.a', P.pw);
  await F.warten(() => F.erwachsen(), 'Peter wieder');
  assert.notEqual(F.geraetId(), altId, 'neue Geraetekennung');
  assert.equal(F.sitzung(), null, 'Kathie meldet sich hier neu an');
  assert.deepEqual(F.wert('[...kontoOffen.keys()]'), [P.kennung], 'nur Peters Schluessel');
  await F.sync(); F.einstellungen();
  assert.doesNotMatch(F.zeile(), /⚠️/);
  F.S.lauf(() => F.S.holen('eventHook')('profile_set', { field: 'lastName', value: 'Vom-Familien-iPhone' }));
  await F.sync(); await P.sync();
  assert.ok(P.log(K.kennung).some((e) => e.payload && e.payload.value === 'Vom-Familien-iPhone'), 'mit der neuen Kennung zaehlt es');
  for (const G of [P, F]) assert.deepEqual(G.wert('kontoFehlerListe'), [], G.name + ': keine Fehler');
});

test('7 App mit einem anderen Speicher: gleich bei der Anmeldung eine klare Meldung, kein "Passwort waehlen"', async (t) => {
  const W = await welt();
  const P = await peter(t, W);
  // dieselbe App, aber mit einem anderen Repo verbunden (dort gibt es keine Konten)
  const X = geraet(t, W, { name: 'iPad mit anderer Fassung', repo: 'pahlborn/anderes-repo' });
  X.klick('#roleStudent'); X.tippe('#loginUser', 'kathie'); X.tippe('#loginPw', 'AAAAAAAAAAAAAAAAAAAAAA'); X.absenden('#loginGo');
  await X.warten(() => { const m = X.im('#loginMsg'); return m && m.textContent && !/moment/i.test(m.textContent); }, 'Meldung');
  assert.equal(X.im('#loginMsg').textContent, 'This version of the app is connected to a different storage – there are no accounts there. Please ask your grown-up or the admin.');
  assert.equal(X.da('#setPwForm'), false, 'kein "Passwort waehlen"');
  X.klick('#loginBack');
  X.klick('#roleAdult'); X.tippe('#loginUser', 'peter.a'); X.tippe('#loginPw', P.pw); X.absenden('#loginGo');
  await X.warten(() => { const m = X.im('#loginMsg'); return m && m.textContent && !/moment/i.test(m.textContent); }, 'Meldung');
  assert.equal(X.im('#loginMsg').textContent, 'Diese Fassung ist mit einem anderen Speicher verbunden – dort gibt es keine Konten. Bitte beim Admin nachfragen.');
  // der richtige Speicher: falsches Passwort bleibt "stimmt nicht"
  const Y = geraet(t, W, { name: 'iPad richtig' });
  Y.klick('#roleAdult'); Y.tippe('#loginUser', 'peter.a'); Y.tippe('#loginPw', P.pw + 'x'); Y.absenden('#loginGo');
  await Y.warten(() => { const m = Y.im('#loginMsg'); return m && m.textContent && !/moment/i.test(m.textContent); }, 'Meldung');
  assert.equal(Y.im('#loginMsg').textContent, 'Benutzername oder Passwort stimmt nicht.');
});

test('8 Messung: Anfragen je Stunde - Kind uebt 20 Minuten bei offenem Elterngeraet (30 s / 60 s); ohne Neues', async (t) => {
  const ergebnis = [];
  for (const takt of [null, [60000, 30000], [60000, 60000]]) {
    const W = await welt();
    const { P, K } = await familie(t, W, { takt });
    P.einstellungen();
    await W.uhr.vor(MIN);
    const p0 = P.n(), k0 = K.n(), t0 = W.uhr.jetzt();
    let runden = 0;
    while (W.uhr.jetzt() - t0 < 20 * MIN) { await runde(K, W, 15000); runden++; await W.uhr.vor(15000); }
    const dauer = (W.uhr.jetzt() - t0) / 3600000;
    const p = P.seit(p0), k = K.seit(k0);
    assert.deepEqual(P.antworten(K.kennung).length >= K.antworten(K.kennung).length - 8, true, 'Peter ist hoechstens eine Runde hinterher');
    // ohne Neues: eine Stunde beide sichtbar (erst den Rest der letzten Runde abgleichen)
    await W.uhr.vor(2 * MIN);
    const p1 = P.n(), k1 = K.n();
    await W.uhr.vor(60 * MIN);
    const pl = P.seit(p1), kl = K.seit(k1);
    const r = {
      takt: takt ? takt.map((x) => x / 1000).join('/') + ' s' : '30/30 s (App)',
      runden, antworten: K.antworten(K.kennung).length,
      jeStunde: { kind: Math.round(k.zaehlend / dauer), eltern: Math.round(p.zaehlend / dauer), zusammen: Math.round((k.zaehlend + p.zaehlend) / dauer), alleFragen: Math.round((k.gesamt + p.gesamt) / dauer), schreibend: Math.round(k.puts.length / dauer) },
      ohneNeues: { zaehlend: pl.zaehlend + kl.zaehlend, alleFragen: pl.gesamt + kl.gesamt }
    };
    ergebnis.push(r);
    t.diagnostic(JSON.stringify(r));
    assert.equal(r.ohneNeues.zaehlend, 0, 'ohne Neues zaehlt nichts');
    assert.ok(r.jeStunde.zusammen < 2500, 'unter 50 % von 5000 je Stunde: ' + r.jeStunde.zusammen);
    assert.ok(r.jeStunde.schreibend <= 125, 'Schreiben (Commits) hoechstens alle 30 s: ' + r.jeStunde.schreibend);
  }
  const [a, b] = ergebnis;
  assert.ok(a.jeStunde.eltern > b.jeStunde.eltern, '60 s fragt seltener als 30 s');
});

test('9 Kathies App (Live-Bau): kein Abgleich, keine Zeile, keine neuen Namen', async (t) => {
  const live = appLesen('utf8', { bauart: 'live' }), testbau = appLesen('utf8', { bauart: 'test' });
  for (const w of ['function anmVerworfen', 'function anmGeraetEntfernt', 'function anmGeraetNeu', 'function anmSpeicherFremd', 'async function verbunden', 'function sitzung(']) {
    assert.equal(live.includes(w), false, 'Live-Bau nennt ' + w);
    assert.equal(testbau.includes(w), true, 'Testbau hat ' + w);
  }
  const mia = kennungErzeugen(), papa = kennungErzeugen();
  const konten = { version: 2, users: [{ id: mia, user: 'mia', kind: 'child', start: (await konto('mia', 'student', 'MIA-1234')).start }, { id: papa, user: 'papa', kind: 'adult', start: (await konto('papa', 'parent', 'PAPA-1234')).start }], guardians: [{ adult: papa, child: mia }] };
  const uhr = stellbareUhr(Date.now());
  const L = appSandbox({ bauart: 'live', seite: true, uhr, anpassen: (h) => kontenEinsetzen(h, konten).toString('utf8') });
  assert.equal(L.lauf(() => L.holen('KONTO_UI')), false);
  L.lauf(() => L.holen('loginDone')(L.holen('APP_ACCOUNTS').users.find((u) => u.user === 'papa')));
  assert.equal(L.lauf(() => L.$('#aboutBody').querySelector('#kSync')), null, 'keine Zeile');
  L.lauf(() => L.holen('loginDone')(L.holen('APP_ACCOUNTS').users.find((u) => u.user === 'mia')));
  L.karteOeffnen(L.alleKarten().find((x) => !x.studio));
  L.frageBeantworten(L.zustand().round[0]);
  await uhr.vor(5 * MIN);
  assert.equal(L.lauf(() => L.holen('kontoStatus.neu')), false, 'nichts vorgemerkt');
  assert.equal(L.lauf(() => L.holen('kontoStatus.timer')), null, 'kein Zeitgeber');
});
