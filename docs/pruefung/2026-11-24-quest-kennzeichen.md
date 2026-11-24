# Quest-Kennzeichen J V2 · WIP · 24.11.2026

Auftrag: BQ-QUEST-SYMBOLS-J-20261124 V2. Lokaler Zweig `feature/quest-symbols-j-v2-20261124`, Worktree `/workspace/work/bq-quest-symbols-j-v2-20261124`, Basis `9d034fae0cb882f289e2f12fb81350d95a31a03c`. Dieser Teilstand ist nicht zur Abnahme oder Veröffentlichung freigegeben.

## Gesicherter Teilstand

Die bestehenden Quest-Karten erhalten höchstens ein sichtbares Kennzeichen mit kurzem englischem Kindertext und aria-label: 🧩 Learning goal vor 🎯 Focus vor 🌱 New. Manuell gewählter Fokus unterdrückt das Learning-goal-Kennzeichen. Studios bleiben ohne Kennzeichen. Das bisherige Focus-Element der Karte wird ersetzt; Sterne, Titel und Aufgaben werden nicht verändert. Die freigegebene Symbolzeile J nennt jetzt 🌱; 🧭 Explorer bleibt erhalten.

Die Darstellung liest `activeGapQuests()`, `focusTopics()` und die vorhandene Neuland-Auswahl. Eine neutrale Stand-Funktion lässt bei `neulandCandidates()` ausschließlich deren ungeübten Teil übrig; der bereits geübte schwache Today-Fallback erhält kein New. Die unveränderte Historienzusammenstellung wurde als gemeinsamer reiner Leser `todayHistory()` benannt. Nach eigenem Änderungsbefund wurden keine Datenregeln, Konten, Speicherregeln oder normalen Quest-/Today-Runden geändert. Das ist noch kein unabhängiger Reviewnachweis für sämtliche Speicher oder Auslieferungswege.

Version: `0.152.8-beta` → `0.152.9-beta`. DE/EN-Releasehinweise hinzugefügt; bisherigen Releaseeintrag erhalten. Neuer Test einmal an den vollständigen bisherigen npm-test-Befehl angehängt; vorhandene Testregistrierungen und Abhängigkeiten unverändert.

## Vorhandene Prüfergebnisse

Alle Rohlogs liegen lokal unter `/tmp` mit Dateimodus 0600. Sie werden nicht veröffentlicht und sind nicht Teil dieses Commits.

| Prüfung | Befehl / lokaler Beleg | Ergebnis |
| --- | --- | --- |
| Gegenprobe vor Produktänderung auf Basis 9d034fa | `CHROMIUM_PATH=/usr/bin/chromium node --test --test-name-pattern='J counterprobe' tests/quest-kennzeichen.test.mjs`; `/tmp/quest-j-v2-counterprobe.log` | Exit 1, erwarteter Assertion-Fehler wegen fehlendem 🎯 Focus; kein Browserstart-/Selektortimeout |
| Erste gezielte Browserprüfung | `CHROMIUM_PATH=/usr/bin/chromium node --test --test-reporter=tap tests/quest-kennzeichen.test.mjs` | 4/4 PASS, Exit 0; anschließend sinnvoll erweitert |
| Erweiterter gezielter Lauf | gleicher Befehl; `/tmp/quest-j-v2-targeted.log` | 7 Tests: 6 PASS, 1 FAIL, 0 übersprungen, Exit 1. Alle 6 Livefälle PASS; der gebaute Entry-Fixturefall scheitert vor #home |
| Bestehende Regressionen | `CHROMIUM_PATH=/usr/bin/chromium node --test --test-reporter=tap tests/version.test.mjs tests/app.test.mjs tests/neuland.test.mjs`; `/tmp/quest-j-v2-regression.log` | 17/17 PASS, 0 FAIL, Exit 0 |
| Zweiter gebauter Entry-Fixtureversuch | `CHROMIUM_PATH=/usr/bin/chromium node --test --test-reporter=tap --test-name-pattern='both real builds' tests/quest-kennzeichen.test.mjs`; `/tmp/quest-j-v2-builds.log` | 1 Test, 0 PASS, 1 FAIL, Exit 1; vorhandener `testbauLeser` eingesetzt, weiterhin Timeout vor #home |
| Einmalige wertfreie Diagnose | frisch gebautes Test-HTML mit vorhandenem Testleser; `/tmp/quest-j-v2-diagnostic.log` | Exit 0; 0 pageerrors, #home vorhanden aber verborgen, ein home-h1 vorhanden. Browser und temporäres Bauverzeichnis anschließend geschlossen/gelöscht |

