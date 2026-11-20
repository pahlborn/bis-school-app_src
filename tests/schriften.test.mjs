// Aufgabe "Schriftarten einbetten" (Peter, 05.11.): die App laedt nichts mehr von Google Fonts. Fredoka und Nunito
// liegen als Text in werkzeug/schriften/schriften.json und werden beim Bauen an der Marke /*BQ_SCHRIFTEN*/ eingesetzt
// (werkzeug/schriften.mjs) - fuer Kathies App (distBauen) und die Testinstanz.
//  - Quelle: Marke genau einmal, keine Google-Adresse, Schriften geprueft (WOFF2, Groesse, SHA-256), Lizenztext da.
//  - Bau: Tresor und Testinstanz tragen beide Schriften genau einmal, nichts von Google; Groesse vorher/nachher.
//  - Browser: Ueberschriften Fredoka, Text Nunito - berechnet und tatsaechlich gezeichnet (CSS.getPlatformFontsForNode),
//    auch Umlaute, ss, Anfuehrungszeichen, Euro; jede Anfrage ausserhalb der Testseite zaehlt als Fehler.
//  - Gegenproben: Google-Zeile wieder drin -> Suchlauf/Bau rot; Marke fehlt oder doppelt -> Bau bricht ab, schreibt nichts;
//    ohne eingebettete Schrift zeichnet der Browser eine Ersatzschrift (der Browser-Test wird also rot).
//   node --test tests/schriften.test.mjs

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { WURZEL, QUELLEN, ICONS, quellenLesen, distBauen, appZusammensetzen, testinstanzBauen, testinstanzKontext } from '../werkzeug/bauen.mjs';
import { MODUL_JSON } from '../werkzeug/module.mjs';
import { SCHRIFT_MARKE, SCHRIFTEN_DATEI, schriftenLesen, schriftenEinsetzen, schriftenPruefen, ohneSchriften } from '../werkzeug/schriften.mjs';
import { testinstanzPruefen, testinstanzUmwandeln, ersatzLesen } from '../werkzeug/testinstanz.mjs';
import { entschluesseln, tresorAusHuelle } from '../werkzeug/kern.mjs';
import { TEST_PW } from './hilfen.mjs';
import { browserStarten } from './app-hilfen.mjs';

const V = { major: 0, minor: 7, patch: 0, kanal: 'beta', hash: 'abc1234', date: '05.11.2026 10:00', draft: false };
const S = schriftenLesen(WURZEL);
const q = await quellenLesen();
const QUELLTEXT = fs.readFileSync(path.join(WURZEL, QUELLEN.app), 'utf8');
const GOOGLE_ZEILE = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&display=swap">';
const MARKE_ZEILE = `<style>${SCHRIFT_MARKE}</style>`;
const tmp = (n = 'bq-schriften-') => fs.mkdtempSync(path.join(os.tmpdir(), n));
const ALLE = (app) => appZusammensetzen(app, V, null, null).toString('utf8');

/** Kopie der Quellen in einen eigenen Ordner, index.html veraendert - fuer Bau-Gegenproben */
function wurzelMit(indexHtml) {
  const w = tmp('bq-schriften-wurzel-');
  for (const rel of [QUELLEN.manifest, QUELLEN.salz, QUELLEN.woerter, QUELLEN.vorlage, SCHRIFTEN_DATEI, 'werkzeug/testinstanz-ersatz.json', 'werkzeug/schuldaten.json', ...Object.values(MODUL_JSON), ...ICONS]) {
    fs.mkdirSync(path.dirname(path.join(w, rel)), { recursive: true });
    fs.copyFileSync(path.join(WURZEL, rel), path.join(w, rel));
  }
  fs.cpSync(path.join(WURZEL, 'src', 'module'), path.join(w, 'src', 'module'), { recursive: true });
  fs.writeFileSync(path.join(w, QUELLEN.app), indexHtml);
  return w;
}

