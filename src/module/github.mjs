// Module github - the storage interface of module speicher (concept 11) on a GitHub repository (concept 12; stage 3a).
// Test build only (module.json: bau "test", after speicher). Network only through the fetch handed in; no browser storage
// except through githubTokenLesen/-Speichern with the storage handed in (the app passes the browser storage).
//
//   githubSpeicher({ repo, token, fetch, now, basis, zweig, wurzel }) -> { geraet(deviceId) -> access, anfragen() }
//     repo    "owner/name"
//     token   fine-grained token (only this repo, "Contents: read and write"); never appears in errors or results
//     fetch   the fetch function (tests: a recreated GitHub server on 127.0.0.1); default globalThis.fetch
//     now     clock in milliseconds (invitations)
//     basis   API address, default https://api.github.com
//     zweig   branch, default main
//     wurzel  optional sub folder in the repo (e.g. one folder per test run), default: repo root
//   The access offers the same functions as lokalerSpeicher (see speicher.mjs) and passes the same contract tests.
//   anfragen() -> { gesamt, unveraendert, je: { GET, PUT, DELETE } }: requests so far (unveraendert = answered 304,
//   does not count against the hourly limit).
//
// Files in the repo (concept 12, area names from module bereiche):
//   <wurzel>/events/<area>/<device>/<nr>.json   bundle; created, never overwritten
//   <wurzel>/keys/<area>/<holder>.json          wrapped keys; replaced with the sha of the old file
//   <wurzel>/directory/<lookup>.json            account entry; created once
//   <wurzel>/invites/<id>.json                  { angelegt, inhalt } valid 7 days (SPEICHER_EINLADUNG_MS), or { angelegt,
//                                               gueltig, inhalt } (invite.put options.gueltigMs, shorter); deleted when
//                                               fetched or withdrawn (invite.delete)
//
// Few requests (5 000 per hour and token):
//   list = one request for the folder <wurzel>/events with If-None-Match (unchanged -> 304, free) and, only when the
//   area changed, its tree (git/trees/<sha>?recursive=1; a tree never changes, so it is kept by sha). Contents one by
//   one. put checks the previous number only once per access (numbers that exist stay known).
// Errors (err.code from SPEICHER_FEHLER): network gone or server error (5xx) -> offline; missing file -> unbekannt (or
// null/[] where the interface says so); file exists when creating (409/422) -> vorhanden; 401/403 and 404 on writing
// -> zugang; limit reached (403 with x-ratelimit-remaining 0 or retry-after, 429) -> limit with err.wartezeit (ms).
// A write that GitHub refuses with 409 although the file does not exist (another commit came first) is repeated up
// to GITHUB_VERSUCHE times, then -> offline (the sync tries again later).
//
// Names: every helper starts with "ghs"/"GHS_" because all modules and index.html share one scope in the app.

import { SPEICHER_EINLADUNG_MS, SPEICHER_DATEI_FORMAT, speicherEinladungGueltig } from './speicher.mjs';

/* storage entry for the token of the test instance (never the token of the workshop apps) */
export const GITHUB_TOKEN_SCHLUESSEL = 'bqt_gh';
/* default API address */
export const GITHUB_API = 'https://api.github.com';
/* attempts for a write that collides with another commit */
export const GITHUB_VERSUCHE = 4;

const GHS_ID = /^[A-Za-z][A-Za-z0-9_:-]{0,127}$/;
const GHS_KENNUNG = /^([A-Za-z][A-Za-z0-9_:-]{0,127})\/([1-9][0-9]{0,8})$/;
const GHS_BAUMDATEI = /^([A-Za-z][A-Za-z0-9_:-]{0,127})\/([1-9][0-9]{0,8})\.json$/;
const GHS_REPO = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9._-]{1,100}$/;
const GHS_ZWEIG = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
const GHS_WURZEL = /^(?:[A-Za-z0-9_-]{1,64}(?:\/[A-Za-z0-9_-]{1,64}){0,7})?$/;
const GHS_TOKEN = /^[\x21-\x7e]{8,255}$/;
const GHS_LIMIT_MS = 60 * 1000;          // wait time when GitHub names none

