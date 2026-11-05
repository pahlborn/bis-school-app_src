# Konzept Elternbereich

**Stand:** 02.11.2026, mit Peter abgestimmt. Grundlage `main` v58.
**Umsetzung:** paketweise nach `docs/konzept/elternbereich-auftraege.md`. Jedes Paket startet erst nach Peters „Go“.
**Gilt für:** Elternbereich, ⚙ Einstellungen, ? Hilfe, die Fokus-Logik (Lücken) und alle Elterntexte (DE und EN).

---

## 1. Ziel

Eltern sehen auf einen Blick, wie es um ihr Kind steht, wo es Hilfe braucht und was sie konkret tun können. Jede Information steht an genau einer Stelle, kurz und ohne Fließtext.

Die App ist ein **freiwilliges Zusatzangebot**: Sie soll anregen, Spaß machen und zum Lernen beitragen. Sie erwartet keinen Rhythmus und übt keinen Druck aus.

**Nicht im Umfang:**
- Schwellenwerte der Einschätzung (`assessQuest()`), Lernlogik der Runden außer dem Lücken-Anteil (6.5)
- Konten- und Rechtemodell, Freigabe-Logik, Sicherungsformat, Datenumzug selbst
- Admin-Konzept und Testkinder-Details (eigenes Dokument des Dev-Agenten zur Freigabe; Vorgabe hier nur 5.2)
- Impressum-Inhalt (nur Platzhalter, 5.8)
- Branch `stufe2-p1-krypto` und `src/module/` außer, wo ein Paket es ausdrücklich nennt

---

## 2. Leitregeln

| Nr. | Regel |
|---|---|
| R1 | **Eine Stelle.** Jede Erklärung und Einstellung genau einmal. Andere Stellen verlinken. |
| R2 | **Kind zuerst.** Oben steht der Stand des Kindes. System und Hilfe liegen hinter ⚙ und ?. |
| R3 | **Häufiges sichtbar.** Kinderauswahl, Sprache, Abmelden immer im Kopf. Seltenes (Sicherung, Freigaben, Version, Konten) in ⚙. |
| R4 | **Hinweis statt Dauerzeile.** Hinweise nur, wenn etwas zu tun ist: eine Zeile, höchstens ein Knopf. |
| R5 | **Keine Seitenbeschreibung.** Kein Text beschreibt die Seite, auf der er steht. |
| R6 | **Rollen sauber.** Was jemand nicht darf, erscheint nicht. Die Rechteprüfung in den Handlern bleibt. |
| R7 | **DE und EN gleich** aufgebaut, immer im selben Paket geändert. |
| R8 | **Verweise prüfbar.** Jeder genannte Kapitel- oder Abschnittsname existiert (Test). |
| R9 | **Nur, was Eltern brauchen.** Keine Erklärungen der Oberfläche, keine technischen Hintergründe. Technik nur als Handlung („auf dem Gerät des Kindes sichern“). Erklärungen auf Abruf hinter ⓘ. |
| R10 | **Zeit ist relativ.** Fortschritt in Aufgaben und Runden, nie in Kalenderzeit oder als Frist. Keine Wörter wie „fällig“, „Rückstand“, „verpasst“, „overdue“, „behind“. Pausen nie negativ. Ein **Vorschlag** für einen Rhythmus ist erlaubt (7.1), die App misst ihn aber nie. |
| R11 | **Verantwortung bei den Eltern.** Die App weiß nicht, wer geantwortet hat und mit welchen Hilfsmitteln. Anzeigen sind Hinweise „laut den Antworten in der App“, nie „Ihr Kind kann …“. Automatische Entscheidungen (Fokus, Lücke) können Eltern überstimmen. |

---

## 3. Gesamtstruktur

```
KOPF (immer sichtbar)
👪 Elternbereich · Name | Kind ▾ | 🇩🇪🇺🇸 | ? | ⚙ | Abmelden
(Warnzeile beim Testkind: „🧪 Hier stehen Testdaten“ + [▶ Als Testkind spielen])

ÜBERSICHT
├─ Hinweise (nur wenn zutreffend)
│   ├─ ⚠️ Datenumzug nicht abgeschlossen → [Ansehen] (⚙)
│   ├─ 💾 Neue Übungen seit der letzten Sicherung → [Jetzt sichern]
│   ├─ 📄 Übungsblatt wartet → [Jetzt eintragen]
│   └─ Neu hier? → 📖 Das Konzept von Big Quest
├─ Auf einen Blick (4 Zeilen)
├─ Fächer-Kacheln (App-Einschätzung + 🏫-Punkt) → Fachansicht
├─ Einschätzung (ⓘ) + Farblegende in einer Zeile
└─ Kapitel (zugeklappt)
    ├─ 📖 Das Konzept von Big Quest
    ├─ 🤝 So unterstützen Sie Ihr Kind
    ├─ 🏫 Schulische Einstufungen
    └─ 📄 Übungsblätter

FACHANSICHT (← Alle Fächer)
├─ 🏫 Aus der Schule
├─ 🎯 Fokus: Automatisch / Manuell (ⓘ)
├─ Quest-Karten (3 Ebenen)
└─ Ausblick: Themen für später freischalten

⚙ EINSTELLUNGEN (← Zurück)
├─ 👧 Für <Kind>
├─ 💾 Sicherung & Daten
├─ 🔐 Zugriff & Freigaben
├─ 🛠 Konten (nur Admin)
├─ ℹ️ Über die App
└─ Abmelden

? HILFE (← Zurück, je Rolle eine Fassung)
```

