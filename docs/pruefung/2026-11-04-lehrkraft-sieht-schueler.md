# 2026-11-04 – Lehrkraft sieht ihre Schüler (Freigaben für Empfänger lesbar, mehrere Kinder)

## Auftrag
Folgeaufgabe aus 3b-2b (Befund „Lehrkraft-App kennt ihre Freigabe nicht“) nach Vorgabe Peter (04.11.): Eine Lehrkraft sieht die Kinder, für die sie eine Freigabe der Eltern hat – **mehrere Kinder, auch aus verschiedenen Familien** –, mit Name und Lernstand; Schulbewertungen nur mit Freigabe „Schuldaten“. Weiter nur mit Freigabe, befristet, nur lesend. Nur Testbau. **Live-Bau byte-gleich zu `main`** (SHA-256 verglichen). `index.html` unverändert. Nicht veröffentlicht.

## Ursache
Die Freigabe (`grant_set`, `grant_revoked`) lag nur in `eltern:allg`, das nur Eltern lesen. Das Gerät der Lehrkraft bekam mit Freigabe zwar die Lerndaten, aber nicht die Freigabe – ihre App (`myKids` → `visibleKids` → `myGrantFor`) zeigte das Kind darum nicht an und konnte „angesehen“ nicht schreiben.

## Änderungen
- **`bereiche`:** `grant_set` und `grant_revoked` passen zusätzlich in den Bereich **ihrer** Freigabe (`freigabe:<Kennung>`, nur wenn `payload.grant` = Kennung). Neue Tabelle `BEREICH_AUCH`. `BEREICH_JE_TYP` bleibt (jeder Typ hat genau einen Hauptbereich).
- **`geraeteabgleich`:**
  - `kinder[].freigaben` (neu, optional): Kennungen der Freigaben, zu denen dieses Gerät eingeladen ist (Lehrkraft, Admin; später die Einladung aus EP9). Das Gerät der Lehrkraft plant damit `freigabe:<Kennung>` beim richtigen Kind – geprüft gegen den **Gründer-Elternteil dieses Kindes** (Anker). Eltern-Geräte finden die Freigaben wie bisher im Protokoll des Kindes.
  - Im Freigabe-Bereich schreibt der verteilende Elternteil eine **Kopie der Freigabe** (`grant_set` mit Empfänger, Umfang, Beginn, Ende – **ohne Einwilligungstext**) und nach dem Beenden `grant_revoked`. Das Ende geht **vor** dem Schlüsselwechsel mit dem Schlüssel raus, den die Lehrkraft noch hat – so erfährt ihre App das Ende. Danach wie bisher: neuer Schlüssel, nichts Neues mehr für sie.
  - Die app-eigenen `grant_set`/`grant_revoked` gehen **nicht** in den Freigabe-Bereich (nur die Kopie).
- Keine neue Speicherstelle, kein neuer Ereignistyp.

## Belege (`tests/lehrkraft-schueler.test.mjs`, Node-Sandbox, echte App-Instanzen, ~3 s)
Eine Installation mit zwei Familien: `kathie`/`peter` und `kathie.b`/`peter.b`; **beide Kinder heißen „Kathie“**. Dazu zwei Lehrkräfte. Bedienung mit Profil-Dialog, echten Runden, Freigabe-Formular, „Beenden“-Knopf und Kinderliste im Kopf des Erwachsenenbereichs.

| Prüfung | Ergebnis |
|---|---|
| ohne Freigabe | kein Kind, Kopf „keine Daten Ihrer Kinder“ |
| Peter 1 gibt frei (Lernstand + Schuldaten), Peter 2 nur Lernstand | Lehrkraft sieht **beide**: „👧 Kathie (kathie)“, „👧 Kathie (kathie.b)“; je Kind genau dessen Antworten |
| Zuordnung | bei Kathie 1 nur Freigabe g1, bei Kathie 2 nur g2; die Freigabe für die **andere Lehrkraft** bleibt verborgen |
| Freigabe auf ihrem Gerät | Umfang und Ende stimmen; kein Einwilligungstext |
| Schuldaten | Kathie 1: `school_import` und Kapitel „Bewertungen der Schule“; Kathie 2: nichts davon |
| `eltern:allg`, `kind:privat` | keine Schlüssel (beide Kinder), keine Ereignisse außer ihrer eigenen Freigabe; Geburtstag von Kathie 1 nicht lesbar; Sicherung (`backup_made`) nicht sichtbar |
| „angesehen“ | ihre App schreibt `grant_opened`; beide Elternteile sehen es im Protokoll |
| während die Freigaben laufen | auch Neues |
| Peter 1 beendet | **nur Kathie 1 verschwindet**; ihre App kennt das Ende (`revokedAt`); alte Daten bleiben auf dem Gerät, nichts Neues; Kathie 2 weiter mit allem |
| falsche Einladung (Freigabe der Familie 2 unter Kathie 1) | kein Kind, nichts bei Kathie 1, verworfen mit Grund (Autor gehört nicht zur Familie von Kathie 1); mit richtiger Einladung: nur Kathie 2 |

Zusätzlich `tests/module/bereiche.test.mjs`: Freigabe in ihrem eigenen Bereich ja, im Bereich einer anderen Freigabe, in `kind:lern` oder im Personen-Bereich nein; Lehrkraft darf dort weder erteilen noch beenden.

