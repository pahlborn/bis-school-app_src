# CI-01 · Rekonstruierte Auswertung v1

## Herkunft, Suchumfang und Abdeckung

Neue Rekonstruktion aus öffentlichen GitHub-Originaldaten, erhoben am 15.11.2026; genauer Abschlusszeitpunkt in [collection.json](snapshot/collection.json). Kein Originaltabellenfund. Einmal gezielt geprüft wurden die zugänglichen lokalen Ablagen `/workspace/library-files`, `/workspace/shared`, `/workspace/scratch`, die CI-01-Remote-Ergebnisbranches sowie der rekursive Repositorybaum des Recovery-Quellcommits `286a2e222e8fe873457504fa75f3ba3f538d0bde`. Dort lagen Auftrag und zusammengefasste Rückgabe, keine ursprünglichen Tabellen und kein Rechenskript. Frühere fremde Chats und unbekannte private Sicherungsorte sind nicht als durchsucht behauptet.

Umfang: `pahlborn/bis-school-app_src`, PR193 und PR198, Run-Erstellung ab **10.11.2026 23:00:00 UTC einschließlich bis 14.11.2026 23:00:00 UTC ausschließlich** (11.–14.11. Europe/Berlin). Drei vollständig gelesene API-Seiten zu je maximal 100 Datensätzen enthalten 100 + 100 + 19 = **219 Runs**. Der Filter verwendet Run-Erstellung, nicht spätere Jobenden. Alle Attempts der 47 ausgewählten Runs werden berücksichtigt. Je Attempt wurde eine Jobseite mit weniger als 100 Einträgen vollständig gelesen; keine fehlenden Jobzeitpunkte bei den 75 ausgeführten Jobs.

Bei sieben Release-Runs ist `run.pull_requests` leer. PR193 wird deshalb über den exakt gleichen PR-Head-Branch **und** die im vollständig gelesenen PR-Commitbestand vorhandene Head-SHA zugeordnet. Die Belege stehen in [pulls.json](snapshot/pulls.json), die Zuordnungsart pro Run in [runs.csv](runs.csv). Ein bloß gleicher Actor reicht nicht. Die übrigen 40 Runs sind PR198 direkt zugeordnet. Nicht ausgewählte Runs bleiben im normalisierten Seitensnapshot für eine unabhängige Auswahlprüfung erhalten; ihre Jobs wurden nicht als Teil dieses Auftrags erhoben.

## Ergebnis und Rechenweg

| PR / Workflow | Runs | Ausgeführte Jobs | Jobzeit |
|---|---:|---:|---:|
| 193 / Verify child first start release | 7 | 44 | 1:33:58 |
| 198 / Evaluation form integration | 9 | 7 | 1:30:34 |
| 198 / Toddle evaluation reader | 9 | 7 | 0:02:45 |
| 198 / Big Quest iPad build | 8 | 7 | 0:02:41 |
| 198 / Big Quest iPad Playgrounds Testpaket | 9 | 7 | 0:00:48 |
| 198 / Big Quest Test 11 - review build blob | 5 | 3 | 0:00:25 |
| Gesamt | **47** | **75** | **3:11:11** |

48 Attempts entstehen durch den zusätzlichen Attempt 2 des Runs **43561866978**. 85 eindeutige Jobdatensätze = 75 mit Step-Ausführungsbelegen + zehn ohne Steps. Jobzeiten sind `completed_at - started_at` aus der API, in Sekunden ohne Minutenrundung. Nur Jobs mit beobachteten Steps gehen in die technische Ausführungssumme ein. Dedupliziert wird nach Run/Attempt/Job-ID; die 85 Job-IDs dieses Snapshots sind außerdem global verschieden. Die Summe ist Job-Wandzeit einschließlich Setup/Teardown, weder CPU-Zeit noch Workflow-Wartezeit noch Abrechnung.

Neun der zehn nicht ausgeführten Jobs haben eine direkt zur Job-/Check-ID passende GitHub-Annotation: „The job was not started because recent account payments have failed or your spending limit needs to be increased.“ Ihre genaue Form ist im [Annotationssnapshot](snapshot/start-refusal-evidence.json) erhalten. Für **Run 43561866978, Attempt 1** ist die alte Check-ID in der aktuellen Suiteansicht nicht mehr vorhanden. Dort sind nur fehlende Steps/Runner und eine kurze API-Zeitspanne direkt belegt; die Verweigerung wird über denselben Run mit dokumentierter späterer Verweigerung eingeordnet, ausdrücklich **abgeleitet**, nicht als alte Originalannotation ausgegeben. Alle zehn zusammen haben 27 Sekunden API-Zeitspanne; diese werden nicht zur Ausführungszeit addiert. Das ist kein Nachweis von null Kosten, sondern von fehlender beobachteter Jobausführung.

Referenzlauf **43561613512**, Job **132346345942**: **875 Sekunden = 14:35**, wie früher berichtet. Die API-Differenz `run_started_at` bis `updated_at` ist hier **879 Sekunden = 14:39**, während früher eine Workflowanzeige von 14:38 berichtet wurde. `updated_at` ist kein verlässlicher separater Workflow-Endzeitpunkt; diese administrative Spanne ersetzt weder die angezeigte Dauer noch die Jobzeit. Gleiches gilt für alle `observed_span_seconds` in der Attempttabelle. Eine vollständige separate Warteschlangendauer ist aus diesen Feldern nicht belegt und wird nicht erfunden.

## Abgleich mit der historischen Rückgabe

