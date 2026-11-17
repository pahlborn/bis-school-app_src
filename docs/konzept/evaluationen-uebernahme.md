# Konzept: Evaluationen aus Toddle in Big Quest übernehmen (Entwurf)

Stand 17.11.2026 · Status: **Entwurf zur Abstimmung mit Peter** · Grundlage: Gespräch Peter/Claude vom 16.–17.11., Prototyp-Zweige bis Test 11 (`feature/bq-evaluation-end-to-end-test11`, 0.153.4-beta), KI-Spike (`spike/bq-schulbewertung-ki`), Plan „BQ-KI Elternintegration“ (13.11.), Machbarkeitsstudie Schulbewertungen (08.11.).

---

## 0. Entscheidungen von Peter (16.–17.11.)

| Nr. | Entscheidung |
|---|---|
| E1 | **Weg zur App:** zuerst Swift Playgrounds, dann TestFlight, zum Schluss App Store. |
| E2 | **Andere Eltern** testen zunächst im **Browser**, ohne Komfortfunktion zum Einlesen. Die manuelle Eingabe ins Formular reicht. |
| E3 | Die Komfortfunktion (automatisches Auslesen, KI) kommt **später**, wenn eine richtige App entsteht. |
| E4 | Es wird **nichts gebaut, was einer richtigen App im Weg steht**. |
| E5 | Datenschutz ist für den **jetzigen Testbetrieb** (eigene Familie) zu vernachlässigen. Für andere Familien gilt Abschnitt 4.5. |

---

## 1. Ziel

Eine Einstufung der Lehrkraft aus Toddle soll in Big Quest **dasselbe bewirken wie heute die eingepflegten Schulbewertungen**:

1. Sie legt die Startschwierigkeit fest.
2. Eine schwache Einstufung (RS oder C) wird zur **Lücke**.
3. Die Quests dieses Standards kommen in den **Fokus**.
4. „Practise Today“ übt sie, höchstens 2 von 8 Aufgaben, bis die Lücke geschlossen ist (Konzept `elternbereich.md`, Kapitel 6).

Big Quest erfindet dabei keine neuen Übungen. Es wählt aus den vorhandenen Quests. Für einen Standard ohne Quest gibt es keine Übung.

## 2. Grundsätze

| Nr. | Grundsatz |
|---|---|
| G1 | **Einstufungen kommen von der Lehrkraft, nie von der KI.** Eine Einstufung wird nur übernommen, wenn sie wörtlich in der Quelle steht. |
| G2 | **Ein Formular für alle Wege.** Manuelle Eingabe, Datei oder Text aus Claude in Chrome und das automatische Auslesen füllen dasselbe Formular. Vorschau, Bestätigung und Speicherweg sind gleich. |
| G3 | **Ein Datenmodell:** jede Evaluation einzeln, jedes Kriterium mit eigenem Standard (oder „kein passender Standard“). |
| G4 | **Speichern erst nach Bestätigung**, beim angezeigten Kind, genau einmal. |
| G5 | **Browser und App sind gleichwertige Oberflächen.** Logik, die beide brauchen, liegt in Big Quest (Web-Code und Module), nicht nur in der Swift-Hülle. |
| G6 | **Kein API-Schlüssel im Browser.** Der Schlüssel auf dem Gerät ist eine Übergangslösung nur für die Familie im Playground. |
| G7 | **Zeit ist relativ (R10):** Fortschritt in Aufgaben und Übungstagen, keine Fristen. |

---

## 3. Ausgangslage

### 3.1 Was es gibt

