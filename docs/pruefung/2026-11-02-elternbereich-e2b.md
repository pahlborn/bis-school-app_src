# Elternbereich E2b: „So helfen Sie“ English (02.11.2026)

Paket E2b aus `docs/konzept/elternbereich-auftraege.md` (Konzept 5.11, 7.0). Vorher/Nachher-Tabelle Peter am 02.11. vorgelegt, **freigegeben** („ja“), einschließlich des Streichens der doppelten Idee bei Opinion Writing.

## Umgesetzt (DE und EN)
- Vier English-Quests: Opinion Writing, Capital Letters & Full Stops, Specific Examples, Word Building.
- Die Texte waren schon kurz. Geändert:
  - **Opinion Writing:** Ziel gekürzt; Stolperstein in 2 Punkte; die zweite Idee („Fragen statt vorformulieren: Warum? Hast du ein Beispiel?“) gestrichen, weil sie „Fragen statt erklären“ wiederholt.
  - **Capital Letters & Full Stops:** Stolperstein in 2 Punkte, Ideen gekürzt.
  - **Specific Examples:** Stolperstein zusammengefasst.
  - **Word Building:** Ziel und Stolperstein gekürzt.
- „So zeigt es die Schule“, die Fragen (nur Opinion Writing) und alle Quellen sind unverändert. Für die anderen drei Quests gibt es keine Unterrichtsaufgabe, es wurde nichts erfunden.

## Weggefallen
- „in logischer Reihenfolge“ (Opinion Writing, Ziel).
- „am Satzende“, „mit dem Finger“, „auf die Pausen achten“ (Capital Letters, gekürzt).
- „Vorsilbe benannt, aber nicht gesagt, was sie bewirkt“ → „… aber nicht ihre Bedeutung“.
- Opinion Writing, zweite Idee (Doppelung mit den Fragen).

## Prüfung
- `tests/elternbereich-e2.test.mjs` um E2b erweitert: dieselben Regeln wie E2a (Ziel ≤ 20 Wörter, Stolperstein 1–2 Punkte + ein „Besser nicht“, höchstens 2 Ideen); Opinion Writing mit einer Idee; alte Sätze fehlen; Englisch sauber und amerikanisch.
- Gegenprobe: E2b-Test mit der App von `main` rot.
- `npm test`: 362 bestanden.
