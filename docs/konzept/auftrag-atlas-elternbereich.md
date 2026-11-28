# Auftrag an Atlas: Umbau Elternbereich

**Status: Abschnitte A–H (23.11.) und J (24.11.) von Peter zur Umsetzung freigegeben.** Abschnitt I ist noch in Durchsicht und wird später ergänzt – nicht umsetzen.

Grundlagen: `docs/konzept/textleitlinie.md` (vor allem Regel 4: Originalbegriffe) und `docs/konzept/elternbereich-entscheidungen-2026-11-18.md` (Abschnitt „Begriffe und Evaluations-Seite“, 23.11.). Vorlage für die Gestaltung ist Peters Klickdummy (5 Seiten: Übersicht, Fachansicht, Hilfe, Verwalten, Evaluations); Peter stellt ihn bei der Freigabe bereit.

## A · Fokus

**A1 · Areas of Development aus übernommenen Evaluations speisen den automatischen Fokus**
- Heute: `classTopics` (Zeile ~2386) filtert von Eltern übernommene Evaluations aus (`!t.manual`), und das Formular „Evaluation übernehmen“ schreibt kein `focusNext`. Ohne vorbereitete Daten greift deshalb die feste Liste `FOCUS` (8 Quests).
- Neu: In der Vorschau ordnet Big Quest jedem Punkt unter „Areas of Development“ eine Quest zu (Vorschlag; Eltern bestätigen oder ändern; „keine passende Quest“ ist erlaubt). Die bestätigte Zuordnung wirkt wie `focusNext` (Evaluations der letzten 8 Wochen, sonst alle).
- Korrigieren und Zurückziehen einer Evaluation ändern den Fokus entsprechend.
- Abnahme: Tests für übernehmen → Quest im automatischen Fokus, zurückziehen → Quest wieder draußen, ohne Areas of Development → bisheriges Verhalten.

**A2 · Fokus-Steuerung unter „Verwalten“ (Teil des Kindes, siehe D)**
- Befund: `focusMode` gibt es einmal je Kind, für alle Fächer. Ein Quest-Schalter in der Fachansicht stellt heute unbemerkt das ganze Kind auf Manuell (`toggleFocus`).
- Neu: eigener Abschnitt „🎯 Fokus für Practise Today“ unter „Verwalten“, im Teil des Kindes: Schalter Automatisch | Manuell, Hinweis „gilt für alle Fächer“, darunter je Fach eine zuklappbare Liste der Quests mit Haken, Hinweis „Ein Haken stellt den Fokus auf Manuell“.
- Fachansicht: kein Schalter und keine Haken mehr. Quests im Fokus tragen ein nicht klickbares Etikett „🎯 Im Fokus“. Am Seitenende eine Zeile „🎯 Fokus · Automatisch · gilt für alle Fächer · Anpassen unter Verwalten ›“.
- Zurück auf Automatisch ist jederzeit möglich.

**A3 · Texte zur Wirkung** (Textleitlinie beachten)
- Automatisch: „Big Quest wählt aus den Areas of Development, den Learning goals und dem Übungsstand und passt den Fokus nach neuen Evaluations selbst an.“ (gilt erst mit A1)
- Manuell: „Sie wählen die Quests selbst. Big Quest passt dann nichts mehr an. Mit ‚Automatisch‘ übernimmt Big Quest wieder.“ Prüfen, dass der Text auch die entfallenden Learning-goal-Aufgaben in Practise Today abdeckt (`gapLaneQuests` liefert bei Manuell nichts).
- Hilfetexte, die auf einen Bereich „🎯 Fokus“ verweisen, den es nicht gibt (DE und EN), an den neuen Ort anpassen.

## B · Evaluations-Seite

Ersetzt den Abschnitt „Schulische Einstufungen“. Erreichbar über „Verwalten“ (siehe D) und über die Links „Evaluation 05.11. ›“ in der Fachansicht. Aufbau wie im Entscheidungsdokument (23.11.), zusätzlich:
- Kurze Titel: Präfixe wie „G3“, „Grade 3“, „2026-27“ entfernen; Originaltitel in den Details.
- PYP-Themen ausschreiben, z. B. „How the world works (HTWW)“, „Where we are in place and time (WWA)“.
- Fach aus den Standards ableiten und in der Vorschau bestätigen lassen.
- Namen von Standardgruppen ohne vorangestelltes Schulkürzel anzeigen (nur das Fach).
- Zähler je Stufe statt einer Gesamtstufe; Zeile „Wirkt in Big Quest“ je Evaluation, einschließlich „wird in Big Quest nicht geübt“.
- Filter bleiben (Fach, Zeitraum, „Nur mit C oder RS“).
- Der Katalog „Welche Quest übt welchen Standard?“ wandert in die Hilfe.

