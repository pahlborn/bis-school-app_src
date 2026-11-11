// Aufgabe "Erstanmeldung per QR-Code" (06.11.) in der Node-Sandbox (echte App, simulierter Speicher; Bedienung mit Klicks):
//   1 Kind ueber den Link der Eltern: ohne Rollenwahl, Englisch, Anmeldename fest; danach ein NEUES Passwort ueber einen
//     neuen Link (Konto da, Code offen -> wieder das Passwortformular, nicht "bitte anmelden"); alter Link -> anmelden
//   2 Startlink auf einem Geraet ohne Zugangscode: erst verbinden (Startlink bleibt gemerkt), nur den Code einfuegen ->
//     die Seite startet mit Zugangscode und Startlink neu (nichts davon bleibt in der Adresse)
//   3 Geraetename: Browser und Home-Bildschirm-App verstaendlich getrennt ("iPad (Safari)" / "iPad (App)")
//   4 Kathies App (Live-Bau): kein Passwortformular in der Seite, Einladungslinks aendern nichts
// Nur Fantasienamen.
//   node --test tests/erstanmeldung.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appSandbox } from './app-sandbox.mjs';
import { lokalerSpeicher } from '../src/module/speicher.mjs';
import { startcodeAusstellen, ersteAnmeldung, kontoLookup } from '../src/module/konto.mjs';
import { anmEinladungslink } from '../src/module/anmeldung.mjs';
import { kindAnlegen, kindPasswortNeu, abgleichMitVerbindungen } from '../src/module/einladung.mjs';
import { neuFormular, registrieren, linkMeldung } from './erstanmeldung-hilfen.mjs';

const R = 1000;
const warte = (ms) => new Promise((r) => setTimeout(r, ms));
const UA_IPAD = 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

/* ein Geraet; hash = Adresse beim Oeffnen; spuren = was die App mit der Adresse tut (replaceState, reload) */
function geraet(t, welt, { name, hash = '', speicher = {}, anpassen, navi = {}, bauart = 'test' } = {}) {
  const spuren = { ersetzt: [], neuGeladen: 0 };
  const S = appSandbox({
    bauart, seite: true, speicher,
    anpassen: (h) => { const a = welt ? h.replace('/*BQ_SPEICHER*/null', 'globalThis.__bqWelt') : h; return anpassen ? anpassen(a) : a; },
    globale: {
      __bqWelt: welt,
      location: { href: 'http://127.0.0.1/' + hash, origin: 'http://127.0.0.1', protocol: 'http:', host: '127.0.0.1', hostname: '127.0.0.1', pathname: '/', search: '', hash, replace() {}, reload() { spuren.neuGeladen++; }, assign() {} },
      history: { length: 1, state: null, pushState() {}, replaceState(_, __, url) { spuren.ersetzt.push(String(url)); }, back() {} },
      navigator: { userAgent: UA_IPAD, language: 'en-US', languages: ['en-US'], onLine: true, standalone: false, maxTouchPoints: 5, canShare: () => false, ...navi }
    }
  });
  t.diagnostic(name + ': BQ_SEED=' + S.seed);
  const G = { S, name, spuren };
  G.im = (sel) => S.lauf(() => S.$('#loginBody').querySelector(sel));
  G.text = () => S.lauf(() => S.$('#loginBody').textContent);
  G.warten = async (bed, was, ms = 30000) => { const t0 = Date.now(); for (;;) { if (S.lauf(bed)) return; if (Date.now() - t0 > ms) throw new Error(name + ': wartet vergeblich auf ' + was + ' - ' + G.text().slice(0, 300)); await warte(15); } };
  return G;
}

/* Welt: Admin, Elternteil Mira (vom Werkzeug, mit Geraet ohne App), Kind Lio wird von Miras Geraet angelegt */
async function welt() {
  const w = lokalerSpeicher(), z = w.geraet('d_Werkzeug1');
  const sa = await startcodeAusstellen({ zugang: z, aussteller: null, anmeldename: 'admin', art: 'admin', now: Date.now() });
  const admin = await ersteAnmeldung({ zugang: z, code: sa.code, passwort: 'Werkzeug-Admin-Passwort-1', now: Date.now(), runden: R });
  const sm = await startcodeAusstellen({ zugang: z, aussteller: admin, anmeldename: 'mira.sonnental', art: 'parent', now: Date.now() });
  const mira = await ersteAnmeldung({ zugang: z, code: sm.code, passwort: 'Werkzeug-Eltern-Passwort-1', now: Date.now(), runden: R });
  const m = new Map(), a = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } };
  a.setItem('bq2_evDevice', JSON.stringify('d_Mira'));
  const zm = w.geraet('d_Mira');
  const heute = () => new Date().toISOString().slice(0, 10);
  const sync = () => abgleichMitVerbindungen({ ablage: a, zugang: zm, konten: [mira], now: Date.now(), heute: heute() });
  await sync();
  return { w, z, admin, mira, a, zm, sync };
}

