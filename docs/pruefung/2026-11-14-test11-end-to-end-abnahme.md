# Big Quest – Test 11, integrierter End-to-End-Abnahmelauf

Stand: 14.11.2026. Nur Testsystem. **Keine Produktivveröffentlichung.**

## Zu prüfende Fassung

- Quellrepository `pahlborn/bis-school-app_src`, Basis PR #192, Integration PR #198.
- Branch `feature/bq-evaluation-end-to-end-test11`, Version `0.153.4-beta`.
- iPad-Paket `Big-Quest-iPad-Test-11.swiftpm` aus dem gleichnamigen GitHub-Actions-Artefakt.
- Testseite `https://big-quest-test.github.io/probe-evaluation-form/`; synchronisierter Testdatenspeicher `pahlborn/bis-school-app-testdaten`.
- Test 10 bleibt als isolierte Referenz unverändert. Keine Verwendung realer Familien- oder produktiver Konten.

## Technische Freigabebedingungen vor Übergabe an den Nutzer

1. `Big Quest iPad build`, `Big Quest iPad Playgrounds Testpaket`, `Toddle evaluation reader` und `Evaluation form integration` beim **gleichen letzten Commit** alle erfolgreich.
2. Familien-/Produktiv-Build-Schutzprüfung aktiv und erfolgreich, insbesondere keine harte Testinstanz-URL in der Familienfassung.
3. Testseitendatei `probe-evaluation-form/index.html` identisch mit dem aus dem getesteten Quellstand gebauten HTML, außer explizit dokumentierten statischen Ressourcen. Die Root-Seite und sonstige Anwendungen unverändert.
4. Elternanmeldung, richtige Kindzuordnung und synchronisierter `school_evaluation`-Ereignisweg technisch durch Tests nachgewiesen. Keine Behauptung eines realen Toddle- oder iPad-Gerätetests vor der manuellen Abnahme.
5. Keine Passwörter, Zugangslinks, API-Schlüssel oder personenbezogenen Schuldaten in Protokollen, Screenshots oder Chat.

## Ein einziger abschließender manueller iPad-Test

**Vorbereitung:** Testpaket 11 in Swift Playgrounds öffnen. Der einmalig nötige Gerätezugang darf ausschließlich aus dem eigenen Test-Elternkonto übernommen werden; danach normale Anmeldung `max.mustermann`. Claude-Schlüssel wird höchstens einmal auf diesem iPad sicher im Keychain hinterlegt, nicht pro Evaluation. Den Passwort- oder Schlüsselwert nicht dokumentieren. Testkind `kind1.mustermann` unter „Schulische Einstufungen“ sichtbar prüfen; bei anderer Kindzuordnung abbrechen.

1. Über `Evaluation aus Toddle` dieselbe bereits überprüfte echte Mathematik-Evaluation öffnen und `Evaluation ins Formular übernehmen` wählen.
2. Quelle auf personenbezogene Angaben prüfen und gegebenenfalls bereinigen; `Mit Claude ins Formular übertragen` wählen.
3. Im gemeinsamen Big-Quest-Formular Titel, Datum, Fach, Lernziel, Arbeitsanweisung, Lehrkraftkommentar und **alle drei Originalkriterien mit jeweils C** gegen Toddle prüfen. Fehlende/abweichende Werte nicht erfinden.
4. `Vorschau anzeigen` wählen. Vor der Bestätigung darf kein neuer Bewertungseintrag vorhanden sein.
5. `Evaluation bestätigen` wählen. Auf explizite lokale Speicherung und erfolgreichen Geräteabgleich warten; bei Fehler nicht wiederholt blind bestätigen.
6. Gespeicherte Bewertung in „Schulische Einstufungen“ erneut öffnen: alle drei Kriterien, Originaltext und Einstufungen müssen unverändert sein. Swift Playgrounds vollständig schließen und erneut starten; erneut anmelden und die persistente Bewertung prüfen.
7. Für die **Übungsableitung** nur dann ein unterstütztes Übungsmuster zuordnen, wenn die Evaluation tatsächlich das dafür geeignete mathematische Lernziel enthält. Eine neue Tagesrunde im fiktiven Kinderkonto starten und das fachlich passende Übungsmuster prüfen. Falls keine echte Evaluation einen unterstützten Fokus enthält, den Übungsnachweis ausdrücklich als **offen** markieren, statt willkürlich eine Mathe-Zuordnung zu erzwingen.

**Bestanden:** richtige Kinderkonto-Zuordnung, unveränderte Originalbewertung, Vorschau ohne Schreibereignis, genau einmal bestätigter Eintrag, erfolgreicher Sync, persistente Anzeige nach Neustart sowie passende Übung (sofern durch reale Kriterien gedeckt). Kein E2E-Erfolg allein aus grüner CI ableiten.

**Teststopp:** unklare Kinderzuordnung, nicht belegte Einstufung, unvollständige Texte, fehlender Sync, anhaltender Zugangsfehler, fehlende Persistenz oder unpassende Übung.
