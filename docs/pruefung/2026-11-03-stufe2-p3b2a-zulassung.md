# 2026-11-03 – Stufe 2, P3b-2a: Zulassung aus Ereignissen (nur Testbau)

## Auftrag
Aufgabe P3b-2, Teil a (Vault: „Aufgabe P3b-2 – Zulassung aus Ereignissen und ‚zu diesem Zeitpunkt‘“). Bisher war die Zulassung (wer gehört dazu, mit welchem öffentlichen Schlüssel und welchen Geräten) eine Eingabe von außen. Jetzt bildet jede App sie aus den unterschriebenen Ereignissen des Bereichs selbst. Vorgegeben ist nur der Gründer-Elternteil (Anker).

Damit ist Befund A aus P3b gelöst:
- Kind und Lehrkraft können die Unterschriften jetzt prüfen.
- Das Kindergerät meldet sich selbst an.

**Erfolgskriterium:** Die Lese-Matrix aus P3b läuft mit selbst gebildeter Zulassung und ergibt dasselbe wie mit der vorgegebenen.

`index.html` ist unverändert. Das neue Modul ist **nur im Testbau** (`module.json`: `zulassung` nach `abgleich`). Die Prüfung „zu diesem Zeitpunkt“ für normale Ereignisse und die Regel für Ex-Halter kommen in **2b**.

## Änderungen
- `src/module/ereignisse.mjs` (Format v1):
  - `member_added` hat jetzt die Pflichtfelder `role` (child/parent/teacher/admin) und `pub` (öffentliche Schlüssel, genau `ecdh` und `ecdsa`).
  - `key_rotated` hat jetzt die Pflichtfelder `entfernt` (Personen) und `stand` (Bündel je Gerät beim Wechsel, für 2b).
  - Neue Feldarten: `pub`, `pids`, `stand`.
- `src/module/bereiche.mjs`:
  - `member_*`, `device_*` und `key_rotated` passen in **jeden** Bereich und gelten für diesen. In `eltern:allg` bleiben nur die Freigaben.
  - `schluesselVerteilen` liefert zusätzlich `ereignisse`: `member_added` für neue Halter, `member_removed` und `key_rotated` (mit `stand` aus `speicher.list`) für entfernte. Die App unterschreibt und sendet sie.
  - `schluesselLesen` liefert zusätzlich `lesbar` (siehe Entscheidung 3).
- `src/module/annahme.mjs`: Lehrkraft und Admin dürfen ihr **eigenes** Gerät anmelden (`device_added`).
- `src/module/abgleich.mjs`: `holen` nimmt als Zulassung auch eine Funktion. Sie bekommt Protokoll und neue Einträge, sodass Mitglieder, die im selben Abruf aufgenommen werden, schon zählen.
- `src/module/zulassung.mjs` (neu, Importe aus `ereignisse`, `annahme`, `bereiche`, `abgleich`; Hilfsnamen `zul`):
  - `ZULASSUNG_TYPEN`
  - `zulassungAus(eintraege, { area, anker, now })` → `{ area, members, verworfen }`. Je Mitglied gibt es `role`, `pub`, `devices` sowie `perioden` und `geraete` mit Zeiträumen (für 2b).
  - `aktiveMitglieder(zulassung)`
  - `bereichHolen(stand, { zugang, ich, meineSchluessel, anker, now })`: Schlüssel lesen, holen, Zulassung bilden und bei neuen Mitgliedern noch einmal.
- Tests:
  - `tests/module/zulassung.test.mjs` (neu, 9 Tests)
  - `tests/module/bereiche.test.mjs`: Alle Personen lesen jetzt mit selbst gebildeter Zulassung. Beim ersten Schreiben meldet sich das Gerät an. Die Ausnahme „Kind meldet Gerät an“ ist weg.
  - Beispiele in `ereignisse.test.mjs` und `annahme.test.mjs` angepasst (Lehrkraft und Admin: `device_added`).
  - `testbau.test.mjs`: ein Browser-Test.

