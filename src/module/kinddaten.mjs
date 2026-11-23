// Module kinddaten - export and deletion of a child's data, deletion of a parent's account (preparation of stage 4,
// task "Export und Loeschen"; EP12: US12.1, US12.2, E8; concept 7.2, 13). Test build only (module.json: bau "test",
// after geraete). No screen, no timer, no clock, no network of its own: device storage, storage access, opened account
// and time are passed in. The buttons in the parents' area come with the family build (task "Familienfassung bauen").
//
//   kindDatenExport (US12.1, Art. 15/20 GDPR): a parent gets ALL data of one child of his family as a file - JSON (every
//     value, every event) and a readable page (HTML, German or English). What it holds follows concept 7.2: every
//     storage place of the app (werkzeug/speicherstellen.json, KINDDATEN_STELLEN here - a test compares both lists) is
//     named, with its value or with the reason why it is not in the export (only on a device, a grown-up's own setting).
//     It reads what this device holds after the last sync - the app syncs right before (abgleichMitVerbindungen).
//     Teacher, admin and the child itself cannot export (nicht-erlaubt).
//   kindDatenLoeschen (US12.2, E8): a parent deletes a child of his family. Order:
//     1. family_set removed = true about the child in the family area, sent at once (so every device of the family drops
//        the child and nobody hands it keys or makes its areas anew - modules einladung, geraeteabgleich)
//     2. in the storage: every area of the child (kind:lern, kind:privat, schule, eltern:allg, person:<child>, the areas
//        of its grants) with all bundles and key entries, its directory entries (login name, every new password) and
//        the open invitations this parent gave out for it
//     3. on this device: everything of the child (einladung.kindLokalEntfernen)
//     If step 1 cannot be sent (offline), nothing is deleted in the storage (nicht-gesendet) - call it again: a child
//     the family already took out (verbindungen().entfernt) can still be deleted.
//   kontoDatenLoeschen (US12.2): a parent deletes his own account - with his password (a stolen device that is still
//     logged in cannot do it). The last parent of a family: every child (as above), the family area, his own area and
//     directory entries - the whole family is gone. With another parent: he leaves the family (family_set removed about
//     himself, sent at once), his own area, directory entries and open invitations go; the other parent's next sync
//     changes every key without him (module geraeteabgleich). The children stay with the other parent - but not on his
//     devices: this one drops the children and the family at once (kinder: entries with nurLokal), his other devices
//     with their next sync (module einladung abgleichMitVerbindungen: elternAusgetreten).
//   Honest limit (Peter, 05.11.): GitHub keeps old, encrypted versions in the git history. Without the keys they cannot
//     be read - and the keys go with the directory entries. To remove them for good: docs/endgueltig-loeschen.md (delete
//     the repository or rewrite its history). The family area keeps that the child existed (encrypted, for the parents).
//
// Errors: Error with err.code - one of KINDDATEN_FEHLER, a code of module konto (anmeldung) or of the storage.
// Names: every helper starts with "kdt"/"KDT_" because all modules and index.html share one scope in the app.

import { newEvent, lastWins } from './ereignisse.mjs';
import { derive } from './ableitung.mjs';
import { grantsAblauf } from './lesen.mjs';
import { bereichName } from './bereiche.mjs';
import { zulassungAus, aktiveMitglieder } from './zulassung.mjs';
import { GERAETEABGLEICH_SPEICHER } from './geraeteabgleich.mjs';
import { anmelden, kontoLookup, kontoName, KONTO_STAENDE_MAX } from './konto.mjs';
import { verbindungen, abgleichMitVerbindungen, kindLokalEntfernen, elternLokalEntfernen } from './einladung.mjs';
import { meineGeraete } from './geraete.mjs';

/* error codes of this module */
export const KINDDATEN_FEHLER = Object.freeze(['nicht-erlaubt', 'kind-unbekannt', 'nicht-gesendet']);
/* format of the export file */
export const KINDDATEN_FORMAT = 'bq-kinddaten';
/* every storage place of the app (concept 7.2, werkzeug/speicherstellen.json without the prefix bq2_/bq_/bq) and where
   it is in the export: kind (the child's areas), schule, eltern (eltern:allg), geraet (only on a device, never synced -
   not in the export), person (a grown-up's own settings - not the child's data). praefix: the key is a family of keys. */