function ghsFehler(code, extra) {
  const e = new Error('speicher: ' + code);
  e.code = code;
  if (extra) Object.assign(e, extra);
  return e;
}
const ghsObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const ghsNr = (n) => Number.isInteger(n) && n >= 1 && n <= 999999999;
function ghsId(x) {
  if (typeof x !== 'string' || !GHS_ID.test(x)) throw ghsFehler('ungueltig');
  return x;
}
function ghsText(x) {
  let t;
  try { t = JSON.stringify(x); } catch { t = undefined; }
  if (typeof t !== 'string') throw ghsFehler('ungueltig');
  return t;
}
function ghsJson(text) {
  try { return JSON.parse(text); } catch { throw ghsFehler('ungueltig'); }
}
const ghsSortiert = (keys) => [...keys].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

/* UTF-8 text <-> base64 (GitHub sends file contents as base64), in the browser and in Node */
function ghsZuB64(text) {
  const b = new TextEncoder().encode(text);
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}
function ghsAusB64(b64) {
  if (typeof b64 !== 'string') throw ghsFehler('ungueltig');
  let s;
  try { s = atob(b64.replace(/\s/g, '')); } catch { throw ghsFehler('ungueltig'); }
  return new TextDecoder().decode(Uint8Array.from(s, (c) => c.charCodeAt(0)));
}

/* ---------- token of the test instance ---------- */
/* reads only GITHUB_TOKEN_SCHLUESSEL from the storage handed in (getItem); missing or broken -> null */
export function githubTokenLesen(ablage) {
  let t = null;
  try { t = ablage.getItem(GITHUB_TOKEN_SCHLUESSEL); } catch { t = null; }
  return typeof t === 'string' && GHS_TOKEN.test(t) ? t : null;
}
/* stores the token (after trimming); an empty or broken token -> error "ungueltig" (without the value) */
export function githubTokenSpeichern(ablage, token) {
  const t = typeof token === 'string' ? token.trim() : '';
  if (!GHS_TOKEN.test(t)) throw ghsFehler('ungueltig');
  ablage.setItem(GITHUB_TOKEN_SCHLUESSEL, t);
}