## C · Begriffe in Big Quest

Alle sichtbaren Texte (DE und EN) nach Textleitlinie Regel 4 umstellen, u. a.: „Lücke“, „Lücken laut Schule“, „Wird sicherer“, „Braucht Unterstützung“, „Next steps“, „Schulische Einstufungen“. Der Hilfetext „Neue Bewertungen der Schule werden bei Gelegenheit übernommen“ ist sachlich falsch (Eltern übernehmen selbst) und wird ersetzt. Big Quest spricht von sich als „Big Quest“, nicht als „die App“ (z. B. „Übungsstand in Big Quest“, „Big Quest übt …“, „Über Big Quest“). Interne Namen im Code dürfen bleiben.

## D · „Verwalten“ statt „Einstellungen“

- Knopf in der Kopfzeile und Seitentitel heißen „Verwalten“. Die Seite hat zwei Teile:
  1. **[Kind]** („gilt nur für dieses Kind“): Evaluations (Knopf „Evaluation übernehmen“, die zwei neuesten Einträge mit Zählern je Stufe, „Alle Evaluations ›“ zur Evaluations-Seite), 🎯 Fokus für Practise Today (A2), Lernen & Spaß, Profil und Klasse, Freigaben.
  2. **Familie & Big Quest** („gilt für alle Kinder und Geräte“): Familie & Geräte, Sicherung, Über Big Quest.
- Die Evaluations-Seite ist eine Unterseite von „Verwalten“ (Zurück-Knopf „‹ Verwalten“).
- Die Übersicht zeigt keine Zeile und keinen Abschnitt zu Evaluations mehr; dort steht nur der Lernerfolg.
- Hilfetexte mit Wegangaben („Einstellungen › …“) auf „Verwalten › …“ umstellen.

## E · Übersicht: „Was deinem Kind gefällt“ entfällt

- Der Abschnitt (`parentHTML` in `src/module/inhaltsfeedback.mjs`, eingebunden in `parentHomeHTML`) wird aus dem Elternbereich entfernt. Grund: Die Daumen sollen dem Team zeigen, was Kindern gefällt; für Eltern ist eine Liste der letzten 6 Daumen ohne Nutzen.
- Speichern bleibt unverändert: ein Daumen je Inhalt (`contentFeedback`), Ereignis `content_vote`, 👎 bei Witzen blendet den Witz für dieses Kind aus.
- Tests, die den Abschnitt im Elternbereich prüfen, werden angepasst, ohne die Prüfungen für das Speichern zu schwächen.

## F · Übungsblätter unter „Verwalten“

- Der Abschnitt „Übungsblätter“ (`sheetsPageHTML`) wandert von der Übersicht unter „Verwalten“, Teil des Kindes, direkt nach den Evaluations. Inhalt und Funktion bleiben: Liste, offene zuerst, Stand je Blatt, Ergebnisse je Aufgabe, „Blatt verwerfen“ solange nichts eingetragen ist.
- Auf der Übersicht bleibt ein Hinweis, gestaltet wie der Sicherungs-Tipp (Leiste mit Knopf), nur wenn mindestens ein Blatt wartet: „Tipp: N Übungsblätter warten aufs Eintragen“ (Text von Peter gekürzt) Knopf „Ansehen“ führt zu „Verwalten › Übungsblätter“. Er ersetzt die heutige Zeile „📄 … ist noch offen“.
- Höchstens zwei Tipp-Leisten gleichzeitig (Übungsblätter, Sicherung); weitere Hinweise warten, bis eine Leiste verschwindet.
- Leerer Zustand positiv formulieren, z. B. „Neue Blätter erstellt [Kind] auf der Startseite („📄 Practice sheet“) oder Sie in der Fachansicht bei einer Quest.“
- Der Knopf „📄 Übungsblatt“ je Quest in der Fachansicht bleibt.

## G · Sicherungs-Hinweis

