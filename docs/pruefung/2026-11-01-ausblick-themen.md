# Ausblick: Mathe-Themen für später, gesperrt bis zur Freigabe (01.11.2026)

Offener Punkt aus dem Konzept (Abschnitt 13): vorausschauende Mathe-Themen anlegen, gesperrt, bis Erwachsene sie freischalten. Peter (01.11.): alle offenen Aufgaben ohne Rückfrage abarbeiten.

## Umgesetzt

Fünf neue Quests im Fach Maths, je 8 Aufgaben mit eigenem Tipp:

| Quest | Inhalt |
|---|---|
| Times Tables | gleich große Gruppen, Punktefelder (welche Malaufgabe passt?), Einmaleins mit 2, 3, 4, 5, 10, in Schritten zählen |
| Fractions | welcher Bruchteil ist gefärbt (Halbe bis Achtel), Hälfte/Drittel/Viertel einer Menge, welcher Stammbruch ist größer |
| Area & Perimeter | Kästchen zählen (Fläche), einmal rundherum (Umfang), Fläche oder Umfang? |
| Time Passes | Minuten zwischen zwei Uhrzeiten, Uhrzeit nach x Minuten (auch über die volle Stunde), Zeit-Fakten |
| Mass & Capacity | g/kg/ml/l passend wählen, kg ↔ g und l ↔ ml, Küchenwaage in 100-g-Schritten |

**Freigabe (Entscheidung, Peter kann widersprechen):**

- Für das Kind sind die Themen **unsichtbar** (kein gesperrtes Schloss als Lockmittel), bis Erwachsene sie freigeben.
- Freigegeben wird im Elternbereich unter Maths im Kasten „Ausblick: Themen für später“, je Thema und je Kind. Das geht nur an dieser Stelle.
- Lehrkräfte sehen den Stand, schalten aber nicht.
- Solange ein Thema gesperrt ist, kommt es nicht in den Fokus, den Maths-Mix oder auf Übungsblätter.
- Nach der Freigabe verhält es sich wie jede andere Quest: Fokus-Schalter, Einschätzung, Übungsblatt.

## Prüfung

- Neuer Test `tests/ausblick.test.mjs`:
  - Kinderseite ohne die fünf Quests; nicht im Fokus; 40 Maths-Mixe ohne Aufgaben daraus.
  - Freigabe mit echtem Klick: Nur „Fractions“ erscheint, die Runde hat 8 Fractions-Aufgaben. Eine gesperrte Quest hat keinen Fokus-Schalter. Wieder sperren blendet sie aus.
  - 300 Runden werden nachgerechnet (Produkt, Punkte im Bild, gefärbte Teile im Bild, Anteil einer Menge, Stammbruchvergleich, Kästchen, Umfang aus den Seitenlängen im Bild, Zeitspanne, Uhrzeit danach, kg → g, Waage auf einer Marke ohne Zahl). Jede Aufgabe hat einen eigenen Tipp.
- Gegenprobe (alle rot): Sperre auf der Kinderseite entfernt; Sperre im Mix entfernt; Schalter sperrt nicht wieder; Bild färbt einen Teil zu viel.
- Sichtprüfung der neuen Bilder per Bildschirmfoto.
- `npm test`: 202 bestanden.
