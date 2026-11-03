# 2026-11-03 – Stufe 2, P2d: Modul `schnappschuss` (nur Testbau)

## Auftrag
Spezifikation S12, Phase P2 (US7.6), Konzept 9.3. Pro Kind entstehen etwa 50 Ereignisse je Übungstag; ein neues Gerät müsste alle laden und durchrechnen. Ziel: Ab 5 000 Ereignissen schreibt ein Eltern-Gerät einen Schnappschuss; ein neues Gerät lädt ihn und nur die Ereignisse danach. **Erfolgskriterium:** Schnappschuss + Rest ergibt immer denselben Stand wie alle Ereignisse ohne Schnappschuss – auch wenn Ereignisse verspätet eintreffen (Lücke aus 3a: `derive` mit `base` spielt nur Ereignisse *nach* `upTo` nach).

`index.html` ist unverändert. Das Modul ist **nur im Testbau** (`module.json`: `bau: test`, nach `annahme`). Kein Speicher, kein Netz, kein Archivieren oder Löschen alter Ereignisse. Unterschreiben und Annehmen macht `annahme` (Eltern dürfen `snapshot` schreiben).

## Änderungen
- `src/module/schnappschuss.mjs` (neu; Importe nur aus `ereignisse` und `ableitung`; reine Funktionen, `now` wird übergeben):
  - `SNAPSHOT_EVERY = 5000`
  - `needsSnapshot(events, lastSnapshot)` → ja, wenn seit dem letzten Schnappschuss mindestens 5 000 Ereignisse dazukamen (Zeit nach dessen `upTo`; ohne Schnappschuss: alle). Es zählen nur gültige Ereignisse, jede Kennung einmal, keine Schnappschüsse.
  - `makeSnapshot(events, { now, author, device })` → Ereignis `snapshot` (noch nicht unterschrieben) mit `upTo`, `count`, `idsHash`, `state`; `null`, wenn es kein Ereignis vor „jetzt“ gibt.
  - `stateFrom(events, snapshot, { now })` → `{ state, weg }` mit `weg` = `schnappschuss`, `voll` oder `nachladen` (siehe Abweichung 1).
  - Hilfsnamen beginnen mit `sn` (gemeinsamer Namensraum in der App).
- `src/module/ereignisse.mjs`: Format v1, Typ `snapshot` hat das neue Pflichtfeld **`idsHash`** (SHA-256 als 64 kleine Hex-Zeichen; neue Feldart `sha`). Die Beispiele in `tests/module/ereignisse.test.mjs` und `tests/module/annahme.test.mjs` sind angepasst; zwei neue Fehlerfälle (Großbuchstaben, zu kurz).
- `tests/module/schnappschuss.test.mjs` (neu, 12 Tests, ca. 9 s).
- `tests/testbau.test.mjs`: ein Browser-Test (Prüfsumme über Web Crypto in Chromium; Schnappschuss, verspätet, nachladen).
- `src/module/module.json`: `schnappschuss` (Testbau, Browser-Test `testbau`).

## Was ein Schnappschuss enthält
| Feld | Inhalt |
|---|---|
| `upTo` | Zeit des jüngsten enthaltenen Ereignisses; immer **strikt vor** „jetzt“ des schreibenden Geräts. So liegt kein Ereignis mit falscher Uhr (mehr als 24 h voraus, zählt als „jetzt“) darin. |
| `count` | Anzahl der enthaltenen Ereignisse: jedes gültige Ereignis mit wirksamer Zeit ≤ `upTo` (derselbe Schnitt wie bei `derive` mit `base`), ohne Schnappschüsse. |
| `idsHash` | SHA-256 über genau diese Ereignisse, nach Kennung sortiert, je Zeile das ganze Ereignis in fester Schlüsselreihenfolge (Kennung **und** Inhalt, siehe Abweichung 2). |
| `state` | `derive` dieser Ereignisse (Modul `ableitung`, mit `_days`). |

## Wie `stateFrom` entscheidet
Das Gerät sucht unter den Ereignissen, die es kennt, die mit wirksamer Zeit ≤ `upTo`:

