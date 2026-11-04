# Altlasten entfernt: alte Fokus-Form und alte Eltern-PIN (04.11.2026)

Grundlage: Vault „Was bleibt auf dem Gerät – genaue Liste“, Gruppe D.

## Umgesetzt
- **`focus`, `focusOn`, `focusOff` (alte Fokus-Form):**
  - `migrateFocus` entfernt (las die alten Schlüssel und wandelte sie in `focusMode`/`focusManual` um, samt Ereignissen); `focusTopics` ruft es nicht mehr auf.
  - Neu `dropOldKeys()` direkt nach dem Datenumzug beim Start: löscht die drei Schlüssel in **jedem** Bereich – ohne Bereich (`bq2_focus`, erstes Kind vor dem Umzug), alter Namensbereich (`bq2_<name>__focus`) und Kennung (`bq2_<id>__focus`). Übernommen wird nichts.
  - Nicht mehr in der Sicherung (`BACKUP_KEYS`); eine alte Sicherungsdatei mit diesen Schlüsseln wird ohne sie zurückgespielt (Rest unverändert).
  - `werkzeug/speicherstellen.json`: drei Einträge gestrichen.
- **`parentPin` (alte Eltern-PIN):**
  - In jeder echten App (mit Konten) löscht `dropOldKeys()` den Schlüssel beim Start. Dort las ihn ohnehin nichts mehr: das PIN-Tor `renderParentGate` kehrt mit Konten vor der PIN zurück.
  - **Entscheidung (Peter kann widersprechen):** Ohne Konten (unbebauter Stand, Tests) bleibt die PIN das Tor zum Elternbereich. Grund: 19 Testdateien öffnen den Elternbereich über diesen Weg, und ohne Tor wäre er in diesem Modus offen. Die Live-App hat immer Konten (der Bau setzt sie ein). Ganz entfernen ginge als eigene Aufgabe (Testweg für den Elternbereich ohne Konten umbauen).
  - `speicherstellen.json`: Hinweis entsprechend.
- Vault: Konzept 7.2 (Rechte- und Speicherkonzept 1.8) und „Was bleibt auf dem Gerät“ Gruppe D nachgezogen.

## Prüfung
- Neu `tests/altlasten.test.mjs` (in `npm test`):
  1. Quelltext: kein `store.get/set/del` der alten Fokus-Schlüssel, kein `migrateFocus`; die Namen stehen nur noch in `dropOldKeys`; nicht in `BACKUP_KEYS`; `parentPin` nur im PIN-Tor, das mit Konten vorher zurückkehrt; Verzeichnis ohne die drei Schlüssel.
  2. Mit Konten (echte Klicks): altes Gerät mit `bq2_focus*`, `bq2_tim__focus`, `bq2_<id>__focus*`, `bq2_parentPin` → nach dem Start alle weg, andere Schlüssel bleiben; Kind meldet sich an: Fokus automatisch, nichts übernommen; Neustart: weiter nichts; alte Sicherungsdatei mit `focus*` über „Zurückspielen“: Rest da, alte Fokus-Form nicht.
  3. Ohne Konten: alte Form gelöscht, aktueller Fokus (`focusMode` manuell, `focusManual`) unverändert; PIN bleibt und öffnet den Elternbereich.
- Umgestellt: `tests/eltern.test.mjs` „empty focus …“ beginnt jetzt mit manuellem Fokus statt mit der alten Liste; `tests/pdf.test.mjs` (zwei Tests) stellt den Fokus über `focusMode`/`focusManual` statt über `bq2_focus` ein (erste volle Reihe: 516/517, genau dieser Test rot – Beleg, dass die alte Form nicht mehr gelesen wird).
- **Gegenproben (8 von 8 rot):** kein Löschen beim Start; PIN mit Konten bleibt; nur `focusOn`/`focusOff` gelöscht; Sicherung nimmt `focus` wieder mit; PIN auch ohne Konten gelöscht (Tor kaputt); nur Schlüssel ohne Bereich gelöscht; alte Fokus-Form wird wieder übernommen; Löschen trifft auch `focusMode`/`focusManual`.
- Wächter (3b-1): 76 Schreibstellen, 45 mit Haken, offen 0 (die entfallenen Stellen gehörten zu `migrateFocus`).
- Volle Reihe: siehe PR.
