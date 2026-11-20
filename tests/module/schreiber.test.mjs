// Modul schreiber ohne Browser (S12, Aufgabe 3b-1a): baut, prueft und speichert die Ereignisse der App.
// Der Vergleich mit der echten App (echte Klicks im Testbau) steht in tests/ableitung-vergleich.test.mjs.
//   node --test tests/module/schreiber.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { evSchreiber, newDeviceId, SCHREIBER_GRUENDE } from '../../src/module/schreiber.mjs';
import { checkEvent } from '../../src/module/ereignisse.mjs';
import { derive } from '../../src/module/ableitung.mjs';

const T0 = Date.parse('2026-11-03T08:00:00Z'), DAY = '2026-11-03';
let n = 0;
const rand = (k) => { n++; return Uint8Array.from({ length: k }, (_, i) => (n * 37 + i * 11) & 255); };
/* a fake app: one list in memory, a clock and the person acting */
function app({ person = 'p_k1', role = 'child', device = 'd_A1', list = [] } = {}) {
  const a = { list, clock: T0, me: { person, role }, writes: 0 };
  a.w = evSchreiber({ read: () => a.list, write: (l) => { a.list = l; a.writes++; }, device, who: () => a.me, now: () => a.clock, rand });
  return a;
}
const answer = (qid = 'q1', ok = true) => ({ day: DAY, skill: 'round', level: 2, attempt: 1, ok, qid });

test('schreibt ein gueltiges Ereignis mit Autor, Geraet und Zeit (UTC mit Millisekunden) ans Ende der Liste', () => {
  const a = app();
  const r = a.w.write('answer', answer());
  assert.equal(r.ok, true);
  assert.equal(a.list.length, 1); assert.equal(a.writes, 1);
  const e = a.list[0];
  assert.deepEqual(checkEvent(e), []);
  assert.equal(e, r.event);
  assert.deepEqual([e.type, e.author, e.device, e.at], ['answer', 'p_k1', 'd_A1', '2026-11-03T08:00:00.000Z']);
  assert.deepEqual(e.payload, answer());
  const p = answer('q2'); a.w.write('answer', p); p.ok = false;
  assert.equal(a.list[1].payload.ok, true, 'the payload is copied: later changes in the app do not reach the stored event');
  assert.deepEqual(a.w.problems, []);
});

test('Zeit: jedes Ereignis dieses Geraets mindestens 1 ms nach dem vorigen - auch bei stehender oder zurueckgestellter Uhr', () => {
  const a = app();
  for (let i = 0; i < 5; i++) a.w.write('answer', answer('q' + i));
  assert.deepEqual(a.list.map((e) => e.at.slice(17)), ['00.000Z', '00.001Z', '00.002Z', '00.003Z', '00.004Z'], 'clock stands still');
  a.clock = T0 - 3600 * 1000; a.w.write('answer', answer('zurueck'));
  assert.equal(a.list[5].at, '2026-11-03T08:00:00.005Z', 'clock set back an hour: still after the last one');
  a.clock = T0 + 60000; a.w.write('answer', answer('spaeter'));
  assert.equal(a.list[6].at, '2026-11-03T08:01:00.000Z', 'a later clock counts as it is');
  // events of another device do not push the time; the own ones already stored do (e.g. after a reload)
  const fremd = { ...a.list[0], device: 'd_B1', at: '2026-11-03T09:00:00.000Z' };
  const b = app({ list: [fremd, ...a.list] }); b.clock = T0;
  b.w.write('answer', answer('neu'));
  assert.equal(b.list.at(-1).at, '2026-11-03T08:01:00.001Z');
  for (let i = 1; i < a.list.length; i++) assert.ok(Date.parse(a.list[i].at) > Date.parse(a.list[i - 1].at));
});

