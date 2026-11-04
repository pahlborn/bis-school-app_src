# 2026-11-04 - Stufe 3b, Aufgabe "Einladungen", Teil ohne Oberflaeche (nur Testbau)

## Auftrag
Stufe 3b, Aufgabe "Einladungen" (Vault: "Stufe 3b - Anmeldung auf allen Geraeten"), **nur die Logik**: zweiten Elternteil einladen (mit Fingerabdruck), Kind anlegen (Start-QR-Code), Passwort des Kindes neu setzen ohne Datenverlust, Einladung zurueckziehen; Gueltigkeit 7 Tage statt 10 Minuten (`SPEICHER_EINLADUNG_MS`), nur einmal nutzbar. Geprueft gegen die Simulation **und** den nachgebauten GitHub-Server. US9.5, US9.6, US8.3, US6.5; Konzept 4, 5.1, 8.2, 8.3, 12. Die Oberflaeche kommt in einem eigenen PR nach "Anmeldung im Testbau".

`index.html` unveraendert. Live-Bau byte-gleich zu `origin/main` (SHA-256 des Live-Baus verglichen: `06575849...`).

**Erfolgskriterium (alle erfuellt, je Speicher):**
- Der zweite Elternteil sieht nach der Einladung dasselbe Kind - auch ein Kind, das er selbst spaeter anlegt, sieht der erste.
- Ein untergeschobener Schluessel wird erkannt: Warnung, nichts verpackt.
- Ein neues Kind uebt nach seinem Start-QR-Code auf einem eigenen Geraet; die Eltern sehen es.
- Passwort des Kindes neu: neue Schluessel, Zaehlprobe gleich (nichts verloren).

## Aenderungen
- `src/module/einladung.mjs` (neu, Testbau, nach `konto`; Hilfsnamen `eld`/`ELD_`):
  - `kindAnlegen({ zugang, ablage, konto, anmeldename, anzeigename, now })` -> `{ code, fingerabdruck, id, kennung, anmeldename, gueltigBis }` (Code + Fingerabdruck gehoeren in den QR-Code)
  - `elternteilEinladen({ zugang, ablage, konto, anmeldename, now })` -> dasselbe
  - `kindPasswortNeu({ zugang, ablage, konto, kind, now })` -> dasselbe (neuer Start-QR-Code fuer das bestehende Kind)
  - `einladungZurueckziehen({ zugang, ablage, konto, id, now })` -> `{ zurueckgezogen }`
  - `einladungenPruefen(...)` -> `{ bestaetigt, warnungen, abgelaufen }` (Geraet des Ausstellers)
  - `verbindungen({ ablage, konto, now })` -> Familien, Kinder, Verzeichnis, offene Einladungen (fuer `geraetAbgleichen`)
  - `abgleichMitVerbindungen({ ablage, zugang, konten, now, heute })` - das ruft die App statt `geraetAbgleichen`: baut Familie/Kinder/Verzeichnis aus den Protokollen, gleicht ab, prueft offene Einladungen, vermerkt die anderen Eltern, gleicht erneut ab, solange sich etwas aendert (hoechstens 4 Runden)
  - `anmeldenameVorschlag({ zugang, anzeigename })` ("Kathie Mueller" -> `kathie.mueller`, vergeben -> mit zwei Ziffern)
- `src/module/konto.mjs`:
  - Jeder Verzeichniseintrag aus einem Startcode traegt `beweis` = HMAC ueber `{ lookup, kennung, pub }` mit einem Schluessel aus dem Code; `kontoBeweisPruefen(pruef, eintrag)`. Der Aussteller bekommt den Pruefschluessel (`pruef`) und behaelt ihn in seinem Personen-Bereich.
  - Kind: Eintrag 1 traegt `anker` = der Elternteil, der es angelegt hat.
  - `ersteAnmeldung({ ..., fingerabdruck })`: Fingerabdruck aus dem QR-Code; passt er nicht zum unterschriebenen Aussteller -> `fingerabdruck`, nichts angelegt, Code bleibt gueltig. Ergebnis zusaetzlich `anker`, `familie`, `neu`.
  - `KONTO_AUSSTELLER.parent` = `['child', 'parent']`: ein Elternteil laedt den zweiten Elternteil seiner Familie ein (Startcode mit `familie` = Gruender).
  - `neustartAusstellen(...)` (Passwort des Kindes neu): Startcode fuer das bestehende Kind. Das Kind macht **neue** Schluessel; Eintrag `<lookup>-<n>` mit neuen Schluesseln, `beweis`, `vollmacht` (der unterschriebene Startcode) und Unterschrift mit dem neuen Schluessel. Er zaehlt nur, wenn die Vollmacht vom Anker des Kindes unterschrieben ist - oder von einem anderen Elternteil mit **Buergschaft** (der vom Anker unterschriebene Familien-Vermerk ueber ihn) - und nur einmal je Startcode.
  - `kontoStand({ zugang, anmeldename })`: oeffentlicher Stand (Kennung, Art, Schluessel, Stand) ohne Passwort.
  - `anmelden`/`wiederherstellen` nehmen die Schluessel des gueltigen Stands (nach "Passwort neu" die neuen).
