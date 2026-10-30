# Grade 3 – Big Quest – Quelle (privat)

Learning game for a Grade 3 child at an IB school (Primary Years Programme), built from the class topics. The app names no class, school, teachers or places (S8, 30.10.2026).

Dieses Repo ist **privat** und enthält die App im Klartext (`index.html`, Manifest, Icons). Öffentlich erscheint sie nur **verschlüsselt** im Repo `bis-school-app` unter https://pahlborn.github.io/bis-school-app/. Wer die Seite aufruft, sieht zuerst eine Passwortabfrage.

## Veröffentlichen

1. Die App ändern (`index.html`).
2. Im Terminal, im Ordner dieses Repos:

   ```
   node werkzeug/verschluesseln.mjs
   ```

   Danach liegt die fertige Seite in `dist/`.
3. Den Inhalt von `dist/` ins Repo `bis-school-app` übernehmen (ersetzen) und pushen. Beim ersten Mal sind die Icons dabei – das Firmennetz blockt Bild-Uploads, also von zu Hause.

### Passwort und gemerkter Schlüssel

- Beim **ersten Lauf** auf einem Rechner fragt das Skript das Passwort zweimal verdeckt ab (mindestens 20 Zeichen, z. B. vier zufällige Wörter). Das Passwort wird nie gespeichert.
- Danach **merkt es sich den daraus berechneten Schlüssel** in `%LOCALAPPDATA%\bis-school-app\schluessel.json` – außerhalb des Repos, mit Windows (DPAPI) geschützt, nur unter diesem Windows-Konto lesbar.
- **Ab dann läuft es ohne Passwort.** Vorher prüft es, ob der Schlüssel die veröffentlichte Seite öffnet; wenn nicht (Passwort anderswo geändert), bricht es ab.
- Passwort ändern: `node werkzeug/verschluesseln.mjs --passwort` – danach müssen sich alle Geräte einmal neu anmelden; das Skript warnt vorher.
- Schlüssel vergessen: `node werkzeug/verschluesseln.mjs --vergessen`.

Das Skript bricht ab und schreibt nichts, wenn
- das Passwort zu kurz ist,
- der gemerkte Schlüssel die veröffentlichte Seite nicht öffnet,
- außerhalb des verschlüsselten Blocks ein Wort aus `werkzeug/verbotene-woerter.txt` steht,
- die Probe-Entschlüsselung nicht Byte für Byte die App ergibt.

## Auf dem Gerät

- **Anmelden:** Passwort eingeben, „Auf diesem Gerät angemeldet bleiben“ ist vorgewählt. Gespeichert wird nur der abgeleitete Schlüssel, nie das Passwort.
- **Abmelden:** https://pahlborn.github.io/bis-school-app/#abmelden öffnen.
- **iPad/iPhone:** Die Home-Bildschirm-App hat einen eigenen Speicher – dort einmal extra anmelden.
- **Neues Passwort:** einfach neu verschlüsseln und veröffentlichen. Geräte fragen dann einmal neu. Sterne bleiben erhalten.

## Aufbau

| Datei | Zweck |
|---|---|
| `werkzeug/kern.mjs` | Verschlüsselung: PBKDF2-SHA256 (600.000 Runden) + AES-256-GCM |
| `werkzeug/bauen.mjs` | baut `dist/` und prüft es |
| `werkzeug/verschluesseln.mjs` | Aufruf: gemerkter Schlüssel oder verdeckte Passwortabfrage |
| `werkzeug/schluesselablage.mjs` | merkt den Schlüssel (nicht das Passwort) außerhalb des Repos, DPAPI-geschützt |
| `werkzeug/huelle.html` | öffentliche Anmeldeseite; entschlüsselt im Browser (muss zu `kern.mjs` passen) |
| `werkzeug/manifest.webmanifest` | neutrales Manifest für die öffentliche Seite |
| `werkzeug/salz.json` | Salt, nicht geheim, bleibt fest (sonst müssen sich alle Geräte nach jedem Update neu anmelden) |
| `werkzeug/verbotene-woerter.txt` | was im öffentlichen Teil nie stehen darf |

## Tests

```
npm test
```

Der Browser-Test braucht Playwright (`npm install`). Fehlt der passende Chromium-Build:

```
$env:CHROMIUM_PATH="$env:LOCALAPPDATA\ms-playwright\chromium-1223\chrome-win64\chrome.exe"; npm test
```
