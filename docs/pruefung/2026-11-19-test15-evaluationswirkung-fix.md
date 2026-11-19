# TEST15-WIRKUNG-FIX-01-v1 · gesicherter Arbeitsstand

## Anliegen

Kriterienbezogene, bestätigte `school_evaluation`-Ereignisse sollen auf die regulären Schullücken, den automatischen Fokus und die Startschwierigkeit wirken (EV-7.1, EV-7.2 und EV-7.4). Der bisherige Wirkungsfilter schloss sie wegen ihrer `manual`-Revisionsmetadaten aus.

Auftrag: [Korrekturauftrag](https://github.com/pahlborn/bis-school-app_src/pull/206#issuecomment-7020117752), [unabhängiger Vorbefund](https://github.com/pahlborn/bis-school-app_src/pull/206#issuecomment-7012198219). Ausführende Instanz: Codex. Basis: `1ea91622e7f55dbc4a0bebcc89bd199bade31928`; Zweig: `fix/test15-evaluation-effects-20261119`.

## Umgesetzt

- `schoolRatings` lässt das bereits validierte und abgeleitete Kriterienformat im regulären Wirkungsfilter zu. Alte manuelle Einzelstandard-Pilotzeilen bleiben ausgeschlossen. Revisions- und Rücknahmemetadaten bleiben erhalten; `classTopics` und der Sonderkartenpfad sind unverändert.
- Der vorhandene Formular-Browsertest prüft nach echter Bestätigung die sichtbare aktive M-N1-Lücke, den tatsächlichen automatischen Fokus, `schoolStandFor` und `standOf` sowie die Grenze von sechs eigenen Antworten an zwei Übungstagen. Eine Legacy-Assertion schützt den Ausschluss alter Pilotzeilen aus der regulären Lückenspur.
- Eine zusätzliche D5-Prüfung im bestehenden Browsertest soll tatsächlich gestartete Achterrunden mit anderem aktuellem Thema und ohne anderes aktuelles Thema prüfen. Dieser Testlauf wurde abgebrochen; sein Abnahmeziel ist nicht nachgewiesen.
- Auf ergänzenden Auftrag wurde ausschließlich die Versionsvorbereitung auf `0.152.5-beta` vorgenommen: Paketversion, strikte Versionserwartungen und ein DE/EN-Eintrag in den vorhandenen Release Notes. Keine Abhängigkeiten, Skripte oder CI-Konfiguration geändert.

## Prüfung

Umgebung: Node 24.22.1, vorhandenes Playwright, Chromium über `/usr/bin/chromium`. Ausschließlich erfundene Testdaten und lokaler Speichernachbau; keine produktiven Konten oder Daten.

### Geplante rote Vorfix-Gegenprobe

Vor der Produktänderung, gegen den unveränderten Produktcode der genannten Basis:

```sh
CHROMIUM_PATH=/usr/bin/chromium node --test --test-name-pattern='EV4/EV7 manual' tests/evaluation-eltern-browser.test.mjs
```

**Erwartungsgemäß rot:** ein Test, null bestanden, einer fehlgeschlagen. Das echte Formularsetup erreichte die Vorschau ohne gespeichertes Ereignis, genau ein Ereignis nach doppelter Bestätigung und die Ableitung M-N1=C / M-N3=M. Erst die Wirkungsassertion scheiterte: `.pgap.on` ergab `0` statt `1` (`confirmed M-N1=C is visibly the active school gap`). Die Assertions wurden für den Nachfixlauf nicht abgeschwächt.

### Gezielter Nachfixlauf

```sh
CHROMIUM_PATH=/usr/bin/chromium node --test --test-name-pattern='EV4/EV7 manual|EV7 D5' tests/evaluation-eltern-browser.test.mjs
```

**Gesamtlauf ABGEBROCHEN, Exit 1:** zwei Tests, einer lokal bestanden, keiner als fachlicher Assertionsfehler gezählt, einer `cancelled` durch Timeout.

- **Formularfall lokal bestanden** (65,533 Sekunden): sichtbare aktive M-N1-Lücke, keine zusätzliche M-N3-Lücke bei Einstufung M, `numbers` im tatsächlichen automatischen Fokus, Schulstartwert C ohne eigene Antworten; fünf Antworten an zwei Tagen → C, sechs Antworten an einem Tag → C, sechs Antworten an zwei Tagen → eigene Einstufung RS. Die gespeicherte Evaluation blieb erhalten.
- **D5 ABGEBROCHEN** (120,188 Sekunden): `tests/evaluation-eltern-browser.test.mjs:625:1`, Meldung `test timed out after 120000ms`. Der Lauf liefert keinen vollständigen D5-Abnahmenachweis. Eine innere Fehlerstelle oder Ursache wurde nicht festgestellt; nach dem Abbruch erfolgten keine Diagnose, Wiederholung oder weitere Korrektur.

`git diff --check` war vor der Sicherung ohne Befund. Die lokalen Ergebnisse haben keinen CI-Lauflink und sind keine grüne CI-Aussage.

## Gefunden und Grenzen

Die geplante Gegenprobe bestätigt den Filterfehler im synthetischen Formularpfad. Der bestandene Nachfix-Formularfall belegt die genannten Softwarewirkungen lokal. Ein Geräte-Ursachennachweis folgt daraus nicht.

Wegen des unerwarteten D5-Abbruchs wurde angehalten. **Nicht ausgeführt:** vollständiges `npm test`, eigenständiger Upgrade-Browsertest, vollständige Legacy-/Revisions-/Rücknahmeregression und unabhängige Abnahme dieses Kandidaten. Der ergänzte Legacy-Ausschluss wurde im gezielten Lauf nicht ausgeführt. Die Wirkung auf die Aufgabenquote ist nicht vollständig nachgewiesen.

Dieser WIP-Stand dient ausschließlich der Sicherung vor der Entscheidung über das weitere Vorgehen. Kein Merge, Push, PR, CI-Start, Paket oder Veröffentlichung. Kein iPad-PASS; echte Speicherung und Wirkung mit realen Daten sind nicht abgenommen.