- Text nach Textleitlinie: „Tipp: Sichern Sie [Kind]s Lernstand – so bleiben alle Erfolge erhalten.“ Knopf „Jetzt sichern“. Ersetzt „💾 Noch nie gesichert“ und „💾 Neue Übungen seit der letzten Sicherung“; die Regel, wann der Hinweis erscheint (`backupLine`: bis zur ersten Sicherung bei jedem Besuch, danach frühestens nach 30 Tagen und nur bei neuen Übungen), bleibt.
- Familienfassung prüfen: `canBackup` verlangt Konten (`accountsOn()`). Erscheint der Hinweis in der Familienfassung nicht, dort einbauen – ohne Konto ist die Sicherung der einzige Schutz gegen Datenverlust. Ergebnis der Prüfung im Statusbericht nennen; Tests für beide Fassungen.

## H · Übersicht: Fächerzeilen in „Wo steht [Kind]?“

- Je Fach eine Zeile: Name · Anzahl Quests, je Quest ein Balken in der Farbe des Quest-Stands, Pfeil zur Fachansicht. Der wiederholende Text („1 Extending (E) · 1 Meeting expectations (M) · …“) entfällt.
- Kein Kasten mit Learning goals oder Areas of Development in der Übersicht; diese stehen in der Fachansicht.
- Balken, deren Farbe noch aus der Evaluation kommt (`assessQuest(...).schoolBase`: weniger als `KEY.minAnswers` eigene Antworten und ein Schulstand vorhanden), werden **umrandet** gezeigt (weiße Fläche, Rand in der Stufenfarbe); alle anderen gefüllt.
- Legende am Ende der Tabelle: Überschrift „Übungsstand in Big Quest“, die fünf Farben (Extending (E), Meeting expectations (M), Consolidating (C), Requires support (RS), noch nicht geübt), dazu „umrandet = Ausgangspunkt aus der schulischen Evaluation, bis [Kind] in dieser Quest mindestens sechs Fragen beantwortet hat“ und „Learning goals und Areas of Development aus den Evaluations stehen in der Fachansicht.“
- Fachansicht: Zusatz „Stand laut Schule“ (DE) bzw. „Starting point from school“ (EN) wird zu „Ausgangspunkt: Evaluation [Datum]“ bzw. „Starting point: evaluation [date]“.

## J · Symbole bei der Quest-Auswahl (Kind)

Grundlage: `docs/konzept/elternbereich-entscheidungen-2026-11-18.md`, Thema 4 („Das Kind umgeht Practise Today“). Auf main am 24.11. nicht umgesetzt.

- Ziel: Das Kind sieht bei der Quest-Auswahl, wo Üben gerade besonders lohnt – auch wenn es nicht über Practise Today geht. Practise Today wird **nicht** größer oder prominenter; Aufgaben in normalen Quest-Runden ändern sich **nicht**.
- Drei Kennzeichen auf den Quest-Karten des Kindes:
  - **Learning goal:** Quests des aktiven Learning goals (`activeGapQuests`). Bei manuellem Fokus kein Learning-goal-Kennzeichen, weil Big Quest es dann nicht extra übt.
  - **Fokus:** Quests in `focusTopics()` (automatisch oder manuell).
  - **Neuland:** Quests, die Practise Today als Neuland anbietet (noch nicht geübt, freigeschaltet), dieselbe Regel wie der Neuland-Platz.
- Höchstens ein Kennzeichen je Karte, Vorrang Learning goal vor Fokus vor Neuland (ein Learning goal ist im automatischen Modus ohnehin im Fokus).
- Genehmigte Symbole: 🎯 Fokus, 🧩 Learning goal, 🌱 Neuland. 🌱 ist für Neuland freigegeben; 🧭 bleibt unverändert das Symbol des Titels „Explorer“ in der Kopfzeile (`#rankIcon`).
- Kindertexte englisch und kurz (wie die übrige Kinderoberfläche), z. B. „Focus“, „Learning goal“, „New“; jeweils mit `aria-label`. Elterntexte und Handbuch folgen später.
- Gilt für Familienfassung und Testfassung. Keine Änderung an Sternen, Titeln, Fokuslogik oder Learning-goal-Logik.
- Abnahme: Tests für die Zuordnung (aktives Learning goal, Fokus automatisch und manuell, Neuland, Vorrang, kein Learning-goal-Kennzeichen bei manuellem Fokus), DE/EN, beide Fassungen; Screenshot der Quest-Auswahl im Statusbericht. Eigener PR mit Versionsanhebung, volle Testsuite.

## Backlog (nicht Teil dieses Auftrags)

