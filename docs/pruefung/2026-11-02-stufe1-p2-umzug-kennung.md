# S11 Stufe 1 – P2 Umzug auf Kennungen und Schuldaten nach Kennung (02.11.2026)

Spezifikation: Vault „S11 Stufe 1 – Eindeutige Personen und Zuordnung“, Abschnitte 3.3 und 3.5 (Phase P2). Peter (02.11.): Kathie hat nie selbst geübt; der einzige echte Datenstand ist ihr Toddle-Stand. Eine Sicherung ihres iPads war deshalb nicht nötig.

## Umgesetzt

**Schuldaten nach Kennung:**
- `SCHOOL_DATA` steht nicht mehr im Quelltext der App, sondern in `werkzeug/schuldaten.json` (privates Repo, Schlüssel = Anmeldename, lesbar).
- Der Bau (`werkzeug/schule.mjs`, `appZusammensetzen` in `bauen.mjs`) setzt die Daten nach der **Kennung** des Kontos in die verschlüsselte App. Ein Name in der Datei ohne passendes Kinderkonto bricht den Bau ab.
- Die App ordnet nur noch nach Kennung zu (`schoolKid`).
- Inhalt unverändert: Die Datei wurde aus dem bisherigen Objekt erzeugt (6 Aufgaben, alle Felder); die Live-Prüfung zeigt die Einstufungen wie vorher.

**Speicher nach Kennung (Umzug auf dem Gerät, einmalig):**
- Jedes Kind – auch das erste – speichert jetzt unter `bq2_<Kennung>__<key>`, Passwörter unter `bq2_pw_<Kennung>`. Sitzungen tragen zusätzlich die Kennung, damit eine Umbenennung des Anmeldenamens niemanden ausschließt.
- Beim ersten Start werden alle alten Werte **kopiert** und danach Zeichen für Zeichen verglichen. Nur wenn alles gleich ist, nutzt die App die neuen Schlüssel.
- Sonst: Teilkopie entfernen, mit den alten Daten weiterarbeiten, ruhiger Hinweis im Elternbereich mit „Erneut versuchen“. Der Fehlschlag bleibt gemerkt; es gibt keinen ungefragten neuen Versuch.
- Aufnahmen (IndexedDB) werden danach genauso kopiert und nach Anzahl und Größe geprüft.
- Die alten Daten bleiben 30 Tage liegen und werden dann gelöscht; Aufnahmen nur, wenn ihre Kopie gelang. Protokoll in `bq2_migr`.
- Ohne Konten (Betrieb ohne Anmeldung) ändert sich nichts.

## Prüfung

- **Neu `tests/stufe1-p2.test.mjs`:**
  - **K4:** Ein realistischer Altbestand (220 Versuche in 11 Quests, Belege, Wiederholung, Abzeichen, Blätter, Profil, zweites Kind, drei Passwörter, eine Aufnahme) liegt danach Wert für Wert gleich unter den Kennungen. Sitzung mit Kennung; eigene Passwörter funktionieren weiter; die Aufnahme ist kopiert; die alten Daten bleiben; kein zweiter Umzug.
  - **K5:** Bei echt vollem Speicher gelingt eine Kopie nicht. Die Teilkopie wird entfernt, die alten Daten bleiben in Gebrauch – auch nach einem Neustart. Der Hinweis erscheint; „Erneut versuchen“ klappt nach dem Freimachen.
  - **30 Tage:** nach 29 Tagen noch da, nach 31 Tagen entfernt.
- **Umgestellt auf Kennungen (bewusst):**
  - `stufe1-ist` – Speicher und Schuldaten; Schuldaten: das richtige Kind ja, ein anderes Kind mit gleichem Vornamen (`kathie.b`) nein;
  - `stufe1-p1` – Sicherung;
  - `anmeldung` – Schlüsselnamen;
  - `ablage`, `kern`, `version` – Vergleich über `appZusammensetzen`.
  - Speicherstellen-Verzeichnis um `migr`, `kidsHere`, `bq2_migr` ergänzt.
- **Gegenprobe (6 von 6 rot):**
  - veränderte Kopie;
  - Teilkopie bleibt liegen;
  - Löschen vor 30 Tagen;
  - nach Fehlschlag trotzdem neue Schlüssel;
  - Rückfall auf alte Schlüssel fehlt;
  - Schuldaten wieder nach Namen.
- `npm test`: 220 bestanden.
