# Entwicklungskonzept Ziel 1: Evaluationen übernehmen – Epics und User Stories

Stand 17.11.2026 · Grundlage: `docs/konzept/evaluationen-uebernahme.md` (Befunde B1–B8, Pakete U1–U13, Meilensteine M1–M4) · Zusammenfassung: `evaluationen-ziel1-zusammenfassung.md`

**Nummerierung:** Die Kennungen **EV-1 … EV-7** sind Arbeitsnamen. Die Zuordnung zu Peters Nummernschema (z. B. unter Epic `2026.0005` „Schulbewertungen“ oder einer neuen Nummer) legt Peter fest.

---

## 1. Rollen

| Rolle | Wer | Oberfläche |
|---|---|---|
| **Elternteil (iPad)** | Familie Peter | Swift-Playgrounds-App mit Toddle-Ansicht und KI |
| **Elternteil (Browser)** | andere Testeltern | Big Quest im Browser, ohne KI |
| **Kind** | merkt die Wirkung in Practise Today | Kinderseite |
| **Pflege** | Peter / Dev-Agent | Code (Standardliste, bekannte Kriterien) |

## 2. Gemeinsame Abnahmeregeln (Definition of Done, gilt für jede Story)

1. Automatischer Test mit **erfundenen Daten**: Browser-Test (Playwright) oder Modultest. Gegenprobe gegen `main` rot.
2. `npm test` vollständig grün; die iPad-CI-Läufe grün, wo Swift betroffen ist.
3. Texte in **DE und EN** (amerikanisches Englisch), Schreibregeln S1–S8, keine Zeitwörter (R10).
4. Kein API-Schlüssel im Browser-Speicher, keine Logik nur in der Swift-Hülle (Leitplanken, Konzept Abschnitt 8).
5. Prüfbericht unter `docs/pruefung/` (Anliegen / Umgesetzt / Prüfung / Gefunden).
6. Gerätetest auf dem iPad **nur**, wo die Story es ausdrücklich verlangt (Kennzeichen 📱).

---

## 3. Epics

| Epic | Titel | Ergebnis | Meilenstein | Größe | Abhängig von |
|---|---|---|---|---|---|
| **EV-1** | Playground stabil | Neue Testfassungen ohne Neuverbindung; Schlüsselbund-Fehler eindeutig | M1 | S | – |
| **EV-2** | Standard je Kriterium (Datenmodell) | Jede Evaluation speichert je Kriterium Einstufung und Lernbereich; Ableitung je Standard | M2 | L | – |
| **EV-3** | Standardliste | Alle Standards des Schuljahres in Alltagssprache, auch ohne Quest; pflegbar je Quartal | M2 | S | – |
| **EV-4** | Formular | Ein Formular für Browser und iPad: Fach als Auswahl, Bereich je Kriterium, Vorschau mit Zuordnung | M2 | M | EV-2, EV-3 |
| **EV-5** | Zuordnungsvorschlag | Vorschlag je Kriterium aus vier Quellen, Korrektur durch die Eltern | M3 | M | EV-3, EV-4 |
| **EV-6** | Nachzuordnung | Neue Standards erzeugen Vorschläge für frühere Kriterien ohne Bereich | M3 | S | EV-5 |
| **EV-7** | Wirkung und Abnahme | Übernommene Einstufungen erzeugen Lücke, Fokus, Übung; Abnahme der ganzen Kette auf dem iPad | M4 | M | EV-1 bis EV-6 |

**Voraussetzungen außerhalb dieser Epics** (`dev-auftraege-2026-11-03.md`), vor oder mit EV-7:
- Auftrag 1: Grundlage-Aufgaben.
- Auftrag 2: ehrlicher Lückenbalken ohne 14-Tage-Regel.

**Reihenfolge:**
1. EV-1, parallel dazu EV-2 und EV-3.
2. EV-4.
3. EV-5, dann EV-6.
4. EV-7.

---

## EV-1 · Playground stabil (Befunde B3, B4 · Paket U8)

**Ziel:** Eine neue Testfassung startet ohne neue Geräteverbindung und ohne neue Schlüsseleingabe. Oder wir wissen belegt, dass Swift Playgrounds den Schlüsselbund nicht hält.

