# Anmeldung mit Rolle, Benutzer und Passwort (31.10.2026)

Vorgabe Peter: Kein Antippen von Namen; Benutzer + Passwort mit Auswahl Kind bzw. Eltern/Lehrkraft (wie Toddle). Der Admin legt Konten an, das Passwort vergibt jeder selbst; Konten zunächst „von hier“.

## Umgesetzt

- `werkzeug/konten.mjs`: Konten in `werkzeug/konten.json` (Name, Rolle student/parent/teacher, Admin, Zuordnung Erwachsene → Kind, **nur Hash** des Startcodes). Befehle: `neu`, `code-neu`, `entfernen`, `liste`. Startcodes (Form `ABCD-EFGH`) erscheinen nur im Terminal und in `%LOCALAPPDATA%\bis-school-app\startcodes.txt` – nie im Repo.
- Build: Konten werden nur in den verschlüsselten Tresor eingesetzt (Marke `/*BQ_KONTEN*/null`), vorher geprüft (Klartext-Code, fehlendes Eltern-/Kinderkonto, unbekanntes zugeordnetes Kind → Abbruch). Ohne `konten.json` läuft die App wie bisher ohne Anmeldung.
- App mit Konten: Start auf „Who is logging in?“ → „🎒 Student“ / „👪 Parent / Teacher“ → Benutzername + Passwort (oder Startcode). Keine Namensliste.
  - Erstes Anmelden mit Startcode → eigenes Passwort festlegen (Kind ≥ 4, Erwachsene ≥ 8 Zeichen), gespeichert nur als gesalzener PBKDF2-Hash auf dem Gerät. Der Startcode bleibt als Rückfall gültig.
  - Kinder bleiben auf dem Gerät angemeldet bis „Log out“. Kinder sehen keinen Elternbereich-Reiter; „👪 Grown-ups“ öffnet offen die Erwachsenen-Anmeldung.
  - Erwachsene: Elternbereich mit „Angemeldet als …“ und „Abmelden“; Abmeldung beim Verlassen, im Hintergrund und nach 5 Minuten. Lehrkraft: nur lesen (Beobachtungen, Hinweise, Version), keine Einstellungen.
  - 5 Fehlversuche → 30 Sekunden warten; unbekannte Namen kosten gleich viel Rechenzeit.
- Grenze ohne Server: Das eigene Passwort gilt auf dem Gerät, auf dem es festgelegt wurde. Die veröffentlichte Datei schützt weiter allein das lange Familienpasswort.

## Prüfung

- Neu `tests/anmeldung.test.mjs` (7 Tests, echte Klicks): Start mit Rollenwahl ohne Namen, kein Elternbereich ohne Anmeldung (auch nicht über `#eltern`); Kind: Startcode → eigenes Passwort (Länge, Wiederholung), bleibt angemeldet, Anmelden mit eigenem Passwort; falsches Passwort, falsche Rolle, Wartezeit; Kind ohne Eltern-Reiter, Erwachsenen-Anmeldung offen, Verlassen führt zurück zum Kind, keine Erwachsenen-Sitzung nach Neuladen; Abmeldung im Hintergrund; Lehrkraft nur lesend; Kontenprüfung und Tresor ohne Startcodes, Hülle ohne Namen.
- Angepasst: `kern`, `ablage`, `version` (Tresor-Vergleich inkl. Konten), `aufnahme` (wartet auf „Gespeichert“, behebt eine Zeitabhängigkeit im Test).
- Gegenproben (rot): Bildschirmschutz ohne Anmeldung entfernt; Abmeldung beim Verlassen entfernt; Passwort im Klartext gespeichert; Elternbereich-Reiter für Kinder sichtbar.
- `npm test`: 155 bestanden.

**Noch nicht veröffentlicht mit Konten:** Es gibt noch keine `konten.json`. Erst wenn die Konten angelegt sind, schaltet ein neuer Build die Anmeldung ein.
