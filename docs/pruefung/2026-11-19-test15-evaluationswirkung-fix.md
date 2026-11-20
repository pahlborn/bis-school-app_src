# TEST15-WIRKUNG-FIX-01-v1 · lokaler Korrektur- und Prüfstand

**Aktueller Stand 20.11.2026: ANGEHALTEN, kein Gesamt-PASS.** Die direkte D5-Prüfung (1/1), die gezielte Formular-/Legacy-/Revisionsgruppe (5/5) und der zusätzliche Upgrade-Browsertest (1/1) sind lokal bestanden, jeweils ohne Fehler, Abbruch oder Skip. Das anschließend **einmalig** ausgeführte `npm test` endete mit Exit 1: **1091 Tests, 1090 bestanden, 1 fehlgeschlagen, 0 abgebrochen, 0 übersprungen**. Der bestehende Leistungstest `tests/module/lesen.test.mjs:179` misst 68,2 ms Median statt der geforderten weniger als 50 ms. Keine Wiederholung, Schwellenänderung oder Reparatur wurde begonnen. Der frühere D5-Timeout vom 19.11. ist unten ausdrücklich als frühere Prüfphase erhalten.

## Anliegen

Kriterienbezogene, bestätigte `school_evaluation`-Ereignisse sollen auf die regulären Schullücken, den automatischen Fokus und die Startschwierigkeit wirken (EV-7.1, EV-7.2 und EV-7.4). Der bisherige Wirkungsfilter schloss sie wegen ihrer `manual`-Revisionsmetadaten aus.

