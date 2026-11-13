# Big Quest – vollständiger Testleitfaden für den KI-Elternpilot

**Stand:** 12. November 2026  ·  **Umgebung:** ausschließlich Big-Quest-Testinstanz  ·  **Testgerät:** iPad mit Swift Playgrounds  
**Ziel:** Eine Schulevaluation manuell oder aus Toddle mit Claude in **dasselbe einfache Formular** übertragen, unter **kind1.mustermann** speichern, nach einem Neustart wieder öffnen und in einer **neuen Tagesrunde** die passende Übung nachweisen.

> **Keine produktive Veröffentlichung.** Safari-Beta 0.152.2 unter `https://big-quest-test.github.io/` ist nicht identisch mit dem separaten Swift-Playgrounds-Pilot unter `https://big-quest-test.github.io/probe-evaluation-form/` (Test-07-Webbasis 0.152.1 mit isolierten Korrekturen). Beide benutzen denselben geschützten **Test**datenspeicher `pahlborn/bis-school-app-testdaten`. Die Swift-Dateien des Testpakets 07 bleiben verwendbar.

## A. Was vor dem Test vorhanden sein muss

- [ ] Safari auf dem iPad: **Big Quest Beta 0.152.2** ist geöffnet; Elternkonto **max.mustermann** ist dort angemeldet und funktionsfähig.
- [ ] **Swift Playgrounds**: Das Projekt **Big-Quest-iPad-Test-07.swiftpm** aus Testpaket 07 ist installiert und startet. Oben befinden sich die nativen Schaltflächen **„Claude-Schlüssel“** und **„Evaluation aus Toddle“**.
- [ ] Zugangsdaten für **max.mustermann** (Eltern-Passwort) und **kind1.mustermann** (Kinder-Passwort) sind vorhanden. **Persönlicher Startcode, Geräte-Zugangscode und Passwort sind verschiedene Dinge.** Bereits verwendete Startcodes werden nicht wieder benutzt.
- [ ] **kind1.mustermann** ist dem Elternkonto zugeordnet. Den sichtbaren Namen des dazugehörigen Testkindes vor jedem Speichern in der Formular-Kopfzeile prüfen; der **Anzeigename kann vom Anmeldenamen abweichen**.
- [ ] Eine zulässige **Toddle-Elternanmeldung** ist vorhanden; die zu prüfende Evaluation ist unter **Done/Erledigt** aufrufbar und lässt sich vollständig anzeigen.
- [ ] Für den echten Claude-Lauf ist ein gültiger **Anthropic-API-Schlüssel im Schlüsselbund dieses iPads** erforderlich. Der neu hinterlegte GitHub-Secret-Wert `ANTHROPIC_API_KEY` versorgt nur Agentarium und wird **nicht** automatisch an Swift Playgrounds übergeben.
- [ ] WLAN/Internet vorhanden. Für echte Toddle-Daten vor dem Claude-Aufruf alle identifizierenden Angaben aus dem angezeigten Quelltext entfernen. Keine echten Kinderdaten, Schlüssel oder vollständigen Toddle-Screenshots in öffentliche GitHub-Issues stellen.

**Testunterlagen:** Testpaket 07: `https://chatgpt.com/library?file_id=libfile_c45761eda4fc8191bbabce8b5781b9a6&account_id=personal`. Separater Testpfad: `https://big-quest-test.github.io/probe-evaluation-form/`.

## B. Einmaliges Verbinden von Swift Playgrounds – ohne QR-Code und ohne Startcode

Die Safari-Anmeldung wird **nicht automatisch** in die Swift-WebView übernommen. Das ist technisch normal; der erste Geräte-Link ist deshalb nötig.

