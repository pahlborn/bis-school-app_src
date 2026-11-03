# 2026-11-02 – Stufe 2, P3a: Speicher-Schnittstelle und Simulation (nur Testbau)

## Auftrag
Spezifikation S12, Phase P3 (US8.1, erster Teil), Konzept 11 (Speicher-Anschluss). Später gibt es drei Speicher (Simulation, GitHub, iCloud). Ziel: eine feste Schnittstelle, ein simulierter Speicher im Arbeitsspeicher mit beliebig vielen „Geräten“ (offline/online schaltbar) und **Vertragstests**, die jede Umsetzung bestehen muss – dieselben Tests laufen später gegen GitHub (P4) und iCloud (Stufe 3).

`index.html` ist unverändert. Das Modul ist **nur im Testbau** (`module.json`: `bau: test`, nach `annahme`). Kein Netz, kein GitHub, keine Abgleich-Logik (das ist P3a-2).

## Änderungen
- `src/module/speicher.mjs` (keine Importe, kein Netz, kein Browser-Speicher):
  - `SPEICHER_FUNKTIONEN` (die zwölf Funktionen der Schnittstelle), `SPEICHER_FEHLER` (Fehlercodes), `SPEICHER_EINLADUNG_MS` (10 Minuten), `SPEICHER_DATEI_FORMAT`.
  - `lokalerSpeicher({ now })` → `{ geraet(kennung) }`; `geraet` liefert den Zugang eines Geräts mit allen Funktionen und zusätzlich `offline()` / `online()`.
  - Alle Hilfsnamen beginnen mit `spk`/`SPK_` (gemeinsamer Namensraum in der App).
- `tests/module/speicher-vertrag.mjs` (neu): `speicherVertrag(name, neu)` – 12 Vertragstests, wiederverwendbar; `neu({ now })` liefert einen frischen Speicher.
- `tests/module/speicher.test.mjs` (neu): Vertrag für die Simulation + 4 eigene Tests (offline/online, Gerätekennung, getrennte Speicher, Reinheit).
- `src/module/module.json`: `speicher` (Testbau, Browser-Test `testbau` = Start des Testbaus ohne Namenskonflikt).

## Die Schnittstelle (Vertrag)
Alle Funktionen sind `async`; Fehler kommen als abgelehntes Promise mit `err.code`. Der Inhalt ist für den Speicher undurchsichtig (JSON, in der Praxis verschlüsselte Bündel aus `krypto`); er wird beim Ablegen kopiert und beim Lesen als Kopie herausgegeben.

| Funktion | Vertrag |
|---|---|
| `put(bereich, geraet, { nr, inhalt })` | Kennung `geraet/nr`. Nur das eigene Gerät (`fremdes-geraet`). Nummern je Gerät und Bereich lückenlos ab 1 (`luecke`). Vorhandene Nummer → `vorhanden`, nie überschrieben; `err.gleicherInhalt` sagt, ob es derselbe Inhalt war. Gleichzeitige Versuche mit derselben Nummer: genau einer gewinnt. |
| `list(bereich, seit)` | `{ kennungen, merker }`. `seit` = Merker der letzten Abfrage (`null` = von vorn). Reihenfolge: Gerät, dann Nummer (10 nach 9). Eigene Bündel stehen auch drin. Der Merker ist reines JSON und gehört zu einem Bereich; fremder oder kaputter Merker → `ungueltig`. |
| `get(bereich, kennung)` | genau der abgelegte Inhalt; unbekannt → `unbekannt`, kaputte Kennung → `ungueltig`. |
| `keys(bereich)` / `putKey(bereich, halter, verpackt)` | `{ halter: verpackt }`; `putKey` ersetzt nur den Eintrag dieses Halters. |
| `directory(lookup)` / `putDirectory(eintrag)` | Eintrag zu `eintrag.lookup` (Hash des Anmeldenamens); unbekannt → `null`; zweites Anlegen → `vorhanden`, der erste bleibt. |
| `invite.put / get / delete` | gültig 10 Minuten ab `put` (Uhr `now`); ab genau 10:00 → `abgelaufen`; `get` gibt die Einladung **einmal** heraus (zweite Nutzung → `unbekannt`); `delete` → weg (Rückgabe: war sie da). Doppeltes `put` → `vorhanden`. |
| `exportFile(bereich)` / `importFile(datei)` | Datei = Text `{ format: "bq-buendel-datei", v: 1, bereich, buendel: [{ geraet, nr, inhalt }] }` – **für alle Umsetzungen gleich**, damit eine Sicherung aus GitHub später in iCloud eingelesen werden kann. Einlesen legt nur Fehlendes ab → `{ neu, gleich, abweichend }`; nichts wird überschrieben; eine Datei, die eine Lücke hinterließe oder kaputt ist, wird ganz abgelehnt (nichts abgelegt). |

