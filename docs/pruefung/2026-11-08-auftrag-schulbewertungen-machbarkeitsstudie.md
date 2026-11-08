---
title: "2026-11-08 - Auftrag Schulbewertungen Machbarkeitsstudie"
authors:
  - OpenCode
status: draft
file-version: "1.0"
created: 2026-11-08
last-updated: 2026-11-08
source: ai-generated
topic: schulbewertungen machbarkeitsstudie
---

# 2026-11-08 - Auftrag Schulbewertungen Machbarkeitsstudie

## Version History

| Version | Date       | Author(s) | Summary of Changes |
|:--------|:-----------|:----------|:-------------------|
| 1.0     | 2026-11-08 | OpenCode  | Initial version |

## Executive Summary

Der bestehende Downstream-Pfad fuer Schulbewertungen ist im Repo bereits technisch belastbar: `school_import` ins Kindkonto,
Ableitung ueber `deriveSchool` und Uebernahme mit Zaehlprobe sind schon vorhanden. Der offene Punkt fuer Epic `2026.0005`
liegt deshalb vor allem davor: Wie Eltern oder ein Hilfswerkzeug die Quelldaten reproduzierbar aufnehmen, in ein neutrales
Zwischenformat bringen und sauber einem Kindkonto zuordnen koennen. Der Spike zeigt drei Wege mit echten Beispielquellen,
validiert sie gegen das aktuelle Zielformat und bewertet ihre technischen Grenzen fair. Ergebnis: Ein dateibasierter Import
ist der naechste kleinste produktive Schritt; Toddle bleibt technisch moeglich, aber nur als betreuter Adapter hinter
derselben Schnittstelle.

---

## Auftrag und Abgrenzung

- Repo: `pahlborn/bis-school-app_src`
- Eigener Worktree: ja
- Keine Veraenderung an Kathies echten Schuldaten
- Kein neuer Produktpfad in `src/` oder den bestehenden Kernmodulen
- Ziel des Spikes: Quellaufnahme -> neutrales Zwischenformat -> Kindkonto-Zuordnung -> Validierung gegen das aktuelle Ziel

## Ausgangsstand im Repo

Bereits vorhanden und fuer die Studie bewusst wiederverwendet:

- `werkzeug/schulbewertungen-uebernehmen.mjs`: uebernimmt Schulbewertungen als `school_import` ins Konto eines Kindes
- `src/module/ableitung.mjs`: `deriveSchool(events, { now })`
- `tests/schulimport.test.mjs`: prueft den bestehenden Toddle-nahen Uebernahmeweg mit Zaehlprobe

Wichtig fuer die Bewertung: Das Repo kann Schuldaten downstream schon verarbeiten. Die Machbarkeitsstudie musste deshalb
nicht noch einmal dieselbe Uebernahme bauen, sondern den upstream-Teil vergleichbar machen.

## Technischer Spike

Neue, isolierte Spike-Dateien:

- `spikes/schulimport-studie/spike.mjs`
- `spikes/schulimport-studie/run.mjs`
- `spikes/schulimport-studie/fixtures/*`
- `tests/schulimport-studie-spike.test.mjs`

Der Spike macht fuer jeden Weg dieselben vier Schritte:

1. Quellaufnahme aus einer realistischen Rohquelle
2. Normalisierung in ein neutrales Zwischenformat pro Schueler und Snapshot
3. Zuordnung zu einem Kindkonto
4. Wandlung ins heutige App-Zielformat und Validierung ueber `schuldatenPruefen`

### Neutrales Zwischenformat

Der Spike verwendet absichtlich nicht direkt `werkzeug/schuldaten.json` als Eingangsformat, sondern ein quellenneutrales
Objekt mit diesen Kernelementen:

- `adapter`, `sourceSystem`, `captureMode`
- `students[]`
- je `student`: `externalStudentId`, Name, optional Geburtsdatum
- je `snapshot`: `asOf`, `tasks[]`

