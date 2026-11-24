# BQ-PARENTS-01-CG-TEXT V1/V2 · angehaltener Entwicklungsstand

**Aktueller Stand 24.11.2026: V2 erneut ANGEHALTEN / UNVOLLSTÄNDIG.** Der Familienpfad ist inzwischen nachgewiesen, die zusätzliche Testinstanz-Kandidatenprüfung scheitert nach drei Anläufen. Keine vollständige Suite, kein Vollsuiten-Freeze und keine Integrationsfreigabe. Die folgenden V1-Befunde bleiben historisch erhalten; die heutige Fortsetzung steht am Ende.

## Anliegen

Ausschließlich PR1 des freigegebenen Plans: sichtbare C-Begriffe und Sicherungshinweis aus G in DE/US-EN. Ausgangsbasis `d5ae13528ad1eb4eb508750be5cae02e58d9d37b`, Ausgangsversion `0.152.7-beta`. Auftrag: PR206, Kommentar `7115540845`. Bearbeitung durch einen tatsächlichen Codex-Entwicklungsvertreter.

**Status: BLOCKIERT / UNVOLLSTÄNDIG. Keine Freigabe zur Integration.** Der lokale Prüfstand trägt `0.152.8-beta`; ein eingefrorener, vollständig grüner Kandidat liegt nicht vor. Keine Veröffentlichung, kein Push, kein PR und kein Merge durchgeführt.

## Umsetzung

- Die fünf alten Pflichtquellen wurden in der von Atlas bestätigten Reihenfolge vollständig gelesen, anschließend die drei neuen Quellen auf der Ausgangsbasis. Keine geltende AGENTS.md im Produktbaum oder seinen Vorfahren gefunden.
- Eigener Worktree `/workspace/work/bq-eltern-cg-20261123`, Zweig `feature/elternbereich-c-g-texte-20261123`; andere Arbeitsstände nicht geändert.
- Sichtbare Einstufungen in Originalbegriffen mit Kürzeln, Evaluations, Learning goals, Strengths, Areas of Development, Learner Profile Attributes und Awaiting evaluation eingeführt. Lehrkraftinhalte werden weiter aus denselben Feldern unverändert dargestellt.
- Sichtbare Learning-goal-Hinweise nennen die tatsächliche Stufe; Datumsbezüge verwenden vorhandene Daten. Die falsche Behauptung gelegentlicher automatischer Übernahme wurde durch den Elternschritt mit Vorschau und Bestätigung ersetzt.
- Sicherungshinweis DE: „Tipp: Sichern Sie [Kind]s Lernstand – so bleiben alle Erfolge erhalten.“ US-EN: „Tip: Back up [child]’s learning progress to keep every achievement.“ Knöpfe „Jetzt sichern“ / „Back up now“.
- Paketversion und vorhandene Versionsassertion auf `0.152.8-beta` fortgeschrieben; vorherige Releasehinweise erhalten und neue kurze DE/EN-Hinweise ergänzt.
- `canBackup`, Speicherwege, Einstufungs-/Zuordnungslogik, Gehaltenregeln, Fokus- und Rechteregeln wurden nicht funktional geändert. Der neue Familien-Browserprüfschritt ist noch rot und bleibt ausdrücklich ein Prüfbefund, kein behobener Produktfall.

Geänderte Dateien vor diesem Bericht:

- `index.html`
- `package.json`
- `src/module/elterntexte.mjs`
- `src/module/kinddaten.mjs`
- `src/module/lueckentexte.mjs`
- `src/module/sterne.mjs`
- `tests/auftrag2-bestaetigt.test.mjs`
- `tests/elternansicht.test.mjs`
- `tests/elternbereich-a1.test.mjs`
- `tests/elternbereich-b4.test.mjs`
- `tests/elternbereich-c1.test.mjs`
- `tests/elternbereich-d1.test.mjs`
- `tests/elternbereich-d4.test.mjs`
- `tests/elternbereich-f2.test.mjs`
- `tests/elternbereich-f3.test.mjs`
- `tests/elternbereich-titel.test.mjs`
- `tests/evaluation-eltern-browser.test.mjs`
- `tests/evaluation-upgrade-browser.test.mjs`
- `tests/familienfassung.test.mjs`
- `tests/module/kinddaten.test.mjs`
- `tests/schule.test.mjs`
- `tests/schulische-einstufungen.test.mjs`
- `tests/version.test.mjs`
- `werkzeug/releases.mjs`

