# Elternbereich D2: Anteil der Lücke in Practise Today und Übungsblatt (02.11.2026)

Paket D2 aus `docs/konzept/elternbereich-auftraege.md` (Konzept 6.5). Baut auf D1/D1b auf (Lücke je Standard).

## Anliegen
Die aktive Lücke soll in jeder Runde drankommen, ohne das aktuelle Thema der Klasse zu verdrängen. Bisher verteilte `buildToday()` die 8 Aufgaben gleichmäßig reihum über alle Fokus-Quests.

## Umgesetzt
- **Lücken-Spur** (`gapLaneQuests`): die Quests der aktiven Lücke, die **nur wegen der Lücke** im automatischen Fokus sind, also weder nächster Schritt der Lehrkraft noch „braucht Unterstützung / wird sicherer“ in der App. Im Modus Manuell ist sie leer.
- **Practise Today:** Aufwärmaufgabe, Wiederholungen, Herausforderung und die Mitte kommen aus den **aktuellen Themen**. Die Lücken-Spur bringt **höchstens 2 von 8** Aufgaben. Gibt es keine aktuellen Themen, füllt die Lücke die Runde wie bisher.
- **Kleine Schritte zuerst** (`gapTasks`): Die erste Lücken-Aufgabe ist eine Grundlage-Aufgabe, wo die Quest welche hat; dafür werden bis zu 6 weitere Runden erzeugt, weil sie bei manchen Quests selten sind (Data Detective: 1 von 8). Danach kommt Klassenniveau, **nie eine Herausforderung**. Die Lücken-Aufgaben werden in die gemischte Runde eingefügt, ohne ihre Reihenfolge zu verlieren (`insertInOrder`), und als `q.gap` markiert.
- **Übungsblatt:** höchstens ein Viertel von 6, also **1** Aufgabe aus der Lücken-Spur. Bei einem Übungsblatt zu einem einzelnen Thema gibt es keine Lücken-Spur.
- Die Schwierigkeit (`adaptRound`, `standOf`) ist unverändert.

## Prüfung
- Neu: `tests/elternbereich-d2.test.mjs` mit **erfundenen** Schuldaten (T14, Anteil)
  - **Aktive Lücke mit Grundlage-Aufgaben (Data Detective)**, 30 Runden:
    - jede Runde hat 8 Aufgaben, davon höchstens 2 aus der Lücke, auch nicht als Aufwärm- oder Herausforderungsaufgabe
    - die erste Lücken-Aufgabe ist immer eine Grundlage-Aufgabe, nie eine Herausforderung
    - die Lücke kommt in mindestens 25 von 30 Runden
  - **20 Übungsblätter:** höchstens 1, mindestens eines mit Lücken-Aufgabe.
  - **Aktive Lücke ohne Grundlage-Aufgaben** (Number Combinations + Word Problems, von Eltern gewählt): dieselben Grenzen, mit Klassenniveau statt Grundlage.
  - **Übungsblatt zu einem Thema und Fokus Manuell:** keine Lücken-Spur.
  - Dreimal hintereinander grün.
- Gegenproben (rot):
  - D2-Test mit der App von `main`.
  - Kontingent 4 statt 2.
  - Ohne die Suche nach einer Grundlage-Aufgabe.
- `npm test`: 339 bestanden; nach dem Merge von `main` (#75) 349 bestanden.
- Hinweis: `tests/begruessung.test.mjs` ist in einem Volllauf einmal fehlgeschlagen und danach nicht mehr (3 Einzelläufe und ein Volllauf grün). Der Test berührt nichts aus D2; ohne Schuldaten schreibt die Lücken-Logik nichts. Die Fehlerausgabe des ersten Laufs ist nicht erhalten. Er prüft unter anderem, dass Wörter wie „okay“ oder „great“ nirgends im Speicher stehen. [Vermutung] Ein zufälliger Treffer in wechselnden Inhalten ist denkbar, belegt ist das nicht.

## Wirkung mit den echten Schuldaten
Die aktive Lücke (seit D1b) ist der Standard der Quests „Opinion Writing“, „Capital Letters & Full Stops“ und „Specific Examples“. Die beiden letzten sind schon nächste Schritte der Lehrkraft, deshalb enthält die Lücken-Spur nur **„Opinion Writing“**: höchstens 2 Aufgaben pro Runde und 1 pro Übungsblatt.

## Gefunden, nicht geändert
- Viele Quests haben **gar keine** Grundlage-Aufgaben (in Stichproben: Number Combinations, Word Problems, Time & Numbers, Opinion Writing, Capital Letters, Specific Examples). „Kleine Schritte zuerst“ bleibt dort bei Klassenniveau. Grundlage-Aufgaben für diese Quests zu ergänzen, wäre eine inhaltliche Aufgabe für später.