---

## 4. Ist-Stand v58 und Befunde

**Heute:** Kopf mit Name, Kind (Knöpfe), Version, Flaggen, 🧪 Testkind (Admin), Abmelden. Übersicht mit Hinweisen, Dauerzeile Sicherung, „So lesen Sie diese Seite“, Fächern, Einschätzung, Legende. Darunter 8 Kapitel (`renderSheets()`, ca. `index.html:3804`): Einstufungen der Schule, Übungsblätter, Sicherung, Zugriff & Freigaben, (Konten), Für das Kind, Ihr Kind unterstützen, So funktioniert Big Quest (≈ 20 000 Zeichen), Bedienung & Technik (≈ 5 800 Zeichen).

| Nr. | Befund |
|---|---|
| B1 | Willkommen verweist auf „📖 Anleitung & Hintergrund“ / „📖 Guide & background“, das es nicht gibt (`index.html:4119–4120`). |
| B2 | „Aufbau“: „die Eltern legen fest, welche Themen … im Fokus stehen“, seit v45 falsch (`:4539`, EN prüfen). |
| B3 | „Lernlogik“: „Einzelheiten stehen im Elternbereich“, steht im Elternbereich (`:4543`, EN prüfen). |
| B4 | Bedienung & Technik: Kurz- und Langfassung, dazu Sicherung und Freigaben im eigenen Kapitel erklärt (dreifach). |
| B5 | Ein Absatz zählt die Kapitel der Seite auf, auf der er steht. |
| B6 | Hilfe in zwei Stufen und Wiederholung 1/3/7 je dreimal im Konzept-Kapitel. |
| B7 | „Helfen wie die Schule“ wiederholt die erste Regel aus „Ihr Kind unterstützen“. |
| B8 | Sicherung als Dauerzeile und als Kapitel. |
| B9 | Daten, Werkzeuge, Einstellungen, System und Lesestoff gemischt. |
| B10 | Datenschutz und Wichtiger Hinweis stehen in der inhaltlichen Beschreibung. |
| B11 | Interne Schwellen als Fließtext. |
| B12 | Konten und Rechte mehrfach beschrieben (Datenschutz, Freigaben, Bedienung, Admin-Hilfe). |
| B13 | Selbsterklärungen („So lesen Sie diese Seite“, „Was kann ich hier tun?“, lange Fokus-Erklärung, Prosa unter der Legende). |
| B14 | Technische Erläuterungen in Elterntexten (Liste in 7.6). |
| B15 | Testkind als Sonderweg statt Kind in der Auswahl. |
| B16 | Kein Ort für ein Impressum. |
| B17 | Schuldaten getrennt von der Fachansicht, obwohl sie den Fokus bestimmen. |
| B18 | Eine schwache Schul-Einstufung bringt eine Quest **nicht** in den Fokus; sie bestimmt nur die Startschwierigkeit bis 6 Antworten an 2 Tagen (`focusAuto()`, ca. `:2212`). Practise Today verteilt 8 Aufgaben gleichmäßig reihum über alle Fokus-Quests (`buildToday()`, `:2119`). |
| B19 | Quest-Karten in der Fachansicht: langer Grundlage-Satz und „So helfen Sie“ mit bis zu 8 Unterpunkten in Fließtext. |
| B20 | „Einschätzung“ (App) und „Einstufung“ (Schule) werden teils gemischt. |

---

## 5. Aufbau im Einzelnen

### 5.1 Kopf

```
👪 Elternbereich · papa   [Kind ▾]   [🇩🇪][🇺🇸]   [?]   [⚙]   [Abmelden]
```

- **Kinderauswahl:** ein Kind = Anzeige wie heute; ab zwei Kindern Auswahlliste (`<select>`). Beim Wechsel zurück zur Übersicht.
- **Flaggen** bleiben im Kopf.
- **?** und **⚙** öffnen eigene Ansichten (5.6, 5.5).
- **Abmelden** bleibt sichtbar (sonst bleibt die Elternsitzung auf dem Kindergerät offen).
- **Entfällt:** Versionsnummer (→ ⚙ Über die App), Knopf „🧪 Testkind“ (→ 5.2).
- **Warnzeile beim Testkind:** „🧪 Hier stehen Testdaten“, Knopf „▶ Als Testkind spielen“ (heute `playTest()`), ggf. „Zurück zu echten Daten“.
- **320 px:** Flaggen, ?, ⚙ als Symbole mit `aria-label`; die Auswahlliste darf umbrechen.

### 5.2 Testkinder (Vorgabe; Details beim Dev-Agenten)