Gültige Kennungen (Bereich, Gerät, Halter, Lookup, Einladung): Buchstabe am Anfang, dann Buchstaben, Ziffern, `_ : -`, höchstens 128 Zeichen. Damit gibt es keine Pfade (`/`, `..`) und kein `__proto__` – wichtig für die Dateiablage auf GitHub (`events/<Bereich>/<Gerät>/<Nummer>.json`, Konzept 12).

## Abweichungen und Entscheidungen (Peter kann widersprechen)
**Von Peter bestätigt am 03.11.** (alle sechs; P3a-2 baut darauf auf).

1. **Lückenlose Nummern.** Die Aufgabe verlangt nur „gleiche Nummer zweimal → Fehler“. Zusätzlich muss jede Nummer genau die nächste sein (`luecke`). Grund: Dann reicht als Merker „höchste Nummer je Gerät“, und das lässt sich auf GitHub und iCloud ohne Server-Zähler umsetzen. Zudem fällt ein verlorenes Bündel sofort auf. Konzept 9.4 („setzt mit dem nächsten fehlenden Bündel fort“) passt dazu.
2. **`vorhanden` mit `gleicherInhalt`.** Ging die Antwort auf ein `put` verloren (Netz weg), sieht das Gerät beim Wiederholen `vorhanden` und weiß über `gleicherInhalt`, ob sein Bündel schon angekommen ist. Für P3a-2 wichtig.
3. **`list` nennt auch eigene Bündel.** Ein Gerät, das neu anfängt (`seit = null`), bekommt so auch seine eigenen alten Bündel. P3a-2 überspringt eigene Kennungen leicht (Gerät steht vorn).
4. **Einladung: `get` verbraucht sie.** „Zweite Nutzung abgelehnt“ ist so umgesetzt, dass die erste Abholung die Einladung entfernt (zweite → `unbekannt`). `delete` dient zum Zurückziehen vor der Abholung. Eine abgelaufene Einladung bleibt bis `delete` liegen und meldet jedes Mal `abgelaufen`.
5. **Einlesen ist nicht an das Gerät gebunden.** Eine Sicherung enthält die Bündel aller Geräte; `importFile` legt sie ab, ohne „nur eigene Bündel“ zu prüfen. Die Rechte prüft beim Lesen ohnehin `annahme` (Unterschrift, Gerät, Rolle).
6. **Datei als Text.** `exportFile` liefert Text (so wie eine heruntergeladene Datei), `importFile` nimmt nur Text; ein Objekt wird abgelehnt.

## Befunde für die nächsten Aufgaben (nicht geändert)
- **GitHub (P4):** „Genau einer gewinnt“ bei gleicher Nummer verlangt Anlegen nur, wenn die Datei fehlt (Contents-API ohne `sha`). Die stellbare Uhr gilt für Einladungen nur, wenn der Ablauf auf dem Gerät geprüft wird (Zeitpunkt in der Einladung). Ein Token-Inhaber kann löschen – das prüft kein Vertrag (Konzept 12, Risiken).
- **Offline in der Simulation:** wirkt je Zugang. Zwei Zugänge desselben Geräts (wie zwei Tabs) sind getrennt schaltbar; sie überschreiben sich trotzdem nicht (Test).
- **Kein Schnappschuss:** Die Bündel bleiben vollständig. Wie ein neues Gerät nur „Schnappschuss + Neues“ lädt (Konzept 9.3), gehört zu Aufgabe 5 bzw. P3a-2.

