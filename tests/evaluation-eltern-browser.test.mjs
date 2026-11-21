// Both learning targets, correction and withdrawal through the normal parent and child views.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appServer, browserStarten, elternSeite, elternAnsichtOeffnen } from './app-hilfen.mjs';
import { githubNachbau } from './module/github-nachbau.mjs';
import { githubSpeicher } from '../src/module/github.mjs';
import { startcodeAusstellen, ersteAnmeldung } from '../src/module/konto.mjs';
import { anmEinladungslink } from '../src/module/anmeldung.mjs';
import { keyFingerprint } from '../src/module/krypto.mjs';
import { derive } from '../src/module/ableitung.mjs';
import { makeSnapshot,stateFrom } from '../src/module/schnappschuss.mjs';

const REPO = 'pahlborn/bis-school-app-testdaten';
const TOKEN = 'github_pat_TESTTOKEN_' + 'E5mn'.repeat(10);
const TITLE = 'Zweischrittige Stickeraufgabe';
const CHILD = 'Tessa Sonnenweg';
const LOGIN = 'tessa.sonnenweg';

async function register(page) {
  await page.locator('#kontoNeuUse').click();
  const password = await page.locator('#kontoNeuPw').inputValue();
  await page.locator('#kontoNeuGo').click();
  return password;
}

async function device(browser, allowed, options = {}) {
  const context = await browser.newContext({ timezoneId: 'UTC', ...options });
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
  const answer = `${number} is ${lowerDistance} from ${lower} and ${upperDistance} from ${upper}, so ${nearest} is nearer.`;
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

async function evaluationFamily(t, options = {}) {
  const storage = await githubNachbau({ token: TOKEN, repos: [REPO] });
  t.after(() => storage.schliessen());
  const access = githubSpeicher({ repo: REPO, token: TOKEN, basis: storage.basis }).geraet('d_Werkzeug1');
  const adminCode = await startcodeAusstellen({ zugang: access, aussteller: null, anmeldename: 'admin', art: 'admin', now: Date.now() });
  const admin = await ersteAnmeldung({ zugang: access, code: adminCode.code, passwort: 'Werkzeug-Admin-Passwort-1', now: Date.now() });
  const parentCode = await startcodeAusstellen({ zugang: access, aussteller: admin, anmeldename: 'mira.sonnenweg', art: 'parent', now: Date.now() });
  const config = JSON.stringify({ art: 'github', repo: REPO, wurzel: '', basis: storage.basis });
  const server = await appServer({ bauart: 'test', anpassen: (h) => h.replace('/*BQ_SPEICHER*/null', () => config).replace(/\}\)\(\);\s*<\/script>/, 'window.__evaluationIntegration={eventHook,evVersion,schoolLogVersion,schoolEvaluationTarget,schoolFromAccount,renderSheets,openGaps,activeGap,focusTopics,classTopics,schoolStandFor,standOf,buildToday,gapData,kontoAbgleich,beginYearRound(){const questions=[];for(let i=0;i<8&&questions.length<8;i++)questions.push(...WORLDS.numbers.build().filter(q=>q.kind==="mc"&&levelOf(q)===2&&!q.assisted));if(questions.length<8)throw new Error("Missing real year-level questions");startRound("numbers");state.round=questions.slice(0,8);state.results=state.round.map(()=>null);renderQuestion();},currentAnswer:()=>state.round[state.idx].answer,schoolSectionOpen:()=>state.popen?.includes("school"),openLegacy(){const t=schoolEvaluationTarget();schoolEvaluationDraft={child:t.id,author:t.author,title:"",day:"",standard:"",rating:"",evaluation:crypto.randomUUID(),revision:crypto.randomUUID(),preview:false,focus:false};renderSheets();},draft:()=>schoolEvaluationDraft,adult:()=>adultUser&&{user:adultUser.user,role:adultUser.role},viewedKid,viewerGrant:()=>{const g=viewerGrant();return g&&{scope:[...g.scope]};},async loginAs(name,password){show("login");renderLogin("adult",{name});await kontoLoginAbsenden("adult",name,password);return adultUser&&adultUser.user;}};})();</script>') });
  t.after(() => server.close());
  const browser = await browserStarten();
  t.after(() => browser.close());
  const allowed = [server.url, storage.basis];
  const P = await device(browser, allowed, options);
  const K = await device(browser, allowed);

  await P.page.goto(anmEinladungslink(server.url, { zugang: TOKEN, anmeldename: 'mira.sonnenweg', code: parentCode.code, fingerabdruck: parentCode.fingerabdruck }));
  const parentPassword = await register(P.page);
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
  await K.page.waitForSelector('#home:not([hidden])', { timeout: 60000 });
  await P.page.waitForFunction(() => /ist angemeldet/.test(document.querySelector('#kQrStatus')?.textContent || ''), null, { timeout: 30000 });
  await P.page.locator('#kQrFertig').click();
  await elternSeite(P.page, 'school');
  // The DOM opens before the queued toggle commits state.popen; the next render reads that state.
  await P.page.waitForFunction(name => {
    const app = window.__evaluationIntegration;
    return app.schoolSectionOpen() && app.schoolEvaluationTarget()?.name === name;
  }, CHILD);

  return { P, K, browser, allowed, access, admin, parentPassword };
}

test('legacy correction drafts preserve the current focus, a synced confirmation replaces it, and withdrawal stops future cards', { timeout: 300000 }, async (t) => {
  const { P, K } = await evaluationFamily(t);
  await elternSeite(P.page, 'school');
  const form = P.page.locator('#pSchoolEvaluation');
  await P.page.evaluate(() => window.__evaluationIntegration.openLegacy());
  assert.match(await form.innerText(), new RegExp(CHILD));
  await form.getByLabel('Titel').fill(TITLE);
  const today = await P.page.evaluate(() => new Date().toISOString().slice(0, 10));
  await form.getByLabel('Bewertungsdatum').fill(today);
  await form.getByLabel('Kriterium').selectOption('M-N5');
  await form.getByLabel('Einstufung').selectOption('C');
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
  const { revision } = written[0].payload;
  assert.equal(written[0].payload.focus, 'two-step');
  assert.equal(written[0].payload.rating, 'C');
  await K.page.waitForFunction((rev) => Object.keys(localStorage).some((key) => /^bq2_p_[A-Za-z0-9]+__events$/.test(key)
    && JSON.parse(localStorage.getItem(key)).some((e) => e.type === 'school_evaluation' && e.payload.revision === rev)), revision, { timeout: 65000 });
  assert.equal((await evaluationEvents(K.page)).length, 1);
  assert.deepEqual(await K.page.evaluate(() => window.__evaluationIntegration.openGaps()), [], 'legacy pilot cards do not enter the regular gap lane');
  assert.equal(await K.page.locator('#pSchoolEvaluation').count(), 0);
  const subtractionTarget = { label: /Word Problems/i, solve: solveSubtraction };
  const first = (await solveTargets(K.page, new Map([[revision, subtractionTarget]]))).get(revision);

  const roundingTitle = 'Runden mit Abstandsbegründung';
  await P.page.evaluate(() => window.__evaluationIntegration.openLegacy());
  await form.getByLabel('Titel').fill(roundingTitle);
  await form.getByLabel('Bewertungsdatum').fill(today);
  await form.getByLabel('Kriterium').selectOption('M-N3');
  await form.getByLabel('Einstufung').selectOption('C');
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
  assert.equal(await form.getByLabel('Kriterium').inputValue(), 'M-N3');
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
  assert.deepEqual(P.errors, []);
  assert.deepEqual(K.errors, []);
});

// Explicitly invented assessment data, stored through the genuine app eventHook.
const INTEGRATION_TITLE = 'Fiktive Kriterienprüfung / invented criteria check';
const INTEGRATION_CRITERIA = [
  { criterion: 'Fiktiv / invented: clear writing ' + 'ZusammenhängendesTestlernwort'.repeat(5), standard: 'E-W1', rating: 'E' },
  { criterion: 'Fiktiv / invented: organizing ideas', standard: 'E-W1', rating: 'C' },
  { criterion: 'Fiktiv / invented: speaking to an audience', standard: 'E-S1', rating: 'RS' },
  { criterion: 'Fiktiv / invented: number position, not assessed', standard: 'M-N1', rating: '' },
  { criterion: 'Fiktiv / invented: no matching area', standard: 'none', rating: 'M' },
];
const integrationPayload = () => ({
  evaluation: '8c97af5e-6e19-46b8-85c6-d3c950a77680', revision: '8c97af5e-6e19-46b8-85c6-d3c950a77681',
  title: INTEGRATION_TITLE, day: new Date().toISOString().slice(0, 10),
  assessment: { area: 'english', goal: 'Fiktives Lernziel / invented goal', instructions: '', feedback: '', criteria: structuredClone(INTEGRATION_CRITERIA) },
});
async function storeIntegrationAssessment(page, payload) {
  const event = await page.evaluate(payload => {
    const app = window.__evaluationIntegration, target = app.schoolEvaluationTarget();
    if (!target) throw new Error('Expected the real parent and child target');
    const event = app.eventHook('school_evaluation', { ...payload, child: target.id }, target.id);
    if (!event) throw new Error('The app rejected the invented integration assessment');
    app.renderSheets();
    return event;
  }, payload);
  assert.deepEqual(event.payload.assessment.criteria, payload.assessment.criteria, 'original criteria persisted unchanged');
  return event;
}

async function checkSchoolFilterLayout(page) {
  const sort = page.locator('select[data-psf="sort"]');
  const options = await sort.locator('option').allTextContents();
  // DejaVu exposes the select's intrinsic minimum width; default metrics must fit too.
  for (const profile of ['DejaVu Sans', '']) {
    await page.evaluate(profile => {
      for (const key of ['--body', '--display']) profile ? document.documentElement.style.setProperty(key, '"' + profile + '"') : document.documentElement.style.removeProperty(key);
    }, profile);
    await page.evaluate(async () => { await document.fonts.ready; await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); });
    const layout = await parentLayout(page);
    assert.ok(layout.document <= layout.viewport, `320 px (${profile || 'default'}): ${JSON.stringify(layout)}`);
    const controls = await page.locator('.psfilters label, .psfilters select').evaluateAll(elements => elements.map(e => {
      const r = e.getBoundingClientRect(), parent = e.closest('.psfilters').getBoundingClientRect();
      return { tag: e.tagName, field: e.dataset.psf || '', left: r.left, right: r.right, parentLeft: parent.left, parentRight: parent.right };
    }));
    assert.ok(controls.every(e => e.left >= e.parentLeft && e.right <= e.parentRight), `filter controls fit their parent: ${JSON.stringify(controls)}`);
    assert.deepEqual(await sort.locator('option').allTextContents(), options, 'all option texts remain intact');
    await sort.selectOption('subject');
    assert.equal(await sort.inputValue(), 'subject');
    await sort.selectOption('date');
  }
}

async function parentLayout(page) {
  return page.evaluate(() => {
    const viewport = innerWidth, path = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().replace(/\s+/g, '.') : '') + (e.dataset?.l ? '[data-l="' + e.dataset.l + '"]' : '') + (e.dataset?.psf ? '[data-psf="' + e.dataset.psf + '"]' : '');
    const visible = e => e.getClientRects().length && e.checkVisibility({ checkVisibilityCSS: true });
    const elements = [...document.body.querySelectorAll('*')].filter(visible);
    const boxes = elements.filter(e => e.getBoundingClientRect().right > viewport || e.scrollWidth > e.clientWidth).map(e => {
      const r = e.getBoundingClientRect(), css = getComputedStyle(e);
      return { element: path(e), parent: path(e.parentElement), left: r.left, right: r.right, scroll: e.scrollWidth, client: e.clientWidth, minWidth: css.minWidth, width: css.width, font: css.font, whiteSpace: css.whiteSpace, overflowWrap: css.overflowWrap,
        before: getComputedStyle(e, '::before').content, after: getComputedStyle(e, '::after').content };
    }).sort((a, b) => b.right - a.right).slice(0, 25);
    const texts = [], walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent.trim() || !visible(node.parentElement)) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      for (const r of range.getClientRects()) if (r.right > viewport) texts.push({ element: path(node.parentElement), text: node.textContent.trim().slice(0, 120), left: r.left, right: r.right });
    }
    return { document: document.documentElement.scrollWidth, viewport, rootClient: document.documentElement.clientWidth, bodyClient: document.body.clientWidth, bodyScroll: document.body.scrollWidth, boxes, texts: texts.slice(0, 25) };
  });
}

