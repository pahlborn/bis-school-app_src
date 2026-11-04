# 2026-11-04 – Stufe 2, 3b-1c: Freigaben und Persönliches

## Auftrag
Letzter Teil von 3b-1 (Schreibhaken). Freigaben (`grants`, `grantlog`) als `grant_set`/`grant_revoked`/`grant_opened`; laut „Was bleibt auf dem Gerät“ (Peter, 03.11.) Gruppe A außerdem `parentLang`, `conceptSeen`, `glance` (Personen-Bereich), `lastBackup` (Eltern allgemein) und der Ton der Erwachsenen. Rechte und Zulassung nach P3b/P3b-2 (#108, #111, #114). Ziel: Die offene Liste im Wächter ist leer. Für Kathie ändert sich nichts: Im Live-Bau tut `eventHook` nichts.

## Format, Rechte, Bereiche (jetzt 32 Typen)
| Typ | Nutzlast | „Letzte gilt“ je | Bereich | Wer schreibt |
|---|---|---|---|---|
| **neu `person_set`** | `{ field: parentLang \| muted \| conceptSeen, value }` | Feld | `person:<Autor>` | jede Rolle, nur in den eigenen Bereich |
| **neu `glance_set`** | `{ child: <Kind-ID>, value: {…} }` („Auf einen Blick“, Stand beim letzten Besuch) | Kind | `person:<Autor>` | nur Eltern |
| **neu `backup_made`** | `{ day }` | – (ein Wert) | `eltern:allg` | nur Eltern |
| `grant_set`, `grant_revoked` | wie bisher | Protokoll | `eltern:allg` | Eltern |
| `grant_opened` | wie bisher (mit `scope`) | Protokoll | `freigabe:<Freigabe>` | Lehrkraft/Admin, nur für sich |

- Modul `bereiche`: `passtZumBereich` prüft im Personen-Bereich zusätzlich **Autor = Person des Bereichs**. Ein Elternteil kann so nichts in den Bereich des anderen oder des Kindes legen (Grund `bereich-falsch`).
- Modul `annahme`: Rechte wie in der Tabelle. Die frühere Ausnahme „Eltern dürfen `review` und Abzeichen `principled`“ gibt es schon seit A9 (#82) nicht mehr – nichts zurückzunehmen.

## Ableitung (`derive`)
- Freigaben: Das Protokoll ist das, was abgeglichen wird; `grants` folgt daraus. `grant_set` → neue Freigabe `{ id, grantee, scope, from, until, by }` + Eintrag „erteilt“; `grant_revoked` → `revokedAt` = Zeit des Ereignisses + „widerrufen“ (nur für eine bekannte, noch laufende Freigabe – zweimal beendet zählt einmal); `grant_opened` → „geöffnet“. `at` jedes Eintrags = Zeit des Ereignisses. Höchstens 200 Einträge (wie die App).
- **Nicht** in den Ereignissen (Gerätenotiz): `expiredLogged` und der Eintrag „abgelaufen“. Beide folgen aus `until`; das Lesen aus Ereignissen (3b-2) rechnet sie.
- Protokoll einer Person: `parentLang`, `muted`, `conceptSeen` (Tag), `glance` = `{ <Kind-ID>: Stand }`.
- `backup_made` → `lastBackup`.

## `index.html`
- `eventHook(type, payload, kid)`: Personen-Ereignisse (Bereich `person`, aus `bereichVonEreignis`) gehen in das Protokoll der handelnden Person, `bq2_personEvents` (`{ <Personen-ID>: [Ereignisse] }`, geräteweit). Ist niemand angemeldet, wird nichts geschrieben, sondern in `eventNoPerson` vermerkt. `kid`: Ist es nicht das Kind, das der Speicher gerade zeigt, wird nichts geschrieben (`eventErrors`: „anderes Kind“). Gibt das gespeicherte Ereignis zurück (Live-Bau: `null`).
- `grantLog(acc, eintrag, [Typ, Nutzlast])`: ein Haken für alle Freigabe-Ereignisse; „abgelaufen“ ohne Ereignis. Der Eintrag bekommt die Zeit des Ereignisses; dieselbe Zeit wird `revokedAt`. Erteilen (mit automatischem Beenden einer laufenden Freigabe derselben Person), Beenden und „angesehen“ geben ihr Ereignis mit.
- Sprache (`setLang`, Anleitung): `kidLang` wie bisher, sonst `person_set parentLang`.
- Ton: Kind wie bisher, sonst `person_set muted`.
- „So funktioniert Big Quest“ geöffnet: `person_set conceptSeen`.
- „Auf einen Blick“: `glance_set` – nur wenn ein Elternteil handelt.
- Sicherung erstellt: `backup_made`.
- `werkzeug/speicherstellen.json`: `grants` jetzt `abgeleitet`, `grantlog` `protokoll`; `parentLang`, `conceptSeen`, `glance` Bereich `person`, „letzte-gilt“; `lastBackup` Eltern, „letzte-gilt“; neu `personEvents`. Neuer Bereichswert `person` im Kopf erklärt.

## Tests
- Wächter (`tests/module/schreiber.test.mjs`): **offene Liste leer** – 83 Schreibstellen, 49 mit Haken, offen 0. `grants` abgeleitet, `events` und `personEvents` je an genau einer Stelle. Gruppe A aus „Was bleibt auf dem Gerät“ ist nirgends mehr „lokal“.
- Schreiber + `derive` ohne Browser: Freigaben (zweimal beendet, unbekannte Freigabe, Lehrkraft „angesehen“ nur für sich, kein Blick, keine Sicherung; Kind erteilt nichts), Protokoll einer Person (Sprache, Ton gelöscht, „So funktioniert“, Blick je Kind).
- `annahme`: Matrix 32 Typen × 4 Rollen; neuer Test Personen-Bereich (jede Rolle im eigenen ok, im fremden `bereich-falsch`; Lehrkraft-Blick `rolle-darf-nicht`; Sicherung nur bei den Kinddaten). `bereiche`: Typ→Bereich-Tabelle, falsche und richtige Bereiche.
- Browser (`tests/schreibhaken-1b.test.mjs`, echte Klicks):
  - **mit Konten**: Elternteil öffnet die Übersicht (Blick), schaltet die Sprache, öffnet „So funktioniert“, gibt der Lehrkraft Einblick; die Lehrkraft sieht das Kind (zweimal am selben Tag: einmal „angesehen“); neue Freigabe mit Schuldaten ersetzt die alte; Elternteil beendet sie; Sicherung. `derive` = gespeicherte `grants`, `grantlog`, `lastBackup` (ohne Gerätenotizen); Protokoll des Elternteils ergibt Sprache, „So funktioniert“ und Blick; die Lehrkraft hat keinen Blick in ihrem Protokoll (auf dem Gerät schon). Ereignis für ein anderes Kind wird nicht geschrieben.
  - **ohne Konten**: dasselbe für `p_eltern`, zwei Besuche = zwei Blicke.
- Live-Bau (`tests/ableitung-vergleich.test.mjs`): auch der Erwachsenenbereich schreibt kein Personen-Protokoll.

## Gegenproben (alle 17 rot)
1 `grantLog` ohne Ereignis · 2 Sprache ohne Haken · 3 „So funktioniert“ ohne Haken · 4 Blick ohne Haken · 5 Sicherung ohne Haken · 6 Blick auch für die Lehrkraft · 7 Personen-Bereich ohne Autorenprüfung · 8 Lehrkraft ohne `person_set` · 9 `backup_made` ohne Bereich · 10 `derive` ohne `revokedAt` · 11 Beenden doppelt protokolliert · 12 Protokollzeit nicht aus dem Ereignis · 13 Personen-Ereignisse ins Kinder-Protokoll · 14 `glance` wieder „lokal“ · 15 kein Schutz „anderes Kind“ · 16 Blick nicht je Kind · 17 gelöschter Ton bleibt als `null` stehen. (Die erste Fassung von 17 war grün, weil bei „Letzte gilt“ nur der Gewinner angewendet wird; ersetzt.)

## Entscheidungen (Peter kann widersprechen)
1. **Eigenes Protokoll je Person** (`bq2_personEvents`) statt im Protokoll des Kindes – der Personen-Bereich ist ein eigener Bereich mit eigenem Schlüssel.
2. **`grants` folgt aus dem Protokoll**; „abgelaufen“ ist kein Ereignis (niemand handelt, es folgt aus `until`).
3. **Zeit im Freigabe-Protokoll = Zeit des Ereignisses.** Im Live-Bau wie bisher die Uhrzeit; `revokedAt` und Protokolleintrag sind jetzt genau gleich statt Millisekunden auseinander.
4. **„Auf einen Blick“ nur für Eltern.** Bei Lehrkraft und Admin bliebe sonst der Stand des Kindes nach Ende der Freigabe in ihrem eigenen Bereich. Für sie bleibt der Blick auf dem Gerät (die Zeile „seit Ihrem letzten Besuch“ sehen sie ohnehin nicht).
5. **Ohne Konten** wählt das Kind in der Anleitung die geräteweite Sprache (`parentLang`); das Ereignis steht dann im Protokoll von `p_kind`. Mit Konten ist das `kidLang` wie bisher.

## Befunde
- **Ton der Erwachsenen:** Den Ton-Knopf gibt es nur auf der Kinder-Startseite; ein Erwachsener erreicht ihn heute nicht. Der Haken ist da, geprüft nur ohne Browser.
- **Lehrkraft und „So funktioniert“:** Das Kapitel bleibt vom Besuch des Elternteils offen (`state.popen` wird beim Wechsel der Person nicht zurückgesetzt) und zählt so auch für die Lehrkraft als gelesen. Bestehendes Verhalten, nicht geändert; das Ereignis folgt dem gespeicherten Wert. Kleine eigene Aufgabe, falls gewünscht.
- Bis 3b-2 speichert die App `parentLang`, `muted`, `conceptSeen`, `glance` weiter je Gerät (zwei Erwachsene auf einem Gerät teilen sich die Sprache); erst das Lesen aus Ereignissen macht sie zur Einstellung der Person.
- Zurückspielen einer Sicherung schreibt keine Ereignisse (Aufgabe 6 bzw. 3c).

## Volle Reihe
**509/509 grün** (278 s, eigener Arbeitsordner, `main` = e385a1d). Ein erster Lauf hatte 503/509: sechs `page.goto`-Zeitüberschreitungen (about, blaetter, eltern, elternbereich-b2), weil eine andere Sitzung gleichzeitig Browser-Gegenproben laufen ließ; die vier Dateien einzeln 26/26 grün, Wiederholung der vollen Reihe grün.
