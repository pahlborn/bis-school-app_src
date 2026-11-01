# Automatischer Fokus aus den nächsten Schritten der Lehrkraft; Konzept; Datenschutz (01.11.2026)

Peter (01.11.):
- Die Automatik soll die Bewertungen der Schule berücksichtigen („ja, das wäre perfekt“).
- Das Konzept aktualisieren, weil es um Gesichtspunkte geht, die für die App entscheidend sind.
- Alle Datenschutzregeln beachten: keine Namen von Lehrkräften, keine Nennung der Schule, keine Klassenbezeichnung.

## Umgesetzt

- **Unterrichtsthemen aus den Bewertungen:**
  - Jede bewertete Aufgabe nennt die Quests, die die nächsten Schritte der Lehrkraft betreffen (`focusNext`).
  - Die Automatik nimmt die nächsten Schritte der letzten 8 Wochen; gibt es keine so neuen, alle bisherigen. Ohne Bewertungen für ein Kind gilt weiter die von Hand gepflegte Liste.
  - Neue Bewertungen ändern den Fokus damit von selbst. Für Kathie ergibt sich heute dieselbe Auswahl wie bisher: Sachaufgaben, Runden, Zerlegen, Einheiten, Diagramme, Großschreibung, genaue Beispiele, vollständig erledigen.
  - In der Fachansicht heißt die Markierung „nächster Schritt laut Schule“. Bei jeder bewerteten Aufgabe steht „Daraus im automatischen Fokus: …“.
- **Konzept in der App (DE/EN):**
  - Neuer Absatz unter „Grundidee“: Die Aufgaben bauen auf den Bewertungen der Lehrkraft auf; die Einstufungen bestimmen den Schwierigkeitsgrad am Anfang, die nächsten Schritte den Fokus, danach übernimmt die eigene Übung.
  - Fokus-Regel und Texte der Fokus-Erklärung, ⓘ-Hilfe und Anleitung angepasst.
- **Datenschutz:** Die alten Formulierungen mit Namen von Klasse, Schule, Lehrkräften und Orten stehen in der App jetzt nur noch base64-verschlüsselt. Sie werden gebraucht, um alte gespeicherte Wiederholungen beim Anzeigen neutral umzuschreiben, und erst dann entschlüsselt. Kommentare im Code sind neutral formuliert.
  - Im Klartext der App kommen damit weder Schulname noch Klassenbezeichnung, Lehrkräfte oder Plattform vor.
  - Ausnahmen sind nur die Adressen: die Links zu den Schulwebseiten (die Texte sind neutral) und die Adresse der App selbst (`…/bis-school-app/`). Diese steht auch in der Kalender-Erinnerung.
- Das Gesamtkonzept im Vault (Version 3.0) ist auf den Stand v44/v45 gebracht.

## Prüfung

- `tests/schule.test.mjs`: Automatik = nächste Schritte (Sachaufgaben im Fokus, Data Detective nicht), Markierung, Hinweis bei der Aufgabe.
- `tests/kern.test.mjs`: Namen gelten als bewusst entfernt (nur noch verschlüsselt); die Wortliste schützt weiter die öffentliche Hülle.
- Gegenproben (rot): nächster Schritt fehlt; fremdes Thema in der Automatik.
- `npm test`: 194 bestanden.
