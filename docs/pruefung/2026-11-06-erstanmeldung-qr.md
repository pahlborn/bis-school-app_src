# Erstanmeldung per QR-Code (06.11.2026)

Grundlage: Vorgabe „Erstanmeldung per QR-Code“ (Peter, 06.11.), Befunde B1–B4 der Probe vom 06.11. Gilt für Testbau, Testinstanz und Familienfassung; Kathies App bleibt unverändert (kein Konto-Modus, Formular wird beim Start entfernt).

## Was neu ist
- **Einladung = Zugangscode + Startlink:** `…/#zugang=<Zugangscode>&start=<Name>/<Startcode>[/<Prüfwörter>]` (Startlink-Format unverändert; `#start=…` und `#zugang=…` allein gelten weiter). Beides verlässt die Adresse sofort.
- **Öffnen:** Der Zugangscode wird mit **einer** Anfrage geprüft und ersetzt einen alten nur, wenn er funktioniert: „✅ Gerät verbunden“ bzw. „❌ Der Zugangscode passt nicht oder ist abgelaufen“ / „❌ Kein Netz“ / „❌ Gerade zu viele Anfragen“. Ein Code, der nicht geht, wird nie gespeichert (ein älterer bleibt). GitHub unterscheidet „falsch“ und „abgelaufen“ nicht – darum eine Meldung für beides.
- **Startcode ansehen ohne Verbrauch** (`konto.startcodeAnsehen`: holen, sofort zurücklegen): Rolle und Name stehen fest, bevor jemand ein Passwort wählt. Neues Konto oder neues Kinderpasswort → Passwortformular; Code verbraucht/abgelaufen und Konto vorhanden → „✅ Gerät verbunden – bitte anmelden“ (Formular mit `current-password`, Name vorbelegt); sonst ❌ mit Grund (gilt nicht mehr / abgelaufen / falsche Prüfwörter).
- **Passwortformular fest im HTML** (`#kontoNeu`, wie Probe „probe-passwort“): Anmeldename `autocomplete="username"` (nur lesbar), ein Feld `autocomplete="new-password"` mit `passwordrules`, Regeln sichtbar am Feld. „Anmelden“ erst, wenn die Regeln erfüllt sind – geprüft bei Eingabe und alle 400 ms (Passwortspeicher). Das Formular bleibt nur in der Seite, solange eine Einladung geöffnet wird; jede andere Anmeldeseite entfernt es. Einladungen, die in der laufenden App gelesen werden (Kamera, Einfügen), öffnen die Seite deshalb neu.
- **Ohne Zugangscode** zuerst nur „📲 Gerät verbinden“ (B2): „📷 QR-Code scannen“ (Kamera **in** der App, `getUserMedia`, `playsinline`) oder „Link einfügen“ (ganzer Link oder nur der Code; Umbrüche egal; Link einer anderen Fassung → ❌). Danach „Who is logging in?“ – beide Rollen gleich gestaltet. Sprache dieses Schritts: Sprache des Geräts.
- **QR-Leser:** jsQR 1.4.0 (Apache-2.0), unverändert eingebettet (Modul `qrlesen`, nur Testbau; SHA-256 wie npm `jsqr@1.4.0` `dist/jsQR.js`), Hinweis in ⚙ → „Über die App“ → „Fremde Programmteile“. Die App wird dadurch rund 260 KB größer (Testinstanz 1,59 MB).
- **Begriffe (B3):** überall „Zugangscode“ / „access code“ für das Gerät; „Einmal je Gerät – gilt für alle, die sich hier anmelden.“ Die Zeile „Zugang abgelaufen“ im Elternbereich führt zu „Gerät neu verbinden“ (Link oder Code einfügen, mit ✅/❌).
- **QR-Codes in der App** (Kind anlegen, neues Kinderpasswort, zweiter Elternteil) tragen den Zugangscode des Elterngeräts mit. Zweiter Elternteil: „✉️ Als E-Mail-Entwurf sichern“ (HTML-Datei mit QR-Code und Link).
- **Meine Geräte:** Namen „iPhone (Safari)“ / „iPhone (App)“; neu „📲 Weiteres Gerät verbinden“ (QR-Code nur mit dem Zugangscode).
- **Werkzeug `testpersonen.mjs --anlegen`:** je Person eine HTML-Datei nur lokal unter `%LOCALAPPDATA%\bis-school-app\testinstanz\einladungen\` – Erwachsene: E-Mail-Entwurf (Lehrkraft Englisch); Kinder: keine E-Mail, Seite „QR zum Zeigen“; Konten des Werkzeugs: „Gerät verbinden“ (nur Zugangscode). `testpersonen.txt` nennt oben, wo der Zugangscode liegt. Zugangscode und Codes nie in der Ausgabe.
- Anleitungen und Hilfe im Konto-Modus auf den neuen Weg umgestellt.

## Prüfung
- Ohne Browser: `tests/module/erstanmeldung.test.mjs` (Link lesen/bauen, Einfügen, Zugangscode prüfen und übernehmen gegen den GitHub-Nachbau inkl. kein Netz und Limit, Startcode ansehen in Simulation und Nachbau, Link wiederverwenden, Gerätename, E-Mail-Entwurf, QR-Bild → jsQR → Link auch verrauscht und invertiert, jsQR unverändert), `tests/erstanmeldung.test.mjs` (Kind über Link, neues Kinderpasswort über neuen Link, alter Link → anmelden; Startlink auf unverbundenem Gerät → verbinden → Neustart mit beidem; „(App)“; Kathies App), `tests/testpersonen.test.mjs` (Einladungsdateien).
- Browser: `tests/erstanmeldung-browser.test.mjs` – A: Einladungslink, alter Zugangscode ersetzt, Adresse leer, ohne Rollenwahl, Felder und Regeln, Knopf (auch Wert ohne `input`-Ereignis), nur ein Passwortfeld, kein Code in Feldern, Wiederherstellungscode, „Weiteres Gerät verbinden“-QR, E-Mail-Entwurf; derselbe Link auf neuem Gerät → anmelden; falscher Zugangscode → ❌. B: „Gerät verbinden“ → Kamera-Attrappe zeigt den QR-Code → die App liest ihn → Kind wählt Passwort.
- Bestehende Tests auf den neuen Weg umgestellt (konto-anmeldung, konto-einladungen, abgleich-app, familienfassung, testinstanz, testinstanz-veroeffentlichen, je Browser).
- Gegenproben (alle rot): Code bleibt in der Adresse; alter Zugangscode wird nicht ersetzt; „Anmelden“ aktiv bei schwachem Passwort; beide Formulare gleichzeitig im Dokument; Zugangscode im Passwortfeld der Person; QR-Code wird nicht gelesen.

## Nicht belegt (Gerät)
Passwort-Vorschlag, Sichern im Passwortspeicher und Kamera in der Home-Bildschirm-App sind auf Peters iPhone mit den Probeseiten belegt (Vorgabe, Tabelle „Belegt“); dieser Stand übernimmt deren Aufbau. **Offen: Kathies iPad.** Die Tests laufen im Desktop-Chromium.

## Hinweise
- `passwort.pwWeak` erkennt einen Anmeldenamen mit Punkt (z. B. `jonas.sonnental1`) nicht als „Name“; nicht geändert (Live-Modul, Kathies App).
- Testpersonen in älteren Tests heißen teils noch wie die Familie (eigener Aufräum-Auftrag).
