import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { schuldatenPruefen } from '../../werkzeug/schulbewertungen-uebernehmen.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SPIKE_FIXTURE_DIR = path.join(HERE, 'fixtures');
const LEVELS = new Set(['C', 'M', 'E', 'RS', 'N']);

const obj = (x) => x && typeof x === 'object' && !Array.isArray(x);
const text = (x) => (typeof x === 'string' ? x : '');
const clean = (x) => text(x).trim();
const low = (x) => clean(x).toLowerCase();
const list = (x) => [...new Set(clean(x).split(';').map((y) => y.trim()).filter(Boolean))];
const dual = (de, en = de) => ({ de: text(de), en: text(en) });
const clone = (x) => JSON.parse(JSON.stringify(x));

function dateOk(x) {
  return /^\d{4}-\d{2}-\d{2}$/.test(text(x));
}

function ensureTask(task) {
  if (!obj(task.std)) task.std = {};
  if (!Array.isArray(task.quests)) task.quests = [];
  if (!Array.isArray(task.focusNext)) task.focusNext = [];
  if (!obj(task.good)) task.good = dual('', '');
  if (!obj(task.next)) task.next = dual('', '');
  return task;
}

function addRating(task, code, level) {
  if (!clean(code) || !clean(level)) return;
  if (!LEVELS.has(level)) throw new Error(`Unbekannte Einstufung ${level} fuer ${code}`);
  task.std[code] = level;
}

function addTask(groups, studentKey, studentInfo, asOf, taskKey, init) {
  if (!groups.has(studentKey)) groups.set(studentKey, { ...studentInfo, snapshots: new Map() });
  const student = groups.get(studentKey);
  if (!student.snapshots.has(asOf)) student.snapshots.set(asOf, new Map());
  const snap = student.snapshots.get(asOf);
  if (!snap.has(taskKey)) snap.set(taskKey, ensureTask(init()));
  return snap.get(taskKey);
}

function finishGroups(groups, meta) {
  return {
    version: 1,
    adapter: meta.adapter,
    sourceSystem: meta.sourceSystem,
    captureMode: meta.captureMode,
    capturedAt: meta.capturedAt,
    students: [...groups.values()].map((student) => ({
      externalStudentId: student.externalStudentId,
      firstName: student.firstName,
      lastName: student.lastName,
      birthDate: student.birthDate || null,
      snapshots: [...student.snapshots.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([asOf, tasks]) => ({
        asOf,
        tasks: [...tasks.values()].sort((a, b) => a.day.localeCompare(b.day) || a.title.localeCompare(b.title)).map((task) => ({
          ...task,
          quests: [...new Set(task.quests)],
          focusNext: [...new Set(task.focusNext)],
        })),
      })),
    })),
  };
}

export function parseCsv(textIn) {
  const text = String(textIn || '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === ',') { row.push(field); field = ''; continue; }
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    if (ch !== '\r') field += ch;
  }
  if (quoted) throw new Error('CSV endet in offenen Anfuehrungszeichen.');
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((x) => clean(x)));
}

export function csvObjects(textIn) {
  const rows = parseCsv(textIn);
  if (!rows.length) return [];
  const head = rows[0].map((x) => clean(x));
  return rows.slice(1).map((row) => Object.fromEntries(head.map((key, i) => [key, text(row[i])])));
}

function splitName(fullName) {
  const parts = clean(fullName).split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { firstName: clean(fullName), lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts.slice(-1)[0] };
}

export function normalizeToddleCapture(capture) {
  if (!obj(capture) || capture.source !== 'toddle') throw new Error('Toddle-Capture ungueltig.');
  const student = capture.student || {};
  const asOf = text(capture.asOf || student.asOf);
  const groups = new Map();
  for (const entry of Array.isArray(capture.entries) ? capture.entries : []) {
    const task = addTask(
      groups,
      text(student.sourceId),
      {
        externalStudentId: text(student.sourceId),
        firstName: text(student.firstName),
        lastName: text(student.lastName),
        birthDate: clean(student.birthDate) || null,
      },
      asOf,
      text(entry.taskId),
      () => ({
        sourceTaskId: text(entry.taskId),
        day: text(entry.day),
        area: text(entry.area),
        title: text(entry.title),
        pending: !!entry.pending,
        std: {},
        quests: Array.isArray(entry.quests) ? entry.quests.map(String) : [],
        focusNext: Array.isArray(entry.focusNext) ? entry.focusNext.map(String) : [],
        good: dual(entry.good && entry.good.de, entry.good && entry.good.en),
        next: dual(entry.next && entry.next.de, entry.next && entry.next.en),
      }),
    );
    for (const std of Array.isArray(entry.standards) ? entry.standards : []) addRating(task, std.code, std.rating);
  }
  return finishGroups(groups, {
    adapter: 'toddle-cdp',
    sourceSystem: 'Toddle',
    captureMode: text(capture.captureMode || 'browser-session-cdp'),
    capturedAt: text(capture.capturedAt || ''),
  });
}

