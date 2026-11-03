# 2026-11-03 – Stufe 2, P3b-2b: „Zu diesem Zeitpunkt“ und Ex-Halter (nur Testbau)

## Auftrag
Aufgabe P3b-2, Teil b. Konzept 6 verlangt: „Darf der Autor **zu diesem Zeitpunkt** dieses Ereignis schreiben?“ Bisher zählten Einträge eines entfernten Mitglieds oder Geräts weiter. Außerdem konnte ein Ex-Halter nach einem Schlüsselwechsel mit der alten Version noch Einträge ablegen (Befund B aus P3b). Beides ist jetzt geschlossen.

`index.html` ist unverändert, und es gibt kein neues Modul (Änderungen in `annahme`, `abgleich`, `zulassung`).

## Änderungen
- `src/module/annahme.mjs`:
  - Trägt ein Mitglied Zeiträume (`perioden`, `geraete`, von `zulassungAus`), prüft `acceptEvent` zur Zeit des Ereignisses. Es nimmt die wirksame Zeit nach der Uhrenregel; die Zulassung muss dafür `now` tragen, sonst ist es ein Programmfehler.
  - Geprüft wird:
    1. Gehört der Autor dazu?
    2. Ist das Gerät für ihn angemeldet?
    3. Unterschrift mit dem Schlüssel **dieses** Zeitraums.
    4. Rolle **dieses** Zeitraums.
  - Neue Gründe: `nicht-mitglied` und `geraet-nicht-angemeldet`.
  - Reihenfolge: `format` → `autor-unbekannt` → `nicht-mitglied` → `geraet-fremd` → `geraet-nicht-angemeldet` → `unterschrift` → `bereich-falsch` → `rolle-darf-nicht`.
  - Eine Zulassung ohne Zeiträume (alte Form, von Hand) prüft wie bisher.
- `src/module/abgleich.mjs`: `holen` verwirft Einträge mit dem neuen Grund **`nach-entfernung`**, wenn drei Dinge zusammenkommen:
  - Das Bündel stammt von einer Person, die ein angenommenes `key_rotated` unter `entfernt` nennt.
  - Seine Schlüsselversion ist älter als die neue.
  - Seine Nummer liegt über dem `stand` dieses Geräts beim Wechsel.

  Die Zeit im Ereignis spielt keine Rolle, weil ein Ex-Halter sie zurückdatieren kann.
- `src/module/zulassung.mjs`: Das Ergebnis trägt `now`.
- Tests: `tests/module/zulassung.test.mjs` (+3 Tests, jetzt 12). Die Gründe-Liste in `annahme.test.mjs` ist angepasst.

## Entscheidungen (Peter kann widersprechen)
1. **Die Grenze gehört zum neuen Zustand:**
   - Ein Ereignis genau zur Zeit der Aufnahme oder Geräteanmeldung zählt.
   - Ein Ereignis genau zur Zeit des Entfernens zählt nicht.
2. **Wer wieder aufgenommen wird, meldet sein Gerät neu an.** Das Entfernen beendet auch seine Geräte (schon so in 2a).
3. **Abweichung von der Aufgabe – späte, echte Bündel eines Ex-Halters zählen nicht:**
   - Die Aufgabe wollte, dass ein echtes „geöffnet“ aus der Freigabezeit angenommen wird, wenn es erst nach dem Wechsel eintrifft (Gerät war offline).
   - Das ist von einem rückdatierten Eintrag nicht zu unterscheiden: gleiche Person, gleiche alte Schlüsselversion, Zeit vor dem Ende, Bündel nach dem Wechsel.
   - Sicherheit geht vor; beide werden verworfen (`nach-entfernung`, Test).
   - Folge: Höchstens ein Protokolleintrag „geöffnet“ einer Lehrkraft, die bis zum Ende offline war, fehlt.
   - Einträge, die vor dem Wechsel im Speicher lagen, bleiben gültig.
4. Die Regel greift nur bei **älterer** Schlüsselversion. Wird die Person wieder aufgenommen (z. B. Freigabe verlängert), zählen ihre neuen Bündel mit der neuen Version (Test).

