# 2026-11-04 – Stufe 2, 3b-2a: Der Testbau liest aus Ereignissen

## Auftrag
Teil a von 3b-2 (Vault: „Aufgabe 3b-2 – Lesen umstellen und Abschluss Stufe 2“). Bis jetzt schrieb der Testbau alle Ereignisse mit, las aber weiter den alten Speicher. Jetzt kommen im **Testbau** alle abzugleichenden Werte aus `derive(Ereignisse)`; der alte Speicher wird für diese Werte dort nicht mehr geschrieben. **Live-Bau unverändert.** Nicht veröffentlicht.

## Änderungen
- **Neues Modul `src/module/lesen.mjs`** (nur Testbau, nach `zulassung`):
  - `lesenArt(key)`: `'kind'` | `'person'` | `null` – welche Werte aus einem Protokoll kommen. Liste gegen `werkzeug/speicherstellen.json` geprüft (alles mit Abgleich `protokoll`, `abgeleitet` oder `letzte-gilt`).
  - `evProtokoll({ laden, speichern, basis, now })`: ein Protokoll mit Zwischenstand. Die Liste wird einmal gelesen und im Speicher gehalten. Ein neues Ereignis wird **fortgeschrieben** (`derive` mit `base`). Ganz neu gerechnet wird nur, wenn es nicht einfach „später“ ist (frühere Zeit, mehrere auf einmal, ersetzte Liste), und nach `neuLaden()`, also nach einem Abgleich. `version()` ändert sich mit jeder neuen Liste.
  - `altStand(werte)`: Die alten gespeicherten Werte eines Kindes sind der **feste Ausgangsstand** (nur lesen). Die Übungstage werden wie in der App gezählt, damit der Baum weiterwächst. Mit 3c wird daraus ein `snapshot`.
  - `grantsAblauf(stand, heute)`: „abgelaufen“ folgt aus `until`. Die Freigabe wird markiert, und das Protokoll bekommt den Eintrag am ersten Tag danach (00:00 UTC), in Zeitfolge. Beendete Freigaben laufen nicht ab.
- **`index.html`** (Weiche, im Live-Bau wirkungslos: `EV_LESEN` ist dort `false`):
  - `store.get` liefert für diese Schlüssel den Wert aus dem Protokoll (als Kopie). `store.set` und `store.del` tun dafür nichts: Die Änderung ist das Ereignis daneben.
  - **Kind-Werte:** aus dem Protokoll des gezeigten Kindes.
  - **Person-Werte** (`parentLang`, `muted`, `conceptSeen`, `glance`): aus dem Protokoll der handelnden Person. Den Ton eines Kindes gibt es aus dessen Protokoll. „Auf einen Blick“ bleibt bei Lehrkraft und Admin auf dem Gerät (wie 3b-1c).
  - **Ohne Bereich bleibt der alte Speicher:** Ohne Kind-Bereich (Konten an, kein Kind gezeigt) und ohne Person (Anmeldeseite) gibt es kein Protokoll.
  - `eventHook`: Der Schreiber liest und schreibt über die Protokolle (`evKindLog`, `evPersonLog`) und liest nicht mehr bei jedem Ereignis die ganze Liste.
  - `kidRead`/`kidWrite` (Freigaben eines Kindes): ebenso über das Protokoll dieses Kindes.
  - **Ton je Person:** `isMuted()` liest jedes Mal neu, statt einmal beim Start.
  - **Fokus-Themen:** Der Zwischenspeicher der Startseite hängt zusätzlich am Stand des Protokolls (`evVersion`). Bisher hing er nur an Rohwerten des alten Speichers und wäre im Testbau stehen geblieben.
  - **„Who's here?“:** Name und Emoji kommen aus dem Protokoll.
  - **Sicherung:** `backupData()` nimmt im Testbau die Werte aus dem Protokoll. **Zurückspielen ist im Testbau gesperrt** (Meldung, siehe Ausschlüsse).
  - **Bereinigung:** Wenn `cleanStoredPrivate` alte Werte ändert, wird einmal neu gerechnet.
  - **Kleiner Fix aus 3b-1c (nur Testbau):** Beim Wechsel der Person startet die neue Person mit geschlossenen Kapiteln (`state.popen`). „So funktioniert“ zählt für die Lehrkraft nicht mehr als gelesen.
