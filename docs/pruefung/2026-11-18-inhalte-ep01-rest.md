# EP01 Rest · Entwicklung und Nachweise

Stand 18.11.2026. Nativer Codex-Entwickler `dev_content_ep01_codex`, keine Forge-/Claude-Ausführung. Auftrag `BQ-CONTENT-01-EP01-REST-CODEX-20261118`; Basis `3339da427b423d1353b7c83090728c157fc9a9a5`; Zweig `feature/content-ep01-rest-20261118`. Modelluntervariante/Kosten unbekannt. Keine Veröffentlichung, kein Push, PR, Merge oder Deploy durch den Worker.

## Ergebnis und genaue Bindung

Die 24 verbleibenden statischen Sammlungen und die verbleibenden nicht-grundlegenden MC-Generatorfamilien sind bearbeitet. Der eigene aktuelle Inhaltsaudit besteht für **25 statische Sammlungen/230 Antwortfälle** einschließlich des bereits angenommenen ROUND_MC sowie **68 Generatorzweige aus 56 benannten Konsumenten**. Unbekannte Banken, unbekannte Konsumstellen, ungedeckte aktuelle Konsumenten, geschützte Quelldifferenzen und Fehler der eigenen, vom App-Antwortindex unabhängigen Oracles sind jeweils leer. Kein Generator wird nur wegen seines Namens als erledigt eingestuft. Das ist ein eigener Entwicklungsnachweis, noch keine unabhängige EP01-Abnahme oder finale Full-CI.

Eingefrorener Code-/Teststand: **`63ca57327808a53684d92b663e4ab6787b45b89f`**, Tree **`9a99966c48d683f338e50cfa8ae88356284597c6`**. Er ergänzt den ersten Generatorstand `cbb3711f2b4c3fb1518d9d98348c2310e333925e` ausschließlich um den unten benannten Umrechnungsvergleich und seine gezielten Nachweise. Dieser Bericht wird anschließend in einem reinen Doc-Commit ergänzt; App-/Testbytes werden dabei nicht verändert.

Verbindliche Eingaben waren die vollständigen Produktbeschlüsse `docs/konzept/inhalt-motivation-entscheidungen.md`, `docs/konzept/inhalte-ep01-auftrag.md` und der begrenzte Auftrag. Kritische Annahme: Reale Fehlkonzepte lassen sich in den bestehenden Fragen und der bestehenden Modul-Pipeline ausdrücken, ohne Grundlage, Datenhaltung oder globale Antworthelfer umzubauen. Nachweis zuerst durch reine Auslagerung, dann statischen Inhaltsstand und erst danach echte Generator-/App-Pfade. Atlas übernimmt die Integration des zwischenzeitlich geänderten main sowie unabhängige QA und finale CI. Keine eigene Merge-Aktion.

## Änderungen und fachliche Gegenbeispiele

Die 19 zuvor eingebetteten Banken liegen in `src/module/aufgabenbanken.mjs`. Die übrigen fünf Textsammlungen bleiben in `textfragen.mjs`; PREFIX, HYPO und OPFACT benötigen keine pauschale Neufassung. Vollständige Stufe-1-Zeilen bleiben erhalten. Nur vier nicht-grundlegende Textformulierungen wurden eng gekürzt: Swimming-Beispiel, Cat-Begründung, Swimming-Begründung und persuasive Wörter. NOW/POE/SCH behalten ihre gemeinsam verwendeten Zeilenidentitäten.

Falschantworten verwenden nahe Begriffe, umgekehrte Wirkungen, falsche Kontrollvariablen, ausgelassene Teilschritte und unvollständige Begründungen. Beispiele: Friction „Rubbing that slows things down“ gegenüber „Rubbing that speeds things up“; Inferenz „Ben came first“ gegenüber „Ben came last“; Hilfe ohne Rückmeldung gegenüber Hilfe mit Rückmeldung; Zahl ohne Einheit gegenüber vollständiger Messangabe. Kein sprachliches Aufpolstern, keine neuen Klassenereignisse, kein neuer Humor. Ein Zeilenregister steht im Auftragsarbeitsverzeichnis unter `dev/static-review.json`.

