# 2026-11-03 – Stufe 2, P3a-2: Abgleich eines Geräts (nur Testbau)

## Auftrag
Spezifikation S12, Phase P3 (US8.1, zweiter Teil), Konzept 9.1, 9.2, 9.4 und 11. Alle Bausteine gab es einzeln (Ereignis, Unterschrift, Verschlüsselung, Speicher, Zusammenführen); es fehlte der Ablauf, der sie verbindet: eigene Ereignisse sicher hinausschicken, fremde holen, prüfen und einordnen – auch bei Netzabbruch, Schlüsselwechsel und gefälschten Einträgen.

`index.html` ist unverändert. Das Modul ist **nur im Testbau** (`module.json`: `bau: test`, nach `speicher`). Schlüssel und Zulassung kommen als **Eingabe** (aus dem Speicher lesen und aus `member_*`/`device_*` berechnen: P3b/EP9). Keine Zeitsteuerung, keine Anzeige, kein GitHub, kein Schnappschuss.

## Änderungen
- `src/module/abgleich.mjs` (neu; Importe nur aus `krypto`, `ereignisse`, `annahme`; kein Netz, kein Browser-Speicher, kein Zeitgeber):
  - `ABGLEICH_BUENDEL_MAX = 100`, `ABGLEICH_GRUENDE` (`entschluesseln`, `eintrag-passt-nicht` und die Gründe aus `annahme`).
  - `abgleichStand(bereich, geraet)` → leerer Gerätestand (reines JSON).
  - `vormerken(stand, eintrag, { now })` → eigenes, unterschriebenes Ereignis in den Ausgang **und** ins eigene Protokoll.
  - `senden(stand, { zugang, schluessel })` → `{ gesendet }`.
  - `holen(stand, { zugang, schluessel, zulassung, now })` → `{ neu, verworfen: [{ kennung, id, grund }], wartend }`.
  - `abgleichen(stand, opts)` → erst senden, dann holen → `{ ok, fehler, gesendet, neu, verworfen, wartend }`.
  - Alle Hilfsnamen beginnen mit `abg`/`ABG_` (gemeinsamer Namensraum in der App).
- `tests/module/abgleich.test.mjs` (neu, 11 Tests, gegen `lokalerSpeicher`).
- `src/module/module.json`: `abgleich` (Testbau, Browser-Test `testbau` = Start des Testbaus ohne Namenskonflikt).
- `docs/pruefung/2026-11-02-stufe2-p3a-speicher.md`: Entscheidungen 1–6 als „von Peter bestätigt am 03.11.“ vermerkt.

## Gerätestand und Bündel
Gerätestand je Bereich: `{ bereich, geraet, ausgang, unterwegs, naechsteNr, merker, wartend, log }` – wie in der Aufgabe. Ein Eintrag ist `{ event, sig }` aus `annahme.signEvent`.

Bündel (Inhalt für `put`): `{ v: 1, kv, eintraege: [{ id, iv, ct }] }`; jeder Eintrag ist ein mit `sealEntry` verschlüsseltes `{ event, sig }`, Zusatzdaten `entryAad(bereich, kv, id)`, `id` = Ereignis-Kennung.

## Die Regeln und wo sie umgesetzt sind
| Regel | Umsetzung |
|---|---|
| 1 Nichts geht verloren | Bündel wird einmal vorbereitet und als `unterwegs` gemerkt; erst nach bestätigtem `put` verlässt es den Ausgang. |
| 2 Verlorene Antwort | Wiederholung schickt dasselbe `unterwegs` (gleiche Bytes); `vorhanden` mit `gleicherInhalt` = angekommen. |
| 3 Nummer belegt, anderer Inhalt | nie überschreiben: eigene Bündel per `list` zählen, weiter mit der nächsten freien Nummer (dasselbe vorbereitete Bündel, nur neue Nummer). Die fremden eigenen Bündel kommen nach `wartend` (siehe Entscheidung 2). |
| 4 Offline | `senden`/`holen` werfen den Speicherfehler (`offline`); `abgleichen` meldet ihn als `{ ok: false, fehler: 'offline' }`. `holen` liest erst alles und schreibt dann in einem Schritt – ein Abbruch ändert nichts. |
| 5 Fehlender Schlüssel | Bündel → `wartend`, beim nächsten `holen` erneut versucht; der Merker darf weiter. |
| 6 Kaputt oder gefälscht | je Eintrag: nicht entschlüsselbar → `entschluesseln`; Eintrag-Kennung ≠ Ereignis-Kennung → `eintrag-passt-nicht`; sonst `annahme.acceptAll` mit deren Grund. Die übrigen Einträge desselben Bündels zählen. |
| 7 Eigene Bündel | werden übersprungen, solange ihre Nummer kleiner als `naechsteNr` ist (= dieser Stand hat sie selbst geschrieben); ein leerer Stand liest sie. |