- Testkonten (`test: true`) erscheinen **nur im Admin-Konto**, dort wie jedes andere Kind in der Kinderauswahl, mit 🧪.
- In keinem anderen Konto (auch nicht Peters Elternkonto, Lehrkraft, Freigabe) erscheinen sie, auch nicht als Hinweis.
- Das Admin-Konto ist ein eigenes Konto, kein Elternkonto (wie heute: `rechte.mjs`, Befund B3 dort). Seine Kinderauswahl: alle Testkinder, darunter echte Kinder nur mit Freigabe (nur lesend).
- Admin-Rechte von v58 nicht erweitern. Schalter, mehrere Testkinder, Rechte bei Testkindern: Dev-Agent schlägt in eigenem Dokument vor.

### 5.3 Übersicht

1. **Hinweise** (R4), in dieser Reihenfolge, nur wenn zutreffend:
   - ⚠️ **Datenumzug nicht abgeschlossen** (heute `migrNote()`): eine Zeile + „Ansehen“ → ⚙ Sicherung & Daten; Text und „Erneut versuchen“ ziehen dorthin.
   - 💾 **Neue Übungen seit der letzten Sicherung** + [Jetzt sichern]: nur wenn seit der letzten Sicherung geübt wurde **und** die letzte Sicherung fehlt oder älter als 30 Tage ist. Die Dauerzeile „Letzte Sicherung …“ entfällt.
   - 📄 **Übungsblatt wartet** (wie heute).
   - **Neu hier? 📖 Das Konzept von Big Quest**: öffnet das Kapitel; erscheint, bis der angemeldete Erwachsene es auf diesem Gerät einmal geöffnet hat.
2. **Auf einen Blick** (5.10).
3. **Fächer-Kacheln** wie heute, zusätzlich ein kleiner 🏫-Punkt mit der schwächsten aktuellen Schul-Einstufung des Fachs (nur wenn Schuldaten da und sichtbar).
4. **Einschätzung** wie heute; „So lesen Sie diese Seite“ entfällt; Farblegende als eine Zeile (Punkt + Wort), der Satz zu „vorläufig/bestätigt“ ins ⓘ.
5. **Kapitel**, zugeklappt: 📖 Das Konzept von Big Quest · 🤝 So unterstützen Sie Ihr Kind · 🏫 Schulische Einstufungen (nur die bewerteten und wartenden Aufgaben chronologisch, je Aufgabe Einstufung, Raster, „Das gelingt“, „Nächste Schritte“) · 📄 Übungsblätter (nicht für Lehrkraft).

### 5.4 Fachansicht

**Oben „🏫 Aus der Schule“** (nur wenn Schuldaten da und für die Rolle sichtbar):
- Standards **dieses Fachs**: Standard, letzte Einstufung mit Datum, vorherige, „übt in der App“ (heute alles in einer Tabelle in `schoolHTML()`).
- Nächste Schritte der Lehrkraft (letzte 8 Wochen) für dieses Fach, mit „Daraus im automatischen Fokus: …“.
- Lücken des Fachs mit Status (offen / aktiv / geschlossen ✓, 6.6).
- Bei „Me as a Learner“: Lernkompetenzen und Learner Profile.
- Ein Satz Herkunft: „Von der Lernplattform übernommen, Stand …“.
- Zuordnung Standard → Fach über das Kürzel wie heute (M- Mathe, E- Englisch, S- Science, sonst Deutsch). Jeder Standard in genau einem Fach.

**Fokus:** ein Satz („Automatisch: die App wählt. Manuell: Sie wählen.“), Einzelheiten hinter ⓘ mit Verweis auf „Das Konzept von Big Quest → Wie die App einstuft“.

**Quest-Karten:** 5.11. „Was kann ich hier tun? …“ entfällt.

### 5.5 ⚙ Einstellungen

Eigene Ansicht mit „← Zurück zur Übersicht“, Abschnitte aufklappbar, Zustand bleibt in der Sitzung.

| Abschnitt | Inhalt | Eltern | Lehrkraft / Freigabe | Admin-Konto |
|---|---|---|---|---|
| 👧 Für <Kind> | Pisolala-Grenze, Kalender-Erinnerung, Profilangaben | ✔ | – | ✔ Testkinder |
| 💾 Sicherung & Daten | Sichern, Zurückspielen, Rückgängig; Datenumzug nur bei Problem, mit „Erneut versuchen“ | ✔ | – | wie `canBackup()` |
| 🔐 Zugriff & Freigaben | Freigeben, laufende Freigaben, Protokoll | ✔ | – | wie `canBackup()` |
| 🛠 Konten | wie heute `accountsAdminHTML()` | – | – | ✔ |
| ℹ️ Über die App | 5.8 | ✔ | ✔ | ✔ |
| Abmelden | Knopf | ✔ | ✔ | ✔ |

Die Überschrift „Für <Kind>“ nennt den Anmeldenamen des gewählten Kindes.

### 5.6 ? Hilfe

Eigene Ansicht mit „← Zurück“, ersetzt „📱 Bedienung & Technik“. Eine Fassung je Rolle (Eltern / Lehrkraft / Admin), Gliederung 7.3. Die ⓘ-Knöpfe an einzelnen Stellen bleiben.

### 5.7 Navigation

- Hash-Routen: `#eltern`, `#eltern/einstellungen`, `#eltern/einstellungen/<kind|sicherung|freigaben|konten|ueber>`, `#eltern/hilfe`.
- Browser-Zurück führt aus ⚙ und Hilfe zur Übersicht.
- Hinweise und Texte springen über diese Routen.

