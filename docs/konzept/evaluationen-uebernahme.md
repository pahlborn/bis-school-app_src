# Konzept: Evaluationen aus Toddle in Big Quest übernehmen (Entwurf)

Stand 17.11.2026 · Status: **Entwurf, Entscheidungen O1–O5 von Peter am 17.11. getroffen** · Grundlage: Gespräch Peter/Claude vom 16.–17.11., Prototyp-Zweige bis Test 11 (`feature/bq-evaluation-end-to-end-test11`, 0.153.4-beta), KI-Spike (`spike/bq-schulbewertung-ki`), Plan „BQ-KI Elternintegration“ (13.11.), Machbarkeitsstudie Schulbewertungen (08.11.).


**Weiterführend:** Zusammenfassung für Dokumentation und App-Vorstellung: `evaluationen-ziel1-zusammenfassung.md` · Epics und User Stories für Ziel 1: `evaluationen-ziel1-epics.md`
---

## 0. Entscheidungen von Peter (16.–17.11.)

| Nr. | Entscheidung |
|---|---|
| E1 | **Weg zur App:** zuerst Swift Playgrounds, dann TestFlight, zum Schluss App Store. |
| E2 | **Andere Eltern** testen zunächst im **Browser**, ohne Komfortfunktion zum Einlesen. Die manuelle Eingabe ins Formular reicht. |
| E3 | Die Komfortfunktion (automatisches Auslesen, KI) kommt **später**, wenn eine richtige App entsteht. |
| E4 | Es wird **nichts gebaut, was einer richtigen App im Weg steht**. |
| E5 | Datenschutz ist für den **jetzigen Testbetrieb** (eigene Familie) zu vernachlässigen. Für andere Familien gilt Abschnitt 4.5. |
| E6 | **Nichts vermischen:** Ziel 1 ist die Lösung Formular + Playground + KI, komplett und richtig, einschließlich Standard je Kriterium. Claude in Chrome und Datei-Import sind Ziel 2, nur bei erkennbarem Bedarf. |
| E7 | Später werden Quests für das **ganze Schuljahr** eingearbeitet, danach für Klasse 4 und weitere Jahre. |

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
| Claude in Chrome | läuft auf dem **Computer**, nicht auf iPad/iPhone. Ob es alle Evaluationen sauber ausliest, ist ungeprüft (Ziel 2, M5). |

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

