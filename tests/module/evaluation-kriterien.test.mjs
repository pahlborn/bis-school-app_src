// EV-2: one revision contains the original criteria and their confirmed mappings.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkEvent, mergeLog, newEvent } from '../../src/module/ereignisse.mjs';
import * as schoolDerivation from '../../src/module/ableitung.mjs';
import { acceptEvent, canonicalBytes, signEvent } from '../../src/module/annahme.mjs';
import { newPersonKeys, publicKeysOf } from '../../src/module/krypto.mjs';

const now = Date.parse('2026-11-17T12:00:00Z');
const id = n => `7d97af5e-6e19-46b8-85c6-${String(n).padStart(12, '0')}`;
const criterion = (standard, rating = 'C', text = 'Synthetic criterion') => ({ criterion: text, rating, standard, evidence: '' });
const assessment = criteria => ({ area: 'math', goal: 'Original learning goal', instructions: '', feedback: 'Original feedback', criteria });
const payload = (criteria, fields = {}) => ({
  child: 'p_k1', evaluation: id(1), revision: id(2), title: 'Synthetic evaluation', day: '2026-11-15',
  assessment: assessment(criteria), ...fields,
});
const event = (p, n = 1, device = 'd_e1', author = 'p_e1') => newEvent({
  type: 'school_evaluation', payload: p, at: '2026-11-17T11:00:00Z', author, device,
}, { rand: () => new Uint8Array(12).fill(n) });
const school = events => schoolDerivation.deriveSchool(events, { now });
const read = events => school(events)?.tasks[0];
const legacy = { child: 'p_k1', evaluation: id(10), revision: id(11), title: 'Legacy evaluation', day: '2026-11-14', standard: 'M-N5', rating: 'C', focus: 'two-step' };

test('EV-2.1: criteria accept all catalog codes, none and each source rating including empty', () => {
  const p = payload([
    criterion('M-N1', 'C'), criterion('M-N3', 'M'), criterion('E-W1', 'RS'),
    criterion('E-S1', 'E'), criterion('none', ''), criterion('M-N1', ''),
  ]);
  assert.deepEqual(checkEvent(event(p)), []);
  assert.deepEqual(checkEvent(event(payload(Array.from({ length: 50 }, () => criterion('none'))))), [], '50 criteria are valid');
  assert.deepEqual(checkEvent(event(payload([{ criterion: 'Three required fields', standard: 'M-N1', rating: '' }]))), [], 'evidence is optional for new criteria');
});

test('EV-2.1: invalid criteria are reported and excluded, never silently normalized', () => {
  const badCriteria = [
    [criterion('M-UNKNOWN'), 'unknown code'], [criterion('constructor'), 'inherited property'],
    [criterion('M-N1', 'N'), 'legacy N is not a criterion rating'], [criterion('M-N1', 'c'), 'case'],
    [criterion('M-N1', null), 'null rating'], [criterion('M-N1', 'C', ''), 'empty criterion'],
    [criterion('M-N1', 'C', ' \n '), 'whitespace criterion'], [criterion('none', 'C', ''), 'none still needs source text'],
    [criterion('M-N1', 'C', 'x'.repeat(2001)), 'criterion length'],
    [{ ...criterion('M-N1'), extra: true }, 'unknown criterion field'],
    [{ ...criterion('M-N1'), evidence: 'x'.repeat(4001) }, 'evidence length'],
  ];
  for (const [c, label] of badCriteria) {
    const e = event(payload([c]));
    assert.ok(checkEvent(e).includes('payload.assessment: invalid'), label);
    const merged = mergeLog([[e]], now);
    assert.equal(merged.events.length, 0, label);
    assert.equal(merged.invalid.length, 1, label);
  }
  for (const criteria of [[], Array.from({ length: 51 }, () => criterion('M-N1'))]) {
    assert.ok(checkEvent(event(payload(criteria))).includes('payload.assessment: invalid'));
  }
});

test('EV-2.1: partially mapped and ambiguous mixed legacy/new payloads are rejected', () => {
  const oldCriterion = { criterion: 'Old criterion', rating: 'C', evidence: '' };
  for (const p of [
    payload([oldCriterion, criterion('M-N1')]),
    payload([oldCriterion]), // the old document is meaningful only with its old top-level rating
    payload([criterion('M-N1')], { standard: 'M-N5', rating: 'C', focus: 'two-step' }),
    payload([criterion('M-N1')], { standard: 'unmapped', rating: 'N', focus: 'none' }),
  ]) assert.ok(checkEvent(event(p)).length > 0, JSON.stringify(p));
  for (const field of ['standard', 'rating', 'focus']) {
    const incomplete = { ...legacy };
    delete incomplete[field];
    assert.ok(checkEvent(event(incomplete)).includes(`payload.${field}: missing`), `legacy ${field} remains conditionally required`);
  }
});

