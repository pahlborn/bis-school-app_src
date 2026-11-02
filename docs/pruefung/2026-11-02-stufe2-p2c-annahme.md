# 2026-11-02 – Stufe 2, P2c: Modul annahme (Aufgabe 4, nur Testbau)

## Auftrag
Spezifikation S12, Phase P2 (EP7: US7.5), Konzept 6 (Rechtematrix), 7.2 und 8.5. Erfolgskriterium E10: Ein Eintrag einer Lehrkraft oder eines unbekannten Geräts wird mit Grund verworfen, gültige Ereignisse werden angenommen. Bisher prüft `checkEvent` nur das Format. Wer Schreibzugriff auf den Speicher hat, könnte also Ereignisse einschieben.

`index.html` ist unverändert. Das Modul ist **nur im Testbau** (`module.json`: `bau: test`, nach `ereignisse` und `ableitung`). Kein Netz, keine Speicherung. Die **Zulassung** (wer Mitglied ist, welche Geräte) kommt als Eingabe. Sie aus `member_*`/`device_*` zu berechnen ist Teil von EP9.

## Änderungen
- `src/module/annahme.mjs` (reine Funktionen, nutzt `signBytes`/`verifyBytes` aus `krypto` und `checkEvent` aus `ereignisse`):
  - `canonicalBytes(event, area)`: `"bq-sig1|" + Bereich + "|" + Ereignis mit sortierten Schlüsseln` (JSON ohne Leerzeichen). Der **Bereich gehört zur Unterschrift**.
  - `signEvent(event, area, myKeys)` → `{ event, sig }`. Ein ungültiges Ereignis wird nicht unterschrieben. Unterschrieben wird eine Kopie, spätere Änderungen am Eingabeobjekt erreichen sie nicht.
  - `acceptEvent(item, zulassung)` → `{ ok: true }` oder `{ ok: false, grund }`.
  - `acceptAll(items, zulassung)` → `{ angenommen, verworfen: [{ item, grund }] }`, Reihenfolge bleibt erhalten.
  - `ANNAHME_GRUENDE` (die fünf Gründe in Prüfreihenfolge) und `ANNAHME_RECHTE` (Rolle → Typen, eingefroren; für 3b, damit die App nur schreibt, was angenommen wird).
  - Alle Hilfsnamen beginnen mit `ann`/`ANN_`, weil sich Module und `index.html` in der App einen Namensraum teilen.
- `src/module/module.json`: `annahme` (Testbau, Browser-Test `testbau` = Start des Testbaus ohne Namenskonflikt).
- `tests/module/annahme.test.mjs` (neu, 12 Tests).

## Prüfreihenfolge
`format` → `autor-unbekannt` → `geraet-fremd` (Gerät gehört nicht zum Autor oder ist unbekannt) → `unterschrift` → `rolle-darf-nicht`. Der erste Fehler ist der Grund.

## Rechte je Rolle (gegen das Konzept abgeglichen)
| Typ | Kind | Elternteil | Lehrkraft | Admin | Grundlage |
|---|---|---|---|---|---|
| `answer`, `round_done`, `practice_day`, `rank_seen`, `checklist_set`, `day_flag` | ✅ | ❌ | ❌ | ❌ | 6 „Antwort, Runde, … Studio-Haken“; Tageshinweise und Titel erlebt das Kind |
| `review` | ✅ | ✅ | ❌ | ❌ | siehe Entscheidung 1 |
| `badge` | ✅ | ✅ nur `principled` | ❌ | ❌ | siehe Entscheidung 1 |
| `profile_set` | ✅ | ✅ | ❌ | ❌ | 6 „Profil … Eltern korrigieren“ |
| `sheet_created` | ✅ | ✅ | ❌ | ❌ | 6 „Übungsblatt erzeugt“ |
| `sheet_result`, `sheet_discarded` | ❌ | ✅ | ❌ | ❌ | 6 „eingetragen / korrigiert / verworfen“ |
| `setting_set` | ❌ | ✅ | ❌ | ❌ | 6, 7.2 „nur Eltern als Autor“ |
| `school_import` | ❌ | ✅ | ❌ | ❌ | 6 (Admin: Vorgabe nein) |
| `grant_set`, `grant_revoked` | ❌ | ✅ | ❌ | ❌ | 5.2, 6 |
| `grant_opened` | ❌ | ❌ | ✅ nur eigene | ✅ nur eigene | 5.2 „Geöffnet trägt die App des Empfängers ein“ |
| `member_added`, `member_removed` | ❌ | ✅ | ❌ | ❌ | 5.1 |
| `device_added` | ✅ nur das eigene Gerät | ✅ nur das eigene Gerät | ❌ | ❌ | 10.2, 10.3 (ein Gerät meldet sich selbst an) |
| `device_removed` | ❌ | ✅ | ❌ | ❌ | 6 „Kindergerät entfernen“, 10.3 |
| `key_rotated` | ❌ | ✅ | ❌ | ❌ | 8.4 |
| `snapshot` | ❌ | ✅ | ❌ | ❌ | 9.3 „ein Elternteil-Gerät“ |