export const KINDDATEN_STELLEN = Object.freeze([
  ['attempts', 'kind'], ['ev', 'kind'], ['due', 'kind'], ['best_', 'kind', 1], ['total', 'kind'], ['badges', 'kind'], ['tried', 'kind'],
  ['treeLedger','kind'], ['treeStage', 'kind'], ['rankSeen', 'kind'], ['rankPolicy', 'kind'], ['name', 'kind'], ['lastName', 'kind'], ['birthday', 'kind'], ['mySchool', 'kind'], ['emoji', 'kind'],
  ['bdayParty', 'kind'], ['sheets', 'kind'], ['sheetNo', 'kind'], ['focusMode', 'kind'], ['focusManual', 'kind'], ['unlocked', 'kind'],
  ['storyCap', 'kind'], ['greetDay', 'kind'], ['mysteryDone', 'kind'], ['storyRead', 'kind'], ['jokeSeen', 'kind'], ['starLedger','kind'], ['contentFeedback','kind'], ['jokeRejected','kind'], ['chk_', 'kind', 1],
  ['advent', 'kind', 1], ['kidLang', 'kind'], ['muted', 'kind'], ['events', 'kind'],
  ['gaps', 'schule'],
  ['grants', 'eltern'], ['grantlog', 'eltern'], ['lastBackup', 'eltern'],
  ['parentLang', 'person'], ['conceptSeen', 'person'], ['glance', 'person'], ['personEvents', 'person'],
  ['pendingAdmission', 'geraet'], ['pendingEvents', 'geraet'],
  ['bridgeNext', 'geraet'], ['dayOffset', 'geraet'], ['vorRueckspielen', 'geraet'], ['session', 'geraet'], ['sessionPrev', 'geraet'],
  ['adultSession', 'geraet'], ['adultUnlock', 'geraet'], ['pw_', 'geraet', 1], ['parentPin', 'geraet'], ['migr', 'geraet'], ['lastSeen', 'geraet'], ['kidsHere', 'geraet'],
  ['evDevice', 'geraet'], ['schluessel', 'geraet'], ['abgleich', 'geraet'], ['abgleichVerworfen', 'geraet'], ['geraetEntfernen', 'geraet'],
  ['kontoListe', 'geraet'], ['UpdateTo', 'geraet'], ['audio', 'geraet', 1], ['konto', 'geraet'],
].map(([key, bereich, praefix]) => Object.freeze({ key, bereich, praefix: praefix === 1 })));

const KDT_KIND_ARTEN = ['kind:lern', 'kind:privat', 'schule', 'eltern:allg'];
const kdtObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const kdtPid = (x) => typeof x === 'string' && /^p_[0-9A-Za-z]{1,40}$/.test(x);
const kdtTag = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const kdtCmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
function kdtFehler(code) { const e = new Error('kinddaten: ' + code); e.code = code; return e; }
function kdtFalsch(text) { return new Error('kinddaten: ' + text); }
function kdtJson(ablage, k, d) {
  const v = ablage.getItem(k);
  if (v === null || v === undefined) return d;
  try { return JSON.parse(v); } catch (e) { return d; }
}
function kdtPruefen({ ablage, konto, now }) {
  if (!kdtObj(ablage) || typeof ablage.getItem !== 'function' || typeof ablage.setItem !== 'function') throw kdtFalsch('ablage (getItem/setItem) fehlt.');
  if (!kdtObj(konto) || !kdtPid(konto.kennung) || typeof konto.art !== 'string' || !kdtObj(konto.pub)) throw kdtFalsch('geoeffnetes Konto erwartet.');
  if (!Number.isFinite(now)) throw kdtFalsch('"now" fehlt.');
}
const kdtKlon = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));

