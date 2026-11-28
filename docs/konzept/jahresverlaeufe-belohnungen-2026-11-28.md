# Drei beispielhafte Jahresverläufe für Big Quest

28.11.2026 · **Diskussionsvorlage für 0.160-Beta, keine Regeländerung.**

Auftrag: drei Jahresbeispiele mit pädagogischen Quellen, anhand der vorhandenen Sterne, Titel, Abzeichen und des Wissensbaums. Ausgangsstand: `main` **238f372c788a45aa7add00c2365d23a8d9ff4741**. Atlas erstellt Beispiele und Rechnung; eine tatsächliche Codex-Vertretung als **Scout** recherchierte die Quellen. Keine echten Kinder- oder Kontodaten.

**Professor als Endstufe ist nicht beschlossen.** Ebenso wenig sind weitere Titel oder neue Schwellen beschlossen. Peters Einwände waren Diskussionsbeiträge. Die laufende 0.152-Beta bleibt unverändert; diese Vorlage bereitet Entscheidungen für Fahrplan-Paket 4 vor.

## 1. Was gerechnet wird und was offenbleibt

Die Beispiele sind **erfundene mögliche Verläufe**, keine Prognosen für einzelne Kinder. Angenommene Antworten, Hilfe, Schulergebnisse und Lernstände sind Eingaben. Aus einer Aufgabenmenge wird kein Lernerfolg errechnet. Die Forschung liefert Leitgedanken, keine individuellen Lernkurven oder optimalen Belohnungszahlen.

- Rechenhorizont: 36 Schulwochen, dargestellt in vier Abschnitten zu neun Wochen. Das ist keine Anwesenheitspflicht und kein Freischaltkalender.
- Eine Übungseinheit enthält hier acht Aufgaben: entweder eine digitale Runde oder ein vollständig bearbeitetes und einmal erfasstes Übungsblatt. Papier ersetzt digitale Bearbeitung; es wird nicht zusätzlich aufgeschlagen. Zweite Versuche sind keine zusätzlichen Aufgaben in dieser Zählung.
- Ausschließlich für das Rechenbeispiel nehmen wir **40 künftig geeignete Quests** an: 25 Mathematik, 5 Science, 5 English, 2 Deutsch, 3 Reading. Diese Aufteilung ist keine geprüfte Jahresstoffliste und kein Auftrag zur Umsetzung. Besonders die übrigen Fächer müssen noch gemeinsam geplant werden.
- Alle Titelzahlen werden mit der tatsächlichen Funktion `knowledgeRankFor` aus dem Ausgangsstand berechnet. Die eingegebenen sicheren Quests wären im angenommenen künftigen Katalog vorhanden und zugelassen. **Das belegt nicht ihre heutige Erreichbarkeit:** Der aktuelle Baum kennt nur 20 Questkennungen, darunter Vorschau-Inhalte. Neue Quests müssten fachlich ausgearbeitet, zugelassen und im Baum berücksichtigt werden.
- Sterne ergeben sich aus angenommenen tatsächlich sternberechtigten richtigen Lösungen, einschließlich solcher mit Hilfe, plus einmaligen Neulandboni. Die Aufteilung auf Runden ist ebenfalls angenommen. Daraus werden Summen und Sternenregen berechnet. Die heutige Auswahl von Practise Today und die Lernstandsableitung werden hier nicht vollständig simuliert.
- Der Baum wird nach seinem bestehenden Prinzip projiziert: je Fach erster sicherer Bereich = Ast, weitere sichere Quests = Blätter, E = Früchte, erste erfolgreiche Neuland-Entdeckung = Blüte. Das ist keine Ausführung des heutigen Renderers mit einem erweiterten Katalog. Im Beispiel gibt es keine Rückfälle; in der App bleiben erreichte Titel und Baumteile auch bei Rückfällen erhalten.

## 2. Pädagogische Grundlage

Quellen am 28.11.2026 recherchiert; Scout prüfte die relevanten Passagen, Atlas las die Originalabstracts beziehungsweise einschlägigen Volltextpassagen nach. Die BQ-Folgerungen sind unsere Gestaltungsvorschläge.

