# Evaluationen Ziel 1: Restabschluss

Stand 22.11.2026 · Auftrag von Peter: den Restabschluss der Evaluationen klären. Führende Produktquelle: `e17a46b1463b4d20a6ad5a4ecfde9ecb28467f86`. Atlas hat die Storynachweise abgeglichen; der unabhängige Sentinel hat ausschließlich den offenen Offline-/Kontoschlüsselwechsel-Fall geprüft.

Die Übernahmekette ist umgesetzt. Die echte iPad-Übernahme und der manuelle Browser-Ergebnisvergleich sind bereits schrittweise bestanden. Ein vollständiger Abschluss aller Ziel-1-Kriterien folgt daraus noch nicht: Diagnosewerte aus EV-1.2 fehlen; im Offline-/Kontoschlüsselwechsel-Sonderfall ist jetzt ein konkreter Übertragungsfehler im Modulintegrationstest nachgewiesen. Frühere offene Integrationslisten sind durch die nachfolgenden Produktlieferungen weitgehend überholt.

## Maßgeblicher Stand

- Verbindlich sind der [Ziel-1-Auftrag](../konzept/auftrag-atlas-evaluationen-ziel1.md), die [EV-Stories](../konzept/evaluationen-ziel1-epics.md) und die späteren [Inhaltsentscheidungen einschließlich W1](../konzept/inhalt-motivation-entscheidungen.md). Die Web-only-/Betriebsplanung vom 16.11. ist durch den Auftrag vom 17./18.11. ersetzt: Playground mit KI; Browser mit manueller Eingabe.
- Die veröffentlichte Test-Beta ist 0.152.6/e17a46b. Ihre Veröffentlichung und Byteprüfung sind kein neuer iPad-Abnahmelauf. Die manuellen EV-7-Ergebnisse gelten für die im [Test15-Nachtrag](2026-11-19-test15-evaluationswirkung-fix.md#abnahmenachtrag--21112026) getrennt genannten Quellen 0.152.4 und0.152.5.
- Wiederverwendete Software-Nachweise: [PR219](https://github.com/pahlborn/bis-school-app_src/pull/219) 985/985, [PR223](https://github.com/pahlborn/bis-school-app_src/pull/223) 1017/1017 samt Swift-CI, [PR227](https://github.com/pahlborn/bis-school-app_src/pull/227) 1090/1090 samt Swift-CI, [PR233](https://github.com/pahlborn/bis-school-app_src/pull/233) 1180/1180, [PR237](https://github.com/pahlborn/bis-school-app_src/pull/237) 1242/1242. Die PRs sind integriert. In diesem Abgleich wird keine dieser Vollsuiten erneut ausgeführt.

## Abgleich aller 28 Stories

„Software belegt“ bezeichnet vorhandene Produkt-/Testnachweise auf den angegebenen Vorgängerständen, keine neu ausgeführte unabhängige Gesamtprüfung oder Kundenannahme. Neuere grüne Gesamt-CI schützt die Kombination; die Grenzen eines physischen Gerätetests bleiben bestehen.

| Story | Belegter Stand | Maßgeblicher Nachweis / Grenze |
|---|---|---|
| EV-1.1 Feste Kennung | Software belegt; Gerätevergleich durchgeführt | [EV1-Bericht](2026-11-17-ev1-playground-kennung-schluesselbund.md), [Test12](2026-11-18-test12-geraetetest.md): Kennung fest; Paketwechsel12→13 **nicht gehalten** und so dokumentiert. Kein Persistenz-PASS über getrennte Playground-Projekte. |
| EV-1.2 Diagnose | Software und erfolgreiche Speicherung/Neustart belegt; Detailnachweis offen | Test12 nennt Save 0 und StartRead 0, aber keinen gesonderten unmittelbaren Read-Code und keine vollständige AccessGroup beim Speichern. R1 unten. |
| EV-1.3 Gerätebindung merken | Software und geforderter Neustart belegt | [Test14-Nachtrag](2026-11-18-ev1-3-geraeteverbindung.md): „weiterhin verbunden“ im selben Projekt. Keine intern beobachtete erzwungene Wiederherstellung behauptet. |
| EV-1.4 Bedingter RAM-Rückfall | Nicht ausgelöst | Unterschiedliche Schlüsselbund-Bereiche zweier Projekte belegen keinen Reset im selben Projekt. Kein weiterer Reparaturauftrag daraus. |
| EV-2.1 Kriterien speichern | Software belegt | [EV2](2026-11-17-ev2-kriterien.md): Kriterienstruktur, 50er-Grenze, ungültige Codes und Mischformen; `evaluation-kriterien.test.mjs`. |
| EV-2.2 Ableitung je Standard | Software belegt | EV2: mehrere Standards, gemeinsame Revision/Datum, `none` und leere Noten. |
| EV-2.3 Schwächere Einstufung | Software belegt | EV2 plus [EV4](2026-11-18-ev4-formular.md): Originalnoten erhalten, bestätigte Elternkorrektur, austauschbare Aggregationsregel. |
| EV-2.4 Alte Daten | Software belegt | EV2/EV4: `school_import`, alte Einstandardform und Test11-Form; kein Umschreiben beim Lesen. |
| EV-2.5 Einmal beim richtigen Kind | Grundfälle belegt; zusätzlicher Transportfall fehlgeschlagen | EV2/EV4: Doppelbestätigung, Kind-/Kontowechsel, Revision/Rücknahme, zwei Evaluationen. Test15 ergänzt echte Anzeige/Abgleich; REST-ROT-01 bleibt als zusätzlicher weitergeführter EP06-Fall offen. |
| EV-3.1 Standards auch ohne Quest | Software belegt | [EV3](2026-11-17-ev3-standardkatalog.md), EV4: `E-S1` wählen/speichern ohne Fokus; `standardkatalog.test.mjs` prüft spätere Hauptquest→Lücke/Fokus. Verschiedene gezielte Teilnachweise, kein neuer gemeinsamer Lauf dieses Abgleichs. |
| EV-3.2 Katalogpflege | Software belegt | Eine Liste, 15 **bekannte** Standards, beide Sprachen, gültige Haupt-/Nebenränge und Pflegeanleitung. Vollständiger Jahreslehrplan gehört zur späteren Inhaltserweiterung, keine Standards auf Vorrat erfinden. |
| EV-3.3 Grundlage-Beispiele | Software belegt | [EV3.3](2026-11-18-ev3-3-grundlage-beispiele.md) und PR219: passende andere Beispiele, begründete feste Antwortausnahmen, Hilfe bleibt Hilfe. Finale CI 985/985 ersetzt den alten offenen CI-Vermerk. |
| EV-4.1 Bereich je Kriterium | Software belegt | EV4: Katalogauswahl/`none`, beschriftet, Tastaturbedienung. |
| EV-4.2 Fachauswahl | Software belegt | EV4: echte Fachschlüssel und Zuordnung in der Anzeige; Altschlüssel lesbar. |
| EV-4.3 Vorschau | Software belegt | EV4: je Kriterium/Bereich, schwächere Note mit Korrektur, Vorschau schreibt0. Bewusste manuelle Vorschauprüfung im Safari-Gerätetest wurde nicht gemeldet; sie bleibt ein eigener Softwarebeleg. |
| EV-4.4 Ersatzweg | Software belegt | EV4 plus PR223/227 Swift-CI: terminale Einstufung; `Part C … M`→M; fehlende Endnote bleibt leer. |
| EV-4.5 Darstellung | Software belegt | EV4: DE/EN, Dunkelmodus320px, native Auswahl/Tastatur; kein eigener Hardware-Screenreader-Test verlangt oder behauptet. |
| EV-5.1 Toddle-Standards | Software und geforderte Quellenbeobachtung belegt | [EV5/6](2026-11-18-ev5-ev6-formular.md); [Nutzerrückmeldung22.11.](https://github.com/pahlborn/bis-school-app_src/pull/206#issuecomment-7074093635): Abschnitt im echten Toddle vorhanden. Das beweist keine konkreten Quellverknüpfungen. |
| EV-5.2 Bekannte Kriterien | Software belegt | EV5/6: nur normalisiert wortgleich, private bestätigte kindgebundene Paare, Fremdfamilien-Gegenprobe. |
| EV-5.3 Wortähnlichkeit | Software belegt | `evaluation-zuordnung` mit Referenztexten und Schwelle; unsicher bleibt `none`. |
| EV-5.4 Claude im Playground | Software und echte Formularbefüllung belegt | [Vollständige Hülle](2026-11-18-ipad-vollstaendiges-big-quest.md), PR227/Swift-CI: voller Katalog/Enum, Rangfolge und Notenschutz. Test15 belegt eine echte Antwort, keine erfundenen Provider-Metadaten. |
| EV-5.5 Korrektur/Lernen | Software belegt | EV5/6: bestätigte Elternkorrekturen, ausdrückliches `none`, kein automatisches familienübergreifendes Teilen. |
| EV-6.1 Neue Zuordnungen | Software belegt | EV5/6: Katalogwachstum→ruhiger Hinweis; ohne Treffer kein Hinweis. |
| EV-6.2 Bestätigte Nachzuordnung | Software belegt | EV5/6: Vorschau 0, eine Revision derselben Evaluation, veraltete Basis/Kindwechsel abgewiesen; echte berechtigte Lehrkraft liest ohne Hinweis/Schreiben. Finale PR227-CI ist nachgewiesen. |
| EV-7.1 Lücke/Fokus/Übung | Software und begrenzte echte Wirkung belegt | PR233/Test15: Kriterienform, Altimport, Haupt-/Nebenbezug, beide D5-Themenlagen. [W1](2026-11-19-inhalte-w1.md) präzisiert Erreichen/Gehalten, ohne neue Tageshürde. |
| EV-7.2 Startschwierigkeit | Software belegt; Storytext nachgeführt | `standOf` nutzt die Schule bis 6 eigene Antworten; W1 streicht die frühere Zweitagesbedingung. Dieser PR berichtigt ausschließlich den überholten Storysatz. |
| EV-7.3 iPad-Kette | Sieben Schritte manuell bestanden | Test15-Nachtrag: echte Quelle, KI, Zuordnung, Bestätigung, Lücke, passende Aufgabe und Neustart. Mehrere genannte Webstände; kein erfundener einziger Lauf auf 0.152.6. |
| EV-7.4 Browservergleich | Gefordertes Ergebnis manuell bestanden | Test15-Nachtrag: manuell eingetragene gleiche Kriterien ergeben gleiche Standardnoten und aktive Lücke. Zusätzliche Browserrunde/Neustart sind nicht Teil dieses einzelnen Kriteriums. |

## Tatsächlich verbleibende Punkte

### R1: Fehlende Diagnosewerte aus EV-1.2

Das erfolgreiche Speichern/Zurücklesen und der Neustart derselben Fassung bleiben gültig. Es fehlen der gesonderte unmittelbare Lese-Code und die vollständige AccessGroup beim Speichern; der numerische Startcode von Test13 fehlt zusätzlich im damaligen Paketvergleich. Diese Werte werden nicht aus „verified“ oder „not found“ rückgerechnet.

Kleinster ergänzender Gerätetest: im vorhandenen Test15-Projekt „Claude-Schlüssel“ öffnen, den bereits verwendeten Schlüssel ausschließlich im iPad eingeben und speichern; nur **Speichern-Code, unmittelbar angezeigten Lesen-Code und vollständige AccessGroup** protokollieren. Dasselbe Projekt schließen/neu starten und nur Start-Lesecode/AccessGroup ergänzen. Kein Toddle-/KI-Aufruf, keine neue App, kein erneuter vollständiger EV7-Test. Historische Test13-Werte bleiben unbekannt; ein neuer Test wird getrennt datiert. Ausführung nur gemeinsam mit Peter.

### R2: Offline bestätigt und danach Eltern-Kontoschlüsselwechsel

**REST-ROT-01: FAIL im kombinierten Modulintegrationstest.** Der [Bestandsabgleich](2026-11-17-atlas-abgleich-evaluationen.md) führt HE/HR ausdrücklich weiter. Der heutige Weg ist betroffen: Formular → `eventHook('school_evaluation', payload, child)` → lokaler Kindlog → allgemeiner Geräteabgleich. Der frühere separate Server-/Entwurfsweg ist dafür keine heutige Ersatzgrundlage.

Der tatsächliche unabhängige Sentinel `/root/sentinel_eval_restabschluss` verwendete ausschließlich synthetische Konten/Daten und `lokalerSpeicher`, die vorhandenen Fixture-Helfer aus `tests/module/erneuern.test.mjs` sowie unveränderte Produktmodule von e17a46b. Kein echter GitHub-Speicher, Browser, Provideraufruf oder iPad wurde verwendet.

1. Eine gültige Kriterien-Evaluation mit fester Evaluations-/Revisionskennung lokal bestätigen. Den synthetischen Upload erst unterbrechen, nachdem der Produktweg die Evaluation signiert und ein fertiges `unterwegs`-Bündel vorbereitet hat. Diese Vorbedingungen sind ausdrücklich assertiert.
2. Ein zweites Gerät desselben Elternteils führt über die echte Produkt-API `schluesselErneuern` den Kontoschlüsselwechsel erfolgreich aus; der erste Elternteil meldet sich mit aktuellem Schlüssel erneut an. Identität, Elternrolle und unverändertes berechtigtes Kind werden geprüft. Es gibt keinen zweiten Bestätigungsklick und keine künstliche Neusignierung.
3. Normalen Abgleich wieder aufnehmen. Erwartet: dieselbe Evaluation/Revision kommt genau einmal beim anderen berechtigten Elternteil an. Beobachtet: Ausgangsgerät 1, anderer Elternteil 0, erneuerndes Gerät 0.
4. Die ausdrücklich begrenzte Nachprobe führt drei weitere vollständige normale Abgleichrunden aus. Die Zähler bleiben in jeder Runde gleich. Am Ursprung: keine vorgemerkte Evaluation mehr und kein `unterwegs`-Bündel; am Empfänger: Eintrag 0/Revision 0. Bereichsberichte melden `ok:true` und keine wartenden Einträge. Der erste Wiederaufnahme-Abgleich hatte `gesendet:1` gemeldet.

Beide Versuche endeten mit **Exit 1**; der zweite scheitert an der fachlichen Assertion `0 !== 1` nach den zusätzlichen Runden. Das ist ein konkret beobachteter Transportfehler, keine allein aus Quelltext abgeleitete Vermutung. Die genaue technische Ursache ist noch zu diagnostizieren. Die abschließende Idempotenzassertion ist wegen der fehlenden Zustellung nicht erreicht; Entzug, anderes Kind und sichtbare Formularbedienung wurden nicht zusätzlich getestet.

Umgebung: Linux, Node 24.22.1, vorhandene Test-PBKDF2-Einstellung 1000. QA-Checkout vor/nachher unverändert e17a46b, keine bearbeiteten Produkt- oder Repositorytestdateien. Reguläre unabhängige QA, kein Forge-/Claude-Lauf. Beide Prozesse beendet; [eigene terminale Rückgabe](https://github.com/pahlborn/agentarium/issues/2#issuecomment-7083528157) vor der fachlichen Auswertung veröffentlicht und rückgelesen. Atlas hat Rohlog, entscheidende Vorbedingungen und Hashes anschließend selbst gelesen.

**Rohbeleg:** [vollständiges Nachprobenlog](belege/2026-11-22-rest-rot-01.txt), SHA256 `13aa7c521cd48d7ee085d55e0bc19406442e99cc9676b06ba21b8a652e5f7331`. Die beiden unveränderten isolierten Probeskripte sind unter `/workspace/work/bq-eval-rest-20261122/evidence/` gesichert: `bq-eval-rest-sentinel-20261122.mjs` (`5c07e214d1e257fde6f9d810792453b20a2e727651cff5dc10e20d79e86e19be`) und `bq-eval-rest-sentinel-settle-20261122.mjs` (`eca8b2e07d3d551eef08fdfcd4df20eb6473668f9fe4f6ce730a7c8bf4dd4e69`). Die Skripte importieren den gepinnten QA-Checkout; sie wurden nicht als neue Repositorytests ausgegeben. Ausgeführte Befehle waren jeweils `node /tmp/<genannter Skriptname>`. Keine Reproduktion durch Atlas wiederholt.

**Kleinster nächster technischer Auftrag:** Den bestehenden Vorgang durch Wiederaufnahme und neue Schlüsselgeneration verfolgen; Fehler in Signatur-/Outbox-/Annahmekette eingrenzen und korrigieren. Einstiegspunkte sind `index.html:6753`, `src/module/konto.mjs:571`, `src/module/geraeteabgleich.mjs:251` und `src/module/abgleich.mjs:193`. Gültige Wiederaufnahme muss dieselbe Evaluations-/Revisionskennung genau einmal zustellen. Bestehende Abweisung entzogener Personen/Geräte und verspäteter unzulässiger Altbundles erhalten. Nach Korrektur den ursprünglichen kombinierten Fall und betroffene Entzugs-, Kind- und Duplikatschutzfälle prüfen. Kein pauschales Zulassen alter Signaturen oder neues Ereignis neben der bestätigten Evaluation.

### R3: Überholte Zweitagesformulierung

Die Zeile in EV-7.2 ist mit der bereits beschlossenen W1-Regel abgeglichen: 6 Antworten, keine Tagesbedingung. Produktcode und Testkriterien werden nicht neu verändert. Der Test15-Nachtrag hatte diesen Vorrang bereits ausdrücklich festgehalten.

## Abgrenzung und nächster Schritt

Keine Wiederholung der abgeschlossenen Inhalts-Verifier, keine neue Vollsuite, keine Quell-/Test-/Workflowänderung, kein Merge und keine Veröffentlichung aus diesem Abgleich. Eltern-/Lehrkräftegestaltung bleibt pausiert. Ziel 2, neue Quests und Store-Veröffentlichung werden hier nicht begonnen. Ältere offene Prototyp-PRs werden nicht automatisch geschlossen.

Atlas führt R1 mit Peters tatsächlicher Geräterückmeldung fort; die konkrete Diagnosefrage wurde bereits gestellt. R2 bleibt als Produktbefund REST-ROT-01 offen, der nächste technische Korrekturschnitt ist oben abgegrenzt; Implementierung ist noch nicht begonnen. Dieser Abgleich begründet keinen Ziel-1-Gesamtabschluss. Die Kundenannahme bleibt Peter vorbehalten.
