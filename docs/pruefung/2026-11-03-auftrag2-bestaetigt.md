# Prüfbericht Auftrag 2 – „bestätigt“ ohne 14 Kalendertage, Lücken-Balken ehrlich (03.11.2026)

Auftrag: `docs/konzept/dev-auftraege-2026-11-03.md`, Auftrag 2 (Entscheidung Peter, 03.11.).

## Was geändert ist
- **Regel (`assessQuest`):** „bestätigt“ = mindestens 20 erste Versuche an mindestens 5 Übungstagen. Die Bedingung „über mindestens 14 Kalendertage“ (`span >= 14`) ist weg, die Variable `span` auch. Die Schwellen stehen jetzt als `CONF = {n:20, days:5}` neben `KEY`.
- **Gemeinsame Prüfung „Sicher“:** `meetsOf(l2)` und `yearLevelEv(k)` (letzte 20 Antworten auf Klassenniveau). `standOf` nutzt `meetsOf` selbst. Damit können der Balken und die Regel nicht auseinanderlaufen.
- **Balken (`questProgress`, `gapProgress`, `gapProgressHTML`):** Der Balken zeigt den kleinsten Anteil der drei Bedingungen:
  - (1) erste Versuche / 20
  - (2) Übungstage / 5
  - (4) „Sicher“ auf Klassenniveau: 1, wenn erfüllt; sonst das Kleinere aus „1 − noch nötige richtige Antworten / 20“ und „Tage mit richtigen Antworten / 3“

  Voll ist der Balken nur, wenn alle drei Bedingungen erfüllt sind. Als „weiteste Quest“ einer Lücke gilt die mit dem größten Anteil (bei Gleichstand: mehr Versuche).
- **Text** – nennt, was als Nächstes fehlt, in dieser Reihenfolge (DE / EN):
  1. „noch etwa 8 Aufgaben“ / „about 8 more tasks“
  2. „noch 2 Aufgaben auf Klassenniveau richtig“ / „2 more grade-level tasks right“ (Anzahl wird mit dem gleitenden Fenster der letzten 20 Antworten gerechnet)
  3. „noch an 2 Übungstagen“ / „on 2 more practice days“
  4. „noch an einem weiteren Übungstag richtig“ / „right on one more practice day“
  5. Alles erfüllt (nur möglich, wenn Eltern die Lücke mit „Weiter üben“ offen halten): „bestätigt sicher“ / „confirmed secure“.

  Der alte Text „noch nicht ganz sicher – weiter üben“ fällt weg. Keine Zeitwörter.
- **Beide Stellen:** „Auf einen Blick“ (E3) und die Fachansicht nutzen weiterhin dieselbe Funktion.
- **Texte (DE/EN):**
  - `PT.when`
  - ⓘ `overview`
  - „So funktioniert Big Quest“: Kurzfassung und „Genaue Schwellen“

  „über zwei Wochen“ bzw. „über mindestens 14 Tage“ entfällt, jetzt heißt es „an 5 Übungstagen“. Die Rückschau „in den letzten 14 Tagen“ (`sumIntro`) bleibt.
- **Konzept** `docs/konzept/elternbereich.md`:
  - 6.3 neue Schwelle, mit Vermerk der Entscheidung
  - 6.6 beschreibt, was der Balken zeigt

## Tests
- Neu `tests/auftrag2-bestaetigt.test.mjs` (in `npm test`). Drei Tests, echte Klicks, erfundene Daten.
  1. Je ein Fall, in dem nur eine Bedingung fehlt: nur 1, nur 2, nur 4 (zu wenig richtig), nur 4 (richtig erst an 2 Tagen). Jeweils geprüft:
     - Balken unter 100 %, genaue Breite (60/60/90/66 %)
     - passender Text auf DE und EN
     - keine Zeitwörter
     - Lücke weiter offen
     - in „Auf einen Blick“ derselbe Text und Balken
  2. 20 Aufgaben an 5 Übungstagen **innerhalb von 6 Kalendertagen**, 80 % auf Klassenniveau, richtig an 5 Tagen. Ergebnis:
     - „bestätigt“, Stand „Sicher“
     - „Lücke geschlossen ✓ … laut den Antworten in der App“
     - nach „Weiter üben“: voller Balken mit „bestätigt sicher“ / „confirmed secure“
  3. Keine alten Schwellentexte mehr, neue Texte DE/EN vorhanden, Rückschau „in den letzten 14 Tagen“ bleibt.
- Betroffene bestehende Tests unverändert grün (73/73): `elternbereich-d1`, `-d2`, `-d4`, `-e1`, `-e3`, `-f3`, `-f6`, `eltern`, `elternansicht`, `about`, `info`, `lernlogik`, `module/ableitung` (Lücken-Sandbox). Angepasst werden musste keiner. Die bestehenden „vorläufig“-Fälle haben weniger als 20 Versuche oder weniger als 5 Tage, die „bestätigt“-Fälle liegen ohnehin über 14 Tage.

## Gegenproben (alle rot)
| | Änderung | neuer Test |
|---|---|---|
| G1 | `span >= 14` wieder in `assessQuest` | rot |
| G2 | Balken nur aus ersten Versuchen (alt) | rot |
| G3 | Bedingung 4 fehlt im Balken | rot |
| G4 | Bedingung 2 fehlt im Balken | rot |
| G5 | Text „auf Klassenniveau richtig“ fehlt | rot |
| G6 | Text „an weiteren Übungstagen richtig“ fehlt | rot |
| G7 | alter Endtext „noch nicht ganz sicher – weiter üben“ | rot |
| G8 | DE-Text „über zwei Wochen“ zurück | rot |
| G9 | EN-Text „over at least 14 days“ zurück | rot |
| G10 | Rückschau „in den letzten 14 Tagen“ entfernt | rot |
| G11 | Balken ohne Text | rot |

## Abweichungen / Entscheidungen (Peter kann widersprechen)
- **Reihenfolge der Texte:** Aufgaben → Klassenniveau richtig → Übungstage → richtig an weiteren Übungstagen. Das ist die Reihenfolge der Beispiele im Auftrag.
- **„Weiteste Quest“** einer Lücke heißt jetzt: größter Balken-Anteil, nicht mehr die meisten Versuche. Sonst könnte eine Quest mit vielen, aber falschen Antworten die knapp fertige verdecken.
- **Endtext „bestätigt sicher“:** Nur sichtbar, wenn Eltern eine von der App geschlossene Lücke offen halten. Vorher stand dort „noch nicht ganz sicher – weiter üben“, das wäre jetzt falsch.