- **`ableitung`:** Solange der Fokus nicht „manuell“ ist, merkt sich `derive` die Fokusliste in `_focusManual` (wie `_days`, kein Speicherschlüssel). Sonst ergab „Ausgangsstand + neue Ereignisse“ etwas anderes als alle Ereignisse zusammen, wenn Einträge eines anderen Geräts dabei waren (gefunden mit dem Fortschreib-Test, siehe unten). Das betrifft auch Schnappschüsse (Aufgabe 5).
- **`werkzeug/speicherstellen.json`:** `treeStage` ist jetzt „lokal“ (Gerätenotiz, siehe Entscheidungen). `bq2_personEvents` steht unter „direkt“.

## Tests
- `tests/module/lesen.test.mjs` (9):
  - Weiche gegen das Verzeichnis.
  - 600 Zufallsereignisse nacheinander: Der Zwischenstand ist nach jedem gleich dem vollen `derive`; die Liste wird nur einmal gelesen, einmal ganz gerechnet, 600-mal fortgeschrieben.
  - Nicht-„später“ wird neu gerechnet.
  - Abgleich: Ohne `neuLaden` bleibt der alte Stand, mit `neuLaden` stimmt es, danach geht es wieder ans Fortschreiben.
  - Alter Speicher als Ausgangsstand; `grantsAblauf`; Messwert; Reinheit.
- `tests/testbau-lesen.test.mjs` (8, echte App in der Node-Sandbox, Testbau):
  - Nach Runden steht kein abzugleichender Wert im alten Speicher; die App liest `derive(Ereignisse)`; Zwischenstand einmal ganz, sonst fortgeschrieben.
  - Abgleich mit fremden Ereignissen (vor/nach `evNeuLaden`); Ton je Person; „abgelaufen“; Sicherung aus dem Protokoll.
  - Live-Bau liest und schreibt keine Ereignisse; Messwert mit 5 000 Ereignissen; Fokus-Themen folgen den Ereignissen.
- `tests/ableitung-vergleich.test.mjs`, **neu: Testbau = Live-Bau.** Derselbe Klick-Verlauf (Runden mit Tipp, Beispiel, Lösung, zweitem Versuch, Abbruch, zwei Übungsblätter, Wiederholungen an vier Tagen) mit gleichen Zufallszahlen in beiden Bauarten.
  - **Jeder Wert, den der Live-Bau speichert, ist im Testbau genau so aus den Ereignissen gelesen.**
  - Der Testbau hat dafür nichts im alten Speicher.
  - Dazu wie bisher `derive` in Node = Chromium und die Prüfungen der Ereignisse.
- `tests/testbau-bedienwege.test.mjs`: gegen den **Testbau** die langen Aufgaben-Durchläufe in der Sandbox (`aufgaben-node`, `aufgaben-anpassung`) und die Bedienwege `showme`, `blaetter`, `profil`, `titel`, `spass` im Browser (57 Tests, ~65 s).
- **Testlauf gegen den Testbau, ganze Reihe** (`BQ_BAUART=test npm test`, einmal): **583/591** (236 s); die 8 roten sind unten unter „Ausschlüsse“ begründet. Die Browser-Tests lesen und legen den Speicher dabei über `tests/testbau-leser.mjs`:
  - Die App behält ihren echten Speicher.
  - Liest ein Test einen abzugleichenden Schlüssel, antwortet die App aus dem Protokoll.
  - Legt ein Test einen Wert, wird er alter Wert. Wenn ein Ereignis ihn überdecken würde, wird der heutige Stand der neue Ausgangsstand.
