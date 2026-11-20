# PR194: Verbindungslink auf aktuellem main

Auftrag `BQ-EVAL-01-PR194-INTEGRATION-20261119-A1`, 19.11.2026.
Ausgeführt durch einen separaten Codex-Entwicklungsvertreter; keine Claude-/Monitor-Bestätigung.

Zweck: Unter „Weiteres Gerät verbinden“ lässt sich der bestehende Einladungslink
wieder auf demselben Bildschirm kopieren. Das unterstützt die erneute Verbindung
für Test15 ohne zweiten Bildschirm. Ein tatsächlicher iPad-/Test15-Lauf steht aus.

Quellen: ursprünglicher PR194-Kopf `268ccff87e240fc361bffa36fed61ba7085e0700`,
aktuelle Hauptbasis `66868a77c09bccc80c970cbc2fba144fae89dffa`,
[Auftrag in PR206](https://github.com/pahlborn/bis-school-app_src/pull/206#issuecomment-6975809715)
und [Abgleich 17.11., Abschnitt 5](2026-11-17-atlas-abgleich-evaluationen.md).
Der ursprüngliche PR enthielt sechs geänderte Dateien, darunter alte Versions-,
Release- und Workflowänderungen. Die Hauptbasis wurde mit `git merge --no-commit
--no-ff 66868a77c09bccc80c970cbc2fba144fae89dffa` in den ursprünglichen
PR194-Abkömmling integriert; der Merge war textuell konfliktfrei.

Die ursprüngliche UI-Änderung bleibt erhalten: schreibgeschütztes `kVerbLink`,
ausdrücklicher Knopf `kVerbCopy`, zugänglicher Status `kVerbCopyStatus` und
DE-/EN-Erklärung oberhalb des unveränderten QR-Codes. Link und QR verwenden
weiter denselben Wert aus `anmEinladungslink` und `anmZugangscode`; `anmQr`,
Anmeldung und Berechtigungen sind unverändert. Der Knopf markiert den gesamten
Link. Bei erfülltem Clipboard-Aufruf bestätigt er das Kopieren, bei fehlender
oder ablehnender Clipboard API zeigt er die manuelle Kopieraufforderung.

Alle Pfade außerhalb `index.html`, `tests/konto-einladungen-browser.test.mjs`
und dieses Berichts entsprechen exakt der Hauptbasis. Insbesondere wurden
`.github/workflows/`, `package.json`, `tests/version.test.mjs` und
`werkzeug/releases.mjs` auf deren Hauptbasis-Bytes zurückgesetzt. Die Version
bleibt `0.152.2-beta`; eine Anhebung über 0.152.3 ist eine spätere Phase.

Prüfung: Node `24.22.1`, vorhandenes Playwright `1.56.1`, Chromium
`156.0.8078.79`, keine Installation. Ausgeführt:

```sh
CHROMIUM_PATH=/usr/bin/chromium node --test --test-name-pattern='Browser: Kind anlegen' tests/konto-einladungen-browser.test.mjs
```

Ergebnis: **1 Test, 1 bestanden, 0 fehlgeschlagen, 0 übersprungen** (10,46 s).
Der bestehende Eltern-/Kind-/Einladungsablauf erreichte die zusätzlichen
Linkprüfungen. Geprüft wurden sichtbarer Link vor QR, schreibgeschütztes Feld,
bestehendes URL-Format, Link gleich QR-Inhalt, Statusrolle sowie vollständige
Textauswahl bei drei ausdrücklich synthetischen Clipboard-Proben: Erfolg,
fehlende API und abgelehnter Aufruf. Der Erfolgsstub erhielt den sichtbaren Link.

Gegenprobe: derselbe Test mit
`node --require /tmp/pr194-integration/main-html-preload.cjs --test --test-name-pattern='Browser: Kind anlegen' tests/konto-einladungen-browser.test.mjs`
und demselben `CHROMIUM_PATH`. Der temporäre Preload liest ausschließlich die
ursprüngliche Hauptbasis-HTML über `git show` und ersetzt deren `readFileSync`-
Antwort im Speicher; keine Quelldatei wurde für die Gegenprobe verändert.
Ergebnis: **1 Test, 0 bestanden, 1 erwarteter Fehler, 0 übersprungen** (9,67 s),
gezielt an `tests/konto-einladungen-browser.test.mjs:121`: fehlendes
Verbindungslink-Steuerelement. Eltern-/Kind-Einrichtung und QR-Anzeige waren
vorher erfolgreich erreicht; kein Schlüssel-/Fixture-/Setupfehler.

`git diff --check` und der Pfad-/Byteabgleich gegen die Hauptbasis bestanden.
Rohausgaben liegen nur temporär unter `/tmp/pr194-integration/`; im Bericht
stehen keine Zugangswerte. Kein lokaler Gesamtlauf, Build, echter Clipboard-
Berechtigungstest, Providerzugriff oder iPad-/WebView-Nachweis. Kein Push,
Main-Merge oder Veröffentlichung; unabhängige Prüfung, vollständige CI und
Peters Freigabe des genauen PR bleiben beim anschließenden Integrationsschritt.
