# S11 Stufe 1 – P0 Charakterisierung (02.11.2026)

Spezifikation: Vault „S11 Stufe 1 – Eindeutige Personen und Zuordnung“, Abschnitt 7 (P0). Freigabe zur Umsetzung durch Peter am 02.11.

## Inhalt

Keine Änderung an der App. Neue Tests halten das Verhalten **vor** Stufe 1 fest:

| Test | Heutiges Verhalten | Wird geändert in |
|---|---|---|
| Speicher | Das erste Kind speichert unter `bq2_<key>`, weitere Kinder unter `bq2_<name>__<key>`; Passwörter und Sitzung gerätweit nach Namen | P2 (Speicher nach Kennung) |
| Befund B1 | Ein Elternteil bekommt auch ein fremdes Kind angeboten, wenn es auf dem Gerät ein Passwort hat | P3 |
| Schuldaten | Hängen am Anmeldenamen: Ein fremdes Kind mit dem Namen „kathie“ bekäme Kathies Schuleinstufungen | P2 |

Neu ist außerdem `tests/konten-hilfen.mjs`: gemeinsame Werkzeuge für Tests mit Anmeldung (Testserver mit Konten, Anmelden, Passwort setzen), die die folgenden Phasen nutzen.

## Prüfung

- `tests/stufe1-ist.test.mjs`: 3 Tests grün.
- `npm test`: siehe PR.
