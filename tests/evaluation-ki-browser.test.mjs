// Local browser acceptance of the parent KI draft and the existing child practice flow.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { browserStarten, elternSeite } from './app-hilfen.mjs';
import { startSchoolAI } from '../spikes/schulbewertung-ki/server.mjs';
import { anmEinladungslink } from '../src/module/anmeldung.mjs';
import { keyFingerprint } from '../src/module/krypto.mjs';
import { createSchoolAiServer } from '../services/school-ai/server.mjs';

const CHILD = 'Tessa Sonnenweg';
const LOGIN = 'tessa.sonnenweg';

async function register(page) {
  await page.locator('#kontoNeuUse').click();
  await page.locator('#kontoNeuGo').click();
}

async function device(browser) {
  const context = await browser.newContext({ timezoneId: 'UTC' });
  await context.route('**/*', (route) => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
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

for (const hosted of [false, true]) test(`KI preview reaches the child practice round (${hosted ? 'hosted service' : 'local development'})`, { timeout: 180000 }, async (t) => {
  const fixture = new URL('../spikes/schulbewertung-ki/bis-referenz.json', import.meta.url);
  const source = JSON.parse(await readFile(fixture, 'utf8'));
  const matcherCalls = [];
  const match = async (rows) => {
    matcherCalls.push(rows);
    if (matcherCalls.length === 1) throw new Error('simulated model failure');
    return { matches: [{ row: 2, standard: 'M-N3' }, { row: 4, standard: 'M-N5' }] };
  };
  const aiOrigin = 'https://school-ai.invalid';
  const server = await startSchoolAI({ source, match, previewService: hosted ? aiOrigin : undefined });
  t.after(() => server.close());
  const browser = await browserStarten();
  t.after(() => browser.close());
  const P = await device(browser);
  const K = await device(browser);

  const appOrigin = server.origin;
  await P.page.goto(server.invitation.replace(server.origin, appOrigin));
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
  const { pub, account } = await P.page.evaluate(async () => {
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
    return { pub: entries[0].pub, account: entries[0].kennung };
    function assertSingleKey(keys) {
      if (keys.length !== 1) throw new Error('Expected one key on the parent-only device');
    }
  });
  if (hosted) {
    const service = createSchoolAiServer({ origin: appOrigin, parents: { [account]: pub.ecdsa }, match, testLoopback: true });
    await new Promise(resolve => service.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise(resolve => service.close(resolve)));
    await P.page.route(aiOrigin + '/v1/school-assessment', async route => {
      const request = route.request();
      const response = await fetch('http://127.0.0.1:' + service.address().port + '/v1/school-assessment', {
        method: request.method(), headers: await request.allHeaders(), body: request.postData() ?? undefined,
      });
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
    });
  }
  const zugang = new URLSearchParams(new URL(server.invitation).hash.slice(1)).get('zugang');
  await K.page.goto(anmEinladungslink(appOrigin + '/', { zugang, anmeldename: LOGIN, code, fingerabdruck: await keyFingerprint(pub) }));
  await register(K.page);
  await K.page.locator('#welcomeGo').click({ timeout: 60000 });
  await K.page.waitForSelector('#home:not([hidden])');
  await P.page.waitForFunction(() => /ist angemeldet/.test(document.querySelector('#kQrStatus')?.textContent || ''), null, { timeout: 30000 });
  await P.page.locator('#kQrFertig').click();

  await elternSeite(P.page, 'school');
  const form = P.page.locator('#pSchoolEvaluation');
  const open = form.getByRole('button', { name: 'Auszug mit KI prüfen' });
  const analyze = form.getByRole('button', { name: 'KI-Zuordnung anzeigen' });
  await open.click();
  const input = form.locator('textarea[name="schoolSource"]');
  const inputText = hosted ? source.rows.map(r => r.criterion + '\t' + r.teacherRating).join('\n') : await input.inputValue();
  const fillSource = async () => {
    if (!hosted) return;
    await form.getByLabel('Titel').fill(source.title);
    await form.getByLabel('Bewertungsdatum').fill(source.day);
    await input.fill(inputText);
  };
  if (!hosted) assert.deepEqual(JSON.parse(inputText), source, 'the prepared source is available without retyping');
  await fillSource();
  await analyze.click();
  await form.getByRole('alert').waitFor();
  assert.equal(await input.inputValue(), inputText, 'recoverable endpoint failure preserves input');
  assert.deepEqual(await evaluationEvents(P.page), []);

  await analyze.click();
  const table = form.getByRole('table');
  await table.waitFor();
  const previewText = await form.innerText();
  assert.ok(previewText.includes(CHILD));
  assert.ok(previewText.includes(source.title));
  assert.equal(await table.getByRole('row').count(), 7, 'heading plus all six source rows');
  for (const { criterion } of source.rows) {
    assert.equal(await table.getByText(criterion, { exact: true }).count(), 1, criterion);
  }
  for (const [i, rating] of [[2, 'Sicher'], [4, 'Wird sicherer']]) {
    const row = table.getByRole('row').filter({ hasText: source.rows[i].criterion });
    assert.ok(await row.getByText(rating, { exact: true }).isVisible());
  }
  assert.equal(await table.locator('input[name="schoolRow"]').count(), 2, 'only the two supported rows can be selected');
  await form.getByRole('button', { name: 'Abbrechen', exact: true }).click();
  assert.deepEqual(await evaluationEvents(P.page), [], 'cancelled preview writes no school evaluation');
  assert.deepEqual(await evaluationEvents(K.page), []);

  await open.click();
  await fillSource();
  await analyze.click();
  await table.waitFor();
  await table.locator('input[name="schoolRow"][value="2"]').check();
  assert.ok(await form.getByText('Ohne zusätzlichen Übungsfokus', { exact: true }).isVisible());
  await table.locator('input[name="schoolRow"][value="4"]').check();
  assert.deepEqual(await evaluationEvents(P.page), [], 'selecting an assignment still writes nothing');
  assert.deepEqual(await evaluationEvents(K.page), []);
  const confirm = form.getByRole('button', { name: 'Übernehmen', exact: true });
  await confirm.evaluate((button) => {
    button.click();
    button.click();
  });
  const written = await evaluationEvents(P.page);
  assert.equal(written.length, 1, 'two quick confirmation clicks create one event');
  const { revision, standard, rating, focus, title } = written[0].payload;
  assert.deepEqual({ standard, rating, focus, title }, {
    standard: 'M-N5', rating: 'C', focus: 'two-step', title: source.title,
  });
  const modelInput = source.rows.map(({ criterion }, row) => ({ row, criterion }));
  assert.deepEqual(matcherCalls, [modelInput, modelInput, modelInput],
    'the model receives criterion text and source positions only');

  await waitForRevision(K.page, revision);
  assert.deepEqual((await evaluationEvents(K.page)).map(({ payload }) => payload.revision), [revision]);
  assert.equal(await K.page.locator('#pSchoolEvaluation').count(), 0);
  await checkRoundRevisions(K.page, [revision], new Map([[revision, solveSubtraction]]));
  assert.deepEqual(P.errors, []);
  assert.deepEqual(K.errors, []);
  t.diagnostic('Checked six criteria, provider error/retry, cancel, rounding without focus, double confirmation and an attributed subtraction task after sync. Only the model function was stubbed.');
});
