# iPad: vollständiges Big Quest und EV5.4 mit vollem Standardkatalog

## Anliegen
Die bestehende iPad-Hülle lädt das vollständige Big Quest (Konto) statt der Prüfseite. Eltern starten im Big-Quest-Formular: Kind wählen → „Evaluation übernehmen“ → nur in der App „Aus Toddle“ → vorhandener Toddle-Leser und Quellenprüfung → Formular mit Vorschlägen → vorhandene Vorschau und Bestätigung. EV5.4 nutzt den gesamten gepflegten Katalog.

## Umgesetzt
- `BigQuestApp.swift`: Start-URL `https://big-quest-test.github.io/`; Toolbar-Start entfernt; Web-Formular öffnet den vorhandenen Toddle-Leser; DE/EN-Texte. Persistente WebKit-Daten, isolierte Toddle-Ansicht, Bundle-ID, Dienst und Gerätezugang unverändert.
- `ClaudeClient.swift`: Bridge-Richtlinie für die exakte Wurzel (kein Query/Fragment/Frame/fremder Host); Katalog wird vom Web-Modul geliefert und nativ geprüft (1–64, eindeutig, begrenzt); Schema mit Enum aller Codes plus `none`; Antwort wird vor dem Rubrik-Ersatz geprüft; Hinweise nur bei exakt gleichem Kriteriumstext; Anbieter-Schlüssel nur Schlüsselbund und HTTPS.
- `index.html`: App-only-Schaltfläche, Kontext aus offenem neuen Entwurf (an Entwurf gebunden), Katalog-Nachricht ohne Schlüssel, Ablehnung ungültiger Codes.
- Tests: Swift-Regression (Wurzel erlaubt, unsichere Adressen abgelehnt, vollständige Enum, No-Quest, ungültig vor Rubrik, Quellnote/Beleg erhalten, leere Note bleibt leer) und Browserfälle (reiner Browser ohne Steuerung, Ablauf mit Katalog, ungültiger Code, Kontextschutz).

## Pruefung
Eigene Tests: **NOT_RUN** (keine Shell). CI, unabhängige QA, Xcode-Lauf, echtes WKWebView/iPad/Toddle: **offen/NOT_TESTED**. Grüne CI ist keine Geräte-Freigabe.

## Gefunden
- Annahme: EV5.4-Module verwenden ein optionales `standard` je Kriterium; nicht geprüft (Module nicht geliefert).
- Wurzel und Probe teilen den bestehenden Gerätezugangs-Bereichsnamen, damit keine neue Kopplung nötig wird.
- Bekannt/akzeptiert: neues Playground-Projekt braucht einmal erneute Verbindung (EV1).

