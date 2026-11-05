# 2026-11-05 - Stufe 3b, "Einladungen - Oberflaeche" (nur Testbau)

## Auftrag
Vault: "Stufe 3b - Anmeldung auf allen Geraeten", Abschnitt "Einladungen" (Hinweise fuer die Oberflaeche), dazu die
Oberflaeche zu #135 (Schluessel erneuern) und #136 (Meine Geraete). Konzept 10.2-10.4, US9.5-US9.7.
Nur Testbau mit Konten im Speicher (`KONTO_UI`); Kathies App (Live-Bau, `konten.json`) verhaelt sich unveraendert.

**Erfolgskriterium (aus der Aufgabe):** Der zweite Elternteil sieht nach der Einladung dasselbe Kind; ein neues Kind uebt
nach seinem Start-QR-Code auf einem eigenen Geraet, die Eltern sehen es; "Passwort des Kindes neu" ohne Datenverlust;
nach dem Entfernen eines Kindergeraets sofort "Jetzt neues Passwort fuer <Kind>?"; "Elternbereich schliessen" loescht die
Schluessel nicht. **Ergebnis:** erfuellt (Belege unten, echte App-Instanzen mit Klicks).

## Was neu ist (Oberflaeche)
- **⚙ "👪 Familie"** (nur Eltern): Kinder mit Anzeigename und Anmeldename, je Kind "🔑 Neues Passwort"; "➕ Kind anlegen"
  (Vorname -> Vorschlag der App fuer den Anmeldenamen, aenderbar -> Start-QR-Code); "➕ Zweiten Elternteil einladen"
  (solange es nur einen Elternteil und keine offene Einladung gibt); offene Einladungen mit "Zurueckziehen"; Meldungen
  des Abgleichs (aufgenommen, abgelaufen, Warnungen bei fremdem Schluessel, neuer Schluessel des anderen Elternteils mit
  seinen Pruefwoertern).
- **Start-QR-Code**: Startlink `#start=<name>/<code>/<Pruefwoerter des Ausstellers>` als QR-Code (eigenes Modul `qrcode`,
  keine fremde Bibliothek - der Code verlaesst das Geraet nicht), darunter Anmeldename und Startcode zum Eintippen, gueltig
  bis. **Vorher und nachher gleicht das Elterngeraet ab** - die Einladung liegt im Speicher, bevor der Code erscheint. Solange
  der Code offen ist, gleicht das Geraet alle 4 s ab und zeigt "✓ Kathie ist angemeldet und kann loslegen." Knoepfe
  "Zurueckziehen", "Fertig".
- **Kind wartet** (Konzept 10.3): nach dem ersten Passwort gleicht das Kindergeraet ab und prueft, ob es den aktuellen
  Schluessel seines Lernbereichs hat (`anmKindBereit`). Wenn nicht: "Almost ready! ⏳ Your grown-up's device has to let
  you in first" - prueft alle 5 s selbst, Knopf "Try again". Mit offenem QR-Code auf dem Elterngeraet dauert das Sekunden.
- **⚙ "📱 Meine Geraete"**: eigene Geraete (Name z. B. "iPad · Safari", seit, zuletzt, "dieses Geraet", entfernt am) und
  bei Eltern je Kind "Geraete von Kathie"; "Entfernen":
  - Kindergeraet: Rueckfrage -> entfernen -> sofort **"Jetzt neues Passwort fuer Kathie?"** (Ja = Start-QR-Code, Spaeter).
  - eigenes Geraet: aktuelles + neues Passwort (Vorschlag, Felder fuer den Passwortspeicher) -> neuer Schluessel ->
    neuer Wiederherstellungscode und neue Pruefwoerter.
  - "🔑 Schluessel erneuern" am Ende des Abschnitts: dasselbe ohne Geraet.
- **Abgleich in der App:** nach der Anmeldung, beim Start, wenn die App wieder sichtbar wird, jede Minute, vor/nach jeder
  Einladung, alle 4 s bei offenem QR-Code, alle 5 s beim wartenden Kind. Nach dem Abgleich: neue Eintraege lesen
  (`evNeuLaden`), Kinder der Familie in die Konten der App (Kinderauswahl der Eltern auf jedem Geraet), `alt` (alte
  Schluessel nach dem Erneuern) nur bis alle Bereiche den neuen haben. Waehrend ein Formular offen ist, wird nichts
  neu gezeichnet.
