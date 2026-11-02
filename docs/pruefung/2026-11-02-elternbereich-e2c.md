# Elternbereich E2c: „So helfen Sie“ Deutsch (02.11.2026)

Paket E2c aus `docs/konzept/elternbereich-auftraege.md`. E2c–E2e wurden Peter in einer gemeinsamen Vorher/Nachher-Tabelle vorgelegt und **freigegeben** („ja“); eingebaut als drei PRs.

## Umgesetzt (DE und EN)
- **Anleitung schreiben** (einzige Deutsch-Quest):
  - Das **Ziel** ist auf „Eine vollständige Anleitung in richtiger Reihenfolge schreiben und selbst prüfen.“ gekürzt. Es zählte vorher dieselben Punkte auf wie „So zeigt es die Schule“ (Satzanfänge, Man-Form, Vorsilbe). Die Einzelheiten stehen jetzt nur noch dort.
  - Stolperstein in 2 Punkte, Ideen gekürzt.
  - „So zeigt es die Schule“, Fragen und Quelle unverändert.

## Weggefallen
- „zusammengesetzte Wörter“ (Ziel).
- „fehlende Schritte fallen sofort auf“ (Idee 1, gekürzt).

## Prüfung
- `tests/elternbereich-e2.test.mjs` um E2c erweitert (gemeinsame Regeln wie E2a; das Ziel nennt weder Man-Form noch Vorsilbe, „So zeigt es die Schule“ schon).
- Gegenprobe: E2c-Test mit der App von `main` rot.
- `npm test`: 363 bestanden.