- `appSandbox`, `appServer`, `kontenServer`: `bauart` folgt `BQ_BAUART`. Die Sandbox hat `setzen(k, v)`; im Testbau wird danach neu gerechnet.
- `tests/module/schreiber.test.mjs` (Wächter): `events`/`personEvents` schreibt das Protokoll selbst, an genau einer Stelle. `treeStage` ist kein abgeleiteter Wert mehr.
- `tests/schreibhaken-1b.test.mjs`: Der Vergleich liest die Werte über die App. Der Teil „Lehrkraft und So funktioniert“ prüft jetzt den Fix.

### Messwert (5 000 Ereignisse)
- Modul: alles durchrechnen 70–110 ms. Eine Antwort mit 2 Ereignissen schreiben und 5 Werten lesen dauert im Median 9–16 ms, höchstens ~28 ms. Dabei wird die ganze Liste als JSON gespeichert.
- App (Sandbox): Start 80 ms. Eine Antwort: Median 3,5 ms, höchstens 8 ms. Startseite nach der Runde: 6 ms.
- Mit dem Zwischenstand wird bei Antworten nicht mehr alles neu gerechnet.

## Gegenproben (alle 18 rot)
Skript `%TEMP%\opencode\gegenproben-3b2a.mjs`.

| # | Gegenprobe | erkannt von |
|---|---|---|
| 1 | ein abgeleiteter Wert (`attempts`) doch aus dem alten Speicher | Sandbox, Testbau = Live-Bau |
| 2 | Testbau schreibt den alten Speicher weiter | Sandbox, Testbau = Live-Bau |
| 3 | Zwischenstand nach Abgleich nicht neu gerechnet (App) | Sandbox |
| 4 | Modul: `neuLaden` verwirft den Zwischenstand nicht | Modul |
| 5 | Ton wieder je Gerät | Sandbox |
| 6 | Live-Bau liest Ereignisse | Sandbox |
| 7 | fortgeschrieben, obwohl nicht später | Modul |
| 8 | fortgeschrieben ohne „genau eins angehängt“ | Modul |
| 9 | „abgelaufen“ nicht aus dem Enddatum | Sandbox |
| 10 | „abgelaufen“ am Tag selbst | Modul |
| 11 | Werte ohne Kopie (App verändert den Zwischenstand) | Sandbox, Testbau = Live-Bau |
| 12 | Fokus-Zwischenspeicher ohne Stand des Protokolls | Sandbox |
| 13 | `derive` ohne `_focusManual` | Modul |
| 14 | Kapitel bleibt beim Personenwechsel offen | schreibhaken-1b |
| 15 | Sicherung aus dem alten Speicher | Sandbox |
| 16 | `treeStage` aus Ereignissen | Modul, Testbau = Live-Bau |
| 17 | Freigaben (`kidRead`) aus dem alten Speicher | schreibhaken-1b |
| 18 | Liste bei jedem Ereignis neu gelesen | Modul |

## Sonderwege ohne Ereignis (aus 3b-1a)
- **Umzug auf Kennungen** (`migrateToIds`): **kein Ereignis nötig.** Der Umzug ändert keinen Inhalt, nur den Ort. Die Ereignisliste `bq2_events` zieht wie jeder Kind-Schlüssel mit um und wird Zeichen für Zeichen geprüft; `personEvents` ist geräteweit. Der Umzug läuft vor jedem Lesen.
- **Bereinigung alter Fragen** (`cleanStoredPrivate`): **Ausschluss für Ereignisse.** Ereignisse werden nie geändert (später unterschrieben); bereinigt wird nur der alte Ausgangsstand, danach wird neu gerechnet. Fragen in Ereignissen entstehen schon nach den Bereinigungsregeln. Die Umwandlung in einen Basisstand (3c) bereinigt vorher.
- **Zurückspielen einer Sicherung:** **im Testbau gesperrt.** Alte Werte unter den Ereignissen würden beides vermischen; Rückgängig ebenso. Das wird Aufgabe 6 (Sicherung als Ereignisse einlesen). Die Sicherung **erstellen** geht und nimmt die Werte aus dem Protokoll; die Ereignisse selbst kommen mit Aufgabe 6 hinein.

