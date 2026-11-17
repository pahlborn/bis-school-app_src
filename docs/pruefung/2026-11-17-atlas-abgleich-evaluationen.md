# Atlas · Evaluationen Ziel 1: Abgleich und erste Rückmeldung

## Kurzfassung für Peter

**Was ist erledigt?** Die gemeinsame Fassung ist geprüft und der Quellcode bereits in der Hauptfassung zusammengeführt. 926 automatische Softwaretests und die unabhängigen Prüfungen sind bestanden. Die Fehler im Bewertungsverlauf, bei langen Titeln und auf schmalen Bildschirmen sind behoben. Deine ausdrückliche Freigabe für beide Zusammenführungen liegt vor.

**Was kommt als Nächstes?** Dieser Bericht folgt als zweiter Merge. Danach starten die beiden iPad-Prüfungen einmal auf der Hauptfassung. Die Fristprüfung meldet fehlenden Erfolg nach zwei Stunden. Für Gerätetest12 bekommst du zwei Fassungen zum Vergleich von Neustart und Versionswechsel.

**Was brauche ich von dir?** Für den fehlenden manuellen Start der automatischen Build-Prüfung wurde eine eng begrenzte Zustimmung abgefragt. Ohne sie ändere ich daran nichts. Danach brauche ich deine Beobachtungen beim Gerätetest. Die App wird nicht veröffentlicht.

## Technischer Abgleich und Umsetzungsplan

Stand: 17.11.2026 · Epic **2026.0005** · ergänzt nach PR #207/#208 und Peters Startvorgabe. Führendes main: `bb10457ade11490b785ab16e6f231c442e3affd2`. Rückgabe nach Abschnitt 9 des Auftrags an Atlas.

**Ergebnis:** Der Bestandsabgleich ist abgeschlossen. Die Nummerierung und D1–D5 sind im Chat einzeln entschieden. Ziel 1 selbst ist noch nicht implementiert oder abgenommen. Die ursprünglichen Aufträge 1/2 sind erledigter Bestand; zusätzliche sinnvolle Beispiele sind die eigene Story **EV-3.3**. K1 ist im begrenzten Vertrag bestanden. Der erfolgreiche Test 11 bleibt erfolgreich; seine undokumentierten Teile werden nicht rekonstruiert.

Diese PR enthält ausschließlich diesen Bericht. Produktcode, Konzepte, Workflows, Quellpakete und Bereitstellung werden durch diese PR nicht geändert. Eine Kundenannahme wird nicht vorweggenommen.

## 1. Verbindliche Quellen und Grenzen

| Quelle | Fest geprüfter Stand |
|---|---|
| Aktueller Auftrag | `main@bb10457ade11490b785ab16e6f231c442e3affd2`, `docs/konzept/auftrag-atlas-evaluationen-ziel1.md`, einschließlich Abschnitt 7 und der in PR #207 ergänzten auftragsspezifischen Regeln aus Abschnitt 7a |
| Konzept | Auf derselben Hauptbasis: `docs/konzept/evaluationen-uebernahme.md`, `evaluationen-ziel1-zusammenfassung.md`, `evaluationen-ziel1-epics.md`; Aufträge vom 03.11. und `elternbereich.md`, Kapitel 6 |
| Vorarbeiten | Pläne/Prüfberichte vom 05., 08., 11., 12., 13. und 14.11. in den benannten Produktzweigen; konkrete Branchköpfe in Anhang B |
| Unabhängiger Abgleich | Scout: Altaufträge/Originalrückgaben; Argus: Zweige/Commitbeziehungen/Mergekonflikte; Sentinel: Aufträge 1/2, Test11-/K1-/Abnahmeevidenz. Diese drei Prüfbeiträge wurden tatsächlich durchgeführt; keine neue Produkt-QA daraus abgeleitet |
| Versionierung dieser Prüfbeiträge | Ausgangsbasis `0cb4b5c1f2ddac5fd0d4141228b751e7e1d4219c`. Atlas las anschließend PR203/204/205 sowie die gemergten PR207/208. D1–D5 sind jetzt im Konzept und in den Epics enthalten; Beispiele werden als EV-3.3 geführt. Zwischen dieser Ausgangsbasis und heutigem main änderten sich nur Auftrags-/Prüfdokumente, kein Produktcode |
| Historisches Journal | 1329 Kommentare bis `6929952724` vom 16.11.2026 technisch geladen und auftragsbezogen durchsucht. 130 wörtliche BQ-Task-IDs indexiert, zusätzlich reine Dokument-/Page-Aufträge erfasst. Das sind keine 130 Produktlieferungen. Anhang C nennt jeden dieser Einträge mit Originalkommentaren |
| Aktuelle Steuerung | Peters spätere Einzelentscheidungen und Monitorauftrag aus diesem Chat sind in Abschnitt 3 berücksichtigt. Archiv-/Monitorabschluss bedeutet keine fachliche Annahme; Peters Ballregel bleibt unverändert |

Der ergänzte Upload `auftrag-atlas-evaluationen-ziel1 (1).md` wurde gelesen. Seine Aufforderung, den kurzen Test11-Nachtrag anzulegen, ist durch den bereits vorhandenen [Nachtrag auf main][test11] erfüllt. Kein Doppelbericht und keine Rekonstruktion fehlender Erinnerungen.

Die aktuelle Auftragsfassung einschließlich Abschnitt 7a nach PR #207 und die Konzeptfortschreibung nach PR #208 wurden vor einer neuen Workerbeauftragung nachgelesen. **Code und Dokumente bleiben im Produktrepo; Aufgaben verweisen auf Zweig, Commit, Pfad und Zeile.** Es gibt keinen genehmigten Ausnahmeweg für Quelltextkopien. Die geplante öffentliche Ablage eines Forge-Eingabepakets in Agentarium wurde von der automatischen Freigabeprüfung abgelehnt und nicht ausgeführt; Peter untersagte sie anschließend ausdrücklich. Es wurde kein neuer Forge-Lauf ausgelöst. Die dafür erzeugten separaten Quelltextkopien wurden verworfen. Es werden keine zusätzlichen Archive oder Belegpakete veröffentlicht.

Der konkrete technische Grund für den verworfenen Weg war die V2-Relay-Vorbereitung: Sie liest ihre benannten Eingaben aus dem Agentarium-Commit ([Vorbereitung Zeile 345][relay-read], [Dateiladen Zeile 361][relay-copy]). Das ist eine Werkzeugbeschränkung, keine Verpflichtung aus dem Produktauftrag. Sie wiegt nicht gegen Abschnitt 7. Die nachfolgende Planung begrenzt den direkten Forge-Versuch auf höchstens eine Stunde. Ein gezielter Versuch ist abgeschlossen: keine lokale Claude-Laufzeit, kein direkt aufrufbarer Claude-/Forge-Kanal und kein solcher Ausführungsworkflow im Produkt-main festgestellt. Peters ausdrücklich vorgegebene Alternative gilt: tatsächliche Entwicklungsworker lesen und ändern direkt im Produktrepo auf eigenen Zweigen und liefern PRs. Sie werden als ihre wirklichen nativen Instanzen benannt, nicht als fingierte Forge-Läufe. Die Relay-Frage ist zurückgestellt; dafür wird keine weitere Infrastrukturarbeit begonnen.

## 2. Altaufträge: belegter Stand und Verbleib

Die Einordnung gilt für den jeweils bezeichneten Umfang. Historischer PASS wird erhalten; ein übernommenes Ziel gilt dadurch noch nicht als implementiert. Alle genannten nächsten Rollen sind Verantwortungszuordnungen, keine behaupteten neuen Starts.

### 2.1 Frühere Epics und Stories

| Eintrag | Quelle / belegter Stand | Einordnung | Verbleib / nächste Aktion | Verantwortlicher |
|---|---|---|---|---|
| EP00 / US001–004 | Historische Quellen-, Basis- und Entscheidungsarbeit | übernommen | Dieser Abgleich und die aktuellen Entscheidungen ersetzen alte Statusannahmen | Atlas |
| EP01 / US101–103 | Konzept-/Spezifikationsbeiträge geliefert; alte Web-only-Festlegungen widersprechen E1/E6 | erledigt als Beiträge; abweichend in der alten Richtung | Neues Konzept führt; keine neue Architekturstudie | Atlas |
| EP02 / US201–203 | Anmeldung/Gerätebindung vorhanden; US202-K1 lokal geliefert | übernommen | EV-1.3/EV-2.5 für genutzten Ziel-1-Pfad; tokenfreie Fremdfamilienanmeldung U11/M8 bleibt Ziel 2 | Forge / Atlas |
| EP03 / US301–303 | Automatischer nativer Reader vorhanden; alte Copy/Paste-Ersatzplanung | übernommen; Ersatzplanung abweichend | Reader in Ziel 1 erhalten; Browser-Text/Datei nur Ziel 2 M5/M6 | Forge |
| EP04 / US401–403 | Native KI und lokale US403-Dienstlieferung vorhanden | übernommen teilweise; vorgezogener Dienst abweichend | Ziel 1: Gerät/Playground und Fehlerintegrität; vorhandener Zentraldienstbeitrag Ziel 2 M7 | Forge / Atlas |
| EP05 / US501–503 | Gemeinsames Formular, Vorschau und Kindbindung auf PR192/Test11 | übernommen | EV-2.5/EV-4: Kriterienstandards ergänzen, einen Speicherweg erhalten | Forge |
| EP06 / US601–603 | Revisionen/Offline-/Zweigerätebelege teilweise vorhanden; Rotationsrest offen | übernommen; Rest weiter gültig, nicht ausdrücklich erfasst | EV-2.4/2.5/7 und Anwendbarkeit des Schlüsselwechselfalls prüfen; nichts still archivieren | Atlas / Forge / Sentinel |
| EP07 / US701–703 | Frühe Zwei-Standard-/Rundenbelege vorhanden | übernommen und erweitert | EV-2/3/5/6/7: je Kriterium, volle bekannte Liste, Aggregation, Nachzuordnung, Wirkung | Forge |
| EP08 / US801–803 | Alte Web-/PWA-Gesamtabnahme nicht geliefert | abweichend im Zielgerät; Abnahme übernommen | EV-7.3/7.4: Playground und manueller Browser; TestFlight/Store Ziel 2 M8/M9 | Atlas / Peter |
| EP09 / US901–903 | Basis-, Archiv- und Recoverybeiträge vorhanden | weiter gültig, teilweise außerhalb EV | Versionsgebundene Nachweise verwenden, keine neue Archivierungsrunde | Atlas |

### 2.2 Konkrete Lieferungen und Restziele

Die Gruppenkürzel dienen auch dem vollständigen Alt-ID-Index in Anhang C.

