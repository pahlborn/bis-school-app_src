# 2026-11-05 - Vorbereitung Stufe 4: "Familienfassung bauen" (bauen und pruefen, nicht veroeffentlichen)

## Auftrag
Vault: "Vorbereitung Stufe 4 - drei Aufgaben", Abschnitt "Familienfassung bauen" mit den Zusaetzen aus #139, #140, #141
(Peter, 05.11.: Vorbereitung - bauen und pruefen, **nicht veroeffentlichen, kein Repo anlegen**; Kathies echte App und
Daten bleiben unberuehrt). Nichts veroeffentlicht, kein Repo angelegt, nichts in ein echtes Repo geschrieben. Kathies App
(Live-Bau) verhaelt sich unveraendert: alles Neue in `index.html` haengt an `KONTO_UI` (nur mit Konten im Speicher).

**Erfolgskriterium:** Eine Bauart "Familie" baut die echte App mit Konto-, GitHub- und Abgleich-Modulen ohne
`konten.json`, ohne `SCHOOL_DATA` und ohne Testpersonen, verbunden mit `pahlborn/bis-school-app-familie`, verschluesselt
mit dem Familienpasswort; ein Suchlauf vor dem Schreiben findet jede Abweichung; die gebaute Fassung funktioniert in der
Sandbox (Anmelden, Kind anlegen, Abgleich gegen den GitHub-Nachbau) und zeigt Export/Loeschen im Elternbereich.
**Ergebnis:** erfuellt (Belege unten).

## Was neu ist
- **Bauart "Familie"** (`werkzeug/familie.mjs`, `familieBauen` in `werkzeug/bauen.mjs`):
  `node werkzeug/verschluesseln.mjs --familie` -> `dist-familie/` (nicht eingecheckt). Testbau + Schriften, Marken
  `BQ_KONTEN`/`BQ_SCHULE` leer, `/*BQ_SPEICHER*/null` -> `{"art":"github","repo":"pahlborn/bis-school-app-familie","wurzel":""}`,
  Token-Eintrag `bqf_gh`, Speicherstellen im Browser `bqf_` statt `bq2_`/`bq_` (auch IndexedDB `bqf_konto`,
  `bqf_audio__<Kind>`), Geraetedaten geraeteweit (GLOBAL_KEYS). **Ausnahme `bq_schluessel`**: den legt die Huelle an, die
  Selbst-Aktualisierung liest ihn - Familienpasswort, Huelle, Adresse, Titel und Manifest bleiben wie bei Kathies App.
  Huelle mit Tresor, Probe-Entschluesselung = App Byte fuer Byte.
- **Suchlauf** (`familiePruefen`, 19 Pruefungen, ein Fund bricht vor dem Schreiben ab): Schriften eingebettet; Schuldaten
  leer + kein Text aus `schuldaten.json`; Konten leer + keine Kennung/kein Hash aus `konten.json`; keine Testpersonen
  (Anmeldenamen und Namen aus `werkzeug/testpersonen.mjs`, nur ganze Woerter); nichts von der Testinstanz (`bqt`,
  Test-Repo, Test-Adresse, Name); kein `bq2_`, kein `bq_` ausser `bq_schluessel`; feste Speicherstellen nur `bqf_`;
  Token `bqf_gh`; GLOBAL_KEYS; mit dem Familien-Repo verbunden (genau dieser Speicher, genau einmal); Aktualisierung mit
  dem Familienschluessel; Testbau-Module; Version; verschluesselt; keine verbotenen Woerter, keine Version, kein Repo-Name
  im oeffentlichen Teil.
- **Veroeffentlichungsweg** vorbereitet, **nicht ausgefuehrt**: `werkzeug/veroeffentlichen.mjs --dist dist-familie`;
  Ablauf in `docs/veroeffentlichen.md`, Abschnitt 6 (nur nach Peters Go fuer Stufe 4).
