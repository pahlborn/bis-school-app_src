# Einstufungen der Schule als Grundlage der Aufgabenwahl (01.11.2026)

Peter (01.11.):
- „Das Kind hat von der Schule Einstufungen erhalten. Auf Basis von diesen sollte die Vorlage der Aufgaben basieren.“
- Alle abgeschlossenen Aufgaben und die mit „Awaiting evaluation“ auslesen und in der App zu einer Übersicht zusammenfassen.

## Quelle

Die Lernplattform der Schule (Kinderkonto) wurde am 01.11.2026 **nur gelesen**: in einem eigenen Chrome-Fenster mit leerem Profil. Peter hat sich selbst angemeldet; danach wurde das Fenster geschlossen und das Profil gelöscht.
- Ausgelesen: 5 bewertete Aufgaben und 1 Aufgabe, die auf ihre Bewertung wartet.
- Die Rohdaten liegen nur lokal (`%LOCALAPPDATA%\bis-school-app\toddle\`), nicht im Repo.
- In die App übernommen wurden die Einstufungen je Standard (C/M), die Einstufungen der Lernkompetenzen und des Learner Profile (ES/Obs./Ind.) sowie eine kurze Zusammenfassung der Rückmeldungen (Stärken, nächste Schritte) auf Deutsch und Englisch.
- Die Auswahlen in den Bewertungsrastern sind in der Oberfläche nicht eindeutig zuzuordnen (Selbst- oder Lehrkraftbewertung) und wurden deshalb **nicht** übernommen.

## Umgesetzt

- **Kapitel „🏫 Einstufungen der Schule“** im Elternbereich (DE/EN, mit ⓘ):
  - Tabelle der Standards: Bereich, Standard in Alltagssprache, letzte Einstufung mit Datum, frühere Einstufung, Quests, die das üben.
  - Lernkompetenzen und Learner Profile.
  - Die bewerteten Aufgaben zum Aufklappen: Einstufungen, „Das gelingt“, „Nächste Schritte“, passende Quests.
  - „Wartet auf Bewertung“ (Glows and Grows).
  - Neutral formuliert: kein Name der Plattform, der Schule oder der Klasse.
- **„🏫 Schule: …“** bei jeder Quest in der Fachansicht: die letzte Einstufung des Hauptstandards der Quest mit Datum.
- **Startwert für die Aufgabenwahl:**
  - Solange es für eine Quest zu wenig eigene Übung gibt (weniger als 6 Antworten oder weniger als 2 Tage), richtet sich die Mischung der Runde nach der letzten Einstufung der Schule im Hauptstandard. Beispiel: Runden „Meeting“ ergibt 2–3 Herausforderungen, Zahlen zerlegen „Consolidating“ höchstens eine.
  - Danach zählt die eigene Übung. Die Einschätzung im Elternbereich beruht weiterhin nur auf eigener Übung.
- Die Daten gelten je Konto (hier: kathie). Andere Kinder sehen „noch keine Einstufungen“ und bekommen keinen Startwert.
- Konzept „Wie die App einstuft“ (DE/EN) um den Startwert ergänzt; Standards zu „Sprechen und Zuhören“ ergänzt.

## Prüfung

- Neu `tests/schule.test.mjs` (3 Tests mit Konten): Übersicht mit Verlauf (Runden: vorher „Wird sicherer“, jetzt „Sicher“), Aufgaben, Wartet auf Bewertung, neutrale Formulierung, Schul-Zeile an der Quest (DE/EN), Startwert wirkt auf die Mischung der Runde, anderes Kind ohne Einstufungen.
- Gegenproben (rot): ohne Startwert, ohne Schul-Zeile, Daten für jedes Kind.
- `npm test`: 194 bestanden.
