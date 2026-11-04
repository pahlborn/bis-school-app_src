# Lehrkraft und Admin sehen mit Freigabe den Namen des Kindes (04.11.2026)

Vorgabe Peter (03.11.): „Sie muss sehen, mit wem sie arbeitet.“ Lehrkraft und Admin sehen mit einer Freigabe den **Namen** (Anzeigename aus „My profile“) des Kindes. Geburtstag, Emoji und Einstellungen bleiben verborgen. Ersetzt die Regel aus S11 P4 („Den Anzeigenamen sieht er nie“, Prüfbericht `2026-11-02-stufe1-p4-freigaben.md`).

## Umgesetzt (`index.html`)
- **Kopfzeile:** Mit Freigabe steht dort „👧 Name (Anmeldename)“, z. B. „👧 Mia Sonnenschein (mia)“; in der Kinderliste (ab zwei Kindern) ebenso. Ohne Anzeigenamen bleibt der Anmeldename. Neue Hilfen `grantKidName`, `kidChipLabel`.
- **Eltern unverändert:** Ihr Kopf zeigt weiter nur den Anmeldenamen (sie kennen ihr Kind); in der Übersicht stand der Name bei ihnen schon vorher.
- **Übersicht:** „Auf einen Blick · Name“ und die Einschätzung („Name hat …“) nennen jetzt auch für Lehrkraft und Admin den Namen statt des Anmeldenamens.
- **Weiter verborgen:** Geburtstag, Emoji, „👧 Für <Kind>“ (Profilangaben, Pisolala-Grenze, Erinnerung), Sicherung, Freigaben. Admin ohne Freigabe: weiter keine Anzeigenamen in „🛠 Konten“.
- **Ende der Freigabe:** Mit Beenden oder Ablauf verschwindet das Kind samt Namen.
- **Einwilligungstext** (DE/EN, wird mit der Freigabe gespeichert): neuer Satz „<Person> sieht dabei den Namen Ihres Kindes, aber nicht Geburtstag, Emoji und Einstellungen.“ / „<person> will see your child’s name, but not the birthday, emoji or settings.“
- **Hinweis über den Freigaben:** „… sieht den Lernstand und den Namen Ihres Kindes nur, wenn Sie es hier freigeben …“ (DE/EN).
- **Anleitungen (DE/EN):** Eltern (Punkt Freigaben), Lehrkraft (Punkt Ansehen: „Oben steht der Name des Kindes, damit Sie wissen, mit wem Sie arbeiten. Geburtstag, Emoji und Einstellungen sehen Sie nicht.“), Admin (Punkt Lernstand eines Kindes).
- `docs/konzept/elternbereich.md` 5.9 (Kinderauswahl) nachgezogen.

## Prüfung
- `tests/stufe1-p4.test.mjs`:
  - Rechtematrix um drei Merkmale erweitert: Name im Kopf, Name in der Übersicht, übriges Profil (Geburtstag 17.05., Emoji 🦉). Lehrkraft und Admin mit Freigabe: Name ja, Profil nein; Eltern: Name in der Übersicht, Profil ja, Kopf unverändert; ohne/abgelaufene/beendete Freigabe: nichts.
  - K9 (echte Klicks): Einwilligungstext DE und EN wörtlich, gespeicherter Text im Protokoll, Kopf „👧 Mia Sonnenschein (mia)“, „Auf einen Blick · Mia Sonnenschein“, kein Geburtstag/Emoji, Kopf passt auf 320 px, Lehrkraft-Anleitung DE und EN.
  - Neu: Kinderliste der Lehrkraft mit zwei Freigaben (zwei Familien) zeigt „Lia (lia)“ und „Mia Sonnenschein (mia)“; Elternkopf bleibt „👧 mia“; nach Beenden der Freigabe kein Name mehr.
  - Neu: Anleitungen aller drei Rollen DE/EN nennen Name und „Geburtstag, Emoji und Einstellungen“; alter Satz „Den Namen aus dem Profil sehen Sie nicht“ ist weg.
- **Gegenproben (8 von 8 rot):** Name im Kopf fehlt; Elternprüfung fehlt (Eltern sähen „Name (Anmeldename)“); Übersicht nur Anmeldename; Lehrkraft sieht „Für <Kind>“ mit Profil; alter Einwilligungstext; alte Lehrkraft-Anleitung; Kinderliste ohne Namen; Admin-Anleitung EN ohne Namen.
- Volle Reihe: siehe PR.

## Hinweis
- Stufe 2 (Bereiche, P3b) hat den Namen schon im Bereich `kind:lern` (Lehrkraft mit Freigabe liest ihn); die Live-App folgt dem jetzt.
- Alte Freigaben behalten ihren damals gespeicherten Einwilligungstext (ohne den neuen Satz). Wirkung hat die neue Regel trotzdem sofort. *(Entscheidung, Peter kann widersprechen: keine erneute Einwilligung verlangen – heute gibt es keine echte Lehrkraft-Freigabe.)*
