---
title: "Pruefbericht - Wiederherstellung Erfolgspfad (2026.0008.US1.T1)"
authors:
  - OpenCode
status: draft
file-version: "1.0"
created: 2026-11-08
last-updated: 2026-11-08
---

# Pruefbericht - Wiederherstellung Erfolgspfad (2026.0008.US1.T1)

## Version History

| Version | Date       | Author(s) | Summary of Changes |
|:--------|:-----------|:----------|:-------------------|
| 1.0     | 2026-11-08 | OpenCode  | Initial version |

## Executive Summary

Der beobachtete "Kreis" laesst sich im heutigen Stand reproduzierbar auf den Schritt nach dem neuen Passwort eingrenzen. Die Wiederherstellung selbst klappt: Ein neuer Wiederherstellungscode wird erzeugt, und `Weiter` meldet danach in denselben Erwachsenen-Account ein. Der Erfolgspfad bricht aber davor sichtbar ab, weil die App zwischen erfolgreichem Passwortwechsel und Login noch die Code-Seite erzwingt.

---

## Repro

### Testaufbau

- Testbau in der Node-Sandbox mit gemeinsamem Kontospeicher wie in `tests/konto-anmeldung.test.mjs`.
- Realistisches Erwachsenen-Konto: Admin anlegen, danach Eltern-Konto `peter.a` ausstellen und einmal im Speicher registrieren.
- Frisches Geraet: neuer Sandbox-Lauf ohne vorhandene Sitzung.

### Ablauf

1. Auf dem frischen Geraet `I'm a parent or teacher` waehlen.
2. `Passwort vergessen?` oeffnen.
3. Benutzername `peter.a (Wiederherstellungscode)` eingeben.
4. Geltigen Wiederherstellungscode eingeben.
5. `Weiter` klicken.
6. Neues starkes Passwort waehlen.
7. `Speichern` klicken.

## Soll / Ist

### Erwarteter naechster Bildschirm

Nach Schritt 7 ist der Erwachsene direkt wieder im eigenen Account, also im normalen Erfolgspfad nach dem Login.

### Tatsaechlicher naechster Bildschirm

Nach Schritt 7 erscheint **nicht** der eingeloggte Erwachsenenbereich, sondern die Seite `Ihr Wiederherstellungscode` mit:

- neuem Code in `#recCode`
- Knopf `Weiter`
- noch keiner gesetzten Erwachsenen-Sitzung

## Zusatzpruefungen

- **Neuer Wiederherstellungscode sichtbar:** ja
- **Fuehrt `Weiter` wieder zur Vergessen-Seite zurueck:** nein
- **Fuehrt `Weiter` in den Account:** ja, danach ist derselbe Erwachsene angemeldet

## Technischer Abbruchpunkt

Der sichtbare Erfolgspfad endet in `index.html` nach erfolgreichem `anmWiederherstellen(...)` an dieser Stelle:

- `index.html:5646` -> `renderKontoCode(a, k.wiederherstellungscode, ()=>loginDone(a));`

Damit wird nach erfolgreicher Wiederherstellung erst die Code-Seite angezeigt; `loginDone(a)` laeuft erst nach einem weiteren Klick auf `Weiter`.

## Beleg durch Tests

- **Aktueller Ist-Pfad gruen:** `node --test --test-name-pattern "3 Passwort vergessen" tests/konto-anmeldung.test.mjs`
  - Belegt: neuer Code wird gezeigt; `Weiter` meldet ein; kein technischer Rueckfall auf `Passwort vergessen?`.
- **Produkt-Erwartung rot:** `node --test tests/wiederherstellung-erfolgspfad.test.mjs`
  - Erwartet: nach `Speichern` sofort angemeldet.
  - Aktuell rot, weil stattdessen zuerst `Ihr Wiederherstellungscode` erscheint.

## Fazit

Der Fehler ist als Produktfehler reproduzierbar beschrieben: Die Wiederherstellung scheitert nicht technisch, aber der Login-Erfolg wird durch einen zusaetzlichen Zwischenschritt unterbrochen. Der gefuehlte Kreis entsteht genau zwischen erfolgreichem Passwortwechsel und `loginDone`.
