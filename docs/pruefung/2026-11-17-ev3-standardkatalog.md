# EV-3.1/EV-3.2: gemeinsamer Standardkatalog

## Anliegen

Die 15 bekannten Standards aus `index.html` an einer Stelle pflegen und die vorhandenen Anzeigen anschließen. Grundlage: PR #208 und `docs/konzept/evaluationen-ziel1-epics.md`, EV-3.1/EV-3.2. Native Atlas-Entwicklungsinstanz `dev_ev3_direct`, Basis `bb10457ade11490b785ab16e6f231c442e3affd2`; kein Forge-Lauf.

## Umgesetzt

- `src/module/standardkatalog.mjs`: Code → Fach, Originaltexte DE/EN und vorhandene Questbezüge. `schoolStandardInfo(code)` liefert einen bekannten Eintrag oder `null`. `E-S1` bleibt ohne Quest gültig.
- Einzige gepflegte Questzuordnung: `questRanks` je Eintrag. Daraus entstehen `quests` und die kompatible Sicht `STANDARDS`; Hauptstandard (Rang 0) und Nebenstandards bleiben unverändert. Auch ein Umsortieren des Katalogs ändert diese Rangfolge nicht.
- `STANDARD_TEXT`/`STANDARD_TEXT_EN` sind abgeleitete Sprachsichten. Die Fachzuordnung nutzt den Katalog und behält für unbekannte Altdaten den bisherigen Code-Fallback. `M-M1` bleibt unter Science, `E-W2` unter Library & Reading.
- Das vorhandene Kapitel „Schulische Einstufungen“ zeigt alle Standards nach Fach als aufklappbare Leseliste, auch ohne gespeicherte Bewertung. Ohne Quest steht in DE/EN der Hinweis „wird angezeigt, keine Übung in Big Quest“. Derselbe Hinweis erscheint bei einer solchen Einstufung in der Fachansicht.
- Kurze Pflegeanleitung unter EV-3.2 im Entwicklungskonzept.

## Prüfung

Alle hier aufgeführten Ergebnisse wurden in dieser Arbeitsrunde am 17.11.2026 ausgeführt. Keine historische Prüfung wird als heutiger Erfolg übernommen. Browser: vorhandenes Playwright 1.56.1, `CHROMIUM_PATH=/usr/bin/chromium`; keine neue Abhängigkeit.

| Prüfung | Ergebnis |
|---|---|
| `node --test tests/module/standardkatalog.test.mjs tests/module/rahmen.test.mjs` | 14 bestanden |
| `CHROMIUM_PATH=/usr/bin/chromium node --test --test-concurrency=2 tests/module/school-evaluation.test.mjs tests/schulimport.test.mjs tests/schulische-einstufungen.test.mjs tests/elternbereich-c1.test.mjs tests/elternbereich-d1.test.mjs` | 34 bestanden |
| Neuer Browserfall in `schulische-einstufungen.test.mjs` | Alle 15 Einträge ohne Duplikate, Fachgruppen, DE/EN, Hinweis ohne Quest, Tastatur und 320 px ohne Überlauf bestanden |
| `CHROMIUM_PATH=/usr/bin/chromium npm test` auf `1986e95` | 906 Tests, 905 bestanden, 1 fehlgeschlagen; 423251 ms. Einziger Fehler: alter Objektliteral-Zugriff im Hilfetext-Test. |
| Gezielte Nachprüfung `sohelfen.test.mjs` / `altlasten.test.mjs`, nur Hilfetext-Abdeckung und Quelltextgrenzen | 2 bestanden |
| `CHROMIUM_PATH=/usr/bin/chromium npm test` auf `d077fbc1926e651e87c71490789324c8a4daa741` | **906 bestanden, 0 fehlgeschlagen, 0 übersprungen, Exit 0; 436569 ms.** Vollständiger Wiederholungslauf, am 17.11. um 15:19 UTC beendet. |
| `git diff --check` | bestanden |

Die Funktionstests prüfen echte Produktfunktionen im App-Skript: ein synthetischer neuer Standard benötigt nur einen Katalogeintrag; `E-S1` ohne Quest erzeugt keine Lücke und keinen Fokus. Auch `E-S2`, `M-N5` und `M-N6` werden durch ihre Nebenbezüge nicht zu Hauptstandards. Mit einer nur im Test ergänzten, freigegebenen Hauptzuordnung zur bestehenden Vorschauquest `times` entsteht über die unveränderte Lückenregel eine Lücke mit Fokus. Das beweist die technische Erweiterbarkeit, noch nicht den neuen Speicher-/Formularweg.

**Rote Gegenproben:**