test('Quelle: Marke genau einmal, keine Google-Adresse; Schriften geprueft; Lizenztext mit beiden Urhebern', () => {
  assert.equal(QUELLTEXT.split(SCHRIFT_MARKE).length, 2, 'Marke genau einmal in index.html');
  assert.ok(QUELLTEXT.includes(MARKE_ZEILE));
  assert.doesNotMatch(QUELLTEXT, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.deepEqual(S.map((s) => [s.familie, s.gewicht]), [['Fredoka', '500 700'], ['Nunito', '400 800']], 'die Staerken, die die App vorher bei Google bestellt hat');
  for (const s of S) {
    assert.ok(s.bytes < 45000, `${s.familie}: nur der lateinische Teilsatz (${s.bytes} Bytes)`);
    assert.match(s.zeichen, /U\+0000-00FF.*U\+2000-206F.*U\+20AC/, `${s.familie}: Umlaute/ss, Anfuehrungszeichen, Euro`);
  }
  const ofl = fs.readFileSync(path.join(WURZEL, 'werkzeug', 'schriften', 'OFL.txt'), 'utf8');
  for (const t of ['SIL OPEN FONT LICENSE Version 1.1', 'Copyright 2016 The Fredoka Project Authors', 'Copyright 2014 The Nunito Project Authors']) assert.ok(ofl.includes(t), t);
  // die App nennt Schriften und Lizenz unter "Quellen" (DE/EN) und erwaehnt Google Fonts nicht mehr im Datenschutz
  assert.ok(QUELLTEXT.includes('und Nunito (© 2014 The Nunito Project Authors) – in die App eingebettet, SIL Open Font License 1.1'));
  assert.ok(QUELLTEXT.includes('and Nunito (© 2014 The Nunito Project Authors) – embedded in the app, SIL Open Font License 1.1'));
  assert.doesNotMatch(QUELLTEXT, /Google Fonts|an Google übermittelt|IP address to Google/);
  assert.ok(QUELLTEXT.includes('<h3>Datenschutz</h3>\n<p><b>Vorläufige Fassung, noch nicht DSGVO-konform.</b></p>') || QUELLTEXT.includes('<h3>Datenschutz</h3>\r\n<p><b>Vorläufige Fassung, noch nicht DSGVO-konform.</b></p>'));
  assert.ok(QUELLTEXT.includes('<h3>Privacy</h3>\n<p><b>Preliminary version, not yet GDPR-compliant.</b></p>') || QUELLTEXT.includes('<h3>Privacy</h3>\r\n<p><b>Preliminary version, not yet GDPR-compliant.</b></p>'));
});

test('Kathies App: Tresor traegt beide Schriften genau einmal, nichts von Google; Groesse vorher/nachher', async (t) => {
  const ziel = tmp();
  try {
    const r = await distBauen(TEST_PW, { ziel, version: V, konten: null, schule: null });
    const html = fs.readFileSync(path.join(ziel, 'index.html'), 'utf8');
    const app = Buffer.from(await entschluesseln(tresorAusHuelle(html), TEST_PW)).toString('utf8');
    assert.deepEqual(schriftenPruefen(app, S), []);
    assert.ok(!app.includes(SCHRIFT_MARKE), 'Marke ersetzt');
    assert.doesNotMatch(html, /fonts\.g(oogleapis|static)\.com/, 'Huelle ebenfalls ohne Google');
    const ohne = appZusammensetzen(q.app, V, null, null, []).length;
    const mitAlt = ohne - MARKE_ZEILE.length + GOOGLE_ZEILE.length;      // ungefaehr die App vorher (mit Google-Zeilen)
    t.diagnostic(`App ohne Schriften ${ohne} B, mit Schriften ${r.appBytes} B (+${r.appBytes - ohne} B), Huelle ${r.huelleBytes} B; vorher etwa ${mitAlt} B`);
    assert.ok(r.appBytes - ohne > 90000 && r.appBytes - ohne < 95000, 'Zuwachs = die beiden Schriften als Base64: ' + (r.appBytes - ohne));
  } finally { fs.rmSync(ziel, { recursive: true, force: true }); }
});

test('Testinstanz: Suchlauf mit Pruefung "Schriften eingebettet", Wortsuche ohne Schriftdaten, Umwandlung laesst die Daten heil', async () => {
  const ziel = tmp();
  try {
    const r = await testinstanzBauen({ ziel, version: V });
    const app = fs.readFileSync(path.join(ziel, 'index.html'), 'utf8');
    const p = r.pruefungen.find((x) => x.name.startsWith('Schriften eingebettet, nichts von Google Fonts'));
    assert.ok(p && p.ok, JSON.stringify(r.pruefungen.map((x) => x.name)));
    assert.deepEqual(schriftenPruefen(app, S), []);
    assert.ok(ohneSchriften(app).length < app.length - 90000, 'Wortsuche ohne die rund 90 KB Base64');
    // Umwandlung: eine Ersetzung (Gross/klein egal), die mitten in den Schriftdaten treffen wuerde, laesst sie heil
    const stueck = /[A-Za-z]{7}/.exec(S[0].base64.slice(5000))[0];
    const ersatz = await ersatzLesen();
    const roh = appZusammensetzen((await import('../werkzeug/module.mjs')).appLesen('utf8', { bauart: 'test' }), V, null, null);
    assert.ok(roh.toString('utf8').toLowerCase().includes(stueck.toLowerCase()), 'Ausgangslage: das Stueck steht in den Schriftdaten');
    const umgewandelt = testinstanzUmwandeln(roh.toString('utf8'), { ...ersatz, ersetzen: [...ersatz.ersetzen, [stueck, 'KAPUTT']] });
    assert.deepEqual(schriftenPruefen(umgewandelt, S), [], 'Schriftdaten unveraendert');
  } finally { fs.rmSync(ziel, { recursive: true, force: true }); }
});

test('Gegenproben: Google-Zeile wieder drin -> Suchlauf und Bau rot; Marke fehlt/doppelt -> Bau bricht ab und schreibt nichts', async () => {
  const mitGoogle = QUELLTEXT.replace(MARKE_ZEILE, () => MARKE_ZEILE + '\n' + GOOGLE_ZEILE);
  // Suchlauf der fertigen App
  const app = ALLE(q.app);
  assert.deepEqual(schriftenPruefen(app, S), []);
  assert.match(schriftenPruefen(app.replace('</head>', GOOGLE_ZEILE + '</head>'), S).join(), /Google Fonts noch in der App \(fonts\.googleapis\.com\)/);
  assert.match(schriftenPruefen(app.replace('</head>', '<link rel="preconnect" href="https://fonts.gstatic.com"></head>'), S).join(), /Google Fonts noch in der App/);
  assert.match(schriftenPruefen(app + SCHRIFT_MARKE, S).join(), /Marke .* nicht ersetzt/);
  assert.match(schriftenPruefen(app.replace(`base64,${S[1].base64})`, 'base64,AAAA)'), S).join(), /Nunito 0x statt 1x/);
  assert.match(schriftenPruefen(app.replace('</head>', `<style>@font-face{src:url(data:font/woff2;base64,${S[0].base64})}</style></head>`), S).join(), /Fredoka 2x statt 1x/);
  assert.match(schriftenPruefen(app.replace("font-family:'Fredoka';font-style:normal;font-weight:500 700;", "font-family:'Fredoka';font-style:normal;font-weight:400;"), S).join(), /Fredoka: @font-face unvollstaendig/);
  // Testinstanz-Suchlauf: genau dieser Fund
  const kontext = await testinstanzKontext();
  const ti = testinstanzUmwandeln(ALLE((await import('../werkzeug/module.mjs')).appLesen(null, { bauart: 'test' })), await ersatzLesen());
  assert.deepEqual(testinstanzPruefen(ti, '{"name":"Big Quest Test"}', kontext).funde.filter((f) => !f.startsWith('Name')), []);
  const f = testinstanzPruefen(ti.replace('</head>', GOOGLE_ZEILE + '</head>'), '{"name":"Big Quest Test"}', kontext).funde.filter((x) => !x.startsWith('Name'));
  assert.equal(f.length, 1, JSON.stringify(f)); assert.match(f[0], /^Schriften eingebettet, nichts von Google Fonts/);
  // Bau: Google-Zeile -> rot, nichts geschrieben
  for (const [html, re] of [[mitGoogle, /Schriften, nichts geschrieben: Google Fonts noch in der App/],
    [QUELLTEXT.replace(MARKE_ZEILE, '<style></style>'), /Marke \/\*BQ_SCHRIFTEN\*\/ 0x statt 1x/],
    [QUELLTEXT.replace(MARKE_ZEILE, MARKE_ZEILE + MARKE_ZEILE), /Marke \/\*BQ_SCHRIFTEN\*\/ 2x statt 1x/]]) {
    const w = wurzelMit(html);
    try {
      const ziel = path.join(w, 'dist');
      await assert.rejects(distBauen(TEST_PW, { wurzel: w, ziel, version: V, konten: null, schule: null }), re);
      assert.equal(fs.existsSync(ziel), false, 'nichts geschrieben');
      const zielT = path.join(w, 'dist-test');
      await assert.rejects(testinstanzBauen({ wurzel: w, ziel: zielT, version: V }), re.source.includes('Google') ? /Schriften eingebettet, nichts von Google Fonts/ : re);
      assert.equal(fs.existsSync(zielT), false, 'Testinstanz: nichts geschrieben');
    } finally { fs.rmSync(w, { recursive: true, force: true }); }
  }
  // Schriftdatei beschaedigt oder fehlt -> kein Bau
  const w = wurzelMit(QUELLTEXT);
  try {
    const datei = path.join(w, SCHRIFTEN_DATEI), j = JSON.parse(fs.readFileSync(datei, 'utf8'));
    j.schriften[1].base64 = j.schriften[1].base64.replace(/^(.{100})./, (_, a) => a + (j.schriften[1].base64[100] === 'A' ? 'B' : 'A'));
    fs.writeFileSync(datei, JSON.stringify(j));
    assert.throws(() => schriftenLesen(w), /Pruefsumme von nunito-latin\.woff2 stimmt nicht/);
    fs.rmSync(datei);
    assert.throws(() => schriftenLesen(path.join(w, 'x')), /schriften\.json fehlt/);
  } finally { fs.rmSync(w, { recursive: true, force: true }); }
  assert.throws(() => schriftenEinsetzen('<p>ohne Marke</p>', S), /0x statt 1x/);
});

/* ---- Browser: die gebaute App (Inhalt des Tresors) zeichnet mit den eingebetteten Schriften, ohne Anfrage nach aussen ---- */
let browser;
before(async () => { browser = await browserStarten(); });
after(async () => { await browser?.close(); });

async function seite(html) {
  const server = http.createServer((req, res) => {
    if (req.url.split('?')[0] !== '/') { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const ctx = await browser.newContext();
  const fremd = [];
  await ctx.route('**/*', (r) => { const u = r.request().url(); if (u.startsWith(url)) return r.continue(); fremd.push(u); return r.abort(); });
  await ctx.addInitScript(() => { window.claude = { hot: { snapshot() {} } }; window.AudioContext = undefined; window.webkitAudioContext = undefined; });
  const page = await ctx.newPage();
  const fehler = []; page.on('pageerror', (e) => fehler.push(e.message));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('#home h1');
  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', '<div id="probe" style="position:fixed;left:0;top:0;z-index:99;background:#fff">'
      + '<h2 id="probeH">Größe Übung Ärger Öl Maß „Quest“ – 5 €</h2><p id="probeP">Größe Übung Ärger Öl Maß „Quest“ – 5 € ’s</p><b id="probeB">Fußball Äpfel</b></div>');
  });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument');
  const gezeichnet = async (sel) => {
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel });
    return (await cdp.send('CSS.getPlatformFontsForNode', { nodeId })).fonts;
  };
  const schliessen = async () => { await ctx.close(); server.close(); };
  return { page, fremd, fehler, gezeichnet, schliessen };
}

