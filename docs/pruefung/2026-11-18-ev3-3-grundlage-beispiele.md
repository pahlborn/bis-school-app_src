# EV-3.3 · Ausgearbeitete Beispiele für Grundlage-Aufgaben

Auftrag `BQ-2026-0005-EV33-DEV-20261118-A1`, 18.11.2026. Produktquelle ausschließlich `pahlborn/bis-school-app_src`; Basis `main@86ce3930b8e6972ed60db3d0877d3e511efd3764`. Nativer Entwicklungsworker, kein Claude-/Forge-Lauf. Zweig `feature/ev3-3-grundlage-beispiele-20261118`.

## Anliegen

EV-3.3 und D4 erlauben nach dem Tipp ein passendes anderes Grundlage-Beispiel mit Lösungsweg. Die eigene Aufgabe bleibt offen. Ein anschließender Erfolg zählt als mit Hilfe. Auf Stufe 1 heißt die Überschrift neutral „Ein Beispiel“ / „An example“.

Die fünf Pflichtquellen wurden auf dieser Basis in Auftragsreihenfolge gelesen: Auftrag an Atlas, Zusammenfassung, Epics, Übernahmekonzept und Atlas-Abgleich vom 17.11. Maßgeblich sind EV-3.3, die gemeinsame DoD und Auftrag §§5–8. Die frühere pauschale Ausnahme aus Auftrag 1 ist durch D4 überholt.

## Umgesetzt

`src/module/grundlage-beispiele.mjs` enthält 40 ausgearbeitete Textfälle und die begrenzte Beispielauswahl. Die fünf bestehenden Zahlen-/Bildgeneratoren bauen für Beispiele ihre jeweilige Familie erneut, mit anderen konkreten Werten. Eine lokale, deterministische Ziehung prüft höchstens 24 Kandidaten. Ein identischer fachlicher Stimulus (Prompt plus Bild/Zahlenmodell) wird verworfen. Neu gemischte Antwortoptionen allein machen kein anderes Beispiel. Numerische Beispiele haben zusätzlich ein anderes Ergebnis. Bei Kategorien wie Satzzeichen oder Einheiten darf dasselbe Antwortwort im anderen konkreten Fall vorkommen.

Uhr-Minuten, Sprungrichtung/-weite, Stellenwertschritt mit mehr/weniger und kürzer/länger bleiben erhalten. Die neue Familienkennung ändert `qId` nicht. Rundenbau, Stufenauswahl und Lernbuchung behalten ihre vorhandenen Regeln. Der bestehende höhere Beispielpfad behält seine strengere Prüfung auf ein leichteres Beispiel und einen anderen Antwortstring. Andere Grundlagepfade ohne diese Familienkennung bleiben beim bisherigen Verhalten.

Die Beispiele verwenden die vorhandenen Schulmodelle: Stellenwerttafel, Uhr, Zahlenstrahl, Punktepaare, Ganzes und Teile, Maßband, Längenstreifen, Balkendiagramm und Strichliste. Der vorhandene Tipp-/Beispiel-/Antwortpfad bleibt zuständig; das Beispiel schreibt keinen Erfolg, sperrt keine Antwort und löst die eigene Frage nicht.

### Familien- und Questmatrix

Die Nummern sind die nullbasierten `foundationFamily`-Werte. Alle 62 Familien haben ein Beispiel; **keine Lernnutzen-Ausnahme** ist erforderlich. Die Textfälle wenden auch reine Fakten/Regeln an einer anderen konkreten Situation an.

