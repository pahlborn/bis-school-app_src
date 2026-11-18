# EP01 Rest · Entwicklung und Nachweise

Stand 18.11.2026. Nativer Codex-Entwickler `dev_content_ep01_codex`, keine Forge-/Claude-Ausführung. Auftrag `BQ-CONTENT-01-EP01-REST-CODEX-20261118`; Basis `3339da427b423d1353b7c83090728c157fc9a9a5`; eigener Zweig `feature/content-ep01-rest-20261118`. Modelluntervariante/Kosten unbekannt. Keine Veröffentlichung, kein Push, PR, Merge oder Deploy durch den Worker.

## Statischer Zwischenstand

Die 19 verbliebenen eingebetteten Banken liegen jetzt in `src/module/aufgabenbanken.mjs`, über die bestehende Modul-Pipeline eingebunden. Von den fünf bereits modularen Textsammlungen bleiben die vollständigen Stufe-1-Zeilen unverändert; nur vier nicht-grundlegende Formulierungen wurden gezielt angepasst. PREFIX, HYPO und OPFACT wurden fachlich geprüft und bleiben inhaltlich erhalten, da ihre bestehenden Nähe-/Längenbedingungen passen. NOW/POE/SCH behalten ihre geteilten Zeilenidentitäten.

Alle **25 erkannten statischen Sammlungen mit 230 Stufe-2/3-Varianten** einschließlich des unveränderten ROUND_MC bestehen den strikten und gleichstandsgewichteten Längentest mit Grenze 1/3. Dies ist noch kein vollständiges EP01: Generatorfamilien bleiben ausdrücklich OPEN, der globale Audit endet deshalb weiter mit Exit 1. Keine neue Guard-Architektur und keine Änderung des angenommenen AR-01-Identitätsvergleichs.

Die neuen Falschantworten unterscheiden fachlich nahe Begriffe, umgekehrte Wirkungsrichtungen, falsche Kontrollvariablen, ausgelassene Teilschritte oder unvollständige Begründungen. Beispiele:

- Friction: „Rubbing that slows things down“ gegenüber „Rubbing that speeds things up“.
- Hypothese: gleiches vorhergesagtes Ergebnis, aber vertauschte Oberflächenwirkung oder keine kausale Begründung.
- Arbeitsblatt: Zahl ohne Einheit statt Zahl **mit** Einheit; Antworten prüfen statt nur den Titel.
- Inferenz: „Ben came first“ gegenüber „Ben came last“, mit derselben Satzform.
- Verantwortung: Hilfe ohne Rückmeldung an die Lehrkraft statt Hilfe **und** Rückmeldung.
- Grammatik: Man-/Du-/Ich-/Wir-Form in sonst gleichem Satz.
- Bibliothek: Enzyklopädie gegenüber Suchmaschine/Videoquelle; Original-Sammelgebiet der Grimm-Märchen gegenüber anderen europäischen Märchensammlern.

Zwei echte Mehrdeutigkeiten wurden durch engere Aufgabenformulierungen vermieden: Nicht jede Website, die Videos zeigt, ist die für kurze animierte Erklärfilme bekannte Quelle; und „welche neue Variable?“ erlaubt sonst auch das Auto-Gewicht. Die Rampenfrage nennt deshalb das unveränderte Auto und den untersuchten Steilheitswechsel. Keine neuen Klassenereignisse erfunden; bestehende Fakten und Erklärungen bleiben maßgeblich. Ein Zeilenregister mit Frage, Lösung und erstem ernsthaftem Fehlkonzept steht unter `dev/static-review.json` im Auftragsarbeitsverzeichnis. Kein neuer Humor.

## Auslagerung, Grundlage und Hilfe

Vor Inhaltsänderungen wurden die reinen Auslagerungen geprüft: **4.000 echte Builder-Aufgaben** bleiben einschließlich qId bytegleich; JSON-SHA256 `438c28603f8bf3f30a19f8da9f151e05c559b1f126a4a285e0b726542bfb1734`, ID-SHA256 `8b0f0b39275f19452fa12f6661c5d42ff7e5bf5528e2854a9f46af22bb3d0113`.

