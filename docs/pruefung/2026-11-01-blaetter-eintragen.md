# Übungsblätter eintragen: Nummer, Korrigieren, Verwerfen, Hinweis (01.11.2026)

Peter (31.10.): „Was ist, wenn keines nachgetragen wird, und wie wähle ich ein Blatt von einem anderen Datum aus?“ Plan: Vault-Notiz „Elternbereich – Neuordnung (Vorgabe)“, Punkt 1 einschließlich „Selbst hinterfragt“.

## Umgesetzt

- **Laufende Nummer je Blatt:** steht auf dem Papier („Sheet 3 · Date …“, ebenso auf der Antwortseite und im PDF samt Dateiname) und in der App („Blatt 3 · 28.10.2026“). Zwei Blätter vom selben Tag sind damit unterscheidbar.
- **Liste:** Jedes Blatt ist eine aufklappbare Zeile mit Stand: „noch offen“, „teilweise eingetragen (n/6)“, „eingetragen ✓“ oder – wenn das Blatt nach 14 Tagen noch leer ist – „nicht eingetragen – zählt nicht, ist in Ordnung“. Offene Blätter stehen oben, darin das neueste zuerst. Dasselbe gibt es auf Englisch, das Datum im US-Format.
- **Korrigieren:** Wer sich vertippt, tippt einfach den richtigen Knopf. Der alte Eintrag wird dabei genau zurückgenommen: der Beleg, der Versuch und gegebenenfalls die Wiederholung. Ältere Einträge aus Versionen ohne dieses Protokoll bleiben gesperrt.
- **Zählt auch in der Einschätzung:** Ein eingetragenes Ergebnis zählt jetzt auch in der Einschätzung im Elternbereich als erster Versuch („Mit Hilfe“ = mit Hinweis). Bisher floss es nur in die interne Aufgabenwahl ein.
- **Verwerfen:** Ein Blatt ohne Eintrag lässt sich verwerfen, etwa wenn es nie gedruckt wurde. Es zählt dann einfach nicht.
- **Hinweis in der Übersicht:** Wartet ein Blatt, steht oben ruhig „Blatt 3 · … wartet aufs Eintragen“ bzw. „2 Übungsblätter warten …“. „Jetzt eintragen“ klappt das Kapitel und das Blatt direkt auf. Der Hinweis fehlt bei Lehrkräften und bei Blättern, die älter als 14 Tage sind.
- Neuer Erklärtext in der Kopfbox, DE/EN.

## Prüfung

- `tests/blaetter.test.mjs`, neu bzw. erweitert:
  - Eintragen samt Einschätzung (Versuche);
  - Korrektur hin und zurück: nichts doppelt, Wiederholung passt;
  - alte Einträge bleiben gesperrt;
  - Verwerfen;
  - Hinweis führt direkt zum Blatt;
  - Vermerk nach 14 Tagen, auch auf Englisch;
  - Nummer auf dem Papier.
- `tests/pdf.test.mjs`: Dateiname mit Nummer.
- Gegenproben (alle rot):
  - Korrektur nimmt den Beleg nicht zurück;
  - keine Versuche für die Einschätzung;
  - 14-Tage-Regel verschoben;
  - „Verwerfen“ trotz Eintrag;
  - alte Einträge nicht gesperrt;
  - Wiederholung bleibt nach der Korrektur.
- Sichtprüfung iPad mini (Hinweis, aufgeklapptes Blatt).
- `npm test`: 177 bestanden.
