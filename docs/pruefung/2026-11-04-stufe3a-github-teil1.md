# 2026-11-04 - Stufe 3a, Teil 1: GitHub-Speicher gegen einen nachgebauten Server (nur Testbau)

## Auftrag
Stufe 3, Teil a (Stufenplan, Neufassung 03.11.), Konzept 11 (Speicher-Anschluss) und 12 (GitHub-Speicher). Ein zweiter Speicher neben der Simulation: `githubSpeicher({ repo, token, fetch, now })` mit genau der Schnittstelle aus Konzept 11. Er besteht **dieselben Vertragstests** wie `lokalerSpeicher` (`tests/module/speicher-vertrag.mjs`, P3a #89).

Geprüft wird gegen einen **nachgebauten GitHub-Server** (Node `http` auf 127.0.0.1). Kein echtes Repo, kein Token, kein Netz. `index.html` ist unverändert; das Modul ist **nur im Testbau** (`module.json`: `bau: test`, nach `abgleich`). Teil 2 (Probe gegen das echte Repo `pahlborn/bis-school-app-testdaten`) folgt in einem eigenen PR.

## Änderungen
- `src/module/github.mjs` (neu; Import nur aus `speicher`):
  - `githubSpeicher({ repo, token, fetch, now, basis, zweig, wurzel })` → `{ geraet(id), anfragen() }`. `geraet(id)` liefert denselben Zugang wie die Simulation (alle zwölf Funktionen, alle asynchron). `anfragen()` zählt die Anfragen (`gesamt`, `unveraendert` = mit 304 beantwortet, je Methode) – für die Messung in Teil 2.
  - Zusätzlich zu `repo, token, fetch, now`: `basis` (API-Adresse; Tests: Nachbau), `zweig` (Vorgabe `main`), `wurzel` (Unterordner, z. B. je Testlauf in Teil 2). Alle Eingaben werden geprüft.
  - `GITHUB_TOKEN_SCHLUESSEL = 'bqt_gh'`, `githubTokenLesen(ablage)`, `githubTokenSpeichern(ablage, token)` – der Token der Testinstanz liegt nur unter `bqt_gh`.
  - `GITHUB_API`, `GITHUB_VERSUCHE = 4`. Alle Hilfsnamen beginnen mit `ghs`/`GHS_` (gemeinsamer Namensraum in der App).
- `src/module/speicher.mjs`: `SPEICHER_FEHLER` um `zugang` und `limit` ergänzt (nur ein echter Speicher meldet sie).
- `tests/module/github-nachbau.mjs` (neu): nachgebauter Server – `contents` (Datei/Ordner lesen, anlegen, ersetzen, löschen mit `sha`), `git/trees/{sha}?recursive=1`, ETag/304, Token-Pflicht (401), CORS wie api.github.com, Zähler und Protokoll aller Anfragen, einstellbare Störungen (Status mit Kopfzeilen, Verbindungsabbruch).
- `tests/module/github.test.mjs` (neu, 23 Tests): die 12 Vertragstests + 11 eigene (Ablage, nie überschreiben, 409/422, Fehler-Abbildung, offline je Funktion, ETag, Token-Schutz, `bqt_gh`-Suchlauf, Reinheit, Abgleich zweier Geräte über GitHub, Eingaben).
- `tests/testbau.test.mjs` (+1): der GitHub-Speicher im **Browser** (Chromium) gegen den Nachbau – `fetch` mit CORS, 304 kommt beim Modul an, base64 mit Umlauten und Emoji, Fehlercodes.
- `src/module/module.json`: `github` (Testbau, Browser-Test `testbau`).

## Ablage im Repo (Konzept 12, Bereichsnamen aus P3b)
| Pfad | Schreiben |
|---|---|
| `<wurzel>/events/<Bereich>/<Gerät>/<Nummer>.json` | nur neu anlegen (`PUT` ohne `sha`); vorhanden → `vorhanden` mit `gleicherInhalt` |
| `<wurzel>/keys/<Bereich>/<Halter>.json` | ersetzen erlaubt, mit `sha` der alten Fassung |
| `<wurzel>/directory/<Hash>.json` | nur neu anlegen; zweites Mal → `vorhanden` |
| `<wurzel>/invites/<Kennung>.json` | `{ angelegt, inhalt }`; 10 Minuten gültig; `get` löscht mit `sha` (genau einer bekommt sie) |

Inhalte stehen als JSON-Text in der Datei, wie sie übergeben wurden (beim Lesen base64 → UTF-8).

## Abfragen sparsam (Limit 5 000 je Stunde)
- **`list`** = eine Anfrage auf den Ordner `<wurzel>/events` mit `If-None-Match` (unverändert → 304, zählt nicht gegen das Limit). Nur wenn sich der eigene Bereich geändert hat, kommt sein Baum dazu (`git/trees/<sha>?recursive=1`). Ein Baum ändert sich nie; er wird je `sha` gemerkt.
- **Inhalte** einzeln (`contents`).
- **`put`** prüft die Vornummer nur einmal je Zugang; bekannte Nummern bleiben bekannt (Dateien werden nie gelöscht). Ein `put` nach dem anderen = 1 Anfrage.
- **Merker** = wie in der Simulation `{ bereich, stand: { Gerät: Anzahl } }` (= „bekannte Pfade“ in Kurzform). Gleiches Format ist nötig, weil `bereiche` `merker.stand` in `key_rotated` schreibt.
- **Gemessen (Nachbau, Test „Abgleich über GitHub“):** ein Abgleich mit Neuem 3–6 Anfragen (PUT + Ordner + Baum + je fremdem Bündel ein GET); ohne Neues **1 Anfrage, mit 304** (kostenlos). Zehnmal `list` ohne Änderung: 10 × 304, kein Baum.

## Fehler-Abbildung
| Fall | Code |
|---|---|
| Netz weg (fetch wirft), Server-Fehler 5xx | `offline` |
| Datei fehlt beim Lesen (404) | `unbekannt` – bzw. `null` (Verzeichnis) / `{}` (Schlüssel) / leere Liste, wie die Schnittstelle es sagt |
| 409/422 beim Anlegen, Datei liegt da | `vorhanden` (mit `gleicherInhalt` bei Bündeln) |
| 401, 403 ohne Limit-Angabe | `zugang` (neu) |
| 403 mit `x-ratelimit-remaining: 0` oder `retry-after`, 429 | `limit` (neu) mit `err.wartezeit` in ms (bis `x-ratelimit-reset`, sonst `retry-after`, sonst 60 s) |

## Token-Schutz
- Der Token steht nur im Kopf `Authorization: Bearer …`. Fehlermeldungen sind feste Texte (`speicher: <code>`); Texte der Antwort oder des Netzfehlers werden nie weitergegeben, auch keine `cause`.
- Test: alle Fehlerarten (inkl. eines `fetch`, das selbst Adresse und Kopfzeilen in seine Meldung schreibt) – weder Meldung, Stack, JSON, `util.inspect` noch irgendeine Eigenschaft nennt den Token. Auch nicht: Rückgaben, Speicher- und Zugangsobjekt, Export-Datei, Adressen, Inhalte der Anfragen, andere Kopfzeilen, Dateien im Repo.
- `bqt_gh`: `githubTokenLesen` nimmt nur diesen Eintrag; ein vorhandenes `gh_token` (Werkstatt-Apps) wird nicht genommen. **Suchlauf:** `index.html`, `src/module/*` und `werkzeug/*` enthalten das Wort `gh_token` nicht.

## Gegenproben (18, alle rot)
Skript: `%TEMP%\opencode\gegenproben-3a.mjs` (ändert `github.mjs` je Fall, lässt `github.test.mjs` laufen – beim Browser-Fall auch `testbau.test.mjs` – und stellt wieder her).

| # | Gegenprobe | rot in |
|---|---|---|
| 1 | Überschreiben erlaubt (Bündel mit `sha` ersetzt) | Vertrag „gleiche Nummer zweimal“, „nie überschrieben“, „409/422“ |
| 2 | ETag nicht genutzt | „ETag“, „Abgleich über GitHub“ |
| 3 | Token in Fehlermeldung (401) | „Token-Schutz“ |
| 4 | 422 nicht als `vorhanden` erkannt | Vertrag „gleiche Nummer zweimal“, „directory“, „Einladungen“ |
| 5 | `gh_token` gelesen | „Token nur aus bqt_gh“, „Reinheit“ |
| 6 | 409 ohne Datei nicht wiederholt | „409/422“ |
| 7 | Limit-Angaben ignoriert (403 → `zugang`) | „Fehler-Abbildung“ |
| 8 | 404 beim Schreiben → `unbekannt` | „Fehler-Abbildung“ |
| 9 | Lückenprüfung fehlt | Vertrag „laufende Nummer“, „Token-Schutz“ |
| 10 | Einladung nach Gebrauch nicht gelöscht | Vertrag „Einladungen“, „offline bei jeder Funktion“ |
| 11 | Merker nicht geprüft | Vertrag „list“ |
| 12 | base64 ohne UTF-8 (Schreiben) | „Ablage im Repo“ |
| 13 | dasselbe, mit Browser-Test | „Ablage im Repo“, Testbau „GitHub-Speicher im Browser“ |
| 14 | base64 lesen ohne UTF-8 | „Ablage im Repo“ |
| 15 | Baum bei jedem `list` neu geholt | „ETag“, „Abgleich über GitHub“ |
| 16 | 5xx → `ungueltig` statt `offline` | „Fehler-Abbildung“ |
| 17 | Token in der Adresse | „Token-Schutz“ |
| 18 | Netzfehler als `cause` weitergereicht | „Token-Schutz“ |

## Prüfung
- `npm run test:module`: 248/248 (nach Einmergen von `main` mit 3b-2b #122).
- `tests/testbau.test.mjs`: 6/6 (neu: GitHub-Speicher im Browser).
- Volle Reihe (`voll-testen.ps1`, eigener Arbeitsordner, nach Einmergen von `main` = e1505a2): **627/627** grün, 238 s.
- Live-Bau unverändert (`index.html` nicht angefasst; `rahmen.test`: kein `api.github.com`, kein `bqt_` im Live-Bau).

## Abweichungen und Entscheidungen (Peter kann widersprechen)
1. **404 beim Schreiben → `zugang`, nicht `unbekannt`.** Beim Anlegen heißt 404 „Repo oder Zweig mit diesem Token nicht erreichbar“ (ein fein eingeschränkter Token ohne Zugriff bekommt 404). `unbekannt` gilt beim Lesen.
2. **409 ist nicht immer `vorhanden`.** GitHub antwortet 409 auch, wenn gleichzeitig ein anderer Commit auf denselben Zweig kam. Darum nach 409/422 erst nachsehen: liegt die Datei da → `vorhanden`; sonst bis zu 4 Versuche, danach `offline` (der Abgleich versucht es später). So wird kein Bündel fälschlich als „schon da“ verbucht.
3. **5xx → `offline`.** Ein Server-Fehler ist vorübergehend; für den Abgleich ist das dasselbe wie „kein Netz“.
4. **Ordnerliste + Baum statt eines Baums des ganzen Repos.** Konzept 12 sagt „Verzeichnisbaum über die Git-Trees-Schnittstelle“. Der Baum des ganzen Repos ändert sich mit jedem Bündel jedes Bereichs und wächst ohne Ende. Darum: Ordner `events` (mit ETag, 304) nennt die `sha` je Bereich; nur der geänderte Bereich wird als Baum geholt. Beides ist dokumentierte GitHub-Schnittstelle.
5. **Einladungen tragen die Uhr des einladenden Geräts** (`angelegt`). Wie in der Simulation; eine falsch gehende Uhr verschiebt die 10 Minuten. Für die Testinstanz ausreichend; Alternative wäre das Commit-Datum (eine Anfrage mehr).
6. **Abgelaufene Einladungen bleiben liegen**, bis jemand `delete` aufruft – wie in der Simulation.
7. **`importFile` schreibt je Bündel einen Commit.** Bricht das Netz mitten im Einlesen ab, ist ein Teil eingelesen; ein zweites Einlesen ergänzt den Rest (nur Fehlendes wird geschrieben). Die Prüfung der ganzen Datei geschieht vorher – eine abgelehnte Datei schreibt nichts.
8. **Bereichsnamen mit `:` stehen so im Repo** (`events/kind:lern:p_k1/…`). Für GitHub kein Problem; ein Auschecken des Daten-Repos unter Windows ginge nicht (ist nicht vorgesehen).
9. **`fetch` mit `cache: 'no-store'`** und eigenem `If-None-Match`: der Browser reicht 304 an das Modul durch (im Chromium-Test belegt), es gibt keinen zweiten Zwischenspeicher. Safari prüft Teil 2 bzw. der Feldtest.

## Für Teil 2 (echtes Repo)
- Aufruf: `githubSpeicher({ repo: 'pahlborn/bis-school-app-testdaten', token, wurzel: 'laeufe/<Lauf>' })`, dann `speicherVertrag` dagegen (von Hand, nicht in `npm test`); danach den Unterordner löschen.
- Zu prüfen, was der Nachbau nicht zeigen kann: Verzögerung zwischen Schreiben und Lesen bei GitHub, echte 409 bei gleichzeitigen Commits, CORS/304 in Safari, Firmennetz (Proxy), tatsächliche Anfragen je Abgleich (`anfragen()`).
