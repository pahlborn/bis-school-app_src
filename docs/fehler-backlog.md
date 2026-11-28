# Fehler-Backlog der laufenden Beta

Fehler, die Tester auf der Testinstanz finden. Behoben wird auf dem Pflegezweig `beta/0.152` (Nummern 0.152.10 …) und zusätzlich auf `main`, jeweils erst nach Peters Freigabe (siehe `docs/konzept/fahrplan.md`, „Pflegezweig der laufenden Beta“). Neue Funktionen gehören nicht hierher, sondern in den Fahrplan.

| Nr. | gefunden | Version | Fehler | Stand |
| --- | --- | --- | --- | --- |
| F-001 | Peter, 28.11.2026 | 0.152.9-beta | Daumen 👍/👎 bei Witz, Pisolala, Word of the Day: keine sichtbare Rückmeldung, lässt sich mehrfach drücken | offen, nicht freigegeben |

## F-001 · Daumen ohne sichtbare Rückmeldung

- **Beobachtung (Peter):** Nach dem Drücken von 👍 oder 👎 ändert sich nichts Sichtbares; der Knopf lässt sich immer wieder drücken.
- **Ursache laut Code (`main` 3e5b932):** `src/module/inhaltsfeedback.mjs` setzt nach dem Klick `aria-pressed="true"` und zeichnet die Knöpfe neu. Für `.content-feedback .btn[aria-pressed="true"]` gibt es in `index.html` aber keine Darstellung, deshalb sieht der gedrückte Knopf aus wie vorher. Ein zweiter Druck auf denselben Knopf wird still ignoriert (kein doppeltes Speichern), ein Wechsel 👍 ↔ 👎 ist erlaubt.
- **Erwartet:** Der gewählte Daumen ist deutlich hervorgehoben (z. B. Rahmen und Hintergrund wie bei der Emoji-Auswahl im Profil, `.pf-emojis button[aria-pressed="true"]`), dazu eine kurze Rückmeldung für das Kind (z. B. „Thanks!“). Ein erneuter Druck auf denselben Daumen ändert nichts; umentscheiden bleibt möglich.
- **Grenzen:** Speichern (`contentFeedback`, Ereignis `content_vote`) und die Regel „👎 bei einem Witz blendet ihn aus“ bleiben unverändert. Tests für die Darstellung des gedrückten Zustands und für „zweiter Druck ändert nichts“.
