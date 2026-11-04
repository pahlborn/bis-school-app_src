# Name und Geburtsdatum (04.11.2026)

Vorgaben Peter (04.11.): Gibt es mehrere gleiche Vornamen, wird mit **Nachname** und **Geburtstag** unterschieden. Die **Lehrkraft** (mit Freigabe) darf auch das **Geburtsjahr** sehen. Das Geburtsdatum mit Jahr trägt **das Kind selbst** ein, wahlweise die Eltern. Bestehende Geburtstage ohne Jahr bleiben gültig, die Geburtstagsfeier funktioniert weiter.

## Umgesetzt – echte App (`index.html`)
- **„My profile“ (Kind):** Felder „First name“ und „Last name“ nebeneinander, Geburtstag mit Tag, Monat und **Jahr** (freiwillig; Auswahl: vor 3 bis vor 16 Jahren, ein gespeichertes Jahr außerhalb bleibt wählbar). Prüfungen: Tag und Monat zusammen; ein Jahr nur mit Tag und Monat; den Tag muss es im Jahr geben (29. Februar nur im Schaltjahr). Das Kind sieht sich weiter mit Vornamen.
- **Speicher:** `bq2_lastName` neu; `bq2_birthday` ist `'MM-TT'` (wie bisher) oder `'JJJJ-MM-TT'`. Alte Einträge bleiben gültig und werden ohne Jahr vorbelegt; unverändertes Speichern schreibt nichts.
- **Geburtstagsfeier:** rechnet nur mit Tag und Monat (`bdayParts`) – mit und ohne Jahr gleich.
- **Elternbereich (⚙ → „👧 Für <Kind>“ → Profilangaben):** zeigt „Vorname Nachname · Geburtstag TT.MM.JJJJ · Emoji“; neu aufklappbar „Name und Geburtstag ändern“ (Vorname, Nachname, Tag/Monat/Jahr, Speichern) mit denselben Prüfungen (DE/EN). Werte werden als Werte gesetzt, nie als HTML. „Angaben löschen“ löscht auch den Nachnamen.
- **Lehrkraft und Admin mit Freigabe:** Kinderliste, Kopf und „Auf einen Blick“ zeigen **Vorname Nachname**; haben zwei Kinder in ihrer Liste denselben Namen (ohne Groß-/Kleinschreibung), zusätzlich das **Geburtsdatum** (DE `14.05.2017` bzw. `14.05.` ohne Jahr; EN `May 14, 2017`). Der Anmeldename bleibt in Klammern. Eltern unverändert (Kopf mit Anmeldenamen). Emoji und Einstellungen nie.
- **Texte (DE/EN):** Einwilligungstext („sieht dabei Vor- und Nachnamen und das Geburtsdatum Ihres Kindes, aber nicht Emoji und Einstellungen“), Hinweis über den Freigaben, ⓘ-Hilfe der Profilangaben, Anleitungen Eltern/Lehrkraft/Admin, Kinder-Kurzanleitung („name, last name, birthday or emoji“).
- **Sicherung:** `lastName` gehört dazu (`BACKUP_KEYS`, `werkzeug/speicherstellen.json`).

## Umgesetzt – Testbau / Abgleich
- `ereignisse`: `profile_set.field` kennt `lastName` (Format bleibt 32 Typen).
- `bereiche` (`BEREICH_JE_TYP`): `profile_set:lastName` und `profile_set:birthday` → **`kind:lern`** (lesbar für Kind, Eltern, Freigabe-Empfänger). Emoji, Sprache, Ton bleiben in `kind:privat`.
- `lesen`: `lastName` kommt aus dem Protokoll des Kindes. `ableitung`: „Letzte gilt“ wie die anderen Profilfelder (keine Codeänderung nötig).