async function settledSchoolLayout(page) {
  // Font metrics and the layout after this render must be settled before measuring.
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => requestAnimationFrame(resolve));
  });
}

test('integration F1: stored criterion assessments show original grades, empty rating and none in revision history DE/EN', async t => {
  const { P } = await evaluationFamily(t);
  await elternSeite(P.page, 'school');
  const original = integrationPayload();
  await storeIntegrationAssessment(P.page, original);
  const correction = { ...original, base: original.revision, revision: '8c97af5e-6e19-46b8-85c6-d3c950a77682', title: INTEGRATION_TITLE + ' 2' };
  await storeIntegrationAssessment(P.page, correction);
  const derived = await P.page.evaluate(title => {
    const app = window.__evaluationIntegration;
    const task = app.schoolFromAccount(app.schoolEvaluationTarget().id).tasks.find(task => task.title === title);
    return { std: task.std, rubric: task.rubric };
  }, correction.title);
  assert.deepEqual(derived.std, { 'E-W1': 'C', 'E-S1': 'RS' });
  assert.deepEqual(derived.rubric, INTEGRATION_CRITERIA.map(c => ({ crit: c.criterion, teacher: c.rating, self: '' })));
  for (const lang of ['de', 'en']) {
    await P.page.locator(`.phdr [data-plang="${lang}"]`).click();
    await elternSeite(P.page, 'school');
    const details = await showDetails(P.page, correction.title);
    assert.doesNotMatch(await details.innerText(), /undefined/, 'all visible criterion history values are defined');
    const history = details.locator('[data-eval-history]');
    assert.equal(await history.count(), 2, 'original and correction remain in the existing history');
    for (const revision of [original.revision, correction.revision]) {
      const rows = details.locator(`[data-eval-history="${revision}"] .pseval-criteria > li`);
      assert.equal(await rows.count(), 5);
      for (let i = 0; i < INTEGRATION_CRITERIA.length; i++) assert.ok((await rows.nth(i).innerText()).includes(INTEGRATION_CRITERIA[i].criterion));
      for (const [i, pattern] of (lang === 'de' ? [[0, /Darüber hinaus/], [1, /Wird sicherer/], [2, /Braucht Unterstützung/], [3, /Keine Einstufung/], [4, /Kein passender Bereich.*Sicher/s]] : [[0, /Going beyond/], [1, /Getting there/], [2, /Needs support/], [3, /Not rated/], [4, /No matching area.*Secure/s]])) assert.match(await rows.nth(i).innerText(), pattern);
    }
    assert.deepEqual(await details.locator('.psrub tbody tr td:first-child').allTextContents(), INTEGRATION_CRITERIA.map(c => c.criterion));
    assert.match(await history.nth(0).innerText(), lang === 'de' ? /Frühere Fassung/ : /Earlier revision/);
    assert.match(await history.nth(1).innerText(), lang === 'de' ? /Aktive Fassung/ : /Active revision/);
  }
  const withdrawn = { ...correction, base: correction.revision, revision: '8c97af5e-6e19-46b8-85c6-d3c950a77683', withdrawn: true };
  await storeIntegrationAssessment(P.page, withdrawn);
  const details = await showDetails(P.page, withdrawn.title);
  assert.match(await details.locator('[data-eval-history]').last().innerText(), /Withdrawn/);
  assert.doesNotMatch(await details.innerText(), /undefined/);
  assert.equal((await evaluationEvents(P.page)).length, 3);
  assert.deepEqual(P.errors, []);
});

test('integration F2: stored long criteria, rubric and parent links fit 320 px after layout, DE/EN and keyboard', async t => {
  const { P } = await evaluationFamily(t, { viewport: { width: 320, height: 800 } });
  await elternSeite(P.page, 'school');
  await storeIntegrationAssessment(P.page, integrationPayload());
  for (const lang of ['de', 'en']) {
    await P.page.locator(`.phdr [data-plang="${lang}"]`).click();
    await elternSeite(P.page, 'school');
    const row = P.page.locator('.psrow').filter({ hasText: INTEGRATION_TITLE });
    const button = row.locator('[data-psdet]');
    await button.focus();
    if (await button.getAttribute('aria-expanded') === 'true') await P.page.keyboard.press('Enter');
    await P.page.keyboard.press('Enter');
    assert.equal(await button.getAttribute('aria-expanded'), 'true');
    const details = P.page.locator(`[data-psdetrow="${await button.getAttribute('data-psdet')}"]`);
    await settledSchoolLayout(P.page);
    await checkSchoolFilterLayout(P.page);
    const width = await P.page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth,
      overflowing: [...document.querySelectorAll('.psrub, .psrub th, .psrub td, a.pgo')].filter(e => e.getClientRects().length && e.getBoundingClientRect().right > innerWidth).map(e => ({ tag: e.tagName, class: e.className, right: e.getBoundingClientRect().right })) }));
    assert.ok(width.document <= width.viewport, `320 px without overflow: ${JSON.stringify(await parentLayout(P.page))}`);
    assert.deepEqual(width.overflowing, [], 'rubric and links stay inside the viewport');
    assert.deepEqual(await details.locator('.psrub tbody tr td:first-child').allTextContents(), INTEGRATION_CRITERIA.map(c => c.criterion), 'long stored text remains complete');
    const cells = await details.locator('.psrub td').evaluateAll(elements => elements.map(e => [e.scrollWidth, e.clientWidth]));
    assert.ok(cells.every(([scroll, client]) => scroll <= client), `cell text wraps: ${JSON.stringify(cells)}`);
    await P.page.locator('#pHelp').click();
    await settledSchoolLayout(P.page);
    assert.ok(await P.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'parent help links also fit 320 px');
    const link = P.page.locator('a.pgo:visible').first();
    await link.focus();
    await P.page.keyboard.press('Enter');
    await P.page.locator('#pSetBack').waitFor();
    await P.page.locator('#pSetBack').click();
  }
  assert.deepEqual(P.errors, []);
});

test('integration F1 unmapped: Test-11 history retains criterion grades without displaying technical N as a teacher grade', async t => {
  const { P } = await evaluationFamily(t);
  await elternSeite(P.page, 'school');
  const payload = integrationPayload();
  payload.evaluation = '8c97af5e-6e19-46b8-85c6-d3c950a77690';
  payload.revision = '8c97af5e-6e19-46b8-85c6-d3c950a77691';
  payload.title = 'Fiktiver Test-11-Altbestand / invented legacy assessment';
  Object.assign(payload, { standard: 'unmapped', rating: 'N', focus: 'none' });
  payload.assessment.criteria = payload.assessment.criteria.map(({ standard, ...criterion }) => ({ ...criterion, evidence: '' }));
  await storeIntegrationAssessment(P.page, payload);
  for (const lang of ['de', 'en']) {
    await P.page.locator(`.phdr [data-plang="${lang}"]`).click();
    await elternSeite(P.page, 'school');
    const details = await showDetails(P.page, payload.title);
    assert.doesNotMatch(await details.innerText(), /undefined/);
    const rows = details.locator('.pseval-criteria > li');
    assert.equal(await rows.count(), 5);
    for (let i = 0; i < payload.assessment.criteria.length; i++) {
      assert.ok((await rows.nth(i).innerText()).includes(payload.assessment.criteria[i].criterion));
      assert.match(await rows.nth(i).innerText(), lang === 'de' ? /Kein zugeordneter Bereich/ : /No assigned area/);
      assert.ok(!(await rows.nth(i).innerText()).endsWith(' · N'), 'technical N is not a criterion grade');
    }
    assert.match(await rows.nth(0).innerText(), lang === 'de' ? /Darüber hinaus/ : /Going beyond/);
    assert.match(await rows.nth(1).innerText(), lang === 'de' ? /Wird sicherer/ : /Getting there/);
    assert.match(await rows.nth(3).innerText(), lang === 'de' ? /Keine Einstufung/ : /Not rated/);
  }
  assert.deepEqual(P.errors, []);
});


test('integration A2: a stored 160-character assessment title wraps completely in the task card DE/EN at 320 px', async t => {
  const { P } = await evaluationFamily(t, { viewport: { width: 320, height: 800 } });
  await elternSeite(P.page, 'school');
  const payload = integrationPayload(); payload.title = 'Synthetic-' + 'T'.repeat(150);
  assert.equal(payload.title.length, 160);
  await storeIntegrationAssessment(P.page, payload);
  for (const lang of ['de', 'en']) {
    await P.page.locator(`.phdr [data-plang="${lang}"]`).click();
    await elternSeite(P.page, 'school');
    await settledSchoolLayout(P.page);
    const cell = P.page.locator('.psrow td').filter({ hasText: payload.title });
    assert.equal(await cell.textContent(), payload.title, 'accepted title is preserved completely');
    const layout = await parentLayout(P.page);
    assert.ok(layout.document <= layout.viewport, `160-character title: ${JSON.stringify(layout)}`);
    assert.ok(await cell.evaluate(e => e.scrollWidth <= e.clientWidth), 'title text wraps within its task card');
  }
  assert.deepEqual(P.errors, []);
});