/* ---------- the storage ---------- */
export function githubSpeicher({ repo, token, fetch: holer = globalThis.fetch, now = () => Date.now(), basis = GITHUB_API, zweig = 'main', wurzel = '' } = {}) {
  if (typeof repo !== 'string' || !GHS_REPO.test(repo) || repo.includes('..')) throw ghsFehler('ungueltig');
  if (typeof token !== 'string' || !GHS_TOKEN.test(token)) throw ghsFehler('ungueltig');
  if (typeof holer !== 'function' || typeof now !== 'function') throw ghsFehler('ungueltig');
  if (typeof basis !== 'string' || !/^https?:\/\/[^\s/?#]+$/.test(basis.replace(/\/+$/, ''))) throw ghsFehler('ungueltig');
  if (typeof zweig !== 'string' || !GHS_ZWEIG.test(zweig) || zweig.includes('..')) throw ghsFehler('ungueltig');
  if (typeof wurzel !== 'string' || !GHS_WURZEL.test(wurzel)) throw ghsFehler('ungueltig');
  const api = basis.replace(/\/+$/, '') + '/repos/' + repo;
  const zaehler = { gesamt: 0, unveraendert: 0, je: { GET: 0, PUT: 0, DELETE: 0 } };

  /* repo path -> URL part (every segment encoded: area names contain ":") */
  const pfad = (...teile) => (wurzel ? wurzel + '/' : '') + teile.join('/');
  const inhaltUrl = (p) => api + '/contents/' + p.split('/').map(encodeURIComponent).join('/');
  const ref = '?ref=' + encodeURIComponent(zweig);

  function ghsWartezeit(r) {
    const nach = Number(r.headers.get('retry-after'));
    if (r.headers.get('retry-after') !== null && Number.isFinite(nach) && nach >= 0) return nach * 1000;
    if (r.headers.get('x-ratelimit-remaining') === '0') {
      const bis = Number(r.headers.get('x-ratelimit-reset'));
      return Number.isFinite(bis) ? Math.max(0, bis * 1000 - now()) : GHS_LIMIT_MS;
    }
    return null;
  }

  /* one request; the token goes only into the Authorization header. Never passes on texts of the answer or of the
     network error (they could name the request). -> { status, daten, etag } */
  async function anfrage(methode, url, { body, etag } = {}) {
    const headers = { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + token, 'X-GitHub-Api-Version': '2022-11-28' };
    if (etag) headers['If-None-Match'] = etag;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    zaehler.gesamt++; zaehler.je[methode]++;
    let r;
    try {
      r = await holer(url, { method: methode, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store' });
    } catch {
      throw ghsFehler('offline');
    }
    const status = r.status;
    if (status === 304) { zaehler.unveraendert++; return { status, daten: null, etag }; }
    let daten = null;
    try { daten = await r.json(); } catch { daten = null; }
    if (status === 429 || status === 403) {
      const w = ghsWartezeit(r);
      if (status === 429 || w !== null) throw ghsFehler('limit', { wartezeit: w === null ? GHS_LIMIT_MS : w });
      throw ghsFehler('zugang');
    }
    if (status === 401) throw ghsFehler('zugang');
    if (status >= 500 || status === 0) throw ghsFehler('offline');
    return { status, daten, etag: r.headers.get('etag') };
  }

  /* file -> null | { text, sha } */
  async function dateiHolen(p) {
    const r = await anfrage('GET', inhaltUrl(p) + ref);
    if (r.status === 404) return null;
    if (r.status !== 200 || !ghsObj(r.daten) || r.daten.type !== 'file' || r.daten.encoding !== 'base64' || typeof r.daten.sha !== 'string') throw ghsFehler('ungueltig');
    return { text: ghsAusB64(r.daten.content), sha: r.daten.sha };
  }
  /* folder -> [{ name, type, sha }] ([] when missing) and its ETag */
  async function ordnerHolen(p, etag) {
    const r = await anfrage('GET', inhaltUrl(p) + ref, { etag });
    if (r.status === 304) return { unveraendert: true };
    if (r.status === 404) return { eintraege: [], etag: null };
    if (r.status !== 200 || !Array.isArray(r.daten)) throw ghsFehler('ungueltig');
    return { eintraege: r.daten.filter((e) => ghsObj(e) && typeof e.name === 'string' && typeof e.sha === 'string'), etag: r.etag };
  }
  const nachricht = (p) => 'bq: ' + p;
  /* creates a file, never overwrites -> true | { vorhanden: text } */
  async function dateiAnlegen(p, text) {
    for (let v = 0; v < GITHUB_VERSUCHE; v++) {
      const r = await anfrage('PUT', inhaltUrl(p), { body: { message: nachricht(p), content: ghsZuB64(text), branch: zweig } });
      if (r.status === 201 || r.status === 200) return true;
      if (r.status === 404) throw ghsFehler('zugang');                 // repo or branch not reachable with this token
      if (r.status !== 409 && r.status !== 422) throw ghsFehler('ungueltig');
      const da = await dateiHolen(p);
      if (da) return { vorhanden: da.text };
      // 409 without the file: another commit came first -> once more
    }
    throw ghsFehler('offline');
  }
  /* creates or replaces a file (with the sha of the old one) */
  async function dateiSchreiben(p, text) {
    for (let v = 0; v < GITHUB_VERSUCHE; v++) {
      const alt = await dateiHolen(p);
      const body = { message: nachricht(p), content: ghsZuB64(text), branch: zweig };
      if (alt) body.sha = alt.sha;
      const r = await anfrage('PUT', inhaltUrl(p), { body });
      if (r.status === 201 || r.status === 200) return;
      if (r.status === 404) throw ghsFehler('zugang');
      if (r.status !== 409 && r.status !== 422) throw ghsFehler('ungueltig');
    }
    throw ghsFehler('offline');
  }
  /* deletes exactly this version of a file -> true | false (already gone or changed) */
  async function dateiLoeschen(p, sha) {
    const r = await anfrage('DELETE', inhaltUrl(p), { body: { message: nachricht(p), sha, branch: zweig } });
    if (r.status === 200 || r.status === 204) return true;
    if (r.status === 404 || r.status === 409 || r.status === 422) return false;
    throw ghsFehler('ungueltig');
  }

  /* ---------- bundles ---------- */
  const bpfad = (bereich, g, nr) => pfad('events', bereich, g, nr + '.json');
  const bekannt = new Set();                // "area/device/nr" known to exist (files are never deleted)
  const baeume = new Map();                 // tree sha -> Map(device -> count); a tree never changes
  let ordner = { etag: null, bereiche: new Map() };   // folder events: area -> tree sha

  /* bundles per device in an area: Map(device -> count of 1..n without gap) */
  async function standVon(bereich) {
    const r = await ordnerHolen(pfad('events'), ordner.etag);
    if (!r.unveraendert) ordner = { etag: r.etag, bereiche: new Map(r.eintraege.filter((e) => e.type === 'dir').map((e) => [e.name, e.sha])) };
    const sha = ordner.bereiche.get(bereich);
    if (!sha) return new Map();
    if (baeume.has(sha)) return baeume.get(sha);
    if (!/^[0-9a-f]{40,64}$/.test(sha)) throw ghsFehler('ungueltig');
    const t = await anfrage('GET', api + '/git/trees/' + sha + '?recursive=1');
    if (t.status !== 200 || !ghsObj(t.daten) || !Array.isArray(t.daten.tree) || t.daten.truncated === true) throw ghsFehler('ungueltig');
    const nummern = new Map();
    for (const e of t.daten.tree) {
      const m = ghsObj(e) && e.type === 'blob' && typeof e.path === 'string' ? GHS_BAUMDATEI.exec(e.path) : null;
      if (!m) continue;
      if (!nummern.has(m[1])) nummern.set(m[1], new Set());
      nummern.get(m[1]).add(Number(m[2]));
    }
    const anzahl = new Map();
    for (const [g, s] of nummern) { let n = 0; while (s.has(n + 1)) n++; if (n) anzahl.set(g, n); }
    baeume.set(sha, anzahl);
    for (const [g, n] of anzahl) for (let i = 1; i <= n; i++) bekannt.add(bereich + '/' + g + '/' + i);
    return anzahl;
  }

  async function put(eigenes, bereich, g, b) {
    ghsId(bereich); ghsId(g);
    if (g !== eigenes) throw ghsFehler('fremdes-geraet');
    if (!ghsObj(b) || Object.keys(b).some((k) => k !== 'nr' && k !== 'inhalt') || !ghsNr(b.nr)) throw ghsFehler('ungueltig');
    const text = ghsText(b.inhalt);
    const vorher = bereich + '/' + g + '/' + (b.nr - 1);
    if (b.nr > 1 && !bekannt.has(vorher)) {
      if (!(await dateiHolen(bpfad(bereich, g, b.nr - 1)))) throw ghsFehler('luecke');
      bekannt.add(vorher);
    }
    const r = await dateiAnlegen(bpfad(bereich, g, b.nr), text);
    bekannt.add(bereich + '/' + g + '/' + b.nr);
    if (r !== true) throw ghsFehler('vorhanden', { gleicherInhalt: r.vorhanden === text });
    return g + '/' + b.nr;
  }

  async function list(bereich, seit) {
    ghsId(bereich);
    if (seit !== null && seit !== undefined && (!ghsObj(seit) || seit.bereich !== bereich || !ghsObj(seit.stand))) throw ghsFehler('ungueltig');
    const anzahl = await standVon(bereich);
    const stand = {};
    if (seit !== null && seit !== undefined) {
      for (const [g, n] of Object.entries(seit.stand)) {
        if (!GHS_ID.test(g) || !Number.isInteger(n) || n < 0 || n > (anzahl.get(g) || 0)) throw ghsFehler('ungueltig');
        stand[g] = n;
      }
    }
    const kennungen = [], neu = {};
    for (const g of ghsSortiert(anzahl.keys())) {
      const n = anzahl.get(g);
      for (let nr = (stand[g] || 0) + 1; nr <= n; nr++) kennungen.push(g + '/' + nr);
      neu[g] = n;
    }
    return { kennungen, merker: { bereich, stand: neu } };
  }

  async function get(bereich, kennung) {
    ghsId(bereich);
    const m = typeof kennung === 'string' ? GHS_KENNUNG.exec(kennung) : null;
    if (!m) throw ghsFehler('ungueltig');
    const f = await dateiHolen(bpfad(bereich, m[1], m[2]));
    if (!f) throw ghsFehler('unbekannt');
    return ghsJson(f.text);
  }

  /* ---------- keys, directory ---------- */
  async function keys(bereich) {
    ghsId(bereich);
    const { eintraege } = await ordnerHolen(pfad('keys', bereich));
    const halter = ghsSortiert(eintraege.filter((e) => e.type === 'file' && /\.json$/.test(e.name)).map((e) => e.name.slice(0, -5)).filter((h) => GHS_ID.test(h)));
    const out = {};
    for (const h of halter) {
      const f = await dateiHolen(pfad('keys', bereich, h + '.json'));
      if (f) out[h] = ghsJson(f.text);
    }
    return out;
  }
  async function putKey(bereich, halter, verpackt) {
    ghsId(bereich); ghsId(halter);
    await dateiSchreiben(pfad('keys', bereich, halter + '.json'), ghsText(verpackt));
  }

  async function directory(lookup) {
    ghsId(lookup);
    const f = await dateiHolen(pfad('directory', lookup + '.json'));
    return f ? ghsJson(f.text) : null;
  }
  async function putDirectory(eintrag) {
    if (!ghsObj(eintrag)) throw ghsFehler('ungueltig');
    ghsId(eintrag.lookup);
    const text = ghsText(eintrag);
    if ((await dateiAnlegen(pfad('directory', eintrag.lookup + '.json'), text)) !== true) throw ghsFehler('vorhanden');
  }

  /* ---------- invitations ---------- */
  const ipfad = (k) => pfad('invites', k + '.json');
  const invite = {
    async put(kennung, inhalt, optionen) {
      ghsId(kennung);
      const text = ghsText(inhalt), gueltig = speicherEinladungGueltig(optionen);
      if (gueltig === null) throw ghsFehler('ungueltig');
      // the default (7 days) is not written
      const dauer = gueltig === SPEICHER_EINLADUNG_MS ? '' : ',"gueltig":' + gueltig;
      if ((await dateiAnlegen(ipfad(kennung), '{"angelegt":' + Number(now()) + dauer + ',"inhalt":' + text + '}')) !== true) throw ghsFehler('vorhanden');
    },
    async get(kennung) {
      ghsId(kennung);
      const f = await dateiHolen(ipfad(kennung));
      if (!f) throw ghsFehler('unbekannt');
      const e = ghsJson(f.text);
      if (!ghsObj(e) || !Number.isFinite(e.angelegt) || !('inhalt' in e)) throw ghsFehler('ungueltig');
      const gueltig = speicherEinladungGueltig('gueltig' in e ? { gueltigMs: e.gueltig } : undefined);
      if (gueltig === null) throw ghsFehler('ungueltig');
      if (now() - e.angelegt >= gueltig) throw ghsFehler('abgelaufen');
      if (!(await dateiLoeschen(ipfad(kennung), f.sha))) throw ghsFehler('unbekannt');   // someone else was faster
      return e.inhalt;
    },
    async delete(kennung) {
      ghsId(kennung);
      const f = await dateiHolen(ipfad(kennung));
      return f ? dateiLoeschen(ipfad(kennung), f.sha) : false;
    },
  };

  /* ---------- file ---------- */
  async function exportFile(bereich) {
    ghsId(bereich);
    const anzahl = await standVon(bereich), liste = [];
    for (const g of ghsSortiert(anzahl.keys())) {
      for (let nr = 1; nr <= anzahl.get(g); nr++) liste.push({ geraet: g, nr, inhalt: await get(bereich, g + '/' + nr) });
    }
    return JSON.stringify({ format: SPEICHER_DATEI_FORMAT, v: 1, bereich, buendel: liste });
  }

  async function importFile(datei) {
    if (typeof datei !== 'string') throw ghsFehler('ungueltig');
    const d = ghsJson(datei);
    if (!ghsObj(d) || d.format !== SPEICHER_DATEI_FORMAT || d.v !== 1 || !Array.isArray(d.buendel)) throw ghsFehler('ungueltig');
    const bereich = ghsId(d.bereich);
    // check the whole file first, write afterwards: a refused file changes nothing
    const gesehen = new Set(), liste = [];
    for (const b of d.buendel) {
      if (!ghsObj(b) || Object.keys(b).some((k) => k !== 'geraet' && k !== 'nr' && k !== 'inhalt') || !ghsNr(b.nr)) throw ghsFehler('ungueltig');
      ghsId(b.geraet);
      const k = b.geraet + '/' + b.nr;
      if (gesehen.has(k)) throw ghsFehler('ungueltig');
      gesehen.add(k);
      liste.push({ geraet: b.geraet, nr: b.nr, text: ghsText(b.inhalt) });
    }
    const anzahl = await standVon(bereich);
    const neu = new Map(), alt = [];
    for (const x of liste) {
      if (x.nr <= (anzahl.get(x.geraet) || 0)) { alt.push(x); continue; }
      if (!neu.has(x.geraet)) neu.set(x.geraet, []);
      neu.get(x.geraet).push(x);
    }
    for (const [g, l] of neu) {
      l.sort((a, b) => a.nr - b.nr);
      const start = anzahl.get(g) || 0;
      if (l.some((x, i) => x.nr !== start + i + 1)) throw ghsFehler('ungueltig');
    }
    let gleich = 0, abweichend = 0, n = 0;
    for (const x of alt) {
      const f = await dateiHolen(bpfad(bereich, x.geraet, x.nr));
      if (f && f.text === x.text) gleich++; else abweichend++;
    }
    for (const g of ghsSortiert(neu.keys())) {
      for (const x of neu.get(g)) {
        const r = await dateiAnlegen(bpfad(bereich, g, x.nr), x.text);
        bekannt.add(bereich + '/' + g + '/' + x.nr);
        if (r === true) n++; else if (r.vorhanden === x.text) gleich++; else abweichend++;
      }
    }
    return { neu: n, gleich, abweichend };
  }

  function geraet(name) {
    ghsId(name);
    return {
      geraet: name,
      put: (bereich, g, b) => put(name, bereich, g, b),
      list, get, keys, putKey, directory, putDirectory,
      invite: { put: invite.put, get: invite.get, delete: invite.delete },
      exportFile, importFile,
    };
  }

  return { geraet, anfragen: () => ({ gesamt: zaehler.gesamt, unveraendert: zaehler.unveraendert, je: { ...zaehler.je } }) };
}
