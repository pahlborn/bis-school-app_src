# Schulische Einstufungen neu gestaltet (05.11.2026)

Auftrag: Peter, 05.11., Punkt 4 (Vault: „Aufgabe Elternbereich – Titel und Schulische Einstufungen“, Teil 2). Problem: eine lange Liste aufklappbarer Aufgaben mit Fließtext – „das übermüdet“, und im Lauf eines Schuljahrs wird sie sehr lang.

## Was neu ist (Kapitel „🏫 Schulische Einstufungen“ im Elternbereich, echte App, DE/EN)
- **Kopfzeile aus den Daten:** „Stand der Daten: <asOf> · neueste Bewertung: <neuester Tag>. Einstufungen der Lehrkraft; Ihr Kind sieht sie nicht.“ Die lange Einleitung steht jetzt im ⓘ.
- **⏳ Wartet auf Bewertung** als eigener kleiner Block (Datum · Fach · Aufgabe), nicht in der Tabelle.
- **Tabelle**, eine Zeile je bewerteter Aufgabe: Datum · Fach · Aufgabe · Einstufungen als Chips in Worten (schwächste zuerst, „4× Wird sicherer“) · „Details“.
- **Filter:** Fach (nur Fächer mit Daten), Zeitraum (Alles / Letzte 8 Wochen / Dieses Schuljahr ab 1. August), „Nur „Braucht Unterstützung“ / „Wird sicherer““. **Sortieren:** Datum (neueste zuerst, Standard), Fach (Reihenfolge der Schule), Einstufung (schwächste zuerst). Kein Treffer → Satz + „Filter zurücksetzen“. Filter und Details ändern nur die Liste (die Seite springt nicht).
- **Details** in fester Gliederung für jede Aufgabe: Standards (mit Einstufung; bei Lernkompetenzen in Worten) · Bewertungsraster (Kriterium | Lehrkraft | Selbst) · Stärken · Nächste Schritte – als kurze Punkte (Text an „;“ und Satzende geteilt). Fehlt etwas: „keine Angabe“, die Überschrift bleibt. Darunter klein: „Daraus im automatischen Fokus“, „Übt in der App“.
- **iPhone (≤ 600 px):** jede Zeile wird eine Karte mit Beschriftung („Datum: …“), Details darunter; nichts ragt über den Rand.
- **Wer sieht es:** Eltern; Lehrkraft nur mit Freigabe „Schuldaten“ (unverändert), dann dieselbe Ansicht mit Filtern; das Kind nie.
- **Keine festen Daten mehr:** Die Seite „📖 Das Konzept von Big Quest“ zeigt „Stand: <Bautag dieser Version>“ (aus `APP_VERSION.date`, ohne gebaute Version keine Zeile) statt „Stand: 30. Oktober 2026.“; die Startseite sagt „Topics from class.“ statt „…, updated 30 October.“

## Entscheidungen (Peter kann widersprechen)
- Bleibt **im Kapitel**, keine eigene Seite: Tabelle mit Filtern passt in den Rahmen, auf dem iPhone als Karten.
- Zeitraum-Standard „Alles“ (bei „Dieses Schuljahr“ wäre die Liste nach dem Sommer leer, obwohl Daten da sind).
- „Nur Braucht Unterstützung / Wird sicherer“ nimmt eine Aufgabe, wenn **mindestens ein** Standard so eingestuft ist.
- Schuljahr beginnt am 1. August.

## Belege
- Neu: `tests/schulische-einstufungen.test.mjs` (5 Tests, 60 erfundene Aufgaben über gut ein Schuljahr + 1 wartende): Spalten, Reihenfolge, Zählzeile, Chips in Worten ohne Kürzel, 9 Filter-/Sortierfälle gegen eine im Test **unabhängig gerechnete** Erwartung, Zurücksetzen, feste Gliederung bei allen 60, Raster nebeneinander, Punkte, Lernkompetenzen, ⓘ; Englisch ohne deutsche Wörter; iPhone 390 px (Karten, keine Überbreite, zugeklappte Details unsichtbar); Kind sieht nichts, Lehrkraft nur mit „Schuldaten“; keine festen Daten (Konzeptseite mit eingesetzter Version DE/EN, Startseite).
- Angepasst: `schule.test.mjs` (Raster jetzt in den Details, Kopfzeile mit Kathies echtem Stand 01.11./27.10.), `elternbereich-c1.test.mjs` (eine Tabelle der Aufgaben, weiterhin keine Standard-Tabelle).
- Gegenproben: 20/20 rot (`%TEMP%\opencode\gegenproben-einstufungen.mjs`) – u. a. falsche Standard-Reihenfolge, Sortierung/Filter wirkungslos, 8 Wochen = 4, Schuljahr ab Januar, „schwach“ nimmt Sicher, Raster-Überschrift fehlt, wartende Aufgabe in der Tabelle, Kürzel statt Worte, keine Karten, zugeklappte Details sichtbar, Lehrkraft ohne Freigabe sieht das Kapitel, feste Daten zurück (Konzeptseite, Startseite, Kopfzeile), Deutsch im Englischen, Fließtext statt Punkte, Zurücksetzen/Aufklappen kaputt.
- Volle Reihe: **816/816** (591 s).
