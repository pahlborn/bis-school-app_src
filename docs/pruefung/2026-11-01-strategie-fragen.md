# Strategie- und Verständnisfragen klarer formuliert (01.11.2026)

Offener Punkt aus dem Konzept (Abschnitt 13): unklare Strategiefragen prüfen. Peter (01.11.): alle offenen Aufgaben ohne Rückfrage abarbeiten.

## Durchsicht

13 Fragen zu Vorgehen und Verantwortung geprüft (Runden, Rechenwege prüfen, Textaufgaben, OREO-Plan, Recherche, Abschluss einer Gruppenarbeit). Befunde:

- **Scherz-Ablenker** („Take a selfie“, „Ask the sticker“, „Colour the page“, „The first letter“, „Draw a map“ …): Diese Antworten kann man ohne Nachdenken ausschließen; die Frage prüft dann nichts.
- **Kreisschluss:** „You found ONE way to make 905. How can you explore another idea?“ hatte die Lösung „Show more than one correct way“.
- **Unklarer Bezug:** „Why do we round to the nearest ten **here** …“ – ohne zu sagen, wo „hier“ ist.
- **Falsches Modell:** „Which digit do you look at … Tens digit 5 or more: round up.“ widerspricht dem Schulmodell (Zahlenstrahl, Nachbarzahlen, Mitte). Die Schule rät ausdrücklich von der bloßen Regel ab.

## Umgesetzt

- Falsche Antworten sind jetzt typische Denkfehler. Beispiele: „Subtract 600 from 905 again“ und „Add 905 + 600“ beim Prüfen einer Subtraktion; „Only the last step is wrong“ und „It is fine, 902 is close“ bei falsch abgeschriebenen Zahlen; „Hand it in half done without saying anything“ bei der Verantwortung.
- „Another way“ ist jetzt eine echte Aufgabe: „You made 905 as 500 + 400 + 5. Which is ANOTHER correct way?“ → 600 + 300 + 5. Als falsch angeboten werden derselbe Weg, eine falsche Summe und eine falsche Zerlegung.
- Runden nach dem Schulmodell: „Round 347 to the nearest hundred. How do you decide?“ → „Find the halfway point 350: 347 is before it, so 300“.
- „Here“ ist aufgelöst: „To estimate 48 + 31, why round to the nearest TEN …“ mit einer Erklärung, die beide Schätzungen ausrechnet.
- „Britannica“ ist in der Frage zum ersten Schritt verallgemeinert („an encyclopedia or a book“).

## Prüfung

- `tests/fragen.test.mjs`, neuer Test: keine Scherz-Ablenker mehr, keine Regel „ab 5“, neue Fragen vorhanden.
- Gegenprobe (beide rot): ein Scherz-Ablenker zurück; die alte Rundungsfrage zurück.
- `npm test`: 196 bestanden.
