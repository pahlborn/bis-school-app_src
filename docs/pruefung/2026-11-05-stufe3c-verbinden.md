# 2026-11-05 - Stufe 3c, "Testinstanz verbinden" (Befund #134; nur Werkzeug und Tests)

## Auftrag
Die Testinstanz mit dem Test-Repo verbinden (Befund aus #134): `testinstanzUmwandeln` ersetzt die Marke `/*BQ_SPEICHER*/null`
durch den Speicher des Test-Repos, der Suchlauf prueft das. Danach startet die Testinstanz mit der Anmeldung; ihre Tests melden
sich zuerst an. Dazu pruefen, ob das Speichern von `ursprung`/`alt` je Konto (Befund #135/#136) zum Bauwerkzeug gehoert.

`index.html` und `src/module/*` sind **unveraendert** (Kathies App und der Testbau bauen byte-gleich wie vorher). Nichts
veroeffentlicht, kein Repo angelegt.

## Aenderungen
- `werkzeug/testinstanz.mjs`
  - neu `SPEICHER_MARKE` und `SPEICHER_TESTINSTANZ = { art: 'github', repo: 'pahlborn/bis-school-app-testdaten', wurzel: '' }`
    (aus `TESTINSTANZ.repoDaten`/`wurzelDaten`; echtes GitHub, kein `basis`).
  - `testinstanzUmwandeln(app, ersatz, { speicher })`: ersetzt die Marke **genau einmal** (sonst Abbruch wie bei den anderen
    Stellen). `speicher` nur fuer Tests (z. B. der simulierte Speicher); der Bau nimmt immer `SPEICHER_TESTINSTANZ`.
  - Suchlauf: neue Pruefung **"mit dem Test-Repo verbunden"** (jetzt **16**): Marke nirgends mehr, `KONTO_SPEICHER` genau
    einmal und genau dieser Text. Gilt auch vor dem Kopieren beim Veroeffentlichen (gleicher Suchlauf).
- Tests
  - `tests/testinstanz.test.mjs`: GitHub-Nachbau mit Admin -> Elternteil -> Startcodes fuer Testkinder (wie
    `werkzeug/testpersonen.mjs`). **Sandbox** und **Browser** nehmen die gebaute Testinstanz unveraendert; `api.github.com`
    wird auf den Nachbau umgelenkt (Sandbox: `fetch`, Browser: Playwright-Route mit CORS-Vorabfrage). Beide starten auf der
    Anmeldeseite, das Kind meldet sich mit Startcode an, waehlt ein Passwort, uebt bzw. oeffnet ein Fach. Weiter geprueft:
    nur `bqt` gelesen/geschrieben, Kathies Eintraege unveraendert, Token nur in `bqt_gh` (auch nicht im Test-Repo), alle
    GitHub-Anfragen nur an `pahlborn/bis-school-app-testdaten`, das Konto liegt danach im Test-Repo, Browser: GitHub erst nach
    Eingabe des Zugangs. Neue Gegenprobe-Tests: anderes Repo (Startcode gilt dort nicht, nichts angelegt), Suchlauf-Faelle
    (Marke, `null`, anderes Repo, `basis`, Unterordner, Simulation, doppelt), Umwandlung (Marke 0x/2x).
  - `tests/testinstanz-veroeffentlichen.test.mjs`: Aktualisierung jetzt auf der Anmeldeseite (v7 -> v8, Zugangsfeld
    sichtbar); Suchlauf vor dem Kopieren +2 Faelle (nicht verbunden, anderes Repo).
  - `tests/konto-anmeldung.test.mjs`: Test 7 gibt der Umwandlung den simulierten Speicher (`speicher`), Test 4 setzt den
    Speicher an der Marke; die Hilfsfunktion setzt den gemeinsamen Speicher erst nach der eigenen Anpassung.
- `docs/veroeffentlichen.md` Abschnitt 5: Zeile "Speicher" (Zugang einmal je Geraet, danach Startcode/Passwort).

## Belege
| Test | Ergebnis |
|---|---|
| `tests/testinstanz.test.mjs` | 9/9 |
| `tests/testinstanz-veroeffentlichen.test.mjs`, `tests/konto-anmeldung.test.mjs`, `tests/konto-anmeldung-browser.test.mjs`, `tests/testpersonen.test.mjs` | 28/28 |
| `node werkzeug/testinstanz.mjs --ziel <tmp>` | 16 Pruefungen ok, `const KONTO_SPEICHER={"art":"github","repo":"pahlborn/bis-school-app-testdaten","wurzel":""};` |

**Gegenproben:** 12, alle rot (`%TEMP%\opencode\gegenproben-verbinden.mjs`): Marke nicht ersetzt; ohne Zaehlung ersetzt;
Option `speicher` uebergangen; anderes Repo; mit `basis`; Suchlauf-Pruefung fehlt; Marke nicht gesucht; doppelte Stelle;
nur die Art verglichen; App fragt immer dasselbe Repo; Zugang nie verlangt; GitHub-Speicher ohne Konto-Modus.

## Entscheidungen (Peter kann widersprechen)
- Testinstanz-Tests melden sich als **Kind** an (Startcode vom Elternteil) - das ist der Weg, auf dem geuebt wird.
- Die Tests lenken `api.github.com` um, statt eine Testinstanz mit Nachbau-Adresse zu bauen: so wird genau die Datei
  geprueft, die veroeffentlicht wuerde. Eine Testinstanz mit `basis` lehnt der Suchlauf ab.
- Bei einem falschen Repo landet die App erst auf "Eigenes Passwort waehlen" und meldet dann "Startcode gilt nicht" (der
  Name ist dort unbekannt). Kein Schaden (nichts angelegt), aber fuer die Oberflaeche ggf. eine klarere Meldung.

## Nicht Teil dieser Aufgabe (Hinweis an "Einladungen - Oberflaeche")
`ursprung` und `alt` je Konto speichert **index.html** (`kontoAngemeldet`, `kontoSchluesselLaden`, IndexedDB `bq2_konto`),
nicht das Bauwerkzeug. Heute nur `art`, `pub`, `schluessel`. Fuer den Abgleich (`kontoPersonen` -> `geraetAbgleichen`)
zusaetzlich `stand`, `ursprung` und nach `wiederherstellen`/`schluesselErneuern` `alt` mitspeichern und `alt` erst
loeschen, wenn `erneuerungOffen` leer ist.
