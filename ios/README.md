# Big Quest iPad – Evaluation ins bewährte Formular

Test 06 liest den gerenderten Text der geöffneten Toddle-Evaluation ohne Tabellenannahmen oder Markierung. Verschachtelte Dialoge werden unterstützt. Das erfasste Dokument öffnet das lokale Formular mit der Gestaltung und den Feldern des ursprünglichen Übergabetests: Titel, Datum, Lernziel, Arbeitsanweisung, Lehrkraft-Rückmeldung. Die ursprüngliche einzelne M-N3-Einstufung ist zu einer Liste von Kriterien und Originalbewertungen erweitert, damit auch Englisch und mehrteilige Evaluationen erfasst werden können.

1. **Evaluation aus Toddle** öffnen und die gewünschte Evaluation anzeigen.
2. **Evaluation ins Formular übernehmen** antippen.
3. Erfassten Text auf Vollständigkeit und persönliche Angaben prüfen. Der Text kann vor dem Senden korrigiert werden.
4. **Mit Claude ins Formular übertragen** sendet genau den angezeigten Text über den bereits erprobten nativen API-Zugang. Der Schlüssel bleibt im iPad-Schlüsselbund und gelangt nie in JavaScript.
5. Formularangaben und Quellenbelege prüfen, gegebenenfalls korrigieren und **Vorschau anzeigen** wählen.
6. **Übergabe bestätigen** bestätigt nur die geöffnete lokale Vorschau.

Claude muss fehlende Angaben offenlassen und für Kriterien/Bewertungen wörtliche Quellenbelege zurückgeben. Die App prüft, dass der Beleg im erfassten Text vorkommt und Kriterium und gegebenenfalls Bewertung enthält. Diese Belegprüfung ersetzt die Elternprüfung der tatsächlichen Zuordnung nicht. Bei API-Fehlern bleibt der Quelltext erhalten. Änderungen an Quelle oder Formular verwerfen die davon abhängige Vorschau.

Die Erfassung liest DOM-Text der geöffneten Ansicht. Bilder, nachgeladene oder ausgeblendete Inhalte können fehlen. Eine vollständige echte Toddle-Evaluation ist erst nach Geräteabnahme nachgewiesen. Der DOM-Test verwendet ausdrücklich synthetische Seiten und führt den tatsächlichen nativen Erfassungscode aus. Der Formular-Test verwendet eine gekennzeichnete Testantwort für die mechanische Übertragung, keinen als echt behaupteten Claude-Aufruf.

Die Übungserzeugung und gemeinsame dauerhafte Speicherung der mehrteiligen Evaluation sind in diesem iPad-Stand noch nicht angeschlossen. Die bestehende Big-Quest-Web-App und ihre Datenpfade werden hier nicht verändert. Kein Merge oder Deployment durch diesen Test.

Technische Grundlage: Apple WKScriptMessageHandlerWithReply und WKWebView.callAsyncJavaScript. Der native Nachrichtenempfänger ist ausschließlich im lokalen Formular installiert und prüft Mainframe und lokale about:blank-Adresse. Toddle erhält keinen Zugriff auf den Empfänger. Die Formular-CSP verhindert Netzwerkzugriffe; Navigationen sind auf die lokale Seite beschränkt.

Prüfläufe: `.github/workflows/toddle-reader.yml` (Erfassung und Formular), vorhandener iPad-Simulator-Build. Swift-Playgrounds-Paket und Xcode-Build verwenden dieselben drei Swift-Dateien.
