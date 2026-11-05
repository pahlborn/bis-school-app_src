# Elternbereich – neue Titel (05.11.2026)

Auftrag: Peter, 05.11., Punkte 1–3 (Vault: „Aufgabe Elternbereich – Titel und Schulische Einstufungen“, Teil 1).

| Bisher | Neu (DE) | Neu (EN) |
|---|---|---|
| 📖 So funktioniert Big Quest | 📖 Das Konzept von Big Quest | 📖 The Big Quest concept |
| 🤝 Ihr Kind unterstützen | 🤝 So unterstützen Sie Ihr Kind | 🤝 How to support your child |
| 🏫 Bewertungen der Schule – Verlauf | 🏫 Schulische Einstufungen | 🏫 School assessments |

## Geändert
- `index.html`: Kapitelköpfe, Kopf-Chip und Reiter (`aboutChip`, `tabInfo`, über `ABOUT_UI`), „Neu hier?“, Überschriften in den Kapiteln, ⓘ-Hilfen `school` und `guidance` (DE/EN), Verweis im ⓘ „Fokus“. Das ⓘ an „Schulische Einstufungen“ erscheint jetzt wirklich (vorher passte der Titel nicht zu `ADULT_H2`).
- `src/module/kinddaten.mjs`: Überschrift im Export „Schulische Einstufungen“.
- `docs/konzept/elternbereich.md` (Zielstruktur, 7.1, 7.2), `werkzeug/speicherstellen.json` (Hinweis zu `conceptSeen`).
- Nicht geändert: der Umfang „Schuldaten“ / „School ratings“ bei den Freigaben (kein Titel); Befunde und Prüfberichte mit den alten Namen bleiben als Verlauf.

## Belege
- Neu: `tests/elternbereich-titel.test.mjs` – Kapitel DE/EN in dieser Reihenfolge, „Neu hier?“, Chip und Reiter, ⓘ-Titel DE/EN, Verweis im ⓘ „Fokus“, kein alter Titel mehr in `index.html` oder auf der Seite.
- Angepasst: `about`, `anmeldung`, `elternbereich-c1`, `schule`, `module/kinddaten`.
- Volle Reihe: 810/811; das eine Rot war der Messwert in `module/lesen.test.mjs` (50,7 ms statt < 50 ms, gleichzeitig lief ein anderer Testlauf), allein wiederholt grün.