| Quest | Tatsächlich vorhandene Familien | Beispielweg und Nachweis | Ausnahme |
|---|---|---|---|
| numbers | 0 Stellenwerttafel lesen; 1 volle/halbe Uhrzeit; 2 ein Sprung +10/+5/−10; 3 10/100 mehr/weniger; 4 gerade/ungerade; 5 größere Zahl | Gleicher Generator mit anderen Zahlen/Bild; Minuten und Rechenschritt erhalten. Node-Orakel für Stellenwerte, Uhrzeiger, Rechnung und Punkte; Browsermatrix 6/6 | keine |
| combos | 0 zwei Hunderterteile zum Ganzen; 1 fehlender Hunderterteil; 2 Hunderter addieren; 3 Zehner bis 100 ergänzen; 4 Hunderter wegnehmen | Ganzes-und-Teile-Modell mit anderen Werten und erklärter Rechnung; unabhängige Rechenorakel; Browsermatrix 5/5 | keine |
| wordprob | 0 dazubekommen; 1 fehlender Teil im Kasten; 2 Ganzes erkennen; 3 Wegnehmen als Rechnung wählen | Andere erfundene Situation/Werte, gleiche Frageart; Ganzes/Teile bzw. passende Rechenart; Browsermatrix 4/4 | keine |
| forces | 0 Schieben; 1 Ziehen; 2 rau; 3 weiter rollen; 4 Reibung bremst; 5 Strecken vergleichen; 6 fairer Test; 7 Schwerkraft | Einkaufswagen, Schlitten, Ziegel/Fenster, Tablett/Handtuch, Schnee, andere Strecken, Balltest, fallender Apfel; jeweils Bewegung/Ursache/Prüfschritt erklärt; Browsermatrix 8/8 | keine |
| units | 0 Maßband ablesen; 1 cm/m; 2 g/kg; 3 1 m mit cm vergleichen | Anderer Pfeil/Gegenstand/Längenwert; Größenart und Vergleichsrichtung bleiben erhalten; Bild-/Einheitenorakel; Browsermatrix 4/4 | keine |
| graphs | 0 Balken ablesen; 1 höchsten Balken finden; 2 Strichliste zählen | Andere Daten bzw. Strichliste, gleiches Modell; unabhängige SVG-Geometrie-/Zählorakel; Browsermatrix 3/3 | keine |
| sentences | 0 Satzanfang; 1 Name groß; 2 Fragezeichen; 3 Punkt; 4 Satzabschluss; 5 Wochentag; 6 Ort; 7 I | Andere Vogel-/Reise-/Lesesätze; erster Buchstabe, Name oder Satzfunktion wird ausdrücklich geprüft und verbessert; Browsermatrix 8/8 | keine |
| words | 0 Stamm nach un-; 1 Stamm vor -ful; 2 Präfix re-; 3 Suffix -ness; 4 Mehrzahl -s; 5 un- anfügen; 6 Präfix erkennen; 7 un- bedeutet nicht | unkind, playful, replay, darkness, dogs, untie, reread, unfair; Zerlegen/Anfügen und Bedeutung erklärt; unabhängige Wortbildungsorakel; Browsermatrix 8/8 | keine |
| anleitung | 0 erster Satzanfang; 1 Man-Form; 2 nächster Satzanfang; 3 Vorsilbe erkennen; 4 Vorsilbe am Satzende; 5 nötige Schritte; 6 Zusammensetzung mit Artikel; 7 erster Handlungsschritt | Falten, Farbe rühren, zumachen, aufräumen, Händewaschen, Haustür, Ausschneiden; Lösungsweg auf Deutsch; Browsermatrix 8/8 | keine |
| library | 0 Signatur am Rücken; 1 Videoquelle; 2 recherchierbare Frage; 3 geprüfte Fakten; 4 Kindersuche; 5 Quelle notieren; 6 Signatursortierung; 7 Forschungsfrage zuerst | Anderer konkreter Regal-/Pflanzen-/Ameisen-/Planeten-/Gesteins-/Weltraum-/Eisfall; Auswahl nach Zweck, prüfbarer Tatsache bzw. Reihenfolge erklärt; Browsermatrix 8/8 | keine |

### Eng begrenzte Präzisierungen bestehender Erklärungen

Weil dieselben Generatoren nun ausgearbeitete Beispiele liefern, wurden drei vorhandene Erklärungstypen präzisiert. Das wirkt auch bei der bestehenden eigenen Zahlenaufgabe:

1. Zahlenstrahlsprung: Start, Richtung und Sprungweite werden vor der richtigen Gleichung genannt.
2. Zehner bis 100 ergänzen: Die gezählten Zehnerschritte und die Prüfung der Summe stehen im Lösungsweg.
3. 10/100 mehr/weniger: Der falsche Satz „Only the tens/hundreds digit changes“ entfällt. Bei 190 + 10 = 200 und 200 − 10 = 190 ändern sich mehrere Ziffern. Erklärung und Tipp nennen stattdessen einen Zehner/Hunderter und die Stellenwerttafel, gegebenenfalls über die Hundertergrenze. Keine neue Rechenmethode, keine andere Schwierigkeitsregel.