## Ausschlüsse beim Testlauf gegen den Testbau
Ganze Reihe gegen den Testbau: 583/591. Die 8 roten:
- **Zurückspielen einer Sicherung** – im Testbau gesperrt, kommt mit Aufgabe 6: `altlasten` (Zurückspielen einer alten Datei) und `stufe1-p1` „Sicherung …“ (dort zusätzlich: `events` ist absichtlich nicht in der Sicherung).
- **Ablage des Live-Baus**: `stufe1-ist` „Speicher nach Kennung“ und `stufe1-p4` „Freigabe …“ prüfen, welche Schlüssel physisch dastehen (`bq2_<id>__attempts`, `__grants`). Im Testbau stehen dort die Ereignisse.
- **Kind ruft Eltern-Funktion direkt auf**: `elternbereich-d1` und `-d2` rufen als angemeldetes Kind `setFocusMode('manual')` direkt im Code auf. Im Testbau wird das Ereignis abgelehnt (das Kind darf den Fokus nicht setzen), der Fokus bleibt also automatisch. Das ist richtig so; in der Oberfläche können das nur Eltern.
- **Zufall, nicht nachstellbar**: `aufgaben-node` „Fragen aller Quests“ meldete einmal eine doppelte Aufgabe in Specific Examples. In 8 Wiederholungen (je 4 Live- und Testbau) und mit den Startwerten des Laufs blieb es grün. Specific Examples hat nur 9 Vorlagen (bekannt, Ideenspeicher Punkt 11); die Runden bauen nicht auf den Speicher.
- **Messwert unter Last**: `testbau-lesen` „Messwert“ mass im vollen Lauf (7 Dateien gleichzeitig mit Browsern) im Median 113 ms statt ~4 ms allein. Die Grenze ist jetzt 250 ms; sie fängt ein vollständiges Durchrechnen je Antwort weiterhin ab.

## Entscheidungen (Peter kann widersprechen)
1. **Alter Speicher = fester Ausgangsstand** im Testbau (nur lesen), bis 3c ihn in einen `snapshot` umwandelt. So bleiben vorhandene Daten sichtbar, und keine Werte werden doppelt gezählt (der Testbau schreibt die alten Werte nie wieder).
2. **`treeStage` wird Gerätenotiz:** Er steuert nur den Hinweis „Dein Baum ist gewachsen“ (einmal je Gerät); der Baum selbst folgt den Übungstagen aus den Ereignissen. Aus Ereignissen gelesen käme der Hinweis nie, weil der Stand schon gewachsen ist, bevor die Startseite vergleicht.
3. **„abgelaufen“ steht am ersten Tag nach `until`** (00:00 UTC) im Protokoll. Im Live-Bau steht dort der Zeitpunkt, an dem jemand die Seite geöffnet hat.
4. **Sprache auf der Anmeldeseite:** Ohne angemeldete Person gilt die alte Gerätesprache (fest). Nach der Anmeldung gilt die eigene Sprache.
5. **Kapitel-Fix nur im Testbau**, weil sich der Live-Bau nicht ändern sollte. Live ist er wirkungslos, solange es dort keine Lehrkraft gibt; falls gewünscht: eine Zeile.
6. **Ohne Kind-Bereich** (Startseite hinter der Anmeldung) bleibt der alte Speicher wie bisher (`rankSeen` ohne Kind, 3b-1b-3).

## Befund (behoben)
`derive` mit Ausgangsstand ≠ `derive` aller Ereignisse bei der Fokusliste. Einträge eines anderen Geräts, die bei „automatisch“ verborgen sind, gingen im Ausgangsstand verloren und tauchten beim vollen Rechnen wieder auf. Jetzt `_focusManual`; Gegenprobe 13.

## Volle Reihe
**591/591 grün** (219 s, eigener Arbeitsordner, mit `main` = 6e54448: #118 Lehrkraft sieht Namen, #119 Altlasten weg). Die Reihe ist um ~65 s länger, weil `testbau-bedienwege` die Aufgaben-Durchläufe und fünf Bedienwege noch einmal gegen den Testbau laufen lässt; wer das kürzer will, nimmt dort Bedienwege heraus.
