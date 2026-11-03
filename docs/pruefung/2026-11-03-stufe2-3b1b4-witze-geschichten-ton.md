# 2026-11-03 – Stufe 2, 3b-1b-4: Witze, Geschichten, Ton

## Auftrag
Letzter Teil von 3b-1b. Peter (03.11., „Was bleibt auf dem Gerät“): gezeigte Witze, gelesene Geschichten und Ton folgen künftig dem Konto, nicht dem Gerät (Kind, privat). Bisher waren die drei „lokal“. Im Live-Bau tut `eventHook` nichts.

## Format, Rechte, Bereiche (jetzt 29 Typen)
- **neu `joke_seen`** `{ joke, forget? }` – ein Witz wurde gezeigt. `forget` = die Witze, die die App vergisst, wenn alle Witze dieses Moments gezeigt wurden und die Runde neu beginnt (`witze.mjs` `jokeNext`).
- **neu `story_read`** `{ story }` – die Geschichte rückt ans Ende (`geschichten.mjs` `storyMarkRead`).
- **`profile_set`** hat das Feld **`muted`** (Ton des Kindes, „Letzte gilt“).
- Rechte: Kind und Eltern (Eltern, weil die App bei offenem Erwachsenenbereich als Erwachsener schreibt).
- Bereich (Modul `bereiche`, P3b): alle drei `kind:privat`.

## Ableitung
- `joke_seen`: `forget` und den Witz selbst entfernen, Witz hinten anfügen, die letzten 200 behalten (wie `jokeFor`).
- `story_read`: entfernen und hinten anfügen.
- `muted`: wie die anderen Profilfelder.

## `index.html`
- `jokeFor`: Ereignis nur, wenn es einen Witz gab; `forget` = was vorher gemerkt war und jetzt nicht mehr.
- Geschichte lesen: `story_read`.
- Ton: `profile_set muted` **nur, wenn das Kind handelt**. Den Ton eines Erwachsenen regelt 3b-1c (Personen-Bereich), wie bei der Sprache (`kidLang`/`parentLang`).
- `werkzeug/speicherstellen.json`: `jokeSeen`, `storyRead` jetzt `protokoll`; `muted` `letzte-gilt` (mit Hinweis). Damit verlangt der Wächter an allen drei Stellen einen Haken.

## Tests
- `tests/module/ableitung.test.mjs`: 2 000 Schritte mit den **echten** Modulen `witze` und `geschichten` (Englisch/Deutsch, Mottozeiten, mehrere Neustarts der Witzrunde): `derive` = die Listen, die die App gespeichert hätte; auch über einen Basisstand-Schnitt hinweg. Ton: letzte gilt.
- `tests/schreibhaken-1b.test.mjs`: Browser, echte Klicks: Vorgeschichte „alle Witze dieses Moments gezeigt“ (über den Haken der App), dann drei Runden mit Witz (zweimal geklickt: ein Ereignis) und Geschichte, Ton dreimal umgeschaltet; `derive` = gespeicherter Stand, der Neustart steht mit `forget` im Ereignis.
- Wächter: Liste der Schlüssel, die einen Haken haben müssen, um alle 3b-1b-Schlüssel erweitert.
- `ereignisse`, `annahme`, `bereiche`: 29 Typen, Rechte- und Bereichstabelle.

## Gegenproben (alle 12 rot)
Witz / Geschichte / Ton ohne Haken; Witz ohne `forget`; `derive`: Witz doppelt, `forget` ignoriert, Geschichte nicht ans Ende; Kind darf keinen Witz; Bereich für Witz fehlt; Ton bei den Lerndaten; Witze wieder „lokal“ im Verzeichnis; `muted` kein Profilfeld. „Witz ohne `forget`“ war zuerst grün (drei Runden lösen keinen Neustart aus); dafür kam die Vorgeschichte in den Browser-Test.

## Entscheidungen (Peter kann widersprechen)
1. **Ton als Profilfeld des Kindes** statt eigener Typ. Den Ton der Erwachsenen regelt 3b-1c.
2. **`forget` im Witz-Ereignis**: so muss `derive` die Witzliste der App (Sprache, Mottozeit) nicht kennen.
3. **Heute bleibt der Ton je Gerät** gespeichert (`bq2_muted`); erst das Lesen aus Ereignissen (3b-2) macht ihn zur Einstellung der Person.

## Volle Reihe
**480/480 grün** (333 s, eigener Arbeitsordner, nach dem Einmergen von P3b-2a #111; Konflikt in `annahme` gelöst: beide Rechte-Ergänzungen behalten). Nach Dev-Auftrag 1 (#112): **491/491 grün** (349 s).