test('EV-2.1: malformed assessment structures are rejected without a validation exception', () => {
  for (const broken of [null, [], {}, { ...assessment([]), criteria: 'not a list' },
    { ...assessment([null]) }, { ...assessment([criterion('M-N1')]), goal: 4 },
    { ...assessment([criterion('M-N1')]), unexpected: true },
  ]) {
    const e = event(payload([], { assessment: broken, standardOverrides: { 'M-N1': 'C' } }));
    assert.doesNotThrow(() => checkEvent(e));
    assert.ok(checkEvent(e).includes('payload.assessment: invalid'));
  }
});

test('EV-2.2: several standards share date and revision; none and empty ratings remain in original text', () => {
  const p = payload([
    criterion('M-N1', 'C', 'Place value'), criterion('M-N3', 'M', 'Rounding'),
    criterion('none', 'RS', 'An unmapped criterion'), criterion('M-N4', '', 'No teacher rating'),
  ]);
  const e = event(p), before = JSON.stringify(e);
  assert.deepEqual(checkEvent(e), []);
  const task = read([e]);
  assert.ok(task, 'a valid criterion evaluation produces one school task');
  assert.deepEqual(task.std, { 'M-N1': 'C', 'M-N3': 'M' });
  assert.equal(task.day, p.day);
  assert.equal(task.manual.revision, p.revision);
  assert.deepEqual(task.assessment, p.assessment);
  assert.deepEqual(task.rubric.map(c => [c.crit, c.teacher]), p.assessment.criteria.map(c => [c.criterion, c.rating]));
  assert.equal(JSON.stringify(e), before, 'derivation never rewrites the stored event');
  task.assessment.criteria[0].rating = 'E';
  assert.equal(e.payload.assessment.criteria[0].rating, 'C', 'derived text is detached from the log');
});

test('EV-2.3: the weaker rating wins within each evaluation and both original ratings survive', () => {
  const p = payload([criterion('E-W1', 'M', 'Write a sentence'), criterion('E-W1', 'C', 'Use punctuation')]);
  const task = read([event(p)]);
  assert.deepEqual(task?.std, { 'E-W1': 'C' });
  assert.deepEqual(task.assessment.criteria, p.assessment.criteria);
  for (const ratings of [['E', 'M', 'C', 'RS'], ['RS', 'C', 'M', 'E']]) {
    assert.deepEqual(read([event(payload(ratings.map(rating => criterion('E-W1', rating))))])?.std, { 'E-W1': 'RS' });
  }
});

test('EV-2.3: changing the aggregation rule recomputes the same original criteria without recapture', () => {
  assert.equal(typeof schoolDerivation.schoolEvaluationStandards, 'function', 'shared aggregation helper is available to the preview');
  const source = event(payload([criterion('E-W1', 'C'), criterion('E-W1', 'M'), criterion('none', 'RS'), criterion('M-N1', '')]));
  const criteria = source.payload.assessment.criteria;
  const before = JSON.stringify(source);
  assert.deepEqual(schoolDerivation.schoolEvaluationStandards(criteria), { 'E-W1': 'C' });
  assert.deepEqual(schoolDerivation.schoolEvaluationStandards(criteria, { ratingOrder: ['E', 'M', 'C', 'RS'] }), { 'E-W1': 'M' });
  assert.throws(() => schoolDerivation.schoolEvaluationStandards(criteria, { ratingOrder: ['C'] }), /invalid ratingOrder/);
  assert.throws(() => schoolDerivation.schoolEvaluationStandards(criteria, { standardOverrides: { 'M-N1': 'M' } }), /invalid standardOverrides/);
  assert.equal(JSON.stringify(source), before);
});

test('EV-2.2: only weak mapped ratings contribute catalog quests; a standard without a quest remains visible', () => {
  const task = read([event(payload([criterion('M-N1', 'C'), criterion('M-N3', 'M'), criterion('E-S1', 'RS')]))]);
  assert.deepEqual(task?.std, { 'M-N1': 'C', 'M-N3': 'M', 'E-S1': 'RS' });
  assert.deepEqual(task.focusNext, ['numbers']);
  assert.deepEqual(task.quests, ['numbers']);
  const withoutQuest = read([event(payload([criterion('E-S1', 'C')]))]);
  assert.deepEqual(withoutQuest?.std, { 'E-S1': 'C' });
  assert.deepEqual(withoutQuest.focusNext, []);
  const empty = read([event(payload([criterion('none', 'C'), criterion('M-N1', '')]))]);
  assert.deepEqual(empty?.std, {});
  assert.equal(empty.assessment.criteria.length, 2);
});

