# Big Quest iPad – lokaler KI-Test 09 (0.153.2 Beta)

Test 09 öffnet die isolierte Demo unter `/probe-evaluation-local/`. Es gibt **keine GitHub-Geräteverbindung** und keinen Zugang zu den anderen Testkonten oder geschützten Schulbewertungen.

Fiktiver Testbenutzer `max.mustermann`, fiktives Kind `kind1.mustermann` sind sichtbar vorausgewählt; die lokale Testoberfläche benötigt kein Passwort. Bewertungen werden nur im WebView-App-Container gespeichert (kein GitHub- oder Mehrgeräteabgleich). Beim Wechsel zu einem anderen Browser/Device gibt es dort andere lokale Testdaten.

Der Menüpunkt **Evaluation aus Toddle** und der native Claude-API-Aufruf bleiben im iPad-Wrapper; der Anthropic-Key liegt im Keychain. Reale Personen-/Schuldaten dürfen nicht an die KI gesendet werden.

Manuelle Eingabe und Claude-Befüllung nutzen dasselbe einfache lokale Formular. Vorschau speichert nicht, Bestätigung speichert lokal. Die beiden vordefinierten Übungsmuster werden nur nach ausdrücklicher Auswahl eingeblendet; sie sind keine LLM-generierten Aufgaben und **nicht** der vollständige End-to-End-Nachweis des originalen mehrgerätefähigen Big-Quest-Schulsystems.

## Sicherheits- und Upgrade-Grenzen

Die Bundle ID bleibt wie bei Test 08 `de.bigquest.ipad.test08`; dies erlaubt ein Update der Test-App statt eine neue App mit neuem Keychain-Container. Die WebView-Origin und der Pfad des lokalen Demoformulars sind getrennt von der bisherigen Integrationsseite. Es gibt keinen GitHub-Schreibschlüssel in diesem Build.

Die alte, geschützte Integrationsseite `/probe-evaluation-form/` bleibt unverändert und muss später separat inklusive Konten- und Gerätesynchronisation abgenommen werden.
