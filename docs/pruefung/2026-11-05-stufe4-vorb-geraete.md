# 2026-11-05 - Vorbereitung Stufe 4, Teil b: "Meine Geraete" und "Geraet entfernen" (nur Testbau)

## Auftrag
Vault: "Aufgabe Neuer Schluessel und Meine Geraete", Teil b (Teil a = PR #135). US9.7, Konzept 8.4, 10.2, 10.3.
Nur Module und Tests; `index.html` unveraendert; alle geaenderten Module `bau: test` (neu: `geraete`) - Live-Bau
unveraendert. Geprueft gegen die Simulation **und** den nachgebauten GitHub-Server.

**Erfolgskriterium:** Ein entferntes Geraet liest nichts Neues, seine neuen Eintraege werden verworfen; die anderen Geraete
gleichen weiter ab. **Ergebnis:** erfuellt (Tests unten, je Speicher). Fuer ein Kindergeraet gilt "liest nichts Neues" ab
dem neuen Passwort des Kindes (siehe Restrisiko) - darum der Hinweis an die Eltern.

## Ablauf
- **Meine Geraete** (`geraete.meineGeraete({ ablage, person, now })`): aus den unterschriebenen Zulassungs-Eintraegen aller
  Bereiche dieses Geraets: Kennung, Name (`device_added.label`; neu: `geraetName` beim Abgleich), erstes Mal, zuletzt (neuestes
  Ereignis der Person auf diesem Geraet = letzter Abgleich mit Neuem), entfernt, `wartet` (Entfernen vorgemerkt, noch
  nicht abgeglichen), `diesesGeraet`. Eltern sehen auch die Geraete ihrer Kinder.
- **Geraet entfernen** (`geraete.geraetEntfernen`): merkt das Geraet auf diesem Geraet vor (`bq_geraetEntfernen`); der
  naechste Abgleich schreibt in **jedem Bereich, in dem es angemeldet ist**, `device_removed` (der Verteiler: Elternteil
  bzw. die Person im eigenen Bereich) und wechselt dort den Schluessel; `key_rotated.geraete` nennt das Geraet.
  - Eigenes Geraet eines Erwachsenen: sofort **neuer Personenschluessel** (Teil a; aktuelles + neues Passwort).
  - Geraet eines Kindes (nur ein Elternteil der Familie): kein Passwort noetig; Ergebnis `passwortNeu: true` = Hinweis
    "Passwort des Kindes neu setzen".
  - Nicht erlaubt: das eigene, gerade benutzte Geraet (das ist "Abmelden"), Geraete eines anderen Erwachsenen, ein Kind
    entfernt selbst nichts.
- **Was danach vom Geraet kommt** (`abgleich.holen`): ein Ereignis des entfernten Geraets zaehlt nur noch aus seinen
  eigenen Buendeln bis zum Stand des Wechsels - spaetere (auch zurueckdatierte) und solche unter einem fremden Pfad ->
  `nach-entfernung`. Dazu wie bisher: nach dem Entfernen gilt das Geraet als nicht angemeldet (`geraet-nicht-angemeldet`)
  und meldet sich nicht selbst wieder an.

## Aenderungen
- `src/module/geraete.mjs` (neu; `meineGeraete`, `geraetEntfernen`, `GERAETE_FEHLER`), `module.json` (nach `einladung`).
- `geraeteabgleich`: vorgemerkte Geraete -> `device_removed` + Schluesselwechsel (`bereiche[area].entfernt`);
  `geraetName` -> `device_added.label`; Speicher `bq_geraetEntfernen` (`werkzeug/speicherstellen.json`).
- `bereiche.schluesselVerteilen({ geraete })`: neue Version auch ohne Halterwechsel, `key_rotated.geraete`.
- `abgleich`: Regel fuer entfernte Geraete (s. o.).
- `annahme`: Lehrkraft/Admin duerfen `device_removed` nur im eigenen Personen-Bereich.
- `ereignisse`: `key_rotated` optional `geraete` (Liste von Geraete-Kennungen); `einladung`: `geraetName` durchgereicht.
  Keine neuen Ereignistypen (daher kein neuer Eintrag in `BEREICH_JE_TYP`).

## Belege
`tests/module/geraete.test.mjs` (4 Tests je Simulation und GitHub-Nachbau + Reinheit = 9):
1. **Meine Geraete:** Liste mit Namen, Zeiten, "dieses Geraet"; Peter sieht Kathies iPad; Rechte (Anna nicht Peters
   Geraete, Kind nichts, nicht das eigene Geraet, unbekanntes Geraet, falsches Passwort).
2. **Erwachsener:** neuer Schluessel sofort; in allen Kind-, Familien- und Personen-Bereichen `device_removed` und ein
   Wechsel, der das Geraet nennt; Familie arbeitet weiter (0 verworfen); das entfernte Geraet (alter Schluessel) liest
   nichts Neues, sein Schreiben kommt nicht an; mit dem neuen Passwort liest es, aber was es schreibt, zaehlt nicht.
3. **Kindergeraet:** neue Version in `kind:lern`, `kind:privat`, `schule` (im Eltern-Bereich war es nie angemeldet);
   was das Geraet danach uebt, zaehlt nicht; zurueckdatiert unter eigenem und unter fremdem Pfad -> `nach-entfernung`;
   nach dem neuen Passwort liest das alte Geraet nichts Neues.
4. **Lehrkraft** entfernt ihr zweites Geraet: neuer Schluessel, Entfernen im eigenen Bereich, neues Geraet sieht die Liste.

`annahme.test`: Rechte-Tabelle + Bedingung fuer `device_removed`.

**Gegenproben** (`%TEMP%\opencode\gegenproben-geraete.mjs`): **11/11 rot** - entferntes Geraet darf weiter schreiben;
kein `device_removed`; Bereiche wechseln nicht mit; Erwachsener ohne neuen Schluessel; "meldet sich wieder an" UND
Pfad-Regel fehlt; Anna entfernt Peters Geraet; Kind entfernt Geraete; Lehrkraft entfernt in Kind-Bereichen; Lehrkraft
darf gar nicht entfernen; Liste erkennt "entfernt" nicht; kein Geraetename. Dazu eine Probe, die **gruen bleiben muss**:
nimmt man nur "meldet sich nicht wieder an" heraus, faengt die Pfad-Regel es trotzdem ab (zwei Schichten).

**Volle Reihe** (eigener Arbeitsordner, mit `main` = cd7f9a5 = Teil a #135): erster Lauf 745/747 - zwei Rote in
`testinstanz.test` (die neue Geraetestelle `bq_geraetEntfernen` steht dort in einer fest eingetragenen Liste; das Werkzeug
macht sie richtig geraeteweit `bqt_geraetEntfernen`, nur der Test kannte sie nicht -> Liste nachgezogen). Zweiter Lauf
746/747: **Zufallsrot** in `testpersonen.test` (sucht "anna" im kleingeschriebenen Speicherinhalt - in base64 kommen vier
Buchstaben zufaellig vor) -> kurze Woerter jetzt nur als eigenes Wort (wie im Konto-Test), 3x einzeln gruen. Dritter
Lauf **747/747** (326 s).

## Entscheidungen (Peter kann widersprechen)
- Nur die Person selbst entfernt ihre Geraete; Eltern zusaetzlich die ihrer Kinder. Der andere Elternteil entfernt keine
  Geraete von Peter.
- Das gerade benutzte Geraet wird nicht "entfernt", sondern abgemeldet.
- "Zuletzt" = neuestes Ereignis der Person auf dem Geraet (Buendel tragen keine Zeit).
- Ein entferntes Geraet schreibt unter seiner Kennung nie wieder etwas, das zaehlt - wird es spaeter wieder benutzt,
  braucht es eine neue Geraete-Kennung (Oberflaeche Stufe 4).

## Restrisiken / offen
- **Kindergeraet bis zum neuen Passwort:** das entfernte Geraet hat Kathies Personenschluessel und kann auch die neue
  Version noch lesen (schreiben nicht). Erst "Passwort des Kindes neu" schliesst es aus - darum `passwortNeu`.
- Den eigenen Personen-Bereich des Kindes kann ein Elternteil nicht beschreiben; dort bleibt das Kindergeraet bis zum
  neuen Passwort angemeldet (danach wird der Bereich neu angelegt, wie bisher).
- Eine Lehrkraft entfernt nur in ihrem eigenen Bereich; in den Kind-Bereichen schuetzt der neue Schluessel (Teil a).
- Fuer die Oberflaeche: Liste und Entfernen in "Meine Geraete" (Eltern: auch je Kind), Hinweis "Passwort neu",
  `geraetName` beim Abgleich (z. B. "iPad", "Laptop").
