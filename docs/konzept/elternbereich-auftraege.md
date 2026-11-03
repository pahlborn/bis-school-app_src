# Aufträge Elternbereich – zum Kopieren

Grundlage: `docs/konzept/elternbereich.md` (im Folgenden „Konzept“). Jeder Block unten ist ein vollständiger Auftrag für **ein** Paket. Peter kopiert jeweils den gemeinsamen Vorspann und genau einen Paket-Block in die Sitzung des Agenten.

**Reihenfolge:** A1 → B1 → B2 → B3 → B4 → B5 → C1 → D1 → D2 → D3 → D4 → E1 → E2a → E2b → E2c → E2d → E2e → E3 → F1 → F2 → F3 → F4 → F5 → F6.
Erst verschieben (B), dann neu bauen (C–E), zuletzt umschreiben (F). So wird kein Text zweimal angefasst.

**Stand:** Peter hakt hier ab, was gemerged ist.

| Paket | Status |
|---|---|
| A1 | ☑ (#59) |
| B1 · B2 · B3 · B4 · B5 | ☑ (#61) ☑ (#63) ☑ (#64) ☑ (#66) ☑ (#68) |
| C1 | ☑ (#70) |
| D1 · D2 · D3 · D4 | ☑ (#72, #74) ☑ (#76) ☑ (#77, nur Überspringen) ☑ (#79) |
| E1 · E2a · E2b · E2c · E2d · E2e · E3 | ☑ (#80) ☑ (#83) ☑ (#84) ☑ (#85) ☑ (#86) ☑ (#87) ☑ (#88) |
| F1 · F2 · F3 · F4 · F5 · F6 | ☑ (#91) ☑ (F2) ☐ ☐ ☐ ☐ |

---

## Gemeinsamer Vorspann (jedem Auftrag voranstellen)

> Repo `pahlborn/bis-school-app_src`. Lies zuerst `docs/konzept/elternbereich.md` Abschnitt 2 (Leitregeln) und die im Auftrag genannten Abschnitte, nicht das ganze Konzept.
>
> Regeln:
> - Neuer Branch von aktuellem `main`, eine PR (Entwurf), ein Prüfbericht `docs/pruefung/JJJJ-MM-TT-<paket>.md` im bisherigen Stil (Anliegen, Umgesetzt, Prüfung, Gegenproben).
> - Nur, was im Auftrag steht. Anderes, das auffällt, unter „Gefunden, nicht geändert“ im Prüfbericht.
> - DE und EN im selben Paket.
> - `npm test` vollständig grün; neue Tests mit Gegenprobe (rot ohne die Änderung).
> - Branch `stufe2-p1-krypto` und `src/module/` nicht anfassen, außer der Auftrag sagt es.
> - Nicht veröffentlichen. Probe-Bau ist erlaubt.
> - Keine echten Kinder- oder Schuldaten in Tests, Prüfbericht oder Commit.
> - Wird das Paket größer als erwartet (mehr als etwa 10 Funktionen oder 30 Textstellen): anhalten, Teilung vorschlagen, fragen.
> - Bei ✋: erst das genannte Zwischenergebnis vorlegen und auf Peters Freigabe warten.

---

## Phase A – Fehler

### A1 · Drei falsche Texte
- **Lies:** Konzept 4 (B1–B3), 7.5.
- **Tu:**
  1. Willkommen (`index.html` ca. 4119–4120): Verweis auf „📖 Anleitung & Hintergrund“ / „Guide & background“ durch den heutigen Kapitelnamen „📱 Bedienung & Technik“ / „📱 Using the app“ ersetzen. (Der endgültige Text aus 7.5 kommt erst mit B2.)
  2. „Aufbau“ (ca. 4539, EN suchen): Fokus richtig beschreiben: „Den Fokus wählt die App aus den nächsten Schritten der Lehrkraft und der eigenen Übung; Eltern können auf Manuell umstellen.“
  3. „Lernlogik“ (ca. 4543, EN suchen): „Einzelheiten stehen im Elternbereich“ streichen.
- **Nicht:** andere Texte ändern.
- **Test:** T5 nur für diese drei Stellen (Kapitelname existiert; die alten Sätze fehlen).
- **Umfang:** S.

---

## Phase B – Struktur (nur verschieben, Texte bleiben wörtlich)

### B1 · Kopf und ⚙-Ansicht
- **Lies:** Konzept 3, 5.1, 5.5, 5.7, 5.9.
- **Tu:**
  1. Kopf: Kind · Flaggen · ? (noch ohne Ziel, kommt in B2) · ⚙ · Abmelden. Version und Testkind-Knopf aus dem Kopf entfernen (Testkind-Knopf vorläufig in ⚙ Konten, bis B5).
  2. ⚙-Ansicht mit „← Zurück zur Übersicht“: Für <Kind>, Sicherung & Daten, Zugriff & Freigaben, Konten (Admin), Über die App (vorerst nur Version), Abmelden. Inhalte aus den bisherigen Kapiteln **unverändert** hierher verschieben; die Kapitel in der Übersicht entfallen.
  3. Hash-Routen `#eltern/einstellungen[/abschnitt]`, Browser-Zurück.
- **Nicht:** Texte umschreiben, Hinweise ändern (B4), Kinderauswahl ändern (B5).
- **Tests:** T1 (ohne Testkind-Teil), T2, T3.
- **Umfang:** M.

### B2 · ?-Hilfe-Ansicht
- **Lies:** Konzept 5.6, 7.5.
- **Tu:** „📱 Bedienung & Technik“ unverändert in eine eigene ?-Ansicht verschieben (je Rolle wie heute `guideAdultFor`), Route `#eltern/hilfe`; Kapitel aus der Übersicht entfernen. Willkommen-Text nach 7.5.
- **Nicht:** Hilfetext kürzen (F1).
- **Tests:** T3 (Hilfe-Route), T5 (Willkommen).
- **Umfang:** S.

### B3 · Über die App
- **Lies:** Konzept 5.8, R11.
- **Tu:** In ⚙ Über die App: Über diese Anwendung, Wichtiger Hinweis (+ Satz aus 5.8), Datenschutz (aus „So funktioniert“ verschoben, „Konten und Rechte“ auf zwei Sätze mit Verweis), Impressum-Platzhalter, Version. Satz zur Verantwortung auch kurz ins ⓘ der Einschätzung. Kinderseite prüfen: Was dort heute zu Datenschutz und Hinweis sichtbar ist, bleibt sichtbar.
- **Nicht:** öffentliche Hülle ändern.
- **Test:** T11.
- **Umfang:** S.

### B4 · Übersicht aufräumen
- **Lies:** Konzept 5.3, R4, R10.
- **Tu:** Hinweise nach 5.3 (Datenumzug als Warnzeile → ⚙, Text und „Erneut versuchen“ nach ⚙ Sicherung & Daten; Sicherungs-Hinweis nur nach neuer Übung und > 30 Tagen oder nie; „Neu hier?“ je Erwachsenem); Dauerzeile Sicherung weg; „So lesen Sie diese Seite“ weg; Legende als eine Zeile, Prosa ins ⓘ; Kapitelreihenfolge So funktioniert · Ihr Kind unterstützen · Einstufungen der Schule · Übungsblätter.
- **Nicht:** Schul-Kapitel umbauen (C1).
- **Tests:** T4, T8, T18.
- **Umfang:** S.

### B5 · Kinderauswahl und Testkinder
- **Lies:** Konzept 5.1, 5.2, 5.9.
- **Tu:** Auswahlliste ab 2 Kindern. Testkinder nur im Admin-Konto, dort in der Liste mit 🧪; Warnzeile mit „▶ Als Testkind spielen“; Testkind-Knopf aus ⚙ Konten entfernen. Wenn `visibleKids` in `src/module/rechte.mjs` betroffen ist: dort ändern, mit Modultest.
- **Nicht:** Admin-Rechte erweitern. Weitere Admin-Fragen (Schalter, Rechte bei Testkindern) als Vorschlag in einem eigenen Dokument `docs/konzept/admin.md` sammeln, nicht umsetzen.
- **Tests:** T1 (Testkind-Teil), T10.
- **Umfang:** S–M.

---

## Phase C – Schule in der Fachansicht

### C1 · Block „Aus der Schule“
- **Lies:** Konzept 5.3 (Punkte 3 und 5), 5.4, 5.9, 7.9.
- **Tu:** Block oben in der Fachansicht (Standards des Fachs, nächste Schritte mit „Daraus im automatischen Fokus“, Lernkompetenzen bei Me as a Learner, Herkunftssatz). Kapitel in der Übersicht wird „🏫 Bewertungen der Schule – Verlauf“ (nur Aufgaben chronologisch). 🏫-Punkt an den Kacheln. Je Quest App-Einschätzung und Schul-Einstufung nebeneinander (heute `schoolLine()`). Die Lücken-Zeile im Block bleibt leer bis D4.
- **Nicht:** Fokus-Logik ändern.
- **Test:** T13.
- **Umfang:** M.

---

## Phase D – Lücken schließen

### D1 · Lücken-Logik
- **Lies:** Konzept 6.1–6.5, 6.8.
- **Tu:** `openGaps()`, `activeGap()` nach 6.2–6.4 (ohne Voraussetzungen, die kommen in D3: Reihenfolge vorerst RS vor C, älteste zuerst). Ende nach 6.3 (bestätigt sicher, neuere Einstufung ≥ M; Eltern-Schließen nur als Datenfeld vorbereiten). Speicherung je Kind und Quest (Zeitpunkt, auslösende Einstufung). `focusAuto()` um `activeGap()` ergänzen. Etikett „Lücke laut Schule (Datum)“ an der Quest.
- **Nicht:** Practise-Today-Anteil (D2), Eltern-Knöpfe (D4).
- **Test:** T14 ohne Anteil-Teil. Prüfung mit echten Daten nach 6.8.
- **Umfang:** M.

### D2 · Anteil in Practise Today und Übungsblatt
- **Lies:** Konzept 6.5.
- **Tu:** `buildToday()` mit zwei Spuren, höchstens 2 von 8 aus der aktiven Lücke, Grundlage zuerst; Übungsblatt höchstens 1/4.
- **Nicht:** Schwierigkeitslogik ändern.
- **Test:** T14 Anteil-Teil.
- **Umfang:** S.

### D3 ✋ · Voraussetzungen
- **Lies:** Konzept 6.4, 6.7.
- **Tu:** **Erst** Tabelle „Quest A setzt Quest B voraus“ (Mathe, Deutsch, nur Eindeutiges, je Zeile ein Satz Begründung) im Prüfbericht vorlegen und auf Peters Freigabe warten. **Dann** als Datenliste einbauen und in der Reihenfolge von `activeGap()` an erste Stelle setzen.
- **Test:** T14 um Reihenfolge mit Voraussetzung erweitern.
- **Umfang:** S.

### D4 · Lücke für Eltern
- **Lies:** Konzept 6.6, R10, R11.
- **Tu:** Fortschritt als Balken und „noch etwa N Aufgaben“; „Lücke geschlossen ✓ (Datum)“ im Block „Aus der Schule“; Knöpfe „Weiter üben“, „Als geschlossen markieren“, „Jetzt angehen“ mit Vermerk; Lücken-Status im Block „Aus der Schule“.
- **Tests:** T17, T19.
- **Umfang:** S.

---

## Phase E – Karten

### E1 · Quest-Karte: Aufbau
- **Lies:** Konzept 5.11.
- **Tu:** Karte mit Ebenen 1–3 für alle Quests; Ebene-2-Zeile; ⓘ „Worauf beruht das?“ als Tabelle; „So helfen Sie“ noch mit den heutigen Texten, aber schon in den Teil-Kästen, soweit sie sich eindeutig zuordnen lassen. „Was kann ich hier tun?“ und lange Fokus-Erklärung → ein Satz + ⓘ.
- **Nicht:** Texte von „So helfen Sie“ umschreiben (E2).
- **Test:** T16 (Aufbau).
- **Umfang:** M.

### E2a ✋ · So helfen Sie: Maths
- **Lies:** Konzept 5.11, 7.0, 7.9.
- **Tu:** **Erst** Vorher/Nachher-Tabelle für alle Maths-Quests (DE) im Prüfbericht vorlegen, auf Freigabe warten. **Dann** DE und EN einbauen. Umsortieren und kürzen, nichts neu erfinden; Wegfallendes listen.
- **Test:** T16 für Maths.
- **Umfang:** S.

### E2b ✋ · So helfen Sie: English
Wie E2a, für English.

### E2c ✋ · So helfen Sie: Deutsch
Wie E2a, für Deutsch.

### E2d ✋ · So helfen Sie: Science
Wie E2a, für Science.

### E2e ✋ · So helfen Sie: Library & Reading, Me as a Learner, Events
Wie E2a, für diese drei Fächer.

### E3 · Auf einen Blick
- **Lies:** Konzept 5.10, R10, R11.
- **Tu:** Karte mit vier Zeilen; letzter Besuch je Erwachsenem; Idee rotiert; Lehrkraft ohne erste Zeile.
- **Test:** T15.
- **Umfang:** M.

---

## Phase F – Texte

### F1 · Hilfe
- **Lies:** Konzept 7.0, 7.3, 7.6, 7.7.
- **Tu:** Eine Fassung je Rolle nach 7.3, Streichliste (Hilfe-Teil), Verweise auf ⚙ über Routen; alle Verweise nach 7.7 umstellen.
- **Tests:** T5, T7 (Hilfe), T12 (Hilfe-Teil).
- **Umfang:** S.

### F2 ✋ · So funktioniert, Teil 1
- **Lies:** Konzept 7.0, 7.2 (1–3).
- **Tu:** **Erst** neuen DE-Text für Grundidee, Aufbau, So lernt das Kind im Prüfbericht vorlegen, auf Freigabe warten. **Dann** DE und EN einbauen.
- **Test:** T6.
- **Umfang:** S.

### F3 ✋ · So funktioniert, Teil 2
- **Lies:** Konzept 6, 7.0, 7.2 (4–6).
- **Tu:** wie F2 für Helfen wie die Schule, Wie die App einstuft (mit „Lücken schließen“ und „Genaue Schwellen“ zugeklappt), Herkunft. Fokus-ⓘ und Einleitung „Aus der Schule“ an 6 anpassen.
- **Tests:** T6, T7.
- **Umfang:** S.

### F4 · Quellen
- **Lies:** Konzept 7.4.
- **Tu:** sechs zugeklappte Gruppen, keine Quelle streichen.
- **Test:** T9.
- **Umfang:** S.

### F5 · Ihr Kind unterstützen
- **Lies:** Konzept 7.1.
- **Tu:** „Unser Vorschlag“ oben; Zeitangabe je Runde nur, wenn Zeitstempel vorhanden; fünf Regeln straffen.
- **Test:** T17 (dieses Kapitel).
- **Umfang:** S.

### F6 · Schlussdurchgang
- **Lies:** Konzept 2, 7.0, 7.6, 7.9.
- **Tu:** alle ⓘ-Texte und übrigen Elterntexte gegen S1–S8, Begriffe vereinheitlichen (Einschätzung/Einstufung), Streichliste Rest; Vorher/Nachher-Stichprobe (mindestens 5 Stellen) im Prüfbericht.
- **Tests:** T5, T12, T17 vollständig.
- **Umfang:** S.
