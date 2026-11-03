# Veröffentlichen – Regeln, Ablauf, Notzugang

Stand 03.11.2026, Vorgabe Peter.

## 1. Wer darf veröffentlichen
- **Jeder Agent auf Peters Rechner**, aber **nur nach Peters ausdrücklicher Freigabe** im Chat, z. B. „Freigabe: veröffentlichen“. Ohne Freigabe wird nicht veröffentlicht.
- Ausnahme: **Datenschutz-Korrekturen** veröffentlicht die Koordinations-Sitzung sofort und meldet es.
- **Agenten in der Cloud** (z. B. Claude Code im Browser, Zweige `claude/…`) können nicht veröffentlichen. Der gemerkte Schlüssel liegt nur auf Peters Rechner, von Windows geschützt. Das ist gewollt. Siehe Abschnitt 4.
- Veröffentlicht wird immer der **ganze Stand von `main`**. Vorher klären, ob dort Pakete anderer Sitzungen liegen, die noch nicht live sollen.

## 2. Ablauf (Agent auf Peters Rechner)
Nie im gemeinsamen Hauptordner bauen – andere Sitzungen arbeiten dort.
1. Eigener Arbeitsordner auf dem neuesten `main`:
   `git fetch` · `git worktree add --detach <Ordner> origin/main` · `node_modules` per Junction (`cmd /c mklink /J <Ordner>\node_modules "C:\dev\Peters Bastelbude\alignment\node_modules"`).
2. Volle Testreihe im Arbeitsordner, alles grün:
   `powershell -File %TEMP%\opencode\voll-testen.ps1 -Repo <Ordner>` (Ergebnis `%TEMP%\opencode\full-<Ordnername>.txt`) oder `npm test` mit `CHROMIUM_PATH`.
3. Bauen: `node werkzeug/verschluesseln.mjs` im Arbeitsordner. Die Ausgabe muss „Prüfungen bestanden“ und eine Version **ohne** „-entwurf“ zeigen.
4. Veröffentlichen:
   `node werkzeug/veroeffentlichen.mjs --ziel "C:\dev\Peters Bastelbude\bis-school-app" --text "<kurz, was neu ist>"`
   Prüft noch einmal, kopiert, committet „Big Quest vN: …“, pusht und prüft, dass der Push angekommen ist.
5. Prüfen:
   - `gh run list -R pahlborn/bis-school-app -L 1` → `success`
   - `node werkzeug/verschluesseln.mjs --live-pruefen` → „gleich“
   - `node werkzeug/live-durchlauf.mjs` (mit `CHROMIUM_PATH`) → „LIVE vN OK“
6. Arbeitsordner entfernen (Junction vorher mit `cmd /c rmdir` lösen), kurze Meldung an Peter, Stand in die Übergabenotiz.

## 3. Notzugang – veröffentlichen ohne diesen Rechner
Der gemerkte Schlüssel ist nur eine Abkürzung. Er entsteht immer wieder aus dem **Familienpasswort** und dem Salz in `werkzeug/salz.json`.

**Was Peter dafür braucht**
- das Familienpasswort (im Passwortspeicher),
- einen Rechner mit Git, Node.js und Zugang zu den Repos `pahlborn/bis-school-app_src` (privat) und `pahlborn/bis-school-app`.

**Schritte**
1. Beide Repos klonen.
2. Im Quell-Repo `npm install`.
3. `node werkzeug/verschluesseln.mjs --passwort`
   - Das Skript fragt das Familienpasswort ab.
   - Es prüft, dass es die veröffentlichte Seite öffnet; dann bleiben alle Geräte angemeldet.
   - Es baut `dist/`.
4. `node werkzeug/veroeffentlichen.mjs --ziel <Pfad zum Klon von bis-school-app> --text "…"`.
5. Ohne Startcodes auf dem Rechner entfällt `live-durchlauf.mjs`. Stattdessen die Seite selbst öffnen und anmelden.

**Probe des Notzugangs (einmal, auf diesem Rechner):** `node werkzeug/verschluesseln.mjs --passwort --ziel %TEMP%\notprobe` ausführen und das Familienpasswort eingeben. Erwartet wird „Abgleich: Der Schlüssel öffnet die veröffentlichte Seite“. Danach den Ordner `%TEMP%\notprobe` löschen. Veröffentlicht wird dabei nichts.

**Wenn das Familienpasswort verloren ist:** Mit einem neuen Passwort neu veröffentlichen (`--passwort`, neues Passwort). Alle Geräte müssen es danach einmal eingeben. Daten auf den Geräten bleiben erhalten.

## 4. Später: Veröffentlichen aus der Cloud (frühestens nach Stufe 5a)
- **Idee:** Der Schlüssel liegt als Geheimnis bei GitHub. Ein Ablauf auf GitHub baut und veröffentlicht, aber erst nach Peters „Genehmigen“.
- **Risiko:** Der Schlüssel öffnet die ganze App. Heute stecken darin noch Konten und Schulbewertungen. Ein Agent mit Schreibzugriff könnte den Ablauf so ändern, dass der Schlüssel abfließt.
- **Schutz, bevor es gebaut wird:**
  1. Erst nach Stufe 5a: keine Personendaten mehr im Code.
  2. Geheimnis nur in einer geschützten Umgebung, die Peters Genehmigung verlangt und nur von `main` läuft.
  3. Änderungen an den Abläufen (`.github/`) nur mit Peters Prüfung (Regel für den Zweig `main`).
  4. Nach jedem Verdacht: Familienpasswort wechseln (Abschnitt 3).
  5. Der Notzugang aus Abschnitt 3 bleibt unabhängig davon bestehen.