| Fall | Ergebnis |
|---|---|
| keines (neues Gerät: nur Schnappschuss und was danach kam) | `schnappschuss` |
| gleiche Anzahl und gleiche Prüfsumme | `schnappschuss` |
| andere, mindestens so viele (verspätetes Ereignis; das Gerät hat alles) | `voll` = `derive` über alle |
| andere, weniger (neues Gerät hat ein verspätetes Ereignis, aber nicht die alten) | `nachladen`, `state: null` – erst die alten Ereignisse laden, dann noch einmal |
| Uhr des Geräts mehr als 24 h hinter `upTo` | nie `schnappschuss` (die Uhrenregel würde die Reihenfolge vor `upTo` ändern); `voll` oder `nachladen` wie oben |

Ohne Schnappschuss: `voll`. Ein ungültiger Schnappschuss (kein `snapshot`, Format falsch) bricht ab – er muss vorher von `annahme` angenommen sein.

## Tests (alle grün)
1. **US7.6:** 6 000 Ereignisse (alle Typen, die der Stand kennt, inkl. Lücken; 5 % mit gleicher Zeit). Schnappschuss nach 5 000: altes Gerät (alle Ereignisse + Schnappschuss) und neues Gerät (nur die 1 000 danach) → `schnappschuss`, Stand = `derive` über alle. Dazu ein Ereignis genau 1 ms nach `upTo`.
2. **Verspätet:** Ereignis mitten drin, genau auf `upTo` und ganz am Anfang → altes Gerät `voll` (= `derive` über alle), neues Gerät `nachladen`. Danach schreibt das Eltern-Gerät einen neuen Schnappschuss (der alte liegt im Protokoll und zählt nicht mit); altes und neues Gerät nutzen ihn wieder.
3. **Gleiche Anzahl, andere Ereignisse:** eines fehlt, ein verspätetes ist da → `voll`; über den Schnappschuss wäre der Stand ein anderer.
4. **Gleiche Kennung, anderer Inhalt** → `voll`.
5. **Alte Ereignisse fehlen** (Gerät war offline, nichts verspätet) → `nachladen`; mit allen → `schnappschuss`.
6. **Doppelt und gemischt** (10 Läufe): Reihenfolge und Wiederholungen ändern weder den Schnappschuss noch den Stand.
7. **Schwelle:** 4 999 → nein, 5 000 → ja; Doppelte, Ungültige und Schnappschüsse zählen nicht; nach einem Schnappschuss zählt es neu (4 999 → nein, 5 000 → ja).
8. **Kürzungen:** Im Schnappschuss sind `attempts` 200, `ev` 60, `due` 40, Blätter 8 voll; danach gleich wie ohne Schnappschuss.
9. **Uhr:** Ereignis > 24 h voraus nach dem Schnappschuss zählt als „jetzt“ (gehört zum Rest); liegt es schon beim Schreiben vor, ist es nicht enthalten (auch nicht zwischen 0 und 24 h voraus) und bleibt später im Rest; Gerät mehr als 24 h hinterher → nie `schnappschuss` (auch nicht, wenn Anzahl und Prüfsumme passen).
10. **Rechte:** vom Elternteil unterschrieben → angenommen; vom Kind → `rolle-darf-nicht`. Ohne Ereignis vor „jetzt“ → kein Schnappschuss.
11. **Eingaben:** `now` ist Pflicht; ungültiger Schnappschuss oder Autor bricht ab.
12. **Reinheit:** kein Netz, kein Speicher, keine Uhr, kein Zufall; Importe nur aus Modulen; Hilfsnamen mit `sn`.

Browser (Testbau, Chromium): derselbe Ablauf im Kleinen (300 Ereignisse) liefert dieselben Ergebnisse.

## Gegenproben (alle rot)
Die fünf geforderten und zehn weitere, je als Änderung am Modul (Skript `gegenproben-p2d.mjs`, nicht im Repo):