1. **Safari** mit der angemeldeten Beta 0.152.2 öffnen. Im **Elternbereich** auf **⚙️ Einstellungen** gehen, dort **„📱 Meine Geräte“** aufklappen. Bei einem Administratorkonto kann die Rubrik **„Zugangsdaten und Geräte“** heißen.
2. **„Weiteres Gerät verbinden“** antippen. Jetzt werden QR-Code und darunter **„Verbindungslink“** sowie die neue Schaltfläche **„Link kopieren“** angezeigt. Falls der Button noch nicht da ist: Safari-Seite neu laden, danach den Abschnitt nochmals öffnen.
3. Auf **„Link kopieren“** tippen. Der Link beginnt mit `https://big-quest-test.github.io/` und enthält `#zugang=`. **Nicht** das Eltern-Passwort und **nicht** nur einen persönlichen `#start=`-Code kopieren. Keine Freigabe des Links an Dritte.
4. In **Swift Playgrounds** zur laufenden Test-07-App wechseln. Auf **„Gerät verbinden“** den Link in **„Link einfügen (ganzer Link oder nur der Zugangscode)“** einfügen. **„Verbinden“** antippen.
5. **Soll:** Meldung **„Gerät verbunden – bitte anmelden“**, anschließend der normale Big-Quest-Anmeldebildschirm. Dann **Elternteil/Lehrkraft**, **max.mustermann** und dessen bestehendes Passwort verwenden. **Keinen neuen Elternaccount erstellen.**
6. Nach erfolgreicher Anmeldung Elternbereich öffnen; **kind1.mustermann** als Testkind auswählen.

**Ausweichwege:** Wenn „Link kopieren“ nicht angeboten wird, den sichtbaren Link aus dem Textfeld markieren und kopieren. Oder denselben QR-Code auf einem zweiten Bildschirm anzeigen und in Swift Playgrounds **„QR-Code scannen“** nutzen. Ein QR-Code auf demselben iPad-Display lässt sich nicht mit dessen Rückkamera einscannen.

**Fehlerauswertung:**

| Meldung | Bedeutung / Korrektur |
|---|---|
| „Dieser Link gehört zu einer anderen Fassung“ | Die Swift-Testseite wurde noch nicht aktualisiert oder es wurde ein Link einer anderen Umgebung kopiert. App/Webansicht neu laden; nur den Link aus **Safari Beta 0.152.2 → Meine Geräte** verwenden. |
| „Kein Zugangscode / kein Link“ | Es wurde nur ein `#start=`-Code oder ein Passwort eingefügt. Den vollständigen Link mit `#zugang=` verwenden. |
| „Zugangscode passt nicht oder ist abgelaufen“ | Der eigentliche Zugriff auf den Testdatenspeicher wurde abgewiesen. Im funktionierenden Safari-Elternkonto den Geräte-Link erneut auslesen; bei unverändertem Fehler **nicht** durch Umgehung oder Rücksetzen des Kontos fortfahren. |
| „Kein Netz“ | Verbindung prüfen; nicht mehrfach blind bestätigen. |
| Elternkonto findet das Kind nicht | Eltern-/Familienzuordnung prüfen; **nicht** mit einem anderen Kind weitertesten. |

**STOPP B:** Ohne funktionierenden Eltern-Login von `max.mustermann` und sichtbar zugeordnetes `kind1.mustermann` erfolgt **keine Evaluation und keine Datenspeicherung**.

## C. Test 1 – Manuelle Eingabe in das gemeinsame Formular

Dieser Test benötigt **weder Toddle noch Claude**. Wir verwenden bewusst eine **fiktive** Bewertung ohne Mathe-Zuordnung, damit sie keine fachlich unpassende Zusatzübung auslöst.

1. Als **max.mustermann** im Elternbereich das Testkind **kind1.mustermann** auswählen.
2. **„Schulische Einstufungen“ → „Evaluation hinzufügen“** öffnen.
3. Unter der Überschrift **„Evaluation übernehmen“** den sichtbaren Namen des Testkindes prüfen. Dieser muss eindeutig zum Konto **kind1.mustermann** gehören; der Anzeigename muss nicht wörtlich gleich sein. Nicht fortfahren, falls ein anderes Kind ausgewählt ist.
4. Folgende **Testdaten** eintragen:

