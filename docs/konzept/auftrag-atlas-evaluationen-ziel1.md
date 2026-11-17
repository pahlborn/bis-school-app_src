# Auftrag an Atlas: Evaluationen übernehmen, Ziel 1, Abgleich, Planung und Steuerung

Auftraggeber: Peter · Erstellt: 17.11.2026, ergänzt 17.11. (Datenschutz, Kathie, Test 11, Steuerung) · Repo: `pahlborn/bis-school-app_src` (öffentlich)

---

## 1. Worum es geht

Peter hat am 16./17.11. mit Claude ein **neues Konzept** für die Übernahme von Schul-Evaluationen aus Toddle erarbeitet. Es baut auf dem bisherigen Konzept und den Prototypen (bis iPad-Test 11) auf, setzt aber an einigen Stellen anders an. Kernpunkt: Big Quest speichert **je Kriterium einen Standard**, damit übernommene Einstufungen Lücken, Fokus und Übungen auslösen.

Deine Aufgabe:
1. **Abgleichen:** Das neue Konzept mit dem bisherigen vergleichen und die bisher geplanten Schritte gegenprüfen.
2. **Bewerten:** Bisherige Epics, Aufgaben und Zweige können weiter gültig sein. Prüfe das und handle entsprechend.
3. **Genehmigen lassen:** Vor jeder Abweichung vom Konzept holst du Peters Genehmigung ein (Abschnitt 5).
4. **Planen und führen:** Ziel 1 umsetzen und dein Agentennetzwerk sinnvoll einbeziehen und führen (Abschnitte 6 und 7), mit festen Abbruchkriterien.

## 2. Neues Konzept (verbindliche Grundlage, auf `main`)

| Dokument | Inhalt |
|---|---|
| `docs/konzept/evaluationen-uebernahme.md` | Hauptkonzept: Entscheidungen E1–E7 und O1–O5, Befunde B1–B8, Rahmenbedingungen, Zielbild, Pakete U1–U13, Ziele 1/2, Meilensteine M1–M9, Leitplanken |
| `docs/konzept/evaluationen-ziel1-zusammenfassung.md` | Management Summary Ziel 1, Textbaustein für die App (DE/EN) |
| `docs/konzept/evaluationen-ziel1-epics.md` | Entwicklungskonzept: Epics EV-1 bis EV-7 mit User Stories, Abnahmekriterien und Definition of Done |
| `docs/konzept/dev-auftraege-2026-11-03.md` | offene Aufträge 1 (Grundlage-Aufgaben) und 2 (Lückenbalken ohne 14-Tage-Regel), Voraussetzung vor EV-7 |
| `docs/konzept/elternbereich.md`, Kapitel 6 | Lückenlogik, auf der Ziel 1 aufsetzt |

**Peters Entscheidungen in Kürze:**
- **Weg zur App:** Playground → TestFlight → App Store.
- **Andere Eltern:** testen im Browser, ohne Komfortfunktionen.
- **Keine Hindernisse für die spätere App:** Es wird nichts gebaut, was ihr im Weg steht.
- **Ziel 1:** Formular + Playground + KI komplett und richtig, mit Standard je Kriterium.
- **Ziel 2, nur bei Bedarf:** Claude in Chrome, Datei-Import, KI-Dienst, TestFlight, App Store.
- **Mehrere Kriterien zu einem Standard:** Es zählt die schwächere Einstufung; die Eltern können sie ändern.
- **Zuordnung:** immer ein Vorschlag, den die Eltern korrigieren können.
- **Standards ohne Quest:** sind wählbar, mit Hinweis.
- **Bewertungsraster:** ist innerhalb einer Klasse wortgleich, in einer Klassenstufe nicht unbedingt.
- **Standardliste:** wächst je Quartal.

## 3. Bisheriges Konzept (abzugleichen)

Mindestens diese Quellen. Wenn dir aus dem Agentarium (Lauf `BQ-EVAL-01`) weitere bekannt sind, nimm sie dazu:

