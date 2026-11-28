# Unabhängiger HTML-Entwurf für Lernaufgaben

## Auftrag und Grenze

Peter beauftragt am 28.11.2026 einen agnostischen UI-Mock in HTML. Anhand bedienbarer Beispiele sollen geeignete Elemente, Bedienwege und Einsatzbedingungen entschieden werden. Das ist kein Auftrag, Big Quest umzubauen.

Basis: Produkt-`main` [`81b5a96e0075f12890cda3638ce96ac542e9ebda`](https://github.com/pahlborn/bis-school-app_src/commit/81b5a96e0075f12890cda3638ce96ac542e9ebda). Die fünf vorgegebenen Auftrags-/Konzeptquellen wurden vor der Arbeit in ihrer Reihenfolge gelesen. Ergebnisse bleiben im Produkt-Repo; der Mock liegt als neue, unabhängige Entwurfsdatei unter `docs/prototypen/` und wird nicht in die App eingebunden.

Die bestehende Auswahl, Mischung und Bewertung in Practise Today und auf Übungsblättern ist außerhalb dieses Entwurfs. Es gibt keine Schulzuordnung, keine echten Kinderbewertungen, Kontoanbindung oder Datenmigration. Die Beispiele sind erfunden. Aus einer Entscheidung für ein Bedienelement folgt noch keine Freigabe seiner Integration in Big Quest.

## Öffnen und besprechen

Datei: [lernaufgaben-ui-agnostisch.html](../prototypen/lernaufgaben-ui-agnostisch.html).

Die HTML-Datei ist als einzelne Datei zum Öffnen in einem Browser ausgelegt. Sie enthält ihre Darstellung und Bedienung selbst; es werden keine BQ-Dateien oder externen Ressourcen benötigt. Die Auswahl der Beispiele ist eine manuelle Navigation im Bedienlabor, keine neue Steuerung einer Übungsrunde. Eine DE/EN-Umschaltung ist vorhanden.

Acht Beispiele sind bedienbar: Bruchbild auswählen, Zahl eingeben, Bruch auf dem Zahlenstrahl platzieren, Zahlen zuordnen, eine Bruchfläche aufbauen, Balken aus Tabellendaten erzeugen, eine eigene Skizze zeichnen sowie eine reale Messung erklären. Bei den beiden letzten Beispielen wird ausdrücklich keine automatische Richtigbewertung vorgetäuscht.

Für die Besprechung ist pro Beispiel zu entscheiden:

1. Passt die Bedienung zur geforderten mathematischen Handlung?
2. Ist sie mit Touch und Tastatur nachvollziehbar und korrigierbar?
3. Welche Antwort lässt sich automatisch prüfen, welche Leistung braucht menschliche Besprechung?
4. Wie wird dieselbe Aufgabe sinnvoll auf Papier gestellt?

In der getrennten Prüfansicht stehen je Typ Einsatzbedingungen, Bedienwege, Bewertungsgrenzen, die Entsprechung auf Papier und eine offene Entwurfsentscheidung. Pro Beispiel kann Peter „Geeignet“, „Weiter prüfen“ oder „Nicht nutzen“ markieren und eine Notiz ergänzen. „Entscheidungen herunterladen“ erzeugt eine Textdatei mit allen acht Typen und den eigenen Markierungen/Notizen.

Markierungen und Notizen sind Vorschläge für die gemeinsame Entscheidung, keine Schulbewertungen. Sie bleiben ausschließlich im Arbeitsspeicher des geöffneten Dokuments. Sprachwechsel und „Aufgabe neu starten“ erhalten die Einschätzung und Notiz; „Alles zurücksetzen“ oder erneutes Öffnen verlieren sie. Für die Aufbewahrung dient der ausdrückliche Download. „Papieransicht“ und „Drucken“ zeigen das ausgewählte Beispiel mit leerer Arbeitsfläche, ohne vorherige Antworten oder Prüfansicht.

## Prüfung

**Fest geprüfter HTML-Stand:** `469dae2ce3ca1fedcb7854e6bc993dba3a3cd957`, Datei-SHA-256 `168308169310053423faa22f089e25f9e16c45ba6a427dea06e9e2c3a657dfbb`, 54.012 Byte. Der folgende Prüfbericht ändert diese HTML-Bytes nicht.

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

## Verantwortliche und nächster Schritt

Umsetzung: tatsächliche freigegebene Codex-Entwicklungsvertretung `dev_agnostic_ui_mock_20261128`, eigener Produktzweig `mock/lernaufgaben-ui-dev-20261128` am oben genannten Ausgangscommit. Atlas führt im Zweig `mock/lernaufgaben-ui-20261128` zusammen und prüft die Bedienung. Es wurde kein Claude-/Forge-Lauf behauptet.

Peter bespricht anschließend den Entwurf. Umfang und Freigabe einer späteren BQ-Integration werden getrennt festgelegt. Kein Main-Merge und keine App-Veröffentlichung aus diesem Auftrag.
