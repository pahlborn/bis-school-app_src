# BQ-PARENTS-01-CG-TEXT V1 · angehaltener Entwicklungsstand

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