test('Abgelehnt und nicht gespeichert: niemand angemeldet, ungueltiges Ereignis, Rolle darf das nicht - jede Ablehnung steht in problems', () => {
  assert.deepEqual(SCHREIBER_GRUENDE, ['wer-unbekannt', 'format', 'rolle-darf-nicht']);
  const a = app();
  a.me = null; assert.deepEqual(a.w.write('answer', answer()), { ok: false, type: 'answer', grund: 'wer-unbekannt' });
  a.me = { person: 'p_k1' }; assert.equal(a.w.write('answer', answer()).grund, 'wer-unbekannt', 'no role');
  a.me = { person: 'p_k1', role: 'child' };
  const f = a.w.write('answer', { ...answer(), level: 4 });
  assert.equal(f.grund, 'format'); assert.deepEqual(f.fehler, ['payload.level: invalid']);
  assert.equal(a.w.write('gibtsnicht', {}).grund, 'format');
  a.me = { person: 'kathie', role: 'child' }; assert.equal(a.w.write('answer', answer()).grund, 'format', 'person ID without p_');
  a.me = { person: 'p_k1', role: 'child' };
  assert.equal(a.w.write('setting_set', { setting: 'storyCap', value: 3 }).grund, 'rolle-darf-nicht', 'settings belong to the parents');
  assert.equal(a.w.write('sheet_discarded', { sheet: 's1' }).grund, 'rolle-darf-nicht');
  assert.equal(a.w.write('gap_state', { standard: 'X', state: 'hold', by: 'parents', schoolDay: DAY, day: DAY }).grund, 'rolle-darf-nicht', 'the child may only close automatically');
  a.me = { person: 'p_e1', role: 'parent' };
  assert.equal(a.w.write('answer', answer()).grund, 'rolle-darf-nicht', 'parents never answer for the child');
  a.me = { person: 'p_l1', role: 'teacher' };
  assert.equal(a.w.write('badge', { day: DAY, badge: 'thinker' }).grund, 'rolle-darf-nicht', 'a teacher writes no child data');
  assert.deepEqual(a.list, [], 'nothing refused was stored');
  assert.equal(a.writes, 0);
  assert.deepEqual(a.w.problems.map((p) => p.grund), ['wer-unbekannt', 'wer-unbekannt', 'format', 'format', 'format', 'rolle-darf-nicht', 'rolle-darf-nicht', 'rolle-darf-nicht', 'rolle-darf-nicht', 'rolle-darf-nicht']);
  a.me = { person: 'p_e1', role: 'parent' };
  assert.equal(a.w.write('sheet_discarded', { sheet: 's1' }).ok, true, 'the parent may discard');
  assert.equal(a.list.length, 1);
});

test('Gespeicherte Liste: alles, was keine Liste ist, gilt als leer; fremde Eintraege bleiben stehen', () => {
  for (const kaputt of [null, undefined, {}, 'x', 5]) {
    const a = app({ list: kaputt });
    assert.equal(a.w.write('answer', answer()).ok, true);
    assert.equal(a.list.length, 1, JSON.stringify(kaputt));
  }
  const alt = [{ irgendwas: 1 }, null];
  const a = app({ list: alt });
  a.w.write('answer', answer());
  assert.deepEqual(a.list.slice(0, 2), alt, 'the writer does not clean up what it did not write');
  assert.equal(alt.length, 2, 'the list read is not changed in place');
});

test('Ohne read, write, who oder now bricht der Schreiber ab (Programmfehler)', () => {
  const ok = { read: () => [], write: () => {}, who: () => ({}), now: () => 0, device: 'd_A1' };
  for (const fehlt of ['read', 'write', 'who', 'now']) assert.throws(() => evSchreiber({ ...ok, [fehlt]: undefined }), new RegExp(fehlt + ' fehlt'));
  assert.throws(() => evSchreiber(), /read fehlt/);
});

test('newDeviceId: "d_" und 20 Zeichen, gueltig im Ereignis; ohne rand zufaellig', () => {
  const d = newDeviceId(() => Uint8Array.from({ length: 20 }, (_, i) => i * 13));
  assert.match(d, /^d_[0-9A-Z]{20}$/);
  assert.equal(d, newDeviceId(() => Uint8Array.from({ length: 20 }, (_, i) => i * 13)), 'the same bytes give the same ID');
  const a = app({ device: d }); assert.equal(a.w.write('answer', answer()).ok, true);
  const viele = new Set(Array.from({ length: 200 }, () => newDeviceId()));
  assert.equal(viele.size, 200);
  for (const x of viele) assert.match(x, /^d_[0-9A-HJKMNP-TV-Z]{20}$/, 'no I, L, O, U');
});

