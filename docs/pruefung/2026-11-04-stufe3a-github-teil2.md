# 2026-11-04 - Stufe 3a, Teil 2: GitHub-Speicher gegen das echte Repo (Probe von Hand)

## Auftrag
Teil 2 von Stufe 3a: Der GitHub-Speicher aus Teil 1 (`src/module/github.mjs`, PR #123) läuft einmal gegen das **echte** private Repo `pahlborn/bis-school-app-testdaten` – mit den unveränderten Vertragstests, einem eigenen Unterordner je Lauf, der danach gelöscht wird. Probe aus dem Firmennetz (Laptop) und von zu Hause, Anfragen je Abgleich messen. **Nicht in `npm test`**, nicht veröffentlicht; `index.html` und `src/` unverändert.

## Änderungen
- `werkzeug/github-probe.mjs` (neu) – der Starter:
  - liest den Token aus `%LOCALAPPDATA%\bis-school-app\testdaten-token.txt` (anderer Pfad: `BQ_GH_TOKEN_DATEI`); der Token steht nie in der Umgebung der Tests, nie in einer Datei im Repo und nie in einer Ausgabe.
  - **Vorprobe:** Repo lesen, eine Datei schreiben. Sperrt das Netz das Schreiben (403 ohne Token-/Rechte-Meldung), meldet er das klar und bricht ab.
  - startet `tests/echt/github-echt.mjs` in einem eigenen Prozess mit dem Lauf-Ordner `laeufe/<Zeit>-<Ort>/`.
  - **räumt immer auf** (auch nach Abbruch der Tests): löscht den Lauf-Ordner in **einem** Commit über die Git-Data-API (Baum ohne diese Dateien → Commit → `main` vorspulen, ohne `force`; bei Gleichzeitigkeit bis 5 Versuche) und prüft danach, dass er weg ist. Löschen ist nur unter `laeufe/` möglich.
  - prüft die gesamte Ausgabe der Tests auf den Token (ganz und die letzten 12 Zeichen), schwärzt notfalls und wertet das als Fehler.
  - gibt die Messwerte aus (Anfragen je Test, je Abgleich, Status, Stundenlimit).
  - `--aufraeumen-alle` löscht den ganzen Ordner `laeufe/` (falls ein Lauf hart abgebrochen wurde).
- `tests/echt/github-echt.mjs` (neu; liegt bewusst nicht in `tests/module/`, damit `npm test` ihn nicht findet):
  - die **12 Vertragstests** aus `tests/module/speicher-vertrag.mjs`, unverändert, jeder frische Speicher in `laeufe/<Lauf>/s<n>`;
  - 4 eigene: Umlaute/Emoji und ETag (304) beim echten GitHub; Fehler (falscher Token → `zugang`, Repo außerhalb des Tokens → `zugang` beim Schreiben, Token nie in Fehlern; als fremdes Repo dient ein **nicht vorhandenes**, nie ein echtes); CORS für die App unter `pahlborn.github.io`; Abgleich Kind- und Eltern-Gerät mit Messung.
  - Schreibzugriffe gedrosselt (Vorrat 10, dann einer je 0,9 s ≈ 66 je Minute), weil GitHub höchstens 80 inhaltserzeugende Anfragen je Minute und 500 je Stunde zulässt.

## Ergebnis Firmennetz (Laptop, 04.11., 14:01)
**Bestanden: 16/16** (12 Vertragstests + 4 eigene), 242 s. Das Firmennetz lässt GitHub-API-Schreibzugriffe durch (anders als das Hochladen von Bildern über `git push`). Lauf-Ordner gelöscht (98 Dateien, ein Commit), nachgeprüft: weg. Token in der Ausgabe: nein.

| Messwert | Firmennetz |
|---|---|
| Anfragen gesamt | 344 (116 schreibend, 28 × 304) |
| Antworten | 200: 177, 201: 101, 304: 28, 401: 2 (falscher Token, gewollt), 404: 28, 409: 2, 422: 6 |
| 409 bei PUT (anderer Commit kam zuerst → wiederholt) | 2 – nur im Test „gleichzeitig dieselbe Nummer“ |
| Limit-Antworten (403/429) | 0 |
| Stundenlimit nach dem Lauf | 224 benutzt, 4 776 frei |
| **Abgleich mit Neuem** (Kind- oder Eltern-Gerät, 1–3 neue Ereignisse) | **3–4 Anfragen** (12 Abgleiche: 3, dann 11 × 4), Mittel **2,6 s** |
| Abgleich nur nachholen | 2 bzw. 1 Anfrage, Mittel 0,4 s |
| **Abgleich ohne Neues** | **1 Anfrage, immer 304** (zählt nicht gegen das Limit), Mittel 0,3 s |
| CORS | Preflight 204, `Access-Control-Allow-Origin: *`; `Authorization`, `Content-Type`, `If-None-Match`, `X-GitHub-Api-Version` erlaubt; `ETag`, `Retry-After`, `X-RateLimit-Remaining/-Reset` lesbar |

Anfragen je Test (Firmennetz): Schnittstelle 0 · put/get 9 · nur eigene 4 · gleiche Nummer 18 · Lücke 5 · list 35 (10 × 304) · keys 23 · directory 7 · Einladungen 21 · Export/Import 78 · drei Geräte 66 · undurchsichtig 6 · ETag 11 · Fehler 5 · CORS 0 (ohne Zähler) · Abgleich 56.

**Einordnung:** Ein Abgleich mit Neuem = 1 PUT + Ordner + Baum + je fremdem Bündel ein GET – wie im Nachbau gemessen. Ein PUT dauert bei GitHub rund 1,5–2 s (Commit), daher 2,6 s je Abgleich mit Neuem; ohne Neues 0,3 s. Bei einem Abgleich je Minute und Gerät ohne Neues kostet das nichts vom Stundenlimit; mit Neuem 4 Anfragen – 5 000 je Stunde reichen für eine Familie weit. Knapp wird eher die Grenze von **500 Schreibzugriffen je Stunde**: die App muss bündeln (macht `abgleich` schon: ein Bündel je Abgleich, höchstens 100 Ereignisse).

## Ergebnis zu Hause
*Steht aus – Peter führt die Probe zu Hause aus (Anleitung unten) und trägt die Werte hier nach.*

## Anleitung: Probe zu Hause
1. Im Repo-Ordner `bis-school-app_src`: `git pull` (Stand mit diesem PR).
2. Token-Datei wie auf dem Laptop: `%LOCALAPPDATA%\bis-school-app\testdaten-token.txt` (nur der Token, eine Zeile).
3. `node werkzeug/github-probe.mjs --ort zuhause` (dauert ca. 4 Minuten; braucht keine `node_modules`).
4. Letzte Zeile muss `ERGEBNIS: BESTANDEN` sein. Die Messwerte unter „--- Messung ---“ hierher übertragen.
5. Bricht ein Lauf hart ab (Fenster geschlossen), danach einmal: `node werkzeug/github-probe.mjs --aufraeumen-alle`.

## Gegenproben
| # | Gegenprobe | Ergebnis |
|---|---|---|
| 1 | Starter mit falschem Token (Datei über `BQ_GH_TOKEN_DATEI`) | bricht nach „Lesen: 401“ ab, Exit 1, falscher Token nicht in der Ausgabe |
| 2 | Repo außerhalb des Tokens (nicht vorhandenes Repo) | `zugang` beim Schreiben (Test „Fehler“) |
| 3 | Falscher Token im Modul | `zugang` bei `list` und `put` (Test „Fehler“) |

Die Gegenproben der Modul-Logik (18) stammen aus Teil 1 und gelten unverändert; die Vertragstests laufen hier unverändert gegen das echte Repo.

## Beobachtungen
- Echtes GitHub verhält sich wie der Nachbau: 422 beim zweiten Anlegen derselben Datei (ohne `sha`), 409 bei gleichzeitigen Commits, ETag/304 auf Ordnerlisten, Bereichsnamen mit `:` in Pfaden gehen (URL-kodiert).
- Kein Lesen „alter“ Stände direkt nach dem Schreiben beobachtet (alle Folge-`get`/`list` sahen das gerade Geschriebene).
- Jeder Lauf erzeugt Commits im Test-Repo (rund 116 + 1 zum Aufräumen). Das Repo bleibt inhaltlich leer (nur `README.md`), die Historie wächst.

## Restrisiko
- Nur ein Lauf aus dem Firmennetz; zu Hause steht aus.
- Browser: CORS ist geprüft (Kopfzeilen), der echte Lauf im Browser kommt mit dem nächsten Schritt von Stufe 3 (Testinstanz).
- Grenze 500 Schreibzugriffe je Stunde: zwei volle Probe-Läufe je Stunde gehen, mehr nicht.
