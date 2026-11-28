# Fahrplan der Änderungen

Stand 28.11.2026 · Peters Vorgabe: Änderungen in sinnvoller Reihenfolge und sinnvollen Paketen, damit das Projekt nicht aus den Fugen gerät.

## Regeln

1. **Ein Paket = ein Auftrag an Atlas = eine Freigabe durch Peter.** Was nicht in einem freigegebenen Paket steht, wird nicht umgesetzt.
2. **Nacheinander, nicht nebeneinander.** Pakete, die dieselben Dateien ändern (vor allem `index.html`), laufen nie gleichzeitig.
3. **Erst entscheiden, dann beauftragen.** Ein Paket geht erst an Atlas, wenn alle Fragen darin entschieden sind (Klickdummy, Texte, Namen).
4. **Neue Ideen kommen in den Eingang** (unten), nicht in ein laufendes Paket.
5. **Jedes Paket nennt die Grundsätze aus `docs/konzept/leitbild.md`,** denen es dient, und hält sich an `docs/konzept/textleitlinie.md`. **Jedes Paket ergänzt das Anwenderhandbuch** um das, was es in Big Quest ändert (Notizen genügen, bis das Handbuch steht).
6. **Kein langer Umbau-Zweig.** Jedes Paket hat einen eigenen kurzen Zweig mit PR und Tests; main ändert sich nur nach Peters Ja. Veröffentlicht wird nur über Peters lokalen Chat mit Freigabe, nie automatisch.
7. **Sicherungspunkte:** vor dem Umbau und vor jeder Veröffentlichung ein Sicherungszweig `sicherung/…` auf genau dem Stand, der live ist oder live geht.

## Sicherungspunkte

Angelegt am 28.11.2026 nach der Bestandsaufnahme vom 27.11. (Git-Tags lassen sich aus dieser Umgebung nicht hochladen, deshalb Zweige; nicht löschen, nicht verschieben):

