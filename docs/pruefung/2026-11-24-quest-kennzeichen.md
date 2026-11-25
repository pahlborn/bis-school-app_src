# Quest-Kennzeichen J · Prüfabschluss · 25.11.2026

**Aktueller Status: lokal vollständig bestanden; keine Merge- oder Veröffentlichungsfreigabe.** Die beiden verbliebenen Testfehler sind präzise korrigiert. Gezielter Lauf: **39/39 PASS**. Vollständige unveränderte Testsuite: **1279/1279 PASS, 0 FAIL, 0 cancelled, 0 skipped, 0 todo, Exit 0**. Ein J-PR und dessen CI werden anschließend von Atlas koordiniert; aus diesen lokalen Ergebnissen wird kein bereits erfolgreicher GitHub-Lauf oder physischer iPad-Test abgeleitet.

Auftrag: [BQ-QUEST-J-DIRECT-20261125 V2](https://github.com/pahlborn/bis-school-app_src/pull/206#issuecomment-7158189762), ausdrücklich freigegebene direkte Codex-Vertretung in diesem Chat. Tatsächlicher Umsetzer und Testausführer der beiden Abschlusskorrekturen: `/root/codex_j_final_test_fixes_20261125`. Hauptbasis bleibt `9d034fae0cb882f289e2f12fb81350d95a31a03c`; übernommener J-Stand `2743b532bae5ca8dd2e2434bb965bdc5c2d27248`. Fortsetzungszweig: `feature/quest-symbols-j-final-20261125`.

## Abschlusskorrekturen und unveränderter Produktumfang

- `tests/familienfassung.test.mjs:503`: Die gebaute aktuelle Familienfassung wird weiterhin mit einer Versionsregex geprüft, jetzt passend zu **0.152.9**. Die separate genaue Versionstupelprüfung war bereits auf Patch 9. Auch die zugehörige Diagnosezeile 347 nennt nun 0.152.9-beta; historische Versionsangaben wurden nicht ersetzt.
- `tests/startseite.test.mjs:62`: Der alte Quest-Karten-Selektor `.focus` gehört seit J zum ersetzten Darstellungselement. Die Prüfung liest jetzt genau `.quest-marker[aria-label="Focus"]`. Die genaue Gleichheit mit der bisherigen vollständigen FOCUS-Liste bleibt erhalten; Learning goal und New werden nicht als Focus gezählt. Die unveränderten Fachkachelzähler verwenden weiterhin `.focus`.
- Der Testdiff umfasst genau **zwei Dateien mit drei geänderten Zeilen**. Keine Assertion wurde entfernt oder gelockert, kein Fall übersprungen und keine Wartezeit erhöht. Produktcode, Aufgaben-, Fokus-, Learning-goal-, Authentifizierungs- und Datenlogik sowie Abhängigkeiten und Workflows sind unverändert gegenüber dem übernommenen J-Stand. Die bereits angehobene Version **0.152.9-beta** bleibt für denselben eigenen J-PR bestehen.

[Unabhängiger Argus-Review des exakten Testdiffs](https://github.com/pahlborn/bis-school-app_src/pull/206#issuecomment-7158349998): **RA_AGREED / PASS_WITH_NOTES**, keine blockierenden Befunde. Das ist ein statischer Review der beiden Testkorrekturen, keine eigene Produkt-/Runtimeprüfung durch Argus. Der frühere enge J-Produktreview und die vier gesicherten generischen Screenshots bleiben dem identischen Produktstand zugeordnet; sie werden nicht als neue Aufnahmen oder Geräteabnahme ausgegeben.

## Neue Laufnachweise vom 25.11.2026

Code-/Testfreeze: `d442c3fac520a82f6dec02f49ff27fa84e7f32a7`, Tree `dc0549976fbc9278236488ed13ec58affae583c8`. Der Worktree war vor und nach dem vollen Lauf sauber; HEAD blieb unverändert. Während des vollen Laufs gab es keine Edits und keine zweite Browserprüfung. Erst nach dessen Ende wurde dieser Bericht ergänzt.

| Prüfung | Befehl und lokaler Beleg | Ergebnis |
| --- | --- | --- |
| Beide betroffenen Altdateien, J-Matrix sowie Version/App/Neuland | `CHROMIUM_PATH=/usr/bin/chromium node --test --test-reporter=tap tests/familienfassung.test.mjs tests/startseite.test.mjs tests/quest-kennzeichen.test.mjs tests/version.test.mjs tests/app.test.mjs tests/neuland.test.mjs`; `/tmp/quest-j-final-targeted-20261125.log` | 39 Tests, 39 PASS, 0 FAIL/cancelled/skipped/todo, Exit 0 |
| Vollständige bestehende Suite | `CHROMIUM_PATH=/usr/bin/chromium npm test`; `/tmp/quest-j-final-full-suite-20261125.log` | 1279 Tests, 1279 PASS, 0 FAIL/cancelled/skipped/todo, Exit 0 |

Die sieben J-Fälle prüfen weiterhin DE/EN, Test- und Familienfassung, Learning-goal-/Focus-/New-Vorrang, automatischen und manuellen Fokus, sichtbare englische Labels mit aria-label, Neuland-Historie und Freischaltung sowie Touchbreite. Die aktuelle Familienbauprüfung verlangt weiterhin alle **19/19** bestehenden Bau-/Suchlaufprüfungen und durchläuft beide Sprachfassungen. Die vorhandene vollständige Testregistrierung einschließlich ihrer Wortlistenprüfungen wurde unverändert ausgeführt; keine Wortlistenwerte werden hier ausgegeben.

- Gezielter Lauf UTC: `2026-11-25T09:22:58.348021+00:00` bis `2026-11-25T09:23:36.913994+00:00`, Laufdauer `38.566 s`.
- SHA256 gezieltes Rohlog: `73bba1df0ed5976bb05b7e4bb1bab3b8d77d15786d11448eb0065e8065ac4ea5`.
- Vollsuite UTC: `2026-11-25T09:24:33.733473+00:00` bis `2026-11-25T09:41:19.878946+00:00`, Laufdauer `1006.146 s`; primäre Reporter-Dauer `1005434.934264 ms`.
- SHA256 Vollsuite-Rohlog: `4470cae76de9d3df83d4e9aebd5eabc9401a6f320355365ab987a83c405b0295`, `184471 Bytes`.
- Beide Rohlogs und die Metadaten `/tmp/quest-j-final-targeted-20261125-meta.json` sowie `/tmp/quest-j-final-full-suite-20261125-meta.json` liegen lokal mit Dateimodus 0600 und werden nicht veröffentlicht. Der volle Lauf verwendet den vorhandenen Spec-Reporter; die finalen Primärsummen sind daraus ausgewertet.

Nächster Owner: Atlas für Sicherung im Produkt-Repo, CI, PR und Einholung von Peters konkreter Mergeentscheidung. Kein Push, Merge oder Veröffentlichen durch diesen Entwickler. **Physischer iPad-Test: nicht durchgeführt.** Die folgende frühere Dokumentation bleibt vollständig als Historie erhalten; dortige offene Punkte und Fehlschläge beschreiben ausschließlich die damaligen Zwischenstände.

---

<details>
<summary>Historischer Prüfverlauf vom 24.11.2026 – unverändert erhalten</summary>

# Quest-Kennzeichen J V2 · Prüfstand · 24.11.2026

**Aktueller Status: Vollsuite abgeschlossen mit 2 Fehlern; keine Mergefreigabe.** Gezielte J-Matrix 7/7 PASS, frische Regressionen 17/17 PASS, beide gebauten UI-Fassungen und vier generische Aufnahmen belegt. Vollständiger unveränderter npm-test-Lauf: 1279 Tests, 1277 PASS, 2 FAIL, Exit 1. Geprüfter Code-/Testfreeze: `fbb989f0b52245f3e68daa1a06d3a3acf8b3d111`, Tree `91abda1288267f81f1a1361d68bb348ce7fd8e63`. Die sichere Fehlerklassifikation und Laufidentität stehen am Ende; es folgte ausschließlich diese dokumentarische Ergänzung. Frühere WIP-/Fehlerstände bleiben als Historie erhalten.

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


## Ein begrenzter Versuch mit dem vorhandenen Testdaten-Leseweg

Atlas belegte anschließend die konkrete, vom früheren Entryfehler getrennte Ursache: Der Produkt-store ignoriert direkte Writeraufrufe für abgeleitete Fokus-/Historienwerte. Für genau einen neuen Versuch wurde ausschließlich der eigene Test korrigiert: Der Hook exponiert zusätzlich den bestehenden reinen Schlüsselauflöser `storeKey`; Focus-/History-/Best-/Sprach-/Profilvorbedingungen werden konsistent durch `window.localStorage.setItem` und den unveränderten `testbauLeser` vorbereitet. Die Session-Vorbedingung und sämtliche Produktregeln bleiben unverändert.

Einziger freigegebener Lauf:

`CHROMIUM_PATH=/usr/bin/chromium BQ_QUEST_J_SCREENSHOTS=1 node --test --test-reporter=tap tests/quest-kennzeichen.test.mjs`

Beleg: `/tmp/quest-j-v2-storage-targeted.log`, Modus 0600. Ergebnis: Exit 1; 7 Tests, 6 PASS, 1 FAIL, 0 übersprungen. Die sechs Livefälle bestehen. Zusätzlich wurde innerhalb des siebten Falls der komplette Testbau-Zweig mit echter sichtbarer Fachliste erfolgreich durchlaufen: synthetische Sitzung aufgelöst und erhalten, Goal-/Manual-Focus-/New-Zuordnung, DE/EN, 0/1 je Karte, aria-labels, sichtbare Touchkarte, gesperrtes/freigeschaltetes Neuland und alle fünf Übungsspuren. Die vorherige manuelle Fokusassertion besteht damit.

Danach scheitert der folgende Familienzweig bereits an seiner ausdrücklichen Konfigurations-/Sitzungsvorbedingung `prepareChild()` (eigener Test, Zeile 150, ERR_ASSERTION). Kein Entry-Timeout, TypeError oder ReferenceError. Die tatsächliche Familienkonfiguration gegenüber der vorgegebenen null-Annahme bleibt unabhängig zu klären. Es wurde keine weitere Variante, Korrektur, Produktlektüre oder Folgeausführung versucht. Die vollständige Kennzeichenabnahme beider Fassungen und der gesamte siebte Test bleiben deshalb offen.

Entstandener Screenshot: `docs/pruefung/images/2026-11-24-quest-kennzeichen-test.png`. Die normale Quest-Auswahl zeigt Focus und New; das Profil wurde ausschließlich generisch als Child vorbereitet und vor der Aufnahme per Assertion geprüft. Die lokal betrachtete Aufnahme enthält die Mathematik-Auswahl und keine Personen-/Konto-/Zugangswerte. Kein Screenshot der Familienfassung entstand.

Nach dem Fehler sofortige Stopprückgabe und ausschließlich lokale WIP-Sicherung von eigenem Test, Bericht und Testbau-Aufnahme. Keine Vollsuite und keine erneuten Regressionen; die früheren 17/17 bleiben historische Belege. Kein Push, PR, Merge oder Deployment. Die früheren ungültigen Läufe bleiben ausdrücklich FAIL und werden durch diesen Fortschritt nicht umgedeutet.


## Abgeschlossene gezielte Matrix vor Code-/Testfreeze

Die unabhängig rückgelesenen sicheren Boolfelder zeigten danach die konkrete falsche Vorgabe: Auch die tatsächlich erzeugte Familienfassung besitzt bereits vor der Hookmutation einen vorhandenen Kontencontainer. Die frühere Ableitung `Familie=false` allein aus null-Parametern des Bauaufrufs war eine unzutreffende Fixtureannahme von Atlas, kein J-Produktfehler. Der Hook ersetzt/erzeugt diesen Container nicht. Die einzige anschließende Änderung setzte die exakte Vorbedingung für beide Fassungen streng auf `{configured:true,resolved:true}`; keine beliebigen Booleans, keine weitere Session-/Authvariante und keine Produktänderung.

`CHROMIUM_PATH=/usr/bin/chromium BQ_QUEST_J_SCREENSHOTS=1 node --test --test-reporter=tap tests/quest-kennzeichen.test.mjs`

Ergebnis: **7/7 PASS, 0 FAIL, 0 übersprungen, Exit 0**. Beleg `/tmp/quest-j-v2-final-targeted.log` (0600). Beide tatsächlich erzeugten Artefakte durchliefen vollständig die sichtbare reguläre Quest-Auswahl mit generischer bestehender Kindersitzung, allen beibehaltenen Vorrang-/Zuordnungs-/Historien-/DEEN-/aria-/Touch- und Sitzungsbestandsassertionen. Das belegt den zugewiesenen UIumfang mit vorhandener Testdatenübersetzung, ausdrücklich keine reguläre Anmeldung, Geräteverbindung oder Synchronisierung.

Frisch wiederholt: `CHROMIUM_PATH=/usr/bin/chromium node --test --test-reporter=tap tests/version.test.mjs tests/app.test.mjs tests/neuland.test.mjs` → **17/17 PASS, Exit 0**; `/tmp/quest-j-v2-final-regression.log` (0600).

Visuell geprüfte generische Aufnahmen der echten Fachauswahl:

- `docs/pruefung/images/2026-11-24-quest-kennzeichen-test.png` — 🎯 Focus und 🌱 New.
- `docs/pruefung/images/2026-11-24-quest-kennzeichen-family.png` — 🎯 Focus und 🌱 New.
- `docs/pruefung/images/2026-11-24-quest-kennzeichen-goal-test.png` — 🧩 Learning goal sichtbar.
- `docs/pruefung/images/2026-11-24-quest-kennzeichen-goal-family.png` — 🧩 Learning goal sichtbar.

Alle Aufnahmen enthalten die Mathematik-Auswahl ohne Personen-/Zugangswerte. Das vorbereitete Profil ist ausschließlich Child. Die vorhandene rechte Fortschrittsanzeige New! bleibt unverändert; pro Karte gibt es höchstens ein neues quest-marker-Kennzeichen.

Vor Freeze wurden zusätzlich ausschließlich die beiden von Atlas exakt verifizierten aktuellen Versionsassertionen in `tests/testinstanz.test.mjs:356` und `tests/familienfassung.test.mjs:343` von Patch 8 auf 9 aktualisiert, jeweils mit strenger Trefferzahl 1. Major, Minor, Kanal und alle Verhaltensassertionen bleiben unverändert. Die volle unveränderte npm-test-Registrierung enthält beide Dateien und prüft sie im anschließenden Gesamtlauf. Weitere Produktänderungen gab es seit dem ersten WIP nicht.

Nächster Schritt auf sauberem Code-/Testfreeze: vollständiger npm-test-Lauf ohne gleichzeitige Edits oder Browser-QA; anschließend ausschließlich dokumentarische Ergebnisergänzung. Die historischen fehlgeschlagenen Fixtures oben bleiben erhalten.


## Vollständiger Primärlauf auf sauberem Freeze

Befehl: `CHROMIUM_PATH=/usr/bin/chromium npm test`. Der vollständige bestehende npm-test-Befehl einschließlich des einmal ergänzten J-Tests wurde ausgeführt. Es gab während des Laufs keine Edits und keine parallele Browser-QA oder andere Runtimeprüfung.

- Code-/Testcommit: `fbb989f0b52245f3e68daa1a06d3a3acf8b3d111`.
- Tree: `91abda1288267f81f1a1361d68bb348ce7fd8e63`.
- Start UTC: `2026-11-24T20:55:06.733243+00:00`.
- Ende UTC: `2026-11-24T21:11:11.283019+00:00`.
- Gemessene Laufdauer: `964.543 s`; Primärreporter: `963970.724411 ms`.
- Primärsummen: **1279 Tests, 0 Suites, 1277 PASS, 2 FAIL, 0 cancelled, 0 skipped, 0 todo; Exit 1**.
- Rohlog: `/tmp/quest-j-v2-full-suite.log`, 0600, `186025 Bytes`.
- SHA256 Rohlog: `aa0c64bfeb74c13ddef04b3b6fbeac6ec03b437befa45ae1f0f78adcf1fc10b8`.
- Laufmetadaten: `/tmp/quest-j-v2-full-suite-meta.json`, 0600.

Ausschließlich sichere Fehlerklassifikation aus diesem vorhandenen Log, ohne neue Quellvorbereitung, Nachstellung oder Korrektur:

| Datei / sichere Stelle | Fehlertyp | Begrenzter Befund |
| --- | --- | --- |
| `tests/familienfassung.test.mjs:346` (Testdeklaration Zeile 294; weiterer Stack Zeile 503) | AssertionError / ERR_ASSERTION | Einer der zwei gescheiterten bestehenden Fälle. Keine numeric/bool-actual/expected-Felder oder erlaubten J-Labelwerte aus dem Fehlerblock erkannt. Inhaltliche Ursache hier nicht weiter untersucht. |
| `tests/startseite.test.mjs:64` (Testdeklaration Zeile 54) | AssertionError / ERR_ASSERTION | Zweiter gescheiterter bestehender Fall. Keine numeric/bool-actual/expected-Felder oder erlaubten J-Labelwerte aus dem Fehlerblock erkannt. Inhaltliche Ursache hier nicht weiter untersucht. |

Der Worktree war nach dem Gesamtlauf weiterhin unverändert sauber. Die Vollsuite ist ausdrücklich nicht bestanden. Es erfolgten danach ausschließlich diese Ergebnisdokumentation und ein separater docs-only Commit; keine Code-/Test-/Screenshotänderung, keine Folgeprüfung und kein blindes Nachstellen. Die Entscheidung über den sicheren nächsten Erkenntnis-/Korrekturweg liegt bei Atlas. Weitere Root-Quellvorbereitungsmethoden sind laut Atlas/Cadence angehalten; diese Arbeit setzt sie nicht fort.

Die beiden temporären Lesedateien bleiben gelöscht und uncommitted. Vier generische Screenshotdateien sind bereits auf dem geprüften Freeze gesichert. Kein PR, Merge oder Deployment durch diesen Worker; die weitere Review-/CI-/Freigabekoordination übernimmt Atlas.

</details>