// EV4 uses invented documents and the real authenticated parent/event path.
test('EV4/EV7 manual: confirmed criteria activate the visible gap, automatic focus and school starting value', { timeout: 120000 }, async t => {
  const { P, K } = await evaluationFamily(t);
  await elternSeite(P.page, 'school');
  const form = P.page.locator('#pSchoolEvaluation');
  await form.getByRole('button', { name: 'Evaluation hinzufügen' }).click();
  assert.equal(await form.locator('select[name="doc-area"]').count(), 1, 'subject is the existing app selection, not free text');
  await form.getByLabel('Titel der Evaluation', { exact: true }).fill('Fiktive drei Kriterien');
  await form.getByLabel('Bewertungsdatum', { exact: true }).fill(new Date().toISOString().slice(0, 10));
  await form.getByLabel('Fach', { exact: true }).selectOption('maths');
  await form.getByLabel('Lernziel', { exact: true }).fill('Fiktives Lernziel');
  await form.getByLabel('Arbeitsanweisung', { exact: true }).fill('Fiktive Anweisung');
  await form.getByLabel('Lehrkraft-Rückmeldung', { exact: true }).fill('Fiktive Rückmeldung');
  const criteria = [
    { criterion: 'Fiktiv: Stellenwert erklären', rating: 'C', standard: 'M-N1' },
    { criterion: 'Fiktiv: auf Hunderter runden', rating: 'M', standard: 'M-N3' },
    { criterion: 'Fiktiv: eigene Darstellung', rating: '', standard: 'none' },
  ];
  for (let i = 0; i < criteria.length; i++) {
    if (i) await form.getByRole('button', { name: 'Kriterium hinzufügen', exact: true }).click();
    await form.locator(`[data-doc-criterion="${i}"]`).fill(criteria[i].criterion);
    await form.locator(`[data-doc-rating="${i}"]`).selectOption(criteria[i].rating);
    await form.locator(`[data-doc-standard="${i}"]`).selectOption(criteria[i].standard);
  }
  await form.locator('[data-doc-standard="0"]').evaluate(select=>{
    select.add(new Option('Invented invalid option','NOT-A-STANDARD'));select.value='NOT-A-STANDARD';select.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await form.getByRole('button', { name: 'Vorschau anzeigen', exact: true }).click();
  assert.match(await form.getByRole('alert').innerText(),/Lernbereiche prüfen/);
  assert.deepEqual(await evaluationEvents(P.page),[],'invalid assignment never enters the preview or event log');
  await form.locator('[data-doc-standard="0"]').selectOption('M-N1');
  await form.getByRole('button', { name: 'Vorschau anzeigen', exact: true }).click();
  assert.deepEqual(await evaluationEvents(P.page), [], 'preview writes no event');
  assert.match(await form.innerText(), /M-N1[\s\S]*Lücke/);
  assert.match(await form.innerText(), /M-N3[\s\S]*keine Lücke/);
  await form.getByRole('button', { name: 'Evaluation bestätigen', exact: true }).evaluate(button => { button.click(); button.click(); });
  const events = await evaluationEvents(P.page);
  assert.equal(events.length, 1, 'double confirmation writes exactly once');
  assert.deepEqual(events[0].payload.assessment.criteria.map(({ evidence, ...row }) => row), criteria);
  assert.equal(events[0].payload.assessment.area, 'maths');
  assert.equal(events[0].payload.assessment.goal, 'Fiktives Lernziel');
  assert.equal(events[0].payload.assessment.instructions, 'Fiktive Anweisung');
  assert.equal(events[0].payload.assessment.feedback, 'Fiktive Rückmeldung');
  const derived = await P.page.evaluate(() => { const app = window.__evaluationIntegration; return app.schoolFromAccount(app.schoolEvaluationTarget().id).tasks.find(t => t.title === 'Fiktive drei Kriterien'); });
  assert.deepEqual(derived.std, { 'M-N1': 'C', 'M-N3': 'M' });
  assert.equal(derived.area, 'maths');
  assert.equal(derived.manual.focus, 'none', 'criterion evaluations keep revision metadata without pilot cards');
  t.diagnostic('Setup reached: real form preview wrote zero events; double confirmation stored one validated three-criterion evaluation and derived M-N1=C / M-N3=M.');
  await P.page.locator('[data-psubj="maths"]').click();
  assert.equal(await P.page.locator('.pgap.on').count(), 1, 'confirmed M-N1=C is visibly the active school gap');
  assert.match(await P.page.locator('.pgap.on').innerText(), /Stellenwert.*Time & Numbers/s);
  assert.equal(await P.page.locator('.pgap.wait').count(), 0, 'M-N3=M does not create another gap');
  await waitForRevision(K.page, events[0].payload.revision);
  const effect = await K.page.evaluate(() => {
    const app = window.__evaluationIntegration;
    return { gaps: app.openGaps().map(g => g.s), active: app.activeGap()?.s, focus: app.focusTopics(), learningVersion:app.evVersion(),schoolVersion:app.schoolLogVersion(),
      school: app.schoolStandFor('numbers'), stand: app.standOf('numbers') };
  });
  assert.deepEqual(effect.gaps, ['M-N1']);
  assert.equal(effect.active, 'M-N1');
  t.diagnostic('Received confirmed school source: '+JSON.stringify({learningVersion:effect.learningVersion,schoolVersion:effect.schoolVersion,focus:effect.focus}));
  assert.ok(effect.focus.includes('numbers'), 'the actual automatic focus contains Time & Numbers');
  const actualRound=await K.page.evaluate(()=>window.__evaluationIntegration.buildToday());
  assert.ok(actualRound.some(q=>q.world==='numbers'&&q.gap),'the real Practise Today contains the received active gap');
  assert.deepEqual(effect.school, { st: 'C', day: events[0].payload.day });
  assert.equal(effect.stand, 'C', 'standOf really starts at C before any own answers');
  // Existing test-build storage adapter prepares only invented practice evidence;
  // assertions call the actual app decision, without reproducing its threshold logic.
  // W1 on main removes day gates: the school base lasts through five answers only.
  for (const [answers, days, expected] of [[5, 1, 'C'], [5, 2, 'C'], [6, 1, 'RS'], [6, 2, 'RS']]) {
    const actual = await K.page.evaluate(({ answers, days }) => {
      const child = JSON.parse(localStorage.getItem('bq2_session')).id;
      const ev = Array.from({ length: answers }, (_, i) => [new Date(Date.now() - (i % days) * 864e5).toISOString().slice(0, 10), 2, 0]);
      localStorage.setItem('bq2_' + child + '__ev', JSON.stringify({ numbers: ev }));
      return window.__evaluationIntegration.standOf('numbers');
    }, { answers, days });
    assert.equal(actual, expected, `${answers} own answers on ${days} practice days`);
  }
  assert.deepEqual(await evaluationEvents(K.page), events, 'practice evidence leaves the confirmed evaluation intact');
  assert.deepEqual(P.errors, []);
  assert.deepEqual(K.errors, []);
});

async function fillDocument(form, title, area, criteria) {
  await form.locator('[name="title"]').fill(title);
  await form.locator('[name="day"]').fill(new Date().toISOString().slice(0, 10));
  await form.locator('[name="doc-area"]').selectOption(area);
  for (let i = 0; i < criteria.length; i++) {
    if (i) await form.locator('[data-eval-action="add-criterion"]').click();
    await form.locator(`[data-doc-criterion="${i}"]`).fill(criteria[i].criterion);
    await form.locator(`[data-doc-rating="${i}"]`).selectOption(criteria[i].rating);
    await form.locator(`[data-doc-standard="${i}"]`).selectOption(criteria[i].standard);
  }
}

test('EV7 D5: confirmed criterion gap keeps the 2/8 share with other topics and may fill the round alone', { timeout: 120000 }, async t => {
  const { P } = await evaluationFamily(t);
  const form = P.page.locator('#pSchoolEvaluation');
  await form.locator('[data-eval-action="open"]').click();
  await fillDocument(form, 'Invented practice effect', 'maths', [
    { criterion: 'Invented place value criterion', rating: 'C', standard: 'M-N1' },
    { criterion: 'Invented secondary subtraction criterion', rating: 'RS', standard: 'M-N5' },
  ]);
  await form.locator('button[type="submit"]').click();
  assert.deepEqual(await evaluationEvents(P.page), [], 'preview still writes nothing');
  await form.locator('button[type="submit"]').click();
  const [event] = await evaluationEvents(P.page);
  assert.ok(event?.payload.assessment, 'the genuine form confirmation stored the criterion document');
  assert.deepEqual(await P.page.evaluate(() => window.__evaluationIntegration.openGaps().map(g => g.s)), ['M-N1'], 'a weak secondary M-N5 does not open a gap for M-N4');
  for (const topic of ['forces', 'numbers']) {
    // One existing import supplies the teacher's current topic. The confirmed
    // criterion evaluation stays on the same child's normal school event path.
    const imported = await P.page.evaluate(topic => {
      const app = window.__evaluationIntegration, child = app.schoolEvaluationTarget().id;
      const day = new Date().toISOString().slice(0, 10);
      return app.eventHook('school_import', { asOf: day, data: { asOf: day, tasks: [
        { day, title: 'Invented current topic', area: 'maths', std: {}, quests: [topic], focusNext: [topic], good: { de: '', en: '' }, next: { de: '', en: '' } },
      ] } }, child);
    }, topic);
    assert.ok(imported?.id, 'the app accepted the synthetic current-topic import');
    assert.deepEqual(await P.page.evaluate(() => window.__evaluationIntegration.classTopics()), [topic], 'the app derives the requested current-topic situation');
    const focus = await P.page.evaluate(() => window.__evaluationIntegration.focusTopics());
    assert.ok(focus.includes('numbers'), 'the active criterion gap is in the automatic focus');
    for (let run = 0; run < 5; run++) {
      // D5 isolates the productive task selection for the viewed child. The
      // separate EV4/EV7 form test retains confirmation and child-device sync.
      const round = await P.page.evaluate(() => window.__evaluationIntegration.buildToday().map(q => ({ world: q.world, gap: !!q.gap, revision: q.schoolRevision || null })));
      assert.equal(round.length, 8, 'the real buildToday returns eight tasks');
      assert.ok(round.every(q => !q.revision), 'criterion evaluations add no legacy pilot cards');
      const fromGap = round.filter(q => q.world === 'numbers');
      if (topic === 'forces') {
        assert.equal(fromGap.length, 2, 'other current topics leave exactly two tasks for the active gap');
        assert.ok(fromGap.every(q => q.gap), 'both tasks use the regular gap lane');
        assert.ok(round.some(q => q.world === 'forces'), 'the other current topic is actually practised');
      } else {
        assert.equal(fromGap.length, 8, 'with no other current topic the gap can fill the whole round');
      }
    }
  }
  assert.deepEqual(await evaluationEvents(P.page), [event], 'imports and task selection preserve the confirmed evaluation');
  assert.deepEqual(P.errors, []);
});

test('EV7 criteria held: real form, child answer clicks, independent groups, reload and parent sync', { timeout: 120000 }, async t => {
  const {P,K}=await evaluationFamily(t),form=P.page.locator('#pSchoolEvaluation');
  await form.locator('[data-eval-action="open"]').click();
  await fillDocument(form,'Invented held criterion','maths',[{criterion:'Invented place value proof',rating:'C',standard:'M-N1'}]);
  await form.locator('button[type="submit"]').click();
  assert.deepEqual(await evaluationEvents(P.page),[],'preview writes no assessment');
  await form.locator('button[type="submit"]').click();
  const [evaluation]=await evaluationEvents(P.page);assert.ok(evaluation?.payload.assessment);
  await P.page.evaluate(()=>window.__evaluationIntegration.kontoAbgleich());
  await K.page.evaluate(()=>window.__evaluationIntegration.kontoAbgleich());
  await waitForRevision(K.page,evaluation.payload.revision);
  assert.deepEqual(await K.page.evaluate(()=>window.__evaluationIntegration.openGaps().map(g=>g.s)),['M-N1']);
  // Select existing year-level multiple-choice questions to exercise the real
  // first-answer buttons deterministically. Production selection/D5 is separate.
  for(let i=0;i<18;i++){
    if(i%8===0)await K.page.evaluate(()=>window.__evaluationIntegration.beginYearRound());
    const answer=await K.page.evaluate(()=>window.__evaluationIntegration.currentAnswer());
    if([10,11,17].includes(i))await K.page.locator('#helpBtn').click();
    await K.page.locator(`#qAnswers .opt[data-i="${answer}"]`).click();
    await K.page.locator('#feedback.good').waitFor();
    if([5,11,17].includes(i)){
      const effect=await K.page.evaluate(()=>{const a=window.__evaluationIntegration,d=a.gapData();return {stand:a.standOf('numbers'),proof:d.journey?.['M-N1']?.quests.numbers,open:a.openGaps().map(g=>g.s)};});
      assert.equal(effect.stand,'M');assert.ok(effect.proof?.reached);
      if(i===5){assert.equal(effect.proof.checks.length,0);assert.deepEqual(effect.open,['M-N1'],'M alone does not close');}
      if(i===11){assert.equal(effect.proof.checks.filter(x=>x.independent).length,4);assert.equal(effect.proof.held,undefined);assert.deepEqual(effect.open,['M-N1'],'help cannot manufacture holding');}
      if(i===17){assert.ok(effect.proof.held);assert.equal(effect.proof.total,18,'three hint records create no extra task slots');assert.equal(effect.proof.groups.length,1);assert.equal(effect.proof.checks.filter(x=>x.independent).length,5);assert.deepEqual(effect.open,[]);}
    }
    if(i%8===7||i===17)await leaveRound(K.page);
    else await K.page.locator('#nextBtn').click();
  }
  const child=evaluation.payload.child;
  const events=await K.page.evaluate(child=>JSON.parse(localStorage.getItem('bq2_'+child+'__events')),child);
  const answers=events.filter(e=>e.type==='answer'&&e.payload.attempt===1);assert.equal(answers.length,18);assert.equal(answers.filter(e=>e.payload.help).length,3);
  assert.equal(events.filter(e=>e.type==='answer'&&e.payload.hintShown).length,3,'the existing hint records add no task slot');
  assert.equal(events.filter(e=>e.type==='school_evaluation').length,1);
  assert.equal(events.filter(e=>e.type==='gap_state'&&e.payload.state==='closed'&&e.payload.by==='app').length,1);
  const now=Date.now()+1000,full=derive(events,{now});assert.ok(full.gaps.journey['M-N1'].quests.numbers.held);assert.equal(full.gaps.closed['M-N1'].by,'app');
  const cut=answers[5].at,prefix=events.filter(e=>e.at<=cut),snapshot=await makeSnapshot(prefix,{now:Date.parse(cut)+1,author:'p_parent',device:'d_snapshot',rand:n=>new Uint8Array(n).fill(77)});
  const restored=await stateFrom(events,snapshot,{now});assert.equal(restored.weg,'schnappschuss');assert.deepEqual(restored.state,full);
  await K.page.evaluate(()=>window.__evaluationIntegration.kontoAbgleich());
  await P.page.evaluate(()=>window.__evaluationIntegration.kontoAbgleich());
  await P.page.waitForFunction(()=>window.__evaluationIntegration.gapData().closed['M-N1']?.by==='app');
  assert.deepEqual(await P.page.evaluate(()=>window.__evaluationIntegration.gapData().closed),full.gaps.closed,'parent receives the child closure');
  await K.page.reload();await K.page.waitForSelector('#home:not([hidden])');
  assert.deepEqual(await K.page.evaluate(()=>window.__evaluationIntegration.gapData().closed),full.gaps.closed,'reload retains the actual closure');
  assert.deepEqual(await K.page.evaluate(()=>window.__evaluationIntegration.openGaps()),[]);
  assert.deepEqual(P.errors,[]);assert.deepEqual(K.errors,[]);
});

async function formFits(page) {
  await settledSchoolLayout(page);
  const geometry = await page.locator('#pSchoolEvaluation').evaluate(box => ({
    viewport: innerWidth, document: document.documentElement.scrollWidth,
    controls: [...box.querySelectorAll('input,textarea,select,fieldset,button')].filter(e => e.getClientRects().length).map(e => {
      const r=e.getBoundingClientRect(); return {tag:e.tagName,left:r.left,right:r.right};
    }),
    colors: [getComputedStyle(box.querySelector('form')).backgroundColor,getComputedStyle(box.querySelector('form')).color],
  }));
  assert.ok(geometry.document <= geometry.viewport, JSON.stringify(geometry));
  assert.ok(geometry.controls.every(c=>c.left >= 0 && c.right <= geometry.viewport), JSON.stringify(geometry));
  assert.notEqual(geometry.colors[0], geometry.colors[1], 'text differs from its actual theme background');
}

test('EV4 O3 and design: weaker grade, explicit parent override, catalog, DE/EN dark 320px and keyboard', { timeout: 120000 }, async t => {
  const { P } = await evaluationFamily(t, { viewport:{width:320,height:800}, colorScheme:'dark' });
  await elternSeite(P.page, 'school');
  const form=P.page.locator('#pSchoolEvaluation');
  await form.locator('[data-eval-action="open"]').click();
  const rows=[
    {criterion:'Invented long criterion '+ 'ZusammenhängendesTestlernwort'.repeat(25),rating:'C',standard:'E-W1'},
    {criterion:'Invented: a clear conclusion',rating:'M',standard:'E-W1'},
    {criterion:'Invented: speaks clearly to the audience',rating:'RS',standard:'E-S1'},
    {criterion:'Invented: place value without a teacher rating',rating:'',standard:'M-N1'},
  ];
  await fillDocument(form,'Fiktive O3-Prüfung','english',rows);
  const codes=await form.locator('[data-doc-standard="0"] option').evaluateAll(options=>options.map(o=>o.value));
  assert.equal(codes.length,16); assert.equal(new Set(codes).size,16);
  assert.equal(await form.locator('[data-doc-standard="0"] optgroup').count(),5);
  assert.match(await form.locator('[data-doc-standard="0"] option[value="E-S1"]').textContent(),/keine Übung in Big Quest/);
  assert.match(await form.locator('[data-doc-area-info="2"]').innerText(),/keine Übung in Big Quest/);
  for(const lang of ['de','en']) {
    await P.page.locator(`.phdr [data-plang="${lang}"]`).click();
    await formFits(P.page);
    await P.page.screenshot({path:'/tmp/ev4-form-'+lang+'-dark320.png',fullPage:true});
    const select=form.getByRole('combobox',{name:lang==='de'?'Bereich in Big Quest · Kriterium 3':'Area in Big Quest · Criterion 3',exact:true});
    await select.focus(); await P.page.keyboard.press('Home'); await P.page.keyboard.press('ArrowDown'); await P.page.keyboard.press('Tab');
    assert.equal(await select.inputValue(),'M-N1','native select can be changed with keyboard');
    await select.selectOption('E-S1');
    const criterion=form.getByRole('textbox',{name:lang==='de'?'Kriterium 1':'Criterion 1',exact:true});
    assert.equal(await criterion.inputValue(),rows[0].criterion);
  }
  await form.locator('button[type="submit"]').click();
  assert.deepEqual(await evaluationEvents(P.page),[]);
  assert.match(await form.locator('[data-eval-area="E-W1"]').innerText(),/C.*weaker of C and M/s);
  assert.match(await form.locator('[data-eval-area="E-W1"]').innerText(),/Gap/);
  assert.match(await form.locator('[data-eval-area="E-S1"]').innerText(),/No gap.*no exercise in Big Quest/s);
  assert.match(await form.locator('[data-eval-area="M-N1"]').innerText(),/Not rated.*No gap/s);
  await formFits(P.page);
  await form.getByRole('combobox',{name:'Change rating for this area · E-W1',exact:true}).selectOption('M');
  assert.match(await form.locator('[data-eval-area="E-W1"]').innerText(),/M.*No gap/s);
  assert.deepEqual(await evaluationEvents(P.page),[],'even changing the override in preview writes nothing');
  await form.locator('button[type="submit"]').click();
  const event=(await evaluationEvents(P.page))[0];
  assert.deepEqual(event.payload.standardOverrides,{'E-W1':'M'});
  assert.deepEqual(event.payload.assessment.criteria.map(({evidence,...row})=>row),rows,'override never replaces original teacher ratings');
  const result=await P.page.evaluate(()=>{const app=window.__evaluationIntegration;return app.schoolFromAccount(app.schoolEvaluationTarget().id).tasks.find(t=>t.title==='Fiktive O3-Prüfung');});
  assert.deepEqual(result.std,{'E-W1':'M','E-S1':'RS'});
  assert.deepEqual(result.focusNext,[],'no focus from the standard without a quest or the corrected secure grade');
  assert.deepEqual(P.errors,[]);
});

const NATIVE_DOCUMENT={title:'Invented native evaluation',date:new Date().toISOString().slice(0,10),goal:'Invented goal',instructions:'Invented instructions',feedback:'Invented feedback',criteria:[
  {criterion:'Invented: explains place value',rating:'C',evidence:'Invented: explains place value C'},
  {criterion:'Invented: rounds to hundreds',rating:'M',evidence:'Invented: rounds to hundreds M'},
],missing:[]};
async function captureSynthetic(page) {
  return page.evaluate(source=>{
    const form=window.bigQuestEvaluationForm, context=form.context();
    if(!context) throw Error('Expected the actual native capture context');
    if(form.source('wrong-context','invented-transfer',source)!=='invalid') throw Error('Wrong context must be rejected');
    const result=form.source(context,'invented-transfer',source);
    if(result!=='opened') throw Error('Capture failed: '+result);
    if(form.source(context,'invented-transfer',source)!=='invalid') throw Error('A consumed context must not be reused');
    return context;
  },NATIVE_DOCUMENT.criteria.map(c=>c.evidence).join('\n'));
}

test('EV4 native: synthetic bridge fills the shared draft and preserves original evidence until confirmation', {timeout:120000},async t=>{
  const {P}=await evaluationFamily(t);
  await elternSeite(P.page,'school');
  await P.page.evaluate(result=>{window.webkit={messageHandlers:{bigQuestEvaluation:{postMessage:async request=>{window.__syntheticRequest=request;return result;}}}};},NATIVE_DOCUMENT);
  await captureSynthetic(P.page);
  const form=P.page.locator('#pSchoolEvaluation');
  await form.locator('[data-eval-action="ai"]').click();
  await form.locator('[name="title"]').waitFor({state:'visible'});
  await P.page.waitForFunction(()=>document.querySelector('[name="title"]')?.value==='Invented native evaluation');
  assert.deepEqual(await form.locator('[data-doc-standard] option:checked').evaluateAll(options=>options.map(o=>o.value)),['none','none'],'missing proposals stay none until EV5');
  await form.locator('[name="doc-area"]').selectOption('maths');
  await form.locator('[data-doc-standard="0"]').selectOption('M-N1');
  await form.locator('[data-doc-standard="1"]').selectOption('M-N3');
  await form.locator('button[type="submit"]').click();
  assert.deepEqual(await evaluationEvents(P.page),[]);
  await form.locator('details').first().locator('summary').click();
  assert.match(await form.innerText(),/Invented: explains place value C/);
  await form.locator('button[type="submit"]').click();
  const event=(await evaluationEvents(P.page))[0];
  assert.deepEqual(event.payload.assessment.criteria,NATIVE_DOCUMENT.criteria.map((c,i)=>({...c,standard:i?'M-N3':'M-N1'})));
  assert.deepEqual(Object.keys(await P.page.evaluate(()=>window.__syntheticRequest)),['source'],'no credential enters the captured source request');
  await P.page.reload(); await elternSeite(P.page,'school');
  assert.equal((await evaluationEvents(P.page)).length,1);
  const details=await showDetails(P.page,NATIVE_DOCUMENT.title);
  assert.match(await details.innerText(),/Invented: explains place value/);
  assert.deepEqual(P.errors,[]);
});

test('EV4 native guards: cancellation and account logout discard late synthetic replies without an event', {timeout:120000},async t=>{
  const {P}=await evaluationFamily(t);
  await elternSeite(P.page,'school');
  await P.page.evaluate(()=>{window.webkit={messageHandlers:{bigQuestEvaluation:{postMessage:()=>new Promise(resolve=>{window.__finishSynthetic=resolve;})}}};});
  const form=P.page.locator('#pSchoolEvaluation');
  await captureSynthetic(P.page);
  await form.locator('[data-eval-action="ai"]').click();
  await P.page.waitForFunction(()=>typeof window.__finishSynthetic==='function');
  await form.locator('[data-eval-action="cancel"]').click();
  await form.locator('[data-eval-action="open"]').click();
  await form.locator('[name="title"]').fill('Invented replacement manual draft');
  await P.page.evaluate(result=>window.__finishSynthetic(result),NATIVE_DOCUMENT);
  assert.equal(await form.locator('[name="title"]').inputValue(),'Invented replacement manual draft');
  assert.deepEqual(await evaluationEvents(P.page),[]);
  await form.locator('[data-eval-action="cancel"]').click();
  await captureSynthetic(P.page);
  await form.locator('[data-eval-action="ai"]').click();
  await P.page.waitForFunction(()=>document.querySelector('[data-eval-action="ai"]')?.disabled);
  await form.evaluate(box=>window.__staleEvaluationForm=box.querySelector('form'));
  await P.page.locator('#parentClose').click();
  await P.page.evaluate(result=>{window.__finishSynthetic(result);window.__staleEvaluationForm.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));},NATIVE_DOCUMENT);
  assert.equal(await P.page.evaluate(()=>window.__evaluationIntegration.draft()),null);
  assert.equal(await P.page.evaluate(()=>window.bigQuestEvaluationForm.context()),null);
  assert.deepEqual(await evaluationEvents(P.page),[]);
  assert.deepEqual(P.errors,[]);
});

