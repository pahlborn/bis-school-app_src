# Elternbereich F5: Ihr Kind unterstützen (03.11.2026)

Paket F5 aus `docs/konzept/elternbereich-auftraege.md` (Konzept 7.1, R10).

## Anliegen
Das Kapitel hatte fünf Regeln, aber keinen Vorschlag, wie oft geübt werden soll. „Kurz und mit Freude: ein paar Minuten reichen“ ließ offen, was „kurz“ heißt. Die Kalender-Erinnerung in ⚙ wurde nicht erwähnt.

## Umgesetzt
- **„Unser Vorschlag“** steht oben (DE/EN): „Lieber oft kurz als selten lang: zum Beispiel 2–3 Runden pro Woche, je etwa 10 Minuten. Verteiltes Üben wirkt besser als viel auf einmal (Beleg: IES Practice Guide, siehe Quellen).“ Dahinter steht ein Link „⚙️ → „👧 Für <Kind>““, der den Abschnitt mit der Kalender-Erinnerung aufgeklappt öffnet. Für Lehrkräfte fehlt der Link, weil sie diesen Abschnitt nicht haben.
- **Fünf Regeln, gestrafft:**

  | Alt | Neu |
  |---|---|
  | „Erst fragen, dann helfen: … und stellen Sie keinen eigenen, anderen Rechenweg daneben.“ | „… Dann genau dort helfen, wo Ihr Kind stockt – mit dem Weg der Klasse.“ (Der Kernsatz „keinen zweiten Weg“ steht nur in „Helfen wie die Schule“, T6.) |
  | „Fragen statt erklären: …“ | unverändert |
  | „Fehler sind normal: …“ | unverändert |
  | „Kurz und mit Freude: ein paar Minuten reichen. Die App ist ein Zusatz zu den Hausaufgaben, keine Pflicht und kein Zeitplan.“ | „Mit Freude: Die App ist ein Zusatz zu den Hausaufgaben, keine Pflicht.“ (Wie oft und wie lange, sagt jetzt der Vorschlag.) |
  | „Konkretes zu jedem Thema: In der Übersicht ein Fach antippen. Bei jeder Quest finden Sie „💡 So helfen Sie“ (mit …) und „📄 Übungsblatt nur zu diesem Thema“.“ | „Konkretes zu jedem Thema steht bei jeder Quest unter „💡 So helfen Sie“.“ |

- **Keine Zeitangabe je Runde:** Laut Konzept steht „Eine Runde dauert bei Ihrem Kind zurzeit etwa X Minuten“ nur, wenn die Antworten Zeitstempel haben. Sie speichern nur den Tag (`logAttempt`: `day`), also entfällt der Satz. Zeitstempel einzuführen wäre eine Datenänderung und gehört nicht in F5.
- Der Vorschlag steht nicht in „Auf einen Blick“ und wird nie gemessen (R10).

## Prüfung
- Neu: `tests/elternbereich-f5.test.mjs`, je Sprache:
  - Der Vorschlag steht direkt unter der Überschrift, mit „2–3 Runden pro Woche, je etwa 10 Minuten“ und dem Beleg.
  - Es gibt fünf Regeln, die letzte verweist auf „💡 So helfen Sie“.
  - **T17 (Kapitel):** keine Zeitwörter, auch kein „täglich“ oder „jeden Tag“.
  - Der Kernsatz „keinen zweiten Weg“ steht nicht in diesem Kapitel.
  - Der Vorschlag steht nicht in „Auf einen Blick“.
  - Der Link öffnet ⚙ „👧 Für mia“ mit der Kalender-Erinnerung.
  - Die Lehrkraft sieht keinen Link.
- Gegenprobe: F5-Test mit der App von `main` rot (0 von 2).
- `npm test`: 427 bestanden.

## Gefunden
- Nichts Neues.
