# Fokus automatisch (01.11.2026)

Plan: Vault-Notiz „Elternbereich – Neuordnung (Vorgabe)“, Abschnitt „Selbst hinterfragt“ – „Muss der Fokus überhaupt von Hand gesetzt werden? Meist nicht.“

## Umgesetzt

- **Automatisch im Fokus:** Im Fokus steht, was gerade im Unterricht dran ist (Liste von der Lernplattform), dazu jede Quest, bei der die Einschätzung im Elternbereich „Braucht Unterstützung“ oder „Wird sicherer“ ergibt. Die Einschätzung gibt es erst ab 8 ersten Versuchen an 3 Tagen. Der Fokus passt sich damit von selbst an.
- **Abweichen an der Quest:** Mit dem Schalter „Im Fokus“ weicht man von der Automatik ab. Die Quest trägt dann den Hinweis „von Ihnen eingeschaltet/ausgeschaltet“. Gespeichert werden nur die Abweichungen (`focusOn`, `focusOff`).
- **„Automatik wiederherstellen“** nimmt alle Abweichungen zurück. Der Knopf erscheint nur, wenn es Abweichungen gibt.
- **Übernahme alter Auswahlen:** Eine Liste aus einer früheren Version wird einmalig als Abweichungen übernommen. Bestehende Auswahlen bleiben also erhalten.
- Texte (DE/EN) in der Fachansicht, in der ⓘ-Hilfe und in der Anleitung angepasst.
- Die Berechnung läuft nur, wenn sich Daten ändern; die Startseite fragt den Fokus oft ab.

## Prüfung

- `tests/elternansicht.test.mjs`: Eine schwache Quest außerhalb der Unterrichtsthemen ist automatisch im Fokus, ein Unterrichtsthema ebenso. Getestet werden außerdem: Ausschalten und Einschalten samt Hinweis, Zurücksetzen und dass der Knopf nur bei Abweichungen erscheint.
- `tests/eltern.test.mjs`: Der Fokus steuert „Practise Today“, die Fokus-Zeichen und die Übungsblätter. Ein leerer Fokus mischt frei. Eine alte Liste wird einmalig übernommen; „Automatik wiederherstellen“ bringt die Unterrichtsthemen zurück.
- Gegenproben (alle rot):
  - ohne Unterstützungs-Quests;
  - Ausschalten wird nicht gespeichert;
  - Zurücksetzen wirkungslos;
  - alte Liste bleibt liegen;
  - Knopf erscheint immer.
- `npm test`: 177 bestanden.
