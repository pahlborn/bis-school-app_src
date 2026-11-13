# Big Quest – zentraler Claude-Zugang (Entwicklungsstand)

**Status 13.11.2026:** Implementierter, testbarer Serverkern, **noch kein deployed HTTP-Dienst**. Kein Austausch der bisherigen iPad-Keychain-Anbindung und keine Umgehung der bestehenden Elternanmeldung.

## Vertrauensgrenze

Die Big-Quest-Web-App wird derzeit statisch über GitHub Pages ausgeliefert; ihre Anmeldung und die Kind-/Familienprotokolle sind überwiegend clientseitig und verschlüsselt. Der Browser darf deshalb **nicht selbst** durch `role: parent`, eine Kindkennung oder eine selbst erzeugte Berechtigung einen kostenpflichtigen Claude-Aufruf auslösen.

`server/claude-evaluation-gateway.mjs` ist das transportneutrale Claude-Gateway. Standardmäßig gesperrt. Der Produktionsserver muss **alle** Abhängigkeiten übergeben:
- `authorize(request, childId)`: vertrauenswürdig signierte und serverseitig geprüfte Elternanmeldung; prüft laufende Kindzuordnung; ausschließlich `{role:'parent',parentId,children}` als SERVER-seitiges Resultat.
- `reserveQuota({parentId,childId,bytes})`: atomare, serverseitige Reservierung aus einem begrenzten Kontingent. Ohne funktionsfähigen Quotenspeicher kein API-Aufruf.
- `privacyGate(source)`: ausreichende **serverseitige** Datenschutzprüfung und Datenminimierung vor Übermittlung. Liefert den geprüften bereinigten Text oder verweigert; einfacher Regex-Check ist nur zusätzliche Negativprüfung und niemals eine Anonymisierungsgarantie.
- `apiKey`: ausschließlich aus Secret Store des Serverbetriebs, niemals aus Browser, Client, Benutzerkonto oder Repository.

Der Gateway-Pfad ist `POST /v1/evaluation/extract` mit JSON `{childId,source}`; die Antwort enthält nur die strukturierte Evaluation, niemals den API-Schlüssel. Falsche Kindzuordnung, ungültige Sitzung, fehlende Datenschutzfreigabe, fehlendes Kontingent oder kaputtes KI-Ergebnis führen zu Fehlerantwort **vor Speicherung der Bewertung**.

`server/parent-session-verifier.mjs` prüft kryptografisch **ES256**-signierte Kurzzeit-Sitzungen (maximal 5 Minuten, feste Issuer/Audience/Key-ID, feste Elternrolle, signierte Kindauswahl). Auch nach gültiger Unterschrift muss der Server die aktuelle Familienmitgliedschaft unabhängig prüfen, damit ein Entzug wirksam wird.

**Nicht vorhanden / daher bewusst nicht vorgetäuscht:** eine vertrauenswürdige Signatur-Ausgabestelle für Big-Quest-Konten; der aktuelle verschlüsselte GitHub-Datenpfad liefert keine direkt serverseitig nachprüfbare Familienliste; ein verwalteter, transaktionssicherer Quotenspeicher; ein ausgerollter Server; abgeschlossene Datenschutzprüfung und ein sicherer, automatischer Toddle-API-Zugang.

## Nächste echte Integrationsarbeiten

1. Serverseitige Vertrauenskette für die vorhandenen Elternkonten und die aktuelle Familienmitgliedschaft technisch festlegen und mit fiktiven Konten Ende-zu-Ende prüfen. **Keine** vom Browser gelieferten Rollen oder Kinderlisten als Beweis akzeptieren.
2. Server-Hosting/Secret Store und transaktionssicheren Quoten-Store mit authentifizierter Deployment-Pipeline verbinden. Fehlende Einstellungen müssen den Dienst gesperrt lassen.
3. Personendaten aus Toddle **vor** dem KI-Aufruf minimieren. Eltern dürfen nicht auf komplexe technische Bereinigung angewiesen sein; bis zur Abnahme keine echten Schülerdaten an den Backend-Prototyp senden.
4. Erst nach gesicherter Authentifizierung den nativen und Web-Client über das zentrale Gateway routen und das Eingabefeld „Claude-Schlüssel“ aus dem Eltern-Normalablauf entfernen.
5. Bestehende `school_evaluation`-Ereignisse, Revisionsschutz, Auswahl des Kindes und Tagesrunden ohne neue lokale Pilotdatenbank verwenden.

## Automatisierte Nachweise

`node --test tests/claude-evaluation-gateway.test.mjs tests/parent-session-verifier.test.mjs`

Sicherheitsmatrix: fehlende Serverkonfiguration, Nicht-Eltern, fremde Kind-ID, gefälschte oder abgelaufene Sitzungen, entzogene Familie, Datenschutz-/Quota-Blockade, unbelegte Kriterienzuordnung, Upstream-Fehler und Vermeidung von Geheimnislecks.

### Externe technische Quellen

- Anthropic Authentifizierung und Browser-Risiko: https://platform.claude.com/docs/en/manage-claude/authentication
- Anthropic Messages API, Structured Output: https://platform.claude.com/docs/en/api/messages/create
- JWS ES256: https://www.rfc-editor.org/rfc/rfc7515.html
- Beispiel Secret Store für Cloudflare Workers (ohne Anbieterentscheidung): https://developers.cloudflare.com/workers/configuration/secrets/

**Release-Schutz:** Draft PR #196 auf isoliertem Branch, aufbauend auf Draft PR #192. Keine Veröffentlichung der produktiven App, keine Speicherung echter Toddle-Schuldaten im Quellcode.
