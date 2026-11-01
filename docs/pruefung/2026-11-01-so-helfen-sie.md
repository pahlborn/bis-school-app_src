# „So helfen Sie“ je Quest, „Daran hing es“, Blatt zu einem Thema (01.11.2026)

Peter (01.11.): „Umsetzen, Reviews erfolgen später“ – geprüft wird im Praxistest mit Kind, Mutter und gegebenenfalls Lehrkraft. Die Inhalte stammen aus der Vault-Notiz „So helfen Sie – Inhalte je Quest (zum Gegenlesen)“.

## Umgesetzt

- **„💡 So helfen Sie“ an jeder Quest mit Einschätzung** (14 Quests mit Standard und „Finish Every Task“), in vier Teilen:
  - was die Schule erwartet,
  - typische Stolpersteine,
  - Ideen für zu Hause,
  - was man besser lässt.

  Dazu kommt die Grundlage. Deutsch und sinngemäßes amerikanisches Englisch. Die Erwartungen stammen aus den Standards und Bewertungsrastern der Schule, nicht aus Rückmeldungen zum Kind.
- Der Block ist **zugeklappt**. **Aufgeklappt und orange hervorgehoben** ist er nur bei „Braucht Unterstützung“ oder „Wird sicherer“.
- Quests ohne Einschätzung behalten ihren bisherigen kurzen Tipp.
- **„Daran hing es“:** bis zu zwei Aufgaben der Quest, die zur Wiederholung offen sind, mit der richtigen Lösung. Die App merkt sich jetzt bei jedem Versuch, zu welcher Aufgabe er gehört (`qid`). Damit erscheint auch die **erste Antwort** des Kindes; das gilt für Versuche ab dieser Version.
- **„📄 Übungsblatt nur zu diesem Thema“** direkt an der Quest. Es öffnet den gewohnten Dialog (PDF/Druck), das Blatt erscheint danach in der Liste. Lehrkräfte sehen die Hilfe, aber nicht den Knopf.

## Prüfung

- Neu `tests/sohelfen.test.mjs` (4 Tests):
  - Hilfe-Inhalte vollständig (DE/EN, je 5 Teile) für alle Quests mit Einschätzung;
  - offen und hervorgehoben bei Unterstützungsbedarf, sonst zu; alle Abschnitte DE/EN; passt aufs Telefon;
  - „Daran hing es“ nach einem echten Fehlversuch, mit Lösung und erster Antwort;
  - Blatt zu einem Thema: nur Aufgaben dieses Themas, danach wartet es aufs Eintragen.
- Erweitert `tests/anmeldung.test.mjs`:
  - Lehrkraft sieht die Hilfe, aber keinen Blatt-Knopf;
  - Sprachprüfung erlaubt die deutschen Beispielsätze der Deutsch-Quest auch in der englischen Fassung.
- Gegenproben (alle rot):
  - nie aufgeklappt;
  - keine Aufgabenkennung im Versuch;
  - Blatt ignoriert das Thema;
  - Blatt-Knopf für Lehrkräfte;
  - Hilfe für eine Quest fehlt.
- Sichtprüfung iPad mini.
- `npm test`: 181 bestanden.