test('EV4 revisions: document correction, sync conflict guard, resolution and withdrawal keep original criteria', {timeout:120000},async t=>{
  const {P}=await evaluationFamily(t);
  await elternSeite(P.page,'school');
  const original=integrationPayload();
  original.assessment.criteria=original.assessment.criteria.map(c=>({...c,evidence:'Invented original evidence '+c.rating}));
  original.standardOverrides={'E-W1':'M'};
  await storeIntegrationAssessment(P.page,original);
  const form=P.page.locator('#pSchoolEvaluation');
  let details=await showDetails(P.page,original.title);
  await details.locator('[data-pseval-op="correct"]').click();
  assert.equal(await form.locator('[name="doc-area"]').inputValue(),'english');
  assert.deepEqual(await form.locator('[data-doc-rating]').evaluateAll(rows=>rows.map(r=>r.value)),original.assessment.criteria.map(c=>c.rating));
  await form.locator('[name="title"]').fill('Invented corrected document');
  await form.locator('button[type="submit"]').click();
  assert.equal(await form.locator('[data-doc-override="E-W1"]').inputValue(),'M');
  const concurrent={...original,base:original.revision,revision:'8c97af5e-6e19-46b8-85c6-d3c950a77684',title:'Invented concurrent correction'};
  await storeIntegrationAssessment(P.page,concurrent);
  await form.locator('button[type="submit"]').click();
  assert.match(await form.getByRole('alert').innerText(),/beim Abgleich geändert/);
  assert.equal((await evaluationEvents(P.page)).length,2,'a stale correction writes no event');
  await form.locator('[data-eval-action="cancel"]').click();
  details=await showDetails(P.page,concurrent.title);
  await details.locator('[data-pseval-op="correct"]').click();
  await form.locator('[name="title"]').fill('Invented corrected document');
  await form.locator('button[type="submit"]').click();
  await form.locator('button[type="submit"]').click();
  let events=await evaluationEvents(P.page);
  assert.equal(events.length,3);
  const corrected=events.find(e=>e.payload.title==='Invented corrected document').payload;
  assert.equal(corrected.base,concurrent.revision);
  assert.deepEqual(corrected.assessment,original.assessment);
  assert.deepEqual(corrected.standardOverrides,{'E-W1':'M'});
  details=await showDetails(P.page,corrected.title);
  await details.locator('[data-pseval-op="withdraw"]').click();
  await form.getByRole('button',{name:'Rücknahme bestätigen',exact:true}).click();
  events=await evaluationEvents(P.page);
  assert.equal(events.length,4);
  const withdrawn=events.find(e=>e.payload.withdrawn).payload;
  assert.equal(withdrawn.base,corrected.revision);
  assert.deepEqual(withdrawn.assessment,original.assessment);
  assert.ok(!Object.hasOwn(withdrawn,'focus'),'new-format withdrawal must not acquire legacy fields');
  assert.deepEqual(P.errors,[]);
});

