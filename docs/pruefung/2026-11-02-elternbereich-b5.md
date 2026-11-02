# Elternbereich B5: Kinderauswahl und Testkinder (02.11.2026)

Paket B5 aus `docs/konzept/elternbereich-auftraege.md` (Konzept 5.1, 5.2, 5.9).

## Anliegen
- Mehrere Kinder wurden als Knöpfe im Kopf gezeigt.
- Das Testkind war ein Sonderweg: Der Admin sah es nur, wenn auf dem Gerät Daten lagen, nur das erste Testkonto zählte, und gespielt wurde über einen eigenen Knopf (zuletzt in ⚙ → Konten).
- Peter (02.11.): Testkinder sollen bei ihm wie jedes andere Kind erscheinen, sonst bei niemandem; das Admin-Konto ist ein eigenes Konto.

## Umgesetzt
- **Kinderauswahl als Liste** (`<select id="pKidSel">`) ab zwei Kindern; bei einem Kind die Anzeige wie bisher (`#pKid`).
- **Testkinder nur im Admin-Konto**, dort **alle** Testkonten in einer eigenen Gruppe „🧪 Testkinder“ am Ende der Liste. Für sie gilt die Bedingung „Daten auf diesem Gerät“ nicht (`kidChoices`), damit ein neues Testkind sofort wählbar ist. Echte Kinder mit Freigabe stehen davor.
- **„▶ Als Testkind spielen“** steht in der Testdaten-Zeile und spielt das **gewählte** Testkind (`playTest` mit `viewedKid()`). Der Knopf in ⚙ → Konten und `testUserFor()` sind entfernt.
- **Rechte unverändert:** `visibleKids` in `src/module/rechte.mjs` zeigt Testkonten schon heute nur dem Admin, das Modul bleibt unberührt. `canBackup()` schließt Testkonten weiter aus.
- **`docs/konzept/admin.md`** sammelt die offenen Admin-Fragen (Rechte bei Testkindern, Schalter, Konten in der App, Protokoll, Absicherung). Nichts davon ist umgesetzt.

## Prüfung
- Neu: `tests/elternbereich-b5.test.mjs` (echte Klicks)
  - **T10, Admin auf frischem Gerät:** beide Testkinder in der Gruppe, ohne Daten; die Liste passt auf 320 px. Das gewählte zweite Testkind wird gespielt, die Rückkehr funktioniert.
  - **T10 mit Freigabe:**
    - Elternteil: nur seine zwei Kinder, kein Testkind, auch nicht im Text von Übersicht, ⚙ und Hilfe.
    - Lehrkraft mit Freigabe: nur das freigegebene Kind, kein Testkind.
    - Admin mit Freigabe: das echte Kind zuerst, dann die Testkinder; erst nach Auswahl eines Testkinds erscheint die Testdaten-Zeile.
- Angepasst:
  - `anmeldung`: Testkind über Liste und Testdaten-Zeile; die Kinderwahl der Eltern über die Liste; der Admin sieht das Testkind sofort, das Gerät gehört weiter dem echten Kind.
  - `elternbereich-b1`: Spiel-Knopf nicht mehr in ⚙; der Admin hat für das angezeigte Testkind den Abschnitt „Für <Testkind>“.
- Gegenproben (rot):
  - B5-Tests mit der App von `main` (2 von 2).
  - Testkinder wieder nur mit Daten auf dem Gerät (2 von 2).
- `npm test`: 313 bestanden.

## Gefunden, nicht geändert
- Für Testkinder sieht das Konzept (5.9) „wie Eltern“ vor, also auch Sicherung und Freigaben. Heute geht das nicht (`canBackup()`). Das würde die Admin-Rechte erweitern und gehört deshalb in `docs/konzept/admin.md`, Frage 1.
