# Sprachaufnahme im Lese-Studio (30.10.2026)

Vorgabe Peter: Eine echte Sprachaufnahme, die man anhören, speichern und z. B. nach Toddle hochladen kann. Mikrofon dafür erlaubt.

## Umgesetzt

- Lese-Studio: Bereich „🎙️ Meine Leseaufnahme“ mit „● Aufnahme starten“ / „■ Stopp“ und laufender Zeit (höchstens 5 Minuten). Die Stoppuhr entfällt dort (Pantastic behält sie).
- Nach „Stopp“: Aufnahme mit Datum und Dauer, Abspielen direkt in der App, „⤴ Teilen / Sichern“ (iPad/Handy: Teilen-Menü, z. B. an die Toddle-App oder „Dateien“; sonst Download als Datei „Leseaufnahme JJJJ-MM-TT HH-MM.m4a/webm“), „🗑 Löschen“ mit Rückfrage.
- Speicher nur auf dem Gerät (IndexedDB `bq2_audio`), die letzten 3 Aufnahmen. Die App verschickt nichts.
- Mikrofon erst nach dem Tipp, Freigabe sofort nach „Stopp“. Verlassen des Studios oder Wechsel in den Hintergrund beendet und speichert die Aufnahme. Verweigertes Mikrofon → freundlicher Hinweis. Ohne Unterstützung im Browser → Hinweis, direkt auf der Lernplattform aufzunehmen.
- Datenschutz-Seite (DE/EN) um einen Absatz zu Leseaufnahmen ergänzt. Checkliste: letzter Punkt „Aufgenommen, angehört und auf die Lernplattform hochgeladen“.

## Prüfung

- Neu `tests/aufnahme.test.mjs` (6 Tests, Chromium mit simuliertem Mikrofon, echte Klicks): Aufnahme gespeichert und abspielbar, Mikrofon erst nach Tipp und danach freigegeben, keine Netzanfragen; nur die neuesten 3; Löschen; bleibt nach Neuladen; Sichern als Datei; Verlassen speichert; verweigertes Mikrofon.
- Angepasst: `spass.test.mjs` (Lese-Studio ohne Stoppuhr, Mikrofon nicht beim Öffnen; Pantastic-Stoppuhr).
- Gegenproben (alle rot): Mikrofon nicht freigegeben; keine Begrenzung auf 3; Verlassen beendet Aufnahme nicht.
- `npm test`: 144 bestanden.
