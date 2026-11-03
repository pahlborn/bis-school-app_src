# 2026-11-03 – Stufe 2, 3b-1b-2: Listen je Eintrag (Freischaltungen, manueller Fokus, Advent)

## Auftrag
Teil 2 von 3b-1b (Aufteilung siehe `2026-11-03-stufe2-3b1b1-schreibhaken-letzte-gilt.md`). Vorgabe Peter (03.11.): Listen **je Eintrag** abgleichen, nicht als ganze Liste; Advent-Türchen nur öffnen. Nur der Testbau schreibt Ereignisse; im Live-Bau tut `eventHook` nichts.

## Format (Modul `ereignisse`, jetzt 27 Typen)
- **neu `list_set`** `{ list: unlocked|focusManual, item, on }` – „Letzte gilt“ je Liste und Eintrag (`fieldKey` = `list_set:<list>:<item>`).
- **neu `advent_open`** `{ year, door }` – ein Türchen wird geöffnet (Protokoll, kein Schließen).
- **`setting_set`** nimmt nur noch `focusMode` und `storyCap`; die Listen `unlocked` und `focusManual` gehen nur noch über `list_set` (eine Sache, ein Weg).

## Rechte (Modul `annahme`)
- `list_set`: nur Eltern (Freischalten und Fokus stellt im Elternbereich nur ein Elternteil; die App sperrt Lehrkräfte dort schon heute).
- `advent_open`: Kind und Eltern (das Türchen öffnet das Kind; bei offenem Erwachsenenbereich schreibt die App als Erwachsener).

## Ableitung (Modul `ableitung`)
- `list_set` wird in „Letzte gilt“-Reihenfolge nachgespielt: an = hinten anfügen (falls noch nicht drin), aus = entfernen – genau wie `index.html` (`concat` / `filter`).
- Fokus: `index.html` hält `focusManual` genau so lange, wie `focusMode` `manual` ist (`setFocusMode` speichert und löscht beide). `derive` macht dasselbe: bei `manual` gibt es die Liste (leer, wenn nichts gewählt), sonst nicht.
- `advent_open`: Schlüssel `advent<Jahr>`, jedes Türchen einmal, in der Reihenfolge des Öffnens.

## `index.html`
- Neue Hilfe `listEvents(list, alt, neu)`: liefert die `list_set`-Einträge, die aus der alten die neue Liste machen – normalerweise nur, was dazukam oder wegfiel; haben sich die Reihenfolge der behaltenen Einträge geändert oder steht ein neuer nicht am Ende: alle alten aus, alle neuen an (so ergibt das Nachspielen immer genau die neue Liste).
- Haken an allen Schreibstellen: Freischalten (`data-punlock`), Fokus je Quest (`toggleFocus`), Fokus automatisch/manuell (`setFocusMode`), Übernahme der alten Fokus-Form (`migrateFocus`), Advent (`openDoor`).
- Der Wächter führt für 3b-1b nur noch `gaps` als offen.

## Tests
- `tests/module/ableitung.test.mjs`: neuer Test (Listen, Fokusregel, Advent je Jahr); der Zufallsverlauf für Reihenfolge/Wiederholung/Basisstand enthält jetzt auch `list_set` und `advent_open`; „Letzte gilt“-Test nutzt `list_set`.
- `tests/module/ereignisse.test.mjs`, `annahme.test.mjs`: 27 Typen, Rechtetabelle, Feldschlüssel, `setting_set` lehnt Listen ab.
- `tests/schreibhaken-1b.test.mjs`: zwei neue Browser-Tests – (1) mit echten Klicks am 5. Dezember: zwei Türchen (eines zweimal geklickt), Eltern schalten zwei Quests frei, Fokus an/aus, automatisch, manuell, wieder sperren; nach jedem Schritt `derive` = gespeicherter Stand, Autoren richtig, nichts abgelehnt; (2) `listEvents` mit 500 Zufallsfällen (auch umsortiert) und den Normalfällen „nur das Neue“, „nur das Entfernte“, „nichts“.

## Gegenproben (alle 15 rot)
Freischalten / Advent / Fokus umschalten / manuell / automatisch ohne Haken, automatisch ohne Leeren der Liste, `listEvents` ohne Reihenfolgeprüfung und „immer alles“, Fokusregel fehlt, Listen nicht nachgespielt, Türchen doppelt, Rechte (Eltern ohne `list_set`, Kind ohne `advent_open`), `setting_set` nimmt wieder Listen, `list_set` nicht „Letzte gilt“.

## Entscheidungen (Peter kann widersprechen)
1. **Zwei neue Typen** statt einer Erweiterung von `setting_set`/`day_flag` – klarer und je Eintrag eindeutig.
2. **Fokusregel in `derive`** statt eigener Lösch-Ereignisse: die Liste folgt `focusMode`, wie in der App.
3. **Übernahme der alten Fokus-Form schreibt Ereignisse**, unter dem, der gerade handelt. Tut das ein Kindergerät, werden sie abgelehnt und gemeldet (das Kind darf den Fokus nicht setzen). Alte Daten wandelt ohnehin Aufgabe 3c um.

## Volle Reihe
Siehe PR.
