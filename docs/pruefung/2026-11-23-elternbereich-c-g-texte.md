# BQ-PARENTS-01-CG-TEXT V1–V3.2 · lokaler Softwareabschluss

**Aktueller Stand 24.11.2026: V3.2 lokal vollständig geprüft.** Auf dem unveränderten Code-/Testfreeze `f8108146fcefd9417418b82997e3e51c0f6bd545`, Tree `1f777dbde4c5c8f445c36b58fe27393f90e68d3f`, bestehen **1272/1272 Tests**, Exit **0**, ohne FAIL/SKIP/CANCEL. Beide wirklichen Kandidaten `0.152.8-beta` bestehen DE/EN samt Sicherungshinweis 1 und vollständiger Elternhilfe-/Linkprüfung. Maßgeblich ist der Abschlussabschnitt V3.1/V3.2 am Ende. Die folgenden blockierten V1-/V2-/V3-Stände, Fehlversuche und Abbrüche bleiben unveränderte Historie. Normale PR-CI, konkrete Mergefreigabe und eine Veröffentlichung sind dadurch nicht vorweggenommen.

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
- Der sichtbare Konzepttext wurde durch Kürzung zweier erläuternder Sätze unter die unveränderte Grenze 7000 gebracht. Die M-/Gehaltenregel, Aufgaben-/Zeit-/Berechtigungsgrenzen, Fokus, W1, Sterne und gespeicherte Originaldaten wurden nicht geändert.
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

## Fortsetzung V3 · 24.11.2026 · pausierter Sicherungsstand