test('O3: an explicit parent override is part of the confirmed revision and retains original grades', () => {
  const criteria = [criterion('E-W1', 'C'), criterion('E-W1', 'M')];
  const first = event(payload(criteria));
  const corrected = event(payload(criteria, { revision: id(3), base: id(2), standardOverrides: { 'E-W1': 'M' } }), 2);
  assert.deepEqual(checkEvent(corrected), []);
  assert.deepEqual(read([first])?.std, { 'E-W1': 'C' }, 'a draft outside the event log has no effect');
  assert.deepEqual(read([corrected, first])?.std, { 'E-W1': 'M' });
  const task = read([corrected, first]);
  assert.deepEqual(task.assessment.criteria, criteria);
  assert.deepEqual(task.manual.standardOverrides, { 'E-W1': 'M' });
  assert.deepEqual(task.manual.history.map(p => p.revision), [id(2), id(3)]);
  assert.deepEqual(task.manual.history[0].assessment.criteria, task.manual.history[1].assessment.criteria);
});

test('O3: overrides cannot add a foreign standard or a rating absent from all source criteria', () => {
  const criteria = [criterion('E-W1', 'C'), criterion('M-N1', ''), criterion('none', 'C')];
  for (const standardOverrides of [
    { 'M-N3': 'M' }, { 'M-N1': 'C' }, { none: 'C' }, { 'M-UNKNOWN': 'C' },
    { constructor: 'C' }, { 'E-W1': 'N' }, { 'E-W1': '' }, { 'E-W1': null }, [], null,
  ]) {
    assert.ok(checkEvent(event(payload(criteria, { standardOverrides }))).includes('payload.standardOverrides: invalid'), JSON.stringify(standardOverrides));
  }
  assert.ok(checkEvent(event({ ...legacy, standardOverrides: { 'M-N5': 'M' } })).includes('payload.standardOverrides: requires criterion standards'));
});

test('EV-2.4: school_import and the single-standard format retain their exact old result', () => {
  const oldTask = { title: 'Old import', day: '2026-11-10', area: 'math', std: { 'M-N1': 'C' }, note: 'Original note' };
  const imported = newEvent({ type: 'school_import', payload: { asOf: '2026-11-10', data: { asOf: '2026-11-10', tasks: [oldTask] } }, author: 'p_e1', device: 'd_e1', at: '2026-11-10T12:00:00Z' }, { rand: () => new Uint8Array(12).fill(8) });
  const oldEvent = event(legacy, 9);
  const before = JSON.stringify([imported, oldEvent]);
  assert.deepEqual(school([imported]), { asOf: '2026-11-10', tasks: [oldTask] });
  assert.deepEqual(read([oldEvent]), {
    title: legacy.title, day: legacy.day, area: 'math', std: { 'M-N5': 'C' }, quests: ['wordprob'], focusNext: ['wordprob'],
    manual: { evaluation: legacy.evaluation, revision: legacy.revision, standard: 'M-N5', focus: 'two-step', withdrawn: false, history: [legacy], conflicts: [] },
  });
  const tasks = school([imported, oldEvent, event(payload([criterion('M-N3', 'M')]))]).tasks;
  assert.equal(tasks.length, 3, 'the import and both independent event formats remain present');
  assert.deepEqual(tasks[0], oldTask);
  assert.deepEqual(tasks[1], read([event(payload([criterion('M-N3', 'M')]))]));
  assert.deepEqual(tasks[2], read([oldEvent]));
  assert.equal(JSON.stringify([imported, oldEvent]), before);
});

test('EV-2.4: Test-11 unmapped assessments are readable without guessed mappings or source rewrites', () => {
  const oldAssessment = assessment([{ criterion: 'An old unmapped criterion', rating: 'C', evidence: 'Original evidence C' }]);
  oldAssessment.area = 'english';
  const p = { ...legacy, standard: 'unmapped', rating: 'N', focus: 'none', assessment: oldAssessment };
  const e = event(p), before = JSON.stringify(e);
  assert.deepEqual(checkEvent(e), []);
  const task = read([e]);
  assert.ok(task, 'an unmapped assessment remains readable');
  assert.deepEqual(task.std, {});
  assert.equal(task.area, 'english');
  assert.deepEqual(task.assessment, oldAssessment);
  assert.deepEqual(task.focusNext, []);
  assert.equal(JSON.stringify(e), before);
  const mapped = read([event({ ...legacy, assessment: oldAssessment })]);
  assert.deepEqual(mapped.std, { 'M-N5': 'C' }, 'old document grades do not replace the confirmed legacy top-level grade');
});