## Prüfung

Lokale Umgebung: Node **24.22.1**, npm **11.9.0**, Playwright **1.56.1**, Chromium **156.0.8078.79**, Linux. Browseraufrufe mit `CHROMIUM_PATH=/usr/bin/chromium`. Keine Installation und keine Dependency-/Lockdateiänderung.

| Tatsächlich ausgeführte Prüfung | Ergebnis |
|---|---|
| Gezielt: `node --test tests/module/grundlage-beispiele.test.mjs tests/module/grundlage.test.mjs tests/auftrag1-grundlage.test.mjs tests/beispiele.test.mjs tests/showme.test.mjs tests/aufgaben-node.test.mjs tests/runde-ohne-doppelte.test.mjs tests/lernlogik.test.mjs` | **67/67 bestanden**, Exit 0. Einschließlich echter Kartenpfade aller zehn Quests und der deterministischen Browsermatrix für alle 62 Familien. Die Zahlenfamilien werden je 24-mal fachlich geprüft; Seeds 3303/3340/3362/3399 sind in den neuen Tests festgelegt |
| Danach ergänzte Grenzorakel und Modulbau: `node --test tests/module/grundlage-beispiele.test.mjs tests/module/rahmen.test.mjs` | **14/14 bestanden**, Exit 0. Einschließlich 190 + 10 / 200 − 10 und wiederholten globalen Zufallswerten 0 sowie 1−EPSILON für jede Zahlenfamilie und ihre Varianten, begrenzte Auswahl spätestens nach 24 Kandidaten |
| Browsermatrix jeder Familie | Neutraler DE/EN-Titel; anderer Prompt/Bild-Stimulus und erklärter Lösungsweg; eigene Frage/Runde/Ergebnis unverändert; kein hervorgehobener eigener Lösungsbutton, kein neuer Lernbeleg, keine Wiederholungsvormerkung. Anschließend selbst beantwortbar und `ok=true, help=true, example=true`, je ein Stern |
| Bisheriger höherer Hilfeweg | `beispiele`, `showme` und die langen Node-Beispielpfade bestanden. Die Tests prüfen weiter leichtere Beispiele, anderen Antwortstring, Hilfsbuchung, Fehler-/Lösungs-/Wiederholungspfad und unbetroffene Grundlage ohne Beispiel |
| Runden und Lernlogik | Bestehende Prüfungen für 8 Aufgaben, Doppelfreiheit, Grundlageanteil, RS-Anpassung, Practise Today und Fachmixe im 67er-Lauf bestanden |
| `git diff --check` | bestanden |
| Vollständige Suite | **offen** beim ersten Produkt-/Testcommit. Nach Atlas' konkretisierter Ausführungsplanung liefert genau die vorhandene vollständige Web-PR-CI den Vollnachweis; kein paralleler lokaler `npm test`-Lauf, kein manueller CI-Start |

Die neuen Modultests werden durch den vorhandenen `tests/module/*.test.mjs`-Teil des vollständigen Testbefehls erfasst. Die neuen Browserfälle stehen in der bereits enthaltenen `tests/auftrag1-grundlage.test.mjs`. Der unveränderte PR-Workflow teilt den vollständigen `scripts.test`-Befehl auf sechs Shards auf.

### Rote Gegenproben

Beide Gegenproben änderten ausschließlich die **im Arbeitsspeicher gelesene App**, keine Produktdatei oder weitere Quellkopie. Ausgangspunkt war derselbe funktionierende lokale Stand mit Seed 3303.