Die rekonstruierten **47 / 48 / 85 / 75 und 11.471 Sekunden** stimmen in allen fünf Summen mit der früheren Rückgabe überein; [summary.json](summary.json) enthält jeweils Delta 0. Auch die sechs Workflow-Jobzeitsummen stimmen. Es gibt keine aus Summen erfundenen Job-IDs: jede Zeile stammt aus einem im Snapshot referenzierten API-Abruf.

Die frühere Rückgabe nennt vier gelesene API-Seiten. Diese Rekonstruktion benötigt drei nichtleere Seiten mit `per_page=100`; 219 Runs und die abschließende Seite mit 19 Einträgen sichern die aktuelle Listenabdeckung. Ob früher eine leere Abschlussseite oder eine andere Seitengröße mitgezählt wurde, bleibt ohne Originaldateien unbekannt. Die konkrete Workflowspannendifferenz des Referenzlaufs und die fehlende historische Annotation von Attempt 1 sind oben offengelegt. Die alte Rückgabe wird nicht geändert.

## Bestehende Befunde und höchstens drei Vorschläge

**1. Ältere Kandidaten gezielt zusammenfassen.** [overlaps.csv](overlaps.csv) weist 22 Jobs mit zusammen **5.572 Sekunden = 92:52** nach Erstellung eines neueren Runs desselben Workflows, derselben PR und einer anderen SHA aus. Berechnet wird nur der positive Teil zwischen `max(job.started_at, newer_run.created_at)` und Jobende. Das ist eine beobachtete Überlappungsobergrenze und keine garantierte Einsparung. Gerade beim Nachfolger mit Startverweigerung kann der ältere Lauf der einzig verfügbare Nachweis bleiben. Betroffene Workflowpfade: `.github/workflows/child-first-start-release.yml` und `.github/workflows/evaluation-integration.yml` sowie die zu PR198 gehörenden `toddle-reader.yml`, `ipad-mvp.yml`, `ipad-playgrounds-paket.yml`, `test11-review-blob.yml`. Eine spätere Entscheidung über Concurrency müsste benötigte Nachweise und Freigabeabläufe erhalten; hier wird nichts geändert.

**2. Nachweise nur bei belegter unveränderter Inputidentität wiederverwenden.** Commit **ddd67c3e83e8097f9ea0c549efe6aa16b8422386** ändert laut [Commitsnapshot](snapshot/commits/ddd67c3e83e8097f9ea0c549efe6aa16b8422386.json) nur `docs/pruefung/2026-11-14-test11-end-to-end-abnahme.md`. Dazu liefen fünf Workflows: **43561613429, 43561613431, 43561613444, 43561613475, 43561613512**, zusammen **926 Sekunden = 15:26**. Die damalige Forderung nach Nachweisen am letzten Commit wurde historisch berichtet und wird hier nicht als unabhängig rekonstruierte Freigabeentscheidung ausgegeben. Breite Trigger und Commitbindung können diese Läufe erklären; die Daten beweisen deshalb nicht, dass sie damals unzulässig oder sinnlos waren. Wiederverwendung erfordert künftig eine ausdrücklich akzeptierte Input-/Buildidentität, insbesondere für die oben genannten fünf PR198-Workflowpfade; reine Dateitypheuristiken oder pauschales skip-ci reichen nicht.

**3. Doppelte Testdateiaufrufe entflechten, Abdeckung bewahren.** Die gesicherten Versionen von `.github/workflows/evaluation-integration.yml` rufen `tests/evaluation-eltern-browser.test.mjs` und `tests/module/school-evaluation.test.mjs` ausdrücklich auf und danach `npm test`. Die zugehörigen `package.json`-Skripte enthalten die Elternbrowserdatei und `tests/module/*.test.mjs` erneut. Das belegt doppelte Aufrufabdeckung; individuelle eingesparte Dateilaufzeit ist nicht gemessen. Eine spätere Änderung müsste die vollständige Testmenge und erforderlichen Reihenfolgen erhalten. Kein solcher Eingriff wurde vorgenommen.

Gegenbelege: Keine mehrfach ausgeführten Runs desselben Workflows derselben PR mit identischer Head-SHA im Umfang nachgewiesen. Die einzige Attemptwiederholung gehört zu den nicht gestarteten Jobs. Die sieben Release-SHAs und ihre geänderten Dateien sind gesichert; reale Code-/Testkorrekturen sprechen gegen die pauschale Wertung aller Wiederholungen als Verschwendung. Sechs Release-Shards verteilen dieselbe Testsuite über `--test-shard`; sie sind keine sechs Vollkopien. Der erste Release-Run hat zwei Jobs, sechs spätere jeweils sieben, zusammen 44. Die Workflowdateien sind historische **Head-SHA-Referenzen**, keine Behauptung eines gesondert verifizierten, intern aufgelösten GitHub-Merge-Workflowblobs.

## Aussagegrenzen und tatsächliche Wirkungen

Runnernamen, Labels, Stepstatus und Zeitpunkte sind als API-Beobachtungen gesichert. Daraus folgen keine Billing-SKU, historische Public-/Private-Zeitpunkte, Guthaben, Speicherrechnung oder tatsächliche Euro-/Dollarkosten. Keine private Billingabfrage durchgeführt. Actor oder gemeinsamer GitHub-Login belegen keinen Agenten; individuelle Autor-/Hostverantwortung bleibt unbekannt.

Durchgeführt wurden öffentliche GET-Abrufe, lokale Normalisierung/Berechnung und die ausdrücklich erlaubte bereinigte Dokumentationspublikation. Keine Actions, Anwendungstests, Builds, Reruns, Modell-/Relay-Aufrufe, Workflow-/Budgetänderungen, PRs oder Main-Merges. Skripte aus den untersuchten Workflows wurden nur als Text gelesen. Die Annahme der Lieferung bleibt bei der zentralen Steuerung.