| Baustein | Stand | Ort |
|---|---|---|
| **Gemeinsames Formular** mit Vorschau, Bestätigung, Kindbindung, Revision und Rücknahme (`school_evaluation`) | im Testbau | Zweig Test 11, `index.html`, `src/module/ereignisse.mjs`, `ableitung.mjs` |
| **iPad-Hülle (Swift Playgrounds):** Toddle-Ansicht, Skript zum Auslesen (`ToddleField.swift`), Claude-Aufruf (`ClaudeClient.swift`), Schlüssel im Schlüsselbund | Test 11 | `ios/BigQuestMVP/` |
| **Parser `ToddleRubric`:** liest RS/C/M/E direkt aus dem Abschnitt „Assessment Criteria“ und überschreibt die Werte von Claude | Test 11 | `ClaudeClient.swift` |
| **KI-Zuordnung Kriterium → Standard**, nur M-N3 und M-N5 | Spike, nicht eingebaut | `spikes/schulbewertung-ki/entwurf.mjs` |
| **Datei-Import des gesamten Bestands** (`school_import`) | Werkzeug für den Rechner | `werkzeug/schulbewertungen-uebernehmen.mjs` |
| **Lückenlogik je Standard** | live (Elternbereich D1–D4) | `index.html` |

### 3.2 Befunde

| Nr. | Befund | Folge |
|---|---|---|
| B1 | Das Formular speichert Kriterien als Freitext. Ein Standard ist höchstens **einer je Evaluation** möglich und nur **M-N3 oder M-N5**, von Hand gewählt. Alles andere wird `unmapped` gespeichert und ohne Standard abgeleitet (`std: {}`). | Übernommene Evaluationen erzeugen fast nie Lücke, Fokus oder Übung. **Das ist der Kernmangel.** |
| B2 | Zwei Speicherwege: `school_evaluation` (einzeln, sicher, aber ohne Standards) und `school_import` (ganzer Bestand, mit Standards, ersetzt alles auf einmal). | Uneinheitlich; beim Ersetzen können parallele Änderungen verloren gehen. |
| B3 | Jedes iPad-Testpaket hat eine **neue App-Kennung** (`de.bigquest.ipad.test08`, `…test11`). | Neuer Speicher je Paket: Die Geräteverbindung (Link mit `#zugang=`) und der Claude-Schlüssel sind jedes Mal weg. |
| B4 | Beim Lesen des Schlüsselbunds wird jeder iOS-Fehlercode zu einem einzigen Satz („Hinterlege zuerst den Schlüssel“). | Die Ursache („nicht gefunden“, „keine Berechtigung“, „gesperrt“) ließ sich nie bestimmen. |
| B5 | „Fach“ ist ein Freitextfeld; die App kennt nur `math`, `english`, `science`, `deutsch`, `learner`. | Bei „Mathematik“ fehlt die Evaluation bei den nächsten Schritten des Fachs. |
| B6 | Im Ersatzweg (ohne Abschnitt „Assessment Criteria“) prüft der Code nur, ob die Einstufung als **Wort** im Beleg steht. | Ein Kriterium mit „Part C“ besteht die Prüfung zu leicht. |
| B7 | Das Formular hat feste Farben (`#fff`). | Es fällt im Dunkelmodus und optisch aus der App heraus. |
| B8 | Der Testbau nutzt einen GitHub-Token im Browser-Speicher (`bqt_gh`). Es gibt keinen Big-Quest-Dienst für Claude. | Für andere Familien nicht geeignet (eigener Plan vom 13.11.). |

Der **Claude-Aufruf** ist gegen die aktuelle API-Referenz geprüft und korrekt: `claude-haiku-5-5`, API-Version `2026-10-21`, `output_config.format`, `thinking: disabled` zulässig. 66 JavaScript-Tests des Zweigs laufen durch; die Swift-Teile sind in der Cloud nicht prüfbar.

---

## 4. Technische Rahmenbedingungen

### 4.1 Was eine Web-App kann und nicht kann

