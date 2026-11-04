# Prüfbericht – Tests schneller: Aufgaben-Durchläufe ohne Browser (04.11.2026)

Auftrag: Aufgabe „Tests schneller – Aufgaben-Durchläufe ohne Browser“ (Peter, 03.11.; Konzept „Module und Tests“, Schritt 3). Weg 1 aus der Aufgabe: Node-Sandbox ohne Umbau der App. `index.html` ist **unverändert**, die App ändert sich nicht (nichts zu veröffentlichen).

## Ergebnis
| | vorher (`main` e385a1d) | nachher (Zweig mit `main` 41f35be) |
|---|---|---|
| Volle Reihe (`voll-testen.ps1`, 7 Dateien gleichzeitig) | **344 s**, 505/505 | **154 s**, 512/512 |
| Rechenzeit aller Tests (Summe) | 1 337 s | 766 s |
| Die sechs langen Tests | 370 s | 79 s (Node) + 8 s (Bedienwege im Browser) |

Die sechs Tests einzeln (Dauer in der vollen Reihe):

| Test | vorher (Browser) | nachher (Node) |
|---|---|---|
| Fragen aller Quests: keine Widersprüche | 129 s | 5 s |
| Practise Today und Fach-Mixe: viele Runden ohne Hänger | 67 s | 10 s |
| Anpassung hält die Vorgaben in jeder Quest ein | 60 s | 45 s |
| Maths: leichteres Beispiel für fast jede Rechenaufgabe | 48 s | 7 s |
| Jede Quest: Runden mit richtigen Antworten ergeben 8 von 8 | 39 s | 10 s |
| English, German, Science, Library: leichteres Beispiel | 26 s | 2 s |

Hinweise zur Messung:
- Die Vorher-Messung lief heute früh allein (nur kurze eigene Probeläufe nebenher). Am 03.11. abends lag die volle Reihe bei 215 s; der Rechner schwankt also deutlich.
- Eine Zwischenfassung (Zeitlimit je Klick statt je Runde) brauchte 207 s; die Endfassung 154 s.
- „Anpassung“ hat schon im Browser direkt gerechnet. Hier spart Node nur den Browser; die Rechnung selbst (14 Quests × 1 050 Runden, z. B. 60 Uhr-Striche je Uhr in „Time Passes“) bleibt. Deshalb liegt sie in einer eigenen Datei und läuft neben den anderen.

## Was neu ist
- **`tests/app-sandbox.mjs`**: lädt das unveränderte App-Skript aus der gebauten App (`appLesen`) in `node:vm`.
  - Ersatzteile: kleines `document` mit Elementen (hidden, Attribute, `dataset`, Klassen, Kinder, Ereignisse, `click()`), ein kleiner HTML-Zerleger für `innerHTML`, `localStorage`, stummer Ton, Zeitgeber laufen nicht, Zufall mit Startwert.
  - Zugriff auf Namen der App über `holen('state')`, `holen('WORLDS')` …; dafür wird nur in der Sandbox am Skriptende eine Zeile eingesetzt.
  - Die Tests klicken Fach, Karte und Antwortknöpfe so an, wie sie die App baut (Ziffernblock, Reihenfolge-Knöpfe, „Take the challenge“, „Show me how“, „Show me an example“).
  - `lauf(fn, ms)`: Zeitlimit. Eine Endlosschleife in der App wird rot statt zum Hänger.
  - Zufall: Jeder Test schreibt `BQ_SEED=…` in die Ausgabe; mit `BQ_SEED` lässt sich ein Rot genau wiederholen.
- **`tests/aufgaben-node.test.mjs`**: Widersprüche, Practise Today und Mixe, 8 von 8, beide Beispiel-Tests – gleiche Rundenzahlen und Schwellen wie bisher. Zusätzlich in jeder Runde (seit #112 und #115):
  - 8 Aufgaben, keine doppelt (Modul `runde`),
  - in den 10 Quests aus Auftrag 1 mindestens eine Grundlage-Aufgabe (Modul `grundlage`),
  - nie ein leichteres Beispiel für eine Grundlage-Aufgabe (bisher nur bei Mathe geprüft, jetzt auch bei den Text-Quests).
- **`tests/aufgaben-anpassung.test.mjs`**: Anpassung, wie bisher; zusätzlich muss jede angepasste Runde 8 Aufgaben haben.
- **Im Browser bleibt je Fach ein kurzer Bedienweg:**
  - `fragen.test.mjs`: je Fach (7) die erste Quest eine Runde mit richtigen Antworten, dazu Practise Today (5 s).
  - `beispiele.test.mjs`: in Mathe, Science, English, Deutsch und Library einmal Tipp → „Show me an example“ bzw. „Zeig mir ein Beispiel“ (3 s).
  - `lernlogik.test.mjs`: Die Anpassung ist entfernt; alle Klick-Tests bleiben.
- `package.json`: beide neuen Dateien vorn in `npm test`, damit sie früh starten. `module.json`: `textfragen`, `grundlage` und `runde` nennen die neuen Dateien für `npm run test:bereich`.

## Gegenproben (alle rot)
Jede Änderung wurde einzeln eingebaut, beide Node-Dateien liefen. Zum Vergleich lief der alte Browser-Test vor dem Entfernen mit derselben Änderung.

| | Änderung | Node (rot in) | alter Browser-Test |
|---|---|---|---|
| G1 | Falsche Lösung im Erzeuger (Großbuchstaben zählen +1) | Widersprüche | rot |
| G2 | Doppelte Antwortmöglichkeit (`mc`) | Widersprüche | rot |
| G3 | Runde mit 7 statt 8 Aufgaben (Number Combinations) | Widersprüche, 8 von 8, Anpassung | rot |
| G4 | „hakt es noch“ bekommt eine Herausforderung | Anpassung | rot |
| G5 | Leichteres Beispiel zeigt die eigene Lösung | beide Beispiel-Tests | rot |
| G6 | Endlosschleife in Practise Today (etwa jede 10. Runde) | Practise Today (das Zeitlimit je Runde greift) | hängt; rot erst nach dem künstlichen Testlimit von 240 s |
| G7 | Modul `runde` wirkungslos | Widersprüche, Practise Today, 8 von 8 | – (prüften die sechs nicht) |
| G8 | Library ohne Grundlage-Aufgabe | Widersprüche, 8 von 8 | – (prüften die sechs nicht) |
| G9 | Leichteres Beispiel auch für Grundlage-Aufgaben | Beispiel-Tests (Text-Quests immer, Mathe meist) | rot |
| G10 | Ziffernblock nimmt nur 3 Ziffern | Practise Today, 8 von 8 | rot |

G9 wurde dreimal wiederholt, G6 viermal; jedes Mal rot.

## Abweichungen und Grenzen
- Die Sandbox stellt nichts dar: kein CSS, keine Größen, kein Scrollen. Was nur im echten Browser zu sehen ist (Layout, iPhone-Tests, echte Klicks), bleibt in den Browser-Tests. Fehler in Zeitgebern (z. B. Konfetti nach 300 ms) fängt die Sandbox nicht, weil Zeitgeber dort nicht laufen.
- Fehler der App beim Klicken kommen in der Sandbox sofort mit Stelle im Test an. Der Browser-Test hat sie gesammelt (`pageerror`) und am Ende geprüft.
- Die volle Reihe liegt mit 154 s unter 3 Minuten. Wie stark sie schwankt, zeigt die Vorher-Messung (344 s heute, 215 s am 03.11.).