## Abweichungen und Entscheidungen (Peter kann widersprechen)
1. **`vormerken` hat eine Uhr (`{ now }`).** Die Reihenfolge des Protokolls hängt an der Uhrenregel aus `ereignisse` (mehr als 24 h voraus = „jetzt“). Ohne Angabe gilt die echte Zeit. `holen` ordnet ohnehin das ganze Protokoll neu.
2. **Alte Sicherung vollständig abgedeckt.** Regel 7 sagt „eigene Bündel überspringen“. Nach dem Zurückspielen einer alten Sicherung gibt es aber eigene Bündel, die *dieser* Stand nicht kennt (geschrieben nach der Sicherung). Darum: eigene Bündel mit Nummer ≥ `naechsteNr` werden gelesen (und `naechsteNr` rückt nach), und bei Regel 3 kommen die unbekannten eigenen Bündel nach `wartend`. So gehen auch Ereignisse aus der Zeit nach der Sicherung nicht verloren (Test 4, beide Fälle). Der leere Stand (Regel 7) ist davon der Sonderfall `naechsteNr = 1`.
3. **Ein kaputtes Bündel** (kein `{ v: 1, kv, eintraege }`) wird als ein Eintrag `{ kennung, id: null, grund: 'format' }` gemeldet; ein entschlüsselter Eintrag, der kein JSON ist, als `format`. `format` gehört ohnehin zu den Gründen aus `annahme`.
4. **`unterwegs` wird vor dem `put` gesetzt** – auch wenn das `put` dann an `offline` scheitert. Das ist die einzige Änderung am Stand ohne Bestätigung; Regel 1 und 2 brauchen sie (sonst wäre bei verlorener Antwort nicht dasselbe Bündel wiederholbar).
5. **Verworfenes wird einmal gemeldet**, nicht wiederholt (der Merker geht weiter). Die App muss die Meldung also beim ersten Mal festhalten (Anzeige/Fehlerprotokoll – später).
6. **Speicherfehler werden gemeldet, Programmfehler geworfen.** `abgleichen` gibt jeden Fehler mit `err.code` als `{ ok: false, fehler }` zurück; fehlender Schlüssel, ungültiger Stand oder fehlendes `now` werden geworfen.
7. **Höchstens fünf neue Nummern je `senden`.** Schützt vor einer Endlosschleife, falls zwei Kopien desselben Geräts gleichzeitig senden; danach kommt `vorhanden` als Fehler zurück, beim nächsten Abgleich geht es weiter.
8. **Beim Lesen keine Grenze von 100.** Die Grenze gilt für das Senden (Dateigröße). Ein größeres fremdes Bündel wird gelesen; jeder Eintrag wird einzeln geprüft.
9. **Gleiches Ereignis, andere Unterschrift:** im Protokoll bleibt die kleinere Unterschrift – so behalten alle Geräte dieselbe Variante.

