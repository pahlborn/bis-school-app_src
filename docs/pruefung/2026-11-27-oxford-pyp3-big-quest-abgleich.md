# Oxford Mathematics PYP 3 im Abgleich mit Big Quest

Stand: 27.11.2026 · Auftrag: Peters hochgeladenes Buch hinsichtlich Big Quest analysieren.

**Ergebnis:** Das Buch eignet sich als Inhaltsinventar und als Anregung für die Weiterentwicklung von Big Quest. Die vorhandenen Übungen passen vor allem zu Teilen von Zahlenverständnis, Rechenstrategien, Zeit, Messen und Datenlesen. Mehrere weitere Themen sind bereits als freischaltbare Vorschau vorhanden. Eine vollständige Abdeckung der 32 Buchthemen ist damit nicht belegt. Insbesondere Geometrie, räumliche Orientierung, Geld und Zufall enthalten noch nicht belegte Aufgabenfamilien. Hinzu kommt eine andere Art von Anforderung: selbst darstellen, erklären, messen und untersuchen.

Das ist eine **Analyse und ein Vorschlag für spätere Entscheidungen**, kein freigegebener Bauauftrag, keine Kinderbewertung und keine Abnahme der veröffentlichten App.

## 1. Quellen und Reichweite der Prüfung

### Buch

- Annie Facchinetti: *Oxford Mathematics: Primary Years Programme. Student Book PYP 3*. Oxford University Press, 2019, ISBN **9780190312220**.
- Peters Upload: `790286689-Mathematics-PYP-3-Annie-Facchinetti-Oxford-2019.pdf`, 160 PDF-Seiten, 14.865.738 Byte.
- SHA-256: `7356fc8d6e5fba0c24161e60f1b8a5b7239e69265079106e5a57e01be411e1b1`.
- Zehn Units, 32 Topics. Unterrichtsteil: Druckseiten 2–133; Glossar: 134–143; Lösungen ab 144. Im Hauptteil gilt **PDF-Seite = Druckseite + 3**. Die Tabellen nennen beide Zählungen.
- Alle 132 Unterrichtsseiten und das Glossar wurden textlich gelesen; 39 Seiten aus allen großen Bereichen zusätzlich visuell geprüft. Titel, Vorwort und Inhaltsverzeichnis wurden geprüft; der Lösungsteil gezielt, nicht vollständig. Atlas hat die unten hervorgehobenen Rechen-, Formen- und Sockenbefunde zusätzlich an Seitenbildern geprüft.
- Der Lehrerband, weitere Bände und die tatsächliche Jahresplanung der Schule liegen dieser Analyse nicht zugrunde. Die Verlagsaussage im Vorwort, die **Serie** decke den PYP-Mathematikrahmen vollständig ab, ist keine unabhängige Bestätigung für diesen Einzelband oder für Peters Schule. PYP 3 wird hier nicht mit deutscher Klasse 3 gleichgesetzt.

### Produkt