Die 6/6 bestandenen Livefälle decken aktive/inaktive Learning goals, automatischen und manuellen Fokus, Vorrang und 0/1 Kennzeichen, DE/EN, sichtbare englische Texte und aria-labels, 320-px-Touchkarten, zulässiges/gesperrtes/freigeschaltetes Neuland sowie alle vorhandenen Übungsspuren ev/attempts/tried/best/due ab. Ein eigener Gegenfall weist den bereits geübten schwachen Today-Fallback nach. Ein weiterer Fall rendert sämtliche freigegebenen Karten bei verbotenem Math.random-Aufruf und prüft unverändertes localStorage. Daraus wird keine pauschale Prüfung sämtlicher anderer Speicher abgeleitet.

## Ungültige Fixtures und Grenzen

Ein vorausgehender Familienbau-Fixtureversuch verwendete einen falschen Key-API-Typ und ergab TypeError. Der Testwert wurde anschließend ausschließlich zur Laufzeit als zufällige Bytes erzeugt; kein fester Zugangswert wurde eingeführt oder ausgegeben. Der frühere Rohlog dieses Zwischenversuchs wurde vom späteren gezielten Lauf überschrieben; der Fehler bleibt hier ausdrücklich als invalidFixture dokumentiert.

Beide anschließenden gebauten Entry-Fixtureversuche waren ungültig: Der direkte gebaute Test-Entry erwartete fälschlich sofort #home. Der vorhandene Testleser übersetzt Testdaten-/Event-Lesewege, öffnet aber den regulären Geräteverbindungs-/Anmeldeeinstieg nicht. Anmelde-, Authentifizierungs- oder Zeitgrenzen des Produkts wurden nicht geändert. Die Familien- und Testartefakte wurden erzeugt; die gewünschte Kennzeichen-Abnahme beider gebauten Fassungen wurde nicht erreicht. Der zweite Versuch endet vor den in ihm vorgesehenen Prüfungen beider Fassungen.

Noch ausstehend: unabhängig geklärter enger Entry-Fixturepfad, PASS der Kennzeichenprüfung beider tatsächlich gebauten Fassungen, Screenshots der Quest-Auswahl ausschließlich mit generischem Profil, eigener vollständiger npm-test-Lauf auf sauberem Code-/Testfreeze und unabhängige Review-/QA-Abnahme. Es gibt keine Screenshots und keinen vollständigen npm-test-Lauf dieses Teilstands. Keine Behauptung regulär vollständig geprüfter Anmeldung oder physischer Geräteabnahme.

## Halt und Rückgabe

Zweimal musste die Codelektüre wegen ungeeigneter bereitgestellter Lesedaten angehalten werden: zunächst nicht ausreichend maskierte kodierte Alttext-Literale, später ein personenbezogener Fixture-Bezeichner. Inhalte werden hier nicht reproduziert. Nach dem zweiten Halt erfolgten keine weiteren Implementierungs-, Codelektüre-, Bau- oder Browserversuche. Atlas hat ausschließlich lokale Sicherung und Rückgabe dieses unveränderten Teilstands angeordnet.

Die zwei ausschließlich als Lesehilfe von Atlas angelegten Dateien `.quest-j-input-v2.json` und `.quest-j-input-extra-v2.json` wurden vor dem WIP-Commit gelöscht und werden nicht committed. Abhängigkeiten wurden ohne Lockdateiänderung mit `npm install --no-package-lock --cache /tmp/quest-j-v2-npm-cache` installiert (Exit 0; `/tmp/quest-j-v2-npm-install.log`). Ein erster Standardcacheversuch scheiterte lokal mit ENOENT beim mkdir; keine Infrastrukturänderung.