„Nur eigene“: `grant_opened` nur mit `grantee` = Autor. „Nur das eigene Gerät“: `device_added` nur mit `payload.device` = Gerät des Ereignisses. Unbekannte Rollen haben keine Rechte.

## Abweichungen und Entscheidungen (Peter kann widersprechen)
1. **Eltern dürfen `review` und das Abzeichen `principled` schreiben.** Das weicht von der Rechtematrix 6 ab (Wiederholung, Abzeichen: Eltern ❌). Grund: Wenn Eltern ein Blattergebnis eintragen, schreibt die App heute eine Wiederholung (falsch → `rememberWrong`, Korrektur → zurücknehmen) und bei einem fertigen Blatt das Abzeichen `principled` (`index.html` `enterResult`). Aufgabe 3a hält das in „Was 3b schreiben muss“ fest. Ohne diese Rechte gingen diese Einträge auf allen anderen Geräten verloren. Andere Abzeichen und Antworten bleiben für Eltern gesperrt (Test).
2. **Vorschlag aus der Aufgabe, wo das Konzept anders ist:** Die Aufgabe schlug vor, dass Eltern „alles, was das Kind darf“ schreiben und das Kind `sheet_*` und eigene `device_removed`. Umgesetzt ist das Konzept: Eltern schreiben keine Antworten, Runden, Tageshinweise oder Haken. Das Kind trägt keine Blattergebnisse ein und verwirft keine Blätter (das macht in der App nur der Elternbereich). Es entfernt auch keine Geräte.
3. **Lehrkraft und Admin:** nur `grant_opened`, und nur für sich selbst (5.2). Eine absichtlich veränderte App kann das Protokoll trotzdem weglassen (ehrliche Grenze aus 5.2).
4. **Strenger Eintrag:** Ein Eintrag hat genau `event` und `sig`. Zusatzfelder gelten als `format`, denn sie wären nicht unterschrieben.
5. **Fehlende oder kaputte Zulassung bzw. keine Liste:** Die Funktion bricht mit einer Fehlermeldung ab (Programmfehler). Sie verwirft nicht still.
6. **Fremde Eigenschaften:** Rollen und Autoren werden nur als eigene Eigenschaften gelesen. `p_constructor` ist kein Mitglied, die Rolle `toString` hat keine Rechte.

## Befunde für die nächsten Aufgaben (nicht geändert)
- **Zeitpunkt:** Das Konzept fragt: „Darf der Autor **zu diesem Zeitpunkt** …?“ Hier gilt die übergebene Zulassung, also der heutige Stand. Ein Elternteil, der entfernt wurde, oder eine abgelaufene Freigabe muss die Zulassung abbilden (EP9). Ebenso, ob eine Lehrkraft überhaupt eine aktive Freigabe hat.
- **Neues Gerät:** `device_added` stammt vom neuen Gerät selbst. Die Zulassung muss dieses Gerät beim Prüfen schon kennen, sonst gilt `geraet-fremd`. EP9 muss die Selbstanmeldung (Autor bekannt, Unterschrift gültig, `payload.device` = Gerät) beim Berechnen der Zulassung zuerst gelten lassen.
- **Bereichsart:** Es wird nicht geprüft, ob ein Typ zum Bereich passt (z. B. `school_import` nur im Eltern-Bereich). Das ist möglich, sobald die Bereichsnamen festliegen (P3a/EP9).
- **Gleiche Bytefolge in der App-Store-Fassung (Stufe 3):** CryptoKit muss dieselbe Bytefolge bilden: sortierte Schlüssel und JSON-Zahlen wie in JavaScript. Ein fester Prüfwert lohnt sich, sobald Swift dazukommt.
- **Formatänderungen aus 3a** (`attempt` 0, `sheet_result` mit `day`/`qid`, `badge` mit `skill`) sind eingemergt. Die Beispielnutzlast im Test ist angepasst.