## Tests
`tests/module/speicher.test.mjs` (16 Tests, ca. 0,1 s):
1. **Schnittstelle vollständig:** alle zwölf Funktionen vorhanden, auch Fehler kommen als abgelehntes Promise.
2. **put/get:** Kennung `d_a1/1`, genau der Inhalt (Objekt, Zahl, `null`, Liste, Text), Änderungen danach am Eingabe- oder Ergebnisobjekt erreichen den Speicher nicht; unbekannt bzw. anderer Bereich → `unbekannt`; neun kaputte Kennungen → `ungueltig`.
3. **Nur eigene Bündel:** fremdes und unbekanntes Gerät → `fremdes-geraet`, nichts abgelegt.
4. **Nie überschreiben:** zweites `put` mit anderem bzw. gleichem Inhalt → `vorhanden` mit `gleicherInhalt` falsch bzw. wahr; fünf gleichzeitige Versuche → genau einer gewinnt, sein Inhalt bleibt.
5. **Lückenlos und Eingaben:** Lücke → `luecke`; acht kaputte Nummern, fehlender Inhalt, Funktion als Inhalt, Zusatzfeld, vier kaputte Bündel, sieben kaputte Bereiche (`a/b`, `../x`, `__proto__` …) → `ungueltig`; danach liegt nur das eine gültige Bündel.
6. **list:** Reihenfolge Gerät, dann Nummer (`d_a1/10` nach `/9`), gleich für jedes Gerät; Merker als JSON gespeichert liefert nur Neues; gleicher Merker → gleiche Antwort; Bereiche getrennt; Merker eines anderen Bereichs (auch einer, der der Zahl nach passt) und sieben kaputte Merker → `ungueltig`.
7. **keys/putKey:** ersetzt nur den Eintrag dieses Halters, Bereiche getrennt, Kopie, kaputte Halter → `ungueltig`.
8. **directory:** unbekannt → `null`, zweites Anlegen → `vorhanden` (erster bleibt), sechs kaputte Einträge → `ungueltig`.
9. **Einladungen mit stellbarer Uhr:** bei 9:59,999 gültig (anderes Gerät holt ab), zweite Nutzung abgelehnt, ab 10:00 und einen Tag später `abgelaufen`, `delete` → weg, zurückgezogen, doppeltes `put` → `vorhanden`.
10. **Export/Einlesen:** festes Format; in leeren Speicher einlesen → gleiche Liste und Inhalte; zweimal einlesen → `neu 0, gleich 5`, nichts doppelt, Export danach byte-gleich; nur Fehlendes (`neu 3, gleich 2`); abweichender Inhalt bleibt (`abweichend 1`); 17 kaputte Dateien (Lücke, Beginn bei 2, doppelt, kaputte Einträge, Objekt statt Text …) → `ungueltig`, nichts abgelegt; leerer Bereich; umsortierte Datei geht.
11. **Drei Geräte** schreiben in sechs Runden abwechselnd ein oder zwei Bündel (27), abwechselnd holt ein anderes Gerät ab, Merker über JSON: jedes sieht jedes Bündel genau einmal.
12. **Undurchsichtig:** drei mit `krypto` verschlüsselte Einträge abgelegt; weder Export noch Bündel enthalten Klartext; zurückgeholt entschlüsseln sie unverändert.
13. **Offline:** alle zwölf Funktionen → `offline`; das andere Gerät sieht nichts davon, die Einladung ist nicht verbraucht; nach `online()` geht dieselbe Nummer.
14. **Offline → online:** `list` mit altem Merker liefert genau die zwischenzeitlich geschriebenen drei Bündel; andere Geräte arbeiten weiter.
15. **Simulation:** kaputte Gerätekennung → `ungueltig`; ohne Uhr gilt die echte Zeit; zwei Speicher sind getrennt; zweiter Zugang desselben Geräts überschreibt nicht.
16. **Reinheit:** kein `fetch`, kein Browser-Speicher, kein `Math.random`, keine Importe; alle Namen auf oberster Ebene exportiert oder mit `spk`/`SPK_`.

## Gegenproben
Je ein absichtlicher Fehler im Modul (Skript `%TEMP%\opencode\p3a-gegenproben.mjs`), danach muss `speicher.test.mjs` rot werden – ohne Syntaxfehler. Die sechs aus der Aufgabe und zwölf weitere: **alle 18 rot**.

| Gruppe | Fehler (alle rot) |
|---|---|
| aus der Aufgabe | Überschreiben erlauben · `list` liefert alte Bündel doppelt (Merker ignoriert) · `list` liefert das letzte Bündel jedes Geräts doppelt · Einladung läuft nicht ab · zweite Nutzung erlaubt · offline schreibt trotzdem (Fehler erst nach dem Schreiben) · Einlesen legt doppelt ab |
| Ablegen | fremdes Gerät darf schreiben · Lücke erlaubt · `gleicherInhalt` fehlt · `get` gibt das abgelegte Objekt statt einer Kopie |
| Weitere Funktionen | `putKey` ersetzt alle Halter · Verzeichnis überschreibt · Einladung erst nach mehr als 10 Minuten abgelaufen |
| list | Merker eines anderen Bereichs angenommen · keine feste Reihenfolge |
| Einlesen | Datei mit Lücke angenommen · nicht atomar (schreibt schon beim Prüfen) |

Die Gegenprobe „Merker eines anderen Bereichs“ blieb im ersten Lauf grün, weil der fremde Merker schon an der Zahl scheiterte. Der Vertrag hat jetzt einen Fall, in dem der fremde Merker der Zahl nach passt; seitdem rot.

## Zeiten
| Prüfung | Dauer |
|---|---|
| `tests/module/speicher.test.mjs` (16 Tests) | 0,1 s |
| `npm run test:module` (119 Tests) | 1,5 s |
| volle Reihe (381 Tests, alle grün, Stand `main` v86 + dieser Zweig, eigener Arbeitsordner) | 225 s |
| volle Reihe nach Einmischen von Elternbereich E3 (#88) (383 Tests, alle grün) | 320 s |

Live-Bau: Die SHA-256 der Live-App von `main` (v86) und von diesem Zweig sind identisch (`682f2a54…4c36c2`, Form mit LF). Der Testbau enthält das Modul.

## Veröffentlichung
Nicht veröffentlicht (Vorgabe: Stufe-2-Sitzungen veröffentlichen nicht selbst). Dieses PR ändert die Live-App nicht.

## Nächster Schritt
P3a-2: Abgleich eines Geräts (Bündeln, Holen, Entschlüsseln, Annehmen, Zusammenführen) auf dieser Schnittstelle, offline/online – mit `lokalerSpeicher` als Prüfstand.