- **Korrektur zu #134:** Kopf des Elternbereichs: **"Schliessen"** (neu) und "Abmelden". Schliessen laesst den
  Erwachsenen angemeldet (Sitzung und Schluesselkopie bleiben); "👪 Parent / Teacher" bzw. "Grown-ups" bringt ihn ohne
  Passwort zurueck. Auf einem Geraet, das auch ein Kind benutzt, erinnert die App beim Schliessen **einmal** freundlich:
  "Sie sind noch angemeldet ... Bitte melden Sie sich ab, wenn Sie fertig sind" (Abmelden / Angemeldet bleiben).
  "Abmelden" loescht die Schluesselkopie des Erwachsenen; ein angemeldetes Kind bleibt.
- Willkommen und Eltern-Anleitung (Konto-Modus) nennen "⚙ -> 👪 Familie" und "📱 Meine Geraete".
- Schluesselkopie (IndexedDB `bq2_konto`) traegt zusaetzlich Anmeldename, Stand, Ursprung und nach der ersten Anmeldung,
  wohin das Konto gehoert (oeffentliche Schluessel) - fuer den Abgleich nach einem Neustart.

## Aenderungen
- `src/module/qrcode.mjs` (neu, `bau: test`): `qrMatrix`, `qrSvg` (Byte-Modus, Fehlerkorrektur L/M, Version 1-40, Maske
  nach Strafpunkten).
- `src/module/anmeldung.mjs`: duenne Bruecken zu `einladung`, `geraete`, `konto`, `qrcode` (`anmAbgleich`,
  `anmKindAnlegen`, `anmElternEinladen`, `anmKindNeu`, `anmZurueckziehen`, `anmGeraete`, `anmGeraetEntfernen`,
  `anmErneuern`, `anmFingerabdruck`, `anmQr`, `anmVerbindungen`, `anmNameVorschlag`) und `anmKindBereit`.
  `anmVersuch`: ein Startcode zu einem **bestehenden** Konto (neues Passwort eines Kindes) fuehrt zum Passwort-Schritt.
- `index.html`: Abschnitte, Schritte (`kontoBlatt`), Abgleich, Warten des Kindes, Schliessen/Erinnerung; alles hinter
  `KONTO_UI`. `index.html` ruft weiter nur Modul `anmeldung`.
- Tests: `tests/konto-einladungen.test.mjs`, `tests/konto-einladungen-browser.test.mjs`, `tests/module/qrcode.test.mjs`,
  Ergaenzungen in `tests/module/anmeldung.test.mjs`; `tests/konto-anmeldung.test.mjs` und `tests/testinstanz.test.mjs`
  legen Kinder jetzt ueber ein Elterngeraet an und lassen es sie aufnehmen (sonst wartet das Kind - neue Regel).
- `werkzeug/speicherstellen.json`: Beschreibung `bq2_konto`.

