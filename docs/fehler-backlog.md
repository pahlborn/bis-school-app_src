# Fehler-Backlog der laufenden Beta

Fehler, die Tester auf der Testinstanz finden. Behoben wird auf dem Pflegezweig `beta/0.152` (Nummern 0.152.10 …) und zusätzlich auf `main`, jeweils erst nach Peters Freigabe (siehe `docs/konzept/fahrplan.md`, „Pflegezweig der laufenden Beta“). Neue Funktionen gehören nicht hierher, sondern in den Fahrplan.

| Nr. | gefunden | Version | Fehler | Stand |
| --- | --- | --- | --- | --- |
| F-001 | Peter, 28.11.2026 | 0.152.9-beta | Daumen 👍/👎 bei Witz, Pisolala, Word of the Day: keine sichtbare Rückmeldung, lässt sich mehrfach drücken | offen, nicht freigegeben |
| F-002 | Peter, 28.11.2026 | 0.152.9-beta | „Kind anlegen“ zeigt nur einen QR-Code, keinen Link – auf demselben Gerät wie dem der Eltern nicht nutzbar | Lösung B entschieden, nicht freigegeben |

## F-001 · Daumen ohne sichtbare Rückmeldung

- **Beobachtung (Peter):** Nach dem Drücken von 👍 oder 👎 ändert sich nichts Sichtbares; der Knopf lässt sich immer wieder drücken.
- **Ursache laut Code (`main` 3e5b932):** `src/module/inhaltsfeedback.mjs` setzt nach dem Klick `aria-pressed="true"` und zeichnet die Knöpfe neu. Für `.content-feedback .btn[aria-pressed="true"]` gibt es in `index.html` aber keine Darstellung, deshalb sieht der gedrückte Knopf aus wie vorher. Ein zweiter Druck auf denselben Knopf wird still ignoriert (kein doppeltes Speichern), ein Wechsel 👍 ↔ 👎 ist erlaubt.
- **Erwartet:** Der gewählte Daumen ist deutlich hervorgehoben (z. B. Rahmen und Hintergrund wie bei der Emoji-Auswahl im Profil, `.pf-emojis button[aria-pressed="true"]`), dazu eine kurze Rückmeldung für das Kind (z. B. „Thanks!“). Ein erneuter Druck auf denselben Daumen ändert nichts; umentscheiden bleibt möglich.
- **Grenzen:** Speichern (`contentFeedback`, Ereignis `content_vote`) und die Regel „👎 bei einem Witz blendet ihn aus“ bleiben unverändert. Tests für die Darstellung des gedrückten Zustands und für „zweiter Druck ändert nichts“.

## F-002 · Kind anlegen: nur QR-Code, kein Link

- **Beobachtung (Peter):** Nach „Kind anlegen“ erscheint nur der Start-QR-Code. Soll das Kind auf demselben Gerät üben wie ein Elternteil, lässt sich der Code dort nicht scannen.
- **Ursache laut Code (`main` 87fd214, `index.html` im Familien-Blatt):** Ein Feld mit Link gibt es nur bei der Einladung eines Elternteils durch den Admin (`linkBox` nur für `zweck==='adminEltern'`), „Als E-Mail-Entwurf sichern“ nur für Elternteile. Für ein Kind zeigt die Seite nur den QR-Code und den Text „Auf dem Gerät von [Name] die Kamera auf den Code richten …“.
- **Mögliche Lösungen (Entscheidung Peter):**
  - A: wie bei der Elternteil-Einladung zusätzlich den Link zeigen (kopieren), der auf demselben Gerät geöffnet werden kann.
  - B: zusätzlich ein Knopf „Auf diesem Gerät anmelden“: Elternteil wird abgemeldet, die erste Anmeldung des Kindes öffnet sich mit dem Start-Code (das Gerät ist schon verbunden).
- **Entscheidung (Peter, 28.11.): Lösung B**, der QR-Code bleibt daneben für ein eigenes Gerät des Kindes; Lösung A entfällt. Grund: Ein kopierter Link öffnet sich auf dem iPad meist in Safari statt in Big Quest vom Home-Bildschirm (getrennter Speicher), im Playgrounds-Projekt ähnlich.
- **Vor der Umsetzung prüfen und berichten:** ob der Knopf das Elternteil abmeldet oder nur den Elternbereich schließt; Ablauf auf einem Gerät, auf dem schon ein Geschwisterkind übt („Who's here?“).
- **Grenzen:** Start-Codes nur persönlich zeigen (heutiger Hinweis bleibt); keine Codes in Protokollen; Tests für beide Wege, ein Gerät mit Eltern- und Kindkonto.
