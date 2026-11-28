# Backlog – gesammelte Entscheidungen und Ideen

Stand 28.11.2026 · **Backlog = Sammlung, kein Umsetzungsauftrag.** Hier stehen Entscheidungen, Ideen und Prüfpunkte, für alle Agenten lesbar – vor allem aus Peters Durchsicht des Klickdummys (claude.ai-Artefakt „Elternbereich Entwurf“), damit nichts verloren geht. In einen Auftrag an Atlas kommen sie erst, wenn Peter „Auftrag schreiben“ sagt (`docs/konzept/fahrplan.md`, Regel 3). Der Name im Klickdummy ist ein Platzhalter: **[Name]** = Name des Kindes.

## Paket 2 · Rechtliche Bereinigung

Bereits festgehalten in `docs/konzept/leitbild.md` (Textdurchsicht) und im Backlog von `docs/konzept/auftrag-atlas-elternbereich.md`:
- IB/PYP/Learner Profile aus Produkttexten entfernen; Motto der Schule „Believe. Inspire. Succeed.“ durch „Be curious. Be brave. Keep growing.“ ersetzen (Startbildschirm, Geburtstag, Übungsblatt).
- „Über Big Quest“: „Big Quest ist ein spielerisches Übungsangebot für Kinder im Grundschulalter …“; Zeile „Aufgaben für: Grade 3“ (später freigegebene Stufen; Lizenzfrage zurückgestellt). Jahrgangsstufe des Kindes in den Persönlichen Einstellungen, Hinweis bei Stufe ohne Aufgaben dort.
- Wichtiger Hinweis: alle sechs Sätze laut Leitbild.
- Abzeichen umbenennen: Brave Spark, Problem Solver, Creative Cookie, Amazing Attitude, Unplugged Hero, Curiosity Champion, Mission Finisher, Practice Pro (vor der Umsetzung mit Kindern testen; Regel „Name ohne Steigerung“ offen).
- Offen: Überschrift „Learner Profile Attributes“ in den Evaluations behalten oder umbenennen.

## Paket 3 · Elternbereich neu (ersetzt A, D und E)