### 5.8 ℹ️ Über die App

1. **Über diese Anwendung** (heutiger Einleitungsabsatz aus „So funktioniert“).
2. **Wichtiger Hinweis** wie heute, ergänzt: „Die App weiß nicht, wer eine Aufgabe gelöst hat und mit welchen Hilfsmitteln. Was sie anzeigt, ist ein Hinweis; die Verantwortung für das Lernen und für Entscheidungen liegt bei den Eltern.“ Derselbe Satz kurz im ⓘ der Einschätzung.
3. **Datenschutz** wie heute ohne Doppelungen: „Konten und Rechte“ auf zwei Sätze mit Verweis auf ⚙ Zugriff & Freigaben. Leseaufnahmen, Kalenderdatei, Google Fonts bleiben. *(05.11.: Schriften sind jetzt eingebettet, der Satz zu Google Fonts ist entfallen.)*
4. **Impressum:** Platzhalter „Wird ergänzt.“ / „To be added.“. Hinweis für später: Falls nötig, muss es ohne Passwort erreichbar sein (öffentliche Anmeldeseite `werkzeug/huelle.html`) und kollidiert mit `werkzeug/verbotene-woerter.txt`. In diesem Umbau nichts an der Hülle ändern.
5. **Version:** Versionsnummer, „Nach neuer Version suchen“.

### 5.9 Rollen

| Element | Eltern | Lehrkraft / Freigabe | Admin-Konto |
|---|---|---|---|
| Kinderauswahl | eigene Kinder mit Daten auf dem Gerät | Kinder mit Freigabe, als „Vorname Nachname (Anmeldename)“, bei gleichem Namen „Vorname Nachname, TT.MM.JJJJ (Anmeldename)“ (Peter, 03.11.: sie muss sehen, mit wem sie arbeitet; 04.11.: Nachname und Geburtsdatum mit Jahr dürfen dazu; Emoji, Einstellungen nie) | Testkinder + Kinder mit Freigabe (mit Namen wie Lehrkraft) |
| Übersicht, Fachansicht | ✔ mit Schaltern | nur lesend | Testkind wie Eltern, sonst lesend |
| Schule (Fachansicht, Kachel-Punkt, Verlauf) | ✔ | nur Umfang „Schuldaten“ | Testkind ✔, sonst nur mit Freigabe |
| Lücken-Knöpfe (6.6) | ✔ | – | Testkind ✔ |
| Übungsblätter | ✔ | – | Testkind ✔ |
| Auf einen Blick | ✔ | ohne „Seit Ihrem letzten Besuch“ | ✔ |
| Das Konzept von Big Quest, So unterstützen Sie Ihr Kind | ✔ | ✔ | ✔ |
| ⚙ Für <Kind>, Sicherung & Daten, Freigaben | ✔ | – | Testkind ✔ |
| ⚙ Konten | – | – | ✔ |
| ⚙ Über die App, ? Hilfe | ✔ | ✔ | ✔ |

### 5.10 Auf einen Blick

Unter den Hinweisen, vor den Kacheln. Je Punkt eine Zeile.

```
┌ Auf einen Blick · mia ──────────────────────────────────────┐
│ 🌱 Seit Ihrem letzten Besuch: 24 Aufgaben, 2 neue Abzeichen │
│ ⭐ Das gelingt: Rounding Road, Time & Numbers               │
│ 🎯 Daran arbeiten wir: Number Combinations (Lücke ▓▓▓░░)    │
│ 💡 Idee für zu Hause: „Wie viele Wege findest du für 500?“  │
│                                    [Mehr dazu → Maths]      │
└─────────────────────────────────────────────────────────────┘
```

- **🌱 Seit Ihrem letzten Besuch:** Aufgaben, neue Abzeichen, neuer Titel, „Lücke geschlossen ✓“. Letzter Besuch je Erwachsenem gespeichert. Ohne neue Übung: „Seit Ihrem letzten Besuch wurde nicht geübt – das ist in Ordnung.“ Beim ersten Besuch entfällt die Zeile.
- **⭐ Das gelingt:** bis zu 2 zuletzt geübte Quests mit „Sicher“ oder „Darüber hinaus“; sonst entfällt die Zeile.
- **🎯 Daran arbeiten wir:** aktive Lücke mit Balken, sonst das erste aktuelle Klassenthema im Fokus.
- **💡 Idee für zu Hause:** eine Idee aus „So helfen Sie“ dieser Quest, bei jedem Besuch die nächste.
- **Mehr dazu** öffnet die Fachansicht.

### 5.11 Quest-Karte

Alle Quests gleich, drei Ebenen:

```
┌ Rounding Road ─────────────────────────────────────────────────┐
│ App: ● Wird sicherer   Schule: ● Consolidating (12.10.)  🎯 Lücke │  Ebene 1
│ Auf Zehner und Hunderter runden.                                │
│ 18 Aufgaben · 13 selbst gelöst · ▓▓▓░░ noch etwa 8 Aufgaben       │  Ebene 2
│ ▸ 💡 So helfen Sie   ▸ ⓘ Worauf beruht das?   [📄] [Im Fokus]   │  Ebene 3
└──────────────────────────────────────────────────────────────────┘
```