Auftrag: [PR206, Kommentar7129870836](https://github.com/pahlborn/bis-school-app_src/pull/206#issuecomment-7129870836), nach [frischer begrenzter Zweitsicht7129843016](https://github.com/pahlborn/bis-school-app_src/pull/206#issuecomment-7129843016). Tatsächlicher Bearbeiter: Codex `/root/codex_cg_v3_delivery_20261124`, kein Claude-/Forge-Lauf. Eigener Worktree `/workspace/work/bq-eltern-cg-v3-20261124`, Zweig `feature/elternbereich-cg-v3-20261124`, exakt von `86d0e4789f53073048ecce752ff20ca87771195f`. Aktuelle Hauptbasis `ea840127ba8d7d5519a32179a81284093525c9b9` wurde ausschließlich in diesen Featurezweig integriert: Integrationscommit `5f3d454c242f919762fad6e619cb0f65e8d18645`, Tree `07c05eb04b64ce447b0b67b32c4be4347a32c8ff`. Keine geltende AGENTS.md in Produktbaum oder Vorfahren gefunden; acht Pflichtquellen auf der aktuellen Hauptbasis in Auftragsreihenfolge gelesen. Andere Arbeitsstände blieben unverändert.

### Bestehender Testweg und drei tatsächliche Aufrufe

Alle Aufrufe verwendeten vorhandenes Node24.22.1, `/usr/bin/chromium`, synthetische Fixtures und den lokalen GitHub-Nachbau. Keine Installation oder Infrastrukturänderung. Die folgenden gezielten Aufrufe sind keine Vollsuite und ergeben keinen vollständig abgenommenen Kandidaten. Logs und Exitdateien liegen geschützt unter `/tmp`.

| Aufruf / Absicht | Tatsächliches Ergebnis und neue Teilkriterien |
| --- | --- |
| `CHROMIUM_PATH=/usr/bin/chromium node --test --test-name-pattern='Browser: die gebaute Testinstanz' tests/testinstanz.test.mjs` · geplante Vorfix-Gegenprobe, `/tmp/cg-v3-admission-red.log` | Exit1, 1Test, 0PASS/1FAIL, 0SKIP/CANCEL. Unerwarteter technischer Sondenfehler: Kindsession bei der neuen Zustandslesung noch null. Die bestehende Wartebedingung akzeptiert ein bereits im DOM vorhandenes verborgenes Home-Element. Kein fachlich roter Admission-Gegenbeleg; die ergänzte Session-Bereitschaft war noch nicht nachgewiesen. |
| Derselbe Befehl · erneute geplante Vorfix-Gegenprobe nach Warten auf tatsächliche Session-ID, `/tmp/cg-v3-admission-red2.log` | Exit1, 1Test, 0PASS/1FAIL, 0SKIP/CANCEL. Neu erreicht: dieselbe Kindidentität zunächst pending; nach Elternaufnahme verschwand Pending bereits über einen laufenden normalen Kindabgleich. Die bestehende Sicherungshinweisassertion1 sowie DE-Sicherungstext/Knopf und Schulbegriffe wurden erreicht. Unerwarteter Folgefehler an der bestehenden zusätzlichen Originaltext-Substringassertion. Die beabsichtigte rote Admission-Gegenprobe trat nicht ein; dieser Lauf beweist keine bestimmte historische Race-Verzweigung. |
| `CHROMIUM_PATH=/usr/bin/chromium node --test --test-name-pattern='Browser: die gebaute Testinstanz|2d Pending-Daten' tests/testinstanz.test.mjs tests/konto-anmeldung.test.mjs` · geplanter Positivlauf plus vorhandener Pending-Gegenfall, `/tmp/cg-v3-admission-green.log` | Exit1, 2Tests, 1PASS/1FAIL, 0SKIP/CANCEL. Pending-Gegenfall bestanden: Antworten vor Aufnahme nur pending, danach dieselben Ereignis-IDs genau einmal regulär. Im Kandidatenfall neu bestanden: normaler Sichtbarkeits-Rückkehrweg, verschwundene Pending-Marke, identische Kind-ID, datierte reguläre answer-Ereignisse, keine Antworten im Pending-Log, normale Eltern-Kindwahl und unveränderte vollständige reguläre Antworten nach Elternlogin. Unerwarteter Fehler an der neu eingeführten rohen `__attempts`-Sonde; die folgenden Sicherungs-/DE/EN-/Originaltextprüfungen wurden in diesem Lauf nicht erneut erreicht. |

Die drei Aufrufe haben unterschiedliche konkrete Fehlerursachen. Ein geplanter Dateiname mit „red“ macht einen technischen Sondenfehler nicht zur erfolgreichen fachlichen Gegenprobe; der Dateiname „green“ macht den dritten Aufruf nicht grün. Atlas bestätigte nach Meldung die Pause. Ob §6 hier dreimal dasselbe Problem betrifft, wird vor weiterer Steuerung unabhängig geprüft. Kein weiterer Lauf ist dadurch freigegeben.

### Gesicherter, weiterhin unvollständiger Testdiff

Nur `tests/testinstanz.test.mjs` wurde in V3 technisch bearbeitet: tatsächliche Sessionbereitschaft vor der Kind-ID-Lesung, lesende Pending-/ID-/reguläre Ereignisbelege, vorhandener normaler Sichtbarkeits-Rückkehrabgleich vor Zusatzübung, normale Kindwahl in der Elternansicht und genaue Auswahl des Quellrecords über Titel und Tabellenindex. Der Kandidatenbaupfad lautet `/tmp/bq-cg-v3-test-kandidat`; die vorhandenen Suchlaufprüfungen18/18 und Kandidatenversion0.152.8-beta wurden vor den jeweiligen Browserprüfungen erreicht. Die bestehende Sicherungshinweisassertion1, Texte/Knöpfe und Ereignis-Unverändertheitsassertionen bleiben erhalten. Kein Pending-/Regulärdateneingriff, kein Schlüsseltransfer und keine Produkt-/Rechteänderung.

Die zusätzliche rohe `__attempts`-Sonde ist eine **ungültige Annahme des Entwicklers** und bleibt im angehaltenen Diff ausdrücklich unberichtigt: Der Testbau leitet `attempts` über `store.get` aus dem regulären Ereignisprotokoll ab und persistiert keinen zweiten solchen Datenweg (`index.html`, `store`/`EV_LESEN`; `src/module/lesen.mjs`). Das ist kein bewiesener Produkt- oder Datenbereitschaftsfehler.

Die Originaltext-Folgeassertion vergleicht die sichtbaren Details mit dem rohen `good`-Sprachtext. Die bestehenden Quelldaten enden in beiden Sprachen mit einem Punkt; `schoolPoints` entfernt bei der Punktdarstellung abschließende Punkte. Das ist eine noch unabhängig zu prüfende **C-Prüf-/Auftragsfrage**, kein erfolgreicher Originaltextbeleg und kein bewiesener Produktfehler. Der bisherige Verdacht einer falschen Sortierung ist nicht bestätigt: Der verglichene erste Quellrecord ist bereits der neueste und eindeutig. Die präzisierte Record-Auswahl wurde wegen der vorgeschalteten ungültigen Sonde noch nicht erneut bis zur Originaltextassertion geprüft. Es wurde weder die Originaltextassertion gelockert noch die Produktdarstellung geändert.

Die historische genaue Verzweigung des früher beobachteten Sicherungshinweises0 bleibt **unbewiesen**. Die frische Diagnose belegt eine notwendige Bereitschaftsvoraussetzung; die neuen Läufe zeigen, dass ein bereits laufender normaler Abgleich sie gelegentlich rechtzeitig erfüllen kann. Aus diesen Teilbelegen folgt kein allgemeiner G-, DE/EN- oder PR1-PASS.

### Pause, verbleibender Umfang und lokale Sicherung

Atlas gab nach der Pause ausschließlich diesen Berichtsabschnitt und den vorhandenen Testdiff zur lokalen Sicherung frei. Danach keine weitere Probe, Korrektur oder lesende Ausbauarbeit. Keine C-Selbstbezeichnungsänderung begonnen, keine neue abschließende Verbotenprüfung, kein finaler Familien-/Testkandidaten-DE/EN-Nachweis, kein Freeze und kein vollständiges `npm test`. Version0.152.8-beta bleibt erhalten. Die frühere Familienprüfung, Fixtureversionen0.998/0.999 und V1-/V2-Fehlerhistorie werden dadurch nicht umgedeutet.

Dieser Sicherungscommit ist ein **unvollständiger Pausenstand**, kein eingefrorener Abnahmekandidat. Commit/Tree werden in der Rückgabe genannt. Keine Geheimniswerte oder Namen Dritter in diesen Nachtrag aufgenommen. Kein Push, PR, Merge nach main, Release oder Deployment. Nächster Owner Atlas: enge unabhängige Prüfung der Halteregel und des sachgerechten C-Nachweises; kein weiteres Lauf-Go liegt vor.


## Abschluss V3.1/V3.2 · 24.11.2026

### Auftrag, Identität und Ergebnis

Tatsächlicher Bearbeiter bleibt Codex `/root/codex_cg_v3_delivery_20261124`, kein Claude-/Forge-Lauf. Die unabhängige Einordnung der Pause und der Folgeauftrag stehen in [PR206#7130289063](https://github.com/pahlborn/bis-school-app_src/pull/206#issuecomment-7130289063) und [PR206#7130307128](https://github.com/pahlborn/bis-school-app_src/pull/206#issuecomment-7130307128). Die konkret geprüfte damalige Folge enthielt unterschiedliche Fehler mit neuen erreichten Kriterien; §6 wurde dadurch nicht allgemein geändert. Die acht V3-Pflichtquellen auf main `ea840127ba8d7d5519a32179a81284093525c9b9` und die aktuellen C/G-Nachträge blieben verbindlich. Diese Hauptbasis ist im eigenen Featurezweig enthalten; main wurde nicht verändert.

Die abschließende Entwicklersuite lief nach [Root-Laufsignal PR206#7132117868](https://github.com/pahlborn/bis-school-app_src/pull/206#issuecomment-7132117868) exakt auf:

- Code/Testcommit: `f8108146fcefd9417418b82997e3e51c0f6bd545`.
- Tree: `1f777dbde4c5c8f445c36b58fe27393f90e68d3f`.
- Eigener Zweig: `feature/elternbereich-cg-v3-20261124`; Worktree `/workspace/work/bq-eltern-cg-v3-20261124`.
- Befehl: `CHROMIUM_PATH=/usr/bin/chromium npm test`.
- Ergebnis: **1272 Tests, 1272 PASS, 0 FAIL, 0 SKIP, 0 CANCEL, 0 TODO; Exit 0**.
- Dauer: **924021.234602 ms** (15 Minuten 24.021 Sekunden).
- Primärlog: `/tmp/cg-v32-full-f810814.log`; Exitdatei: `/tmp/cg-v32-full-f810814.exit` mit Inhalt 0. Beide Dateimodus 0600.

HEAD/Tree und leerer Arbeitsbaum wurden nach dem tatsächlichen Lauf erneut bestätigt. Währenddessen gab es keinerlei Code-, Test-, Text- oder Dokumentänderung. Erst danach entstand dieser reine Berichtnachtrag. Es gab keine dritte Vollsuite oder weitere Zusatz-QA nach diesem Erfolg.

### Konkreter finaler Umfang

Die vorbereiteten C-Begriffe bleiben in DE/US-EN erhalten: Extending (E), Meeting expectations (M), Consolidating (C), Requires support (RS), Evaluations, Learning goals, Strengths und Areas of Development. Die sichtbaren Stufen haben ihre Kürzel mit den Originalbegriffen; mathematische Wortbedeutungen, interne Bezeichner und im Kontext erklärte Kürzel wurden nicht blind ersetzt. Vorhandene Lehrkrafttexte, Daten, Revisionen und Zuordnungen bleiben erhalten. Die Anleitung beschreibt den wirklichen Elternschritt mit Vorschau und Bestätigung.

Big Quest bezeichnet sich in eigenen sichtbaren DE/EN-Texten als Big Quest. Interne APP-/gap-/Studio-Kennungen und Verweise auf andere Apps bleiben kontextbezogen bestehen. Die Konzeptlänge wurde mit unveränderter Grenze 7000 erneut tatsächlich gemessen: **DE 6742, EN 6254 Zeichen**. Die W1-/Gehalten-/Fokus-/Sterne- und Berechtigungsregeln wurden nicht geändert. Paketversion und Versionstest bleiben `0.152.8-beta`; DE/EN-Releasehinweise sind konsistent, frühere Hinweise erhalten. Die Hauptbasis trägt weiterhin `0.152.7-beta`.

Die ursprüngliche unzutreffende `__attempts`-Rohspeichererwartung wurde durch den bestehenden kombinierten kanonischen Nachweis ersetzt: identische Kind-ID, normale Aufnahme abgeschlossen, keine Antworten mehr pending, reguläre datierte answer-Ereignisse und nach Elternlogin dieselben vollständigen vorhandenen Ereignisse. Der ausdrücklich angeforderte Schulimport kommt genau einmal hinzu und wird vollständig mit seiner Quelle verglichen. Sicherungshinweis-Anzahl1, DE/EN-Texte/Knöpfe und alle ursprünglichen Folgeprüfungen bleiben streng. Keine direkte Pending-/Regulärdatenmanipulation und kein Schlüsseltransfer. Die historische genaue Verzweigung des früheren Hint0 bleibt unbewiesen.

`good` und `next` werden in den bestehenden Evaluation-Details vollständig escaped und mit sichtbaren Zeilenumbrüchen dargestellt. Der unabhängige FAA-Review fand zusätzlich einen **echten C2-Fehler** in der Fachansicht: Dort blieb der Zeilenumbruch trotz vollständigem textContent sichtbar nicht erhalten. Primärbeleg: [V3.2-Auftrag PR206#7131771174](https://github.com/pahlborn/bis-school-app_src/pull/206#issuecomment-7131771174), geschütztes QA-JSON `/tmp/bq-sentinel-cg-final-20261124-qa/02-verbatim-result.json`. Details waren bereits korrekt; dieser FAA-Fachbefund bleibt historisch FAIL.

Der einzige Produktionsdelta von FAA zu f810814 ist ein vorhandener `.pssource-text`-Span um den schon escaped ausgegebenen next-Text in `schoolSubjectHTML`. Datum/Titel, Gliederung, Leerzustände, Fokusableitung und gespeicherte Daten bleiben unverändert; keine globale Parser- oder CSS-Regeländerung. Der bestehende C1-Browserfall prüft DE/EN mit ergänztem synthetischem Punkt/LF/literalem HTML: exakte sichtbare Gleichheit, tatsächliche Sichtbarkeit, Pre-wrap, keine erzeugten HTMLtags und unveränderte vollständige Quellrecords/gespeicherte Ereignisse. Die bisherigen synthetischen Sätze und Detailvergleiche bleiben erhalten.

### Tatsächliche Kandidaten und Sicherungskonfiguration

Die letzte Vollsuite baute beide Kandidaten wirklich aus f810814; sie wurden nicht aus einem älteren Artefakt übernommen:

| Variante | Tatsächlicher Bau und Pfad | Browser-/Datenbeleg |
| --- | --- | --- |
| Testinstanz `0.152.8-beta` | `testinstanzBauen({ziel})`, `/tmp/bq-cg-v3-test-kandidat`; vorhandene Suchläufe **18/18** | DE/EN, normales synthetisches Elternkonto und dasselbe regulär aufgenommene dynamische Kind; kanonische datierte Übungsdaten, vollständiger Quellen-/Ereignisvergleich, Sicherungshinweis **1**, beide Knöpfe und vollständige Elternhilfe/Links bestanden. |
| Familienfassung `0.152.8-beta` | `familieBauen(TEST_PW,{ziel})` mit vorhandener synthetischer Fixture, `/tmp/bq-cg-v3-familie-kandidat`; vorhandene Suchläufe **19/19** | Wirkliche verschlüsselte Hülle geöffnet, normale synthetische Elternanmeldung; vorher fehlende Kindbereitschaft als Gegenbeleg, danach dieselbe Kindzuordnung und vollständige Daten. DE/EN, Sicherungshinweis **1**, beide Knöpfe, Originaltext und Hilfe/Links bestanden. Danach liefen alle ursprünglichen Export-/Kindlösch-/Kontolösch-/Speicherschutzschritte durch. |

Die bestehenden synthetischen Fixture-Bauversionen `0.998.0-beta` und `0.999.0-beta` wurden weiterhin separat verwendet. Sie sind ausdrücklich kein Ersatz für die genannten Kandidaten. Die Kandidaten-Diagnosen der finalen Vollsuite nennen beide `0.152.8-beta` und Quellhash `f810814`.

Beide geprüften Konfigurationen verwenden den vorhandenen Kontenmodus und regulär bereitgestellte synthetische Kinddaten. Im Familien-Sandboxpfad sind accountsOn/canBackup weiterhin ausdrücklich true; im wirklichen Browser wird die Berechtigung durch den tatsächlich angezeigten Sicherungstipp belegt. Der dynamisch aufgenommene Testinstanzfall wird nicht durch ein neu gesetztes Testflag umgangen. Die bestehende Zeit-/Neue-Übung-/Berechtigungsregel bleibt erhalten und ihre ursprünglichen Fälle bestehen. **Kontenloses G bleibt PR6**; dafür wird kein PASS behauptet.

### Verbotenprüfung und Quellenreferenzen

Die bestehende Liste umfasst unverändert 13 Einträge; Liste, Bauprüfer und Grenzwerte wurden nicht verändert. Die vollständige öffentliche Testfassung besteht ihren bestehenden Suchlauf; die öffentliche Familienhülle besteht ihren getrennten Suchlauf. Zusätzlich prüfen die tatsächlichen Browser beider Kandidaten in DE/EN den vollständig erzeugten Elterntext einschließlich gefalteter Hilfe und wirklicher href-Ziele: alle Fachansichten, Konzept, Unterstützung, Hilfeseite und Über-Big-Quest-Ansicht. **0 Listenfunde**. Erlaubte interne data-/class-/Legacykennungen werden dabei nicht mit benutzerlesbarem Text oder Linkzielen verwechselt.

Der erste zusätzliche Blick in die entschlüsselte deutsche Familien-Konzepthilfe hatte vier gesperrte Einträge ergeben; dieser echte Vorfix-Befund wurde nicht als Hüllen-PASS umgedeutet. Nach ausdrücklicher Atlas-Disposition wurden nur eigene Hilfs-/Quellenbeschreibungen und zwei eigene sichtbare Bezeichnungen mit vorhandenen neutralen Begriffen bereinigt. Originale Evaluations-/Lehrkraftdaten wurden nicht ersetzt. Eine identifizierende URL wurde ohne erfundenes Ersatzziel als neutrale Textreferenz erhalten. Weiterhin **4 Schulreferenzen = 3 unveränderte reale Links + 1 Textreferenz**, außerdem unverändert **56 weitere Quellenlinks** und dieselbe Gruppierung.

Die Rohquelle `index.html` enthält noch drei Listenbegriffe an acht Stellen in Kommentaren beziehungsweise Legacy-/internen Kennungen. Diese sind von der erzeugten Oberfläche zu unterscheiden. Die zusammengesetzte App enthält einen weiteren Modul-/Legacybezug; deshalb erfasst der vorhandene explizite Rohquellmarker genau einen zusätzlich vollständig entfernten Eintrag, nicht fälschlich zwei nur aus index.html entfernte. Der Detektor bleibt aktiv und seine negativen bestehenden Fälle erhalten. Keine gesperrten Werte oder Namen werden hier wiedergegeben.

### Eigene V3.1/V3.2-Läufe und erhaltene Fehlerhistorie

Die folgenden Vorläufe prüften aufeinanderfolgende Arbeitsstände; erst die benannten Freeze-Läufe sind vollständige Commit-/Treebelege. Ein früherer grüner Teilfall macht weder einen späteren FAIL noch einen abgebrochenen historischen Lauf grün. Sämtliche Einträge unten haben 0 SKIP/CANCEL; Ergebnisse werden nicht addiert.

| Lauf | Tests | PASS / FAIL | Exit | Dauer ms | Primärlog / Exitdatei | Befund |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| A1 | 4 | 3 / 1 | 1 | 9879.431653 | `/tmp/cg-v31-admission-wording.log` / `/tmp/cg-v31-admission-wording.exit` | Admission/Pending plus strenge DE/EN-Detailfälle; neuer unzutreffender Gesamtlogvergleich übersah den regulär hinzukommenden Schulimport. |
| A2 | 1 | 1 / 0 | 0 | 8303.268195 | `/tmp/cg-v31-test-candidate.log` / `/tmp/cg-v31-test-candidate.exit` | Kanonische vorhandene Ereignisse plus exakt angeforderter vollständiger Import; realer Testkandidat DE/EN bestanden. |
| A3 | 55 | 51 / 4 | 1 | 134514.259293 | `/tmp/cg-v31-wording-focus.log` / `/tmp/cg-v31-wording-focus.exit` | Erster eigener Textfokus: vier überholte Text-/Export-/Versionserwartungen. |
| A4 | 137 | 135 / 2 | 1 | 651948.731287 | `/tmp/cg-v31-focus-final.log` / `/tmp/cg-v31-focus-final.exit` | Breiter Fokus: zwei weitere alte Selbstbezeichnungsassertionen; ursprüngliche Verhaltensfolgen bleiben erhalten. |
| A5 | 2 | 2 / 0 | 0 | 21232.445915 | `/tmp/cg-v31-candidates-focus.log` / `/tmp/cg-v31-candidates-focus.exit` | Beide tatsächlichen Kandidaten; damalige sichtbare Schul-/Sicherungsflächen bestanden, noch kein umfassender Hilfenachweis. |
| A6 | 44 | 43 / 1 | 1 | 46710.21061 | `/tmp/cg-v31-final-help-focus.log` / `/tmp/cg-v31-final-help-focus.exit` | Ein neu zu breiter Kürzelscan beanstandete auch im Kontext erklärte Kürzel; sachgerecht auf benannte UI-Stufen präzisiert. |
| A7 | 2 | 1 / 1 | 1 | 45161.72184 | `/tmp/cg-v31-final-candidates.log` / `/tmp/cg-v31-final-candidates.exit` | Testkandidat bestanden; Familien-Fixture stoppte vor neuem Kandidatenbau an der erweiterten Fach-/Hilfenprüfung. Weitere eigene Bezeichnungen bereinigt und Text/Linkziele von internen Kennungen getrennt. |
| A8 | 4 | 4 / 0 | 0 | 31871.576085 | `/tmp/cg-v31-help-candidates-green.log` / `/tmp/cg-v31-help-candidates-green.exit` | Relevante DE/EN-Hilfe, Textgrenze und beide wirklichen Kandidaten grün. |
| Voll1 | 1272 | 1265 / 7 | 1 | 937584.128396 | `/tmp/cg-v31-full-c2b8431.log` / `/tmp/cg-v31-full-c2b8431.exit` | Erste vollständige Suite auf c2b8431/f2bfd5c7: bleibt FAIL; sieben konkret lokalisierte Erwartungsstellen. |
| A9 | 7 | 6 / 1 | 1 | 13554.039326 | `/tmp/cg-v31-full-failures-focus.log` / `/tmp/cg-v31-full-failures-focus.exit` | Sechs Fälle einschließlich vollständiger Restore-/Rechtefolgen und striktem Modulvergleich grün; Rohquellmarker noch fälschlich allein an index.html ausgerichtet. |
| A10 | 1 | 1 / 0 | 0 | 349.509393 | `/tmp/cg-v31-kern-marker-green.log` / `/tmp/cg-v31-kern-marker-green.exit` | Expliziter Marker auf tatsächlich zusammengesetzte App korrigiert; ursprünglicher Fall grün. |
| C2a | 3 | 2 / 1 | 1 | 8154.237622 | `/tmp/cg-v32-c1-focus.log` / `/tmp/cg-v32-c1-focus.exit` | Neue C2-Fachregression bereits grün; älterer T13-Fall durch ersetzten statt ergänzten synthetischen Basissatz rot. |
| C2b | 3 | 3 / 0 | 0 | 7500.381905 | `/tmp/cg-v32-c1-green.log` / `/tmp/cg-v32-c1-green.exit` | Ursprüngliche synthetische Sätze vollständig erhalten und nur ergänzt; gesamte C1-Datei grün. |
| Voll2 | 1272 | 1272 / 0 | 0 | 924021.234602 | `/tmp/cg-v32-full-f810814.log` / `/tmp/cg-v32-full-f810814.exit` | Finale vollständige Suite auf f810814/1f777dbd: PASS; währenddessen keinerlei Edits. |

Die sieben Fehler aus Voll1 betrafen die mehrzeilige Kapitelüberschrift, den auf die ganze gefaltete Kinder-Infoseite angewandten Wortscan, den expliziten Rohquellmarker, den historischen sterne-Ganzdateivergleich, den datierten Schul-Ausgangspunkt, den Sicherungstext und den Rechte-Helfer für den Quellenchip. Die Korrektur ändert ausschließlich sieben Testdateien: tatsächliche geöffnete Kinderhilfe ohne Bewertungsdaten, alle vier Originalstufen mit Kürzel, exakte Quelldatumsanzeige, vollständiger neuer Sicherungstext und dieselbe strenge Rechtematrix. Im historischen Modulvergleich sind ausschließlich die zwei konkret erlaubten STAR_TEXT-Literale abgebildet; der gesamte übrige Modultext und alle folgenden Funktions-/Generatorvergleiche bleiben exakt. Keine pauschale TEXT-/Dateiausnahme, keine entfernten Fälle oder gelockerten Schwellen/Timeouts.

Eine zusätzliche reine Lesesonde endete einmal an einem JavaScript-Syntaxfehler und wurde lesend korrigiert; kein Test oder Build daraus. Eine spätere Lesung eines älteren Familienartefakts wurde nicht als aktueller Produktnachweis gewertet. Die früheren V1-/V2-Abbrüche, die drei V3-Aufrufe und die tatsächliche Pause stehen unverändert oben. Insbesondere bleibt der historische Fokuslauf ohne ausgewählten Dateifall abgebrochen.

Wesentliche tatsächlich ausgeführte Befehle (jeweils mit `CHROMIUM_PATH=/usr/bin/chromium`):

```bash
# A1
node --test --test-name-pattern='Browser: die gebaute Testinstanz|2d Pending-Daten|T1–T3 table|T4 English' tests/testinstanz.test.mjs tests/konto-anmeldung.test.mjs tests/schulische-einstufungen.test.mjs
# A2
node --test --test-name-pattern='Browser: die gebaute Testinstanz' tests/testinstanz.test.mjs
# A3
node --test --test-concurrency=7 tests/elternbereich-c1.test.mjs tests/elternbereich-f3.test.mjs tests/elternbereich-b3.test.mjs tests/about.test.mjs tests/elternbereich-titel.test.mjs tests/module/kinddaten.test.mjs tests/version.test.mjs
# A4
node --test --test-concurrency=7 tests/elternansicht.test.mjs tests/eltern.test.mjs tests/elternbereich-a1.test.mjs tests/elternbereich-b1.test.mjs tests/elternbereich-b3.test.mjs tests/elternbereich-b4.test.mjs tests/elternbereich-c1.test.mjs tests/elternbereich-d1.test.mjs tests/elternbereich-d4.test.mjs tests/elternbereich-e1.test.mjs tests/elternbereich-f2.test.mjs tests/elternbereich-f3.test.mjs tests/elternbereich-titel.test.mjs tests/schule.test.mjs tests/schulische-einstufungen.test.mjs tests/evaluation-eltern-browser.test.mjs tests/evaluation-upgrade-browser.test.mjs tests/auftrag2-bestaetigt.test.mjs tests/module/kinddaten.test.mjs tests/about.test.mjs tests/version.test.mjs tests/schriften.test.mjs tests/hilfe-rollen.test.mjs
# A5 und A7
node --test --test-name-pattern='Sandbox: gebaute Familienfassung|Browser: die gebaute Testinstanz' tests/familienfassung.test.mjs tests/testinstanz.test.mjs
# A6
node --test --test-concurrency=7 tests/elternansicht.test.mjs tests/elternbereich-d4.test.mjs tests/elternbereich-f3.test.mjs tests/elternbereich-f4.test.mjs tests/neutral.test.mjs tests/hilfe.test.mjs tests/module/anmeldung.test.mjs
# A8
node --test --test-concurrency=7 --test-name-pattern='About \(DE/EN\)|T6/T7|Sandbox: gebaute Familienfassung|Browser: die gebaute Testinstanz' tests/neutral.test.mjs tests/elternbereich-f3.test.mjs tests/familienfassung.test.mjs tests/testinstanz.test.mjs
# A9
node --test --test-concurrency=7 --test-name-pattern='grown-ups header:|child: ❓ Help|jedes verbotene Wort|CI repairs preserve|school M/E applies|Sicherung: nur Eltern|Rechtematrix Stufe 1' tests/anmeldung.test.mjs tests/info.test.mjs tests/kern.test.mjs tests/module/ep05-ci-scope.test.mjs tests/module/wissen-ohne-tage.test.mjs tests/stufe1-p1.test.mjs tests/stufe1-p4.test.mjs
# A10
node --test --test-name-pattern='jedes verbotene Wort' tests/kern.test.mjs
# C2a/C2b
node --test tests/elternbereich-c1.test.mjs
# Voll1 und Voll2: jeweils vollständig, an den getrennt angegebenen Freezes
npm test
```

### Freeze-/Reviewabgrenzung und verbleibender Owner

- `c2b84313f3f6965ed80a96b541d2a8d30da2c756`, Tree `f2bfd5c70a4e8b399137051a492af513658d5272`: erster sauberer Code/Testfreeze; vollständiger Lauf 1272 Tests, 1265 PASS, 7 FAIL bleibt FAIL.
- `faaaba2eb87311118fdbb0f3b526c56ac76e969a`, Tree `1ddf2a27959d4a4b907d28eb208c1f306a103841`: danach ausschließlich sieben Testdateien, 15 Einfügungen/7 Löschungen. Produktionsdelta zu c2 ausdrücklich leer. Die unabhängige Runtime bestätigte 53 gezielte Node-Tests; ihr separater echter C2-Fachbefund blieb FAIL.
- `f8108146fcefd9417418b82997e3e51c0f6bd545`, Tree `1f777dbde4c5c8f445c36b58fe27393f90e68d3f`: zu FAA nur eine HTML-Ausgabezeile plus bestehender C1-Test, 8 Einfügungen/2 Löschungen. Der unabhängige Delta-Retest besteht laut Root-Go DE/EN × 320/1000 px für sichtbaren Fach-/Detailwortlaut, Escaping und Datenintegrität; 11 neue vorhandene Rendering-/Kandidatentests wurden tatsächlich ausgeführt. 42 identische FAA-Fälle wurden gezielt übertragen, nicht als neu ausgeführt behauptet. Die FAA-C2-FAIL-Artefakte bleiben erhalten. Erst danach startete die oben dokumentierte erfolgreiche finale Vollsuite.

Als **Fremdevidenzsicht** hat Sentinel danach Primärlog, Exitdatei, Hash und unveränderten Freeze unabhängig bestätigt: `/tmp/bq-sentinel-cg-delta-v3-20261124-qa/QA_ADDENDUM_V3_FULLSUITE.md`. Das ist eine Rücklesung dieses tatsächlichen Entwicklerlaufs, keine behauptete zweite Sentinel-Vollsuite. Der R3-Vollsuitenanteil ist damit passed; ausschließlich die normale PR-CI bleibt blocked.

Dieser Nachtrag entsteht ausschließlich nach der letzten Suite und wird als **reiner Berichtcommit** gesichert. Die getestete Code-/Testidentität bleibt f810814; der neue Berichtkopf und sein Tree werden separat in der Rückgabe genannt. Der abschließende Delta enthält nur diesen Dokumentpfad. Nach dem Bericht erfolgte kein erneuter Bau oder Testlauf.

**Ausgabedisziplin als Einschränkung:** Frühe Quellleseausgaben waren entgegen dem Auftrag unzureichend geschwärzt: betroffen waren synthetische Zugangskonstanten sowie bereits vorhandene Verbotenwerte. Atlas und Peter wurden darüber ohne Werte/Namen informiert. Dieser Bericht wiederholt keine solchen Inhalte. Die Tests verwendeten ausschließlich synthetische App-/Familienkonten und lokale Nachbauten; keine realen App-/Familienzugänge, Schlüssel oder Lernstände.

**Offen bleibt die normale PR-CI und damit die globale R3-/Integrationsannahme.** Lokaler Softwareumfang abgeschlossen; kein PR-/Merge-/Geräte- oder Veröffentlichungs-PASS daraus abgeleitet. Kontenloses G bleibt PR6, übriger Backlog unverändert. Atlas übernimmt finalen QA-Bericht, PR/CI und Peters konkrete Mergefrage. Kein eigener Push, PR, Merge nach main, Release oder Deployment. Am lokalen Ergebnis endet die Bearbeitung.