- **Schulbewertungen aus dem Konto** (#141): mit Konten im Speicher rechnet `schoolData()` die Bewertungen aus dem
  Protokoll des Kindes (`school_import` im Bereich `schule`, `anmSchule` = `deriveSchool`), neu nur wenn sich das Protokoll
  aendert. Kathies App liest weiter `SCHOOL_DATA`.
- **Export und Loeschen im Elternbereich** (#140): Einstellungen -> "Familie": je Kind "📄 Daten" (vorher Abgleich; lesbare
  Seite und JSON ueber das Teilen-Menue bzw. als Download) und "🗑️ Loeschen" (Anmeldename zur Bestaetigung eintippen);
  unten "Mein Konto loeschen" (mit Passwort; einziger Elternteil: Familie und alle Kinder). Waehrend des Loeschens kein
  Abgleich daneben. Danach verschwindet vom Geraet: Eintrag in der Geraeteliste, Schluesselkopie, Sitzungen, Daten,
  `lastSeen`, Personen- und ggf. Familien-Stand und die **Leseaufnahmen** (IndexedDB).
- **Andere Geraete** raeumen beim naechsten Abgleich auf: Kind ausgetragen (`geloescht`), Konto nicht mehr im Verzeichnis
  (`kontoGeloescht`) und - neu - Bereiche, die der Speicher nicht mehr hat (`fehler: 'geloescht'`: eigener
  Personen-Bereich eines Erwachsenen, Lernbereich eines Kindes, Familienbereich). Wer davon hier angemeldet ist, wird
  abgemeldet.
- **"Ueber die App"** -> "Daten exportieren und loeschen" (nur mit Konten im Speicher): Alltagssprache, Link zur
  Anleitung `docs/endgueltig-loeschen.md` (Repo `bis-school-app_src`, fuer den Admin).
- **"nicht uebernommen"** (Peter, aus #139): zaehlt nur Gefaelschtes (`unterschrift`, `eintrag-passt-nicht`,
  `entschluesseln`, `geraet-fremd`) und Eintraege ohne Berechtigung (`nicht-mitglied`, `rolle-darf-nicht`,
  `bereich-falsch`, `nach-entfernung`, `geraet-nicht-angemeldet` **von einem entfernten Geraet**); nicht: `autor-unbekannt`,
  `geraet-nicht-angemeldet` sonst, `stand-alt`, `format`. Hilfetext angepasst.
- Anmeldeseite: "🔑 Storage access" statt "Test storage" (gilt fuer Testinstanz und Familie); Anleitungen "Zugang zum
  Speicher".

## Befunde
1. **Volle Reihe (811/812):** `testinstanz` "Code sonst gleich" - ein neuer Modul-Kommentar mit dem Namen "Kathie" wurde
   durch die Ersatzliste der Testinstanz zur 40. veraenderten Zeile (Grenze < 40). Behoben: Kommentar ohne Namen.
2. **Volle Reihe nach dem Einmergen (#142):** `abgleich-app` Test 5 rot (1 von 2 Reihen, einzeln 4 von 5): Eintraege
   eines **entfernten Geraets** verwirft die Annahme je nach Reihenfolge mit `geraet-nicht-angemeldet` statt
   `nach-entfernung` - meine erste Einteilung haette sie als harmlos verschluckt. Behoben: `geraet-nicht-angemeldet` zaehlt,
   wenn das Buendel (`<Geraet>/<n>`) von einem Geraet mit `device_removed` kommt. Danach 4/4 gruen.
3. **Eigene Pruefung (Datenschutz):** Loescht der letzte Elternteil sein Konto, kann ein zweites Geraet desselben
   Elternteils das Austragen der Kinder nicht mehr lesen (der Familienbereich ist schon weg) - es haette die Daten der
   Kinder behalten. Behoben (s. "Andere Geraete"), Test mit Peters zweitem Geraet und Ben.

## Belege
`tests/familienfassung.test.mjs` (9 Tests):
- Bau: Suchlauf 19/19, fuenf Dateien, Huelle mit Tresor, im Tresor genau der umgewandelte Testbau, Manifest wie Kathies
  App, `bq_schluessel` genau einmal; Umwandlung: ausser Praefixen genau drei erklaerte Zeilen.
- Gegenproben Suchlauf (jede Pruefung mit einer absichtlich falschen Fassung, u. a. jeder Testpersonen-Name, Testinstanz,
  alte Praefixe, anderes Repo/Nachbau/Unterordner/doppelt, Aktualisierung ohne Familienschluessel, Live-Bau, Google Fonts,
  Huelle ohne Tresor/mit Klartext, jedes verbotene Wort, Version und Repo im oeffentlichen Teil) und Umwandlung; Bau mit
  Testperson in `index.html` bricht ab und schreibt nichts; gleiche Quelle -> gleiche App.
- **Sandbox mit der gebauten Fassung** (aus dem Tresor, `api.github.com` -> GitHub-Nachbau, stellbare Uhr): Peter per
  Startlink, Kind Kathie anlegen, Kathie meldet sich an und uebt; Werkzeug `schulbewertungen-uebernehmen` schreibt ins
  Konto -> `schoolData` = Testdaten, Elternbereich zeigt sie, Kind sieht nichts; Export (HTML + JSON mit allen Antworten
  und der Schulbewertung); Kind loeschen (falscher Name -> nichts; richtig -> nichts mehr im Speicher, kein
  Verzeichniseintrag, Kathies iPad abgemeldet, Daten und Aufnahmen weg); "Ueber die App" mit Link; zweites Kind Ben und
  Peters iPhone; Konto loeschen (falsches Passwort -> nichts; richtig -> Familie weg, Peter abgemeldet); Peters iPhone und
  Bens Tablet melden beim naechsten Abgleich ab - **kein Schluessel und kein Wert mit Peters, Kathies oder Bens Kennung**
  auf irgendeinem Geraet; ueberall nur `bqf_` gelesen/geschrieben (ausser `bq_schluessel`), Kathies alte `bq2_`-Eintraege
  unveraendert, nur das Familien-Repo gefragt, keine Fehler.
- "nicht uebernommen" harmlos/zaehlt; Live-Bau ohne all das.
- Browser: Huelle -> Familienpasswort -> Familienfassung startet mit der Anmeldung ("Storage access"), ohne Zugang keine
  Anfrage an GitHub, alte Eintraege unveraendert, sonst nur `bqf_`.
- `tests/module/anmeldung.test.mjs`: Einteilung der Gruende (jeder Grund, entferntes Geraet).

Gegenproben: **25/25 rot** (`%TEMP%\opencode\gegenproben-familie.mjs`). Eine Probe ("Kind bleibt angemeldet") war allein
gruen, weil drei Wege ein geloeschtes Kind abmelden (`geloescht`, `kontoGeloescht` im naechsten Durchgang, Bereich weg) -
die Probe nimmt alle drei.

Volle Reihe (nach dem Einmergen von #142-#144, mit allen Korrekturen): **825/825** (399 s). Modultests 347/347; Bereich (Konto, Einladungen, Abgleich, Familie, Testbau, Testinstanz,
Schulimport, Altlasten, Schriften, Huelle, Veroeffentlichen) 85/85.

## Entscheidungen (Peter kann widersprechen)
- Praefix `bqf_` statt `bq2_`: die Familienfassung beruehrt Kathies bisherige Eintraege nie (Rueckweg sicher). Die alten
  Eintraege raeumt ein eigener kleiner Schritt nach der Rueckweg-Frist (30 Tage) weg.
- Kind loeschen mit eingetipptem Anmeldenamen, Konto loeschen mit Passwort.
- `format` zaehlt nicht als "nicht uebernommen" (z. B. ein Eintrag einer neueren App-Fassung auf einem noch alten Geraet).
- Link "Anleitung fuer den Admin" zeigt ins private Quell-Repo (nur Peter kann sie oeffnen); die Anleitung ist fuer ihn.
- Kein Live-Durchlauf fuer die Familienfassung (er meldet sich mit `konten.json` an); Pruefung bei der Umstellung mit Peter.

## Offen / Restrisiken
- Erst nach Peters Go: Repo `bis-school-app-familie` anlegen, Token, Umstellung (Plan "Stufe 4 - Familienbetrieb").
- Datenschutzseite (Entwurf wartet auf Peter) und "Zugang auf die Familiengeraete" (Token per QR) sind eigene Aufgaben.
- Schnappschuesse: `school_import` darf beim Verdichten nicht wegfallen - heute verdichtet die App nicht
  (`makeSnapshot` wird nirgends aufgerufen); beim Einbau beachten.
- Ein Elternteil, der sein Konto loescht, waehrend der andere bleibt: seine anderen Geraete melden ihn beim naechsten
  Abgleich ab, behalten aber ihre (veralteten) Kopien der Kinderdaten - die Kinder gibt es ja weiter. Vorschlag fuer eine
  kleine Folgeaufgabe: beim Abmelden eines geloeschten Kontos auch die Kinder entfernen, die sonst niemand auf dem Geraet
  sieht (Test mit Anna).
- Auf echten Geraeten offen: Teilen-Menue mit HTML/JSON auf dem iPad, Loeschen der Aufnahmen in Safari.
