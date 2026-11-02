# Elternbereich E2a: „So helfen Sie“ Mathe (02.11.2026)

Paket E2a aus `docs/konzept/elternbereich-auftraege.md` (Konzept 5.11, 7.0). Vorher/Nachher-Tabelle Peter am 02.11. vorgelegt, **freigegeben** („frei“). Die Doppelung bei Word Problems wird **gestrichen** (Peter: „2“).

## Umgesetzt (DE und EN)
- Fünf Mathe-Quests mit „So helfen Sie“: Time & Numbers, Rounding Road, Number Combinations, Word Problems, Data Detective. Die fünf Ausblick-Themen haben keinen solchen Text.
- Je Quest: **Ziel** ein kurzer Satz · **Stolperstein** 1–2 Stichpunkte + „Besser nicht“ · **Ideen** höchstens 2. Bei Rounding Road und Number Combinations/Word Problems ist „So zeigt es die Schule“ auf einen Satz gekürzt. Die Fragen und alle Quellen sind unverändert.
- **Word Problems:** nur noch eine Idee (eigene Zwei-Schritt-Geschichte); das Sprung-Beispiel steht nur noch unter „So zeigt es die Schule“.
- **Stolperstein** darf jetzt mehrere Stichpunkte haben (Liste in `HELP_Q`, für alte Einträge weiterhin ein Text).
- Time & Numbers und Data Detective haben keinen Teil „So zeigt es die Schule“ und „Fragen statt erklären“, weil es dafür keine Unterrichtsaufgabe gibt. Es wurde nichts erfunden.

## Weggefallen
- „Erst mit Begründung erfüllt eine Lösung die Erwartung“: steckt im Ziel („und erklären, woher man es weiß“).
- „eine Regel wird aufgesagt, ohne den Abstand zu erklären“: abgedeckt durch „Besser nicht: nur ‚ab 5 wird aufgerundet‘“.
- „Zahlen im Text ungenau gelesen“, „ein unpassendes Ergebnis fällt nicht auf“: Letzteres steckt im Überschlag des Ziels.
- Rechenbeispiele in Klammern: 900 = 300 + 250 + 350; 400 + 90 + 13; „A hat 278, das sind 96 mehr als B“; +22 → 300 …; „auf einem gezeichneten Strich zeigen lassen“; „beim Einkaufen“.
- Word Problems: die Idee „278 + ? = 503 mit Sprüngen …“ (Doppelung).

## Prüfung
- Neu: `tests/elternbereich-e2.test.mjs` (E2a):
  - Ziel ≤ 20 Wörter, Stolperstein 1–2 Stichpunkte + genau ein „Besser nicht“, höchstens 2 Ideen, jeder Stichpunkt ≤ 24 Wörter.
  - Word Problems mit einer Idee ohne 278; die alten Sätze fehlen.
  - Englisch ohne deutsche Reste, amerikanische Schreibweise.
- Gegenprobe: der Test mit der App von `main` ist rot.
- `npm test`: 361 bestanden.
