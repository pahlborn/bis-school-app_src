# Big Quest iPad – Integrationstest 11 (0.153.4 Beta)

Test 11 verbindet den auf dem iPad geprüften Toddle-Reader und den nativen Claude-Aufruf mit der bestehenden geschützten Big-Quest-Testoberfläche unter `https://big-quest-test.github.io/probe-evaluation-form/`.

**Wichtig:** Das ist nur der Integrations-Branch, kein Nachweis einer bereits veröffentlichten Testseite oder einer bestandenen Geräteabnahme. Die Testseite muss mit dem passenden Stand aus diesem Branch veröffentlicht werden. Test 10 bleibt als lokale, unabhängig verwendbare Referenz bestehen.

Der Elternteil meldet sich im geschützten Testkonto an, prüft das ausgewählte fiktive Kind unter „Schulische Einstufungen“ und beginnt über „Evaluation aus Toddle“. Der Quelltext wird ausschließlich beim identischen angemeldeten Kind in das gemeinsame Formular übernommen. Nach „Mit Claude ins Formular übertragen“ bleiben ursprüngliche Kriterien und Bewertungen prüfbar. „Vorschau anzeigen“ schreibt nichts; „Evaluation bestätigen“ schreibt das Ereignis beim ausgewählten Kind und stößt den regulären Abgleich an. Speicherung und Abgleich sind auf dem echten iPad nochmals zu prüfen.

Der Anthropic-Schlüssel bleibt lokal im iPad-Keychain. Die native Claude-Brücke ist auf das zulässige HTTPS-Test-Origin, die Whitelist der Formularpfade und den Hauptframe beschränkt. Der Toddle-WebView ist nicht persistent. Im Test dürfen keine personenbezogenen Schuldaten an Claude gesendet werden.

## Abnahmefolge
1. Vorhandenen Test-10-Stand unangetastet lassen; Test-11-Paket separat importieren.
2. Auf der geschützten Seite als `max.mustermann` anmelden, zu `kind1.mustermann` und „Schulische Einstufungen“ wechseln. Bei falscher oder fehlender Kindanzeige stoppen.
3. Echte bereits geprüfte Toddle-Evaluation übernehmen, mit Claude übertragen und Kriterien/Originaleinstufungen gegenprüfen; nur für das fiktive Testkonto.
4. „Vorschau anzeigen“ und anschließend „Evaluation bestätigen“. Erfolgreichen Datenabgleich abwarten und denselben Eintrag nach App-Neustart erneut öffnen.
5. Neue Tagesrunde für das Testkind starten und nur bei fachlich passender expliziter Übungszuordnung die erzeugte Übung kontrollieren. Unzugeordnete Kriterien dürfen keine künstliche Übung erhalten.

Keine Veröffentlichung der produktiven App, kein Zugriff auf reale Kinderkonten und kein stillschweigender Merge.
