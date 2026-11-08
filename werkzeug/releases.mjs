import { versionText } from './version.mjs';

// Release notes shown only to the admin under "About the app".
// Keep the next published version under `current`; the build stamps in the
// real version and build time. Move older versions into `history` if they
// should stay visible in the list.

export const MARKE = '/*BQ_RELEASES*/null';

export const RELEASE_NOTES = {
  current: {
    epics: [
      {
        de: 'Releasedokumentation ist jetzt direkt im Admin-Bereich der App sichtbar.',
        en: 'Release notes are now visible directly in the admin area of the app.'
      }
    ],
    stories: [
      {
        de: 'Der Admin sieht pro Fassung eine Übersicht nach Epic, User Story und Bugfix.',
        en: 'The admin sees one overview per version, grouped by epic, user story and bugfix.'
      }
    ],
    bugfixes: [
      {
        de: 'Fehlende Einträge zeigen einen ruhigen Hinweis statt einer kaputten Ansicht.',
        en: 'Missing entries show a calm note instead of a broken screen.'
      }
    ]
  },
  history: []
};

function normText(v) {
  if (typeof v === 'string') {
    const s = v.trim();
    return s ? { de: s, en: s } : null;
  }
  if (!v || typeof v !== 'object') return null;
  const de = typeof v.de === 'string' ? v.de.trim() : '';
  const en = typeof v.en === 'string' ? v.en.trim() : '';
  return de || en ? { ...(de ? { de } : {}), ...(en ? { en } : {}) } : null;
}

const normList = (list) => (Array.isArray(list) ? list : []).map(normText).filter(Boolean);

function normEntry(entry, version = null) {
  if (!entry || typeof entry !== 'object') return null;
  const epics = normList(entry.epics);
  const stories = normList(entry.stories || entry.userStories);
  const bugfixes = normList(entry.bugfixes || entry.fixes);
  if (!epics.length && !stories.length && !bugfixes.length) return null;
  const versionLabel = typeof entry.version === 'string' && entry.version.trim()
    ? entry.version.trim()
    : version ? versionText(version) : '';
  const date = typeof entry.date === 'string' && entry.date.trim()
    ? entry.date.trim()
    : version && version.date ? version.date : '';
  return { version: versionLabel, date, epics, stories, bugfixes };
}

export function releaseEintraege(version, source = RELEASE_NOTES) {
  const notes = source && typeof source === 'object' ? source : {};
  const list = [];
  const current = normEntry(notes.current, version);
  if (current) list.push(current);
  for (const entry of Array.isArray(notes.history) ? notes.history : []) {
    const fixed = normEntry(entry);
    if (fixed) list.push(fixed);
  }
  return list;
}

export function releaseEinsetzen(app, version, source = RELEASE_NOTES) {
  const text = Buffer.isBuffer(app) ? app.toString('utf8') : String(app);
  const teile = text.split(MARKE);
  if (teile.length !== 2) throw new Error(`index.html muss die Release-Marke ${MARKE} genau einmal enthalten.`);
  const json = JSON.stringify(releaseEintraege(version, source));
  return Buffer.from(teile[0] + json + teile[1], 'utf8');
}
