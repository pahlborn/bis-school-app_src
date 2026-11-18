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

## Aktueller Nachweis durch Atlas und Sentinel, 18.11.2026

Die vorstehenden NOT_RUN/offen-Angaben dokumentieren die damalige Forge-Rueckgabe. Die nachstehenden ausgefuehrten Nachweise schliessen F02/F03/F04 und die echte Lehrkraft-Browserfrage; sie sind keine Gesamt- oder Geraeteabnahme.

- Kanonischer gepruefter Stand: `review/ev5-ev6-main-20261118`, Commit `8f70105909a1d3af70570dd3fe2ca67338deb939`, Tree `a05f07c84cad305410c4c62674106efd9de4e742`. Aktueller main `2c1b1a434fd122efdae66222d49a49044782a554` ist enthalten. Der folgende reine Historien-Merge `e00460d0602c8c47e7810b186da389861c965206` bindet den bisherigen PR227-Kopf ein und behaelt denselben Tree.
- Autor Forge/Claude, [Testlieferung44377638097](https://github.com/pahlborn/agentarium/actions/runs/44377638097), Sitzung `cce8e27f-7d28-4925-9424-c88162945b08`; Atlas hat den Patch unveraendert mit `git apply --recount` integriert. Handback-SHA256 `803ec31f671d3add1800c473c7b2ff418e5994340fedc31010ff395f2dee2705`. Nur Testfixture/Lehrkraftfall geaendert, keine Produktionsauthentifizierung oder Grant-/Sync-Implementierung.
- F02/F03: urspruenglicher Quellenkonflikt gegen alten Stand rot, korrigierte eigene Modulpruefungen9/9 und Autorenmodule10/10 bestanden. Urspruengliche Browser-Gegenprobe alt0/1, neu1/1. Nach main-Integration bestehen beide Autorenmodule zusammen31/31. Die ersten fehlgeschlagenen Staende bleiben im [Befundbericht](https://github.com/pahlborn/bis-school-app_src/pull/227#issuecomment-6988675684) nachvollziehbar.
- F04: frische Zweitfamilie oeffnet zuerst bestehende Familieneinstellungen, ohne bereits einen Schulbereich vorauszusetzen. Die urspruengliche Fremdfamilienprobe erreicht jetzt saemtliche Abgrenzungs-/Schreibschutz-Assertions. Zeitlimits und Assertions wurden nicht abgeschwaecht.
- Unabhaengiger Sentinel A3: Autorenbrowser3/3 (Fremdfamilie, Kindwechsel, echte Lehrkraft), eigener unveraenderter Familien-Gegenfall FAM01 1/1, jeweils Exit0. Zwei tatsaechliche synthetische Familien behalten verschiedene bestaetigte Zuordnungen derselben Formulierung; Vorschau schreibt nichts. Lehrkraft positiv: tatsaechliche Lehrerrolle, echter `grant_set` mit `school`, sichtbares berechtigtes Kind und dieselbe Evaluation samt Kriterien; anschliessend kein Hinweis/Formular und kein neues Evaluationsevent bei veraltetem Submit.
- Die zunaechst vermutete wirkungslose DIV-Gegenprobe ist fuer diesen Stand widerlegt: `index.html:6425` bindet den Container, `:6538` dessen Submit-Listener. Eigene Browserinstrumentierung belegt einen Listener und genau einen Aufruf des unveraenderten Produktcallbacks beim veralteten Submit, bei weiter unveraenderter Eventzahl. Daraus folgt kein weiterer Forge-Fix.
- Sentinel-Bericht SHA256 `9582666b3f72fc2a3a1d47108e711f911eb2c7aa464255daac6b9542464677c8`, Ausfuehrungsregister `a894643f9c6961a807a82f2575be2251bb82a207119d0d0123ed1c9c61d97fea`. [Eigene Rueckgabe](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6989214744). Autorenlog `ff77453d72aaa330bd08ca41a068aa58e9b185a89904971fcecdc177e9186d35`, FAM01 `9492861d2821a9f9fdbb53a264da389829ff1a6b9d68228e2ea1c95ea2b1f72c`, Callbackkontrolle `fe830943d233a901efc7568bae32e6bedc90ea829afbc71acd493a368be2f4aa`.
- Bestehender lokaler Testweg: Node24.22.1, Playwright1.56.1, Chromium156, `CHROMIUM_PATH=/usr/bin/chromium`. Anfaenglich fehlender Defaultbrowser und ein ungueltiger Instrumentierungsversuch sind Setupfehler, keine Produkt-Gegenprobe. Ein eigener Ausgabefilterfehler bei synthetischen Fixturewerten wurde gemeldet; keine Werte hier wiederholt. Keine Installation oder Infrastrukturkorrektur.

Noch offen: komplette CI des gemeinsamen finalen Kopfes, vollstaendige iPad-Huelle/EV5.4, echtes Toddle-Layout und EV7 am Geraet/Browser mit Peters Rueckmeldung. Die oben bestandene begrenzte QA ist keine Merge-, Veroeffentlichungs- oder Gesamtfreigabe.
