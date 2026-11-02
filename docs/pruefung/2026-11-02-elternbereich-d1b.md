# Elternbereich D1b: Lücke je Standard (02.11.2026)

Nachtrag zu D1 (#72). Entscheidung Peter, 02.11.: **B**, eine Lücke je Standard, geschlossen, sobald **eine** seiner Quests in der App bestätigt sicher ist.

## Anliegen
Mit den echten Schuldaten ergab D1 zehn Lücken aus nur sieben Standards: Ein schwacher Standard, der Hauptstandard mehrerer Quests ist, erzeugte mehrere Lücken. Dieselbe Schul-Einstufung hätte mehrmals „geschlossen“ werden müssen.

## Umgesetzt
- **Lücke = Standard** mit schwacher letzter Einstufung (RS/N, C), der Hauptstandard mindestens einer Quest ist. Zur Lücke gehören **alle** Quests mit diesem Hauptstandard (ohne archivierte, gesperrte und Mix-Quests).
- **Ende:** **eine** dieser Quests ist bestätigt sicher, oder eine neuere Einstufung ≥ Meeting, oder Eltern (`by: 'parents'`).
- **Aktiv** ist ein Standard. Alle seine Quests kommen in den automatischen Fokus (`activeGapQuests`), die wartenden nicht.
- **Speicher `gaps`:** `closed` und `active` sind jetzt nach Standard geschlüsselt; zusätzlich wird die schließende Quest gespeichert. Einträge aus D1 (nach Quest geschlüsselt) werden als Hauptstandard der Quest gelesen; keine Umstellung der Daten nötig.
- **Etikett in der Fachansicht:** alle Quests einer Lücke bekommen dasselbe Etikett (aktiv bzw. „· wartet“).
- **Konzept** `docs/konzept/elternbereich.md` 6.2–6.5 angepasst.

## Prüfung
- `tests/elternbereich-d1.test.mjs` auf Standards umgestellt und erweitert:
  - Lücken als Standard mit Quests in Reihenfolge RS vor C, ältere zuerst.
  - Eine Lücke mit zwei Quests (Number Combinations, Word Problems): Ist sie aktiv, sind beide im Fokus. **Eine** bestätigte Quest schließt die ganze Lücke und wird als schließende Quest gespeichert.
  - Alte Einträge nach Quest werden richtig gelesen.
  - Wartende Lücken markieren alle ihre Quests.
- Gegenprobe: der neue Test mit der App von `main` (Lücke je Quest) ist rot.
- `npm test`: 338 bestanden.

## Prüfung mit den echten Schuldaten (nur Zahlen und Quest-Namen)
- **7 offene Lücken** (vorher 10), alle C. Je Lücke 3, 2, 1, 1, 1, 1 und 1 Quests.
- **Zuerst aktiv:** der Standard der Quests „Opinion Writing“, „Capital Letters & Full Stops“ und „Specific Examples“. „Opinion Writing“ war bisher nicht im Fokus. Der automatische Fokus wächst dadurch von 8 auf 9 Quests. Das ist die erste spürbare Änderung beim Üben; das Kontingent von höchstens 2 Aufgaben pro Runde kommt mit D2.
- Weiter über der Meldeschwelle von 6 offenen Lücken (Konzept 6.8); nicht begrenzt.