test('EV4 child guard: changing the actual child selection invalidates capture and a pending native reply', {timeout:120000},async t=>{
  const {P,K,browser,allowed}=await evaluationFamily(t);
  await elternSeite(P.page,'school');
  await P.page.locator('#pSettings').click();
  const family=P.page.locator('details.psec[data-psec="family"]');
  if(!await family.evaluate(details=>details.open)) await family.locator(':scope > summary').click();
  await P.page.locator('#kKindAnlegen').click();
  await P.page.locator('#kKindName').fill('Lina Sonnenweg');
  await P.page.locator('#kKindWeiter').click();
  await P.page.locator('#kKindLogin').fill('lina.sonnenweg');
  await P.page.locator('#kKindGo').click();
  await P.page.locator('#kQr svg').waitFor();
  const code=(await P.page.locator('#kCode').textContent()).trim();
  const pub=await P.page.evaluate(()=>new Promise((resolve,reject)=>{
    const db=indexedDB.open('bq2_konto',1);db.onerror=()=>reject(db.error);db.onsuccess=()=>{
      const req=db.result.transaction('schluessel').objectStore('schluessel').getAll();req.onerror=()=>reject(req.error);
      req.onsuccess=()=>{db.result.close();resolve(req.result[0].pub);};
    };
  }));
  const other=await device(browser,allowed);
  const url=new URL(P.page.url());url.hash='';
  await other.page.goto(anmEinladungslink(url.href,{zugang:TOKEN,anmeldename:'lina.sonnenweg',code,fingerabdruck:await keyFingerprint(pub)}));
  await register(other.page);
  await other.page.waitForSelector('#home:not([hidden])',{timeout:60000});
  await P.page.waitForFunction(()=>/ist angemeldet/.test(document.querySelector('#kQrStatus')?.textContent||''),null,{timeout:30000});
  await P.page.locator('#kQrFertig').click();
  await elternSeite(P.page,'school');
  await P.page.locator('#pKidSel').selectOption(LOGIN);
  await elternSeite(P.page,'school');
  await P.page.evaluate(()=>{window.webkit={messageHandlers:{bigQuestEvaluation:{postMessage:()=>new Promise(resolve=>window.__finishSynthetic=resolve)}}};});
  const context=await captureSynthetic(P.page);
  await P.page.locator('[data-eval-action="ai"]').click();
  await P.page.waitForFunction(()=>typeof window.__finishSynthetic==='function');
  await P.page.locator('#pKidSel').selectOption('lina.sonnenweg');
  await P.page.evaluate(result=>window.__finishSynthetic(result),NATIVE_DOCUMENT);
  assert.equal(await P.page.evaluate(()=>window.__evaluationIntegration.draft()),null);
  assert.equal(await P.page.evaluate(context=>window.bigQuestEvaluationForm.source(context,'invented-late-transfer','Invented late source'),context),'invalid');
  assert.deepEqual(await evaluationEvents(P.page),[]);
  await P.page.locator('[data-eval-action="open"]').click();
  const form=P.page.locator('#pSchoolEvaluation');
  await fillDocument(form,'Invented second-child draft','maths',[{criterion:'Invented second child criterion',rating:'C',standard:'M-N1'}]);
  await form.locator('button[type="submit"]').click();
  await P.page.locator('#pKidSel').selectOption(LOGIN);
  assert.equal(await P.page.evaluate(()=>window.__evaluationIntegration.draft()),null,'child change also discards a manual preview');
  assert.deepEqual(await evaluationEvents(P.page),[]);
  assert.deepEqual(P.errors,[]);assert.deepEqual(K.errors,[]);assert.deepEqual(other.errors,[]);
});

test('EV4 legacy document: truthful preview and editable original assignment survive correction and explicit criterion mapping', {timeout:120000},async t=>{
  const {P}=await evaluationFamily(t,{viewport:{width:320,height:800},colorScheme:'dark'});
  await elternSeite(P.page,'school');
  const original={
    evaluation:'5f079d1a-7f93-4daa-af7c-0d465ac77701',revision:'5f079d1a-7f93-4daa-af7c-0d465ac77702',
    title:'Invented Test11 document with legacy rounding',day:new Date().toISOString().slice(0,10),standard:'M-N3',rating:'C',focus:'round-distance',
    assessment:{area:'math',goal:'Invented Test11 goal',instructions:'Invented instructions',feedback:'Invented feedback',criteria:[
      {criterion:'Invented original rounding criterion',rating:'C',evidence:'Invented original rounding criterion C'},
      {criterion:'Invented original explanation criterion',rating:'M',evidence:'Invented original explanation criterion M'},
    ]},
  };
  await storeIntegrationAssessment(P.page,original);
  const derived=()=>P.page.evaluate(evaluation=>{const app=window.__evaluationIntegration;return app.schoolFromAccount(app.schoolEvaluationTarget().id).tasks.find(t=>t.manual?.evaluation===evaluation);},original.evaluation);
  assert.deepEqual((await derived()).std,{'M-N3':'C'});
  assert.deepEqual((await derived()).focusNext,['round']);
  const form=P.page.locator('#pSchoolEvaluation');
  let details=await showDetails(P.page,original.title);
  await details.locator('[data-pseval-op="correct"]').click();
  await form.locator('button[type="submit"]').click();
  assert.equal((await evaluationEvents(P.page)).length,1,'a legacy correction preview writes nothing');
  assert.doesNotMatch(await form.innerText(),/Keine zugeordneten Einstufungen\. Kein zusätzlicher Übungsfokus\./,'a known legacy assignment must not be described as absent');
  assert.match(await form.innerText(),/M-N3: C[\s\S]*Lücke/);
  for(const lang of ['en','de']){
    await P.page.locator(`.phdr [data-plang="${lang}"]`).click();
    await formFits(P.page);
    assert.match(await form.locator('[data-eval-legacy-effect]').innerText(),/M-N3: C/);
    assert.equal(await form.getByRole('checkbox').isChecked(),true);
  }
  assert.equal(await form.getByRole('checkbox',{name:'Runden mit Abstandsbegründung in Practise Today üben',exact:true}).isChecked(),true);
  await form.locator('[data-eval-action="edit"]').click();
  assert.equal(await form.locator('[name="standard"]').inputValue(),'M-N3');
  assert.equal(await form.locator('[name="rating"]').inputValue(),'C');
  await formFits(P.page);
  await form.locator('[data-eval-action="add-criterion"]').click();
  assert.equal(await form.locator('[data-doc-standard]').count(),0,'adding an original criterion does not silently switch the document format');
  await form.locator('[data-doc-remove="2"]').click();
  await form.locator('[name="standard"]').selectOption('unmapped');
  await form.locator('button[type="submit"]').click();
  assert.match(await form.innerText(),/Keine zugeordneten Einstufungen\. Kein zusätzlicher Übungsfokus\./,'unassigned legacy preview truthfully has no assignment or focus');
  assert.equal((await evaluationEvents(P.page)).length,1);
  await form.locator('[data-eval-action="edit"]').click();
  await form.locator('[name="standard"]').selectOption('M-N5');
  await form.locator('[name="rating"]').selectOption('RS');
  await form.locator('button[type="submit"]').click();
  assert.match(await form.innerText(),/M-N5: RS/);
  const focus=form.getByRole('checkbox',{name:'Zweischrittige Subtraktion in Practise Today üben',exact:true});
  assert.equal(await focus.isChecked(),true);
  await focus.uncheck();
  assert.match(await form.innerText(),/Kein zusätzlicher Übungsfokus/);
  await form.locator('button[type="submit"]').evaluate(button=>{button.click();button.click();});
  const events=await evaluationEvents(P.page);
  assert.equal(events.length,2,'double confirmation adds exactly one legacy correction');
  const corrected=events.find(e=>e.payload.base===original.revision).payload;
  assert.equal(corrected.standard,'M-N5');assert.equal(corrected.rating,'RS');assert.equal(corrected.focus,'none');
  assert.deepEqual(corrected.assessment,original.assessment,'changing the legacy assignment must not change or map original criterion grades/evidence');
  assert.deepEqual((await derived()).std,{'M-N5':'RS'});
  assert.deepEqual((await derived()).focusNext,[]);
  details=await showDetails(P.page,original.title);
  await details.locator('[data-pseval-op="correct"]').click();
  await form.getByRole('button',{name:'Bereiche je Kriterium zuordnen',exact:true}).click();
  assert.equal(await form.locator('[name="standard"]').count(),0,'explicit criterion mapping replaces legacy edit controls');
  assert.equal(await form.locator('[data-doc-standard="0"] option').count(),16,'the explicit criterion mode retains the full EV3 catalog plus none');
  await formFits(P.page);
  assert.deepEqual(await form.locator('[data-doc-standard]').evaluateAll(selects=>selects.map(s=>s.value)),['none','none'],'legacy assignment is not silently copied onto every criterion');
  await form.locator('[data-doc-standard="0"]').selectOption('M-N1');
  await form.locator('button[type="submit"]').click();
  assert.equal(await form.locator('[name="exerciseFocus"]').count(),0);
  assert.match(await form.innerText(),/M-N1: C[\s\S]*Lücke/);
  assert.doesNotMatch(await form.innerText(),/M-N5: RS/,'preview must reflect only the explicit criterion assignment');
  assert.equal((await evaluationEvents(P.page)).length,2);
  await form.locator('button[type="submit"]').evaluate(button=>{button.click();button.click();});
  const finalEvents=await evaluationEvents(P.page);
  assert.equal(finalEvents.length,3);
  const mapped=finalEvents.find(e=>e.payload.base===corrected.revision).payload;
  assert.ok(!['standard','rating','focus'].some(key=>Object.hasOwn(mapped,key)),'criterion event must not include legacy rating/focus');
  assert.deepEqual(mapped.assessment.criteria.map(({standard,...criterion})=>criterion),original.assessment.criteria);
  assert.deepEqual(mapped.assessment.criteria.map(c=>c.standard),['M-N1','none']);
  assert.equal(mapped.assessment.area,'maths','explicitly switching uses the existing app subject key');
  assert.deepEqual((await derived()).std,{'M-N1':'C'});
  assert.deepEqual((await derived()).focusNext,['numbers']);
  assert.deepEqual(P.errors,[]);
});

/* ---- EV5/EV6 form (appended; invented data only) ---- */
const ev5Today = () => new Date().toISOString().slice(0, 10);
function ev5RemapPayload(criteria) {
  const p = integrationPayload();
  delete p.standardOverrides;
  p.title = 'Invented EV6 growth';
  p.assessment = { area: 'maths', goal: 'Invented goal', instructions: 'Invented instructions', feedback: 'Invented feedback', criteria };
  return p;
}
const EV5_NONE_ROWS = [
  { criterion: 'Rounds to the nearest 10, 100 and 1,000', rating: 'C', evidence: 'Invented evidence one', standard: 'none' },
  { criterion: 'Invented: unrelated own drawing', rating: 'M', evidence: 'Invented evidence two', standard: 'none' },
];