## Tests
`tests/module/abgleich.test.mjs` (11 Tests, gegen `lokalerSpeicher`, ca. 1 s):
1. **E1/E4:** Kind-iPad, Eltern-iPhone, Eltern-Laptop; zehn Runden, jeweils ein Gerät offline (10 Abgleiche scheitern mit `offline`), 60 Ereignisse (`answer`, `round_done`, `setting_set`, `sheet_created`), jedes sofort im eigenen Protokoll. Danach zweimal abgleichen: gleiches Protokoll (Kennungen und Reihenfolge), gleiches `derive`, jede Antwort genau einmal in `attempts`, Ausgang leer.
2. **Offline:** 250 Ereignisse offline → `offline`, Ausgang und Protokoll 250, im Speicher nichts; online → drei Bündel mit 100/100/50; zwei andere Geräte bekommen genau 250, zweites Holen 0.
3. **Verlorene Antwort:** Prüf-Zugang wirft nach erfolgreichem `put` einmal `offline` → Wiederholung (auch über JSON gespeichert/geladen) → kein zweites Bündel, Ausgang leer, `naechsteNr` 2.
4. **Alte Sicherung:** zurückgesetzter Stand + neues Ereignis → Nummer 3 statt Überschreiben von 2, Bündel 1 und 2 unverändert, Protokoll mit allen vier, keins doppelt; zweiter Fall: zurückgesetzt ohne Neues → `holen` allein bringt die zwei fehlenden zurück, danach weiter mit Nummer 4.
5. **Fälschungen (E10)** in einem Bündel neben zwei gültigen: verändertes Byte (`entschluesseln`), fremde Unterschrift (`unterschrift`), Lehrkraft schreibt `answer` (`rolle-darf-nicht`), unbekanntes Gerät (`geraet-fremd`), nicht zugelassener Autor (`autor-unbekannt`), Eintrag mit fremder Kennung (`eintrag-passt-nicht`), Eintrag aus anderem Bereich (`entschluesseln`), kein JSON und kaputter Eintrag (`format`); dazu ein Bündel, das kein Bündel ist (`format`), ein von Hand und ein **vom Modul selbst** im anderen Bereich abgelegtes Bündel, kopiert (`entschluesseln`). Genau die zwei gültigen kommen an, jeder schlechte Eintrag genau einmal mit Grund; zweites Holen meldet nichts erneut.
6. **Schlüsselwechsel** (echter Schlüsselring aus `krypto`): Bündel mit Version 2, das Kind kennt nur 1 → `wartend`, zweimal; Merker trotzdem weiter. Nach Übergabe von Version 2 → gelesen (auch aus dem gespeicherten Stand), nichts doppelt, gleiches Protokoll wie die Eltern.
7. **Gerätestand als JSON:** derselbe Ablauf zweimal – einmal mit dem Objekt, einmal nach jedem Schritt gespeichert/geladen – gleiche Ergebnisse, gleiches Protokoll, gleiches `derive`. Zweimal `holen` ohne Neues: Ergebnis leer, Stand byte-gleich.
8. **Neues Gerät** desselben Elternteils (leerer Stand) bekommt alles, auch die drei eigenen Ereignisse der Person vom iPhone; dasselbe Gerät neu installiert liest seine eigenen Bündel und sendet danach mit Nummer 4, ohne etwas zu überschreiben.
9. **Netzabbruch mitten im Holen/Senden:** `get` bricht beim zweiten Bündel ab → Stand byte-gleich; `put` bricht beim zweiten von zwei Bündeln ab → nur das erste aus dem Ausgang (gesendet 100), danach der Rest; das dritte Gerät hat alle 301.
10. **Eingaben:** fremdes Ereignis, Eintrag ohne Unterschrift, Stand mit Zusatzfeld → abgelehnt; dasselbe Ereignis zweimal → einmal; `holen` ohne `now` und `senden` ohne aktuellen Schlüssel → Fehler, nichts vorbereitet.
11. **Reinheit:** kein `fetch(`, kein Browser-Speicher, kein `Math.random`, kein Zeitgeber; Importe nur aus `krypto`, `ereignisse`, `annahme`; Namen exportiert oder mit `abg`/`ABG_`.

