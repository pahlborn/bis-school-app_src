# Prüfbericht Stufe 3c, Werkzeug-Teil – Bauart „Testinstanz“ und Testpersonen (04.11.2026)

Zweig `stufe3c-testinstanz-werkzeug`. Nur Werkzeug: `index.html` und `src/module/*` unverändert, Live-Bau byte-gleich.
Nicht veröffentlicht, kein neues Repo angelegt, nichts ins Test-Repo geschrieben.

## Was neu ist
- **`werkzeug/testinstanz.mjs`** (+ `testinstanzBauen` in `werkzeug/bauen.mjs`, `npm run testinstanz`): baut nach `dist-test/` (nicht eingecheckt).
  - Testbau (alle Module), **ohne** `schuldaten.json` (`SCHOOL_DATA=null`), **ohne** `konten.json` (`APP_ACCOUNTS` leer), **ohne Familienpasswort** (keine Hülle, App im Klartext).
  - Speicher im Browser: `bq2_` → `bqt_`, `bq_` → `bqt_` (Gerätedaten `abgleich`, `abgleichVerworfen`, `schluessel`), `bqUpdateTo` → `bqtUpdateTo`; Token unter `bqt_gh`.
  - Gerätedaten und Token liegen damit unter demselben Präfix wie die Daten der App. Damit sie nie als Daten eines Kindes gelten (Umzug auf Kennungen, Sicherung), stehen `gh`, `abgleich`, `abgleichVerworfen`, `schluessel` vorn in `GLOBAL_KEYS`. Gleiche Namen als Speicherstelle der App → Abbruch.
  - Titel „… (Test)“, Home-Bildschirm und Manifest „Big Quest Test“.
  - Die Umwandlung geschieht im fertigen Text; jede Stelle muss genau einmal passen, sonst Abbruch (fällt auf, wenn sich `index.html` dort ändert).
- **Suchlauf** (`testinstanzPruefen`, 14 Prüfungen, ein Fund bricht vor dem Schreiben ab): Schuldaten leer + kein Text aus `schuldaten.json` (35 gesucht); Konten leer + keine Kennung/kein Startcode-Hash aus `konten.json` (12); kein Tresor, App im Klartext; Salz des Familienpassworts fehlt; kein `bq2_`, `bq_`, `gh_token`, `bqUpdateTo`; feste Speicherstellen nur mit `bqt` (11); Token-Eintrag `bqt_gh`; Gerätedaten und Token geräteweit; **verbotene Wörter in der ganzen App** (17); Testbau-Module; Version; Name „Test“.
- **`werkzeug/testinstanz-ersatz.json`**: Die App liegt in der Testinstanz im Klartext. Die Liste der verbotenen Wörter galt bisher nur für die Hülle – die App selbst enthält Schul-Namen (Aufgaben „Friction Frenzy“, „Persuade for the Park“, „Travel for Work“, „Pantastic“, Links auf die Schulseite mit Ortsnamen, „Kathie“ in einem Kommentar). Diese werden nur in der Testinstanz neutral ersetzt („Friction Lab“, „Save the Park“, „Road Trip“, „Stage Show“, `https://example.org/`, „Mia“); Kalender-Link zeigt auf die Testinstanz. Zusätzlich verboten: `bis-school.com`, `Kathie`, Adresse von Kathies App.
- **`werkzeug/testpersonen.mjs`**: legt im Verzeichnis des Test-Repos (Konto-Modul) an:
  - `admin`, `peter.a`, `peter.b` legt das Werkzeug selbst an (zufälliges Merkpasswort + Wiederherstellungscode) – nötig, weil nur ein angemeldeter Admin bzw. Elternteil Startcodes unterschreibt. Auf dem Gerät: Name + Passwort.
  - `lehrkraft`, `anna.a`, `anna.b`: Startcode vom Admin; `kathie.a`/`kathie.b`: Startcode von `peter.a`/`peter.b`. Auf dem Gerät: erste Anmeldung mit Startcode.
  - Gleiche Namen: Anmeldenamen eindeutig (.a/.b); Vor- und Nachname gleich („Kathie/Peter/Anna Beispiel“), nur das Geburtsdatum der Kinder unterscheidet (14.05.2017 / 03.09.2017) – trägt die Person in der App ein.
  - Ohne `--anlegen` nur ansehen. Mit `--anlegen` nur, was fehlt; gültige Startcodes bleiben, benutzte werden vermerkt, Codes mit weniger als 1 Tag Rest werden neu ausgestellt.
  - Startcodes, Passwörter, Wiederherstellungscodes nur in `%LOCALAPPDATA%\bis-school-app\testinstanz\testpersonen.json` und `.txt`, nach jeder Änderung sofort geschrieben (Abbruch verliert kein Passwort). Die Ausgabe wird auf diese Geheimnisse geprüft; Token geschwärzt.

