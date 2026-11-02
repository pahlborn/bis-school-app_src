# Elternbereich C1: Schule in der Fachansicht (02.11.2026)

Paket C1 aus `docs/konzept/elternbereich-auftraege.md` (Konzept 5.3, 5.4, 5.9; Befund B17).

## Anliegen
Peter (02.11.): Die Einstufungen der Schule bestimmen die Aufgabenwahl. Sie gehören deshalb dorthin, wo Eltern den Fokus sehen und einstellen, nicht in ein Kapitel unten in der Übersicht.

## Umgesetzt
- **Fachansicht, oben „🏫 Aus der Schule“** (nur mit Schuldaten und wenn die Rolle sie sehen darf):
  - Tabelle der Standards **dieses Fachs**: Standard, letzte Einstufung mit Datum, vorherige, „Übt in der App“.
  - **Nächste Schritte** der Lehrkraft aus den Bewertungen der letzten 8 Wochen (gibt es keine so neuen, alle; wie `classTopics`), die das Fach betreffen, je mit „Daraus im automatischen Fokus: …“ (nur Quests dieses Fachs).
  - Bei **Me as a Learner**: Lernkompetenzen und Learner Profile.
  - Ein Herkunftssatz „Von der Lernplattform übernommen, Stand …“.
- **Zuordnung Standard → Fach** (`stdSubject`): Werden alle Quests eines Standards in einem Fach geübt, steht er dort; sonst entscheidet das Kürzel (M- Mathe, E- Englisch, S- Science, sonst Deutsch). So steht jeder Standard in genau einem Fach, und zwar dort, wo er geübt wird (Beispiel: Messen, nur in Science geübt, steht in Science).
- **Quest-Kopf:** App-Einschätzung und Schul-Einstufung nebeneinander („App …“, „🏫 Schule … Datum“) statt einer eigenen Zeile darunter (`schoolLine` entfernt).
- **🏫-Punkt an den Fächer-Kacheln:** die schwächste aktuelle Schul-Einstufung der Standards des Fachs.
- **Übersichts-Kapitel** heißt jetzt „🏫 Bewertungen der Schule – Verlauf“ und enthält nur die bewerteten und wartenden Aufgaben, neueste zuerst, mit Raster, „Das gelingt“, „Nächste Schritte“. Standard-Tabelle und Lernkompetenzen sind in die Fächer gewandert.
- Die Fokus-Logik ist unverändert. Die Lücken-Zeile im Block kommt mit D4.

## Prüfung
- Neu: `tests/elternbereich-c1.test.mjs` mit **erfundenen** Schuldaten (T13)
  - Jeder bewertete Standard steht in genau einem Fach; alle vier erscheinen; Messen steht in Science.
  - Mathe: vorherige Einstufung, nächster Schritt mit Fokus-Folge; kein Science-Schritt in Mathe; das Fokus-Etikett und der Schalter passen zum automatischen Fokus; die Schul-Einstufung steht am Quest-Kopf.
  - Lernkompetenzen bei Me as a Learner.
  - 🏫-Punkt: Mathe `rs`, Science `c`, Deutsch keiner.
  - Verlauf: nur Aufgaben inkl. der wartenden, keine Tabelle.
  - Lehrkraft mit Umfang „Lernstand“: weder Block noch Punkt noch Verlauf noch Schul-Chip. Mit „Schuldaten“: alles sichtbar.
- Angepasst:
  - `schule.test.mjs` (mit den echten Schuldaten aus dem Repo, wie bisher): Standards und Lernkompetenzen jetzt in der Fachansicht, Verlauf mit Aufgaben, Schul-Chip am Quest-Kopf.
  - `anmeldung`: neuer Kapiteltitel.
- Gegenproben (rot):
  - C1-Tests mit der App von `main` (2 von 2).
  - Zuordnung der Standards nur nach Kürzel (T13 rot: Messen stünde in Mathe).
- `npm test`: 327 bestanden; nach dem Merge von `main` (Aufgabe 2b, #69) 328 bestanden.
- Bildschirmfoto der Fachansicht mit erfundenen Daten durchgesehen.

## Gefunden, nicht geändert
- „Was kann ich hier tun?“ und die lange Fokus-Erklärung stehen noch in der Fachansicht. Sie werden in E1 gekürzt (Konzept 5.4).