Damit ist die Uebernahme hinter dem Adapter austauschbar: Toddle, Dateiimport und ein weiterer Adapter muessen nur noch auf
dasselbe Zwischenformat liefern.

## Bewertete Wege

| Weg | Quelle im Spike | Kontozuordnung | Ergebnis |
|:----|:----------------|:---------------|:---------|
| Toddle-basierter Weg | gespeicherter JSON-Capture aus einer Browser-Sitzung | automatisch ueber Name + Geburtsdatum | technisch machbar, aber nicht robust genug fuer den ersten Eltern-Self-Service |
| Dateibasierter Importweg | CSV-Datei | automatisch ueber Name + Geburtsdatum | technisch am stabilsten fuer den naechsten kleinen Umsetzungsauftrag |
| Weiterer Adapterweg (SchoolsBuddy-Beispiel) | CSV-Export mit Schueler-ID, aber ohne Geburtsdatum | explizite Zuordnung Quelle -> Kindkonto | technisch machbar, wenn die Zuordnung als eigener Baustein mitgefuehrt wird |

## Technische Befunde je Weg

### 1. Toddle-basierter Weg

Beleg im Spike:

- Fixture `toddle-capture.json`
- Adapter `normalizeToddleCapture()`
- Test `Toddle-Capture: neutrales Zwischenformat ist gueltig ...`

Befund:

- Der Weg kann auf das neutrale Zwischenformat und danach ins heutige Zielformat gewandelt werden.
- Die eigentliche technische Schwachstelle liegt nicht in der Datenform, sondern in der Quellaufnahme.
- Der schon bekannte echte Rand bleibt bestehen: interaktive Anmeldung, echtes Browser-Profil, CDP/Chrome und Plattformrisiko
  durch Turnstile.

Bewertung:

- Fair betrachtet ist Toddle **nicht ausgeschlossen**.
- Fuer einen betreuten oder administrativen Import ist Toddle weiter sinnvoll.
- Fuer den ersten produktiven Elternweg ist Toddle zu fragil, weil Authentifizierung und Browserverhalten nicht unter
  App-Kontrolle stehen.

### 2. Dateibasierter Importweg

Beleg im Spike:

- Fixture `file-import.csv`
- Adapter `normalizeFileCsv()`
- Test `Dateiimport: zwei Kinder werden automatisch ...`

Befund:

- Zwei Kinder lassen sich im Spike direkt aus einer Datei aufnehmen.
- Das Zwischenformat bleibt identisch zum Toddle-Weg.
- Die Zuordnung funktioniert reproduzierbar ueber Name + Geburtsdatum.
- Die Daten koennen anschliessend ohne Sonderlogik in das heutige App-Zielformat gewandelt und validiert werden.

Bewertung:

- Dieser Weg hat die geringste Browser- und Plattformabhaengigkeit.
- Authentifizierung wird vom Quellsystem entkoppelt: die App muss keine Schulplattform fernsteuern.
- Wartbarkeit ist am besten, solange das Dateiformat versioniert und pro Adapter gekapselt bleibt.

### 3. Weiterer Adapterweg (SchoolsBuddy-Beispiel)

Beleg im Spike:

- Fixture `schoolsbuddy-export.csv`
- Adapter `normalizeSchoolsBuddyCsv()`
- Test `SchoolsBuddy-Export: ohne gespeicherte Quell-ID-Zuordnung ...`

Befund:

- Die Rohdaten lassen sich technisch ebenfalls ins neutrale Zwischenformat bringen.
- Der entscheidende Unterschied ist die Kontozuordnung: Im Beispiel fehlt das Geburtsdatum, und derselbe Name kommt in zwei
  Kindkonten vor.
- Ohne gespeicherte Quell-ID-Zuordnung bleibt der Weg mehrdeutig.
- Mit einer expliziten Zuordnung `source student id -> child login/account id` wird der Weg stabil.

Bewertung:

- Ein weiterer Adapter ist realistisch, aber nur mit einem eigenen Zuordnungsbaustein belastbar.
- Genau dieser Baustein wird auch fuer spaetere Quellen nuetzlich sein.