## Prüfung
- **Neu / angepasst:**
  - `tests/profil.test.mjs`: Dialog auf 4 Geräten ganz im Bild (mit Nachname und Jahr); Jahr und Nachname speichern, Schaltjahr, Jahr ohne Tag/Monat, alte Angabe ohne Jahr vorbelegt und unverändert; Geburtstagsfeier mit Jahr (2 Tage vorher, am Tag); Eltern tragen Nachname und Jahr ein (halbes Datum abgelehnt, Anführungszeichen und `<b>` nur als Text); Löschen auch des Nachnamens; Datensparsamkeit (2 Textfelder, 3 Auswahlfelder, kein Alter/Schule/Klasse).
  - `tests/lehrkraft-schueler.test.mjs` (Node-Sandbox, echte App-Instanzen, Abgleich): zwei Kinder „Kathie“ aus zwei Familien – mit verschiedenen Nachnamen „Kathie Becker (kathie)“ / „Kathie Schmidt (kathie.b)“ ohne Datum; nachdem Familie 2 im Elternbereich den gleichen Nachnamen und das Jahr einträgt: „Kathie Becker, 14.05.2017 (kathie)“ / „Kathie Becker, 03.09.2016 (kathie.b)“, auch in „Auf einen Blick“; das Ereignis des Elternteils kommt beim Kind und bei der Lehrkraft an; Eltern-Kopf unverändert; Emoji bleibt verborgen. Bestehender Test: gleicher Name, ein Kind mit Geburtstag → „Kathie, 14.05. (kathie)“; Lehrkraft liest jetzt den Geburtstag, kein Emoji.
  - `tests/stufe1-p4.test.mjs` (echter Live-Bau, Klicks): Kinderliste der Lehrkraft mit verschiedenen bzw. gleichen Nachnamen, Datum mit/ohne Jahr, DE und EN; neuer Einwilligungstext und Anleitungen; Eltern sehen im Profil Name, Nachname, Datum.
  - `tests/schreibhaken-1b.test.mjs`: Kind mit Nachname und Jahr, Eltern ändern Nachname und Jahr, Löschen – `derive` = gespeicherter Stand; Geburtstagsfeier mit Jahr.
  - `tests/module/bereiche.test.mjs`: Typ → Bereich, Lese-Matrix, Lehrkraft liest Nachname und Geburtsdatum, aber kein Emoji; Geburtstag in `kind:privat` jetzt verworfen.
  - Wächter (`schreiber.test`) und Speicherstellen (`stufe1-p1`) kennen `lastName`.
- **Gegenproben: 21 von 21 rot** (Skript `%TEMP%\opencode\gegenprobe-name.mjs`): kein Nachname bei der Lehrkraft; gleicher Name ohne Datum; Datum immer; Jahr nicht gespeichert; Geburtstagsfeier mit Jahr kaputt; alte Angaben ohne Jahr ungültig; 29.2. im Nicht-Schaltjahr; Jahr ohne Tag/Monat; Elternformular speichert nicht; Elternformular nicht vorbelegt; Geburtstag bleibt in `kind:privat`; Nachname ohne Bereich; Lehrkraft liest Emoji; Nachname ohne Ereignis; Löschen lässt Nachnamen stehen; alter Einwilligungstext; Sicherung ohne Nachname; Testbau liest Nachnamen nicht; „Auf einen Blick“ ohne Nachname/Datum; Eltern sehen „Name (Anmeldename)“; alte Lehrkraft-Anleitung.
- Volle Reihe: siehe PR.

## Entscheidungen (Peter kann widersprechen)
- **Ein Feld für das Datum:** `birthday` mit oder ohne Jahr statt eines eigenen Jahres-Feldes – ein Ereignis ändert das ganze Datum; alte Werte bleiben gültig.
- **Datum nur bei Gleichnamigen:** Die Lehrkraft sieht das Geburtsdatum in der Liste nur, wenn zwei Kinder in **ihrer** Liste denselben Vor- und Nachnamen haben (so die Aufgabe). Lesen kann ihre App es mit Freigabe immer (Bereich `kind:lern`); der Einwilligungstext nennt es deshalb immer.
- **Kinder-Anleitung bleibt kurz:** In der Eltern-Hilfe kein eigener Punkt (die Hilfe hat feste 7 Punkte und 2 000 Zeichen); der Hinweis steht in der ⓘ-Hilfe der Profilangaben.
- **Einwilligung:** Laufende Freigaben behalten ihren damals gespeicherten Text (wie am 04.11. beim Namen). Heute gibt es keine echte Lehrkraft-Freigabe.
- **Feldname „First name“** statt „Your name or nickname“ – ein Spitzname geht weiter, aber die Lehrkraft soll das Kind erkennen.

## Hinweis
- Live-App ändert sich (Profil, Elternbereich, Texte) → **nicht veröffentlicht**; Veröffentlichen nach Peters Freigabe durch die Koordination.
