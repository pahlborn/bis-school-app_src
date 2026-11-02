# S11 Stufe 1 – P3 Anmeldung neu (02.11.2026)

Spezifikation: Vault „S11 Stufe 1 – Eindeutige Personen und Zuordnung“, Abschnitt 3.6 (Phase P3).

## Umgesetzt

**„Meine Kinder“ – Befund B1 behoben:**
- Erwachsene sehen nur ihre eigenen Kinder:
  - Eltern ihre Kinder (Eltern-Kind-Beziehung),
  - Lehrkräfte die ihnen zugeordneten (bis P4 die Freigaben kommen),
  - der Admin nur das Testkind.
- Ein fremdes Kind erscheint nie, auch wenn es auf dem Gerät angemeldet ist.
- Eine Kind-Anmeldung ist nicht mehr nötig: Liegen die Daten eines eigenen Kindes auf dem Gerät, zeigt der Elternbereich sie gleich nach der Anmeldung (E2: 0 Tipps).
- Ist das angemeldete Kind nicht das eigene, zeigt die App das erste eigene Kind. Mit mehreren eigenen Kindern gibt es oben die Auswahl.
- Ohne Daten eigener Kinder auf dem Gerät: „Meine Kinder“ mit dem Hinweis, dass die Daten auf dem Gerät des Kindes liegen. Kapitel mit Kinderdaten (Schule, Blätter, Für das Kind) erscheinen dann nicht.

**„Who's here?“:** Auf einem Gerät, auf dem sich schon Kinder angemeldet haben, wählt sich das Kind mit Emoji und Namen aus. Das Passwort wird trotzdem verlangt; der Passwortspeicher füllt es nach Face ID aus.

**Passwortregeln** (Kinder und Erwachsene):
- Mindestens 12 Zeichen. Kein häufiges Grundwort mit Ziffern, keine Folgen, Tastaturreihen oder Wiederholungen, nicht der eigene Name mit Ziffern.
- Vorschlag „Merkpasswort“: drei Wörter aus rund 800 kindgerechten englischen Wörtern und eine vierstellige Zahl (≈ 42 Bit), mit „Übernehmen“ und „Anderer Vorschlag“.
- Ein bestehendes schwächeres Passwort wird einmal bei der nächsten Anmeldung erneuert.
- Die Felder sind für den Passwortspeicher gekennzeichnet (Anmeldename im Formular).

**Texte:** Kinderhilfe mit den drei Sätzen zum Passwort; Elternanleitung (12 Zeichen, „nur eigene Kinder“).

**Abweichung von der Spezifikation (begründet):**
- Statt „2 048 Wörter, dreistellige Zahl“ sind es rund 800 Wörter mit vierstelliger Zahl; das ergibt dieselbe Stärke (≥ 40 Bit, im Test nachgerechnet).
- Statt einer Liste der 1 000 häufigsten Passwörter prüft die App häufige Grundwörter samt Varianten und einfache Muster. Bei 12 Zeichen Mindestlänge fallen die meisten Listeneinträge ohnehin weg.

## Prüfung

- **Neu `tests/stufe1-p3.test.mjs`:**
  - **K7:** 70 typische schwache Passwörter abgelehnt; 1 000 Vorschläge angenommen und verschieden; ≥ 600 Wörter, ≥ 40 Bit; gute lange Sätze angenommen.
  - Erstes Passwort mit Vorschlag und Kennzeichnung für den Passwortspeicher.
  - Erneuern eines alten 4-Zeichen-Passworts; danach gilt nur das neue.
  - **K8:** „Who's here?“ mit Namen; Passwort trotzdem nötig; Daten getrennt.
  - Kinderhilfe.
- **Umgestellt (bewusst):**
  - `anmeldung` – B1 behoben: Eltern wählen zwischen eigenen Kindern (neues Testkind `tim`); der Admin sieht nur das Testkind; E2 ohne Kind-Anmeldung; Hinweis „Meine Kinder“; Kapitelprüfung mit Kind; Sprachprüfung als Elternteil;
  - `stufe1-ist` – B1 behoben;
  - `schule` – das zweite Kind gehört nun zu den Eltern.
  - Test-Passwörter erfüllen die neuen Regeln.
- **Gegenprobe (6 von 6 rot):**
  - B1 wieder offen;
  - Mindestlänge 4;
  - kein Erneuern;
  - kein „Who's here?“;
  - Auswahl ohne Abgleich des angezeigten Kindes;
  - Kapitel ohne eigenes Kind.
- `npm test`: 225 bestanden.
