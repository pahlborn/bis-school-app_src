# Hilfen strikt nach Rolle getrennt (01.11.2026)

Peter (01.11.) hatte gesehen, dass im Kinderbereich noch das Konzept stand und die Erwachsenen auch die Kinderanleitung sahen. Vorgabe: Hilfen und Anleitungen gehören jeweils nur zu ihrer Rolle.

## Umgesetzt

- **Kind (angemeldet):**
  - Es gibt nur noch einen Knopf, „❓ Help“; der Knopf „📖 How Big Quest works“ fällt weg.
  - Die Hilfe zeigt nur die Kinderanleitung „How to use Big Quest“ (englisch) und die kleine Versionsangabe.
  - Kein Konzept, kein Hinweistext für Erwachsene, keine Quellen und keine Datenschutzseite; keine Flaggen.
- **Erwachsene:** Unter „📖 Anleitung & Hintergrund“ stehen ihre Anleitung, die Methodenkarten, das Konzept, die Quellen, die Schulseiten und die Version. Die Kinderanleitung ist dort nicht mehr aufgeführt.
- **Anmeldebildschirm:** Der Hilfetext sagt jetzt „Kinder tippen ❓ Help, Erwachsene finden ihre Anleitung im Elternbereich“.
- **Antwortseite des Übungsblatts:** „Enter results in the app: 👪 Grown-ups → Practice sheets“ statt des alten „About & grown-ups“.
- Ohne Konten (PIN-Modus) bleibt alles wie bisher.

## Prüfung

- `tests/anmeldung.test.mjs`:
  - Das Kind sieht nur „❓ Help“ mit der Kinderanleitung. Folgende Inhalte erscheinen nicht: Hinweis, Grundidee, Leitgedanken, Quellen, Datenschutz, Erwachsenen-Anleitung, Stufenwörter. Keine Flaggen.
  - Im Elternbereich gibt es keine Kinderanleitung.
- Gegenproben (alle rot):
  - Kinderansicht abgeschaltet;
  - Kinderanleitung wieder im Elternbereich;
  - zweiter Info-Knopf für das Kind.
- `npm test`: 173 bestanden.
