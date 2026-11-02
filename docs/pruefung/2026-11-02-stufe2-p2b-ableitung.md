# 2026-11-02 – Stufe 2, P2b: Modul ableitung (Aufgabe 3a, nur Testbau)

## Auftrag
Aufgabe 3a (US7.2, Konzept 7.2 und 9.2): Die App liest heute fertige Werte (`total`, `due`, `ev`, …). Mit Ereignissen müssen diese Werte aus der Ereignisliste berechnet werden – **genau wie heute**, sonst ändert sich das Verhalten für Kathie. Ergebnis: ein Modul, das aus einer Ereignisliste (und optional einem Basisstand) den Stand mit den **bisherigen Speicherschlüsseln und Formaten** berechnet.

`index.html` ist unverändert. Das Modul ist **nur im Testbau** (`module.json`: `bau: test`, nach `ereignisse`). Kein Speichern, kein Schreiben von Ereignissen (3b), keine Umwandlung alter Daten (3c), kein Schnappschuss (Aufgabe 5).

## Änderungen
- `src/module/ableitung.mjs`: `derive(events, { now, base })` und die Tabellen der App (`DERIVE_LIMITS`, `DERIVE_GAPS`, `DERIVE_TREE_AT`, `DERIVE_RANKS`). Die Ereignisse werden mit `mergeLog` vereinigt (eine `id` einmal, nach Zeit sortiert) und dann der Reihe nach abgespielt; jedes Ereignis macht mit dem Stand, was die passende Stelle in `index.html` heute macht (Regeln aus dem Code gelesen, im Modul an jeder Stelle benannt). „Letzte gilt“-Werte kommen aus `lastWins`.
- `src/module/ereignisse.mjs`: **drei Nachschärfungen des Formats v1**, die der Blick in den echten Code erzwungen hat (siehe unten).
- `src/module/module.json`: `ableitung` (Testbau) mit dem Browser-Test `ableitung-vergleich`.
- `tests/module/ableitung.test.mjs` (neu, 18 Tests), `tests/ableitung-vergleich.test.mjs` (neu, Browser), `tests/module/ereignisse.test.mjs` (angepasst), `package.json` (Vergleichstest in `npm test`).

## Was `derive` liefert
Objekt mit den bisherigen Schlüsseln (ohne `bq2_<id>__`), Werte im selben Format wie heute:

| Wert | aus | Regel (heutige Stelle in `index.html`) |
|---|---|---|
| `attempts` | `answer`, `sheet_result` | das Ereignis **ist** die gespeicherte Zeile; Blattzeilen entstehen aus `sheet_result`; die letzten 200 (`observeAttempt`, `enterResult`) |
| `ev` | `answer` (Versuch 1 ohne Tipp-/Beispiel-/Lösungszeile), Lösung vor dem ersten Versuch, `sheet_result` | Zeile `[Tag, Stufe, ok]`; mit Hilfe (Tipp oder gestützte Aufgabe) = Stufe 1; Lösung vor dem Versuch = `[Tag, 1, 0]`; je Quest die letzten 60 (`recordAnswer`, `showWorked`) |
| `due` | `review` | Stufe 0 = falsch (Eintrag ans Ende, ersetzt gleiche Kennung), 1 und 2 = weitergeschoben (+3 und +7 Tage), 3 = erledigt oder zurückgenommen; höchstens 40 (`rememberWrong`, `advanceDue`) |
| `total`, `best_<quest>` | `round_done` | Summe der Sterne; Maximum je Quest, nur ab 1 Stern (`showResults`) |
| `badges`, `tried` | `badge` | Zähler je Art; `tried` = Quests der Abzeichen „inquirer“ in der Reihenfolge des ersten Mals (`addBadge`, `startRound`) |
| `treeStage` | Übungstage | Tage aus `ev`-Zeilen, `practice_day` und Blättern mit Eintrag; Stufen bei 1, 3, 6, 10, 15, 25; steigt nur (`practiceDays`, `treeStage`) |
| `rankSeen` | `rank_seen` | der höchste Titel (`renderRank`) |
| `sheets`, `sheetNo` | `sheet_created`, `sheet_result`, `sheet_discarded` | Blatt mit `items[{q, res, rec}]`; Ergebnis eintragen, Korrektur nimmt den alten Eintrag genau zurück (`undoResult`), `principled` einmal je Blatt, höchstens 8 Blätter; `sheetNo` = höchste Nummer |
| `name`, `birthday`, `emoji`, `kidLang`, `focusMode`, `focusManual`, `unlocked`, `storyCap`, `greetDay`, `mysteryDone`, `bdayParty`, `chk_<studio>` | „Letzte gilt“ | `lastWins`; leeren (`null`) = Schlüssel entfällt; Haken-Liste so lang wie der höchste gesetzte Haken |

