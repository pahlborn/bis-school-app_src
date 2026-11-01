# „Show me how“ bleibt, „Show me the answer“ kommt dazu (01.11.2026)

Peter (01.11.): „Jetzt fehlt Show me how … das sollte nicht weg.“ In v37 hat sich der Knopf nach dem Tipp in „Show me the answer“ verwandelt. Peters Vorgabe: „Erst Show me how. Wenn das nicht klappt: Show me the answer.“

## Umgesetzt

- Zu Beginn jeder Aufgabe ist nur **„Show me how“** zu sehen (Deutsch-Quest: „Zeig mir, wie“).
- Ist der Tipp gezeigt – über den Knopf oder von selbst nach einem ersten Fehler –, erscheint **daneben „Show me the answer“** („Zeig mir die Lösung“). „Show me how“ bleibt sichtbar; erneutes Antippen zeigt den Tipp noch einmal.
- „Show me the answer“ zeigt die Lösung einmal mit kurzer Erklärung. Die Aufgabe gilt als nicht geschafft (Stützstufe) und kommt wieder; eine Brücke folgt. Nach der Antwort verschwinden beide Knöpfe, „Next“ erscheint.
- Bei der Challenge-Auswahl sind beide Knöpfe ausgeblendet.

## Prüfung

- `tests/showme.test.mjs`:
  - zu Beginn nur „Show me how“;
  - nach dem Tipp beide Knöpfe;
  - nach einem ersten Fehler beide Knöpfe;
  - Deutsch-Quest mit deutschen Beschriftungen.
- Angepasst: `hilfe`, `lernlogik`, `spass` (Lösung über den eigenen Knopf).
- Gegenproben (alle rot):
  - Lösung von Anfang an angeboten;
  - „Show me how“ verschwindet nach dem Tipp;
  - nach dem Tipp keine Lösung möglich.
- `npm test`: 185 bestanden.