Das ist die eigentliche Lücke zwischen Toddle und der Übungslogik (B1). Grundzüge hier; vollständige Quellenreihenfolge mit Liste bekannter Kriterien und Wortähnlichkeit in U6 (Entscheidung O4):

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
 (Browser) │  (Ziel 2, M5)     (Playground → │
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
| 1 | Familie Peter | Playground + Browser | manuell, iPad-Leser | Schlüssel auf dem Gerät (Übergang) |
| 1 | andere Testeltern | Browser | manuell | keine |
| 2 | Testeltern mit iPad | TestFlight + Browser | manuell, iPad-Leser | Big-Quest-Dienst |
| 3 | alle | App Store + Browser | manuell, iPad-Leser | Big-Quest-Dienst |

---

## 6. Umsetzung: was nötig ist

| Nr. | Arbeitspaket | Inhalt | Befund |
|---|---|---|---|
| U1 | Datenmodell | `school_evaluation` erhält je Kriterium `standard` (Kürzel oder `none`). `school_import` und alte Einträge bleiben lesbar. Die Ableitung erzeugt `std` aus den Kriterien. | B1, B2 |
| U2 | Regel für mehrere Kriterien desselben Standards | **Entschieden (O3):** Gespeichert wird jedes Kriterium mit eigener Einstufung. Beim Auswerten zählt je Standard und Evaluation die **schwächere**. Die Vorschau zeigt das („E-W1: C (schwächere von C und M)“), und Eltern können umstellen. | B1 |
| U3 | Standardliste | **Alle Standards des Schuljahres**, mit verständlichem Namen (`STANDARD_TEXT`), DE/EN; ersetzt die Zweierliste `SCHOOL_EVALUATION_TARGETS` als Auswahl. **Entschieden (O5):** Standards ohne Quest sind wählbar, mit dem Hinweis „wird angezeigt, keine Übung in Big Quest“. Kommt später eine Quest dazu (E7), wirken frühere Einstufungen sofort. Laut Peter (17.11.) decken die heutigen rund 15 Standards nur einen **Teil des ersten Quartals** der Klasse 3 ab; weitere kommen hinzu. Die Liste ist deshalb eine **Pflegeaufgabe je Quartal** (Quelle: Abschnitt „Standards“ in Toddle, Unterlagen der Schule). | B1 |
| U4 | Formular | Je Kriterium ein Auswahlfeld „Bereich in Big Quest“; „Fach“ als Auswahlliste; Farben aus dem Design der App; in der Vorschau „Kriterium → Standard · Einstufung“. | B1, B5, B7 |
| U5 | Ein Speicherweg | Alle Füllwege speichern über U1. Der Werkzeug-Import des ganzen Bestands bleibt nur für Altdaten. | B2 |
| U6 | Zuordnungsvorschlag | **Entschieden (O4): immer ein Vorschlag mit Korrekturmöglichkeit**, in Alltagssprache. Quellen in dieser Reihenfolge: 1) Abschnitt „Standards“ aus Toddle; 2) **Liste bekannter Kriterien** (aus bestätigten Zuordnungen, im Code gepflegt). Laut Peter (17.11.) ist das Raster **innerhalb einer Klasse** wortgleich, in einer Klassenstufe nicht unbedingt (abhängig von der Lehrkraft). Deshalb nur **wortgleiche** Treffer als „bekannt“ vorschlagen; andere Klassen fallen auf Quelle 3 zurück; 3) **Wortähnlichkeit** mit `STANDARD_TEXT`; 4) im Playground zusätzlich **Claude** mit `enum` aller Standards (Spike erweitern). Unsicher bedeutet „Kein passender Bereich“, nie geraten. Eltern bestätigen mit einem Tipp oder korrigieren. Als Modul, das Browser und App nutzen. | B1 |
| U13 | Nachzuordnung | Kriterien mit „Kein passender Bereich“ bleiben mit Originaltext gespeichert. Wächst die Standardliste (U3), läuft der Vorschlag (U6) für diese Kriterien erneut. Im Elternbereich erscheint ein ruhiger Hinweis „Neue Zuordnungen möglich“ mit Vorschau und Bestätigung. Nichts wird ohne Bestätigung geändert. | B1 |
| U7 | Prüfung im Ersatzweg verschärfen | Eine Einstufung gilt nur am **Ende** des Belegs als Einstufung, nicht irgendwo als Wort. | B6 |
| U8 | Playground stabil | Feste App-Kennung `de.bigquest.ipad` für alle Testpakete; Zugangscode für die Geräteverbindung zusätzlich im Schlüsselbund; Diagnose mit iOS-Codes (Speichern, Zurücklesen, Lesen beim Start, Access Group) ohne Anzeige des Schlüssels. | B3, B4 |
| U9 | Text/Datei-Import (Claude in Chrome) | Feste Anleitung für Claude (Prompt, Standardliste, Format); Feld „Text einfügen“ und „Datei auswählen“; jede Evaluation öffnet nacheinander das Formular. **Ziel 2, nur bei Bedarf und nach erfolgreicher Prüfung (M5).** | – |
| U10 | Big-Quest-KI-Dienst | wie 4.5; dieselbe Schnittstelle wie `ClaudeClient` | B8 |
| U11 | Anmeldung ohne GitHub-Token beim Endnutzer | Voraussetzung für TestFlight mit fremden Familien (Plan 13.11., Stufe B) | B8 |
| U12 | App-Store-Voraussetzungen | Impressum (Backlog), Datenschutzerklärung, Prüfrichtlinien für Apps im Umfeld von Kindern, Konto löschen in der App | – |

