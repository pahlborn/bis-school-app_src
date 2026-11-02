# Elternbereich D4: die Lücke für Eltern (02.11.2026)

Paket D4 aus `docs/konzept/elternbereich-auftraege.md` (Konzept 6.6, R10, R11).

## Anliegen
Die Lücken-Logik (D1–D3) läuft bisher ohne Rückmeldung an die Eltern, abgesehen vom Etikett an der Quest. Eltern sollen den Fortschritt sehen und selbst entscheiden können (R11: Die App weiß nicht, wer geantwortet hat).

## Umgesetzt
- **Block „🏫 Aus der Schule“ → „Lücken laut Schule“** (je Fach, nach dem Fach des Standards):
  - **aktive Lücke** 🎯 mit Fortschrittsbalken und „noch etwa N Aufgaben“ (bis 20 erste Versuche der am weitesten geübten Quest der Lücke). Danach „noch an N weiteren Übungstagen“ bzw. „noch nicht ganz sicher – weiter üben“. Nie als Frist (R10).
  - **wartende Lücken** mit „wartet“.
  - **geschlossene Lücken:** „Lücke geschlossen ✓ (Datum)“ mit Vermerk „laut den Antworten in der App“ oder „von Ihnen geschlossen“.
- **Knöpfe** (nur Eltern, nie Lehrkraft oder Admin über eine Freigabe):
  - **„Jetzt angehen“** (wartende Lücke): wird aktiv, die bisherige wartet, Fortschritt bleibt.
  - **„Als geschlossen markieren“** (offene Lücke): `closed[standard].by = 'parents'`.
  - **„Weiter üben“** (von der App geschlossene Lücke): öffnet sie wieder, macht sie aktiv und vermerkt „von Ihnen offen gehalten (Datum)“. Die App schließt sie dann nicht mehr von selbst (`hold`), nur die Eltern.
- **ⓘ „Lücken laut Schule“** (DE/EN): Regel, Kontingent, Überspringen und der ehrliche Satz „bestätigt sicher heißt: sicher bei den Antworten in der App …“.
- **Speicher `gaps`:** neu das Feld `hold`; `closed` und `active` wie bisher.

## Prüfung
- Neu: `tests/elternbereich-d4.test.mjs` mit **erfundenen** Schuldaten
  - **T17:** aktive Lücke mit Balken und „noch etwa 8 Aufgaben“ (12 von 20), keine Zeitwörter in der Liste und im ⓘ.
  - **T19:**
    - „Jetzt angehen“ macht die wartende Lücke aktiv (Etikett wechselt).
    - „Als geschlossen markieren“ schließt mit Vermerk.
    - Die App schließt eine bestätigte Lücke („laut den Antworten in der App“). „Weiter üben“ hält sie offen, die App schließt sie danach **nicht** wieder, die Eltern schließen sie.
    - Englische Texte.
  - **Lehrkraft mit Freigabe:** sieht die Lücken, aber keinen Knopf.
- Gegenproben (rot):
  - D4-Test mit der App von `main` (2 von 2).
  - „Weiter üben“ ohne Wirkung auf die App (1).
- `npm test`: 352 bestanden.
- Bildschirmfoto des Blocks mit erfundenen Daten durchgesehen.

## Gefunden, nicht geändert
- Der Fortschritt zählt nur die 20 ersten Versuche (und die Übungstage). Die übrigen Bedingungen für „bestätigt sicher“ (Klassenniveau mindestens 6 Antworten, 80 % an 3 Tagen) zeigt er nicht einzeln. Nach 20 Aufgaben steht deshalb ggf. „noch nicht ganz sicher – weiter üben“.
