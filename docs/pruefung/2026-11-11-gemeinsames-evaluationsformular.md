# Gemeinsames Evaluationsformular – Integrationsauftrag

## Auftrag und Ausgangspunkt

Peter hat am 11.11.2026 die Integration des bereits am echten iPad erprobten Formulars freigegeben. Manuelle Eingabe und KI-Übernahme sollen dieselben Felder, dieselbe Vorschau und denselben Bestätigungsweg verwenden. Feinschliff wird zurückgestellt; falsche Kindzuordnung, Datenverlust und unbelegte Bewertungen sind keine aufschiebbaren Details.

Ausgangsstand: PR #190, Commit `302967e3fa3bfcc921097a052cdb002168a360a6`, iPad-Test 06. Peter hat anhand einer echten Toddle-Evaluation die Übernahme von Titel, Datum, Lernziel, Arbeitsanweisung, Lehrkraft-Rückmeldung und einem Kriterium mit Bewertung bis zur lokalen Bestätigung gezeigt. Das beweist diesen Geräteablauf, nicht die Vollständigkeit jeder Evaluation oder die dauerhafte Big-Quest-Speicherung. Widersprüchliche Warnungen zur bereits belegten Einstufung und zum Datum wurden beobachtet.

## Abgegrenztes Ergebnis

- Einfaches gemeinsames Formular in Big Quest, ausgewähltes Kind sichtbar.
- Manuell ohne KI benutzbar; native KI befüllt denselben Entwurf.
- Originalkriterien und Rückmeldung bleiben erhalten, auch ohne passende Quest.
- Speicherung erst nach Vorschau und ausdrücklicher Bestätigung.
- Bestehende Bewertungen bleiben erhalten; wiederholte Bestätigung erzeugt keinen zweiten Eintrag.
- Vorhandene Übungslogik nur bei unterstützter und bestätigter Zuordnung; keine erfundene Mathe-Zuordnung für ein Englischkriterium.
- Keine Änderung oder Veröffentlichung von Kathies App und keine echten Schuldaten in Testfixtures.

## Technische Grenze des bisherigen Stands

`school_import` bildet einen Gesamtsnapshot ab; ein blindes Ersetzen durch einen Snapshot mit einem neuen Eintrag kann parallele Änderungen verlieren. Der vorhandene Einzelbewertungsweg `school_evaluation` besitzt bereits Kindbindung, Revisionen, Konfliktbehandlung und Rücknahme, war jedoch auf M-N3/M-N5 beschränkt. Die Integration muss additive Einträge mit vollständigen Originalangaben erhalten und den bisherigen Snapshot kompatibel weiterlesen.

## Nachweise für die Integrationsabnahme

1. Manueller Entwurf und KI-befüllter Entwurf durchlaufen denselben Formular-/Speicherweg.
2. Vorschau schreibt noch kein Ereignis; Bestätigung schreibt genau einmal.
3. Neuladen zeigt die Evaluation weiterhin mit Originaltext und Kriterien.
4. Wechsel von Kind oder Elternkonto verhindert Speichern des alten Entwurfs unter dem neuen Kontext.
5. Zwei unabhängige Evaluationen und ältere Importdaten bleiben nach Zusammenführung erhalten.
6. Unbekannte Kriterien werden gespeichert, erzeugen aber keinen vorgetäuschten Übungsfokus.
7. Unterstützte Mathe-Zuordnung wirkt weiterhin auf die bestehende Übungsauswahl.
8. API-Schlüssel bleibt nativ; Toddle-Seite und Formulardaten erhalten keinen Schlüssel.

Automatisierte Fixtures sind synthetisch. Ein tatsächlicher Anthropic-Aufruf und eine echte Toddle-Sitzung werden nicht durch eine Testantwort behauptet. Der abschließende native Gerätedurchlauf erfolgt mit Peter erst nach den automatisierten Prüfungen.

## Verantwortlichkeit und Status

Implementierung: separat laufender ChatGPT-Worker `form_integration`; Integration/Veröffentlichung: Atlas. Keine Behauptung eines Claude-Forge-Laufs. Eigener Git-Worktree `bq-form-integration`. Lauf im Agentarium: `BQ-EVAL-01`, Aufgabe `BQ-EVAL-01-FORM-INTEGRATION`.

Status: in Umsetzung; noch keine Freigabe eines integrierten Builds aus diesem Dokument ableiten.
