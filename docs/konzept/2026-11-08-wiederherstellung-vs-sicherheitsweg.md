---
title: "Wiederherstellung vs. Sicherheitsweg"
authors:
  - OpenCode
status: draft
file-version: "1.0"
created: 2026-11-08
last-updated: 2026-11-08
---

# Wiederherstellung vs. Sicherheitsweg

## Version History

| Version | Date       | Author(s) | Summary of Changes |
|:--------|:-----------|:----------|:-------------------|
| 1.0     | 2026-11-08 | OpenCode  | Initial version |

## Executive Summary

Diese Entscheidungsnotiz klärt, ob `Passwort vergessen` unter dem heutigen Kryptomodell zu einem bequemen Alltagsweg mit alten Schlüsseln umgebaut werden sollte oder ob der bestehende Schlüsselwechsel fachlich richtig bleibt. Ergebnis: Der kryptografische Sicherheitsweg soll bleiben. Getrennt werden soll nur der Nutzungsfluss, damit erfolgreiche Wiederherstellung direkt zu einer gültigen Sitzung führt und die Sicherheitsfolgen erst danach erklärt werden.

---

## Ergebnis

- **Empfehlung:** Den fachlichen Zielweg **nicht** in einen bequemen Wiederherstellungsweg mit alten Schluesseln und einen spaeteren Sicherheitsweg aufteilen.
- Unter dem heutigen Kryptomodell bleibt `konto.wiederherstellen()` der **Sicherheitsweg**: neuer Passwortsatz, **neuer Wiederherstellungscode, neue Personenschluessel**.
- Der Alltagsfluss soll stattdessen **nur in der Oberflaeche** getrennt werden: nach erfolgreicher Wiederherstellung direkt angemeldet, Sicherheitsfolgen danach klar erklaert.

## Befund im Code

- `src/module/konto.mjs` koppelt `wiederherstellen()` heute bewusst an `ktoErneuern()`; `schluesselErneuern()` nutzt denselben Kern.
- Dabei entsteht immer ein neuer Verzeichniseintrag mit **neuem `pub`**, neuem Wiederherstellungscode und `alt` fuer den Uebergang (`src/module/konto.mjs`).
- `src/module/geraeteabgleich.mjs` erwartet dieses `alt`, kuendigt die neuen Schluessel in allen Bereichen an und verteilt danach neue Bereichsschluessel.
- `src/module/einladung.mjs` und `src/module/geraete.mjs` bauen bereits auf genau diesem Wechselmodell auf.

## Warum die gewuenschte Trennung kryptografisch nicht direkt traegt

Der Komfortweg

- Wiederherstellungscode eingeben,
- neues Passwort setzen,
- **alte Personenschluessel behalten**

waere im Code zwar klein baubar: `konto.mjs` hat mit `ktoNeuerStand()` bereits den Mechanismus fuer einen neuen Stand mit **gleichem** `pub`.

Er oeffnet aber die alte Sicherheitsluecke wieder:

- Alte Verzeichnisstaende bleiben im Speicher und in der Git-Historie erhalten.
- Wenn ein alter Stand noch dieselben Personenschluessel enthaelt, reicht **altes Passwort oder alter Wiederherstellungscode plus alte Kopie**, um diese Personenschluessel weiter zu oeffnen.
- Weil die Bereichsschluessel fuer dieselbe Person weiter auf dasselbe `pub` verpackt sind, koennen mit diesen alten Personenschluesseln auch **neue** Inhalte gelesen werden.
- Bereits angemeldete andere Geraete behalten ihren lokalen Schluessel sowieso und lesen ebenfalls weiter.

Damit waere der Komfortweg fachlich **kein neutraler Alltagsweg**, sondern die ausdrueckliche Ruecknahme des Schutzes, der am 05.11. fuer `wiederherstellen()` eingefuehrt wurde.

## Folgen je Variante

### A. Heutiger Sicherheitsweg beibehalten

- Wiederherstellungscode + neues Passwort erzeugen neue Personenschluessel.
- Neuer Wiederherstellungscode ist noetig.
- Andere Geraete muessen sich spaeter mit dem neuen Passwort neu anmelden.
- Alte Passwoerter, alte Wiederherstellungscodes und alte Geraetekopien lesen nichts Neues mehr.

### B. Komfortweg mit alten Schluesseln bauen

- Kleinste Codeaenderung: neuer eigener Pfad in `konto.mjs`, technisch nahe bei `ktoNeuerStand()`, **ohne** `ktoErneuern()`, **ohne** `alt`, **ohne** Schluesselankuendigung in den Bereichen.
- Andere Geraete koennten einfach weiterlaufen; kein neuer Fingerabdruck, kein Bereichswechsel, keine Sync-Folgen.
- Der Preis: altes Passwort/alter Code plus alte Kopie bleiben kryptografisch weiter gefaehrlich; bereits angemeldete Geraete bleiben voll wirksam.

## Kleinste akzeptable Ersatzloesung

Wenn der Produktweg die Trennung trotzdem erzwingen will, ist die kleinste ehrliche Ersatzloesung:

- **Komfortweg explizit als schwacher Weg** bauen:
  - neues Passwort,
  - direkte Anmeldung,
  - **kein** neuer Wiederherstellungscode,
  - **keine** neuen Personenschluessel.
- Dazu in Texten und Abnahme klar festhalten: dieser Weg stellt nur den Zugang fuer den legitimen Nutzer wieder her, **raeumt aber keinen moeglichen Altzugriff ab**.

Das ist fachlich nur dann tragbar, wenn diese Abschwaechung bewusst akzeptiert wird.

## Empfehlung fuer die Umsetzung

- **Zu bauen:** Variante A.
- `Passwort vergessen` bleibt kryptografisch ein Sicherheitsweg.
- Die geforderte Trennung wird in der UX umgesetzt:
  - nach erfolgreicher Wiederherstellung sofort in eine gueltige Sitzung,
  - danach klarer Hinweis: neuer Wiederherstellungscode sichern, andere Geraete spaeter neu anmelden.
- Der separate manuelle Sicherheitsweg bleibt `Schluessel erneuern` bzw. geraetbezogen `Geraet entfernen`; er hat denselben Kryptoeffekt, aber einen anderen Ausloeser.

## Entscheidung in einem Satz

Unter dem bestehenden Kryptomodell ist die fachlich sichere Zielentscheidung: **Wiederherstellung bleibt ein Schluesselwechsel; getrennt wird der Nutzungsfluss, nicht die Kryptologik.**
