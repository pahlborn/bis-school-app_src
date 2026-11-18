import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GRUNDLAGE } from '../../src/module/grundlage.mjs';
import { foundationExample, foundationDraw, GRUNDLAGE_BEISPIELE } from '../../src/module/grundlage-beispiele.mjs';
import { appSandbox, text } from '../app-sandbox.mjs';

const answer = q => q.kind === 'mc' ? text(q.options[q.answer]) : String(q.answer);
const nums = s => (s.match(/\d+/g) || []).map(Number);
const cells = q => [...q.visual.matchAll(/<td[^>]*>(\d)<\/td>/g)].map(m => +m[1]);
const sum = a => a.reduce((s, v) => s + v, 0);
const MATH = { numbers: 6, combos: 5, wordprob: 4, units: 4, graphs: 3 };
// Independent acceptance matrix for the specifically approved EV33-CC-M1 exceptions.
const FIXED_ANSWER_EXCEPTIONS = { sentences: [2, 3], anleitung: [2, 4], library: [1, 4] };
const isException = q => (FIXED_ANSWER_EXCEPTIONS[q.world] || []).includes(q.foundationFamily)
  || (q.world === 'units' && q.foundationFamily === 3 && answer(q) === '1 m');

function textFamily(S, world, family) {
  for (let i = 0; i < 200; i++) {
    const q = S.holen('baseQ')(world, { world });
    if (q.foundationFamily === family) return q;
  }
  assert.fail(`${world}/${family}: actual generator did not reach the requested family`);
}

// Independent arithmetic / drawing oracles, including the clock hands and graph geometry.
function checkMath(q) {
  const p = text(q.prompt), a = answer(q), n = nums(p), k = q.foundationFamily;
  if (q.world === 'numbers') {
    if (k === 0) assert.equal(+a, +cells(q).join(''));
    if (k === 1) {
      const hands = [...q.visual.matchAll(/<line x1="100" y1="100" x2="([\d.]+)" y2="([\d.]+)"[^>]+stroke-width="([75])"/g)];
      assert.equal(hands.length, 2);
      const short = hands.find(h => h[3] === '7'), long = hands.find(h => h[3] === '5');
      const m = +long[2] > 100 ? 30 : 0;
      const degrees = (Math.atan2(+short[1] - 100, 100 - +short[2]) * 180 / Math.PI + 360) % 360;
      const h = Math.round((degrees - m / 2) / 30 + 12) % 12 || 12;
      assert.equal(a, m ? `half past ${h}` : `${h} o’clock`);
    }
    if (k === 2) assert.equal(+a, n[0] + (p.includes('−') ? -n[1] : n[1]));
    if (k === 3) {
      assert.equal(+a, n[1] + (p.includes('more') ? n[0] : -n[0]));
      assert.ok(!q.explain.includes('Only the'), 'no false single-digit claim across 199 + 10 or 200 − 10');
    }
    if (k === 4) {
      assert.equal(a, n[0] % 2 ? 'Odd' : 'Even');
      assert.equal((q.visual.match(/●/g) || []).length, n[0]);
    }
    if (k === 5) {
      const d = cells(q), values = [+d.slice(0, 3).join(''), +d.slice(3).join('')];
      assert.equal(+a, Math.max(...values));
    }
  }
  if (q.world === 'combos') {
    if (k === 0) assert.equal(sum(nums(a)), n[0]);
    if (k === 1) assert.equal(+a, n[1] - n[0]);
    if (k === 2) assert.equal(+a, n[0] + n[1]);
    if (k === 3) assert.equal(+a, 100 - n[0]);
    if (k === 4) assert.equal(+a, n[0] - n[1]);
    assert.match(q.visual, /Whole and parts/);
    assert.match(q.explain, /=/);
  }
  if (q.world === 'wordprob') {
    if (k === 0) assert.equal(+a, n[0] + n[1]);
    if (k === 1) assert.equal(+a, n[0] - n[1]);
    if (k === 2) assert.equal(+a, n[0]);
    if (k === 3) { assert.match(a, /−/); assert.deepEqual(nums(a), n); }
    if (k !== 2) assert.match(q.visual, /Whole and parts/);
  }
  if (q.world === 'units') {
    if (k === 0) {
      const x = +q.visual.match(/ L([\d.]+) 56 Z/)[1];
      assert.equal(+a.split(' ')[0], Math.round((x - 30) / 540 * 100));
      assert.match(a, / cm$/);
    }
    if (k === 1) assert.equal(a, /door|bus|pool/.test(p) ? 'm' : 'cm');
    if (k === 2) assert.equal(a, /potatoes|dog|bike/.test(p) ? 'kg' : 'g');
    if (k === 3) assert.equal(a, p.includes('shorter') ? `${n[1]} cm` : '1 m');
  }
  if (q.world === 'graphs') {
    if (k === 2) {
      // Four vertical marks plus the crossing fifth in every full bundle.
      assert.equal(+a, (q.visual.match(/<line /g) || []).length);
    } else {
      const heights = [...q.visual.matchAll(/<rect[^>]+height="([\d.]+)"/g)].map(m => +m[1]);
      const labels = [...q.visual.matchAll(/font-size="16"[^>]*>([^<]+)<\/text>/g)].map(m => m[1]);
      assert.equal(heights.length, 3); assert.equal(labels.length, 3);
      if (k === 0) {
        const label = q.prompt.match(/<b>([^<]+)<\/b>/)[1];
        assert.equal(+a.split(' ')[0], heights[labels.indexOf(label)] / Math.max(...heights) * 40);
      } else assert.equal(a, labels[heights.indexOf(Math.max(...heights))]);
    }
  }
  assert.ok(q.explain.length > 15);
}