## Prüfung

Ausführung mit Node `24.22.1` und dem vorhandenen `/usr/bin/chromium`; keine Installation und kein Infrastrukturumbau. Ausschließlich vorhandene synthetische Testzugänge und lokale Nachbauten, keine realen Schlüssel oder Schuldaten.

| Prüfung / tatsächlich ausgeführter Befehl | Ergebnis |
| --- | --- |
| `CHROMIUM_PATH=/usr/bin/chromium node --test --test-name-pattern='C/G original' tests/elternbereich-c1.test.mjs` vor den Produktänderungen | Exit 1, 0/1 PASS. Fachlich rote Gegenprobe: Originalstufe mit Kürzel fehlte. `/tmp/cg-red.log` |
| Derselbe neue Browserfall nach Textänderung | Exit 0, 1/1 PASS. Tatsächlicher Eltern-/Schulpfad DE/EN, wortgetreuer synthetischer Lehrkrafttext; in der erweiterten Fassung auch vollständiger Vergleich der Quellrecords. `/tmp/cg-original-final.log`. Spätere Textkorrekturen sind dadurch nicht erneut geprüft. |
| `CHROMIUM_PATH=/usr/bin/chromium node --test --test-name-pattern='C/G original\|T18 backup' tests/elternbereich-c1.test.mjs tests/elternbereich-b4.test.mjs` | Exit 0, 2/2 PASS. Vorhandene Sicherungs-Anzeigefälle erhalten. `/tmp/cg-text2.log`. Die danach ergänzten US-EN-Anzeigefälle wurden noch nicht ausgeführt. |
| `CHROMIUM_PATH=/usr/bin/chromium node --test --test-concurrency=7 tests/elternansicht.test.mjs tests/elternbereich-{a1,b4,c1,d1,d4,f2,f3}.test.mjs tests/elternbereich-titel.test.mjs tests/schule.test.mjs tests/schulische-einstufungen.test.mjs tests/evaluation-eltern-browser.test.mjs tests/auftrag2-bestaetigt.test.mjs tests/module/kinddaten.test.mjs` | Exit 1, 91 Tests, 66 PASS, 25 FAIL, 0 SKIP/CANCEL. Erster fokussierter Lauf; Dateien wurden währenddessen weiterbearbeitet, daher kein eingefrorener Kandidatenbeleg. Alte wörtliche Erwartungen und eine tatsächliche Textlängenüberschreitung (7030 statt höchstens 7000 Zeichen) gefunden. `/tmp/cg-focus1.log`, `/tmp/cg-focus1-summary.log`, `/tmp/cg-focus1.exit`. |
| `CHROMIUM_PATH=/usr/bin/chromium node --test --test-name-pattern='Sandbox: gebaute Familienfassung' tests/familienfassung.test.mjs` · Versuche 1–3 | Jeder Exit 1, jeweils 0/1 PASS. Die vorhandene Build-Vorbereitung wurde ausgeführt; die ergänzte Browserprüfung scheiterte anschließend. Kein Gesamt-PASS für den Familienbau oder die Familienprüfung. Siehe unten. |
| Vollständiges `npm test` am eingefrorenen Kandidaten | **Nicht ausgeführt.** |
| Testfassung separat bauen und ihre sichtbaren DE/EN-Texte am fertigen Bau prüfen | **Nicht ausgeführt.** |
| Familienfassung als tatsächliche Kandidatenversion bauen und vollständig DE/EN prüfen | **Nicht abgeschlossen.** Der vorhandene Familientest verwendet seine eigene synthetische Buildversion; keine Kandidatenveröffentlichung. |
| Abschließende Prüfung gegen `werkzeug/verbotene-woerter.txt` | **Nicht ausgeführt.** Keine Liste oder einzelne gesperrte Wörter in diesen Bericht übernommen. |

## Gefunden / Haltegrund

Nach drei erfolglosen Versuchen desselben neu ergänzten Familien-Browser-Restores angehalten. Kein weiterer Versuch, Produktfix oder Prüfwerkzeugumbau folgt aus diesem Bericht.

