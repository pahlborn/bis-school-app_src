# Geraetetest 15: vollstaendiges Big Quest und Evaluation uebernehmen

Quellstand: `eda2e547820244b573439ca713e81b7417ede5c2`, PR227. Dieses eine Paket enthaelt die vollstaendige Konto-Huelle und alle dazu gelieferten nativen Aenderungen einschliesslich EV5.4. Kein App-Release wurde durch Atlas veroeffentlicht.

## Erst starten, wenn die passende Webfassung bereitsteht

Das Paket allein aktualisiert die Webseite nicht. Vor dem Test muss Peter PR227 ausdruecklich zum Merge freigeben. Danach veroeffentlicht sein lokaler Chat die zugehoerige Test-Webfassung unter **https://big-quest-test.github.io/**. Die fruehere Probe-Unterseite reicht fuer Test15 nicht aus. Quellstand und Veroeffentlichungsnachweis gehoeren zum Testprotokoll.

Die automatischen Pflichtpruefungen dieses Kopfes sind bestanden: [vollstaendige Websuite und Webbau](https://github.com/pahlborn/bis-school-app_src/actions/runs/44470905055), 1090/1090 Tests ohne Auslassungen in sechs Gruppen; [iPad-App-Bau und bestehende Swift-Regression](https://github.com/pahlborn/bis-school-app_src/actions/runs/44470905013); [Linux-Export und Exportregression](https://github.com/pahlborn/bis-school-app_src/actions/runs/44470905062). Das Paket wurde erst danach mit dem unveraenderten Exporter als Test15 gebaut. Eine bestandene automatische Pruefung ersetzt keinen der folgenden Geraeteschritte.

## Vorbereiten

1. `Big-Quest-iPad-Test-15.zip` entpacken und `Big-Quest-iPad-Test-15.swiftpm` in Swift Playgrounds oeffnen. Fuer alle Neustartschritte dasselbe Projekt verwenden.
2. Falls das neue Projekt nicht verbunden ist: ueber den funktionierenden Browserzugang unter „Meine Geraete“ ein weiteres Geraet verbinden. Bestehende Geraeteeintraege dafuer nicht entfernen. Einmaliges Neuverbinden bei einem neuen Playground-Projekt ist bis TestFlight akzeptiert.
3. Falls der Anbieter-Schluessel im neuen Projekt fehlt, ausschliesslich im nativen Zugangsfenster der Huelle speichern. Kein Anbieter-Schluessel in ein Browserformular. Zugangscodes, Schluessel und Namen Dritter weder hier noch im Chat oder Testbericht angeben.

## Schrittweise pruefen und sofort notieren

Nach jedem Schritt nur „bestanden“ oder „nicht bestanden“ und die sichtbare Beobachtung ohne Zugangsdaten melden. Bei einem Fehler anhalten und die Meldung notieren; nichts durch wiederholtes Speichern oder neue Projektimporte ueberschreiben.

| Schritt | Aktion | Erwartung | Ergebnis |
|---|---|---|---|
| 1 | Test15 starten, im Hoch- und Querformat ansehen. | Vollstaendiges Big Quest mit Konto und Kindwahl; keine blosse Testseite. Bedienung durch Tippen. | NOT_TESTED |
| 2 | Gewuenschtes Kind waehlen, Schulbereich oeffnen, „Evaluation hinzufuegen“ antippen. | Formular „Evaluation uebernehmen“ zeigt das richtige Kind und in der Huelle „Aus Toddle“. | NOT_TESTED |
| 3 | „Aus Toddle“ antippen, eine Evaluation im vorhandenen Leser auswaehlen und die Quelle pruefen. | Der vertraute Leser oeffnet; Kriterien und Originaleinstufungen lassen sich der Quelle zuordnen. | NOT_TESTED |
| 4 | Mit KI uebernehmen und die Vorschlaege im selben Formular ansehen. | Texte, Einstufungen und Belege stammen aus der Quelle; je Kriterium steht ein Bereichsvorschlag oder „Kein passender Bereich“. | NOT_TESTED |
| 5 | Einen Vorschlag korrigieren, einen anderen ausdruecklich ohne Bereich lassen; Vorschau oeffnen. | Eigene Entscheidungen bleiben erhalten. Die Vorschau zeigt das richtige Kind; noch nichts wird gespeichert. Auch Bereiche ohne Quest sind waehlbar und werden als solche kenntlich. | NOT_TESTED |
| 6 | Bestaetigen. | Genau eine Evaluation erscheint beim gewaehlten Kind, mit den bestaetigten Zuordnungen und Originaleinstufungen. Bei einem Kindwechsel darf ein alter Entwurf nicht beim anderen Kind gespeichert werden. | NOT_TESTED |
| 7 | Bei einer echten Einstufung RS oder C fuer einen vorhandenen Uebungsbereich zum Kind wechseln, Luecken und Fokus ansehen, neue Runde starten. | Passende Schulluecke, passender Fokus und passende Uebung. Fuer den Abnahmereferenzfall M-N1=C: „Time & Numbers“. Keine Schulnote fuer diesen Test erfinden oder veraendern. | NOT_TESTED |
| 8 | App stoppen, Playgrounds ganz schliessen und dasselbe Projekt Test15 erneut starten. | Verbindung, gespeicherte Evaluation und bestaetigte Bereiche bleiben erhalten. | NOT_TESTED |
| 9 | Dieselbe Evaluation im Browser fuer ein getrenntes Testkind von Hand eintragen; dieselben Bereiche bestaetigen. | Dasselbe Formular ohne „Aus Toddle“; gleiche Einstufungen je Bereich und gleiche Lueckenwirkung. Keine doppelte Evaluation beim urspruenglichen Kind erzeugen. | NOT_TESTED |

EV6-Zusatzfall, sofern eine frueher gespeicherte Evaluation ohne Bereich und ein inzwischen passender Vorschlag vorhanden sind: „Neue Zuordnungen moeglich“ oeffnen, Zuordnung pruefen, Vorschau ansehen und bestaetigen. Erwartet wird eine Korrektur derselben Evaluation, kein zweiter Eintrag. Ist keine passende Ausgangslage vorhanden, bleibt dieser Schritt **NOT_TESTED**.

Revision und Ruecknahme zusaetzlich an einem getrennten Testeintrag pruefen: Eine Aenderung erzeugt eine nachvollziehbare Korrektur; Ruecknahme macht diesen Eintrag unwirksam. Die fuer den Neustartvergleich verwendete Evaluation dafuer erhalten.

## Abnahmegrenzen

EV7 bleibt offen, bis Peter die Schritte auf dem echten iPad und im Browser rueckgemeldet hat. Weitere automatische Wirkungsnachweise betreffen die Mischung hoechstens2von8 neben anderen Themen, die Runde ohne andere aktuelle Themen, alte/neue Daten gemeinsam, RS-vor-C/Schliessregeln und den Start bis6Antworten an2Tagen. Aus dem manuellen Start einer einzelnen Runde wird kein Nachweis aller dieser Regeln abgeleitet.

Bei Uebergabe: saemtliche Geraeteschritte **NOT_TESTED**. Anbieteraufruf, echtes Toddle-Layout und echte WebView sind durch Browser-Mocks oder den Mac-Bau allein nicht bestaetigt.

Technische Quellintegritaet und ZIP-Pruefsumme stehen in `TEST-15-INFO.txt` und `SHA256SUMS`. [Sammelstatus](https://github.com/pahlborn/bis-school-app_src/pull/206#issuecomment-6975809715) und [Arbeits-PR227](https://github.com/pahlborn/bis-school-app_src/pull/227).