### EV-1.1 Feste App-Kennung
> Als **Elternteil (iPad)** möchte ich eine neue Testfassung installieren, ohne dass meine bisherigen Einstellungen verloren gehen.

- **Gegeben** das Exportwerkzeug `werkzeug/ipad-playgrounds-paket.mjs`, **wenn** ein Paket gebaut wird, **dann** ist die App-Kennung immer `de.bigquest.ipad`. Der Name kann die Testnummer tragen, die Kennung nicht.
- Ein Test prüft, dass das Werkzeug keine wechselnde Kennung mehr erzeugt.
- 📱 Paket N und N+1 nacheinander: Die Geräteverbindung bleibt erhalten, oder das Ergebnis wird im Prüfbericht als „nicht gehalten“ dokumentiert.

### EV-1.2 Eindeutige Schlüsselbund-Diagnose
> Als **Elternteil (iPad)** möchte ich sehen, warum der Claude-Schlüssel fehlt, damit ich weiß, ob ich etwas tun kann.

- Speichern liest sofort zurück. Angezeigt werden die iOS-Codes von Speichern und Zurücklesen, **nie** der Schlüssel.
- Beim Start werden der Lese-Code und der Schlüsselbund-Bereich (Access Group) angezeigt.
- Die Meldungen unterscheiden mindestens: nicht gefunden (−25300), keine Berechtigung (−34018), Gerät gesperrt (−25308), sonstiger Code.
- 📱 Speichern → Playgrounds schließen → neu starten: Die Codes vorher und nachher stehen im Prüfbericht.

### EV-1.3 Geräteverbindung merken
> Als **Elternteil (iPad)** möchte ich das Gerät nur einmal verbinden.

- Nach erfolgreicher Verbindung legt die Swift-Hülle den Zugangscode im Schlüsselbund ab.
- Beim Start gibt sie ihn an Big Quest zurück, wenn dort keine Verbindung besteht.
- Ist der Code abgelaufen oder ungültig, gibt es einen klaren Hinweis und den normalen Verbindungsweg, keine Schleife.
- Ein automatischer Test der Übergabe (Web-Seite), soweit ohne Gerät möglich. 📱 Neustart ohne Neuverbindung.

### EV-1.4 Rückfall bei nicht haltendem Schlüsselbund
> Als **Elternteil (iPad)** möchte ich weiterarbeiten können, auch wenn das iPad den Schlüssel nicht behält.

- Nur falls EV-1.2 belegt, dass Playgrounds den Schlüsselbund zurücksetzt: Der Schlüssel wird einmal je Sitzung abgefragt und nur im Arbeitsspeicher gehalten.
- Kein weiterer Reparaturversuch. Vermerk im Prüfbericht.

---

## EV-2 · Standard je Kriterium (Befunde B1, B2 · Pakete U1, U2, U5)

**Ziel:** Jede Evaluation speichert je Kriterium Originaltext, Einstufung und Lernbereich. Big Quest leitet daraus die Einstufung je Standard ab.

### EV-2.1 Kriterium mit Lernbereich speichern
> Als **Elternteil** möchte ich, dass jedes Kriterium mit seinem Lernbereich gespeichert wird, damit Big Quest daraus Übungen ableiten kann.

- Das Ereignis `school_evaluation` trägt je Kriterium `criterion`, `rating` (RS/C/M/E oder leer) und `standard` (Kürzel oder `none`).
- Prüfung im Modul `ereignisse`:
  - Unbekanntes Kürzel wird abgelehnt.
  - `standard` ohne Kriterientext wird abgelehnt.
  - Mehr als die Höchstzahl Kriterien wird abgelehnt.
- Die Einschränkung auf M-N3/M-N5 (`SCHOOL_EVALUATION_TARGETS`) entfällt für die Zuordnung.

### EV-2.2 Ableitung je Standard
> Als **Kind** möchte ich, dass die Bewertung der Lehrkraft bestimmt, was ich übe.

- **Gegeben** eine Evaluation mit M-N1 = C, M-N3 = M und einem Kriterium ohne Bereich, **dann** liefert `ableitung` `std = {M-N1: C, M-N3: M}`. Das dritte Kriterium erscheint nur im Text.
- Datum und Revision der Evaluation gelten für alle ihre Kriterien.