1. Im eigenen Produktworktree vorübergehend bei `M-N1` zusätzlich `unknown_catalog_quest: 0` in `questRanks` eingetragen. `node --test --test-name-pattern='Fach und alle Questbezüge' tests/module/standardkatalog.test.mjs` scheitert mit Exit 1 und `M-N1: Quest unknown_catalog_quest existiert`. Danach die Änderung zurückgenommen; der vollständige Katalogtest ist wieder grün. Ein vorheriger Versuch mit ersetztem statt zusätzlichem Hauptbezug scheiterte bereits an der unvollständigen Rangfolge; auch diese Schutzprüfung funktioniert.
2. Den unveränderten Basisindex von `bb10457` mit `git show` nur im Arbeitsspeicher gelesen und mit dem aktuellen Modulrahmen in `appSandbox` ausgeführt. Zugriff auf die neue Leseliste scheitert dort mit `schoolStandardCatalogHTML is not defined`. Keine Quellkopie in einem anderen Repo oder einer Ablage.

## Gefunden und offen

Die erste Gesamtsuite fand einen überholten Testzugriff: `sohelfen.test.mjs` erwartete `STANDARDS` als Objektliteral. Der Test verwendet die abgeleitete Katalogsicht und prüft weiterhin dieselben fünf Hilfeteile in beiden Sprachen. Der Endmarker des PIN-Scope-Tests in `altlasten.test.mjs` wird passend zur abgeleiteten Textsicht gesetzt und mit einer Grenzprüfung abgesichert; dadurch kann ein fehlender Marker den geprüften Bereich nicht unbemerkt vergrößern. Keine fachliche Erwartung wurde abgeschwächt.

Der vollständige Wiederholungslauf auf `d077fbc` enthält beide Testanpassungen und ist grün. Danach wurde ausschließlich dieses Prüfprotokoll um das Ergebnis ergänzt; Produkt- und Testcode blieben unverändert. Eine erneute Gesamtsuite für den reinen Berichtsnachtrag wurde nicht ausgeführt.

EV-3.2 ist für den vorhandenen Katalog umgesetzt. Die Tests schützen die bestehende Lern-/Altdatenwirkung; Ereignisschema, Speicherweg, Lückenregel und D5 wurden in diesem Teil nicht geändert.

EV-3.1 ist **noch nicht als ganze Story abgenommen**: Die neue Leseliste ist keine Auswahl je Kriterium. Das alte Einzelevaluationsformular bleibt auf seinen bisherigen Umfang beschränkt. Auswahl und Speicherung aller Standards je Kriterium sowie der durchgängige Nachweis „ohne Quest speichern → Hauptquest ergänzen → Lücke/Fokus“ benötigen EV-2 und EV-4 mit gemeinsamem Integrationstest.

EV-3.3 (Beispiele für Grundlage-Aufgaben) bleibt ein eigener, notwendiger nachfolgender Teil vor oder mit M2. Dieser Katalogteil ersetzt ihn nicht. Kein Gerätetest, Merge, Deployment oder abschließender Nachweis von Ziel 1.

## Integrationskorrektur F1/F2 am 17.11.2026

### Problem

Gemeinsame Startbasis `e86c2a51deb0d17155c0e11d95ee89ba02653f8a`, Baum `6bcb0911b0ee421c42a3197b9546fc664d90fa2d`, aus PR #209 (`3d910802`), #210 (`6b61221b`) und #211 (`f868e0e`), Produktmain `bb10457`. Die von Atlas berichteten 922 grünen Basistests ersetzten keine Prüfung der danach belegten UI-Fehler.

F1: Der vorhandene Fassungsverlauf las ausschließlich `standard`/`rating` auf Evaluationsebene. Gültige neue Kriterienevents zeigten dadurch `undefined`. Im wieder erlaubten Test-11-Format `unmapped` entstand außerdem aus dem technischen Gesamtwert `N` fälschlich „Braucht Unterstützung“ statt der ursprünglichen Einzelnoten.

F2: Lange gespeicherte Kriterien verbreiterten die automatisch aufgeteilte Rubriktabelle; Elternlinks mit `white-space:nowrap` konnten ebenfalls über schmale Ansichten hinausragen. Der von Atlas berichtete historische CI-Fehler auf `d077fbc`, Run `44110229601`, Job `134133511798`, maß im alten 60-Aufgaben-EV3-Test 336/320 px. Seine genaue Ursache bleibt unbekannt. Eine Schriftursache wurde nicht nachgewiesen.

### Umgesetzt

- Der bestehende Verlauf zeigt je Revision Originalkriterium, zugeordneten Bereich und ursprüngliche Einzelnote. Leere Einstufung, ausdrücklich `none` und fehlende Test-11-Zuordnung erhalten eindeutige DE/EN-Texte. Der technische Gesamtwert `N` wird dabei nicht als Lehrkraftnote verwendet. Die bisherigen M-N3/M-N5-Zeilen und Revisionsaktionen bleiben erhalten.
- Nur betroffene Darstellungen angepasst: Rubrik mit festen Spalten und umbrechenden Zellinhalten/Noten, Umbruch langer Texte in Schuldetails und Umbruch der bestehenden Elternlinks. Kein Abschneiden und kein globales Verstecken horizontalen Überlaufs.
- Regressionen speichern ausdrücklich erfundene Daten über den echten `eventHook` nach Anmeldung/Kindregistrierung und öffnen die vorhandene Elternanzeige. Sie prüfen Ableitung `{E-W1:C,E-S1:RS}`, Originalrubrik, E/C/RS, unbewertetes M-N1, `none`, Original-/Korrektur-/Rücknahmeverlauf, Test-11-Altdaten sowie 320 px und Tastaturbedienung in DE/EN.
- Breitenmessungen erfolgen nach `document.fonts.ready` und zwei Renderframes, damit Schriftmetriken und Layout nach dem Rendern feststehen. Die Breitenassertion bleibt unverändert streng bei 320 px. Dies ist eine Messbedingung, keine Erklärung des historischen CI-Fehlers.

