// Run with node --test tests/evaluation-upgrade-browser.test.mjs in a clone containing the pinned baseline.
// For an exported checkout, BQ_LEGACY_HTML may point to the exact compiled baseline checked below.
import { test } from 'node:test';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { browserStarten, elternSeite } from './app-hilfen.mjs';
import http from 'node:http';
import { appLesen } from '../werkzeug/module.mjs';
import { githubNachbau } from './module/github-nachbau.mjs';
import { githubSpeicher } from '../src/module/github.mjs';
import { startcodeAusstellen, ersteAnmeldung } from '../src/module/konto.mjs';
import { anmEinladungslink } from '../src/module/anmeldung.mjs';
import { keyFingerprint } from '../src/module/krypto.mjs';

const LEGACY_COMMIT = 'eb354e31b56db564b35bf7310f4c6889f93766ae';
const SOURCE = fileURLToPath(new URL('..', import.meta.url));
async function loadHistoricalApp(t) {
  if (process.env.BQ_LEGACY_HTML) return readFile(process.env.BQ_LEGACY_HTML, 'utf8');
  const directory = await mkdtemp(join(tmpdir(), 'bq-upgrade-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const git = args => execFileSync('git', args, { cwd: SOURCE });
  const paths = git(['ls-tree', '-r', '--name-only', LEGACY_COMMIT, '--', 'index.html', 'src/module'])
    .toString('utf8').trim().split('\n');
  for (const path of paths) {
    const destination = join(directory, path);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, git(['show', LEGACY_COMMIT + ':' + path]));
  }
  return appLesen('utf8', { wurzel: directory, bauart: 'test' });
}

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

test('upgrade recovers an assessment rejected by the exact legacy app without resetting the child profile', { timeout: 300000 }, async (t) => {
  const storage = await githubNachbau({ token: TOKEN, repos: [REPO] });
  t.after(() => storage.schliessen());
  const access = githubSpeicher({ repo: REPO, token: TOKEN, basis: storage.basis }).geraet('d_Werkzeug1');
  const adminCode = await startcodeAusstellen({ zugang: access, aussteller: null, anmeldename: 'admin', art: 'admin', now: Date.now() });
  const admin = await ersteAnmeldung({ zugang: access, code: adminCode.code, passwort: 'Werkzeug-Admin-Passwort-1', now: Date.now() });
  const parentCode = await startcodeAusstellen({ zugang: access, aussteller: admin, anmeldename: 'mira.sonnenweg', art: 'parent', now: Date.now() });
  const config = JSON.stringify({ art: 'github', repo: REPO, wurzel: '', basis: storage.basis });
  const previousHTML = await loadHistoricalApp(t);
  const legacySha = createHash('sha256').update(previousHTML).digest('hex');
  assert.equal(legacySha, 'acc34783f4c8ffb868f8a08484e3ab6395988806cc148f8919bf4d580982011e');
  assert.equal(previousHTML.split('/*BQ_SPEICHER*/null').length, 2);
  assert.ok(!previousHTML.includes('school_evaluation'));
  const historical = previousHTML.replace('/*BQ_SPEICHER*/null', () => config);
  // This upgrade regression deliberately seeds the historical single-standard format.
  const current = appLesen('utf8', { bauart: 'test' }).replace('/*BQ_SPEICHER*/null', () => config).replace(/\}\)\(\);\s*<\/script>/, 'window.__legacyEvaluationDraft=()=>{const t=schoolEvaluationTarget();schoolEvaluationDraft={child:t.id,author:t.author,title:"",day:"",standard:"",rating:"",evaluation:crypto.randomUUID(),revision:crypto.randomUUID(),preview:false,focus:false};renderSheets();};})();</script>');
  const server = http.createServer((req, res) => {
    const path = new URL(req.url, 'http://127.0.0.1').pathname;
    if (path !== '/' && path !== '/historisch') { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store',
      ...(path === '/historisch' ? { 'x-bq-qa-source': 'eb354e31' } : {}) });
    res.end(path === '/historisch' ? historical : current);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  server.url = 'http://127.0.0.1:' + server.address().port + '/';
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
  await K.page.waitForSelector('#home:not([hidden])', { timeout: 60000 });
  await P.page.waitForFunction(() => /ist angemeldet/.test(document.querySelector('#kQrStatus')?.textContent || ''), null, { timeout: 30000 });
  await P.page.locator('#kQrFertig').click();

  const accountState = (page) => page.evaluate(() => {
    const session = JSON.parse(localStorage.getItem('bq2_session'));
    return { session, device: JSON.parse(localStorage.getItem('bq2_evDevice')) };
  });
  const identity = await accountState(K.page);
  assert.equal(identity.session.user, LOGIN);
  assert.ok(identity.session.id && identity.device);
  const area = 'schule:' + identity.session.id;
  await K.page.waitForFunction((a) => JSON.parse(localStorage.getItem('bq_abgleich') || '{}')[a]?.merker?.schuleLesestand === 2, area, { timeout: 65000 });
  const oldResponse = await K.page.goto(server.url + 'historisch');
  assert.equal(oldResponse.headers()['x-bq-qa-source'], 'eb354e31');
  await K.page.waitForSelector('#home:not([hidden])');
  assert.deepEqual(await accountState(K.page), identity);

  const schoolState = (page) => page.evaluate((a) => JSON.parse(localStorage.getItem('bq_abgleich') || '{}')[a], area);
  await K.page.waitForFunction((a) => {
    const marker = JSON.parse(localStorage.getItem('bq_abgleich') || '{}')[a]?.merker;
    return marker && !Object.hasOwn(marker, 'schuleLesestand');
  }, area, { timeout: 65000 });
  const before = await schoolState(K.page);
  assert.ok(before.merker && !Object.hasOwn(before.merker, 'schuleLesestand'));

  await elternSeite(P.page, 'school');
  const form = P.page.locator('#pSchoolEvaluation');
  await P.page.evaluate(()=>window.__legacyEvaluationDraft());
  await form.getByLabel('Titel').fill(TITLE);
  await form.getByLabel('Evaluation-Datum').fill(await P.page.evaluate(() => new Date().toISOString().slice(0, 10)));
  await form.getByLabel('Kriterium').selectOption('M-N5');
  await form.getByLabel('Einstufung').selectOption('C');
  await form.getByRole('button', { name: 'Vorschau anzeigen' }).click();
  assert.deepEqual(await evaluationEvents(P.page), []);
  await form.getByRole('button', { name: 'Evaluation bestätigen' }).click();
  await P.page.getByRole('row').filter({ hasText: TITLE }).waitFor();
  const written = await evaluationEvents(P.page);
  assert.equal(written.length, 1);
  const { id, payload: { revision }, device: writer } = written[0];

  const rejected = await K.page.waitForFunction(({ area, id, writer }) => {
    const list = JSON.parse(localStorage.getItem('bq_abgleichVerworfen') || '[]');
    const drop = list.find((r) => r.id === id && r.bereich === area && r.typ === 'school_evaluation' && r.grund === 'format');
    if (!drop) return false;
    const marker = JSON.parse(localStorage.getItem('bq_abgleich') || '{}')[area]?.merker;
    const bundleNumber = Number(drop.kennung.split('/')[1]);
    return marker?.stand?.[writer] >= bundleNumber ? { drop, marker, bundleNumber } : false;
  }, { area, id, writer }, { timeout: 95000 });
  const legacyEvidence = await rejected.jsonValue();
  assert.ok(legacyEvidence.bundleNumber > (before.merker.stand[writer] || 0));
  assert.ok(!Object.hasOwn(legacyEvidence.marker, 'schuleLesestand'));
  assert.deepEqual(await evaluationEvents(K.page), []);
  assert.deepEqual(await accountState(K.page), identity);

  // Same browser context, origin, IDB and app session. Only the HTML response changes.
  const upgradedResponse = await K.page.goto(server.url);
  assert.ok(!upgradedResponse.headers()['x-bq-qa-source']);
  await K.page.waitForSelector('#home:not([hidden])');
  await K.page.waitForFunction(({ area, id }) => {
    const school = JSON.parse(localStorage.getItem('bq_abgleich') || '{}')[area];
    return school?.merker?.schuleLesestand === 2 && school.log.some(({ event }) => event.id === id);
  }, { area, id }, { timeout: 70000 });
  const upgraded = await schoolState(K.page);
  assert.equal(upgraded.log.filter(({ event }) => event.id === id).length, 1);
  assert.equal(upgraded.merker.stand[writer], legacyEvidence.marker.stand[writer]);
  assert.equal(upgraded.naechsteNr, before.naechsteNr);
  assert.deepEqual(await accountState(K.page), identity);
  await K.page.waitForFunction((id) => Object.keys(localStorage).filter((key) => /^bq2_p_[A-Za-z0-9]+__events$/.test(key))
    .some((key) => JSON.parse(localStorage.getItem(key)).some((event) => event.id === id)), id, { timeout: 70000 });
  assert.deepEqual(await evaluationEvents(K.page), written);

  // Show that the recovered event is used by the actual practice round.
  await startToday(K.page);
  let observed = 0;
  for (let i = 0; i < 8; i++) {
    const actual = await K.page.locator('#qLabel').getAttribute('data-school-revision');
    if (actual) {
      assert.equal(actual, revision);
      observed++;
      await solveSubtraction(K.page);
    }
    if (i === 7) break;
    if (actual) await K.page.locator('#nextBtn').click();
    else await skipQuestion(K.page);
  }
  assert.equal(observed, 1);
  await leaveRound(K.page);
  assert.deepEqual(await evaluationEvents(K.page), written);
  assert.deepEqual(P.errors, []);
  assert.deepEqual(K.errors, []);
  t.diagnostic('Historical client rejected the exact event as format and advanced its school cursor. On the same logged-in child profile the upgraded client recovered one event and generated one correct attributed card.');
});