**Abhängigkeit zu offenen Aufträgen** (`dev-auftraege-2026-11-03.md`):
- **Auftrag 1, Grundlage-Aufgaben:** Mit U1–U6 entstehen mehr Lücken. Für 10 Quests fehlen die kleinen Einstiegsaufgaben.
- **Auftrag 2, ehrlicher Lückenbalken ohne 14-Tage-Regel:** gilt auch für übernommene Lücken.

Beide sollten **vor oder mit M2** erledigt sein (siehe Abschnitt 7).

---

## 7. Ziele und Meilensteine

### Ziel 1 · Formular + Playground + KI, komplett und richtig (E6)

Ziel: Eine echte Evaluation wird auf dem iPad aus Toddle übernommen. Danach sind die passende Lücke aktiv und die Übung in Practise Today vorhanden, auch nach einem Neustart. Die manuelle Eingabe im Browser für andere Eltern entsteht dabei ohne Mehraufwand: dasselbe Formular, nur ohne den Knopf „Aus Toddle“.

| Meilenstein | Ziel (woran man es merkt) | Pakete | Abnahme |
|---|---|---|---|
| **M1 · Playground stabil** | Ein neues Testpaket startet **ohne** neue Geräteverbindung und ohne neue Schlüsseleingabe. Oder wir wissen sicher, dass Playgrounds den Schlüsselbund zurücksetzt. | U8 | Paket N und N+1 nacheinander auf dem iPad: Verbindung bleibt; Diagnose zeigt die iOS-Codes vor und nach dem Neustart. Bei bestätigtem Zurücksetzen: Schlüssel je Sitzung eingeben, kein weiterer Reparaturversuch. |
| **M2 · Standard je Kriterium** | Eine Evaluation mit mehreren Kriterien ergibt je Standard eine Einstufung; RS oder C erzeugt eine Lücke, und Practise Today übt sie. Im Browser von Hand bedienbar. | U1–U5, U7 | Test mit erfundenen Daten: drei Kriterien (M-N1 C, M-N3 M, kein Standard) → Lücke M-N1 aktiv, M-N3 keine Lücke, drittes nur angezeigt. Zwei Kriterien E-W1 (C, M) → C. Standard ohne Quest wählbar, mit Hinweis. Alte Importdaten unverändert. Doppelte Bestätigung erzeugt keinen zweiten Eintrag. Kindwechsel verhindert Speichern. |
| **M3 · Vorschlag mit Korrektur** | Kriterien bekommen einen vorgeschlagenen Bereich: im Browser aus Toddle-Standards, bekannten Kriterien und Wortähnlichkeit, im Playground zusätzlich von Claude. Eltern bestätigen nur noch. | U6, U13 | Die echte Mathe-Evaluation: die eindeutigen Kriterien (Stellenwert, Runden, Addition, Subtraktion) korrekt vorgeschlagen, nichts außerhalb der Liste, unsichere „Kein passender Bereich“. Einstufungen unverändert aus der Quelle. Eine bestätigte Zuordnung wird beim nächsten wortgleichen Kriterium als bekannt vorgeschlagen. Nach Ergänzung eines Standards erscheint für ein früher nicht zugeordnetes, passendes Kriterium der Hinweis „Neue Zuordnungen möglich“ (U13). |
| **M4 · Abnahme Ziel 1 auf dem iPad** | Die ganze Kette funktioniert auf dem echten Gerät. | – | Echte Evaluation aus Toddle → Formular mit Vorschlägen → bestätigen → Lücke aktiv → Practise Today mit passender Übung → Neustart von Playgrounds → alles noch da. |

**Voraussetzungen aus den offenen Aufträgen** (`dev-auftraege-2026-11-03.md`), vor oder mit M2:
- Auftrag 1: Grundlage-Aufgaben für die Quests mit Hauptstandard.
- Auftrag 2: ehrlicher Lückenbalken ohne 14-Tage-Regel.

