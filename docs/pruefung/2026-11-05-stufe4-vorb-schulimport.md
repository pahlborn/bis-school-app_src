# 2026-11-05 - Vorbereitung Stufe 4: "Schulbewertungen uebernehmen" (nur Werkzeug und Testdaten)

## Auftrag
Vault: "Vorbereitung Stufe 4 - drei Aufgaben", Abschnitt "Schulbewertungen uebernehmen" (Peter, 05.11.: Vorbereitung, nur
Werkzeug/Testbau und Testdaten, nichts veroeffentlichen). `index.html` unveraendert; das einzige geaenderte Modul
(`ableitung`) ist `bau: test` - **Live-Bau byte-gleich** (SHA-256 vorher = nachher). Kathies echte
`werkzeug/schuldaten.json` wird nur gelesen (der Test prueft am Ende, dass sie unveraendert ist); nichts in ein echtes Repo
geschrieben.

**Erfolgskriterium:** Die Bewertungen kommen als `school_import` in den Bereich `schule:<Kind>` eines neuen Kontos, mit
Zaehlprobe vorher = nachher; Probelauf schreibt nichts; zweimal ausfuehren doppelt nichts; im Testbau zeigt der
Elternbereich danach dieselben Einstufungen, Luecken und denselben Fokus wie heute. **Ergebnis:** erfuellt (Belege unten,
je Speicher: Simulation und nachgebauter GitHub-Server).

## Ablauf
`node werkzeug/schulbewertungen-uebernehmen.mjs --repo <owner/name> --zuordnung kathie=<neuer Anmeldename> [--probe]`
(weitere Schalter: `--wurzel`, `--basis` = nachgebauter GitHub-Server, `--datei`, `--token-datei`).

1. **Datei und Zuordnung pruefen**, bevor irgendetwas gelesen wird: Version 1, je Kind `asOf` + Aufgaben mit Datum,
   Fach, Titel, Einstufungen nur C/M/E/RS/N (wie die App sie kennt), Texte de/en. Zuordnung **ausdruecklich** fuer jedes
   Kind der Datei (`--zuordnung alt=neu`, nie geraten), nichts darueber hinaus, gueltige und verschiedene Anmeldenamen.
2. **Anmelden**: Anmeldename und Passwort fragt das Terminal ab (Passwort verdeckt); nicht als Schalter, nicht ueber eine
   Pipe, nie gespeichert, nie ausgegeben. Nur ein Elternteil.
3. **Lesen ohne zu schreiben**: ein frisches Geraet gleicht mit `abgleichMitVerbindungen` ab, aber ueber `nurLesen` - jeder
   Schreibzugriff wird zurueckgehalten (Einladungen werden nie verbraucht). Daraus: Kinder der Familie und was die App fuer
   jedes Kind heute rechnet.
4. **Jedes Kind pruefen** (alle, bevor eines geschrieben wird): Konto da, Kinderkonto, in der Familie des Elternteils.
   Gleicher Stand schon da -> "schon uebernommen", nichts geschrieben. Neuerer Stand im Speicher -> Abbruch
   `neuere-daten`.
5. **Schreiben** (nur wenn etwas fehlt, nie im Probelauf): neues Geraet des Elternteils ("Werkzeug Schulbewertungen",
   erscheint unter "Meine Geraete"), Ereignis `school_import { asOf, data, source: 'toddle' }` ins Protokoll des Kindes,
   Abgleich (unterschrieben mit den Schluesseln des Elternteils, wie ein Elterngeraet).
6. **Zaehlprobe**: ein weiteres frisches Geraet liest alles aus dem Speicher und rechnet wie die App (`deriveSchool`).
   Verglichen: Bewertungen je Standard und Datum (wie `index.html schoolRatings`: nur bewertete Aufgaben), Zahl der
   Aufgaben und der wartenden, Pruefsumme ueber den ganzen Inhalt. Jeder Unterschied -> Abbruch `zaehlprobe` mit Liste.

Bericht im Terminal: je Kind "alt -> neu: n Aufgaben (w wartet), b Bewertungen an t Tagen - Status" und eine Tabelle
Datum/Standard/vorher/nachher - ohne Inhalte der Bewertungen, ohne Geheimnisse (Token und Passwort werden geschwaerzt).

## Aenderungen
- `werkzeug/schulbewertungen-uebernehmen.mjs` (neu).
- `src/module/ableitung.mjs`: `deriveSchool(events, { now })` - die Schuldaten eines Kindes aus seinem Protokoll: der
  Import mit dem neuesten `asOf` gewinnt, bei gleichem `asOf` der spaetere (Zeit, dann Kennung); ein Import, dessen Daten
  ein anderes `asOf` tragen, zaehlt nie. Nicht Teil von `derive` (die App hat heute keinen Speicherschluessel dafuer).
- `tests/schuldaten-beispiel.json` (Struktur von `schuldaten.json`, Werte erfunden), `tests/schulimport.test.mjs`,
  `package.json` (Testliste). Keine neuen Ereignistypen (`school_import` gehoert schon zu `schule` in `BEREICH_JE_TYP`).