| Feld im Formular | Testwert |
|---|---|
| Titel der Evaluation | **PILOT-MANUELL-ARGUMENTIEREN** |
| Bewertungsdatum | **12.11.2026** oder heutiges Testdatum |
| Fach | **English** |
| Lernziel | **Einen Standpunkt mit Gründen erklären** |
| Arbeitsanweisung | **Schreibe drei Sätze und begründe deinen Standpunkt.** |
| Lehrkraft-Rückmeldung | **Begründungen müssen noch deutlicher werden.** |
| Kriterium 1 | **Standpunkt verständlich erklären** |
| Einstufung Kriterium 1 | **M** |
| Passende Übungen (optional) | **Noch keine Zuordnung** |

5. **„Vorschau anzeigen“** wählen. **Soll:** Richtiger Kindname, der Titel, Bewertungsdatum, alle Texte und die Einstufung **M** sind unverändert sichtbar. Hinweis **„Kein zusätzlicher Übungsfokus“** bzw. entsprechende unzugeordnete Darstellung. **Noch kein Speichern**.
6. **„Evaluation bestätigen“** antippen. Warten, bis der Eintrag in der Liste der schulischen Einstufungen erscheint und der Abgleich erfolgreich ist. Eine Vorschau allein reicht ausdrücklich nicht.
7. Die Detailansicht des Eintrags öffnen, Originaltext und M kontrollieren. App/Webansicht neu laden bzw. die Swift-App schließen und erneut starten; als Elternteil wieder öffnen. **Soll:** Der Eintrag existiert genau einmal und enthält dieselben Angaben.
8. Nicht ein zweites Mal unter identischem Titel und Datum neu anlegen. Falls versehentlich doppelt gespeichert: als Fehler dokumentieren, nicht stillschweigend löschen.

**STOPP C:** Bei falscher Kindzuordnung, fehlendem Inhalt, Dublette oder nicht erfolgreichem Abgleich nicht mit Toddle fortfahren.

## D. Test 2 – Echte Toddle-Übernahme und Claude-Befüllung

**Vor dem Test:** In Swift Playgrounds links oben auf **„Claude-Schlüssel“** tippen. Falls noch kein Schlüssel hinterlegt ist, den gültigen Anthropic-API-Schlüssel direkt im sicheren iPad-Feld eintragen und **„Im Schlüsselbund speichern“** wählen. **Der GitHub-Relay-Schlüssel wird nicht automatisch übernommen.** Nicht in Chats oder Screenshots dokumentieren.

1. In Swift **als max.mustermann**, Kind **kind1.mustermann** und Bereich **„Schulische Einstufungen“** öffnen. Die Kindanzeige vor dem nächsten Schritt kontrollieren.
2. Oben rechts den **nativen** Button **„Evaluation aus Toddle“** antippen. Die Toddle-Seite öffnet sich in einem eigenen Browserfenster; bei Bedarf dort erneut bei Toddle anmelden.
3. In Toddle eine **abgeschlossene Evaluation** unter **Done/Erledigt** öffnen. Alle Kriterientexte, Einstufungen, Lernziele, Arbeitsanweisungen und Lehrkraft-Kommentare sichtbar machen. Gegebenenfalls verschachtelte Details aufklappen; **nicht sichtbare, noch nicht geladene Inhalte werden vom Reader nicht garantiert erfasst**.
4. **„Evaluation ins Formular übernehmen“** antippen. Toddle schließt sich, und **dasselbe einfache Big-Quest-Formular** wie in Test 1 öffnet sich. Die Übernahme des Quelltexts allein **speichert noch keine Bewertung**.
5. Bereich **„Erfasster Evaluationstext“** aufklappen und mit Toddle vergleichen. **Vor dem Claude-Aufruf** sämtliche Namen, Klassenbezeichnungen, persönlichen Kommentare oder andere Identifikatoren aus dem editierbaren Quelltext entfernen. Falls eine sichere Bereinigung nicht möglich ist, **STOPP D** – keinesfalls ungeprüft an Claude senden.
6. **„Mit Claude ins Formular übertragen“** antippen. Hier erfolgt der **echte** Anthropic-Aufruf; eine synthetische Testantwort genügt nicht. Auf das Ergebnis warten. Bei Fehlermeldung nicht erneut „Evaluation bestätigen“ drücken und keinen halbfertigen Datensatz speichern.
7. Den erzeugten Entwurf gegen den Originalinhalt prüfen: **Titel**, **Bewertungsdatum**, **Fach**, **Lernziel**, **Arbeitsanweisung**, **Lehrkraft-Rückmeldung** sowie **alle sechs Kriterien** mit ihren **unveränderten Originaleinstufungen**. Fehlt etwas, zunächst korrigieren und als Fehler festhalten.
8. **Fachliche Gegenprobe:** Zweischrittige Subtraktion muss, soweit in der Originalbewertung enthalten, auf **M-N5 / C** und das Übungsmuster **zweischrittige Subtraktion** führen. Rundung auf **M-N3 / M** löst **keine zusätzliche Rundungsaufgabe** aus. Die vier anderen Kriterien dürfen **ohne Zuordnung** erhalten bleiben; keine erfundenen Übungszuordnungen setzen. Bei abweichender Originalbewertung ist diese maßgeblich – niemals C oder M nur für den Test erzwingen.
9. **„Vorschau anzeigen“** wählen. **Soll:** eindeutig das Testkind zu **kind1.mustermann**, alle sechs Originalkriterien, Bewertungen, fachlicher Fokus und keine unerwünschte Zuordnung. Vor der finalen Bestätigung keine neue Bewertung in der Liste.
10. Erst wenn alles stimmt: **„Evaluation bestätigen“** antippen. Auf sichtbare Bestätigung und erfolgreichen Abgleich warten. Die gespeicherte Evaluation erneut öffnen; alle Kriterien und die Lehrkraft-Rückmeldung prüfen. Swift-App vollständig schließen und neu starten, erneut im Elternbereich öffnen und die unveränderte Speicherung erneut prüfen.

