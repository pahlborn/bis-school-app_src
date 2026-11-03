# Elternbereich F6: Schlussdurchgang (03.11.2026)

Paket F6 aus `docs/konzept/elternbereich-auftraege.md` (Konzept 2, 7.0, 7.6, 7.9). Letztes Paket der Reihe.

## Anliegen
Alle ⓘ-Texte und übrigen Elterntexte gegen die Schreibregeln S1–S8 prüfen, Begriffe vereinheitlichen, Reste der Streichliste entfernen. Dazu die zwei offenen Befunde aus E3 und F1.

## Vorgehen
- Die ⓘ-Texte (`HELP`, `HELP_EN`) und die Textbausteine (`PT`) habe ich maschinell auf Sätze über 22 Wörter und Absätze über 3 Sätze geprüft. Danach habe ich jeden Fund von Hand bewertet.
- Gesucht nach Zeitwörtern, verbotenen Begriffen (7.9) und Sätzen der Streichliste (7.6), DE und EN:
  - **Keine Funde:** „Rückstand“, „verpasst“, „overdue“, „behind“, „Einschätzung der Schule“, „Ihr Kind kann“, „Schwerpunkt“, „Priorität“, „Defizit“, „Welt“.
  - **„fällig“:** steht nur in „zufälligen“ (Datenschutz).
  - **„Kennung“ und „Prüfwert“:** stehen nur im Datenschutz, dort sind sie erlaubt.
- **Begriffe:** „Einschätzung“ steht für die App, „Einstufung“ für die Lehrkraft. Das ist durchgehend so; der Kapitelname „Bewertungen der Schule – Verlauf“ steht so im Konzept (5.3). Es war keine Änderung nötig.

## Vorher → Nachher (Stichprobe)
| Stelle | Vorher | Nachher |
|---|---|---|
| ⓘ Lücken laut Schule | „… übt die App ihn als Lücke: immer eine zur Zeit, höchstens 2 von 8 Aufgaben pro Runde.“ (28 Wörter) | „… übt die App ihn als Lücke. Immer eine zur Zeit, höchstens 2 von 8 Aufgaben pro Runde.“ |
| ⓘ Wie entsteht die Einschätzung? | Absatz mit 4 Sätzen: „Vorläufig heißt … Bestätigt erst … Eine Tendenz steht … Nach mehr als 3 Wochen …“ | Liste (S3): Vorläufig · Bestätigt · Tendenz · Ältere Belege |
| ⓘ Fokus: Automatisch oder Manuell | „Die App wählt selbst: die Themen, die die Lehrkraft …, dazu alles, wo …, und die aktive Lücke laut Schule. Das passt sich von selbst an.“ (30 Wörter) | „Die App wählt selbst und passt sich von selbst an:“ + Liste mit 3 Punkten |
| ⓘ Einstufungen der Schule | „Solange in der App für eine Quest noch zu wenig geübt wurde (weniger als 6 Antworten oder 2 Tage), richtet die App …“ (Klammer, 28 Wörter) | „Am Anfang richtet die App die Schwierigkeit der Aufgaben danach aus. Ab 6 Antworten an 2 Tagen zählt die eigene Übung.“ |
| ⓘ Ihr Kind unterstützen | „Die wichtigsten Regeln in Kürze. Konkretes zu jedem Thema – auch wie die Schule es zeigt – steht in der Übersicht bei jeder Quest …“ | „Ein Vorschlag, wie oft geübt wird, und die wichtigsten Regeln. Konkretes zu jedem Thema steht bei jeder Quest unter „💡 So helfen Sie“.“ (passt zu F5) |
| Übungsblätter, Absatz über der Liste | „So geht’s: Ihr Kind trägt … Hier sehen Sie … „Mit Hilfe“ und „Noch nicht“ sind gut so … Ein Blatt, das nicht eingetragen wird, zählt einfach nicht.“ Das stand fast wörtlich auch im ⓘ daneben. | „Ihr Kind trägt die Antworten selbst ein: Startseite → „My sheets“. Hier sehen Sie, wie jede Aufgabe lief.“ (S1). Der Rest steht nur noch im ⓘ, dort ist der letzte Satz ergänzt. |
| ⓘ Übungsblätter | ein Absatz mit 4 Sätzen | zwei Absätze |
| ⓘ Testkonto: +1 Tag | „… Fehler kommen als Wiederholung zurück, der Lernbaum wächst, die Einschätzung … sammelt Übungstage.“ | Liste mit 3 Punkten |
| Ausblick (Fachansicht) | „Ihr Kind sieht sie erst, wenn Sie sie hier freigeben – zum Beispiel, wenn …“ (24 Wörter) | zwei Sätze |

EN jeweils sinngleich. Dabei ist „not enough to tell yet“ im ⓘ der Einschätzung zu „not yet possible to judge“ geworden, passend zur Anzeige.

**Bewusst nicht geändert:** der ehrliche Satz bei den Lücken (27 Wörter, Semikolon). Das Konzept gibt ihn in 6.6 wörtlich vor.

## Die zwei offenen Befunde
- **„⭐ Das gelingt“ doppelt (aus E3):** In der Übersicht steht es nur noch in „Auf einen Blick“. Die Einschätzung rechts zeigt „Das gelingt schon gut“ dort nicht mehr. In der Fachansicht bleibt es, weil es dort keine Karte „Auf einen Blick“ gibt.
- **„?“ gedrückt kaum lesbar (aus F1):** Die Ursache war die Regel `.about .small` (graue Schrift für Kleingedrucktes). Sie traf auch kleine Knöpfe, weil diese ebenfalls die Klasse `small` tragen, und stach `.btn.primary` aus. Neu: `.about .btn.small` in normaler Schrift, gedrückt weiß. Damit sind auch „Abmelden“, „Jetzt sichern“ und andere kleine Knöpfe im Elternbereich nicht mehr grau.

## Prüfung
- Neu: `tests/elternbereich-f6.test.mjs`. Der Test sammelt je Sprache den sichtbaren Text aller Elternseiten und aller ⓘ-Texte (mindestens 8): Übersicht, alle Fächer, alle Kapitel aufgeklappt, ⚙ mit allen Abschnitten, ? Hilfe. Dann prüft er:
  - **T17:** keine Zeitwörter (mit Wortgrenzen, „zufällig“ zählt nicht); Lücken-Fortschritt in Aufgaben.
  - **T12:** keine Sätze der Streichliste; „Prüfwert“ und „Kennung“ nur im Datenschutz.
  - **T5:** Jeder Ortsname mit Symbol in „…“ aus Hilfe und ⓘ (z. B. „💡 So helfen Sie“, „⚙️ → „🔐 Zugriff & Freigaben““, „📖 So funktioniert Big Quest“) kommt auf den Seiten vor.
  - „Das gelingt“ steht einmal in der Übersicht; das gedrückte „?“ ist weiß.
- Angepasst: `blaetter` (gekürzter Absatz über den Übungsblättern), `elternansicht` („Das gelingt“ jetzt in „Auf einen Blick“).
- Gegenprobe: F6-Test mit der App von `main` rot („Das gelingt“ zweimal).
- `npm test`: 428 bestanden.

## Stand der Reihe
Alle 24 Pakete sind umgesetzt. Offen und nicht Teil dieser Reihe: Impressum (Platzhalter in ⚙ „Über die App“), Admin-Konzept beim Dev-Agenten (`docs/konzept/admin.md`), Voraussetzungen (Entwurf, nicht freigegeben).
