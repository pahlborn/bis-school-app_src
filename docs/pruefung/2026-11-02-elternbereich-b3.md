# Elternbereich B3: ⚙ → Über die App (02.11.2026)

Paket B3 aus `docs/konzept/elternbereich-auftraege.md` (Konzept 5.8, R11).

## Anliegen
Datenschutz, Einleitung und Wichtiger Hinweis standen im Konzept-Kapitel „So funktioniert Big Quest“, gehören aber zur App (Befund B10). Ein Ort für ein Impressum fehlte (B16). Peter (02.11.): Die App weiß nicht, wer geantwortet hat; die Verantwortung liegt bei den Eltern (R11).

## Umgesetzt
- **⚙ → ℹ️ Über die App** enthält jetzt:
  - die Einleitung „Grade 3 – Big Quest ist …“
  - den **Wichtigen Hinweis**
  - **Datenschutz** und **Impressum** zum Aufklappen (Impressum: Platzhalter „Wird ergänzt.“ / „To be added.“)
  - die **Version**
- **Satz zur Verantwortung** (R11), DE und EN:
  - im Wichtigen Hinweis: „Die App weiß nicht, wer eine Aufgabe gelöst hat und mit welchen Hilfsmitteln. Was sie anzeigt, ist ein Hinweis; die Verantwortung für das Lernen und für Entscheidungen liegt bei den Eltern.“
  - kurz im ⓘ der Einschätzung
- **„Konten und Rechte“** im Datenschutz auf zwei Sätze gekürzt, mit Verweis auf ⚙ → „🔐 Zugriff & Freigaben“ (Befund B12). Weggefallen sind diese Doppelungen:
  - Daten hängen an der Kennung (steht in der Bedienhilfe)
  - Einzelheiten der Freigabe (stehen in Freigaben und Hilfe)
  - „Ohne Freigabe sieht der Admin nur Verwaltungsangaben“ (Admin-Hilfe)
  - „Einschätzungen sind weder Diagnosen noch Bewertungen“ (Wichtiger Hinweis und ⓘ)
- **Eine Stelle (R1):** Die Texte bleiben in `ABOUT_DE` / `ABOUT_EN`. ⚙ zeigt sie, das Konzept-Kapitel im Elternbereich blendet Einleitung, Hinweis und Datenschutz aus (`PRIVACY_TITLES`). Die Info-Seite außerhalb des Elternbereichs (für Gäste ohne Anmeldung) zeigt Hinweis und Datenschutz weiter. Die Kinder-Hilfe ist unverändert, sie zeigt nur die Kinder-Anleitung.

## Prüfung
- Neu: `tests/elternbereich-b3.test.mjs` (echte Klicks)
  - **T11:** ⚙ → Über die App zeigt Einleitung, Hinweis mit Verantwortungs-Satz, Datenschutz, Impressum und Version, auf Deutsch und Englisch, auch für die Lehrkraft. Das Konzept-Kapitel enthält weder Einleitung noch Hinweis noch Datenschutz.
  - Das ⓘ der Einschätzung nennt die Verantwortung. Die Info-Seite ohne Konten zeigt Hinweis und Datenschutz.
- Angepasst: `hilfe-rollen` liest den Datenschutz jetzt in ⚙ → Über die App und prüft zusätzlich den Verweis auf Zugriff & Freigaben.
- Gegenprobe: B3-Tests mit der App von `main` rot (2 von 2).
- `npm test`: 289 bestanden.

## Gefunden, nicht geändert
- Das Impressum bleibt Platzhalter. Falls es nötig wird, muss es ohne Passwort auf der öffentlichen Anmeldeseite stehen (Konzept 5.8). Das kollidiert mit `verbotene-woerter.txt` und ist offen.
