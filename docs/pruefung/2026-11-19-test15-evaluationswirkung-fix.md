# TEST15-WIRKUNG-FIX-01-v1 · lokaler Korrektur- und Prüfstand

**Aktueller Stand 20.11.2026: Kriterien-/Gehalten-Anschluss lokal bestanden, unabhängige Endprüfung und Gesamt-CI offen.** Die ausdrücklich freigegebene Fortsetzung schließt den unabhängigen W1-Quellbefund fachlich an; lokale Nachweise stehen im letzten Abschnitt. Unabhängige Endprüfung, vollständige CI und echte Geräteabnahme werden daraus nicht vorweggenommen. Sämtliche früheren Fehler und Abbrüche bleiben als getrennte Historie erhalten.

**Historischer lokaler Stand vor der unten dokumentierten Fortsetzung: ANGEHALTEN, kein Gesamt-PASS.** Die direkte D5-Prüfung (1/1), die gezielte Formular-/Legacy-/Revisionsgruppe (5/5) und der zusätzliche Upgrade-Browsertest (1/1) sind lokal bestanden, jeweils ohne Fehler, Abbruch oder Skip. Das anschließend **einmalig** ausgeführte `npm test` endete mit Exit 1: **1091 Tests, 1090 bestanden, 1 fehlgeschlagen, 0 abgebrochen, 0 übersprungen**. Der bestehende Leistungstest `tests/module/lesen.test.mjs:179` misst 68,2 ms Median statt der geforderten weniger als 50 ms. Keine Wiederholung, Schwellenänderung oder Reparatur wurde begonnen. Der frühere D5-Timeout vom 19.11. ist unten ausdrücklich als frühere Prüfphase erhalten.

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

## Integrationsnachtrag 20.11.2026 · neue Hauptbasis mit W1

### Anliegen und Umsetzung

Nach der ausdrücklichen Merge-Freigabe zu PR #233 enthält `main` inzwischen PR #231: `f7e9ce66ba70ec366b82e1a80ec60d80b63ab79f`. Die dort bereits angenommene W1-Regel entfernt Tageshürden. Atlas führte diese Hauptbasis konfliktfrei in den Korrekturzweig zusammen; Ausgang dieses begrenzten Nachtrags ist `3a470b61fffdfe606a3ed5bb6a44a7d76d87aa46`. Ausführende Codex-Instanz: `/root/codex_pr233_main_test_compat`.

Nur die veraltete Erwartung im vorhandenen Formular-/Kindabgleichtest wurde angepasst: sechs eigene falsche Antworten an einem Tag ergeben nun ebenfalls RS. Die bisherigen Mengen- und Datumslagen bleiben erhalten; fünf Antworten an einem Tag ergänzen die symmetrische Grenze. Geprüft werden somit 5/1 → C, 5/2 → C, 6/1 → RS und 6/2 → RS. Der Produktfilterfix, Produktionscode, W1-Grenzwerte, native Hülle, Test-Timeouts, Skripte und CI bleiben durch diesen Nachtrag unverändert.

### Einmalige lokale Prüfung

```sh
CHROMIUM_PATH=/usr/bin/chromium node --test --test-name-pattern='EV4/EV7 manual|EV7 D5' tests/evaluation-eltern-browser.test.mjs
```

**Lokal bestanden, Exit 0:** 2 Tests, 2 bestanden, 0 fehlgeschlagen, abgebrochen, übersprungen oder Todo; insgesamt 76,199 Sekunden. Formular-/Kindabgleich: 65,862 Sekunden; direkter D5-Fall mit beiden Themenlagen: 9,561 Sekunden. Rohlog: `/tmp/pr233-main-targeted-20261120.log`. Das vorhandene Playwright wurde aufgelöst, keine Installation vorgenommen. Keine weitere Vollsuite oder Wiederholung durch diese Instanz.