| Gegenprobe | Konkrete Änderung / echte Prüfung | Ergebnis |
|---|---|---|
| Alter Auswahl-/Anzeigepfad | Nur die neue `if(levelOf(q)===1) return foundationExample(...)`-Zeile im gelesenen Apptext entfernt. Der echte bisherige `exampleFor`-Schutz `q.coach || levelOf(q)<=1` bleibt wirksam. Chromium öffnet eine echte generierte numbers-Grundlagefrage und klickt den Tipp. Erwartung: der Beispielknopf bleibt sichtbar | **ROT**, Exit 1: `false !== true` beim fehlenden Beispielknopf. Kein fehlendes Modul und kein Einrichtungsfehler |
| Eigene Aufgabe als Beispiel | Dieselbe neue Auswahlzeile im gelesenen Apptext gezielt durch `if(levelOf(q)===1) return q;` ersetzt. Eine echte combos-Frage „100 + ? = 400“ durchläuft `exampleFor`; geprüft wird die Ungleichheit von Prompt plus Bild | **ROT**, Exit 1: fachlicher Stimulus ist identisch. Ein anderer Antwortmix oder eine neue ID würde diesen Schutz nicht umgehen |

Ein früher erster Modultestlauf hatte drei lokale Entwicklungsfehler: Zwei vorher nur aus einer kurzen Gleichung bestehende Erklärungstypen und eine zu hoch angesetzte Zeichenlängenprüfung einer bereits vollständigen Wortbildungserklärung. Die beiden Lösungswege wurden ergänzt; der reine Längensanitycheck wurde passend gefasst. Die fachlichen Rechen-/Wortbildungs-/Stimulusprüfungen bleiben erhalten. Die anschließend oben genannten Läufe sind grün; der frühere Fehlversuch wird nicht als PASS ausgegeben.

## Gefunden

- Keine fachlich nötige Ausnahme und keine Konzeptabweichung. Keine neue Quest, Infrastruktur, CI-/Workflowänderung, Swift-/Authänderung oder Veröffentlichung.
- Der falsche Stellenwert-Erklärungssatz war ein tatsächlicher Bestandsbefund und ist im eng betroffenen Generator präzisiert; siehe oben.
- Die vorhandene fremde Performancegrenze `tests/module/lesen.test.mjs:179` wird nicht verändert. Der alte berichtete FAIL wird hier weder wiederholt noch umgedeutet.
- Echte iPad-Abnahme ist für EV-3.3 nicht verlangt und wurde nicht durchgeführt. EV-1.3-Geräteabnahme bleibt außerhalb dieses Auftrags.
- Nächster Owner: Atlas für unabhängige Inhalts-/Verhaltensprüfung am genauen Produktcommit, CI-Abgleich und spätere Mergeentscheidung. Worker führt keinen Merge und keine Veröffentlichung aus.

### Lokaler Review-Nachtrag: Singular bei einem Zehner

Argus reproduzierte am ersten Produkt-/Teststand `c862051efd023a1dcf1a35cfb6c4784e65b8c26e` einen neu eingeführten Sprachfehler: `combosBaseQ(3,{draw:()=>8})` lieferte bei 90 + ? = 100 „That is 1 tens, or 10.“ Ausschließlich dieser neue Erklärungssatz verwendet bei einem Zehner nun „1 ten“, bei mehreren weiter „tens“. Weil der Generator geteilt wird, gilt die Korrektur sowohl im Beispiel als auch bei der eigenen Aufgabe.

Der neue deterministische Grenztest für 90 → 100 sowie der Pluralgegenfall 80 → 100 scheiterte vor der Korrektur erwartungsgemäß am Satz „1 tens“ (Exit 1). Danach bestand `node --test tests/module/grundlage-beispiele.test.mjs` **10/10**, Exit 0; `git diff --check` ebenfalls bestanden. Kein weiterer Browser- oder Gesamtlauf wurde für diese einzelne Textkorrektur durchgeführt. Die oben genannten früheren Nachweise bleiben an ihrem jeweiligen Stand gebunden.

**Transport und Vollnachweis bleiben offen.** Die externe Übergabe war nach den drei fehlgeschlagenen GitHub-Zugriffen angehalten worden. Dieser lokale Minor-Fix ist ein gesondert beauftragter Folgeschritt; dabei erfolgte kein GitHub-, Push-, PR- oder CI-Aufruf. Ein externer Wiederanlauf bedarf Peters Entscheidung. Kein Merge und keine Veröffentlichung.
