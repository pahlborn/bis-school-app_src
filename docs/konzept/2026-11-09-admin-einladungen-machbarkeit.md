---
title: "Admin-Einladungen in der App - Technische Machbarkeit"
authors:
  - OpenCode
status: draft
file-version: "1.0"
created: 2026-11-09
last-updated: 2026-11-09
---

# Admin-Einladungen in der App - Technische Machbarkeit

## Version History

| Version | Date       | Author(s) | Summary of Changes |
|:--------|:-----------|:----------|:-------------------|
| 1.0     | 2026-11-09 | OpenCode  | Initial version |

## Executive Summary

Die heutige Sicherheitslogik fuer Erwachseneinladungen ist technisch schon weitgehend im App-Code vorhanden. Startcode, Geltigkeit, Einmalnutzung, Fingerabdruck, Link mit Zugangscode und spaetere erste Anmeldung muessen nicht neu erfunden werden. Fuer `Admin -> Elternteil` fehlt vor allem ein schlanker App-Pfad fuer Statusfuehrung und Oberflaeche, der bewusst ausserhalb der Familienlogik bleibt.

---

## Ergebnis

- **Machbarkeit:** Ja, Big Quest kann die Einladung eines Elternteils direkt in der App erzeugen.
- **Wiederverwendbarer Kern:** `src/module/konto.mjs` und `src/module/anmeldung.mjs` decken den Sicherheitskern bereits ab.
- **Saubere Trennung:** Der Admin-Pfad sollte nur das Konto anlegen und den Einladungsstatus im eigenen Personen-Bereich fuehren; `family_set` und Familienaufnahme bleiben Elternlogik.
- **Empfehlung:** Der naechste Schritt kann **direkt gebaut** werden. Ein separater technischer Spike ist fuer den Sicherheitskern nicht noetig.

## Kleiner Architekturvorschlag

### 1. Sicherheitskern unveraendert wiederverwenden

- `konto.startcodeAusstellen()` stellt bereits einen signierten Startcode mit 7 Tagen Gueltigkeit aus.
- `konto.startcodeAnsehen()` und `konto.ersteAnmeldung()` pruefen denselben Code spaeter ohne bzw. mit Verbrauch.
- `anmeldung.anmEinladungslink()` baut schon den kombinierten Link aus Zugangscode und Startcode.
- `anmeldung.anmQr()` und `anmeldung.anmEinladungMail()` erzeugen bereits QR-Code und teilbare Einladung.

### 2. Neuer, schlanker Admin-Einladungspfad

- Neuer App-Helfer fuer `Admin -> Elternteil`.
- Speicherung der Einladung **nur** im eigenen Bereich `person:<admin>` als `invite_set`.
- Payload wie heute bei Einladungen, aber nur fuer `art: 'parent'` im Adminfluss:
  - `invite`
  - `person`
  - `name`
  - `check`
  - `until`
  - `state`
- Statuslogik:
  - `open` = Einladung ausgestellt, noch nicht eingeloest
  - `done` = erster Login mit gueltigem Beweis im Verzeichnis erkannt
  - `expired` = Frist abgelaufen und noch nicht eingeloest
  - `withdrawn` = Admin hat die Einladung zurueckgezogen
- Keine `family_set`-, `anchor_set`- oder Familienbereich-Schritte im Adminpfad.

### 3. Erste Anmeldung bleibt bestehender Konto-Pfad

- Eingeladene Person oeffnet Link oder QR-Code.
- App uebernimmt zuerst den Zugangscode fuer das Geraet.
- Danach prueft sie den Startcode und fuehrt in das bestehende Passwort-/Erstanmeldungsformular.
- Spaetere weitere Geraete nutzen denselben Link weiter.

## Wiederverwendbare Bausteine

- `src/module/konto.mjs`
  - `startcodeAusstellen()` fuer signierte Startcodes inkl. `gueltigBis`, `pruef`, `fingerabdruck`
  - `startcodeAnsehen()` fuer Vorschau ohne Verbrauch
  - `ersteAnmeldung()` fuer Einmalnutzung, Ruecklegen bei Fehlern und Fingerabdruck-Pruefung
  - `kontoBeweisPruefen()` und `kontoStand()` fuer den spaeteren Nachweis, dass genau diese Einladung eingeloest wurde
- `src/module/anmeldung.mjs`
  - `anmEinladungslink()` fuer `#zugang=...&start=...`
  - `anmQr()` fuer QR-Ausgabe
  - `anmEinladungMail()` fuer eine teilbare HTML-Einladung
  - `anmLinkPruefen()` fuer den spaeteren Einstieg beim ersten Oeffnen des Links
