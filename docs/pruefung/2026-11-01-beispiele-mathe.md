# Beispiele für alle Rechenaufgaben, Fehler „Show me how fehlt“ behoben (01.11.2026)

Peter (01.11.):
- „Ich hatte gerade eine Matheaufgabe ohne Example – bitte prüfen, wo es Sinn machen könnte.“
- „Bei manchen Themen ist nicht mal ein Show me how da (Specific Examples).“
- „What should you do FIRST with a word problem? – ich verstehe selbst nicht, was gemeint ist.“

## Befund

- **Fehler in v40:** Wurde bei einer Aufgabe das Beispiel genutzt oder gab es keines, blieb der Hilfeknopf auch bei den **folgenden** Aufgaben ausgeblendet. Dann fehlte „Show me how“ ganz.
- **Bestandsaufnahme der Mathe-Aufgaben** (je Quest 12 Runden, nach Aufgabentyp gruppiert): Beispiele gab es nur bei Runden, fehlenden Teilen und Stellenwert. Die meisten Typen hatten keines, etwa Uhr, Zahlenstrahl, gerade/ungerade, Vergleichen, Überschlagen, Kalender, Tabellen, Einheiten und Diagramme.

## Umgesetzt

- **Fehler behoben:** Jede neue Aufgabe zeigt wieder „Show me how“.
- **Leichtere Beispiele für alle Rechenaufgaben-Typen in Mathe:** 35 Aufgabentypen in sieben Quests.
  - Jedes Beispiel ist bewusst leichter: kleinere oder rundere Zahlen, ein Schritt, wo es hilft mit Bild (Uhr, Zahlenstrahl, Messstab, Diagramm, Tabelle).
  - **Es verrät nie die Lösung der eigenen Aufgabe.** Bei Fragen mit zwei Antworten (AM/PM, gerade/ungerade, < oder >, vernünftig ja/nein, cm oder m) zeigt das Beispiel bewusst die *andere* Antwort.
  - Reine Verständnisfragen (Warum …? Was tust du zuerst …?) bekommen einen Tipp, aber kein Beispiel.
- **Unklare Frage umformuliert:**
  - Bisher: „What should you do FIRST with a word problem?“ mit der Antwort „Read it twice and underline the numbers“.
  - Neu: „A word problem is a short story with numbers. What is a good FIRST step?“ mit der Antwort „Read it carefully: what is the question, and which numbers do I need?“
  - Die falschen Antworten sind jetzt typische Fehler: alle Zahlen addieren, mit der ersten Zahl anfangen, die größte Zahl hinschreiben.

## Prüfung

- Neu `tests/beispiele.test.mjs`: 28 Mathe-Runden mit echten Klicks. Bei jeder Aufgabe gilt:
  - „Show me how“ ist da (fängt den Fehler oben ab);
  - Rechenaufgaben bekommen ein Beispiel (Ergebnis 136 von 136);
  - das Beispiel zeigt nie die Lösung der Aufgabe;
  - Aufgaben auf der Stützstufe bekommen nie eins.
- `npm test`: 189 bestanden.