Zwei statische Aufgaben wurden wegen konkreter Mehrdeutigkeit enger formuliert: Die Videoquelle ist für kurze animierte Erklärfilme bekannt; die Rampenfrage hält das Auto ausdrücklich gleich und untersucht die Steilheit. Bestehende Fach-/Klassenfakten stammen aus der gebundenen Basis; zusätzliche externe Sachrecherche wird nicht behauptet.

Die direkt zugehörigen reinen Generatoren liegen jetzt in `zahlenfragen.mjs` und `sprachfragen.mjs`; das bestehende Manifest bindet sie ein. Die Factory liefert Funktionen, die bisherigen Builder und ihre `withLevel`-Bindungen bleiben in `index.html`. Drei numerische Datenmodelle (`barData`, `travelData`, `wpSetup`) sind keine eigenen MC-Sammlungen. Globales `mc`, `two`, `fill3`, Einstufung, Belohnung, Speicherung und `qId` bleiben unverändert. Der akzeptierte AR-01-Identitätsguard bleibt unverändert; nur die normale Konsumstelleninventur wurde nach der Auslagerung aktualisiert, alle benannten Regressionen bleiben bestehen.

| Familie / Änderung | Ernsthafter naher Fehler und eindeutige Lösung |
|---|---|
| AM/PM | Vier vollständige Uhrzeiten: 7:30 AM / 7:30 PM / 7:00 AM / 7:00 PM. Perioden-, Minuten- und kombinierter Fehler; die Frage verlangt die ganze Uhrzeit. 12:30 Lunch bleibt PM. |
| Odd/even | Eine Zahl der gefragten Parität gegenüber drei nahen Zahlen der anderen Parität; keine erfundene dritte Parität. |
| Einheiten / Messwerte | Gleiche Messgröße mit falscher Einheit bleibt der zentrale Fehler. Weitere Optionen sind echte andere Messgrößen. MassRecord unterscheidet Zahl ohne Einheit, cm und kg. |
| Tabellen / Reasonable | Vier sachliche Aussagen mit vertauschter Wirkung oder falsch gelesenem Ergebnis; bei Schätzung falsche Ja/Nein-Folgerung oder falscher Abstand. Travel behält einen benachbarten Zeilenfehler. |
| Zwischen Hundertern | „Neighbouring hundreds“ statt beliebigem einschließendem Intervall: Für 147 enthielt die alte breite Frage sowohl 100/200 als auch 100/300. |
| Arithmetik / Darstellung | Ein lokaler numerischer Kandidatenhelfer erhält eine passende erste Fehlrechnung und drei verschiedene nichtnegative Ganzzahlen. Split behält die Anzahl der Summanden; CalcCheck bietet gleichartige echte Prüfaussagen. |
| Brüche | Shaded vergleicht Werte kreuzweise: Die alte 1/2-Aufgabe bot 1/1 und 2/2 gemeinsam an. UnitCompare verwendet vier echte Einheitsbrüche; nur einer ist der größte. |
| Variable / Packing / Fläche | Vier echte Rollen, Handlungspläne beziehungsweise Messkategorien. Variable/Control-Ziel und ursprüngliche Packliste bleiben erhalten; keine neuen Mengen erfunden. |
| Großschreibung / Satzzeichen | Vollständige gleich lange Sätze verhindern den Eigennamen-Längenhinweis; eine zuvor doppelte CapitalFix-Alternative wird verschieden. Explizite Vorlesestimme macht die Satzzeichenfrage eindeutig. |
| Specific examples | Stufe 1 bleibt das alte Paar. Stufe 2 fragt nach Person, Tätigkeit und beobachtbaren Einzelheiten; Stufe 3 nach einem konkreten Ereignis. Falsche Beispiele verallgemeinern oder lassen genau verlangte Angaben aus. |
| Trennbare Verben | Dritter Fehler: Präfix getrennt, aber finite Verbposition falsch. Gleiche Wortzahl; keine bedeutungslose Zusatzantwort. |