### Prüfung

Eigene native Prüfungen dieser Fortsetzung, keine Übernahme fremder oder früherer PASS-Ergebnisse. Tatsächlich abgefragte Versionen: `/usr/bin/chromium` = **156.0.8078.79**, `/workspace/.cache/bq-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell` = **141.0.7390.37**; vorhandenes Playwright 1.56.1. Nur lokale App und vorhandener GitHub-Nachbau mit erfundenen Testdaten, keine Produktionszugriffe.

| Prüfung | Tatsächliches Ergebnis |
|---|---|
| Neue F1/F2-Browserregression, Produktindex unverändert `e86c2a5`, Chromium 156 | **2 rot, Exit 1**: sichtbares `undefined`; Langwort-Rubrik 1453/320 px |
| Dieselben Gegenproben, Produktindex unverändert `e86c2a5`, Chromium 141 | **2 rot, Exit 1**, gleiche Fehler; Rubrikrand 1452,75 px |
| Zusätzlicher Test-11-unmapped-Fall vor seiner Korrektur, Chromium 141 | **Rot, Exit 1**: `undefined` und fälschlich aus `N` abgeleitetes „Braucht Unterstützung“ |
| Erster Fix: gesamte `evaluation-eltern-browser.test.mjs` und `schulische-einstufungen.test.mjs`, Chromium 141 | 9 bestanden, Exit 0, 201521 ms; einschließlich bestehender langer Legacy-/Zweigerätekette und alter 60-Aufgaben-Ansicht |
| Finaler F1/F2/unmapped-Fokus, Chromium 141 | **3 bestanden, Exit 0**, 26482 ms |
| Finaler F1/F2/unmapped-Fokus, Chromium 156 | **3 bestanden, Exit 0**, 26874 ms |
| Alter EV3-60-Aufgaben-Fokus zusätzlich auf Chromium 156 | bestanden, Exit 0 |
| Genau ein vollständiger `CHROMIUM_PATH=…/headless_shell npm test` auf eingefrorenem `91bf85b21ff2baf918e9972f54b678751d2ba890` | **925/925 bestanden, 0 Fehler, 0 übersprungen, Exit 0**, 307149 ms; mit Chromium 141.0.7390.37 ausgeführt und am 17.11. um 16:28 UTC als beendet bestätigt |
| `git diff --check` | bestanden |

Reproduktion der neuen Fälle: `CHROMIUM_PATH=<einer der beiden Pfade> node --test --test-name-pattern='integration F' tests/evaluation-eltern-browser.test.mjs`. F1/F2 wurden zuerst mit den neuen Tests gegen den unveränderten Basisindex ausgeführt, anschließend mit der Korrektur. Das zusätzliche unmapped-Gegenbeispiel wurde auf dem Zwischenstand vor dieser speziellen Anzeigeanpassung ausgeführt.

### Gefunden und Grenzen

Die feste Tabellenaufteilung und der erlaubte Wortumbruch beseitigen den tatsächlich reproduzierten Überlauf; die beiden Browser zeigten beim Langkriterien-Gegenbeispiel denselben Defekt. Das erklärt nicht rückwirkend den einzelnen historischen 336-px-CI-Fall. Historische PASS- und FAIL-Ergebnisse oben bleiben erhalten.

Datenmodell, Katalogvertrag und native Quellen sind unverändert. Keine neue EV4-Auswahl oder Formularfunktion, keine neue Lückenregel, keine Veröffentlichung, kein Main-Merge und keine Geräteabnahme. Reale Ausführungskosten sind **unbekannt**; es liegt keine belastbare Kostentelemetrie vor.

Nach diesem vollständigen Lauf wurden nur dieses Prüfprotokoll und die freigegebene Aussage zu Dokumentupdates in bestehenden Code-PRs im EV-1-Prüfbericht korrigiert. Der Arbeitsbaum war während des Laufs sauber, der geprüfte Kopf blieb `91bf85b`. Produkt- und Testgleichheit des anschließenden Berichtskopfs wird durch `git diff --name-only 91bf85b HEAD` (nur die beiden Berichte) und eine leere Differenz aller übrigen Dateien belegt. Kein weiterer Gesamtlauf und keine Produktänderung nach diesem Nachweis; die gemeinsame Draft-PR wird einmalig auf dem abschließenden Berichtskopf eröffnet.
