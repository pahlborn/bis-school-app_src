# Elternbereich: Kapitel getrennt, Kinderauswahl, Fokus-Modus, Einstufungen im Konzept (01.11.2026)

Peters Anliegen vom 01.11.:
1. Bedienungshilfe, inhaltlichen Leitfaden und „How Big Quest works“ trennen und sinnvoll zusammenführen. Gehört „Supporting the way class does“ eher zum Konzept?
2. Wie entsteht die Explorer-Einstufung, wie geht es weiter, und nach welcher Formel werden die anderen Einstufungen gebildet?
3. Im Elternbereich fehlt die Auswahl des Kindes.
4. Den Fokus von Automatik auf Manuell und zurück schalten können, mit Erklärung.
5. In der Fachansicht nicht alle Kapitel wiederholen.
6. Die Schulwebseiten gehören unter Quellen.
7. Die Version in Kurzform auf der Anmeldeseite.

## Umgesetzt

- **Kapitel neu geordnet**, je eins pro Art Lesestoff:
  - **🤝 Ihr Kind unterstützen** (inhaltlicher Leitfaden): fünf Regeln, zum Beispiel erst fragen und dann helfen, Fragen statt erklären, Fehler sind normal, kurz und mit Freude. Dazu der Verweis auf die Hilfe bei jeder Quest.
  - **📖 So funktioniert Big Quest** (Konzept): Grundidee, Leitgedanken, Aufbau, Lernlogik, Exkurs, **neu „Helfen wie die Schule“** (das Warum), **neu „Wie die App einstuft“**, Herkunft, Datenschutz, Quellen. Die Schulwebseiten stehen jetzt in den Quellen.
  - **📱 Bedienung & Technik**: Anleitung zum Einrichten, An- und Abmelden und zum Testkind, außerdem die App-Version.
- **Methodenkarten** („So zeigt es die Schule“ mit drei Fragen): jetzt direkt bei den passenden Quests (Runden, Sachaufgaben, Zahlen zerlegen, Meinung/OREO, Anleitung) im Block „💡 So helfen Sie“. Das Warum dahinter steht im Konzept.
- **„Wie die App einstuft“** (DE/EN) mit allen Schwellen:
  - Titel nach Sternen: Explorer ab 0, Investigator 25, Scientist 60, Professor 120, Legend 250;
  - Lernbaum: Stufen nach 1/3/6/10/15/25 Übungstagen;
  - Abzeichen: Silber ab 5, Gold ab 15;
  - interner Stand je Quest (Formel des Schlüssels, Auswirkung auf die nächste Runde);
  - Einschätzung im Elternbereich (8/3, bestätigt 20/5/14, Tendenz ±15 Prozentpunkte, ältere Belege > 21 Tage);
  - Fokus und Wiederholung (1/3/7 Tage).
- **Korrektur:** Eine Wiederholung rückt jetzt nur nach einer Lösung **ohne** Tipp oder Beispiel weiter. Bisher genügte auch eine Lösung nach einem Tipp.
- **Kinderauswahl:**
  - Nutzen mehrere Kinder dieses Gerät (eigenes Passwort hier oder gerade angemeldet), stehen sie in der Kopfzeile als Knöpfe. Das Antippen zeigt deren Daten.
  - Die Anmeldung auf dem Gerät bleibt dabei unverändert.
  - Das Testkonto sieht nur der Admin, Lehrkräfte sehen nur ihre Kinder.
  - Beim Verlassen wird die Auswahl zurückgesetzt.
- **Fokus „Automatisch / Manuell“** in der Fachansicht, jeweils mit Erklärung, was man damit erreicht:
  - Wer in der Automatik einen Schalter tippt, wechselt auf Manuell und behält die bisherige Auswahl.
  - „Automatisch“ übernimmt wieder.
  - Frühere Auswahlen werden einmalig als manuelle Auswahl übernommen.
- **Fachansicht** ohne die Kapitel darunter; die Kapitel stehen nur in der Übersicht.
- **Anmeldeseite:** Version in Kurzform, z. B. „v42“.

## Prüfung

- Neu bzw. erweitert:
  - Kinderauswahl (zwei Kinder auf einem Gerät, Wechsel der Daten, Anmeldung unverändert, Testkonto nur Admin);
  - Fokus-Modus mit Erklärungen, Wechsel per Schalter, zurück zu Automatisch;
  - keine Kapitel in der Fachansicht;
  - Einstufungs-Abschnitt mit Schwellen, ohne Schulbegriffe;
  - Methodenkarten an den Quests (DE/EN);
  - Version auf der Anmeldeseite.
- Angepasst: `anmeldung`, `about`, `eltern`, `elternansicht`, `hilfe`, `info`, `neutral`, `version`.
- Gegenproben (alle rot):
  - Kinderauswahl ohne Wirkung;
  - Testkonto für Eltern;
  - Kapitel in der Fachansicht;
  - Schalter wechselt nicht auf Manuell;
  - Schulwebseiten fehlen in den Quellen;
  - Version fehlt;
  - falscher Schwellenwert im Konzept.
- `npm test`: 191 bestanden.
