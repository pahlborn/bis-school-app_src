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
- Annahme der damaligen Forge-Rueckgabe: Verwendung des optionalen `standard` im Webmodul noch nicht geprueft. Korrektur durch Atlas: Das Modul lag im Eingabepaket; Argus und Sentinel haben den tatsaechlichen Uebernahmepfad danach bestaetigt.
- Wurzel und Probe teilen den bestehenden Gerätezugangs-Bereichsnamen, damit keine neue Kopplung nötig wird.
- Bekannt/akzeptiert: neues Playground-Projekt braucht einmal erneute Verbindung (EV1).

## Ausgefuehrte Browserpruefung und offene CI-Befunde, Atlas 18.11.2026

Gepruefter Produktkopf `72a0d738cd79185f1d8b7bf3444d004db679f15a`, Tree `89279ce9bf5b6fdb2b0bfb1b102fde7061071540`; aktueller main `2c1b1a4` enthalten. Forge/Claude ist Autor, Atlas Integrator. Quellen-/Handback-/Patchbindung und mechanische Diff-Kontextkorrektur sind im [Produktcheckpoint](https://github.com/pahlborn/bis-school-app_src/pull/227#issuecomment-6989822957) dokumentiert; keine inhaltliche Codekorrektur durch Atlas.

- Unabhaengiger Sentinel: vier neue Autorenbrowserfaelle bestanden; eigener Verhaltensfall1/1 und betroffene Kindwechselregression1/1 bestanden (TAP, keine Skips). Voller echter Webkatalog15 Codes am Bridge-Aufruf, zwei gueltige AI-Hinweise einschliesslich ohneQuest uebernommen, vorher gewaehltes ausdrueckliches none erhalten, Originalkriterien/-noten/-belege erhalten. Quelle und Vorschau0 Events, Bestaetigung genau1. Eine Mutation nur des ausgelieferten HTML im Speicher setzt AI-Zuordnungen auf none; derselbe eigene Test scheitert an der relevanten Uebernahmeassertion. Kein Import-/Setupcrash als Gegenprobe. Einzelne Node-Exitcodes wurden vom Worker nicht separat erfasst und bleiben unbekannt; die direkten TAP-Befunde sind erhalten. Ein fehlerhafter erster eigener Harness ist als ungueltige Vorbereitung dokumentiert, kein Produktbefund.
- Sentinel-Bericht SHA256 `08237cefaf6d3fe356ca3e656167ee78b3c76f205c0f67c989beb951e626ed11`, Ausfuehrungsregister `5ed21ee0d679ecbdde5e61b580bccd36dd24c8e56bdf5b788aa2cffeb9516b90`; [eigene Rueckgabe](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6989909866). Nur Chromium mit simulierter nativer Bridge, kein Swift/Provider/WKWebView/Geraet.
- Argus bestaetigt Zweck EV5.4/genehmigte Huelle und findet in den untersuchten Produktgrenzen keine weitere konkrete Verletzung. A1-01: neue Swift-Testaufrufe werfen innerhalb der nichtwerfenden precondition-Autoclosure. Zunaechst Quellenbefund, danach im [Mac-Lauf44384071857](https://github.com/pahlborn/bis-school-app_src/actions/runs/44384071857) tatsaechlich als Compilerfehler bestaetigt. Der Xcode-App-Bauschritt war erfolgreich; der gesamte Lauf ist wegen der Regression fehlgeschlagen. Forge liefert den isolierten Testfix in [44385496121](https://github.com/pahlborn/agentarium/actions/runs/44385496121), Sitzung `055b48e1-b955-448e-8be6-f75b48a5a21f`, Handback `461250b87c14e05bfe0dc01ab015c4f1d42621241b3d2d979704954f01ac98f1`; werfende Vorabwerte bei unveraenderten Vergleichen, keine abgeschwaechten Assertions. Mac-Nachweis des Fixes noch offen.
- [Web44384071794](https://github.com/pahlborn/bis-school-app_src/actions/runs/44384071794) ist fehlgeschlagen: Der bestehende Neutralitaets-/Testbau-Schutz verbietet den Plattformnamen im allgemeinen Webquelltext. Die neue ausdruecklich beauftragte native Importbeschriftung kollidiert damit. Bau und vier Teilpruefungen scheitern daran; zwei Teilpruefungen bestehen. Die bestehende Schutzliste, CI und Infrastruktur werden nicht umgebaut. Forge erhaelt eine begrenzte Produkt-Kompatibilitaetskorrektur, damit die native Beschriftung erhalten bleibt und der allgemeine Webbau weiterhin neutral ist.
- [Linux-Export44384072085](https://github.com/pahlborn/bis-school-app_src/actions/runs/44384072085) erfolgreich. Sein automatisches Default-Artefakt Test12 ist kein neues Kundenpaket und wurde nicht als solches uebergeben.

Kein Gesamt-PASS: Testfix und Neutralitaetskompatibilitaet muessen auf einem gemeinsamen Kopf geprueft werden; reale iPad-/Toddle-/EV7-Abnahme sowie das eine neue Paket bleiben offen. Merge nur nach Peters ausdruecklichem Ja zu genau PR227; keine App veroeffentlicht.