| Gegenprobe | rote Tests |
|---|---|
| Prüfsumme nicht vergleichen (gar keine Prüfung) | 4 |
| nur Anzahl vergleichen | 2 |
| `upTo` 1 ms früher | 9 |
| `upTo` 1 ms später | 3 |
| Schwelle 4 999 | 1 |
| Schnappschuss ohne die Ereignisse genau auf `upTo` | 6 |
| Prüfsumme nur über Kennungen | 1 |
| Uhrenregel weg | 1 |
| kein `nachladen` (immer `voll`) | 3 |
| neues Gerät (keine alten Ereignisse) nicht erlaubt | 2 |
| Schnappschüsse zählen mit | 1 |
| Schwelle mit `>` statt `>=` | 1 |
| Stand über alle bekannten statt bis `upTo` | 1 |
| `upTo` darf „jetzt“ sein | 2 |
| `needsSnapshot` ignoriert den letzten Schnappschuss | 1 |
| `idsHash` nicht im Format (in `ereignisse`) | 16 |

Zwei Gegenproben (Uhrenregel, Schnappschüsse zählen mit) waren zuerst grün; dafür sind zwei Prüfungen in Test 2 und Test 9 dazugekommen.

## Abweichungen und Entscheidungen (Peter kann widersprechen)
1. **Drittes Ergebnis `nachladen`.** Die Aufgabe kennt nur `schnappschuss` und `voll`. Ein neues Gerät hat aber nur den Schnappschuss und die Ereignisse danach. Kommt dort ein verspätetes Ereignis an, kann es nicht „alles neu durchrechnen“ – die alten Ereignisse fehlen ihm. Mit nur Anzahl und Prüfsumme lässt sich außerdem nicht prüfen, ob ein bekanntes Ereignis im Schnappschuss steckt. Darum: Kennt das Gerät weniger alte Ereignisse als der Schnappschuss und passen sie nicht, meldet `stateFrom` `nachladen` (ohne Stand). Die App (3b-2 bzw. beim Abgleich) lädt dann die alten Ereignisse und ruft noch einmal auf.
2. **Prüfsumme über Kennung und Inhalt.** Der Name bleibt `idsHash`. Grund: Zwei Fassungen derselben Kennung (Fehler oder Fälschung mit gültiger Unterschrift) hätten sonst dieselbe Prüfsumme bei anderem Stand (Test 4). Mehraufwand: rund 1 MB Text je 5 000 Ereignisse hashen – im Test nicht spürbar.
3. **`upTo` = jüngstes Ereignis strikt vor „jetzt“** (die Aufgabe legt `upTo` nicht fest). So ist nichts aus der Zukunft enthalten.
4. **Uhr mehr als 24 h hinter `upTo` → nie Schnappschuss.** Sonst würde die Uhrenregel aus `ereignisse` die Reihenfolge vor `upTo` auf diesem Gerät ändern (Test 9).
5. **Schnappschüsse zählen nicht** – weder für die Schwelle noch in `count`/`idsHash`. `derive` beachtet sie ohnehin nicht.
6. **`makeSnapshot` und `stateFrom` sind `async`** (SHA-256 über Web Crypto, wie in `krypto`). `needsSnapshot` bleibt synchron.
7. **Browser-Test ergänzt** (die Aufgabe nennt nur Node-Tests), damit die Prüfsumme in Chromium genauso herauskommt.

## Hinweise für die nächsten Aufgaben
- **Welcher Schnappschuss:** `stateFrom` nimmt genau einen. Ein Gerät, das mit Schnappschuss S1 gestartet ist, kennt bei einem neueren S2 nur einen Teil der Ereignisse bis S2 → `nachladen`. Es bleibt dann besser bei S1 (dort ist es `schnappschuss`) – oder lädt nach. Diese Wahl gehört in 3b-2 / den Abgleich (`abgleich.holen` ist die Stelle).
- **Wann ein neuer Schnappschuss:** nach `needsSnapshot` und nach jedem Ergebnis `voll` auf einem Eltern-Gerät (verspätetes Ereignis).
- **Mögliche Verbesserung (nicht umgesetzt):** `upTo` etwas vor „jetzt“ legen (z. B. einen Tag), damit kurz offline geübte Ereignisse seltener „verspätet“ sind. Bewusst weggelassen: keine neue Einstellung ohne Not.

## Volle Reihe
**441/441 grün** (326 s, eigener Arbeitsordner, nach dem Einmergen von `main` mit Elternbereich F4–F6). Modulreihe allein: 167/167.

## Live-Bau
`index.html` unverändert; das Modul ist nur im Testbau (Rahmen-Test „Live-Bau enthält keine Stufe-2-Module“ grün).
