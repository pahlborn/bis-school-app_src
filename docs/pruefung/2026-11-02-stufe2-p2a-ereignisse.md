# 2026-11-02 – Stufe 2, P2a: Modul ereignisse (nur Testbau)

## Auftrag
Spezifikation S12, Phase P2 (EP7: US7.1, US7.3, US7.4), Konzept 9.1 und 9.2: ein festes **Ereignisformat v1** und reine Regeln zum **Zusammenführen** – als Modul, ohne Browser testbar. Erfolgskriterium E4: zwei Geräte mit je 50 Antworten ergeben nach dem Abgleich 100, keine doppelt; das Ergebnis hängt nicht von Reihenfolge und Wiederholung ab.

`index.html` ist unverändert. Das Modul ist **nur im Testbau** (`module.json`: `bau: test`, nach `krypto`). Keine Speicherung, keine Verschlüsselung oder Unterschrift, kein Netz, kein Schnappschuss, keine Abbildung der heutigen Speicherstellen (eigene Aufgaben).

## Änderungen
- `src/module/ereignisse.mjs` (reine Funktionen; Uhr und Zufall werden übergeben):
  - `EVENT_VERSION = 1`, `EVENT_FUTURE_MS` (24 h), `EVENT_TYPES` (die 23 Typen aus 9.1, in Konzeptreihenfolge), `PAYLOAD_FIELDS` (Pflichtfelder je Typ), `PAYLOAD_OPTIONAL`.
  - `newEvent({type, author, device, payload, at}, {rand})`: baut `{id, v, type, at, author, device, payload}`, `id` = `e_` + 24 Hexzeichen aus `rand(12)`, die Nutzlast wird kopiert.
  - `checkEvent(e)`: Liste der Fehler mit Feldname, leer = gültig.
  - `effectiveTime(at, now)`: Millisekunden; liegt `at` mehr als 24 h nach `now`, gilt `now`.
  - `mergeLog(logs, now)` → `{ events, conflicts, invalid }`.
  - `fieldKey(e)` (z. B. `profile_set:name`, `checklist_set:grow:0`, `rank_seen`; sonst `null`) und `lastWins(events, now)` → `{ feldschlüssel: Ereignis }`.
  - Alle Hilfsnamen beginnen mit `ev`/`EV_`: Module und `index.html` teilen sich in der App einen Namensraum (Prüfung durch den Testbau-Start).
- `src/module/module.json`: `ereignisse` (Testbau) mit dem Browser-Test `testbau`.
- `tests/module/ereignisse.test.mjs` (neu, 21 Tests), `tests/testbau.test.mjs` (+1 Browser-Test), `tests/module/rahmen.test.mjs` (Live-Bau enthält auch `mergeLog` und `lastWins` nicht).

## Das Format v1 (Nutzlast je Typ)
Aus den heutigen Speicherstellen (`werkzeug/speicherstellen.json`, Konzept 7.2) abgeleitet und knapp gehalten. Pflichtfelder / optional:

| Typ | Pflichtfelder | optional |
|---|---|---|
| `answer` | `day`, `skill`, `level` (1–3), `attempt`, `ok`, `qid` | `family` (auch null), `response`, `help`, `example`, `hintShown`, `exampleShown`, `solutionShown`, `beforeTry`, `sheet` |
| `round_done` | `day`, `skill`, `stars`, `count` | |
| `badge` | `day`, `badge` | |
| `review` | `day`, `qid`, `box` | `dueAt`, `question` |
| `practice_day` | `day` | |
| `profile_set` | `field` (`name`/`birthday`/`emoji`/`kidLang`), `value` (auch null = löschen) | |
| `rank_seen` | `rank` | |
| `sheet_created` | `sheet`, `day`, `no`, `writing` (`de`/`en`), `items` | |
| `sheet_result` | `sheet`, `index`, `res` (`ok`/`no`/`help`) | |
| `sheet_discarded` | `sheet` | |
| `setting_set` | `setting` (`focusMode`/`focusManual`/`unlocked`/`storyCap`), `value` | |
| `checklist_set` | `studio`, `index`, `value` | |
| `day_flag` | `flag` (`greetDay`/`mysteryDone`/`bdayParty`), `day` | |
| `school_import` | `asOf`, `data` | `source` |
| `grant_set` | `grant`, `grantee` (`p_…`), `scope` (`learning`/`school`), `from`, `until` | `text` |
| `grant_revoked` | `grant`, `grantee` | |
| `grant_opened` | `grant`, `grantee` | `scope` |
| `member_added` | `person` | `role` |
| `member_removed` | `person` | |
| `device_added` | `device` (`d_…`) | `label` |
| `device_removed` | `device` | |
| `key_rotated` | `version` | |
| `snapshot` | `upTo` (UTC), `count`, `state` | |