| Frage | Antwort |
|---|---|
| Kann Big Quest im Browser Toddle selbst lesen? | **Nein.** Die Same-Origin-Regel verbietet einer Seite, eine andere zu lesen, auch bei bestehender Anmeldung. Der Playground umgeht das, weil er eine eigene App mit eigener Browser-Ansicht ist. |
| Kann man aus Toddle per „Teilen“ an die Web-App senden? | **Nein.** Safari auf iOS unterstützt kein Web Share Target (WebKit-Bug 194593, offen seit 2019). |
| Kann Big Quest eine Datei annehmen? | **Ja.** Jede Webseite darf eine Datei annehmen, die die Person auswählt („Datei auswählen“), auf iPad, iPhone und Computer. Text einfügen geht ebenso. |
| Kann der Browser Claude direkt aufrufen? | Technisch ja (Header `anthropic-dangerous-direct-browser-access: true`). Der Schlüssel läge aber im Browser, und alle Seiten unter `big-quest-test.github.io` teilen diesen Speicher. Deshalb **nicht vorgesehen** (G6). |
| Kurzbefehl („JavaScript auf Webseite ausführen“) oder Lesezeichen als Leser in Safari | Möglich. Ob die Sicherheitsregeln von Toddle (CSP) das zulassen, ist ungeprüft. Das ist **kein Teil des Plans**, nur eine Reserve, falls der Playground-Weg scheitert. |
| Claude in Chrome | läuft auf dem **Computer**, nicht auf iPad/iPhone. Ob es alle Evaluationen sauber ausliest, ist ungeprüft (M0). |

### 4.2 Verteilungswege für iPad-Apps

| Weg | Voraussetzung | Laufzeit | Rolle im Plan |
|---|---|---|---|
| Swift Playgrounds | keine | unbegrenzt | **Phase 1** (eigene Familie) |
| TestFlight | Apple Developer Program (99 $/Jahr) | je Build 90 Tage, neue Builds jederzeit; interne Tester (bis 100) ohne Prüfung durch Apple, externe mit Beta-Prüfung | **Phase 2** |
| App Store | Developer Program, volle Prüfung | unbegrenzt | **Phase 3** |
| Ad hoc | Developer Program, Mac/Xcode, Geräte-UDIDs | etwa 1 Jahr, bis 100 iPads | nicht vorgesehen |
| Kostenloser Account + Xcode | Mac | 7 Tage, max. 3 Geräte | nicht vorgesehen |
| Unlisted im App Store | fertige App, volle Prüfung | unbegrenzt | evtl. statt öffentlicher Listung in Phase 3 |

### 4.3 Schlüsselbund im Playground

- Einträge gehören zur App-Kennung. Wechselt die Kennung (B3), sind sie unsichtbar.
- **Vermutung, ungeprüft:** Playgrounds signiert die App bei jedem Start neu. Dann wären Einträge auch zwischen zwei Starts desselben Pakets unsichtbar. Das klärt die Diagnose in M1.
- Im Zielbild liegt der Claude-Schlüssel **nie** auf dem Gerät (4.5). Der Schlüsselbund wird deshalb nur so weit repariert, wie der Familientest es braucht.

### 4.4 Zuordnung Kriterium → Standard

Das ist die eigentliche Lücke zwischen Toddle und der Übungslogik (B1). Zwei Quellen, in dieser Reihenfolge:

1. **Toddle nennt den Standard:** Steht in der Evaluation ein Abschnitt „Standards“ (der Parser kennt die Überschrift), wird er mit `STANDARD_TEXT` abgeglichen. Das ist fest programmiert, ohne KI.
2. **KI-Vorschlag:** Wo das nicht reicht, schlägt Claude je Kriterium einen Standard vor. Erlaubt sind **nur** Kürzel aus der festen Liste: Antwortschema mit `enum`, wie im Spike, aber mit allen Standards, die eine Quest haben. Unklar bedeutet „kein passender Standard“.
3. **Die Eltern bestätigen** jede Zuordnung in der Vorschau oder korrigieren sie.

Beispiel (echte Mathe-Evaluation aus dem Spike): Mit 2 erlaubten Standards wurden 2 von 6 Kriterien zugeordnet. Mit der vollen Liste kämen etwa „Reads and writes numbers … C“ → **M-N1** (Quest „Time & Numbers“) und „… addition problems … C“ → **M-N4** dazu.

### 4.5 KI-Dienst (Zielbild, ab Phase 2)

Claude wird über einen **Big-Quest-Dienst** aufgerufen, nicht vom Gerät:

- Der Schlüssel liegt serverseitig.
- Jeder Aufruf wird gegen das angemeldete Elternkonto und dessen Kind geprüft.
- Kostenlimit je Familie.
- Personenbezogene Daten werden **vor** dem Versand entfernt.
- Keine Rohdaten in Protokollen.

Browser und App rufen denselben Dienst mit derselben Anfrage und Antwort auf wie heute `ClaudeClient` (G5). Das entspricht Stufe B des Plans vom 13.11.

---

## 5. Zielbild

```
           ┌───────────── Füllwege ─────────────┐
 manuell   │  Claude in Chrome     iPad-Leser    │
 (Browser) │  (Text/Datei, M4)     (Playground → │
           │                        TestFlight → │
           │                        App Store)   │
           └──────────────┬──────────────────────┘
                          ▼
          Ein Formular (Browser = App)
          Titel · Datum · Fach (Auswahl) · Lernziel · Anweisung · Rückmeldung
          Kriterien: Originaltext · Einstufung (aus Quelle) · Standard (Vorschlag → bestätigt)
                          ▼
          Vorschau  →  Bestätigen  →  school_evaluation (je Evaluation, beim Kind)
                          ▼
          Ableitung je Standard → Lücke (RS/C) → Fokus → Practise Today
```

**Oberflächen und Phasen:**

| Phase | Wer | Oberfläche | Füllwege | KI |
|---|---|---|---|---|
| 1 | Familie Peter | Playground + Browser | manuell, iPad-Leser, (Claude in Chrome) | Schlüssel auf dem Gerät (Übergang) |
| 1 | andere Testeltern | Browser | manuell | keine |
| 2 | Testeltern mit iPad | TestFlight + Browser | manuell, iPad-Leser | Big-Quest-Dienst |
| 3 | alle | App Store + Browser | manuell, iPad-Leser | Big-Quest-Dienst |

---

## 6. Umsetzung: was nötig ist

| Nr. | Arbeitspaket | Inhalt | Befund |
|---|---|---|---|
| U1 | Datenmodell | `school_evaluation` erhält je Kriterium `standard` (Kürzel oder `none`). `school_import` und alte Einträge bleiben lesbar. Die Ableitung erzeugt `std` aus den Kriterien. | B1, B2 |
| U2 | Regel für mehrere Kriterien desselben Standards | Was gilt, wenn eine Evaluation zwei Kriterien mit demselben Standard enthält, etwa C und M? Vorschlag: die **schwächere** Einstufung. **Entscheidung Peter (O3).** | B1 |
| U3 | Standardliste | Alle Standards mit mindestens einer Quest, mit verständlichem Namen (`STANDARD_TEXT`), DE/EN. Ersetzt die Zweierliste `SCHOOL_EVALUATION_TARGETS` als Auswahl. | B1 |
| U4 | Formular | Je Kriterium ein Auswahlfeld „Bereich in Big Quest“; „Fach“ als Auswahlliste; Farben aus dem Design der App; in der Vorschau „Kriterium → Standard · Einstufung“. | B1, B5, B7 |
| U5 | Ein Speicherweg | Alle Füllwege speichern über U1. Der Werkzeug-Import des ganzen Bestands bleibt nur für Altdaten. | B2 |
| U6 | Zuordnungsvorschlag | 1) Abgleich mit dem Abschnitt „Standards“ aus Toddle; 2) Claude-Vorschlag mit `enum` aller Standards (Spike erweitern); 3) Bestätigung der Eltern. Als Modul, das Browser und App nutzen. | B1 |
| U7 | Prüfung im Ersatzweg verschärfen | Eine Einstufung gilt nur am **Ende** des Belegs als Einstufung, nicht irgendwo als Wort. | B6 |
| U8 | Playground stabil | Feste App-Kennung `de.bigquest.ipad` für alle Testpakete; Zugangscode für die Geräteverbindung zusätzlich im Schlüsselbund; Diagnose mit iOS-Codes (Speichern, Zurücklesen, Lesen beim Start, Access Group) ohne Anzeige des Schlüssels. | B3, B4 |
| U9 | Text/Datei-Import (Claude in Chrome) | Feste Anleitung für Claude (Prompt, Standardliste, Format); Feld „Text einfügen“ und „Datei auswählen“; jede Evaluation öffnet nacheinander das Formular. **Nur wenn M0 positiv ist.** | – |
| U10 | Big-Quest-KI-Dienst | wie 4.5; dieselbe Schnittstelle wie `ClaudeClient` | B8 |
| U11 | Anmeldung ohne GitHub-Token beim Endnutzer | Voraussetzung für TestFlight mit fremden Familien (Plan 13.11., Stufe B) | B8 |
| U12 | App-Store-Voraussetzungen | Impressum (Backlog), Datenschutzerklärung, Prüfrichtlinien für Apps im Umfeld von Kindern, Konto löschen in der App | – |