### EV-2.3 Schwächere Einstufung bei gleichem Standard (O3)
> Als **Elternteil** möchte ich, dass eine Schwäche nicht untergeht, wenn zwei Kriterien zum selben Bereich gehören.

- **Gegeben** zwei Kriterien mit E-W1 = C und E-W1 = M in einer Evaluation, **dann** gilt E-W1 = C.
- Gespeichert bleiben beide Kriterien mit eigener Einstufung.
- Eine Änderung der Regel später erfordert keine neue Erfassung (Test mit umgestellter Regel).

### EV-2.4 Alte Daten bleiben gültig
> Als **Elternteil** möchte ich, dass bisher übernommene Bewertungen unverändert bleiben.

- Bestehende `school_import`-Daten und Einträge im alten Format (ein Standard je Evaluation, `unmapped`) werden weiter gelesen und ergeben dieselben Einstufungen wie vorher (Vergleichstest).
- Kein stilles Umschreiben gespeicherter Ereignisse.

### EV-2.5 Ein Speicherweg, genau einmal
> Als **Elternteil** möchte ich sicher sein, dass jede Evaluation genau einmal beim richtigen Kind landet.

- Manuelle Eingabe und iPad-Übernahme schreiben über denselben Weg (`school_evaluation`).
- Doppelte Bestätigung erzeugt keinen zweiten Eintrag.
- Ein Kind- oder Kontowechsel vor der Bestätigung verhindert das Speichern.
- Korrektur und Rücknahme funktionieren wie bisher (Revisionen).
- Abgleich mit zwei Geräten: Zwei unabhängige Evaluationen bleiben beide erhalten.

---

## EV-3 · Standardliste (Paket U3 · Entscheidung O5)

**Ziel:** Alle Standards des Schuljahres stehen in Alltagssprache zur Auswahl. Die Liste wächst je Quartal.

### EV-3.1 Alle Standards wählbar, auch ohne Quest
> Als **Elternteil** möchte ich jeden Lernbereich der Schule auswählen können, auch wenn Big Quest dafür noch keine Übung hat.

- Die Auswahl zeigt alle Einträge aus `STANDARD_TEXT` (DE/EN), gruppiert nach Fach.
- Bereiche ohne Quest tragen den Hinweis „wird angezeigt, keine Übung in Big Quest“.
- Ein Kriterium mit einem solchen Bereich wird gespeichert, erzeugt aber keinen Fokus. Kommt später eine Quest dazu, wirkt es automatisch (Test: Quest ergänzen → Lücke entsteht).

### EV-3.2 Liste pflegen
> Als **Pflege** möchte ich neue Standards je Quartal an einer Stelle ergänzen, ohne Code an mehreren Orten zu ändern.

- Standards stehen in einer einzigen Liste (Kürzel, Fach, Text DE/EN, optional Quests).
- Ein Test prüft die Liste:
  - Jedes Kürzel ist eindeutig.
  - Beide Sprachen sind vorhanden.
  - Jede genannte Quest existiert.
  - Jeder Hauptstandard einer Quest steht in der Liste.
- Kurze Anleitung „Standard ergänzen“ im Konzept.

---

## EV-4 · Formular (Befunde B1, B5, B6, B7 · Pakete U4, U7)

**Ziel:** Ein Formular für Browser und iPad, das Eltern ohne Vorkenntnisse bedienen können.

### EV-4.1 Lernbereich je Kriterium
> Als **Elternteil** möchte ich zu jedem Kriterium den Lernbereich sehen und ändern können.

- Jedes Kriterium hat ein Auswahlfeld „Bereich in Big Quest“ in Alltagssprache. Voreinstellung ist der Vorschlag (EV-5), sonst „Kein passender Bereich“.
- Das Feld ist mit Tastatur und Bildschirmleser bedienbar (Beschriftung je Kriterium).

### EV-4.2 Fach als Auswahl
> Als **Elternteil** möchte ich das Fach auswählen statt einzutippen.

- „Fach“ ist eine Auswahlliste mit den Fächern der App.
- Die Evaluation erscheint danach im richtigen Fach, auch bei den nächsten Schritten (Test).