### Tatsächlich fehlgeschlagener statischer Prüfstand

Statischer Zwischencommit `68edad04b1fc70e407ff42694f6ddc947b7ad6fb`, Tree `9c016ddb2ef028b902c6c06292158d265fc32cb6`, bestand die eigenen Längentests, wurde jedoch von Sentinel in `qa/static-checkpoint.md` **inhaltlich abgelehnt**: NOW_MC „Which of these is also by Roald Dahl?“ hatte The BFG richtig und Matilda falsch. Beide sind von Dahl; POE_MC teilt diese Zeile. Das war ein eingeführter Inhaltsfehler. Die falsche Alternative ist jetzt **Heidi**. Eine eigene Regression rekonstruiert den abgelehnten Commit mit zwei Dahl-Titeln und verlangt im aktuellen NOW/POE genau einen. Atlas meldete die unabhängige Bestätigung dieser Korrektur; endgültige QA bleibt separat.

Sentinel inspizierte am statischen Zwischenstand sämtliche übrigen Reihen und bestätigte alle 25/230 Längenwerte. Ihre 14 Schutzgruppen waren basisgleich: 728 erzeugte geschützte Fragen, 19 rohe Stufe-1-Zeilen, 99 Brückenquellen und 570 feste Hilfe-Eingaben. Das sind ihre unabhängigen Ausführungszahlen, nicht unsere 69.713 Snapshotfälle. SPECIFIC hatte im alten tatsächlichen Paar in 4/6 Fällen die strikt kürzeste Lösung; die vier fachlichen Optionen im aktuellen Generator beheben den benannten Hinweis. Kein neuer globaler Kürzest-Guard wurde eingeführt.

### Eng begrenzte halfwayQ-Korrektur und Hilfe

Der alte Generator hatte zwei gleichwahrscheinliche Zweige: numerische Mitte mit vier Optionen und Richtung mit zwei Optionen. Gewichteter Längstanteil daher **(1/4 + 1/2)/2 = 3/8 = 37,5 %**; vollständig belegt durch 32 numerische und 64 Richtungszustände in `rounding-open-proof.mjs/.json`. Nur diese offene Familie wurde nach Meldung an Atlas geändert. Der frühere Richtungszweig fragt jetzt ausdrücklich nach dem Rundungsergebnis auf den nächsten Hunderter und bietet vier echte Zahlen: richtigen Nachbarn, anderen Nachbarn, ursprüngliche Zahl und Mitte. Nachbar-/Mittelpunktsmodell, Visual und Erklärung bleiben erhalten; beide Zweige liegen bei 1/4.

Der Formwechsel benötigte eine enge Hilfe-Kompatibilitätskorrektur: Das alte Beispiel lautet „130 is between 100 and 200. The halfway point is 150. So 130…“ mit Antwort „rounds down to 100“. Bei einer alten Aufgabe mit genau dieser Antwort unterdrückte `exampleFor` das Beispiel durch seinen bestehenden Gleichheitsfilter. Die neue numerische Antwort **100** würde ohne Anpassung diesen Filter umgehen und dieselbe Lösung zeigen. Nur der zugehörige Matcher liefert für numerische 100 ebenfalls numerische 100; der vorhandene Filter unterdrückt das Beispiel wieder. Alle sonst angezeigten alten Beispielkörper bleiben identisch. **Alle 64 alten/neuen Richtungsfälle** wurden nach dieser letzten Änderung separat auf identische Verfügbarkeit und identischen Beispielkörper geprüft. Die vorherigen 56 grünen Checks sind zeitlich getrennte Evidenz.

### QA-Befund nach cbb3711: Umrechnungsvergleich

Sentinel belegte in `qa/convert-shortest.json` auf `cbb3711` einen geerbten Hinweis: Alle sechs Fälle 70–95 cm gegenüber 1 m hatten immer „1 m“ richtig, strikt am kürzesten und unvermischt an Position 2. Der Längstwert 0 % hatte diesen **100-%-Kürzest-/Positionshinweis** nicht erkannt. Der erste gezielte Fix dieser Familie ist im aktuellen Codecommit enthalten.

