// Diagnose fuer Epic 2026.0008 / US1: Nach erfolgreicher Wiederherstellung soll der Nutzer direkt wieder im Account
// landen. Der aktuelle Stand zeigt stattdessen erst den neuen Wiederherstellungscode und unterbricht damit den
// Erfolgspfad. Dieser Test ist absichtlich rot, bis der Flow umgebaut ist.
//   node --test tests/wiederherstellung-erfolgspfad.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appSandbox } from './app-sandbox.mjs';
import { lokalerSpeicher } from '../src/module/speicher.mjs';
import { startcodeAusstellen, ersteAnmeldung } from '../src/module/konto.mjs';
import { anmStartlink } from '../src/module/anmeldung.mjs';

const RUNDEN = 1000;
const warte = (ms) => new Promise((r) => setTimeout(r, ms));

function geraet(t, welt, { name, hash = '' }) {
  const S = appSandbox({
    bauart: 'test',
    seite: true,
    anpassen: (h) => h.replace('/*BQ_SPEICHER*/null', 'globalThis.__bqWelt'),
    globale: {
      __bqWelt: welt,
      location: { href: 'http://127.0.0.1/' + hash, origin: 'http://127.0.0.1', protocol: 'http:', host: '127.0.0.1', hostname: '127.0.0.1', pathname: '/', search: '', hash, replace() {}, reload() {}, assign() {} },
      File: class { constructor(teile, n, o) { this.text = teile.join(''); this.name = n; this.type = o && o.type; } },
      navigator: { userAgent: 'node-sandbox', language: 'de-DE', languages: ['de-DE'], onLine: true, standalone: false, canShare: () => true, share: async () => {} }
    }
  });
  t.diagnostic(name + ': BQ_SEED=' + S.seed);
  const G = { S, name };
  G.im = (sel) => S.lauf(() => S.$('#loginBody').querySelector(sel));
  G.da = (sel) => !!G.im(sel);
  G.text = () => S.lauf(() => S.$('#loginBody').textContent);
  G.klick = (sel) => S.lauf(() => {
    const e = G.im(sel) || S.$(sel);
    if (!e) throw new Error(name + ': nicht gefunden ' + sel);
    e.click();
  });
  G.tippe = (sel, v) => S.lauf(() => {
    const e = G.im(sel);
    if (!e) throw new Error(name + ': Feld fehlt ' + sel);
    e.value = v;
  });
  G.absenden = (knopf) => S.lauf(() => {
    const k = G.im(knopf);
    if (!k) throw new Error(name + ': Knopf fehlt ' + knopf);
    k.click();
    const f = k.closest('form');
    f.dispatchEvent({ type: 'submit', target: f, currentTarget: f, preventDefault() {}, stopPropagation() {} });
  });
  G.warten = async (bed, was, ms = 30000) => {
    const t0 = Date.now();
    for (;;) {
      if (S.lauf(bed)) return;
      if (Date.now() - t0 > ms) throw new Error(name + ': wartet vergeblich auf ' + was + ' - Seite: ' + G.text().slice(0, 300));
      await warte(15);
    }
  };
  G.wartenAuf = (sel) => G.warten(() => G.da(sel), sel);
  G.neu = (sel) => S.lauf(() => {
    const w = S.$('#kontoNeu');
    if (!w || !w.parentNode || w.hidden) return null;
    return sel ? w.querySelector(sel) : w;
  });
  G.erwachsen = () => S.lauf(() => {
    const v = S.holen('adultUser');
    return v ? JSON.parse(JSON.stringify(v)) : null;
  });
  return G;
}

async function registrieren(G, pw) {
  await G.warten(() => !!G.neu('#kontoNeuForm'), 'Passwortformular der Einladung');
  G.S.lauf(() => {
    if (pw) G.neu('#kontoNeuPw').value = pw;
    else G.neu('#kontoNeuUse').click();
  });
  const wert = G.S.lauf(() => G.neu('#kontoNeuPw').value);
  G.S.lauf(() => {
    const f = G.neu('#kontoNeuForm');
    f.dispatchEvent({ type: 'submit', target: f, currentTarget: f, preventDefault() {}, stopPropagation() {} });
  });
  return wert;
}

async function kontoMitWiederherstellungscode(t) {
  const welt = lokalerSpeicher();
  const zugang = welt.geraet('d_setup');
  const jetzt = Date.now();
  const adminCode = await startcodeAusstellen({ zugang, aussteller: null, anmeldename: 'admin', art: 'admin', now: jetzt });
  const admin = await ersteAnmeldung({ zugang, code: adminCode.code, passwort: 'Werkzeug-Admin-Passwort-1', now: jetzt, runden: RUNDEN });
  const elternCode = await startcodeAusstellen({ zugang, aussteller: admin, anmeldename: 'peter.a', art: 'parent', now: jetzt + 1 });
  const link = anmStartlink('http://127.0.0.1/', { anmeldename: 'peter.a', code: elternCode.code });
  const A = geraet(t, welt, { name: 'Erstgeraet', hash: link.slice(link.indexOf('#')) });
  await registrieren(A);
  await A.wartenAuf('#recCode');
  const code = A.im('#recCode').textContent.trim();
  A.klick('#recGo');
  await A.wartenAuf('#welcomeGo');
  A.klick('#welcomeGo');
  await A.warten(() => !!A.erwachsen(), 'erste Anmeldung abgeschlossen');
  return { welt, anmeldename: 'peter.a', code };
}

test('2026.0008.US1: Passwort vergessen sollte nach neuem Passwort direkt einloggen', async (t) => {
  const { welt, anmeldename, code } = await kontoMitWiederherstellungscode(t);
  const G = geraet(t, welt, { name: 'Frisches Geraet' });

  G.klick('#roleAdult');
  G.klick('#loginForgot');
  await G.wartenAuf('#forgotForm');
  G.tippe('#forgotUser', `${anmeldename} (Wiederherstellungscode)`);
  G.tippe('#forgotCode', code);
  G.absenden('#forgotGo');

  await G.wartenAuf('#setPwForm');
  G.klick('#pwUse');
  G.absenden('#setPwGo');
  await G.warten(() => G.da('#recCode') || !!G.erwachsen(), 'Erfolgspfad nach Wiederherstellung');

  assert.equal(G.erwachsen()?.user, anmeldename, 'nach erfolgreicher Wiederherstellung sollte der Erwachsene direkt angemeldet sein');
});
