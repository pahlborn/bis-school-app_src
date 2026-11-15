# CI-01 · Recovery-Beleglieferung v1

**Rekonstruktion, keine wiedergefundenen Originaldateien.** Technische Beleglieferung zu BQ-EVAL-01-CI-01-RECOVERY v1. Ausführung direkt durch Atlas (ChatGPT/Codex); keine andere Rolle oder Vertretung eingesetzt. Die zentrale Steuerung prüft und entscheidet über Annahme.

Der erneut erhobene Datensatz ergibt **47 Runs, 48 Attempts, 85 eindeutige Jobs, 75 ausgeführte Jobs und 11.471 Sekunden = 3:11:11**. Die historischen Summen sind damit reproduziert, die Identität der verlorenen Originaldateien ist damit nicht nachgewiesen.

| Artefakt | Dateien |
|---|---|
| Auswertung, Unterschiede und Grenzen | [Auswertung.md](Auswertung.md) |
| Runs mit PR-Zuordnung und SHA | [runs.csv](runs.csv), [runs.json](runs.json) |
| Attempts und beobachtete Zeitspannen | [attempts.csv](attempts.csv), [attempts.json](attempts.json) |
| Jobs, Ausführung, Runner, Zeiten und Quellen | [jobs.csv](jobs.csv), [jobs.json](jobs.json) |
| Überlappung je Job | [overlaps.csv](overlaps.csv), [overlaps.json](overlaps.json) |
| Summen und Abgleich | [summary.json](summary.json), [repeat-and-overlap-summary.json](repeat-and-overlap-summary.json) |
| Quellenindex | [Quellen.md](Quellen.md), [snapshot/sources.json](snapshot/sources.json) |
| Datensnapshot und Abdeckung | [snapshot/collection.json](snapshot/collection.json), [snapshot/pulls.json](snapshot/pulls.json), `snapshot/attempt-*.json`, `snapshot/runs-page-*.json` |
| Schritt-/Runnerbelege | `snapshot/attempt-*.json` enthält die API-Stepzeitpunkte, Stepstatus und Runnerfelder je Job |
| Startverweigerungen | [snapshot/start-refusal-evidence.json](snapshot/start-refusal-evidence.json) |
| Historische Workflow-, Commit- und Paketreferenzen | `snapshot/workflows/`, `snapshot/commits/`, `snapshot/packages/` |
| Rechenskript | [reconstruct.py](reconstruct.py) |
| Anleitung | [Anleitung.md](Anleitung.md) |
| Veröffentlichungstrigger | [Publikationspruefung.md](Publikationspruefung.md), `snapshot/publish-trigger-declarations/` |
| Byteintegrität | [SHA256SUMS](SHA256SUMS) |

Mandat: [RECOVERY v1](https://github.com/pahlborn/agentarium/blob/286a2e222e8fe873457504fa75f3ba3f538d0bde/handoffs/big-quest/BQ-EVAL-01-CI-01-RECOVERY.md). Aktuell geladene Regelbasis: AGENTS, Personalregel, Process und Rulebook 1.4 auf Agentarium-main `6700bc2e581739b7b6d751fb9dfef2328b0cd32a`. Ergebnisrepository gemäß Peters ausdrücklicher Korrektur im Ausführungschat: **`pahlborn/bis-school-app_src` (Big Quest)**; eigener Dokumentationsbranch, kein PR/Main-Merge. Archivzuordnung: `big-quest` / `BQ-EVAL-01` / `BQ-EVAL-01-CI-01`.
