# 2026-11-02 – Stufe 2, P1: Modul krypto (nur Testbau, v61)

## Auftrag
Spezifikation S12, Phase P1 (EP6, US6.1–US6.6): Schlüssel und Verschlüsselung als abgeschlossenes Modul, einzeln ohne Browser testbar. Das Modul ist **nur im Testbau** (`module.json`: `bau: test`); die Live-App ändert sich nicht.

## Änderungen
- `src/module/krypto.mjs`: nur Web Crypto, kein Bildschirm, kein Speicher (alles Gespeicherte ist einfaches JSON mit Base64).
  - Inhalt: AES-256-GCM, zufälliger 96-Bit-Startwert je Eintrag, Zusatzdaten aus Bereich, Schlüsselversion und Eintrag (Vertauschen schlägt fehl).
  - Passwort: PBKDF2-SHA-256, 600 000 Runden, 16-Byte-Salz; Personenschlüssel (ECDH und ECDSA P-256) nur gesperrt gespeichert, an die Person gebunden, beim Öffnen nicht exportierbar, falsches Passwort = eine neutrale Meldung.
  - Verpacken eines Bereichsschlüssels für genau eine Person (ECDH, HKDF, AES-GCM); Fingerabdruck aus 6 Wörtern der Passwortliste, bei abweichendem Fingerabdruck wird nichts verpackt.
  - Unterschrift (ECDSA P-256); Schlüsselbund mit Versionen: Schlüsselwechsel ergibt eine neue Version nur für die verbleibenden Halter, frühere Versionen bleiben lesbar.
- `src/module/module.json`: `krypto` (Testbau) mit dem Browser-Test `testbau`, damit `npm run test:bereich -- krypto` beides läuft.
- `tests/app-hilfen.mjs`: `appServer({ bauart, anpassen })` startet die App wahlweise als Testbau, mit Prüfhaken.
- `package.json`: `tests/testbau.test.mjs` ist jetzt Teil von `npm test`.

## Tests
- `tests/module/krypto.test.mjs` (10 Tests, unter 1 s): Prüfwert AES-GCM gegen Node-`crypto` (unabhängige Umsetzung), PBKDF2 gegen bekannte Referenzwerte, US6.1–US6.6 (Vertauschen, Byte-Änderung, falsches Passwort, Dritter ohne Schlüssel, Unterschrift, Fingerabdruck, Widerruf: alt lesbar, neu nicht), kein `Math.random` im Modul.
- `tests/module/rahmen.test.mjs` (+1): Testbau setzt sich ohne Namenskonflikt zusammen; der Live-Bau enthält kein Stufe-2-Modul und keinen Stufe-2-Text (`sealEntry`, `wrapKeyFor`, `api.github.com`, `bqt_`).
- `tests/testbau.test.mjs` (Browser): Testbau startet ohne Fehler; Verschlüsseln, Sperren, Verpacken und Schlüsselwechsel liefern in Chromium dasselbe wie in Node, aktuelle Version nach dem Wechsel ist 2. Safari folgt im Feldtest (Konzept S12, D3).
- Live-Bau byte-gleich: SHA-256 der Live-App von `main` (nach Elternbereich A1, #59) und von diesem Zweig sind identisch (`bd415f0c…44f8f2`; vor dem Einmergen von `main` war es der Stand v58, `a4b02ce3…e5a0`).

## Gegenproben
Je ein absichtlicher Fehler im Modul, das Modul-Testfeld muss rot werden (alle 10 erkannt):

| Fehler | Ergebnis |
|---|---|
| Zusatzdaten ohne Schlüsselversion | rot |
| fester statt zufälliger Startwert | rot |
| PBKDF2 mit SHA-1 | rot |
| gesperrter Schlüssel nicht an die Person gebunden | rot |
| Fingerabdruck wird nicht geprüft | rot |
| kaputte Unterschrift gilt als gültig | rot |
| **Schlüsselwechsel nutzt den alten Schlüssel weiter** | rot (Grund: „no new data for the former holder“) |
| Halter liest fremde Versionen | rot |
| Schlüsselwechsel ohne neue Version | rot |
| Rundenzahl 600 000 geändert | rot |

Die Gegenprobe „alter Schlüssel“ war im ersten Anlauf falsch gebaut (der Fehler griff nie, der Test blieb zu Recht grün). Jetzt merkt sich `createKeyring` den Schlüssel und `rotateKeyring` verwendet genau diesen weiter; der Test schlägt an der richtigen Stelle an. Der Browser-Test bemerkt zusätzlich „ohne neue Version“ (Zusicherung auf Version 2 ergänzt) und „Halter liest fremde Versionen“.

## Zeiten
| Prüfung | Dauer |
|---|---|
| Modultests (krypto + rahmen, 15 Tests) | 0,3 s |
| Bereich `krypto` (Module + Browser-Test, gesamt mit Start) | 7 s |
| PBKDF2 600 000 Runden (Node, dieser Rechner) | ca. 90 ms |
| volle Reihe auf dem zusammengeführten Stand (260 Tests, `main` mit A1 eingemergt) | 218 s |
| volle Reihe davor (259 Tests, auf v58) | 223 s |

PBKDF2 im Browser (besonders Safari auf dem iPad) ist noch nicht gemessen; das gehört in den Feldtest und in P4.

## Befund am Rand (nicht Teil dieses PR)
Im ersten Lauf der vollen Reihe war `lernlogik.test.mjs` („hakt es noch (Requires support) … Aufgaben mit Hilfe“, Runde 2) einmal rot, im zweiten Lauf grün. Allein wiederholt: 1 von 40 Läufen rot (ca. 2,5 %), davor 8 von 8 grün. Ursache: `adaptRound` zieht aus vier zufälligen Rundenbauten; fehlen dort genug Aufgaben mit Hilfe, bleibt die Runde mit weniger als zwei (`index.html`, `adaptRound`). Der Fehler liegt in `main` (v58), nicht an diesem PR – die Live-App ist byte-gleich. Eigener kleiner PR nötig, sonst kann die volle Reihe sporadisch rot werden.