- **Learning goals bei manuellem Fokus anzeigen:** Bei „manuell“ übt Big Quest Learning goals nicht extra (`gapLaneQuests`), die Anzeige (`gapsSubjectHTML`) zeigt das aktive Learning goal aber weiter als aktiv. Neu: Zustand „pausiert“ und eine kurze Zeile „Fokus ist manuell – Learning goals pausieren.“
- **Learning goal wieder öffnen nach Schließen durch Eltern:** Heute gibt es „Weiter üben“ nur nach einem Abschluss durch Big Quest; nach „Als geschlossen markieren“ öffnet nur eine neuere Evaluation. Neu: „Wieder extra üben“ in beiden Fällen. Knopftexte: „Dieses zuerst üben“, „Nicht mehr extra üben“, „Wieder extra üben“; Zustände „wird extra geübt“, „kommt danach dran“, „abgeschlossen“.
- **Prüfpunkt „Hier übt Mia noch“:** Heute zeigt „Daran hing es“ (`stuckHTML`) die zwei neuesten vorgemerkten Wiederholungen, ohne Muster. Vorschlag: die Aufgabenart (`coach.family`) mit der niedrigsten Quote (mindestens 3 Aufgaben, unter 50 % beim ersten Versuch richtig) plus ein Beispiel mit richtiger und erster Antwort. Zuerst zählen, wie viele Aufgaben je Quest eine Aufgabenart tragen; Bericht an Peter.
- **Neue Kennzahlen in der Fachansicht:** Grundlage der Stufe („letzte N Aufgaben, X beim ersten Versuch richtig“), Balken mit Markierungen C 50 % / M 80 %, Zählung seit der Evaluation. Jede Zahl aus einer vorhandenen Funktion oder einer kleinen Hilfsfunktion mit Test; im Plan auflisten.
- **Learning-goal-Schrittleiste:** Evaluation · Übt · M erreichen/erreicht · Gehalten, farbig nach Zustand (erreicht / aktuell / offen) statt Punkten; bei „gehalten“ nur der Text „5 von 6 beim ersten Versuch richtig“.
- **Fokus und Learning goals zusammen darstellen:** In der Aufgabensteuerung erscheint jede Quest einmal, mit ihren Gründen (Learning goal, Areas of Development, Übungsstand RS/C); wartende und abgeschlossene Learning goals getrennt darunter (Klickdummy Seite 4 „Verwalten“, Entscheidung Peter offen).

- **Prüfpunkt: Einstufung aus reinen Grundlage-Aufgaben.** `standOf` stuft ab 6 eigenen Antworten selbst ein und zählt dafür Antworten jedes Niveaus. Gibt es keine Antwort auf normalem Niveau (2), entscheiden allein die Grundlage-Aufgaben (C ab 80 %, sonst RS), und der Ausgangspunkt aus der Evaluation entfällt. Grundlage-Antworten entstehen auch durch einen Tipp vor der ersten Antwort, durch den Einstieg eines Learning goals und durch die Zusatzaufgaben bei RS. Prüfen und berichten: Wie oft tritt der Fall auf (Testdaten und Simulation; echte Lernstände nur mit Peters Einverständnis und ohne Namen)? Welche Folgen hat er für Sterne, Titel, Fokus und Learning goals, die dieselbe Stufe lesen? Vorschlag zur Entscheidung: eigene Einstufung erst ab 6 Antworten auf normalem Niveau, bis dahin Ausgangspunkt aus der Evaluation (umrandet) oder „noch nicht einschätzbar“. Im Bericht ausdrücklich beantworten: Die Stufe steuert auch die Schwierigkeit (`adaptRound`). Bliebe ein Kind länger auf einem M aus der Evaluation, bekäme es schwerere Runden, obwohl es gerade Grundlage-Aufgaben braucht. Lösungsweg und Risiko benennen (z. B. Anzeige nach neuer Regel, Schwierigkeit weiter aus den eigenen Antworten). Die Grenze steht heute an drei Stellen (`standOf`, `schoolBase` in `assessQuest`, `sterne.mjs`); eine Änderung nur zentral in `wissen.mjs` und an allen Stellen zugleich. Umsetzung durch Forge oder einen Claude-Agenten, erst nach Peters Ja, eigener PR mit Tests.

- **Aufgaben-Niveaus klären und Lücken schließen:** Die Stufe einer Quest hängt davon ab, welche Aufgaben als Grundlage (Niveau 1), Klasse 3 (Niveau 2) und Challenge (Niveau 3) eingeordnet sind. Das Niveau setzen die Aufgaben selbst; ohne Angabe gilt eine Aufgabe als Niveau 2 (`levelOf`). Zuerst zählen und berichten (wie am 03.11. in `docs/konzept/dev-auftraege-2026-11-03.md`, z. B. 25 erzeugte Runden je Quest): je Quest mit Hauptstandard die Anzahl Aufgaben je Niveau, ohne Niveau-Angabe, und ob Grundlage- und Challenge-Aufgaben fehlen. Stand von Auftrag 1 (Grundlage-Aufgaben) vom 03.11. prüfen. Ergebnis als Bericht an Peter; Ergänzungen erst nach Peters Ja, eigene PRs, Inhalte an den Standards für Klasse 3 ausgerichtet.