Nur `convertQ/v3` fragt nun „Compare lengths: 70 cm ___ 1 m. Which sign is correct?“ mit beiden Seitenreihenfolgen. Die drei echten Beziehungen `<`, `=` und `>` sind gleichformatig und werden durch vorhandenes `mc` gemischt. Falsche Größenrelation nach ignorierter Einheit oder Gleichsetzung sind ernsthafte Fehler. Dieselben sechs Ausgangslängen, dieselbe Umrechnungskompetenz und Erklärung bleiben erhalten. Der Legacy-Hilfematcher bleibt unverändert; der neue Prompt erhält exakt das alte Gegenbeispiel 150 cm / 1 m. Alle **72 Fälle = 6 Längen × 2 Seiten × 6 Shuffle-Permutationen** haben genau eine numerisch unabhängig bestimmte Lösung; alle drei Lösungspositionen und beide Ungleichungsrichtungen treten auf. Strikt längste/kürzeste Anteile sind 0, beide gewichteten Gleichstandsanteile 1/3. Alle **43 Fälle der drei anderen Umrechnungszweige** einschließlich qId und Hilfe stimmen mit cbb3711 exakt überein.

Atlas meldete anschließend Sentinels unabhängige Schließung dieses Befunds auf `63ca573`: 72 korrekte Zeichen-/Positionsvarianten, 72 erhaltene alte Beispiele, 43 andere Konvertierungen einschließlich qId/Hilfe identisch, echte Science→Units-Runde 8/8, Portrait-/Landscape-Zeichentouch und Audit 25/68 grün; keine weiteren bestätigten Pflichtbefunde. Das sind gemeldete unabhängige QA-Ergebnisse, keine zusätzlichen eigenen Testläufe. Ihr früherer Maths-/Science-Routenfehler im QA-Harness bleibt als ungültiges Setup erhalten, kein belegter Produktfehler. Der vollständige unabhängige Bericht `qa/QA_REPORT.md` wird noch finalisiert; seine Gesamtfreigabe und die Integrations-CI werden hier nicht vorweggenommen.

## Metrik und vollständige Verhaltensklassen

Gemessen werden sichtbare Unicode-Zeichen nach HTML-/Entity-Auflösung mit `Array.from(text(option)).length`. „Strikt längste richtig“ zählt nur eine allein längste Lösung. Bei einem Gleichstand von k längsten Optionen trägt die richtige Antwort **1/k** bei, sonst 0. Beide Sammlungsanteile müssen ≤ 1/3 sein; 1e-12 ist nur Rechentoleranz. Vier gleich lange Zahlen ergeben 1/4, drei gleich lange Vergleichszeichen 1/3. Gleichstand wird nicht als voller Treffer oder unsichtbarer Fall behandelt. Stufe 1 ist explizit ausgenommen und separat identisch geschützt. Reine Quellenpaare wie SPECIFIC werden zusätzlich inventarisiert; tatsächlich angebotene Generatoroptionen werden gesondert geprüft.

`tests/module/ep01-generator-cases.mjs` prüft konkrete Antworten gegen eigene Zahlen-/Sprachmodelle, nicht gegen den App-Antwortindex. Der Index wird danach mit der unabhängig eindeutigen Lösungsmenge verglichen. `ep01-consumer-coverage.mjs` bindet jede aktuelle Konsumstelle und jeden tatsächlich zurückgegebenen Factory-Konsumenten an diese Evidenz, geschützte Quellen oder geprüfte Poolzusammensetzung. Neue/unbekannte Konsumenten bleiben offen. Der Audit protokolliert alle 68 Zweige mit konkreten Fallzahlen, Metriken und Domänen.