test('Was der Schreiber speichert, liest derive wie die App (Antworten, Runde, Abzeichen, Wiederholung, Blatt)', () => {
  const a = app();
  a.w.write('answer', { ...answer('q1', false), family: null, response: '7', help: false, example: false });
  a.w.write('review', { day: DAY, qid: 'q1', box: 0, dueAt: '2026-11-04', question: { world: 'round', prompt: 'A' } });
  a.w.write('answer', { ...answer('q2'), help: false, example: false });
  a.w.write('round_done', { day: DAY, skill: 'round', stars: 7, count: 8 });
  a.w.write('badge', { day: DAY, badge: 'inquirer', skill: 'round' });
  a.w.write('sheet_created', { sheet: 's1', day: DAY, no: 1, writing: 'en', items: [{ q: { world: 'round', prompt: 'B' }, res: null }] });
  a.w.write('sheet_result', { sheet: 's1', index: 0, res: 'ok', day: DAY, qid: 'b' });
  a.me = { person: 'p_e1', role: 'parent' };
  a.w.write('sheet_created', { sheet: 's2', day: DAY, no: 2, writing: 'en', items: [] });
  a.w.write('sheet_discarded', { sheet: 's2' });
  assert.deepEqual(a.w.problems, []);
  const s = derive(a.list, { now: T0 + 86400000 });
  assert.equal(s.attempts.length, 3);
  assert.deepEqual(s.ev.round, [[DAY, 2, 0, false], [DAY, 2, 1, true], [DAY, 2, 1, true]]);
  assert.deepEqual(s.due.map((d) => [d.id, d.box, d.at]), [['q1', 0, '2026-11-04']]);
  assert.equal(s.total, 7); assert.equal(s.best_round, 7);
  assert.deepEqual(s.badges, { inquirer: 1 }); assert.deepEqual(s.tried, ['round']);
  assert.deepEqual(s.sheets.map((x) => x.id), ['s1']); assert.equal(s.sheetNo, 2);
});

/* ---------- Waechter: jede Schreibstelle eines abzugleichenden Schluessels in index.html hat einen Haken ----------
   Schreibstellen: store.set(, store.del(, kidWrite(. Ein Haken = eventHook( in derselben Zeile, der Zeile davor oder
   danach; jeder Haken zaehlt fuer hoechstens eine Schreibstelle (gleicher Schluessel zweimal in einer Zeile = eine Stelle).
   Ohne Haken erlaubt: lokale Schluessel (speicherstellen.json "lokal") und die abgeleiteten Werte, die derive aus
   den Ereignissen der Nachbarstellen rechnet (der Klick-Vergleich in tests/ableitung-vergleich.test.mjs prueft sie).
   OFFEN: was 3b-1b/3b-1c noch anschliessen - die Liste darf nur kuerzer werden. */
const ABGELEITET = { rankPolicy:'aus dem versionierten rank_seen (EP03)', ev: 'aus answer und sheet_result', total: 'Summe aus round_done', best_: 'Maximum aus round_done', tried: 'aus dem Abzeichen inquirer', sheetNo: 'aus sheet_created',
  grants: 'aus grant_set und grant_revoked (3b-1c; expiredLogged ist eine Geraetenotiz)' };
