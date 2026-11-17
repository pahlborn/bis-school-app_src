# EV-1.1/EV-1.2 · Playground-Kennung und Schlüsselbund-Diagnose

## Anliegen

`2026.0005`, erster Abschnitt EV-1.1 und EV-1.2: Eine feste App-Kennung erzeugen und Schlüsselbund-Ergebnisse anhand der tatsächlichen iOS-Codes unterscheiden. Die Geräteabnahmen bleiben offen, bis Peter sie auf dem iPad ausführt.

Implementierung: tatsächliche native Atlas-Entwicklungsinstanz `/root/dev_ev1_direct`, kein Claude-/Forge-Lauf. Produktbasis: `bb10457ade11490b785ab16e6f231c442e3affd2`.

## Umgesetzt

- Gezielt aus demselben Produktrepo übernommen: `ios/BigQuestMVP/{BigQuestApp,ClaudeClient,ToddleField}.swift`, das vorhandene Xcode-Projekt, `werkzeug/ipad-playgrounds-paket.mjs` und die zwei vorhandenen iPad-CI-Definitionen. Quelle: `feature/bq-evaluation-end-to-end-test11`, Commit `f88e82ab013daf6f8a095224af6cd4d7ef0dc880`. Direkt mit `git show` gelesen, kein Gesamtmerge und keine Kopie in einem anderen Repo oder Archiv. Toddle-Reader und API-/Formularübergabe behalten den vorhandenen Code; EV-1 erweitert Speicherung und Diagnose.
- Export: `node werkzeug/ipad-playgrounds-paket.mjs --test-number 12 --output dist-playgrounds`. Version aus dem tatsächlichen `package.json` statt Test-11-Guard. `Package.swift` und das Xcode-Projekt verwenden `de.bigquest.ipad`; Testnummer und Anzeigename dürfen variieren. Default ist Test 12. Ein Aufruf ersetzt nur sein eigenes Paket/ZIP, nicht das gesamte Ausgabeziel.
- Export nennt Quell-Commit, sauberen/geänderten Quellstand, die native Ausgangsbasis und SHA-256 jedes nativen Quelltexts; JSON-Ausgabe nennt zusätzlich ZIP-Mitglieder und ZIP-Prüfsumme. Die drei Dateien werden als Bytes kopiert.
- Speichern zeigt den tatsächlichen Update- oder Add-Code, liest unmittelbar zurück und zeigt den Lese-Code. Erfolg erfordert erfolgreiche Speicherung, erfolgreiches Lesen und denselben Wert. Ein alter oder unlesbarer Wert bestätigt kein Speichern. Schlüsselwerte erscheinen weder in Diagnoseobjekten noch in Oberflächentexten.
- Beim App-Start erscheint ein eigener Lese-Code mit Access Group. Der Bereich stammt aus Keychain-Attributen. Fehlt der Eintrag, ermittelt ein eigener leerer Diagnosemarker unter demselben Service die implizite Access Group; `defer` ruft auf jedem Rückweg ausschließlich die Löschung dieses eindeutigen Markers auf. Der Löschcode wird derzeit nicht ausgewertet; eine erfolgreiche Bereinigung ist deshalb bei einem iOS-Löschfehler nicht bewiesen. Kann iOS den Bereich nicht liefern, erscheinen „Standardbereich nicht ermittelbar“ und der tatsächliche Diagnose-Code. Keine erfundene Access Group aus der Bundle-ID. Vorhandener Provider-Service und Account bleiben erhalten.
- Meldungen für `0`, `-25300`, `-34018`, `-25308` und sonstige Codes, alle neuen UI-Texte auf Deutsch und amerikanischem Englisch. Nach Speichern bleibt die Anzeige zur Prüfung offen; das Eingabefeld wird geleert.
- Die vorhandene iOS-CI baut das Xcode-Projekt und führt die neue Swift-Regression mit synthetischen Speicheroperationen aus. Die Export-CI prüft N und N+1. Beide Workflows brechen ältere PR-Läufe ab. Ihre Pfadfilter vermeiden reine Dokumentations-PRs, verhindern bei bereits vorhandenen Code-PRs aber keine erneuten Prüfungen durch Berichtupdates (von Atlas am reinen Berichtskopf `3d910802` beobachtet). Keine neue Abhängigkeit.

## Prüfung