| Vollständige Gruppe | Deterministische Abdeckung / Begründung |
|---|---|
| clockRead, clockPick, ampm, laterQ | 288 Uhr-/Formatfälle mit geometrisch dekodierten SVG-Zeigern; 144 Zeigerauswahlen; alle 12 AM/PM-Situationen; alle 720 Zeiten/Dauern einschließlich 12→1 und Minutenübertrag. |
| numberLine, placeValue, expandedZeroQ, oddEven, mental | 640 Sprungfälle; 24.057 eindeutige Stellenwertziffern; 1.280 Reihenfolge-/Kollisions-/Breitenklassen; alle 9.000 vierstelligen Zusammensetzungen; 51.000 Stellenwertänderungen; 1.458 Nullplatzhalter-MC-Zustände plus Tippformen; alle 9.990 Paritätszahlen und 4.000 Kopfrechenfälle. |
| unitPickQ, convertQ, rulerQ, massRecordQ, massUnitQ, kitchenScaleQ | Alle 706 Item-/Wertpaare; 1 Definition + 4 Meterwerte + 38 Mischwerte + 12 Längen-/Seitenfälle; alle 17 Linealmarken, 110 Messwerte, 8 Einheitenlagen und 5 Küchenmarken. Vergleich zusätzlich alle 72 Positionspermutationen. |
| barReadQ, frictionTableQ, barMissingQ, tableConclusionQ, scaleStepQ, lineGraphQ | Alle 360 geordneten Vierer-Labels × Zielposition × min/max; 40 Wert-/Zeilenfälle; 4 fehlende Elemente; 720 Label-/Rangordnungen; 15 Skalenmarken; sämtliche 5^5 Temperaturvektoren mit ursprünglich verlangten eindeutigen Extrema, daraus 1.840 Tages- und 4.600 Wertfragen. |
| combosQ, anotherWayQ, splitQ, stickerComboQ, arrayQ | Alle 6 ursprünglichen Kombinationssets und 3 anderen Zerlegungen, alle 3 Splitfälle, alle 140 ersten Sticker-Summanden, alle 16 Zeilen-/Spaltenarrays. Unabhängige Summen-/Produktprüfung. |
| reasonableQ, travelTableQ, estimateTotalQ, betweenHundredsQ, roundTenAddQ | Alle durch 784² Quellenpaare erreichbaren exakten/gerundeten Summenzustände × 5 gezeigte Summenklassen (15.245 Fälle); alle 10 Zielzeilen-/Extremfälle; alle 84 Wertetripel; alle 784 erlaubten Nachbarhunderterwerte; alle 21 erreichbaren gerundeten Dreiersummen. |
| compareQ, findTotalQ, operationQ, calcCheckQ | Ordnungs-, Breiten-, Rand- und Kollisionsklassen; positive Rest-/Inverse-Arithmetik beweist die übrigen Fälle. CalcCheck prüft alle 105 Verdict-Arithmetikfälle einschließlich aller vier Fehlerabstände; für die Länge gelten die **zwei gleichwahrscheinlichen** unveränderlichen sichtbaren Antwortklassen „match/differ“. Jede erneute Klasse muss ihre vollständigen sortierten Optionen und Lösung exakt wiederholen. |
| shadedQ, unitCompareQ, areaWhichQ | Alle 18 Brüche mit kreuzweisem Vergleich jedes Optionspaares, alle 12 geordneten Nennerpaare, alle 6 Innen-/Randlagen. |
| varCtrlQ, oreoMC, opinionFact, sentenceType, affixQ, inferenceQ, sourceQ, packQ | Sämtliche kanonischen Nicht-Grundlagenzeilen, beide Fact/Opinion-Fragerichtungen, alle 12 Satzrollen, beide Affixbanken, alle 7 Inferenzen, 6 Quellenlagen, 12 unveränderte Packlistenfakten. |
| capitalFixQ, properNounQ, endMarkQ, specificExampleQ, trennbarQ, zusammenQ | Alle 113 Großschreibungsvarianten und 19 Eigennamenziele; alle 10 Satz-/Stimmenpaare; alle 6 nicht-grundlegenden spezifischen Beispiele; alle 6 trennbaren Verben und 8 gerichteten Komposita. |
| addendsQ, halfwayQ, roundedQuestion, bridgeFor | Addends unverändert: alle 5.190 Ziel-/Summanden-/Dreierkandidatenzustände; Halfway 32 Mitte + 64 Rundung; geteiltes Round 11.103 und Benchmark 22.206 step/10-Positionen bis 10.000 einschließlich Null/exakter Vielfacher; 12 Stellenwert-Brückenrückgaben. |

