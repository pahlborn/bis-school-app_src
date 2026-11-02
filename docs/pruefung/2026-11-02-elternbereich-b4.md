# Elternbereich B4: Übersicht aufräumen (02.11.2026)

Paket B4 aus `docs/konzept/elternbereich-auftraege.md` (Konzept 5.3, R4, R9, R10).

## Anliegen
Oben in der Übersicht standen:
- eine Dauerzeile „Letzte Sicherung …“, auch wenn es nichts zu sichern gab (B8)
- der Datenumzugs-Hinweis mit Knopf, ohne dass dort etwas einzustellen ist
- der Erklärtext „So lesen Sie diese Seite“ (Selbsterklärung, B13)
- eine Farblegende mit Überschrift und Prosa

Die Kapitel standen in der alten Reihenfolge.

## Umgesetzt
- **Hinweise nur, wenn etwas zu tun ist**, je eine Zeile mit höchstens einem Knopf, in dieser Reihenfolge:
  1. **⚠️ Datenumzug nicht abgeschlossen** [Ansehen] → ⚙ → Sicherung & Daten. Dort stehen jetzt der Text und „Erneut versuchen“. Erwachsene ohne Sicherungsrecht behalten den vollen Hinweis in der Übersicht, weil sie den Abschnitt in ⚙ nicht haben.
  2. **💾 Neue Übungen seit der letzten Sicherung** bzw. **Noch nie gesichert** [Jetzt sichern]. Bedingung: Seit der letzten Sicherung wurde in der App geübt oder ein Übungsblatt eingetragen, **und** die letzte Sicherung fehlt oder ist älter als 30 Tage (R10). Die Dauerzeile entfällt; „Letzte Sicherung“ steht in ⚙.
  3. **📄 Übungsblatt wartet** (unverändert).
  4. **👋 Neu hier?** [📖 So funktioniert Big Quest]. Der Hinweis erscheint, bis der angemeldete Erwachsene das Kapitel auf diesem Gerät einmal geöffnet hat, egal ob über den Knopf oder den Kapiteltitel. Gemerkt wird das je Erwachsenem in der neuen Gerätestelle `conceptSeen`, eingetragen in `werkzeug/speicherstellen.json`.
- **„So lesen Sie diese Seite“ entfällt.**
- **Farblegende** als kompakte Liste (Punkt + Wort) ohne Überschrift und Prosa. Der Schul-Begriff steht als Tooltip. „Vorläufig/bestätigt“ erklärt weiterhin das ⓘ der Einschätzung.
- **Kapitelreihenfolge:** 📖 So funktioniert Big Quest · 🤝 Ihr Kind unterstützen · 🏫 Einstufungen der Schule · 📄 Übungsblätter.

## Prüfung
- Neu: `tests/elternbereich-b4.test.mjs` (echte Klicks)
  - **T8:** Kapitelreihenfolge; kein „So lesen Sie diese Seite“ und kein „Was bedeuten die Farben?“; Legende in einer Liste mit 5 Einträgen.
  - **T18** in sechs Fällen:
    - keine Übung → kein Hinweis
    - Übung, nie gesichert → Hinweis
    - Sicherung vor 40 Tagen ohne neue Übung → kein Hinweis
    - Sicherung vor 40 Tagen, Übung gestern → Hinweis
    - Sicherung vor 10 Tagen → kein Hinweis
    - eingetragenes Übungsblatt nach alter Sicherung → Hinweis
  - **T4:** Datenumzug-Warnzeile nur bei Fehler, „Erneut versuchen“ nur in ⚙. „Neu hier?“ verschwindet nach dem Öffnen und bleibt nach erneuter Anmeldung weg; ein zweiter Elternteil auf demselben Gerät sieht ihn wieder; Öffnen über den Kapiteltitel zählt auch.
- Angepasst:
  - `stufe1-p1`: Sicherungs-Hinweis jetzt „Noch nie gesichert“; nach dem Sichern ist er weg, „Letzte Sicherung“ wird in ⚙ geprüft.
  - `stufe1-p2`: Datenumzug über „Ansehen“ in ⚙.
  - `elternansicht`: Legende statt „So lesen Sie“.
  - `anmeldung` und `elternbereich-b1`: Reihenfolge.
- Gegenproben (rot):
  - B4-Tests mit der App von `main` (3 von 3).
  - Sicherungs-Hinweis ohne die Bedingung „neue Übung“: T18 rot.
- `npm test`: 292 bestanden; nach dem Merge von `main` (Stufe 2 Aufgabe 3a, #65) 311 bestanden.
- Bildschirmfoto der Übersicht (Desktop) durchgesehen.

## Gefunden, nicht geändert
- In der schmalen Seitenspalte bricht die Legende auf mehrere Zeilen um; sie bleibt kompakt. Die Karte „Auf einen Blick“ (E3) wird die Seitenspalte ohnehin neu ordnen.
- `tests/themen.test.mjs` („neue Themen …“) ist in einem vollen `npm test`-Lauf nach dem Merge **einmal** fehlgeschlagen; beide fehlschlagenden Prüfungen darin enden mit einem leeren Array, welche es war, zeigt die Ausgabe nicht. Nicht nachvollziehbar: 60 Einzelläufe grün, ein zweiter voller Lauf grün, und eine Probe mit 8 758 erzeugten Aufgaben ergab keine Aufgabe ohne eigenes Beispiel und keine mit gleicher Lösung. Wahrscheinlich war es die Prüfung auf Seitenfehler unter Volllast. Der Test berührt nichts aus diesem Paket. Vorschlag für später: Den Test so ändern, dass er bei einem Fehlschlag ausgibt, welche Prüfung es war.
