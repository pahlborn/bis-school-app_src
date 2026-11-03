# Prüfbericht Auftrag 1 – Grundlage-Aufgaben für Quests mit Hauptstandard (03.11.2026)

Auftrag: `docs/konzept/dev-auftraege-2026-11-03.md`, Auftrag 1.

## Was geändert ist
- **10 Quests haben jetzt Grundlage-Aufgaben (Stufe 1):** numbers, combos, wordprob, forces, units, graphs, sentences, words, anleitung, library.
  - Jede Runde enthält genau **eine** Grundlage-Aufgabe und bleibt bei 8 Aufgaben. Dafür fällt je Quest eine Aufgabe weg:
    - numbers: 7 statt 8 aus der bisherigen Auswahl
    - combos: ein „reasonable?“ (Stufe 3)
    - wordprob: eine Sticker-Aufgabe
    - forces: eine Forces-Aufgabe
    - units: ein „Which unit?“
    - graphs: ein Balken-Ablesen
    - sentences: ein „written correctly?“
    - words: ein Prefix
    - anleitung: eine Bank-Frage
    - library: eine Bank-Frage
  - Bei „braucht Unterstützung“ tauscht `adaptRound` weitere Aufgaben gegen Grundlage-Aufgaben. Das Ergebnis sind mindestens 2 je Runde (`WANT.RS.l1`).
- **Mathe** (in `index.html`): `numbersBaseQ`, `combosBaseQ`, `wordprobBaseQ`, `unitsBaseQ`, `graphsBaseQ`. Jeweils ein Schritt, kleine oder runde Zahlen, wechselnde Zahlen. Bild oder Modell wie in der Klasse:
  - Stellenwerttafel (Hundreds/Tens/Ones)
  - Uhr (volle und halbe Stunde)
  - Zahlenstrahl mit einem Sprung
  - Punkte in Paaren (gerade/ungerade)
  - **Ganzes-und-Teile-Modell** (`partWholeSVG`, „Erst Ganzes und Teil klären“ aus `SCHOOL_WAY.combos`/`wordprob`) für combos und wordprob
  - Maßband an einer großen Zahl und zwei Längenstreifen im Maßstab (`lengthBarsSVG`) für units
  - Balkendiagramm mit Balken genau auf beschrifteten Linien und Strichliste (`tallySVG`) für graphs

  Es gibt keine neuen Rechenwege.
- **Text-Quests:** neues Modul `src/module/grundlage.mjs` (`GRUNDLAGE`, Bauart live) mit je 8 Aufgaben für forces, sentences, words, anleitung (Deutsch) und library. Die App macht daraus mit `baseQ` Fragen.
  - Die falschen Antworten sind klar falsch (wie Stufe 1 in `textfragen`).
  - Die richtige Antwort ist nicht an der Länge erkennbar.
  - Es kommen keine Schul-, Klassen-, Lehrer- oder Ortsnamen vor.
- **Tipp („Show me how“):** Jede neue Aufgabe hat einen eigenen Tipp (`q.tip`). Brücken (`bridgeFor`) sind unverändert. Die neuen Aufgaben haben kein `coach` und lösen deshalb keine Brücke aus.

## Tests
- Neu `tests/module/grundlage.test.mjs` (6 Tests, ohne Browser):
  - je Quest mindestens 6 Aufgaben
  - Stufe 1 und eigener Tipp, der die Antwort nicht verrät
  - keine doppelte Frage, auch nicht gleich einer bestehenden
  - Längenprüfung wie in `textfragen` (die längste bzw. kürzeste Antwort ist höchstens in 40 % der Fragen die richtige)
  - keine verbotenen Wörter
  - Deutsch nur in der Anleitung
