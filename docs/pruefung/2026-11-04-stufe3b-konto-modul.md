# 2026-11-04 - Stufe 3b, Aufgabe "Konto-Modul" (nur Testbau)

## Auftrag
Stufe 3b, erste von drei Aufgaben (Vault: "Stufe 3b - Anmeldung auf allen Geraeten"). Konzept 8.2, 10.2, 10.3, 10.6 ("Jetzt: eigene Konten"), 11, 12; US9.1-US9.4. Reine Logik ohne Oberflaeche, geprueft gegen die Simulation **und** den nachgebauten GitHub-Server (gleicher Vertrag). `index.html` unveraendert; Kathies echte App (Live-Bau) ist byte-gleich zu `main` (Pruefsumme verglichen).

**Erfolgskriterium (alle erfuellt, je Speicher):** Zwei Geraete - Anmeldung auf dem zweiten nur mit Anmeldename und Passwort, gleicher Stand. Startcode zweimal benutzt -> abgelehnt; nach 7 Tagen -> abgelehnt. Zwei Familien mit gleichen Namen bleiben getrennt.

## Aenderungen
- `src/module/konto.mjs` (neu, Testbau, nach `geraeteabgleich`; Importe nur `krypto`, `passwort`; Hilfsnamen `kto`/`KTO_`):
  - `kontoName`, `kontoLookup` (Hash des Anmeldenamens), `kontoKennung`
  - `startcodeAusstellen({ zugang, aussteller, anmeldename, art, now })` -> `{ code, kennung, anmeldename, art, gueltigBis }`
  - `ersteAnmeldung({ zugang, code, passwort, now })` -> geoeffnetes Konto + Wiederherstellungscode (Erwachsene) + Aussteller mit Fingerabdruck
  - `anmelden({ zugang, anmeldename, passwort })` -> geoeffnetes Konto
  - `wiederherstellen({ zugang, anmeldename, code, neuesPasswort })` -> geoeffnetes Konto + **neuer** Wiederherstellungscode
  - `kontoPersonen(...konten)` -> `personen` fuer `geraetAbgleichen` (Geraet eintragen, Bereiche holen)
  - Konstanten `KONTO_ARTEN`, `KONTO_AUSSTELLER`, `KONTO_FEHLER`, `KONTO_STARTCODE_MS` (7 Tage), `KONTO_SALZ`, `KONTO_NAME`, `KONTO_STAENDE_MAX`, `KONTO_RUNDEN_MAX`
  - Optionen `runden` (PBKDF2; Vorgabe 600 000, Tests weniger) und `rand` (Zufall).
- `src/module/speicher.mjs`, `src/module/github.mjs`: `invite.put(id, inhalt, { gueltigMs })` - eigene Gueltigkeit **bis 7 Tage** (`SPEICHER_EINLADUNG_MAX_MS`), ohne Angabe wie bisher 10 Minuten. GitHub schreibt `{ angelegt, gueltig, inhalt }`; Dateien ohne `gueltig` (bisherige) gelten weiter 10 Minuten. Neu `speicherEinladungGueltig` (gemeinsame Pruefung).
- `src/module/krypto.mjs`: `unlockPersonKeys(..., { exportierbar })` - nur zum Neu-Sperren beim Wiederherstellen; danach verworfen. Auf dem Geraet bleibt immer eine **nicht exportierbare** Kopie.
- `tests/module/konto.test.mjs` (neu, 29 Tests, 12 davon je Speicher doppelt), `tests/module/speicher-vertrag.mjs` (+1 Vertragstest: Einladung mit eigener Gueltigkeit, laeuft fuer Simulation und GitHub), `tests/testbau.test.mjs` (+1: Konto-Modul im Browser gegen den GitHub-Nachbau, 600 000 Runden).
- `src/module/module.json`: `konto` (Testbau, Browser-Test `testbau`).