## Belege
`tests/konto-einladungen.test.mjs` (Node-Sandbox, 4 Tests, ~10 s; je Test 3-6 echte App-Instanzen an einem simulierten
Speicher; Zeitgeber laufen dort nicht - was der Takt ausloest, ruft der Test als `kontoAbgleich()` der App auf):
1. **Familie:** Peter (Startlink vom Admin) -> ⚙ Familie -> Kind anlegen "Kathie" -> Vorschlag `kathie` -> QR-Code. Die
   Einladung ist beim Erscheinen schon gesendet (Peters Personen-Bereich: `invite_set` im Log, Ausgang leer). Der QR-Code
   traegt genau den Startlink mit Peters Pruefwoertern (Pfad des SVG = `qrSvg(link)`). Kathies iPad: Link -> Student ->
   Passwort -> **wartet**; Peters Takt -> Status "✓ Kathie ist angemeldet", "Zurueckziehen" weg; Kathie: "Try again" ->
   Willkommen. Kathie uebt 3 Fragen -> nach dem Abgleich hat Peter dieselben 3 Antworten, Kathie in seiner Kinderauswahl.
   Zweiter Elternteil `anna.a` (QR mit Peters Pruefwoertern, iPhone) -> Peter: "✓ anna.a gehoert jetzt zur Familie", kein
   weiteres Einladen; Anna sieht Kathie mit denselben Antworten. Zurueckziehen im QR-Code ("Ben") und in der Liste ("Lena"):
   beide Codes danach "This start code does not work (any more)". **Neues Passwort fuer Kathie** -> QR -> neues iPad: Name
   + Code -> Passwort -> wartet -> Peter: "✓ Kathie hat ein neues Passwort" -> **Zaehlprobe: dieselben 3 Antworten**; altes
   Passwort gilt nicht mehr. Warnungen erscheinen im Abschnitt. **Schluessel erneuern:** falsches aktuelles Passwort ->
   Meldung; gleiches Passwort -> Meldung; dann neuer Code + neue Pruefwoerter, `alt` nach dem Abgleich weg; Anna sieht
   "Der andere Elternteil hat einen neuen Schluessel. Pruefwoerter: <dieselben>"; altes Passwort gilt nicht, neues schon;
   Neues von Kathie kommt bei Peter an. Keine Fehler in `kontoFehlerListe` auf allen Geraeten.
2. **Meine Geraete:** Peter (Windows · Chrome), Peters iPhone, Kathies iPad und Familien-iPhone (zweites Kindergeraet ohne
   Warten). Liste mit Namen und "(dieses Geraet)", kein "Entfernen" fuer dieses Geraet. Familien-iPhone entfernen ->
   "Jetzt neues Passwort fuer Kathie?"; was es danach uebt, kommt nicht an, Kathies iPad zaehlt weiter; "Ja" -> QR
   "Neues Passwort fuer Kathie"; Liste: "entfernt am". Peters iPhone entfernen (aktuelles + neues Passwort) -> Code ->
   iPhone "entfernt am", liest Neues nicht mehr; neues Geraet: altes Passwort nein, neues ja, hat alles.
3. **Schliessen/Abmelden:** eigenes Geraet: Schliessen -> Anmeldeseite, keine Erinnerung, Sitzung und Schluessel bleiben,
   "Parent / Teacher" -> ohne Passwort zurueck. Kathies iPad mit Peter: Schliessen -> Erinnerung -> "Angemeldet bleiben" ->
   Kathies Startseite, beide Schluessel da; "Grown-ups" ohne Passwort; zweites Schliessen ohne Erinnerung; aus der
   Erinnerung "Abmelden" -> nur Kathies Schluessel bleibt, Kathie angemeldet, Peter muss sich neu anmelden.
4. **Kathies App:** Live-Bau nennt kein Konto-, Einladungs-, Geraete- oder QR-Modul (Suchlauf: `qrMatrix`, `qrSvg`,
   `meineGeraete`, `geraetEntfernen`, `schluesselErneuern`, `kindPasswortNeu`, `elternteilEinladen`,
   `abgleichMitVerbindungen`, `anmeldenameVorschlag`, `anmKindBereit`, `GERAETEABGLEICH_SPEICHER`); Live- und Testbau mit
   `konten.json`: Kopf nur "Abmelden", keine Abschnitte Familie/Geraete, Abmelden wie bisher.

`tests/konto-einladungen-browser.test.mjs` (Chromium, GitHub-Nachbau, ~10 s): ⚙ anklicken, Abschnitt aufklappen, Kind
anlegen, QR-Code sichtbar (>= 200 px, quadratisch) mit dem richtigen Startlink; Kindergeraet wartet und geht **von selbst**
weiter (echte Takte beider Geraete); Status beim Elternteil von selbst; Felder beim Schluessel-Erneuern
(`username`/`current-password`/2x `new-password`); Schliessen -> Anmeldeseite -> zurueck ohne Passwort; keine Seitenfehler.

