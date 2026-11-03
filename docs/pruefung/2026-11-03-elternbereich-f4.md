# Elternbereich F4: Quellen (03.11.2026)

Paket F4 aus `docs/konzept/elternbereich-auftraege.md` (Konzept 7.4).

## Anliegen
Die Quellen standen als eine lange Liste (55 Einträge), im Elternbereich darunter noch die Website der Schule als eigener Block.

## Umgesetzt
- Der Einleitungssatz bleibt, darunter stehen **sechs zugeklappte Gruppen** (DE/EN):

  | Gruppe | Einträge |
  |---|---|
  | 1 · Forschung zu Lernen, Feedback und Hilfe | 25 (Vermerke „bibliografisch geprüft“ bleiben) |
  | 2 · IB und Schule | 3 (IB PYP ×2, IB Copyright), im Elternbereich dazu 4 Links zur Website der Schule |
  | 3 · Lehrpläne zum Vergleich | 11 |
  | 4 · Lernprogramme und Materialien | 10 |
  | 5 · Technik und Datenschutz | 6 |
  | 6 · Nicht öffentliche Quellen | Absatz wie heute |

- **Keine Quelle gestrichen:** Es sind 55 Links, im Elternbereich 59 mit der Website der Schule, genau wie vorher.
- Die Website der Schule steht jetzt in Gruppe 2 statt als Block unter der Liste. Die Info-Seite, die ein Kind ohne Konten erreicht, verlinkt die Schule weiterhin nicht.
- Jeder Eintrag trägt seine Gruppe als drittes Feld in `ABOUT_SOURCES`.

## Zweifelsfälle (wie zugeordnet)
- **IES Practice Guide „Organizing Instruction and Study“** (Verteilen, Abrufen) → Gruppe 1 (Forschung). Das Konzept nennt in Gruppe 3 nur „IES Lesen“; der Practice Guide ist eine Forschungsübersicht und Beleg für „Unser Vorschlag“ in F5.
- **Common Core – archivierte Lizenz** → Gruppe 3 bei den Lehrplänen, nicht Gruppe 5. Es geht um die Nutzungsrechte der Lehrplantexte.
- **The Learning Scientists – Interleaving** (Blog) und **Education Endowment Foundation – Feedback** → Gruppe 1. Beide fassen Forschung zusammen, sie sind keine Lernprogramme.
- **Diagnostic Questions** und **youcubed** → Gruppe 4, wie im Konzept, obwohl beide auch Forschung zitieren.

## Prüfung
- Neu: `tests/elternbereich-f4.test.mjs` (**T9**), je Sprache, auf der Info-Seite und im Elternbereich:
  - sechs Gruppen in dieser Reihenfolge, alle zugeklappt
  - Linkzahl 55 bzw. 59, gleich wie vorher
  - Stichproben: je Gruppe eine Quelle an ihrem Platz
  - Einleitung und Absatz „Nicht öffentliche Quellen“ wie heute
  - Website der Schule nur im Elternbereich und dort in Gruppe 2
- Angepasst:
  - `blaetter` und `hilfe` klappen die Gruppen auf, bevor sie Links prüfen.
  - `elternbereich-f3` sucht „Genaue Schwellen“ nur noch in „Wie die App einstuft“, weil die Quellengruppen dieselbe Klasse tragen.
- Gegenprobe: F4-Test mit der App von `main` rot.
- `npm test`: 425 bestanden. `main` enthält inzwischen weitere Tests des Dev-Agenten.

## Gefunden
- Meine Angabe „57 Quellen“ im Gespräch war falsch, es sind 55.
