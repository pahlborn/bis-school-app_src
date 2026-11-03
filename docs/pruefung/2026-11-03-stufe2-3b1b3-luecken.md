# 2026-11-03 – Stufe 2, 3b-1b-3: Schreibhaken für Lücken (gaps)

## Auftrag
Teil 3 von 3b-1b. Format, Rechte und `derive` für Lücken gibt es seit 3b-0 (`gap_state`, `gap_active`); hier schreibt der Testbau die Ereignisse an den Stellen in `index.html` – nach der Tabelle „Was 3b-1 schreiben muss“ im Prüfbericht 3b-0. Peter (03.11.): Haken für die Eltern-Aktionen **und** für das automatische Schließen auf dem Kindergerät. Im Live-Bau tut `eventHook` nichts.

## Änderungen
- `index.html`
  - `gapSave(d, evs)`: die einzige Speicherstelle der Lücken schreibt die mitgegebenen Ereignisse **nur, wenn wirklich gespeichert wird**. Eine Lehrkraft, die über eine Freigabe nur liest, speichert nichts und schreibt damit auch keine Ereignisse.
  - `openGaps`: je automatisch geschlossener Lücke `gap_state {closed, by:'app', schoolDay, quest, day}`.
  - `gapAct`: „Jetzt angehen“ → `gap_active`; „Als geschlossen markieren“ → `gap_state {closed, by:'parents'}`; „Weiter üben“ → `gap_state {hold, by:'parents'}` – ohne zusätzliches `gap_active` (wie in 3b-0 festgelegt).
  - `eventHook`: mit Konten, aber ohne Kind-Bereich wird kein Ereignis geschrieben, sondern in `eventNoChild` vermerkt (siehe Befund).
- `tests/module/ableitung.test.mjs`, 3b-0 Test 5 (echter Lücken-Code in der Sandbox, 300 Zufallsabläufe): die Sandbox fängt jetzt die **echten** Haken der App auf. Geprüft wird zusätzlich: die Haken schreiben genau die Ereignisse der Tabelle, und `derive` dieser Ereignisse ergibt die gespeicherten `gaps`.
- `tests/schreibhaken-1b.test.mjs`: neuer Browser-Test mit Konten und erfundenen Schuldaten (wie D4): Elternteil wählt, schließt, die App schließt (Eltern-Gerät), „Weiter üben“ (die App schließt danach nicht wieder), Elternteil schließt; danach ein Kindergerät, das selbst schließt (als Kind, angenommen). Nach jedem Schritt `derive` = gespeicherte `gaps`, nichts abgelehnt, Autoren richtig.
- `tests/module/schreiber.test.mjs`: Wächter – für 3b-1b ist nichts mehr offen (nur noch 3b-1c: `grants`, `grantlog`, `parentLang`).

## Gegenproben (alle 10 rot)
`gapSave` ohne Ereignisse; automatisches Schließen ohne Ereignis / ohne `quest`; „Jetzt angehen“, „Schließen“, „Weiter üben“ ohne Ereignis; „Schließen“ mit zusätzlichem `gap_active`; „Weiter üben“ mit falscher Schuleinstufung; „Schließen“ als App statt Eltern; Ereignis ohne Kind-Bereich trotzdem schreiben.

## Befund (behoben im Testbau, Live unverändert)
Mit Konten zeigt die App die Startseite schon hinter der Anmeldung. Dabei speichert sie den ersten Titel (`rankSeen`) unter `bq2_rankSeen`, also **ohne Kind-Bereich**. Bisher meldete der Schreiber das als abgelehnt („wer-unbekannt“). Das sind aber keine Daten eines Kindes, und es gibt kein Protokoll, in das das Ereignis gehört.

**Entscheidung (Peter kann widersprechen):** In diesem Fall schreibt `eventHook` nichts und vermerkt es in `eventNoChild`. Der verwaiste Schlüssel `bq2_rankSeen` selbst bleibt, wie er ist (Live-Verhalten unverändert); er wird nicht abgeglichen. Aufräumen wäre eine eigene kleine Aufgabe.

## Hinweise
- Die alte Lücken-Form aus D1 (Quest statt Standard) übersetzt `gapData` beim Lesen und speichert sie beim nächsten Speichern neu. Dafür entsteht kein Ereignis; das gehört zur einmaligen Umwandlung (3c), wie im Prüfbericht 3b-0 beschrieben.
- Schreibt ein Admin bei offenem Erwachsenenbereich (nicht über eine Freigabe), speichert die App die Lücke, das Ereignis würde aber abgelehnt (Admin darf keine Lücken-Ereignisse schreiben). Gleiches Muster wie der Befund `storyCap` aus 3b-1b-1 – gehört zu den Rechten im Elternbereich.

## Volle Reihe
**452/452 grün** (298 s, Stand `main` mit #107); nach dem Einmergen von P3b (#108): **465/465 grün** (317 s); nach Auftrag 2 Lücken-Balken (#109): **468/468 grün** (347 s).