Nur lokale WIP-Sicherung. Kein Push, kein PR, kein Merge, kein Deployment. Die Arbeit bleibt angehalten; eine nächste Freigabe muss den konkreten zulässigen Entry-Fixtureweg benennen.


## Begrenzte Fortsetzung nach unabhängig geprüftem Fixturevertrag

Atlas gab nach einer frischen unabhängigen Zweitsicht genau einen weiteren gezielten Versuch frei. Der WIP-Commit `30a17e8f964c83c6e082d2bd1c7af6b59a3ac711` bleibt historisch unvollständig. Es wurden keine alten Lesedateien und keine weiteren Produkt-/Kontoinhalte geöffnet.

Ausschließlich der eigene Test wurde vorbereitet: Für die Testfassung ergänzt der Hook das vorhandene `APP_ACCOUNTS.users` um einen neuen generischen Studentdatensatz mit zur Laufzeit erzeugter ID und setzt die vorhandene `sessionOf`-/store-Sitzung. Bestehende Konten werden weder geändert noch ausgegeben. Bei der regulär kontenlosen Familienfassung bleibt `APP_ACCOUNTS === null` erhalten; dort wird keine Sitzung erfunden. Der gebaute Browserpfad wartet zunächst auf den Hook, setzt seine ausdrücklich synthetische Vorbedingung und benutzt anschließend echtes `renderHome`/`openSubject`. Der bisherige DOM-hidden-Eingriff wurde aus der Touchprüfung entfernt; auch die Livefälle verwenden jetzt den regulären Fachlistenpfad. Keine Änderung an Produkt-, Show-, Auth-, Geräte- oder Syncfunktionen und keine normale Anmeldebehauptung.

Der einzige freigegebene Versuch:

`CHROMIUM_PATH=/usr/bin/chromium BQ_QUEST_J_SCREENSHOTS=1 node --test --test-reporter=tap tests/quest-kennzeichen.test.mjs`

Beleg: `/tmp/quest-j-v2-session-targeted.log`, Modus 0600. Ergebnis: Exit 1; 7 Tests, 6 PASS, 1 FAIL, 0 übersprungen. Die sechs Livefälle bestehen auf dem regulären Fachlistenpfad. Der gebaute Fall scheitert mit Assertion an der manuellen Fokuszuordnung nach dem Learning-goal-Fall (eigener Test, Zeile 153); kein Entry-Timeout, TypeError oder ReferenceError. Die vorgelagerte Prüfung der synthetisch aufgelösten Test-Kindersitzung und die erste Learning-goal-Zuordnungsassertion wurden erreicht und bestanden. Die danach vorgesehenen Sichtbarkeits-, Sitzungsbestands-, weiteren Zuordnungs- und Familien-UI-Prüfungen wurden noch nicht abgeschlossen. Aus den früheren Assertions wird deshalb keine bereits abgenommene sichtbare Quest-Auswahl beider Fassungen abgeleitet.

Keine Screenshots entstanden. Keine Vollsuite oder zusätzliche Regressionen nach diesem Versuch. Die früheren 17/17 Regressionen bleiben als historischer Beleg bestehen. Keine Korrektur oder weitere Variante nach dem neuen Fehler; sofortige Stopprückgabe an Atlas. Für die unabhängige Bewertung bleibt insbesondere die gespeicherte manuelle Fokusvorbedingung gegenüber dem nachfolgenden tatsächlichen Kartenresultat zu prüfen. Eine solche Bewertung oder weitere Ausführung wurde hier nicht vorgenommen.

Dieser zusätzliche Teilstand wird ausschließlich lokal als weiterer WIP gesichert. Beide früheren temporären Lesedateien bleiben gelöscht. Kein Push, PR, Merge oder Deployment.