export function normalizeFileCsv(csvText) {
  const rows = csvObjects(csvText);
  const groups = new Map();
  for (const row of rows) {
    const task = addTask(
      groups,
      text(row.student_key),
      {
        externalStudentId: text(row.student_key),
        firstName: text(row.first_name),
        lastName: text(row.last_name),
        birthDate: clean(row.birth_date) || null,
      },
      text(row.as_of),
      text(row.task_key),
      () => ({
        sourceTaskId: text(row.task_key),
        day: text(row.day),
        area: text(row.area),
        title: text(row.title),
        pending: low(row.pending) === 'true',
        std: {},
        quests: list(row.quests),
        focusNext: list(row.focus_next),
        good: dual(row.good_de, row.good_en),
        next: dual(row.next_de, row.next_en),
      }),
    );
    addRating(task, row.std_code, row.rating);
  }
  return finishGroups(groups, {
    adapter: 'file-csv',
    sourceSystem: 'Dateiimport',
    captureMode: 'file-upload',
    capturedAt: '',
  });
}

export function normalizeSchoolsBuddyCsv(csvText) {
  const rows = csvObjects(csvText);
  const groups = new Map();
  for (const row of rows) {
    const name = splitName(row.pupil_name);
    const task = addTask(
      groups,
      text(row.pupil_id),
      {
        externalStudentId: text(row.pupil_id),
        firstName: name.firstName,
        lastName: name.lastName,
        birthDate: clean(row.dob) || null,
      },
      text(row.report_date),
      text(row.assessment_id),
      () => ({
        sourceTaskId: text(row.assessment_id),
        day: text(row.assessment_date),
        area: text(row.subject),
        title: text(row.assessment_name),
        pending: low(row.status) !== 'graded',
        std: {},
        quests: [],
        focusNext: [],
        good: dual('', row.teacher_comment),
        next: dual('', row.next_step),
      }),
    );
    addRating(task, row.criterion_code, row.grade);
  }
  return finishGroups(groups, {
    adapter: 'schoolsbuddy-csv',
    sourceSystem: 'SchoolsBuddy',
    captureMode: 'file-upload',
    capturedAt: '',
  });
}

function findAccount(children, ref) {
  return children.find((child) => child.login === ref || child.accountId === ref) || null;
}

function nameMatches(student, child) {
  return low(student.firstName) === low(child.firstName) && low(student.lastName) === low(child.lastName);
}

export function mapEnvelopeToAccounts(envelope, accounts, explicitMap = {}) {
  const children = Array.isArray(accounts && accounts.children) ? accounts.children : [];
  const unresolved = [];
  const students = envelope.students.map((student) => {
    const mapped = { ...student, account: null, mapping: null };
    const explicit = explicitMap[student.externalStudentId];
    if (explicit) {
      const account = findAccount(children, explicit);
      if (!account) throw new Error(`Explizite Zuordnung ${student.externalStudentId} -> ${explicit} zeigt auf kein Kindkonto.`);
      mapped.account = clone(account);
      mapped.mapping = { method: 'explicit-source-id', reason: 'Quelle liefert einen stabilen Schueler-Schluessel.' };
      return mapped;
    }
    const byName = children.filter((child) => nameMatches(student, child));
    if (student.birthDate) {
      const byNameBirth = byName.filter((child) => child.birthDate === student.birthDate);
      if (byNameBirth.length === 1) {
        mapped.account = clone(byNameBirth[0]);
        mapped.mapping = { method: 'name-birthdate', reason: 'Name und Geburtsdatum sind eindeutig.' };
        return mapped;
      }
      if (byNameBirth.length > 1) {
        unresolved.push({ externalStudentId: student.externalStudentId, reason: 'doppelt-name-und-geburtsdatum', candidates: byNameBirth.map((child) => child.login) });
        return mapped;
      }
      if (byName.length === 1) {
        unresolved.push({ externalStudentId: student.externalStudentId, reason: 'geburtsdatum-weicht-ab', candidates: byName.map((child) => child.login) });
        return mapped;
      }
    }
    if (byName.length === 1) {
      mapped.account = clone(byName[0]);
      mapped.mapping = { method: 'name-only', reason: 'Nur ein passendes Kindkonto mit diesem Namen vorhanden.' };
      return mapped;
    }
    if (byName.length > 1) {
      unresolved.push({ externalStudentId: student.externalStudentId, reason: 'name-mehrdeutig', candidates: byName.map((child) => child.login) });
      return mapped;
    }
    unresolved.push({ externalStudentId: student.externalStudentId, reason: 'kein-kindkonto', candidates: [] });
    return mapped;
  });
  return { ...envelope, students, unresolved };
}

function latestSnapshot(student) {
  return student.snapshots.slice().sort((a, b) => b.asOf.localeCompare(a.asOf))[0] || null;
}

