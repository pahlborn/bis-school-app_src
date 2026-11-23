# Evaluationen Ziel 1: Restabschluss

Stand 23.11.2026 · Auftrag von Peter: den Restabschluss der Evaluationen klären und beide Restpunkte bearbeiten. Basis des Erstabgleichs vom22.11.: `e17a46b1463b4d20a6ad5a4ecfde9ecb28467f86`. Der korrigierte Übertragungsstand `312a0c256a032e918b532cfc5f91e429a103de24` ist durch den tatsächlichen Codex-Vertreter umgesetzt und unabhängig von Argus und Sentinel geprüft; Integration und tatsächliche Veröffentlichung folgen im Nachtrag unten.

**Aktuell:** R2 ist als2c6d143 integriert und als Beta0.152.7 auf dem Testsystem veröffentlicht; Live-Version und alle fünf Dateien sind geprüft. Unabhängige Prüfung und PR-CI1271/1271 bestanden. Der zusätzliche volle Main-Lauf bleibt1269/1271; Peter hat die Veröffentlichung mit genau den beiden belegten Altfehlern ausdrücklich freigegeben. R1 benötigt weiterhin die bereits angefragten echten iPad-Diagnosewerte.

Die Übernahmekette ist umgesetzt. Die echte iPad-Übernahme und der manuelle Browser-Ergebnisvergleich sind bereits schrittweise bestanden. Ein vollständiger Abschluss aller Ziel-1-Kriterien folgt daraus noch nicht: Diagnosewerte aus EV-1.2 fehlen weiterhin. Der zunächst nachgewiesene Offline-/Kontoschlüsselwechsel-Fehler ist im korrigierten Modulintegrationsstand behoben. Frühere offene Integrationslisten sind durch die nachfolgenden Produktlieferungen weitgehend überholt; die roten Zwischenstände bleiben als Historie erhalten.

## Maßgeblicher Stand

