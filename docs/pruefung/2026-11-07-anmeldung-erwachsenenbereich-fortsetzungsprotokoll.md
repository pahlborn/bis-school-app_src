---
title: "Login/Erwachsenenbereich – Fortsetzungsprotokoll"
authors:
  - OpenCode
status: draft
file-version: "1.1"
created: 2026-11-07
last-updated: 2026-11-07
---

# Login/Erwachsenenbereich – Fortsetzungsprotokoll

## Version History

| Version | Date       | Author(s) | Summary of Changes |
|:--------|:-----------|:----------|:-------------------|
| 1.0     | 2026-11-07 | OpenCode  | Initial version |
| 1.1     | 2026-11-07 | OpenCode  | Ursache des letzten Browser-Fehlers und grünen Gegenlauf ergänzt |

## Executive Summary

Dieses Protokoll sammelt die Fortsetzung einer mehrfach abgebrochenen Aufgabe rund um Login und Erwachsenenbereich in Big Quest. Es hält fest, in welchem lokalen Worktree die Arbeit liegt, welche Test- und Umgebungsprobleme aufgetreten sind und welcher echte Restfehler noch offen ist. Ziel ist eine spätere Auswertung der Abbruchursachen, bevor etwas nach GitHub übernommen wird.

---

## Ziel der Aufgabe

- Login-Seite vereinfachen.
- Veraltete Reste von `Schließen` entfernen.
- Erwachsenenbereich auf eigenem Gerät offen halten.
- Erwachsenenbereich auf Kindergerät beim Weglegen beenden.
- Zugehörige Tests auf den neuen Ablauf ziehen.

## Aktueller Arbeitsstand

- Bester bekannter Stand: `C:\Users\peter.ahlborn\AppData\Local\Temp\opencode\wt-bq-login-adult-20261106`
- Branch: `oc/anmeldung-erwachsenenbereich-20261106`
- Nicht nach GitHub übernommen.
- Geänderte Dateien zu Beginn der Fortsetzung:
  - `index.html`
  - `tests/anmeldung.test.mjs`
  - `tests/erstanmeldung-browser.test.mjs`
  - `tests/konto-einladungen-browser.test.mjs`
  - `tests/konto-einladungen.test.mjs`

## Bisherige Abbruch- und Störfaktoren

### 1. Arbeit lag nur in lokalen Temp-Worktrees

- Mehrere parallele Worktrees mit ähnlichem Thema vorhanden.
- Dadurch war zunächst unklar, welcher Stand der zuletzt sinnvolle ist.

### 2. Test-Worktree ohne `node_modules`

- Der ausgewählte Worktree hatte keine `node_modules`-Junction.
- Erster Testlauf scheiterte deshalb technisch mit `ERR_MODULE_NOT_FOUND` für `playwright`.
- Das war kein Produktfehler, sondern eine unvollständige lokale Testumgebung.

### 3. Mehrere Varianten desselben Ansatzes

- Es existieren mehrere lokale Stände zum selben Themenblock (`login-adult`, `offene-punkte`, `letzte-offene-punkte`).
- Dadurch ist die Aufgabe mehrfach neu angesetzt worden, statt auf einem klaren Fortsetzungspunkt weiterzulaufen.

## Teststand bei Fortsetzung am 2026-11-07

### Vor Korrektur der Testumgebung

- Betroffene Tests gestartet über `einzeln.ps1`.
- Ergebnis: mehrere Browser-Tests rot, Ursache `playwright` nicht gefunden.

### Nach Einhängen von `node_modules`

- `node_modules` per Junction auf `C:\dev\Peters Bastelbude\alignment\node_modules` ergänzt.
- Danach gezielter Lauf der betroffenen Tests.
- Ergebnis: 23/24 Tests grün.

## Analyse des letzten echten Fehlers

- Test: `tests/konto-einladungen-browser.test.mjs`
- Fall: `Browser: Kind anlegen -> Start-QR-Code -> Kind wartet und geht von selbst weiter; Schluessel erneuern (Felder); eigenes Geraet startet direkt im Erwachsenenbereich`
- Fehlerbild:
  - nach `reload()` wartete der Test auf `#parentClose`
  - Timeout 30000 ms

### Ursache

- Nach dem Neuladen lag die URL noch auf einer Eltern-Route `#eltern/...`.
- In `boot()` wurde dadurch zuerst `parentRoute()`/`applyParentRoute()` ausgefuehrt.
- Dieser Pfad oeffnete den geschuetzten Elternbereich ueber `openAbout('sheets')`, also ueber den Login-Weg, **bevor** der spaetere `adultResume()`-Zweig in `boot()` erreicht wurde.
- Ergebnis: Das eigene Erwachsenengeraet sprang beim Reload nicht direkt zurueck in den Erwachsenenbereich, obwohl eine gueltige `adultSession` vorhanden war.

### Fix

- Minimaler Eingriff in `applyParentRoute()`.
- Wenn eine gueltige Erwachsenen-Sitzung vorhanden ist und kein erneutes Entsperren noetig ist, wird dort jetzt direkt `adultResume()` versucht, bevor `openAbout('sheets')` auf den Login-Weg faellt.
- Dadurch bleibt das gewuenschte Verhalten erhalten:
  - eigenes Erwachsenengeraet -> direkter Ruecksprung in den Erwachsenenbereich
  - Kindergeraet mit gesetztem `adultUnlock` -> kein direkter Ruecksprung, sondern erneute Anmeldung

## Gegenprobe nach dem Fix

- Gezielt: `tests/konto-einladungen-browser.test.mjs`, `tests/anmeldung.test.mjs` -> gruen
- Danach derselbe 4-Datei-Lauf wie zu Beginn der Fortsetzung:
  - `tests/anmeldung.test.mjs`
  - `tests/erstanmeldung-browser.test.mjs`
  - `tests/konto-einladungen-browser.test.mjs`
  - `tests/konto-einladungen.test.mjs`
- Ergebnis: 24/24 Tests gruen

## Naechste Schritte

- Noch nicht nach GitHub uebernehmen, solange keine ausdrueckliche Freigabe zum Export vorliegt.
- Bei einer spaeteren Uebernahme denselben gezielten 4-Datei-Lauf vor dem Commit noch einmal laufen lassen.