Zusatzschlüssel `_days` (die Übungstage bisher): kein Speicherschlüssel, aber nötig, damit ein Basisstand (Schnappschuss, Aufgabe 5) mit späteren Ereignissen dasselbe ergibt wie alle Ereignisse zusammen. Ein Basisstand ohne `_days` (älteres Format) geht auch; die Stufe sinkt dann nie.

`base = { upTo, state }` wie die Nutzlast eines Schnappschusses: nur Ereignisse **nach** `upTo` zählen zusätzlich. Nicht enthalten (eigene Aufgaben): Freigaben und deren Protokoll (Aufgabe 4), Schuldaten, Sprachaufnahmen, alles, was auf dem Gerät bleibt.

## Nachschärfungen des Formats v1 (Modul `ereignisse`)
Die echten Daten der App passten an drei Stellen nicht zu dem, was in Aufgabe 2 festgelegt wurde:
1. **`answer.attempt` darf 0 sein.** Tipp, Beispiel und Lösung **vor dem ersten Versuch** schreiben heute `attempt: 0` (`state.attempts` ist noch 0). Mit `attempt ≥ 1` wären diese Zeilen als ungültig abgelehnt worden. Alle Formen der App sind jetzt im Test.
2. **`sheet_result` bekommt `day` und `qid`** (beide Pflicht): Der Tag, an dem die Eltern das Ergebnis eintragen, ist ein Ortstag der App und aus der UTC-Zeit nicht herzuleiten; `qid` braucht der Merkzettel `rec.due` des Blatts.
3. **`badge` bekommt `skill`** (optional, nur für „inquirer“): Die App merkt sich `tried` beim **Start** einer Quest, vor jeder Antwort; die Antworten aus „Practise Today“ gehören zu Quests, die das Kind nie gestartet hat. Nur das Abzeichen kann deshalb sagen, welche Quest gemeint ist.

## Abweichungen und Entscheidungen (Peter kann widersprechen)
1. **`due` entsteht nur aus `review`-Ereignissen**, auch das Weiterschieben (Stufe 1, 2) und das Erledigen – nicht aus `answer`. Die App schiebt nur weiter, wenn die Frage aus der Wiederholungsliste kam (`q.dueId`) und ohne Hilfe richtig war; dasselbe Stück Aufgabentext kann aber auch frisch in einer Runde kommen und darf dann nichts weiterschieben. Das steht in `answer` nicht drin. Die Regel „Hilfe zählt nicht als sauberer Erfolg“ steckt deshalb beim Schreiber (3b), die entsprechende Regel in `derive` ist die Stützstufe in `ev`. Die Gegenprobe „Hilfe zählt als Erfolg bei `due`“ aus der Aufgabe ist entsprechend die Gegenprobe „Hilfe = Erfolg auf der Aufgabenstufe“ bei `ev`.
2. **`tried` nur aus „inquirer“-Abzeichen mit `skill`** (statt „Quests, zu denen es Ereignisse gibt“, siehe 3. oben). Ein Schreiber ohne `skill` am Abzeichen lässt `tried` leer.
3. **`treeStage` aus der vollständigen Übungstage-Liste.** Die App rechnet aus `ev` (je Quest auf 60 gekürzt) und merkt sich die höchste Stufe; bei sehr langem Üben in nur einer Quest könnte `derive` später eine höhere Stufe liefern als die App. Praktisch nicht erreichbar, bevor das Kind viele Monate übt.
4. **Kürzen und Zurücknehmen** wie in der App Schritt für Schritt (200, 60, 40, 8). Wird eine Korrektur für einen Eintrag eingetragen, der schon herausgekürzt ist, findet sie nichts zum Zurücknehmen – wie in der App.
5. **Haken-Listen** (`chk_<studio>`) haben so viele Einträge wie der höchste gesetzte Haken; die App speichert immer die volle Länge. Beim Lesen ist beides gleich (nicht gesetzt = falsch).
6. **Böse Namen:** Questnamen und Abzeichen aus Ereignissen (`__proto__`, `constructor`) sind nie Eigenschaften des Ergebnisses im Sinne von Prototypen; ein Test hält das fest. Ob ein Absender überhaupt schreiben darf, prüft Aufgabe 4.

