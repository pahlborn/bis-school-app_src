# Neue Themen aus den Standards der Schule (01.11.2026)

Offener Punkt aus dem Konzept (Abschnitt 13): Lücken zwischen den Standards der Schule und den Quests schließen. Peter (01.11.): alle offenen Aufgaben ohne Rückfrage abarbeiten.

## Umgesetzt (je Quest)

| Thema | Quest | Aufgaben |
|---|---|---|
| Runden auf 1.000 | Rounding Road | „Round 8,591 to the nearest thousand.“ Gleiches Modell wie bei 10/100: Nachbar-Tausender, Mitte bei …500. Tipp mit Zahlenstrahl, Brücke mit zwei leichteren Aufgaben, Beispiel. |
| Erweiterte Schreibweise, 0 als Platzhalter | Time & Numbers | „Which shows 4,056 in expanded form?“ (falsch angeboten: verschobene Stellen, Ziffer an falscher Stelle, Einer ×10 – nie eine zweite richtige) und „What number is 8,000 + 600 + 1?“ (Eingabe). |
| Skalen in 2er-, 5er- und 10er-Schritten | Bar Graphs | Nur jede zweite Marke hat eine Zahl; der Pfeil zeigt immer auf eine Marke ohne Zahl. Typischer Fehler (in Einern weiterzählen) wird als falsche Antwort angeboten. |
| Liniendiagramme | Bar Graphs | Temperatur Mo–Fr: wärmster/kältester Tag, Wert an einem Tag ablesen. |
| Subtraktion bis 9.999 in zwei Schritten | Word Problems | Bibliothek, Stadion, Fahrstrecke, Kronkorken: „How many … are left?“ (Eingabe). Tipp: erst die Tausender, Zwischenergebnis aufschreiben, dann den Rest. |
| Mit dem Taschenrechner prüfen | Word Problems | Welche Tasten prüfen die Rechnung (Umkehraufgabe)? Und: Was sagt das Ergebnis der Probe – richtig oder Fehler suchen? |

- Jede neue Aufgabe hat einen eigenen Tipp („Show me how“) und ein leichteres Beispiel, das nie die Lösung verrät.
- Untertitel der Quests angepasst.
- Die Quests bleiben bei 8 Aufgaben: Neue Aufgaben ersetzen je eine Wiederholung derselben Art (z. B. eine von drei Balkendiagramm-Ableseaufgaben).

## Prüfung

- Neuer Test `tests/themen.test.mjs`:
  - 200 Aufgaben je Thema werden nachgerechnet: Rundung, Summe der Stellenwerte, Pfeil auf einer Marke ohne Zahl (nur 6 Zahlen auf der Skala), Liniendiagramm aus den Punkten des Bilds nachgelesen, Subtraktion aus dem Text, Probe-Logik.
  - Die neuen Themen kommen in den Quests vor (je ≥ 5-mal in 40 Runden) – mit leichterem Beispiel, dessen Antwort sich unterscheidet.
  - Die Brücke beim Runden auf 1.000 bleibt bei Tausendern.
- Gegenprobe (alle rot): falsche Rundungsgrenze; alle Marken beschriftet; Tipp fehlt; neue Aufgaben nicht in der Quest; zweite richtige Lösung als Ablenker.
- Sichtprüfung der neuen Bilder (Skala, Liniendiagramm) per Bildschirmfoto.
- `npm test`: 199 bestanden.
