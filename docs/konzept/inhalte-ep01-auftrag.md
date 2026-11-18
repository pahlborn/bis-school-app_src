# EP01 Antwortqualität und passender Humor

Auftrag BQ-CONTENT-01-EP01, Auftragsfassung1.1, Epic-Go vom18.11.2026. Eigenständiger Inhaltsauftrag, getrennt von Evaluationen Ziel1. Maßgeblich ist `docs/konzept/inhalt-motivation-entscheidungen.md` aus PR220, vollständig gelesen am18.11.2026, insbesondere Abschnitt3. Dieses Dokument geht dem Katalog1.1 und der vorherigen Auftragsfassung vor. Hier steht ein erster begrenzter Entwicklungsschnitt, keine vollständige EP01-Abnahme oder Releasefreigabe.

## Ziel und technische Verantwortung

Multiple-Choice-Aufgaben sollen eine fachliche Entscheidung verlangen. Mindestens eine Falschantwort liegt knapp daneben und beruht auf einem nachvollziehbaren typischen Denkfehler, mit ähnlicher Länge und Form. Eine alberne Alternative ist nur gelegentlich und nur bei genau vier Antwortmöglichkeiten zulässig; danach bleiben zwei ernsthafte Falschantworten. Höchstens eine alberne Option, passend zum Antwortformat, in Mathematik eine falsche Zahl mit passender Darstellung/Einheit. Bei drei Optionen kein Humor. Länge, Sprache oder Genauigkeit verraten die Lösung nicht systematisch. Die Grundlage-Stufe bleibt vollständig unverändert; dort sind deutlich falsche Antworten gewollt.

Der tatsächlich beauftragte Entwicklungsworker prüft die vorhandenen Mechanismen, benennt den kleinsten sinnvollen Schnitt, implementiert ihn und liefert eigene Tests. Atlas integriert nach unabhängiger Prüfung. Die tatsächliche native Identität oder ein tatsächlicher Claude-Lauf wird wahrheitsgemäß genannt; diese Datei startet keine Rolle.

## Exakte Eingangsreferenz

- Produktrepo pahlborn/bis-school-app_src, main959a51f6d84eca9eefd38f9bf1be9eee7216a97a. Entscheidungsdokument auf PR-Kopf3eead282e2df5f70b83d95ed7520e0543c6b4c4b, Blob3dbdc3fae63f667f561d996786a5f129391ea40d vollständig gelesen. Seit der ursprünglichen Basis4af792f wurden bis hier nur zwei Konzeptdokumente geändert; die genannten App-Zeilen sind unverändert.
- Eigener Zweig feature/content-ep01-quality-20261118; eigener Worktree. Vor Fortsetzung den Basiskopf und konkurrierende Änderungen prüfen.
- Aufgabenmechanismen: index.html:1189 mc, :1200 fill3, :1391 Rounding Road, :1444 ROUND_MC, :1808 roundTenQ, :2387 roundedQuestion. Zeilen gelten nur auf der genannten Basis.
- Bereits vorhandene Verbesserung: src/module/textfragen.mjs, Kommentar und Datenbestände A7/A8. Diese nicht ungeprüft erneut umbauen.
- Bestehende Prüfhilfen: tests/app-sandbox.mjs; tests/aufgaben-node.test.mjs; tests/aufgaben-anpassung.test.mjs; tests/fragen.test.mjs:57. Das alte Verbot sachfremder Textscherze ist mit erlaubtem Zahlenhumor vereinbar.

## Erster Schnitt und Ausschlüsse

Bevorzugter repräsentativer Schnitt: Multiple Choice in Rounding Road, mit Rundungsvarianten und mindestens einer sprachlichen Strategiefrage auf Jahrgangs- oder Herausforderungsstufe. Der technische Owner bestätigt die genaue Grenze nach Quellsichtung und erfasst den Restbestand explizit. Gemeinsam genutzte Generatoren wie `roundedQuestion` bedienen auch Stufe1: Die Grundlage-Stufe, ihre Antwortalternativen und ihre Hilfepfade werden nicht geändert. Auch binäre Grundlagentasks werden nicht erweitert. Eine reine Rundungs-Teillieferung erfüllt nicht die geforderte sammlungsübergreifende EP01-Abnahme.

