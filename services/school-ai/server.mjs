import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { verifyBytes } from '../../src/module/krypto.mjs';
import { claudeZuordnung } from '../../spikes/schulbewertung-ki/entwurf.mjs';
import { SCHOOL_EVALUATION_TARGETS } from '../../src/module/ereignisse.mjs';

const MAX_BODY = 48_000;
const WINDOW = 60_000;
const MAX_PER_MINUTE = 4;

export function createSchoolAiServer({ origin, parents, match = claudeZuordnung, now = Date.now, testLoopback = false }) {
  const allowed = new URL(origin);
  const local = testLoopback && allowed.protocol === 'http:' && allowed.hostname === '127.0.0.1';
  if ((!local && allowed.protocol !== 'https:') || allowed.origin !== origin) throw new Error('Berechtigte Big-Quest-Origin muss HTTPS verwenden.');
  const keys = new Map(Object.entries(parents));
  if (!keys.size || [...keys].some(([id, pub]) => !/^p_[A-Za-z0-9]{1,40}$/.test(id) || typeof pub !== 'string' || !/^[A-Za-z0-9+/]{80,240}={0,2}$/.test(pub))) {
    throw new Error('Die Liste der freigegebenen Elternschlüssel ist ungültig.');
  }
  const usage = new Map();
  return createServer(async (req, res) => {
    const cors = req.headers.origin === origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
    const reply = (status, data = {}) => {
      res.writeHead(status, { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(data));
    };
    if (req.method === 'GET' && req.url === '/health') return reply(200);
    if (req.url !== '/v1/school-assessment') return reply(404);
    if (!cors.Vary) return reply(403);
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { ...cors, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type, X-BQ-Signature' });
      return res.end();
    }
    const signature = req.headers['x-bq-signature'];
    if (req.method !== 'POST' || req.headers['content-type'] !== 'application/json' ||
        typeof signature !== 'string' || !/^[A-Za-z0-9+/]{86}==$/.test(signature)) return reply(400);
    let raw, input;
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > MAX_BODY) return reply(413);
        chunks.push(chunk);
      }
      raw = Buffer.concat(chunks).toString('utf8');
      input = JSON.parse(raw);
    } catch { return reply(400); }
    if (!input || Object.keys(input).length !== 4) return reply(400);
    const { account, at, nonce, rows } = input;
    const ecdsa = keys.get(account);
    if (!ecdsa || !Number.isSafeInteger(at) || Math.abs(now() - at) > WINDOW ||
        typeof nonce !== 'string' || !/^[0-9a-f-]{36}$/.test(nonce) ||
        !await verifyBytes({ ecdsa }, 'bq-school-ai-v1\n' + origin + '\n' + raw, signature)) return reply(403);
    if (!Array.isArray(rows) || !rows.length || rows.length > 30 || rows.some((r, i) =>
      !r || Object.keys(r).length !== 2 || r.row !== i || typeof r.criterion !== 'string' ||
      !r.criterion.trim() || r.criterion.length > 600)) return reply(400);

    const current = now();
    const recent = (usage.get(account) ?? []).filter(r => current - r.time < 2 * WINDOW);
    if (recent.some(r => r.nonce === nonce)) return reply(409);
    if (recent.filter(r => current - r.time < WINDOW).length >= MAX_PER_MINUTE) return reply(429);
    usage.set(account, [...recent, { nonce, time: current }]);

    try {
      const output = await match(rows);
      const valid = output && Object.keys(output).length === 1 && Array.isArray(output.matches) &&
        output.matches.length <= rows.length && output.matches.every(m => m && Object.keys(m).length === 2 &&
          Number.isInteger(m.row) && m.row >= 0 && m.row < rows.length &&
          Object.hasOwn(SCHOOL_EVALUATION_TARGETS, m.standard));
      if (!valid) return reply(502);
      return reply(200, output);
    } catch { return reply(502); }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { ANTHROPIC_API_KEY, BQ_APP_ORIGIN, BQ_PARENT_KEYS, PORT = '8080' } = process.env;
  if (!ANTHROPIC_API_KEY?.trim() || !BQ_APP_ORIGIN || !BQ_PARENT_KEYS) throw new Error('Anthropic-Schlüssel, Big-Quest-Origin und Elternschlüssel müssen serverseitig konfiguriert sein.');
  createSchoolAiServer({ origin: BQ_APP_ORIGIN, parents: JSON.parse(BQ_PARENT_KEYS) }).listen(Number(PORT), '0.0.0.0');
}