| Quelle | Ort |
|---|---|
| Plan „BQ-KI: Integration in den normalen Eltern-/Kinderpfad“ (13.11.) | Zweig `feature/bq-ki-elternintegration-20261113`, `docs/planung/2026-11-13-bq-ki-elternintegration.md` |
| Gemeinsames Evaluationsformular, Integrationsauftrag (11.11.) | Zweig `feature/bq-evaluation-end-to-end-test11`, `docs/pruefung/2026-11-11-gemeinsames-evaluationsformular.md` |
| Elternpilot-Testleitfaden (12.11.) und Geräteformate | dieselben Zweige, `docs/pruefung/2026-11-12-*.md` |
| Test 11, End-to-End-Abnahme (14.11.) | Zweig `feature/bq-evaluation-end-to-end-test11`, `docs/pruefung/2026-11-14-test11-end-to-end-abnahme.md`, `ios/README.md` |
| KI-Spike Schulbewertung (Zuordnung M-N3/M-N5) | Zweig `spike/bq-schulbewertung-ki` |
| Machbarkeitsstudie Schulbewertungen, Epic `2026.0005` (08.11.) | `main`, `docs/pruefung/2026-11-08-auftrag-schulbewertungen-machbarkeitsstudie.md` |
| Vorbereitung Schulimport (05.11.) | `main`, `docs/pruefung/2026-11-05-stufe4-vorb-schulimport.md` |
| Ergebnisse BQ-EVAL-01 (CI-01, INT-01) | Zweige `docs/bq-eval-01-ci-01-recovery`, `docs/bq-eval-01-int-01-original-artifacts`, `handoffs/big-quest/results/…` |
| Offene Zweige und PRs zum Thema | u. a. `feature/bq-ipad-*`, `feature/bq-evaluation-*`, `feature/evaluation-eltern`, `fix/bq-device-share-link-20261112`, Integration PR #198 |

## 4. Vorgehen

### Phase A · Bestandsaufnahme und Abgleich (kein Code)

1. **Alles erfassen:** Liste alle bisher geplanten oder begonnenen Epics, Aufgaben, Abnahmen und Zweige zum Thema auf.
2. **Jeden Eintrag einordnen:**

   | Einordnung | Bedeutung |
   |---|---|
   | **erledigt** | im neuen Konzept vorausgesetzt; Beleg: Commit, Test oder Prüfbericht |
   | **übernommen** | entspricht einer EV-Story; Kennung angeben |
   | **weiter gültig, nicht im neuen Konzept** | Begründung, Vorschlag, wo es hingehört (Ziel 1, Ziel 2 oder eigenständig) |
   | **abweichend** | widerspricht dem neuen Konzept; beide Fassungen nennen |
   | **überholt** | Begründung; nichts löschen, nur vorschlagen |

3. **Ausdrücklich klären:**
   - **Test 11:** Peter hat den manuellen iPad-Test 11 **mit positivem Ergebnis** durchgeführt; im Repo ist das nicht dokumentiert. Peter erinnert sich nicht mehr an alle Einzelheiten. Deshalb **keine Rekonstruktion**. Der Nachtrag liegt vor: `docs/pruefung/2026-11-17-test11-geraetetest-nachtrag.md` (mehrere Evaluationen abgerufen, zum Schluss fehlerfrei; Übernahme ins Formular und Einstufungen korrekt; Speichern, Neustart und Übung nicht dokumentiert). Die belastbare, dokumentierte Geräteabnahme ist EV-7.3; dort wird jeder Schritt sofort beim Test festgehalten. Gleichzeitig klären, was die in INT-01 genannte „rote Integrationsprüfung“ war und ob sie noch besteht.
   - **Integration PR #198 und die offenen Zweige:** Stand, Konflikte mit `main`, was davon die Basis für EV-1 bis EV-7 sein soll.
   - **Stand der Aufträge 1 und 2** aus `dev-auftraege-2026-11-03.md`.
   - **Nummerierung:** EV-1 bis EV-7 unter Epic `2026.0005` oder als neue Nummer. Vorschlag mit Begründung; Peter entscheidet.
4. **Ergebnis:** `docs/pruefung/<Datum>-atlas-abgleich-evaluationen.md` mit Tabelle (Eintrag · Quelle · Einordnung · Beleg/Begründung · Vorschlag).

### Phase B · Genehmigung einholen

Lege Peter den Abgleich und **alle Abweichungen** als Vorlage vor (Abschnitt 5). Beginne mit keiner abweichenden Umsetzung, bevor er zugestimmt hat. Nicht betroffene Teile darfst du parallel planen.

### Phase C · Planung

1. Die EV-Stories, die bestätigten weiter gültigen Einträge aus dem bisherigen Konzept und die Aufträge 1 und 2 zu einem Plan zusammenführen.
2. Stories in Aufgaben für dein Netzwerk zerlegen, jede mit eigenen Abnahmekriterien aus `evaluationen-ziel1-epics.md`.
3. **Reihenfolge laut Konzept:**
   1. EV-1, parallel EV-2 und EV-3
   2. EV-4
   3. EV-5, dann EV-6
   4. EV-7