Zulässige Änderungen sind die betroffene Aufgabenfamilie in index.html, eine eng begründete reine Aufgaben-Daten-/Hilfsfunktion in src/module falls erforderlich, zugehörige gezielte Tests sowie dieser Auftrag und der eigene Prüfbericht. Keine pauschale Änderung des globalen mc/fill3-Verhaltens für alle Quests ohne konkrete Rückmeldung über den erweiterten Wirkungsbereich. Vorhandene Zahlenformate, Schulmodell Nachbarzahlen/Mitte, Hilfe- und Einstufungsmetadaten erhalten.

Außerhalb: EP02–EP05, Sternwerte, Titel, Baum, Lernstandsschwellen, Tagesmischung, Anmeldung, Konten, Speicher, Synchronisation, Swift, Workflows/Relay, Rechte, neue Anbieter/Abhängigkeiten, vollständiges Redesign, Test-/Produktveröffentlichung. Produktcode und Dokumente haben ihre maßgebliche Quelle in diesem Produktrepo. Zeitweilige benötigte Arbeitskopien sind ausschließlich unter den Bedingungen aus `auftrag-atlas-evaluationen-ziel1.md`, Abschnitt7 erlaubt: Quell-Commit, minimale Auswahl, keine Geheimnisse/Namen Dritter, Prüfung gegen Produktquelle, nach Ende löschen und Anlage/Löschung wahrheitsgemäß vermerken. Die Relay-Anpassung ist ein eigener genehmigter Auftrag. Vor EP02–EP05 je höchstens zehn Zeilen Plan an Peter und Start erst nach seinem Ja; keine neue Nachweismatrix, keine Tagesbedingungen oder Zeitfenster entgegen dem maßgeblichen Entscheidungsdokument.

## Akzeptanzkriterien des Schnitts

1. Jede bearbeitete Frage hat genau eine fachlich richtige Antwort. Zahlenäquivalente, Einheiten, Rundung und Anzeigeformat erzeugen keine zweite richtige oder doppelte Option.
2. Mindestens eine ernsthafte Falschantwort liegt knapp daneben, hat ähnliche Länge/Form und entspricht einem dokumentierten typischen Denkfehler; bloße zufällige Zahlennähe genügt nicht. Ausnahme: unveränderte Grundlage-Stufe.
3. Unter ernsthaften Alternativen ist die richtige Antwort nicht systematisch länger, genauer oder sprachlich anders. Ein automatischer Test prüft jede Aufgabensammlung: richtige Antwort höchstens in etwa einem Drittel der Fälle die längste. Exakten Grenzwert, Behandlung von Gleichständen, Sammlungseinheit und endliche Generatorabdeckung im Test festlegen und begründen. Künftige Sammlungen werden mit erfasst; Humor oder bloßes Auffüllen von Text darf den Test nicht zur Abkürzung machen. Keine Forderung identischer Zeichenlängen und keine bloße Positionsmischung als Korrektur. Offene Sammlungen verhindern die vollständige EP01-Abnahme und werden ausdrücklich berichtet.
4. Humor nur gelegentlich, höchstens einmal und ausschließlich bei genau vier Antwortmöglichkeiten. Danach bleiben zwei ernsthafte Falschantworten, mindestens eine knapp daneben. Bei drei Optionen keine alberne Antwort. In Mathematik bleibt die alberne Option eine Zahl beziehungsweise passende numerische Darstellung. Der Owner begründet Lernziel und gelegentlichen Einsatz; keine Scherzpflicht.
5. Für den betroffenen Generator werden Varianten und Randfälle vollständig beziehungsweise mit ausdrücklich begründeter endlicher Domäne geprüft; ein bloß zufälliger Beispieldurchlauf ist kein Vollständigkeitsbeleg. Richtige Ergebnisse unabhängig nachrechnen, Null-/Grenz-/Mittenfälle und Fallbacks berücksichtigen.
6. Erklärungen greifen den relevanten Zusammenhang auf. Nachbarzahlen-/Mitte-Schulmodell und bestehende Unterstützung bleiben erhalten; kein Ersatz durch die verbotene isolierte Ziffernregel.
7. Der tatsächliche App-Pfad bleibt spielbar: eindeutige Auswahl, richtige Wertung und Rückmeldung, vollständige Runde. Keine Änderung von Belohnung, Titel, Baum oder bestehender Datenhaltung.
8. Bestehende einschlägige Prüfungen bleiben erhalten oder werden wegen der ausdrücklich geänderten Anforderung gezielt ersetzt, ohne Schutzfälle zu schwächen. Eine neue Prüfung muss gegen den fehlerhaften Altzustand oder eine fachlich gezielte Mutation nach funktionierendem Setup scheitern.
9. Grundlage-Stufe vollständig unverändert: Das gilt auch für Aufrufe gemeinsamer Generatoren und Hilfe-Brücken. Hier dürfen die gewollten deutlich falschen Antworten bleiben. Vorher-/Nachher-Vergleich und bestehende Grundlagentests sichern diese Grenze; keine stille Ausnahme.