for (const [world, count] of Object.entries(MATH)) {
  test(`EV-3.3 ${world}: all ${count} generator families, distinct examples and correct worked answers (seed 3303)`, () => {
    const S = appSandbox({ seed: 3303 });
    for (let family = 0; family < count; family++) for (let i = 0; i < 24; i++) {
      const q = S.holen(world + 'BaseQ')(family), before = JSON.stringify(q), id = S.holen('qId')(q);
      const ex = S.holen('exampleFor')(q);
      if (isException(q)) {
        assert.equal(ex, null, 'explicit fixed 1 m exception');
        assert.equal(JSON.stringify(q), before);
        assert.equal(S.holen('qId')(q), id);
        continue;
      }
      assert.ok(ex, `${world}/${family}/${i}: example exists`);
      assert.deepEqual([ex.world, ex.foundationFamily, ex.level], [world, family, 1]);
      if (q.foundationVariant) assert.deepEqual(ex.foundationVariant, q.foundationVariant, 'same minute, jump, place-value change or length relation');
      assert.notEqual(ex.prompt + (ex.visual || ''), q.prompt + (q.visual || ''));
      if (/^\d+(?: cm)?$/.test(answer(q))) assert.notEqual(answer(ex), answer(q));
      checkMath(ex);
      assert.equal(JSON.stringify(q), before, 'question untouched');
      const copy = { ...q }; delete copy.foundationFamily;
      assert.equal(S.holen('qId')(copy), id, 'metadata does not alter question IDs');
    }
  });
}

