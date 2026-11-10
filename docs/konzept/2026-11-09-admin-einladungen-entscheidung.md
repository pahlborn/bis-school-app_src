# Admin-Einladungen - fachliche Zielentscheidung (2026.0013.P1.T1)

## Ausgangslage
- Heute legt der Admin Konten nur ueber `werkzeug/konten.mjs` an.
- Das Rollenbild ist fachlich getrennt: Admin verwaltet Konten und Metadaten, Eltern verwalten Familie und Freigaben, Lehrkraefte kommen nur ueber den Elternfluss an ein Kind.
- Mit `2026.0013` soll die App einen normalen Einladungsweg bekommen, ohne diese Trennung aufzuweichen.

## Entscheidung

### Erlaubte Admin-Einladungen
- **Admin -> Elternteil: ja.**

Zweck dieser Einladung:
- erstes Elternkonto fuer eine neue Familie
- Ersatz- oder Neuanlage eines Elternkontos aus Konten-/Systemgruenden
- neues Erwachsenenkonto ohne Familienbezug nur als vorbereiteter Elternzugang, der spaeter im Elternfluss einer Familie zugeordnet wird

Mindestdaten der Admin-Einladung:
- **Pflicht:** Rolle, Anmeldename
- **Optional:** Anzeigename, Sprache der Einladung

### Ausgeschlossene Admin-Einladungen
- **Admin -> Lehrkraft: nein.**
- **Admin -> Kind: nein.**
- **Admin -> weiterer Admin: nein in der App.** Weitere Admin-Konten bleiben vorerst ein Werkzeugfall auf Peters Auftrag.
- **Admin -> sonstige Erwachsenenrolle: nein in diesem Strang.** Solange es fachlich nur den Admin-Einladungstyp `Elternteil` gibt, entsteht in `2026.0013.P1` kein weiterer Rollenzweig.

## Rollenabgrenzung
- Der Admin legt nur Erwachsene fuer Kontenverwaltung und Systembetrieb an.
- Der Admin legt **keine** Kinder an.
- Der Admin stellt **keinen** Familienbezug her.
- Eltern verwalten den Familienbezug: Kind anlegen, zweiten Elternteil anbinden, Lehrkraft fuer ein Kind einladen.
- Lehrkraefte entstehen nur im Elternfluss und bleiben damit von Anfang an an den Elternentscheid und die spaetere Freigabe gekoppelt.

## Begruendung fuer die Trennung
- Die Einladung einer Lehrkraft ist keine reine Kontenanlage, sondern der Start eines Familien- und Freigabepfads.
- Wuerde der Admin Lehrkraefte einladen, waeren Kontenverwaltung und Familienbezug fachlich vermischt.
- Die saubere Trennung haelt die Verantwortung dort, wo sie hingehoert: Admin fuer Konten und System, Eltern fuer Beziehungen zum Kind.

## Folge fuer den technischen Auftrag
- `2026.0013.P1` baut genau **einen** Admin-Einladungstyp in der App: Erwachsenen-Einladung mit Rolle `Elternteil`.
- Lehrkraft-Einladungen gehoeren komplett in `2026.0013.P2`.
- Einladungen fuer weitere Admins sind nicht Teil dieses Strangs.
