# Aufträge an den Dev-Agenten (03.11.2026)

Drei Aufgaben, die nach der Reihe „Elternbereich“ (A1–F6, alle gemerged bis #99) offen sind. Jede ist für sich umsetzbar. Reihenfolge nach Nutzen: **1 → 2 → 3**. Auftrag 2 ist von Peter entschieden (03.11.); Auftrag 3 braucht vorher noch eine Entscheidung von Peter.

Für alle gilt wie bisher: Konzept `docs/konzept/elternbereich.md` (R10 „Zeit ist relativ“: Fortschritt in Aufgaben, keine Zeitwörter; R11 Verantwortung bei den Eltern), Prüfbericht unter `docs/pruefung/`, eigener Test, `npm test` grün, Gegenprobe gegen `main`.

---

## Auftrag 1 · Grundlage-Aufgaben für Quests mit Hauptstandard

### Befund
Gezählt am 03.11. mit 25 erzeugten Runden je Quest (`WORLDS[k].build()`, Stufe über `levelOf`): **10 von 19 Quests mit Hauptstandard haben keine einzige Aufgabe auf Stufe 1 (Grundlage).**

| Fach | Quest | Hauptstandard |
|---|---|---|
| Maths | Time & Numbers (`numbers`) | M-N1 |
| Maths | Number Combinations (`combos`) | M-N4 |
| Maths | Word Problems (`wordprob`) | M-N4 |
| Science | Forces & Friction (`forces`) | S-F1 |
| Science | Units & Measuring (`units`) | M-M1 |
| Science | Bar Graphs & Worksheets (`graphs`) | M-D1 |
| English | Capital Letters & Full Stops (`sentences`) | E-W1 |
| English | Word Building (`words`) | E-R1 |
| Deutsch | Anleitung schreiben (`anleitung`) | D-W1 |
| Library & Reading | Library & Research (`library`) | E-W2 |

Ohne Hauptstandard und ohne Grundlage (nachrangig): Roald Dahl Poetry, Finish Every Task, Teamwork, Glows/Grows & School Life, Music & Pantastic.

### Warum das wichtig ist
- **Lücken (Konzept 6.5):** Die Lücken-Spur soll mit einer Grundlage-Aufgabe beginnen. Fehlt sie, weicht `gapTasks` auf Klassenniveau aus (D2). Ausgerechnet ein Kind mit „Requires support“ bekommt dann keinen kleinen Einstiegsschritt.
- **„Braucht Unterstützung“ (`adaptRound`, `WANT.RS.l1 = 2`):** Die Runde soll mindestens zwei Grundlage-Aufgaben enthalten. Bei diesen Quests geht das nicht, die Regel läuft ins Leere.
- **Texte:** „So lernt das Kind“ (F2) beschreibt Grundlage als „ein Schritt, oft mit Hilfe“. Bei der Hälfte der Quests gibt es das nicht.

### Anforderungen
- Je Quest der Tabelle Grundlage-Aufgaben (`level: 1`): **ein Schritt**, wo möglich mit Bild- oder Modellhilfe, im Modell der Schule (`SCHOOL_WAY[k]`, „So zeigt es die Schule“). Keine neuen Methoden, kein „zweiter Weg“.
- Mindestens so viele Varianten, dass eine Runde nicht dieselbe Aufgabe doppelt zeigt (Richtwert: 6 je Quest, in Mathe gern erzeugt mit wechselnden Zahlen).
- Sprache und Schreibweise wie die vorhandenen Aufgaben der jeweiligen Quest. Keine Schul-, Klassen-, Lehrer- oder Ortsnamen (S8, `verbotene-woerter.txt`).
- Jede neue Aufgabe mit Tipp („Show me how“), wo die Quest Beispiele hat auch mit Beispiel. Brücken (`bridgeFor`) bleiben, wie sie sind.
- **Reihenfolge:** zuerst Mathe (M-N1, M-N4), dann die übrigen Standards der Tabelle.

### Abnahme
- Neuer Test: Jede Quest mit Hauptstandard erzeugt in 25 Runden mindestens eine Aufgabe auf Stufe 1.
- `tests/elternbereich-d2.test.mjs` (Fall „Lücke ohne Grundlage“, M-N4): Die erste Lücken-Aufgabe ist dann Stufe 1. Den Fall auf `mitGrundlage = true` umstellen.
- Eine Runde bei „braucht Unterstützung“ enthält für diese Quests mindestens 2 Grundlage-Aufgaben.

### Nicht Teil des Auftrags
Schwellen, Einschätzung, Lückenlogik.

---

## Auftrag 2 · Lücken-Balken ehrlich machen

### Befund
`gapProgress(g)` (`index.html`) zeigt den Fortschritt der weitesten Quest einer Lücke so:
- Balken = erste Versuche / 20, Text „noch etwa N Aufgaben“
- danach „noch an N weiteren Übungstagen“ (bis 5 Übungstage)
- danach „noch nicht ganz sicher – weiter üben“

Geschlossen wird die Lücke aber erst bei **„bestätigt sicher“** (`assessQuest`). Dafür müssen **alle** diese Bedingungen erfüllt sein:
1. mindestens 20 erste Versuche ✔ (zeigt der Balken)
2. an mindestens 5 Tagen ✔ (zeigt der Text)
3. über **mindestens 14 Kalendertage** verteilt ✘ (zeigt nichts)
4. Stand „Sicher“ (`standOf`): unter den letzten 20 Antworten auf Klassenniveau mindestens 6, davon mindestens 80 % richtig, richtig an mindestens 3 Tagen ✘ (zeigt nichts)

**Folge:** Der Balken ist voll, und trotzdem steht „noch nicht ganz sicher – weiter üben“. Eltern sehen nicht, was fehlt. Bei einem Kind, das viel, aber oft falsch übt, bleibt das beliebig lange so.

### Entscheidung Peter (03.11.): Bedingung 3 entfällt
Die 14 Kalendertage werden **gestrichen**. Begründung:
- Die Bedingung misst Zeit, nicht Lernen. Eine einzelne Aufgabe vor zwei Wochen plus 19 heute erfüllt sie schon.
- Sie widerspricht R10 („Zeit ist relativ“) und lässt sich ohne Zeitwort nicht anzeigen.
- Der Abstand, auf den es didaktisch ankommt (Behalten statt Leistung im Moment, Soderstrom & Bjork 2015; Abstand beim Wiederholen, IES Practice Guide 2007), prüft schon Bedingung 4: richtig an mindestens 3 verschiedenen Übungstagen.

**Neu gilt „bestätigt“ bei:** mindestens 20 ersten Versuchen, an mindestens 5 Übungstagen, und Stand „Sicher“ oder „Darüber hinaus“ wie heute (Bedingung 4). Bedingungen 1, 2 und 4 bleiben unverändert.

**Das betrifft nicht nur Lücken:** „bestätigt“ oder „vorläufig“ steht auch in der Einschätzung der Fachansicht (`assessQuest().sure`, „Worauf beruht das?“). Beide Stellen ändern sich bewusst mit.

### Anforderungen
- **`assessQuest`:** `sure` ohne `span >= 14`. Die Variable `span` entfällt, wenn sie sonst nicht gebraucht wird.
- **Balken (`gapProgress` / `gapProgressHTML`):** nie voll, solange eine der Bedingungen 1, 2 und 4 fehlt. Zum Beispiel: Balken = kleinster Anteil der drei Bedingungen.
- **Text:** nennt immer genau das, was als Nächstes fehlt, in Aufgaben oder Übungstagen, zum Beispiel:
  - „noch etwa 8 Aufgaben“
  - „noch 3 Aufgaben auf Klassenniveau richtig“
  - „noch an 2 Übungstagen“
  - „noch an einem weiteren Übungstag richtig“ (für „richtig an mindestens 3 Übungstagen“)
- **Keine Zeitwörter** (T17): kein „Tage bis“, „Wochen“, „fällig“, „bis zum“.
- **Gleiche Funktion an beiden Stellen:** „Auf einen Blick“ (E3) und die Fachansicht nutzen dieselbe Funktion. Beide ändern sich mit.
- **Sprachen:** DE und EN (amerikanisches Englisch).
- **Texte mit „zwei Wochen“ / „14 Tage“ anpassen** (DE und EN), damit sie zur neuen Regel passen:

  | Stelle in `index.html` | heute |
  |---|---|
  | `PT.de.when` / `PT.en.when` („Worauf beruht das?“) | „Belastbar ab etwa 20 Aufgaben an 5 Tagen über zwei Wochen.“ |
  | ⓘ `overview` (HELP / HELP_EN) | „Bestätigt: nach etwa 20 Aufgaben an 5 Tagen über zwei Wochen.“ |
  | „So funktioniert Big Quest“ → Wie die App einstuft, Kurzfassung | „„bestätigt“ ab etwa 20 Aufgaben an 5 Tagen über zwei Wochen“ |
  | dort „Genaue Schwellen“ → Einschätzung im Elternbereich | „„Bestätigt“ ab 20 ersten Versuchen an 5 Tagen über mindestens 14 Tage“ |
  | Konzept `docs/konzept/elternbereich.md` 6.3 | „20 erste Versuche an 5 Tagen über mindestens 14 Tage“ |

  **Nicht** gemeint ist „in den letzten 14 Tagen an N Tagen geübt“ (`sumIntro`). Das ist eine Rückschau, keine Schwelle.

### Abnahme
- **Neue Regel:** Test mit erfundenen Daten – 20 Aufgaben an 5 Übungstagen **innerhalb von 6 Kalendertagen**, Klassenniveau 80 % richtig an 3 Tagen, ergibt „bestätigt“ und schließt die Lücke („Lücke geschlossen ✓“).
- **Balken:** Test für jeden der drei Fälle, in denen nur Bedingung 1, 2 bzw. 4 fehlt. Jeweils Balken unter 100 % und der passende Text.
- **Bestehende Tests** grün, wo nötig mit angepasstem Text oder angepassten Daten:
  - `elternbereich-d4`, `elternbereich-e3`, `elternbereich-e1` („Worauf beruht das?“)
  - `about` (Schwellen-Text)
  - alle Tests, die mit wenigen Kalendertagen ausdrücklich „vorläufig“ erwarten
- **Gegenprobe:** mit `span >= 14` wieder drin ist der neue Test rot.

---

## Auftrag 3 · Automatisch veröffentlichen nach dem Merge

### Entscheidung vorher (Peter)
Heute veröffentlicht nur Peter: `node werkzeug/verschluesseln.mjs` auf seinem Windows-Rechner. Der Schlüssel liegt mit DPAPI geschützt in `%LOCALAPPDATA%\bis-school-app\schluessel.json`. Danach überträgt er `dist/` ins Repo `bis-school-app`.

Automatisch geht das nur, wenn **der Schlüssel (oder das Passwort) als Geheimnis bei GitHub liegt**. Damit kann jeder, der die Workflows im Repo `bis-school-app_src` ändern darf, die Seite entschlüsseln. Das Repo ist privat; es bleibt trotzdem eine zweite Stelle neben Peters Rechner. **Nur umsetzen, wenn Peter das ausdrücklich will.**

### Anforderungen
- **Workflow im Repo `bis-school-app_src`:**
  - Auslöser: Push auf `main` (nach einem Merge) und manueller Start.
  - Höchstens ein Lauf gleichzeitig; ein neuerer Lauf bricht einen älteren ab.
- **Vor dem Veröffentlichen:**
  - `npm test` vollständig grün (Chromium wie in den Tests: `CHROMIUM_PATH`).
  - Bei Rot wird nicht veröffentlicht.
- **`werkzeug/verschluesseln.mjs` braucht einen Modus ohne Terminal.** Heute bricht das Skript ohne TTY ausdrücklich ab („Passwort noetig, aber kein Terminal“).
  - Vorschlag: Schalter `--ci`, der den **Schlüssel** (nicht das Passwort) aus einer Umgebungsvariable liest, z. B. `BQ_SCHLUESSEL` (Base64).
  - So muss das Passwort nie zu GitHub, und PBKDF2 läuft nicht im Workflow.
  - Alle heutigen Prüfungen bleiben und brechen ab:
    - verbotene Wörter außerhalb des Tresors
    - Probe-Entschlüsselung Byte für Byte
    - Schlüssel öffnet die veröffentlichte Seite
  - Der Schlüssel erscheint nie im Log, auch nicht gekürzt.
- **Übertragen ins Repo `bis-school-app`:**
  - mit einem Deploy-Key **nur für dieses Repo** (Schreibrecht) oder einem fein eingeschränkten Token nur für dieses Repo
  - Inhalt von `dist/` ersetzen, Commit mit Version und Commit-Kennung aus `_src`
- **Nach dem Veröffentlichen:** `--live-pruefen` gegen die veröffentlichte Seite. Ist das Ergebnis nicht „gleich“, ist der Lauf rot.
- **Der manuelle Weg bleibt** unverändert möglich, der README-Abschnitt „Veröffentlichen“ wird ergänzt.
- **Geheimnisse:** `BQ_SCHLUESSEL` und der Deploy-Key werden nur von Peter eingetragen. Im Repo steht nur, wie sie heißen.

### Abnahme
- Testlauf auf einem Zweig gegen ein Test-Ziel (eigenes Wegwerf-Repo oder `--ziel`), nicht gegen die echte Seite.
- Belege im Prüfbericht:
  - roter Test, also keine Veröffentlichung
  - verbotenes Wort, also Abbruch
  - falscher Schlüssel, also Abbruch
  - Log ohne Schlüssel
- Erst dann auf `main` aktivieren.

### Nicht Teil des Auftrags
Passwortwechsel (`--passwort`) und Schlüssel vergessen (`--vergessen`) bleiben manuell auf Peters Rechner.
