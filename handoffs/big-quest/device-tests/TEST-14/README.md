# Gerätetest 14: Geräteverbindung merken (EV-1.3)

Quelle: main nach PR #216, Commit `86ce3930b8e6972ed60db3d0877d3e511efd3764`.
Paket: `Big-Quest-iPad-Test-14.zip`; Export mit dem bestehenden Werkzeug `werkzeug/ipad-playgrounds-paket.mjs --test-number 14`.

## Vor dem Test

Die Webfassung muss aus demselben Quell-Commit gebaut und über den bestehenden lokalen Veröffentlichungsweg unter **https://big-quest-test.github.io/probe-evaluation-form/** bereitgestellt sein. Atlas hat die Webfassung nicht veröffentlicht. Eine Aktualisierung nur der Startseite dieser Domain reicht nicht aus. Der lokale Chat übernimmt Veröffentlichung und Nachweis des Quellstands.

Das ZIP entpacken und das Projekt `Big-Quest-iPad-Test-14.swiftpm` in Swift Playgrounds öffnen. Ein neues Projekt kann eine andere Schlüsselbund-Zugriffsgruppe haben. Deshalb ist eine erstmalige Geräteverbindung im neuen Projekt erforderlich. Ein zunächst fehlender Claude-Schlüssel beweist keinen Fehler der Geräteverbindung; dieser Test erfordert keinen Provider-Schlüssel.

## Ablauf und Abnahme

1. Aus dem weiterhin funktionierenden Browserzugang über „Meine Geräte → Weiteres Gerät verbinden“ eine neue Verbindung für Test 14 herstellen. Bestehende Geräteeinträge dafür nicht entfernen. Zugangscodes, QR-Inhalte und Schlüssel nicht in Rückmeldungen aufnehmen.
2. Prüfen: Big Quest zeigt die gültige Verbindung; kein Hinweis auf fehlgeschlagenes Merken erscheint. Falls ein solcher Hinweis erscheint, dessen sichtbaren Text ohne Zugangsdaten melden.
3. App stoppen, Swift Playgrounds vollständig schließen und anschließend **dasselbe Projekt Test 14** erneut öffnen.
4. Abnahme: Big Quest ist weiterhin verbunden und verlangt keinen neuen Zugangscode. Vorher/nachher jeweils „verbunden“ oder „nicht verbunden“ sowie gegebenenfalls den sichtbaren Fehlertext melden.

Ein Wechsel zu einem anderen Projekt prüft diese Abnahme nicht. Test 12 zeigte unterschiedliche Zugriffsgruppen zwischen zwei Projekten; EV-1.4 wurde dadurch nicht ausgelöst.

Status bei Übergabe: **NOT_TESTED auf dem Gerät**. Nur Peters Rückmeldung kann die Geräteabnahme belegen. Der ZIP-Inhalt wurde auf Lesbarkeit geprüft; alle drei enthaltenen Swift-Quelldateien entsprechen bytegenau dem genannten main-Commit. Dies ist kein ausgeführter iPad-Build und kein Gerätetest.

Nachweise zur Implementierung und zu automatischen Prüfungen: [PR #216](https://github.com/pahlborn/bis-school-app_src/pull/216), [EV-1.3-Prüfbericht](../../../../docs/pruefung/2026-11-18-ev1-3-geraeteverbindung.md). Laufender Gesamtstatus: [Diskussion PR #206](https://github.com/pahlborn/bis-school-app_src/pull/206#issuecomment-6975809715).
