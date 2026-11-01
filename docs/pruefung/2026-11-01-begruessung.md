# S6 Begrüßung beim Start (01.11.2026)

Spezifikation S6 (30.10., Vault: „S6 Begrüßung beim Start“). Der Satz „talk to a grown-up you trust“ ist von Peter freigegeben (30.10.). Peter (01.11.): alle offenen Aufgaben ohne Rückfrage abarbeiten.

## Umgesetzt

- **Wann:** einmal am Tag, wenn ein angemeldetes Kind die Startseite erreicht.
  - Nicht am Tag der ersten Anmeldung – dann gab es gerade das Willkommen.
  - Nie für Erwachsene; deren Anmeldung zählt auch nicht als „begrüßt“.
  - Nicht für das Testkind des Admins, das zum Ausprobieren dient. `test2` bekommt die Begrüßung.
- **Was:**
  - „Hi, ‹Name›! 👋“ (Name aus „My profile“, als reiner Text), sonst „Hi there! 👋“.
  - „How are you today?“ mit vier Knöpfen. Ein Tipp zeigt nur eine Antwortzeile und schließt nichts. Bei „Sad“ steht zusätzlich genau einmal: „If something is on your mind, you can talk to a grown-up you trust.“ Bei „Tired“/„Sad“ rücken Witz und Lernbaum nach vorn; Practise Today bleibt.
  - „What would you like to do today?“: Practise Today, Choose a subject, A joke (Antwort auf Tipp), My learning tree, Practice sheet.
  - „Skip“ oben schließt mit einem Tipp; nach dem Witz heißt der Knopf „Done ✓“.
- **Gespeichert:** nur der Tag (`greetDay`). Die Stimmung wird nie gespeichert, gezählt oder angezeigt.

**Abweichungen von der Spezifikation (Entscheidung, Peter kann widersprechen):**

- Fünf statt sieben Angebote: Mystery Question und Pisolala bleiben bei der Belohnung nach der Runde. Begründung: weniger Doppelungen; die App soll nicht wachsen.
- Ein Ausgang („Skip“ / „Done ✓“) statt zwei – so passt alles ohne Scrollen auf ein kleines iPhone.
- Kein Begrüßungsbildschirm vor der Startseite, sondern ein Fenster über ihr. Die Startseite bleibt darunter unverändert.

## Prüfung

- Neuer Test `tests/begruessung.test.mjs` (mit Anmeldung, Uhr fest):
  - Am ersten Tag keine Begrüßung, am nächsten genau einmal; Skip mit einem Tipp; danach nicht erneut.
  - Name als Text; Stimmung schließt nichts; „Sad“-Zeile genau einmal, sonst nie; gemütliche Angebote vorn.
  - Witz mit Antwort; nichts mit mood/great/okay/tired/sad gespeichert; keine verbotenen Wörter (grade, level, score, streak, missed …).
  - 320 × 568: passt ohne Scrollen, alle Knöpfe ≥ 44 px; Practise Today mit einem Tipp.
  - Erwachsene: keine Begrüßung, kein `greetDay`.
- Gegenprobe (alle rot): Tagesprüfung entfernt; Willkommen setzt den Tag nicht; Stimmung gespeichert; „grown-up“-Zeile auch bei anderen Stimmungen.
- Sichtprüfung per Bildschirmfoto (320 × 568, nach „Sad“).
- `npm test`: 206 bestanden.
