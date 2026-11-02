# 2026-11-02 – Aufgabe 2b: sporadisch roter Test `lernlogik`

## Befund
- Test „hakt es noch (Requires support) …“ war etwa einmal in 40 Läufen rot.
- **Ursache in der App, nicht im Test:** `adaptRound` sucht Ersatzaufgaben in einem Vorrat aus vier zufällig gebauten Runden. Fehlte dort eine passende Aufgabe, gab die Funktion still auf.
- Gemessen direkt im Browser (Haken auf `adaptRound`, Quest `round`, Stand „hakt es noch“): **29 von 4 000 Runden** (0,7 %) hatten weniger als die geplanten zwei Aufgaben mit Hilfe, 3 davon keine. Für das Kind hieß das: gelegentlich eine Runde ohne die vorgesehene Hilfe.

## Änderung
- `index.html`, `adaptRound`: Fehlt eine Aufgabe der gesuchten Stufe, baut die App weitere Runden nach, höchstens `ADAPT_BUILDS = 12`. Der Vorrat startet wie bisher mit vier Runden.
- Nach der Änderung: **0 von 20 000 Runden** verfehlt.

## Test
- Neu in `tests/lernlogik.test.mjs`: „Anpassung hält die Vorgaben in jeder Quest zuverlässig ein“.
  - Prüft für **alle** Quests direkt gerechnet (ohne Klickweg): „hakt es noch“ ergibt keine Herausforderung und mindestens zwei Aufgaben mit Hilfe, wo die Quest welche hat (800 Runden); „sitzt“ ergibt mindestens zwei Herausforderungen, wo es welche gibt (250 Runden).
  - Dauer etwa 33 s.
- Der alte Klicktest bleibt unverändert als Bedienweg-Test.
- Der neue Test schließt seinen eigenen Testserver auch bei einem Fehler (`finally`). Ohne das endete ein roter Lauf nie; aufgefallen bei der ersten Gegenprobe.

## Gegenproben (alle rot)
| Gegenprobe | Ergebnis |
|---|---|
| alter Vorrat (`ADAPT_BUILDS = 4`) | rot in 5 von 5 Läufen („round RS: nur 1 mit Hilfe“) |
| „hakt es noch“ verlangt nur 1 Aufgabe mit Hilfe | rot |
| „hakt es noch“ erlaubt eine Herausforderung | rot |

Bei 800 Runden wird der alte Fehler rechnerisch in weniger als einem von 250 Läufen übersehen.

## Abweichung von der Aufgabe
Statt 200 Durchläufen des Klicktests (rund 17 Minuten) wurden 20 000 Runden direkt gerechnet. Das entspricht etwa 2 500 Klicktest-Läufen und zeigt die Ursache unmittelbar.

## Volle Reihe
312/312 grün (207 s), nach Einmergen von `main` (mit 3a und Elternbereich B4).

## Veröffentlichung
Nicht veröffentlicht. `main` enthält unveröffentlichte Elternbereich-Pakete (B1–B4). Veröffentlichen nimmt immer den ganzen Stand mit; das entscheidet die Elternbereich-Sitzung bzw. Peter. Die Korrektur geht mit der nächsten Veröffentlichung live.

## Hinweis für parallele Sitzungen
`%TEMP%\opencode\voll-testen.ps1` schreibt immer nach `full.txt` / `full-done.txt`. Laufen zwei volle Reihen gleichzeitig, überschreiben sie sich gegenseitig. Dann nacheinander starten.