| Zweig | Stand | bedeutet |
| --- | --- | --- |
| `sicherung/stand-test-0.152.8` | `6b14cc1` (Merge #245) | Quellstand des Testsystems big-quest-test.github.io, 0.152.8-beta, veröffentlicht 24.11.2026 15:51 (Veröffentlichungs-Commit `18f9b83` im Auslieferungs-Repo) |
| `sicherung/stand-alt-test-v148` | `b24890c` | Quellstand der alten Testadresse, Legacy v148, Build 06.11.2026 07:14 |
| `sicherung/vor-umbau-2026-11-28` | `81b5a96` (Merge #250) | main vor dem Umbau, Quellstand 0.152.9-beta |
| `sicherung/stand-test-0.152.9` | `81b5a96` (Merge #250) | Quellstand des Testsystems, 0.152.9-beta mit den Quest-Kennzeichen (J), veröffentlicht am 28.11.2026 (Veröffentlichungs-Commit `07830de`, `--live-pruefen` gleich, 1.279/1.279 Tests) |

Der Quellstand des bisherigen Produktivsystems (Legacy v148, Veröffentlichung `7a988ef` vom 06.11.2026 06:40) ist nicht eindeutig belegt und hat deshalb keinen Sicherungspunkt.

## Stand der bisherigen Aufträge (`docs/konzept/auftrag-atlas-elternbereich.md`)

| Abschnitt | Stand | weiter |
| --- | --- | --- |
| C Begriffe, G Sicherungs-Hinweis | umgesetzt (#245) | – |
| J Symbole bei der Quest-Auswahl | umgesetzt (#248) | – |
| B Evaluations-Seite, F Übungsblätter unter „Verwalten“, H Fächerzeilen | freigegeben, nicht umgesetzt | dürfen weiterlaufen; passen zum neuen Klickdummy |
| **E „Was deinem Kind gefällt“ entfällt** | freigegeben, nicht umgesetzt | **angehalten (28.11.):** der neue Klickdummy behält den Abschnitt („Was Mia gefällt“) → Paket 3 |
| **A Fokus** | freigegeben, nicht umgesetzt | **angehalten:** wird durch die Aufgabensteuerung im neuen Klickdummy (Seite 4) ersetzt → Paket 3 |
| **D „Verwalten“ statt „Einstellungen“** | freigegeben, nicht umgesetzt | **angehalten:** ersetzt durch die Trennung „Verwalten“ (Evaluations, Aufgabensteuerung, Übungsblätter) und „⚙️ Einstellungen“ (Seite 6) → Paket 3 |

## Pflegezweig der laufenden Beta

`beta/0.152` – angelegt am 28.11.2026 auf `81b5a96`, dem Stand, der als 0.152.9-beta auf der Testinstanz läuft. Hier landen nur Fehlerbehebungen, die Tester brauchen, mit Nummern 0.152.10, 0.152.11 … – jede mit Peters Freigabe, eigenem PR gegen `beta/0.152` und Veröffentlichung über Peters lokalen Chat. Was dort behoben wird, kommt zusätzlich nach main.

Der Umbau läuft auf main ab **0.160.0-beta** (Peter, 28.11.; 0.153.x ist durch ältere Proben belegt). Der Rückweg bei Problemen: den Stand aus `beta/0.152` mit der nächsthöheren Nummer erneut veröffentlichen.

## Pakete in dieser Reihenfolge

| Nr. | Paket | Inhalt | Voraussetzung | Stand |
| --- | --- | --- | --- | --- |
| 1 | **Grundlagen** (nur Dokumente) | Leitbild, dieser Fahrplan, Anhalten von A und D; Wichtiger Hinweis; Textleitlinie Regel 8 | – | in Arbeit (PR #253) |
| 2 | **Rechtliche Bereinigung** (App, klein; dringend, weil das Testsystem unverschlüsselt öffentlich ist) | Textdurchsicht aus dem Leitbild: IB/PYP und Motto der Schule entfernen, neues Motto, Leitsatz im Wissensbaum, Über Big Quest und Wichtiger Hinweis neu, Zitate der Schule im Konzept ersetzen, Rückmeldungen, Code-Kommentare, Quizfrage „ATL“, Pisolala „Risk-taker“, Quellengruppe; **Abzeichen-Namen** | Paket 1 gemergt; Abzeichen-Namen endgültig (Regel „Name ohne Steigerung“) | Entscheidungen fast fertig |
| 3 | **Elternbereich neu** (ersetzt A, D und E) | Klickdummy-Seiten 1–6 als Abschnitt I: Übersicht, Fachansicht, Hilfe, Verwalten mit Aufgabensteuerung, Evaluations, ⚙️ Einstellungen; Extras-Schalter, Start auf Englisch, Learning-goal-Punkte aus dem Backlog, Vormerkungen | Klickdummy entschieden; Paket 2 umgesetzt | Klickdummy in Durchsicht; gesammelt im Backlog `docs/konzept/backlog.md` |
| 4 | **Karriereleiter** (Belohnungen) | Sterne, Sternenregen, Titel, Abzeichen-Auslöser und Stufen nach der Analyse vom 28.11. (Befunde 2–10), Frage „vier Belohnungen zu viel?“, Grafik fürs Handbuch | Entscheidungen zur Analyse; Paket 2 umgesetzt (Namen) | Analyse fertig, Entscheidungen offen |
| 5 | **Englisch und Handbuch** | Klickdummy und Elterntexte auf Englisch durchsehen; Handbuch ersetzt nach gemeinsamem Abgleich den Elternteil des Konzepttexts | Pakete 3 und 4 umgesetzt | später |

**Begleitend vor der Beta:** fachkundige Prüfung von Wichtigem Hinweis, Impressum, Datenschutz, Motto, Abzeichen-Namen und Begriffen aus Toddle (nach Paket 2, vor der Beta mit fremden Familien).

## Eingang (noch keinem Paket zugeordnet)

Ausführlich gesammelt wird im Backlog `docs/konzept/backlog.md` (Sammlung, kein Auftrag); Fehler der laufenden Beta in `docs/fehler-backlog.md`.

- Überschrift „Learner Profile Attributes“ in den Evaluations: behalten oder umbenennen (wird nach Paket 1 entschieden, dann Paket 2 oder 3).
- iPad-Hülle für die Familienfassung oder echte App (Toddle-Übernahme außerhalb des Testsystems).
- Alte, weiter erreichbare Instanzen prüfen: alte Testadresse (Legacy v148) und die Proben unter big-quest-test.github.io (Formular, lokaler KI-Pilot, Kamera, Passwort, Zugang). Sie zeigen ältere Texte, ggf. mit IB-Bezug und Motto der Schule; abschalten oder schützen (Entscheidung Peter, gehört zu Paket 2).
