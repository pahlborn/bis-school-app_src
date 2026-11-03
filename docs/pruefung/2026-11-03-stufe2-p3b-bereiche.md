# 2026-11-03 – Stufe 2, P3b: Bereiche und Rechte mit echten Schlüsseln (nur Testbau)

## Auftrag
Spezifikation S12, P3b (US10.4), Konzept 6 (Rechtematrix), 7.1 (Bereiche), 8 (Schlüssel). Die Rechtematrix war bisher nur fürs **Schreiben** geprüft (`annahme`). Fürs **Lesen** fehlte ein Test mit echten Schlüsseln. Dabei fielen zwei Widersprüche im Konzept auf (Lehrkraft hätte mit dem Kind-Schlüssel das ganze Profil lesen können; das Kindergerät braucht für Lücken die Schuldaten). **Erfolgskriterium:** Jede Zelle der Lese-Matrix als Test in der Simulation: erlaubt → entschlüsselt, verboten → kein Schlüssel. E6: Nach Ende einer Freigabe liest die Person nichts Neues mehr.

Grundlage sind Peters Entscheidungen vom 03.11.:
- Die Lehrkraft sieht mit Freigabe den **Namen** des Kindes.
- Kathies **Konto** enthält die Schulbewertungen. Damit kann die App rechnen; dem Kind werden sie nie gezeigt.
- Daten gehören zum Konto, nicht zum Gerät.

`index.html` ist unverändert. Das neue Modul ist **nur im Testbau** (`module.json`: `bau: test`, vor `annahme`). Nicht enthalten sind die Zulassung „zu diesem Zeitpunkt“ aus `member_*`/`device_*` (eigene Aufgabe P3b-2) und Einladungen.

## Änderungen
- `src/module/bereiche.mjs` (neu; Import nur aus `krypto`; Hilfsnamen `ber`/`BER_`):
  - `BEREICH_ARTEN`, `BEREICH_JE_TYP` (Typ → Bereich; bei `profile_set` je Feld; `snapshot` passt in jeden Bereich)
  - `bereichName(art, id)`, `bereichZerlegen(name)`, `bereichVonEreignis(e)`, `passtZumBereich(e, bereich)`
  - `bereicheFuer(rolle, freigabeUmfang)`, `halter(bereich, mitglieder, freigaben, heute)`
  - `schluesselLesen(zugang, bereich, { ich, meineSchluessel, mitglieder })` → `{ aktuell, keys, ungueltig }` (passt direkt als `schluessel` in `abgleich`)
  - `schluesselVerteilen(zugang, bereich, { soll, ich, meineSchluessel, mitglieder })` → `{ aktion, version, neu, entfernt }` (über `speicher.keys`/`putKey` mit `createKeyring`/`rotateKeyring`/`wrapKeyFor`)
- `src/module/annahme.mjs`: neue Prüfung **`bereich-falsch`**. Typ (bei `profile_set` das Feld) muss zum Bereich passen. Reihenfolge der Gründe jetzt: `format` → `autor-unbekannt` → `geraet-fremd` → `unterschrift` → **`bereich-falsch`** → `rolle-darf-nicht`. `ABGLEICH_GRUENDE` übernimmt den neuen Grund automatisch.
- `src/module/module.json`: `bereiche` (Testbau) zwischen `ableitung` und `annahme`.
- `tests/module/bereiche.test.mjs` (neu, 12 Tests, ca. 3 s).
- `tests/testbau.test.mjs`: ein Browser-Test (verteilen, wechseln, falscher Bereich in Chromium).
- Bestehende Tests auf die neuen Bereichsnamen umgestellt (fremde Bereichsnamen passen jetzt zu nichts):
  - `annahme.test.mjs`: Jedes Ereignis wird im Bereich seines Typs unterschrieben. Neu: Fälle `bereich-falsch` und die Reihenfolge.
  - `abgleich.test.mjs`: Bereich `kind:lern:p_k1`. Das Eltern-Ereignis `setting_set` (gehört nach `kind:privat`) ist durch `profile_set` Name ersetzt.
  - `schnappschuss.test.mjs`: Bereichsname.

