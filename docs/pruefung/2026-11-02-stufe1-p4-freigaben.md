# S11 Stufe 1 – P4 Freigaben, Admin-Metadaten, Rechtematrix (02.11.2026)

Spezifikation: Vault „S11 Stufe 1 – Eindeutige Personen und Zuordnung“, Abschnitt 3.7 (Phase P4). Mit P4 ist **Meilenstein M2** und damit Stufe 1 erreicht.

## Umgesetzt

**Freigaben:** Eltern geben im Elternbereich unter „🔐 Zugriff & Freigaben“ einer Lehrkraft oder dem Admin Einblick:
- **Wen:** Den Anmeldenamen eintragen; es gibt keine Liste und keine Suche. Andere Namen werden abgelehnt.
- **Was:** Umfang „Lernstand“, auf Wunsch zusätzlich „Schuldaten“.
- **Wie lange:** 1–90 Tage, Voreinstellung 14.
- **Einwilligung:** Der Text aus dem Konzept wird vor dem Bestätigen angezeigt und im Protokoll gespeichert.
- Je Person läuft höchstens eine Freigabe; eine neue ersetzt die alte.
- **Wirkung:**
  - Der Empfänger sieht das Kind in „Meine Kinder“ (auf dem Gerät mit seinen Daten).
  - Er hat nur Leserechte: keine Einstellungen, kein Fokus, keine Blätter, keine Sicherung, keine Freigaben.
  - Ohne „Schuldaten“ sieht er weder das Kapitel noch die Schulzeilen an den Quests, und die Schuldaten fließen nicht in seine Ansicht ein.
  - Den Anzeigenamen sieht er nie, nur den Anmeldenamen.
- **Ende:** Beenden wirkt sofort; der Ablauf wird am Enddatum wirksam.
- **Protokoll:** erteilt, angesehen (einmal pro Tag), beendet, abgelaufen.
- Freigaben und Protokoll gehören zum Eltern-Bereich des Kindes und sind Teil der Sicherung.

**Lehrkraft-Zuordnung über die Kontendatei entfällt** (`teacherOf`): Die Bauprüfung lehnt sie ab. Lehrkräfte kommen nur über Freigaben an ein Kind (Befund B2 behoben).

**Admin:** Kapitel „🛠 Konten“ mit Anmeldename, Art und letzter Anmeldung auf diesem Gerät – ohne Inhalte und ohne Anzeigenamen. Den Lernstand sieht er nur mit Freigabe; sein Testkind bleibt.

**Texte:** Elternanleitung (DE/EN) um „Zugriff & Freigaben“ ergänzt.

**Nicht in Stufe 1:** „Ausprobieren mit einem Übungskind“ für Lehrkräfte (US4.6 des Umsetzungsplans) ist nicht Teil der Spezifikation S11; verschoben auf Stufe 2.

## Prüfung

- **Neu `tests/stufe1-p4.test.mjs`:**
  - **Rechtematrix (K10, K1):** 10 Rollenfälle × 11 Merkmale:
    - Rollen: Elternteil, Elternteil einer anderen Familie, Lehrkraft ohne / mit Lernstand / mit Lernstand+Schule / abgelaufen / beendet, Admin ohne / mit Freigabe, Elternteil bei laufender Freigabe;
    - Merkmale: Kind sichtbar, fremdes Kind, Profil, Übersicht, Schule, Schulzeile, Einstellungen, Fokus-Schalter, Sicherung, Freigaben, Konten.
  - **K9 mit echten Klicks:** falsche Namen abgelehnt; Einwilligungstext wörtlich; Lehrkraft nur lesend, ohne Schule und Anzeigenamen; eine neue Freigabe ersetzt die alte; Beenden; Protokoll mit „angesehen“ genau einmal am Tag; Freigaben im Eltern-Bereich des Kindes gespeichert.
  - **Ablauf** nach dem Enddatum, mit Protokolleintrag.
  - **Admin:** nur Verwaltungsangaben.
- **Umgestellt (bewusst):**
  - Lehrkraft-Test mit Freigabe statt Zuordnung;
  - Kapitelliste um „🔐 Access & grants“;
  - Umstellung v1 → v2 ohne `teacherOf`;
  - Speicherstellen-Verzeichnis um `grants`, `grantlog`, `lastSeen`.
- **Gegenprobe (7 von 7 rot):**
  - Schuldaten ohne Umfang;
  - Beenden wirkungslos;
  - Ablauf wirkungslos;
  - Admin mit Freigabe darf schreiben;
  - Freigaben-Kapitel für alle;
  - Konten-Kapitel für alle;
  - Anzeigename für Empfänger.
- `npm test`: 229 bestanden.