- `src/module/speicher.mjs`, `github.mjs`: `SPEICHER_EINLADUNG_MS` = **7 Tage** (vorher 10 Minuten). Zurueckziehen = `invite.delete` (gab es schon).
- `src/module/ereignisse.mjs`: **35 Typen** (+3): `anchor_set` (wo ich hingehoere), `family_set` (Mitglied der Familie mit geprueften Schluesseln), `invite_set` (ausgegebene Einladung); `member_added` optional `stand`.
- `src/module/bereiche.mjs`: neue Bereichsart `familie:<Gruender>` (nur Eltern); `BEREICH_JE_TYP`: `anchor_set`, `invite_set` -> `person`, `family_set` -> `familie`. Schluesseleintraege tragen `fuer` (SHA-256 der Schluessel, fuer die verpackt wurde); hat ein Halter neue Schluessel, bekommt er **jede Version neu** (`geaendert`) und ein `member_added` mit `stand`.
- `src/module/zulassung.mjs`: Zeitraeume tragen `stand`; ein `member_added` mit aelterem Stand als dem geltenden wird verworfen (`stand-alt`) - ein spaetes altes Geraet stellt die alten Schluessel nicht zurueck.
- `src/module/geraeteabgleich.mjs`: neue Eingabe `familien` (Bereich `familie:<id>` zuerst, App-Protokoll `bq2_familyEvents`); beim Verteilen zaehlen Schluessel aus dem Verzeichnis mit hoeherem `stand` vor der Zulassung.
- `src/module/annahme.mjs`: Kind `anchor_set` (nur Art "child"), Eltern `anchor_set` (nur "family"), `family_set`, `invite_set`.
- `src/module/module.json`: `einladung` (Testbau, Browser-Test `testbau`).
- Tests: `tests/module/einladung.test.mjs` (neu, 11 Tests, 5 davon je Speicher), Ergaenzungen in `konto`, `bereiche`, `zulassung`, `annahme`, `ereignisse`, `speicher-vertrag` (7 Tage).

## So liegt es im Speicher (zusaetzlich zum Konto-Modul)
| Was | Wo | Inhalt |
|---|---|---|
| Wo ich hingehoere | `person:<ich>` (`anchor_set`) | Elternteil: Gruender der Familie; Kind: der Elternteil, der es angelegt hat |
| Ausgegebene Einladungen | `person:<Aussteller>` (`invite_set`) | Kennung der Einladung, Art (Kind, Elternteil, Neustart), Person, Anmeldename, Pruefschluessel, Ende, Zustand (offen, erledigt, zurueckgezogen, abgelaufen), Anzeigename |
| Familie | `familie:<Gruender>` (`family_set`, Schluessel nur fuer Eltern) | je Kind und Elternteil: Kennung, Rolle, oeffentliche Schluessel, Stand, Anmeldename; bei Kindern der Anker |
| Konto mit Beweis | `directory/v<Hash>.json` | wie bisher + `beweis` (Kind: + `anker`) |
| Neue Schluessel des Kindes | `directory/v<Hash>-<n>.json` | neue Schluessel, Schloss, `beweis`, `vollmacht`, Unterschrift mit dem neuen Schluessel |

Kein Anmeldename im Klartext ausserhalb verschluesselter Bereiche (in `familie` und `invite_set` verschluesselt, nur Eltern bzw. der Aussteller).

