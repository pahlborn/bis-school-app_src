# Feintuning Elternbereich, Testkind, Infoseiten (31.10.2026)

Peters Feintuning-Liste vom 31.10. Den eigenen Plan habe ich vor der Umsetzung hinterfragt und vereinfacht (Vault: „Elternbereich – Neuordnung (Vorgabe)“, Abschnitt „Selbst hinterfragt“).

## Umgesetzt

- **Kopfzeile im Elternbereich**, bleibt beim Scrollen oben: Titel und Benutzer, Version, Sprache als **Flaggen** (🇩🇪/🇺🇸 als Bild, weil Emoji-Flaggen unter Windows nur als Buchstaben erscheinen) und **Abmelden**. Ohne Konten heißt der Knopf „Sperren“. Die Sprachwahl gilt für den ganzen Erwachsenenbereich.
- **Kein Zurück-Pfeil** und keine Reiterzeile im Elternbereich. Man verlässt ihn über „Abmelden“. Danach ist auf dem Gerät wieder das echte Kind angemeldet bzw. die Anmeldung zu sehen.
- **Testkind (nur Admin):** Ein Knopf „🧪 Testkind“ startet das Testkonto ohne neue Anmeldung. In der Testleiste führt „↩ Zurück zum Elternbereich“ zurück. Das Rückkehrrecht liegt nur im Speicher und erlischt, wenn die App in den Hintergrund geht, nach 30 Minuten oder beim Abmelden. Zeigt der Elternbereich Testdaten, steht das deutlich oben; „Zurück zu echten Daten“ schaltet um. Für andere Erwachsene gibt es keine Auswahl „Daten von“.
- **ⓘ an „+1 Tag“:** erklärt, was das Vorstellen der Uhr bewirkt und dass die Daten des Kindes unberührt bleiben. Die Testleiste ist jetzt deutsch.
- **Ein Titel statt mehrfach „About the app“:** Die Infoseiten heißen „📖 So funktioniert Big Quest“ / „📖 How Big Quest works“. Der Knopf auf der Startseite heißt ebenso. Der Titel steht nur einmal, als Kopf oder als Reiter.
- **Aufklappen statt Unterseiten:** Die Themen der Infoseiten und die Kapitel des Elternbereichs öffnen sich an Ort und Stelle. Kapitel im Elternbereich:
  - Übungsblätter
  - Einstellungen
  - Helfen wie die Schule
  - **„📖 Anleitung & Hintergrund“** (Anleitung und Infoseiten zusammengelegt)

  Geöffnete Kapitel bleiben beim Sprachwechsel offen.
- **Sprache:** Ein angemeldetes Kind hat eine eigene Sprachwahl (Standard Englisch). „❓ Help“ öffnet die Kinderanleitung immer auf Englisch.
- **Navigation Testkonto → Infoseiten → zurück:** bleibt im Testkonto, das Rückkehrrecht bleibt erhalten (Test).

## Prüfung

- `tests/anmeldung.test.mjs`, neu bzw. erweitert:
  - Kopfzeile sichtbar und beim Scrollen oben, keine Pfeile oder Reiter;
  - EN-Umschaltung samt Kapiteln, Kapitel bleiben offen;
  - Kapitel klappen auf;
  - Testkind nur für den Admin, Hin- und Rückweg, Testdaten-Hinweis, „Zurück zu echten Daten“;
  - Abmelden stellt das echte Kind wieder her; ohne Kind führt es zur Anmeldung ohne übrig gebliebene Testsitzung;
  - Rückkehrrecht erlischt im Hintergrund;
  - ⓘ an „+1 Tag“.
- `tests/about.test.mjs`, neu gefasst: Aufklapp-Themen DE/EN, ein Titel, Flaggen als Bild, Sprache gemerkt.
- Angepasst: `blaetter`, `hilfe`, `info`, `neutral`, `elternansicht` sowie die Helfer `elternSeite` und `aboutAbschnitt` in `app-hilfen.mjs`.
- Gegenproben (alle rot):
  - Pfeil wieder sichtbar;
  - Rückkehrrecht bleibt im Hintergrund;
  - Testkind für alle Eltern;
  - Abmelden ohne Rückkehr zum echten Kind;
  - ⓘ fehlt;
  - Themen sind von Anfang an offen.
- Sichtprüfung per Screenshot: iPad mini (744 × 1133), iPhone SE (320 × 568), 390 px.
- `npm test`: 172 bestanden.

## Noch offen (nächste Schritte laut Vorgabe)

- Übungsblätter: Nummer, Korrektur, Verwerfen, offene Blätter in der Übersicht.
- Einstellen nur an einer Stelle (automatischer Fokus), „Helfen wie die Schule“ auflösen.
- „So helfen Sie“ je Quest aus den Quellen.
