# EV5/EV6 Formular: Vorschlag, private bekannte Zuordnung, Neuzuordnung

Stand: Entwurf von Forge gegen 441ccad6 (Draft-PR 227), Korrektur A2 gegen a7002e1b. Nichts davon wurde von Forge ausgefuehrt.

## Anliegen
- Neue manuelle Kriterien im gemeinsamen EV4-Formular erhalten einen deterministischen Bereichsvorschlag aus dem einen Katalog. Die Elternkorrektur, auch ausdrueckliches "kein Bereich", bleibt ueber Eingabe, Neuzeichnen und Vorschau erhalten.
- EV5.1: Standards-Abschnitt eines Quelltexts lesen; nur eindeutig je Kriterium verknuepfte Eintraege zaehlen. EV5.2/5.5: private bekannte Paare nur aus bestaetigten wirksamen Evaluationen des autorisierten Kindes.
- EV6: gespeicherte Kriterien ohne Bereich pruefen, wenn Katalog oder bekannte Paare jetzt einen positiven Vorschlag liefern; ruhiger Hinweis, Vorschau, genau eine Korrektur derselben Evaluation.

## Umgesetzt
- src/module/evaluation-uebernahme.mjs (rein), zwei Eintraege in module.json (auch evaluation-zuordnung, fehlte), kleine Verbraucher in index.html (Schulbereich), neue Modultests, angehaengte Browsertests.
- Keine Aenderung an Ereignisschema, Katalog, Speicher, Backend, Swift. Kein zweiter Speicher, kein neuer Ereignistyp.

## Korrektur A2 (F02/F03)
- F02: evUebLinkedFor trennt "keine Bindung" ([]) von "Bindung vorhanden" (alle Eintraege, auch unbekannt/gemischt/widerspruechlich). Eine vorhandene unsichere Bindung ergibt ueber evaluationZuordnungVorschlag hartes none; bekannt, KI und Aehnlichkeit greifen dann nicht. Ohne Kriterienbindung (keine Zeile, globale Liste, leere Eintraege) gilt weiter die normale niedrigere Quelle. Prioritaeten und F01-Schutz unveraendert.
- F03: Die Wachstumsfixture nutzt fuer die bereits zugeordnete Zeile einen anderen Text; gleicher bestaetigter Text bleibt bekannt und gewinnt (eigene Pruefung).
- Neue Tests: Modul (unsichere Bindung, Bindung vs. keine Bindung, Wachstum); Browser (Quelle mit unsicherer Bindung und echter Antwort; Fremdfamilie mit zweitem Elternteil und eigenem Kind; Kindwechsel mit Neuzuordnungsvorschau). Alle NOT_RUN durch Forge.
- Die Browser-Fixture gibt zusaetzlich access und admin der vorhandenen synthetischen Ablage zurueck (keine Zugangsdaten dupliziert).
- Fremdfamilie: "veralteter Submit" ist als fremdes Capture-Token der ersten Familie auf dem Geraet der zweiten Familie umgesetzt (invalid, 0 Schreibzugriffe), nicht als Kontowechsel auf einem Geraet.

## Pruefung
- Forge: NOT_RUN (keine Shell).
- Integration, unabhaengige QA und CI: offen, Atlas ergaenzt.
- Geraete-/Swift-Abnahme (echtes Toddle-Layout, nativer Standards-Abschnitt): ausdruecklich offen.

## Gefunden
- module.json enthielt keinen Eintrag fuer evaluation-zuordnung.
- Hinweis erscheint erneut, wenn Eltern bewusst "kein Bereich" gelassen haben, obwohl ein Vorschlag existiert (kein Speicher fuer Ablehnung erlaubt).
- Offen: Lehrkraft mit echter aktiver Schulfreigabe ohne Hinweis/Bestaetigung. Nicht umgesetzt: kein bekannter vorhandener Pfad, auf dem die Lehrkraft im v2-Browser das Kind liest; siehe CA_QUESTION im Handback. Keine Ersatzbehauptung.
- Kein Gesamt-Pass fuer Ziel1, EV5.4 oder EV7. Alle neuen Tests NOT_RUN.