**Abhängigkeit zu offenen Aufträgen** (`dev-auftraege-2026-11-03.md`):
- **Auftrag 1, Grundlage-Aufgaben:** Mit U1–U6 entstehen mehr Lücken. Für 10 Quests fehlen die kleinen Einstiegsaufgaben.
- **Auftrag 2, ehrlicher Lückenbalken ohne 14-Tage-Regel:** gilt auch für übernommene Lücken.

Beide sollten **vor oder mit M2** erledigt sein.

---

## 7. Meilensteine und Zielsetzungen

| Meilenstein | Ziel (woran man es merkt) | Pakete | Abnahme |
|---|---|---|---|
| **M0 · Klären ohne Bauen** | Wir wissen, ob Claude in Chrome Evaluationen sauber ausliest, und ob Toddle einen Abschnitt „Standards“ zeigt. | – | Drei bekannte Evaluationen mit Claude in Chrome auslesen und Feld für Feld gegen Toddle prüfen. Bei einer Evaluation den Abschnitt „Standards“ ansehen. Ergebnis kurz im Prüfbericht. |
| **M1 · Playground stabil** | Ein neues Testpaket startet **ohne** neue Geräteverbindung und ohne neue Schlüsseleingabe. Oder wir wissen sicher, dass Playgrounds den Schlüsselbund zurücksetzt. | U8 | Paket N und N+1 nacheinander auf dem iPad: Verbindung bleibt; Diagnose zeigt die Codes vor und nach dem Neustart. Bei bestätigtem Zurücksetzen: Schlüssel je Sitzung eingeben, kein weiterer Reparaturversuch. |
| **M2 · Ein Formular, Standard je Kriterium (Browser)** | Testeltern tragen eine Evaluation **im Browser von Hand** ein, wählen je Kriterium den Bereich. Eine RS- oder C-Einstufung erzeugt eine Lücke, und Practise Today übt sie. | U1–U5, U7 | Test mit erfundenen Daten: eine Evaluation mit drei Kriterien (M-N1 C, M-N3 M, kein Standard) → Lücke M-N1 aktiv, M-N3 keine Lücke, drittes Kriterium nur angezeigt. Alte Importdaten unverändert. Doppelte Bestätigung erzeugt keinen zweiten Eintrag. Kindwechsel verhindert Speichern. |
| **M3 · Zuordnung per Vorschlag** | Im Playground füllt der iPad-Leser das Formular **inklusive** Standardvorschlägen; Eltern bestätigen nur noch. | U6 | Die echte Mathe-Evaluation aus dem Spike: mindestens die eindeutigen Kriterien (Stellenwert, Runden, Addition, Subtraktion) korrekt vorgeschlagen; nichts außerhalb der Liste; unklare Kriterien „kein passender Standard“. Einstufungen unverändert aus der Quelle. |
| **M4 · Text/Datei-Import** (nur bei positivem M0) | Familie Peter überträgt alle Evaluationen eines Halbjahres mit Claude in Chrome und bestätigt sie nacheinander. | U9 | Eingefügter Text mit drei Evaluationen öffnet dreimal das Formular; Ergebnis gleich wie bei manueller Eingabe. |
| **M5 · KI-Dienst** | Die App braucht keinen Schlüssel mehr auf dem Gerät. | U10 | Aufruf nur mit gültigem Elternkonto und eigenem Kind; Kostenlimit greift; Schlüssel in keinem Bundle, Speicher oder Protokoll. |
| **M6 · TestFlight** | Andere Testfamilien installieren die App über TestFlight und nutzen den iPad-Leser. | U8 (feste Kennung), U10, U11, Developer Program | Interne Testgruppe; Installation, Anmeldung ohne GitHub-Token, Übernahme einer Evaluation, Lücke entsteht. |
| **M7 · App Store** | Big Quest ist regulär (oder unlisted) im App Store. | U12 | Apple-Prüfung bestanden. |

