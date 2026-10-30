---
title: "Hilfe-Leiter – Umsetzung und Prüfung"
authors: ["OpenCode"]
status: draft
file-version: "1.0"
created: 2026-10-30
last-updated: 2026-10-30
source: ai-generated
topic: Hilfe bei Fehlern
---

# Hilfe-Leiter – Umsetzung und Prüfung

## Version History

| Version | Date | Author(s) | Summary of Changes |
|---|---|---|---|
| 1.0 | 2026-10-30 | OpenCode | Umsetzung und lokale Prüfungen dokumentiert |

## Executive Summary

Nach einer falschen Antwort gibt es einen Hinweis und einen zweiten Versuch. Unterstützte Erfolge zählen nicht als unabhängiger Lernnachweis. Brücken sind für Runden, Stellenwert und fehlende Teile umgesetzt; für andere Fragen bleibt es zunächst bei fachbezogenen Hinweisen und Wiederholung.

## Umfang

- Multiple Choice mit mehr als zwei Optionen: erste falsche Option sperren, Hinweis zeigen, zweiten Versuch ermöglichen; dann erklären.
- Zwei Optionen: direkt erklären, weil ein weiterer Versuch die Lösung verrät.
- Eintippen: ursprüngliche Eingabe bleibt bearbeitbar.
- Reihenfolge: korrekten Anfang fixieren; passende Positionen als Hinweise markieren; den Rest neu ordnen lassen.
- „Show me how“ / „Zeig mir, wie“: erklärter Lösungsweg jederzeit zugänglich.
- Ein Stern für eine selbst oder im zweiten Versuch gelöste Aufgabe. Keine zusätzlichen Sterne durch Mehrfachklicks.
- Erstversuch, Hilfen und Ergebnisse getrennt speichern. Unterstützte Antworten und Brücken belegen keine selbstständige Beherrschung; sie verschieben keine fällige Wiederholung nach hinten.
- Brücke: zwei vereinfachte Aufgaben derselben Fragenfamilie, anschließend neue Zahlen bei einer vergleichbaren Aufgabe. Runde bleibt gleich lang. Fehlende Brückenteile werden beim nächsten Start fortgesetzt.
- Spätere Wiederholungen erhalten für diese Familien neue Zahlen bei unveränderter Wiederholungskennung.
- Spaltenalgorithmus durch eine Aufgabe zu fehlenden Teilen ersetzt; Einführung des Algorithmus ist für die BIS nicht bestätigt.
- Rechenkästen auf Papier enthalten einen leeren Zahlenstrahl.
- Elternhinweise für Rundung, fehlende Teile, OREO und Anleitung. Belegte Unterrichtsdarstellungen und allgemeine Übungsdarstellungen werden unterschieden.
- About enthält ergänzte Recherchequellen und deren Prüfstand. Die Lehrplanübersicht dient nur der Vorbereitung und erzeugt keine neuen Kinderaufgaben.

## Grenzen

- Die Brücke ist noch nicht für jede Fragenart vorhanden. Vorhandene Brückenfamilien: Rundung/Benchmark/Begründung, Stellenwert und fehlende Teile einschließlich zweischrittiger Sachaufgaben.
- Außerhalb dieser Familien sind Hinweise fachbezogen; sie behaupten keine diagnostisch sichere Erklärung des Denkfehlers.
- Die exakte Reihenfolge und die Schwellen sind Entwurfsentscheidungen, keine bestätigten Vorgaben der Schule.
- In dieser Ausbaustufe gibt es noch keinen PIN-Schutz des Elternbereichs, keine editierbare Fokus-Liste und keine neuen freigeschalteten Jahresthemen.
- Alte Lerndaten bleiben erhalten. Unterstützte Beobachtungen aus früheren Fassungen lassen sich rückwirkend nicht sicher unterscheiden.

## Prüfung

- `npm test`: 79 Tests bestanden, einschließlich aller bisherigen Regressionstests.
- `tests/hilfe.test.mjs`: 15 neue Browserprüfungen, auch mit nachgebildeten Größen von iPad mini, iPad, Smartphone und Laptop. Die vier Geräteprüfungen benutzen echte Playwright-Klicks, nicht nur programmgesteuerte DOM-Klicks.
- Gegenproben: sechs absichtliche Fehler lösten jeweils die dafür vorgesehenen Tests aus: kein zweiter Versuch, keine Brücke, doppelte Lernbelege, verworfene Restbrücke, vorgezogene unterstützte Wiederholung und erneut gezählte gesperrte Antwort.
- Ein Voll-Lauf scheiterte an einem Navigationstimeout beim gleichzeitigen Start zahlreicher Browser. Testparallelität auf drei Dateien begrenzt; Tests warten gezielt auf DOM-Bereitschaft. Der anschließende vollständige Lauf bestand.
- Der Challenge-Test wurde auf den erworbenen Badge statt eine zufällig ausbleibende Botschaft umgestellt: die Begrenzung auf eine Motivationsbotschaft pro Runde bleibt wirksam.
- `git diff --check`: keine Fehler.

## Nächste Schritte

Weitere Brückenfamilien, geschützter Elternbereich und bestätigte Methoden für neue Jahresthemen folgen als getrennte Ausbauschritte. Neue Forschung oder Schulmaterialien sollen Hinweise präzisieren, nicht die bisher unbestätigten Inhalte als BIS-Lehrplan ausgeben.