| Quelle und überprüfter Befund | Folgerung für die Beispiele | Grenze |
| --- | --- | --- |
| **Deci, Koestner & Ryan (1999)**, Meta-Analyse von 128 Studien: Erwartete, an Tätigkeit oder Leistung gebundene Belohnungen können anschließende freiwillige Beschäftigung vermindern; positives Feedback zeigte im Gesamtdatensatz günstigere Wirkungen. [Originalabstract, DOI 10.1037/0033-2909.125.6.627](https://pubmed.ncbi.nlm.nih.gov/10589297/) | Bestehende Belohnungen sollen nachvollziehbar würdigen. Das Kind behält Wahlmöglichkeiten; zusätzliche Mengenpflichten werden nicht aus dem Belohnungssystem abgeleitet. | Keine Studie dieser Analyse prüft unsere BQ-Jahresverläufe. Daraus folgt kein pauschales Verbot digitaler Sterne oder Titel. |
| **Henderlong & Lepper (2002)**, Forschungsübersicht mit Schwerpunkt Kinder: Wirkung von Lob hängt unter anderem von Glaubwürdigkeit, Autonomie, Kompetenzinformation und sozialem Vergleich ab. [Originaltext, DOI 10.1037/0033-2909.128.5.774](https://www.reed.edu/psychology/motivation/assets/downloads/Henderlong_Lepper_2002.pdf) | Rückmeldungen benennen eine konkrete Handlung, etwa einen geprüften Lösungsweg. Ein bloßer Klick sollte nicht als nachgewiesene Reflexion beschrieben werden. | Keine Garantie, dass ein bestimmter Satz ein Kind langfristig motiviert; auch Dauerlob ist damit nicht begründet. |
| **Agarwal, Nunes & Blunt (2021)**, systematischer Review von 50 Unterrichtsexperimenten, insgesamt 5.374 Lernenden: Abrufübungen unterstützen Lernen in verschiedenen Kontexten. Nur fünf Experimente betrafen die Grundschule. [Autorenversion, DOI 10.1007/s10648-021-09595-9](https://pdf.poojaagarwal.com/Agarwal_etal_2021_EDPR.pdf) | Ein bekanntes Thema nach Abstand erneut selbst bearbeiten kann wertvolle Lernarbeit sein, auch ohne neue Quest oder neues Blatt. | Keine Begründung für eine bestimmte Sternzahlung; gutes Erinnern ist noch kein umfassender Transfernachweis. |
| **Pashler et al./IES (2007)**, offizieller Leitfaden insbesondere für Klassen 3–12: verteilte Wiederbegegnung sowie Wechsel zwischen ausgearbeiteten Beispielen und eigener Problemlösung, jeweils moderate Evidenz. [Leitfaden, Empfehlungen 1–2, S. 5–9](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/20072004.pdf) | Bekanntes später wieder aufnehmen; Hilfe und eigene Versuche verbinden. Geeignete Aufgaben dürfen auf Papier stattfinden. | Der Leitfaden begründet weder eine tägliche Pflicht noch ein universelles 1/3/7-Tage-Schema. Er ist keine spezielle Studie zur Gleichwertigkeit von Bildschirm und Papier. |
| **Klahr & Nigam (2004)**, 112 Dritt-/Viertklässler, Planen fairer Experimente: Mit direkter Anleitung lernten mehr Kinder die Strategie. Unter denen, die sie erwarben, war spätere Anwendung nicht statistisch vom Lernweg unterschieden. [Originaltext, DOI 10.1111/j.0956-7976.2004.00737.x](https://www.fi.uu.nl/publicaties/literatuur/2004_klahr_learning_paths_early_science_instruction.pdf) | Hilfe darf willkommen sein. Späteres eigenständiges Anwenden wird gesondert erkennbar, unabhängig davon, wie es gelernt wurde. | Enges naturwissenschaftliches Ziel und kurze Untersuchung; kein Beweis für jede Hilfsform oder alle Fächer. |

Damit folgen die Beispiele dem Leitbild, besonders Grundsätzen 1–10 und 12: glaubwürdige Anerkennung, Wahl, hilfreiche Unterstützung, fachliches Können und nachvollziehbare Regeln. Eine Jahreswirkung auf Motivation ist damit nicht nachgewiesen.

## 3. Verlauf A – viel Vorwissen, kurze gelegentliche Übung

**Ausgangslage:** Schule und bisherige Erfahrungen ergeben bereits elf sichere Quests aus fünf Fächern, eine davon auf E. Das Kind bringt viel mit. Es braucht passende neue Anwendungen und Entdeckungen, statt Bekanntes für Punkte nachzuweisen.

| Zeitpunkt | Möglicher Lernweg | Sichere Quests / davon E | Titel nach heutiger Formel | Sterne im Beispiel, gesammelt |
| --- | --- | --- | --- | --- |
| Einstieg | Bekanntes wird anerkannt; das Kind wählt etwas bislang Unbekanntes. | 11 / 1 | Scientist | 0 |
| Abschnitt 1 | Erste neue Quests; bei Bekanntem passende Herausforderungen, ein kurzes Experiment auf Papier. | 16 / 3 | Professor | 28 |
| Abschnitt 2 | Eine neue Schulevaluation zeigt einen konkreten Übungsbedarf; später selbstständig in einem anderen Zusammenhang anwenden. | 20 / 5 | Legend | 55 |
| Abschnitt 3 | Neue Inhalte und eigene Lösungswege; Bekanntes nur dort wiederholen, wo es einen Lernzweck hat. | 24 / 8 | Legend | 80 |
| Jahresende | Eine neue passende Quest entdecken und vertiefen; das Kind kann trotz unverändertem Titel neues Können zeigen. | 31 / 10 | Legend | 104 |

**Umfang:** 28 digitale Runden und 8 Blätter = 288 Aufgabenbegegnungen. Im Modell entstehen 20 zusätzliche sichere Quests; diese Entwicklung stammt auch aus Schule und anderen Lerngelegenheiten und wird nicht den 288 Aufgaben zugeschrieben.

**Sichtbare Anerkennung unter den heutigen Formeln:** 104 Sterne, 3 Sternenregen; das Abzeichen für richtige Herausforderungen erreicht bei den angenommenen Auslösungen im zweiten Abschnitt Gold. Der Baum wächst rechnerisch von 5 Ästen/6 Blättern/1 Frucht auf 5 Äste/26 Blätter/10 Früchte, zusätzlich 14 Entdeckungsblüten.

**Was das Beispiel zeigt:** Im angenommenen künftigen Inhaltsangebot ist die heutige Titelleiter bereits zur Jahresmitte ausgeschöpft. Das legt keine neue Endstufe fest. Es zeigt den Bedarf, Titelabstände und Inhaltsumfang gemeinsam zu prüfen. Normale M/E-Aufgaben können sinnvoll sein und heute trotzdem null Sterne bringen; das muss vor Beginn verständlich sein.

## 4. Verlauf B – regelmäßig üben, Können allmählich ausbauen

**Ausgangslage:** Eine sichere Quest, sonst wechselnde Kenntnisse. Neue Schulthemen und Evaluationen geben wichtige Hinweise. Zwei beispielhafte Einheiten je Schulwoche sind eine Annahme, keine Empfehlung oder Erwartung.

| Zeitpunkt | Möglicher Lernweg | Sichere Quests / davon E | Titel nach heutiger Formel | Sterne im Beispiel, gesammelt |
| --- | --- | --- | --- | --- |
| Einstieg | Einen passenden Start finden; konkrete kleine Erfolgserlebnisse, Hilfe nutzen. | 1 / 0 | Explorer | 0 |
| Abschnitt 1 | Mehrere Grundlagen werden verständlicher. Erste neue Quests und ein selbst bearbeitetes Blatt. | 5 / 0 | Investigator | 72 |
| Abschnitt 2 | Neue Schulthemen üben; alte Inhalte nach Abstand wieder aufgreifen. | 11 / 1 | Scientist | 144 |
| Abschnitt 3 | Einen Lösungsweg erklären, Ergebnisse prüfen und Bekanntes in neuen Aufgaben verwenden. | 16 / 2 | Professor | 216 |
| Jahresende | Weitere neue Inhalte und vertiefte Anwendungen, digital oder auf Papier. | 21 / 5 | Legend | 288 |

**Umfang:** 60 digitale Runden und 12 Blätter = 576 Aufgabenbegegnungen. Im Modell kommen 20 sichere Quests hinzu. Aufgabenmenge und Könnenszuwachs werden nicht kausal gleichgesetzt.

**Sichtbare Anerkennung unter den heutigen Formeln:** 288 Sterne, 16 Sternenregen; Gold für richtige Herausforderungen und für angenommene Challenges bereits im zweiten Abschnitt. Der Baum endet rechnerisch bei 5 Ästen/16 Blättern/5 Früchten plus 18 Entdeckungsblüten. Zwölf vollständig erfasste Blätter ergeben derzeit Silber für den Blattabschluss; das heutige tagebezogene Übungsabzeichen ergibt bei 64 angenommenen Übungstagen Silber.

**Was das Beispiel zeigt:** Titel verteilen sich hier zufällig günstiger über das Jahr, während einzelne Goldstufen schon deutlich früher erreicht werden. Das ist eine Folge der eingesetzten Beispiele, kein Nachweis einer ausgewogenen heutigen Belohnungskurve. Eine gemeinsam angenommene Jahresmenge passt nicht automatisch für alle Kinder.

## 5. Verlauf C – viel Hilfe, überwiegend Papier, eine längere Pause

**Ausgangslage:** Das Kind braucht bei vielen Aufgaben Unterstützung und arbeitet gern mit Material. Es beginnt ohne sichere Quest im Modell. Im zweiten Abschnitt liegt eine fünf Schulwochen lange Pause; danach wird passend wieder aufgenommen. Für die Pause wird nichts abgezogen.

| Zeitpunkt | Möglicher Lernweg | Sichere Quests / davon E | Titel nach heutiger Formel | Sterne im Beispiel, gesammelt |
| --- | --- | --- | --- | --- |
| Einstieg | Kurze passende Aufgaben, Dinge legen oder zeichnen; Hilfe annehmen dürfen. | 0 / 0 | Explorer | 0 |
| Abschnitt 1 | Zwei Bereiche gelingen selbstständiger; weitere Aufgaben werden mit Hilfe verstanden. | 2 / 0 | Explorer | 38 |
| Abschnitt 2 | Pause, dann behutsamer Wiedereinstieg. Schulische Hinweise und das tatsächlich gezeigte Können bestimmen den nächsten Schritt. | 4 / 0 | Investigator | 50 |
| Abschnitt 3 | Bekannte Wege erneut ohne Hilfe versuchen; bei Bedarf ein Beispiel, danach die eigene Aufgabe. | 7 / 0 | Scientist | 92 |
| Jahresende | Ein neues Thema mit Material erschließen und einzelne Anwendungen bereits selbst erklären. | 11 / 1 | Scientist | 148 |

**Umfang:** 8 digitale Runden und 24 Blätter = 256 Aufgabenbegegnungen. Blätter ersetzen Bildschirmrunden. Im Modell werden elf Quests sicher; zusätzlich zählt die anerkannte Lernarbeit mit Hilfe. Der niedrigere Titel macht dieses Jahr nicht zu einem Misserfolg.

**Sichtbare Anerkennung unter den heutigen Formeln:** 148 Sterne, 11 Sternenregen; diese Zahlung setzt entsprechende richtige, sternberechtigte Lösungen voraus, viele davon mit Hilfe. Der Baum endet rechnerisch bei 5 Ästen/6 Blättern/1 Frucht plus 8 Entdeckungsblüten. Für die 24 vollständig erfassten Blätter gibt es derzeit Gold. Das heutige tagebezogene Übungsabzeichen bleibt bei 26 angenommenen Übungstagen dagegen schlicht.

**Was das Beispiel zeigt:** Lernarbeit und Anerkennung können während eines Jahres wachsen, obwohl nicht jeder große Titel erreicht wird. Zugleich ist Papier derzeit nicht bei jedem Abzeichen gleichgestellt: Im Blatteingabeweg entfällt der normale Auslöser für richtige Herausforderungen; das angenommene Blattabschluss-Gold ist eine andere Anerkennung. Wie gleiche fachliche Handlungen medienunabhängig gewürdigt werden sollen, ist eine offene Gestaltung für 0.160-Beta.

## 6. Ein gemeinsames Beispiel für den letzten Schulmonat

**Nur ein Inhaltsbeispiel:** Angenommen, Symmetrie ist dann ein neues passendes Schulthema und als eigenständige Quest fachlich ausgearbeitet. Keine Aussage über den tatsächlichen Themenplan der Schule und keine automatische neue Standardkennung.

- **Verlauf A:** Eine eigene Figur konstruieren und begründen, warum eine vorgeschlagene Linie keine Symmetrieachse ist. Zeichnung oder Falten auf Papier, digitale Prüfung nur dort, wo sie sinnvoll möglich ist.
- **Verlauf B:** Figuren untersuchen, eine Hälfte ergänzen und die Vermutung mit Spiegel oder Falten prüfen. Anschließend eine neue Figur selbstständig bearbeiten.
- **Verlauf C:** Zunächst mit gefalteten Formen und einem Beispiel arbeiten, danach eine passende Achse bei einer einfachen neuen Figur selbst finden.

Alle drei bearbeiten denselben sinnvollen Lernbereich auf passendem Niveau. Entdeckung, hilfreiches Üben, sichere Anwendung und Vertiefung sind unterscheidbare Beiträge. Der Lernweg kann weiterführen, auch wenn ein Titel oder ein Abzeichen gerade keine neue Stufe erreicht. Diese Inhalte würden erst gesondert geplant und umgesetzt; die bestehende Aufgabensteuerung ist hier nicht verändert.

## 7. Vergleich und daraus folgende Diskussionsfragen

| Am Jahresende, ausschließlich Beispielannahmen | A | B | C |
| --- | --- | --- | --- |
| Aufgabenbegegnungen, Papier eingeschlossen | 288 | 576 | 256 |
| Sichere Quests am Einstieg → am Ende | 11 → 31 | 1 → 21 | 0 → 11 |
| Sterne | 104 | 288 | 148 |
| Sternenregen | 3 | 16 | 11 |
| Titel nach heutiger Formel im erweiterten Beispielkatalog | Legend | Legend | Scientist |
| Abzeichen richtige Herausforderung | Gold ×37 | Gold ×62 | schlicht ×4 |
| Abzeichen angenommene Challenge, höchstens einmal je digitaler Runde | Gold ×20 | Gold ×46 | Silber ×6 |
| Abzeichen Blattabschluss | Silber ×8 | Silber ×12 | Gold ×24 |
| Heutiges Übungstage-Abzeichen | schlicht ×3 | Silber ×6 | schlicht ×2 |

Die Tabelle dient der Prüfung des Systems, nicht dem Vergleich realer Kinder. Sterne zählen hier auch Lösungen mit Hilfe; sie sind kein Leistungsvergleich. Blattabschlüsse sagen nicht, dass jede Aufgabe selbstständig richtig war. Ein bleibender Baum würdigt Erreichtes; er garantiert nicht, dass heute noch alles sicher gelingt.

**Vier wesentliche Befunde für die Diskussion:**

1. **Jahresstoff und Titel müssen zusammenpassen.** A erreicht die heutige oberste Stufe früh, C erreicht sie im Beispiel gar nicht. Ob die Leiter, ihre Voraussetzungen oder die Rollen der Titel geändert werden, bleibt offen. Eine Kalenderhürde würde das fachliche Problem nicht lösen.
2. **Gleiche Stufenzahlen erzeugen sehr unterschiedliche Abstände.** Fünfzehn richtige Herausforderungsaufgaben können schon in zwei Acht-Aufgaben-Runden zusammenkommen. Gold beim heutigen Übungstage-Abzeichen braucht dagegen 150 verschiedene erfasste Tage. Das ist eine rechnerische Gegenprobe, keine Beobachtung eines Kindes.
3. **„Jede Aufgabe trägt bei“ braucht eine ehrliche Bedeutung.** Konkrete Rückmeldung und fachlicher Beitrag sind auch ohne Stern möglich. Soll jede sinnvolle Aufgabe zusätzlich auf eine sammelbare Anerkennung einzahlen, müssten wir einen vorhandenen Auslöser neu bestimmen. Das ist nicht entschieden. Bloßes Antippen ist kein verlässlicher Nachweis für Nachdenken oder analoge Arbeit.
4. **Vorwissen zählt schon heute stark.** Die Titelfunktion liefert bei 12 sicheren Quests/4 Fächern/2 E sofort Professor, bei 18/5/5 sofort Legend – unabhängig von einer Rundenzahl. Ob die Anerkennung dieses Vorwissens und die längerfristige Karriere unterschiedlich sichtbar werden sollten, ist eine offene Konzeptfrage. Schulevaluationen verlieren dadurch nicht automatisch ihre Bedeutung für Lernbedarf und Aufgabenwahl.

**Meine Empfehlung als nächster Konzeptschritt:** Den vorgesehenen Jahresinhalt über alle Fächer grob abstecken und danach wenige Varianten der bestehenden Schwellen/Auslöser durch genau diese drei Verläufe prüfen. Je Variante zeigen: frühe Würdigung, weitere erreichbare Lernziele, lange Phasen ohne Anerkennung, Verhalten nach Gold/hohem Titel und Gleichbehandlung geeigneter Papierarbeit. Vor Entscheidungen keine neue Titelfolge und keine neue Belohnungsart festlegen. Eine anschließende kleine Erprobung mit Kind und Eltern prüft Verständlichkeit und freiwilliges Interesse; sie ist kein Beweis für eine Jahreswirkung.

## 8. Abgleich der externen Ausarbeitung und Nachweisgrenzen

Die von Peter verlinkte Ausarbeitung [„Big Quest Belohnungen“](https://claude.ai/artifact/6UV3WkkTeRw7oiE2aRrC6u) wurde zuvor tatsächlich im Browser gelesen. Sie nennt Code-Stand 81b5a96 vom 27.11.2026 und zehn Befunde; ihre Versionsbeschriftung nennt 0.152.8. Der aktuelle Fahrplan ordnet den Stand 81b5a96 der veröffentlichten 0.152.9 zu. Für Verhalten gilt der hier direkt gelesene Quellcode, nicht die Versionsbeschriftung der Ausarbeitung.

Gegenüber 81b5a96 sind am Ausgangs-main Titelmodul, Sterne, Wissen, Wissensbaum und `index.html` unverändert. An den relevanten Stellen bestätigt die Lektüre: einfache Glow-Auswahl, zufälliges Angebot ohne Bildschirm plus Bestätigung, 5/15-Stufen mit verschiedenen Auslösern, Neugier beim ersten Öffnen, Sternenregen ab sechs verdienten Sternen einschließlich Bonus, mehrfach verwendetes Konfetti, Titel/ Baum durch Schulstartwert, unterschiedliche Behandlung von Lern-/Events-Quests und Anerkennung später richtiger Antworten. Diese Befunde sind Prüfpunkte, keine Freigaben zum Umbau. Das Motto-Thema gehört bereits in Fahrplan-Paket 2.

Nicht durchgeführt: echte Jahresnutzung, App-Jahressimulation mit adaptiver Auswahl, Lernstandsprognose, neuer Browser-/Gerätetest, physischer Papiertest oder Motivationsstudie. Keine volle App-Testsuite für diese reine Konzeptänderung; keine Aussage „CI grün“. Lokal bestanden: Rechnung für drei Profile mit zwölf Zeitpunkten und zwei zusätzlichen Titelfällen, Grenzen/Summen der Eingaben sowie zwölf gepinnte Produktquellen geprüft. Produktmodule sind unverändert. Scout hat ausschließlich gelesen; seine saubere Arbeitskopie und sein unbenutzter Arbeitszweig wurden nach Übergabe gelöscht. Keine neue Infrastruktur oder App-Veröffentlichung.

## 9. Reproduzierbare Eingaben und Rechnung

Die folgende Rechnung läuft mit Node aus dem Repo-Wurzelverzeichnis. Sie importiert ausschließlich die vorhandene Titelfunktion; alle anderen Größen sind ausdrücklich angenommene Eingaben oder oben benannte arithmetische Projektionen. Keine Zufallszahlen, keine Netzaufrufe, keine Speicherung von Kontodaten. Aktuelle Module müssen dem oben genannten Quellstand entsprechen.

```js
import assert from 'node:assert/strict';
import {knowledgeRankFor, higherRank} from './src/module/titel.mjs';
const profiles = [
 {id:'A',start:[5,2,2,1,1],startE:1,quarters:[
  {online:7,sheets:2,days:8,safe:[7,3,3,1,2],E:3,eligible:32,paid:24,helpPaid:3,bonus:4,stars:[6,5,4,4,3,2,2,1,1],brave:5,challengeCorrect:8},
  {online:7,sheets:2,days:8,safe:[9,4,4,1,2],E:5,eligible:32,paid:23,helpPaid:3,bonus:4,stars:[6,4,4,3,3,2,2,2,1],brave:5,challengeCorrect:9},
  {online:7,sheets:2,days:8,safe:[12,4,4,1,3],E:8,eligible:30,paid:22,helpPaid:3,bonus:3,stars:[5,4,4,3,3,2,2,1,1],brave:5,challengeCorrect:10},
  {online:7,sheets:2,days:8,safe:[16,5,5,2,3],E:10,eligible:28,paid:21,helpPaid:3,bonus:3,stars:[6,4,3,3,2,2,2,1,1],brave:5,challengeCorrect:10}]},
 {id:'B',start:[1,0,0,0,0],startE:0,quarters:[
  {online:15,sheets:3,days:16,safe:[3,1,1,0,0],E:0,eligible:96,paid:67,helpPaid:18,bonus:5,stars:[6,6,6,6,5,5,5,4,4,4,4,3,3,3,3,2,2,1],brave:10,challengeCorrect:12},
  {online:15,sheets:3,days:16,safe:[5,2,2,1,1],E:1,eligible:96,paid:67,helpPaid:18,bonus:5,stars:[6,6,6,6,5,5,5,4,4,4,4,3,3,3,3,2,2,1],brave:12,challengeCorrect:14},
  {online:15,sheets:3,days:16,safe:[8,2,3,1,2],E:2,eligible:104,paid:68,helpPaid:16,bonus:4,stars:[6,6,6,6,5,5,5,4,4,4,4,3,3,3,3,2,2,1],brave:12,challengeCorrect:18},
  {online:15,sheets:3,days:16,safe:[11,3,4,1,2],E:5,eligible:104,paid:68,helpPaid:16,bonus:4,stars:[6,6,6,6,5,5,5,4,4,4,4,3,3,3,3,2,2,1],brave:12,challengeCorrect:18}]},
 {id:'C',start:[0,0,0,0,0],startE:0,quarters:[
  {online:3,sheets:5,days:6,safe:[1,0,1,0,0],E:0,eligible:48,paid:35,helpPaid:25,bonus:3,stars:[7,6,6,5,5,4,3,2],brave:2,challengeCorrect:1},
  {online:1,sheets:2,days:3,safe:[2,1,1,0,0],E:0,eligible:16,paid:11,helpPaid:6,bonus:1,stars:[6,4,2],brave:1,challengeCorrect:0},
  {online:2,sheets:7,days:7,safe:[3,1,2,1,0],E:0,eligible:56,paid:40,helpPaid:28,bonus:2,stars:[7,6,6,5,5,4,4,3,2],brave:1,challengeCorrect:1},
  {online:2,sheets:10,days:10,safe:[5,2,2,1,1],E:1,eligible:76,paid:54,helpPaid:35,bonus:2,stars:[7,6,6,6,5,5,5,4,4,3,3,2],brave:2,challengeCorrect:2}]}
];
const sum = xs => xs.reduce((a,b)=>a+b,0);
const stage = n => n===0?'–':n>=15?'Gold':n>=5?'Silber':'schlicht';
const capacities = [25,5,5,2,3];
const results = profiles.map(p=>{
 let stars=0,blocks=0,days=0,sheets=0,brave=0,challenge=0,flowers=0;
 let prev=p.start,prevE=p.startE;
 let rank=knowledgeRankFor({secure:sum(prev),subjects:prev.filter(Boolean).length,extending:prevE});
 const start={secure:sum(prev),E:prevE,title:rank};
 const checkpoints=p.quarters.map((q,i)=>{
  const n=q.online+q.sheets;
  assert.equal(q.stars.length,n);
  assert.equal(sum(q.stars),q.paid+q.bonus);
  assert(q.bonus<=q.online);
  const paidPerBlock=q.stars.map((s,j)=>s-Number(j<q.bonus));
  assert(paidPerBlock.every(s=>Number.isInteger(s) && s>=0 && s<=8));
  assert(q.challengeCorrect<=sum(paidPerBlock.slice(0,q.online)));
  assert(q.helpPaid<=q.paid && q.paid<=q.eligible && q.eligible<=8*n);
  assert(q.days<=n && q.brave<=q.online && q.challengeCorrect<=8*q.online);
  assert(q.challengeCorrect<=q.paid && q.E>=prevE && q.E<=sum(q.safe));
  assert(q.safe.every((v,j)=>v>=prev[j] && v<=capacities[j]));
  const secure=sum(q.safe),subjects=q.safe.filter(Boolean).length;
  stars+=sum(q.stars);blocks+=n;days+=q.days;sheets+=q.sheets;
  brave+=q.brave;challenge+=q.challengeCorrect;flowers+=q.bonus;
  rank=higherRank(rank,knowledgeRankFor({secure,subjects,extending:q.E}));
  prev=q.safe;prevE=q.E;
  return {section:i+1,tasks:blocks*8,secure,subjects,E:q.E,title:rank,stars,
   rain:q.stars.filter(s=>s>=6).length,
   tree:{branches:subjects,leaves:secure-subjects,fruits:q.E,flowers},
   badges:{challenge:[challenge,stage(challenge)],brave:[brave,stage(brave)],
    sheets:[sheets,stage(sheets)],practice:[Math.floor(days/10),stage(Math.floor(days/10))]}};
 });
 return {id:p.id,start,checkpoints,rain:sum(checkpoints.map(q=>q.rain))};
});
assert.equal(knowledgeRankFor({secure:12,subjects:4,extending:2}),'Professor');
assert.equal(knowledgeRankFor({secure:18,subjects:5,extending:5}),'Legend');
assert.deepEqual(results.map(p=>p.checkpoints.at(-1).stars),[104,288,148]);
assert.deepEqual(results.map(p=>p.checkpoints.at(-1).tasks),[288,576,256]);
console.log(JSON.stringify(results,null,2));
```

Eingabe-Legende: `safe` zählt sichere Quests je Fach in der Reihenfolge Mathematik/Science/English/Deutsch/Reading; `E` ist darin enthalten. `eligible` sind sternberechtigte Aufgaben, `paid` deren richtige Lösungen, `helpPaid` die darin enthaltenen Lösungen mit Hilfe. `bonus` zählt verschiedene neue erfolgreiche Neuland-Entdeckungen, `stars` die angenommene Verteilung der gesamten Sternzahlung je Einheit. `brave` und `challengeCorrect` sind getrennte, möglicherweise überlappende Auslöser, keine zusätzlichen Aufgaben. Nicht modelliert sind Zufallsangebote ohne Bildschirm, bloße Glow-Auswahl oder Neugier beim Öffnen. Die ausgewählten Abzeichen sind damit keine vollständige Abzeichenbilanz.

## 10. Produktquellen am Ausgangsstand

- [Fahrplan und Paketgrenzen](https://github.com/pahlborn/bis-school-app_src/blob/238f372c788a45aa7add00c2365d23a8d9ff4741/docs/konzept/fahrplan.md#L5), [Leitbild](https://github.com/pahlborn/bis-school-app_src/blob/238f372c788a45aa7add00c2365d23a8d9ff4741/docs/konzept/leitbild.md#L24), [entschiedene Motivationsregeln](https://github.com/pahlborn/bis-school-app_src/blob/238f372c788a45aa7add00c2365d23a8d9ff4741/docs/konzept/inhalt-motivation-entscheidungen.md#L7).
- [Titelberechnung und Anerkennung des Schulstartwerts](https://github.com/pahlborn/bis-school-app_src/blob/238f372c788a45aa7add00c2365d23a8d9ff4741/src/module/titel.mjs#L3).
- [Sternberechtigung](https://github.com/pahlborn/bis-school-app_src/blob/238f372c788a45aa7add00c2365d23a8d9ff4741/src/module/sterne.mjs#L44), [Wertung und Herausforderungsabzeichen](https://github.com/pahlborn/bis-school-app_src/blob/238f372c788a45aa7add00c2365d23a8d9ff4741/index.html#L2717).
- [Blatteingabe](https://github.com/pahlborn/bis-school-app_src/blob/238f372c788a45aa7add00c2365d23a8d9ff4741/index.html#L2615), [einmaliger Blattabschluss](https://github.com/pahlborn/bis-school-app_src/blob/238f372c788a45aa7add00c2365d23a8d9ff4741/index.html#L3815).
- [Sternenregen](https://github.com/pahlborn/bis-school-app_src/blob/238f372c788a45aa7add00c2365d23a8d9ff4741/index.html#L3065), [Abzeichenstufen und Tageszählung](https://github.com/pahlborn/bis-school-app_src/blob/238f372c788a45aa7add00c2365d23a8d9ff4741/index.html#L3211).
- [Heutiger Baumkatalog und Modell](https://github.com/pahlborn/bis-school-app_src/blob/238f372c788a45aa7add00c2365d23a8d9ff4741/src/module/wissensbaum.mjs#L3), [bestehende Mindestbelege für Können](https://github.com/pahlborn/bis-school-app_src/blob/238f372c788a45aa7add00c2365d23a8d9ff4741/src/module/wissen.mjs#L2).