Bei Labelantworten bestimmen Labelposition und Rang die Lösung, nicht die konkrete Entfernung; bei Summen bestimmen erreichbare Ergebnisse die angebotenen Optionen, nicht die Reihenfolge der Summanden. Bei placeValue/compare sichern mindestens drei vierstellige Optionen die punktweise Längengrenze, auch bei Kollisionsersatz. Positive Operanden und Reste trennen richtige und falsche Rechenoperationen algebraisch. Die konkreten Rand-/Kollisionsvertreter und Invarianten stehen direkt bei den Testschleifen. Diese begrenzten Annahmen bleiben unabhängig prüfbar; kein blindes vollständiges Kreuzprodukt wird behauptet.

Alle 25 statischen und 68 generierten Werte sind im aktuellen `convert-audit.log` grün. Beispiele gewichteter Längstanteile: placeValue/compose 33,2648 %, unitPickQ 28,4230 %, neuer Umrechnungsvergleich 33,3333 %, actual specificExampleQ 5,5556 %, beide halfwayQ-Zweige 25 %. Kein stilles Grandfathering offener Generatoren. Sieben bereits angenommene Rounding-Familien werden durch bestehende endliche Tests und exakte Quellenkorrelation geschützt; acht Grundlagenkonsumenten, drei gemeinsame Konstruktoren und 16 Poolkonsumenten werden mit ihrem jeweiligen tatsächlichen Nachweis genannt. Word of the Day und Trivia sind ausdrücklich außerhalb EP01.

## Auslagerung, Grundlage, Hilfe und IDs

Vor jeder Inhaltsänderungsstufe wurden die reinen Auslagerungen verglichen. Beide Prüfungen umfassen je **4.000 echte Builder-Fragen** einschließlich qId und Levelbindung; vorher/nachher jeweils identisch:

| Reine Auslagerung | Frage-JSON SHA256 | ID-JSON SHA256 |
|---|---|---|
| Statische Banken | `438c28603f8bf3f30a19f8da9f151e05c559b1f126a4a285e0b726542bfb1734` | `8b0f0b39275f19452fa12f6661c5d42ff7e5bf5528e2854a9f46af22bb3d0113` |
| Numerische/sprachliche Factorys, vor Antwortrevision | `871603a63357e97d097982db9899ef9aac43df20fd423dee2accfeb86c4c8f30` | `6803bf1bdcf4c32e0750d40e79c56db16c662cc024bc4d3f4dcbf71c635cd36a` |

Der vor Änderungen gesicherte Grundlagen-/Hilfe-Snapshot enthält **69.713 Fälle**, SHA256 **`aab00e3fbad1e9eede3022f366f70fd030297aaa30d73a2a9dc4831029a4468b`**. Die aktuelle App und die aus Basiscommit mit dessen Originalmanifest/Originalmodulen gebaute App stimmen überein; nach dem Umrechnungsfix nochmals gezielt bestätigt. Die Fixture umfasst echte Fragen, qId und `exampleFor`, numerische Grundlage, geteilte Rundungswege, nearestHundred/benchmark, MissingPart, Text-Grundlagen und Brücken. OPFACT/SPECIFIC und sämtliche Stufe-1-Bankzeilen werden zusätzlich direkt verglichen. Alle zwölf tatsächlichen AM/PM-Hilfewege bleiben identisch: etwa Breakfast 7:30 AM → Dinner 6:00 PM und Bedtime 8:00 PM → Breakfast 7:00 AM.