test('EV5 form: proposal for new criteria, parent correction incl. none survives and is saved on one event', { timeout: 120000 }, async t => {
  const { P } = await evaluationFamily(t);
  await elternSeite(P.page, 'school');
  const form = P.page.locator('#pSchoolEvaluation');
  await form.locator('[data-eval-action="open"]').click();
  await form.locator('[name="title"]').fill('Invented EV5 proposal form');
  await form.locator('[name="day"]').fill(ev5Today());
  await form.locator('[name="doc-area"]').selectOption('maths');
  await form.locator('[data-doc-criterion="0"]').fill('Rounds to the nearest 10, 100 and 1,000');
  assert.equal(await form.locator('[data-doc-standard="0"]').inputValue(), 'M-N3', 'automatic proposal');
  await form.locator('[data-eval-action="add-criterion"]').click();
  await form.locator('[data-doc-criterion="1"]').fill('Invented: unrelated own drawing');
  assert.equal(await form.locator('[data-doc-standard="1"]').inputValue(), 'none');
  await form.locator('[data-doc-standard="0"]').selectOption('none');
  await form.locator('[data-doc-criterion="0"]').fill('Rounds to the nearest 10, 100 and 1,000 ');
  assert.equal(await form.locator('[data-doc-standard="0"]').inputValue(), 'none', 'explicit none is never recalculated');
  await form.locator('[data-eval-action="add-criterion"]').click();
  await form.locator('[data-doc-criterion="2"]').fill('Runden auf Zehner, Hunderter und Tausender');
  await form.locator('[data-doc-rating="2"]').selectOption('C');
  assert.deepEqual(await form.locator('[data-doc-standard]').evaluateAll(s => s.map(x => x.value)), ['none', 'none', 'M-N3'], 'values survive redraw');
  assert.doesNotMatch(await form.innerText(), /Toddle|similarity|aiProposal/i);
  await form.locator('button[type="submit"]').click();
  assert.deepEqual(await evaluationEvents(P.page), [], 'preview writes nothing');
  assert.match(await form.innerText(), /M-N3: C/);
  await form.locator('button[type="submit"]').evaluate(b => { b.click(); b.click(); });
  const events = await evaluationEvents(P.page);
  assert.equal(events.length, 1, 'one confirmed event');
  assert.deepEqual(events[0].payload.assessment.criteria.map(c => c.standard), ['none', 'none', 'M-N3']);
  assert.deepEqual(P.errors, []);
});

test('EV5 known: an exact confirmed parent correction is proposed again for the same child (case/space only)', { timeout: 120000 }, async t => {
  const { P } = await evaluationFamily(t);
  await elternSeite(P.page, 'school');
  const form = P.page.locator('#pSchoolEvaluation');
  await form.locator('[data-eval-action="open"]').click();
  await form.locator('[name="title"]').fill('Invented EV5 known first');
  await form.locator('[name="day"]').fill(ev5Today());
  await form.locator('[name="doc-area"]').selectOption('english');
  await form.locator('[data-doc-criterion="0"]').fill('Invented: owns exact phrase zzz');
  assert.equal(await form.locator('[data-doc-standard="0"]').inputValue(), 'none', 'no similarity before it is known');
  await form.locator('[data-doc-rating="0"]').selectOption('M');
  await form.locator('[data-doc-standard="0"]').selectOption('E-S2');
  await form.locator('button[type="submit"]').click();
  assert.equal((await evaluationEvents(P.page)).length, 0, 'unconfirmed data is not learned');
  await form.locator('button[type="submit"]').click();
  assert.equal((await evaluationEvents(P.page)).length, 1);
  await form.locator('[data-eval-action="open"]').click();
  await form.locator('[data-doc-criterion="0"]').fill('  invented:  OWNS exact phrase   zzz');
  assert.equal(await form.locator('[data-doc-standard="0"]').inputValue(), 'E-S2');
  await form.locator('[data-doc-criterion="0"]').fill('Invented: owns another phrase qqq');
  assert.equal(await form.locator('[data-doc-standard="0"]').inputValue(), 'none', 'only exact known text is reused');
  assert.deepEqual(P.errors, []);
});

test('EV6 growth: stored none criterion with a catalog match -> notice, preview writes 0, ONE revision of the same evaluation', { timeout: 120000 }, async t => {
  const { P } = await evaluationFamily(t);
  await elternSeite(P.page, 'school');
  const payload = ev5RemapPayload(EV5_NONE_ROWS);
  await storeIntegrationAssessment(P.page, payload);
  await elternSeite(P.page, 'school');
  const form = P.page.locator('#pSchoolEvaluation');
  const notice = form.locator('[data-eval-remap]');
  assert.match(await notice.innerText(), /Neue Zuordnungen möglich/);
  assert.equal((await evaluationEvents(P.page)).length, 1);
  await notice.locator('[data-eval-action="remap"]').click();
  assert.equal((await evaluationEvents(P.page)).length, 1, 'opening the preview writes nothing');
  assert.match(await form.innerText(), /M-N3: C/);
  await form.getByRole('button', { name: 'Korrektur bestätigen', exact: true }).evaluate(b => { b.click(); b.click(); });
  const events = await evaluationEvents(P.page);
  assert.equal(events.length, 2, 'exactly one revision, no duplicate on repeated confirmation');
  const revised = events.find(e => e.payload.base === payload.revision).payload;
  assert.equal(revised.evaluation, payload.evaluation);
  assert.equal(revised.title, payload.title);
  assert.deepEqual(revised.assessment.criteria.map(({ standard, ...c }) => c), EV5_NONE_ROWS.map(({ standard, ...c }) => c), 'ratings and evidence unchanged');
  assert.deepEqual(revised.assessment.criteria.map(c => c.standard), ['M-N3', 'none']);
  assert.ok(!['standard', 'rating', 'focus'].some(k => Object.hasOwn(revised, k)));
  assert.equal(await form.locator('[data-eval-remap]').count(), 0, 'no notice once nothing is left');
  assert.deepEqual(P.errors, []);
});

test('EV6 no candidates: no notice', { timeout: 120000 }, async t => {
  const { P } = await evaluationFamily(t);
  await elternSeite(P.page, 'school');
  await storeIntegrationAssessment(P.page, ev5RemapPayload([
    { criterion: 'Invented: unrelated own drawing', rating: 'M', evidence: 'Invented evidence', standard: 'none' },
  ]));
  await elternSeite(P.page, 'school');
  assert.equal(await P.page.locator('#pSchoolEvaluation [data-eval-remap]').count(), 0);
  assert.deepEqual(P.errors, []);
});

test('EV6 stale base: a remap draft is rejected after a concurrent revision and writes nothing', { timeout: 120000 }, async t => {
  const { P } = await evaluationFamily(t);
  await elternSeite(P.page, 'school');
  const payload = ev5RemapPayload(EV5_NONE_ROWS);
  await storeIntegrationAssessment(P.page, payload);
  await elternSeite(P.page, 'school');
  const form = P.page.locator('#pSchoolEvaluation');
  await form.locator('[data-eval-action="remap"]').click();
  await storeIntegrationAssessment(P.page, { ...payload, base: payload.revision, revision: '5b0f6f55-8f0a-4f3c-9d3e-2d1f4a5b6c7d', title: 'Invented concurrent' });
  await form.locator('button[type="submit"]').click();
  assert.match(await form.getByRole('alert').innerText(), /beim Abgleich geändert/);
  assert.equal((await evaluationEvents(P.page)).length, 2, 'stale remap writes no event');
  assert.deepEqual(P.errors, []);
});

/* ---- A2 corrections (invented data only) ---- */
async function addChild(parent, browser, allowed, name, login) {
  const family = parent.page.locator('details.psec[data-psec="family"]');
  await elternAnsichtOeffnen(parent.page, 'settings');
  if (!await family.evaluate(details => details.open)) await family.locator(':scope > summary').click();
  await parent.page.locator('#kKindAnlegen').click();
  await parent.page.locator('#kKindName').fill(name);
  await parent.page.locator('#kKindWeiter').click();
  await parent.page.locator('#kKindLogin').fill(login);
  await parent.page.locator('#kKindGo').click();
  await parent.page.locator('#kQr svg').waitFor();
  const code = (await parent.page.locator('#kCode').textContent()).trim();
  const pub = await parent.page.evaluate(() => new Promise((resolve, reject) => {
    const db = indexedDB.open('bq2_konto', 1); db.onerror = () => reject(db.error); db.onsuccess = () => {
      const req = db.result.transaction('schluessel').objectStore('schluessel').getAll(); req.onerror = () => reject(req.error);
      req.onsuccess = () => { db.result.close(); resolve(req.result[0].pub); };
    };
  }));
  const child = await device(browser, allowed);
  const url = new URL(parent.page.url()); url.hash = '';
  await child.page.goto(anmEinladungslink(url.href, { zugang: TOKEN, anmeldename: login, code, fingerabdruck: await keyFingerprint(pub) }));
  await register(child.page);
  await child.page.waitForSelector('#home:not([hidden])', { timeout: 60000 });
  await parent.page.waitForFunction(() => /ist angemeldet/.test(document.querySelector('#kQrStatus')?.textContent || ''), null, { timeout: 30000 });
  await parent.page.locator('#kQrFertig').click();
  await elternSeite(parent.page, 'school');
  return child;
}

async function secondParent(family) {
  const { P, browser, allowed, access, admin } = family;
  const login = 'nora.waldweg';
  const start = await startcodeAusstellen({ zugang: access, aussteller: admin, anmeldename: login, art: 'parent', now: Date.now() });
  const Q = await device(browser, allowed);
  const url = new URL(P.page.url()); url.hash = '';
  await Q.page.goto(anmEinladungslink(url.href, { zugang: TOKEN, anmeldename: login, code: start.code, fingerabdruck: start.fingerabdruck }));
  await register(Q.page);
  await Q.page.locator('#recGo').click();
  await Q.page.locator('#welcomeGo').click();
  await Q.page.locator('#parentClose').waitFor();
  return Q;
}

const A2_CRIT = 'Rounds whole numbers to 9999 to the nearest 10, 100 and 1000';
test('EV5 source: a present unsafe per-criterion binding is none, not known or native; unbound rows keep known', { timeout: 120000 }, async t => {
  const { P } = await evaluationFamily(t);
  await elternSeite(P.page, 'school');
  const names = [A2_CRIT, 'Invented: unbound known phrase', 'Invented: unknown binding row', 'Invented: mixed binding row'];
  const stored = ev5RemapPayload(names.map(criterion => ({ criterion, rating: 'M', evidence: 'Invented evidence', standard: 'E-S1' })));
  stored.assessment.area = 'english';
  await storeIntegrationAssessment(P.page, stored);
  await elternSeite(P.page, 'school');
  const source = ['Standards', A2_CRIT + ' -> M-N1; M-N3', 'M-N4', names[2] + ' -> Z-INVALID', names[3] + ' -> M-N3; Z-INVALID'].join('\n');
  const native = { title: 'Invented native source', date: ev5Today(), goal: 'Invented goal', instructions: 'Invented instructions', feedback: 'Invented feedback',
    criteria: names.map(criterion => ({ criterion, rating: 'C', evidence: 'Invented evidence', standard: 'M-N6' })), missing: [] };
  await P.page.evaluate(result => { window.webkit = { messageHandlers: { bigQuestEvaluation: { postMessage: async () => result } } }; }, native);
  const opened = await P.page.evaluate(text => {
    const form = window.bigQuestEvaluationForm, context = form.context();
    if (!context) throw Error('Expected the actual native capture context');
    return form.source(context, 'invented-transfer', text);
  }, source);
  assert.equal(opened, 'opened');
  await P.page.locator('[data-eval-action="ai"]').click();
  await P.page.waitForFunction(() => window.__evaluationIntegration.draft()?.extracted === true);
  const expected = ['none', 'E-S1', 'none', 'none'];
  assert.deepEqual(await P.page.evaluate(() => window.__evaluationIntegration.draft().assessment.criteria.map(c => c.standard)), expected, 'unsafe binding is none, not E-S1 or M-N6; unbound row keeps known');
  assert.deepEqual(await P.page.locator('#pSchoolEvaluation [data-doc-standard]').evaluateAll(s => s.map(x => x.value)), expected, 'selects show the same values');
  assert.equal((await evaluationEvents(P.page)).length, 1, 'only the seeded evaluation, nothing written by the transfer');
  assert.deepEqual(P.errors, []);
});

