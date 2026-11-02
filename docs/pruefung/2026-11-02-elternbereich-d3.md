# Elternbereich D3: abgedeckte Lücken überspringen (02.11.2026)

Paket D3 aus `docs/konzept/elternbereich-auftraege.md` (Konzept 6.4, 6.7), in geänderter Form.

## Anliegen
Geplant war eine Liste „Quest A setzt Quest B voraus“, nach der Lücken vorrücken, auf denen ein aktuelles Thema aufbaut. Dazu wurde Peter am 02.11. ein Entwurf vorgelegt (V1–V6, mit Wirkung auf die echten Daten). Bei der Probe zeigte sich zusätzlich: Manche Lücken bestehen nur aus Quests, die ohnehin aktuelle Themen sind; als aktive Lücke bringen sie nichts Zusätzliches.

**Entscheidung Peter (02.11.):** „2“ – nur das Überspringen einbauen; die Liste der Voraussetzungen nicht. Begründung: Er kann die Liste pädagogisch nicht bewerten. Der Entwurf liegt in `docs/konzept/voraussetzungen-entwurf.md`, nicht in der App.

## Umgesetzt
- **`activeGap()`:**
  1. Eine von Eltern gewählte Lücke gilt immer (Feld `active`, Knopf kommt mit D4).
  2. Sonst die erste Lücke in der bisherigen Reihenfolge (RS vor C, älteste zuerst), **die etwas Neues bringt**: Lücken, deren Quests alle schon aktuelle Themen sind (nächster Schritt der Lehrkraft oder „braucht Übung“ in der App), werden übersprungen.
  3. Sind alle Lücken so abgedeckt, ist die erste aktiv. Schließen funktioniert weiter wie bisher.
- **Konzept** 6.4 und 6.7 angepasst. Neu: `docs/konzept/voraussetzungen-entwurf.md` mit Entwurf, Wirkung und Hinweis zum späteren Einbau.
- **Zurückbauen**, falls gewünscht: In `activeGap()` die Zeile mit `covered` entfernen; dann gilt wieder „erste offene Lücke“.

## Prüfung
- Neu: `tests/elternbereich-d3.test.mjs` mit **erfundenen** Schuldaten
  - Eine ältere, aber abgedeckte Lücke (Data Detective ist nächster Schritt) wird übersprungen; aktiv ist die neuere mit Time & Numbers, die Lücken-Spur bringt Time & Numbers.
  - Wählen die Eltern die abgedeckte Lücke, gilt ihre Wahl; die Lücken-Spur ist dann leer.
  - Sind nur abgedeckte Lücken übrig, ist die erste aktiv.
- Gegenprobe: der D3-Test mit der App von `main` ist rot.
- `npm test`: 350 bestanden.

## Wirkung mit den echten Schuldaten
Heute keine Änderung: Aktiv bleibt der Standard E-W1 (Opinion Writing, Capital Letters & Full Stops, Specific Examples), weil „Opinion Writing“ sonst nicht geübt würde. Wenn E-W1 geschlossen ist, werden später abgedeckte Lücken (z. B. Bar Graphs, Units, Number Combinations/Word Problems, solange sie Klassenthemen sind) übersprungen, und eine Lücke wie „Library & Research“ kommt vorher dran.