## Regeln der Zulassung
| Ereignis | zählt, wenn … | Wirkung |
|---|---|---|
| `member_added` | ein Elternteil, der in diesem Moment dazugehört, es von einem seiner Geräte schreibt | neuer Zeitraum mit Rolle und Schlüssel; gleiche Rolle und gleicher Schlüssel noch einmal: keine Änderung |
| `member_removed` | wie oben | Zeitraum endet, alle Geräte der Person ebenso |
| `device_added` | ein Mitglied es für **sein eigenes** Gerät schreibt (auch Kind, Lehrkraft, Admin) | Gerät gilt ab jetzt |
| `device_removed` | ein Elternteil, wie oben | Gerät endet für alle, die es hatten (geteiltes iPad) |

- Die Reihenfolge ist wie bei `mergeLog` (Zeit mit Uhrenregel, dann Kennung). Das Ergebnis hängt also nicht davon ab, in welcher Reihenfolge Ereignisse eintreffen.
- Der Anker gehört von Anfang an dazu.
- Ehemalige Mitglieder bleiben in der Liste (mit beendetem Zeitraum), damit ihre früheren Einträge gültig bleiben.

## Entscheidungen (Peter kann widersprechen)
1. **Eigenes Modul `zulassung`** statt Funktionen in `bereiche` (so stand es in der Aufgabe). `bereiche` steht vor `annahme`, die Zulassung braucht aber `annahme`. Die umgekehrte Abhängigkeit wäre ein Kreis.
2. **Mitglieder eines Bereichs = seine Schlüsselhalter.** Eine Lehrkraft mit Freigabe ist in `kind:lern` Mitglied mit Rolle `teacher`. Schreiben darf sie dort weiterhin nichts außer ihrem eigenen Gerät.
3. **Lesen mit Schlüsseln, deren Verteiler noch unbekannt ist.**
   - Problem: Ein neues Gerät kennt nur den Anker. Hat der zweite Elternteil die Schlüssel gewechselt, sind alle Schlüsseleinträge von ihm unterschrieben, und er wird erst durch Lesen bekannt.
   - Darum liefert `schluesselLesen` zusätzlich `lesbar`: auch den eigenen Eintrag, dessen Verteiler (noch) nicht bestätigt ist.
   - Zum **Lesen** ist das sicher, weil jedes Ereignis gegen die Zulassung geprüft wird, die beim Anker beginnt.
   - Zum **Schreiben** (`keys`, `aktuell`) zählen nur Einträge von Eltern, die jetzt dazugehören. Ein entfernter Elternteil kann also keine eigene Schlüsselversion unterschieben (Test).
4. **`aktiveMitglieder`** prüft die Schlüsseleinträge: Ein entfernter Elternteil zählt nicht mehr als Verteiler. Beim Entfernen wechselt der verbleibende Elternteil die Schlüssel und unterschreibt alle Einträge neu, deshalb geht dabei nichts verloren.
5. **Neuer Personenschlüssel** (z. B. nach neuem Passwort) = neuer Zeitraum mit neuem `pub`. Bis 2b prüft `annahme` mit dem **letzten** Schlüssel. Ältere Einträge, die mit dem alten Schlüssel unterschrieben sind, prüft erst 2b über die Zeiträume richtig.

## Tests (alle grün)
`tests/module/zulassung.test.mjs`:
1. **Aufbau:**
   - Mitglieder, Rollen, Schlüssel und Geräte stimmen.
   - Das zweite iPad des Kindes meldet sich an, und seine Antwort wird angenommen. Von einem nicht angemeldeten Gerät gibt es `geraet-fremd`.
2. **Anker:**
   - Das Kind nimmt jemanden auf → `rolle-darf-nicht`.
   - Ein „zweiter Gründer“ nimmt sich selbst auf → `autor-unbekannt`.
   - Ein Elternteil ohne angemeldetes Gerät → `geraet-fremd`.
   - Mit falschem Anker zählt nichts; mit einem anderen Anker zählt nur er.
