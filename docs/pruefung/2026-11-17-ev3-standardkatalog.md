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