Die frühere Ganzdateiprüfung des Rounding-Moduls schützt weiterhin **alle Bytes außer der ausdrücklich benannten halfwayQ-Funktion**. Der Rounding-Builder bleibt vollständig bytegleich; halfwayQ hat eigene Zahlen-/Modell-/Hilfeprüfungen. Der Schutz wurde nicht pauschal entfernt. Globales `guidance`, `exampleFor`, `bridgeFor`, `roundedQuestion` und die Antwort-/ID-/Zufallshelfer sind quellengleich. Nur die eng beschriebenen Matcher für neue Paritäts-, halfway- und Vergleichsformate ändern zugehörige Beispieldatenpfade; die geschützten alten Wege bleiben identisch.

Inhaltlich geänderte nicht-grundlegende Fragen/Alternativen erhalten weiterhin vorhandene **inhaltsabgeleitete qId**. Das betrifft die oben benannten überarbeiteten Banken und Generatoren einschließlich Dahl-/SPECIFIC-/halfway-/Umrechnungsdelta. Unveränderte reine Auslagerung und sämtliche Grundlagen behalten ihre IDs. Keine Stable-ID-Migration oder Änderung der Datenhaltung. Die bestehende Neutralisierung alter gespeicherter Fragen wurde browserseitig mitgeprüft.

## Tatsächlich ausgeführte eigene Prüfungen

Rohlogs unter `/workspace/work/bq-content/ep01-rest/dev/`; große Rohdateien sind nicht ins Produkt kopiert. Pinned Playwright 1.56.1 wurde ohne package-/Lockfileänderung installiert; Node v24.22.1. Browserpfad **`/usr/bin/chromium`**, mit `CHROMIUM_PATH` explizit gesetzt. Keine lokale Vollsuite in diesem Restauftrag.

| Zeitpunkt / Befehl | Tatsächliches Ergebnis | Log |
|---|---|---|
| Statischer Stand: Rest-/Text-/Rounding-/Guardtests | 33/33, Exit 0 | `static-targeted.log` |
| Statischer Stand: Aufgaben-/Runden-/Beispieltests Node | 6/6, Exit 0 | `static-app-node.log` |
| Statischer Stand: Fach-Quests, Practise Today, Rounding 8/8 und Hilfe | 3/3, Exit 0 | `static-browser.log` |
| Alte echte statische Basis als Rotkontrolle | Exit 1; 20 alte Längenverstöße erkannt | `static-red-old.log` |
| `node --test tests/module/ep01-rest.test.mjs tests/module/ep01-generatoren.test.mjs tests/module/rundungsfragen.test.mjs tests/module/textfragen.test.mjs` | 36/36, Exit 0, 18,443 s | `final-targeted-node.log` |
| `node --test tests/aufgaben-node.test.mjs tests/aufgaben-anpassung.test.mjs` | 7/7, Exit 0, 31,580 s | `final-app-node.log` |
| `CHROMIUM_PATH=/usr/bin/chromium node --test tests/fragen.test.mjs tests/themen.test.mjs tests/neutral.test.mjs` | 13/13, Exit 0, 21,630 s; echte sechs Rest-Questkarten mit Hilfe und 8/8, Themen, gespeicherte Altfragen | `final-browser.log` |
| `BQ_EP01_GENERATOR_CONTROL=old-ampm node --test tests/module/ep01-generatoren.test.mjs` | Erwartet Exit 1; echte zwölf alte binäre Fälle mit gewichtetem Längstanteil 1/2 | `generator-red-old-ampm.log` |
| `node tests/module/ep01-audit.mjs`, vor letzter halfway-Hilfekorrektur | PASS, Exit 0; 25 Banken/68 Zweige | `final-audit.log` |
| `node --test --test-name-pattern='revised numeric halfwayQ' tests/module/ep01-rest.test.mjs` | Danach separat 1/1, Exit 0, 0,359 s; alle 64 alten/neuen Hilfefälle | `halfway-help-compat.log` |
| Nach Convert-QA: gezielter Vergleichs-/Grundlagenbefehl unten | 2/2, Exit 0, 7,468 s; 72 Vergleiche, 43 andere Konvertierungen, 69.713 geschützte Fälle | `convert-compat.log` |
| `node --test tests/module/ep01-generatoren.test.mjs` | 2/2, Exit 0, 3,087 s; aktuelle Zahlen-/Inhaltsoracles | `convert-generator.log` |
| `node tests/module/ep01-audit.mjs` | Aktueller vollständiger Inhaltsaudit PASS, Exit 0 | `convert-audit.log` |
| `CHROMIUM_PATH=/usr/bin/chromium node --test --test-name-pattern='EP01 remaining content' tests/fragen.test.mjs` | 1/1, Exit 0, 3,151 s; reale sechs Karten inkl Units, Hilfe und 8/8 | `convert-browser.log` |