## Gemeinsame technische Huerden

- Authentifizierung: Toddle ist interaktiv und browsernah; Dateiimporte vermeiden das; weitere Adapter koennen beides sein.
- Stabilitaet: Browserautomatisierung ist fragiler als Dateiverarbeitung.
- Zuordnung: Bei mehreren Kindern oder gleichen Namen reicht Name allein nicht.
- Wartbarkeit: Ein neutrales Adapterformat trennt Quellchaos von der eigentlichen Importlogik.
- Datenschutz/Rechte: Quelle und Ziel muessen getrennt bleiben; im Spike werden nur erfundene Fixture-Daten verwendet.
- Browser-/Plattformabhaengigkeit: nur Toddle hat hier einen harten Blocker; Dateiimporte und Exportadapter nicht.

## Zweites Kind mitgedacht

Der Spike bildet bewusst zwei gleichnamige Kinder (`Mira Sonnental`) in unterschiedlichen Konten ab. Damit wird der Punkt aus
der Story technisch geprueft und nicht nur beschrieben:

- Mit Geburtsdatum ist automatische Zuordnung moeglich.
- Ohne Geburtsdatum braucht es eine gespeicherte Quell-ID-Zuordnung.
- Damit ist klar: Ein produktiver Import braucht einen expliziten Zuordnungszustand, sobald die Quelle keine eindeutig
  ausreichenden Stammdaten mitliefert.

## Empfehlung

Klare Empfehlung fuer den naechsten kleinsten Umsetzungsauftrag:

1. **Dateibasierten Import als ersten produktiven Weg bauen**.
2. **Davor einen dauerhaften Adaptervertrag aus dem Spike herausziehen**: Quelle -> neutrales Zwischenformat ->
   Zuordnungsentscheidung -> bestehender `school_import`-Downstream.
3. **Zuordnungsbaustein separat mitliefern**: gespeicherte Zuordnung `source system + external student id -> child account`,
   beim ersten Mal mit Bestaetigung und Geburtsdatum-Pruefung.
4. **Toddle nicht wegwerfen**, sondern als zweiten Adapter hinter dieselbe Schnittstelle haengen, zunaechst betreut und nicht
   als Standardweg fuer Eltern.

## Naechster kleinster Folgeauftrag

Vorschlag fuer den Folgeauftrag:

> Baue einen produktionsnahen Adapter-Rahmen fuer Schulquellen mit genau zwei produktiven Teilen: `file-csv` als ersten
> Elternweg und eine persistente Kindkonto-Zuordnung per Quell-ID. Der bestehende Downstream `school_import` bleibt der
> einzige Schreibweg ins Konto.

Konkreter Zuschnitt:

- neues Modul nur vor dem bestehenden `schulbewertungen-uebernehmen`
- kein neuer Import direkt in `src/`
- UI zunaechst nicht fertig ausbauen; zuerst Werkzeug oder Admin-gefuhrter Ablauf
- Toddle nur ueber denselben Adaptervertrag andocken, nicht als Sonderweg

## Verifikation

Lokal fuer den Spike relevant:

- `node --test tests/schulimport-studie-spike.test.mjs`
- `node spikes/schulimport-studie/run.mjs`

Die Spike-Tests pruefen:

- neutrales Zwischenformat ist gueltig
- Zuordnung funktioniert fuer drei Wege
- Mehrdeutigkeit bei gleichem Namen wird wirklich erkannt
- das heutige Zielformat bleibt fuer alle erfolgreichen Faelle validierbar

## Quality Check

- Konsistenz: Begriffe durchgaengig auf Adapter -> Zwischenformat -> Zuordnung -> Downstream ausgerichtet.
- Koharenz: Bericht trennt sauber zwischen vorhandenem Downstream und neu geprueftem Upstream.
- Luecken: Keine offenen TODO-Platzhalter im Dokument.
- Frontmatter/Version: initial gesetzt und mit Version History konsistent.