| Eintrag | Quelle / belegter Stand | Einordnung | Verbleib / nächste Aktion | Verantwortlicher |
|---|---|---|---|---|
| Auftrag 1 · Grundlage | PR112, integrierter Commit `87dfa3f21a6144322c3ed6099e20f1db0a72fd52`, [Prüfbericht][a1] | Auftrag 1 erledigt; Zusatzstory EV-3.3 weiterhin erforderlich | Vorhandene zehn Quests erhalten. Zusätzliche sinnvolle ausgearbeitete Beispiele als EV-3.3 vor/mit M2; begründete Ausnahmen nach Lernnutzen, D4 | Forge; Sentinel unabhängig |
| Auftrag 2 · Lückenbalken | PR109, integrierter Commit `8c582817316a37438f1d617c3cfd027288b23d58`, [Prüfbericht][a2] | erledigt | Keine erneute Implementierung. Betroffene Wirkung in EV-7 schützen; 14-Tage-Rückschau nicht mit abgeschaffter Bestätigungsschwelle verwechseln | Sentinel |
| Auftrag 3 · automatisch veröffentlichen | Auftragsdatei vom 03.11.: zurückgestellter Entwurf | weiter gültig, nicht im neuen Konzept | Zurückgestellt lassen; keine Aktivierung aus diesem Bericht | Atlas / Peter |
| Importvorbereitung / Studie 2026.0005 | PR141/161, Prüfberichte 05./08.11. | erledigte Vorarbeit; CSV-zuerst-Vorschlag überholt | Altlesen EV-2.4; Datei/Chrome nur Ziel 2 bei Bedarf | Atlas / Forge |
| H0 · ursprüngliche Evaluation | [Originalrückgabe 6769912590][j-h0], PR180/182 gemergt | erledigt als Bestand | Bestehende Einzelbewertung/Korrektur/Rücknahme erweitern, nicht neu einspielen | Forge |
| HQ · MN3/MN5/REV/UPGRADE/3C | Originalkommentare je ID in Anhang C | erledigte standgebundene Teilprüfungen | Regressionseingänge für EV-2.4/2.5/7; kein neuer Gesamt-PASS | Sentinel |
| HK · KI-Konzept/Backlog/US01–04 | Spike PR187, offene Produktissues [185][i185]/[186][i186] | Ergebnisse übernommen; operative alte Fassung abweichend/überholt | Zwei-Standard-/Einzelauswahl erweitern. Browserkey und Copy/Paste nicht nach alter Issuefassung umsetzen; administrative Redaktion später, nichts automatisch schließen | Atlas / Forge |
| HP · iPad-MVP/Zeile/Lesen | PR188/189/190; [erfolgreicher echter Pilot][pilot] | Pilot erledigt; Reader übernommen | Automatisches Toddle-Lesen erhalten. Kein neuer allgemeiner Machbarkeitspilot | Forge |
| HF · Formularintegration | PR192/198; Originalkommentare in Anhang C | übernommen | Gemeinsames Formular, Vorschau und bestätigten Speicherweg in EV-2/4/7 erhalten | Forge |
| HI · frühere Fach-/Konzeptrollen | BQ-I-EP-01 und Kinder, Anhang C | erledigte Beiträge; alte Richtung teilweise abweichend | Verwendbare Befunde erhalten, neues Konzept führt. Teil-/Limitrückgaben nicht als vollständige Lieferung ausgeben | Atlas |
| HI-SEC · Sicherheitsbefunde | Originalreview I-SEC | weiter gültig, nicht vollständig in EV | Rechte/Kindschutz am tatsächlich genutzten Pfad prüfen; Dienst-/Fremdfamilienanforderungen Ziel 2. Keine pauschale Rückwärtsfreigabe durch Datenschutzentscheidung | Atlas / Argus |
| HW · WEB-FORM/CONT | Lokale Formular-/Releasevorarbeiten, Anhang C | Ergebnisse übernommen; alte Fortsetzung überholt | Gegen Test11 abgleichen, kein Doppelpatch | Forge |
| HA · ACCESS/RIGHTS | Alte lokale Dienstzugangs-/Rechtebeiträge | erledigt lokal; Schutzziele weiter gültig | Genutzten Ziel-1-Pfad schützen; zentralen Betreiberanker Ziel 2 zuordnen | Atlas / Forge |
| HE · EP06 und Kinder | Checkpoint `0a2d92fd1df28bda46fa793cbc8309a63df185be`; Originalreviews | teilweise erledigt; Rest weiterhin erforderlich | Revisionen, Abgleich, Entzug und bestätigte Offline-Daten erhalten; kein EP06-Gesamt-PASS | Atlas / Forge / Sentinel |
| HR · EP06-QA-ROT-01 | Vorbereiteter separater Prüfauftrag, kein ausgeführter Endbefund belegt | weiter gültig, nicht ausdrücklich in EV | Vor Fortsetzung Halter/Ergebnis klären; kein zweiter identischer Lauf. Bestätigte Offline-Vormerkung vor Elternschlüsselwechsel am verwendeten Speicher konkret prüfen | Atlas / Argus / Sentinel |
| HN · INT-01 Original / DEV / REVIEW / PROCESS | [Rückgabe 6892570207][j-int], Original d26/Baum a7bc; damaliger FAIL | erledigte gesicherte Lieferung mit damaligem FAIL | Historie erhalten; spätere K1-Korrektur ergänzt, ersetzt keinen alten Befund | Atlas |
| HNK · INT-01-K1 v4 und Kinder | [Rückgabe 6920601641][j-k1]; Kandidat `b46246ae13c2d7f86d213926fccbeeffc07101f8`, Baum `2f89d22bbb5580bddf6f1f2406272a1d6868aa18` | erledigt im K1-Vertrag | A1–A7, 23/23, Build/Upgrade/Schutzmutation dokumentiert; zwei Testdateien geändert. Keine neue K1-Reparatur ohne neuen Befund; EV-Kompatibilität gesondert prüfen | Atlas / Forge |
| HNA · INT-ACCESS-01 und Kinder | [Rückgabe 6915851697][j-access] | erledigt im begrenzten Nachweisschnitt | Quellen-/Restore-/Executorbeleg verwenden. Keine pauschale allgemeine Forge-Schreibbereitschaft daraus ableiten | Atlas |
| HU · US202 / K1 / PR194 | Originalrückgaben; K1 `2abbec0492d91effdd014b0c1e044f1ed2b97ade`, lokale G2/G4-Belege | lokale Lieferung erledigt; Integration übernommen | Link-UX einmal übernehmen, bestehende Linkarten erhalten. Konkrete Übernahme und Gerätewirkung noch zu prüfen; alte FAILs erhalten | Forge / Sentinel / Peter |
| H403 · US403 v1 | Originalrückgabe: `50c39eeea5479d4538084e2eb3ccb2b5c904d978`, sieben Dateien, C1–C8 lokal mit simuliertem Anbieter | erledigt lokal; Dienstteil weiter gültig für Ziel 2 | Dauerhafte Node/SQLite-Versuche nicht ungefragt zur Playground-Voraussetzung machen. Native Fehler-/Wiederholungsintegrität des benutzten Wegs konkret erhalten | Atlas / Forge |
| HO · OPS-01/OPS-02 und Rollen | Historische Betriebsmatrix, [OPS02-Endbefund 6918439169][j-ops] | frühere Ziel-1-Ausführungsrichtung überholt | AWS zurückgewiesen; Analysen und FAILs erhalten. Kein neuer Hostingauftrag; Dienstarbeit Ziel 2 M7/M8 | Atlas |
| HV · ENV-FIX und technische Kinder | Originalrückgaben/PR130/131 | erledigte Infrastrukturbeiträge; frühe Fehlversuche überholt | Fähigkeiten nur verwenden, soweit der aktuelle Auftrag und Dateivertrag passen; keine Identitätsproben wiederholen | Atlas |
| HC · CI-01 | [Recoverybeitrag 6894949691][j-ci], Dokumentzweig | erledigter Recoverybeitrag | Als Rekonstruktion gekennzeichnet erhalten; kein App-PASS daraus | Atlas |
| HREST · REST-20261116 | [Issue133][rest] und bisherige Disposition | erledigte Prüfung, durch diesen Abgleich fortgeschrieben | Alte Web-only-Disposition korrigieren; offene Produktziele erhalten | Atlas |
| HADMIN · Rückgabebälle/Monitor | Administrative Bereinigung historisch belegt | erledigt administrativ | Keine fachliche Annahme daraus; keine neue automatische Schließung | Atlas / Peter |
| Test11 | [Nachtrag auf main][test11] | erfolgreicher echter Teilnachweis; Rest übernommen in EV-7.3/7.4 | Abruf/Formular/Einstufungen bestanden. Speichern/Sync/Neustart/Übung nicht dokumentiert; gezielt bei neuer Abnahme protokollieren | Peter / Atlas |

**Historische Testzahlen:** Auftrag 1 berichtet 264 betroffene Prüfungen und zwölf rote Gegenproben; Auftrag 2 berichtet 73 und elf. Diese wurden für diesen Quellenabgleich nicht erneut ausgeführt. Bei Auftrag 1 sind die vorhandenen Tests „kein Beispiel auf Grundlage-Stufe“ nach D4 gezielt anzupassen. Alte Prüfhistorie bleibt erhalten.

## 3. Abweichungen, Genehmigungen und Nummerierung

**Nummerierung entschieden:** Peter bestätigte EV-1 bis EV-7 als Teilpakete unter **2026.0005**. EV-Kennungen bleiben lesbare Arbeitsnamen, ältere BQ-IDs/Belege unverändert.

Die folgenden Fragen wurden Peter einzeln vorgelegt und im Chat entschieden. Es ist keine erneute pauschale Genehmigung dieser Punkte nötig. PR #208 hat diese Beschlüsse bereits ins führende Konzept und die Epics übernommen, D4 als Story EV-3.3. In dieser PR wird der abgeglichene Stand dokumentiert; die übrigen Konzeptdateien werden nicht nochmals mitgeändert.

| Punkt | Widerspruch / bisheriger Stand → Beschluss | Begründung / Folge | Genehmigung |
|---|---|---|---|
| D1 · Vorschlagsreihenfolge | U6: Ähnlichkeit vor Claude; EV-5.4 umgekehrt → Playground: Toddle → bekannte Kriterien → Claude → Wortähnlichkeit. Browser ohne Claude | Einheitlicher Vorrang; kann zusätzliche KI-Aufrufe bedeuten; Quellenbewertungen bleiben unverändert | Peter: ja |
| D2 · Standards ohne Quest | §4.4 beschränkt Claude auf Standards mit Quest, EV-5.4/O5 auf alle → ganze gepflegte Liste zulassen | Einstufung bleibt gespeichert, Hinweis auf fehlende Übung; spätere passende Quests können sie nutzen | Peter: ja |
| D3 · M5/M7 | Zwei Dienstreferenzen in §8 nennen M5 → M7 | Schreibfehlerkorrektur; keine neue Funktion, Infrastruktur oder Meilensteinverschiebung | Peter: „ja, bitte berichtigen“ |
| D4 · Grundlage-Beispiele | Historische Ausnahme ohne Beispiel → zusätzliche ausgearbeitete Beispiele als Ziel-1-Pflicht, soweit sie den Lernerfolg sinnvoll unterstützen | Kein Wiederbau der Grundlagen; Beispiel zeigt andere passende Aufgabe und Lösungsweg. Auf niedrigster Stufe darf es gleich niedrig sein, neutral beschriftet. Beispiele ohne sinnvollen Lernnutzen dürfen nach Peters Präzisierung begründet entfallen | Peter lehnt Kürzung ab; anschließend Lernnutzen ausdrücklich präzisiert |
| D5 · Achterrunde | Verkürztes „höchstens 2/8“ → bestehende Ausnahme aus Elternkonzept §6.5 erhalten | Mit anderen aktuellen Themen höchstens zwei zusätzliche Lückenaufgaben; ohne andere aktuelle Themen darf die aktive Lücke die ganze Runde füllen. Beide Fälle testen | Peter: ja |

**Bereits im führenden Auftrag entschieden:** Playground statt altem Web-only-V1; Browser-Eltern erfassen manuell ohne KI; keine Providerkeys im Browser; Standard je Kriterium und ein bestätigter Ereignispfad; Chrome/Datei, zentraler KI-Dienst, TestFlight/Store nach Ziel 2. Die entgegenstehenden alten Issue-/OPS-Anweisungen sind nicht weiterzuführen.

