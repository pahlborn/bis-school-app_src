// Die App ohne Browser (Aufgabe "Tests schneller", 04.11.): das unveraenderte App-Skript aus der gebauten App
// (appLesen) laeuft in node:vm mit kleinen Ersatzteilen fuer document, localStorage, Uhr und Zufall.
//
//  - Elemente sind einfache Objekte mit hidden, Attributen, dataset, Klassen, Kindern und Ereignissen. innerHTML wird
//    in Elemente zerlegt (kleiner Zerleger, reicht fuer das HTML der App). Was die App baut (Quest-Karten,
//    Antwortknoepfe, Ziffernblock, Challenge-Angebot), steht als Baum da und laesst sich anklicken: click() ruft die
//    Ereignisse der App - wie im Browser, nur ohne Darstellung (kein CSS, keine Groessen).
//  - document.querySelector('#id') liefert immer ein Element (die Seite hat alle festen Elemente); das Element mit
//    dieser id, das die App zuletzt gebaut hat, gewinnt.
//  - Zeitgeber laufen nicht (kein Konfetti, keine Update-Pruefung); Zufall mit Startwert (BQ_SEED, sonst neu je Lauf).
//  - lauf(fn, ms): fuehrt fn mit Zeitlimit aus - eine Endlosschleife der App wird zum Fehler statt zum Haenger.
//  - bauart: 'live' oder 'test' (Stufe-2-Module; Aufgabe 3b-2a). Ohne Angabe gilt BQ_BAUART, sonst 'live' - so laufen
//    dieselben Tests auch gegen den Testbau (tests/testbau-lesen.test.mjs).
//
// Zugriff auf Namen der App: holen('state'), holen('WORLDS') ... (am Skriptende eingesetzt; index.html bleibt gleich).

import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { appLesen } from '../werkzeug/module.mjs';

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' };
export const dekodieren = (s) => String(s).replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (g, e) => e[0] === '#'
  ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ENT[e] ?? g));
/** Text eines HTML-Schnipsels (wie textContent; fuer Fragen und Antworten). */
export const text = (html) => dekodieren(String(html).replace(/<[^>]+>/g, ''));
const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => escText(s).replace(/"/g, '&quot;');
const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const LEER = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'source', 'wbr', 'track', 'embed']);

/** Einfacher Teil eines Selektors: tag#id.klasse[attr="wert"] (ohne Pseudoklassen und >). */
function teilPasst(el, teil) {
  if (el.nodeType !== 1) return false;
  const m = /^([a-z*][\w-]*)?/i.exec(teil); let rest = teil.slice(m[0].length);
  if (m[1] && m[1] !== '*' && el.tagName !== m[1].toUpperCase()) return false;
  while (rest) {
    let r;
    if ((r = /^#([\w-]+)/.exec(rest))) { if (el.id !== r[1]) return false; }
    else if ((r = /^\.([\w-]+)/.exec(rest))) { if (!el.classList.contains(r[1])) return false; }
    else if ((r = /^\[([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\]]*)))?\]/.exec(rest))) {
      const v = el.getAttribute(r[1]), soll = r[2] ?? r[3] ?? r[4];
      if (v === null || (soll !== undefined && String(v) !== soll)) return false;
    } else return false;
    rest = rest.slice(r[0].length);
  }
  return true;
}