4. Den Plan als Tabelle an Peter (Aufgabe · Agent · Abhängigkeit · Abnahme · Status).

### Phase D · Umsetzung und Abnahme

- Jede Story nach der Definition of Done (`evaluationen-ziel1-epics.md`, Abschnitt 2).
- Gerätetests (📱) nur gemeinsam mit Peter. Kein Erfolg wird aus grüner CI allein abgeleitet. **Ergebnisse werden noch während des Tests protokolliert** (Schritt, bestanden/nicht bestanden, Beobachtung), nicht erst Tage später.
- Abschluss von Ziel 1: Abnahme EV-7.3 auf dem iPad und EV-7.4 im Browser, mit Pass/Fail je Schritt im Prüfbericht.

## 5. Was eine Konzeptabweichung ist (Genehmigung durch Peter nötig)

**Genehmigungspflichtig:**
- jede Änderung an den Entscheidungen E1–E7 oder O1–O5
- jede Änderung an den Grundsätzen G1–G7 oder den Leitplanken (Konzept Abschnitt 8)
- ein anderes Datenmodell als „Standard je Kriterium in `school_evaluation`“ oder ein zweiter Speicherweg
- das Streichen oder Abschwächen einer User Story oder eines Abnahmekriteriums
- eine Verschiebung zwischen Ziel 1 und Ziel 2, eine andere Reihenfolge der Meilensteine
- das Weiterführen eines bisherigen Epics, das dem neuen Konzept widerspricht
- jede Veröffentlichung (nach `docs/veroeffentlichen.md`)

**Nicht genehmigungspflichtig:**
- technische Umsetzung innerhalb der Abnahmekriterien
- Zerlegung in Aufgaben und Zuordnung zu Agenten
- Namen von Zweigen und Dateien
- zusätzliche Tests

**Form der Vorlage:**
- je Abweichung: Bisher → Neu
- Begründung
- Folgen (was wird besser, was riskanter, Aufwand)
- Empfehlung
- klare Frage an Peter (ja/nein oder Auswahl)

## 6. Steuerung und Abbruchkriterien

Hintergrund: Zwischen dem 14. und 16.11. wurde tagelang am Prozess statt am Produkt gearbeitet (CI-01 Recovery, INT-01 Archivierung), ohne dass ein Abnahmekriterium neu erfüllt wurde. Das darf sich nicht wiederholen.

**Anhalten und Peter berichten, sobald eines davon eintritt:**
1. Dasselbe Problem wurde **3-mal** erfolglos angegangen.
2. **Zwei Arbeitsrunden** hintereinander ohne neu erfülltes Abnahmekriterium.
3. Eine Story dauert länger als **1 Arbeitstag** ohne Merge.
4. Die Lösung wächst über die Story hinaus: deutlich mehr Dateien, neue Infrastruktur, neue Dienste.
5. Die Arbeit betrifft nicht mehr das Produkt, sondern Belege, Archive, Kostenanalysen oder Prozessdokumente, ohne dass Peter das beauftragt hat.

**Beim Anhalten:**
- 2–3 Alternativen vorlegen, immer auch „zurückstellen“ und „einfacher lösen“, je mit Aufwand und Risiko.
- Peter entscheidet.
- Vor dem nächsten Versuch prüft ein Agent ohne Vorgeschichte das Problem (Zweitmeinung).

**Unbekanntes zuerst mit einem begrenzten Versuch klären:** feste Frage, feste Zeit (Richtwert 1 Stunde), Ergebnis ja/nein. Ein Nein ist ein Ergebnis, kein Anlass für weitere Reparaturtage (Beispiel EV-1.4).

**Statusbericht an Peter**, mindestens täglich, in drei Zeilen:
1. Welche Abnahmekriterien sind seit dem letzten Bericht neu erfüllt?
2. Was ist blockiert, und was fehlt dafür?
3. Wie oft wurde ein offenes Problem schon angegangen?

Zweimal „keine“ in Zeile 1 ist ein Haltesignal nach Regel 2.

**Actions-Verbrauch:** Das Repo ist öffentlich; die Standard-Actions sind dort kostenlos. Trotzdem bei jeder Änderung an Workflows umsetzen:
- ältere Läufe derselben PR abbrechen, sobald ein neuerer startet (`concurrency`)
- keine Tests bei reinen Dokumentänderungen
- doppelte Testaufrufe nur einmal ausführen (Vorschläge aus CI-01)

