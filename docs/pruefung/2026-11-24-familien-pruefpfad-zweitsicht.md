# Elternbereich C/G · Zweitmeinung zum Familien-Prüfpfad

Stand 24.11.2026 · BQ-PARENTS-FAMILY-DIAG-20261124 V1 · Diagnose beendet, Umsetzung angehalten.

## Anliegen und genaue Grundlage

Nach drei erfolglosen Versuchen des ergänzten Familien-Browserfalls hat Peter eine frische, eng begrenzte Codex-Zweitsicht genehmigt. Auftrag: [PR206, Kommentar7122577718](https://github.com/pahlborn/bis-school-app_src/pull/206#issuecomment-7122577718). Zweck ist die Zweitmeinung vor einem weiteren Versuch nach Abschnitt6 des Atlas-Auftrags, keine Fortsetzung der Textumsetzung.

- Integrationsbasis: `main` auf `d5ae13528ad1eb4eb508750be5cae02e58d9d37b`, am24.11. über GitHub bestätigt.
- Prüfstand: `0c0b572d1ae632097ac24007f3fbc908da3e24ef`, Tree `cf2d4630deef84b00d0e8894f26e1119f534848f`, Zweig `feature/elternbereich-c-g-texte-20261123`.
- Tatsächlicher Prüfer: frische Codex-Instanz `/root/codex_familien_pruefpfad_zweitsicht_20261124` in Argus-Rolle, ohne Beteiligung an den drei Versuchen. Start24.11.,06:03:39 Uhr Europe/Berlin. Atlas konsolidiert diesen Bericht.
- Pflichtquellen und vollständiger betroffener Änderungsschnitt wurden gelesen. Keine geltende AGENTS.md in Produktbaum oder Vorfahren gefunden.

## Gefunden

**RA_REVIEW: FAIL für den vorliegenden Familien-Prüfnachweis.** Die Ursache ist aus dem Quellpfad hergeleitet. Die vorgeschlagene Korrektur ist weder umgesetzt noch durch einen neuen Lauf bestätigt.

Der Zusatz in [`tests/familienfassung.test.mjs:473`](https://github.com/pahlborn/bis-school-app_src/blob/0c0b572d1ae632097ac24007f3fbc908da3e24ef/tests/familienfassung.test.mjs#L473) öffnet einen frischen Browserkontext und kopiert ausschließlich `localStorage`. Die Konto-Schlüssel liegen dagegen in IndexedDB und werden beim Start über `kontoSchluesselLaden()` gelesen ([index.html:5361](https://github.com/pahlborn/bis-school-app_src/blob/0c0b572d1ae632097ac24007f3fbc908da3e24ef/index.html#L5361)).

Die kopierte Kontoliste enthält allein keine Eltern-Kind-Zuordnung ([anmeldung.mjs:294](https://github.com/pahlborn/bis-school-app_src/blob/0c0b572d1ae632097ac24007f3fbc908da3e24ef/src/module/anmeldung.mjs#L294)). Diese ergänzt `kontoKontenAuffrischen()` für geöffnete Elternkonten ([index.html:5544](https://github.com/pahlborn/bis-school-app_src/blob/0c0b572d1ae632097ac24007f3fbc908da3e24ef/index.html#L5544)). Eine kopierte Erwachsenen-Sitzung kann trotzdem den Elternrahmen mit `#parentClose` anzeigen. Dieses Element beweist daher keine verfügbare Kindzuordnung.

Ohne Kindzuordnung bleibt `viewedKid()` leer. Schulabschnitt und Sicherungsberechtigung fehlen dann ebenfalls. Der vorhandene Navigationshelfer öffnet nur Ansichten; er meldet kein Konto an. Weitere Navigation oder längeres Warten ersetzt den fehlenden Anmeldeschritt nicht.

Damit sind die bisherigen Symptome durch den Prüfaufbau erklärbar. **Ein Produktfehler bei `canBackup` oder ein Schlüsselverlust in einer realen App ist hierdurch nicht nachgewiesen.**

## Kleinster Vorschlag, noch nicht umgesetzt

Im bestehenden `familyCopyBrowser` nach dem ersten `#parentClose` regulär abmelden und das vorhandene synthetische Elternkonto über die bestehende Anmeldeoberfläche anmelden. Anschließend die bestehenden Schul-, Sicherungs-, DE/EN- und Unverändertheitsassertionen weiterverwenden.

Die reguläre Anmeldung legt die Konto-Schlüssel ab und ermöglicht die Kindzuordnung. Quellen: Logout `index.html:6889` und `:5824`; Loginoberfläche `:4858`; Schlüsselablage `:5300`; bestehender Zweitgeräteweg `tests/familienfassung.test.mjs:401`; bestehender Browserlogin `tests/konto-einladungen-browser.test.mjs:52`.

Erforderlicher enger Gegen-/Nachweis nach Freigabe:

1. Im nur kopierten Zustand die fehlende Kindbereitschaft feststellen; die bisherige Fassung ohne vollständige Anmeldung muss daran scheitern.
2. Nach regulärer Anmeldung das erwartete synthetische Kind und dessen Schul-/Übungsbestand nachweisen.
3. Dieselben bestehenden Prüfungen für Sicherung und DE/EN-Darstellung bestehen lassen. Keine Rechte, Fallzahlen, Textlängengrenzen oder Timeouts abschwächen.

Der Vorschlag betrifft ausschließlich den bestehenden Testhelfer. Kein Transfer von Schlüsselbeständen, kein Umbau von IndexedDB, Produktcode, Datenmodell, Berechtigungen oder Infrastruktur ist dafür vorgeschlagen.

## Tatsächliche Prüfung und Grenzen

| Gegenstand | Ergebnis |
| --- | --- |
| Zweckbindung und Quellenbasis | bestanden, durch Quellenprüfung |
| Ursache des fehlenden Kinderzustands | aus dem Quellpfad hergeleitet |
| Korrigierter Browserpfad | nicht getestet, nicht umgesetzt |
| Familien-C/G-Texte DE/EN | weiterhin blockiert |
| Vollständige Suite und gesamte PR1-Abnahme | nicht ausgeführt, weiterhin offen |
| Kontenloser G-Funktionsfall | ausgeschlossen, bleibt geplanter PR6-Umfang |
| Physischer iPad-Test | nicht ausgeführt |

Beobachtet wurden Quellen und Git-Zustände. Die drei früheren Fehlversuche stammen aus dem [Entwicklungsbericht](2026-11-23-elternbereich-c-g-texte.md), nicht aus eigenen Wiederholungen des Prüfers. Kein neuer Test- oder Buildlauf: Ein weiterer unveränderter Timeout hätte die fehlende Zustandsübertragung nicht zusätzlich geklärt.

Tatsächliche Leseoperationen: `git show`, `git diff`, `rg`, `sed` und lesende Python-Ausgaben; relevante Reads Exit0. AGENTS-Suche ohne Treffer Exit1. Node `v24.22.1` und vorhandenes `/usr/bin/chromium` bestätigt. Trackedstatus vor/nach leer; `git diff --quiet` und `git diff --cached --quiet` jeweils Exit0. Der Prüfer hat weder Dateien geändert noch Worktree, Laufartefakte oder Sourcekopien angelegt.

## Entscheidung und nächster Schritt

Peter entscheidet über die begrenzte Testkorrektur und den fokussierten Gegen-/Nachweis. Empfehlung: den vorhandenen synthetischen Anmeldeweg benutzen. Einfachere Alternative: eine bereits bewährte Familien-Browseranmeldung verwenden, falls der Zusatz entbehrlich wird; bestehende Darstellungsprüfungen bleiben erforderlich. Zurückstellen bleibt möglich.

Die Textumsetzung ist weiterhin angehalten. Der ursprüngliche unvollständige Stand ist nicht integrationsbereit; weitere Textassertionen, die Textlänge7030 bei Grenze7000, abschließende Bau-/Darstellungs-/Verbotenprüfungen und die vollständige Suite bleiben offen. Dieser reine Diagnosebericht erteilt keine Umsetzung-, Merge- oder Veröffentlichungsfreigabe. Nach einer späteren Korrektur ist deren tatsächliche Wirkung getrennt nachzuweisen.
