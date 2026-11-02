# Elternbereich E3: Auf einen Blick (02.11.2026)

Paket E3 aus `docs/konzept/elternbereich-auftraege.md` (Konzept 5.10, R10, R11).

## Anliegen
Wer den Elternbereich öffnete, sah Hinweise, Kacheln und die Einschätzung, aber nirgends in wenigen Zeilen: Was ist seit dem letzten Mal passiert, was gelingt, woran arbeitet das Kind, was kann ich zu Hause tun?

## Umgesetzt
- **Karte „Auf einen Blick · <Kind>“** in der Übersicht, unter den Hinweisen und vor den Kacheln. Je Punkt eine Zeile; eine Zeile ohne Inhalt entfällt.
  - 🌱 **Seit Ihrem letzten Besuch:** Aufgaben (erste Versuche), neue Abzeichen, neuer Titel, „Lücke geschlossen ✓ <Standard>“. Ohne Neues: „Seit Ihrem letzten Besuch wurde nicht geübt – das ist in Ordnung.“ Beim ersten Besuch und für Lehrkräfte entfällt die Zeile.
  - ⭐ **Das gelingt:** bis zu 2 zuletzt geübte Quests mit „Sicher“ oder „Darüber hinaus“.
  - 🎯 **Daran arbeiten wir:** die aktive Lücke mit Balken und „noch etwa N Aufgaben“ (wie in der Fachansicht), sonst das erste aktuelle Klassenthema im Fokus.
  - 💡 **Idee für zu Hause:** eine Idee aus „So helfen Sie“ der Quest(s) aus 🎯, bei jedem Besuch die nächste.
  - **Mehr dazu → <Fach>** öffnet die Fachansicht dieser Quest.
- **Letzter Besuch** je Erwachsenem und Kind in der neuen Gerätestelle `glance` (`GLOBAL_KEYS`, `speicherstellen.json` mit `"sicherung": false`). Nicht in der Sicherung, weil eine zurückgespielte Sicherung sonst einen alten Besuch zurückbringt. Ein Besuch dauert vom Öffnen bis zum Sperren oder Abmelden; neues Zeichnen innerhalb eines Besuchs (Sprache, Fach) ändert Zählung und Idee nicht.
- Keine Zeitwörter (R10): Fortschritt in Aufgaben, kein Datum des letzten Besuchs.

## Weggefallen
Nichts.

## Prüfung
- Neu: `tests/elternbereich-e3.test.mjs` (**T15**):
  - erster Besuch ohne 🌱
  - zweiter Besuch: „5 Aufgaben, 1 neues Abzeichen“
  - neues Zeichnen (EN/DE) behält Zählung und Idee
  - die Idee wechselt von Besuch zu Besuch
  - ohne Übung der ruhige Satz
  - zweiter Elternteil: eigener letzter Besuch
  - Lehrkraft mit Freigabe: ohne 🌱, ohne Knöpfe
  - „Mehr dazu“ öffnet das Fach
  - keine Zeitwörter
- Gegenprobe: E3-Test mit der App von `main` rot (0 von 2).
- `npm test`: 367 bestanden. Zunächst schlugen 15 Tests fehl, weil der Knopf „Mehr dazu“ dasselbe Merkmal `data-psubj` trug wie die Fach-Kacheln. Er heißt jetzt `data-pmore`.
- Bildschirmfotos (360 px und 1100 px) mit erfundenen Daten durchgesehen.

## Gefunden
- **Doppelung für F6:** „⭐ Das gelingt“ in der Karte und „⭐ Das gelingt schon gut“ in der Einschätzung rechts nennen dieselben Quests. Vorschlag für den Schlussdurchgang: in der Einschätzung streichen oder die Einschätzung auf „Hier hilft Unterstützung“ und „Wenig Daten“ kürzen.