1. `/tmp/cg-family1.log`: Browser erreichte `#parentClose`; `.pbackup-note` nicht gefunden, 30s Timeout.
2. `/tmp/cg-family2.log`: zusätzlich über vorhandenen Helfer zur Übersicht navigiert; Sicherungshinweis weiterhin nicht vorhanden, erwartete Anzahl 1 / tatsächlich 0.
3. `/tmp/cg-family3.log`: als konkrete Abhängigkeit zuerst auf den wiederhergestellten Schulabschnitt gewartet; `[data-psec="school"] > summary` erschien nicht, 30s Timeout. Dauer des gesamten Testlaufs 37662 ms; 1 Test, 0 PASS, 1 FAIL, 0 SKIP/CANCEL.

**Bewiesen:** In der vorausgehenden vorhandenen synthetischen Sandbox-Sitzung des gebauten Familienprogramms waren `accountsOn() === true` und `canBackup() === true`; beide neuen Assertions wurden erreicht und bestanden. Das synthetische Schulobjekt wurde in derselben Sitzung korrekt aus dem Konto gelesen. Die neue Browserprüfung öffnete die tatsächlich gebaute verschlüsselte Familienhülle mit dem vorhandenen synthetischen Testpasswort, kopierte ausschließlich die synthetische Ablage und leitete GitHub-Anfragen zum vorhandenen lokalen Nachbau um.

**Nicht bewiesen:** Im wiederhergestellten Browser sind ausgewähltes Kind, vollständige Kinddaten, Übungsdaten und dieselbe Backupberechtigung noch nicht nachgewiesen. Der fehlende Sicherungshinweis beweist deshalb keinen `canBackup`-Produktfehler. Die erforderliche Familienprüfung der sichtbaren DE/EN-Texte bleibt offen. Der kontenlose Sicherungsfall wurde nicht ausgeführt und bleibt ausdrücklich der eigenständige G-Prüfschritt PR6.

**Weitere offene Befunde:** Den aktuellen Assertionstand erneut fokussiert prüfen; verbleibende wörtliche Alt-Erwartungen gezielt korrigieren; durch längere Originalbegriffe entstandene Textlänge ohne Schwellenanhebung kürzen; sichtbare Restbegriffe kontextbezogen fertig prüfen. Keine Assertion, Fallzahl, Verhaltensregel, Grenze oder Timeout wurde abgeschwächt oder erhöht. Der neu ergänzte Familien-Browseraufruf unterbricht derzeit den bestehenden umfangreichen Familientest vor dessen restlichen Schritten; dieser Zwischenstand darf nicht integriert werden.

Kleinste Alternativen für Atlas:

- Frische unabhängige Zweitsicht auf den engen synthetischen Browser-Restore und dessen Kind-/Datenbereitschaft, ohne Produkt- oder Infrastrukturänderung; erst nach Entscheidung ein neuer Ausführungsauftrag.
- Einfacher prüfen: die neue Browser-Ergänzung gesondert zurückstellen und einen bereits bewährten synthetischen Familien-Browserpfad benennen. Vorhandene Build-/Sandboxbelege allein ergeben keinen Ersatz-PASS für die noch fehlende Darstellung.
- PR1 zurückstellen, bis der konkrete Prüfpfad geklärt ist; G-Funktionsprüfung weiterhin bei PR6 belassen.


## Fortsetzung V2 · 24.11.2026 · erneut angehalten

### Anliegen, Grundlage und tatsächliche Rolle

