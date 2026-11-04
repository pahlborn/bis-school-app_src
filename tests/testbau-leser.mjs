// Testlauf gegen den Testbau (Aufgabe 3b-2a, US7.2): dieselben Browser-Tests, nur mit bauart 'test'.
//
// Viele Tests lesen oder legen Werte direkt im Speicher (localStorage 'bq2_attempts' ...) - im Format des Live-Baus.
// Der Testbau schreibt diese Werte nicht mehr; er liest sie aus den Ereignissen (Modul lesen, Weiche in store).
// Dieser Uebersetzer laesst die Tests unveraendert:
//  - Die App bekommt in ihrem eigenen Bereich den echten Speicher (sie merkt nichts).
//  - Liest ein Test einen abzugleichenden Schluessel (getItem von aussen), antwortet die App so, wie sie ihn selbst
//    liest: aus dem Protokoll (alter Speicher als Ausgangsstand + Ereignisse).
//  - Legt ein Test etwas in den Speicher (setItem/removeItem/clear von aussen), rechnet die App einmal neu - wie nach
//    einem Abgleich (evNeuLaden).
// Nur fuer Tests: der Testbau selbst bleibt unveraendert (appServer/kontenServer setzen das nur bei bauart 'test' ein).

const ANFANG = "(function(){\r\n'use strict';";
const ANFANG_LF = "(function(){\n'use strict';";

/* in the app's own scope: the real storage, untouched by the wrapper below */
const ECHT = `
const localStorage = (() => { const r = window.localStorage, P = Storage.prototype;
  return { getItem: (k) => P.getItem.call(r, k), setItem: (k, v) => P.setItem.call(r, k, v), removeItem: (k) => P.removeItem.call(r, k),
    key: (i) => P.key.call(r, i), clear: () => P.clear.call(r), get length() { return r.length; } }; })();`;

/* at the end of the app's scope: the page's localStorage answers from the logs */
function uebersetzer() {
  const r = window.localStorage, P = Storage.prototype;
  const teile = (full) => {
    if (typeof full !== 'string' || !full.startsWith('bq2_')) return null;
    const rest = full.slice(4), sep = rest.lastIndexOf('__'), k = sep < 0 ? rest : rest.slice(sep + 2), pre = sep < 0 ? 'bq2_' : 'bq2_' + rest.slice(0, sep + 2);
    const art = lesenArt(k);
    return art ? { k, pre, art: art === 'person' || k === 'muted' ? 'person' : 'kind' } : null;
  };
  const leer = derive([], { now: 0 });                                   // values a new child has without anything stored
  const lies = (full) => {
    const t = teile(full); if (!t) return undefined;
    if (t.k === 'glance' || t.k === 'conceptSeen') {                     // the device's map: its own entries + every person's log
      const m = JSON.parse(P.getItem.call(r, full) || '{}'), alle = JSON.parse(P.getItem.call(r, 'bq2_personEvents') || '{}');
      for (const pid of Object.keys(alle)) {
        const st = evPersonLog(pid).stand(), wer = pid === 'p_eltern' ? 'parent' : pid;
        if (t.k === 'conceptSeen' && st.conceptSeen) m[pid === 'p_eltern' ? 'pin' : pid] = st.conceptSeen;
        if (t.k === 'glance') for (const [c, v] of Object.entries(st.glance || {})) m[wer + '|' + (c === 'p_kind' ? 'kid' : c)] = v;
      }
      return Object.keys(m).length ? JSON.stringify(m) : null;
    }
    if (t.art === 'person') { const q = evQuelle(t.k); if (!q) return undefined; const v = evLesen(q, t.k, undefined); return v === undefined ? null : JSON.stringify(v); }
    const v = evLesen({ log: evKindLog(t.pre), art: 'kind' }, t.k, undefined);
    if (v === undefined) return null;
    const j = JSON.stringify(v);
    return Object.prototype.hasOwnProperty.call(leer, t.k) && j === JSON.stringify(leer[t.k]) && P.getItem.call(r, full) === null ? null : j;   // "never stored" stays null
  };
  /* A test sets (or removes) a value of a child: in the test build that is a new base state (like a snapshot, task 3c) -
     today's values of that child become its old values, with this one changed, and the child's log starts empty. */
  const basisSetzen = (t, aendern) => {
    const st = evKindLog(t.pre).stand();
    for (const [k, v] of Object.entries(st)) if (!k.startsWith('_') && lesenArt(k) === 'kind') P.setItem.call(r, t.pre + k, JSON.stringify(k === 'grants' || k === 'grantlog' ? evLesen({ log: evKindLog(t.pre), art: 'kind' }, k, []) : v));
    aendern();
    P.removeItem.call(r, t.pre + 'events');
  };
  /* first try the gentle way: change only the old value - enough when no event of the log touches this value (e.g. a
     test prepares answers of earlier days); only otherwise the new base state with an empty log */
  const kindSetzen = (t, k, aendern, soll) => {
    const vorher = P.getItem.call(r, k);
    aendern(); evNeuLaden();
    if (lies(k) === soll) return;
    if (vorher === null) P.removeItem.call(r, k); else P.setItem.call(r, k, vorher);
    evNeuLaden();
    basisSetzen(t, aendern);
  };
  r.getItem = (k) => { const v = lies(k); return v === undefined ? P.getItem.call(r, k) : v; };
  r.setItem = (k, v) => { const t = teile(k); if (t && t.art === 'kind') kindSetzen(t, k, () => P.setItem.call(r, k, v), JSON.stringify(JSON.parse(v))); else P.setItem.call(r, k, v); evNeuLaden(); };
  r.removeItem = (k) => { const t = teile(k); if (t && t.art === 'kind') kindSetzen(t, k, () => P.removeItem.call(r, k), null); else P.removeItem.call(r, k); evNeuLaden(); };
  r.clear = () => { P.clear.call(r); evNeuLaden(); };
}

export function testbauLeser(html) {
  const anfang = html.includes(ANFANG) ? ANFANG : ANFANG_LF;
  if (html.split(anfang).length !== 2) throw new Error('testbauLeser: Anfang des App-Skripts nicht eindeutig');
  let out = html.replace(anfang, () => anfang + ECHT);
  const ende = /\}\)\(\);\s*<\/script>/;
  if (!ende.test(out)) throw new Error('testbauLeser: Ende des App-Skripts nicht gefunden');
  out = out.replace(ende, () => `(${uebersetzer.toString()})();})();</script>`);
  return out;
}