/* the writer itself: the child's log and the logs of the persons (3b-1c) - each written at exactly one place */
const PROTOKOLLE = ['events', 'personEvents'];
const OFFEN = {
  // 3b-1a, 3b-1b-1 ... -4 und 3b-1c sind angeschlossen: nichts mehr offen. Ohne Ereignis bleiben nur Gruppe B (Geraet)
  // und C/D (entfaellt) aus "Was bleibt auf dem Geraet" - sie stehen in speicherstellen.json als "lokal".
};
/* Schluessel, die nicht als Text dastehen: Ausdruck -> [Schluessel, Pruefung der Stelle] */
const AUSDRUCK = {
  "'best_'+k": [['best_'], () => true],
  "'chk_'+k": [['chk_'], () => true],
  'key': [['advent'], (umgebung) => umgebung.includes("const key='advent'")],
  'k': [['name', 'lastName', 'birthday', 'emoji', 'mySchool'], (umgebung) => umgebung.includes("['name','lastName','birthday','emoji','mySchool'].forEach(k=>store.del(k))")],
  'langKey()': [['kidLang', 'parentLang'], (umgebung) => umgebung.includes('store.set(langKey()')],
  'pwKey(u)': [['pw_'], () => true],
};
function schreibstellen() {
  const zeilen = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8').split(/\r?\n/);
  const verz = JSON.parse(fs.readFileSync(new URL('../../werkzeug/speicherstellen.json', import.meta.url), 'utf8')).localStorage;
  const eintrag = (k) => verz.find((e) => (e.praefix ? k.startsWith(e.key) : e.key === k));
  const out = [];
  zeilen.forEach((z, i) => {
    const hier = new Set();
    for (const m of z.matchAll(/(?:store\.(?:set|del)|kidWrite)\(\s*(?:acc\s*,\s*)?((?:'[^']*'(?:\+\w+)?)|[\w.]+(?:\([^)]*\))?)/g)) {
      if (/function kidWrite\(/.test(z) && m.index === z.indexOf('kidWrite(')) continue;     // the definition
      const ausdruck = m[1], umgebung = zeilen.slice(Math.max(0, i - 8), i + 1).join('\n');
      let keys;
      if (/^'[^']*'$/.test(ausdruck)) keys = [ausdruck.slice(1, -1)];
      else if (Object.hasOwn(AUSDRUCK, ausdruck) && AUSDRUCK[ausdruck][1](umgebung)) keys = AUSDRUCK[ausdruck][0];
      else keys = [null];
      for (const k of keys) { if (hier.has(k)) continue; hier.add(k); out.push({ zeile: i + 1, ausdruck, key: k, eintrag: k && eintrag(k), haken: false }); }
    }
  });
  // hooks per line, each one claimed once, sites in the order of the file: same line first, then the line before, then after
  const frei = zeilen.map((z) => (z.match(/eventHook\(/g) || []).length);
  const braucht = (s) => s.eintrag && s.eintrag.abgleich !== 'lokal' && !Object.hasOwn(ABGELEITET, s.eintrag.key) && !PROTOKOLLE.includes(s.eintrag.key);
  for (const s of out) {
    if (!braucht(s)) continue;
    const i = s.zeile - 1, j = [i, i - 1, i + 1].find((x) => frei[x] > 0);
    if (j !== undefined) { frei[j]--; s.haken = true; }
  }
  return out;
}

test('Waechter (3b-1): jede Schreibstelle eines abzugleichenden Schluessels hat einen Haken - ausser abgeleitet, lokal oder ausdruecklich offen', () => {
  const stellen = schreibstellen(), offen = Object.values(OFFEN).flat();
  assert.ok(stellen.length > 60, 'the guard finds the write sites: ' + stellen.length);
  const unbekannt = stellen.filter((s) => !s.key || !s.eintrag).map((s) => `Zeile ${s.zeile}: ${s.ausdruck} -> ${s.key}`);
  assert.deepEqual(unbekannt, [], 'every write site has a known key with an entry in speicherstellen.json');
  const pflicht = stellen.filter((s) => s.eintrag.abgleich !== 'lokal' && !Object.hasOwn(ABGELEITET, s.eintrag.key) && !PROTOKOLLE.includes(s.eintrag.key));   // the logs: the writer itself
  // since 3b-2a the logs keep their list in memory and store it themselves (evKindLog, evPersonLog) - not via store.set
  for (const k of PROTOKOLLE) assert.equal(stellen.filter((s) => s.key === k).length, 0, k + ' is not written with store.set any more');
  const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  assert.equal(html.split("localStorage.setItem(pre+'events'").length - 1, 1, 'events: written at exactly one place (evKindLog)');
  assert.equal(html.split("localStorage.setItem('bq2_personEvents'").length - 1, 1, 'personEvents: written at exactly one place (evPersonLog)');
  const ohne = pflicht.filter((s) => !s.haken && !offen.includes(s.eintrag.key)).map((s) => `Zeile ${s.zeile}: ${s.key}`);
  assert.deepEqual(ohne, [], 'write sites without eventHook');
  for (const k of offen) assert.ok(pflicht.some((s) => s.eintrag.key === k && !s.haken), `"${k}" is in OFFEN but has no open site any more - remove it from the list`);
  const mitHaken = new Set(pflicht.filter((s) => s.haken).map((s) => s.eintrag.key));
  for (const k of ['attempts', 'due', 'badges', 'rankSeen', 'sheets', 'name', 'chk_', 'unlocked', 'focusManual', 'advent', 'gaps', 'jokeSeen', 'storyRead', 'muted',
    'grantlog', 'parentLang', 'conceptSeen', 'glance', 'lastBackup']) assert.ok(mitHaken.has(k), 'hooked: ' + k);   // 3a, 3b-1b-1 ... -4, 3b-1c
  assert.deepEqual(pflicht.filter((s) => !s.haken).map((s) => `Zeile ${s.zeile}: ${s.key}`), [], '3b-1c: the open list is empty');
  // nothing that "Was bleibt auf dem Geraet" puts into group A stays "lokal" (except the recordings, decided later)
  const verz = JSON.parse(fs.readFileSync(new URL('../../werkzeug/speicherstellen.json', import.meta.url), 'utf8')).localStorage;
  for (const k of ['jokeSeen', 'storyRead', 'muted', 'parentLang', 'conceptSeen', 'glance', 'lastBackup']) assert.notEqual(verz.find((e) => e.key === k).abgleich, 'lokal', 'group A: ' + k);
  console.log(`  Waechter: ${stellen.length} Schreibstellen, ${pflicht.filter((s) => s.haken).length} mit Haken, offen: ${pflicht.filter((s) => !s.haken).length} (${[...new Set(pflicht.filter((s) => !s.haken).map((s) => s.eintrag.key))].join(', ')})`);
});

test('Waechter: jeder Schluessel aus "abgeleitet" und "offen" steht so im Verzeichnis; abgeleitete rechnet derive wirklich', () => {
  const verz = JSON.parse(fs.readFileSync(new URL('../../werkzeug/speicherstellen.json', import.meta.url), 'utf8')).localStorage;
  for (const k of [...Object.keys(ABGELEITET), ...Object.values(OFFEN).flat()]) assert.ok(verz.some((e) => e.key === k), k);
  for (const k of Object.keys(ABGELEITET)) assert.notEqual(verz.find((e) => e.key === k).abgleich, 'lokal', k);
  const s = derive([], { now: T0 });
  for (const k of ['ev', 'total', 'tried', 'treeStage', 'sheetNo']) assert.ok(k in s, 'derive: ' + k);
  const a = app({ person: 'p_e1', role: 'parent' });                      // grants: only once there is a grant (as in the app)
  a.w.write('grant_set', { grant: 'g1', grantee: 'p_l1', scope: ['learning'], from: DAY, until: DAY });
  assert.deepEqual(derive(a.list, { now: T0 }).grants.map((g) => g.id), ['g1'], 'derive: grants');
  assert.equal('grants' in s, false, 'no grant event: no key');
  const child=app();child.w.write('rank_seen',{rank:'Explorer',policy:'legacy.v1'});assert.equal(derive(child.list,{now:T0}).rankPolicy,'knowledge.v1','rankPolicy is genuinely derived from its existing title event');
});

test('3b-1c: Freigaben, Personen-Einstellungen, Blick und Sicherung - was der Schreiber speichert, liest derive wie die App', () => {
  const a = app({ person: 'p_e1', role: 'parent' });
  const g = { grant: 'g1', grantee: 'p_l1', scope: ['learning', 'school'], from: DAY, until: '2026-11-16', text: 'Sie geben ...' };
  assert.equal(a.w.write('grant_set', g).ok, true);
  a.clock += 1000; assert.equal(a.w.write('grant_revoked', { grant: 'g1', grantee: 'p_l1' }).ok, true);
  a.clock += 1000; a.w.write('grant_revoked', { grant: 'g1', grantee: 'p_l1' });   // twice (two devices): logged once
  a.w.write('grant_revoked', { grant: 'gX', grantee: 'p_l1' });                       // unknown grant: nothing
  a.w.write('grant_set', { ...g, grant: 'g2', scope: ['learning'] });
  a.w.write('backup_made', { day: DAY });
  a.me = { person: 'p_l1', role: 'teacher' };
  assert.equal(a.w.write('grant_opened', { grant: 'g2', grantee: 'p_l1', scope: ['learning'] }).ok, true);
  assert.equal(a.w.write('grant_opened', { grant: 'g2', grantee: 'p_e1' }).grund, 'rolle-darf-nicht', 'only for himself');
  assert.equal(a.w.write('glance_set', { child: 'p_k1', value: {} }).grund, 'rolle-darf-nicht', 'no glance for a teacher');
  assert.equal(a.w.write('backup_made', { day: DAY }).grund, 'rolle-darf-nicht');
  a.me = { person: 'p_k1', role: 'child' };
  assert.equal(a.w.write('grant_set', g).grund, 'rolle-darf-nicht', 'the child grants nothing');
  const s = derive(a.list, { now: T0 + 86400000 }), at = (i) => a.list[i].at;
  assert.deepEqual(s.grants, [
    { id: 'g1', grantee: 'p_l1', scope: ['learning', 'school'], from: DAY, until: '2026-11-16', by: 'p_e1', revokedAt: at(1) },
    { id: 'g2', grantee: 'p_l1', scope: ['learning'], from: DAY, until: '2026-11-16', by: 'p_e1' }]);
  assert.deepEqual(s.grantlog, [
    { at: at(0), ev: 'erteilt', grant: 'g1', grantee: 'p_l1', scope: ['learning', 'school'], until: '2026-11-16', by: 'p_e1', text: 'Sie geben ...' },
    { at: at(1), ev: 'widerrufen', grant: 'g1', grantee: 'p_l1', by: 'p_e1' },
    { at: at(4), ev: 'erteilt', grant: 'g2', grantee: 'p_l1', scope: ['learning'], until: '2026-11-16', by: 'p_e1', text: 'Sie geben ...' },
    { at: at(6), ev: 'geöffnet', grant: 'g2', grantee: 'p_l1', scope: ['learning'] }]);
  assert.equal(s.lastBackup, DAY);
  // the log of one person: language, sound, "How it works", glance per child
  const p = app({ person: 'p_e1', role: 'parent' });
  p.w.write('person_set', { field: 'parentLang', value: 'en' });
  p.w.write('person_set', { field: 'muted', value: true });
  p.w.write('person_set', { field: 'conceptSeen', value: DAY });
  p.w.write('glance_set', { child: 'p_k1', value: { at: DAY, n: 3, idea: 0 } });
  p.w.write('glance_set', { child: 'p_k2', value: { at: DAY, n: 1, idea: 0 } });
  p.w.write('glance_set', { child: 'p_k1', value: { at: DAY, n: 9, idea: 1 } });
  p.w.write('person_set', { field: 'parentLang', value: 'de' });
  p.w.write('person_set', { field: 'muted', value: null });
  assert.deepEqual(p.w.problems, []);
  const q = derive(p.list, { now: T0 });
  assert.deepEqual([q.parentLang, 'muted' in q, q.conceptSeen], ['de', false, DAY]);
  assert.deepEqual(q.glance, { p_k1: { at: DAY, n: 9, idea: 1 }, p_k2: { at: DAY, n: 1, idea: 0 } });
  for (const role of ['child', 'teacher', 'admin']) { const x = app({ person: 'p_x1', role }); assert.equal(x.w.write('person_set', { field: 'parentLang', value: 'en' }).ok, true, role + ': own settings'); }
  assert.equal(p.w.write('person_set', { field: 'kidLang', value: 'en' }).grund, 'format', 'the child\'s language is no person setting');
});

test('Modul ist rein: kein Speicher, kein Netz, keine eigene Uhr; Hilfsnamen mit sw-Praefix', () => {
  const src = fs.readFileSync(new URL('../../src/module/schreiber.mjs', import.meta.url), 'utf8');
  for (const bad of ['Math.random', 'Date.now', 'localStorage', 'sessionStorage', 'indexedDB', 'fetch(', 'document.', 'window.']) assert.equal(src.includes(bad), false, bad);
  assert.doesNotMatch(src, /new Date\(\s*\)/);
  const top = [...src.matchAll(/^(?:export\s+)?(?:async\s+)?(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let)\s+([A-Za-z_$][\w$]*))/gm)].map((m) => m[1] || m[2]);
  for (const name of top) assert.ok(['evSchreiber', 'newDeviceId', 'SCHREIBER_GRUENDE'].includes(name) || /^(sw|SW_)/.test(name), 'shared scope: ' + name);
});