Der vor Änderungen gesicherte Grundlagen-/Hilfe-Snapshot enthält **69.713 Fälle**, SHA256 `aab00e3fbad1e9eede3022f366f70fd030297aaa30d73a2a9dc4831029a4468b`. Die aktuelle App und die aus dem exakten Basiscommit mit dessen Originalmanifest/Originalmodulen gebaute App stimmen weiterhin überein. Zusätzlich werden alle Stufe-1-Zeilen aus HYPO/OREO/OPINION, OPFACT und SPECIFIC sowie die zwölf tatsächlichen AM/PM-Beispielpfade direkt verglichen. Die echte Rundungs-Moduldatei und der Rounding-Builder sind im statischen Zwischenstand bytegleich zur Basis.

Der frühere Rundungstest verwendet für seine ältere Referenz jetzt ebenfalls das Originalmanifest des gebundenen Commits. Das verhindert Namenskollisionen durch neue ausgelagerte Module, ohne die alte Referenz oder den qId-/Grundlagenschutz zu ändern. Globales mc/two/fill3, Einstufung, Belohnung und Datenhaltung bleiben unberührt.

## Eigene Prüfungen am statischen Zwischenstand

Rohlogs unter `/workspace/work/bq-content/ep01-rest/dev/`.

| Prüfung | Tatsächliches Ergebnis | Log |
|---|---|---|
| Neue Resttests + bestehende textfragen- und Rundungs-/Guardtests | 33/33, Exit 0, 0 übersprungen | `static-targeted.log` |
| Echte alte Basis gegen neuen statischen Guard | gezielt rot, Exit 1; 20 alte Längenverstöße werden erkannt | `static-red-old.log` |
| Bestehende Aufgaben-/Runden-/Beispieltests in Node | 6/6, Exit 0, 0 übersprungen | `static-app-node.log` |
| Browser: Fach-Quests/Practise Today, Rounding 8/8, echte Hilfe-Brücke | 3/3, Exit 0, 0 übersprungen; `/usr/bin/chromium` | `static-browser.log` |
| Reine Auslagerung | beide `cmp` Exit 0 | `extraction-before.json`, `extraction-after.json`, `foundation-before.json`, `foundation-after-extraction.json` |

Bestehendes Playwright 1.56.1 ohne package-/Lockfileänderung installiert; Node v24.22.1. Keine lokale Vollsuite-Wiederholung. Ein vollständiger grüner Gesamtnachweis gehört zum späteren finalen PR-Head und ist hier nicht vorweggenommen.

## Nächster Arbeitsschritt und Grenzen

Vor Generatoränderungen wird dieser statische Zwischenstand als lokaler Commit an Atlas zur parallelen unabhängigen Inhaltsprüfung übergeben. Die restlichen Generatoren werden anschließend im selben genehmigten Auftrag fortgesetzt. AM/PM bekommt fachlich echte vollständige Uhrzeiten; seine vorhandenen Gegenbeispiele Dinner/Breakfast bleiben exakt erhalten. Bei binären Sammlungen dürfen keine erfundenen dritten Bedeutungen oder stillen Längenausnahmen entstehen.

Die noch nicht überarbeitete halfwayQ-Familie ist konkret auffällig: vier numerische Fälle haben gewichteten Anteil 1/4, die Richtungsauswahl mit zwei Antworten 1/2; bei den tatsächlichen gleichwahrscheinlichen Generatorzweigen zusammen **3/8 = 37,5 %**. Vollständig enumeriert wurden 32 numerische Antwortzustände und 64 Richtungsfälle (`rounding-open-proof.mjs/.json`). Das wird Atlas vor jeder engen Korrektur gemeldet. Alle bereits verbesserten Rundungsfamilien bleiben geschützt. SPECIFIC bleibt im statischen Quellenformat ein Paar; die tatsächliche Stufe-2/3-Frage wird bei der Generatorprüfung auf einen möglichen Kürzestantwort-Hinweis geprüft. Grundlage dieser Familie bleibt unverändert.

Keine vollständige EP01-Annahme im Zwischenstand. Unabhängige Prüfung, Generatorabschluss und finaler CI-Nachweis stehen aus.