//  - globale: weitere Namen fuer window (z. B. ein simulierter Speicher, File, navigator.share; Aufgabe "Anmeldung im
//    Testbau") - sie stehen vor dem Start der App bereit.
export function appSandbox({ anpassen, seed = Number(process.env.BQ_SEED) || Date.now() % 1e9, speicher = {}, bauart = process.env.BQ_BAUART || 'live', seite = false, globale = {} } = {}) {
  /* ---------- Elemente ---------- */
  const reg = new Map();                                                     // id -> Element (wie getElementById)
  class Knoten {
    constructor(tag) {
      this.tagName = String(tag).toUpperCase(); this.nodeType = tag === '#text' ? 3 : 1; this.childNodes = []; this.parentNode = null;
      this._text = ''; this._attr = {}; this._on = {}; this._id = '';
      this.hidden = false; this.disabled = false; this.open = false; this.checked = false; this.value = ''; this.type = '';
      this.dataset = {}; this.style = { setProperty() {}, removeProperty() {}, getPropertyValue: () => '' };
      const el = this;
      this.classList = {
        _l: () => el.className.split(/\s+/).filter(Boolean),
        contains: (c) => el.classList._l().includes(c),
        add: (...c) => { el.className = [...new Set([...el.classList._l(), ...c])].join(' '); },
        remove: (...c) => { el.className = el.classList._l().filter((x) => !c.includes(x)).join(' '); },
        toggle: (c, an) => { const j = an === undefined ? !el.classList.contains(c) : !!an; if (j) el.classList.add(c); else el.classList.remove(c); return j; }
      };
      this.className = '';
    }
    get id() { return this._id; }
    set id(v) { this._id = String(v); if (v) reg.set(String(v), this); }
    get children() { return this.childNodes.filter((c) => c.nodeType === 1); }
    get firstChild() { return this.childNodes[0] || null; }
    get lastChild() { return this.childNodes[this.childNodes.length - 1] || null; }
    get firstElementChild() { return this.children[0] || null; }
    get parentElement() { return this.parentNode; }
    get isConnected() { return true; }
    get nodeName() { return this.tagName; }
    /* Inhalt */
    get innerHTML() { return this.childNodes.map((c) => c.outerHTML).join(''); }
    set innerHTML(v) { this._leeren(); zerlegen(String(v ?? ''), this); }
    get outerHTML() {
      if (this.nodeType === 3) return escText(this._text);
      const t = this.tagName.toLowerCase(), a = Object.entries(this._alleAttr()).map(([k, v]) => ` ${k}="${escAttr(v)}"`).join('');
      return `<${t}${a}>` + (LEER.has(t) ? '' : `${this.innerHTML}</${t}>`);
    }
    set outerHTML(v) { const n = new Knoten('div'); n.innerHTML = v; for (const c of [...n.childNodes]) this.parentNode?.insertBefore(c, this); this.remove(); }
    get textContent() { return this.nodeType === 3 ? this._text : this.childNodes.map((c) => c.textContent).join(''); }
    set textContent(v) { if (this.nodeType === 3) { this._text = String(v); return; } this._leeren(); if (v !== '' && v != null) this.appendChild(Object.assign(new Knoten('#text'), { _text: String(v) })); }
    get innerText() { return this.textContent; }
    set innerText(v) { this.textContent = v; }
    get data() { return this._text; }
    _leeren() { for (const c of this.childNodes) c.parentNode = null; this.childNodes = []; }
    insertAdjacentHTML(wo, h) {
      const n = new Knoten('div'); n.innerHTML = h; const neu = [...n.childNodes];
      if (wo === 'beforeend') for (const c of neu) this.appendChild(c);
      else if (wo === 'afterbegin') this.prepend(...neu);
      else if (wo === 'beforebegin') for (const c of neu) this.parentNode?.insertBefore(c, this);
      else { const nach = this.nextSibling; for (const c of neu) nach ? this.parentNode?.insertBefore(c, nach) : this.parentNode?.appendChild(c); }
    }
    insertAdjacentElement(wo, e) { if (wo === 'beforeend') this.appendChild(e); else if (wo === 'afterbegin') this.prepend(e); else if (wo === 'beforebegin') this.parentNode?.insertBefore(e, this); else this.parentNode?.appendChild(e); return e; }
    get nextSibling() { const l = this.parentNode?.childNodes || []; return l[l.indexOf(this) + 1] || null; }
    get nextElementSibling() { const l = this.parentNode?.children || []; return l[l.indexOf(this) + 1] || null; }
    get previousElementSibling() { const l = this.parentNode?.children || []; return l[l.indexOf(this) - 1] || null; }
    /* Attribute */
    _alleAttr() {
      const a = { ...this._attr };
      if (this.id) a.id = this.id; if (this.className) a.class = this.className;
      for (const [k, v] of Object.entries(this.dataset)) a['data-' + k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())] = v;
      if (this.hidden) a.hidden = ''; if (this.disabled) a.disabled = ''; if (this.open) a.open = '';
      return a;
    }
    setAttribute(k, v) {
      v = String(v); k = k.toLowerCase();
      if (k === 'id') this.id = v; else if (k === 'class') this.className = v; else if (k === 'hidden') this.hidden = true; else if (k === 'open') this.open = true;
      else if (k === 'disabled') this.disabled = true; else if (k === 'checked') this.checked = true; else if (k === 'type') this.type = v; else if (k === 'value') this.value = v;
      else if (k.startsWith('data-')) this.dataset[camel(k.slice(5))] = v;
      else this._attr[k] = v;
    }
    getAttribute(k) { k = k.toLowerCase(); const a = this._alleAttr(); if (k === 'type' && this.type) return this.type; return k in a ? String(a[k]) : null; }
    hasAttribute(k) { return this.getAttribute(k) !== null; }
    removeAttribute(k) {
      k = k.toLowerCase(); delete this._attr[k];
      if (k === 'hidden') this.hidden = false; if (k === 'open') this.open = false; if (k === 'disabled') this.disabled = false;
      if (k === 'id') this._id = ''; if (k === 'class') this.className = '';
      if (k.startsWith('data-')) delete this.dataset[camel(k.slice(5))];
    }
    toggleAttribute(k, an) { const j = an === undefined ? !this.hasAttribute(k) : !!an; if (j) this.setAttribute(k, ''); else this.removeAttribute(k); return j; }
    /* Baum */
    appendChild(c) { if (c.tagName === 'FRAGMENT') { for (const x of [...c.childNodes]) this.appendChild(x); return c; } c.remove(); c.parentNode = this; this.childNodes.push(c); return c; }
    append(...cs) { for (const c of cs) this.appendChild(typeof c === 'object' ? c : Object.assign(new Knoten('#text'), { _text: String(c) })); }
    prepend(...cs) { for (const c of [...cs].reverse()) { const k = typeof c === 'object' ? c : Object.assign(new Knoten('#text'), { _text: String(c) }); k.remove(); k.parentNode = this; this.childNodes.unshift(k); } }
    insertBefore(c, ref) { c.remove(); const i = this.childNodes.indexOf(ref); c.parentNode = this; if (i < 0) this.childNodes.push(c); else this.childNodes.splice(i, 0, c); return c; }
    removeChild(c) { this.childNodes = this.childNodes.filter((x) => x !== c); c.parentNode = null; return c; }
    replaceChildren(...cs) { this._leeren(); this.append(...cs); }
    remove() { if (this.parentNode) this.parentNode.removeChild(this); }
    replaceWith(n) { if (this.parentNode) { this.parentNode.insertBefore(n, this); this.remove(); } }
    cloneNode(tief) { const n = new Knoten(this.tagName.toLowerCase()); for (const [k, v] of Object.entries(this._alleAttr())) if (k !== 'id') n.setAttribute(k, v); if (tief) n.innerHTML = this.innerHTML; return n; }
    /* Ereignisse */
    addEventListener(t, f) { (this._on[t] ||= []).push(f); }
    removeEventListener(t, f) { this._on[t] = (this._on[t] || []).filter((x) => x !== f); }
    dispatchEvent(e) { for (const f of [...(this._on[e.type] || [])]) f.call(this, e); return true; }
    click() { if (this.disabled) return; this.dispatchEvent({ type: 'click', target: this, currentTarget: this, preventDefault() {}, stopPropagation() {} }); }
    focus() {} blur() {} select() {} scrollIntoView() {} showModal() { this.open = true; } show() { this.open = true; } close() { this.open = false; }
    reset() {} submit() {} requestSubmit() {} play() { return Promise.resolve(); } pause() {} animate() { return { finished: Promise.resolve(), cancel() {} }; }
    getBoundingClientRect() { return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 }; }
    getContext() { return new Proxy({}, { get: (_, k) => (k === 'canvas' ? this : () => ({})), set: () => true }); }
    /* Suchen */
    matches(sel) { return sel.split(',').some((s) => passt(this, s.trim().split(/\s+/))); }
    closest(sel) { for (let e = this; e && e.nodeType === 1; e = e.parentNode) if (e.matches(sel)) return e; return null; }
    contains(o) { for (let e = o; e; e = e.parentNode) if (e === this) return true; return false; }
    *_alle() { for (const c of this.childNodes) if (c.nodeType === 1) { yield c; yield* c._alle(); } }
    querySelectorAll(sel) {
      const teile = sel.split(',').map((s) => s.trim().split(/\s+/));
      return [...this._alle()].filter((e) => teile.some((t) => passt(e, t)));
    }
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  }
  /** passt e zu "a b c" (Nachfahren-Kette)? */
  function passt(e, teile) {
    if (!teilPasst(e, teile[teile.length - 1])) return false;
    let i = teile.length - 2;
    for (let p = e.parentNode; i >= 0 && p; p = p.parentNode) if (teilPasst(p, teile[i])) i--;
    return i < 0;
  }
  /** Kleiner HTML-Zerleger: Tags, Attribute, Text (genug fuer die App). */
  function zerlegen(html, eltern) {
    const stapel = [eltern];
    const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s=>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/g;
    let zuletzt = 0, m;
    const textAn = (t) => { if (t) stapel[stapel.length - 1].appendChild(Object.assign(new Knoten('#text'), { _text: dekodieren(t) })); };
    while ((m = re.exec(html))) {
      textAn(html.slice(zuletzt, m.index)); zuletzt = re.lastIndex;
      if (m[0].startsWith('<!--')) continue;
      const tag = m[2].toLowerCase();
      if (m[1]) { const i = stapel.map((e) => e.tagName).lastIndexOf(tag.toUpperCase()); if (i > 0) stapel.length = i; continue; }
      const e = new Knoten(tag);
      for (const a of m[3].matchAll(/([^\s=>\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) e.setAttribute(a[1], dekodieren(a[2] ?? a[3] ?? a[4] ?? ''));
      stapel[stapel.length - 1].appendChild(e);
      if (!m[4] && !LEER.has(tag)) stapel.push(e);
    }
    textAn(html.slice(zuletzt));
  }

  /* ---------- document, window ---------- */
  const wurzel = new Knoten('html');
  const body = wurzel.appendChild(new Knoten('body'));
  const fest = (id) => { const e = new Knoten('div'); e.id = id; body.appendChild(e); return e; };
  const document = {
    nodeType: 9, body, documentElement: wurzel, head: new Knoten('head'), hidden: false, visibilityState: 'visible', title: '', cookie: '', fonts: { ready: Promise.resolve() },
    _on: {}, addEventListener(t, f) { (this._on[t] ||= []).push(f); }, removeEventListener() {},
    createElement: (t) => new Knoten(t), createElementNS: (_, t) => new Knoten(t), createTextNode: (t) => Object.assign(new Knoten('#text'), { _text: String(t) }),
    createDocumentFragment: () => new Knoten('fragment'),
    getElementById: (id) => reg.get(id) || fest(id),
    querySelector(sel) {
      const s = sel.trim(), id = /^#([\w-]+)$/.exec(s);
      if (id) return document.getElementById(id[1]);
      const unter = /^#([\w-]+)\s+([^,]+)$/.exec(s);
      if (unter) return document.getElementById(unter[1]).querySelector(unter[2]);
      return wurzel.querySelector(s);
    },
    querySelectorAll(sel) {
      const s = sel.trim(), unter = /^#([\w-]+)\s+([^,]+)$/.exec(s);
      if (unter) return document.getElementById(unter[1]).querySelectorAll(unter[2]);
      return wurzel.querySelectorAll(s);
    },
    execCommand: () => false
  };
  const ablage = new Map(Object.entries(speicher));
  const localStorage = {
    getItem: (k) => (ablage.has(String(k)) ? ablage.get(String(k)) : null), setItem: (k, v) => { ablage.set(String(k), String(v)); },
    removeItem: (k) => { ablage.delete(String(k)); }, clear: () => ablage.clear(), key: (i) => [...ablage.keys()][i] ?? null, get length() { return ablage.size; }
  };
  const stumm = new Proxy(function () {}, { get: (_, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : stumm), apply: () => stumm, construct: () => stumm, set: () => true });
  let zeitgeber = 0;
  const nichtAusfuehren = () => ++zeitgeber;
  const ctx = {
    console, document, localStorage, sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', protocol: 'http:', host: '127.0.0.1', hostname: '127.0.0.1', pathname: '/', search: '', hash: '', replace() {}, reload() {}, assign() {} },
    history: { length: 1, state: null, pushState() {}, replaceState() {}, back() {} },
    navigator: { userAgent: 'node-sandbox', language: 'en-GB', languages: ['en-GB'], onLine: true, standalone: false },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {} }),
    getComputedStyle: () => new Proxy({}, { get: () => '' }),
    scrollTo() {}, scrollBy() {}, print() {}, alert() {}, confirm: () => false, prompt: () => null, open: () => null, focus() {},
    innerWidth: 1024, innerHeight: 768, devicePixelRatio: 1, scrollY: 0, pageYOffset: 0,
    setTimeout: nichtAusfuehren, setInterval: nichtAusfuehren, clearTimeout() {}, clearInterval() {}, requestAnimationFrame: nichtAusfuehren, cancelAnimationFrame() {}, queueMicrotask,
    performance: { now: () => performance.now() },
    crypto: webcrypto, TextEncoder, TextDecoder, URL, URLSearchParams, Blob, structuredClone, atob, btoa,
    fetch: () => Promise.reject(new Error('kein Netz in der Sandbox')),
    Event: class { constructor(type) { this.type = type; } }, CustomEvent: class { constructor(type, o) { this.type = type; this.detail = o?.detail; } },
    HTMLElement: Knoten, Element: Knoten, Node: Knoten,
    AudioContext: function AudioContext() { return stumm; }                 // Ton: alles nimmt alles an, nichts klingt
  };
  ctx.window = ctx; ctx.self = ctx; ctx.top = ctx;
  ctx.addEventListener = () => {}; ctx.removeEventListener = () => {};
  ctx.claude = { hot: { snapshot() {}, ready: (boot) => boot({}) } };    // wie im Browser-Test: Start ohne Vorgaben
  Object.assign(ctx, globale);
  vm.createContext(ctx);

  // Zufall mit Startwert (mulberry32) - die App nutzt Math.random
  vm.runInContext(`((M) => { const imul = M.imul; let s = ${seed >>> 0}; M.random = () => { s = (s + 0x6D2B79F5) | 0; let t = imul(s ^ (s >>> 15), 1 | s);
    t = (t + imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })(Math);`, ctx);

  let html = appLesen('utf8', { bauart });
  if (anpassen) html = anpassen(html);
  const m = /<script>\s*(\(function\(\)\{[\s\S]*\}\)\(\);)\s*<\/script>/.exec(html);
  if (!m) throw new Error('App-Skript (function(){ … })(); nicht gefunden');
  // seite: the page's own markup (everything in <body> before the app script) as elements - needed where the app looks
  // for elements inside fixed ones (e.g. "#aboutTop .flags" after a grown-up's login; task 3b-2b). Off by default.
  if (seite) {
    const b = /<body[^>]*>([\s\S]*?)<script>\s*\(function\(\)\{/.exec(html);
    if (!b) throw new Error('Seite (<body> vor dem App-Skript) nicht gefunden');
    zerlegen(b[1], body);
  }
  // Globale Namen im vm-Kontext sind langsam (jeder Zugriff geht ueber den Kontext); die haeufigen als lokale Namen
  // hineinreichen - fuer die App aendert sich nichts, es sind dieselben Objekte.
  const NAH = ['Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Date', 'Set', 'Map', 'RegExp', 'Symbol', 'Error', 'Promise', 'Intl',
    'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'document', 'window', 'localStorage', 'console', 'navigator', 'location'];
  const skript = `(function(${NAH.join(',')}){` + m[1].replace(/\}\)\(\);$/, 'globalThis.__bqHolen=(n)=>eval(n);})();') + `})(${NAH.join(',')});`;
  vm.runInContext(skript, ctx, { filename: 'index.html (App-Skript)', timeout: 20000 });
  const holen = (name) => ctx.__bqHolen(name);

  /** fn mit Zeitlimit ausfuehren (ms); eine Endlosschleife der App wird so zum Fehler. */
  // jedes Zeitlimit startet einen Waechter-Thread; innerhalb eines laufenden lauf() gilt dessen Limit weiter
  const job = new vm.Script('__bqJob()');
  let innen = false;
  function lauf(fn, ms = 5000) {
    if (innen) return fn();
    innen = true; ctx.__bqJob = fn;
    try { return job.runInContext(ctx, { timeout: ms }); } finally { ctx.__bqJob = null; innen = false; }
  }

  const $ = (sel) => document.querySelector(sel);
  /** sichtbar wie im Browser-Test: weder das Element noch ein Vorfahr ist hidden */
  const sichtbar = (sel) => { for (let e = $(sel); e && e.nodeType === 1; e = e.parentNode) if (e.hidden) return false; return true; };
  const zustand = () => holen('state');

  /** Alle Karten aller Faecher, wie die Fach-Seiten sie zeigen (inkl. Archiv): [{ fach, item, studio, text }]. */
  function alleKarten() {
    const karten = [];
    for (const s of holen('SUBJECTS')) {
      lauf(() => holen('openSubject')(s.key));
      for (const b of $('#subjectBody').querySelectorAll('button.world')) karten.push({ fach: s.key, item: b.dataset.item, studio: b.dataset.item.startsWith('studio:'), text: b.querySelector('.name').textContent });
    }
    return karten;
  }
  /** Fach oeffnen und die Karte anklicken (wie der Finger); gibt den Zustand zurueck. */
  function karteOeffnen(k, ms) {
    lauf(() => {
      holen('openSubject')(k.fach);
      const b = $('#subjectBody').querySelectorAll('button.world').find((x) => x.dataset.item === k.item);
      if (!b) throw new Error('Karte nicht gefunden: ' + k.item);
      b.click();
    }, ms);
    return zustand();
  }
  const klick = (sel, ms) => lauf(() => { const e = $(sel); if (!e) throw new Error('nicht gefunden: ' + sel); e.click(); }, ms);

  /** Die angezeigte Frage richtig beantworten - ueber die Knoepfe, die die App gebaut hat. */
  function frageBeantworten(q, ms) {
    lauf(() => {
      const A = $('#qAnswers');
      const knopf = (sel) => { const e = A.querySelector(sel); if (!e) throw new Error('Knopf fehlt: ' + sel + ' bei ' + text(q.prompt)); e.click(); };
      if (A.querySelector('#takeChallenge')) knopf('#takeChallenge');   // Practise Today: die Challenge annehmen
      if (q.kind === 'mc') knopf(`.opt[data-i="${q.answer}"]`);
      else if (q.kind === 'type') { for (const z of String(q.answer)) knopf(`.key[aria-label="${z}"]`); knopf('.key.go'); }
      else { for (const k of q.correct) knopf(`.ord[data-i="${k}"]`); knopf('#checkOrder'); }
    }, ms);
  }

  /** einen Wert direkt in den Speicher legen (wie eine Vorbereitung im Browser-Test). Im Testbau sind die alten Werte der
   *  feste Ausgangsstand der Protokolle (3b-2a): danach einmal neu rechnen lassen - wie nach einem Abgleich. */
  function setzen(k, v) { ablage.set(String(k), typeof v === 'string' ? v : JSON.stringify(v)); if (bauart === 'test') holen('evNeuLaden')(); }

  return { ctx, holen, lauf, $, sichtbar, zustand, alleKarten, karteOeffnen, klick, frageBeantworten, seed, ablage, setzen, bauart };
}
