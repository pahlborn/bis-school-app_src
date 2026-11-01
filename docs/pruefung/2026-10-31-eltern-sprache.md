# Angemeldet bleiben, Elternbereich aufgeräumt, DE/EN vollständig (31.10.2026)

Grundlage sind Peters Vorgaben vom 31.10.:
- Keine Abmeldung nach 5 Minuten oder im Ruhezustand.
- Kein Bearbeitungstext im Elternbereich.
- DE/EN überall, sinngemäß übersetzt und in amerikanischem Englisch.
- Kalender-Erinnerung bleibt vorerst.

## Umgesetzt

- **Angemeldet bleiben:**
  - Erwachsene bleiben angemeldet, bis sie „Abmelden“ tippen. Es gibt keinen Zeitablauf und keine Abmeldung, wenn das iPad in den Ruhezustand geht oder die App geschlossen wird.
  - Die Anmeldung liegt wie die des Kindes auf dem Gerät (`adultSession`). Beim Öffnen geht die App direkt in den Elternbereich, „👪 Grown-ups“ ebenso.
  - Nach dem Testkind führt „Zurück zum Elternbereich“ auch nach dem Ruhezustand oder einem Neustart zurück.
  - Ohne Konten (PIN-Modus) gibt es ebenfalls keinen Zeitablauf und keine Sperre im Hintergrund.
- **Kein Bearbeitungstext:** Unter der Kopfzeile steht kein Hinweis mehr wie „Angemeldet als … / Abmeldung nach 5 Minuten“. Die Kopfzeile zeigt „Elternbereich · Name“. Wie das An- und Abmelden funktioniert, steht in der Anleitung und auf der Willkommensseite.
- **Jede Sache an einer Stelle:**
  - Den Fokus setzt man nur noch über den Schalter an der Quest; die Liste unter Einstellungen ist entfallen.
  - Aus „⚙️ Einstellungen“ wird „👧 Für das Kind“ mit Pisolala-Grenze, Kalender-Erinnerung und Profilangaben.
  - „Helfen wie die Schule“ ist aufgelöst. Die drei Methodenkarten, die Schulwebseiten und die App-Version stehen jetzt unter „📖 Anleitung & Hintergrund“.
  - Die Themenliste fürs Schuljahr (ohne Links) ist entfernt.
- **DE/EN vollständig im Erwachsenenbereich:**
  - Kopfzeile, Übungsblätter (Knöpfe „Richtig / Mit Hilfe / Noch nicht“ bzw. „Correct / With help / Not yet“, Datum je Sprache), Pisolala-Grenze, Kalender-Erinnerung (auch der Dateiname), Profilangaben, Version, Methodenkarten, Schulwebseiten.
  - Quellenseite: Einleitung und nicht öffentliche Quellen in beiden Sprachen; Vermerke wie „bibliografisch geprüft“ werden im Englischen übersetzt.
  - ⓘ-Hilfen (eigene englische Fassungen), PIN-Seite, Willkommensseite, Testleiste (in der Sprache der Erwachsenen).
  - Anmelde- und Passwortseite für Erwachsene: Deutsch nach Spracheinstellung. Die Rollenwahl und die Seiten für das Kind bleiben englisch.
  - Englisch ist sinngemäß übersetzt, in amerikanischer Schreibweise (practiced, colors, judgment, periods). Die Knopfnamen der Kinderseite („Practise Today“) bleiben, wie sie auf dem Bildschirm stehen.
- Anleitung (DE/EN) aktualisiert: Angemeldet bleiben, Bitte um Abmelden auf dem Gerät des Kindes, neuer Aufbau des Elternbereichs, Flaggen, Testkind (Admin).

## Prüfung

- Neu in `tests/anmeldung.test.mjs`:
  - **Sprachprüfung:** Im englischen Elternbereich (alle Kapitel und Fächer, alle ⓘ) gibt es keine deutschen Reste und keine britische Schreibweise. Im deutschen Elternbereich gibt es keine englischen Bedienwörter.
  - **Angemeldet bleiben:** nach 1 Stunde, im Ruhezustand und nach dem Neustart; nur „Abmelden“ beendet die Anmeldung.
  - Testkind: Der Rückweg bleibt auch nach Ruhezustand und Neustart.
  - Kein Hinweistext unter der Kopfzeile; keine zweite Fokusliste.
- Angepasst:
  - `eltern.test.mjs`: Sperre nur noch über „Sperren“; Fokus über die Schalter an der Quest, Wiederherstellen über „Empfehlung übernehmen“.
  - `hilfe`, `info`, `neutral`, `version`: neue Kapitel; Karten zusätzlich auf Englisch geprüft.
- Gegenproben (alle rot):
  - Abmelden im Hintergrund wieder eingebaut;
  - Anmeldung nicht gespeichert;
  - deutscher Satz in einer englischen ⓘ-Hilfe;
  - Hinweistext unter der Kopfzeile;
  - „Abmelden“ ohne Löschen der Anmeldung;
  - zweite Fokusliste.
- `npm test`: 173 bestanden.
