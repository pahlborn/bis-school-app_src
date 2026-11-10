# Big Quest · KI-Dienst für den Elternpilot

Die Test-App bleibt auf GitHub Pages. Der KI-Dienst läuft als eigener Node-Prozess hinter einem HTTPS-Proxy. Eltern verwenden ihr bestehendes Big-Quest-Konto. Die Funktion wird erst im Testbuild mit eingetragener Dienstadresse sichtbar.

## Einrichtung durch den Betrieb

1. Den Dienst aus demselben geprüften Git-Stand wie die Test-App auf einem Node-24-Host betreiben. Den HTTPS-Proxy auf den Dienstport richten. Für den Pilot genau eine laufende Instanz verwenden, da Anfragelimit und Wiederholungsschutz im Prozess liegen.
2. Im Secret-Speicher des Hosts `ANTHROPIC_API_KEY` hinterlegen. `BQ_APP_ORIGIN` auf `https://big-quest-test.github.io` setzen. `BQ_PARENT_KEYS` enthält ein JSON-Objekt aus Eltern-Kontokennung und dem öffentlichen ECDSA-Schlüssel des freigegebenen Kontos. Die Schlüssel aus dem verwalteten Testbestand beziehen und die Kontorolle vor der Freigabe prüfen. `PORT` ist optional und steht standardmäßig auf 8080.
3. Dienst mit `node services/school-ai/server.mjs` starten. `GET /health` prüft die Erreichbarkeit des Prozesses. Ein echter, berechtigter Aufruf der BIS-Referenz prüft separat die Verbindung zu Claude.
4. Den Testbuild mit `BQ_SCHULE_KI_URL` als HTTPS-Origin des Dienstes bauen und nach dem bestehenden Freigabeprozess bereitstellen. Anschließend den Ablauf mit einem freigegebenen Elternkonto abnehmen.

Der Dienst prüft die Signatur anhand der konfigurierten öffentlichen Elternschlüssel und lehnt abgelaufene oder wiederholte Anfragen ab. Zu Claude gehen nummerierte Kriterientexte. Die Lehrkraft-Einstufungen, Titel und das Bewertungsdatum bleiben im Browser. Quelltexte und Anmeldedaten gehören nicht in Proxy- oder Anwendungslogs.

## Ablauf im Pilot

Unter **Schulische Einstufungen → Auszug mit KI prüfen** Titel und Datum eingeben, dann die Spalten *Kriterium* und *Lehrkraft-Einstufung* aus der Tabelle einfügen. Die Vorschau zeigt die Quelleinstufungen und das vorgeschlagene Lernziel. Für die erste Lieferung speichert **Übernehmen** das ausgewählte Kriterium über den bestehenden Big-Quest-Abgleich. Als Testfall dienen die sechs vorhandenen BIS-Kriterien.
