# Admin-Konzept – offene Fragen (Sammlung, nicht umgesetzt)

**Stand:** 02.11.2026, angelegt mit Paket B5 des Konzepts Elternbereich (`docs/konzept/elternbereich.md` 5.2).
**Status:** Nur Sammlung. Nichts davon ist umgesetzt. Die Admin-Rechte sind seit v58 unverändert. Ein Vorschlag geht als eigenes Dokument zur Freigabe an Peter.

## Was seit B5 gilt
- Das Admin-Konto ist ein eigenes Konto, kein Elternkonto (`src/module/rechte.mjs`, Befund B3 dort).
- Testkonten (`test: true`) erscheinen **nur im Admin-Konto**. Dort stehen **alle** Testkinder in der Kinderauswahl, in einer eigenen Gruppe „🧪 Testkinder“ am Ende, auch ohne Daten auf dem Gerät. Echte Kinder sieht der Admin nur mit Freigabe und nur lesend, diese stehen vor den Testkindern.
- „▶ Als Testkind spielen“ steht in der Testdaten-Zeile und spielt das gewählte Testkind.

## Offene Fragen
1. **Rechte bei Testkindern:** Das Konzept Elternbereich (5.9) sieht für Testkinder „wie Eltern“ vor. Heute gilt:
   - Der Admin sieht bei einem Testkind Übersicht, Fachansicht, Fokus-Schalter und ⚙ → „Für <Testkind>“.
   - **Sicherung und Freigaben** für Testkinder gibt es nicht, weil `canBackup()` Testkonten ausschließt.

   Soll der Admin für Testkinder auch sichern, zurückspielen und Freigaben ausprobieren können?
2. **Schalter „Testkinder zeigen“:** bisher keiner (Vorschlag aus dem Konzept: nicht nötig, weil nur der Admin sie sieht). Bestätigen oder einführen?
3. **Echte Kinder ohne Freigabe:** Heute sieht der Admin keine. Soll das so bleiben?
4. **Konten anlegen und sperren:** heute nur über `werkzeug/konten.mjs` auf dem Rechner des Admins. Auch in der App?
5. **Protokoll der Admin-Handlungen:** Ansehen über eine Freigabe wird im Protokoll der Eltern vermerkt, andere Admin-Handlungen nicht. Nötig?
6. **Absicherung des Admin-Kontos:** längeres Passwort, nur bestimmte Geräte, kürzere Sitzung?
