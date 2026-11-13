# BQ-KI: Integration in den normalen Eltern-/Kinderpfad (Start 13.11.2026)

## Freigabe und Grenze
Peter hat am 13.11.2026 den Beginn der echten Big-Quest-Integration freigegeben; der aufwendige lokale Pilot wird nicht weiter ausgebaut. Feinheiten dürfen später folgen; **Kindzuordnung, Datenschutz, keine erfundenen Einstufungen, Datenverlust und Zugangssicherheit** bleiben Freigabebedingungen.
**Änderungen nur am isolierten Branch.** Kathies produktive App, produktive Schulkonten, echte Schuldaten und laufende Releases bleiben unberührt.

## Nachgewiesener technischer Stand
- PR #192, Quellstand `e6d7ff462d25ef4c561a137b3d4e44ebbc394f7a`: gemeinsames Evaluationsformular, `school_evaluation`-Ereignisse mit Kindbindung, Revision/Zurücknahme, bestehender Schul-Abgleich und begrenzte Übungsableitung auf `M-N5` und `M-N3` im **geschützten Testbau**.
- Der native Swift-Toddle-Reader liest aus einer **angemeldeten Toddle-Webansicht**; es gibt in diesem Code keinen verifizierten Toddle-API-Abruf. Die aktuelle `Student-ID` aus einem externen System ist **keine bereits vorhandene, bestätigte Toddle-API-Anbindung**.
- Der native Claude-Zugang benutzt aktuell einen **gerätegebundenen Anthropic-API-Schlüssel in Apple Keychain** (`ClaudeKey`), nicht einen pro Familie verschlüsselten zentralen Dienst.
- Der geschützte Testbau verwendet derzeit GitHub-Token im Webspeicher (`bqt_gh`) für den privaten Testdatenspeicher. Dieser Weg ist kein abschließend freigegebenes Verbraucher-Login.
- Die native `ClaudeClient`-Anfrage überträgt bisher den vom Elternteil freigegebenen **Quelltext** an Anthropic; eine Aufforderung an das Modell, Namen aus dem *Ergebnis* zu entfernen, ersetzt **keine Anonymisierung vor Versand**.

## Schritt 1 – hier umgesetzt
Die native iPad-Hülle öffnet standardmäßig die **reguläre, geschützte Big-Quest-Test-App** unter `https://big-quest-test.github.io/` statt der getrennten lokalen Demo. Der native Übergabekanal wird auf das explizit erlaubte Hauptdokument derselben Test-Origin erweitert. Vorhandene isolierte Vorschaupfade bleiben als kompatible Testpfade zulässig.

Die echte Anmeldung, Eltern-/Kinderauswahl, Evaluationserfassung, Bestätigung und Mehrgeräte-Synchronisierung kommen so wieder aus **dem bestehenden App-Kontomodell**. Der native Schlüsselbund wird nicht durch einen öffentlichen API-Schlüssel ersetzt. Noch **kein Deployment**; nur Quell- und CI-Prüfung. Die derzeitige GitHub-Geräteverbindung ist dadurch nicht gelöst.

## Zielbild Echtbetrieb
1. Eltern melden sich normal bei Big Quest an und wählen ein eindeutig eigenes Kind. Die App verwendet dafür eine interne unveränderliche Kindkennung; keinerlei manuelle Student-ID-Eingabe je Evaluation.
2. Claude wird als **Big-Quest-Dienst** abgerufen. Das Anbieter-Geheimnis liegt in einem serverseitigen Secret Store und ist nie im ausgelieferten JavaScript, mobilen Bundle, Browser-LocalStorage, Elternprofil oder Git-Repository enthalten. Serverseitige Autorisierung an das angemeldete Elternkonto und dessen Kindzuordnung, Rate-/Kostenlimits und Lösch-/Protokollregeln sind zwingend.
3. Vor jedem externen KI-Aufruf personenbezogene Schüler- und Lehrkraftdaten **vor Übermittlung** verlässlich herausfiltern oder eine entsprechend freigegebene personenbezogene Verarbeitung nachweisen. Rohdaten nicht in Diagnose-Logs oder CI.
4. Externe Toddle-Student-ID nur speichern, **wenn** es einen verifizierten, autorisierten Abrufweg und einen nachvollziehbaren Zweck gibt. Dann verschlüsselt und zugriffsbeschränkt pro Kind/Familie, inkl. Rotation, Widerruf und Löschung. Die Kennung allein ist **keine Authentifizierung**.
5. Bis ein zulässiger automatischer Toddle-Zugang verfügbar ist: Eltern öffnen Toddle über einen bereits angemeldeten Sitzungsdialog und wählen die Evaluation; ohne Schülerkennung und ohne eigenes Schlüsselmanagement. Ein automatischer Hintergrundabruf wird nicht behauptet.
6. Der bestätigte Evaluationsdatensatz fließt in `school_evaluation` und die bestehenden Eltern-/Kinderansichten; neue Tagesrunden erhalten nur belegte, unterstützte Übungszuordnungen. Unbekannte Kriterien bleiben erhalten, aber ohne erfundene Aufgabe.

## Abnahme in zwei getrennten Stufen
**A – Integrationsstrecke (nächster technischer Schritt):** GitHub-CI baut den nativen Wrapper, der auf den geschützten Test-Root zeigt; Testfamilie meldet sich regulär an; Kindkontext und Formularquelle werden gebunden. Browser-Regressionen für gespeicherte Evaluation, Mehrgeräte-Abgleich und Aufgabenrunden bestehen. Keine echten Schuldaten im CI.

**B – Für reale Eltern/Kinder vor Freigabe verpflichtend:** Authentifizierung ohne GitHub-Schreibtoken beim Endnutzer; autorisierter, kostenbegrenzter Backend-Claude-Aufruf; Datenschutzprüfung vor KI-Versand; Zugriffs-/Kindzuordnungsprüfung serverseitig; Widerruf und Rotation; tatsächlicher Toddle-Gerätetest. Kein produktiver Rollout, solange diese Punkte fehlen.

## Nicht umfasst und nicht vorweggenommen
Keine stille Migration der lokalen Pilotdaten, keine neu erfundene Toddle-API, keine automatische Speicherung echter Toddle-Zugangsdaten im Familienprofil, keine eingebetteten Claude-Schlüssel, kein Wechsel von Produktivspeicher, keine PR-Merge-Freigabe.
