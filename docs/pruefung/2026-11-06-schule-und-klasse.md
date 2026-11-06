# Prüfbericht: Aufgabe „Schule und Klasse“ (Peter, 05.11.)

Zweig `schule-klasse`, Stand 06.11.2026. Ändert die Live-App (Kathies App) und den Testbau. **Nicht veröffentlicht.**

## Was neu ist

- **Kinderseite (Englisch):** Dialog „🏫 My school“ – Jahrgangsstufe 1–6 (Pflicht, große Knöpfe), Klasse und Schule (freiwillig, freier Text). Erreichbar über die Karte „🏫 Which grade are you in? · My school“ oben auf der Startseite und über „My profile“ → „🏫 My school“ (öffnet sich über dem Profil; dort Eingetipptes bleibt).
- **Erste Anmeldung / bestehende Kinder:** Die Karte erscheint für ein angemeldetes Kind, solange keine Jahrgangsstufe eingetragen ist – also direkt nach dem eigenen Passwort und bei bestehenden Kindern beim nächsten Start. Nicht beim Testkind des Admins, nie für Erwachsene.
- **Gespeichert:** `bq2_mySchool` = `{grade, cls?, school?, year}`; `year` = Schuljahr beim Eintragen (`2026/27`, ab 1. August). Nur Eingetragenes, getrimmt; Klasse höchstens 12, Schule 60 Zeichen.
- **Elternbereich (DE/EN):** ⚙ „Für <Kind>“ → „Schule und Klasse“ / „School and class“: Anzeige („Jahrgangsstufe 3 · Klasse … · … · Schuljahr 2026/27“), Formular „Schule und Klasse ändern“ (Jahrgangsstufe Pflicht). „Angaben löschen“ entfernt auch diese Angaben.
- **Andere Jahrgangsstufe als 3:** ruhiger Hinweis in den Einstellungen und auf der Übersicht: „Für Jahrgangsstufe 4 gibt es in Big Quest noch keine Aufgaben. Ihr Kind übt weiter mit den Aufgaben der Jahrgangsstufe 3.“ Das Kind merkt nichts.
- **Neues Schuljahr:** Ist das gespeicherte Schuljahr älter, fragt die Übersicht der Eltern einmal „📅 Neues Schuljahr 2027/28: Ist Ihr Kind jetzt in Jahrgangsstufe 4? [Ja, Jahrgangsstufe 4] [Nein, bleibt 3]“. Jede Antwort speichert das neue Schuljahr. Das Archiv bleibt Teil der nächsten großen Version (AX1).
- **Lehrkraft/Admin mit Freigabe:** in Kinderliste und Kopf „👧 Mia Sonnenschein (mia) · Klasse Blue Owls · Sunny Hill“ (EN „Class …“); ohne Freigabe nichts. Einwilligungstext, Freigabe-Hinweis und Anleitungen (Eltern, Lehrkraft, Admin; DE/EN) und Kinderhilfe nennen es.
- **Testbau:** `profile_set.field` + `mySchool`, `BEREICH_JE_TYP`: `mySchool` → `kind:lern` (wie Name; Lehrkraft mit Freigabe „Lernstand“ liest es). `lesen`, `ableitung`, `kinddaten` (Export), `BACKUP_KEYS`, `werkzeug/speicherstellen.json` nachgezogen.
- **Feste Texte** nennen keine Schule, Klasse oder Lehrkraft; keine Beispiel-Klasse als Platzhalter.

## Entscheidungen (Peter kann widersprechen)

1. **Karte statt eigener Seite nach dem Passwort:** Die Frage steht oben auf der Startseite, bis die Jahrgangsstufe da ist. Sie blockiert nichts – das Kind kann sofort üben. Eine Pflichtseite hätte jede Anmeldung um einen Schritt verlängert.
2. **„Later“ erlaubt:** Pflicht heißt hier: ohne Jahrgangsstufe wird nichts gespeichert und die Karte bleibt.
3. **Eigener kleiner Dialog „My school“** statt Felder in „My profile“ (passt sonst auf dem iPhone SE nicht ohne Scrollen).
4. **Ein Feld `mySchool`** (Stufe, Klasse, Schule, Schuljahr zusammen, „Letzte gilt“) statt vier Felder – Stufe und Schuljahr passen immer zusammen.
5. **Aufrücken leert die Klasse** (ändert sich meist); die Schule bleibt. Hinweis, wo die neue Klasse einzutragen ist.
6. **Eltern-Kopf unverändert** (Anmeldename); die Angaben stehen unter ⚙.
7. **Lehrkraft sieht die Jahrgangsstufe nicht in der Liste**, nur Klasse und Schule (wie vorgegeben); lesen kann sie sie mit Freigabe (der Einwilligungstext nennt sie darum).

## Belege

- `tests/schule-klasse.test.mjs` (8 Tests, Live-Bau mit Konten, echte Klicks): erste Anmeldung (iPhone SE: alles im Bild, Tippflächen ≥ 44 px, nur Englisch, Pflicht, „Later“, als Text), bestehendes Kind (einmal gefragt, sieht nichts vom anderen Kind), Eltern (DE/EN, Pflicht, Hinweis Stufe 4, als Text, Löschen), neues Schuljahr „Ja“/„Nein“ (Kind und Lehrkraft nie gefragt, Frage kommt nicht wieder), Lehrkraft (nur mit Freigabe, DE/EN, nach Ablauf nichts), feste Texte (verbotene Wörter, kein Platzhalter).
- `tests/lehrkraft-schueler.test.mjs` neuer Test (Testbau, 5 App-Instanzen, simulierter Speicher): Kind trägt ein → Ereignis in `kind:lern`, gleiches Speichern schreibt nichts → kommt bei den Eltern an → Lehrkraft mit Freigabe sieht „· Klasse … · …“, Familie 2 ohne Freigabe: nichts auf dem Gerät der Lehrkraft → Eltern ändern (Ereignis vom Elternteil, Hinweis Stufe 4) → beim Kind und bei der Lehrkraft → nach dem Ende der Freigabe kommt nichts Neues an.
- Angepasst: `profil` (Datensparsamkeit: Schule nur hinter eigenem Knopf), `stufe1-p4` (Einwilligungstext, Anleitungen), `schreibhaken-1b` (Eltern-Formular, Löschen), `module/bereiche`, `module/schreiber`.
- **Gegenproben:** 27/27 rot (`%TEMP%\opencode\gegenproben-schule.mjs`, einzeln mit `NUR=<Teil des Namens>`; Prüfmodus `PRUEFEN=1`).
- **Volle Reihe:** siehe PR.

## Befund am Rande

Browser-Tests ohne `setDefaultTimeout` warten bei fehlendem Element endlos statt rot zu werden (eine Gegenprobe hing dadurch > 30 Min.). `tests/schule-klasse.test.mjs` setzt 20 s; für andere Testdateien wäre das eine kleine eigene Aufgabe.
