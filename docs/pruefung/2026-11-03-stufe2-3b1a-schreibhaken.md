# 2026-11-03 – Stufe 2, Aufgabe 3b-1a: Schreibhaken für den Lernstand (nur Testbau)

## Auftrag
Teil 1 von 3b-1 (Vault: „Aufgabe 3b-1 – Schreibhaken“). Bis jetzt erzeugte nur ein Mitschreiber **im Test** Ereignisse aus Speicheränderungen. Jetzt schreibt der **Testbau selbst** an jeder Schreibstelle des Lernstands das passende Ereignis. Die App liest weiter ihren bisherigen Speicher; im **Live-Bau ändert sich nichts** (die Haken tun dort nichts). Nicht veröffentlicht.

Aufteilung (Entscheidung, Peter kann widersprechen): **1a** Lernstand (dieser PR), **1b** „Letzte gilt“-Werte (Profil, Einstellungen, Tageshinweise, Checkliste, Sprache, Lücken, Adventskalender), **1c** Freigaben und Sprache der Eltern.

## Änderungen
- **Neues Modul `src/module/schreiber.mjs`** (nur Testbau, `module.json`): `evSchreiber({read, write, device, who, now})` → `write(type, payload)`. Baut das Ereignis (`newEvent`), prüft das Format (`checkEvent`) und die Rolle (`roleMayWrite`, dieselbe Regel wie beim Annehmen) und hängt es an die Liste an. Abgelehntes wird **nicht** gespeichert, sondern in `problems` gemeldet (`wer-unbekannt`, `format`, `rolle-darf-nicht`). Zeiten: je Gerät mindestens 1 ms nach dem vorigen Ereignis (auch bei zurückgestellter Uhr). `newDeviceId()` → `d_` + 20 Zeichen.
- **`annahme`:** neue Ausgabe `roleMayWrite(role, event)` (Typ + Zusatzbedingungen); `acceptEvent` nutzt sie selbst.
- **`index.html`** (kurze Haken, im Live-Bau wirkungslos):
  - `eventHook(type, payload)`: nur wenn das Modul da ist (`typeof evSchreiber`); Ereignisse unter `bq2_<Kind>__events`, Gerätekennung unter `bq2_evDevice` (geräteweit, `GLOBAL_KEYS`). Fehler landen in `eventErrors`, nichts bricht die App.
  - `eventWho()`: Erwachsenenbereich offen → der angemeldete Erwachsene (Rolle Eltern/Lehrkraft/Admin); sonst das angemeldete Kind. Ohne Konten feste Testkennungen `p_kind` / `p_eltern`.
  - Haken: `logAttempt` (neu, ersetzt vier gleiche Stellen; Blattzeilen werden nicht als `answer` geschrieben) → `answer`; `showResults` → `round_done`; `addBadge(k, skill)` → `badge` (Quest nur bei „inquirer“); `rememberWrong`/`advanceDue` → `review` (Stufe 0 mit Frage, 1/2 mit Fälligkeit, 3 = erledigt); `renderRank` → `rank_seen` (auch der stille erste Titel); `buildSheet` → `sheet_created`; `sheetResult` → `sheet_result`; `discardSheet` → `sheet_discarded`.
- **`werkzeug/speicherstellen.json`:** `events` (Kind, Protokoll, ohne Sicherung bis Aufgabe 6) und `evDevice` (Gerät, lokal).
- **Tests:** `tests/module/schreiber.test.mjs` (neu, 10 Tests inkl. Wächter), `tests/module/annahme.test.mjs` (+1: `roleMayWrite` = `acceptEvent` für alle 25 × 4), `tests/ableitung-vergleich.test.mjs` (umgestellt auf die echten Ereignisse, Mitschreiber entfernt; neuer Live-Bau-Test).

