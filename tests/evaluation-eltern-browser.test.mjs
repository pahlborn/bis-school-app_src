// M-N5 and M-N3 through the parent and child views, using the local GitHub protocol test server.
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

test('M-N5/C and M-N3/C: child syncs both confirmed evaluations and solves both types in the same round', { timeout: 180000 }, async (t) => {
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
  await form.getByRole('button', { name: 'Evaluation hinzufügen' }).click();
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
  assert.equal(await K.page.locator('#pSchoolEvaluation').count(), 0);
  const subtractionTarget = { label: /Word Problems/i, solve: solveSubtraction };
  const first = (await solveTargets(K.page, new Map([[revision, subtractionTarget]]))).get(revision);

  const roundingTitle = 'Runden mit Abstandsbegründung';
  await form.getByRole('button', { name: 'Evaluation hinzufügen' }).click();
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
  assert.deepEqual(P.errors, []);
  assert.deepEqual(K.errors, []);
});