| Nr. | Eintrag | Stand |
| --- | --- | --- |
| 3.1 | **Übersicht „Auf einen Blick · [Name]“** wie heutiges `glanceHTML`: Seit Ihrem letzten Besuch (Aufgaben, Abzeichen, Titel, geschlossene Learning goals), Titel mit nächstem Ziel, Das gelingt, Daran arbeiten wir, Idee für zu Hause; rechts klein „Ihr letzter Besuch: Wochentag, Datum“; Quests in den Zeilen sind Links in ihr Fach (kein gemeinsamer „Mehr dazu“-Link). „Daily Quick Tip“ entfällt. Titel aus „Wo steht [Name]?“ in den Blick. | entschieden |
| 3.2 | **„Was [Name] gefällt“ bleibt** (letzte Daumen zu Pisolala, Joke, Word of the Day, Mystery Question; 👎 bei Witz „kommt nicht wieder“). Abschnitt E angehalten. | entschieden |
| 3.3 | **Explain it to me** auf der Übersicht (Karte heißt künftig so, DE und EN). | entschieden (Backlog) |
| 3.4 | **Sprachwahl als Flaggen** 🇩🇪/🇺🇸 wie heute (`flagsHTML`, eigene Grafiken), nicht als Text. | entschieden |
| 3.5 | **„👋 Neu hier?“** auf der Übersicht führt zu „Erste Schritte“ statt zum Konzept (`newHereLine`). Prüfen: verträgt sich mit „höchstens zwei Tipp-Leisten“ (Abschnitt F). | entschieden |
| 3.6 | **Hilfe in drei Stufen:** „Erste Schritte“ (7 Schritte: Kind anlegen, weitere Kinder, zweiten Elternteil einladen · Profil und Schule · Evaluation übernehmen · Fokus ansehen (freiwillig) · Kalender-Erinnerung (freiwillig) · Lehrkraft freigeben (freiwillig) · Regelmäßig sichern), „Kurz beantwortet“ (12 Fragen, je „Mehr im Handbuch ›“, inkl. Swift Playgrounds solange genutzt), „Mehr erfahren“ (Handbuch: Steuerung, Belohnungen, Evaluations, Daten und Sicherheit), „📖 Leitgedanken von Big Quest“ mit Motto. „Gerät verbinden“ steht nicht in der App-Hilfe (wer sie liest, ist schon verbunden), sondern im Handbuch und in der Einladung. Hilfe kurz und knapp; Bildfolgen nur im Handbuch. | entschieden |
| 3.7 | **Anmeldung:** sichtbarer Zwischenschritt „⏳ Connecting this device …“ bis „✅ Device connected – please log in“; im Elternbereich „⏳ Der Lernstand Ihrer Kinder wird geladen …“ statt „Daten auf dem Gerät des Kindes. Sie sehen sie dort.“ (`myKidsNote`, Tester-Rückmeldung). Vorhandene Logik nutzen (`#kidWait`, `renderVerbinden`). Die Hilfe auf dem Startbildschirm („❓ Help“, beginnt mit „The first time: open the link of your invitation …“) bleibt wie sie ist; sie deckt das erste Verbinden ab (Peter, 28.11.: Gutes nicht umbenennen). | Zwischenschritt und Laden entschieden |
| 3.8 | **Verwalten** (Seite 4): nur Evaluations, 🎯 Aufgabensteuerung, Übungsblätter. Aufgabensteuerung: Fokusthemen mit Gründen (Learning goal, Areas of Development, Übungsstand RS/C), weitere Learning goals, abgeschlossene; Schalter „Learning-goal-Übungen beimischen · eins zur Zeit“. Offen: „eine Einstellung für alle Fächer“ an den Schalter; Zusatz „· Learning goal“ am Fokus-Kärtchen. | Aufbau entschieden |
| 3.9 | **⚙️ Einstellungen** (Seite 6): „Einstellungen für [Name]“ (Persönliche Einstellungen · Extras · Kalender-Erinnerung · Sicherung & Daten mit „noch nie gesichert“ im Titel · Zugriff & Freigaben (nur mit Konto)) und „Einstellungen für die Familie“ (Familie · Meine Geräte), Unterkapitel aufklappbar; „Über Big Quest“ immer sichtbar. Extras-Schalter laut Backlog. | entschieden |
| 3.10 | **Fachansicht** (Entwurf 2d): Kennzeichen rechts, Stufen 12 px, Schrittleiste farbig (Evaluation · Übt · M erreichen/erreicht · Gehalten; „Gehalten: 5 von 6 beim ersten Versuch richtig“), Balken mit C 50 % / M 80 %, „Details zum Übungsstand“ aufgeklappt; Zeile „Assessment“ mit „Evaluation 05.11. ›“. | entschieden |
| 3.11 | **„So können Sie [Name] helfen“:** Ziel zuerst; Prüfpunkt „Hier übt [Name] noch“ (Aufgabenart mit niedrigster Quote, mind. 3 Aufgaben, unter 50 %, plus Beispiel; zuerst zählen); Texte nach Textleitlinie Regel 8 als Angebot (statt „Darauf achten“); fachliche Prüfung durch eine Lehrkraft vor der Beta, ohne sichtbaren Hinweis. | entschieden, Texte offen |
| 3.12 | **Learning-goal-Knöpfe:** „Dieses zuerst üben“, „Nicht mehr extra üben“, „Wieder extra üben“ (auch nach Schließen durch Eltern); Zustände „wird extra geübt“, „kommt danach dran“, „abgeschlossen“; bei manuellem Fokus „pausiert“. | Backlog |
| 3.13 | **Regeln für die Umsetzung:** Stufenfarben immer voll, helle Töne nur für Hervorhebungen; jede angezeigte Zahl aus vorhandener Funktion oder kleinem Helfer mit Test; Begriffe „Assessment“ (Teil der Lehrkraft) und „Evaluation“ (einzelne Bewertung mit Datum). | entschieden |
| 3.14 | **Texte kindneutral:** allgemeine Texte „Ihr Kind“, Name nur wo Daten eines Kindes gezeigt werden; keine Pronomen „sie/er/ihr/sein“ für das Kind. Als Textleitlinie-Regel 9 vorschlagen. | entschieden |
| 3.15 | **Funktionen erhalten:** Vor dem Umbau eine Funktionsliste aller Knöpfe und Dialoge des Elternbereichs (heute → neu); nichts verschwindet ohne Peters Entscheidung; alle bestehenden Tests bleiben grün, keiner wird abgeschwächt. Vorschlag: Paket 3 in drei Schritten (Übersicht und Hilfe · Verwalten und Evaluations · ⚙️ Einstellungen), je Schritt kurze Prüfliste für Peters Test. Übergabe: was der Klickdummy festlegt · was bleibt wie in der App · Platzhalter (Daten, [Name], Emoji-Flaggen) nicht übernehmen. | Vorschlag, nicht entschieden |
| 3.16 | **Dialoge zum Bearbeiten** noch zu entwerfen, in zeitlicher Reihenfolge: Gerät verbinden · Familie · Profil und Schule · Evaluation übernehmen · Quests manuell auswählen · Kalender-Erinnerung · Freigabe erteilen · Sicherung und Zurückspielen. | offen |
| 3.17 | **Start auf Englisch** und englische Textdurchsicht (Backlog); Klickdummy auf Englisch, wenn fertig (Paket 5). | Backlog |

## Paket 4 · Karriereleiter

- Analyse vom 28.11. (Grafik „Belohnungen in Big Quest“, Befunde 2–10): Glow-Abzeichen für einen Tipp; Abzeichen ohne Bildschirm per Zufall und Tipp; ungleiches Tempo, Combos doppelt; Neugier-Abzeichen beim Öffnen; Sternenregen feste Schwelle 6; ein Konfetti für drei Anlässe; Titel und Baum aus der Evaluation ohne Übung; Me as a Learner und Events zählen für Titel, nicht im Baum; zweiter Versuch zählt für Sterne und Abzeichen.
- Offen: Regel „Name ohne Steigerung“; Stufennamen (schlicht/Silber/Gold oder z. B. Seed → Sprout → Bloom); „Sind vier Belohnungen zu viel?“.

## Grundsätze (schon gültig)

Leitbild Grundsätze 1–12, Textleitlinie Regeln 1–8, Fahrplan, Beta-Regel – siehe die jeweiligen Dokumente.
