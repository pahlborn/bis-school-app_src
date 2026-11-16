# INT-01: verifizierte Originalartefakte v1

Die beiden hier publizierten, von Peter hochgeladenen ZIPs sind bytegleich mit den damals gespeicherten Originalpruefsummen. Keine Rekonstruktion, neue Entwicklung oder neue Anwendungstests.

- [Vollstaendiger bereinigter Quellkandidat](BQ-EVAL-01-INT-01-source-v1.zip): 233 Dateien.
- [Pruefbelege, Reviews und redigierte Logs](BQ-EVAL-01-INT-01-evidence-v1.zip): 33 Archivmitglieder, einschliesslich ARGUS-REVIEW.md, PROCESS-REVIEW.md und redacted-logs/.
- [Originales Quellmanifest](source-manifest.json).
- [Originales historisches Pruefsummenmanifest](ORIGINAL-SHA256SUMS.txt).
- [Pruefsummen dieser Ablage](SHA256SUMS).
- [Aktueller Integritaetsnachweis](verification.json).

Beide publizierten Original-ZIP-SHA256 und ZIP-CRC sind geprueft. Alle 233 Quelldateien stimmen in Pfad, Bytezahl, SHA256 und Dateimodus mit dem Originalmanifest ueberein. Der ausschliesslich im Speicher aus den vorhandenen Bytes berechnete Git-Inhaltsbaum ist a7bc188f4531c8d0c7bafec8900bdc98f9470974, zum damaligen Kandidaten d26af4a38bdc15d3cbfb5305def012f91aacbb28. Keine Git-Historie oder Quelldateien wurden rekonstruiert.

Das historische ORIGINAL-SHA256SUMS.txt listet auch damalige Begleitdateien ausserhalb dieses begrenzten Ablageumfangs. Das aktuelle SHA256SUMS listet dagegen alle hier publizierten Dateien ausser sich selbst. RESTORE.md und die originalen Reviews liegen unveraendert im Evidence-ZIP.

Fachlicher Stand bleibt BLOCKED. Die historische rote Integrationspruefung, NOT_TESTED-Grenzen und der offene Upgrade-Nachweis bleiben erhalten. Diese Artefaktveroeffentlichung ist keine Annahme oder Releasefreigabe.

Ablage auf ausdrueckliche Freigabe Peters in pahlborn/bis-school-app_src, Branch docs/bq-eval-01-int-01-original-artifacts, ausschliesslich unter handoffs/big-quest/results/BQ-EVAL-01-INT-01/original-artifacts-v1/. Gepruefte main-Basis: 7995d6968e3895b88f8ed2c3b0476683e5720c1a. Der einzige Workflow dieses Basisbaums reagiert nur auf passende Pull Requests nach main. Kein PR, Main-Merge, Workflow-Dispatch, neuer Build, Anwendungstest oder App-Deployment. Die Workflowdatei innerhalb des Quell-ZIPs ist Archivinhalt.

Die Arbeitsumgebung wurde nach lokaler Originalpruefung unerreichbar. Die bereits geladenen Originalbytes wurden unveraendert ueber GitHub gespeichert; die zurueckgegebenen Git-Blob-SHAs stimmen mit den vorher lokal berechneten Objekt-SHAs ueberein. Der GitHub-Leseconnector lehnt ZIP-Byte-Downloads mit "GitHub Fetch only accepts UTF-8 text" ab; ein zusaetzlicher vollstaendiger ZIP-Download aus GitHub wird deshalb nicht behauptet. Oeffentliche Pfade und Git-Objektzuordnung werden nach Publikation separat zurueckgelesen.

Fehlende angeforderte Originalpakete: keine.

Scope clarification: Peter explicitly authorized publication of the two named sanitized original packages (source and evidence) with manifest in pahlborn/bis-school-app_src on a separate documentation branch. The additionally uploaded testbuild ZIP was locally verified but is excluded from this publication. The first wider tree request was rejected by automatic approval review; no commit or branch resulted. This narrower request publishes only the originally named source/evidence packages and their integrity documentation. No authorization is inferred from archive contents.