| Prüfung | Ergebnis |
|---|---|
| `node --test tests/module/ipad-playgrounds-paket.test.mjs` | PASS: 1 Test. Führt die echte CLI für N=12 und N+1=13 mit dem aktuellen Paketstand `0.152.2-beta` aus; liest beide Manifeste und ZIPs, vergleicht Mitglieder, alle drei nativen Dateien byteweise, README und Prüfsummen. |
| Gegenprobe: nur die erzeugte Kennung vorübergehend zu `de.bigquest.ipad.test${testNumber}` geändert, denselben Test ausgeführt, Quelltext in `finally` wiederhergestellt | Erwartet FAIL, Exit 1: Assertion `fixed app identity must survive a new test number`; kein Setupcrash. Danach derselbe Test wieder PASS. Gegen `main` existiert der Export noch nicht; deshalb fachliche Gegenprobe am funktionsfähigen Export statt eines fehlenden-Datei-Fehlers. |
| `node --check werkzeug/ipad-playgrounds-paket.mjs` | PASS. |
| `CHROMIUM_PATH=/usr/bin/chromium npm test` | PASS: Exit 0, 897 Tests / 897 PASS, 0 FAIL, 0 ausgelassen oder abgebrochen; 462506.690782 ms. Der neue Exporttest ist enthalten. |
| `git diff --check` | PASS (einschließlich abschließender Prüfung). |
| Swift-/Xcode-Ausführung lokal | NOT_TESTED: `swift`, `swiftc` und Xcode fehlen in dieser Linux-Umgebung. Lokaler Lauf nicht durchgeführt; die tatsächliche Ausführung in der macOS-CI ist separat belegt. |
| iOS-CI (Simulator-Build und synthetische Swift-Keychain-Regression) | PASS: [Run 44107708356](https://github.com/pahlborn/bis-school-app_src/actions/runs/44107708356), Job 134124494226; `xcodebuild` und `swiftc` plus ausgeführte Regression erfolgreich. PR-Head `f60a44690171a818baaa178c8d35acbbef097848`, CI-Merge-Checkout `4b741bacd78e15da614740e493b30eb1c998c23c` gegen unveränderte Basis. |
| Export-CI | PASS: [Run 44107708481](https://github.com/pahlborn/bis-school-app_src/actions/runs/44107708481), Job 134124498260; echter N/N+1-Test, Paketbau und Artefakt-Upload erfolgreich, Checkout des PR-Heads `f60a44690171a818baaa178c8d35acbbef097848`. |
| Echte API-Aufrufe | Nicht ausgeführt; keine echten Schlüssel verwendet. |

Die in der CI tatsächlich ausgeführte Swift-Regression prüft erfolgreiche Updates und Adds, fehlgeschlagene Adds mit altem lesbarem Wert, abweichenden/unlesbaren Rücklesewert, die geforderten Fehlercodes, DE/en-US, Access Group und den Marker-Löschaufruf einschließlich Fehlerpfad. Die injizierte Löschoperation liefert dabei Erfolg; ein Löschfehler ist nicht geprüft (unabhängiger Reviewbefund ARGUS-N1). Sie verwendet ausschließlich erfundene Werte und injizierte Operationen; kein System-Keychain-Zugriff und kein Netzaufruf.

Der abschließende Commit ergänzt nur diesen Prüfbericht; die geprüften Produktquellen bleiben unverändert. Die neue Lokalisierungsabfrage verwendet `Locale.languageCode`, das auf den geprüften SDKs als veraltet markiert ist; beide Sprachfälle sind in der ausgeführten Regression grün.

## Gefunden / Geräteabnahme

| Gerätetest mit Peter | Status | Noch zu protokollieren |
|---|---|---|
| EV-1.1: Paket N installieren, verbinden, danach N+1 mit derselben Kennung installieren | **NOT_TESTED** | Pro Schritt PASS/FAIL, Geräteverbindung gehalten oder nicht gehalten. Die erste Umstellung von der früheren Test-11-Kennung wird dadurch nicht als Migration bewiesen. |
| EV-1.2: Providerkey speichern, Codes/Access Group ablesen, Playgrounds schließen, neu starten | **NOT_TESTED** | Speichern-Code, unmittelbarer Lese-Code, Access Group und Start-Lese-Code nach Neustart; niemals den Schlüssel notieren. |

Softwareprüfungen beweisen keine echte iPad-Persistenz oder Toddle-WebView. EV-1.3 und der nur bei belegtem Schlüsselbundverlust zulässige RAM-Rückfall EV-1.4 gehören nicht zu diesem Abschnitt. Es wurde kein RAM-Rückfall eingebaut. `index.html`, Browser-Speicher, Server, Konten und Veröffentlichung wurden nicht geändert; Integration und Merge bleiben bei Atlas.
