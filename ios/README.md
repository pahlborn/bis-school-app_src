# Big Quest iPad – Gemeinsames Evaluationsformular

Test 07 öffnet Big Quest unter `/probe-evaluation-form/` auf der Testinstanz. Im Elternbereich das Kind und **Schulische Einstufungen** öffnen.

- **Manuell:** **Evaluation hinzufügen** öffnet das Formular für das gewählte Kind.
- **Mit KI:** **Evaluation aus Toddle** öffnen, die Bewertung anzeigen und **Evaluation ins Formular übernehmen** wählen. Den erfassten Text im selben Big-Quest-Formular prüfen und persönliche Angaben entfernen. **Mit Claude ins Formular übertragen** befüllt den Entwurf.

Fach und Originalkriterien prüfen und gegebenenfalls ergänzen. Über **Vorschau anzeigen** und **Evaluation bestätigen** beim angezeigten Kind speichern. Der bestehende Geräteabgleich überträgt die gespeicherte Bewertung. Die App zeigt den Abgleichstatus an. Die vorhandenen Übungsmuster für Runden und zweischrittige Subtraktion können bei passenden Bewertungen ausdrücklich zugeordnet werden.

Der API-Schlüssel bleibt im iPad-Schlüsselbund. Der Aufruf ist auf das Formular der Testinstanz im Hauptfenster beschränkt. Die App liest den gerenderten Toddle-Text. Bilder und noch nicht geladene Inhalte können fehlen. Quellenbelege bleiben eine Prüfhilfe für Eltern.

Die automatisierte Browserprüfung nutzt den echten Formular-, Rechte- und Speicherpfad mit Testkonten und einer synthetischen Claude-Antwort. Der Lauf mit echter Toddle-Sitzung und Claude erfolgt anschließend auf dem iPad.
