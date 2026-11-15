# Publikation im korrigierten Big-Quest-Repository

Peter hat im Ausführungschat am 15.11.2026 das zunächst im Auftrag genannte Ablage-Repository korrigiert: Die Ergebnisdateien gehören in **pahlborn/bis-school-app_src (Big Quest)**. Der korrigierte Auftrag wird so ausgeführt; die fachliche Untersuchung bleibt unverändert.

Geprüfte Basis: Big-Quest-main `7995d6968e3895b88f8ed2c3b0476683e5720c1a`, Git-Baum `ffdc932e6b7f2b4195f7b119d4ba445409512180`. Zielbranch: `docs/bq-eval-01-ci-01-recovery`. Ausschließlich neue Dateien unter `handoffs/big-quest/results/BQ-EVAL-01-CI-01/`; kein PR, kein Main-Merge und keine sonstigen Pfadänderungen. Der vollständig gelesene rekursive main-Baum enthält keine AGENTS.md; die ausdrücklich geladenen Agentarium-Regeln und Peters Personalregel bleiben für Atlas verbindlich.

## Triggerprüfung

Der rekursive Big-Quest-main-Baum enthält genau eine Workflowdefinition: `.github/workflows/child-first-start-release.yml`. Ihr Trigger ist `pull_request` nach `main`, beschränkt auf die Workflowdatei, `index.html`, `package.json`, `src/module/**` und `tests/**`. Es gibt in diesem Basisstand keinen Push-, Create- oder Issue-Kommentar-Trigger. Ohne PR löst die Erstellung des Dokumentationsbranches diesen Workflow nicht aus. Die gelesene Originaldefinition liegt als [Belegtext](snapshot/publish-trigger-declarations/child-first-start-release.yml.txt) vor; Originalquelle: https://github.com/pahlborn/bis-school-app_src/blob/7995d6968e3895b88f8ed2c3b0476683e5720c1a/.github/workflows/child-first-start-release.yml . Historische Workflowkopien unter snapshot sind keine aktiven Definitionen.

## Erhaltener fehlgeschlagener Versuch

Vor Peters Korrektur wurde einmal `github_create_tree` für `pahlborn/agentarium` mit den Ergebnisdateien und dessen main-Basis abgesendet. Das Werkzeug gab wörtlich **`user rejected MCP tool call`** zurück. Es gab dort keinen bestätigten Baum, Commit, Branch oder Journal-Schreibvorgang. Dieser abgewiesene Aufruf wird dort nicht wiederholt. Die Publikation erfolgt auf Peters ausdrückliche Zielkorrektur im Big-Quest-Repository, nicht durch einen alternativen Schreibweg in das abgewiesene Repository.

Die im Recovery-Auftrag vorgesehene Archivzuordnung ist `big-quest / BQ-EVAL-01 / BQ-EVAL-01-CI-01`. Die Ergebnisablage ist von einer Kundenannahme getrennt; diese entscheidet die zentrale Steuerung.

## Integritätskorrektur vor Rückgabe

Der erste Big-Quest-Ergebniscommit `4fea1965d8464b025ceb1ce525f601430c35a56b` wurde öffentlich zurückgelesen. Dabei fiel eine CSV-Zeilenendenabweichung auf: Die Textübergabe hatte CRLF zu LF normalisiert, das zunächst erstellte Manifest bezog sich noch auf lokale CRLF-Bytes. Der Berechnungsinhalt war unverändert, die erste Manifestfassung war für diese CSV-Bytes ungültig. Das Rechenskript erzeugt jetzt ausdrücklich LF, und das Manifest wurde auf dieser deterministischen Fassung neu berechnet. Die abschließende Prüfung liest alle Ergebnisdateien erneut öffentlich zurück; ausschließlich diese geprüfte Nachfolgefassung wird als geliefert zurückgegeben. Die erste Fassung bleibt als fehlgeschlagener Integritätsstand in der Historie erhalten.