- **Ebene 1:** App-Einschätzung und Schul-Einstufung nebeneinander; Fokus-Grund als Etikett (alle zutreffenden): „nächster Schritt laut Schule“, „Lücke laut Schule (Datum)“, „Einschätzung: Unterstützung“.
- **Ebene 2:** „18 Aufgaben · 13 selbst gelöst“ (statt des heutigen Grundlage-Satzes); bei aktiver Lücke Fortschritt in Aufgaben. Nicht geübt: „Noch nicht geübt“.
- **Ebene 3a „💡 So helfen Sie“**, immer diese Teile, in dieser Reihenfolge:

| Teil | Umfang | Aus heute |
|---|---|---|
| (Daran hing es) | nur bei echten Fehlern | „Daran hing es“ |
| 🎯 Ziel | 1 Satz | „Was die Schule erwartet“ |
| ⚠️ Stolperstein | 1–2 Stichpunkte, inkl. „Besser nicht“ | „Typische Stolpersteine“, „Besser nicht“ |
| 🏫 So zeigt es die Schule | 1 Satz | „So zeigt es die Schule“ + „Unterrichtsaufgabe …“ |
| 💬 Fragen statt erklären | 3 Fragen | „Fragen statt erklären“ |
| 💡 Ideen für zu Hause | 2 Stichpunkte | „Ideen für zu Hause“ |

  „Grundlage: … Common Core …“ als graue Fußzeile. Texte werden umsortiert und gekürzt, nicht neu erfunden.
- **Ebene 3b „ⓘ Worauf beruht das?“:** erste Versuche, mit Tipp, mit Beispiel, gezeigt, Tendenz, vorläufig/bestätigt, ältere Belege als kleine Tabelle.

---

## 6. Fokus und Lücken (Didaktik)

### 6.1 Ausgangslage
Die Schule bewertet ein Thema einmal und geht weiter; alte Themen werden nicht neu eingestuft. Wer eine Lücke hat, gerät ins Hintertreffen, vor allem wenn das neue Thema darauf aufbaut. Die App führt den Nachweis deshalb selbst. Heute fehlt das (B18).

### 6.2 Begriff
Ein **Standard** ist eine **Lücke**, wenn seine letzte Schul-Einstufung „Requires support“ (`RS`, auch `N`) oder „Consolidating“ (`C`) ist und er **Hauptstandard** (erster Eintrag in `STANDARDS[k]`) mindestens einer Quest ist. Zur Lücke gehören **alle Quests mit diesem Hauptstandard**.

*Entscheidung Peter, 02.11. (B, umgesetzt in D1b):* Lücke je Standard statt je Quest. Mit den echten Daten wurden aus 10 Lücken je Quest 7 je Standard; derselbe schwache Standard muss so nicht mehrmals „geschlossen“ werden.

### 6.3 Ende
Eine Lücke ist **geschlossen**, wenn eines davon eintritt:
1. Die App schätzt **eine** der Quests der Lücke als „Sicher“ oder „Darüber hinaus“ **und „bestätigt“** ein (heutige Schwellen in `assessQuest()`: 20 erste Versuche an mindestens 5 Übungstagen; Klassenniveau mindestens 6 Antworten, 80 %, richtig an 3 Übungstagen). Vorläufig reicht nicht. *(Peter, 03.11., Auftrag 2: die frühere Bedingung „über mindestens 14 Kalendertage“ entfällt – sie misst Zeit, nicht Lernen; den Abstand prüft schon „richtig an 3 Übungstagen“.)*
2. Eine neuere Schul-Einstufung dieses Standards ist mindestens „Meeting“ (`M`/`E`).
3. Eltern markieren sie als geschlossen (6.6).

**Geschlossen bleibt geschlossen** (Zeitpunkt, auslösende Einstufung und schließende Quest je Kind und Standard speichern). Fällt die App-Einschätzung später ab, greift der normale Fokus über „braucht Unterstützung / wird sicherer“. Eine **neuere** schwache Schul-Einstufung öffnet die Lücke wieder. Eine Lücke endet nie durch Zeit.

### 6.4 Eine aktive Lücke
Höchstens **eine** Lücke ist aktiv (mit all ihren Quests); die anderen warten. Reihenfolge:
1. `RS` vor `C`
2. älteste Einstufung zuerst

Aktiv wird die erste Lücke in dieser Reihenfolge, **die etwas Neues bringt**: Eine Lücke, deren Quests alle ohnehin aktuelle Themen sind (nächster Schritt der Lehrkraft oder „braucht Übung“ in der App), wird übersprungen, weil sie schon geübt wird. Sind alle Lücken so abgedeckt, ist die erste aktiv; sie schließt sich weiter, sobald eine ihrer Quests bestätigt sicher ist. Eine von Eltern gewählte Lücke gilt immer. *(D3, Peter 02.11.: „wir versuchen es“. Die Liste der Voraussetzungen wurde nicht freigegeben, Entwurf in `docs/konzept/voraussetzungen-entwurf.md`.)*

