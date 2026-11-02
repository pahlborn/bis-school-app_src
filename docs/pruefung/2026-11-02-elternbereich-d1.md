# Elternbereich D1: Lücken-Logik (02.11.2026)

Paket D1 aus `docs/konzept/elternbereich-auftraege.md` (Konzept 6.1–6.5, 6.8; Befund B18).

## Anliegen
Peter (02.11.): Die Schule bewertet ein Thema einmal und geht weiter. Wer eine Lücke hat, gerät ins Hintertreffen. Bisher brachte eine schwache Schul-Einstufung eine Quest **nicht** in den Fokus; sie bestimmte nur die Startschwierigkeit, bis 6 Antworten an 2 Tagen vorlagen.

## Umgesetzt
- **Lücke** (`gapRating`): Die letzte Schul-Einstufung des Hauptstandards einer Quest (`schoolStandFor`) ist RS (auch N) oder C. Archivierte, gesperrte Ausblick- und Mix-Quests sind ausgenommen (`cleanFocus`).
- **Ende** (`openGaps`):
  - Die App schätzt die Quest als „Sicher“ oder „Darüber hinaus“ **und „bestätigt“** ein (heutige Schwellen von `assessQuest`); vorläufig reicht nicht.
  - Oder eine neuere Schul-Einstufung ist mindestens „Meeting“; dann ist die Quest gar keine Lücke mehr.
  - Das Schließen durch die Eltern ist als Datenfeld vorbereitet (`by: 'parents'`); die Knöpfe kommen mit D4.
- **Geschlossen bleibt geschlossen:** Gespeichert je Kind unter `gaps` als `{closed:{quest:{at, by, schoolDay}}, active}`. Nur eine **neuere** schwache Einstufung (späteres Datum als `schoolDay`) öffnet die Lücke wieder. Eine Lücke endet nie durch Zeit.
- **Eine aktive Lücke** (`activeGap`): zuerst die von Eltern gewählte (Feld `active`, für D4), sonst die erste in der Reihenfolge RS vor C, älteste Einstufung zuerst. Die Voraussetzungen kommen mit D3. Wartende Lücken sind nicht im Fokus.
- **Fokus:** `focusAuto() = classTopics() ∪ need ∪ [activeGap()]`. Manuell, Schwierigkeit und Einschätzung bleiben unverändert. Der Zwischenspeicher des Fokus beachtet jetzt auch `gaps`.
- **Nur lesen bei Freigabe:** Wer über eine Freigabe schaut (Lehrkraft, Admin), schreibt nichts in die Daten des Kindes (`gapReadOnly`). Geschlossen wird nur, wenn das Kind übt oder die Eltern schauen.
- **Etikett in der Fachansicht:** „🎯 Lücke laut Schule (Datum)“ an der aktiven Lücke, „Lücke laut Schule (Datum) · wartet“ an wartenden. Auf Englisch „gap per school“.
- **Speicher:** `gaps` ist eingetragen in `werkzeug/speicherstellen.json` (Kind, letzte-gilt, in der Sicherung) und in `BACKUP_KEYS`.

## Prüfung
- Neu: `tests/elternbereich-d1.test.mjs` mit **erfundenen** Schuldaten (T14 ohne Anteil)
  - Welche Quests Lücken sind (RS vor C; eine neuere „Meeting“-Einstufung bedeutet keine Lücke); nur eine aktiv; die aktive im Fokus, die wartende nicht.
  - Vorläufig sicher schließt nicht, bestätigt sicher schließt (gespeichert mit `by: 'app'` und `schoolDay`), dann wird die nächste aktiv.
  - Geschlossen bleibt geschlossen, auch bei späteren Fehlern. Eine neuere schwache Einstufung öffnet wieder. Das Schließen durch Eltern und die von Eltern gewählte aktive Lücke wirken. Manuell bleibt unberührt.
  - Die Lehrkraft mit Freigabe schreibt nichts. Eltern sehen die Etiketten (DE/EN), und der Fokus-Schalter passt dazu.
- Angepasst: `BACKUP_KEYS` um `gaps` (Test `stufe1-p1` „Sicherung nimmt genau die Speicherstellen …“).
- Gegenproben (rot):
  - D1-Tests mit der App von `main` (2 von 2).
  - Ohne Schreibschutz für die Lehrkraft (1).
  - Schließen schon bei „vorläufig sicher“ (Test meldet „provisional "secure" is not enough“).
- `npm test`: 330 bestanden; nach dem Merge von `main` (#71) 331 bestanden.

## Prüfung mit den echten Schuldaten (Konzept 6.8, nur Zahlen)
Lokal mit `werkzeug/schuldaten.json`, ohne Übung in der App:
- **10 offene Lücken**, alle „Consolidating“ (keine „Requires support“).
- Sie stammen aus **7 Standards**: Ein Standard ist Hauptstandard von 3 Quests, einer von 2, fünf von je 1.
- **Zuerst aktiv:** „Specific Examples“. Diese Quest ist ohnehin schon im Fokus (nächster Schritt der Lehrkraft), der Fokus bleibt also vorerst bei 8 Quests.
- **Über der Meldeschwelle von 6** (Konzept 6.8). Nicht begrenzt, Entscheidung bei Peter.

## Gefunden, nicht geändert
- **Lücke je Quest oder je Standard?** Weil eine Lücke an der Quest hängt, erzeugt ein schwacher Standard so viele Lücken, wie er Quests hat. Nacheinander abgearbeitet heißt das: dieselbe Schul-Einstufung wird mehrmals „geschlossen“, einmal pro Quest. Alternative: eine Lücke je Standard, geschlossen, wenn alle seine Quests bestätigt sicher sind, oder wenn eine es ist. Das ist eine fachliche Entscheidung für Peter, vor D2/D4.
- Die Ausnahme „gesperrte Ausblick-Quests“ ist über `cleanFocus` abgedeckt, aber nicht eigens getestet: Keine Ausblick-Quest hat derzeit einen Standard in `STANDARDS`.