So kommt die Sperre bei einem späteren Wechsel auf privat nicht wieder.

## 7. Agentennetzwerk führen

- **Rollen:** Du planst, verteilst, prüfst und integrierst. Worker setzen um. Nur du führst zusammen.
- **Aufgaben an Worker** sind in sich geschlossen:
  - Ziel
  - betroffene Dateien
  - Abnahmekriterien
  - Testbefehle
  - was ausdrücklich **nicht** zu tun ist
- **Ein Worktree und Zweig je Worker.** Worker mergen nicht selbst.
- **Eine Quelle für Code und Dokumente: `pahlborn/bis-school-app_src`.** Worker lesen direkt dort (das Repo ist öffentlich). Aufgaben verweisen auf Zweig, Commit, Pfad und Zeile, statt Inhalte zu kopieren.
  - Keine Kopien von Quelltext oder Dokumenten in andere Repos (z. B. Agentarium) oder Ablagen.
  - Verlangt ein Werkzeug technisch eine Kopie (z. B. ein Relay, das seine Eingaben anderswo liest), ist das eine **Abweichung**: einmal Peter vorlegen, mit Grund und Alternative. Wird sie genehmigt, muss jede Kopie ihren Quell-Commit nennen, und sie darf nur vorübergehend existieren. Nach der Aufgabe wird sie entfernt; sie ist nie Grundlage für Änderungen.
  - Hintergrund: Am 17.11. hatte Atlas Swift-Quelltextkopien im Agentarium vorgesehen, weil der Forge-Relay dort liest. Die automatische Freigabeprüfung lehnte das ab, und Atlas hat den Weg verworfen.
- **`index.html` ist ein Engpass.** Plane Aufgaben so, dass nicht zwei Worker gleichzeitig dieselben Bereiche ändern. Logik möglichst in Module (`src/module/`) verlagern, wie in den Leitplanken vorgesehen.
- **Stärken nutzen:**
  - Swift/iPad-Hülle (EV-1, EV-5.4)
  - Datenmodell, Ereignisse, Ableitung (EV-2, EV-6)
  - Formular und Oberfläche (EV-4)
  - Vergleich und Zuordnung (EV-5)
  - Tests und Prüfberichte
- **Prüfen vor dem Integrieren:** Abnahmekriterien erfüllt, `npm test` vollständig grün, Gegenprobe rot, Prüfbericht vorhanden.
- **Status an Peter** in kurzen Abständen:
  - erledigt
  - in Arbeit
  - blockiert, mit dem Namen dessen, was fehlt
  - wartet auf Genehmigung
- **Ehrlichkeit:** Nicht Durchgeführtes heißt „offen“, nicht „bestanden“. Annahmen sind als Annahmen gekennzeichnet.

## 8. Rahmen

- **Veröffentlichung** nur nach `docs/veroeffentlichen.md` und mit Peters ausdrücklicher Freigabe.
- **Datenschutz:** Peter hat die Datenschutzregel aufgehoben (17.11.). Das Repo ist bewusst öffentlich; außer Kathies Vornamen liegen dort keine schützenswerten Daten. Bei neuen Inhalten bleibt das so: keine Namen Dritter (Lehrkräfte, andere Kinder).
- **Kathie** testet die Beta, sobald Ziel 1 abgenommen ist (EV-7.3 und EV-7.4). Ihr Konto ist dann kein Sonderfall mehr, sondern ein normales Beta-Konto.
- **Automatische Tests** laufen weiter mit erfundenen Daten und Testkonten (`max.mustermann`, `kind1.mustermann`), damit sie reproduzierbar sind.
- **Geheimnisse:** keine Passwörter, Zugangscodes oder API-Schlüssel in Protokollen, Prüfberichten oder Chat.
- **Texte:** DE und EN (amerikanisches Englisch), Schreibregeln S1–S8, keine Zeitwörter (R10).
- **Schlüssel:** Kein API-Schlüssel im Browser-Speicher; keine Logik nur in der Swift-Hülle.

## 9. Erste Rückmeldung an Peter (vor jeder Umsetzung)

1. Abgleichsbericht (Phase A) mit allen Einordnungen.
2. Liste der Abweichungen als Genehmigungsvorlage (Phase B).
3. Vorschlag zur Nummerierung (`2026.0005` oder neu).
4. Stand der „roten Integrationsprüfung“ und Empfehlung zu PR #198, unter Berücksichtigung des Test-11-Nachtrags.
5. Plan für den ersten Abschnitt (EV-1, EV-2, EV-3) mit Zuordnung zu Agenten.
