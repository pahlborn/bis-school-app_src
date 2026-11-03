# Prüfbericht – keine Aufgabe doppelt in einer Runde (03.11.2026)

Anlass: Befund aus Auftrag 1. Auftrag Peter, 03.11. („go“ auf den Vorschlag, das als eigene kleine Aufgabe zu beheben).

## Befund vorher (`main`)
Gemessen wurden je 2 000 Runden. Diese Anteile der Runden enthielten eine Aufgabe doppelt:

| Quest | Anteil |
|---|---|
| Specific Examples | 56 % |
| Number Combinations | 45 % |
| Anleitung | 26 % |
| Library | 18 % |
| Capital Letters | 16 % |
| Units | 9 % |
| Rounding Road | 0,3 % |
| Practise Today (300 Runden) | 6 % |

Ursache: Mehrere Aufgaben einer Runde stammen aus kleinen Vorlagen-Sätzen. Beispiele:
- `specificExampleQ` viermal je Runde aus 9 Vorlagen
- `anotherWayQ` zweimal aus 3 Vorlagen
- zusammengesetzte Wörter zweimal aus 8 Vorlagen

## Was geändert ist
- **Neues Modul `src/module/runde.mjs`** (Bauart live): `ohneDoppelte(runde, nachschub, {id, level, keep, tries})`.
  - Doppelte Aufgaben werden ersetzt, und zwar an derselben Stelle und durch eine Aufgabe **derselben Stufe**. So bleibt die Schwierigkeit der Runde gleich.
  - Eine Runde wird nie kürzer. Gibt es keinen Ersatz, bleibt die Aufgabe stehen.
  - Das Modul ist rein: kein eigener Zufall, kein Speicher.
- **Quests und Mixe:** Jede Quest und jeder Mix holt Ersatz aus einer neuen Runde derselben Quest. Die Regel wird nach dem Anlegen der Mixe in `WORLDS` eingehängt und gilt damit überall dort, wo `WORLDS[k].build()` aufgerufen wird: Quest, Practise Today, Übungsblatt, Lücken-Spur.
- **Practise Today:** Die ganze Runde wird geprüft. Aufwärmen, Wiederholung, Lücken-Aufgabe und Herausforderung bleiben stehen. Ersetzt wird eine doppelte Themen-Aufgabe, und zwar durch eine Aufgabe aus den aktuellen Themen.

## Tests
- Neu `tests/module/runde.test.mjs` (7 Tests, ohne Browser):
  - ohne Doppelte unverändert
  - Ersatz an derselben Stelle und auf derselben Stufe
  - dreifache Aufgabe
  - markierte Aufgabe bleibt
  - ohne Ersatz gleich lang und höchstens `tries` Nachschub
  - Ersatz nie schon in der Runde
  - kein Zufall im Modul
- Neu `tests/runde-ohne-doppelte.test.mjs` (4 Tests, in `npm test`):
  - Alle 19 sichtbaren Quests und alle Mixe: je 500 Runden ohne Doppelte, immer 8 Aufgaben.
  - Die Stufen bleiben, z. B. Number Combinations genau 1 / 4 / 3 je Runde.
  - Practise Today: 300 Runden ohne Doppelte.
  - Echte Klicks: Specific Examples zehnmal geöffnet, keine Runde mit Doppelten.
- Betroffene Tests grün (276/276): Module, `fragen`, `lernlogik`, `neutral`, `beispiele`, `showme`, `app`, `blaetter`, `startseite`, D2, D3, `auftrag1-grundlage`, `ableitung-vergleich`, `schreibhaken-1b`, `testbau`, `ausblick`, `themen`.

## Gegenproben (alle rot)
| | Änderung | rot |
|---|---|---|
| G1 | Quests ohne Regel (wie `main`) | Browser-Test |
| G2 | Practise Today ohne Regel | Browser-Test |
| G3 | Ersatz ohne Stufenprüfung | beide |
| G4 | Ersatz darf schon in der Runde stehen | Modultest |
| G5 | markierte Aufgabe wird ersetzt | Modultest |
| G6 | ohne Ersatz wird die Runde kürzer | Modultest |
| G7 | Eingabe wird verändert | Modultest |

## Hinweis
In Specific Examples kommen nun die 9 Vorlagen gleichmäßiger dran. Eine Runde enthält aber weiter 4 Fragen „more specific and personal“. Mehr Vielfalt bräuchte mehr Vorlagen. Das ist Inhaltsarbeit und nicht Teil dieser Aufgabe.