### Ziel 2 · später, nur bei erkennbarem Bedarf

| Meilenstein | Ziel | Pakete |
|---|---|---|
| **M5 · Claude in Chrome + Text/Datei** | Erst prüfen (drei Evaluationen auslesen und gegen Toddle vergleichen), dann ggf. Einfügen oder Datei füllt nacheinander das Formular. | U9 |
| **M6 · Einfügen im Browser ohne KI** | Text aus Toddle einfügen, der Parser (heute Swift) füllt Kriterien und Einstufungen, als JavaScript-Modul. Erleichtert den Browser-Eltern das Abtippen. | – |
| **M7 · KI-Dienst** | Kein Schlüssel mehr auf dem Gerät; Browser und App nutzen denselben Dienst. | U10 |
| **M8 · TestFlight** | Testfamilien installieren die App; Anmeldung ohne GitHub-Token. | U8 (feste Kennung), U10, U11, Developer Program |
| **M9 · App Store** | regulär oder unlisted im App Store | U12 |
| **Quests für das ganze Schuljahr, Klasse 4 ff.** (E7) | weniger Kriterien ohne Übung | – |

**Reihenfolge:** M1 sofort. Dann M2 (Herzstück), dann M3, Abschluss mit M4. Ziel 2 erst danach und nur bei Bedarf; M7–M9, „wenn die Anerkennung so groß ist, dass wir eine richtige App bauen“ (E3).

---

## 8. Leitplanken: was der App nicht im Weg steht (E4)

- **Datenmodell und Formular** gehören zu Big Quest selbst. Die Swift-Hülle liefert nur Text an das Formular und, bis M5, den Claude-Aufruf.
- **Die KI-Schnittstelle** (Anfrage/Antwort wie `ClaudeClient.Evaluation`) bleibt stabil. In M5 wechselt nur der Empfänger: vom Gerät zum Dienst.
- **Keine Schlüssel im Browser.** Keine Logik, die nur im Playground funktioniert.
- **Feste App-Kennung** ab M1. Sie kann später die TestFlight- und App-Store-Kennung werden.
- **Tests mit erfundenen Daten** für jeden Schritt; Gerätetests nur, wo der Browser es nicht kann.

## 9. Entscheidungen zu O1–O5 (Peter, 17.11.)

| Nr. | Frage | Entscheidung |
|---|---|---|
| O1 | Claude in Chrome / Datei-Import bauen? | **Nicht jetzt.** Ziel 2, nur bei erkennbarem Bedarf (E6). |
| O2 | Wann das Apple Developer Program abschließen? | **Erst vor TestFlight** (M8). |
| O3 | Mehrere Kriterien, ein Standard: welche Einstufung gilt? | **Die schwächere**, als Vorschlag in der Vorschau, von den Eltern änderbar. Gespeichert wird jedes Kriterium einzeln (U2). |
| O4 | Wählen die Eltern den Standard je Kriterium selbst? | **Vorschlag mit Korrekturmöglichkeit**, weil viele Eltern sich nicht einarbeiten können. Quellen siehe U6; unsicher heißt „Kein passender Bereich“. |
| O5 | Sind Standards ohne Quest wählbar? | **Ja**, mit Hinweis „keine Übung in Big Quest“. Ziel ist, später Quests für das ganze Schuljahr einzuarbeiten (E7). |

**Geklärt (Peter, 17.11.):**
- Das Bewertungsraster ist innerhalb einer Klasse wortgleich, in einer Klassenstufe nicht unbedingt (Lehrkraft). Folge: „bekannte Kriterien“ nur bei wortgleichem Text (U6).
- Die rund 15 Standards sind nur ein Teil des ersten Quartals. Folge: Standardliste als Pflegeaufgabe je Quartal (U3) und Nachzuordnung (U13).

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