## Belege
`tests/schulimport.test.mjs` - 13 Tests, Simulation und GitHub-Nachbau, Testpersonen Peter/Anna/Kathie Beispiel
(Familie A) und Peter B/Kathie B (Familie B):
- Testdaten haben dieselben Felder wie Kathies Datei; das Werkzeug nimmt Kathies Datei an (nur gelesen); Zaehlprobe
  (6 Aufgaben, 1 wartet, 16 Bewertungen; wartende Aufgabe zaehlt nicht).
- Probelauf: **kein einziger Schreibzugriff**; Bericht "wuerde uebernommen".
- Uebernahme: Zaehlprobe gleich; Kind (zum Rechnen, Weg A), Peter und Anna haben genau einen Import, von Peter
  unterschrieben, `deriveSchool` = Datei; das Werkzeug steht unter Peters Geraeten; Familie B unberuehrt.
- Zweiter Lauf: "schon uebernommen", **kein Schreibzugriff, kein neues Geraet**, keine Doppelung.
- Neuer Stand der Schule ersetzt den alten (17 Bewertungen); die alte Datei danach -> `neuere-daten`, nichts geschrieben.
- Gegenproben ohne Schreibzugriff: falsches Passwort, unbekannter Name, Kind statt Elternteil, fremde Familie (auch
  Peter B fuer Kathie A), Elternteil statt Kind, unbekanntes Konto, Zuordnung fehlt/zu viel/ungueltig/doppelt, unbekannte
  Einstufung.
- Verlorener Schreibzugriff (Speicher meldet "geschrieben", legt aber nichts ab) -> `zaehlprobe` mit
  "bewertungen: vorher 16, nachher 0" und den Zeilen je Standard und Datum.
- **Testbau**: Peters Laptop (Node-Sandbox, Testbau) zeigt im Elternbereich - Verlauf, "Aus der Schule" je Fach, Luecken,
  Fokus, Kapitel - **dasselbe** wie heute mit eingebauten Bewertungen. Gegenprobe: vor der Uebernahme keine Schuldaten,
  anderer Fokus. Dafuer setzt der Test an der Marke `BQ_SCHULE` genau die Rechnung `deriveSchool` ueber das Protokoll
  jedes Kindes ein - `index.html` bleibt unveraendert (s. "Fuer die Familienfassung").
- Schalter: `--repo` Pflicht, Repos der App (`bis-school-app`, `_src`, `-test`) abgelehnt, `--passwort` abgelehnt;
  ohne Terminal Abbruch (von Hand geprueft).

**Gegenproben:** 18/18 rot (`%TEMP%\opencode\gegenproben-schulimport.mjs`): Gleichstand-Regel, asOf-Pruefung, verlorene
wartende Aufgaben, Familie/Elternteil/Kinderkonto nicht geprueft, Probelauf schreibt, keine Erkennung "schon
uebernommen", Zaehlprobe ohne Abbruch, Zaehlprobe aus der eigenen Ablage statt aus dem Speicher, aelterer Stand
geschrieben, Kind ohne Zuordnung, unbekannte Einstufung, Repo der App, Passwort als Schalter, Einladung verbraucht,
Pruefsumme nicht verglichen, wartende Aufgaben gezaehlt.

**Volle Reihe:** siehe PR.

## Entscheidungen (Peter kann widersprechen)
- Der Anmeldename wird sichtbar abgefragt, nur das Passwort verdeckt (blind getippte Namen fuehren nur zu
  "Anmeldung fehlgeschlagen"). Beides nur im Terminal, nie gespeichert.
- Das Werkzeug ist fuer den Speicher ein eigenes Geraet des Elternteils ("Werkzeug Schulbewertungen") - nur wenn wirklich
  geschrieben wird; ein Probelauf oder ein zweiter Lauf legt kein Geraet an.
- Es gewinnt der Stand mit dem neuesten `asOf` (nicht der zuletzt geschriebene); ein aelterer Stand bricht ab statt
  stillschweigend zu verlieren.
- Ziel nur ueber `--repo` (kein Standardwert, nie geraten); fuer die Testinstanz das Test-Daten-Repo, fuer Stufe 4 das
  Familien-Repo.

## Fuer die Familienfassung (Hinweis)
- Die App liest Schuldaten heute nur aus der eingebauten `SCHOOL_DATA`. Die Familienfassung (ohne `SCHOOL_DATA`) muss
  sie aus dem Protokoll des Kindes rechnen: `deriveSchool` ueber `bq2_<Kind>__events` - genau wie der Testbau-Test es an
  der Marke einsetzt (`AUS_PROTOKOLL` in `tests/schulimport.test.mjs`). Wegen `evNeuLaden` nach einem Abgleich besser als
  Funktion statt einmal beim Start.
- Schnappschuesse (`schnappschuss`) enthalten keine Schuldaten: ein `school_import` darf beim Verdichten nicht
  wegfallen.

## Restrisiken
- Bricht das Werkzeug nach dem Schreiben ab (z. B. Netz), steht der Import moeglicherweise schon im Speicher; ein
  zweiter Lauf erkennt ihn dann als "schon uebernommen" und prueft die Zahlen erneut.
- Der echte Lauf gegen GitHub ist nur mit dem nachgebauten Server geprueft; gegen ein echtes Repo erst bei Stufe 4 (nach
  Peters Go), vorher mit `--probe`.