test('Browser: Ueberschriften Fredoka, Text Nunito - berechnet und gezeichnet, auch Umlaute und ss; keine Anfrage nach aussen', async (t) => {
  const s = await seite(ALLE(q.app));
  try {
    const berechnet = await s.page.evaluate(() => ({
      h1: getComputedStyle(document.querySelector('#home h1')).fontFamily, body: getComputedStyle(document.body).fontFamily,
      geladen: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/["']/g, '')).sort()
    }));
    assert.match(berechnet.h1, /^"?Fredoka"?,/);
    assert.match(berechnet.body, /^"?Nunito"?,/);
    assert.deepEqual([...new Set(berechnet.geladen)], ['Fredoka', 'Nunito'], 'beide eingebetteten Schriften geladen');
    for (const [sel, fam] of [['#home h1', /^Fredoka/], ['#probeH', /^Fredoka/], ['#probeP', /^Nunito/], ['#probeB', /^Nunito/]]) {
      const f = await s.gezeichnet(sel);
      t.diagnostic(`${sel}: ${f.map((x) => `${x.familyName}${x.isCustomFont ? ' (eingebettet)' : ''} ${x.glyphCount} Zeichen`).join(', ')}`);
      assert.ok(f.length >= 1, sel);
      assert.deepEqual(f.filter((x) => !(x.isCustomFont && fam.test(x.familyName))), [], `${sel}: jedes Zeichen mit der eingebetteten Schrift (${JSON.stringify(f)})`);
    }
    // eine Datei je Familie traegt alle Staerken (variable Schrift): jede bestellte Staerke hat eine andere Breite
    // (Nunito wird fetter breiter, Fredoka etwas schmaler - gemessen 05.11.)
    const breite = await s.page.evaluate(() => {
      const m = (fam, w) => { const e = document.createElement('span'); e.style.cssText = `font-family:${fam};font-weight:${w};font-size:40px;white-space:nowrap`; e.textContent = 'Größe Übung Maß'; document.body.append(e); const b = e.getBoundingClientRect().width; e.remove(); return b; };
      return { f: [500, 600, 700].map((w) => m('Fredoka', w)), n: [400, 600, 700, 800].map((w) => m('Nunito', w)) };
    });
    t.diagnostic('Breite je Staerke: ' + JSON.stringify(breite));
    for (const r of [breite.f, breite.n]) for (let i = 1; i < r.length; i++) assert.ok(Math.abs(r[i] - r[i - 1]) > 0.5, 'jede Staerke anders: ' + r.join(' / '));
    assert.deepEqual(s.fremd, [], 'keine Anfrage ausserhalb der Testseite');
    assert.deepEqual(s.fehler, []);
  } finally { await s.schliessen(); }
});

test('Gegenprobe Browser: ohne eingebettete Schriften zeichnet der Browser eine Ersatzschrift (der Test oben wuerde rot)', async (t) => {
  const s = await seite(appZusammensetzen(q.app, V, null, null, []).toString('utf8'));
  try {
    const f = await s.gezeichnet('#probeP');
    t.diagnostic(`#probeP ohne Schriften: ${f.map((x) => `${x.familyName}${x.isCustomFont ? ' (eingebettet)' : ''}`).join(', ')}`);
    assert.ok(f.length >= 1 && f.every((x) => !x.isCustomFont && !/^Nunito/.test(x.familyName)), JSON.stringify(f));
    assert.deepEqual(s.fremd, []);
  } finally { await s.schliessen(); }
});
