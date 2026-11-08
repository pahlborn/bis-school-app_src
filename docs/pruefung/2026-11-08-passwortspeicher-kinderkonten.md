# Passwortspeicher bei Kinderkonten (08.11.2026)

Grundlage: Auftrag `docs/pruefung/2026-11-08-auftrag-passwortspeicher-kinderkonten.md`.

## Kurzfazit
- **Kein belegter Login- oder Speicherfehler** im Kinderkonto-Fluss.
- Der fachliche Soll-Fluss ist konsistent: Kinder haben genau **einen** Login-Eintrag mit ihrem Anmeldenamen; nach `Neues Passwort` gilt nur noch das neue Passwort.
- Der wahrscheinliche Bruch entsteht **zwischen den Formularen fuer Passwort anlegen (`new-password`) und spaeterem Anmelden (`current-password`)**.
- Die engste technische Einordnung ist daher: **Passwortspeicher-Eintrag / Update des Eintrags**, nicht Konto- oder Speicherlogik.
- Nach `Neues Passwort` fuer ein Kind ist ein spaeter angebotener alter Eintrag **echt falsch**, aber **absichtlich falsch**, weil das alte Passwort dann nicht mehr gelten darf.

## Soll-Ablauf
1. Erstanmeldung per Einladung/QR/Startlink:
   - Kind oeffnet die Einladung.
   - Die App zeigt direkt das Passwortformular `#kontoNeuForm`.
   - Der Anmeldename steht fest, das Geraet soll fuer diesen Namen ein neues Passwort speichern.
2. Spaetere Anmeldung:
   - Das Kind meldet sich mit demselben Anmeldenamen und dem gemerkten Passwort ueber `#loginForm` an.
3. Zweites Geraet:
   - Entweder derselbe Einladungslink fuehrt nach verbrauchtem Code zu `Bitte anmelden`, oder das Kind meldet sich direkt mit Name + Passwort an.
4. `Neues Passwort` fuer ein Kind:
   - Eltern erzeugen einen neuen Start-QR-Code.
   - Das Kind waehlt wieder ein **neues** Passwort.
   - Danach darf nur noch dieses neue Passwort funktionieren.

## Ist-Ablauf mit Belegen

### Fall A - erste Anmeldung per Einladung/QR/Startlink
- Das Kind landet korrekt im festen Formular `#kontoNeuForm`.
- Felder:
  - `#kontoNeuName`: `type="text"`, `name="username"`, `autocomplete="username"`, `readonly`
  - `#kontoNeuPw`: `type="password"`, `name="new-password"`, `autocomplete="new-password"`
- Beleg:
  - `index.html:605-607`
  - `tests/erstanmeldung-browser.test.mjs:79-85`
  - `tests/erstanmeldung.test.mjs:67-73`
- Einordnung:
  - Der Erstweg ist sauber als **Passwort neu anlegen** gekennzeichnet.

### Fall B - erneute Anmeldung auf demselben Geraet
- Fachlich passiert das nur nach Abmelden, Kindwechsel oder geloeschter Sitzung; ansonsten bleibt das Kind angemeldet.
- Die erneute Anmeldung laeuft ueber `#loginForm`.
- Felder:
  - `#loginUser`: `autocomplete="username"`, **kein `name`-Attribut**
  - `#loginPw`: `type="password"`, `autocomplete="current-password"`, **kein `name`-Attribut**
- Beleg:
  - `index.html:5131`
  - `tests/konto-anmeldung.test.mjs:263-269`
- Einordnung:
  - Der echte Login funktioniert.
  - Der Formularwechsel von `new-password` zu `current-password` ist real; spaeterer Passwortspeicher-Mismatch kann hier entstehen.

### Fall C - Anmeldung auf einem zweiten Geraet
- Das echte Konto-Login mit demselben Passwort funktioniert auf einem zweiten Geraet.
- Fuer ein bereits bekanntes Konto fuehrt ein alter/verbrauchter Einladungslink nicht mehr zu `neues Passwort`, sondern zu `Bitte anmelden` mit `current-password`.
- Beleg:
  - `tests/konto-anmeldung.test.mjs:271-281`
  - `tests/erstanmeldung.test.mjs:92-98`
  - `tests/erstanmeldung-browser.test.mjs:126-140`
- Einordnung:
  - Auch hier **kein** technischer Login-Fehler.
  - Wenn ein Passwortspeicher dann ein falsches Passwort anbietet, sitzt der Bruch eher im Eintrag/Update als im Konto.

### Fall D - Verhalten nach `Neues Passwort` fuer ein Kind
- Der Elternfluss `kindPasswortNeu(...)` erzeugt bewusst einen neuen Startcode fuer das **bestehende** Kind.
- Das Kind bekommt danach wieder `#kontoNeuForm` mit Titel `Choose a new password`.
- Dasselbe Konto bleibt erhalten, aber kuenftig zaehlt nur noch der neue Stand mit dem neuen Passwort.
- Beleg:
  - `src/module/einladung.mjs:296-312`
  - `src/module/konto.mjs:388-411`
  - `src/module/konto.mjs:527-542`
  - `tests/erstanmeldung.test.mjs:80-90`
