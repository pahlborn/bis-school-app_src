---
title: "Elternbereich – Umsetzung und Prüfung"
authors: ["OpenCode"]
status: draft
file-version: "1.0"
created: 2026-10-30
last-updated: 2026-10-30
source: ai-generated
topic: Elternzugang und Übungsbeobachtungen
---

# Elternbereich – Umsetzung und Prüfung

## Version History

| Version | Date | Author(s) | Summary of Changes |
|---|---|---|---|
| 1.0 | 2026-10-30 | OpenCode | Elternbereich, PIN, Fokus und Kalenderdatei dokumentiert |

## Executive Summary

Der Elternbereich ergänzt die Hilfe-Leiter um einen getrennten Zugang, eine bearbeitbare Fokus-Liste und nachvollziehbare Übungsbeobachtungen. Eine freiwillige Kalender-Erinnerung wird auf Wunsch lokal erzeugt. Bewertungswörter und Beobachtungen erscheinen ausschließlich nach Öffnen des Elternbereichs, nie auf den Spielseiten.

## Zugang

- „About & grown-ups → Elternbereich“, alternativ `#eltern`.
- Ein Erwachsener legt einmal pro Gerät eine eigene PIN aus 4–8 Ziffern fest. Gespeichert werden Zufallssalt und PBKDF2-SHA256-Prüfwert, nicht die PIN.
- Der Bereich sperrt beim Verlassen, beim Wechsel in den Hintergrund und nach fünf Minuten ohne Bedienung. Bedienung startet die Inaktivitätsfrist erneut.
- Auch eine noch laufende PIN-Prüfung darf nach Navigation oder Sperren keine Inhalte freigeben.
- Geschützter Inhalt wird beim Sperren aus dem DOM entfernt, nicht lediglich ausgeblendet.
- Die lokale PIN dient als Bedienungsschutz gegen versehentlichen Zugriff. Ein Benutzer, der Code oder lokale Browserdaten manipuliert, kann sie umgehen. Der eigentliche Zugriffsschutz der veröffentlichten Inhalte bleibt die Verschlüsselung der App.
- Bei vergessener PIN kann ein Erwachsener gezielt `bq2_parentPin` zurücksetzen; es muss kein Lernverlauf gelöscht werden. Dafür wurde kein öffentlich zugänglicher Reset-Knopf eingeführt.

## Funktionen

- Fokus-Auswahl pro Gerät, mit Rückkehr zur ursprünglichen Auswahl. Eine bewusst leere Liste bleibt leer: dann wird frei gemischt.
- Fokus beeinflusst die Kennzeichnungen auf der Startseite, „Practise Today“ und die Übungsblätter. Fällige Wiederholungen dürfen weiterhin aus früher bearbeiteten Themen kommen.
- Übungsbeobachtungen sind unter den zugeordneten Lernzielen gruppiert. Pro Quest werden interner Übungsstand, Anzahl der Beobachtungen/Tage, letztes Datum sowie protokollierte Erstfehler und Hilfen gezeigt.
- Keine Zusammenrechnung zu einer offiziellen BIS-Bewertung. Weil Beobachtungen bislang pro Quest gespeichert werden, kann dieselbe Quest unter mehreren Standards stehen. Die Übersicht erläutert dies ausdrücklich.
- Bestehende Funktionen für Papierergebnisse, Unterrichts-Hilfekarten und Pisolalas Spannungsobergrenze sind ebenfalls hinter der PIN.
- Freiwillige Erinnerung: Eltern wählen Tage, Uhrzeit und Text. Ein `.ics`-Download enthält Wiederholungsregel, lokale Uhrzeit, Link und Alarm. Keine automatisch vorgegebenen Übungstage oder Mindestdauer.
- Ein Kalenderimport kann je nach Kalenderdienst lokal oder in dessen Cloud gespeichert werden. Benachrichtigungen und Löschen werden im Kalender verwaltet; die App behauptet keine garantierte iOS-Benachrichtigung nach Import.

## Prüfung

- `npm test`: 90 Tests grün.
- 11 neue Browserprüfungen: Einrichtung, falsche PIN, Reload, Hash-Zugang, explizite Sperre, Inaktivität, Hintergrund, laufende Prüfung während Navigation, Fokus-Persistenz, leere Auswahl, Übersicht, Kalenderdownload und schmale Darstellung.
- Kalender: Wiederholungsregel und Uhrzeit, Sonderzeichen, RFC-5545-Zeilenfaltung auf höchstens 75 UTF-8-Bytes, Alarm und Abschluss geprüft. Kein Name oder Lernstand wird automatisch exportiert.
- Sechs Gegenproben schlugen wie erwartet fehl: fehlender Zugangsschutz, ungeprüfte PIN, ignorierte Fokus-Auswahl, unvollständiges Sperren, falsche Kalenderwiederholung und verspätet freigegebene PIN-Prüfung.
- `git diff --check` ohne Fehler.

## Grenzen und weiterer Ausbau

Keine feingranulare automatische Bewertung je BIS-Standard, kein geräteübergreifender Abgleich und kein neuer Jahresstoff in den Kinderaufgaben. Diese Themen brauchen eigene, belegte Zuordnungen und werden getrennt weiterentwickelt.
