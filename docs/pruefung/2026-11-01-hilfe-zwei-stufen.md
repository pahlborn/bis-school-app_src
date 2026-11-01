# Hilfe in zwei Stufen: „Show me how“ und „Show me the answer“ (01.11.2026)

Peter (01.11.): Nach „Show me how“ kamen „Not quite“, die Lösung und dieselbe Lösung noch einmal als „Worked answer“. Erwartet hatte er eine kurze, prägnante Erklärung. Ein „Zeig mir das Ergebnis“ dürfe die Lösung zeigen, die Aufgabe als nicht bestanden markieren und „Next“ anbieten. Wer Hilfe anfordert und dann richtig löst, arbeitet nicht ganz selbstständig, hat die Aufgabe aber verstanden.

**Fachlicher Hintergrund:** Die Forschung zu Lernprogrammen empfiehlt gestufte Hilfen: zuerst ein Hinweis zum Vorgehen, die Lösung erst als letzte Stufe (Aleven et al. 2003; Koedinger & Aleven 2007). Ausführliche Rückmeldung wirkt besser als nur die richtige Antwort (Shute 2008; Van der Kleij et al. 2015). Hilfe, die auf den Stand des Kindes eingeht, ist zentral (Van de Pol et al. 2010).

## Umgesetzt

- **„Show me how“** (Deutsch-Quest: „Zeig mir, wie“) zeigt einen **kurzen Tipp zum Vorgehen**, ohne die Lösung zu verraten. Es ist derselbe Tipp wie nach einem ersten Fehler, zum Beispiel der Zahlenstrahl mit Nachbar-Hundertern und Mitte. Danach probiert das Kind selbst. Der Tipp allein zählt weder als Fehler noch als Können.
  - **Richtig nach dem Tipp:** Es gibt einen Stern. Gewertet wird „mit Hilfe“ (Stützstufe im internen Stand, im Elternbereich als „mit Hinweis“), nicht als selbstständig.
  - **Falsch nach dem Tipp:** Es kommt kein zweiter Tipp. Stattdessen folgt die erklärte Lösung, die Aufgabe wird wiederholt und eine Brücke aus leichteren Aufgaben folgt.
- **„Show me the answer“** (Deutsch: „Zeig mir die Lösung“) erscheint erst nach dem Tipp oder nach einem ersten Fehler, also als letzte Stufe. Es zeigt die Erklärung **einmal** und darunter die Lösung. Der Wiederholungsauftrag ist für den nächsten Tag gesetzt, und eine Brücke folgt.
  - **Ohne eigenen Versuch:** Die Aufgabe gilt als nicht geschafft (interner Stand: Stützstufe, nicht gelöst). Der Punkt wird gelb, es gibt kein „Not quite“ und keinen Stern.
  - **Nach einem Fehlversuch:** „Not quite.“ mit rotem Punkt; der erste Fehler zählt wie bisher.
- Die doppelte Erklärung ist behoben.
- Texte angepasst: ⓘ-Hilfe beim Spielen, Willkommensseite, Kinderanleitung, Lernlogik und Exkurs (DE/EN). Zwei Quellen sind neu in der Quellenliste.

## Prüfung

- `tests/showme.test.mjs` neu gefasst (8 Tests):
  - Tipp ohne Lösung, ohne Beleg und ohne Wiederholung; die Antworten bleiben offen, der Knopf wechselt zu „Show me the answer“;
  - richtig nach dem Tipp → Stern, Stützstufe, „mit Hilfe“;
  - falsch nach dem Tipp → Lösung genau einmal, Wiederholung, Brücke;
  - „Show me the answer“ → Lösung genau einmal, gelber Punkt, nicht geschafft, Wiederholung morgen, Brücke;
  - der Tipp allein lässt bestehende Belege unberührt;
  - nach einem ersten Fehler kommt der Tipp von selbst, der Knopf bietet die Lösung an;
  - Deutsch-Quest mit deutschen Knöpfen.
- `tests/hilfe.test.mjs`: Lösung vor dem eigenen Versuch jetzt über beide Stufen.
- Gegenproben (alle rot):
  - Knopf zeigt sofort die Lösung;
  - Erfolg nach dem Tipp gilt als selbstständig;
  - Erklärung doppelt;
  - nach dem Tipp wird ein zweiter Tipp angeboten;
  - aufgeben nach dem Tipp zählt nicht.
- `npm test`: 185 bestanden.