- Einordnung:
  - Wenn danach ein alter Passwortspeicher-Eintrag angeboten wird, **scheint** das Passwort falsch zu sein, ist aber fachlich korrekt: das alte Passwort darf dann nicht mehr gehen.
  - Der heikle Punkt ist also das **Aktualisieren oder Auswaehlen des richtigen Passwortspeicher-Eintrags**.

### Fall E - Browser vs. Home-Bildschirm-App
- Lokal belegbar ist: Browser-Link und In-App-QR-Weg landen beide im selben Passwort-anlegen-Fluss `#kontoNeuForm`.
- Beleg:
  - Browser: `tests/erstanmeldung-browser.test.mjs:64-99`
  - Home-Bildschirm-App-analoger QR-Weg: `tests/erstanmeldung-browser.test.mjs:162-185`
- Nicht lokal automatisierbar ist: welches konkrete iOS-Passwortspeicher-Angebot Safari vs. Home-Bildschirm-App danach macht.
- Einordnung:
  - Der App-Code fuer das Passwortformular ist gleich.
  - Offen bleibt nur das geraetespezifische Verhalten des Passwortspeichers selbst.

## Wo die Abweichung entsteht
- Beim **Anlegen** eines Kinderpassworts sieht der Passwortspeicher ein Formular fuer `new-password`.
- Beim **spaeteren Login** sieht er ein anderes Formular fuer `current-password`.
- Das spaetere Login-Formular hat dabei keine `name`-Attribute auf `#loginUser` und `#loginPw`.
- Nach `Neues Passwort` fuer ein Kind wird derselbe Benutzername erneut ueber einen `new-password`-Fluss beschrieben.

Damit gibt es zwei plausible, eng begrenzte Ursachen:
1. Der Passwortspeicher fuehrt fuer denselben Kind-Namen alte und neue Eintraege nebeneinander und bietet spaeter den falschen an.
2. Der Passwortspeicher verknuepft den beim `new-password`-Formular angelegten Eintrag nicht sauber mit dem spaeteren `current-password`-Formular.

Beides erklaert das gemeldete Symptom besser als ein Loginfehler im Konto-Modul.

## Repro-Schritte

### Repro 1 - Erstanmeldung und spaeteres Login
1. Kind `lio.sonnental` oder `jonas.sonnental` per Einladung/QR/Startlink oeffnen.
2. Im Formular `#kontoNeuForm` Passwort waehlen.
3. Kind aufnehmen lassen und bis zur Kinderansicht weitergehen.
4. Abmelden oder auf einem zweiten Geraet anmelden.
5. Beobachten: jetzt kommt `#loginForm` mit `current-password`, nicht mehr `#kontoNeuForm`.
6. Wenn der Passwortspeicher hier einen anderen oder alten Eintrag anbietet, wirkt das Passwort "falsch", obwohl der Kontopfad korrekt ist.

### Repro 2 - neues Kinderpasswort
1. Kind einmal normal aufnehmen.
2. Im Elternbereich `Neues Passwort` fuer dieses Kind ausloesen.
3. Den neuen QR-/Startlink auf dem Kindgeraet oeffnen.
4. Beobachten: wieder `#kontoNeuForm`, diesmal mit `Choose a new password`.
5. Danach erneut ueber `#loginForm` anmelden.
6. Wenn der Passwortspeicher noch das alte Passwort anbietet, scheitert die Anmeldung fachlich korrekt, weil nur noch das neue Passwort gilt.

## Technische Ursache / enge Verdachtsliste
1. **Hauptverdacht:** Passwortspeicher-Eintrag wird zwischen `new-password` und `current-password` nicht eindeutig fortgeschrieben.
2. **Zweiter Verdacht:** fehlende `name`-Attribute im spaeteren Login-Formular (`#loginUser`, `#loginPw`) erschweren die Zuordnung fuer manche Passwortspeicher.
3. **Nicht belegt:** echter Fehler in `konto.anmelden`, `ersteAnmeldung`, Speicherstand oder Kennungswechsel.

## Gesamt-Einordnung
- **Am ehesten:** Passwortspeicher-Eintrag / `new-password` -> `current-password`-Uebergang.
- **Nicht belegt:** echter Login-/Speicherfehler.
- **Wichtig fuer die Folgearbeit:** Ein spaeter falsches Kinderpasswort nach `Neues Passwort` kann ein reines Passwortspeicher-Updateproblem sein; dann darf man den Konto-Fluss nicht "reparieren", sondern muss gezielt die Formular-/Eintragskennzeichnung pruefen.

## Pruefung
- Gruen:
  - `node --test tests/konto-anmeldung.test.mjs tests/erstanmeldung.test.mjs`
  - `$env:CHROMIUM_PATH = "$env:LOCALAPPDATA\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe"; node --test tests/konto-anmeldung-browser.test.mjs tests/erstanmeldung-browser.test.mjs`
- Damit belegt:
  - Kinder-Erstanmeldung
  - spaeteres Login auf demselben und auf einem zweiten Geraet
  - Wiederverwendung alter Einladungslinks
  - neues Kinderpasswort ueber neuen Startlink
  - Browser- und In-App-QR-Pfad bis zum Passwortformular
