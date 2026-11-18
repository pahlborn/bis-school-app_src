# Gerätetest 12 · EV-1.1/EV-1.2 · laufendes Geräteprotokoll

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
| Testfall 2: Playgrounds vollständig schließen und Fassung 12 erneut starten | NOT_TESTED | Rückmeldung zu Start-Lesecode, Access Group und Geräteverbindung fehlt. Vor erneuter Eingabe ablesen. |
| Testfall 3: Fassung 13 ohne Löschen der Appdaten öffnen | NOT_TESTED | Rückmeldung zu Start-Lesecode, Access Group und Geräteverbindung fehlt. Vor erneuter Eingabe ablesen. |

Die Statusangaben beruhen auf Peters Rückmeldungen, nicht auf einer eigenen Geräteausführung durch Atlas. Nicht gemeldete Codes und Beobachtungen werden nicht ergänzt. Keine Geheimniswerte wurden angefordert oder protokolliert.

## Zwischenstand und nächster Schritt

- Neu belegt: Testfall 1, erfolgreiches Speichern und unmittelbares Zurücklesen auf dem echten iPad.
- EV-1.1: Geräteabnahme weiterhin NOT_TESTED, Wechsel 12 → 13 steht aus.
- EV-1.2: Teilnachweis vorhanden; Neustart und vollständige Diagnoseangaben stehen aus. Keine Gesamtannahme.
- EV-1.3 bleibt eine offene Umsetzung. EV-1.4 wird durch den Startbefund vor dem Speichern nicht ausgelöst.
- Nächster Schritt: Peter schließt Playgrounds vollständig, startet dieselbe Fassung 12 erneut und meldet die Diagnose sowie den Verbindungszustand vor einer erneuten Eingabe. Atlas ergänzt dieses Protokoll nach der Rückmeldung.

Ausschließlich ein Geräteprotokoll auf eigenem Dokumentationszweig. Keine Produktänderung, kein Merge nach main und keine Veröffentlichung.