Eltern können eine wartende Lücke „jetzt angehen“; sie wird aktiv, die bisher aktive wartet, Fortschritt bleibt erhalten. Wartende Lücken sind nicht im Fokus.

Begründung (in Runden, R10): Bei 2 Lücken-Aufgaben pro Runde braucht eine aktive Lücke etwa 10 Runden bis 20 erste Versuche; drei gleichzeitig je etwa 30 Runden, und keine schließt vorher. Nacheinander ist nicht langsamer, und jede geschlossene Lücke ist ein sichtbarer Erfolg. Üben in der Quest außerhalb von Practise Today zählt mit.

### 6.5 Anteil in Practise Today und Übungsblatt
- `focusAuto() = uniq( classTopics() ∪ need ∪ activeGapQuests() )`.
- Practise Today: zwei Spuren. **Aktuelle Themen** (`classTopics() ∪ need`) bleiben vorn; aus den Quests der **aktiven Lücke**, soweit sie nicht ohnehin in den aktuellen Themen liegen, zusammen höchstens **2 von 8** Aufgaben. Gibt es keine aktuellen Themen, füllt die Lücke die Runde.
- In der Lücken-Spur erst eine Grundlage-Aufgabe, dann Klassenniveau.
- Übungsblatt: höchstens 1/4 der Aufgaben aus der aktiven Lücke.
- Schwierigkeit unverändert: Startwert aus der Schule bis 6 Antworten an 2 Tagen, danach eigene Übung.
- Manuell bleibt unberührt; beim Wechsel nach Manuell wird die aktuelle Auswahl übernommen (wie `setFocusMode`).
- `cleanFocus()` gilt: archivierte, gesperrte Ausblick- und Mix-Quests nie im Fokus.
- Die Einschätzung im Elternbereich beruht weiter nur auf eigener Übung.

### 6.6 Für Eltern
- Etikett „Lücke laut Schule (Datum)“, Fortschritt als Balken und „noch etwa N Aufgaben“ (nie Tage als Frist). Seit Auftrag 2 (03.11.) zeigt der Balken alle drei Bedingungen aus 6.3 (erste Versuche, Übungstage, „Sicher“ auf Klassenniveau) und ist erst voll, wenn alle erfüllt sind; der Text nennt, was als Nächstes fehlt („noch etwa 8 Aufgaben“, „noch 3 Aufgaben auf Klassenniveau richtig“, „noch an 2 Übungstagen“, „noch an einem weiteren Übungstag richtig“).
- Nach dem Schließen „Lücke geschlossen ✓ (Datum)“, bleibt im Block „Aus der Schule“ beim Standard.
- Knöpfe (nur Eltern): „Weiter üben“ (hält eine von der App geschlossene Lücke aktiv, bis Eltern sie schließen), „Als geschlossen markieren“, „Jetzt angehen“. Mit Vermerk „von Ihnen …“ und Datum.
- Ehrlicher Satz im Konzept-Kapitel: „Bestätigt sicher heißt: sicher bei den Antworten in der App. Wer geantwortet hat und mit welchen Hilfsmitteln, weiß die App nicht; ob die Aufgaben den Standard so abdecken, wie die Schule ihn prüft, ist je Thema verschieden.“

### 6.7 Voraussetzungen
Nicht eingebaut. Der Entwurf „Quest A setzt Quest B voraus“ (Mathe) wurde Peter am 02.11. vorgelegt und nicht freigegeben; er liegt in `docs/konzept/voraussetzungen-entwurf.md`. Stattdessen gilt das Überspringen aus 6.4.

### 6.8 Prüfung mit echten Daten
Lokal mit den echten Schuldaten prüfen, im Prüfbericht nur Zahlen nennen: Anzahl offener Lücken, welche Quest zuerst aktiv wird. Bei mehr als 6 offenen Lücken melden, nicht selbst begrenzen.

---

## 7. Texte

### 7.0 Schreibregeln (alle Elterntexte, ⓘ, Hilfe, Über die App; DE und EN)

| Nr. | Regel |
|---|---|
| S1 | Kern zuerst; Begründung danach oder hinter ⓘ. |
| S2 | Sätze höchstens ca. 20 Wörter, Absätze höchstens 3 Sätze. |
| S3 | Ab drei Punkten eine Liste; Zahlen und Schwellen als Tabelle. |
| S4 | Ein Thema je Aufklapper; die Überschrift sagt, was drin ist. |
| S5 | Keine Klammerketten, keine verschachtelten Einschübe. |
| S6 | Positiv, ohne Druck (R10): „noch nicht geübt“, „noch etwa 8 Aufgaben“. |
| S7 | Feste Begriffe (7.9). |
| S8 | Gleiche Symbole bedeuten überall dasselbe: 🎯 ⚠️ 🏫 💬 💡 ⓘ. |

### 7.1 🤝 So unterstützen Sie Ihr Kind
- Oben **„Unser Vorschlag“**: „Lieber oft kurz als selten lang: zum Beispiel 2–3 Runden pro Woche, je etwa 10 Minuten. Verteiltes Üben wirkt besser als viel auf einmal.“ (Beleg: IES Practice Guide, steht in den Quellen.) Falls Antworten Zeitstempel haben: „Eine Runde dauert bei Ihrem Kind zurzeit etwa X Minuten.“ Verweis auf die Kalender-Erinnerung in ⚙. Nicht in „Auf einen Blick“, nie gemessen.
- Die fünf Regeln bleiben; die erste nimmt den Kernsatz aus „Helfen wie die Schule“ auf; der letzte Punkt verweist auf „💡 So helfen Sie“.