## Bereichsschnitt (wie umgesetzt)
| Bereich (Name) | Inhalt (Ereignistypen) | Schlüssel haben |
|---|---|---|
| `kind:lern:<Kind>` | `answer`, `round_done`, `badge`, `review`, `practice_day`, `rank_seen`, `sheet_created`, `sheet_result`, `sheet_discarded`, `profile_set` **nur `name`** | Kind, Eltern, Freigabe mit „Lernstand“ |
| `kind:privat:<Kind>` | `profile_set` (`birthday`, `emoji`, `kidLang`), `setting_set`, `checklist_set`, `day_flag` | Kind, Eltern |
| `schule:<Kind>` | `school_import`, `gap_state`, `gap_active` | Kind (nur zum Rechnen, nie angezeigt), Eltern, Freigabe mit „Schuldaten“ |
| `eltern:allg:<Kind>` | `grant_set`, `grant_revoked`, `member_*`, `device_*`, `key_rotated` | Eltern |
| `freigabe:<Freigabe>` | `grant_opened` dieser Freigabe | Eltern; Empfänger, solange die Freigabe läuft |
| `person:<Person>` | (noch keine Typen; folgen mit 3b-1c) | die Person |
| jeder Bereich | `snapshot` | wie der Bereich |

## Entscheidungen (Peter kann widersprechen)
1. **Eigener Bereich `freigabe:<Kennung>` für „geöffnet“** (die Aufgabe ließ das offen):
   - Die Lehrkraft hat keinen Schlüssel für `eltern:allg`.
   - Legt sie `grant_opened` in `kind:lern` ab, liest das Kind das Freigabe-Protokoll mit. Laut Matrix 6 darf es das nicht.
   - Deshalb ein kleiner Bereich je Freigabe: Eltern lesen, der Empfänger schreibt, solange die Freigabe läuft.
   - `annahme` prüft dort zusätzlich, dass die Freigabe-Kennung im Ereignis zum Bereich passt.
2. **Bereichsnamen tragen die Kennung des Kindes.** Beispiel: `kind:lern:p_k1`. Ein Geschwisterkind hat eigene Bereiche und keinen Schlüssel für die des anderen. Ein Bereichsname außerhalb des Schemas (z. B. das alte `kid:p_k1`) passt zu keinem Ereignis. Die Prüfung ist streng: Was nicht ausdrücklich erlaubt ist, wird abgelehnt.
3. **Freigabe-Tage zählen mit:** Eine Freigabe gilt vom Tag `from` bis einschließlich `until`. Eine widerrufene Freigabe gilt nicht mehr. Freigaben öffnen nur für Lehrkraft und Admin etwas. Eine „Freigabe“ an ein Kind oder einen Elternteil ändert nichts.
4. **Ein neuer Halter bekommt die ganze Geschichte.** Gemeint sind der zweite oder dritte Elternteil und eine erneute Freigabe. Sie erhalten alle Versionen, die der Verteiler hat, nicht nur die aktuelle. Sonst sähe eine neue Lehrkraft nach einem früheren Schlüsselwechsel den alten Lernstand nicht.
5. **Schlüsseleinträge sind unterschrieben** (Konzept 8.5 „Schlüssel unterschieben“):
   - Je Halter und Bereich liegt im Speicher `{ v: 1, von, versionen, sig }`. Die Unterschrift deckt Bereich, Halter und Inhalt ab.
   - Verteilen dürfen nur Eltern; bei `person:<id>` nur die Person selbst.
   - Andere oder kaputte Einträge werden nicht benutzt und unter `ungueltig` gemeldet.
   - So kann niemand mit Schreibzugriff auf den Speicher eine Schlüsselversion unterschieben, die er selbst kennt.
6. **Eingabe `freigaben` von `halter`:** Gemeint sind nur die Freigaben dieses Kindes, also aus seinem `eltern:allg`. Das Ereignis `grant_set` nennt das Kind nicht, weil es im Bereich des Kindes liegt.
7. Der Bereich heißt `schule` (wie in der Tabelle der Aufgabe), nicht `eltern:schule`, weil auch das Kind den Schlüssel hat.

## Tests (alle grün)
1. **Lese-Matrix (Konzept 6):** 11 Personen × 7 Bereiche, je mit echten Schlüsseln über `speicher`, `abgleich.holen` und `annahme`:

   | Person | Lernstand inkl. Name | Profil privat | Schule | Eltern allg. | Protokoll g1 | Protokoll g2 | Person p_e1 |
   |---|---|---|---|---|---|---|---|
   | Kind | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
   | Geschwisterkind | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
   | Elternteil | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
   | zweiter Elternteil | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
   | Lehrkraft „Lernstand“ (g1) | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
   | Lehrkraft „Lernstand + Schuldaten“ (g2) | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
   | Lehrkraft ohne Freigabe | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
   | Admin ohne Freigabe | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
   | Admin mit Freigabe „Lernstand“ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
   | fremde Familie (Kind heißt auch Kathie) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
   | fremde Familie, Elternteil | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

   - ✅ = alle Einträge entschlüsselt und angenommen; ❌ = kein Schlüssel und nichts gelesen.
   - **Querprobe:** Mit allen Schlüsseln, die eine Person irgendwo hat (auch aus der eigenen fremden Familie), öffnet sich kein verbotener Eintrag.
   - Umgekehrt liest unsere Familie nichts von der fremden.
