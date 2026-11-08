---
title: "Pruefbericht Testkandidaten-Reset"
authors:
  - OpenCode
status: draft
file-version: "1.0"
created: 2026-11-08
last-updated: 2026-11-08
---

# Pruefbericht Testkandidaten-Reset

## Version History

| Version | Date       | Author(s) | Summary of Changes |
|:--------|:-----------|:----------|:-------------------|
| 1.0     | 2026-11-08 | OpenCode  | Initial version |

## Executive Summary

Fuer die naechste Probe gibt es jetzt einen klaren Reset-Weg direkt im vorhandenen Werkzeug `werkzeug/testpersonen.mjs`. Ohne Bestaetigung zeigt `--reset` nur das Ziel und den aktuellen Bestand; geloescht wird erst mit der exakten Bestaetigung fuer das Testdaten-Repo. Der Reset ist auf `pahlborn/bis-school-app-testdaten` fest begrenzt, bricht bei unerwarteter Datenbasis ab und wurde auf Idempotenz sowie auf Schutz anderer Repos geprueft.

---

## Was neu ist

- `werkzeug/testpersonen.mjs`
  - neuer Modus `--reset` fuer die Testinstanz
  - Vorschau ohne Loeschen: zeigt Ziel-Repo, Anzahl der Dateien unter `directory/`, `events/`, `invites/`, `keys/` und den lokalen Stand unter `%LOCALAPPDATA%\bis-school-app\testinstanz\`
  - echtes Loeschen erst mit `--bestaetigen pahlborn/bis-school-app-testdaten`
  - harter Schutz: nur `pahlborn/bis-school-app-testdaten` und nur die erwartete Datenbasis der Testinstanz sind erlaubt; die feste Repo-Metadatei `README.md` in der Wurzel bleibt erlaubt und unberuehrt
  - lokale Startdaten (`testpersonen.json`, `testpersonen.txt`, HTML-Einladungen) werden erst nach erfolgreicher Repo-Bereinigung entfernt
- `tests/testpersonen.test.mjs`
  - neue Tests fuer Vorschau, Reset, Idempotenz, falsches Ziel-Repo und unerwartete Datenbasis

## Reset-Ablauf

1. Datenbasis identifizieren:
   - `node werkzeug/testpersonen.mjs --reset`
2. Wenn Ziel und Umfang stimmen, wirklich zuruecksetzen:
   - `node werkzeug/testpersonen.mjs --reset --bestaetigen pahlborn/bis-school-app-testdaten`
3. Danach Testpersonen frisch fuer die Probe anlegen:
   - `node werkzeug/testpersonen.mjs --anlegen`

## Pruefschritte

1. Vorschau laufen lassen und pruefen:
    - Ziel ist genau `pahlborn/bis-school-app-testdaten`
    - nur `directory`, `events`, `invites`, `keys` werden als Reset-Bestand gezaehlt; `README.md` bleibt unberuehrt
2. Reset mit Bestaetigung laufen lassen
3. Nachkontrolle:
   - keine alten Geraetebindungen mehr (`events`, `keys` leer)
   - keine alten Testanmeldungen mehr (`directory`, `invites` leer)
   - lokaler Startzustand entfernt (`testpersonen.json`, `testpersonen.txt`, Einladungen weg)
4. Gegenprobe:
   - Kathies echte Schuldaten nicht anfassen
   - produktive/familiaere Repos nicht anfassen
5. Reset ein zweites Mal laufen lassen:
   - keine weiteren Loeschungen
   - keine Fehler durch bereits leere Datenbasis

## Belege

- `node --test tests/testpersonen.test.mjs`
  - Vorschau zeigt nur den Reset-Bestand und loescht nichts
  - Reset entfernt Testkonten, Startcodes, Geraetebindungen und lokale Startdaten
  - zweiter Reset-Lauf bleibt stabil
  - `README.md` im Testdaten-Repo bleibt bestehen
  - anderes Repo (`pahlborn/bis-school-app-familie`) bleibt unveraendert
  - unerwartete Top-Level-Datenbasis fuehrt zum Abbruch statt zu stillem Loeschen

## Grenzen

- Der Reset ist absichtlich nur fuer die Testinstanz gebaut. Andere Repos oder Unterordner werden abgewiesen.
- GitHub-Historie bleibt unberuehrt; der Reset loescht nur den aktuellen Stand der Testdaten-Dateien.