### 7.2 📖 Das Konzept von Big Quest
Höchstens 7 000 Zeichen ohne Quellen. Gliederung:
1. **Grundidee** (mit Leitgedanken, gekürzt; Fokus aus nächsten Schritten **und** Lücken).
2. **Aufbau** (Fächer, Practise Today, Übungsblätter; Fokus korrekt, B2).
3. **So lernt das Kind** (ersetzt Lernlogik und Exkurs; B3 streichen): drei Stufen · falsche Antwort → Hinweis → zweiter Versuch → Lösungsweg → Brücke · Hilfe in zwei Stufen + Beispiel · Wiederholung nach 1, 3 und 7 Tagen · Ausnahmen als Liste. Jede Regel einmal.
4. **Helfen wie die Schule:** nur das Warum, höchstens 3 Sätze, Patall 2008, Maloney 2015.
5. **Wie die App einstuft:** Kurzfassung in 5 Zeilen; „Lücken schließen“ (6.2–6.6 in Elternsprache, mit dem ehrlichen Satz); darunter zugeklappt „Genaue Schwellen“ mit dem heutigen Inhalt (ohne Wiederholung, steht in 3).
6. **Herkunft der Aufgaben** (unverändert).
7. **Quellen** (7.4).

Über diese Anwendung, Wichtiger Hinweis und Datenschutz stehen in ⚙ Über die App. Die Kinderseite nutzt dieselben `aboutParts`; die Kürzungen gelten dort mit, Datenschutz und Hinweis bleiben für das Kind sichtbar (prüfen, im Prüfbericht nennen).