## Prüfung und Rückgabe

Zuerst vorhandene Node-Prüfwege verwenden. Ausgangsbefehle: node --test tests/module/textfragen.test.mjs tests/aufgaben-node.test.mjs tests/aufgaben-anpassung.test.mjs. Nach Änderung zusätzlich die neue gezielte Qualitätsprüfung, notwendige Browserchecks aus tests/fragen.test.mjs und zum Integrationskandidaten npm test gemäß Produktpraxis. Verfügbare Chromium-/Playwright-Umgebung vor Nutzung prüfen. Nur betroffene Checks nach sachlichen Korrekturen wiederholen, Abschlussprüfung nicht erfinden.

Eigener Commit und Zweig, geänderte Dateien, Entscheidung zur Familiengrenze, sinnvolle Vorher/Nachher-Beispiele, fachliche Begründung der Falschantworten, tatsächliche Befehle/Exitcodes/Logs, rote Gegenprobe und verbleibender EP01-Restbestand werden in docs/pruefung/2026-11-18-inhalte-ep01.md dokumentiert. Worker pusht/mergt/veröffentlicht nicht selbst. Atlas organisiert genau einen unabhängigen Sentinel-Nachweis gegen den exakten Kandidaten; offene Pflichtbefunde bleiben offen.

## Genehmigter tatsächlicher Ausführungsweg

EP01 selbst ist freigegeben. Der bisherige reguläre Relay-Vertrag deckte die benötigten Aufgabenquellen nicht ab. Peter hat die Relay-Anpassung und danach ausdrücklich die gemeinsame Auftragsquellen-Lösung gewählt: `AG-RELAY-AUFTRAGSQUELLEN-20261118`, genaue Dateiauswahl, gebundene Ausschnitte statt voller `index.html`, geprüfte Patch-Rückgabe und Bereinigung. Das getrennte EP01-Sonderprofil wird nicht integriert. Vor dem Produktlauf den tatsächlich geprüften gemeinsamen Vertrag und dessen Version binden; ein laufender Workflow ist noch kein nutzbarer Vertrag.

Regulärer Forge bleibt technischer Owner; keine native Entwicklungsvertretung genehmigt oder gestartet. Die frühere Anfrage zu `dev_content_ep01` ist damit überholt. Die spezielle native Genehmigung für Evaluationen Ziel1 wird nicht auf diesen Inhaltsauftrag übertragen. Eigener Produktzweig, unabhängige Prüfung und Gegenprobe bleiben erforderlich.


## Tatsächliche Ausgangsprüfung

18.11.2026: Die drei benannten Node-Dateien wurden am unveränderten Produktcode4af792f2b917f42fabe5c4c5d340302dd3d5c1ef ausgeführt:14Tests,14bestanden,0fehlgeschlagen,0übersprungen, Exit0. Das ist der historische Ausgangsstand, kein Nachweis einer bereits umgesetzten Änderung oder eines neu ausgeführten Längentests. App- und Testquellen sind bis main959a51f unverändert; nur Konzeptdokumente kamen hinzu. Vollständiges lokales Log: ep01-baseline-tests.log im Arbeitsverzeichnis dieses Auftrags. Keine neue Testausführung für diese reine Dokumentanpassung.