- **Auswertung „Was gefällt den Kindern?“:** Zähler je Witz, Geschichte und Word of the Day über alle Kinder, damit ein späteres Update darauf reagieren kann. Voraussetzungen: nur Zähler ohne Kind, Konto oder Gerät; Hinweis im Datenschutztext; Einwilligung der Eltern, die sie selbst einschalten (Opt-in). Rechtliche Einzelheiten zusammen mit den Datenschutztexten vor der Beta klären.

- **Extras je Kind ein- und ausschalten (Peter, 27.11.):** Unter ⚙️ Einstellungen › Einstellungen für Mia › „Extras“ je ein funktionierender Schalter, voreingestellt „ein“, schon für die Beta: die vier Angebote aus „Choose your treat“ – 🌙 Pisolala (die Grenze „höchstens so spannend“, `storyCap`, bleibt darunter), 😄 Joke (auch der Witz zur Begrüßung, `greetJoke`), 🔍 Mystery Question, 📖 Word of the Day – und Explain it to me (die Karte auf der Übersicht im Elternbereich, `dailyUI.explainHTML`; Überschrift umbenennen von „Explain it · eine Frage zum Gespräch“ bzw. „Explain it · a question to talk about“ in „Explain it to me“, DE und EN, `DAILY_TEXT.explain` in `src/module/tagesinhalte.mjs`; Peter, 27.11.). Heute gibt es nur die Spannungsgrenze, keinen Schalter. Gespeichert je Kind wie `storyCap`, Ereignis `setting_set`. Ausgeschaltete Angebote erscheinen nicht in „Choose your treat“ bzw. nicht auf der Übersicht; Vorschlag nötig, was nach einer Runde mit Stern erscheint, wenn alle vier aus sind.

- **Elternbereich startet auf Englisch (Peter, 27.11.):** Die meisten Eltern sprechen Englisch; Deutsch dient vor allem Entwicklung und Tests. Heute startet der Bereich für Erwachsene auf Deutsch: `PL()` in `index.html` liest `parentLang` mit Vorgabe `'de'` (Kinder `kidLang` mit `'en'`), eine zweite Vorgabe `'de'` steht bei `store.get('parentLang','de')`. Neu: Vorgabe `'en'` an beiden Stellen; eine gespeicherte Wahl bleibt, DE/EN bleibt umschaltbar. Tests, die Deutsch als Start annehmen, zuerst zählen und im Plan auflisten; Bericht an Peter vor der Umsetzung.

- **IB-Bezüge und Schul-Motto entfernen, Leitbild umsetzen (Peter, 27./28.11.):** Alle Stellen aus `docs/konzept/leitbild.md`, Abschnitt „Textdurchsicht“, ändern: Startzeile mit IB/PYP entfernen, Motto „Believe. Inspire. Succeed.“ (Startbildschirm, Geburtstag, Übungsblatt HTML/PDF) durch „Be curious. Be brave. Keep growing.“ ersetzen, Leitsatz „Every quest makes you grow.“ im Wissensbaum, Zitate der Schule und IB-Namen im Konzept durch die Grundsätze ersetzen, Rückmeldungen „Reflective!“/„Balanced!“ anpassen, Code-Kommentare auf das Leitbild verweisen lassen. Dazu die Abzeichen umbenennen (Brave Spark, Problem Solver, Creative Cookie, Amazing Attitude, Unplugged Hero, Curiosity Champion, Mission Finisher, Practice Pro; Regel „Name ohne Steigerung“ noch offen, Namen vor der Umsetzung mit Kindern testen), die Pisolala-Geschichte mit „Risk-taker“ und die Quizfrage „ATL stands for…“ anpassen, Quellengruppe „IB und Schule“ umbenennen. Tests, die die alten Texte prüfen, mitändern. Hinweis-Text: Satz 2 neu, Sätze 3–6 noch in Durchsicht. Offen: Überschrift „Learner Profile Attributes“ in den Evaluations.

## I · Noch in Durchsicht (nicht umsetzen)

- Fachansicht (übrige Teile), Hilfe.