2. **Profil:**
   - Lehrkraft und Admin mit Freigabe lesen die Antworten und den Namen (`derive` → `name: 'Kathie'`).
   - In allem, was sie überhaupt entschlüsseln können, kommen Geburtstag, Emoji, Einstellungen, Tageshinweise, Mitglieder und Freigaben nicht vor.
3. **Kind und Schule:**
   - Das Konto des Kindes liest `school_import` und Lücken (zum Rechnen).
   - Sein automatisches Schließen wird angenommen.
   - „Halten“ durch das Kind, Schuldaten vom Kind und Schuldaten von der Lehrkraft werden mit `rolle-darf-nicht` verworfen.
   - Für `eltern:allg` und das Freigabe-Protokoll hat das Kind keinen Schlüssel („aktueller Schluessel fehlt“).
   - Kind und Lehrkraft verteilen keine Schlüssel; ein zweiter Elternteil nicht in fremde Personen-Bereiche.
4. **E6:**
   - Nach Ablauf von g1 wechseln `kind:lern` und `freigabe:g1` auf Version 2. Alle anderen Bereiche bleiben, und ein zweiter Lauf ändert nichts.
   - Die Ex-Lehrkraft liest die alten Einträge, den neuen nicht (Bündel bleibt `wartend`). Sie protokolliert nichts mehr.
   - Alle anderen Halter lesen den neuen Eintrag.
   - Widerruf von g2 am selben Tag: `kind:lern` (v3), `schule` (v2) und `freigabe:g2` wechseln. Die Lehrkraft behält die alten Schuldaten (schon gesehen), bekommt aber keine neuen.
   - Das Kind liest alles (Versionen 1–3).
5. **Typ und Bereich:**
   - Jeder der 25 Typen hat genau einen Bereich (ausgeschriebene Tabelle). Kommt ein neuer Typ dazu, wird der Test rot, bis er eingetragen ist.
   - 18 Fälle „richtig unterschrieben, falscher Bereich“ ergeben `bereich-falsch`, darunter Geburtstag in `kind:lern`, `grant_opened g2` im Protokoll g1, `setting_set` im Personen-Bereich und alte bzw. kaputte Bereichsnamen.
   - Ein Schnappschuss passt überall.
   - Über den Abgleich gilt: Das Kind legt den Geburtstag in `kind:lern` ab (Schlüssel hat es) → die Eltern verwerfen ihn mit `bereich-falsch`.
6. **E5 – Speicher sieht nichts:** Im Abzug aller Bereiche (Bündel und Schlüssel, ca. 24 KB) stehen kein Name, kein Geburtstag, keine Standards und keine Ereignistypen.
7. **Untergeschobene Schlüssel:** Sieben Fälschungen (fremde Unterschrift, Kind als Verteiler, Eintrag kopiert auf anderen Halter oder aus anderem Bereich, falsches Format, ohne Unterschrift, unbekannter Verteiler) werden nicht benutzt. Das Kind schreibt weiter mit Version 1. Ein überschriebener Eintrag des Kindes heilt beim nächsten Verteilen durch die Eltern („ergaenzt“).
8. **Neue Halter:**
   - Ein dritter Elternteil nach einem Schlüsselwechsel liest alles von Anfang an.
   - Eine erneute Freigabe für die Ex-Lehrkraft bekommt alle Versionen.
   - Der zweite Elternteil kann verteilen.
   - Ohne aktuellen Schlüssel kann niemand verteilen.
   - Doppelte Halter und unbekannte Bereiche brechen ab.
9. **Halter und Rollen:**
   - `bereicheFuer` je Rolle und Umfang.
   - `halter` mit Datum (beide Tage), Widerruf, unbekanntem Empfänger, Umfang „nur Schuldaten“, Geschwisterkind, Personen-Bereich und Mitglied ohne öffentlichen Schlüssel.
10. **Schreibrechte passen zu den Schlüsseln:** Jeder Typ, den eine Rolle schreiben darf, liegt in einem Bereich, für den sie den Schlüssel hat. Einzige Ausnahme ist `child device_added` (siehe Befund A).
11. **Reinheit** (kein Netz, keine Uhr, kein eigener Zufall; Import nur `krypto`; Reihenfolge in `module.json`).

Browser (Testbau, Chromium): verteilen → nach Ablauf wechseln (Lehrkraft: aktuell 2, Schlüssel nur Version 1) → Geburtstag in `kind:lern` → `bereich-falsch`.