Genauer Vergleichs-/Grundlagenbefehl:

```sh
node --test --test-name-pattern='unit comparison|foundation/help remains' tests/module/ep01-rest.test.mjs
```

In sämtlichen grünen Testläufen oben: 0 Fehler, 0 abgebrochen, 0 übersprungen. Die **56 Checks** aus den drei finalen Dateiengruppen gingen der letzten halfway-Hilfeanpassung voraus. Die gesonderte 64-Fall-Prüfung folgte; danach kam das konkret begründete Convert-Delta mit seinen eigenen Checks. Kein erfundener einheitlicher Volllauf. `git diff --check` war beim Code-Freeze grün.

Frühere Fehler bleiben erhalten: `generator-quality-1.log` scheiterte am VM-/Host-Arrayprototyp eines eigenen Oracles (gleicher Wert `[2]`, ungültiger Deep-Vergleich), vor belastbarer Qualitätsbewertung behoben. `generator-quality-2.log` zeigte unitPickQ 42,6346 % gewichtet und CalcCheck-Verdict 40 %. UnitPick wurde fachlich auf echte dimensionsverschiedene Alternativen korrigiert. Bei Verdict hatte die Testzählung vier falsche Offsets gegen einen richtigen Fall übergewichtet; die zwei tatsächlich gleichwahrscheinlichen unveränderlichen Antwortklassen werden korrekt gewichtet, während alle 105 Arithmetikfälle weiter geprüft werden. `generator-quality-3.log` wurde grün. Unabhängiger Dahl-FAIL und späterer Convert-FAIL bleiben oben dokumentiert; grüne Längenwerte waren dafür kein Inhaltsnachweis.

Historische Evidenz aus dem vorangegangenen ersten EP01-Schnitt bleibt getrennt: Vollsuite auf `4162118` **998/999, Exit 1**, korrigierte Browserdatei auf `7051925` **5/5, Exit 0, 220,196 s**. Keine frische 999/999-Evidenz für diesen Stand.

## Umfang und verbleibende Grenzen

Geändert sind `index.html`, drei neue kohärente Module samt Manifest, eng `textfragen.mjs` und `rundungsfragen.mjs`, fokussierte Qualitäts-/Konsumstellen-/Fixturetests, zwei direkt betroffene bestehende Testdateien und dieser Bericht. Keine neuen Dienste, Workflows, Abhängigkeiten, Produkt-APIs oder Speicherarchitektur. `index.html` sinkt von **7.714 Zeilen / 755.761 Bytes** auf **7.201 / 686.832**. Die neuen Module haben 213/37.362, 369/29.794 und 158/12.085 Zeilen/Bytes. Die zusammengesetzte Live-App wächst durch fachliche Optionen und Module von **918.602 auf 928.849 Bytes**; der `<body>`-Inhalt von **877.248 auf 887.495 Bytes**. Keine behauptete Bundle-Einsparung.

Keine bekannte inhaltliche Restfamilie ist im eigenen Audit offen. Sprachliche Präzision und fachliche Nähe brauchen unabhängiges Inhaltsurteil; die begründeten endlichen Verhaltensklassen und ihre Invarianten bleiben überprüfbar. Endgültige unabhängige QA des nach dem Umrechnungsbefund eingefrorenen Stands, Integration des neuen main durch Atlas und **Full-CI auf dem tatsächlichen finalen PR-Head** stehen aus. Frühere PR226-CI und eigene Teilprüfungen ersetzen diese Abnahme nicht. EP02–EP05 und Relay-/Governancearbeit gehören nicht zu diesem Ergebnis.
