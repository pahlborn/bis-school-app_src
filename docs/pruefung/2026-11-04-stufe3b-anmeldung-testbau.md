# 2026-11-04 - Stufe 3b, Aufgabe "Anmeldung im Testbau" (nur Testbau)

## Auftrag
Stufe 3b, zweite von drei Aufgaben (Vault: "Stufe 3b - Anmeldung auf allen Geraeten"). Konzept 10.2-10.6, US9.2-US9.4. Die Oberflaeche des Testbaus meldet ueber das Konto-Modul (#127) an statt ueber `konten.json`:
- erste Anmeldung mit Startlink oder QR-Code (bzw. Name + Startcode getippt) -> eigenes Passwort -> Wiederherstellungscode (Erwachsene): als eigener Eintrag im Passwortspeicher, Felder gekennzeichnet, zusaetzlich als Datei ueber das Teilen-Menue;
- weiteres Geraet: Anmeldename + Passwort;
- "Passwort vergessen?" (Erwachsene): Wiederherstellungscode -> neues Passwort -> neuer Code.

Kathies App (Live-Bau) aendert ihr Verhalten nicht: Suchlauf - im Live-Bau steht kein Konto-, GitHub- oder Anmeldemodul, nicht einmal deren Funktionsnamen.

## Wann der Konto-Modus gilt
`KONTO_UI` = Testbau (Modul `anmeldung` vorhanden) **und** ein Speicher an der neuen Marke `/*BQ_SPEICHER*/null` **und** keine `konten.json`. Sonst bleibt alles wie bisher - auch alle bisherigen Testbau-Tests (ohne Speicher) und der Testbau mit `konten.json`.
- Testinstanz: `{ art: 'github', repo, wurzel }` (Zugang `bqt_gh`, einmal je Geraet auf der Anmeldeseite eingeben); Tests geben die Simulation oder den GitHub-Nachbau.
- Der Bau der Testinstanz (`werkzeug/testinstanz.mjs`) setzt die Marke **noch nicht** - siehe "Offen".

## Aenderungen
- `src/module/anmeldung.mjs` (neu, Testbau, nach `konto`; Namen `anm`/`ANM_`): Startlink lesen/bauen (`#start=<name>/<code>[/<fingerabdruck>]`), eigener Eintrag des Codes im Passwortspeicher (`<name> (Wiederherstellungscode)`, EN `(recovery code)`) und zurueck zum Anmeldenamen, Datei mit dem Code, Geraeteliste -> Konten v2, Punkte einer Anleitung ersetzen; dazu der **einzige Weg** von `index.html` zu `konto` und `github` (`anmZugang`, `anmVersuch`, `anmErstesMal`, `anmWiederherstellen`, `anmName`, `anmTokenNoetig`, `anmTokenSpeichern`).
- `index.html`:
  - `KONTO_SPEICHER` (Marke), `APP_ACCOUNTS = normAccounts(konten.json) || kontoKontenStart()` (Geraeteliste), `KONTO_UI`; `accountsOn`/`evKonten`/`dropOldKeys` gelten im Konto-Modus auch vor der ersten Anmeldung.
  - Anmeldeseite: Zugang zum Testspeicher (nur Testinstanz ohne Zugang), Hilfe fuer den Konto-Modus, Knopf "Passwort vergessen?" (Kind: Hinweis auf neuen Startcode).
  - Ablauf: `kontoLoginAbsenden` (Startcode fuer Namen ohne Konto -> Passwort waehlen; sonst `anmelden`, falsche Rolle = falsches Passwort), `kontoErstesPasswort`, `renderKontoCode` (Code anzeigen, Formular fuer den Passwortspeicher, Datei), `renderKontoVergessen` + `kontoWiederPasswort`, `kontoAngemeldet` (Geraeteliste, Konten der App, Schluesselkopie).
  - Schluesselkopie: IndexedDB `bq2_konto` (nicht exportierbare Schluessel); "Abmelden" loescht alle, "Elternbereich schliessen" die des Erwachsenen; meldet sich ein anderes Kind an, verlaesst der Schluessel des vorigen Kindes das Geraet (Konzept 10.4).
  - Geraeteliste `bq2_kontoListe` (Kennung, Anmeldename, Art - kein Passwort, kein Schluessel), geraeteweit (`GLOBAL_KEYS`).
  - Texte: Willkommen, Passwort-Seite, Anleitungen (Kind, Eltern, Lehrkraft, Admin; DE/EN) ersetzen im Konto-Modus nur die betroffenen Punkte (`KONTO_GUIDE`); Kathies App behaelt ihre Texte.
- `werkzeug/testpersonen.mjs`: die lokale Datei nennt zu jedem Startcode den Startlink.
- `tests/app-sandbox.mjs`: Option `globale` (Speicher, `File`, `navigator.share` vor dem Start).

## Belege
| Test | Was |
|---|---|
| `tests/module/anmeldung.test.mjs` (7) | Startcode/Startlink, Eintrag im Passwortspeicher, Datei (nur ASCII), Geraeteliste, Anleitung ersetzen |
| `tests/konto-anmeldung.test.mjs` (8, Node-Sandbox, ~7 s) | **1** Erwachsener: Startlink -> Rolle -> Passwort -> Code (Formular, Datei ueber Teilen-Menue) -> Elternbereich; Startcode verbraucht; falscher Name = falsches Passwort; **zweites Geraet** nur Name + Passwort, gleiche Kennung; Abmelden. **2** Kind: Startcode getippt, kein Code, ueben unter der Kennung, "Who's here?", Geschwister wechseln (Schluessel), zweites Geraet, falsche Rolle. **3** Passwort vergessen auf einem anderen Geraet (Passwortspeicher-Eintrag des Codes), falscher Code, neuer Code, drittes Geraet: altes Passwort und alter Code gelten nicht. **3b** abgelaufener / unbekannter Startcode, Speicher offline; Startlink mit falschem Fingerabdruck des Ausstellers -> Warnung, nichts eingerichtet, mit richtigem -> eingerichtet (Pruefung aus "Einladungen", #131). **4** Zugang zum Testspeicher. **5** Suchlauf Live-Bau, Testbau ohne Speicher und mit `konten.json` unveraendert. **6** Anleitungen. **7** umgewandelte Testinstanz (`bqt_`): nur `bqt_` geschrieben, Kathies Eintraege unveraendert |
| `tests/konto-anmeldung-browser.test.mjs` (1, Chromium, GitHub-Nachbau) | Bedienwege und Kennzeichnung: Startcode sofort aus der Adresse, Zugang, `username`/`current-password`/`new-password`, Code-Eintrag mit `name="username"`/`name="password"` in einem Formular, Download der Datei, Formular verschwindet nach dem Sichern, Schluessel in IndexedDB **nicht exportierbar**, Neuladen bleibt angemeldet, Abmelden loescht die Schluessel, zweites Geraet, "Passwort vergessen?" |
| `tests/testpersonen.test.mjs` (+1 Pruefung) | Startlink je Startcode in der lokalen Datei |

**Befund der vollen Reihe (behoben):** 15 % der Passwort-Vorschlaege ("Judo-Anchor-Key-2947") haben genau 22 Zeichen und sahen damit aus wie ein Startcode - bei vertipptem Namen fuehrte das zu "Eigenes Passwort waehlen" statt "stimmt nicht" (zufaellig rot im ersten Lauf). Jetzt gilt die Form "Woerter-Zahl" nie als Startcode (5 000 Vorschlaege und 5 000 echte Codes im Test).
Ausserdem in der vollen Reihe angepasst: `tests/stufe1-p4.test.mjs` liest die Anleitungen jetzt auch in der Form `kontoTexte(\`...\`, ...)`; `werkzeug/speicherstellen.json` kennt `bq2_kontoListe` und IndexedDB `bq2_konto`.

**Gegenproben:** 26, alle rot (`%TEMP%\opencode\gegenproben-anmeldung.mjs`). Zwei waren zuerst gruen und haben Luecken **in den Tests** gezeigt (Browser wartete mit einem Versprechen statt mit dem Ergebnis; Geschwister-Test meldete vorher ab) - beide Tests korrigiert, danach rot.

## Entscheidungen (Peter kann widersprechen)
- Startlink fuehrt zuerst zur **Rollenwahl** (Peter, 30.10.), danach ist das Formular ausgefuellt; Startlink-Format `#start=<name>/<code>[/<fingerabdruck>]` (Namen wie `peter.a` enthalten Punkte, darum `/`).
- Code im Passwortspeicher als **eigener Eintrag** mit dem Benutzernamen `<name> (Wiederherstellungscode)` - so ersetzt er nie das Passwort der Anmeldung. Bei "Passwort vergessen?" fuellt der Passwortspeicher diesen Eintrag aus; die App macht daraus den Anmeldenamen, das neue Passwort gehoert wieder zum Eintrag `<name>`.
- "Passwort vergessen?" in drei Schritten wie im Auftrag (Code -> neues Passwort -> neuer Code); ob der Code stimmt, zeigt sich erst beim Speichern des neuen Passworts (das Konto-Modul prueft beides in einem Schritt).
- Falsche Rolle (Kinderkonto im Erwachsenen-Formular und umgekehrt) = dieselbe Meldung wie ein falsches Passwort.
- Zugang zum Testspeicher wird auf der Anmeldeseite einmal je Geraet eingegeben (Konzept 12); Text auf Englisch wie die ganze gemeinsame Anmeldeseite.
- "Elternbereich schliessen" loescht die Schluesselkopie des Erwachsenen wie "Abmelden" (beides beendet seine Sitzung).

## Restrisiken / nicht geprueft
- Ob Safari/iCloud-Schluesselbund den Code-Eintrag wirklich anbietet und spaeter ausfuellt, laesst sich nur auf einem echten Geraet pruefen (Teil von Peters kurzer Probe); Chromium hat im Test keinen Passwortspeicher - geprueft ist die Kennzeichnung.
- Anmelden braucht den Speicher: ohne Netz kann sich niemand neu anmelden (wer angemeldet ist, bleibt es bis "Abmelden"). Geschwisterwechsel offline geht damit nicht.
- Die Schluesselkopie wird noch von nichts benutzt - der Abgleich in der App ist eine eigene Aufgabe.

## Offen
- **Testinstanz verbinden:** `testinstanzUmwandeln` muss die Marke `/*BQ_SPEICHER*/null` durch `{"art":"github","repo":"pahlborn/bis-school-app-testdaten","wurzel":""}` ersetzen (Suchlauf-Pruefung dazu). Danach startet die Testinstanz mit der Anmeldung; ihre bestehenden Tests (Sandbox und Browser) muessen sich dafuer erst anmelden. Bewusst nicht hier, weil "Veroeffentlichungsweg Testinstanz" gleichzeitig an genau diesen Dateien arbeitet.
- Oberflaeche fuer Kinder anlegen, zweiten Elternteil einladen und Start-QR-Codes zeigen (Logik: "Einladungen", #131); der Startlink traegt den Fingerabdruck schon (`/<fingerabdruck>`), die App reicht ihn an die Pruefung weiter.