function toCurrentTask(task) {
  const out = {
    day: text(task.day),
    area: text(task.area),
    title: text(task.title),
    std: { ...task.std },
    good: dual(task.good && task.good.de, task.good && task.good.en),
    next: dual(task.next && task.next.de, task.next && task.next.en),
  };
  if (task.pending) out.pending = true;
  if (Array.isArray(task.quests) && task.quests.length) out.quests = [...task.quests];
  if (Array.isArray(task.focusNext) && task.focusNext.length) out.focusNext = [...task.focusNext];
  return out;
}

export function toCurrentImport(mappedEnvelope) {
  if (mappedEnvelope.unresolved.length) throw new Error('Nicht alle Quellen lassen sich einem Kindkonto zuordnen.');
  const current = { version: 1, kinder: {} };
  for (const student of mappedEnvelope.students) {
    const snap = latestSnapshot(student);
    if (!snap || !student.account) continue;
    current.kinder[student.account.login] = { asOf: snap.asOf, tasks: snap.tasks.map(toCurrentTask) };
  }
  const problems = schuldatenPruefen(current);
  return { current, problems };
}

async function fixtureJson(name, baseDir = SPIKE_FIXTURE_DIR) {
  return JSON.parse(await fs.readFile(path.join(baseDir, name), 'utf8'));
}

async function fixtureText(name, baseDir = SPIKE_FIXTURE_DIR) {
  return fs.readFile(path.join(baseDir, name), 'utf8');
}

const ADAPTER_INFO = Object.freeze({
  'toddle-cdp': {
    blockers: ['interaktive Anmeldung noetig', 'CDP/Browser-Sitzung statt stabile API', 'plattformabhaengig durch Turnstile und echtes Chrome-Profil'],
  },
  'file-csv': {
    blockers: ['Exportformat muss je Schule/Quelle vereinbart werden', 'Kommentare koennen sprachlich uneinheitlich sein'],
  },
  'schoolsbuddy-csv': {
    blockers: ['ohne gespeicherte Schueler-ID-Zuordnung schnell mehrdeutig', 'Details haengen vom spaeteren Exportumfang ab'],
  },
});

export async function runFixtureStudy(baseDir = SPIKE_FIXTURE_DIR) {
  const accounts = await fixtureJson('accounts.json', baseDir);
  const maps = await fixtureJson('source-map.json', baseDir);
  const cases = [
    normalizeToddleCapture(await fixtureJson('toddle-capture.json', baseDir)),
    normalizeFileCsv(await fixtureText('file-import.csv', baseDir)),
    normalizeSchoolsBuddyCsv(await fixtureText('schoolsbuddy-export.csv', baseDir)),
  ];
  return cases.map((envelope) => {
    const mapped = mapEnvelopeToAccounts(envelope, accounts, maps[envelope.adapter] || {});
    const result = {
      adapter: envelope.adapter,
      sourceSystem: envelope.sourceSystem,
      captureMode: envelope.captureMode,
      studentCount: envelope.students.length,
      mappedCount: mapped.students.filter((student) => !!student.account).length,
      unresolved: mapped.unresolved,
      blockers: ADAPTER_INFO[envelope.adapter].blockers,
      currentTargetValid: false,
      currentTargetChildren: [],
    };
    if (!mapped.unresolved.length) {
      const converted = toCurrentImport(mapped);
      result.currentTargetValid = converted.problems.length === 0;
      result.currentTargetChildren = Object.keys(converted.current.kinder).sort();
    }
    return result;
  });
}

export async function loadSpikeFixtures(baseDir = SPIKE_FIXTURE_DIR) {
  return {
    accounts: await fixtureJson('accounts.json', baseDir),
    maps: await fixtureJson('source-map.json', baseDir),
    toddle: await fixtureJson('toddle-capture.json', baseDir),
    fileCsv: await fixtureText('file-import.csv', baseDir),
    schoolsBuddyCsv: await fixtureText('schoolsbuddy-export.csv', baseDir),
  };
}

export function validateNeutralEnvelope(envelope) {
  const issues = [];
  if (!obj(envelope) || envelope.version !== 1) issues.push('Envelope braucht Version 1.');
  for (const student of Array.isArray(envelope.students) ? envelope.students : []) {
    if (!clean(student.externalStudentId)) issues.push('Schueler ohne externe Kennung.');
    if (!clean(student.firstName) || !clean(student.lastName)) issues.push(`Name fehlt bei ${student.externalStudentId || '<leer>'}.`);
    for (const snap of Array.isArray(student.snapshots) ? student.snapshots : []) {
      if (!dateOk(snap.asOf)) issues.push(`Snapshot ohne gueltiges asOf bei ${student.externalStudentId}.`);
      for (const task of Array.isArray(snap.tasks) ? snap.tasks : []) {
        if (!dateOk(task.day)) issues.push(`Aufgabe ohne Datum bei ${student.externalStudentId}.`);
        for (const level of Object.values(task.std || {})) if (!LEVELS.has(level)) issues.push(`Ungueltige Einstufung ${level} bei ${student.externalStudentId}.`);
      }
    }
  }
  return issues;
}
