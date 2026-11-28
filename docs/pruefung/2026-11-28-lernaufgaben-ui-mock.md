# Unabhängiger HTML-Entwurf für Lernaufgaben

## Auftrag und Grenze

Peter beauftragt am 28.11.2026 einen agnostischen UI-Mock in HTML. Anhand bedienbarer Beispiele sollen geeignete Elemente, Bedienwege und Einsatzbedingungen entschieden werden. Das ist kein Auftrag, Big Quest umzubauen.

Basis: Produkt-`main` [`81b5a96e0075f12890cda3638ce96ac542e9ebda`](https://github.com/pahlborn/bis-school-app_src/commit/81b5a96e0075f12890cda3638ce96ac542e9ebda). Die fünf vorgegebenen Auftrags-/Konzeptquellen wurden vor der Arbeit in ihrer Reihenfolge gelesen. Ergebnisse bleiben im Produkt-Repo; der Mock liegt als neue, unabhängige Entwurfsdatei unter `docs/prototypen/` und wird nicht in die App eingebunden.

Die bestehende Auswahl, Mischung und Bewertung in Practise Today und auf Übungsblättern ist außerhalb dieses Entwurfs. Es gibt keine Schulzuordnung, keine echten Kinderbewertungen, Kontoanbindung oder Datenmigration. Die Beispiele sind erfunden. Aus einer Entscheidung für ein Bedienelement folgt noch keine Freigabe seiner Integration in Big Quest.

## Öffnen und besprechen

Datei: [lernaufgaben-ui-agnostisch.html](../prototypen/lernaufgaben-ui-agnostisch.html).

Die HTML-Datei ist als einzelne Datei zum Öffnen in einem Browser ausgelegt. Sie enthält ihre Darstellung und Bedienung selbst; es werden keine BQ-Dateien oder externen Ressourcen benötigt. Die Auswahl der Beispiele ist eine manuelle Navigation im Bedienlabor, keine neue Steuerung einer Übungsrunde. Eine DE/EN-Umschaltung ist vorhanden.

Der aktuelle Stand enthält zehn Beispiele: Bruchbild auswählen, Zahl eingeben, Bruch auf dem Zahlenstrahl platzieren, Zahlen zuordnen, eine Bruchfläche aufbauen, Balken aus Tabellendaten erzeugen, eine eigene Skizze zeichnen, eine reale Messung erklären, eine Textantwort auswählen und eine Reihenfolge bilden. Bei Skizze und realer Messung wird ausdrücklich keine automatische Richtigbewertung vorgetäuscht. Der erste Stand mit acht Beispielen und seine Prüfungen bleiben unten als V1 dokumentiert; die aktuelle Fortschreibung mit Familien als V2.

Für die Besprechung ist pro Beispiel zu entscheiden:

1. Passt die Bedienung zur geforderten mathematischen Handlung?
2. Ist sie mit Touch und Tastatur nachvollziehbar und korrigierbar?
3. Welche Antwort lässt sich automatisch prüfen, welche Leistung braucht menschliche Besprechung?
4. Wie wird dieselbe Aufgabe sinnvoll auf Papier gestellt?

In der getrennten Prüfansicht stehen je Typ Einsatzbedingungen, Bedienwege, Bewertungsgrenzen, die Entsprechung auf Papier und eine offene Entwurfsentscheidung. Unter „Passende Aufgabenfamilien (Beispiele)“ sind je drei bis vier Familien mit Status und gegebenenfalls Codebelegen aufgeführt. Pro Beispiel kann Peter „Geeignet“, „Weiter prüfen“ oder „Nicht nutzen“ markieren und eine Notiz ergänzen. „Entscheidungen herunterladen“ erzeugt eine Textdatei mit allen zehn Typen, Familien, Statusangaben und den eigenen Markierungen/Notizen.

Die aktuelle V3 ergänzt „Welcher Lernweg passt?“ mit einer begründeten Empfehlung sowie Bedingungen für digitale Bearbeitung, Papier oder reale Handlung. Direkt bei jeder Aufgabe führt „Zum Übungsblatt“ zur passenden Vorlage. „Zur Bildschirmaufgabe“ führt mit erhaltenen Eingaben zurück. Medienempfehlung und Gründe stehen ebenfalls im TXT-Export.

Markierungen und Notizen sind Vorschläge für die gemeinsame Entscheidung, keine Schulbewertungen. Sie bleiben ausschließlich im Arbeitsspeicher des geöffneten Dokuments. Sprachwechsel und „Aufgabe neu starten“ erhalten die Einschätzung und Notiz; „Alles zurücksetzen“ oder erneutes Öffnen verlieren sie. Für die Aufbewahrung dient der ausdrückliche Download. „Papieransicht“ und „Drucken“ zeigen das ausgewählte Beispiel mit leerer Arbeitsfläche, ohne vorherige Antworten oder Prüfansicht.

## Prüfung des ersten Stands (V1, acht Beispiele)

**Historischer, fest geprüfter HTML-Stand:** `469dae2ce3ca1fedcb7854e6bc993dba3a3cd957`, Datei-SHA-256 `168308169310053423faa22f089e25f9e16c45ba6a427dea06e9e2c3a657dfbb`, 54.012 Byte. Berichtskopf dieses ersten Stands: `c076551eb60787d0d19dc6a1a33d5147736d4bee`. Die folgenden Zahlen gelten dieser V1; die spätere Erweiterung erhält eigene Ergebnisse.

Atlas prüfte selbst mit vorhandenem Playwright und systemischem **Chromium 156.0.8078.79**. Ergebnis: **58 gezielte Prüfungen bestanden**, einschließlich einer emulierten Touchprobe, sowie **80 Ansichten** aus 8 Typen × DE/EN × 320/375/768/1024/1440 px ohne horizontalen Überlauf und mit mindestens 44 × 44 px großen sichtbaren Schaltflächen. **0 JavaScriptfehler, 0 Netzwerkanfragen** im abschließenden Lauf bei deaktiviertem Netzwerk.

| Prüfung | Tatsächlich beobachtet |
|---|---|
| Leere, falsche und korrigierte Antworten | Alle acht leeren Typen ohne Richtigmeldung; richtige Fälle für die sechs automatisch prüfbaren Typen; gezielte falsche Auswahl, Zahl, Bruchfläche und Zuordnung abgewiesen. |
| Touch und Tastatur | Bildwahl mit Leertaste, Zahlentastatur/Enter, Zahlenstrahl mit Pfeiltasten und emuliertem Antippen, korrigierbare Zuordnung, Diagrammgrenzen, Freihandzeichnung und verbundene Tastaturpunkte samt Rückgängig/Leeren. |
| Zeichnung und reale Handlung | Eingaben werden zur Besprechung bereitgestellt; es erscheint keine automatische Behauptung mathematischer Richtigkeit. |
| Sprachwechsel und Export | Zahl, Skizze, Messung, Entscheidung und Notiz bleiben erhalten; TXT-Download enthält alle acht Typen und die Testnotiz einschließlich Sonderzeichen. Ein neues Dokument startet ohne Markierungen. |
| Papier | Acht separate PDF-Druckproben, jeweils eine A4-Seite. Keine Prüfnotiz, Bewertungsspalte, vorige Skizze oder zuvor eingegebene Mess-/Antworttexte; Zahlenstrahl ohne Antwortpunkt. |
| Produktgrenze | Ausschließlich die neue HTML-Datei und dieser Bericht. Keine BQ-Skripte, externen Ressourcen oder dauerhaften Speicherzugriffe im Mock; keine Änderungen an vorhandenen Produktdateien, Version oder Workflows. |

Zwei konkrete Darstellungsbefunde wurden vor Abschluss korrigiert: SVG-Koordinaten berücksichtigen jetzt das tatsächliche Bildschirm-/SVG-Verhältnis; der rechte Zahlenstrahl-Endpunkt ergab vorher bei breiter Ansicht 7/8 statt 1. Zwei Schrittknöpfe waren bei 320 px knapp schmaler als 44 px; ihre Mindestbreite wurde ergänzt, ohne die Prüfung zu lockern. Die abschließende Probe lief mit diesen Korrekturen.

**Prüfgrenzen:** Der direkte `file://`-Aufruf wird in dieser verwalteten Browserumgebung mit `ERR_BLOCKED_BY_ADMINISTRATOR` gesperrt. Dafür wurden weder Richtlinien umgangen noch neue Browser installiert. Die Browserprüfungen luden dieselben HTML-Dateibytes mit `page.setContent` in einen leeren Browserkontext; erneutes Öffnen wurde mit einem neuen Dokumentkontext geprüft. Eine tatsächliche direkte Dateiöffnung bei Peter, echte iPad-/Safari-Bedienung, Screenreader-Abnahme und Lernwirksamkeit bleiben ungeprüft. Die Papierproben sind Browser-PDFs, keine echten Ausdrucke. Es gibt keinen behaupteten CI- oder Gerätelauf.

Es wurde keine volle BQ-Testsuite als Ersatz für die Prüfung des unabhängigen Mockups ausgeführt. Keine neuen Abhängigkeiten, Workflows, Server oder Hostingkonfiguration wurden eingerichtet. Die Wörterliste hat im HTML keinen wörtlichen Treffer; Diff/Dateiumfang werden vor der PR geprüft.

## Erweiterung: Familien und vorhandene Bedienformen (V2)

Peter bittet anschließend, passende Aufgabenfamilien je Bedienform zu zeigen und vorhandene BQ-Bedienformen einzubeziehen. Atlas hat dafür erneut den Produktstand `main@81b5a96e0075f12890cda3638ce96ac542e9ebda` und den genauen PR-252-Kopf geprüft. Es geht weiterhin nur um den unabhängigen Entwurf.

### Was im BQ-Aufgabenablauf bereits implementiert ist

Der normale Renderer unterstützt drei Antwortarten: **Auswahl** mit Text- oder Bild/HTML-Antworten, **Zahleneingabe** und **Reihenfolge durch aufeinanderfolgendes Antippen**. Belege: `index.html:1239–1258`, `:2662–2694`, `:3024–3038`. Die Zifferntastatur nimmt dort bis zu vier Ziffern auf. Die Papierdarstellung bildet diese Arten als Auswahl, Antwortzeile oder Nummerierung ab (`index.html:3648–3651`). Das ist ein statischer Codeabgleich des Aufgabenablaufs, kein Audit sämtlicher Konten-, Einstellungs- oder Erwachsenenformulare und kein Nachweis einer installierten Fassung.

V1 zeigte Bildauswahl und Zahleneingabe. Ein eigenes Textauswahl- und Reihenfolgenbeispiel fehlten; diese sind in V2 ergänzt. Damit sind die drei vorhandenen Antwortarten des normalen BQ-Aufgabenablaufs als repräsentative Beispiele einbezogen. Es ist kein identischer Nachbau aller Eingabegrenzen, Hilfen und Bewertungsabläufe von BQ. Gruppen-Zuordnung ist eine andere Bedienung als Reihenfolge. Eine vorhandene Grafik ist ebenfalls kein Beleg für ein interaktiv veränderbares Diagramm oder einen beweglichen Zahlenstrahlpunkt.

### Familien und Bedienformen getrennt beurteilen

Die angezeigten Familien sind fachliche **Beispiele**, kein vollständiger Katalog aller BQ-Aufgaben oder ein neuer Lehrplan. Die Kennzeichnung hat zwei Ebenen: Ist die **Bedienform** in BQ vorhanden? Und ist die **fachliche Familie** vorhanden, nur freischaltbare Vorschau, verwandt mit anderer Bedienung oder ein neuer Vorschlag? „Verwandt“ behauptet ausdrücklich keine Gleichwertigkeit der geforderten Handlung.

Die folgenden Primärquellen beziehen sich auf denselben Main-Commit. `I` bezeichnet `index.html`, `Z` `src/module/zahlenfragen.mjs`, `R` `src/module/rundungsfragen.mjs`.

| Bedienform im Entwurf | Codeabgleich und passende fachliche Beispiele |
|---|---|
| Bild auswählen | Bedienform vorhanden. Passendes Uhrbild wählen ist regulär belegt (`Z:45–54`, `I:1305`). Bruchanteile erkennen ist Vorschau (`Z:331–338`, `I:1726,2140`), dort allerdings Balken im Fragetext mit **Textantworten**; das Bruchbild-Auswahlbeispiel des Mockups ist eine neue Darstellungsvariante. |
| Zahl eingeben | Bedienform vorhanden. Fehlenden Summanden finden (`I:1437–1439`), Rest-/zweischrittige Sachaufgaben (`I:1490–1505`) und Strichlisten zählen (`I:1669`) sind regulär; Malfakten und Bruchteil einer Menge sind Vorschau (`I:1694–1726,2139–2140`). |
| Punkt platzieren | Neue Bedienform. Ganze Zahlen oder Brüche selbst platzieren sind Vorschläge. Zahlenstrahlsprünge ablesen ist verwandt, aber in BQ als Auswahlantwort umgesetzt (`Z:65–73`). |
| Gruppen zuordnen | Neue Bedienform. Gerade/ungerade unterscheiden ist regulär als einzelne Auswahlfrage belegt (`Z:122–127`); mehrere Zahlen in Gruppen einteilen ist eine andere Handlung. Formen nach Eigenschaften oder in zwei Merkmalen sortieren sind Vorschläge. |
| Fläche aufbauen | Neue Bedienform. Bruchteile selbst färben, Flächen zusammensetzen und Symmetriebilder ergänzen sind Vorschläge. Der vorhandene Vorschau-Balken wird abgelesen (`Z:331–338`), nicht vom Kind eingefärbt. |
| Balken bauen | Neue Bedienform. Daten aus Tabelle oder eigener Erhebung darstellen sind Vorschläge. Vorgegebene Balken, Skalen und Linien lesen ist regulär vorhanden (`Z:172–216`, `I:1403,2146`), kein Diagrammeditor. |
| Skizze zeichnen | Neue Bildschirmbedienung. Formen, Symmetrien und Netze selbst darstellen sind Vorschläge. Vorhandene freie Papierfelder für Rechenweg/Erklärung (`I:3623,3651–3674`) sind Arbeitsraum, keine automatisch bewertete Zeichenfamilie. |
| Messen und erklären | Die reale Handlung mit eigener Erfassung und Erklärung ist ein Vorschlag. Einheiten wählen oder eine vorgegebene Linealmarke ablesen ist regulär vorhanden (`Z:138–169`), aber belegt kein reales Anlegen und Messen. |
| Text auswählen | Bedienform vorhanden. Stellenwert (`Z:76–119`), gerade/ungerade (`Z:122–127`), Runden (`R:36–62,117–123`), Einheitenwahl (`Z:138–149`) und Diagrammlesen (`Z:172–216`) enthalten konkrete Auswahlfragen. |
| Reihenfolge bilden | Bedienform vorhanden. Versuchs-/Methodenschritte (`I:1270–1279`), OREO-Absatz (`I:1332–1335,1466`), Erzähl-/Anleitungssätze in Specific Examples (`I:1417–1431`) und deutsche Anleitung (`I:1523`) sind regulär belegt. Eine neue mathematische Zahlen-Sortierfamilie folgt daraus nicht automatisch. |

Die fünf Vorschauquests sind `times`, `fractions`, `area`, `elapsed`, `mass` (`I:2139–2143`); tatsächliche Freischaltungen einzelner Kinder bleiben unbekannt. Aus diesem Abgleich werden keine Standardcodes, Schulbewertungen oder produktiven Questzuordnungen erzeugt.

### Prüfung der Erweiterung

**Fest geprüfter V2-HTML-Stand:** `e9be7a781664b53fea1d5a75a133103f18585163`; Datei-SHA-256 `5019e5b4cdb5e0c00e91a95213978f7c0794d333bb674d0a644a7d792a583419`, 72.672 Byte. Dieser Bericht ändert die geprüften HTML-Bytes nicht.

Atlas las alle 36 beispielhaften Familienzuordnungen und ihre getrennten Statusangaben gegen die oben genannten Main-Quellen. Das sind Zuordnungen einschließlich verwandter Inhalte, keine Behauptung von 36 unterschiedlichen oder vollständig implementierten Familien. Vorhanden/Vorschau/neue Bedienung werden nicht miteinander verrechnet.

Die eigene abschließende Browserprüfung mit Chromium 156.0.8078.79 ergab **89 bestandene gezielte Prüfungen** sowie **100 Ansichten** (10 Typen × DE/EN × 320/375/768/1024/1440 px) ohne horizontalen Überlauf und mit Schaltflächen ab 44 × 44 px. Beobachtet wurden:

- Alle zehn leeren Antworten ohne Richtigmeldung; passende Status- und Familiensektion für jeden Typ.
- Bisherige acht Bedienwege erneut geprüft. Textauswahl und Reihenfolge zusätzlich leer, falsch, unvollständig, richtig, per Tastatur und nach Korrektur; Reihenfolge auch mit emulierten Touch-Eingaben.
- Textantwort, Reihenfolge, Notiz und Entscheidung beim Sprachwechsel erhalten. Familien und Status auf Englisch; TXT-Export mit allen zehn Typen, Familien, Status, Notiz und Quellenstand.
- Zehn getrennte Browser-PDF-Druckproben, jeweils eine A4-Seite, ohne Familien-/Prüfspalte, Notiz oder vorherige Antwort. Die Reihenfolgeaufgabe bleibt auf Papier ungeordnet und unnummeriert.
- **0 JavaScriptfehler und 0 Netzwerkanfragen** im abschließenden Lauf mit deaktiviertem Netzwerk. Vorhandene Quellenlinks wurden nicht automatisch geöffnet. Wörterliste ohne wörtlichen Treffer im HTML; Diffumfang weiterhin nur die zwei Entwurfs-/Prüfdateien gegenüber Main.

Die oben beschriebenen Grenzen bleiben bestehen: `page.setContent` derselben HTML-Bytes wegen administrativ gesperrter Datei-Navigation; kein echter iPad-/Safari-/Screenreader-Test, kein Auslieferungsnachweis und keine volle BQ-Testsuite. Die V1-Zahlen werden nicht als neue Ausführung ausgegeben.

## Erweiterung: begründeter Wechsel zwischen digital und analog (V3)

Peter legt für die nächste Fortschreibung fest: Digital arbeiten, wenn es für das Lernziel sinnvoll und erfolgversprechend ist; andernfalls Übungsblätter und reale Handlungen nutzen. Der Mock soll diese Wahl und den Ausweichweg begründen. Ausgangspunkt ist der geprüfte PR-Kopf `f3b3589236dc019b0a614dd0a26edc3304b2b778`; das Produkt-Main bleibt unverändert.

Die Empfehlungen sind **begründete Entwurfsentscheidungen**, keine gemessenen Wirksamkeitsnachweise oder von Oxford vorgegebenen digitalen Bedienregeln. Maßgeblich ist die geforderte Lernhandlung. Eine Zahl am Bildschirm kann ein Ergebnis zeigen; sie belegt nicht automatisch Rechenweg, eigene Konstruktion oder korrektes reales Messen.

Übungsblätter sind dabei ein regulärer Lernweg. Der Wechsel soll die Aufgabe auf Papier verständlich ausführbar machen, statt bloß eine Bildschirmansicht auszudrucken. Ohne Drucker kann das Kind die Aufgabe am Bildschirm lesen und auf einem Blatt oder im Heft bearbeiten. Ein reales Lineal oder andere Materialien lassen sich durch den Bildschirm nicht ersetzen.

Pro Beispiel sind Empfehlung, Nutzen der digitalen Variante, Gründe für Papier/reale Handlung, Material und Grenze der Ergebnisprüfung sichtbar. Der direkte Weg zum ausgewählten Übungsblatt und zurück erhält die bisherige digitale Antwort sowie Notizen und Markierungen. Das Blatt bleibt für die eigene Bearbeitung leer. Es wird weder eine Papierleistung automatisch als richtig gewertet noch eine BQ-Erledigung gespeichert.

| Gezeigte Beispiele | Empfehlung im Entwurf | Begründung und analoger Weg |
|---|---|---|
| Bild-/Textauswahl, vorgegebene Reihenfolge | Digital sinnvoll | Vorgegebene Antworten oder Schritte vergleichen. Für eigene Zeichnung, Rechnung, längere Texte und selbst formulierte Anleitungen bietet Papier freien Arbeitsraum. |
| Zahleneingabe | Kombination | Das Zahlenergebnis ist vergleichbar; der eigene Rechenweg und die Strategie werden auf Papier gezeigt und besprochen. |
| Zahlenstrahl, Bruchraster, Balkendiagramm | Kombination | Die digitale Vorlage unterstützt begrenzte Eingaben. Eigene Einteilung, gleichmäßiges Teilen oder freier Diagrammaufbau brauchen zusätzliche Konstruktion. Die vorhandenen Papierentwürfe geben Achtel bzw. Diagrammachsen/Skala weiter vor; sie behaupten keine Prüfung freier Skalierung. |
| Eigene Skizze | Übungsblatt bevorzugt | Eigenes Zeichnen und der Gebrauch von Lineal oder Geodreieck werden auf Papier sichtbar. Eine digitale erklärende Skizze bleibt mit passender Eingabe möglich. |
| Reales Messen | Reale Handlung nötig | Ein echtes Blatt und ein Lineal sind erforderlich. Bildschirm, Übungsblatt oder Heft können die Beobachtung dokumentieren; sie ersetzen das Anlegen und Ablesen nicht. |

Diese Empfehlungen gelten für die konkrete Beispielaufgabe und ihr Lernziel, nicht pauschal für jede Familie unter einer Bedienform. Beide Wege sind im Entwurf zugänglich. Bei Skizze und Messung ist der analoge Weg hervorgehoben; die digitale Gesprächsaktion bleibt zum Vergleich verfügbar.

### Prüfung der Medienwege

**Fest geprüfter V3-HTML-Stand:** `c5c4d68b7fb8bb0ed96815b6ee2b1209a4b7c7ab`; Datei-SHA-256 `ec44ba77cf37878250b8f79287ce5daec2a1ba1f5fb0c584cb923e626d6a39fd`, 89.153 Byte. Dieser Bericht ändert die geprüften HTML-Bytes nicht. Die 36 Familienzuordnungen samt Quellenblock sind gegenüber V2 bytegleich.

Atlas hat die zehn Medienempfehlungen und Begründungen vollständig gelesen und die fertige Übergabe selbst mit Chromium 156.0.8078.79 geprüft: **174 gezielte Prüfungen bestanden**, **100 Bildschirmansichten** ohne Überlauf und mit Schaltflächen ab 44 × 44 px sowie **20 einseitige A4-PDF-Proben** (zehn Beispiele jeweils in DE/EN).

- Zehn unterschiedliche, auf die konkrete Aufgabe bezogene Begründungen samt digitalen/analogen Bedingungen, Material und Prüfgrenzen vorhanden. Der analoge Weg bei Skizze/Messen ist die hervorgehobene Aktion.
- Für alle zehn Beispiele in DE und EN: direkter Wechsel per Tastatur zum Blatt, Fokus auf der Papierüberschrift, Rückweg mit Fokus auf „Zum Übungsblatt“. Die vollständigen Antwort- und Reviewdaten blieben exakt erhalten, einschließlich Skizze, Zuordnung, Teilreihenfolge und Notizen/Markierungen. Eine zusätzliche emulierte Touchprobe bestätigte Hin-/Rückweg mit erhaltener Reihenfolge.
- Alle zwanzig Papieranweisungen sind analog formuliert; keine Anweisungen zum Tippen/Klicken und keine vorherigen Antworten oder Reviewnotizen. Druckausgaben enthalten weder Familien-/Prüfspalte noch Bildschirm-Eingabesteuerung. Material und der Weg ohne Drucker sind in der Vorschau sichtbar.
- TXT-Exporte in DE/EN enthalten Medienempfehlung und Begründung für alle zehn Beispiele. Zeichnung und reale Messung geben weiter keine automatische Richtigmeldung aus.
- 100 Bildschirmansichten aus zehn Typen × DE/EN × 320/375/768/1024/1440 px geprüft. **0 JavaScriptfehler und 0 automatische Netzwerkanfragen** bei deaktiviertem Netzwerk. Die Wörterliste hat im HTML keinen wörtlichen Treffer.

Die Prüfgrenzen bleiben dieselben: identische HTML-Bytes über `page.setContent` wegen administrativ gesperrter Datei-Navigation; keine echte iPad-/Safari-/Screenreader-Abnahme, keine physischen Ausdrucke und kein Lernwirksamkeitsnachweis. BQ-Code, BQ-Testsuite, Version, Speicherung und Veröffentlichungswege wurden nicht geändert. Frühere V1-/V2-Prüfungen bleiben getrennt dokumentiert.

## Verantwortliche und nächster Schritt

Umsetzung: tatsächliche freigegebene Codex-Entwicklungsvertretung `dev_agnostic_ui_mock_20261128`, zuerst eigener Produktzweig `mock/lernaufgaben-ui-dev-20261128`; für die Familienfortschreibung neuer Worktree/Zweig `bq-ui-familien-dev-20261128` / `mock/lernaufgaben-familien-dev-20261128` ab PR-Kopf `c076551eb60787d0d19dc6a1a33d5147736d4bee`, HTML-Lieferung `49fa7cf5235d860175d4b4210adcffe2356b2725`. Atlas führt im unveränderten PR-Zweig `mock/lernaufgaben-ui-20261128` zusammen und prüft Quellen und Bedienung selbst. Es wurde kein Claude-/Forge-Lauf behauptet.

Medienwege V3: dieselbe tatsächliche Codex-Vertretung im neuen Worktree/Zweig `bq-ui-analog-dev-20261128` / `mock/lernaufgaben-analog-dev-20261128` ab `f3b3589236dc019b0a614dd0a26edc3304b2b778`, HTML-Lieferung `1fd66e22f76ce5744fbb8b9826ac89cf746cd796`. Atlas hat sie in denselben PR übernommen und wie oben beschrieben selbst geprüft.

Peter bespricht anschließend den Entwurf. Umfang und Freigabe einer späteren BQ-Integration werden getrennt festgelegt. Kein Main-Merge und keine App-Veröffentlichung aus diesem Auftrag.
