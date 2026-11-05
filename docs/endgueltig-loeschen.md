# Endgueltig loeschen - was "Loeschen" in der App bedeutet und wie man auch alte Staende entfernt

Stand: 05.11.2026 (Vorbereitung Stufe 4, Aufgabe "Export und Loeschen"; EP12, US12.2, E8).

## Was die App beim Loeschen tut

In der App (Familienfassung, Testinstanz): Elternbereich -> Einstellungen -> "Familie": je Kind "Daten" (Export) und
"Loeschen" (Anmeldename zur Bestaetigung eintippen), unten "Mein Konto loeschen" (mit Passwort). "Ueber die App" ->
"Daten exportieren und loeschen" verlinkt diese Anleitung.

**Kind loeschen** (ein Elternteil, `kinddaten.kindDatenLoeschen`):
1. Die Familie traegt das Kind aus (`family_set` mit `removed`) - sofort gesendet. Jedes Geraet der Familie laesst das
   Kind danach weg, gibt ihm keinen Schluessel mehr und legt seine Bereiche nie neu an.
2. Im Speicher werden entfernt: alle Bereiche des Kindes (`kind:lern`, `kind:privat`, `schule`, `eltern:allg`,
   `person:<Kind>`, die Bereiche seiner Freigaben) mit allen Buendeln und Schluesseleintraegen, sein Verzeichniseintrag
   (Anmeldename und jedes neue Passwort) und die offenen Einladungen dieses Elternteils fuer das Kind.
3. Auf dem Geraet: alles vom Kind. Die anderen Geraete der Familie raeumen beim naechsten Abgleich auf, das Kindergeraet
   ebenso; danach kann sich das Kind nicht mehr anmelden.

**Konto loeschen** (ein Elternteil, nur mit seinem Passwort, `kinddaten.kontoDatenLoeschen`):
- Letzter Elternteil: jedes Kind wie oben, dazu der Familienbereich, der eigene Bereich und der Verzeichniseintrag - die
  ganze Familie ist weg.
- Ein anderer Elternteil bleibt: der Elternteil tritt aus der Familie aus (sofort gesendet), sein eigener Bereich, sein
  Verzeichniseintrag und seine offenen Einladungen gehen; beim naechsten Abgleich des anderen Elternteils wechselt jeder
  Schluessel ohne ihn. Die Kinder bleiben beim anderen Elternteil.

## Was danach noch irgendwo liegt (ehrlich)

| Wo | Was | Lesbar? |
|---|---|---|
| GitHub-Versionsgeschichte (git) des Daten-Repos | jede fruehere Fassung jeder Datei: verschluesselte Buendel, verpackte Schluessel, Verzeichniseintraege (Personenschluessel, mit dem Passwort bzw. Wiederherstellungscode gesperrt) | Buendel nur mit dem Bereichsschluessel. Den bekommt nur, wer einen Personenschluessel hat - und der ist mit dem Passwort gesperrt. Wer ein altes Passwort **und** eine Kopie der Versionsgeschichte hat, koennte alte Staende oeffnen. |
| Familienbereich (bei Kind loeschen) | dass es das Kind gab: Anmeldename, oeffentlicher Schluessel, "ausgetragen am" | nur fuer die Eltern der Familie (verschluesselt) |
| Personen-Bereich des Elternteils | seine Einladungen (Anmeldename des Kindes, Zustand) | nur fuer ihn selbst (verschluesselt) |
| Geraete, die seitdem nicht abgeglichen haben | ihre lokale Kopie | bis zum naechsten Abgleich; danach geloescht |
| Geraet einer Lehrkraft mit Freigabe | ihre lokale Kopie des Lernstands | bleibt bis zur Einladungs-Aufgabe (EP9) - der Speicher ist leer, neue Daten kommen nicht mehr |
| Sicherungsdateien, die jemand heruntergeladen hat | was beim Sichern da war | wie die Datei (Eltern bewahren sie auf) |
| Sprachaufnahmen (IndexedDB `bq2_audio`) | nur auf dem Geraet, auf dem sie entstanden | werden nie abgeglichen. Das Modul loescht sie **nicht** (kein Zugriff auf IndexedDB) - das macht die App selbst: der Knopf "Loeschen" im Elternbereich auf diesem Geraet, jedes andere Geraet der Familie beim naechsten Abgleich (Aufgabe "Familienfassung bauen", `kontoLokalWeg`) |

## So entfernt man auch die alten Staende (GitHub)

Nur noetig, wenn ausdruecklich alles aus der Versionsgeschichte weg soll (z. B. Ende des Familienbetriebs oder auf
Wunsch nach Art. 17 DSGVO). Beides macht Peter von Hand; die App tut es nie.

### Weg A - Repo loeschen (einfach, empfohlen am Ende eines Betriebs)
1. Vorher: jede Familie, die weitermacht, exportiert ihre Daten (Export im Elternbereich) - nach dem Loeschen gibt es
   keinen Weg zurueck.
2. GitHub -> Repo (z. B. `pahlborn/bis-school-app-testdaten` bzw. spaeter `pahlborn/bis-school-app-familie`) ->
   **Settings** -> ganz unten **Delete this repository** -> Namen eintippen -> bestaetigen.
3. Alle Tokens fuer dieses Repo loeschen (GitHub -> Settings -> Developer settings -> Fine-grained tokens).
4. Lokale Klone des Repos loeschen (falls es welche gibt).
5. Fuer einen Neustart: neues, leeres Repo gleichen Namens anlegen; Familien fangen neu an (wie in Stufe 4).

### Weg B - Versionsgeschichte bereinigen (das Repo bleibt, die anderen Familien bleiben)
Nur mit Absprache, weil alle Geraete danach eine neue Geschichte sehen.
1. Im Repo die Pfade des geloeschten Kindes bzw. Kontos bestimmen: `events/<Bereich>/`, `keys/<Bereich>/` fuer jeden
   Bereich aus dem Loeschbericht (`kindDatenLoeschen` -> `bereiche`) und `directory/<lookup>*.json`.
2. Frischen Spiegel-Klon ziehen: `git clone --mirror https://github.com/pahlborn/<repo>.git`
3. Mit `git filter-repo` (separat installieren: `uv tool install git-filter-repo`) die Pfade aus der ganzen Geschichte
   entfernen, z. B. `git filter-repo --invert-paths --path events/kind:lern:<Kind>/ --path keys/kind:lern:<Kind>/ ...`
4. Pruefen (`git log --all -- events/kind:lern:<Kind>` ist leer), dann `git push --force --mirror`.
5. Bei GitHub den Support bitten, zwischengespeicherte Ansichten alter Commits zu entfernen (sonst bleiben sie ueber
   ihre Commit-Adresse eine Zeit lang abrufbar).
6. Alle Geraete gleichen danach normal weiter ab - sie lesen ueber die Schnittstelle, nicht ueber die Geschichte.

Hinweis: Force-Push in ein Repo ist sonst verboten (Arbeitsregel) - hier nur fuer genau diesen Zweck und nur durch Peter.
