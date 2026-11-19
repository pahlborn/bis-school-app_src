# Gerätetest 12 · EV-1.1/EV-1.2 · Geräteergebnis

Datum: 18.11.2026 · Epic 2026.0005 · Ausführung: Peter auf dem iPad · Protokoll: Atlas nach Peters unmittelbaren Rückmeldungen im Projektchat.

## Bezug und Umfang

- Führendes main beim Protokollbeginn: `0b3520ce72023cca224a260cd0b1bd85c26021d3`.
- [Auftrag, insbesondere Abschnitte 4, 6, 7 und 7a](https://github.com/pahlborn/bis-school-app_src/blob/0b3520ce72023cca224a260cd0b1bd85c26021d3/docs/konzept/auftrag-atlas-evaluationen-ziel1.md).
- [Abnahmekriterien EV-1.1 und EV-1.2](https://github.com/pahlborn/bis-school-app_src/blob/0b3520ce72023cca224a260cd0b1bd85c26021d3/docs/konzept/evaluationen-ziel1-epics.md#L65).
- [Vorgegebener Ablauf, Abschnitt 8.3](https://github.com/pahlborn/bis-school-app_src/blob/0b3520ce72023cca224a260cd0b1bd85c26021d3/docs/pruefung/2026-11-17-atlas-abgleich-evaluationen.md#L221).
- Verwendetes [Gesamtpaket mit Fassungen 12 und 13](https://raw.githubusercontent.com/pahlborn/bis-school-app_src/42e86c467322e0472b364a726e72cb0a1b226b38/handoffs/big-quest/device-tests/TEST-12/Big-Quest-Geraetetest-12-460a263.zip): Produktquelle `main@460a263b394b5c9c08a7eb6cd50e1f99dae537d6`, Ablagecommit `42e86c467322e0472b364a726e72cb0a1b226b38`. Peter bestätigte im Chat den Start mit genau diesem Downloadlink. [Dokumentierte Übergabe und Verwendbarkeit nach den reinen CI-Änderungen](https://github.com/pahlborn/bis-school-app_src/pull/206#issuecomment-6959015700).
- Das positive Ergebnis von Test 11 bleibt erhalten. Dieser Test betrifft Speicherung, Neustart und Wechsel 12 → 13; keine erneute vollständige Toddle-/Formular-/Übungsabnahme.

## Unmittelbar gemeldete Ergebnisse

| Schritt | Ergebnis | Peters Beobachtung / Nachweisgrenze |
|---|---|---|
| Start von Fassung 12 vor dem hier gemeldeten Speichern | BEOBACHTET | „Keychain at startup“, „Read Not found (iOS −25300)“. Access Group angezeigt, im Chat nur gekürzt übermittelt. Daraus folgt kein belegter Verlust eines zuvor erfolgreich gespeicherten Schlüssels. |
| Testfall 1: Claude-Schlüssel in Fassung 12 speichern und unmittelbar zurücklesen | PASS laut Peter | „Save: success (iOS 0)“ und „saved and verified by reading back“. Der numerische Code des unmittelbaren Lesens wurde nicht gesondert übermittelt; der gemeldete Anzeigetext bestätigt erfolgreiches Zurücklesen. Access Group dieses Schritts noch nicht vollständig gemeldet. |
| Testfall 2: Playgrounds vollständig schließen und Fassung 12 erneut starten | Schlüssel gelesen: PASS laut Peter; Geräteverbindung nicht vorhanden | „Keychain at startup“, „success (IOS-0)“; als iOS-Erfolgscode 0 protokolliert. Access Group: `LOCALSPKEY.swift-playgrounds-dev-previews.swift-playgrounds-app.bibcgipmloimpleezqijplahruob.501.Big-Quest-iPad.` (Schreibweise laut Peter). Anschließend ausdrücklich: „Big quest ist nicht verbunden“. Der Schlüssel hat diesen Neustart überstanden. Ob die Geräteverbindung vor diesem Neustart schon hergestellt war, wurde nicht gesondert gemeldet; deshalb kein belegter Verbindungsverlust. |
| Erster gemeldeter Verbindungsversuch vor dem Paketwechsel | FEHLGESCHLAGEN | Peter meldet, dass sein Zugangscode für das synthetische Testkonto als ungültig oder abgelaufen abgewiesen wird. Ein Verbindungsversuch mit diesem Ergebnis ist gemeldet; frühere weitere Anläufe sind nicht belegt. Kein Zugangscode angefordert oder protokolliert. Dieser Zwischenbefund bleibt erhalten. |
| Geräteverbindung vor dem Paketwechsel herstellen | PASS laut Peter | Nach der Anleitung zum Verbinden über den funktionierenden Browser meldet Peter: „Gerät ist verbunden.“ Die Geräteverbindung in Fassung 12 ist damit als Ausgangszustand für 12 → 13 bestätigt. Atlas hatte empfohlen, den vorhandenen Geräteeintrag bestehen zu lassen; eine Löschung wurde nicht angefordert. Ein Erhalt beim Paketwechsel ist hiermit noch nicht belegt. |
| Testfall 3: Wechsel von der verbundenen Fassung 12 auf Fassung 13 | NICHT GEHALTEN: Schlüssel nicht gefunden und Gerät nicht verbunden, laut Peter | Rückmeldung auf die Wechselanweisung: „Key: not found. Gerät ist nicht verbunden“. Access Group: `LOCALSPKEY.swift-playgrounds-dev-previews.swift-playgrounds-app.efnbnwdfndryqzbxpbtwnlbqzwla.501.Big-Quest-iPad` (Schreibweise laut Peter). Der numerische Start-Lesecode wurde nicht gesondert gemeldet. Dieser Paketwechsel liefert keinen Persistenz-PASS. |

Die Statusangaben beruhen auf Peters Rückmeldungen, nicht auf einer eigenen Geräteausführung durch Atlas. Nicht gemeldete Codes und Beobachtungen werden nicht ergänzt. Keine Geheimniswerte wurden angefordert oder protokolliert.

## Ergebnis und Grenzen

- **Erfolgreich:** Speichern und unmittelbares Zurücklesen in Fassung 12; Lesen nach vollständigem Neustart derselben Fassung mit iOS 0. Die Geräteverbindung wurde anschließend erfolgreich hergestellt.
- **Nicht gehalten:** Beim Wechsel 12 → 13 ist der zuvor gespeicherte Schlüssel nicht auffindbar und das Gerät nicht verbunden. Der verbundene Ausgangszustand in Fassung 12 war unmittelbar vorher bestätigt.
- **Access Groups verschieden:** Der variable Abschnitt lautet bei Fassung 12 `bibcgipmloimpleezqijplahruob`, bei Fassung 13 `efnbnwdfndryqzbxpbtwnlbqzwla`. Die vollständigen Originalangaben stehen in der Ergebnistabelle.
- **Einordnung:** Die beiden Playground-Projekte melden unterschiedliche Schlüsselbund-Bereiche. Eine unveränderte deklarierte App-Kennung beweist somit in diesem Geräteversuch keinen gemeinsamen Schlüsselbund-Bereich über zwei Projekte. Das erklärt die fehlende Sichtbarkeit als technische Arbeitshypothese; eine tatsächliche Löschung oder ein Zurücksetzen der Daten von Fassung 12 ist damit nicht bewiesen. Eine Ursache des getrennten Web-Speichers wurde nicht auf dem Gerät untersucht.
- **Nicht gemeldet:** gesonderter numerischer Code des unmittelbaren Lesens nach dem Speichern, Access Group bei diesem Speicherschritt und numerischer Start-Lesecode von Fassung 13. Diese Werte werden nicht aus Meldungstexten ergänzt.

## Folgen für EV-1 und den weiteren Plan

- **EV-1.1:** Der verlangte Gerätevergleich N → N+1 wurde ausgeführt; sein Ergebnis lautet „nicht gehalten“. Damit ist das negative Geräteergebnis dokumentiert, keine funktionierende versionsübergreifende Persistenz bestätigt. Die konstante Exportkennung ist davon getrennt im [Softwarebericht](https://github.com/pahlborn/bis-school-app_src/blob/0b3520ce72023cca224a260cd0b1bd85c26021d3/docs/pruefung/2026-11-17-ev1-playground-kennung-schluesselbund.md) belegt.
- **EV-1.2:** Positiver Nachweis für Speichern, unmittelbares Zurücklesen und Wiederfinden nach Neustart derselben Fassung; unterschiedliche Access Groups im Paketvergleich beobachtet. Die genannten fehlenden Detailangaben bleiben als Grenze erhalten. Kein pauschaler M1- oder Ziel-1-PASS.
- **EV-1.3:** Geräteverbindung merken bleibt offen. Ein im jeweiligen Schlüsselbund abgelegter Zugangscode allein garantiert keine Übergabe in einen anderen Playground-Bereich; diese Grenze ist bei der Umsetzung zu berücksichtigen.
- **EV-1.4:** Durch diese Ergebnisse nicht ausgelöst. Der Storywortlaut verlangt belegtes Zurücksetzen; beobachtet wurden unterschiedliche Bereiche und fehlende Verfügbarkeit im zweiten Projekt. Der Neustart derselben Fassung hielt den Schlüssel. Ein reiner Sitzungsschlüssel-Rückfall würde diesen bestätigten Komfort aufgeben und den Verbindungsverlust beim Projektwechsel nicht lösen. Eine Ausweitung der EV-1.4 auf Bereichswechsel wäre vor Umsetzung von Peter zu genehmigen. Kein weiterer Schlüsselbund-Reparaturversuch begonnen.
- **Übrige Reihenfolge:** EV-3.3 vor/mit M2; anschließend EV-4 → EV-5 → EV-6 → EV-7. Test 11 bleibt als erfolgreicher Teilnachweis erhalten.
- **Zwischenzeitliche Zugangsblockade behoben:** Der erste gemeldete Verbindungscode wurde zurückgewiesen. Peter bestätigte einen funktionierenden Browserzugang und danach „Gerät ist verbunden“. Die frühere Zurückweisung bleibt in der Tabelle erhalten; ihre genaue Ursache ist offen. Die angezeigte Meldung ist auf main ein allgemeiner Zugangsfehler ([index.html, Zeile 5406](https://github.com/pahlborn/bis-school-app_src/blob/0b3520ce72023cca224a260cd0b1bd85c26021d3/index.html#L5406)).
- **Verbindungsweg:** Empfohlen wurde im funktionierenden Browser „Meine Geräte → Weiteres Gerät verbinden“, in Fassung 12 „QR-Code scannen“ ([index.html, Zeile 6251](https://github.com/pahlborn/bis-school-app_src/blob/0b3520ce72023cca224a260cd0b1bd85c26021d3/index.html#L6251), [QR-Ansicht, Zeile 6277](https://github.com/pahlborn/bis-school-app_src/blob/0b3520ce72023cca224a260cd0b1bd85c26021d3/index.html#L6277)). Keine Passwortänderung, Zugangscode-Erneuerung oder Infrastrukturänderung durch Atlas vorgenommen.

## Unabhängige Zweck- und Evidenzprüfung

Argus, tatsächliche native Prüfinstanz `/root/argus_test12_einordnung`, prüfte [Berichtsstand 077b053e5945c262bd308bf8b4a308750093665c](https://github.com/pahlborn/bis-school-app_src/blob/077b053e5945c262bd308bf8b4a308750093665c/docs/pruefung/2026-11-18-test12-geraetetest.md), Peters Originalmeldungen im Chat, die fünf Hauptquellen auf main und den betroffenen Schlüsselbund-/WebView-Mechanismus.

Rückgabe `BQ-2026-0005-TEST12-REVIEW-20261118-A1`: **PASS_WITH_NOTES / RA_AGREED** für diesen Bericht und seine vorsichtige Einordnung. Zweckbezug EV-1.1/EV-1.2 und korrekte Fortsetzung mit EV-1.3 bestätigt. Kein Zweckverstoß, keine weitere Reparaturreihe und keine externe Kopie im geprüften Umfang festgestellt. Keine eigene Geräteausführung oder neue Software-QA durch Argus; kein umfassendes Audit früherer Anläufe oder Tagesstatus.

**ARGUS-T12-N1 (NOTE, derived):** Unterschiedliche implizite Access Groups erklären getrennte Sichtbarkeit als begründete Einordnung, beweisen aber kein Zurücksetzen. EV-1.4 daher nicht automatisch umsetzen. Der erfolgreiche Neustart von Fassung 12 ist die Gegenbeobachtung zur pauschalen Aussage, Playgrounds verliere den Schlüssel bei jedem Neustart.

## Nächster Schritt

Atlas kann EV-1.3 im unveränderten Storyumfang begrenzt beauftragen: nach erfolgreicher Gerätebindung den Zugangscode im bestehenden Schlüsselbund-Bereich merken, bei fehlender Webbindung einmal zurückgeben und ungültige oder abgelaufene Codes ohne Schleife in den normalen Verbindungsweg führen. Abnahme: automatische Web-Übergabetests und mit Peter ein Neustart desselben Projekts. Das ist keine bestätigte Lösung für den Wechsel zwischen getrennten Playground-Projekten.

Danach EV-3.3 vor/mit M2 und die weitere bestehende Reihenfolge. Für diese Einordnung sind keine weiteren Geräteversuche erforderlich. Eine Erweiterung der bedingten EV-1.4 auf Bereichswechsel oder eine Abschwächung anderer Abnahmekriterien bleibt Peters Entscheidung.

Ausschließlich ein Geräteprotokoll auf eigenem Dokumentationszweig. Keine Produktänderung, kein Merge nach main und keine Veröffentlichung.