- Neu `tests/auftrag1-grundlage.test.mjs` (5 Tests, in `npm test`):
  1. Alle 14 Quests mit Hauptstandard haben in 25 Runden mindestens eine Aufgabe auf Stufe 1, die 10 neuen in **jeder** Runde. Die Runden bleiben bei 8 Aufgaben.
  2. Je Quest 80 Runden. Jede Grundlage-Aufgabe:
     - Stufe 1, gehört zur Quest; Text-Aufgaben stammen aus der Bank der eigenen Quest
     - eigener Tipp, kein leichteres Beispiel
     - Antwort wählbar, Erklärung vorhanden
     - mindestens 6 Varianten
     - Mathe: in mindestens 60 % mit Bild oder Modell (units mindestens 40 %, weil „cm oder m?“ nur einen Tipp hat)
  3. „Braucht Unterstützung“ (RS) bei allen 10 Quests: in 20 Runden je mindestens 2 Grundlage-Aufgaben, keine Herausforderung, keine Grundlage-Aufgabe doppelt.
  4. und 5. Echte Klicks (combos, anleitung): „Show me how“ / „Zeig mir, wie“ zeigt den eigenen Tipp, danach gibt es keinen Knopf „Show me an example“ / „Zeig mir ein Beispiel“.
- Geändert: `tests/elternbereich-d2.test.mjs`. Der Fall M-N4 (combos + wordprob) läuft jetzt mit `mitGrundlage = true`: Die erste Lücken-Aufgabe ist Stufe 1. Grün.
- Betroffene Tests grün (264/264): `module/*`, `fragen`, `lernlogik`, `neutral`, `beispiele`, `showme`, `ausblick`, `themen`, `kern`, `app`, `blaetter`, `elternbereich-d1`, `-d3`, `ableitung-vergleich`, `testbau`, `sohelfen`, `schule`.

## Gegenproben (alle rot)
| | Änderung | rot |
|---|---|---|
| G1 | Combos ohne Grundlage (wie `main`) | neuer Test |
| G2 | Combos und Word Problems ohne Grundlage | D2 (`mitGrundlage`) |
| G3 | numbers-Grundlage auf Stufe 2 | neuer Test |
| G4 | units-Grundlage ohne eigenen Tipp | neuer Test |
| G5 | Grundlage bekommt ein „leichteres Beispiel“ | neuer Test |
| G6 | `WANT.RS` ohne `l1: 2` | neuer Test |
| G7 | Anleitung ohne Grundlage | neuer Test |
| G8 | Bank-Eintrag auf Stufe 2 | Modultest |
| G9 | Library-Bank nur 5 Aufgaben | Modultest |
| G10 | richtige Antwort immer die längste (Words) | Modultest |
| G11 | verbotenes Wort in der Bank | Modultest |
| G12 | Words zieht Aufgaben aus der Sentences-Bank | neuer Test |

## Abweichungen / Entscheidungen (Peter kann widersprechen)
- **Kein „leichteres Beispiel“ bei Grundlage-Aufgaben.** Der Auftrag sagt: „wo die Quest Beispiele hat, auch mit Beispiel“. Die App hat aber die geprüfte Regel „nichts ist leichter als Grundlage“ (`exampleFor`, Tests `beispiele`/`showme`), und der Knopf heißt „An easier example“. Die neuen Aufgaben bekommen deshalb Tipp und Bild, aber kein Beispiel. Wenn Peter auch hier ein durchgerechnetes Beispiel will, wäre das eine eigene kleine Aufgabe: Knopftext „Show me an example“ ohne „easier“ und je Aufgabenart ein Beispiel auf gleicher Stufe.
- **Eine Grundlage-Aufgabe je Runde** für alle Kinder, also auch bei „Sicher“. So kommt sie in 25 Runden sicher vor, und die Lücken-Spur findet immer eine. Bei „Sicher“ und „Darüber hinaus“ steuert `adaptRound` weiter nur die Herausforderungen.
- **Zählung:** Es gibt 14 Quests mit Hauptstandard (19 sichtbare Quests, davon 5 ohne). Der Auftrag nennt „10 von 19 Quests mit Hauptstandard“. Gemeint sind 10 von 14.

## Befund (nicht Teil des Auftrags)
- **Number Combinations zeigt oft eine Aufgabe doppelt in derselben Runde:** 946 von 2 000 Runden auf `main`, 904 von 2 000 mit diesem PR. Ursache: Je Runde kommen zwei Aufgaben aus kleinen Vorlagen-Sätzen, z. B. `anotherWayQ` mit nur 3 Vorlagen und `combosQ` mit 6. Die Grundlage-Aufgaben sind nicht betroffen. Vorschlag: eine eigene kleine Aufgabe „keine Aufgabe doppelt in einer Runde“ für alle Quests.
