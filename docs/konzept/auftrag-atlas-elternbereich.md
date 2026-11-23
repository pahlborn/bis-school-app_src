# Auftrag an Atlas: Umbau Elternbereich

**Status: Arbeitsfassung.** Peter und Claude gehen den Elternbereich noch Abschnitt für Abschnitt durch; dieser Auftrag wird dabei fortgeschrieben. **Nicht beginnen vor Peters Freigabe.**

Grundlagen: `docs/konzept/textleitlinie.md` (vor allem Regel 4: Originalbegriffe) und `docs/konzept/elternbereich-entscheidungen-2026-11-18.md` (Abschnitt „Begriffe und Evaluations-Seite“, 23.11.). Vorlage für die Gestaltung ist Peters Klickdummy (5 Seiten: Übersicht, Fachansicht, Hilfe, Einstellungen, Evaluations); Peter stellt ihn bei der Freigabe bereit.

## A · Fokus

**A1 · Areas of Development aus übernommenen Evaluations speisen den automatischen Fokus**
- Heute: `classTopics` (Zeile ~2386) filtert von Eltern übernommene Evaluations aus (`!t.manual`), und das Formular „Evaluation übernehmen“ schreibt kein `focusNext`. Ohne vorbereitete Daten greift deshalb die feste Liste `FOCUS` (8 Quests).
- Neu: In der Vorschau ordnet die App jedem Punkt unter „Areas of Development“ eine Quest zu (Vorschlag; Eltern bestätigen oder ändern; „keine passende Quest“ ist erlaubt). Die bestätigte Zuordnung wirkt wie `focusNext` (Evaluations der letzten 8 Wochen, sonst alle).
- Korrigieren und Zurückziehen einer Evaluation ändern den Fokus entsprechend.
- Abnahme: Tests für übernehmen → Quest im automatischen Fokus, zurückziehen → Quest wieder draußen, ohne Areas of Development → bisheriges Verhalten.

**A2 · Fokus-Steuerung in „Einstellungen für [Kind]“**
- Befund: `focusMode` gibt es einmal je Kind, für alle Fächer. Ein Quest-Schalter in der Fachansicht stellt heute unbemerkt das ganze Kind auf Manuell (`toggleFocus`).
- Neu: eigener Abschnitt „🎯 Fokus für Practise Today“ in den Einstellungen des Kindes: Schalter Automatisch | Manuell, Hinweis „gilt für alle Fächer“, darunter je Fach eine zuklappbare Liste der Quests mit Haken, Hinweis „Ein Haken stellt den Fokus auf Manuell“.
- Fachansicht: kein Schalter und keine Haken mehr. Quests im Fokus tragen ein nicht klickbares Etikett „🎯 Im Fokus“. Am Seitenende eine Zeile „🎯 Fokus · Automatisch · gilt für alle Fächer · Anpassen in den Einstellungen ›“.
- Zurück auf Automatisch ist jederzeit möglich.

**A3 · Texte zur Wirkung** (Textleitlinie beachten)
- Automatisch: „Die App wählt aus den Areas of Development, den Learning goals und dem Übungsstand und passt den Fokus nach neuen Evaluations selbst an.“ (gilt erst mit A1)
- Manuell: „Sie wählen die Quests selbst. Die App passt dann nichts mehr an. Mit ‚Automatisch‘ übernimmt sie wieder.“ Prüfen, dass der Text auch die entfallenden Learning-goal-Aufgaben in Practise Today abdeckt (`gapLaneQuests` liefert bei Manuell nichts).
- Hilfetexte, die auf einen Bereich „🎯 Fokus“ verweisen, den es nicht gibt (DE und EN), an den neuen Ort anpassen.

## B · Evaluations-Seite

Ersetzt den Abschnitt „Schulische Einstufungen“. Aufbau wie im Entscheidungsdokument (23.11.), zusätzlich:
- Kurze Titel: Präfixe wie „G3“, „Grade 3“, „2026-27“ entfernen; Originaltitel in den Details.
- PYP-Themen ausschreiben, z. B. „How the world works (HTWW)“, „Where we are in place and time (WWA)“.
- Fach aus den Standards ableiten und in der Vorschau bestätigen lassen.
- Namen von Standardgruppen ohne vorangestelltes Schulkürzel anzeigen (nur das Fach).
- Zähler je Stufe statt einer Gesamtstufe; Zeile „Wirkt in der App“ je Evaluation, einschließlich „wird in Big Quest nicht geübt“.
- Filter bleiben (Fach, Zeitraum, „Nur mit C oder RS“).
- Der Katalog „Welche Quest übt welchen Standard?“ wandert in die Hilfe.

## C · Begriffe in der App

Alle sichtbaren Texte (DE und EN) nach Textleitlinie Regel 4 umstellen, u. a.: „Lücke“, „Lücken laut Schule“, „Wird sicherer“, „Braucht Unterstützung“, „Next steps“, „Schulische Einstufungen“. Der Hilfetext „Neue Bewertungen der Schule werden bei Gelegenheit übernommen“ ist sachlich falsch (Eltern übernehmen selbst) und wird ersetzt. Interne Namen im Code dürfen bleiben.

## D · Noch in Durchsicht (nicht umsetzen)

- Übersicht: Ob „Evaluations“ und „Übungsblätter“ als Werkzeuge in die Kopfzeile wandern, ist offen.
- Fachansicht (übrige Teile), Übungsblätter, Hilfe, Einstellungen (übrige Teile).
