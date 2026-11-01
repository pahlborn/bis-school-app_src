# Elternbereich: wessen Daten? (01.11.2026)

Peter (01.11.) hatte sich als „peter“ angemeldet und die Auswertung seiner eigenen Proberunden gesehen, aber keine Testdaten. Er fragte, ob es eine Kinderauswahl braucht.

**Antwort:** Nein. Die Lerndaten liegen nur auf dem Gerät, auf dem geübt wird. Eine Auswahl könnte nur zwischen Kindern wechseln, die auf diesem Gerät geübt haben, und es gibt ein Kind. Das Testkind ist absichtlich nur über die Anmeldung „admin“ erreichbar (Peters Vorgabe, damit nichts durcheinandergeht). Unklar war bisher nur, **wessen** Daten man sieht.

## Umgesetzt

- In der Kopfzeile steht das Kind, dessen Daten man sieht, z. B. „👧 kathie“ bzw. „🧪 test“. Ist kein Kind angemeldet, steht dort „👧 kein Kind auf diesem Gerät“.
- **Ohne angemeldetes Kind** zeigt der Elternbereich keine Übersicht und keine Fachansicht mehr. Die Daten auf einem solchen Gerät stammen nicht vom Kind, sondern etwa aus früheren Proberunden ohne Anmeldung. Stattdessen steht dort ruhig: „Auf diesem Gerät ist kein Kind angemeldet. Den Lernstand sehen Sie auf dem Gerät, auf dem Ihr Kind übt – dort unten „👪 Grown-ups“ antippen.“ (DE/EN)

## Prüfung

- Neu in `tests/anmeldung.test.mjs`: ohne Kind → Hinweis, „kein Kind“ in der Kopfzeile (DE/EN), keine Übersicht. Mit Kind → Name in der Kopfzeile und Übersicht.
- Bestehende Tests melden vor dem Elternbereich das Kind an, wie es im echten Ablauf auf Kathies iPad geschieht.
- Gegenproben (rot): Übersicht trotz fehlendem Kind; Kopfzeile ohne Namen.
- `npm test`: 182 bestanden.
