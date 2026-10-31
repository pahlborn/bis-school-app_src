# Elternansicht v2 (31.10.2026)

Freigabe Peter für das Konzept v2 (Vault: „Elternbereich – Konzept“, „Einstufung – vorsichtig und nachvollziehbar“).

## Umgesetzt

- **Übersicht wie die Kinderseite:** dieselben Fächer in derselben Reihenfolge, je Quest ein Farbkästchen, Fach-Stand in Worten, Anzahl im Fokus; rechts die **Einschätzung in Worten** (Üben in 14 Tagen · „Das gelingt schon gut“ mit Beleg · „Hier hilft Unterstützung“ mit konkretem Tipp · „Noch nicht einschätzbar“ · „Länger nicht geübt“ · Hinweis „keine schulische Beurteilung“) und eine Farblegende.
- **Fach antippen:** jede Quest mit Satz „was wird geübt“, Stand mit Schulbegriff, **wie sicher** (vorläufig/bestätigt), **Grundlage** (Aufgaben/Tage, selbst, mit Hinweis, Lösungsweg angesehen, offene Wiederholungen), **Tendenz** (nur bei zwei vergleichbaren Zeiträumen), **Aktualität** (Pausen > 3 Wochen: „ältere Belege – neu prüfen“, keine Abstufung), „So helfen Sie“, Kennzeichen „im Unterricht“/„braucht Übung“ und **Fokus-Schalter**; rechts die Fach-Einschätzung; „Empfehlung übernehmen“.
- **Vorsichtige Regeln:** Stand erst ab 8 ersten Versuchen an 3 Tagen; „bestätigt“ ab 20 Versuchen an 5 Tagen über ≥ 14 Tage; nur erster Versuch je Aufgabe zählt.
- **DE/EN** für die Elternansicht (Übersicht, Fach, Einschätzungen, Erklärungen), auf dem Gerät gemerkt.
- **Unterseiten** statt langer Seite: Übersicht · Übungsblätter · Einstellungen (Fokus-Liste mit Erklärung, Pisolala, Erinnerung, Profil, Version) · Helfen wie die Schule. Jede mit „Was kann ich hier tun?“.
- Lehrkraft: Übersicht, Fach (ohne Schalter) und Hilfeseite.

## Prüfung

- Neu `tests/elternansicht.test.mjs` (5 Tests, echte Klicks): gleiche Fächer wie das Kind, Einschätzung mit allen Abschnitten, kein Überlauf auf 390 px; Quest-Karten mit Stand/Schulbegriff/vorläufig/Grundlage/Tendenz/Tipp, „Noch nicht einschätzbar“ ohne Stufenwort bei wenig Daten (auch bei 7 Versuchen an 2 Tagen), „bestätigt“, „ältere Belege“; Fokus-Schalter und Empfehlung; DE/EN mit Speicherung; leerer Zustand.
- Angepasst: Tests navigieren zu den Unterseiten (`elternSeite`).
- Gegenproben (rot): Mindestmenge entfernt; „bestätigt“ ohne Bedingungen; Pausenhinweis entfernt.
- `npm test`: 165 bestanden.

## Noch offen

- Die Unterseiten „Einstellungen“ und „Helfen wie die Schule“ sind noch überwiegend deutsch; die vollständige englische Fassung folgt.
- Mehr Wiederholungen pro Runde bei vielen offenen Wiederholungen (Testbefund).
