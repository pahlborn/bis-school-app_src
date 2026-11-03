# Elternbereich F1: Hilfe (03.11.2026)

Paket F1 aus `docs/konzept/elternbereich-auftraege.md` (Konzept 7.0, 7.3, 7.6, 7.7).

## Anliegen
Die Elternhilfe unter **?** bestand aus einer Kurzanleitung, einem Absatz „Das Wichtigste vorab“, acht langen Schritten und „Gut zu wissen“, zusammen etwa 6 000 Zeichen. Vieles stand doppelt: Kurzanleitung und Schritte, Sicherung und Freigaben auch in ⚙. Dazu kamen Technik und eine Beschreibung aller Kapitel. Für Lehrkräfte gab es ebenfalls Kurzanleitung und Schritte. Die Admin-Hilfe beschrieb noch den Knopf „🧪 Testkind“, den es seit B1 nicht mehr gibt.

## Umgesetzt
- **Eine Fassung je Rolle**, als nummerierte Liste ohne zweite Kurzfassung (DE und EN):
  - **Eltern** (7 Punkte nach 7.3): Einmal einrichten · Anmelden · Kind anmelden · Nachsehen (**danach abmelden**) · Sichern → ⚙ · Freigaben → ⚙ · Passwort vergessen. Etwa 1 100 Zeichen.
  - **Lehrkräfte** (6 Punkte): Anmelden · Einblick nur mit Freigabe · Ansehen · Protokoll · Wofür · Passwort vergessen. Etwa 800 Zeichen.
  - **Admin**: die Elternhilfe plus 4 Punkte (Konten und Startcodes · Übersicht der Konten → ⚙ · Lernstand nur mit Freigabe · Testkinder in der Kinderauswahl). Etwa 1 600 Zeichen zusammen.
- **Verweise auf ⚙ als Link mit Route:** „⚙️ → „💾 Sicherung & Daten““ öffnet `#eltern/einstellungen/sicherung`, ebenso „🔐 Zugriff & Freigaben“ und „🛠 Konten“. Der Abschnitt ist dann aufgeklappt.
- **Verweise nach 7.7:** Im Willkommen steht jetzt „Die Hilfe finden Sie oben unter ?“ statt „Die Anleitung …“ (EN „Help is at the top under ?“). Die Seite „So funktioniert Big Quest“ zeigt die Elternhilfe weiter im Abschnitt „Anleitung für Erwachsene“, ohne doppelte Überschrift. Den Abschnitt prüft F2/F3 mit.
- **Nicht mehr benutzte Texte entfernt:** `howHome`, `howSettings`, `howHelp` (DE/EN).

## Weggefallen (alt → neu)
| Alt | Neu |
|---|---|
| Kurzanleitung für Eltern (6 Punkte) und ausführliche Schritte (8 Punkte) | eine Liste mit 7 Punkten |
| „Das Wichtigste vorab: Die App hat keinen Server … Ein Abgleich zwischen Geräten ist in Vorbereitung.“ | Punkt 4: „Der Lernstand liegt nur auf dem Gerät, auf dem Ihr Kind übt.“ |
| „Die Home-Bildschirm-App hat einen eigenen Speicher und fragt … noch einmal nach dem Familienpasswort.“ | gestrichen (Technik) |
| „mindestens 12 Zeichen und nicht leicht zu erraten“, „danach füllt Face ID oder Touch ID es aus“, „Ein älteres, kürzeres Passwort fragt die App einmal neu ab.“ | „am einfachsten den Vorschlag übernehmen und im Passwortspeicher sichern“ |
| „Sie bleiben angemeldet, bis Sie oben „Abmelden“ tippen …“ | gestrichen (steht im Willkommen) |
| „Meine Kinder: … auch ohne dass sich das Kind angemeldet hat … Ist ein anderes Kind angemeldet …“ | Punkt 4, ein Satz: „Mit mehreren Kindern wählen Sie oben aus.“ |
| „Im Elternbereich: oben die Übersicht … darunter zum Aufklappen: …“ (Aufzählung der Kapitel) | gestrichen (Selbsterklärung) |
| „Zugriff & Freigaben: … Anmeldename eintragen, Umfang, Dauer 1–90 Tage … Protokoll …“ | Punkt 6 mit Link; die Einzelheiten stehen in ⚙ |
| „Sicherung: … eine veränderte Datei … nimmt die App nicht an. … „Rückgängig“ einmal …“ | Punkt 5 mit Link; die Einzelheiten stehen in ⚙ |
| „Für das Kind: Practise Today oder ein Fach; … Witz, Rätsel oder Geschichte.“ | gestrichen (Beschreibung der Kinderseite) |
| „Gut zu wissen: … Neue Versionen lädt die App beim Start … selbst.“ | Punkt 7 ohne Technik |
| Lehrkraft: Kurzanleitung und 6 Schritte, „Was Sie nicht sehen oder tun können: keine Einstellungen, kein Fokus …“, „(einmal pro Tag vermerkt)“ | 6 Punkte, ohne die Liste dessen, was nicht geht |
| Admin: „„🧪 Testkind“ öffnet das Testkonto … „↩ Zurück zum Elternbereich“ …“ | „Testkinder: oben in der Kinderauswahl unter „🧪 Testkinder“ …“ (Stand seit B1/B5) |
| „Meine Kinder“-Karte: „… der Abgleich zwischen Geräten folgt mit Stufe 2.“ | „Sie sehen sie dort.“ |
| `howHome` „So lesen Sie diese Seite …“, `howSettings`/`howHelp` „Was kann ich hier tun? …“ | entfernt (wurden nicht mehr angezeigt) |

## Prüfung
- Neu: `tests/elternbereich-f1.test.mjs`, für Eltern, Lehrkraft und Admin jeweils DE und EN:
  - **T5 (Hilfe):** Jeder Link „⚙️ → „…““ nennt einen Abschnitt, den es in ⚙ gibt, und öffnet ihn aufgeklappt.
  - **T7:** höchstens 2 000 Zeichen.
  - **T12:** Die Sätze der Streichliste kommen in der Hilfe nicht vor. „So lesen Sie diese Seite“, „Was kann ich hier tun“ und „… mit Stufe 2“ stehen nirgends mehr in der App.
  - Die 7 Punkte für Eltern stehen in der Reihenfolge aus 7.3; die Lehrkraft sieht nur ihre Punkte.
- Angepasst: `elternbereich-b2` und `hilfe-rollen` (neue Überschriften „Hilfe für Eltern/Lehrkräfte“, „🧪 Testkinder“), `elternbereich-a1` (englischer Willkommenssatz).
- Gegenprobe: F1-Test mit der App von `main` rot (0 von 2).
- `npm test`: 399 bestanden. Die Zahl ist höher als bei E3, weil `main` inzwischen #89 und #90 enthält.
- Bildschirmfoto der Elternhilfe (390 px) durchgesehen.

## Gefunden
- **Knopf ?** im gedrückten Zustand: Das Fragezeichen ist auf dem blauen Hintergrund kaum zu sehen. Bei ⚙ war es in B1 genauso und wurde mit ⚙️ behoben. Vorschlag: helle Schrift für `.phdr-icon.primary` (klein, eigener Schritt oder in F6).
- Die Admin-Hilfe enthält die Elternhilfe mit Links auf Sicherung und Freigaben. Ein Admin ohne eigenes Kind hat diese Abschnitte nicht. Für Peter (Admin und Vater) passt es. Ein reines Admin-Konto ist Sache des Dev-Agenten (`docs/konzept/admin.md`).
