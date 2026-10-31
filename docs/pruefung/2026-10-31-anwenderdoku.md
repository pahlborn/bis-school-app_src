# Anwenderdokumentation in der App (31.10.2026)

Vorgabe Peter: Kurzanweisung außerhalb der App (wie komme ich hin, wie melde ich mich an); bei der ersten Anmeldung die hilfreichen Informationen; ein Anwenderhandbuch in zwei Ausprägungen (Eltern/Kind) je nach Login; Info- und Hilfeknöpfe dort, wo nötig.

## Umgesetzt

- **Anmeldebildschirm:** aufklappbare „❓ Help / Hilfe“ (Kind englisch, Erwachsene deutsch, Startcode, Passwort vergessen, Wartezeit).
- **Erste Anmeldung auf einem Gerät:** nach dem eigenen Passwort eine kurze Willkommensseite – Kind: Practise Today, Fehler/Hinweis/„Show me how“, Sterne und Lernbaum, Hilfe, Log out; Erwachsene: Daten nur auf diesem Gerät, Passwort pro Gerät, automatische Abmeldung, wo die Anleitung steht.
- **Handbuch je nach Login:** Kind: „How to use Big Quest“ (einfach, englisch) in About; die Erwachsenen-Anleitung sieht ein angemeldetes Kind nicht. Erwachsene: „📖 Anleitung für Erwachsene“ aufklappbar oben im Elternbereich (DE); in About (ohne Anmeldung) beide.
- **ⓘ-Knöpfe** mit einem gemeinsamen Hilfedialog: beim Spielen (wie eine Frage funktioniert), Lernbaum, Leseaufnahme, Übungsblatt; im Elternbereich an jedem Abschnitt (Beobachtungen, Fokus, Kalender, Pisolala, Profil, Version, Blätter, Unterstützung). Kinderhilfe führt mit „📖 Guide“ zur Kinderanleitung; im Elternbereich kein Sprung (würde abmelden).
- **„❓ Help“** unten auf der Startseite öffnet die Kinderanleitung.
- Fußzeile der Startseite bricht auf schmalen Handys um (ein echter Klick fand überdeckte Knöpfe).

## Prüfung

- Neu `tests/info.test.mjs` (3 Tests, echte Klicks), erweitert `anmeldung.test.mjs` (Hilfe auf dem Anmeldebildschirm, Willkommensseite, Kind sieht nur die Kinderanleitung, Erwachsenen-Anleitung im Elternbereich), `about.test.mjs` (neue Menüpunkte).
- `npm test`: 158 bestanden.