**Keine weitere Konzeptabweichung aus diesem Abgleich zur Genehmigung offen.** Die verbotene Kopienroute wird nicht als Ausnahme erneut beantragt; die neuen Worker arbeiten entsprechend Peters Startvorgabe direkt auf Produktzweigen. Eine künftig tatsächlich unvermeidbare Abweichung wäre nach Abschnitt 7 einmal mit konkretem Grund und Alternative vorzulegen. Der nächste Umsetzungspfad muss zunächst direkt im Produktrepo lesbar und ausführbar sein.

## 4. Stand der roten Integrationsprüfung

| Prüfung | Historischer FAIL | Heute belegter Stand / Grenze |
|---|---|---|
| INT-Testinstanz | `tests/testinstanz.test.mjs:111`: mindestens zehn geänderte Nichtpräfixzeilen erwartet, fünf beobachtet; nachfolgende semantische Assertion nicht erreicht | K1 v4 korrigierte den begrenzten Testvertrag. Der damalige Zahlenschwellenfehler bewies weder die Schutzwirkung noch allein einen Produkt-Datenfehler |
| Historischer Upgradeaufbau | Setup scheiterte an der alten UI-Erwartung `#welcomeGo` | K1 weist den erforderlichen vollständigen synthetischen Altformat-/Upgradepfad nach, nicht bloß eine entfernte Assertion |
| K1-Zwischenstände | 21/23 und 22/23 sowie Einrichtungs-/Executorfehler | Historisch erhalten. Der genaue v4-Kandidat liefert laut unabhängigen Originalnachweisen 23/23, Build und wirksame rote Schutzmutation nach erfolgreichem Setup |
| Rest | Integration mit heutigem main, iPad-Hülle und Kriterienmodell nicht durch K1 abgedeckt | **Die alte begrenzte rote Prüfung besteht am K1-v4-Kandidaten nicht mehr.** Das beweist keinen bereits fertigen EV-Gesamtkandidaten; dessen geänderte Wirkung ist noch zu prüfen |

K1 ist keine vollständige Ziel-1-Repositorybasis: Das bereinigte Paket hat keine iPad-Hülle. Vorliegende Beiträge werden gezielt eingeordnet, kein privater Gesamtstand über main kopiert. Die wiederhergestellte Paketbaum-Prüfung und Originalrollenberichte wurden berücksichtigt; diese PR führt keine neuen Produkt- oder Geräteprüfungen aus.

## 5. PR #198, Zweige und Integrationsbasis

**Integrationsbasis:** aktuelles Produkt-main `bb10457ade11490b785ab16e6f231c442e3affd2` nach PR #208. Die seit dem unabhängig geprüften Stand hinzugekommenen Änderungen sind Dokumentation. Reader/Formular und passende Gerätebeiträge gezielt auf diese Basis übernehmen; kein pauschaler Gesamtmerge alter Zweige.

- [PR198][pr198] ist weiterhin offen und Draft, Kopf `f88e82ab013daf6f8a095224af6cd4d7ef0dc880`, tatsächliche PR-Basis PR192 (`e6d7ff4…`).
- Gegen die fest geprüfte Hauptbasis bestehen genau zwei textuelle Konflikte: `package.json` und `tests/version.test.mjs`, Version 0.152.2-beta gegen 0.153.4-beta. Atlas bestätigte sie erneut gegen b78; PR205 ändert nur den Auftrag. Textuell sauberes Zusammenführen anderer Dateien beweist keine semantische Verträglichkeit.
- PR196 und PR198 sind Geschwister auf PR192, keine vollständige Ablösung. PR196 enthält zusätzliche Gateway-/Session-Verifier-Dienstarbeit, die für Ziel 2 erhalten bleibt. PR187 ist ebenfalls keine vollständig eingeschlossene Vorstufe von PR198.
- PR194-Geräte-UX einmal übernehmen. Zugehörige Versions-/Workflowänderungen nicht ungeprüft mitaktivieren. Die früheren PR188/189/190/192 sind Quellen/Vorgänger, keine vier neu zu integrierenden unabhängigen Lieferungen.
- Test11 berichtet 890/890 am veröffentlichten Referenzcode `2b51475`/0.153.4-beta, Run43561301401. Das ist kein frischer CI-PASS am späteren Kopf f88 und keine neue EV-Abnahme.
- Erfolgreichen Pilot und positiven Test11-Nachtrag bewahren. Offene/geänderte Schritte in EV-7.3/7.4 gemeinsam mit Peter prüfen und **während des Tests** protokollieren; den alten Test nicht nachträglich vollständig rekonstruieren.

Der heutige Funktionsbruch ist bereits lokalisiert: Alte Einzelbewertung/ableitung deckt nur zwei Mathestandards ab; das neue Formular liefert noch keine allgemeine kriteriumsweise Wirkung bis Lücke und Runde. Referenzen: [Ereignisvertrag Zeile 15][ereignisse], [Ableitung Zeile 329][ableitung], [Lückenbewertung Zeile 2765][std-rating], [Schulstartbewertung Zeile 6675][school-stand]. Vorhandene Aufgaben werden aus programmierten Vorlagen erzeugt. Die KI soll Schulinhalt übernehmen/Standards vorschlagen, nicht eine neue Aufgabenbank erfinden.

## 6. Erster Umsetzungsabschnitt: EV-1, parallel EV-2 und EV-3

**Ausführungsplan nach Peters Startfreigabe.** Statusmeldungen werden erst beim tatsächlichen Start fortgeschrieben. Ein eigener Worktree/Zweig je tatsächlichem Worker; Atlas integriert. Genau ein Halter für betroffene Bereiche von `index.html`. Aufgaben enthalten Ziel, Quellverweise, Dateigrenzen, vollständige AK, Testbefehle und Ausschlüsse. Keine Kopien in Agentarium oder andere Ablagen.