test('1 Kind ueber den Link der Eltern: ohne Rollenwahl, Englisch; neues Passwort ueber einen neuen Link (Konto da, Code offen); alter Link -> anmelden', async (t) => {
  const W = await welt();
  const r = await kindAnlegen({ zugang: W.zm, ablage: W.a, konto: W.mira, anmeldename: 'lio.sonnental', anzeigename: 'Lio', now: Date.now() });
  await W.sync();
  const link1 = anmEinladungslink('http://127.0.0.1/', { anmeldename: 'lio.sonnental', code: r.code, fingerabdruck: r.fingerabdruck });
  const K = geraet(t, W.w, { name: 'iPad des Kindes', hash: link1.slice(link1.indexOf('#')) });
  await K.warten(() => !!neuFormular(K, '#kontoNeuForm'), 'Passwortformular');
  assert.equal(K.spuren.ersetzt[0], '/', 'Startcode sofort aus der Adresse');
  assert.equal(K.im('#roleStudent'), null, 'keine Rollenwahl');
  assert.equal(neuFormular(K, '#kontoNeuTitel').textContent, 'Welcome! Choose your password');
  assert.equal(neuFormular(K, '#kontoNeuName').value, 'lio.sonnental');
  assert.equal(neuFormular(K, '#kontoNeuPw').value, '', 'Passwortfeld leer');
  await registrieren(K);
  await K.warten(() => K.S.zustand().screen === 'home', 'Kind direkt auf der Startseite');
  const kid = (await W.z.directory(await kontoLookup('lio.sonnental'))).kennung;
  assert.equal(K.im('#kidWait'), null, 'kein Warten beim normalen Erststart');
  assert.equal(K.S.lauf(() => {
    const p = K.S.holen('store').get('pendingAdmission', {})[kid];
    return !!(p && typeof p.transfer === 'string' && p.transfer.startsWith('pt_') && p.kopiert !== true);
  }), true, 'pendingAdmission nur lokal vorgemerkt');
  await K.S.lauf(() => K.S.holen('kontoAbgleich')());
  await W.sync();

  // Passwort vergessen: die Eltern geben einen neuen Start-QR-Code - das Konto gibt es, der Code ist offen
  const n = await kindPasswortNeu({ zugang: W.zm, ablage: W.a, konto: W.mira, kind: kid, now: Date.now() });
  await W.sync();
  const link2 = anmEinladungslink('http://127.0.0.1/', { anmeldename: 'lio.sonnental', code: n.code, fingerabdruck: n.fingerabdruck });
  const K2 = geraet(t, W.w, { name: 'neues iPad des Kindes', hash: link2.slice(link2.indexOf('#')) });
  await K2.warten(() => !!neuFormular(K2, '#kontoNeuForm'), 'Passwortformular (neues Passwort)');
  assert.equal(neuFormular(K2, '#kontoNeuTitel').textContent, 'Choose a new password');
  assert.match(neuFormular(K2, '#kontoNeuInfo').textContent, /Your progress stays/);
  await registrieren(K2);
  await K2.warten(() => K2.S.zustand().screen === 'home' || K2.im('#kidWait') || K2.im('#welcomeGo'), 'nach dem neuen Passwort');
  assert.equal(JSON.parse(K2.S.ablage.get('bq2_kontoListe'))[0].id, kid, 'dieselbe Kennung');

  // der erste Link noch einmal (Code verbraucht, Konto da): "bitte anmelden", Name steht da, Rolle Kind
  const K3 = geraet(t, W.w, { name: 'Familien-iPad', hash: link1.slice(link1.indexOf('#')) });
  assert.match(await linkMeldung(K3), /This invitation has been used already – please log in\./);
  assert.ok(K3.im('#loginForm') && K3.im('#loginUser').value === 'lio.sonnental', 'Anmeldeformular mit Namen');
  assert.equal(K3.S.lauf(() => K3.S.$('#login').querySelectorAll('input[autocomplete="new-password"]').length), 0);
  assert.match(K3.text(), /🎒 Student/, 'Rolle aus dem Konto: Kind');
});