Peter genehmigte nach der frischen Zweitsicht ausdrücklich die kleine Testkorrektur und die Fertigstellung samt vollständiger Prüfung von Text-PR1. Auftrag: [PR206, Kommentar7123404964](https://github.com/pahlborn/bis-school-app_src/pull/206#issuecomment-7123404964). Tatsächlicher Bearbeiter war der Codex-Entwickler `/root/codex_eltern_cg_abschluss_20261124`, koordiniert von Atlas; kein Claude-/Forge-Lauf.

GitHub-main wurde über den Connector frisch als `d5ae13528ad1eb4eb508750be5cae02e58d9d37b` bestätigt. Der eigene neue Worktree `/workspace/work/bq-eltern-cg-abschluss-20261124`, Zweig `feature/elternbereich-cg-abschluss-20261124`, entstand exakt von `16c0cd33410166006c02bb5b2ba5b126e11e2607`. Der frühere Worktree wurde nicht verändert. Keine geltende AGENTS.md im Produktbaum oder seinen Vorfahren gefunden. Die acht Pflichtquellen wurden auf der festen aktuellen main-Basis in der Auftragsreihenfolge gelesen, anschließend beide Berichte und der bisherige Änderungsschnitt. Node24.22.1 und vorhandenes `/usr/bin/chromium`; keine Installation oder Infrastrukturänderung.

### Umgesetzt, noch nicht vollständig abgenommen

- `familyCopyBrowser` meldet den lediglich kopierten Elternrahmen über die bestehende Oberfläche ab und meldet das vorhandene synthetische Elternkonto normal an. Vorher werden fehlende Kindzuordnung, Schulabschnitt und Sicherungstipp beobachtet; danach die Kindkennung und derselbe vollständige Übungs-/Schul-Eventbestand. Kein Schlüsseltransfer, keine IndexedDB- oder Produktspeicheränderung.
- Die ursprünglichen Schul-, Sicherungs-, DE/EN- und Unverändertheitsassertionen bleiben erhalten. Der erfolgreiche Familienfall durchlief danach auch alle ursprünglichen Export-, Kindlösch-, Kontolösch- und Speichertrennungsschritte.
- Verbleibende sichtbare englische gap-Bezeichnungen im C-Umfang sowie alte wörtliche Erwartungen wurden gezielt auf Learning goals und die Originalstufen mit Kürzeln umgestellt. Mathematische/physische Wortbedeutungen und interne gap-Namen bleiben. Die eigene Abkürzungsprüfung erlaubt Kürzel ausschließlich zusammen mit dem jeweiligen Originalbegriff.
- Der sichtbare Konzepttext wurde durch Kürzung zweier erläuternder Sätze unter die unveränderte Grenze7000 gebracht. Die M-/Gehaltenregel, Aufgaben-/Zeit-/Berechtigungsgrenzen, Fokus, W1, Sterne und gespeicherte Originaldaten wurden nicht geändert.
- Der bestehende Familienfall prüft zusätzlich einen wirklich mit `familieBauen` erzeugten Kandidaten0.152.8-beta. Der bestehende Testinstanz-Browserfall verwendet zusätzlich den wirklich mit `testinstanzBauen` erzeugten Kandidaten. Seine synthetische Elternanlage verwendet dafür die normalen PBKDF2-Vorgaben; die bisherige Anlage mit1000Runden war für die normale UI-/Werkzeuganmeldung ungeeignet. Kein Produktgrenzwert wurde gesenkt.
- Die zusätzliche Testinstanz-Sicherungsassertion bleibt rot: erwartet1, beobachtet0. Sie wurde ausdrücklich nicht auf0 umgestellt. Paketversion0.152.8-beta, Versionstest und DE/EN-Releasehinweise bleiben wie vorbereitet.

Neue Änderungen seit16c0cd3 betreffen `index.html`, `src/module/lueckentexte.mjs`, `tests/auftrag2-bestaetigt.test.mjs`, `tests/eltern.test.mjs`, `tests/elternbereich-d1.test.mjs`, `tests/elternbereich-d4.test.mjs`, `tests/elternbereich-f3.test.mjs`, `tests/evaluation-eltern-browser.test.mjs`, `tests/familienfassung.test.mjs`, `tests/schule.test.mjs`, `tests/schulische-einstufungen.test.mjs`, `tests/testinstanz.test.mjs` sowie diesen Bericht. Die historische V1-Dateiliste oben bleibt erhalten.

### Enge Familien-Gegenprobe und Nachweis zuerst

Alle folgenden Browserbefehle liefen mit `CHROMIUM_PATH=/usr/bin/chromium` im eigenen Abschluss-Worktree. Logs liegen mit eingeschränkten Dateirechten unter `/tmp`; nur Ergebnisse und neutrale Fehlerausschnitte werden berichtet. Es wurden nur synthetische Konten und der vorhandene lokale GitHub-Nachbau verwendet.

Befehl für den engen Fall:

`node --test --test-name-pattern='Sandbox: gebaute Familienfassung' tests/familienfassung.test.mjs`

| Lauf | Beobachtung und Ergebnis |
| --- | --- |
| Zusätzliche technische Sonde | Exit1, 0/1: interne Appfunktionen sind im verschlüsselten Bau nicht global verfügbar; `ReferenceError` der Sonde. Kein Kind-/Produktbefund. `/tmp/cg-v2-family-counter.log` |
| Geplante Vorfix-Gegenprobe | Exit1, 0/1, 0SKIP/CANCEL: Elternrahmen vorhanden, erwartete Kindbereitschaft fehlt unmittelbar an der sichtbaren Kindkennung. Kein erneuter Timeout. `/tmp/cg-v2-family-red.log` |
| Reguläre Ab-/Anmeldung | Exit0, 1/1, 0FAIL/SKIP/CANCEL, 11411,865ms. Fehlende Kindbereitschaft vor Anmeldung bestätigt; danach Kind und kompletter Eventbestand vorhanden. Schul-/Sicherungstexte DE/EN und Ereignis-Unverändertheit sowie sämtliche restlichen Schritte des bestehenden Familienfalls bestanden. `/tmp/cg-v2-family-green.log` |

Dieser erste enge Nachweis verwendete ausdrücklich die vorhandene **Fixture-Bauversion0.998.0-beta**, nicht den späteren echten Kandidaten. Die drei historischen V1-Fehlversuche oben bleiben erfolglos; sie werden durch diesen neuen Nachweis nicht rückwirkend umgedeutet.

### Fokusläufe und unveränderte Textgrenze

Erster heutiger Fokuslauf auf während des Laufs unverändertem Stand:

`node --test --test-concurrency=7 tests/elternansicht.test.mjs tests/elternbereich-{a1,b4,c1,d1,d4,f2,f3}.test.mjs tests/elternbereich-titel.test.mjs tests/schule.test.mjs tests/schulische-einstufungen.test.mjs tests/evaluation-eltern-browser.test.mjs tests/auftrag2-bestaetigt.test.mjs tests/module/kinddaten.test.mjs`

Exit1, **91Tests,85PASS,6FAIL,0SKIP/CANCEL**, 550323,646ms. `/tmp/cg-v2-focus.log`, Exitdatei `/tmp/cg-v2-focus.exit`. Fünf Befunde betrafen alte wörtliche Erwartungen; der sechste war **DE7062/7000Zeichen**. Der historische erste Längenbefund **7030/7000** bleibt derselbe Problemzähler, kein neuer unabhängiger Fall. Anschließend wurden die konkreten Reststellen angepasst und der sichtbare Text sinnvoll gekürzt, ohne Grenzanhebung.

Gezielter Folgelauf:

`node --test --test-concurrency=7 --test-name-pattern='T14 a teacher|T6/T7|EV4|school data in|T1–T3 table|parents see|upgrade recovers' tests/elternbereich-d1.test.mjs tests/elternbereich-f3.test.mjs tests/evaluation-eltern-browser.test.mjs tests/schule.test.mjs tests/schulische-einstufungen.test.mjs tests/eltern.test.mjs tests/evaluation-upgrade-browser.test.mjs`

Dieser Lauf ist **kein grüner Gesamtnachweis**: In `tests/eltern.test.mjs` wählte der Filter keinen Fall; der bestehende offene Server hielt den Dateiprozess fest. Nach dem bestätigten Halt wurde ausschließlich dieser eigene hängende Prüfprozess beendet. Tatsächlich aufgezeichnet: **Exit1,13Tests,12PASS,0FAIL,1CANCEL,0SKIP**, 294156,125ms. `/tmp/cg-v2-focus2.log`, Exitdatei `/tmp/cg-v2-focus2.exit`. Keine neue Wiederholung nach dem Halt.

Der darin tatsächlich erreichte F3-Fall bestand und meldete **DE6970/7000, EN6234/7000Zeichen**. Diese Messung gilt für den erreichten Fall und macht den abgebrochenen Folgelauf nicht grün. Die späteren Testinstanz-Fixtureanpassungen lagen außerhalb der dort geprüften Dateien. Die an `tests/eltern.test.mjs` angepassten Stufentexte wurden in diesem gefilterten Lauf nicht ausgeführt.

### Wirkliche Kandidatenbauten0.152.8-beta, getrennt von Fixtureversionen

Befehl:

`node --test --test-name-pattern='Sandbox: gebaute Familienfassung|Browser: die gebaute Testinstanz' tests/familienfassung.test.mjs tests/testinstanz.test.mjs`

Der gemeinsame Lauf endete Exit1, 2Tests,1PASS,1FAIL,0SKIP/CANCEL. `/tmp/cg-v2-candidates.log`. Der Familienfall bestand einschließlich des zusätzlichen echten Kandidaten, der Testinstanzfall scheiterte am neuen Rücksprungschritt.

| Kandidat | Tatsächlich erreicht | Grenze |
| --- | --- | --- |
| Familie0.152.8-beta | Wirklicher verschlüsselter Bau unter `/tmp/bq-cg-v2-familie-kandidat`, vorhandener Suchlauf **19/19**, Quellenkennung16c0cd3 mit lokalen Änderungen. Normale Anmeldung, Schulbereich und Sicherungstipp DE/EN einschließlich Knöpfen, Originalbegriffen und Event-Unverändertheit im echten Browser bestanden. Danach liefen sämtliche ursprünglichen Export-/Lösch-/Speicherprüfungen weiter durch. | Vorläufiger veränderter Arbeitsstand; kein eingefrorener Vollsuiten- oder finaler Kandidatennachweis. Keine Veröffentlichung. |
| Testinstanz0.152.8-beta | Wirklicher Bau unter `/tmp/bq-cg-v2-test-kandidat`, vorhandener Suchlauf **18/18**. Die ursprünglichen Anmelde-/Fach-/Speichertrennungsassertionen wurden erreicht. Die normale synthetische Elternanmeldung wurde im dritten Lauf erreicht. | Die ergänzte Sicherungsassertion erwartet1 und beobachtet0. Die danach stehenden zusätzlichen Schul-/DE/EN-/Originaltext-/Unverändertheitsassertionen wurden nicht erreicht. Keine vollständige DE/EN-Kandidatenabnahme. |

Drei aufeinanderfolgende Zusatzläufe desselben Testinstanz-Kandidatenwegs sind getrennt erhalten:

1. `/tmp/cg-v2-candidates.log`: `#quitBtn` führte von der Übung zuerst in die Fachansicht; das neue Warten direkt auf die Startseite lief in den unveränderten30s-Timeout. Die Korrektur verwendete anschließend den vorhandenen `zurStart`-Helper.
2. `node --test --test-name-pattern='Browser: die gebaute Testinstanz' tests/testinstanz.test.mjs`, `/tmp/cg-v2-test-candidate2.log`: Exit1,0/1,0SKIP/CANCEL. Die Werkzeuganmeldung konnte das vorhandene nur mit1000Runden angelegte synthetische Elternkonto nicht mit der normalen Vorgabe öffnen. Danach ausschließlich diese synthetische Elternanlage auf den normalen Standard gestellt.
3. Derselbe Befehl, `/tmp/cg-v2-test-candidate3.log`: Exit1,0/1,0SKIP/CANCEL, 7996,399ms. Normale Elternanmeldung erreicht; neue Assertion „candidate test parent sees the backup tip after practice“ erwartet1, tatsächlich0. **Danach Halt an Atlas gemeldet und bestätigt.** Keine weitere Korrektur oder Probe.

### Kontenstatus, G-Sichtbarkeit und Originaltreue

- Im bestehenden Familien-Sandboxpfad wurden `accountsOn() === true` und `canBackup() === true` ausdrücklich erreicht. Das gebaute Familienprogramm mit normal angemeldetem synthetischem Elternkonto zeigte den Sicherungstipp in DE und EN. Die genaue G-Formulierung und beide Knöpfe wurden geprüft.
- Die Testinstanz wurde mit dem bestehenden synthetischen Kind über den lokalen GitHub-Nachbau verbunden und angemeldet. Die bisherigen Fach- und Speicherprüfungen bestanden vor dem neuen Zusatz. Nach einer Übung und dem Schulimport wurde das vorhandene synthetische Elternkonto über die Oberfläche angemeldet. **Welches Kind danach in der Elternansicht tatsächlich gewählt war und welchen `canBackup`-/Testkinderstatus es dort hatte, wurde nicht eigens nachgewiesen.** Nur das Fehlen des Sicherungstipps ist beobachtet. Eine Ursache oder ein Produktfehler wird daraus nicht behauptet; die Erwartung1 bleibt prüfbar rot.
- Schul-/Lehrkraftdaten, Revisionen und Zuordnungen werden im erfolgreichen Familienpfad durch Vergleich des vollständigen Eventbestands geschützt; der bestehende C/G-Schulfall im ersten Fokuslauf verglich zusätzlich unveränderte vollständige Quellrecords beider Sprachen. Kein echter Kontozugriff.
- Die bestehende Zeit-/Neue-Übung-/Berechtigungsregel wurde nicht verändert. Der **kontenlose G-Funktionsschritt bleibt PR6** und wurde nicht durchgeführt. Ebenso keine A1-Zukunftswirkung implementiert und keine A/B/D/E/F/H/I-/Backlogarbeit übernommen.

### Verbotenliste, Freeze, Vollsuite und offene Rückgabe

Die vorhandene Liste wurde gelesen, ohne ihre Werte auszugeben: **13Einträge**. Eine direkte Zählung der Rohquelle ergab **5Trefferwörter an der neutralen Fundstelle `index.html`**. Deren abschließende Einordnung wurde nach dem Halt nicht fortgesetzt. Die tatsächlichen Kandidatenbauten bestanden ihre vorhandenen Suchläufe18/18 beziehungsweise19/19; das ist von einer noch offenen abschließenden umfassenden Verbotenprüfung zu unterscheiden. Keine gesperrten Wörter oder Namen aus der Liste werden hier wiedergegeben.

**Kein Vollsuiten-Freeze und kein vollständiges `npm test` durchgeführt.** Der jetzt gesicherte lokale Commit ist ausdrücklich ein unvollständiger Sicherungsstand nach Halt, kein eingefrorener Abnahmekandidat. Es gab keine Codeänderung während des ersten heutigen Fokuslaufs; der Folgelauf prüfte die oben genannte Auswahl, während spätere unabhängige Testinstanz-Fixtureänderungen gesondert erfolgten. Keine Teilprüfung wird als Vollsuite ausgegeben. Ein späterer tatsächlicher Freeze, vollständige Suite, normale PR-CI und unabhängige Prüfung bleiben offen. Dieser Bericht entstand nach dem letzten Probeaufruf; danach wurden keine neuen Tests gestartet.

**Haltegrund:** dritter erfolgloser Zusatzlauf des Testinstanz-Kandidatenwegs. Atlas bestätigte den Halt und meldete ihn Peter. Der neue erfolgreiche Familiennachweis und die bestandene Textlängenmessung bleiben eigenständige Fortschritte; sie ersetzen die fehlende Testinstanzabnahme oder Vollsuite nicht.

Kleinste Alternativen für eine Entscheidung, keine bereits freigegebenen Fortsetzungen:

- Frische unabhängige Zweitsicht auf Voraussetzung, tatsächlich gewähltes Kind und Backupberechtigung des vorhandenen Testinstanzzusatzes; danach eng entscheiden. Aufwand klein und begrenzt, keine Produkt-/Rechteänderung vorwegnehmen.
- Einfacher nur die tatsächliche Sichtbarkeit in beiden Konfigurationen korrekt getrennt prüfen und berichten, sofern eine neue Entscheidung diesen Nachweisweg bestätigt. Die neue rote Erwartung nicht still lockern und die bestehenden ursprünglichen Assertions erhalten.
- PR1 weiter zurückstellen. G ohne Konten bleibt PR6; kein Scope-Wachstum.

Kein Push, PR, Merge, Release oder Deployment durchgeführt. Andere Worktrees unverändert. Nach Sicherung dieses unvollständigen lokalen Stands endet die Bearbeitung; Atlas führt die Entscheidung und eine etwaige unabhängige Zweitsicht.
