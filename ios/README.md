# Big Quest · iPad-MVP mit Toddle und Claude

Das Xcode-Projekt öffnet die bestehende Big-Quest-Testseite in der App. Über **Toddle-Feld prüfen** öffnet sich Toddle mit eigener Browsersitzung. Der native Claude-Aufruf verwendet den Schlüssel der Familie im iPad-Schlüsselbund.

## Auf dem iPad abnehmen

1. `ios/BigQuestMVP.xcodeproj` in Xcode öffnen, das Entwicklungsteam im Target **BigQuestMVP** auswählen und das Projekt auf einem iPad starten.
2. In Big Quest **Claude-Schlüssel** öffnen und den eigenen Anthropic-API-Schlüssel hinterlegen.
3. **Toddle-Feld prüfen** öffnen, **Family account** wählen und sich regulär anmelden. Die echte Evaluation öffnen und genau einen sichtbaren Feldwert ohne personenbezogene Angaben markieren, etwa den Evaluationstitel.
4. **Markierten Wert aus Toddle lesen** tippen. Den angezeigten Wert mit Toddle vergleichen und **Diesen Wert an Claude senden** bestätigen.
5. Bestanden ist der Ablauf erst, wenn der angezeigte Wert aus Toddle stammt und Claude ihn unverändert zurückgibt. Für den Nachweis genügen iPadOS-Version, Build-Commit, sichtbarer Feldtyp und Ergebnis. Schlüssel, Kontodaten und personenbezogene Inhalte gehören nicht ins Protokoll.

Die App verwendet für den Aufruf ausschließlich den markierten Wert. Der MVP speichert keine Bewertung und verändert keine Aufgaben. Der Anthropic-Schlüssel wird lokal im Schlüsselbund hinterlegt. Eine Toddle-Anmeldung per SSO kann in einer eingebetteten Webansicht anders ablaufen als in Safari und gehört zum Gerätetest.

## Buildprüfung im Simulator

```sh
xcodebuild -project ios/BigQuestMVP.xcodeproj -scheme BigQuestMVP \
  -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

Der Simulator-Build prüft die Kompilierung. Die Abnahme oben erfordert ein echtes Toddle-Elternkonto, einen Anthropic-Schlüssel und ein iPad.

## Eine Bewertungszeile in Big Quest übernehmen

Die Zeilenübernahme benötigt den Big-Quest-Testbuild mit `schul-zeilenentwurf`. In Big Quest zuerst als Elternteil anmelden, das richtige Kind wählen und **Schulische Einstufungen** öffnen. Dann **Toddle-Feld prüfen** öffnen, in der Evaluation die Einstufung einer Zeile markieren und **Bewertungszeile lesen** tippen.

Die App liest Kriterium und Einstufung aus derselben sichtbaren zweispaltigen Zeile. Sie zeigt beide Werte vor dem Claude-Aufruf. **Lernziel vorschlagen und Entwurf öffnen** sendet ausschließlich den Kriterientext und öffnet bei passender Zuordnung den vorhandenen Bewertungsentwurf. Titel und Bewertungsdatum werden im Entwurf ergänzt. Die Übernahme erfolgt erst nach Vorschau und Bestätigung.

Für die Geräteabnahme die BIS-Zeile zur zweischrittigen Subtraktion verwenden. Der Vorschlag muss M-N5 und die originale Einstufung C zeigen. Nach Bestätigung und Abgleich soll das Kind in einer neuen Runde genau eine passend zugeordnete Aufgabe erhalten.
