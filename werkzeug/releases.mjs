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
        de: 'Auf der Testinstanz können Eltern Schulevaluationen erfassen, korrigieren und zurücknehmen.',
        en: 'On the test instance, parents can add, correct and withdraw school evaluations.'
      }
    ],
    stories: [
      {
        de: 'Die Tagesrunde kann passende Subtraktions- und Rundungsaufgaben aufnehmen. Der Fassungsverlauf zeigt, ob der App-Speicher die Bewertung bestätigt hat.',
        en: 'The daily round can include targeted subtraction and rounding exercises. The revision history shows whether the app storage has confirmed the evaluation.'
      }
    ],
    bugfixes: [
      {
        de: 'Sichtbare Rubrik-Einstufungen aus eindeutig zusammengehörigen Kriterienzeilen werden als Originalbeleg erfasst; uneindeutige Werte bleiben offen.',
        en: 'Visible rubric ratings from unambiguously paired criterion rows are captured as evidence; ambiguous values remain unassigned.'
      },
      {
        de: 'Gemeinsames Formular für manuelle und schulische Bewertungsübernahme im isolierten Elternpilot; Geräteabnahme weiterhin offen.',
        en: 'One form for manual and school evaluation import in the isolated parent pilot; live-device acceptance pending.'
      },
      {
        de: 'Nach dem Upgrade werden zuvor übersprungene Schulbewertungen beim Abgleich nachgeholt.',
        en: 'After an upgrade, sync recovers previously skipped school evaluations.'
      }
    ]
  },
  history: [{
    version: 'V 0.152 (Betaversion)',
    epics: [
      {
        de: 'Der Admin kann jetzt ein Elternkonto direkt in der App einladen.',
        en: 'The admin can now invite a parent account directly in the app.'
      }
    ],
    stories: [
      {
        de: 'Unter Administration gibt es dafuer einen eigenen Bereich mit Link, QR-Code und offenen Einladungen.',
        en: 'Under Administration there is now a dedicated area with link, QR code and open invitations.'
      },
      {
        de: 'Der Admin legt dabei nur das Elternkonto an; Kind, Lehrkraft und Familienzuordnung bleiben ausserhalb dieses Pfads.',
        en: 'This path creates only the parent account; child, teacher and family assignment stay outside this flow.'
      }
    ],
    bugfixes: [
      {
        de: 'Bereits vergebene Anmeldenamen werden beim Admin-Einladen direkt abgefangen.',
        en: 'Already-used login names are caught immediately during the admin invitation flow.'
      }
    ]
  }]
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
