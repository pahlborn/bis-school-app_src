# EP01 Antwortqualität und passender Humor

Auftrag BQ-CONTENT-01-EP01, Fassung1.0, Nutzer-Go vom18.11.2026. Eigenständiger Inhaltsauftrag, getrennt von Evaluationen Ziel1. Konzeptfassung1.1 wurde erstellt und unabhängig auf Konzeptebene geprüft; hier steht der erste begrenzte Entwicklungsschnitt. Keine Releasefreigabe.

## Ziel und technische Verantwortung

Multiple-Choice-Aufgaben sollen eine fachliche Entscheidung verlangen. Mindestens eine Falschantwort beruht auf einem nachvollziehbaren Denkfehler. Optional darf höchstens eine weitere Alternative bewusst albern sein; sie muss zum Antwortformat passen, bei Mathematik also eine falsche Zahl mit passender Darstellung/Einheit. Unter den ernsthaften Antworten soll Länge, Sprache oder Genauigkeit die Lösung nicht systematisch verraten.

Der tatsächlich beauftragte Entwicklungsworker prüft die vorhandenen Mechanismen, benennt den kleinsten sinnvollen Schnitt, implementiert ihn und liefert eigene Tests. Atlas integriert nach unabhängiger Prüfung. Die tatsächliche native Identität oder ein tatsächlicher Claude-Lauf wird wahrheitsgemäß genannt; diese Datei startet keine Rolle.

## Exakte Eingangsreferenz

- Produktrepo pahlborn/bis-school-app_src, main4af792f2b917f42fabe5c4c5d340302dd3d5c1ef.
- Eigener Zweig feature/content-ep01-quality-20261118; eigener Worktree. Vor Fortsetzung den Basiskopf und konkurrierende Änderungen prüfen.
- Aufgabenmechanismen: index.html:1189 mc, :1200 fill3, :1391 Rounding Road, :1444 ROUND_MC, :1808 roundTenQ, :2387 roundedQuestion. Zeilen gelten nur auf der genannten Basis.
- Bereits vorhandene Verbesserung: src/module/textfragen.mjs, Kommentar und Datenbestände A7/A8. Diese nicht ungeprüft erneut umbauen.
- Bestehende Prüfhilfen: tests/app-sandbox.mjs; tests/aufgaben-node.test.mjs; tests/aufgaben-anpassung.test.mjs; tests/fragen.test.mjs:57. Das alte Verbot sachfremder Textscherze ist mit erlaubtem Zahlenhumor vereinbar.

## Erster Schnitt und Ausschlüsse

Bevorzugter repräsentativer Schnitt: Multiple Choice in Rounding Road, mit Rundungsvarianten und mindestens einer sprachlichen Strategiefrage. Der technische Owner bestätigt die genaue Grenze nach Quellsichtung und erfasst den Restbestand explizit. Binäre grundlegende Vergleichsaufgaben werden nicht allein für eine Scherzoption künstlich erweitert.

Zulässige Änderungen sind die betroffene Aufgabenfamilie in index.html, eine eng begründete reine Aufgaben-Daten-/Hilfsfunktion in src/module falls erforderlich, zugehörige gezielte Tests sowie dieser Auftrag und der eigene Prüfbericht. Keine pauschale Änderung des globalen mc/fill3-Verhaltens für alle Quests ohne konkrete Rückmeldung über den erweiterten Wirkungsbereich. Vorhandene Zahlenformate, Schulmodell Nachbarzahlen/Mitte, Hilfe- und Einstufungsmetadaten erhalten.

Außerhalb: EP02–EP05, Sternwerte, Titel, Baum, Lernstandsschwellen, Tagesmischung, Anmeldung, Konten, Speicher, Synchronisation, Swift, Workflows/Relay, Rechte, neue Anbieter/Abhängigkeiten, vollständiges Redesign, Test-/Produktveröffentlichung. Keine Quelltextkopien in Agentarium oder Eingabepakete. Produktcode und Dokumente bleiben in diesem Produktrepo.

## Akzeptanzkriterien des Schnitts