test('EV-3.3 all 40 text families: 34 worked examples and six explicit exceptions; original question untouched', () => {
  assert.deepEqual(Object.keys(GRUNDLAGE_BEISPIELE), Object.keys(GRUNDLAGE));
  const S = appSandbox({ seed: 3340 });
  for (const [world, bank] of Object.entries(GRUNDLAGE)) {
    assert.equal(GRUNDLAGE_BEISPIELE[world].length, bank.length);
    const seen = new Set();
    for (let i = 0; i < 200 && seen.size < bank.length; i++) {
      const q = S.holen('baseQ')(world, { world }), family = q.foundationFamily;
      seen.add(family);
      const before = JSON.stringify(q), ex = S.holen('exampleFor')(q);
      assert.equal(q.prompt, bank[family][0], 'actual generator family matches bank');
      assert.equal(answer(q), bank[family][1]);
      if (isException(q)) {
        assert.equal(ex, null, `${world}/${family}: fixed-answer exception`);
        assert.equal(GRUNDLAGE_BEISPIELE[world][family], null, 'exception recorded explicitly');
        assert.equal(JSON.stringify(q), before);
        continue;
      }
      assert.ok(ex, `${world}/${family}: all other families require an example`);
      assert.equal(ex.level, 1); assert.equal(ex.foundationFamily, family);
      assert.notEqual(text(ex.prompt), text(q.prompt));
      assert.notEqual(answer(ex), answer(q), 'provided text examples must not supply the original answer');
      assert.ok(ex.explain.length > 40 && ex.explain !== answer(ex), 'worked reasoning, not just an answer');
      assert.ok(!ex.explain.includes(q.prompt), 'no original question in worked case');
      assert.equal(JSON.stringify(q), before);
    }
    assert.equal(seen.size, 8, world + ': all eight original families reached');
  }
  // Grammar and facts in specific cases, independently checked against the lesson.
  const words = GRUNDLAGE_BEISPIELE.words;
  assert.equal('un' + words[0][1], 'unkind'); assert.equal(words[1][1] + 'ful', 'playful');
  assert.equal(words[2][1] + 'like', 'dislike'); assert.equal('care' + words[3][1], 'careless');
  assert.equal(words[4][1], 'dog' + 's'); assert.equal(words[5][1], 'un' + 'tie');
  assert.equal(words[6][1], 're' + 'read'); assert.equal(words[7][1], 'un' + 'fair');
  const sentences = GRUNDLAGE_BEISPIELE.sentences;
  assert.equal(sentences[2], null); assert.equal(sentences[3], null);
  assert.equal(sentences[0][1][0], 'A'); assert.ok(sentences[4][1].endsWith('.'));
  assert.match(sentences[5][1], /Monday/); assert.match(sentences[7][1], /and I read/);
  assert.equal(GRUNDLAGE_BEISPIELE.anleitung[6][1], 'die Haustür');
  assert.equal(GRUNDLAGE_BEISPIELE.library[6][1], 'Between 120 and 140');
});

test('EV-3.3 repeated and boundary random values: examples within 24 cases, only fixed 1 m explicitly excluded', () => {
  for (const value of [0, 1 - Number.EPSILON]) {
    const S = appSandbox({ seed: 3399 });
    S.holen('Math').random = () => value;
    for (const [world, count] of Object.entries(MATH)) for (let family = 0; family < count; family++) {
      let variants = [{}];
      if (world === 'numbers' && family === 1) variants = [{ minute: 0 }, { minute: 30 }];
      if (world === 'numbers' && family === 2) variants = [{ jump: 10 }, { jump: 5 }, { jump: -10 }];
      if (world === 'numbers' && family === 3) variants = [{ step: 10, more: true }, { step: 10, more: false }, { step: 100, more: true }, { step: 100, more: false }];
      if (world === 'units' && family === 3) variants = [{ short: true }, { short: false }];
      for (const variant of variants) {
        const build = S.holen(world + 'BaseQ');
        // The child's stimulus is deliberately identical to the first enumerated candidate.
        const q = S.lauf(() => build(family, { draw: foundationDraw(0), variant }), 1000);
        let calls = 0;
        const ex = S.lauf(() => foundationExample(q, (...args) => { calls++; return build(...args); }), 1000);
        if (isException(q)) { assert.equal(ex, null); assert.equal(calls, 0); continue; }
        assert.ok(ex, `${world}/${family}/${JSON.stringify(variant)}/random=${value}`);
        assert.ok(calls >= 2 && calls <= 24, 'first identical candidate skipped, finite selection');
        assert.notEqual(ex.prompt + (ex.visual || ''), q.prompt + (q.visual || ''));
        if (q.foundationVariant) assert.deepEqual(ex.foundationVariant, q.foundationVariant);
        checkMath(ex);
      }
    }
  }
});

test('EV-3.3 selection rejects identical stimuli, numeric solutions and mismatched families; old support tasks unchanged', () => {
  const q = { kind: 'type', level: 1, world: 'combos', foundationFamily: 1, prompt: '200 + ? = 500', answer: '300', visual: 'bar', explain: '200 + 300 = 500.' };
  for (const build of [() => q, () => ({ ...q, prompt: '100 + ? = 400' }), () => ({ ...q, answer: '200', foundationFamily: 2 })]) assert.equal(foundationExample(q, build), null);
  assert.equal(foundationExample({ ...q, foundationFamily: undefined }, () => q), null);
  assert.equal(foundationExample({ ...q, level: 2 }, () => q), null);
  const S = appSandbox({ seed: 3303 });
  const old = { kind: 'type', world: 'round', level: 1, prompt: 'Round 470 to the nearest hundred.', answer: '500', coach: { family: 'round', n: 470, step: 100 } };
  assert.equal(S.holen('exampleFor')(old), null, 'unrelated foundation path preserved');
  const easier = S.holen('exampleFor')({ ...old, level: 2 });
  assert.ok(easier && easier.level === 1, 'existing coach example retained');
});