## Tests
- **Klick-Vergleich (Browser, Testbau):** derselbe Verlauf wie in 3a (Runden mit Tipp, Beispiel, Lösung, zweitem Versuch, abgebrochene Quest, zwei Übungsblätter – eins trägt das Kind selbst ein, eins verwerfen die Eltern –, Wiederholungen an vier weiteren Tagen). Die App schreibt dabei **107–108 echte Ereignisse** (68 `answer`, 17 `review`, 6 `round_done`, 5–6 `badge`, 6 `sheet_result`, 2 `sheet_created`, 2 `rank_seen`, 1 `sheet_discarded`). Ergebnis: `derive(events)` ist **gleich dem gespeicherten Stand** (`attempts`, `ev`, `due`, `total`, alle `best_*`, `badges`, `tried`, `treeStage`, `rankSeen`, `sheets`, `sheetNo`), in Node und Chromium gleich. Dazu: nichts abgelehnt, kein Fehler; eine Gerätekennung; Autoren nur `p_kind` und – genau beim Verwerfen – `p_eltern`; Zeiten steigen streng; das erste Ereignis ist der still gemerkte erste Titel.
- **Live-Bau (Browser):** dieselben Klicks → Speicher wie gewohnt, **kein** `events`, **keine** Gerätekennung, keine Fehler.
- **Wächter (Node):** findet alle Schreibstellen (`store.set`, `store.del`, `kidWrite`) in `index.html` – 80 Stellen –, ordnet jede einem Eintrag in `speicherstellen.json` zu und verlangt bei abzugleichenden Schlüsseln einen eigenen Haken direkt daneben (jeder Haken zählt für eine Stelle). Ohne Haken erlaubt: lokale Schlüssel; abgeleitete Werte (`ev`, `total`, `best_`, `tried`, `treeStage`, `sheetNo` – der Klick-Vergleich prüft sie); und die ausdrücklich **offene Liste** für 1b/1c (35 Stellen: `gaps`, Profil, Einstellungen, Tageshinweise, `chk_`, `advent`, `kidLang`; `grants`, `grantlog`, `parentLang`). Die Liste darf nur kürzer werden (ein Schlüssel ohne offene Stelle muss raus).
- **Schreiber (Node):** gültiges Ereignis, Nutzlast kopiert; Zeiten +1 ms auch bei stehender/zurückgestellter Uhr; Ablehnungen (niemand, keine Rolle, Format, Kennung ohne `p_`, Kind schreibt Einstellungen/Verwerfen/„Weiter üben“, Eltern antworten, Lehrkraft vergibt Abzeichen) werden nicht gespeichert und alle gemeldet; kaputte gespeicherte Liste gilt als leer; `derive` liest das Geschriebene wie die App.
- `npm run test:module` 146/146.

## Gegenproben (alle 19 rot)
Skript `%TEMP%\opencode\gegenproben-3b1a.mjs`.

| Gegenprobe | erkannt von |
|---|---|
| Haken fehlt: `rememberWrong`, `advanceDue`, `answer`, `sheet_result`, `sheet_discarded`, `sheet_created`, erster Titel | Wächter und/oder Klick-Vergleich |
| Blattzeilen zusätzlich als `answer` | Klick-Vergleich |
| „inquirer“ ohne Quest | Klick-Vergleich (`tried`) |
| `round_done` mit falschen Sternen | Klick-Vergleich |
| Erwachsene schreiben als Kind | Klick-Vergleich (Autor, Ablehnung) |
| neue Schreibstelle ohne Haken | Wächter |
| Live-Bau schreibt Gerätekennung | Live-Bau-Test |
| Schreiber: ohne Rechte-/Formatprüfung, ohne +1 ms, speichert Abgelehntes, ohne Problemliste | Modultests |
| `roleMayWrite` ohne Zusatzbedingungen | Modultests |

Zwei Gegenproben waren zuerst grün („erster Titel ohne Haken“, „neue Schreibstelle ohne Haken“): Der Wächter ließ einen Haken bis 3 Zeilen entfernt für mehrere Stellen zählen. Jetzt gilt: eigener Haken in derselben Zeile, davor oder danach, jeder Haken nur einmal. Dazu prüft der Klick-Vergleich das erste Ereignis.

## Entscheidungen (Peter kann widersprechen)
1. **Aufteilung in 1a/1b/1c** (je ein PR), damit die Läufe kurz bleiben.
2. **Ereignisse werden noch nicht unterschrieben** (Personenschlüssel kommen mit EP8/EP9). Sie liegen nur lokal im Testbau.
3. **Wer schreibt:** bei offenem Erwachsenenbereich der Erwachsene, sonst das Kind. Ohne Konten (Tests, ungebaute App) `p_kind` / `p_eltern`.
4. **Abgelehntes wird nicht gespeichert**, aber gemeldet (`problems`); im Test muss die Liste leer sein.
5. **`events` ohne Sicherung** bis Aufgabe 6 (Sicherungsdatei) – sonst würde sich die Live-Sicherung ändern.

## Befunde für die nächsten Teile (nicht geändert)
- **Sonderwege ohne Ereignis:** Umzug auf Kennungen (`migrateToIds`), Bereinigung alter Fragen (`cleanStoredPrivate`) und Zurückspielen einer Sicherung schreiben direkt in `localStorage`. Das gehört zu 3c (Umwandlung in einen Basisstand) und Aufgabe 6 (Sicherung einlesen).
- **Größe:** Die Liste wird bei jedem Ereignis ganz gelesen und geschrieben. Für den Testbau reicht das; bei mehreren Tausend Ereignissen sollte P3a-2/3b-2 zwischenspeichern.
- **Rendern als Erwachsener:** Schreibt eine Ansicht im Erwachsenenbereich Lernstand (z. B. ein neuer Titel beim Anzeigen), würde der Schreiber das als `rolle-darf-nicht` melden. Im Klick-Verlauf kam das nicht vor; der Test würde es zeigen.