## Was 3b schreiben muss (aus dem Vergleichstest abgeleitet)
Der Mitschreiber im Test macht aus jeder Änderung der Speicherstellen ein Ereignis. Das ist die Vorlage für die Aufrufstellen in `index.html`:

| Stelle in der App | Ereignis |
|---|---|
| `observeAttempt`, `showHint`, `showExample`, `showWorked` (Zeile in `attempts`) | `answer` mit genau dieser Zeile als Nutzlast |
| `showResults` (`total`) | `round_done` {day, skill, stars, count} (`skill` auch `today`, `mix_…`) |
| `addBadge` | `badge` {day, badge}; „inquirer“ mit `skill` = die gestartete Quest |
| `rememberWrong` | `review` Stufe 0 {day, qid, box: 0, dueAt, question = die gespeicherte Kopie} |
| `advanceDue` | `review` {day, qid, box: 1 oder 2, dueAt} |
| fertig (Stufe 3) | `review` {day, qid, box: 3} |
| `buildSheet` | `sheet_created` {sheet, day, no, writing, items[{q, res: null}]} |
| `sheetResult` (seit A9; vorher `enterResult`) – Schreiber ist das **Kind** | `sheet_result` {sheet, index, res, day, qid} (`qid` = `q.dueId \|\| qId(q)`); bei „Noch nicht“ davor die `review` Stufe 0, bei einem fertigen Blatt `badge` „principled“. Keine Korrektur mehr (jede Aufgabe zählt einmal) |
| Blatt-Runde (`startSheetRound`, Ende in `showResults`) | nur `round_done` {skill: `sheet`} für die Sterne; keine `answer`-Ereignisse, keine eigenen Wiederholungen, Brücken oder Abzeichen |
| `discardSheet` (Erwachsene) | `sheet_discarded` |
| `renderRank` (`rankSeen`) | `rank_seen` |
| Profil, Einstellungen der Eltern, Tageshinweise, Haken | `profile_set`, `setting_set`, `day_flag`, `checklist_set` |

`practice_day` ist nicht zwingend: `derive` zählt die Tage aus Antworten und Blättern selbst.

## Tests
- **`tests/module/ableitung.test.mjs`** (18 Tests, ohne Browser, ca. 0,6 s): je Wert ein Fall mit von Hand gerechnetem Ergebnis – alle Formen der Antwortzeile und was davon in `ev` ankommt (12 Zeilen, Stützstufe, Lösung vor dem Versuch); Kürzungen 200 und 60; `due` über Stufen, Ersetzen und Ende, Datumsrechnung über Monats- und Jahresgrenze, 40 als Obergrenze; `total` und Maximum; Abzeichen und `tried`; Titel; `treeStage` an allen Schwellen (0 bis 40 Tage); Blätter mit Ergebnis, Hilfe, „noch nicht“, Korrektur (zweimal), Verwerfen, Obergrenze 8, `sheetNo`; „Letzte gilt“ mit Gleichstand; böse Namen. Außerdem:
  - **Reihenfolge und Wiederholung:** eine Geschichte mit 260 zufälligen, aber gültigen Ereignissen aller Arten; 100 Läufe gemischt, in Teilen und doppelt geliefert ergeben immer denselben Stand.
  - **Basisstand:** 60 zufällige Schnitte (auch genau auf einem Ereignis, am Anfang, am Ende): Stand der frühen Ereignisse plus späte Ereignisse = alle zusammen; auch „alle Ereignisse plus Basis“ zählt die frühen nur einmal; die Basis wird nicht verändert; ein Basisstand aus dem älteren Speicherformat.
- **`tests/ableitung-vergleich.test.mjs`** (Browser, ca. 2,5 s): echte Klicks wie ein Kind und die Eltern – Quest „round“ (richtig, falsch, Tipp, Beispiel falls vorhanden, Lösung vor dem Versuch, zweiter Versuch), „numbers“ abgebrochen, zwei Übungsblätter (alle Ergebnisse, zwei Korrekturen, dasselbe nochmal, ein Blatt verworfen), dann „Practise Today“ an vier weiteren Tagen (Uhr per `page.clock`): Wiederholungen werden fällig, richtig (weiter), falsch (neu), erledigt. Der Mitschreiber (Haken im Testbau, `store.set` abgefangen) macht daraus 100 bis 120 Ereignisse. Ergebnis: `derive` liefert in Node **und** in Chromium dasselbe, und das ist **gleich** dem, was die App gespeichert hat: `attempts` (73 Zeilen), `ev`, `due`, `total`, alle `best_*`, `badges`, `tried`, `treeStage`, `rankSeen`, `sheets` (mit `rec` und `principled`), `sheetNo`. Dazu: alle Ereignisse sind gültig; die Grenzen und Tabellen des Moduls (60, 40, 1/3/7, Baumstufen, Titel) sind die der App. Der Verlauf ist zufällig gemischt (Fragen); bei 16 Läufen hintereinander grün (vorher mit nur einem möglichen zweiten Versuch 3 von 12 rot, darum jetzt mehrere).
- Live-Bau ist byte-gleich zu `main` (siehe Zeiten); `rahmen` bleibt grün.