Auftrag: [Korrekturauftrag](https://github.com/pahlborn/bis-school-app_src/pull/206#issuecomment-7020117752), [unabhängiger Vorbefund](https://github.com/pahlborn/bis-school-app_src/pull/206#issuecomment-7012198219). Ausführende Instanz: Codex. Basis: `1ea91622e7f55dbc4a0bebcc89bd199bade31928`; Zweig: `fix/test15-evaluation-effects-20261119`.

Fortsetzung am 20.11.2026 durch einen ausdrücklich freigegebenen Codex-Vertreter, ausgehend vom sauberen WIP-Commit `e7e108220305d62298017a480859a45b169d5abe`. Freigegeben ist die direkte D5-Aufgabenprüfung und Fertigstellung des Korrekturstands. Kein Merge oder Veröffentlichen; [Dauerauftrag](https://github.com/pahlborn/bis-school-app_src/pull/206#issuecomment-7031055261).

## Umgesetzt

- `schoolRatings` lässt das bereits validierte und abgeleitete Kriterienformat im regulären Wirkungsfilter zu. Alte manuelle Einzelstandard-Pilotzeilen bleiben ausgeschlossen. Revisions- und Rücknahmemetadaten bleiben erhalten; `classTopics` und der Sonderkartenpfad sind unverändert.
- Der vorhandene Formular-Browsertest prüft nach echter Bestätigung die sichtbare aktive M-N1-Lücke, den tatsächlichen automatischen Fokus, `schoolStandFor` und `standOf` sowie die Grenze von sechs eigenen Antworten an zwei Übungstagen. Eine Legacy-Assertion schützt den Ausschluss alter Pilotzeilen aus der regulären Lückenspur.
- Die zusätzliche D5-Prüfung bleibt im bereits von `npm test` erfassten Browsertest. Sie ruft nach echter Formularbestätigung die produktive Funktion `buildToday` für das angezeigte Kind auf: mit anderem aktuellem Thema sowie ohne anderes aktuelles Thema. Der zusätzliche Geräteabgleich dieses isolierten Teils entfällt entsprechend der Freigabe vom 20.11.; der eigenständige vollständige Formular-/Bestätigungs-/Kindabgleichfall und seine Assertions bleiben unverändert. Keine Algorithmusnachbildung, Timeout-Erhöhung oder Test-Skips.
- Auf ergänzenden Auftrag wurde ausschließlich die Versionsvorbereitung auf `0.152.5-beta` vorgenommen: Paketversion, strikte Versionserwartungen und ein DE/EN-Eintrag in den vorhandenen Release Notes. Keine Abhängigkeiten, Skripte oder CI-Konfiguration geändert.

## Prüfung

Umgebung: Node 24.22.1, vorhandenes Playwright 1.56.1, Chromium 156.0.8078.79 über `/usr/bin/chromium`. Ausschließlich erfundene Testdaten und lokaler Speichernachbau; keine produktiven Konten oder Daten.

### Prüfhistorie 19.11.2026: geplante rote Vorfix-Gegenprobe

Vor der Produktänderung, gegen den unveränderten Produktcode der genannten Basis:

```sh
CHROMIUM_PATH=/usr/bin/chromium node --test --test-name-pattern='EV4/EV7 manual' tests/evaluation-eltern-browser.test.mjs
```

**Erwartungsgemäß rot:** ein Test, null bestanden, einer fehlgeschlagen. Das echte Formularsetup erreichte die Vorschau ohne gespeichertes Ereignis, genau ein Ereignis nach doppelter Bestätigung und die Ableitung M-N1=C / M-N3=M. Erst die Wirkungsassertion scheiterte: `.pgap.on` ergab `0` statt `1` (`confirmed M-N1=C is visibly the active school gap`). Die Assertions wurden für den Nachfixlauf nicht abgeschwächt.

### Prüfhistorie 19.11.2026: gezielter Nachfixlauf

```sh
CHROMIUM_PATH=/usr/bin/chromium node --test --test-name-pattern='EV4/EV7 manual|EV7 D5' tests/evaluation-eltern-browser.test.mjs
```

**Gesamtlauf ABGEBROCHEN, Exit 1:** zwei Tests, einer lokal bestanden, keiner als fachlicher Assertionsfehler gezählt, einer `cancelled` durch Timeout.

- **Formularfall lokal bestanden** (65,533 Sekunden): sichtbare aktive M-N1-Lücke, keine zusätzliche M-N3-Lücke bei Einstufung M, `numbers` im tatsächlichen automatischen Fokus, Schulstartwert C ohne eigene Antworten; fünf Antworten an zwei Tagen → C, sechs Antworten an einem Tag → C, sechs Antworten an zwei Tagen → eigene Einstufung RS. Die gespeicherte Evaluation blieb erhalten.
- **D5 ABGEBROCHEN** (120,188 Sekunden): `tests/evaluation-eltern-browser.test.mjs:625:1`, Meldung `test timed out after 120000ms`. Der Lauf liefert keinen vollständigen D5-Abnahmenachweis. Eine innere Fehlerstelle oder Ursache wurde nicht festgestellt; nach dem Abbruch erfolgten keine Diagnose, Wiederholung oder weitere Korrektur.

`git diff --check` war vor der Sicherung ohne Befund. Die lokalen Ergebnisse haben keinen CI-Lauflink und sind keine grüne CI-Aussage.

### Genehmigter begrenzter Prüfschritt 20.11.2026

Zuerst wurde D5 isoliert geprüft:

```sh
CHROMIUM_PATH=/usr/bin/chromium node --test --test-name-pattern='EV7 D5' tests/evaluation-eltern-browser.test.mjs
```

**Lokal bestanden, Exit 0:** 1 Test, 1 bestanden, 0 fehlgeschlagen, 0 abgebrochen, 0 übersprungen; 10,832 Sekunden gesamt (Fall: 10,126 Sekunden). Log: `/tmp/test15-d5-direct-20261120.log`.

Nach der echten Bestätigung von M-N1=C und M-N5=RS bleibt ausschließlich M-N1 als reguläre Lücke offen. Der Nebenstandard M-N5 erzeugt keine falsche M-N4-Lücke. Die beiden Themenlagen werden durch echte `school_import`-Ereignisse mit erfundenen Daten vorbereitet und durch `classTopics()` überprüft. Je Lage werden fünf echte `buildToday()`-Rückgaben geprüft:

- **Anderes aktuelles Thema `forces`:** `numbers` im tatsächlichen automatischen Fokus, Achterrunde mit genau zwei `numbers`-Aufgaben, beide aus der regulären Lückenspur; `forces` wird tatsächlich berücksichtigt.
- **Kein anderes aktuelles Thema (`classTopics() = ['numbers']`):** `numbers` im automatischen Fokus und acht passende Aufgaben in der Achterrunde. Die aktive Lücke ist dabei selbst das einzige aktuelle Thema.
- Keine der zehn Rückgaben enthält eine alte Pilotkarte (`schoolRevision`); Importe und Aufgabenwahl verändern die bestätigte Evaluation nicht.

Danach die gezielte Regression und zusätzlich der nicht in `npm test` enthaltene Upgrade-Test:

```sh
CHROMIUM_PATH=/usr/bin/chromium node --test --test-name-pattern='EV4/EV7 manual|EV7 D5|legacy correction drafts|EV4 revisions|EV4 legacy document' tests/evaluation-eltern-browser.test.mjs
CHROMIUM_PATH=/usr/bin/chromium node --test tests/evaluation-upgrade-browser.test.mjs
```

| Heutiger Lauf | Tatsächliches lokales Ergebnis |
|---|---|
| Gezielte Fünfergruppe | Exit 0; 5 Tests, 5 bestanden, 0 fehlgeschlagen/abgebrochen/übersprungen; 312,112 Sekunden. Legacy-Kartenkorrektur und -Rücknahme einschließlich des regulären Pilot-Ausschlusses; vollständiger Formular-/Kindabgleichfall (65,107 Sekunden); D5 (8,650 Sekunden); Kriterienrevision mit Konfliktschutz/Auflösung/Rücknahme; Legacy-Dokumentkorrektur und explizite Kriterienzuordnung. Log: `/tmp/test15-targeted-20261120.log` |
| Eigenständiger Upgrade-Browsertest | Exit 0; 1 Test, 1 bestanden, 0 fehlgeschlagen/abgebrochen/übersprungen; 101,150 Sekunden. Der exakt gepinnte historische Client verwirft das Ereignis; das Upgrade holt auf demselben angemeldeten Kindprofil genau ein Ereignis nach und erzeugt eine korrekt zugeordnete Karte. Log: `/tmp/test15-upgrade-20261120.log` |

Der vollständige unveränderte Testsatz wurde anschließend einmal gestartet:

```sh
CHROMIUM_PATH=/usr/bin/chromium npm test
```

**Lokal fehlgeschlagen, Exit 1:** 1091 Tests, 1090 bestanden, 1 fehlgeschlagen, 0 abgebrochen, 0 übersprungen, 0 Todo; 851,659 Sekunden gesamt. Log: `/tmp/test15-npm-test-20261120.log`.

Der einzige Fehler ist `tests/module/lesen.test.mjs:179:1`, Assertion in Zeile 202: `median < 50`. Gemessen wurden für eine Antwort (zwei Ereignisse schreiben und fünf Werte lesen) **68,2 ms Median**, maximal 180,8 ms; vollständiges Ableiten 294 ms. Die vorherigen funktionalen Assertions desselben Falls (ein vollständiges Ableiten, 80 Fortschreibungen und Gleichheit mit `derive`) erreichten diese letzte Assertion ohne Fehler. Der Leistungstest und `src/module/lesen.mjs` sind gegenüber der genannten Basis unverändert (`git diff` leer). Eine Ursache für die Zeitüberschreitung oder eine Einstufung als Umgebungsfehler ist damit nicht bewiesen; es gab keinen isolierten Wiederholungslauf und keine weitere Diagnose.

Die vollständige Evaluationsdatei einschließlich des unveränderten Formular-/Kindabgleichfalls und des direkten D5-Falls wurde im Gesamtlauf bestanden. Der gesamte Testsatz ist wegen des genannten Leistungstests trotzdem **nicht grün**. Es gilt die angeordnete Halteregel bei neuem unerwartetem Prüfversagen; keine weitere Prüfung, kein Retry, keine Änderung am Leistungstest oder an Werkzeugen, Abhängigkeiten, Produktcode oder Version. Der Abschlusscommit nach erfolgreicher Vollsuite wurde nicht erstellt.

## Gefunden und Grenzen

Die geplante Gegenprobe vom 19.11. bestätigt den Filterfehler im synthetischen Formularpfad. Der vollständige Formular-/Kindabgleichfall wurde am 20.11. unverändert erneut ausgeführt und lokal bestanden: bestätigte M-N1-Lücke sichtbar, M-N3=M ohne zusätzliche Lücke, `numbers` im automatischen Fokus, Schulstartwert C sowie 5 Antworten/2 Tage → C, 6/1 → C, 6/2 → eigene Einstufung RS. Ein Geräte-Ursachennachweis folgt daraus nicht.

Der unerwartete D5-Abbruch vom 19.11. und das damalige Anhalten bleiben als Historie erhalten. Am 19.11. wurden weder Vollsuite noch Upgrade- oder vollständige Legacy-/Revisions-/Rücknahmeregression durchgeführt; die heutigen Ausführungen stehen getrennt oben. Es gab keine pauschale Timeout-Erhöhung und keine Reparatur an Werkzeugen, Abhängigkeiten oder CI.

**Aktuelle Blockade:** Die einmalige Vollsuite vom 20.11. ist am bestehenden Leistungskriterium gescheitert. Der D5-Nachweis und die gezielten Regressionen sind davon als tatsächliche lokale Teilergebnisse getrennt; aus ihnen wird kein vollständiger Erfolg abgeleitet. Der Arbeitsstand bleibt zur Entscheidung bei Atlas, ohne neuen Prüf- oder Reparaturversuch.

Abschließendes `git diff --check` am 20.11. vor dem WIP-Checkpoint: Exit 0, kein Befund. Die Fortsetzung ändert gegenüber `e7e108220305d62298017a480859a45b169d5abe` ausschließlich diesen Prüfbericht und `tests/evaluation-eltern-browser.test.mjs`. Der bestehende Filterfix und die vorbereitete Version bleiben unverändert.

Auf ausdrücklichen Folgeauftrag von Atlas wird dieser HALT-Stand als lokaler WIP-Checkpoint für die unabhängige Prüfung gesichert. Das ist kein Abschlusscommit nach erfolgreicher Vollsuite und kein Gesamt-PASS. Nach dem Halten wurden keine weiteren Tests oder Code-/Testkorrekturen durchgeführt.

**D5-Methodikgrenze:** Der heutige isolierte Test ruft die echte produktive Aufgabenwahl im Browser für das im Elternbereich angezeigte Kind auf. Er startet und löst keine Kindrunde über die Oberfläche und wiederholt für diese Quote keinen zusätzlichen Geräteabgleich. Der eigenständige vollständige Formular-/Bestätigungs-/Kindabgleichfall schützt diese Kette gesondert; die D5-Auswahl wird nicht durch einen nachgebildeten Algorithmus ersetzt. Die fünf Rückgaben je Themenlage sind ein begrenzter lokaler Softwaretest, keine iPad-Abnahme.

Unabhängige Abnahme des Kandidaten bleibt offen. Kein Merge, Push, PR, CI-Start, Paket oder Veröffentlichung durch die ausführende Instanz. Keine grüne CI-Aussage ohne Lauflink, kein iPad-PASS; echte Speicherung und Wirkung mit realen Daten sind nicht abgenommen.