**STOPP D:** Keine Bestätigung bei falschem Kind, ausgelassenen Kriterien, veränderter Lehrkraft-Einstufung, nicht entfernten personenbezogenen Daten, fehlgeschlagenem Claude-Aufruf oder unklarem Abgleich.

## E. Test 3 – Echte Übung in einer neuen Tagesrunde

1. Nach **erfolgreicher Bestätigung und Abgleich** der Toddle-Evaluation aus Test 2 beim Elternkonto **abmelden**.
2. In derselben Swift-App **Student/Kind** wählen und als **kind1.mustermann** mit seinem **bestehenden Kinder-Passwort** anmelden. Ein früherer persönlicher Startcode ist kein Passwort. Falls das Kind noch auf Aufnahme wartet, erst den normalen Eltern-/Familienabgleich abschließen.
3. Auf der Kind-Startseite **„Practise Today“** (neue Tagesrunde) öffnen. **Keine bereits laufende Runde** verwenden: Diese kann absichtlich ihren bisherigen Aufgabenbestand behalten.
4. Die **acht Karten der Runde** prüfen. Bei der bestätigten Toddle-Zuordnung **M-N5/C** soll eine **zweischrittige Subtraktionsaufgabe** als gezielte Schul-Evaluation-Übung enthalten sein, typischerweise **„Word Problems“**. Beide Subtraktionsschritte müssen mathematisch korrekt lösbar sein.
5. Falls in derselben Evaluation **M-N3/M** enthalten ist, darf dadurch **keine zusätzliche gezielte Rundungsaufgabe** erzeugt werden. Eine reguläre Rundungsfrage aus dem allgemeinen Lernmix allein ist noch kein Nachweis eines Fehlers; ausschlaggebend ist ihre Zuordnung zur Schulevaluation.
6. Aufgabe fachlich prüfen und die Runde beenden. Die neue Tagesrunde darf die zuvor gespeicherte Evaluation nicht verändern.

**STOPP E:** Wenn keine nachweisbar passende M-N5/C-Aufgabe erscheint, der Abgleich aussteht oder die Karte der falschen Bewertung zugeordnet ist, als **nicht bestanden** dokumentieren. Nicht durch mehrfaches Neustarten zufällig nach einer passenden Karte suchen.

## F. Ergänzende Stabilitätsprüfung – erst nach bestandenem Grundpilot

