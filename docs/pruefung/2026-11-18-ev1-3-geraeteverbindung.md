# EV-1.3 · Geräteverbindung im Playground merken

## Anliegen

Epic 2026.0005, Story EV-1.3: Nach einer erfolgreichen Geräteverbindung den Gerätezugang im iPad-Schlüsselbund merken und bei fehlender Webverbindung einmal wiederherstellen. Verbindlicher Maßstab: [EV-1.3 auf der Hauptbasis](https://github.com/pahlborn/bis-school-app_src/blob/ddcf14a65df92f23dfb828113fd567a186257c77/docs/konzept/evaluationen-ziel1-epics.md#L72) und die gemeinsame Definition of Done. Die fünf vorgeschriebenen Hauptquellen wurden vor Beginn in der verlangten Reihenfolge direkt auf main gelesen.

Produktbasis: `ddcf14a65df92f23dfb828113fd567a186257c77`. Erster Produkt-/Testcommit: `e56b91fc919f4c4afe97b6043aca84613fb4dd30`. Enger Web-/UI-Fix: `5dafa58a63600da1d79e9916b9e29f34998f679b`. Tatsächlicher nativer Entwicklungsworker `/root/dev_ev13_native`, kein Claude-/Forge-Lauf. Eigener Produktworktree und Zweig `feature/ev1-3-geraeteverbindung-20261118`, [Draft-PR #216](https://github.com/pahlborn/bis-school-app_src/pull/216).

## Umgesetzt

- Der Gerätezugang hat einen eigenen Schlüsselbund-Service und einen nach zulässiger Testseite getrennten Account. Speichern prüft durch unmittelbares Zurücklesen; der Claude-Providerkey bleibt unter seinem bisherigen Service/Account. [DeviceAccessKey](https://github.com/pahlborn/bis-school-app_src/blob/e56b91fc919f4c4afe97b6043aca84613fb4dd30/ios/BigQuestMVP/ClaudeClient.swift#L168).
- Die native Brücke erlaubt nur den zugehörigen WebView, den Hauptframe, den passenden HTTPS-Ursprung einschließlich Port und die freigegebenen Testpfade. Anfragen anderer Seiten oder Frames werden abgewiesen. Sie liefert ausschließlich Gerätezugang, niemals den Providerkey. [Brückenaufruf](https://github.com/pahlborn/bis-school-app_src/blob/e56b91fc919f4c4afe97b6043aca84613fb4dd30/ios/BigQuestMVP/BigQuestApp.swift#L37), [gemeinsame Richtlinie](https://github.com/pahlborn/bis-school-app_src/blob/e56b91fc919f4c4afe97b6043aca84613fb4dd30/ios/BigQuestMVP/ClaudeClient.swift#L148).
- Der Webcode meldet einen Gerätezugang erst nach erfolgreicher bestehender Zugangsprüfung an die native Speicherung. Bei fehlender Webbindung liest er den gemerkten Zugang höchstens einmal je Seitenstart, prüft ihn auf dem vorhandenen Speicherweg und übernimmt ihn nur, wenn inzwischen keine Verbindung hergestellt wurde. [Web-Koordination](https://github.com/pahlborn/bis-school-app_src/blob/e56b91fc919f4c4afe97b6043aca84613fb4dd30/src/module/geraeteverbindung.mjs#L8), [Anbindung](https://github.com/pahlborn/bis-school-app_src/blob/e56b91fc919f4c4afe97b6043aca84613fb4dd30/index.html#L5375).
- Ein ungültiger/abgelaufener Zugang führt zum vorhandenen Verbindungsbildschirm mit Hinweis, ohne erneuten automatischen Versuch. Offline- oder Limitfehler löschen den gemerkten Zugang nicht. Ein verspätetes Ergebnis darf eine inzwischen manuell hergestellte Bindung weder überschreiben noch durch eine Fehlermeldung verdrängen. Die native Löschung vergleicht zusätzlich den erwarteten alten Wert, damit ein frisch gemerkter Zugang erhalten bleibt.
- Ein zuvor geöffneter Startlink ohne Gerätezugang wird nach erfolgreicher nativer Wiederherstellung über den vorhandenen Einladungsweg fortgesetzt. Der normale Browser ohne native Brücke behält seinen bisherigen Ablauf.
- Ein Fehler beim nativen Merken erscheint im tatsächlich sichtbaren Login- oder Elternbereich. Sein flüchtiger UI-Status enthält keinen Zugangswert und übersteht die normalen Folge-Render der Wiederverbindung. Ein neuer erfolgreicher Speicherversuch räumt den Hinweis auf; ein verspätetes älteres Speicherergebnis verdrängt den neueren Stand nicht. [UI-Fix](https://github.com/pahlborn/bis-school-app_src/blob/5dafa58a63600da1d79e9916b9e29f34998f679b/index.html#L5393).
- Neue Meldungen liegen in Deutsch und amerikanischem Englisch vor. Export und bestehendes Xcode-Projekt verwenden weiterhin dieselben drei Swift-Quelldateien. Keine neue Abhängigkeit, kein Dienst und keine Workflowänderung.

## Prüfung

Alle verwendeten Zugangswerte, Konten und Speicheroperationen sind synthetisch. Es gab keine echten Provider-API-Aufrufe oder Geräteschlüssel in diesen Softwareprüfungen.

| Prüfung und Version | Ergebnis |
|---|---|
| `CHROMIUM_PATH=/usr/bin/chromium node --test tests/module/geraeteverbindung.test.mjs tests/geraeteverbindung-browser.test.mjs tests/module/ipad-playgrounds-paket.test.mjs tests/erstanmeldung-browser.test.mjs` | PASS, Exit 0: 16/16, keine ausgelassenen oder abgebrochenen Tests. Sieben Modulprüfungen, sechs neue Browserprüfungen am zusammengesetzten Webcode, zwei vorhandene Erstanmeldungs-/QR-Browserprüfungen und der echte N/N+1-Exporttest. |
| Gegenprobe: beide Aufrufe zum nativen Merken in `index.html` vorübergehend deaktiviert | Erwartet FAIL, Exit 1: der Browserfall erkennt nach erfolgreicher Webverbindung den fehlenden nativen Speichervorgang. Kein fehlender-Datei- oder Einrichtungsfehler. |
| Gegenprobe: Schutz gegen veraltete Rückgaben im Koordinationsmodul vorübergehend deaktiviert | Erwartet FAIL, Exit 1: der Modultest erkennt, dass eine verspätete Wiederherstellung eine inzwischen erfolgreiche manuelle Bindung überschreiben würde. |
| Nach beiden Gegenproben vollständigen Quelltext im selben Prozess aus dem Arbeitsspeicher wiederhergestellt; 13 neue Fokusprüfungen wiederholt | PASS, Exit 0: 13/13. Keine Quellkopie in einem anderen Repo oder Archiv. |
| `CHROMIUM_PATH=/usr/bin/chromium npm test` auf e56b91f | FAIL, Exit 1: 939 Tests, 938 PASS, 1 FAIL, 0 CANCEL/SKIP, Dauer 744137.906 ms. Einziger Fehler: unveränderter Performancefall `tests/module/lesen.test.mjs:179`, Assertion Zeile 202 mit 73,9 ms für eine fortgeschriebene Antwort. Kein abgebrochener Lauf und kein Gesamt-PASS. |
| `git diff --check`, JavaScript-Syntaxprüfung | PASS. |
| Lokale Swift-/Xcode-Ausführung | NOT_TESTED: Swift/Swiftc und Xcode sind hier nicht verfügbar. |
| Vorhandene automatische iPad-Exportprüfung auf e56b91f | PASS: [Run 44272616146](https://github.com/pahlborn/bis-school-app_src/actions/runs/44272616146). |
| Vorhandener automatischer iPad-Build samt synthetischer Swift-Regression auf e56b91f | PASS: [Run 44272616238](https://github.com/pahlborn/bis-school-app_src/actions/runs/44272616238). Job 134692732350 rückgelesen: Simulator-Build und ausgeführte synthetische Keychain-Regression jeweils erfolgreich. |
| Vorhandene automatische Web-Prüfung auf e56b91f | PASS: [Run 44272616094](https://github.com/pahlborn/bis-school-app_src/actions/runs/44272616094), sechs Shards und Webbuild erfolgreich. Atlas hat die Primärlogs rückgelesen: 174 + 112 + 164 + 124 + 199 + 166 = 939/939 PASS, überall 0 FAIL/CANCEL/SKIP. |
| Neuer Eltern-Verbraucherfall gegen den tatsächlichen `index.html` aus e56b91f | Erwartet FAIL, Exit 1: Nach erfolgreicher Wiederverbindung ist der Speicherfehler im sichtbaren Elternbereich nicht zu finden. Die Anmeldung/Verbindung war in dieser Gegenprobe bereits erfolgreich; kein Fixturefehler. |
| Nach Wiederherstellung der UI-Korrektur auf 5dafa58: `CHROMIUM_PATH=/usr/bin/chromium node --test tests/module/geraeteverbindung.test.mjs tests/geraeteverbindung-browser.test.mjs` | PASS, Exit 0: 15/15, 0 FAIL/CANCEL/SKIP. Enthält schnellen und verspäteten nativen Speicherfehler nach vollständig beendetem Eltern-Verbindungsformular und nach einem weiteren Eltern-Render sowie einen verspäteten alten Speicherabschluss nach neuem Erfolg. |

Die vorhandene Swift-Regression wurde um getrennte Geräteablage, Speichern/Zurücklesen, fehlerhafte Schreibvorgänge, bedingtes Löschen und zulässige/unzulässige Ursprung-/Frame-/Pfad-/Portfälle ergänzt. Die tatsächliche Ausführung ist im oben verlinkten macOS-CI-Job belegt; lokal wurde Swift nicht ausgeführt.

Sentinel hat den einen lokalen Performancebefund getrennt eingegrenzt: betroffene Testdatei sowie `lesen`, `ereignisse`, `ableitung` und `schreiber` sind gegen main unverändert (Diff Exit 0). Ein einziger isolierter Lauf von `tests/module/lesen.test.mjs` auf e56b91f bestand mit 9/9, Exit 0, 2,201 s; gemeldete Messwerte: Median 23,7 ms, Maximum 49,6 ms, vollständige Berechnung 144 ms. Dieser unabhängige Nachlauf überschreibt den ursprünglichen Gesamt-FAIL nicht und beweist dessen Ursache nicht. Es gab keine Schwellen-, Umgebungs-, Performance- oder Infrastrukturänderung und keinen zweiten Gesamtlauf.

Die UI-Korrektur begann erst nach dem tatsächlichen Ende des lokalen Gesamtlaufs. Gegen e56b91f betrifft sie ausschließlich vier Web-/Testdateien; Swift-Quellen und Workflows sind identisch. Die vorhandene automatische PR-Prüfung des korrigierten Kopfs wird nach dem Push separat am PR ausgewiesen; die erfolgreichen Läufe oben bleiben ausdrücklich e56b91f zugeordnet.

## Gefunden und Grenzen

- Die beiden ersten Browser-Fokusläufe endeten mit FAIL (8/13 bzw. 8/14 bestanden). Ihre synthetische Speicherinitialisierung enthielt noch keinen registrierten Kontoeintrag im von `verbunden()` verlangten Directory. Eine ausgestellte Einladung allein genügte nicht. Die Fixture wurde wie die bestehende Erstanmeldung mit einer echten synthetischen Registrierung eingerichtet und prüft ihren verbundenen Ausgangszustand ausdrücklich. Danach bestand der fokussierte Browserfall, anschließend der vollständige oben genannte 16er-Fokuslauf. Die ursprünglichen FAILs werden nicht als abgebrochen oder bestanden umgedeutet.
- Die Anbindung muss den vorhandenen Startlink erhalten. Die Wiederherstellung setzt deshalb einen wartenden Startlink über `kontoLinkOeffnen` mit dessen bestehendem Neuladen fort; der Browserfall prüft das sichtbare Registrierungsformular. Kein neuer Einladungspfad.
- Argus fand am ersten Produktstand, Sentinel bestätigte im echten angemeldeten Browser: Der native Speicherfehler wurde nur in den verborgenen Logincontainer geschrieben. Der enge Fix hält ihn im sichtbaren Elternbereich auch nach den Folge-Rendern. Die erste neue Verbraucherprüfung scheiterte noch vor diesem Fall an ihrer niedrig gerundeten Admin-Fixture; die Browseranmeldung lehnt Schlösser unter dem bestehenden App-Standard zu Recht ab. Einmalige Korrektur auf den unveränderten Standard, danach Verbraucherprüfung bestanden. Dieser Setupfehler ist von der anschließend fachlich roten UI-Gegenprobe getrennt.
- Test 12 hat verschiedene implizite Schlüsselbund-Bereiche für getrennte Playground-Projekte gezeigt. Diese Änderung verspricht keine Übertragung zwischen solchen Projekten und aktiviert EV-1.4 nicht. Maßgeblich bleibt [das Geräteergebnis auf main](https://github.com/pahlborn/bis-school-app_src/blob/ddcf14a65df92f23dfb828113fd567a186257c77/docs/pruefung/2026-11-18-test12-geraetetest.md).
- Die Swift-Hülle lädt die bestehende entfernte Testseite. Für die echte Abnahme muss diese Seite den passenden Webcode dieses Produktstands enthalten. Bereitstellung ausschließlich durch Peters freigegebenen lokalen Veröffentlichungsweg; weder der Worker noch Atlas veröffentlicht die App. Ein neues Swift-Paket allein belegt keine aktualisierte Webfassung.
- **Geräteabnahme EV-1.3: NOT_TESTED.** Mit Peter im selben Playground-Projekt erfolgreich verbinden und Playgrounds vollständig schließen und neu starten: Das Gerät muss ohne erneute Codeeingabe verbunden sein. Falls beim Start die Webbindung fehlt, soll der gemerkte Zugang sie wiederherstellen. Startdiagnose und Zustand unmittelbar protokollieren. Ein separates neues Projekt ist kein gleichwertiger Neustartfall.

Nächster Owner Atlas: unabhängige Prüfung des exakten Produktstands, tatsächliche CI-Ergebnisse und fehlenden Geräte-/Bereitstellungsnachweis zusammenführen. Kein Merge ohne Peters Ja zu genau PR #216; keine App-Veröffentlichung durch die Agenten.


## Nachtrag 18.11.2026 · Test 14 auf dem iPad

### Getesteter Stand

- Die Software aus [PR #216](https://github.com/pahlborn/bis-school-app_src/pull/216) ist mit Peters ausdrücklicher Freigabe auf main: `86ce3930b8e6972ed60db3d0877d3e511efd3764`. Der bisherige Bericht oben bleibt als historischer Stand vor der Geräteabnahme erhalten.
- [Test-14-Paket](https://raw.githubusercontent.com/pahlborn/bis-school-app_src/5d2863bec89fe548ef0e9003f9dd096f0dffae9a/handoffs/big-quest/device-tests/TEST-14/Big-Quest-iPad-Test-14.zip), [Übergabe und Anleitung](https://github.com/pahlborn/bis-school-app_src/blob/5d2863bec89fe548ef0e9003f9dd096f0dffae9a/handoffs/big-quest/device-tests/TEST-14/README.md), Zweig `handoff/2026.0005-test14-device`, Übergabecommit `5d2863bec89fe548ef0e9003f9dd096f0dffae9a`. Das Paket stammt aus sauberem main `86ce393…`; die drei Swift-Dateien stimmen bytegenau überein. ZIP-SHA-256: `6e134e937b9dc1a2aa144c84cf367006fcffbe6e38cff860908a8d870d505c25`.
- Vor dem Test wurde ausdrücklich die passende Webfassung aus main nach PR #216 unter `https://big-quest-test.github.io/probe-evaluation-form/` verlangt. Peter antwortete darauf „Ich bestätige“. Dies ist die Rückmeldung im Projektchat; Atlas hat weder veröffentlicht noch den tatsächlich ausgelieferten Web-Commit unabhängig festgestellt.

### Unmittelbare Rückmeldung

Atlas gab diesen Ablauf vor: **Test 14 starten, einmal verbinden, Playgrounds vollständig schließen und dasselbe Projekt Test 14 wieder öffnen.** Gefragt wurde danach ausschließlich „weiterhin verbunden“ oder „nicht verbunden“.

| Abnahmekriterium | Rückmeldung von Peter am 18.11.2026 | Ergebnis |
|---|---|---|
| EV-1.3: 📱 Neustart desselben Playground-Projekts ohne Neuverbindung | **„Weiterhin verbunden“** | **PASS aufgrund von Peters unmittelbarer Geräterückmeldung zum angeleiteten Ablauf.** |

Damit ist das bisher offene Geräte-Abnahmekriterium **EV-1.3: Neustart ohne Neuverbindung** erfüllt. Der frühere Status NOT_TESTED oben wird für diesen Test durch dieses Ergebnis abgelöst. Ein Zugriff auf die interne Schlüsselbund-Ablage oder ein gezieltes Entfernen der Webbindung wurde dabei nicht rückgemeldet; aus dem sichtbaren Erfolg wird kein zusätzlich beobachteter interner Wiederherstellungsschritt abgeleitet. Neue iOS-Diagnosecodes wurden nicht mitgeteilt und werden nicht rekonstruiert.

Der Test bestätigt den Neustart im selben Projekt. Er bestätigt keinen Wechsel zwischen getrennten Playground-Projekten und keine gesamte End-to-End-Abnahme von Ziel 1 (EV-7.3/EV-7.4). **EV-1.4 bleibt nicht ausgelöst**: Test 12 belegte unterschiedliche Zugriffsgruppen zweier Projekte, keinen Schlüsselbund-Reset im selben Projekt.

### Bereits vorliegende Softwareprüfungen

Für den finalen PR-Kopf `0a3fd770df698f72b3dbad728ff59b72660aeeb0`, dessen Produktdateien identisch zum genannten main-Stand sind: [Webprüfung 941/941](https://github.com/pahlborn/bis-school-app_src/actions/runs/44276051763), [iPad-Build und ausgeführte synthetische Swift-Regression](https://github.com/pahlborn/bis-school-app_src/actions/runs/44276051782), [Paketexport](https://github.com/pahlborn/bis-school-app_src/actions/runs/44276051784). Keine neue Softwareprüfung oder Veröffentlichung für diesen reinen Berichtsnachtrag. Der historische lokale Gesamt-FAIL weiter oben bleibt unverändert dokumentiert.

EV-3.3 bleibt auf Peters Wunsch bis zum aktualisierten Auftrag mit den neuen Abschnitten 0 und 7 eingefroren. Ein nachfolgender Versuch über Agentarium mit Claude-Agenten wird erst nach Lesen dieses Auftrags begonnen; die vorhandene native Arbeit ist keine Claude-Ausführung.