## Tests (alle grün)
- **Zeitpunkt** (15 Fälle):
  - vor der Aufnahme, genau bei der Aufnahme (Gerät noch nicht angemeldet), genau bei der Geräteanmeldung, kurz vor dem Entfernen, genau beim Entfernen, danach
  - zweites iPad vor seiner Anmeldung, angemeldet, nach dem Entfernen; erstes iPad bleibt; nie angemeldetes Gerät
  - Anker ohne Gerät
  - Uhrenregel: unter 24 h voraus zählt wie geschrieben; mehr als 24 h voraus zählt als „jetzt“ – da war die Person noch nicht dabei
  - Zulassung mit Zeiträumen ohne `now` → Fehler
- **Neuer Schlüssel und Rolle je Zeitraum:**
  - alter Schlüssel im alten Zeitraum ok, im neuen `unterschrift`
  - neuer Schlüssel im alten Zeitraum `unterschrift`, im neuen ok
  - dazwischen `nicht-mitglied`
  - wieder dabei, aber Gerät nicht neu angemeldet → `geraet-nicht-angemeldet`
  - Rollenwechsel Kind → Elternteil: Antworten danach `rolle-darf-nicht`
- **Ex-Halter (E6) über Speicher und Abgleich:**
  1. Die Lehrkraft schreibt „geöffnet“ (Bündel 1).
  2. Die Freigabe läuft ab → Wechsel mit `stand { d_e1: 1, d_l1: 1 }`.
  3. Danach legt sie mit Version 1 einen rückdatierten und einen echten späten Eintrag ab (Bündel 2) → beide `nach-entfernung`.
  4. Verlängerung: Sie meldet ihr Gerät neu an und schreibt mit Version 2 (Bündel 3) → angenommen; Bündel 1 bleibt angenommen.
  5. Gelesen hat ein zweiter Elternteil, frisch und nur mit dem Anker.
- Die P3b-Lese-Matrix und alle Tests aus 2a laufen mit der Zeitprüfung unverändert grün.
- `npm run test:module` 193/193.

## Gegenproben (alle rot)
| Gegenprobe | rote Tests |
|---|---|
| Zeitraum des Mitglieds ignoriert | 2 |
| Zeitraum des Geräts ignoriert | 2 |
| Grenze gehört zum alten Zustand | 1 |
| Uhrenregel weg | 1 (erst grün; dafür sind die zwei Fälle mit Aufnahme 12 h voraus dazugekommen) |
| immer der letzte Schlüssel statt des Zeitraums | 1 |
| immer die letzte Rolle statt des Zeitraums | 1 |
| `stand` aus `key_rotated` ignoriert | 1 |
| auch neue Version nach erneuter Aufnahme verwerfen | 1 |
| Stand-Grenze eingeschlossen | 1 |
| Zulassung ohne `now` (Zeitprüfung fällt still weg) | 8 |

## Restrisiko und offene Punkte
- **Kurzes Fenster beim Wechsel:**
  - Liest ein Gerät das Bündel eines Ex-Halters, bevor das Bündel mit `key_rotated` im Speicher liegt, steht der Eintrag schon im Protokoll; er wird nicht nachträglich entfernt.
  - Das Fenster sind die Sekunden zwischen dem Lesen des Stands und dem Senden des Wechsels durch den Elternteil.
  - Vorschlag für die App: den Wechsel sofort senden.
- **Gerät verloren (US9.7):**
  - `entfernt` nennt bisher Personen.
  - Bei einem verlorenen Gerät hilft nur ein neuer Personenschlüssel (Konzept 8.4). Danach sind rückdatierte Einträge mit dem alten Schlüssel durch die Zeiträume abgedeckt, solange die Uhrzeit nicht vor dem neuen Zeitraum liegt.
  - Ein rückdatierter Eintrag aus der Zeit davor wäre nur über `stand` je Gerät zu fangen. Vorschlag für US9.7: `entfernt` darf auch Geräte nennen.
- Damit ist P3b-2 abgeschlossen. **M3** (mehrere Geräte gleichen in der Simulation ab, mit Rechten und Schlüsseln) ist aus Sicht dieser Reihe erreicht.