Zu `answer`: so, wie die App heute einen Versuch speichert (`index.html`, `attempts`; alle fünf Formen mit `qid` sind gültig). Die Typen `member_*`, `device_*`, `key_rotated` und `snapshot` sind im Konzept nur dem Namen nach festgelegt; ihre Nutzlast ist hier ein **Vorschlag**, den die Aufgaben 4, 5 und P3 schärfen.

## Abweichungen und Entscheidungen (Peter kann widersprechen)
1. **Strenge Prüfung:** Unbekannte Felder am Ereignis oder in der Nutzlast sind Fehler (Format v1 ist fest; so schleicht sich nichts ein, z. B. ein Klartextname). Ein späteres Feld (z. B. Unterschrift) braucht eine bewusste Änderung am Modul.
2. **Zeit:** UTC `YYYY-MM-DDTHH:MM:SSZ`; **zusätzlich** sind 1–3 Nachkommastellen erlaubt (Millisekunden). Grund: zwei Ereignisse desselben Geräts in derselben Sekunde würden sonst nach der zufälligen `id` sortiert, nicht in der Reihenfolge des Entstehens. Verglichen wird immer als Zahl, nicht als Text. Nicht-existierende Zeiten (30. Februar, Stunde 24) und Zeitzonen-Angaben werden abgelehnt.
3. **`mergeLog` meldet mehr, als verlangt:** `invalid` (Ereignisse, die `checkEvent` nicht bestehen, werden nicht vereinigt, aber gemeldet – nichts verschwindet still) und `conflicts` (gleiche `id`, anderer Inhalt: `{ id, kept, rejected }`). Bei einem Konflikt bleibt die Fassung mit dem kleineren kanonischen Text; so behält jedes Gerät dieselbe, unabhängig von der Reihenfolge. Welche Fassung zu Recht besteht, entscheidet erst die Unterschriftenprüfung (Aufgabe 4).
4. **Sortierung nach wirksamer Zeit** (nach der 24-Stunden-Regel), bei Gleichstand nach `id`. Die gespeicherte Zeit des Ereignisses wird nie verändert.
5. **`lastWins` überspringt ungültige Ereignisse** (sie gewinnen nie).
6. **`checkEvent` prüft Format, keine Rechte** (wer darf welchen Typ schreiben, z. B. Einstellungen nur Eltern): Aufgabe 4.

## Befunde für die nächsten Aufgaben (nicht geändert)
- **Blatt-Einträge in `attempts` haben keine `qid`** (`index.html`: `sheet:key` beim Eintragen eines Ergebnisses; in den Tests fehlt sie auch in den Beispielen). Sie sind deshalb keine `answer`; Aufgabe 3 bildet sie als `sheet_result` (Blatt, Nummer, Ergebnis) ab. Ein Test hält fest, dass eine `answer` ohne `qid` abgelehnt wird.
- **`rank_seen`** ist in 7.2 „letzte gilt (Maximum)“. `lastWins` nimmt den jüngsten Wert; der Titel steigt nur, daher gleich. Für den abgeleiteten Wert in Aufgabe 3 bleibt „Maximum“ der sicherere Weg.
- **Gleiche Sekunde:** Die App sollte `at` mit Millisekunden schreiben (siehe 2.), sonst entscheidet bei „Letzte gilt“ innerhalb einer Sekunde die zufällige `id`.

## Bekanntes Restrisiko (festgehalten, nicht gelöst)
Nach 9.2 gilt ein Zeitpunkt mehr als 24 h voraus beim Zusammenführen als „jetzt“. Ein Wert von einer um 3 Tage vorgestellten Uhr gewinnt dadurch bis zu 3 Tage lang gegen echte, spätere Werte: beim ersten Abgleich als „jetzt“, danach mit seiner eigenen Zeit, bis die echte Zeit sie eingeholt hat. Der Test „Restrisiko“ hält das fest (Abgleich nach 2 Stunden, nach 2 Tagen 1 Stunde: falscher Wert gewinnt; erst ein echter Wert nach Ablauf der 3 Tage gewinnt wieder). Verbesserung für später: „erstmals gesehen“ je Ereignis merken und daran messen.