### EV-4.3 Vorschau mit Zuordnung
> Als **Elternteil** möchte ich vor dem Speichern sehen, was Big Quest daraus macht.

- Die Vorschau zeigt je Kriterium „Kriterium → Bereich · Einstufung“.
- Je betroffenem Bereich steht dort „Lücke“ oder „keine Lücke“.
- Bei zwei Kriterien zum selben Bereich steht dort „E-W1: C (schwächere von C und M)“, mit der Möglichkeit, das zu ändern (O3).
- Die Vorschau schreibt nichts (Test: kein Ereignis vor der Bestätigung).

### EV-4.4 Strengere Prüfung im Ersatzweg
> Als **Elternteil (iPad)** möchte ich sicher sein, dass keine Einstufung falsch zugeordnet wird.

- Ohne Abschnitt „Assessment Criteria“ gilt eine Einstufung nur, wenn sie am **Ende** des Belegs steht.
- Testfall: Ein Kriterium „… Part C …“ mit M am Ende ergibt M, nicht C. Ein Beleg ohne Einstufung am Ende ergibt eine leere Einstufung.

### EV-4.5 Aussehen der App
> Als **Elternteil** möchte ich, dass das Formular aussieht wie der Rest von Big Quest.

- Farben aus den Variablen der App, kein festes `#fff`.
- Im Dunkelmodus lesbar.
- Auf 320 px ohne waagerechtes Scrollen (Test).

---

## EV-5 · Zuordnungsvorschlag (Paket U6 · Entscheidung O4)

**Ziel:** Jedes Kriterium bekommt einen Vorschlag; unsicher heißt „Kein passender Bereich“. Logik als Modul, das Browser und iPad nutzen.

### EV-5.1 Standard aus Toddle übernehmen
> Als **Elternteil** möchte ich, dass Big Quest einen Standard übernimmt, den die Lernplattform schon nennt.

- Enthält der Quelltext einen Abschnitt „Standards“, wird jeder Eintrag mit der Standardliste abgeglichen. Bei eindeutigem Treffer wird er vorgeschlagen.
- Test mit erfundenem Quelltext. 📱 Prüfen, ob Toddle diesen Abschnitt bei echten Evaluationen zeigt.

### EV-5.2 Bekannte Kriterien
> Als **Elternteil** möchte ich, dass ein Kriterium, das schon einmal bestätigt wurde, sofort richtig vorgeschlagen wird.

- Bestätigte Zuordnungen werden als Liste „Kriteriumstext → Standard“ gepflegt.
- Vorgeschlagen wird nur bei **wortgleichem** Text (nach Normalisierung von Leerzeichen und Groß-/Kleinschreibung), weil sich die Raster je Klasse und Lehrkraft unterscheiden.
- Test: Ein bekannter Satz wird vorgeschlagen; derselbe Satz mit einem anderen Wort wird nicht als bekannt vorgeschlagen.

### EV-5.3 Wortähnlichkeit
> Als **Elternteil (Browser)** möchte ich auch ohne KI einen brauchbaren Vorschlag bekommen.

- Ein fester Vergleich zwischen Kriteriumstext und Standardtexten (DE/EN) mit Schwellenwert. Darunter steht „Kein passender Bereich“.
- Abnahme mit der echten Mathe-Evaluation (Texte aus `spikes/schulbewertung-ki/bis-referenz.json`): Runden → M-N3, Stellenwert → M-N1; kein falscher Vorschlag bei den übrigen.
- Der Schwellenwert steht an einer Stelle und ist im Test begründet.

### EV-5.4 Claude-Vorschlag im Playground
> Als **Elternteil (iPad)** möchte ich, dass die KI auch schwierige Kriterien zuordnet.

- Erweiterung der Spike-Zuordnung auf **alle** Standards der Liste; Antwortschema mit `enum`, Antworten außerhalb der Liste werden abgelehnt.
- Reihenfolge der Quellen: Toddle-Standards → bekannte Kriterien → Claude → Wortähnlichkeit. Claude überschreibt nie eine Einstufung.
- Abnahme mit synthetischer Antwort (CI) und 📱 einmal mit echter Antwort.