- Verbindlich sind der [Ziel-1-Auftrag](../konzept/auftrag-atlas-evaluationen-ziel1.md), die [EV-Stories](../konzept/evaluationen-ziel1-epics.md) und die späteren [Inhaltsentscheidungen einschließlich W1](../konzept/inhalt-motivation-entscheidungen.md). Die Web-only-/Betriebsplanung vom 16.11. ist durch den Auftrag vom 17./18.11. ersetzt: Playground mit KI; Browser mit manueller Eingabe.
- Die veröffentlichte Test-Beta ist 0.152.7/2c6d143. Ihre Veröffentlichung und Byteprüfung sind kein neuer iPad-Abnahmelauf. Die manuellen EV-7-Ergebnisse gelten für die im [Test15-Nachtrag](2026-11-19-test15-evaluationswirkung-fix.md#abnahmenachtrag--21112026) getrennt genannten Quellen 0.152.4 und0.152.5.
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
| EV-2.5 Einmal beim richtigen Kind | Grundfälle belegt; zusätzlicher Transportfall im korrigierten Stand bestanden | EV2/EV4: Doppelbestätigung, Kind-/Kontowechsel, Revision/Rücknahme, zwei Evaluationen. Test15 ergänzt echte Anzeige/Abgleich; REST-ROT-01 und unsigned-Ergänzung sind auf312a0c2 unabhängig im unten begrenzten Modul-/Appadapterumfang bestanden. |
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

**Ursprünglicher Rotbeleg aufe17a46b: REST-ROT-01 FAIL im kombinierten Modulintegrationstest.** Der [Bestandsabgleich](2026-11-17-atlas-abgleich-evaluationen.md) führt HE/HR ausdrücklich weiter. Der heutige Weg ist betroffen: Formular → `eventHook('school_evaluation', payload, child)` → lokaler Kindlog → allgemeiner Geräteabgleich. Der frühere separate Server-/Entwurfsweg ist dafür keine heutige Ersatzgrundlage. Der korrigierte Nachweis folgt unten.

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

Atlas führt R1 mit Peters tatsächlicher Geräterückmeldung fort; die konkrete Diagnosefrage wurde bereits gestellt. Zum Zeitpunkt des Erstabgleichs blieb R2 offen; die folgenden Umsetzungsnachträge ersetzen diesen historischen Arbeitsstand. Dieser Abgleich begründet keinen Ziel-1-Gesamtabschluss. Die Kundenannahme bleibt Peter vorbehalten.

## Umsetzung nach Peters Freigabe am22.11.

**Teilkorrektur vorhanden, Gesamturteil FAIL.** Der reguläre Forge/Claude lieferte auf e17a46b zunächst einen nicht anwendbaren Patch mit einer ungeprüften Retiming-Strategie. Atlas übernahm ihn nicht. Argus belegte daran Ereignis-Inhaltskonflikte, verändertes Schul-`asOf` und mögliche Umkehr einer späteren Einstellung. Die zweite echte Forge-Lieferung ersetzt ausschließlich die Transportverpackung, erhält Ereignis und Signatur bytegleich und entfernt das beanstandete Retiming.

Dieser Kandidat ist als [7b44c49](https://github.com/pahlborn/bis-school-app_src/commit/7b44c49f77312e491476b71766bfc9c879dfeeeb), Tree `da43b63919d16daf77ccdefc97db63bb41c4727f`, im Zweig `fix/evaluation-offline-key-rotation-20261122` gesichert, **nicht gemergt oder veröffentlicht**. Zwei Produktionsmodule und ein neuer Regressionstest; Atlas extrahierte die vollständigen Forge-Dateien und stellte nur eine versehentlich entfallene historische Kommentar-ID wieder her.

| Prüfung | Ergebnis / Grenze |
|---|---|
| Neuer Originalfall auf unverändertem e17a46b | Erwartet FAIL, `0 !== 1`; gültiger fachlicher Rotbeleg. |
| Neuer Kandidaten-/Helperlauf durch Atlas |7/7, Exit0. Eigene Forge-Tests bleiben wegen fehlender Shell NOT_RUN. |
| Bestehende betroffene Suiten `erneuern`, `abgleich`, `geraeteabgleich` durch Atlas |30/30, Exit0. |
| Tatsächlicher Testbau durch Atlas | Exit0; keine Veröffentlichung. |
| Unabhängiger Sentinel: prepared/in-flight und signed-only | Bestanden; dieselbe Evaluation/Revision auf den berechtigten Geräten genau einmal. |
| Unabhängiger Sentinel: gesamter Inhalt/`at`, Schul-`asOf`, Konflikte, JSON-Replay, LWW und fünf bestehende Schutzfälle | Bestanden, ausschließlich synthetische Modulintegration. Keine allgemeine Browser-/Mixed-Version-/Snapshotfreigabe. |
| Unabhängiger Sentinel: vor dem ersten Signieren offline bestätigter Vorgang | **FAIL**, Exit1: nach echtem Schlüsselwechsel, neuer Anmeldung und drei weiteren Runden Ursprung1, anderer Elternteil0, erneuerndes Gerät0. |
| Argus auf genau7b44c49 | **FAIL für R2 insgesamt**; reine Periodenprobe und anschließend selbst gelesener unsigned-Vollflow bestätigen die offene Lücke. |

**REST-ROT-UNSIGNED-01 / ARG-ROT-02:** Ein zunächst unsigniertes altes Ereignis wird nach Neuanmeldung mit dem aktuellen Schlüssel signiert; die historische Prüfung wählt den alten Schlüssel nach `event.at`. Ein vorbereiteter alter Transport existiert dabei nicht und kann deshalb nicht neu verpackt werden. Die vollständige Flow-Ursache wurde nicht bis zu jedem internen Schritt isoliert; das fehlgeschlagene Nutzerergebnis ist konkret reproduziert. Dieser ursprünglich mitgeplante Zustand darf nicht als erledigt ausgeblendet werden.

Eigene QA-Ende/Rückgabe wurden vor Berichtsanalyse validiert, veröffentlicht und rückgelesen: [Sentinel7084331521](https://github.com/pahlborn/agentarium/issues/2#issuecomment-7084331521), [Argus7084333794](https://github.com/pahlborn/agentarium/issues/2#issuecomment-7084333794). Der vorbereitete Originalfall ist damit tatsächlich verbessert, der Gesamtauftrag noch nicht abgeschlossen. Keine neue Vollsuite oder CI für diesen wissentlich unvollständigen Kandidaten begonnen.

Gesicherte unsigned-Probe: `/workspace/work/bq-rot-implementation-20261122/qa/sentinel-rest-rot-unsigned-flow-20261122.mjs`, SHA256 `e2ad0e285850f5d8ae2ddb3535520d033c7fb09214e1a7b1ce5b58a8e2be40ee`; Rohlog `6abfcf9c408b3b49e9f82b33dc2f59b6f696af8edaff66b633d4366ea33e1323`. Eigene Original-/Integritäts-/LWW-/signed-only-Belege und tatsächliche Autor-Testlogs sind im selben privaten Arbeitsbereich gesichert; keine echten Konten oder Schlüssel wurden verwendet.

### Noch offener technischer Weg

Forge wurde mit dem konkreten unsigned-Gegenbeleg erneut eng beauftragt. [Lauf45060660521](https://github.com/pahlborn/agentarium/actions/runs/45060660521) startete tatsächlich und endete mit `safety_blocked`; der Relay hielt den Rücklauf zurück. Es gibt daraus **keinen nutzbaren Patch und keinen belastbaren Fachvorschlag**. Die freigegebenen Metadaten nennen `RuntimeError`; der genaue Grund bleibt unbekannt. Host-Start/Ende, Sitzung und Verbrauch sind getrennt erhalten; keine Schutzumgehung oder blinde Wiederholung.

Die ursprüngliche Fehlerbehebung bleibt beauftragt. Peter hat den [konkreten begrenzten Codex-Übergabeauftrag](../planung/2026-11-22-evaluation-unsigned-korrektur.md) ausdrücklich freigegeben ([Beleg](https://github.com/pahlborn/agentarium/issues/2#issuecomment-7084815028)). Der tatsächliche Codex-Entwicklervertreter `/root/codex_eval_unsigned` hat den Auftrag im isolierten Arbeitszweig ab7b44 übernommen; seine [eigene Startmeldung](https://github.com/pahlborn/agentarium/issues/2#issuecomment-7084841919) ist publiziert und rückgelesen. Dies ist noch kein neuer fachlicher PASS. R1 benötigt weiterhin ausschließlich die bereits angefragten echten iPad-Diagnosewerte. Die veröffentlichte Beta bleibt0.152.6.

Beobachtete tatsächliche Claude-Kosten der drei technischen Läufe:0,4916324+0,8715903+0,2781113=1,6413340USD. Die dritte Zahl stammt aus dem getrennten Host-Enddatensatz, obwohl die blockierte Produktmetadatei Kosten und Sitzung auf `null` setzt. Native Kosten und globale historische Abschlusszähler bleiben unbekannt. Die zweite fachliche Nacharbeit ist als begrenzter Cadence-Befund vorgemerkt; kein Prozess-PASS oder zusätzlicher Lauf behauptet.

## Korrigierter unsigned-Stand: unabhängige Prüfung bestanden

Peter gab den konkreten Codex-Vertretungseinsatz ausdrücklich frei ([7084815028](https://github.com/pahlborn/agentarium/issues/2#issuecomment-7084815028)). Tatsächlicher separater Entwickler: `/root/codex_eval_unsigned`, kein als Forge ausgegebener Agent. Endkandidat `312a0c256a032e918b532cfc5f91e429a103de24`, Tree `f86970228294f033c89ca4705b904a3032af9f1a`; eigene terminale Rückgabe [7085054563](https://github.com/pahlborn/agentarium/issues/2#issuecomment-7085054563). Genau vier bestehende Produktionsmodule: `konto`, `geraeteabgleich`, `annahme`, `abgleich`. Atlas ergänzt getrennt ausschließlich Release-Metadaten und die dazugehörigen Versionstest-Erwartungen.

Der zunächst gelieferte Stand3f6 bestand die direkten Modulprüfungen, scheiterte aber an den echten `kontoMerken`-/`kontoKonto`-Kopien der App. Argus und Sentinel reproduzierten unabhängig diesen Fehler; er wurde vor jeder Integration korrigiert. Die Anmeldung bindet die spätere Erstsignatur nun an tatsächliche private CryptoKey-Identitäten sowie dieselbe Elternidentität, Rolle, öffentliche Schlüssel und ursprüngliches Gerät. Zulässige Objektkopien im Arbeitsspeicher bleiben nutzbar; serialisierte oder tatsächlich geklonte Schlüssel erhalten keinen Anmeldenachweis.

Das gesamte Domainereignis einschließlich ID, Datum, Autor, Kind und Revision bleibt unverändert. Nur bei der ersten Signatur einer noch unsignierten Schulevaluation nach Schlüsselwechsel wird eine getrennt signierte Bestätigungshülle mit Signaturzeit ergänzt. Historische und damalige Eltern-/Geräteberechtigung, durchgehende Mitgliedschaft, echter Schlüsselwechsel und der korrekte Kindbereich bleiben Pflicht. Bestehende Signaturen werden nicht ersetzt. Der Transport bleibt in derselben Speicherkette; der Schul-Lesestand2 holt zuvor übersprungene Hüllen aus unveränderten Bündeln nach.

| Unabhängiger Nachweis auf312a0c2 | Ergebnis / Grenze |
|---|---|
| Sentinel: unsigned, signed-only und prepared über die unveränderten echten Appadapterfunktionen | Alle3 Zustände bestanden; Ursprung, zweiter Elternteil, erneuerndes Gerät und Kind enthalten die ursprüngliche Evaluation/Revision je genau einmal. |
| Ereignisbytes, `at`, Schul-`asOf`, LWW, vollständige Hülle, JSON-Restore und frische Anmeldung | Bestanden; keine ID-Konflikte, neuere manuelle Einstellung bleibt wirksam. |
| Tatsächlicher Reader7b44 verwirft neue Hülle, schiebt Cursor vor; danach Restore und Reader312 | Bestanden; unveränderte Serverbündel werden nachgelesen, genau ein vollständiger Eintrag bleibt auch nach erneutem Wiederlesen erhalten. |
| Unabhängig konstruierte Signatur-/Rechtefälle |21/21 bestanden, einschließlich Manipulation, falschem Kind, unterbrochener Mitgliedschaft/Geräteperiode sowie Lesbarkeit nach weiterer Rotation oder späterem Entzug. |
| Laufzeitberechtigung und Aufbewahrung ungültiger historischer Absicht |16/16 bestanden; nicht zulässige Absicht bleibt lokal, wird nicht signiert oder übertragen. |
| Verschlüsselte Transportfälle zu Entzug und alten Schlüsseln |4/4 bestanden; verspätete unzulässige Bündel abgewiesen, zulässige erneuerte Übertragung angenommen. |
| Argus: ursprüngliche rote echte Appadapterprobe erneut ausgeführt | Jetzt Exit0; alle vier Geräte je1. Außerdem46/46 gezielte Tests und ein eigenständiger tatsächlicher Legacy-Reader-/Upgrade-Gegenbeleg bestanden. Urteil PASS_WITH_NOTES für exakt312. |

Sentinel zählt44 benannte Szenarien/Fälle in vier eigenen Befehlen, keine erfundene44-Tests-Repositorysuite. [Eigene QA-Rückgabe7085100825](https://github.com/pahlborn/agentarium/issues/2#issuecomment-7085100825) und [Argus-Rückgabe7085086556](https://github.com/pahlborn/agentarium/issues/2#issuecomment-7085086556) wurden vor Ergebnisanalyse validiert, publiziert und exakt rückgelesen. Der vollständige QA-Bericht ist unter `/workspace/work/bq-rot-implementation-20261122/qa-unsigned/QA_REPORT-r2.md` gesichert, SHA256 `176df7084f6bbc95649ebb760939bd9a1deb8ad3ed023580714e108641a802be`. Principal-Integration-Rohlog SHA256 `4723ef04e9f26de841be5935d221f669d94e9abd2aa7649c2b9d7591908fa2c9`; eigenständige Argus-Appadapterprobe `f0a5260049646f42932f1de85fca8847d470263ae2594385c46e6afd0e2db748`.

Grenzen: ausschließlich synthetische Modulintegration mit den tatsächlichen extrahierten Appfunktionen, kein sichtbarer Browser-/Live-Transport-/echter IndexedDB-/iPad-Nachweis. Unsignierte historische Bytes beweisen ihr ursprüngliches physisches Erstellungsdatum nicht kryptographisch; derselbe aktuell angemeldete berechtigte Elternteil bestätigt genau diese Bytes später. Ältere Clients können die neue Hülle bis zum Upgrade vorübergehend auslassen; das tatsächliche Wiederlesen nach Upgrade ist belegt. R1 bleibt davon getrennt offen.

Produktintegration und Beta0.152.7 sind in [PR240](https://github.com/pahlborn/bis-school-app_src/pull/240) vorbereitet. Lauf45065333231 fand zwei von Atlas beim Versionswechsel nicht mitgeführte Versionstest-Erwartungen; sie sind korrigiert, kein Transportmodul wurde dafür verändert. Erforderliche neue vollständige CI auf `02648418060ad26a1a47171e728dddb5f9a01a27`: [45065636855](https://github.com/pahlborn/bis-school-app_src/actions/runs/45065636855). Zum Zeitpunkt dieses Nachtrags noch kein Merge-/Veröffentlichungsnachweis.

## Integration bestanden; Veröffentlichung wartet auf Entscheidung zu Altfehlern

**R2 ist integriert:** PR240 wurde nach unabhängiger Prüfung und vollständiger CI1271/1271 samt acht grünen Checks als `2c6d143bd5f0e24edfbea507ba741af983a166d4` übernommen. Sein Tree `6dafe4066f09ca88b4c483c5c7c18e0f8c61b264` ist identisch zur geprüften PR-Spitze0264841. Der danach nach Process1.4§7 tatsächlich ausgeführte volle Main-Lauf (`CHROMIUM_PATH=/usr/bin/chromium npm test`, Node24.22.1) endete jedoch mit **1269/1271, zwei Fehlern, Exit1**, ohne Skip/Cancel/Todo; Laufzeit792240.575572ms. Die Veröffentlichung wurde deshalb nicht durchgeführt. Rohlog SHA256 `75bc2b8738c4f3a983be9dbbd8cdf4c5d76467bd25df262506aa8aac3276d570`.

| Altfehler | Fester Gegenbeleg und Wirkung |
|---|---|
| BQ-LEGACY-PDF-01 | Die tatsächliche PDF-Funktion bildet `600 − 300 = ?` als `(1. 600 ? 300 = ?)` ab: Das Minuszeichen wird im PDF zum Fragezeichen. |
| BQ-LEGACY-EXAMPLE-01 | Die tatsächlich erzeugte Subtraktionsaufgabe mit Antwort4200 erhält kein Beispiel, weil das einzige passende feste Beispiel ebenfalls4200 ergibt und der bestehende Schutz diese Lösung nicht zeigen darf. Ein alternatives Beispiel fehlt. |

Atlas hat beide Fälle mit festen Eingaben und tatsächlichen Browser-/Appfunktionen auf dem früheren Quellstande17a46b **und** dem neuen Main2c6d143 reproduziert. Die von den beiden betroffenen Tests verwendete Live-Bauart ist dort byteidentisch, SHA256 `865a9fa09f48f361c38ff09c5bb58f3393d52647f5949746e3ed10073310a0f2`. Dies ist kein neuer iPad- oder Live-Website-Test und kein neuer Fehler des Übertragungsdeltas. [Maschinenlesbarer Gegenbeleg](belege/2026-11-22-beta-altfehler.json), SHA256 `010427122b9aafba6304eb365c38a7899e415dc691687cb2c564646abef7fe80`; privates ausführbares Skript `/workspace/work/bq-rot-implementation-20261122/existing-failure-probe.mjs`, SHA256 `3a8cffdf719506882e516760e37ca66dec161cff36dc644de4a915fcfc3fd00c`. Ein zuerst falsch numerisch erwarteter Stringwert im eigenen Diagnoseskript wurde als Aufbaufehler erhalten und vor dem gültigen Vergleich korrigiert; er gilt nicht als Produktbefund.

Zum Stand dieses Nachtrags am22.11. war Beta0.152.7 aus sauberem Main2c6d143 gebaut (Legacy211, Build22.11.2026 21:28), einschließlich bestandenem unverändertem Publisher-Preflight für https://big-quest-test.github.io/; veröffentlicht war noch0.152.6/e17a46b. Atlas empfahl, den geprüften Übertragungsfix mit ausdrücklich auf diese beiden bereits bestehenden Fehler begrenzter Ausnahme zu veröffentlichen und die [beiden Altfehler getrennt einzuordnen](../planung/2026-11-22-beta-altfehler.md). Die Ausnahme stand damals aus; ihre spätere ausdrückliche Freigabe und die Veröffentlichung am23.11. sind im folgenden Abschnitt belegt. Diese Freigabe ist kein Auftrag für einen weiteren Codex-/Forge-Vertretungseinsatz. R1-Gerätewerte bleiben separat angefragt.

## Veröffentlichung am23.11.2026

Peter hat mit „ja“ die konkrete Beta0.152.7 mit genau den beiden dokumentierten Altfehlern freigegeben ([Originaljournal7091830558](https://github.com/pahlborn/agentarium/issues/2#issuecomment-7091830558)). Die Ausnahme ändert weder den roten Main-Gesamtnachweis noch den Scope eines Entwicklers. Kein weiterer Modell-, Volltest- oder Codeänderungslauf wurde für die Veröffentlichung begonnen.

Atlas hat das bereits geprüfte unveränderte Paket über den vorhandenen Publisher auf https://big-quest-test.github.io/ veröffentlicht. Tatsächlicher Public-Commit [b8dd6cfad81421104abad1865e921cfbe9217d0c](https://github.com/big-quest-test/big-quest-test.github.io/commit/b8dd6cfad81421104abad1865e921cfbe9217d0c), Commitzeit23.11.2026 05:44:42 Europe/Berlin. Anwendung: **0.152.7-beta / 2c6d143 / Legacy211**, Builddatum22.11.2026 21:28. Das Builddatum bleibt das des freigegebenen Pakets; es wurde nicht mit dem späteren Veröffentlichungsdatum überschrieben.

Beide tatsächlichen Public-Workflows sind auf genau diesem Commit erfolgreich: [Versionsprüfung45113661582](https://github.com/big-quest-test/big-quest-test.github.io/actions/runs/45113661582) und [Pages-Deployment45113661125](https://github.com/big-quest-test/big-quest-test.github.io/actions/runs/45113661125). Atlas hat alle vier Joblogs gelesen; der Deploymentdatensatz bindet b8dd6cf als `pages_build_version`.

[Live-Dateinachweis](belege/2026-11-23-beta-0.152.7-live.json): Startseite, Manifest und alle drei Icons liefern HTTP200 und stimmen in Länge sowie SHA256 bytegenau mit dem freigegebenen `dist-test` überein. Die tatsächlich gelesene APP_VERSION ist0.152.7/2c6d143/n211, `draft:false`. Der unveränderte bestehende Livevergleich meldet ebenfalls `gleich`, Exit0, mit Umgebungsproxy und regulärer Systemzertifikatsprüfung.

Damit ist der R2-Fix auf dem bestätigten Testsystem verfügbar. Die Altfehler bleiben separat vorgeschlagen; R1 bleibt ausschließlich der bereits angefragte echte iPad-Diagnosenachweis. Diese Veröffentlichung ist kein neuer Geräte-/Provider-/Live-Mehrgeräte-Funktionstest und keine Ziel-1-Gesamtabnahme.