### 7.3 ? Hilfe
Eltern, höchstens 2 000 Zeichen:
1. Einmal einrichten (Safari, Familienpasswort, Zum Home-Bildschirm, künftig übers Symbol)
2. Anmelden und Passwort (Startcode / Startlink / QR, eigenes Passwort, Passwortspeicher)
3. Kind anmelden (Startcode, Merkpasswort, Geschwister unter „Who's here?“)
4. Nachsehen am Gerät des Kindes – **danach abmelden**
5. Sichern: einmal im Monat auf dem Gerät des Kindes → Link ⚙
6. Freigaben: Lehrkraft nur mit Freigabe → Link ⚙
7. Passwort vergessen (Startcode gilt weiter, sonst Admin; 5 Fehlversuche = 30 s warten; nichts weitergeben)

Lehrkraft und Admin entsprechend, nur ihre Punkte.

### 7.4 Quellen
Alle bleiben (internationale Schule, internationale Lernprogramme). Einleitungssatz wie heute, dann zugeklappte Gruppen:
1. Forschung zu Lernen, Feedback und Hilfe (Vermerke „bibliografisch geprüft“ bleiben)
2. IB und Schule (IB PYP, IB Copyright, Website der Schule)
3. Lehrpläne zum Vergleich (SFUSD, Common Core, California, NGSS, LehrplanPLUS, England, Cambridge, IES Lesen)
4. Lernprogramme und Materialien (Duolingo, Sofatutor, Bettermarks, Prodigy, Diagnostic Questions, youcubed, Grundschulkönig, BBC Dance Mat, TypingClub, Typing.com)
5. Technik und Datenschutz (H5P, ts-fsrs, SurveyJS, MDN ×2, ICO Children’s Code)
6. Nicht öffentliche Quellen (Absatz wie heute)

Zahl der Links bleibt gleich; Zweifelsfälle im Prüfbericht.

### 7.5 Willkommen
„Die Anleitung finden Sie oben unter **?**, Sicherung und Freigaben unter **⚙**.“ EN entsprechend.

### 7.6 Streichliste
**Selbsterklärungen:** „So lesen Sie diese Seite …“ · „Was kann ich hier tun? …“ · lange Fokus-Erklärung (→ ⓘ) · Prosa unter der Legende (→ ⓘ) · Kapitel-Aufzählung in der Hilfe · Beschreibung der Kinderseite in der Elternhilfe.

**Technik:** eigener Speicher der Home-Bildschirm-App (nur die Handlung bleibt) · „Abgleich … in Vorbereitung / mit Stufe 2“ · „Neue Versionen lädt die App … selbst“ · „älteres, kürzeres Passwort wird neu abgefragt“ · „Face ID oder Touch ID füllt es aus“ · „veränderte Datei … nimmt die App nicht an“ · Kennungen und Prüfwerte außerhalb von Datenschutz.

Jede Streichung im Prüfbericht (alt → neu).

### 7.7 Verweise
Alle Texte mit „Bedienung & Technik“, „Sicherung“, „Zugriff & Freigaben“, „Testkind“, „Anleitung“ (Kurzanleitung, ⓘ, Login-Hilfe, Willkommen, Kinderhilfe) auf die neuen Orte umstellen:
```
grep -n "Bedienung & Technik\|Using the app\|Zugriff & Freigaben\|Access & grants\|Sicherung\|Backup\|Anleitung\|Testkind\|Test child" index.html
```

### 7.9 Begriffe

| Begriff | Bedeutung | Nicht verwenden |
|---|---|---|
| Einschätzung | Stand aus den Antworten in der App | Bewertung, Note, Stufe, „Ihr Kind kann“ |
| Einstufung | Bewertung durch die Lehrkraft | Einschätzung der Schule |
| Quest | ein Thema in der App | Welt, Modul |
| Fokus | was Practise Today und das Übungsblatt bevorzugen | Schwerpunkt, Priorität |
| Lücke | Quest mit schwacher Einstufung, bis geschlossen (6.3) | Defizit, Rückstand |
| Aufgabe | eine Frage in der App | Item, Versuch (außer in ⓘ) |
| Übungstag | Tag mit mindestens einer Antwort | – |

---

## 8. Tests

Betroffene Tests vorher ermitteln:
```
grep -ln "psec\|data-psec\|Bedienung\|Using the app\|pVersion\|pPlayTest\|data-pkid\|testUserFor\|Testkind\|focusAuto\|buildToday" tests/
```

| Nr. | Prüft |
|---|---|
| T1 | Kopf: Kind, Flaggen, ?, ⚙, Abmelden auf 320 px sichtbar; keine Version, kein Testkind-Knopf. |
| T2 | ⚙ zeigt je Rolle genau die Abschnitte aus 5.5; Gegenproben Lehrkraft/Eltern. |
| T3 | Hash-Routen öffnen die richtige Ansicht; Browser-Zurück führt zur Übersicht. |
| T4 | Hinweise: Datenumzug nur bei Fehler, „Erneut versuchen“ nur in ⚙; „Neu hier?“ verschwindet nach erstem Öffnen, je Erwachsenem. |
| T5 | Jeder Kapitel-/Abschnittsname in „…“ in Eltern-, Hilfe-, ⓘ-Texten (DE/EN) existiert; Gegenprobe „Anleitung & Hintergrund“ rot. |
| T6 | Kernsätze („nach 1, 3 und 7 Tagen“, „keinen zweiten Weg“) je Sprache genau einmal im Elternbereich. |
| T7 | Längen: So funktioniert ≤ 7 000 Zeichen ohne Quellen, Hilfe ≤ 2 000 je Rolle (Richtwerte). |
| T8 | Kapitelreihenfolge wie 5.3. |
| T9 | Quellen: Linkzahl vorher = nachher (DE/EN), 6 Gruppen, zugeklappt. |
| T10 | Testkinder nur im Admin-Konto; nie bei Eltern, Lehrkraft, Freigabe, auch nicht im Seitentext. |
| T11 | Über die App: alle fünf Teile; Datenschutz nicht mehr in „So funktioniert“. |
| T12 | Sätze der Streichliste kommen nicht mehr vor (DE/EN). |
| T13 | „Aus der Schule“ nur Standards des Fachs, jeder Standard in genau einem Fach; Lehrkraft ohne „Schuldaten“ sieht keinen Block, Punkt, Verlauf; Fokus-Etikett = `focusAuto()`. |
| T14 | Lücken: RS/C → Lücke; Ende nur nach 6.3 (bestätigt sicher, neuere Einstufung ≥ M, Eltern); vorläufig sicher schließt nicht; geschlossen bleibt geschlossen; neuere schwache öffnet wieder; nur eine aktiv, Reihenfolge 6.4; höchstens 2 von 8 in Practise Today; Übungsblatt ≤ 1/4; Manuell unberührt; gesperrte Quests nie; Schwierigkeit unverändert. Gegenprobe: Regel aus → rot. |
| T15 | Auf einen Blick: Zählung seit letztem Besuch je Erwachsenem; Satz ohne Übung; Idee wechselt; Lehrkraft ohne erste Zeile. |
| T16 | Quest-Karte: Ebenen 1–3; „So helfen Sie“ nur die Teile aus 5.11 in fester Reihenfolge. |
| T17 | Zeitwörter („fällig“, „Rückstand“, „verpasst“, „overdue“, „behind“) kommen in Elterntexten nicht vor; Lücken-Fortschritt in Aufgaben. |
| T18 | Sicherungs-Hinweis fehlt, wenn seit der letzten Sicherung nicht geübt wurde. |
| T19 | Eltern-Knöpfe an Lücken wirken und werden vermerkt; Lehrkraft sieht keine; kein „Ihr Kind kann“ / „your child can“ als Aussage der App. |

`npm test` vollständig grün, Gegenproben im Prüfbericht.

---

## 9. Veröffentlichen
Bauen und Veröffentlichen: siehe `docs/veroeffentlichen.md` (jeder Agent auf Peters Rechner nach Peters ausdrücklicher Freigabe; der Schlüssel liegt DPAPI-geschützt auf seinem Rechner, Cloud-Agenten bauen nur zur Probe; Notzugang mit dem Familienpasswort).

## 10. Offen
- **Impressum:** später (5.8).
- **Admin-Konzept:** Dev-Agent, eigenes Dokument zur Freigabe (5.2).