## Ablaeufe
- **Erster Elternteil:** Startcode vom Admin -> erste Anmeldung -> erster Abgleich vermerkt "eigene Familie" (Gruender).
- **Kind anlegen (US9.5):** Elternteil -> Startcode (Art Kind) + offener Einladungs-Vermerk -> Kind meldet sich mit Code + Fingerabdruck an (Eintrag mit Beweis und Anker), erster Abgleich vermerkt den Anker -> Elterngeraet prueft beim naechsten Abgleich den Beweis, nimmt das Kind in die Familie auf (`family_set`), schreibt den Anzeigenamen, verteilt die Schluessel -> Kind liest und schreibt.
- **Zweiter Elternteil (US9.6):** wie Kind, Art Elternteil, mit `familie` = Gruender. Nach der Aufnahme bekommt er den Familienbereich und alle Kinderbereiche; er vermerkt seinerseits die anderen Eltern (Buergschaft). Kinder, die er anlegt, stehen im Familienbereich - der erste Elternteil sieht sie.
- **Weiteres Geraet:** nur Anmeldename + Passwort; der erste Abgleich holt den Personen-Bereich (Anker/Familie), der naechste Familie und Kinder.
- **Passwort des Kindes neu (US9.5, Konzept 8.2):** Elternteil -> Neustart-Code -> Kind waehlt neues Passwort, bekommt neue Schluessel -> Elterngeraet prueft Beweis und Stand, vermerkt die neuen Schluessel (`family_set` mit Stand) -> beim Verteilen bekommt das Kind jede Version neu verpackt, `member_added` mit Stand -> das Kind liest alles, schreibt mit dem neuen Schluessel. Altes Passwort und alter Schluessel gelten nicht mehr.
- **Zurueckziehen (US8.3):** `invite.delete` + Vermerk "zurueckgezogen". Schon benutzt -> `{ zurueckgezogen: false }`, die Pruefung nimmt die Person auf.
- **Ablauf:** nach 7 Tagen nicht benutzt -> Vermerk "abgelaufen", Einladung aus dem Speicher geloescht.

## Belege (Tests)
| Test | Speicher | Ergebnis |
|---|---|---|
| US9.6/US9.5: Kind vor und nach dem zweiten Elternteil; beide sehen beide Kinder samt Lernstand; neues Kind uebt auf eigenem Geraet, Eltern sehen es; Anzeigename; zweites Geraet von Anna und Kathie nur mit Name und Passwort; Familienbereich nur Eltern; Peter darf auch Bens Passwort neu setzen | beide | gruen |
| US6.5: falscher Fingerabdruck im QR -> abgelehnt, Code bleibt gueltig; Gross-/Leerzeichen egal; getauschter Verzeichniseintrag (fremde Schluessel, fremder Beweis) -> Warnung, nicht in der Familie, kein Schluessel verpackt; nach Rueckkehr zum echten Eintrag geht es; fremder Elternteil, gefaelschte Buergschaft, selbst unterschriebene Vollmacht -> abgelehnt, Kathie kommt weiter hinein | beide | gruen |
| US9.5 Passwort neu: Zaehlprobe 7 -> 7 (+4 = 11 bei beiden Eltern, neuem Geraet); durch Anna (Buergschaft) und durch Peter (Anker); Code einmal; altes Passwort -> abgelehnt; alter Schluessel schreibt nichts mehr, was zaehlt; veraenderter Eintrag (Unterschrift, ohne Beweis, fremde Schluessel, Vollmacht) zaehlt nicht; dieselbe Vollmacht zweimal zaehlt nicht | beide | gruen |
| US8.3: zurueckziehen (auch vom zweiten Geraet), nach 10 Minuten und 6 Tagen gueltig, einmal, nach Gebrauch nicht zurueckziehbar, nach 7 Tagen abgelaufen + vermerkt; keine Einladung bleibt liegen | beide | gruen |
| Anmeldename-Vorschlag, Rechte (Kind/Admin legen hier keine Kinder an), ohne Familie, unbekanntes Kind, Buergschaft fehlt, Eingaben | beide | gruen |
| Reinheit; nur im Testbau | - | gruen |
| bereiche: neue Schluessel eines Halters -> jede Version neu, `fuer`, `member_added` mit Stand, alter Schluessel liest nichts; Eintrag ohne `fuer` gilt als passend; falsches `fuer` ungueltig | Sim. | gruen |
| zulassung: aelterer Stand wird verworfen (`stand-alt`); neuer Schluessel zaehlt ab dem Wechsel, alter davor | - | gruen |

Modul-Reihe 292/292; Browser-Tests `testbau`, `zwei-geraete`, `lehrkraft-schueler`, `testbau-lesen` 22/22.

