# S11 Stufe 1 – P1 Kontenmodell v2 und Sicherung (02.11.2026)

Spezifikation: Vault „S11 Stufe 1 – Eindeutige Personen und Zuordnung“, Abschnitte 3.1, 3.2, 3.4, 3.8 (Phase P1). Freigabe zur Umsetzung durch Peter am 02.11.

## Umgesetzt

**Kontenmodell v2** (`werkzeug/konten.json`, `werkzeug/konten.mjs`):
- Jede Person hat eine feste, zufällige Kennung (`p_` + 26 Zeichen, 128 Bit).
- Eltern-Kind-Beziehungen stehen in `guardians` und verweisen nur auf Kennungen.
- Startcode-Hashes bleiben erhalten, niemand muss neu beginnen.
- Die echte `konten.json` ist umgestellt (`migrieren`); die alte Fassung liegt außerhalb des Repos.
- **Befund B3 behoben:** Das Konto `admin` ist nicht mehr Elternteil von Kathie. Peter sieht Kathie über `peter`; als Admin wirkt das voll erst mit P3, weil dort auch B1 behoben wird.
- Lehrkraft-Zuordnungen stehen übergangsweise in `teacherOf`, bis P4 die Freigaben bringt. Heute gibt es kein Lehrkraft-Konto.

**Bauprüfung:** Der Bau bricht ab bei
- doppelter Kennung oder doppeltem Anmeldenamen,
- unbekannter Kennung in einer Beziehung,
- Lehrkraft als Elternteil,
- Version ≠ 2,
- Startcode im Klartext.

**Werkzeug:**
- Neue Befehle: `neu <name> kind|erwachsen [--lehrkraft] [--admin] [--test]`, `eltern`, `eltern-entfernen`, `startlink`, `migrieren`. `liste` zeigt Kennungen gekürzt.
- `startlink` erzeugt einen neuen Startcode als Link (`…/#start=<name>.<code>`) und als QR-Code (HTML/SVG in `%LOCALAPPDATA%\bis-school-app\`). Die QR-Bibliothek steckt nur im Werkzeug (einmal `npm install --prefix werkzeug --no-save qrcode@1.5.4`), nicht in der App. Hinweis: Das Firmennetz lehnt den Push einer zusätzlichen `package.json` ab (HTTP 403); deshalb wird die Bibliothek ohne eingecheckte Paketdatei installiert.

**App:**
- Liest Konten v2 (`normAccounts`); die übrige Logik ist unverändert.
- Ein Startlink füllt die Anmeldung einmal aus und entfernt den Code sofort aus der Adresse.
- **Sicherung:** Kapitel „💾 Sicherung“ und eine Zeile „Letzte Sicherung“ in der Übersicht – nur für Eltern des angezeigten Kindes.
  - Sichern erzeugt eine Datei mit allen Speicherstellen des Kindes (ohne Passwörter, Sitzungen, Geräteschlüssel), allen Aufnahmen und einer SHA-256-Prüfsumme. Die Schlüssel stehen ohne Geräte-Präfix in der Datei, damit sie auch nach dem Umzug auf Kennungen (P2) passt.
  - Zurückspielen prüft Format, Kind und Prüfsumme, zeigt eine Vorschau mit Zählung, ersetzt den Stand und erlaubt einmal „Rückgängig“.
- Elternanleitung um „Sicherung“ und „Startlink“ ergänzt.

**Speicherstellen-Verzeichnis** `werkzeug/speicherstellen.json`: jede Stelle mit Bereich, künftiger Abgleichart und Sicherungs-Zugehörigkeit.

## Prüfung

- `tests/stufe1-p1.test.mjs` (8 Tests):
  - Umstellung v1 → v2 (Reihenfolge, Hashes, B3, Lehrkraft);
  - Bauprüfung in fünf Fehlerfällen;
  - 2 000 Kennungen ohne Wiederholung; Startlink-Form;
  - echte `konten.json` gültig und ohne Klartext-Codes;
  - Speicherstellen vollständig (K11); Sicherung genau nach Verzeichnis;
  - Startlink in der App;
  - **K6** mit echten Klicks: Sicherung mit 210 Antworten und einer Aufnahme → frisches Gerät → Zurückspielen gleich; veränderte Datei und Datei eines anderen Kindes abgelehnt; Rückgängig; Admin und Lehrkraft sehen keine Sicherung.
- Angepasst: Test-Konten werden mit `ausV1` umgestellt (anmeldung, schule, begruessung). Die Kapitelliste im Elternbereich enthält jetzt „💾 Backup“. Die Prüfung der Kontenliste nutzt die v2-Fehlerfälle.
- Gegenprobe (7 von 7 rot):
  - Sicherung ohne Elternprüfung;
  - ohne Prüfsumme;
  - ohne Kind-Prüfung;
  - Startlink-Code bleibt in der Adresse;
  - Passwörter in der Sicherung;
  - Admin wird Elternteil;
  - Lehrkraft als Elternteil erlaubt.
- `npm test`: 217 bestanden.

## Nächster Schritt

**Peter:** Auf Kathies iPad mini – in der App vom Home-Bildschirm, nicht in Safari – im Elternbereich „💾 Sicherung → Jetzt sichern“ und die Datei aufbewahren. Erst danach wird P2 (Umzug auf Kennungen) veröffentlicht.