## Gegenproben
Je ein absichtlicher Fehler im Modul (Skript `%TEMP%\opencode\p3a2-gegenproben.mjs`), danach muss `abgleich.test.mjs` rot werden – ohne Syntaxfehler. Die neun aus der Aufgabe (zwei davon in zwei Varianten) und sechs weitere: **alle 17 rot**.

| Gruppe | Fehler (alle rot) |
|---|---|
| aus der Aufgabe | Ausgang vor dem `put` leeren · beim Wiederholen neu verschlüsseln · `vorhanden` ohne `gleicherInhalt` als gesendet werten · Merker über ein wartendes Bündel ohne `wartend` · Verworfene ohne Grund weglassen (aus `annahme` bzw. beim Entschlüsseln) · ganzes Bündel verwerfen, wenn ein Eintrag schlecht ist · ohne `annahme` übernehmen · Zusatzdaten ohne Bereich · Bündel größer als 100 |
| weitere | Eintrag-Kennung nicht mit dem Ereignis vergleichen · Merker nicht speichern · `holen` schreibt den Merker vor dem Lesen · alte Sicherung: unbekannte eigene Bündel nicht nach `wartend` · eigene Bündel immer überspringen (auch neues Gerät) · Protokoll nur anhängen statt einordnen · Offline-Fehler werfen statt melden |

„Zusatzdaten ohne Bereich“ wurde im ersten Lauf nur indirekt rot (die im Test von Hand verschlüsselten Einträge passten nicht mehr). Test 5 kopiert jetzt zusätzlich ein Bündel, das das Modul selbst im anderen Bereich abgelegt hat; ohne Bereich in den Zusatzdaten würde es entschlüsselt und erst an der Unterschrift scheitern – der erwartete Grund `entschluesseln` macht die Probe gezielt rot.

## Befunde für die nächsten Aufgaben (nicht geändert)
- **P3b/EP9:** Zulassung „zu diesem Zeitpunkt“ fehlt weiter (ein später entferntes Gerät verwirft auch seine alten, damals gültigen Ereignisse beim nächsten neuen Gerät). Bis dahin: Zulassung nie verkleinern, sondern erst mit EP9.
- **Schnappschuss (Aufgabe 5):** Ein neues Gerät liest alle Bündel; ab einigen tausend Ereignissen wird das langsam. `holen` ist die Stelle, an der der Schnappschuss als zusätzlicher Weg hinzukommt.
- **3b/App:** `vormerken` ordnet das ganze Protokoll neu (mergeLog). Bei sehr langen Protokollen kostet jede Antwort etwas Zeit – mit Schnappschuss (Basisstand) bleibt das Protokoll kurz. Verworfene Einträge muss die App beim ersten Melden festhalten (Entscheidung 5).
- **Ein Bündel kann Ereignisse anderer Geräte enthalten.** Das ist harmlos (jede Unterschrift wird geprüft, gleiche Kennung zählt einmal) und wird nicht abgelehnt; wer Schreibzugriff auf den Speicher hat, kann so nur echte, alte Ereignisse wiederholen.

## Zeiten
| Prüfung | Dauer |
|---|---|
| `tests/module/abgleich.test.mjs` (11 Tests) | ca. 1 s |
| `npm run test:module` | ca. 2,5 s |
| Gegenproben (17 Läufe) | ca. 30 s |
| volle Reihe (410 Tests, alle grün; Stand `main` v92 + dieser Zweig, eigener Arbeitsordner) | 350 s |

Live-Bau: Die SHA-256 der Live-App von `main` (v92) und von diesem Zweig sind identisch (`d4fd4cce…bcba27`, Form mit LF). Der Testbau enthält das Modul.

## Veröffentlichung
Nicht veröffentlicht (Vorgabe: nur die Koordinations-Sitzung veröffentlicht). Dieses PR ändert die Live-App nicht.

## Nächster Schritt
P3b: Rechtematrix gegen echte Schlüssel (US10.4) – Schlüssel aus dem Speicher, Zulassung aus `member_*`/`device_*`; danach ist M3 erreicht. Später P4: derselbe Ablauf gegen die GitHub-Umsetzung der Schnittstelle (Vertragstests aus P3a).
