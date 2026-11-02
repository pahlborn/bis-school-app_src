// Module ableitung - the stored state (today's storage keys and formats) computed from events
// (S12 P2, task 3a; EP7 / US7.2; concept 7.2 and 9.2).
// Pure functions: no screen, no storage, no network; "now" is passed in. Test build only (module.json: bau "test").
//
// The result looks exactly like what index.html keeps today, so the app can later read it unchanged:
//   attempts, ev, due, total, best_<quest>, badges, tried, treeStage, rankSeen, sheets, sheetNo
//   and the "last wins" values name, birthday, emoji, kidLang, focusMode, focusManual, unlocked, storyCap,
//   greetDay, mysteryDone, bdayParty, chk_<studio>.
// Not here: grants and their log (task 4), school data, recordings, everything that stays on the device.
//
// How: the events are merged (mergeLog: one id once, sorted by time) and then replayed one by one - each event does
// to the state what the matching place in index.html does today (rules copied from the code, see the comments).
// "Last wins" values come from lastWins. A base state (a snapshot, task 5) plus later events gives the same as
// all events together.
//
// Names: helpers start with "ab"/"AB" because all modules and index.html share one scope in the app.

import { mergeLog, lastWins, effectiveTime } from './ereignisse.mjs';

/* the limits of today's app (index.html: slice(-200) in attempts, EVIDENCE_MAX, DUE_MAX, GAPS, slice(-8) in sheets,
   TREE_AT, RANKS); the browser test compares them with the app */
export const DERIVE_LIMITS = { attempts: 200, evidence: 60, due: 40, sheets: 8 };
export const DERIVE_GAPS = [1, 3, 7];
export const DERIVE_TREE_AT = [0, 1, 3, 6, 10, 15, 25];
export const DERIVE_RANKS = ['Explorer', 'Investigator', 'Scientist', 'Professor', 'Legend'];