/* ---------- the family as this device knows it ---------- */
/* the newest family_set per person of the family log (the app's log, bq2_familyEvents) */
function kdtFamilie(ablage, familie, now) {
  const alle = kdtJson(ablage, GERAETEABGLEICH_SPEICHER.familien, {});
  const log = kdtObj(alle) && Array.isArray(alle[familie]) ? alle[familie] : [];
  const out = new Map();
  for (const e of Object.values(lastWins(log.filter((x) => kdtObj(x) && x.type === 'family_set'), now))) out.set(e.payload.person, e.payload);
  return out;
}
/* appends an event of this account to a log of the app (family or own person log), after every event there */
function kdtSchreiben(ablage, K, id, konto, type, payload, now) {
  const geraet = kdtJson(ablage, GERAETEABGLEICH_SPEICHER.geraet, null);
  if (typeof geraet !== 'string' || !/^d_[0-9A-Za-z]{1,40}$/.test(geraet)) throw kdtFalsch('Geraet ohne Kennung (bq2_evDevice).');
  const alle = kdtJson(ablage, K, {}), o = kdtObj(alle) ? alle : {}, l = Array.isArray(o[id]) ? o[id] : [];
  let t = now;
  for (const e of l) { const x = kdtObj(e) ? Date.parse(e.at) : NaN; if (Number.isFinite(x) && x >= t) t = x + 1; }
  const e = newEvent({ type, author: konto.kennung, device: geraet, at: new Date(t).toISOString(), payload });
  o[id] = l.concat([e]);
  ablage.setItem(K, JSON.stringify(o));
  return e;
}
/* the child of this parent's family: from verbindungen (still there) or from entfernt (taken out, deletion not done) */
function kdtKind(ablage, konto, kind, now, { auchEntfernt = false } = {}) {
  if (konto.art !== 'parent') throw kdtFehler('nicht-erlaubt');
  if (!kdtPid(kind)) throw kdtFehler('kind-unbekannt');
  const v = verbindungen({ ablage, konto, now });
  if (!v.familie) throw kdtFehler('nicht-erlaubt');
  const k = v.kinder.find((c) => c.id === kind);
  if (k) return { v, k, entfernt: false };
  if (auchEntfernt && v.entfernt.some((x) => x.person === kind && x.role === 'child')) {
    const p = kdtFamilie(ablage, v.familie, now).get(kind);
    return { v, k: { id: kind, pre: 'bq2_' + kind + '__', anker: null, name: p && typeof p.name === 'string' ? p.name : null }, entfernt: true };
  }
  throw kdtFehler('kind-unbekannt');
}
/* the app's log of the child on this device */
const kdtLog = (ablage, kind) => { const l = kdtJson(ablage, 'bq2_' + kind + '__events', []); return Array.isArray(l) ? l.filter(kdtObj) : []; };
/* every area of the child: its four, its own, those of its grants (from its log and from the device state) */
function kdtBereiche(ablage, kind) {
  const grants = new Set();
  for (const e of kdtLog(ablage, kind)) if (kdtObj(e.payload) && /^grant_/.test(e.type) && typeof e.payload.grant === 'string') grants.add(e.payload.grant);
  const st = kdtJson(ablage, GERAETEABGLEICH_SPEICHER.staende, {});
  for (const a of ['kind:lern', 'eltern:allg'].map((x) => bereichName(x, kind))) {
    const s = kdtObj(st) ? st[a] : null;
    if (kdtObj(s) && Array.isArray(s.log)) for (const x of s.log) if (kdtObj(x) && kdtObj(x.event) && kdtObj(x.event.payload) && /^grant_/.test(x.event.type) && typeof x.event.payload.grant === 'string') grants.add(x.event.payload.grant);
  }
  const out = [...KDT_KIND_ARTEN, 'person'].map((a) => bereichName(a, kind));
  for (const g of [...grants].sort(kdtCmp)) { try { out.push(bereichName('freigabe', g)); } catch (e) { /* not a grant id */ } }
  return out;
}