## So liegt es im Speicher
| Was | Wo (GitHub, Konzept 12) | Inhalt |
|---|---|---|
| Konto | `directory/v<SHA-256>.json` (einmal anlegen) | `{ v, lookup, kennung, art, pub, gesperrt }` - `gesperrt` = Personenschluessel, gesperrt mit Passwort (Schloss 1) und bei Erwachsenen mit dem Wiederherstellungscode (Schloss 2) |
| Neues Passwort | `directory/v<SHA-256>-<n>.json`, n = 2, 3, ... (einmal anlegen) | `{ v, lookup, stand, kennung, pub, gesperrt, sig }` - unterschrieben mit dem Personenschluessel; der gueltige mit dem groessten n zaehlt |
| Startcode | `invites/s<SHA-256 des Codes>.json`, 7 Tage | verschluesselt mit einem Schluessel aus dem Code: Anmeldename, Kennung, Art, Aussteller (Kennung, Art, oeffentliche Schluessel), unterschrieben vom Aussteller |

Hash des Anmeldenamens: SHA-256 ueber `bq-verzeichnis|<festes App-Salz>|<name>`; Name klein geschrieben, ohne Leerzeichen am Rand (wie heute bei der Anmeldung). Regeln fuer Namen wie in `konten.json` (3-20 Zeichen, a-z 0-9 . -).

## Ablaeufe
- **Startcode ausstellen (US9.2):** Admin -> Eltern, Lehrkraft, Admin; Elternteil -> Kind; sonst `nicht-erlaubt`. Nur der allererste Admin kommt ohne Aussteller (vom Werkzeug). Ist der Name schon vergeben -> `name-vergeben`.
- **Erste Anmeldung:** Code holen (damit verbraucht) -> Inhalt oeffnen und Unterschrift pruefen -> Passwortregeln (mit Namen) -> neue Personenschluessel, sperren, Verzeichnis anlegen. Zweimal -> `startcode-ungueltig`; nach 7 Tagen -> `startcode-abgelaufen` (die Einladung wird dabei geloescht).
  - Schwaches Passwort oder Speicherausfall: der Code wird **zurueckgelegt** (gilt bis zu seinem Ende weiter).
  - Antwort verloren (angelegt, aber "offline" gemeldet): derselbe Code mit demselben Passwort schliesst ab - mit **neuem** Wiederherstellungscode (der erste wurde nie gezeigt).
- **Anmeldung auf neuem Geraet (US9.3):** Verzeichnis lesen -> neuestes Schloss -> mit dem Passwort oeffnen -> Schluessel gegen die oeffentlichen Schluessel pruefen (Unterschrift und Entpacken) -> `kontoPersonen` -> `geraetAbgleichen` (traegt das Geraet ein, holt die Bereiche). Falscher Name und falsches Passwort: gleiche Meldung `anmeldung`, gleiche Anfragen (2 Verzeichnis-Lesungen), gleiche Arbeit (einmal PBKDF2).
- **Wiederherstellungscode (US9.4, Erwachsene):** Code oeffnet Schloss 2 -> neu sperren mit neuem Passwort und **neuem** Code -> neuer Stand. Alter Code und altes Passwort oeffnen danach nicht mehr. Kinder: kein Code (`anmeldung`); bei ihnen gibt der Elternteil einen neuen Start-QR-Code (Aufgabe "Einladungen").

