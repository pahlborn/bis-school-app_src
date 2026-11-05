# 2026-11-05 - Stufe 3, "Abgleich in der App" (nur Testbau)

## Auftrag
Vault: "Aufgabe Abgleich in der App". Konzept 9.1 (Buendel, Holen), 9.4 (Offline und Fehler), 11. Baut auf #138 auf (dort:
Abgleich jede Minute). Zusaetzlich die drei offenen Punkte aus #138: Hinweis nach "Schluessel erneuern" auf den anderen
Geraeten, neue Geraetekennung fuer ein entferntes Geraet nach neuer Anmeldung, klare Meldung bei falsch verbundenem
Speicher (Befund #137). Nur Testbau (`KONTO_UI`); Kathies App (Live-Bau, `konten.json`) verhaelt sich unveraendert.
Nicht veroeffentlicht.

## Ergebnis in einem Satz
Die App gleicht im Testbau von selbst ab (Start, Zurueckkehren, alle 30 s, nach eigenen Eintraegen gebuendelt, beim
Verlassen), Erwachsene sehen "Letzter Abgleich: vor 2 Min." und Probleme in Alltagssprache, das Kind sieht nichts - und
der Abgleich kostet bei GitHub jetzt **rund 700 zaehlende Anfragen je Stunde** (Kind uebt, Elterngeraet offen) statt
vorher geschaetzt rund 10 000.

## Wichtiger Befund (vor der Umsetzung gemessen)
Mit dem Stand von #138 kostete ein Abgleich am GitHub-Nachbau viel mehr als in #125 gemessen: dort wurde nur das Modul
`abgleich` (ein Bereich) gemessen, die App gleicht aber 5-7 Bereiche ab und liest je Bereich mehrmals die Schluessel -
**ohne** "unveraendert?"-Abfrage. Gemessen (Kind uebt 20 Min., Elterngeraet offen, Takt 60 s): Kind 861, Elterngeraet
2612 Anfragen in 20 Min. - hochgerechnet rund **10 400 je Stunde** fuer einen Zugangsschluessel (Limit 5 000).
Behoben im Modul `github` und `geraeteabgleich`:
- Schluessel eines Bereichs mit ETag (unveraendert: eine 304, zaehlt nicht), Schluesseldateien nur bei neuer sha.
- **Sitzung** je Abgleich (`zugang.sitzung()`): der Ordner `events` wird einmal fuer alle Bereiche gefragt (erneut nur
  nach einem eigenen Buendel im selben Bereich), die Schluessel eines Bereichs einmal (erneut nach eigenem `putKey`).
  Was andere waehrend des Abgleichs schreiben, kommt mit dem naechsten.

## Was neu ist
**Takt (index.html, nur `KONTO_UI`)** - ein einziger Zeitgeber (`kontoPlanen`):
| Wann | Was |
|---|---|
| Start der App, Zurueckkehren (sichtbar) | Abgleich sofort |
| alle 30 s, solange sichtbar (`KONTO_TAKT_MS`) | Abgleich; versteckt: nichts |
| nach eigenen Eintraegen (`eventHook`) | hoechstens alle 30 s nach dem letzten Versuch (`KONTO_SENDEN_MS`), gebuendelt; ein Abgleich sendet und holt |
| Verlassen der App (unsichtbar) mit Offenem | Abgleich sofort (senden) |
| offline | lokal weiter; Offenes bleibt vorgemerkt, der naechste Abgleich (oder das Verlassen) sendet es; Buendel lueckenlos, nichts ueberschrieben |
| Limit (`limit` mit Wartezeit) | kein Abgleich bis zum Ende der Wartezeit, auch nicht beim Zurueckkehren; das Modul fragt nach `limit` keinen weiteren Bereich |
| Kind mitten in einer Runde | holen und senden ja, aber nichts in die App (`inDieApp: false`); Neues kommt nach der Runde |

Dazu: Schreibt der Abgleich in ein Protokoll der App, liest die App ihre Protokolle sofort neu (`kontoAblage`) - ein
eigener Eintrag waehrend eines laufenden Abgleichs ueberschreibt nicht mehr, was der Abgleich gerade gebracht hat
(vorher heilte das erst eine weitere Runde).

**Was Erwachsene sehen** (Zeile unter dem Kopf des Elternbereichs, `#kSync`):
- "🔄 Letzter Abgleich: gerade eben / vor 2 Min. / vor 3 Std."
- "📴 Kein Netz – wird nachgeholt."
- "🔑 Der Zugang zum Speicher ist abgelaufen oder ungültig." + Knopf "Neuen Zugangsschlüssel eintragen" (eigenes Blatt)
- "⏳ Gerade zu viele Abgleiche – ab 10:42 geht es weiter."
- "3 Einträge nicht übernommen" (Zahl aus `bq_abgleichVerworfen`) und ⓘ "Abgleich" (DE/EN): wann die App abgleicht, offline,
  Runde, was "nicht übernommen" heisst. Kein Token, keine Codes, keine Statuszahlen.
- Das Kind sieht nichts davon (keine Zeile, keine Meldung, auch bei Fehlern).

**Zusatz 1 - Schluessel auf einem anderen Geraet erneuert:** Die eigenen Schluessel oeffnen den eigenen Personen-Bereich
nicht mehr (der Eintrag ist fuer die neuen Schluessel verpackt) -> `geraeteabgleich` meldet `veraltet`. Erwachsene sehen
"⚠️ Ihr Schlüssel wurde auf einem anderen Gerät erneuert. Bitte melden Sie sich hier neu an." + "Neu anmelden"
(meldet ab, zeigt die Anmeldung). Kind: still (die Eltern sehen es unter "Meine Geräte").
Hinweis: Die Ankuendigung der neuen Schluessel (`member_added`) kann ein altes Geraet **nicht** lesen - der erste Ansatz
(Ankuendigung im eigenen Bereich suchen) trug deshalb nicht.

**Zusatz 2 - entferntes Geraet, neue Anmeldung -> neue Geraetekennung:** Weiss das Geraet, dass es entfernt ist
(`device_removed` mit seiner Kennung in einem Bereich), bekommt es bei der naechsten Anmeldung eine neue Kennung; die
Stande des Abgleichs beginnen neu, alle anderen dort Angemeldeten melden sich neu an (ohne neue Anmeldung bleibt es
ausgesperrt). Erfaehrt es das Entfernen erst mit den neuen Schluesseln (eigenes Geraet entfernt = immer neuer Schluessel),
wechselt die Kennung nach dem ersten Abgleich nach der Anmeldung und es gleicht gleich noch einmal ab. Ein Erwachsener auf
einem entfernten Kindergeraet sieht "⚠️ Dieses Gerät wurde entfernt. Bitte melden Sie sich hier neu an."

**Zusatz 3 - falscher Speicher (Befund #137):** Findet die Anmeldung nichts, fragt die App einmal, ob der Speicher
ueberhaupt Konten hat (`github.verbunden()`: Ordner `directory`; ein nicht erreichbares Repo antwortet wie ein leeres).
Wenn nicht: gleich auf der Anmeldeseite "Diese Fassung ist mit einem anderen Speicher verbunden – dort gibt es keine
Konten. Bitte beim Admin nachfragen." (Kind/EN: "This version of the app is connected to a different storage …") - kein
"Passwort wählen" mehr. Im richtigen Speicher bleibt "Benutzername oder Passwort stimmt nicht."

## Aenderungen
- `index.html` (nur `KONTO_UI`): `kontoStatus`, `kontoPlanen`, `kontoNeuEintrag` (aus `eventHook`), `kontoAbgleichLauf`
  (Status, Limit, Runde, `kontoAblage`), Zeile `kontoZeileHTML`, Blatt "Neuer Zugangsschlüssel", `kontoNeueKennung`,
  Meldung `fremd`, Hilfe `abgleich` (DE/EN), Verlassen sendet.
- `src/module/github.mjs`: `keys` mit ETag und sha-Speicher, `sitzung()`, `verbunden()`.
- `src/module/geraeteabgleich.mjs`: Sitzung je Abgleich, `inDieApp`, `limit` (Rest ausgelassen, `wartezeit`), `veraltet`.
- `src/module/einladung.mjs`: `inDieApp` durchreichen (dann nur eine Runde), nach `limit` keine weitere Runde.
- `src/module/anmeldung.mjs`: `anmAbgleich({ inDieApp })`, `anmVerworfen`, `anmGeraetEntfernt`, `anmGeraetNeu`, `anmSpeicherFremd`.
- `tests/app-sandbox.mjs`: **stellbare Uhr** (`stellbareUhr()`, Option `uhr`; auch fuer mehrere App-Instanzen; Zeitgeber
  laufen erst mit `uhr.vor(ms)`, Date der App folgt der Uhr), `sichtbarkeit()`, Fenster-Ereignisse. Ohne `uhr` wie bisher.
- Tests: `tests/abgleich-app.test.mjs` (neu), Ergaenzungen in `tests/module/github.test.mjs`, `geraeteabgleich.test.mjs`,
  `anmeldung.test.mjs`; `tests/testinstanz.test.mjs` (Gegenprobe "anderes Repo" erwartet jetzt die neue Meldung).

## Belege
`tests/abgleich-app.test.mjs` - echte App-Instanzen am GitHub-Nachbau, gemeinsame stellbare Uhr, Anfragen je Geraet
gezaehlt (11 Tests):
1. **Takt:** 5 Min. sichtbar ohne Neues -> genau 10 Abgleiche je Geraet, **0 zaehlende Anfragen** (alles 304); versteckt
   10 Min. -> 0 Anfragen; zurueck -> sofort abgeglichen, Peters Aenderung da; Neustart der App (gleicher Speicher,
   gleiche IndexedDB) -> Abgleich beim Start, dann im Takt.
2. **Eigene Eintraege:** Antwort alle 5 s, 2 Min. lang -> 3-5 Buendel, Abstaende >= 30 s; Verlassen direkt nach einer
   Antwort -> 1 Buendel ohne Weiterstellen der Uhr; ohne Offenes sendet Verlassen nichts.
3. **Offline:** zwei Runden ohne Netz, Status `offline`, Kind sieht nichts; wieder Netz + sofort Verlassen -> nachgeholt;
   bei Peter alle Antworten, keine doppelt, keine Datei ueberschrieben, Buendel 1..n lueckenlos.
4. **Runde:** Peter aendert Kathies Namen; waehrend der Runde gleicht Kathie ab und sendet, Name und Protokoll bleiben;
   nach der Runde: neuer Name. Eigener Eintrag waehrend eines angehaltenen Abgleichs: das eben Geholte bleibt.
5. **Erwachsene:** "gerade eben"; kein Netz 2 Min. -> "📴 Kein Netz – wird nachgeholt. · 🔄 Letzter Abgleich: vor 2 Min.";
   falscher Zugang -> Hinweis, kein Token/Code/Statuszahl im HTML, neuer Schluessel ueber das Blatt -> wieder gut;
   Limit (403, retry-after 600) -> Hinweis mit Uhrzeit, 9 Min. lang **0 Anfragen** (auch nach Zurueckkehren und eigenem
   Eintrag), danach von selbst weiter; entferntes Kindergeraet schreibt -> "N Einträge nicht übernommen" + ⓘ; Englisch;
   Kind bei `offline`/`zugang`: kein Wort davon.
6. **Schluessel erneuert / Geraet entfernt:** iPhone sieht den Hinweis, "Neu anmelden" -> neues Passwort -> kein
   Hinweis, liest wieder; Peter entfernt das iPhone -> Hinweis, was es schreibt zaehlt nicht; neue Anmeldung -> neue
   Kennung, hat alles, was es schreibt zaehlt; altes iPhone "entfernt am", neues in der Liste. Kind nach neuem Passwort:
   altes iPad zeigt nichts.
6b. Peter auf einem entfernten Kindergeraet -> "Dieses Gerät wurde entfernt"; neue Anmeldung -> neue Kennung, Kathie
   meldet sich dort neu an, Peters Eintrag zaehlt.
7. **Anderer Speicher:** Kind und Erwachsener bekommen die neue Meldung sofort, kein Passwort-Schritt; richtiger
   Speicher: "stimmt nicht".
8. **Messung** (unten). 9. **Live-Bau:** keine neuen Namen, keine Zeile, kein Zeitgeber.

Modultests: `github` (ETag der Schluessel: unveraendert 1 Anfrage/304, geaendert Ordner + 1 Datei; Sitzung: einmal je
Bereich/Ordner, nach eigenem Schreiben neu; `verbunden` leer/404/mit Konten), `geraeteabgleich` (`inDieApp`, `limit`:
nach der ersten Antwort keine weitere Frage, 4 Bereiche ausgelassen), `anmeldung` (Zahl, entfernt, neu, fremd).

## Messung: Anfragen je Stunde (GitHub-Nachbau, Test 8)
Kind uebt 20 Min. (9 Runden, 72 Antworten, je Frage 15 s), Elterngeraet die ganze Zeit offen; danach eine Stunde ohne
Neues. "Zaehlend" = gegen das Stundenlimit von 5 000 (304 zaehlt nicht). "Schreibend" = Commits (GitHub: hoechstens
500 je Stunde fuer Inhalte).

| Takt holen / senden | Kind | Eltern | **zusammen** | Anteil am Limit | alle Fragen | schreibend | ohne Neues (zaehlend) |
|---|---|---|---|---|---|---|---|
| **30 s / 30 s (gewaehlt)** | 350 | 356 | **705** | **14 %** | 2 841 | 119 (24 % von 500) | **0** (1 560 Fragen, alle 304) |
| 60 s / 30 s | 359 | 234 | 593 | 12 % | 1 973 | 121 | 0 (780) |
| 60 s / 60 s | 172 | 178 | 350 | 7 % | 1 419 | 59 | 0 (780) |
| zum Vergleich: Stand #138 (60 s), vor der Korrektur | 2 583 | 7 836 | ~10 400 | ~210 % | | | |

**Festlegung: 30 s** (Takt `KONTO_TAKT_MS` und Senden `KONTO_SENDEN_MS`). Begruendung:
- Gemessen weit unter 50 %: 14 % des Stundenlimits im ungünstigen Alltagsfall (ein Kind uebt durchgehend, ein
  Elterngeraet schaut zu); ohne Neues kostet der Abgleich **nichts** (nur 304).
- 60 s spart nur beim zuschauenden Elterngeraet (356 -> 234); den groesseren Teil bestimmt das Senden, und das soll laut
  Aufgabe hoechstens alle 30 s sein. Der Unterschied (14 % vs. 12 %) rechtfertigt die doppelte Wartezeit nicht.
- Eltern sehen Neues nach hoechstens rund 30 s; das Konzept nennt 30 s.
- Schreiben: 120 Commits je Stunde und uebendem Kind (24 % von 500). Ueben zwei Kinder derselben Familie gleichzeitig
  durchgehend: rund 48 % - noch unter der Haelfte, aber das ist die Grenze, die zuerst knapp wird (siehe Restrisiken).
- Dauer je Abgleich: im Mittel ~7 Fragen (meist 304), bei GitHub ~0,3 s je Frage -> rund 2 s im Hintergrund.

## Gegenproben
Skript `%TEMP%\opencode\gegenproben-abgleich.mjs` - je ein absichtlicher Fehler, der passende Test muss rot werden:
**27/27 rot**. Die sechs aus der Aufgabe: kein Senden beim Verlassen; Holen ohne "unveraendert?"-Abfrage (Schluessel-
Ordner ohne ETag; Schluesseldateien immer neu); Kind sieht Fehlermeldung; Token in der Anzeige; Werte aendern sich
mitten in einer Runde; Wiederholen trotz `limit` (App ohne Wartezeit; Modul fragt weiter). Dazu: sofort statt gebuendelt
senden; kein Takt; kein Abgleich beim Zurueckkehren / beim Start; Offenes nach offline vergessen; eigener Eintrag
ueberschreibt (kein Neulesen); kein Hinweis nach Erneuern (App / Modul); kein Hinweis "entfernt"; keine neue Kennung;
neue Kennung nur bei vorher bekanntem Entfernen; andere bleiben nach neuer Kennung angemeldet; fremder Speicher: alter
Weg / GitHub sagt immer "verbunden"; keine Zeile; kein Netz nicht gemeldet; keine Zahl; Sitzung fragt `events` jedes
Mal; Live-Bau bekommt die Zeile.
Drei Gegenproben waren im ersten Lauf gruen und haben die Tests geschaerft: "Offenes nach offline vergessen" (jetzt:
wieder Netz + sofort Verlassen), "eigener Eintrag ueberschreibt" (jetzt: sofort nach dem Eintrag pruefen - die zweite
Abgleichrunde heilte es vorher), "Live-Bau bekommt den Takt" (war wirkungslos, `eventHook` schreibt im Live-Bau nie;
ersetzt durch "Live-Bau bekommt die Zeile").

## Volle Reihe
Eigener Arbeitsordner `wt-abgleich` auf `main` = 33ad44c (main unveraendert seit dem Start): **773/773** (427 s).
`tests/abgleich-app.test.mjs` braucht allein ~160 s (davon die Messung ~105 s: dreimal 20 Min. Ueben + 1 Stunde).

## Entscheidungen (Peter kann widersprechen)
- **Takt 30 s** fuer Holen und Senden (Begruendung oben).
- Ein Zeitgeber fuer alles; versteckt wird nicht abgeglichen (Zurueckkehren holt sofort).
- Kind mitten in einer Runde: senden ja, Neues erst nach der Runde (nicht: gar nicht abgleichen).
- Zeile im Kopf des Elternbereichs, fuer jeden Erwachsenen; Zahl "nicht übernommen" zaehlt alles Verworfene dieses
  Geraets (auch harmlose Faelle, siehe Restrisiken).
- Zugang abgelaufen: neuer Schluessel direkt im Elternbereich eintragbar (eigenes Blatt), nicht nur auf der Anmeldeseite.
- Neue Geraetekennung: alle anderen auf dem Geraet melden sich neu an (sonst schriebe z. B. ein Kind auf einem
  entfernten Geraet ueber die neue Kennung wieder mit).
- "Fremder Speicher" = ein Speicher ganz ohne Konten (oder nicht erreichbar); gefragt wird nur, wenn eine Anmeldung
  nichts findet (eine Anfrage).

## Restrisiken / offen
- **Zahl "nicht übernommen" auch bei Harmlosem:** Auch Eintraege, die nur durch Reihenfolge verworfen werden, zaehlen
  (z. B. nach "Schlüssel erneuern" einmal ein Familien-Eintrag des anderen Elternteils mit `autor-unbekannt`, in
  `tests/module/geraete.test.mjs` sichtbar, sobald man jede Runde ansieht). Peter sieht dann z. B. "1 Eintrag nicht
  übernommen", obwohl nichts fehlt. Vorschlag: nur Gruende zaehlen, die auf Faelschung oder fehlende Rechte deuten -
  zum Entscheiden.
- **Schreiblimit:** 120 Commits je Stunde und uebendem Kind; zwei Kinder gleichzeitig ~48 % von 500. Bei mehr Kindern
  je Zugangsschluessel (Testinstanz mit Testfamilien unter einem Schluessel!) waere Senden je Runde statt alle 30 s die
  Stellschraube. Fuer Stufe 5 hat ohnehin jede Familie eigenes Repo/Token.
- Ein entferntes Geraet, das vor der Neuanmeldung offline war und das Entfernen nie gelesen hat, wechselt die Kennung
  erst nach dem ersten Abgleich nach der Anmeldung (belegt); was es davor geschrieben hat, bleibt nur dort.
- Nur auf echten Geraeten pruefbar: ob iOS beim Wechsel in eine andere App den Abgleich noch zu Ende laufen laesst
  (`visibilitychange`), echte Dauer je Abgleich bei GitHub, 304 in Safari.