## Tests
- `tests/module/ereignisse.test.mjs` (21 Tests, ca. 1 s, davon `Rechengesetze` 0,7 s):
  1. **US7.1:** je Typ (23) ein gültiges Ereignis; jedes Pflichtfeld jedes Typs einzeln entfernt (54 Fälle); 49 kaputte Fälle mit Grund (Version, Typ, `id`-Formen, Zeit in 9 Formen, Autor ohne `p_`, Gerät ohne `d_`, Nutzlast, Zusatzfelder, falsche Werte); gültige Sonderfälle (Millisekunden, `family` null, die fünf heutigen Versuchsformen, `profile_set` mit null).
  2. **E4 / US7.3:** Gerät A und B je 50 `answer`, offline erzeugt: 100, 0 doppelt, 0 verloren, in beiden Richtungen; vier Runden weiter schreiben und abgleichen (bis 140); 20 gemeinsame + je 30 eigene = 80.
  3. **Reihenfolge:** nach Zeit, bei Gleichstand nach `id`; 200 gemischte Läufe (zufällige Aufteilung, doppelte Ereignisse, umgedrehte Listen) mit festem Startwert ergeben immer dasselbe.
  4. **Rechengesetze:** vertauschbar, zusammenfassbar, wiederholbar (100 zufällige Mengen, auch mit Zeiten aus der Zukunft).
  5. **US7.4:** jüngster gewinnt; Gleichstand → größere Gerätekennung → größere `id`; Felder unabhängig (auch je Haken der Checkliste); Protokoll-Ereignisse und ungültige bleiben aussen vor; 100 gemischte Eingabereihenfolgen; beide Geräte entscheiden gleich.
  6. **Uhr:** 3 Tage voraus = „jetzt“; 23 h voraus und genau 24 h echt; 24 h + 1 s = „jetzt“; Sortierung und „Letzte gilt“ nutzen dieselbe Regel; gespeicherte Zeit bleibt.
  7. **Konflikt:** gleiche `id`, anderer Inhalt: gemeldet, beide Fassungen im Bericht, reihenfolgeunabhängig; gleicher Inhalt in anderer Schlüsselreihenfolge ist keiner.
  Dazu: Eingaben werden nicht verändert; leere/fehlende Listen; Größenordnung 2 × 5 000 Ereignisse (52 ms in Node); kein `Math.random`, `Date.now`, `new Date()` ohne Argument und kein Zugriff auf Speicher/Anzeige im Modul.
- `tests/testbau.test.mjs`: Der Testbau startet mit dem neuen Modul ohne Fehler (kein Namenskonflikt) und ein Browser-Test prüft in Chromium E4 (100/100), Reihenfolgeunabhängigkeit, „Letzte gilt“, die Uhrenregel und die Ablehnung von Zeitzone und 30. Februar. Safari folgt im Feldtest.
- Live-Bau byte-gleich zu `main` (Prüfsumme bei den Zeiten); `rahmen` bleibt grün.

## Gegenproben
Je ein absichtlicher Fehler im Modul; das Modulfeld muss rot werden. Die sechs aus der Aufgabe plus 21 weitere – **alle 27 beim ersten Anlauf rot**, jeweils an der passenden Stelle (kein Syntaxfehler im Fehlerfall):

| Fehler | Ergebnis |
|---|---|
| Doppelte nicht entfernen | rot |
| Gleichstand umdrehen (kleinere Gerätekennung gewinnt) | rot |
| Zeitgrenze entfernen | rot |
| Sortierung ohne `id` | rot |
| unbekannten Typ zulassen | rot |
| „Letzte gilt“ nimmt den ältesten | rot |
| Gleichstand: kleinere `id` gewinnt | rot |
| genau 24 h schon „jetzt“ | rot |
| Sortierung nach Rohzeit statt wirksamer Zeit | rot |
| Konflikt nicht gemeldet | rot |
| Konflikt: erste Fassung statt kleinster (reihenfolgeabhängig) | rot |
| Zeit mit Zeitzone erlaubt | rot |
| Zeit: 30. Februar erlaubt | rot |
| fehlendes Pflichtfeld nicht gemeldet | rot |
| unbekanntes Feld in der Nutzlast erlaubt | rot |
| Autor ohne `p_` erlaubt | rot |
| Gerät ohne `d_` erlaubt | rot |
| `id`-Format nicht geprüft | rot |
| Version nicht geprüft | rot |
| zusätzliches Feld am Ereignis erlaubt | rot |
| `newEvent` kopiert die Nutzlast nicht | rot |
| `newEvent`: `id` mit 11 statt 12 Bytes | rot |
| Feldschlüssel der Checkliste ohne Haken-Nummer | rot |
| ungültige Ereignisse werden doch vereinigt | rot |
| „Letzte gilt“ prüft Gültigkeit nicht | rot |
| Stufe 4 erlaubt | rot |
| Freigabe-Umfang beliebig | rot |

Im Browser-Test zusätzlich rot bei: Zeitgrenze entfernen, Gleichstand umdrehen, Zeit mit Zeitzone erlaubt.

## Zeiten
| Prüfung | Dauer |
|---|---|
| `npm run test:module` (48 Tests) | 1,9 s |
| Bereich `ereignisse` (Module + 2 Browser-Tests, gesamt mit Start) | 3,6 s |
| mergeLog 2 × 5 000 Ereignisse (Node, dieser Rechner) | 52 ms |
| volle Reihe (282 Tests, alle grün) | 164 s |

Live-Bau: SHA-256 der Live-App von `main` (nach #60) und von diesem Zweig sind identisch (`bd415f0c…44f8f2`).