Geprüft wurde ausschließlich Produkt-`main` am Commit **[`81b5a96e0075f12890cda3638ce96ac542e9ebda`](https://github.com/pahlborn/bis-school-app_src/commit/81b5a96e0075f12890cda3638ce96ac542e9ebda)**. Die vorgegebenen fünf Auftrags-/Konzeptdokumente wurden zuerst in ihrer festgelegten Reihenfolge gelesen.

Quellenkürzel der folgenden Tabellen bezeichnen **Datei und Zeilen an genau diesem Commit**:

| Kürzel | Quelle |
|---|---|
| I | [`index.html`](https://github.com/pahlborn/bis-school-app_src/blob/81b5a96e0075f12890cda3638ce96ac542e9ebda/index.html) |
| Z | [`src/module/zahlenfragen.mjs`](https://github.com/pahlborn/bis-school-app_src/blob/81b5a96e0075f12890cda3638ce96ac542e9ebda/src/module/zahlenfragen.mjs) |
| R | [`src/module/rundungsfragen.mjs`](https://github.com/pahlborn/bis-school-app_src/blob/81b5a96e0075f12890cda3638ce96ac542e9ebda/src/module/rundungsfragen.mjs) |
| A | [`src/module/aufgabenbanken.mjs`](https://github.com/pahlborn/bis-school-app_src/blob/81b5a96e0075f12890cda3638ce96ac542e9ebda/src/module/aufgabenbanken.mjs) |
| N | [`src/module/neuland-grundlage.mjs`](https://github.com/pahlborn/bis-school-app_src/blob/81b5a96e0075f12890cda3638ce96ac542e9ebda/src/module/neuland-grundlage.mjs) |
| B | [`src/module/grundlage-beispiele.mjs`](https://github.com/pahlborn/bis-school-app_src/blob/81b5a96e0075f12890cda3638ce96ac542e9ebda/src/module/grundlage-beispiele.mjs) |
| S | [`src/module/standardkatalog.mjs`](https://github.com/pahlborn/bis-school-app_src/blob/81b5a96e0075f12890cda3638ce96ac542e9ebda/src/module/standardkatalog.mjs) |
| P | [`src/module/practise-heute.mjs`](https://github.com/pahlborn/bis-school-app_src/blob/81b5a96e0075f12890cda3638ce96ac542e9ebda/src/module/practise-heute.mjs) |

Es handelt sich um eine statische Prüfung von Aufgabeninhalten, Generatoren, Registrierung, Auswahl und Hilfen. Keine Browser-, iPad-, Drucklayout- oder Lernwirksamkeitsprüfung wurde durchgeführt; keine Testsuite wurde ausgeführt. Der veröffentlichte Stand und die Freischaltungen einzelner Kinder wurden nicht geprüft. Historische Testberichte zählen nicht als heutiger Funktionsnachweis.

Bearbeitet haben Atlas sowie zwei tatsächliche **Codex-Vertretungen als Scout/RKA**: `scout_pyp3_book_20261127` für das Buch und `scout_pyp3_bq_coverage_20261127` für den Produktcode. Getrennte, unveränderte Arbeitskopien lagen auf `analysis/pyp3-curriculum-20261127` und `analysis/pyp3-code-20261127`, beide am genannten Ausgangscommit. Dieser Bericht liegt im Produkt-Repo auf `analysis/pyp3-20261127`. Es wurden keine Buchdateien, Seitenbilder oder vollständigen Extraktionen ins Repo übernommen.

### Bedeutung der Bewertungen

- **Teilweise**: Konkrete wiederholbare Teilfertigkeiten sind als Aufgaben belegt; die ganze Breite des Buchtopics ist damit nicht nachgewiesen.
- **Normal**: Im regulären Fachangebot registriert, vorbehaltlich Anmeldung und individueller Konfiguration.
- **Vorschau**: Ein echter Generator ist vorhanden, aber ohne Freischaltung für das betreffende Kind gesperrt.
- **Nicht belegt**: Im geprüften registrierten Angebot wurde keine entsprechende Aufgabenfamilie gefunden. Das behauptet nichts über andere Zweige, andere Apps oder spätere Veröffentlichungen.

Es wird bewusst keine Prozentzahl für „Jahresabdeckung“ angegeben: Ein Buchtopic enthält unterschiedlich viele Teilfertigkeiten, Handlungen und Schwierigkeitsstufen. Auch „teilweise“ bedeutet nicht, dass keine einzelne darin enthaltene Fertigkeit ausreichend geübt werden könnte.

## 2. Was das Buch über Aufgabenqualität zeigt

Der wiederkehrende Aufbau lautet **angeleitet üben → selbstständig üben → in neuen Zusammenhängen anwenden** (Vorwort PDF 3). Das ist mehr als eine Folge immer größerer Zahlen. In den Erweiterungsaufgaben kommen teilweise neue Anforderungen hinzu: gemischte Zahlen, zweischrittige Muster, Millimeter und Quadratmeter oder Körpernetze.

Für Big Quest sind fünf Eigenschaften besonders nützlich:

1. **Darstellungen verbinden.** Eine Zahl erscheint als Wort, Stellenwerttafel und Bündelung; Multiplikation als Gruppen, Punktfeld und Rechnung; Brüche als Fläche, Menge und Position am Zahlenstrahl. Ein einziges Bildformat bildet das nicht vollständig ab.
2. **Verfahren wählen und erklären.** Richtige Ergebnisse sind ein Teil. Das Buch fordert außerdem günstige Zerlegungen, Rechenwege und Gegenproben. Seine „schriftlichen Strategien“ beginnen bei Plus und Minus mit Zahlenstrahlsprüngen; sie dürfen nicht pauschal mit schriftlichen Spaltenalgorithmen gleichgesetzt werden.
3. **Selbst etwas erzeugen.** Kinder zeichnen, teilen Flächen, setzen Figuren zusammen, tragen Zeiger ein, erstellen Karten und Diagramme und formulieren Aussagen. Vorgegebene Antworten wiederzuerkennen ist eine andere Leistung.
4. **Schätzen und praktisch prüfen.** Längen werden real gemessen, Gefäße untersucht, Massen verglichen und Würfelkörper gebaut. Eine Auswahlfrage dazu prüft Wissen über die Handlung, nicht die Handlung selbst.
5. **Untersuchen statt nur ablesen.** Bei Daten und Zufall gehören eigene Fragen, Datenerhebung, Vorhersagen, Versuche und die Auswertung unterschiedlicher Ergebnisse zusammen.

Big Quest hat bereits Anschlussstellen: Teil-Ganzes-Modelle, Zahlenstrahl, Hinweise, andere Grundlage-Beispiele und druckbare Übungsblätter. Für sieben normale Mathematik-/Science-Quests enthalten die Blätter Platz für den Rechenweg, einen leeren Zahlenstrahl, eine Gegenprobe an einer Aufgabe sowie eine Aufforderung, einem Erwachsenen eine Aufgabe zu erklären (I:3620–3674). **Big Quest ist daher nicht auf Bildschirm-Auswahlfragen beschränkt.** Diese Felder liefern allerdings weder neue Themenaufgaben noch eine automatische fachliche Bewertung des selbst geschriebenen Weges. Die fünf Vorschauquests stehen nicht in der betreffenden `MATHS`-Liste (I:3623).

## 3. Welche Übungen heute tatsächlich vorhanden sind

### Zugang und Freigabe

Im Fach Maths sind fünf normale Quests registriert: **Time & Numbers, Rounding Road, Number Combinations, Word Problems, Data Detective**. **Units & Measuring** und **Bar Graphs & Worksheets** liegen regulär unter Science; ihre Fachzuordnung ist keine Mathematiklücke (I:2131–2175).

Weitere fünf Maths-Quests sind mit `preview:true` vorhanden: **Times Tables, Fractions, Area & Perimeter, Time Passes, Mass & Capacity**. Der statisch belegte Freigabeweg lautet: **Elternbereich → betreffendes Kind → Maths → Bereich für kommende Themen („Coming up“ in EN) → Schalter der Quest** (I:4087,4101–4103,4546). `isLocked` prüft die kindbezogene Liste `unlocked`; gesperrte Quests werden aus Auswahl und Mix entfernt (I:2425,1780; P:57–88). Daraus folgt keine Aussage, welche Themen bei einem bestimmten Kind heute freigeschaltet sind.

Der Ausführungspfad wurde von den Live-Modulen bis zur Kinderaufgabe verfolgt: `src/module/module.json:14–23`, `werkzeug/module.mjs:26–29,56–75`, I:1768,2131–2175,2530–2540,2563–2570,2589–2594. Eine Katalogüberschrift oder eine Elternidee allein wurde nicht als Aufgabenabdeckung gewertet.

### Vollständiger Themenabgleich

| Nr. | Buchtopic · Druck / PDF | Was das Buch zusätzlich konkret verlangt | Big Quest am geprüften Main-Stand | Belege im Produkt |
|---:|---|---|---|---|
| 1 | Stellenwert · 2–5 / 5–8 | Zahlwörter, Tafeln und Blöcke verbinden; Zahlen ordnen; auch nichtkanonisch bündeln, z. B. mehrere Zehner statt Hunderter. Überwiegend vierstellige Zahlen, einzelne fünfstellige Erweiterungen. | **Teilweise, normal:** Ziffernwerte, Aufbau, größte/kleinste Zahl, ±10/100/1000 und Null als Platzhalter bis 9999; Grundlage mit dreistelliger Tafel. Freie Wortschreibung, komplette Sortierfolgen, fünfstellige Erweiterung und die volle Bündelungsbreite sind nicht belegt. | Z:76–119; I:1556–1584,1305 |
| 2 | Gerade/ungerade · 6–9 / 9–12 | Paare und Zehnerfelder zeichnen; Folgen und Parität von Summen untersuchen. | **Teilweise, normal:** Letzte Ziffer bei zwei- bis vierstelligen Zahlen; Paarpunkte auf Grundlage. Keine eigene Folge zum Erklären der Parität von Summen. | Z:122–127; I:1577–1580,1305 |
| 3 | Addition im Kopf · 10–13 / 13–16 | Fakten skalieren, verdoppeln, günstig umordnen und eine Strategie selbst wählen. | **Teilweise, normal:** Zehner/Hunderter addieren, Sprünge lesen, zu 100 ergänzen, fehlende Summanden und einfache Sachkontexte. Keine systematische Breite aller Buchstrategien. | Z:65–73,130–135; I:1437–1444,1586–1605,1614–1617 |
| 4 | Addition schriftlich · 14–18 / 17–21 | Offene Zahlenstrahlen; später Zahlen stellenrichtig untereinander schreiben und Verfahren vergleichen. Keine systematische Übertragsanleitung nachgewiesen. | **Teilweise, normal:** Vorgegebene Sprünge, Teil-Ganzes und Rechenweg auf Papier. Eigenes Anordnen in Spalten und schriftliches Verfahren nicht als Aufgabenfamilie belegt. | Z:65–73; I:1568–1571,3620–3674 |
| 5 | Subtraktion im Kopf · 19–22 / 22–25 | Fakten übertragen, Zehner/Einer zerlegen, Zehnerübergänge und Unterschiede erklären. | **Teilweise, normal:** Zehner/Hunderter abziehen, Rückwärtssprünge, Ergänzen zum Ganzen; vierstellige Subtraktion in zwei Schritten. Nicht die gesamte Strategieauswahl des Buchs. | Z:65–73,130–135; I:1502–1505,1851–1855 |
| 6 | Subtraktion schriftlich · 23–27 / 26–30 | Eigene Rückwärtssprünge und stellenrichtige Spaltenschreibweise; Verfahren wählen. Keine systematische Entbündelungsfolge nachgewiesen. | **Teilweise, normal:** Vorgegebene Sprünge, zweischrittige Rechnung mit Erklärung und Papier-Rechenweg. `columnHTML` allein beweist kein erreichbares Verfahren; im geprüften Text fehlt ein Aufrufer. | Z:65–73; I:1228–1231,1502–1505,3620–3674 |
| 7 | Umkehraufgaben · 28–31 / 31–34 | Ganze Zahlenfamilien erzeugen; auch Mal/Geteilt und Kompensation durch Runden auf Zehner. | **Teilweise, normal:** Fehlender Summand, Gegenprobe durch Addition, passende Rechnerfolge und Prüfergebnis. Keine vollständige Mal-/Geteilt-Faktenfamilie. | I:1437–1439; Z:314–322; A:164,176 |
| 8 | Mal-/Geteiltfakten · 32–35 / 35–38 | Gruppen, Arrays, gerechtes Teilen, Tauschaufgaben und viergliedrige Faktenfamilien verbinden. | **Teilweise, Vorschau `times`:** Faktoren 2/3/4/5/10 mit 1–10, gleiche Gruppen und Punktfelder. Keine entsprechende Divisionsfaktenfamilie belegt. | I:1694–1713; Z:325–328 |
| 9 | Mal/Geteilt im Kopf · 36–39 / 39–42 | Zweimal verdoppeln/halbieren; Division über fehlenden Faktor; auch zweistellige Zahlen. | **Teilweise, Vorschau `times`:** Wiederholte Addition und Zählen in 2/3/4/5/10. Systematisches Halbieren/Dividieren und die größere Zahlenbreite nicht belegt. | I:1694–1713; Z:325–328 |
| 10 | Multiplikation schriftlich · 40–43 / 43–46 | Zweistellige Zahlen in Zehner/Einer zerlegen; Teilprodukte im Raster darstellen und addieren. | **Nicht belegt:** Kleine Malfakten und das Zählen von Rechteckflächen ersetzen dieses Verfahren nicht. | I:1694–1713,1736–1746 |
| 11 | Zahlbeziehungen · 44–47 / 47–50 | Umordnen und Gruppieren bei Plus/Mal; günstige Paare; Abkürzungen erklären und Grenzen bei Minus/Geteilt verstehen. | **Teilweise, normal:** Summen unterschiedlich zerlegen, andere Rechenwege und richtige Gleichungen wählen. Keine ausdrückliche vollständige Gesetzes-/Gegenbeispielfolge. | Z:224–238,272–275; I:1444,1465 |
| 12 | Brüche · 48–51 / 51–54 | Flächen und diskrete Gruppen teilen, selbst schraffieren, Zähler/Nenner, Fünftel, Äquivalenz und Ordnung. | **Teilweise, Vorschau `fractions`:** Gefärbte Balken k/n für Nenner 2/3/4/6/8, Stammbrüche vergleichen, 1/2, 1/3, 1/4 einer Menge. Kein eigenes Teilen/Zeichnen; Fünftel und die ganze Vergleichsbreite fehlen im geprüften Generator. | Z:331–344; I:1721–1726; N:34–37 |
| 13 | Bruchzahlenstrahl · 52–55 / 55–58 | Brüche eintragen, auf parallelen Strahlen vergleichen; über 1 hinaus mit gemischten Zahlen. | **Nicht belegt:** Vorhandene Zahlenstrahlen verwenden ganze Zahlen; die Bruchquest nutzt Balken und Mengen. | Z:65–73,331–344; I:1721–1726 |
| 14 | Geld · 56–59 / 59–62 | Dollar/Cent-Münzen kombinieren, möglichst wenige Münzen, Rückgeld hochzählen, auf 5 Cent runden. | **Nicht belegt:** Elternideen zu Geld sind keine Münz-/Preis-/Rückgeld-Aufgabenfamilie. Eine spätere Währungswahl wäre eigens zu entscheiden. | I:3860,3864,3897; Builder I:1305–1766 |
| 15 | Zahlenmuster · 60–63 / 63–66 | Auf-/absteigende Regeln, Ein-/Ausgabetabellen, eigene Folgen, zweischrittige Regeln. | **Teilweise, Vorschau `times`:** Nächstes Glied beim Zählen in 2/3/4/5/10. Keine freie Regelerzeugung oder zweischrittige Musterfamilie. | I:1709–1713 |
| 16 | Problemlösen · 64–67 / 67–70 | Gleichheit beider Seiten, Zahlensätze aus Texten erzeugen, passende Operation begründen, mehrschrittig lösen. | **Teilweise, normal:** Teil/Ganzes, fehlende Summanden, Plus/Minus wählen, ein-/zweischrittige Sachaufgaben, Gegenprobe/Überschlag. Papier-Rechenweg vorhanden; freie Formel-/Begründungseingabe samt Prüfung nicht belegt. | I:1437–1439,1490–1509,1611–1629,3651–3652; Z:297–322 |
| 17 | Länge/Fläche · 68–72 / 71–75 | Real schätzen/messen, cm/m und später mm/m²; Flächen zeichnen, zusammensetzen und vergleichen. | **Teilweise:** Normal `units`: Einheiten, cm/m, Umrechnen, Vergleichen, Meterstab ablesen. Vorschau `area`: Einheitsquadrate in Rechtecken, Umfang und Unterscheidung Fläche/Umfang. Kein reales Messen und keine volle Formenbreite. | Z:138–169; I:1631–1645,1728–1746 |
| 18 | Volumen/Kapazität · 73–77 / 76–80 | Würfelkörper zählen/bauen/zeichnen, cm³; Gefäße schätzen und praktisch ausmessen, mL/L. | **Teilweise:** Normal passende mL-Einheit; Vorschau `mass` mL/L wählen und Liter umrechnen. Würfelvolumen, Messbecher-Ablesen und praktisches Umfüllen nicht belegt. „Volumen“ als Falschantwort zählt nicht. | Z:138–149,347–360; I:1759–1766; N:49–52 |
| 19 | Masse · 78–81 / 81–84 | Reale Massen schätzen/ordnen, Balkenwaage nutzen, verschiedene Skalen, Unterschiede und Einzelmassen erschließen. | **Teilweise:** Normal g/kg und Einheiten; Vorschau `mass` kg→g, 500g+500g und lineare 100-g-Skala. Keine reale Waagenhandlung und keine volle Skalen-/Ordnungsbreite. | Z:138–149,219–221,358–366; I:1640–1642,1759–1766 |
| 20 | Zeit · 82–85 / 85–88 | Minutengenaue Uhrzeiten, eigene Zeiger, verstrichene Zeit über Stundengrenzen; h/min/s umrechnen. | **Teilweise:** Normal `numbers` Uhr lesen/wählen, AM/PM, überwiegend Fünfminutenraster; Grundlage volle/halbe Stunde. Vorschau `elapsed` Zeitspannen und Endzeiten mit Stundenwechsel. Kein durchgängiges Einminutenraster oder eigenes Zeigerzeichnen. | Z:32–62,352–355; I:1563–1567,1748–1755 |
| 21 | 2D-Formen · 86–89 / 89–92 | Nach Seiten, Winkeln und Parallelität klassifizieren, Eigenschaften formulieren, zerlegen/zusammensetzen. | **Nicht belegt:** Rechtecke in Flächenaufgaben bilden keine solche Formenlehre. Fachlichen Buchfehler zur Regularität beachten, Abschnitt 6. | I:1728–1746,2131–2175 |
| 22 | 3D-Formen · 90–93 / 93–96 | Körper benennen, Flächen/Kanten/Ecken vergleichen, zeichnen und Netze zuordnen. | **Nicht belegt:** Keine entsprechende registrierte Aufgabenfamilie gefunden. | I:1305–1766,2131–2175 |
| 23 | Winkel · 94–97 / 97–100 | Mit rechtem Winkel vergleichen, Drehrichtung beachten, gleiche Winkel in anderer Lage, eigene Beispiele. | **Nicht belegt:** Rampenneigung als Science-Variable und Uhrgrafiken ersetzen diese Aufgaben nicht. | A:26; I:1279,1686,2144 |
| 24 | Symmetrie · 98–101 / 101–104 | Achsen erkennen/zeichnen/zählen, eigene symmetrische Figuren und Spiegelbilder. | **Nicht belegt:** Keine entsprechende registrierte Aufgabenfamilie gefunden. | I:1305–1766,2131–2175; Z |
| 25 | Verschieben/Drehen · 102–105 / 105–108 | Viertel-/Halbdrehungen, Richtungen, Spiegeln unterscheiden; eigene Transformationsmuster. | **Nicht belegt:** Technische SVG-Drehungen sind keine Lernaufgaben dazu. | I:1143–1156,2131–2175 |
| 26 | Raster/Karten · 106–109 / 109–112 | Alphanumerische Rasterfelder, Karten und Wege; aus Bewegungsrichtung links/rechts; eigene Pläne. | **Nicht belegt:** `grid:true` ordnet Antwortknöpfe an und belegt keine Koordinaten-/Kartenaufgabe. | I:1244–1245,2658–2666,2131–2175 |
| 27 | Daten erheben · 110–113 / 113–116 | Eigene Fragen und passende Quellen, Befragung/Beobachtung, Daten als Liste/Tabelle/Strichliste organisieren. | **Teilweise, normal Science:** Vorgegebene Strichlisten zählen; Fragen zu Protokollen und fairen Versuchen. Elternidee für eigene Strichliste vorhanden. Keine freie Erhebung und Übernahme eigener Datensätze als Generatorhandlung. | I:1663–1670,1270–1279,3867; A:114–129 |
| 28 | Graphen · 114–117 / 117–120 | Aus Daten Säulen-/Bilddiagramme erstellen, beschriften und Darstellungsarten vergleichen. | **Teilweise, normal `graphs`:** Balken und Liniendiagramme lesen, Skalen/Titel/Beschriftungen beurteilen, Werte/Extrema. Kein eigener Diagrammeditor, keine Bilddiagrammfamilie. | Z:172–216; I:1403,1663–1678,3651 |
| 29 | Daten interpretieren · 118–121 / 121–124 | Summen, Differenzen, Gleichstände, Kategorien, eigene Aussagen und Darstellungsvergleiche. | **Teilweise, normal:** Tabellen- und Graphenwerte, Extrema, gerundete Summen und passende Schlussfolgerung wählen. Freie Aussagen und volle Interpretationsbreite nicht belegt. | Z:192–216,255–282; I:1465,1403 |
| 30 | Sortier-/Baumdiagramme · 122–125 / 125–128 | Venn/Carroll, Schnittmenge und Ausschluss, zwei Merkmale; Baumdiagramme für Münzen, Ziehungen und Kombinationen. | **Nicht belegt:** Vorhandene Tabellen und Balken ersetzen weder diese Sortierhandlungen noch kombinatorische Baumdiagramme. | Z:172–216,255–282; I:2131–2175 |
| 31 | Zufallsereignisse · 126–129 / 129–132 | Möglichkeiten systematisch erzeugen, Ereignisse vergleichen, unmöglich bis sicher unterscheiden und begründen. | **Nicht belegt:** Additive „Number Combinations“ sind keine Zufallskombinatorik. | Z:224–238; I:1444,2131–2175 |
| 32 | Zufallsexperimente · 130–133 / 133–136 | Vorhersagen, Münz-/Würfel-/Ziehversuche, Häufigkeiten, Wiederholungen und unterschiedliche Ergebnisse vergleichen. | **Nicht belegt:** Kontrollierte Reibungsversuche in Science sind ein anderer Lerngegenstand. | A:13–21; I:1270–1279,1686 |

### Stufen, Hinweise und andere Beispiele

Die Buchphasen lassen sich nicht automatisch mit den App-Stufen 1/2/3 gleichsetzen. Im Code ist unter anderem belegt:

- Grundlage-Familien für `numbers`, `round`, `combos`, `wordprob`, `detective`, `units`, `graphs` (I:1556–1678,1890–1893).
- Eigene höhere Aufgabenfamilien unter anderem bei Runden, Zahlzerlegungen und bestimmten Datenschlussfolgerungen (R:36–123; Z:272–275; I:1890–1893). Nicht jeder Builder enthält eine eigene Stufe 3. `adaptRound` mischt Vorhandenes, erzeugt aber keinen fehlenden fachlichen Inhalt (I:1953–1974).
- Die fünf Vorschauquests erzeugen in ihren normalen Buildern Stufe 2. Kleine separate Grundlage-Fälle existieren für deren **Neuland-Platz in Practise Today**, je drei Fälle (N:29–52; I:2177–2179; P:19–34,87–88). Das ist kein Nachweis einer vollständigen Grundlage- oder Erweiterungsfolge dieser Quests.
- Hinweise verwenden spezifische Coach-Familien, Aufgaben-Tipps oder allgemeinere Questhinweise (I:1801–1837). Andere ausgearbeitete Grundlage-Beispiele sind vorhanden, einschließlich einer ausdrücklichen Ausnahme für `units/3` bei eigener Antwort „1 m“ (B:76–94; I:2916–2928). Hinzu kommt `MATH_EXAMPLES` (I:2782–2836). Ausgearbeitete andere Beispiele sind damit **nicht für jeden Aufgabentyp garantiert**.

Die mathematischen Bildschirmaufgaben verwenden Antwortauswahl oder Zifferneingabe; die geprüfte Eingabetastatur nimmt bis zu vier Ziffern auf (I:2662–2683). Für freie Zeichnungen, Formeln und Begründungstexte ist dort keine gleichartige Antwort-/Bewertungsstrecke belegt. Die Papiermöglichkeit bleibt dabei ausdrücklich berücksichtigt.

## 4. Was die Analyse für Lernstand und Toddle bedeutet

**Ein Buchinhalt ist keine Feststellung einer Lernlücke.** Ob ein bestimmtes Kind Brüche, Karten oder Geometrie üben muss, lässt sich aus diesem Buch nicht ablesen. Schulische Einstufungen kommen weiterhin aus der Lehrkraftquelle; das Buch liefert keine NA/RS/C/M/E-Bewertungen ([G1](../konzept/evaluationen-uebernahme.md#2-grundsätze)).

Die bekannte Standardliste enthält aktuell unter anderem Stellenwert bis 9999, Zahlvergleich, Runden, Additions-/Subtraktionsstrategien, Kontrolle, Daten und Längen (S:5–12). Diese Begriffe überschneiden sich mit Teilen des Buchs; sie belegen keine vollständige Zuordnung aller 32 Topics zum Unterricht. Die fünf Vorschauquests haben im geprüften Katalog keine Standardzuordnung.

Eine vorhandene Nebenverbindung zwischen Quest und Standard löst nicht automatisch die Hauptstandard-Lückenregel aus. `numbers` hat beispielsweise M-N1 als Haupt- und M-N2 als Nebenstandard; schulischer Ausgangswert und Lückenwirkung dürfen nicht aus jedem beliebigen Bezug abgeleitet werden (S:1–12; I:2207,6280–6283). Die besondere Pilot-Zuordnung M-N5→`two-step` ist konfigurationsabhängig (I:6228–6268; `src/module/ereignisse.mjs:18–21`).

**Ein sicherer Quest-Stand bedeutet nicht „das ganze Buchtopic beherrscht“.** Time & Numbers bündelt beispielsweise Uhrzeit, Stellenwert, Zahlenstrahl und gerade/ungerade Zahlen. Ein gemeinsamer Stand kann nicht als Einzelbeleg für jede Buchteilfertigkeit ausgegeben werden. Peters bestehende Entscheidung für **einen gemeinsamen Quest-Stand** bleibt maßgeblich; diese Analyse führt keine neue Lernziel-/Nachweismatrix, Zeitbedingung oder Bewertungsschwelle ein ([Inhalt/Motivation, Abschnitt 2](../konzept/inhalt-motivation-entscheidungen.md#2-grundlage-woran-können-gemessen-wird-entscheidung-w1)).

Die Jahreserweiterung ist bereits als späteres Vorhaben vorgesehen ([E7](https://github.com/pahlborn/bis-school-app_src/blob/81b5a96e0075f12890cda3638ce96ac542e9ebda/docs/konzept/evaluationen-uebernahme.md#L19)). Ein Buch kann dafür ein guter Prüfrahmen sein. Bekannte Schulcodes werden aber weiterhin aus Schulquellen gepflegt; aus Buchüberschriften werden **keine neuen Standards auf Vorrat** erfunden ([EV-3, Pflege](../konzept/evaluationen-ziel1-epics.md#pflege-standard-ergänzen)). Ein Standard ohne passende Quest erzeugt keine neue Übung durch den Import allein.

## 5. Empfohlene Weiterentwicklung – noch nicht beauftragt

Die Reihenfolge sollte sich aus **belegtem Unterrichtsbedarf und den vorhandenen Grundlagen** ergeben. Das Buch rechtfertigt weder 32 neue Quests auf einmal noch ein automatisches Freischalten aller Vorschauthemen. Folgende Schritte bieten sich an:

| Reihenfolge | Vorschlag | Woran eine spätere Umsetzung zu erkennen wäre |
|---|---|---|
| 1 | Bestehende Quests fachlich vertiefen, zuerst dort, wo reale Schulstandards und Buchanforderungen zusammenfallen: Stellenwert/Bündelung, Plus/Minus-Strategiewahl, Gegenprobe und Interpretation. | Nicht nur neue Zahlen: Das Kind bearbeitet eine bislang fehlende Darstellung oder wählt/begründet einen anderen Rechenweg. Dazu passend ein anderes Beispiel, typische Denkfehler als Falschantworten und reproduzierbare Aufgabenprüfungen. |
| 2 | Die fünf vorhandenen Vorschauquests einzeln gegen den tatsächlichen Bedarf prüfen und gezielt vervollständigen. Vorrangig fehlen im Buchvergleich Division/Umkehrfamilien, Bruch-Zahlenstrahl und ein belastbarer Übergang von Anleitung zu eigenständiger Anwendung. | Ein freigegebenes Thema enthält die konkret vereinbarten Handlungen und Darstellungen; die drei Neuland-Grundlagefälle allein gelten nicht als fertiger Lehrgang. Schulzuordnung und Freigabe werden ausdrücklich entschieden. |
| 3 | Neue Inhaltsgruppen in kleinen Abschnitten planen: Geld; Formen/Winkel; Symmetrie/Transformation/Karten; Datenerhebung/Sortierdiagramme; Zufall. Reihenfolge innerhalb dieser Gruppe nach Schule und Bedarf. | Je Abschnitt ist benannt, was am Bildschirm geübt wird und was als Papier-/Alltagsauftrag erfolgt. Neue Aufgaben bleiben in der gemeinsamen Weblogik für Browser und iPad. |
| 4 | Bestehende Papier- und Elternbegleitung gezielt für produktive Handlungen nutzen: selbst zeichnen, messen, erklären, Daten sammeln, Versuche durchführen. | Eine konkrete passende Aufgabe ersetzt das bisher allgemeine Rechenwegfeld. Erfüllung und Beobachtung werden ehrlich beschrieben; eine richtige Auswahlantwort gilt nicht als automatisch geprüfte praktische Leistung. |

Die Schritte 1/2 und 4 können fachlich zusammengehören; sie sind keine starre neue Projektplanung. Vor Umsetzung sind Inhalt, Umfang, tatsächliche Schulzuordnung und Abnahmekriterien mit Peter zu entscheiden. Ein Beobachtungsbedarf allein rechtfertigt keinen Umbau des bestehenden Lernstandsmodells.

**Beispiel für eine sinnvolle Weiterentwicklung von Fractions:** Nicht nur andere gefärbte Balken erzeugen, sondern denselben Bruch zwischen Fläche, Menge und Zahlenstrahl wiedererkennen; anschließend auf Papier selbst darstellen und Gleichwertigkeit erklären. Dafür sind eigenständige neue Aufgaben und fachliche Prüfungen nötig. Es ist keine Funktion, die durch das bloße Hinterlegen des Buchs entsteht.

**Runden als Gegenbeispiel zur Buchhörigkeit:** Big Quest besitzt eine eigene, belegte Folge für Zehner/Hunderter/Tausender samt begründenden Fragen. Das Buch enthält Runden verteilt in Kompensation, Geld und Glossar, aber keine entsprechende eigenständige Tausender-Rundungsfolge. Die App muss deshalb nicht auf die Inhaltsübersicht dieses Bandes reduziert werden.

## 6. Fachliche Auffälligkeiten im Buch

Das Buch ist auch als fachliche Quelle einzeln zu prüfen. Folgende Befunde sind konkret belegt; sie bilden **keine vollständige Errataliste**:

| Stelle | Beobachtung | Bewertung und Folgerung |
|---|---|---|
| Druck 46 / PDF 49 | Im erklärenden Umkehrschema steht `9 − 5 = 5` neben `4 + 5 = 9`. Auf der Seite ist das kein Fehlersuchauftrag. | **Bestätigter Rechenfehler:** Richtig ist `9 − 5 = 4`. Bei eigenständiger Aufgabenentwicklung nicht übernehmen. |
| Druck 86 / PDF 89; Lösung Druck 151 / PDF 154 | Regelmäßigkeit wird allein mit gleich langen Seiten erklärt; ein schiefer Rhombus wird im Lösungsschlüssel ausdrücklich als regelmäßig eingeordnet. | **Bestätigter fachlicher Fehler:** Ein regelmäßiges Polygon hat gleich lange Seiten **und gleiche Innenwinkel**. Eine nichtquadratische Raute erfüllt das nicht. |
| Druck 124 / PDF 127; Lösung Druck 155 / PDF 158 | Zwei rote und zwei blaue Socken, zwei aufeinanderfolgende Entnahmen; Zurücklegen ist nicht genannt. Der Schlüssel nennt für Rot/Rot ein Viertel. | **Modellabhängiger Widerspruch:** Ohne Zurücklegen ist die Wahrscheinlichkeit `(2/4) × (1/3) = 1/6`; mit Zurücklegen wäre `1/4` richtig. Das Zufallsmodell muss ausdrücklich festgelegt werden. |

Außerdem darf ein Unit-Titel nicht mit geübtem Inhalt verwechselt werden: **„Fractions and decimals“ enthält im Hauptteil keine eigene Dezimalprogression.** Dezimalbegriffe stehen im Glossar (Druck 135 / PDF 138), Geldbeträge in U3. Gemischte Zahlen werden dagegen tatsächlich auf Druck 55 / PDF 58 verwendet. Prozent, Primzahlen oder Koordinatenbegriffe im Glossar belegen ebenfalls keinen entsprechenden Hauptteil-Lehrgang.

## 7. Abgeschlossen und offen

Abgeschlossen ist der quellengebundene Abgleich aller 32 Topics mit dem geprüften Produktstand, einschließlich Zugang, Teilfertigkeiten, Darstellungen, Handlungen, Stufen, Papierangebot und wesentlichen Grenzen. Der Bericht enthält Vorschläge, die sich auf diese Beobachtungen stützen.

Offen bleiben die reale Schuljahresplanung, die Priorität für einzelne Kinder, die tatsächlichen Freischaltungen, die Darstellung in einer veröffentlichten Fassung, Gerätebedienung und Lernwirksamkeit. Dafür wurden keine Ergebnisse erfunden. Es wurde keine App-Funktion geändert, keine neue Infrastruktur eingerichtet und nichts gemergt oder veröffentlicht.