test('EV-3.3 place-value examples at the hundred boundary: 190 + 10 = 200 and 200 − 10 = 190', () => {
  const S = appSandbox({ seed: 3310 }), build = S.holen('numbersBaseQ');
  for (const [n, more, result] of [[190, true, 200], [200, false, 190]]) {
    const variant = { step: 10, more };
    const q = build(3, { draw: () => 0, variant }); // different own problem (110 ± 10)
    const ex = foundationExample(q, (family, options) => build(family, { ...options, draw: range => range === 780 ? n - 110 : options.draw(range) }));
    assert.ok(ex);
    assert.equal(answer(ex), String(result));
    assert.match(ex.explain, new RegExp(`${n} ${more ? '\\+' : '−'} 10 = ${result}`));
    assert.ok(!/only|other digits stay/i.test(ex.explain + ex.tip));
    assert.match(ex.tip, /place value table/);
    checkMath(ex);
  }
});

test('EV-3.3 completing 100: one ten at 90, two tens at 80', () => {
  const S = appSandbox({ seed: 3310 }), build = S.holen('combosBaseQ');
  for (const [draw, amount, phrase] of [[8, '10', '1 ten'], [7, '20', '2 tens']]) {
    const q = build(3, { draw: () => draw });
    assert.equal(answer(q), amount);
    assert.ok(q.explain.includes(`That is ${phrase}, or ${amount}.`), q.explain);
    assert.doesNotMatch(q.explain, /\b1 tens\b/);
    checkMath(q);
  }
});

for (const [family, base, exampleWord] of [[2, 'like', 'dislike'], [3, 'care', 'careless']]) {
  test(`EV33-CC-M1 words/${family}: another correct affix without replay overlap`, () => {
    const S = appSandbox({ seed: 3331 }), q = textFamily(S, 'words', family);
    const before = JSON.stringify(q), id = S.holen('qId')(q), ex = S.holen('exampleFor')(q);
    assert.ok(ex); assert.equal(ex.level, 1); assert.equal(ex.foundationFamily, family);
    assert.notEqual(answer(ex), answer(q), 'example does not supply the child’s affix answer');
    assert.equal(family === 2 ? answer(ex) + base : base + answer(ex), exampleWord);
    assert.ok(ex.prompt.includes(exampleWord));
    assert.ok(ex.explain.includes(family === 2 ? 'dis + like' : 'care + less'));
    assert.doesNotMatch(ex.prompt + ex.explain, /\breplay\b/i);
    assert.equal(JSON.stringify(q), before); assert.equal(S.holen('qId')(q), id);
  });
}

for (const [world, families] of Object.entries(FIXED_ANSWER_EXCEPTIONS)) for (const family of families) {
  test(`EV33-CC-M1 ${world}/${family}: explicit fixed-answer exception retains own tip and question`, () => {
    const S = appSandbox({ seed: 3331 }), q = textFamily(S, world, family), before = JSON.stringify(q), id = S.holen('qId')(q);
    assert.equal(S.holen('guidance')(q, null, false).text, q.tip);
    assert.equal(S.holen('exampleFor')(q), null, 'no example that directly supplies the fixed answer');
    assert.equal(JSON.stringify(q), before); assert.equal(S.holen('qId')(q), id);
  });
}

test('EV33-CC-M1 units/3: retain other centimetre answers, omit the fixed longer answer 1 m', () => {
  const S = appSandbox({ seed: 3331 }), build = S.holen('unitsBaseQ');
  for (const short of [true, false]) {
    const q = build(3, { draw: () => 2, variant: { short } }), before = JSON.stringify(q), id = S.holen('qId')(q);
    const ex = S.holen('exampleFor')(q);
    if (short) {
      assert.ok(ex); assert.match(answer(ex), / cm$/); assert.notEqual(answer(ex), answer(q));
      assert.deepEqual(ex.foundationVariant, q.foundationVariant); checkMath(ex);
    } else {
      assert.equal(answer(q), '1 m');
      assert.equal(ex, null, 'longer comparison must not reveal the fixed answer');
    }
    assert.equal(JSON.stringify(q), before); assert.equal(S.holen('qId')(q), id);
    assert.equal(S.holen('guidance')(q, null, false).text, q.tip);
  }
});