/* ---------- export (US12.1) ---------- */
const KDT_TEXT = {
  de: {
    titel: 'Alle Daten von', erstellt: 'Erstellt am', von: 'von', stand: 'Stand: letzter Abgleich dieses Geräts. Die vollständige, maschinenlesbare Fassung steht in der JSON-Datei.',
    profil: 'Profil', lernstand: 'Lernstand', blaetter: 'Übungsblätter', einstellungen: 'Einstellungen', schule: 'Evaluations',
    luecken: 'Learning goals', freigaben: 'Freigaben', protokoll: 'Protokoll der Freigaben', geraete: 'Geräte', zugriff: 'Wer hat einen Schlüssel',
    stellen: 'Jede Speicherstelle der App', hinweise: 'Gut zu wissen', ereignisse: 'Alle Einträge',
    feld: 'Feld', wert: 'Wert', bereich: 'Bereich', imExport: 'Im Export', grund: 'Hinweis', ja: 'ja', nein: 'nein', leer: '–',
    sterne: 'Sterne gesamt', abzeichen: 'Abzeichen', tage: 'Übungstage', antworten: 'Antworten', bestwerte: 'Bestwerte',
    empfaenger: 'Empfänger', umfang: 'Umfang', ab: 'von', bis: 'bis', status: 'Stand', beendet: 'beendet', abgelaufen: 'abgelaufen', laeuft: 'läuft',
    zeit: 'Zeit', was: 'Was', geraet: 'Gerät', name: 'Name', erstesMal: 'erstes Mal', zuletzt: 'zuletzt', entfernt: 'entfernt', person: 'Person', rolle: 'Rolle',
    asOf: 'Stand der Schule', quelle: 'Quelle', anzahl: 'Anzahl',
    gruende: { geraet: 'nur auf einem Gerät, wird nie abgeglichen', person: 'Einstellung eines Erwachsenen, keine Daten des Kindes', leer: 'keine Daten' },
    hinweisText: [
      'Sprachaufnahmen bleiben auf dem Gerät, auf dem sie entstanden sind; sie sind nicht in diesem Export (in der Sicherungsdatei des Geräts schon).',
      'Löschen entfernt die Daten aus dem gemeinsamen Speicher. GitHub bewahrt ältere, verschlüsselte Stände in der Versionsgeschichte auf; ohne die Schlüssel sind sie nicht lesbar. Wie man auch sie entfernt, steht in der Anleitung „Endgültig löschen“.',
    ],
  },
  en: {
    titel: 'All data of', erstellt: 'Created on', von: 'by', stand: 'As of the last sync of this device. The complete, machine-readable version is in the JSON file.',
    profil: 'Profile', lernstand: 'Progress', blaetter: 'Practice sheets', einstellungen: 'Settings', schule: 'Evaluations',
    luecken: 'Learning goals', freigaben: 'Shares', protokoll: 'Share log', geraete: 'Devices', zugriff: 'Who holds a key',
    stellen: 'Every storage place of the app', hinweise: 'Good to know', ereignisse: 'All entries',
    feld: 'Field', wert: 'Value', bereich: 'Area', imExport: 'In the export', grund: 'Note', ja: 'yes', nein: 'no', leer: '–',
    sterne: 'Stars in total', abzeichen: 'Badges', tage: 'Practice days', antworten: 'Answers', bestwerte: 'Best scores',
    empfaenger: 'Recipient', umfang: 'Scope', ab: 'from', bis: 'until', status: 'Status', beendet: 'ended', abgelaufen: 'expired', laeuft: 'active',
    zeit: 'Time', was: 'What', geraet: 'Device', name: 'Name', erstesMal: 'first seen', zuletzt: 'last seen', entfernt: 'removed', person: 'Person', rolle: 'Role',
    asOf: 'School as of', quelle: 'Source', anzahl: 'Count',
    gruende: { geraet: 'only on a device, never synced', person: "a grown-up's own setting, not the child's data", leer: 'no data' },
    hinweisText: [
      'Voice recordings stay on the device they were made on; they are not in this export (they are in that device\'s backup file).',
      'Deleting removes the data from the shared storage. GitHub keeps older, encrypted versions in its history; without the keys they cannot be read. The guide "Delete for good" explains how to remove them, too.',
    ],
  },
};
const kdtEsc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
function kdtWert(v, T) {
  if (v === undefined || v === null || v === '') return T.leer;
  if (typeof v !== 'object') return kdtEsc(v);
  return '<pre>' + kdtEsc(JSON.stringify(v, null, 2)) + '</pre>';
}
const kdtTabelle = (kopf, zeilen) => '<table><thead><tr>' + kopf.map((k) => '<th>' + kdtEsc(k) + '</th>').join('') + '</tr></thead><tbody>' +
  zeilen.map((z) => '<tr>' + z.map((c) => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table>';

/* the values of the storage places from the derived state -> { daten: { key: value }, stellen: { key: { bereich, imExport, grund? } } } */
function kdtStellen(st, log, T) {
  const daten = {}, stellen = {};
  for (const s of KINDDATEN_STELLEN) {
    if (s.bereich === 'geraet' || s.bereich === 'person') { stellen[s.key] = { bereich: s.bereich, imExport: false, grund: T.gruende[s.bereich] }; continue; }
    let wert;
    if (s.key === 'events') wert = log.length ? log : undefined;
    else if (s.praefix) {
      const o = {};
      for (const k of Object.keys(st).sort(kdtCmp)) if (k.startsWith(s.key) && k.length > s.key.length) o[k] = st[k];
      wert = Object.keys(o).length ? o : undefined;
    } else wert = Object.prototype.hasOwnProperty.call(st, s.key) ? st[s.key] : undefined;
    if (wert !== undefined) daten[s.key] = kdtKlon(wert);
    stellen[s.key] = { bereich: s.bereich, imExport: true, ...(wert === undefined ? { grund: T.gruende.leer } : {}) };
  }
  return { daten, stellen };
}

/* US12.1: all data of one child of this parent's family.
   -> { daten (the object), json (text), html (readable page), dateiname: { json, html } } */
export async function kindDatenExport({ ablage, konto, kind, now, heute, sprache = 'de' } = {}) {
  kdtPruefen({ ablage, konto, now });
  if (!kdtTag(heute)) throw kdtFalsch('"heute" (JJJJ-MM-TT) fehlt.');
  const T = KDT_TEXT[sprache === 'en' ? 'en' : 'de'];
  const { v, k } = kdtKind(ablage, konto, kind, now);
  const log = kdtLog(ablage, kind).slice().sort((a, b) => kdtCmp(String(a.at), String(b.at)) || kdtCmp(String(a.id), String(b.id)));
  const st = derive(log, { now });
  const ga = grantsAblauf(st, heute);
  st.grants = ga.grants; st.grantlog = ga.grantlog;
  const { daten, stellen } = kdtStellen(st, log, T);
  const schulbewertungen = log.filter((e) => e.type === 'school_import' && kdtObj(e.payload)).map((e) => ({ asOf: e.payload.asOf, source: e.payload.source || null, data: kdtKlon(e.payload.data), eingetragen: e.at }));
  const namen = {};                                                    // login names the family knows
  for (const [pid, p] of kdtFamilie(ablage, v.familie, now)) if (typeof p.name === 'string') namen[pid] = p.name;
  if (konto.anmeldename) namen[konto.kennung] = konto.anmeldename;
  if (k.name) namen[kind] = k.name;
  // who holds a key: the members of each area of the child as the admission says (signed events this device holds)
  const staende = kdtJson(ablage, GERAETEABGLEICH_SPEICHER.staende, {}), zugriff = [];
  for (const area of kdtBereiche(ablage, kind)) {
    const s = kdtObj(staende) ? staende[area] : null;
    if (!kdtObj(s) || !Array.isArray(s.log) || !k.anker) continue;
    const z = await zulassungAus(s.log, { area, anker: k.anker, now });
    zugriff.push({ bereich: area, mitglieder: Object.entries(aktiveMitglieder(z)).map(([pid, m]) => ({ person: pid, rolle: m.role, name: typeof namen[pid] === 'string' ? namen[pid] : null })).sort((a, b) => kdtCmp(a.person, b.person)) });
  }
  const geraete = meineGeraete({ ablage, person: kind, now }).map((g) => ({ geraet: g.geraet, name: g.name, erstesMal: g.erstesMal, zuletzt: g.zuletzt, entfernt: g.entfernt }));
  const out = {
    format: KINDDATEN_FORMAT, v: 1, erstellt: new Date(now).toISOString(),
    von: { kennung: konto.kennung, anmeldename: konto.anmeldename || null },
    kind: { kennung: kind, anmeldename: k.name || null },
    daten, uebungstage: st._days.slice(), schulbewertungen, geraete, zugriff, speicherstellen: stellen,
    hinweise: T.hinweisText.slice(),
  };
  // ---- readable page ----
  const d = daten, anzeige = [d.name, d.lastName].filter((x) => typeof x === 'string' && x).join(' ') || k.name || kind;
  const zeilen = (keys) => keys.filter((key) => Object.prototype.hasOwnProperty.call(d, key)).map((key) => ['<code>' + kdtEsc(key) + '</code>', kdtWert(d[key], T)]);
  const teile = [];
  const abschnitt = (titel, inhalt) => teile.push('<section><h2>' + kdtEsc(titel) + '</h2>' + inhalt + '</section>');
  abschnitt(T.profil, kdtTabelle([T.feld, T.wert], zeilen(['name', 'lastName', 'birthday', 'mySchool', 'emoji', 'kidLang', 'muted', 'bdayParty'])));
  const antworten = log.filter((e) => e.type === 'answer').length;
  abschnitt(T.lernstand, kdtTabelle([T.feld, T.wert], [
    [kdtEsc(T.sterne), kdtWert(d.total, T)], [kdtEsc(T.abzeichen), kdtWert(d.badges ? Object.keys(d.badges).length : 0, T)],
    [kdtEsc(T.tage), kdtWert(st._days.length, T)], [kdtEsc(T.antworten), kdtWert(antworten, T)],
  ].concat(zeilen(['best_', 'badges', 'tried', 'treeStage', 'rankSeen', 'ev', 'due', 'attempts']))));
  abschnitt(T.blaetter, kdtTabelle([T.feld, T.wert], zeilen(['sheetNo', 'sheets'])));
  abschnitt(T.einstellungen, kdtTabelle([T.feld, T.wert], zeilen(['focusMode', 'focusManual', 'unlocked', 'storyCap', 'greetDay', 'mysteryDone', 'chk_', 'advent', 'storyRead', 'jokeSeen'])));
  abschnitt(T.schule, schulbewertungen.length ? kdtTabelle([T.asOf, T.quelle, T.wert], schulbewertungen.map((s) => [kdtEsc(s.asOf), kdtWert(s.source, T), kdtWert(s.data, T)])) : '<p>' + kdtEsc(T.gruende.leer) + '</p>');
  abschnitt(T.luecken, kdtWert(d.gaps, T));
  const gs = Array.isArray(d.grants) ? d.grants : [];
  abschnitt(T.freigaben, gs.length ? kdtTabelle([T.empfaenger, T.umfang, T.ab, T.bis, T.status], gs.map((g) => [kdtWert(namen[g.grantee] || g.grantee, T), kdtWert((g.scope || []).join(', '), T), kdtWert(g.from, T), kdtWert(g.until, T), kdtEsc(g.revokedAt ? T.beendet : g.expiredLogged ? T.abgelaufen : T.laeuft)])) : '<p>' + kdtEsc(T.gruende.leer) + '</p>');
  const gl = Array.isArray(d.grantlog) ? d.grantlog : [];
  abschnitt(T.protokoll, gl.length ? kdtTabelle([T.zeit, T.was, T.empfaenger], gl.map((x) => [kdtWert(x.at, T), kdtWert(x.ev, T), kdtWert(namen[x.grantee] || x.grantee, T)])) : '<p>' + kdtEsc(T.gruende.leer) + '</p>');
  abschnitt(T.geraete, kdtTabelle([T.geraet, T.name, T.erstesMal, T.zuletzt, T.entfernt], geraete.map((g) => [kdtEsc(g.geraet), kdtWert(g.name, T), kdtWert(g.erstesMal, T), kdtWert(g.zuletzt, T), kdtWert(g.entfernt, T)])));
  abschnitt(T.zugriff, kdtTabelle([T.bereich, T.person, T.rolle], zugriff.flatMap((z) => z.mitglieder.map((m) => [kdtEsc(z.bereich), kdtWert(m.name || m.person, T), kdtEsc(m.rolle)]))));
  abschnitt(T.stellen, kdtTabelle([T.feld, T.bereich, T.imExport, T.grund], Object.entries(stellen).map(([key, s]) => ['<code>' + kdtEsc(key) + '</code>', kdtEsc(s.bereich), kdtEsc(s.imExport ? T.ja : T.nein), kdtWert(s.grund, T)])));
  abschnitt(T.hinweise, '<ul>' + T.hinweisText.map((t) => '<li>' + kdtEsc(t) + '</li>').join('') + '</ul>');
  abschnitt(T.ereignisse + ' (' + log.length + ')', kdtTabelle([T.zeit, T.was, T.wert], log.map((e) => [kdtEsc(e.at), kdtEsc(e.type), kdtWert(e.payload, T)])));
  // (the title tag is put together: the build of the test instance changes the app's own title and expects it once)
  const html = '<!DOCTYPE html><html lang="' + (T === KDT_TEXT.en ? 'en' : 'de') + '"><head><meta charset="utf-8"><' + 'title>' + kdtEsc(T.titel + ' ' + anzeige) + '</' + 'title>' +
    '<style>body{font-family:system-ui,sans-serif;margin:2em;max-width:60em}table{border-collapse:collapse;margin:.5em 0}th,td{border:1px solid #ccc;padding:.25em .5em;text-align:left;vertical-align:top}pre{margin:0;white-space:pre-wrap;font-size:.85em}</style></head><body>' +
    '<h1>' + kdtEsc(T.titel + ' ' + anzeige) + '</h1><p>' + kdtEsc(T.erstellt + ' ' + heute + ' ' + T.von + ' ' + (konto.anmeldename || konto.kennung)) + '. ' + kdtEsc(T.stand) + '</p>' +
    teile.join('') + '</body></html>';
  const datei = 'big-quest-' + (kontoName(k.name || '') || kind) + '-' + heute;
  return { daten: out, json: JSON.stringify(out, null, 2), html, dateiname: { json: datei + '.json', html: datei + '.html' } };
}

/* ---------- deleting (US12.2, E8) ---------- */
/* sends what this device wrote (the removal) and checks that the family area took it -> the sync report */
async function kdtSenden({ ablage, zugang, konto, now, heute, geraetName }, familie, e) {
  const r = await abgleichMitVerbindungen({ ablage, zugang, konten: [konto], now, heute, ...(geraetName ? { geraetName } : {}) });
  const area = bereichName('familie', familie), st = kdtJson(ablage, GERAETEABGLEICH_SPEICHER.staende, {})[area];
  const gesendet = kdtObj(st) && Array.isArray(st.log) && st.log.some((x) => kdtObj(x) && kdtObj(x.event) && x.event.id === e.id) && Array.isArray(st.ausgang) && !st.ausgang.some((x) => kdtObj(x) && kdtObj(x.event) && x.event.id === e.id) && !st.unterwegs;
  if (!gesendet) throw kdtFehler('nicht-gesendet');
  return r;
}
/* removes the areas and directory entries in the storage -> { bereiche: [{ bereich, buendel, schluessel }], verzeichnis } */
async function kdtSpeicherLeeren(zugang, bereiche, anmeldename) {
  const out = { bereiche: [], verzeichnis: 0 };
  for (const a of bereiche) out.bereiche.push({ bereich: a, ...(await zugang.removeArea(a)) });
  const n = kontoName(anmeldename || '');
  if (n) {
    const lookup = await kontoLookup(n);
    // new passwords first (entries "<lookup>-<n>"), the account entry last - a break in between leaves no orphan
    const weitere = [];
    for (let i = 2; i <= KONTO_STAENDE_MAX + 1; i++) { if ((await zugang.directory(lookup + '-' + i)) === null) break; weitere.push(lookup + '-' + i); }
    for (const l of weitere.reverse()) if (await zugang.removeDirectory(l)) out.verzeichnis++;
    if (await zugang.removeDirectory(lookup)) out.verzeichnis++;
  }
  return out;
}
/* withdraws this parent's open invitations for "person" (all with person undefined): storage + "withdrawn" in his log */
async function kdtEinladungenWeg(ablage, zugang, konto, v, person, now) {
  let n = 0;
  for (const o of v.offen) {
    if (person !== undefined && o.person !== person) continue;
    if (await zugang.invite.delete(o.invite)) n++;
    kdtSchreiben(ablage, GERAETEABGLEICH_SPEICHER.personen, konto.kennung, konto, 'invite_set', { ...o, state: 'withdrawn' }, now);
  }
  return n;
}
/* the family_set "removed" about "person" (keys, stand and name as the family knows them) */
function kdtAustragen(ablage, konto, v, person, rolle, pub, now) {
  const p = kdtFamilie(ablage, v.familie, now).get(person) || {};
  const payload = { person, role: rolle, pub: kdtObj(p.pub) ? { ...p.pub } : { ...pub }, stand: Number.isInteger(p.stand) && p.stand >= 1 ? p.stand : 1, removed: true };
  if (typeof p.name === 'string') payload.name = p.name;
  if (rolle === 'child' && kdtPid(p.anchor) && kdtObj(p.anchorPub)) { payload.anchor = p.anchor; payload.anchorPub = { ...p.anchorPub }; }
  return kdtSchreiben(ablage, GERAETEABGLEICH_SPEICHER.familien, v.familie, konto, 'family_set', payload, now);
}

/* US12.2: a parent deletes a child of his family (see the top). zugang = this device's storage access.
   -> { kind, bereiche: [{ bereich, buendel, schluessel }], verzeichnis, einladungen, lokal: { bereiche, schluessel } } */
export async function kindDatenLoeschen({ ablage, zugang, konto, kind, now, heute, geraetName } = {}) {
  kdtPruefen({ ablage, konto, now });
  if (!kdtTag(heute)) throw kdtFalsch('"heute" (JJJJ-MM-TT) fehlt.');
  if (!kdtObj(zugang) || typeof zugang.removeArea !== 'function' || typeof zugang.removeDirectory !== 'function') throw kdtFalsch('zugang (removeArea, removeDirectory) fehlt.');
  const { v, k, entfernt } = kdtKind(ablage, konto, kind, now, { auchEntfernt: true });
  const bereiche = kdtBereiche(ablage, kind);
  // 1. the family takes the child out - sent before anything is deleted
  const p = kdtFamilie(ablage, v.familie, now).get(kind);
  let e = null;
  if (!entfernt) e = kdtAustragen(ablage, konto, v, kind, 'child', p && p.pub, now);
  else {
    const alle = kdtJson(ablage, GERAETEABGLEICH_SPEICHER.familien, {})[v.familie];
    e = (Array.isArray(alle) ? alle : []).filter((x) => kdtObj(x) && x.type === 'family_set' && kdtObj(x.payload) && x.payload.person === kind && x.payload.removed === true).pop();
  }
  if (!e) throw kdtFehler('kind-unbekannt');
  await kdtSenden({ ablage, zugang, konto, now, heute, geraetName }, v.familie, e);
  // 2. the storage
  const sp = await kdtSpeicherLeeren(zugang, bereiche, k.name);
  const einladungen = await kdtEinladungenWeg(ablage, zugang, konto, verbindungen({ ablage, konto, now }), kind, now);
  // 3. this device
  const lokal = kindLokalEntfernen({ ablage, kind });
  return { kind, bereiche: sp.bereiche, verzeichnis: sp.verzeichnis, einladungen, lokal };
}

/* US12.2: a parent deletes his own account (see the top). passwort = his current password (asked again).
   -> { familieGeloescht (true: he was the last parent), kinder: [results of kindDatenLoeschen - or { kind, nurLokal: true }
        for a child that stays with the other parent and only leaves this device], bereiche, verzeichnis, einladungen } - afterwards the app logs him out and forgets him on this device */
export async function kontoDatenLoeschen({ ablage, zugang, konto, passwort, now, heute, geraetName, runden } = {}) {
  kdtPruefen({ ablage, konto, now });
  if (!kdtTag(heute)) throw kdtFalsch('"heute" (JJJJ-MM-TT) fehlt.');
  if (!kdtObj(zugang) || typeof zugang.removeArea !== 'function' || typeof zugang.removeDirectory !== 'function') throw kdtFalsch('zugang (removeArea, removeDirectory) fehlt.');
  if (konto.art !== 'parent') throw kdtFehler('nicht-erlaubt');
  const geprueft = await anmelden({ zugang, anmeldename: konto.anmeldename, passwort, ...(runden !== undefined ? { runden } : {}) });
  if (geprueft.kennung !== konto.kennung) throw kdtFehler('nicht-erlaubt');
  const v = verbindungen({ ablage, konto, now });
  if (!v.familie) throw kdtFehler('nicht-erlaubt');
  const andere = v.eltern.filter((pid) => pid !== konto.kennung);
  const out = { familieGeloescht: !andere.length, kinder: [], bereiche: [], verzeichnis: 0, einladungen: 0 };
  const eigene = [bereichName('person', konto.kennung)];
  if (!andere.length) {
    // the last parent: the whole family goes - every child first (each one sent and deleted on its own)
    for (const c of v.kinder.slice()) out.kinder.push(await kindDatenLoeschen({ ablage, zugang, konto, kind: c.id, now, heute, geraetName }));
    eigene.push(bereichName('familie', v.familie));
  } else {
    // another parent stays: this one leaves the family first (sent), the other parent's next sync changes every key
    const e = kdtAustragen(ablage, konto, v, konto.kennung, 'parent', konto.pub, now);
    await kdtSenden({ ablage, zugang, konto, now, heute, geraetName }, v.familie, e);
  }
  out.einladungen = await kdtEinladungenWeg(ablage, zugang, konto, verbindungen({ ablage, konto, now }), undefined, now);
  const sp = await kdtSpeicherLeeren(zugang, eigene, konto.anmeldename);
  out.bereiche = sp.bereiche; out.verzeichnis = sp.verzeichnis;
  // another parent stays: the children's data and the family leave this device as well (kinder: nurLokal - nothing of the
  // children was deleted in the storage; the app drops them from the device like a deleted child). His other devices do
  // the same with their next sync (module einladung, elternAusgetreten).
  if (andere.length) {
    const l = elternLokalEntfernen({ ablage, konto, now });
    for (const kind of l.kinder) out.kinder.push({ kind, bereiche: [], verzeichnis: 0, einladungen: 0, lokal: { bereiche: l.bereiche.filter((a) => a.endsWith(':' + kind)), schluessel: 0 }, nurLokal: true });
  }
  return out;
}