## Gegenproben
Je ein absichtlicher Fehler im Modul; die Modultests müssen rot werden. Die sieben aus der Aufgabe und 42 weitere – **alle 49 rot**, jeweils an der passenden Stelle (kein Syntaxfehler im Fehlerfall):

| Gruppe | Fehler (alle rot) |
|---|---|
| aus der Aufgabe | `best_` als Summe statt Maximum · Hilfe = Erfolg auf der Aufgabenstufe (ev) · `ev` ohne Kürzung · nicht sortieren · doppelte Ereignisse doppelt zählen · `attempts` ungekürzt · „Letzte gilt“ nimmt den ältesten (im Modul `ereignisse`) |
| ev | Tipp-/Beispiel-/Lösungszeilen zählen als Antwort · zweiter Versuch zählt · Lösung vor dem Versuch zählt nicht / als Stufe 2 |
| due | Weiterschieben ändert die Fälligkeit nicht · erneut falsch ersetzt nicht · ungekürzt · erledigt bleibt stehen · Fälligkeit immer nach 1 Tag · Stufe 0 ohne Frage legt Eintrag an · Weiterschieben eines unbekannten legt an |
| total, best, Abzeichen, Titel | `total` zählt Runden · `best_` auch bei 0 Sternen · `tried` aus jedem Abzeichen mit Quest · `tried` mit Doppelten · Titel: der jüngste statt höchste / der niedrigste |
| Baum | Blatt-Tag zählt nicht · Tipp-Zeile zählt als Übungstag · Stufe sinkt · Schwellen verschoben |
| Blätter | ungekürzt · `sheetNo` zählt statt Maximum · Korrektur nimmt `ev`-Zeile / `attempts`-Zeile nicht zurück · `principled` nie / zu früh · gleiches Ergebnis wird neu eingetragen · verworfenes Blatt bleibt · zweites Blatt mit gleicher Kennung ersetzt · Hilfe auf Aufgabenstufe · Aufgabe ohne Stufe zählt als 1 |
| „Letzte gilt“ | Profilfeld leeren löscht nicht · Haken-Liste ohne Auffüllen · Tageshinweis falscher Wert |
| Basisstand | Übungstage vergessen · Schnitt zählt doppelt (`>=`) · frühe Ereignisse nochmal gezählt · Basis wird verändert |
| böse Namen | `__proto__` als Quest erlaubt · Quest/Abzeichen `constructor` ohne Eigenschafts-Prüfung |

Beim Bau der Gegenproben wurden vier Überlebende gefunden: zwei **Lücken im Test** (Abzeichen mit Quest auf einem Namen, der später ohnehin kam; zweites Blatt mit gleicher Kennung ohne Zählprobe) – Tests ergänzt, nicht die Gegenprobe gestrichen; zwei **überflüssige Zeilen im Modul** (Prüfung auf unbekannte Titel, Rücksetzen von `rec`/`res` vor dem Neusetzen) – Code gekürzt.

Gegenprobe im **Browser-Vergleich** (sechs Stichproben): „Hilfe = Aufgabenstufe“, „Lösung vor dem Versuch als Stufe 2“ und „Korrektur ohne `ev`-Rückgabe“ werden auch dort rot. Nicht dort, nur in den Modultests erkannt: „Fälligkeit immer nach 1 Tag“ (der Mitschreiber schreibt `dueAt` immer mit), „`tried` ohne Quest-Prüfung“ (der Mitschreiber schreibt `skill` nur bei „inquirer“) und „`principled` zu früh“ (am Ende des Verlaufs ist das Blatt ohnehin fertig).

## Zeiten
| Prüfung | Dauer |
|---|---|
| `tests/module/ableitung.test.mjs` (18 Tests) | 0,6 s |
| Bereich `ableitung` (Module + Browser-Vergleich, mit Start) | 6,6 s |
| volle Reihe (308 Tests, alle grün, auf dem Stand mit Elternbereich B1–B3) | 205 s |

Live-Bau: SHA-256 der Live-App von `main` (nach #64) und von diesem Zweig sind identisch (`babfdac1…c5e1`).