test('EV5 known: a foreign parent and own child cannot read or reuse the first family known phrase', { timeout: 180000 }, async t => {
  const family = await evaluationFamily(t);
  const { P } = family;
  const PHRASE = 'Invented: foreign family phrase zzz';
  await elternSeite(P.page, 'school');
  const first = await P.page.evaluate(() => window.__evaluationIntegration.schoolEvaluationTarget());
  await storeIntegrationAssessment(P.page, ev5RemapPayload([{ criterion: PHRASE, rating: 'M', evidence: 'Invented evidence', standard: 'E-S2' }]));
  await elternSeite(P.page, 'school');
  const formP = P.page.locator('#pSchoolEvaluation');
  await formP.locator('[data-eval-action="open"]').click();
  await formP.locator('[data-doc-criterion="0"]').fill(PHRASE);
  assert.equal(await formP.locator('[data-doc-standard="0"]').inputValue(), 'E-S2', 'positive control: the first family knows the phrase');
  await formP.locator('[data-eval-action="cancel"]').click();
  const firstContext = await P.page.evaluate(() => window.bigQuestEvaluationForm.context());
  assert.ok(firstContext, 'a first-family capture context exists');
  const Q = await secondParent(family);
  await addChild(Q, family.browser, family.allowed, 'Ida Waldweg', 'ida.waldweg');
  await Q.page.waitForFunction(name => {
    const app = window.__evaluationIntegration;
    return app.schoolSectionOpen() && app.schoolEvaluationTarget()?.name === name;
  }, 'Ida Waldweg');
  const own = await Q.page.evaluate(() => window.__evaluationIntegration.schoolEvaluationTarget());
  assert.notEqual(own.id, first.id, 'second family has its own child namespace');
  assert.notEqual(own.author, first.author, 'second family has its own parent');
  assert.deepEqual(await Q.page.evaluate(id => Object.keys(localStorage).filter(k => k.includes(id)), first.id), [], 'no first-family data on the second device');
  assert.equal(await Q.page.evaluate(ctx => window.bigQuestEvaluationForm.source(ctx, 'invented-foreign', 'Invented foreign source'), firstContext), 'invalid', 'foreign capture context is rejected');
  assert.equal(await Q.page.evaluate(() => window.__evaluationIntegration.draft()), null);
  assert.deepEqual(await evaluationEvents(Q.page), [], 'foreign submit writes nothing');
  assert.equal(await P.page.evaluate(ctx => window.bigQuestEvaluationForm.source(ctx, 'invented-transfer', 'Invented source'), firstContext), 'opened', 'control: the same token is valid in the first family');
  await P.page.locator('#pSchoolEvaluation [data-eval-action="cancel"]').click();
  const formQ = Q.page.locator('#pSchoolEvaluation');
  await formQ.locator('[data-eval-action="open"]').click();
  await formQ.locator('[data-doc-criterion="0"]').fill(PHRASE);
  assert.equal(await formQ.locator('[data-doc-standard="0"]').inputValue(), 'none', 'second family does not reuse the first family known pair');
  await fillDocument(formQ, 'Invented second family', 'english', [{ criterion: PHRASE, rating: 'M', standard: 'none' }]);
  await formQ.locator('button[type="submit"]').click();
  await formQ.locator('button[type="submit"]').click();
  const eventsQ = await evaluationEvents(Q.page);
  assert.equal(eventsQ.length, 1);
  assert.equal(eventsQ[0].payload.child, own.id);
  assert.notEqual(eventsQ[0].payload.child, first.id);
  const eventsP = await evaluationEvents(P.page);
  assert.equal(eventsP.length, 1, 'first family unchanged');
  assert.equal(eventsP[0].payload.child, first.id);
  assert.deepEqual(P.errors, []);
  assert.deepEqual(Q.errors, []);
});

test('EV6 child switch: notice and remap preview of the first child do not carry over to the second child', { timeout: 180000 }, async t => {
  const { P, browser, allowed } = await evaluationFamily(t);
  const other = await addChild(P, browser, allowed, 'Lina Sonnenweg', 'lina.sonnenweg');
  await P.page.locator('#pKidSel').selectOption(LOGIN);
  await elternSeite(P.page, 'school');
  const payload = ev5RemapPayload(EV5_NONE_ROWS);
  await storeIntegrationAssessment(P.page, payload);
  await elternSeite(P.page, 'school');
  const form = P.page.locator('#pSchoolEvaluation');
  assert.equal(await form.locator('[data-eval-remap]').count(), 1, 'positive control: notice for the first child');
  await form.locator('[data-eval-action="remap"]').click();
  assert.notEqual(await P.page.evaluate(() => window.__evaluationIntegration.draft()), null, 'remap preview is open');
  await P.page.locator('#pKidSel').selectOption('lina.sonnenweg');
  assert.equal(await P.page.evaluate(() => window.__evaluationIntegration.draft()), null, 'child switch discards the preview');
  await elternSeite(P.page, 'school');
  assert.equal(await P.page.locator('#pSchoolEvaluation [data-eval-remap]').count(), 0, 'no notice for the other child');
  assert.equal((await evaluationEvents(P.page)).length, 1, 'nothing written');
  await P.page.locator('#pKidSel').selectOption(LOGIN);
  await elternSeite(P.page, 'school');
  assert.equal(await P.page.locator('#pSchoolEvaluation [data-eval-remap]').count(), 1, 'notice is computed again on read for the first child');
  assert.equal(await P.page.evaluate(() => window.__evaluationIntegration.draft()), null);
  assert.equal((await evaluationEvents(P.page)).length, 1);
  assert.deepEqual(P.errors, []);
  assert.deepEqual(other.errors, []);
});

/* ---- EV6.2 teacher read-only acceptance (invented data only; credentials generated in memory) ---- */
const grantEvents = (page) => page.evaluate(() => Object.keys(localStorage).filter((key) => /^bq2_p_[A-Za-z0-9]+__events$/.test(key))
  .flatMap((key) => JSON.parse(localStorage.getItem(key))).filter((event) => event.type === 'grant_set'));

