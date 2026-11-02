# Elternbereich B2: ? Hilfe als eigene Ansicht (02.11.2026)

Paket B2 aus `docs/konzept/elternbereich-auftraege.md` (Konzept 5.6, 5.7, 7.5).

## Anliegen
Seit B1 klappte **?** nur das Kapitel „📱 Bedienung & Technik“ in der Übersicht auf. Das Willkommen verwies noch auf dieses Kapitel.

## Umgesetzt
- **? Hilfe** als eigene Ansicht mit „← Zurück zur Übersicht“ und der Überschrift „❓ Hilfe“. Darin steht die Anleitung der eigenen Rolle **unverändert** (`guideAdultFor`: Eltern, Lehrkraft, Admin). Das Kapitel „📱 Bedienung & Technik“ in der Übersicht entfällt.
- **?** ist im Kopf wie ⚙️ als aktiv markiert (`aria-pressed`). Ein zweites Tippen schließt die Ansicht.
- **Routen:** neu `#eltern/hilfe`.
  - Der Wechsel ⚙ ↔ ? ersetzt den Verlaufseintrag, statt neue anzuhängen; ein Schritt zurück führt also immer zur Übersicht.
  - Ein Direktlink vor der Anmeldung führt nach der Anmeldung in die Hilfe (wie bei ⚙ in B1).
- **Willkommen (Konzept 7.5):** „📖 Die Anleitung finden Sie oben unter **?**, Sicherung und Freigaben unter **⚙️**. ⓘ erklärt einzelne Abschnitte.“ Auf Englisch entsprechend.

## Prüfung
- Neu: `tests/elternbereich-b2.test.mjs` (echte Klicks)
  - **Ansicht:** ? zeigt die Anleitung der eigenen Rolle (Eltern bzw. Lehrkraft), sonst nichts. In der Übersicht gibt es kein Anleitungs-Kapitel mehr. Nach einem Sprachwechsel bleibt man in der Hilfe.
  - **Routen:** `#eltern/hilfe`. Browser-Zurück, „← Zurück“ und ein zweites Tippen auf ? führen zur Übersicht. Nach ⚙ → ? → ⚙ → ? führt ein Schritt zurück zur Übersicht. Ein Direktlink vor der Anmeldung landet in der Hilfe.
- Erweitert: `tests/elternbereich-a1.test.mjs` prüft jetzt jedes Ziel im Willkommen. Ein Kapitel in „…“ muss existieren, **?** und **⚙️** müssen als Knöpfe im Kopf stehen (DE und EN).
- Angepasst, weil sich nur der Ort der Anleitung geändert hat: `app-hilfen` (`elternSeite('app')` öffnet ?, neu `elternAnsichtOeffnen`), `anmeldung`, `hilfe-rollen`, `info`, `elternbereich-b1`.
- Gegenproben (rot):
  - B2-Tests mit der App von `main`.
  - Neue Struktur mit dem alten Willkommen-Text: A1-Test rot („📱 Bedienung & Technik“ gibt es nicht mehr).
- `npm test`: 287 bestanden.
- Bildschirmfotos auf 320 px und auf dem Desktop durchgesehen.

## Gefunden, nicht geändert
- Die Anleitung ist auf 320 px sehr lang (Kurz- und Langfassung, Befund B4). Das wird in F1 gekürzt.
