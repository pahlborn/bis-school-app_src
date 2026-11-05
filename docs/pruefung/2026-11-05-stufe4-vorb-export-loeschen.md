# 2026-11-05 - Vorbereitung Stufe 4: "Export und Loeschen" (nur Testbau)

## Auftrag
Vault: "Vorbereitung Stufe 4 - drei Aufgaben", Abschnitt "Export und Loeschen" (EP12, US12.1, US12.2, E8; Konzept 7.2).
Parallel zu "Abgleich in der App" (#139) und "Schulbewertungen uebernehmen": nur Module, Werkzeug-freie Tests und Doku;
`index.html` unveraendert; alle geaenderten Module `bau: test` (neu: `kinddaten`) - Live-Bau unveraendert, nichts
veroeffentlicht, Kathies echte App und Daten unberuehrt. Die Knoepfe im Elternbereich kommen mit der Familienfassung.

**Erfolgskriterien und Ergebnis**
- Export vollstaendig: jede Speicherstelle aus 7.2 kommt vor -> **erfuellt** (Test vergleicht mit `werkzeug/speicherstellen.json`).
- Nach dem Loeschen findet niemand mehr etwas, auch ein zweiter Elternteil nicht -> **erfuellt** im Speicher (Simulation
  und GitHub-Nachbau: kein Buendel, kein Schluessel, kein Verzeichniseintrag, im Repo keine Datei mit dem Kind) und auf
  den Geraeten der Familie (Annas Geraet und das Kindergeraet raeumen beim naechsten Abgleich auf).
- Familie B bleibt unberuehrt -> **erfuellt** (gleicht weiter ab, keine Datei geloescht, Export geht).
- Gegenproben -> **19/19 rot**.

## Ablauf
- **Export** (`kinddaten.kindDatenExport({ ablage, konto, kind, now, heute, sprache })`, nur Elternteil der Familie):
  - liest, was das Geraet nach dem letzten Abgleich hat (die App gleicht vorher ab), rechnet die Werte wie die App
    (`ableitung.derive`, abgelaufene Freigaben wie `lesen.grantsAblauf`);
  - JSON (`format: bq-kinddaten`, v1): `daten` = jede Speicherstelle des Kindes mit Wert (Lernstand, Profil,
    Einstellungen, Luecken, Freigaben mit Protokoll, letzte Sicherung, **alle Ereignisse**), `schulbewertungen` (jede
    `school_import`), `geraete` (des Kindes), `zugriff` (wer in welchem Bereich einen Schluessel hat, aus der
    unterschriebenen Zulassung), `speicherstellen` (jede Stelle aus 7.2: im Export ja/nein, mit Grund), `hinweise`;
  - lesbare Seite (HTML, Deutsch oder Englisch): dieselben Abschnitte als Tabellen, jede Speicherstelle genannt; jeder
    Wert maskiert (kein HTML/Skript aus Daten);
  - Dateiname `big-quest-<anmeldename>-<JJJJ-MM-TT>.json/.html`.
  - Nicht im Export (mit Grund in der Datei): Geraete-Stellen (nie abgeglichen, z. B. Sitzung, Sprachaufnahmen) und
    Einstellungen der Erwachsenen (Personen-Bereich).
  - Kind, Lehrkraft, Admin, fremde Familie: `nicht-erlaubt` bzw. `kind-unbekannt`.
- **Kind loeschen** (`kindDatenLoeschen`): 1. `family_set` mit `removed: true` ueber das Kind, **sofort gesendet** -
  sonst wird nichts geloescht (`nicht-gesendet`; zweiter Aufruf geht, auch wenn das Kind schon ausgetragen ist);
  2. Speicher: alle Bereiche (4 Kind-Bereiche, `person:<Kind>`, Bereiche seiner Freigaben), Verzeichniseintraege
  (`<lookup>-<n>` zuerst, dann `<lookup>`), offene Einladungen dieses Elternteils fuer das Kind; 3. Geraet:
  `einladung.kindLokalEntfernen`.
- **Konto loeschen** (`kontoDatenLoeschen`, Elternteil, mit Passwort): letzter Elternteil -> jedes Kind, Familienbereich,
  eigener Bereich, Verzeichnis; sonst Austritt (`family_set removed` ueber sich, gesendet), eigener Bereich, Verzeichnis,
  offene Einladungen - der andere Elternteil wechselt beim naechsten Abgleich jeden Schluessel ohne ihn
  (`member_removed`). Auch der Gruender kann austreten (die Familie behaelt seine Kennung und seinen Anker).

## Aenderungen
- `speicher`: `removeArea(bereich)` -> `{ buendel, schluessel }`, `removeDirectory(lookup)` -> true/false
  (`SPEICHER_FUNKTIONEN` +2). `github`: dieselben Funktionen - je Datei ein DELETE (= ein Commit); aendert sich eine Datei
  waehrend des Loeschens, wird bis `GITHUB_VERSUCHE` Runden neu gelistet, dann `offline` (nichts still uebergangen);
  vergisst danach, was der Zugang ueber den Bereich wusste (auch der Schluesselordner-Cache aus #139; Sitzung ebenso).
- `ereignisse`: `family_set` optional `removed: bool`. **Kein neuer Ereignistyp** (daher kein neuer Eintrag in
  `BEREICH_JE_TYP`).
- `einladung`: `verbindungen` laesst Ausgetragene weg (auch den Gruender im Verzeichnis), neu `entfernt`;
  `kindLokalEntfernen` (neu); `abgleichMitVerbindungen`: raeumt ausgetragene Kinder vom Geraet (`geloescht`; nicht
  mitten in einer Runde des Kindes, `inDieApp: false`), und fragt fuer ein Konto, dessen eigenen Bereich das Geraet noch
  nicht kennt, zuerst das Verzeichnis: ein geloeschtes Konto wird nicht abgeglichen (`kontoGeloescht`).
- `geraeteabgleich`: (a) ein Bereich, den das Geraet im Speicher kannte und der keinen Schluesseleintrag mehr hat, ist
  geloescht -> `fehler: 'geloescht'`, nichts wird neu angelegt oder gesendet; (b) wer laut Familienbereich ausgetragen
  ist, bekommt keinen Schluessel mehr (der Verteiler wechselt ohne ihn) - nicht der Verteiler selbst.
- `kinddaten` (neu, `bau: test`, nach `geraete`): `kindDatenExport`, `kindDatenLoeschen`, `kontoDatenLoeschen`,
  `KINDDATEN_STELLEN` (Kopie von 7.2; ein Test vergleicht mit `werkzeug/speicherstellen.json`), `KINDDATEN_FEHLER`.
- `docs/endgueltig-loeschen.md` (neu): was Loeschen bedeutet, was danach noch liegt, Weg A (Repo loeschen) und Weg B
  (Historie bereinigen mit `git filter-repo`).
- `tests/abgleich-app.test.mjs` (aus #139): Zufallsrot behoben - "falsches Passwort" war Passwort + Buchstabe; hatte der
  Vorschlag 21 Zeichen, sah das wie ein Startcode aus (22 Zeichen) und die App zeigte "Passwort waehlen". Jetzt mit "!".

## Belege
- `tests/module/kinddaten.test.mjs` - 14 Tests, je Simulation und GitHub-Nachbau:
  - Export: Liste = `speicherstellen.json` (alle Abschnitte), jeder Wert aus jedem Bereich da, Schulbewertungen, Geraete,
    Zugriff (Peter, Anna, Kathie; Bereich der Freigabe), Seite DE/EN mit jeder Stelle, kein Skript; Anna bekommt dieselben
    Werte (ihr Protokoll hat zusaetzlich nur Peters Kopie der Freigabe); Rechte.
  - Maskierung: Name `<img src=x onerror=...>` und `</script><b>"&` erscheinen nur maskiert.
  - Kind loeschen: vorher alles da, danach jeder Bereich leer, Verzeichnis weg, Peters/Annas/Kathies Geraet ohne Spuren,
    nach fuenf weiteren Abgleichen weiter leer, im Repo keine Datei; Anmelden geht nicht mehr; Name `kathie` wieder frei
    (neues Kind kommt bei Anna an); Familie B unberuehrt.
  - Ohne Netz: nichts geloescht, zweiter Versuch schafft es.
  - Konto Anna: falsches Passwort / Kind -> abgelehnt, nichts geloescht; danach Peters Abgleich: `member_removed` in jedem
    Bereich, Annas alter Schluessel oeffnet die neue Version nicht; Kathie uebt weiter, nichts verworfen.
  - Konto Peter (Gruender), Anna bleibt: Anna fuehrt weiter, Kathie kommt an, Anna legt ein Kind an.
  - Konto letzter Elternteil: Familie A ganz weg (auch im Repo), Kindergeraet legt nichts neu an (`kontoGeloescht`),
    Familie B unberuehrt.
  - `kindLokalEntfernen` ohne `key/removeItem`; Reinheit (kein Netz/Browser-Speicher/Uhr; nicht im Live-Bau).
- Vertragstest `removeArea/removeDirectory` fuer Simulation und GitHub (`speicher-vertrag.mjs`), GitHub: Abbruch mitten
  im Loeschen, 409-Dauerfall; Offline-Tests um die zwei Funktionen ergaenzt.
- Gegenproben: `%TEMP%\opencode\gegenproben-export.mjs` - 19/19 rot (Simulation/GitHub loeschen nicht, Abbruch nicht
  gemeldet, Schutz vor Neuanlage, Ausgetretene behalten Schluessel, verbindungen, Verzeichnis-Check, lokales Aufraeumen,
  Loeschen ohne gesendeten Vermerk, Freigabe-Bereich, Verzeichnis des Kindes, Konto ohne Passwort, Export ohne eine Stelle,
  Export nicht nur Eltern (zwei Schutzschichten, beide entfernt), Maskierung, Schulbewertungen).
- Volle Reihe: siehe PR.

## Entscheidungen (Peter kann widersprechen)
- Export liest den Stand des Geraets nach dem Abgleich (kein eigener Speicherzugriff) - die App gleicht vorher ab.
- Alle Ereignisse gehoeren in den JSON-Export (Art. 20); die Seite zeigt sie als Tabelle.
- Zuerst den Austrag senden, dann loeschen - sonst gaebe es Geraete, die das Kind weiter fuehren.
- Konto loeschen verlangt das Passwort (wie "Schluessel erneuern").
- Der austretende Elternteil wechselt die Schluessel nicht selbst (er koennte danach nichts mehr senden); das macht der
  andere Elternteil beim naechsten Abgleich.
- Familienbereich und eigene Einladungen behalten, dass es das Kind gab (verschluesselt, nur Eltern) - einzelne Eintraege
  aus einem Protokoll zu loeschen wuerde Unterschriften brechen.

## Restrisiken / offen
- GitHub-Versionsgeschichte: alte, verschluesselte Staende bleiben - Anleitung `docs/endgueltig-loeschen.md`.
- Bis der andere Elternteil abgleicht, hat ein ausgetretener Elternteil noch seinen Schluesseleintrag (sein Personenschluessel
  liegt nicht mehr im Verzeichnis; ein noch angemeldetes Geraet koennte bis dahin lesen).
- Geraet einer Lehrkraft: ihre lokale Kopie bleibt, bis die Einladung (EP9) Kinder einer Lehrkraft mitteilt.
- Offene Einladungen des **anderen** Elternteils fuer das Kind (z. B. neues Passwort) laufen nach 7 Tagen ab.
- Sprachaufnahmen (IndexedDB) loescht der Knopf der Familienfassung mit - nicht das Modul.
- Der Verzeichnis-Check kostet beim ersten Abgleich eines Kontos auf einem Geraet 1-2 Leseanfragen.