## Belege (Tests)
| Test | Speicher | Ergebnis |
|---|---|---|
| E2: zweites Geraet nur mit Name und Passwort; gleiche Kennung, Schluessel, gleicher Stand im Personen-Bereich; Geraet eingetragen; neues Geraet schreibt, erstes bekommt es | beide | gruen |
| Startcode einmal; 7 Tage (kurz davor ja, genau danach nein); Code nie im Speicher, keine Einladung bleibt liegen | beide | gruen |
| Wer ausstellt (4 x 4 Arten); ohne Aussteller nur Admin; Aussteller kommt mit Fingerabdruck | beide | gruen |
| Name vergeben (beim Ausstellen, bei zwei Codes fuer einen Namen) | beide | gruen |
| Schwaches Passwort, Speicherausfall, verlorene Antwort | beide | gruen |
| Gefaelschte Startcodes (veraendert, falsche Unterschrift, Kind ohne Aussteller, Lehrkraft stellt aus, laenger als 7 Tage; untergeschobener Schluessel -> anderer Fingerabdruck) | beide | gruen |
| E5-Suchlauf: kein Anmeldename, Passwort, Startcode, Wiederherstellungscode im Speicher (GitHub: ganzer Repo-Inhalt) | beide | gruen |
| Falscher Name / falsches Passwort: gleiche Meldung und Anfragen; gleiche Dauer (300 000 Runden) | beide / Sim. | gruen |
| Untergeschobene Schloesser (fremder Schluessel, fremde Unterschrift, Muell); Schloss mit anderen Schluesseln trotz echter Unterschrift; zu wenige Runden | beide | gruen |
| Wiederherstellen: Eingabe klein/ohne Striche; neuer Code; alter Code und altes Passwort ungueltig; Code ist kein Passwort | beide | gruen |
| Zwei Familien mit gleichen Namen und gleichen Passwoertern: getrennt, kein Schluessel beim anderen | beide | gruen |
| 600 000 Runden: Node erste Anmeldung (Erwachsener) ~240 ms, zweites Geraet ~80 ms; Chromium 249 ms / 84 ms | Sim. / Nachbau | gruen |

Testbau 7/7. **Volle Reihe 661/661** (343 s, `main` = 5ced6af unveraendert). Ein erster Lauf zuvor: 654/661 - alle 7 roten waren `page.goto`-Zeitueberschreitungen unter Last (558 s statt ~240 s; about, altlasten, ableitung-vergleich, elternbereich-b1/c1/d1, themen), einzeln 20/20 gruen; keiner beruehrt das Konto-Modul.

## Gegenproben (29, alle rot)
Skript `%TEMP%\opencode\gegenproben-konto.mjs` (aendert je Fall eine Stelle, laesst den passenden Test laufen, stellt wieder her). Eine Gegenprobe blieb zuerst gruen ("Startcode 6 statt 7 Tage" - der Test rechnete mit der Konstante des Moduls); der Test prueft jetzt feste 7 Tage.

Hash ohne Salz · Name im Eintrag · Code nach Erfolg zurueckgelegt · 6 statt 7 Tage · keine Ablaufpruefung im Inhalt (Speicher 8 Tage) · Eltern stellen Eltern aus · ohne Aussteller jede Art · Unterschrift des Ausstellers nicht geprueft · Aussteller-Regel beim Lesen nicht geprueft · eigene Meldung fuer falschen Namen · falscher Name ohne PBKDF2 · falscher Name mit einer Anfrage weniger · Schluessel-Gegenpruefung aus · Unterschrift neuer Stand nicht geprueft · neuere Staende ignoriert · alter Wiederherstellungscode bleibt · schwaches Passwort verbraucht den Code · Speicherausfall verbraucht den Code · verlorene Antwort nicht erkannt · Geraet bekommt exportierbare Schluessel · Mindestzahl Runden nicht geprueft · Code-Eingabe nicht vereinheitlicht · Passwortregel aus · Code als Passwort · Simulation ignoriert Gueltigkeit · GitHub schreibt Gueltigkeit nicht · GitHub liest Gueltigkeit nicht · Gueltigkeit ohne Obergrenze · Konto nicht im Testbau.