- **Fassungsverlauf:** Gespeicherte Evaluation öffnen, **„Bewertung korrigieren“** wählen, einen klar identifizierbaren Testtext ändern, **„Vorschau anzeigen“ → „Korrektur bestätigen“**. Ursprungsfassung muss in der Historie erhalten bleiben.
- **Rücknahme:** **„Bewertung zurücknehmen“ → „Rücknahme bestätigen“**. Neue Tagesrunden dürfen die zurückgenommene gezielte Karte nach Abgleich nicht mehr aus dieser Evaluation erzeugen; bestehende laufende Runden bleiben stabil.
- **Kindwechsel:** Entwurf für `kind1.mustermann` öffnen, vor Bestätigung zu anderem Kind wechseln. Es darf **kein** Eintrag beim anderen Kind entstehen. Keine realen Kinderkonten für diese Gegenprobe verwenden.
- **Duplikate:** Dieselbe bereits bestätigte native Übertragung nicht als zweiten Eintrag speichern. Kein stillschweigendes Überschreiben anderer Evaluationen.

## G. Abnahmeprotokoll (ausfüllen)

| Prüfschritt | Ergebnis / Beleg |
|---|---|
| Datum, Tester, iPad/Swift-Testpaket | __________________________________ |
| Safari Beta 0.152.2 / separater Testpfad | __________________________________ |
| Gerät in Swift verbunden, Eltern-Login max.mustermann | Pass / Fail / Offen |
| Richtiges Kind kind1.mustermann ausgewählt | Pass / Fail / Offen |
| Manuelles Formular, Vorschau und Speicherung | Pass / Fail / Offen |
| Manuelle Evaluation nach Neustart wieder geöffnet | Pass / Fail / Offen |
| Toddle-Reader: sichtbarer Originaltext vollständig | Pass / Fail / Offen |
| Personenbezug vor Claude-Aufruf entfernt | Pass / Fail / Offen |
| Echter Claude-Aufruf durchgeführt | Pass / Fail / Offen |
| Sechs Kriterien, Originaleinstufungen erhalten | Pass / Fail / Offen |
| Toddle-Evaluation beim richtigen Kind gespeichert | Pass / Fail / Offen |
| Nach Neustart vollständig wiedergeöffnet und abgeglichen | Pass / Fail / Offen |
| Neue Runde: M-N5/C, zweischrittige Subtraktion | Pass / Fail / Offen |
| M-N3/M: keine zusätzliche gezielte Rundungsaufgabe | Pass / Fail / Offen |
| Fehler/Meldung, Zeitpunkt, betroffener Schritt | __________________________________ |

**Pilot bestanden** erst, wenn **B + C + D + E vollständig** mit den tatsächlichen Login-, Speicher- und Übungsnachweisen erfolgreich sind. Simulierte Browserprüfungen und ein grüner iPad-Simulator-Build sind dafür allein **nicht ausreichend**. Gezielte Korrektur und Rücknahme (F) sind zusätzliche Stabilitätsprüfungen für die darüber hinausgehenden Stories.

## H. Wenn etwas fehlschlägt: genau diese Angaben melden

**Benötigt:** Schritt (z. B. D.6), Wortlaut der Fehlermeldung, ob Safari oder Swift, der sichtbare Kindname (nur das **fiktive** Testkind), Zeitpunkt, ob eine Speicherung bestätigt wurde. **Nicht senden:** Passwörter, Zugangscodes, API-Schlüssel, vollständige Toddle-Seiten mit personenbezogenen Daten oder echte Lehrkraft-/Kinderdaten. Bei Abgleichfehlern nicht mehrfach blind auf **Bestätigen** tippen.

**Technische Referenzen:** [PR #192](https://github.com/pahlborn/bis-school-app_src/pull/192), [Epic #185](https://github.com/pahlborn/bis-school-app_src/issues/185), [Agentarium-Monitor #2](https://github.com/pahlborn/agentarium/issues/2). Änderungen bleiben auf Entwicklungsbranch und separater Test-Pages; keine Produktionsübernahme ist Bestandteil dieses Leitfadens.