## Gegenproben (alle 12 rot)
Skript `%TEMP%\opencode\gegenprobe-lehrkraft.mjs` (Tests: `lehrkraft-schueler`, `module/bereiche`, `module/geraeteabgleich`, `zwei-geraete`).

| # | Gegenprobe | erkannt von |
|---|---|---|
| 1 | Lehrkraft sieht nur das erste Kind (Einladungen nur beim ersten Kind) | lehrkraft-schueler |
| 2a | Lehrkraft liest `eltern:allg` | lehrkraft-schueler, bereiche (Lese-Matrix u. a.), zwei-geraete E6 |
| 2b | Lehrkraft liest `kind:privat` | lehrkraft-schueler, bereiche, zwei-geraete E10 |
| 2c | Ereignis einer Freigabe passt in jeden Freigabe-Bereich | bereiche (Typ und Bereich) |
| 3 | Schulbewertungen ohne Freigabe „Schuldaten“ | lehrkraft-schueler, bereiche |
| 4a | beendete Freigabe: kein Ende im Freigabe-Bereich → Kind bleibt sichtbar | lehrkraft-schueler |
| 4b | Ende erst nach dem Schlüsselwechsel → Lehrkraft kann es nicht lesen, Kind bleibt sichtbar | lehrkraft-schueler |
| 5a | Freigabe einer fremden Familie zählt (unbekannter Autor angenommen) | lehrkraft-schueler (falsche Einladung) |
| 5b | Freigabe-Bereich ins Protokoll des falschen Kindes | lehrkraft-schueler |
| 6 | Freigabe nur in `eltern:allg` (der Ausgangsfehler) | lehrkraft-schueler (beide), bereiche |
| 7 | keine Kopie, die app-eigene Freigabe geht in den Freigabe-Bereich | lehrkraft-schueler (beide) |
| 8 | Einladung nicht beachtet | lehrkraft-schueler (beide) |

## Entscheidungen (Peter kann widersprechen)
1. **Kopie statt desselben Ereignisses.** Die Freigabe entsteht in der App, bevor ihr Bereich existiert; das Original wäre dort von allen verworfen worden („Gerät zu diesem Zeitpunkt nicht angemeldet“; beim zweiten Elternteil „nicht Mitglied“). Die Kopie schreibt der Elternteil beim Abgleich, von seinem angemeldeten Gerät. Auf Eltern-Geräten zählt die Freigabe trotzdem nur einmal (gleiche Kennung).
2. **Ohne Einwilligungstext** (Vorschlag aus 3b-2b): Die Lehrkraft braucht Empfänger, Umfang und Ende; der Text bleibt bei den Eltern.
3. **Ablauf ohne Eintrag:** Eine abgelaufene Freigabe bekommt keinen `grant_revoked` (sonst stünde bei den Eltern „beendet“ statt „abgelaufen“); ihre App erkennt den Ablauf am Enddatum.
4. **Die Freigabe-Kennung kommt mit der Einladung** (`kinder[].freigaben`); bis EP9 setzt der Test sie.

## Befunde
- **Ablauf in der App der Lehrkraft nicht in der Sandbox geprüft:** Die Sandbox hat die echte Uhr. Geprüft sind der Schlüsselwechsel nach Ablauf (zwei-geraete E6) und das Ausblenden nach Enddatum (`rechte`: `isGrantActive`).
- **Für EP9 (Einladung):** (a) Eine Freigabe gehört zu genau einem Kind. Wird ihr Bereich auf einem Gerät einmal unter dem falschen Kind gelesen, liest dasselbe Gerät ihn nicht noch einmal unter dem richtigen (Stand je Bereichsname). Die Einladung muss die Zuordnung prüfen, bevor sie gespeichert wird. (b) `verzeichnis` darf nur die eigene Familie und die Empfänger enthalten: `halter` macht jeden Elternteil darin zum Schlüsselhalter (schon vorher so, hier nur bemerkt).
- **Uhren:** Geht das Gerät des verteilenden Elternteils deutlich nach, kann die Kopie früher datiert sein als das Original; dann stünde im Protokoll der Eltern „erteilt“ ohne Text. Selten, ohne Folgen für Rechte.
- **Nicht getestet:** Admin mit Freigabe (gleicher Weg wie Lehrkraft), zweiter Elternteil als eigene Instanz.

## Volle Reihe
Eigener Arbeitsordner, mit `main` = 79dda0d (Stufe 3a Teil 1, #123). Rechner stark belegt durch andere Sitzungen (Laufzeit 450 s und 498 s statt ~240 s):
- Lauf 1: **628/629** – `begruessung` „nicht am Tag der ersten Anmeldung …“: `page.goto`-Zeitüberschreitung; einzeln 4/4 grün.
- Lauf 2: **628/629** – `stufe1-p3` „erstes Passwort …“: `page.goto`-Zeitüberschreitung; einzeln 4/4 grün.
Beide betreffen den Live-Bau im Browser, nicht die geänderten Testbau-Module; jeder Test war in mindestens einem vollen Lauf und einzeln grün. Neue Tests (`lehrkraft-schueler`, `module/bereiche`, `module/geraeteabgleich`) in beiden Läufen grün.