test('EV-2.5: two devices keep independent evaluations and duplicate confirmation counts once', () => {
  const first = event(payload([criterion('M-N1', 'C')]), 1, 'd_e1');
  const second = event(payload([criterion('M-N3', 'M')], { evaluation: id(4), revision: id(5) }), 2, 'd_e2');
  const retry = event(first.payload, 3, 'd_e1');
  assert.deepEqual(checkEvent(first), []);
  const left = mergeLog([[first, retry], [second]], now), right = mergeLog([[second], [retry, first]], now);
  assert.deepEqual(left, right);
  const derived = school(left.events);
  assert.equal(derived.tasks.length, 2);
  assert.deepEqual(derived.tasks.map(t => t.manual.evaluation), [id(1), id(4)]);
  assert.deepEqual(school(right.events), derived);
  assert.deepEqual(derived.tasks[0].manual.history.map(p => p.revision), [id(2)]);
});

test('EV-2.5: criterion revisions, withdrawal, parallel corrections and explicit resolution retain their history', () => {
  const criteria = [criterion('M-N1', 'C'), criterion('M-N3', 'M')];
  const first = event(payload(criteria));
  const a = event(payload(criteria, { base: id(2), revision: id(6), standardOverrides: { 'M-N1': 'M' } }), 2, 'd_e1');
  const b = event(payload(criteria, { base: id(2), revision: id(7), standardOverrides: { 'M-N1': 'E' } }), 3, 'd_e2');
  const resolved = event(payload(criteria, { base: id(2), revision: id(8), resolves: [id(6), id(7)], standardOverrides: { 'M-N1': 'M' } }), 4);
  const withdrawn = event(payload(criteria, { base: id(8), revision: id(9), withdrawn: true }), 5);
  assert.equal(school([a]), null, 'missing base is still not a new evaluation');
  assert.deepEqual(read([first, a, b])?.std, { 'M-N1': 'C', 'M-N3': 'M' });
  assert.deepEqual(read([first, a, b]).manual.conflicts, [id(6), id(7)]);
  const task = read([b, resolved, a, first]);
  assert.equal(task.manual.revision, id(8));
  assert.deepEqual(task.std, { 'M-N1': 'M', 'M-N3': 'M' });
  assert.deepEqual(task.manual.history.map(p => p.revision), [id(2), id(6), id(7), id(8)]);
  const removed = read([withdrawn, b, resolved, a, first]);
  assert.equal(removed.manual.withdrawn, true);
  assert.deepEqual(removed.focusNext, []);
  assert.deepEqual(removed.assessment.criteria, criteria);
  assert.deepEqual(read([first, a, b, resolved, withdrawn]), removed);
});

test('EV-2.5: the criterion payload is signed through the existing parent-only child-bound school path', async () => {
  const parentKeys = await newPersonKeys(), teacherKeys = await newPersonKeys();
  const admission = { area: 'schule:p_k1', members: {
    p_e1: { role: 'parent', pub: await publicKeysOf(parentKeys), devices: ['d_e1'] },
    p_l1: { role: 'teacher', pub: await publicKeysOf(teacherKeys), devices: ['d_l1'] },
  } };
  const e = event(payload([criterion('M-N1', 'C')]));
  assert.deepEqual(checkEvent(e), [], 'the source event must be valid before exercising the storage protections');
  const signed = await signEvent(e, admission.area, parentKeys);
  assert.deepEqual(await acceptEvent(signed, admission), { ok: true });
  assert.deepEqual(await acceptEvent(signed, { ...admission, area: 'schule:p_k2' }), { ok: false, grund: 'unterschrift' });
  const wrongChild = event({ ...e.payload, child: 'p_k2' }, 2);
  assert.equal((await acceptEvent(await signEvent(wrongChild, admission.area, parentKeys), admission)).grund, 'bereich-falsch');
  const teacher = event(e.payload, 3, 'd_l1', 'p_l1');
  assert.equal((await acceptEvent(await signEvent(teacher, admission.area, teacherKeys), admission)).grund, 'rolle-darf-nicht');
  assert.deepEqual(canonicalBytes(e, admission.area), canonicalBytes(signed.event, admission.area));
});