const abClone = (x) => JSON.parse(JSON.stringify(x));
const abOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);               // names come from events: never trust them as object keys
const abAddDays = (day, n) => new Date(Date.parse(day + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10);   // calendar days
const abSameRow = (a, b) => !!a && !!b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const abLevel = (q) => q.level || 2;                                           // index.html: levelOf
const abStage = (days) => DERIVE_TREE_AT.filter((x) => days >= x).length - 1;  // index.html: treeStage

/* ev: per skill the last answers as [day, level, ok] (index.html: recordAnswer); every row is a practice day */
function abPushEvidence(st, ctx, skill, row) {
  if (skill === '__proto__') return;
  const list = abOwn(st.ev, skill) ? st.ev[skill] : [];
  list.push(row);
  st.ev[skill] = list.slice(-DERIVE_LIMITS.evidence);
  ctx.days.add(row[0]);
}
function abPushAttempt(st, row) {
  st.attempts.push(row);
  st.attempts = st.attempts.slice(-DERIVE_LIMITS.attempts);
}
/* a grown-up changes a sheet result: take the old entry back exactly (index.html: undoResult). The repeat entry
   ("due") is not touched here: it only follows "review" events. */
function abUndoSheetResult(st, it) {
  const r = it.rec;
  if (!r) return false;                                                         // an old result without a record stays locked
  if (it.q.world === '__proto__') return false;
  const list = abOwn(st.ev, it.q.world) ? st.ev[it.q.world] : [];
  for (let i = list.length - 1; i >= 0; i--) if (abSameRow(list[i], r.ev)) { list.splice(i, 1); break; }
  st.ev[it.q.world] = list;
  st.attempts = st.attempts.filter((a) => a.sheet !== r.key);
  return true;                                                                  // (the caller sets the new result and record)
}

function abApply(st, ctx, e) {
  const p = e.payload;
  switch (e.type) {
    case 'answer': {                                                            // index.html: observeAttempt, showHint, showExample, showWorked
      abPushAttempt(st, abClone(p));                                            // the event IS the stored attempt
      const shown = p.hintShown || p.exampleShown || p.solutionShown;
      if (!shown && p.attempt === 1) abPushEvidence(st, ctx, p.skill, [p.day, p.help ? 1 : p.level, p.ok ? 1 : 0]);   // first try; with help (tip or assisted question) = support level
      else if (p.solutionShown && p.beforeTry) abPushEvidence(st, ctx, p.skill, [p.day, 1, 0]);                         // answer shown without an own try: not passed, support level
      break;
    }
    case 'round_done': {                                                        // index.html: showResults
      st.total += p.stars;
      const key = 'best_' + p.skill;
      if (p.stars > (st[key] || 0)) st[key] = p.stars;
      break;
    }
    case 'badge': {                                                             // index.html: addBadge; "inquirer" also remembers the quest (tried)
      if (p.badge === '__proto__') break;
      st.badges[p.badge] = (abOwn(st.badges, p.badge) ? st.badges[p.badge] : 0) + 1;
      if (p.badge === 'inquirer' && p.skill && !st.tried.includes(p.skill)) st.tried.push(p.skill);
      break;
    }
    case 'review': {                                                            // index.html: rememberWrong (box 0), advanceDue (box 1, 2; 3 = done / taken back)
      const i = st.due.findIndex((d) => d.id === p.qid);
      if (p.box >= DERIVE_GAPS.length) { if (i >= 0) st.due.splice(i, 1); break; }
      const at = p.dueAt || abAddDays(p.day, DERIVE_GAPS[p.box]);
      if (p.box === 0) {
        if (!p.question) break;                                                 // nothing to repeat without the question
        if (i >= 0) st.due.splice(i, 1);
        st.due.push({ id: p.qid, box: 0, at, q: abClone(p.question) });
        st.due = st.due.slice(-DERIVE_LIMITS.due);
      } else if (i >= 0) { st.due[i].box = p.box; st.due[i].at = at; }
      break;
    }
    case 'practice_day': ctx.days.add(p.day); break;
    case 'rank_seen': {                                                         // never lower
      if (DERIVE_RANKS.indexOf(p.rank) > DERIVE_RANKS.indexOf(st.rankSeen)) st.rankSeen = p.rank;   // unknown names are -1 and never win
      break;
    }
    case 'sheet_created': {                                                     // index.html: buildSheet
      if (st.sheets.some((s) => s.id === p.sheet)) break;
      st.sheets.push({ id: p.sheet, day: p.day, no: p.no, items: abClone(p.items), writing: p.writing });
      st.sheets = st.sheets.slice(-DERIVE_LIMITS.sheets);
      st.sheetNo = Math.max(st.sheetNo || 0, p.no);
      break;
    }
    case 'sheet_result': {                                                      // index.html: enterResult
      const sh = st.sheets.find((s) => s.id === p.sheet), it = sh && sh.items[p.index];
      if (!it || !it.q || it.res === p.res) break;
      if (it.res && !abUndoSheetResult(st, it)) break;
      const q = it.q, key = p.sheet + ':' + p.index;
      const row = [p.day, p.res === 'help' ? 1 : (q.assisted ? 1 : abLevel(q)), p.res === 'no' ? 0 : 1];
      if (q.world) abPushEvidence(st, ctx, q.world, row);
      it.rec = { ev: q.world ? abClone(row) : null, key, due: p.res === 'no' ? p.qid : null };
      abPushAttempt(st, { day: p.day, skill: q.world, level: abLevel(q), attempt: 1, ok: p.res !== 'no', help: p.res === 'help', sheet: key });
      it.res = p.res;
      ctx.days.add(sh.day);                                                     // a sheet with an entry counts as a practice day (its own day)
      if (!sh.principled && sh.items.every((i) => i.res)) sh.principled = true; // once per sheet, also after a correction
      break;
    }
    case 'sheet_discarded': st.sheets = st.sheets.filter((s) => s.id !== p.sheet); break;
    default: break;                                                             // "last wins" types and everything else: see derive
  }
}

/* "last wins" values (concept 7.2): the winning event of each field */
function abSetField(st, key, value) {
  if (value === null) delete st[key]; else st[key] = abClone(value);            // a cleared profile field is no stored key
}
function abApplyWinner(st, e) {
  const p = e.payload;
  switch (e.type) {
    case 'profile_set': abSetField(st, p.field, p.value); break;
    case 'setting_set': abSetField(st, p.setting, p.value); break;
    case 'day_flag': st[p.flag] = p.day; break;
    case 'checklist_set': {                                                     // one tick; the list grows as far as the highest tick
      const key = 'chk_' + p.studio, a = Array.isArray(st[key]) ? st[key].slice() : [];
      while (a.length <= p.index) a.push(false);
      a[p.index] = p.value;
      st[key] = a;
      break;
    }
    default: break;                                                             // rank_seen: the highest one counts (abApply)
  }
}

/* derive(events, { now, base }): the state in today's storage format.
   events: any list (any order, doubles are fine); invalid ones are ignored (see mergeLog for the report).
   now:    milliseconds / Date / UTC text - needed for the clock rule (a time more than 24 h ahead counts as "now").
   base:   optional { upTo, state } - a state (a result of derive, e.g. from a snapshot) as of the time upTo;
           only events after upTo are replayed on top of it.
   The result has one extra key, _days (the practice days so far), that a later base needs; it is not a storage key. */
export function derive(events, { now, base } = {}) {
  if (now === undefined || now === null) throw new Error('derive: "now" is missing');
  const st = Object.assign({ attempts: [], ev: {}, due: [], total: 0, badges: {}, tried: [], treeStage: 0, sheets: [], sheetNo: 0, _days: [] }, base ? abClone(base.state) : {});
  const ctx = { days: new Set(st._days) };
  let list = mergeLog([Array.isArray(events) ? events : []], now).events;
  if (base) {
    const upTo = effectiveTime(base.upTo, now);
    if (Number.isNaN(upTo)) throw new Error('derive: base.upTo is not a UTC time');
    list = list.filter((e) => effectiveTime(e.at, now) > upTo);
  }
  for (const e of list) abApply(st, ctx, e);
  for (const e of Object.values(lastWins(list, now))) abApplyWinner(st, e);
  st.treeStage = Math.max(st.treeStage || 0, abStage(ctx.days.size));         // the tree only grows (index.html keeps the highest stage)
  st._days = [...ctx.days].sort();
  return st;
}