Die früheren lokalen Abbrüche und der Vollsuite-Leistungsfehler bleiben oben unverändert als tatsächliche Prüfhistorie erhalten. Für den vorherigen Kopf `b79abe289694c5a9c34109fb5a6df2c6d696da74` stehen die späteren [unabhängigen und vollständigen CI-Nachweise](https://github.com/pahlborn/bis-school-app_src/pull/233#issuecomment-7031693431) getrennt im PR. Diese werden nicht als neue Prüfung der W1-Integration ausgegeben.

### Offener unabhängiger Integrationsbefund und Halten

Atlas meldete während dieses Zweierlaufs einen neuen, noch ungeklärten unabhängigen Befund: `gapSchoolRatings` in `src/module/lueckenverlauf.mjs` schließe weiterhin alle `manual`-Einträge aus. Diese Instanz hat den Befund nicht selbst geprüft oder korrigiert; die zwei bestandenen Browserfälle belegen keine vollständige W1-Verlauf-/Gehaltenwirkung. Auf ausdrücklichen Folgeauftrag von Atlas werden ausschließlich die beauftragte Testerwartung und dieser Nachtrag gesichert, danach wird angehalten. Keine weitere Prüfung, Produktänderung, CI-Auslösung, Merge oder Veröffentlichung durch diese Instanz. Atlas klärt den Befund vor einem Merge; echter iPad-/Browser-Gesamtnachweis und EV-7 bleiben offen.


## Freigegebener Kriterien-/Gehalten-Anschluss · 20.11.2026

### Anliegen und Ausgangspunkt

[Auftrag PR233-CRITERIA-HELD-V1](https://github.com/pahlborn/bis-school-app_src/pull/233#issuecomment-7037798037), ausdrücklich freigegebener Codex-Entwickler `/root/codex_pr233_criteria_held`. Peter erlaubt erforderlichenfalls mehr als eine Stunde. Atlas integrierte main `04323435adc92253397d0ef56f278d1d964fde69` einschließlich der angenommenen W1- und Titelregeln; sauberer Startkopf `89ec48a8a06bd61491286596fa6ad2154f8b9928` im bestehenden Produkt-Worktree. Die alte Zweitagesregel wird durch die angenommene W1-Regel übersteuert.

Der [unabhängige Blocker](https://github.com/pahlborn/bis-school-app_src/pull/233#issuecomment-7034476215) war richtig: `gapSchoolRatings` schloss Kriterienzeilen mit manuellen Revisionsmetadaten aus, und `derive` bezog seine W1-Schulquelle ausschließlich aus `school_import`. Dadurch fehlte neuen Kriterienbewertungen der Verlauf bis gehalten, obwohl der frühere Fix Lücke/Fokus/Start/D5 bereits aktivierte. Die bestandenen zwei früheren Wirkungsfälle prüften diesen Abschluss nicht.

### Umsetzung innerhalb des bestehenden Pfads

- `gapSchoolTask` ist die gemeinsame Auswahl für reguläre Schulzeilen in Anzeige/Startwert und W1-Projektion: gültige Kriterienbewertungen zählen mit, alte Einzelstandard-Pilotzeilen, vorgemerkte und zurückgenommene Zeilen bleiben ausgeschlossen.
- Die bestehende Revisions-/Konfliktauswahl wird von `deriveSchool` und dem W1-Schulkontext gemeinsam verwendet. Neu bestätigte Kriterien, Korrekturen und Rücknahmen wirken damit auf denselben aktuellen Quellenstand.
- Der vorhandene abgeleitete `gaps`-Kontext hält kompakt Import-Ratings und Revisionsverknüpfungen mit Standard-Ratings für Fortschreibung und Snapshots. Quelltexte werden nicht kopiert. Dies ist ein berechneter Cache desselben Ereigniswegs, kein zweiter Schul-Speicherweg und kein neues Ereignisformat.
- W1 bleibt unverändert: sechs eigene Antworten ohne Tage für den Wissensstand; die M-erreichende Antwort ist nicht Teil der folgenden Sechsergruppe; mindestens fünf unabhängige Erstlösungen; nach einer nicht bestandenen Gruppe die nächsten getrennten sechs. Keine rollenden Fenster, Hilfegrenzen-/Stern-/Titeländerung, neue Oberfläche oder native Änderung.

### Tatsächliche lokale Prüfung dieser Fortsetzung

Ausschließlich erfundene Evaluationen, Konten und Antworten. Node24, vorhandenes Playwright und `/usr/bin/chromium`; keine Abhängigkeiten installiert und keine Tests, Schwellen, Zeitlimits oder CI gelockert.

| Lauf | Ergebnis und Grenze |
|---|---|
| Erste angelegte Rotkontrolle | **Ungültiger Setup-Gegenbeleg**, Exit1, 1 Test/0 bestanden: Im neuen Fixture fehlte das vorgeschriebene synthetische Erwachsenenkonto. Keine Produktassertion erreicht. Nach Meldung erlaubte Atlas ausschließlich die notwendige Fixturekorrektur. Log `/tmp/pr233-criteria-held-red-20261120.log`. |
| Korrigierte Vorfix-Gegenprobe | **Bewusst erwartetes Produkt-FAIL**, Exit1, 1 Test/0 bestanden, 0 Abbrüche/Skips. Gültiger Kriterienevent und sechs echte Erstantworten erreicht; dann fehlt `reached` im W1-Verlauf. Log `/tmp/pr233-criteria-held-red-valid-20261120.log`. Assertions danach nicht abgeschwächt. |
| Neue Modulgruppe | **4/4 bestanden**, Exit0, 0 Fehler/Abbrüche/Skips/TODO; 0,604s. Log `/tmp/pr233-criteria-held-module-20261120.log`. |
| Bestehende W1-/EV2-/Ableitungs-/Snapshot-Gruppe | **94/94 bestanden**, Exit0, 0 Fehler/Abbrüche/Skips/TODO; 15,006s. Log `/tmp/pr233-criteria-held-regression-20261120.log`. |
| Erster neuer echter Browserfall | **FAIL der neu angelegten Auditannahme**, Exit1, 1 Test/0 bestanden. Formularbestätigung, 18 Antwortklicks und die Gehalten-Grenzen waren erreicht; danach erwartete der neue Audit fälschlich 18 statt21 `answer`-Datensätzen. Die drei angeklickten Hilfen erzeugen zusätzlich bestehende Hinweisdatensätze, keine zusätzlichen bearbeiteten Aufgaben. Log `/tmp/pr233-criteria-held-browser-20261120.log`. Kein Produktfehler daraus abgeleitet. |
| Korrigierter neuer Browserfall | **1/1 bestanden**, Exit0, 0 Fehler/Abbrüche/Skips/TODO; 15,268s. Prüft 18 echte Erstversuche plus drei separate Hinweise; Formular→Kindantworten→Abschluss, Snapshot, Kind-Reload und Elternabgleich. Log `/tmp/pr233-criteria-held-browser-corrected-20261120.log`. |
| Gezielte Browserregression vor Alt-Prefix-Hydration | **5/5 bestanden**, Exit0, 0 Fehler/Abbrüche/Skips/TODO; 283,849s. Legacykorrektur/-rücknahme, vollständiger Formular-/Kindabgleich, D5, neuer Gehaltenfall einschließlich genau18 Aufgabenplätzen sowie Dokumentrevision/Konfliktauflösung/Rücknahme. Log `/tmp/pr233-criteria-held-browser-regression-20261120.log`. |
| Geplante Alt-Prefix-Gegenprobe | **Bewusst erwartetes FAIL**, Exit1, 1 Test/0 bestanden: Ein tatsächlich vom Vorfix04323435 erstellter Snapshot verliert bei `stateFrom` trotz vorhandener Wurzel die Kriterienquelle vor dem Antwortcut. Log `/tmp/pr233-criteria-held-prefix-red-20261120.log`. |
| Finale Modulgruppe nach Hydration | **100/100 bestanden** (6 neue +94 vorhandene), Exit0, 0 Fehler/Abbrüche/Skips/TODO; 10,952s. Log `/tmp/pr233-criteria-held-final-module-20261120.log`. |
| Finaler realer Browserfall nach Hydration | **1/1 bestanden**, Exit0, 0 Fehler/Abbrüche/Skips/TODO; 14,570s. Log `/tmp/pr233-criteria-held-final-browser-20261120.log`. |

Befehle:

```sh
node --test --test-name-pattern='criteria held: twelve' tests/module/evaluation-gehalten.test.mjs
node --test tests/module/evaluation-gehalten.test.mjs
node --test tests/module/luecken-gehalten.test.mjs tests/module/evaluation-kriterien.test.mjs tests/module/school-evaluation.test.mjs tests/module/ableitung.test.mjs tests/module/schnappschuss.test.mjs
node --test --test-name-pattern="actual pre-fix snapshots" tests/module/evaluation-gehalten.test.mjs
node --test tests/module/evaluation-gehalten.test.mjs tests/module/luecken-gehalten.test.mjs tests/module/evaluation-kriterien.test.mjs tests/module/school-evaluation.test.mjs tests/module/ableitung.test.mjs tests/module/schnappschuss.test.mjs
CHROMIUM_PATH=/usr/bin/chromium node --test --test-name-pattern='EV7 criteria held' tests/evaluation-eltern-browser.test.mjs
CHROMIUM_PATH=/usr/bin/chromium node --test --test-name-pattern='EV4/EV7 manual|EV7 D5|EV7 criteria held|legacy correction drafts|EV4 revisions' tests/evaluation-eltern-browser.test.mjs
```

Die neue Modulgruppe vergleicht echte Live-Aufzeichnungen und Replay, hält nach vier unabhängigen Erstlösungen von sechs offen und erreicht gehalten mit fünf in der nächsten getrennten Gruppe. Revision, Rücknahme und ersetzender Import ergeben an jedem geprüften Snapshot-Schnitt denselben aktuellen Quellen- und Verlaufsstand wie vollständiges Ableiten. Alter Pilot, vorgemerkte und zurückgenommene Zeilen bleiben separat.

Der neue Browserfall bestätigt die Evaluation über das echte angemeldete Elternformular. Nur die Auswahl existierender Jahrgangsstufen-Multiple-Choice-Fragen für die Prüfungsrunde wird deterministisch vorbereitet; Antwortschaltflächen, Hilfe, Bewertung, Erstantwortschreiber, Ereignisse, Abschluss und Geräteabgleich sind produktiv. Die normale Aufgabenauswahl/D5 wird separat erhalten geprüft. Nach sechs Antworten ist M erreicht und die Lücke noch offen. Vier unabhängige Erfolge der folgenden sechs reichen nicht; fünf in der nächsten getrennten Gruppe schließen automatisch. Drei Hinweisdatensätze belegen keine zusätzlichen Aufgabenplätze. Kind-Reload und tatsächlicher Eltern-Geräteabgleich erhalten die Schließung; ein tatsächlicher Snapshot des Ereignisverlaufs liefert denselben Stand wie Vollableitung.

### Alt-Prefix-Hydration und Informationsgrenze

Ein alter Snapshot kann noch keinen Kriterien-Quellkontext enthalten. `stateFrom` reicht bei bekanntem, passendem Altbestand die gültigen ursprünglichen Ereignisse trotzdem mit: Die ergänzte kleine Hydration merkt deshalb nur tatsächlich verfügbare Schulereignisse **vor** dem Snapshot-Antwortcut. Antworten werden weiterhin ausschließlich **nach** dem Cut abgespielt. Kein neuer Speicherweg, keine Migration, keine ausgedachte Wurzel und keine doppelt gezählte Antwort.

Die positive Regression verwendet eine echte `makeSnapshot`-Erstellung aus dem akzeptierten, unveränderten Commit `04323435adc92253397d0ef56f278d1d964fde69`, einschließlich dessen eigenem `derive`. Sie bestätigt den fehlenden Neukontext vor der Umstellung und prüft eine spätere Kriterienkorrektur sowie Rücknahme über den produktiven `stateFrom`-Weg. Ergebnis: dieselbe Quelle und derselbe Verlauf wie Vollableitung, zwölf statt doppelt gezählter alter Antworten, und eine gespeicherte historische Elternschließung bleibt erhalten.

Die negative Regression gibt nur einen solchen Alt-Prefix plus eine verwaiste Korrektur ohne ursprüngliche Wurzel weiter: keine erfundene Schulquelle und kein rückwirkendes Gehalten. Ein später tatsächlich verfügbarer Wurzeleintrag kann die vorhandenen realen Daten wieder erschließen. **Snapshot-only ohne verfügbare Wurzel ist damit ausdrücklich kein pauschal gelöster Informationsmangel.** Es wird kein Erfolg ohne Quellbeleg behauptet.

`git diff --check` und Syntaxprüfung von Ableitung/Browsertest: Exit0. Die Produktdateien wurden nach dem finalen 100er-Modul- und echten Browserlauf nicht weiter geändert.

### Grenzen und Übergabe

Kein eigener Gesamt-`npm test`, kein Push, Merge, Veröffentlichen, CI- oder echter iPad-PASS durch diese Instanz. Atlas übernimmt den sauberen Commit zur unabhängigen Prüfung und vollständigen Standard-CI. Die frühere lokale Leistungstestabweichung und alle Abbrüche bleiben oben erhalten; sie werden nicht in Erfolge umgedeutet. Ziel1 und EV7 sind erst nach den getrennten echten Geräte-/Browserabnahmen angenommen.