- `src/module/ereignisse.mjs`
  - vorhandenes Eventformat `invite_set` mit den Statuswerten `open|done|withdrawn|expired`
- `src/module/bereiche.mjs`
  - `invite_set` liegt bereits fachlich im eigenen Personen-Bereich
- `index.html`
  - Admin-Bereich `Administration` ist schon vorhanden und damit der naheliegende Ort fuer die Minimal-UI

## Teile, die heute noch zu stark am Werkzeug haengen

- `werkzeug/testpersonen.mjs`
  - lokaler Stand in `testpersonen.json` / `testpersonen.txt`
  - HTML-Dateien unter `%LOCALAPPDATA%\bis-school-app\testinstanz\einladungen\`
  - Reset- und Testinstanzlogik fuer Repo und lokale Dateien
- Der heutige Werkzeuglauf uebernimmt Statusfuehrung teilweise ueber lokale Dateien statt ueber den Personen-Bereich in der App.
- Die Bootstrap-Ausnahme `aussteller: null` fuer den **allerersten Admin** bleibt ein Werkzeugpfad und ist nicht Teil dieser Aufgabe.

## Offene technische Huerden

1. **Die relevanten Module sind noch Testbau-only.**
   `konto`, `einladung`, `qrcode`, `qrlesen` und `anmeldung` stehen in `src/module/module.json` noch auf `bau: "test"`.

2. **Admin darf `invite_set` heute noch nicht schreiben.**
   `src/module/annahme.mjs` erlaubt `invite_set` derzeit nur fuer `parent`, nicht fuer `admin`.

3. **`src/module/einladung.mjs` ist heute familienzentriert.**
   Die bestehenden Helfer erwarten Elternkonto und Familienkontext. Fuer den Admin braucht es daher keinen Familienzweig, sondern einen kleinen separaten Helfer oder eine klar getrennte Erweiterung.

4. **Die Admin-Oberflaeche hat noch keinen Einladungsabschnitt.**
   `index.html` zeigt fuer Admins bereits `Kontenuebersicht`, `Zugangsdaten und Geraete` und Versionsinfos, verweist in den Hilfetexten aber noch explizit auf das Werkzeug am Rechner.

5. **Status muss von lokalem Werkzeugzustand in den App-Speicher wechseln.**
   Fuer den App-Pfad darf der Status nicht von lokalen HTML-Dateien abhaengen, sondern muss aus dem Personen-Bereich des Admins und aus dem Verzeichnis ableitbar sein.

## Minimale Admin-UI

- Abschnitt unter `Administration`, getrennt von `Kontenuebersicht`
- Formular mit nur dem noetigen Minimum:
  - Anmeldename
  - Aktion `Elternteil einladen`
- Nach dem Ausstellen:
  - QR-Code
  - Link
  - Gueltig bis
  - Statuszeile
  - Aktion `Zurueckziehen`
- Darunter eine kleine Liste `Offene Einladungen` / `Benutzt` / `Abgelaufen` / `Zurueckgezogen`

## Statusdaten, die die App sehen muss

- **Im Speicher / Personen-Bereich des Admins:**
  - Einladung-ID
  - Ziel-Person-ID
  - Anmeldename
  - Pruefschluessel (`check`)
  - Ablaufzeitpunkt
  - Zustand `open|done|withdrawn|expired`
- **Nur lokal / transient:**
  - aktuell angezeigter QR-Code
  - aktuell angezeigter Link
  - geoeffneter Dialog oder Abschnitt

Ein eigener lokaler Dateipfad ist fuer den Zielweg nicht mehr noetig.

## Empfehlung fuer den naechsten Auftrag

- **Direkt umsetzbar, kein separater Spike noetig.**
- Kleinster sinnvoller Zuschnitt fuer den Folgeauftrag:
  1. produktfaehigen Teil von `konto` / `anmeldung` / `qrcode` in den App-Bau heben
  2. Admin-Recht fuer `invite_set` ergaenzen
  3. schlanken Admin-Einladungshelfer ohne Familienlogik bauen
  4. kleine Admin-UI in `Administration` ergaenzen
  5. bestaetigen, dass `done` nur ueber Verzeichnis + Beweis erkannt wird

## Entscheidung in einem Satz

Admin-Einladungen fuer Elternteile koennen direkt in die App geholt werden, weil der Sicherheitskern schon vorhanden ist; neu gebaut werden muss nur ein kleiner, klar vom Familienfluss getrennter Admin-Status- und UI-Pfad.