Dazu `npm run test:module` 180/180 grün; `index.html` und alle Live-Module sind unverändert, `bereiche` ist nur im Testbau.

## Gegenproben (alle rot)
21 absichtliche Fehler, je als Änderung am Modul (Skript `p3b-gegenproben.mjs`, nicht im Repo):

| Gegenprobe | rote Tests |
|---|---|
| Geburtstag in `kind:lern` | 3 |
| Lehrkraft bekommt `kind:privat` | 4 |
| Freigabe ohne Schuldaten bekommt `schule` | 3 |
| Kind bekommt `eltern:allg` | 4 |
| kein Schlüsselwechsel bei Ablauf | 2 |
| Typ-Bereich-Prüfung fehlt (`annahme`) | 4 |
| Datum der Freigabe ignorieren | 3 |
| Widerruf ignorieren | 2 |
| Geschwisterkind bekommt den Bereich des Kindes | 2 |
| Kind ohne Schuldaten im Konto (gegen Peters Entscheidung) | 10 |
| Name nicht im Lernbereich (gegen Peters Entscheidung) | 7 |
| Unterschrift der Schlüsseleinträge nicht prüfen | 1 |
| jeder Angehörige darf Schlüsseleinträge ausstellen | 1 |
| Kind darf verteilen | 2 |
| neuer Halter bekommt nur die aktuelle Version | 1 |
| `grant_opened` im fremden Freigabe-Protokoll | 1 |
| unbekannter Bereichsname passt zu allem | 3 |
| Freigabe an Kind oder Elternteil öffnet Bereiche | 1 |
| Personen-Bereich auch für andere Eltern | 2 |
| Bereich erst nach der Rolle prüfen | 2 |
| `aktuell` = eigene statt neueste Version | 1 |

## Befunde und offene Punkte (für P3b-2)
- **A – Gerät anmelden und Zulassung lesen:**
  - `device_added` und `member_*` liegen laut Bereichsschnitt in `eltern:allg`.
  - Das Kindergerät meldet sich aber selbst an (Recht aus Aufgabe 4) und hat dort keinen Schlüssel.
  - Allgemeiner: Jedes lesende Gerät braucht die Liste der Mitglieder und Geräte, um Unterschriften zu prüfen (`zulassung`). Kind und Lehrkraft können `eltern:allg` nicht lesen.
  - P3b-2 muss festlegen, wie die Zulassung zu Kind und Lehrkraft kommt. Vorschlag: eine von den Eltern unterschriebene Mitglieder- und Geräteliste je Bereich; das Kind meldet sein Gerät in `kind:privat` an.
  - Der Test „Schreibrechte passen zu den Schlüsseln“ hält diese Ausnahme fest.
- **B – Ex-Halter schreibt mit alter Version:**
  - Eine ehrliche App kann nach einem Schlüsselwechsel nicht mehr schreiben („aktueller Schluessel fehlt“).
  - Eine veränderte App könnte aber ein Bündel mit der alten Version ablegen. Die Leser haben diese Version, und `annahme` prüft (noch) nicht, ob der Autor *zu diesem Zeitpunkt* zugelassen war.
  - Betroffen ist nur, was die Rolle überhaupt schreiben darf. Für die Ex-Lehrkraft ist das nur `grant_opened`.
  - Lösung in P3b-2: Zulassung zu diesem Zeitpunkt. Zusätzlich sollen Bündel mit alter Version nur noch angenommen werden, wenn ihre Ereignisse vor dem Wechsel liegen.
- **C – Speicher kann Einträge zurücksetzen:** Wer in den Speicher schreiben kann, kann einen älteren gültigen Schlüsseleintrag zurücklegen oder einen löschen. Folge: Der Halter liest Neues erst nach dem nächsten Verteilen durch die Eltern. Es wird nichts lesbar, was nicht lesbar sein soll. Das entspricht dem bekannten Restrisiko „kann Daten löschen“ (Konzept 8.5).
- **D – `key_rotated`** nennt nur die Version, nicht den Bereich. Seit P3b erkennt man den Wechsel an den unterschriebenen Schlüsseleinträgen. Ob das Ereignis noch gebraucht wird oder ein Feld `area` bekommt, entscheidet P3b-2.
- **E – Neue Ereignistypen** (z. B. Advent in 3b-1b-2; Witze, Geschichten, Ton in 3b-1b-4; Personen-Einstellungen in 3b-1c) brauchen einen Eintrag in `BEREICH_JE_TYP`. Der Test wird sonst rot.
- **F – `storyCap` durch die Lehrkraft** (Befund aus 3b-1b-1, `index.html`): bleibt offen. P3b ändert `index.html` nicht. Vorschlag: kleine eigene Aufgabe im Elternbereich.