## Belege
- `tests/testinstanz.test.mjs` (8 Tests): Bau + Suchlauf; Umwandlung Zeile für Zeile (außer Präfixen nur erklärte Zeilen geändert); Gegenproben je Prüfung des Suchlaufs (jedes verbotene Wort einzeln, in App und Manifest); Abbruch bei geänderten Stellen und Namensgleichheit; Bau mit verbotenem Wort schreibt nichts.
  - **Node-Sandbox:** Kathies Einträge (`bq2_*`, `bq_schluessel`, `gh_token`) auf derselben Ablage, zwei Runden geübt: gelesen nur `bqt…` (Zähler ab Skriptbeginn), geschrieben nur `bqt_…`, Kathies Einträge unverändert, Token nur in `bqt_gh`, Kathies Name und Stand nicht sichtbar. Gegenprobe: derselbe Testbau ohne Umwandlung liest `bq2_session` und zeigt Kathies Stand.
  - **Browser (Chromium):** gebaute Testinstanz startet ohne Fehler, Titel „(Test)“, Fach öffnet per echtem Klick; nur `bqt` gelesen und geschrieben, Kathies Einträge unverändert.
- `tests/testpersonen.test.mjs` (12 Tests, Simulation **und** GitHub-Nachbau): Liste; ansehen schreibt nichts; anlegen (3 Konten, 5 Einladungen, kein Name/Code/Passwort im Speicher, Geheimnisse nur in der Datei, Passwörter zufällig und stark); Codes funktionieren (Kinder hängen an ihrem Peter, Anna/Lehrkraft am Admin, Code nur einmal, Anmeldung mit Name + Passwort, Wiederherstellungscode passt); zweiter Lauf (nichts doppelt, benutzte vermerkt, nach Ablauf neue Codes, alte abgelaufen); Schutz (fremde Konten, geändertes Passwort, Abbruch mitten im Anlegen behält das Admin-Passwort); Ausgabe-Prüfung (Gegenprobe).
- **Gegenproben:** 17 absichtliche Fehler (`%TEMP%\opencode\gegenproben-testinstanz.mjs`), alle rot.
- **Echtes Repo, nur lesend:** `node werkzeug/testpersonen.mjs` gegen `pahlborn/bis-school-app-testdaten` → alle 8 „fehlt“, nichts geschrieben.
- Volle Reihe: siehe PR.

## Entscheidungen (Peter kann widersprechen)
- Schul-Namen werden in der Testinstanz ersetzt statt mit Familienpasswort verschlüsselt („ohne Familienpasswort“ bleibt). Neue Schul-Namen in `index.html` ohne Eintrag in der Ersatzliste brechen den Bau ab, sofern sie auf der Wortliste stehen.
- Gerätedaten bekommen ebenfalls `bqt_` (statt eines eigenen Präfixes) und gelten als geräteweit.
- Version steht in der Testinstanz im Klartext (sichtbar für Peter auf dem Testgerät).
- Admin und die beiden „Peter“ legt das Werkzeug an (Passwort lokal); die anderen bekommen Startcodes – so prüft die Probe beide Wege.
- Daten der Testinstanz auf oberster Ebene des Test-Repos (`TESTINSTANZ.wurzelDaten = ''`), getrennt von `laeufe/` der Probe.

## Offen / für die nächsten Aufgaben
- **Automatische Aktualisierung** liest in der Testinstanz `bqt_schluessel` (gibt es nicht) → keine Aktualisierung. Gehört zum Veröffentlichungsweg (eigene Aufgabe), braucht dort eine Klartext-Variante von `publishedVersion`.
- **Familien-Verbindung** (Anna ↔ Kind, zweites Gerät findet die Kinder) kommt mit „Einladungen“; Startlink-Format mit „Anmeldung im Testbau“. Danach `--anlegen` erst kurz vor Peters Probe (Codes gelten 7 Tage).
- Woher die Testinstanz Repo und Ordner kennt, legt „Anmeldung im Testbau“ fest; die Werte stehen in `TESTINSTANZ` (`repoDaten`, `wurzelDaten`).
