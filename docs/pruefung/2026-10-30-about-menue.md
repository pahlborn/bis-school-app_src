# About als Menü mit Unterseiten (30.10.2026)

Vorgabe Peter: Den Ablauf bei falschen Antworten als Exkurs aufnehmen, ohne die Seite zu überfrachten; ebenso Quellen und Datenschutz. „Wir benötigen eine Art Menü mit Untermenü-System.“

## Umgesetzt

- About (Deutsch/English): Die Übersicht zeigt nur Einleitung, „Wichtiger Hinweis“, ein Menü der Themen, Stand und Version.
- Jedes Thema öffnet als eigene Unterseite mit „← Übersicht“: Grundidee, Leitgedanken, Aufbau, Lernlogik, **Exkurs: Was passiert bei einer falschen Antwort?**, Herkunft der Aufgaben, Datenschutz, Quellen (EN entsprechend, Exkurs „Side note: what happens after a wrong answer?“).
- Der Exkurs beschreibt die Hilfe-Leiter in vier Schritten mit Ausnahmen und „Zeig mir, wie“.
- Sprachwechsel führt zur Übersicht zurück. Der Elternbereich bleibt unverändert.

## Prüfung

- Neu `tests/about.test.mjs` (4 Tests, echte Klicks bei 320 px): Menüpunkte in Reihenfolge, Übersicht ohne Thementexte und kurz, jede Unterseite öffnet mit Titel und Zurück-Knopf im Bild, Exkurs-Inhalt DE/EN, Sprachwechsel.
- Angepasst: `blaetter.test.mjs` (Quellen auf eigener Seite, Übersicht ohne Linkliste), `hilfe.test.mjs` (Lernlogik/Quellen über das Menü), `neutral.test.mjs` (prüft Übersicht und alle Unterseiten DE/EN).
- Gegenprobe: alles wieder auf einer Seite → 4 Tests rot.
- `npm test`: 133 bestanden.