3. **Zeitfolge:**
   - Wer entfernt ist, nimmt niemanden mehr auf; was er vorher tat, zählt.
   - Das Entfernen beendet auch seine Geräte; `device_removed` beendet ein Gerät.
   - Wiederaufnahme mit neuem Schlüssel ist ein neuer Zeitraum, und der alte Schlüssel unterschreibt nicht mehr.
   - Gleiche Aufnahme doppelt: kein neuer Zeitraum.
   - Zeit mehr als 24 h in der Zukunft zählt als „jetzt“.
4. **Lehrkraft:** meldet nur ihr eigenes Gerät an.
5. **Reihenfolge egal:** 15 gemischte Läufe mit Doppelten und Müll ergeben dieselbe Zulassung (E4).
6. **`holen` mit Funktion:** Das Kind, das im selben Abruf aufgenommen wird, wird angenommen; mit nur dem Anker wird seine Antwort verworfen.
7. **`bereichHolen`:**
   - Ein neues iPad kennt nur den Anker. Nach einem Schlüsselwechsel durch den zweiten Elternteil liest es trotzdem alles: Zum Schreiben hat es zunächst keinen Schlüssel, zum Lesen alle. Danach ist der zweite Elternteil bestätigt, und es gilt Version 2.
   - Ein entfernter Elternteil schiebt eine eigene Version 4 unter → wird nicht zum Schreiben benutzt; `aktuell` bleibt 3.
8. **Eingaben und Format:** Anker, Bereich, `now` und Liste sind Pflicht. `member_added` ohne bzw. mit falschem `pub` oder falscher Rolle sowie `key_rotated` mit falschem `entfernt` oder `stand` sind Formatfehler.
9. **Reinheit.**

`tests/module/bereiche.test.mjs`:
- Lese-Matrix 11 × 7 mit selbst gebildeter Zulassung, unverändert grün.
- Dazu der Vergleich selbst gebildet = vorgegeben (4 Personen × 4 Bereiche, gleiche Ereignisse).
- „Schreibrechte passen zu den Schlüsseln“ jetzt ohne Ausnahme.

Browser (Testbau, Chromium): `zulassungAus` mit Anker, Kind und Fremdem. `npm run test:module` 190/190.

## Gegenproben (alle rot)
| Gegenprobe | rote Tests |
|---|---|
| `member_added` ohne Prüfung des Schreibers | 2 |
| kein Anker nötig (Selbstaufnahme zählt) | 1 |
| `device_added` für ein fremdes Gerät | 2 |
| Zulassung hängt von der Reihenfolge ab | 1 |
| Entfernen beendet die Geräte nicht | 1 |
| ungeprüfte Schlüssel auch zum Schreiben | 2 |
| entfernte Mitglieder zählen als aktiv | 1 |
| `bereichHolen` nur eine Runde | 1 |
| `holen` gibt der Zulassung nur das alte Protokoll | 9 |
| Zulassungs-Ereignisse nur in `eltern:allg` | 15 |
| `schluesselVerteilen` liefert kein `member_added` | 8 |
| `key_rotated` ohne Stand | 1 |
| gleiche Rolle und Schlüssel → neuer Zeitraum | 1 |
| öffentliche Schlüssel im Format nicht geprüft | 1 |
| Lehrkraft darf kein Gerät anmelden | 6 |

## Offen für 2b
- **„Zu diesem Zeitpunkt“ für alle Ereignisse:**
  - `annahme` soll Zeitraum von Mitglied und Gerät prüfen und dabei den `pub` des passenden Zeitraums verwenden.
  - Heute zählen noch: Einträge eines entfernten Mitglieds nach seinem Ende (soweit seine Rolle den Typ schreiben darf) und Einträge eines entfernten Geräts.
- **Ex-Halter:** Bündel nach dem `stand` eines `key_rotated` werden verworfen, wenn ihr Autor in `entfernt` steht.
- **Holen und Ablehnen:** Ein Eintrag, den `holen` wegen `autor-unbekannt` verwirft, wird nicht noch einmal gelesen.
  - Bisher harmlos: Wer schreibt, ist im selben oder einem früheren Bündel aufgenommen worden.
  - In 2b mitprüfen, ob ein Gerät mit alter Schlüsselversion einen Eintrag vor seiner eigenen Aufnahme lesen kann.
