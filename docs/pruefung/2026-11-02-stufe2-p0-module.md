# 2026-11-02 – Stufe 2, P0: Modulrahmen und erste Module (v58)

## Auftrag
Peter (02.11.): „Wir müssen so entwickeln, dass wir in sich abgeschlossene Module bauen und testen können.“ Konzept: Vault „Module und Tests – Konzept“; Spezifikation S12, Phase P0.

## Änderungen
- `werkzeug/module.mjs`: setzt `src/module/*.mjs` an der Marke `/*BQ_MODULE*/` in die App (eine Datei bleibt). Regeln: nur benannte Exporte, Importe nur zwischen Modulen, kein Name doppelt (auch nicht mit `index.html`), Marke genau einmal; Bauart `live`/`test` (Stufe-2-Module nur im Testbau).
- `src/module/module.json`: Reihenfolge, Bauart, zugeordnete Browser-Tests.
- `src/module/passwort.mjs`: `PW_WORDS`, `PW_BASES`, `pwSuggest(zufall)`, `pwWeak` (aus `index.html` verschoben, Zufall übergebbar).
- `src/module/rechte.mjs`: `normAccounts`, `isGrantActive`, `activeGrantFor`, `expireGrants`, `isParentOf`, `visibleKids` (reine Funktionen, Tag wird übergeben). `index.html` behält Speicher, Protokoll und Anzeige (`grantsExpire`, `myGrantFor`, `viewerGrant`, `myKids` rufen das Modul).
- `werkzeug/bauen.mjs` und alle Tests lesen die App über `appLesen()` (mit Modulen).
- `werkzeug/testen.mjs`: `npm run test:bereich -- <modul…>` = Modultests + zugeordnete Browser-Tests; `npm run test:module` = nur Modultests.

## Tests
- Neu `tests/module/` (17 Tests, ca. 0,3 s): `passwort` (aus dem Browser verlegt, jetzt 10 000 Vorschläge und 25³ Kurzwort-Kombinationen), `rechte` (Rechtematrix mit zwei namensgleichen Familien, Lehrkraft, Admin, Testkind; Ablauf, letzter Tag), `rahmen` (Einsetzen, Testbau, CRLF, alle Regelverstöße).
- `stufe1-p3`: die zwei Logik-Tests über den Browser-Haken entfallen (jetzt in Node).
- Gegenproben im Modul `rechte`, alle in Sekunden rot: Lehrkraft zählt als Elternteil; Lehrkraft bekommt Kinder aus der Zuordnung; letzter Tag zählt nicht; Testkind für alle; Ablauf mehrfach gemeldet. Der erste Fall wurde zunächst nicht erkannt (doppelte Sicherung über `normAccounts`); ein direkter Test der zweiten Sicherung wurde ergänzt.

## Zeiten
| Prüfung | Dauer |
|---|---|
| Modultests | 0,3 s |
| Bereich `rechte passwort` (Module + 6 Browser-Dateien) | 31 s |
| volle Reihe (247 Tests) | 216 s |

Volle Reihe läuft jetzt mit verhindertem Ruhezustand (zwei frühere Läufe brachen durch den Ruhezustand ab).
