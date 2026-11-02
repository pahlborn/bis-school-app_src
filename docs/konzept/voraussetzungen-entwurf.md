# Voraussetzungen zwischen Quests – Entwurf (nicht eingebaut)

**Stand:** 02.11.2026, Paket D3. **Status:** Entwurf, von Peter **nicht** freigegeben („ich weiß es nicht“). Nicht in der App. Statt der Tabelle wurde „Überspringen“ eingebaut: Eine Lücke, deren Quests alle ohnehin aktuelle Themen sind, wird bei der Wahl der aktiven Lücke übersprungen (Konzept 6.4).

## Entwurf: „Quest A setzt Quest B voraus“

| Nr. | A (baut auf …) | B (… auf diesem auf) | Begründung |
|---|---|---|---|
| V1 | Rounding Road | Time & Numbers | Runden braucht Stellenwert und Zahlenstrahl: Nachbar-Hunderter finden, Mitte bestimmen. |
| V2 | Number Combinations | Time & Numbers | Zahlen in Hunderter, Zehner und Einer zerlegen setzt den Stellenwert voraus. |
| V3 | Data Detective | Time & Numbers | Mit < und > vergleichen und Tabellenwerte ordnen setzt den Stellenwert voraus. |
| V4 | Bar Graphs & Worksheets | Data Detective | Diagramme lesen baut auf Tabellen lesen und Vergleichen auf. |
| V5 | Bar Graphs & Worksheets | Time & Numbers | Skalen in Schritten von 2, 5 oder 10 ablesen braucht den Zahlenstrahl. |
| V6 | Word Problems | Number Combinations | Zweischrittige Sachaufgaben nutzen Additions- und Zerlegungsstrategien (gleicher Standard M-N4, ohne Wirkung auf die Reihenfolge). |

**Weggelassen:**
- Deutsch hat nur eine Quest.
- In Englisch haben Opinion Writing, Capital Letters und Specific Examples denselben Standard E-W1.
- Die Ausblick-Themen sind gesperrt.
- Unsichere Beziehungen (Units ← Time & Numbers, Word Problems ← Rounding Road) sind nicht aufgenommen.

## Wirkung, falls eingebaut (echte Daten, 02.11.)
„Time & Numbers“ (M-N1) rückte vom 6. auf den 1. Platz der Lücken, weil Rounding Road, Number Combinations und Bar Graphs aktuelle Themen sind und darauf aufbauen. Danach käme M-N4, dann die übrigen in heutiger Reihenfolge.

## Wenn es später doch kommen soll
Als Datenliste neben `STANDARDS` und als erste Regel in `activeGap()` vor dem Überspringen: Eine Lücke rückt vor, wenn ein aktuelles Thema auf einer ihrer Quests aufbaut. Mit Test, Konzept 6.4/6.7.
