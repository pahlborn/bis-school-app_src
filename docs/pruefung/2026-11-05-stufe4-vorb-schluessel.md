# 2026-11-05 - Vorbereitung Stufe 4, Teil a: Personenschluessel erneuern (nur Testbau)

## Auftrag
Vault: "Aufgabe Neuer Schluessel und Meine Geraete", Teil a (von Peter am 04.11. freigegeben). US9.7, Konzept 8.2, 8.4, 10.2.
Nur Module und Tests; keine Oberflaeche, keine echten Daten. `index.html` unveraendert; alle geaenderten Module sind
`bau: test` - der Live-Bau ist unveraendert. Geprueft gegen die Simulation **und** den nachgebauten GitHub-Server.

**Problem:** (1) Befund Konto-Modul (#127): beim neuen Passwort blieb der Personenschluessel gleich - eine alte Kopie des
Speichers (Git-Historie) plus altes Passwort oeffnete das alte Schloss und damit alles. (2) Befund P3b-2: ein entferntes
Geraet eines Erwachsenen hat eine Kopie seines Personenschluessels.
**Erfolgskriterium:** Nach dem Erneuern oeffnet weder das alte Passwort mit einer alten Speicherkopie noch ein Geraet mit
dem alten Schluessel etwas **Neues**; schon Gesehenes bleibt gesehen. Die uebrigen Geraete und die Familie arbeiten weiter.
**Ergebnis:** erfuellt (Tests 1-5 unten, je Speicher).

## Ablauf (so arbeitet es)
1. **Verzeichnis** (`konto.schluesselErneuern`, und `konto.wiederherstellen` immer): neues Schluesselpaar, gesperrt mit dem
   neuen Passwort und einem neuen Wiederherstellungscode. Eintrag `<lookup>-<n>` mit den neuen Schluesseln, `wechsel` =
   Unterschrift des **alten** Schluessels ueber die neuen, `sig` = Unterschrift des neuen. Er zaehlt nur, wenn `wechsel`
   mit dem bis dahin geltenden Schluessel stimmt (Kette). Das aktuelle Passwort wird noch einmal verlangt (ein gestohlenes,
   angemeldetes Geraet kann den Schluessel nicht erneuern); das neue Passwort muss anders sein (`passwort-gleich`).
2. **Ankuendigung in jedem Bereich** (`geraeteabgleich`, Schritt 1b): das erneuernde Geraet bekommt das Konto mit `alt`
   (alte Schluessel). In jedem Bereich, dessen Zulassung noch die alten Schluessel hat, schreibt es `member_added` ueber sich
   selbst mit den neuen Schluesseln, **unterschrieben mit den alten**, und sendet das sofort - vor jedem Schluesselwechsel.
   Der neue Zeitraum beginnt eine Millisekunde spaeter (die Ankuendigung selbst gehoert noch zum alten Schluessel).
3. **Bereiche wechseln den Schluessel** (`bereiche.schluesselVerteilen`): hat ein Halter neue Schluessel (`geaendert`),
   gibt es eine **neue Version** fuer alle aktuellen Halter (vorher nur: neu verpacken). Sein Eintrag wird fuer die neuen
   Schluessel mit **allen** Versionen neu verpackt; `key_rotated` traegt `erneuert`. Das gilt auch fuer ein Kind nach
   "Passwort neu" (Auftrag: "pruefen, dass auch die Bereichsschluessel wechseln" - vorher wechselten sie nicht).
4. **Eigener Bereich** `person:<id>`: verankert an den **ersten** Schluesseln (`ursprung`), spaetere werden darin
   angekuendigt - so bleibt er ueber Erneuerungen hinweg lesbar (darin liegt u. a. "wo ich hingehoere").
5. **Der andere Elternteil** (`einladung.abgleichMitVerbindungen`): sieht im Familienbereich die angekuendigten neuen
   Schluessel, vermerkt sie (`family_set`) und meldet einmal `erneuert: [{ person, name, fingerabdruck, stand }]`
   ("Peter hat seinen Schluessel erneuert", neuer Fingerabdruck). Eine verworfene Ankuendigung -> `warnungen`
   (`art: 'schluessel'`, Grund).
6. **Fertig:** `erneuerungOffen` (Bericht) listet Bereiche, die den neuen Schluessel noch nicht haben; die App behaelt
   `alt` nur, bis die Liste leer ist.

## Aenderungen
- `konto`: `schluesselErneuern`, `wiederherstellen` (immer neue Schluessel; Ergebnis mit `fingerabdruck`, `alt`),
  `ktoErneuertOk` in der Kette, Konto mit `ursprung`, `kontoPersonen` gibt `ursprung`, `stand`, `alt` weiter,
  `kontoFingerabdruck`; Neustart-Code eines Kindes traegt `ankerKette` (die Ankuendigungen des Ankers), Buergschaft gilt
  mit jedem Schluessel der Kette; neuer Fehler `passwort-gleich`.
- `bereiche`: neue Version bei geaenderten Schluesseln, `key_rotated.erneuert`; Eintraege mit einem frueheren Schluessel des
  Verteilers zaehlen (`frueher`); `alteSchluessel` zum Oeffnen; **Schutz:** gibt es Schluesseleintraege, von denen keiner
  pruefbar ist, wird nie eine neue Version 1 angelegt (Fehler `schluessel-ungeprueft`; nur der eigene Bereich eines Kindes
  wird nach "Passwort neu" wie bisher neu angelegt).
- `zulassung`: `frueher` in `aktiveMitglieder`; Selbst-Ankuendigung: neuer Zeitraum ab t+1.
- `annahme`: Lehrkraft und Admin duerfen `member_added` nur ueber sich selbst mit gleicher Rolle, `key_rotated` nur im
  eigenen Personen-Bereich (Bedingungen kennen jetzt den Bereich).
- `abgleich`: Buendel einer Person aus `erneuert` mit alter Version nach dem Stand des Wechsels -> `nach-entfernung` (wie
  bei Entfernten); verworfene, lesbare Eintraege tragen `typ`.
- `geraeteabgleich`: Schritt 1b (Ankuendigung, sofort senden), Signieren mit dem Schluessel des geltenden Zeitraums,
  `ursprung` als Anker des eigenen Bereichs, `erneuerungOffen`.
- `einladung`: Hinweis `erneuert`, Warnungen, Ankerkette fuer "Passwort des Kindes neu".
- `ereignisse`: `key_rotated` optional `erneuert` (keine neuen Typen, daher kein neuer Eintrag in `BEREICH_JE_TYP`).

## Belege
`tests/module/erneuern.test.mjs` (5 Tests, je Simulation und GitHub-Nachbau = 10):
1. **Alte Speicherkopie + altes Passwort:** oeffnet das alte Schloss aus der Kopie, liest die 3 alten Antworten, nicht die
   2 neuen; der heutige Speicher oeffnet sich mit dem alten Schluessel gar nicht; altes Passwort -> `anmeldung`; ein mit dem
   alten Schluessel angekuendigter Verzeichniseintrag zaehlt nicht. **Zweites Geraet mit altem Schluessel:** liest nichts
   Neues; ein zurueckdatierter Eintrag mit altem Schluessel und alter Version -> `nach-entfernung`; nach Anmeldung mit dem
   neuen Passwort liest es alles und schreibt wieder; ein ganz neues Geraet findet Familie und Kind. Familie: 0 verworfen.
2. **Zweiter Elternteil:** gefaelschte Ankuendigung (fremder Schluessel, gueltig verschluesselt) -> Warnung
   `unterschrift`, nichts verpackt; gefaelschter Verzeichniseintrag zaehlt nicht; echte Erneuerung -> Hinweis mit neuem
   Fingerabdruck (einmal), Vermerk in der Familie.
3. **Lehrkraft mit laufender Freigabe:** liest nach Peters Wechsel weiter (Halterin der neuen Version); erneuert sie selbst,
   verpacken die Eltern neu, sie liest weiter, auch auf einem neuen Geraet.
4. **Kind, Passwort neu:** neue Version im Lern-Bereich; altes Geraet und alte Kopie lesen nichts Neues; nichts verloren.
5. **Nach dem Erneuern:** Peter (Anker) setzt Kathies Passwort neu (Ankerkette), Anna nach Wiederherstellen mit Code
   (Buergschaft mit Peters neuem Vermerk); alle Bereiche mit Annas neuen Schluesseln.

Angepasst: `annahme.test` (Rechte-Tabelle + eigener Test der Bedingungen), `bereiche.test` (Kind mit neuen Schluesseln ->
Version 3), `konto.test` (Wiederherstellen = neue Schluessel, `ursprung`), `zwei-geraete.test` E1: ein fremder "Gruender"
legt jetzt **nichts** mehr ab (`schluessel-ungeprueft`) statt Eintraege, die alle verworfen wurden.

**Gegenproben** (`%TEMP%\opencode\gegenproben-schluessel.mjs`): **16/16 rot** - Bereiche wechseln nicht mit; alter
Schluessel bleibt Halter; Wechsel ohne Unterschrift angenommen; Faelschung ohne Warnung; alter Schluessel darf weiter
schreiben; Lehrkraft verliert ihren Zugang; `frueher` fehlt; Schutz vor neuer Version 1 entfernt; eigener Bereich am
aktuellen Schluessel verankert; Ankuendigung schon im neuen Zeitraum; Ankuendigung mit neuem Schluessel unterschrieben;
Ankerkette fehlt; Buergschaft nur mit erstem Ankerschluessel; Hinweis fehlt; gleiches Passwort erlaubt; Lehrkraft darf
fremde Schluessel ankuendigen.

**Volle Reihe** (`voll-testen.ps1`, eigener Arbeitsordner, mit `main` = e28ff6f "Anmeldung im Testbau" #134): **738/738**
(351 s).

## Entscheidungen (Peter kann widersprechen)
- Wiederherstellen mit Code erzeugt **immer** neue Schluessel (Vorschlag aus dem Auftrag).
- "Schluessel erneuern" verlangt das aktuelle Passwort und ein **anderes** neues Passwort.
- Teacher/Admin duerfen nur ihren eigenen neuen Schluessel ankuendigen; Kinder bekommen neue Schluessel nur ueber die Eltern.
- Ein Kind nach "Passwort neu": jetzt auch neue Version in seinen Bereichen.
- Nie eine neue Version 1 ueber unpruefbare Eintraege (Fehler statt Neuanlage).

## Restrisiken / offen
- Ein alter, kompromittierter Schluessel kann **vor** der Erneuerung alles, was die Person kann (auch selbst "erneuern");
  danach nichts Neues mehr. Ein alter Ankerschluessel kann noch einen Neustart-Code fuer ein Kind ausstellen (die Kette
  bringt der Aussteller mit) - die Eltern nehmen ihn nicht auf (keine eigene Einladung), das Kind kommt dann erst mit
  einem neuen Code der Eltern wieder hinein. Eintraege, die ein frueherer Schluessel des Verteilers unterschrieben hat,
  zaehlen weiter (sonst ginge beim Wechsel die Geschichte verloren).
- Bricht der Abgleich nach dem Erneuern ab, fuehrt ihn dasselbe Geraet fort, solange es `alt` hat. Ist `alt` weg
  (App beendet), bleiben diese Bereiche beim alten Schluessel, bis ein Geraet mit dem alten Passwort sie nachholt
  (Oberflaeche Stufe 4: `alt` bis `erneuerungOffen` leer ist im Geraetespeicher halten).
- **Fuer die Oberflaeche (Anmeldung im Testbau, #134):** sie speichert je Konto nur `art`, `pub`, `schluessel`. Fuer den
  Abgleich braucht sie zusaetzlich `ursprung` (Anker des eigenen Bereichs) und nach `wiederherstellen`/`schluesselErneuern`
  kurz `alt`.
- Ein Buendel, das ein Geraet vor dem Wechsel mit der alten Version vorbereitet, aber erst danach gesendet hat, wird
  verworfen (wie bei Entfernten).