test('EV6.2 teacher: a granted teacher on the same browser sees the evaluation read-only without remap or form', { timeout: 300000 }, async t => {
  const family = await evaluationFamily(t);
  const { P, access, admin, parentPassword } = family;
  const PARENT = 'mira.sonnenweg', TEACHER = 'tina.lehrkraft';
  const payload = ev5RemapPayload(EV5_NONE_ROWS);
  // Actual admin start code -> actual first teacher registration in the same browser (the parent key stays in the account folder).
  const start = await startcodeAusstellen({ zugang: access, aussteller: admin, anmeldename: TEACHER, art: 'teacher', now: Date.now() });
  const url = new URL(P.page.url()); url.hash = '';
  await P.page.goto('about:blank');
  await P.page.goto(anmEinladungslink(url.href, { zugang: TOKEN, anmeldename: TEACHER, code: start.code, fingerabdruck: start.fingerabdruck }));
  const teacherPassword = await register(P.page);
  await P.page.locator('#recGo').click();
  await P.page.locator('#welcomeGo').click();
  await P.page.waitForFunction(name => window.__evaluationIntegration?.adult()?.user === name, TEACHER, { timeout: 60000 });
  // Actual parent authenticates again (no parentAbmelden: the parent key must stay open in this account folder).
  assert.equal(await P.page.evaluate(([name, password]) => window.__evaluationIntegration.loginAs(name, password), [PARENT, parentPassword]), PARENT);
  await P.page.waitForSelector('#aboutBody details.psec[data-psec="school"]', { timeout: 60000 });
  await elternSeite(P.page, 'school');
  await P.page.waitForFunction(name => {
    const app = window.__evaluationIntegration;
    return app.schoolSectionOpen() && app.schoolEvaluationTarget()?.name === name;
  }, CHILD, { timeout: 60000 });
  await storeIntegrationAssessment(P.page, payload);
  await elternSeite(P.page, 'grants');
  const grant = P.page.locator('#pGrantForm');
  await grant.locator('#pGrantWho').fill(TEACHER);
  await grant.locator('#pGrantSchool').check();
  await grant.locator('button[type="submit"]').click();
  await P.page.locator('ul.pgrants li').filter({ hasText: TEACHER }).waitFor();
  const grants = await grantEvents(P.page);
  assert.equal(grants.length, 1, 'one real grant_set event');
  assert.ok(grants[0].payload.scope.includes('school'), 'the real grant includes school ratings');
  // Decisive positive control (parent): calm remap notice; hold a stale remap preview and a native capture token.
  await elternSeite(P.page, 'school');
  const formP = P.page.locator('#pSchoolEvaluation');
  assert.match(await formP.locator('[data-eval-remap]').innerText(), /Neue Zuordnungen möglich/);
  const parentContext = await P.page.evaluate(() => window.bigQuestEvaluationForm.context());
  assert.ok(parentContext, 'parent has a native capture context');
  await formP.locator('[data-eval-action="remap"]').click();
  assert.notEqual(await P.page.evaluate(() => window.__evaluationIntegration.draft()), null, 'parent holds a remap preview');
  const held = await P.page.locator('#pSchoolEvaluation').elementHandle();
  assert.equal((await evaluationEvents(P.page)).length, 1, 'only the seeded evaluation before the teacher');
  // Actual teacher authenticates again; the parent key stays open in the same account folder.
  assert.equal(await P.page.evaluate(([name, password]) => window.__evaluationIntegration.loginAs(name, password), [TEACHER, teacherPassword]), TEACHER);
  assert.deepEqual(await P.page.evaluate(() => window.__evaluationIntegration.adult()), { user: TEACHER, role: 'teacher' });
  await P.page.waitForSelector('#aboutBody details.psec[data-psec="school"]', { timeout: 60000 });
  await elternSeite(P.page, 'school');
  await P.page.waitForFunction(login => {
    const app = window.__evaluationIntegration;
    return app.schoolSectionOpen() && app.viewedKid() === login && app.viewerGrant()?.scope.includes('school');
  }, LOGIN, { timeout: 60000 });
  // Positive control (teacher): the same evaluation title and criteria are visible.
  const details = await showDetails(P.page, payload.title);
  const visible = await details.innerText();
  for (const row of EV5_NONE_ROWS) assert.ok(visible.includes(row.criterion), 'teacher sees the evaluation criterion');
  // Read-only: no remap notice, no remap/confirm/open controls, no form.
  assert.equal(await P.page.locator('[data-eval-remap], [data-eval-action], #pSchoolEvaluation').count(), 0);
  assert.equal(await P.page.getByRole('button', { name: /Korrektur bestätigen|Zuordnungen prüfen|Evaluation hinzufügen/ }).count(), 0);
  // Native account switch keeps the target guards.
  assert.equal(await P.page.evaluate(() => window.bigQuestEvaluationForm.context()), null);
  assert.equal(await P.page.evaluate(ctx => window.bigQuestEvaluationForm.source(ctx, 'invented-teacher', 'Invented source'), parentContext), 'invalid');
  // Stale parent form (detached node, listeners still bound) is submitted as the teacher.
  await held.evaluate(box => box.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await held.dispose();
  assert.equal((await evaluationEvents(P.page)).length, 1, 'stale submit writes no additional school_evaluation event');
  assert.deepEqual(P.errors, []);
});

/* EV5.4 native full-app journey. Native handler is an explicitly synthetic mock; no provider, no credential. */
const NATIVE_SOURCE = NATIVE_DOCUMENT.criteria.map(c => c.evidence).join('\n');
async function installNativeMock(page, response, { label = true } = {}) {
  await page.evaluate(({ response, source, label }) => {
    window.__nativeRequests = [];
    if (label) Object.defineProperty(window, 'bigQuestNativeImport', { configurable: true, value: Object.freeze({ label: Object.freeze({ de: 'Aus Toddle', en: 'From Toddle' }) }) });
    window.webkit = { messageHandlers: { bigQuestEvaluation: { postMessage: async request => {
      window.__nativeRequests.push(JSON.parse(JSON.stringify(request)));
      if (request.action === 'catalog') return 'ok';
      if (request.action === 'import') {
        const form = window.bigQuestEvaluationForm, context = form.context();
        if (!context) throw new Error('No open new form');
        const result = form.source(context, 'invented-transfer-toddle', source);
        if (result !== 'opened') throw new Error(result);
        return 'opened';
      }
      return response;
    } } } };
  }, { response, source: NATIVE_SOURCE, label });
}

test('EV5.4 plain browser: same manual form and no Toddle control', { timeout: 120000 }, async t => {
  const { P } = await evaluationFamily(t);
  await elternSeite(P.page, 'school');
  const form = P.page.locator('#pSchoolEvaluation');
  await form.locator('[data-eval-action="open"]').click();
  await form.locator('[name="title"]').waitFor({ state: 'visible' });
  assert.equal(await form.locator('[data-eval-action="import"]').count(), 0);
  assert.equal(await form.locator('[data-eval-action="ai"]').count(), 0);
  assert.equal(await P.page.evaluate(() => typeof window.webkit), 'undefined');
  assert.equal(await P.page.evaluate(() => typeof window.bigQuestNativeImport), 'undefined', 'the generic browser has no native import capability');
  assert.deepEqual(await evaluationEvents(P.page), []);
  assert.deepEqual(P.errors, []);
});

test('EV5.4 native journey: from the open new form, one full catalog, same draft, writes only after confirmation', { timeout: 120000 }, async t => {
  const { P } = await evaluationFamily(t);
  await elternSeite(P.page, 'school');
  await installNativeMock(P.page, { ...NATIVE_DOCUMENT, criteria: NATIVE_DOCUMENT.criteria.map((c, i) => ({ ...c, standard: i ? 'E-S1' : 'M-N1' })) });
  const form = P.page.locator('#pSchoolEvaluation');
  await form.locator('[data-eval-action="open"]').click();
  await form.locator('[name="title"]').fill('Invented manual start');
  assert.match(await form.locator('[data-eval-action="import"]').innerText(), /^(Aus Toddle|From Toddle)$/, 'label supplied by the native capability');
  await form.locator('[data-eval-action="import"]').click();
  await form.locator('[name="source"]').waitFor({ state: 'visible' });
  assert.equal(await form.locator('[name="source"]').inputValue(), NATIVE_SOURCE);
  assert.equal(await form.locator('[name="title"]').inputValue(), 'Invented manual start', 'the captured source enters the same draft');
  assert.deepEqual(await evaluationEvents(P.page), []);
  await form.locator('[data-eval-action="ai"]').click();
  await P.page.waitForFunction(() => document.querySelector('[name="title"]')?.value === 'Invented native evaluation');
  const requests = await P.page.evaluate(() => window.__nativeRequests);
  assert.deepEqual(requests.map(r => r.action || 'source'), ['import', 'catalog', 'source']);
  assert.deepEqual(Object.keys(requests[0]), ['action']);
  assert.deepEqual(Object.keys(requests[1]).sort(), ['action', 'catalog']);
  assert.deepEqual(Object.keys(requests[2]), ['source']);
  const catalog = requests[1].catalog, codes = catalog.map(e => e.code);
  assert.equal(new Set(codes).size, codes.length);
  assert.ok(catalog.every(e => JSON.stringify(Object.keys(e).sort()) === JSON.stringify(['code', 'de', 'en', 'quest', 'subject']) && typeof e.quest === 'boolean'));
  assert.equal(catalog.find(e => e.code === 'E-S1')?.quest, false, 'a no-quest standard is part of the single catalog');
  const optionValues = await form.locator('[data-doc-standard="0"] option').evaluateAll(o => o.map(x => x.value));
  assert.deepEqual([...optionValues].sort(), ['none', ...codes].sort(), 'the form offers exactly the catalog that was sent');
  await form.locator('[name="doc-area"]').selectOption('maths');
  await form.locator('[data-doc-standard="0"]').selectOption('M-N1');
  await form.locator('[data-doc-standard="1"]').selectOption('M-N3');
  await form.locator('button[type="submit"]').click();
  assert.deepEqual(await evaluationEvents(P.page), [], 'preview writes nothing');
  await form.locator('button[type="submit"]').click();
  const events = await evaluationEvents(P.page);
  assert.equal(events.length, 1);
  const original = ({ criterion, rating, evidence }) => ({ criterion, rating, evidence });
  assert.deepEqual(events[0].payload.assessment.criteria.map(original), NATIVE_DOCUMENT.criteria.map(original), 'source grades and evidence stay original');
  assert.deepEqual(events[0].payload.assessment.criteria.map(c => c.standard), ['M-N1', 'M-N3'], 'the parent’s explicit choice is stored');
  const stored = await P.page.evaluate(() => JSON.stringify({ l: Object.entries(localStorage), s: Object.entries(sessionStorage) }));
  assert.doesNotMatch(stored, /api.?key|authorization|anthropic/i);
  assert.doesNotMatch(JSON.stringify(requests), /api.?key|authorization|anthropic|secret/i);
  assert.deepEqual(await P.page.evaluate(() => Object.keys(window.bigQuestEvaluationForm)), ['context', 'source']);
  assert.deepEqual(P.errors, []);
});

test('EV5.4 native: an invalid returned standard is rejected, never silently dropped', { timeout: 120000 }, async t => {
  const { P } = await evaluationFamily(t);
  await elternSeite(P.page, 'school');
  const form = P.page.locator('#pSchoolEvaluation');
  await installNativeMock(P.page, NATIVE_DOCUMENT);
  await form.locator('[data-eval-action="open"]').click();
  await form.locator('[data-eval-action="import"]').click();
  await form.locator('[name="source"]').waitFor({ state: 'visible' });
  for (const bad of ['Z-NOT-IN-CATALOG', '', 7, null]) {
    await installNativeMock(P.page, { ...NATIVE_DOCUMENT, criteria: NATIVE_DOCUMENT.criteria.map((c, i) => i ? c : { ...c, standard: bad }) });
    await form.locator('[data-eval-action="ai"]').click();
    await P.page.waitForFunction(() => /Ungültiger KI-Entwurf|Invalid AI draft/.test(document.querySelector('#pSchoolEvaluation [role="alert"]')?.textContent || ''));
    assert.equal(await form.locator('[name="title"]').inputValue(), '', 'nothing from the rejected answer is applied');
    assert.equal(await form.locator('[data-eval-action="ai"]').isDisabled(), false);
    assert.deepEqual(await evaluationEvents(P.page), []);
  }
  assert.deepEqual(P.errors, []);
});

test('EV5.4 native guards: old, canceled, busy and logged-out contexts cannot fill or write', { timeout: 120000 }, async t => {
  const { P } = await evaluationFamily(t);
  await elternSeite(P.page, 'school');
  await installNativeMock(P.page, NATIVE_DOCUMENT);
  const form = P.page.locator('#pSchoolEvaluation');
  await form.locator('[data-eval-action="open"]').click();
  const first = await P.page.evaluate(source => {
    const f = window.bigQuestEvaluationForm, a = f.context(), wrong = f.source('wrong-context', 'invented-transfer', source), b = f.context();
    return { a: typeof a, b: typeof b, wrong, stale: f.source(a, 'invented-transfer', source) };
  }, NATIVE_SOURCE);
  assert.deepEqual(first, { a: 'string', b: 'string', wrong: 'invalid', stale: 'invalid' }, 'an older context is replaced');
  const canceled = await P.page.evaluate(() => window.bigQuestEvaluationForm.context());
  await form.locator('[data-eval-action="cancel"]').click();
  assert.equal(await P.page.evaluate(({ c, s }) => window.bigQuestEvaluationForm.source(c, 'invented-transfer', s), { c: canceled, s: NATIVE_SOURCE }), 'invalid', 'canceled capture');
  await form.locator('[data-eval-action="open"]').click();
  assert.equal(await P.page.evaluate(({ c, s }) => window.bigQuestEvaluationForm.source(c, 'invented-transfer', s), { c: canceled, s: NATIVE_SOURCE }), 'invalid', 'a new draft is not the captured draft');
  const accepted = await P.page.evaluate(source => {
    const f = window.bigQuestEvaluationForm, c = f.context();
    return { once: f.source(c, 'invented-transfer', source), again: f.source(c, 'invented-transfer', source) };
  }, NATIVE_SOURCE);
  assert.deepEqual(accepted, { once: 'opened', again: 'invalid' }, 'a transfer is consumed once');
  assert.equal(await form.locator('[name="source"]').inputValue(), NATIVE_SOURCE);
  const busyContext = await P.page.evaluate(() => window.bigQuestEvaluationForm.context());
  await P.page.evaluate(() => { window.webkit.messageHandlers.bigQuestEvaluation.postMessage = async r => r.action === 'catalog' ? 'ok' : new Promise(() => {}); });
  await form.locator('[data-eval-action="ai"]').click();
  await P.page.waitForFunction(() => document.querySelector('[data-eval-action="ai"]')?.disabled);
  assert.equal(await P.page.evaluate(() => window.bigQuestEvaluationForm.context()), null, 'no capture while Claude is busy');
  assert.equal(await P.page.evaluate(({ c, s }) => window.bigQuestEvaluationForm.source(c, 'invented-transfer', s), { c: busyContext, s: NATIVE_SOURCE }), 'invalid');
  await P.page.locator('#parentClose').click();
  assert.equal(await P.page.evaluate(() => window.bigQuestEvaluationForm.context()), null, 'logged out / child context gone');
  assert.equal(await P.page.evaluate(({ c, s }) => window.bigQuestEvaluationForm.source(c, 'invented-transfer', s), { c: busyContext, s: NATIVE_SOURCE }), 'invalid');
  assert.deepEqual(await evaluationEvents(P.page), []);
  assert.deepEqual(P.errors, []);
});

test('EV5.4 native label: the import button text comes from the runtime native capability, in both languages', { timeout: 120000 }, async t => {
  const { P } = await evaluationFamily(t);
  await elternSeite(P.page, 'school');
  const form = P.page.locator('#pSchoolEvaluation');
  await installNativeMock(P.page, NATIVE_DOCUMENT, { label: false });
  await form.locator('[data-eval-action="open"]').click();
  await form.locator('[name="title"]').waitFor({ state: 'visible' });
  assert.equal(await form.locator('[data-eval-action="import"]').count(), 0, 'a bridge without the label capability shows no import control');
  for (const bad of [null, 7, {}, { de: '', en: '' }, { de: 'x'.repeat(41), en: 'x'.repeat(41) }, { de: 7, en: 7 }]) {
    await P.page.evaluate(label => Object.defineProperty(window, 'bigQuestNativeImport', { configurable: true, value: { label } }), bad);
    await P.page.locator('.phdr [data-plang="de"]').click();
    assert.equal(await form.locator('[data-eval-action="import"]').count(), 0, 'an invalid label shows no control: ' + JSON.stringify(bad));
  }
  await P.page.evaluate(() => Object.defineProperty(window, 'bigQuestNativeImport', { configurable: true, value: { label: { de: 'Invented <b>runtime</b> label', en: 'Invented runtime label' } } }));
  await P.page.locator('.phdr [data-plang="en"]').click();
  assert.equal(await form.locator('[data-eval-action="import"]').innerText(), 'Invented runtime label', 'the wording is exactly the runtime value');
  await P.page.locator('.phdr [data-plang="de"]').click();
  assert.equal(await form.locator('[data-eval-action="import"] b').count(), 0, 'the label is text, not markup');
  await installNativeMock(P.page, NATIVE_DOCUMENT);
  for (const [lang, text] of [['de', 'Aus Toddle'], ['en', 'From Toddle']]) {
    await P.page.locator(`.phdr [data-plang="${lang}"]`).click();
    assert.equal(await form.locator('[data-eval-action="import"]').innerText(), text);
  }
  await form.locator('[data-eval-action="import"]').click();
  await form.locator('[name="source"]').waitFor({ state: 'visible' });
  assert.equal(await form.locator('[name="source"]').inputValue(), NATIVE_SOURCE, 'same actual capture and source into the existing form');
  assert.deepEqual((await P.page.evaluate(() => window.__nativeRequests)).map(r => r.action), ['import']);
  assert.deepEqual(await evaluationEvents(P.page), []);
  assert.deepEqual(P.errors, []);
});