| Aufgabe | Agent | Abhängigkeit / Quellbezug | Abnahme | Status / nächste Aktion |
|---|---|---|---|---|
| Ausführbare Produktübergabe herstellen | Atlas | Aktueller Auftrag §7 und Peters Startvorgabe; aktuelles main nach PR208 | **Ein begrenzter Versuch, höchstens 1 Stunde.** Bei nicht verfügbarem direktem Forge-Weg eigene Produktzweige und PRs der tatsächlichen Worker verwenden; Relay-Frage zurückstellen. Keine zusätzliche Infrastruktur ohne Peters Zustimmung | Versuch 1 beendet: direkter Claude-/Forge-Kanal und lokale Claude-Laufzeit hier nicht verfügbar. Freigegebener Weg: native Entwicklungsworker direkt im Produktrepo, eigene Worktrees/Zweige/PRs; kein weiterer Relayversuch |
| EV-1.1/1.2: feste Kennung, Keychain-Diagnose | Entwicklungsworker iPad, tatsächliche native Instanz | main plus Native-Quelle `feature/bq-evaluation-end-to-end-test11@f88…`; [Paketwerkzeug Zeile 34][paket], [Keychain Zeile 21][keychain] | Feste ID `de.bigquest.ipad`; Speichern/sofortiges Zurücklesen/Startcodes und Access Group, nie Schlüsselwert; −25300/−34018/−25308 unterscheidbar. Automatische Prüfung; N/N+1 und Neustart mit Peter | Geliefert: native Instanz dev_ev1_direct, [Produkt-PR #209](https://github.com/pahlborn/bis-school-app_src/pull/209), Kopf `3d910802556f515707ba167a37ae7f9cb1227717` (zu `40398b3` nur die Aussage zum Diagnose-Löschaufruf präzisiert); iOS-/Export-CI grün, vollständiger lokaler Gesamtlauf 897/897 bestanden. Echte iPad-Persistenz und N/N+1-Neustart bleiben offen |
| EV-1.3: Geräteverbindung; EV-1.4 nur bedingt | Derselbe iPad-Worker; Webanschluss in reserviertem UI-Zeitfenster | EV-1.1/1.2, PR194/US202-Referenzen | Nach bestätigter Bindung Zugangscode merken; bei fehlender Webbindung wiedergeben; ungültig/abgelaufen regulär verbinden ohne Schleife. RAM-Key einmal pro Sitzung ausschließlich nach verlangtem realen Negativbefund | Offen; Code-/Gerätebeleg nötig. Diagnoseergebnis nicht mit bewiesener Persistenz gleichsetzen |
| EV-2.1–2.5: Kriteriendaten, Ableitung, ein Save | Entwicklungsworker Daten; konkrete Vertragsfragen an Atlas, bei Bedarf Archibald | [Ereignisse][ereignisse]/[Ableitung][ableitung], EV-Story-AK; gemeinsamer Katalogvertrag mit EV-3 | Kriterienstandard, bekannte Codes/Maximalzahl/Textprüfung, schwächere Aggregation ohne Verlust der Originalnoten; Altformate unverändert; Revision/Rücknahme, genau einmal, Kind-/Kontowechsel sperrt, zwei Geräte behalten beide Evaluationen | Tatsächlich gestartet: native Instanz dev_ev2_direct, [Produkt-PR #211](https://github.com/pahlborn/bis-school-app_src/pull/211), Kopf `f868e0e01a4a5b668ce2ef8459b8c9f19a50de46` (zu geprüftem Produktcode nur Bericht geändert); 99 Fokuschecks grün, fachliche rote Gegenproben; vollständiger Gesamtlauf auf `45c839bc6b62d84df488ccdfe28981f6c43e2ae4` 916/916 bestanden, keine übersprungenen Tests. Neue Browser-/Gerätekette bleibt EV-4/EV-7 |
| EV-3.1/3.2: Standardliste | Entwicklungsworker Katalog | [Bestehende Standardtexte Zeile 6568][standard-text], Standards/Questbezüge auf gleichem Commit; mit EV-2 gemeinsamer Vertrag | Alle bekannten Codes, Fach und DE/EN, optionale existierende Quests; eindeutige Codes; alle Quest-Hauptstandards enthalten. Ohne Quest wählbar/kein Fokus, später passende Quest wirkt; Pflegeanleitung | Tatsächlich gestartet: native Instanz dev_ev3_direct, [Produkt-PR #210](https://github.com/pahlborn/bis-school-app_src/pull/210), Kopf `6b61221bfa8787c81ba9af45ccffd26ec198096f` (nur Bericht nach geprüfter Codebasis ergänzt); eine Katalogquelle und Anzeige angebunden, fokussierte Modul-/Browsertests grün. Erster Gesamtlauf: 905/906 bestanden; ein veralteter Test las nur den bisherigen Objektliteral. Testkorrektur auf `d077fbc1926e651e87c71490789324c8a4daa741` gezielt 2/2 grün; vollständiger Wiederholungslauf auf demselben Kopf 906/906 bestanden, keine übersprungenen Tests. Historischer erster FAIL bleibt im Bericht. EV-3.3 folgt separat |
| EV-3.3: Grundlage-Beispiele | Eigener begrenzter Entwicklungsauftrag nach Katalog-/UI-Zeitfenster | Grundlagebasis PR112; [Beispielauswahl Zeile 3384][beispiele]; vor/mit M2. Quests: numbers, combos, wordprob, forces, units, graphs, sentences, words, anleitung, library | Sinnvolle andere Beispielaufgabe samt Lösungsweg, eigene Aufgabe bleibt offen; korrekte Hilfsbuchung; vorhandener Schulweg. Ausnahmen ohne Lernnutzen je Aufgabenart knapp begründen. Alte Pauschaltests gegen Stufe-1-Beispiele gezielt anpassen; sinnvolle rote Gegenprobe | Verbindlich eingeplant, noch nicht implementiert; Module/Inhalt parallel, UI nur im reservierten Zeitfenster. Nicht nach Ziel 2 verschieben |
| Integration und unabhängiger Abschnittsnachweis | Atlas; Sentinel für Verhalten, Argus für einen benannten entscheidenden Risiko-/AK-Punkt | Exakter gemeinsamer Kandidat aus den genannten Produktzweigen | Vollständiges npm test, erforderliche Swift-CI am exakten Stand, neue Funktion sinnvoll gegen alten Zustand/gezielte Mutation rot, Prüfbericht. Geräte-AK nur mit Peter | Die tatsächlich ausgeführten unabhängigen nativen Instanzen argus_start_purpose und sentinel_start_behavior haben den begrenzten Softwareumfang bestätigt; genaue Kriteriengrenzen und verbleibende Nachweise in Abschnitt 8.1. Gemeinsamer Kandidat und gezielte Korrekturen sind geprüft; aktueller Stand und verbleibende Mergefreigabe in Abschnitt 8.2. Argus beginnt mit der Zweckfrage; die ausdrücklich genehmigte native tägliche Taktprüfung ist eingerichtet |

### Regeln für Argus und Cadence bei jedem Einsatz

Abschnitt 7a des aktuellen Auftrags hat in diesem Projekt Vorrang vor ihren allgemeinen Regeln. Atlas gibt den jeweils betroffenen Teil von Abschnitt 7a und die gemeinsamen Regeln **bei jedem Einsatz wörtlich** mit; die konkrete Quelle wird über main-Commit, Pfad und Zeile gebunden.

- **Argus beginnt jede Prüfung mit der Zweckfrage:** Welches Abnahmekriterium aus den Ziel-1-Epics oder welche ausdrücklich genehmigte Aufgabe erfüllt die Arbeit? „Keines“ ist ein Befund. Zusätzlich prüft er die Haltepunkte aus Abschnitt 6 und die Ein-Quellen-Regel aus Abschnitt 7. Weitere Belege können einen Zweck-/Haltebefund nicht ausgleichen.
- **Cadence liest täglich die drei Statuszeilen.** Direkte Meldung an Peter ohne Atlas-Freigabe bei zweimal keinem neuen Abnahmekriterium, einer Story länger als einem Arbeitstag ohne Merge, dem dritten Anlauf eines Problems, Arbeit ohne Story-/Auftragsbezug oder ausbleibendem Status. Meldung: was auffällt, seit wann, Empfehlung weitermachen/anhalten/zurückstellen.
- **Beide dürfen Peter jederzeit direkt ansprechen.** Atlas verhindert, genehmigt oder lenkt diese Meldungen nicht um. Beide widersprechen auch dem Mandat, wenn es nicht zu Ziel 1 oder einer genehmigten Aufgabe passt.

Peter hat am 17.11. die konkrete native Vertretung für die tägliche Taktprüfung ausdrücklich freigegeben, weil der direkte Claude-Cadence-Kanal hier nicht verfügbar ist. Die tägliche Automatik **Big Quest Taktprüfung** ist eingerichtet: ausschließlich aktuelle Statuszeilen und Haltepunkte lesen, begründete Meldung direkt an Peter ohne Atlas-Freigabe, keine Code-/Infrastrukturarbeit. Sie ist transparent als native Prüfung benannt, nicht als Claude-Cadence-Lauf. Die auftragsspezifischen Regeln sind im Prüfauftrag wörtlich mitgegeben. Statusquelle ist das Gespräch dieser PR einschließlich der verlinkten aktiven Produkt-PRs. Die tatsächlichen Ausführungsergebnisse bleiben von der bestätigten Einrichtung getrennt.

**Anschließende Reihenfolge unverändert:** EV-4 → EV-5 → EV-6 → EV-7. Abschluss erst mit protokollierter iPad-Kette und manueller Browserparität. Kein Erfolg allein aus CI. Grundlagebeispiele vor/mit M2; bestehender ehrlicher Balken wird erhalten.

Für die Durchführung gelten die aktuellen Halteregeln: drei erfolglose Anläufe desselben Problems, zwei Arbeitsrunden ohne neues AK, mehr als ein Arbeitstag ohne Merge, Scopewachstum oder unbeauftragte Prozess-/Archivarbeit lösen Anhalten und eine konkrete Entscheidungsvorlage mit Alternativen aus. Unbekanntes zuerst begrenzt klären. Status nennt neue AK, fehlende Eingaben und Anlaufzahl; keine Kosten-/Archivrunde als Ersatz für Produktfortschritt. Eine fehlende Veröffentlichungsfreigabe wird nicht durch einen unautorisierten Merge umgangen.

## 7. Tatsächlich verbleibende Arbeiten, priorisiert

1. **Freigegebene Quellenintegration:** PR212 ist in main2fd28d0, ohne Diff zum geprüften Produktbaum. BerichtPR206 wird danach gemergt. Die ausdrücklich erteilte Freigabe und die vorherige automatische Ablehnung sind in8.2 unterschieden; keine Veröffentlichung oder Kundenannahme.
2. **Einmalige Main-Prüfungen und Gerätetest12:** Build und Export jeweils einmal neu aufmain, Frist20:49:11UTC/21:49:11Europe/Berlin; bei fehlendem Erfolg genau drei Zeilen anPeter. Eine einmalige Fristprüfung ist eingerichtet. Keine CI-Reparatur ohne Zustimmung. Der fehlende manuelle Buildtrigger ist konkret gesondert vorgelegt. Danach Test12-Paket und kurze Anleitung aus8.3 liefern; genaue Run-/Main-/Paketreferenzen im PR206-Gespräch.
3. **Danach EV-1.3 und EV-3.3:** Geräteverbindung merken; EV-1.4 ausschließlich bei belegtem Schlüsselbundverlust. Sinnvolle Grundlagebeispiele vor/mitM2. Kind-/Revisions-/Entzugs- und bestätigten Offline-Schutz erhalten; vorhandenen ROT-Auftrag respektieren.
4. **EV-4 → EV-5 → EV-6 → EV-7:** gemeinsames Formular, Zuordnungsvorschläge, Nachzuordnung und durchgehende Übungswirkung samt Browserparität und iPad-Abnahme. Sicherheitsbefunde bleiben passend zu prüfen, keine Erledigung durch Archivierung.
5. **Ziel2 bleibt getrennt:** M5Chrome/Text/Datei beiBedarf, M6Parser, M7KI-Dienst mit vorhandenen Beiträgen, M8Fremdfamilienanmeldung/TestFlight, M9Store. Keine neue Infrastruktur oder Veröffentlichung aus dieser Rückgabe.

## 8. Prüfung dieses Berichts

Geprüft wurden Quellen/Originalrückgaben und die beschriebenen Commit-/Branchbeziehungen. PR198-Kopf und heutiges main wurden nochmals gelesen; PR205/207 ändern den Auftrag, PR208 übernimmt die entschiedenen Konzeptpunkte. Gegenüber der geprüften Produktbasis sind dies Dokumentänderungen. Für den Bestandsabgleich wurde keine neue Produkt-, Browser-, Swift- oder Geräteprüfung durchgeführt. Die anschließenden tatsächlichen Produktprüfungen stehen gesondert in Abschnitt 8.1. Historische Testergebnisse bleiben ausdrücklich historische Ergebnisse. Markdown-Verweise, Tabellenstruktur, 130 eindeutige historische Journal-IDs und Whitespace wurden kontrolliert. Diese PR enthält genau einen Dokumentationspfad.

Die drei unabhängigen Phase-A-Beiträge sind tatsächlich erfolgt; reguläre neue Forge-/Archibald-/Cadence-Läufe sind nicht erfolgt. Kein Erfolg, Kostenwert, Workerbeginn oder Kundenannahme wurde aus einem Plan abgeleitet. Native Sitzungskosten unbekannt; kein bezahlter neuer Claude-Lauf gestartet.

### 8.1 Erste getrennte Produktlieferungen und unabhängige Prüfung

Die folgenden Einzelstände liegen vor der gemeinsamen Integrationsfortschreibung aus Abschnitt 8.2. Diese Ergänzung hält den am 17.11. tatsächlich gestarteten ersten Entwicklungsabschnitt fest; sie macht den historischen Bestandsabgleich nicht rückwirkend zur Produktabnahme. Alle drei Entwickler waren ausdrücklich freigegebene **native Atlas-Instanzen**, keine als Claude ausgegebenen Forge-Läufe. Branches, Code und Prüfberichte liegen ausschließlich im Produktrepo. Kein Main-Merge und keine Bereitstellung.

| Lieferung / fest geprüfter Produktstand | Vollständige eigene Prüfung | Unabhängiger Befund / Grenze |
|---|---|---|
| [PR209](https://github.com/pahlborn/bis-school-app_src/pull/209), Code `f60a44690171a818baaa178c8d35acbbef097848`; spätere Köpfe ändern nur den Prüfbericht | 897/897 `npm test`, Exit 0; N/N+1-Export, gezielte Kennungs-Gegenprobe rot; [iOS-Build und ausgeführte synthetische Swift-Regression](https://github.com/pahlborn/bis-school-app_src/actions/runs/44107708356), [Export-CI](https://github.com/pahlborn/bis-school-app_src/actions/runs/44107708481) grün | Sentinel: eigene echte Exporte 99/100, ZIP/Quellbytes/Hashes geprüft, eigene Mutation rot und Wiederherstellung grün; CI eigenständig rückgelesen. Argus: Codeanteil EV-1.1/1.2 bestätigt. Echte iPadpersistenz nicht geprüft |
| [PR211](https://github.com/pahlborn/bis-school-app_src/pull/211), Code `45c839bc6b62d84df488ccdfe28981f6c43e2ae4`; finaler Kopf `f868e0e` ergänzt nur Bericht | 916/916 `npm test`, Exit 0; 99 Fokuschecks, sieben rote Baseline-Gegenproben und drei rote Schutzverletzungen | Sentinel: eigene 51 Grenzfälle, darunter 32 Ratingpaare, gemischte Alt-/Neudaten, Revision/Rücknahme, echte Signatur-/Rollen-/Widerrufsgegenfälle; Baseline lehnt neuen Kriterienevent erwartungsgemäß ab. Argus: 15 eigene Kriterienfälle und signierte Override-Gegenprobe. Neue Formularbestätigung/Übungswirkung offen |
| [PR210](https://github.com/pahlborn/bis-school-app_src/pull/210), Code/Tests `d077fbc1926e651e87c71490789324c8a4daa741` | Erster Lauf 905/906: alter Testparser las nur bisherigen Objektliteral; gezielte Korrektur, danach 906/906 vollständig, Exit 0; Gegenproben rot. Keine semantische Lockerung des ursprünglichen Schutzes | Sentinel: echter DE/EN-Elternweg mit/ohne Evaluation, 15 Codes und Hinweis ohne Quest, 320px ohne Überlauf; alle 14 bisherigen Quest-Haupt-/Nebenfolgen direkt verglichen. Argus: Katalog und Integration bestätigt. Auswahl/Speicherung/Wirkung weiterhin EV-4/EV-7 |

**Unabhängige Rollen:** Argus `/root/argus_start_purpose`, Aufgabe `BQ-2026-0005-START-ARGUS-20261117-A1`: `PASS_WITH_NOTES` für den engen Code-Review, kein Zweck-/Haltebefund. Sentinel `/root/sentinel_start_behavior`, Aufgabe `BQ-2026-0005-START-QA-20261117-A1`: `PASS_WITH_LIMITS` für die beauftragten Softwarefälle. Eigene Start-/End-/Rückgabemeldungen sind im vorhandenen Journal veröffentlicht: [Argus-Rückgabe](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6952188617), [Sentinel-Rückgabe](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6952231372); eine Kundenannahme folgt daraus nicht. Linuxprüfung mit Node24.22.1, Playwright1.56.1 und Chromium156; Swift-Ausführung ausschließlich über die tatsächlich rückgelesene macOS-CI.

**ARGUS-N1:** `defer` ruft die Löschung des leeren Diagnosemarkers auf; ein erfolgreicher Löschvorgang wird derzeit nicht durch Auswertung des Codes bewiesen. Der Prüfbericht in PR209 wurde auf diese Aussage begrenzt. Kein Blocker; ein leerer Marker könnte bei iOS-Löschfehler verbleiben, Providerwerte sind nicht betroffen. Technischer Owner bleibt die iPad-Entwicklung; Behandlung eines Löschfehlers beim nächsten EV-1-Abschnitt prüfen. Kein zusätzliches Reparaturprojekt.

**Integration / nächster Owner Atlas:** Empfohlene Reihenfolge PR209 → PR210 → PR211; die gemeinsame Katalogbasis `853967c` und die späteren Katalog-/Testkorrekturen müssen erhalten bleiben. Zwei paarweise `git merge-tree`-Prüfungen waren konfliktfrei; es gibt noch keinen gemeinsam getesteten Integrationscommit. Nach Freigabe zusammenführen und den festen gemeinsamen Stand prüfen. Danach EV-1.3, die bedingte EV-1.4 und EV-3.3 abarbeiten, gefolgt von EV-4 bis EV-7 gemäß Abschnitt 6. Echte iPad-Schritte erst mit Peter; kein Gesamt-M1/M2 oder Ziel-1-PASS aus den Teilnachweisen ableiten.

**Kosten:** Native Modellgesamtkosten nicht verfügbar; keine neuen bezahlten Claude-Läufe oder Produkt-API-Aufrufe. Die fehlende Messung ist kein Nullkostenbeleg. Keine Kostenanalyse oder weitere Infrastrukturarbeit begonnen.

### 8.2 Gemeinsamer Integrationsstand und gezielte Korrekturen · 17.11.2026

**Aktueller Vollzug nach ausdrücklicher Freigabe:** PR212 ist als erster Schritt nach main gemergt (`2fd28d0cbc7366720e496d20bdd4bcfce0c85d11`). Der tatsächliche Hauptzweig ist bytegleich zum geprüften Kopf7a2001a, git diff Exit0. Dieser Bericht ist der ausdrücklich genehmigte zweite Merge. Keine App-Veröffentlichung. Der nächste Schritt wurde tatsächlich ausgeführt: Atlas führte die drei Produktzweige in einem eigenen Worktree zusammen, sicherte den gemeinsamen Stand im Produktrepo und ließ das Zusammenspiel unabhängig prüfen. Gefundene echte Anzeigeprobleme wurden durch die qualifizierte native Entwicklungsinstanz `dev_ev3_direct` im eigenen Produktzweig behoben. Kein neuer Forge-/Relayversuch, keine neue Architektur, kein Deployment.

**Prüfbereiter Kandidat:** [PR212](https://github.com/pahlborn/bis-school-app_src/pull/212), Kopf `7a2001afaa648759d17e3da981e97c4c696f0dcb`; stabiler Produkt-/Testcommit `1d522390199847de5caa3acc7af15c4d05a77471`. Dazwischen wurde ausschließlich der vorhandene EV3-Prüfbericht ergänzt. PR209/210/211 sind mit ihrer ursprünglichen Historie enthalten. Der zusätzliche Produktdiff der letzten Korrektur gegenüber `d929c1b` umfasst genau zwei CSS-Regeln; Datenmodule, Katalog und native Quellen bleiben unverändert.

| Fester Stand | Tatsächliche Prüfungen | Ergebnis / verbleibender Befund |
|---|---|---|
| `e86c2a51deb0d17155c0e11d95ee89ba02653f8a` | 922/922 vollständige lokale Tests, Build grün; eigene gemeinsame Sentinel-Prüfung über echten Schreibweg | Daten/Ableitung korrekt; **FAIL** für sichtbare `undefined`-Werte im Kriterienverlauf und Überlauf geöffneter Rubrik/Links. [Eigene QA-A1-Rückgabe](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6953490918) |
| `91bf85b`, Berichtskopf `d929c1b` | 925/925 vollständige lokale Tests auf Chromium141; eigene rote/grüne Browserregressionen auf141/156; unabhängige gemeinsame signierte Daten-/Rechteprüfung | Ursprüngliche Fehler behoben, Test-11-unmapped korrekt. **FAIL-Rest:** zulässiger 160-Zeichen-Titel, 1378/320px. GitHub bestätigt zusätzlich 336/320px im Filterfall. [QA-A2](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6954375409), [damaliger CI-Lauf](https://github.com/pahlborn/bis-school-app_src/actions/runs/44126507182) |
| `1d52239`, finaler Kopf `7a2001a` | Beide Browser je5/5 gezielt grün; bisherige CSS-Regeln in denselben fachlichen Gegenproben tatsächlich rot. [Vollständige Web-CI](https://github.com/pahlborn/bis-school-app_src/actions/runs/44130284369): alle sechs Shards und Build erfolgreich, **926/926 PASS**, 0 FAIL/SKIP/CANCEL; Primärlogs bestätigen finalen Kopf | Frische unabhängige Ursachenbestätigung und Sentinel-A3 bestanden im begrenzten Browserumfang. Keine offene blockierende Anzeigeverletzung; NOTE zum geschlossenen nativen Select unten |

**Konkrete behobene Fehler:** Die vorhandene Verlaufsanzeige liest jetzt erlaubte Kriterienbewertungen und Test-11-Altbestände mit ihren ursprünglichen Einzelnoten. Leere Einstufungen und fehlende Zuordnung bleiben erkennbar; ein technischer Top-Level-Wert wird nicht zur erfundenen Lehrkraftnote. Lange Kriterientexte/Rubriken und zulässige 160-Zeichen-Titel bleiben innerhalb ihrer Karten vollständig erhalten. Das Filterlabel kann auf den verfügbaren Platz schrumpfen.

**Frische unabhängige Zweitsicht:** Argus `/root/argus_ci_width_fresh` reproduzierte am unveränderten Stand mit vorhandenen DejaVu-Metriken genau 336/320px: 282px Filterbreite bei 212px Container. Die ausschließlich im Arbeitsspeicher eingesetzte kleinste Labelbegrenzung ergibt 320/320px und unveränderte Optionsstrings. Das erklärt einen konkreten CSS-Defekt; das genaue historische GitHub-Fontmapping bleibt unbekannt. [Eigene Rückgabe](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6954714331). Zweckbezug ist die beauftragte Integration sowie EV-3.1/EV-4.5. Keine dritte blinde Reparaturrunde; es gab zwei gezielte Produktkorrekturen mit erhaltenen Zwischenbefunden.

**Unabhängige Endprüfung:** Sentinel `/root/sentinel_start_behavior`, QA-A3 auf `1d52239`: acht tatsächliche Kombinationen aus Chromium141/156, DE/EN und Default/DejaVu, überall 320/320px nach Font-/Layoutfertigstellung. Filter und Texte passen auch in ihre tatsächlichen Container; gespeicherte Titel und 2000-Zeichen-Kriterien bleiben vollständig. Native Fach-/Sortierauswahl wurde per Tastatur bedient. Dieselbe Geometrieprüfung mit den beiden früheren CSS-Regeln wird rot, anschließender aktueller Kontrolllauf grün. [Eigene Rückgabe](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6954933926). Die in QA-A2 tatsächlich geprüften neun signierten Ereignisse, Originalnoten, Override/Fork/Auflösung/Rücknahme, Mischformate und Rechte-/Manipulationsgegenfälle bleiben bei identischen Datenmodulen zugeordnet; sie wurden nicht als neue A3-Ausführung ausgegeben.

**Build:** Atlas baute den finalen Kopf lokal mit dem vorhandenen Testinstanzwerkzeug; alle 18 Suchlaufprüfungen bestanden. Der Build wurde nicht veröffentlicht. Keine echten API-Aufrufe oder Schlüssel verwendet.

**Native Nachweisgrenze:** Neue iPad-Jobs [Build](https://github.com/pahlborn/bis-school-app_src/actions/runs/44130284265) und [Export](https://github.com/pahlborn/bis-school-app_src/actions/runs/44130284291) auf `7a2001a` waren zuletzt weiterhin **queued**, nicht PASS. Sämtliche nativen Build-/Exporteingaben – iOS-Projekt/Quellen, Swiftregression, Exportwerkzeug/-test, beide Workflows und Paketkonfiguration – sind bytegleich zum tatsächlich erfolgreich geprüften `3d910802`; erneuter `git diff` Exit0. Die quellenidentischen Nachweise [iOS-CI](https://github.com/pahlborn/bis-school-app_src/actions/runs/44113009864) und [Export-CI](https://github.com/pahlborn/bis-school-app_src/actions/runs/44113009659) werden für diese unveränderten Komponenten übernommen. Das ist weder eine behauptete Ausführung der wartenden Jobs noch eine echte iPad-Neustart-/Persistenzabnahme.

**Offene Hinweise:** Im geschlossenen nativen deutschen Sortierfeld ist ein langer Optionswert gekürzt; geöffnet ist derselbe vollständige Text sichtbar und per Tastatur wählbar. Sentinel stuft dies als NOTE ein; gespeicherte Titel/Kriterien werden vollständig angezeigt. ARGUS-N1 zum nicht ausgewerteten Löschcode des leeren Diagnosemarkers bleibt als nicht blockierende nächste EV-1-Prüfung erhalten. Keine neue Ausnahme für Geheimnisse, Speicherrechte oder ursprüngliche Daten.

**Freigabe und Vollzug:** Die vorherige automatische Ablehnung mangels konkreter Zustimmung bleibt historisch dokumentiert. Peter hat danach ausdrücklich „Merge von PR #212 und danach PR #206 nach main. Keine Veröffentlichung“ freigegeben. PR212 wurde erfolgreich gemergt; der Hauptzweig entspricht dem geprüften Produktbaum. Dieser Bericht folgt in der freigegebenen Reihenfolge. Zusätzliche Auflage: beide iPad-Prüfungen nach den Merges einmal auf main starten; bei fehlendem Erfolg innerhalb von zwei Stunden sofort drei Zeilen melden, keine eigenständigen CI-Reparaturen. Die Build-Datei hat bisher keinen manuellen Trigger; ausschließlich dessen Ergänzung ist Peter gesondert vorgelegt. Export unterstützt manuellen Start. Die einmalige Fristprüfung ist für20:49:11UTC/21:49:11Europe/Berlin eingerichtet. Main-Commits, Run-IDs, Paket und Hashes werden im Gespräch dieser PR unter `[BQ-TEST12-MAIN-CI-20261117]` dokumentiert.

**Rollen / Kosten / nächster Owner:** Tatsächliche native Entwicklungs- und Prüfrückgaben sind veröffentlicht; [Entwicklung-A2](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6954928638). Keine Claude-Beteiligung erfunden. Native Modellgesamtkosten nicht verfügbar; keine neuen bezahlten Claude- oder Produkt-API-Aufrufe. Nächster Owner Atlas: freigegebene Quellenintegration, einmalige Main-Prüfstarts und Gerätetest12-Paket. Der manuelle Buildtrigger bleibt ohne gesonderte Zustimmung unverändert. Nur die zuvor ausdrücklich genehmigte einzelne tägliche Taktprüfung läuft automatisch, keine unbeaufsichtigte Produktentwicklung.

### 8.3 Gerätetest12 · kurze Anleitung für Peter (EV-1.1 / EV-1.2)

Diese eine Abnahme nutzt **Test12 (N)** und **Test13 (N+1)** aus demselben Hauptstand. Beide haben dieselbe App-Kennung `de.bigquest.ipad`; nur Anzeigename und Buildnummer wechseln. Test13 ist hier das Vergleichspaket für Gerätetest12. Download, Quellcommit und SHA256 werden im Rückgabekommentar dieser PR verlinkt.

1. Auf demselben iPad Paket12 in „Dateien“ entpacken, die enthaltene `.swiftpm` in SwiftPlaygrounds öffnen und mit ▶ starten. Die Hülle öffnet die bestehende Testseite.
2. Wie beim bisherigen Test verbinden und anmelden. Die erste Umstellung von der früheren Test11-App-Kennung kann einmalige Neueingaben brauchen. Erst danach beginnt der Vergleich.
3. Oben „Claude-Schlüssel“ öffnen, den vorhandenen Schlüssel eingeben, „Im Schlüsselbund speichern“ wählen. Nur Speichern-Code, unmittelbaren Lesen-Code und AccessGroup notieren (normalerweise0/OK). Dieser Speicherschritt ruft keine KI auf; für den Test keinen Toddle-Import starten.
4. App in Playgrounds stoppen, Playgrounds im App-Umschalter vollständig schließen, Paket12 erneut starten. Lesen-Code/AccessGroup unter „Schlüsselbund beim Start“ und „Geräteverbindung gehalten:ja/nein“ notieren.
5. Ohne vorheriges Löschen der Appdaten Paket13 öffnen und starten. Vor einer erneuten Schlüssel-/Zugangscodeeingabe dieselben Angaben notieren. Das prüft den WechselN→N+1.
6. Mir nur diese Codes/AccessGroup und die Verbindungsbeobachtung schicken. Bei einem Fehler die Angaben vor erneuter Eingabe sichern. Keine Schlüssel, Passwörter oder Schuldaten senden.

**Ergebnisbogen:** Paket12 Speichern/Lesen-direkt/AccessGroup; Paket12 Neustart Lesen/AccessGroup/Verbindung; Paket13 Start Lesen/AccessGroup/Verbindung. Physischer Status bleibt NOT_TESTED bis zu Peters tatsächlicher Rückgabe. EV-1.3 und die vollständige Formular-/Übungsabnahme bleiben getrennte offene Arbeiten.

## Anhang A · Quellenverweise

- [Aktueller Auftrag, Abschnitt 7][auftrag]; [Hauptkonzept][konzept]; [EV-Stories][epics]; [Zusammenfassung][summary]; [Elternkonzept §6][eltern].
- Ältere ursprüngliche Aufträge: `docs/konzept/dev-auftraege-2026-11-03.md`; Stand der Implementierungen durch PR112/PR109 und die beiden Prüfberichte oben belegt.
- Originalrollen-/Teilauftragskommentare: vollständiger Index in Anhang C. Zusätzliche nur separat zurückgegebene US403-/OPS01-/ROT-Aufträge sind in Abschnitt 2 ausdrücklich mit ihren Nachweisgrenzen geführt.
- Für die hier verwendeten Produktcodeverweise ist main `91b8e8ff797904092445e0ddf1e65ad373bde4ec` der feste Bezug; Native-Quellen liegen noch am Kopf `f88e82ab013daf6f8a095224af6cd4d7ef0dc880` des Test11-Zweigs. Es wird kein Quelltext in diesen Bericht kopiert.

[auftrag]: https://github.com/pahlborn/bis-school-app_src/blob/bb10457ade11490b785ab16e6f231c442e3affd2/docs/konzept/auftrag-atlas-evaluationen-ziel1.md#L154
[konzept]: https://github.com/pahlborn/bis-school-app_src/blob/bb10457ade11490b785ab16e6f231c442e3affd2/docs/konzept/evaluationen-uebernahme.md
[epics]: https://github.com/pahlborn/bis-school-app_src/blob/bb10457ade11490b785ab16e6f231c442e3affd2/docs/konzept/evaluationen-ziel1-epics.md
[summary]: https://github.com/pahlborn/bis-school-app_src/blob/bb10457ade11490b785ab16e6f231c442e3affd2/docs/konzept/evaluationen-ziel1-zusammenfassung.md
[eltern]: https://github.com/pahlborn/bis-school-app_src/blob/91b8e8ff797904092445e0ddf1e65ad373bde4ec/docs/konzept/elternbereich.md#L273
[a1]: https://github.com/pahlborn/bis-school-app_src/blob/91b8e8ff797904092445e0ddf1e65ad373bde4ec/docs/pruefung/2026-11-03-auftrag1-grundlage.md
[a2]: https://github.com/pahlborn/bis-school-app_src/blob/91b8e8ff797904092445e0ddf1e65ad373bde4ec/docs/pruefung/2026-11-03-auftrag2-bestaetigt.md
[test11]: https://github.com/pahlborn/bis-school-app_src/blob/91b8e8ff797904092445e0ddf1e65ad373bde4ec/docs/pruefung/2026-11-17-test11-geraetetest-nachtrag.md
[ereignisse]: https://github.com/pahlborn/bis-school-app_src/blob/91b8e8ff797904092445e0ddf1e65ad373bde4ec/src/module/ereignisse.mjs#L15
[ableitung]: https://github.com/pahlborn/bis-school-app_src/blob/91b8e8ff797904092445e0ddf1e65ad373bde4ec/src/module/ableitung.mjs#L329
[std-rating]: https://github.com/pahlborn/bis-school-app_src/blob/91b8e8ff797904092445e0ddf1e65ad373bde4ec/index.html#L2765
[school-stand]: https://github.com/pahlborn/bis-school-app_src/blob/91b8e8ff797904092445e0ddf1e65ad373bde4ec/index.html#L6675
[standard-text]: https://github.com/pahlborn/bis-school-app_src/blob/91b8e8ff797904092445e0ddf1e65ad373bde4ec/index.html#L6568
[beispiele]: https://github.com/pahlborn/bis-school-app_src/blob/91b8e8ff797904092445e0ddf1e65ad373bde4ec/index.html#L3384
[paket]: https://github.com/pahlborn/bis-school-app_src/blob/f88e82ab013daf6f8a095224af6cd4d7ef0dc880/werkzeug/ipad-playgrounds-paket.mjs#L34
[keychain]: https://github.com/pahlborn/bis-school-app_src/blob/f88e82ab013daf6f8a095224af6cd4d7ef0dc880/ios/BigQuestMVP/ClaudeClient.swift#L21
[relay-read]: https://github.com/pahlborn/agentarium/blob/32439353aea9793a8818d7c115657c10d2a354c4/relay/claude_public_relay_v2.py#L345
[relay-copy]: https://github.com/pahlborn/agentarium/blob/32439353aea9793a8818d7c115657c10d2a354c4/relay/claude_public_relay_v2.py#L361
[pr198]: https://github.com/pahlborn/bis-school-app_src/pull/198
[i185]: https://github.com/pahlborn/bis-school-app_src/issues/185
[i186]: https://github.com/pahlborn/bis-school-app_src/issues/186
[rest]: https://github.com/pahlborn/agentarium/issues/133
[j-h0]: https://github.com/pahlborn/agentarium/issues/2#issuecomment-6769912590
[pilot]: https://github.com/pahlborn/agentarium/issues/2#issuecomment-6778906819
[j-int]: https://github.com/pahlborn/agentarium/issues/2#issuecomment-6892570207
[j-k1]: https://github.com/pahlborn/agentarium/issues/2#issuecomment-6920601641
[j-access]: https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915851697
[j-ops]: https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918439169
[j-ci]: https://github.com/pahlborn/agentarium/issues/2#issuecomment-6894949691

## Anhang B · Vollständiger thematischer Branch-/PR-Schnitt

Quellstände des unabhängigen Branchabgleichs gegen 0cb; spätere Hauptänderungen sind ausschließlich Dokumentation. „Konfliktfrei“ bezeichnet nur das textuelle Zusammenführen. Private K1-Commitobjekte wurden nicht als Remote-Mergebasis ausgegeben. Ein alter gemergter Head kann wegen Squash trotzdem kein Vorfahr sein. Keine dieser Zeilen autorisiert einen Merge.

| PR / Zweig | Head-SHA | PR-Basis; MB mit main | Belegter Stand / Inhaltsbeitrag | Einordnung und Vorschlag |
|---|---|---|---|---|
| 198 · `feature/bq-evaluation-end-to-end-test11` | `f88e82ab013daf6f8a095224af6cd4d7ef0dc880` | Formular192; `dc8427570540` | Draft/offen; 63 exklusive Commits, 56 geänderte Pfade; zwei main-Konflikte | übernommen: EV-1/2/4/5/7 als Ausgangsbasis; begrenzt auf main portieren |
| 196 · `feature/bq-ki-elternintegration-20261113` | `3963108db4f61dd06f73b73440bb78d085815a05` | Formular192; `dc8427570540` | Draft/offen; native Kontobindung plus Gateway; zwei main-Konflikte | teilweise übernommen: nativer Pfad Ziel1; Gateway/Anmeldung Ziel2 |
| 194 · `fix/bq-device-share-link-20261112` | `268ccff87e240fc361bffa36fed61ba7085e0700` | main; `7995d6968e38` | offen; main textuell konfliktfrei; Link/Kopieren plus Release-/Workflowdateien | weiter gültig: EV-1.3/Ziel1; UX gezielt, Versionsänderung gesondert |
| 192 · `feature/bq-evaluation-gemeinsames-formular` | `e6d7ff462d25ef4c561a137b3d4e44ebbc394f7a` | iPad190; `dc8427570540` | Draft/offen; Vorfahr198; Formular, Revisionen, lokaler Pilot; zwei Konflikte | übernommen EV-2/4/7; keine zweite Integration neben198 |
| 190 · `feature/bq-ipad-evaluation-ohne-markieren` | `302967e3fa3bfcc921097a052cdb002168a360a6` | iPad189; `dc8427570540` | Draft/offen; Vorfahr192/198; gerenderter Toddle-Reader | übernommen EV-4.4/5.4; Historie bewahren |
| 189 · `feature/bq-ipad-toddle-bewertungszeile` | `554a22cdd54fd88a128d49e3926c769d6ac8b646` | iPad188; `dc8427570540` | Draft/offen; Vorfahr190/198; Zeilenübernahme | übernommen als Vorstufe; kein eigener neuer Durchstich |
| 188 · `feature/bq-ipad-toddle-einfeld` | `d956f5c763b97f24045a7addb15e3c1a0195d274` | main; `dc8427570540` | Draft/offen; Vorfahr189/198; Swift/Keychain/API-MVP | übernommen als EV-1/5.4-Baustein |
| 187 · `spike/bq-schulbewertung-ki` | `7056f34b5badf0f52217377d5b62104411f21e7d` | main; `dc8427570540` | Draft/offen; separater Adapter/Referenz und Node-Dienst; konfliktfrei | Referenz für EV-5; Dienst Ziel2/M7, nicht komplett nach Ziel1 |
| 180 · `feature/evaluation-eltern` | `dad96f9263668b260aa05800861979d9c545c14b` | main; `dad96f926366` | gemergt; Head ist main-Vorfahr; Einzelbewertung/Korrektur/Rücknahme | erledigt als Bestand; EV-2/7 erweitern, erhalten |
| 182 · `fix/evaluation-live-bau` | `3b153ae96a3e385d528d871a30e8314917298c18` | main; `3b153ae96a3e` | gemergt; Head main-Vorfahr; Release-Regressionskorrektur | erledigt; bestehende Korrekturen erhalten |
| — · `docs/bq-eval-01-ci-01-recovery` | `5e11b6c2928da1c9646ad6190de59234efc8de72` | Abzweig main; `7995d6968e38` | Dokumente/Actions-Rekonstruktion; konfliktfrei | weiter gültig als historische CI-Evidence; kein Produktmerge nötig |
| — · `docs/bq-eval-01-int-01-original-artifacts` | `bd81d6eb5176843ab0c4fbbf0926e72e774220c6` | Abzweig main; `7995d6968e38` | unveränderte Originalarchive/Manifeste; konfliktfrei | weiter gültig als Quelle; nicht als Codeintegration zählen |
| 199 · `claude/konzept-evaluationen` | `fecbb381fff7d776e39ca6da06f8dd03a1cdb88b` | main; `7995d6968e38` | gemergter Konzeptentwurf; alter Head add/add-Konflikt mit fortgeschriebenem Konzept | erledigt als Dokumentlieferung; main maßgeblich, kein erneuter Merge |
| 200 · `claude/konzept-evaluationen-2` | `7118b8ef8cd9d587b0b58ffaa3f44e6eff257bd5` | main; `c216edebf7ae` | gemergte O1–O5-/Quartalsfortschreibung | erledigt als Dokumentlieferung; main maßgeblich, kein erneuter Merge |
| 201 · `claude/ziel1-epics` | `cc8b18f7c6c38205277c935a8a43cfbd3e74ef2d` | main; `1d795b2b94d2` | gemergte Ziel1-Zusammenfassung/EV-Stories | erledigt als Dokumentlieferung; main maßgeblich, kein erneuter Merge |
| 202 · `claude/auftrag-atlas` | `de357d2697d563b924b30cba608d2c94f54078ac` | main; `2d882def51a8` | gemergter Phase-A–D-Auftrag | erledigt als Dokumentlieferung; main maßgeblich, kein erneuter Merge |
| 101 · `claude/dev-auftraege` | `00e8007fcceb218e98a287b3e30f8933ba0d4262` | main; `93d9eac94df1` | gemergte Ausgangsaufträge; alter Head add/add-Konflikt | überholt als Zusammenführungsquelle; Historie erhalten, aktuellen Status berichtigen |
| 102 · `claude/auftrag2-14tage` | `295e9756645c2a9fcbd60576b3e9e578d62fc12b` | main; `44778e55b8db` | gemergter R10-Entscheid; alter Head Inhaltskonflikt | überholt als Zusammenführungsquelle; Historie erhalten, aktuellen Status berichtigen |
| 109 · Auftrag2 / historischer PR-Ref | `7654d9647d0f2307cf8acce75e6180a99f963f91` | main; `92295dadd183` | gemergt; Lückenbalken und 14-Tage-Entfall | erledigt als Implementierung; EV-7-Regression |
| 112 · Auftrag1 / historischer PR-Ref | `83c658a9850094731ae28c10e4ac91a7261b6601` | main; `ed52288113c2` | gemergt; Grundlage für zehn Quests | erledigt als Implementierung; EV-7-Regression |
| 141 · Schulimport / historischer PR-Ref | `e18ee04f467a22fc3882336f5ceecc8633bbeaee` | main; `560aaf675a6b` | gemergt; Werkzeug und school_import | erledigt; Altdatenkompatibilität EV-2.4 bewahren |
| 161 · spike/2026.0005-us1 / historischer PR | `0da5e4c57a7a7aa0c6184bd4e060870e7fddb296` | main; `0da5e4c57a7a` | gemergt; Machbarkeitsstudie/Adapter | erledigte Studie; dateibasierte Erststrategie durch E6/O1 überholt, Befunde behalten |
| privat INT-K1 | `b46246ae13c2d7f86d213926fccbeeffc07101f8` (berichtet) | INT-d26; MB unbekannt | Intake-Baum `2f89d22b…`; zwei K1-Teständerungen | weiter gültige Lieferung; erhalten/selektiv zuordnen, keine Remote-Basis |

## Anhang C · Vollständiger Alt-ID-Index

Jede der 130 wörtlich deklarierten historischen BQ-Task-IDs im geprüften Journalstand ist einzeln aufgeführt. Die Gruppe verweist auf die begründete Disposition in Abschnitt 2. Ein letzter Kommentar kann administrativ sein; er ist kein automatisch fachlicher Endbefund. Administrative/Relay-/Testversuche zählen nicht als zusätzliche Produktlieferungen. Auftrag 1/2, US403, OPS01, ROT und REST sind zusätzlich in Abschnitt 2 erfasst.

| Historische Task-ID | Erster / jüngster Originalkommentar | Disposition aus Abschnitt 2 |
|---|---|---|
| `AG-BQ-ACCESS-20261116-ARCHIBALD` | [J6914924840](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6914924840) | HNA |
| `AG-BQ-ACCESS-20261116-CADENCE` | [J6914775247](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6914775247) / [J6914816841](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6914816841) | HNA |
| `AG-BQ-ACCESS-20261116-EXECUTOR-R2` | [J6915483969](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915483969) | HNA |
| `AG-BQ-ACCESS-20261116-FORGE` | [J6908876472](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6908876472) / [J6908908344](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6908908344) | HNA |
| `AG-BQ-ACCESS-20261116-FORGE-PROOF` | [J6915161972](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915161972) | HNA |
| `AG-BQ-ACCESS-20261116-INTAKE-R2` | [J6912856853](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912856853) / [J6913027565](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6913027565) | HNA |
| `AG-BQ-ACCESS-20261116-INTAKE-R3` | [J6914526949](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6914526949) / [J6914621099](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6914621099) | HNA |
| `AG-BQ-ENV-FIX-20261115-ARCHIBALD` | [J6895074993](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6895074993) | HV |
| `AG-BQ-ENV-FIX-20261115-CADENCE` | [J6895033653](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6895033653) | HV |
| `AG-BQ-ENV-FIX-20261115-DEV` | [J6895146516](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6895146516) / [J6912594363](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912594363) | HV |
| `AG-BQ-ENV-FIX-20261115-DEV-K1` | [J6895297200](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6895297200) / [J6912600008](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912600008) | HV |
| `AG-BQ-ENV-FIX-20261115-DEV-QA` | [J6895230059](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6895230059) / [J6912598201](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912598201) | HV |
| `AG-BQ-ENV-FIX-20261115-DEV-REVIEW` | [J6895228112](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6895228112) / [J6912596346](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912596346) | HV |
| `AG-BQ-ENV-FIX-20261115-E2E` | [J6895416026](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6895416026) | HV |
| `AG-BQ-ENV-FIX-20261115-FORGE` | [J6894957325](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6894957325) / [J6912586631](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912586631) | HV |
| `AG-BQ-ENV-FIX-20261115-FORGE-K1` | [J6895034413](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6895034413) / [J6912590365](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912590365) | HV |
| `AG-BQ-ENV-FIX-20261115-QA` | [J6894963546](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6894963546) / [J6894964367](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6894964367) | HV |
| `AG-BQ-K1-20261116-CADENCE` | [J6919873955](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6919873955) | HNK |
| `AG-BQ-K1-20261116-CORRECTION-R2` | [J6919596950](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6919596950) | HNK |
| `AG-BQ-K1-20261116-CORRECTION-R3` | [J6920004360](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6920004360) | HNK |
| `AG-BQ-K1-20261116-FIXED-MUTATION` | [J6918705393](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918705393) / [J6918805534](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918805534) | HNK |
| `AG-BQ-K1-20261116-SEMANTIC-TESTS` | [J6918321856](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918321856) | HNK |
| `AG-BQ-K1-20261116-V4-CONTRACT` | [J6916869235](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6916869235) / [J6917056505](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917056505) | HNK |
| `AG-BQ-K1-20261116-V4-CONTRACT-R2` | [J6917310892](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917310892) / [J6917436191](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917436191) | HNK |
| `AG-BQ-K1-20261116-V4-HOST-TESTS` | [J6917676323](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917676323) / [J6917892898](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917892898) | HNK |
| `AG-BQ-OPS02-20261116-V2-ARCHIBALD` | [J6915654330](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915654330) / [J6915680077](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915680077) | HO |
| `AG-BQ-OPS02-20261116-V2-CADENCE` | [J6915709501](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915709501) / [J6915736871](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915736871) | HO |
| `AG-BQ-OPS02-20261116-V2-FORGE` | [J6915583153](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915583153) / [J6915608169](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915608169) | HO |
| `AG-BQ-OPS02-GH-V3-ARCHIBALD` | [J6917606608](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917606608) / [J6917631489](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917631489) | HO |
| `AG-BQ-OPS02-GH-V3-CADENCE` | [J6917906140](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917906140) / [J6917933372](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917933372) | HO |
| `AG-BQ-OPS02-GH-V3-FORGE` | [J6917489205](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917489205) / [J6917541915](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917541915) | HO |
| `AG-BQ-OPS02-GH-V3-FORGE-DELTA` | [J6918211838](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918211838) / [J6918254768](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918254768) | HO |
| `BQ-EVAL-01` | [J6765127483](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6765127483) / [J6912474571](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912474571) | H0 |
| `BQ-EVAL-01-ACCESS` | [J6875010972](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6875010972) / [J6912498188](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912498188) | HA |
| `BQ-EVAL-01-CI-01` | [J6894949691](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6894949691) | HC |
| `BQ-EVAL-01-CONT` | [J6874816666](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6874816666) / [J6912496306](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912496306) | HW |
| `BQ-EVAL-01-ENV-FIX-20261115` | [J6894924407](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6894924407) / [J6912510928](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912510928) | HV |
| `BQ-EVAL-01-ENV-FIX-20261115-ARCHIBALD` | [J6895049894](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6895049894) / [J6912592463](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912592463) | HV |
| `BQ-EVAL-01-ENV-FIX-20261115-CADENCE` | [J6895015999](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6895015999) / [J6912588427](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912588427) | HV |
| `BQ-EVAL-01-ENV-FIX-20261115-E2E` | [J6895394547](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6895394547) / [J6912601828](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912601828) | HV |
| `BQ-EVAL-01-EP06` | [J6889047223](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6889047223) / [J6889486988](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6889486988) | HE |
| `BQ-EVAL-01-EP06-01` | [J6889067724](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6889067724) / [J6889253983](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6889253983) | HE |
| `BQ-EVAL-01-EP06-02` | [J6889073695](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6889073695) / [J6889188298](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6889188298) | HE |
| `BQ-EVAL-01-EP06-03` | [J6889073993](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6889073993) / [J6889188502](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6889188502) | HE |
| `BQ-EVAL-01-EP06-04` | [J6889435733](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6889435733) / [J6889435933](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6889435933) | HE |
| `BQ-EVAL-01-EP06-05` | [J6889436080](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6889436080) / [J6889436235](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6889436235) | HE |
| `BQ-EVAL-01-FORM-INTEGRATION` | [J6788361188](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6788361188) / [J6912489089](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912489089) | HF |
| `BQ-EVAL-01-FORM-INTEGRATION-DEV` | [J6788369302](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6788369302) / [J6788369553](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6788369553) | HF |
| `BQ-EVAL-01-INT-01` | [J6892266074](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6892266074) / [J6912503924](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912503924) | HN |
| `BQ-EVAL-01-INT-01-ACCESS-01` | [J6907712234](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6907712234) / [J6915851697](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915851697) | HNA |
| `BQ-EVAL-01-INT-01-ACCESS-01-ARCHIBALD` | [J6914879888](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6914879888) / [J6914927880](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6914927880) | HNA |
| `BQ-EVAL-01-INT-01-ACCESS-01-ARGUS-EXECUTOR` | [J6915212405](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915212405) / [J6915772271](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915772271) | HNA |
| `BQ-EVAL-01-INT-01-ACCESS-01-FORGE-EXECUTOR-R2` | [J6915350180](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915350180) / [J6915485026](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915485026) | HNA |
| `BQ-EVAL-01-INT-01-ACCESS-01-FORGE-PROOF` | [J6915004355](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915004355) / [J6915163015](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915163015) | HNA |
| `BQ-EVAL-01-INT-01-ACCESS-01-FORGE-R3` | [J6914512131](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6914512131) / [J6914513948](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6914513948) | HNA |
| `BQ-EVAL-01-INT-01-ACCESS-01-QA` | [J6907725763](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6907725763) / [J6907767992](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6907767992) | HNA |
| `BQ-EVAL-01-INT-01-ACCESS-01-REVIEW` | [J6907728618](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6907728618) / [J6907769229](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6907769229) | HNA |
| `BQ-EVAL-01-INT-01-ACCESS-01-SENTINEL-EXECUTOR` | [J6915215740](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915215740) / [J6915770458](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915770458) | HNA |
| `BQ-EVAL-01-INT-01-DEV` | [J6892272822](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6892272822) / [J6912564955](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912564955) | HN |
| `BQ-EVAL-01-INT-01-K1` | [J6896214673](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6896214673) / [J6920601641](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6920601641) | HNK |
| `BQ-EVAL-01-INT-01-K1-ARGUS-CANDIDATE` | [J6918587819](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918587819) / [J6918589734](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918589734) | HNK |
| `BQ-EVAL-01-INT-01-K1-ARGUS-CORE` | [J6917483896](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917483896) / [J6917658093](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917658093) | HNK |
| `BQ-EVAL-01-INT-01-K1-ARGUS-FINAL` | [J6920548243](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6920548243) | HNK |
| `BQ-EVAL-01-INT-01-K1-ARGUS-HOST` | [J6917957276](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917957276) / [J6918197800](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918197800) | HNK |
| `BQ-EVAL-01-INT-01-K1-ARGUS-INPUT` | [J6917093891](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917093891) / [J6917197856](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917197856) | HNK |
| `BQ-EVAL-01-INT-01-K1-ARGUS-R2` | [J6919644041](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6919644041) / [J6919972475](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6919972475) | HNK |
| `BQ-EVAL-01-INT-01-K1-ARGUS-R3` | [J6920074480](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6920074480) / [J6920077546](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6920077546) | HNK |
| `BQ-EVAL-01-INT-01-K1-CADENCE-HOST` | [J6919749071](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6919749071) / [J6919975139](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6919975139) | HNK |
| `BQ-EVAL-01-INT-01-K1-FORGE-CONTRACT` | [J6916852858](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6916852858) / [J6917092309](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917092309) | HNK |
| `BQ-EVAL-01-INT-01-K1-FORGE-CONTRACT-R2` | [J6917199790](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917199790) / [J6917481816](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917481816) | HNK |
| `BQ-EVAL-01-INT-01-K1-FORGE-HOST-TESTS` | [J6917660495](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917660495) / [J6917955535](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917955535) | HNK |
| `BQ-EVAL-01-INT-01-K1-FORGE-MUTATION-HOST` | [J6918687996](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918687996) / [J6918690306](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918690306) | HNK |
| `BQ-EVAL-01-INT-01-K1-FORGE-TESTS` | [J6918202409](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918202409) / [J6918329281](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918329281) | HNK |
| `BQ-EVAL-01-INT-01-K1-FORGE-TESTS-R2` | [J6919494589](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6919494589) / [J6919967378](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6919967378) | HNK |
| `BQ-EVAL-01-INT-01-K1-FORGE-TESTS-R3` | [J6919872433](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6919872433) / [J6920007670](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6920007670) | HNK |
| `BQ-EVAL-01-INT-01-K1-SCOUT-SYNC-SOURCES` | [J6918803690](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918803690) / [J6918805761](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918805761) | HNK |
| `BQ-EVAL-01-INT-01-K1-SENTINEL-CANDIDATE` | [J6918592565](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918592565) / [J6918595060](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918595060) | HNK |
| `BQ-EVAL-01-INT-01-K1-SENTINEL-HOST` | [J6917961094](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917961094) / [J6918200078](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918200078) | HNK |
| `BQ-EVAL-01-INT-01-K1-SENTINEL-PRETEST` | [J6916942842](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6916942842) / [J6916944740](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6916944740) | HNK |
| `BQ-EVAL-01-INT-01-K1-SENTINEL-R2` | [J6919621431](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6919621431) / [J6919969906](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6919969906) | HNK |
| `BQ-EVAL-01-INT-01-K1-SENTINEL-R3` | [J6920056483](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6920056483) / [J6920059021](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6920059021) | HNK |
| `BQ-EVAL-01-INT-01-K1-SENTINEL-RED` | [J6920160377](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6920160377) / [J6920545964](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6920545964) | HNK |
| `BQ-EVAL-01-INT-01-PROCESS` | [J6892518789](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6892518789) / [J6912568363](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912568363) | HN |
| `BQ-EVAL-01-INT-01-REVIEW` | [J6892488338](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6892488338) / [J6912566665](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912566665) | HN |
| `BQ-EVAL-01-KI` | [J6774231661](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6774231661) / [J6774235110](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6774235110) | HK |
| `BQ-EVAL-01-KI-BACKLOG` | [J6775745820](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6775745820) / [J6912478112](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912478112) | HK |
| `BQ-EVAL-01-KI-BETRIEB` | [J6776299487](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6776299487) / [J6912481470](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912481470) | HK |
| `BQ-EVAL-01-KI-IPAD-LESEN` | [J6779291752](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6779291752) / [J6912487389](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912487389) | HP |
| `BQ-EVAL-01-KI-IPAD-MVP` | [J6777622719](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6777622719) / [J6912483484](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912483484) | HP |
| `BQ-EVAL-01-KI-IPAD-ZEILE` | [J6778950441](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6778950441) / [J6912485352](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912485352) | HP |
| `BQ-EVAL-01-KI-KONZEPT` | [J6775617240](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6775617240) / [J6912476368](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912476368) | HK |
| `BQ-EVAL-01-KI-US01-US02` | [J6776036821](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6776036821) / [J6912479777](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912479777) | HK |
| `BQ-EVAL-01-KI-US01-US02-QA` | [J6776048218](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6776048218) / [J6912547434](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912547434) | HK |
| `BQ-EVAL-01-OPS-02` | [J6908897460](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6908897460) / [J6918439169](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918439169) | HO |
| `BQ-EVAL-01-OPS-02-ARCHIBALD` | [J6915640959](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915640959) / [J6916001752](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6916001752) | HO |
| `BQ-EVAL-01-OPS-02-ARGUS` | [J6915828546](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915828546) / [J6916006591](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6916006591) | HO |
| `BQ-EVAL-01-OPS-02-CADENCE` | [J6915694974](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915694974) / [J6916004146](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6916004146) | HO |
| `BQ-EVAL-01-OPS-02-DELTA-ARGUS-R1` | [J6918354246](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918354246) / [J6918389625](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918389625) | HO |
| `BQ-EVAL-01-OPS-02-DELTA-SENTINEL-R1` | [J6918357716](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918357716) / [J6918393023](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918393023) | HO |
| `BQ-EVAL-01-OPS-02-FORGE` | [J6915572951](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915572951) / [J6915999482](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915999482) | HO |
| `BQ-EVAL-01-OPS-02-GH-V3-ARCHIBALD` | [J6917588349](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917588349) / [J6918084080](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918084080) | HO |
| `BQ-EVAL-01-OPS-02-GH-V3-ARGUS` | [J6917695163](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917695163) / [J6918089423](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918089423) | HO |
| `BQ-EVAL-01-OPS-02-GH-V3-CADENCE` | [J6917736482](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917736482) / [J6918086778](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918086778) | HO |
| `BQ-EVAL-01-OPS-02-GH-V3-FORGE` | [J6917475179](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917475179) / [J6918081275](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918081275) | HO |
| `BQ-EVAL-01-OPS-02-GH-V3-FORGE-DELTA` | [J6918199636](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918199636) / [J6918202169](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918202169) | HO |
| `BQ-EVAL-01-OPS-02-GH-V3-SENTINEL` | [J6917701011](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6917701011) / [J6918091986](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6918091986) | HO |
| `BQ-EVAL-01-OPS-02-SENTINEL` | [J6915833179](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6915833179) / [J6916009044](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6916009044) | HO |
| `BQ-EVAL-01-QA-3C-PREP` | [J6769421453](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6769421453) / [J6912544010](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912544010) | HQ |
| `BQ-EVAL-01-QA-3C-T07` | [J6769569014](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6769569014) / [J6912545764](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912545764) | HQ |
| `BQ-EVAL-01-QA-MN3` | [J6768387983](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6768387983) / [J6912538729](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912538729) | HQ |
| `BQ-EVAL-01-QA-MN5` | [J6767696712](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6767696712) / [J6912536600](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912536600) | HQ |
| `BQ-EVAL-01-QA-REV` | [J6768642266](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6768642266) / [J6912540513](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912540513) | HQ |
| `BQ-EVAL-01-QA-UPGRADE` | [J6768914386](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6768914386) / [J6912542105](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912542105) | HQ |
| `BQ-EVAL-01-RIGHTS` | [J6879401415](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6879401415) / [J6912500310](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912500310) | HA |
| `BQ-EVAL-01-US202-01` | [J6893061089](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6893061089) / [J6912507288](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912507288) | HU |
| `BQ-EVAL-01-US202-01-DEV` | [J6893062054](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6893062054) / [J6912577389](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912577389) | HU |
| `BQ-EVAL-01-US202-01-K1` | [J6894149126](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6894149126) / [J6912508941](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912508941) | HU |
| `BQ-EVAL-01-US202-01-K1-DEV` | [J6894150264](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6894150264) / [J6912583210](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912583210) | HU |
| `BQ-EVAL-01-US202-01-K1-QA` | [J6894152206](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6894152206) / [J6912585017](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912585017) | HU |
| `BQ-EVAL-01-US202-01-QA` | [J6893063823](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6893063823) / [J6912579171](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912579171) | HU |
| `BQ-EVAL-01-WEB-FORM` | [J6874441772](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6874441772) / [J6912494587](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912494587) | HW |
| `BQ-I-EP-01` | [J6873949673](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6873949673) / [J6912490827](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912490827) | HI |
| `BQ-I-EP-01-ARCH` | [J6873951167](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6873951167) / [J6912549208](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912549208) | HI |
| `BQ-I-EP-01-KONZEPT` | [J6874282529](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6874282529) / [J6912492852](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912492852) | HI |
| `BQ-I-EP-01-PROCESS` | [J6873951890](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6873951890) / [J6912553415](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912553415) | HI |
| `BQ-I-EP-01-QA` | [J6873953085](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6873953085) / [J6912559395](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912559395) | HI |
| `BQ-I-EP-01-RESEARCH` | [J6873952294](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6873952294) / [J6912555465](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912555465) | HI |
| `BQ-I-EP-01-SEC` | [J6873969688](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6873969688) / [J6912561264](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912561264) | HI-SEC |
| `BQ-I-EP-01-SPEC` | [J6873951530](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6873951530) / [J6912551275](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912551275) | HI |
| `BQ-I-EP-01-UX` | [J6873952682](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6873952682) / [J6912557448](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6912557448) | HI |
