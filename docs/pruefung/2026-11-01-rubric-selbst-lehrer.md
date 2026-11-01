# Bewertungsraster: Lehrkraft und Selbsteinschätzung getrennt (01.11.2026)

Peter (01.11.): Bei jeder Aufgabe gibt es zwei Einstufungen, die Selbsteinschätzung des Kindes und die der Lehrkraft. Die Tabelle der Standards (C/M) ist die der Lehrkraft.

## Befund

Die Lernplattform wurde erneut nur gelesen; Peter hat sich angemeldet, danach wurde das Fenster geschlossen und das Profil gelöscht. Die Bewertungsansicht zeigt:
- **Standards (C/M):** Einstufung der Lehrkraft. Die Werte in v43 waren richtig; sie sind jetzt ausdrücklich als „Lehrkraft“ beschriftet.
- **Bewertungsraster des Milestone:** Je Kriterium ist ein Feld mit grauem Haken markiert – das ist die Selbsteinschätzung des Kindes (überall 4 – Extending). Ein zweites Feld ist hervorgehoben mit farbigem Haken – das ist die Lehrkraft (überall 2 – Consolidating). Die anderen bewerteten Aufgaben haben kein Bewertungsraster.

## Umgesetzt

- Im Kapitel „🏫 Einstufungen der Schule“ zeigt die Milestone-Aufgabe das Bewertungsraster mit beiden Einstufungen nebeneinander, zum Beispiel: „Sticker combinations: Lehrkraft Wird sicherer (Consolidating) · selbst eingeschätzt Darüber hinaus (Extending)“.
- Der Einleitungssatz sagt jetzt: Alle Einstufungen hier stammen von der Lehrkraft; wo sich das Kind selbst eingeschätzt hat, steht das daneben.
- Der Startwert für die Aufgabenwahl beruht weiter nur auf den Standards der Lehrkraft.

## Prüfung

- `tests/schule.test.mjs`: Bewertungsraster mit beiden Einstufungen; Hinweis „Einstufungen der Lehrkraft“.
- `npm test`: 194 bestanden.