**Reihenfolge:** M0 und M1 sofort und parallel. Dann M2, das Herzstück; es nützt auch den Browser-Testeltern. Dann M3. M4 nur bei positivem M0. M5–M7 erst, „wenn die Anerkennung so groß ist, dass wir eine richtige App bauen“ (E3).

---

## 8. Leitplanken: was der App nicht im Weg steht (E4)

- **Datenmodell und Formular** gehören zu Big Quest selbst. Die Swift-Hülle liefert nur Text an das Formular und, bis M5, den Claude-Aufruf.
- **Die KI-Schnittstelle** (Anfrage/Antwort wie `ClaudeClient.Evaluation`) bleibt stabil. In M5 wechselt nur der Empfänger: vom Gerät zum Dienst.
- **Keine Schlüssel im Browser.** Keine Logik, die nur im Playground funktioniert.
- **Feste App-Kennung** ab M1. Sie kann später die TestFlight- und App-Store-Kennung werden.
- **Tests mit erfundenen Daten** für jeden Schritt; Gerätetests nur, wo der Browser es nicht kann.

## 9. Offene Entscheidungen für Peter

| Nr. | Frage | Vorschlag |
|---|---|---|
| O1 | Soll M4 (Claude in Chrome) überhaupt gebaut werden, wenn M0 positiv ist? | Ja, weil es für die Familie die schnellste Übernahme vieler Evaluationen ist. |
| O2 | Wann das Developer Program abschließen (99 $/Jahr)? | Erst vor M6. |
| O3 | Mehrere Kriterien, ein Standard: welche Einstufung gilt? | Die schwächere (U2). |
| O4 | Sollen Testeltern im Browser auch die Zuordnung je Kriterium selbst wählen müssen, oder reicht zunächst „kein Standard“? | Selbst wählen. Sonst nützt die Eingabe dem Üben nichts. |
| O5 | Welche Standards ohne Quest (z. B. E-S1, E-S2) sollen trotzdem wählbar sein? | Wählbar, aber mit dem Hinweis „wird angezeigt, keine Übung in Big Quest“. |

---

## 10. Quellen

- Same-Origin und Web Share Target: [WebKit Bug 194593](https://bugs.webkit.org/show_bug.cgi?id=194593), [Recherche Web Share Target iOS (Dez. 2025)](https://tangled.org/zzstoatzz.io/plyr.fm/blob/main/docs/research/2025-12-19-web-share-target-ios-pwa.md)
- Claude im Browser: [Simon Willison, CORS-Unterstützung](https://simonwillison.net/2024/Aug/23/anthropic-dangerous-direct-browser-access)
- Kurzbefehle: [Apple, JavaScript auf Webseite ausführen](https://support.apple.com/guide/shortcuts/apd218e2187d/ios)
- TestFlight: [App Store Connect Help, Overview of TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/overview-of-testflight/), [Add internal testers](https://www.developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers)
- Ad hoc: [Apple Xcode Help](https://help.apple.com/xcode/mac/9.0/en.lproj/dev7ccaf4d3c.html)
- Kostenloser Account: [Apple Developer Forums](https://developer.apple.com/forums/thread/89042)
- Unlisted: [Apple, Unlisted app distribution](https://developer.apple.com/support/unlisted-app-distribution)
- Schlüsselbund −34018: [Apple Developer Forums](https://developer.apple.com/forums/thread/114456)
- Lernen vs. Leistung (für die Lückenlogik): [Soderstrom & Bjork 2015](https://pubmed.ncbi.nlm.nih.gov/25910388/)
