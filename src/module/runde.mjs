// Module runde - no task twice in one round (Peter 03.11.). Measured on main (2 000 rounds each): Specific Examples
// 56 %, Number Combinations 45 %, Anleitung 26 %, Library 18 %, Capital Letters 16 %, Units 9 % of the rounds showed a
// task twice; Practise Today 6 %. Cause: two or more tasks of a round come from small sets of templates.
// Pure function, no screen, no storage, no randomness of its own: tested in Node (tests/module/runde.test.mjs).
// Inserted into the app by werkzeug/module.mjs.

/**
 * Replaces repeated tasks in a round by other tasks of the SAME level (the difficulty of the round stays the same).
 * Of every group of equal tasks one stays: the first one marked "keep" (e.g. a due repeat), otherwise the first one.
 * Replacements come from `more()` (for example a new round of the same quest), at most `tries` times.
 * Optional fallback supplies one finite existing-catalogue pool after the normal refills are exhausted.
 * Order and length stay; a task without a replacement stays as it is (never a shorter round).
 * @param {Array} round tasks
 * @param {() => Array} more new candidate tasks
 * @param {{id: (q) => string, level: (q) => number, keep?: (q) => boolean, tries?: number}} how
 * @returns {Array} a new array (the input is not changed)
 */
export function ohneDoppelte(round, more, { id, level, keep = () => false, tries = 12, fallback } = {}) {
  const out = round.slice(), ids = out.map(id), groups = new Map();
  ids.forEach((x, i) => { if (!groups.has(x)) groups.set(x, []); groups.get(x).push(i); });
  const replace = [];
  for (const idx of groups.values()) {
    if (idx.length < 2) continue;
    const stay = idx.find((i) => keep(out[i])) ?? idx[0];
    for (const i of idx) if (i !== stay) replace.push(i);
  }
  if (!replace.length) return out;
  const used = new Set(ids), stock = [];
  let geholt = 0, fallbackUsed = false;
  const take = (lv) => {
    for (;;) {
      const j = stock.findIndex((q) => level(q) === lv && !used.has(id(q)));
      if (j >= 0) return stock.splice(j, 1)[0];
      if (geholt >= tries) {
        if (!fallbackUsed && typeof fallback === 'function') { stock.push(...fallback()); fallbackUsed = true; continue; }
        return null;
      }
      stock.push(...more()); geholt++;
    }
  };
  for (const i of replace.sort((a, b) => a - b)) {
    const q = take(level(out[i]));
    if (q) { out[i] = q; used.add(id(q)); }
  }
  return out;
}
