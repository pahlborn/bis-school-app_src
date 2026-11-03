# 2026-11-03 – Stufe 2, 3b-1b-1: Schreibhaken für Profil, Sprache des Kindes, storyCap, Tageshinweise, Checkliste

## Auftrag
Aufgabe 3b-1 (Schreibhaken), Teil b „Letzte gilt“. 3b-1b hat rund 30 Schreibstellen und mehrere offene Formatfragen. Darum ist es in vier PRs geteilt (**Entscheidung, Peter kann widersprechen**):

| Teil | Inhalt |
|---|---|
| **3b-1b-1** (dieser PR) | Einzelwerte mit vorhandenen Ereignistypen: Name, Geburtstag, Emoji, Sprache des Kindes (`kidLang`), Spannungsgrenze (`storyCap`), Tageshinweise (`greetDay`, `mysteryDone`, `bdayParty`), Checklisten (`chk_<Studio>`) |
| 3b-1b-2 | Listen je Eintrag: Freischaltungen (`unlocked`), manueller Fokus (`focusMode`, `focusManual`), Adventskalender – braucht einen neuen Ereignistyp |
| 3b-1b-3 | Lücken (`gaps`, Typen aus 3b-0) |
| 3b-1b-4 | Witze, Geschichten, Ton (`jokeSeen`, `storyRead`, `muted`; bisher „lokal“) |

Für Kathie ändert sich nichts: Im Live-Bau tut `eventHook` nichts (Test „Live-Bau (3b-1)“ grün).

## Änderungen
- `index.html`: 21 Haken an 16 Schreibstellen (nur `eventHook(...)`-Aufrufe; zwei `if/else` mit je eigenem Haken pro Zweig, damit Setzen und Löschen je ihr Ereignis haben):
  - Profil speichern: `profile_set` name / birthday / emoji (gelöscht = `value: null`); unveränderte Werte schreiben nichts.
  - Profil löschen (Eltern): drei `profile_set` mit `null`.
  - Sprache: `profile_set` kidLang **nur**, wenn `langKey()` `kidLang` ist (Kind angemeldet). Die Sprache der Erwachsenen (`parentLang`) folgt in 3b-1c.
  - `storyCap` (Eltern): `setting_set`.
  - Begrüßung (Anmeldung am ersten Tag, Skip, Witz, Escape), Rätsel, Geburtstagsfeier: `day_flag`.
  - Checkliste: je Klick `checklist_set` mit `size`; „Clear checklist“ schreibt je angehakter Zeile `value: false` und – wenn nichts angehakt war – ein Ereignis für Zeile 0, weil die App dann trotzdem die leere Liste speichert.
- `src/module/ereignisse.mjs`: `checklist_set` hat das optionale Feld **`size`** (Zahl der Zeilen).
- `src/module/ableitung.mjs`: `derive` füllt `chk_<Studio>` mit `false` bis zur größten `size` auf (die App speichert immer die ganze Liste). Ohne `size` wie bisher.
- `tests/module/schreiber.test.mjs`: Wächter – offene Liste 3b-1b nur noch `gaps`, `focusMode`, `focusManual`, `unlocked`, `advent`.
- `tests/module/ableitung.test.mjs`: Test „Checkliste: size“.
- `tests/schreibhaken-1b.test.mjs` (neu, 2 Browser-Tests mit echten Klicks): ohne Konten (Profil, Geburtstagsfeier, Checkliste mit Haken/Zurücknehmen/Leeren, leere Checkliste leeren, Runde + Rätsel, Eltern: `storyCap` und Profil löschen) und mit Konten (Begrüßung am ersten und zweiten Tag, Kinder-Anleitung → `kidLang`, Elternteil schaltet die Sprache des Elternbereichs um → kein `kidLang`). Nach jedem Schritt: `derive(Ereignisse)` = gespeicherter Wert für alle betroffenen Schlüssel, keine abgelehnten Ereignisse.
- `tests/konten-hilfen.mjs`: `kontenServer(…, { bauart })` (Testbau mit Konten).
- `package.json`, `src/module/module.json`: neuer Browser-Test.

## Gegenproben (alle rot)
15 Änderungen, jede macht mindestens einen Test rot: je ein fehlender Haken (`storyCap`, Checkliste anklicken, Leeren ohne Haken, Leeren schreibt Haken nicht zurück, `kidLang`, Geburtstag löschen, Profil löschen, Begrüßung bei Anmeldung, Skip, Geburtstagsfeier, Rätsel, Name), Checkliste ohne `size`, `derive` füllt nicht auf, `kidLang` auch für Erwachsene. Die letzte war zuerst grün; dafür schaltet im Kontentest jetzt ein Elternteil die Sprache um.

## Abweichungen und Entscheidungen (Peter kann widersprechen)
1. **3b-1b in vier PRs geteilt** (Tabelle oben).
2. **`checklist_set.size`** (optional): Ohne die Zahl der Zeilen wäre die abgeleitete Liste kürzer als die gespeicherte (nur bis zum höchsten Haken).
3. **Leeren ohne Haken schreibt ein Ereignis** (Zeile 0, `false`), weil die App dann die leere Liste speichert – sonst wäre der Schlüssel nur in der App vorhanden.

## Befund (nicht geändert)
- `storyCap` darf jeder Erwachsene bei offenem Erwachsenenbereich ändern (`if(parentAccess)`), auch eine Lehrkraft. Das Ereignis würde für eine Lehrkraft abgelehnt (`rolle-darf-nicht`, Rechte aus `annahme`), der gespeicherte Wert wäre trotzdem geändert. Ob die Lehrkraft die Einstellung überhaupt sieht, prüft der Test nicht. Das gehört zu den Rechten im Elternbereich (P3b bzw. eine eigene kleine Aufgabe).

## Volle Reihe
**448/448 grün** (575 s, eigener Arbeitsordner, nach dem Einmergen von `main` mit #103 „Veröffentlichen für alle Agenten“; Konflikt in der `test`-Zeile von `package.json`, beide Ergänzungen behalten).