test('2 Startlink auf einem Geraet ohne Zugangscode: erst verbinden; nur den Code einfuegen -> Neustart mit Zugangscode und Startlink', async (t) => {
  const sp = JSON.stringify({ art: 'github', repo: 'pahlborn/bis-school-app-testdaten', wurzel: '' });
  const code = 'Ab3_-xY9Ab3_-xY9Ab3_-x', TOKEN = 'github_pat_' + 'k7Wq'.repeat(10);
  const G = geraet(t, null, { name: 'iPhone ohne Zugangscode', hash: '#start=jonas.sonnental/' + code, anpassen: (h) => h.replace('/*BQ_SPEICHER*/null', () => sp) });
  await G.warten(() => G.im('#verbinden'), 'Geraet verbinden');
  assert.match(G.im('#verbMeldung').textContent, /This device is not connected yet/);
  assert.equal(G.spuren.ersetzt[0], '/', 'Startcode sofort aus der Adresse');
  G.S.lauf(() => { G.im('#verbLink').value = '  ' + TOKEN + ' '; const f = G.im('#verbForm'); f.dispatchEvent({ type: 'submit', target: f, currentTarget: f, preventDefault() {}, stopPropagation() {} }); });
  assert.equal(G.spuren.neuGeladen, 1, 'die Seite startet neu (nur dann ist das Passwortformular in der Seite)');
  assert.equal(G.spuren.ersetzt.at(-1), '/#zugang=' + TOKEN + '&start=jonas.sonnental/' + code, 'mit Zugangscode und dem gemerkten Startlink');
  // nach dem Neustart: beides gleich wieder aus der Adresse (hier: neue App-Instanz mit dieser Adresse)
  const G2 = geraet(t, null, { name: 'iPhone nach dem Neustart', hash: '#zugang=' + TOKEN + '&start=jonas.sonnental/' + code, anpassen: (h) => h.replace('/*BQ_SPEICHER*/null', () => sp) });
  assert.equal(G2.spuren.ersetzt[0], '/', 'Zugangscode und Startcode sofort aus der Adresse');
  await G2.warten(() => G2.im('#verbMeldung'), 'Meldung');
  assert.match(G2.im('#verbMeldung').textContent, /No connection/, 'Sandbox ohne Netz: ❌ Kein Netz');
  assert.equal(G2.S.ablage.get('bqt_gh'), undefined, 'ohne Pruefung nicht behalten');
  assert.equal(neuFormular(G2), null, 'kein Passwortformular');
});

test('3 Geraetename: Browser und Home-Bildschirm-App sind zwei Geraete - "iPad (Safari)" / "iPad (App)"', async (t) => {
  const A = geraet(t, lokalerSpeicher(), { name: 'Safari' });
  const B = geraet(t, lokalerSpeicher(), { name: 'Home-Bildschirm', navi: { standalone: true } });
  assert.equal(A.S.lauf(() => A.S.holen('kontoGeraetName')()), 'iPad (Safari)');
  assert.equal(B.S.lauf(() => B.S.holen('kontoGeraetName')()), 'iPad (App)');
});

test('4 Kathies App (Live-Bau): kein Passwortformular der Einladung in der Seite; ein Einladungslink aendert nichts', async (t) => {
  const L = geraet(t, null, { name: 'Kathies App', bauart: 'live', hash: '#zugang=github_pat_' + 'x'.repeat(30) });
  assert.equal(L.S.lauf(() => L.S.holen('KONTO_UI')), false);
  assert.equal(neuFormular(L), null, '#kontoNeu ist weg');
  assert.equal(L.S.lauf(() => { const w = L.S.$('#kontoNeu'); return !!(w && w.parentNode); }), false);
  assert.equal(L.S.ablage.get('bqt_gh'), undefined);
  assert.deepEqual(L.spuren.ersetzt, [], 'Adresse unberuehrt');
});