### EV-5.5 Korrektur und Lernen
> Als **Elternteil** möchte ich einen falschen Vorschlag mit einem Tipp ändern.

- Jede Änderung wird gespeichert.
- Bestätigte Zuordnungen gehen als Kandidaten in die Liste bekannter Kriterien. Ob sie für andere Familien gelten, entscheidet die Pflege, nicht ein automatisches Teilen.

---

## EV-6 · Nachzuordnung (Paket U13)

**Ziel:** Frühere Kriterien ohne Bereich gehen nicht verloren, wenn die Standardliste wächst.

### EV-6.1 Hinweis auf neue Zuordnungen
> Als **Elternteil** möchte ich erfahren, wenn Big Quest frühere Kriterien jetzt zuordnen kann.

- Nach einer Erweiterung der Standardliste läuft der Vorschlag (EV-5) für alle gespeicherten Kriterien mit `none`.
- Gibt es Treffer, erscheint im Elternbereich ein ruhiger Hinweis „Neue Zuordnungen möglich“.
- Test: Standard ergänzen → Hinweis erscheint; ohne Treffer kein Hinweis.

### EV-6.2 Nachzuordnung bestätigen
> Als **Elternteil** möchte ich die neuen Zuordnungen prüfen, bevor sie wirken.

- Vorschau wie EV-4.3. Bestätigen schreibt eine **Korrektur** (Revision) der betroffenen Evaluation, kein neues Ereignis daneben.
- Ohne Bestätigung ändert sich nichts.
- Lehrkräfte mit Freigabe sehen den Hinweis nicht und können nichts bestätigen.

---

## EV-7 · Wirkung und Abnahme (Meilenstein M4)

**Ziel:** Die ganze Kette funktioniert: Evaluation → Lücke → Übung, auch auf dem echten Gerät.

### EV-7.1 Lücke und Fokus aus übernommenen Evaluationen
> Als **Kind** möchte ich genau das üben, was die Lehrkraft mit RS oder C bewertet hat.

- **Gegeben** eine übernommene Evaluation mit M-N1 = C, **dann**:
  - M-N1 erscheint unter „Lücken laut Schule“.
  - „Time & Numbers“ ist im Fokus.
  - Practise Today enthält höchstens 2 von 8 Aufgaben daraus.
- Bestehende Regeln gelten unverändert:
  - nur eine aktive Lücke
  - Reihenfolge RS vor C, älteste zuerst
  - geschlossen bleibt geschlossen
  - eine neuere Einstufung ab M schließt
- Gemischter Test: Daten aus dem alten Import und aus neuen Evaluationen zusammen.

### EV-7.2 Startschwierigkeit
> Als **Kind** möchte ich am Anfang nicht überfordert werden.

- Für einen Bereich mit RS oder C gilt die Startschwierigkeit aus der Schulbewertung (`standOf`), bis 6 eigene Antworten an 2 Tagen vorliegen (Test).

### EV-7.3 Abnahme auf dem iPad 📱
> Als **Elternteil (iPad)** möchte ich eine echte Evaluation von Anfang bis Ende übernehmen.

- Ablauf:
  1. Echte Evaluation aus Toddle lesen.
  2. Claude füllt das Formular.
  3. Die vorgeschlagenen Bereiche prüfen.
  4. Bestätigen.
  5. Die Lücke ist aktiv.
  6. Neue Runde: passende Übung.
  7. Playgrounds neu starten: alles noch da.
- Ergebnis mit Pass/Fail je Schritt im Prüfbericht.
- Kein Erfolg allein aus grüner CI ableiten.

### EV-7.4 Gleiche Kette im Browser
> Als **Elternteil (Browser)** möchte ich dieselbe Evaluation von Hand eintragen und dasselbe Ergebnis bekommen.

- Browser-Test: manuelle Eingabe derselben Evaluation ergibt dieselben Einstufungen je Standard und dieselbe Lücke wie EV-7.3.

---

## 4. Nicht Teil von Ziel 1

- Claude in Chrome, Text- oder Datei-Import, Einfügen im Browser mit Parser (Ziel 2: M5, M6).
- KI-Dienst ohne Schlüssel auf dem Gerät, TestFlight, App Store (M7–M9).
- Neue Quests für weitere Standards (E7).