1. Jede bearbeitete Frage hat genau eine fachlich richtige Antwort. Zahlenäquivalente, Einheiten, Rundung und Anzeigeformat erzeugen keine zweite richtige oder doppelte Option.
2. Mindestens eine ernsthafte Falschantwort entsteht aus einem dokumentierten typischen Denkfehler; bloße zufällige Zahlennähe genügt nicht.
3. Unter ernsthaften Alternativen ist die richtige Antwort nicht systematisch länger, genauer oder sprachlich anders. Keine Forderung identischer Zeichenlängen und keine bloße Positionsmischung als Korrektur.
4. Eine optionale bewusst alberne Alternative bleibt eine Zahl beziehungsweise passende numerische Darstellung. Höchstens eine solche Option; mindestens eine fachlich glaubwürdige Alternative bleibt. Der Owner begründet, wo Humor zum Lernziel passt, statt jede Karte zwanghaft zu versehen.
5. Für den betroffenen Generator werden Varianten und Randfälle vollständig beziehungsweise mit ausdrücklich begründeter endlicher Domäne geprüft; ein bloß zufälliger Beispieldurchlauf ist kein Vollständigkeitsbeleg. Richtige Ergebnisse unabhängig nachrechnen, Null-/Grenz-/Mittenfälle und Fallbacks berücksichtigen.
6. Erklärungen greifen den relevanten Zusammenhang auf. Nachbarzahlen-/Mitte-Schulmodell und bestehende Unterstützung bleiben erhalten; kein Ersatz durch die verbotene isolierte Ziffernregel.
7. Der tatsächliche App-Pfad bleibt spielbar: eindeutige Auswahl, richtige Wertung und Rückmeldung, vollständige Runde. Keine Änderung von Belohnung, Titel, Baum oder bestehender Datenhaltung.
8. Bestehende einschlägige Prüfungen bleiben erhalten oder werden wegen der ausdrücklich geänderten Anforderung gezielt ersetzt, ohne Schutzfälle zu schwächen. Eine neue Prüfung muss gegen den fehlerhaften Altzustand oder eine fachlich gezielte Mutation nach funktionierendem Setup scheitern.

## Prüfung und Rückgabe

Zuerst vorhandene Node-Prüfwege verwenden. Ausgangsbefehle: node --test tests/module/textfragen.test.mjs tests/aufgaben-node.test.mjs tests/aufgaben-anpassung.test.mjs. Nach Änderung zusätzlich die neue gezielte Qualitätsprüfung, notwendige Browserchecks aus tests/fragen.test.mjs und zum Integrationskandidaten npm test gemäß Produktpraxis. Verfügbare Chromium-/Playwright-Umgebung vor Nutzung prüfen. Nur betroffene Checks nach sachlichen Korrekturen wiederholen, Abschlussprüfung nicht erfinden.

Eigener Commit und Zweig, geänderte Dateien, Entscheidung zur Familiengrenze, sinnvolle Vorher/Nachher-Beispiele, fachliche Begründung der Falschantworten, tatsächliche Befehle/Exitcodes/Logs, rote Gegenprobe und verbleibender EP01-Restbestand werden in docs/pruefung/2026-11-18-inhalte-ep01.md dokumentiert. Worker pusht/mergt/veröffentlicht nicht selbst. Atlas organisiert genau einen unabhängigen Sentinel-Nachweis gegen den exakten Kandidaten; offene Pflichtbefunde bleiben offen.

## Noch zu genehmigender tatsächlicher Ausführungsweg

EP01 selbst ist freigegeben. Der geprüfte reguläre öffentliche Relay auf Agentarium-main21a6f8f erlaubt für BigQuest nur package.json, src/module/runde.mjs und tests/module/runde.test.mjs, nicht die hier benötigten Aufgabenquellen. Eine lokale Claude-Laufzeit und ein direkter Claude-Connector wurden hier nicht gefunden; die alten Forge-Workflows sind Identitätsproben, kein freier Produktauftrag. Es wird kein Relay-Umweg mit Quelltextkopien oder neue Infrastruktur ausgelöst.

Vorgeschlagene konkrete Vertretung: tatsächlicher nativer Entwicklungsworker dev_content_ep01 auf dem oben genannten eigenen Produktzweig und innerhalb dieser Dateigrenzen, unabhängig geprüft durch regulären Sentinel. Vor seinem Start muss Peter diesen benannten Einsatz gemäß Agentarium AGENTS/Vertretungsentscheidung15.11.2026 ausdrücklich genehmigen. Die spezielle native Genehmigung für Evaluationen Ziel1 wird nicht ungeprüft auf diesen neuen Inhaltsauftrag ausgeweitet.


## Tatsächliche Ausgangsprüfung

18.11.2026: Die drei benannten Node-Dateien wurden am unveränderten Produktcode4af792f2b917f42fabe5c4c5d340302dd3d5c1ef ausgeführt:14Tests,14bestanden,0fehlgeschlagen,0übersprungen, Exit0. Das ist der Ausgangsstand, kein Nachweis einer bereits umgesetzten Änderung. Vollständiges lokales Log: ep01-baseline-tests.log im Arbeitsverzeichnis dieses Auftrags; kein zusätzlicher Quelltext- oder Archivexport. Die konkrete Zustimmung zum nativen Einsatz ist angefragt und noch nicht als erteilt vermerkt.