## Gegenproben (34, alle rot)
Skript `%TEMP%\opencode\gegenproben-einladung.mjs` (aendert je Fall eine Stelle, laesst den passenden Test laufen, stellt wieder her; Einladungs-Tests dabei nur gegen die Simulation). Faelle u. a.: 10 Minuten statt 7 Tage, Beweis fehlt/ungeprueft, Fingerabdruck ungeprueft/verbraucht den Code/nicht vereinheitlicht, Kind ohne Anker, zweiter Elternteil ohne Familie, Vollmacht ohne Vertrauen, Buergschaft ungeprueft, Vollmacht mehrfach, Unterschrift mit neuem Schluessel ungeprueft, Eintrag ohne Beweis, Anmeldung mit alten Schluesseln, `geaendert` nie erkannt, `fuer` fehlt, `member_added` ohne Stand, Familienbereich fuer Kinder, `stand-alt` fehlt, Verzeichnis-Stand ignoriert, Familien nicht abgeglichen, Rechte (Kind Familie, Lehrkraft `family_set`), Zurueckziehen ohne Loeschen, Ablauf nicht vermerkt, Aufnahme ohne Beweis, Buergschaft nicht beigelegt, Eltern buergen nicht, Anzeigename fehlt, Kind findet Anker nicht, Einrichten fehlt, zweites Geraet richtet Familie neu ein, nur eine Runde, Modul nicht im Testbau.
Eine Gegenprobe blieb zuerst gruen ("Neustart: ohne Beweis" - der Test entfernte den Beweis, dadurch passte die Unterschrift schon nicht mehr). Der Test prueft jetzt zusaetzlich einen Eintrag ohne Beweis, der mit Kathies neuem Schluessel sauber unterschrieben ist.

## Entscheidungen (Peter kann widersprechen)
1. **Familienbereich** `familie:<Gruender>` (nur Eltern) fuer "beide sehen dieselben Kinder": Die Personen-Bereiche sind privat; ohne gemeinsamen Ort erfuehre der zweite Elternteil nie von Kindern, die der andere spaeter anlegt.
2. **Zweiter Elternteil bekommt sein Konto ueber die Einladung** (Konzept 4: "weitere Elternteile laedt ein vorhandener Elternteil ein"), nicht vom Admin. Ein schon bestehendes Konto einer Familie hinzufuegen ist nicht Teil dieser Aufgabe.
3. **Schluessel pruefen ohne Abtippen:** Der Fingerabdruck im QR-Code schuetzt den Eingeladenen (er prueft den Aussteller). Den Eingeladenen erkennt das Elterngeraet am Beweis aus dem Startcode - ein getauschter Eintrag hat keinen. Die 6 Woerter kann die Oberflaeche zusaetzlich zeigen.
4. **Passwort des Kindes neu = neue Schluessel** (Konzept 8.2). Wer ausser dem Anker neu setzt, braucht dessen Buergschaft; jeder Elternteil vermerkt die anderen Eltern automatisch beim Abgleich. Den Personen-Bereich des Kindes (`person:<Kind>`) kann nach dem Neustart niemand mehr lesen (nur das Kind hielt ihn) - er wird neu angelegt; darin liegt beim Kind nur der Anker, der mit dem Neustart-Code neu kommt. Lerndaten liegen in den Kinderbereichen und bleiben vollstaendig.
5. **Einrichten nach dem ersten Abgleich:** Der Vermerk "wo ich hingehoere" wird erst geschrieben, wenn das Geraet im eigenen Bereich angemeldet ist - sonst zaehlte er auf den anderen Geraeten nicht (Befund beim Testen).
6. **Ein Kind uebt erst, wenn ein Elterngeraet es aufgenommen hat** (einmal abgeglichen): Eintraege von davor zaehlen nicht (wie schon in 3b-2b entschieden). Die Oberflaeche soll das Kind bis dahin auf "Warte auf deine Eltern" halten.
7. Start-Link/QR-Format legt dieses Modul nicht fest (macht "Anmeldung im Testbau"); hier nur: Code + Fingerabdruck.

## Restrisiken und offen
- Wie beim Konto-Modul: Bei einem neuen Passwort eines **Erwachsenen** bleibt der Schluessel gleich (US9.7).
- Lehrkraft-Einladung (Anfragecode mit Fingerabdruck) und "Elternteil entfernen" sind nicht Teil dieser Aufgabe.
- Ein Elternteil kann bisher nicht in eine zweite Familie (ein Anker je Person).
- Abgleich in bis zu 4 Runden: auf GitHub entsprechend mehr Anfragen beim ersten Abgleich eines neuen Geraets (danach meist 1 Runde).
