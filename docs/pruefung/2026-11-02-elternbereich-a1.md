# Elternbereich A1: drei falsche Texte (02.11.2026)

Paket A1 aus `docs/konzept/elternbereich-auftraege.md` (Konzept: `docs/konzept/elternbereich.md`, Befunde B1–B3).

## Anliegen
- **B1:** Das Willkommen für Erwachsene verwies auf das Kapitel „📖 Anleitung & Hintergrund“ / „📖 Guide & background“. Das gibt es seit v42 nicht mehr.
- **B2:** Im Konzept-Kapitel, Abschnitt „Aufbau“, stand „die Eltern legen fest, welche Themen derzeit im Fokus stehen“. Seit v45 wählt die App den Fokus automatisch.
- **B3:** „Einzelheiten stehen im Elternbereich“ / „Details are in the parent area“ stand im Elternbereich selbst.

## Umgesetzt
- Willkommen DE/EN: Verweis auf das heutige Kapitel „📱 Bedienung & Technik“ / „📱 Using the app“. Der endgültige Text (Verweis auf ? und ⚙) kommt mit B2.
- „Aufbau“ (DE): „Den Fokus wählt die App aus den nächsten Schritten der Lehrkraft und der eigenen Übung; Eltern können auf Manuell umstellen.“
- „Lernlogik“ / „How it works“: Satz gestrichen (DE und EN).

## Prüfung
- Neu: `tests/elternbereich-a1.test.mjs` (echte Klicks): Das Willkommen nennt ein Kapitel, das im Elternbereich existiert (DE, und EN über den Quelltext des Willkommens nach Sprachwechsel); der neue Fokus-Satz steht im Konzept-Kapitel; die alten Sätze fehlen (DE/EN).
- Gegenproben (alle rot): App von `main` unverändert; nur EN-Willkommen alt; nur Fokus-Satz alt; nur DE-Satz „Einzelheiten …“ alt; nur EN-Satz „Details …“ alt.
- `npm test`: 248 bestanden.

## Gefunden, nicht geändert
- Das englische Konzept hat **keinen Abschnitt „Aufbau“** (DE: Grundidee, Leitgedanken, Aufbau, Lernlogik …; EN: Idea, Guiding principles, How it works …). Der Fokus wird auf Englisch dort also gar nicht beschrieben. Gehört zu F2 (So funktioniert, Teil 1), wo DE und EN gleich aufgebaut werden (R7).
