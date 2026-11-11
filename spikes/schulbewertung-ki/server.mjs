// Local development host for the actual Big Quest test build and its assessment preview.
import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { appLesen } from '../../werkzeug/module.mjs';
import { githubNachbau } from '../../tests/module/github-nachbau.mjs';
import { githubSpeicher } from '../../src/module/github.mjs';
import { ersteAnmeldung, startcodeAusstellen } from '../../src/module/konto.mjs';
import { anmEinladungslink } from '../../src/module/anmeldung.mjs';
import { evaluationEntwurf } from './entwurf.mjs';

const REPO = 'pahlborn/bis-school-app-testdaten';
const MAX_BODY = 96_000;
const note = value => typeof value === 'string' ? value.slice(0, 2000) : '';

function antwort(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}

export async function evaluationVorschau(source, match) {
  const { proposals } = await evaluationEntwurf(source, match);
  const standards = new Map(proposals.map(p => [p.row, p.standard]));
  return {
    title: source.title,
    day: source.day,
    strengths: note(source.strengths),
    nextSteps: note(source.nextSteps),
    rows: source.rows.map(({ criterion, teacherRating }, i) => ({
      criterion,
      teacherRating: ['RS', 'C', 'M', 'E'].includes(teacherRating) ? teacherRating : null,
      standard: standards.get(i) ?? null,
    })),
  };
}

export async function startSchoolAI({ source, match, previewService } = {}) {
  const token = 'github_pat_' + randomBytes(32).toString('hex');
  const storage = await githubNachbau({ token, repos: [REPO] });
  let server;
  try {
    const now = Date.now();
    const access = githubSpeicher({ repo: REPO, token, basis: storage.basis }).geraet('d_Werkzeug1');
    const adminCode = await startcodeAusstellen({ zugang: access, aussteller: null, anmeldename: 'admin', art: 'admin', now });
    const admin = await ersteAnmeldung({ zugang: access, code: adminCode.code, passwort: randomBytes(24).toString('hex'), now });
    const parent = await startcodeAusstellen({ zugang: access, aussteller: admin, anmeldename: 'test.eltern', art: 'parent', now });
    const config = JSON.stringify({ art: 'github', repo: REPO, wurzel: '', basis: storage.basis });
    const initial = JSON.stringify(previewService ? { url: previewService } : source ? JSON.stringify(source, null, 2) : true).replaceAll('<', '\\u003c');
    const html = appLesen('utf8', { bauart: 'test' })
      .replace('/*BQ_SPEICHER*/null', () => config)
      .replace('/*BQ_SCHULE_KI*/false', () => initial);
    let origin;
    let busy = false;
    server = http.createServer(async (req, res) => {
      if (req.headers.host !== new URL(origin).host) return antwort(res, 403, {});
      if (req.method === 'GET' && req.url === '/') return antwort(res, 200, html, 'text/html');
      if (req.method !== 'POST' || req.url !== '/__bq_school_ai') return antwort(res, 404, {});
      if (req.headers.origin !== origin || req.headers['content-type'] !== 'application/json') return antwort(res, 403, {});
      if (busy) return antwort(res, 429, {});
      let chunks = [], length = 0;
      try {
        for await (const chunk of req) {
          length += chunk.length;
          if (length > MAX_BODY) {
            antwort(res, 413, {});
            break;
          }
          chunks.push(chunk);
        }
        if (res.writableEnded) return;
        const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (busy) return antwort(res, 429, {});
        busy = true;
        try {
          antwort(res, 200, await evaluationVorschau(input, match));
        } catch (err) {
          // The browser sees only a generic error. The console prints no source data.
          console.error(err?.message === 'ANTHROPIC_API_KEY fehlt im Serverprozess.'
            ? err.message : 'KI-Zuordnung fehlgeschlagen.');
          antwort(res, 422, {});
        } finally {
          busy = false;
        }
      } catch {
        if (!res.writableEnded) antwort(res, 400, {});
      }
    });
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    origin = 'http://127.0.0.1:' + server.address().port;
    return {
      origin,
      invitation: anmEinladungslink(origin + '/', { zugang: token, anmeldename: parent.anmeldename, code: parent.code, fingerabdruck: parent.fingerabdruck }),
      close: async () => {
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
        await storage.schliessen();
      },
    };
  } catch (error) {
    server?.close();
    await storage.schliessen();
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) throw new Error('ANTHROPIC_API_KEY fehlt im Serverprozess.');
  const path = process.argv[2];
  const source = path ? JSON.parse(await readFile(path, 'utf8')) : undefined;
  const local = await startSchoolAI({ source });
  console.log('Big Quest · lokale Einladung für das Test-Elternkonto:');
  console.log(local.invitation);
}
