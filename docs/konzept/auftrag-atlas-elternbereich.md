# Auftrag an Atlas: Umbau Elternbereich

**Status: Arbeitsfassung.** Peter und Claude gehen den Elternbereich noch Abschnitt für Abschnitt durch; dieser Auftrag wird dabei fortgeschrieben. **Nicht beginnen vor Peters Freigabe.**

Grundlagen: `docs/konzept/textleitlinie.md` (vor allem Regel 4: Originalbegriffe) und `docs/konzept/elternbereich-entscheidungen-2026-11-18.md` (Abschnitt „Begriffe und Evaluations-Seite“, 23.11.). Vorlage für die Gestaltung ist Peters Klickdummy (5 Seiten: Übersicht, Fachansicht, Hilfe, Verwalten, Evaluations); Peter stellt ihn bei der Freigabe bereit.

## A · Fokus

**A1 · Areas of Development aus übernommenen Evaluations speisen den automatischen Fokus**
- Heute: `classTopics` (Zeile ~2386) filtert von Eltern übernommene Evaluations aus (`!t.manual`), und das Formular „Evaluation übernehmen“ schreibt kein `focusNext`. Ohne vorbereitete Daten greift deshalb die feste Liste `FOCUS` (8 Quests).
- Neu: In der Vorschau ordnet die App jedem Punkt unter „Areas of Development“ eine Quest zu (Vorschlag; Eltern bestätigen oder ändern; „keine passende Quest“ ist erlaubt). Die bestätigte Zuordnung wirkt wie `focusNext` (Evaluations der letzten 8 Wochen, sonst alle).
- Korrigieren und Zurückziehen einer Evaluation ändern den Fokus entsprechend.
- Abnahme: Tests für übernehmen → Quest im automatischen Fokus, zurückziehen → Quest wieder draußen, ohne Areas of Development → bisheriges Verhalten.

**A2 · Fokus-Steuerung unter „Verwalten“ (Teil des Kindes, siehe D)**
- Befund: `focusMode` gibt es einmal je Kind, für alle Fächer. Ein Quest-Schalter in der Fachansicht stellt heute unbemerkt das ganze Kind auf Manuell (`toggleFocus`).
- Neu: eigener Abschnitt „🎯 Fokus für Practise Today“ unter „Verwalten“, im Teil des Kindes: Schalter Automatisch | Manuell, Hinweis „gilt für alle Fächer“, darunter je Fach eine zuklappbare Liste der Quests mit Haken, Hinweis „Ein Haken stellt den Fokus auf Manuell“.
- Fachansicht: kein Schalter und keine Haken mehr. Quests im Fokus tragen ein nicht klickbares Etikett „🎯 Im Fokus“. Am Seitenende eine Zeile „🎯 Fokus · Automatisch · gilt für alle Fächer · Anpassen unter Verwalten ›“.
- Zurück auf Automatisch ist jederzeit möglich.

**A3 · Texte zur Wirkung** (Textleitlinie beachten)
- Automatisch: „Die App wählt aus den Areas of Development, den Learning goals und dem Übungsstand und passt den Fokus nach neuen Evaluations selbst an.“ (gilt erst mit A1)
- Manuell: „Sie wählen die Quests selbst. Die App passt dann nichts mehr an. Mit ‚Automatisch‘ übernimmt sie wieder.“ Prüfen, dass der Text auch die entfallenden Learning-goal-Aufgaben in Practise Today abdeckt (`gapLaneQuests` liefert bei Manuell nichts).
- Hilfetexte, die auf einen Bereich „🎯 Fokus“ verweisen, den es nicht gibt (DE und EN), an den neuen Ort anpassen.

## B · Evaluations-Seite

Ersetzt den Abschnitt „Schulische Einstufungen“. Erreichbar über „Verwalten“ (siehe D) und über die Links „Evaluation 05.11. ›“ in der Fachansicht. Aufbau wie im Entscheidungsdokument (23.11.), zusätzlich:
- Kurze Titel: Präfixe wie „G3“, „Grade 3“, „2026-27“ entfernen; Originaltitel in den Details.
- PYP-Themen ausschreiben, z. B. „How the world works (HTWW)“, „Where we are in place and time (WWA)“.
- Fach aus den Standards ableiten und in der Vorschau bestätigen lassen.
- Namen von Standardgruppen ohne vorangestelltes Schulkürzel anzeigen (nur das Fach).
- Zähler je Stufe statt einer Gesamtstufe; Zeile „Wirkt in der App“ je Evaluation, einschließlich „wird in Big Quest nicht geübt“.
- Filter bleiben (Fach, Zeitraum, „Nur mit C oder RS“).
- Der Katalog „Welche Quest übt welchen Standard?“ wandert in die Hilfe.

