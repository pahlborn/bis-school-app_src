# Reproduktion und Integrität

Python **3.12.14**, ausschließlich Standardbibliothek. Tatsächlich ausgeführt: `python reconstruct.py --collect`, anschließend gezielte Kontextbelege über `python reconstruct.py --context`, zuletzt Offlineberechnung und Manifest. Keine Anwendung installiert oder getestet. Das Skript verwendet für Netzabfragen ausschließlich `urllib.request`-GET gegen öffentliche Repositoryendpunkte. Es benötigt keine Tokens und protokolliert keine Zugangsdaten.

Nach Download des gesamten Ergebnisverzeichnisses (beispielsweise über das GitHub-Brancharchiv) in diesem Verzeichnis:

```sh
sha256sum -c SHA256SUMS
python3 reconstruct.py
sha256sum -c SHA256SUMS
```

Der reine Offlineaufruf benötigt kein Netz. Er erzeugt `runs`, `attempts`, `jobs` und `overlaps` jeweils als JSON/CSV sowie die beiden Summen-JSON-Dateien erneut aus `snapshot/`. Die beiden Manifestprüfungen müssen identisch bestehen. `summary.json` zeigt die publizierten 47/48/85/75, 11.471 Sekunden und Delta 0 zu den historischen Summen.

Für einen **neuen** lesenden Datensnapshot das Verzeichnis zuerst in eine separate Arbeitskopie kopieren; die gespeicherte Rekonstruktion nicht überschreiben:

```sh
python3 reconstruct.py --collect --context
```

`--collect` liest die Runliste vollständig bis zur ersten Seite mit weniger als 100 Zeilen, PR-Commitlisten ebenso, und alle Attempts/Jobseiten der ausgewählten Runs. Bereits vorhandene Attemptdateien werden als Checkpoint wiederverwendet; für eine vollständig frische Erhebung deshalb in der separaten Arbeitskopie ohne alte `snapshot/attempt-*.json` beginnen. `--context` sichert Startverweigerungsannotationen, Commit-Dateipfade und Package-Skripte für die bestehenden Befunde. Eine mit 100 Einträgen volle Kontext-Check-/Annotationsseite stoppt das Skript ausdrücklich statt unbemerkt Vollständigkeit zu behaupten. Kontext-/Workflowquellen können durch spätere GitHub-Aufbewahrungsfristen unzugänglich werden; der mitgelieferte Snapshot bleibt offline verwendbar.

Die Metadatenzeit `collected_at` bezeichnet den Abschluss des Run-/Attempt-/Workflowabrufs; die gezielten Kontextquellen wurden anschließend in derselben Sitzung gelesen. Manifest neu erzeugen nur nach bewusster Neuerstellung einer eigenen Fassung:

```sh
python3 reconstruct.py --manifest
```

SHA256 schützt die Identität der ausgelieferten Bytes. Git-Commit und Blob-SHAs sind davon getrennte Git-Objektidentitäten. Die Manifestdatei enthält alle publizierten Ergebnisdateien außer sich selbst; ihre eigene SHA256 wird in der Archiv-Rückgabe und im Chat genannt. CSV-Zellen sind Belegdaten, keine auszuführenden Befehle. Workflowkopien unter `snapshot/` werden nicht ausgeführt.