`tests/module/qrcode.test.mjs`: 8 Matrizen gleich der Referenzbibliothek qrcode@1.5.4 (Pruefsummen); bei der Umsetzung
288/288 Matrizen verglichen (Versionen 1-36, L/M, alle Masken, UTF-8). Dazu Suchmuster, Taktlinien, Formatinformation,
Fehlerfaelle, SVG. `tests/module/anmeldung.test.mjs`: `anmVersuch` (Startcode zu bestehendem Konto) und `anmKindBereit`
(vor/nach der Aufnahme, Speicher weg).

**Gegenproben** (`%TEMP%\opencode\gegenproben-oberflaeche.mjs`): **25/25 rot** - QR-Code ohne Abgleich danach; Kind uebt
ohne Warten; `anmKindBereit` immer ja; QR ohne Fingerabdruck; Status nie "eingeloest"; Zurueckziehen (QR und Liste) ohne
Wirkung; Kinder nicht in den Konten der App; Schliessen meldet ab (alter Stand #134); keine bzw. jedes Mal Erinnerung;
Abmelden laesst den Schluessel liegen; "Parent / Teacher" fragt trotz Anmeldung; Kindergeraet ohne Frage bzw. nicht
entfernt; neuer Schluessel nicht uebernommen; `alt` bleibt; Startcode zu bestehendem Konto = falsches Passwort; Geraete
ohne Namen; Warnungen nicht angezeigt; Kathies App bekommt "Schliessen"; QR: falsche Maske, falsches Polynom, Format ohne
Maske, Versionsinformation fehlt.

**Volle Reihe** (eigener Arbeitsordner, mit `main` = 94b2b9f = "Testinstanz verbinden" #137 eingemergt): **760/760** (480 s). Die Testinstanz-Tests aus #137 meldeten Kinder ohne Elterngeraet an - mit der neuen Warteregel legt dort jetzt Peters Geraet (ohne App) die Kinder an und nimmt sie auf.

## Entscheidungen (Peter kann widersprechen)
- "Schliessen" als eigener Knopf neben "Abmelden" (nur Konto-Modus). "Abmelden" bleibt die Abmeldung des Erwachsenen.
  Kindergeraet = ein Geraet, auf dem sich schon ein Kind angemeldet hat; erinnert wird einmal je Anmeldung des Erwachsenen.
- Der Start-QR-Code zeigt zusaetzlich Anmeldename und Startcode zum Eintippen (Geraet ohne Kamera, gleiches Geraet);
  kein "Link teilen" - Startcodes nur persoenlich (Anleitung des Admins).
- Ein Startcode zu einem bestehenden Konto fuehrt zum Passwort-Schritt (sonst geht "neues Passwort des Kindes" nicht);
  ein verbrauchter Startcode meldet dort "gilt nicht (mehr)" statt "Benutzername oder Passwort stimmt nicht".
- Das Kind darf erst ueben, wenn es den aktuellen Schluessel seines Lernbereichs hat (auch nach "neues Passwort").
- Abgleich jede Minute, solange die App sichtbar ist (Konzept: 30 s; GitHub: ohne Neues 1 Anfrage mit 304).
- Gerätenamen aus dem Browser ("iPad · Safari"), ohne Eingabe.
- Anzeige "Der andere Elternteil hat einen neuen Schluessel", wenn sein Name auf dem Geraet nicht bekannt ist.

## Restrisiken / offen
- **Andere Geraete nach "Schluessel erneuern":** sie behalten die alte Kopie, sehen nichts Neues mehr und bekommen keinen
  Hinweis; erst Ab- und Neuanmelden mit dem neuen Passwort hilft. Ein Hinweis ("Ihr Schluessel ist neu - bitte neu
  anmelden") waere ein kleiner eigener Schritt.
- **Entferntes Geraet wieder benutzen:** es behaelt seine Geraete-Kennung; was es danach schreibt, zaehlt nicht (#136).
  Eine neue Kennung bei der naechsten Anmeldung ist noch nicht umgesetzt.
- Der Name des Gruenders steht im Familienbereich nicht - Anna sieht "Der andere Elternteil" statt "peter.a".
- Lehrkraft-Einladung (Anfragecode), Elternteil entfernen: nicht Teil (wie in #131).
- Auf echten Geraeten offen: Kamera-Scan des QR-Codes (Groesse 280 px, Version 8 bei Fehlerkorrektur M) - Peters Probe.