## C · Begriffe in der App

Alle sichtbaren Texte (DE und EN) nach Textleitlinie Regel 4 umstellen, u. a.: „Lücke“, „Lücken laut Schule“, „Wird sicherer“, „Braucht Unterstützung“, „Next steps“, „Schulische Einstufungen“. Der Hilfetext „Neue Bewertungen der Schule werden bei Gelegenheit übernommen“ ist sachlich falsch (Eltern übernehmen selbst) und wird ersetzt. Interne Namen im Code dürfen bleiben.

## D · „Verwalten“ statt „Einstellungen“

- Knopf in der Kopfzeile und Seitentitel heißen „Verwalten“. Die Seite hat zwei Teile:
  1. **[Kind]** („gilt nur für dieses Kind“): Evaluations (Knopf „Evaluation übernehmen“, die zwei neuesten Einträge mit Zählern je Stufe, „Alle Evaluations ›“ zur Evaluations-Seite), 🎯 Fokus für Practise Today (A2), Lernen & Spaß, Profil und Klasse, Freigaben.
  2. **Familie & App** („gilt für alle Kinder und Geräte“): Familie & Geräte, Sicherung, Über die App.
- Die Evaluations-Seite ist eine Unterseite von „Verwalten“ (Zurück-Knopf „‹ Verwalten“).
- Die Übersicht zeigt keine Zeile und keinen Abschnitt zu Evaluations mehr; dort steht nur der Lernerfolg.
- Hilfetexte mit Wegangaben („Einstellungen › …“) auf „Verwalten › …“ umstellen.

## E · Übersicht: „Was deinem Kind gefällt“ entfällt

- Der Abschnitt (`parentHTML` in `src/module/inhaltsfeedback.mjs`, eingebunden in `parentHomeHTML`) wird aus dem Elternbereich entfernt. Grund: Die Daumen sollen dem Team zeigen, was Kindern gefällt; für Eltern ist eine Liste der letzten 6 Daumen ohne Nutzen.
- Speichern bleibt unverändert: ein Daumen je Inhalt (`contentFeedback`), Ereignis `content_vote`, 👎 bei Witzen blendet den Witz für dieses Kind aus.
- Tests, die den Abschnitt im Elternbereich prüfen, werden angepasst, ohne die Prüfungen für das Speichern zu schwächen.

## F · Übungsblätter unter „Verwalten“

- Der Abschnitt „Übungsblätter“ (`sheetsPageHTML`) wandert von der Übersicht unter „Verwalten“, Teil des Kindes, direkt nach den Evaluations. Inhalt und Funktion bleiben: Liste, offene zuerst, Stand je Blatt, Ergebnisse je Aufgabe, „Blatt verwerfen“ solange nichts eingetragen ist.
- Die eigene Hinweiszeile auf der Übersicht („📄 … ist noch offen“) entfällt. Stattdessen zeigt Block „Seit Ihrem letzten Besuch“ eine Kachel „N Übungsblätter warten aufs Eintragen ›“ (nur wenn N > 0), die zu „Verwalten“ führt.
- Leerer Zustand positiv formulieren, z. B. „Neue Blätter erstellt [Kind] auf der Startseite („📄 Practice sheet“) oder Sie in der Fachansicht bei einer Quest.“
- Der Knopf „📄 Übungsblatt“ je Quest in der Fachansicht bleibt.

## Backlog (nicht Teil dieses Auftrags)

- **Auswertung „Was gefällt den Kindern?“:** Zähler je Witz, Geschichte und Word of the Day über alle Kinder, damit ein späteres Update darauf reagieren kann. Voraussetzungen: nur Zähler ohne Kind, Konto oder Gerät; Hinweis im Datenschutztext; Einwilligung der Eltern, die sie selbst einschalten (Opt-in). Rechtliche Einzelheiten zusammen mit den Datenschutztexten vor der Beta klären.

## G · Noch in Durchsicht (nicht umsetzen)

- Fachansicht (übrige Teile), Hilfe.
