# Prüfbericht Stufe 3c – Veröffentlichungsweg der Testinstanz (04.11.2026)

Zweig `stufe3c-veroeffentlichungsweg`. Nur Werkzeug und Testinstanz: `index.html` und `src/module/*` unverändert, Live-Bau byte-gleich.
**Nicht veröffentlicht, kein Repo angelegt** – geprüft nur gegen lokale Ziel-Repos.

## Was neu ist
- **`werkzeug/testinstanz-veroeffentlichen.mjs`** (`npm run testinstanz:veroeffentlichen`), Gegenstück zu `werkzeug/veroeffentlichen.mjs`, ohne Verschlüsselung. Ziel: Repo `pahlborn/bis-school-app-test` (legt Peter an, Anleitung in `docs/veroeffentlichen.md` Abschnitt 5).
  - **Prüfungen vor dem Kopieren** (ein Fund → Abbruch, nichts kopiert):
    1. Ziel ist ein Git-Repo; `origin` (falls gesetzt) endet auf `bis-school-app-test`; im Ziel liegt keine verschlüsselte Hülle (= Kathies App).
    2. Quellstand ist kein Entwurf.
    3. `dist-test/` vollständig (5 Dateien).
    4. **Suchlauf aus #130** (`testinstanzPruefen`, jetzt 15 Prüfungen) noch einmal auf genau den Dateien, die kopiert werden: keine Schuldaten, keine Kennung/kein Startcode-Hash aus `konten.json`, kein Tresor, kein Salz des Familienpassworts, kein `bq2_`/`bq_`/Werkstatt-Token, verbotene Wörter in der ganzen App und im Manifest, Aktualisierung ohne Schlüssel, Testbau, Version, Name.
    5. `dist-test/` passt zum Quellstand (Nummer und Commit) – sonst „erst neu bauen“.
    6. Im Ziel liegt keine neuere Version (Geräte aktualisieren nur auf höhere Nummern).
    7. Ziel-Repo sauber. Nach dem `git pull` laufen 1–7 noch einmal (es könnte inzwischen eine neuere Fassung dort liegen).
  - Danach: geänderte Dateien schreiben, Commit „Big Quest Test vN: …“, Push, Prüfung „nicht mehr voraus“.
  - `--live-pruefen`: Version der veröffentlichten Seite (im Klartext) gegen `dist-test/` → „gleich“, „anders“, „nicht erreichbar“.
- **Selbst-Aktualisierung ohne Schlüssel** (`VERSION_AUS_KLARTEXT` in `werkzeug/testinstanz.mjs`): Die Umwandlung ersetzt in der Testinstanz `publishedVersion` (Kathies App entschlüsselt dafür den Tresor mit `bq_schluessel`) durch eine Fassung, die die Version im Klartext von der eigenen Seite liest. Alles andere bleibt wie in Kathies App (beim Start und beim Zurückkehren, höchstens alle 5 Minuten, nie mitten in einer Runde, kein Neuladen im Kreis). Damit entfällt `bqt_schluessel`; `GLOBAL_KEYS` beginnt jetzt mit `abgleich|abgleichVerworfen|gh`.
- Neue Suchlauf-Prüfung „Aktualisierung ohne Schlüssel“: genau eine `publishedVersion`, ohne Schlüssel/Tresor/Entschlüsseln, liest `APP_VERSION`.
- `testinstanzKontext` in `werkzeug/bauen.mjs`: Bau und Veröffentlichen prüfen gegen dieselben Listen.

## Belege
- `tests/testinstanz-veroeffentlichen.test.mjs` (7 Tests, ~15 s), alle gegen lokale Repos:
  - fünf Dateien kopiert, Commit mit Version, zweiter Lauf tut nichts, nächste Version nur mit geänderter Datei;
  - **Pull und Push** gegen ein lokales `bis-school-app-test.git`: kommt an, fremder Commit (README) vorher geholt; ein zweiter Klon mit älterer v7 holt beim Pull v8 und bricht ab, nichts gepusht;
  - Suchlauf: 9 Fälle (Schuldaten, Kennung aus `konten.json`, Tresor, Salz, `bq2_`, verbotenes Wort in App und Manifest, Aktualisierung mit Schlüssel, Hülle statt Testinstanz) → Abbruch, Ziel enthält weiter nur das README;
  - Entwurf, veraltetes `dist-test/` (andere Nummer, anderer Commit), fehlendes Icon, fehlendes `dist-test/`;
  - falsches Ziel: Kathies Repo (Hülle mit Tresor), `origin` = `bis-school-app`, `bis-school-app-testdaten`, `gt40-engine`; richtiges `origin` wird angenommen; unsauber, fehlend, kein Git-Repo;
  - Live-Prüfung: gleich, anders (mit Text), nicht erreichbar (404, kein Server);
  - **Browser (Chromium):** Gerät ohne jeden Schlüssel öffnet v7, die Seite liefert danach v8 → die App lädt sich selbst als `?v=8` neu, „Über“ zeigt v8; gelesen nur `bqt…`, kein Schlüssel auf dem Gerät, nur die eigene Adresse gefragt.
- `tests/testinstanz.test.mjs` angepasst (15 Prüfungen, Zeilenvergleich ohne `publishedVersion`, drei neue Gegenproben zur Aktualisierung, Abbruch wenn die Stelle in `index.html` sich ändert).
- **Gegenproben:** 15 absichtliche Fehler in Werkzeug und Umwandlung (`%TEMP%\opencode\gegenproben-testweg.mjs`), **15/15 rot** – u. a. ohne Suchlauf, ohne Versionsvergleich, ohne Remote-/Hüllen-Prüfung, ohne zweite Prüfung nach dem Pull, `copyFileSync` statt Inhaltsvergleich, Aktualisierung ohne `?t=` (Cache).
- Volle Reihe: siehe PR.

## Befund unterwegs
- `copyFileSync` übernimmt unter Windows die alte Änderungszeit. Ist die neue Fassung gleich groß (v7 → v8 ist es meist), hielt git sie für unverändert – nichts committet. Das Skript vergleicht darum den Inhalt selbst und schreibt die Dateien neu. (`werkzeug/veroeffentlichen.mjs` kopiert ebenso, dort aber eine verschlüsselte Hülle, deren Größe sich praktisch immer ändert – nicht angefasst.)

## Entscheidungen (Peter kann widersprechen)
- Ersetzung von `publishedVersion` im fertigen Text statt Änderung in `index.html` – Kathies App bleibt byte-gleich.
- Testinstanz hat dieselbe Versionsnummer wie `main` (kein eigener Zähler).
- Veröffentlichen der Testinstanz wie bei Kathies App nur nach Peters Freigabe, obwohl kein Schlüssel nötig ist.
- Ältere Fassung über einer neueren wird abgelehnt (Geräte würden sie nie holen).

## Offen
- Repo `pahlborn/bis-school-app-test` anlegen und Pages einschalten (Peter, Anleitung `docs/veroeffentlichen.md` Abschnitt 5) – erst wenn die Testinstanz mit „Anmeldung im Testbau“ und „Einladungen“ bereit ist.
- Anleitung für Peters kurze Probe, Prüfbericht E1–E6, E10 auf echten Geräten (M4).
