# 2026-11-02 – Hilfe und Anleitungen auf Stand Stufe 1 (v57)

## Auftrag (Peter, 02.11.)
Den Stand von Stufe 1 in Hilfe und Anleitungen bringen, getrennt nach Rolle, jeweils als Kurzanleitung und ausführliche Anleitung; dazu eine Anwenderdokumentation (Vault: „Big Quest – Anwenderdokumentation“).

## Änderungen
- `GUIDE_KID` (Englisch): Kurzanleitung oben; Who's here?, Startlink/QR, Merkpasswort mit Passwortspeicher/Face ID, Freigaben in Kindersprache.
- `GUIDE_ADULT_DE`/`EN`: Kurzanleitung; neu: Meine Kinder, Geschwister, Zugriff & Freigaben, Sicherung, starke Passwörter, Startlink/QR.
- Neu `GUIDE_TEACHER_DE`/`EN`: Lehrkräfte sehen statt der Elternanleitung ihre eigene (Einblick nur mit Freigabe, nur lesen, Hausaufgaben-Blick).
- Neu `GUIDE_ADMIN_DE`/`EN`: Zusatz nur für den Admin (Konten-Werkzeug, „🛠 Konten“, Testkind, Kinder nur mit Freigabe).
- `guideAdultFor(de)` wählt im Kapitel „Bedienung“ die Anleitung nach Rolle.
- `LOGIN_HELP`: Startlink/QR, 12 Zeichen/Vorschlag, „Startcode funktioniert weiter“, Rollenhinweis.
- Datenschutz DE/EN: alte Eltern-PIN entfernt; Kennungen, Prüfwerte, nur eigene Kinder, Freigaben, Sicherungsdatei.

## Fund und Behebung
- Die volle Testreihe fand zufällig einen Fehler aus P3: Der Vorschlag `Jam-Ox-Cup-3571` wurde von `pwWeak` abgelehnt. Grund: Die Regel „ein Wort plus Ziffern“ (`Kathie123456`) entfernte die Bindestriche, sodass kurze Wörter wie eines aussahen.
- Behebung: Die Regel greift nur bei einem einzigen Wortteil oder unter 6 Buchstaben. `Kathie-123456` bleibt schwach.
- Neuer fester Test: alle Dreierkombinationen der 14 kürzesten Wörter (× 3 Zahlen) gelten als stark.

## Tests
- Neu `tests/hilfe-rollen.test.mjs` (3): Kind sieht nur Kinderhilfe; Eltern, Lehrkraft, Admin je ihre Anleitung (DE/EN); Datenschutz ohne PIN.
- `stufe1-p3`: Test der kurzen Vorschläge; `Kathie-123456` als schwaches Beispiel.
- `anmeldung`: Text der Anmeldehilfe angepasst.
- Gegenproben: ohne die Rollenwahl → `hilfe-rollen` rot; ohne die Passwortkorrektur → `stufe1-p3` rot.
- Volle Reihe: siehe PR.