## Entscheidungen (Peter kann widersprechen)
1. **Startcode als Einladung mit 7 Tagen:** Konzept 12 sagte "Einladungen verfallen nach 10 Minuten". Der Speicher kann jetzt je Einladung eine Gueltigkeit bis 7 Tage annehmen; ohne Angabe bleibt es bei 10 Minuten.
2. **Neues Passwort = weiterer Verzeichniseintrag**, unterschrieben vom Personenschluessel. Das Verzeichnis bleibt "nur einmal anlegen" (kein Ueberschreiben).
3. **Inhalt des Startcodes verschluesselt** mit einem Schluessel aus dem Code; die Kennung der Einladung ist ein Hash des Codes. Wer nur den Speicher sieht, liest keinen Namen.
4. **Startcode 22 Zeichen (128 Bit)** - fuer QR-Code und Link, nicht zum Abtippen. **Wiederherstellungscode 20 Zeichen** in 5 Vierergruppen ohne 0/O/1/I/L (~99 Bit); Eingabe egal ob klein, mit oder ohne Striche.
5. **Bei der Anmeldung zaehlt nur das Passwort**, nicht der Wiederherstellungscode - sonst waere der Code ein zweites Passwort, das nie wechselt.
6. **Fehlgeschlagene erste Anmeldung legt den Code zurueck**; verlorene Antwort wird mit demselben Code und Passwort abgeschlossen (neuer Wiederherstellungscode).
7. **Der erste Admin** bekommt seinen Code vom Werkzeug (ohne Aussteller); alle anderen Codes tragen die Unterschrift des Ausstellers.
8. **Art des Kontos steht lesbar im Verzeichnis** (wie Konzept 12). Der Speicherbetreiber sieht damit, dass es Kinderkonten gibt, aber nicht welche Namen.

## Restrisiken
- **Alte Kopie des Speichers:** Beim neuen Passwort bleibt der Personenschluessel gleich. Wer eine alte Kopie hat (z. B. Git-Historie) und das alte Passwort bzw. den alten Code kennt, oeffnet das alte Schloss. Abhilfe nur mit neuem Personenschluessel (Konzept 8.4, US9.7).
- **Schreibzugriff auf den Speicher:** Wer neuere Eintraege loescht, macht in der App das alte Passwort wieder gueltig (gleiche Ursache). Wer einen Namen zuerst anlegt, blockiert ihn (wie bisher bei jedem Schreibzugriff: Daten loeschen ist moeglich).
- **Namen raten:** Wer den Speicher hat, kann pruefen, ob es einen bestimmten Anmeldenamen gibt (Namen sind leicht zu raten). Inhalte bleiben verschluesselt.
- **Startcode und Aussteller:** Ein Code beweist nicht allein, wer ihn ausgestellt hat. Wer jemandem einen selbst gebauten QR-Code unterschiebt, erscheint mit seinem Schluessel als Aussteller. Schutz: Fingerabdruck pruefen (Konzept 8.3) - `ersteAnmeldung` liefert ihn mit; die Pruefung gehoert zur Aufgabe "Einladungen".

## Fuer die naechsten Aufgaben
- **"Anmeldung im Testbau":** Startlink/QR aus `code` bauen; nach `ersteAnmeldung` den Wiederherstellungscode zeigen (Passwortspeicher, Datei); "Passwort vergessen" = `wiederherstellen`; nach jeder Anmeldung `geraetAbgleichen` mit `kontoPersonen(konto)`. Die App ruft mit `runden` = Vorgabe (600 000) auf.
- **"Einladungen":** Das Konto kennt heute nur die Person und ihren eigenen Bereich. **Kinder, Schueler und der Anker (Gruender-Elternteil) eines Kontos sind noch nicht im Speicher** - ein zweites Geraet findet sie erst, wenn "Einladungen" diese Verbindungen als Ereignis in den Personen-Bereich schreibt (neuer Typ, Eintrag in `BEREICH_JE_TYP`). Fuer ein Kind ist der Anker der Aussteller aus dem Startcode (mit Fingerabdruck).
- **"Passwort des Kindes neu setzen"** (neuer Start-QR-Code, neues Schluesselpaar) braucht einen Stand mit **neuer** `pub`, unterschrieben vom Elternteil. Heute nimmt das Modul nur Staende mit gleicher `pub` an (`ktoNachtragOk`).
- Auf dem iPad sind 600 000 Runden langsamer als im Laptop-Browser - Probe in 3c.
