# Elternbereich B1: Kopf und ⚙ Einstellungen (02.11.2026)

Paket B1 aus `docs/konzept/elternbereich-auftraege.md` (Konzept `docs/konzept/elternbereich.md` 5.1, 5.5, 5.7, 5.9).

## Anliegen
Seltene Funktionen (Einstellungen für das Kind, Sicherung, Freigaben, Konten, Version) standen als Kapitel zwischen Übersicht und Lesestoff. Der Kopf enthielt die Versionsnummer und für den Admin den Testkind-Knopf.

## Umgesetzt
- **Kopf:** Kind · Flaggen · **?** · **⚙️** · Abmelden. Die Versionsnummer ist aus dem Kopf entfernt (jetzt in ⚙ → Über die App), der Testkind-Knopf auch (vorläufig in ⚙ → Konten, bis B5). Für ? und ⚙️ gibt es `aria-label` und `title`, die Knöpfe sind mindestens 44 px breit.
- **⚙ Einstellungen** als eigene Ansicht mit „← Zurück zur Übersicht“, Abschnitte in fester Reihenfolge:
  1. 👧 Für <Kind> (Pisolala-Grenze, Kalender-Erinnerung, Profil). Die Überschrift nennt den Anmeldenamen.
  2. 💾 Sicherung & Daten
  3. 🔐 Zugriff & Freigaben
  4. 🛠 Konten (nur Admin, mit Testkind-Knopf)
  5. ℹ️ Über die App (Version, „Nach neuer Version suchen“)
  6. Knopf „Abmelden“ am Ende

  Die Inhalte sind **wörtlich** aus den bisherigen Kapiteln übernommen. Die internen Kennungen (`settings`, `backup`, `grants`, `accounts`, neu `aboutapp`) bleiben, damit Bindungen und der Aufklapp-Zustand wie bisher funktionieren. Die Rollenbedingungen sind unverändert (`isTeacher()`, `canBackup()`, Admin).
- **Übersicht:** nur noch Einstufungen der Schule, Übungsblätter, Ihr Kind unterstützen, So funktioniert Big Quest, Bedienung & Technik (ohne Version).
- **? (Hilfe):** öffnet vorläufig das Kapitel „📱 Bedienung & Technik“, auch aus ⚙ heraus. B2 ersetzt das durch die Hilfe-Ansicht.
- **Routen:** `#eltern/einstellungen` und `#eltern/einstellungen/<kind|sicherung|freigaben|konten|ueber>` öffnen ⚙ und klappen den Abschnitt auf. Die Browser-Zurück-Taste und „← Zurück“ führen zur Übersicht. Ist man nicht angemeldet, wird das Ziel bis nach der Anmeldung gemerkt. Grund: Die Anmeldeseite sperrt den Bereich und löscht die Adresse, das bleibt aus Sicherheitsgründen so. Beim Abmelden und beim Sperren (`parentLock`) wird die Route entfernt.

## Prüfung
- Neu: `tests/elternbereich-b1.test.mjs` (echte Klicks)
  - **T1:** Auf 320 px sind Kind, Flaggen, ?, ⚙️ und Abmelden sichtbar, ohne waagerechtes Scrollen. Im Kopf gibt es weder Version noch Testkind-Knopf, auch nicht beim Admin; der Testkind-Knopf liegt in ⚙ → Konten.
  - **T2:** ⚙ zeigt je Rolle genau ihre Abschnitte: Eltern `settings, backup, grants, aboutapp`; Lehrkraft ohne Freigabe `aboutapp`; Admin `accounts, aboutapp`. Die Übersicht enthält diese Abschnitte nicht mehr. Die Version steht in ⚙. Nach einem Sprachwechsel bleibt man in ⚙. „Abmelden“ am Ende wirkt wie im Kopf und hinterlässt keine Route.
  - **T3:** Eine Route öffnet den richtigen Abschnitt. Browser-Zurück, „← Zurück“ und ein zweites Tippen auf ⚙️ führen zur Übersicht. Aus einer Fachansicht führt ⚙ in die Einstellungen. ? öffnet die Anleitung. Eine Route vor der Anmeldung landet nach der Anmeldung im richtigen Abschnitt.
- Angepasst, weil sich nur der Ort geändert hat und nicht der Inhalt:
  - `app-hilfen.mjs`: `elternSeite` öffnet ⚙ für die verschobenen Abschnitte.
  - `anmeldung`: Kopf, Kapitelliste, Testkind über ⚙, Sprachprüfung auch in ⚙.
  - `info`: ⓘ-Prüfung in Übersicht und ⚙.
  - `stufe1-p1`: Sicherung in ⚙; die Gegenprobe für Admin und Lehrkraft prüft jetzt auch ⚙.
  - `stufe1-p4`: Die Rechtematrix liest Einstellungen, Sicherung, Freigaben, Konten und Profil in ⚙.
  - `version`: Version in ⚙ → Über die App.
- Gegenproben (rot):
  - T1–T3 mit der App von `main`: alle drei rot.
  - T3 ohne das Merken des Ziels über die Anmeldung: rot (so beim Bauen aufgefallen und behoben).
- `npm test`: 251 bestanden; nach dem Merge von `main` (Stufe 2 P1, #60) 263 bestanden.
- Bildschirmfotos auf 320 px und auf dem Desktop durchgesehen. Das schlichte ⚙ war auf dem blauen „aktiv“-Hintergrund kaum sichtbar, deshalb jetzt das Emoji ⚙️.

## Gefunden, nicht geändert
- Auf 320 px bricht „Abmelden“ in eine zweite Zeile um. Das ist sichtbar und bedienbar (T1). Eine engere Kopfzeile wäre eine Gestaltungsfrage für später.
- Die Bedienhilfe nennt noch Orte wie „💾 Sicherung → Jetzt sichern“ und „🔐 Zugriff & Freigaben“ ohne ⚙. Die Texte bleiben in B1 unverändert und werden in F1 auf die neuen Orte umgestellt (Konzept 7.7).
