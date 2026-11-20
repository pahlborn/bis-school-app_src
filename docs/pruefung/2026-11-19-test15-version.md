# Test15: Versionsmetadaten 0.152.4-beta

Auftrag: BQ-EVAL-01-TEST15-VERSION-20261119-A1. Dieser lokale Kandidat hebt die Quellversion über die vorhandene Testinstanz an, ohne den Versionsschutz des bestehenden Publishers zu verändern.

- Ausgangsquelle: `main`-Commit `8a188790ab5fee715091ff8883ddaede55644e87`, Tree `5c9e7dbdd351c3fd357add955b3f3afe3c9d2f7b`, sauber; Paketversion `0.152.2-beta`.
- Bestehendes lokales Testziel: `/workspace/work/big-quest-test-publish-227`, Commit `589d80ddc86f1fcdc6247a1d6659bfdc72a644f6`, sauber; eingebettete Version `0.152.3-beta`, Quellhash `268ccff`; Origin ist exakt `https://github.com/big-quest-test/big-quest-test.github.io.git`.
- Kandidat: `release/test15-version-20261119`, der Commit, der diesen Bericht enthält; Paketversion `0.152.4-beta`. Der vollständige Kandidatenhash wird nach dem lokalen Commit an Atlas übergeben.

## Umfang und Vertrag

Maßgeblich sind `docs/veroeffentlichen.md` Abschnitt 5 sowie die bestehenden Werkzeuge `version.mjs`, `releases.mjs`, `testinstanz.mjs` und `testinstanz-veroeffentlichen.mjs`. Die Version kommt aus `package.json`; der Builder setzt Commit und Entwurfsstatus selbst ein. Nur ein sauber eingecheckter Kandidat wird anschließend gebaut.

Diese Änderung umfasst ausschließlich Paketversion, die beiden dazugehörigen bestehenden exakten Versionsassertionen, einen passenden zweisprachigen Releasehinweis und diesen Bericht. Skripte, Abhängigkeiten und sämtliche übrigen Paketfelder bleiben bytegleich. Alle Produktdateien außerhalb dieser vier Pfade bleiben bytegleich zum genannten Ausgangscommit, einschließlich `index.html`, QR-/Anmeldehilfen und sämtlicher Swift-Dateien. Die bereits in PR194 integrierte Funktion „Link kopieren“ bleibt erhalten; der Inhalt aus PR227 bleibt erhalten. Keine Assertion wird entfernt oder abgeschwächt.

„Nur Metadaten“ beschreibt ausschließlich dieses Delta. Eine spätere Veröffentlichung des gesamten Hauptzweigs enthält gegenüber dem bestehenden Testziel auch die neuen Big-Quest-Evaluationsfunktionen und die erhaltene Funktion „Link kopieren“.

## Prüfplan und Grenzen zum Commitzeitpunkt

Die bestehenden gezielten Tests `tests/version.test.mjs` und das direkt passende Releaseanzeigeprofil `tests/elternbereich-b3.test.mjs` wurden einmal mit Node 24.22.1, vorhandenem Playwright und `CHROMIUM_PATH=/usr/bin/chromium` ausgeführt: 15 Tests bestanden, 0 fehlgeschlagen, 0 übersprungen, Exit 0 (26,76 s). Der auf den aktuellen Ausgangscommit beschränkte Diffcheck bestand. Paketbytes außerhalb der Versionszeichenfolge und alle verfolgten Produktbytes außerhalb der erlaubten Pfade wurden als identisch geprüft. Kein vollständiger lokaler Testlauf, keine Installation und kein Neubau nativer Pakete.

Nach dem Commit noch ausstehend: einmal `node werkzeug/testinstanz.mjs`, anschließend ausschließlich der lesende Aufruf `testinstanzVorPruefen` mit der aus diesem sauberen Quellstand ermittelten Version, `dist-test/` und dem obigen lokalen Ziel. Die tatsächlichen Ergebnisse, Guardzahlen und der Kandidatenhash gehen danach separat an Atlas; der geprüfte Commit wird dafür nicht erneut geändert. Bei unerwartetem Test-/Bau-/Vorprüfungsfehler wird angehalten.

Keine Veröffentlichung, kein Kopieren in das Ziel, kein Publisher-Aufruf (auch nicht mit `--ohne-push`), kein Push und kein Merge. Keine Aussage zu Livegleichheit, realen Konten, Geräten, V1 oder Hostattestierung. Der Zielcommit muss unverändert bleiben. Das erzeugte `dist-test/` ist ignoriert und kein Codearchiv.

Nächster Eigentümer: Atlas übernimmt den exakten lokalen Kandidaten für einen separat prüfbaren Versions-PR. Ein späterer Merge verlangt die ausdrückliche Freigabe des exakten PR durch Peter; eine spätere Veröffentlichungsfreigabe muss sich auf den dann endgültigen `main` beziehen.
