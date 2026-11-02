# Elternbereich E1: einheitliche Quest-Karte (02.11.2026)

Paket E1 aus `docs/konzept/elternbereich-auftraege.md` (Konzept 5.4, 5.11; Befunde B13, B19).

## Anliegen
Jede Quest-Karte war ein langer Block: Grundlage-Satz („18 erste Versuche an 6 Tagen: 13 selbst gelöst, 3 mit Tipp …“), Tendenz und Aktualität, ein Hinweissatz, dann „So helfen Sie“ mit bis zu acht Absätzen in wechselnder Reihenfolge. Über den Karten standen „Was kann ich hier tun? …“ und eine lange Fokus-Erklärung.

## Umgesetzt
- **Quest-Karte in drei Ebenen** (alle Quests gleich):
  1. **Auf einen Blick:** Name, Kurzbeschreibung, App-Einschätzung und Schul-Einstufung nebeneinander, Etiketten (nächster Schritt, Lücke, braucht Übung).
  2. **Eine Zeile:** „18 Aufgaben · 13 selbst gelöst“ bzw. „Noch nicht geübt“; bei der aktiven Lücke zusätzlich Balken und „noch etwa N Aufgaben“.
  3. **Zum Aufklappen und Handeln:** „💡 So helfen Sie“ · „ⓘ Worauf beruht das?“ · [📄 Übungsblatt] · [Im Fokus].
- **„💡 So helfen Sie“** in festen Teilen und fester Reihenfolge: (Daran hing es) · 🎯 Ziel · ⚠️ Stolperstein (mit „Besser nicht“) · 🏫 So zeigt es die Schule · 💬 Fragen statt erklären · 💡 Ideen für zu Hause; „Grundlage: …“ als graue Fußzeile. Die **Texte sind unverändert**, nur zugeordnet: „Was die Schule erwartet“ → Ziel, „Typische Stolpersteine“ + „Besser nicht“ → Stolperstein, „So zeigt es die Schule“ mit Quelle → So zeigt es die Schule. E2 kürzt sie je Fach. Gibt es Stellen unter „Daran hing es“, ist der Bereich aufgeklappt, sonst wie bisher nur bei „braucht Unterstützung / wird sicherer“.
- **„ⓘ Worauf beruht das?“** als kleine Tabelle: Aufgaben (erster Versuch) mit Tagen, selbst gelöst, mit Hilfe (davon mit Beispiel), Lösungsweg angesehen, Tendenz, Aktualität, wie sicher (mit „Belastbar ab …“), Wiederholungen.
- **Fachansicht:** „Was kann ich hier tun?“ entfällt. Der Fokus steht in einem Satz („Automatisch: die App wählt. Manuell: Sie wählen.“). Die bisherige lange Erklärung steht im neuen ⓘ „Fokus: Automatisch oder Manuell“ (DE/EN), ergänzt um die aktive Lücke und einen Verweis auf „So funktioniert Big Quest“. Die nicht mehr benutzten Texte `howSubj`, `fAutoTxt`, `fManTxt`, `fNote` sind entfernt.
- **Amerikanisches Englisch:** Aus D4 stammten „Keep practising“ und „practises“; korrigiert zu „practicing“ und „practices“, ebenso die neuen Texte („Not practiced yet“).

## Prüfung
- Neu: `tests/elternbereich-e1.test.mjs` (**T16**): In allen Fächern (≥ 15 Karten) hat jede Karte die drei Ebenen. „So helfen Sie“ enthält nur die Teile aus 5.11 in fester Reihenfolge, Ziel, Stolperstein und Ideen immer; die Quelle steht als Fußzeile. Kein „Was kann ich hier tun?“, der Fokus in einem Satz mit ⓘ.
- Angepasst (neue Beschriftungen und Orte, gleiche Inhalte):
  - `sohelfen`: Teile und Reihenfolge; Hilfe-Zahlen in der Tabelle.
  - `elternansicht`: Ebene 2 und Tabelle; Fokus-Satz und ⓘ.
  - `anmeldung`: Sprachprüfung fand die britische Schreibweise.
- Gegenprobe: E1-Test mit der App von `main` rot.
- `npm test`: 353 bestanden.
- Bildschirmfoto einer Karte (aktive Lücke, aufgeklappte Tabelle) mit erfundenen Daten durchgesehen.