## Tests
`tests/module/annahme.test.mjs` (12 Tests, ca. 0,2 s; Familie aus Kind, Elternteil, zweitem Elternteil mit zwei Geräten, Lehrkraft und Admin mit echten Schlüsseln):
1. **Annehmen:** alle 29 erlaubten Paare aus Rolle und Typ. Der zweite Elternteil schreibt von seinem zweiten Gerät.
2. **E10:** Lehrkraft schreibt `answer` → `rolle-darf-nicht` (auch Admin, auch `setting_set`). Kind von einem Elterngerät bzw. unbekanntem Gerät → `geraet-fremd`. Fremde Person mit gültigen eigenen Schlüsseln → `autor-unbekannt` (auch `p_constructor`, `p_toString`, `p_hasOwnProperty`).
3. **Nur für sich selbst:** fremdes Gerät anmelden, „angesehen“ für jemand anderen, Eltern fälschen „angesehen“, Kind entfernt ein Gerät, Eltern vergeben andere Abzeichen oder antworten, unbekannte Rolle, Rolle `toString`.
4. **Unterschrift:** mit dem Elternschlüssel im Namen des Kindes, fremder Schlüssel. Sieben einzelne Änderungen nach dem Unterschreiben (Ergebnis, Stufe, ein Zeichen der Frage, eine Millisekunde, Typ, `id`, ein zusätzliches erlaubtes Feld). Ein Bit der Unterschrift. Unterschrift fehlt, ist leer, kurz, eine Zahl oder kein Base64. Unterschrift eines anderen Ereignisses. Unterschrift ohne die feste Bytefolge. Mitglied ohne öffentlichen Schlüssel.
5. **Bereich:** dasselbe Ereignis in vier anderen Bereichen (auch mit Leerzeichen am Ende oder anderer Groß- und Kleinschreibung). Für einen anderen Bereich unterschrieben: hier verworfen, dort angenommen.
6. **Bytefolge:** unabhängig von der Schlüsselreihenfolge, sortiert, ohne Leerzeichen. Ein anderer Bereich oder Inhalt ergibt andere Bytes. Ohne Bereich bricht sie ab.
7. **Matrix:** alle 23 Typen × 4 Rollen gegen eine im Test ausgeschriebene Tabelle. Die exportierte Tabelle stimmt damit überein und ist eingefroren.
8. **Gründe:** Bei mehreren Fehlern gewinnt die feste Reihenfolge, in vier gestuften Fällen. Neun kaputte Einträge ergeben `format`.
9. **`acceptAll`:** neun gemischte Einträge, drei angenommen, sechs verworfen mit dem jeweils richtigen Grund. Die Reihenfolge bleibt, nichts geht verloren, die Eingabe bleibt unverändert. Leere Liste geht, „keine Liste“ bricht ab.
10. **Zulassung kaputt** (sechs Formen) → Abbruch in `acceptEvent` und `acceptAll`.
11. **`signEvent`:** Kopie, Base64, Ungültiges wird nicht unterschrieben, ein leerer Bereich bricht ab.
12. **Reinheit:** kein Zufall, keine Uhr, kein Speicher, kein Netz. Alle Namen auf oberster Ebene sind exportiert oder beginnen mit `ann`.

Der Testbau-Start (`tests/testbau.test.mjs`, volle Reihe) zeigt: kein Namenskonflikt im gemeinsamen Namensraum.

## Gegenproben
Je ein absichtlicher Fehler im Modul, danach muss der Modultest rot werden. Die sechs aus der Aufgabe und 15 weitere: **alle 21 rot**, jeweils an der passenden Stelle (kein Syntaxfehler).

| Gruppe | Fehler (alle rot) |
|---|---|
| aus der Aufgabe | Unterschrift nicht prüfen · Rolle nicht prüfen · Gerät nicht prüfen · Bereich nicht in der Unterschrift · Lehrkraft darf `answer` · Verworfene ohne Grund (`acceptAll`) · Verworfene ohne Grund (`acceptEvent`) |
| Rechte | Eltern dürfen `answer` · Eltern dürfen jedes Abzeichen · Eltern ohne `review` (Blatt-Eintrag ginge verloren) · Kind darf Gerät entfernen · Bedingung „nur für sich selbst“ fehlt · Rollenname ohne Eigenschaftsprüfung |
| Format und Eingaben | Format nicht geprüft · Zusatzfelder am Eintrag erlaubt · Zulassung nicht geprüft · `acceptAll` behandelt „keine Liste“ als leer |
| Unterschreiben | Bytefolge ohne Sortierung · `signEvent` ohne Kopie · `signEvent` unterschreibt Ungültiges |
| Reihenfolge | Rolle vor Unterschrift geprüft |

## Zeiten
| Prüfung | Dauer |
|---|---|
| `tests/module/annahme.test.mjs` (12 Tests) | 0,2 s |
| `npm run test:module` (78 Tests) | 1,6 s |
| volle Reihe (320 Tests, alle grün, auf dem Stand mit 3a und Elternbereich B1–B3) | 207 s |

Live-Bau: Die SHA-256 der Live-App von `main` (nach #65) und von diesem Zweig sind identisch (`185e999c…a982a`, Index-Form mit LF). `index.html` ist unverändert. Der Live-Bau enthält das Modul nicht, der Testbau schon.
