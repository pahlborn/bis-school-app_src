// Both learning targets, correction and withdrawal through the normal parent and child views.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, elternSeite } from './app-hilfen.mjs';
import { githubNachbau } from './module/github-nachbau.mjs';
import { githubSpeicher } from '../src/module/github.mjs';
import { startcodeAusstellen, ersteAnmeldung } from '../src/module/konto.mjs';
import { anmEinladungslink } from '../src/module/anmeldung.mjs';
import { keyFingerprint } from '../src/module/krypto.mjs';

const REPO = 'pahlborn/bis-school-app-testdaten';
const TOKEN = 'github_pat_TESTTOKEN_' + 'E5mn'.repeat(10);
const TITLE = 'Zweischrittige Stickeraufgabe';
const CHILD = 'Tessa Sonnenweg';
const LOGIN = 'tessa.sonnenweg';

async function register(page) {
  await page.locator('#kontoNeuUse').click();
  await page.locator('#kontoNeuGo').click();
}

async function device(browser, allowed) {
  const context = await browser.newContext({ timezoneId: 'UTC' });
  await context.route('**/*', (route) => allowed.some((url) => route.request().url().startsWith(url)) ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return { page, errors };
}

const evaluationEvents = (page) => page.evaluate(() => Object.keys(localStorage).filter((key) => /^bq2_p_[A-Za-z0-9]+__events$/.test(key))
  .flatMap((key) => JSON.parse(localStorage.getItem(key))).filter((event) => event.type === 'school_evaluation'));

async function startToday(page) {
  if (await page.locator('#greetSkip').isVisible()) await page.locator('#greetSkip').click();
  await page.locator('#todayBtn').click();
  await page.waitForSelector('#play:not([hidden])');
}

async function leaveRound(page) {
  await page.locator('#quitBtn').click();
  await page.waitForSelector('#home:not([hidden])');
}

async function skipQuestion(page) {
  await page.locator('#helpBtn').click();
  await page.locator('#answerBtn').click();
  await page.locator('#nextBtn').click();
}

async function solveSubtraction(page) {
  const story = await page.locator('#qVisual').innerText();
  const parts = story.match(/\d+/g)?.map(Number);
  assert.equal(parts?.length, 3, 'total and two subtrahends visible in the story');
  const [total, first, second] = parts;
  const answer = String(total - first - second);
  for (const digit of answer) await page.locator('#qAnswers').getByRole('button', { name: digit, exact: true }).click();
  await page.locator('#qAnswers').getByRole('button', { name: 'Check', exact: true }).click();
  assert.ok((await page.locator('#feedback.good').innerText()).includes(`${total} − ${first} − ${second} = ${answer}`));
  return parts.join('/');
}

async function solveRounding(page) {
  const prompt = await page.locator('#qPrompt').innerText();
  const match = /which hundred is closest to (\d+)\?$/i.exec(prompt);
  assert.ok(match, `nearest-hundred explanation prompt: ${prompt}`);
  const number = Number(match[1]);
  const lowerDistance = number % 100;
  const upperDistance = 100 - lowerDistance;
  assert.ok(lowerDistance > 0 && lowerDistance !== 50, 'the two distances are positive and distinct');
  const lower = number - lowerDistance;
  const upper = number + upperDistance;
  const nearest = lowerDistance < upperDistance ? lower : upper;
  const answer = `${number} is ${lowerDistance} away from ${lower} and ${upperDistance} away from ${upper}. ${Math.min(lowerDistance, upperDistance)} is smaller, so ${nearest} is closer.`;
  await page.locator('#qAnswers').getByRole('button', { name: answer, exact: true }).click();
  await page.locator('#feedback.good').waitFor();
  assert.match(await page.locator('#feedback').innerText(), /Explain with distances/);
  return `${number}: ${lowerDistance}/${upperDistance} → ${nearest}`;
}

async function solveTargets(page, targets) {
  await startToday(page);
  const solved = new Map();
  for (let step = 0; step < 8; step++) {
    const label = page.locator('#qLabel');
    const revision = await label.getAttribute('data-school-revision');
    const target = targets.get(revision);
    if (target) {
      assert.match(await label.innerText(), target.label);
      assert.ok(!solved.has(revision), 'a C assessment contributes one attributed question');
      solved.set(revision, await target.solve(page));
      if (solved.size === targets.size) {
        assert.equal(await page.locator('#roundStars').innerText(), String(solved.size));
        await leaveRound(page);
        return solved;
      }
      await page.locator('#nextBtn').click();
    } else {
      await skipQuestion(page);
    }
  }
  assert.fail('the round is missing one or more questions attributed to the synced revisions');
}

async function showDetails(page, title) {
  const rows = page.locator('.psrow').filter({ has: page.getByText(title, { exact: true }) });
  const row = await rows.count() ? rows : page.locator('.psrow').filter({ hasText: title });
  await row.waitFor();
  const details = row.locator('[data-psdet]');
  const index = await details.getAttribute('data-psdet');
  if (await details.getAttribute('aria-expanded') === 'false') await details.click();
  return page.locator(`[data-psdetrow="${index}"]`);
}

async function waitForRevision(page, revision) {
  await page.waitForFunction((rev) => Object.keys(localStorage).some((key) => /^bq2_p_[A-Za-z0-9]+__events$/.test(key)
    && JSON.parse(localStorage.getItem(key)).some((e) => e.type === 'school_evaluation' && e.payload.revision === rev)),
  revision, { timeout: 70000 });
}

async function checkRoundRevisions(page, expected, solve = new Map()) {
  await startToday(page);
  const observed = [];
  for (let i = 0; i < 8; i++) {
    const label = page.locator('#qLabel');
    const revision = await label.getAttribute('data-school-revision');
    if (revision) observed.push(revision);
    const solver = solve.get(revision);
    if (solver) await solver(page);
    if (i === 7) break;
    if (solver) await page.locator('#nextBtn').click();
    else await skipQuestion(page);
  }
  assert.deepEqual(observed.sort(), [...expected].sort(), 'the full round has exactly the expected assessment revisions');
  await leaveRound(page);
}

test('correction drafts preserve the current focus, a synced confirmation replaces it, and withdrawal stops future cards', { timeout: 300000 }, async (t) => {
  const storage = await githubNachbau({ token: TOKEN, repos: [REPO] });
  t.after(() => storage.schliessen());
  const access = githubSpeicher({ repo: REPO, token: TOKEN, basis: storage.basis }).geraet('d_Werkzeug1');
  const adminCode = await startcodeAusstellen({ zugang: access, aussteller: null, anmeldename: 'admin', art: 'admin', now: Date.now() });
  const admin = await ersteAnmeldung({ zugang: access, code: adminCode.code, passwort: 'Werkzeug-Admin-Passwort-1', now: Date.now() });
  const parentCode = await startcodeAusstellen({ zugang: access, aussteller: admin, anmeldename: 'mira.sonnenweg', art: 'parent', now: Date.now() });
  const config = JSON.stringify({ art: 'github', repo: REPO, wurzel: '', basis: storage.basis });
  const server = await appServer({ bauart: 'test', anpassen: (h) => h.replace('/*BQ_SPEICHER*/null', () => config) });
  t.after(() => server.close());
  const browser = await browserStarten();
  t.after(() => browser.close());
  const allowed = [server.url, storage.basis];
  const P = await device(browser, allowed);
  const K = await device(browser, allowed);

  await P.page.goto(anmEinladungslink(server.url, { zugang: TOKEN, anmeldename: 'mira.sonnenweg', code: parentCode.code, fingerabdruck: parentCode.fingerabdruck }));
  await register(P.page);
  await P.page.locator('#recGo').click();
  await P.page.locator('#welcomeGo').click();
  await P.page.locator('#parentClose').waitFor();
  await P.page.locator('#pSettings').click();
  await P.page.locator('details.psec[data-psec="family"] > summary').click();
  await P.page.locator('#kKindAnlegen').click();
  await P.page.locator('#kKindName').fill(CHILD);
  await P.page.locator('#kKindWeiter').click();
  await P.page.locator('#kKindLogin').fill(LOGIN);
  await P.page.locator('#kKindGo').click();
  await P.page.locator('#kQr svg').waitFor();
  const code = (await P.page.locator('#kCode').textContent()).trim();
  const pub = await P.page.evaluate(async () => {
    const entries = await new Promise((resolve, reject) => {
      const db = indexedDB.open('bq2_konto', 1);
      db.onerror = () => reject(db.error);
      db.onsuccess = () => {
        const request = db.result.transaction('schluessel').objectStore('schluessel').getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => { db.result.close(); resolve(request.result); };
      };
    });
    assertSingleKey(entries);
    return entries[0].pub;
    function assertSingleKey(keys) {
      if (keys.length !== 1) throw new Error('Expected one key on the parent-only device');
    }
  });
  await K.page.goto(anmEinladungslink(server.url, { zugang: TOKEN, anmeldename: LOGIN, code, fingerabdruck: await keyFingerprint(pub) }));
  await register(K.page);
  await K.page.locator('#welcomeGo').click({ timeout: 60000 });
  await K.page.waitForSelector('#home:not([hidden])');
  await P.page.waitForFunction(() => /ist angemeldet/.test(document.querySelector('#kQrStatus')?.textContent || ''), null, { timeout: 30000 });
  await P.page.locator('#kQrFertig').click();

  await elternSeite(P.page, 'school');
  const form = P.page.locator('#pSchoolEvaluation');
  const handoff = () => P.page.evaluate(() => {
    const context = window.bigQuestSchoolRow.context();
    const transfer = '00000000-0000-4000-8000-000000000186';
    return [
      window.bigQuestSchoolRow.open('other-child', transfer, 'M-N5', 'C'),
      window.bigQuestSchoolRow.open(context, transfer, 'M-N5', 'C'),
      window.bigQuestSchoolRow.open(context, transfer, 'M-N5', 'C'),
    ];
  });
  assert.deepEqual(await handoff(), ['context', 'opened', 'opened']);
  assert.deepEqual(await evaluationEvents(P.page), [], 'native handoff never saves the draft');
  assert.match(await form.innerText(), new RegExp(CHILD));
  await form.getByLabel('Titel').fill(TITLE);
  const today = await P.page.evaluate(() => new Date().toISOString().slice(0, 10));
  await form.getByLabel('Bewertungsdatum').fill(today);
  assert.equal(await form.getByLabel('Kriterium').inputValue(), 'M-N5');
  assert.equal(await form.getByLabel('Einstufung').inputValue(), 'C');
  await form.getByRole('button', { name: 'Vorschau anzeigen' }).click();
  assert.match(await form.innerText(), /Vorschau[\s\S]*Tessa Sonnenweg[\s\S]*Zweischrittige Stickeraufgabe[\s\S]*Wird sicherer/);
  assert.equal(await form.getByRole('checkbox').isChecked(), true);
  assert.deepEqual(await evaluationEvents(P.page), []);
  assert.deepEqual(await evaluationEvents(K.page), []);
  await startToday(K.page);
  assert.equal(await K.page.locator('#qLabel').getAttribute('data-school-revision'), null);
  await leaveRound(K.page);

  await form.getByRole('button', { name: 'Evaluation bestätigen' }).click();
  await P.page.getByRole('row').filter({ hasText: TITLE }).waitFor();
  const written = await evaluationEvents(P.page);
  assert.equal(written.length, 1);
  assert.deepEqual(await handoff(), ['context', 'saved', 'saved'], 'replaying a confirmed transfer opens no duplicate');
  const { revision } = written[0].payload;
  assert.equal(written[0].payload.focus, 'two-step');
  assert.equal(written[0].payload.rating, 'C');
  await K.page.waitForFunction((rev) => Object.keys(localStorage).some((key) => /^bq2_p_[A-Za-z0-9]+__events$/.test(key)
    && JSON.parse(localStorage.getItem(key)).some((e) => e.type === 'school_evaluation' && e.payload.revision === rev)), revision, { timeout: 65000 });
  assert.equal((await evaluationEvents(K.page)).length, 1);
  assert.equal(await K.page.locator('#pSchoolEvaluation').count(), 0);
  const subtractionTarget = { label: /Word Problems/i, solve: solveSubtraction };
  const first = (await solveTargets(K.page, new Map([[revision, subtractionTarget]]))).get(revision);

  const roundingTitle = 'Runden mit Abstandsbegründung';
  await form.getByRole('button', { name: 'Evaluation hinzufügen' }).click();
  await form.getByLabel('Titel').fill(roundingTitle);
  await form.getByLabel('Bewertungsdatum').fill(today);
  await form.getByLabel('Fach', { exact: true }).fill('math');
  await form.getByLabel('Kriterium 1', { exact: true }).fill('Runden mit Abstandsbegründung');
  await form.locator('[data-doc-rating="0"]').selectOption('C');
  await form.getByText('Passende Übungen (optional)', { exact: true }).click();
  await form.getByLabel('Übungsmuster', { exact: true }).selectOption('M-N3');
  await form.getByLabel('Einstufung für dieses Übungsmuster').selectOption('C');
  await form.getByRole('button', { name: 'Vorschau anzeigen' }).click();
  assert.match(await form.innerText(), /Vorschau[\s\S]*Runden mit Abstandsbegründung[\s\S]*Wird sicherer/);
  assert.equal(await form.getByRole('checkbox', { name: 'Runden mit Abstandsbegründung in Practise Today üben' }).isChecked(), true);
  assert.equal((await evaluationEvents(P.page)).length, 1);
  assert.equal((await evaluationEvents(K.page)).length, 1);
  await form.getByRole('button', { name: 'Evaluation bestätigen' }).click();
  await P.page.getByRole('row').filter({ hasText: roundingTitle }).waitFor();
  await P.page.getByRole('row').filter({ hasText: TITLE }).waitFor();
  const writtenBoth = await evaluationEvents(P.page);
  assert.equal(writtenBoth.length, 2);
  const rounding = writtenBoth.find(({ payload }) => payload.standard === 'M-N3')?.payload;
  assert.equal(rounding?.focus, 'round-distance');
  assert.equal(rounding?.rating, 'C');
  await K.page.waitForFunction((rev) => Object.keys(localStorage).some((key) => /^bq2_p_[A-Za-z0-9]+__events$/.test(key)
    && JSON.parse(localStorage.getItem(key)).some((e) => e.type === 'school_evaluation' && e.payload.revision === rev)), rounding.revision, { timeout: 65000 });
  assert.deepEqual((await evaluationEvents(K.page)).map(({ payload }) => payload.revision).sort(), [revision, rounding.revision].sort());

  const targets = new Map([
    [revision, subtractionTarget],
    [rounding.revision, { label: /Rounding Road/i, solve: solveRounding }],
  ]);
  const bothFirst = await solveTargets(K.page, targets);
  const subtractionVariants = new Set([first, bothFirst.get(revision)]);
  const roundingVariants = new Set([bothFirst.get(rounding.revision)]);
  for (let i = 0; i < 3 && (subtractionVariants.size < 2 || roundingVariants.size < 2); i++) {
    const both = await solveTargets(K.page, targets);
    subtractionVariants.add(both.get(revision));
    roundingVariants.add(both.get(rounding.revision));
  }
  assert.ok(subtractionVariants.size >= 2, 'two different subtraction variants solved');
  assert.ok(roundingVariants.size >= 2, 'two different rounding variants solved');
  t.diagnostic(`Independently solved total/part/part: ${[...subtractionVariants].join(', ')}.`);
  t.diagnostic(`Independently solved number: lower distance/upper distance → nearest: ${[...roundingVariants].join(', ')}.`);

  const correctedTitle = 'Runden mit Abstandsbegründung – korrigiert';
  let detail = await showDetails(P.page, roundingTitle);
  await detail.getByRole('button', { name: 'Bewertung korrigieren', exact: true }).click();
  assert.equal(await form.getByLabel('Titel').inputValue(), roundingTitle);
  assert.equal(await form.getByLabel('Übungsmuster', { exact: true }).inputValue(), 'M-N3');
  await form.getByLabel('Titel').fill(correctedTitle);
  await form.getByRole('button', { name: 'Vorschau anzeigen' }).click();
  await form.getByRole('button', { name: 'Korrektur bestätigen', exact: true }).waitFor();
  assert.equal((await evaluationEvents(P.page)).length, 2);
  assert.equal((await evaluationEvents(K.page)).length, 2);
  await checkRoundRevisions(K.page, [revision, rounding.revision]);

  // Keep a running round open while the parent confirms. Its current card is stable.
  await startToday(K.page);
  const label = K.page.locator('#qLabel');
  const runningLabel = await label.innerText();
  const runningRevision = await label.getAttribute('data-school-revision');
  await form.getByRole('button', { name: 'Korrektur bestätigen', exact: true }).click();
  await P.page.getByRole('cell', { name: correctedTitle, exact: true }).waitFor();
  assert.equal(await label.innerText(), runningLabel);
  assert.equal(await label.getAttribute('data-school-revision'), runningRevision);
  await leaveRound(K.page);
  const corrected = (await evaluationEvents(P.page)).find(({ payload }) => payload.title === correctedTitle)?.payload;
  assert.ok(corrected);
  assert.equal(corrected.evaluation, rounding.evaluation);
  assert.equal(corrected.base, rounding.revision);
  assert.notEqual(corrected.revision, rounding.revision);
  assert.equal(corrected.focus, 'round-distance');
  await waitForRevision(K.page, corrected.revision);
  await checkRoundRevisions(K.page, [revision, corrected.revision], new Map([[corrected.revision, solveRounding]]));

  detail = await showDetails(P.page, correctedTitle);
  assert.ok((await detail.innerText()).includes(roundingTitle), 'previous title is visible in the parent history');
  await detail.getByRole('button', { name: 'Bewertung zurücknehmen', exact: true }).click();
  await form.getByRole('button', { name: 'Rücknahme bestätigen', exact: true }).waitFor();
  assert.equal((await evaluationEvents(P.page)).length, 3);
  assert.equal((await evaluationEvents(K.page)).length, 3);
  await form.getByRole('button', { name: 'Rücknahme bestätigen', exact: true }).click();
  const withdrawal = (await evaluationEvents(P.page)).find(({ payload }) => payload.withdrawn)?.payload;
  assert.ok(withdrawal);
  assert.equal(withdrawal.evaluation, rounding.evaluation);
  assert.equal(withdrawal.base, corrected.revision);
  assert.notEqual(withdrawal.revision, corrected.revision);
  await waitForRevision(K.page, withdrawal.revision);
  assert.equal((await evaluationEvents(K.page)).length, 4);
  await checkRoundRevisions(K.page, [revision], new Map([[revision, solveSubtraction]]));
  detail = await showDetails(P.page, correctedTitle);
  assert.match(await detail.innerText(), /zurückgenommen/i);
  assert.ok((await detail.innerText()).includes(roundingTitle), 'withdrawal retains the previous history');
  t.diagnostic('Observed exact sets of school-revision cards before confirmation, after correction sync, and after withdrawal sync.');
  const english = 'Fiktive Sprachbewertung';
  const transfer = '00000000-0000-4000-8000-000000000190';
  const openSource = () => P.page.evaluate((id) => {
    const bridge = window.bigQuestEvaluationForm;
    return [bridge.source('wrong-child', id, 'Evaluation'), bridge.source(bridge.context(), id, 'Evaluation')];
  }, transfer);
  assert.deepEqual(await openSource(), ['context', 'opened']);
  assert.equal(await form.getByLabel('Titel').inputValue(), '');
  assert.match(await form.innerText(), new RegExp(CHILD));
  await P.page.evaluate(({ title, date }) => {
    // Synthetic reply at the iPad bridge boundary. Real Claude is tested on device.
    window.webkit = { messageHandlers: { bigQuestEvaluation: { postMessage: async ({ source }) => {
      if (source !== 'Evaluation') throw new Error('Unexpected source');
      return {title,date,goal:'Explain an opinion',instructions:'Write a letter',feedback:'Add reasons',
        criteria:[{criterion:'Explain a viewpoint',rating:'M',evidence:'Explain a viewpoint M'}]};
    } } } };
  }, { title: english, date: today });
  await form.getByRole('button', { name: 'Mit Claude ins Formular übertragen' }).click();
  await P.page.waitForFunction(title => document.querySelector('#pSchoolEvaluation input[name=title]')?.value === title, english);
  await form.getByLabel('Fach', { exact: true }).fill('english');
  await form.getByRole('button', { name: 'Vorschau anzeigen' }).click();
  assert.equal((await evaluationEvents(P.page)).length, 4);
  await form.getByRole('button', { name: 'Evaluation bestätigen', exact: true }).click();
  assert.deepEqual(await openSource(), ['context', 'saved']);
  const saved = (await evaluationEvents(P.page)).find(({ payload }) => payload.title === english).payload;
  assert.equal(saved.child, rounding.child);
  assert.equal(saved.focus, 'none');
  assert.equal(saved.assessment.criteria[0].criterion, 'Explain a viewpoint');
  await waitForRevision(K.page, saved.revision);
  await checkRoundRevisions(K.page, [revision]);
  const englishDetail = await showDetails(P.page, english);
  assert.match(await englishDetail.innerText(), /Explain a viewpoint/);
  assert.match(await englishDetail.innerText(), /Add reasons/);
  assert.deepEqual(P.errors, []);
  assert.deepEqual(K.errors, []);
});
