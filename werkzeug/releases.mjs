import { versionText } from './version.mjs';

// Release notes shown only to the admin under "About the app".
// Keep the next published version under `current`; the build stamps in the
// real version and build time. Move older versions into `history` if they
// should stay visible in the list.

export const MARKE = '/*BQ_RELEASES*/null';

export const RELEASE_NOTES = {
  "current": {
    "epics": [],
    "stories": [],
    "bugfixes": [
      {
        "de": "Offline bestätigte Schulbewertungen werden auch nach einem Wechsel des Kontoschlüssels auf weitere berechtigte Geräte übertragen.",
        "en": "School evaluations confirmed offline also reach other authorized devices after an account key change."
      },
      {
        "de": "Beim Update werden zuvor übersprungene Schulbewertungen nachgelesen, ohne doppelte Fassungen anzulegen.",
        "en": "After the update, previously skipped school evaluations are recovered without creating duplicate revisions."
      }
    ]
  },
  "history": [
    {
      "version": "V 0.152.6 (Betaversion)",
      "epics": [
        {
          "de": "Die möglichen Sterne werden vor jeder Aufgabe angezeigt. Leichte und normale Aufgaben aus schon einmal sicheren Quests bringen bei direkter Wahl keine weiteren Sterne.",
          "en": "Each task shows its possible stars in advance. Easy and normal tasks from quests that were secure before give no further stars when chosen directly."
        },
        {
          "de": "Der vergrößerbare Wissensbaum wächst mit sicheren Quests, Stufe E und erstmals gelösten Neuland-Aufgaben.",
          "en": "The knowledge tree can be enlarged and grows with secure quests, level E and first solved discovery tasks."
        }
      ],
      "stories": [
        {
          "de": "Neue Blätter, Blüten und Früchte schalten verlässlich eine Geschichte oder einen besonderen Witz frei.",
          "en": "New leaves, flowers and fruit reliably unlock a story or a special joke."
        },
        {
          "de": "Ein Tageswort ergänzt den Kinderbereich; Eltern erhalten eine tägliche Gesprächsfrage. Witze, Pisolala und Tageswort lassen sich freiwillig mit 👍 oder 👎 bewerten.",
          "en": "A daily word joins the child area; parents get a daily conversation question. Jokes, Pisolala and the daily word have optional thumbs-up/down feedback."
        },
        {
          "de": "Beim Update bleiben erreichte Titel, gesammelte Sterne und gewachsene Baumzeichen erhalten.",
          "en": "The update preserves earned titles, collected stars and existing tree growth."
        }
      ],
      "bugfixes": [
        {
          "de": "Neue Schulbewertungen aktualisieren nach dem Abgleich auch den automatischen Übungsfokus.",
          "en": "New school evaluations also refresh the automatic practice focus after sync."
        },
        {
          "de": "Specific Examples vermeidet auch bei seltenen Auswahlkombinationen doppelte Aufgaben.",
          "en": "Specific Examples avoids duplicate tasks even in rare selection combinations."
        }
      ]
    },
    {
      "version": "V 0.152.5 (Betaversion)",
      "date": "20.11.2026 12:29",
      "epics": [
        {
          "de": "Auf der Testinstanz können Eltern Schulevaluationen erfassen, korrigieren und zurücknehmen.",
          "en": "On the test instance, parents can add, correct and withdraw school evaluations."
        }
      ],
      "stories": [
        {
          "de": "Die Tagesrunde kann passende Subtraktions- und Rundungsaufgaben aufnehmen. Der Fassungsverlauf zeigt, ob der App-Speicher die Bewertung bestätigt hat.",
          "en": "The daily round can include targeted subtraction and rounding exercises. The revision history shows whether the app storage has confirmed the evaluation."
        }
      ],
      "bugfixes": [
        {
          "de": "Bestätigte Einstufungen je Kriterium wirken auf Schullücken, automatischen Fokus und Startschwierigkeit.",
          "en": "Confirmed ratings for each criterion affect school gaps, automatic focus and starting difficulty."
        },
        {
          "de": "Nach dem Upgrade werden zuvor übersprungene Schulbewertungen beim Abgleich nachgeholt.",
          "en": "After an upgrade, sync recovers previously skipped school evaluations."
        },
        {
          "de": "Unter „Weiteres Gerät verbinden“ lässt sich der Verbindungslink mit „Link kopieren“ übernehmen.",
          "en": "Under “Connect another device”, the connection link can be copied with “Copy link”."
        }
      ]
    },
    {
      "version": "V 0.152 (Betaversion)",
      "epics": [
        {
          "de": "Der Admin kann jetzt ein Elternkonto direkt in der App einladen.",
          "en": "The admin can now invite a parent account directly in the app."
        }
      ],
      "stories": [
        {
          "de": "Unter Administration gibt es dafuer einen eigenen Bereich mit Link, QR-Code und offenen Einladungen.",
          "en": "Under Administration there is now a dedicated area with link, QR code and open invitations."
        },
        {
          "de": "Der Admin legt dabei nur das Elternkonto an; Kind, Lehrkraft und Familienzuordnung bleiben ausserhalb dieses Pfads.",
          "en": "This path creates only the parent account; child, teacher and family assignment stay outside this flow."
        }
      ],
      "bugfixes": [
        {
          "de": "Bereits vergebene Anmeldenamen werden beim Admin-Einladen direkt abgefangen.",
          "en": "Already-used login names are caught immediately during the admin invitation flow."
        }
      ]
    }
  ]
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
